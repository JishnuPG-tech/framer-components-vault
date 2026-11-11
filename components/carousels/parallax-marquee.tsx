// Continuous marquee component with 3D image cards, depth, and parallax effect for natural movement

import { useEffect, useRef, useState, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimationFrame } from "framer-motion"

interface ImageCard {
    image: { src: string; alt: string }
    depth: number
    verticalOffset: number
}

interface ImageMarqueeProps {
    cards: ImageCard[]
    speed: number
    cardWidth: number
    cardHeight: number
    gap: number
    perspective: number
    maxRotation: number
    backgroundColor: string
    shadow: string
    borderRadius: number
    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ParallaxMarquee(props: ImageMarqueeProps) {
    const {
        cards = [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 1",
                },
                depth: 0,
                verticalOffset: -50,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 2",
                },
                depth: 100,
                verticalOffset: 80,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 3",
                },
                depth: 50,
                verticalOffset: -20,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Image 4",
                },
                depth: -50,
                verticalOffset: 120,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Image 5",
                },
                depth: 80,
                verticalOffset: 200,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 6",
                },
                depth: -30,
                verticalOffset: 50,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 7",
                },
                depth: 120,
                verticalOffset: -80,
            },
        ],
        speed = 1,
        cardWidth = 200,
        cardHeight = 250,
        gap = 100,
        perspective = 1200,
        maxRotation = 15,
        backgroundColor = "#E8E6E1",
        shadow = "0 1px 2px rgba(0, 0, 0, 0.15)",
        borderRadius = 8,
    } = props

    const isStatic = useIsStaticRenderer()
    const [offset, setOffset] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    // Normalize cards to ensure image property always exists
    const normalizedCards = useMemo(() => {
        return cards.map(card => ({
            ...card,
            image: card.image || {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Default Image"
            }
        }))
    }, [cards])

    // Calculate total width needed for seamless loop
    const totalWidth = useMemo(() => {
        return normalizedCards.length * (cardWidth + gap)
    }, [normalizedCards.length, cardWidth, gap])

    // Animate the marquee
    useAnimationFrame((time, delta) => {
        if (isStatic) return

        startTransition(() => {
            setOffset((prev) => {
                const newOffset = prev + speed * (delta / 16)
                return newOffset >= totalWidth ? newOffset - totalWidth : newOffset
            })
        })
    })

    // Duplicate cards for seamless loop
    const duplicatedCards = useMemo(() => {
        return [...normalizedCards, ...normalizedCards, ...normalizedCards]
    }, [normalizedCards])

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {normalizedCards.slice(0, 3).map((card, index) => (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            width: cardWidth,
                            height: cardHeight,
                            left: `${20 + index * 30}%`,
                            top: `${30 + card.verticalOffset / 5}%`,
                            transform: `scale(${1 + card.depth / 200})`,
                            boxShadow: shadow,
                            borderRadius: borderRadius,
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={card.image.src}
                            alt={card.image.alt}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                overflow: "hidden",
                position: "relative",
                perspective: `${perspective}px`,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                {duplicatedCards.map((card, index) => {
                    const xPosition = index * (cardWidth + gap) - offset
                    const depthScale = 1 + card.depth / 300
                    const parallaxOffset = (card.depth / 100) * (offset * 0.3)
                    const rotationY = ((xPosition / totalWidth) * maxRotation * 2 - maxRotation) * (card.depth / 100)

                    return (
                        <motion.div
                            key={index}
                            style={{
                                position: "absolute",
                                width: cardWidth,
                                height: cardHeight,
                                left: xPosition - parallaxOffset,
                                top: `calc(50% + ${card.verticalOffset}px)`,
                                transform: `translateY(-50%) scale(${depthScale}) rotateY(${rotationY}deg)`,
                                transformStyle: "preserve-3d",
                                boxShadow: shadow,
                                borderRadius: borderRadius,
                                overflow: "hidden",
                                willChange: "transform",
                            }}
                        >
                            <img
                                src={card.image.src}
                                alt={card.image.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(ParallaxMarquee, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                depth: {
                    type: ControlType.Number,
                    title: "Depth",
                    defaultValue: 0,
                    min: -100,
                    max: 150,
                    step: 10,
                    unit: "px",
                },
                verticalOffset: {
                    type: ControlType.Number,
                    title: "Vertical Offset",
                    defaultValue: 0,
                    min: -200,
                    max: 200,
                    step: 10,
                    unit: "px",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 1",
                },
                depth: 0,
                verticalOffset: -50,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 2",
                },
                depth: 100,
                verticalOffset: 80,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 3",
                },
                depth: 50,
                verticalOffset: -20,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Image 4",
                },
                depth: -50,
                verticalOffset: 120,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Image 5",
                },
                depth: 80,
                verticalOffset: 200,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 6",
                },
                depth: -30,
                verticalOffset: 50,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 7",
                },
                depth: 120,
                verticalOffset: -80,
            },
        ],
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 200,
        min: 100,
        max: 400,
        step: 10,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 250,
        min: 100,
        max: 500,
        step: 10,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 100,
        min: 20,
        max: 300,
        step: 10,
        unit: "px",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1200,
        min: 500,
        max: 2000,
        step: 100,
        unit: "px",
    },
    maxRotation: {
        type: ControlType.Number,
        title: "Max Rotation",
        description: "Controls the maximum Y-axis rotation angle of cards based on their depth and position",
        defaultValue: 15,
        min: 0,
        max: 45,
        step: 5,
        unit: "deg",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#E8E6E1",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 1px 2px rgba(0, 0, 0, 0.15)",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
})