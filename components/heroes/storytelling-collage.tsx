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


type Item = {
    image?: { src?: string; alt?: string }
    imageUrl?: string
    title?: string
    caption?: string
    link?: string
    newTab?: boolean
}

type CardOptions = {
    count: number
    scale: number
    aspect: number
    spread: number
    radius: number
    fit: "cover" | "contain"
    fillTop: string
    fillBottom: string
    shadow: boolean
    haze: number
    labels: boolean
    labelFill: string
    labelText: string
}

type TypingOptions = {
    style: "soft" | "crisp"
    speed: number
    delay: number
    pause: number
    caret: boolean
    caretColor: string
    caretAfter: "blink" | "hide"
    replay: boolean
}

type MotionOptions = {
    parallax: number
    textDrift: number
    float: number
    floatSpeed: number
    entrance: boolean
    stagger: number
    lift: number
}

type Props = {
    items?: Item[]
    text?: string
    font?: React.CSSProperties
    textColor?: string
    textWidth?: number
    background?: string
    cards?: Partial<CardOptions>
    typing?: Partial<TypingOptions>
    motion?: Partial<MotionOptions>
    style?: React.CSSProperties
}

// ─── defaults ───────────────────────────────────────────────────────────────

const pic = (id: string) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=360&h=440&q=80`

const SAMPLE_ITEMS: Item[] = [
    {
        imageUrl: pic("1506905925346-21bda4d32df4"),
        title: "High Ground",
        caption: "Landscape",
    },
    {
        imageUrl: pic("1523275335684-37898b6baf30"),
        title: "Daily Watch",
        caption: "Product",
    },
    {
        imageUrl: pic("1494790108377-be9c29b29330"),
        title: "Wren Talbot",
        caption: "Portrait",
    },
    {
        imageUrl: pic("1497366216548-37526070297c"),
        title: "Open Studio",
        caption: "Workspace",
    },
    {
        imageUrl: pic("1511920170033-f8396924c348"),
        title: "Slow Pour",
        caption: "Coffee",
    },
    {
        imageUrl: pic("1486406146926-c627a92ad1ab"),
        title: "Glass Tower",
        caption: "Architecture",
    },
    {
        imageUrl: pic("1505740420928-5e560c06d30e"),
        title: "Quiet Sound",
        caption: "Audio",
    },
    {
        imageUrl: pic("1441974231531-c6227db76b6e"),
        title: "Green Hour",
        caption: "Nature",
    },
    {
        imageUrl: pic("1542291026-7eec264c27ff"),
        title: "First Step",
        caption: "Footwear",
    },
    {
        imageUrl: pic("1507003211169-0a1dd7228f2d"),
        title: "Ezra Moline",
        caption: "Portrait",
    },
    {
        imageUrl: pic("1504674900247-0877df9cc836"),
        title: "Shared Table",
        caption: "Food",
    },
    {
        imageUrl: pic("1517336714731-489689fd1ca8"),
        title: "Night Shift",
        caption: "Tech",
    },
    {
        imageUrl: pic("1501785888041-af3ef285b470"),
        title: "Still Water",
        caption: "Travel",
    },
    {
        imageUrl: pic("1518791841217-8f162f1e1131"),
        title: "House Guest",
        caption: "Pets",
    },
    {
        imageUrl: pic("1469474968028-56623f02e42e"),
        title: "Long Way",
        caption: "Outdoors",
    },
    {
        imageUrl: pic("1534528741775-53994a69daeb"),
        title: "Isla Venn",
        caption: "Portrait",
    },
]

const SAMPLE_TEXT =
    "Bring every piece of your story\ntogether in one place, and let\neach moment speak for itself."

const CARD_DEFAULTS: CardOptions = {
    count: 16,
    scale: 1.1,
    aspect: 1.2,
    spread: 1,
    radius: 12,
    fit: "cover",
    fillTop: "#B9B4BF",
    fillBottom: "#EDB89D",
    shadow: true,
    haze: 0.28,
    labels: true,
    labelFill: "#FFFFFF",
    labelText: "#1C1C1E",
}

const TYPING_DEFAULTS: TypingOptions = {
    style: "soft",
    speed: 38,
    delay: 0.45,
    pause: 1,
    caret: true,
    caretColor: "#1C1C1E",
    caretAfter: "blink",
    replay: false,
}

const MOTION_DEFAULTS: MotionOptions = {
    parallax: 28,
    textDrift: 8,
    float: 5,
    floatSpeed: 0.8,
    entrance: true,
    stagger: 0.06,
    lift: 6,
}

// Scatter map: [x, y, size]. x and y are fractions of the frame; size is the card width as a
// fraction of the frame's mean side. Listed in the order cards are added as the count grows.
const SCATTER: ReadonlyArray<readonly [number, number, number]> = [
    [0.669, 0.169, 0.0885],
    [0.032, 0.5, 0.103],
    [0.896, 0.81, 0.115],
    [0.298, 0.178, 0.078],
    [0.58, 0.835, 0.08],
    [0.88, 0.107, 0.115],
    [0.172, 0.752, 0.084],
    [0.749, 0.716, 0.0885],
    [0.482, 0.233, 0.06],
    [0.325, 0.893, 0.083],
    [-0.005, 0.116, 0.126],
    [0.423, 0.766, 0.058],
    [0.267, 0.704, 0.056],
    [1.015, 0.422, 0.115],
    [0.715, 1.03, 0.115],
    [-0.02, 0.958, 0.088],
]

// ─── pure helpers (data only, no markup) ────────────────────────────────────

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

const hash = (n: number) => {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453
    return v - Math.floor(v)
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

const easeOutBack = (t: number) => {
    const a = 1.35
    const b = a + 1
    return 1 + b * Math.pow(t - 1, 3) + a * Math.pow(t - 1, 2)
}

const sourceOf = (p: Item) => p.image?.src || p.imageUrl || ""

const monogram = (label = "") =>
    label
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")

type Spot = {
    cx: number
    cy: number
    size: number
    depth: number
    towardX: number
    towardY: number
    phase: number
    rank: number
    item: Item
}

function scatter(items: Item[], opts: CardOptions): Spot[] {
    if (!items.length) return []
    const n = Math.max(0, Math.min(SCATTER.length, Math.round(opts.count)))
    const spots: Spot[] = SCATTER.slice(0, n).map(([x, y, s], i) => {
        const cx = 0.5 + (x - 0.5) * opts.spread
        const cy = 0.5 + (y - 0.5) * opts.spread
        const vx = 0.5 - cx
        const vy = 0.5 - cy
        const len = Math.hypot(vx, vy) || 1
        return {
            cx,
            cy,
            size: s,
            depth: clamp01((s - 0.056) / 0.07),
            towardX: vx / len,
            towardY: vy / len,
            phase: hash(i * 7.31 + 1) * Math.PI * 2,
            rank: len,
            item: items[i % items.length],
        }
    })
    const byReach = [...spots].sort((a, b) => a.rank - b.rank)
    byReach.forEach((spot, r) => (spot.rank = r))
    return spots
}

const restOpacity = (spot: Spot, haze: number) =>
    1 - clamp01(haze) * (1 - spot.depth)

const spotBox = (spot: Spot, opts: CardOptions): React.CSSProperties => ({
    position: "absolute",
    left: `${(spot.cx * 100).toFixed(3)}%`,
    top: `${(spot.cy * 100).toFixed(3)}%`,
    width: `calc((100cqw + 100cqh) * ${((spot.size * opts.scale) / 2).toFixed(5)})`,
    aspectRatio: `1 / ${opts.aspect}`,
    transform: "translate(-50%, -50%)",
    zIndex: Math.round(spot.size * 1000),
})

type Word = { gap: boolean; text: string }
type Script = { lines: Word[][]; times: number[] }

// Builds the typing score: one reveal time per visible character, with a little human
// unevenness and longer holds after punctuation and line ends.
function compose(text: string, speed: number, pause: number): Script {
    const beat = 1 / Math.max(1, speed)
    const times: number[] = []
    const lines: Word[][] = []
    let clock = 0
    let n = 0
    for (const line of text.split(/\r?\n/)) {
        const row: Word[] = []
        for (const part of line.split(/(\s+)/)) {
            if (!part) continue
            if (/^\s+$/.test(part)) {
                row.push({ gap: true, text: " " })
                clock += beat * 0.55
                continue
            }
            row.push({ gap: false, text: part })
            for (const ch of Array.from(part)) {
                times.push(clock)
                let wait = beat * (0.62 + hash(n++) * 0.76)
                if (/[.!?…]/.test(ch)) wait += beat * 7 * pause
                else if (/[,;:—–]/.test(ch)) wait += beat * 3 * pause
                clock += wait
            }
        }
        lines.push(row)
        clock += beat * 4 * pause
    }
    return { lines, times }
}

const srOnly: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

function resolve(props: Props) {
    const font = props.font || {}
    return {
        items: props.items ?? SAMPLE_ITEMS,
        text: props.text ?? SAMPLE_TEXT,
        textColor: props.textColor ?? "#1C1C1E",
        textWidth: props.textWidth ?? 640,
        background: props.background ?? "#F4F4F2",
        cards: { ...CARD_DEFAULTS, ...(props.cards || {}) } as CardOptions,
        typing: {
            ...TYPING_DEFAULTS,
            ...(props.typing || {}),
        } as TypingOptions,
        motion: {
            ...MOTION_DEFAULTS,
            ...(props.motion || {}),
        } as MotionOptions,
        type: {
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.18,
            letterSpacing: "-0.02em",
            ...font,
            textAlign: (font.textAlign as any) || "center",
        } as React.CSSProperties,
        style: props.style,
    }
}

type Resolved = ReturnType<typeof resolve>

// ─── entry ──────────────────────────────────────────────────────────────────

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Concourse(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillField {...resolve(props)} />
    return <LiveField {...resolve(props)} />
}

// ─── static branch: plain divs only ─────────────────────────────────────────

function StillField(r: Resolved) {
    const spots = scatter(r.items, r.cards)
    const fill = `linear-gradient(180deg, ${r.cards.fillTop}, ${r.cards.fillBottom})`
    return (
        <div
            style={
                {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background: r.background,
                    containerType: "size",
                    ...r.style,
                } as React.CSSProperties
            }
        >
            {spots.map((spot, i) => {
                const src = sourceOf(spot.item)
                return (
                    <div
                        key={i}
                        style={{
                            ...spotBox(spot, r.cards),
                            opacity: restOpacity(spot, r.cards.haze),
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: r.cards.radius,
                                overflow: "hidden",
                                background: fill,
                                boxShadow: r.cards.shadow
                                    ? "0 1px 2px rgba(24,18,32,0.06), 0 12px 26px -10px rgba(24,18,32,0.28)"
                                    : "none",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "rgba(255,255,255,0.85)",
                                    fontFamily: r.type.fontFamily,
                                    fontWeight: 600,
                                    fontSize: "clamp(10px, 22cqmin, 28px)",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {monogram(spot.item.title)}
                            </div>
                            {src ? (
                                <img
                                    src={src}
                                    alt={
                                        spot.item.image?.alt ||
                                        spot.item.title ||
                                        ""
                                    }
                                    draggable={false}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: r.cards.fit,
                                        objectPosition:
                                            r.cards.fit === "contain"
                                                ? "50% 100%"
                                                : "50% 50%",
                                    }}
                                />
                            ) : null}
                        </div>
                    </div>
                )
            })}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: `min(${r.textWidth}px, calc(100% - 32px))`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 200,
                }}
            >
                <p style={{ ...r.type, color: r.textColor, margin: 0 }}>
                    {compose(r.text, 30, 1).lines.map((row, li) => (
                        <React.Fragment key={li}>
                            {li > 0 ? <br /> : null}
                            {row.map((word, wi) =>
                                word.gap ? (
                                    <React.Fragment key={wi}> </React.Fragment>
                                ) : (
                                    <span
                                        key={wi}
                                        style={{ whiteSpace: "nowrap" }}
                                    >
                                        {Array.from(word.text).map((ch, ci) => (
                                            <span
                                                key={ci}
                                                style={{
                                                    display: "inline-block",
                                                    whiteSpace: "pre",
                                                }}
                                            >
                                                {ch}
                                            </span>
                                        ))}
                                    </span>
                                )
                            )}
                        </React.Fragment>
                    ))}
                </p>
            </div>
        </div>
    )
}

// ─── live branch ────────────────────────────────────────────────────────────

function LiveField(r: Resolved) {
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const K = `cc${uid}`

    const rootRef = React.useRef<HTMLDivElement>(null)
    const textRef = React.useRef<HTMLDivElement>(null)
    const paraRef = React.useRef<HTMLParagraphElement>(null)
    const caretRef = React.useRef<HTMLSpanElement>(null)
    const movers = React.useRef<(HTMLDivElement | null)[]>([])
    const glyphs = React.useRef<HTMLElement[]>([])

    const spots = React.useMemo(
        () => scatter(r.items, r.cards),
        [r.items, r.cards]
    )
    const script = React.useMemo(
        () => compose(r.text, r.typing.speed, r.typing.pause),
        [r.text, r.typing.speed, r.typing.pause]
    )

    // Latest props for the loop and handlers, without restarting the loop on edits.
    const latest = React.useRef({
        spots,
        script,
        cards: r.cards,
        typing: r.typing,
        motion: r.motion,
    })
    latest.current = {
        spots,
        script,
        cards: r.cards,
        typing: r.typing,
        motion: r.motion,
    }

    const engine = React.useRef({
        raf: 0,
        running: false,
        last: 0,
        clock: 0,
        drift: 0,
        typed: 0,
        typeFrom: 0,
        finished: false,
        aimX: 0,
        aimY: 0,
        posX: 0,
        posY: 0,
        calm: false,
        wake: () => {},
    })

    const placeCaret = React.useCallback((count: number) => {
        const caret = caretRef.current
        const list = glyphs.current
        if (!caret || !list.length) return
        const anchor =
            count > 0 ? list[Math.min(count, list.length) - 1] : list[0]
        const h = anchor.offsetHeight
        const x =
            count > 0
                ? anchor.offsetLeft + anchor.offsetWidth + 1
                : anchor.offsetLeft - 1
        const y = anchor.offsetTop + h * 0.1
        caret.style.height = `${(h * 0.8).toFixed(1)}px`
        caret.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    }, [])

    // Collect glyph nodes and restart typing whenever the words change.
    React.useLayoutEffect(() => {
        const para = paraRef.current
        glyphs.current = para
            ? Array.from(para.querySelectorAll<HTMLElement>(`.${K}-ch`))
            : []
        const e = engine.current
        e.typed = 0
        e.finished = false
        e.typeFrom = e.clock
        caretRef.current?.classList.remove(`${K}-typing`, `${K}-blink`)
        placeCaret(0)
        e.wake()
    }, [script, K, placeCaret])

    React.useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const e = engine.current
        const hasIO = typeof IntersectionObserver !== "undefined"
        const gate = {
            seen: !hasIO,
            tab:
                typeof document === "undefined" ||
                document.visibilityState !== "hidden",
        }
        const mq =
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function"
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        e.calm = !!mq?.matches

        const permitted = () => gate.seen && gate.tab

        const caretAfterTyping = () => {
            const caret = caretRef.current
            if (!caret) return
            const T = latest.current.typing
            caret.classList.remove(`${K}-typing`)
            if (T.caret && T.caretAfter === "blink")
                caret.classList.add(e.calm ? `${K}-typing` : `${K}-blink`)
        }

        const settleAll = () => {
            const { spots: S, cards: C } = latest.current
            root.classList.add(`${K}-calm`)
            glyphs.current.forEach((g) => g.classList.add(`${K}-on`))
            e.typed = glyphs.current.length
            e.finished = true
            placeCaret(e.typed)
            caretAfterTyping()
            S.forEach((spot, i) => {
                const el = movers.current[i]
                if (!el) return
                el.style.transform = "none"
                el.style.opacity = String(restOpacity(spot, C.haze))
            })
            if (textRef.current) textRef.current.style.transform = "none"
        }

        const rewind = () => {
            e.clock = 0
            e.typeFrom = 0
            e.typed = 0
            e.finished = false
            glyphs.current.forEach((g) => g.classList.remove(`${K}-on`))
            caretRef.current?.classList.remove(`${K}-typing`, `${K}-blink`)
            placeCaret(0)
            if (latest.current.motion.entrance)
                movers.current.forEach((el) => el && (el.style.opacity = "0"))
        }

        const frame = (now: number) => {
            e.raf = 0
            if (!permitted() || e.calm) {
                e.running = false
                return
            }
            const {
                spots: S,
                script: W,
                cards: C,
                typing: T,
                motion: M,
            } = latest.current
            const dt = Math.min(0.05, Math.max(0, (now - e.last) / 1000))
            e.last = now
            e.clock += dt
            e.drift += dt * M.floatSpeed

            const k = 1 - Math.exp(-dt * 6.5)
            e.posX += (e.aimX - e.posX) * k
            e.posY += (e.aimY - e.posY) * k

            const entranceSpan = M.entrance ? S.length * M.stagger + 0.95 : 0
            for (let i = 0; i < S.length; i++) {
                const el = movers.current[i]
                if (!el) continue
                const spot = S[i]
                const t = M.entrance
                    ? clamp01((e.clock - spot.rank * M.stagger) / 0.95)
                    : 1
                const pop = easeOutBack(t)
                const fade = easeOutCubic(clamp01(t * 1.5))
                const reach = 0.3 + 0.7 * spot.depth
                const amp = M.float * (0.55 + 0.45 * spot.depth)
                const pull = (1 - pop) * 46
                const x =
                    -e.posX * M.parallax * reach +
                    Math.cos(e.drift * 0.8 + spot.phase * 1.3) * amp * 0.45 +
                    spot.towardX * pull
                const y =
                    -e.posY * M.parallax * reach +
                    Math.sin(e.drift + spot.phase) * amp +
                    spot.towardY * pull
                el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${(0.78 + 0.22 * pop).toFixed(4)})`
                el.style.opacity = (restOpacity(spot, C.haze) * fade).toFixed(3)
            }

            if (textRef.current) {
                textRef.current.style.transform = `translate3d(${(-e.posX * M.textDrift).toFixed(2)}px, ${(-e.posY * M.textDrift).toFixed(2)}px, 0)`
            }

            const total = W.times.length
            const at = e.clock - e.typeFrom - T.delay
            if (at >= 0 && e.typed < total) {
                const caret = caretRef.current
                if (
                    caret &&
                    T.caret &&
                    !caret.classList.contains(`${K}-typing`)
                )
                    caret.classList.add(`${K}-typing`)
                let n = e.typed
                const list = glyphs.current
                while (n < total && W.times[n] <= at) {
                    list[n]?.classList.add(`${K}-on`)
                    n++
                }
                if (n !== e.typed) {
                    e.typed = n
                    placeCaret(n)
                }
            }
            const typedAll = e.typed >= total
            if (typedAll && !e.finished && at >= 0) {
                e.finished = true
                caretAfterTyping()
            }

            const moving =
                Math.abs(e.aimX - e.posX) > 0.0008 ||
                Math.abs(e.aimY - e.posY) > 0.0008
            const busy =
                e.clock < entranceSpan || !e.finished || M.float > 0 || moving
            if (busy) {
                e.raf = requestAnimationFrame(frame)
            } else {
                e.posX = e.aimX
                e.posY = e.aimY
                e.running = false
            }
        }

        const wake = () => {
            if (!permitted()) return
            if (e.calm) {
                settleAll()
                return
            }
            if (e.finished) caretAfterTyping()
            if (e.running) return
            e.running = true
            e.last = performance.now()
            e.raf = requestAnimationFrame(frame)
        }

        const park = () => {
            if (e.raf) cancelAnimationFrame(e.raf)
            e.raf = 0
            e.running = false
            e.aimX = e.aimY = e.posX = e.posY = 0
            caretRef.current?.classList.remove(`${K}-blink`)
        }

        e.wake = wake

        let io: IntersectionObserver | null = null
        if (hasIO) {
            io = new IntersectionObserver((entries) => {
                const entry = entries[entries.length - 1]
                gate.seen = !!entry?.isIntersecting
                if (gate.seen) {
                    wake()
                } else {
                    park()
                    if (latest.current.typing.replay && !e.calm && e.clock > 0)
                        rewind()
                }
            })
            io.observe(root)
        }

        const onTab = () => {
            gate.tab = document.visibilityState !== "hidden"
            if (gate.tab) wake()
            else park()
        }
        document.addEventListener("visibilitychange", onTab)

        const onMotionPref = () => {
            e.calm = !!mq?.matches
            if (e.calm) {
                park()
                settleAll()
            } else {
                root.classList.remove(`${K}-calm`)
                wake()
            }
        }
        mq?.addEventListener?.("change", onMotionPref)

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined" && paraRef.current) {
            ro = new ResizeObserver(() => placeCaret(e.typed))
            ro.observe(paraRef.current)
        }

        if (!hasIO) wake()

        return () => {
            park()
            e.wake = () => {}
            io?.disconnect()
            ro?.disconnect()
            document.removeEventListener("visibilitychange", onTab)
            mq?.removeEventListener?.("change", onMotionPref)
        }
    }, [K, placeCaret])

    // Re-apply after any prop edit (new cards, haze, count) even if the loop is asleep.
    React.useEffect(() => {
        engine.current.wake()
    })

    const onPointerMove = (ev: React.PointerEvent<HTMLDivElement>) => {
        const box = rootRef.current?.getBoundingClientRect()
        if (!box || !box.width || !box.height) return
        const e = engine.current
        e.aimX = clamp01((ev.clientX - box.left) / box.width) * 2 - 1
        e.aimY = clamp01((ev.clientY - box.top) / box.height) * 2 - 1
        e.wake()
    }

    const onPointerLeave = () => {
        const e = engine.current
        e.aimX = 0
        e.aimY = 0
        e.wake()
    }

    const C = r.cards
    const T = r.typing
    const M = r.motion
    const fill = `linear-gradient(180deg, ${C.fillTop}, ${C.fillBottom})`
    const ease = "cubic-bezier(.16,1,.3,1)"

    const css = `
.${K}-root *{box-sizing:border-box}
.${K}-ch{display:inline-block;opacity:0;white-space:pre}
.${K}-soft .${K}-ch{filter:blur(8px);transform:translateY(.32em) scale(.94);transition:opacity .5s ${ease},filter .55s ${ease},transform .6s ${ease}}
.${K}-crisp .${K}-ch{transition:opacity .07s linear}
.${K}-ch.${K}-on{opacity:1;filter:blur(0);transform:none}
.${K}-calm .${K}-ch{transition:none!important}
.${K}-caret{position:absolute;left:0;top:0;width:max(2px,.075em);border-radius:2px;opacity:0;pointer-events:none;transition:opacity .25s ease,transform .09s linear}
.${K}-caret.${K}-typing{opacity:1}
.${K}-caret.${K}-blink{opacity:1;animation:${K}-blink 1.1s ease-in-out infinite}
@keyframes ${K}-blink{0%,42%{opacity:1}58%,100%{opacity:0}}
.${K}-slot:hover,.${K}-slot:focus-within{z-index:400!important}
.${K}-face{position:absolute;inset:0;display:block;color:inherit;text-decoration:none;outline:none;cursor:default}
a.${K}-face{cursor:pointer}
.${K}-tile{position:absolute;inset:0;overflow:hidden;isolation:isolate;transition:transform .55s ${ease},box-shadow .55s ${ease}}
.${K}-tile img{transition:transform .8s ${ease}}
.${K}-face:hover .${K}-tile,.${K}-face:focus-visible .${K}-tile{transform:translateY(calc(var(--${K}-lift) * -1)) scale(1.05)}
.${K}-face:hover .${K}-tile img{transform:scale(1.06)}
.${K}-face:focus-visible .${K}-tile{outline:2px solid currentColor;outline-offset:3px}
.${K}-shadow .${K}-tile{box-shadow:0 1px 2px rgba(24,18,32,.06),0 12px 26px -10px rgba(24,18,32,.28)}
.${K}-shadow .${K}-face:hover .${K}-tile{box-shadow:0 2px 4px rgba(24,18,32,.08),0 24px 40px -14px rgba(24,18,32,.38)}
.${K}-tag{position:absolute;left:50%;top:calc(100% + 10px);display:flex;gap:6px;align-items:baseline;padding:6px 11px;border-radius:999px;font-size:12px;line-height:1.2;white-space:nowrap;pointer-events:none;opacity:0;transform:translate(-50%,-5px);transition:opacity .3s ease,transform .45s ${ease};box-shadow:0 6px 18px -6px rgba(24,18,32,.25)}
.${K}-face:hover .${K}-tag,.${K}-face:focus-visible .${K}-tag{opacity:1;transform:translate(-50%,0)}
`

    const rootClass = [
        `${K}-root`,
        T.style === "crisp" ? `${K}-crisp` : `${K}-soft`,
        C.shadow ? `${K}-shadow` : "",
    ]
        .filter(Boolean)
        .join(" ")

    return (
        <div
            ref={rootRef}
            className={rootClass}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            style={
                {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background: r.background,
                    containerType: "size",
                    [`--${K}-lift` as any]: `${M.lift}px`,
                    ...r.style,
                } as React.CSSProperties
            }
        >
            <style>{css}</style>

            {spots.map((spot, i) => {
                const item = spot.item
                const src = sourceOf(item)
                const label = item.title || ""
                const Face: any = item.link ? "a" : "div"
                const faceProps = item.link
                    ? {
                          href: item.link,
                          target: item.newTab ? "_blank" : undefined,
                          rel: item.newTab ? "noopener noreferrer" : undefined,
                          "aria-label":
                              [item.title, item.caption]
                                  .filter(Boolean)
                                  .join(", ") || undefined,
                      }
                    : {}
                return (
                    <div
                        key={i}
                        className={`${K}-slot`}
                        style={spotBox(spot, C)}
                    >
                        <div
                            ref={(el) => {
                                movers.current[i] = el
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                willChange: "transform, opacity",
                                opacity: M.entrance
                                    ? 0
                                    : restOpacity(spot, C.haze),
                            }}
                        >
                            <Face className={`${K}-face`} {...faceProps}>
                                <div
                                    className={`${K}-tile`}
                                    style={{
                                        borderRadius: C.radius,
                                        background: fill,
                                    }}
                                >
                                    <div
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "rgba(255,255,255,0.85)",
                                            fontFamily: r.type.fontFamily,
                                            fontWeight: 600,
                                            fontSize:
                                                "clamp(10px, 22cqmin, 28px)",
                                            letterSpacing: "0.02em",
                                        }}
                                    >
                                        {monogram(item.title)}
                                    </div>
                                    {src ? (
                                        <img
                                            src={src}
                                            alt={item.image?.alt || label}
                                            draggable={false}
                                            loading="lazy"
                                            decoding="async"
                                            onError={(ev) => {
                                                ev.currentTarget.style.visibility =
                                                    "hidden"
                                            }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: C.fit,
                                                objectPosition:
                                                    C.fit === "contain"
                                                        ? "50% 100%"
                                                        : "50% 50%",
                                            }}
                                        />
                                    ) : null}
                                </div>
                                {C.labels && (item.title || item.caption) ? (
                                    <div
                                        className={`${K}-tag`}
                                        style={{
                                            background: C.labelFill,
                                            color: C.labelText,
                                            fontFamily: r.type.fontFamily,
                                        }}
                                    >
                                        {item.title ? (
                                            <span style={{ fontWeight: 600 }}>
                                                {item.title}
                                            </span>
                                        ) : null}
                                        {item.caption ? (
                                            <span style={{ opacity: 0.58 }}>
                                                {item.caption}
                                            </span>
                                        ) : null}
                                    </div>
                                ) : null}
                            </Face>
                        </div>
                    </div>
                )
            })}

            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: `min(${r.textWidth}px, calc(100% - 32px))`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 200,
                    pointerEvents: "none",
                }}
            >
                <div ref={textRef} style={{ willChange: "transform" }}>
                    <p
                        ref={paraRef}
                        style={{
                            ...r.type,
                            color: r.textColor,
                            margin: 0,
                            position: "relative",
                        }}
                    >
                        <span style={srOnly}>{r.text}</span>
                        <span aria-hidden="true">
                            {script.lines.map((row, li) => (
                                <React.Fragment key={li}>
                                    {li > 0 ? <br /> : null}
                                    {row.map((word, wi) =>
                                        word.gap ? (
                                            <React.Fragment key={wi}>
                                                {" "}
                                            </React.Fragment>
                                        ) : (
                                            <span
                                                key={wi}
                                                style={{ whiteSpace: "nowrap" }}
                                            >
                                                {Array.from(word.text).map(
                                                    (ch, ci) => (
                                                        <span
                                                            key={ci}
                                                            className={`${K}-ch`}
                                                        >
                                                            {ch}
                                                        </span>
                                                    )
                                                )}
                                            </span>
                                        )
                                    )}
                                </React.Fragment>
                            ))}
                        </span>
                        {T.caret ? (
                            <span
                                ref={caretRef}
                                aria-hidden="true"
                                className={`${K}-caret`}
                                style={{ background: T.caretColor }}
                            />
                        ) : null}
                    </p>
                </div>
            </div>
        </div>
    )
}

