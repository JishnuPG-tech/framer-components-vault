// Image carousel with parallax effect. User can click on arrow buttons to move between images
import { useState, useEffect, startTransition, type CSSProperties, useRef, useMemo, useCallback } from "react"
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

interface CarouselImage {
    image: {
        src: string
        alt: string
    }
    text: string
    subtext: string
    link?: string
}

interface ImageCarouselProps {
    images: CarouselImage[]
    animation: {
        autoPlay: "manual" | "autoplay" | "autoplay-manual"
        autoPlayInterval: number
        duration: number
        intensity: number
        imageTransition: "dissolve" | "silk-wipe" | "depth-fade" | "lens-blur" | "reveal-mask" | "parallax-depth" | "shimmer-dissolve" | "cinematic-pan" | "elegant-zoom" | "spiral-reveal" | "liquid-morph" | "glitch-shift" | "origami-fold" | "kaleidoscope" | "wave-distort" | "pixel-dissolve" | "curtain-rise" | "book-flip" | "zoom-blur" | "cross-zoom"
    }
    indicator: {
        showArrows: boolean
        arrowPosition: "split" | "together"
        arrowAlignment?: "left" | "right" | "center" | "bottom-left" | "bottom-right" | "top-left" | "top-right" | "top" | "bottom"
        arrowType: "text-arrows" | "glitch" | "long-arrow" | "broken-arrow" | "plus-minus" | "wave-arrow" | "triangle" | "preview-arrow" | "outline-arrow" | "corner-ridge" | "particle"
        arrowColor: string
        arrowBackgroundColor: string
        showDots: boolean
        indicatorType: "line" | "story" | "number" | "number-only" | "dot"
        indicatorPosition: "bottom" | "top" | "left" | "right" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
        dotColor: string
        activeDotColor: string
    }
    effect: {
        overlayType: "none" | "gradient" | "blur" | "tint" | "noise" | "motion-blur" | "gradient-blur" | "gradient-tint" | "blur-tint" | "gradient-noise" | "blur-noise" | "tint-noise" | "gradient-motion-blur" | "blur-motion-blur" | "tint-motion-blur" | "noise-motion-blur" | "all"
        gradientDirection: "top" | "bottom" | "left" | "right" | "radial"
        gradientColor: string
        gradientOpacity: number
        blurAmount: number
        tintColor: string
        tintOpacity: number
        noiseIntensity: number
        motionBlurIntensity: number
    }
    text: {
        showText: boolean
        titleFont: any
        titleColor: string
        subtextFont: any
        subtextColor: string
        textPosition: "bottom" | "top" | "left" | "right" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
        textGap: number
        textTransition: "typewriter" | "glitch" | "wave" | "neon" | "liquid"
        transitionDelay: number
        transitionDuration: number
        textPadding: string
        textWidth: number
    }
    button: {
        showButton: boolean
        buttonText: string
        buttonFont: any
        buttonTextColor: string
        buttonBackgroundColor: string
        buttonBorderRadius: number
        buttonBorderColor: string
        buttonBorderWidth: number
        buttonPaddingX: number
        buttonPaddingY: number
        buttonPosition: "bottom" | "top" | "left" | "right" | "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
        buttonWidth: "fit" | "fill" | "fixed"
        buttonFixedWidth: number
    }
    cursor: "default" | "crosshair" | "zoom-in" | "grab" | "none" | "trail" | "plus-ridge" | "circular-difference" | "dot-ring" | "crosshair-minimal"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 640
 */
export default function ImageCarousel(props: ImageCarouselProps) {
    const {
        images,
        animation = {
            autoPlay: "manual",
            autoPlayInterval: 3000,
            duration: 0.6,
            intensity: 20,
            imageTransition: "reveal-mask",
        },
        indicator = {
            showArrows: true,
            arrowPosition: "split",
            arrowAlignment: "bottom-left",
            arrowType: "preview-arrow",
            arrowColor: "#FFFFFF",
            arrowBackgroundColor: "rgba(0, 0, 0, 0.5)",
            showDots: true,
            indicatorType: "number",
            indicatorPosition: "center",
            dotColor: "rgba(255, 255, 255, 0.5)",
            activeDotColor: "#FFFFFF",
        },
        effect = {
            overlayType: "none",
            gradientDirection: "bottom",
            gradientColor: "#000000",
            gradientOpacity: 0.5,
            blurAmount: 0,
            tintColor: "#000000",
            tintOpacity: 0.3,
            noiseIntensity: 0.5,
            motionBlurIntensity: 10,
        },
        text = {
            showText: true,
            titleFont: {
                fontSize: "72px",
                letterSpacing: "-0.02em",
                lineHeight: "1.2em",
            },
            titleColor: "#FFFFFF",
            subtextFont: {
                fontSize: "14px",
                variant: "Medium",
                letterSpacing: "-0.01em",
                lineHeight: "1.4em",
            },
            subtextColor: "rgba(255, 255, 255, 0.8)",
            textPosition: "bottom-left",
            textGap: 8,
            textTransition: "typewriter",
            transitionDelay: 0.3,
            transitionDuration: 0.5,
            textPadding: "0px",
            textWidth: 90,
        },
        button = {
            showButton: false,
            buttonText: "Learn More",
            buttonFont: {},
            buttonTextColor: "#FFFFFF",
            buttonBackgroundColor: "#000000",
            buttonBorderRadius: 8,
            buttonBorderColor: "#FFFFFF",
            buttonBorderWidth: 0,
            buttonPaddingX: 24,
            buttonPaddingY: 12,
            buttonPosition: "bottom-left",
            buttonWidth: "fit",
            buttonFixedWidth: 200,
        },
        cursor = "default",
    } = props

    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)
    const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
    const [isHovering, setIsHovering] = useState(false)
    const [progress, setProgress] = useState(0)
    const [clickedArrow, setClickedArrow] = useState<"left" | "right" | null>(null)
    const [hoverArrow, setHoverArrow] = useState<"left" | "right" | null>(null)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [cursorTrail, setCursorTrail] = useState<Array<{ x: number; y: number; id: number }>>([])
    const trailIdRef = useRef(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const progressIntervalRef = useRef<number | null>(null)
    const autoPlayIntervalRef = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()
    const touchStartX = useRef<number>(0)
    const touchEndX = useRef<number>(0)
    const minSwipeDistance = 50
    const [isMobile, setIsMobile] = useState(false)

    // Detect mobile on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkMobile = () => {
                startTransition(() => setIsMobile(window.innerWidth <= 768))
            }
            checkMobile()
            window.addEventListener("resize", checkMobile)
            return () => window.removeEventListener("resize", checkMobile)
        }
    }, [])

    // Safety check for images array
    const safeImages = useMemo(() => {
        if (!images || !Array.isArray(images) || images.length === 0) {
            return [
                {
                    image: {
                        src: "https://framerusercontent.com/images/RFJhYigqt70ZSSmgzH9TrNgV1f8.jpeg",
                        alt: "Gradient 1 - Blue",
                    },
                    text: "Beautiful Gradient",
                    subtext: "Explore the colors",
                    link: "",
                },
                {
                    image: {
                        src: "https://framerusercontent.com/images/oJKbUhedb3JNxAwx6lKRlf97w.jpeg",
                        alt: "Gradient 2 - Purple",
                    },
                    text: "Purple Dreams",
                    subtext: "Vibrant and bold",
                    link: "",
                },
                {
                    image: {
                        src: "https://framerusercontent.com/images/wReVBGWLoqVLQP8oNLSLnrWBFI.jpeg",
                        alt: "Gradient 3 - Orange",
                    },
                    text: "Warm Sunset",
                    subtext: "Feel the warmth",
                    link: "",
                },
            ]
        }
        
        // Map through images and ensure each has a valid image src
        return images.map((item, index) => {
            const defaultImages = [
                "https://framerusercontent.com/images/RFJhYigqt70ZSSmgzH9TrNgV1f8.jpeg",
                "https://framerusercontent.com/images/oJKbUhedb3JNxAwx6lKRlf97w.jpeg",
                "https://framerusercontent.com/images/wReVBGWLoqVLQP8oNLSLnrWBFI.jpeg",
            ]
            return {
                ...item,
                image: {
                    src: item?.image?.src || defaultImages[index % 3],
                    alt: item?.image?.alt || `Placeholder image ${index + 1}`,
                },
            }
        })
    }, [images])

    const { autoPlay, autoPlayInterval, duration, intensity, imageTransition = "reveal-mask" } = animation
    const { showArrows, arrowPosition = "split", arrowAlignment = "bottom-left", arrowType, arrowColor, arrowBackgroundColor, showDots, indicatorType, indicatorPosition, dotColor, activeDotColor } = indicator
    const { overlayType, gradientDirection, gradientColor, gradientOpacity, blurAmount, tintColor, tintOpacity, noiseIntensity, motionBlurIntensity } = effect
    const { showText, titleFont, titleColor, subtextFont, subtextColor, textPosition, textTransition, transitionDelay, transitionDuration, textPadding = "0px", textWidth = 90 } = text
    const { showButton, buttonText, buttonFont, buttonTextColor, buttonBackgroundColor, buttonBorderRadius, buttonBorderColor, buttonBorderWidth, buttonPaddingX, buttonPaddingY, buttonPosition, buttonWidth, buttonFixedWidth } = button

    // Memoize computed values
    const isLastImage = currentIndex === safeImages.length - 1
    const isFirstImage = currentIndex === 0

    const parallaxTransform = useMemo(() => ({
        x: (mousePosition.x - 0.5) * intensity * 2,
        y: (mousePosition.y - 0.5) * intensity * 2,
        scale: 1 + (intensity / 1000),
    }), [mousePosition.x, mousePosition.y, intensity])

    // Memoize handlers
    const handleNext = useCallback(() => {
        setDirection(1)
        startTransition(() => {
            setCurrentIndex((prev) => (prev + 1) % safeImages.length)
            setClickedArrow("right")
            setTimeout(() => setClickedArrow(null), 600)
        })
    }, [safeImages.length])

    const handlePrev = useCallback(() => {
        setDirection(-1)
        startTransition(() => {
            setCurrentIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length)
            setClickedArrow("left")
            setTimeout(() => setClickedArrow(null), 600)
        })
    }, [safeImages.length])

    const handleDotClick = useCallback((index: number) => {
        setDirection(index > currentIndex ? 1 : -1)
        startTransition(() => {
            setCurrentIndex(index)
        })
    }, [currentIndex])

    useEffect(() => {
        if (autoPlay === "manual" || typeof window === "undefined" || isStatic) {
            // Cleanup intervals when autoPlay is disabled
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
                progressIntervalRef.current = null
            }
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current)
                autoPlayIntervalRef.current = null
            }
            return
        }

        setProgress(0)
        const startTime = Date.now()
        
        progressIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime
            const newProgress = Math.min((elapsed / autoPlayInterval) * 100, 100)
            startTransition(() => setProgress(newProgress))
        }, 16) // Update ~60fps

        autoPlayIntervalRef.current = window.setInterval(() => {
            handleNext()
        }, autoPlayInterval)

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
            }
            if (autoPlayIntervalRef.current) {
                clearInterval(autoPlayIntervalRef.current)
            }
        }
    }, [autoPlay, autoPlayInterval, currentIndex, isStatic, handleNext])

    useEffect(() => {
        if (typeof window === "undefined" || isStatic) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return
            
            const rect = containerRef.current.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width
            const y = (e.clientY - rect.top) / rect.height
            
            startTransition(() => {
                setMousePosition({ x, y })
                setCursorPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                
                // Add trail effect for trail cursor
                if (cursor === "trail") {
                    const newTrailPoint = {
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        id: trailIdRef.current++,
                    }
                    setCursorTrail(prev => [...prev.slice(-8), newTrailPoint])
                }
            })
        }

        const container = containerRef.current
        if (container) {
            container.addEventListener("mousemove", handleMouseMove, { passive: true })
            return () => container.removeEventListener("mousemove", handleMouseMove)
        }
    }, [isStatic, cursor])

    useEffect(() => {
        if (typeof window === "undefined" || isStatic) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault()
                if (!isFirstImage) {
                    handlePrev()
                }
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                if (!isLastImage) {
                    handleNext()
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isStatic, handlePrev, handleNext, isFirstImage, isLastImage])

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX
    }, [])

    const handleTouchEnd = useCallback(() => {
        // Disabled swipe transitions for mobile - only arrow clicks work
        touchStartX.current = 0
        touchEndX.current = 0
    }, [])

    const getArrowAnimation = useCallback((isLeft: boolean, isClicked: boolean) => {
        if (!isClicked) return {}
        
        switch (arrowType) {
            case "particle":
                return {
                    scale: [1, 0.8, 1.2, 1],
                    opacity: [1, 0.5, 1],
                }
            case "long-arrow":
                return {
                    x: isLeft ? [0, -8, 2, 0] : [0, 8, -2, 0],
                    scaleX: [1, 1.3, 1],
                }
            case "broken-arrow":
                return {
                    x: isLeft ? [0, -5, 0] : [0, 5, 0],
                    opacity: [1, 0.5, 1],
                }
            case "plus-minus":
                return {
                    scale: [1, 1.3, 0.9, 1],
                }
            case "triangle":
                return {
                    scale: [1, 1.3, 0.9, 1],
                    x: isLeft ? [0, -5, 0] : [0, 5, 0],
                }
            case "text-arrows":
                return {
                    scale: [1, 1.1, 1],
                    x: isLeft ? [0, -3, 0] : [0, 3, 0],
                }
            case "outline-arrow":
                return {
                    scale: [1, 1.05, 1],
                }
            default:
                return {
                    x: isLeft ? [2, -6, 1, 0] : [-2, 6, -1, 0],
                    opacity: [1, 0.7, 1, 1],
                    scale: [1, 0.95, 1.08, 1],
                }
        }
    }, [arrowType])

    const getArrowTransition = useMemo(() => {
        switch (arrowType) {
            case "particle":
                return {
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                }
            case "long-arrow":
            case "broken-arrow":
            case "wave-arrow":
            case "triangle":
                return {
                    duration: 0.7,
                    ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
                }
            case "plus-minus":
                return {
                    duration: 0.8,
                    ease: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
                }
            case "triangle":
                return {
                    duration: 0.6,
                    ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
                }
            case "text-arrows":
                return {
                    duration: 0.5,
                    ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
                }
            case "outline-arrow":
                return {
                    duration: 0.3,
                    ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
                }
            default:
                return {
                    duration: 1.2,
                    ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
                    times: [0, 0.3, 0.7, 1] as [number, number, number, number],
                }
        }
    }, [arrowType])

    const renderArrowSVG = useCallback((direction: "left" | "right") => {
        const isLeft = direction === "left"
        const isClicked = clickedArrow === direction
        const isHovered = hoverArrow === direction
        
        // Preview Arrow - shows next/prev image and title on hover
        if (arrowType === "preview-arrow") {
            const previewIndex = isLeft 
                ? (currentIndex - 1 + safeImages.length) % safeImages.length 
                : (currentIndex + 1) % safeImages.length
            const previewImage = safeImages[previewIndex]
            
            // Don't show preview if at first image (left arrow) or last image (right arrow) or on mobile
            const shouldShowPreview = !isMobile && isHovered && previewImage && !(isLeft && isFirstImage) && !((!isLeft) && isLastImage)
            
            if (shouldShowPreview) {
                return (
                    <motion.div
                        initial={{ x: isLeft ? -20 : 20 }}
                        animate={{ x: 0 }}
                        exit={{ x: isLeft ? -20 : 20 }}
                        transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "24px",
                            padding: "24px",
                            background: "#FFFFFF",
                            backdropFilter: "blur(10px)",
                            borderRadius: "0px",
                            minWidth: "400px",
                            maxWidth: "600px",
                            height: "auto",
                            transformOrigin: "center center",
                        }}
                    >
                        {isLeft && (
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    backgroundColor: "#000000",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#FFFFFF"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                >
                                    <path d="M15 18 L9 12 L15 6" />
                                </svg>
                            </div>
                        )}
                        {!isLeft && previewImage.image?.src && (
                            <div
                                style={{
                                    width: "120px",
                                    height: "120px",
                                    borderRadius: "0px",
                                    backgroundImage: `url(${previewImage.image.src})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    flexShrink: 0,
                                }}
                            />
                        )}
                        {previewImage.text && (
                            <div
                                style={{
                                    color: "#000000",
                                    fontSize: "22px",
                                    fontWeight: "400",
                                    letterSpacing: "-0.02em",
                                    lineHeight: "1.2em",
                                    textAlign: "left",
                                    fontFamily: (titleFont as any)?.fontFamily || "inherit",
                                    flex: 1,
                                    width: "150px",
                                    whiteSpace: "normal",
                                    wordWrap: "break-word",
                                }}
                            >
                                {previewImage.text}
                            </div>
                        )}
                        {isLeft && previewImage.image?.src && (
                            <div
                                style={{
                                    width: "120px",
                                    height: "120px",
                                    borderRadius: "0px",
                                    backgroundImage: `url(${previewImage.image.src})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    flexShrink: 0,
                                }}
                            />
                        )}
                        {!isLeft && (
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    backgroundColor: "#000000",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#FFFFFF"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                >
                                    <path d="M9 18 L15 12 L9 6" />
                                </svg>
                            </div>
                        )}
                    </motion.div>
                )
            }
            
            return (
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                >
                    <path d={isLeft ? "M15 18 L9 12 L15 6" : "M9 18 L15 12 L9 6"} />
                </svg>
            )
        }
        
        // Outline Arrow - circular outline that becomes dashed and rotates on hover
        if (arrowType === "outline-arrow") {
            return (
                <motion.svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    style={{ overflow: "visible" }}
                >
                    {/* Rotating outline circle */}
                    <motion.circle
                        cx="24"
                        cy="24"
                        r="22"
                        stroke={arrowColor}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={isHovered ? "8 8" : "0"}
                        animate={isHovered ? {
                            rotate: 360,
                            strokeDasharray: ["8 8", "12 4", "8 8"],
                        } : {
                            rotate: 0,
                            strokeDasharray: "0",
                        }}
                        transition={isHovered ? {
                            rotate: {
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                            },
                            strokeDasharray: {
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            },
                        } : {
                            duration: 0.3,
                            ease: "easeOut",
                        }}
                        style={{ originX: "50%", originY: "50%" }}
                    />
                    {/* Static chevron arrow */}
                    <motion.path
                        d={isLeft ? "M28 16 L20 24 L28 32" : "M20 16 L28 24 L20 32"}
                        stroke={arrowColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={isClicked ? {
                            x: isLeft ? [-2, 2, -2, 0] : [2, -2, 2, 0],
                        } : {}}
                        transition={{ duration: 0.4 }}
                    />
                </motion.svg>
            )
        }
        
        // Corner Ridge Arrow - square with corner ridges and plus/minus symbols
        if (arrowType === "corner-ridge") {
            return (
                <motion.svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    style={{ overflow: "visible" }}
                >
                    {/* Corner ridges - top-left */}
                    <motion.path
                        d="M 4 4 L 4 12 M 4 4 L 12 4"
                        stroke={arrowColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ originX: "4px", originY: "4px" }}
                    />
                    {/* Corner ridges - top-right */}
                    <motion.path
                        d="M 44 4 L 44 12 M 44 4 L 36 4"
                        stroke={arrowColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ originX: "44px", originY: "4px" }}
                    />
                    {/* Corner ridges - bottom-left */}
                    <motion.path
                        d="M 4 44 L 4 36 M 4 44 L 12 44"
                        stroke={arrowColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ originX: "4px", originY: "44px" }}
                    />
                    {/* Corner ridges - bottom-right */}
                    <motion.path
                        d="M 44 44 L 44 36 M 44 44 L 36 44"
                        stroke={arrowColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ originX: "44px", originY: "44px" }}
                    />
                    {/* Plus or Minus symbol */}
                    <motion.g
                        style={{ originX: "24px", originY: "24px" }}
                    >
                        {/* Horizontal line (always visible) */}
                        <motion.line
                            x1="16"
                            y1="24"
                            x2="32"
                            y2="24"
                            stroke={arrowColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        {/* Vertical line (only for plus/next) */}
                        {!isLeft && (
                            <motion.line
                                x1="24"
                                y1="16"
                                x2="24"
                                y2="32"
                                stroke={arrowColor}
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        )}
                    </motion.g>
                </motion.svg>
            )
        }
        
        // Text Arrows - displays "Prev" and "Next"
        if (arrowType === "text-arrows") {
            return (
                <div
                    style={{
                        color: arrowColor,
                        fontSize: "14px",
                        fontWeight: "600",
                        letterSpacing: "-0.01em",
                        userSelect: "none",
                    }}
                >
                    {isLeft ? "Prev" : "Next"}
                </div>
            )
        }
        
        // Long Arrow - extended arrow with long shaft
        if (arrowType === "long-arrow") {
            return (
                <motion.svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <motion.path
                        d={isLeft ? "M19 12 L5 12 M10 7 L5 12 L10 17" : "M5 12 L19 12 M14 7 L19 12 L14 17"}
                        animate={isClicked ? {
                            strokeWidth: [2, 3, 2],
                        } : {}}
                        transition={{ duration: 0.4 }}
                    />
                    {isClicked && (
                        <motion.circle
                            cx={isLeft ? "5" : "19"}
                            cy="12"
                            r="2"
                            fill={arrowColor}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                                scale: [0, 1.5, 0],
                                opacity: [0.8, 0.4, 0],
                            }}
                            transition={{ duration: 0.6 }}
                        />
                    )}
                </motion.svg>
            )
        }
        
        // Broken Arrow - dashed/broken line arrow
        if (arrowType === "broken-arrow") {
            return (
                <motion.svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <motion.path
                        d={isLeft ? "M10 7 L5 12 L10 17" : "M14 7 L19 12 L14 17"}
                        animate={isClicked ? {
                            strokeWidth: [2, 3, 2],
                        } : {}}
                        transition={{ duration: 0.4 }}
                    />
                    <motion.line
                        x1={isLeft ? "19" : "5"}
                        y1="12"
                        x2={isLeft ? "11" : "13"}
                        y2="12"
                        strokeDasharray="3 2"
                        animate={isClicked ? {
                            strokeDashoffset: [0, -10, 0],
                            opacity: [1, 0.5, 1],
                        } : {}}
                        transition={{ duration: 0.6 }}
                    />
                    {isClicked && [0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            cx={isLeft ? 19 - i * 3 : 5 + i * 3}
                            cy="12"
                            r="1"
                            fill={arrowColor}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                                scale: [0, 1.5, 0],
                                opacity: [0, 1, 0],
                            }}
                            transition={{ 
                                duration: 0.5,
                                delay: i * 0.1,
                            }}
                        />
                    ))}
                </motion.svg>
            )
        }
        
        // Plus/Minus - transforms between plus and minus
        if (arrowType === "plus-minus") {
            return (
                <motion.svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                >
                    <motion.line
                        x1="7"
                        y1="12"
                        x2="17"
                        y2="12"
                    />
                    {!isLeft && (
                        <motion.line
                            x1="12"
                            y1="7"
                            x2="12"
                            y2="17"
                            animate={isClicked ? {
                                scaleY: [1, 0, 1],
                                opacity: [1, 0.5, 1],
                            } : {
                                scaleY: 1,
                                opacity: 1,
                            }}
                            transition={{ duration: 0.6 }}
                            style={{ originY: 0.5 }}
                        />
                    )}
                </motion.svg>
            )
        }
        
        // Wave Arrow - wavy arrow path
        if (arrowType === "wave-arrow") {
            return (
                <motion.svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <motion.path
                        d={isLeft ? 
                            "M19 12 Q16 9 13 12 Q10 15 7 12 M10 7 L5 12 L10 17" : 
                            "M5 12 Q8 9 11 12 Q14 15 17 12 M14 7 L19 12 L14 17"
                        }
                        animate={isClicked ? {
                            d: isLeft ? [
                                "M19 12 Q16 9 13 12 Q10 15 7 12 M10 7 L5 12 L10 17",
                                "M19 12 Q16 15 13 12 Q10 9 7 12 M10 7 L5 12 L10 17",
                                "M19 12 Q16 9 13 12 Q10 15 7 12 M10 7 L5 12 L10 17",
                            ] : [
                                "M5 12 Q8 9 11 12 Q14 15 17 12 M14 7 L19 12 L14 17",
                                "M5 12 Q8 15 11 12 Q14 9 17 12 M14 7 L19 12 L14 17",
                                "M5 12 Q8 9 11 12 Q14 15 17 12 M14 7 L19 12 L14 17",
                            ],
                            strokeWidth: [2, 2.5, 2],
                        } : {}}
                        transition={{ duration: 0.8 }}
                    />
                </motion.svg>
            )
        }
        
        // Triangle Arrow - solid triangle
        if (arrowType === "triangle") {
            return (
                <motion.svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={arrowColor}
                    stroke="none"
                >
                    <motion.path
                        d={isLeft ? "M15 6 L9 12 L15 18 Z" : "M9 6 L15 12 L9 18 Z"}
                        animate={isClicked ? {
                            scale: [1, 1.2, 1],
                        } : {}}
                        transition={{ duration: 0.4 }}
                        style={{ originX: 0.5, originY: 0.5 }}
                    />
                    {isClicked && (
                        <>
                            <motion.path
                                d={isLeft ? "M15 6 L9 12 L15 18 Z" : "M9 6 L15 12 L9 18 Z"}
                                stroke={arrowColor}
                                strokeWidth="2"
                                initial={{ scale: 1, opacity: 0.8 }}
                                animate={{ 
                                    scale: [1, 1.5, 2],
                                    opacity: [0.8, 0.4, 0],
                                }}
                                transition={{ duration: 0.6 }}
                                style={{ originX: 0.5, originY: 0.5 }}
                            />
                            <motion.circle
                                cx={isLeft ? "9" : "15"}
                                cy="12"
                                r="2"
                                fill={arrowColor}
                                initial={{ scale: 0 }}
                                animate={{ 
                                    scale: [0, 1.5, 0],
                                }}
                                transition={{ duration: 0.5 }}
                            />
                        </>
                    )}
                </motion.svg>
            )
        }
        
        // Glitch Arrow - glitchy distortion effect
        if (arrowType === "glitch") {
            return (
                <motion.svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                >
                    <motion.path
                        d={isLeft ? "M15 18 L9 12 L15 6" : "M9 18 L15 12 L9 6"}
                        animate={isClicked ? {
                            x: [0, -3, 3, -2, 2, 0],
                            y: [0, 2, -2, 1, -1, 0],
                            opacity: [1, 0.7, 1, 0.8, 1],
                        } : {}}
                        transition={{ 
                            duration: 0.5,
                            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                            ease: [0.42, 0, 0.58, 1] as [number, number, number, number],
                        }}
                    />
                    {isClicked && (
                        <>
                            <motion.path
                                d={isLeft ? "M15 18 L9 12 L15 6" : "M9 18 L15 12 L9 6"}
                                stroke={arrowColor}
                                strokeWidth="2"
                                initial={{ x: 0, opacity: 0 }}
                                animate={{ 
                                    x: [0, 5, -5, 0],
                                    opacity: [0, 0.5, 0.5, 0],
                                }}
                                transition={{ duration: 0.5 }}
                            />
                            <motion.path
                                d={isLeft ? "M15 18 L9 12 L15 6" : "M9 18 L15 12 L9 6"}
                                stroke="#FF0000"
                                strokeWidth="1"
                                initial={{ x: 0, opacity: 0 }}
                                animate={{ 
                                    x: [0, -2, 2, 0],
                                    opacity: [0, 0.3, 0.3, 0],
                                }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            />
                        </>
                    )}
                </motion.svg>
            )
        }
        
        // Particle Arrow - particle burst effect
        if (arrowType === "particle") {
            return (
                <motion.svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={arrowColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                >
                    <motion.path
                        d={isLeft ? "M15 18 L9 12 L15 6" : "M9 18 L15 12 L9 6"}
                    />
                    {isClicked && [0, 1, 2, 3, 4].map((i) => (
                        <motion.circle
                            key={i}
                            cx={isLeft ? "9" : "15"}
                            cy="12"
                            r="2"
                            fill={arrowColor}
                            initial={{ 
                                x: 0, 
                                y: 0, 
                                scale: 1,
                                opacity: 1,
                            }}
                            animate={{ 
                                x: Math.cos((i * Math.PI * 2) / 5) * 20,
                                y: Math.sin((i * Math.PI * 2) / 5) * 20,
                                scale: [1, 0.5, 0],
                                opacity: [1, 0.5, 0],
                            }}
                            transition={{ 
                                duration: 0.6,
                                delay: i * 0.05,
                            }}
                        />
                    ))}
                </motion.svg>
            )
        }
        
        // Default fallback
        return (
            <motion.svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={arrowColor}
                strokeWidth="2"
                strokeLinecap="round"
            >
                <motion.path
                    d={isLeft ? "M15 18 L9 12 L15 6" : "M9 18 L15 12 L9 6"}
                />
            </motion.svg>
        )
    }, [arrowColor, arrowType, clickedArrow, direction, hoverArrow, currentIndex, safeImages])

    const getTextTransitionVariants = useCallback((transition: string) => {
        switch (transition) {
            case "typewriter":
                return {
                    hidden: { opacity: 0 },
                    visible: (i: number) => ({
                        opacity: 1,
                        transition: {
                            delay: transitionDelay + i * 0.03,
                            duration: transitionDuration * 0.1,
                            ease: [0, 0, 0.2, 1] as [number, number, number, number],
                        },
                    }),
                }
            case "glitch":
                return {
                    hidden: { 
                        opacity: 0,
                        x: 0,
                        y: 0,
                        filter: "blur(0px)",
                    },
                    visible: {
                        opacity: 1,
                        x: [0, -5, 5, -3, 3, 0],
                        y: [0, 3, -3, 2, -2, 0],
                        filter: ["blur(0px)", "blur(2px)", "blur(0px)", "blur(1px)", "blur(0px)"],
                        transition: {
                            delay: transitionDelay,
                            duration: transitionDuration,
                            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                            ease: [0.42, 0, 0.58, 1] as [number, number, number, number],
                        },
                    },
                }
            case "wave":
                return {
                    hidden: { opacity: 0, y: 20 },
                    visible: (i: number) => ({
                        opacity: 1,
                        y: [20, -5, 0],
                        transition: {
                            delay: transitionDelay + i * 0.05,
                            duration: transitionDuration,
                            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                        },
                    }),
                }
            case "neon":
                return {
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: (i: number) => ({
                        opacity: 1,
                        scale: [0.8, 1.1, 0.8],
                        transition: {
                            delay: transitionDelay + i * 0.02,
                            duration: transitionDuration,
                            ease: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
                        },
                    }),
                }
            case "liquid":
                return {
                    hidden: { 
                        opacity: 0,
                        scaleY: 0,
                        scaleX: 1.5,
                        y: -20,
                    },
                    visible: (i: number) => ({
                        opacity: 1,
                        scaleY: [0, 1.2, 0.9, 1],
                        scaleX: [1.5, 0.8, 1.1, 1],
                        y: [-20, 5, -2, 0],
                        transition: {
                            delay: transitionDelay + i * 0.04,
                            duration: transitionDuration,
                            ease: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
                        },
                    }),
                }
            default:
                return {
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            delay: transitionDelay,
                            duration: transitionDuration,
                            ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
                        },
                    },
                }
        }
    }, [transitionDelay, transitionDuration])

    const renderAnimatedText = useCallback((textContent: string, isSubtext: boolean) => {
        const variants = getTextTransitionVariants(textTransition)
        const words = textContent.split(" ")
        
        // On canvas (static renderer), show text immediately without animation
        if (isStatic) {
            return <span style={{ display: "inline-block" }}>{textContent}</span>
        }
        
        if (textTransition === "typewriter" || textTransition === "wave" || textTransition === "neon" || textTransition === "liquid") {
            return (
                <AnimatePresence mode="wait">
                    <motion.span
                        key={`${currentIndex}-${isSubtext ? 'subtext' : 'text'}-${textContent}`}
                        style={{
                            display: "inline-block",
                        }}
                        initial="hidden"
                        animate="visible"
                    >
                        {words.map((word, i) => (
                            <motion.span
                                key={i}
                                custom={i}
                                variants={variants}
                                initial="hidden"
                                animate="visible"
                                style={{
                                    display: "inline-block",
                                    marginRight: i < words.length - 1 ? "0.25em" : "0",
                                }}
                            >
                                {word}
                            </motion.span>
                        ))}
                    </motion.span>
                </AnimatePresence>
            )
        }
        
        return (
            <AnimatePresence mode="wait">
                <motion.span
                    key={`${currentIndex}-${isSubtext ? 'subtext' : 'text'}-${textContent}`}
                    variants={variants}
                    initial="hidden"
                    animate="visible"
                    style={{
                        display: "inline-block",
                    }}
                >
                    {textContent}
                </motion.span>
            </AnimatePresence>
        )
    }, [textTransition, getTextTransitionVariants, currentIndex, isStatic])

    const getGradientStyle = useMemo(() => {
        const color = gradientColor
        
        switch (gradientDirection) {
            case "top":
                return `linear-gradient(to top, transparent, ${color})`
            case "bottom":
                return `linear-gradient(to bottom, transparent, ${color})`
            case "left":
                return `linear-gradient(to left, transparent, ${color})`
            case "right":
                return `linear-gradient(to right, transparent, ${color})`
            case "radial":
                return `radial-gradient(circle, transparent, ${color})`
            default:
                return `linear-gradient(to bottom, transparent, ${color})`
        }
    }, [gradientDirection, gradientColor])

    const overlayFlags = useMemo(() => ({
        shouldShowGradient: overlayType === "gradient" || overlayType === "gradient-blur" || overlayType === "gradient-tint" || overlayType === "all" || overlayType === "gradient-noise" || overlayType === "gradient-motion-blur",
        shouldShowBlur: overlayType === "blur" || overlayType === "gradient-blur" || overlayType === "blur-tint" || overlayType === "all" || overlayType === "blur-noise" || overlayType === "blur-motion-blur",
        shouldShowTint: overlayType === "tint" || overlayType === "gradient-tint" || overlayType === "blur-tint" || overlayType === "all" || overlayType === "tint-noise" || overlayType === "tint-motion-blur",
        shouldShowNoise: overlayType === "noise" || overlayType === "gradient-noise" || overlayType === "blur-noise" || overlayType === "tint-noise" || overlayType === "all",
        shouldShowMotionBlur: overlayType === "motion-blur" || overlayType === "gradient-motion-blur" || overlayType === "blur-motion-blur" || overlayType === "tint-motion-blur" || overlayType === "noise-motion-blur" || overlayType === "all",
    }), [overlayType])

    const { shouldShowGradient, shouldShowBlur, shouldShowTint, shouldShowNoise, shouldShowMotionBlur } = overlayFlags

    const filterStyle = useMemo(() => {
        if (!shouldShowBlur && !shouldShowMotionBlur) return "none"
        return "url(#combinedFilter)"
    }, [shouldShowBlur, shouldShowMotionBlur])

    const combinedFilterStdDeviation = useMemo(() => {
        if (shouldShowBlur && shouldShowMotionBlur) {
            return `${blurAmount + motionBlurIntensity} ${blurAmount}`
        }
        if (shouldShowBlur) {
            return `${blurAmount} ${blurAmount}`
        }
        if (shouldShowMotionBlur) {
            return `${motionBlurIntensity} 0`
        }
        return "0 0"
    }, [shouldShowBlur, shouldShowMotionBlur, blurAmount, motionBlurIntensity])

    const getImageTransitionConfig = useMemo(() => {
        switch (imageTransition) {
            case "reveal-mask":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            clipPath: direction > 0 
                                ? "inset(0 0 0 100%)" 
                                : "inset(0 100% 0 0)",
                            opacity: 1,
                        }),
                        center: {
                            clipPath: "inset(0 0 0 0)",
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            clipPath: direction > 0 
                                ? "inset(0 100% 0 0)" 
                                : "inset(0 0 0 100%)",
                            opacity: 1,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.65, 0, 0.35, 1] as [number, number, number, number],
                    },
                }
            case "curtain-rise":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            clipPath: "inset(100% 0 0 0)",
                            opacity: 1,
                        }),
                        center: {
                            clipPath: "inset(0 0 0 0)",
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            clipPath: "inset(0 0 100% 0)",
                            opacity: 1,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.65, 0, 0.35, 1] as [number, number, number, number],
                    },
                }
            case "zoom-blur":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            scale: 1.5,
                            opacity: 0,
                            filter: "blur(15px)",
                        }),
                        center: {
                            scale: 1,
                            opacity: 1,
                            filter: "blur(0px)",
                        },
                        exit: (direction: number) => ({
                            scale: 0.5,
                            opacity: 0,
                            filter: "blur(15px)",
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.87, 0, 0.13, 1] as [number, number, number, number],
                    },
                }
            case "dissolve":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            opacity: 0,
                        }),
                        center: {
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
                    },
                }
            case "silk-wipe":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            clipPath: direction > 0 
                                ? "inset(100% 0 0 0)" 
                                : "inset(0 0 100% 0)",
                            opacity: 1,
                        }),
                        center: {
                            clipPath: "inset(0 0 0 0)",
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            clipPath: direction > 0 
                                ? "inset(0 0 100% 0)" 
                                : "inset(100% 0 0 0)",
                            opacity: 1,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
                    },
                }
            case "depth-fade":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            x: direction > 0 ? "100%" : "-100%",
                            scale: 0.8,
                            opacity: 0,
                        }),
                        center: {
                            x: 0,
                            scale: 1,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            x: direction > 0 ? "-100%" : "100%",
                            scale: 1.2,
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number],
                    },
                }
            case "lens-blur":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            x: direction > 0 ? "100%" : "-100%",
                            opacity: 0,
                            filter: "blur(10px)",
                        }),
                        center: {
                            x: 0,
                            opacity: 1,
                            filter: "blur(0px)",
                        },
                        exit: (direction: number) => ({
                            x: direction > 0 ? "-100%" : "100%",
                            opacity: 0,
                            filter: "blur(10px)",
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                    },
                }
            case "parallax-depth":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            x: direction > 0 ? "100%" : "-100%",
                            scale: 0.8,
                            opacity: 0,
                        }),
                        center: {
                            x: 0,
                            scale: 1,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            x: direction > 0 ? "-100%" : "100%",
                            scale: 0.8,
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.83, 0, 0.17, 1] as [number, number, number, number],
                    },
                }
            case "shimmer-dissolve":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            opacity: 0,
                            filter: "brightness(1.5)",
                        }),
                        center: {
                            opacity: 1,
                            filter: "brightness(1)",
                        },
                        exit: (direction: number) => ({
                            opacity: 0,
                            filter: "brightness(0.5)",
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
                    },
                }
            case "cinematic-pan":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            x: direction > 0 ? "100%" : "-100%",
                            scale: 1.1,
                            opacity: 1,
                        }),
                        center: {
                            x: 0,
                            scale: 1,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            x: direction > 0 ? "-100%" : "100%",
                            scale: 1.1,
                            opacity: 1,
                        }),
                    },
                    transition: {
                        duration: duration * 1.2,
                        ease: [0.83, 0, 0.17, 1] as [number, number, number, number],
                    },
                }
            case "elegant-zoom":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            scale: 0.8,
                            opacity: 0,
                        }),
                        center: {
                            scale: 1,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            scale: 1.2,
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.87, 0, 0.13, 1] as [number, number, number, number],
                    },
                }
            case "spiral-reveal":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            scale: 0.5,
                            rotate: direction > 0 ? 180 : -180,
                            opacity: 0,
                        }),
                        center: {
                            scale: 1,
                            rotate: 0,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            scale: 0.5,
                            rotate: direction > 0 ? -180 : 180,
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration * 1.3,
                        ease: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
                    },
                }
            case "liquid-morph":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            x: direction > 0 ? "100%" : "-100%",
                            scaleX: 0.6,
                            scaleY: 1.4,
                            opacity: 0,
                        }),
                        center: {
                            x: 0,
                            scaleX: 1,
                            scaleY: 1,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            x: direction > 0 ? "-100%" : "100%",
                            scaleX: 1.4,
                            scaleY: 0.6,
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
                    },
                }
            case "glitch-shift":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            x: direction > 0 ? "100%" : "-100%",
                            opacity: 0,
                        }),
                        center: {
                            x: 0,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            x: direction > 0 ? "-100%" : "100%",
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration * 0.5,
                        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                    },
                }
            case "origami-fold":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            rotateY: direction > 0 ? 180 : -180,
                            opacity: 0,
                        }),
                        center: {
                            rotateY: 0,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            rotateY: direction > 0 ? -180 : 180,
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.83, 0, 0.17, 1] as [number, number, number, number],
                    },
                }
            case "kaleidoscope":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            scale: 0.3,
                            rotate: direction > 0 ? 360 : -360,
                            opacity: 0,
                        }),
                        center: {
                            scale: 1,
                            rotate: 0,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            scale: 0.3,
                            rotate: direction > 0 ? -360 : 360,
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration * 1.4,
                        ease: [0.87, 0, 0.13, 1] as [number, number, number, number],
                    },
                }
            case "wave-distort":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            x: direction > 0 ? "100%" : "-100%",
                            scaleY: 1,
                            opacity: 0,
                        }),
                        center: {
                            x: 0,
                            scaleY: 1,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            x: direction > 0 ? "-100%" : "100%",
                            scaleY: 1,
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
                    },
                }
            case "pixel-dissolve":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            opacity: 0,
                            filter: "blur(20px)",
                        }),
                        center: {
                            opacity: 1,
                            filter: "blur(0px)",
                        },
                        exit: (direction: number) => ({
                            opacity: 0,
                            filter: "blur(20px)",
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
                    },
                }
            case "book-flip":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            rotateY: direction > 0 ? 180 : -180,
                            opacity: 0,
                        }),
                        center: {
                            rotateY: 0,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            rotateY: direction > 0 ? -180 : 180,
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration * 1.2,
                        ease: [0.83, 0, 0.17, 1] as [number, number, number, number],
                    },
                }
            case "cross-zoom":
                return {
                    variants: {
                        enter: (direction: number) => ({
                            scale: 0.7,
                            opacity: 0,
                        }),
                        center: {
                            scale: 1,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            scale: 1.3,
                            opacity: 0,
                        }),
                    },
                    transition: {
                        duration: duration,
                        ease: [0.87, 0, 0.13, 1] as [number, number, number, number],
                    },
                }
            default:
                return {
                    variants: {
                        enter: (direction: number) => ({
                            x: direction > 0 ? "100%" : "-100%",
                            opacity: 1,
                        }),
                        center: {
                            x: 0,
                            opacity: 1,
                        },
                        exit: (direction: number) => ({
                            x: direction > 0 ? "-100%" : "100%",
                            opacity: 1,
                        }),
                    },
                    transition: {
                        x: { type: "tween", ease: [0.22, 1, 0.36, 1] as [number, number, number, number], duration: duration },
                        opacity: { duration: duration * 0.8 },
                    },
                }
        }
    }, [imageTransition, duration])

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? "100%" : "-100%",
            scale: 1,
            opacity: 0,
        }),
        center: {
            x: 0,
            scale: 1,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction > 0 ? "-100%" : "100%",
            scale: 1,
            opacity: 0,
        }),
    }

    const parallaxX = (mousePosition.x - 0.5) * intensity * 2
    const parallaxY = (mousePosition.y - 0.5) * intensity * 2

    const getCursorStyle = useMemo(() => {
        if (cursor === "trail" || cursor === "plus-ridge" || cursor === "circular-difference" || cursor === "dot-ring" || cursor === "crosshair-minimal") {
            return "none"
        }
        return cursor
    }, [cursor])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor: "transparent",
                cursor: getCursorStyle,
            }}
            role="region"
            aria-label="Image carousel"
            aria-live="polite"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* SVG Filters - must be outside AnimatePresence */}
            <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
                <defs>
                    <filter id="noiseFilter">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.9"
                            numOctaves="4"
                            stitchTiles="stitch"
                        />
                        <feColorMatrix type="saturate" values="0" />
                        <feComponentTransfer>
                            <feFuncA type="discrete" tableValues={`0 ${noiseIntensity}`} />
                        </feComponentTransfer>
                        <feBlend mode="overlay" in="SourceGraphic" />
                    </filter>
                    <filter id="motionBlurFilter">
                        <feGaussianBlur 
                            in="SourceGraphic" 
                            stdDeviation={direction > 0 ? `${motionBlurIntensity} 0` : direction < 0 ? `${motionBlurIntensity} 0` : "0 0"}
                        />
                    </filter>
                    <filter id="combinedFilter">
                        <feGaussianBlur 
                            in="SourceGraphic" 
                            stdDeviation={combinedFilterStdDeviation}
                        />
                    </filter>
                </defs>
            </svg>
            <AnimatePresence initial={false} custom={direction} mode="sync">
                <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={getImageTransitionConfig.variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={getImageTransitionConfig.transition}
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        top: 0,
                        left: 0,
                    }}
                >
                    <motion.div
                        style={{
                            width: "100%",
                            height: "100%",
                            backgroundImage: `url(${safeImages[currentIndex]?.image?.src || ""})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: filterStyle,
                            willChange: "transform",
                        }}
                        animate={parallaxTransform}
                        transition={{
                            type: "spring",
                            stiffness: 150,
                            damping: 30,
                            mass: 0.5,
                        }}
                        role="img"
                        aria-label={safeImages[currentIndex]?.image?.alt || "Carousel image"}
                    />
                    {shouldShowNoise && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                filter: "url(#noiseFilter)",
                                opacity: noiseIntensity,
                                pointerEvents: "none",
                            }}
                            aria-hidden="true"
                        />
                    )}
                    {shouldShowTint && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor: tintColor,
                                opacity: tintOpacity,
                                pointerEvents: "none",
                            }}
                            aria-hidden="true"
                        />
                    )}
                    {shouldShowGradient && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundImage: getGradientStyle,
                                opacity: gradientOpacity,
                                pointerEvents: "none",
                            }}
                            aria-hidden="true"
                        />
                    )}
                    
                    {/* Text Overlay */}
                    {showText && (safeImages[currentIndex]?.text || safeImages[currentIndex]?.subtext) && (
                        <div
                            style={{
                                position: "absolute",
                                maxWidth: `${textWidth}%`,
                                ...(textPosition === "center" || textPosition === "bottom" || textPosition === "top" ? {
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                } : {
                                    textAlign: "center",
                                }),
                                ...(textPosition === "bottom" && {
                                    bottom: showDots && (indicatorPosition === "bottom" || indicatorPosition === "bottom-left" || indicatorPosition === "bottom-right") ? 80 : 40,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                }),
                                ...(textPosition === "top" && {
                                    top: showDots && (indicatorPosition === "top" || indicatorPosition === "top-left" || indicatorPosition === "top-right") ? 80 : 40,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                }),
                                ...(textPosition === "left" && {
                                    left: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 40,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }),
                                ...(textPosition === "right" && {
                                    right: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 40,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }),
                                ...(textPosition === "top-left" && {
                                    top: 40,
                                    left: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 40,
                                }),
                                ...(textPosition === "top-right" && {
                                    top: 40,
                                    right: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 40,
                                }),
                                ...(textPosition === "bottom-left" && {
                                    bottom: 40,
                                    left: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 40,
                                }),
                                ...(textPosition === "bottom-right" && {
                                    bottom: 40,
                                    right: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 40,
                                }),
                                pointerEvents: "none",
                                zIndex: 5,
                                padding: textPadding,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: text.textGap,
                                    width: "100%",
                                    ...(textPosition === "center" || textPosition === "bottom" || textPosition === "top" ? {
                                        textAlign: "center",
                                        paddingLeft: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 0,
                                        paddingRight: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 0,
                                    } : {
                                        textAlign: "center",
                                    }),
                                    ...(textPosition === "bottom" && {
                                        textAlign: "center",
                                        paddingLeft: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 0,
                                        paddingRight: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 0,
                                    }),
                                    ...(textPosition === "top" && {
                                        textAlign: "center",
                                        paddingLeft: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 0,
                                        paddingRight: showArrows && autoPlay !== "autoplay" && arrowPosition === "split" ? 68 : 0,
                                    }),
                                    ...(textPosition === "left" && {
                                        textAlign: "left",
                                    }),
                                    ...(textPosition === "right" && {
                                        textAlign: "right",
                                    }),
                                    ...(textPosition === "top-left" && {
                                        textAlign: "left",
                                    }),
                                    ...(textPosition === "top-right" && {
                                        textAlign: "right",
                                    }),
                                    ...(textPosition === "bottom-left" && {
                                        textAlign: "left",
                                    }),
                                    ...(textPosition === "bottom-right" && {
                                        textAlign: "right",
                                    }),
                                }}
                            >
                                {safeImages[currentIndex]?.text && (
                                    <h2
                                        style={{
                                            margin: 0,
                                            color: titleColor,
                                            width: "100%",
                                            wordWrap: "break-word",
                                            overflowWrap: "break-word",
                                            ...titleFont,
                                        }}
                                    >
                                        {renderAnimatedText(safeImages[currentIndex].text, false)}
                                    </h2>
                                )}
                                {safeImages[currentIndex]?.subtext && (
                                    <p
                                        style={{
                                            margin: 0,
                                            color: subtextColor,
                                            width: "100%",
                                            wordWrap: "break-word",
                                            overflowWrap: "break-word",
                                            ...subtextFont,
                                        }}
                                    >
                                        {renderAnimatedText(safeImages[currentIndex].subtext, true)}
                                    </p>
                                )}
                                {showButton && safeImages[currentIndex]?.link && (
                                    <a
                                        href={safeImages[currentIndex]?.link || ""}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "inline-block",
                                            padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
                                            backgroundColor: buttonBackgroundColor,
                                            color: buttonTextColor,
                                            borderRadius: `${buttonBorderRadius}px`,
                                            border: `${buttonBorderWidth}px solid ${buttonBorderColor}`,
                                            textDecoration: "none",
                                            cursor: "pointer",
                                            transition: "opacity 0.2s ease",
                                            pointerEvents: "auto",
                                            marginTop: 8,
                                            textAlign: "center",
                                            width: buttonWidth === "fill" ? "100%" : buttonWidth === "fixed" ? `${buttonFixedWidth}px` : "auto",
                                            alignSelf: 
                                                textPosition === "center" || textPosition === "bottom" || textPosition === "top" ? "center" :
                                                textPosition === "left" || textPosition === "top-left" || textPosition === "bottom-left" ? "flex-start" :
                                                textPosition === "right" || textPosition === "top-right" || textPosition === "bottom-right" ? "flex-end" :
                                                "flex-start",
                                            ...buttonFont,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.opacity = "0.8"
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.opacity = "1"
                                        }}
                                    >
                                        {buttonText}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {showArrows && autoPlay !== "autoplay" && (
                <>
                    <button
                        onClick={handlePrev}
                        disabled={isFirstImage}
                        style={{
                            position: "absolute",
                            ...(arrowPosition === "together" ? {
                                ...(arrowAlignment === "left" && {
                                    left: arrowType === "preview-arrow" && hoverArrow === "left" ? 0 : 20,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }),
                                ...(arrowAlignment === "right" && {
                                    right: arrowType === "preview-arrow" && hoverArrow === "left" ? 76 : 96,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }),
                                ...(arrowAlignment === "center" && {
                                    left: "50%",
                                    top: "50%",
                                    transform: "translate(-50%, -50%) translateX(-28px)",
                                }),
                                ...(arrowAlignment === "bottom" && {
                                    left: "50%",
                                    bottom: 20,
                                    transform: "translateX(-50%) translateX(-28px)",
                                }),
                                ...(arrowAlignment === "top" && {
                                    left: "50%",
                                    top: 20,
                                    transform: "translateX(-50%) translateX(-28px)",
                                }),
                                ...(arrowAlignment === "bottom-left" && {
                                    left: arrowType === "preview-arrow" && hoverArrow === "left" ? 0 : 20,
                                    bottom: 20,
                                }),
                                ...(arrowAlignment === "bottom-right" && {
                                    right: arrowType === "preview-arrow" && hoverArrow === "left" ? 76 : 96,
                                    bottom: 20,
                                }),
                                ...(arrowAlignment === "top-left" && {
                                    left: arrowType === "preview-arrow" && hoverArrow === "left" ? 0 : 20,
                                    top: 20,
                                }),
                                ...(arrowAlignment === "top-right" && {
                                    right: arrowType === "preview-arrow" && hoverArrow === "left" ? 76 : 96,
                                    top: 20,
                                }),
                            } : {
                                left: arrowType === "preview-arrow" && hoverArrow === "left" ? 0 : 20,
                                top: "50%",
                                transform: "translateY(-50%)",
                            }),
                            width: arrowType === "preview-arrow" && hoverArrow === "left" ? "auto" : 48,
                            height: arrowType === "preview-arrow" && hoverArrow === "left" ? "auto" : 48,
                            borderRadius: arrowType === "preview-arrow" && hoverArrow === "left" ? "0px" : "50%",
                            backgroundColor: arrowType === "preview-arrow" && hoverArrow === "left" ? "transparent" : arrowBackgroundColor,
                            border: "none",
                            cursor: isFirstImage ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            transition: "all 0.3s ease",
                            opacity: isFirstImage ? 0.3 : 1,
                            padding: arrowType === "preview-arrow" && hoverArrow === "left" ? 0 : undefined,
                            ...(arrowType === "corner-ridge" && {
                                borderRadius: "0px",
                                backgroundColor: arrowBackgroundColor,
                            }),
                        }}
                        onMouseEnter={(e) => {
                            if (!isFirstImage) {
                                e.currentTarget.style.opacity = "0.8"
                                startTransition(() => setHoverArrow("left"))
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isFirstImage) {
                                e.currentTarget.style.opacity = "1"
                                startTransition(() => setHoverArrow(null))
                            }
                        }}
                        aria-label="Previous image"
                    >
                        <AnimatePresence mode="wait">
                            {renderArrowSVG("left")}
                        </AnimatePresence>
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={isLastImage}
                        style={{
                            position: "absolute",
                            ...(arrowPosition === "together" ? {
                                ...(arrowAlignment === "left" && {
                                    left: arrowType === "preview-arrow" && hoverArrow === "right" ? 76 : 76,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }),
                                ...(arrowAlignment === "right" && {
                                    right: arrowType === "preview-arrow" && hoverArrow === "right" ? 0 : 20,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }),
                                ...(arrowAlignment === "center" && {
                                    left: "50%",
                                    top: "50%",
                                    transform: "translate(-50%, -50%) translateX(28px)",
                                }),
                                ...(arrowAlignment === "bottom" && {
                                    left: "50%",
                                    bottom: 20,
                                    transform: "translateX(-50%) translateX(28px)",
                                }),
                                ...(arrowAlignment === "top" && {
                                    left: "50%",
                                    top: 20,
                                    transform: "translateX(-50%) translateX(28px)",
                                }),
                                ...(arrowAlignment === "bottom-left" && {
                                    left: arrowType === "preview-arrow" && hoverArrow === "right" ? 76 : 76,
                                    bottom: 20,
                                }),
                                ...(arrowAlignment === "bottom-right" && {
                                    right: arrowType === "preview-arrow" && hoverArrow === "right" ? 0 : 20,
                                    bottom: 20,
                                }),
                                ...(arrowAlignment === "top-left" && {
                                    left: arrowType === "preview-arrow" && hoverArrow === "right" ? 76 : 76,
                                    top: 20,
                                }),
                                ...(arrowAlignment === "top-right" && {
                                    right: arrowType === "preview-arrow" && hoverArrow === "right" ? 0 : 20,
                                    top: 20,
                                }),
                            } : {
                                right: arrowType === "preview-arrow" && hoverArrow === "right" ? 0 : 20,
                                top: "50%",
                                transform: "translateY(-50%)",
                            }),
                            width: arrowType === "preview-arrow" && hoverArrow === "right" ? "auto" : 48,
                            height: arrowType === "preview-arrow" && hoverArrow === "right" ? "auto" : 48,
                            borderRadius: arrowType === "preview-arrow" && hoverArrow === "right" ? "0px" : "50%",
                            backgroundColor: arrowType === "preview-arrow" && hoverArrow === "right" ? "transparent" : arrowBackgroundColor,
                            border: "none",
                            cursor: isLastImage ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            transition: "all 0.3s ease",
                            opacity: isLastImage ? 0.3 : 1,
                            padding: arrowType === "preview-arrow" && hoverArrow === "right" ? 0 : undefined,
                            ...(arrowType === "corner-ridge" && {
                                borderRadius: "0px",
                                backgroundColor: arrowBackgroundColor,
                            }),
                        }}
                        onMouseEnter={(e) => {
                            if (!isLastImage) {
                                e.currentTarget.style.opacity = "0.8"
                                startTransition(() => setHoverArrow("right"))
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLastImage) {
                                e.currentTarget.style.opacity = "1"
                                startTransition(() => setHoverArrow(null))
                            }
                        }}
                        aria-label="Next image"
                    >
                        <AnimatePresence mode="wait">
                            {renderArrowSVG("right")}
                        </AnimatePresence>
                    </button>
                </>
            )}

            {/* Custom Cursor Effects */}
            {cursor === "trail" && cursorTrail.map((point, index) => (
                <motion.div
                    key={point.id}
                    initial={{ opacity: 0.8, scale: 1 }}
                    animate={{ opacity: 0, scale: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{
                        position: "absolute",
                        left: point.x,
                        top: point.y,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "#FFFFFF",
                        pointerEvents: "none",
                        zIndex: 9999,
                        transform: "translate(-50%, -50%)",
                        mixBlendMode: "difference",
                    }}
                />
            ))}
            
            {cursor === "plus-ridge" && (
                <div
                    style={{
                        position: "absolute",
                        left: cursorPosition.x,
                        top: cursorPosition.y,
                        width: 32,
                        height: 32,
                        pointerEvents: "none",
                        zIndex: 9999,
                        transform: "translate(-50%, -50%)",
                    }}
                >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        {/* Corner ridges */}
                        <path d="M 2 2 L 2 8 M 2 2 L 8 2" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 30 2 L 30 8 M 30 2 L 24 2" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 2 30 L 2 24 M 2 30 L 8 30" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 30 30 L 30 24 M 30 30 L 24 30" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                        {/* Plus symbol */}
                        <line x1="16" y1="10" x2="16" y2="22" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="10" y1="16" x2="22" y2="16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
            )}
            
            {cursor === "circular-difference" && (
                <motion.div
                    animate={{
                        left: cursorPosition.x,
                        top: cursorPosition.y,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 28,
                        mass: 0.5,
                    }}
                    style={{
                        position: "absolute",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        backgroundColor: "#FFFFFF",
                        pointerEvents: "none",
                        zIndex: 9999,
                        transform: "translate(-50%, -50%)",
                        mixBlendMode: "difference",
                    }}
                />
            )}
            
            {cursor === "dot-ring" && (
                <>
                    <motion.div
                        animate={{
                            left: cursorPosition.x,
                            top: cursorPosition.y,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 1000,
                            damping: 40,
                            mass: 0.2,
                        }}
                        style={{
                            position: "absolute",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            border: "1px solid #FFFFFF",
                            pointerEvents: "none",
                            zIndex: 10000,
                            transform: "translate(-50%, -50%)",
                            mixBlendMode: "difference",
                        }}
                    />
                    <motion.div
                        animate={{
                            left: cursorPosition.x,
                            top: cursorPosition.y,
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                            mass: 0.8,
                        }}
                        style={{
                            position: "absolute",
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            border: "1px solid #FFFFFF",
                            pointerEvents: "none",
                            zIndex: 9999,
                            transform: "translate(-50%, -50%)",
                            mixBlendMode: "difference",
                        }}
                    />
                </>
            )}
            
            {cursor === "crosshair-minimal" && (
                <div
                    style={{
                        position: "absolute",
                        left: cursorPosition.x,
                        top: cursorPosition.y,
                        width: 24,
                        height: 24,
                        pointerEvents: "none",
                        zIndex: 9999,
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <line x1="12" y1="0" x2="12" y2="8" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
                        <line x1="12" y1="16" x2="12" y2="24" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
                        <line x1="0" y1="12" x2="8" y2="12" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
                        <line x1="16" y1="12" x2="24" y2="12" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="2" stroke="#FFFFFF" strokeWidth="1" fill="none" />
                    </svg>
                </div>
            )}
            
            {showDots && (
                <div
                    style={{
                        position: "absolute",
                        ...(indicatorPosition === "bottom" && {
                            bottom: 20,
                            left: "50%",
                            transform: "translateX(-50%)",
                            flexDirection: "row",
                        }),
                        ...(indicatorPosition === "top" && {
                            top: 20,
                            left: "50%",
                            transform: "translateX(-50%)",
                            flexDirection: "row",
                        }),
                        ...(indicatorPosition === "left" && {
                            left: 20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            flexDirection: "column",
                        }),
                        ...(indicatorPosition === "right" && {
                            right: 20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            flexDirection: "column",
                        }),
                        ...(indicatorPosition === "center" && {
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            flexDirection: "row",
                        }),
                        ...(indicatorPosition === "top-left" && {
                            top: 20,
                            left: 20,
                            flexDirection: "row",
                        }),
                        ...(indicatorPosition === "top-right" && {
                            top: 20,
                            right: 20,
                            flexDirection: "row",
                        }),
                        ...(indicatorPosition === "bottom-left" && {
                            bottom: 20,
                            left: 20,
                            flexDirection: "row",
                        }),
                        ...(indicatorPosition === "bottom-right" && {
                            bottom: 20,
                            right: 20,
                            flexDirection: "row",
                        }),
                        display: "flex",
                        gap: 8,
                        zIndex: 10,
                        alignItems: "center",
                    }}
                    role="tablist"
                    aria-label="Carousel navigation"
                >
                    {indicatorType === "number" ? (
                        <div
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: "50%",
                                border: "none",
                                padding: 0,
                                background: "transparent",
                                position: "relative",
                                transition: "all 0.3s ease",
                            }}
                            role="status"
                            aria-live="polite"
                            aria-label={`Image ${currentIndex + 1} of ${safeImages.length}`}
                        >
                            <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
                                <circle
                                    cx="30"
                                    cy="30"
                                    r="28"
                                    fill="none"
                                    stroke={dotColor}
                                    strokeWidth="2"
                                />
                                <circle
                                    cx="30"
                                    cy="30"
                                    r="28"
                                    fill="none"
                                    stroke={activeDotColor}
                                    strokeWidth="2"
                                    strokeDasharray={`${2 * Math.PI * 28}`}
                                    strokeDashoffset={2 * Math.PI * 28 * (1 - (currentIndex + 1) / safeImages.length)}
                                    strokeLinecap="round"
                                    style={{
                                        transition: "stroke-dashoffset 0.3s ease",
                                        transform: "rotate(-90deg)",
                                        transformOrigin: "center",
                                    }}
                                />
                                <text
                                    x="30"
                                    y="30"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fill={activeDotColor}
                                    fontSize="18"
                                    fontWeight="bold"
                                >
                                    {currentIndex + 1}
                                </text>
                            </svg>
                        </div>
                    ) : indicatorType === "number-only" ? (
                        <div
                            style={{
                                padding: "8px 16px",
                                background: "transparent",
                                position: "relative",
                                transition: "all 0.3s ease",
                            }}
                            role="status"
                            aria-live="polite"
                            aria-label={`Image ${currentIndex + 1} of ${safeImages.length}`}
                        >
                            <span
                                style={{
                                    color: activeDotColor,
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    letterSpacing: "-0.02em",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                ({String(currentIndex + 1).padStart(2, "0")})
                            </span>
                        </div>
                    ) : (
                        safeImages.map((_, index) => {
                            const isActive = index === currentIndex
                            const isPast = index < currentIndex
                            
                            if (indicatorType === "line") {
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleDotClick(index)}
                                        style={{
                                            width: isActive ? 40 : 24,
                                            height: 3,
                                            borderRadius: 2,
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0,
                                            background: isActive || isPast ? activeDotColor : dotColor,
                                            position: "relative",
                                            transition: "all 0.3s ease",
                                        }}
                                        role="tab"
                                        aria-label={`Go to image ${index + 1}`}
                                        aria-selected={isActive}
                                        aria-current={isActive ? "true" : "false"}
                                    />
                                )
                            }
                            
                            if (indicatorType === "story") {
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleDotClick(index)}
                                        style={{
                                            width: 40,
                                            height: 3,
                                            borderRadius: 2,
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0,
                                            background: dotColor,
                                            position: "relative",
                                            transition: "all 0.3s ease",
                                            overflow: "hidden",
                                        }}
                                        role="tab"
                                        aria-label={`Go to image ${index + 1}`}
                                        aria-selected={isActive}
                                        aria-current={isActive ? "true" : "false"}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                height: "100%",
                                                width: isPast ? "100%" : isActive ? `${progress}%` : "0%",
                                                background: activeDotColor,
                                                transition: isPast || !isActive ? "width 0.3s ease" : "none",
                                            }}
                                            aria-hidden="true"
                                        />
                                    </button>
                                )
                            }
                            
                            if (indicatorType === "dot") {
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleDotClick(index)}
                                        style={{
                                            width: isActive ? 12 : 8,
                                            height: isActive ? 12 : 8,
                                            borderRadius: "50%",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0,
                                            background: isActive ? activeDotColor : dotColor,
                                            position: "relative",
                                            transition: "all 0.3s ease",
                                        }}
                                        role="tab"
                                        aria-label={`Go to image ${index + 1}`}
                                        aria-selected={isActive}
                                        aria-current={isActive ? "true" : "false"}
                                    />
                                )
                            }
                            
                            return null
                        })
                    )}
                </div>
            )}
        </div>
    )
}

addPropertyControls(ImageCarousel, {
    images: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                text: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Beautiful Gradient",
                },
                subtext: {
                    type: ControlType.String,
                    title: "Subtext",
                    defaultValue: "Explore the colors",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/RFJhYigqt70ZSSmgzH9TrNgV1f8.jpeg",
                    alt: "Gradient 1 - Blue",
                },
                text: "Beautiful Gradient",
                subtext: "Explore the colors",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/oJKbUhedb3JNxAwx6lKRlf97w.jpeg",
                    alt: "Gradient 2 - Purple",
                },
                text: "Purple Dreams",
                subtext: "Vibrant and bold",
                link: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/wReVBGWLoqVLQP8oNLSLnrWBFI.jpeg",
                    alt: "Gradient 3 - Orange",
                },
                text: "Warm Sunset",
                subtext: "Feel the warmth",
                link: "",
            },
        ],
        maxCount: 10,
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        description: "Control how images transition and move",
        controls: {
            autoPlay: {
                type: ControlType.Enum,
                title: "Auto Play",
                options: ["manual", "autoplay", "autoplay-manual"],
                optionTitles: ["Manual", "Autoplay", "Autoplay + Manual"],
                defaultValue: "manual",
                displaySegmentedControl: false,
            },
            autoPlayInterval: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: 3000,
                min: 1000,
                max: 10000,
                step: 500,
                unit: "ms",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.6,
                min: 0.2,
                max: 2,
                step: 0.1,
                unit: "s",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 20,
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
            },
            imageTransition: {
                type: ControlType.Enum,
                title: "Transition",
                options: ["dissolve", "silk-wipe", "depth-fade", "lens-blur", "reveal-mask", "parallax-depth", "shimmer-dissolve", "cinematic-pan", "elegant-zoom", "spiral-reveal", "liquid-morph", "glitch-shift", "origami-fold", "kaleidoscope", "wave-distort", "pixel-dissolve", "curtain-rise", "book-flip", "zoom-blur", "cross-zoom"],
                optionTitles: ["Dissolve", "Silk Wipe", "Depth Fade", "Lens Blur", "Reveal Mask", "Parallax Depth", "Shimmer Dissolve", "Cinematic Pan", "Elegant Zoom", "Spiral Reveal", "Liquid Morph", "Glitch Shift", "Origami Fold", "Kaleidoscope", "Wave Distort", "Pixel Dissolve", "Curtain Rise", "Book Flip", "Zoom Blur", "Cross Zoom"],
                defaultValue: "reveal-mask",
                displaySegmentedControl: false,
            },
        },
    },
    text: {
        type: ControlType.Object,
        title: "Text",
        description: "Customize text appearance and animation",
        controls: {
            showText: {
                type: ControlType.Boolean,
                title: "Show Text",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                defaultValue: {
                    fontSize: "72px",
                    letterSpacing: "-0.02em",
                    lineHeight: "1.2em",
                },
                controls: "extended",
                defaultFontType: "sans-serif",
                hidden: ({ showText }) => !showText,
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#FFFFFF",
                hidden: ({ showText }) => !showText,
            },
            subtextFont: {
                type: ControlType.Font,
                title: "Subtext Font",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.4em",
                },
                controls: "extended",
                defaultFontType: "sans-serif",
                hidden: ({ showText }) => !showText,
            },
            subtextColor: {
                type: ControlType.Color,
                title: "Subtext Color",
                defaultValue: "rgba(255, 255, 255, 0.8)",
                hidden: ({ showText }) => !showText,
            },
            textPosition: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom", "top", "left", "right", "center", "top-left", "top-right", "bottom-left", "bottom-right"],
                optionTitles: ["Bottom", "Top", "Left", "Right", "Center", "Top Left", "Top Right", "Bottom Left", "Bottom Right"],
                defaultValue: "bottom-left",
                displaySegmentedControl: false,
                hidden: ({ showText }) => !showText,
            },
            textGap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
                hidden: ({ showText }) => !showText,
            },
            textTransition: {
                type: ControlType.Enum,
                title: "Transition",
                options: ["typewriter", "glitch", "wave", "neon", "liquid"],
                optionTitles: ["Typewriter", "Glitch", "Wave", "Neon", "Liquid"],
                defaultValue: "typewriter",
                displaySegmentedControl: false,
                hidden: ({ showText }) => !showText,
            },
            transitionDelay: {
                type: ControlType.Number,
                title: "Delay",
                defaultValue: 0.3,
                min: 0,
                max: 2,
                step: 0.1,
                unit: "s",
                hidden: ({ showText }) => !showText,
            },
            transitionDuration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.5,
                min: 0,
                max: 2,
                step: 0.1,
                unit: "s",
                hidden: ({ showText }) => !showText,
            },
            textPadding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "0px",
                hidden: ({ showText }) => !showText,
            },
            textWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 90,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                hidden: ({ showText }) => !showText,
            },
        },
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        description: "Add a clickable button to each slide",
        controls: {
            showButton: {
                type: ControlType.Boolean,
                title: "Show Button",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            buttonText: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "Learn More",
                hidden: ({ showButton }) => !showButton,
            },
            buttonFont: {
                type: ControlType.Font,
                title: "Font",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Semibold",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
                controls: "extended",
                defaultFontType: "sans-serif",
                hidden: ({ showButton }) => !showButton,
            },
            buttonTextColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
                hidden: ({ showButton }) => !showButton,
            },
            buttonBackgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#000000",
                hidden: ({ showButton }) => !showButton,
            },
            buttonBorderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 8,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
                hidden: ({ showButton }) => !showButton,
            },
            buttonBorderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#FFFFFF",
                hidden: ({ showButton }) => !showButton,
            },
            buttonBorderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: 0,
                min: 0,
                max: 10,
                step: 1,
                unit: "px",
                hidden: ({ showButton }) => !showButton,
            },
            buttonPaddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 24,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
                hidden: ({ showButton }) => !showButton,
            },
            buttonPaddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                defaultValue: 12,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
                hidden: ({ showButton }) => !showButton,
            },
            buttonPosition: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom", "top", "left", "right", "center", "top-left", "top-right", "bottom-left", "bottom-right"],
                optionTitles: ["Bottom", "Top", "Left", "Right", "Center", "Top Left", "Top Right", "Bottom Left", "Bottom Right"],
                defaultValue: "bottom-left",
                displaySegmentedControl: false,
                hidden: ({ showButton }) => !showButton,
            },
            buttonWidth: {
                type: ControlType.Enum,
                title: "Width",
                options: ["fit", "fill", "fixed"],
                optionTitles: ["Fit", "Fill", "Fixed"],
                defaultValue: "fit",
                displaySegmentedControl: true,
                hidden: ({ showButton }) => !showButton,
            },
            buttonFixedWidth: {
                type: ControlType.Number,
                title: "Fixed Width",
                defaultValue: 200,
                min: 50,
                max: 500,
                step: 10,
                unit: "px",
                hidden: ({ showButton }) => !showButton,
            },
        },
    },
    indicator: {
        type: ControlType.Object,
        title: "Indicator",
        description: "Navigation controls and progress indicators",
        controls: {
            showArrows: {
                type: ControlType.Boolean,
                title: "Arrow",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            arrowPosition: {
                type: ControlType.Enum,
                title: "Type",
                options: ["split", "together"],
                optionTitles: ["Split", "Together"],
                defaultValue: "split",
                displaySegmentedControl: true,
                hidden: ({ showArrows }) => !showArrows,
            },
            arrowAlignment: {
                type: ControlType.Enum,
                title: "Alignment",
                options: ["left", "right", "center", "bottom-left", "bottom-right", "top-left", "top-right", "top", "bottom"],
                optionTitles: ["Left", "Right", "Center", "Bottom Left", "Bottom Right", "Top Left", "Top Right", "Top", "Bottom"],
                defaultValue: "bottom-left",
                displaySegmentedControl: false,
                hidden: ({ showArrows, arrowPosition }) => !showArrows || arrowPosition !== "together",
            },
            arrowType: {
                type: ControlType.Enum,
                title: "Arrow Style",
                options: ["preview-arrow", "outline-arrow", "plus-minus", "corner-ridge", "text-arrows", "particle", "glitch", "long-arrow", "broken-arrow", "wave-arrow", "triangle"],
                optionTitles: ["Preview Arrow", "Outline Arrow", "Plus/Minus", "Corner Ridge", "Text Arrows", "Particle", "Glitch", "Long Arrow", "Broken Arrow", "Wave", "Triangle"],
                defaultValue: "preview-arrow",
                displaySegmentedControl: false,
                hidden: ({ showArrows }) => !showArrows,
            },
            arrowColor: {
                type: ControlType.Color,
                title: "Arrow Color",
                defaultValue: "#FFFFFF",
                hidden: ({ showArrows }) => !showArrows,
            },
            arrowBackgroundColor: {
                type: ControlType.Color,
                title: "Arrow BG",
                defaultValue: "rgba(0, 0, 0, 0.5)",
                hidden: ({ showArrows }) => !showArrows,
            },
            showDots: {
                type: ControlType.Boolean,
                title: "Indicator",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            indicatorType: {
                type: ControlType.Enum,
                title: "Style",
                options: ["line", "story", "number", "number-only", "dot"],
                optionTitles: ["Line", "Story", "Number", "Number Only", "Dot"],
                defaultValue: "number",
                displaySegmentedControl: false,
                hidden: ({ showDots }) => !showDots,
            },
            indicatorPosition: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom", "top", "left", "right", "center", "top-left", "top-right", "bottom-left", "bottom-right"],
                optionTitles: ["Bottom", "Top", "Left", "Right", "Center", "Top Left", "Top Right", "Bottom Left", "Bottom Right"],
                defaultValue: "center",
                displaySegmentedControl: false,
                hidden: ({ showDots }) => !showDots,
            },
            dotColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(255, 255, 255, 0.5)",
                hidden: ({ showDots }) => !showDots,
            },
            activeDotColor: {
                type: ControlType.Color,
                title: "Active Clr",
                defaultValue: "#FFFFFF",
                hidden: ({ showDots }) => !showDots,
            },
        },
    },
    effect: {
        type: ControlType.Object,
        title: "Effect",
        description: "Visual effects and overlays for images",
        controls: {
            overlayType: {
                type: ControlType.Enum,
                title: "Type",
                options: ["none", "gradient", "blur", "tint", "noise", "motion-blur", "gradient-blur", "gradient-tint", "blur-tint", "gradient-noise", "blur-noise", "tint-noise", "gradient-motion-blur", "blur-motion-blur", "tint-motion-blur", "noise-motion-blur", "all"],
                optionTitles: ["None", "Gradient", "Blur", "Tint", "Noise", "Motion Blur", "Gradient + Blur", "Gradient + Tint", "Blur + Tint", "Gradient + Noise", "Blur + Noise", "Tint + Noise", "Gradient + Motion", "Blur + Motion", "Tint + Motion", "Noise + Motion", "All"],
                defaultValue: "none",
                displaySegmentedControl: false,
            },
            gradientDirection: {
                type: ControlType.Enum,
                title: "Gradient Direction",
                options: ["top", "bottom", "left", "right", "radial"],
                optionTitles: ["Top", "Bottom", "Left", "Right", "Radial"],
                defaultValue: "bottom",
                displaySegmentedControl: false,
                hidden: ({ overlayType }) => !overlayType || overlayType === "none" || (!overlayType.includes("gradient") && overlayType !== "all"),
            },
            gradientColor: {
                type: ControlType.Color,
                title: "Gradient Color",
                defaultValue: "#000000",
                hidden: ({ overlayType }) => !overlayType || overlayType === "none" || (!overlayType.includes("gradient") && overlayType !== "all"),
            },
            gradientOpacity: {
                type: ControlType.Number,
                title: "Gradient Opacity",
                defaultValue: 0.5,
                min: 0,
                max: 1,
                step: 0.1,
                hidden: ({ overlayType }) => !overlayType || overlayType === "none" || (!overlayType.includes("gradient") && overlayType !== "all"),
            },
            blurAmount: {
                type: ControlType.Number,
                title: "Blur Intensity",
                defaultValue: 0,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
                hidden: ({ overlayType }) => !overlayType || overlayType === "none" || (!overlayType.includes("blur") && overlayType !== "all" && overlayType !== "motion-blur"),
            },
            tintColor: {
                type: ControlType.Color,
                title: "Tint Color",
                defaultValue: "#000000",
                hidden: ({ overlayType }) => !overlayType || overlayType === "none" || (!overlayType.includes("tint") && overlayType !== "all"),
            },
            tintOpacity: {
                type: ControlType.Number,
                title: "Tint Opacity",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.1,
                hidden: ({ overlayType }) => !overlayType || overlayType === "none" || (!overlayType.includes("tint") && overlayType !== "all"),
            },
            noiseIntensity: {
                type: ControlType.Number,
                title: "Noise Intensity",
                defaultValue: 0.5,
                min: 0,
                max: 1,
                step: 0.1,
                hidden: ({ overlayType }) => !overlayType || overlayType === "none" || (!overlayType.includes("noise") && overlayType !== "all"),
            },
            motionBlurIntensity: {
                type: ControlType.Number,
                title: "Motion Blur Intensity",
                defaultValue: 10,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                hidden: ({ overlayType }) => !overlayType || overlayType === "none" || (!overlayType.includes("motion-blur") && overlayType !== "all"),
            },
        },
    },
    cursor: {
        type: ControlType.Enum,
        title: "Cursor",
        description: "Choose a cursor style for editorial and luxury feel",
        options: ["trail", "plus-ridge", "circular-difference", "dot-ring", "crosshair-minimal", "default", "crosshair", "zoom-in", "grab", "none"],
        optionTitles: ["Trail", "Plus Ridge", "Circular Difference", "Dot Ring", "Crosshair Minimal", "Default", "Crosshair", "Zoom In", "Grab", "None"],
        defaultValue: "crosshair-minimal",
        displaySegmentedControl: false,
    },
})

ImageCarousel.displayName = "IMG Carousel"