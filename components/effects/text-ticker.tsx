import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useTransform,
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

import { useMemo, useEffect, useRef, useState } from "react"

/**
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function TextOnPath(props) {
    const {
        text,
        texts,
        pathType,
        curveIntensity,
        font,
        color,
        animate,
        speed,
        direction,
        startOffset,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef(null)
    const [dimensions, setDimensions] = useState({ width: 400, height: 200 })

    useEffect(() => {
        if (!containerRef.current) return

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                })
            }
        })

        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    const { width, height } = dimensions
    const intensity = curveIntensity * 100

    const pathData = useMemo(() => {
        const midY = height / 2

        switch (pathType) {
            case "wave":
                return `M 0 ${midY} Q ${width * 0.25} ${midY - intensity} ${width * 0.5} ${midY} T ${width} ${midY}`
            case "arch":
                return `M 0 ${midY + intensity} Q ${width * 0.5} ${midY - intensity * 2} ${width} ${midY + intensity}`
            case "valley":
                return `M 0 ${midY - intensity} Q ${width * 0.5} ${midY + intensity * 2} ${width} ${midY - intensity}`
            case "circle":
                return `M 0 ${midY + intensity} A ${width / 2} ${intensity * 2} 0 0 1 ${width} ${midY + intensity}`
            default:
                return `M 0 ${midY} L ${width} ${midY}`
        }
    }, [pathType, intensity, width, height])

    const pathId = useMemo(
        () => `text-path-${Math.random().toString(36).substr(2, 9)}`,
        []
    )

    const baseOffset = useMotionValue(startOffset)

    useAnimationFrame((t, delta) => {
        if (
            !animate ||
            RenderTarget.current() === RenderTarget.thumbnail ||
            isStatic
        )
            return

        const dt = Math.min(delta, 60)
        const moveAmount = (dt / 1000) * speed * (direction === "left" ? -1 : 1)
        let current = baseOffset.get() + moveAmount

        if (current >= 100) current = current - 100
        else if (current < 0) current = current + 100

        baseOffset.set(current)
    })

    useEffect(() => {
        if (!animate) {
            baseOffset.set(startOffset)
        }
    }, [startOffset, animate])

    const content = useMemo(() => {
        if (texts && texts.length > 0) return texts
        return [text]
    }, [texts, text])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                transform: "translateZ(0)",
                position: "relative",
            }}
        >
            <div
                style={{
                    opacity: 0,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    padding: `${intensity * 2}px 20px`,
                    ...font,
                    minWidth: "1em",
                    minHeight: "1em",
                    userSelect: "none",
                }}
                aria-hidden="true"
            >
                {content.join("   ")}
            </div>
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                style={{
                    overflow: "visible",
                    position: "absolute",
                    left: 0,
                    top: 0,
                }}
                shapeRendering="geometricPrecision"
            >
                <defs>
                    <path id={pathId} d={pathData} />
                </defs>
                <text
                    width={width}
                    style={{
                        fill: color,
                        ...font,
                        whiteSpace: "pre",
                    }}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    textRendering="optimizeSpeed"
                >
                    {isStatic
                        ? content.map((itemText, itemIndex) => (
                              <textPath
                                  key={`static-${itemIndex}`}
                                  href={`#${pathId}`}
                                  startOffset={`${(startOffset + (itemIndex * 100) / content.length).toFixed(3)}%`}
                                  style={{
                                      fill: color,
                                      ...font,
                                  }}
                              >
                                  {itemText}
                              </textPath>
                          ))
                        : [-1, 0, 1].map((setIndex) =>
                              content.map((itemText, itemIndex) => (
                                  <TickerItem
                                      key={`${setIndex}-${itemIndex}`}
                                      baseOffset={baseOffset}
                                      initialOffset={
                                          (itemIndex * 100) / content.length +
                                          setIndex * 100
                                      }
                                      pathId={pathId}
                                      text={itemText}
                                      font={font}
                                      color={color}
                                      aria-hidden={setIndex !== 0}
                                  />
                              ))
                          )}
                </text>
            </svg>
        </div>
    )
}

function TickerItem({
    baseOffset,
    initialOffset,
    pathId,
    text,
    font,
    color,
    ...props
}) {
    const offset = useTransform(
        baseOffset,
        (v) => `${(v + initialOffset).toFixed(3)}%`
    )
    return (
        <motion.textPath
            href={`#${pathId}`}
            startOffset={offset}
            style={{
                fill: color,
                ...font,
            }}
            {...props}
        >
            {text}
        </motion.textPath>
    )
}

addPropertyControls(TextOnPath, {
    texts: {
        type: ControlType.Array,
        title: "Texts",
        control: {
            type: ControlType.String,
        },
        defaultValue: ["Ticker Item 1", "Ticker Item 2", "Ticker Item 3"],
    },
    text: {
        type: ControlType.String,
        title: "Legacy Text",
        defaultValue: "Curved Text Animation",
        hidden: (props) => props.texts && props.texts.length > 0,
    },
    pathType: {
        type: ControlType.Enum,
        title: "Path Shape",
        options: ["wave", "arch", "valley", "circle"],
        optionTitles: ["Wave", "Arch", "Valley", "Circle"],
        defaultValue: "wave",
    },
    curveIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Bold",
            textAlign: "center",
        },
    },
    startOffset: {
        type: ControlType.Number,
        title: "Offset",
        defaultValue: 50,
        min: -100,
        max: 200,
        unit: "%",
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 10,
        min: 0,
        max: 100,
        hidden: (props) => !props.animate,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        defaultValue: "right",
        displaySegmentedControl: true,
        hidden: (props) => !props.animate,
    },
})
