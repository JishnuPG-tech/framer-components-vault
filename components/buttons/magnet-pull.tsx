import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

function usePrefersReducedMotion() {
    const [prefers, setPrefers] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setPrefers(mq.matches)
        function handler(e) {
            setPrefers(e.matches)
        }
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])
    return prefers
}

const FIELD_PADDING = 50

/**
 * Magnetic Button
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MagneticButton(props) {
    const {
        text,
        link,
        backgroundColor,
        textColor,
        hoverBackgroundColor,
        hoverTextColor,
        border,
        borderColor,
        hoverBorderColor,
        borderRadius,
        padding,
        fontSize,
        animationSpeed,
        magnetStrength,
        reduceMotion,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const systemReducedMotion = usePrefersReducedMotion()
    const fieldRef = useRef(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)

    const disabled = isStatic || reduceMotion || systemReducedMotion

    function handleMove(e) {
        if (disabled) return
        const rect = fieldRef.current.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = e.clientX - cx
        const dy = e.clientY - cy
        setOffset({
            x: Math.max(-magnetStrength, Math.min(magnetStrength, dx * 0.35)),
            y: Math.max(-magnetStrength, Math.min(magnetStrength, dy * 0.35)),
        })
    }

    function handleLeave() {
        setOffset({ x: 0, y: 0 })
        setIsHovering(false)
    }

    return (
        <div
            ref={fieldRef}
            onPointerMove={disabled ? undefined : handleMove}
            onPointerEnter={disabled ? undefined : () => setIsHovering(true)}
            onPointerLeave={disabled ? undefined : handleLeave}
            style={{
                display: "inline-flex",
                padding: FIELD_PADDING,
                margin: -FIELD_PADDING,
                ...style,
            }}
        >
            <motion.a
                href={link || "#"}
                animate={{
                    x: offset.x,
                    y: offset.y,
                    backgroundColor: isHovering
                        ? hoverBackgroundColor
                        : backgroundColor,
                    color: isHovering ? hoverTextColor : textColor,
                    borderColor: isHovering ? hoverBorderColor : borderColor,
                }}
                transition={{
                    x: {
                        type: "spring",
                        stiffness: 220 * animationSpeed,
                        damping: 18,
                    },
                    y: {
                        type: "spring",
                        stiffness: 220 * animationSpeed,
                        damping: 18,
                    },
                    backgroundColor: { duration: 0.3 / animationSpeed },
                    color: { duration: 0.3 / animationSpeed },
                    borderColor: { duration: 0.3 / animationSpeed },
                }}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: `${padding}px ${padding * 2}px`,
                    borderWidth: border,
                    borderStyle: "solid",
                    borderRadius,
                    fontSize,
                    fontWeight: 600,
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    cursor: isStatic ? "default" : "pointer",
                    userSelect: "none",
                }}
            >
                {text}
            </motion.a>
        </div>
    )
}

MagneticButton.defaultProps = {
    text: "Get Started",
    link: "",
    backgroundColor: "#FFF4E8",
    textColor: "#2A1A12",
    hoverBackgroundColor: "#FF6B4A",
    hoverTextColor: "#FFFFFF",
    border: 2,
    borderColor: "#2A1A12",
    hoverBorderColor: "#FFFFFF",
    borderRadius: 100,
    padding: 14,
    fontSize: 15,
    animationSpeed: 1,
    magnetStrength: 12,
    reduceMotion: false,
}

addPropertyControls(MagneticButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Get Started",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFF4E8",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#2A1A12",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover Background",
        defaultValue: "#FF6B4A",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#FFFFFF",
    },
    border: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 2,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#2A1A12",
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Hover Border Color",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 100,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 6,
        max: 32,
        step: 1,
        defaultValue: 14,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 10,
        max: 28,
        step: 1,
        defaultValue: 15,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        min: 0.3,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    magnetStrength: {
        type: ControlType.Number,
        title: "Magnet Strength",
        min: 0,
        max: 30,
        step: 1,
        defaultValue: 12,
    },
    reduceMotion: {
        type: ControlType.Boolean,
        title: "Reduce Motion",
        defaultValue: false,
    },
})
