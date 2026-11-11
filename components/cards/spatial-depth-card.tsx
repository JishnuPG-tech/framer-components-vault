import * as React from "react"
import { useRef, createContext, useContext } from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    MotionValue,
} from "framer-motion"
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
 * SPATIAL DEPTH ENGINE - CREDIT CARD EDITION
 * -------------------
 * Fixed: Removed faulty scroll tracking for 1:1 Canvas/Preview sync.
 * Fixed: Added strict dimensional fallbacks to prevent Fit collapse.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 */

// --- Types & Interfaces ---
interface DepthContextType {
    mouseX: MotionValue<number>
    mouseY: MotionValue<number>
    intensity: number
}

interface DepthLayerProps {
    children?: React.ReactNode
    depth: number
    blur?: number
    borderRadius?: number | string
    style?: React.CSSProperties
}

interface StaticDepthLayerProps {
    children?: React.ReactNode
    blur?: number
    borderRadius?: number | string
    style?: React.CSSProperties
}

interface CardFaceProps {
    cardRadius: number
    cardColor: string
    cardBlur: number
    cardShadowBlur: number
    cardShadowColor: string
    textColor: string
    cardTextShadowColor: string
    cardNumber: string
    cardHolder: string
    cardExpiry: string
    logoSrc?: string | null
}

interface SpatialDepthCardProps {
    intensity: number
    stiffness: number
    damping: number
    showGrid: boolean
    gridOpacity: number
    accentColor: string
    title: string
    titleColor: string
    titleSize: number
    titleFontFamily: string
    titleWeight: number
    titleOpacity: number
    titleX: number
    titleY: number
    titleDepth: number
    titleShadowColor: string
    titleShadowBlur: number
    cardBlur: number
    cardColor: string
    cardRadius: number
    textColor: string
    cardDepth: number
    cardNumber: string
    cardHolder: string
    cardExpiry: string
    cardLogo?: any
    cardShadowColor: string
    cardShadowBlur: number
    cardTextShadowColor: string
    bgDepth: number
    fgDepth: number
    children?: React.ReactNode
    width?: number | string
    height?: number | string
    style?: React.CSSProperties
}

interface SpatialDepthCardLiveProps extends SpatialDepthCardProps {
    logoSrc: string | null
    sharedCardProps: CardFaceProps
    containerStyle: React.CSSProperties
}

// --- Shared Depth Context ---
const DepthContext = createContext<DepthContextType | null>(null)

// --- Depth Layer Sub-Component (live only) ---
function DepthLayer({
    children,
    depth,
    blur = 0,
    borderRadius = 0,
    style = {},
}: DepthLayerProps) {
    const context = useContext(DepthContext)
    if (!context) return null

    const { mouseX, mouseY, intensity } = context

    const x = useTransform(
        mouseX,
        [-0.5, 0.5],
        [-depth * 0.1 * intensity, depth * 0.1 * intensity]
    )
    const y = useTransform(
        mouseY,
        [-0.5, 0.5],
        [-depth * 0.1 * intensity, depth * 0.1 * intensity]
    )
    const rotateX = useTransform(
        mouseY,
        [-0.5, 0.5],
        [8 * intensity, -8 * intensity]
    )
    const rotateY = useTransform(
        mouseX,
        [-0.5, 0.5],
        [-8 * intensity, 8 * intensity]
    )
    const lightX = useTransform(mouseX, [-0.5, 0.5], ["20%", "80%"])
    const lightY = useTransform(mouseY, [-0.5, 0.5], ["20%", "80%"])

    return (
        <motion.div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transformStyle: "preserve-3d",
                zIndex: Math.round(depth),
                x,
                y,
                rotateX,
                rotateY,
                filter: blur > 0 ? `blur(${blur}px)` : "none",
                willChange: "transform",
                ...style,
            }}
        >
            <div
                style={{
                    position: "relative",
                    transformStyle: "preserve-3d",
                    borderRadius: borderRadius,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {children}

                {depth > 0 && (
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: -2,
                            pointerEvents: "none",
                            borderRadius: "inherit",
                            zIndex: 10,
                            background: useTransform(
                                [lightX, lightY],
                                ([lx, ly]) =>
                                    `radial-gradient(circle at ${lx} ${ly}, rgba(255,255,255,0.2) 0%, transparent 60%)`
                            ),
                        }}
                    />
                )}
            </div>
        </motion.div>
    )
}

