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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function RobotHead(props) {
    const {
        headSize,
        shellLight,
        shellDark,
        faceLight,
        faceShade,
        eyeColor,
        eyeWidth,
        eyeHeight,
        eyeSpacing,
        spacingRange,
        trackRangeX,
        trackRangeY,
        headShiftX,
        headShiftY,
        headTilt,
        sheenSize,
        sheenStrength,
        sheenTravel,
        blinkInterval,
        background,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const headRef = useRef(null)
    const faceRef = useRef(null)
    const eyeRefs = useRef([])
    const sheenRefs = useRef([])

    const targetRef = useRef({ x: 0, y: 0, pull: 0 })
    const currentRef = useRef({ x: 0, y: 0, pull: 0 })
    const blinkRef = useRef(false)
    const rafRef = useRef(null)
    const visibleRef = useRef(true)

    // Cursor tracking. Styles are written straight to the nodes so React
    // never re-renders during the animation.
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const onMove = (event) => {
            const node = headRef.current
            if (!node) return
            const rect = node.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const dx = event.clientX - cx
            const dy = event.clientY - cy

            // Normalised against the viewport so full travel is reached
            // well before the cursor leaves the screen
            const nx = Math.max(
                Math.min(dx / (window.innerWidth * 0.35), 1),
                -1
            )
            const ny = Math.max(
                Math.min(dy / (window.innerHeight * 0.35), 1),
                -1
            )

            // 0 when the cursor is far away, 1 when it is right on the head
            const distance = Math.hypot(dx, dy)
            const near = 1 - Math.min(distance / (rect.width * 1.6), 1)

            targetRef.current = { x: nx, y: ny, pull: near }
        }

        const apply = () => {
            const c = currentRef.current

            const head = headRef.current
            if (head) {
                head.style.transform = `translate(${c.x * headShiftX}px, ${
                    c.y * headShiftY
                }px) rotate(${c.x * headTilt}deg)`
            }

            const face = faceRef.current
            if (face) {
                const gap = Math.max(eyeSpacing - c.pull * spacingRange, 0)
                face.style.gap = `${gap}px`
            }

            const scaleY = blinkRef.current ? 0.06 : 1
            eyeRefs.current.forEach((node) => {
                if (!node) return
                node.style.transform = `translate(${c.x * trackRangeX}px, ${
                    c.y * trackRangeY
                }px) scaleY(${scaleY})`
            })

            // The sheen slides across the eye toward the cursor, and squashes
            // with the lid so it disappears cleanly on a blink
            sheenRefs.current.forEach((node) => {
                if (!node) return
                node.style.transform = `translate(-50%, -50%) translate(${
                    c.x * sheenTravel
                }px, ${c.y * sheenTravel * 0.7}px)`
                node.style.opacity = blinkRef.current
                    ? "0"
                    : String(sheenStrength)
            })
        }

        const tick = () => {
            if (visibleRef.current) {
                const t = targetRef.current
                const c = currentRef.current
                currentRef.current = {
                    x: c.x + (t.x - c.x) * 0.1,
                    y: c.y + (t.y - c.y) * 0.1,
                    pull: c.pull + (t.pull - c.pull) * 0.08,
                }
                apply()
            }
            rafRef.current = requestAnimationFrame(tick)
        }

        window.addEventListener("pointermove", onMove, { passive: true })
        rafRef.current = requestAnimationFrame(tick)

        // Stop doing work while the head is scrolled out of view
        let observer
        if (headRef.current && typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        visibleRef.current = entry.isIntersecting
                    })
                },
                { threshold: 0 }
            )
            observer.observe(headRef.current)
        }

        return () => {
            window.removeEventListener("pointermove", onMove)
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            if (observer) observer.disconnect()
        }
    }, [
        isStatic,
        headShiftX,
        headShiftY,
        headTilt,
        eyeSpacing,
        spacingRange,
        trackRangeX,
        trackRangeY,
        sheenTravel,
        sheenStrength,
    ])

    // Blink on a loose rhythm with the occasional double blink
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        let cancelled = false
        let timeout = null

        // Only one timer is ever pending, so a single id covers the whole chain
        const next = (fn, delay) => {
            timeout = setTimeout(() => {
                if (cancelled) return
                fn()
            }, delay)
        }

        const schedule = () => {
            const wait = blinkInterval * 1000 * (0.6 + Math.random() * 0.9)
            next(() => {
                blinkRef.current = true
                next(() => {
                    blinkRef.current = false
                    if (Math.random() < 0.25) {
                        next(() => {
                            blinkRef.current = true
                            next(() => {
                                blinkRef.current = false
                                schedule()
                            }, 110)
                        }, 160)
                    } else {
                        schedule()
                    }
                }, 130)
            }, wait)
        }
        schedule()

        return () => {
            cancelled = true
            if (timeout !== null) clearTimeout(timeout)
            blinkRef.current = false
        }
    }, [isStatic, blinkInterval])

    const eye = (index) => (
        <div
            key={index}
            ref={(node) => (eyeRefs.current[index] = node)}
            style={{
                position: "relative",
                width: eyeWidth,
                height: eyeHeight,
                borderRadius: "50%",
                background: `radial-gradient(ellipse at 50% 42%, ${eyeColor} 0%, ${eyeColor} 52%, rgba(0,0,0,0.95) 100%)`,
                boxShadow: `0 ${eyeHeight * 0.06}px ${
                    eyeHeight * 0.18
                }px rgba(70,30,20,0.45)`,
                transition: "transform 0.09s ease-out",
                willChange: "transform",
                flexShrink: 0,
                overflow: "hidden",
            }}
        >
            {/* Glossy sheen. Separate element so it can be moved with
                transform alone rather than redrawing a gradient. */}
            <div
                ref={(node) => (sheenRefs.current[index] = node)}
                style={{
                    position: "absolute",
                    top: "34%",
                    left: "38%",
                    width: eyeWidth * sheenSize,
                    height: eyeHeight * sheenSize * 0.78,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 38%, rgba(255,255,255,0) 72%)",
                    opacity: sheenStrength,
                    transform: "translate(-50%, -50%)",
                    transition: "opacity 0.09s ease-out",
                    willChange: "transform, opacity",
                    pointerEvents: "none",
                }}
            />
        </div>
    )

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100vh",
                backgroundColor: background,
                overflow: "hidden",
                ...style,
            }}
        >
            <div
                ref={headRef}
                style={{
                    position: "relative",
                    width: headSize,
                    height: headSize * 0.9,
                    borderRadius: headSize * 0.12,
                    background: `linear-gradient(130deg, ${shellLight} 0%, ${shellLight} 26%, ${shellDark} 94%, ${shellDark} 100%)`,
                    boxShadow: `
                        inset 0 ${headSize * 0.026}px ${
                            headSize * 0.11
                        }px rgba(255,255,255,0.85),
                        inset 0 ${-headSize * 0.04}px ${
                            headSize * 0.16
                        }px rgba(96,42,28,0.6),
                        inset ${-headSize * 0.045}px 0 ${
                            headSize * 0.14
                        }px rgba(96,42,28,0.5),
                        0 ${headSize * 0.05}px ${
                            headSize * 0.14
                        }px rgba(96,42,28,0.28)
                    `,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: headSize * 0.055,
                    boxSizing: "border-box",
                    transition: "transform 0.12s ease-out",
                    willChange: "transform",
                }}
            >
                {/* Face plate holding the eyes */}
                <div
                    ref={faceRef}
                    style={{
                        flex: 1,
                        alignSelf: "stretch",
                        borderRadius: headSize * 0.08,
                        background: `linear-gradient(124deg, ${faceLight} 0%, ${faceLight} 46%, ${faceShade} 100%)`,
                        boxShadow: `
                            inset ${-headSize * 0.04}px 0 ${
                                headSize * 0.15
                            }px rgba(132,64,44,0.55),
                            inset 0 ${-headSize * 0.028}px ${
                                headSize * 0.12
                            }px rgba(132,64,44,0.45),
                            inset 0 ${headSize * 0.018}px ${
                                headSize * 0.07
                            }px rgba(255,255,255,0.95)
                        `,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: `${eyeSpacing}px`,
                        overflow: "hidden",
                    }}
                >
                    {eye(0)}
                    {eye(1)}
                </div>
            </div>
        </div>
    )
}

