// Masonry Gallery component with Pinterest-style layout, staggered animations, hover effects, and lightbox
import { useEffect, useState, useRef, useCallback, useMemo, startTransition, type CSSProperties } from "react"
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

interface ImageItem {
    src: string | { src: string; srcSet?: string; alt?: string }
    alt?: string
    width?: number
    height?: number
    title?: string
    href?: string
    category?: string
    mediaType?: "image" | "video"
    videoSrc?: string
    autoplay?: boolean
    hideControls?: boolean
}

interface MasonryGalleryProps {
    images: ImageItem[]
    columns: number
    gap: number
    loadAnimation: "stagger-fade" | "stagger-scale" | "wave" | "none"
    hoverEffect: "overlay" | "zoom" | "tilt" | "blur-title"
    lightbox: boolean
    lazyLoad: boolean
    masonry: "css" | "js"
    overlayColor: string
    titleColor: string
    titleFont: CSSProperties
    responsiveColumns: boolean
    mobileColumns: number
    tabletColumns: number
    desktopColumns: number
    tabletBreakpoint: number
    desktopBreakpoint: number
    style?: CSSProperties
}

/**
 * Masonry Gallery
 * 
 * Pinterest-style masonry image layout with staggered entrance animations,
 * hover effects, and optional lightbox functionality.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MasonryGallery(props: MasonryGalleryProps) {
    const {
        images = [],
        columns = 3,
        gap = 16,
        loadAnimation = "stagger-fade",
        hoverEffect = "overlay",
        lightbox = true,
        lazyLoad = true,
        masonry = "css",
        overlayColor = "rgba(0, 0, 0, 0.6)",
        titleColor = "#FFFFFF",
        titleFont,
        responsiveColumns = true,
        mobileColumns = 1,
        tabletColumns = 2,
        desktopColumns = 3,
        tabletBreakpoint = 768,
        desktopBreakpoint = 1024,
    } = props

    const [isVisible, setIsVisible] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [containerWidth, setContainerWidth] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const effectiveColumns = useMemo(() => {
        if (!responsiveColumns) return Math.max(1, Math.round(columns || 1))
        const w = containerWidth || 0
        if (w > 0 && w < tabletBreakpoint) return Math.max(1, Math.round(mobileColumns || 1))
        if (w > 0 && w < desktopBreakpoint) return Math.max(1, Math.round(tabletColumns || 1))
        if (w > 0) return Math.max(1, Math.round(desktopColumns || 1))
        // Fallback for initial render / static render
        return Math.max(1, Math.round(desktopColumns || columns || 1))
    }, [responsiveColumns, columns, mobileColumns, tabletColumns, desktopColumns, containerWidth, tabletBreakpoint, desktopBreakpoint])

    // Intersection Observer for entrance animation
    useEffect(() => {
        if (isStatic || loadAnimation === "none") {
            setIsVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        startTransition(() => setIsVisible(true))
                    }
                })
            },
            { threshold: 0.1 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [isStatic, loadAnimation])

    // Mouse tracking for tilt effect
    const handleMouseMove = useCallback((e: React.MouseEvent, index: number) => {
        if (hoverEffect !== "tilt") return
        
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        
        startTransition(() => {
            setMousePosition({ x, y })
            setHoveredIndex(index)
        })
    }, [hoverEffect])

    const handleMouseLeave = useCallback(() => {
        startTransition(() => {
            setHoveredIndex(null)
            setMousePosition({ x: 0, y: 0 })
        })
    }, [])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        const el = containerRef.current
        const ro = new ResizeObserver((entries) => {
            const entry = entries[0]
            const next = entry?.contentRect?.width
            if (typeof next === "number") {
                startTransition(() => setContainerWidth(next))
            }
        })

        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic])

    // Animation variants
    const getItemVariants = (index: number) => {
        const baseDelay = index * 0.05

        switch (loadAnimation) {
            case "stagger-fade":
                return {
                    hidden: { opacity: 0, y: 20, x: -20 },
                    visible: { 
                        opacity: 1, 
                        y: 0, 
                        x: 0,
                        transition: { delay: baseDelay, duration: 0.5 }
                    }
                }
            case "stagger-scale":
                return {
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { 
                        opacity: 1, 
                        scale: 1,
                        transition: { delay: baseDelay, duration: 0.5 }
                    }
                }
            case "wave":
                return {
                    hidden: { opacity: 0, y: 50 },
                    visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: { 
                            delay: baseDelay,
                            duration: 0.6,
                            type: "spring" as const,
                            stiffness: 100
                        }
                    }
                }
            default:
                return {
                    hidden: { opacity: 1 },
                    visible: { opacity: 1 }
                }
        }
    }

    // Hover effect styles
    const getHoverStyles = (index: number, isHovered: boolean) => {
        const isTilted = hoverEffect === "tilt" && hoveredIndex === index

        return {
            transform: isTilted
                ? `perspective(1000px) rotateX(${mousePosition.y * 10}deg) rotateY(${mousePosition.x * 10}deg)`
                : hoverEffect === "zoom" && isHovered
                ? "scale(1.05)"
                : "scale(1)",
            filter: hoverEffect === "blur-title" && isHovered ? "blur(4px)" : "none",
        }
    }

    // Open lightbox
    const openLightbox = useCallback((index: number) => {
        if (!lightbox) return
        startTransition(() => setLightboxIndex(index))
    }, [lightbox])

    // Close lightbox
    const closeLightbox = useCallback(() => {
        startTransition(() => setLightboxIndex(null))
    }, [])

    // Navigate lightbox
    const navigateLightbox = useCallback((direction: "prev" | "next") => {
        if (lightboxIndex === null) return
        
        const newIndex = direction === "prev" 
            ? (lightboxIndex - 1 + images.length) % images.length
            : (lightboxIndex + 1) % images.length
        
        startTransition(() => setLightboxIndex(newIndex))
    }, [lightboxIndex, images.length])

    // Keyboard navigation
    useEffect(() => {
        if (isStatic || lightboxIndex === null) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox()
            if (e.key === "ArrowLeft") navigateLightbox("prev")
            if (e.key === "ArrowRight") navigateLightbox("next")
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [lightboxIndex, closeLightbox, navigateLightbox, isStatic])

    // CSS Columns Layout
    if (masonry === "css") {
        return (
            <>
                <div
                    ref={containerRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        overflow: "auto",
                        padding: gap / 2,
                    }}
                >
                    <div
                        style={{
                            columns: effectiveColumns,
                            columnGap: gap,
                        }}
                    >
                        {images.map((image, index) => {
                            if (!image) return null
                            
                            const isHovered = hoveredIndex === index
                            const variants = getItemVariants(index)
                            
                            const mediaType = image.mediaType || "image"
                            const imageSrc = mediaType === "image" && image.src 
                                ? (typeof image.src === 'string' ? image.src : image.src?.src)
                                : undefined
                            const imageSrcSet = mediaType === "image" && typeof image.src === 'object' ? image.src?.srcSet : undefined
                            const videoSrc = mediaType === "video" 
                                ? (image.videoSrc || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4")
                                : undefined
                            const imageAlt = image.alt || "Gallery image"
                            
                            if (mediaType === "image" && !imageSrc) return null
                            if (mediaType === "video" && !videoSrc) return null

                            return (
                                <motion.div
                                    key={index}
                                    initial={loadAnimation !== "none" ? "hidden" : "visible"}
                                    animate={isVisible ? "visible" : "hidden"}
                                    variants={variants}
                                    style={{
                                        breakInside: "avoid",
                                        marginBottom: gap,
                                        position: "relative",
                                        overflow: "hidden",
                                        borderRadius: 8,
                                        cursor: lightbox ? "pointer" : "default",
                                    }}
                                    onClick={() => openLightbox(index)}
                                    onMouseEnter={() => startTransition(() => setHoveredIndex(index))}
                                    onMouseLeave={handleMouseLeave}
                                    onMouseMove={(e) => handleMouseMove(e, index)}
                                >
                                    {mediaType === "video" ? (
                                        <motion.video
                                            src={videoSrc}
                                            controls={!image.hideControls}
                                            autoPlay={image.autoplay}
                                            loop
                                            muted
                                            playsInline
                                            style={{
                                                width: "100%",
                                                height: "auto",
                                                display: "block",
                                                transition: "transform 0.3s ease, filter 0.3s ease",
                                                ...getHoverStyles(index, isHovered),
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                            }}
                                        />
                                    ) : (
                                        <motion.img
                                            src={imageSrc}
                                            srcSet={imageSrcSet}
                                            alt={imageAlt}
                                            loading={lazyLoad ? "lazy" : "eager"}
                                            style={{
                                                width: "100%",
                                                height: "auto",
                                                display: "block",
                                                transition: "transform 0.3s ease, filter 0.3s ease",
                                                ...getHoverStyles(index, isHovered),
                                            }}
                                        />
                                    )}
                                    
                                    {/* Overlay */}
                                    {(hoverEffect === "overlay" || hoverEffect === "blur-title") && image.title && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: isHovered ? 1 : 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                position: "absolute",
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                background: hoverEffect === "overlay" 
                                                    ? `linear-gradient(to top, ${overlayColor}, transparent)`
                                                    : overlayColor,
                                                padding: 16,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    color: titleColor,
                                                    ...titleFont,
                                                }}
                                            >
                                                {image.title}
                                            </p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* Lightbox */}
                <AnimatePresence>
                    {lightbox && lightboxIndex !== null && images[lightboxIndex] && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: "rgba(0, 0, 0, 0.9)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 9999,
                                padding: 40,
                            }}
                            onClick={closeLightbox}
                        >
                            {(() => {
                                const currentImage = images[lightboxIndex]
                                const mediaType = currentImage.mediaType || "image"
                                const lightboxSrc = mediaType === "image" && currentImage.src
                                    ? (typeof currentImage.src === 'string' ? currentImage.src : currentImage.src?.src)
                                    : undefined
                                const lightboxSrcSet = mediaType === "image" && typeof currentImage.src === 'object' ? currentImage.src?.srcSet : undefined
                                const videoSrc = mediaType === "video" 
                                    ? (currentImage.videoSrc || "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4")
                                    : undefined
                                const lightboxAlt = currentImage.alt || "Gallery image"
                                const hasLink = currentImage.href && currentImage.href.trim() !== ""
                                
                                const mediaElement = mediaType === "video" ? (
                                    <motion.video
                                        key={lightboxIndex}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        src={videoSrc}
                                        controls={!currentImage.hideControls}
                                        autoPlay={currentImage.autoplay}
                                        loop
                                        style={{
                                            maxWidth: "90%",
                                            maxHeight: "90%",
                                            objectFit: "contain",
                                            cursor: hasLink ? "pointer" : "default",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <motion.img
                                        key={lightboxIndex}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        src={lightboxSrc}
                                        srcSet={lightboxSrcSet}
                                        alt={lightboxAlt}
                                        style={{
                                            maxWidth: "90%",
                                            maxHeight: "90%",
                                            objectFit: "contain",
                                            cursor: hasLink ? "pointer" : "default",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )
                                
                                return hasLink ? (
                                    <a 
                                        href={currentImage.href} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >
                                        {mediaElement}
                                    </a>
                                ) : mediaElement
                            })()}
                            
                            {/* Navigation buttons */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigateLightbox("prev")
                                }}
                                style={{
                                    position: "absolute",
                                    left: 20,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "rgba(255, 255, 255, 0.2)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: 50,
                                    height: 50,
                                    cursor: "pointer",
                                    fontSize: 24,
                                    color: "#fff",
                                }}
                                aria-label="Previous image"
                            >
                                ‹
                            </button>
                            
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigateLightbox("next")
                                }}
                                style={{
                                    position: "absolute",
                                    right: 20,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "rgba(255, 255, 255, 0.2)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: 50,
                                    height: 50,
                                    cursor: "pointer",
                                    fontSize: 24,
                                    color: "#fff",
                                }}
                                aria-label="Next image"
                            >
                                ›
                            </button>
                            
                            <button
                                onClick={closeLightbox}
                                style={{
                                    position: "absolute",
                                    top: 20,
                                    right: 20,
                                    background: "rgba(255, 255, 255, 0.2)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: 40,
                                    height: 40,
                                    cursor: "pointer",
                                    fontSize: 24,
                                    color: "#fff",
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

    return null
}

addPropertyControls(MasonryGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
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
                src: { 
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: ({ mediaType }) => mediaType === "video",
                },
                videoSrc: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: ({ mediaType }) => mediaType !== "video",
                },
                autoplay: {
                    type: ControlType.Boolean,
                    title: "Autoplay",
                    defaultValue: true,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    hidden: ({ mediaType }) => mediaType !== "video",
                },
                hideControls: {
                    type: ControlType.Boolean,
                    title: "Hide Controls",
                    defaultValue: false,
                    enabledTitle: "Hide",
                    disabledTitle: "Show",
                    hidden: ({ mediaType }) => mediaType !== "video",
                },
                alt: { 
                    type: ControlType.String, 
                    title: "Alt Text",
                    defaultValue: "Gallery image"
                },
                width: { 
                    type: ControlType.Number, 
                    title: "Width",
                    defaultValue: 400
                },
                height: { 
                    type: ControlType.Number, 
                    title: "Height",
                    defaultValue: 600
                },
                title: { 
                    type: ControlType.String, 
                    title: "Title",
                    defaultValue: "Image Title"
                },
                href: { 
                    type: ControlType.String, 
                    title: "Link (Optional)",
                    defaultValue: ""
                },
            },
        },
        defaultValue: [
            {
                mediaType: "image",
                src: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gallery image 1" },
                alt: "Gallery image 1",
                width: 400,
                height: 600,
                title: "Blue Gradient",
            },
            {
                mediaType: "image",
                src: { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gallery image 2" },
                alt: "Gallery image 2",
                width: 400,
                height: 300,
                title: "Purple Gradient",
            },
            {
                mediaType: "video",
                videoSrc: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                alt: "Sample video",
                width: 400,
                height: 500,
                title: "Sample Video",
                autoplay: true,
                hideControls: false,
            },
            {
                mediaType: "image",
                src: { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gallery image 4" },
                alt: "Gallery image 4",
                width: 400,
                height: 400,
                title: "Yellow Gradient",
            },
            {
                mediaType: "image",
                src: { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Gallery image 5" },
                alt: "Gallery image 5",
                width: 400,
                height: 550,
                title: "Green Gradient",
            },
            {
                mediaType: "image",
                src: { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gallery image 6" },
                alt: "Gallery image 6",
                width: 400,
                height: 350,
                title: "Blue Gradient 2",
            },
        ],
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
        hidden: ({ responsiveColumns }) => !!responsiveColumns,
    },
    responsiveColumns: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    mobileColumns: {
        type: ControlType.Number,
        title: "Mobile Cols",
        defaultValue: 1,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
        hidden: ({ responsiveColumns }) => !responsiveColumns,
    },
    tabletColumns: {
        type: ControlType.Number,
        title: "Tablet Cols",
        defaultValue: 2,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
        hidden: ({ responsiveColumns }) => !responsiveColumns,
    },
    desktopColumns: {
        type: ControlType.Number,
        title: "Desktop Cols",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
        hidden: ({ responsiveColumns }) => !responsiveColumns,
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet @",
        defaultValue: 768,
        min: 320,
        max: 1600,
        step: 1,
        unit: "px",
        hidden: ({ responsiveColumns }) => !responsiveColumns,
    },
    desktopBreakpoint: {
        type: ControlType.Number,
        title: "Desktop @",
        defaultValue: 1024,
        min: 480,
        max: 2400,
        step: 1,
        unit: "px",
        hidden: ({ responsiveColumns }) => !responsiveColumns,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    masonry: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["css", "js"],
        optionTitles: ["CSS Columns", "JS Masonry"],
        defaultValue: "css",
        displaySegmentedControl: true,
    },
    loadAnimation: {
        type: ControlType.Enum,
        title: "Load Animation",
        options: ["stagger-fade", "stagger-scale", "wave", "none"],
        optionTitles: ["Stagger Fade", "Stagger Scale", "Wave", "None"],
        defaultValue: "stagger-fade",
    },
    hoverEffect: {
        type: ControlType.Enum,
        title: "Hover Effect",
        options: ["overlay", "zoom", "tilt", "blur-title"],
        optionTitles: ["Overlay", "Zoom", "Tilt", "Blur Title"],
        defaultValue: "overlay",
    },
    lightbox: {
        type: ControlType.Boolean,
        title: "Lightbox",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    lazyLoad: {
        type: ControlType.Boolean,
        title: "Lazy Load",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "rgba(0, 0, 0, 0.6)",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})
