// Fully customizable animated circle with seamless rotating light trail and gradient-aligned arc
// Features: editable radii, stroke colors/widths, text, font, alignment, trail color/width, animation speed, solid/dashed trail, responsive sizing, gradient trail support with rotating gradient
import { useRef, useEffect, useState, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CircleProgressProps {
    mainStroke: number
    mainStrokeColor: string
    topText: string
    bottomText: string
    font: any
    textColor: string
    textAlign: "center" | "left" | "right"
    gap: number
    textGap: number
    trailStroke: number
    trailColor: string
    trailTrackColor: string
    trailSpeed: number
    trailLength: number
    trailSolid: boolean
    trailStartAngle: number
    trailDirection: "clockwise" | "counterclockwise"
    background: string
    innerBackground: string
    style?: React.CSSProperties
}

/**
 * CircleProgress
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CircleProgress(props: CircleProgressProps) {
    const {
        mainStroke,
        mainStrokeColor,
        topText,
        bottomText,
        font,
        textColor,
        textAlign,
        gap,
        trailStroke,
        trailColor,
        trailTrackColor,
        trailSpeed,
        trailLength,
        trailSolid,
        trailStartAngle,
        background,
        innerBackground,
        textGap,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [angle, setAngle] = useState(0)
    const requestRef = useRef<number>()
    const prevTimestamp = useRef<number>()

    // Responsive sizing
    const width =
        style?.width && typeof style.width === "number" ? style.width : 200
    const height =
        style?.height && typeof style.height === "number" ? style.height : 200
    const size = Math.min(Number(width), Number(height))
    const center = size / 2

    // Responsive gap logic: as gap increases, main circle shrinks to maintain fixed distance
    const trailR = center - trailStroke / 2
    const mainR = Math.max(10, trailR - gap - mainStroke / 2)

    // Trail animation
    useEffect(() => {
        if (isStatic) return
        let running = true
        function animate(ts: number) {
            if (!running) return
            if (prevTimestamp.current === undefined) prevTimestamp.current = ts
            const dt = ts - prevTimestamp.current
            prevTimestamp.current = ts
            // trailSpeed: degrees per second
            startTransition(() =>
                setAngle((a) => (a + (trailSpeed * dt) / 1000) % 360)
            )
            requestRef.current = requestAnimationFrame(animate)
        }
        requestRef.current = requestAnimationFrame(animate)
        return () => {
            running = false
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            prevTimestamp.current = undefined
        }
    }, [trailSpeed, isStatic])

    // Trail arc calculations with custom start/end angles
    const trailCirc = 2 * Math.PI * trailR
    // Animate trail as a seamless progress arc
    // trailStartAngle: where the trail starts (deg)
    // trailLength: how many degrees the trail covers
    // angle: animation offset
    const direction = props.trailDirection === "counterclockwise" ? -1 : 1
    const animatedStart = (trailStartAngle + direction * angle + 360) % 360
    const animatedEnd = (animatedStart + direction * trailLength + 360) % 360
    // Always draw the arc in the positive direction
    function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
        const rad = ((deg - 90) * Math.PI) / 180
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad),
        }
    }
    function describeArc(
        cx: number,
        cy: number,
        r: number,
        start: number,
        end: number
    ) {
        // Handles wrapping over 360
        let sweep = end - start
        if (sweep < 0) sweep += 360
        const largeArc = sweep > 180 ? 1 : 0
        const startPt = polarToCartesian(cx, cy, r, end)
        const endPt = polarToCartesian(cx, cy, r, start)
        return [
            "M",
            startPt.x,
            startPt.y,
            "A",
            r,
            r,
            0,
            largeArc,
            0,
            endPt.x,
            endPt.y,
        ].join(" ")
    }
    // Trail track is a full circle
    const trailTrackPath = useMemo(() => {
        return describeArc(center, center, trailR, 0, 359.999)
    }, [center, trailR])
    // Animated trail arc
    const arcPath = useMemo(() => {
        return describeArc(center, center, trailR, animatedStart, animatedEnd)
    }, [center, trailR, animatedStart, animatedEnd])
    // For solid: use path, for dashed: use strokeDasharray
    let arcLen = (trailLength / 360) * trailCirc
    const dashArray = useMemo(() => {
        if (trailSolid) return undefined
        // Segmented: dash = 1/3 arc, gap = 2/3 arc
        return `${arcLen / 3},${(arcLen * 2) / 3}`
    }, [arcLen, trailSolid])

    // Text alignment
    const textAnchor =
        textAlign === "center"
            ? "middle"
            : textAlign === "left"
              ? "start"
              : "end"
    const textX = center
    const fontSize = parseFloat(font?.fontSize || 24)
    const textY = center

    // Gradient support for trailColor only, with gradient direction matching arc
    // If trailColor starts with 'linear-gradient', parse and create SVG gradient
    const [trailStrokePaint, trailGradientDef] = useMemo(() => {
        if (trailColor && trailColor.startsWith("linear-gradient")) {
            // Example: linear-gradient(90, #00F0FF, #00F0FF00)
            const match = trailColor.match(/linear-gradient\(([^,]+),(.+)\)/)
            if (!match) return [trailColor, null]
            let angle = parseFloat(match[1])
            if (isNaN(angle)) angle = 0
            // Instead of using the angle from the string, use the animated arc's direction
            // The gradient should go from the arc's start to end
            const startAngle = animatedStart
            const endAngle = animatedEnd
            const startPt = polarToCartesian(center, center, trailR, startAngle)
            const endPt = polarToCartesian(center, center, trailR, endAngle)
            const gradId = `trailGrad-${Math.random().toString(36).substr(2, 9)}`
            const stops = match[2].split(",").map((s) => s.trim())
            const def = (
                <linearGradient
                    id={gradId}
                    gradientUnits="userSpaceOnUse"
                    x1={startPt.x}
                    y1={startPt.y}
                    x2={endPt.x}
                    y2={endPt.y}
                >
                    {stops.map((stop, i) => (
                        <stop
                            key={i}
                            offset={`${(i / (stops.length - 1)) * 100}%`}
                            stopColor={stop}
                        />
                    ))}
                </linearGradient>
            )
            return [`url(#${gradId})`, def]
        }
        return [trailColor, null]
    }, [trailColor, animatedStart, animatedEnd, center, trailR])

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                background: background,
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${size} ${size}`}
                style={{ display: "block" }}
            >
                {trailGradientDef && <defs>{trailGradientDef}</defs>}
                {/* Trail Track (static background arc) */}
                <path
                    d={trailTrackPath}
                    fill="none"
                    stroke={trailTrackColor}
                    strokeWidth={trailStroke}
                    strokeLinecap="round"
                    style={{ opacity: 0.25 }}
                />
                {/* Animated Trail */}
                <path
                    d={arcPath}
                    fill="none"
                    stroke={trailStrokePaint}
                    strokeWidth={trailStroke}
                    strokeDasharray={dashArray}
                    strokeLinecap="round"
                    style={{ opacity: 0.9 }}
                />
                {/* Main Circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={mainR}
                    fill={innerBackground}
                    stroke={mainStrokeColor}
                    strokeWidth={mainStroke}
                />
                {/* Text */}
                {(topText || bottomText) && (
                    <g>
                        {topText && (
                            <text
                                key="top"
                                x={textX}
                                y={textY - textGap / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={textColor}
                                style={{
                                    fontSize: font?.fontSize || 24,
                                    fontWeight: font?.variant || "bold",
                                    fontFamily: font?.fontFamily,
                                    letterSpacing: font?.letterSpacing,
                                    lineHeight: font?.lineHeight,
                                    ...font,
                                    pointerEvents: "none",
                                    userSelect: "none",
                                }}
                            >
                                {topText}
                            </text>
                        )}
                        {bottomText && (
                            <text
                                key="bottom"
                                x={textX}
                                y={textY + textGap / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={textColor}
                                style={{
                                    fontSize: font?.fontSize || 24,
                                    fontWeight: font?.variant || "bold",
                                    fontFamily: font?.fontFamily,
                                    letterSpacing: font?.letterSpacing,
                                    lineHeight: font?.lineHeight,
                                    ...font,
                                    pointerEvents: "none",
                                    userSelect: "none",
                                }}
                            >
                                {bottomText}
                            </text>
                        )}
                    </g>
                )}
            </svg>
        </div>
    )
}

