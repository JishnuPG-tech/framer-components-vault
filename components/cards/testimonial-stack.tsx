/**
 * Testimonial Stack
 *
 * Install:
 * 1. In Framer, go to Assets > Code > New Component and paste this file.
 * 2. Drop the component on the canvas. Edit quotes, names, avatars and colors in the property panel.
 * 3. Fonts: pick any font in the Font control. It uses your project's default font until you do.
 *
 * Quote cards stacked on top of each other. Click or tap the top card, drag it sideways, use the
 * arrow buttons or the arrow keys, and it flies out and slides back in at the bottom of the stack.
 * Optional autoplay pauses on hover. Motion is CSS only, off in the static render and for reduced motion.
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


type Item = {
    quote: string
    name: string
    role: string
    avatar?: string
}

interface TestimonialStackProps {
    items: Item[]
    autoplay: boolean
    interval: number
    pauseOnHover: boolean
    showCounter: boolean
    duration: number
    offset: number
    radius: number
    colors: string[]
    ink: string
    surface: string
    background: string
    font?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: Item[] = [
    {
        quote: "We shipped the new site faster than we planned. The team edits pages themselves now and nobody waits on a developer.",
        name: "Maya Lindqvist",
        role: "Head of Marketing, Acme",
    },
    {
        quote: "The pages finally load fast and read clearly on a phone. Our launch page is the one we always wanted.",
        name: "Daniel Okafor",
        role: "Founder, Northwind",
    },
    {
        quote: "Clear process, honest estimates and no surprises at the end. Exactly what a small team needs from a partner.",
        name: "Sofia Marín",
        role: "COO, Acme",
    },
    {
        quote: "The CMS setup is so simple that our interns publish case studies on their first day.",
        name: "Jonas Weber",
        role: "Brand Lead, Northwind",
    },
    {
        quote: "Every detail was considered, from the hover states to the 404 page. Customers keep complimenting the site.",
        name: "Priya Raman",
        role: "CEO, Acme",
    },
]

const PALETTE = ["#FFD35C", "#C8B8B2", "#F9C2F2", "#86A3E0", "#55683F"]
const VISIBLE = 3
const SWIPE = 70

function pad2(n: number): string {
    return n < 10 ? `0${n}` : `${n}`
}

function initials(name: string): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function Arrow(props: { dir: 1 | -1 }) {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d={props.dir === 1 ? "M4 12h15M13 5.5l6.5 6.5-6.5 6.5" : "M20 12H5M11 5.5L4.5 12l6.5 6.5"}
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 620
 */
