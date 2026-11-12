// Component with draggable white border container that reveals clear image underneath dark mask
import { useState, useRef, startTransition, type CSSProperties, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useTransform } from "framer-motion"

interface DraggableRevealProps {
    image: {
        src: string
        alt: string
    }
    maskBlur: number
    maskDarkness: number
    containerWidth: number
    containerHeight: number
    borderColor: string
    borderWidth: number
    borderRadius: number
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DraggableReveal(props: DraggableRevealProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Image",
        },
        maskBlur = 5,
        maskDarkness = 0.5,
        containerWidth = 30,
        containerHeight = 80,
        borderColor = "#FFFFFF",
        borderWidth = 2,
        borderRadius = 2,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 })
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    useEffect(() => {
        if (containerRef.current) {
            const updateSize = () => {
                if (containerRef.current) {
                    const width = containerRef.current.offsetWidth
                    const height = containerRef.current.offsetHeight
                    setContainerSize({ width, height })
                    
                    // Calculate center position
                    const draggableWidth = (width * containerWidth) / 100
                    const draggableHeight = (height * containerHeight) / 100
                    const centerX = (width - draggableWidth) / 2
                    const centerY = (height - draggableHeight) / 2
                    
                    setInitialPosition({ x: centerX, y: centerY })
                    x.set(centerX)
                    y.set(centerY)
                }
            }
            updateSize()
            window.addEventListener("resize", updateSize)
            return () => window.removeEventListener("resize", updateSize)
        }
    }, [containerWidth, containerHeight, x, y])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: "400px",
                overflow: "hidden",
                borderRadius: `${borderRadius}px`,
            }}
        >
            {/* Base image with dark mask */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${image.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: `${borderRadius}px`,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backdropFilter: `blur(${maskBlur}px)`,
                    WebkitBackdropFilter: `blur(${maskBlur}px)`,
                    backgroundColor: `rgba(0, 0, 0, ${maskDarkness})`,
                }}
            />

            {/* Draggable container with white border */}
            <motion.div
                drag
                dragConstraints={containerRef}
                dragElastic={0}
                dragMomentum={false}
                style={{
                    position: "absolute",
                    x,
                    y,
                    width: `${containerWidth}%`,
                    height: `${containerHeight}%`,
                    border: `${borderWidth}px solid ${borderColor}`,
                    borderRadius: `${borderRadius}px`,
                    cursor: "grab",
                    overflow: "hidden",
                }}
                whileDrag={{ cursor: "grabbing" }}
            >
                {/* Clear image inside draggable container */}
                <motion.div
                    style={{
                        position: "absolute",
                        width: containerSize.width,
                        height: containerSize.height,
                        backgroundImage: `url(${image.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        borderRadius: `${borderRadius}px`,
                        x: useTransform(x, (value) => -value),
                        y: useTransform(y, (value) => -value),
                    }}
                />
            </motion.div>
        </div>
    )
}

addPropertyControls(DraggableReveal, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    maskBlur: {
        type: ControlType.Number,
        title: "Mask Blur",
        defaultValue: 5,
        min: 0,
        max: 10,
        step: 0.5,
    },
    maskDarkness: {
        type: ControlType.Number,
        title: "Mask Darkness",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
    },
    containerWidth: {
        type: ControlType.Number,
        title: "Container Width",
        defaultValue: 30,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
    },
    containerHeight: {
        type: ControlType.Number,
        title: "Container Height",
        defaultValue: 80,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FFFFFF",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 2,
        min: 0,
        max: 20,
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 2,
        min: 0,
        max: 100,
        step: 1,
    },
})

DraggableReveal.displayName = "Draggable Reveal"