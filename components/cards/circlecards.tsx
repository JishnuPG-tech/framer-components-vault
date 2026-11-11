// @framerDisableUnlink
// @framerSupportedLayoutWidth: any
// @framerSupportedLayoutHeight: auto
// @framerIntrinsicWidth: 640
// @framerIntrinsicHeight: 520

/**
 * CircleCards — Framer Marketplace Component
 *
 * A circular arrangement of image/video cards that respond to pointer movement
 * with 3D transforms and optional auto-rotation effects.
 *
 * @version 1.0.0
 * @origin https://github.com/framer/plugins (adapted from community contributions)
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useMotionTemplate,
    useMotionValue,
    useSpring,
    useTransform,
    useReducedMotion,
    useInView,
    type MotionValue,
} from "framer-motion"
import {
    startTransition,
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent,
    type KeyboardEvent,
} from "react"

function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
    return t * t * (3 - 2 * t)
}

interface ResponsiveImage {
    src: string
    alt?: string
    srcSet?: string
}

interface MediaItem {
    src: string
    alt?: string
    srcSet?: string
    type?: "image" | "video"
}
const DEFAULT_MEDIA = [
    {
        mediaType: "image" as const,
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
    },
    {
        mediaType: "image" as const,
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gradient 2 - Purple",
        },
    },
    {
        mediaType: "image" as const,
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Gradient 3 - Orange",
        },
    },
    {
        mediaType: "image" as const,
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Gradient 4 - Yellow",
        },
    },
    {
        mediaType: "image" as const,
        image: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gradient 5 - Green",
        },
    },
    {
        mediaType: "image" as const,
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
    },
    {
        mediaType: "image" as const,
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gradient 2 - Purple",
        },
    },
    {
        mediaType: "image" as const,
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Gradient 3 - Orange",
        },
    },
]

const INTRINSIC_WIDTH = 640
const INTRINSIC_HEIGHT = 520

// Spring physics constants
const SPRING_STD = { stiffness: 32, damping: 24 }
const SPRING_FAST = { stiffness: 280, damping: 52 }

const LAYOUT_DEFAULTS: LayoutProps = {
    minHeight: 520,
    ringScale: 0.36,
    cardScale: 0.11,
    borderRadius: 6,
    ringScaleMobile: 0.85,
    cardScaleMobile: 0.85,
    minHeightMobile: 0.75,
    ringScaleTablet: 0.92,
    cardScaleTablet: 0.92,
    minHeightTablet: 0.88,
    ringOffsetY: 0,
}

const MOTION_DEFAULTS: MotionProps = {
    groupTilt: 1,
    cardFlip: 1,
    stiffness: 48,
    damping: 24,
    showcaseOnClick: false,
    fluidMotion: true,
    fluidIntensity: 0.7,
    showcaseDuration: 1,
}

const ROTATION_DEFAULTS: RotationProps = {
    autoRoll: false,
    rotationType: "clockwise",
    autoRollSpeed: 0.5,
    autoRollRingScale: 1,
}

const VISUAL_DEFAULTS: VisualProps = {
    grainOpacity: 0.045,
    vignetteStrength: 0.11,
    glareIntensity: 0.7,
    chromaticFringe: false,
}

const APPEARANCE_DEFAULTS: AppearanceProps = {
    backgroundColor: "#ffffff",
}

const ACCESSIBILITY_DEFAULTS: AccessibilityProps = {
    ariaLabel: "Circular image cards that respond to pointer movement.",
    cardAriaLabelPrefix: "Card",
}

interface MediaItemControl {
    mediaType: "image" | "video"
    image?: ResponsiveImage
    video?: string
}

interface LayoutProps {
    minHeight: number
    ringScale: number
    cardScale: number
    borderRadius: number
    ringScaleMobile: number
    cardScaleMobile: number
    minHeightMobile: number
    ringScaleTablet: number
    cardScaleTablet: number
    minHeightTablet: number
    ringOffsetY: number
}

interface MotionProps {
    groupTilt: number
    cardFlip: number
    stiffness: number
    damping: number
    showcaseOnClick: boolean
    fluidMotion: boolean
    fluidIntensity: number
    showcaseDuration: number
}

interface RotationProps {
    autoRoll: boolean
    rotationType: "clockwise" | "counterclockwise" | "oscillate"
    autoRollSpeed: number
    autoRollRingScale?: number
}

interface VisualProps {
    grainOpacity?: number
    vignetteStrength?: number
    glareIntensity: number
    chromaticFringe: boolean
}

interface AppearanceProps {
    backgroundColor?: string
}

interface AccessibilityProps {
    ariaLabel: string
    cardAriaLabelPrefix: string
}

interface CircleCardsProps {
    style?: CSSProperties
    media: MediaItemControl[]
    cardCount: number
    layout: LayoutProps
    motion: MotionProps
    rotation: RotationProps
    visual: VisualProps
    appearance: AppearanceProps
    accessibility: AccessibilityProps
}

function CircleCard(props: {
    index: number
    cardCount: number
    imageSrc: string
    mediaType: "image" | "video"
    altText?: string
    width: number
    height: number
    ringScale: number
    cardScale: number
    springNx: MotionValue<number>
    springNy: MotionValue<number>
    effectiveNx: MotionValue<number>
    effectiveNy: MotionValue<number>
    motion: MotionProps
    glareIntensity: number
    inactive: boolean
    rotationOffset: number
    borderRadius: number
    chromaticFringe: boolean
    isFocused: boolean
    cardAriaLabelPrefix: string
    onCardClick?: (index: number) => void
    isShowcased: boolean
    maxStrengthRef: React.MutableRefObject<number>
    onCardEnter?: () => void
    onCardLeave?: () => void
}): JSX.Element {
    const {
        index,
        cardCount,
        imageSrc,
        mediaType,
        altText,
        width,
        height,
        ringScale,
        cardScale,
        springNx,
        springNy,
        effectiveNx,
        effectiveNy,
        motion: motionProps,
        glareIntensity,
        inactive,
        rotationOffset,
        borderRadius,
        chromaticFringe,
        isFocused,
        cardAriaLabelPrefix,
        onCardClick,
        isShowcased,
        maxStrengthRef,
        onCardEnter,
        onCardLeave,
    } = props

    const angle = (index / cardCount) * Math.PI * 2 + rotationOffset
    const minSide = Math.max(1, Math.min(width, height))
    const cardW = minSide * cardScale * (3 / 3.5)
    const cardH = minSide * cardScale
    
    // Calculate base ring radius
    let ringR = Math.max(1, Math.min(width, height)) * ringScale * 0.5
    
    // Clamp ringR to ensure cards stay inside container with padding
    const maxRingRFromHeight = (height - cardH) * 0.45
    const maxRingRFromWidth = (width - cardW) * 0.45
    ringR = Math.min(ringR, maxRingRFromHeight, maxRingRFromWidth)
    
    const edgePx = minSide * 0.35

    const strength = useTransform([effectiveNx, effectiveNy], (latest) => {
        if (inactive || width <= 0 || height <= 0) return 0

        if (isFocused) return 0.85

        if (isShowcased) return 1

        const nx = typeof latest[0] === "number" ? latest[0] : 0
        const ny = typeof latest[1] === "number" ? latest[1] : 0
        const px = ((nx + 1) / 2) * width
        const py = ((ny + 1) / 2) * height
        const cx = width * 0.5 + Math.sin(angle) * ringR
        const cy = height * 0.5 - Math.cos(angle) * ringR
        const d = Math.hypot(px - cx, py - cy)
        const clamped = Math.min(Math.max(d, 0), edgePx * 2)
        const s = smoothstep(0, edgePx * 1.05, clamped)
        const finalStrength = 1 - Math.pow(s, 1)

        // Update shared max strength ref
        if (finalStrength > maxStrengthRef.current) {
            maxStrengthRef.current = finalStrength
        }

        return finalStrength
    })

    const rotateYDeg = useTransform(strength, (s) =>
        isShowcased ? 0 : s * 45 * motionProps.cardFlip
    )

    const baseTx = Math.sin(angle) * ringR
    const baseTy = -Math.cos(angle) * ringR

    const extraLift = useTransform(strength, (s) => {
        if (inactive || isShowcased) return 0
        if (s > 0.65) {
            const liftAmount = (s - 0.65) / 0.35
            return liftAmount * 15
        }
        return 0
    })

    // Fluid motion: add subtle scale pulsing based on strength
    const fluidScale = useTransform(strength, (s) => {
        if (inactive || isShowcased) return 1
        if (!motionProps.fluidMotion) return 1

        // Subtle scale increase when card is in proximity
        if (s > 0.3) {
            const scaleAmount = (s - 0.3) / 0.7
            return 1 + scaleAmount * 0.05 * (motionProps.fluidIntensity || 0.7)
        }
        return 1
    })

    const boxShadow = useTransform(strength, (s) => {
        const baseShadow =
            s > 0.65 || isShowcased
                ? "0 12px 24px rgba(18, 16, 14, 0.12), 0 4px 8px rgba(18, 16, 14, 0.08)"
                : "0 6px 14px rgba(18, 16, 14, 0.08), 0 1px 4px rgba(18, 16, 14, 0.06)"

        if (
            chromaticFringe &&
            !inactive &&
            glareIntensity > 0.5 &&
            !isShowcased
        ) {
            const velocityFactor = Math.min(s * 0.5, 1)
            const rgbOffset = velocityFactor * 1.5

            if (rgbOffset > 0.1) {
                const rgbShadow = `
                    inset ${rgbOffset}px 0 0 rgba(255, 0, 0, 0.15),
                    inset ${-rgbOffset}px 0 0 rgba(0, 255, 255, 0.15),
                    inset 0 ${rgbOffset}px 0 rgba(0, 255, 0, 0.1),
                    inset 0 ${-rgbOffset}px 0 rgba(255, 0, 255, 0.1)
                `
                return `${baseShadow}, ${rgbShadow}`
            }
        }

        return baseShadow
    })

    const zIndex = useTransform(strength, (s) => {
        if (isShowcased) return 10000

        // Calculate z-index based on angular position
        // Cards at the bottom (angle near 0 or 2π) should be on top
        // Cards at the top (angle near π) should be at the bottom
        const normalizedAngle =
            ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

        // Map angle to z-index: 0° (bottom) = highest, 180° (top) = lowest
        // Use cosine to get smooth transition: cos(0) = 1, cos(π) = -1
        const angleZ = Math.floor((1 - Math.cos(normalizedAngle)) * 500)

        const proximityBoost = Math.floor(s * 100)
        const combined = angleZ + proximityBoost
        return Math.min(combined, 10000)
    })

    const zDeg = (-angle * 180) / Math.PI

    const cover: CSSProperties =
        imageSrc.length > 0
            ? {
                  backgroundImage: `url(${imageSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
              }
            : {
                  background:
                      "linear-gradient(145deg, #ece8e2 0%, #cfc7bc 48%, #a89f95 100%)",
              }

    const isVideo = mediaType === "video"
    const hasValidVideoSrc = isVideo && imageSrc.length > 0

    const cardAriaLabel = altText
        ? `${cardAriaLabelPrefix} ${index + 1} of ${cardCount}: ${altText}`
        : `${cardAriaLabelPrefix} ${index + 1} of ${cardCount}`

    const canShowcase = motionProps.showcaseOnClick && !inactive

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            if (onCardClick) {
                e.preventDefault()
                e.stopPropagation()
                onCardClick(index)
            }
        },
        [onCardClick, index]
    )

    const cardContent = (
        <motion.div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: cardW,
                height: cardH,
                transformStyle: "preserve-3d",
                borderRadius,
                overflow: "hidden",
                boxShadow,
                pointerEvents: "auto",
                outline: isFocused ? "3px solid #0099FF" : "none",
                outlineOffset: isFocused ? "4px" : "0px",
                translateX: "-50%",
                translateY: "-50%",
                zIndex,
                scale: fluidScale,
                minHeight: 44,
            }}
            initial={{
                x: baseTx,
                y: baseTy,
                rotateZ: zDeg,
                scale: 1,
                z: 0,
            }}
            animate={
                isShowcased
                    ? {
                          x: 0,
                          y: 0,
                          rotateZ: 0,
                          scale: 1.8,
                          z: 100,
                      }
                    : {
                          x: baseTx,
                          y: baseTy,
                          rotateZ: zDeg,
                          scale: 1,
                          z: 0,
                      }
            }
            transition={{
                duration: motionProps.fluidMotion ? 1.2 : 0.8,
                ease: motionProps.fluidMotion
                    ? [0.16, 1, 0.3, 1]
                    : [0.25, 0.1, 0.25, 1],
            }}
            role="img"
            aria-label={cardAriaLabel}
            onPointerEnter={onCardEnter}
            onPointerLeave={onCardLeave}
        >
            {altText && (
                <span
                    style={{
                        position: "absolute",
                        width: "1px",
                        height: "1px",
                        padding: 0,
                        margin: "-1px",
                        overflow: "hidden",
                        clip: "rect(0, 0, 0, 0)",
                        whiteSpace: "nowrap",
                        border: 0,
                    }}
                >
                    {altText}
                </span>
            )}
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                    rotateY: rotateYDeg,
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        translateZ: extraLift,
                    }}
                    transition={{
                        duration: motionProps.fluidMotion ? 0.6 : 0.4,
                        ease: motionProps.fluidMotion
                            ? [0.16, 1, 0.3, 1]
                            : [0.25, 0.1, 0.25, 1],
                    }}
                >
                    {hasValidVideoSrc ? (
                        inactive ? (
                            <video
                                src={imageSrc}
                                muted
                                playsInline
                                preload="metadata"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <video
                                src={imageSrc}
                                autoPlay
                                loop
                                muted
                                playsInline
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        )
                    ) : (
                        <div
                            style={{ position: "absolute", inset: 0, ...cover }}
                        />
                    )}
                </motion.div>
            </motion.div>
        </motion.div>
    )

    if (canShowcase) {
        return (
            <button
                type="button"
                onClick={handleClick}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: cardW,
                    height: cardH,
                    minHeight: 44,
                    transform: "translate(-50%, -50%)",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    pointerEvents: "auto",
                }}
                aria-label={`Showcase ${cardAriaLabel}`}
            >
                {cardContent}
            </button>
        )
    }

    return cardContent
}

export default function CircleCards(
    props: Partial<CircleCardsProps>
): JSX.Element {
    const isCanvas = useIsOnFramerCanvas()
    const prefersReduced = useReducedMotion() ?? false
    const inactive = isCanvas || prefersReduced

    const {
        style,
        media = DEFAULT_MEDIA,
        cardCount = 8,
        layout = LAYOUT_DEFAULTS,
        motion: motionProps = MOTION_DEFAULTS,
        rotation = ROTATION_DEFAULTS,
        visual = VISUAL_DEFAULTS,
        appearance = APPEARANCE_DEFAULTS,
        accessibility = ACCESSIBILITY_DEFAULTS,
    } = props

    const {
        minHeight = LAYOUT_DEFAULTS.minHeight,
        ringScale = LAYOUT_DEFAULTS.ringScale,
        cardScale = LAYOUT_DEFAULTS.cardScale,
        borderRadius = LAYOUT_DEFAULTS.borderRadius,
        ringScaleMobile = LAYOUT_DEFAULTS.ringScaleMobile,
        cardScaleMobile = LAYOUT_DEFAULTS.cardScaleMobile,
        minHeightMobile = LAYOUT_DEFAULTS.minHeightMobile,
        ringScaleTablet = LAYOUT_DEFAULTS.ringScaleTablet,
        cardScaleTablet = LAYOUT_DEFAULTS.cardScaleTablet,
        minHeightTablet = LAYOUT_DEFAULTS.minHeightTablet,
        ringOffsetY = LAYOUT_DEFAULTS.ringOffsetY,
    } = layout || {}
    const {
        autoRoll = ROTATION_DEFAULTS.autoRoll,
        rotationType = ROTATION_DEFAULTS.rotationType,
        autoRollSpeed = ROTATION_DEFAULTS.autoRollSpeed,
        autoRollRingScale = ROTATION_DEFAULTS.autoRollRingScale,
    } = rotation || {}
    const { 
        grainOpacity = VISUAL_DEFAULTS.grainOpacity, 
        vignetteStrength = VISUAL_DEFAULTS.vignetteStrength, 
        glareIntensity = VISUAL_DEFAULTS.glareIntensity, 
        chromaticFringe = VISUAL_DEFAULTS.chromaticFringe 
    } = visual || {}
    const { backgroundColor = APPEARANCE_DEFAULTS.backgroundColor } = appearance || {}
    const { 
        ariaLabel = ACCESSIBILITY_DEFAULTS.ariaLabel, 
        cardAriaLabelPrefix = ACCESSIBILITY_DEFAULTS.cardAriaLabelPrefix 
    } = accessibility || {}

    const safeMotionProps = {
        groupTilt: motionProps?.groupTilt ?? MOTION_DEFAULTS.groupTilt,
        cardFlip: motionProps?.cardFlip ?? MOTION_DEFAULTS.cardFlip,
        stiffness: motionProps?.stiffness ?? MOTION_DEFAULTS.stiffness,
        damping: motionProps?.damping ?? MOTION_DEFAULTS.damping,
        showcaseOnClick: motionProps?.showcaseOnClick ?? MOTION_DEFAULTS.showcaseOnClick,
        fluidMotion: motionProps?.fluidMotion ?? MOTION_DEFAULTS.fluidMotion,
        fluidIntensity: motionProps?.fluidIntensity ?? MOTION_DEFAULTS.fluidIntensity,
        showcaseDuration: motionProps?.showcaseDuration ?? MOTION_DEFAULTS.showcaseDuration,
    }

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, amount: 0.2 })
    const [size, setSize] = useState({ width: INTRINSIC_WIDTH, height: INTRINSIC_HEIGHT })
    const isEditorPreview = isCanvas
    const showFinalState = isCanvas || prefersReduced || isEditorPreview
    const shouldAnimate = !showFinalState && isInView
    const [rotationOffset, setRotationOffset] = useState(0)
    const oscillateDirectionRef = useRef(1)
    const [isInteracting, setIsInteracting] = useState(false)
    const resumeTimeoutRef = useRef<number | null>(null)
    const [focusIndex, setFocusIndex] = useState<number | null>(null)
    const [showcasedIndex, setShowcasedIndex] = useState<number | null>(null)
    const [isStageAtRest, setIsStageAtRest] = useState(false)
    const maxStrengthRef = useRef(0)
    const [isCardHovered, setIsCardHovered] = useState(false)
    const hoverCountRef = useRef(0)
    const [canAutoRoll, setCanAutoRoll] = useState(true)
    const restTimerRef = useRef<number | null>(null)
    const showcaseTimeoutRef = useRef<number | null>(null)
    const showcasedIndexRef = useRef<number | null>(null)

    // Keep showcasedIndexRef in sync with showcasedIndex state
    useLayoutEffect(() => {
        showcasedIndexRef.current = showcasedIndex
    }, [showcasedIndex])

    // Calculate safeCount early so it can be used in callbacks
    const safeCount = Math.min(48, Math.max(6, Math.round(cardCount)))

    // Calculate list before handleCardClick to avoid reference error
    const list = useMemo(() => {
        const mediaSource = media.length > 0 ? media : DEFAULT_MEDIA

        return Array.from({ length: safeCount }, (_, i) => {
            const item = mediaSource[i % mediaSource.length]
            const isImage = item.mediaType === "image"

            return {
                src: isImage ? item.image?.src || "" : item.video || "",
                alt: isImage ? item.image?.alt : undefined,
                type: item.mediaType,
            }
        })
    }, [media, safeCount])

    // Calculate responsive values based on container width
    const responsiveMinHeight = useMemo(() => {
        if (size.width >= 810) {
            // Desktop: use base value
            return minHeight
        } else if (size.width >= 480) {
            // Tablet: apply tablet multiplier
            return minHeight * minHeightTablet
        } else {
            // Mobile: apply mobile multiplier
            return minHeight * minHeightMobile
        }
    }, [size.width, minHeight, minHeightTablet, minHeightMobile])

    const responsiveRingScale = useMemo(() => {
        if (size.width >= 810) {
            // Desktop: use base value
            return ringScale
        } else if (size.width >= 480) {
            // Tablet: apply tablet multiplier
            return ringScale * ringScaleTablet
        } else {
            // Mobile: apply mobile multiplier
            return ringScale * ringScaleMobile
        }
    }, [size.width, ringScale, ringScaleTablet, ringScaleMobile])

    const responsiveCardScale = useMemo(() => {
        if (size.width >= 810) {
            // Desktop: use base value
            return cardScale
        } else if (size.width >= 480) {
            // Tablet: apply tablet multiplier
            return cardScale * cardScaleTablet
        } else {
            // Mobile: apply mobile multiplier
            return cardScale * cardScaleMobile
        }
    }, [size.width, cardScale, cardScaleTablet, cardScaleMobile])

    // Width-aware scaling: reduce ring and card scale on narrow containers
    const effectiveRingScale = useMemo(() => {
        let scale = responsiveRingScale

        // Apply auto-roll scale multiplier if auto-roll is active
        if (autoRoll && !inactive) {
            scale = scale * autoRollRingScale
        }

        const minSide = Math.min(size.width, size.height)
        if (minSide <= 0) return scale

        // Calculate card dimensions for clamping
        const cardW = minSide * responsiveCardScale * (3 / 3.5)
        const cardH = minSide * responsiveCardScale
        
        // Calculate base ring radius
        let ringR = minSide * scale * 0.5
        
        // Clamp ringR to ensure cards stay inside container with padding
        const maxRingRFromHeight = (size.height - cardH) * 0.45
        const maxRingRFromWidth = (size.width - cardW) * 0.45
        const clampedRingR = Math.min(ringR, maxRingRFromHeight, maxRingRFromWidth)
        
        // Convert clamped ringR back to scale
        scale = (clampedRingR * 2) / minSide

        // Calculate max ring scale to ensure cards don't push outside container
        // ringR = minSide * scale * 0.5
        // cardW = minSide * cardScale * (3 / 3.5)
        // We need: ringR + (cardW / 2) <= minSide / 2
        // So: minSide * scale * 0.5 + minSide * responsiveCardScale * (3 / 3.5) * 0.5 <= minSide / 2
        // Simplify: scale * 0.5 + responsiveCardScale * (3 / 3.5) * 0.5 <= 0.5
        // scale <= 1 - responsiveCardScale * (3 / 3.5)
        const maxRingScale = Math.max(0.15, 1 - responsiveCardScale * (3 / 3.5))
        scale = Math.min(scale, maxRingScale)

        // Additional safety clamp for very narrow containers (< 320px)
        if (size.width < 320) {
            scale = scale * 0.75
        }

        // Auto-scale for wide short frames: when aspect ratio > 1.4, shrink the ring
        const aspectRatio = size.width / size.height
        if (aspectRatio > 1.4) {
            const autoScaleFactor = Math.max(0.65, Math.min(1, (size.height / size.width) * 1.2))
            scale = scale * autoScaleFactor
        }

        return scale
    }, [
        size.width,
        size.height,
        responsiveRingScale,
        responsiveCardScale,
        autoRoll,
        inactive,
        autoRollRingScale,
    ])

    const effectiveCardScale = useMemo(() => {
        let scale = responsiveCardScale

        const minSide = Math.min(size.width, size.height)
        if (minSide <= 0) return scale

        // Clamp card scale to ensure cards never exceed 42% of container min side
        // Card width = minSide * scale * (3 / 3.5)
        // We want: cardWidth <= minSide * 0.42
        // So: minSide * scale * (3 / 3.5) <= minSide * 0.42
        // scale <= 0.42 / (3 / 3.5) = 0.42 * (3.5 / 3) = 0.49
        const maxCardScale = 0.49
        scale = Math.min(scale, maxCardScale)

        // Additional safety clamp for very narrow containers (< 320px)
        if (size.width < 320) {
            scale = scale * 0.75
        }

        return scale
    }, [size.width, size.height, responsiveCardScale])

    const handleCardClick = useCallback(
        (index: number) => {
            if (!safeMotionProps.showcaseOnClick || inactive) return

            // Clear any pending showcase timeout
            if (showcaseTimeoutRef.current !== null) {
                clearTimeout(showcaseTimeoutRef.current)
                showcaseTimeoutRef.current = null
            }

            startTransition(() => {
                setShowcasedIndex((prev) => {
                    // If clicking the currently showcased card, close it
                    if (prev === index) {
                        if (autoRoll) {
                            setCanAutoRoll(true)
                        }
                        return null
                    }
                    // If a card is already showcased and clicking a different card, just close it
                    if (prev !== null) {
                        if (autoRoll) {
                            setCanAutoRoll(true)
                        }
                        return null
                    }
                    // Otherwise, showcase the clicked card
                    return index
                })
                setIsInteracting(true)
            })

            // Clear any pending resume timeout
            if (resumeTimeoutRef.current !== null) {
                clearTimeout(resumeTimeoutRef.current)
                resumeTimeoutRef.current = null
            }
        },
        [safeMotionProps.showcaseOnClick, inactive, autoRoll]
    )

    const handleCardEnter = useCallback(() => {
        if (inactive) return

        // Clear any pending showcase timeout when re-hovering
        if (showcaseTimeoutRef.current !== null) {
            clearTimeout(showcaseTimeoutRef.current)
            showcaseTimeoutRef.current = null
        }

        hoverCountRef.current += 1

        startTransition(() => {
            setIsCardHovered(true)
            setCanAutoRoll(false)
        })
    }, [inactive])

    const handleCardLeave = useCallback(() => {
        if (inactive) return

        hoverCountRef.current = Math.max(0, hoverCountRef.current - 1)

        if (hoverCountRef.current === 0) {
            startTransition(() => {
                setIsCardHovered(false)
            })

            // If a card is showcased, wait showcaseDuration seconds before un-showcasing it
            if (showcasedIndex !== null) {
                showcaseTimeoutRef.current = window.setTimeout(() => {
                    startTransition(() => {
                        setShowcasedIndex(null)
                    })
                    showcaseTimeoutRef.current = null
                }, safeMotionProps.showcaseDuration * 1000)
            }
        }
    }, [inactive, showcasedIndex, safeMotionProps.showcaseDuration])

    const mx = useMotionValue(0)
    const my = useMotionValue(0)

    const springConfig = useMemo(
        () => ({
            stiffness: inactive
                ? SPRING_FAST.stiffness
                : (safeMotionProps.stiffness / MOTION_DEFAULTS.stiffness) * SPRING_STD.stiffness,
            damping: inactive
                ? SPRING_FAST.damping
                : (safeMotionProps.damping / MOTION_DEFAULTS.damping) * SPRING_STD.damping,
        }),
        [inactive, safeMotionProps.damping, safeMotionProps.stiffness]
    )

    const springNx = useSpring(mx, springConfig)
    const springNy = useSpring(my, springConfig)

    // Fluid motion: add secondary spring with different physics for organic feel
    const fluidConfig = useMemo(
        () => ({
            stiffness: inactive
                ? 280
                : 20 * (safeMotionProps.fluidIntensity || 0.7),
            damping: inactive ? 52 : 15 * (safeMotionProps.fluidIntensity || 0.7),
        }),
        [inactive, safeMotionProps.fluidIntensity]
    )

    const fluidNx = useSpring(springNx, fluidConfig)
    const fluidNy = useSpring(springNy, fluidConfig)

    // Use fluid motion values if enabled, otherwise use direct spring values
    const effectiveNx = safeMotionProps.fluidMotion ? fluidNx : springNx
    const effectiveNy = safeMotionProps.fluidMotion ? fluidNy : springNy

    const perspectiveOrigin = useMotionTemplate`${useTransform(effectiveNx, (nx) => inactive || isCanvas ? 50 : nx * 10 + 50)}% ${useTransform(effectiveNy, (ny) => inactive || isCanvas ? 50 : ny * 15 + 50)}%`

    const handlePointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (inactive || isCanvas) return

            const el = containerRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
            const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
            mx.set(Math.max(-1, Math.min(1, nx)))
            my.set(Math.max(-1, Math.min(1, ny)))
        },
        [inactive, isCanvas, mx, my]
    )

    const handlePointerLeave = useCallback(() => {
        if (inactive || isCanvas) return

        mx.set(0)
        my.set(0)
    }, [inactive, isCanvas, mx, my])

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            if (inactive) return

            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault()

                startTransition(() => {
                    setFocusIndex((prev) => {
                        const current = prev ?? 0
                        if (event.key === "ArrowLeft") {
                            return (current - 1 + safeCount) % safeCount
                        } else {
                            return (current + 1) % safeCount
                        }
                    })
                })
            }
        },
        [inactive, safeCount]
    )

    // ResizeObserver to track container size
    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect
                if (width > 0 && height > 0) {
                    startTransition(() => {
                        setSize({ width, height })
                    })
                }
            }
        })

        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // Monitor rest state after card hover ends
    useLayoutEffect(() => {
        if (inactive) {
            return
        }

        // If card is hovered or showcased, don't allow auto-roll
        if (isCardHovered || showcasedIndex !== null) {
            if (restTimerRef.current !== null) {
                clearTimeout(restTimerRef.current)
                restTimerRef.current = null
            }
            if (canAutoRoll) {
                startTransition(() => {
                    setCanAutoRoll(false)
                })
            }
            return
        }

        // Card hover ended and no showcase, wait a bit then allow auto-roll
        restTimerRef.current = window.setTimeout(() => {
            startTransition(() => {
                setCanAutoRoll(true)
            })
        }, 300)

        return () => {
            if (restTimerRef.current !== null) {
                clearTimeout(restTimerRef.current)
                restTimerRef.current = null
            }
            if (showcaseTimeoutRef.current !== null) {
                clearTimeout(showcaseTimeoutRef.current)
                showcaseTimeoutRef.current = null
            }
        }
    }, [inactive, isCardHovered, showcasedIndex, canAutoRoll])

    // Auto-rotation animation loop
    useLayoutEffect(() => {
        // Early return: don't run if auto-roll is disabled, inactive, can't auto-roll, or on canvas
        if (!autoRoll || inactive || !canAutoRoll || isCanvas) {
            return
        }

        let animationFrameId: number | null = null
        let lastTime = performance.now()

        const animate = (currentTime: number) => {
            const deltaTime = (currentTime - lastTime) / 1000 // Convert to seconds
            lastTime = currentTime

            startTransition(() => {
                setRotationOffset((prev) => {
                    if (rotationType === "clockwise") {
                        return prev + autoRollSpeed * deltaTime
                    } else if (rotationType === "counterclockwise") {
                        return prev - autoRollSpeed * deltaTime
                    } else {
                        // Oscillate mode
                        const newOffset =
                            prev +
                            oscillateDirectionRef.current *
                                autoRollSpeed *
                                deltaTime

                        // Check if we've reached the bounds (-π to π)
                        if (newOffset > Math.PI) {
                            oscillateDirectionRef.current = -1
                            return Math.PI
                        } else if (newOffset < -Math.PI) {
                            oscillateDirectionRef.current = 1
                            return -Math.PI
                        }

                        return newOffset
                    }
                })
            })

            animationFrameId = requestAnimationFrame(animate)
        }

        animationFrameId = requestAnimationFrame(animate)

        return () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [autoRoll, inactive, autoRollSpeed, rotationType, canAutoRoll, isCanvas])

    const w = size.width > 0 ? size.width : INTRINSIC_WIDTH
    const h = size.height > 0 ? size.height : INTRINSIC_HEIGHT

    return (
        <motion.div
            ref={containerRef}
            role="region"
            aria-label={ariaLabel}
            tabIndex={0}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onKeyDown={handleKeyDown}
            whileInView={inactive ? undefined : "visible"}
            viewport={{ once: true, amount: 0.25 }}
            style={{
                width: "100%",
                height: "100%",
                minHeight: Math.max(responsiveMinHeight, INTRINSIC_HEIGHT),
                position: "relative",
                overflow: "visible",
                backgroundColor,
                perspective: Math.max(600, responsiveMinHeight * 1.1),
                perspectiveOrigin: inactive || isCanvas ? "50% 50%" : perspectiveOrigin,
                touchAction: "none",
                ...style,
            }}
        >
            {/* Radial vignette overlay */}
            {vignetteStrength !== undefined && vignetteStrength > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: `radial-gradient(ellipse at center, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, ${vignetteStrength}) 100%)`,
                        zIndex: 1,
                    }}
                />
            )}

            {/* Film grain overlay */}
            {grainOpacity !== undefined && grainOpacity > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        opacity: grainOpacity,
                        backgroundImage: `repeating-linear-gradient(
                            0deg,
                            rgba(0, 0, 0, 0.03) 0px,
                            transparent 1px,
                            transparent 2px,
                            rgba(0, 0, 0, 0.03) 3px
                        ),
                        repeating-linear-gradient(
                            90deg,
                            rgba(0, 0, 0, 0.03) 0px,
                            transparent 1px,
                            transparent 2px,
                            rgba(0, 0, 0, 0.03) 3px
                        )`,
                        backgroundSize: "3px 3px",
                        zIndex: 1,
                    }}
                />
            )}

            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transformStyle: "preserve-3d",
                    pointerEvents: "none",
                    translateY: ringOffsetY,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        transformStyle: "preserve-3d",
                        pointerEvents: "none",
                    }}
                >
                    {list.map((item, index) => (
                        <motion.div
                            key={`${index}-${item.src}`}
                            initial={{ opacity: showFinalState ? 1 : 0, scale: showFinalState ? 1 : 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={
                                shouldAnimate
                                    ? {
                                          duration: 0.6,
                                          delay: Math.min(index * 0.08, 1.92),
                                          ease: [0.16, 1, 0.3, 1],
                                      }
                                    : { duration: 0 }
                            }
                            style={{
                                position: "relative",
                                pointerEvents: "none",
                            }}
                        >
                            <CircleCard
                                index={index}
                                cardCount={safeCount}
                                imageSrc={item.src}
                                mediaType={item.type}
                                altText={item.alt}
                                width={w}
                                height={h}
                                ringScale={effectiveRingScale}
                                cardScale={effectiveCardScale}
                                springNx={springNx}
                                springNy={springNy}
                                effectiveNx={effectiveNx}
                                effectiveNy={effectiveNy}
                                motion={safeMotionProps}
                                glareIntensity={glareIntensity}
                                inactive={inactive}
                                rotationOffset={isCanvas ? 0 : rotationOffset}
                                borderRadius={borderRadius}
                                chromaticFringe={chromaticFringe}
                                isFocused={focusIndex === index}
                                cardAriaLabelPrefix={cardAriaLabelPrefix}
                                onCardClick={handleCardClick}
                                isShowcased={showcasedIndex === index}
                                maxStrengthRef={maxStrengthRef}
                                onCardEnter={handleCardEnter}
                                onCardLeave={handleCardLeave}
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    )
}

addPropertyControls(CircleCards, {
    media: {
        type: ControlType.Array,
        title: "Media",
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (props) => props.mediaType !== "image",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.mediaType !== "video",
                },
            },
        },
        defaultValue: DEFAULT_MEDIA,
    },
    cardCount: {
        type: ControlType.Number,
        title: "Card Count",
        description: "Number of cards in the circular arrangement (6-48)",
        defaultValue: 8,
        min: 6,
        max: 48,
        step: 1,
        displayStepper: true,
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        description:
            "Configure base sizes and responsive multipliers for different screen widths",
        buttonTitle: "Layout Settings",
        controls: {
            minHeight: {
                type: ControlType.Number,
                title: "Min Height",
                description: "Minimum container height at desktop (≥810px). Set frame height ≥ min height for full ring.",
                defaultValue: LAYOUT_DEFAULTS.minHeight,
                min: 280,
                max: 900,
                step: 20,
                unit: "px",
                displayStepper: true,
            },
            minHeightTablet: {
                type: ControlType.Number,
                title: "Min Height (Tablet)",
                description:
                    "Multiplier for min height on tablet screens (480-809px)",
                defaultValue: LAYOUT_DEFAULTS.minHeightTablet,
                min: 0.5,
                max: 1.2,
                step: 0.02,
                displayStepper: true,
            },
            minHeightMobile: {
                type: ControlType.Number,
                title: "Min Height (Mobile)",
                description:
                    "Multiplier for min height on mobile screens (<480px)",
                defaultValue: LAYOUT_DEFAULTS.minHeightMobile,
                min: 0.5,
                max: 1.2,
                step: 0.02,
                displayStepper: true,
            },
            ringScale: {
                type: ControlType.Number,
                title: "Ring Size",
                description:
                    "Size of the circular arrangement at desktop (≥810px)",
                defaultValue: LAYOUT_DEFAULTS.ringScale,
                min: 0.22,
                max: 0.7,
                step: 0.02,
                displayStepper: true,
            },
            ringScaleTablet: {
                type: ControlType.Number,
                title: "Ring Size (Tablet)",
                description:
                    "Multiplier for ring size on tablet screens (480-809px)",
                defaultValue: LAYOUT_DEFAULTS.ringScaleTablet,
                min: 0.5,
                max: 1.2,
                step: 0.02,
                displayStepper: true,
            },
            ringScaleMobile: {
                type: ControlType.Number,
                title: "Ring Size (Mobile)",
                description:
                    "Multiplier for ring size on mobile screens (<480px)",
                defaultValue: LAYOUT_DEFAULTS.ringScaleMobile,
                min: 0.5,
                max: 1.2,
                step: 0.02,
                displayStepper: true,
            },
            cardScale: {
                type: ControlType.Number,
                title: "Card Size",
                description: "Size of individual cards at desktop (≥810px)",
                defaultValue: LAYOUT_DEFAULTS.cardScale,
                min: 0.06,
                max: 0.2,
                step: 0.01,
                displayStepper: true,
            },
            cardScaleTablet: {
                type: ControlType.Number,
                title: "Card Size (Tablet)",
                description:
                    "Multiplier for card size on tablet screens (480-809px)",
                defaultValue: LAYOUT_DEFAULTS.cardScaleTablet,
                min: 0.5,
                max: 1.2,
                step: 0.02,
                displayStepper: true,
            },
            cardScaleMobile: {
                type: ControlType.Number,
                title: "Card Size (Mobile)",
                description:
                    "Multiplier for card size on mobile screens (<480px)",
                defaultValue: LAYOUT_DEFAULTS.cardScaleMobile,
                min: 0.5,
                max: 1.2,
                step: 0.02,
                displayStepper: true,
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                description: "Roundness of card corners",
                defaultValue: LAYOUT_DEFAULTS.borderRadius,
                min: 0,
                max: 32,
                step: 2,
                unit: "px",
                displayStepper: true,
            },
            ringOffsetY: {
                type: ControlType.Number,
                title: "Ring Offset Y",
                description: "Vertical shift of the whole ring",
                defaultValue: LAYOUT_DEFAULTS.ringOffsetY,
                min: -120,
                max: 120,
                step: 4,
                unit: "px",
                displayStepper: true,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "interaction",
        description: "Controls for 3D transforms and spring physics",
        controls: {
            groupTilt: {
                type: ControlType.Number,
                title: "Stage Tilt",
                description:
                    "How much the entire ring tilts with pointer movement",
                defaultValue: MOTION_DEFAULTS.groupTilt,
                min: 0,
                max: 2,
                step: 0.1,
                displayStepper: true,
            },
            cardFlip: {
                type: ControlType.Number,
                title: "Card Flip",
                description:
                    "How much individual cards rotate toward the pointer",
                defaultValue: MOTION_DEFAULTS.cardFlip,
                min: 0,
                max: 1.4,
                step: 0.1,
                displayStepper: true,
            },
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                description: "Spring stiffness (higher = snappier motion)",
                defaultValue: MOTION_DEFAULTS.stiffness,
                min: 12,
                max: 120,
                step: 4,
                displayStepper: true,
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                description: "Spring damping (higher = less bounce)",
                defaultValue: MOTION_DEFAULTS.damping,
                min: 8,
                max: 48,
                step: 2,
                displayStepper: true,
            },
            showcaseOnClick: {
                type: ControlType.Boolean,
                title: "Showcase on Click",
                description:
                    "When enabled, clicking a card rotates it to the center for showcasing. Click again to return.",
                defaultValue: MOTION_DEFAULTS.showcaseOnClick,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            showcaseDuration: {
                type: ControlType.Number,
                title: "Showcase Duration",
                description:
                    "How many seconds a showcased card stays in the center after hovering out before returning to its position",
                defaultValue: MOTION_DEFAULTS.showcaseDuration,
                min: 0.5,
                max: 5,
                step: 0.5,
                unit: "s",
                displayStepper: true,
                hidden: (props) => !props.showcaseOnClick,
            },
            fluidMotion: {
                type: ControlType.Boolean,
                title: "Fluid Motion",
                description:
                    "Enables smooth, organic motion with secondary spring physics and flowing transitions",
                defaultValue: MOTION_DEFAULTS.fluidMotion,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            fluidIntensity: {
                type: ControlType.Number,
                title: "Fluid Intensity",
                description:
                    "Controls the strength of fluid motion effects (higher = more flowing, lower = more direct)",
                defaultValue: MOTION_DEFAULTS.fluidIntensity,
                min: 0.3,
                max: 1.2,
                step: 0.1,
                displayStepper: true,
                hidden: (props) => !props.fluidMotion,
            },
        },
    },
    rotation: {
        type: ControlType.Object,
        title: "Auto-Rotation",
        icon: "interaction",
        description:
            "Automatic rotation only runs on your live site, not in the editor",
        controls: {
            autoRoll: {
                type: ControlType.Boolean,
                title: "Enable",
                description:
                    "Pauses while hovering a card; resumes after rest when the pointer leaves the card. Empty areas keep spinning.",
                defaultValue: ROTATION_DEFAULTS.autoRoll,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            rotationType: {
                type: ControlType.Enum,
                title: "Direction",
                description:
                    "Clockwise spins right, Counterclockwise spins left, Oscillate swings back and forth smoothly.",
                options: ["clockwise", "counterclockwise", "oscillate"],
                optionTitles: ["Clockwise", "Counterclockwise", "Oscillate"],
                defaultValue: ROTATION_DEFAULTS.rotationType,
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                hidden: (props) => !props.autoRoll,
            },
            autoRollSpeed: {
                type: ControlType.Number,
                title: "Speed",
                description:
                    "Controls how fast the ring rotates. Higher values spin faster. Pauses automatically when you interact.",
                defaultValue: ROTATION_DEFAULTS.autoRollSpeed,
                min: 0.1,
                max: 2,
                step: 0.1,
                displayStepper: true,
                hidden: (props) => !props.autoRoll,
            },
            autoRollRingScale: {
                type: ControlType.Number,
                title: "Ring Scale",
                description:
                    "Multiplier for ring size during auto-roll (1 = normal size, <1 = smaller, >1 = larger)",
                defaultValue: ROTATION_DEFAULTS.autoRollRingScale,
                min: 0.7,
                max: 1.3,
                step: 0.05,
                displayStepper: true,
                hidden: (props) => !props.autoRoll,
            },
        },
    },
    visual: {
        type: ControlType.Object,
        title: "Visual Effects",
        icon: "effect",
        description: "Optional overlays and lighting effects",
        controls: {
            grainOpacity: {
                type: ControlType.Number,
                title: "Grain Opacity",
                description:
                    "Controls the intensity of the film grain effect (set to 0 to disable)",
                defaultValue: VISUAL_DEFAULTS.grainOpacity,
                min: 0,
                max: 0.15,
                step: 0.005,
                displayStepper: true,
                optional: true,
            },
            vignetteStrength: {
                type: ControlType.Number,
                title: "Vignette Strength",
                description:
                    "Controls how dark the edges become (set to 0 to disable)",
                defaultValue: VISUAL_DEFAULTS.vignetteStrength,
                min: 0,
                max: 0.3,
                step: 0.01,
                displayStepper: true,
                optional: true,
            },
            glareIntensity: {
                type: ControlType.Number,
                title: "Glare Intensity",
                description:
                    "Controls the brightness of the pointer highlight on cards",
                defaultValue: VISUAL_DEFAULTS.glareIntensity,
                min: 0,
                max: 1,
                step: 0.05,
                displayStepper: true,
            },
            chromaticFringe: {
                type: ControlType.Boolean,
                title: "Chromatic Fringe",
                description:
                    "Adds subtle RGB color split on card edges when moving quickly (off by default)",
                defaultValue: VISUAL_DEFAULTS.chromaticFringe,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        icon: "color",
        description: "Background color and styling",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                description:
                    "Container background color (set to undefined to remove)",
                defaultValue: APPEARANCE_DEFAULTS.backgroundColor,
                optional: true,
            },
        },
    },
    accessibility: {
        type: ControlType.Object,
        title: "Accessibility",
        icon: "boolean",
        description: "Screen reader and keyboard navigation settings",
        controls: {
            ariaLabel: {
                type: ControlType.String,
                title: "Region Label",
                description:
                    "Describes the entire component for screen readers",
                defaultValue: ACCESSIBILITY_DEFAULTS.ariaLabel,
                displayTextArea: false,
            },
            cardAriaLabelPrefix: {
                type: ControlType.String,
                title: "Card Label Prefix",
                description:
                    "Prefix for individual card announcements (e.g., 'Card 1 of 24')",
                defaultValue: ACCESSIBILITY_DEFAULTS.cardAriaLabelPrefix,
                displayTextArea: false,
            },
        },
    },
})