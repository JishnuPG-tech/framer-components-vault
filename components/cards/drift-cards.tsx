// Premium floating image-card carousel with continuous infinite loop animation
// Display 5-7 portrait cards with large rounded corners (40-60px radius)
// Center card is active: largest scale (1.0), fully visible, upright, positioned slightly higher
// Side cards are smaller (0.75-0.9 scale), rotated between -25° and +25°, partially overlapping
// Animate cards continuously from right to left in infinite loop
// Spring-based motion with smooth easing, subtle depth through shadows and z-index
// Timing: 8-12 seconds per full cycle, seamless infinite loop
//
// User requests (latest):
// - Add viewport-visibility logic so the animation only runs while the component is in view.
// - Pause/stop animation when off-screen, resume smoothly when back in view.
// - Clean up IntersectionObserver on unmount.
// - Keep existing styling/layout/props/property controls and the useIsStaticRenderer static-rendering check.

import { useEffect, useMemo, useRef, useState, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate, motion, useInView, useMotionValue, useTransform } from "framer-motion"

type ResponsiveImage = { src: string; alt?: string }

interface CarouselProps {
    image1: ResponsiveImage
    image2: ResponsiveImage
    image3: ResponsiveImage
    image4: ResponsiveImage
    image5: ResponsiveImage
    image6: ResponsiveImage
    image7: ResponsiveImage
    cardCount: number
    cycleDuration: number
    borderRadius: number
    backgroundImage: ResponsiveImage
    backgroundOpacity: number
    backgroundBlur: number
    style?: CSSProperties
}

/**
 * Premium Floating Card Carousel
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 */
export default function DriftCards(props: CarouselProps) {
    const {
        image1 = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Card 1",
        },
        image2 = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Card 2",
        },
        image3 = {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Card 3",
        },
        image4 = {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Card 4",
        },
        image5 = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Card 5",
        },
        image6 = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Card 6",
        },
        image7 = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Card 7",
        },
        cardCount = 5,
        cycleDuration = 10,
        borderRadius = 50,
        backgroundImage = {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Background",
        },
        backgroundOpacity = 15,
        backgroundBlur = 8,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)

    // This hook uses IntersectionObserver internally and cleans up on unmount.
    // It will also stop observing when the element disappears.
    const isInView = useInView(containerRef, { amount: 0.15 })

    const images = useMemo(() => {
        const all = [image1, image2, image3, image4, image5, image6, image7]
        return all.slice(0, Math.max(5, Math.min(7, cardCount)))
    }, [image1, image2, image3, image4, image5, image6, image7, cardCount])

    const progress = useMotionValue(0)

    const [containerSize, setContainerSize] = useState({ width: 900, height: 600 })

    // Start/resume animation only while in view (and not in static renderer).
    useEffect(() => {
        if (isStatic) {
            progress.set(0)
            return
        }

        if (!isInView) return

        const from = progress.get()
        // Keep moving forward so it resumes smoothly from its last state.
        const controls = animate(progress, from + cardCount, {
            duration: cycleDuration,
            repeat: Infinity,
            ease: "linear",
        })

        return () => {
            controls.stop()
        }
    }, [isInView, isStatic, cardCount, cycleDuration, progress])

    // Measure container size for responsive calculations
    useEffect(() => {
        if (typeof window === "undefined") return

        const updateSize = () => {
            const width = style?.width === "100%" ? window.innerWidth : 900
            const height = style?.height === "100%" ? window.innerHeight : 600
            startTransition(() => {
                setContainerSize({ width: Number(width), height: Number(height) })
            })
        }

        updateSize()
        window.addEventListener("resize", updateSize)
        return () => window.removeEventListener("resize", updateSize)
    }, [style])

    const isMobile = containerSize.width < 600
    const isTablet = containerSize.width >= 600 && containerSize.width < 900
    const isPortrait = containerSize.height > containerSize.width

    const cardWidth = isMobile ? Math.min(180, containerSize.width * 0.5) : isTablet ? 200 : 240
    const cardHeight = isMobile ? Math.min(260, containerSize.height * 0.55) : isTablet ? 280 : 340

    const cardSpacing = isMobile ? 120 : isTablet ? 160 : 200

    const responsiveBorderRadius = isMobile ? Math.min(borderRadius * 0.7, 35) : borderRadius

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#ffffff",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 0,
                    opacity: backgroundOpacity / 100,
                    filter: `blur(${backgroundBlur}px)`,
                    pointerEvents: "none",
                }}
            >
                <img
                    src={backgroundImage.src}
                    alt={backgroundImage.alt || "Background"}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </div>

            {images.map((image, index) => (
                <Card
                    key={index}
                    image={image}
                    index={index}
                    totalCards={images.length}
                    progress={progress}
                    borderRadius={responsiveBorderRadius}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                    cardSpacing={cardSpacing}
                    isMobile={isMobile}
                    isPortrait={isPortrait}
                />
            ))}
        </div>
    )
}

interface CardProps {
    image: ResponsiveImage
    index: number
    totalCards: number
    progress: any
    borderRadius: number
    cardWidth: number
    cardHeight: number
    cardSpacing: number
    isMobile: boolean
    isPortrait: boolean
}

