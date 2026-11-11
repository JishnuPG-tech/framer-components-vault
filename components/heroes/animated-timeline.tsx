import { useLayoutEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, useReducedMotion } from "framer-motion"

// In-out so the line "travels"; matches the curve the dot timing below inverts
const EASE = [0.45, 0, 0.55, 1] as const

interface Step {
    label: string
    heading: string
    text: string
}

interface Props {
    title: string
    showTitle: boolean
    items: Step[]
    highlightLast: boolean
    duration: number
    delay: number
    showCard: boolean
    background: string
    borderColor: string
    radius: number
    padding: number
    gap: number
    textOffset: number
    dotSize: number
    lineWidth: number
    lineColor: string
    fillColor: string
    dotColor: string
    reachedColor: string
    lastDotColor: string
    labelColor: string
    headingColor: string
    textColor: string
    titleFont: CSSProperties
    labelFont: CSSProperties
    headingFont: CSSProperties
    textFont: CSSProperties
    style?: CSSProperties
}

/**
 * Route Timeline: a vertical path of steps. When it scrolls into view,
 * the line fills from the first dot to the last, once.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 440
 */
export default function RouteTimeline(props: Props) {
    const {
        title,
        showTitle,
        items,
        highlightLast,
        duration,
        delay,
        showCard,
        background,
        borderColor,
        radius,
        padding,
        gap,
        textOffset,
        dotSize,
        lineWidth,
        lineColor,
        fillColor,
        dotColor,
        reachedColor,
        lastDotColor,
        labelColor,
        headingColor,
        textColor,
        titleFont,
        labelFont,
        headingFont,
        textFont,
        style,
    } = props

    const steps = items ?? []
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const reduceMotion = useReducedMotion()
    const listRef = useRef<HTMLOListElement>(null)
    const inView = useInView(listRef, { once: true, amount: 0.4 })

    // Canvas and reduced motion show the finished state straight away
    const done = isCanvas || !!reduceMotion || inView
    const instant = isCanvas || !!reduceMotion

    // Dot centres, measured so the line runs exactly from the first dot to the last
    const dotTop = 4
    const [centers, setCenters] = useState<number[]>([])
    useLayoutEffect(() => {
        const list = listRef.current
        if (!list) return
        const measure = () => {
            // Steps only: the line itself also lives in the list and must not be measured
            const rows = Array.from(
                list.querySelectorAll(":scope > li")
            ) as HTMLElement[]
            setCenters(rows.map((row) => row.offsetTop + dotTop + dotSize / 2))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(list)
        return () => ro.disconnect()
    }, [steps.length, dotSize, gap])

    const first = centers[0] ?? 0
    const last = centers[centers.length - 1] ?? 0
    const span = Math.max(last - first, 0)
    // When the fill reaches each dot, as a share of the whole run
    const reach = (i: number) =>
        span > 0 ? ((centers[i] ?? first) - first) / span : 0
    // Inverse of the in-out curve, so each dot lights up as the line reaches it
    const at = (t: number) =>
        t < 0.5 ? Math.sqrt(t / 2) : 1 - Math.sqrt((1 - t) / 2)

    return (
        <div
            style={{
                ...style,
                boxSizing: "border-box",
                width: "100%",
                background: showCard ? background : "transparent",
                border: showCard ? `1px solid ${borderColor}` : "none",
                borderRadius: showCard ? radius : 0,
                padding: showCard ? padding : 0,
            }}
        >
            {showTitle && title && (
                <h3
                    style={{
                        margin: "0 0 18px",
                        color: headingColor,
                        fontSize: 20,
                        fontWeight: 600,
                        ...titleFont,
                    }}
                >
                    {title}
                </h3>
            )}

            <ol
                ref={listRef}
                style={{
                    position: "relative",
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                }}
            >
                {/* track + fill */}
                {steps.length > 1 && span > 0 && (
                    <span
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: dotSize / 2 - lineWidth / 2,
                            top: first,
                            height: span,
                            width: lineWidth,
                            background: lineColor,
                            borderRadius: lineWidth,
                        }}
                    >
                        <motion.span
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: fillColor,
                                borderRadius: lineWidth,
                                transformOrigin: "50% 0%",
                            }}
                            initial={false}
                            animate={{ scaleY: done ? 1 : 0 }}
                            transition={
                                instant
                                    ? { duration: 0 }
                                    : { duration, delay, ease: EASE }
                            }
                        />
                    </span>
                )}

                {steps.map((step, i) => {
                    const isLast = i === steps.length - 1
                    const solid = highlightLast && isLast
                    const dotDelay = delay + duration * at(reach(i))
                    // Once the line reaches a dot it fills and stays filled
                    const tone = solid
                        ? lastDotColor
                        : done
                          ? reachedColor
                          : null
                    return (
                        <li
                            key={i}
                            style={{
                                position: "relative",
                                paddingLeft: dotSize + textOffset,
                                paddingBottom: isLast ? 0 : gap,
                            }}
                        >
                            <motion.span
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: dotTop,
                                    width: dotSize,
                                    height: dotSize,
                                    boxSizing: "border-box",
                                    borderRadius: "50%",
                                    borderStyle: "solid",
                                    borderWidth: 1.5,
                                    zIndex: 1,
                                }}
                                initial={false}
                                animate={{
                                    backgroundColor: tone ?? dotColor,
                                    borderColor: tone ?? lineColor,
                                    scale: done && !instant ? [1, 1.25, 1] : 1,
                                }}
                                transition={
                                    instant
                                        ? { duration: 0 }
                                        : {
                                              duration: 0.45,
                                              delay: dotDelay,
                                              ease: "easeOut",
                                          }
                                }
                            />
                            {step.label && (
                                <span
                                    style={{
                                        display: "block",
                                        color: labelColor,
                                        fontSize: 12.5,
                                        fontWeight: 700,
                                        fontVariantNumeric: "tabular-nums",
                                        ...labelFont,
                                    }}
                                >
                                    {step.label}
                                </span>
                            )}
                            <span
                                style={{
                                    display: "block",
                                    marginTop: 2,
                                    color: headingColor,
                                    fontSize: 16,
                                    fontWeight: 600,
                                    ...headingFont,
                                }}
                            >
                                {step.heading}
                            </span>
                            {step.text && (
                                <span
                                    style={{
                                        display: "block",
                                        marginTop: 2,
                                        color: textColor,
                                        fontSize: 14.5,
                                        lineHeight: 1.5,
                                        ...textFont,
                                    }}
                                >
                                    {step.text}
                                </span>
                            )}
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}

const DEFAULT_ITEMS: Step[] = [
    {
        label: "2018",
        heading: "Web & graphic design",
        text: "Where I learned that type and colour are half the argument.",
    },
    {
        label: "2021",
        heading: "Product design",
        text: "Self-taught into the shift, then a year-long UX/UI certificate.",
    },
    {
        label: "Along the way",
        heading: "Two design systems",
        text: "One from scratch at an early startup, one restructured inside a live product.",
    },
    {
        label: "Along the way",
        heading: "Leading 0→1",
        text: "Steered a small team from early research to shipped interface.",
    },
    {
        label: "Now",
        heading: "Looking for a senior product role",
        text: "Somewhere research, craft and a bit of code all count.",
    },
]

RouteTimeline.defaultProps = {
    title: "The route so far",
    showTitle: true,
    items: DEFAULT_ITEMS,
    highlightLast: true,
    duration: 1.6,
    delay: 0.2,
    showCard: true,
    background: "#f6f6f4",
    borderColor: "#e8e8e4",
    radius: 28,
    padding: 32,
    gap: 22,
    textOffset: 28,
    dotSize: 12,
    lineWidth: 1.5,
    lineColor: "#c9c9c4",
    fillColor: "#111111",
    dotColor: "#ffffff",
    reachedColor: "#111111",
    lastDotColor: "#111111",
    labelColor: "#6a6a66",
    headingColor: "#111111",
    textColor: "#5c5c5c",
}

addPropertyControls(RouteTimeline, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "The route so far",
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "Show Title",
        defaultValue: true,
    },
    items: {
        type: ControlType.Array,
        title: "Steps",
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label" },
                heading: { type: ControlType.String, title: "Heading" },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    displayTextArea: true,
                },
            },
        },
    },
    highlightLast: {
        type: ControlType.Boolean,
        title: "Fill Last",
        defaultValue: true,
        description: "The last dot is solid in its own colour, for “Now”.",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.6,
        min: 0.2,
        max: 6,
        step: 0.1,
        unit: "s",
        description:
            "How long the line takes to reach the last dot. Plays once, when 40% of the list is in view.",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0.2,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    showCard: { type: ControlType.Boolean, title: "Card", defaultValue: true },
    background: {
        type: ControlType.Color,
        title: "Card Fill",
        defaultValue: "#f6f6f4",
        hidden: (p: Props) => !p.showCard,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "#e8e8e4",
        hidden: (p: Props) => !p.showCard,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 28,
        min: 0,
        max: 64,
        hidden: (p: Props) => !p.showCard,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 32,
        min: 0,
        max: 80,
        hidden: (p: Props) => !p.showCard,
    },
    gap: {
        type: ControlType.Number,
        title: "Step Gap",
        defaultValue: 22,
        min: 0,
        max: 80,
    },
    textOffset: {
        type: ControlType.Number,
        title: "Text Gap",
        defaultValue: 28,
        min: 8,
        max: 64,
        description: "Space between the dot and the text.",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot",
        defaultValue: 12,
        min: 6,
        max: 24,
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line",
        defaultValue: 1.5,
        min: 1,
        max: 4,
        step: 0.5,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: "#c9c9c4",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#111111",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Inside",
        defaultValue: "#ffffff",
    },
    reachedColor: {
        type: ControlType.Color,
        title: "Reached Dot",
        defaultValue: "#111111",
        description:
            "Dots fill with this colour as the line reaches them, and stay filled.",
    },
    lastDotColor: {
        type: ControlType.Color,
        title: "Last Dot",
        defaultValue: "#111111",
        hidden: (p: Props) => !p.highlightLast,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label",
        defaultValue: "#6a6a66",
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading",
        defaultValue: "#111111",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#5c5c5c",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 20, fontWeight: 600, lineHeight: "1.2em" },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 12.5, fontWeight: 700, lineHeight: "1.4em" },
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 16, fontWeight: 600, lineHeight: "1.35em" },
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14.5, fontWeight: 400, lineHeight: "1.5em" },
    },
})
