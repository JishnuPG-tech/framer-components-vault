import * as React from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties } from "react"

const defaultImages = [
    { src: "https://picsum.photos/id/1018/1000/600" },
    { src: "https://picsum.photos/id/1015/1000/600" },
    { src: "https://picsum.photos/id/1019/1000/600" },
]

interface Props {
    images?: any[]
    stripeCount: number
    overflowVisible: boolean
    fallDistance: number
    animationDuration: number
    staggerDelay: number
    arrowColor: string
    arrowBackground: string
    arrowSize: number
    disableAnimation: boolean
    allowFastNav: boolean
    borderRadius: number
    borderWidth: number
    borderColor: string
    borderStyle: "solid" | "dashed" | "dotted"
    style?: CSSProperties
}

/**
 * Striped Reveal Carousel
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function StripedRevealCarousel(props: Props) {
    const {
        images = defaultImages,
        stripeCount = 15,
        overflowVisible = false,
        fallDistance = 100,
        animationDuration = 0.8,
        staggerDelay = 0.04,
        arrowColor = "#FFFFFF",
        arrowBackground = "rgba(0, 0, 0, 0.4)",
        arrowSize = 48,
        disableAnimation = false,
        allowFastNav = false,
        borderRadius = 0,
        borderWidth = 0,
        borderColor = "#000000",
        borderStyle = "solid",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const resolvedImages = images && images.length > 0 ? images : defaultImages

    const [targetIndex, setTargetIndex] = React.useState(0)
    const [prevIndex, setPrevIndex] = React.useState(0)
    const [direction, setDirection] = React.useState(1) // 1: right, -1: left

    const showStripeTransition =
        !isStatic && !disableAnimation && !isCanvas && targetIndex !== prevIndex
    const isAnimating = showStripeTransition

    // Failsafe to ensure animation completes and state is reset
    React.useEffect(() => {
        if (showStripeTransition) {
            const totalAnimationTime =
                (animationDuration + (stripeCount - 1) * staggerDelay) * 1000
            const timer = setTimeout(() => {
                setPrevIndex(targetIndex)
            }, totalAnimationTime + 50)
            return () => clearTimeout(timer)
        }
    }, [
        showStripeTransition,
        targetIndex,
        direction,
        stripeCount,
        animationDuration,
        staggerDelay,
    ])

    // Instantly sync if animations are disabled
    React.useEffect(() => {
        if (!showStripeTransition && prevIndex !== targetIndex) {
            setPrevIndex(targetIndex)
        }
    }, [showStripeTransition, targetIndex, prevIndex])

    const handleNext = () => {
        if ((!allowFastNav && isAnimating) || resolvedImages.length <= 1) return
        if (isAnimating) setPrevIndex(targetIndex)
        setDirection(1)
        setTargetIndex((prev) => (prev + 1) % resolvedImages.length)
    }

    const handlePrev = () => {
        if ((!allowFastNav && isAnimating) || resolvedImages.length <= 1) return
        if (isAnimating) setPrevIndex(targetIndex)
        setDirection(-1)
        setTargetIndex(
            (prev) => (prev - 1 + resolvedImages.length) % resolvedImages.length
        )
    }

    // Prepare arrays for rendering
    const safeTargetIndex = Math.min(
        Math.max(0, targetIndex),
        resolvedImages.length - 1
    )
    const safePrevIndex = Math.min(
        Math.max(0, prevIndex),
        resolvedImages.length - 1
    )
    const targetImage = resolvedImages[safeTargetIndex]
    const prevImage = resolvedImages[safePrevIndex]
    const targetImageSrc =
        typeof targetImage === "string" ? targetImage : targetImage?.src
    const prevImageSrc =
        typeof prevImage === "string" ? prevImage : prevImage?.src

    // Extract focal points if provided by the Framer UI
    const targetFocalPoint =
        targetImage?.positionX && targetImage?.positionY
            ? `${targetImage.positionX} ${targetImage.positionY}`
            : "center"
    const prevFocalPoint =
        prevImage?.positionX && prevImage?.positionY
            ? `${prevImage.positionX} ${prevImage.positionY}`
            : "center"

    const arrowStyle: React.CSSProperties = {
        background: arrowBackground,
        color: arrowColor,
        border: "none",
        width: arrowSize,
        height: arrowSize,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isAnimating && !allowFastNav ? "default" : "pointer",
        opacity: isAnimating && !allowFastNav ? 0.7 : 1,
        transition: "opacity 0.2s",
        pointerEvents: "auto",
        padding: 0,
    }

    const innerBorderRadius = Math.max(0, borderRadius - borderWidth)

    return (
        <div
            style={{
                ...style,
                position: "relative",
                overflow: overflowVisible ? "visible" : "hidden",
                width: "100%",
                height: "100%",
                backgroundColor: "transparent", // Prevents AA bleed on corners
                borderRadius: `${borderRadius}px`,
                borderWidth: `${borderWidth}px`,
                borderColor: borderColor,
                borderStyle: borderStyle,
                boxSizing: "border-box",
            }}
        >
            {/* Background: The incoming image */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: innerBorderRadius,
                    clipPath: `inset(0px round ${innerBorderRadius}px)`,
                    WebkitClipPath: `inset(0px round ${innerBorderRadius}px)`,
                    overflow: "hidden",
                    zIndex: 1,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url(${targetImageSrc})`,
                        backgroundSize: "cover",
                        backgroundPosition: targetFocalPoint,
                        backgroundRepeat: "no-repeat",
                    }}
                />
            </div>

            {/* Foreground: The outgoing image broken into stripes */}
            {showStripeTransition && (
                <div
                    key={`${prevIndex}-${targetIndex}`} // Force remount for new transition
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                >
                    {Array.from({ length: Math.max(1, stripeCount) }).map(
                        (_, i) => {
                            const delayIndex =
                                direction === 1
                                    ? stripeCount - 1 - i // right-to-left
                                    : i // left-to-right

                            // Clip-path insets to isolate this stripe's region
                            const clipLeft = (i / stripeCount) * 100
                            const clipRight =
                                ((stripeCount - i - 1) / stripeCount) * 100

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ y: "0%", opacity: 1 }}
                                    animate={{
                                        y: `${fallDistance}%`,
                                        opacity: 0,
                                    }}
                                    transition={{
                                        duration: animationDuration,
                                        delay: delayIndex * staggerDelay,
                                        ease: [0.32, 0.72, 0, 1],
                                    }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        // Clip to this stripe's horizontal slice — the image
                                        // inside is full-container-size so all stripes render
                                        // the image at identical dimensions (no rounding mismatches)
                                        clipPath: `inset(0 ${clipRight}% 0 ${clipLeft}%)`,
                                        WebkitClipPath: `inset(0 ${clipRight}% 0 ${clipLeft}%)`,
                                        willChange: "transform, opacity",
                                        backfaceVisibility: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            backgroundImage: `url(${prevImageSrc})`,
                                            backgroundSize: "cover",
                                            backgroundPosition: prevFocalPoint,
                                            backgroundRepeat: "no-repeat",
                                            borderRadius: `${innerBorderRadius}px`,
                                        }}
                                    />
                                </motion.div>
                            )
                        }
                    )}
                </div>
            )}

            {/* Controls Overlay */}
            {resolvedImages.length > 1 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 16px",
                    }}
                >
                    <motion.button
                        onClick={handlePrev}
                        style={arrowStyle}
                        aria-label="Previous image"
                        whileHover={
                            !(isAnimating && !allowFastNav)
                                ? { scale: 1.05 }
                                : {}
                        }
                        whileTap={
                            !(isAnimating && !allowFastNav)
                                ? { scale: 0.95 }
                                : {}
                        }
                    >
                        <svg
                            width={arrowSize * 0.5}
                            height={arrowSize * 0.5}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </motion.button>
                    <motion.button
                        onClick={handleNext}
                        style={arrowStyle}
                        aria-label="Next image"
                        whileHover={
                            !(isAnimating && !allowFastNav)
                                ? { scale: 1.05 }
                                : {}
                        }
                        whileTap={
                            !(isAnimating && !allowFastNav)
                                ? { scale: 0.95 }
                                : {}
                        }
                    >
                        <svg
                            width={arrowSize * 0.5}
                            height={arrowSize * 0.5}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </motion.button>
                </div>
            )}
        </div>
    )
}

addPropertyControls(StripedRevealCarousel, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
    },
    stripeCount: {
        type: ControlType.Number,
        title: "Stripes",
        min: 2,
        max: 20,
        defaultValue: 15,
        displayStepper: true,
    },
    overflowVisible: {
        type: ControlType.Boolean,
        title: "Overflow",
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
        defaultValue: false,
        description:
            "Allow falling stripes to be seen outside the image borders.",
    },
    fallDistance: {
        type: ControlType.Number,
        title: "Fall Distance",
        min: 10,
        max: 500,
        defaultValue: 100,
        unit: "%",
        displayStepper: true,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 3,
        step: 0.1,
        defaultValue: 0.8,
        unit: "s",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Gap",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.04,
        unit: "s",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#FFFFFF",
    },
    arrowBackground: {
        type: ControlType.Color,
        title: "Arrow BG",
        defaultValue: "rgba(0, 0, 0, 0.4)",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        min: 20,
        max: 100,
        defaultValue: 48,
        displayStepper: true,
        unit: "px",
    },
    disableAnimation: {
        type: ControlType.Boolean,
        title: "Disable Anim",
        defaultValue: false,
        description: "Disable the reveal animation entirely.",
    },
    allowFastNav: {
        type: ControlType.Boolean,
        title: "Fast Nav",
        defaultValue: false,
        description:
            "Allow clicking arrows rapidly while animation is running.",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        defaultValue: 0,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 20,
        defaultValue: 0,
        unit: "px",
        displayStepper: true,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#000000",
        hidden(props) {
            return props.borderWidth === 0
        },
    },
    borderStyle: {
        type: ControlType.Enum,
        title: "Border Style",
        options: ["solid", "dashed", "dotted"],
        optionTitles: ["Solid", "Dashed", "Dotted"],
        defaultValue: "solid",
        hidden(props) {
            return props.borderWidth === 0
        },
    },
})
