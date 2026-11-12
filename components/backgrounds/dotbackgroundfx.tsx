// Interactive card with animated dot pattern that responds to mouse movement
// Dots repel from cursor and animate with pulsing opacity effects

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import {
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 0.5 }
const OPACITY_DURATION_BASE = 0.8
const OPACITY_DURATION_VARIATION = 0.2
const OPACITY_EASE = [0.4, 0, 0.2, 1] as const
const OPACITY_DELAY_CYCLE = 1.5
const OPACITY_DELAY_STEP = 0.02
const MIN_OPACITY_MULTIPLIER = 0.5
const MAX_OPACITY_MULTIPLIER = 1.5
const MIN_OPACITY_FALLBACK = 0.3
const PROXIMITY_MULTIPLIER = 1.2
const PROXIMITY_OPACITY_BOOST = 0.8

interface MouseEffectCardProps {
    dotWidth: number
    dotHeight: number
    dotSpacing: number
    repulsionRadius: number
    repulsionStrength: number
    backgroundColor: string
    borderColor: string
    dotColor: string
    showBorder: boolean
    style?: CSSProperties
}

interface Dot {
    id: string
    x: number
    y: number
    baseX: number
    baseY: number
    opacity: number
}

interface DotComponentProps {
    dot: Dot
    index: number
    dotWidth: number
    dotHeight: number
    mouseX: ReturnType<typeof useMotionValue<number>>
    mouseY: ReturnType<typeof useMotionValue<number>>
    repulsionRadius: number
    repulsionStrength: number
    dotColor: string
}

function generateDots(width: number, height: number, spacing: number): Dot[] {
    const dots: Dot[] = []
    const cols = Math.ceil(width / spacing) + 1
    const rows = Math.ceil(height / spacing) + 1

    for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
            const x = col * spacing
            const y = row * spacing

            const pattern = (row + col) % 3
            const baseOpacities = [0.3, 0.5, 0.7]
            const opacity = baseOpacities[pattern]

            dots.push({
                id: `dot-${row}-${col}`,
                x,
                y,
                baseX: x,
                baseY: y,
                opacity,
            })
        }
    }

    return dots
}

