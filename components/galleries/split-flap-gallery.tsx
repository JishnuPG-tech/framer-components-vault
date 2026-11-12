/**
 * Headway — split-flap image board. The picture is cut into a grid of hinged
 * flaps that clatter over to the next image in a chosen wave pattern, while
 * the title spins through letter cells beside a clickable timetable.
 *
 * Marketplace notes
 * 1. Static renderer: the default export calls useIsStaticRenderer() before
 *    anything else and returns <StillBoard/> — plain divs and images at rest
 *    on slide one. No style tag, keyframes, transitions, filters, listeners,
 *    observers, timers or audio exist on that path.
 * 2. Offscreen work: there is no rAF loop. Flips run on finite CSS animations
 *    started only by a user action or the autoplay bar. The autoplay bar and
 *    status dot are paused (animation-play-state) until an IntersectionObserver
 *    reports the component on screen AND the tab is visible, so nothing
 *    advances offscreen. The letter scramble interval only starts while awake
 *    and clears itself once settled. prefers-reduced-motion swaps slides
 *    instantly with no flips or scrambles.
 */
import * as React from "react"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Pattern = "wave" | "rain" | "diagonal" | "bloom" | "scatter"

interface Slide {
    image?: { src?: string } | string
    imageUrl?: string
    title?: string
    caption?: string
    link?: string
}

interface HeadwayProps {
    slides: Slide[]
    layout: "split" | "stack"
    boardSide: "left" | "right"
    boardWidth: number
    stackBelow: number
    gap: number
    padding: number
    background: string
    stageRadius: number

    cols: number
    rows: number
    tileGap: number
    seamWidth: number
    seamTint: string
    flipTime: number
    stagger: number
    pattern: Pattern
    shade: number

    boardFill: string
    boardRadius: number
    boardPad: number
    labelText: string
    labelFont: React.CSSProperties
    labelInk: string

    cellFont: React.CSSProperties
    cellInk: string
    cellFill: string
    cellRadius: number
    cellGap: number
    scramble: number
    fixedWidth: boolean
    captionFlap: boolean
    captionFont: React.CSSProperties
    captionInk: string

    tableOn: boolean
    tableFont: React.CSSProperties
    tableInk: string
    activeInk: string
    activeFill: string
    ruleTint: string

    keysOn: boolean
    keyFill: string
    keyInk: string
    autoplay: boolean
    interval: number
    pauseHover: boolean
    accent: string
    swipeOn: boolean

    soundOn: boolean
    soundLevel: number