// --- Static Depth Layer (no springs, no scroll, no lighting overlay) ---
function StaticDepthLayer({
    children,
    blur = 0,
    borderRadius = 0,
    style = {},
}: StaticDepthLayerProps) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                filter: blur > 0 ? `blur(${blur}px)` : "none",
                ...style,
            }}
        >
            <div
                style={{
                    position: "relative",
                    borderRadius: borderRadius,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {children}
            </div>
        </div>
    )
}

// --- Card face — shared between static and live ---
function CardFace({
    cardRadius,
    cardColor,
    cardBlur,
    cardShadowBlur,
    cardShadowColor,
    textColor,
    cardTextShadowColor,
    cardNumber,
    cardHolder,
    cardExpiry,
    logoSrc,
}: CardFaceProps) {
    return (
        <div
            style={{
                width: "clamp(300px, 80vw, 400px)",
                aspectRatio: "1.586",
                padding: "24px 28px",
                borderRadius: cardRadius,
                background: cardColor,
                backdropFilter: `blur(${cardBlur}px)`,
                WebkitBackdropFilter: `blur(${cardBlur}px)`,
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: `0 30px ${cardShadowBlur}px -20px ${cardShadowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                color: textColor,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                fontFamily: "system-ui, -apple-system, sans-serif",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}
            >
                <svg
                    width="44"
                    height="32"
                    viewBox="0 0 44 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        width="44"
                        height="32"
                        rx="6"
                        fill="#D4AF37"
                        fillOpacity="0.8"
                    />
                    <path
                        d="M12 0V32M32 0V32M0 12H44M0 20H44"
                        stroke="rgba(0,0,0,0.15)"
                        strokeWidth="1.5"
                    />
                </svg>

                {logoSrc ? (
                    <img
                        src={logoSrc}
                        alt="Card Logo"
                        style={{
                            height: 32,
                            width: "auto",
                            objectFit: "contain",
                            filter: `drop-shadow(0 2px 4px ${cardTextShadowColor})`,
                        }}
                    />
                ) : (
                    <div
                        style={{
                            height: 32,
                            width: 50,
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: 4,
                        }}
                    />
                )}
            </div>

            <div style={{ marginTop: "auto", marginBottom: 20 }}>
                <div
                    style={{
                        fontSize: "clamp(20px, 5vw, 24px)",
                        letterSpacing: "0.15em",
                        fontFamily: "'Courier New', Courier, monospace",
                        fontWeight: 600,
                        textShadow: `0 1px 2px ${cardTextShadowColor}`,
                    }}
                >
                    {cardNumber}
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                        style={{
                            fontSize: 9,
                            textTransform: "uppercase",
                            opacity: 0.7,
                            letterSpacing: 1,
                            marginBottom: 4,
                        }}
                    >
                        Card Holder
                    </span>
                    <span
                        style={{
                            fontSize: 16,
                            fontWeight: 500,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            textShadow: `0 1px 2px ${cardTextShadowColor}`,
                        }}
                    >
                        {cardHolder}
                    </span>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                    }}
                >
                    <span
                        style={{
                            fontSize: 9,
                            textTransform: "uppercase",
                            opacity: 0.7,
                            letterSpacing: 1,
                            marginBottom: 4,
                        }}
                    >
                        Expires
                    </span>
                    <span
                        style={{
                            fontSize: 16,
                            fontWeight: 500,
                            letterSpacing: 1,
                            textShadow: `0 1px 2px ${cardTextShadowColor}`,
                        }}
                    >
                        {cardExpiry}
                    </span>
                </div>
            </div>
        </div>
    )
}

// --- Main Component ---
export default function SpatialDepthCard(props: SpatialDepthCardProps) {
    const {
        showGrid,
        gridOpacity,
        accentColor,
        title,
        titleColor,
        titleSize,
        titleFontFamily,
        titleWeight,
        titleOpacity,
        titleX,
        titleY,
        titleShadowColor,
        titleShadowBlur,
        cardBlur,
        cardColor,
        cardRadius,
        textColor,
        cardNumber,
        cardHolder,
        cardExpiry,
        cardLogo,
        cardShadowColor,
        cardShadowBlur,
        cardTextShadowColor,
        children,
        width,
        height,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const logoSrc =
        cardLogo && typeof cardLogo === "object" ? cardLogo.src : cardLogo

    const sharedCardProps: CardFaceProps = {
        cardRadius,
        cardColor,
        cardBlur,
        cardShadowBlur,
        cardShadowColor,
        textColor,
        cardTextShadowColor,
        cardNumber,
        cardHolder,
        cardExpiry,
        logoSrc,
    }

    const containerStyle: React.CSSProperties = {
        width: width ?? "100%",
        height: height ?? "100%",
        minWidth: 800,
        minHeight: 800,
        overflow: "hidden",
        background: "transparent",
        perspective: "1200px",
        transformStyle: "preserve-3d",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
    }

    // -----------------------------------------------------------------------
    // Static fallback
    // -----------------------------------------------------------------------
    if (isStatic) {
        return (
            <div style={containerStyle}>
                {showGrid && (
                    <StaticDepthLayer blur={1}>
                        <div
                            style={{
                                width: "200vw",
                                height: "200vh",
                                opacity: gridOpacity,
                                backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
                                backgroundSize: "48px 48px",
                            }}
                        />
                    </StaticDepthLayer>
                )}

                <StaticDepthLayer>
                    <h1
                        style={{
                            fontSize: titleSize,
                            fontFamily: titleFontFamily,
                            fontWeight: titleWeight,
                            margin: 0,
                            letterSpacing: "-0.06em",
                            color: titleColor,
                            opacity: titleOpacity,
                            filter: `drop-shadow(0 30px ${titleShadowBlur}px ${titleShadowColor})`,
                            transform: `translate(${titleX}px, ${titleY}px)`,
                            pointerEvents: "none",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {title}
                    </h1>
                </StaticDepthLayer>

                <StaticDepthLayer borderRadius={cardRadius}>
                    <CardFace {...sharedCardProps} />
                </StaticDepthLayer>

                <StaticDepthLayer blur={8}>
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {children}
                        {!children && (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: "-10%",
                                    right: "-10%",
                                    width: 200,
                                    height: 200,
                                    borderRadius: "50%",
                                    background: `radial-gradient(circle at 30% 30%, ${accentColor}33, transparent 70%)`,
                                    border: "1px solid rgba(255,255,255,0.05)",
                                }}
                            />
                        )}
                    </div>
                </StaticDepthLayer>
            </div>
        )
    }

    // -----------------------------------------------------------------------
    // Live / interactive renderer
    // -----------------------------------------------------------------------
    return (
        <SpatialDepthCardLive
            {...props}
            logoSrc={logoSrc}
            sharedCardProps={sharedCardProps}
            containerStyle={containerStyle}
        />
    )
}

// --- Live renderer ---
function SpatialDepthCardLive({
    logoSrc,
    sharedCardProps,
    containerStyle,
    ...props
}: SpatialDepthCardLiveProps) {
    const {
        intensity,
        stiffness,
        damping,
        showGrid,
        gridOpacity,
        accentColor,
        title,
        titleColor,
        titleSize,
        titleFontFamily,
        titleWeight,
        titleOpacity,
        titleX,
        titleY,
        titleDepth,
        titleShadowColor,
        titleShadowBlur,
        cardDepth,
        bgDepth,
        fgDepth,
        children,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)

    const rawMouseX = useMotionValue(0)
    const rawMouseY = useMotionValue(0)
    const mouseX = useSpring(rawMouseX, { stiffness, damping })
    const mouseY = useSpring(rawMouseY, { stiffness, damping })

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        rawMouseX.set((e.clientX - rect.left) / rect.width - 0.5)
        rawMouseY.set((e.clientY - rect.top) / rect.height - 0.5)
    }

    const handlePointerLeave = () => {
        rawMouseX.set(0)
        rawMouseY.set(0)
    }

    return (
        <DepthContext.Provider
            value={{
                mouseX,
                mouseY,
                intensity,
            }}
        >
            <div
                ref={containerRef}
                style={containerStyle}
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
            >
                {showGrid && (
                    <DepthLayer depth={bgDepth} blur={1}>
                        <div
                            style={{
                                width: "200vw",
                                height: "200vh",
                                opacity: gridOpacity,
                                backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
                                backgroundSize: "48px 48px",
                            }}
                        />
                    </DepthLayer>
                )}

                <DepthLayer depth={titleDepth}>
                    <h1
                        style={{
                            fontSize: titleSize,
                            fontFamily: titleFontFamily,
                            fontWeight: titleWeight,
                            margin: 0,
                            letterSpacing: "-0.06em",
                            color: titleColor,
                            opacity: titleOpacity,
                            filter: `drop-shadow(0 30px ${titleShadowBlur}px ${titleShadowColor})`,
                            transform: `translate(${titleX}px, ${titleY}px)`,
                            pointerEvents: "none",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {title}
                    </h1>
                </DepthLayer>

                <DepthLayer
                    depth={cardDepth}
                    borderRadius={sharedCardProps.cardRadius}
                >
                    <CardFace {...sharedCardProps} />
                </DepthLayer>

                <DepthLayer depth={fgDepth} blur={8}>
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {children}
                        {!children && (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: "-10%",
                                    right: "-10%",
                                    width: 200,
                                    height: 200,
                                    borderRadius: "50%",
                                    background: `radial-gradient(circle at 30% 30%, ${accentColor}33, transparent 70%)`,
                                    border: "1px solid rgba(255,255,255,0.05)",
                                }}
                            />
                        )}
                    </div>
                </DepthLayer>
            </div>
        </DepthContext.Provider>
    )
}

// --- Defaults ---
SpatialDepthCard.defaultProps = {
    width: 800,
    height: 800,
    title: "PAY",
    titleColor: "#FFFFFF",
    titleSize: 180,
    titleFontFamily: "system-ui, -apple-system, sans-serif",
    titleWeight: 900,
    titleOpacity: 0.8,
    titleX: 0,
    titleY: -40,
    titleDepth: -120,
    titleShadowColor: "rgba(0,0,0,0.4)",
    titleShadowBlur: 60,
    cardNumber: "4000 1234 5678 9010",
    cardHolder: "JOHN DOE",
    cardExpiry: "12/28",
    cardLogo: null,
    textColor: "#FFFFFF",
    cardRadius: 20,
    cardBlur: 24,
    cardColor: "rgba(255, 255, 255, 0.08)",
    cardDepth: 120,
    cardShadowColor: "rgba(0,0,0,0.5)",
    cardShadowBlur: 80,
    cardTextShadowColor: "rgba(0,0,0,0.15)",
    intensity: 1.5,
    stiffness: 120,
    damping: 30,
    showGrid: true,
    gridOpacity: 0.15,
    accentColor: "#007AFF",
    bgDepth: -500,
    fgDepth: 400,
}

// --- Framer Controls ---
addPropertyControls(SpatialDepthCard, {
    cardNumber: {
        type: ControlType.String,
        title: "Card Number",
        defaultValue: "4000 1234 5678 9010",
        description:
            "The 16-digit account number displayed on the face of the card.",
    },
    cardHolder: {
        type: ControlType.String,
        title: "Card Holder",
        defaultValue: "JOHN DOE",
        description: "The name of the card owner displayed on the bottom left.",
    },
    cardExpiry: {
        type: ControlType.String,
        title: "Expiry Date",
        defaultValue: "12/28",
        description: "The expiration date displayed on the bottom right.",
    },
    cardLogo: {
        type: ControlType.ResponsiveImage,
        title: "Card Logo",
        description:
            "Upload a custom branding logo for the top right corner of the card.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
        description:
            "The primary color used for all text layers inside the card.",
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card Tint",
        defaultValue: "rgba(255, 255, 255, 0.08)",
        description:
            "The base background color and transparency of the frosted glass card.",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 60,
        defaultValue: 20,
        description:
            "Adjusts how round or sharp the corners of the credit card are.",
    },
    cardBlur: {
        type: ControlType.Number,
        title: "Glass Blur",
        min: 0,
        max: 100,
        defaultValue: 24,
        description:
            "The intensity of the backdrop blur effect for the glassmorphism look.",
    },
    cardShadowColor: {
        type: ControlType.Color,
        title: "Card Shadow",
        defaultValue: "rgba(0,0,0,0.5)",
        description:
            "The color of the main drop shadow beneath the card. Use the alpha slider to adjust opacity.",
    },
    cardShadowBlur: {
        type: ControlType.Number,
        title: "Card S-Blur",
        min: 0,
        max: 200,
        defaultValue: 80,
        description: "Controls how far and wide the main card shadow spreads.",
    },
    cardTextShadowColor: {
        type: ControlType.Color,
        title: "Inner T-Shadow",
        defaultValue: "rgba(0,0,0,0.15)",
        description:
            "A subtle shadow applied to the typography inside the card to improve readability over complex backgrounds.",
    },
    title: {
        type: ControlType.String,
        title: "BG Text",
        defaultValue: "PAY",
        description:
            "The large, dramatic typography that sits in the background behind the card.",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Text Tint",
        defaultValue: "#FFFFFF",
        description: "The text color for the large background title.",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 20,
        max: 400,
        defaultValue: 180,
        description: "The size of the large background title.",
    },
    titleFontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "system-ui, -apple-system, sans-serif",
        description: "The typeface to use for the large background title.",
    },
    titleWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        min: 100,
        max: 900,
        step: 100,
        defaultValue: 900,
        description:
            "The thickness of the background title font (e.g., 400 for Normal, 900 for Black).",
    },
    titleOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.8,
        description: "The overall transparency of the background title.",
    },
    titleX: {
        type: ControlType.Number,
        title: "Offset X",
        min: -500,
        max: 500,
        defaultValue: 0,
        description:
            "Nudge the background title left or right from the center point.",
    },
    titleY: {
        type: ControlType.Number,
        title: "Offset Y",
        min: -500,
        max: 500,
        defaultValue: -40,
        description:
            "Nudge the background title up or down from the center point.",
    },
    titleShadowColor: {
        type: ControlType.Color,
        title: "BG T-Shadow",
        defaultValue: "rgba(0,0,0,0.4)",
        description:
            "The color of the drop shadow behind the large background title. Use the alpha slider to adjust opacity.",
    },
    titleShadowBlur: {
        type: ControlType.Number,
        title: "BG S-Blur",
        min: 0,
        max: 200,
        defaultValue: 60,
        description:
            "Controls how far and wide the shadow behind the background title spreads.",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#007AFF",
        description:
            "Determines the color of the background grid dots and the default glowing foreground orb.",
    },
    showGrid: {
        type: ControlType.Boolean,
        title: "Show Grid",
        defaultValue: true,
        description: "Toggle the dotted background texture on or off.",
    },
    gridOpacity: {
        type: ControlType.Number,
        title: "Grid Alpha",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.15,
        description: "The transparency of the background grid dots.",
    },
    intensity: {
        type: ControlType.Number,
        title: "Motion Flow",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 1.5,
        description:
            "A multiplier for the 3D parallax effect. Higher values cause the layers to shift more dramatically when the mouse moves.",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        min: 10,
        max: 500,
        defaultValue: 120,
        description:
            "Physics control: How quickly the spring pulls the 3D elements toward the mouse pointer.",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 1,
        max: 100,
        defaultValue: 30,
        description:
            "Physics control: How much friction is applied. Higher values stop the elements from bouncing or jiggling.",
    },
    titleDepth: {
        type: ControlType.Number,
        title: "Title Z",
        min: -1000,
        max: 1000,
        defaultValue: -120,
        description:
            "The 3D space position of the background text. Negative values push it further back into the screen.",
    },
    cardDepth: {
        type: ControlType.Number,
        title: "Card Z",
        min: -1000,
        max: 1000,
        defaultValue: 120,
        description: "The 3D space position of the main credit card layer.",
    },
    bgDepth: {
        type: ControlType.Number,
        title: "Grid Z",
        min: -1000,
        max: 1000,
        defaultValue: -500,
        description: "The 3D space position of the dotted background grid.",
    },
    fgDepth: {
        type: ControlType.Number,
        title: "Foreground Z",
        min: -1000,
        max: 1000,
        defaultValue: 400,
        description:
            "The 3D space position of any connected children components floating above the card.",
    },
    children: {
        type: ControlType.ComponentInstance,
        title: "FG Content",
        description:
            "Connect another Framer component here to render it floating above the card in 3D space.",
    },
})
