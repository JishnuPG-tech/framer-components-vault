import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

/**
 * Testimonial Logo Card (default content: Russet Supply)
 *
 * - Logo + quote + author with pill/dot pagination
 * - Click a dot to jump, optional autoplay, optional drag/swipe
 * - Height can be fixed or "Fit": the card always reserves the height of the
 *   tallest testimonial so the dots never jump when the slide changes
 *
 * @framerIntrinsicWidth 950
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */

type IconType = "circle" | "diamond" | "bars" | "none"

type Item = {
    brand: string
    icon: IconType
    logoImage?: { src: string; srcSet?: string; alt?: string }
    logoAlt?: string
    quote: string
    name: string
    role: string
}

/* -------------------------------------------------------------------------- */
/*  Fixed animation settings (scaled by the "Speed" control)                   */
/* -------------------------------------------------------------------------- */

const EASE = [0.625, 0.05, 0, 1] as const
const ENTER = 0.7
const EXIT = 0.3
const STAGGER = 0.08
const Y_OFFSET = 14
const DOT_MORPH = 0.5

/* -------------------------------------------------------------------------- */
/*  Themes                                                                     */
/* -------------------------------------------------------------------------- */

type ThemeName =
    | "noir"
    | "midnight"
    | "sunset"
    | "forest"
    | "lavender"
    | "paper"
    | "custom"

const THEMES: Record<
    Exclude<ThemeName, "custom">,
    {
        background: string
        quote: string
        name: string
        role: string
        logo: string
        dot: string
        active: string
        glow: string
    }
> = {
    noir: {
        background: "#0B0B0B",
        quote: "#F2F2EE",
        name: "#9A9A96",
        role: "#6E6E6B",
        logo: "#F2F2EE",
        dot: "#3A3A38",
        active: "#E8E8E4",
        glow: "rgba(255,255,255,0.05)",
    },
    midnight: {
        background: "#0E1224",
        quote: "#F4F6FF",
        name: "#F4F6FF",
        role: "#8C95B8",
        logo: "#FFFFFF",
        dot: "#2A3157",
        active: "#6C8CFF",
        glow: "rgba(108,140,255,0.22)",
    },
    sunset: {
        background: "#1C0F14",
        quote: "#FFF1EA",
        name: "#FFF1EA",
        role: "#C79A8D",
        logo: "#FFFFFF",
        dot: "#4A2630",
        active: "#FF7A59",
        glow: "rgba(255,122,89,0.22)",
    },
    forest: {
        background: "#0D1A14",
        quote: "#EAF7EF",
        name: "#EAF7EF",
        role: "#86A898",
        logo: "#FFFFFF",
        dot: "#1F3A2E",
        active: "#3DDC97",
        glow: "rgba(61,220,151,0.20)",
    },
    lavender: {
        background: "#F1ECFF",
        quote: "#1D1540",
        name: "#1D1540",
        role: "#7A6FA8",
        logo: "#1D1540",
        dot: "#D4C9FA",
        active: "#6B4EFF",
        glow: "rgba(107,78,255,0.14)",
    },
    paper: {
        background: "#FFFFFF",
        quote: "#0F0F0F",
        name: "#0F0F0F",
        role: "#7A7A7A",
        logo: "#0F0F0F",
        dot: "#CBDCF5",
        active: "#CBDCF5",
        glow: "rgba(203,220,245,0.4)",
    },
}

/* -------------------------------------------------------------------------- */
/*  Defaults                                                                   */
/* -------------------------------------------------------------------------- */

const DEFAULT_ITEMS: Item[] = [
    {
        brand: "Alder & Co",
        icon: "circle",
        quote: "“Russet Supply cut our landing page builds from two weeks to two days. The components just behave.”",
        name: "Maya Torres",
        role: "Design Lead, Alder & Co",
    },
    {
        brand: "Pinecrest",
        icon: "bars",
        quote: "“Every component is polished down to the tiny interactions. Clients keep asking who built the animations.”",
        name: "Daniel Okafor",
        role: "Founder, Pinecrest Studio",
    },
    {
        brand: "Kettle",
        icon: "diamond",
        quote: "“We dropped three paid plugins after finding Russet Supply. Clean controls, zero bloat.”",
        name: "Lena Fischer",
        role: "Creative Director, Kettle Digital",
    },
    {
        brand: "Marlow",
        icon: "circle",
        quote: "“It feels like it was made by designers who actually ship in Framer every single day.”",
        name: "Sam Whitaker",
        role: "Freelance Designer, Marlow",
    },
    {
        brand: "Fernhill",
        icon: "none",
        quote: "“Our whole team uses it now. Setup takes minutes and the props make sense without reading docs.”",
        name: "Priya Nair",
        role: "Head of Web, Fernhill",
    },
]

