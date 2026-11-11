import * as React from "react"
import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
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
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 */

type SpotlightShape = "circle" | "ellipse"
type VisibilityMode = "hover" | "always"
type BlendMode =
    | "normal"
    | "screen"
    | "soft-light"
    | "overlay"
    | "multiply"
    | "color-dodge"

export interface WebXCursorSpotlightProps {
    spotlightColor: string
    spotlightOpacity: number
    spotlightSize: number
    softness: number
    falloff: number
    shape: SpotlightShape
    aspectRatio: number
    rotation: number
    offsetX: number
    offsetY: number
    visibilityMode: VisibilityMode
    idleX: number
    idleY: number
    stiffness: number
    damping: number
    mass: number
    blendMode: BlendMode
    clipRadius: number
    style?: React.CSSProperties
}

export const defaultProps: WebXCursorSpotlightProps = {
    spotlightColor: "#7C3AED",
    spotlightOpacity: 0.35,
    spotlightSize: 480,
    softness: 18,
    falloff: 12,
    shape: "circle",
    aspectRatio: 1.6,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    visibilityMode: "hover",
    idleX: 50,
    idleY: 50,
    stiffness: 120,
    damping: 20,
    mass: 0.5,
    blendMode: "normal",
    clipRadius: 0,
}

export default function WebXCursorSpotlight(props: WebXCursorSpotlightProps) {
    const {
        spotlightColor,
        spotlightOpacity,
        spotlightSize,
        softness,
        falloff,
        shape,
        aspectRatio,
        rotation,
        offsetX,
        offsetY,
        visibilityMode,
        idleX,
        idleY,
        stiffness,
        damping,
        mass,
        blendMode,
        clipRadius,
        style,
    } = { ...defaultProps, ...props }

    const containerRef = React.useRef<HTMLDivElement>(null)
    const prefersReducedMotion = useReducedMotion()
    const isStaticRenderer = useIsStaticRenderer()
    const [isNearViewport, setIsNearViewport] = React.useState(false)

    const rawX = useMotionValue(0)
    const rawY = useMotionValue(0)
    const rawOpacity = useMotionValue(0)

    const springX = useSpring(rawX, { stiffness, damping, mass })
    const springY = useSpring(rawY, { stiffness, damping, mass })
    const springOpacity = useSpring(rawOpacity, {
        stiffness: 180,
        damping: 24,
        mass: 0.35,
    })

    const x = prefersReducedMotion ? rawX : springX
    const y = prefersReducedMotion ? rawY : springY
    const opacity = prefersReducedMotion ? rawOpacity : springOpacity

    React.useEffect(() => {
        const element = containerRef.current
        if (!element || isStaticRenderer) return

        if (typeof IntersectionObserver === "undefined") {
            setIsNearViewport(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                const nextValue = entry.isIntersecting
                setIsNearViewport((currentValue) =>
                    currentValue === nextValue ? currentValue : nextValue
                )
            },
            {
                rootMargin: "200px 0px",
                threshold: 0,
            }
        )

        observer.observe(element)

        return () => observer.disconnect()
    }, [isStaticRenderer])

    React.useEffect(() => {
        const element = containerRef.current
        if (!element || isStaticRenderer || !isNearViewport) return

        const setIdlePosition = () => {
            const rect = element.getBoundingClientRect()
            rawX.set(rect.width * (idleX / 100))
            rawY.set(rect.height * (idleY / 100))
        }

        setIdlePosition()

        if (typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(setIdlePosition)
        observer.observe(element)

        return () => observer.disconnect()
    }, [idleX, idleY, isNearViewport, isStaticRenderer, rawX, rawY])

    React.useEffect(() => {
        if (isStaticRenderer) return

        rawOpacity.set(
            isNearViewport && visibilityMode === "always" ? spotlightOpacity : 0
        )
    }, [
        isNearViewport,
        isStaticRenderer,
        rawOpacity,
        spotlightOpacity,
        visibilityMode,
    ])

    React.useEffect(() => {
        if (isStaticRenderer || !isNearViewport) return

        const handlePointerMove = (event: PointerEvent) => {
            const element = containerRef.current
            if (!element) return

            const rect = element.getBoundingClientRect()
            const isInside =
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom

            if (isInside) {
                rawX.set(event.clientX - rect.left + offsetX)
                rawY.set(event.clientY - rect.top + offsetY)
                rawOpacity.set(spotlightOpacity)
            } else if (visibilityMode === "hover") {
                rawOpacity.set(0)
            }
        }

        const hideSpotlight = () => {
            if (visibilityMode === "hover") rawOpacity.set(0)
        }

        window.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })
        window.addEventListener("blur", hideSpotlight)
        document.addEventListener("mouseleave", hideSpotlight)

        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("blur", hideSpotlight)
            document.removeEventListener("mouseleave", hideSpotlight)
        }
    }, [
        isNearViewport,
        isStaticRenderer,
        offsetX,
        offsetY,
        rawOpacity,
        rawX,
        rawY,
        spotlightOpacity,
        visibilityMode,
    ])

    const safeAspectRatio = Math.max(aspectRatio, 0.01)
    const spotlightWidth = spotlightSize
    const spotlightHeight =
        shape === "circle" ? spotlightSize : spotlightSize / safeAspectRatio
    const gradient = `radial-gradient(ellipse at center, ${spotlightColor} 0%, ${spotlightColor} ${falloff}%, transparent 100%)`

    return (
        <div
            ref={containerRef}
            aria-hidden="true"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: clipRadius,
                pointerEvents: "none",
                userSelect: "none",
                ...style,
            }}
        >
            {isStaticRenderer ? (
                <div
                    style={{
                        position: "absolute",
                        left: `calc(${idleX}% + ${offsetX}px)`,
                        top: `calc(${idleY}% + ${offsetY}px)`,
                        width: spotlightWidth,
                        height: spotlightHeight,
                        opacity: spotlightOpacity,
                        background: gradient,
                        borderRadius: "50%",
                        filter: softness > 0 ? `blur(${softness}px)` : "none",
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        transformOrigin: "center",
                        mixBlendMode: blendMode,
                        pointerEvents: "none",
                    }}
                />
            ) : isNearViewport ? (
                <motion.div
                    style={{
                        position: "absolute",
                        left: -spotlightWidth / 2,
                        top: -spotlightHeight / 2,
                        x,
                        y,
                        rotate: rotation,
                        width: spotlightWidth,
                        height: spotlightHeight,
                        opacity,
                        background: gradient,
                        borderRadius: "50%",
                        filter: softness > 0 ? `blur(${softness}px)` : "none",
                        transformOrigin: "center",
                        mixBlendMode: blendMode,
                        pointerEvents: "none",
                        willChange: "transform, opacity",
                    }}
                />
            ) : null}
        </div>
    )
}

