// User instructions: Create a highly polished, production-ready premium UI component with exceptional visual hierarchy and professional spacing. Use an 8px spacing system, consistent padding, balanced margins, and pixel-perfect alignment throughout the layout. Include smooth hover animations, micro-interactions, glassmorphism/soft shadows, modern gradient accents, fully responsive design, clean typography, perfect content spacing, interactive buttons with hover states, elegant card layout, subtle floating effects, premium color palette, professional border radius, layered depth and visual balance, well-structured stacks with consistent gaps, accessibility-friendly contrast, smooth transitions (300ms–500ms), modern icon integration, optimized layout for desktop/tablet/mobile. Style: Minimal, futuristic, premium, elegant.

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

import { motion, useInView } from "framer-motion"

type IconName = "sparkle" | "shield" | "bolt" | "layers" | "wand"

type CardItem = {
    title: string
    description: string
    icon: IconName
    iconMode?: "preset" | "custom"
    iconFile?: string
    badge: string
    highlight: boolean
}

type Palette = {
    background: string
    surface: string
    surfaceHover: string
    text: string
    mutedText: string
    border: string
    borderHover: string
    accentA: string
    accentB: string
    buttonText: string
}

interface PremiumGlassCardsProps {
    eyebrow: string
    heading: string
    subheading: string
    primaryLabel: string
    primaryLink: string
    secondaryLabel: string
    secondaryLink: string

    cards: CardItem[]

    palette: Palette
    radius: number
    padding: number

    headingFont: any
    bodyFont: any
    buttonFont: any

    enableSelection: boolean
    selectedIndex: number

    style?: React.CSSProperties
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

function Icon({ name, color }: { name: IconName; color: string }) {
    const common = {
        width: 20,
        height: 20,
        viewBox: "0 0 24 24",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        role: "img" as const,
        "aria-hidden": true,
    }

    const stroke = color

    switch (name) {
        case "sparkle":
            return (
                <svg {...common}>
                    <path
                        d="M12 2l1.1 5.2L18 8.3l-4.9 1.1L12 14l-1.1-4.6L6 8.3l4.9-1.1L12 2z"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M19 13l.7 2.8L22 16.5l-2.3.7L19 20l-.7-2.8L16 16.5l2.3-.7L19 13z"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                        opacity="0.9"
                    />
                </svg>
            )
        case "shield":
            return (
                <svg {...common}>
                    <path
                        d="M12 2l8 4v6c0 5-3.5 9.4-8 10-4.5-.6-8-5-8-10V6l8-4z"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9.5 12.2l1.8 1.8 3.2-4"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )
        case "bolt":
            return (
                <svg {...common}>
                    <path
                        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                </svg>
            )
        case "layers":
            return (
                <svg {...common}>
                    <path
                        d="M12 2l9 5-9 5-9-5 9-5z"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M3 12l9 5 9-5"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                        opacity="0.95"
                    />
                    <path
                        d="M3 17l9 5 9-5"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                        opacity="0.75"
                    />
                </svg>
            )
        case "wand":
        default:
            return (
                <svg {...common}>
                    <path
                        d="M3 21l9-9"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <path
                        d="M14 3l7 7"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <path
                        d="M12 5l2-2"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <path
                        d="M19 12l2-2"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    <path
                        d="M16 6l2 2"
                        stroke={stroke}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        opacity="0.9"
                    />
                </svg>
            )
    }
}

function SvgIconImage({ src, alt = "" }: { src: string; alt?: string }) {
    return (
        <img
            src={src}
            alt={alt}
            style={{ width: 20, height: 20, display: "block" }}
            draggable={false}
        />
    )
}

function usePrefersReducedMotionSafe() {
    const [reduced, setReduced] = React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)")
        if (!mql) return
        const update = () => React.startTransition(() => setReduced(!!mql.matches))
        update()
        // Safari compat
        // @ts-ignore
        mql.addEventListener ? mql.addEventListener("change", update) : mql.addListener(update)
        return () => {
            // @ts-ignore
            mql.removeEventListener ? mql.removeEventListener("change", update) : mql.removeListener(update)
        }
    }, [])

    return reduced
}

