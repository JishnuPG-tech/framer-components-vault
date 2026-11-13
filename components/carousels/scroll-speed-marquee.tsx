import { Children, useEffect, useRef, useState } from "react"
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
    motion,
    useAnimationFrame,
    useInView,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
    useVelocity,
    wrap,
} from "framer-motion"

type Direction = "left" | "right"

interface VelocityMarqueeProps {
    children?: React.ReactNode
    gap: number
    speed: number
    boost: number
    fullAt: number
    flip: boolean
    direction: Direction
    pauseOnHover: boolean
    repeat: number
    smoothing: number
}

/**
 * Velocity Marquee - a marquee whose speed and direction answer to how fast the
 * page is scrolling.
 *
 * Scroll velocity is a derivative of scroll position, which is why Framer's own
 * scroll transforms cannot express it. The row idles at its base speed, gains
 * pace as you scroll, and reverses when you scroll back the other way.
 *
 * Nothing advances while the marquee is off screen.
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 120
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function VelocityMarquee(props: VelocityMarqueeProps) {
    const {
        children,
        gap,
        speed,
        boost,
        fullAt,
        flip,
        direction,
        pauseOnHover,
        repeat,
        smoothing,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const setRef = useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { margin: "200px" })
    const hovering = useRef(false)
    const heading = useRef(direction === "left" ? -1 : 1)
    const setWidth = useRef(0)

    const items = Children.toArray(children)
    const copies = Math.max(2, Math.min(Math.round(repeat), 8))

    const x = useMotionValue(0)

    const stiffness = 400 / (1 + smoothing)
    const { scrollY } = useScroll()
    const scrollVelocity = useVelocity(scrollY)
    const smoothVelocity = useSpring(scrollVelocity, {
        stiffness,
        damping: 2 * Math.sqrt(stiffness),
        mass: 1,
    })
    const reach = Math.max(fullAt, 1)
    const factor = useTransform(
        smoothVelocity,
        [-reach, 0, reach],
        [-boost, 0, boost],
        { clamp: true }
    )

    // One set's width is the wrap distance; remeasure when content reflows.
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        const el = setRef.current
        if (!el) return
        const measure = () => {
            setWidth.current = el.offsetWidth + gap
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic, gap, items.length])

    useAnimationFrame((_, delta) => {
        if (isStatic || !inView) return
        if (pauseOnHover && hovering.current) return
        const width = setWidth.current
        if (!width) return

        const v = factor.get()
        if (flip) {
            if (v < -0.01) heading.current = direction === "left" ? 1 : -1
            else if (v > 0.01) heading.current = direction === "left" ? -1 : 1
        }

        // Base drift, then the scroll boost on top of it.
        let moveBy = heading.current * speed * (delta / 1000)
        moveBy += moveBy * Math.abs(v)

        x.set(wrap(-width, 0, x.get() + moveBy))
    })

    const row = (
        <>
            {items.map((child, i) => (
                <div key={i} style={{ flex: "0 0 auto" }}>
                    {child}
                </div>
            ))}
        </>
    )

    return (
        <div
            ref={rootRef}
            onPointerEnter={() => {
                hovering.current = true
            }}
            onPointerLeave={() => {
                hovering.current = false
            }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
            }}
        >
            {items.length === 0 && isStatic && (
                <div
                    style={{
                        padding: "14px 18px",
                        borderRadius: 10,
                        border: "1px dashed rgba(0,0,0,0.25)",
                        font: "500 13px/1.4 sans-serif",
                        opacity: 0.6,
                    }}
                >
                    Add layers to Items
                </div>
            )}
            <motion.div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap,
                    width: "max-content",
                    willChange: "transform",
                    x: isStatic ? 0 : x,
                }}
            >
                {Array.from({ length: copies }).map((_, c) => (
                    <div
                        key={c}
                        ref={c === 0 ? setRef : undefined}
                        style={{ display: "flex", alignItems: "center", gap }}
                    >
                        {row}
                    </div>
                ))}
            </motion.div>
        </div>
    )
}

VelocityMarquee.displayName = "Scroll Speed Marquee"

addPropertyControls(VelocityMarquee, {
    children: {
        type: ControlType.Slot,
        title: "Items",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 28,
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        description: "Idle drift when the page is still, in pixels per second.",
        defaultValue: 60,
        min: 0,
        max: 400,
        step: 5,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "left",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
    },
    boost: {
        type: ControlType.Number,
        title: "Boost",
        description: "How much faster it runs at full scroll speed.",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 0.5,
    },
    fullAt: {
        type: ControlType.Number,
        title: "Full At",
        description:
            "Scroll speed that reaches full boost, in pixels per second.",
        defaultValue: 1500,
        min: 200,
        max: 6000,
        step: 100,
    },
    flip: {
        type: ControlType.Boolean,
        title: "Flip On Reverse",
        description: "Run the other way when the page scrolls back up.",
        defaultValue: true,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause On Hover",
        defaultValue: false,
    },
    repeat: {
        type: ControlType.Number,
        title: "Copies",
        description:
            "How many times the set repeats. Raise it if a gap appears on wide screens.",
        defaultValue: 4,
        min: 2,
        max: 8,
        step: 1,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        description: "0 reacts instantly. Higher values ease the boost in.",
        defaultValue: 4,
        min: 0,
        max: 10,
        step: 0.5,
    },
})
