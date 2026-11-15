// User request: replace responsiveBaseWidth with a user-controlled responsive scale reduction strength while preserving separated orientation/orbit behavior and existing features.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useInView } from "framer-motion"
import {
    useEffect,
    useRef,
    useMemo,
    useState,
    startTransition,
    type CSSProperties,
} from "react"

interface CardData {
    frontType: "image" | "color"
    backType: "image" | "color"
    frontImage: { src: string; alt?: string }
    backImage: { src: string; alt?: string }
    frontColor: string
    backColor: string
}

const DEFAULT_CARDS: CardData[] = Array.from({ length: 12 }, () => ({
    frontType: "image",
    backType: "color",
    frontImage: { src: "", alt: "" },
    backImage: { src: "", alt: "" },
    frontColor: "#F5F5F5",
    backColor: "#eeeeee",
}))

interface RotatingCarouselProps {
    cards: CardData[]
    cardWidth?: number
    cardHeight?: number
    autoResponsive?: boolean
    scaleReduction?: number
    perspective?: number
    overflowMode?: "visible" | "hidden"
    borderRadius?: number
    gap?: number
    rotationX?: number
    rotationY?: number
    rotationZ?: number
    autoRotate?: boolean
    rotationSpeed?: number
    rotationDirection?: "clockwise" | "counterclockwise"
    sizeLayout?: {
        cardWidth?: number
        cardHeight?: number
        gap?: number
        borderRadius?: number
        perspective?: number
        overflowMode?: "visible" | "hidden"
    }
    responsiveSettings?: {
        autoResponsive?: boolean
        scaleReduction?: number
    }
    rotationSettings?: {
        rotationX?: number
        rotationY?: number
        rotationZ?: number
        autoRotate?: boolean
        rotationSpeed?: number
        rotationDirection?: "clockwise" | "counterclockwise"
    }
    style?: CSSProperties
}

