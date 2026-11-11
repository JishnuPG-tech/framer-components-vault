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


type Entry = {
    tabLabel?: string
    eyebrow?: string
    leadLine?: string
    accentLine?: string
    description?: string
    note?: string
    image?: { src?: string; alt?: string } | string
    imageUrl?: string
    buttonLabel?: string
    buttonLink?: string
    buttonNewTab?: boolean
    secondaryLabel?: string
    secondaryLink?: string
    secondaryNewTab?: boolean
}

const SEED_ENTRIES: Entry[] = [
    {
        tabLabel: "Overview",
        eyebrow: "Overview",
        leadLine: "Built around",
        accentLine: "how you work.",
        description:
            "One flexible space for ideas, projects and the people behind them, shaped to fit your process instead of replacing it.",
        note: "Available on every plan",
        buttonLabel: "Get started",
        buttonLink: "",
        buttonNewTab: false,
        secondaryLabel: "Take a tour",
        secondaryLink: "",
        secondaryNewTab: false,
    },
    {
        tabLabel: "Features",
        eyebrow: "Features",
        leadLine: "Everything you need,",
        accentLine: "nothing you don't.",
        description:
            "Thoughtful tools that stay out of the way until the moment you reach for them.",
        note: "40+ built-in tools",
        buttonLabel: "Explore features",
        buttonLink: "",
        buttonNewTab: false,
        secondaryLabel: "Compare plans",
        secondaryLink: "",
        secondaryNewTab: false,
    },
    {
        tabLabel: "Process",
        eyebrow: "Process",
        leadLine: "From first idea",
        accentLine: "to final launch.",
        description:
            "A clear path through planning, building and shipping, with checkpoints that keep everyone in step.",
        note: "Four guided stages",
        buttonLabel: "See how it works",
        buttonLink: "",
        buttonNewTab: false,
        secondaryLabel: "",
        secondaryLink: "",
        secondaryNewTab: false,
    },
    {
        tabLabel: "Results",
        eyebrow: "Results",
        leadLine: "Less noise,",
        accentLine: "more momentum.",
        description:
            "Teams spend fewer hours chasing updates and more time on the work that moves things forward.",
        note: "Trusted by growing teams",
        buttonLabel: "View case studies",
        buttonLink: "",
        buttonNewTab: false,
        secondaryLabel: "Talk to us",
        secondaryLink: "",
        secondaryNewTab: false,
    },
]

const SWATCH_SETS = [
    ["#D9CFBF", "#B5543A", "#2F4A3A", "#E8B04B"],
    ["#5A2E2A", "#E8B04B", "#EEE8DD", "#2B1B22"],
    ["#3E5468", "#EEE8DD", "#7FA0A8", "#D9CFBF"],
    ["#2F4A3A", "#C8C2B4", "#6B7F6A", "#E8B04B"],
]

/* ---------- pure data helpers (no markup, no styles that animate) ---------- */

function pictureOf(entry: Entry): string {
    const img = entry.image
    if (typeof img === "string" && img) return img
    if (img && typeof img === "object" && img.src) return img.src
    return entry.imageUrl || ""
}

function altOf(entry: Entry): string {
    const img = entry.image
    if (img && typeof img === "object" && img.alt) return img.alt
    return [entry.leadLine, entry.accentLine].filter(Boolean).join(" ")
}

function placeholderShapes(slot: number): React.CSSProperties[] {
    const c = SWATCH_SETS[slot % SWATCH_SETS.length]
    return [
        { position: "absolute", inset: 0, background: c[0] },
        {
            position: "absolute",
            width: "34%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            background: c[1],
            right: "10%",
            top: "12%",
        },
        {
            position: "absolute",
            width: "120%",
            height: "46%",
            borderRadius: "50% 50% 0 0",
            background: c[2],
            left: "-10%",
            bottom: "12%",
        },
        {
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: "16%",
            background: c[3],
        },
    ]
}

function eyebrowText(entry: Entry, slot: number, numbered: boolean): string {
    const n = String(slot + 1).padStart(2, "0")
    if (!entry.eyebrow) return numbered ? n : ""
    return numbered ? `${n} · ${entry.eyebrow}` : entry.eyebrow
}