// ─── property controls ──────────────────────────────────────────────────────

addPropertyControls(Concourse, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: SAMPLE_TEXT,
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 34,
            variant: "Medium",
            letterSpacing: "-0.02em",
            lineHeight: "1.18em",
            textAlign: "center",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#1C1C1E",
    },
    textWidth: {
        type: ControlType.Number,
        title: "Text Width",
        defaultValue: 640,
        min: 160,
        max: 1400,
        step: 10,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F4F4F2",
    },
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 32,
        defaultValue: SAMPLE_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    defaultValue: "",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "New Card",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "Caption",
                },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                },
            },
        },
    },
    cards: {
        type: ControlType.Object,
        title: "Card Style",
        controls: {
            count: {
                type: ControlType.Number,
                title: "Shown",
                defaultValue: CARD_DEFAULTS.count,
                min: 1,
                max: SCATTER.length,
                step: 1,
                displayStepper: true,
            },
            scale: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: CARD_DEFAULTS.scale,
                min: 0.5,
                max: 2,
                step: 0.05,
            },
            aspect: {
                type: ControlType.Number,
                title: "Height Ratio",
                defaultValue: CARD_DEFAULTS.aspect,
                min: 0.7,
                max: 1.8,
                step: 0.05,
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                defaultValue: CARD_DEFAULTS.spread,
                min: 0.6,
                max: 1.3,
                step: 0.01,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: CARD_DEFAULTS.radius,
                min: 0,
                max: 40,
                unit: "px",
            },
            fit: {
                type: ControlType.Enum,
                title: "Image Fit",
                options: ["cover", "contain"],
                optionTitles: ["Fill", "Fit"],
                defaultValue: CARD_DEFAULTS.fit,
                displaySegmentedControl: true,
            },
            fillTop: {
                type: ControlType.Color,
                title: "Fill Top",
                defaultValue: CARD_DEFAULTS.fillTop,
            },
            fillBottom: {
                type: ControlType.Color,
                title: "Fill Bottom",
                defaultValue: CARD_DEFAULTS.fillBottom,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: CARD_DEFAULTS.shadow,
            },
            haze: {
                type: ControlType.Number,
                title: "Depth Haze",
                defaultValue: CARD_DEFAULTS.haze,
                min: 0,
                max: 0.8,
                step: 0.01,
            },
            labels: {
                type: ControlType.Boolean,
                title: "Hover Label",
                defaultValue: CARD_DEFAULTS.labels,
            },
            labelFill: {
                type: ControlType.Color,
                title: "Label Fill",
                defaultValue: CARD_DEFAULTS.labelFill,
                hidden: (p: any) => !p.labels,
            },
            labelText: {
                type: ControlType.Color,
                title: "Label Text",
                defaultValue: CARD_DEFAULTS.labelText,
                hidden: (p: any) => !p.labels,
            },
        },
    },
    typing: {
        type: ControlType.Object,
        title: "Typing",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Reveal",
                options: ["soft", "crisp"],
                optionTitles: ["Soft", "Crisp"],
                defaultValue: TYPING_DEFAULTS.style,
                displaySegmentedControl: true,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: TYPING_DEFAULTS.speed,
                min: 8,
                max: 160,
                step: 1,
                unit: "/s",
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                defaultValue: TYPING_DEFAULTS.delay,
                min: 0,
                max: 4,
                step: 0.05,
                unit: "s",
            },
            pause: {
                type: ControlType.Number,
                title: "Punctuation",
                defaultValue: TYPING_DEFAULTS.pause,
                min: 0,
                max: 3,
                step: 0.1,
            },
            caret: {
                type: ControlType.Boolean,
                title: "Caret",
                defaultValue: TYPING_DEFAULTS.caret,
            },
            caretColor: {
                type: ControlType.Color,
                title: "Caret Color",
                defaultValue: TYPING_DEFAULTS.caretColor,
                hidden: (p: any) => !p.caret,
            },
            caretAfter: {
                type: ControlType.Enum,
                title: "When Done",
                options: ["blink", "hide"],
                optionTitles: ["Blink", "Hide"],
                defaultValue: TYPING_DEFAULTS.caretAfter,
                displaySegmentedControl: true,
                hidden: (p: any) => !p.caret,
            },
            replay: {
                type: ControlType.Boolean,
                title: "Replay",
                defaultValue: TYPING_DEFAULTS.replay,
                enabledTitle: "On View",
                disabledTitle: "Once",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            parallax: {
                type: ControlType.Number,
                title: "Parallax",
                defaultValue: MOTION_DEFAULTS.parallax,
                min: 0,
                max: 90,
                unit: "px",
            },
            textDrift: {
                type: ControlType.Number,
                title: "Text Drift",
                defaultValue: MOTION_DEFAULTS.textDrift,
                min: 0,
                max: 40,
                unit: "px",
            },
            float: {
                type: ControlType.Number,
                title: "Float",
                defaultValue: MOTION_DEFAULTS.float,
                min: 0,
                max: 20,
                unit: "px",
            },
            floatSpeed: {
                type: ControlType.Number,
                title: "Float Speed",
                defaultValue: MOTION_DEFAULTS.floatSpeed,
                min: 0.1,
                max: 3,
                step: 0.05,
                hidden: (p: any) => !p.float,
            },
            entrance: {
                type: ControlType.Boolean,
                title: "Entrance",
                defaultValue: MOTION_DEFAULTS.entrance,
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: MOTION_DEFAULTS.stagger,
                min: 0,
                max: 0.25,
                step: 0.01,
                unit: "s",
                hidden: (p: any) => !p.entrance,
            },
            lift: {
                type: ControlType.Number,
                title: "Hover Lift",
                defaultValue: MOTION_DEFAULTS.lift,
                min: 0,
                max: 24,
                unit: "px",
            },
        },
    },
})
