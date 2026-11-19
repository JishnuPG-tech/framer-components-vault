import React, { useRef, useMemo } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Collectible Card 3D
 * Interactive 3D tilt trading / collectible card with metallic shine presets.
 * Designed by Sinax ❤️
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 570
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

function getAssetUrl(imageProp: any): string {
    if (!imageProp) return ""
    if (typeof imageProp === "string") return imageProp
    if (typeof imageProp === "object" && imageProp.src) return imageProp.src
    return ""
}

function hexToRgb(hex: string) {
    // Supports #rgb, #rrggbb and rgb()/rgba() strings coming from the color picker
    if (typeof hex === "string" && hex.startsWith("rgb")) {
        const m = hex.match(/[\d.]+/g)
        if (m && m.length >= 3) {
            return { r: Math.round(+m[0]), g: Math.round(+m[1]), b: Math.round(+m[2]) }
        }
    }
    let c = (hex || "#ffffff").replace("#", "")
    if (c.length === 3)
        c = c
            .split("")
            .map((x) => x + x)
            .join("")
    const num = parseInt(c.slice(0, 6), 16)
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    }
}

function toHex6(color: string) {
    const { r, g, b } = hexToRgb(color)
    const h = (n: number) => n.toString(16).padStart(2, "0")
    return `#${h(r)}${h(g)}${h(b)}`
}

type Preset =
    | "silver"
    | "obsidian"
    | "gold"
    | "holographic"
    | "rose"
    | "emerald"
    | "custom"

interface CollectibleCard3DProps {
    width?: number | string
    height?: number | string
    image?: { src?: any; padding?: number }
    content?: {
        title?: string
        subtitle?: string
        price?: string
        watermark?: string
    }
    cardStyle?: {
        preset?: Preset
        shine?: number
        cardColor?: string
        shineColor?: string
    }
    typography?: {
        titleFont?: any
        subtitleFont?: any
        priceFont?: any
        watermarkFont?: any
    }
    colors?: {
        titleColor?: string
        subtitleColor?: string
        priceColor?: string
        priceBackground?: string
        watermarkFill?: string
        watermarkOutline?: string
    }
    credit?: string
}

