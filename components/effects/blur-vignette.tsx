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

import type { CSSProperties } from "react"

interface BlurVignetteProps {
    blur: number
    inset: number
    transition: number
    vignetteColor: string
    zIndex: number
    shape: "ellipse" | "circle" | "rectangle"
    vignetteIntensity: number
    vignetteTop: boolean
    vignetteRight: boolean
    vignetteBottom: boolean
    vignetteLeft: boolean
    style?: CSSProperties
}

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BlurVignette(props: BlurVignetteProps) {
    const {
        blur = 12,
        inset = 5,
        transition = 15,
        vignetteColor = "#000000",
        zIndex = 1,
        shape = "rectangle",
        vignetteIntensity = 15,
        vignetteTop = true,
        vignetteRight = true,
        vignetteBottom = true,
        vignetteLeft = true,
        style,
    } = props

    // Calculate gradient stops for the mask
    const isRectangle = shape === "rectangle"

    let start: number
    let end: number

    if (isRectangle) {
        // Rectangle behaves as originally implemented
        start = inset
        end = Math.min(inset + transition, 150)
    } else {
        // For ellipse and circle shapes, invert the gradient so that
        // lower inset = larger clear center area and higher inset = smaller clear center area.
        const maxRadius = 100
        const clampedInset = Math.max(0, Math.min(maxRadius, inset))
        const clampedTransition = Math.max(0, Math.min(150, transition))

        const innerClearRadius = maxRadius - clampedInset
        const outerClearRadius = Math.max(
            0,
            innerClearRadius - clampedTransition
        )

        start = outerClearRadius
        end = innerClearRadius
    }

    const appliedVignetteColor = React.useMemo(() => {
        const intensity = Math.max(0, Math.min(100, vignetteIntensity)) / 100

        // Helper: clamp alpha between 0 and 1
        const applyAlpha = (alpha: number) => {
            const a = Math.max(0, Math.min(1, alpha))
            return a * intensity
        }

        // rgba() or rgb()
        const rgbaMatch = vignetteColor.match(/^rgba?\(([^)]+)\)$/i)
        if (rgbaMatch) {
            const parts = rgbaMatch[1].split(",").map((p) => p.trim())
            if (parts.length < 3) return vignetteColor

            const [r, g, b] = parts
            const baseAlpha = parts[3] !== undefined ? parseFloat(parts[3]) : 1
            const newAlpha = applyAlpha(isNaN(baseAlpha) ? 1 : baseAlpha)
            return `rgba(${r}, ${g}, ${b}, ${newAlpha})`
        }

        // hsla() or hsl()
        const hslMatch = vignetteColor.match(/^hsla?\(([^)]+)\)$/i)
        if (hslMatch) {
            const parts = hslMatch[1].split(",").map((p) => p.trim())
            if (parts.length < 3) return vignetteColor

            const [h, s, l] = parts
            const baseAlpha = parts[3] !== undefined ? parseFloat(parts[3]) : 1
            const newAlpha = applyAlpha(isNaN(baseAlpha) ? 1 : baseAlpha)
            return `hsla(${h}, ${s}, ${l}, ${newAlpha})`
        }

        // Hex formats #RGB, #RRGGBB
        if (vignetteColor.startsWith("#")) {
            const hex = vignetteColor.slice(1)
            let r: number, g: number, b: number

            if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16)
                g = parseInt(hex[1] + hex[1], 16)
                b = parseInt(hex[2] + hex[2], 16)
            } else if (hex.length === 6) {
                r = parseInt(hex.slice(0, 2), 16)
                g = parseInt(hex.slice(2, 4), 16)
                b = parseInt(hex.slice(4, 6), 16)
            } else {
                return vignetteColor
            }

            const newAlpha = applyAlpha(1)
            return `rgba(${r}, ${g}, ${b}, ${newAlpha})`
        }

        // Fallback: if we can't parse the color, just return it unchanged
        return vignetteColor
    }, [vignetteColor, vignetteIntensity])

    let maskImage: string | undefined

    if (isRectangle) {
        const inner = start
        const outer = Math.min(start + transition, 100)
        const masks: string[] = []

        if (vignetteLeft) {
            masks.push(
                `linear-gradient(to right, black 0%, black ${inner}%, transparent ${outer}%, transparent 100%)`
            )
        }
        if (vignetteRight) {
            masks.push(
                `linear-gradient(to left, black 0%, black ${inner}%, transparent ${outer}%, transparent 100%)`
            )
        }
        if (vignetteTop) {
            masks.push(
                `linear-gradient(to bottom, black 0%, black ${inner}%, transparent ${outer}%, transparent 100%)`
            )
        }
        if (vignetteBottom) {
            masks.push(
                `linear-gradient(to top, black 0%, black ${inner}%, transparent ${outer}%, transparent 100%)`
            )
        }

        if (masks.length > 0) {
            maskImage = masks.join(",")
        } else {
            maskImage =
                "linear-gradient(to right, transparent 0%, transparent 100%)"
        }
    } else {
        const gradientShape = shape === "ellipse" ? "ellipse" : "circle"
        const centerX = 50
        const centerY = 50
        const radialStart = Math.max(0, Math.min(100, start))
        const radialEnd = Math.max(radialStart + 0.1, Math.min(100, end))
        maskImage = `radial-gradient(${gradientShape} at ${centerX}% ${centerY}%, transparent ${radialStart}%, black ${radialEnd}%)`
    }

    const shouldRenderOverlay =
        !isRectangle ||
        vignetteTop ||
        vignetteRight ||
        vignetteBottom ||
        vignetteLeft

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                ...style,
            }}
        >
            {shouldRenderOverlay && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        zIndex: zIndex,
                        backdropFilter: `blur(${blur}px)`,
                        WebkitBackdropFilter: `blur(${blur}px)`,
                        backgroundColor: appliedVignetteColor,
                        maskImage,
                        WebkitMaskImage: maskImage,
                    }}
                />
            )}
        </div>
    )
}

BlurVignette.displayName = "Blur Vignette"

addPropertyControls<BlurVignetteProps>(BlurVignette, {
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["ellipse", "circle", "rectangle"],
        optionTitles: ["Ellipse", "Circle", "Rectangle"],
        defaultValue: "rectangle",
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
    },
    vignetteTop: {
        type: ControlType.Boolean,
        title: "Top Edge",
        defaultValue: true,
        hidden: ({ shape }) => shape !== "rectangle",
    },
    vignetteRight: {
        type: ControlType.Boolean,
        title: "Right Edge",
        defaultValue: true,
        hidden: ({ shape }) => shape !== "rectangle",
    },
    vignetteBottom: {
        type: ControlType.Boolean,
        title: "Bottom Edge",
        defaultValue: true,
        hidden: ({ shape }) => shape !== "rectangle",
    },
    vignetteLeft: {
        type: ControlType.Boolean,
        title: "Left Edge",
        defaultValue: true,
        hidden: ({ shape }) => shape !== "rectangle",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 12,
    },
    inset: {
        type: ControlType.Number,
        title: "Inset",
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 5,
    },
    transition: {
        type: ControlType.Number,
        title: "Smoothness",
        min: 0,
        max: 120,
        unit: "%",
        defaultValue: 15,
    },
    vignetteColor: {
        type: ControlType.Color,
        title: "Vignette Color",
        defaultValue: "#000000",
    },
    vignetteIntensity: {
        type: ControlType.Number,
        title: "Vignette Intensity",
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 15,
        step: 1,
        description:
            "[Click here](https://tinyurl.com/avirallakhanpaul) to get more exciting components!",
    },
})
