import * as React from "react"
import { useState, useRef, useEffect } from "react"
import {
    motion,
    useMotionValue,
    animate,
    useTransform,
    useSpring,
    useAnimationFrame,
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


/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerDisableUnlink
 */
export default function ArcCarousel(props) {
    const { slides, radius, spacing, mode, autoplay, direction, speed } = props

    // 1. Setup Slides
    const hasSlides = slides && slides.length > 0
    const activeSlides = hasSlides
        ? slides
        : [
              <Placeholder key="1" color="#FF0055" />,
              <Placeholder key="2" color="#0099FF" />,
              <Placeholder key="3" color="#22CC88" />,
              <Placeholder key="4" color="#FFAA00" />,
              <Placeholder key="5" color="#9C1AFF" />,
          ]

    // 2. Loop Construction
    const MIN_DEGREES = 240
    const filledItems = []
    while (filledItems.length * spacing < MIN_DEGREES * 2.5) {
        filledItems.push(...activeSlides)
    }
    if (filledItems.length === activeSlides.length)
        filledItems.push(...activeSlides)
    const totalArc = filledItems.length * spacing

    // 3. Motion System
    const rotation = useMotionValue(0)
    const smoothRotation = useSpring(rotation, {
        stiffness: 150,
        damping: 30,
        mass: 1,
    })

    const isDragging = useRef(false)
    const isAnimating = useRef(false)
    const startRotation = useRef(0)
    const [cursor, setCursor] = useState("grab")
    const timeRef = useRef(0)

    useAnimationFrame((t, delta) => {
        if (isDragging.current) return

        // FREE MODE + AUTOPLAY
        if (mode === "free" && autoplay && !isAnimating.current) {
            const dir = direction === "left" ? 1 : -1
            const autoplayMove = (delta * speed * dir) / 1000
            rotation.set(rotation.get() + autoplayMove)
        }

        // STRICT MODE AUTOPLAY
        else if (autoplay && mode === "strict" && !isAnimating.current) {
            const dir = direction === "left" ? 1 : -1
            timeRef.current += delta
            const interval = 2000 - speed * 18

            if (timeRef.current >= interval) {
                timeRef.current = 0
                const currentRot = rotation.get()
                const currentIndex = Math.round(currentRot / spacing)
                const targetIndex = currentIndex + dir
                const targetRot = targetIndex * spacing

                isAnimating.current = true

                // --- THE SMOOTH TELEPORT ---
                animate(rotation, targetRot, {
                    type: "tween",
                    ease: "linear",
                    duration: 0.8,
                    onComplete: () => {
                        isAnimating.current = false
                    },
                })
            }
        }
    })

    // --- KEYBOARD ---
    const handleKeyDown = (e) => {
        if (autoplay) timeRef.current = 0
        const currentRot = rotation.get()
        const currentIndex = Math.round(currentRot / spacing)
        let targetIndex = currentIndex

        if (e.key === "ArrowRight") targetIndex = currentIndex - 1
        else if (e.key === "ArrowLeft") targetIndex = currentIndex + 1
        else return

        const targetRot = targetIndex * spacing
        isAnimating.current = true

        animate(rotation, targetRot, {
            type: "tween",
            ease: "easeInOut",
            duration: 0.6,
            onComplete: () => {
                isAnimating.current = false
            },
        })
    }

    const onPanStart = () => {
        isDragging.current = true
        isAnimating.current = false
        setCursor("grabbing")
        rotation.stop()
        startRotation.current = rotation.get()
    }

    const onPan = (event, info) => {
        // HEAVY DRAG
        let deltaAngle = info.delta.x / 10

        // STRICT MODE WALL
        if (mode === "strict") {
            const currentRot = rotation.get() + deltaAngle
            const distanceFromStart = currentRot - startRotation.current
            if (Math.abs(distanceFromStart) > spacing * 1.05) {
                deltaAngle = 0
            }
        }

        rotation.set(rotation.get() + deltaAngle)
    }

    const onPanEnd = (event, info) => {
        isDragging.current = false
        setCursor("grab")
        const velocity = info.velocity.x

        if (mode === "free") {
            // HEAVY INERTIA
            isAnimating.current = true
            animate(rotation, rotation.get(), {
                type: "inertia",
                velocity: velocity,
                power: 0.8,
                timeConstant: 450,
                modifyTarget: (target) =>
                    Math.round(target / spacing) * spacing,
                onComplete: () => {
                    isAnimating.current = false
                },
            })
        } else {
            // STRICT MODE SNAP
            isAnimating.current = true
            const startIndex = Math.round(startRotation.current / spacing)
            const currentRot = rotation.get()
            let step = 0

            if (currentRot > startRotation.current + spacing * 0.15) step = 1
            else if (currentRot < startRotation.current - spacing * 0.15)
                step = -1

            const targetIndex = startIndex + step
            const snapRotation = targetIndex * spacing

            animate(rotation, snapRotation, {
                type: "spring",
                stiffness: 60,
                damping: 25,
                mass: 1.2,
                onComplete: () => {
                    isAnimating.current = false
                },
            })
        }
    }

    return (
        <div
            style={containerStyle}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseEnter={(e) => e.currentTarget.focus()}
        >
            <motion.div
                style={{ ...trackStyle, cursor: cursor }}
                onPanStart={onPanStart}
                onPan={onPan}
                onPanEnd={onPanEnd}
            >
                {filledItems.map((child, index) => {
                    return (
                        <CarouselItem
                            key={index}
                            index={index}
                            child={child}
                            rotation={smoothRotation}
                            spacing={spacing}
                            totalArc={totalArc}
                            radius={radius}
                        />
                    )
                })}
            </motion.div>
        </div>
    )
}

function CarouselItem({ index, child, rotation, spacing, totalArc, radius }) {
    const rawAngle = useTransform(rotation, (r) => index * spacing + r)
    const adjustedAngle = useTransform(rawAngle, (angle) => {
        let wrapped = angle % totalArc
        if (wrapped > totalArc / 2) wrapped -= totalArc
        if (wrapped < -totalArc / 2) wrapped += totalArc
        return wrapped
    })

    // VISIBILITY BUFFER (92deg)
    const opacity = useTransform(adjustedAngle, (angle) =>
        Math.abs(angle) > 92 ? 0 : 1
    )

    const zIndex = useTransform(adjustedAngle, (val) =>
        Math.round(1000 - Math.abs(val))
    )

    const startX = useRef(0)
    const handlePointerDown = (e) => {
        startX.current = e.clientX
    }
    const handleClickCapture = (e) => {
        const dist = Math.abs(e.clientX - startX.current)
        if (dist > 5) {
            e.preventDefault()
            e.stopPropagation()
        }
    }
    const handleDragStart = (e) => {
        e.preventDefault()
    }

    return (
        <motion.div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                x: "-50%",
                y: "-50%",
                rotate: adjustedAngle,
                transformOrigin: `center ${radius}px`,
                opacity: opacity,
                zIndex: zIndex,
                willChange: "transform",
            }}
        >
            <div
                onPointerDown={handlePointerDown}
                onClickCapture={handleClickCapture}
                onDragStart={handleDragStart}
                style={{
                    display: "inline-block",
                    position: "relative",
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    pointerEvents: "auto",
                }}
            >
                {child}
            </div>
        </motion.div>
    )
}

