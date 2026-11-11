// Made with 💛 by Karim Saif
// Framer Custom Infinite 3D Carousel Component (Production & Marketplace Ready)

import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const ANIMATION_DURATION = 500

type ImageFit = "cover" | "contain" | "fill"
type BorderStyle = "solid" | "dashed" | "dotted" | "none"

interface SlideItem {
    image?: string
    alt?: string
    cardBg?: string
    uniqueId?: string
}

interface CarouselProps {
    slides: SlideItem[]
    isInfinity: boolean
    autoplay: boolean
    delay: number
    cardWidth: number
    cardHeight: number
    cardMargin: number
    visibleAmount: number
    imageFit: ImageFit
    cardRadius: number
    borderWidth: number
    borderColor: string
    borderStyle: BorderStyle
    showBar: boolean
    ariaLabel: string
}

export default function InfiniteCarousel(props: CarouselProps) {
    const {
        slides = [],
        isInfinity = true,
        autoplay = false,
        delay = 5,
        cardWidth = 380,
        cardHeight = 480,
        cardMargin = 32,
        visibleAmount = 4,
        imageFit = "cover",
        cardRadius = 16,
        borderWidth = 1,
        borderColor = "rgba(255, 255, 255, 0.1)",
        borderStyle = "solid",
        showBar = true,
        ariaLabel = "Image carousel",
    } = props

    const isStatic = useIsStaticRenderer()

    const rawSlides = Array.isArray(slides) ? slides : []
    const slideCount = rawSlides.length
    const effectiveBuffer = Math.min(
        Math.max(1, visibleAmount),
        Math.max(1, slideCount)
    )

    const [nowIndex, setNowIndex] = React.useState(
        !isStatic && isInfinity ? effectiveBuffer : 0
    )
    const [isAnimate, setIsAnimate] = React.useState(true)
    const [isMouseDown, setIsMouseDown] = React.useState(false)
    const [dataArray, setDataArray] = React.useState<SlideItem[]>(rawSlides)
    const [liveDiffX, setLiveDiffX] = React.useState(0)

    const isMountedRef = React.useRef(true)
    const isSnappingRef = React.useRef(false)
    const startXRef = React.useRef(0)
    const diffXRef = React.useRef(0)
    const nowIndexRef = React.useRef(nowIndex)
    const isMouseDownRef = React.useRef(false)
    const activePointerIdRef = React.useRef<number | null>(null)
    const autoplayTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
        null
    )

    // Mount lifecycle & safety cleanup
    React.useEffect(() => {
        isMountedRef.current = true
        return () => {
            isMountedRef.current = false
            if (autoplayTimerRef.current !== null) {
                clearTimeout(autoplayTimerRef.current)
                autoplayTimerRef.current = null
            }
        }
    }, [])

    React.useEffect(() => {
        nowIndexRef.current = nowIndex
    }, [nowIndex])

    // Rebuild data array: clean uncloned list for static renderer, cloned loop for interactive runtime
    React.useEffect(() => {
        if (isStatic || !isInfinity || slideCount === 0) {
            setDataArray(rawSlides)
            setNowIndex(0)
            return
        }

        const behindData = rawSlides.slice(0, effectiveBuffer)
        const beforeData = rawSlides.slice(-effectiveBuffer)
        const combined = [...beforeData, ...rawSlides, ...behindData].map(
            (item, index) => ({
                ...item,
                uniqueId: `slide-${index}`,
            })
        )
        setDataArray(combined)
        setNowIndex(effectiveBuffer)
    }, [isStatic, slides, isInfinity, effectiveBuffer, slideCount])

    // Stepper: hard-stop bounds for non-infinite mode, loop progression for infinite mode
    const changeImagePosition = React.useCallback(
        (step: number) => {
            if (!dataArray || dataArray.length === 0 || isSnappingRef.current) {
                return
            }

            setNowIndex((prev) => {
                if (isInfinity) {
                    return prev + step
                }
                return Math.max(0, Math.min(dataArray.length - 1, prev + step))
            })
            setIsAnimate(true)
        },
        [dataArray, isInfinity]
    )

    // Robust self-scheduling autoplay timer with unmount protection
    const resetAutoplay = React.useCallback(() => {
        if (autoplayTimerRef.current !== null) {
            clearTimeout(autoplayTimerRef.current)
            autoplayTimerRef.current = null
        }

        if (isStatic || !autoplay || dataArray.length <= 1) return

        autoplayTimerRef.current = setTimeout(
            () => {
                autoplayTimerRef.current = null

                if (!isMountedRef.current) return

                if (!isMouseDownRef.current && !isSnappingRef.current) {
                    changeImagePosition(1)
                }

                if (isMountedRef.current) {
                    resetAutoplay()
                }
            },
            Math.max(delay, 1) * 1000
        )
    }, [isStatic, autoplay, delay, dataArray.length, changeImagePosition])

    React.useEffect(() => {
        resetAutoplay()
        return () => {
            if (autoplayTimerRef.current !== null) {
                clearTimeout(autoplayTimerRef.current)
                autoplayTimerRef.current = null
            }
        }
    }, [resetAutoplay])

    // Made with 💛 by Karim Saif (Calculations & Boundary Snapping)

    // Deterministic state-based boundary reset using synchronized constant duration
    React.useEffect(() => {
        if (isStatic || !isInfinity || slideCount === 0 || !isAnimate) return

        const firstRealIndex = effectiveBuffer
        const lastRealIndex = effectiveBuffer + slideCount - 1

        let snapTimer: ReturnType<typeof setTimeout> | null = null

        if (nowIndex > lastRealIndex) {
            isSnappingRef.current = true
            snapTimer = setTimeout(() => {
                if (!isMountedRef.current) return
                setIsAnimate(false)
                setNowIndex(firstRealIndex)
                requestAnimationFrame(() => {
                    if (!isMountedRef.current) return
                    isSnappingRef.current = false
                    setIsAnimate(true)
                })
            }, ANIMATION_DURATION)
        } else if (nowIndex < firstRealIndex) {
            isSnappingRef.current = true
            snapTimer = setTimeout(() => {
                if (!isMountedRef.current) return
                setIsAnimate(false)
                setNowIndex(lastRealIndex)
                requestAnimationFrame(() => {
                    if (!isMountedRef.current) return
                    isSnappingRef.current = false
                    setIsAnimate(true)
                })
            }, ANIMATION_DURATION)
        }

        return () => {
            if (snapTimer !== null) {
                clearTimeout(snapTimer)
            }
        }
    }, [nowIndex, isStatic, isInfinity, slideCount, effectiveBuffer, isAnimate])

    const computedLeftNumeric = () => {
        if (isStatic) return 0
        const leftSpan = -nowIndex * cardWidth
        let marginSpan = cardMargin * nowIndex
        if (isInfinity) {
            marginSpan = cardMargin * (nowIndex - 1) + cardMargin
        }
        return leftSpan - marginSpan
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || isSnappingRef.current) return
        isMouseDownRef.current = true
        activePointerIdRef.current = e.pointerId
        startXRef.current = e.clientX
        diffXRef.current = 0

        setIsMouseDown(true)
        setLiveDiffX(0)

        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch (_) {}
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isMouseDownRef.current || isStatic) return
        const currentDiff = startXRef.current - e.clientX
        const spanDistance = cardWidth + cardMargin

        if (Math.abs(currentDiff) > spanDistance) return

        diffXRef.current = currentDiff
        setLiveDiffX(currentDiff)
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isMouseDownRef.current || isStatic) return
        isMouseDownRef.current = false

        if (activePointerIdRef.current !== null) {
            try {
                e.currentTarget.releasePointerCapture(
                    activePointerIdRef.current
                )
            } catch (_) {}
            activePointerIdRef.current = null
        }

        const maxDiffX = Math.min(cardWidth * 0.35, 140)
        const currentDiff = diffXRef.current
        let nextIndex = nowIndexRef.current

        if (currentDiff > maxDiffX) {
            nextIndex = nowIndexRef.current + 1
        } else if (currentDiff < -maxDiffX) {
            nextIndex = nowIndexRef.current - 1
        }

        if (!isInfinity) {
            nextIndex = Math.max(0, Math.min(dataArray.length - 1, nextIndex))
        }

        setIsMouseDown(false)
        setIsAnimate(true)
        setNowIndex(nextIndex)
        setLiveDiffX(0)
        startXRef.current = 0
        diffXRef.current = 0

        resetAutoplay()
    }

    const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isMouseDownRef.current || isStatic) return
        isMouseDownRef.current = false

        if (activePointerIdRef.current !== null) {
            try {
                e.currentTarget.releasePointerCapture(
                    activePointerIdRef.current
                )
            } catch (_) {}
            activePointerIdRef.current = null
        }

        setIsMouseDown(false)
        setIsAnimate(true)
        setLiveDiffX(0)
        startXRef.current = 0
        diffXRef.current = 0

        resetAutoplay()
    }

    const computedMovingStyle = (index: number) => {
        const styles = {
            translateX: 0,
            translateZ: 0,
            opacityStyle: 1,
        }

        if (isStatic) return styles

        const activeDiff = liveDiffX
        const currentMovingStatus = -activeDiff < 0 ? -1 : 1

        if (!isMouseDown && nowIndex <= index) return styles
        if (!isMouseDown && nowIndex > index) {
            return {
                translateX: 0,
                translateZ: -cardWidth,
                opacityStyle: 0,
            }
        }

        if (currentMovingStatus === 1) {
            if (nowIndex - 1 === index) {
                const z = -cardWidth + -activeDiff
                styles.translateZ = z > 0 ? 0 : z
                styles.opacityStyle = Math.max(
                    0,
                    Math.min(1, -activeDiff / cardWidth)
                )
            } else if (nowIndex > index) {
                styles.translateZ = -cardWidth
                styles.opacityStyle = 0
            }
        } else if (currentMovingStatus === -1) {
            if (nowIndex === index) {
                styles.translateZ = -activeDiff
                styles.opacityStyle = Math.max(
                    0,
                    Math.min(1, 1 - Math.abs(activeDiff / cardWidth))
                )
            } else if (nowIndex > index) {
                styles.translateZ = -cardWidth
                styles.opacityStyle = 0
            }
        }
        styles.translateX = -activeDiff
        return styles
    }

    const carouselTranslateXNum = computedLeftNumeric()
    const showControls = !isStatic && dataArray.length > 1

    return (
        <section
            aria-label={ariaLabel || "Image carousel"}
            aria-roledescription="carousel"
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                backgroundColor: "transparent",
                userSelect: "none",
            }}
        >
            {/* Carousel Track */}
            <div
                style={{
                    width: "100%",
                    whiteSpace: "nowrap",
                    position: "relative",
                    touchAction: "pan-y",
                }}
            >
                <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    style={{
                        position: "relative",
                        perspective: isStatic ? "none" : "600px",
                        cursor: isStatic
                            ? "default"
                            : isMouseDown
                              ? "grabbing"
                              : "grab",
                        touchAction: "pan-y",
                    }}
                >
                    {dataArray.map((item, index) => {
                        const { translateX, translateZ, opacityStyle } =
                            computedMovingStyle(index)
                        const finalTranslateX =
                            carouselTranslateXNum + translateX

                        const realSlideIndex = isInfinity
                            ? ((((index - effectiveBuffer) % slideCount) +
                                  slideCount) %
                                  slideCount) +
                              1
                            : index + 1

                        return (
                            <div
                                key={item.uniqueId || `static-slide-${index}`}
                                role="group"
                                aria-roledescription="slide"
                                aria-label={`Slide ${realSlideIndex} of ${slideCount}`}
                                style={{
                                    width: `${cardWidth}px`,
                                    height: `${cardHeight}px`,
                                    marginRight: `${cardMargin}px`,
                                    display: "inline-block",
                                    padding: 0,
                                    boxSizing: "border-box",
                                    borderRadius: `${cardRadius}px`,
                                    backgroundColor: item.cardBg || "#1a1a1a",
                                    borderWidth: `${borderWidth}px`,
                                    borderStyle: borderStyle,
                                    borderColor: borderColor,
                                    transform: isStatic
                                        ? "none"
                                        : `translateX(${finalTranslateX}px) translateZ(${translateZ}px)`,
                                    opacity: isStatic ? 1 : opacityStyle,
                                    transition:
                                        !isStatic && isAnimate
                                            ? `transform ${ANIMATION_DURATION}ms ease, opacity ${ANIMATION_DURATION}ms ease`
                                            : "none",
                                    overflow: "hidden",
                                    verticalAlign: "top",
                                }}
                            >
                                {item.image && (
                                    <img
                                        src={item.image}
                                        alt={
                                            item.alt ||
                                            `Slide ${realSlideIndex}`
                                        }
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: imageFit,
                                            display: "block",
                                            pointerEvents: "none",
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Bottom Perspective Bar (rendered for real slides to optimize performance) */}
                {showBar && !isStatic && (
                    <div
                        style={{
                            display: "inline-flex",
                            perspective: "600px",
                            marginTop: "20px",
                        }}
                    >
                        {rawSlides.map((_, index) => {
                            const activeTargetIndex = isInfinity
                                ? index + effectiveBuffer
                                : index
                            const { translateX, translateZ, opacityStyle } =
                                computedMovingStyle(activeTargetIndex)
                            const finalTranslateX =
                                carouselTranslateXNum + translateX

                            return (
                                <div
                                    key={`bar-${index}`}
                                    style={{
                                        width: `${cardWidth}px`,
                                        marginRight: `${cardMargin}px`,
                                        borderBottom:
                                            "1px solid rgba(255, 255, 255, 0.4)",
                                        paddingBottom: "10px",
                                        transform: `translateX(${finalTranslateX}px) translateZ(${
                                            (translateZ * 2) / 3
                                        }px)`,
                                        opacity: opacityStyle,
                                        transition: isAnimate
                                            ? `${ANIMATION_DURATION}ms ease`
                                            : "none",
                                    }}
                                />
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            {showControls && (
                <>
                    <button
                        onClick={() => changeImagePosition(-1)}
                        aria-label="Previous slide"
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            border: "1px solid rgba(255, 255, 255, 0.4)",
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            color: "#ffffff",
                            fontSize: "20px",
                            cursor: "pointer",
                            position: "absolute",
                            left: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                        }}
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => changeImagePosition(1)}
                        aria-label="Next slide"
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            border: "1px solid rgba(255, 255, 255, 0.4)",
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            color: "#ffffff",
                            fontSize: "20px",
                            cursor: "pointer",
                            position: "absolute",
                            right: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                        }}
                    >
                        ›
                    </button>
                </>
            )}
        </section>
    )
}

// Property Controls Organized by Karim Saif
addPropertyControls(InfiniteCarousel, {
    slides: {
        type: ControlType.Array,
        title: "Slides Data",
        description: "List of images for the carousel cards.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    description: "Select or upload an image for this card.",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "Carousel image",
                    description: "Alternative text for screen readers.",
                },
                cardBg: {
                    type: ControlType.Color,
                    title: "Card BG",
                    defaultValue: "#1a1a1a",
                },
            },
        },
        defaultValue: [
            {
                image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
                alt: "Abstract 3D curved shapes in deep violet",
                cardBg: "#1e1e24",
            },
            {
                image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&q=80",
                alt: "Minimalist geometric render with soft lighting",
                cardBg: "#2b2d42",
            },
            {
                image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80",
                alt: "Vibrant abstract oil and digital artistic gradient",
                cardBg: "#1a1a1a",
            },
            {
                image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80",
                alt: "Futuristic neon glowing spatial aesthetic",
                cardBg: "#22223b",
            },
        ],
    },

    // Carousel Behavior
    isInfinity: {
        type: ControlType.Boolean,
        title: "Infinite Loop",
        description: "Enable infinite seamless wrapping.",
        defaultValue: true,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        description: "Automatically cycle through cards.",
        defaultValue: false,
    },
    delay: {
        type: ControlType.Number,
        title: "Autoplay Delay (s)",
        description: "Time in seconds before shifting to the next card.",
        defaultValue: 5,
        min: 1,
        max: 30,
        step: 1,
        hidden(props) {
            return !props.autoplay
        },
    },
    visibleAmount: {
        type: ControlType.Number,
        title: "Loop Buffer",
        description:
            "Number of cloned cards used on each side for seamless infinite looping.",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
    },

    // Image Fit
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        description: "How the image fills the entire card container.",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },

    // Sizing & Spacing
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        description: "Width of each card in pixels.",
        defaultValue: 380,
        min: 200,
        max: 800,
        step: 10,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        description: "Height of each card in pixels.",
        defaultValue: 480,
        min: 200,
        max: 900,
        step: 10,
    },
    cardMargin: {
        type: ControlType.Number,
        title: "Card Margin",
        description: "Horizontal margin between cards in pixels.",
        defaultValue: 32,
        min: 0,
        max: 100,
        step: 4,
    },

    // Card Borders & Corner Radius
    cardRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        description: "Border radius for card corners in pixels.",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        description: "Thickness of the card border in pixels.",
        defaultValue: 1,
        min: 0,
        max: 20,
        step: 1,
    },
    borderStyle: {
        type: ControlType.Enum,
        title: "Border Style",
        description: "Type of border line around each card.",
        options: ["solid", "dashed", "dotted", "none"],
        optionTitles: ["Solid", "Dashed", "Dotted", "None"],
        defaultValue: "solid",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        description: "Color of the card outline.",
        defaultValue: "rgba(255, 255, 255, 0.1)",
        hidden(props) {
            return props.borderStyle === "none" || props.borderWidth === 0
        },
    },

    // Styling & Appearance
    showBar: {
        type: ControlType.Boolean,
        title: "Show Bottom Bar",
        description: "Display the bottom perspective track lines.",
        defaultValue: true,
    },

    // Accessibility & Metadata
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: "Image carousel",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})

// Made with 💛 by Karim Saif
