// User request: fix inaccurate scroll-tied 3D parallax with smooth container-based progress and canvas fallback, add Image Fit + tile background controls to prevent unwanted cropping, and add Height Mode (Viewport/Fixed) while preserving existing controls/keys and Framer conventions.
import {
    useRef,
    useMemo,
    useState,
    useEffect,
    useCallback,
    startTransition,
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

import {
    useScroll,
    useTransform,
    useSpring,
    motion,
    useInView,
    type MotionValue,
} from "framer-motion"

interface ImageItem {
    url: {
        src: string
        alt?: string
    }
    alt: string
}

interface ParallaxDepthGridProps {
    // Layout
    columns: number
    gap: number
    aspectRatio: number
    borderRadius: number
    containerHeight: number
    heightMode: "Fixed" | "Viewport"
    // Images
    images: ImageItem[]
    imageFit: "Cover" | "Contain" | "Fill"
    containBackground: string
    // 3D Motion
    perspectiveDepth: number
    parallaxIntensity: number
    rotationAmount: number
    skewAmount: number
    scaleRange: number
    staggerDelay: number
    // Visual FX
    blurStrength: number
    brightnessRange: number
    contrastBoost: number
    overlayColor: string
    overlayOpacity: number
    // Marquee
    showMarquee: boolean
    marqueeText: string
    marqueeSpeed: number
    marqueeSize: number
    marqueeColor: string
    marqueeBackground: string
    // Link
    linkUrl: string
    openInNewTab: boolean
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ParallaxDepthGrid(props: ParallaxDepthGridProps) {
    const {
        columns = 3,
        gap = 16,
        aspectRatio = 1.2,
        borderRadius = 0,
        containerHeight = 600,
        heightMode = "Viewport",
        images = [],
        imageFit = "Cover",
        containBackground = "rgba(0,0,0,0)",
        perspectiveDepth = 1200,
        parallaxIntensity = 1,
        rotationAmount = 8,
        skewAmount = 4,
        scaleRange = 0.15,
        staggerDelay = 0.08,
        blurStrength = 6,
        brightnessRange = 0.4,
        contrastBoost = 0.2,
        overlayColor = "#000000",
        overlayOpacity = 0.3,
        showMarquee = true,
        marqueeText = "PARALLAX DEPTH GRID • SCROLL TO EXPLORE • ",
        marqueeSpeed = 50,
        marqueeSize = 48,
        marqueeColor = "#FFFFFF",
        marqueeBackground = "rgba(0, 0, 0, 0.5)",
        linkUrl = "https://framer.link/dulaj80",
        openInNewTab = true,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const scrollRegionRef = useRef<HTMLDivElement>(null)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { amount: 0.1 })
    
    // Responsive state
    const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200)
    const [isMobile, setIsMobile] = useState(false)

    const handleResize = useCallback(() => {
        if (typeof window === "undefined") return
        const width = window.innerWidth
        startTransition(() => {
            setWindowWidth(width)
            setIsMobile(width < 768)
        })
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [handleResize])

    // Responsive calculations
    const responsiveColumns = useMemo(() => {
        if (windowWidth < 480) return 1 // Small mobile: 1 column
        if (windowWidth < 768) return Math.min(columns, 2) // Large mobile: max 2 columns
        if (windowWidth < 1024) return Math.min(columns, 3) // Tablet: max 3 columns
        return columns // Desktop: use prop value
    }, [windowWidth, columns])

    const responsiveGap = useMemo(() => {
        if (windowWidth < 480) return Math.max(gap * 0.4, 8) // Small mobile: 40% gap, min 8px
        if (windowWidth < 768) return Math.max(gap * 0.6, 10) // Large mobile: 60% gap, min 10px
        if (windowWidth < 1024) return Math.max(gap * 0.75, 12) // Tablet: 75% gap, min 12px
        return gap // Desktop: use prop value
    }, [windowWidth, gap])

    // Prepare images with defaults
    const processedImages = useMemo(() => {
        const defaultImages = [
            {
                url: {
                    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
                    alt: "Mountain landscape",
                },
                alt: "Mountain landscape",
            },
            {
                url: {
                    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
                    alt: "Forest path",
                },
                alt: "Forest path",
            },
            {
                url: {
                    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
                    alt: "Misty mountains",
                },
                alt: "Misty mountains",
            },
            {
                url: {
                    src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80",
                    alt: "Lake view",
                },
                alt: "Lake view",
            },
            {
                url: {
                    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80",
                    alt: "Sunset landscape",
                },
                alt: "Sunset landscape",
            },
            {
                url: {
                    src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
                    alt: "Coastal scene",
                },
                alt: "Coastal scene",
            },
        ]

        return images.length > 0 ? images : defaultImages
    }, [images])

    const responsiveHeight = useMemo(() => {
        if (heightMode === "Viewport") return "100vh"
        if (windowWidth < 768) {
            // Mobile: calculate height based on number of items and columns
            const rows = Math.ceil(processedImages.length / responsiveColumns)
            const itemHeight = (windowWidth - responsiveGap * (responsiveColumns + 1)) / responsiveColumns / aspectRatio
            return rows * itemHeight + responsiveGap * (rows + 1) + (showMarquee ? 60 : 0)
        }
        if (windowWidth < 1024) return Math.min(containerHeight, 800) // Tablet: max 800px
        return containerHeight // Desktop: use prop value
    }, [
        heightMode,
        windowWidth,
        containerHeight,
        processedImages.length,
        responsiveColumns,
        responsiveGap,
        aspectRatio,
        showMarquee,
    ])

    const responsiveMarqueeSize = useMemo(() => {
        if (windowWidth < 480) return Math.max(marqueeSize * 0.3, 14) // Small mobile: 30% size, min 14px
        if (windowWidth < 768) return Math.max(marqueeSize * 0.5, 18) // Large mobile: 50% size, min 18px
        if (windowWidth < 1024) return Math.max(marqueeSize * 0.7, 28) // Tablet: 70% size, min 28px
        return marqueeSize // Desktop: use prop value
    }, [windowWidth, marqueeSize])

    // Scroll progress
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    // Spring animation for smooth scroll
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 90,
        damping: 24,
        restDelta: 0.001,
    })

    // Marquee animation
    const marqueeDistance = useMemo(
        () => `-${Math.max(20, Math.min(90, marqueeSpeed))}%`,
        [marqueeSpeed]
    )
    const marqueeX = useTransform(smoothProgress, [0, 1], ["0%", marqueeDistance])

    const handleClick = () => {
        if (linkUrl && typeof window !== "undefined") {
            if (openInNewTab) {
                window.open(linkUrl, "_blank", "noopener,noreferrer")
            } else {
                window.location.href = linkUrl
            }
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: typeof responsiveHeight === "number" ? `${responsiveHeight}px` : responsiveHeight,
                position: "relative",
                overflow: "hidden",
                perspective: isCanvas || isStatic ? "none" : `${perspectiveDepth}px`,
                cursor: linkUrl ? "pointer" : "default",
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y",
            }}
            onClick={handleClick}
        >
            {/* Grid Container */}
            <div
                ref={scrollRegionRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`,
                    gap: `${responsiveGap}px`,
                    padding: `${responsiveGap}px`,
                    paddingBottom: showMarquee ? `${responsiveGap + (isMobile ? 50 : 80)}px` : `${responsiveGap}px`,
                    boxSizing: "border-box",
                    overflowY: "auto",
                    overflowX: "visible",
                    alignContent: "start",
                }}
            >
                {processedImages.map((image, index) => (
                    <GridCell
                        key={index}
                        image={image}
                        index={index}
                        scrollProgress={smoothProgress}
                        aspectRatio={aspectRatio}
                        borderRadius={borderRadius}
                        parallaxIntensity={isMobile ? parallaxIntensity * 0.5 : parallaxIntensity}
                        rotationAmount={isMobile ? rotationAmount * 0.5 : rotationAmount}
                        skewAmount={isMobile ? skewAmount * 0.5 : skewAmount}
                        scaleRange={isMobile ? scaleRange * 0.7 : scaleRange}
                        staggerDelay={staggerDelay}
                        blurStrength={isMobile ? blurStrength * 0.5 : blurStrength}
                        brightnessRange={brightnessRange}
                        contrastBoost={contrastBoost}
                        overlayColor={overlayColor}
                        overlayOpacity={overlayOpacity}
                        imageFit={imageFit}
                        containBackground={containBackground}
                        isMotionActive={!isCanvas && !isStatic && isInView}
                        isMobile={isMobile}
                    />
                ))}
            </div>

            {/* Marquee Overlay */}
            {showMarquee && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: "100%",
                        backgroundColor: marqueeBackground,
                        overflow: "hidden",
                        pointerEvents: "none",
                        padding: isMobile ? "6px 0" : "16px 0",
                        zIndex: 10,
                    }}
                >
                    <motion.div
                        style={{
                            display: "flex",
                            whiteSpace: "nowrap",
                            x: isCanvas || isStatic ? 0 : marqueeX,
                        }}
                    >
                        {[...Array(6)].map((_, i) => (
                            <span
                                key={i}
                                style={{
                                    fontSize: `${responsiveMarqueeSize}px`,
                                    fontWeight: 700,
                                    color: marqueeColor,
                                    letterSpacing: "0.05em",
                                    paddingRight: "2em",
                                }}
                            >
                                {marqueeText}
                            </span>
                        ))}
                    </motion.div>
                </div>
            )}
        </div>
    )
}

interface GridCellProps {
    image: ImageItem
    index: number
    scrollProgress: MotionValue<number>
    aspectRatio: number
    borderRadius: number
    parallaxIntensity: number
    rotationAmount: number
    skewAmount: number
    scaleRange: number
    staggerDelay: number
    blurStrength: number
    brightnessRange: number
    contrastBoost: number
    overlayColor: string
    overlayOpacity: number
    imageFit: "Cover" | "Contain" | "Fill"
    containBackground: string
    isMotionActive: boolean
    isMobile: boolean
}

function GridCell({
    image,
    index,
    scrollProgress,
    aspectRatio,
    borderRadius,
    parallaxIntensity,
    rotationAmount,
    skewAmount,
    scaleRange,
    staggerDelay,
    blurStrength,
    brightnessRange,
    contrastBoost,
    overlayColor,
    overlayOpacity,
    imageFit,
    containBackground,
    isMotionActive,
    isMobile,
}: GridCellProps) {
    // Stagger effect based on index
    const stagger = index * staggerDelay
    const start = Math.max(0, stagger * 0.55)
    const end = Math.min(1, 1 - stagger * 0.25)
    const itemProgress = useTransform(scrollProgress, [start, end], [0, 1])

    // Transform values with stagger
    const yRaw = useTransform(
        itemProgress,
        [0, 0.5, 1],
        [80 * parallaxIntensity * (1 + stagger), 0, -80 * parallaxIntensity * (1 + stagger)]
    )
    const y = useSpring(yRaw, { stiffness: 110, damping: 24, mass: 0.7 })

    const zRaw = useTransform(
        itemProgress,
        [0, 0.5, 1],
        [-90 * parallaxIntensity * (1 + stagger * 0.6), 0, 90 * parallaxIntensity * (1 + stagger * 0.6)]
    )
    const z = useSpring(zRaw, { stiffness: 100, damping: 23, mass: 0.8 })

    const rotateXRaw = useTransform(
        itemProgress,
        [0, 0.5, 1],
        [rotationAmount * (1 + stagger * 0.45), 0, -rotationAmount * (1 + stagger * 0.45)]
    )
    const rotateX = useSpring(rotateXRaw, { stiffness: 95, damping: 24 })

    const skewYRaw = useTransform(itemProgress, [0, 0.5, 1], [skewAmount, 0, -skewAmount])
    const skewY = useSpring(skewYRaw, { stiffness: 95, damping: 24 })

    const scaleRaw = useTransform(
        itemProgress,
        [0, 0.5, 1],
        [1 - scaleRange * (1 + stagger * 0.2), 1 + scaleRange * 0.5, 1 - scaleRange * (1 + stagger * 0.2)]
    )
    const scale = useSpring(scaleRaw, { stiffness: 100, damping: 22 })

    // Filter effects that peak at center
    const blurRaw = useTransform(itemProgress, [0, 0.5, 1], [blurStrength, 0, blurStrength])
    const blur = useSpring(blurRaw, { stiffness: 120, damping: 26 })

    const brightnessRaw = useTransform(
        itemProgress,
        [0, 0.5, 1],
        [1 - brightnessRange, 1 + brightnessRange * 0.5, 1 - brightnessRange]
    )
    const brightness = useSpring(brightnessRaw, { stiffness: 110, damping: 25 })

    const contrastRaw = useTransform(itemProgress, [0, 0.5, 1], [1, 1 + contrastBoost, 1])
    const contrast = useSpring(contrastRaw, { stiffness: 110, damping: 25 })

    const filter = useTransform(
        [blur, brightness, contrast],
        ([b, br, c]) => `blur(${b}px) brightness(${br}) contrast(${c})`
    )

    const imageSrc = typeof image.url === "string" ? image.url : (image.url?.src || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80")
    const imageAlt = image.alt || (typeof image.url === "object" && image.url?.alt) || "Grid image"

    return (
        <motion.div
            style={{
                position: "relative",
                width: "100%",
                paddingBottom: `${(1 / aspectRatio) * 100}%`,
                borderRadius: `${borderRadius}px`,
                overflow: imageFit === "Contain" ? "visible" : "hidden",
                transformStyle: "preserve-3d",
                willChange: isMobile ? "auto" : "transform",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                ...(isMotionActive
                    ? {
                          y,
                          z,
                          rotateX,
                          skewY,
                          scale,
                      }
                    : {}),
            }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: imageFit === "Contain" ? containBackground : "transparent",
                    filter: isMotionActive ? filter : "none",
                    willChange: isMobile ? "auto" : "filter",
                    borderRadius: `${borderRadius}px`,
                    overflow: "hidden",
                }}
            >
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: imageFit.toLowerCase() as "cover" | "contain" | "fill",
                        display: "block",
                    }}
                />
            </motion.div>
            {/* Overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: overlayColor,
                    opacity: overlayOpacity,
                    pointerEvents: "none",
                }}
            />
        </motion.div>
    )
}

addPropertyControls(ParallaxDepthGrid, {
    // LAYOUT
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Aspect Ratio",
        defaultValue: 1.2,
        min: 0.5,
        max: 3,
        step: 0.1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    containerHeight: {
        type: ControlType.Number,
        title: "Container Height",
        defaultValue: 600,
        min: 200,
        max: 1200,
        step: 10,
        unit: "px",
        hidden: ({ heightMode }) => heightMode !== "Fixed",
    },
    heightMode: {
        type: ControlType.Enum,
        title: "Height Mode",
        defaultValue: "Viewport",
        options: ["Fixed", "Viewport"],
        optionTitles: ["Fixed", "Viewport"],
    },

    // IMAGES
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                url: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "Grid image",
                },
            },
        },
        defaultValue: [
            {
                url: {
                    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
                    alt: "Mountain landscape",
                },
                alt: "Mountain landscape",
            },
            {
                url: {
                    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
                    alt: "Forest path",
                },
                alt: "Forest path",
            },
            {
                url: {
                    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
                    alt: "Misty mountains",
                },
                alt: "Misty mountains",
            },
            {
                url: {
                    src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80",
                    alt: "Lake view",
                },
                alt: "Lake view",
            },
            {
                url: {
                    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80",
                    alt: "Sunset landscape",
                },
                alt: "Sunset landscape",
            },
            {
                url: {
                    src: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
                    alt: "Coastal scene",
                },
                alt: "Coastal scene",
            },
        ],
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        defaultValue: "Cover",
        options: ["Cover", "Contain", "Fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
    },
    containBackground: {
        type: ControlType.Color,
        title: "Contain BG",
        defaultValue: "rgba(0, 0, 0, 0)",
        hidden: ({ imageFit }) => imageFit !== "Contain",
    },

    // 3D MOTION
    perspectiveDepth: {
        type: ControlType.Number,
        title: "Perspective Depth",
        defaultValue: 1200,
        min: 400,
        max: 3000,
        step: 100,
        unit: "px",
    },
    parallaxIntensity: {
        type: ControlType.Number,
        title: "Parallax Intensity",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
    },
    rotationAmount: {
        type: ControlType.Number,
        title: "Rotation Amount",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
        unit: "deg",
    },
    skewAmount: {
        type: ControlType.Number,
        title: "Skew Amount",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "deg",
    },
    scaleRange: {
        type: ControlType.Number,
        title: "Scale Range",
        defaultValue: 0.15,
        min: 0,
        max: 0.5,
        step: 0.01,
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.08,
        min: 0,
        max: 0.3,
        step: 0.01,
    },

    // VISUAL FX
    blurStrength: {
        type: ControlType.Number,
        title: "Blur Strength",
        defaultValue: 6,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    brightnessRange: {
        type: ControlType.Number,
        title: "Brightness Range",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
    },
    contrastBoost: {
        type: ControlType.Number,
        title: "Contrast Boost",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.3,
        min: 0,
        max: 1,
        step: 0.05,
    },

    // MARQUEE
    showMarquee: {
        type: ControlType.Boolean,
        title: "Show Marquee",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    marqueeText: {
        type: ControlType.String,
        title: "Marquee Text",
        defaultValue: "PARALLAX DEPTH GRID • SCROLL TO EXPLORE • ",
        hidden: ({ showMarquee }) => !showMarquee,
    },
    marqueeSpeed: {
        type: ControlType.Number,
        title: "Marquee Speed",
        defaultValue: 50,
        min: 1,
        max: 100,
        step: 1,
        hidden: ({ showMarquee }) => !showMarquee,
    },
    marqueeSize: {
        type: ControlType.Number,
        title: "Marquee Size",
        defaultValue: 48,
        min: 12,
        max: 120,
        step: 1,
        unit: "px",
        hidden: ({ showMarquee }) => !showMarquee,
    },
    marqueeColor: {
        type: ControlType.Color,
        title: "Marquee Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showMarquee }) => !showMarquee,
    },
    marqueeBackground: {
        type: ControlType.Color,
        title: "Marquee Background",
        defaultValue: "rgba(0, 0, 0, 0.5)",
        hidden: ({ showMarquee }) => !showMarquee,
    },

    // LINK
    linkUrl: {
        type: ControlType.String,
        title: "Link URL",
        defaultValue: "https://framer.link/dulaj80",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
