// Componente griglia foto senza spazi bianchi - disposizione masonry/grid compatta con colonne configurabili
// Made with workshop
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useEffect, useRef, useMemo, type CSSProperties } from "react"
import { useInView } from "framer-motion"

interface ResponsiveImage {
    src: string
    alt?: string
    srcSet?: string
}

interface ImageItem {
    src: string | ResponsiveImage
    alt: string
    title?: string
    description?: string
}

interface ImageGridProps {
    images: Array<ImageItem>
    columns: number
    gap: number
    borderRadius: number
    aspectRatio: "auto" | "square" | "portrait" | "landscape"
    objectFit: "cover" | "contain" | "fill"
    style?: CSSProperties
    showText: "none" | "always" | "hover"
    backgroundColor: string
    textPosition:
        | "top-left"
        | "top-center"
        | "top-right"
        | "center-left"
        | "center"
        | "center-right"
        | "bottom-left"
        | "bottom-center"
        | "bottom-right"
    textPadding: number
    titleFont: any
    descriptionFont: any
    titleColor: string
    descriptionColor: string
    animation: "none" | "zoom"
    scrollAnimation: "none" | "slideUp" | "slideDown"
}

/**
 * Photo Grid - Griglia foto compatta senza spazi bianchi con colonne configurabili
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ImageGrid(props: ImageGridProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 1",
                title: "Titolo 1",
                description: "Descrizione 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Image 2",
                title: "Titolo 2",
                description: "Descrizione 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Image 3",
                title: "Titolo 3",
                description: "Descrizione 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Image 4",
                title: "Titolo 4",
                description: "Descrizione 4",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Image 5",
                title: "Titolo 5",
                description: "Descrizione 5",
            },
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 6",
                title: "Titolo 6",
                description: "Descrizione 6",
            },
        ],
        columns = 2,
        gap = 0,
        borderRadius = 0,
        aspectRatio = "auto",
        objectFit = "cover",
        showText = "none",
        backgroundColor = "#FFFFFF",
        textPosition = "bottom-center",
        textPadding = 16,
        titleFont = {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        descriptionFont = {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        titleColor = "#FFFFFF",
        descriptionColor = "#FFFFFF",
        animation = "none",
        scrollAnimation = "none",
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)
    const [imageData, setImageData] = useState<
        Array<{
            src: string
            alt: string
            width: number
            height: number
            title?: string
            description?: string
        }>
    >([])

    useEffect(() => {
        if (!containerRef.current) return

        let resizeObserver: ResizeObserver | null = null
        let rafId: number | null = null

        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth)
            }
        }

        updateWidth()

        if (typeof window !== "undefined" && window.ResizeObserver) {
            resizeObserver = new window.ResizeObserver(() => {
                updateWidth()
            })
            resizeObserver.observe(containerRef.current)
        } else if (typeof window !== "undefined") {
            window.addEventListener("resize", updateWidth)
        }

        // Force update in preview mode to fix stale width
        if (typeof window !== "undefined" && window.requestAnimationFrame) {
            const forceUpdate = () => {
                updateWidth()
                rafId = window.requestAnimationFrame(forceUpdate)
            }
            rafId = window.requestAnimationFrame(forceUpdate)
        }

        return () => {
            if (rafId && typeof window !== "undefined")
                window.cancelAnimationFrame(rafId)
            if (resizeObserver && containerRef.current) {
                resizeObserver.disconnect()
            } else if (typeof window !== "undefined") {
                window.removeEventListener("resize", updateWidth)
            }
        }
    }, [])

    // Load image dimensions
    useEffect(() => {
        const loadImageDimensions = async () => {
            const imagePromises = images.map((image) => {
                return new Promise<{
                    src: string
                    alt: string
                    width: number
                    height: number
                    title?: string
                    description?: string
                }>((resolve) => {
                    const img = new Image()
                    img.onload = () => {
                        resolve({
                            src:
                                typeof image.src === "string"
                                    ? image.src
                                    : (image.src as ResponsiveImage)?.src || "",
                            alt: image.alt,
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                            title: image.title,
                            description: image.description,
                        })
                    }
                    img.onerror = () => {
                        resolve({
                            src:
                                typeof image.src === "string"
                                    ? image.src
                                    : (image.src as ResponsiveImage)?.src || "",
                            alt: image.alt,
                            width: 300,
                            height: 200,
                            title: image.title,
                            description: image.description,
                        })
                    }
                    img.src =
                        typeof image.src === "string"
                            ? image.src
                            : (image.src as ResponsiveImage)?.src || ""
                })
            })

            const loadedImages = await Promise.all(imagePromises)
            setImageData(loadedImages)
        }

        if (typeof window !== "undefined") {
            loadImageDimensions()
        }
    }, [images])

    const columnWidth = useMemo(() => {
        if (containerWidth === 0) return 0
        return (containerWidth - gap * (columns - 1)) / columns
    }, [containerWidth, columns, gap])

    // Calculate masonry layout
    const masonryLayout = useMemo(() => {
        if (imageData.length === 0 || columnWidth === 0) return []

        const columnHeights = new Array(columns).fill(0)
        const layout: Array<{
            image: (typeof imageData)[0]
            x: number
            y: number
            width: number
            height: number
        }> = []

        imageData.forEach((image) => {
            // Find shortest column
            const shortestColumnIndex = columnHeights.indexOf(
                Math.min(...columnHeights)
            )

            // Calculate dimensions based on aspect ratio setting
            let finalWidth = columnWidth
            let finalHeight: number

            if (aspectRatio === "auto") {
                // Use original proportions
                const scaleFactor = columnWidth / image.width
                finalHeight = image.height * scaleFactor
            } else if (aspectRatio === "square") {
                finalHeight = columnWidth
            } else if (aspectRatio === "portrait") {
                finalHeight = columnWidth * 1.4
            } else if (aspectRatio === "landscape") {
                finalHeight = columnWidth * 0.7
            } else {
                // fallback to auto
                const scaleFactor = columnWidth / image.width
                finalHeight = image.height * scaleFactor
            }

            layout.push({
                image,
                x: shortestColumnIndex * (columnWidth + gap),
                y: columnHeights[shortestColumnIndex],
                width: finalWidth,
                height: finalHeight,
            })

            // Update column height
            columnHeights[shortestColumnIndex] += finalHeight + gap
        })

        return layout
    }, [imageData, columnWidth, columns, gap, aspectRatio])

    const totalHeight = useMemo(() => {
        if (masonryLayout.length === 0) return 200 // Minimum fallback height
        const calculatedHeight = Math.max(
            ...masonryLayout.map((item) => item.y + item.height)
        )
        return Math.max(calculatedHeight, 200) // Ensure minimum height of 200px
    }, [masonryLayout])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: `${totalHeight}px`,
                minHeight: "200px",
                position: "relative",
                overflow: "hidden",
                ...props.style,
            }}
        >
            {masonryLayout.map((item, index) => {
                const hasText =
                    (item.image.title || item.image.description) &&
                    showText !== "none"
                // Fix: showText hover/always logic for preview
                // Move useState outside of map to avoid React error
                // const [showOverlay, setShowOverlay] = useState(false)
                // Instead, use a single overlay state for hover index
                // We'll use a single hoveredIndex state
                return (
                    <ImageGridItem
                        key={index}
                        item={item}
                        index={index}
                        hasText={hasText}
                        showText={showText}
                        borderRadius={borderRadius}
                        backgroundColor={backgroundColor}
                        animation={animation}
                        objectFit={objectFit}
                        textPosition={textPosition}
                        textPadding={textPadding}
                        titleFont={titleFont}
                        descriptionFont={descriptionFont}
                        titleColor={titleColor}
                        descriptionColor={descriptionColor}
                        scrollAnimation={scrollAnimation}
                    />
                )
            })}
            <style>{`
                .imggrid-text-hover:hover .imggrid-text-hover, .imggrid-text-hover:focus .imggrid-text-hover {
                    opacity: 1 !important;
                }
                .img-anim-zoom img { transform: scale(1); transition: transform 0.3s ease; }
                .img-anim-zoom:hover img, .img-anim-zoom:focus img { transform: scale(1.07); }
                .img-anim-scale img { transform: scale(1); transition: transform 0.3s ease; }
                .img-anim-scale:hover img, .img-anim-scale:focus img { transform: scale(1.1); }
                .img-anim-rotate img { transform: rotate(0deg); transition: transform 0.3s ease; }
                .img-anim-rotate:hover img, .img-anim-rotate:focus img { transform: rotate(5deg); }
                .img-anim-blur img { filter: blur(0px); transition: filter 0.3s ease; }
                .img-anim-blur:hover img, .img-anim-blur:focus img { filter: blur(2px); }
            `}</style>
        </div>
    )
}

function ImageGridItem({
    item,
    index,
    hasText,
    showText,
    borderRadius,
    backgroundColor,
    animation,
    objectFit,
    textPosition,
    textPadding,
    titleFont,
    descriptionFont,
    titleColor,
    descriptionColor,
    scrollAnimation,
}) {
    const [showOverlay, setShowOverlay] = useState(false)
    const itemRef = useRef(null)
    const isInView = useInView(itemRef, { once: true, margin: "-50px" })

    // Calculate text positioning based on the 9-grid system
    const getTextPositionStyles = () => {
        const isTop = textPosition.includes("top")
        const isBottom = textPosition.includes("bottom")
        const isLeft = textPosition.includes("left")
        const isRight = textPosition.includes("right")
        const isCenter = textPosition === "center"
        const isCenterHorizontal = textPosition.includes("center") && !isCenter

        let styles: CSSProperties = {
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            pointerEvents: "none",
            opacity:
                showText === "always" || (showText === "hover" && showOverlay)
                    ? 1
                    : 0,
            transition: "opacity 0.2s",
        }

        // Vertical positioning
        if (isTop) {
            styles.top = textPadding
            styles.alignItems = isLeft
                ? "flex-start"
                : isRight
                  ? "flex-end"
                  : "center"
            styles.justifyContent = "flex-start"
        } else if (isBottom) {
            styles.bottom = textPadding
            styles.alignItems = isLeft
                ? "flex-start"
                : isRight
                  ? "flex-end"
                  : "center"
            styles.justifyContent = "flex-end"
        } else if (isCenter) {
            styles.top = 0
            styles.bottom = 0
            styles.alignItems = "center"
            styles.justifyContent = "center"
        } else {
            // center-left or center-right
            styles.top = 0
            styles.bottom = 0
            styles.alignItems = isLeft ? "flex-start" : "flex-end"
            styles.justifyContent = "center"
        }

        // Horizontal positioning
        if (isLeft) {
            styles.left = textPadding
            styles.right = undefined
        } else if (isRight) {
            styles.right = textPadding
            styles.left = undefined
        } else {
            // center horizontal
            styles.left = textPadding
            styles.right = textPadding
        }

        // Full width/height for center positions
        if (isCenter || (!isTop && !isBottom)) {
            styles.width = "100%"
            styles.height = "100%"
            styles.left = 0
            styles.right = 0
        }

        return styles
    }

    // Get scroll animation styles
    const getScrollAnimationStyles = () => {
        if (scrollAnimation === "none") return {}

        const baseStyles = {
            transition: "transform 0.6s ease-out, opacity 0.6s ease-out",
        }

        if (!isInView) {
            switch (scrollAnimation) {
                case "slideUp":
                    return {
                        ...baseStyles,
                        transform: "translateY(50px)",
                        opacity: 0,
                    }
                case "slideDown":
                    return {
                        ...baseStyles,
                        transform: "translateY(-50px)",
                        opacity: 0,
                    }
                case "slideLeft":
                    return {
                        ...baseStyles,
                        transform: "translateX(50px)",
                        opacity: 0,
                    }
                case "slideRight":
                    return {
                        ...baseStyles,
                        transform: "translateX(-50px)",
                        opacity: 0,
                    }
                case "fadeIn":
                    return {
                        ...baseStyles,
                        opacity: 0,
                    }
                case "zoomIn":
                    return {
                        ...baseStyles,
                        transform: "scale(0.8)",
                        opacity: 0,
                    }
                case "rotateIn":
                    return {
                        ...baseStyles,
                        transform: "rotate(-10deg) scale(0.9)",
                        opacity: 0,
                    }
                default:
                    return baseStyles
            }
        }

        return {
            ...baseStyles,
            transform: "translateY(0px) translateX(0px) scale(1) rotate(0deg)",
            opacity: 1,
        }
    }

    return (
        <div
            ref={itemRef}
            style={{
                position: "absolute",
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${item.width}px`,
                height: `${item.height}px`,
                overflow: "hidden",
                borderRadius: `${borderRadius}px`,
                background: backgroundColor,
                transition:
                    animation !== "none"
                        ? "transform 0.3s, opacity 0.3s"
                        : undefined,
                ...getScrollAnimationStyles(),
            }}
            className={
                animation !== "none" ? `img-anim-${animation}` : undefined
            }
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    cursor:
                        hasText && showText === "hover" ? "pointer" : undefined,
                }}
                tabIndex={hasText && showText === "hover" ? 0 : undefined}
                onMouseEnter={
                    showText === "hover"
                        ? () => setShowOverlay(true)
                        : undefined
                }
                onMouseLeave={
                    showText === "hover"
                        ? () => setShowOverlay(false)
                        : undefined
                }
                onFocus={
                    showText === "hover"
                        ? () => setShowOverlay(true)
                        : undefined
                }
                onBlur={
                    showText === "hover"
                        ? () => setShowOverlay(false)
                        : undefined
                }
            >
                <img
                    src={item.image.src}
                    alt={item.image.alt || `Image ${index + 1}`}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: objectFit,
                        borderRadius: `${borderRadius}px`,
                        display: "block",
                        transition:
                            animation !== "none"
                                ? "transform 0.3s, opacity 0.3s"
                                : undefined,
                    }}
                    loading="lazy"
                />
                {hasText && (
                    <>
                        {/* Background overlay covering entire image */}
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor:
                                    showText === "always" ||
                                    (showText === "hover" && showOverlay)
                                        ? backgroundColor
                                        : "transparent",
                                borderRadius: `${borderRadius}px`,
                                opacity:
                                    showText === "always" ||
                                    (showText === "hover" && showOverlay)
                                        ? 0.8
                                        : 0,
                                transition: "opacity 0.2s",
                                pointerEvents: "none",
                            }}
                        />
                        {/* Text content */}
                        <div
                            style={{
                                ...getTextPositionStyles(),
                                backgroundColor: "transparent",
                                borderRadius: `${borderRadius}px`,
                            }}
                        >
                            {item.image.title && (
                                <span
                                    style={{
                                        ...titleFont,
                                        color: titleColor,
                                        marginBottom: 4,
                                    }}
                                >
                                    {item.image.title}
                                </span>
                            )}
                            {item.image.description && (
                                <span
                                    style={{
                                        ...descriptionFont,
                                        color: descriptionColor,
                                    }}
                                >
                                    {item.image.description}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

addPropertyControls(ImageGrid, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.ResponsiveImage },
                alt: { type: ControlType.String, defaultValue: "" },
                title: { type: ControlType.String, defaultValue: "" },
                description: { type: ControlType.String, defaultValue: "" },
            },
        },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 1",
                title: "Titolo 1",
                description: "Descrizione 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Image 2",
                title: "Titolo 2",
                description: "Descrizione 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                alt: "Image 3",
                title: "Titolo 3",
                description: "Descrizione 3",
            },
            {
                src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                alt: "Image 4",
                title: "Titolo 4",
                description: "Descrizione 4",
            },
            {
                src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                alt: "Image 5",
                title: "Titolo 5",
                description: "Descrizione 5",
            },
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Image 6",
                title: "Titolo 6",
                description: "Descrizione 6",
            },
        ],
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 2,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["auto", "square", "portrait", "landscape"],
        optionTitles: ["Auto", "Square", "Portrait", "Landscape"],
        defaultValue: "auto",
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Object Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    showText: {
        type: ControlType.Enum,
        title: "Show Text",
        options: ["none", "always", "hover"],
        optionTitles: ["None", "Always", "On Hover"],
        defaultValue: "none",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
        hidden: ({ showText }) => showText === "none",
    },
    textPosition: {
        type: ControlType.Enum,
        title: "Text Position",
        options: [
            "top-left",
            "top-center",
            "top-right",
            "center-left",
            "center",
            "center-right",
            "bottom-left",
            "bottom-center",
            "bottom-right",
        ],
        optionTitles: [
            "Top Left",
            "Top Center",
            "Top Right",
            "Center Left",
            "Center",
            "Center Right",
            "Bottom Left",
            "Bottom Center",
            "Bottom Right",
        ],
        defaultValue: "bottom-center",
        hidden: ({ showText }) => showText === "none",
    },
    textPadding: {
        type: ControlType.Number,
        title: "Text Padding",
        defaultValue: 16,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        hidden: ({ showText }) => showText === "none",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showText }) => showText === "none",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showText }) => showText === "none",
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        hidden: ({ showText }) => showText === "none",
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Description Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showText }) => showText === "none",
    },
    animation: {
        type: ControlType.Enum,
        title: "Animation",
        description: "Hover animation effect for images",
        options: ["none", "zoom"],
        optionTitles: ["None", "Zoom"],
        defaultValue: "none",
    },
    scrollAnimation: {
        type: ControlType.Enum,
        title: "Scroll Animation",
        description: "Animation when images appear during scrolling",
        options: [
            "none",
            "slideUp",
            "slideDown",
            "slideLeft",
            "slideRight",
            "fadeIn",
            "zoomIn",
            "rotateIn",
        ],
        optionTitles: [
            "None",
            "Slide Up",
            "Slide Down",
            "Slide Left",
            "Slide Right",
            "Fade In",
            "Zoom In",
            "Rotate In",
        ],
        defaultValue: "none",
    },
})
