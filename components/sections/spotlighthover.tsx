import { useRef, useCallback, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring } from "framer-motion"

/**
 * SpotlightHover — A soft light that follows the cursor across any section
 * Drop it anywhere for instant atmosphere. Zero configuration needed to look good.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

interface SpotlightHoverProps {
    color: string
    size: number
    intensity: number
    blendMode: "normal" | "screen" | "overlay" | "soft-light" | "color-dodge"
    followSpeed: number
    fadeOnLeave: boolean
    visibleByDefault: boolean
    style?: React.CSSProperties
}

export default function SpotlightHover(props: SpotlightHoverProps) {
    const {
        color = "#ffffff",
        size = 400,
        intensity = 0.15,
        blendMode = "screen",
        followSpeed = 0.15,
        fadeOnLeave = true,
        visibleByDefault = false,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [isHovering, setIsHovering] = useState(false)
    const isStatic = useIsStaticRenderer()

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = {
        damping: (1 / Math.max(followSpeed, 0.01)) * 3,
        stiffness: 150,
    }
    const springX = useSpring(mouseX, springConfig)
    const springY = useSpring(mouseY, springConfig)

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            mouseX.set(e.clientX - rect.left)
            mouseY.set(e.clientY - rect.top)
        },
        [mouseX, mouseY]
    )

    const handleMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            setIsHovering(true)
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            mouseX.set(e.clientX - rect.left)
            mouseY.set(e.clientY - rect.top)
        },
        [mouseX, mouseY]
    )

    const handleMouseLeave = useCallback(() => {
        if (fadeOnLeave) setIsHovering(false)
    }, [fadeOnLeave])

    const showSpotlight = visibleByDefault || isHovering || !fadeOnLeave

    if (isStatic) {
        return (
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `radial-gradient(circle ${size}px at 50% 40%, ${color}${Math.round(
                        intensity * 255
                    )
                        .toString(16)
                        .padStart(2, "0")} 0%, transparent 70%)`,
                    mixBlendMode: blendMode as any,
                    ...style,
                }}
            />
        )
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: visibleByDefault ? "none" : "auto",
                overflow: "hidden",
                ...style,
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    left: springX,
                    top: springY,
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                    mixBlendMode: blendMode as any,
                    pointerEvents: "none",
                    opacity: showSpotlight ? intensity : 0,
                    transition: "opacity 0.4s ease",
                }}
            />
        </div>
    )
}

addPropertyControls(SpotlightHover, {
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#ffffff",
        description: "Light color — white works best on dark backgrounds",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 400,
        min: 100,
        max: 1000,
        step: 20,
        unit: "px",
        description: "Diameter of the spotlight",
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 0.15,
        min: 0.02,
        max: 0.6,
        step: 0.01,
        description: "0.1–0.2 is the sweet spot for a subtle effect",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        options: ["normal", "screen", "overlay", "soft-light", "color-dodge"],
        optionTitles: [
            "Normal",
            "Screen",
            "Overlay",
            "Soft Light",
            "Color Dodge",
        ],
        defaultValue: "screen",
        description: "'Screen' works best on dark backgrounds",
    },
    followSpeed: {
        type: ControlType.Number,
        title: "Follow Speed",
        defaultValue: 0.15,
        min: 0.02,
        max: 1,
        step: 0.01,
        description: "Lower = smoother trailing, higher = snappier",
    },
    fadeOnLeave: {
        type: ControlType.Boolean,
        title: "Fade On Leave",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Spotlight fades out when cursor leaves the section",
    },
    visibleByDefault: {
        type: ControlType.Boolean,
        title: "Always Visible",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Shows a static centered spotlight even without hover (good for static previews)",
    },
})
