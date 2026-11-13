// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useSpring, useTransform } from "framer-motion"
import { FC, JSX, useEffect, useMemo, useRef, useState } from "react"

// Interface for cursor position
interface Position {
    x: number
    y: number
}

// Spring configuration interface
interface SpringConfig {
    damping: number
    stiffness: number
    mass: number
    restDelta: number
}

// Default Spring Configuration
const defaultSpringConfig: SpringConfig = {
    damping: 45,
    stiffness: 400,
    mass: 1,
    restDelta: 0.001,
}

// Component props interface
export interface DirectionalCursorProps {
    cursor?: JSX.Element
    controlMode?: "beginner" | "advanced"
    followSpeed?: number
    springConfig?: SpringConfig
    customSvg?: string
    useCustomSvg?: boolean
    hideOnMobile?: boolean
    hideOnTablet?: boolean
    keepBrowserCursor?: boolean
    keepTextCursor?: boolean
    keepPointerCursor?: boolean
    cursorSize?: number
    damping?: number
    stiffness?: number
    mass?: number
    restDelta?: number
    style?: React.CSSProperties
}

// Default cursor SVG component
const DefaultCursorSVG: FC = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={50}
            height={54}
            viewBox="0 0 50 54"
            fill="none"
        >
            <g filter="url(#filter0_d_91_7928)">
                <path
                    d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z"
                    fill="black"
                />
                <path
                    d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z"
                    stroke="white"
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

// Custom SVG renderer component
const CustomSvgRenderer: FC<{ svgCode: string }> = ({ svgCode }) => {
    return <div dangerouslySetInnerHTML={{ __html: svgCode }} />
}

// Device detection utility
const getDeviceType = (): "mobile" | "tablet" | "desktop" => {
    if (typeof window === "undefined") return "desktop"

    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
            userAgent
        )

    if (isMobile) {
        const isTablet =
            /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
                userAgent
            )
        return isTablet ? "tablet" : "mobile"
    }

    return "desktop"
}

// Canvas detection
const renderContext = RenderTarget.current()
const isCanvasMode = renderContext === RenderTarget.canvas

/**
 * DirectionalCursor - Directional cursor with device-aware rendering
 * Features device detection and progressive control system
 *
 * @framerDisableUnlink
 */