    style?: React.CSSProperties
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

/* ─────────────────────────── pure helpers ─────────────────────────── */

function ring(i: number, n: number) {
    return ((i % n) + n) % n
}

function artOf(slide?: Slide): string {
    if (!slide) return ""
    const typed =
        typeof slide.imageUrl === "string" ? slide.imageUrl.trim() : ""
    if (typed) return typed
    const up = slide.image
    if (!up) return ""
    if (typeof up === "string") return up
    return typeof up.src === "string" ? up.src : ""
}

function padTo(text: string, width: number) {
    const up = (text || "").toUpperCase()
    return width > up.length ? up + " ".repeat(width - up.length) : up
}

function longest(list: Slide[], key: "title" | "caption", cap: number) {
    let most = 0
    for (const s of list) most = Math.max(most, (s?.[key] || "").length)
    return Math.min(cap, most)
}

function twoDigit(v: number) {
    return v < 10 ? "0" + v : String(v)
}

function noise(c: number, r: number, seed: number) {
    const v = Math.sin(c * 12.9898 + r * 78.233 + seed * 3.17) * 43758.5453
    return v - Math.floor(v)
}

function tileOrder(
    c: number,
    r: number,
    cols: number,
    rows: number,
    pattern: Pattern,
    dir: number,
    seed: number
) {
    const cc = dir < 0 ? cols - 1 - c : c
    const rr = dir < 0 ? rows - 1 - r : r
    if (pattern === "rain") return rr + cc * 0.15
    if (pattern === "diagonal") return cc + rr
    if (pattern === "bloom")
        return Math.abs(c - (cols - 1) / 2) + Math.abs(r - (rows - 1) / 2)
    if (pattern === "scatter")
        return noise(c, r, seed) * (cols + rows - 1) * 0.7
    return cc + rr * 0.15
}

function halfFrame(part: "top" | "bottom"): React.CSSProperties {
    return {
        position: "absolute",
        left: 0,
        right: 0,
        top: part === "top" ? 0 : "50%",
        height: "50%",
        overflow: "hidden",
    }
}

function sliceFit(
    c: number,
    r: number,
    cols: number,
    rows: number,
    part: "top" | "bottom"
): React.CSSProperties {
    return {
        position: "absolute",
        left: -c * 100 + "%",
        top: -(r * 2 + (part === "bottom" ? 1 : 0)) * 100 + "%",
        width: cols * 100 + "%",
        height: rows * 200 + "%",
        maxWidth: "none",
        objectFit: "cover",
        display: "block",
        pointerEvents: "none",
    }
}

function counts(p: HeadwayProps) {
    return {
        cols: Math.max(1, Math.min(10, Math.round(p.cols))),
        rows: Math.max(1, Math.min(6, Math.round(p.rows))),
    }
}

/* ───────────────────────── static (canvas / export) ───────────────────────── */

function StillBoard(props: HeadwayProps) {
    const p = props
    const deck = p.slides && p.slides.length ? p.slides : []
    const span = deck.length
    const first = deck[0]
    const art = artOf(first)
    const { cols, rows } = counts(p)
    const stacked = p.layout === "stack"

    const titleWidth = p.fixedWidth ? longest(deck, "title", 18) : 0
    const capWidth = p.fixedWidth ? longest(deck, "caption", 28) : 0

    const tiles: React.ReactNode[] = []
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            tiles.push(
                <div
                    key={c + "-" + r}
                    style={{
                        position: "absolute",
                        left: (c * 100) / cols + "%",
                        top: (r * 100) / rows + "%",
                        width: 100 / cols + "%",
                        height: 100 / rows + "%",
                    }}
                >
                    {(["top", "bottom"] as const).map((part) => (
                        <div key={part} style={halfFrame(part)}>
                            {art ? (
                                <img
                                    src={art}
                                    alt=""
                                    draggable={false}
                                    style={sliceFit(c, r, cols, rows, part)}
                                />
                            ) : null}
                        </div>
                    ))}
                </div>
            )
        }
    }

    const lines: React.ReactNode[] = []
    for (let c = 1; c < cols; c++) {
        lines.push(
            <div
                key={"v" + c}
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left:
                        "calc(" +
                        (c * 100) / cols +
                        "% - " +
                        p.tileGap / 2 +
                        "px)",
                    width: p.tileGap,
                    background: p.background,
                }}
            />
        )
    }
    for (let r = 1; r < rows; r++) {
        lines.push(
            <div
                key={"h" + r}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top:
                        "calc(" +
                        (r * 100) / rows +
                        "% - " +
                        p.tileGap / 2 +
                        "px)",
                    height: p.tileGap,
                    background: p.background,
                }}
            />
        )
    }
    for (let r = 0; r < rows; r++) {
        lines.push(
            <div
                key={"s" + r}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top:
                        "calc(" +
                        ((r + 0.5) * 100) / rows +
                        "% - " +
                        p.seamWidth / 2 +
                        "px)",
                    height: p.seamWidth,
                    background: p.seamTint,
                }}
            />
        )
    }

    const cells = (text: string, width: number, font: React.CSSProperties) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: p.cellGap }}>
            {padTo(text, width)
                .split("")
                .map((ch, i) => (
                    <span
                        key={i}
                        style={{
                            ...font,
                            position: "relative",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "1.1em",
                            padding: "0.32em 0.16em",
                            lineHeight: 1,
                            color: p.cellInk,
                            borderRadius: p.cellRadius,
                            background:
                                "linear-gradient(to bottom, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.12) 50%), " +
                                p.cellFill,
                            overflow: "hidden",
                        }}
                    >
                        {ch === " " ? "\u00A0" : ch}
                        <span
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: "50%",
                                height: 1,
                                background: "rgba(0,0,0,0.55)",
                            }}
                        />
                    </span>
                ))}
        </div>
    )

    const key = (flip: boolean) => (
        <div
            style={{
                width: 42,
                height: 42,
                borderRadius: p.cellRadius + 4,
                background: p.keyFill,
                color: p.keyInk,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 3px 0 rgba(0,0,0,0.45)",
            }}
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d={flip ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    )

    const head = (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: 6,
                        background: p.accent,
                    }}
                />
                <span style={{ ...p.labelFont, color: p.labelInk }}>
                    {p.labelText}
                </span>
            </div>
            {cells(first?.title || "", titleWidth, p.cellFont)}
            {p.captionFlap ? (
                cells(first?.caption || "", capWidth, p.captionFont)
            ) : (
                <div style={{ ...p.captionFont, color: p.captionInk }}>
                    {first?.caption || ""}
                </div>
            )}
        </div>
    )

    const keys = p.keysOn ? (
        <div style={{ display: "flex", gap: 10 }}>
            {key(true)}
            {key(false)}
        </div>
    ) : null

    const track = p.autoplay ? (
        <div
            style={{
                height: 2,
                width: "100%",
                background: "rgba(128,128,128,0.22)",
                borderRadius: 2,
            }}
        />
    ) : null

    const table =
        !stacked && p.tableOn ? (
            <div
                style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    overflow: "hidden",
                    borderTop: "1px solid " + p.ruleTint,
                }}
            >
                {deck.map((s, i) => {
                    const on = i === 0
                    return (
                        <div
                            key={i}
                            style={{
                                ...p.tableFont,
                                display: "grid",
                                gridTemplateColumns: "auto minmax(0,1fr) auto",
                                gap: 14,
                                alignItems: "center",
                                padding: "10px 12px",
                                borderBottom: "1px solid " + p.ruleTint,
                                background: on ? p.activeFill : "transparent",
                                color: on ? p.activeInk : p.tableInk,
                            }}
                        >
                            <span style={{ opacity: on ? 1 : 0.55 }}>
                                {twoDigit(i + 1)}
                            </span>
                            <span
                                style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {s?.title || ""}
                            </span>
                            <span
                                style={{
                                    opacity: 0.6,
                                    whiteSpace: "nowrap",
                                    maxWidth: 140,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {s?.caption || ""}
                            </span>
                        </div>
                    )
                })}
            </div>
        ) : null

    return (
        <div
            style={{
                ...p.style,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: p.padding,
                background: p.background,
                display: "flex",
                flexDirection: stacked
                    ? "column"
                    : p.boardSide === "left"
                      ? "row-reverse"
                      : "row",
                gap: p.gap,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "relative",
                    flex: "1 1 0",
                    minWidth: 0,
                    minHeight: 0,
                    borderRadius: p.stageRadius,
                    overflow: "hidden",
                    background: span ? "rgba(128,128,128,0.18)" : "transparent",
                }}
            >
                {tiles}
                {lines}
            </div>
            {span ? (
                <div
                    style={{
                        flex: stacked
                            ? "0 0 auto"
                            : "0 0 " + p.boardWidth + "px",
                        width: stacked ? "100%" : p.boardWidth,
                        boxSizing: "border-box",
                        background: p.boardFill,
                        borderRadius: p.boardRadius,
                        padding: p.boardPad,
                        display: "flex",
                        flexDirection: "column",
                        gap: 18,
                        minHeight: 0,
                    }}
                >
                    {stacked ? (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "space-between",
                                gap: 20,
                                flexWrap: "wrap",
                            }}
                        >
                            {head}
                            {keys}
                        </div>
                    ) : (
                        <>
                            {head}
                            {table}
                            {keys}
                        </>
                    )}
                    {track}
                </div>
            ) : null}
        </div>
    )
}