/**
 * 3D Rotating Card Carousel
 *
 * A fully customizable 3D carousel with rotating cards that display images on both sides.
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function RotatingCarousel(props: RotatingCarouselProps) {
    const {
        cards = DEFAULT_CARDS,
        cardWidth: legacyCardWidth = 96,
        cardHeight: legacyCardHeight = 80,
        autoResponsive: legacyAutoResponsive = true,
        scaleReduction: legacyScaleReduction = 1,
        perspective: legacyPerspective = 1200,
        overflowMode: legacyOverflowMode = "visible",
        borderRadius: legacyBorderRadius = 4,
        gap: legacyGap = 4,
        rotationX: legacyRotationX = -10,
        rotationY: legacyRotationY = 0,
        rotationZ: legacyRotationZ = 6,
        autoRotate: legacyAutoRotate = true,
        rotationSpeed: legacyRotationSpeed = 20,
        rotationDirection: legacyRotationDirection = "clockwise",
        sizeLayout,
        responsiveSettings,
        rotationSettings,
        style,
    } = props
    const cardWidth = sizeLayout?.cardWidth ?? legacyCardWidth
    const cardHeight = sizeLayout?.cardHeight ?? legacyCardHeight
    const gap = sizeLayout?.gap ?? legacyGap
    const borderRadius = sizeLayout?.borderRadius ?? legacyBorderRadius
    const perspective = sizeLayout?.perspective ?? legacyPerspective
    const overflowMode = sizeLayout?.overflowMode ?? legacyOverflowMode
    const autoResponsive =
        responsiveSettings?.autoResponsive ?? legacyAutoResponsive
    const scaleReduction =
        responsiveSettings?.scaleReduction ?? legacyScaleReduction
    const rotationX = rotationSettings?.rotationX ?? legacyRotationX
    const rotationY = rotationSettings?.rotationY ?? legacyRotationY
    const rotationZ = rotationSettings?.rotationZ ?? legacyRotationZ
    const autoRotate = rotationSettings?.autoRotate ?? legacyAutoRotate
    const rotationSpeed = rotationSettings?.rotationSpeed ?? legacyRotationSpeed
    const rotationDirection =
        rotationSettings?.rotationDirection ?? legacyRotationDirection

    const isStaticRenderer = useIsStaticRenderer()
    const rotation = useMotionValue(0)
    const sceneRef = useRef<HTMLDivElement | null>(null)
    const animationRef = useRef<number | null>(null)
    const isInView = useInView(sceneRef, { margin: "120px", amount: 0.1 })
    const [containerWidth, setContainerWidth] = useState(0)

    const safeCards = useMemo(() => {
        if (cards.length > 0) return cards
        return DEFAULT_CARDS
    }, [cards])

    const numCards = safeCards.length
    const minRadius = useMemo(() => {
        if (numCards <= 1) return cardWidth / 2 + gap
        return (cardWidth + gap) / (2 * Math.tan(Math.PI / numCards))
    }, [cardWidth, gap, numCards])
    const effectiveRadius = useMemo(() => Math.max(minRadius, 1), [minRadius])
    const naturalWidth = useMemo(
        () => effectiveRadius * 2 + cardWidth,
        [effectiveRadius, cardWidth]
    )
    const rawResponsiveScale = useMemo(() => {
        if (naturalWidth <= 0 || containerWidth <= 0) return 1
        return Math.min(1, containerWidth / naturalWidth)
    }, [containerWidth, naturalWidth])
    const responsiveScale = useMemo(() => {
        if (!autoResponsive) return 1
        const scaled = 1 - (1 - rawResponsiveScale) * scaleReduction
        return Math.max(0, scaled)
    }, [autoResponsive, rawResponsiveScale, scaleReduction])

    useEffect(() => {
        if (!autoResponsive) return

        if (typeof window === "undefined") {
            return
        }

        const element = sceneRef.current
        if (!element) return

        const updateWidth = () => {
            const nextWidth = element.clientWidth || 0
            startTransition(() => setContainerWidth(nextWidth))
        }

        updateWidth()

        if (typeof ResizeObserver === "undefined") {
            return
        }

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            const nextWidth = entry.contentRect.width || 0
            startTransition(() => setContainerWidth(nextWidth))
        })

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [autoResponsive])

    // Auto-rotation effect
    useEffect(() => {
        if (!autoRotate || isStaticRenderer || !isInView) return

        const direction = rotationDirection === "clockwise" ? 1 : -1

        let lastTime = performance.now()

        const updateRotation = () => {
            const currentTime = performance.now()
            const delta = (currentTime - lastTime) / 1000
            lastTime = currentTime

            const currentRotation = rotation.get()
            const newRotation =
                currentRotation + direction * rotationSpeed * delta
            rotation.set(newRotation)

            animationRef.current = requestAnimationFrame(updateRotation)
        }

        animationRef.current = requestAnimationFrame(updateRotation)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [
        autoRotate,
        rotationSpeed,
        rotationDirection,
        rotation,
        isStaticRenderer,
        isInView,
    ])

    return (
        <div
            ref={sceneRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: `${perspective}px`,
                overflow: overflowMode,
                position: "relative",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transform: `scale(${responsiveScale})`,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg) rotateZ(${rotationZ}deg)`,
                    }}
                >
                    <motion.div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            transformStyle: "preserve-3d",
                            rotateY: rotation,
                        }}
                    >
                        {safeCards.map((card, index) => {
                            const angle = (360 / numCards) * index

                            // Provide default images if not set
                            const frontImage = card.frontImage || {
                                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                                alt: `Card ${index + 1} front`,
                            }
                            const backImage = card.backImage || {
                                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                                alt: `Card ${index + 1} back`,
                            }
                            const frontType = card.frontType || "image"
                            const backType = card.backType || "image"
                            const frontColor = card.frontColor || "#F5F5F5"
                            const backColor = card.backColor || "#EEEEEE"

                            return (
                                <motion.div
                                    key={index}
                                    style={{
                                        position: "absolute",
                                        width: cardWidth,
                                        height: cardHeight,
                                        top: "50%",
                                        left: "50%",
                                        marginLeft: -cardWidth / 2,
                                        marginTop: -cardHeight / 2,
                                        transformStyle: "preserve-3d",
                                        transform: `rotateY(${angle}deg) translateZ(${effectiveRadius}px)`,
                                    }}
                                >
                                    {/* Front of card */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            width: "100%",
                                            height: "100%",
                                            backfaceVisibility: "hidden",
                                            borderRadius: borderRadius,
                                            overflow: "hidden",
                                            backgroundColor:
                                                frontType === "color"
                                                    ? frontColor
                                                    : "transparent",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {frontType === "image" && (
                                            <img
                                                src={frontImage.src}
                                                alt={
                                                    frontImage.alt ||
                                                    `Card ${index + 1} front`
                                                }
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Back of card */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            width: "100%",
                                            height: "100%",
                                            backfaceVisibility: "hidden",
                                            borderRadius: borderRadius,
                                            overflow: "hidden",
                                            backgroundColor:
                                                backType === "color"
                                                    ? backColor
                                                    : "transparent",
                                            transform: "rotateY(180deg)",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        {backType === "image" && (
                                            <img
                                                src={backImage.src}
                                                alt={
                                                    backImage.alt ||
                                                    `Card ${index + 1} back`
                                                }
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                }}
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(RotatingCarousel, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                frontType: {
                    type: ControlType.Enum,
                    title: "Front Type",
                    options: ["image", "color"],
                    optionTitles: ["Image", "Color"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                frontImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Front Image",
                    hidden: (item) => item.frontType === "color",
                },
                frontColor: {
                    type: ControlType.Color,
                    title: "Front Color",
                    defaultValue: "#F5F5F5",
                    hidden: (item) => item.frontType !== "color",
                },
                backType: {
                    type: ControlType.Enum,
                    title: "Back Type",
                    options: ["image", "color"],
                    optionTitles: ["Image", "Color"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                backImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Back Image",
                    hidden: (item) => item.backType === "color",
                },
                backColor: {
                    type: ControlType.Color,
                    title: "Back Color",
                    defaultValue: "#EEEEEE",
                    hidden: (item) => item.backType !== "color",
                },
            },
        },
        defaultValue: DEFAULT_CARDS,
        maxCount: 12,
    },
    sizeLayout: {
        type: ControlType.Object,
        title: "Size / Layout",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                defaultValue: 96,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Card Height",
                defaultValue: 80,
                step: 10,
                unit: "px",
                displayStepper: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap Between Cards",
                defaultValue: 4,
                step: 5,
                unit: "px",
                displayStepper: true,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                defaultValue: 4,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue: 1200,
                step: 50,
                unit: "px",
                displayStepper: true,
            },
            overflowMode: {
                type: ControlType.Enum,
                title: "Overflow",
                options: ["hidden", "visible"],
                optionTitles: ["Hidden", "Visible"],
                defaultValue: "visible",
                displaySegmentedControl: true,
            },
        },
        defaultValue: {
            cardWidth: 96,
            cardHeight: 80,
            gap: 4,
            borderRadius: 4,
            perspective: 1200,
            overflowMode: "visible",
        },
    },
    responsiveSettings: {
        type: ControlType.Object,
        title: "Responsive",
        controls: {
            autoResponsive: {
                type: ControlType.Boolean,
                title: "Auto Responsive",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            scaleReduction: {
                type: ControlType.Number,
                title: "Scale Reduction",
                defaultValue: 1,
                step: 0.1,
                displayStepper: true,
                hidden: (values) => !values.autoResponsive,
            },
        },
        defaultValue: {
            autoResponsive: true,
            scaleReduction: 1,
        },
    },
    rotationSettings: {
        type: ControlType.Object,
        title: "Rotation",
        controls: {
            rotationX: {
                type: ControlType.Number,
                title: "Rotation X",
                defaultValue: -10,
                min: -180,
                max: 180,
                step: 1,
                unit: "deg",
            },
            rotationY: {
                type: ControlType.Number,
                title: "Rotation Y",
                defaultValue: 0,
                min: -180,
                max: 180,
                step: 1,
                unit: "deg",
            },
            rotationZ: {
                type: ControlType.Number,
                title: "Rotation Z",
                defaultValue: 6,
                min: -180,
                max: 180,
                step: 1,
                unit: "deg",
            },
            autoRotate: {
                type: ControlType.Boolean,
                title: "Auto Rotate",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            rotationSpeed: {
                type: ControlType.Number,
                title: "Rotation Speed",
                defaultValue: 20,
                step: 1,
                displayStepper: true,
                hidden: (values) => !values.autoRotate,
            },
            rotationDirection: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["clockwise", "counterclockwise"],
                optionTitles: ["→", "←"],
                defaultValue: "clockwise",
                displaySegmentedControl: true,
                hidden: (values) => !values.autoRotate,
            },
        },
        defaultValue: {
            rotationX: -10,
            rotationY: 0,
            rotationZ: 6,
            autoRotate: true,
            rotationSpeed: 20,
            rotationDirection: "clockwise",
        },
    },
})
