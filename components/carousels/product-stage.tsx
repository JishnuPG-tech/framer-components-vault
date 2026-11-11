import {
    useState,
    useEffect,
    useCallback,
    useRef,
    startTransition,
} from "react"
import { motion, PanInfo } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Product {
    id: number
    title: string
    subtitle: string
    buttonLabel: string
    image?: {
        src: string
        alt?: string
    }
    link?: string
}

interface ProductFocusCarouselProps {
    products: Product[]
    cardRadius: number
    gap: number
    activeScale: number
    inactiveScale: number
    overlayOpacity: number
    showButton: boolean
    showArrows: boolean
    autoplay: boolean
    autoplaySpeed: number
    backgroundColor: string
    buttonColor: string
    buttonTextColor: string
    buttonRadius: number
    textColor: string
    subtitleColor: string
    overlayColor: string
    arrowColor: string
    arrowBackgroundColor: string
}

interface CardStyle {
    x: number
    scale: number
    zIndex: number
    opacity: number
    width: number
    height: number
    filter?: string
}

const defaultProducts: Product[] = [
    {
        id: 1,
        title: "Oversized Wool Coat",
        subtitle: "Premium outerwear",
        buttonLabel: "View Product",
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Oversized Wool Coat",
        },
    },
    {
        id: 2,
        title: "Minimal Leather Bag",
        subtitle: "Everyday accessory",
        buttonLabel: "View Product",
        image: {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Minimal Leather Bag",
        },
    },
    {
        id: 3,
        title: "Relaxed Linen Shirt",
        subtitle: "Summer essential",
        buttonLabel: "View Product",
        image: {
            src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            alt: "Relaxed Linen Shirt",
        },
    },
    {
        id: 4,
        title: "Tailored Wide Pants",
        subtitle: "Modern wardrobe",
        buttonLabel: "View Product",
        image: {
            src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            alt: "Tailored Wide Pants",
        },
    },
    {
        id: 5,
        title: "Soft Knit Sweater",
        subtitle: "Cozy layer",
        buttonLabel: "View Product",
        image: {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Soft Knit Sweater",
        },
    },
    {
        id: 6,
        title: "Classic White Sneaker",
        subtitle: "Clean everyday style",
        buttonLabel: "View Product",
        image: {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Classic White Sneaker",
        },
    },
]

