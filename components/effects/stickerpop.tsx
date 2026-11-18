import { useState, useRef, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

/**
 * StickerPop — Hover-reveal sticker component
 * Hover over the invisible hit area → sticker pops in with a bouncy animation.
 * Disappears after a set duration.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */

interface Props {
    image: { src: string; alt?: string }
    rotation: number
    scale: number
    duration: number
    borderWidth: number
    shadowBlur: number
    style?: React.CSSProperties
}

export default function StickerPop(props: Props) {
    const {
        image,
        rotation = -8,
        scale = 1,
        duration = 2000,
        borderWidth = 6,
        shadowBlur = 18,
        style,
    } = props

    const [visible, setVisible] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isStatic = useIsStaticRenderer()

    const handleEnter = useCallback(() => {
        if (timer.current) clearTimeout(timer.current)
        setVisible(true)
        timer.current = setTimeout(() => setVisible(false), duration)
    }, [duration])

    const baseSize = 160 * scale

    const stickerStyle: React.CSSProperties = {
        width: baseSize,
        height: baseSize,
        objectFit: "contain",
        pointerEvents: "none",
        userSelect: "none",
        // White border sticker effect via drop-shadow filter
        filter: [
            `drop-shadow(0px 0px 0px ${borderWidth * 0.5}px white)`,
            `drop-shadow(0px 0px ${borderWidth}px white)`,
            `drop-shadow(0px ${shadowBlur * 0.3}px ${shadowBlur}px rgba(0,0,0,0.28))`,
        ].join(" "),
    }

    // Static renderer: show sticker at reduced opacity as a preview
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                    ...style,
                }}
            >
                {image?.src && (
                    <img
                        src={image.src}
                        alt={image.alt || "sticker"}
                        style={{
                            ...stickerStyle,
                            transform: `rotate(${rotation}deg)`,
                            opacity: 0.4,
                        }}
                    />
                )}
            </div>
        )
    }

    return (
        <div
            onMouseEnter={handleEnter}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
                cursor: "default",
                ...style,
            }}
        >
            <AnimatePresence>
                {visible && image?.src && (
                    <motion.img
                        key="sticker"
                        src={image.src}
                        alt={image.alt || "sticker"}
                        initial={{
                            scale: 0.1,
                            opacity: 0,
                            rotate: rotation - 14,
                        }}
                        animate={{
                            scale: [0.1, 1.22, 0.92, 1],
                            opacity: 1,
                            rotate: rotation,
                            transition: {
                                duration: 0.42,
                                ease: "easeOut",
                            },
                        }}
                        exit={{
                            scale: 0.4,
                            opacity: 0,
                            rotate: rotation + 10,
                            transition: {
                                duration: 0.28,
                                ease: "easeIn",
                            },
                        }}
                        style={{
                            ...stickerStyle,
                            position: "absolute",
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(StickerPop, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Sticker",
        description: "Use a PNG with a transparent background for best results",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: -8,
        min: -45,
        max: 45,
        step: 1,
        unit: "°",
        description: "Tilt angle of the sticker",
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
        description: "Size multiplier (base size is 160px)",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 2000,
        min: 500,
        max: 8000,
        step: 100,
        unit: "ms",
        description: "How long the sticker stays visible after hover",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        defaultValue: 6,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
        description: "White sticker border thickness",
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 2,
        unit: "px",
        description: "Drop shadow intensity beneath the sticker",
    },
})
