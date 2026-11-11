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

import { animate, useMotionValue } from "framer-motion"

type Transition = {
    type?: "spring" | "tween" | "inertia"
    stiffness?: number
    damping?: number
    mass?: number
    duration?: number
    ease?: string | number[]
}

interface InfiniteTextWheelProps {
    items: string[]
    font: React.CSSProperties
    color: string
    arrowIcon?: React.ReactNode
    arrowColor: string
    arrowSize: number
    arrowGap: number
    sideGap: number
    topGap: number
    bottomGap: number
    rowGap: number
    curve: number
    transition: Transition
    style?: React.CSSProperties
}

type WheelViewHandlers = {
    onWheel?: React.WheelEventHandler<HTMLDivElement>
    onPointerDown?: React.PointerEventHandler<HTMLDivElement>
    onPointerMove?: React.PointerEventHandler<HTMLDivElement>
    onPointerUp?: React.PointerEventHandler<HTMLDivElement>
    onPointerCancel?: React.PointerEventHandler<HTMLDivElement>
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
}

const defaultItems = [
    "Olivia Rodrigo",
    "Doja Cat",
    "The Weeknd",
    "Travis Scott",
    "Drake",
    "Post Malone",
    "SZA",
    "Dua Lipa",
    "Ariana Grande",
    "Lana Del Rey",
    "Bad Bunny",
    "ROSALÍA",
    "Karol G",
    "Kendrick Lamar",
    "Kanye West (Ye)",
    "Ice Spice",
    "Metro Boomin",
    "21 Savage",
    "Future",
    "Lil Nas X",
    "Tyler, The Creator",
    "Frank Ocean",
    "Joji",
    "Steve Lacy",
    "Tate McRae",
    "Charli XCX",
    "Fred again..",
    "Peggy Gou",
]

const visibleRadius = 8

function modulo(value: number, divisor: number) {
    return ((value % divisor) + divisor) % divisor
}

function getItems(items: string[] = defaultItems) {
    const safeItems = items.filter((item) => item.trim().length > 0)
    return safeItems.length > 0 ? safeItems : defaultItems
}

function fontValueToPixels(
    value: React.CSSProperties["fontSize"],
    fallback: number,
    relativeTo = fallback
) {
    if (typeof value === "number") return value
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value)
        if (!Number.isFinite(parsed)) return fallback
        if (value.endsWith("em") || (!/[a-z%]/i.test(value) && parsed <= 3)) {
            return relativeTo * parsed
        }
        if (value.endsWith("%")) return relativeTo * (parsed / 100)
        return parsed
    }
    return fallback
}

function DefaultArrow({ color, size }: { color: string; size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path d="M7 4L19 12L7 20V4Z" fill={color} />
        </svg>
    )
}

function ArrowGraphic({
    customIcon,
    color,
    size,
}: {
    customIcon?: React.ReactNode
    color: string
    size: number
}) {
    if (React.isValidElement(customIcon)) {
        const customStyle =
            (customIcon.props as { style?: React.CSSProperties }).style || {}

        return React.cloneElement(
            customIcon as React.ReactElement<{ style?: React.CSSProperties }>,
            {
                style: {
                    ...customStyle,
                    width: "100%",
                    height: "100%",
                },
            }
        )
    }

    return <DefaultArrow color={color} size={size} />
}