WebXCursorSpotlight.defaultProps = defaultProps

export const webXPreview = {
    width: 800,
    height: 500,
}

export const propertyControls = {
    spotlightColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: defaultProps.spotlightColor,
    },
    spotlightOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: defaultProps.spotlightOpacity,
        min: 0,
        max: 1,
        step: 0.01,
    },
    spotlightSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: defaultProps.spotlightSize,
        min: 80,
        max: 1600,
        step: 10,
        unit: "px",
    },
    softness: {
        type: ControlType.Number,
        title: "Softness",
        defaultValue: defaultProps.softness,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    falloff: {
        type: ControlType.Number,
        title: "Core",
        defaultValue: defaultProps.falloff,
        min: 0,
        max: 70,
        step: 1,
        unit: "%",
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["circle", "ellipse"],
        optionTitles: ["Circle", "Ellipse"],
        defaultValue: defaultProps.shape,
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Aspect",
        defaultValue: defaultProps.aspectRatio,
        min: 1,
        max: 4,
        step: 0.05,
        hidden: (props: WebXCursorSpotlightProps) => props.shape !== "ellipse",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: defaultProps.rotation,
        min: -90,
        max: 90,
        step: 1,
        unit: "deg",
        hidden: (props: WebXCursorSpotlightProps) => props.shape === "circle",
    },
    offsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: defaultProps.offsetX,
        min: -300,
        max: 300,
        step: 1,
        unit: "px",
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: defaultProps.offsetY,
        min: -300,
        max: 300,
        step: 1,
        unit: "px",
    },
    visibilityMode: {
        type: ControlType.Enum,
        title: "Visibility",
        options: ["hover", "always"],
        optionTitles: ["On Hover", "Always"],
        defaultValue: defaultProps.visibilityMode,
    },
    idleX: {
        type: ControlType.Number,
        title: "Idle X",
        defaultValue: defaultProps.idleX,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: WebXCursorSpotlightProps) =>
            props.visibilityMode !== "always",
    },
    idleY: {
        type: ControlType.Number,
        title: "Idle Y",
        defaultValue: defaultProps.idleY,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: WebXCursorSpotlightProps) =>
            props.visibilityMode !== "always",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend",
        options: [
            "normal",
            "screen",
            "soft-light",
            "overlay",
            "multiply",
            "color-dodge",
        ],
        optionTitles: [
            "Normal",
            "Screen",
            "Soft Light",
            "Overlay",
            "Multiply",
            "Color Dodge",
        ],
        defaultValue: defaultProps.blendMode,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: defaultProps.stiffness,
        min: 20,
        max: 500,
        step: 5,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: defaultProps.damping,
        min: 1,
        max: 60,
        step: 1,
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        defaultValue: defaultProps.mass,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    clipRadius: {
        type: ControlType.Number,
        title: "Clip Radius",
        defaultValue: defaultProps.clipRadius,
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
    },
}

addPropertyControls(WebXCursorSpotlight, propertyControls)
