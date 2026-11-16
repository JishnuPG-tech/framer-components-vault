// Squirkle Shape Generator
//
// This component renders a customizable squirkle (superellipse) as a vector SVG shape.
//
// @framerSupportedLayoutWidth any-prefer-fixed
// @framerSupportedLayoutHeight any-prefer-fixed
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, type CSSProperties } from "react"

// Generate unique ID for each component instance
function generateUniqueId() {
    return `squirkle-${Math.random().toString(36).substr(2, 9)}`
}

interface SquirkleProps {
    smoothness: number
    borderRadius: number
    fill: string
    fillType: "solid" | "gradient" | "radial" | "image"
    gradientFrom: string
    gradientTo: string
    gradientAngle: number
    radialStops: { color: string; position: number }[]
    image: { src: string; alt?: string }
    imageFit: "cover" | "contain" | "fill" | "scale-down"
    shadowEnabled: boolean
    shadowColor: string
    shadowBlur: number
    shadowOffsetX: number
    shadowOffsetY: number
    strokeEnabled: boolean
    strokeColor: string
    strokeWidth: number
    blurEnabled: boolean
    blurAmount: number
    backdropBlurEnabled: boolean
    backdropBlurAmount: number
    instanceId: string
    style?: CSSProperties
}

/**
 * Squirkle
 *
 * A customizable squirkle (superellipse) SVG shape.
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Squirkle(props: SquirkleProps) {
    const {
        smoothness,
        borderRadius,
        fill,
        fillType,
        gradientFrom,
        gradientTo,
        gradientAngle,
        radialStops = [
            { color: "#8855FF", position: 0 },
            { color: "#22CC66", position: 33 },
            { color: "#FFBB00", position: 66 },
            { color: "#FF5588", position: 100 },
        ],
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        imageFit,
        shadowEnabled,
        shadowColor,
        shadowBlur,
        shadowOffsetX,
        shadowOffsetY,
        strokeEnabled,
        strokeColor,
        strokeWidth,
        blurEnabled,
        blurAmount,
        backdropBlurEnabled,
        backdropBlurAmount,
        instanceId,
        style,
    } = props

    // Generate unique IDs for this instance
    const uniqueId = useMemo(
        () => instanceId || generateUniqueId(),
        [instanceId]
    )

    // Squirkle path generator (superellipse approximation)
    // n = 2: ellipse, n > 2: squirkle, n < 2: squircle
    const n = useMemo(() => {
        // Map smoothness 0-100 to n: 2 (ellipse) to 8 (squirkle)
        return 2 + (smoothness / 100) * 6
    }, [smoothness])

    const size = 200
    const r = Math.max(0, Math.min(borderRadius, size / 2))
    const w = size
    const h = size
    const steps = 64

    // Superellipse parametric equation
    function superellipsePath(
        w: number,
        h: number,
        n: number,
        r: number,
        steps: number
    ) {
        // Use full dimensions for the main shape
        const a = w / 2 - r
        const b = h / 2 - r
        const cx = w / 2
        const cy = h / 2
        let d = ""
        for (let i = 0; i <= steps; i++) {
            const theta = (2 * Math.PI * i) / steps
            const cos =
                Math.sign(Math.cos(theta)) *
                Math.pow(Math.abs(Math.cos(theta)), 2 / n)
            const sin =
                Math.sign(Math.sin(theta)) *
                Math.pow(Math.abs(Math.sin(theta)), 2 / n)
            const x = cx + a * cos
            const y = cy + b * sin
            d += i === 0 ? `M${x},${y}` : `L${x},${y}`
        }
        d += "Z"
        return d
    }

    const path = useMemo(
        () => superellipsePath(w, h, n, r, steps),
        [w, h, n, r, steps, strokeEnabled, strokeWidth]
    )

    // Compute gradient id and transform with unique instance ID
    const gradientId = `squirkle-gradient-${uniqueId}`
    const radialGradientId = `radial-gradient-${uniqueId}`
    const imagePatternId = `image-pattern-${uniqueId}`
    const insideStrokeMaskId = `inside-stroke-mask-${uniqueId}`
    const backdropBlurMaskId = `backdrop-blur-mask-${uniqueId}`

    const angle = gradientAngle || 0
    // SVG gradient vector calculation
    const rad = (angle - 90) * (Math.PI / 180)
    const x1 = 0.5 + 0.5 * Math.cos(rad)
    const y1 = 0.5 + 0.5 * Math.sin(rad)
    const x2 = 0.5 + 0.5 * Math.cos(rad + Math.PI)
    const y2 = 0.5 + 0.5 * Math.sin(rad + Math.PI)

    // Calculate viewBox and transform based on stroke position
    const viewBoxSize = size
    const translateOffset = 0

    // Compute backdrop blur mask path for SVG

    // Only apply backdrop blur filter to the shape area, not the bounding box
    // Use SVG mask and a separate SVG for backdrop blur
    // Use a portal div for backdrop blur, masked to the shape

    // Render
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                ...style,
            }}
        >
            {/* Backdrop blur layer, masked to squirkle shape */}
            {backdropBlurEnabled && (
                <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${size} ${size}`}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                >
                    <defs>
                        <clipPath id={backdropBlurMaskId}>
                            <path d={path} />
                        </clipPath>
                    </defs>
                    <foreignObject x="0" y="0" width="100%" height="100%">
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                backdropFilter: `blur(${backdropBlurAmount}px)`,
                                WebkitBackdropFilter: `blur(${backdropBlurAmount}px)`,
                                WebkitClipPath: `url(#${backdropBlurMaskId})`,
                                clipPath: `url(#${backdropBlurMaskId})`,
                                pointerEvents: "none",
                            }}
                        />
                    </foreignObject>
                </svg>
            )}
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${size} ${size}`}
                style={{
                    display: "block",
                    filter: [
                        shadowEnabled
                            ? `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor})`
                            : "",
                        blurEnabled && !backdropBlurEnabled
                            ? `blur(${blurAmount}px)`
                            : "",
                    ]
                        .filter(Boolean)
                        .join(" "),
                    zIndex: 2,
                    position: "relative",
                }}
                aria-label="Squirkle shape"
                role="img"
            >
                {fillType === "gradient" && (
                    <defs>
                        <linearGradient
                            id={gradientId}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            gradientUnits="objectBoundingBox"
                        >
                            {typeof window === "undefined" ? null : (
                                <stop offset="0%" stopColor={gradientFrom} />
                            )}
                            {typeof window === "undefined" ? null : (
                                <stop offset="100%" stopColor={gradientTo} />
                            )}
                        </linearGradient>
                    </defs>
                )}
                {fillType === "radial" && (
                    <defs>
                        <radialGradient
                            id={radialGradientId}
                            cx="50%"
                            cy="50%"
                            r="50%"
                        >
                            {radialStops.map((stop, i) => (
                                <stop
                                    key={i}
                                    offset={`${stop.position}%`}
                                    stopColor={stop.color}
                                />
                            ))}
                        </radialGradient>
                    </defs>
                )}
                {fillType === "image" && (
                    <defs>
                        <pattern
                            id={imagePatternId}
                            patternUnits="objectBoundingBox"
                            width="1"
                            height="1"
                        >
                            <image
                                href={image.src}
                                width="100%"
                                height="100%"
                                preserveAspectRatio={
                                    imageFit === "cover"
                                        ? "xMidYMid slice"
                                        : imageFit === "contain"
                                          ? "xMidYMid meet"
                                          : imageFit === "fill"
                                            ? "none"
                                            : "xMidYMid meet"
                                }
                            />
                        </pattern>
                    </defs>
                )}
                {strokeEnabled && (
                    <defs>
                        <mask id={insideStrokeMaskId}>
                            <rect width="100%" height="100%" fill="black" />
                            <path d={path} fill="white" />
                        </mask>
                    </defs>
                )}
                <g
                    transform={`translate(${translateOffset}, ${translateOffset})`}
                >
                    <path
                        d={path}
                        fill={
                            fillType === "gradient"
                                ? `url(#${gradientId})`
                                : fillType === "radial"
                                  ? `url(#${radialGradientId})`
                                  : fillType === "image"
                                    ? `url(#${imagePatternId})`
                                    : fill
                        }
                        stroke="none"
                        strokeWidth={0}
                    />
                    {strokeEnabled && (
                        <path
                            d={path}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth * 2}
                            mask={`url(#${insideStrokeMaskId})`}
                            vectorEffect="non-scaling-stroke"
                            style={{ filter: "none" }}
                        />
                    )}
                </g>
            </svg>
        </div>
    )
}