const D = {
    behavior: { autoplay: true, interval: 2.5, drag: false, speed: 1 },
    card: {
        background: "#1C0F14",
        radius: 36,
        grain: true,
        glow: true,
        padding: "48px",
        contentGap: 42,
        dotsGap: 76,
        borderEnabled: false,
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
    },
    text: {
        iconGap: 10,
        logoColor: "#FFFFFF",
        quoteColor: "#FFF1EA",
        nameColor: "#FFF1EA",
        roleColor: "#C79A8D",
    },
    dots: {
        size: 12,
        activeWidth: 48,
        gap: 12,
        align: "flex-start",
        color: "#4A2630",
        activeColor: "#FF7A59",
    },
}

const px = (v: any, fallback: number) => {
    const n = parseFloat(String(v))
    return Number.isFinite(n) ? n : fallback
}

// Values from controls are validated before they reach any CSS string
const num = (v: any, fallback: number, min: number, max: number) => {
    const n = typeof v === "number" ? v : parseFloat(String(v))
    return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback
}
const safeColor = (v: any, fallback: string) =>
    typeof v === "string" && v.length < 160 && /^[#\w\s(),.%/\-]+$/.test(v)
        ? v
        : fallback
const safePadding = (v: any, fallback: string) =>
    typeof v === "string" &&
    /^(-?\d*\.?\d+(px|%|em|rem)?\s*){1,4}$/.test(v.trim())
        ? v.trim()
        : fallback
const ALIGNS = ["flex-start", "center", "flex-end"]

/* -------------------------------------------------------------------------- */
/*  Logo icons                                                                 */
/* -------------------------------------------------------------------------- */

function BrandIcon({
    type,
    size,
    color,
}: {
    type: IconType
    size: number
    color: string
}) {
    if (type === "none") return null
    const common = {
        width: size,
        height: size,
        "aria-hidden": true,
        style: { flex: "none", display: "block" },
    } as const
    if (type === "circle") {
        return (
            <svg {...common} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12" fill={color} />
            </svg>
        )
    }
    if (type === "diamond") {
        return (
            <svg {...common} viewBox="0 0 24 24">
                <path d="M12 1 L23 12 L12 23 L1 12 Z" fill={color} />
            </svg>
        )
    }
    return (
        <svg {...common} viewBox="0 0 24 24">
            <rect x="1" y="3" width="22" height="7" rx="1.5" fill={color} />
            <rect x="1" y="12" width="12" height="7" rx="1.5" fill={color} />
            <rect x="1" y="12" width="5" height="9" rx="1.5" fill={color} />
        </svg>
    )
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function TestimonialLogoCard(props: any) {
    const { items = DEFAULT_ITEMS, theme = "sunset", style } = props

    const rb = { ...D.behavior, ...props.behavior }
    const rc = { ...D.card, ...props.card }
    const rt = { ...D.text, ...props.text }
    const rd = { ...D.dots, ...props.dots }

    const behavior = {
        autoplay: !!rb.autoplay,
        interval: num(rb.interval, 2.5, 1, 60),
        drag: !!rb.drag,
        speed: num(rb.speed, 1, 0.1, 5),
    }
    const card = {
        background: safeColor(rc.background, D.card.background),
        radius: num(rc.radius, 36, 0, 400),
        grain: !!rc.grain,
        glow: !!rc.glow,
        padding: safePadding(rc.padding, D.card.padding),
        contentGap: num(rc.contentGap, 42, 0, 400),
        dotsGap: num(rc.dotsGap, 76, 0, 400),
        borderEnabled: !!rc.borderEnabled,
        borderColor: safeColor(rc.borderColor, D.card.borderColor),
        borderWidth: num(rc.borderWidth, 1, 0, 24),
    }
    const text = {
        ...rt,
        iconGap: num(rt.iconGap, 10, 0, 100),
        logoColor: safeColor(rt.logoColor, D.text.logoColor),
        quoteColor: safeColor(rt.quoteColor, D.text.quoteColor),
        nameColor: safeColor(rt.nameColor, D.text.nameColor),
        roleColor: safeColor(rt.roleColor, D.text.roleColor),
    }
    const dots = {
        size: num(rd.size, 12, 2, 80),
        activeWidth: num(rd.activeWidth, 48, 2, 300),
        gap: num(rd.gap, 12, 0, 100),
        align: ALIGNS.includes(rd.align) ? rd.align : "flex-start",
        color: safeColor(rd.color, D.dots.color),
        activeColor: safeColor(rd.activeColor, D.dots.activeColor),
    }

    // Colors: preset theme, or the custom colors when theme = custom
    const t =
        theme !== "custom"
            ? (THEMES[theme as Exclude<ThemeName, "custom">] ?? THEMES.sunset)
            : null
    const cBg = t ? t.background : card.background
    const cQuote = t ? t.quote : text.quoteColor
    const cName = t ? t.name : text.nameColor
    const cRole = t ? t.role : text.roleColor
    const cLogo = t ? t.logo : text.logoColor
    const cDot = t ? t.dot : dots.color
    const cActive = t ? t.active : dots.activeColor
    const cGlow = t ? t.glow : "rgba(128,128,128,0.15)"

    // Logo size follows the logo font size
    const logoFontPx = px(text.logoFont?.fontSize, 24)
    const logoH = Math.round(logoFontPx * 1.25)

    const fitWidth =
        !style?.width ||
        ["auto", "min-content", "max-content", "fit-content"].includes(
            style.width
        )

    const list: Item[] =
        Array.isArray(items) && items.length ? items : DEFAULT_ITEMS
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // Static renderer (Framer thumbnails / exports): no animation, no timers, no drag
    const isStatic = useIsStaticRenderer()
    const reduceMotion = !!useReducedMotion() || isStatic
    const dragOn = behavior.drag && !isStatic

    // Only run autoplay while the component is actually on screen
    const rootRef = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(true)
    useEffect(() => {
        const el = rootRef.current
        if (!el || isStatic || typeof IntersectionObserver === "undefined")
            return
        const io = new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.1 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    const [focusedDot, setFocusedDot] = useState(-1)

    const [active, setActive] = useState(0)
    const safeActive = Math.min(active, list.length - 1)
    const next = () => setActive((i) => (i + 1) % list.length)
    const prev = () => setActive((i) => (i - 1 + list.length) % list.length)

    // Autoplay (restarts whenever the active item changes, so clicks reset the timer)
    useEffect(() => {
        if (
            isCanvas ||
            isStatic ||
            !visible ||
            !behavior.autoplay ||
            list.length < 2
        )
            return
        const id = window.setTimeout(
            next,
            Math.max(behavior.interval, 1) * 1000
        )
        return () => window.clearTimeout(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        active,
        behavior.autoplay,
        behavior.interval,
        list.length,
        isCanvas,
        isStatic,
        visible,
    ])

    // Animation timings (all scaled by Speed)
    const speed = Math.max(behavior.speed, 0.1)
    const enter = reduceMotion ? 0.01 : ENTER / speed
    const exit = reduceMotion ? 0.01 : EXIT / speed
    const stagger = STAGGER / speed
    const dotMorph = reduceMotion ? 0 : DOT_MORPH / speed
    const y = reduceMotion ? 0 : Y_OFFSET

    const item = list[safeActive]

    const variants = useMemo(
        () => ({
            hidden: { opacity: 0, y },
            show: (i: number) => ({
                opacity: 1,
                y: 0,
                transition: {
                    duration: enter,
                    delay: i * stagger,
                    ease: EASE as any,
                },
            }),
            leave: (i: number) => ({
                opacity: 0,
                transition: {
                    duration: exit,
                    delay: i === 1 ? 0.05 : 0,
                    ease: "easeOut" as const,
                },
            }),
        }),
        [y, enter, exit, stagger]
    )

    const logoVariants = useMemo(
        () => ({
            hidden: { opacity: 1, y: reduceMotion ? 0 : "110%" },
            show: (i: number) => ({
                opacity: 1,
                y: "0%",
                transition: {
                    duration: enter,
                    delay: i * stagger,
                    ease: EASE as any,
                },
            }),
            leave: () => ({
                opacity: 0,
                transition: {
                    duration: exit,
                    delay: 0.05,
                    ease: "easeOut" as const,
                },
            }),
        }),
        [enter, exit, stagger, reduceMotion]
    )

    // Logo: an image (with real alt text, or treated as decorative) or icon + wordmark
    const logoAltText = item.logoImage?.alt || item.logoAlt || ""
    const logoContent = item.logoImage?.src ? (
        <img
            src={item.logoImage.src}
            srcSet={item.logoImage.srcSet}
            alt={logoAltText}
            aria-hidden={logoAltText ? undefined : true}
            draggable={false}
            style={{
                height: "100%",
                width: "auto",
                display: "block",
                objectFit: "contain",
            }}
        />
    ) : (
        <>
            <BrandIcon type={item.icon} size={logoH} color={cLogo} />
            <span
                style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 24,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    color: cLogo,
                    whiteSpace: "nowrap",
                    ...text.logoFont,
                }}
            >
                {item.brand}
            </span>
        </>
    )

    const logoBoxStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: text.iconGap,
        height: "100%",
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") next()
        if (e.key === "ArrowLeft") prev()
    }

    const onDragEnd = (
        _: any,
        info: { offset: { x: number }; velocity: { x: number } }
    ) => {
        if (info.offset.x < -60 || info.velocity.x < -500) next()
        else if (info.offset.x > 60 || info.velocity.x > 500) prev()
    }

    const quoteStyle: React.CSSProperties = {
        margin: 0,
        textWrap: "pretty" as any,
        fontFamily: "Inter, sans-serif",
        fontWeight: 500,
        fontSize: 36,
        lineHeight: "1.25em",
        letterSpacing: "-0.02em",
        ...text.quoteFont,
    }
    const nameStyle: React.CSSProperties = {
        fontFamily: "Inter, sans-serif",
        fontWeight: 400,
        fontSize: 18,
        lineHeight: "1.2em",
        ...text.nameFont,
    }
    const roleStyle: React.CSSProperties = {
        fontFamily: "Inter, sans-serif",
        fontWeight: 400,
        fontSize: 16,
        lineHeight: "1.2em",
        ...text.roleFont,
    }

    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Testimonials"
            onKeyDown={onKeyDown}
            style={{
                ...style,
                // Fit width has no natural width for wrapping text, so use the 950px default
                width: fitWidth ? 950 : style?.width,
                maxWidth: "100%",
                position: "relative",
                minHeight: 0,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: card.dotsGap,
                padding: card.padding,
                backgroundColor: cBg,
                backgroundImage: card.glow
                    ? `radial-gradient(120% 90% at 100% 0%, ${cGlow} 0%, transparent 60%)`
                    : "none",
                borderRadius: card.radius,
                // Outside stroke: drawn with a spread shadow so it never eats into the card
                boxShadow: card.borderEnabled
                    ? `0 0 0 ${card.borderWidth}px ${card.borderColor}`
                    : "none",
                overflow: "hidden",
            }}
        >
            {card.grain && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        opacity: 0.09,
                        mixBlendMode: "screen",
                        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.1 -0.2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
                        backgroundSize: "220px 220px",
                    }}
                />
            )}

            {/* Content (draggable when Drag is on) */}
            <motion.div
                aria-live="polite"
                drag={dragOn ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                dragSnapToOrigin
                onDragEnd={dragOn ? onDragEnd : undefined}
                style={{
                    position: "relative",
                    flex: 1,
                    minHeight: 0,
                    display: "grid",
                    cursor: dragOn ? "grab" : "default",
                    userSelect: dragOn ? "none" : "auto",
                    touchAction: dragOn ? "pan-y" : "auto",
                }}
                whileTap={dragOn ? { cursor: "grabbing" } : undefined}
            >
                {/* Hidden copies of every testimonial share one grid cell, so the
                    content always reserves the height of the tallest one. */}
                {list.map((it, i) => (
                    <div
                        key={`ghost-${i}`}
                        aria-hidden="true"
                        style={{
                            gridArea: "1 / 1",
                            visibility: "hidden",
                            pointerEvents: "none",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: card.contentGap,
                            width: "100%",
                        }}
                    >
                        <div style={{ height: logoH }} />
                        <blockquote style={quoteStyle}>{it.quote}</blockquote>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            <span style={nameStyle}>{it.name}</span>
                            <span style={roleStyle}>{it.role}</span>
                        </div>
                    </div>
                ))}

                {isStatic ? (
                    <figure
                        style={{
                            gridArea: "1 / 1",
                            margin: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: card.contentGap,
                            width: "100%",
                        }}
                    >
                        <div
                            style={{
                                overflow: "hidden",
                                height: logoH,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <div style={logoBoxStyle}>{logoContent}</div>
                        </div>
                        <blockquote style={{ ...quoteStyle, color: cQuote }}>
                            {item.quote}
                        </blockquote>
                        <figcaption
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                            }}
                        >
                            <span style={{ ...nameStyle, color: cName }}>
                                {item.name}
                            </span>
                            <span style={{ ...roleStyle, color: cRole }}>
                                {item.role}
                            </span>
                        </figcaption>
                    </figure>
                ) : (
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.figure
                            key={safeActive}
                            initial="hidden"
                            animate="show"
                            exit="leave"
                            style={{
                                gridArea: "1 / 1",
                                margin: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: card.contentGap,
                                width: "100%",
                            }}
                        >
                            {/* Logo (mask reveal) */}
                            <div
                                style={{
                                    overflow: "hidden",
                                    height: logoH,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <motion.div
                                    custom={1}
                                    variants={logoVariants as any}
                                    style={logoBoxStyle}
                                >
                                    {logoContent}
                                </motion.div>
                            </div>

                            {/* Quote */}
                            <motion.blockquote
                                custom={0}
                                variants={variants as any}
                                style={{ ...quoteStyle, color: cQuote }}
                            >
                                {item.quote}
                            </motion.blockquote>

                            {/* Author */}
                            <figcaption
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                }}
                            >
                                <motion.span
                                    custom={2}
                                    variants={variants as any}
                                    style={{ ...nameStyle, color: cName }}
                                >
                                    {item.name}
                                </motion.span>
                                <motion.span
                                    custom={3}
                                    variants={variants as any}
                                    style={{ ...roleStyle, color: cRole }}
                                >
                                    {item.role}
                                </motion.span>
                            </figcaption>
                        </motion.figure>
                    </AnimatePresence>
                )}
            </motion.div>

            {/* Pagination */}
            <div
                role="tablist"
                aria-label="Choose testimonial"
                style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: dots.align,
                    alignItems: "center",
                    height: dots.size,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginLeft:
                            dots.align === "flex-start" ? -dots.gap / 2 : 0,
                        marginRight:
                            dots.align === "flex-end" ? -dots.gap / 2 : 0,
                    }}
                >
                    {list.map((_, i) => {
                        const isActive = i === safeActive
                        return (
                            <button
                                key={i}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                aria-label={`Show testimonial ${i + 1} of ${list.length}`}
                                onClick={() => setActive(i)}
                                onFocus={(e) =>
                                    setFocusedDot(
                                        e.currentTarget.matches(
                                            ":focus-visible"
                                        )
                                            ? i
                                            : -1
                                    )
                                }
                                onBlur={() => setFocusedDot(-1)}
                                style={{
                                    all: "unset",
                                    boxSizing: "border-box",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    height: dots.size + 16,
                                    padding: `0 ${dots.gap / 2}px`,
                                    borderRadius: 999,
                                    // after `all: unset` so it isn't reset
                                    outline:
                                        focusedDot === i
                                            ? `2px solid ${cActive}`
                                            : "none",
                                    outlineOffset: 2,
                                }}
                            >
                                <motion.span
                                    initial={false}
                                    animate={{
                                        width: isActive
                                            ? dots.activeWidth
                                            : dots.size,
                                        backgroundColor: isActive
                                            ? cActive
                                            : cDot,
                                    }}
                                    transition={{
                                        duration: dotMorph,
                                        ease: EASE as any,
                                    }}
                                    style={{
                                        display: "block",
                                        height: dots.size,
                                        borderRadius: 999,
                                    }}
                                />
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

TestimonialLogoCard.displayName = "Testimonial Slider Pro"

/* -------------------------------------------------------------------------- */
/*  Framer property controls                                                   */
/* -------------------------------------------------------------------------- */

// Color controls only show when Theme = Custom.
// (Framer passes the root props as the 2nd argument to nested `hidden`.)
const customOnly = (_: any, root: any) => !!root && root.theme !== "custom"

const fontControl = (
    title: string,
    size: string,
    weight: number,
    extra: any = {}
) => ({
    type: ControlType.Font as const,
    title,
    controls: "extended" as const,
    defaultFontType: "sans-serif" as const,
    defaultValue: {
        fontSize: size,
        fontWeight: weight,
        lineHeight: "1.2em",
        ...extra,
    },
})

addPropertyControls(TestimonialLogoCard, {
    /* ---- Content ---- */
    items: {
        type: ControlType.Array,
        title: "Testimonials",
        maxCount: 12,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                logoImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Logo",
                },
                logoAlt: {
                    type: ControlType.String,
                    title: "Logo Alt",
                    placeholder: "Describe the logo (empty = decorative)",
                    defaultValue: "",
                    hidden: (p: any) => !p.logoImage,
                },
                brand: {
                    type: ControlType.String,
                    title: "Brand",
                    defaultValue: "Brand",
                    hidden: (p: any) => !!p.logoImage,
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ["circle", "diamond", "bars", "none"],
                    optionTitles: ["Circle", "Diamond", "Bars", "None"],
                    defaultValue: "circle",
                    hidden: (p: any) => !!p.logoImage,
                },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                    defaultValue: "“Your quote goes here.”",
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Full Name",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Role, Company",
                },
            },
        },
    },

    /* ---- Theme ---- */
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: [
            "sunset",
            "noir",
            "midnight",
            "forest",
            "lavender",
            "paper",
            "custom",
        ],
        optionTitles: [
            "Sunset",
            "Noir",
            "Midnight",
            "Forest",
            "Lavender",
            "Paper",
            "Custom",
        ],
        defaultValue: "sunset",
    },

    /* ---- Behavior (autoplay, drag, animation speed) ---- */
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        icon: "interactive",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                min: 1,
                max: 20,
                step: 0.5,
                unit: "s",
                defaultValue: 2.5,
                hidden: (p: any) => !p.autoplay,
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: false,
            },
            speed: {
                type: ControlType.Number,
                title: "Anim Speed",
                min: 0.25,
                max: 3,
                step: 0.05,
                unit: "x",
                defaultValue: 1,
            },
        },
    },

    /* ---- Card (shape, spacing, border) ---- */
    card: {
        type: ControlType.Object,
        title: "Card",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#1C0F14",
                hidden: customOnly,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 36,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "48px",
            },
            contentGap: {
                type: ControlType.Number,
                title: "Content Gap",
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 42,
            },
            dotsGap: {
                type: ControlType.Number,
                title: "Dots Gap",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 76,
            },
            grain: {
                type: ControlType.Boolean,
                title: "Film Grain",
                defaultValue: true,
            },
            glow: {
                type: ControlType.Boolean,
                title: "Corner Glow",
                defaultValue: true,
            },
            borderEnabled: {
                type: ControlType.Boolean,
                title: "Border",
                defaultValue: false,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "rgba(255,255,255,0.08)",
                hidden: (p: any) => !p.borderEnabled,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                min: 0,
                max: 12,
                step: 0.5,
                unit: "px",
                defaultValue: 1,
                hidden: (p: any) => !p.borderEnabled,
            },
        },
    },

    /* ---- Typography (logo, quote, name, role) ---- */
    text: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            logoFont: fontControl("Logo Font", "24px", 700, {
                letterSpacing: "-0.02em",
            }),
            quoteFont: fontControl("Quote Font", "36px", 500, {
                lineHeight: "1.25em",
                letterSpacing: "-0.02em",
            }),
            nameFont: fontControl("Name Font", "18px", 400),
            roleFont: fontControl("Role Font", "16px", 400),
            iconGap: {
                type: ControlType.Number,
                title: "Icon Gap",
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
                defaultValue: 10,
            },
            logoColor: {
                type: ControlType.Color,
                title: "Logo Color",
                defaultValue: "#FFFFFF",
                hidden: customOnly,
            },
            quoteColor: {
                type: ControlType.Color,
                title: "Quote Color",
                defaultValue: "#FFF1EA",
                hidden: customOnly,
            },
            nameColor: {
                type: ControlType.Color,
                title: "Name Color",
                defaultValue: "#FFF1EA",
                hidden: customOnly,
            },
            roleColor: {
                type: ControlType.Color,
                title: "Role Color",
                defaultValue: "#C79A8D",
                hidden: customOnly,
            },
        },
    },

    /* ---- Dots ---- */
    dots: {
        type: ControlType.Object,
        title: "Dots",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 4,
                max: 24,
                step: 1,
                unit: "px",
                defaultValue: 12,
            },
            activeWidth: {
                type: ControlType.Number,
                title: "Active Width",
                min: 4,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 48,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 12,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["flex-start", "center", "flex-end"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
                defaultValue: "flex-start",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#4A2630",
                hidden: customOnly,
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active Color",
                defaultValue: "#FF7A59",
                hidden: customOnly,
            },
        },
    },
})
