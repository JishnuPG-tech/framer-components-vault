import { useEffect, useState } from "react"
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

/**
 * Shine Button
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ShineButton(props) {
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
        reduceMotion,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const systemReducedMotion = usePrefersReducedMotion()
    const [isHovering, setIsHovering] = useState(false)
    const [sweepKey, setSweepKey] = useState(0)
    const disabled = isStatic || reduceMotion || systemReducedMotion

    function handleEnter() {
        if (disabled) return
        setIsHovering(true)
        setSweepKey((k) => k + 1)
    }

    return (
        <motion.a
            href={link || "#"}
            onPointerEnter={handleEnter}
            onPointerLeave={disabled ? undefined : () => setIsHovering(false)}
            animate={{
                backgroundColor: isHovering
                    ? hoverBackgroundColor
                    : backgroundColor,
                borderColor: isHovering ? hoverBorderColor : borderColor,
            }}
            transition={{ duration: 0.3 / animationSpeed }}
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: `${padding}px ${padding * 2}px`,
                borderWidth: border,
                borderStyle: "solid",
                borderRadius,
                textDecoration: "none",
                whiteSpace: "nowrap",
                cursor: isStatic ? "default" : "pointer",
                userSelect: "none",
                overflow: "hidden",
                ...style,
            }}
        >
            <span
                style={{
                    position: "relative",
                    zIndex: 1,
                    color: isHovering ? hoverTextColor : textColor,
                    fontSize,
                    fontWeight: 600,
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    transition: "color 0.2s ease",
                }}
            >
                {text}
            </span>

            {!disabled && isHovering && (
                <motion.span
                    key={sweepKey}
                    initial={{ x: "-120%" }}
                    animate={{ x: "220%" }}
                    transition={{
                        duration: 0.8 / animationSpeed,
                        ease: "easeInOut",
                    }}
                    style={{
                        position: "absolute",
                        top: "-50%",
                        left: 0,
                        width: "40%",
                        height: "200%",
                        background:
                            "linear-gradient(100deg, transparent, rgba(255,255,255,0.8), transparent)",
                        mixBlendMode: "overlay",
                        transform: "rotate(15deg)",
                        pointerEvents: "none",
                    }}
                />
            )}
        </motion.a>
    )
}

ShineButton.defaultProps = {
    text: "View Project",
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
    reduceMotion: false,
}

addPropertyControls(ShineButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "View Project",
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
    reduceMotion: {
        type: ControlType.Boolean,
        title: "Reduce Motion",
        defaultValue: false,
    },
})