/**
 * Premium Glass Cards
 *
 * @framerIntrinsicWidth 920
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PremiumGlassCards(props: PremiumGlassCardsProps) {
    const {
        eyebrow,
        heading,
        subheading,
        primaryLabel,
        primaryLink,
        secondaryLabel,
        secondaryLink,
        cards,
        palette,
        radius,
        padding,
        headingFont,
        bodyFont,
        buttonFont,
        enableSelection,
        selectedIndex,
        style,
    } = props

    const defaultCustomIconSvg =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'><path d='M12 2l2.2 7H22l-6.2 4.5L18 21l-6-4.2L6 21l2.2-7.5L2 9h7.8L12 2z' stroke='white' stroke-width='1.8' stroke-linejoin='round'/></svg>`,
        )

    const isStatic = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.thumbnail
    const reducedMotion = usePrefersReducedMotionSafe()

    const containerRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(containerRef, { amount: 0.25, margin: "-10% 0px -10% 0px" })

    const [active, setActive] = React.useState(() => clamp(selectedIndex ?? 0, 0, Math.max(0, cards.length - 1)))

    React.useEffect(() => {
        React.startTransition(() => {
            setActive(clamp(selectedIndex ?? 0, 0, Math.max(0, cards.length - 1)))
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedIndex, cards.length])

    const gap = 16 // 8px system (2 units)
    const s8 = 8

    const containerPad = Math.round(padding / 8) * 8

    const gradient = `linear-gradient(135deg, ${palette.accentA}, ${palette.accentB})`

    const onSelect = React.useCallback(
        (idx: number) => {
            if (!enableSelection) return
            React.startTransition(() => setActive(idx))
        },
        [enableSelection],
    )

    const cardMotionEnabled = !isStatic && !reducedMotion
    const floatEnabled = cardMotionEnabled && inView

    const cardBaseShadow = "0 18px 50px rgba(0,0,0,0.18)"
    const cardHoverShadow = "0 26px 70px rgba(0,0,0,0.22)"

    const gridTemplate = "repeat(12, minmax(0, 1fr))"

    return (
        <section
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "auto",
                borderRadius: radius,
                background: palette.background,
                color: palette.text,
                padding: containerPad,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "stretch",
            }}
            aria-label="Premium cards"
        >
            <style>{`
                .pgc-wrap{width:100%;display:flex;flex-direction:column;gap:${gap * 2}px;flex:1;min-height:0;overflow:visible;}\n                .pgc-top{display:flex;flex-direction:column;gap:${gap}px;flex:0 0 auto;}\n                .pgc-actions{display:flex;flex-wrap:wrap;gap:${s8 * 2}px;align-items:center;}\n                .pgc-grid{display:grid;grid-template-columns:${gridTemplate};gap:${gap}px;align-items:stretch;}\n                .pgc-card{grid-column: span 4;}\n                .pgc-cardBtn{height:100%;}\n                .pgc-eyebrow{letter-spacing:0.08em;text-transform:uppercase;}\n                .pgc-sub{max-width:64ch;}\n\n                .pgc-cardBtn:hover .pgc-cardInner{transform:translateY(-1px);border-color:var(--pgc-cardBorderHover);background:var(--pgc-cardBgHover);box-shadow:var(--pgc-cardShadowHover);}\n                .pgc-cardBtn:hover .pgc-glow{opacity:var(--pgc-cardGlowHoverOpacity);}\n                .pgc-cardBtn:focus-visible .pgc-cardInner{border-color:var(--pgc-cardBorderHover);}\n\n                @media (max-width: 980px){\n                    .pgc-card{grid-column: span 6;}\n                }\n                @media (max-width: 640px){\n                    .pgc-wrap{gap:${gap * 1.5}px;}\n                    .pgc-card{grid-column: span 12;}\n                }\n\n                .pgc-btn{appearance:none;border:none;background:transparent;cursor:pointer;text-decoration:none;}\n                .pgc-btn:focus-visible{outline:none;box-shadow:0 0 0 4px rgba(255,255,255,0.16), 0 0 0 7px rgba(0,0,0,0.25);}\n                .pgc-cardBtn:focus-visible{outline:none;box-shadow:0 0 0 4px rgba(255,255,255,0.14), 0 0 0 7px rgba(0,0,0,0.28);}\n            `}</style>

            <div className="pgc-wrap">
                <header className="pgc-top">
                    <div style={{ display: "flex", flexDirection: "column", gap: s8 }}>
                        <div
                            className="pgc-eyebrow"
                            style={{
                                ...bodyFont,
                                fontSize: "12px",
                                lineHeight: "16px",
                                color: palette.mutedText,
                                opacity: 0.95,
                            }}
                        >
                            {eyebrow}
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: s8,
                                alignItems: "flex-start",
                            }}
                        >
                            <h2
                                style={{
                                    margin: 0,
                                    ...headingFont,
                                    fontSize: "clamp(24px, 3.1vw, 40px)",
                                    lineHeight: "1.05em",
                                    letterSpacing: "-0.04em",
                                }}
                            >
                                {heading}
                            </h2>
                            <p
                                className="pgc-sub"
                                style={{
                                    margin: 0,
                                    ...bodyFont,
                                    color: palette.mutedText,
                                    fontSize: "clamp(14px, 1.35vw, 16px)",
                                    lineHeight: "1.55em",
                                }}
                            >
                                {subheading}
                            </p>
                        </div>
                    </div>

                    <div className="pgc-actions" aria-label="Actions">
                        <a
                            className="pgc-btn"
                            href={primaryLink}
                            target={primaryLink?.startsWith("http") ? "_blank" : undefined}
                            rel={primaryLink?.startsWith("http") ? "noreferrer" : undefined}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: s8,
                                padding: `${s8 * 1.5}px ${s8 * 2.5}px`,
                                borderRadius: Math.max(10, Math.round(radius * 0.6)),
                                background: gradient,
                                color: palette.buttonText,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.24)",
                                transition: "transform 350ms cubic-bezier(.2,.8,.2,1), filter 350ms cubic-bezier(.2,.8,.2,1)",
                                textDecoration: "none",
                                userSelect: "none",
                                WebkitTapHighlightColor: "transparent",
                                ...buttonFont,
                            }}
                            aria-label={primaryLabel}
                            onMouseDown={(e) => {
                                ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(1px) scale(0.99)"
                            }}
                            onMouseUp={(e) => {
                                ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0px) scale(1)"
                            }}
                            onMouseEnter={(e) => {
                                ;(e.currentTarget as HTMLAnchorElement).style.filter = "saturate(1.1) brightness(1.05)"
                                ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"
                            }}
                            onMouseLeave={(e) => {
                                ;(e.currentTarget as HTMLAnchorElement).style.filter = "none"
                                ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0px)"
                            }}
                        >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: s8 }}>
                                <span aria-hidden="true" style={{ display: "inline-flex" }}>
                                    <Icon name="sparkle" color={palette.buttonText} />
                                </span>
                                <span style={{ lineHeight: "1em" }}>{primaryLabel}</span>
                            </span>
                        </a>

                        <a
                            className="pgc-btn"
                            href={secondaryLink}
                            target={secondaryLink?.startsWith("http") ? "_blank" : undefined}
                            rel={secondaryLink?.startsWith("http") ? "noreferrer" : undefined}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: s8,
                                padding: `${s8 * 1.5}px ${s8 * 2.5}px`,
                                borderRadius: Math.max(10, Math.round(radius * 0.6)),
                                color: palette.text,
                                border: `1px solid ${palette.border}`,
                                background: "rgba(255,255,255,0.04)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                                transition:
                                    "transform 350ms cubic-bezier(.2,.8,.2,1), background-color 350ms cubic-bezier(.2,.8,.2,1), border-color 350ms cubic-bezier(.2,.8,.2,1)",
                                textDecoration: "none",
                                userSelect: "none",
                                WebkitTapHighlightColor: "transparent",
                                ...buttonFont,
                            }}
                            aria-label={secondaryLabel}
                            onMouseEnter={(e) => {
                                ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)"
                                ;(e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.07)"
                                ;(e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.18)"
                            }}
                            onMouseLeave={(e) => {
                                ;(e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0px)"
                                ;(e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"
                                ;(e.currentTarget as HTMLAnchorElement).style.borderColor = palette.border
                            }}
                        >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: s8 }}>
                                <span style={{ lineHeight: "1em" }}>{secondaryLabel}</span>
                                <span aria-hidden="true" style={{ display: "inline-flex" }}>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M7 17L17 7"
                                            stroke={palette.text}
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d="M10 7h7v7"
                                            stroke={palette.text}
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                            </span>
                        </a>
                    </div>
                </header>

                <div className="pgc-grid" aria-label="Feature cards">
                    {cards.map((c, i) => {
                        const selected = enableSelection ? i === active : false
                        const highlighted = c.highlight

                        const borderGradient = `linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))`
                        const edgeGlow = `linear-gradient(135deg, ${palette.accentA}33, ${palette.accentB}22)`

                        const cardRadius = Math.max(14, Math.round(radius * 0.7))

                        const iconMode = c.iconMode ?? "preset"
                        const iconFile = c.iconFile || defaultCustomIconSvg

                        return (
                            <motion.button
                                key={i}
                                type="button"
                                className="pgc-card pgc-cardBtn"
                                onClick={() => onSelect(i)}
                                aria-pressed={enableSelection ? selected : undefined}
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    textAlign: "left",
                                    padding: 0,
                                    border: "none",
                                    background: "transparent",
                                    cursor: enableSelection ? "pointer" : "default",
                                    WebkitTapHighlightColor: "transparent",
                                }}
                                initial={false}
                                animate={
                                    floatEnabled
                                        ? {
                                              y: highlighted ? [0, -3, 0] : [0, -2, 0],
                                          }
                                        : { y: 0 }
                                }
                                transition={
                                    floatEnabled
                                        ? {
                                              duration: highlighted ? 5.8 : 6.5,
                                              repeat: Infinity,
                                              ease: "easeInOut",
                                          }
                                        : { duration: 0.001 }
                                }
                                whileHover={
                                    cardMotionEnabled
                                        ? {
                                              y: -4,
                                              scale: 1.01,
                                          }
                                        : undefined
                                }
                                whileTap={cardMotionEnabled ? { scale: 0.99, y: -2 } : undefined}
                            >
                                <div
                                    className="pgc-cardInner"
                                    style={{
                                        position: "relative",
                                        height: "100%",
                                        borderRadius: cardRadius,
                                        overflow: "hidden",
                                        background: "var(--pgc-cardBg)",
                                        border: "1px solid var(--pgc-cardBorder)",
                                        boxShadow: "var(--pgc-cardShadow)",
                                        transition:
                                            "box-shadow 420ms cubic-bezier(.2,.8,.2,1), border-color 420ms cubic-bezier(.2,.8,.2,1), transform 420ms cubic-bezier(.2,.8,.2,1)",
                                        transform: "translateY(0px)",
                                        ["--pgc-cardBg" as any]: palette.surface,
                                        ["--pgc-cardBgHover" as any]: palette.surfaceHover,
                                        ["--pgc-cardBorder" as any]: palette.border,
                                        ["--pgc-cardBorderHover" as any]: palette.borderHover,
                                        ["--pgc-cardShadow" as any]: selected || highlighted ? cardHoverShadow : cardBaseShadow,
                                        ["--pgc-cardShadowHover" as any]: cardHoverShadow,
                                        ["--pgc-cardGlowHoverOpacity" as any]: 0.6,
                                    }}
                                >
                                    {/* Glow layer */}
                                    <div
                                        className="pgc-glow"
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: -2,
                                            background: highlighted || selected ? edgeGlow : "transparent",
                                            filter: "blur(18px)",
                                            opacity: highlighted || selected ? 1 : "var(--pgc-glowOpacity, 0)",
                                            transition: "opacity 420ms cubic-bezier(.2,.8,.2,1)",
                                        }}
                                    />

                                    {/* Glass overlay */}
                                    <div
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: borderGradient,
                                            opacity: 1,
                                            pointerEvents: "none",
                                        }}
                                    />

                                    {/* Content */}
                                    <div
                                        style={{
                                            position: "relative",
                                            padding: `${s8 * 3}px ${s8 * 3}px`,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: s8 * 2,
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: s8 * 2 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: s8 * 1.5 }}>
                                                <div
                                                    aria-hidden="true"
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 12,
                                                        background: `linear-gradient(135deg, ${palette.accentA}2E, ${palette.accentB}24)`,
                                                        border: "1px solid rgba(255,255,255,0.12)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                                                    }}
                                                >
                                                    {iconMode === "custom" ? (
                                                        <SvgIconImage src={iconFile} alt="" />
                                                    ) : (
                                                        <Icon name={c.icon} color={palette.text} />
                                                    )}
                                                </div>

                                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                    <div
                                                        style={{
                                                            ...headingFont,
                                                            fontSize: "16px",
                                                            lineHeight: "20px",
                                                            letterSpacing: "-0.02em",
                                                            margin: 0,
                                                        }}
                                                    >
                                                        {c.title}
                                                    </div>
                                                    <div
                                                        style={{
                                                            ...bodyFont,
                                                            fontSize: "13px",
                                                            lineHeight: "16px",
                                                            color: palette.mutedText,
                                                        }}
                                                    >
                                                        {c.badge}
                                                    </div>
                                                </div>
                                            </div>

                                            {(highlighted || selected) && (
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        padding: "6px 10px",
                                                        borderRadius: 999,
                                                        background: gradient,
                                                        color: palette.buttonText,
                                                        ...bodyFont,
                                                        fontSize: "12px",
                                                        lineHeight: "14px",
                                                        boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                                                    }}
                                                    aria-label={highlighted ? "Highlighted" : "Selected"}
                                                >
                                                    <span aria-hidden="true" style={{ display: "inline-flex" }}>
                                                        <Icon name="sparkle" color={palette.buttonText} />
                                                    </span>
                                                    {highlighted ? "Premium" : "Active"}
                                                </div>
                                            )}
                                        </div>

                                        <p
                                            style={{
                                                margin: 0,
                                                ...bodyFont,
                                                fontSize: "14px",
                                                lineHeight: "1.55em",
                                                color: palette.mutedText,
                                            }}
                                        >
                                            {c.description}
                                        </p>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: s8 * 2,
                                                paddingTop: s8,
                                                borderTop: `1px solid rgba(255,255,255,0.08)`,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: s8,
                                                    ...bodyFont,
                                                    fontSize: "12px",
                                                    lineHeight: "14px",
                                                    color: palette.mutedText,
                                                }}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: 999,
                                                        background: highlighted ? gradient : "rgba(255,255,255,0.28)",
                                                        boxShadow: highlighted ? "0 0 0 3px rgba(255,255,255,0.06)" : "none",
                                                    }}
                                                />
                                                <span>Optimized for clarity</span>
                                            </div>

                                            <div
                                                aria-hidden="true"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    ...bodyFont,
                                                    fontSize: "12px",
                                                    lineHeight: "14px",
                                                    color: palette.text,
                                                    opacity: 0.9,
                                                }}
                                            >
                                                <span>Explore</span>
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M9 18l6-6-6-6"
                                                        stroke={palette.text}
                                                        strokeWidth="1.8"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

