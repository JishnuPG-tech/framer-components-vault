// Silk Unfold Gallery - Luxury Minimalist Reveal Gallery
// Ultra-premium editorial layout with silk unfold scroll animations
// Images show properly and gallery fills container - user controls size
import { useEffect, useRef, useState, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView, AnimatePresence } from "framer-motion"

interface ResponsiveImage {
    src: string
    srcSet?: string
    alt?: string
}

interface GalleryImage {
    src: ResponsiveImage
    alt: string
    caption?: string
    year?: string
}

interface SilkUnfoldGalleryProps {
    images: GalleryImage[]
    accentColor: string
    layoutSettings: {
        layout: "editorial" | "grid" | "asymmetric"
    }
    styleSettings: {
        padding: number
        gap: number
        backgroundColor: string
        noiseOpacity: number
    }
    animationDuration: number
    animationStagger: number
    kenBurnsScale: number
    hoverBorderWidth: number
    hoverBorderDuration: number
    showCaptions: boolean
    captionFont: any
    yearFont: any
    captionTextTransform: "uppercase" | "lowercase" | "capitalize" | "none"
    separatorWidth: number
    separatorColor: string
    lightboxBackground: string
    lightboxPadding: number
    lightboxBorderRadius: number
    showLightboxNav: boolean
    navButtonSize: number
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SilkUnfoldGallery(props: SilkUnfoldGalleryProps) {
    const {
        images,
        accentColor,
        layoutSettings,
        styleSettings,
        animationDuration,
        animationStagger,
        kenBurnsScale,
        hoverBorderWidth,
        hoverBorderDuration,
        showCaptions,
        captionFont,
        yearFont,
        captionTextTransform,
        separatorWidth,
        separatorColor,
        lightboxBackground,
        lightboxPadding,
        lightboxBorderRadius,
        showLightboxNav,
        navButtonSize,
        style,
    } = props

    const { padding, gap, backgroundColor, noiseOpacity } = styleSettings
    const { layout } = layoutSettings

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const isStatic = useIsStaticRenderer()

    const openLightbox = (index: number) => {
        if (!isStatic) {
            startTransition(() => setLightboxIndex(index))
        }
    }

    const closeLightbox = () => {
        startTransition(() => setLightboxIndex(null))
    }

    const nextImage = () => {
        if (lightboxIndex !== null) {
            startTransition(() => setLightboxIndex((lightboxIndex + 1) % images.length))
        }
    }

    const prevImage = () => {
        if (lightboxIndex !== null) {
            startTransition(() => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length))
        }
    }