export default function DirectionalCursor({
    hideOnMobile = false,
    hideOnTablet = false,
    keepBrowserCursor = false,
    controlMode = "beginner",
    followSpeed = 50,
    cursorSize = 1,
    damping = 45,
    stiffness = 400,
    mass = 1,
    restDelta = 0.001,
    customSvg = "",
    useCustomSvg = false,
    keepTextCursor = true,
    keepPointerCursor = true,
    style,
    ...props
}: DirectionalCursorProps) {
    // Build spring config from individual props
    const springConfig = useMemo(
        () => ({
            damping,
            stiffness,
            mass,
            restDelta,
        }),
        [damping, stiffness, mass, restDelta]
    )

    // Device detection
    const [deviceType, setDeviceType] = useState<
        "mobile" | "tablet" | "desktop"
    >("desktop")

    useEffect(() => {
        setDeviceType(getDeviceType())
    }, [])

    // Hide cursor based on device type
    const shouldHideCursor = useMemo(() => {
        if (deviceType === "mobile" && hideOnMobile) return true
        if (deviceType === "tablet" && hideOnTablet) return true
        return false
    }, [deviceType, hideOnMobile, hideOnTablet])

    // State management for cursor behavior
    const [isMoving, setIsMoving] = useState(false)

    // Refs for tracking cursor state and calculations
    const lastMousePos = useRef<Position>({ x: 0, y: 0 })
    const velocity = useRef<Position>({ x: 0, y: 0 })
    const lastUpdateTime = useRef(Date.now())
    const previousAngle = useRef(0)
    const accumulatedRotation = useRef(0)

    // Dynamic spring configuration based on control mode
    const mapRange = (
        value: number,
        inMin: number,
        inMax: number,
        outMin: number,
        outMax: number
    ): number =>
        ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin

    const positionSpringConfig = useMemo(() => {
        // In beginner mode, use followSpeed to control spring behavior
        if (controlMode === "beginner" && keepBrowserCursor) {
            let calculatedStiffness: number, calculatedDamping: number
            if (followSpeed <= 50) {
                calculatedStiffness = mapRange(followSpeed, 0, 50, 50, 400)
                calculatedDamping = mapRange(followSpeed, 0, 50, 15, 45)
            } else {
                calculatedStiffness = mapRange(followSpeed, 50, 100, 400, 8000)
                calculatedDamping = mapRange(followSpeed, 50, 100, 45, 200)
            }
            return {
                stiffness: calculatedStiffness,
                damping: calculatedDamping,
                mass: springConfig.mass,
                restDelta: springConfig.restDelta,
            }
        } else {
            return springConfig
        }
    }, [followSpeed, springConfig, controlMode, keepBrowserCursor])

    // Position springs with dynamic config
    const cursorX = useSpring(
        typeof window !== "undefined" ? window.innerWidth / 2 : 0,
        positionSpringConfig
    )
    const cursorY = useSpring("-50px", positionSpringConfig)
    const translateX = useSpring("-50%", positionSpringConfig)
    const translateY = useSpring("0%", positionSpringConfig)

    // Rotation and scale springs use separate configs
    const rotation = useSpring(0, {
        ...positionSpringConfig,
        damping: 60,
        stiffness: 300,
    })
    const baseScale = useSpring(1, {
        ...positionSpringConfig,
        stiffness: 500,
        damping: 35,
    })

    // Combine base scale with cursor size
    const combinedScale = useTransform(
        baseScale,
        (value: number) => value * (cursorSize || 1)
    )

    // Determine which cursor to render
    const cursorElement =
        useCustomSvg && customSvg ? (
            <CustomSvgRenderer svgCode={customSvg} />
        ) : (
            <DefaultCursorSVG />
        )

    // CSS injection effect for hiding browser cursor - IMPROVED VERSION
    useEffect(() => {
        if (keepBrowserCursor) return

        const cssId = "smooth-cursor-css"
        let existingStyle = document.getElementById(cssId) as HTMLStyleElement

        if (!existingStyle) {
            existingStyle = document.createElement("style")
            existingStyle.id = cssId
            document.head.appendChild(existingStyle)
        }

        // Start with base rule - hide cursor everywhere
        let css = `* { cursor: none !important; }`

        // Exception: Keep text cursor on text input elements
        if (keepTextCursor) {
            css += `
                input,
                textarea,
                select,
                [contenteditable="true"] {
                    cursor: text !important;
                }
            `
        }

        // Exception: Keep pointer cursor on interactive elements AND their children
        if (keepPointerCursor) {
            css += `
                button,
                button *,
                a,
                a *,
                [role="button"],
                [role="button"] *,
                [onclick],
                [onclick] *,
                .clickable,
                .clickable *,
                [data-clickable],
                [data-clickable] *,
                input[type="button"],
                input[type="submit"],
                input[type="reset"],
                label[for],
                label[for] * {
                    cursor: pointer !important;
                }
            `
        }

        existingStyle.innerHTML = css

        return () => {
            const styleElement = document.getElementById(cssId)
            if (styleElement) styleElement.remove()
        }
    }, [keepBrowserCursor, keepTextCursor, keepPointerCursor])

    // Main cursor tracking and animation effect
    useEffect(() => {
        if (isCanvasMode || shouldHideCursor) return

        const updateVelocity = (currentPos: Position) => {
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
                velocity.current.x * velocity.current.x +
                    velocity.current.y * velocity.current.y
            )

            // Update cursor position
            cursorX.set(currentPos.x)
            cursorY.set(currentPos.y)

            if (speed > 0.1) {
                // Calculate angle based on velocity direction
                const currentAngle =
                    Math.atan2(velocity.current.y, velocity.current.x) *
                        (180 / Math.PI) +
                    90

                // Handle angle wrapping for smooth rotation
                let angleDiff = currentAngle - previousAngle.current
                if (angleDiff > 180) angleDiff -= 360
                if (angleDiff < -180) angleDiff += 360

                accumulatedRotation.current += angleDiff
                rotation.set(accumulatedRotation.current)
                previousAngle.current = currentAngle

                // Directional transform
                const normalizedAngle = ((currentAngle % 360) + 360) % 360

                if (normalizedAngle >= 315 || normalizedAngle < 45) {
                    // Moving UP
                    translateX.set("-50%")
                    translateY.set("0%")
                } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
                    // Moving RIGHT
                    translateX.set("-100%")
                    translateY.set("-50%")
                } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
                    // Moving DOWN
                    translateX.set("-50%")
                    translateY.set("-100%")
                } else {
                    // Moving LEFT
                    translateX.set("0%")
                    translateY.set("-50%")
                }

                // Scale down slightly during movement
                baseScale.set(0.95)
                setIsMoving(true)

                const timeout = setTimeout(() => {
                    baseScale.set(1)
                    setIsMoving(false)
                }, 150)

                return () => clearTimeout(timeout)
            }
        }

        // Throttled mouse movement
        let rafId: number
        const throttledMouseMove = (e: MouseEvent) => {
            if (rafId) return
            rafId = requestAnimationFrame(() => {
                smoothMouseMove(e)
                rafId = 0
            })
        }

        window.addEventListener("mousemove", throttledMouseMove)

        return () => {
            window.removeEventListener("mousemove", throttledMouseMove)
            if (rafId) cancelAnimationFrame(rafId)
        }
    }, [
        cursorX,
        cursorY,
        rotation,
        baseScale,
        translateX,
        translateY,
        isCanvasMode,
        shouldHideCursor,
    ])

    // Canvas preview
    if (isCanvasMode) {
        return null
    }

    // Don't render cursor if hidden on current device
    if (shouldHideCursor) {
        return null
    }

    return (
        <motion.div
            style={{
                position: "fixed",
                left: cursorX,
                top: cursorY,
                translateX: translateX,
                translateY: translateY,
                rotate: rotation,
                scale: combinedScale,
                zIndex: 100,
                pointerEvents: "none",
                willChange: "transform",
                ...style,
            }}
        >
            {cursorElement}
        </motion.div>
    )
}