function frameGeometry(p: any, compact: boolean) {
    const gutter = p.frame.gutter
    const topBand = 44
    const stripBand = 56
    const flipped = p.frame.cardSide === "left"
    const sweep = p.frame.sweepCorner
    const r = p.frame.radius
    const corner = flipped
        ? `${r}px ${r}px ${r}px ${sweep}px`
        : `${r}px ${r}px ${sweep}px ${r}px`
    const picture: React.CSSProperties = compact
        ? {
              left: gutter,
              right: gutter,
              top: gutter + topBand,
              bottom: gutter + stripBand + 16,
              borderRadius: r,
          }
        : {
              [flipped ? "right" : "left"]: gutter,
              width: `calc(${p.frame.pictureWidth}% - ${gutter}px)`,
              top: gutter + topBand,
              bottom: gutter + stripBand + 24,
              borderRadius: corner,
          }
    const plate: React.CSSProperties = compact
        ? {
              left: gutter + 10,
              right: gutter + 10,
              bottom: gutter + stripBand + 28,
          }
        : {
              [flipped ? "left" : "right"]: gutter,
              top: p.frame.plateTop,
              width: `${p.frame.plateWidth}%`,
          }
    return { gutter, topBand, stripBand, picture, plate }
}

/* ------------------------------- entry -------------------------------- */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Frontispiece(props: any) {
    const still = useIsStaticRenderer()
    if (still) return <StillPlate {...props} />
    return <LivePlate {...props} />
}

/* ---------------------------- static branch ---------------------------- */