addPropertyControls(Squirkle, {
    smoothness: {
        type: ControlType.Number,
        title: "Smoothness",
        min: 0,
        max: 100,
        defaultValue: 60,
        unit: "%",
        step: 1,
        displayStepper: false,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        defaultValue: 32,
        unit: "px",
        step: 1,
        displayStepper: false,
    },
    fillType: {
        type: ControlType.Enum,
        title: "Fill Type",
        options: ["solid", "gradient", "radial", "image"],
        optionTitles: ["Solid", "Gradient", "Radial Gradient", "Image"],
        defaultValue: "solid",
    },
    fill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#8855FF",
        hidden: ({ fillType }) =>
            fillType === "gradient" ||
            fillType === "radial" ||
            fillType === "image",
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "Gradient From",
        defaultValue: "#8754FF",
        hidden: ({ fillType }) => fillType !== "gradient",
    },
    gradientTo: {
        type: ControlType.Color,
        title: "Gradient To",
        defaultValue: "#2BE3ED",
        hidden: ({ fillType }) => fillType !== "gradient",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Angle",
        defaultValue: 90,
        min: 0,
        max: 360,
        step: 1,
        unit: "deg",
        hidden: ({ fillType }) => fillType !== "gradient",
    },
    radialStops: {
        type: ControlType.Array,
        title: "Radial Stops",
        control: {
            type: ControlType.Object,
            controls: {
                color: { type: ControlType.Color, defaultValue: "#8855FF" },
                position: {
                    type: ControlType.Number,
                    defaultValue: 0,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                },
            },
        },
        defaultValue: [
            { color: "#8855FF", position: 0 },
            { color: "#E354FF", position: 100 },
        ],
        maxCount: 4,
        hidden: ({ fillType }) => fillType !== "radial",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: ({ fillType }) => fillType !== "image",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill", "scale-down"],
        optionTitles: ["Cover", "Contain", "Fill", "Scale Down"],
        defaultValue: "cover",
        hidden: ({ fillType }) => fillType !== "image",
    },
    shadowEnabled: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0, 0, 0, 0.25)",
        hidden: ({ shadowEnabled }) => !shadowEnabled,
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 8,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        hidden: ({ shadowEnabled }) => !shadowEnabled,
    },
    shadowOffsetX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
        hidden: ({ shadowEnabled }) => !shadowEnabled,
    },
    shadowOffsetY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 4,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
        hidden: ({ shadowEnabled }) => !shadowEnabled,
    },
    strokeEnabled: {
        type: ControlType.Boolean,
        title: "Stroke",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#000000",
        hidden: ({ strokeEnabled }) => !strokeEnabled,
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 1,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
        hidden: ({ strokeEnabled }) => !strokeEnabled,
    },
    blurEnabled: {
        type: ControlType.Boolean,
        title: "Blur",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Use only one Blur control at a time.",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        hidden: ({ blurEnabled }) => !blurEnabled,
    },
    backdropBlurEnabled: {
        type: ControlType.Boolean,
        title: "Backdrop Blur",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Use only one Blur control at a time.",
    },
    backdropBlurAmount: {
        type: ControlType.Number,
        title: "Backdrop Blur Amount",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
        hidden: ({ backdropBlurEnabled }) => !backdropBlurEnabled,
    },
})