function DotComponent({
    dot,
    index,
    dotWidth,
    dotHeight,
    mouseX,
    mouseY,
    repulsionRadius,
    repulsionStrength,
    dotColor,
}: DotComponentProps) {
    const posX = useTransform([mouseX, mouseY], () => {
        const mx = mouseX.get()
        const my = mouseY.get()

        if (!(Number.isFinite(mx) && Number.isFinite(my))) {
            return 0
        }

        const dx = dot.baseX - mx
        const dy = dot.baseY - my
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < repulsionRadius) {
            const force = (1 - distance / repulsionRadius) * repulsionStrength
            const angle = Math.atan2(dy, dx)
            return Math.cos(angle) * force
        }

        return 0
    })

    const posY = useTransform([mouseX, mouseY], () => {
        const mx = mouseX.get()
        const my = mouseY.get()

        if (!(Number.isFinite(mx) && Number.isFinite(my))) {
            return 0
        }

        const dx = dot.baseX - mx
        const dy = dot.baseY - my
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < repulsionRadius) {
            const force = (1 - distance / repulsionRadius) * repulsionStrength
            const angle = Math.atan2(dy, dx)
            return Math.sin(angle) * force
        }

        return 0
    })

    const opacityBoost = useTransform([mouseX, mouseY], () => {
        const mx = mouseX.get()
        const my = mouseY.get()

        if (!(Number.isFinite(mx) && Number.isFinite(my))) return 0

        const dx = dot.baseX - mx
        const dy = dot.baseY - my
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = repulsionRadius * PROXIMITY_MULTIPLIER

        if (distance < maxDistance) {
            const proximityFactor = 1 - distance / maxDistance
            return proximityFactor * PROXIMITY_OPACITY_BOOST
        }

        return 0
    })

    const x = useSpring(posX, SPRING_CONFIG)
    const y = useSpring(posY, SPRING_CONFIG)

    const baseMinOpacity = Math.max(
        dot.opacity * MIN_OPACITY_MULTIPLIER,
        MIN_OPACITY_FALLBACK
    )
    const baseMaxOpacity = Math.min(dot.opacity * MAX_OPACITY_MULTIPLIER, 1)

    const minOpacityWithBoost = useTransform(opacityBoost, (boost) =>
        Math.min(baseMinOpacity + boost, 1)
    )

    const delay = (index * OPACITY_DELAY_STEP) % OPACITY_DELAY_CYCLE

    // Detect if we're in canvas/artboard mode
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    return (
        <motion.div
            animate={{
                opacity: [baseMinOpacity, baseMaxOpacity, baseMinOpacity],
            }}
            style={{
                position: "absolute",
                borderRadius: "50%",
                backgroundColor: dotColor,
                willChange: "transform",
                width: dotWidth,
                height: dotHeight,
                left: dot.baseX,
                top: dot.baseY,
                x,
                y,
                opacity: isCanvas
                    ? baseMaxOpacity
                    : useSpring(minOpacityWithBoost, {
                          stiffness: 150,
                          damping: 25,
                      }),
            }}
            initial={{ opacity: isCanvas ? baseMaxOpacity : baseMinOpacity }}
            transition={{
                opacity: {
                    duration:
                        OPACITY_DURATION_BASE +
                        (index % 4) * OPACITY_DURATION_VARIATION,
                    repeat: Infinity,
                    ease: OPACITY_EASE,
                    delay,
                    times: [0, 0.5, 1],
                },
            }}
        />
    )
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MouseEffectCard(props: MouseEffectCardProps) {
    const {
        dotWidth,
        dotHeight,
        dotSpacing,
        repulsionRadius,
        repulsionStrength,
        backgroundColor,
        borderColor,
        dotColor,
        showBorder,
    } = props

    const innerContainerRef = useRef<HTMLDivElement>(null)
    const mouseX = useMotionValue(Infinity)
    const mouseY = useMotionValue(Infinity)
    const [dots, setDots] = useState<Dot[]>([])

    useEffect(() => {
        const updateDots = () => {
            if (!innerContainerRef.current) return
            const rect = innerContainerRef.current.getBoundingClientRect()
            const newDots = generateDots(rect.width, rect.height, dotSpacing)
            startTransition(() => setDots(newDots))
        }

        updateDots()

        if (typeof window !== "undefined") {
            const resizeObserver = new ResizeObserver(updateDots)
            if (innerContainerRef.current) {
                resizeObserver.observe(innerContainerRef.current)
            }

            return () => {
                resizeObserver.disconnect()
            }
        }
    }, [dotSpacing])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!innerContainerRef.current) return

        const rect = innerContainerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        mouseX.set(x)
        mouseY.set(y)
    }

    const handleMouseLeave = () => {
        mouseX.set(Infinity)
        mouseY.set(Infinity)
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: 0,
                border: showBorder ? `1px solid ${borderColor}` : "none",
                backgroundColor,
            }}
        >
            <div
                ref={innerContainerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {dots.map((dot, index) => (
                    <DotComponent
                        key={dot.id}
                        dot={dot}
                        index={index}
                        dotWidth={dotWidth}
                        dotHeight={dotHeight}
                        mouseX={mouseX}
                        mouseY={mouseY}
                        repulsionRadius={repulsionRadius}
                        repulsionStrength={repulsionStrength}
                        dotColor={dotColor}
                    />
                ))}
            </div>
        </div>
    )
}

addPropertyControls(MouseEffectCard, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#999999",
    },
    dotWidth: {
        type: ControlType.Number,
        title: "Dot Width",
        defaultValue: 2,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
    },
    dotHeight: {
        type: ControlType.Number,
        title: "Dot Height",
        defaultValue: 2,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
    },
    dotSpacing: {
        type: ControlType.Number,
        title: "Dot Spacing",
        defaultValue: 16,
        min: 8,
        max: 40,
        step: 2,
        unit: "px",
    },
    repulsionRadius: {
        type: ControlType.Number,
        title: "Repulsion Radius",
        defaultValue: 80,
        min: 40,
        max: 200,
        step: 10,
        unit: "px",
    },
    repulsionStrength: {
        type: ControlType.Number,
        title: "Repulsion Strength",
        defaultValue: 20,
        min: 5,
        max: 50,
        step: 5,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(255, 255, 255, 0.4)",
        hidden: ({ showBorder }) => !showBorder,
    },
    showBorder: {
        type: ControlType.Boolean,
        title: "Show Border",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})