/* ───────────────────────────── live (preview / site) ───────────────────────────── */

function FlapLine(props: {
    text: string
    width: number
    steps: number
    stepMs: number
    animate: boolean
    font: React.CSSProperties
    ink: string
    fill: string
    radius: number
    gap: number
    scope: string
}) {
    const {
        text,
        width,
        steps,
        stepMs,
        animate,
        font,
        ink,
        fill,
        radius,
        gap,
        scope,
    } = props
    const target = useMemo(() => padTo(text, width), [text, width])
    const [shown, setShown] = useState(target)

    useEffect(() => {
        if (!animate || steps <= 0) {
            setShown(target)
            return
        }
        let tick = 0
        const id = window.setInterval(() => {
            tick++
            let settled = true
            const next = target
                .split("")
                .map((ch, i) => {
                    if (ch === " ") return " "
                    if (tick >= steps + i) return ch
                    settled = false
                    return LETTERS[(Math.random() * LETTERS.length) | 0]
                })
                .join("")
            setShown(next)
            if (settled) window.clearInterval(id)
        }, stepMs)
        return () => window.clearInterval(id)
    }, [target, animate, steps, stepMs])

    return (
        <div
            aria-hidden="true"
            style={{ display: "flex", flexWrap: "wrap", gap }}
        >
            {target.split("").map((_, i) => {
                const ch = shown[i] ?? " "
                return (
                    <span
                        key={i}
                        style={{
                            ...font,
                            position: "relative",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "1.1em",
                            padding: "0.32em 0.16em",
                            lineHeight: 1,
                            color: ink,
                            borderRadius: radius,
                            background:
                                "linear-gradient(to bottom, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.12) 50%), " +
                                fill,
                            overflow: "hidden",
                            perspective: 200,
                        }}
                    >
                        <span
                            key={ch}
                            className={animate ? scope + "-clack" : undefined}
                            style={{ display: "block" }}
                        >
                            {ch === " " ? "\u00A0" : ch}
                        </span>
                        <span
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: "50%",
                                height: 1,
                                background: "rgba(0,0,0,0.55)",
                            }}
                        />
                    </span>
                )
            })}
        </div>
    )
}

interface Flip {
    cur: number
    next: number | null
    dir: number
    run: number
}

