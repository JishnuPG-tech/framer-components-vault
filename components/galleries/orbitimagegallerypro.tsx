// Orbit Image Gallery - 3D rotating image ring with drag, scroll, and auto-rotation
import {
    useEffect,
    useRef,
    useState,
    useCallback,
    startTransition,
    type CSSProperties,
    type TouchEvent,
    type PointerEvent,
    type WheelEvent,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useAnimation } from "framer-motion"

interface ImageItem {
    image: { src: string; alt?: string }
    label: string
    link: string
}

interface OrbitImageGalleryProps {
    images: ImageItem[]
    ringRadius: number
    cardWidth: number
    cardHeight: number
    tiltAngle: number
    perspective: number
    cardGap: number
    autoRotate: boolean
    autoRotateSpeed: number
    autoRotateDirection: "clockwise" | "counterclockwise"
    snapEnabled: boolean
    snapDuration: number
    snapEasing: "easeOut" | "easeInOut" | "spring" | "linear"
    dragSensitivity: number
    cardBorderRadius: number
    cardShadow: boolean
    cardShadowColor: string
    cardShadowBlur: number
    cardOverlayEnabled: boolean
    cardOverlayColor: string
    cardActiveScale: number
    cardInactiveOpacity: number
    showLabels: boolean
    labelPosition: "bottom-inside" | "bottom-outside" | "top-inside" | "overlay-center"
    labelFontSize: number
    labelFontWeight: "400" | "500" | "600" | "700"
    labelColor: string
    labelBackground: string
    labelPadding: number
    brandName: string
    brandFontSize: number
    brandColor: string
    brandPosition: "top-left" | "top-center" | "top-right" | "bottom-center"
    backgroundColor: string
    showBackground: boolean
    backgroundBlur: number
    showArrows: boolean
    arrowSize: number
    arrowColor: string
    arrowBackgroundColor: string
    arrowPosition: "sides" | "bottom"
    style?: CSSProperties
}

