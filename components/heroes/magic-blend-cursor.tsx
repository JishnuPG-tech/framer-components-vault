import * as React from "react"
import { startTransition, useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, useMotionValue, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MagicBlendCursorProps {
    presetTheme?:
        | "Original Invert"
        | "Monochrome"
        | "Neon Pink"
        | "Cyber Blue"
        | "Sunset"
        | "Forest"
        | "Ocean"
    opacity?: number
    hoverScale?: number
    damping?: number
    stiffness?: number
    mass?: number
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function MagicBlendCursor({
    presetTheme = "Original Invert",
    opacity = 1,
    hoverScale = 1.5,
    damping = 30,
    stiffness = 300,
    mass = 0.5,
    style,
}: MagicBlendCursorProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [cursorSize, setCursorSize] = useState({ w: 100, h: 100 })
    const cursorSizeRef = useRef({ w: 100, h: 100 })

    const mouseX = useMotionValue(-1000)
    const mouseY = useMotionValue(-1000)

    const springX = useSpring(mouseX, { damping, stiffness, mass })
    const springY = useSpring(mouseY, { damping, stiffness, mass })

    const [isHovered, setIsHovered] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    let cursorColor = "transparent"
    let backdropFilterStyle = "none"
    let mixBlendModeStyle = "normal"

    switch (presetTheme) {
        case "Monochrome":
            cursorColor = "rgba(255, 255, 255, 0.5)"
            backdropFilterStyle = "invert(100%) grayscale(100%) contrast(1.2)"
            break
        case "Sunset":
            cursorColor = "rgba(255, 107, 53, 0.7)"
            backdropFilterStyle = "invert(100%) grayscale(100%) contrast(1.2)"
            break
        case "Forest":
            cursorColor = "rgba(46, 204, 113, 0.6)"
            backdropFilterStyle = "invert(100%) grayscale(100%) contrast(1.2)"
            break
        case "Ocean":
            cursorColor = "rgba(52, 152, 219, 0.6)"
            backdropFilterStyle = "invert(100%) grayscale(100%) contrast(1.2)"
            break
        case "Neon Pink":
            cursorColor = "rgba(255, 0, 255, 0.6)"
            backdropFilterStyle = "invert(100%) grayscale(100%) contrast(1.2)"
            break
        case "Cyber Blue":
            cursorColor = "rgba(0, 229, 255, 0.6)"
            backdropFilterStyle = "invert(100%) grayscale(100%) contrast(1.2)"
            break
        case "Original Invert":
        default:
            cursorColor = "#FFFFFF"
            mixBlendModeStyle = "difference"
            backdropFilterStyle = "none"
            break
    }

    useEffect(() => {
        setIsMounted(true)

        if (!containerRef.current) return

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const w =
                    entry.contentRect.width || entry.target.clientWidth || 100
                const h =
                    entry.contentRect.height || entry.target.clientHeight || 100

                if (w > 0 && h > 0) {
                    cursorSizeRef.current = { w, h }
                    setCursorSize({ w, h })
                }
            }
        })

        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (isCanvas) return

        const updateMousePosition = (e: MouseEvent) => {
            mouseX.set(e.clientX - cursorSizeRef.current.w / 2)
            mouseY.set(e.clientY - cursorSizeRef.current.h / 2)
        }

        const checkHoverState = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target) return

            const isClickable =
                target.tagName === "A" ||
                target.tagName === "BUTTON" ||
                target.closest("a") !== null ||
                target.closest("button") !== null ||
                window.getComputedStyle(target).cursor === "pointer"

            startTransition(() => {
                setIsHovered(isClickable)
            })
        }

        window.addEventListener("mousemove", updateMousePosition)
        window.addEventListener("mouseover", checkHoverState)

        return () => {
            window.removeEventListener("mousemove", updateMousePosition)
            window.removeEventListener("mouseover", checkHoverState)
        }
    }, [isCanvas, mouseX, mouseY])

    if (isCanvas) {
        return (
            <div
                ref={containerRef}
                style={{
                    ...style,
                    backgroundColor:
                        presetTheme === "Original Invert"
                            ? "#000"
                            : "rgba(128, 128, 128, 0.2)",
                    opacity: opacity,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "2px dashed rgba(0,0,0,0.2)",
                    borderRadius: "50%",
                }}
            />
        )
    }

    const activeCursor = (
        <motion.div
            animate={{
                scale: isHovered ? hoverScale : 1,
            }}
            transition={{
                scale: { type: "spring", damping: 20, stiffness: 300 },
            }}
            style={{
                x: springX,
                y: springY,
                position: "fixed",
                top: 0,
                left: 0,
                width: cursorSize.w,
                height: cursorSize.h,
                borderRadius: "50%",
                backgroundColor: cursorColor,
                opacity: opacity,
                pointerEvents: "none",
                zIndex: 99999,
                willChange: "transform",
                mixBlendMode: mixBlendModeStyle as any,
                backdropFilter:
                    backdropFilterStyle !== "none"
                        ? backdropFilterStyle
                        : undefined,
                WebkitBackdropFilter:
                    backdropFilterStyle !== "none"
                        ? backdropFilterStyle
                        : undefined,
            }}
        />
    )

    return (
        <>
            <div
                ref={containerRef}
                style={{
                    ...style,
                    visibility: "hidden",
                    pointerEvents: "none",
                }}
            />
            {isMounted && !isCanvas
                ? createPortal(activeCursor, document.body)
                : null}
        </>
    )
}

MagicBlendCursor.displayName = "Magic Blend Cursor"

addPropertyControls(MagicBlendCursor, {
    presetTheme: {
        type: ControlType.Enum,
        title: "Theme",
        description: "Select the cursor's visual style.",
        options: [
            "Original Invert",
            "Monochrome",
            "Neon Pink",
            "Cyber Blue",
            "Sunset",
            "Forest",
            "Ocean",
        ],
        defaultValue: "Original Invert",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        description: "Base opacity level.",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.1,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        description: "Scale multiplier on hover.",
        defaultValue: 1.5,
        min: 1,
        max: 5,
        step: 0.1,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        description: "Spring animation damping.",
        defaultValue: 30,
        min: 0,
        max: 100,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        description: "Spring animation stiffness.",
        defaultValue: 300,
        min: 0,
        max: 1000,
    },
    mass: {
        type: ControlType.Number,
        title: "Mass",
        description: "Spring animation mass.",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
})