addPropertyControls(PremiumGlassCards, {
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "PREMIUM UI",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Glassmorphism Feature Cards",
    },
    subheading: {
        type: ControlType.String,
        title: "Subheading",
        defaultValue:
            "A futuristic, minimal set of premium cards with micro-interactions, layered depth, and a consistent 8px spacing system.",
        displayTextArea: true,
    },
    primaryLabel: {
        type: ControlType.String,
        title: "Primary Label",
        defaultValue: "Get the Kit",
    },
    primaryLink: {
        type: ControlType.Link,
        title: "Primary Link",
        defaultValue: "https://framer.com",
    },
    secondaryLabel: {
        type: ControlType.String,
        title: "Secondary Label",
        defaultValue: "View Docs",
    },
    secondaryLink: {
        type: ControlType.Link,
        title: "Secondary Link",
        defaultValue: "https://www.framer.com/learn/",
    },
    enableSelection: {
        type: ControlType.Boolean,
        title: "Selection",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    selectedIndex: {
        type: ControlType.Number,
        title: "Selected",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 1,
        hidden: ({ enableSelection }) => !enableSelection,
    },
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 6,
        defaultValue: [
            {
                title: "Hierarchy",
                description: "Balanced spacing, precise alignment, and purposeful contrast that reads beautifully at every breakpoint.",
                icon: "layers",
                iconMode: "preset",
                iconFile: "",
                badge: "Layout system",
                highlight: true,
            },
            {
                title: "Motion",
                description: "Subtle floating, springy hover affordances, and micro-interactions tuned to feel premium (300–500ms).",
                icon: "wand",
                iconMode: "preset",
                iconFile: "",
                badge: "Interaction",
                highlight: false,
            },
            {
                title: "Craft",
                description: "Glass surfaces, soft shadows, and gradient accents—refined for product-grade UI with accessible contrast.",
                icon: "shield",
                iconMode: "preset",
                iconFile: "",
                badge: "Polish",
                highlight: false,
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Card" },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Description",
                    displayTextArea: true,
                },
                iconMode: {
                    type: ControlType.Enum,
                    title: "Icon Type",
                    options: ["preset", "custom"],
                    optionTitles: ["Preset", "Custom SVG"],
                    defaultValue: "preset",
                    displaySegmentedControl: true,
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ["sparkle", "shield", "bolt", "layers", "wand"],
                    optionTitles: ["Sparkle", "Shield", "Bolt", "Layers", "Wand"],
                    defaultValue: "sparkle",
                    hidden: ({ iconMode }) => iconMode === "custom",
                },
                iconFile: {
                    type: ControlType.File,
                    title: "SVG",
                    allowedFileTypes: ["svg"],
                    hidden: ({ iconMode }) => iconMode !== "custom",
                },
                badge: { type: ControlType.String, title: "Badge", defaultValue: "Badge" },
                highlight: {
                    type: ControlType.Boolean,
                    title: "Highlight",
                    defaultValue: false,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                },
            },
        },
    },
    palette: {
        type: ControlType.Object,
        title: "Palette",
        icon: "color",
        defaultValue: {
            background: "#070A12",
            surface: "rgba(255,255,255,0.06)",
            surfaceHover: "rgba(255,255,255,0.08)",
            text: "#FFFFFF",
            mutedText: "rgba(255,255,255,0.74)",
            border: "rgba(255,255,255,0.12)",
            borderHover: "rgba(255,255,255,0.22)",
            accentA: "#7C5CFF",
            accentB: "#00D4FF",
            buttonText: "#0B0D14",
        },
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#070A12" },
            surface: { type: ControlType.Color, title: "Surface", defaultValue: "rgba(255,255,255,0.06)" },
            surfaceHover: {
                type: ControlType.Color,
                title: "Surface Hover",
                defaultValue: "rgba(255,255,255,0.08)",
            },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
            mutedText: { type: ControlType.Color, title: "Muted", defaultValue: "rgba(255,255,255,0.74)" },
            border: { type: ControlType.Color, title: "Border", defaultValue: "rgba(255,255,255,0.12)" },
            borderHover: { type: ControlType.Color, title: "Border Hover", defaultValue: "rgba(255,255,255,0.22)" },
            accentA: { type: ControlType.Color, title: "Accent A", defaultValue: "#7C5CFF" },
            accentB: { type: ControlType.Color, title: "Accent B", defaultValue: "#00D4FF" },
            buttonText: { type: ControlType.Color, title: "Btn Text", defaultValue: "#0B0D14" },
        },
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 8,
        max: 48,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 32,
        min: 16,
        max: 80,
        step: 8,
        unit: "px",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            variant: "Semibold",
            fontSize: "14px",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