// --- Placeholder ---
const Placeholder = ({ color }) => (
    <div
        style={{
            width: 200,
            height: 280,
            backgroundColor: color,
            borderRadius: 20,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        }}
    />
)

// --- Styles ---

const containerStyle = {
    width: "100%",
    height: "100%",
    position: "relative",
    backgroundColor: "transparent",
    perspective: "1000px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    userSelect: "none",
    WebkitUserSelect: "none",
    outline: "none",
}

const trackStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    touchAction: "none",
    pointerEvents: "auto",
}

// --- Property Controls ---

ArcCarousel.defaultProps = {
    slides: [],
    radius: 1200,
    spacing: 10,
    mode: "free",
    autoplay: false,
    direction: "left",
    speed: 50,
}

addPropertyControls(ArcCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: { type: ControlType.ComponentInstance },
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["free", "strict"],
        optionTitles: ["Free Spin", "Clock Mode"],
        defaultValue: "free",
    },
    spacing: {
        type: ControlType.Number,
        title: "Gap",
        min: 2,
        max: 30,
        defaultValue: 10,
        unit: "deg",
    },
    radius: {
        type: ControlType.Number,
        title: "Curve",
        min: 400,
        max: 3000,
        defaultValue: 1200,
        description: "Higher = Flatter",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        hidden: (props) => !props.autoplay,
        defaultValue: "left",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 1,
        max: 100,
        hidden: (props) => !props.autoplay,
        defaultValue: 50,
    },
})
