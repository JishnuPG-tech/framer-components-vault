// Instructions: Create a Framer component that follows the Framer component rules and achieves the user's goal.

import type { CSSProperties } from "react"
import { startTransition, useCallback, useMemo, useRef, useState } from "react"
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

type StatItem = {
    icon: string
    label: string
}

interface EstateGlowCardProps {
    image: { src: string; srcSet?: string; alt?: string }
    tag: string
    price: string
    title: string
    description: string
    stats: StatItem[]

    useAdvancedStats: boolean
    bedsText: string
    bathsText: string
    sqftText: string

    cardRadius: number
    tiltStrength: number

    cardBackground: string
    cardBorder: string
    cardShadow: string

    overlayGradientTop: string
    overlayGradientBottom: string

    pillBackground: string
    pillBorder: string
    pillTextColor: string

    accentGradientStart: string
    accentGradientEnd: string

    titleColor: string
    bodyColor: string

    titleFont: any
    bodyFont: any
    statFont: any
    buttonFont: any

    buttonLabel: string
    buttonShadow: string

    glowColor: string
    glowOpacity: number
    glowSize: number

    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function EstateGlowCard(props: EstateGlowCardProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Property image",
        },
        tag,
        price,
        title,
        description,
        stats,
        useAdvancedStats,
        bedsText,
        bathsText,
        sqftText,
        cardRadius,
        tiltStrength,
        cardBackground,
        cardBorder,
        cardShadow,
        overlayGradientTop,
        overlayGradientBottom,
        pillBackground,
        pillBorder,
        pillTextColor,
        accentGradientStart,
        accentGradientEnd,
        titleColor,
        bodyColor,
        titleFont,
        bodyFont,
        statFont,
        buttonFont,
        buttonLabel,
        buttonShadow,
        glowColor,
        glowOpacity,
        glowSize,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const inView = useInView(wrapperRef, { margin: "-10% 0px -10% 0px", amount: 0.2 })

    const [rotate, setRotate] = useState({ x: 0, y: 0 })

    const enableTilt = !isStatic && inView && tiltStrength > 0

    const handlePointerMove = useCallback(
        (e: any) => {
            if (!enableTilt) return
            const card = e.currentTarget as HTMLDivElement
            const rect = card.getBoundingClientRect()

            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            const rotateY = (x / rect.width - 0.5) * tiltStrength
            const rotateX = -(y / rect.height - 0.5) * tiltStrength

            startTransition(() => {
                setRotate({ x: rotateX, y: rotateY })
            })
        },
        [enableTilt, tiltStrength]
    )

    const resetRotate = useCallback(() => {
        startTransition(() => setRotate({ x: 0, y: 0 }))
    }, [])

    const overlayBackground = useMemo(() => {
        return `linear-gradient(to top, ${overlayGradientBottom}, ${overlayGradientTop})`
    }, [overlayGradientBottom, overlayGradientTop])

    const accentGradient = useMemo(() => {
        return `linear-gradient(135deg, ${accentGradientStart}, ${accentGradientEnd})`
    }, [accentGradientStart, accentGradientEnd])

    const glowBackground = useMemo(() => {
        // Use rgba for intensity; allow user to control overall opacity separately.
        return `radial-gradient(circle, ${glowColor}, transparent 70%)`
    }, [glowColor])

    const safeStats = useMemo(() => {
        if (!useAdvancedStats) {
            return [
                { icon: "🛏", label: bedsText },
                { icon: "🛁", label: bathsText },
                { icon: "📐", label: sqftText },
            ]
        }

        const base = Array.isArray(stats) ? stats : []
        if (base.length > 0) return base
        return [
            { icon: "🛏", label: bedsText },
            { icon: "🛁", label: bathsText },
            { icon: "📐", label: sqftText },
        ]
    }, [stats, useAdvancedStats, bedsText, bathsText, sqftText])