/**
 * Orbit Image Gallery
 * 
 * A stunning 3D rotating image ring gallery with drag, scroll, and auto-rotation.
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function OrbitImageGallery(props: OrbitImageGalleryProps) {
    const {
        images = [],
        ringRadius = 320,
        cardWidth = 220,
        cardHeight = 300,
        tiltAngle = -8,
        perspective = 900,
        cardGap = 0,
        autoRotate = true,
        autoRotateSpeed = 0.4,
        autoRotateDirection = "clockwise",
        snapEnabled = true,
        snapDuration = 0.6,
        snapEasing = "easeOut",
        dragSensitivity = 1,
        cardBorderRadius = 16,
        cardShadow = true,
        cardShadowColor = "rgba(0,0,0,0.4)",
        cardShadowBlur = 32,
        cardOverlayEnabled = true,
        cardOverlayColor = "rgba(0,0,0,0.35)",
        cardActiveScale = 1.08,
        cardInactiveOpacity = 0.72,
        showLabels = true,
        labelPosition = "bottom-inside",
        labelFontSize = 14,
        labelFontWeight = "600",
        labelColor = "#ffffff",
        labelBackground = "rgba(0,0,0,0.5)",
        labelPadding = 8,
        brandName = "",
        brandFontSize = 18,
        brandColor = "#ffffff",
        brandPosition = "top-left",
        backgroundColor = "transparent",
        showBackground = false,
        backgroundBlur = 0,
        showArrows = true,
        arrowSize = 48,
        arrowColor = "#ffffff",
        arrowBackgroundColor = "rgba(0,0,0,0.5)",
        arrowPosition = "sides",
    } = props

    const [isDragging, setIsDragging] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const [isMobile, setIsMobile] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [isInViewport, setIsInViewport] = useState(true)
    const observerRef = useRef<HTMLDivElement>(null)
    const dragStartRef = useRef({ x: 0, y: 0, rotation: 0 })
    const dragDistanceRef = useRef(0)
    const touchStartRef = useRef({ x: 0, y: 0, time: 0 })
    const autoRotateFrameRef = useRef<number>()
    const wheelSnapTimeoutRef = useRef<number>()
    const snapResumeTimeoutRef = useRef<number>()
    const interactionResetTimeoutRef = useRef<number>()
    const rotationRef = useRef(0)
    const lastActiveUpdateRef = useRef(0)
    const lastInteractionRef = useRef<number>(0)
    const controls = useAnimation()
    const isStatic = useIsStaticRenderer()

    const imageCount = Math.min(images.length, 20)
    const angleStep = imageCount > 0 ? 360 / imageCount : 0

    // Detect mobile and set responsive values
    useEffect(() => {
        const checkMobile = () => {
            const mobile = typeof window !== "undefined" && (
                window.innerWidth < 768 || 
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            )
            startTransition(() => setIsMobile(mobile))
        }
        
        checkMobile()
        if (typeof window !== "undefined") {
            window.addEventListener("resize", checkMobile)
            return () => window.removeEventListener("resize", checkMobile)
        }
    }, [])

    // Initialize component and sync initial rotation into framer-motion
    useEffect(() => {
        startTransition(() => setIsInitialized(true))
        if (!isStatic) controls.set({ rotateY: rotationRef.current })
    }, [controls, isStatic])

    // Viewport visibility detection using IntersectionObserver
    useEffect(() => {
        if (isStatic || !observerRef.current) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    startTransition(() => setIsInViewport(entry.isIntersecting))
                })
            },
            { threshold: 0.1 }
        )

        observer.observe(observerRef.current)

        return () => {
            observer.disconnect()
        }
    }, [isStatic])

    // Responsive values based on mobile detection
    const responsiveRingRadius = isMobile ? Math.min(ringRadius * 0.5, 180) : ringRadius
    const responsiveCardWidth = isMobile ? Math.min(cardWidth * 0.65, 150) : cardWidth
    const responsiveCardHeight = isMobile ? Math.min(cardHeight * 0.65, 200) : cardHeight
    const responsivePerspective = isMobile ? Math.min(perspective * 0.7, 600) : perspective
    const responsiveTiltAngle = isMobile ? tiltAngle * 0.5 : tiltAngle

    // Auto-rotation loop (RAF + framer-motion controls; avoids re-render per frame)
    useEffect(() => {
        // Skip auto-rotation during static rendering
        if (isStatic) {
            return
        }

        if (!autoRotate || !isInitialized || imageCount === 0 || !isInViewport) {
            if (autoRotateFrameRef.current) {
                cancelAnimationFrame(autoRotateFrameRef.current)
                autoRotateFrameRef.current = undefined
            }
            return
        }

        // Only pause auto-rotation if actively dragging or very recently interacted
        const now = Date.now()
        const timeSinceInteraction = now - lastInteractionRef.current
        const shouldPause = isDragging || timeSinceInteraction < 120

        if (shouldPause) {
            if (autoRotateFrameRef.current) {
                cancelAnimationFrame(autoRotateFrameRef.current)
                autoRotateFrameRef.current = undefined
            }
            return
        }

        const tick = () => {
            const direction = autoRotateDirection === "clockwise" ? 1 : -1
            const next = rotationRef.current + autoRotateSpeed * direction
            rotationRef.current = next
            controls.set({ rotateY: next })

            const t = Date.now()
            if (t - lastActiveUpdateRef.current > 60) {
                lastActiveUpdateRef.current = t
                const adjustedAngleStep = angleStep + cardGap
                if (adjustedAngleStep > 0) {
                    const normalized = ((next % 360) + 360) % 360
                    const idx = Math.round(normalized / adjustedAngleStep) % imageCount
                    startTransition(() => setActiveIndex(idx))
                }
            }

            autoRotateFrameRef.current = requestAnimationFrame(tick)
        }

        if (!autoRotateFrameRef.current) {
            autoRotateFrameRef.current = requestAnimationFrame(tick)
        }

        return () => {
            if (autoRotateFrameRef.current) {
                cancelAnimationFrame(autoRotateFrameRef.current)
                autoRotateFrameRef.current = undefined
            }
        }
    }, [autoRotate, isDragging, autoRotateSpeed, autoRotateDirection, imageCount, isInitialized, isInViewport, isStatic, controls, angleStep, cardGap])

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (autoRotateFrameRef.current) {
                cancelAnimationFrame(autoRotateFrameRef.current)
                autoRotateFrameRef.current = undefined
            }
            if (wheelSnapTimeoutRef.current) {
                clearTimeout(wheelSnapTimeoutRef.current)
                wheelSnapTimeoutRef.current = undefined
            }
            if (snapResumeTimeoutRef.current) {
                clearTimeout(snapResumeTimeoutRef.current)
                snapResumeTimeoutRef.current = undefined
            }
            if (interactionResetTimeoutRef.current) {
                clearTimeout(interactionResetTimeoutRef.current)
                interactionResetTimeoutRef.current = undefined
            }
        }
    }, [])

    // Snap to nearest card
    const snapToNearest = useCallback(() => {
        if (!snapEnabled || imageCount === 0) return

        lastInteractionRef.current = Date.now()

        const adjustedAngleStep = angleStep + cardGap
        const currentRotation = rotationRef.current
        const normalizedRotation = ((currentRotation % 360) + 360) % 360
        const nearestIndex = imageCount > 0 ? Math.round(normalizedRotation / adjustedAngleStep) % imageCount : 0
        const targetRotation = nearestIndex * adjustedAngleStep

        if (snapEasing === "spring") {
            controls.start({
                rotateY: targetRotation,
                transition: {
                    type: "spring",
                    stiffness: 100,
                    damping: 20,
                    duration: snapDuration,
                },
            })
        } else {
            controls.start({
                rotateY: targetRotation,
                transition: {
                    duration: snapDuration,
                    ease: snapEasing,
                },
            })
        }

        rotationRef.current = targetRotation
        startTransition(() => setActiveIndex(nearestIndex))

        // Clear any existing timeout
        if (snapResumeTimeoutRef.current) {
            clearTimeout(snapResumeTimeoutRef.current)
            snapResumeTimeoutRef.current = undefined
        }

        // Allow auto-rotation to resume after snap completes
        if (typeof window !== "undefined") {
            snapResumeTimeoutRef.current = window.setTimeout(() => {
                lastInteractionRef.current = 0
                snapResumeTimeoutRef.current = undefined
            }, snapDuration * 1000 + 100)
        }
    }, [snapEnabled, angleStep, cardGap, snapDuration, snapEasing, controls, imageCount])

    // Touch handlers for mobile
    const handleTouchStart = useCallback(
        (e: TouchEvent<HTMLDivElement>) => {
            if (e.touches.length !== 1) return
            
            const touch = e.touches[0]
            lastInteractionRef.current = Date.now()
            startTransition(() => setIsDragging(true))
            dragDistanceRef.current = 0
            touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now(),
            }
            dragStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
                rotation: rotationRef.current,
            }
        },
        [rotationRef]
    )

    const handleTouchMove = useCallback(
        (e: TouchEvent<HTMLDivElement>) => {
            if (!isDragging || e.touches.length !== 1) return
            
            e.preventDefault() // Prevent scrolling while dragging
            
            lastInteractionRef.current = Date.now()
            const touch = e.touches[0]
            const deltaX = touch.clientX - dragStartRef.current.x
            const deltaY = touch.clientY - dragStartRef.current.y
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            
            dragDistanceRef.current = distance

            // Increased sensitivity for mobile
            const mobileSensitivity = dragSensitivity * 1.5
            const rotationDelta = deltaX * mobileSensitivity * 0.5
            const newRotation = dragStartRef.current.rotation + rotationDelta

            rotationRef.current = newRotation
            controls.set({ rotateY: newRotation })

            const t = Date.now()
            if (t - lastActiveUpdateRef.current > 50) {
                lastActiveUpdateRef.current = t
                const adjustedAngleStep = angleStep + cardGap
                if (adjustedAngleStep > 0 && imageCount > 0) {
                    const normalized = ((newRotation % 360) + 360) % 360
                    const idx = Math.round(normalized / adjustedAngleStep) % imageCount
                    startTransition(() => setActiveIndex(idx))
                }
            }
        },
        [isDragging, dragSensitivity]
    )

    const handleTouchEnd = useCallback(
        (e: TouchEvent<HTMLDivElement>) => {
            if (!isDragging) return
            
            const wasDragged = dragDistanceRef.current > 5
            const touchDuration = Date.now() - touchStartRef.current.time
            
            startTransition(() => setIsDragging(false))
            
            if (wasDragged) {
                snapToNearest()
            } else {
                // Reset interaction timer if it was just a tap
                if (interactionResetTimeoutRef.current) {
                    clearTimeout(interactionResetTimeoutRef.current)
                    interactionResetTimeoutRef.current = undefined
                }
                if (typeof window !== "undefined") {
                    interactionResetTimeoutRef.current = window.setTimeout(() => {
                        lastInteractionRef.current = 0
                        interactionResetTimeoutRef.current = undefined
                    }, 100)
                }
            }
        },
        [isDragging, snapToNearest]
    )

    // Pointer drag handlers
    const handlePointerDown = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            // Skip if touch event (handled separately)
            if (e.pointerType === "touch") return
            
            lastInteractionRef.current = Date.now()
            startTransition(() => setIsDragging(true))
            dragDistanceRef.current = 0
            dragStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                rotation: rotationRef.current,
            }
            e.currentTarget.setPointerCapture(e.pointerId)
        },
        [rotationRef]
    )

    const handlePointerMove = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            // Skip if touch event (handled separately)
            if (e.pointerType === "touch") return
            if (!isDragging) return

            lastInteractionRef.current = Date.now()
            const deltaX = e.clientX - dragStartRef.current.x
            const deltaY = e.clientY - dragStartRef.current.y
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            
            dragDistanceRef.current = distance

            const rotationDelta = deltaX * dragSensitivity * 0.5
            const newRotation = dragStartRef.current.rotation + rotationDelta

            rotationRef.current = newRotation
            controls.set({ rotateY: newRotation })

            const t = Date.now()
            if (t - lastActiveUpdateRef.current > 50) {
                lastActiveUpdateRef.current = t
                const adjustedAngleStep = angleStep + cardGap
                if (adjustedAngleStep > 0 && imageCount > 0) {
                    const normalized = ((newRotation % 360) + 360) % 360
                    const idx = Math.round(normalized / adjustedAngleStep) % imageCount
                    startTransition(() => setActiveIndex(idx))
                }
            }
        },
        [isDragging, dragSensitivity]
    )

    const handlePointerUp = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            // Skip if touch event (handled separately)
            if (e.pointerType === "touch") return
            if (!isDragging) return
            
            const wasDragged = dragDistanceRef.current > 5
            startTransition(() => setIsDragging(false))
            e.currentTarget.releasePointerCapture(e.pointerId)
            
            if (wasDragged) {
                snapToNearest()
            } else {
                // Reset interaction timer if it was just a click
                if (interactionResetTimeoutRef.current) {
                    clearTimeout(interactionResetTimeoutRef.current)
                    interactionResetTimeoutRef.current = undefined
                }
                if (typeof window !== "undefined") {
                    interactionResetTimeoutRef.current = window.setTimeout(() => {
                        lastInteractionRef.current = 0
                        interactionResetTimeoutRef.current = undefined
                    }, 100)
                }
            }
        },
        [isDragging, snapToNearest]
    )

    // Wheel scroll handler
    const handleWheel = useCallback(
        (e: WheelEvent<HTMLDivElement>) => {
            e.preventDefault()
            lastInteractionRef.current = Date.now()
            const delta = e.deltaY * dragSensitivity * 0.1
            const next = rotationRef.current + delta
            rotationRef.current = next
            controls.set({ rotateY: next })

            // Debounced snap
            if (snapEnabled) {
                if (wheelSnapTimeoutRef.current) {
                    clearTimeout(wheelSnapTimeoutRef.current)
                    wheelSnapTimeoutRef.current = undefined
                }
                wheelSnapTimeoutRef.current = window.setTimeout(() => {
                    snapToNearest()
                    wheelSnapTimeoutRef.current = undefined
                }, 150)
            }
        },
        [dragSensitivity, snapEnabled, snapToNearest, controls]
    )

    // Navigate to next/previous card
    const navigateToCard = useCallback(
        (direction: "next" | "prev") => {
            lastInteractionRef.current = Date.now()
            
            const adjustedAngleStep = angleStep + cardGap
            const step = direction === "next" ? adjustedAngleStep : -adjustedAngleStep
            const targetRotation = rotationRef.current + step

            if (snapEasing === "spring") {
                controls.start({
                    rotateY: targetRotation,
                    transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        duration: snapDuration,
                    },
                })
            } else {
                controls.start({
                    rotateY: targetRotation,
                    transition: {
                        duration: snapDuration,
                        ease: snapEasing,
                    },
                })
            }

            rotationRef.current = targetRotation

            const normalized = ((targetRotation % 360) + 360) % 360
            const idx = Math.round(normalized / adjustedAngleStep) % imageCount
            startTransition(() => setActiveIndex(idx))

            // Clear any existing timeout
            if (snapResumeTimeoutRef.current) {
                clearTimeout(snapResumeTimeoutRef.current)
                snapResumeTimeoutRef.current = undefined
            }

            // Allow auto-rotation to resume after navigation completes
            if (typeof window !== "undefined") {
                snapResumeTimeoutRef.current = window.setTimeout(() => {
                    lastInteractionRef.current = 0
                    snapResumeTimeoutRef.current = undefined
                }, snapDuration * 1000 + 100)
            }
        },
        [angleStep, cardGap, snapDuration, snapEasing, controls, imageCount]
    )

    // Calculate card transform and opacity
    const getCardStyle = (index: number): CSSProperties => {
        const adjustedAngleStep = angleStep + cardGap
        const angle = index * adjustedAngleStep

        const rawDistance = Math.abs(index - activeIndex)
        const distance = Math.min(rawDistance, imageCount - rawDistance)
        const scale = distance === 0 ? cardActiveScale : 1
        const opacity = distance <= 1 ? 1 : cardInactiveOpacity

        return {
            position: "absolute",
            width: responsiveCardWidth,
            height: responsiveCardHeight,
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${responsiveRingRadius}px) scale(${scale})`,
            opacity,
            transition: isDragging ? "none" : "transform 0.3s ease-out, opacity 0.3s ease-out",
            borderRadius: cardBorderRadius,
            overflow: "hidden",
            boxShadow: cardShadow ? `0 ${cardShadowBlur / 2}px ${cardShadowBlur}px ${cardShadowColor}` : "none",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden", // Better mobile support
        }
    }

    // Label positioning
    const getLabelStyle = (): CSSProperties => {
        const baseStyle: CSSProperties = {
            padding: labelPadding,
            fontSize: labelFontSize,
            fontWeight: labelFontWeight,
            color: labelColor,
            background: labelBackground,
            textAlign: "center",
            width: "100%",
        }

        switch (labelPosition) {
            case "bottom-inside":
                return { ...baseStyle, position: "absolute", bottom: 0, left: 0 }
            case "bottom-outside":
                return {
                    ...baseStyle,
                    position: "absolute",
                    bottom: -labelFontSize - labelPadding * 2 - 4,
                    left: 0,
                    background: "transparent",
                }
            case "top-inside":
                return { ...baseStyle, position: "absolute", top: 0, left: 0 }
            case "overlay-center":
                return {
                    ...baseStyle,
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "auto",
                    borderRadius: 4,
                }
            default:
                return baseStyle
        }
    }

    // Brand positioning
    const getBrandStyle = (): CSSProperties => {
        const baseStyle: CSSProperties = {
            position: "absolute",
            fontSize: isMobile ? brandFontSize * 0.8 : brandFontSize,
            fontWeight: "700",
            color: brandColor,
            zIndex: 100,
            padding: isMobile ? 12 : 20,
            pointerEvents: "none",
        }

        switch (brandPosition) {
            case "top-left":
                return { ...baseStyle, top: 0, left: 0 }
            case "top-center":
                return { ...baseStyle, top: 0, left: "50%", transform: "translateX(-50%)" }
            case "top-right":
                return { ...baseStyle, top: 0, right: 0 }
            case "bottom-center":
                return { ...baseStyle, bottom: 0, left: "50%", transform: "translateX(-50%)" }
            default:
                return baseStyle
        }
    }

    if (imageCount === 0) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: showBackground ? backgroundColor : "transparent",
                    color: "#999",
                    fontSize: isMobile ? 14 : 16,
                    padding: 20,
                    textAlign: "center",
                }}
            >
                Add images to create the orbit gallery
            </div>
        )
    }

    return (
        <div
            ref={observerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: showBackground ? backgroundColor : "transparent",
                backdropFilter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : "none",
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none", // Prevent default touch behaviors
                WebkitUserSelect: "none",
                userSelect: "none",
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onWheel={handleWheel}
            onMouseEnter={undefined}
            onMouseLeave={undefined}
        >
            {/* Brand Name */}
            {brandName && <div style={getBrandStyle()}>{brandName}</div>}

            {/* Navigation Arrows */}
            {showArrows && imageCount > 1 && (
                <>
                    {arrowPosition === "sides" ? (
                        <>
                            {/* Left Arrow */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigateToCard("prev")
                                }}
                                style={{
                                    position: "absolute",
                                    left: isMobile ? 10 : 20,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: isMobile ? arrowSize * 0.7 : arrowSize,
                                    height: isMobile ? arrowSize * 0.7 : arrowSize,
                                    borderRadius: "50%",
                                    background: arrowBackgroundColor,
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 100,
                                    transition: "transform 0.2s ease, opacity 0.2s ease",
                                    opacity: 0.9,
                                    backdropFilter: "blur(10px)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                                    e.currentTarget.style.opacity = "1"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                                    e.currentTarget.style.opacity = "0.9"
                                }}
                                aria-label="Previous image"
                            >
                                <svg
                                    width={isMobile ? arrowSize * 0.4 : arrowSize * 0.5}
                                    height={isMobile ? arrowSize * 0.4 : arrowSize * 0.5}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={arrowColor}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>

                            {/* Right Arrow */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigateToCard("next")
                                }}
                                style={{
                                    position: "absolute",
                                    right: isMobile ? 10 : 20,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: isMobile ? arrowSize * 0.7 : arrowSize,
                                    height: isMobile ? arrowSize * 0.7 : arrowSize,
                                    borderRadius: "50%",
                                    background: arrowBackgroundColor,
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 100,
                                    transition: "transform 0.2s ease, opacity 0.2s ease",
                                    opacity: 0.9,
                                    backdropFilter: "blur(10px)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-50%) scale(1.1)"
                                    e.currentTarget.style.opacity = "1"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(-50%) scale(1)"
                                    e.currentTarget.style.opacity = "0.9"
                                }}
                                aria-label="Next image"
                            >
                                <svg
                                    width={isMobile ? arrowSize * 0.4 : arrowSize * 0.5}
                                    height={isMobile ? arrowSize * 0.4 : arrowSize * 0.5}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={arrowColor}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <div
                            style={{
                                position: "absolute",
                                bottom: isMobile ? 15 : 30,
                                left: "50%",
                                transform: "translateX(-50%)",
                                display: "flex",
                                gap: isMobile ? 12 : 16,
                                zIndex: 100,
                            }}
                        >
                            {/* Left Arrow */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigateToCard("prev")
                                }}
                                style={{
                                    width: isMobile ? arrowSize * 0.7 : arrowSize,
                                    height: isMobile ? arrowSize * 0.7 : arrowSize,
                                    borderRadius: "50%",
                                    background: arrowBackgroundColor,
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "transform 0.2s ease, opacity 0.2s ease",
                                    opacity: 0.9,
                                    backdropFilter: "blur(10px)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.1)"
                                    e.currentTarget.style.opacity = "1"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)"
                                    e.currentTarget.style.opacity = "0.9"
                                }}
                                aria-label="Previous image"
                            >
                                <svg
                                    width={isMobile ? arrowSize * 0.4 : arrowSize * 0.5}
                                    height={isMobile ? arrowSize * 0.4 : arrowSize * 0.5}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={arrowColor}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>

                            {/* Right Arrow */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigateToCard("next")
                                }}
                                style={{
                                    width: isMobile ? arrowSize * 0.7 : arrowSize,
                                    height: isMobile ? arrowSize * 0.7 : arrowSize,
                                    borderRadius: "50%",
                                    background: arrowBackgroundColor,
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "transform 0.2s ease, opacity 0.2s ease",
                                    opacity: 0.9,
                                    backdropFilter: "blur(10px)",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.1)"
                                    e.currentTarget.style.opacity = "1"
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)"
                                    e.currentTarget.style.opacity = "0.9"
                                }}
                                aria-label="Next image"
                            >
                                <svg
                                    width={isMobile ? arrowSize * 0.4 : arrowSize * 0.5}
                                    height={isMobile ? arrowSize * 0.4 : arrowSize * 0.5}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={arrowColor}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* 3D Ring Container */}
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    perspective: `${responsivePerspective}px`,
                    perspectiveOrigin: "50% 50%",
                }}
            >
                <motion.div
                    animate={isStatic ? undefined : controls}
                    initial={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        transformStyle: "preserve-3d",
                        rotateX: responsiveTiltAngle,
                        rotateY: isStatic ? 0 : undefined,
                    }}
                >
                    {images.slice(0, 20).map((item, index) => {
                        const imageData =
                            item.image && item.image.src
                                ? item.image
                                : {
                                      src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                                      alt: "Default image",
                                  }

                        return (
                            <div key={index} style={getCardStyle(index)}>
                                <a
                                    href={item.link || "#"}
                                    target={item.link && item.link !== "#" ? "_blank" : undefined}
                                    rel={item.link && item.link !== "#" ? "noopener noreferrer" : undefined}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        position: "relative",
                                        textDecoration: "none",
                                        pointerEvents: "auto",
                                    }}
                                    onClick={(e) => {
                                        // Prevent navigation if user dragged more than 5 pixels
                                        if (dragDistanceRef.current > 5) {
                                            e.preventDefault()
                                            return
                                        }
                                        
                                        // Prevent navigation if no valid link
                                        if (!item.link || item.link === "#") {
                                            e.preventDefault()
                                        }
                                    }}
                                    onTouchStart={(e) => {
                                        // Allow touch to propagate for drag detection
                                        e.stopPropagation()
                                    }}
                                >
                                    <img
                                        src={imageData.src}
                                        alt={imageData.alt || item.label || `Image ${index + 1}`}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            pointerEvents: "none", // Prevent image drag
                                        }}
                                        draggable={false}
                                    />
                                    {cardOverlayEnabled && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                background: cardOverlayColor,
                                                pointerEvents: "none",
                                            }}
                                        />
                                    )}
                                    {showLabels && item.label && <div style={getLabelStyle()}>{item.label}</div>}
                                </a>
                            </div>
                        )
                    })}
                </motion.div>
            </div>
        </div>
    )
}

