import * as React from "react"
import { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function NeonGrid(props) {
    const {
        gridSize,
        cellSize,
        cellGap,
        borderRadius,
        coreColor,
        tiltX,
        tiltZ,
        perspective,
        isAnimated,
        waveSpeed,
    } = props

    const containerRef = useRef(null)
    const [isInView, setIsInView] = useState(false)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const target = containerRef.current
        if (!target) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting)
            },
            {
                threshold: 0.1,
            }
        )

        observer.observe(target)

        return () => {
            if (target) observer.unobserve(target)
            observer.disconnect()
        }
    }, [isStatic])

    const shouldAnimate = isAnimated && isInView && !isStatic

    const center = (gridSize - 1) / 2
    const maxDist = Math.sqrt(center * center + center * center)

    const cells = []

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const dist = Math.sqrt(
                Math.pow(x - center, 2) + Math.pow(y - center, 2)
            )

            const intensity = Math.max(0, 1 - dist / (maxDist * 0.8))

            const baseOpacity = Math.pow(intensity, 1.8)
            const maxShadow = `0px 0px ${15 * intensity}px ${coreColor}80`
            const minShadow = `0px 0px ${2 * intensity}px ${coreColor}20`

            cells.push(
                <motion.div
                    key={`${x}-${y}`}
                    initial={{
                        opacity: baseOpacity,
                        scale: 1,
                        boxShadow: maxShadow,
                    }}
                    animate={
                        shouldAnimate
                            ? {
                                  opacity: [
                                      baseOpacity * 0.3,
                                      baseOpacity,
                                      baseOpacity * 0.3,
                                  ],
                                  scale: [0.85, 1, 0.85],
                                  boxShadow: [minShadow, maxShadow, minShadow],
                              }
                            : {
                                  opacity: baseOpacity,
                                  scale: 1,
                                  boxShadow: maxShadow,
                              }
                    }
                    transition={
                        shouldAnimate
                            ? {
                                  duration: waveSpeed,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                  delay: dist * 0.15,
                              }
                            : {
                                  duration: 0.5,
                              }
                    }
                    style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: borderRadius,
                        backgroundColor: coreColor,
                    }}
                />
            )
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "transparent",
                overflow: "hidden",
                perspective: `${perspective}px`,
            }}
        >
            <motion.div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
                    gap: `${cellGap}px`,
                    transform: `rotateX(${tiltX}deg) rotateZ(${tiltZ}deg)`,
                    transformStyle: "preserve-3d",
                }}
            >
                {cells}
            </motion.div>
        </div>
    )
}

NeonGrid.defaultProps = {
    gridSize: 22,
    cellSize: 35,
    cellGap: 5,
    borderRadius: 8,
    coreColor: "#ff007f",
    tiltX: 65,
    tiltZ: -20,
    perspective: 800,
    isAnimated: true,
    waveSpeed: 3,
}

addPropertyControls(NeonGrid, {
    isAnimated: {
        type: ControlType.Boolean,
        title: "Animated",
        defaultValue: true,
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave Speed",
        min: 0.5,
        max: 10,
        step: 0.5,
        defaultValue: 3,
        hidden(props) {
            return !props.isAnimated
        },
    },
    gridSize: {
        type: ControlType.Number,
        title: "Grid Size",
        min: 5,
        max: 50,
        defaultValue: 22,
    },
    cellSize: {
        type: ControlType.Number,
        title: "Cell Size",
        min: 10,
        max: 100,
        defaultValue: 35,
    },
    cellGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 20,
        defaultValue: 5,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 50,
        defaultValue: 8,
    },
    coreColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#ff007f",
    },
    tiltX: {
        type: ControlType.Number,
        title: "Tilt X",
        min: 0,
        max: 90,
        defaultValue: 65,
    },
    tiltZ: {
        type: ControlType.Number,
        title: "Tilt Z",
        min: -90,
        max: 90,
        defaultValue: -20,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 100,
        max: 2000,
        defaultValue: 800,
    },
})