function Card({
    image,
    index,
    totalCards,
    progress,
    borderRadius,
    cardWidth,
    cardHeight,
    cardSpacing,
    isMobile,
    isPortrait,
}: CardProps) {
    const position = useTransform(progress, (p: number) => {
        const offset = (p + index) % totalCards
        return offset
    })

    const center = totalCards / 2

    const distanceFromCenter = useTransform(position, (pos: number) => pos - center)

    const x = useTransform(distanceFromCenter, (dist: number) => dist * cardSpacing)

    const y = useTransform(distanceFromCenter, (dist: number) => {
        const curveIntensity = isMobile ? 20 : 35
        const curve = Math.abs(dist) * curveIntensity
        const offset = isMobile ? -10 : -20
        return curve + offset
    })

    const scale = useTransform(distanceFromCenter, (dist: number) => {
        const absDist = Math.abs(dist)
        if (isMobile) {
            if (absDist < 0.5) return 1.0
            if (absDist < 1.5) return 0.85
            return 0.75
        }
        if (absDist < 0.5) return 1.0
        if (absDist < 1.5) return 0.9
        if (absDist < 2.5) return 0.8
        return 0.75
    })

    const rotate = useTransform(distanceFromCenter, (dist: number) => {
        if (Math.abs(dist) < 0.5) return 0
        const maxRotation = isMobile || isPortrait ? 15 : 25
        const normalizedDist = Math.max(-2, Math.min(2, dist))
        return (normalizedDist / 2) * maxRotation
    })

    const opacity = useTransform(distanceFromCenter, (dist: number) => {
        const absDist = Math.abs(dist)
        if (absDist < 0.5) return 1.0
        if (absDist < 1.5) return 0.95
        if (absDist < 2.5) return 0.85
        return 0.7
    })

    const zIndex = useTransform(distanceFromCenter, (dist: number) => Math.round(100 - Math.abs(dist) * 15))

    const shadowIntensity = useTransform(distanceFromCenter, (dist: number) => {
        const absDist = Math.abs(dist)
        const multiplier = isMobile ? 0.7 : 1.0
        if (absDist < 0.5) return 0.3 * multiplier
        if (absDist < 1.5) return 0.2 * multiplier
        if (absDist < 2.5) return 0.12 * multiplier
        return 0.08 * multiplier
    })

    const boxShadow = useTransform(shadowIntensity, (intensity: number) => {
        const blur = isMobile ? 50 : 70
        const spread = isMobile ? 20 : 25
        return `0 ${spread * intensity}px ${blur * intensity}px rgba(0, 0, 0, ${intensity})`
    })

    const floatY = useTransform(progress, (p: number) => {
        const phase = (p + index * 0.4) * Math.PI * 0.4
        const floatAmount = isMobile ? 6 : 10
        return Math.sin(phase) * floatAmount
    })

    const combinedY = useTransform([y, floatY], ([yVal, floatVal]: [number, number]) => yVal + floatVal)

    return (
        <motion.div
            style={
                {
                    position: "absolute",
                    width: cardWidth,
                    height: cardHeight,
                    borderRadius,
                    overflow: "hidden",
                    x,
                    y: combinedY,
                    scale,
                    rotate,
                    opacity,
                    zIndex,
                    boxShadow,
                    willChange: "transform",
                } as any
            }
        >
            <img
                src={image.src}
                alt={image.alt || `Card ${index + 1}`}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                }}
            />
        </motion.div>
    )
}

addPropertyControls(DriftCards, {
    cardCount: {
        type: ControlType.Number,
        title: "Card Count",
        defaultValue: 5,
        min: 5,
        max: 7,
        step: 1,
        displayStepper: true,
    },
    cycleDuration: {
        type: ControlType.Number,
        title: "Cycle Duration",
        defaultValue: 10,
        min: 8,
        max: 12,
        step: 0.5,
        unit: "s",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 50,
        min: 40,
        max: 60,
        step: 5,
        unit: "px",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Background Image",
    },
    backgroundOpacity: {
        type: ControlType.Number,
        title: "Background Opacity",
        defaultValue: 15,
        min: 5,
        max: 30,
        step: 1,
        unit: "%",
    },
    backgroundBlur: {
        type: ControlType.Number,
        title: "Background Blur",
        defaultValue: 8,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    image1: { type: ControlType.ResponsiveImage, title: "Image 1" },
    image2: { type: ControlType.ResponsiveImage, title: "Image 2" },
    image3: { type: ControlType.ResponsiveImage, title: "Image 3" },
    image4: { type: ControlType.ResponsiveImage, title: "Image 4" },
    image5: { type: ControlType.ResponsiveImage, title: "Image 5" },
    image6: {
        type: ControlType.ResponsiveImage,
        title: "Image 6",
        hidden: ({ cardCount }) => (cardCount ?? 5) < 6,
    },
    image7: {
        type: ControlType.ResponsiveImage,
        title: "Image 7",
        hidden: ({ cardCount }) => (cardCount ?? 5) < 7,
    },
})

DriftCards.displayName = "Drift Cards"