    return (
        <div
            ref={wrapperRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                perspective: 900,
            }}
        >
            <motion.div
                onPointerMove={handlePointerMove}
                onPointerLeave={resetRotate}
                onPointerCancel={resetRotate}
                animate={
                    enableTilt
                        ? {
                              rotateX: rotate.x,
                              rotateY: rotate.y,
                          }
                        : { rotateX: 0, rotateY: 0 }
                }
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                whileHover={isStatic ? undefined : { y: -10, scale: 1.02 }}
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: cardRadius,
                    overflow: "hidden",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    background: cardBackground,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: `1px solid ${cardBorder}`,
                    boxShadow: cardShadow,
                    userSelect: "none",
                    touchAction: "none",
                }}
                role="group"
                aria-label={title}
            >
                <div
                    style={{
                        height: "46%",
                        minHeight: 220,
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    <motion.img
                        {...image}
                        alt={image.alt ?? ""}
                        whileHover={isStatic ? undefined : { scale: 1.08 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: overlayBackground,
                        }}
                        aria-hidden="true"
                    />

                    <div
                        style={{
                            position: "absolute",
                            top: 20,
                            left: 20,
                            padding: "10px 18px",
                            borderRadius: 999,
                            background: pillBackground,
                            backdropFilter: "blur(10px)",
                            WebkitBackdropFilter: "blur(10px)",
                            color: pillTextColor,
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: 0.4,
                            border: `1px solid ${pillBorder}`,
                            maxWidth: "calc(100% - 40px)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {tag}
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            bottom: 20,
                            right: 20,
                            padding: "12px 20px",
                            borderRadius: 18,
                            background: accentGradient,
                            color: "#fff",
                            fontSize: 18,
                            fontWeight: 700,
                            boxShadow: buttonShadow,
                            maxWidth: "calc(100% - 40px)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {price}
                    </div>
                </div>

                <div
                    style={{
                        padding: 28,
                        color: titleColor,
                        display: "flex",
                        flexDirection: "column",
                        height: "54%",
                        boxSizing: "border-box",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            marginBottom: 10,
                            color: titleColor,
                            ...titleFont,
                        }}
                    >
                        {title}
                    </h2>

                    <p
                        style={{
                            margin: 0,
                            marginBottom: 22,
                            color: bodyColor,
                            opacity: 0.85,
                            ...bodyFont,
                        }}
                    >
                        {description}
                    </p>

                    <div style={{ display: "flex", gap: 18, marginBottom: 22 }}>
                        {safeStats.slice(0, 3).map((item, idx) => (
                            <div
                                key={`${item.label}-${idx}`}
                                style={{
                                    flex: 1,
                                    padding: 16,
                                    borderRadius: 20,
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    textAlign: "center",
                                    color: titleColor,
                                }}
                            >
                                <div style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</div>
                                <div
                                    style={{
                                        marginTop: 8,
                                        opacity: 0.85,
                                        ...statFont,
                                    }}
                                >
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    <motion.button
                        type="button"
                        whileHover={isStatic ? undefined : { scale: 1.03 }}
                        whileTap={isStatic ? undefined : { scale: 0.98 }}
                        style={{
                            width: "100%",
                            marginTop: "auto",
                            padding: "18px 24px",
                            border: "none",
                            borderRadius: 22,
                            cursor: "pointer",
                            color: "#fff",
                            background: accentGradient,
                            boxShadow: buttonShadow,
                            ...buttonFont,
                        }}
                        aria-label={buttonLabel}
                    >
                        {buttonLabel}
                    </motion.button>
                </div>

                <div
                    style={{
                        position: "absolute",
                        width: glowSize,
                        height: glowSize,
                        borderRadius: "50%",
                        background: glowBackground,
                        top: -glowSize * 0.42,
                        right: -glowSize * 0.42,
                        pointerEvents: "none",
                        filter: "blur(20px)",
                        opacity: glowOpacity,
                    }}
                    aria-hidden="true"
                />
            </motion.div>
        </div>
    )
}

addPropertyControls(EstateGlowCard, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    tag: {
        type: ControlType.String,
        title: "Tag",
        defaultValue: "Luxury Villa",
    },
    price: {
        type: ControlType.String,
        title: "Price",
        defaultValue: "$5,400/mo",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Nova Horizon Estate",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Ocean view modern villa with cinematic architecture and premium interiors.",
        displayTextArea: true,
    },

    useAdvancedStats: {
        type: ControlType.Boolean,
        title: "Stats Mode",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Simple",
    },
    bedsText: {
        type: ControlType.String,
        title: "Beds",
        defaultValue: "4 Beds",
        hidden: ({ useAdvancedStats }) => useAdvancedStats,
    },
    bathsText: {
        type: ControlType.String,
        title: "Baths",
        defaultValue: "3 Baths",
        hidden: ({ useAdvancedStats }) => useAdvancedStats,
    },
    sqftText: {
        type: ControlType.String,
        title: "Sqft",
        defaultValue: "3200 sqft",
        hidden: ({ useAdvancedStats }) => useAdvancedStats,
    },

    stats: {
        type: ControlType.Array,
        title: "Stats",
        maxCount: 3,
        hidden: ({ useAdvancedStats }) => !useAdvancedStats,
        defaultValue: [
            { icon: "🛏", label: "4 Beds" },
            { icon: "🛁", label: "3 Baths" },
            { icon: "📐", label: "3200 sqft" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                icon: { type: ControlType.String, title: "Icon", defaultValue: "🛏" },
                label: { type: ControlType.String, title: "Label", defaultValue: "4 Beds" },
            },
        },
    },

    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 34,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    tiltStrength: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 14,
        min: 0,
        max: 30,
        step: 1,
        unit: "deg",
    },

    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "rgba(255,255,255,0.05)",
    },
    cardBorder: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "rgba(255,255,255,0.12)",
    },
    cardShadow: {
        type: ControlType.BoxShadow,
        title: "Card Shadow",
        defaultValue: "0 20px 80px rgba(0,0,0,0.45), 0 0 40px rgba(88,101,242,0.25)",
    },

    overlayGradientTop: {
        type: ControlType.Color,
        title: "Overlay Top",
        defaultValue: "rgba(0,0,0,0)",
    },
    overlayGradientBottom: {
        type: ControlType.Color,
        title: "Overlay Bottom",
        defaultValue: "rgba(0,0,0,0.7)",
    },

    pillBackground: {
        type: ControlType.Color,
        title: "Tag BG",
        defaultValue: "rgba(255,255,255,0.12)",
    },
    pillBorder: {
        type: ControlType.Color,
        title: "Tag Border",
        defaultValue: "rgba(255,255,255,0.15)",
    },
    pillTextColor: {
        type: ControlType.Color,
        title: "Tag Text",
        defaultValue: "#FFFFFF",
    },

    accentGradientStart: {
        type: ControlType.Color,
        title: "Accent A",
        defaultValue: "#5B8CFF",
    },
    accentGradientEnd: {
        type: ControlType.Color,
        title: "Accent B",
        defaultValue: "#9D4EDD",
    },

    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "#FFFFFF",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "30px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1.1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.35em",
        },
    },
    statFont: {
        type: ControlType.Font,
        title: "Stat Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
            textAlign: "center",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
            textAlign: "center",
        },
    },

    buttonLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "View Property",
    },
    buttonShadow: {
        type: ControlType.BoxShadow,
        title: "Accent Shadow",
        defaultValue: "0 10px 30px rgba(91,140,255,0.35)",
    },

    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "rgba(120,80,255,0.35)",
    },
    glowOpacity: {
        type: ControlType.Number,
        title: "Glow Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        defaultValue: 240,
        min: 80,
        max: 520,
        step: 10,
        unit: "px",
    },
})