RobotHead.defaultProps = {
    headSize: 420,
    shellLight: "#F9CDB6",
    shellDark: "#A9603F",
    faceLight: "#FFF6EB",
    faceShade: "#D4A683",
    eyeColor: "#1E1614",
    eyeWidth: 40,
    eyeHeight: 58,
    eyeSpacing: 130,
    spacingRange: 70,
    trackRangeX: 56,
    trackRangeY: 36,
    headShiftX: 14,
    headShiftY: 9,
    headTilt: 1.6,
    sheenSize: 0.72,
    sheenStrength: 0.5,
    sheenTravel: 9,
    blinkInterval: 4,
    background: "#FDF1E1",
}

addPropertyControls(RobotHead, {
    headSize: {
        type: ControlType.Number,
        title: "Head Size",
        defaultValue: 420,
        min: 120,
        max: 900,
        step: 10,
        unit: "px",
    },
    shellLight: {
        type: ControlType.Color,
        title: "Shell Light",
        defaultValue: "#F9CDB6",
    },
    shellDark: {
        type: ControlType.Color,
        title: "Shell Dark",
        defaultValue: "#A9603F",
    },
    faceLight: {
        type: ControlType.Color,
        title: "Face Light",
        defaultValue: "#FFF6EB",
    },
    faceShade: {
        type: ControlType.Color,
        title: "Face Shade",
        defaultValue: "#D4A683",
    },
    eyeColor: {
        type: ControlType.Color,
        title: "Eyes",
        defaultValue: "#1E1614",
    },
    eyeWidth: {
        type: ControlType.Number,
        title: "Eye Width",
        defaultValue: 40,
        min: 6,
        max: 200,
        step: 2,
        unit: "px",
    },
    eyeHeight: {
        type: ControlType.Number,
        title: "Eye Height",
        defaultValue: 58,
        min: 6,
        max: 260,
        step: 2,
        unit: "px",
    },
    eyeSpacing: {
        type: ControlType.Number,
        title: "Eye Gap",
        defaultValue: 130,
        min: 0,
        max: 500,
        step: 2,
        unit: "px",
        description: "Gap when the cursor is far away.",
    },
    spacingRange: {
        type: ControlType.Number,
        title: "Gap Close",
        defaultValue: 70,
        min: 0,
        max: 300,
        step: 2,
        unit: "px",
        description: "How much the eyes converge as the cursor nears.",
    },
    trackRangeX: {
        type: ControlType.Number,
        title: "Travel X",
        defaultValue: 56,
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
    },
    trackRangeY: {
        type: ControlType.Number,
        title: "Travel Y",
        defaultValue: 36,
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
    },
    headShiftX: {
        type: ControlType.Number,
        title: "Head Drift X",
        defaultValue: 14,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    headShiftY: {
        type: ControlType.Number,
        title: "Head Drift Y",
        defaultValue: 9,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    headTilt: {
        type: ControlType.Number,
        title: "Head Tilt",
        defaultValue: 1.6,
        min: 0,
        max: 12,
        step: 0.2,
        unit: "deg",
    },
    sheenSize: {
        type: ControlType.Number,
        title: "Sheen Size",
        defaultValue: 0.72,
        min: 0.2,
        max: 1.4,
        step: 0.02,
        description: "Relative to the eye.",
    },
    sheenStrength: {
        type: ControlType.Number,
        title: "Sheen Strength",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
    },
    sheenTravel: {
        type: ControlType.Number,
        title: "Sheen Travel",
        defaultValue: 9,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    blinkInterval: {
        type: ControlType.Number,
        title: "Blink Every",
        defaultValue: 4,
        min: 1,
        max: 15,
        step: 0.5,
        unit: "s",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FDF1E1",
    },
})
