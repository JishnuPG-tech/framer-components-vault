import React, { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion"
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
 * PROJECT: CREATIVE ID BADGE — 6-VARIANT PRODUCTION SYSTEM
 * FILE: ID_Badge_Gemini.tsx
 * VARIANTS:
 * 1. Creative ID
 * 2. Event Pass
 * 3. Team ID
 * 4. Member Pass
 * 5. Student ID (New)
 * 6. Visitor Pass (New)
 *
 * FEATURES:
 * - Light, Dark & Dual Tone Color Modes across all 6 Variants (Front & Back)
 * - Extended Lanyard Strap Length (Up to 500px)
 * - 8-Group Property Panel Architecture + Granular Typography Engine
 * - Adjustable 3D Card Thickness
 * - Unified Root + 3D Full-Surface Click-to-Flip Engine
 * - useIsStaticRenderer Static Fallback for Framer Marketplace Compliance
 */

// ============================================================================
// ASSET HELPERS & UTILITIES
// ============================================================================

function resolveImageSrc(
    imageProp: any,
    defaultUrl?: string
): string | undefined {
    if (!imageProp) return defaultUrl
    if (typeof imageProp === "string" && imageProp.trim() !== "") {
        return imageProp
    }
    if (typeof imageProp === "object") {
        if (typeof imageProp.src === "string" && imageProp.src.trim() !== "") {
            return imageProp.src
        }
        if (typeof imageProp.url === "string" && imageProp.url.trim() !== "") {
            return imageProp.url
        }
    }
    return defaultUrl
}

/**
 * Ensures untouched default color controls automatically adapt to the active
 * Light/Dark/Dual-Tone theme while still respecting custom colors chosen by the user.
 */
function resolveThemedColor(
    userColor: string | undefined,
    themeDefault: string,
    untouchedDefaults: string[] = []
): string {
    if (!userColor) return themeDefault
    const normalized = userColor.trim().toUpperCase()
    for (const def of untouchedDefaults) {
        if (normalized === def.trim().toUpperCase()) {
            return themeDefault
        }
    }
    return userColor
}

const wovenFabricPattern = `data:image/svg+xml;utf8,<svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="8" fill="%23141517"/><path d="M0 2L2 0M0 6L6 0M2 8L8 2M6 8L8 6" stroke="%23242629" stroke-width="1.1"/><path d="M0 0L8 8M0 4L4 8M4 0L8 4" stroke="%230b0b0d" stroke-width="0.8"/></svg>`

const crispTextStyle: React.CSSProperties = {
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "optimizeLegibility",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
}

function applyTypography(
    fontProp: any,
    colorProp?: string,
    defaults?: {
        fontSize?: number
        fontWeight?: number | string
        letterSpacing?: string
        lineHeight?: number | string
        textTransform?: any
        textAlign?: any
        paddingLeft?: string
        marginTop?: string
        maxWidth?: string
        color?: string
    }
): React.CSSProperties {
    const result: React.CSSProperties = { ...crispTextStyle }

    if (defaults) {
        if (defaults.fontSize !== undefined)
            result.fontSize = `${defaults.fontSize}px`
        if (defaults.fontWeight !== undefined)
            result.fontWeight = defaults.fontWeight
        if (defaults.letterSpacing !== undefined)
            result.letterSpacing = defaults.letterSpacing
        if (defaults.lineHeight !== undefined)
            result.lineHeight = defaults.lineHeight
        if (defaults.textTransform !== undefined)
            result.textTransform = defaults.textTransform
        if (defaults.textAlign !== undefined)
            result.textAlign = defaults.textAlign
        if (defaults.paddingLeft !== undefined)
            result.paddingLeft = defaults.paddingLeft
        if (defaults.marginTop !== undefined)
            result.marginTop = defaults.marginTop
        if (defaults.maxWidth !== undefined) result.maxWidth = defaults.maxWidth
        if (defaults.color !== undefined) result.color = defaults.color
    }

    if (fontProp) {
        if (typeof fontProp === "string") {
            result.fontFamily = fontProp
        } else if (typeof fontProp === "object") {
            if (fontProp.fontFamily) result.fontFamily = fontProp.fontFamily
            if (fontProp.fontSize !== undefined)
                result.fontSize = `${fontProp.fontSize}px`
            if (fontProp.fontWeight !== undefined)
                result.fontWeight = fontProp.fontWeight
            if (fontProp.fontStyle !== undefined)
                result.fontStyle = fontProp.fontStyle
            if (fontProp.letterSpacing !== undefined) {
                result.letterSpacing =
                    typeof fontProp.letterSpacing === "number"
                        ? `${fontProp.letterSpacing}px`
                        : fontProp.letterSpacing
            }
            if (fontProp.lineHeight !== undefined)
                result.lineHeight = fontProp.lineHeight
            if (fontProp.textAlign !== undefined)
                result.textAlign = fontProp.textAlign
            if (fontProp.color !== undefined) result.color = fontProp.color
        }
    }

    if (colorProp) {
        result.color = colorProp
    }

    return result
}

function membershipTierToKey(tier: string): string {
    return (tier || "SIGNATURE").toUpperCase()
}

// ============================================================================
// VECTOR ASSETS
// ============================================================================

const KSLogo = ({
    color = "#171717",
    size = 22,
}: {
    color?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M4 5V23M4 14H8L15 5M8 14L16 23M20 5V23M20 14L24 10M20 14L24 18"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const EventMark = ({
    color = "#171717",
    accent = "#C8F36A",
    size = 20,
}: {
    color?: string
    accent?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect
            x="2.5"
            y="2.5"
            width="19"
            height="19"
            rx="3.5"
            stroke={color}
            strokeWidth="2"
        />
        <circle cx="8" cy="8" r="2.5" fill={accent} />
        <path
            d="M16 7V17M12 11V17M8 14V17"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
)

const CorporateLogoMark = ({
    color = "#171717",
    accent = "#C8F36A",
    size = 20,
}: {
    color?: string
    accent?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <polygon
            points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" fill={accent} />
    </svg>
)

const ClubEmblemMark = ({
    color = "#C6AD80",
    accent = "#C6AD80",
    size = 22,
}: {
    color?: string
    accent?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect
            x="3.5"
            y="3.5"
            width="21"
            height="21"
            rx="10.5"
            stroke={color}
            strokeWidth="1.2"
        />
        <path
            d="M14 6L16.2 11.8L22 14L16.2 16.2L14 22L11.8 16.2L6 14L11.8 11.8L14 6Z"
            stroke={accent}
            strokeWidth="1.2"
            strokeLinejoin="round"
        />
        <circle cx="14" cy="14" r="1.5" fill={accent} />
    </svg>
)

const AcademicCrestMark = ({
    color = "#171717",
    accent = "#C8F36A",
    size = 20,
}: {
    color?: string
    accent?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 3L21 7.5L12 12L3 7.5L12 3Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M6 9.5V15.5C6 17.5 8.7 19.5 12 19.5C15.3 19.5 18 17.5 18 15.5V9.5"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="20" cy="14" r="1.8" fill={accent} />
        <path
            d="M20 8V13"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
)

const VisitorShieldMark = ({
    color = "#171717",
    accent = "#C8F36A",
    size = 20,
}: {
    color?: string
    accent?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M12 2.5L19.5 5.8V11.5C19.5 16.5 16.3 20.3 12 21.8C7.7 20.3 4.5 16.5 4.5 11.5V5.8L12 2.5Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.3" fill={accent} />
        <path
            d="M8.5 16.2C9.3 14.5 10.5 13.8 12 13.8C13.5 13.8 14.7 14.5 15.5 16.2"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </svg>
)

const ArrowIcon = ({
    color = "#171717",
    size = 16,
}: {
    color?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M2.5 8H13.5M13.5 8L8.5 3M13.5 8L8.5 13"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const ExternalArrow = ({
    color = "#B5B5B5",
    size = 13,
}: {
    color?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M3 11L11 3M11 3H5M11 3V9"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const BarcodeStrip = ({
    color = "#171717",
    height = 22,
}: {
    color?: string
    height?: number
}) => (
    <div
        style={{
            display: "flex",
            gap: "2px",
            alignItems: "center",
            height: `${height}px`,
        }}
    >
        <div style={{ width: "2px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "4px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "1px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "3px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "1px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "5px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "2px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "1px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "3px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "2px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "4px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "1px", height: "100%", backgroundColor: color }} />
        <div style={{ width: "2px", height: "100%", backgroundColor: color }} />
    </div>
)

const LinkedInIcon = ({
    color = "#B5B5B5",
    size = 14,
}: {
    color?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect
            x="2"
            y="2"
            width="12"
            height="12"
            rx="2.5"
            stroke={color}
            strokeWidth="1.3"
        />
        <circle cx="5.5" cy="5.5" r="1" fill={color} />
        <path
            d="M5.5 8V12M8.5 12V9.5C8.5 8.67 9.17 8 10 8C10.83 8 11.5 8.67 11.5 9.5V12M8.5 9.5V12"
            stroke={color}
            strokeWidth="1.3"
            strokeLinecap="round"
        />
    </svg>
)

const InstagramIcon = ({
    color = "#B5B5B5",
    size = 14,
}: {
    color?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect
            x="2.5"
            y="2.5"
            width="11"
            height="11"
            rx="3"
            stroke={color}
            strokeWidth="1.3"
        />
        <circle cx="8" cy="8" r="2.4" stroke={color} strokeWidth="1.3" />
        <circle cx="11.2" cy="4.8" r="0.6" fill={color} />
    </svg>
)

const MailIcon = ({
    color = "#B5B5B5",
    size = 14,
}: {
    color?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect
            x="2"
            y="3.5"
            width="12"
            height="9"
            rx="2"
            stroke={color}
            strokeWidth="1.3"
        />
        <path
            d="M3 5L8 8.5L13 5"
            stroke={color}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const GlobeIcon = ({
    color = "#B5B5B5",
    size = 14,
}: {
    color?: string
    size?: number
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.3" />
        <ellipse
            cx="8"
            cy="8"
            rx="2.5"
            ry="6"
            stroke={color}
            strokeWidth="1.3"
        />
        <line x1="2" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1.3" />
    </svg>
)

const QRGraphic = ({
    size = 68,
    moduleColor = "#F4F3EF",
    bgColor = "#131313",
    accentColor = "#C8F36A",
}: {
    size?: number
    moduleColor?: string
    bgColor?: string
    accentColor?: string
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 76 76"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <rect width="76" height="76" rx="6" fill={bgColor} />
        <rect
            x="8"
            y="8"
            width="22"
            height="22"
            rx="3"
            stroke={moduleColor}
            strokeWidth="2.5"
            fill="none"
        />
        <rect
            x="14"
            y="14"
            width="10"
            height="10"
            rx="1.5"
            fill={moduleColor}
        />
        <rect
            x="46"
            y="8"
            width="22"
            height="22"
            rx="3"
            stroke={moduleColor}
            strokeWidth="2.5"
            fill="none"
        />
        <rect
            x="52"
            y="14"
            width="10"
            height="10"
            rx="1.5"
            fill={moduleColor}
        />
        <rect
            x="8"
            y="46"
            width="22"
            height="22"
            rx="3"
            stroke={moduleColor}
            strokeWidth="2.5"
            fill="none"
        />
        <rect
            x="14"
            y="52"
            width="10"
            height="10"
            rx="1.5"
            fill={moduleColor}
        />
        <rect x="34" y="10" width="4" height="4" fill={accentColor} />
        <rect x="38" y="16" width="4" height="4" fill={moduleColor} />
        <rect x="34" y="24" width="4" height="4" fill={moduleColor} />
        <rect x="10" y="36" width="4" height="4" fill={moduleColor} />
        <rect x="18" y="38" width="4" height="4" fill={accentColor} />
        <rect
            x="24"
            y="34"
            width="4"
            height="4"
            fill={lightColorFallback(moduleColor)}
        />
        <rect x="34" y="34" width="8" height="8" rx="1" fill={moduleColor} />
        <rect x="46" y="36" width="4" height="4" fill={moduleColor} />
        <rect x="54" y="34" width="6" height="4" fill={accentColor} />
        <rect x="64" y="38" width="4" height="6" fill={moduleColor} />
        <rect x="36" y="48" width="4" height="4" fill={moduleColor} />
        <rect x="44" y="46" width="6" height="4" fill={moduleColor} />
        <rect x="44" y="54" width="4" height="6" fill={accentColor} />
        <rect x="54" y="48" width="6" height="4" fill={moduleColor} />
        <rect x="62" y="52" width="6" height="6" fill={moduleColor} />
        <rect x="36" y="62" width="8" height="4" fill={moduleColor} />
        <rect x="48" y="62" width="4" height="6" fill={moduleColor} />
        <rect x="58" y="62" width="8" height="4" fill={accentColor} />
    </svg>
)

function lightColorFallback(c: string): string {
    return c || "#F4F3EF"
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreativeIDBadge(props: any) {
    // 1. Static Renderer Check
    const isStatic = useIsStaticRenderer()
    const badgeVariant = props.badgeVariant || "creativeId"

    // 2. Group Settings Resolvers
    const look = props.lookSettings || props.appearanceSettings || {}
    const layout = props.layoutSettings || {}
    const light = props.lightSettings || {}
    const motionCfg = props.motionSettings || {}
    const canvas = props.canvasSettings || {}

    // 3. Resolve Color Mode (Light, Dark, or Dual Tone)
    const colorMode: "light" | "dark" | "dualTone" =
        look.colorMode ?? props.colorMode ?? "light"
    const isFrontDark = colorMode === "dark"
    const isBackDark = colorMode === "dark" || colorMode === "dualTone"
    const useCustomColors = Boolean(
        look.useCustomColors ?? props.useCustomColors ?? false
    )

    // 4. Layout & 3D Geometry (Supports Strap Length up to 500px)
    const cardWidth = layout.cardWidth ?? props.cardWidth ?? 330
    const cardHeight = layout.cardHeight ?? props.cardHeight ?? 515
    const cardThickness = layout.cardThickness ?? props.cardThickness ?? 4
    const halfThickness = Math.max(0.5, cardThickness / 2)
    const cardBorderRadius =
        layout.cardBorderRadius ?? props.cardBorderRadius ?? 24
    const enclosurePadding =
        layout.enclosurePadding ?? props.enclosurePadding ?? 10
    const strapWidth = layout.strapWidth ?? props.strapWidth ?? 52
    const strapLength = Math.max(
        80,
        Math.min(500, layout.strapLength ?? props.strapLength ?? 170)
    )
    const cardScale = layout.cardScale ?? props.cardScale ?? 1.0

    // 5. Look & Appearance
    const customFrontBg = look.frontBgColor ?? props.frontBgColor ?? "#F5F3EE"
    const customBackBg = look.backBgColor ?? props.backBgColor ?? "#191919"
    const accentColor = look.accentColor ?? props.accentColor ?? "#C8F36A"
    const hardwareFinish =
        look.hardwareFinish ?? props.hardwareFinish ?? "gunmetal"
    const showLanyard = look.showLanyard ?? props.showLanyard ?? true
    const strapBranding = look.strapBranding ?? props.strapBranding ?? true
    const strapCustomText =
        look.strapCustomText ?? props.strapCustomText ?? "CREATIVE STUDIO"

    // 6. Lighting
    const shadowIntensity =
        light.shadowIntensity ?? props.shadowIntensity ?? 0.85
    const glareIntensity = light.glareIntensity ?? props.glareIntensity ?? 0.45
    const enclosureSpecular =
        light.enclosureSpecular ?? props.enclosureSpecular ?? 0.7

    // 7. Motion Physics (Automatically disabled when useIsStaticRenderer is true)
    const interactive =
        !isStatic && (motionCfg.interactive ?? props.interactive ?? true)
    const enableTilt =
        interactive && (motionCfg.enableTilt ?? props.enableTilt ?? true)
    const enableFlip =
        interactive && (motionCfg.enableFlip ?? props.enableFlip ?? true)
    const tiltSensitivity =
        motionCfg.tiltSensitivity ?? props.tiltSensitivity ?? 16
    const flipDuration = motionCfg.flipDuration ?? props.flipDuration ?? 0.75
    const perspective = motionCfg.perspective ?? props.perspective ?? 1200

    // 8. Canvas Mode & Flip State
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const showBothSides =
        (canvas.showBothSides ?? props.showBothSides ?? false) && isCanvas
    const isFlippedProp = canvas.isFlippedProp ?? props.isFlippedProp ?? false

    const [internalFlipped, setInternalFlipped] =
        useState<boolean>(isFlippedProp)
    useEffect(() => {
        setInternalFlipped(isFlippedProp)
    }, [isFlippedProp])

    // ==========================================================================
    // UNIFIED ROOT + 3D CLICK-TO-FLIP ENGINE (Disabled in Static Renderer)
    // ==========================================================================
    const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
    const isDragRef = useRef<boolean>(false)
    const handledByPointerRef = useRef<boolean>(false)

    const handleCardPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic || !enableFlip || showBothSides) return
            if (e.button !== undefined && e.button !== 0) return

            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch (err) {}

            pointerStartRef.current = {
                x: e.clientX,
                y: e.clientY,
            }
            isDragRef.current = false
            handledByPointerRef.current = false
        },
        [isStatic, enableFlip, showBothSides]
    )

    const handleCardPointerUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic || !enableFlip || showBothSides) return

            try {
                e.currentTarget.releasePointerCapture(e.pointerId)
            } catch (err) {}

            if (!pointerStartRef.current) return

            const dx = e.clientX - pointerStartRef.current.x
            const dy = e.clientY - pointerStartRef.current.y
            const dist = Math.hypot(dx, dy)
            pointerStartRef.current = null

            if (dist < 15 && !isDragRef.current) {
                handledByPointerRef.current = true
                e.stopPropagation()
                setInternalFlipped((prev) => !prev)
            }
        },
        [isStatic, enableFlip, showBothSides]
    )

    const handleCardPointerCancel = useCallback(() => {
        pointerStartRef.current = null
        isDragRef.current = false
    }, [])

    const handleCardClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation()
            if (isStatic || !enableFlip || showBothSides) return
            if (handledByPointerRef.current) {
                handledByPointerRef.current = false
                return
            }
            if (!isDragRef.current) {
                setInternalFlipped((prev) => !prev)
            }
        },
        [isStatic, enableFlip, showBothSides]
    )

    // Tilt Springs
    const containerRef = useRef<HTMLDivElement>(null)
    const rawMouseX = useMotionValue(0)
    const rawMouseY = useMotionValue(0)

    const springConfig = { damping: 26, stiffness: 220, mass: 0.6 }
    const smoothX = useSpring(rawMouseX, springConfig)
    const smoothY = useSpring(rawMouseY, springConfig)

    const tiltRotateX = useTransform(
        smoothY,
        [-0.5, 0.5],
        [tiltSensitivity, -tiltSensitivity]
    )
    const tiltRotateY = useTransform(
        smoothX,
        [-0.5, 0.5],
        [-tiltSensitivity, tiltSensitivity]
    )
    const glareX = useTransform(smoothX, [-0.5, 0.5], [15, 85])
    const glareY = useTransform(smoothY, [-0.5, 0.5], [15, 85])

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            if (pointerStartRef.current) {
                const dx = e.clientX - pointerStartRef.current.x
                const dy = e.clientY - pointerStartRef.current.y
                if (Math.hypot(dx, dy) >= 15) {
                    isDragRef.current = true
                }
            }

            if (!enableTilt || !containerRef.current || showBothSides) return
            const rect = containerRef.current.getBoundingClientRect()
            const nx = Math.max(
                -0.5,
                Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5)
            )
            const ny = Math.max(
                -0.5,
                Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5)
            )
            rawMouseX.set(nx)
            rawMouseY.set(ny)
        },
        [isStatic, enableTilt, rawMouseX, rawMouseY, showBothSides]
    )

    const handlePointerLeave = useCallback(() => {
        if (isStatic) return
        rawMouseX.set(0)
        rawMouseY.set(0)
    }, [isStatic, rawMouseX, rawMouseY])

    // Hardware Finishes
    const metalGradients = useMemo(() => {
        switch (hardwareFinish) {
            case "silver":
                return {
                    clamp: "linear-gradient(135deg, #E6E8EA 0%, #A6AAAF 42%, #D2D5D9 65%, #7C8085 100%)",
                    highlight: "rgba(255, 255, 255, 0.8)",
                    shadow: "rgba(30, 32, 36, 0.55)",
                    loop: "linear-gradient(180deg, #A2A6AB 0%, #E0E3E6 50%, #767A80 100%)",
                }
            case "matteBlack":
                return {
                    clamp: "linear-gradient(135deg, #2D2E30 0%, #151617 45%, #232426 70%, #0E0F10 100%)",
                    highlight: "rgba(255, 255, 255, 0.25)",
                    shadow: "rgba(0, 0, 0, 0.8)",
                    loop: "linear-gradient(180deg, #1C1D1F 0%, #2D2E30 50%, #111213 100%)",
                }
            case "gunmetal":
            default:
                return {
                    clamp: "linear-gradient(135deg, #6B7077 0%, #32353A 38%, #4B5057 68%, #1F2124 100%)",
                    highlight: "rgba(255, 255, 255, 0.5)",
                    shadow: "rgba(10, 11, 13, 0.75)",
                    loop: "linear-gradient(180deg, #3A3E44 0%, #6E747D 50%, #282A2E 100%)",
                }
        }
    }, [hardwareFinish])

    // Variant Data Resolvers
    const cf = props.creativeFront || {}
    const cb = props.creativeBack || {}
    const ef = props.eventFront || {}
    const eb = props.eventBack || {}
    const tf = props.teamFront || {}
    const tb = props.teamBack || {}
    const mf = props.memberFront || {}
    const mb = props.memberBack || {}
    const sf = props.studentFront || {}
    const sb = props.studentBack || {}
    const vf = props.visitorFront || {}
    const vb = props.visitorBack || {}

    // ==========================================================================
    // PER-SURFACE THEME GENERATORS (Supports Light, Dark, and Dual Tone)
    // ==========================================================================

    // 1. Creative ID Theme Builder
    const getCreativeTheme = useCallback(
        (darkSurface: boolean, isFrontSurface: boolean) => {
            const surfaceCustomBg = isFrontSurface
                ? customFrontBg
                : customBackBg
            if (darkSurface) {
                return {
                    bg: useCustomColors
                        ? surfaceCustomBg
                        : isFrontSurface
                          ? "#161719"
                          : "#191919",
                    primaryText: "#F4F3EF",
                    secondaryText: "#94969E",
                    mutedText: "#7E8088",
                    socialText: "#B5B5B5",
                    waveGradient:
                        "radial-gradient(circle, rgba(38, 40, 46, 0.65) 0%, rgba(22, 23, 25, 0) 70%)",
                    portraitBg: "#232529",
                    portraitBorder: "rgba(255,255,255,0.08)",
                    arrowPillBg: "rgba(255,255,255,0.06)",
                    qrBg: "#131313",
                    qrModule: "#F4F3EF",
                    qrBorder: "rgba(255,255,255,0.08)",
                }
            }
            return {
                bg: useCustomColors ? surfaceCustomBg : "#F5F3EE",
                primaryText: "#171717",
                secondaryText: "#777777",
                mutedText: "#686868",
                socialText: "#4A4A4A",
                waveGradient:
                    "radial-gradient(circle, rgba(235, 231, 222, 0.78) 0%, rgba(245, 243, 238, 0) 70%)",
                portraitBg: "#E3E1DB",
                portraitBorder: "rgba(0,0,0,0.06)",
                arrowPillBg: "rgba(0,0,0,0.04)",
                qrBg: "#FFFFFF",
                qrModule: "#171717",
                qrBorder: "rgba(0,0,0,0.08)",
            }
        },
        [useCustomColors, customFrontBg, customBackBg]
    )

    const creativeFrontTheme = useMemo(
        () => getCreativeTheme(isFrontDark, true),
        [getCreativeTheme, isFrontDark]
    )
    const creativeBackTheme = useMemo(
        () => getCreativeTheme(isBackDark, false),
        [getCreativeTheme, isBackDark]
    )

    // 2. Event Pass Theme Builder & Pass Category Styling
    const getEventTheme = useCallback(
        (darkSurface: boolean, isFrontSurface: boolean) => {
            const surfaceCustomBg = isFrontSurface
                ? customFrontBg
                : customBackBg
            if (darkSurface) {
                return {
                    bg: useCustomColors ? surfaceCustomBg : "#141517",
                    primaryText: "#F8F7F4",
                    secondaryText: "#9599A4",
                    mutedText: "#7A7E88",
                    gridLine: "rgba(255,255,255,0.06)",
                    yearBadgeBg: "rgba(255,255,255,0.08)",
                    yearBadgeText: accentColor,
                    yearBadgeBorder: "1px solid rgba(255,255,255,0.14)",
                    divider: "rgba(255,255,255,0.1)",
                    portraitBg: "#222429",
                    boxBg: "rgba(255,255,255,0.04)",
                    boxBorder: "rgba(255,255,255,0.08)",
                    dashedBorder: "rgba(255,255,255,0.15)",
                    qrBg: "#0E0F11",
                    qrModule: "#F8F7F4",
                    accentTag: accentColor,
                }
            }
            return {
                bg: useCustomColors ? surfaceCustomBg : "#F8F7F4",
                primaryText: "#141517",
                secondaryText: "#6E717A",
                mutedText: "#777A82",
                gridLine: "rgba(20,21,23,0.05)",
                yearBadgeBg: "#141517",
                yearBadgeText: "#F8F7F4",
                yearBadgeBorder: "none",
                divider: "rgba(20,21,23,0.1)",
                portraitBg: "#E2E0D8",
                boxBg: "rgba(20,21,23,0.035)",
                boxBorder: "rgba(20,21,23,0.08)",
                dashedBorder: "rgba(20,21,23,0.18)",
                qrBg: "#FFFFFF",
                qrModule: "#141517",
                accentTag: "#141517",
            }
        },
        [useCustomColors, customFrontBg, customBackBg, accentColor]
    )

    const eventFrontTheme = useMemo(
        () => getEventTheme(isFrontDark, true),
        [getEventTheme, isFrontDark]
    )
    const eventBackTheme = useMemo(
        () => getEventTheme(isBackDark, false),
        [getEventTheme, isBackDark]
    )

    const passTypeVal = ef.passType ?? props.passType ?? "SPEAKER"
    const passTypeStyle = useMemo(() => {
        switch (passTypeVal) {
            case "VIP":
                return {
                    bg: isFrontDark ? "#22252B" : "#141517",
                    text: "#FFFFFF",
                    border: `1.5px solid ${accentColor}`,
                    badgeDot: accentColor,
                    tagText: "ALL-ACCESS VIP",
                }
            case "SPEAKER":
                return {
                    bg: accentColor,
                    text: "#141517",
                    border: "none",
                    badgeDot: "#141517",
                    tagText: "OFFICIAL SPEAKER",
                }
            case "ORGANIZER":
                return {
                    bg: isFrontDark ? "#F4F3EF" : "#25282F",
                    text: isFrontDark ? "#141517" : "#F8F7F4",
                    border: isFrontDark
                        ? "none"
                        : "1px solid rgba(255,255,255,0.25)",
                    badgeDot: isFrontDark ? "#141517" : "#FFFFFF",
                    tagText: "ORGANIZER STAFF",
                }
            case "EXHIBITOR":
                return {
                    bg: isFrontDark ? "rgba(255,255,255,0.08)" : "#E8E6DF",
                    text: isFrontDark ? "#F8F7F4" : "#141517",
                    border: isFrontDark
                        ? "1.5px solid rgba(255,255,255,0.3)"
                        : "1.5px solid #141517",
                    badgeDot: isFrontDark ? accentColor : "#141517",
                    tagText: "BOOTH EXHIBITOR",
                }
            case "WORKSHOP":
                return {
                    bg: "#2E3440",
                    text: "#ECEFF4",
                    border: `1.5px solid ${accentColor}80`,
                    badgeDot: accentColor,
                    tagText: "LAB & WORKSHOP",
                }
            default:
                return {
                    bg: isFrontDark ? "rgba(255,255,255,0.08)" : "#E3E1D9",
                    text: isFrontDark ? "#E4E6EC" : "#2D2E30",
                    border: isFrontDark
                        ? "1px solid rgba(255,255,255,0.14)"
                        : "1px solid rgba(0,0,0,0.12)",
                    badgeDot: isFrontDark ? accentColor : "#70737C",
                    tagText: "GENERAL ATTENDEE",
                }
        }
    }, [passTypeVal, accentColor, isFrontDark])

    // 3. Team ID Theme Builder
    const getTeamTheme = useCallback(
        (darkSurface: boolean, isFrontSurface: boolean) => {
            const surfaceCustomBg = isFrontSurface
                ? customFrontBg
                : customBackBg
            if (darkSurface) {
                return {
                    bg: useCustomColors ? surfaceCustomBg : "#16171A",
                    primaryText: "#F5F4F0",
                    secondaryText: "#9CA1AB",
                    mutedText: "#7E828C",
                    verifiedBg: "rgba(255,255,255,0.06)",
                    verifiedBorder: "1px solid rgba(255,255,255,0.1)",
                    empIdBg: "rgba(200, 243, 106, 0.14)",
                    empIdText: accentColor,
                    empIdBorder: `1px solid ${accentColor}50`,
                    matrixBg: "rgba(255,255,255,0.04)",
                    matrixBorder: "1px solid rgba(255,255,255,0.08)",
                    divider: "rgba(255,255,255,0.09)",
                    portraitBg: "#23252A",
                    qrBg: "#101113",
                    qrModule: "#F5F4F0",
                }
            }
            return {
                bg: useCustomColors ? surfaceCustomBg : "#F5F3EE",
                primaryText: "#171717",
                secondaryText: "#555860",
                mutedText: "#777777",
                verifiedBg: "rgba(0,0,0,0.05)",
                verifiedBorder: "1px solid rgba(0,0,0,0.06)",
                empIdBg: "#171717",
                empIdText: "#F5F3EE",
                empIdBorder: "none",
                matrixBg: "rgba(0,0,0,0.03)",
                matrixBorder: "1px solid rgba(0,0,0,0.06)",
                divider: "rgba(0,0,0,0.08)",
                portraitBg: "#E2E0D8",
                qrBg: "#FFFFFF",
                qrModule: "#171717",
            }
        },
        [useCustomColors, customFrontBg, customBackBg, accentColor]
    )

    const teamFrontTheme = useMemo(
        () => getTeamTheme(isFrontDark, true),
        [getTeamTheme, isFrontDark]
    )
    const teamBackTheme = useMemo(
        () => getTeamTheme(isBackDark, false),
        [getTeamTheme, isBackDark]
    )

    // 4. Member Pass Theme & Tier Styling Builder
    const memberTierVal =
        mf.membershipTier ?? props.membershipTier ?? "SIGNATURE"
    const rawMemberAccent =
        look.memberAccentColor ??
        mf.memberAccentColor ??
        props.memberAccentColor

    const getMemberPalette = useCallback(
        (darkSurface: boolean, isFrontSurface: boolean) => {
            const surfaceCustomBg = isFrontSurface
                ? customFrontBg
                : customBackBg
            const defaultChampagne = darkSurface ? "#C6AD80" : "#8E6F3E"
            const resolvedAccent = resolveThemedColor(
                rawMemberAccent,
                defaultChampagne,
                ["#C6AD80", "#8E6F3E", "#A38655"]
            )

            if (darkSurface) {
                return {
                    bg: useCustomColors ? surfaceCustomBg : "#171717",
                    primaryText: "#F6F3EC",
                    secondaryText: "#8E8C85",
                    accent: resolvedAccent,
                    border: "rgba(198, 173, 128, 0.35)",
                    badgeBg: "rgba(198, 173, 128, 0.08)",
                    qrBg: "#111111",
                    qrModule: "#F6F3EC",
                }
            }
            return {
                bg: useCustomColors ? surfaceCustomBg : "#F4F1E9",
                primaryText: "#171717",
                secondaryText: "#757168",
                accent: resolvedAccent,
                border: "rgba(142, 111, 62, 0.32)",
                badgeBg: "rgba(142, 111, 62, 0.08)",
                qrBg: "#FFFFFF",
                qrModule: "#171717",
            }
        },
        [useCustomColors, customFrontBg, customBackBg, rawMemberAccent]
    )

    const memberFrontPalette = useMemo(
        () => getMemberPalette(isFrontDark, true),
        [getMemberPalette, isFrontDark]
    )
    const memberBackPalette = useMemo(
        () => getMemberPalette(isBackDark, false),
        [getMemberPalette, isBackDark]
    )

    const getMemberTierStyle = useCallback(
        (
            darkSurface: boolean,
            palette: { accent: string; badgeBg: string }
        ) => {
            switch (membershipTierToKey(memberTierVal)) {
                case "GOLD":
                    return {
                        accent: darkSurface ? "#D4AF37" : "#9A7418",
                        bg: darkSurface
                            ? "rgba(212, 175, 55, 0.12)"
                            : "rgba(154, 116, 24, 0.1)",
                        border: `1px solid ${darkSurface ? "#D4AF37" : "#9A7418"}`,
                        label: "GOLD MEMBER",
                    }
                case "PLATINUM":
                    return {
                        accent: darkSurface ? "#D8DEE9" : "#4C566A",
                        bg: darkSurface
                            ? "rgba(216, 222, 233, 0.12)"
                            : "rgba(76, 86, 106, 0.1)",
                        border: `1px solid ${darkSurface ? "#D8DEE9" : "#4C566A"}`,
                        label: "PLATINUM MEMBER",
                    }
                case "FOUNDING MEMBER":
                    return {
                        accent: palette.accent,
                        bg: darkSurface
                            ? "rgba(198, 173, 128, 0.16)"
                            : "rgba(142, 111, 62, 0.12)",
                        border: `1px solid ${palette.accent}`,
                        label: "FOUNDING MEMBER",
                    }
                case "VIP MEMBER":
                    return {
                        accent: darkSurface ? "#E5C158" : "#8C6512",
                        bg: darkSurface
                            ? "rgba(229, 193, 88, 0.14)"
                            : "rgba(140, 101, 18, 0.1)",
                        border: `1px solid ${darkSurface ? "#E5C158" : "#8C6512"}`,
                        label: "VIP MEMBER",
                    }
                case "STANDARD":
                    return {
                        accent: darkSurface ? "#A8ABB2" : "#4A4D52",
                        bg: darkSurface
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(0,0,0,0.05)",
                        border: `1px solid ${darkSurface ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
                        label: "STANDARD MEMBER",
                    }
                case "SIGNATURE":
                default:
                    return {
                        accent: palette.accent,
                        bg: palette.badgeBg,
                        border: `1px solid ${palette.accent}`,
                        label: "SIGNATURE MEMBER",
                    }
            }
        },
        [memberTierVal]
    )

    const memberFrontTierStyle = useMemo(
        () => getMemberTierStyle(isFrontDark, memberFrontPalette),
        [getMemberTierStyle, isFrontDark, memberFrontPalette]
    )
    const memberBackTierStyle = useMemo(
        () => getMemberTierStyle(isBackDark, memberBackPalette),
        [getMemberTierStyle, isBackDark, memberBackPalette]
    )

    // 5. Student ID Theme Builder (New Variant 5)
    const getStudentTheme = useCallback(
        (darkSurface: boolean, isFrontSurface: boolean) => {
            const surfaceCustomBg = isFrontSurface
                ? customFrontBg
                : customBackBg
            if (darkSurface) {
                return {
                    bg: useCustomColors ? surfaceCustomBg : "#15171C",
                    headerBandBg: "rgba(255,255,255,0.04)",
                    headerBandBorder: "rgba(255,255,255,0.08)",
                    primaryText: "#F5F6F8",
                    secondaryText: "#9CA3AF",
                    mutedText: "#737B89",
                    pillBg: accentColor,
                    pillText: "#141517",
                    yearTagBg: "rgba(255,255,255,0.08)",
                    yearTagText: "#F5F6F8",
                    yearTagBorder: "1px solid rgba(255,255,255,0.14)",
                    cardBoxBg: "rgba(255,255,255,0.035)",
                    cardBoxBorder: "rgba(255,255,255,0.08)",
                    divider: "rgba(255,255,255,0.09)",
                    portraitBg: "#23262E",
                    qrBg: "#0E1014",
                    qrModule: "#F5F6F8",
                }
            }
            return {
                bg: useCustomColors ? surfaceCustomBg : "#F6F5F0",
                headerBandBg: "#ECEAE2",
                headerBandBorder: "rgba(20,21,23,0.08)",
                primaryText: "#15171C",
                secondaryText: "#5A606B",
                mutedText: "#767C87",
                pillBg: "#15171C",
                pillText: "#F6F5F0",
                yearTagBg: accentColor,
                yearTagText: "#15171C",
                yearTagBorder: "none",
                cardBoxBg: "rgba(21,23,28,0.035)",
                cardBoxBorder: "rgba(21,23,28,0.08)",
                divider: "rgba(21,23,28,0.09)",
                portraitBg: "#E0DDD3",
                qrBg: "#FFFFFF",
                qrModule: "#15171C",
            }
        },
        [useCustomColors, customFrontBg, customBackBg, accentColor]
    )

    const studentFrontTheme = useMemo(
        () => getStudentTheme(isFrontDark, true),
        [getStudentTheme, isFrontDark]
    )
    const studentBackTheme = useMemo(
        () => getStudentTheme(isBackDark, false),
        [getStudentTheme, isBackDark]
    )

    // 6. Visitor Pass Theme Builder (New Variant 6)
    const getVisitorTheme = useCallback(
        (darkSurface: boolean, isFrontSurface: boolean) => {
            const surfaceCustomBg = isFrontSurface
                ? customFrontBg
                : customBackBg
            if (darkSurface) {
                return {
                    bg: useCustomColors ? surfaceCustomBg : "#141619",
                    bannerBg: accentColor,
                    bannerText: "#141619",
                    subBannerBg: "rgba(255,255,255,0.06)",
                    subBannerText: "#F4F5F7",
                    primaryText: "#F4F5F7",
                    secondaryText: "#9EA4B0",
                    mutedText: "#757B88",
                    gridBg: "rgba(255,255,255,0.035)",
                    gridBorder: "rgba(255,255,255,0.08)",
                    divider: "rgba(255,255,255,0.1)",
                    portraitBg: "#23262B",
                    qrBg: "#0D0E10",
                    qrModule: "#F4F5F7",
                }
            }
            return {
                bg: useCustomColors ? surfaceCustomBg : "#F7F6F2",
                bannerBg: "#141619",
                bannerText: "#F7F6F2",
                subBannerBg: accentColor,
                subBannerText: "#141619",
                primaryText: "#141619",
                secondaryText: "#565B64",
                mutedText: "#767B85",
                gridBg: "rgba(20,22,25,0.035)",
                gridBorder: "rgba(20,22,25,0.08)",
                divider: "rgba(20,22,25,0.1)",
                portraitBg: "#E3E1D8",
                qrBg: "#FFFFFF",
                qrModule: "#141619",
            }
        },
        [useCustomColors, customFrontBg, customBackBg, accentColor]
    )

    const visitorFrontTheme = useMemo(
        () => getVisitorTheme(isFrontDark, true),
        [getVisitorTheme, isFrontDark]
    )
    const visitorBackTheme = useMemo(
        () => getVisitorTheme(isBackDark, false),
        [getVisitorTheme, isBackDark]
    )

    // ==========================================================================
    // RENDER CARD SURFACES (FRONT)
    // ==========================================================================
    const renderFrontFace = () => {
        // ------------------------------------------------------------------------
        // VARIANT 05: STUDENT ID FRONT
        // ------------------------------------------------------------------------
        if (badgeVariant === "studentId") {
            const instName = sf.institutionName ?? "STANFORD DESIGN INSTITUTE"
            const facultySub =
                sf.facultySubtitle ?? "SCHOOL OF ARCHITECTURE & DESIGN"
            const stuName = sf.studentName ?? "MAYA LIN"
            const stuId = sf.studentIdNumber ?? "STU-2026-849"
            const course = sf.departmentCourse ?? "B.DES · INTERACTION DESIGN"
            const acadYear = sf.academicYear ?? "2026 – 2027"
            const campus = sf.campusLocation ?? "MAIN CAMPUS · STUDIO 04"
            const showPhoto = sf.showStudentPortrait ?? true
            const portraitSrc = resolveImageSrc(
                sf.studentPortraitImage,
                "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=700&q=85"
            )
            const logoSrc = resolveImageSrc(sf.institutionLogoImage)

            const instCol = resolveThemedColor(
                sf.institutionColor,
                studentFrontTheme.primaryText,
                ["#15171C", "#F5F6F8"]
            )
            const nameCol = resolveThemedColor(
                sf.nameColor,
                studentFrontTheme.primaryText,
                ["#15171C", "#F5F6F8"]
            )
            const courseCol = resolveThemedColor(
                sf.courseColor,
                studentFrontTheme.secondaryText,
                ["#5A606B", "#9CA3AF"]
            )

            return (
                <div
                    style={{
                        flex: 1,
                        borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                        backgroundColor: studentFrontTheme.bg,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {/* Institutional Header Band */}
                    <div
                        style={{
                            backgroundColor: studentFrontTheme.headerBandBg,
                            borderBottom: `1px solid ${studentFrontTheme.headerBandBorder}`,
                            padding: "18px 18px 14px 18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "9px",
                            }}
                        >
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Institution Logo"
                                    draggable={false}
                                    style={{
                                        width: "22px",
                                        height: "22px",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <AcademicCrestMark
                                    color={studentFrontTheme.primaryText}
                                    accent={accentColor}
                                    size={22}
                                />
                            )}
                            <div>
                                <div
                                    style={applyTypography(
                                        sf.institutionFont,
                                        instCol,
                                        {
                                            fontSize: 10.5,
                                            fontWeight: 800,
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                        }
                                    )}
                                >
                                    {instName}
                                </div>
                                <div
                                    style={{
                                        fontSize: "7.5px",
                                        fontWeight: 600,
                                        letterSpacing: "0.08em",
                                        color: studentFrontTheme.mutedText,
                                        textTransform: "uppercase",
                                        marginTop: "1px",
                                    }}
                                >
                                    {facultySub}
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                padding: "3px 7px",
                                borderRadius: "4px",
                                backgroundColor: studentFrontTheme.yearTagBg,
                                color: studentFrontTheme.yearTagText,
                                border: studentFrontTheme.yearTagBorder,
                                fontSize: "8px",
                                fontWeight: 800,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            STUDENT
                        </div>
                    </div>

                    {/* Main Student Body */}
                    <div
                        style={{
                            flex: 1,
                            padding: "16px 18px 16px 18px",
                            display: "flex",
                            flexDirection: "column",
                            zIndex: 5,
                        }}
                    >
                        {/* Portrait & Academic Status Row */}
                        {showPhoto && (
                            <div
                                style={{
                                    width: "100%",
                                    height: "152px",
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    backgroundColor:
                                        studentFrontTheme.portraitBg,
                                    border: `1px solid ${studentFrontTheme.cardBoxBorder}`,
                                    marginBottom: "14px",
                                    position: "relative",
                                }}
                            >
                                {portraitSrc && (
                                    <img
                                        src={portraitSrc}
                                        alt={stuName}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "center 20%",
                                        }}
                                    />
                                )}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "8px",
                                        left: "8px",
                                        padding: "3px 8px",
                                        borderRadius: "4px",
                                        backgroundColor:
                                            "rgba(20, 21, 23, 0.82)",
                                        color: accentColor,
                                        fontSize: "8px",
                                        fontWeight: 800,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    AY {acadYear}
                                </div>
                            </div>
                        )}

                        {/* Student Name & Course */}
                        <div style={{ marginBottom: "12px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "4px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "3px",
                                        height: "18px",
                                        backgroundColor: accentColor,
                                        borderRadius: "1.5px",
                                        flexShrink: 0,
                                    }}
                                />
                                <h2
                                    style={{
                                        margin: 0,
                                        ...applyTypography(
                                            sf.nameFont,
                                            nameCol,
                                            {
                                                fontSize: showPhoto ? 20 : 25,
                                                fontWeight: 800,
                                                letterSpacing: "-0.02em",
                                                lineHeight: 1.1,
                                                textTransform: "uppercase",
                                            }
                                        ),
                                    }}
                                >
                                    {stuName}
                                </h2>
                            </div>
                            <div
                                style={applyTypography(
                                    sf.courseFont,
                                    courseCol,
                                    {
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        paddingLeft: "11px",
                                    }
                                )}
                            >
                                {course}
                            </div>
                        </div>

                        {/* Academic Ledger Box */}
                        <div
                            style={{
                                borderRadius: "8px",
                                backgroundColor: studentFrontTheme.cardBoxBg,
                                border: `1px solid ${studentFrontTheme.cardBoxBorder}`,
                                padding: "9px 11px",
                                marginBottom: "auto",
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "8px",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: "7.5px",
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        color: studentFrontTheme.mutedText,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    STUDENT ID NO.
                                </div>
                                <div
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        letterSpacing: "0.06em",
                                        color: studentFrontTheme.primaryText,
                                        marginTop: "2px",
                                    }}
                                >
                                    {stuId}
                                </div>
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: "7.5px",
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        color: studentFrontTheme.mutedText,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    ACADEMIC TERM
                                </div>
                                <div
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        letterSpacing: "0.06em",
                                        color: studentFrontTheme.primaryText,
                                        marginTop: "2px",
                                    }}
                                >
                                    {acadYear}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Barcode & Campus Footer */}
                        <div
                            style={{
                                borderTop: `1px solid ${studentFrontTheme.divider}`,
                                paddingTop: "10px",
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "space-between",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: "8.5px",
                                        fontWeight: 800,
                                        letterSpacing: "0.08em",
                                        color: studentFrontTheme.primaryText,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {campus}
                                </div>
                                <div
                                    style={{
                                        fontSize: "7.5px",
                                        fontWeight: 600,
                                        letterSpacing: "0.06em",
                                        color: studentFrontTheme.mutedText,
                                        marginTop: "1px",
                                    }}
                                >
                                    OFFICIAL STUDENT CREDENTIAL
                                </div>
                            </div>
                            <BarcodeStrip
                                color={studentFrontTheme.primaryText}
                                height={16}
                            />
                        </div>
                    </div>
                </div>
            )
        }

        // ------------------------------------------------------------------------
        // VARIANT 06: VISITOR PASS FRONT
        // ------------------------------------------------------------------------
        if (badgeVariant === "visitorPass") {
            const visLabel = vf.visitorLabel ?? "VISITOR"
            const accessLvl = vf.accessLevel ?? "ESCORT REQUIRED"
            const hostCorp = vf.hostCompany ?? "APEX GLOBAL HQ"
            const visName = vf.visitorName ?? "DAVID CHEN"
            const visOrg = vf.visitorOrg ?? "VERTEX VENTURES"
            const passNum = vf.passNumber ?? "VIS-042"
            const hostPerson = vf.hostName ?? "SARAH JENKINS"
            const visitDt = vf.visitDate ?? "16 OCT 2026"
            const showPhoto = vf.showVisitorPortrait ?? true
            const portraitSrc = resolveImageSrc(
                vf.visitorPortraitImage,
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=85"
            )
            const logoSrc = resolveImageSrc(vf.visitorLogoImage)

            const nameCol = resolveThemedColor(
                vf.nameColor,
                visitorFrontTheme.primaryText,
                ["#141619", "#F4F5F7"]
            )
            const orgCol = resolveThemedColor(
                vf.orgColor,
                visitorFrontTheme.secondaryText,
                ["#565B64", "#9EA4B0"]
            )
            const metaCol = resolveThemedColor(
                vf.metaColor,
                visitorFrontTheme.primaryText,
                ["#141619", "#F4F5F7"]
            )

            return (
                <div
                    style={{
                        flex: 1,
                        borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                        backgroundColor: visitorFrontTheme.bg,
                        padding: "20px 18px 16px 18px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {/* Top Organization & Pass Number Header */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "12px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Logo"
                                    draggable={false}
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <VisitorShieldMark
                                    color={visitorFrontTheme.primaryText}
                                    accent={accentColor}
                                    size={20}
                                />
                            )}
                            <span
                                style={{
                                    fontSize: "10.5px",
                                    fontWeight: 800,
                                    letterSpacing: "0.14em",
                                    color: visitorFrontTheme.primaryText,
                                    textTransform: "uppercase",
                                }}
                            >
                                {hostCorp}
                            </span>
                        </div>

                        <div
                            style={{
                                padding: "3px 8px",
                                borderRadius: "4px",
                                backgroundColor: visitorFrontTheme.gridBg,
                                border: `1px solid ${visitorFrontTheme.gridBorder}`,
                                fontSize: "9px",
                                fontWeight: 800,
                                letterSpacing: "0.1em",
                                color: visitorFrontTheme.primaryText,
                            }}
                        >
                            {passNum}
                        </div>
                    </div>

                    {/* Prominent VISITOR Status Banner */}
                    <div
                        style={{
                            width: "100%",
                            borderRadius: "8px",
                            backgroundColor: visitorFrontTheme.bannerBg,
                            color: visitorFrontTheme.bannerText,
                            padding: "10px 14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "16px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                fontSize: "20px",
                                fontWeight: 900,
                                letterSpacing: "0.14em",
                                lineHeight: 1,
                                textTransform: "uppercase",
                            }}
                        >
                            {visLabel}
                        </div>
                        <div
                            style={{
                                padding: "3px 7px",
                                borderRadius: "3px",
                                backgroundColor: visitorFrontTheme.subBannerBg,
                                color: visitorFrontTheme.subBannerText,
                                fontSize: "7.5px",
                                fontWeight: 800,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                            }}
                        >
                            {accessLvl}
                        </div>
                    </div>

                    {/* Visitor Identity Area */}
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            marginBottom: "16px",
                            zIndex: 5,
                        }}
                    >
                        {showPhoto && (
                            <div
                                style={{
                                    width: "84px",
                                    height: "104px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    backgroundColor:
                                        visitorFrontTheme.portraitBg,
                                    border: `1px solid ${visitorFrontTheme.gridBorder}`,
                                    flexShrink: 0,
                                }}
                            >
                                {portraitSrc && (
                                    <img
                                        src={portraitSrc}
                                        alt={visName}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "center 20%",
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    fontSize: "8px",
                                    fontWeight: 700,
                                    letterSpacing: "0.12em",
                                    color: visitorFrontTheme.mutedText,
                                    textTransform: "uppercase",
                                    marginBottom: "4px",
                                }}
                            >
                                REGISTERED GUEST
                            </div>
                            <h2
                                style={{
                                    margin: 0,
                                    ...applyTypography(vf.nameFont, nameCol, {
                                        fontSize: showPhoto ? 20 : 26,
                                        fontWeight: 900,
                                        letterSpacing: "-0.02em",
                                        lineHeight: 1.08,
                                        textTransform: "uppercase",
                                    }),
                                }}
                            >
                                {visName}
                            </h2>
                            <div
                                style={applyTypography(vf.orgFont, orgCol, {
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    marginTop: "5px",
                                })}
                            >
                                {visOrg}
                            </div>
                        </div>
                    </div>

                    {/* Visit Host & Date Ledger */}
                    <div
                        style={{
                            borderRadius: "8px",
                            backgroundColor: visitorFrontTheme.gridBg,
                            border: `1px solid ${visitorFrontTheme.gridBorder}`,
                            padding: "10px 12px",
                            marginBottom: "auto",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "10px",
                            zIndex: 5,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "7.5px",
                                    fontWeight: 700,
                                    letterSpacing: "0.12em",
                                    color: visitorFrontTheme.mutedText,
                                    textTransform: "uppercase",
                                }}
                            >
                                VISITING HOST
                            </div>
                            <div
                                style={applyTypography(vf.metaFont, metaCol, {
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                    marginTop: "2px",
                                })}
                            >
                                {hostPerson}
                            </div>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "7.5px",
                                    fontWeight: 700,
                                    letterSpacing: "0.12em",
                                    color: visitorFrontTheme.mutedText,
                                    textTransform: "uppercase",
                                }}
                            >
                                VISIT DATE
                            </div>
                            <div
                                style={applyTypography(vf.metaFont, metaCol, {
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                    marginTop: "2px",
                                })}
                            >
                                {visitDt}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Security Footer & Barcode */}
                    <div
                        style={{
                            borderTop: `1px solid ${visitorFrontTheme.divider}`,
                            paddingTop: "10px",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            zIndex: 5,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "6px",
                                        height: "6px",
                                        borderRadius: "50%",
                                        backgroundColor: accentColor,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: "8.5px",
                                        fontWeight: 800,
                                        letterSpacing: "0.08em",
                                        color: visitorFrontTheme.primaryText,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    CHECKED IN · VALID TODAY
                                </span>
                            </div>
                            <div
                                style={{
                                    fontSize: "7.5px",
                                    fontWeight: 600,
                                    letterSpacing: "0.05em",
                                    color: visitorFrontTheme.mutedText,
                                    marginTop: "2px",
                                }}
                            >
                                RETURN PASS TO RECEPTION DESK
                            </div>
                        </div>
                        <BarcodeStrip
                            color={visitorFrontTheme.primaryText}
                            height={16}
                        />
                    </div>
                </div>
            )
        }

        // ------------------------------------------------------------------------
        // VARIANT 02: EVENT PASS FRONT
        // ------------------------------------------------------------------------
        if (badgeVariant === "eventPass") {
            const eventTitle =
                ef.eventTitle ??
                props.eventTitle ??
                "INTERNATIONAL\nDESIGN SUMMIT"
            const attendeeName =
                ef.participantName ?? props.participantName ?? "ALEX MORGAN"
            const attendeeRole =
                ef.participantRole ?? props.participantRole ?? "DESIGN DIRECTOR"
            const attendeeOrg =
                ef.participantOrg ?? props.participantOrg ?? "STUDIO NORTH"
            const showPhoto =
                ef.showEventPortrait ?? props.showEventPortrait ?? true
            const portraitSrc = resolveImageSrc(
                ef.eventPortraitImage ?? props.eventPortraitImage,
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=85"
            )
            const logoSrc = resolveImageSrc(
                ef.eventLogoImage ?? props.eventLogoImage
            )

            const brandCol = resolveThemedColor(
                ef.brandColor,
                eventFrontTheme.primaryText,
                ["#141517", "#F8F7F4"]
            )
            const titleCol = resolveThemedColor(
                ef.titleColor,
                eventFrontTheme.primaryText,
                ["#141517", "#F8F7F4"]
            )
            const subCol = resolveThemedColor(
                ef.subtitleColor,
                eventFrontTheme.mutedText,
                ["#777A82", "#9599A4"]
            )
            const nameCol = resolveThemedColor(
                ef.nameColor,
                eventFrontTheme.primaryText,
                ["#141517", "#F8F7F4"]
            )
            const roleCol = resolveThemedColor(
                ef.roleColor,
                eventFrontTheme.primaryText,
                ["#141517", "#F8F7F4"]
            )
            const orgCol = resolveThemedColor(
                ef.orgColor,
                eventFrontTheme.secondaryText,
                ["#73767F", "#9599A4"]
            )

            return (
                <div
                    style={{
                        flex: 1,
                        borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                        backgroundColor: eventFrontTheme.bg,
                        padding: "20px 18px 16px 18px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {/* Subtle Vertical Gridline */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            right: "52px",
                            width: "1px",
                            height: "100%",
                            backgroundColor: eventFrontTheme.gridLine,
                            pointerEvents: "none",
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "12px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Logo"
                                    draggable={false}
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <EventMark
                                    color={eventFrontTheme.primaryText}
                                    accent={accentColor}
                                    size={18}
                                />
                            )}
                            <span
                                style={applyTypography(ef.brandFont, brandCol, {
                                    fontSize: 11,
                                    fontWeight: 800,
                                    letterSpacing: "0.14em",
                                })}
                            >
                                {ef.eventBrand ??
                                    props.eventBrand ??
                                    "DESIGN / FUTURE"}
                            </span>
                        </div>
                        <div
                            style={{
                                padding: "3px 7px",
                                backgroundColor: eventFrontTheme.yearBadgeBg,
                                color: eventFrontTheme.yearBadgeText,
                                border: eventFrontTheme.yearBadgeBorder,
                                borderRadius: "3px",
                                fontSize: "8.5px",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                            }}
                        >
                            {ef.eventYear ?? props.eventYear ?? "2026 // ED.08"}
                        </div>
                    </div>

                    <div style={{ marginBottom: "14px", zIndex: 5 }}>
                        <div
                            style={{
                                ...applyTypography(ef.titleFont, titleCol, {
                                    fontSize: 17.5,
                                    fontWeight: 900,
                                    letterSpacing: "-0.03em",
                                    lineHeight: 1.08,
                                    textTransform: "uppercase",
                                }),
                                whiteSpace: "pre-line",
                            }}
                        >
                            {eventTitle}
                        </div>
                        <div
                            style={applyTypography(ef.subtitleFont, subCol, {
                                fontSize: 9,
                                fontWeight: 600,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                marginTop: "5px",
                            })}
                        >
                            {ef.eventSubtitle ??
                                props.eventSubtitle ??
                                "SAN FRANCISCO, CA"}
                        </div>
                    </div>

                    <div
                        style={{
                            width: "100%",
                            borderRadius: "6px",
                            backgroundColor: passTypeStyle.bg,
                            color: passTypeStyle.text,
                            border: passTypeStyle.border,
                            padding: "7px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "14px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "7px",
                            }}
                        >
                            <div
                                style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor: passTypeStyle.badgeDot,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 900,
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                }}
                            >
                                {passTypeVal}
                            </span>
                        </div>
                        <span
                            style={{
                                fontSize: "8px",
                                fontWeight: 700,
                                letterSpacing: "0.14em",
                                opacity: 0.85,
                                textTransform: "uppercase",
                            }}
                        >
                            {passTypeStyle.tagText}
                        </span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "flex-start",
                            marginBottom: "auto",
                            zIndex: 5,
                        }}
                    >
                        {showPhoto && (
                            <div
                                style={{
                                    width: "84px",
                                    height: "108px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    backgroundColor: eventFrontTheme.portraitBg,
                                    flexShrink: 0,
                                }}
                            >
                                {portraitSrc && (
                                    <img
                                        src={portraitSrc}
                                        alt="Portrait"
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "center 20%",
                                        }}
                                    />
                                )}
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h2
                                style={{
                                    margin: 0,
                                    ...applyTypography(ef.nameFont, nameCol, {
                                        fontSize: showPhoto ? 19 : 27,
                                        fontWeight: 900,
                                        letterSpacing: "-0.02em",
                                        lineHeight: 1.08,
                                        textTransform: "uppercase",
                                    }),
                                }}
                            >
                                {attendeeName}
                            </h2>
                            <div
                                style={applyTypography(ef.roleFont, roleCol, {
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    marginTop: "6px",
                                })}
                            >
                                {attendeeRole}
                            </div>
                            <div
                                style={applyTypography(ef.orgFont, orgCol, {
                                    fontSize: 9.5,
                                    fontWeight: 600,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    marginTop: "2px",
                                })}
                            >
                                {attendeeOrg}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            borderTop: `1px solid ${eventFrontTheme.divider}`,
                            paddingTop: "10px",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            zIndex: 5,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "9.5px",
                                    fontWeight: 800,
                                    letterSpacing: "0.08em",
                                    color: eventFrontTheme.primaryText,
                                }}
                            >
                                {ef.eventDate ??
                                    props.eventDate ??
                                    "14–15 NOV 2026"}
                            </div>
                            <div
                                style={{
                                    fontSize: "8.5px",
                                    fontWeight: 600,
                                    letterSpacing: "0.04em",
                                    color: eventFrontTheme.secondaryText,
                                }}
                            >
                                {ef.eventLocation ??
                                    props.eventLocation ??
                                    "SAN FRANCISCO, CA"}
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: "2px",
                            }}
                        >
                            <BarcodeStrip
                                color={eventFrontTheme.primaryText}
                                height={18}
                            />
                            <span
                                style={{
                                    fontSize: "8px",
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    color: eventFrontTheme.secondaryText,
                                }}
                            >
                                {ef.passId ?? props.passId ?? "EV-026-001"}
                            </span>
                        </div>
                    </div>
                </div>
            )
        }

        // ------------------------------------------------------------------------
        // VARIANT 03: TEAM ID FRONT
        // ------------------------------------------------------------------------
        if (badgeVariant === "teamId") {
            const empName =
                tf.employeeName ?? props.employeeName ?? "JORDAN LEE"
            const empRole =
                tf.employeeRole ??
                props.employeeRole ??
                "STAFF PRODUCT DESIGNER"
            const showPhoto =
                tf.showTeamPortrait ?? props.showTeamPortrait ?? true
            const portraitSrc = resolveImageSrc(
                tf.teamPortraitImage ?? props.teamPortraitImage,
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85"
            )
            const logoSrc = resolveImageSrc(
                tf.companyLogoImage ?? props.companyLogoImage
            )

            const compCol = resolveThemedColor(
                tf.companyColor,
                teamFrontTheme.primaryText,
                ["#171717", "#F5F4F0"]
            )
            const tagCol = resolveThemedColor(
                tf.taglineColor,
                teamFrontTheme.mutedText,
                ["#777777", "#7E828C"]
            )
            const nameCol = resolveThemedColor(
                tf.nameColor,
                teamFrontTheme.primaryText,
                ["#171717", "#F5F4F0"]
            )
            const roleCol = resolveThemedColor(
                tf.roleColor,
                teamFrontTheme.secondaryText,
                ["#171717", "#9CA1AB"]
            )
            const matCol = resolveThemedColor(
                tf.matrixColor,
                teamFrontTheme.primaryText,
                ["#171717", "#F5F4F0"]
            )

            return (
                <div
                    style={{
                        flex: 1,
                        borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                        backgroundColor: teamFrontTheme.bg,
                        padding: "22px 18px 18px 18px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "16px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Logo"
                                    draggable={false}
                                    style={{
                                        width: "22px",
                                        height: "22px",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <CorporateLogoMark
                                    color={teamFrontTheme.primaryText}
                                    accent={accentColor}
                                    size={20}
                                />
                            )}
                            <div>
                                <div
                                    style={applyTypography(
                                        tf.companyFont,
                                        compCol,
                                        {
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: "0.14em",
                                            textTransform: "uppercase",
                                        }
                                    )}
                                >
                                    {tf.companyName ??
                                        props.companyName ??
                                        "NORTHSTAR"}
                                </div>
                                <div
                                    style={applyTypography(
                                        tf.taglineFont,
                                        tagCol,
                                        {
                                            fontSize: 7.5,
                                            fontWeight: 600,
                                            letterSpacing: "0.08em",
                                            textTransform: "uppercase",
                                        }
                                    )}
                                >
                                    {tf.companyTagline ??
                                        props.companyTagline ??
                                        "ENTERPRISE SYSTEMS CORP"}
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                backgroundColor: teamFrontTheme.verifiedBg,
                                border: teamFrontTheme.verifiedBorder,
                            }}
                        >
                            <div
                                style={{
                                    width: "5px",
                                    height: "5px",
                                    borderRadius: "50%",
                                    backgroundColor: accentColor,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: "8.5px",
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    color: teamFrontTheme.primaryText,
                                    textTransform: "uppercase",
                                }}
                            >
                                VERIFIED
                            </span>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "14px",
                            alignItems: "flex-start",
                            marginBottom: "16px",
                            zIndex: 5,
                        }}
                    >
                        {showPhoto && (
                            <div
                                style={{
                                    width: "88px",
                                    height: "116px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    backgroundColor: teamFrontTheme.portraitBg,
                                    flexShrink: 0,
                                }}
                            >
                                {portraitSrc && (
                                    <img
                                        src={portraitSrc}
                                        alt="Portrait"
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: "center 20%",
                                        }}
                                    />
                                )}
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    display: "inline-block",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    backgroundColor: teamFrontTheme.empIdBg,
                                    color: teamFrontTheme.empIdText,
                                    border: teamFrontTheme.empIdBorder,
                                    fontSize: "8px",
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    marginBottom: "6px",
                                }}
                            >
                                {tf.employeeId ??
                                    props.employeeId ??
                                    "TEAM-024"}
                            </div>
                            <h2
                                style={{
                                    margin: 0,
                                    ...applyTypography(tf.nameFont, nameCol, {
                                        fontSize: showPhoto ? 19 : 26,
                                        fontWeight: 800,
                                        letterSpacing: "-0.02em",
                                        lineHeight: 1.1,
                                        textTransform: "uppercase",
                                    }),
                                }}
                            >
                                {empName}
                            </h2>
                            <div
                                style={applyTypography(tf.roleFont, roleCol, {
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    marginTop: "4px",
                                })}
                            >
                                {empRole}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            borderRadius: "8px",
                            backgroundColor: teamFrontTheme.matrixBg,
                            border: teamFrontTheme.matrixBorder,
                            padding: "10px 12px",
                            marginBottom: "auto",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "8px",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: "8px",
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        color: teamFrontTheme.mutedText,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    DEPARTMENT
                                </div>
                                <div
                                    style={applyTypography(
                                        tf.matrixFont,
                                        matCol,
                                        {
                                            fontSize: 10,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            marginTop: "2px",
                                        }
                                    )}
                                >
                                    {tf.department ??
                                        props.department ??
                                        "PRODUCT & DESIGN"}
                                </div>
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: "8px",
                                        fontWeight: 700,
                                        letterSpacing: "0.12em",
                                        color: teamFrontTheme.mutedText,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    TEAM
                                </div>
                                <div
                                    style={applyTypography(
                                        tf.matrixFont,
                                        matCol,
                                        {
                                            fontSize: 10,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            marginTop: "2px",
                                        }
                                    )}
                                >
                                    {tf.teamName ??
                                        props.teamName ??
                                        "DIGITAL PLATFORMS"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            borderTop: `1px solid ${teamFrontTheme.divider}`,
                            paddingTop: "10px",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            zIndex: 5,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "9px",
                                    fontWeight: 800,
                                    letterSpacing: "0.08em",
                                    color: teamFrontTheme.primaryText,
                                }}
                            >
                                {tf.officeLocation ??
                                    props.officeLocation ??
                                    "SAN FRANCISCO HQ"}
                            </div>
                            <div
                                style={{
                                    fontSize: "8px",
                                    fontWeight: 600,
                                    letterSpacing: "0.04em",
                                    color: teamFrontTheme.mutedText,
                                }}
                            >
                                SECURE BADGE ACCESS
                            </div>
                        </div>
                        <BarcodeStrip
                            color={teamFrontTheme.primaryText}
                            height={16}
                        />
                    </div>
                </div>
            )
        }

        // ------------------------------------------------------------------------
        // VARIANT 04: MEMBER PASS FRONT
        // ------------------------------------------------------------------------
        if (badgeVariant === "memberPass") {
            const clubName =
                mf.clubBrandName ?? props.clubBrandName ?? "THE FOUNDERS CLUB"
            const memberName =
                mf.memberName ?? props.memberName ?? "ALEX MORGAN"
            const showPhoto =
                mf.showMemberPortrait ?? props.showMemberPortrait ?? false
            const portraitSrc = resolveImageSrc(
                mf.memberPortraitImage ?? props.memberPortraitImage,
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85"
            )
            const logoSrc = resolveImageSrc(
                mf.clubLogoImage ?? props.clubLogoImage
            )
            const statementText =
                mf.memberStatement ??
                props.memberStatement ??
                "MEMBERSHIP WITH PURPOSE."

            const brandCol = resolveThemedColor(
                mf.brandColor,
                memberFrontPalette.primaryText,
                ["#171717", "#F6F3EC"]
            )
            const labelCol = resolveThemedColor(
                mf.typeLabelColor,
                memberFrontPalette.secondaryText,
                ["#757168", "#8E8C85"]
            )
            const nameCol = resolveThemedColor(
                mf.nameColor,
                memberFrontPalette.primaryText,
                ["#171717", "#F6F3EC"]
            )

            return (
                <div
                    style={{
                        flex: 1,
                        borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                        backgroundColor: memberFrontPalette.bg,
                        padding: "24px 20px 20px 20px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: "10px",
                            border: `0.75px solid ${memberFrontPalette.border}`,
                            borderRadius: `${Math.max(cardBorderRadius - 12, 6)}px`,
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "20px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "9px",
                            }}
                        >
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Logo"
                                    draggable={false}
                                    style={{
                                        width: "24px",
                                        height: "24px",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <ClubEmblemMark
                                    color={memberFrontPalette.accent}
                                    accent={memberFrontPalette.accent}
                                    size={22}
                                />
                            )}
                            <div>
                                <div
                                    style={applyTypography(
                                        mf.brandFont,
                                        brandCol,
                                        {
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: "0.18em",
                                            textTransform: "uppercase",
                                        }
                                    )}
                                >
                                    {clubName}
                                </div>
                                <div
                                    style={applyTypography(
                                        mf.typeLabelFont,
                                        labelCol,
                                        {
                                            fontSize: 7.5,
                                            fontWeight: 600,
                                            letterSpacing: "0.14em",
                                            textTransform: "uppercase",
                                        }
                                    )}
                                >
                                    {mf.membershipTypeLabel ??
                                        props.membershipTypeLabel ??
                                        "PRIVATE MEMBERSHIP"}
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: "8.5px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                color: memberFrontPalette.accent,
                                textTransform: "uppercase",
                                padding: "3px 7px",
                                borderRadius: "3px",
                                border: `0.75px solid ${memberFrontPalette.border}`,
                                backgroundColor: memberFrontPalette.badgeBg,
                            }}
                        >
                            EST. {mf.memberSince ?? props.memberSince ?? "2024"}
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "14px",
                            alignItems: "center",
                            marginBottom: "auto",
                            zIndex: 5,
                        }}
                    >
                        {showPhoto && portraitSrc && (
                            <div
                                style={{
                                    width: "82px",
                                    height: "106px",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    border: `1px solid ${memberFrontPalette.accent}66`,
                                    flexShrink: 0,
                                }}
                            >
                                <img
                                    src={portraitSrc}
                                    alt="Portrait"
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        objectPosition: "center 20%",
                                    }}
                                />
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 9px",
                                    borderRadius: "3px",
                                    backgroundColor: memberFrontTierStyle.bg,
                                    border: memberFrontTierStyle.border,
                                    marginBottom: "10px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "4px",
                                        height: "4px",
                                        borderRadius: "50%",
                                        backgroundColor:
                                            memberFrontTierStyle.accent,
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: "8.5px",
                                        fontWeight: 800,
                                        letterSpacing: "0.14em",
                                        color: memberFrontTierStyle.accent,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {memberFrontTierStyle.label}
                                </span>
                            </div>
                            <h2
                                style={{
                                    margin: 0,
                                    ...applyTypography(mf.nameFont, nameCol, {
                                        fontSize: showPhoto ? 20 : 25,
                                        fontWeight: 700,
                                        letterSpacing: "0.02em",
                                        lineHeight: 1.12,
                                        textTransform: "uppercase",
                                    }),
                                }}
                            >
                                {memberName}
                            </h2>
                            <div
                                style={{
                                    fontSize: "9px",
                                    fontWeight: 600,
                                    letterSpacing: "0.12em",
                                    color: memberFrontPalette.secondaryText,
                                    marginTop: "6px",
                                    textTransform: "uppercase",
                                }}
                            >
                                CREDENTIAL{" "}
                                {mf.membershipNumber ??
                                    props.membershipNumber ??
                                    "MEM-0084"}
                            </div>
                        </div>
                    </div>

                    {statementText && (
                        <div
                            style={{
                                fontSize: "8.5px",
                                fontWeight: 600,
                                letterSpacing: "0.14em",
                                color: memberFrontPalette.secondaryText,
                                textTransform: "uppercase",
                                marginBottom: "14px",
                                zIndex: 5,
                            }}
                        >
                            {statementText}
                        </div>
                    )}

                    <div
                        style={{
                            borderTop: `0.75px solid ${memberFrontPalette.border}`,
                            paddingTop: "12px",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            zIndex: 5,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "8px",
                                    fontWeight: 700,
                                    letterSpacing: "0.14em",
                                    color: memberFrontPalette.secondaryText,
                                    textTransform: "uppercase",
                                }}
                            >
                                MEMBERSHIP ID
                            </div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    letterSpacing: "0.1em",
                                    color: memberFrontPalette.accent,
                                    marginTop: "2px",
                                }}
                            >
                                {mf.membershipNumber ??
                                    props.membershipNumber ??
                                    "MEM-0084"}
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: "3px",
                            }}
                        >
                            <div
                                style={{
                                    width: "24px",
                                    height: "1px",
                                    backgroundColor: memberFrontPalette.accent,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: "7.5px",
                                    fontWeight: 700,
                                    letterSpacing: "0.16em",
                                    color: memberFrontPalette.secondaryText,
                                    textTransform: "uppercase",
                                }}
                            >
                                EXCLUSIVE ACCESS
                            </span>
                        </div>
                    </div>
                </div>
            )
        }

        // ------------------------------------------------------------------------
        // DEFAULT VARIANT 01: CREATIVE ID FRONT
        // ------------------------------------------------------------------------
        const fullName = cf.fullName ?? props.fullName ?? "Kaif Shaikh"
        const proTitle =
            cf.professionalTitle ??
            props.professionalTitle ??
            "UI/UX & DIGITAL DESIGNER"
        const spec =
            cf.specialization ??
            props.specialization ??
            "PRODUCT DESIGN · FRAMER"
        const idNum = cf.idNumber ?? props.idNumber ?? "CR-001"
        const portraitSrc = resolveImageSrc(
            cf.portraitImage ?? props.portraitImage,
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85"
        )
        const logoSrc = resolveImageSrc(cf.customLogo ?? props.customLogo)

        const resolvedNameCol = resolveThemedColor(
            cf.nameColor,
            creativeFrontTheme.primaryText,
            ["#171717", "#F4F3EF"]
        )
        const resolvedTitleCol = resolveThemedColor(
            cf.titleColor,
            creativeFrontTheme.primaryText,
            ["#171717", "#F4F3EF"]
        )
        const resolvedSpecCol = resolveThemedColor(
            cf.specialtyColor,
            creativeFrontTheme.secondaryText,
            ["#777777", "#737373", "#94969E"]
        )
        const resolvedLabelCol = resolveThemedColor(
            cf.labelColor,
            creativeFrontTheme.secondaryText,
            ["#777777", "#737373", "#94969E"]
        )
        const resolvedIdCol = resolveThemedColor(
            cf.idColor,
            creativeFrontTheme.secondaryText,
            ["#777777", "#737373", "#94969E"]
        )

        return (
            <div
                style={{
                    flex: 1,
                    borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                    backgroundColor: creativeFrontTheme.bg,
                    padding: "24px 20px 20px 20px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        bottom: "-60px",
                        right: "-60px",
                        width: "280px",
                        height: "280px",
                        borderRadius: "44%",
                        background: creativeFrontTheme.waveGradient,
                        transform: "rotate(18deg)",
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "20px",
                        zIndex: 5,
                    }}
                >
                    {logoSrc ? (
                        <img
                            src={logoSrc}
                            alt="Logo"
                            draggable={false}
                            style={{
                                width: "24px",
                                height: "24px",
                                objectFit: "contain",
                            }}
                        />
                    ) : (
                        <KSLogo
                            color={creativeFrontTheme.primaryText}
                            size={22}
                        />
                    )}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: "4px",
                        }}
                    >
                        <span
                            style={applyTypography(
                                cf.labelFont,
                                resolvedLabelCol,
                                {
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                }
                            )}
                        >
                            {cf.creativeLabel ?? "CREATIVE ID"}
                        </span>
                        <div
                            style={{
                                width: "14px",
                                height: "3px",
                                backgroundColor: accentColor,
                                borderRadius: "2px",
                                boxShadow: `0 0 5px ${accentColor}90`,
                            }}
                        />
                    </div>
                </div>

                <div
                    style={{
                        width: "100%",
                        height: "196px",
                        borderRadius: "14px",
                        overflow: "hidden",
                        backgroundColor: creativeFrontTheme.portraitBg,
                        boxShadow: `0 6px 16px -4px rgba(0,0,0,0.16), inset 0 0 0 1px ${creativeFrontTheme.portraitBorder}`,
                        marginBottom: "22px",
                        zIndex: 5,
                    }}
                >
                    {portraitSrc && (
                        <img
                            src={portraitSrc}
                            alt={fullName}
                            draggable={false}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center 22%",
                                display: "block",
                            }}
                        />
                    )}
                </div>

                <div style={{ position: "relative", zIndex: 5 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "9px",
                            marginBottom: "6px",
                        }}
                    >
                        <div
                            style={{
                                width: "3.5px",
                                height: "22px",
                                backgroundColor: accentColor,
                                borderRadius: "2px",
                                boxShadow: `0 0 6px ${accentColor}90`,
                                flexShrink: 0,
                            }}
                        />
                        <h1
                            style={{
                                margin: 0,
                                ...applyTypography(
                                    cf.nameFont,
                                    resolvedNameCol,
                                    {
                                        fontSize: 23,
                                        fontWeight: 700,
                                        letterSpacing: "-0.02em",
                                        lineHeight: 1.15,
                                    }
                                ),
                            }}
                        >
                            {fullName}
                        </h1>
                    </div>
                    <div
                        style={{
                            marginBottom: "4px",
                            ...applyTypography(cf.titleFont, resolvedTitleCol, {
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                paddingLeft: "12.5px",
                            }),
                        }}
                    >
                        {proTitle}
                    </div>
                    <div
                        style={applyTypography(
                            cf.specialtyFont,
                            resolvedSpecCol,
                            {
                                fontSize: 10.5,
                                fontWeight: 500,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                paddingLeft: "12.5px",
                            }
                        )}
                    >
                        {spec}
                    </div>
                </div>

                <div
                    style={{
                        marginTop: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "12px",
                        zIndex: 5,
                    }}
                >
                    <span
                        style={applyTypography(cf.idFont, resolvedIdCol, {
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                        })}
                    >
                        {idNum}
                    </span>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: creativeFrontTheme.arrowPillBg,
                        }}
                    >
                        <ArrowIcon
                            color={creativeFrontTheme.primaryText}
                            size={15}
                        />
                    </div>
                </div>
            </div>
        )
    }

    // ==========================================================================
    // RENDER CARD SURFACES (BACK)
    // ==========================================================================
    const renderBackFace = () => {
        // ------------------------------------------------------------------------
        // VARIANT 05: STUDENT ID BACK
        // ------------------------------------------------------------------------
        if (badgeVariant === "studentId") {
            const heading = sb.accessHeading ?? "CAMPUS ACCESS & LIBRARY"
            const accessNote =
                sb.studentAccessNote ??
                "Authorized for 24/7 Design Studio, Fabrication Lab, and University Library borrowing privileges."
            const supportText =
                sb.supportContact ?? "CAMPUS SECURITY · +1 (555) 890-1234"
            const webText = sb.institutionWebsite ?? "design.stanford.example"
            const validText =
                sb.validityText ?? "VALID FOR ACADEMIC YEAR 2026–2027"
            const showQr = sb.showStudentQr ?? true
            const qrSrc = resolveImageSrc(sb.studentQrImage)
            const stuId = sf.studentIdNumber ?? "STU-2026-849"
            const instName = sf.institutionName ?? "STANFORD DESIGN INSTITUTE"

            const noteCol = resolveThemedColor(
                sb.accessColor,
                studentBackTheme.secondaryText,
                ["#5A606B", "#9CA3AF"]
            )
            const contactCol = resolveThemedColor(
                sb.contactColor,
                studentBackTheme.primaryText,
                ["#15171C", "#F5F6F8"]
            )

            return (
                <div
                    style={{
                        flex: 1,
                        borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                        backgroundColor: studentBackTheme.bg,
                        padding: "24px 20px 18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {/* Top Heading */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "16px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "9.5px",
                                    fontWeight: 800,
                                    letterSpacing: "0.14em",
                                    color: studentBackTheme.mutedText,
                                    textTransform: "uppercase",
                                }}
                            >
                                {heading}
                            </span>
                            <div
                                style={{
                                    width: "12px",
                                    height: "2.5px",
                                    backgroundColor: accentColor,
                                    borderRadius: "1.5px",
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                color: isBackDark
                                    ? accentColor
                                    : studentBackTheme.primaryText,
                            }}
                        >
                            {stuId}
                        </span>
                    </div>

                    {/* Institution & Access Privileges */}
                    <div
                        style={{
                            padding: "12px",
                            borderRadius: "8px",
                            backgroundColor: studentBackTheme.cardBoxBg,
                            border: `1px solid ${studentBackTheme.cardBoxBorder}`,
                            marginBottom: "16px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                fontSize: "11px",
                                fontWeight: 800,
                                color: studentBackTheme.primaryText,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                marginBottom: "5px",
                            }}
                        >
                            {instName}
                        </div>
                        <p
                            style={{
                                margin: 0,
                                ...applyTypography(sb.accessFont, noteCol, {
                                    fontSize: 10.5,
                                    lineHeight: 1.45,
                                }),
                            }}
                        >
                            {accessNote}
                        </p>
                    </div>

                    {/* Campus Contacts */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            marginBottom: "auto",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "9px",
                            }}
                        >
                            <GlobeIcon
                                color={studentBackTheme.mutedText}
                                size={13}
                            />
                            <span
                                style={applyTypography(
                                    sb.contactFont,
                                    contactCol,
                                    { fontSize: 11, fontWeight: 600 }
                                )}
                            >
                                {webText}
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "9px",
                            }}
                        >
                            <MailIcon
                                color={studentBackTheme.mutedText}
                                size={13}
                            />
                            <span
                                style={applyTypography(
                                    sb.contactFont,
                                    contactCol,
                                    { fontSize: 10.5, fontWeight: 600 }
                                )}
                            >
                                {supportText}
                            </span>
                        </div>
                    </div>

                    {/* Library / Campus QR Verification */}
                    {showQr && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingTop: "14px",
                                borderTop: `1px solid ${studentBackTheme.divider}`,
                                marginTop: "12px",
                                zIndex: 5,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: "9.5px",
                                        fontWeight: 800,
                                        letterSpacing: "0.12em",
                                        color: studentBackTheme.primaryText,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    LIBRARY & GATE SCAN
                                </div>
                                <div
                                    style={{
                                        fontSize: "8px",
                                        fontWeight: 500,
                                        color: studentBackTheme.mutedText,
                                        maxWidth: "145px",
                                        marginTop: "2px",
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {validText}
                                </div>
                            </div>
                            <div
                                style={{
                                    width: "66px",
                                    height: "66px",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    border: `1px solid ${studentBackTheme.cardBoxBorder}`,
                                    flexShrink: 0,
                                }}
                            >
                                {qrSrc ? (
                                    <img
                                        src={qrSrc}
                                        alt="Student QR"
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <QRGraphic
                                        size={66}
                                        moduleColor={studentBackTheme.qrModule}
                                        bgColor={studentBackTheme.qrBg}
                                        accentColor={accentColor}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        // ------------------------------------------------------------------------
        // VARIANT 06: VISITOR PASS BACK
        // ------------------------------------------------------------------------
        if (badgeVariant === "visitorPass") {
            const secHeading = vb.securityHeading ?? "VISITOR SECURITY PROTOCOL"
            const guidelines =
                vb.visitorGuidelines ??
                "This pass must be worn visibly at all times while on premises. Escort required in restricted R&D zones."
            const wifiInfo = vb.visitorWifiInfo ?? "GUEST WI-FI: APEX-GUEST"
            const secContact =
                vb.securityContact ?? "RECEPTION & SECURITY · EXT. 4100"
            const checkOutText =
                vb.checkOutInstruction ?? "SCAN AT RECEPTION TO SIGN OUT"
            const showQr = vb.showVisitorQr ?? true
            const qrSrc = resolveImageSrc(vb.visitorQrImage)
            const passNum = vf.passNumber ?? "VIS-042"

            const guideCol = resolveThemedColor(
                vb.guidelinesColor,
                visitorBackTheme.secondaryText,
                ["#565B64", "#9EA4B0"]
            )
            const contactCol = resolveThemedColor(
                vb.contactColor,
                visitorBackTheme.primaryText,
                ["#141619", "#F4F5F7"]
            )

            return (
                <div
                    style={{
                        flex: 1,
                        borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                        backgroundColor: visitorBackTheme.bg,
                        padding: "22px 20px 18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {/* Top Protocol Header */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "14px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "9.5px",
                                    fontWeight: 800,
                                    letterSpacing: "0.14em",
                                    color: visitorBackTheme.mutedText,
                                    textTransform: "uppercase",
                                }}
                            >
                                {secHeading}
                            </span>
                            <div
                                style={{
                                    width: "12px",
                                    height: "2.5px",
                                    backgroundColor: accentColor,
                                    borderRadius: "1.5px",
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                letterSpacing: "0.1em",
                                color: isBackDark
                                    ? accentColor
                                    : visitorBackTheme.primaryText,
                            }}
                        >
                            {passNum}
                        </span>
                    </div>

                    {/* Dedicated Reception Sign-Out QR Box */}
                    {showQr && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "14px 12px",
                                borderRadius: "10px",
                                backgroundColor: visitorBackTheme.gridBg,
                                border: `1px dashed ${visitorBackTheme.gridBorder}`,
                                marginBottom: "14px",
                                zIndex: 5,
                            }}
                        >
                            <div
                                style={{
                                    width: "72px",
                                    height: "72px",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    border: `1px solid ${visitorBackTheme.gridBorder}`,
                                }}
                            >
                                {qrSrc ? (
                                    <img
                                        src={qrSrc}
                                        alt="Visitor QR"
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <QRGraphic
                                        size={72}
                                        moduleColor={visitorBackTheme.qrModule}
                                        bgColor={visitorBackTheme.qrBg}
                                        accentColor={accentColor}
                                    />
                                )}
                            </div>
                            <div
                                style={{
                                    fontSize: "8.5px",
                                    fontWeight: 800,
                                    letterSpacing: "0.14em",
                                    color: visitorBackTheme.primaryText,
                                    textTransform: "uppercase",
                                    marginTop: "8px",
                                }}
                            >
                                {checkOutText}
                            </div>
                        </div>
                    )}

                    {/* Security Regulations */}
                    <div
                        style={{
                            padding: "10px 12px",
                            borderRadius: "8px",
                            backgroundColor: visitorBackTheme.gridBg,
                            border: `1px solid ${visitorBackTheme.gridBorder}`,
                            marginBottom: "12px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                fontSize: "7.5px",
                                fontWeight: 800,
                                letterSpacing: "0.12em",
                                color: visitorBackTheme.mutedText,
                                textTransform: "uppercase",
                                marginBottom: "4px",
                            }}
                        >
                            FACILITY REGULATIONS
                        </div>
                        <p
                            style={{
                                margin: 0,
                                ...applyTypography(
                                    vb.guidelinesFont,
                                    guideCol,
                                    { fontSize: 10, lineHeight: 1.4 }
                                ),
                            }}
                        >
                            {guidelines}
                        </p>
                    </div>

                    {/* Guest Wi-Fi & Security Contact */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            marginBottom: "auto",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <GlobeIcon
                                color={visitorBackTheme.mutedText}
                                size={13}
                            />
                            <span
                                style={applyTypography(
                                    vb.contactFont,
                                    contactCol,
                                    {
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: "0.04em",
                                    }
                                )}
                            >
                                {wifiInfo}
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <MailIcon
                                color={visitorBackTheme.mutedText}
                                size={13}
                            />
                            <span
                                style={applyTypography(
                                    vb.contactFont,
                                    contactCol,
                                    {
                                        fontSize: 10,
                                        fontWeight: 700,
                                        letterSpacing: "0.04em",
                                    }
                                )}
                            >
                                {secContact}
                            </span>
                        </div>
                    </div>

                    {/* Bottom Security Footer */}
                    <div
                        style={{
                            borderTop: `1px solid ${visitorBackTheme.divider}`,
                            paddingTop: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            zIndex: 5,
                        }}
                    >
                        <span
                            style={{
                                fontSize: "7.5px",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                color: visitorBackTheme.mutedText,
                            }}
                        >
                            TEMPORARY VISITOR CREDENTIAL
                        </span>
                        <span
                            style={{
                                fontSize: "7.5px",
                                fontWeight: 800,
                                letterSpacing: "0.1em",
                                color: isBackDark
                                    ? accentColor
                                    : visitorBackTheme.primaryText,
                            }}
                        >
                            VERIFIED
                        </span>
                    </div>
                </div>
            )
        }

        // ------------------------------------------------------------------------
        // VARIANT 02: EVENT PASS BACK
        // ------------------------------------------------------------------------
        if (badgeVariant === "eventPass") {
            const showSchedule =
                eb.showEventSchedule ?? props.showEventSchedule ?? true
            const showQr = eb.showEventQr ?? props.showEventQr ?? true
            const qrSrc = resolveImageSrc(eb.eventQrImage ?? props.eventQrImage)

            const venueCol = resolveThemedColor(
                eb.venueColor,
                eventBackTheme.primaryText,
                ["#FFFFFF", "#141517"]
            )
            const schedCol = resolveThemedColor(
                eb.scheduleColor,
                eventBackTheme.primaryText,
                ["#E4E6EC", "#141517"]
            )

            return (
                <div
                    style={{
                        flex: 1,
                        borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                        backgroundColor: eventBackTheme.bg,
                        padding: "22px 20px 18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "16px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={applyTypography(
                                    eb.headingFont,
                                    eventBackTheme.secondaryText,
                                    {
                                        fontSize: 10,
                                        fontWeight: 800,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                    }
                                )}
                            >
                                {eb.protocolHeading ?? "ACCESS PROTOCOL"}
                            </span>
                            <div
                                style={{
                                    width: "12px",
                                    height: "2.5px",
                                    backgroundColor: accentColor,
                                    borderRadius: "1.5px",
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                color: eventBackTheme.accentTag,
                            }}
                        >
                            {ef.passId ?? props.passId ?? "EV-026-001"}
                        </span>
                    </div>

                    {showQr && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "16px 12px",
                                borderRadius: "10px",
                                backgroundColor: eventBackTheme.boxBg,
                                border: `1px dashed ${eventBackTheme.dashedBorder}`,
                                marginBottom: "16px",
                                zIndex: 5,
                            }}
                        >
                            <div
                                style={{
                                    width: "74px",
                                    height: "74px",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    boxShadow: isBackDark
                                        ? "0 4px 16px rgba(0,0,0,0.6)"
                                        : "0 4px 12px rgba(0,0,0,0.08)",
                                    border: `1px solid ${eventBackTheme.boxBorder}`,
                                }}
                            >
                                {qrSrc ? (
                                    <img
                                        src={qrSrc}
                                        alt="QR Code"
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <QRGraphic
                                        size={74}
                                        moduleColor={eventBackTheme.qrModule}
                                        bgColor={eventBackTheme.qrBg}
                                        accentColor={accentColor}
                                    />
                                )}
                            </div>
                            <div
                                style={applyTypography(
                                    eb.instructionFont,
                                    eventBackTheme.primaryText,
                                    {
                                        fontSize: 9,
                                        fontWeight: 800,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                        marginTop: "8px",
                                    }
                                )}
                            >
                                {eb.scanInstruction ??
                                    "SCAN FOR VENUE ADMISSION"}
                            </div>
                        </div>
                    )}

                    <div
                        style={{
                            marginBottom: showSchedule ? "12px" : "auto",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={applyTypography(eb.venueFont, venueCol, {
                                fontSize: 12,
                                fontWeight: 800,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                            })}
                        >
                            {eb.eventVenue ??
                                props.eventVenue ??
                                "MOSCONE CONVENTION CENTER"}
                        </div>
                        <div
                            style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                color: eventBackTheme.secondaryText,
                                marginTop: "3px",
                            }}
                        >
                            {ef.eventLocation ??
                                props.eventLocation ??
                                "SAN FRANCISCO, CA"}{" "}
                            ·{" "}
                            {ef.eventDate ??
                                props.eventDate ??
                                "14–15 NOV 2026"}
                        </div>
                    </div>

                    {showSchedule && (
                        <div
                            style={{
                                padding: "10px 12px",
                                borderRadius: "8px",
                                backgroundColor: eventBackTheme.boxBg,
                                border: `1px solid ${eventBackTheme.boxBorder}`,
                                marginBottom: "auto",
                                zIndex: 5,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "8.5px",
                                    fontWeight: 800,
                                    letterSpacing: "0.12em",
                                    color: eventBackTheme.mutedText,
                                    textTransform: "uppercase",
                                    marginBottom: "6px",
                                }}
                            >
                                SCHEDULE HIGHLIGHTS
                            </div>
                            <div
                                style={{
                                    marginBottom: "4px",
                                    ...applyTypography(
                                        eb.scheduleFont,
                                        schedCol,
                                        {
                                            fontSize: 10,
                                            fontWeight: 600,
                                            lineHeight: 1.3,
                                        }
                                    ),
                                }}
                            >
                                {eb.scheduleDay1 ??
                                    props.scheduleDay1 ??
                                    "DAY 01 — OPENING KEYNOTE & TECH"}
                            </div>
                            <div
                                style={applyTypography(
                                    eb.scheduleFont,
                                    schedCol,
                                    {
                                        fontSize: 10,
                                        fontWeight: 600,
                                        lineHeight: 1.3,
                                    }
                                )}
                            >
                                {eb.scheduleDay2 ??
                                    props.scheduleDay2 ??
                                    "DAY 02 — DESIGN SYSTEMS LAB"}
                            </div>
                        </div>
                    )}

                    <div
                        style={{
                            borderTop: `1px solid ${eventBackTheme.divider}`,
                            paddingTop: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            zIndex: 5,
                        }}
                    >
                        <span
                            style={{
                                fontSize: "8px",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                color: eventBackTheme.mutedText,
                            }}
                        >
                            NON-TRANSFERABLE CREDENTIAL
                        </span>
                        <span
                            style={{
                                fontSize: "8px",
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                color: eventBackTheme.accentTag,
                            }}
                        >
                            AUTHORIZED
                        </span>
                    </div>
                </div>
            )
        }

        // ------------------------------------------------------------------------
        // VARIANT 03: TEAM ID BACK
        // ------------------------------------------------------------------------
        if (badgeVariant === "teamId") {
            const showQr = tb.showTeamQr ?? props.showTeamQr ?? true
            const qrSrc = resolveImageSrc(tb.teamQrImage ?? props.teamQrImage)

            const descCol = resolveThemedColor(
                tb.descColor,
                teamBackTheme.secondaryText,
                ["#9CA1AB", "#555860"]
            )
            const contactCol = resolveThemedColor(
                tb.contactColor,
                teamBackTheme.primaryText,
                ["#ECEEF2", "#171717"]
            )

            return (
                <div
                    style={{
                        flex: 1,
                        borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                        backgroundColor: teamBackTheme.bg,
                        padding: "24px 20px 18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "16px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={applyTypography(
                                    tb.headingFont,
                                    teamBackTheme.mutedText,
                                    {
                                        fontSize: 9.5,
                                        fontWeight: 800,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                    }
                                )}
                            >
                                {tb.directoryHeading ?? "INTERNAL DIRECTORY"}
                            </span>
                            <div
                                style={{
                                    width: "12px",
                                    height: "2.5px",
                                    backgroundColor: accentColor,
                                    borderRadius: "1.5px",
                                }}
                            />
                        </div>
                        <span
                            style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                color: isBackDark
                                    ? accentColor
                                    : teamBackTheme.primaryText,
                            }}
                        >
                            {tf.employeeId ?? props.employeeId ?? "TEAM-024"}
                        </span>
                    </div>

                    <div style={{ marginBottom: "16px", zIndex: 5 }}>
                        <div
                            style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: teamBackTheme.primaryText,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                marginBottom: "4px",
                            }}
                        >
                            {tf.companyName ?? props.companyName ?? "NORTHSTAR"}
                        </div>
                        <p
                            style={{
                                margin: 0,
                                ...applyTypography(tb.descFont, descCol, {
                                    fontSize: 11,
                                    lineHeight: 1.45,
                                }),
                            }}
                        >
                            {tb.teamDescription ??
                                props.teamDescription ??
                                "Building mission-critical digital systems and intuitive interfaces for next-generation platforms."}
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            marginBottom: "auto",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "9px",
                            }}
                        >
                            <GlobeIcon
                                color={teamBackTheme.mutedText}
                                size={13}
                            />
                            <span
                                style={applyTypography(
                                    tb.contactFont,
                                    contactCol,
                                    { fontSize: 11.5, fontWeight: 500 }
                                )}
                            >
                                {tb.companyWebsite ??
                                    props.companyWebsite ??
                                    "northstar.systems"}
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "9px",
                            }}
                        >
                            <MailIcon
                                color={teamBackTheme.mutedText}
                                size={13}
                            />
                            <span
                                style={applyTypography(
                                    tb.contactFont,
                                    contactCol,
                                    { fontSize: 11.5, fontWeight: 500 }
                                )}
                            >
                                {tb.workEmail ??
                                    props.workEmail ??
                                    "jordan@northstar.systems"}
                            </span>
                        </div>
                    </div>

                    {showQr && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingTop: "14px",
                                borderTop: `1px solid ${teamBackTheme.divider}`,
                                zIndex: 5,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: "9.5px",
                                        fontWeight: 800,
                                        letterSpacing: "0.12em",
                                        color: teamBackTheme.primaryText,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    OFFICIAL CREDENTIAL
                                </div>
                                <div
                                    style={{
                                        fontSize: "8px",
                                        fontWeight: 500,
                                        color: teamBackTheme.mutedText,
                                        maxWidth: "140px",
                                        marginTop: "2px",
                                    }}
                                >
                                    Scan to verify status in corporate registry
                                </div>
                            </div>
                            <div
                                style={{
                                    width: "66px",
                                    height: "66px",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    border: `1px solid ${teamBackTheme.divider}`,
                                    flexShrink: 0,
                                }}
                            >
                                {qrSrc ? (
                                    <img
                                        src={qrSrc}
                                        alt="QR Code"
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <QRGraphic
                                        size={66}
                                        moduleColor={teamBackTheme.qrModule}
                                        bgColor={teamBackTheme.qrBg}
                                        accentColor={accentColor}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        // ------------------------------------------------------------------------
        // VARIANT 04: MEMBER PASS BACK
        // ------------------------------------------------------------------------
        if (badgeVariant === "memberPass") {
            const showQr = mb.showMemberQr ?? props.showMemberQr ?? true
            const qrSrc = resolveImageSrc(
                mb.memberQrImage ?? props.memberQrImage
            )
            const websiteText =
                mb.memberWebsite ??
                props.memberWebsite ??
                "thefoundersclub.example"

            const benefitCol = resolveThemedColor(
                mb.benefitColor,
                memberBackPalette.primaryText,
                ["#171717", "#F6F3EC"]
            )

            return (
                <div
                    style={{
                        flex: 1,
                        borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                        backgroundColor: memberBackPalette.bg,
                        padding: "24px 20px 20px 20px",
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: "10px",
                            border: `0.75px solid ${memberBackPalette.border}`,
                            borderRadius: `${Math.max(cardBorderRadius - 12, 6)}px`,
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "16px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={applyTypography(
                                    mb.headingFont,
                                    memberBackPalette.accent,
                                    {
                                        fontSize: 9.5,
                                        fontWeight: 800,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                    }
                                )}
                            >
                                {mb.memberPrivilegesHeading ??
                                    "MEMBER PRIVILEGES"}
                            </span>
                            <div
                                style={{
                                    width: "10px",
                                    height: "2px",
                                    backgroundColor: memberBackPalette.accent,
                                }}
                            />
                        </div>
                        <div
                            style={{
                                fontSize: "8px",
                                fontWeight: 700,
                                letterSpacing: "0.12em",
                                color: memberBackPalette.accent,
                                textTransform: "uppercase",
                                padding: "2px 7px",
                                borderRadius: "3px",
                                border: `0.75px solid ${memberBackPalette.border}`,
                                backgroundColor: memberBackPalette.badgeBg,
                            }}
                        >
                            {mb.memberStatus ?? "ACTIVE"}
                        </div>
                    </div>

                    <div style={{ marginBottom: "14px", zIndex: 5 }}>
                        <div
                            style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: memberBackPalette.primaryText,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                            }}
                        >
                            {mf.clubBrandName ??
                                props.clubBrandName ??
                                "THE FOUNDERS CLUB"}
                        </div>
                        <div
                            style={{
                                fontSize: "9px",
                                fontWeight: 700,
                                color: memberBackTierStyle.accent,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                marginTop: "2px",
                            }}
                        >
                            {memberBackTierStyle.label}
                        </div>
                    </div>

                    <div
                        style={{
                            padding: "10px 12px",
                            borderRadius: "6px",
                            backgroundColor: memberBackPalette.badgeBg,
                            border: `0.75px solid ${memberBackPalette.border}`,
                            marginBottom: "14px",
                            zIndex: 5,
                        }}
                    >
                        <div
                            style={{
                                fontSize: "7.5px",
                                fontWeight: 700,
                                letterSpacing: "0.14em",
                                color: memberBackPalette.secondaryText,
                                textTransform: "uppercase",
                                marginBottom: "4px",
                            }}
                        >
                            GRANTED PRIVILEGE
                        </div>
                        <div
                            style={applyTypography(mb.benefitFont, benefitCol, {
                                fontSize: 10,
                                fontWeight: 600,
                                lineHeight: 1.4,
                            })}
                        >
                            {mb.memberBenefit ??
                                "ACCESS TO THE MEMBERS' LOUNGE & CONCIERGE"}
                        </div>
                    </div>

                    {websiteText && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "auto",
                                zIndex: 5,
                            }}
                        >
                            <GlobeIcon
                                color={memberBackPalette.accent}
                                size={12}
                            />
                            <span
                                style={{
                                    fontSize: "10.5px",
                                    color: memberBackPalette.secondaryText,
                                    fontWeight: 500,
                                    letterSpacing: "0.04em",
                                }}
                            >
                                {websiteText}
                            </span>
                        </div>
                    )}

                    {showQr && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingTop: "14px",
                                borderTop: `0.75px solid ${memberBackPalette.border}`,
                                marginTop: "auto",
                                zIndex: 5,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: "9px",
                                        fontWeight: 800,
                                        letterSpacing: "0.12em",
                                        color: memberBackPalette.primaryText,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    MEMBER PASS VERIFICATION
                                </div>
                                <div
                                    style={{
                                        fontSize: "7.5px",
                                        fontWeight: 500,
                                        color: memberBackPalette.secondaryText,
                                        maxWidth: "140px",
                                        marginTop: "2px",
                                    }}
                                >
                                    Scan to authenticate active privileges
                                </div>
                            </div>
                            <div
                                style={{
                                    width: "66px",
                                    height: "66px",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    border: `1px solid ${memberBackPalette.accent}66`,
                                    flexShrink: 0,
                                }}
                            >
                                {qrSrc ? (
                                    <img
                                        src={qrSrc}
                                        alt="QR Code"
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <QRGraphic
                                        size={66}
                                        moduleColor={memberBackPalette.qrModule}
                                        bgColor={memberBackPalette.qrBg}
                                        accentColor={memberBackPalette.accent}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )
        }

        // ------------------------------------------------------------------------
        // DEFAULT VARIANT 01: CREATIVE ID BACK
        // ------------------------------------------------------------------------
        const showSocials = cb.showSocials ?? props.showSocials ?? true
        const showEmail = cb.showEmail ?? props.showEmail ?? true
        const showQr = cb.showQrCode ?? props.showQrCode ?? true
        const showClose = cb.showClosingText ?? props.showClosingText ?? true
        const qrSrc = resolveImageSrc(cb.qrImage ?? props.qrImage)

        const resolvedHeadingCol = resolveThemedColor(
            cb.headingColor,
            creativeBackTheme.secondaryText,
            ["#B5B5B5", "#737373", "#94969E"]
        )
        const resolvedBioCol = resolveThemedColor(
            cb.bioColor,
            creativeBackTheme.primaryText,
            ["#F4F3EF", "#171717"]
        )
        const resolvedPortCol = resolveThemedColor(
            cb.portfolioColor,
            creativeBackTheme.primaryText,
            ["#F4F3EF", "#171717"]
        )
        const resolvedSocCol = resolveThemedColor(
            cb.socialColor,
            creativeBackTheme.socialText,
            ["#B5B5B5", "#4A4A4A"]
        )
        const resolvedCloseCol = resolveThemedColor(
            cb.closingColor,
            creativeBackTheme.mutedText,
            ["#B5B5B5", "#686868", "#7E8088"]
        )

        return (
            <div
                style={{
                    flex: 1,
                    borderRadius: `${Math.max(cardBorderRadius - 6, 8)}px`,
                    backgroundColor: creativeBackTheme.bg,
                    padding: "26px 22px 20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        bottom: "-40px",
                        right: "-40px",
                        width: "260px",
                        height: "260px",
                        borderRadius: "45%",
                        background: creativeBackTheme.waveGradient,
                        transform: "rotate(30deg)",
                        pointerEvents: "none",
                    }}
                />

                <div style={{ marginBottom: "20px", zIndex: 5 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px",
                        }}
                    >
                        <span
                            style={applyTypography(
                                cb.headingFont,
                                resolvedHeadingCol,
                                {
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                }
                            )}
                        >
                            {cb.aboutHeading ?? "ABOUT"}
                        </span>
                        <div
                            style={{
                                width: "12px",
                                height: "2.5px",
                                backgroundColor: accentColor,
                                borderRadius: "1.5px",
                            }}
                        />
                    </div>
                    <p
                        style={{
                            margin: 0,
                            ...applyTypography(cb.bioFont, resolvedBioCol, {
                                fontSize: 12.5,
                                lineHeight: 1.5,
                                maxWidth: "240px",
                            }),
                        }}
                    >
                        {cb.biography ??
                            props.biography ??
                            "Designing digital experiences that feel simple, useful, and memorable."}
                    </p>
                </div>

                <div style={{ marginBottom: "20px", zIndex: 5 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "7px",
                        }}
                    >
                        <span
                            style={applyTypography(
                                cb.headingFont,
                                resolvedHeadingCol,
                                {
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                }
                            )}
                        >
                            {cb.portfolioLabel ?? "PORTFOLIO"}
                        </span>
                        <div
                            style={{
                                width: "12px",
                                height: "2.5px",
                                backgroundColor: accentColor,
                                borderRadius: "1.5px",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <span
                            style={applyTypography(
                                cb.portfolioFont,
                                resolvedPortCol,
                                { fontSize: 13, fontWeight: 500 }
                            )}
                        >
                            {cb.portfolioUrl ??
                                props.portfolioUrl ??
                                "kaifshaikh.com"}
                        </span>
                        <ExternalArrow color={resolvedHeadingCol} size={14} />
                    </div>
                </div>

                {showSocials && (
                    <div style={{ marginBottom: "auto", zIndex: 5 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "9px",
                            }}
                        >
                            <span
                                style={applyTypography(
                                    cb.headingFont,
                                    resolvedHeadingCol,
                                    {
                                        fontSize: 9.5,
                                        fontWeight: 700,
                                        letterSpacing: "0.14em",
                                        textTransform: "uppercase",
                                    }
                                )}
                            >
                                SOCIAL
                            </span>
                            <div
                                style={{
                                    width: "12px",
                                    height: "2.5px",
                                    backgroundColor: accentColor,
                                    borderRadius: "1.5px",
                                }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "7px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "9px",
                                }}
                            >
                                <LinkedInIcon
                                    color={resolvedSocCol}
                                    size={13}
                                />
                                <span
                                    style={applyTypography(
                                        cb.socialFont,
                                        resolvedSocCol,
                                        { fontSize: 12 }
                                    )}
                                >
                                    {cb.linkedInText ??
                                        props.linkedInText ??
                                        "LinkedIn"}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "9px",
                                }}
                            >
                                <InstagramIcon
                                    color={resolvedSocCol}
                                    size={13}
                                />
                                <span
                                    style={applyTypography(
                                        cb.socialFont,
                                        resolvedSocCol,
                                        { fontSize: 12 }
                                    )}
                                >
                                    {cb.instagramText ??
                                        props.instagramText ??
                                        "Instagram"}
                                </span>
                            </div>
                            {showEmail && (
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "9px",
                                    }}
                                >
                                    <MailIcon
                                        color={resolvedSocCol}
                                        size={13}
                                    />
                                    <span
                                        style={applyTypography(
                                            cb.socialFont,
                                            resolvedSocCol,
                                            { fontSize: 12 }
                                        )}
                                    >
                                        {cb.emailAddress ??
                                            props.emailAddress ??
                                            "hello@kaifshaikh.com"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        paddingTop: "16px",
                        zIndex: 5,
                    }}
                >
                    {showQr && (
                        <div
                            style={{
                                width: "68px",
                                height: "68px",
                                borderRadius: "6px",
                                overflow: "hidden",
                                border: `1px solid ${creativeBackTheme.qrBorder}`,
                                boxShadow: isBackDark
                                    ? "0 4px 12px rgba(0,0,0,0.45)"
                                    : "0 4px 10px rgba(0,0,0,0.06)",
                                flexShrink: 0,
                            }}
                        >
                            {qrSrc ? (
                                <img
                                    src={qrSrc}
                                    alt="QR Code"
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <QRGraphic
                                    size={68}
                                    moduleColor={creativeBackTheme.qrModule}
                                    bgColor={creativeBackTheme.qrBg}
                                    accentColor={accentColor}
                                />
                            )}
                        </div>
                    )}
                    {showClose && (
                        <div
                            style={{
                                whiteSpace: "pre-line",
                                ...applyTypography(
                                    cb.closingFont,
                                    resolvedCloseCol,
                                    {
                                        fontSize: 9,
                                        fontWeight: 700,
                                        lineHeight: 1.35,
                                        letterSpacing: "0.12em",
                                        textAlign: "right",
                                        textTransform: "uppercase",
                                    }
                                ),
                            }}
                        >
                            {cb.closingStatement ??
                                props.closingStatement ??
                                "LET'S CREATE\nSOMETHING\nMEANINGFUL."}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Common Card Enclosure (Adapts acrylic rim reflection per face for Light, Dark, and Dual Tone)
    const renderCardShell = (
        content: React.ReactNode,
        isDarkSurface: boolean
    ) => {
        const isLightShell = !isDarkSurface
        return (
            <div
                style={{
                    position: "relative",
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    borderRadius: `${cardBorderRadius}px`,
                    padding: `${enclosurePadding}px`,
                    backgroundColor: isLightShell
                        ? "rgba(255, 255, 255, 0.38)"
                        : "rgba(25, 26, 30, 0.48)",
                    boxShadow: `
            0 32px 64px -16px rgba(0, 0, 0, ${0.35 * shadowIntensity}),
            0 12px 24px -8px rgba(0, 0, 0, ${0.18 * shadowIntensity}),
            inset 0 1px 1.5px rgba(255, 255, 255, ${isLightShell ? 0.95 * enclosureSpecular : 0.42 * enclosureSpecular}),
            inset 0 -1.5px 2px rgba(0, 0, 0, ${isLightShell ? 0.25 : 0.8}),
            inset 1px 0 1.5px rgba(255, 255, 255, ${isLightShell ? 0.5 * enclosureSpecular : 0.22 * enclosureSpecular}),
            inset -1px 0 1.5px rgba(0, 0, 0, 0.2)
          `,
                    border: `1px solid rgba(255, 255, 255, ${isLightShell ? 0.58 * enclosureSpecular : 0.2 * enclosureSpecular})`,
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                }}
            >
                {/* Acrylic Punched Slot at top center */}
                <div
                    style={{
                        position: "absolute",
                        top: "6px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "42px",
                        height: "8px",
                        borderRadius: "5px",
                        background: isLightShell
                            ? "rgba(30, 32, 36, 0.25)"
                            : "rgba(0, 0, 0, 0.65)",
                        boxShadow: `inset 0 1px 2px rgba(0, 0, 0, 0.7), 0 1px 0.5px rgba(255, 255, 255, 0.4)`,
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                />
                {content}

                {/* Dynamic Specular Sheen Layer (Only active in interactive mode; disabled in static renderer) */}
                {!isStatic && enableTilt && glareIntensity > 0 && (
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: `${cardBorderRadius}px`,
                            background: useTransform(
                                [glareX, glareY],
                                ([gx, gy]) =>
                                    `radial-gradient(circle 260px at ${gx}% ${gy}%, rgba(255,255,255,${
                                        (isDarkSurface ? 0.24 : 0.34) *
                                        glareIntensity
                                    }) 0%, rgba(255,255,255,0) 80%)`
                            ),
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    />
                )}
            </div>
        )
    }

    // ==========================================================================
    // 3D ACRYLIC EDGE EXTENDED SLICES (Supports Light, Dark, and Dual Tone)
    // ==========================================================================
    const renderEdgeSlices = () => {
        const sliceCount = Math.max(
            2,
            Math.min(10, Math.round(cardThickness * 1.5))
        )
        const slices = []
        for (let i = 0; i < sliceCount; i++) {
            const zOffset =
                -halfThickness + (i + 0.5) * (cardThickness / sliceCount)
            const isSliceDark = zOffset >= 0 ? isFrontDark : isBackDark
            slices.push(
                <div
                    key={`edge-slice-${i}`}
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: `${cardBorderRadius}px`,
                        border: `1px solid rgba(255, 255, 255, ${(isSliceDark ? 0.14 : 0.22) * enclosureSpecular})`,
                        backgroundColor: isSliceDark
                            ? "rgba(18, 20, 24, 0.18)"
                            : "rgba(220, 218, 212, 0.16)",
                        boxShadow: `inset 0 0 2px rgba(0, 0, 0, 0.25)`,
                        transform: `translateZ(${zOffset}px)`,
                        pointerEvents: "none",
                    }}
                />
            )
        }
        return slices
    }

    // ==========================================================================
    // LANYARD STRAP RENDERER (Supports lengths up to 500px without clipping)
    // ==========================================================================
    const renderLanyardStrap = () => (
        <div
            style={{
                position: "absolute",
                top: `-${strapLength + 36}px`,
                left: "50%",
                transform: "translateX(-50%)",
                width: `${strapWidth}px`,
                height: `${strapLength}px`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 1,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "calc(100% - 14px)",
                    backgroundImage: `url("${wovenFabricPattern}")`,
                    backgroundRepeat: "repeat",
                    backgroundColor: "#161719",
                    borderRadius: "4px 4px 0 0",
                    boxShadow: `inset 2px 0 3px rgba(0,0,0,0.7), inset -2px 0 3px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.3)`,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingBottom: "16px",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(255,255,255,0.04) 40%, rgba(0,0,0,0.65) 100%)",
                    }}
                />

                {strapBranding && (
                    <div
                        style={{
                            position: "relative",
                            zIndex: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "5px",
                        }}
                    >
                        <div
                            style={{
                                width: "14px",
                                height: "2.5px",
                                backgroundColor:
                                    badgeVariant === "memberPass"
                                        ? memberFrontPalette.accent
                                        : accentColor,
                                borderRadius: "1.5px",
                                boxShadow: `0 0 6px ${badgeVariant === "memberPass" ? memberFrontPalette.accent : accentColor}80`,
                            }}
                        />
                        <span
                            style={{
                                fontSize: "8px",
                                fontWeight: 800,
                                letterSpacing: "0.14em",
                                color: "rgba(255,255,255,0.65)",
                                textTransform: "uppercase",
                                textAlign: "center",
                                maxWidth: "48px",
                                lineHeight: 1.2,
                                textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                                ...crispTextStyle,
                            }}
                        >
                            {strapCustomText}
                        </span>
                    </div>
                )}
            </div>

            {/* Upper Strap Clamp */}
            <div
                style={{
                    width: `${strapWidth + 6}px`,
                    height: "14px",
                    background: metalGradients.clamp,
                    borderRadius: "3px",
                    boxShadow: `0 2px 5px ${metalGradients.shadow}, inset 0 1px 0 ${metalGradients.highlight}`,
                    zIndex: 4,
                }}
            />
        </div>
    )

    // ==========================================================================
    // SWIVEL & CLASP HARDWARE
    // ==========================================================================
    const renderHardware = (staticMode = false) => {
        const badgeText =
            badgeVariant === "creativeId"
                ? "KS"
                : badgeVariant === "eventPass"
                  ? "PASS"
                  : badgeVariant === "teamId"
                    ? "ID"
                    : badgeVariant === "memberPass"
                      ? "CLUB"
                      : badgeVariant === "studentId"
                        ? "STU"
                        : "VIS"

        const frontClaspFace = (
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: metalGradients.clamp,
                    borderRadius: "4px",
                    border: `1px solid ${metalGradients.highlight}`,
                    boxShadow: `0 3px 8px ${metalGradients.shadow}, inset 0 1px 1px ${metalGradients.highlight}, inset 0 -2px 3px rgba(0,0,0,0.6)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backfaceVisibility: staticMode ? undefined : "hidden",
                    WebkitBackfaceVisibility: staticMode ? undefined : "hidden",
                }}
            >
                <span
                    style={{
                        fontSize: "8.5px",
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        color: "rgba(255,255,255,0.55)",
                        textShadow: "0 -1px 1px rgba(0,0,0,0.9)",
                        ...crispTextStyle,
                    }}
                >
                    {badgeText}
                </span>
            </div>
        )

        const backClaspFace = (
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: metalGradients.clamp,
                    borderRadius: "4px",
                    border: `1px solid ${metalGradients.highlight}`,
                    boxShadow: `0 3px 8px ${metalGradients.shadow}, inset 0 1px 1px ${metalGradients.highlight}, inset 0 -2px 3px rgba(0,0,0,0.6)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: staticMode ? undefined : "rotateY(180deg)",
                    backfaceVisibility: staticMode ? undefined : "hidden",
                    WebkitBackfaceVisibility: staticMode ? undefined : "hidden",
                }}
            >
                <div
                    style={{
                        width: "20px",
                        height: "11px",
                        borderRadius: "2px",
                        background:
                            "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.08) 100%)",
                        boxShadow:
                            "inset 0 1px 2px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                    }}
                >
                    <div
                        style={{
                            width: "2px",
                            height: "5px",
                            backgroundColor: "rgba(255,255,255,0.25)",
                            borderRadius: "1px",
                        }}
                    />
                    <div
                        style={{
                            width: "2px",
                            height: "5px",
                            backgroundColor: "rgba(255,255,255,0.25)",
                            borderRadius: "1px",
                        }}
                    />
                </div>
            </div>
        )

        return (
            <div
                style={{
                    position: "absolute",
                    top: "-36px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "48px",
                    height: "46px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    zIndex: 15,
                    pointerEvents: "none",
                    transformStyle: staticMode ? undefined : "preserve-3d",
                }}
            >
                <div
                    style={{
                        width: "12px",
                        height: "5px",
                        background: metalGradients.loop,
                        borderRadius: "2px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.5)",
                        zIndex: 2,
                    }}
                />

                <div
                    style={{
                        position: "relative",
                        width: "38px",
                        height: "25px",
                        transformStyle: staticMode ? undefined : "preserve-3d",
                        marginTop: "-1px",
                    }}
                >
                    {staticMode ? (
                        internalFlipped ? (
                            backClaspFace
                        ) : (
                            frontClaspFace
                        )
                    ) : (
                        <>
                            {frontClaspFace}
                            {backClaspFace}
                        </>
                    )}
                </div>

                <div
                    style={{
                        width: "24px",
                        height: `${17 + Math.max(0, cardThickness - 4) * 0.4}px`,
                        border: `3px solid #44474D`,
                        borderBottomColor: "#6B7077",
                        borderRadius: "6px",
                        marginTop: "-3px",
                        boxShadow: `0 2px 5px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)`,
                    }}
                />
            </div>
        )
    }

    // ==========================================================================
    // 1. DUAL-SIDE CANVAS EDITING MODE
    // ==========================================================================
    if (showBothSides) {
        return (
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "48px",
                    padding: "50px 20px",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
                    transform:
                        cardScale !== 1.0 ? `scale(${cardScale})` : undefined,
                    transformOrigin: "center center",
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "#888888",
                            marginBottom: "14px",
                            textTransform: "uppercase",
                        }}
                    >
                        FRONT FACE ({isFrontDark ? "DARK MODE" : "LIGHT MODE"})
                    </div>
                    {renderCardShell(renderFrontFace(), isFrontDark)}
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            color: "#888888",
                            marginBottom: "14px",
                            textTransform: "uppercase",
                        }}
                    >
                        BACK FACE ({isBackDark ? "DARK MODE" : "LIGHT MODE"})
                    </div>
                    {renderCardShell(renderBackFace(), isBackDark)}
                </div>
            </div>
        )
    }

    // ==========================================================================
    // 2. STATIC RENDERER FALLBACK (useIsStaticRenderer() === true)
    // ==========================================================================
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    minHeight: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "50px 20px",
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
                    userSelect: "none",
                    boxSizing: "border-box",
                    overflow: "visible",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: `${cardWidth}px`,
                        height: `${cardHeight}px`,
                        borderRadius: `${cardBorderRadius}px`,
                        transform:
                            cardScale !== 1.0
                                ? `scale(${cardScale})`
                                : undefined,
                        overflow: "visible",
                    }}
                >
                    {showLanyard && renderLanyardStrap()}
                    {showLanyard && renderHardware(true)}

                    <div
                        style={{
                            position: "absolute",
                            bottom: "-32px",
                            left: "8%",
                            width: "84%",
                            height: "40px",
                            borderRadius: "50%",
                            background: `radial-gradient(ellipse at center, rgba(14, 15, 18, ${0.45 * shadowIntensity}) 0%, rgba(14, 15, 18, 0) 72%)`,
                            filter: "blur(14px)",
                            pointerEvents: "none",
                            zIndex: 0,
                        }}
                    />

                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            zIndex: 5,
                        }}
                    >
                        {internalFlipped
                            ? renderCardShell(renderBackFace(), isBackDark)
                            : renderCardShell(renderFrontFace(), isFrontDark)}
                    </div>
                </div>
            </div>
        )
    }

    // ==========================================================================
    // 3. INTERACTIVE 3D BADGE (useIsStaticRenderer() === false)
    // ==========================================================================
    return (
        <div
            style={{
                width: "100%",
                minHeight: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "50px 20px",
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
                userSelect: "none",
                boxSizing: "border-box",
                overflow: "visible",
            }}
        >
            <div
                ref={containerRef}
                onPointerDown={handleCardPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handleCardPointerUp}
                onPointerCancel={handleCardPointerCancel}
                onPointerLeave={handlePointerLeave}
                onClick={handleCardClick}
                style={{
                    position: "relative",
                    width: `${cardWidth}px`,
                    height: `${cardHeight}px`,
                    borderRadius: `${cardBorderRadius}px`,
                    perspective: `${perspective}px`,
                    transformStyle: "preserve-3d",
                    transform:
                        cardScale !== 1.0 ? `scale(${cardScale})` : undefined,
                    transition: "transform 0.2s ease-out",
                    cursor: enableFlip ? "pointer" : "default",
                    touchAction: "manipulation",
                    WebkitTapHighlightColor: "transparent",
                    overflow: "visible",
                }}
            >
                {/* Flat Z=0 Hit Plane: Guarantees clicks on edges/corners tilted into negative Z (Z < 0) always hit containerRef */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: `${cardBorderRadius}px`,
                        backgroundColor: "transparent",
                    }}
                />

                <motion.div
                    style={{
                        rotateX: tiltRotateX,
                        rotateY: tiltRotateY,
                        transformStyle: "preserve-3d",
                        transformOrigin: "50% 40px",
                        position: "relative",
                        width: `${cardWidth}px`,
                        height: `${cardHeight}px`,
                        overflow: "visible",
                    }}
                >
                    {showLanyard && renderLanyardStrap()}

                    <motion.div
                        animate={{ rotateY: internalFlipped ? 180 : 0 }}
                        transition={{
                            duration: flipDuration,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {showLanyard && renderHardware(false)}
                        {renderEdgeSlices()}

                        <div
                            style={{
                                position: "absolute",
                                bottom: "-32px",
                                left: "8%",
                                width: "84%",
                                height: "40px",
                                borderRadius: "50%",
                                background: `radial-gradient(ellipse at center, rgba(14, 15, 18, ${0.45 * shadowIntensity}) 0%, rgba(14, 15, 18, 0) 72%)`,
                                filter: "blur(14px)",
                                transform: `translateZ(-${30 + halfThickness}px)`,
                                pointerEvents: "none",
                            }}
                        />

                        {/* Front Face */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: `translateZ(${halfThickness}px)`,
                                pointerEvents: internalFlipped
                                    ? "none"
                                    : "auto",
                            }}
                        >
                            {renderCardShell(renderFrontFace(), isFrontDark)}
                        </div>

                        {/* Back Face */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: `rotateY(180deg) translateZ(${halfThickness}px)`,
                                pointerEvents: internalFlipped
                                    ? "auto"
                                    : "none",
                            }}
                        >
                            {renderCardShell(renderBackFace(), isBackDark)}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}

