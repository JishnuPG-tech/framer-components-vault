import React, { useEffect, useRef, useState } from "react"
import confetti from "canvas-confetti"
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
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function ConfettiParty(props) {
    const { triggerMode, colors } = props

    const containerRef = useRef(null)
    const lastFireTime = useRef(0)
    const resolvedColors = useRef([])
    const hasFiredOnAppear = useRef(false)
    const [isVisible, setIsVisible] = useState(false)

    const isStatic = useIsStaticRenderer()

    const propsRef = useRef(props)
    useEffect(() => {
        propsRef.current = props
    }, [props])

    // Intersection Observer
    useEffect(() => {
        if (isStatic || typeof window === "undefined" || !containerRef.current)
            return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { rootMargin: "0px", threshold: 0 }
        )

        observer.observe(containerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const div = document.createElement("div")
        div.style.position = "absolute"
        div.style.visibility = "hidden"
        div.style.pointerEvents = "none"
        document.body.appendChild(div)

        resolvedColors.current = colors.map((color) => {
            div.style.color = color
            const computed = window.getComputedStyle(div).color
            const match = computed.match(/\d+/g)

            if (!match || match.length < 3) return "#ffffff"

            const r = parseInt(match[0]).toString(16).padStart(2, "0")
            const g = parseInt(match[1]).toString(16).padStart(2, "0")
            const b = parseInt(match[2]).toString(16).padStart(2, "0")

            return `#${r}${g}${b}`
        })

        document.body.removeChild(div)
    }, [colors, isStatic])

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const isInteractive =
            RenderTarget.current() === RenderTarget.preview ||
            RenderTarget.current() === RenderTarget.live

        if (!isInteractive) return

        let rafId = null
        let timeoutId = null
        let intervalId = null
        const currentProps = propsRef.current

        // Centralna funkcija za okidanje konfeta
        const shootConfetti = (x, y, customOverrides = {}) => {
            let confettiShapes = ["square", "circle"]
            if (currentProps.shapes === "square") confettiShapes = ["square"]
            if (currentProps.shapes === "circle") confettiShapes = ["circle"]
            if (currentProps.shapes === "star") confettiShapes = ["star"]
            if (currentProps.shapes === "mixed-star")
                confettiShapes = ["square", "circle", "star"]

            confetti({
                particleCount: currentProps.particleCount,
                spread: currentProps.spread,
                startVelocity: currentProps.startVelocity,
                angle: currentProps.angle,
                gravity: currentProps.gravity,
                drift: currentProps.drift,
                scalar: currentProps.scalar,
                shapes: confettiShapes,
                ticks: currentProps.ticks,
                colors:
                    resolvedColors.current.length > 0
                        ? resolvedColors.current
                        : currentProps.colors,
                origin: { x, y },
                zIndex: 9999,
                disableForReducedMotion: true,
                ...customOverrides,
            })
        }

        // 1. On Appear
        if (
            triggerMode === "onAppear" &&
            isVisible &&
            !hasFiredOnAppear.current
        ) {
            timeoutId = setTimeout(() => {
                if (!containerRef.current) return

                hasFiredOnAppear.current = true
                const duration = currentProps.autoDurationMs || 1000
                const animationEnd = Date.now() + duration
                const source = currentProps.autoSource || "edges"

                const streamParticleCount = Math.max(
                    2,
                    Math.floor(currentProps.particleCount / 5)
                )

                const frame = () => {
                    const timeLeft = animationEnd - Date.now()
                    if (timeLeft <= 0) return

                    const rect = containerRef.current.getBoundingClientRect()

                    if (source === "center") {
                        const centerX =
                            (rect.left + rect.width / 2) / window.innerWidth
                        const centerY =
                            (rect.top + rect.height / 2) / window.innerHeight

                        shootConfetti(centerX, centerY, {
                            particleCount: streamParticleCount,
                        })
                    } else {
                        // Edges
                        const leftX = rect.left / window.innerWidth
                        const rightX = rect.right / window.innerWidth
                        const yPos =
                            (rect.top + rect.height / 2) / window.innerHeight

                        // Left
                        shootConfetti(leftX, yPos, {
                            particleCount: streamParticleCount,
                            angle: 60,
                            startVelocity: currentProps.startVelocity || 45,
                        })
                        // Right
                        shootConfetti(rightX, yPos, {
                            particleCount: streamParticleCount,
                            angle: 120,
                            startVelocity: currentProps.startVelocity || 45,
                        })
                    }
                    rafId = requestAnimationFrame(frame)
                }

                frame()
            }, currentProps.autoDelayMs)
        }

        // 2. INTERACTIVE MODES (Hover / Click)
        const fireConfettiMouse = (e, isHoverEvent) => {
            if (!containerRef.current) return
            const now = Date.now()

            if (
                isHoverEvent &&
                now - lastFireTime.current < currentProps.throttleMs
            ) {
                return
            }

            const rect = containerRef.current.getBoundingClientRect()

            const isInside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom

            if (isInside) {
                const x = e.clientX / window.innerWidth
                const y = e.clientY / window.innerHeight
                shootConfetti(x, y)
                lastFireTime.current = now
            }
        }

        const handleMouseMove = (e) => {
            if (rafId) cancelAnimationFrame(rafId)
            rafId = requestAnimationFrame(() => fireConfettiMouse(e, true))
        }

        const handleClick = (e) => fireConfettiMouse(e, false)

        if (isVisible && triggerMode !== "onAppear") {
            if (triggerMode === "hover" || triggerMode === "both") {
                window.addEventListener("mousemove", handleMouseMove)
            }
            if (triggerMode === "click" || triggerMode === "both") {
                window.addEventListener("click", handleClick)
            }
        }

        return () => {
            if (rafId) cancelAnimationFrame(rafId)
            if (timeoutId) clearTimeout(timeoutId)
            if (intervalId) clearInterval(intervalId)
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("click", handleClick)
        }
    }, [triggerMode, isStatic, isVisible])

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const triggerModeLabels = {
        hover: "Hover (Mouse Move)",
        click: "Click Only",
        both: "Hover & Click",
        onAppear: "On Appear (Auto)",
    }
    const currentTriggerLabel = triggerModeLabels[triggerMode] || triggerMode

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: isCanvas ? "auto" : "none",
                display: "flex",
                backgroundColor: "transparent",
                border: isCanvas
                    ? "1px dashed rgba(136, 136, 136, 0.4)"
                    : "none",
                borderRadius: isCanvas ? 8 : 0,
                zIndex: 10,
            }}
        >
            {isCanvas && (
                <div
                    style={{
                        position: "absolute",
                        top: 8,
                        left: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontFamily: "system-ui, sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#888",
                        textShadow:
                            "0px 0px 3px rgba(255,255,255,0.8), 0px 0px 3px rgba(0,0,0,0.3)",
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                >
                    <span style={{ fontSize: 14 }}>🎉</span>
                    Trigger Zone ({currentTriggerLabel})
                </div>
            )}
        </div>
    )
}

