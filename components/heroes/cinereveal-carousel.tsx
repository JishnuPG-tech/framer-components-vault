import {
    useState,
    useEffect,
    startTransition,
    type CSSProperties,
    useRef,
    useCallback,
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

import { motion, AnimatePresence, useInView } from "framer-motion"

interface CarouselImage {
    image: {
        src: string
        alt: string
        srcSet?: string
    }
}

interface CineRevealCarouselProps {
    images: CarouselImage[]
    arrows: {
        show: boolean
        useCustom: boolean
        prevImage: { src: string; alt: string }
        nextImage: { src: string; alt: string }
        size: number
        radius: number
        distanceType: "space" | "group"
        inset: number
        groupPosition:
            | "top-left"
            | "top-center"
            | "top-right"
            | "bottom-left"
            | "bottom-center"
            | "bottom-right"
            | "center"
        groupGap: number
        color: string
        backgroundColor: string
        showBackground: boolean
    }
    dots: {
        show: boolean
        size: number
        radius: number
        color: string
        activeColor: string
        gap: number
        position: "top" | "bottom" | "left" | "right"
        inset: number
    }
    autoplay: {
        enabled: boolean
        interval: number
        pauseOnHover: boolean
        showProgress: boolean
        progressColor: string
        loop: boolean
    }
    containerBackground: string
    borderRadius: number
    transition: any
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 *
 * @framerDisableUnlink
 */

export default function CineRevealCarousel(props: CineRevealCarouselProps) {
    const {
        images,
        arrows = {
            show: true,
            useCustom: false,
            prevImage: {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Previous",
            },
            nextImage: {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Next",
            },
            size: 48,
            radius: 24,
            distanceType: "space",
            inset: 24,
            groupPosition: "center",
            groupGap: 8,
            color: "#FFFFFF",
            backgroundColor: "rgba(0,0,0,0.5)",
            showBackground: true,
        },
        dots,
        autoplay,
        containerBackground,
        borderRadius,
        transition,
    } = props

    const isStatic = useIsStaticRenderer()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [animDirection, setAnimDirection] = useState(1)
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]))
    const [failedImages, setFailedImages] = useState<Set<number>>(new Set())
    const [isHovered, setIsHovered] = useState(false)
    const [progress, setProgress] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { amount: 0.5 })
    const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const isTransitioning = useRef(false)
    const pausedProgressRef = useRef(0)

    const prefersReducedMotion =
        typeof window !== "undefined"
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false

    const handlePrevious = useCallback(() => {
        if (!autoplay.loop && currentIndex === 0) return
        if (isTransitioning.current) return

        isTransitioning.current = true
        startTransition(() => {
            setAnimDirection(-1)
            setCurrentIndex((prev) =>
                prev === 0 ? images.length - 1 : prev - 1
            )
        })

        setTimeout(
            () => {
                isTransitioning.current = false
            },
            (transition?.duration || 0.8) * 1000
        )
    }, [currentIndex, images.length, autoplay.loop, transition])

    const handleNext = useCallback(() => {
        if (!autoplay.loop && currentIndex === images.length - 1) return
        if (isTransitioning.current) return

        isTransitioning.current = true
        startTransition(() => {
            setAnimDirection(1)
            setCurrentIndex((prev) =>
                prev === images.length - 1 ? 0 : prev + 1
            )
        })

        setTimeout(
            () => {
                isTransitioning.current = false
            },
            (transition?.duration || 0.8) * 1000
        )
    }, [currentIndex, images.length, autoplay.loop, transition])

    const handleDotClick = useCallback(
        (index: number) => {
            if (isTransitioning.current) return

            isTransitioning.current = true
            startTransition(() => {
                setAnimDirection(index > currentIndex ? 1 : -1)
                setCurrentIndex(index)
            })

            setTimeout(
                () => {
                    isTransitioning.current = false
                },
                (transition?.duration || 0.8) * 1000
            )
        },
        [currentIndex, transition]
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            // Prevent handling if the event target is a button (dot or arrow)
            if ((e.target as HTMLElement).tagName === "BUTTON") {
                return
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault()
                handlePrevious()
            } else if (e.key === "ArrowRight") {
                e.preventDefault()
                handleNext()
            }
        },
        [handlePrevious, handleNext]
    )

    const handleDotKeyDown = useCallback(
        (e: React.KeyboardEvent, index: number) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                const prevIndex = index === 0 ? images.length - 1 : index - 1
                handleDotClick(prevIndex)
            } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                const nextIndex = index === images.length - 1 ? 0 : index + 1
                handleDotClick(nextIndex)
            }
        },
        [images.length, handleDotClick]
    )

    useEffect(() => {
        if (!images || images.length === 0) return

        const imagesToLoad = new Set<number>()
        imagesToLoad.add(currentIndex)

        const prevIndex =
            currentIndex === 0 ? images.length - 1 : currentIndex - 1
        imagesToLoad.add(prevIndex)

        const nextIndex =
            currentIndex === images.length - 1 ? 0 : currentIndex + 1
        imagesToLoad.add(nextIndex)

        const imageElements: HTMLImageElement[] = []

        imagesToLoad.forEach((index) => {
            if (!loadedImages.has(index) && !failedImages.has(index)) {
                const img = new Image()
                img.onload = () => {
                    setLoadedImages((prev) => new Set(prev).add(index))
                }
                img.onerror = () => {
                    setFailedImages((prev) => new Set(prev).add(index))
                }
                img.src = images[index].image.src
                imageElements.push(img)
            }
        })

        return () => {
            imageElements.forEach((img) => {
                img.onload = null
                img.onerror = null
            })
        }
    }, [currentIndex, images, loadedImages, failedImages])

    useEffect(() => {
        if (
            isStatic ||
            !autoplay.enabled ||
            !isInView ||
            (autoplay.pauseOnHover && isHovered)
        ) {
            if (autoplayTimerRef.current) {
                clearInterval(autoplayTimerRef.current)
                autoplayTimerRef.current = null
            }
            if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current)
                progressTimerRef.current = null
                pausedProgressRef.current = 0
                setProgress(0)
            }
            return
        }

        if (autoplay.showProgress) {
            const startProgress = 0
            setProgress(startProgress)
            const progressInterval = 16
            const progressStep = (progressInterval / autoplay.interval) * 100

            progressTimerRef.current = setInterval(() => {
                setProgress((prev) => {
                    const next = prev + progressStep
                    return next >= 100 ? 100 : next
                })
            }, progressInterval)
        }

        autoplayTimerRef.current = setInterval(() => {
            handleNext()
            pausedProgressRef.current = 0
            setProgress(0)
        }, autoplay.interval)

        return () => {
            if (autoplayTimerRef.current) {
                clearInterval(autoplayTimerRef.current)
            }
            if (progressTimerRef.current) {
                clearInterval(progressTimerRef.current)
            }
        }
    }, [
        isStatic,
        autoplay.enabled,
        autoplay.interval,
        autoplay.pauseOnHover,
        autoplay.showProgress,
        isHovered,
        isInView,
        handleNext,
    ])

    if (!images || images.length === 0) {
        return <div style={fallback(containerBackground, borderRadius)}></div>
    }

    const safeIndex = Math.min(currentIndex, images.length - 1)
    const currentImage = images[safeIndex]

    if (!currentImage || !currentImage.image) {
        return <div style={fallback(containerBackground, borderRadius)}></div>
    }

    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor: containerBackground,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        borderRadius,
                    }}
                >
                    <img
                        src={currentImage.image.src}
                        srcSet={currentImage.image.srcSet}
                        alt={currentImage.image.alt || "Carousel image"}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                </div>

                {arrows.show && arrows.distanceType === "space" && (
                    <>
                        <ArrowButton
                            direction="prev"
                            onClick={handlePrevious}
                            disabled={!autoplay.loop && currentIndex === 0}
                            style={getSpacedArrowStyle(
                                "left",
                                arrows.size,
                                arrows.radius,
                                arrows.inset,
                                arrows.backgroundColor,
                                arrows.showBackground
                            )}
                            useCustom={arrows.useCustom}
                            customImage={arrows.prevImage}
                            size={arrows.size}
                            color={arrows.color}
                        />

                        <ArrowButton
                            direction="next"
                            onClick={handleNext}
                            disabled={
                                !autoplay.loop &&
                                currentIndex === images.length - 1
                            }
                            style={getSpacedArrowStyle(
                                "right",
                                arrows.size,
                                arrows.radius,
                                arrows.inset,
                                arrows.backgroundColor,
                                arrows.showBackground
                            )}
                            useCustom={arrows.useCustom}
                            customImage={arrows.nextImage}
                            size={arrows.size}
                            color={arrows.color}
                        />
                    </>
                )}

                {arrows.show && arrows.distanceType === "group" && (
                    <div
                        style={getGroupContainerStyle(
                            arrows.groupPosition,
                            arrows.inset,
                            arrows.groupGap
                        )}
                    >
                        <ArrowButton
                            direction="prev"
                            onClick={handlePrevious}
                            disabled={!autoplay.loop && currentIndex === 0}
                            style={getGroupArrowStyle(
                                arrows.size,
                                arrows.radius,
                                arrows.backgroundColor,
                                arrows.showBackground
                            )}
                            useCustom={arrows.useCustom}
                            customImage={arrows.prevImage}
                            size={arrows.size}
                            color={arrows.color}
                        />

                        <ArrowButton
                            direction="next"
                            onClick={handleNext}
                            disabled={
                                !autoplay.loop &&
                                currentIndex === images.length - 1
                            }
                            style={getGroupArrowStyle(
                                arrows.size,
                                arrows.radius,
                                arrows.backgroundColor,
                                arrows.showBackground
                            )}
                            useCustom={arrows.useCustom}
                            customImage={arrows.nextImage}
                            size={arrows.size}
                            color={arrows.color}
                        />
                    </div>
                )}

                {dots.show && images.length > 1 && (
                    <div
                        style={getDotsContainerStyle(
                            dots.position,
                            dots.inset,
                            dots.gap
                        )}
                        role="tablist"
                        aria-label="Carousel navigation"
                    >
                        {images.map((_, index) => (
                            <DotButton
                                key={index}
                                index={index}
                                isActive={index === currentIndex}
                                onClick={() => handleDotClick(index)}
                                onKeyDown={(e) => handleDotKeyDown(e, index)}
                                size={dots.size}
                                radius={dots.radius}
                                color={
                                    index === currentIndex
                                        ? dots.activeColor
                                        : dots.color
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    const variants = prefersReducedMotion
        ? {
              enter: { opacity: 0 },
              center: { opacity: 1 },
              exit: { opacity: 0 },
          }
        : {
              enter: (dir: number) => ({
                  clipPath:
                      dir === 1 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)",
              }),
              center: {
                  clipPath: "inset(0 0 0 0)",
              },
              exit: (dir: number) => ({
                  clipPath:
                      dir === 1 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)",
                  position: "absolute",
              }),
          }

    const imageVariants = prefersReducedMotion
        ? {}
        : {
              enter: (dir: number) => ({
                  x: dir === 1 ? "16%" : "-16%",
              }),
              center: {
                  x: "0%",
              },
              exit: (dir: number) => ({
                  x: dir === 1 ? "-16%" : "16%",
              }),
          }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                backgroundColor: containerBackground,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onKeyDown={handleKeyDown}
            role="region"
            aria-label="Image carousel"
            aria-roledescription="carousel"
            aria-live="polite"
            tabIndex={0}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    borderRadius,
                }}
            >
                <AnimatePresence
                    initial={false}
                    custom={animDirection}
                    mode="sync"
                >
                    <motion.div
                        key={safeIndex}
                        custom={animDirection}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={
                            prefersReducedMotion
                                ? { duration: 0.2 }
                                : transition
                        }
                        style={{
                            position: "absolute",
                            inset: 0,
                            willChange: prefersReducedMotion
                                ? "opacity"
                                : "clip-path",
                            transform: "translate3d(0, 0, 0)",
                            backfaceVisibility: "hidden",
                        }}
                    >
                        {failedImages.has(safeIndex) ? (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "rgba(0,0,0,0.1)",
                                    color: "#999",
                                }}
                            >
                                Failed to load image
                            </div>
                        ) : !loadedImages.has(safeIndex) ? (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "rgba(0,0,0,0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        border: "3px solid rgba(255,255,255,0.3)",
                                        borderTopColor: "#FFFFFF",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite",
                                    }}
                                />
                            </div>
                        ) : (
                            <motion.img
                                custom={animDirection}
                                variants={imageVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={
                                    prefersReducedMotion
                                        ? { duration: 0.2 }
                                        : transition
                                }
                                src={currentImage.image.src}
                                srcSet={currentImage.image.srcSet}
                                alt={currentImage.image.alt || "Carousel image"}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    transform: "translate3d(0, 0, 0)",
                                    backfaceVisibility: "hidden",
                                }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {autoplay.enabled && autoplay.showProgress && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 3,
                            backgroundColor: "rgba(255,255,255,0.2)",
                            zIndex: 15,
                        }}
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${progress}%`,
                                backgroundColor: autoplay.progressColor,
                                transition: "width 0.016s linear",
                            }}
                        />
                    </div>
                )}
            </div>

            <div
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
                aria-live="polite"
                aria-atomic="true"
            >
                Slide {currentIndex + 1} of {images.length}
            </div>

            {arrows.show && arrows.distanceType === "space" && (
                <>
                    <ArrowButton
                        direction="prev"
                        onClick={handlePrevious}
                        disabled={!autoplay.loop && currentIndex === 0}
                        style={getSpacedArrowStyle(
                            "left",
                            arrows.size,
                            arrows.radius,
                            arrows.inset,
                            arrows.backgroundColor,
                            arrows.showBackground
                        )}
                        useCustom={arrows.useCustom}
                        customImage={arrows.prevImage}
                        size={arrows.size}
                        color={arrows.color}
                    />

                    <ArrowButton
                        direction="next"
                        onClick={handleNext}
                        disabled={
                            !autoplay.loop && currentIndex === images.length - 1
                        }
                        style={getSpacedArrowStyle(
                            "right",
                            arrows.size,
                            arrows.radius,
                            arrows.inset,
                            arrows.backgroundColor,
                            arrows.showBackground
                        )}
                        useCustom={arrows.useCustom}
                        customImage={arrows.nextImage}
                        size={arrows.size}
                        color={arrows.color}
                    />
                </>
            )}

            {arrows.show && arrows.distanceType === "group" && (
                <div
                    style={getGroupContainerStyle(
                        arrows.groupPosition,
                        arrows.inset,
                        arrows.groupGap
                    )}
                >
                    <ArrowButton
                        direction="prev"
                        onClick={handlePrevious}
                        disabled={!autoplay.loop && currentIndex === 0}
                        style={getGroupArrowStyle(
                            arrows.size,
                            arrows.radius,
                            arrows.backgroundColor,
                            arrows.showBackground
                        )}
                        useCustom={arrows.useCustom}
                        customImage={arrows.prevImage}
                        size={arrows.size}
                        color={arrows.color}
                    />

                    <ArrowButton
                        direction="next"
                        onClick={handleNext}
                        disabled={
                            !autoplay.loop && currentIndex === images.length - 1
                        }
                        style={getGroupArrowStyle(
                            arrows.size,
                            arrows.radius,
                            arrows.backgroundColor,
                            arrows.showBackground
                        )}
                        useCustom={arrows.useCustom}
                        customImage={arrows.nextImage}
                        size={arrows.size}
                        color={arrows.color}
                    />
                </div>
            )}

            {dots.show && images.length > 1 && (
                <div
                    style={getDotsContainerStyle(
                        dots.position,
                        dots.inset,
                        dots.gap
                    )}
                    role="tablist"
                    aria-label="Carousel navigation"
                >
                    {images.map((_, index) => (
                        <DotButton
                            key={index}
                            index={index}
                            isActive={index === currentIndex}
                            onClick={() => handleDotClick(index)}
                            onKeyDown={(e) => handleDotKeyDown(e, index)}
                            size={dots.size}
                            radius={dots.radius}
                            color={
                                index === currentIndex
                                    ? dots.activeColor
                                    : dots.color
                            }
                        />
                    ))}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

/* ---------- Helpers ---------- */

interface ArrowButtonProps {
    direction: "prev" | "next"
    onClick: () => void
    disabled: boolean
    style: CSSProperties
    useCustom: boolean
    customImage: { src: string; alt: string }
    size: number
    color: string
}

interface DotButtonProps {
    index: number
    isActive: boolean
    onClick: () => void
    onKeyDown: (e: React.KeyboardEvent) => void
    size: number
    radius: number
    color: string
}

// Arrow Icon Components
const ArrowLeft = ({ size, color }: { size: number; color: string }) => (
    <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M15 18L9 12L15 6"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const ArrowRight = ({ size, color }: { size: number; color: string }) => (
    <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M9 18L15 12L9 6"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const fallback = (bg: string, radius: number): CSSProperties => ({
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: radius,
    backgroundColor: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFFFFF",
})

const getSpacedArrowStyle = (
    side: "left" | "right",
    size: number,
    radius: number,
    inset: number,
    bg: string,
    showBg: boolean
): CSSProperties => {
    const base: CSSProperties = {
        position: "absolute",
        width: size,
        height: size,
        borderRadius: radius,
        border: "none",
        backgroundColor: showBg ? bg : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        [side]: inset,
        top: "50%",
        transform: "translateY(-50%)",
    }

    return base
}

const getGroupContainerStyle = (
    position: string,
    inset: number,
    gap: number
): CSSProperties => {
    const base: CSSProperties = {
        position: "absolute",
        display: "flex",
        flexDirection: "row",
        gap,
        zIndex: 10,
    }

    // Handle center position (both vertically and horizontally centered)
    if (position === "center") {
        base.top = "50%"
        base.left = "50%"
        base.transform = "translate(-50%, -50%)"
        return base
    }

    const [vertical, horizontal] = position.split("-")

    // Handle vertical positioning
    if (vertical === "top" || vertical === "bottom") {
        base[vertical] = inset
    }

    // Handle horizontal positioning
    if (horizontal === "center") {
        base.left = "50%"
        base.transform = "translateX(-50%)"
    } else if (horizontal === "left" || horizontal === "right") {
        base[horizontal] = inset
    }

    return base
}

const getGroupArrowStyle = (
    size: number,
    radius: number,
    bg: string,
    showBg: boolean
): CSSProperties => ({
    width: size,
    height: size,
    borderRadius: radius,
    border: "none",
    backgroundColor: showBg ? bg : "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
})

const getDotsContainerStyle = (
    position: "top" | "bottom" | "left" | "right",
    inset: number,
    gap: number
): CSSProperties => {
    const base: CSSProperties = {
        position: "absolute",
        display: "flex",
        gap,
        zIndex: 10,
    }

    if (position === "top" || position === "bottom") {
        base[position] = inset
        base.left = "50%"
        base.transform = "translateX(-50%)"
        base.flexDirection = "row"
    } else {
        base[position] = inset
        base.top = "50%"
        base.transform = "translateY(-50%)"
        base.flexDirection = "column"
    }

    return base
}

addPropertyControls(CineRevealCarousel, {
    images: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                },
            },
        },
        maxCount: 10,
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
            },
        ],
    },
    containerBackground: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#E2E8F0",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 64,
    },
    arrows: {
        type: ControlType.Object,
        title: "Arrows",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            distanceType: {
                type: ControlType.Enum,
                title: "Type",
                options: ["space", "group"],
                optionTitles: ["Space", "Group"],
                defaultValue: "space",
                displaySegmentedControl: true,
                hidden: ({ show }) => !show,
            },
            inset: {
                type: ControlType.Number,
                title: "Inset",
                defaultValue: 24,
                min: -100,
                max: 100,
                step: 1,
                hidden: ({ show }) => !show,
            },
            groupPosition: {
                type: ControlType.Enum,
                title: "Position",
                options: [
                    "top-left",
                    "top-center",
                    "top-right",
                    "bottom-left",
                    "bottom-center",
                    "bottom-right",
                    "center",
                ],
                optionTitles: [
                    "Top Left",
                    "Top Center",
                    "Top Right",
                    "Bottom Left",
                    "Bottom Center",
                    "Bottom Right",
                    "Center",
                ],
                defaultValue: "center",
                hidden: ({ show, distanceType }) =>
                    !show || distanceType === "space",
            },
            groupGap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 0,
                max: 48,
                step: 1,
                hidden: ({ show, distanceType }) =>
                    !show || distanceType === "space",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 48,
                min: 24,
                max: 80,
                step: 1,
                hidden: ({ show }) => !show,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 24,
                min: 0,
                max: 48,
                step: 1,
                hidden: ({ show }) => !show,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                hidden: ({ show, useCustom }) => !show || useCustom,
            },
            showBackground: {
                type: ControlType.Boolean,
                title: "Background",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                hidden: ({ show }) => !show,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0,0,0,0.5)",
                hidden: ({ show, showBackground }) => !show || !showBackground,
            },
            useCustom: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: false,
                enabledTitle: "Custom",
                disabledTitle: "Default",
                hidden: ({ show }) => !show,
            },
            prevImage: {
                type: ControlType.ResponsiveImage,
                title: "Previous",
                hidden: ({ show, useCustom }) => !show || !useCustom,
            },
            nextImage: {
                type: ControlType.ResponsiveImage,
                title: "Next",
                hidden: ({ show, useCustom }) => !show || !useCustom,
            },
        },
    },
    dots: {
        type: ControlType.Object,
        title: "Dots",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["top", "bottom", "left", "right"],
                optionTitles: ["Top", "Bottom", "Left", "Right"],
                defaultValue: "bottom",
                hidden: ({ show }) => !show,
            },
            inset: {
                type: ControlType.Number,
                title: "Inset",
                defaultValue: 24,
                min: 0,
                max: 100,
                step: 1,
                hidden: ({ show }) => !show,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 8,
                min: 4,
                max: 24,
                step: 1,
                hidden: ({ show }) => !show,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 8,
                min: 0,
                max: 24,
                step: 1,
                hidden: ({ show }) => !show,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 2,
                max: 24,
                step: 1,
                hidden: ({ show }) => !show,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(255,255,255,0.5)",
                hidden: ({ show }) => !show,
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active Color",
                defaultValue: "#FFFFFF",
                hidden: ({ show }) => !show,
            },
        },
    },
    autoplay: {
        type: ControlType.Object,
        title: "Autoplay",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                hidden: ({ enabled }) => !enabled,
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: 3000,
                min: 1000,
                max: 10000,
                step: 500,
                unit: "ms",
                hidden: ({ enabled }) => !enabled,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: ({ enabled }) => !enabled,
            },
            showProgress: {
                type: ControlType.Boolean,
                title: "Progress",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                hidden: ({ enabled }) => !enabled,
            },
            progressColor: {
                type: ControlType.Color,
                title: "Progress Color",
                defaultValue: "#FFFFFF",
                hidden: ({ enabled, showProgress }) =>
                    !enabled || !showProgress,
            },
        },
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        description:
            "Crafted by [Shouvik Biswas](https://dub.sh/framer-components)",
        defaultValue: {
            duration: 0.8,
            ease: [0.8, 0, 0.2, 1],
        },
    },
})

// Memoized Arrow Button Component
const ArrowButton = ({
    direction,
    onClick,
    disabled,
    style,
    useCustom,
    customImage,
    size,
    color,
}: ArrowButtonProps) => {
    const ArrowIcon = direction === "prev" ? ArrowLeft : ArrowRight
    const label = direction === "prev" ? "Previous image" : "Next image"

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                ...style,
                opacity: disabled ? 0.3 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
            }}
            aria-label={label}
        >
            {useCustom && customImage?.src ? (
                <img
                    src={customImage.src}
                    alt={customImage.alt || label}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                    }}
                />
            ) : (
                <ArrowIcon size={size} color={color} />
            )}
        </button>
    )
}

// Memoized Dot Button Component
const DotButton = ({
    index,
    isActive,
    onClick,
    onKeyDown,
    size,
    radius,
    color,
}: DotButtonProps) => {
    return (
        <button
            onClick={onClick}
            onKeyDown={onKeyDown}
            style={{
                width: size,
                height: size,
                borderRadius: radius,
                border: "none",
                backgroundColor: color,
                cursor: "pointer",
                transition: "background-color 0.3s ease",
                padding: 0,
            }}
            aria-label={`Go to image ${index + 1}`}
            aria-selected={isActive}
            role="tab"
            tabIndex={isActive ? 0 : -1}
        />
    )
}