    useEffect(() => {
        if (isStatic) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (lightboxIndex !== null) {
                if (e.key === "Escape") closeLightbox()
                if (e.key === "ArrowRight") nextImage()
                if (e.key === "ArrowLeft") prevImage()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [lightboxIndex, isStatic])

    const layoutStyle = useMemo(() => {
        switch (layout) {
            case "grid":
                return {
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: `${gap}px`,
                }
            case "asymmetric":
                return {
                    display: "grid",
                    gridTemplateColumns: "repeat(12, 1fr)",
                    gap: `${gap}px`,
                }
            case "editorial":
            default:
                return {
                    display: "flex",
                    flexDirection: "column" as const,
                    gap: `${gap}px`,
                }
        }
    }, [layout, gap])

    const getImageStyle = (index: number) => {
        if (layout === "grid") {
            return { aspectRatio: "4/5" }
        }

        if (layout === "asymmetric") {
            const patterns = [
                { gridColumn: "1 / 8", aspectRatio: "3/4" },
                { gridColumn: "8 / 13", aspectRatio: "4/5" },
                { gridColumn: "1 / 6", aspectRatio: "4/5" },
                { gridColumn: "6 / 13", aspectRatio: "3/4" },
                { gridColumn: "1 / 9", aspectRatio: "16/9" },
                { gridColumn: "9 / 13", aspectRatio: "4/5" },
            ]
            return patterns[index % patterns.length]
        }

        // Editorial layout
        const posInRow = index % 3

        if (posInRow === 0) {
            return { width: "60%", aspectRatio: "3/4" }
        } else {
            return { width: "100%", aspectRatio: "4/5" }
        }
    }

    const renderEditorialLayout = () => {
        const rows: JSX.Element[] = []
        for (let i = 0; i < images.length; i += 3) {
            const rowImages = images.slice(i, i + 3)
            const isEvenRow = Math.floor(i / 3) % 2 === 0

            rows.push(
                <div
                    key={i}
                    style={{
                        display: "flex",
                        gap: `${gap}px`,
                        flexDirection: isEvenRow ? "row" : "row-reverse",
                        alignItems: "flex-start",
                    }}
                >
                    {rowImages.map((image, idx) => {
                        const actualIndex = i + idx
                        if (idx === 0) {
                            return (
                                <ImageItem
                                    key={actualIndex}
                                    image={image}
                                    index={actualIndex}
                                    accentColor={accentColor}
                                    onClick={() => openLightbox(actualIndex)}
                                    style={getImageStyle(actualIndex)}
                                    isStatic={isStatic}
                                    animationDuration={animationDuration}
                                    animationStagger={animationStagger}
                                    kenBurnsScale={kenBurnsScale}
                                    hoverBorderWidth={hoverBorderWidth}
                                    hoverBorderDuration={hoverBorderDuration}
                                    showCaptions={showCaptions}
                                    captionFont={captionFont}
                                    yearFont={yearFont}
                                    captionTextTransform={captionTextTransform}
                                    separatorWidth={separatorWidth}
                                    separatorColor={separatorColor}
                                />
                            )
                        }
                        return null
                    })}
                    {rowImages.length > 1 && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: `${gap}px`,
                                flex: 1,
                            }}
                        >
                            {rowImages.slice(1).map((image, idx) => {
                                const actualIndex = i + idx + 1
                                return (
                                    <ImageItem
                                        key={actualIndex}
                                        image={image}
                                        index={actualIndex}
                                        accentColor={accentColor}
                                        onClick={() => openLightbox(actualIndex)}
                                        style={getImageStyle(actualIndex)}
                                        isStatic={isStatic}
                                        animationDuration={animationDuration}
                                        animationStagger={animationStagger}
                                        kenBurnsScale={kenBurnsScale}
                                        hoverBorderWidth={hoverBorderWidth}
                                        hoverBorderDuration={hoverBorderDuration}
                                        showCaptions={showCaptions}
                                        captionFont={captionFont}
                                        yearFont={yearFont}
                                        captionTextTransform={captionTextTransform}
                                        separatorWidth={separatorWidth}
                                        separatorColor={separatorColor}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>
            )
        }
        return rows
    }

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet" />
            
            <div
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor: backgroundColor,
                    padding: `${padding}px`,
                    overflow: "auto",
                }}
            >
                {/* Noise texture overlay */}
                <svg
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: noiseOpacity,
                        pointerEvents: "none",
                    }}
                >
                    <filter id="noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noise)" />
                </svg>

                <div style={layoutStyle}>
                    {layout === "editorial"
                        ? renderEditorialLayout()
                        : images.map((image, index) => (
                                <ImageItem
                                    key={index}
                                    image={image}
                                    index={index}
                                    accentColor={accentColor}
                                    onClick={() => openLightbox(index)}
                                    style={getImageStyle(index)}
                                    isStatic={isStatic}
                                    animationDuration={animationDuration}
                                    animationStagger={animationStagger}
                                    kenBurnsScale={kenBurnsScale}
                                    hoverBorderWidth={hoverBorderWidth}
                                    hoverBorderDuration={hoverBorderDuration}
                                    showCaptions={showCaptions}
                                    captionFont={captionFont}
                                    yearFont={yearFont}
                                    captionTextTransform={captionTextTransform}
                                    separatorWidth={separatorWidth}
                                    separatorColor={separatorColor}
                                />
                          ))}
                </div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIndex !== null && !isStatic && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            backgroundColor: lightboxBackground,
                            zIndex: 1000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: `${lightboxPadding}px`,
                        }}
                        onClick={closeLightbox}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Image lightbox"
                    >
                        <motion.div
                            initial={{ borderRadius: `${lightboxBorderRadius}px`, scale: 0.9 }}
                            animate={{ borderRadius: "0px", scale: 1 }}
                            exit={{ borderRadius: `${lightboxBorderRadius}px`, scale: 0.9 }}
                            transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                            style={{
                                maxWidth: "90vw",
                                maxHeight: "90vh",
                                overflow: "hidden",
                                position: "relative",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={images[lightboxIndex].src?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"}
                                srcSet={images[lightboxIndex].src?.srcSet}
                                alt={images[lightboxIndex].alt || "Gallery image"}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                }}
                            />
                        </motion.div>

                        {/* Navigation buttons */}
                        {showLightboxNav && (
                        <>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                prevImage()
                            }}
                            style={{
                                position: "absolute",
                                left: `${lightboxPadding}px`,
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "transparent",
                                border: `1px solid ${accentColor}`,
                                color: accentColor,
                                width: `${navButtonSize}px`,
                                height: `${navButtonSize}px`,
                                borderRadius: "50%",
                                cursor: "pointer",
                                fontSize: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            aria-label="Previous image"
                        >
                            ←
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                nextImage()
                            }}
                            style={{
                                position: "absolute",
                                right: `${lightboxPadding}px`,
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "transparent",
                                border: `1px solid ${accentColor}`,
                                color: accentColor,
                                width: `${navButtonSize}px`,
                                height: `${navButtonSize}px`,
                                borderRadius: "50%",
                                cursor: "pointer",
                                fontSize: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            aria-label="Next image"
                        >
                            →
                        </button>
                        </>
                        )}

                        {/* Close button */}
                        <button
                            onClick={closeLightbox}
                            style={{
                                position: "absolute",
                                top: `${lightboxPadding}px`,
                                right: `${lightboxPadding}px`,
                                background: "transparent",
                                border: `1px solid ${accentColor}`,
                                color: accentColor,
                                width: `${navButtonSize}px`,
                                height: `${navButtonSize}px`,
                                borderRadius: "50%",
                                cursor: "pointer",
                                fontSize: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            aria-label="Close lightbox"
                        >
                            ×
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

interface ImageItemProps {
    image: GalleryImage
    index: number
    accentColor: string
    onClick: () => void
    style?: React.CSSProperties
    isStatic: boolean
    animationDuration: number
    animationStagger: number
    kenBurnsScale: number
    hoverBorderWidth: number
    hoverBorderDuration: number
    showCaptions: boolean
    captionFont: any
    yearFont: any
    captionTextTransform: string
    separatorWidth: number
    separatorColor: string
}

function ImageItem({ image, index, accentColor, onClick, style, isStatic, animationDuration, animationStagger, kenBurnsScale, hoverBorderWidth, hoverBorderDuration, showCaptions, captionFont, yearFont, captionTextTransform, separatorWidth, separatorColor }: ImageItemProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [isHovered, setIsHovered] = useState(false)
    const [dashOffset, setDashOffset] = useState(1000)

    // Add default values for image.src to prevent undefined errors
    const imageSrc = image.src?.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
    const imageSrcSet = image.src?.srcSet
    const imageAlt = image.alt || "Gallery image"

    useEffect(() => {
        if (isHovered && !isStatic) {
            setDashOffset(0)
        } else {
            setDashOffset(1000)
        }
    }, [isHovered, isStatic])

    return (
        <motion.div
            ref={ref}
            style={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                ...style,
            }}
            onMouseEnter={() => !isStatic && startTransition(() => setIsHovered(true))}
            onMouseLeave={() => !isStatic && startTransition(() => setIsHovered(false))}
            onClick={onClick}
            role="button"
            tabIndex={0}
            aria-label={`View ${imageAlt}`}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    onClick()
                }
            }}
        >
            {/* Silk unfold reveal */}
            <motion.div
                initial={isStatic ? { clipPath: "inset(0% 0 0 0)" } : { clipPath: "inset(100% 0 0 0)" }}
                animate={isInView || isStatic ? { clipPath: "inset(0% 0 0 0)" } : { clipPath: "inset(100% 0 0 0)" }}
                transition={{
                    duration: animationDuration,
                    ease: [0.76, 0, 0.24, 1],
                    delay: isStatic ? 0 : index * animationStagger,
                }}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                }}
            >
                <motion.img
                    src={imageSrc}
                    srcSet={imageSrcSet}
                    alt={imageAlt}
                    initial={isStatic ? { scale: 1 } : { scale: kenBurnsScale }}
                    animate={isInView || isStatic ? { scale: 1 } : { scale: kenBurnsScale }}
                    transition={{
                        duration: animationDuration,
                        ease: [0.76, 0, 0.24, 1],
                        delay: isStatic ? 0 : index * animationStagger,
                    }}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </motion.div>

            {/* Hover border animation */}
            {!isStatic && (
                <svg
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}
                >
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="none"
                        stroke={accentColor}
                        strokeWidth={hoverBorderWidth}
                        strokeDasharray="1000"
                        strokeDashoffset={dashOffset}
                        style={{
                            transition: `stroke-dashoffset ${hoverBorderDuration}s ease`,
                        }}
                    />
                </svg>
            )}

            {/* Caption */}
            {showCaptions && (image.caption || image.year) && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "20px",
                        background: "linear-gradient(to top, rgba(250, 248, 244, 0.95), transparent)",
                    }}
                >
                    <div
                        style={{
                            width: `${separatorWidth}px`,
                            height: "1px",
                            backgroundColor: separatorColor,
                            marginBottom: "12px",
                            opacity: 0.3,
                        }}
                    />
                    {image.caption && (
                        <div
                            style={{
                                ...captionFont,
                                textTransform: captionTextTransform as any,
                            }}
                        >
                            {image.caption}
                        </div>
                    )}
                    {image.year && (
                        <div
                            style={{
                                ...yearFont,
                            }}
                        >
                            {image.year}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    )
}

