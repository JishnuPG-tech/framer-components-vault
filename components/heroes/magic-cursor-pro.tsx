import React, { useEffect, useRef, useState } from "react"
import { motion, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- Default Cursor Icon ---
const DefaultCursorSVG = ({ invertColors }: { invertColors?: boolean }) => {
    const innerColor = invertColors ? "white" : "black"
    const outerColor = invertColors ? "black" : "white"

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            viewBox="0 0 50 54"
            fill="none"
        >
            <g filter="url(#filter0_d_91_7928)">
                <path
                    d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
                    fill={innerColor}
                />
                <path
                    d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
                    stroke={outerColor}
                    strokeWidth={2.25825}
                />
            </g>
            <defs>
                <filter
                    id="filter0_d_91_7928"
                    x={0.602397}
                    y={0.952444}
                    width={49.0584}
                    height={52.428}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset dy={2.25825} />
                    <feGaussianBlur stdDeviation={2.25825} />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_91_7928"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_91_7928"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    )
}

// --- Main Component ---
export default function SmoothCursor(props) {
    const {
        stiffness,
        damping,
        mass,
        hideSystemCursor,
        cursorImage,
        cursorSize,
        enableBlendMode,
        invertIconColors,
        enableClickEffect,
    } = props

    const [isVisible, setIsVisible] = useState(true)

    const cursorX = useSpring(-100, { stiffness, damping, mass })
    const cursorY = useSpring(-100, { stiffness, damping, mass })
    const rotation = useSpring(0, { stiffness: 300, damping: 60 })
    const scale = useSpring(1, { stiffness: 500, damping: 35 })

    const lastMousePos = useRef({ x: 0, y: 0 })
    const velocity = useRef({ x: 0, y: 0 })
    const lastUpdateTime = useRef(Date.now())
    const previousAngle = useRef(0)
    const accumulatedRotation = useRef(0)
    const rafId = useRef<number | null>(null)
    const isMouseDown = useRef(false)

    // 1. Aspect Ratio / Mobile Detection Effect
    useEffect(() => {
        if (typeof window === "undefined") return

        const checkDeviceConstraints = () => {
            const isPortrait = window.innerHeight > window.innerWidth
            const isMobileWidth = window.innerWidth < 768
            const isTouch =
                "ontouchstart" in window || navigator.maxTouchPoints > 0

            if (isPortrait || isMobileWidth || isTouch) {
                setIsVisible(false)
            } else {
                setIsVisible(true)
            }
        }

        checkDeviceConstraints()

        window.addEventListener("resize", checkDeviceConstraints)
        return () =>
            window.removeEventListener("resize", checkDeviceConstraints)
    }, [])

    // 2. Cursor Movement & Click Effect
    useEffect(() => {
        if (typeof window === "undefined" || !isVisible) {
            document.body.style.cursor = "auto"
            return
        }

        const updateVelocity = (currentPos: { x: number; y: number }) => {
            const currentTime = Date.now()
            const deltaTime = currentTime - lastUpdateTime.current

            if (deltaTime > 0) {
                velocity.current = {
                    x: (currentPos.x - lastMousePos.current.x) / deltaTime,
                    y: (currentPos.y - lastMousePos.current.y) / deltaTime,
                }
            }
            lastUpdateTime.current = currentTime
            lastMousePos.current = currentPos
        }

        const smoothMouseMove = (e: MouseEvent) => {
            const currentPos = { x: e.clientX, y: e.clientY }
            updateVelocity(currentPos)

            const speed = Math.sqrt(
                Math.pow(velocity.current.x, 2) +
                    Math.pow(velocity.current.y, 2)
            )

            cursorX.set(currentPos.x)
            cursorY.set(currentPos.y)

            if (speed > 0.1) {
                const currentAngle =
                    Math.atan2(velocity.current.y, velocity.current.x) *
                        (180 / Math.PI) +
                    90

                let angleDiff = currentAngle - previousAngle.current
                if (angleDiff > 180) angleDiff -= 360
                if (angleDiff < -180) angleDiff += 360

                accumulatedRotation.current += angleDiff
                rotation.set(accumulatedRotation.current)
                previousAngle.current = currentAngle

                // Only apply movement squish if the mouse isn't currently clicked down
                if (!isMouseDown.current) {
                    scale.set(0.95)
                    setTimeout(() => {
                        if (!isMouseDown.current) scale.set(1)
                    }, 150)
                }
            }
        }

        const throttledMouseMove = (e: MouseEvent) => {
            if (rafId.current) return
            rafId.current = requestAnimationFrame(() => {
                smoothMouseMove(e)
                rafId.current = null
            })
        }

        // Click Handlers
        const handleMouseDown = () => {
            isMouseDown.current = true
            if (enableClickEffect) scale.set(0.7)
        }

        const handleMouseUp = () => {
            isMouseDown.current = false
            if (enableClickEffect) scale.set(1)
        }

        if (hideSystemCursor) {
            document.body.style.cursor = "none"
        }

        window.addEventListener("mousemove", throttledMouseMove)
        window.addEventListener("mousedown", handleMouseDown)
        window.addEventListener("mouseup", handleMouseUp)

        // Failsafe: if the mouse leaves the window entirely, reset the click state
        window.addEventListener("mouseleave", handleMouseUp)

        return () => {
            window.removeEventListener("mousemove", throttledMouseMove)
            window.removeEventListener("mousedown", handleMouseDown)
            window.removeEventListener("mouseup", handleMouseUp)
            window.removeEventListener("mouseleave", handleMouseUp)
            document.body.style.cursor = "auto"
            if (rafId.current) cancelAnimationFrame(rafId.current)
        }
    }, [
        cursorX,
        cursorY,
        rotation,
        scale,
        hideSystemCursor,
        isVisible,
        enableClickEffect,
    ])

    // If constraints (mobile/aspect ratio) are met, don't render the UI
    if (!isVisible) return null

    return (
        <>
            {/* FORCE HIDE SYSTEM CURSOR ON ALL ELEMENTS (LINKS/BUTTONS) */}
            {hideSystemCursor && (
                <style>{`* { cursor: none !important; }`}</style>
            )}

            <motion.div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    x: cursorX,
                    y: cursorY,
                    rotate: rotation,
                    scale: scale,
                    zIndex: 999999,
                    pointerEvents: "none",
                    willChange: "transform",
                    mixBlendMode: enableBlendMode ? "difference" : "normal",
                    width: cursorSize,
                    height: cursorSize,
                    marginLeft: -cursorSize / 2,
                    marginTop: -cursorSize / 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {/* If the user uploads an image, show it. Otherwise, show default SVG */}
                {cursorImage ? (
                    <img
                        src={cursorImage}
                        alt="Custom Cursor"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                    />
                ) : (
                    <DefaultCursorSVG invertColors={invertIconColors} />
                )}
            </motion.div>
        </>
    )
}

// --- Framer Property Controls ---
SmoothCursor.defaultProps = {
    cursorSize: 40,
    stiffness: 400,
    damping: 45,
    mass: 1,
    hideSystemCursor: true,
    enableBlendMode: false,
    invertIconColors: false,
    enableClickEffect: true,
}

addPropertyControls(SmoothCursor, {
    cursorImage: {
        type: ControlType.Image,
        title: "Custom Icon",
    },
    invertIconColors: {
        type: ControlType.Boolean,
        title: "Invert Default Icon",
        defaultValue: false,
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 10,
        max: 200,
        defaultValue: 40,
    },
    enableBlendMode: {
        type: ControlType.Boolean,
        title: "Mix Blend Mode",
        defaultValue: false,
    },
    enableClickEffect: {
        type: ControlType.Boolean,
        title: "Click Squish Effect",
        defaultValue: true,
    },
    stiffness: {
        type: ControlType.Number,
        min: 0,
        max: 1000,
        title: "Stiffness",
    },
    damping: { type: ControlType.Number, min: 0, max: 100, title: "Damping" },
    mass: { type: ControlType.Number, min: 0.1, max: 10, title: "Mass" },
    hideSystemCursor: { type: ControlType.Boolean, title: "Hide System" },
})