function LiveBoard(props: HeadwayProps) {
    const p = props
    const scope = "hw" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const deck = useMemo(
        () => (p.slides && p.slides.length ? p.slides : []),
        [p.slides]
    )
    const span = deck.length
    const { cols, rows } = counts(p)

    const live = useRef(p)
    live.current = p

    const rootRef = useRef<HTMLDivElement | null>(null)
    const tableRef = useRef<HTMLDivElement | null>(null)
    const rowRefs = useRef<Array<HTMLDivElement | null>>([])

    const [flip, setFlip] = useState<Flip>({
        cur: 0,
        next: null,
        dir: 1,
        run: 0,
    })
    const flipRef = useRef(flip)
    flipRef.current = flip
    const pending = useRef<{ to: number; dir: number } | null>(null)
    const totalRef = useRef(0)

    const [awake, setAwake] = useState(false)
    const [calm, setCalm] = useState(false)
    const [hovering, setHovering] = useState(false)
    const [rootW, setRootW] = useState(0)

    const grab = useRef<{ x: number; y: number; on: boolean }>({
        x: 0,
        y: 0,
        on: false,
    })
    const audio = useRef<{
        ctx: AudioContext | null
        grain: AudioBuffer | null
    }>({
        ctx: null,
        grain: null,
    })

    /* visibility, tab state, reduced motion */
    useEffect(() => {
        const node = rootRef.current
        if (!node) return
        let seen = true
        let open =
            typeof document === "undefined" ||
            document.visibilityState !== "hidden"
        const media =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        setCalm(!!media?.matches)

        const sync = () => setAwake(seen && open)

        let watcher: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            seen = false
            watcher = new IntersectionObserver(
                (entries) => {
                    seen = entries.some((e) => e.isIntersecting)
                    sync()
                },
                { threshold: 0.05 }
            )
            watcher.observe(node)
        }
        const onTab = () => {
            open = document.visibilityState !== "hidden"
            sync()
        }
        const onCalm = (e: MediaQueryListEvent) => setCalm(e.matches)
        document.addEventListener("visibilitychange", onTab)
        media?.addEventListener?.("change", onCalm)
        sync()
        return () => {
            watcher?.disconnect()
            document.removeEventListener("visibilitychange", onTab)
            media?.removeEventListener?.("change", onCalm)
        }
    }, [])

    /* width for responsive stacking */
    useEffect(() => {
        const node = rootRef.current
        if (!node) return
        const read = () => setRootW(node.clientWidth)
        read()
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", read)
            return () => window.removeEventListener("resize", read)
        }
        const sizer = new ResizeObserver(read)
        sizer.observe(node)
        return () => sizer.disconnect()
    }, [])

    /* sound */
    const arm = useCallback(() => {
        if (!live.current.soundOn || audio.current.ctx) return
        try {
            const Maker =
                (window as any).AudioContext ||
                (window as any).webkitAudioContext
            if (!Maker) return
            const ctx: AudioContext = new Maker()
            const len = Math.floor(ctx.sampleRate * 0.05)
            const grain = ctx.createBuffer(1, len, ctx.sampleRate)
            const data = grain.getChannelData(0)
            for (let i = 0; i < len; i++) {
                const env = Math.pow(1 - i / len, 3)
                data[i] = (Math.random() * 2 - 1) * env
            }
            audio.current = { ctx, grain }
            if (ctx.state === "suspended") ctx.resume().catch(() => {})
        } catch {}
    }, [])

    const clatter = useCallback((offsets: number[]) => {
        const q = live.current
        const { ctx, grain } = audio.current
        if (!q.soundOn || !ctx || !grain || ctx.state !== "running") return
        const now = ctx.currentTime
        offsets.forEach((ms, i) => {
            try {
                const src = ctx.createBufferSource()
                src.buffer = grain
                src.playbackRate.value = 0.9 + Math.random() * 0.35
                const band = ctx.createBiquadFilter()
                band.type = "bandpass"
                band.frequency.value = 2200 + (i % 3) * 500
                band.Q.value = 2.5
                const amp = ctx.createGain()
                amp.gain.value = Math.max(0, Math.min(1, q.soundLevel)) * 0.8
                src.connect(band)
                band.connect(amp)
                amp.connect(ctx.destination)
                src.start(now + ms / 1000)
            } catch {}
        })
    }, [])

    useEffect(() => {
        return () => {
            const ctx = audio.current.ctx
            audio.current = { ctx: null, grain: null }
            ctx?.close().catch(() => {})
        }
    }, [])

    /* flipping */
    const go = useCallback(
        (target: number, dir: number) => {
            const q = live.current
            const n = q.slides?.length || 0
            if (n < 2) return
            const to = ring(target, n)
            const state = flipRef.current
            if (state.next !== null) {
                pending.current = { to, dir }
                return
            }
            if (to === state.cur) return

            if (calm) {
                setFlip({ cur: to, next: null, dir, run: state.run + 1 })
                return
            }

            const { cols: cc, rows: rr } = counts(q)
            const seed = state.run + 1
            let most = 0
            const marks: number[] = []
            for (let r = 0; r < rr; r++)
                for (let c = 0; c < cc; c++) {
                    const o = tileOrder(c, r, cc, rr, q.pattern, dir, seed)
                    most = Math.max(most, o)
                    marks.push(Math.round(o * q.stagger))
                }
            totalRef.current = most * q.stagger + q.flipTime
            const unique = Array.from(new Set(marks))
                .sort((a, b) => a - b)
                .slice(0, 10)
            const half = q.flipTime / 2
            clatter(unique.concat(unique.slice(0, 6).map((m) => m + half)))

            setFlip({ cur: state.cur, next: to, dir, run: seed })
        },
        [calm, clatter]
    )

    useEffect(() => {
        if (flip.next === null) return
        const t = window.setTimeout(() => {
            const state = flipRef.current
            if (state.next === null) return
            const settled = {
                cur: state.next,
                next: null,
                dir: state.dir,
                run: state.run,
            }
            flipRef.current = settled
            setFlip(settled)
            const queued = pending.current
            pending.current = null
            if (queued && queued.to !== settled.cur) {
                window.setTimeout(() => go(queued.to, queued.dir), 16)
            }
        }, totalRef.current + 40)
        return () => window.clearTimeout(t)
    }, [flip.run, flip.next, go])

    /* preload neighbours */
    useEffect(() => {
        if (span < 2 || typeof Image === "undefined") return
        ;[flip.cur + 1, flip.cur - 1].forEach((i) => {
            const src = artOf(deck[ring(i, span)])
            if (src) {
                const img = new Image()
                img.src = src
            }
        })
    }, [flip.cur, deck, span])

    const shownIndex = span ? ring(flip.next ?? flip.cur, span) : 0
    const shown = deck[shownIndex]

    /* keep active timetable row in view without scrolling the page */
    useEffect(() => {
        const box = tableRef.current
        const row = rowRefs.current[shownIndex]
        if (!box || !row) return
        const top = row.offsetTop - box.offsetTop
        if (top < box.scrollTop) box.scrollTop = top
        else if (top + row.offsetHeight > box.scrollTop + box.clientHeight)
            box.scrollTop = top + row.offsetHeight - box.clientHeight
    }, [shownIndex])

    if (!span) {
        return (
            <div
                ref={rootRef}
                style={{
                    ...p.style,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: p.background,
                    color: p.tableInk,
                    ...p.tableFont,
                }}
            >
                Add slides in the property panel
            </div>
        )
    }

    const stacked = p.layout === "stack" || (rootW > 0 && rootW < p.stackBelow)
    const flipping = flip.next !== null
    const forward = flip.dir >= 0
    const curArt = artOf(deck[ring(flip.cur, span)])
    const nextArt = flipping
        ? artOf(deck[ring(flip.next as number, span)])
        : curArt
    const half = Math.max(60, p.flipTime / 2)
    const lettersLive = awake && !calm
    const running = awake && !flipping && !(p.pauseHover && hovering)

    const titleWidth = p.fixedWidth ? longest(deck, "title", 18) : 0
    const capWidth = p.fixedWidth ? longest(deck, "caption", 28) : 0

    const picture = (
        src: string,
        c: number,
        r: number,
        part: "top" | "bottom"
    ) =>
        src ? (
            <img
                src={src}
                alt=""
                draggable={false}
                style={sliceFit(c, r, cols, rows, part)}
            />
        ) : null

    const tiles: React.ReactNode[] = []
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const delay = flipping
                ? tileOrder(c, r, cols, rows, p.pattern, flip.dir, flip.run) *
                  p.stagger
                : 0
            const topStill = flipping && forward ? nextArt : curArt
            const lowStill = flipping && !forward ? nextArt : curArt

            let leaves: React.ReactNode = null
            if (flipping) {
                const firstPart: "top" | "bottom" = forward ? "top" : "bottom"
                const secondPart: "top" | "bottom" = forward ? "bottom" : "top"
                const firstName = forward ? "-fall" : "-rise"
                const secondName = forward ? "-land" : "-drop"
                leaves = (
                    <>
                        <div
                            key={"a" + flip.run}
                            style={{
                                ...halfFrame(firstPart),
                                zIndex: 3,
                                transformOrigin:
                                    firstPart === "top" ? "50% 100%" : "50% 0%",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                animation:
                                    scope +
                                    firstName +
                                    " " +
                                    half +
                                    "ms cubic-bezier(0.55,0.05,0.9,0.45) " +
                                    delay +
                                    "ms both",
                            }}
                        >
                            {picture(curArt, c, r, firstPart)}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "rgba(0,0,0," + p.shade + ")",
                                    animation:
                                        scope +
                                        "-dim " +
                                        half +
                                        "ms linear " +
                                        delay +
                                        "ms both",
                                }}
                            />
                        </div>
                        <div
                            key={"b" + flip.run}
                            style={{
                                ...halfFrame(secondPart),
                                zIndex: 4,
                                transformOrigin:
                                    secondPart === "top"
                                        ? "50% 100%"
                                        : "50% 0%",
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                animation:
                                    scope +
                                    secondName +
                                    " " +
                                    half +
                                    "ms cubic-bezier(0.2,0.9,0.3,1.3) " +
                                    (delay + half) +
                                    "ms both",
                            }}
                        >
                            {picture(nextArt, c, r, secondPart)}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: "rgba(0,0,0," + p.shade + ")",
                                    animation:
                                        scope +
                                        "-lift " +
                                        half +
                                        "ms linear " +
                                        (delay + half) +
                                        "ms both",
                                }}
                            />
                        </div>
                    </>
                )
            }

            tiles.push(
                <div
                    key={c + "-" + r}
                    style={{
                        position: "absolute",
                        left: (c * 100) / cols + "%",
                        top: (r * 100) / rows + "%",
                        width: 100 / cols + "%",
                        height: 100 / rows + "%",
                        perspective: 1100,
                    }}
                >
                    <div style={halfFrame("top")}>
                        {picture(topStill, c, r, "top")}
                    </div>
                    <div style={halfFrame("bottom")}>
                        {picture(lowStill, c, r, "bottom")}
                    </div>
                    {leaves}
                </div>
            )
        }
    }

    const lines: React.ReactNode[] = []
    for (let c = 1; c < cols; c++) {
        lines.push(
            <div
                key={"v" + c}
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left:
                        "calc(" +
                        (c * 100) / cols +
                        "% - " +
                        p.tileGap / 2 +
                        "px)",
                    width: p.tileGap,
                    background: p.background,
                    zIndex: 20,
                }}
            />
        )
    }
    for (let r = 1; r < rows; r++) {
        lines.push(
            <div
                key={"h" + r}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top:
                        "calc(" +
                        (r * 100) / rows +
                        "% - " +
                        p.tileGap / 2 +
                        "px)",
                    height: p.tileGap,
                    background: p.background,
                    zIndex: 20,
                }}
            />
        )
    }
    for (let r = 0; r < rows; r++) {
        lines.push(
            <div
                key={"s" + r}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top:
                        "calc(" +
                        ((r + 0.5) * 100) / rows +
                        "% - " +
                        p.seamWidth / 2 +
                        "px)",
                    height: p.seamWidth,
                    background: p.seamTint,
                    zIndex: 20,
                    pointerEvents: "none",
                }}
            />
        )
    }

    const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
        arm()
        if (e.pointerType === "mouse" && e.button !== 0) return
        grab.current = { x: e.clientX, y: e.clientY, on: true }
    }
    const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const g = grab.current
        if (!g.on) return
        g.on = false
        const dx = e.clientX - g.x
        const dy = e.clientY - g.y
        if (p.swipeOn && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            go(shownIndex + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1)
            return
        }
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
            const href = shown?.link
            if (href) window.open(href, "_blank", "noopener,noreferrer")
        }
    }

    const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault()
            arm()
            go(shownIndex + 1, 1)
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault()
            arm()
            go(shownIndex - 1, -1)
        }
    }

    const key = (back: boolean) => (
        <button
            type="button"
            aria-label={back ? "Previous slide" : "Next slide"}
            className={scope + "-key"}
            onClick={() => {
                arm()
                go(shownIndex + (back ? -1 : 1), back ? -1 : 1)
            }}
            style={{
                width: 42,
                height: 42,
                padding: 0,
                border: "none",
                cursor: "pointer",
                borderRadius: p.cellRadius + 4,
                background: p.keyFill,
                color: p.keyInk,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 3px 0 rgba(0,0,0,0.45)",
            }}
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                    d={back ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )

    const head = (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minWidth: 0,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                    className={scope + "-pulse"}
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: 6,
                        background: p.accent,
                        animationPlayState:
                            awake && !calm ? "running" : "paused",
                    }}
                />
                <span style={{ ...p.labelFont, color: p.labelInk }}>
                    {p.labelText}
                </span>
            </div>
            <span
                aria-live="polite"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                }}
            >
                {(shown?.title || "") +
                    (shown?.caption ? ", " + shown.caption : "")}
            </span>
            <FlapLine
                text={shown?.title || ""}
                width={titleWidth}
                steps={p.scramble}
                stepMs={55}
                animate={lettersLive}
                font={p.cellFont}
                ink={p.cellInk}
                fill={p.cellFill}
                radius={p.cellRadius}
                gap={p.cellGap}
                scope={scope}
            />
            {p.captionFlap ? (
                <FlapLine
                    text={shown?.caption || ""}
                    width={capWidth}
                    steps={Math.max(0, p.scramble - 2)}
                    stepMs={45}
                    animate={lettersLive}
                    font={p.captionFont}
                    ink={p.cellInk}
                    fill={p.cellFill}
                    radius={p.cellRadius}
                    gap={p.cellGap}
                    scope={scope}
                />
            ) : (
                <div
                    key={"cap" + shownIndex}
                    aria-hidden="true"
                    className={lettersLive ? scope + "-fade" : undefined}
                    style={{ ...p.captionFont, color: p.captionInk }}
                >
                    {shown?.caption || ""}
                </div>
            )}
        </div>
    )

    const keys = p.keysOn ? (
        <div style={{ display: "flex", gap: 10, flex: "0 0 auto" }}>
            {key(true)}
            {key(false)}
        </div>
    ) : null

    const track = p.autoplay ? (
        <div
            style={{
                height: 2,
                width: "100%",
                background: "rgba(128,128,128,0.22)",
                borderRadius: 2,
                overflow: "hidden",
                flex: "0 0 auto",
            }}
        >
            <div
                key={"bar" + flip.cur + "-" + flip.run}
                className={scope + "-bar"}
                onAnimationEnd={() => go(flipRef.current.cur + 1, 1)}
                style={{
                    height: "100%",
                    width: "100%",
                    background: p.accent,
                    transformOrigin: "0 50%",
                    animationDuration: Math.max(1, p.interval) + "s",
                    animationPlayState:
                        running && span > 1 ? "running" : "paused",
                }}
            />
        </div>
    ) : null

    const table =
        !stacked && p.tableOn ? (
            <div
                ref={tableRef}
                style={{
                    position: "relative",
                    flex: "1 1 auto",
                    minHeight: 0,
                    overflowY: "auto",
                    borderTop: "1px solid " + p.ruleTint,
                    scrollbarWidth: "none",
                }}
            >
                {deck.map((s, i) => {
                    const on = i === shownIndex
                    return (
                        <div
                            key={i}
                            ref={(node) => {
                                rowRefs.current[i] = node
                            }}
                            role="button"
                            tabIndex={-1}
                            aria-current={on ? "true" : undefined}
                            className={scope + "-row"}
                            onClick={() => {
                                arm()
                                if (i !== shownIndex)
                                    go(i, i > shownIndex ? 1 : -1)
                            }}
                            style={{
                                ...p.tableFont,
                                display: "grid",
                                gridTemplateColumns: "auto minmax(0,1fr) auto",
                                gap: 14,
                                alignItems: "center",
                                padding: "10px 12px",
                                cursor: "pointer",
                                borderBottom: "1px solid " + p.ruleTint,
                                background: on ? p.activeFill : "transparent",
                                color: on ? p.activeInk : p.tableInk,
                                transition:
                                    "background 260ms ease, color 260ms ease",
                            }}
                        >
                            <span style={{ opacity: on ? 1 : 0.55 }}>
                                {twoDigit(i + 1)}
                            </span>
                            <span
                                style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {s?.title || ""}
                            </span>
                            <span
                                style={{
                                    opacity: 0.6,
                                    whiteSpace: "nowrap",
                                    maxWidth: 140,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {s?.caption || ""}
                            </span>
                        </div>
                    )
                })}
            </div>
        ) : null

    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Image board"
            tabIndex={0}
            onKeyDown={onKey}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            style={{
                ...p.style,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: p.padding,
                background: p.background,
                display: "flex",
                flexDirection: stacked
                    ? "column"
                    : p.boardSide === "left"
                      ? "row-reverse"
                      : "row",
                gap: p.gap,
                overflow: "hidden",
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <style>{`
                @keyframes ${scope}-fall { from { transform: rotateX(0deg); } to { transform: rotateX(-90deg); } }
                @keyframes ${scope}-land { from { transform: rotateX(90deg); } to { transform: rotateX(0deg); } }
                @keyframes ${scope}-rise { from { transform: rotateX(0deg); } to { transform: rotateX(90deg); } }
                @keyframes ${scope}-drop { from { transform: rotateX(-90deg); } to { transform: rotateX(0deg); } }
                @keyframes ${scope}-dim  { from { opacity: 0; } to { opacity: 1; } }
                @keyframes ${scope}-lift { from { opacity: 1; } to { opacity: 0; } }
                @keyframes ${scope}-tick { from { transform: rotateX(75deg); opacity: 0.35; } to { transform: rotateX(0deg); opacity: 1; } }
                @keyframes ${scope}-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
                @keyframes ${scope}-beat { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
                @keyframes ${scope}-show { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
                .${scope}-clack { animation: ${scope}-tick 90ms ease-out both; transform-origin: 50% 50%; }
                .${scope}-bar { animation-name: ${scope}-grow; animation-timing-function: linear; animation-fill-mode: both; }
                .${scope}-pulse { animation: ${scope}-beat 1.6s ease-in-out infinite; }
                .${scope}-fade { animation: ${scope}-show 420ms cubic-bezier(0.2,0.8,0.2,1) both; }
                .${scope}-key { transition: transform 90ms ease, box-shadow 90ms ease, filter 160ms ease; }
                .${scope}-key:hover { filter: brightness(1.15); }
                .${scope}-key:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,0.45) !important; }
                .${scope}-row:hover { filter: brightness(1.2); }
                .${scope}-stage img { -webkit-user-drag: none; }
                @media (prefers-reduced-motion: reduce) {
                    .${scope}-clack, .${scope}-fade, .${scope}-pulse { animation: none; }
                }
            `}</style>

            <div
                className={scope + "-stage"}
                onPointerDown={onDown}
                onPointerUp={onUp}
                onPointerCancel={() => {
                    grab.current.on = false
                }}
                onDragStart={(e) => e.preventDefault()}
                style={{
                    position: "relative",
                    flex: "1 1 0",
                    minWidth: 0,
                    minHeight: 0,
                    borderRadius: p.stageRadius,
                    overflow: "hidden",
                    background: "rgba(128,128,128,0.18)",
                    touchAction: "pan-y",
                    cursor: shown?.link
                        ? "pointer"
                        : p.swipeOn
                          ? "grab"
                          : "default",
                }}
            >
                {tiles}
                {lines}
            </div>

            <div
                style={{
                    flex: stacked ? "0 0 auto" : "0 0 " + p.boardWidth + "px",
                    width: stacked ? "100%" : p.boardWidth,
                    boxSizing: "border-box",
                    background: p.boardFill,
                    borderRadius: p.boardRadius,
                    padding: p.boardPad,
                    display: "flex",
                    flexDirection: "column",
                    gap: 18,
                    minHeight: 0,
                    position: "relative",
                }}
            >
                {stacked ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            gap: 20,
                            flexWrap: "wrap",
                        }}
                    >
                        {head}
                        {keys}
                    </div>
                ) : (
                    <>
                        {head}
                        {table}
                        {keys}
                    </>
                )}
                {track}
            </div>
        </div>
    )
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 640
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Headway(props: HeadwayProps) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillBoard {...props} />
    return <LiveBoard {...props} />
}