addPropertyControls(SilkUnfoldGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "Gallery image",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "Untitled",
                },
                year: {
                    type: ControlType.String,
                    title: "Year",
                    defaultValue: "2024",
                },
            },
        },
        defaultValue: [
            {
                src: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "" },
                alt: "Gallery image 1",
                caption: "Collection I",
                year: "2024",
            },
            {
                src: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "" },
                alt: "Gallery image 2",
                caption: "Collection II",
                year: "2024",
            },
            {
                src: { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "" },
                alt: "Gallery image 3",
                caption: "Collection III",
                year: "2024",
            },
            {
                src: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "" },
                alt: "Gallery image 4",
                caption: "Collection IV",
                year: "2024",
            },
            {
                src: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "" },
                alt: "Gallery image 5",
                caption: "Collection V",
                year: "2024",
            },
        ],
    },
    layoutSettings: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            layout: {
                type: ControlType.Enum,
                title: "Type",
                options: ["editorial", "grid", "asymmetric"],
                optionTitles: ["Editorial", "Grid", "Asymmetric"],
                defaultValue: "editorial",
                displaySegmentedControl: true,
            },
        },
        defaultValue: {
            layout: "editorial",
        },
    },
    styleSettings: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 80,
                min: 0,
                max: 200,
                step: 10,
                unit: "px",
                displayStepper: false,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 5,
                unit: "px",
                displayStepper: false,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#faf8f4",
            },
            noiseOpacity: {
                type: ControlType.Number,
                title: "Noise Opacity",
                defaultValue: 0.03,
                min: 0,
                max: 0.2,
                step: 0.01,
                displayStepper: false,
            },
        },
        defaultValue: {
            padding: 80,
            gap: 40,
            backgroundColor: "#faf8f4",
            noiseOpacity: 0.03,
        },
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#000000",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 1,
        min: 0.3,
        max: 3,
        step: 0.1,
        unit: "s",
        displayStepper: false,
    },
    animationStagger: {
        type: ControlType.Number,
        title: "Animation Stagger",
        defaultValue: 0.1,
        min: 0,
        max: 0.5,
        step: 0.05,
        unit: "s",
        displayStepper: false,
    },
    kenBurnsScale: {
        type: ControlType.Number,
        title: "Ken Burns Scale",
        defaultValue: 1.2,
        min: 1,
        max: 1.5,
        step: 0.05,
        displayStepper: false,
    },
    hoverBorderWidth: {
        type: ControlType.Number,
        title: "Hover Border Width",
        defaultValue: 1,
        min: 1,
        max: 5,
        step: 0.5,
        unit: "px",
        displayStepper: false,
    },
    hoverBorderDuration: {
        type: ControlType.Number,
        title: "Hover Border Duration",
        defaultValue: 0.6,
        min: 0.2,
        max: 2,
        step: 0.1,
        unit: "s",
        displayStepper: false,
    },
    showCaptions: {
        type: ControlType.Boolean,
        title: "Show Captions",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "11px",
            variant: "Regular",
            letterSpacing: "0.15em",
            lineHeight: "1.4em",
        },
        hidden: ({ showCaptions }) => !showCaptions,
    },
    yearFont: {
        type: ControlType.Font,
        title: "Year Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: "10px",
            letterSpacing: "0em",
            lineHeight: "1.4em",
        },
        hidden: ({ showCaptions }) => !showCaptions,
    },
    captionTextTransform: {
        type: ControlType.Enum,
        title: "Caption Transform",
        options: ["uppercase", "lowercase", "capitalize", "none"],
        optionTitles: ["Uppercase", "Lowercase", "Capitalize", "None"],
        defaultValue: "uppercase",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    separatorWidth: {
        type: ControlType.Number,
        title: "Separator Width",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
        displayStepper: false,
        hidden: ({ showCaptions }) => !showCaptions,
    },
    separatorColor: {
        type: ControlType.Color,
        title: "Separator Color",
        defaultValue: "#000000",
        hidden: ({ showCaptions }) => !showCaptions,
    },
    lightboxBackground: {
        type: ControlType.Color,
        title: "Lightbox Background",
        defaultValue: "rgba(250, 248, 244, 0.98)",
    },
    lightboxPadding: {
        type: ControlType.Number,
        title: "Lightbox Padding",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 10,
        unit: "px",
        displayStepper: false,
    },
    lightboxBorderRadius: {
        type: ControlType.Number,
        title: "Lightbox Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 2,
        unit: "px",
        displayStepper: false,
    },
    showLightboxNav: {
        type: ControlType.Boolean,
        title: "Show Navigation",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    navButtonSize: {
        type: ControlType.Number,
        title: "Nav Button Size",
        defaultValue: 48,
        min: 32,
        max: 80,
        step: 4,
        unit: "px",
        displayStepper: false,
    },
})
