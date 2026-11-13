import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import * as Framer from "framer"

const { addPropertyControls, ControlType, RenderTarget } = Framer
// Framer's static-renderer check (canvas, export, thumbnails). It is read from the module rather than imported by
// name, so a site runtime that does not ship it falls back to RenderTarget instead of failing to load.
const useIsStaticRenderer: () => boolean =
    (Framer as { useIsStaticRenderer?: () => boolean }).useIsStaticRenderer ??
    (() => RenderTarget.current() !== RenderTarget.preview)
import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useReducedMotion,
    useScroll,
    useVelocity,
    type MotionValue,
} from "framer-motion"

// QilinMoon Motion Kit: Marquee Ticker
// An endless, seamless row of words, logos or your own layers. Eases to a stop on hover,
// optional speed boost from scroll velocity, soft fade at both edges.

type Img = { src: string; srcSet?: string; alt?: string }

const DEFAULTS = {
    content: "text",
    items: [
        "Strategy",
        "Brand systems",
        "Interface",
        "Motion",
        "Engineering",
        "Launch",
    ],
    logos: [] as Img[],
    slots: [] as React.ReactNode[],
    speed: 60,
    direction: "left",
    pauseOnHover: true,
    scrollBoost: true,
    separator: "dot",
    gap: 40,
    fade: 12,
    outline: false,
    color: "#0E0F14",
    accent: "#E2492F",
    logoHeight: 28,
    logoOpacity: 0.7,
    mono: false,
    font: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 56,
        fontWeight: 400,
        lineHeight: "1.1em",
        letterSpacing: "-0.03em",
    } as React.CSSProperties,
}

type Props = Partial<typeof DEFAULTS>

// Moves the row every frame. It is mounted only while the ticker is live, so on a static renderer (the canvas,
// exports, thumbnails) and under reduced motion there is no frame loop and no scroll listener.
function MarqueeDriver({
    x,
    setW,
    hover,
    factor,
    speed,
    dir,
    pauseOnHover,
    scrollBoost,
}: {
    x: MotionValue<number>
    setW: number
    hover: React.MutableRefObject<boolean>
    factor: React.MutableRefObject<number>
    speed: number
    dir: number
    pauseOnHover: boolean
    scrollBoost: boolean
}) {
    const { scrollY } = useScroll()
    const velocity = useVelocity(scrollY)
    useAnimationFrame((_, delta) => {
        if (setW <= 0) return
        const dt = Math.min(delta, 64) / 1000
        const target = hover.current && pauseOnHover ? 0 : 1
        factor.current += (target - factor.current) * Math.min(1, dt * 4)
        let boost = 1
        if (scrollBoost) boost += Math.min(3, Math.abs(velocity.get()) / 900)
        let next = x.get() - speed * dir * factor.current * boost * dt
        next = (((next % setW) + setW) % setW) - setW
        x.set(next)
    })
    return null
}

function merge<T extends object>(base: T, props: Partial<T>): T {
    const out: T = { ...base }
    for (const k in props) {
        const v = props[k]
        if (v !== undefined) out[k] = v as T[typeof k]
    }
    return out
}

function Separator({
    kind,
    color,
    size,
}: {
    kind: string
    color: string
    size: number
}) {
    if (kind === "none") return null
    const s = Math.max(4, Math.round(size * 0.14))
    let el: React.ReactNode = null
    if (kind === "dot")
        el = (
            <span
                style={{
                    width: s,
                    height: s,
                    borderRadius: "50%",
                    background: color,
                }}
            />
        )
    if (kind === "ring")
        el = (
            <span
                style={{
                    width: s * 1.6,
                    height: s * 1.6,
                    borderRadius: "50%",
                    border: `1px solid ${color}`,
                    boxSizing: "border-box",
                }}
            />
        )
    if (kind === "line")
        el = (
            <span
                style={{
                    width: Math.round(size * 0.7),
                    height: 1,
                    background: color,
                }}
            />
        )
    if (kind === "slash")
        el = (
            <span
                style={{
                    width: 1,
                    height: Math.round(size * 0.7),
                    background: color,
                    transform: "rotate(20deg)",
                }}
            />
        )
    if (kind === "plus")
        el = (
            <span
                style={{
                    position: "relative",
                    width: s * 2.2,
                    height: s * 2.2,
                }}
            >
                <span
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "50%",
                        height: 1,
                        background: color,
                    }}
                />
                <span
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: "50%",
                        width: 1,
                        background: color,
                    }}
                />
            </span>
        )
    return (
        <span
            aria-hidden
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
            }}
        >
            {el}
        </span>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 */