/**
 * Product Focus Carousel
 *
 * A premium, editorial-style carousel for fashion products with center-focused layout,
 * smooth animations, drag navigation, and autoplay support.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ProductFocusCarousel(props: ProductFocusCarouselProps) {
    const {
        products = defaultProducts,
        cardRadius = 24,
        gap = 40,
        activeScale = 1,
        inactiveScale = 0.75,
        overlayOpacity = 0.6,
        showButton = true,
        showArrows = true,
        autoplay = false,
        autoplaySpeed = 4000,
        backgroundColor = "#FAFAFA",
        buttonColor = "#000000",
        buttonTextColor = "#FFFFFF",
        textColor = "#FFFFFF",
        subtitleColor = "rgba(255, 255, 255, 0.8)",
        overlayColor = "#000000",
        arrowColor = "#000000",
        arrowBackgroundColor = "#FFFFFF",
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    // Handle autoplay
    useEffect(() => {
        if (!autoplay || isStatic || isHovered || products.length === 0) return

        const interval = setInterval(() => {
            startTransition(() => {
                setActiveIndex((prev) => (prev + 1) % products.length)
            })
        }, autoplaySpeed)

        return () => clearInterval(interval)
    }, [autoplay, autoplaySpeed, isHovered, products.length, isStatic])

    const navigateTo = useCallback((index: number) => {
        startTransition(() => {
            setActiveIndex(index)
        })
    }, [])

    const navigateNext = useCallback(() => {
        if (products.length === 0) return

        startTransition(() => {
            setActiveIndex((prev) => (prev + 1) % products.length)
        })
    }, [products.length])

    const navigatePrev = useCallback(() => {
        if (products.length === 0) return

        startTransition(() => {
            setActiveIndex(
                (prev) => (prev - 1 + products.length) % products.length
            )
        })
    }, [products.length])

    const handleDragEnd = useCallback(
        (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            const threshold = 50

            if (info.offset.x > threshold) {
                navigatePrev()
            } else if (info.offset.x < -threshold) {
                navigateNext()
            }
        },
        [navigateNext, navigatePrev]
    )

    const getCardPosition = (index: number) => {
        const diff = index - activeIndex
        const normalizedDiff =
            diff > products.length / 2
                ? diff - products.length
                : diff < -products.length / 2
                  ? diff + products.length
                  : diff

        return normalizedDiff
    }

    const getCardStyle = (position: number, isMobile: boolean): CardStyle => {
        const baseWidth = isMobile ? 280 : 380
        const baseHeight = isMobile ? 380 : 520

        if (position === 0) {
            return {
                x: 0,
                scale: activeScale,
                zIndex: 10,
                opacity: 1,
                width: baseWidth,
                height: baseHeight,
            }
        }

        const absPosition = Math.abs(position)
        const cardDirection = position > 0 ? 1 : -1
        const translateX =
            cardDirection * (baseWidth * 0.85 + gap * (1 - absPosition * 0.2))
        const scale = inactiveScale * (1 - absPosition * 0.15)
        const blur = absPosition > 1 ? 2 : 0

        return {
            x: translateX,
            scale,
            zIndex: 10 - absPosition,
            opacity: 1,
            width: baseWidth,
            height: baseHeight,
            filter: blur > 0 ? `blur(${blur}px)` : "none",
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Carousel Container */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <motion.div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        width: "100%",
                        height: "100%",
                    }}
                    drag={!isStatic ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={!isStatic ? handleDragEnd : undefined}
                >
                    {products.map((product, index) => {
                        const position = getCardPosition(index)
                        const isVisible = Math.abs(position) <= 2

                        if (!isVisible) return null

                        return (
                            <ProductCard
                                key={product.id}
                                product={product}
                                position={position}
                                isActive={position === 0}
                                cardRadius={cardRadius}
                                showButton={showButton}
                                overlayOpacity={overlayOpacity}
                                textColor={textColor}
                                subtitleColor={subtitleColor}
                                overlayColor={overlayColor}
                                buttonColor={buttonColor}
                                buttonTextColor={buttonTextColor}
                                onClick={() => navigateTo(index)}
                                getCardStyle={getCardStyle}
                            />
                        )
                    })}
                </motion.div>
            </div>

            {/* Navigation Arrows */}
            {showArrows && (
                <>
                    <ArrowButton
                        direction="left"
                        onClick={navigatePrev}
                        arrowColor={arrowColor}
                        arrowBackgroundColor={arrowBackgroundColor}
                        disabled={isStatic}
                    />
                    <ArrowButton
                        direction="right"
                        onClick={navigateNext}
                        arrowColor={arrowColor}
                        arrowBackgroundColor={arrowBackgroundColor}
                        disabled={isStatic}
                    />
                </>
            )}
        </div>
    )
}

interface ProductCardProps {
    product: Product
    position: number
    isActive: boolean
    cardRadius: number
    showButton: boolean
    overlayOpacity: number
    textColor: string
    subtitleColor: string
    overlayColor: string
    buttonColor: string
    buttonTextColor: string
    onClick: () => void
    getCardStyle: (position: number, isMobile: boolean) => CardStyle
}

