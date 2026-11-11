// 3D Tilt Card with Holographic Overlay Effect
import {
    useRef,
    useState,
    useCallback,
    useMemo,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from "framer-motion"

interface HologramImageEffectProps {
    image: { src: string; alt?: string }
    overlayImage: { src: string; alt?: string }
    tiltIntensity: number
    springStiffness: number
    springDamping: number
    borderRadius: number
    overlayOpacity: number
    overlayBlendMode: string
    overlayTintColor: string
    overlayTintOpacity: number
    overlayPattern: string
    overlayScale: number
    overlayAnimationSpeed: number
    glareIntensity: number
    shadowIntensity: number
    enableReflection: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function HologramImageEffect({
    image = {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Card image",
    },
    overlayImage = {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Overlay image",
    },
    tiltIntensity = 10,
    springStiffness = 150,
    springDamping = 15,
    borderRadius = 16,
    overlayOpacity = 0.8,
    overlayBlendMode = "color-dodge",
    overlayTintColor = "#ffffff",
    overlayTintOpacity = 0,
    overlayPattern = "conic",
    overlayScale = 1,
    overlayAnimationSpeed = 1,
    glareIntensity = 0.6,
    shadowIntensity = 0.3,
    enableReflection = true,
    style,
}: HologramImageEffectProps) {
    const figureRef = useRef<HTMLDivElement>(null)
    const [isHovering, setIsHovering] = useState(false)
    const isStatic = useIsStaticRenderer()

    const rotateX = useMotionValue(0)
    const rotateY = useMotionValue(0)
    const mouseX = useMotionValue(0.5)
    const mouseY = useMotionValue(0.5)

    const springCfg = useMemo(
        () => ({ stiffness: springStiffness, damping: springDamping }),
        [springStiffness, springDamping]
    )

    const rotateXSpring = useSpring(rotateX, springCfg)
    const rotateYSpring = useSpring(rotateY, springCfg)
    const mouseXSpring = useSpring(mouseX, springCfg)
    const mouseYSpring = useSpring(mouseY, springCfg)

    const glareGradient = useTransform(
        [mouseXSpring, mouseYSpring],
        ([x, y]) =>
            `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,${glareIntensity}) 0%, transparent 50%)`
    )

    const shadowTransform = useTransform(
        [rotateXSpring, rotateYSpring],
        ([x, y]) => {
            const offsetX = y * 2
            const offsetY = x * 2
            const blur = 20 + Math.abs(x) + Math.abs(y)
            return `drop-shadow(${offsetX}px ${offsetY}px ${blur}px rgba(0,0,0,${shadowIntensity}))`
        }
    )

    const overlayRotation = useTransform(
        [mouseXSpring, mouseYSpring],
        ([x, y]) => `${(x - 0.5) * 180 * overlayAnimationSpeed}deg`
    )

    const overlayPosition = useTransform(
        [mouseXSpring, mouseYSpring],
        ([x, y]) => `${x * 100}% ${y * 100}%`
    )

    const getOverlayMask = useCallback(() => {
        switch (overlayPattern) {
            case "conic":
                return `conic-gradient(from var(--rotation), transparent 0deg, rgba(255,255,255,0.9) 60deg, transparent 120deg, rgba(255,255,255,0.9) 180deg, transparent 240deg, rgba(255,255,255,0.9) 300deg, transparent 360deg)`
            case "radial":
                return `radial-gradient(circle at var(--position), rgba(255,255,255,0.9) 0%, transparent 60%)`
            case "linear":
                return `linear-gradient(var(--rotation), transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)`
            case "diamond":
                return `conic-gradient(from var(--rotation), transparent 0deg, rgba(255,255,255,0.9) 45deg, transparent 90deg, rgba(255,255,255,0.9) 135deg, transparent 180deg, rgba(255,255,255,0.9) 225deg, transparent 270deg, rgba(255,255,255,0.9) 315deg, transparent 360deg)`
            case "none":
                return "none"
            default:
                return `conic-gradient(from var(--rotation), transparent 0deg, rgba(255,255,255,0.9) 60deg, transparent 120deg, rgba(255,255,255,0.9) 180deg, transparent 240deg, rgba(255,255,255,0.9) 300deg, transparent 360deg)`
        }
    }, [overlayPattern])

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!figureRef.current || isStatic) return

            const rect = figureRef.current.getBoundingClientRect()
            const relX = e.clientX - rect.left
            const relY = e.clientY - rect.top

            const percentX = relX / rect.width
            const percentY = relY / rect.height

            const rotX = (percentY - 0.5) * tiltIntensity
            const rotY = (percentX - 0.5) * -tiltIntensity

            rotateX.set(rotX)
            rotateY.set(rotY)
            mouseX.set(percentX)
            mouseY.set(percentY)
        },
        [isStatic, tiltIntensity, rotateX, rotateY, mouseX, mouseY]
    )

    const handlePointerEnter = useCallback(() => {
        if (!isStatic) {
            startTransition(() => setIsHovering(true))
        }
    }, [isStatic])

    const handlePointerLeave = useCallback(() => {
        if (!isStatic) {
            startTransition(() => setIsHovering(false))
            rotateX.set(0)
            rotateY.set(0)
            mouseX.set(0.5)
            mouseY.set(0.5)
        }
    }, [isStatic, rotateX, rotateY, mouseX, mouseY])

    const baseStyle = useMemo<CSSProperties>(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            perspective: "1000px",
            transformStyle: "preserve-3d",
            ...style,
        }),
        [style]
    )

    const imageStyle = useMemo<CSSProperties>(
        () => ({
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            borderRadius,
            userSelect: "none",
        }),
        [borderRadius]
    )

    return (
        <div style={baseStyle}>
            <svg
                width="0"
                height="0"
                style={{ position: "absolute", pointerEvents: "none" }}
                aria-hidden="true"
            >
                <defs>
                    <filter id="holographicEdges">
                        <feGaussianBlur stdDeviation="0.5" />
                        <feColorMatrix
                            type="matrix"
                            values="1 0 0 0 0
                                    0 1 0 0 0
                                    0 0 1 0 0
                                    0 0 0 2 -0.5"
                        />
                    </filter>
                </defs>
            </svg>

            <motion.div
                ref={figureRef}
                onPointerMove={handlePointerMove}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius,
                    rotateX: rotateXSpring,
                    rotateY: rotateYSpring,
                    transformStyle: "preserve-3d",
                    filter: shadowTransform,
                    transition: "filter 0.3s ease-out",
                }}
            >
                <img
                    src={image.src}
                    alt={image.alt || ""}
                    style={imageStyle}
                    draggable={false}
                />

                {!isStatic && (
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius,
                            backgroundImage: `url(${overlayImage.src})`,
                            backgroundSize: `${overlayScale * 100}%`,
                            backgroundPosition: "center",
                            filter: "url(#holographicEdges)",
                            mixBlendMode: overlayBlendMode as any,
                            opacity: isHovering ? overlayOpacity : 0,
                            pointerEvents: "none",
                            // @ts-ignore
                            "--rotation": overlayRotation,
                            "--position": overlayPosition,
                            maskImage: getOverlayMask(),
                            WebkitMaskImage: getOverlayMask(),
                            transition: "opacity 0.3s ease-out",
                        }}
                    />
                )}

                {!isStatic && overlayTintOpacity > 0 && (
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius,
                            backgroundColor: overlayTintColor,
                            opacity: isHovering ? overlayTintOpacity : 0,
                            mixBlendMode: "overlay",
                            pointerEvents: "none",
                            transition: "opacity 0.3s ease-out",
                        }}
                    />
                )}

                {!isStatic && (
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius,
                            background: glareGradient,
                            opacity: isHovering ? 1 : 0,
                            mixBlendMode: "overlay",
                            pointerEvents: "none",
                            transition: "opacity 0.3s ease-out",
                        }}
                    />
                )}

                {!isStatic && enableReflection && (
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius,
                            background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)`,
                            opacity: isHovering ? 1 : 0,
                            pointerEvents: "none",
                            transition: "opacity 0.3s ease-out",
                        }}
                    />
                )}

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius,
                        boxShadow: `inset 0 0 0 1px rgba(255,255,255,${isHovering ? 0.2 : 0.1})`,
                        pointerEvents: "none",
                        transition: "box-shadow 0.3s ease-out",
                    }}
                />
            </motion.div>
        </div>
    )
}

HologramImageEffect.displayName = "Hologram Image Effect"

addPropertyControls(HologramImageEffect, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    overlayImage: {
        type: ControlType.ResponsiveImage,
        title: "Overlay Image",
    },
    overlayBlendMode: {
        type: ControlType.Enum,
        title: "Overlay Blend",
        defaultValue: "color-dodge",
        options: [
            "color-dodge",
            "screen",
            "overlay",
            "soft-light",
            "hard-light",
            "lighten",
            "plus-lighter",
            "difference",
            "exclusion",
            "hue",
            "saturation",
            "color",
            "luminosity",
        ],
        optionTitles: [
            "Color Dodge",
            "Screen",
            "Overlay",
            "Soft Light",
            "Hard Light",
            "Lighten",
            "Plus Lighter",
            "Difference",
            "Exclusion",
            "Hue",
            "Saturation",
            "Color",
            "Luminosity",
        ],
    },
    overlayPattern: {
        type: ControlType.Enum,
        title: "Overlay Pattern",
        defaultValue: "conic",
        options: ["conic", "radial", "linear", "diamond", "none"],
        optionTitles: ["Conic", "Radial", "Linear", "Diamond", "None"],
        displaySegmentedControl: true,
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
    overlayScale: {
        type: ControlType.Number,
        title: "Overlay Scale",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
    },
    overlayAnimationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
    },
    overlayTintColor: {
        type: ControlType.Color,
        title: "Tint Color",
        defaultValue: "#ffffff",
    },
    overlayTintOpacity: {
        type: ControlType.Number,
        title: "Tint Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
    },
    tiltIntensity: {
        type: ControlType.Number,
        title: "Tilt Intensity",
        defaultValue: 10,
        min: 0,
        max: 30,
        step: 1,
    },
    springStiffness: {
        type: ControlType.Number,
        title: "Spring Stiffness",
        defaultValue: 150,
        min: 50,
        max: 300,
        step: 10,
    },
    springDamping: {
        type: ControlType.Number,
        title: "Spring Damping",
        defaultValue: 15,
        min: 5,
        max: 40,
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    glareIntensity: {
        type: ControlType.Number,
        title: "Glare Intensity",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow Intensity",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
    },
    enableReflection: {
        type: ControlType.Boolean,
        title: "Reflection",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})