export default function QmDriftBand(
    props: Partial<typeof DEFAULTS> & { style?: React.CSSProperties }
) {
    const p = merge(DEFAULTS, props)
    const reduce = useReducedMotion()
    const isStatic = useIsStaticRenderer()
    const still = isStatic || !!reduce

    const wrapRef = useRef<HTMLDivElement>(null)
    const setRef = useRef<HTMLDivElement>(null)
    const [setW, setSetW] = useState(0)
    const [wrapW, setWrapW] = useState(0)

    const measure = () => {
        if (setRef.current)
            setSetW(setRef.current.getBoundingClientRect().width)
        if (wrapRef.current)
            setWrapW(wrapRef.current.getBoundingClientRect().width)
    }
    useLayoutEffect(measure, [])
    useEffect(() => {
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        if (setRef.current) ro.observe(setRef.current)
        if (wrapRef.current) ro.observe(wrapRef.current)
        return () => ro.disconnect()
    }, [])

    const x = useMotionValue(0)
    const hover = useRef(false)
    const factor = useRef(1)
    const dir = p.direction === "right" ? -1 : 1

    const size =
        typeof p.font?.fontSize === "number"
            ? p.font.fontSize
            : parseFloat(String(p.font?.fontSize || 40)) || 40
    const copies = setW > 0 ? Math.max(2, Math.ceil(wrapW / setW) + 1) : 2
    const half = p.gap / 2

    const renderItems = (copy: number) => {
        const out: React.ReactNode[] = []
        const push = (node: React.ReactNode, key: string) => {
            out.push(
                <span
                    key={key}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        flex: "none",
                        padding: `0 ${half}px`,
                    }}
                >
                    {node}
                </span>
            )
            out.push(
                <span
                    key={key + "s"}
                    style={{
                        display: "inline-flex",
                        flex: "none",
                        padding: `0 ${half}px`,
                    }}
                >
                    <Separator
                        kind={p.separator}
                        color={p.accent}
                        size={size}
                    />
                </span>
            )
        }
        if (p.content === "logos" && p.logos?.length) {
            p.logos.forEach((l, i) =>
                push(
                    <img
                        src={l?.src}
                        srcSet={l?.srcSet}
                        alt={copy === 0 ? l?.alt || "" : ""}
                        draggable={false}
                        style={{
                            height: p.logoHeight,
                            width: "auto",
                            display: "block",
                            opacity: p.logoOpacity,
                        }}
                    />,
                    `l${i}`
                )
            )
        } else if (p.content === "slots" && p.slots?.length) {
            p.slots.forEach((s, i) =>
                push(
                    <span style={{ display: "inline-flex" }}>{s}</span>,
                    `c${i}`
                )
            )
        } else {
            ;(p.items || []).forEach((t, i) => {
                const outlined = p.outline && i % 2 === 1
                push(
                    <span
                        style={{
                            whiteSpace: "nowrap",
                            color: outlined ? "transparent" : p.color,
                            WebkitTextStroke: outlined
                                ? `1px ${p.color}`
                                : undefined,
                            ...p.font,
                            ...(p.mono
                                ? {
                                      fontFamily:
                                          "ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.06em",
                                  }
                                : {}),
                        }}
                    >
                        {t}
                    </span>,
                    `t${i}`
                )
            })
        }
        return out
    }

    const f = Math.max(0, Math.min(45, p.fade))
    const mask =
        f > 0
            ? `linear-gradient(90deg, transparent 0%, #000 ${f}%, #000 ${100 - f}%, transparent 100%)`
            : undefined
    const label = p.content === "text" ? (p.items || []).join(", ") : undefined

    return (
        <div
            ref={wrapRef}
            role="marquee"
            aria-label={label}
            onPointerEnter={() => (hover.current = true)}
            onPointerLeave={() => (hover.current = false)}
            style={{
                position: "relative",
                width: "100%",
                overflow: "hidden",
                maskImage: mask,
                WebkitMaskImage: mask,
                ...props.style,
            }}
        >
            {still ? null : (
                <MarqueeDriver
                    x={x}
                    setW={setW}
                    hover={hover}
                    factor={factor}
                    speed={p.speed}
                    dir={dir}
                    pauseOnHover={p.pauseOnHover}
                    scrollBoost={p.scrollBoost}
                />
            )}
            <motion.div
                style={{
                    display: "flex",
                    width: "max-content",
                    x: still ? -setW * 0.18 : x,
                    willChange: "transform",
                }}
            >
                {Array.from({ length: copies }).map((_, c) => (
                    <div
                        key={c}
                        ref={c === 0 ? setRef : undefined}
                        aria-hidden={c > 0 || undefined}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flex: "none",
                        }}
                    >
                        {renderItems(c)}
                    </div>
                ))}
            </motion.div>
        </div>
    )
}

