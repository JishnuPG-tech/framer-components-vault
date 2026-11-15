/*
 * Flaneur — a collaborator cursor that strolls around a page, stops in a
 * free spot, types a note, clears it and strolls on.
 *
 * Marketplace compliance
 * 1. Static renderer: the exported entry calls useIsStaticRenderer() first and
 *    returns <StillFrame/> on the canvas and in exports. That branch is plain
 *    divs only: no listeners, no observers, no timers, no
 *    requestAnimationFrame, no transitions, no animations, no filters.
 * 2. Offscreen work: the live engine starts locked out. Nothing is scheduled
 *    until an IntersectionObserver reports the roam area on screen, the tab is
 *    visible and the visitor has not asked for reduced motion. The permit is
 *    re-checked on every frame and before every timer callback. Scrolling the
 *    area away, hiding the tab or pressing a key or mouse button cancels the
 *    pending frame and timer at once. requestAnimationFrame only runs while
 *    the cursor is actually walking; typing and waiting use single timeouts,
 *    so the component sits at zero frames between walks.
 * 3. Own subtree only: every element the component reads, measures or writes
 *    is one it rendered itself. It roams inside its own frame, renders no
 *    portal, never queries or measures the surrounding page, and takes the
 *    areas to avoid from the "Keep Clear" control (percent of its own frame).
 * 4. No network requests, no cookies, no storage.
 */
import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Surface = "frame" | "bubble" | "note"
type Stage =
    | "lead"
    | "enter"
    | "rest"
    | "stroll"
    | "poise"
    | "write"
    | "linger"
    | "wipe"
    | "done"

const KEY_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]

const POINTER_SHAPES: Record<string, string> = {
    rounded:
        "M2.6 2.6 L20.6 9.6 C21.6 10 21.5 11.4 20.5 11.7 L13.6 13.6 L11.7 20.5 C11.4 21.5 10 21.6 9.6 20.6 Z",
    classic:
        "M3 2.5 L3 19.5 L7.8 15.2 L10.9 21.8 L13.6 20.5 L10.6 14 L17 13.6 Z",
    dart: "M2.6 2.6 L21 10.4 L12.6 12.6 L10.4 21 Z",
}

function splitNotes(text: any): string[] {
    return String(text || "")
        .split("\n")
        .map((row) => row.trim())
        .filter(Boolean)
}

const STILL_SPOTS = [
    [9, 10],
    [55, 24],
    [14, 56],
    [57, 68],
    [34, 38],
    [70, 46],
]

const FALLBACKS: any = {
    cursors: [
        {
            label: "Designer",
            notes: "Love where this is heading\nNudging this card up a touch…\nTrying a softer shadow here",
            surface: "frame",
            shape: "rounded",
            accent: "#6C4DFF",
            ink: "#15151A",
            fill: "#FFFFFF",
        },
        {
            label: "Writer",
            notes: "Can this label be shorter?\nRewording the empty state\nThis headline reads well",
            surface: "bubble",
            shape: "classic",
            accent: "#F0553A",
            ink: "#15151A",
            fill: "#FFFFFF",
        },
        {
            label: "Developer",
            notes: "Chart data is live now\nFixing the spacing on mobile\nShipping this today ✦",
            surface: "bubble",
            shape: "dart",
            accent: "#0FA97A",
            ink: "#FFFFFF",
            fill: "#0B7F5C",
        },
        {
            label: "Reviewer",
            notes: "Check contrast on this pill\nLeaving a note for later\nApproved, looks great",
            surface: "note",
            shape: "rounded",
            accent: "#E59A12",
            ink: "#3A2A05",
            fill: "#FFE58A",
        },
    ],
    order: "sequence",
    typings: 0,
    wipe: "backspace",
    slips: true,
    pointerSize: 24,
    font: { fontSize: 15, lineHeight: "1.4em" },
    wrap: 220,
    stride: 420,
    keys: 14,
    lead: 0.6,
    poise: 0.5,
    linger: 1.8,
    keepClear: [],
    clearance: 18,
    shy: true,
    retreat: 5,
}

/* ---------- pure helpers (no markup) ---------- */

function readableOn(color: string): string {
    const text = String(color || "")
    let r = 108,
        g = 77,
        b = 255
    const fn = text.match(/rgba?\(([^)]+)\)/g)
    if (fn && fn.length) {
        const parts = fn[fn.length - 1]
            .replace(/rgba?\(|\)/g, "")
            .split(/[\s,\/]+/)
            .filter(Boolean)
            .map(parseFloat)
        if (parts.length >= 3) {
            r = parts[0]
            g = parts[1]
            b = parts[2]
        }
    } else {
        const hex = text.match(/#([0-9a-f]{3,8})/i)
        if (hex) {
            let h = hex[1]
            if (h.length <= 4)
                h = h
                    .split("")
                    .map((c) => c + c)
                    .join("")
            r = parseInt(h.slice(0, 2), 16)
            g = parseInt(h.slice(2, 4), 16)
            b = parseInt(h.slice(4, 6), 16)
        }
    }
    const light = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    return light > 0.62 ? "#14141A" : "#FFFFFF"
}

