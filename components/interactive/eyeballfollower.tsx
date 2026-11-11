import { useEffect, useRef } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface EyeFollowerProps {
    eyeColor: string
    pupilColor: string
    backgroundColor: string
    eyeWidth: number
    eyeHeight: number
    pupilSize: number
    eyeSpacing: number
    style?: CSSProperties
}

/**
 * Eye Follower Component
 *
 * Eyes that follow your cursor movement.
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 120
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function EyeFollower(props: EyeFollowerProps) {
    const {
        eyeColor = "#FFFFFF",
        pupilColor = "#000000",
        backgroundColor = "#000000",
        eyeWidth = 80,
        eyeHeight = 100,
        pupilSize = 25,
        eyeSpacing = 20,
        style,
    } = props

    // True on the Framer canvas and during export
    const isStatic = useIsStaticRenderer()

    const eyeRefs = useRef<(HTMLDivElement | null)[]>([null, null])
    const pupilRefs = useRef<(HTMLDivElement | null)[]>([null, null])
    const pointer = useRef<{ x: number; y: number } | null>(null)
    const frame = useRef<number | null>(null)

    useEffect(() => {
        // Static context: no listeners, no animation frames, no effects
        if (isStatic) return

        const padding = 5

        const update = () => {
            frame.current = null

            for (let i = 0; i < 2; i++) {
                const eye = eyeRefs.current[i]
                const pupil = pupilRefs.current[i]
                if (!eye || !pupil) continue

                if (!pointer.current) {
                    pupil.style.transform = "translate(0px, 0px)"
                    continue
                }

                const rect = eye.getBoundingClientRect()
                const scaleX = rect.width / eyeWidth || 1
                const scaleY = rect.height / eyeHeight || 1

                const cx = rect.left + rect.width / 2
                const cy = rect.top + rect.height / 2

                const dx = (pointer.current.x - cx) / scaleX
                const dy = (pointer.current.y - cy) / scaleY
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist === 0) {
                    pupil.style.transform = "translate(0px, 0px)"
                    continue
                }

                // Max radius that keeps the pupil inside the elliptical eye
                const a = Math.max(0, eyeWidth / 2 - pupilSize / 2 - padding)
                const b = Math.max(0, eyeHeight / 2 - pupilSize / 2 - padding)
                const cos = dx / dist
                const sin = dy / dist
                const denom = Math.sqrt(
                    b * cos * (b * cos) + a * sin * (a * sin)
                )
                const maxR = denom === 0 ? 0 : (a * b) / denom

                const d = Math.min(dist, maxR)
                pupil.style.transform = `translate(${cos * d}px, ${sin * d}px)`
            }
        }

        const schedule = () => {
            if (frame.current === null) {
                frame.current = requestAnimationFrame(update)
            }
        }

        const onMove = (e: MouseEvent) => {
            pointer.current = { x: e.clientX, y: e.clientY }
            schedule()
        }

        const onTouch = (e: TouchEvent) => {
            const t = e.touches[0]
            if (!t) return
            pointer.current = { x: t.clientX, y: t.clientY }
            schedule()
        }

        window.addEventListener("mousemove", onMove)
        window.addEventListener("touchmove", onTouch, { passive: true })
        window.addEventListener("touchstart", onTouch, { passive: true })
        schedule()

        return () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("touchmove", onTouch)
            window.removeEventListener("touchstart", onTouch)
            if (frame.current !== null) cancelAnimationFrame(frame.current)
            frame.current = null
        }
    }, [isStatic, eyeWidth, eyeHeight, pupilSize, eyeSpacing])

    const eyeStyle: CSSProperties = {
        width: eyeWidth,
        height: eyeHeight,
        flexShrink: 0,
        backgroundColor: eyeColor,
        borderRadius: "50%",
        position: "relative",
        overflow: "hidden",
    }

    const pupilStyle: CSSProperties = {
        width: pupilSize,
        height: pupilSize,
        backgroundColor: pupilColor,
        borderRadius: "50%",
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -pupilSize / 2,
        marginLeft: -pupilSize / 2,
        // No animation / continuous effects in static renderer
        transition: isStatic ? "none" : "transform 0.05s ease-out",
        willChange: isStatic ? "auto" : "transform",
        transform: "translate(0px, 0px)",
    }

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: eyeSpacing,
                overflow: "hidden",
            }}
        >
            {[0, 1].map((i) => (
                <div
                    key={i}
                    ref={(el) => {
                        eyeRefs.current[i] = el
                    }}
                    style={eyeStyle}
                >
                    <div
                        ref={(el) => {
                            pupilRefs.current[i] = el
                        }}
                        style={pupilStyle}
                    />
                </div>
            ))}
        </div>
    )
}

addPropertyControls(EyeFollower, {
    eyeColor: {
        type: ControlType.Color,
        title: "Eye Color",
        defaultValue: "#FFFFFF",
    },
    pupilColor: {
        type: ControlType.Color,
        title: "Pupil Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    eyeWidth: {
        type: ControlType.Number,
        title: "Eye Width",
        defaultValue: 80,
        min: 30,
        max: 200,
        step: 1,
        unit: "px",
    },
    eyeHeight: {
        type: ControlType.Number,
        title: "Eye Height",
        defaultValue: 100,
        min: 30,
        max: 200,
        step: 1,
        unit: "px",
    },
    pupilSize: {
        type: ControlType.Number,
        title: "Pupil Size",
        defaultValue: 25,
        min: 5,
        max: 80,
        step: 1,
        unit: "px",
    },
    eyeSpacing: {
        type: ControlType.Number,
        title: "Eye Spacing",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
})
