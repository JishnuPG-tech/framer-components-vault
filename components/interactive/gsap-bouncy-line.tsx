import * as React from "react"
import { useState, useRef, useLayoutEffect, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import gsapPackage from "https://esm.sh/gsap"

// Use the existing global GSAP instance if available to prevent duplicate loading
const gsap =
    typeof window !== "undefined" && (window as any).gsap
        ? (window as any).gsap
        : gsapPackage

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 14
 */
interface Props {
    lineColor: string
    lineWidth: number
    sensitivity: number
    bounceAmount: number
    style?: React.CSSProperties
}

//@framerDisableUnlink
export default function GSAPBouncyLine(props: Props) {
    const { lineColor, lineWidth, sensitivity, bounceAmount, style } = props

    const [width, setWidth] = useState(0)
    const [pathD, setPathD] = useState("")

    const containerRef = useRef<HTMLDivElement>(null)
    const pointsRef = useRef({ y1: 0 })
    const isHovering = useRef(false)
    const isStatic = useIsStaticRenderer()
    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas

    // Path update logic
    const renderPath = useCallback(() => {
        if (width === 0) return
        const midY = lineWidth / 2
        const x0 = 0
        const y0 = midY
        const x1 = width / 2
        const y1 = pointsRef.current.y1
        const x2 = width
        const y2 = midY

        const d = `M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`
        setPathD(d)
    }, [width, lineWidth])

    // Width measurement
    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container) return
        const observer = new ResizeObserver((entries) => {
            const w = entries[0].contentRect.width
            if (w > 0) {
                setWidth(w)
                pointsRef.current.y1 = lineWidth / 2
            }
        })
        observer.observe(container)
        return () => observer.disconnect()
    }, [lineWidth])

    // Render tick
    useLayoutEffect(() => {
        gsap.ticker.add(renderPath)
        return () => gsap.ticker.remove(renderPath)
    }, [renderPath])

    // Interaction logic
    useLayoutEffect(() => {
        if (isStatic || isOnCanvas) return

        const container = containerRef.current
        if (!container) return

        // Map 1%-100% to 5px-150px sensitivity
        const mappedSnapDist = (sensitivity / 100) * 145 + 5

        const handleMouseMove = (e: MouseEvent) => {
            if (width === 0) return
            const rect = container.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top
            const midY = lineWidth / 2

            const dist = Math.abs(mouseY - midY)

            if (
                !isHovering.current &&
                dist < mappedSnapDist &&
                mouseX >= 0 &&
                mouseX <= width
            ) {
                isHovering.current = true
                gsap.killTweensOf(pointsRef.current)
            }

            if (isHovering.current) {
                pointsRef.current.y1 = mouseY * 2 - midY
                if (
                    Math.abs(pointsRef.current.y1 - midY) >
                    mappedSnapDist * 2
                ) {
                    release()
                }
            }
        }

        const release = () => {
            if (isHovering.current) {
                isHovering.current = false

                const amount = bounceAmount / 100
                const mappedDuration = 0.5 + amount * 1.0
                const mappedPeriod = 0.45 - amount * 0.4
                const mappedStrength = 0.5 + amount * 1.0

                gsap.to(pointsRef.current, {
                    y1: lineWidth / 2,
                    duration: mappedDuration,
                    ease: `elastic.out(${mappedStrength}, ${mappedPeriod})`,
                })
            }
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [width, lineWidth, sensitivity, bounceAmount, isStatic, isOnCanvas])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: lineWidth,
                overflow: "visible",
                position: "relative",
                cursor: "pointer",
                backgroundColor: "transparent",
            }}
        >
            <svg
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    display: "block",
                    pointerEvents: "none",
                }}
            >
                <path
                    d={pathD}
                    stroke={lineColor}
                    strokeWidth={lineWidth}
                    fill="transparent"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    )
}

GSAPBouncyLine.defaultProps = {
    lineColor: "#09F",
    lineWidth: 2,
    sensitivity: 40,
    bounceAmount: 50,
}

addPropertyControls(GSAPBouncyLine, {
    lineColor: {
        title: "Line Color",
        type: ControlType.Color,
        defaultValue: "#09F",
    },
    lineWidth: {
        title: "Line Width",
        type: ControlType.Number,
        min: 2,
        max: 20,
        unit: "px",
        defaultValue: 14,
    },
    bounceAmount: {
        title: "Bounce Amount",
        type: ControlType.Number,
        min: 0,
        max: 100,
        unit: "%",
        defaultValue: 50,
    },
    sensitivity: {
        title: "Sensitivity",
        type: ControlType.Number,
        min: 1,
        max: 100,
        unit: "%",
        defaultValue: 40,
        description:
            "Explore more components at [THE DESIGN FUTURIST](https://thedesignfuturist.zip)",
    },
})