addPropertyControls(QmDriftBand, {
    content: {
        type: ControlType.Enum,
        title: "Content",
        options: ["text", "logos", "slots"],
        optionTitles: ["Text", "Logos", "Layers"],
        displaySegmentedControl: true,
        defaultValue: DEFAULTS.content,
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        control: { type: ControlType.String },
        defaultValue: DEFAULTS.items,
        hidden: (p: Props) => p.content !== "text",
    },
    logos: {
        type: ControlType.Array,
        title: "Logos",
        control: { type: ControlType.ResponsiveImage },
        hidden: (p: Props) => p.content !== "logos",
    },
    slots: {
        type: ControlType.Array,
        title: "Layers",
        control: { type: ControlType.ComponentInstance },
        hidden: (p: Props) => p.content !== "slots",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 5,
        max: 400,
        step: 5,
        unit: "px/s",
        defaultValue: DEFAULTS.speed,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: DEFAULTS.direction,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Hover Pause",
        defaultValue: DEFAULTS.pauseOnHover,
    },
    scrollBoost: {
        type: ControlType.Boolean,
        title: "Scroll Boost",
        defaultValue: DEFAULTS.scrollBoost,
    },
    separator: {
        type: ControlType.Enum,
        title: "Separator",
        options: ["dot", "ring", "line", "slash", "plus", "none"],
        optionTitles: ["Dot", "Ring", "Line", "Slash", "Plus", "None"],
        defaultValue: DEFAULTS.separator,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 200,
        unit: "px",
        defaultValue: DEFAULTS.gap,
    },
    fade: {
        type: ControlType.Number,
        title: "Edge Fade",
        min: 0,
        max: 45,
        unit: "%",
        defaultValue: DEFAULTS.fade,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 56,
            lineHeight: "1.1em",
            letterSpacing: "-0.03em",
        },
        hidden: (p: Props) => p.content !== "text",
    },
    mono: {
        type: ControlType.Boolean,
        title: "Mono Caps",
        defaultValue: DEFAULTS.mono,
        hidden: (p: Props) => p.content !== "text",
    },
    outline: {
        type: ControlType.Boolean,
        title: "Outline Alt",
        defaultValue: DEFAULTS.outline,
        hidden: (p: Props) => p.content !== "text",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: DEFAULTS.color,
    },
    accent: {
        type: ControlType.Color,
        title: "Mark Color",
        defaultValue: DEFAULTS.accent,
    },
    logoHeight: {
        type: ControlType.Number,
        title: "Logo Height",
        min: 8,
        max: 160,
        unit: "px",
        defaultValue: DEFAULTS.logoHeight,
        hidden: (p: Props) => p.content !== "logos",
    },
    logoOpacity: {
        type: ControlType.Number,
        title: "Logo Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: DEFAULTS.logoOpacity,
        hidden: (p: Props) => p.content !== "logos",
    },
})