// Set display name for better debugging
DirectionalCursor.displayName = "Directional Cursor"

// Property controls
addPropertyControls(DirectionalCursor, {
    hideOnMobile: {
        type: ControlType.Boolean,
        title: "Hide on Mobile",
        defaultValue: false,
        description: "Hide the custom cursor on mobile devices.",
        enabledTitle: "Hide",
        disabledTitle: "Show",
    },
    hideOnTablet: {
        type: ControlType.Boolean,
        title: "Hide on Tablet",
        defaultValue: false,
        description: "Hide the custom cursor on tablet devices.",
        enabledTitle: "Hide",
        disabledTitle: "Show",
    },
    keepBrowserCursor: {
        type: ControlType.Boolean,
        title: "Keep Browser Cursor",
        defaultValue: false,
        description:
            "Keep the default browser cursor visible alongside the custom cursor.",
        enabledTitle: "Keep",
        disabledTitle: "Hide",
    },
    controlMode: {
        type: ControlType.Enum,
        title: "Control Mode",
        options: ["beginner", "advanced"],
        optionTitles: ["Beginner", "Advanced"],
        defaultValue: "beginner",
        displaySegmentedControl: true,
        description:
            "Choose control complexity: Beginner for simple adjustments, Advanced for detailed spring physics.",
        hidden: (props) => !props.keepBrowserCursor,
    },
    followSpeed: {
        type: ControlType.Number,
        title: "Follow Speed",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 5,
        displayStepper: true,
        hidden: (props) =>
            !props.keepBrowserCursor || props.controlMode === "advanced",
        description:
            "How quickly the cursor follows your pointer: 0 = smooth & slow, 100 = instant & snappy.",
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 45,
        min: 1,
        max: 100,
        description:
            "Controls bounciness. Higher = less bouncy, more controlled.",
        hidden: (props) =>
            !props.keepBrowserCursor || props.controlMode === "beginner",
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 400,
        min: 50,
        max: 1000,
        description:
            "Spring tension. Higher = faster response, more aggressive movement.",
        hidden: (props) =>
            !props.keepBrowserCursor || props.controlMode === "beginner",
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        description: "Virtual weight. Higher = heavier feel, more inertia.",
    },
    restDelta: {
        type: ControlType.Number,
        title: "Rest Delta",
        defaultValue: 0.001,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        description:
            "Animation stop threshold. Lower = more precise, higher = better performance.",
    },
    keepTextCursor: {
        type: ControlType.Boolean,
        title: "Keep Text Cursor",
        defaultValue: true,
        hidden: (props) => props.keepBrowserCursor,
        description:
            "Keep text cursor in input fields when browser cursor is hidden.",
    },
    keepPointerCursor: {
        type: ControlType.Boolean,
        title: "Keep Pointer Cursor",
        defaultValue: true,
        hidden: (props) => props.keepBrowserCursor,
        description:
            "Keep pointer cursor on buttons & links when browser cursor is hidden.",
    },
    cursorSize: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        displayStepper: true,
        description: "Size of the cursor: 0.1 = tiny, 1 = normal, 3 = large.",
    },
    useCustomSvg: {
        type: ControlType.Boolean,
        title: "Use Custom SVG",
        defaultValue: false,
        description:
            "Enable to use a custom SVG instead of the default cursor.\n\nMade with ❤️ by [Soyeb](https://framer.link/project)",
        enabledTitle: "Custom",
        disabledTitle: "Default",
    },
    customSvg: {
        type: ControlType.String,
        title: "Custom SVG Code",
        displayTextArea: true,
        placeholder: "Paste your complete SVG markup here...",
        hidden: (props) => !props.useCustomSvg,
        description: "Enter full SVG markup including <svg> tags.",
    },
})