export default function TestimonialStackDeck(props: TestimonialStackProps) {
    const {
        items: rawItems = DEFAULT_ITEMS,
        autoplay = false,
        interval = 5,
        pauseOnHover = true,
        showCounter = true,
        duration = 0.55,
        offset = 26,
        radius = 24,
        colors: rawColors = PALETTE,
        ink = "#0E0E0E",
        surface = "#F4F4F2",
        background = "rgba(0, 0, 0, 0)",
        font,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const animate = !isStatic
    const items = rawItems.length ? rawItems : DEFAULT_ITEMS
    const count = items.length
    const palette = rawColors && rawColors.length ? rawColors : PALETTE

    const [top, setTop] = React.useState(0)
    // Card currently flying out (next) or flying in (prev), with its side.
    const [flying, setFlying] = React.useState<{ index: number; dir: number; phase: "out" | "in" } | null>(null)
    const [dragX, setDragX] = React.useState(0)
    const [dragging, setDragging] = React.useState(false)
    const [hovered, setHovered] = React.useState(false)
    const drag = React.useRef<{ x: number; id: number; moved: boolean } | null>(null)
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const liveId = React.useId()

    React.useEffect(() => {
        if (top >= count) setTop(0)
    }, [count, top])

    React.useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current)
        }
    }, [])

    const go = React.useCallback(
        (dir: number) => {
            if (count < 2) return
            if (timer.current) clearTimeout(timer.current)
            if (dir > 0) {
                // The top card flies out to the side, then settles at the back.
                setFlying({ index: top, dir: dragX < 0 ? -1 : 1, phase: "out" })
                setTop((top + 1) % count)
                timer.current = setTimeout(() => setFlying(null), duration * 1000)
                return
            }
            // The back card jumps to the side, then flies in on top.
            const prev = (top - 1 + count) % count
            setFlying({ index: prev, dir: -1, phase: "in" })
            setTop(prev)
            timer.current = setTimeout(() => setFlying(null), 40)
        },
        [count, top, duration, dragX]
    )

    // Autoplay: one timeout per step, paused while hovered.
    React.useEffect(() => {
        if (isStatic) return
        if (!autoplay) return
        if (count < 2) return
        if (pauseOnHover && hovered) return
        if (dragging) return
        const id = setTimeout(() => go(1), Math.max(1, interval) * 1000)
        return () => clearTimeout(id)
    }, [isStatic, autoplay, interval, pauseOnHover, hovered, dragging, go, count, top])

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            go(1)
            return
        }
        if (e.key === "ArrowLeft") {
            e.preventDefault()
            go(-1)
        }
    }

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return
        drag.current = { x: e.clientX, id: e.pointerId, moved: false }
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
    }
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current
        if (!d || d.id !== e.pointerId) return
        const dx = e.clientX - d.x
        if (Math.abs(dx) > 4) d.moved = true
        setDragX(dx)
    }
    const endDrag = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
        const d = drag.current
        if (!d || d.id !== e.pointerId) return
        drag.current = null
        setDragging(false)
        const dx = e.clientX - d.x
        if (cancelled) {
            setDragX(0)
            return
        }
        if (!d.moved || Math.abs(dx) > SWIPE) {
            go(1)
            setDragX(0)
            return
        }
        setDragX(0)
    }

    const ease = "cubic-bezier(0.22, 1, 0.36, 1)"
    const cardTransition = (instant: boolean) => {
        if (!animate || instant) return "none"
        return `transform ${duration}s ${ease}, opacity ${duration}s ${ease}`
    }

    const btn: React.CSSProperties = {
        width: 56,
        height: 56,
        borderRadius: 999,
        border: "none",
        background: ink,
        color: surface,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        }

    const current = items[Math.min(top, count - 1)]

    return (
        <div
            role="region"
            className="tst-root"
            aria-roledescription="carousel"
            aria-label="Testimonials"
            onKeyDown={onKeyDown}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                ...style,
                ...font,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 28,
                background,
                color: ink,
                boxSizing: "border-box",
            }}
        >
            <style>{`
                .tst-root { container-type: inline-size; }
                .tst-card:focus-visible, .tst-btn:focus-visible { outline: 2px solid ${ink}; outline-offset: 3px; }
                .tst-btn svg { transition: ${animate ? `transform 0.3s ${ease}` : "none"}; }
                .tst-btn[data-dir="1"]:hover svg { transform: translateX(3px); }
                .tst-btn[data-dir="-1"]:hover svg { transform: translateX(-3px); }
                .tst-card > * { transition: ${animate ? "opacity 0.3s ease" : "none"}; }
                /* Cards behind only show their colour edge, not their content. */
                .tst-card[aria-hidden="true"] > * { opacity: 0; }
                @media (prefers-reduced-motion: reduce) {
                    .tst-card, .tst-card > *, .tst-btn, .tst-btn svg { transition: none !important; }
                }
            `}</style>

            <div style={{ display: "grid", paddingBottom: offset * (VISIBLE - 1), touchAction: "pan-y" }}>
                {items.map((item, i) => {
                    const pos = (i - top + count) % count
                    const isTop = pos === 0
                    const fly = flying && flying.index === i ? flying : null
                    const depth = Math.min(pos, VISIBLE - 1)
                    let transform = `translateY(${depth * offset}px) scale(${1 - depth * 0.06})`
                    let opacity = pos < VISIBLE ? 1 : 0
                    let zIndex = count - pos
                    let instant = false
                    if (isTop && dragging) {
                        transform = `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`
                        instant = true
                    }
                    if (fly && fly.phase === "out") {
                        transform = `translateX(${fly.dir * 115}%) rotate(${fly.dir * 8}deg)`
                        opacity = 0
                        zIndex = count + 1
                    }
                    if (fly && fly.phase === "in") {
                        transform = `translateX(${fly.dir * 115}%) rotate(${fly.dir * 8}deg)`
                        opacity = 0
                        instant = true
                    }
                    const name = item.name || ""
                    const band = palette[i % palette.length]
                    return (
                        <div
                            key={i}
                            className="tst-card"
                            role={isTop ? "button" : undefined}
                            tabIndex={isTop ? 0 : -1}
                            aria-hidden={isTop ? undefined : true}
                            aria-label={isTop ? `Testimonial from ${name}. Press Enter for the next one.` : undefined}
                            onPointerDown={isTop ? onPointerDown : undefined}
                            onPointerMove={isTop ? onPointerMove : undefined}
                            onPointerUp={isTop ? (e) => endDrag(e, false) : undefined}
                            onPointerCancel={isTop ? (e) => endDrag(e, true) : undefined}
                            onKeyDown={
                                isTop
                                    ? (e) => {
                                          if (e.key !== "Enter" && e.key !== " ") return
                                          e.preventDefault()
                                          go(1)
                                      }
                                    : undefined
                            }
                            style={{
                                gridArea: "1 / 1",
                                position: "relative",
                                zIndex,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: 32,
                                padding: "clamp(22px, 5cqi, 36px)",
                                borderRadius: radius,
                                background: band,
                                color: ink,
                                boxSizing: "border-box",
                                transform,
                                transformOrigin: "50% 100%",
                                opacity,
                                transition: cardTransition(instant),
                                cursor: isTop ? (dragging ? "grabbing" : "grab") : "default",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                                pointerEvents: isTop ? "auto" : "none",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <span
                                    aria-hidden="true"
                                    style={{
                                        color: ink,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        fontSize: 14,
                                        fontWeight: 700,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {i + 1}
                                </span>
                                <svg width="34" height="26" viewBox="0 0 28 22" fill={ink} aria-hidden="true">
                                    <path d="M0 22V13.2C0 5.9 3.6 1.5 10.8 0l1.4 3.1C8.4 4.3 6.6 6.7 6.4 10.2H11.6V22H0Zm16.4 0V13.2C16.4 5.9 20 1.5 27.2 0l1.4 3.1c-3.8 1.2-5.6 3.6-5.8 7.1H28V22H16.4Z" />
                                </svg>
                            </div>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "clamp(22px, 5.2cqi, 34px)",
                                    fontWeight: 700,
                                    lineHeight: 1.08,
                                    letterSpacing: "-0.035em",
                                    textWrap: "pretty",
                                } as React.CSSProperties}
                            >
                                {item.quote}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                {item.avatar ? (
                                    <img
                                        src={item.avatar}
                                        alt=""
                                        draggable={false}
                                        style={{ width: 48, height: 48, borderRadius: 999, objectFit: "cover", flexShrink: 0 }}
                                    />
                                ) : (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 999,
                                            flexShrink: 0,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: ink,
                                            color: band,
                                            fontSize: 15,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {initials(name)}
                                    </span>
                                )}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 3,
                                        minWidth: 0,
                                        paddingLeft: 14,
                                        borderLeft: "1px solid rgba(14, 14, 14, 0.2)",
                                    }}
                                >
                                    <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>{name}</span>
                                    <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.6 }}>{item.role}</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                {showCounter ? (
                    <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "flex-start", gap: 6, fontVariantNumeric: "tabular-nums" }}>
                        <span style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 0.9 }}>{pad2(top + 1)}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.55, marginTop: 2 }}>{`/${pad2(count)}`}</span>
                    </span>
                ) : (
                    <span />
                )}
                <span id={liveId} aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    {`Testimonial ${top + 1} of ${count}: ${current ? current.name : ""}`}
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" className="tst-btn" data-dir="-1" aria-label="Previous testimonial" style={btn} onClick={() => go(-1)}>
                        <Arrow dir={-1} />
                    </button>
                    <button type="button" className="tst-btn" data-dir="1" aria-label="Next testimonial" style={btn} onClick={() => go(1)}>
                        <Arrow dir={1} />
                    </button>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(TestimonialStackDeck, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                quote: { type: ControlType.String, title: "Quote", displayTextArea: true, defaultValue: "" },
                name: { type: ControlType.String, title: "Name", defaultValue: "Name" },
                role: { type: ControlType.String, title: "Role", defaultValue: "" },
                avatar: { type: ControlType.Image, title: "Avatar", description: "Optional. Shows initials when empty." },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: false },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 5,
        min: 1,
        max: 20,
        step: 0.5,
        unit: "s",
        hidden: (p: TestimonialStackProps) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        hidden: (p: TestimonialStackProps) => !p.autoplay,
    },
    showCounter: { type: ControlType.Boolean, title: "Counter", defaultValue: true, description: "Shows 01 /05 next to the buttons." },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 0.55, min: 0.1, max: 2, step: 0.05, unit: "s" },
    offset: { type: ControlType.Number, title: "Stack Offset", defaultValue: 26, min: 0, max: 48, description: "How far each card behind peeks out." },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 24, min: 0, max: 40 },
    colors: {
        type: ControlType.Array,
        title: "Card Colors",
        control: { type: ControlType.Color },
        defaultValue: PALETTE,
        description: "One per card in order, then repeated.",
    },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#0E0E0E", description: "Text, buttons, initials and focus ring." },
    surface: { type: ControlType.Color, title: "Surface", defaultValue: "#F4F4F2", description: "Arrows on the buttons." },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0, 0, 0, 0)" },
    font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif" },
})