export default function CollectibleCard3D(props: CollectibleCard3DProps) {
    const image = props.image || {}
    const content = props.content || {}
    const cardStyle = props.cardStyle || {}
    const typography = props.typography || {}
    const colors = props.colors || {}

    const imagePadding = image.padding ?? 16
    const cardTitle = content.title ?? "Sinax LC"
    const subTitle = content.subtitle ?? "THIS IS A COLLECTIBLE LIMITED EDITION "
    const price = content.price ?? "$150"
    const watermarkText = content.watermark ?? "SILVER"

    const presetTheme: Preset = cardStyle.preset ?? "obsidian"
    const shineIntensity = cardStyle.shine ?? 2
    const customCardColor = toHex6(cardStyle.cardColor ?? "#55585d")
    const customShineColor = cardStyle.shineColor ?? "#ffffff"

    const titleColor = colors.titleColor ?? "rgba(255,255,255,0.85)"
    const subtitleColor = colors.subtitleColor ?? "rgba(255,255,255,0.4)"
    const priceColor = colors.priceColor ?? "#ffffff"
    const priceBackground = colors.priceBackground ?? "rgba(30, 31, 33, 0.8)"
    const watermarkFill = colors.watermarkFill ?? "rgba(255, 255, 255, 0.16)"
    const watermarkOutline = colors.watermarkOutline ?? "rgba(255, 255, 255, 0.4)"

    // Typography: Framer's own font picker values, with safe fallbacks
    const titleFont = {
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontWeight: 800,
        fontSize: 22,
        letterSpacing: "0.04em",
        lineHeight: 1,
        ...(typography.titleFont || {}),
    }
    const subtitleFont = {
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 500,
        fontSize: 7.2,
        letterSpacing: "0.04em",
        ...(typography.subtitleFont || {}),
    }
    const priceFont = {
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        fontSize: 11,
        ...(typography.priceFont || {}),
    }
    const watermarkFont = {
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontWeight: 900,
        letterSpacing: "0.08em",
        ...(typography.watermarkFont || {}),
    }

    const cardRef = useRef<HTMLDivElement>(null)

    // Interactive 3D tilt tracking
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const hoverVal = useMotionValue(0)

    const mouseXSpring = useSpring(x, { stiffness: 220, damping: 24 })
    const mouseYSpring = useSpring(y, { stiffness: 220, damping: 24 })
    const hoverSpring = useSpring(hoverVal, { stiffness: 200, damping: 25 })

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["14deg", "-14deg"])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-14deg", "14deg"])

    const sheenProgress = useTransform(mouseXSpring, [-0.5, 0.5], [10, 90])
    const sheenAngle = useTransform(mouseXSpring, [-0.5, 0.5], [115, 145])

    // --- PRESET THEMES ---
    const themeStyles = useMemo(() => {
        switch (presetTheme) {
            case "obsidian":
                return {
                    cardBg: "linear-gradient(145deg, #2d2f33 0%, #151618 40%, #25262a 70%, #0d0e10 100%)",
                    coreColor: `rgba(215, 230, 255, ${0.32 * shineIntensity})`,
                    faintColor: "rgba(255, 255, 255, 0.03)",
                    isHolo: false,
                }
            case "gold":
                return {
                    cardBg: "linear-gradient(145deg, #e3bd68 0%, #8b6823 40%, #ceac5b 70%, #583f12 100%)",
                    coreColor: `rgba(255, 245, 195, ${0.52 * shineIntensity})`,
                    faintColor: "rgba(255, 215, 120, 0.07)",
                    isHolo: false,
                }
            case "holographic":
                return {
                    cardBg: "linear-gradient(145deg, #8ba3c7 0%, #5f4a7c 35%, #7aa599 70%, #3e3256 100%)",
                    coreColor: "",
                    faintColor: "",
                    isHolo: true,
                }
            case "rose":
                return {
                    cardBg: "linear-gradient(145deg, #d89f95 0%, #8b554c 40%, #c4887e 70%, #592e27 100%)",
                    coreColor: `rgba(255, 220, 215, ${0.46 * shineIntensity})`,
                    faintColor: "rgba(255, 190, 180, 0.06)",
                    isHolo: false,
                }
            case "emerald":
                return {
                    cardBg: "linear-gradient(145deg, #4da47f 0%, #194a37 40%, #398865 70%, #0d281e 100%)",
                    coreColor: `rgba(140, 255, 215, ${0.45 * shineIntensity})`,
                    faintColor: "rgba(80, 220, 160, 0.06)",
                    isHolo: false,
                }
            case "custom": {
                const { r, g, b } = hexToRgb(customShineColor)
                return {
                    cardBg: `linear-gradient(145deg, ${customCardColor}ee 0%, ${customCardColor}77 40%, ${customCardColor}cc 70%, #121315 100%)`,
                    coreColor: `rgba(${r}, ${g}, ${b}, ${0.42 * shineIntensity})`,
                    faintColor: `rgba(${r}, ${g}, ${b}, 0.05)`,
                    isHolo: false,
                }
            }
            case "silver":
            default:
                return {
                    cardBg: "linear-gradient(145deg, #a8a9ab 0%, #646568 40%, #87888a 70%, #444547 100%)",
                    coreColor: `rgba(255, 255, 255, ${0.4 * shineIntensity})`,
                    faintColor: "rgba(255, 255, 255, 0.05)",
                    isHolo: false,
                }
        }
    }, [presetTheme, shineIntensity, customCardColor, customShineColor])

    // Shapeless surface shine gradient
    const backgroundSheen = useTransform(
        [sheenAngle, sheenProgress],
        ([angle, progress]) => {
            const p = Number(progress)
            if (themeStyles.isHolo) {
                return `linear-gradient(${angle}deg, rgba(255,255,255,0) 0%, rgba(255,100,180,${0.32 * shineIntensity}) ${p - 18}%, rgba(100,240,255,${0.48 * shineIntensity}) ${p}%, rgba(255,230,120,${0.38 * shineIntensity}) ${p + 18}%, rgba(255,255,255,0) 100%)`
            }
            return `linear-gradient(${angle}deg, rgba(255,255,255,0) 0%, ${themeStyles.faintColor} 15%, ${themeStyles.coreColor} ${p}%, ${themeStyles.faintColor} 85%, rgba(255,255,255,0) 100%)`
        }
    )

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const mouseX = (e.clientX - rect.left) / rect.width - 0.5
        const mouseY = (e.clientY - rect.top) / rect.height - 0.5
        x.set(mouseX)
        y.set(mouseY)
    }

    const handleMouseEnter = () => {
        hoverVal.set(1)
    }

    const handleMouseLeave = () => {
        hoverVal.set(0)
        x.set(0)
        y.set(0)
    }

    const headshotSrc = getAssetUrl(image.src)

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                background: "transparent",
                perspective: 1200,
                padding: 24,
                boxSizing: "border-box",
                overflow: "visible", // lets the card shadow spill out softly instead of being clipped into a box
                WebkitFontSmoothing: "antialiased",
                textRendering: "optimizeLegibility",
            }}
        >
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX,
                    rotateY,
                    // Flat plane: every layer tilts together as one sharp surface.
                    // (Separate translateZ layers were being rasterised at low resolution, which made text and image look soft.)
                    transformStyle: "flat",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    width: 350,
                    height: 520,
                    borderRadius: 36,
                    background: themeStyles.cardBg,
                    boxShadow:
                        "0 35px 70px -15px rgba(0,0,0,0.92), inset 0 1px 2px rgba(255,255,255,0.7), inset 0 -2px 5px rgba(0,0,0,0.7)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px 16px 20px 16px",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    userSelect: "none",
                }}
            >
                {/* --- METALLIC HOVER SHINE --- */}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 36,
                        backgroundImage: backgroundSheen,
                        opacity: hoverSpring,
                        mixBlendMode: "overlay",
                        pointerEvents: "none",
                        zIndex: 20,
                    }}
                />

                {/* --- INNER SCREEN VIEWPORT --- */}
                <div
                    style={
                        {
                            flex: 1,
                            borderRadius: 24,
                            background:
                                "linear-gradient(180deg, #18191a 0%, #0d0e0f 100%)",
                            boxShadow:
                                "inset 0 3px 6px rgba(0,0,0,0.9), inset 0 0 20px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.25)",
                            position: "relative",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            padding: 14,
                            containerType: "inline-size",
                        } as React.CSSProperties
                    }
                >
                    {/* WATERMARK (centred with flex, not a fractional translate, so it stays crisp) */}
                    <div
                        style={{
                            position: "absolute",
                            top: "-6%",
                            left: 0,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            pointerEvents: "none",
                            zIndex: 1,
                        }}
                    >
                        <span
                            style={{
                                ...watermarkFont,
                                fontSize: "clamp(90px, 35cqw, 140px)",
                                color: watermarkFill,
                                WebkitTextStroke: `1.5px ${watermarkOutline}`,
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                                textAlign: "center",
                                userSelect: "none",
                                lineHeight: 1,
                                flexShrink: 0,
                            }}
                        >
                            {watermarkText}
                        </span>
                    </div>

                    {/* IMAGE */}
                    <div
                        style={{
                            position: "absolute",
                            top: imagePadding,
                            bottom: Math.max(imagePadding, 48),
                            left: imagePadding,
                            right: imagePadding,
                            zIndex: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                        }}
                    >
                        {headshotSrc ? (
                            <img
                                src={headshotSrc}
                                alt="Card Subject"
                                decoding="async"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    objectPosition: "center center",
                                }}
                            />
                        ) : (
                            <svg
                                viewBox="0 0 300 400"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    maxHeight: "100%",
                                    transform: "translateY(10px)",
                                }}
                            >
                                <defs>
                                    <linearGradient id="headShade" x1="20%" y1="0%" x2="80%" y2="100%">
                                        <stop offset="0%" stopColor="#cfd1d4" />
                                        <stop offset="40%" stopColor="#8d9094" />
                                        <stop offset="70%" stopColor="#4f5256" />
                                        <stop offset="100%" stopColor="#222426" />
                                    </linearGradient>
                                    <linearGradient id="highlight" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                                    </linearGradient>
                                    <radialGradient id="browLight" cx="48%" cy="38%" r="40%">
                                        <stop offset="0%" stopColor="#e3e5e8" />
                                        <stop offset="60%" stopColor="#63666b" />
                                        <stop offset="100%" stopColor="#25272a" />
                                    </radialGradient>
                                </defs>
                                <path d="M 60 380 Q 150 320 240 380 L 255 400 L 45 400 Z" fill="#3b3e42" />
                                <path d="M 120 220 L 115 340 Q 150 355 185 340 L 180 220 Z" fill="url(#headShade)" />
                                <path
                                    d="M 96 140 C 90 70 120 40 150 40 C 180 40 210 70 204 140 C 200 185 190 225 166 242 C 156 248 144 248 134 242 C 110 225 100 185 96 140 Z"
                                    fill="url(#browLight)"
                                />
                                <polygon points="147,105 153,105 156,170 144,170" fill="#eef0f2" />
                                <polygon points="144,170 156,170 159,182 141,182" fill="#9da0a6" />
                                <path d="M 112 125 Q 130 115 146 126 Q 130 135 112 125 Z" fill="#262729" />
                                <path d="M 154 126 Q 170 115 188 125 Q 170 135 154 126 Z" fill="#262729" />
                                <ellipse cx="120" cy="165" rx="14" ry="25" fill="url(#highlight)" />
                                <ellipse cx="180" cy="165" rx="14" ry="25" fill="#4a4d52" />
                                <path d="M 136 200 Q 150 196 164 200 Q 150 210 136 200 Z" fill="#5a5d61" />
                                <circle cx="150" cy="225" r="9" fill="#c4c7cc" />
                            </svg>
                        )}
                    </div>

                    {/* Price pill (no backdrop blur: it renders soft inside 3D transforms) */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            position: "relative",
                            zIndex: 10,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                background: priceBackground,
                                border: "1px solid rgba(255,255,255,0.14)",
                                borderRadius: 14,
                                padding: "4px 10px",
                                ...priceFont,
                                color: priceColor,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                            }}
                        >
                            {price}
                        </div>
                    </div>
                </div>

                {/* --- CARD FOOTER --- */}
                <div
                    style={{
                        paddingTop: 14,
                        paddingLeft: 4,
                        paddingRight: 4,
                    }}
                >
                    <div
                        style={{
                            ...titleFont,
                            color: titleColor,
                            textTransform: "uppercase",
                            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                        }}
                    >
                        {cardTitle}
                    </div>
                    <div
                        style={{
                            marginTop: 5,
                            ...subtitleFont,
                            color: subtitleColor,
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {subTitle}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

CollectibleCard3D.defaultProps = {
    width: 400,
    height: 570,
}

/* ------------------------------------------------------------------ */
/* Property panel — organised into collapsible groups                  */
/* Image → Content → Card Style → Typography → Colors → Credit         */
/* ------------------------------------------------------------------ */
addPropertyControls(CollectibleCard3D, {
    image: {
        type: ControlType.Object,
        title: "Image",
        controls: {
            src: {
                type: ControlType.Image,
                title: "Center Image",
                description:
                    "💡 An image with **no background** (transparent PNG) works best.",
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 0,
                max: 48,
                step: 2,
                defaultValue: 16,
            },
        },
    },
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Sinax LC",
            },
            subtitle: {
                type: ControlType.String,
                title: "Subtitle",
                defaultValue: "THIS IS A COLLECTIBLE LIMITED EDITION ",
            },
            price: {
                type: ControlType.String,
                title: "Price",
                defaultValue: "$150",
            },
            watermark: {
                type: ControlType.String,
                title: "Watermark",
                defaultValue: "SILVER",
            },
        },
    },
    cardStyle: {
        type: ControlType.Object,
        title: "Card Style",
        controls: {
            preset: {
                type: ControlType.Enum,
                title: "Preset",
                options: [
                    "silver",
                    "obsidian",
                    "gold",
                    "holographic",
                    "rose",
                    "emerald",
                    "custom",
                ],
                optionTitles: [
                    "Silver Titanium",
                    "Obsidian Black",
                    "Gold 24K",
                    "Holo Iridescent",
                    "Rose Gold",
                    "Emerald Tech",
                    "Custom",
                ],
                defaultValue: "obsidian",
            },
            shine: {
                type: ControlType.Number,
                title: "Shine Power",
                min: 0.1,
                max: 2,
                step: 0.05,
                defaultValue: 2,
            },
            cardColor: {
                type: ControlType.Color,
                title: "Card Color",
                defaultValue: "#55585d",
                hidden: (p: any) => p.preset !== "custom",
            },
            shineColor: {
                type: ControlType.Color,
                title: "Shine Color",
                defaultValue: "#ffffff",
                hidden: (p: any) => p.preset !== "custom",
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            titleFont: {
                type: ControlType.Font,
                title: "Title",
                controls: "extended",
                defaultFontType: "sans-serif",
                displayFontSize: true,
            },
            subtitleFont: {
                type: ControlType.Font,
                title: "Subtitle",
                controls: "extended",
                defaultFontType: "monospace",
                displayFontSize: true,
            },
            priceFont: {
                type: ControlType.Font,
                title: "Price",
                controls: "extended",
                defaultFontType: "monospace",
                displayFontSize: true,
            },
            watermarkFont: {
                type: ControlType.Font,
                title: "Watermark",
                controls: "extended",
                defaultFontType: "sans-serif",
                displayFontSize: false,
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            titleColor: {
                type: ControlType.Color,
                title: "Title",
                defaultValue: "rgba(255,255,255,0.85)",
            },
            subtitleColor: {
                type: ControlType.Color,
                title: "Subtitle",
                defaultValue: "rgba(255,255,255,0.4)",
            },
            priceColor: {
                type: ControlType.Color,
                title: "Price Text",
                defaultValue: "#ffffff",
            },
            priceBackground: {
                type: ControlType.Color,
                title: "Price Pill",
                defaultValue: "rgba(30, 31, 33, 0.8)",
            },
            watermarkFill: {
                type: ControlType.Color,
                title: "Watermark Fill",
                defaultValue: "rgba(255, 255, 255, 0.16)",
            },
            watermarkOutline: {
                type: ControlType.Color,
                title: "Watermark Edge",
                defaultValue: "rgba(255, 255, 255, 0.4)",
            },
        },
    },
    credit: {
        type: ControlType.Enum,
        title: "Credit",
        options: ["sinax"],
        optionTitles: ["Designed by Sinax ❤️"],
        displaySegmentedControl: true,
        defaultValue: "sinax",
    },
})