function WheelView({
    props,
    renderedPosition,
    interactive,
    handlers = {},
}: {
    props: InfiniteTextWheelProps
    renderedPosition: number
    interactive: boolean
    handlers?: WheelViewHandlers
}) {
    const {
        items = defaultItems,
        font,
        color,
        arrowIcon,
        arrowColor,
        arrowSize,
        arrowGap,
        sideGap,
        topGap,
        bottomGap,
        rowGap,
        curve,
        style,
    } = props

    const values = getItems(items)
    const fontSize = fontValueToPixels(font?.fontSize, 46)
    const lineHeight = fontValueToPixels(font?.lineHeight, fontSize, fontSize)
    const rowHeight = Math.max(1, lineHeight + rowGap)
    const baseIndex = Math.round(renderedPosition)
    const fraction = renderedPosition - baseIndex
    const selectedTextLeft = sideGap + arrowSize + arrowGap
    const baseTextLeft = selectedTextLeft - curve

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                touchAction: interactive ? "none" : undefined,
                userSelect: "none",
                cursor: interactive ? "ns-resize" : undefined,
                ...style,
            }}
            role="listbox"
            aria-label={`Selected item: ${values[modulo(baseIndex, values.length)]}`}
            tabIndex={interactive ? 0 : undefined}
            {...handlers}
        >
            <div
                style={{
                    position: "absolute",
                    top: topGap,
                    right: 0,
                    bottom: bottomGap,
                    left: 0,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        top: "50%",
                        left: sideGap,
                        width: arrowSize,
                        height: arrowSize,
                        transform: "translateY(-50%)",
                        display: "grid",
                        placeItems: "center",
                        pointerEvents: "none",
                    }}
                >
                    <ArrowGraphic
                        customIcon={arrowIcon}
                        color={arrowColor}
                        size={arrowSize}
                    />
                </div>

                {Array.from(
                    { length: visibleRadius * 2 + 1 },
                    (_, rowIndex) => {
                        const slot = rowIndex - visibleRadius
                        const offset = slot - fraction
                        const distance = Math.abs(offset)
                        const itemIndex = modulo(
                            baseIndex + slot,
                            values.length
                        )
                        const curveStrength = Math.exp(
                            -0.5 * (distance / 2.05) ** 2
                        )
                        const curveX = curveStrength * curve
                        const scale = 0.94 + curveStrength * 0.075
                        const opacity = Math.max(0.72, 1 - distance * 0.025)

                        return (
                            <div
                                key={rowIndex}
                                role="option"
                                aria-selected={slot === 0}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: baseTextLeft,
                                    width: "max-content",
                                    maxWidth: `calc(100% - ${baseTextLeft + sideGap}px)`,
                                    overflow: "hidden",
                                    color,
                                    opacity,
                                    textAlign: "left",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    transform: `translate3d(${curveX}px, calc(${offset} * ${rowHeight}px - 50%), 0) scale(${scale})`,
                                    transformOrigin: "left center",
                                    willChange: interactive
                                        ? "transform, opacity"
                                        : undefined,
                                    ...font,
                                }}
                            >
                                {values[itemIndex]}
                            </div>
                        )
                    }
                )}
            </div>
        </div>
    )
}

function StaticTextWheel(props: InfiniteTextWheelProps) {
    return <WheelView props={props} renderedPosition={0} interactive={false} />
}

function AnimatedTextWheel(props: InfiniteTextWheelProps) {
    const { transition } = props
    const position = useMotionValue(0)
    const [renderedPosition, setRenderedPosition] = React.useState(0)
    const targetRef = React.useRef(0)
    const animationRef = React.useRef<{ stop: () => void } | null>(null)
    const settleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    )
    const pointerYRef = React.useRef<number | null>(null)

    React.useEffect(() => {
        return position.on("change", setRenderedPosition)
    }, [position])

    React.useEffect(() => {
        return () => {
            animationRef.current?.stop()
            if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
        }
    }, [])

    const animateTo = React.useCallback(
        (nextPosition: number) => {
            animationRef.current?.stop()
            animationRef.current = animate(
                position,
                nextPosition,
                transition as any
            )
        },
        [position, transition]
    )

    const settle = React.useCallback(
        (delay = 90) => {
            if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
            settleTimerRef.current = setTimeout(() => {
                targetRef.current = Math.round(targetRef.current)
                animateTo(targetRef.current)
            }, delay)
        },
        [animateTo]
    )

    const moveByPixels = React.useCallback(
        (pixels: number) => {
            const next = targetRef.current + pixels * 0.012
            targetRef.current = Math.max(
                renderedPosition - 9,
                Math.min(renderedPosition + 9, next)
            )
            animateTo(targetRef.current)
            settle()
        },
        [animateTo, renderedPosition, settle]
    )

    return (
        <WheelView
            props={props}
            renderedPosition={renderedPosition}
            interactive
            handlers={{
                onWheel: (event) => {
                    event.preventDefault()
                    moveByPixels(event.deltaY)
                },
                onPointerDown: (event) => {
                    pointerYRef.current = event.clientY
                    event.currentTarget.setPointerCapture(event.pointerId)
                },
                onPointerMove: (event) => {
                    if (pointerYRef.current === null) return
                    const delta = pointerYRef.current - event.clientY
                    pointerYRef.current = event.clientY
                    moveByPixels(delta)
                },
                onPointerUp: () => {
                    pointerYRef.current = null
                    settle(0)
                },
                onPointerCancel: () => {
                    pointerYRef.current = null
                    settle(0)
                },
                onKeyDown: (event) => {
                    if (
                        ![
                            "ArrowDown",
                            "ArrowUp",
                            "PageDown",
                            "PageUp",
                        ].includes(event.key)
                    ) {
                        return
                    }
                    event.preventDefault()
                    const direction = event.key.endsWith("Down") ? 1 : -1
                    targetRef.current =
                        Math.round(targetRef.current) + direction
                    animateTo(targetRef.current)
                },
            }}
        />
    )
}

