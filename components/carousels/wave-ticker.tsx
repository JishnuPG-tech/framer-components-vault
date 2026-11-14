// Ticker with wave-like motion for items
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimationFrame } from "framer-motion"
import {
    useEffect,
    useState,
    useRef,
    type CSSProperties,
    type ReactNode,
    startTransition,
} from "react"

interface WaveTickerProps {
    slots: ReactNode[]
    speed: number
    hoverSpeed: number
    waveAmplitude: number
    verticalSpeed: number
    waveStagger: number
    gap: number
    direction: "left" | "right" | "top" | "bottom"
    alignment: "start" | "center" | "end"
    padding: string
    fadeContent: boolean
    fadeWidth: number
}

/**
 * Wave Ticker
 *
 * A ticker component where items move in a wave-like pattern while scrolling.
 *
 * Built by Matthias Ölschlegel 💪
 * [Explore more components](https://framer.link/FVXAdCH)
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function WaveTicker(props: WaveTickerProps) {
    const {
        slots = [],
        speed,
        hoverSpeed,
        waveAmplitude,
        verticalSpeed,
        waveStagger = 0.2,
        gap,
        direction,
        alignment = "center",
        padding,
        fadeContent,
        fadeWidth,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const offset = useRef(0)
    const [contentSize, setContentSize] = useState(0)

    const isVertical = direction === "top" || direction === "bottom"
    const isReverse = direction === "right" || direction === "bottom"

    // Calculate total width of content to determine how many duplicates we need
    useEffect(() => {
        if (!contentRef.current) return
        const observer = new ResizeObserver(() => {
            if (contentRef.current) {
                const size = isVertical
                    ? contentRef.current.offsetHeight
                    : contentRef.current.offsetWidth
                startTransition(() => setContentSize(size))
            }
        })
        observer.observe(contentRef.current)
        return () => observer.disconnect()
    }, [slots, gap, direction, isVertical])

    // Create an array of items to render (original + duplicates for seamless loop)
    // We need enough duplicates to fill the screen plus a buffer
    const items = [...slots, ...slots, ...slots, ...slots]

    // Map alignment to flex properties
    const alignMap = {
        start: "flex-start",
        center: "center",
        end: "flex-end",
    }
    const alignItems = alignMap[alignment] || "center"

    const maskDirection = isVertical ? "to bottom" : "to right"
    const mask = fadeContent
        ? `linear-gradient(${maskDirection}, transparent 0px, black ${fadeWidth}px, black calc(100% - ${fadeWidth}px), transparent 100%)`
        : undefined

    useAnimationFrame((time, delta) => {
        if (isStatic) {
            if (contentRef.current) {
                contentRef.current.style.transform = isVertical
                    ? "translateY(0px)"
                    : "translateX(0px)"
            }
            return
        }

        if (!contentRef.current || contentSize === 0) return

        const element = contentRef.current
        const loopSize = contentSize / 2

        // Base speed multiplier (pixels per second at 100% speed)
        // Adjusted to be generally slower as requested
        const multiplier = 0.25
        const currentHoverFactor = isHovered ? hoverSpeed / 100 : 1
        const moveBy = (delta / 1000) * speed * multiplier * currentHoverFactor

        offset.current += moveBy

        if (offset.current >= loopSize) {
            offset.current -= loopSize
        }

        const currentOffset = offset.current
        const translateValue = isReverse
            ? -loopSize + currentOffset
            : -currentOffset

        if (isVertical) {
            element.style.transform = `translateY(${translateValue}px)`
        } else {
            element.style.transform = `translateX(${translateValue}px)`
        }
    })

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                padding,
                display: "flex",
                flexDirection: isVertical ? "column" : "row",
                alignItems: alignItems,
                position: "relative",
                maskImage: mask,
                WebkitMaskImage: mask,
            }}
            ref={containerRef}
            onMouseEnter={() => startTransition(() => setIsHovered(true))}
            onMouseLeave={() => startTransition(() => setIsHovered(false))}
        >
            <motion.div
                ref={contentRef}
                style={{
                    display: "flex",
                    flexDirection: isVertical ? "column" : "row",
                    gap,
                    width: isVertical ? "100%" : "max-content",
                    height: isVertical ? "max-content" : "100%",
                    willChange: "transform",
                }}
            >
                {items.map((child, index) => (
                    <WaveItem
                        key={index}
                        index={index}
                        amplitude={waveAmplitude}
                        speed={verticalSpeed}
                        stagger={waveStagger}
                        isVertical={isVertical}
                    >
                        {child}
                    </WaveItem>
                ))}
            </motion.div>
        </div>
    )
}

interface WaveItemProps {
    children: ReactNode
    index: number
    amplitude: number
    speed: number
    stagger: number
    isVertical: boolean
}

function WaveItem({
    children,
    index,
    amplitude,
    speed,
    stagger,
    isVertical,
}: WaveItemProps) {
    const ref = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    useAnimationFrame((time) => {
        if (isStatic) {
            if (ref.current) {
                ref.current.style.transform = isVertical
                    ? "translateX(0px)"
                    : "translateY(0px)"
            }
            return
        }

        if (!ref.current) return

        const frequency = speed / 50
        const phaseOffset = index * stagger * Math.PI
        const t = time / 1000
        const offset =
            amplitude * Math.sin(2 * Math.PI * frequency * t + phaseOffset)

        if (isVertical) {
            ref.current.style.transform = `translateX(${offset}px)`
        } else {
            ref.current.style.transform = `translateY(${offset}px)`
        }
    })

    return (
        <div
            ref={ref}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
        >
            {children}
        </div>
    )
}

addPropertyControls(WaveTicker, {
    slots: {
        type: ControlType.Array,
        control: {
            type: ControlType.ComponentInstance,
        },
        title: "Children",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 10,
        min: 0,
        max: 100,
        unit: "%",
    },
    hoverSpeed: {
        type: ControlType.Number,
        title: "Hover Speed",
        defaultValue: 100,
        min: 0,
        max: 100,
        unit: "%",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right", "top", "bottom"],
        optionTitles: ["Left", "Right", "Top", "Bottom"],
        defaultValue: "left",
    },
    alignment: {
        type: ControlType.Enum,
        title: "Align",
        options: ["start", "center", "end"],
        optionTitles: ["Start", "Center", "End"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 20,
        min: 0,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "20px",
    },
    fadeContent: {
        type: ControlType.Boolean,
        title: "Fade",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fadeWidth: {
        type: ControlType.Number,
        title: "Fade Width",
        defaultValue: 50,
        min: 0,
        unit: "px",
        hidden: (props) => !props.fadeContent,
    },
    waveAmplitude: {
        type: ControlType.Number,
        title: "Wave Height",
        defaultValue: 20,
        min: 0,
        max: 100,
        unit: "px",
    },
    verticalSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        defaultValue: 25,
        min: 1,
        max: 100,
        step: 1,
    },
    waveStagger: {
        type: ControlType.Number,
        title: "Wave Flow",
        description:
            "Built by Matthias Ölschlegel 💪\n[Explore more components](https://dub.sh/dsw13)",
        defaultValue: 0.2,
        min: 0,
        max: 2,
        step: 0.05,
    },
})