// ============================================================================
// FRAMER PROPERTY CONTROLS (8-GROUP ARCHITECTURE WITH 6 VARIANTS)
// ============================================================================

addPropertyControls(CreativeIDBadge, {
    // GROUP 1: BADGE VARIANT (ALL 6 VARIATIONS)
    badgeVariant: {
        type: ControlType.Enum,
        title: "Badge Variant",
        options: [
            "creativeId",
            "eventPass",
            "teamId",
            "memberPass",
            "studentId",
            "visitorPass",
        ],
        optionTitles: [
            "Creative ID",
            "Event Pass",
            "Team ID",
            "Member Pass",
            "Student ID",
            "Visitor Pass",
        ],
        defaultValue: "creativeId",
    },

    // GROUP 2: FRONT SIDE (VARIANT SCOPED)
    creativeFront: {
        type: ControlType.Object,
        title: "Front Side",
        hidden(props: any) {
            return props.badgeVariant !== "creativeId"
        },
        controls: {
            fullName: {
                type: ControlType.String,
                title: "Full Name",
                defaultValue: "Kaif Shaikh",
            },
            nameFont: {
                type: ControlType.Font,
                title: "Name Font",
                controls: "extended",
            },
            nameColor: {
                type: ControlType.Color,
                title: "Name Color",
                defaultValue: "#171717",
            },
            professionalTitle: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "UI/UX & DIGITAL DESIGNER",
            },
            titleFont: { type: ControlType.Font, title: "Title Font" },
            titleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#171717",
            },
            specialization: {
                type: ControlType.String,
                title: "Specialty",
                defaultValue: "PRODUCT DESIGN · FRAMER",
            },
            specialtyFont: { type: ControlType.Font, title: "Specialty Font" },
            specialtyColor: {
                type: ControlType.Color,
                title: "Specialty Color",
                defaultValue: "#777777",
            },
            idNumber: {
                type: ControlType.String,
                title: "ID Label",
                defaultValue: "CR-001",
            },
            idFont: { type: ControlType.Font, title: "ID Font" },
            creativeLabel: {
                type: ControlType.String,
                title: "Badge Label",
                defaultValue: "CREATIVE ID",
            },
            labelFont: { type: ControlType.Font, title: "Label Font" },
            portraitImage: { type: ControlType.Image, title: "Portrait" },
            customLogo: { type: ControlType.Image, title: "Logo" },
        },
    },

    eventFront: {
        type: ControlType.Object,
        title: "Front Side",
        hidden(props: any) {
            return props.badgeVariant !== "eventPass"
        },
        controls: {
            eventBrand: {
                type: ControlType.String,
                title: "Event Brand",
                defaultValue: "DESIGN / FUTURE",
            },
            brandFont: { type: ControlType.Font, title: "Brand Font" },
            eventTitle: {
                type: ControlType.String,
                title: "Event Title",
                displayTextArea: true,
                defaultValue: "INTERNATIONAL\nDESIGN SUMMIT",
            },
            titleFont: { type: ControlType.Font, title: "Title Font" },
            eventYear: {
                type: ControlType.String,
                title: "Year/Edition",
                defaultValue: "2026 // ED.08",
            },
            eventSubtitle: {
                type: ControlType.String,
                title: "Subtitle",
                defaultValue: "SAN FRANCISCO, CA",
            },
            passType: {
                type: ControlType.Enum,
                title: "Pass Type",
                options: [
                    "SPEAKER",
                    "ATTENDEE",
                    "VIP",
                    "EXHIBITOR",
                    "ORGANIZER",
                    "WORKSHOP",
                ],
                optionTitles: [
                    "Speaker",
                    "Attendee",
                    "VIP",
                    "Exhibitor",
                    "Organizer",
                    "Workshop",
                ],
                defaultValue: "SPEAKER",
            },
            participantName: {
                type: ControlType.String,
                title: "Attendee Name",
                defaultValue: "ALEX MORGAN",
            },
            nameFont: { type: ControlType.Font, title: "Name Font" },
            participantRole: {
                type: ControlType.String,
                title: "Role",
                defaultValue: "DESIGN DIRECTOR",
            },
            roleFont: { type: ControlType.Font, title: "Role Font" },
            participantOrg: {
                type: ControlType.String,
                title: "Organization",
                defaultValue: "STUDIO NORTH",
            },
            eventDate: {
                type: ControlType.String,
                title: "Date",
                defaultValue: "14–15 NOV 2026",
            },
            eventLocation: {
                type: ControlType.String,
                title: "Location",
                defaultValue: "SAN FRANCISCO, CA",
            },
            passId: {
                type: ControlType.String,
                title: "Pass ID",
                defaultValue: "EV-026-001",
            },
            showEventPortrait: {
                type: ControlType.Boolean,
                title: "Show Photo",
                defaultValue: true,
            },
            eventPortraitImage: { type: ControlType.Image, title: "Photo" },
            eventLogoImage: { type: ControlType.Image, title: "Logo" },
        },
    },

    teamFront: {
        type: ControlType.Object,
        title: "Front Side",
        hidden(props: any) {
            return props.badgeVariant !== "teamId"
        },
        controls: {
            companyName: {
                type: ControlType.String,
                title: "Company",
                defaultValue: "NORTHSTAR",
            },
            companyFont: { type: ControlType.Font, title: "Company Font" },
            companyTagline: {
                type: ControlType.String,
                title: "Tagline",
                defaultValue: "ENTERPRISE SYSTEMS CORP",
            },
            employeeId: {
                type: ControlType.String,
                title: "Employee ID",
                defaultValue: "TEAM-024",
            },
            employeeName: {
                type: ControlType.String,
                title: "Name",
                defaultValue: "JORDAN LEE",
            },
            nameFont: { type: ControlType.Font, title: "Name Font" },
            employeeRole: {
                type: ControlType.String,
                title: "Role",
                defaultValue: "STAFF PRODUCT DESIGNER",
            },
            roleFont: { type: ControlType.Font, title: "Role Font" },
            department: {
                type: ControlType.String,
                title: "Department",
                defaultValue: "PRODUCT & DESIGN",
            },
            teamName: {
                type: ControlType.String,
                title: "Team",
                defaultValue: "DIGITAL PLATFORMS",
            },
            officeLocation: {
                type: ControlType.String,
                title: "Location",
                defaultValue: "SAN FRANCISCO HQ",
            },
            showTeamPortrait: {
                type: ControlType.Boolean,
                title: "Show Photo",
                defaultValue: true,
            },
            teamPortraitImage: { type: ControlType.Image, title: "Photo" },
            companyLogoImage: { type: ControlType.Image, title: "Logo" },
        },
    },

    memberFront: {
        type: ControlType.Object,
        title: "Front Side",
        hidden(props: any) {
            return props.badgeVariant !== "memberPass"
        },
        controls: {
            clubBrandName: {
                type: ControlType.String,
                title: "Club Name",
                defaultValue: "THE FOUNDERS CLUB",
            },
            brandFont: { type: ControlType.Font, title: "Brand Font" },
            membershipTypeLabel: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "PRIVATE MEMBERSHIP",
            },
            membershipTier: {
                type: ControlType.Enum,
                title: "Tier",
                options: [
                    "STANDARD",
                    "SIGNATURE",
                    "GOLD",
                    "PLATINUM",
                    "FOUNDING MEMBER",
                    "VIP MEMBER",
                ],
                optionTitles: [
                    "Standard",
                    "Signature",
                    "Gold",
                    "Platinum",
                    "Founding",
                    "VIP",
                ],
                defaultValue: "SIGNATURE",
            },
            memberName: {
                type: ControlType.String,
                title: "Name",
                defaultValue: "ALEX MORGAN",
            },
            nameFont: { type: ControlType.Font, title: "Name Font" },
            membershipNumber: {
                type: ControlType.String,
                title: "Member ID",
                defaultValue: "MEM-0084",
            },
            memberSince: {
                type: ControlType.String,
                title: "Since",
                defaultValue: "2024",
            },
            memberStatement: {
                type: ControlType.String,
                title: "Statement",
                defaultValue: "MEMBERSHIP WITH PURPOSE.",
            },
            showMemberPortrait: {
                type: ControlType.Boolean,
                title: "Show Photo",
                defaultValue: false,
            },
            memberPortraitImage: { type: ControlType.Image, title: "Photo" },
            clubLogoImage: { type: ControlType.Image, title: "Logo" },
        },
    },

    studentFront: {
        type: ControlType.Object,
        title: "Front Side",
        hidden(props: any) {
            return props.badgeVariant !== "studentId"
        },
        controls: {
            institutionName: {
                type: ControlType.String,
                title: "Institution",
                defaultValue: "STANFORD DESIGN INSTITUTE",
            },
            institutionFont: { type: ControlType.Font, title: "Inst. Font" },
            facultySubtitle: {
                type: ControlType.String,
                title: "Faculty / School",
                defaultValue: "SCHOOL OF ARCHITECTURE & DESIGN",
            },
            studentName: {
                type: ControlType.String,
                title: "Student Name",
                defaultValue: "MAYA LIN",
            },
            nameFont: { type: ControlType.Font, title: "Name Font" },
            departmentCourse: {
                type: ControlType.String,
                title: "Course / Major",
                defaultValue: "B.DES · INTERACTION DESIGN",
            },
            courseFont: { type: ControlType.Font, title: "Course Font" },
            studentIdNumber: {
                type: ControlType.String,
                title: "Student ID",
                defaultValue: "STU-2026-849",
            },
            academicYear: {
                type: ControlType.String,
                title: "Academic Year",
                defaultValue: "2026 – 2027",
            },
            campusLocation: {
                type: ControlType.String,
                title: "Campus",
                defaultValue: "MAIN CAMPUS · STUDIO 04",
            },
            showStudentPortrait: {
                type: ControlType.Boolean,
                title: "Show Photo",
                defaultValue: true,
            },
            studentPortraitImage: {
                type: ControlType.Image,
                title: "Student Photo",
            },
            institutionLogoImage: {
                type: ControlType.Image,
                title: "Inst. Logo",
            },
        },
    },

    visitorFront: {
        type: ControlType.Object,
        title: "Front Side",
        hidden(props: any) {
            return props.badgeVariant !== "visitorPass"
        },
        controls: {
            visitorLabel: {
                type: ControlType.String,
                title: "Pass Heading",
                defaultValue: "VISITOR",
            },
            accessLevel: {
                type: ControlType.String,
                title: "Clearance",
                defaultValue: "ESCORT REQUIRED",
            },
            hostCompany: {
                type: ControlType.String,
                title: "Site / Building",
                defaultValue: "APEX GLOBAL HQ",
            },
            visitorName: {
                type: ControlType.String,
                title: "Visitor Name",
                defaultValue: "DAVID CHEN",
            },
            nameFont: { type: ControlType.Font, title: "Name Font" },
            visitorOrg: {
                type: ControlType.String,
                title: "Visitor Company",
                defaultValue: "VERTEX VENTURES",
            },
            orgFont: { type: ControlType.Font, title: "Company Font" },
            passNumber: {
                type: ControlType.String,
                title: "Pass Number",
                defaultValue: "VIS-042",
            },
            hostName: {
                type: ControlType.String,
                title: "Host Name",
                defaultValue: "SARAH JENKINS",
            },
            visitDate: {
                type: ControlType.String,
                title: "Visit Date",
                defaultValue: "16 OCT 2026",
            },
            metaFont: { type: ControlType.Font, title: "Details Font" },
            showVisitorPortrait: {
                type: ControlType.Boolean,
                title: "Show Photo",
                defaultValue: true,
            },
            visitorPortraitImage: {
                type: ControlType.Image,
                title: "Visitor Photo",
            },
            visitorLogoImage: { type: ControlType.Image, title: "Site Logo" },
        },
    },

    // GROUP 3: BACK SIDE (VARIANT SCOPED)
    creativeBack: {
        type: ControlType.Object,
        title: "Back Side",
        hidden(props: any) {
            return props.badgeVariant !== "creativeId"
        },
        controls: {
            aboutHeading: {
                type: ControlType.String,
                title: "Heading",
                defaultValue: "ABOUT",
            },
            headingFont: { type: ControlType.Font, title: "Heading Font" },
            biography: {
                type: ControlType.String,
                title: "Bio",
                displayTextArea: true,
                defaultValue:
                    "Designing digital experiences that feel simple, useful, and memorable.",
            },
            bioFont: { type: ControlType.Font, title: "Bio Font" },
            portfolioLabel: {
                type: ControlType.String,
                title: "Portfolio Label",
                defaultValue: "PORTFOLIO",
            },
            portfolioUrl: {
                type: ControlType.String,
                title: "Portfolio URL",
                defaultValue: "kaifshaikh.com",
            },
            portfolioFont: { type: ControlType.Font, title: "Portfolio Font" },
            showSocials: {
                type: ControlType.Boolean,
                title: "Show Social",
                defaultValue: true,
            },
            linkedInText: {
                type: ControlType.String,
                title: "LinkedIn",
                defaultValue: "LinkedIn",
            },
            instagramText: {
                type: ControlType.String,
                title: "Instagram",
                defaultValue: "Instagram",
            },
            showEmail: {
                type: ControlType.Boolean,
                title: "Show Email",
                defaultValue: true,
            },
            emailAddress: {
                type: ControlType.String,
                title: "Email",
                defaultValue: "hello@kaifshaikh.com",
            },
            showQrCode: {
                type: ControlType.Boolean,
                title: "Show QR",
                defaultValue: true,
            },
            qrImage: { type: ControlType.Image, title: "QR Image" },
            showClosingText: {
                type: ControlType.Boolean,
                title: "Show Closing",
                defaultValue: true,
            },
            closingStatement: {
                type: ControlType.String,
                title: "Closing Text",
                displayTextArea: true,
                defaultValue: "LET'S CREATE\nSOMETHING\nMEANINGFUL.",
            },
            closingFont: { type: ControlType.Font, title: "Closing Font" },
        },
    },

    eventBack: {
        type: ControlType.Object,
        title: "Back Side",
        hidden(props: any) {
            return props.badgeVariant !== "eventPass"
        },
        controls: {
            protocolHeading: {
                type: ControlType.String,
                title: "Protocol Label",
                defaultValue: "ACCESS PROTOCOL",
            },
            eventVenue: {
                type: ControlType.String,
                title: "Venue",
                defaultValue: "MOSCONE CONVENTION CENTER",
            },
            venueFont: { type: ControlType.Font, title: "Venue Font" },
            showEventSchedule: {
                type: ControlType.Boolean,
                title: "Show Schedule",
                defaultValue: true,
            },
            scheduleDay1: {
                type: ControlType.String,
                title: "Schedule D1",
                defaultValue: "DAY 01 — OPENING KEYNOTE & TECH",
            },
            scheduleDay2: {
                type: ControlType.String,
                title: "Schedule D2",
                defaultValue: "DAY 02 — DESIGN SYSTEMS LAB",
            },
            scheduleFont: { type: ControlType.Font, title: "Schedule Font" },
            showEventQr: {
                type: ControlType.Boolean,
                title: "Show QR",
                defaultValue: true,
            },
            eventQrImage: { type: ControlType.Image, title: "QR Image" },
            scanInstruction: {
                type: ControlType.String,
                title: "Instruction",
                defaultValue: "SCAN FOR VENUE ADMISSION",
            },
        },
    },

    teamBack: {
        type: ControlType.Object,
        title: "Back Side",
        hidden(props: any) {
            return props.badgeVariant !== "teamId"
        },
        controls: {
            directoryHeading: {
                type: ControlType.String,
                title: "Heading",
                defaultValue: "INTERNAL DIRECTORY",
            },
            teamDescription: {
                type: ControlType.String,
                title: "Description",
                displayTextArea: true,
                defaultValue:
                    "Building mission-critical digital systems and intuitive interfaces for next-generation platforms.",
            },
            descFont: { type: ControlType.Font, title: "Desc Font" },
            companyWebsite: {
                type: ControlType.String,
                title: "Website",
                defaultValue: "northstar.systems",
            },
            workEmail: {
                type: ControlType.String,
                title: "Email",
                defaultValue: "jordan@northstar.systems",
            },
            contactFont: { type: ControlType.Font, title: "Contact Font" },
            showTeamQr: {
                type: ControlType.Boolean,
                title: "Show QR",
                defaultValue: true,
            },
            teamQrImage: { type: ControlType.Image, title: "QR Image" },
        },
    },

    memberBack: {
        type: ControlType.Object,
        title: "Back Side",
        hidden(props: any) {
            return props.badgeVariant !== "memberPass"
        },
        controls: {
            memberPrivilegesHeading: {
                type: ControlType.String,
                title: "Heading",
                defaultValue: "MEMBER PRIVILEGES",
            },
            memberStatus: {
                type: ControlType.String,
                title: "Status",
                defaultValue: "ACTIVE",
            },
            memberBenefit: {
                type: ControlType.String,
                title: "Benefit",
                defaultValue: "ACCESS TO THE MEMBERS' LOUNGE & CONCIERGE",
            },
            benefitFont: { type: ControlType.Font, title: "Benefit Font" },
            memberWebsite: {
                type: ControlType.String,
                title: "Website",
                defaultValue: "thefoundersclub.example",
            },
            showMemberQr: {
                type: ControlType.Boolean,
                title: "Show QR",
                defaultValue: true,
            },
            memberQrImage: { type: ControlType.Image, title: "QR Image" },
        },
    },

    studentBack: {
        type: ControlType.Object,
        title: "Back Side",
        hidden(props: any) {
            return props.badgeVariant !== "studentId"
        },
        controls: {
            accessHeading: {
                type: ControlType.String,
                title: "Heading",
                defaultValue: "CAMPUS ACCESS & LIBRARY",
            },
            studentAccessNote: {
                type: ControlType.String,
                title: "Privileges",
                displayTextArea: true,
                defaultValue:
                    "Authorized for 24/7 Design Studio, Fabrication Lab, and University Library borrowing privileges.",
            },
            accessFont: { type: ControlType.Font, title: "Privileges Font" },
            institutionWebsite: {
                type: ControlType.String,
                title: "Website",
                defaultValue: "design.stanford.example",
            },
            supportContact: {
                type: ControlType.String,
                title: "Emergency / Help",
                defaultValue: "CAMPUS SECURITY · +1 (555) 890-1234",
            },
            contactFont: { type: ControlType.Font, title: "Contact Font" },
            validityText: {
                type: ControlType.String,
                title: "Validity Note",
                defaultValue: "VALID FOR ACADEMIC YEAR 2026–2027",
            },
            showStudentQr: {
                type: ControlType.Boolean,
                title: "Show QR",
                defaultValue: true,
            },
            studentQrImage: { type: ControlType.Image, title: "Library QR" },
        },
    },

    visitorBack: {
        type: ControlType.Object,
        title: "Back Side",
        hidden(props: any) {
            return props.badgeVariant !== "visitorPass"
        },
        controls: {
            securityHeading: {
                type: ControlType.String,
                title: "Heading",
                defaultValue: "VISITOR SECURITY PROTOCOL",
            },
            visitorGuidelines: {
                type: ControlType.String,
                title: "Guidelines",
                displayTextArea: true,
                defaultValue:
                    "This pass must be worn visibly at all times while on premises. Escort required in restricted R&D zones.",
            },
            guidelinesFont: {
                type: ControlType.Font,
                title: "Guidelines Font",
            },
            visitorWifiInfo: {
                type: ControlType.String,
                title: "Wi-Fi Info",
                defaultValue: "GUEST WI-FI: APEX-GUEST",
            },
            securityContact: {
                type: ControlType.String,
                title: "Security Desk",
                defaultValue: "RECEPTION & SECURITY · EXT. 4100",
            },
            contactFont: { type: ControlType.Font, title: "Contact Font" },
            checkOutInstruction: {
                type: ControlType.String,
                title: "Scan Label",
                defaultValue: "SCAN AT RECEPTION TO SIGN OUT",
            },
            showVisitorQr: {
                type: ControlType.Boolean,
                title: "Show QR",
                defaultValue: true,
            },
            visitorQrImage: { type: ControlType.Image, title: "Check-Out QR" },
        },
    },

    // GROUP 4: APPEARANCE (INCLUDES LIGHT, DARK & DUAL TONE COLOR MODES)
    lookSettings: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            colorMode: {
                type: ControlType.Enum,
                title: "Color Mode",
                options: ["light", "dark", "dualTone"],
                optionTitles: ["Light", "Dark", "Dual Tone"],
                defaultValue: "light",
                displaySegmentedControl: true,
            },
            useCustomColors: {
                type: ControlType.Boolean,
                title: "Custom Bg",
                defaultValue: false,
                enabledTitle: "Custom",
                disabledTitle: "Theme",
            },
            frontBgColor: {
                type: ControlType.Color,
                title: "Front Bg",
                defaultValue: "#F5F3EE",
                hidden(props: any) {
                    return !props.useCustomColors
                },
            },
            backBgColor: {
                type: ControlType.Color,
                title: "Back Bg",
                defaultValue: "#191919",
                hidden(props: any) {
                    return !props.useCustomColors
                },
            },
            accentColor: {
                type: ControlType.Color,
                title: "Accent Color",
                defaultValue: "#C8F36A",
            },
            memberAccentColor: {
                type: ControlType.Color,
                title: "Member Gold",
                defaultValue: "#C6AD80",
            },
            hardwareFinish: {
                type: ControlType.Enum,
                title: "Hardware",
                options: ["gunmetal", "silver", "matteBlack"],
                optionTitles: ["Gunmetal", "Brushed Silver", "Matte Black"],
                defaultValue: "gunmetal",
            },
            showLanyard: {
                type: ControlType.Boolean,
                title: "Show Lanyard",
                defaultValue: true,
            },
            strapBranding: {
                type: ControlType.Boolean,
                title: "Strap Tag",
                defaultValue: true,
            },
            strapCustomText: {
                type: ControlType.String,
                title: "Strap Text",
                defaultValue: "CREATIVE STUDIO",
            },
        },
    },

    // GROUP 5: LAYOUT (STRAP LENGTH UP TO 500)
    layoutSettings: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Width",
                min: 280,
                max: 420,
                step: 2,
                defaultValue: 330,
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Height",
                min: 440,
                max: 620,
                step: 2,
                defaultValue: 515,
            },
            cardThickness: {
                type: ControlType.Number,
                title: "Card Thickness",
                min: 1,
                max: 12,
                step: 0.5,
                defaultValue: 4,
                displayStepper: true,
            },
            cardBorderRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 12,
                max: 36,
                step: 1,
                defaultValue: 24,
            },
            enclosurePadding: {
                type: ControlType.Number,
                title: "Sleeve Margin",
                min: 4,
                max: 20,
                step: 1,
                defaultValue: 10,
            },
            strapWidth: {
                type: ControlType.Number,
                title: "Strap Width",
                min: 36,
                max: 64,
                step: 2,
                defaultValue: 52,
            },
            strapLength: {
                type: ControlType.Number,
                title: "Strap Length",
                min: 80,
                max: 500,
                step: 5,
                defaultValue: 170,
            },
            cardScale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0.6,
                max: 1.4,
                step: 0.05,
                defaultValue: 1.0,
            },
        },
    },

    // GROUP 6: LIGHT
    lightSettings: {
        type: ControlType.Object,
        title: "Light",
        controls: {
            shadowIntensity: {
                type: ControlType.Number,
                title: "Shadows",
                min: 0,
                max: 1.5,
                step: 0.05,
                defaultValue: 0.85,
            },
            glareIntensity: {
                type: ControlType.Number,
                title: "Glare",
                min: 0,
                max: 1.0,
                step: 0.05,
                defaultValue: 0.45,
            },
            enclosureSpecular: {
                type: ControlType.Number,
                title: "Edge Specular",
                min: 0,
                max: 1.0,
                step: 0.05,
                defaultValue: 0.7,
            },
        },
    },

    // GROUP 7: MOTION PHYSICS
    motionSettings: {
        type: ControlType.Object,
        title: "Motion Physics",
        controls: {
            interactive: {
                type: ControlType.Boolean,
                title: "Interactive",
                defaultValue: true,
            },
            enableTilt: {
                type: ControlType.Boolean,
                title: "Tilt",
                defaultValue: true,
            },
            enableFlip: {
                type: ControlType.Boolean,
                title: "Flip",
                defaultValue: true,
            },
            tiltSensitivity: {
                type: ControlType.Number,
                title: "Tilt Strength",
                min: 4,
                max: 32,
                step: 1,
                defaultValue: 16,
            },
            flipDuration: {
                type: ControlType.Number,
                title: "Flip Speed",
                min: 0.3,
                max: 1.8,
                step: 0.05,
                defaultValue: 0.75,
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                min: 600,
                max: 2000,
                step: 50,
                defaultValue: 1200,
            },
        },
    },

    // GROUP 8: CANVAS EDITING PREVIEW
    canvasSettings: {
        type: ControlType.Object,
        title: "Canvas Preview",
        controls: {
            showBothSides: {
                type: ControlType.Boolean,
                title: "Dual View (Canvas)",
                defaultValue: false,
            },
            isFlippedProp: {
                type: ControlType.Boolean,
                title: "Flip (Back Side)",
                defaultValue: false,
            },
        },
    },
})