function StillPlate(props: any) {
    const p = withFallbacks(props)
    const entries: Entry[] = p.entries
    const first = entries[0] || {}
    const g = frameGeometry(p, false)
    const ink = p.ink
    const src = pictureOf(first)

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: ink.page,
                borderRadius: p.frame.outerRadius,
                fontFamily: "Inter, system-ui, sans-serif",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: g.gutter,
                    right: g.gutter,
                    top: g.gutter - 2,
                    height: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: ink.kicker,
                        ...p.labelFont,
                    }}
                >
                    {p.kicker}
                </span>
                {p.showArrows && (
                    <div style={{ display: "flex", gap: 6 }}>
                        {["M15 18l-6-6 6-6", "M9 18l6-6-6-6"].map((d) => (
                            <div
                                key={d}
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: "50%",
                                    border: `1px solid ${ink.arrowRing}`,
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={ink.arrowGlyph}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d={d} />
                                </svg>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div
                style={{
                    position: "absolute",
                    overflow: "hidden",
                    background: ink.chipRest,
                    ...g.picture,
                }}
            >
                {src ? (
                    <img
                        src={src}
                        alt={altOf(first)}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    placeholderShapes(0).map((s, k) => (
                        <div key={k} style={s} />
                    ))
                )}
            </div>

            <div
                style={{
                    position: "absolute",
                    background: ink.plate,
                    color: ink.plateText,
                    borderRadius: p.frame.radius - 2,
                    padding: `${p.frame.platePadding}px ${p.frame.platePadding}px ${p.frame.platePadding - 4}px`,
                    boxSizing: "border-box",
                    ...g.plate,
                }}
            >
                <div
                    style={{
                        fontSize: 11,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: ink.accent,
                        marginBottom: 12,
                        ...p.labelFont,
                    }}
                >
                    {eyebrowText(first, 0, p.numberedEyebrow)}
                </div>
                <div
                    style={{
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: 28,
                        lineHeight: 1.06,
                        ...p.headlineFont,
                    }}
                >
                    {first.leadLine}
                </div>
                <div
                    style={{
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontSize: 28,
                        lineHeight: 1.06,
                        ...p.headlineFont,
                        fontStyle: p.italicAccent ? "italic" : "normal",
                        color: ink.accent,
                        marginBottom: 12,
                    }}
                >
                    {first.accentLine}
                </div>
                <div
                    style={{
                        fontSize: 13,
                        lineHeight: 1.55,
                        color: ink.plateMuted,
                        marginBottom: 16,
                        ...p.bodyFont,
                    }}
                >
                    {first.description}
                </div>
                {first.note && (
                    <div
                        style={{
                            fontSize: 12,
                            color: ink.plateFaint,
                            marginBottom: 14,
                            ...p.bodyFont,
                        }}
                    >
                        {first.note}
                    </div>
                )}
                {first.buttonLabel && (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: 14,
                            borderTop: `1px solid ${ink.rule}`,
                        }}
                    >
                        <span style={{ fontSize: 15, ...p.buttonFont }}>
                            {first.buttonLabel}
                        </span>
                        <div
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: "50%",
                                background: ink.accent,
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={ink.accentInk}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                        </div>
                    </div>
                )}
                {first.secondaryLabel && (
                    <div
                        style={{
                            marginTop: 10,
                            fontSize: 12,
                            color: ink.plateMuted,
                            textDecoration: "underline",
                            textUnderlineOffset: 3,
                            ...p.buttonFont,
                        }}
                    >
                        {first.secondaryLabel}
                    </div>
                )}
            </div>

            <div
                style={{
                    position: "absolute",
                    left: g.gutter,
                    right: g.gutter,
                    bottom: g.gutter,
                    display: "flex",
                    gap: 8,
                }}
            >
                {entries.map((e, i) => {
                    const on = i === 0
                    const thumb = pictureOf(e)
                    return (
                        <div
                            key={i}
                            style={{
                                position: "relative",
                                flex: `${on ? p.activeStretch : 1} 1 0`,
                                minWidth: 0,
                                height: g.stripBand,
                                borderRadius: 14,
                                padding: "0 8px",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                overflow: "hidden",
                                background: on ? ink.chipOn : ink.chipRest,
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    flex: "0 0 40px",
                                    height: 40,
                                    borderRadius: 10,
                                    overflow: "hidden",
                                }}
                            >
                                {thumb ? (
                                    <img
                                        src={thumb}
                                        alt=""
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    placeholderShapes(i).map((s, k) => (
                                        <div key={k} style={s} />
                                    ))
                                )}
                            </div>
                            <div
                                style={{
                                    minWidth: 0,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontFamily: "ui-monospace, monospace",
                                        color: ink.chipIndex,
                                    }}
                                >
                                    {String(i + 1).padStart(2, "0")}
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: on
                                            ? ink.chipTextOn
                                            : ink.chipText,
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                        ...p.labelFont,
                                    }}
                                >
                                    {e.tabLabel}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ----------------------------- live branch ----------------------------- */

function useSeenOnScreen(target: React.RefObject<HTMLElement>) {
    const [seen, setSeen] = React.useState(false)
    React.useEffect(() => {
        const node = target.current
        if (!node) return
        if (typeof IntersectionObserver === "undefined") {
            setSeen(true)
            return
        }
        const io = new IntersectionObserver(
            (rows) => setSeen(rows.some((r) => r.isIntersecting)),
            { threshold: 0.05 }
        )
        io.observe(node)
        return () => io.disconnect()
    }, [target])
    return seen
}

function useTabAwake() {
    const [awake, setAwake] = React.useState(
        typeof document === "undefined"
            ? true
            : document.visibilityState !== "hidden"
    )
    React.useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setAwake(document.visibilityState !== "hidden")
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])
    return awake
}

function usePrefersStill() {
    const [still, setStill] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setStill(q.matches)
        sync()
        q.addEventListener?.("change", sync)
        return () => q.removeEventListener?.("change", sync)
    }, [])
    return still
}

function useNarrow(target: React.RefObject<HTMLElement>, below: number) {
    const [narrow, setNarrow] = React.useState(false)
    React.useEffect(() => {
        const node = target.current
        if (!node || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(([row]) =>
            setNarrow(row.contentRect.width < below)
        )
        ro.observe(node)
        return () => ro.disconnect()
    }, [target, below])
    return narrow
}

function LivePlate(props: any) {
    const p = withFallbacks(props)
    const entries: Entry[] = p.entries
    const total = entries.length
    const ink = p.ink

    const shell = React.useRef<HTMLDivElement>(null)
    const seen = useSeenOnScreen(shell)
    const awake = useTabAwake()
    const prefersStill = usePrefersStill()
    const narrow = useNarrow(shell, 540)
    const [resting, setResting] = React.useState(false)

    const rawId = React.useId()
    const tag = "fp" + rawId.replace(/[^a-zA-Z0-9]/g, "")

    const [view, setView] = React.useState({ at: 0, from: -1, turn: 0 })
    const viewRef = React.useRef(view)
    viewRef.current = view

    const live = React.useRef(p)
    live.current = p

    const meters = React.useRef<(HTMLSpanElement | null)[]>([])
    const spent = React.useRef(0)

    const paintMeters = React.useCallback((ratio: number) => {
        const at = viewRef.current.at
        meters.current.forEach((m, i) => {
            if (m) m.style.width = i === at ? `${ratio * 100}%` : "0%"
        })
    }, [])

    const turnTo = React.useCallback(
        (n: number) => {
            if (!total) return
            const next = ((n % total) + total) % total
            spent.current = 0
            setView((v) =>
                next === v.at ? v : { at: next, from: v.at, turn: v.turn + 1 }
            )
        },
        [total]
    )
    const turnRef = React.useRef(turnTo)
    turnRef.current = turnTo

    React.useEffect(() => {
        paintMeters(0)
    }, [view.at, paintMeters])

    const permitted =
        p.motion.autoplay &&
        seen &&
        awake &&
        !prefersStill &&
        !(p.motion.pauseOnHover && resting) &&
        total > 1
    const permit = React.useRef(false)
    permit.current = permitted

    React.useEffect(() => {
        if (!permitted) return
        let frame = 0
        let prior = 0
        const pulse = (now: number) => {
            if (!permit.current) {
                frame = 0
                return
            }
            if (prior) spent.current += now - prior
            prior = now
            const span = Math.max(1, live.current.motion.dwell) * 1000
            const ratio = Math.min(spent.current / span, 1)
            paintMeters(ratio)
            if (ratio >= 1) turnRef.current(viewRef.current.at + 1)
            frame = requestAnimationFrame(pulse)
        }
        frame = requestAnimationFrame(pulse)
        return () => cancelAnimationFrame(frame)
    }, [permitted, paintMeters])

    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            turnTo(view.at + 1)
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            turnTo(view.at - 1)
        }
    }

    const g = frameGeometry(p, narrow)
    const current = entries[view.at] || {}
    const moving = !prefersStill
    const reveal = Math.max(0.1, p.motion.reveal)
    const originX = total > 1 ? 8 + (view.at / (total - 1)) * 84 : 50

    const keyframes = `
@keyframes ${tag}open{from{clip-path:circle(0% at var(--${tag}x) 118%)}to{clip-path:circle(150% at var(--${tag}x) 118%)}}
@keyframes ${tag}rise{from{transform:translateY(108%);opacity:0}to{transform:none;opacity:1}}
.${tag}chip{transition:flex-grow .6s cubic-bezier(.2,.8,.2,1),background-color .3s ease}
.${tag}chip:focus-visible,.${tag}nav:focus-visible,.${tag}read:focus-visible{outline:2px solid ${ink.accent};outline-offset:2px}
.${tag}nav{transition:background-color .25s ease}
.${tag}nav:hover{background:${ink.arrowHover}}
.${tag}read .${tag}orb{transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.${tag}read:hover .${tag}orb{transform:rotate(-45deg)}
.${tag}read .${tag}words{background:linear-gradient(${ink.accent},${ink.accent}) 0 100%/0 1px no-repeat;transition:background-size .4s ease;padding-bottom:2px}
.${tag}read:hover .${tag}words{background-size:100% 1px}
.${tag}alt{transition:color .25s ease}
.${tag}alt:hover{color:${ink.plateText}}
.${tag}alt:focus-visible{outline:2px solid ${ink.accent};outline-offset:2px}
`

    const rise = (order: number): React.CSSProperties =>
        moving && view.turn > 0
            ? {
                  display: "block",
                  animation: `${tag}rise ${Math.max(0.2, reveal * 0.7)}s cubic-bezier(.2,.8,.2,1) ${0.12 + order * 0.06}s both`,
              }
            : { display: "block" }

    const pictureLayer = (idx: number, animated: boolean) => {
        const e = entries[idx] || {}
        const src = pictureOf(e)
        const layerStyle: React.CSSProperties = {
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            ...(animated
                ? ({
                      [`--${tag}x` as any]: `${originX}%`,
                      animation: `${tag}open ${reveal}s cubic-bezier(.65,0,.2,1) both`,
                  } as React.CSSProperties)
                : {}),
        }
        return (
            <div
                key={animated ? `on-${view.turn}` : `base-${idx}`}
                style={layerStyle}
            >
                {src ? (
                    <img
                        src={src}
                        alt={animated || view.from < 0 ? altOf(e) : ""}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                ) : (
                    placeholderShapes(idx).map((s, k) => (
                        <div key={k} style={s} />
                    ))
                )}
            </div>
        )
    }

    const anchorOf = (href?: string, fresh?: boolean) =>
        href
            ? {
                  href,
                  target: fresh ? "_blank" : undefined,
                  rel: fresh ? "noopener noreferrer" : undefined,
              }
            : {}
    const primaryProps = anchorOf(current.buttonLink, current.buttonNewTab)
    const secondaryProps = anchorOf(
        current.secondaryLink,
        current.secondaryNewTab
    )
    const PrimaryTag: any = current.buttonLink ? "a" : "div"
    const SecondaryTag: any = current.secondaryLink ? "a" : "span"

    return (
        <div
            ref={shell}
            role="region"
            aria-roledescription="tabbed showcase"
            aria-label={p.kicker || "Showcase"}
            tabIndex={0}
            onKeyDown={onKey}
            onMouseEnter={() => setResting(true)}
            onMouseLeave={() => setResting(false)}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                isolation: "isolate",
                background: ink.page,
                borderRadius: p.frame.outerRadius,
                fontFamily: "Inter, system-ui, sans-serif",
                outline: "none",
            }}
        >
            <style>{keyframes}</style>

            <div
                style={{
                    position: "absolute",
                    left: g.gutter,
                    right: g.gutter,
                    top: g.gutter - 2,
                    height: 34,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    zIndex: 4,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: ink.kicker,
                        ...p.labelFont,
                    }}
                >
                    {p.kicker}
                </span>
                {p.showArrows && total > 1 && (
                    <div style={{ display: "flex", gap: 6 }}>
                        {[
                            {
                                d: "M15 18l-6-6 6-6",
                                step: -1,
                                label: "Previous tab",
                            },
                            { d: "M9 18l6-6-6-6", step: 1, label: "Next tab" },
                        ].map((b) => (
                            <button
                                key={b.label}
                                type="button"
                                aria-label={b.label}
                                className={`${tag}nav`}
                                onClick={() => turnTo(view.at + b.step)}
                                style={{
                                    all: "unset",
                                    cursor: "pointer",
                                    width: 30,
                                    height: 30,
                                    borderRadius: "50%",
                                    border: `1px solid ${ink.arrowRing}`,
                                    display: "grid",
                                    placeItems: "center",
                                    boxSizing: "border-box",
                                }}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={ink.arrowGlyph}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d={b.d} />
                                </svg>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div
                style={{
                    position: "absolute",
                    overflow: "hidden",
                    isolation: "isolate",
                    zIndex: 1,
                    background: ink.chipRest,
                    ...g.picture,
                }}
            >
                {view.from >= 0 && pictureLayer(view.from, false)}
                {pictureLayer(view.at, moving && view.turn > 0)}
            </div>

            <div
                aria-live="polite"
                style={{
                    position: "absolute",
                    zIndex: 5,
                    background: ink.plate,
                    color: ink.plateText,
                    borderRadius: p.frame.radius - 2,
                    padding: `${p.frame.platePadding}px ${p.frame.platePadding}px ${p.frame.platePadding - 4}px`,
                    boxSizing: "border-box",
                    ...g.plate,
                }}
            >
                <div key={`t-${view.turn}`}>
                    <span
                        style={{
                            display: "block",
                            overflow: "hidden",
                            marginBottom: 12,
                        }}
                    >
                        <span
                            style={{
                                ...rise(0),
                                fontSize: 11,
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                                color: ink.accent,
                                ...p.labelFont,
                            }}
                        >
                            {eyebrowText(current, view.at, p.numberedEyebrow)}
                        </span>
                    </span>
                    <span style={{ display: "block", overflow: "hidden" }}>
                        <span
                            style={{
                                ...rise(1),
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: narrow ? 24 : 28,
                                lineHeight: 1.06,
                                ...p.headlineFont,
                            }}
                        >
                            {current.leadLine}
                        </span>
                    </span>
                    <span
                        style={{
                            display: "block",
                            overflow: "hidden",
                            marginBottom: 12,
                        }}
                    >
                        <span
                            style={{
                                ...rise(2),
                                fontFamily: "Georgia, 'Times New Roman', serif",
                                fontSize: narrow ? 24 : 28,
                                lineHeight: 1.06,
                                ...p.headlineFont,
                                fontStyle: p.italicAccent ? "italic" : "normal",
                                color: ink.accent,
                            }}
                        >
                            {current.accentLine}
                        </span>
                    </span>
                    {!narrow && (
                        <span
                            style={{
                                display: "block",
                                overflow: "hidden",
                                marginBottom: 16,
                            }}
                        >
                            <span
                                style={{
                                    ...rise(3),
                                    fontSize: 13,
                                    lineHeight: 1.55,
                                    color: ink.plateMuted,
                                    ...p.bodyFont,
                                }}
                            >
                                {current.description}
                            </span>
                        </span>
                    )}
                    {current.note && (
                        <span
                            style={{
                                display: "block",
                                overflow: "hidden",
                                marginBottom: 14,
                            }}
                        >
                            <span
                                style={{
                                    ...rise(4),
                                    fontSize: 12,
                                    color: ink.plateFaint,
                                    ...p.bodyFont,
                                }}
                            >
                                {current.note}
                            </span>
                        </span>
                    )}
                </div>
                {current.buttonLabel && (
                    <PrimaryTag
                        {...primaryProps}
                        className={`${tag}read`}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: 14,
                            borderTop: `1px solid ${ink.rule}`,
                            color: ink.plateText,
                            textDecoration: "none",
                            cursor: current.buttonLink ? "pointer" : "default",
                        }}
                    >
                        <span
                            className={`${tag}words`}
                            style={{ fontSize: 15, ...p.buttonFont }}
                        >
                            {current.buttonLabel}
                        </span>
                        <span
                            className={`${tag}orb`}
                            aria-hidden="true"
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: "50%",
                                background: ink.accent,
                                display: "grid",
                                placeItems: "center",
                                flex: "0 0 auto",
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={ink.accentInk}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14M13 6l6 6-6 6" />
                            </svg>
                        </span>
                    </PrimaryTag>
                )}
                {current.secondaryLabel && (
                    <SecondaryTag
                        {...secondaryProps}
                        className={`${tag}alt`}
                        style={{
                            display: "inline-block",
                            marginTop: 10,
                            fontSize: 12,
                            color: ink.plateMuted,
                            textDecoration: "underline",
                            textUnderlineOffset: 3,
                            cursor: current.secondaryLink
                                ? "pointer"
                                : "default",
                            ...p.buttonFont,
                        }}
                    >
                        {current.secondaryLabel}
                    </SecondaryTag>
                )}
            </div>

            <div
                role="tablist"
                aria-label="Choose a tab"
                style={{
                    position: "absolute",
                    left: g.gutter,
                    right: g.gutter,
                    bottom: g.gutter,
                    display: "flex",
                    gap: 8,
                    zIndex: 4,
                }}
            >
                {entries.map((e, i) => {
                    const on = i === view.at
                    const thumb = pictureOf(e)
                    return (
                        <button
                            key={i}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            aria-label={e.tabLabel || `Tab ${i + 1}`}
                            className={`${tag}chip`}
                            onClick={() => turnTo(i)}
                            style={{
                                all: "unset",
                                cursor: "pointer",
                                position: "relative",
                                boxSizing: "border-box",
                                flexGrow: on ? p.activeStretch : 1,
                                flexShrink: 1,
                                flexBasis: 0,
                                minWidth: 0,
                                height: g.stripBand,
                                borderRadius: 14,
                                padding: "0 8px",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                overflow: "hidden",
                                background: on ? ink.chipOn : ink.chipRest,
                            }}
                        >
                            <span
                                style={{
                                    position: "relative",
                                    flex: "0 0 40px",
                                    height: 40,
                                    borderRadius: 10,
                                    overflow: "hidden",
                                    isolation: "isolate",
                                }}
                            >
                                {thumb ? (
                                    <img
                                        src={thumb}
                                        alt=""
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : (
                                    placeholderShapes(i).map((s, k) => (
                                        <span
                                            key={k}
                                            style={{ display: "block", ...s }}
                                        />
                                    ))
                                )}
                            </span>
                            {(!narrow || on) && (
                                <span
                                    style={{
                                        minWidth: 0,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: 11,
                                            fontFamily:
                                                "ui-monospace, monospace",
                                            color: ink.chipIndex,
                                        }}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span
                                        style={{
                                            display: "block",
                                            fontSize: 13,
                                            color: on
                                                ? ink.chipTextOn
                                                : ink.chipText,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            ...p.labelFont,
                                        }}
                                    >
                                        {e.tabLabel}
                                    </span>
                                </span>
                            )}
                            {p.motion.autoplay && (
                                <span
                                    ref={(el) => {
                                        meters.current[i] = el
                                    }}
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        bottom: 0,
                                        height: 3,
                                        width: "0%",
                                        background: ink.accent,
                                    }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

/* ------------------------------ defaults ------------------------------- */

function withFallbacks(props: any) {
    const entries: Entry[] =
        Array.isArray(props.entries) && props.entries.length
            ? props.entries
            : SEED_ENTRIES
    return {
        entries,
        kicker: props.kicker ?? "Explore",
        numberedEyebrow: props.numberedEyebrow ?? true,
        showArrows: props.showArrows ?? true,
        italicAccent: props.italicAccent ?? true,
        activeStretch: props.activeStretch ?? 2.4,
        headlineFont: props.headlineFont || {},
        bodyFont: props.bodyFont || {},
        buttonFont: props.buttonFont || {},
        labelFont: props.labelFont || {},
        frame: {
            cardSide: "right",
            pictureWidth: 66,
            plateWidth: 47,
            plateTop: 100,
            platePadding: 22,
            sweepCorner: 120,
            radius: 24,
            outerRadius: 16,
            gutter: 24,
            ...(props.frame || {}),
        },
        ink: {
            page: "#EEE8DD",
            kicker: "#6E5A4E",
            plate: "#2B1B22",
            plateText: "#F3EDE2",
            plateMuted: "#C9BEB4",
            plateFaint: "#9A8B7E",
            accent: "#E8B04B",
            accentInk: "#412402",
            rule: "rgba(243,237,226,0.18)",
            chipRest: "#E3DCCF",
            chipOn: "#2B1B22",
            chipText: "#2B1B22",
            chipTextOn: "#F3EDE2",
            chipIndex: "#9A8B7E",
            arrowRing: "rgba(43,27,34,0.25)",
            arrowGlyph: "#2B1B22",
            arrowHover: "rgba(43,27,34,0.06)",
            ...(props.ink || {}),
        },
        motion: {
            autoplay: true,
            dwell: 5.5,
            reveal: 0.9,
            pauseOnHover: true,
            ...(props.motion || {}),
        },
    }
}

/* --------------------------- property controls -------------------------- */

addPropertyControls(Frontispiece, {
    entries: {
        type: ControlType.Array,
        title: "Tabs",
        maxCount: 6,
        defaultValue: SEED_ENTRIES,
        control: {
            type: ControlType.Object,
            controls: {
                tabLabel: {
                    type: ControlType.String,
                    title: "Tab Label",
                    defaultValue: "Overview",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    defaultValue: "",
                    placeholder: "https://…",
                },
                eyebrow: {
                    type: ControlType.String,
                    title: "Eyebrow",
                    defaultValue: "Overview",
                },
                leadLine: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Built around",
                },
                accentLine: {
                    type: ControlType.String,
                    title: "Accent Line",
                    defaultValue: "how you work.",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue:
                        "A short line about what this section offers.",
                },
                note: {
                    type: ControlType.String,
                    title: "Note",
                    defaultValue: "",
                },
                buttonLabel: {
                    type: ControlType.String,
                    title: "Button",
                    defaultValue: "Get started",
                },
                buttonLink: { type: ControlType.Link, title: "Button Link" },
                buttonNewTab: {
                    type: ControlType.Boolean,
                    title: "Button New Tab",
                    defaultValue: false,
                },
                secondaryLabel: {
                    type: ControlType.String,
                    title: "Second Link",
                    defaultValue: "",
                },
                secondaryLink: { type: ControlType.Link, title: "Second URL" },
                secondaryNewTab: {
                    type: ControlType.Boolean,
                    title: "Second New Tab",
                    defaultValue: false,
                },
            },
        },
    },
    kicker: {
        type: ControlType.String,
        title: "Kicker",
        defaultValue: "Explore",
    },
    numberedEyebrow: {
        type: ControlType.Boolean,
        title: "Numbered Eyebrow",
        defaultValue: true,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
    italicAccent: {
        type: ControlType.Boolean,
        title: "Italic Accent",
        defaultValue: true,
    },
    activeStretch: {
        type: ControlType.Number,
        title: "Tab Stretch",
        min: 1,
        max: 4,
        step: 0.1,
        defaultValue: 2.4,
    },
    frame: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardSide: {
                type: ControlType.Enum,
                title: "Card Side",
                options: ["right", "left"],
                optionTitles: ["Right", "Left"],
                displaySegmentedControl: true,
                defaultValue: "right",
            },
            pictureWidth: {
                type: ControlType.Number,
                title: "Image Width",
                min: 40,
                max: 90,
                unit: "%",
                defaultValue: 66,
            },
            plateWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 30,
                max: 70,
                unit: "%",
                defaultValue: 47,
            },
            plateTop: {
                type: ControlType.Number,
                title: "Card Top",
                min: 40,
                max: 400,
                unit: "px",
                defaultValue: 100,
            },
            platePadding: {
                type: ControlType.Number,
                title: "Card Padding",
                min: 12,
                max: 48,
                unit: "px",
                defaultValue: 22,
            },
            sweepCorner: {
                type: ControlType.Number,
                title: "Sweep Corner",
                min: 0,
                max: 240,
                unit: "px",
                defaultValue: 120,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 4,
                max: 48,
                unit: "px",
                defaultValue: 24,
            },
            outerRadius: {
                type: ControlType.Number,
                title: "Outer Radius",
                min: 0,
                max: 48,
                unit: "px",
                defaultValue: 16,
            },
            gutter: {
                type: ControlType.Number,
                title: "Gutter",
                min: 8,
                max: 64,
                unit: "px",
                defaultValue: 24,
            },
        },
    },
    ink: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            page: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#EEE8DD",
            },
            kicker: {
                type: ControlType.Color,
                title: "Kicker",
                defaultValue: "#6E5A4E",
            },
            plate: {
                type: ControlType.Color,
                title: "Card",
                defaultValue: "#2B1B22",
            },
            plateText: {
                type: ControlType.Color,
                title: "Card Text",
                defaultValue: "#F3EDE2",
            },
            plateMuted: {
                type: ControlType.Color,
                title: "Description",
                defaultValue: "#C9BEB4",
            },
            plateFaint: {
                type: ControlType.Color,
                title: "Note",
                defaultValue: "#9A8B7E",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#E8B04B",
            },
            accentInk: {
                type: ControlType.Color,
                title: "Arrow Icon",
                defaultValue: "#412402",
            },
            rule: {
                type: ControlType.Color,
                title: "Divider",
                defaultValue: "rgba(243,237,226,0.18)",
            },
            chipRest: {
                type: ControlType.Color,
                title: "Tab",
                defaultValue: "#E3DCCF",
            },
            chipOn: {
                type: ControlType.Color,
                title: "Active Tab",
                defaultValue: "#2B1B22",
            },
            chipText: {
                type: ControlType.Color,
                title: "Tab Text",
                defaultValue: "#2B1B22",
            },
            chipTextOn: {
                type: ControlType.Color,
                title: "Active Text",
                defaultValue: "#F3EDE2",
            },
            chipIndex: {
                type: ControlType.Color,
                title: "Tab Number",
                defaultValue: "#9A8B7E",
            },
            arrowRing: {
                type: ControlType.Color,
                title: "Arrow Ring",
                defaultValue: "rgba(43,27,34,0.25)",
            },
            arrowGlyph: {
                type: ControlType.Color,
                title: "Arrow",
                defaultValue: "#2B1B22",
            },
            arrowHover: {
                type: ControlType.Color,
                title: "Arrow Hover",
                defaultValue: "rgba(43,27,34,0.06)",
            },
        },
    },
    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        controls: "extended",
        defaultValue: {
            fontSize: "28px",
            lineHeight: "1.06em",
            letterSpacing: "-0.01em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultValue: { fontSize: "13px", lineHeight: "1.55em" },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultValue: { fontSize: "15px" },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            dwell: {
                type: ControlType.Number,
                title: "Interval",
                min: 2,
                max: 20,
                step: 0.5,
                unit: "s",
                defaultValue: 5.5,
                hidden: (m: any) => !m.autoplay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
                hidden: (m: any) => !m.autoplay,
            },
            reveal: {
                type: ControlType.Number,
                title: "Reveal",
                min: 0.2,
                max: 2,
                step: 0.05,
                unit: "s",
                defaultValue: 0.9,
            },
        },
    },
})