/**
 * Infinite, scroll-controlled text selector with a curved active-item path.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */
export default function InfiniteTextWheel(props: InfiniteTextWheelProps) {
    const isStaticRenderer = useIsStaticRenderer()

    if (isStaticRenderer) {
        return <StaticTextWheel {...props} />
    }

    return <AnimatedTextWheel {...props} />
}

InfiniteTextWheel.defaultProps = {
    items: defaultItems,
    font: {
        fontSize: 46,
        lineHeight: 1,
        letterSpacing: "-0.055em",
        textAlign: "left",
        variant: "Extra Bold",
    },
    color: "#F5F6FF",
    arrowIcon: undefined,
    arrowColor: "#F5F6FF",
    arrowSize: 18,
    arrowGap: 24,
    sideGap: 28,
    topGap: 0,
    bottomGap: 0,
    rowGap: 0,
    curve: 82,
    transition: {
        type: "spring",
        stiffness: 150,
        damping: 19,
        mass: 1,
    },
}

addPropertyControls(InfiniteTextWheel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.String,
            defaultValue: "Item",
        },
        defaultValue: defaultItems,
        maxCount: 100,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultFontType: "sans-serif",
        defaultFontSize: "46px",
        displayTextAlignment: false,
        displayFontSize: true,
        controls: "extended",
        defaultValue: {
            fontSize: 46,
            lineHeight: 1,
            letterSpacing: "-0.055em",
            textAlign: "left",
            variant: "Extra Bold",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#F5F6FF",
    },
    arrowIcon: {
        type: ControlType.ComponentInstance,
        title: "Custom Icon",
        description:
            "Optional. Connect an icon component to replace the default triangle arrow.",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#F5F6FF",
        hidden: (props) => Boolean(props.arrowIcon),
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 18,
        min: 4,
        max: 120,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    arrowGap: {
        type: ControlType.Number,
        title: "Arrow Gap",
        defaultValue: 24,
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    sideGap: {
        type: ControlType.Number,
        title: "Left Gap",
        defaultValue: 28,
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    topGap: {
        type: ControlType.Number,
        title: "Top Gap",
        defaultValue: 0,
        min: 0,
        max: 500,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    bottomGap: {
        type: ControlType.Number,
        title: "Bottom Gap",
        defaultValue: 0,
        min: 0,
        max: 500,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    rowGap: {
        type: ControlType.Number,
        title: "Row Gap",
        defaultValue: 0,
        min: -20,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    curve: {
        type: ControlType.Number,
        title: "Curve",
        defaultValue: 82,
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    transition: {
        type: ControlType.Transition,
        title: "Easing",
        defaultValue: {
            type: "spring",
            stiffness: 150,
            damping: 19,
            mass: 1,
        },
    },
})
