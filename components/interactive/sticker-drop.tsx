import { useState, useEffect, useCallback, useRef } from "react"
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

interface Sticker {
    id: number
    x: number
    y: number
    rotation: number
    timestamp: number
    imageIndex: number
}

interface StickerEffectProps {
    images: { src: string; alt: string }[]
    size: number
    duration: number
    maxStickers: number
    style?: React.CSSProperties
}

/**
 * Interactive Sticker Effect
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function StickerEffect(props: StickerEffectProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Gradient 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Gradient 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Gradient 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Gradient 4",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Gradient 5",
            },
        ],
        size = 80,
        duration = 3000,
        maxStickers = 20,
    } = props

    const [stickers, setStickers] = useState<Sticker[]>([])
    const containerRef = useRef<HTMLDivElement>(null)
    const nextIdRef = useRef(0)
    const isStatic = useIsStaticRenderer()

    const handleClick = useCallback(
        (e: MouseEvent) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const rotation = Math.random() * 30 - 15
            const id = nextIdRef.current++
            const timestamp = Date.now()
            const imageIndex = Math.floor(Math.random() * images.length)

            setStickers((prev) => {
                const newStickers = [
                    ...prev,
                    { id, x, y, rotation, timestamp, imageIndex },
                ]

                // Limit the number of stickers to prevent memory issues
                if (newStickers.length > maxStickers) {
                    return newStickers.slice(newStickers.length - maxStickers)
                }

                return newStickers
            })
        },
        [maxStickers, images.length]
    )

    // Clean up expired stickers
    useEffect(() => {
        if (isStatic) return

        const interval = setInterval(() => {
            const now = Date.now()
            setStickers((prev) =>
                prev.filter((sticker) => now - sticker.timestamp < duration)
            )
        }, 1000)

        return () => clearInterval(interval)
    }, [duration, isStatic])

    // Add click listener
    useEffect(() => {
        if (isStatic) return

        document.addEventListener("click", handleClick)

        return () => {
            document.removeEventListener("click", handleClick)
        }
    }, [handleClick, isStatic])

    // Show a static preview when in static renderer
    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    ...props.style,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: size,
                        height: size,
                        opacity: 0.7,
                    }}
                >
                    <img
                        src={images[0]?.src}
                        alt={images[0]?.alt || "Sticker image"}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                    />
                </div>
                <div
                    style={{
                        position: "absolute",
                        top: "30%",
                        left: "30%",
                        transform: "translate(-50%, -50%) rotate(-10deg)",
                        width: size * 0.8,
                        height: size * 0.8,
                        opacity: 0.5,
                    }}
                >
                    <img
                        src={images[1]?.src || images[0]?.src}
                        alt={
                            images[1]?.alt || images[0]?.alt || "Sticker image"
                        }
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                    />
                </div>
                <div
                    style={{
                        position: "absolute",
                        top: "70%",
                        left: "70%",
                        transform: "translate(-50%, -50%) rotate(15deg)",
                        width: size * 0.9,
                        height: size * 0.9,
                        opacity: 0.6,
                    }}
                >
                    <img
                        src={images[2]?.src || images[0]?.src}
                        alt={
                            images[2]?.alt || images[0]?.alt || "Sticker image"
                        }
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                        }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: "none",
                ...props.style,
            }}
        >
            <AnimatePresence>
                {stickers.map((sticker) => (
                    <motion.div
                        key={sticker.id}
                        initial={{ scale: 0, rotate: 0 }}
                        animate={{
                            scale: 1,
                            rotate: sticker.rotation,
                            transition: {
                                type: "spring",
                                stiffness: 500,
                                damping: 15,
                            },
                        }}
                        exit={{
                            scale: 0,
                            opacity: 0,
                            transition: {
                                duration: 0.3,
                            },
                        }}
                        style={{
                            position: "absolute",
                            left: sticker.x,
                            top: sticker.y,
                            width: size,
                            height: size,
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                            zIndex: 9999,
                        }}
                    >
                        <img
                            src={
                                images[sticker.imageIndex]?.src ||
                                images[0]?.src
                            }
                            alt={
                                images[sticker.imageIndex]?.alt ||
                                "Sticker image"
                            }
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                            }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(StickerEffect, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        maxCount: 10,
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 80,
        min: 20,
        max: 200,
        step: 1,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 3000,
        min: 500,
        max: 10000,
        step: 100,
        unit: "ms",
    },
    maxStickers: {
        type: ControlType.Number,
        title: "Max Stickers",
        defaultValue: 20,
        min: 5,
        max: 100,
        step: 1,
    },
})
