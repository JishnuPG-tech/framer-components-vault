import { useRef, useState, useEffect, useId, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

interface PrismTextRevealProps {
    text: string
    mode: "stroke" | "fill"
    duration: number
    smoothness: number
    strokeColor: string
    strokeWidth: number
    revealRadius: number
    colors: string[]
    animateGradient: boolean
    flowSpeed: number
    glow: boolean
    glowIntensity: number
    fillOpacity: number
    fillOpacityHover: number
    font: CSSProperties
    style?: CSSProperties
}

/**
 * Prism Text Reveal
 *
 * Reveals gradient text (stroke or fill) through a radial mask
 * that follows the cursor on hover.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PrismTextReveal(props: PrismTextRevealProps) {
    const isStatic = useIsStaticRenderer()
    const {
        text,
        mode,
        duration,
        smoothness,
        strokeColor,
        strokeWidth,
        revealRadius,
        colors,
        animateGradient,
        flowSpeed,
        glow,
        glowIntensity,
        fillOpacity,
        fillOpacityHover,
        font,
        style,
    } = props
    const svgRef = useRef<SVGSVGElement>(null)
    const [cursor, setCursor] = useState({ x: 0, y: 0 })
    const [hovered, setHovered] = useState(false)
    const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" })
    const id = useId()
    const gradientId = `textGradient${id}`
    const maskGradientId = `revealMask${id}`
    const maskId = `textMask${id}`
    const glowId = `glow${id}`
    const isFill = mode === "fill"
    const useAnimatedGradient = animateGradient && !isStatic

    useEffect(() => {
        if (isStatic) return
        if (svgRef.current && cursor.x !== null) {
            const rect = svgRef.current.getBoundingClientRect()
            const cx = ((cursor.x - rect.left) / rect.width) * 100
            const cy = ((cursor.y - rect.top) / rect.height) * 100
            setMaskPosition({ cx: `${cx}%`, cy: `${cy}%` })
        }
    }, [cursor, isStatic])

    const stops = colors && colors.length > 0 ? colors : ["#eab308", "#ef4444", "#3b82f6", "#06b6d4", "#8b5cf6"]

    // Higher smoothness loosens the spring so the mask trails the cursor
    const maskTransition =
        smoothness > 0
            ? {
                  type: "spring" as const,
                  stiffness: 500 - smoothness * 450,
                  damping: 50 - smoothness * 25,
                  mass: 0.5 + smoothness,
              }
            : { duration, ease: "easeOut" as const }

    const textProps = {
        x: "50%",
        y: "50%",
        textAnchor: "middle" as const,
        dominantBaseline: "middle" as const,
        fontFamily: font?.fontFamily ?? "Inter, sans-serif",
        fontWeight: (font?.fontWeight as any) ?? 700,
        fontSize: font?.fontSize ?? 96,
        letterSpacing: font?.letterSpacing,
    }

    const gradientStops = stops.map((color, i) => (
        <stop key={i} offset={`${(i / Math.max(stops.length - 1, 1)) * 100}%`} stopColor={color} />
    ))

    // Gradient stops are always rendered; the reveal fades in/out via
    // opacity so leaving hover doesn't cut the gradient off abruptly
    const revealedText = (
        <text
            {...textProps}
            stroke={isFill ? "none" : `url(#${gradientId})`}
            strokeWidth={isFill ? 0 : strokeWidth}
            fill={isFill ? `url(#${gradientId})` : "transparent"}
            mask={isStatic ? undefined : `url(#${maskId})`}
        >
            {text}
        </text>
    )

    return (
        <div style={{ width: "100%", height: "100%", ...style }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                viewBox="0 0 600 200"
                xmlns="http://www.w3.org/2000/svg"
                onMouseEnter={isStatic ? undefined : () => setHovered(true)}
                onMouseLeave={isStatic ? undefined : () => setHovered(false)}
                onMouseMove={isStatic ? undefined : (e) => setCursor({ x: e.clientX, y: e.clientY })}
                style={{ userSelect: "none", display: "block", overflow: "visible" }}
            >
                <defs>
                    {useAnimatedGradient ? (
                        <motion.linearGradient
                            id={gradientId}
                            gradientUnits="userSpaceOnUse"
                            x1="0"
                            y1="0"
                            x2="600"
                            y2="0"
                            animate={{
                                gradientTransform: ["rotate(0 300 100)", "rotate(360 300 100)"],
                            }}
                            transition={{
                                duration: Math.max(11 - flowSpeed, 1),
                                ease: "linear",
                                repeat: Infinity,
                            }}
                        >
                            {gradientStops}
                        </motion.linearGradient>
                    ) : (
                        <linearGradient
                            id={gradientId}
                            gradientUnits="userSpaceOnUse"
                            x1="0"
                            y1="0"
                            x2="600"
                            y2="0"
                            gradientTransform="rotate(0 300 100)"
                        >
                            {gradientStops}
                        </linearGradient>
                    )}
                    {!isStatic && (
                        <>
                            <motion.radialGradient
                                id={maskGradientId}
                                gradientUnits="userSpaceOnUse"
                                r={`${revealRadius}%`}
                                initial={{ cx: "50%", cy: "50%" }}
                                animate={maskPosition}
                                transition={maskTransition}
                            >
                                <stop offset="0%" stopColor="white" />
                                <stop offset="100%" stopColor="black" />
                            </motion.radialGradient>
                            <mask id={maskId}>
                                <rect x="0" y="0" width="100%" height="100%" fill={`url(#${maskGradientId})`} />
                            </mask>
                        </>
                    )}
                    {glow && (
                        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation={glowIntensity} result="blur" />
                        </filter>
                    )}
                </defs>
                {isFill ? (
                    <text
                        {...textProps}
                        fill={strokeColor}
                        style={{
                            opacity: isStatic ? fillOpacity : hovered ? fillOpacityHover : fillOpacity,
                            transition: isStatic ? "none" : "opacity 0.3s",
                        }}
                    >
                        {text}
                    </text>
                ) : (
                    <>
                        <text
                            {...textProps}
                            strokeWidth={strokeWidth}
                            stroke={strokeColor}
                            fill="transparent"
                            style={{
                                opacity: isStatic ? 0 : hovered ? 0.7 : 0,
                                transition: isStatic ? "none" : "opacity 0.3s",
                            }}
                        >
                            {text}
                        </text>
                        {isStatic ? (
                            <text {...textProps} strokeWidth={strokeWidth} stroke={strokeColor} fill="transparent">
                                {text}
                            </text>
                        ) : (
                            <motion.text
                                {...textProps}
                                strokeWidth={strokeWidth}
                                stroke={strokeColor}
                                fill="transparent"
                                initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
                                animate={{ strokeDashoffset: 0, strokeDasharray: 1000 }}
                                transition={{ duration: 4, ease: "easeInOut" }}
                            >
                                {text}
                            </motion.text>
                        )}
                    </>
                )}
                {isStatic ? (
                    <g>
                        {glow && <g filter={`url(#${glowId})`}>{revealedText}</g>}
                        {revealedText}
                    </g>
                ) : (
                    <motion.g animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
                        {glow && <g filter={`url(#${glowId})`}>{revealedText}</g>}
                        {revealedText}
                    </motion.g>
                )}
            </svg>
        </div>
    )
}

addPropertyControls(PrismTextReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "HOVER",
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["stroke", "fill"],
        optionTitles: ["Stroke", "Fill"],
        defaultValue: "stroke",
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 96, fontWeight: 700 } as any,
    },
    smoothness: {
        type: ControlType.Number,
        title: "Smoothness",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        description: "0 = plain easing (uses Duration), >0 = springy follow",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0,
        min: 0,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: (props: any) => props.smoothness > 0,
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#404040",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: true,
        hidden: (props: any) => props.mode === "fill",
    },
    fillOpacity: {
        type: ControlType.Number,
        title: "Idle Opacity",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props: any) => props.mode !== "fill",
    },
    fillOpacityHover: {
        type: ControlType.Number,
        title: "Hover Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props: any) => props.mode !== "fill",
    },
    revealRadius: {
        type: ControlType.Number,
        title: "Reveal Size",
        defaultValue: 20,
        min: 5,
        max: 100,
        step: 1,
        unit: "%",
    },
    colors: {
        type: ControlType.Array,
        title: "Gradient",
        control: { type: ControlType.Color },
        defaultValue: ["#eab308", "#ef4444", "#3b82f6", "#06b6d4", "#8b5cf6"],
    },
    animateGradient: {
        type: ControlType.Boolean,
        title: "Animate Colors",
        defaultValue: false,
    },
    flowSpeed: {
        type: ControlType.Number,
        title: "Flow Speed",
        defaultValue: 5,
        min: 1,
        max: 10,
        step: 1,
        hidden: (props: any) => !props.animateGradient,
    },
    glow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: false,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
        hidden: (props: any) => !props.glow,
    },
})