addPropertyControls(CircleProgress, {
    mainStroke: {
        type: ControlType.Number,
        title: "Main Stroke",
        defaultValue: 8,
        min: 1,
        max: 32,
        step: 1,
    },
    mainStrokeColor: {
        type: ControlType.Color,
        title: "Main Stroke Color",
        defaultValue: "#222222FF",
    },
    topText: {
        type: ControlType.String,
        title: "Top Text",
        defaultValue: "Top",
    },
    bottomText: {
        type: ControlType.String,
        title: "Bottom Text",
        defaultValue: "Bottom",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000FF",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["center", "left", "right"],
        optionTitles: ["Center", "Left", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 6,
        min: 0,
        max: 40,
        step: 1,
    },
    textGap: {
        type: ControlType.Number,
        title: "Text Gap",
        defaultValue: 36,
        min: 4,
        max: 120,
        step: 1,
    },
    trailStroke: {
        type: ControlType.Number,
        title: "Trail Stroke",
        defaultValue: 6,
        min: 1,
        max: 32,
        step: 1,
    },
    // 👇 Updated to ControlType.Color, as Framer requested
    trailColor: {
        type: ControlType.Color,
        title: "Trail Color",
        defaultValue: "#00F0FF",
    },
    trailTrackColor: {
        type: ControlType.Color,
        title: "Trail Track Color",
        defaultValue: "#B0B0B0FF",
    },
    trailSpeed: {
        type: ControlType.Number,
        title: "Trail Speed",
        defaultValue: 120,
        min: 10,
        max: 720,
        step: 1,
        unit: "deg/s",
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        defaultValue: 90,
        min: 5,
        max: 360,
        step: 1,
        unit: "deg",
    },
    trailSolid: {
        type: ControlType.Boolean,
        title: "Trail Solid",
        defaultValue: true,
        enabledTitle: "Solid",
        disabledTitle: "Dashed",
    },
    trailStartAngle: {
        type: ControlType.Number,
        title: "Trail Start Angle",
        defaultValue: 0,
        min: 0,
        max: 359,
        step: 1,
        unit: "deg",
    },
    trailDirection: {
        type: ControlType.Enum,
        title: "Trail Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Counterclockwise"],
        defaultValue: "clockwise",
        displaySegmentedControl: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFFFF",
    },
    innerBackground: {
        type: ControlType.Color,
        title: "Inner Background",
        defaultValue: "#FFFFFFFF",
    },
})
