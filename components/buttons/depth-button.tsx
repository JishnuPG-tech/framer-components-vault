// Layered shadow button with hover effect
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    type CSSProperties,
    useState,
    useEffect,
    useMemo,
    useCallback,
    startTransition,
} from "react"

interface DepthButtonProps {
    label: string
    backgroundColor: string
    textColor: string
    hoverBackgroundColor: string
    hoverTextColor: string
    variant: "fill" | "outline"
    outlineFillColor: string
    shadowLayers: number
    shadowDirection: "bottom-right" | "bottom-left" | "top-right" | "top-left"
    borderRadius: string
    padding: string
    font: CSSProperties
    animationType: "animated" | "static"
    enableGlow: boolean
    shadowTone: "auto" | "darker" | "lighter"
    link: string
    openInNewTab: boolean
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 115
 * @framerIntrinsicHeight 40
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function DepthButton(props: DepthButtonProps) {
    const {
        label,
        backgroundColor,
        textColor,
        hoverBackgroundColor,
        hoverTextColor,
        variant,
        outlineFillColor,
        shadowLayers,
        shadowDirection,
        borderRadius,
        padding = "12px 24px 12px 24px",
        font,
        animationType,
        enableGlow,
        shadowTone,
        link,
        openInNewTab,
        style,
    } = props
    const isStatic = useIsStaticRenderer()

    // Generate a unique offset for each instance to make animations different
    const [uniqueOffset, setUniqueOffset] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    const resolvedPadding = useMemo(() => {
        const p: any = padding
        if (!p) return "12px 24px 12px 24px"

        if (typeof p === "string") {
            const trimmed = p.trim()
            if (!trimmed) {
                return "12px 24px 12px 24px"
            }
            // Some Framer UIs return 2-value padding; normalize to 4 values for consistent display
            const parts = trimmed.split(/\s+/).filter(Boolean)
            if (parts.length === 1)
                return `${parts[0]} ${parts[0]} ${parts[0]} ${parts[0]}`
            if (parts.length === 2)
                return `${parts[0]} ${parts[1]} ${parts[0]} ${parts[1]}`
            if (parts.length === 3)
                return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[1]}`
            return trimmed
        }

        // Some render targets may provide padding as an object
        if (typeof p === "object") {
            const top = p.top ?? p.paddingTop ?? "12px"
            const right = p.right ?? p.paddingRight ?? "24px"
            const bottom = p.bottom ?? p.paddingBottom ?? "12px"
            const left = p.left ?? p.paddingLeft ?? "24px"
            return `${top} ${right} ${bottom} ${left}`
        }

        return "12px 24px 12px 24px"
    }, [padding])

    const baseBackground =
        variant === "outline" ? outlineFillColor : backgroundColor
    const baseTextColor = textColor

    const strokeShadow = useMemo(() => {
        if (variant !== "outline") return ""
        const strokeColor = isHovered ? hoverBackgroundColor : backgroundColor
        return `inset 0 0 0 2px ${strokeColor}`
    }, [backgroundColor, hoverBackgroundColor, isHovered, variant])

    const hoverBackground = hoverBackgroundColor
    const hoverText = hoverTextColor

    const isFillWidth = !!style && style.width === "100%"
    const isFillHeight = !!style && style.height === "100%"

    useEffect(() => {
        startTransition(() => setUniqueOffset(Math.random() * 0.1))
    }, [])

    // Define direction multipliers at component level so they're accessible everywhere
    const directionMultipliers = {
        "bottom-right": { x: 1, y: 1 },
        "bottom-left": { x: -1, y: 1 },
        "top-right": { x: 1, y: -1 },
        "top-left": { x: -1, y: -1 },
    }
    const multiplier = directionMultipliers[shadowDirection]

    // Parse color to HSL - improved version for Safari
    const parseColor = useMemo(() => {
        return (color: string) => {
            // Direct color parsing without DOM manipulation
            let r = 0,
                g = 0,
                b = 0

            // Handle hex colors
            if (color.startsWith("#")) {
                const hex = color.slice(1)
                if (hex.length === 3) {
                    r = parseInt(hex[0] + hex[0], 16) / 255
                    g = parseInt(hex[1] + hex[1], 16) / 255
                    b = parseInt(hex[2] + hex[2], 16) / 255
                } else if (hex.length === 6) {
                    r = parseInt(hex.slice(0, 2), 16) / 255
                    g = parseInt(hex.slice(2, 4), 16) / 255
                    b = parseInt(hex.slice(4, 6), 16) / 255
                }
            }
            // Handle rgb/rgba colors
            else if (color.startsWith("rgb")) {
                const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
                if (match) {
                    r = parseInt(match[1]) / 255
                    g = parseInt(match[2]) / 255
                    b = parseInt(match[3]) / 255
                }
            }
            // Handle hsl colors
            else if (color.startsWith("hsl")) {
                const match = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/)
                if (match) {
                    return {
                        h: parseInt(match[1]),
                        s: parseInt(match[2]),
                        l: parseInt(match[3]),
                    }
                }
            }

            // Convert RGB to HSL
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h = 0,
                s = 0,
                l = (max + min) / 2

            if (max !== min) {
                const d = max - min
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

                switch (max) {
                    case r:
                        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
                        break
                    case g:
                        h = ((b - r) / d + 2) / 6
                        break
                    case b:
                        h = ((r - g) / d + 4) / 6
                        break
                }
            }

            return { h: h * 360, s: s * 100, l: l * 100 }
        }
    }, [])

    // Generate layered box shadows based on background color - memoized
    const boxShadow = useMemo(() => {
        const shadows = []
        const baseColor = parseColor(backgroundColor)

        const tDenom = Math.max(1, shadowLayers - 1)

        // Build the shadow from the button's BG color by progressively reducing brightness (lightness).
        // This keeps every layer tied to the base color instead of drifting to a fixed dark tone.
        const startLightness = Math.max(2, Math.min(98, baseColor.l))

        const resolvedTone =
            shadowTone === "auto"
                ? startLightness < 50
                    ? "lighter"
                    : "darker"
                : shadowTone

        // Smaller ramp + smoother easing to avoid visible jumps between layers
        const rampAmount = Math.max(8, Math.min(40, 10 + shadowLayers * 2.5))
        let endLightness =
            startLightness +
            (resolvedTone === "lighter" ? rampAmount : -rampAmount)
        endLightness = Math.max(2, Math.min(98, endLightness))

        // Ensure we always have a visible (but not extreme) ramp even for near-white/near-black colors
        if (Math.abs(endLightness - startLightness) < 6) {
            endLightness = Math.max(
                2,
                Math.min(
                    98,
                    startLightness + (resolvedTone === "lighter" ? 6 : -6)
                )
            )
        }

        const smoothstep = (t: number) => t * t * (3 - 2 * t)

        const saturation = Math.max(0, Math.min(100, baseColor.s))

        for (let i = 1; i <= shadowLayers; i++) {
            const offset = i * 2
            const t = (i - 1) / tDenom
            const eased = smoothstep(t)
            const lightness =
                startLightness + (endLightness - startLightness) * eased
            const layerColor = `hsl(${baseColor.h}, ${saturation}%, ${lightness}%)`

            const xOffset = offset * multiplier.x
            const yOffset = offset * multiplier.y
            shadows.push(`${xOffset}px ${yOffset}px 0px ${layerColor}`)
        }
        return shadows.join(", ")
    }, [
        backgroundColor,
        shadowLayers,
        shadowDirection,
        multiplier.x,
        multiplier.y,
        parseColor,
        shadowTone,
    ])

    const hoverBoxShadow = useMemo(() => {
        const combine = (a: string, b: string) => {
            if (a && b) return `${a}, ${b}`
            return a || b
        }

        if (!isHovered) return combine(strokeShadow, boxShadow)

        if (enableGlow && !isStatic) {
            const glow = `0 0 20px ${hoverBackgroundColor}, 0 0 40px ${hoverBackgroundColor}`
            return combine(strokeShadow, glow)
        }

        // Keep outline stroke on hover even when layers disappear
        return strokeShadow || "none"
    }, [
        boxShadow,
        enableGlow,
        hoverBackgroundColor,
        isHovered,
        isStatic,
        strokeShadow,
    ])

    const hoverTransform = useMemo(() => {
        if (isStatic) return "translate(0px, 0px)"
        if (!isHovered) return "translate(0px, 0px)"
        if (animationType !== "animated") return "translate(0px, 0px)"
        const moveDistance = shadowLayers * 2
        return `translate(${moveDistance * multiplier.x}px, ${moveDistance * multiplier.y}px)`
    }, [animationType, isHovered, isStatic, multiplier.x, multiplier.y, shadowLayers])

    const handleEnter = useCallback(() => {
        startTransition(() => setIsHovered(true))
    }, [])

    const handleLeave = useCallback(() => {
        startTransition(() => setIsHovered(false))
    }, [])

    const isLink = !!(link && String(link).trim())

    if (isLink) {
        return (
            <a
                href={link}
                target={openInNewTab ? "_blank" : undefined}
                rel={openInNewTab ? "noopener noreferrer" : undefined}
                style={{
                    position: "relative",
                    boxSizing: "border-box",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    ...(isFillWidth ? null : { width: "max-content" }),
                    ...(isFillHeight ? null : { height: "max-content" }),
                    ...style,
                    ...font,
                    padding: resolvedPadding,
                    backgroundColor: isHovered
                        ? hoverBackground
                        : baseBackground,
                    color: isHovered ? hoverText : baseTextColor,
                    cursor: "pointer",
                    border: "none",
                    borderRadius,
                    boxShadow: hoverBoxShadow,
                    transform: hoverTransform,
                    transition: isStatic
                        ? "none"
                        : `all ${0.5 + uniqueOffset}s cubic-bezier(0.4, 0, 0.2, 1)`,
                    whiteSpace: "nowrap",
                }}
                onPointerEnter={handleEnter}
                onPointerLeave={handleLeave}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                role="button"
                aria-label={label}
            >
                {label}
            </a>
        )
    }

    return (
        <button
            style={{
                position: "relative",
                boxSizing: "border-box",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                ...(isFillWidth ? null : { width: "max-content" }),
                ...(isFillHeight ? null : { height: "max-content" }),
                ...style,
                ...font,
                padding: resolvedPadding,
                backgroundColor: isHovered ? hoverBackground : baseBackground,
                color: isHovered ? hoverText : baseTextColor,
                cursor: "pointer",
                border: "none",
                borderRadius,
                boxShadow: hoverBoxShadow,
                transform: hoverTransform,
                transition: isStatic
                    ? "none"
                    : `all ${0.5 + uniqueOffset}s cubic-bezier(0.4, 0, 0.2, 1)`,
                whiteSpace: "nowrap",
            }}
            onPointerEnter={handleEnter}
            onPointerLeave={handleLeave}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            {label}
        </button>
    )
}

addPropertyControls(DepthButton, {
    label: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Click Me",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    variant: {
        type: ControlType.Enum,
        title: "Style",
        options: ["fill", "outline"],
        optionTitles: ["Fill", "Outline"],
        defaultValue: "fill",
        displaySegmentedControl: true,
    },
    outlineFillColor: {
        type: ControlType.Color,
        title: "Outline Fill",
        description: "Background color used only in Outline style.",
        defaultValue: "#FFFFFF",
        hidden: ({ variant }) => variant !== "outline",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "BG",
        defaultValue: "#6366F1",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#4F46E5",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#FFFFFF",
    },
    shadowLayers: {
        type: ControlType.Number,
        title: "Layers",
        defaultValue: 9,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    shadowDirection: {
        type: ControlType.Enum,
        title: "Direction",
        description: "Adjust the direction of the layered shadow effect",
        options: ["bottom-right", "bottom-left", "top-right", "top-left"],
        optionTitles: ["↘", "↙", "↗", "↖"],
        defaultValue: "bottom-right",
        displaySegmentedControl: true,
    },
    shadowTone: {
        type: ControlType.Enum,
        title: "Tone",
        description:
            "Auto adapts to BG brightness. Darker: layers get darker. Lighter: layers get lighter.",
        options: ["auto", "darker", "lighter"],
        optionTitles: ["Auto", "Darker", "Lighter"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        description:
            "Animated: Button moves into shadow position on hover. Static: Shadow disappears on hover.",
        options: ["animated", "static"],
        optionTitles: ["Animated", "Static"],
        defaultValue: "animated",
        displaySegmentedControl: true,
    },
    enableGlow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "8px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        description:
            "Built by Matthias Ölschlegel 💪\n[Explore more components](https://dub.sh/dsw13)",
        defaultValue: "12px 24px 12px 24px",
    },
})