addPropertyControls(ConfettiParty, {
    triggerMode: {
        type: ControlType.Enum,
        title: "Trigger Mode",
        options: ["hover", "click", "both", "onAppear"],
        optionTitles: [
            "Hover (Mouse Move)",
            "Click Only",
            "Hover & Click",
            "On Appear (Auto)",
        ],
        defaultValue: "hover",
    },
    autoSource: {
        type: ControlType.SegmentedEnum,
        title: "Source",
        options: ["edges", "center"],
        optionTitles: ["Edges", "Center"],
        defaultValue: "edges",
        hidden(props) {
            return props.triggerMode !== "onAppear"
        },
    },
    autoDelayMs: {
        type: ControlType.Number,
        title: "Delay (ms)",
        defaultValue: 500,
        min: 0,
        max: 10000,
        step: 100,
        hidden(props) {
            return props.triggerMode !== "onAppear"
        },
    },
    autoDurationMs: {
        type: ControlType.Number,
        title: "Duration (ms)",
        defaultValue: 1500,
        min: 200,
        max: 10000,
        step: 100,
        hidden(props) {
            return props.triggerMode !== "onAppear"
        },
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particle Count",
        defaultValue: 20,
        min: 1,
        max: 80,
        description:
            "Keep particle count under 40 for Mouse Move to ensure smooth performance.",
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 50,
        min: 10,
        max: 360,
    },
    startVelocity: {
        type: ControlType.Number,
        title: "Start Velocity",
        defaultValue: 50,
        min: 5,
        max: 100,
    },
    angle: {
        type: ControlType.Number,
        title: "Angle",
        defaultValue: 90,
        min: 0,
        max: 360,
    },
    gravity: {
        type: ControlType.Number,
        title: "Gravity",
        defaultValue: 3,
        min: 0,
        max: 5,
        step: 0.1,
    },
    drift: {
        type: ControlType.Number,
        title: "Wind (Drift)",
        defaultValue: 0,
        min: -5,
        max: 5,
        step: 0.1,
    },
    scalar: {
        type: ControlType.Number,
        title: "Size (Scale)",
        defaultValue: 1,
        min: 0.5,
        max: 5,
        step: 0.1,
    },
    ticks: {
        type: ControlType.Number,
        title: "Duration (Ticks)",
        defaultValue: 90,
        min: 10,
        max: 500,
    },
    shapes: {
        type: ControlType.Enum,
        title: "Shapes",
        options: ["mixed", "square", "circle", "star", "mixed-star"],
        optionTitles: [
            "Mixed (Square & Circle)",
            "Square",
            "Circle",
            "Star",
            "All Mixed",
        ],
        defaultValue: "mixed",
    },
    throttleMs: {
        type: ControlType.Number,
        title: "Hover Fire Rate",
        defaultValue: 30,
        min: 10,
        max: 500,
        step: 10,
        hidden(props) {
            return (
                props.triggerMode === "click" ||
                props.triggerMode === "onAppear"
            )
        },
    },
    colors: {
        type: ControlType.Array,
        title: "Colors",
        control: { type: ControlType.Color },
        defaultValue: ["#FFD700", "#FF69B4", "#00BFFF", "#32CD32", "#FF4500"],
        description:
            "Crafted with 🖤 by Igor.\n\nGrab more [Framer components](https://www.framer.com/%40igor-reif/), and if this freebie saved you some time, feel free to [Buy me a beer](https://revolut.me/ireif). Cheers!🍻",
    },
})
