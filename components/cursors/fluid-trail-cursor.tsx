// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FluidTrailCursor(props) {
    const {
        trailColor,
        trailLength,
        trailWidth,
        smoothness,
        damping,
        fadeOnLeave,
        style,
    } = props

    const canvasRef = useRef(null)
    const animationRef = useRef(null)
    const stateRef = useRef({
        mouseX: 0,
        mouseY: 0,
        cursorX: 0,
        cursorY: 0,
        velocityX: 0,
        velocityY: 0,
        trailPoints: [],
        cursorOpacity: 1,
        targetOpacity: 1,
    })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        const state = stateRef.current

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resizeCanvas()

        state.cursorX = window.innerWidth / 2
        state.cursorY = window.innerHeight / 2
        state.mouseX = state.cursorX
        state.mouseY = state.cursorY

        const handleMouseMove = (e) => {
            state.mouseX = e.clientX
            state.mouseY = e.clientY
        }

        const handleMouseEnter = () => {
            if (fadeOnLeave) state.targetOpacity = 1
        }

        const handleMouseLeave = () => {
            if (fadeOnLeave) state.targetOpacity = 0
        }

        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16)
            const g = parseInt(hex.slice(3, 5), 16)
            const b = parseInt(hex.slice(5, 7), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }

        const animate = () => {
            const deltaX = (state.mouseX - state.cursorX) * smoothness
            const deltaY = (state.mouseY - state.cursorY) * smoothness

            state.velocityX = damping * state.velocityX + deltaX
            state.velocityY = damping * state.velocityY + deltaY

            state.cursorX += state.velocityX
            state.cursorY += state.velocityY

            state.trailPoints.push({ x: state.cursorX, y: state.cursorY })
            if (state.trailPoints.length > trailLength) {
                state.trailPoints.shift()
            }

            state.cursorOpacity +=
                (state.targetOpacity - state.cursorOpacity) * 0.1

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            for (let i = 0; i < state.trailPoints.length - 1; i++) {
                const point1 = state.trailPoints[i]
                const point2 = state.trailPoints[i + 1]
                const progress = (i + 1) / state.trailPoints.length

                const opacity = progress * state.cursorOpacity
                const color = trailColor.startsWith("#")
                    ? hexToRgba(trailColor, opacity)
                    : `rgba(${trailColor.match(/\d+/g)?.slice(0, 3).join(",") || "255,97,78"}, ${opacity})`

                ctx.strokeStyle = color
                ctx.lineWidth = trailWidth * progress
                ctx.lineCap = "round"

                ctx.beginPath()
                ctx.moveTo(point1.x, point1.y)
                ctx.lineTo(point2.x, point2.y)
                ctx.stroke()
            }

            animationRef.current = requestAnimationFrame(animate)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseenter", handleMouseEnter)
        document.addEventListener("mouseleave", handleMouseLeave)
        window.addEventListener("resize", resizeCanvas)

        animate()

        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseenter", handleMouseEnter)
            document.removeEventListener("mouseleave", handleMouseLeave)
            window.removeEventListener("resize", resizeCanvas)
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [trailColor, trailLength, trailWidth, smoothness, damping, fadeOnLeave])

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                pointerEvents: "none",
                zIndex: 9999,
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

FluidTrailCursor.defaultProps = {
    trailColor: "#0FEC9F",
    trailLength: 30,
    trailWidth: 6,
    smoothness: 0.1,
    damping: 0.7,
    fadeOnLeave: true,
}

addPropertyControls(FluidTrailCursor, {
    trailColor: {
        type: ControlType.Color,
        title: "Trail Color",
        defaultValue: "#0FEC9F",
        description: "Color of the cursor trail",
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        defaultValue: 80,
        min: 5,
        max: 100,
        step: 1,
        displayStepper: true,
        description: "Number of points in the trail",
    },
    trailWidth: {
        type: ControlType.Number,
        title: "Trail Width",
        defaultValue: 8,
        min: 1,
        max: 20,
        step: 0.5,
        displayStepper: true,
        description: "Maximum width of the trail",
    },
    smoothness: {
        type: ControlType.Number,
        title: "Smoothness",
        defaultValue: 0.08,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        displayStepper: true,
        description: "How quickly cursor follows mouse (lower = smoother)",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 0.8,
        min: 0.1,
        max: 0.99,
        step: 0.01,
        displayStepper: true,
        description: "Velocity damping (higher = more momentum)",
    },
    fadeOnLeave: {
        type: ControlType.Boolean,
        title: "Fade on Leave",
        defaultValue: true,
        description:
            "Fade out when mouse leaves window\n\nExplore [more components](https://dub.sh/daniyal-framer)\nMade by [Daniyal](https://dub.sh/daniyal-threads)",
    },
})
