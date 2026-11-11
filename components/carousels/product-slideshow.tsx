// Multiple image cards that scale up into a slideshow when clicked
import {
    useState,
    startTransition,
    useRef,
    useEffect,
    type CSSProperties,
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

import { motion, AnimatePresence } from "framer-motion"
import type { Easing } from "framer-motion"
import type React from "react"

interface ProductSlideshowItem {
    image: {
        src: string
        alt: string
        srcSet?: string
    }
    subImages?: {
        src: string
        alt: string
        srcSet?: string
    }[]
    productInfo?: {
        title: string
        description: string
        price: string
    }
    buttonLink?: string
    variants1?: {
        name: string
        priceChange: number
        image?: {
            src: string
            alt: string
            srcSet?: string
        }
    }[]
    variants2?: {
        name: string
        priceChange: number
        image?: {
            src: string
            alt: string
            srcSet?: string
        }
    }[]
}

interface ProductSlideshowProps {
    items: ProductSlideshowItem[]
    settings: {
        gap: number
        radius: number
        background: string
        alignmentX: "flex-start" | "center" | "flex-end"
        alignmentY: "flex-start" | "center" | "flex-end"
    }
    scaleUp: {
        maxScale: number
        time: number
        easing: string
        sizeDecrement: number
    }
    baseSize: {
        width: number
        height: number
    }
    title: {
        enabled: boolean
        text: string
        font: any
        color: string
        alignmentX: "flex-start" | "center" | "flex-end"
        alignmentY: "flex-start" | "center" | "flex-end"
        fill: "fit" | "fixed" | "fill" | "relative"
        width: number
    }
    subImages: {
        enabled: boolean
        size: number
        gap: number
        radius: number
        position: "bottom" | "top" | "left" | "right"
        alignmentX: "flex-start" | "center" | "flex-end"
        alignmentY: "flex-start" | "center" | "flex-end"
        inactiveOpacity: number
    }
    variants: {
        enabled: boolean
        background: string
        textColor: string
        borderWidth: number
        borderColor: string
        radius: number
        padding: number
        gap: number
        font: any
        active: {
            background: string
            textColor: string
            borderColor: string
        }
        hover: {
            background: string
            textColor: string
            borderColor: string
            opacity: number
            scale: number
        }
    }
    description: {
        text: {
            titleFont: any
            titleColor: string
            titleAnimation: "shimmer" | "instant" | "fade" | "moveIn"
            descriptionFont: any
            descriptionColor: string
            priceFont: any
            priceColor: string
            textAlign: "left" | "center" | "right"
            textOrder: string[]
        }
        enabled: true
        position: "front" | "behind"
        animation: "instant" | "fade" | "moveIn"
        container: {
            background: string
            padding: number
            gap: number
            fill: "fit" | "fixed" | "fill" | "relative"
            width: number
            radius: number
            borderWidth: number
            borderColor: string
            borderStyle: "solid" | "dashed" | "dotted"
        }
        button: {
            enabled: boolean
            type: "primary" | "secondary" | "tertiary"
            linkType: "individual" | "global"
            globalLink: string
            label: string
            link?: string
            background: string
            textColor: string
            font: any
            radius: number
            padding: number
            fill: "fit" | "fixed" | "fill"
            width: number
            borderWidth: number
            borderColor: string
            underlineThickness: number
            hover: {
                background: string
                textColor: string
                opacity: number
                scale: number
                borderColor: string
            }
            icon: {
                enabled: boolean
                svg: string
                placement: "left" | "right"
                size: number
                gap: number
            }
        }
        alignmentX: "flex-start" | "center" | "flex-end"
        alignmentY: "flex-start" | "center" | "flex-end"
    }
    style?: CSSProperties
}

// Generate unique ID for each component instance
let instanceCounter = 0

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 640
 */
export default function ProductSlideshow(props: ProductSlideshowProps) {
    const {
        items = [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
                productInfo: {
                    title: "Éclipse Satin Blazer",
                    description:
                        "A tailored, midnight-black satin blazer with structured shoulders and refined lapels, perfect for evening elegance",
                    price: "$780",
                },
                buttonLink: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
                productInfo: {
                    title: "Lumen Silk Slip Dress",
                    description:
                        "Fluid, bias-cut silk dress with a subtle metallic sheen and minimalist silhouette for a polished, contemporary look",
                    price: "$999",
                },
                buttonLink: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                productInfo: {
                    title: "Vérité Cashmere Suit",
                    description:
                        "Sumptuously soft cashmere knit with a relaxed fit and elongated cuffs, ideal for layering in transitional seasons",
                    price: "$450",
                },
                buttonLink: "",
            },
        ],
        settings = {
            gap: 16,
            radius: 8,
            background: "transparent",
            alignmentX: "center",
            alignmentY: "center",
        },
        scaleUp = {
            maxScale: 200,
            time: 0.5,
            easing: "easeInOut",
            sizeDecrement: 15,
        },
        baseSize = { width: 200, height: 250 },
        title = {
            enabled: true,
            text: "YOUR BG TEXT",
            font: {},
            color: "#F0F0F0",
            alignmentX: "center",
            alignmentY: "center",
            fill: "fit",
            width: 300,
        },
        subImages = {
            enabled: true,
            size: 32,
            gap: 8,
            radius: 4,
            position: "bottom",
            alignmentX: "center",
            alignmentY: "flex-end",
            inactiveOpacity: 0.5,
        },
        variants = {
            enabled: true,
            background: "transparent",
            textColor: "#BCB7C9",
            borderWidth: 2,
            borderColor: "#BCB7C9",
            radius: 8,
            padding: 12,
            gap: 8,
            font: {},
            active: {
                background: "transparent",
                textColor: "#FFFFFF",
                borderColor: "#000000",
            },
            hover: {
                background: "transparent",
                textColor: "#000000",
                borderColor: "#000000",
                opacity: 1,
                scale: 0.98,
            },
        },
        description = {
            text: {
                titleFont: {},
                titleColor: "#000000",
                titleAnimation: "fade",
                descriptionFont: {},
                descriptionColor: "#575757",
                priceFont: {},
                priceColor: "#000000",
                textAlign: "left",
                textOrder: ["title", "description", "price", "variants1", "variants2"],
            },
            enabled: true,
            position: "front",
            animation: "fade",
            container: {
                background: "rgba(255, 255, 255, 0)",
                padding: 20,
                gap: 20,
                radius: 8,
                fill: "fixed",
                width: 300,
                borderWidth: 0,
                borderColor: "#000000",
                borderStyle: "solid",
            },
            button: {
                enabled: true,
                type: "primary",
                linkType: "individual",
                globalLink: "https://framer.com",
                label: "Add to Cart",
                background: "#000000",
                textColor: "#FFFFFF",
                font: {},
                radius: 8,
                padding: 12,
                fill: "fill",
                width: 200,
                borderWidth: 2,
                borderColor: "#000000",
                underlineThickness: 2,
                hover: {
                    background: "#333333",
                    textColor: "#FFFFFF",
                    opacity: 1,
                    scale: 0.98,
                    borderColor: "#333333",
                },
                icon: {
                    enabled: false,
                    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
                    placement: "right",
                    size: 16,
                    gap: 8,
                },
            },
            alignmentX: "flex-start",
            alignmentY: "flex-start",
        },
    } = props

    // Ensure items array is never empty
    const displayItems =
        items && items.length > 0
            ? items
            : [
                  {
                      image: {
                          src: "https://framerusercontent.com/images/8PYSLduTRXgxc4boUc339uRLgA.png",
                          alt: "Male Model 1",
                      },
                      productInfo: {
                          title: "Éclipse Satin Blazer",
                          description:
                              "A tailored, midnight-black satin blazer with structured shoulders and refined lapels, perfect for evening elegance",
                          price: "$780",
                      },
                      buttonLink: "",
                  },
                  {
                      image: {
                          src: "https://framerusercontent.com/images/QVi9LkqMzTmc44GabjWRpWqsk.png",
                          alt: "Male Model 2",
                      },
                      productInfo: {
                          title: "Lumen Silk Slip Dress",
                          description:
                              "Fluid, bias-cut silk dress with a subtle metallic sheen and minimalist silhouette for a polished, contemporary look",
                          price: "$999",
                      },
                      buttonLink: "",
                  },
                  {
                      image: {
                          src: "https://framerusercontent.com/images/RgajxkdlTGfGe6ZTFpZcBGtBMo.png",
                          alt: "Male Model 3",
                      },
                      productInfo: {
                          title: "Vérité Cashmere Suit",
                          description:
                              "Sumptuously soft cashmere knit with a relaxed fit and elongated cuffs, ideal for layering in transitional seasons",
                          price: "$450",
                      },
                      buttonLink: "",
                  },
              ]

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
    const [activeSubImageIndex, setActiveSubImageIndex] = useState<number[]>(
        displayItems.map(() => 0)
    )
    const [activeVariantIndex, setActiveVariantIndex] = useState<number[]>(
        displayItems.map(() => 0)
    )
    const [activeVariant2Index, setActiveVariant2Index] = useState<number[]>(
        displayItems.map(() => 0)
    )
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [isZoomedIn, setIsZoomedIn] = useState(false)
    const [showProductInfo, setShowProductInfo] = useState(false)
    const [isButtonHovered, setIsButtonHovered] = useState(false)
    const [hoveredVariantIndex, setHoveredVariantIndex] = useState<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const imageContainerRef = useRef<HTMLDivElement>(null)
    const descriptionRef = useRef<HTMLDivElement>(null)
    const scrollCooldown = useRef<boolean>(false)
    const [descriptionDimensions, setDescriptionDimensions] = useState({
        width: 0,
        height: 0,
    })
    const [itemPositions, setItemPositions] = useState<
        { left: number; top: number }[]
    >([])
    const lastTapTime = useRef<number>(0)
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false)
    const instanceId = useRef<number>(instanceCounter++)

    // Detect if device is mobile or tablet
    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkDevice = () => {
                const isTouchDevice =
                    "ontouchstart" in window || navigator.maxTouchPoints > 0
                const isSmallScreen = window.innerWidth <= 1024
                setIsMobileOrTablet(isTouchDevice && isSmallScreen)
            }

            checkDevice()
            window.addEventListener("resize", checkDevice)

            return () => window.removeEventListener("resize", checkDevice)
        }
    }, [])

    // Calculate positions before animation
    useEffect(() => {
        if (isZoomedIn && selectedIndex !== null && containerRef.current) {
            const selectedScale = scaleUp.maxScale / 100
            const scaledWidth = baseSize.width * selectedScale
            const scaledHeight = baseSize.height * selectedScale
            const containerWidth = containerRef.current.offsetWidth
            const containerCenter = containerWidth / 2
            const itemCenter = scaledWidth / 2
            const zoomedGap = settings.gap * 2
            const centerPosition = containerCenter - itemCenter
            const topPosition =
                containerRef.current.offsetHeight / 2 - scaledHeight / 2

            const positions = displayItems.map((_, index) => {
                if (selectedIndex === index) {
                    return { left: centerPosition, top: topPosition }
                } else {
                    const offset =
                        (index - selectedIndex) * (scaledWidth + zoomedGap)
                    return { left: centerPosition + offset, top: topPosition }
                }
            })

            setItemPositions(positions)
        }
    }, [
        isZoomedIn,
        selectedIndex,
        scaleUp.maxScale,
        baseSize.width,
        baseSize.height,
        settings.gap,
        displayItems.length,
    ])

    const openSlideshow = (index: number) => {
        startTransition(() => {
            setSelectedIndex(index)
            setIsZoomedIn(true)
            if (description.enabled) {
                setShowProductInfo(true)
            }
        })
    }

    const handleSubImageClick = (itemIndex: number, subImageIndex: number) => {
        startTransition(() => {
            setActiveSubImageIndex((prev) => {
                const newIndices = [...prev]
                newIndices[itemIndex] = subImageIndex
                return newIndices
            })
        })
    }

    const handleVariantClick = (itemIndex: number, variantIndex: number) => {
        startTransition(() => {
            setActiveVariantIndex((prev) => {
                const newIndices = [...prev]
                newIndices[itemIndex] = variantIndex
                return newIndices
            })
        })
    }

    const handleVariant2Click = (itemIndex: number, variantIndex: number) => {
        startTransition(() => {
            setActiveVariant2Index((prev) => {
                const newIndices = [...prev]
                newIndices[itemIndex] = variantIndex
                return newIndices
            })
        })
    }

    const closeSlideshow = () => {
        startTransition(() => {
            setSelectedIndex(null)
            setIsZoomedIn(false)
            setShowProductInfo(false)
        })
    }

    const handleImageClick = (index: number) => {
        if (isZoomedIn) {
            // If clicking on the focused image, exit the slideshow
            if (selectedIndex === index) {
                if (isMobileOrTablet) {
                    // Double-tap to exit on mobile/tablet
                    const now = Date.now()
                    const timeSinceLastTap = now - lastTapTime.current

                    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
                        // Double tap detected
                        closeSlideshow()
                        lastTapTime.current = 0
                    } else {
                        // Single tap - update last tap time
                        lastTapTime.current = now
                    }
                } else {
                    // Single click to exit on web
                    closeSlideshow()
                }
            } else {
                // If clicking on a different image, change the selected image
                startTransition(() => {
                    setSelectedIndex(index)
                })
            }
        } else {
            // If not zoomed in, zoom in to the clicked image
            openSlideshow(index)
        }
    }

    const goToNext = () => {
        startTransition(() => {
            if (
                selectedIndex !== null &&
                selectedIndex < displayItems.length - 1
            ) {
                setSelectedIndex(selectedIndex + 1)
            }
        })
    }

    const goToPrevious = () => {
        startTransition(() => {
            if (selectedIndex !== null && selectedIndex > 0) {
                setSelectedIndex(selectedIndex - 1)
            }
        })
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (selectedIndex === null) return

        if (e.key === "Escape") {
            closeSlideshow()
        } else if (e.key === "ArrowRight") {
            goToNext()
        } else if (e.key === "ArrowLeft") {
            goToPrevious()
        }
    }

    useEffect(() => {
        const container = containerRef.current
        if (!container || !isZoomedIn || selectedIndex === null) return

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            e.stopPropagation()

            // If in cooldown, ignore the scroll
            if (scrollCooldown.current) return

            const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX

            // Threshold for navigation
            if (Math.abs(delta) < 10) return

            // Set cooldown
            scrollCooldown.current = true

            if (delta > 0) {
                // Scroll down/right = next image
                goToNext()
            } else {
                // Scroll up/left = previous image
                goToPrevious()
            }

            // Release cooldown after animation completes
            setTimeout(() => {
                scrollCooldown.current = false
            }, scaleUp.time * 1000)
        }

        container.addEventListener("wheel", handleWheel, { passive: false })

        return () => {
            container.removeEventListener("wheel", handleWheel)
        }
    }, [isZoomedIn, selectedIndex, displayItems.length, scaleUp.time])

    useEffect(() => {
        if (showProductInfo && descriptionRef.current) {
            const updateDimensions = () => {
                if (descriptionRef.current) {
                    setDescriptionDimensions({
                        width: descriptionRef.current.offsetWidth,
                        height: descriptionRef.current.offsetHeight,
                    })
                }
            }

            // Update dimensions after a short delay to ensure rendering is complete
            const timeoutId = setTimeout(updateDimensions, 10)

            return () => clearTimeout(timeoutId)
        }
    }, [showProductInfo, selectedIndex])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                backgroundColor: settings.background,
                overflow: "visible",
            }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Title Text - Behind Cards */}
            {title.enabled && !isZoomedIn && (
                <div
                    key={title.text}
                    style={{
                        position: "absolute",
                        top:
                            title.alignmentY === "flex-start"
                                ? 20
                                : title.alignmentY === "center"
                                  ? "50%"
                                  : "auto",
                        bottom: title.alignmentY === "flex-end" ? 20 : "auto",
                        left:
                            title.alignmentX === "flex-start"
                                ? 20
                                : title.alignmentX === "center"
                                  ? "50%"
                                  : "auto",
                        right: title.alignmentX === "flex-end" ? 20 : "auto",
                        transform:
                            title.alignmentX === "center" &&
                            title.alignmentY === "center"
                                ? "translate(-50%, -50%)"
                                : title.alignmentX === "center"
                                  ? "translateX(-50%)"
                                  : title.alignmentY === "center"
                                    ? "translateY(-50%)"
                                    : "none",
                        zIndex: 1,
                        pointerEvents: "none",
                        width:
                            title.fill === "fill"
                                ? (() => {
                                      if (containerRef.current) {
                                          const containerWidth =
                                              containerRef.current.offsetWidth
                                          const totalPadding = 40
                                          return `${containerWidth - totalPadding}px`
                                      }
                                      return "100%"
                                  })()
                                : title.fill === "fixed"
                                  ? `${title.width}px`
                                  : title.fill === "relative"
                                    ? (() => {
                                          if (containerRef.current) {
                                              const containerWidth =
                                                  containerRef.current
                                                      .offsetWidth
                                              const relativeWidth =
                                                  (containerWidth *
                                                      title.width) /
                                                  100
                                              return `${relativeWidth}px`
                                          }
                                          return "100%"
                                      })()
                                    : "fit-content",
                        ...title.font,
                        color: title.color,
                        whiteSpace: title.fill === "fit" ? "nowrap" : "normal",
                        wordWrap:
                            title.fill !== "fit" ? "break-word" : "normal",
                        textAlign: title.font.textAlign,
                    }}
                >
                    {title.text}
                </div>
            )}

            <motion.div
                ref={imageContainerRef}
                style={{
                    display: "flex",
                    padding: settings.gap,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    flexWrap: "nowrap",
                    justifyContent: settings.alignmentX,
                    alignItems: settings.alignmentY,
                    transformOrigin: "center",
                    gap: settings.gap,
                    position: "relative",
                    zIndex: 5,
                }}
            >
                {displayItems.map((item, index) => {
                    const imageData = item.image || {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Default image",
                    }

                    // Determine which image to display
                    // If sub-images exist and one is selected, show that sub-image
                    // Otherwise show the main image
                    const hasSubImages = item.subImages && item.subImages.length > 0
                    const currentSubImageIndex = activeSubImageIndex[index] || 0
                    
                    // If there are sub-images and a sub-image is selected (index > 0), show that sub-image
                    // Otherwise show the main image
                    const activeImage = hasSubImages && currentSubImageIndex > 0
                        ? item.subImages[currentSubImageIndex - 1]
                        : imageData

                    return (
                        <motion.div
                            key={index}
                            layoutId={`item-${instanceId.current}-${index}`}
                            style={{
                                position: isZoomedIn ? "absolute" : "relative",
                                borderRadius: settings.radius,
                                overflow: "hidden",
                                cursor: "pointer",
                                width: baseSize.width,
                                height: baseSize.height,
                                transformOrigin: "center center",
                                flexShrink: 0,
                                pointerEvents: "auto",
                                ...(isZoomedIn && {
                                    left: "50%",
                                    top: "50%",
                                }),
                            }}
                            animate={{
                                scale: isZoomedIn
                                    ? selectedIndex === index
                                        ? scaleUp.maxScale / 100
                                        : Math.max(
                                              0.1,
                                              (scaleUp.maxScale / 100) *
                                                  (1 -
                                                      (Math.abs(
                                                          selectedIndex - index
                                                      ) === 1
                                                          ? (scaleUp.sizeDecrement /
                                                                100) *
                                                            1.5
                                                          : (Math.abs(
                                                                selectedIndex -
                                                                    index
                                                            ) *
                                                                scaleUp.sizeDecrement) /
                                                            100))
                                          )
                                    : 1,
                                opacity: isZoomedIn
                                    ? selectedIndex !== index
                                        ? 0.2
                                        : 1
                                    : !isZoomedIn &&
                                        hoveredIndex !== null &&
                                        hoveredIndex !== index
                                      ? 0.5
                                      : 1,
                                x:
                                    isZoomedIn && containerRef.current
                                        ? (() => {
                                              const selectedScale = scaleUp.maxScale / 100
                                              const scaledWidth = baseSize.width * selectedScale
                                              const zoomedGap = settings.gap * 2

                                              if (selectedIndex === index) {
                                                  // Center the selected card
                                                  return -baseSize.width / 2
                                              } else {
                                                  // Position other cards relative to the selected one
                                                  const offset =
                                                      (index - selectedIndex) *
                                                      (scaledWidth + zoomedGap)
                                                  return (
                                                      -baseSize.width / 2 +
                                                      offset
                                                  )
                                              }
                                          })()
                                        : 0,
                                y: isZoomedIn ? -baseSize.height / 2 : 0,
                            }}
                            transition={{
                                duration: scaleUp.time,
                                ease: scaleUp.easing as Easing,
                                opacity: isZoomedIn
                                    ? { duration: scaleUp.time }
                                    : { duration: 0 },
                            }}
                            drag={
                                isZoomedIn && selectedIndex === index
                                    ? "x"
                                    : false
                            }
                            dragConstraints={{ left: -100, right: 100 }}
                            dragElastic={0.1}
                            dragMomentum={false}
                            onDragEnd={(e, info) => {
                                if (!isZoomedIn || selectedIndex !== index)
                                    return

                                const swipeThreshold = 30
                                const swipeVelocityThreshold = 300

                                // Check if swipe was significant enough
                                if (
                                    Math.abs(info.offset.x) > swipeThreshold ||
                                    Math.abs(info.velocity.x) >
                                        swipeVelocityThreshold
                                ) {
                                    if (
                                        info.offset.x > 0 ||
                                        info.velocity.x > 0
                                    ) {
                                        // Swiped right, go to previous
                                        goToPrevious()
                                    } else {
                                        // Swiped left, go to next
                                        goToNext()
                                    }
                                }
                            }}
                            whileHover={
                                !isZoomedIn ? { scale: 1.05 } : undefined
                            }
                            whileTap={!isZoomedIn ? { scale: 0.95 } : undefined}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleImageClick(index)
                            }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <img
                                src={activeImage.src}
                                alt={activeImage.alt}
                                srcSet={activeImage.srcSet}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    WebkitBackfaceVisibility: "hidden",
                                    backfaceVisibility: "hidden",
                                    transform: "translateZ(0)",
                                    WebkitFontSmoothing: "antialiased",
                                    MozOsxFontSmoothing: "grayscale",
                                    imageRendering: "auto",
                                }}
                            />

                            {/* Sub-images thumbnails - shown when zoomed and sub-images exist */}
                            {subImages.enabled &&
                                isZoomedIn &&
                                selectedIndex === index &&
                                hasSubImages && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            ...(subImages.position === "bottom" && {
                                                bottom: 10,
                                                left: subImages.alignmentX === "flex-start" ? 10 : subImages.alignmentX === "center" ? "50%" : "auto",
                                                right: subImages.alignmentX === "flex-end" ? 10 : "auto",
                                                transform: subImages.alignmentX === "center" ? "translateX(-50%)" : "none",
                                                flexDirection: "row",
                                            }),
                                            ...(subImages.position === "top" && {
                                                top: 10,
                                                left: subImages.alignmentX === "flex-start" ? 10 : subImages.alignmentX === "center" ? "50%" : "auto",
                                                right: subImages.alignmentX === "flex-end" ? 10 : "auto",
                                                transform: subImages.alignmentX === "center" ? "translateX(-50%)" : "none",
                                                flexDirection: "row",
                                            }),
                                            ...(subImages.position === "left" && {
                                                left: 10,
                                                top: subImages.alignmentY === "flex-start" ? 10 : subImages.alignmentY === "center" ? "50%" : "auto",
                                                bottom: subImages.alignmentY === "flex-end" ? 10 : "auto",
                                                transform: subImages.alignmentY === "center" ? "translateY(-50%)" : "none",
                                                flexDirection: "column",
                                            }),
                                            ...(subImages.position === "right" && {
                                                right: 10,
                                                top: subImages.alignmentY === "flex-start" ? 10 : subImages.alignmentY === "center" ? "50%" : "auto",
                                                bottom: subImages.alignmentY === "flex-end" ? 10 : "auto",
                                                transform: subImages.alignmentY === "center" ? "translateY(-50%)" : "none",
                                                flexDirection: "column",
                                            }),
                                            display: "flex",
                                            gap: subImages.gap,
                                            zIndex: 20,
                                            pointerEvents: "auto",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Main image thumbnail */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleSubImageClick(index, 0)
                                            }}
                                            style={{
                                                width: subImages.size,
                                                height: subImages.size,
                                                borderRadius: subImages.radius,
                                                overflow: "hidden",
                                                cursor: "pointer",
                                                opacity: currentSubImageIndex === 0 ? 1 : subImages.inactiveOpacity,
                                                filter: currentSubImageIndex === 0 ? "none" : "grayscale(100%)",
                                                transition: "all 0.3s ease",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <img
                                                src={imageData.src}
                                                alt={imageData.alt}
                                                srcSet={imageData.srcSet}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        </div>
                                        {/* Sub-image thumbnails */}
                                        {item.subImages.map((img, subIndex) => {
                                            const isActive = currentSubImageIndex === subIndex + 1
                                            return (
                                                <div
                                                    key={subIndex}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleSubImageClick(index, subIndex + 1)
                                                    }}
                                                    style={{
                                                        width: subImages.size,
                                                        height: subImages.size,
                                                        borderRadius: subImages.radius,
                                                        overflow: "hidden",
                                                        cursor: "pointer",
                                                        opacity: isActive ? 1 : subImages.inactiveOpacity,
                                                        filter: isActive ? "none" : "grayscale(100%)",
                                                        transition: "all 0.3s ease",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <img
                                                        src={img.src}
                                                        alt={img.alt}
                                                        srcSet={img.srcSet}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                        }}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* Sub-images thumbnails - positioned independently */}
            {subImages.enabled &&
                isZoomedIn &&
                selectedIndex !== null &&
                displayItems[selectedIndex]?.subImages &&
                displayItems[selectedIndex].subImages.length > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            top:
                                subImages.alignmentY === "flex-start"
                                    ? 20
                                    : subImages.alignmentY === "center"
                                      ? "50%"
                                      : "auto",
                            bottom: subImages.alignmentY === "flex-end" ? 20 : "auto",
                            left:
                                subImages.alignmentX === "flex-start"
                                    ? 20
                                    : subImages.alignmentX === "center"
                                      ? "50%"
                                      : "auto",
                            right: subImages.alignmentX === "flex-end" ? 20 : "auto",
                            transform:
                                subImages.alignmentX === "center" && subImages.alignmentY === "center"
                                    ? "translate(-50%, -50%)"
                                    : subImages.alignmentX === "center"
                                      ? "translateX(-50%)"
                                      : subImages.alignmentY === "center"
                                        ? "translateY(-50%)"
                                        : "none",
                            display: "flex",
                            gap: subImages.gap,
                            zIndex: 15,
                            pointerEvents: "auto",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Main image thumbnail */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation()
                                handleSubImageClick(selectedIndex, 0)
                            }}
                            style={{
                                width: subImages.size,
                                height: subImages.size,
                                borderRadius: subImages.radius,
                                overflow: "hidden",
                                cursor: "pointer",
                                opacity: activeSubImageIndex[selectedIndex] === 0 ? 1 : subImages.inactiveOpacity,
                                filter: activeSubImageIndex[selectedIndex] === 0 ? "none" : "grayscale(100%)",
                                transition: "all 0.3s ease",
                                flexShrink: 0,
                            }}
                        >
                            <img
                                src={displayItems[selectedIndex].image.src}
                                alt={displayItems[selectedIndex].image.alt}
                                srcSet={displayItems[selectedIndex].image.srcSet}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </div>
                        {/* Sub-image thumbnails */}
                        {displayItems[selectedIndex].subImages.map((img, subIndex) => {
                            const isActive = activeSubImageIndex[selectedIndex] === subIndex + 1
                            return (
                                <div
                                    key={subIndex}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleSubImageClick(selectedIndex, subIndex + 1)
                                    }}
                                    style={{
                                        width: subImages.size,
                                        height: subImages.size,
                                        borderRadius: subImages.radius,
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        opacity: isActive ? 1 : subImages.inactiveOpacity,
                                        filter: isActive ? "none" : "grayscale(100%)",
                                        transition: "all 0.3s ease",
                                        flexShrink: 0,
                                    }}
                                >
                                    <img
                                        src={img.src}
                                        alt={img.alt}
                                        srcSet={img.srcSet}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                )}

            {/* Product Info Display */}
            <AnimatePresence>
                {showProductInfo &&
                    selectedIndex !== null &&
                    description.enabled && (
                        <motion.div
                            ref={descriptionRef}
                            initial={
                                description.animation === "instant"
                                    ? { opacity: 1, y: 0 }
                                    : description.animation === "fade"
                                      ? { opacity: 0, y: 0 }
                                      : { opacity: 0, y: 20 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={
                                description.animation === "instant"
                                    ? { opacity: 1, y: 0 }
                                    : description.animation === "fade"
                                      ? { opacity: 0, y: 0 }
                                      : { opacity: 0, y: 20 }
                            }
                            transition={
                                description.animation === "instant"
                                    ? { duration: 0 }
                                    : { duration: 0.3 }
                            }
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                position: "absolute",
                                top:
                                    description.alignmentY === "flex-start"
                                        ? 20
                                        : description.alignmentY === "center"
                                          ? (() => {
                                                if (
                                                    containerRef.current &&
                                                    descriptionDimensions.height >
                                                        0
                                                ) {
                                                    const containerRect =
                                                        containerRef.current.getBoundingClientRect()
                                                    const containerCenter =
                                                        containerRect.height / 2
                                                    const cardHalfHeight =
                                                        descriptionDimensions.height /
                                                        2
                                                    return (
                                                        containerCenter -
                                                        cardHalfHeight
                                                    )
                                                }
                                                return "50%"
                                            })()
                                          : "auto",
                                bottom:
                                    description.alignmentY === "flex-end"
                                        ? 20
                                        : "auto",
                                left:
                                    description.alignmentX === "flex-start"
                                        ? 20
                                        : description.alignmentX === "center"
                                          ? (() => {
                                                if (
                                                    containerRef.current &&
                                                    descriptionDimensions.width >
                                                        0
                                                ) {
                                                    const containerRect =
                                                        containerRef.current
                                                            .getBoundingClientRect()
                                                    const containerCenter =
                                                        containerRect.width / 2
                                                    const cardHalfWidth =
                                                        descriptionDimensions.width /
                                                        2
                                                    return (
                                                        containerCenter -
                                                        cardHalfWidth
                                                    )
                                                }
                                                return "50%"
                                            })()
                                          : "auto",
                                right:
                                    description.alignmentX === "flex-end"
                                        ? 20
                                        : "auto",
                                transform: "none",
                                backgroundColor:
                                    description.container.background,
                                padding: description.container.padding,
                                borderRadius: description.container.radius,
                                width:
                                    description.container.fill === "fill"
                                        ? (() => {
                                              if (containerRef.current) {
                                                  const containerWidth =
                                                      containerRef.current
                                                          .offsetWidth
                                                  const totalPadding =
                                                      settings.gap * 2
                                                  return `${containerWidth - totalPadding}px`
                                              }
                                              return "100%"
                                          })()
                                        : description.container.fill === "fixed"
                                          ? `${description.container.width}px`
                                          : description.container.fill ===
                                              "relative"
                                            ? (() => {
                                                  if (containerRef.current) {
                                                      const containerWidth =
                                                          containerRef.current
                                                              .offsetWidth
                                                      const relativeWidth =
                                                          (containerWidth *
                                                              description
                                                                  .container
                                                                  .width) /
                                                          100
                                                      return `${relativeWidth}px`
                                                  }
                                                  return "100%"
                                              })()
                                            : "fit-content",
                                zIndex:
                                    description.position === "front" ? 10 : 1,
                                display: "flex",
                                flexDirection: "column",
                                gap: description.container.gap,
                                border:
                                    description.container.borderWidth > 0
                                        ? `${description.container.borderWidth}px ${description.container.borderStyle} ${description.container.borderColor}`
                                        : "none",
                            }}
                        >
                            {displayItems[selectedIndex]?.productInfo && description.text.textOrder.map((element) => {
                                if (element === "title") {
                                    const titleAnimationVariants = {
                                        shimmer: {
                                            initial: { opacity: 1, y: 0 },
                                            animate: { opacity: 1, y: 0 },
                                            exit: { opacity: 1, y: 0 },
                                        },
                                        instant: {
                                            initial: { opacity: 1, y: 0 },
                                            animate: { opacity: 1, y: 0 },
                                            exit: { opacity: 1, y: 0 },
                                        },
                                        fade: {
                                            initial: { opacity: 0, y: 0 },
                                            animate: { opacity: 1, y: 0 },
                                            exit: { opacity: 0, y: 0 },
                                        },
                                        moveIn: {
                                            initial: { opacity: 0, y: -10 },
                                            animate: { opacity: 1, y: 0 },
                                            exit: { opacity: 0, y: 10 },
                                        },
                                    }

                                    const currentAnimation =
                                        titleAnimationVariants[
                                            description.text.titleAnimation
                                        ]
                                    const isShimmer =
                                        description.text.titleAnimation ===
                                        "shimmer"
                                    const isInstant =
                                        description.text.titleAnimation ===
                                        "instant"

                                    return (
                                        <AnimatePresence
                                            mode="wait"
                                            key="title-wrapper"
                                        >
                                            <motion.h3
                                                key={`title-${selectedIndex}`}
                                                initial={
                                                    currentAnimation.initial
                                                }
                                                animate={
                                                    isShimmer
                                                        ? {
                                                              opacity: 1,
                                                              y: 0,
                                                              backgroundPosition:
                                                                  [
                                                                      "0% center",
                                                                      "200% center",
                                                                  ],
                                                          }
                                                        : currentAnimation.animate
                                                }
                                                exit={currentAnimation.exit}
                                                transition={
                                                    isInstant
                                                        ? { duration: 0 }
                                                        : isShimmer
                                                          ? {
                                                                duration: 1.2,
                                                                backgroundPosition:
                                                                    {
                                                                        duration: 1.2,
                                                                        ease: "linear",
                                                                        delay: 0.1,
                                                                    },
                                                            }
                                                          : { duration: 0.3 }
                                                }
                                                style={{
                                                    margin: 0,
                                                    ...description.text
                                                        .titleFont,
                                                    ...(isShimmer
                                                        ? {
                                                              background: `linear-gradient(90deg, ${description.text.titleColor} 0%, ${description.text.titleColor} 40%, rgba(255,255,255,0.9) 50%, ${description.text.titleColor} 60%, ${description.text.titleColor} 100%)`,
                                                              backgroundSize:
                                                                  "200% 100%",
                                                              backgroundPosition:
                                                                  "0% center",
                                                              WebkitBackgroundClip:
                                                                  "text",
                                                              WebkitTextFillColor:
                                                                  "transparent",
                                                              backgroundClip:
                                                                  "text",
                                                              color: "transparent",
                                                          }
                                                        : {
                                                              color: description
                                                                  .text
                                                                  .titleColor,
                                                          }),
                                                    textAlign:
                                                        description.text
                                                            .textAlign,
                                                }}
                                            >
                                                {
                                                    displayItems[selectedIndex]
                                                        .productInfo.title
                                                }
                                            </motion.h3>
                                        </AnimatePresence>
                                    )
                                } else if (element === "description") {
                                    return (
                                        <AnimatePresence
                                            mode="wait"
                                            key="description-wrapper"
                                        >
                                            <motion.div
                                                key={`description-${selectedIndex}`}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.3 }}
                                                style={{
                                                    margin: 0,
                                                    ...description.text
                                                        .descriptionFont,
                                                    color: description.text
                                                        .descriptionColor,
                                                    textAlign:
                                                        description.text
                                                            .textAlign,
                                                }}
                                            >
                                                {
                                                    displayItems[selectedIndex]
                                                        .productInfo.description
                                                }
                                            </motion.div>
                                        </AnimatePresence>
                                    )
                                } else if (element === "price") {
                                    return (
                                        <AnimatePresence
                                            mode="wait"
                                            key="price-wrapper"
                                        >
                                            <motion.div
                                                key={`price-${selectedIndex}`}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.3 }}
                                                style={{
                                                    margin: 0,
                                                    ...description.text
                                                        .priceFont,
                                                    color: description.text
                                                        .priceColor,
                                                    textAlign:
                                                        description.text
                                                            .textAlign,
                                                }}
                                            >
                                                {(() => {
                                                    const basePrice = displayItems[selectedIndex].productInfo.price
                                                    const variants1 = displayItems[selectedIndex].variants1
                                                    const variants2 = displayItems[selectedIndex].variants2
                                                    const currentVariant1Index = activeVariantIndex[selectedIndex]
                                                    const currentVariant2Index = activeVariant2Index[selectedIndex]
                                                    
                                                    let totalPriceChange = 0
                                                    
                                                    if (variants1 && variants1.length > 0 && currentVariant1Index > 0) {
                                                        const variant = variants1[currentVariant1Index - 1]
                                                        totalPriceChange += variant.priceChange
                                                    }
                                                    
                                                    if (variants2 && variants2.length > 0 && currentVariant2Index > 0) {
                                                        const variant = variants2[currentVariant2Index - 1]
                                                        totalPriceChange += variant.priceChange
                                                    }
                                                    
                                                    if (totalPriceChange !== 0) {
                                                        const priceMatch = basePrice.match(/[\d,.]+/)
                                                        if (priceMatch) {
                                                            const numericPrice = parseFloat(priceMatch[0].replace(/,/g, ''))
                                                            const newPrice = numericPrice + totalPriceChange
                                                            const formattedPrice = basePrice.replace(/[\d,.]+/, newPrice.toFixed(2))
                                                            return formattedPrice
                                                        }
                                                    }
                                                    return basePrice
                                                })()}
                                            </motion.div>
                                        </AnimatePresence>
                                    )
                                } else if (element === "variants1") {
                                    return null
                                } else if (element === "variants2") {
                                    return null
                                }
                                return null
                            })}

                            {/* Variants 1 - Always show if enabled and variants exist */}
                            {variants.enabled &&
                                displayItems[selectedIndex]?.variants1 &&
                                displayItems[selectedIndex].variants1.length > 0 && (
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`variants1-${selectedIndex}`}
                                            initial={
                                                description.animation === "instant"
                                                    ? { opacity: 1, y: 0 }
                                                    : description.animation === "fade"
                                                      ? { opacity: 0, y: 0 }
                                                      : { opacity: 0, y: 20 }
                                            }
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={
                                                description.animation === "instant"
                                                    ? { opacity: 1, y: 0 }
                                                    : description.animation === "fade"
                                                      ? { opacity: 0, y: 0 }
                                                      : { opacity: 0, y: 20 }
                                            }
                                            transition={
                                                description.animation === "instant"
                                                    ? { duration: 0 }
                                                    : { duration: 0.3 }
                                            }
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: variants.gap,
                                            }}
                                        >
                                            {displayItems[selectedIndex].variants1.map((variant, variantIndex) => {
                                                const isActive = activeVariantIndex[selectedIndex] === variantIndex + 1
                                                const isHovered = hoveredVariantIndex === variantIndex
                                                return (
                                                    <div
                                                        key={variantIndex}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleVariantClick(selectedIndex, isActive ? 0 : variantIndex + 1)
                                                        }}
                                                        onMouseEnter={() => setHoveredVariantIndex(variantIndex)}
                                                        onMouseLeave={() => setHoveredVariantIndex(null)}
                                                        style={{
                                                            padding: variants.padding,
                                                            borderRadius: variants.radius,
                                                            border: `${variants.borderWidth}px ${isActive ? "solid" : "dotted"} ${
                                                                isActive 
                                                                    ? variants.active.borderColor 
                                                                    : isHovered 
                                                                        ? variants.hover.borderColor 
                                                                        : variants.borderColor
                                                            }`,
                                                            backgroundColor: isActive 
                                                                ? variants.active.background 
                                                                : isHovered 
                                                                    ? variants.hover.background 
                                                                    : variants.background,
                                                            color: isActive 
                                                                ? variants.active.textColor 
                                                                : isHovered 
                                                                    ? variants.hover.textColor 
                                                                    : variants.textColor,
                                                            cursor: "pointer",
                                                            transition: "all 0.2s ease",
                                                            ...variants.font,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 8,
                                                            opacity: isHovered ? variants.hover.opacity : 1,
                                                            transform: isHovered ? `scale(${variants.hover.scale})` : "scale(1)",
                                                        }}
                                                    >
                                                        {variant.image && (
                                                            <img
                                                                src={variant.image.src}
                                                                alt={variant.image.alt}
                                                                srcSet={variant.image.srcSet}
                                                                style={{
                                                                    width: 20,
                                                                    height: 20,
                                                                    objectFit: "cover",
                                                                    borderRadius: 4,
                                                                }}
                                                            />
                                                        )}
                                                        <span>{variant.name}</span>
                                                    </div>
                                                )
                                            })}
                                        </motion.div>
                                    </AnimatePresence>
                                )}

                            {/* Variants 2 - Always show if enabled and variants exist */}
                            {variants.enabled &&
                                displayItems[selectedIndex]?.variants2 &&
                                displayItems[selectedIndex].variants2.length > 0 && (
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`variants2-${selectedIndex}`}
                                            initial={
                                                description.animation === "instant"
                                                    ? { opacity: 1, y: 0 }
                                                    : description.animation === "fade"
                                                      ? { opacity: 0, y: 0 }
                                                      : { opacity: 0, y: 20 }
                                            }
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={
                                                description.animation === "instant"
                                                    ? { opacity: 1, y: 0 }
                                                    : description.animation === "fade"
                                                      ? { opacity: 0, y: 0 }
                                                      : { opacity: 0, y: 20 }
                                            }
                                            transition={
                                                description.animation === "instant"
                                                    ? { duration: 0 }
                                                    : { duration: 0.3 }
                                            }
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: variants.gap,
                                            }}
                                        >
                                            {displayItems[selectedIndex].variants2.map((variant, variantIndex) => {
                                                const isActive = activeVariant2Index[selectedIndex] === variantIndex + 1
                                                const isHovered = hoveredVariantIndex === variantIndex + 100
                                                return (
                                                    <div
                                                        key={variantIndex}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleVariant2Click(selectedIndex, isActive ? 0 : variantIndex + 1)
                                                        }}
                                                        onMouseEnter={() => setHoveredVariantIndex(variantIndex + 100)}
                                                        onMouseLeave={() => setHoveredVariantIndex(null)}
                                                        style={{
                                                            padding: variants.padding,
                                                            borderRadius: variants.radius,
                                                            border: `${variants.borderWidth}px ${isActive ? "solid" : "dotted"} ${
                                                                isActive 
                                                                    ? variants.active.borderColor 
                                                                    : isHovered 
                                                                        ? variants.hover.borderColor 
                                                                        : variants.borderColor
                                                            }`,
                                                            backgroundColor: isActive 
                                                                ? variants.active.background 
                                                                : isHovered 
                                                                    ? variants.hover.background 
                                                                    : variants.background,
                                                            color: isActive 
                                                                ? variants.active.textColor 
                                                                : isHovered 
                                                                    ? variants.hover.textColor 
                                                                    : variants.textColor,
                                                            cursor: "pointer",
                                                            transition: "all 0.2s ease",
                                                            ...variants.font,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 8,
                                                            opacity: isHovered ? variants.hover.opacity : 1,
                                                            transform: isHovered ? `scale(${variants.hover.scale})` : "scale(1)",
                                                        }}
                                                    >
                                                        {variant.image && (
                                                            <img
                                                                src={variant.image.src}
                                                                alt={variant.image.alt}
                                                                srcSet={variant.image.srcSet}
                                                                style={{
                                                                    width: 20,
                                                                    height: 20,
                                                                    objectFit: "cover",
                                                                    borderRadius: 4,
                                                                }}
                                                            />
                                                        )}
                                                        <span>{variant.name}</span>
                                                    </div>
                                                )
                                            })}
                                        </motion.div>
                                    </AnimatePresence>
                                )}

                            {description.button.enabled && 
                             ((description.button.linkType === "individual" && displayItems[selectedIndex]?.buttonLink) || 
                              (description.button.linkType === "global" && description.button.globalLink)) && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            description.text.textAlign ===
                                            "left"
                                                ? "flex-start"
                                                : description.text.textAlign ===
                                                    "center"
                                                  ? "center"
                                                  : "flex-end",
                                        marginTop:
                                            description.container.gap * 0.5,
                                    }}
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={`button-${selectedIndex}`}
                                            initial={
                                                description.animation ===
                                                "instant"
                                                    ? { opacity: 1, y: 0 }
                                                    : description.animation ===
                                                        "fade"
                                                      ? { opacity: 0, y: 0 }
                                                      : { opacity: 0, y: 20 }
                                            }
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={
                                                description.animation ===
                                                "instant"
                                                    ? { opacity: 1, y: 0 }
                                                    : description.animation ===
                                                        "fade"
                                                      ? { opacity: 0, y: 0 }
                                                      : { opacity: 0, y: 20 }
                                            }
                                            transition={
                                                description.animation ===
                                                "instant"
                                                    ? { duration: 0 }
                                                    : { duration: 0.3 }
                                            }
                                            style={{
                                                width:
                                                    description.button.fill ===
                                                    "fill"
                                                        ? "100%"
                                                        : description.button
                                                                .fill ===
                                                            "fixed"
                                                          ? `${description.button.width}px`
                                                          : "fit-content",
                                            }}
                                        >
                                            {((description.button.linkType === "individual" && displayItems[selectedIndex].buttonLink) || 
                                              (description.button.linkType === "global" && description.button.globalLink)) ? (
                                                <a
                                                    href={
                                                        description.button.linkType === "individual" 
                                                            ? displayItems[selectedIndex].buttonLink
                                                            : description.button.globalLink
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onMouseEnter={() =>
                                                        setIsButtonHovered(true)
                                                    }
                                                    onMouseLeave={() =>
                                                        setIsButtonHovered(
                                                            false
                                                        )
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            description.button.type === "primary"
                                                                ? isButtonHovered
                                                                    ? description.button.hover.background
                                                                    : description.button.background
                                                                : "transparent",
                                                        color: isButtonHovered
                                                            ? description.button
                                                                  .hover
                                                                  .textColor
                                                            : description.button
                                                                  .textColor,
                                                        border: description.button.type === "secondary"
                                                            ? `${description.button.borderWidth}px solid ${isButtonHovered ? description.button.hover.borderColor : description.button.borderColor}`
                                                            : "none",
                                                        borderRadius:
                                                            description.button
                                                                .radius,
                                                        padding:
                                                            description.button
                                                                .padding,
                                                        cursor: "pointer",
                                                        width: "100%",
                                                        textDecoration: description.button.type === "tertiary" ? "underline" : "none",
                                                        textDecorationThickness: description.button.type === "tertiary" ? `${description.button.underlineThickness}px` : undefined,
                                                        textUnderlineOffset: description.button.type === "tertiary" ? "4px" : undefined,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        gap: description.button
                                                            .icon.enabled
                                                            ? description.button
                                                                  .icon.gap
                                                            : 0,
                                                        flexDirection:
                                                            description.button
                                                                .icon
                                                                .placement ===
                                                            "left"
                                                                ? "row"
                                                                : "row-reverse",
                                                        textAlign: "center",
                                                        opacity: isButtonHovered
                                                            ? description.button
                                                                  .hover.opacity
                                                            : 1,
                                                        transform:
                                                            isButtonHovered
                                                                ? `scale(${description.button.hover.scale})`
                                                                : "scale(1)",
                                                        transition:
                                                            "all 0.2s ease",
                                                        pointerEvents: "auto",
                                                        ...description.button
                                                            .font,
                                                    }}
                                                >
                                                    {description.button.icon
                                                        .enabled && (
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                width: description
                                                                    .button.icon
                                                                    .size,
                                                                height: description
                                                                    .button.icon
                                                                    .size,
                                                                flexShrink: 0,
                                                            }}
                                                            dangerouslySetInnerHTML={{
                                                                __html: description
                                                                    .button.icon
                                                                    .svg,
                                                            }}
                                                        />
                                                    )}
                                                    <span>
                                                        {
                                                            description.button
                                                                .label
                                                        }
                                                    </span>
                                                </a>
                                            ) : (
                                                <button
                                                    onMouseEnter={() =>
                                                        setIsButtonHovered(true)
                                                    }
                                                    onMouseLeave={() =>
                                                        setIsButtonHovered(
                                                            false
                                                        )
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            description.button.type === "primary"
                                                                ? isButtonHovered
                                                                    ? description.button.hover.background
                                                                    : description.button.background
                                                                : "transparent",
                                                        color: isButtonHovered
                                                            ? description.button
                                                                  .hover
                                                                  .textColor
                                                            : description.button
                                                                  .textColor,
                                                        border: description.button.type === "secondary"
                                                            ? `${description.button.borderWidth}px solid ${isButtonHovered ? description.button.hover.borderColor : description.button.borderColor}`
                                                            : "none",
                                                        borderRadius:
                                                            description.button
                                                                .radius,
                                                        padding:
                                                            description.button
                                                                .padding,
                                                        cursor: "pointer",
                                                        width: "100%",
                                                        textDecoration: description.button.type === "tertiary" ? "underline" : "none",
                                                        textDecorationThickness: description.button.type === "tertiary" ? `${description.button.underlineThickness}px` : undefined,
                                                        textUnderlineOffset: description.button.type === "tertiary" ? "4px" : undefined,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        gap: description.button
                                                            .icon.enabled
                                                            ? description.button
                                                                  .icon.gap
                                                            : 0,
                                                        flexDirection:
                                                            description.button
                                                                .icon
                                                                .placement ===
                                                            "left"
                                                                ? "row"
                                                                : "row-reverse",
                                                        textAlign: "center",
                                                        opacity: isButtonHovered
                                                            ? description.button
                                                                  .hover.opacity
                                                            : 1,
                                                        transform:
                                                            isButtonHovered
                                                                ? `scale(${description.button.hover.scale})`
                                                                : "scale(1)",
                                                        transition:
                                                            "all 0.2s ease",
                                                        pointerEvents: "auto",
                                                        ...description.button
                                                            .font,
                                                    }}
                                                >
                                                    {description.button.icon
                                                        .enabled && (
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                width: description
                                                                    .button.icon
                                                                    .size,
                                                                height: description
                                                                    .button.icon
                                                                    .size,
                                                                flexShrink: 0,
                                                            }}
                                                            dangerouslySetInnerHTML={{
                                                                __html: description
                                                                    .button.icon
                                                                    .svg,
                                                            }}
                                                        />
                                                    )}
                                                    <span>
                                                        {
                                                            description.button
                                                                .label
                                                        }
                                                    </span>
                                                </button>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(ProductSlideshow, {
    items: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                subImages: {
                    type: ControlType.Array,
                    title: "Sub Images",
                    control: {
                        type: ControlType.ResponsiveImage,
                    },
                    maxCount: 10,
                },
                productInfo: {
                    type: ControlType.Object,
                    title: "Product Info",
                    optional: true,
                    controls: {
                        title: {
                            type: ControlType.String,
                            title: "Title",
                            defaultValue: "Product Name",
                        },
                        description: {
                            type: ControlType.String,
                            title: "Description",
                            defaultValue: "",
                            displayTextArea: true,
                        },
                        price: {
                            type: ControlType.String,
                            title: "Price",
                            defaultValue: "$99.00",
                        },
                    },
                },
                variants1: {
                    type: ControlType.Array,
                    title: "Variants 1",
                    control: {
                        type: ControlType.Object,
                        controls: {
                            name: {
                                type: ControlType.String,
                                title: "Name",
                                defaultValue: "Variant 1",
                            },
                            priceChange: {
                                type: ControlType.Number,
                                title: "Price Change",
                                defaultValue: 0,
                                min: -10000,
                                max: 10000,
                                step: 0.01,
                                displayStepper: true,
                            },
                            image: {
                                type: ControlType.ResponsiveImage,
                                title: "Image (Optional)",
                            },
                        },
                    },
                    maxCount: 10,
                },
                variants2: {
                    type: ControlType.Array,
                    title: "Variants 2",
                    control: {
                        type: ControlType.Object,
                        controls: {
                            name: {
                                type: ControlType.String,
                                title: "Name",
                                defaultValue: "Variant 2",
                            },
                            priceChange: {
                                type: ControlType.Number,
                                title: "Price Change",
                                defaultValue: 0,
                                min: -10000,
                                max: 10000,
                                step: 0.01,
                                displayStepper: true,
                            },
                            image: {
                                type: ControlType.ResponsiveImage,
                                title: "Image (Optional)",
                            },
                        },
                    },
                    maxCount: 10,
                },
                buttonLink: {
                    type: ControlType.Link,
                    title: "Button Link",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
                productInfo: {
                    title: "Éclipse Satin Blazer",
                    description:
                        "A tailored, midnight-black satin blazer with structured shoulders and refined lapels, perfect for evening elegance",
                    price: "$780",
                },
                buttonLink: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
                productInfo: {
                    title: "Lumen Silk Slip Dress",
                    description:
                        "Fluid, bias-cut silk dress with a subtle metallic sheen and minimalist silhouette for a polished, contemporary look",
                    price: "$999",
                },
                buttonLink: "",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                productInfo: {
                    title: "Vérité Cashmere Suit",
                    description:
                        "Sumptuously soft cashmere knit with a relaxed fit and elongated cuffs, ideal for layering in transitional seasons",
                    price: "$450",
                },
                buttonLink: "",
            },
        ],
    },
    baseSize: {
        type: ControlType.Object,
        title: "Base Size",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 200,
                min: 50,
                max: 2000,
                step: 10,
                unit: "px",
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 250,
                min: 50,
                max: 600,
                step: 10,
                unit: "px",
            },
        },
    },
    scaleUp: {
        type: ControlType.Object,
        title: "Scale up",
        controls: {
            maxScale: {
                type: ControlType.Number,
                title: "Max Scale",
                defaultValue: 200,
                min: 20,
                max: 500,
                step: 5,
                unit: "%",
            },
            time: {
                type: ControlType.Number,
                title: "Time",
                defaultValue: 0.5,
                min: 0.1,
                max: 2,
                step: 0.1,
                unit: "s",
            },
            easing: {
                type: ControlType.Enum,
                title: "Easing",
                defaultValue: "easeInOut",
                options: [
                    "linear",
                    "easeIn",
                    "easeOut",
                    "easeInOut",
                    "circIn",
                    "circOut",
                    "circInOut",
                    "backIn",
                    "backOut",
                    "backInOut",
                ],
                optionTitles: [
                    "Linear",
                    "Ease In",
                    "Ease Out",
                    "Ease In Out",
                    "Circ In",
                    "Circ Out",
                    "Circ In Out",
                    "Back In",
                    "Back Out",
                    "Back In Out",
                ],
            },
            sizeDecrement: {
                type: ControlType.Number,
                title: "Size Decrement",
                defaultValue: 15,
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
            },
        },
    },
    subImages: {
        type: ControlType.Object,
        title: "Sub Images",
        description: "Configure sub-image thumbnails",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 32,
                min: 16,
                max: 150,
                step: 5,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 4,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
            },
            alignmentX: {
                type: ControlType.Enum,
                title: "Align X",
                defaultValue: "center",
                options: ["flex-start", "center", "flex-end"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
            },
            alignmentY: {
                type: ControlType.Enum,
                title: "Align Y",
                defaultValue: "flex-end",
                options: ["flex-start", "center", "flex-end"],
                optionTitles: ["Top", "Center", "Bottom"],
                displaySegmentedControl: true,
            },
            inactiveOpacity: {
                type: ControlType.Number,
                title: "Inactive Opacity",
                defaultValue: 0.5,
                min: 0,
                max: 1,
                step: 0.1,
            },
        },
    },
    variants: {
        type: ControlType.Object,
        title: "Variants",
        description: "Configure product variant appearance",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "transparent",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#BCB7C9",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: 2,
                min: 0,
                max: 10,
                step: 1,
                unit: "px",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#BCB7C9",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 8,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 12,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 8,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
            },
            active: {
                type: ControlType.Object,
                title: "Active State",
                controls: {
                    background: {
                        type: ControlType.Color,
                        title: "Background",
                        defaultValue: "transparent",
                    },
                    textColor: {
                        type: ControlType.Color,
                        title: "Text Color",
                        defaultValue: "#FFFFFF",
                    },
                    borderColor: {
                        type: ControlType.Color,
                        title: "Border Color",
                        defaultValue: "#000000",
                    },
                },
            },
            hover: {
                type: ControlType.Object,
                title: "Hover State",
                controls: {
                    background: {
                        type: ControlType.Color,
                        title: "Background",
                        defaultValue: "transparent",
                    },
                    textColor: {
                        type: ControlType.Color,
                        title: "Text Color",
                        defaultValue: "#000000",
                    },
                    borderColor: {
                        type: ControlType.Color,
                        title: "Border Color",
                        defaultValue: "#000000",
                    },
                    opacity: {
                        type: ControlType.Number,
                        title: "Opacity",
                        defaultValue: 1,
                        min: 0,
                        max: 1,
                        step: 0.1,
                    },
                    scale: {
                        type: ControlType.Number,
                        title: "Scale",
                        defaultValue: 0.98,
                        min: 0.8,
                        max: 1.2,
                        step: 0.01,
                    },
                },
            },
        },
    },
    description: {
        type: ControlType.Object,
        title: "Description",
        description: "Customize how Image info appears",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                defaultValue: "front",
                options: ["front", "behind"],
                optionTitles: ["Front", "Behind"],
                displaySegmentedControl: true,
            },
            animation: {
                type: ControlType.Enum,
                title: "Animation",
                defaultValue: "fade",
                options: ["instant", "fade", "moveIn"],
                optionTitles: ["Instant", "Fade", "Move In"],
            },
            text: {
                type: ControlType.Object,
                title: "Text",
                controls: {
                    titleFont: {
                        type: ControlType.Font,
                        title: "Title Font",
                        controls: "extended",
                        defaultFontType: "sans-serif",
                        defaultValue: {
                            fontSize: "22px",
                            variant: "Semibold",
                            letterSpacing: "-0.01em",
                            lineHeight: "1.2em",
                        },
                    },
                    titleColor: {
                        type: ControlType.Color,
                        title: "Title Color",
                        defaultValue: "#000000",
                    },
                    titleAnimation: {
                        type: ControlType.Enum,
                        title: "Title Animation",
                        defaultValue: "fade",
                        options: ["shimmer", "instant", "fade", "moveIn"],
                        optionTitles: ["Shimmer", "Instant", "Fade", "Move In"],
                    },
                    descriptionFont: {
                        type: ControlType.Font,
                        title: "Description Font",
                        controls: "extended",
                        defaultFontType: "sans-serif",
                        defaultValue: {
                            fontSize: "15px",
                            variant: "Regular",
                            letterSpacing: "-0.01em",
                            lineHeight: "1.3em",
                        },
                    },
                    descriptionColor: {
                        type: ControlType.Color,
                        title: "Description Color",
                        defaultValue: "#575757",
                    },
                    priceFont: {
                        type: ControlType.Font,
                        title: "Price Font",
                        controls: "extended",
                        defaultFontType: "sans-serif",
                        defaultValue: {
                            fontSize: "15px",
                            variant: "Semibold",
                            letterSpacing: "-0.01em",
                            lineHeight: "1em",
                        },
                    },
                    priceColor: {
                        type: ControlType.Color,
                        title: "Price Color",
                        defaultValue: "#000000",
                    },
                    textAlign: {
                        type: ControlType.Enum,
                        title: "Text Align",
                        defaultValue: "left",
                        options: ["left", "center", "right"],
                        optionTitles: ["Left", "Center", "Right"],
                        displaySegmentedControl: true,
                    },
                    textOrder: {
                        type: ControlType.Array,
                        title: "Text Order",
                        control: {
                            type: ControlType.Enum,
                            options: ["title", "description", "price", "variants1", "variants2"],
                            optionTitles: ["Title", "Description", "Price", "Variants 1", "Variants 2"],
                        },
                        defaultValue: ["title", "description", "price", "variants1", "variants2"],
                        maxCount: 5,
                    },
                },
            },
            container: {
                type: ControlType.Object,
                title: "Container",
                controls: {
                    background: {
                        type: ControlType.Color,
                        title: "Background",
                        defaultValue: "transparent",
                    },
                    padding: {
                        type: ControlType.Number,
                        title: "Padding",
                        defaultValue: 20,
                        min: 0,
                        max: 50,
                        step: 1,
                        unit: "px",
                    },
                    gap: {
                        type: ControlType.Number,
                        title: "Gap",
                        defaultValue: 20,
                        min: 0,
                        max: 50,
                        step: 1,
                        unit: "px",
                    },
                    fill: {
                        type: ControlType.Enum,
                        title: "Fill",
                        defaultValue: "fixed",
                        options: ["fit", "fixed", "fill", "relative"],
                        optionTitles: ["Fit", "Fixed", "Fill", "Relative"],
                    },
                    width: {
                        type: ControlType.Number,
                        title: "Width",
                        defaultValue: 300,
                        min: 0,
                        max: 2000,
                        step: 1,
                        unit: "px",
                        hidden: (props) => {
                            return (
                                props?.fill !== "fixed" &&
                                props?.fill !== "relative"
                            )
                        },
                    },
                    radius: {
                        type: ControlType.Number,
                        title: "Radius",
                        defaultValue: 8,
                        min: 0,
                        max: 32,
                        step: 1,
                        unit: "px",
                    },
                    borderWidth: {
                        type: ControlType.Number,
                        title: "Border Width",
                        defaultValue: 0,
                        min: 0,
                        max: 10,
                        step: 1,
                        unit: "px",
                    },
                    borderColor: {
                        type: ControlType.Color,
                        title: "Border Color",
                        defaultValue: "#000000",
                    },
                    borderStyle: {
                        type: ControlType.Enum,
                        title: "Border Style",
                        defaultValue: "solid",
                        options: ["solid", "dashed", "dotted"],
                        optionTitles: ["Solid", "Dashed", "Dotted"],
                    },
                },
            },
            button: {
                type: ControlType.Object,
                title: "Button",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Enabled",
                        defaultValue: true,
                        enabledTitle: "On",
                        disabledTitle: "Off",
                    },
                    type: {
                        type: ControlType.Enum,
                        title: "Type",
                        defaultValue: "primary",
                        options: ["primary", "secondary", "tertiary"],
                        optionTitles: ["Primary (Fill)", "Secondary (Outline)", "Tertiary (Underline)"],
                        displaySegmentedControl: false,
                    },
                    linkType: {
                        type: ControlType.Enum,
                        title: "Link Type",
                        defaultValue: "individual",
                        options: ["individual", "global"],
                        optionTitles: ["Individual", "Global"],
                        displaySegmentedControl: true,
                    },
                    globalLink: {
                        type: ControlType.Link,
                        title: "Global Link",
                        defaultValue: "https://framer.com",
                        hidden: (props) => props?.linkType !== "global",
                    },
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Add to Cart",
                    },
                    background: {
                        type: ControlType.Color,
                        title: "Background",
                        defaultValue: "transparent",
                        hidden: (props) => props?.type !== "primary",
                    },
                    textColor: {
                        type: ControlType.Color,
                        title: "Text Color",
                        defaultValue: "#FFFFFF",
                    },
                    font: {
                        type: ControlType.Font,
                        title: "Font",
                        controls: "extended",
                        defaultFontType: "sans-serif",
                        defaultValue: {
                            variant: "Semibold",
                            fontSize: "14px",
                            letterSpacing: "-0.01em",
                            lineHeight: "1em",
                        },
                    },
                    radius: {
                        type: ControlType.Number,
                        title: "Radius",
                        defaultValue: 8,
                        min: 0,
                        max: 32,
                        step: 1,
                        unit: "px",
                        hidden: (props) => props?.type === "tertiary",
                    },
                    padding: {
                        type: ControlType.Number,
                        title: "Padding",
                        defaultValue: 12,
                        min: 0,
                        max: 50,
                        step: 1,
                        unit: "px",
                    },
                    borderWidth: {
                        type: ControlType.Number,
                        title: "Border Width",
                        defaultValue: 2,
                        min: 1,
                        max: 10,
                        step: 1,
                        unit: "px",
                        hidden: (props) => props?.type !== "secondary",
                    },
                    borderColor: {
                        type: ControlType.Color,
                        title: "Border Color",
                        defaultValue: "#000000",
                        hidden: (props) => props?.type !== "secondary",
                    },
                    underlineThickness: {
                        type: ControlType.Number,
                        title: "Underline Thickness",
                        defaultValue: 2,
                        min: 1,
                        max: 5,
                        step: 1,
                        unit: "px",
                        hidden: (props) => props?.type !== "tertiary",
                    },
                    fill: {
                        type: ControlType.Enum,
                        title: "Fill",
                        defaultValue: "fill",
                        options: ["fit", "fixed", "fill"],
                        optionTitles: ["Fit", "Fixed", "Fill"],
                        displaySegmentedControl: true,
                    },
                    width: {
                        type: ControlType.Number,
                        title: "Width",
                        defaultValue: 200,
                        min: 50,
                        max: 2000,
                        step: 10,
                        unit: "px",
                        hidden: (props) => {
                            return props?.fill !== "fixed"
                        },
                    },
                    hover: {
                        type: ControlType.Object,
                        title: "Hover",
                        controls: {
                            background: {
                                type: ControlType.Color,
                                title: "Background",
                                defaultValue: "#333333",
                                hidden: (props) => props?.type !== "primary",
                            },
                            textColor: {
                                type: ControlType.Color,
                                title: "Text Color",
                                defaultValue: "#FFFFFF",
                            },
                            borderColor: {
                                type: ControlType.Color,
                                title: "Border Color",
                                defaultValue: "#333333",
                                hidden: (props) => props?.type !== "secondary",
                            },
                            opacity: {
                                type: ControlType.Number,
                                title: "Opacity",
                                defaultValue: 1,
                                min: 0,
                                max: 1,
                                step: 0.1,
                            },
                            scale: {
                                type: ControlType.Number,
                                title: "Scale",
                                defaultValue: 0.98,
                                min: 0.8,
                                max: 1.2,
                                step: 0.01,
                            },
                        },
                    },
                    icon: {
                        type: ControlType.Object,
                        title: "Icon",
                        controls: {
                            enabled: {
                                type: ControlType.Boolean,
                                title: "Enabled",
                                defaultValue: false,
                                enabledTitle: "On",
                                disabledTitle: "Off",
                            },
                            svg: {
                                type: ControlType.String,
                                title: "SVG Code",
                                defaultValue:
                                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
                                displayTextArea: true,
                                hidden: (props) => !props?.enabled,
                            },
                            placement: {
                                type: ControlType.Enum,
                                title: "Placement",
                                defaultValue: "right",
                                options: ["left", "right"],
                                optionTitles: ["Left", "Right"],
                                displaySegmentedControl: true,
                                hidden: (props) => !props?.enabled,
                            },
                            size: {
                                type: ControlType.Number,
                                title: "Size",
                                defaultValue: 16,
                                min: 8,
                                max: 48,
                                step: 1,
                                unit: "px",
                                hidden: (props) => !props?.enabled,
                            },
                            gap: {
                                type: ControlType.Number,
                                title: "Gap",
                                defaultValue: 8,
                                min: 0,
                                max: 24,
                                step: 1,
                                unit: "px",
                                hidden: (props) => !props?.enabled,
                            },
                        },
                    },
                },
            },
            alignmentX: {
                type: ControlType.Enum,
                title: "Align X",
                defaultValue: "flex-start",
                options: ["flex-start", "center", "flex-end"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
            },
            alignmentY: {
                type: ControlType.Enum,
                title: "Align Y",
                defaultValue: "flex-start",
                options: ["flex-start", "center", "flex-end"],
                optionTitles: ["Top", "Center", "Bottom"],
                displaySegmentedControl: true,
            },
        },
    },
    title: {
        type: ControlType.Object,
        title: "Title",
        description: "Customize backdrop Text",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "YOUR BG TEXT",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "120px",
                    variant: "Semibold",
                    letterSpacing: "-0.04em",
                    lineHeight: "1em",
                    textAlign: "center",
                },
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#F0F0F0",
            },
            fill: {
                type: ControlType.Enum,
                title: "Fill",
                defaultValue: "fit",
                options: ["fit", "fixed", "fill", "relative"],
                optionTitles: ["Fit", "Fixed", "Fill", "Relative"],
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 300,
                min: 0,
                max: 2000,
                step: 1,
                unit: "px",
                hidden: (props) => {
                    return (
                        props?.fill !== "fixed" &&
                        props?.fill !== "relative"
                    )
                },
            },
            alignmentX: {
                type: ControlType.Enum,
                title: "Align X",
                defaultValue: "center",
                options: ["flex-start", "center", "flex-end"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
            },
            alignmentY: {
                type: ControlType.Enum,
                title: "Align Y",
                defaultValue: "center",
                options: ["flex-start", "center", "flex-end"],
                optionTitles: ["Top", "Center", "Bottom"],
                displaySegmentedControl: true,
            },
        },
    },
    settings: {
        type: ControlType.Object,
        title: "Settings",
        description: "Edit image positioning",
        controls: {
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 16,
                min: 0,
                max: 50,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 8,
                min: 0,
                max: 32,
                step: 1,
                unit: "px",
            },
            alignmentX: {
                type: ControlType.Enum,
                title: "Align X",
                defaultValue: "center",
                options: ["flex-start", "center", "flex-end"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
            },
            alignmentY: {
                type: ControlType.Enum,
                title: "Align Y",
                defaultValue: "center",
                options: ["flex-start", "center", "flex-end"],
                optionTitles: ["Top", "Center", "Bottom"],
                displaySegmentedControl: true,
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "transparent",
            },
        },
    },
})
