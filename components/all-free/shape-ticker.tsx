import { useState, useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function TextFollowPath(props) {
    const {
        text,
        repeatCount,
        gap,
        pathData,
        fontSize,
        fontFamily,
        fontWeight,
        letterSpacing,
        textColor,
        bgColor,
        bgWidth,
        showPath,
        animate,
        speed,
        direction,
    } = props

    const pathId = "curve-path"
    const isStatic = useIsStaticRenderer()
    const [offset, setOffset] = useState(0)
    const frameRef = useRef(null)

    useEffect(() => {
        if (!animate || isStatic) return

        const step = () => {
            setOffset((prev) => {
                let next = direction === "forward" ? prev + speed : prev - speed
                if (next > 100) next -= 100
                if (next < 0) next += 100
                return next
            })
            frameRef.current = requestAnimationFrame(step)
        }

        frameRef.current = requestAnimationFrame(step)
        return () => cancelAnimationFrame(frameRef.current)
    }, [animate, speed, direction, isStatic])

    const secondOffset = offset - 100

    const renderTspans = () =>
        Array.from({ length: repeatCount }).map((_, i) => (
            <tspan key={i}>
                <tspan dx={i === 0 ? 0 : gap}>{text}</tspan>
                <tspan dx={gap}>✦</tspan>
            </tspan>
        ))

    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 -160 1246 570"
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: "visible" }}
        >
            <path
                d={pathData}
                fill="none"
                stroke={bgColor}
                strokeWidth={bgWidth}
                strokeLinecap="round"
            />
            <path
                id={pathId}
                d={pathData}
                fill="none"
                stroke={showPath ? "#cccccc" : "transparent"}
                strokeWidth={showPath ? 1 : 0}
            />
            <text
                fontSize={fontSize}
                fontFamily={fontFamily}
                fontWeight={fontWeight}
                letterSpacing={letterSpacing}
                fill={textColor}
            >
                <textPath href={`#${pathId}`} startOffset={`${offset}%`}>
                    {renderTspans()}
                </textPath>
            </text>
            <text
                fontSize={fontSize}
                fontFamily={fontFamily}
                fontWeight={fontWeight}
                letterSpacing={letterSpacing}
                fill={textColor}
            >
                <textPath href={`#${pathId}`} startOffset={`${secondOffset}%`}>
                    {renderTspans()}
                </textPath>
            </text>
        </svg>
    )
}

addPropertyControls(TextFollowPath, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "HELLO WORLD",
    },
    repeatCount: {
        type: ControlType.Number,
        title: "Repeats",
        defaultValue: 3,
        min: 1,
        max: 20,
        step: 1,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 150,
        unit: "px",
    },
    pathData: {
        type: ControlType.String,
        title: "Path",
        defaultValue:
            "M 0 125.235 C 0 125.235 280.91 -156.491 624 125.156 C 967.09 406.804 1246 99.453 1246 99.453",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 60,
        min: 8,
        max: 200,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        options: ["300", "400", "500", "600", "700", "800"],
        optionTitles: [
            "Light",
            "Regular",
            "Medium",
            "Semibold",
            "Bold",
            "Extrabold",
        ],
        defaultValue: "700",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -5,
        max: 20,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#3d2b1f",
    },
    bgColor: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "#FBD38D",
    },
    bgWidth: {
        type: ControlType.Number,
        title: "BG Width",
        defaultValue: 30,
        min: 0,
        max: 200,
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.15,
        min: 0.02,
        max: 2,
        step: 0.01,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["forward", "backward"],
        optionTitles: ["Forward", "Backward"],
        defaultValue: "forward",
    },
    showPath: {
        type: ControlType.Boolean,
        title: "Show Path",
        defaultValue: false,
    },
})