const blankSlide = {
    image: "",
    imageUrl: "",
    title: "Title",
    caption: "Short caption",
    link: "",
}

const noTable = (p: HeadwayProps) => p.layout === "stack" || !p.tableOn

addPropertyControls(Headway, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            title: "Slide",
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    defaultValue: "",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "Short caption",
                },
                link: { type: ControlType.Link, title: "CMS Link" },
            },
        },
        defaultValue: [
            { ...blankSlide, title: "Lintel", caption: "Stone Door Studies" },
            { ...blankSlide, title: "Cinder", caption: "After Fire Frames" },
            { ...blankSlide, title: "Drumlin", caption: "Low Hill Walks" },
            {
                ...blankSlide,
                title: "Gossamer",
                caption: "Thin Veil Portraits",
            },
            { ...blankSlide, title: "Halyard", caption: "Rope and Sail" },
            { ...blankSlide, title: "Isthmus", caption: "Narrow Land Notes" },
            { ...blankSlide, title: "Juniper", caption: "Winter Shrub Light" },
            { ...blankSlide, title: "Moraine", caption: "Glacier Edge Views" },
        ],
    },

    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["split", "stack"],
        optionTitles: ["Board Beside", "Board Below"],
        displaySegmentedControl: true,
        defaultValue: "split",
    },
    boardSide: {
        type: ControlType.Enum,
        title: "Board Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "right",
        hidden: (p: HeadwayProps) => p.layout === "stack",
    },
    boardWidth: {
        type: ControlType.Number,
        title: "Board Width",
        min: 240,
        max: 600,
        step: 10,
        unit: "px",
        defaultValue: 380,
        hidden: (p: HeadwayProps) => p.layout === "stack",
    },
    stackBelow: {
        type: ControlType.Number,
        title: "Stack Under",
        min: 0,
        max: 1400,
        step: 10,
        unit: "px",
        defaultValue: 820,
        hidden: (p: HeadwayProps) => p.layout === "stack",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 16,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0B0C",
    },
    stageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 14,
    },

    cols: {
        type: ControlType.Number,
        title: "Flap Columns",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 6,
    },
    rows: {
        type: ControlType.Number,
        title: "Flap Rows",
        min: 1,
        max: 6,
        step: 1,
        defaultValue: 2,
    },
    tileGap: {
        type: ControlType.Number,
        title: "Flap Gap",
        min: 0,
        max: 16,
        step: 1,
        unit: "px",
        defaultValue: 3,
    },
    seamWidth: {
        type: ControlType.Number,
        title: "Hinge Line",
        min: 0,
        max: 6,
        step: 0.5,
        unit: "px",
        defaultValue: 1.5,
    },
    seamTint: {
        type: ControlType.Color,
        title: "Hinge Color",
        defaultValue: "rgba(0,0,0,0.6)",
    },
    pattern: {
        type: ControlType.Enum,
        title: "Flip Pattern",
        options: ["wave", "rain", "diagonal", "bloom", "scatter"],
        optionTitles: ["Wave", "Rain", "Diagonal", "Bloom", "Scatter"],
        defaultValue: "diagonal",
    },
    flipTime: {
        type: ControlType.Number,
        title: "Flip Time",
        min: 200,
        max: 1600,
        step: 20,
        unit: "ms",
        defaultValue: 560,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 200,
        step: 5,
        unit: "ms",
        defaultValue: 55,
    },
    shade: {
        type: ControlType.Number,
        title: "Flap Shade",
        min: 0,
        max: 0.9,
        step: 0.05,
        defaultValue: 0.45,
    },

    boardFill: {
        type: ControlType.Color,
        title: "Board Fill",
        defaultValue: "#151517",
    },
    boardRadius: {
        type: ControlType.Number,
        title: "Board Radius",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 14,
    },
    boardPad: {
        type: ControlType.Number,
        title: "Board Padding",
        min: 8,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 22,
    },
    labelText: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Now Showing",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 11,
            lineHeight: "1.2em",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
        },
    },
    labelInk: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "rgba(242,237,228,0.55)",
    },

    cellFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 22,
            letterSpacing: "0em",
        },
    },
    cellInk: {
        type: ControlType.Color,
        title: "Letter Color",
        defaultValue: "#F2EDE4",
    },
    cellFill: {
        type: ControlType.Color,
        title: "Cell Fill",
        defaultValue: "#232326",
    },
    cellRadius: {
        type: ControlType.Number,
        title: "Cell Radius",
        min: 0,
        max: 12,
        step: 1,
        unit: "px",
        defaultValue: 4,
    },
    cellGap: {
        type: ControlType.Number,
        title: "Cell Gap",
        min: 0,
        max: 12,
        step: 1,
        unit: "px",
        defaultValue: 3,
    },
    scramble: {
        type: ControlType.Number,
        title: "Letter Spins",
        min: 0,
        max: 16,
        step: 1,
        defaultValue: 7,
    },
    fixedWidth: {
        type: ControlType.Boolean,
        title: "Fixed Cells",
        defaultValue: true,
    },
    captionFlap: {
        type: ControlType.Boolean,
        title: "Caption Cells",
        defaultValue: false,
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 13,
            lineHeight: "1.5em",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
        },
    },
    captionInk: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "rgba(242,237,228,0.7)",
        hidden: (p: HeadwayProps) => p.captionFlap,
    },

    tableOn: {
        type: ControlType.Boolean,
        title: "Timetable",
        defaultValue: true,
        hidden: (p: HeadwayProps) => p.layout === "stack",
    },
    tableFont: {
        type: ControlType.Font,
        title: "Table Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 12,
            lineHeight: "1.3em",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
        },
        hidden: noTable,
    },
    tableInk: {
        type: ControlType.Color,
        title: "Table Color",
        defaultValue: "rgba(242,237,228,0.78)",
        hidden: noTable,
    },
    activeFill: {
        type: ControlType.Color,
        title: "Active Fill",
        defaultValue: "#F2B33D",
        hidden: noTable,
    },
    activeInk: {
        type: ControlType.Color,
        title: "Active Ink",
        defaultValue: "#111111",
        hidden: noTable,
    },
    ruleTint: {
        type: ControlType.Color,
        title: "Rule Color",
        defaultValue: "rgba(242,237,228,0.08)",
        hidden: noTable,
    },

    keysOn: {
        type: ControlType.Boolean,
        title: "Arrow Keys",
        defaultValue: true,
    },
    keyFill: {
        type: ControlType.Color,
        title: "Key Fill",
        defaultValue: "#2A2A2E",
        hidden: (p: HeadwayProps) => !p.keysOn,
    },
    keyInk: {
        type: ControlType.Color,
        title: "Key Icon",
        defaultValue: "#F2EDE4",
        hidden: (p: HeadwayProps) => !p.keysOn,
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#F2B33D",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    interval: {
        type: ControlType.Number,
        title: "Every",
        min: 1.5,
        max: 20,
        step: 0.5,
        unit: "s",
        defaultValue: 4.5,
        hidden: (p: HeadwayProps) => !p.autoplay,
    },
    pauseHover: {
        type: ControlType.Boolean,
        title: "Hover Pause",
        defaultValue: true,
        hidden: (p: HeadwayProps) => !p.autoplay,
    },
    swipeOn: {
        type: ControlType.Boolean,
        title: "Swipe",
        defaultValue: true,
    },

    soundOn: {
        type: ControlType.Boolean,
        title: "Flap Sound",
        defaultValue: false,
    },
    soundLevel: {
        type: ControlType.Number,
        title: "Volume",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
        hidden: (p: HeadwayProps) => !p.soundOn,
    },
})