addPropertyControls(OrbitImageGallery, {
    // Images
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Image",
                },
                link: {
                    type: ControlType.String,
                    title: "Link URL",
                    defaultValue: "https://framer.link/dulaj80",
                    placeholder: "https://...",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 1",
                },
                label: "Gradient Blue",
                link: "https://framer.link/dulaj80",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 2",
                },
                label: "Gradient Purple",
                link: "https://framer.link/dulaj80",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 3",
                },
                label: "Gradient Orange",
                link: "https://framer.link/dulaj80",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Image 4",
                },
                label: "Gradient Yellow",
                link: "https://framer.link/dulaj80",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Image 5",
                },
                label: "Gradient Green",
                link: "https://framer.link/dulaj80",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 6",
                },
                label: "Gradient Blue",
                link: "https://framer.link/dulaj80",
            },
        ],
        maxCount: 20,
    },

    // Ring Layout
    ringRadius: {
        type: ControlType.Number,
        title: "Ring Radius",
        defaultValue: 320,
        min: 100,
        max: 800,
        step: 10,
        displayStepper: true,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 220,
        min: 100,
        max: 600,
        step: 10,
        displayStepper: true,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 300,
        min: 100,
        max: 700,
        step: 10,
        displayStepper: true,
    },
    tiltAngle: {
        type: ControlType.Number,
        title: "Tilt Angle",
        defaultValue: -8,
        min: -45,
        max: 45,
        step: 1,
        unit: "°",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 900,
        min: 300,
        max: 2000,
        step: 50,
        displayStepper: true,
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "°",
    },

    // Animation
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoRotateSpeed: {
        type: ControlType.Number,
        title: "Rotate Speed",
        defaultValue: 0.4,
        min: 0.1,
        max: 5,
        step: 0.1,
        hidden: (props) => !props.autoRotate,
    },
    autoRotateDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Counter-clockwise"],
        defaultValue: "clockwise",
        hidden: (props) => !props.autoRotate,
    },
    snapEnabled: {
        type: ControlType.Boolean,
        title: "Snap to Card",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    snapDuration: {
        type: ControlType.Number,
        title: "Snap Duration",
        defaultValue: 0.6,
        min: 0.2,
        max: 1.5,
        step: 0.1,
        unit: "s",
        hidden: (props) => !props.snapEnabled,
    },
    snapEasing: {
        type: ControlType.Enum,
        title: "Snap Easing",
        options: ["easeOut", "easeInOut", "spring", "linear"],
        optionTitles: ["Ease Out", "Ease In Out", "Spring", "Linear"],
        defaultValue: "easeOut",
        hidden: (props) => !props.snapEnabled,
    },
    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Sensitivity",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },

    // Card Style
    cardBorderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cardShadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.4)",
        hidden: (props) => !props.cardShadow,
    },
    cardShadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 32,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        hidden: (props) => !props.cardShadow,
    },
    cardOverlayEnabled: {
        type: ControlType.Boolean,
        title: "Overlay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cardOverlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "rgba(0,0,0,0.35)",
        hidden: (props) => !props.cardOverlayEnabled,
    },
    cardActiveScale: {
        type: ControlType.Number,
        title: "Active Scale",
        defaultValue: 1.08,
        min: 1.0,
        max: 1.3,
        step: 0.01,
    },
    cardInactiveOpacity: {
        type: ControlType.Number,
        title: "Inactive Opacity",
        defaultValue: 0.72,
        min: 0.3,
        max: 1.0,
        step: 0.01,
    },

    // Label & Text
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    labelPosition: {
        type: ControlType.Enum,
        title: "Label Position",
        options: ["bottom-inside", "bottom-outside", "top-inside", "overlay-center"],
        optionTitles: ["Bottom Inside", "Bottom Outside", "Top Inside", "Overlay Center"],
        defaultValue: "bottom-inside",
        hidden: (props) => !props.showLabels,
    },
    labelFontSize: {
        type: ControlType.Number,
        title: "Label Font Size",
        defaultValue: 14,
        min: 10,
        max: 32,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showLabels,
    },
    labelFontWeight: {
        type: ControlType.Enum,
        title: "Label Weight",
        options: ["400", "500", "600", "700"],
        optionTitles: ["Regular", "Medium", "Semibold", "Bold"],
        defaultValue: "600",
        hidden: (props) => !props.showLabels,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#ffffff",
        hidden: (props) => !props.showLabels,
    },
    labelBackground: {
        type: ControlType.Color,
        title: "Label Background",
        defaultValue: "rgba(0,0,0,0.5)",
        hidden: (props) => !props.showLabels,
    },
    labelPadding: {
        type: ControlType.Number,
        title: "Label Padding",
        defaultValue: 8,
        min: 4,
        max: 24,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showLabels,
    },
    brandName: {
        type: ControlType.String,
        title: "Brand Name",
        defaultValue: "",
        placeholder: "Enter brand name...",
    },
    brandFontSize: {
        type: ControlType.Number,
        title: "Brand Font Size",
        defaultValue: 18,
        min: 10,
        max: 48,
        step: 1,
        unit: "px",
        hidden: (props) => !props.brandName,
    },
    brandColor: {
        type: ControlType.Color,
        title: "Brand Color",
        defaultValue: "#ffffff",
        hidden: (props) => !props.brandName,
    },
    brandPosition: {
        type: ControlType.Enum,
        title: "Brand Position",
        options: ["top-left", "top-center", "top-right", "bottom-center"],
        optionTitles: ["Top Left", "Top Center", "Top Right", "Bottom Center"],
        defaultValue: "top-left",
        hidden: (props) => !props.brandName,
    },

    // Background
    showBackground: {
        type: ControlType.Boolean,
        title: "Show Background",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
        hidden: (props) => !props.showBackground,
    },
    backgroundBlur: {
        type: ControlType.Number,
        title: "Background Blur",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },

    // Navigation Arrows
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowPosition: {
        type: ControlType.Enum,
        title: "Arrow Position",
        options: ["sides", "bottom"],
        optionTitles: ["Sides", "Bottom"],
        defaultValue: "sides",
        displaySegmentedControl: true,
        hidden: (props) => !props.showArrows,
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        defaultValue: 48,
        min: 32,
        max: 80,
        step: 2,
        unit: "px",
        hidden: (props) => !props.showArrows,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#ffffff",
        hidden: (props) => !props.showArrows,
    },
    arrowBackgroundColor: {
        type: ControlType.Color,
        title: "Arrow Background",
        defaultValue: "rgba(0,0,0,0.5)",
        hidden: (props) => !props.showArrows,
    },
})