function neighbourKey(ch: string): string {
    const low = ch.toLowerCase()
    for (const row of KEY_ROWS) {
        const at = row.indexOf(low)
        if (at < 0) continue
        const side =
            at === 0
                ? 1
                : at === row.length - 1
                  ? -1
                  : Math.random() < 0.5
                    ? -1
                    : 1
        const swap = row[at + side]
        return ch === low ? swap : swap.toUpperCase()
    }
    return ch
}

function buildKeystrokes(text: string, perSecond: number, slips: boolean) {
    const beat = 1000 / Math.max(1, perSecond)
    const out: { ch?: string; cut?: boolean; wait: number }[] = []
    for (const ch of Array.from(text)) {
        if (slips && /[a-z]/i.test(ch) && Math.random() < 0.035) {
            out.push({ ch: neighbourKey(ch), wait: beat * 2.6 })
            out.push({ cut: true, wait: beat * 0.9 })
        }
        let wait = beat * (0.55 + Math.random() * 0.9)
        if (".,!?;:".indexOf(ch) >= 0) wait *= 2.6
        else if (ch === " ") wait *= 1.25
        out.push({ ch, wait })
    }
    return out
}

function easeStroll(u: number): number {
    return u * u * u * (u * (6 * u - 15) + 10)
}

function useCalmPreference(): boolean {
    const [calm, setCalm] = React.useState<boolean>(() => {
        if (typeof window === "undefined" || !window.matchMedia) return false
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    })
    React.useEffect(() => {
        if (!window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(query.matches)
        sync()
        if (query.addEventListener) query.addEventListener("change", sync)
        else query.addListener(sync)
        return () => {
            if (query.removeEventListener)
                query.removeEventListener("change", sync)
            else query.removeListener(sync)
        }
    }, [])
    return calm
}

/* ---------- canvas / export branch ---------- */

function StillFrame(props: any) {
    const size = props.pointerSize
    const face = { ...(props.font || {}) }
    const crew = (props.cursors || []).slice(0, 12)
    const guides =
        RenderTarget.current() === RenderTarget.canvas
            ? props.keepClear || []
            : []
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {guides.map((z: any, i: number) => (
                <div
                    key={"g" + i}
                    style={{
                        position: "absolute",
                        left: (Number(z.x) || 0) + "%",
                        top: (Number(z.y) || 0) + "%",
                        width: (Number(z.w) || 0) + "%",
                        height: (Number(z.h) || 0) + "%",
                        border: "1px dashed rgba(128,128,128,0.7)",
                        background: "rgba(128,128,128,0.08)",
                        boxSizing: "border-box",
                    }}
                />
            ))}
            {crew.map((who: any, i: number) => {
                const accent = who.accent
                const isFrame = who.surface === "frame"
                const isNote = who.surface === "note"
                const sample = splitNotes(who.notes)[0] || ""
                const at = STILL_SPOTS[i % STILL_SPOTS.length]
                const dot = (x: "left" | "right", y: "top" | "bottom") => ({
                    position: "absolute" as const,
                    [x]: -4,
                    [y]: -4,
                    width: 7,
                    height: 7,
                    background: "#FFFFFF",
                    border: `1px solid ${accent}`,
                    boxSizing: "border-box" as const,
                })
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: at[0] + "%",
                            top: at[1] + "%",
                        }}
                    >
                        <svg
                            width={size}
                            height={size}
                            viewBox="0 0 24 24"
                            style={{
                                position: "absolute",
                                left: -size * 0.1,
                                top: -size * 0.1,
                                display: "block",
                            }}
                        >
                            <path
                                d={
                                    POINTER_SHAPES[who.shape] ||
                                    POINTER_SHAPES.rounded
                                }
                                fill={accent}
                                stroke="#FFFFFF"
                                strokeWidth={1.5}
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div
                            style={{
                                position: "absolute",
                                left: size * 0.72,
                                top: size * 0.92,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 6,
                                width: "max-content",
                            }}
                        >
                            {who.label ? (
                                <div
                                    style={{
                                        fontFamily: face.fontFamily,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        lineHeight: 1.3,
                                        padding: "4px 9px",
                                        borderRadius: "4px 12px 12px 12px",
                                        background: accent,
                                        color: readableOn(accent),
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {who.label}
                                </div>
                            ) : null}
                            {sample ? (
                                <div
                                    style={{
                                        position: "relative",
                                        boxSizing: "border-box",
                                        background: who.fill,
                                        color: who.ink,
                                        padding: isFrame
                                            ? "4px 6px"
                                            : isNote
                                              ? 14
                                              : "9px 13px",
                                        border: isNote
                                            ? "none"
                                            : `${isFrame ? 1 : 1.5}px solid ${accent}`,
                                        borderRadius: isFrame
                                            ? 0
                                            : isNote
                                              ? 3
                                              : "4px 18px 18px 18px",
                                        width: isNote ? props.wrap : undefined,
                                        minHeight: isNote ? 92 : undefined,
                                    }}
                                >
                                    <div
                                        style={{
                                            ...face,
                                            maxWidth: props.wrap,
                                            whiteSpace: "pre-wrap",
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {sample}
                                    </div>
                                    {isFrame ? (
                                        <div style={dot("left", "top")} />
                                    ) : null}
                                    {isFrame ? (
                                        <div style={dot("right", "top")} />
                                    ) : null}
                                    {isFrame ? (
                                        <div style={dot("left", "bottom")} />
                                    ) : null}
                                    {isFrame ? (
                                        <div style={dot("right", "bottom")} />
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/* ---------- published branch ---------- */

function Stroller(input: any) {
    const { hostRef, layerRef, claims, scope, index } = input
    const props = {
        ...input.settings,
        ...input.who,
        messages: splitNotes(input.who && input.who.notes),
    }

    const rigRef = React.useRef<HTMLDivElement>(null)
    const arrowRef = React.useRef<HTMLDivElement>(null)
    const pingRef = React.useRef<HTMLDivElement>(null)
    const tagRef = React.useRef<HTMLDivElement>(null)
    const slateRef = React.useRef<HTMLDivElement>(null)
    const inkRef = React.useRef<HTMLSpanElement>(null)
    const tallyRef = React.useRef<HTMLDivElement>(null)
    const probeRef = React.useRef<HTMLDivElement>(null)
    const probeTextRef = React.useRef<HTMLDivElement>(null)

    const liveProps = React.useRef(props)
    liveProps.current = props

    React.useEffect(() => {
        const host = hostRef.current
        const layer = layerRef.current
        const rig = rigRef.current
        const slate = slateRef.current
        const inkEl = inkRef.current
        const probe = probeRef.current
        const probeText = probeTextRef.current
        if (!host || !layer || !rig || !slate || !inkEl || !probe || !probeText)
            return

        let alive = true
        let onScreen = false
        let tabOpen = !document.hidden
        let hushed = false
        let frame = 0
        let timer = 0
        let hushTimer = 0
        let stage: Stage = "lead"

        const spot = { x: 0, y: 0 }
        const span = { w: 0, h: 0 }
        const view = { l: 0, t: 0, r: 0, b: 0 }

        let trip: any = null
        let strokes: { ch?: string; cut?: boolean; wait: number }[] = []
        let strokeAt = 0
        let glyphs: string[] = []
        let line = ""
        let owed = false
        let turn = 0
        let finished = 0
        let bag: number[] = []
        let lastPick = -1
        let shun: { x: number; y: number } | null = null

        slate.style.display = "none"
        rig.style.opacity = "0"
        rig.setAttribute("data-live", "0")

        const permit = () => alive && onScreen && tabOpen && !hushed

        const halt = () => {
            if (frame) cancelAnimationFrame(frame)
            if (timer) clearTimeout(timer)
            frame = 0
            timer = 0
        }

        const later = (ms: number, fn: () => void) => {
            if (timer) clearTimeout(timer)
            timer = window.setTimeout(
                () => {
                    timer = 0
                    if (permit()) fn()
                },
                Math.max(0, ms)
            )
        }

        const paint = () => {
            rig.style.transform = `translate3d(${spot.x.toFixed(1)}px, ${spot.y.toFixed(1)}px, 0)`
        }

        const print = () => {
            inkEl.textContent = glyphs.join("")
            const tally = tallyRef.current
            if (tally)
                tally.textContent = `${slate.offsetWidth} × ${slate.offsetHeight}`
        }

        const survey = () => {
            const box = host.getBoundingClientRect()
            span.w = box.width
            span.h = box.height
            view.l = Math.max(0, -box.left)
            view.t = Math.max(0, -box.top)
            view.r = Math.min(box.width, window.innerWidth - box.left)
            view.b = Math.min(box.height, window.innerHeight - box.top)
        }

        const collectWalls = () => {
            const walls: { l: number; t: number; r: number; b: number }[] = []
            const zones = liveProps.current.keepClear || []
            for (let i = 0; i < zones.length; i++) {
                const z = zones[i]
                if (!z) continue
                const l = ((Number(z.x) || 0) / 100) * span.w
                const t = ((Number(z.y) || 0) / 100) * span.h
                walls.push({
                    l,
                    t,
                    r: l + ((Number(z.w) || 0) / 100) * span.w,
                    b: t + ((Number(z.h) || 0) / 100) * span.h,
                })
            }
            const taken = claims.current
            for (const key in taken) {
                if (Number(key) !== index && taken[key]) walls.push(taken[key])
            }
            return walls
        }

        const footprint = (text: string) => {
            const p = liveProps.current
            const tag = tagRef.current
            const offX = p.pointerSize * 0.72
            const offY = p.pointerSize * 0.92
            const tagW = tag ? tag.offsetWidth : 0
            const tagH = tag ? tag.offsetHeight : 0
            if (!text) return { w: offX + tagW, h: offY + tagH }
            probeText.textContent = text
            const extra = p.surface === "frame" ? 28 : 0
            return {
                w: offX + Math.max(tagW, probe.offsetWidth),
                h: offY + tagH + 6 + probe.offsetHeight + extra,
            }
        }

        const scout = (needW: number, needH: number) => {
            const p = liveProps.current
            const pad = Math.max(0, p.clearance)
            const edge = 14
            let l = view.l,
                t = view.t,
                r = view.r,
                b = view.b
            if (r - l < needW + edge * 2 || b - t < needH + edge * 2) {
                l = 0
                t = 0
                r = span.w
                b = span.h
            }
            const roomX = Math.max(0, r - needW - edge - (l + edge))
            const roomY = Math.max(0, b - needH - edge - (t + edge))
            const walls = collectWalls()
            const hop = Math.min(180, Math.hypot(r - l, b - t) * 0.22)
            let best = { x: l + edge, y: t + edge }
            let bestCost = Infinity
            for (let i = 0; i < 70; i++) {
                const x = l + edge + Math.random() * roomX
                const y = t + edge + Math.random() * roomY
                const fl = x - pad
                const ft = y - pad
                const fr = x + needW + pad
                const fb = y + needH + pad
                let cost = 0
                for (let k = 0; k < walls.length; k++) {
                    const w = walls[k]
                    const ox = Math.min(fr, w.r) - Math.max(fl, w.l)
                    if (ox <= 0) continue
                    const oy = Math.min(fb, w.b) - Math.max(ft, w.t)
                    if (oy <= 0) continue
                    cost += ox * oy
                }
                if (Math.hypot(x - spot.x, y - spot.y) < hop) cost += 4000
                if (shun && Math.hypot(x - shun.x, y - shun.y) < 260)
                    cost += 1e6
                if (cost < bestCost) {
                    bestCost = cost
                    best = { x, y }
                    if (cost === 0) break
                }
            }
            return best
        }

        const nextLine = () => {
            const p = liveProps.current
            const list = (p.messages || []).filter((s: string) => s && s.trim())
            if (!list.length) return ""
            let at = 0
            if (p.order === "shuffle") {
                if (!bag.length) {
                    bag = list.map((_: string, i: number) => i)
                    for (let i = bag.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1))
                        const hold = bag[i]
                        bag[i] = bag[j]
                        bag[j] = hold
                    }
                    if (bag.length > 1 && bag[bag.length - 1] === lastPick) {
                        const hold = bag[0]
                        bag[0] = bag[bag.length - 1]
                        bag[bag.length - 1] = hold
                    }
                }
                at = (bag.pop() as number) % list.length
            } else {
                at = turn % list.length
            }
            turn++
            lastPick = at
            return list[at]
        }

        const closeSlate = () => {
            glyphs = []
            inkEl.textContent = ""
            inkEl.style.background = "transparent"
            slate.style.display = "none"
        }

        const depart = (rush: boolean) => {
            survey()
            if (!owed) {
                line = nextLine()
                owed = true
            }
            const need = footprint(line)
            const to = scout(need.w, need.h)
            claims.current[index] = {
                l: to.x,
                t: to.y,
                r: to.x + need.w,
                b: to.y + need.h,
            }
            shun = null
            const dx = to.x - spot.x
            const dy = to.y - spot.y
            const reach = Math.hypot(dx, dy) || 1
            const bow =
                (Math.random() < 0.5 ? -1 : 1) *
                reach *
                (0.12 + Math.random() * 0.16)
            const stride = Math.max(40, liveProps.current.stride)
            trip = {
                ax: spot.x,
                ay: spot.y,
                bx: to.x,
                by: to.y,
                mx: spot.x + dx / 2 + (-dy / reach) * bow,
                my: spot.y + dy / 2 + (dx / reach) * bow,
                ms: Math.max(380, (reach / stride) * 1000) * (rush ? 0.55 : 1),
                gone: 0,
                stamp: 0,
            }
            stage = "stroll"
            frame = requestAnimationFrame(step)
        }

        const step = (now: number) => {
            frame = 0
            if (!permit() || !trip) return
            const dt = trip.stamp ? Math.min(48, now - trip.stamp) : 0
            trip.stamp = now
            trip.gone += dt
            const u = Math.min(1, trip.gone / trip.ms)
            const e = easeStroll(u)
            const inv = 1 - e
            spot.x =
                inv * inv * trip.ax + 2 * inv * e * trip.mx + e * e * trip.bx
            spot.y =
                inv * inv * trip.ay + 2 * inv * e * trip.my + e * e * trip.by
            paint()
            if (u < 1) {
                frame = requestAnimationFrame(step)
                return
            }
            trip = null
            stage = "poise"
            later(liveProps.current.poise * 1000, beginWrite)
        }

        const beginWrite = () => {
            const p = liveProps.current
            if (!line) {
                stage = "rest"
                later(p.linger * 1000, () => depart(false))
                return
            }
            const arrow = arrowRef.current
            const ping = pingRef.current
            if (arrow && arrow.animate) {
                arrow.animate(
                    [
                        { transform: "scale(1)" },
                        { transform: "scale(0.84)" },
                        { transform: "scale(1)" },
                    ],
                    { duration: 220, easing: "ease-out" }
                )
            }
            if (ping && ping.animate) {
                ping.animate(
                    [
                        { opacity: 0.7, transform: "scale(0.3)" },
                        { opacity: 0, transform: "scale(1.5)" },
                    ],
                    { duration: 460, easing: "cubic-bezier(.2,.7,.2,1)" }
                )
            }
            glyphs = []
            inkEl.textContent = ""
            slate.style.display = ""
            if (slate.animate) {
                slate.animate(
                    [
                        { opacity: 0, transform: "scale(0.9)" },
                        { opacity: 1, transform: "scale(1)" },
                    ],
                    { duration: 170, easing: "cubic-bezier(.2,.8,.2,1)" }
                )
            }
            strokes = buildKeystrokes(line, p.keys, p.slips)
            strokeAt = 0
            print()
            stage = "write"
            later(140, keystroke)
        }

        const keystroke = () => {
            if (strokeAt >= strokes.length) {
                finished++
                owed = false
                stage = "linger"
                later(liveProps.current.linger * 1000, wipeStep)
                return
            }
            const stroke = strokes[strokeAt++]
            if (stroke.cut) glyphs.pop()
            else if (stroke.ch !== undefined) glyphs.push(stroke.ch)
            print()
            later(stroke.wait, keystroke)
        }

        const wipeStep = () => {
            const p = liveProps.current
            stage = "wipe"
            if (p.wipe === "select") {
                inkEl.style.background = `color-mix(in srgb, ${p.accent} 30%, transparent)`
                later(440, leave)
                return
            }
            if (!glyphs.length) {
                leave()
                return
            }
            glyphs.pop()
            print()
            later(Math.max(14, 1000 / (Math.max(1, p.keys) * 2.6)), wipeStep)
        }

        const leave = () => {
            const p = liveProps.current
            closeSlate()
            if (p.typings > 0 && finished >= p.typings) {
                stage = "done"
                rig.style.opacity = "0"
                rig.setAttribute("data-live", "0")
                return
            }
            stage = "rest"
            later(280, () => depart(false))
        }

        const enter = () => {
            survey()
            const need = footprint("")
            const at = scout(need.w, need.h)
            spot.x = at.x
            spot.y = at.y
            paint()
            rig.style.opacity = "1"
            stage = "rest"
            later(520, () => depart(false))
        }

        const resume = () => {
            if (!permit() || stage === "done") return
            halt()
            rig.setAttribute("data-live", "1")
            const p = liveProps.current
            if (stage === "lead") later(p.lead * 1000 + index * 650, enter)
            else if (stage === "enter") enter()
            else if (stage === "rest") later(280, () => depart(false))
            else if (stage === "stroll") {
                if (trip) {
                    trip.stamp = 0
                    frame = requestAnimationFrame(step)
                } else depart(false)
            } else if (stage === "poise") later(p.poise * 1000, beginWrite)
            else if (stage === "write") keystroke()
            else if (stage === "linger") later(p.linger * 1000, wipeStep)
            else if (stage === "wipe") wipeStep()
        }

        const park = () => {
            halt()
            rig.setAttribute("data-live", "0")
        }

        const hush = () => {
            if (stage === "done") return
            const back = liveProps.current.retreat
            hushed = true
            park()
            rig.style.opacity = "0"
            if (hushTimer) clearTimeout(hushTimer)
            hushTimer = 0
            if (!(back > 0)) {
                stage = "done"
                return
            }
            hushTimer = window.setTimeout(() => {
                hushTimer = 0
                if (!alive) return
                hushed = false
                closeSlate()
                trip = null
                if (stage !== "lead") stage = "enter"
                resume()
            }, back * 1000)
        }

        const onPointerMove = (event: PointerEvent) => {
            if (event.pointerType && event.pointerType !== "mouse") return
            if (!liveProps.current.shy || !permit()) return
            if (
                stage === "lead" ||
                stage === "enter" ||
                stage === "stroll" ||
                stage === "done"
            )
                return
            const box = host.getBoundingClientRect()
            const px = event.clientX - box.left
            const py = event.clientY - box.top
            if (Math.hypot(px - spot.x, py - spot.y) > 96) return
            halt()
            closeSlate()
            shun = { x: px, y: py }
            depart(true)
        }

        const onVisibility = () => {
            tabOpen = !document.hidden
            if (tabOpen) resume()
            else park()
        }

        const onResize = () => {
            survey()
            spot.x = Math.min(spot.x, Math.max(0, span.w - 24))
            spot.y = Math.min(spot.y, Math.max(0, span.h - 24))
            paint()
        }

        survey()

        let watcher: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            watcher = new IntersectionObserver(
                (entries) => {
                    const last = entries[entries.length - 1]
                    onScreen = !!last && last.isIntersecting
                    if (onScreen) resume()
                    else park()
                },
                { threshold: 0 }
            )
            watcher.observe(host)
        } else {
            onScreen = true
            resume()
        }

        let sizer: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            sizer = new ResizeObserver(onResize)
            sizer.observe(host)
        }

        const quiet = {
            capture: true,
            passive: true,
        } as AddEventListenerOptions
        window.addEventListener("keydown", hush, quiet)
        window.addEventListener("pointerdown", hush, quiet)
        window.addEventListener("pointermove", onPointerMove, { passive: true })
        document.addEventListener("visibilitychange", onVisibility)

        return () => {
            alive = false
            delete claims.current[index]
            halt()
            if (hushTimer) clearTimeout(hushTimer)
            if (watcher) watcher.disconnect()
            if (sizer) sizer.disconnect()
            window.removeEventListener("keydown", hush, quiet)
            window.removeEventListener("pointerdown", hush, quiet)
            window.removeEventListener("pointermove", onPointerMove)
            document.removeEventListener("visibilitychange", onVisibility)
        }
    }, [])

    const accent = props.accent
    const onAccent = readableOn(accent)
    const size = props.pointerSize
    const face = { ...(props.font || {}) }
    const surface: Surface = props.surface
    const isFrame = surface === "frame"
    const isNote = surface === "note"

    const boxStyle: React.CSSProperties = {
        position: "relative",
        boxSizing: "border-box",
        background: props.fill,
        color: props.ink,
        padding: isFrame ? "4px 6px" : isNote ? 14 : "9px 13px",
        border: isNote ? "none" : `${isFrame ? 1 : 1.5}px solid ${accent}`,
        borderRadius: isFrame ? 0 : isNote ? 3 : "4px 18px 18px 18px",
        width: isNote ? props.wrap : undefined,
        minHeight: isNote ? 92 : undefined,
        boxShadow: isNote
            ? "0 14px 28px -12px rgba(0,0,0,0.38), 0 2px 4px rgba(0,0,0,0.08)"
            : isFrame
              ? "none"
              : "0 8px 22px -10px rgba(0,0,0,0.3)",
    }
    const copyStyle: React.CSSProperties = {
        ...face,
        maxWidth: props.wrap,
        minWidth: 6,
        minHeight: "1em",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
    }
    const handle = (
        x: "left" | "right",
        y: "top" | "bottom"
    ): React.CSSProperties => ({
        position: "absolute",
        [x]: -4,
        [y]: -4,
        width: 7,
        height: 7,
        background: "#FFFFFF",
        border: `1px solid ${accent}`,
        boxSizing: "border-box",
    })

    return (
        <>
            <div
                ref={probeRef}
                style={{
                    ...boxStyle,
                    position: "absolute",
                    left: 0,
                    top: 0,
                    visibility: "hidden",
                    boxShadow: "none",
                }}
            >
                <div ref={probeTextRef} style={copyStyle} />
            </div>
            <div
                ref={rigRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                    willChange: "transform, opacity",
                }}
            >
                <div
                    ref={pingRef}
                    style={{
                        position: "absolute",
                        left: -15,
                        top: -15,
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        border: `1.5px solid ${accent}`,
                        boxSizing: "border-box",
                        opacity: 0,
                    }}
                />
                <div
                    ref={arrowRef}
                    style={{
                        position: "absolute",
                        left: -size * 0.1,
                        top: -size * 0.1,
                        width: size,
                        height: size,
                        transformOrigin: "10% 10%",
                        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.22))",
                    }}
                >
                    <svg
                        width={size}
                        height={size}
                        viewBox="0 0 24 24"
                        style={{ display: "block" }}
                    >
                        <path
                            d={
                                POINTER_SHAPES[props.shape] ||
                                POINTER_SHAPES.rounded
                            }
                            fill={accent}
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <div
                    style={{
                        position: "absolute",
                        left: size * 0.72,
                        top: size * 0.92,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 6,
                        width: "max-content",
                    }}
                >
                    {props.label ? (
                        <div
                            ref={tagRef}
                            style={{
                                fontFamily: face.fontFamily,
                                fontSize: 12,
                                fontWeight: 600,
                                lineHeight: 1.3,
                                padding: "4px 9px",
                                borderRadius: "4px 12px 12px 12px",
                                background: accent,
                                color: onAccent,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {props.label}
                        </div>
                    ) : null}
                    <div
                        ref={slateRef}
                        style={{
                            ...boxStyle,
                            transformOrigin: "0 0",
                            rotate: isNote ? "-1.5deg" : undefined,
                        }}
                    >
                        <div style={copyStyle}>
                            <span ref={inkRef} />
                            <span
                                className={`${scope}-caret`}
                                style={{
                                    display: "inline-block",
                                    width: 1.5,
                                    height: "1.05em",
                                    marginLeft: 1,
                                    verticalAlign: "text-bottom",
                                    background: isFrame ? accent : props.ink,
                                }}
                            />
                        </div>
                        {isFrame ? <div style={handle("left", "top")} /> : null}
                        {isFrame ? (
                            <div style={handle("right", "top")} />
                        ) : null}
                        {isFrame ? (
                            <div style={handle("left", "bottom")} />
                        ) : null}
                        {isFrame ? (
                            <div style={handle("right", "bottom")} />
                        ) : null}
                        {isFrame ? (
                            <div
                                ref={tallyRef}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "100%",
                                    marginTop: 7,
                                    transform: "translateX(-50%)",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background: accent,
                                    color: onAccent,
                                    fontFamily: face.fontFamily,
                                    fontSize: 10.5,
                                    fontWeight: 500,
                                    lineHeight: 1.3,
                                    whiteSpace: "nowrap",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    )
}

function RoamingView(props: any) {
    const calm = useCalmPreference()
    const rawId = React.useId()
    const scope = "fl" + rawId.replace(/[^a-zA-Z0-9]/g, "")
    const hostRef = React.useRef<HTMLDivElement>(null)
    const layerRef = React.useRef<HTMLDivElement>(null)
    const claims = React.useRef<any>({})
    const crew = (props.cursors || []).slice(0, 12)

    return (
        <div
            ref={hostRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
            }}
        >
            {!calm ? (
                <div
                    ref={layerRef}
                    aria-hidden="true"
                    data-flaneur={scope}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                >
                    <style>{`
@keyframes ${scope}-blink { 0%, 45% { opacity: 1 } 55%, 100% { opacity: 0 } }
[data-flaneur="${scope}"] .${scope}-caret { animation: ${scope}-blink 1s steps(1, end) infinite; }
[data-flaneur="${scope}"] [data-live="0"] .${scope}-caret { animation-play-state: paused; }
`}</style>
                    {crew.map((who: any, i: number) => (
                        <Stroller
                            key={i}
                            index={i}
                            who={who}
                            settings={props}
                            hostRef={hostRef}
                            layerRef={layerRef}
                            claims={claims}
                            scope={scope}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    )
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Flaneur(props) {
    const isStatic = useIsStaticRenderer()
    const settings = { ...FALLBACKS, ...props }
    if (isStatic) return <StillFrame {...settings} />
    return <RoamingView {...settings} />
}

addPropertyControls(Flaneur, {
    cursors: {
        type: ControlType.Array,
        title: "Cursors",
        maxCount: 12,
        defaultValue: FALLBACKS.cursors,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Name Tag",
                    defaultValue: "Guest",
                },
                notes: {
                    type: ControlType.String,
                    title: "Messages",
                    displayTextArea: true,
                    defaultValue: "First message\nSecond message",
                    description: "One message per line.",
                },
                surface: {
                    type: ControlType.Enum,
                    title: "Typing Style",
                    options: ["frame", "bubble", "note"],
                    optionTitles: ["Text tool", "Chat bubble", "Sticky note"],
                    defaultValue: "frame",
                },
                shape: {
                    type: ControlType.Enum,
                    title: "Cursor",
                    options: ["rounded", "classic", "dart"],
                    optionTitles: ["Rounded", "Classic arrow", "Dart"],
                    defaultValue: "rounded",
                },
                accent: {
                    type: ControlType.Color,
                    title: "Accent",
                    defaultValue: "#3D7BFF",
                },
                ink: {
                    type: ControlType.Color,
                    title: "Text",
                    defaultValue: "#15151A",
                },
                fill: {
                    type: ControlType.Color,
                    title: "Box Fill",
                    defaultValue: "#FFFFFF",
                },
            },
        },
    },
    order: {
        type: ControlType.Enum,
        title: "Order",
        options: ["sequence", "shuffle"],
        optionTitles: ["In order", "Random"],
        defaultValue: "sequence",
        displaySegmentedControl: true,
    },
    typings: {
        type: ControlType.Number,
        title: "Typings",
        min: 0,
        max: 50,
        step: 1,
        displayStepper: true,
        defaultValue: 0,
        description:
            "Messages each cursor types before it fades out. 0 keeps going.",
    },
    wipe: {
        type: ControlType.Enum,
        title: "Erase",
        options: ["backspace", "select"],
        optionTitles: ["Backspace", "Select all"],
        defaultValue: "backspace",
        displaySegmentedControl: true,
    },
    slips: {
        type: ControlType.Boolean,
        title: "Typos",
        enabledTitle: "Human",
        disabledTitle: "Perfect",
        defaultValue: true,
    },
    pointerSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        min: 12,
        max: 64,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 15, lineHeight: "1.4em" },
    },
    wrap: {
        type: ControlType.Number,
        title: "Wrap Width",
        min: 120,
        max: 520,
        step: 10,
        unit: "px",
        defaultValue: 220,
    },
    stride: {
        type: ControlType.Number,
        title: "Walk Speed",
        min: 80,
        max: 1600,
        step: 20,
        unit: "px/s",
        defaultValue: 420,
    },
    keys: {
        type: ControlType.Number,
        title: "Typing Speed",
        min: 2,
        max: 40,
        step: 1,
        unit: "/s",
        defaultValue: 14,
    },
    lead: {
        type: ControlType.Number,
        title: "Start Delay",
        min: 0,
        max: 20,
        step: 0.1,
        unit: "s",
        defaultValue: 0.6,
    },
    poise: {
        type: ControlType.Number,
        title: "Pause",
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
        defaultValue: 0.5,
        description: "Wait after arriving, before typing.",
    },
    linger: {
        type: ControlType.Number,
        title: "Text Stays",
        min: 0.2,
        max: 15,
        step: 0.1,
        unit: "s",
        defaultValue: 1.8,
    },
    keepClear: {
        type: ControlType.Array,
        title: "Keep Clear",
        maxCount: 20,
        defaultValue: [],
        description:
            "Areas the cursors stay out of, in % of this frame. Outlined on the canvas only.",
        control: {
            type: ControlType.Object,
            controls: {
                x: {
                    type: ControlType.Number,
                    title: "Left",
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    defaultValue: 10,
                },
                y: {
                    type: ControlType.Number,
                    title: "Top",
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    defaultValue: 10,
                },
                w: {
                    type: ControlType.Number,
                    title: "Width",
                    min: 1,
                    max: 100,
                    step: 1,
                    unit: "%",
                    defaultValue: 40,
                },
                h: {
                    type: ControlType.Number,
                    title: "Height",
                    min: 1,
                    max: 100,
                    step: 1,
                    unit: "%",
                    defaultValue: 20,
                },
            },
        },
    },
    clearance: {
        type: ControlType.Number,
        title: "Clearance",
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        defaultValue: 18,
        description: "Gap kept around Keep Clear areas and other cursors.",
    },
    shy: {
        type: ControlType.Boolean,
        title: "Dodge Visitor",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
        description: "Walks away when the visitor's cursor comes close.",
    },
    retreat: {
        type: ControlType.Number,
        title: "Return After",
        min: 0,
        max: 60,
        step: 0.5,
        unit: "s",
        defaultValue: 5,
        description: "Comes back this long after a key or click. 0 stays away.",
    },
})