function ProductCard({
    product,
    position,
    isActive,
    cardRadius,
    showButton,
    overlayOpacity,
    textColor,
    subtitleColor,
    overlayColor,
    buttonColor,
    buttonTextColor,
    onClick,
    getCardStyle,
}: ProductCardProps) {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)

        checkMobile()
        window.addEventListener("resize", checkMobile)

        return () => window.removeEventListener("resize", checkMobile)
    }, [])

    const style = getCardStyle(position, isMobile)

    // Get image src with fallback
    const imageSrc = product.image?.src || defaultProducts[0].image?.src
    const imageAlt = product.image?.alt || product.title || "Product image"

    return (
        <motion.div
            style={{
                position: "absolute",
                width: style.width,
                height: style.height,
                borderRadius: cardRadius,
                overflow: "hidden",
                cursor: isActive ? "default" : "pointer",
                boxShadow: isActive
                    ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    : "0 10px 30px -10px rgba(0, 0, 0, 0.15)",
                zIndex: style.zIndex,
                filter: style.filter,
            }}
            initial={false}
            animate={{
                x: style.x,
                scale: style.scale,
                opacity: style.opacity,
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
            }}
            onClick={onClick}
        >
            {/* Product Image */}
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                }}
            >
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />

                {/* Gradient Overlay */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "60%",
                        background: `linear-gradient(to top, ${overlayColor}${Math.round(
                            overlayOpacity * 255
                        ).toString(16)}, transparent)`,
                        pointerEvents: "none",
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: isMobile ? "20px" : "28px",
                        display: "flex",
                        flexDirection: "column",
                        gap: isMobile ? "8px" : "12px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: isMobile ? "11px" : "12px",
                                fontWeight: 500,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: subtitleColor,
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                            }}
                        >
                            {product.subtitle}
                        </span>
                        <span
                            style={{
                                fontSize: isMobile ? "20px" : "24px",
                                fontWeight: 600,
                                color: textColor,
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                letterSpacing: "-0.02em",
                                lineHeight: 1.2,
                            }}
                        >
                            {product.title}
                        </span>
                    </div>

                    {showButton && isActive && (
                        <motion.button
                            style={{
                                backgroundColor: buttonColor,
                                color: buttonTextColor,
                                border: "none",
                                borderRadius: 100,
                                padding: isMobile ? "12px 20px" : "14px 24px",
                                fontSize: isMobile ? "13px" : "14px",
                                fontWeight: 600,
                                cursor: "pointer",
                                marginTop: isMobile ? "8px" : "16px",
                                fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                letterSpacing: "-0.01em",
                                width: "fit-content",
                                transition:
                                    "transform 0.2s ease, box-shadow 0.2s ease",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(event) => {
                                event.stopPropagation()

                                if (!product.link) return

                                const newWindow = window.open(
                                    product.link,
                                    "_blank",
                                    "noopener,noreferrer"
                                )

                                if (newWindow) {
                                    newWindow.opener = null
                                }
                            }}
                        >
                            {product.buttonLabel}
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

interface ArrowButtonProps {
    direction: "left" | "right"
    onClick: () => void
    arrowColor: string
    arrowBackgroundColor: string
    disabled: boolean
}

function ArrowButton({
    direction,
    onClick,
    arrowColor,
    arrowBackgroundColor,
    disabled,
}: ArrowButtonProps) {
    return (
        <button
            style={{
                position: "absolute",
                [direction]: "24px",
                top: "50%",
                transform: "translateY(-50%)",
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: arrowBackgroundColor,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled ? "default" : "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                zIndex: 20,
                opacity: disabled ? 0.5 : 1,
            }}
            onClick={disabled ? undefined : onClick}
            aria-label={
                direction === "left"
                    ? "Previous carousel item"
                    : "Next carousel item"
            }
            type="button"
        >
            <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke={arrowColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    transform:
                        direction === "left"
                            ? "rotate(0deg)"
                            : "rotate(180deg)",
                }}
            >
                <polyline points="15 18 9 12 15 6" />
            </svg>
        </button>
    )
}

addPropertyControls(ProductFocusCarousel, {
    products: {
        type: ControlType.Array,
        title: "Products",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Product Name",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Category",
                },
                buttonLabel: {
                    type: ControlType.String,
                    title: "Button Label",
                    defaultValue: "View Product",
                },
                link: {
                    type: ControlType.Link,
                    title: "Button Link",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        defaultValue: defaultProducts,
        maxCount: 10,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 6,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
    },
    activeScale: {
        type: ControlType.Number,
        title: "Active Card Scale",
        defaultValue: 1,
        min: 0.5,
        max: 1.2,
        step: 0.05,
    },
    inactiveScale: {
        type: ControlType.Number,
        title: "Inactive Card Scale",
        defaultValue: 0.75,
        min: 0.3,
        max: 1,
        step: 0.05,
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
    },
    showButton: {
        type: ControlType.Boolean,
        title: "Show Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Show Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplaySpeed: {
        type: ControlType.Number,
        title: "Autoplay Speed",
        defaultValue: 4000,
        min: 1000,
        max: 10000,
        step: 500,
        unit: "ms",
        hidden: ({ autoplay }) => !autoplay,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FAFAFA",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "rgba(255, 255, 255, 0.8)",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#ffffff",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#000000",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#000000",
    },
    arrowBackgroundColor: {
        type: ControlType.Color,
        title: "Arrow Background",
        defaultValue: "#FFFFFF",
    },
})
