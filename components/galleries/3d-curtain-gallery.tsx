// 3D Curtain Gallery - A masonry gallery with curtain-style 3D transforms
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


interface GalleryItem {
    id: string
    url: string
    height: number
    width: number
    link?: string
}

interface ImageInput {
    useUpload: boolean
    uploadedImage?: { src: string; srcSet?: string; alt?: string }
    imageUrl?: string
    link?: string
}

interface Props {
    layoutMode: "masonry" | "grid" | "single" | "staggered"
    columns: number
    gap: number
    itemRoundness: number
    customItemHeight: number
    useCustomHeight: boolean
    perspective: number
    scale: number
    curtainAngle: number
    autoScrollSpeed: number
    scrollDamping: number
    enableHoverScale: boolean
    hoverScale: number
    images: ImageInput[]
    overlayGradient: boolean
    overlayIntensity: number
    grayscale: number
    backgroundColor: string
}

/**
 *
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
function CurtainGallery3D(props: Props) {
    const {
        layoutMode = "masonry",
        columns: numColumns = 4,
        gap = 24,
        autoScrollSpeed = 0.5,
        scrollDamping = 0.95,
        images = [],
        backgroundColor = "#0f0f11",
        enableHoverScale = true,
        hoverScale = 1.1,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const galleryRef = React.useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const [layout, setLayout] = React.useState<{
        cols: GalleryItem[][]
        heights: number[]
    }>({ cols: [], heights: [] })

    const scrollY = React.useRef(0)
    const targetScrollY = React.useRef(0)
    const colRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const isDragging = React.useRef(false)
    const lastTouchY = React.useRef(0)
    const isInView = React.useRef(true)

    const itemsToLayout = React.useMemo(() => {
        if (images && images.length > 0) {
            return images.map((imageInput, i) => {
                const seed = (i * 1337) % 100

                let height: number
                if (props.useCustomHeight) {
                    height = props.customItemHeight
                } else if (layoutMode === "grid") {
                    height = 400
                } else if (layoutMode === "single") {
                    height = 500
                } else if (layoutMode === "staggered") {
                    height = i % 2 === 0 ? 350 : 450
                } else {
                    height = 300 + seed * 3
                }

                let url = ""
                if (imageInput.useUpload && imageInput.uploadedImage?.src) {
                    url = imageInput.uploadedImage.src
                } else if (!imageInput.useUpload && imageInput.imageUrl) {
                    url = imageInput.imageUrl
                } else {
                    url = `https://picsum.photos/400/${height}?random=${i}`
                }

                return {
                    id: `img-${i}`,
                    url,
                    height,
                    width: 400,
                    link: imageInput.link,
                }
            })
        } else {
            return Array.from({ length: 24 }).map((_, i) => {
                let height: number
                if (props.useCustomHeight) {
                    height = props.customItemHeight
                } else if (layoutMode === "grid") {
                    height = 400
                } else if (layoutMode === "single") {
                    height = 500
                } else if (layoutMode === "staggered") {
                    height = i % 2 === 0 ? 350 : 450
                } else {
                    height = 300 + Math.floor(Math.random() * 300)
                }
                return {
                    id: `placeholder-${i}`,
                    url: `https://picsum.photos/400/${height}?random=${i}`,
                    height,
                    width: 400,
                }
            })
        }
    }, [images, props.useCustomHeight, props.customItemHeight, layoutMode])

    React.useEffect(() => {
        const effectiveColumns = layoutMode === "single" ? 1 : numColumns
        const newCols: GalleryItem[][] = Array.from(
            { length: effectiveColumns },
            () => []
        )
        const newHeights = new Array(effectiveColumns).fill(0)

        if (layoutMode === "masonry" || layoutMode === "single") {
            itemsToLayout.forEach((item) => {
                let minHeight = newHeights[0]
                let minIndex = 0
                for (let i = 1; i < effectiveColumns; i++) {
                    if (newHeights[i] < minHeight) {
                        minHeight = newHeights[i]
                        minIndex = i
                    }
                }
                newCols[minIndex].push(item)
                newHeights[minIndex] += item.height + gap
            })
        } else if (layoutMode === "grid" || layoutMode === "staggered") {
            itemsToLayout.forEach((item, idx) => {
                const colIndex = idx % effectiveColumns
                newCols[colIndex].push(item)
                newHeights[colIndex] += item.height + gap
            })
        }

        setLayout({ cols: newCols, heights: newHeights })
        colRefs.current = new Array(effectiveColumns).fill(null)
    }, [numColumns, gap, itemsToLayout, layoutMode])

    React.useEffect(() => {
        // Skip animation loop in static contexts (canvas/export)
        if (isStatic) return

        // Set up IntersectionObserver to pause animation when offscreen
        const container = containerRef.current
        if (container && typeof window !== "undefined") {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        isInView.current = entry.isIntersecting
                    })
                },
                { threshold: 0 }
            )
            observer.observe(container)

            // Cleanup observer
            const currentContainer = container
            return () => {
                if (currentContainer) {
                    observer.unobserve(currentContainer)
                }
            }
        }
    }, [isStatic])

    React.useEffect(() => {
        // Skip animation loop in static contexts (canvas/export)
        if (isStatic) return

        let animationId: number

        const animate = () => {
            // Only animate if component is in view
            if (isInView.current) {
                if (!isDragging.current) {
                    targetScrollY.current += autoScrollSpeed
                }

                const diff = targetScrollY.current - scrollY.current
                if (Math.abs(diff) > 0.01) {
                    scrollY.current += diff * (1 - scrollDamping)

                    colRefs.current.forEach((ref, index) => {
                        if (!ref) return
                        const height = layout.heights[index]
                        if (height > 0) {
                            const y =
                                ((scrollY.current % height) + height) % height
                            ref.style.transform = `translate3d(0, -${y}px, 0)`
                        }
                    })
                }
            }

            animationId = requestAnimationFrame(animate)
        }

        animationId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationId)
    }, [autoScrollSpeed, scrollDamping, layout.heights, isStatic])

    const handleWheel = React.useCallback((e: WheelEvent) => {
        e.preventDefault()
        targetScrollY.current += e.deltaY
    }, [])

    const handleTouchStart = React.useCallback((e: TouchEvent) => {
        lastTouchY.current = e.touches[0].clientY
        isDragging.current = true
    }, [])

    const handleTouchMove = React.useCallback((e: TouchEvent) => {
        if (!isDragging.current) return
        e.preventDefault()
        const currentY = e.touches[0].clientY
        const deltaY = lastTouchY.current - currentY
        targetScrollY.current += deltaY * 2
        lastTouchY.current = currentY
    }, [])

    const handleTouchEnd = React.useCallback(() => {
        isDragging.current = false
    }, [])

    React.useEffect(() => {
        const container = containerRef.current
        if (!container || typeof window === "undefined" || isStatic) return

        container.addEventListener("wheel", handleWheel, { passive: false })
        container.addEventListener("touchstart", handleTouchStart, {
            passive: false,
        })
        container.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        })
        container.addEventListener("touchend", handleTouchEnd, {
            passive: false,
        })

        return () => {
            container.removeEventListener("wheel", handleWheel)
            container.removeEventListener("touchstart", handleTouchStart)
            container.removeEventListener("touchmove", handleTouchMove)
            container.removeEventListener("touchend", handleTouchEnd)
        }
    }, [
        handleWheel,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        isStatic,
    ])

    const getColumnTransform = React.useCallback(
        (colIndex: number, totalCols: number) => {
            const normalized =
                totalCols === 1 ? 0 : (colIndex / (totalCols - 1)) * 2 - 1
            const absNorm = Math.abs(normalized)

            const rotY = normalized * 35 * props.curtainAngle
            const rotX = -8 * props.curtainAngle
            const z = -absNorm * 80 * props.curtainAngle

            return {
                transform: `translateZ(${z}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                transformOrigin: "center top",
                zIndex: Math.round(100 - absNorm * 20),
            }
        },
        [props.curtainAngle]
    )

    const renderColumn = React.useCallback(
        (colItems: GalleryItem[], colIndex: number, totalCols: number) => {
            const tripleItems = [...colItems, ...colItems, ...colItems]
            const colTransform = getColumnTransform(colIndex, totalCols)

            return (
                <div
                    key={`col-wrap-${colIndex}`}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        transform: colTransform.transform,
                        transformOrigin: colTransform.transformOrigin,
                        transformStyle: "preserve-3d",
                        zIndex: colTransform.zIndex,
                        transition:
                            "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform-origin 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                        willChange: "transform",
                    }}
                >
                    <div
                        ref={(el) => {
                            colRefs.current[colIndex] = el
                        }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: `${gap}px`,
                            willChange: "transform",
                        }}
                    >
                        {tripleItems.map((item, idx) => {
                            const content = (
                                <div
                                    key={`${item.id}-${idx}`}
                                    className="gallery-item-group"
                                    style={{
                                        position: "relative",
                                        borderRadius: `${props.itemRoundness}px`,
                                        height: `${item.height}px`,
                                        width: "100%",
                                        overflow: "hidden",
                                        filter: `grayscale(${props.grayscale})`,
                                        flexShrink: 0,
                                        backgroundColor: "#222",
                                    }}
                                >
                                    <img
                                        src={item.url}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            transition:
                                                "transform 0.5s ease-out",
                                            display: "block",
                                            willChange: "transform",
                                            userSelect: "none",
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background: "black",
                                            opacity: 0,
                                            transition: "opacity 0.3s",
                                            pointerEvents: "none",
                                        }}
                                    />
                                </div>
                            )

                            if (item.link) {
                                return (
                                    <a
                                        key={`${item.id}-${idx}`}
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            textDecoration: "none",
                                            display: "block",
                                        }}
                                    >
                                        {content}
                                    </a>
                                )
                            }

                            return content
                        })}
                    </div>
                </div>
            )
        },
        [gap, props.itemRoundness, props.grayscale, getColumnTransform]
    )

    const overlayStyle = React.useCallback(
        (side: string): React.CSSProperties => {
            const isVert = side === "top" || side === "bottom"
            return {
                position: "absolute",
                [side]: 0,
                left: side === "right" ? "auto" : 0,
                right: side === "left" ? "auto" : 0,
                top: side === "bottom" ? "auto" : 0,
                bottom: side === "top" ? "auto" : 0,
                width: isVert ? "100%" : "20%",
                height: isVert ? "20%" : "100%",
                background: `linear-gradient(to ${side === "top" ? "bottom" : side === "bottom" ? "top" : side === "left" ? "right" : "left"}, ${backgroundColor}, transparent)`,
                opacity: props.overlayIntensity,
                pointerEvents: "none",
                zIndex: 10,
            }
        },
        [backgroundColor, props.overlayIntensity]
    )

    const totalCols = layout.cols.length

    const renderedColumns = React.useMemo(
        () => layout.cols.map((col, i) => renderColumn(col, i, totalCols)),
        [layout.cols, renderColumn, totalCols]
    )

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor: backgroundColor,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <style>{`
                .gallery-item-group img { 
                    transition: transform 0.7s cubic-bezier(0.19, 1, 0.22, 1);
                    will-change: transform;
                    backface-visibility: hidden;
                    transform: scale3d(1, 1, 1);
                }
                .gallery-item-group:hover img { 
                    transform: scale3d(${enableHoverScale ? hoverScale : 1}, ${enableHoverScale ? hoverScale : 1}, 1);
                }
                .gallery-item-group > div:last-child {
                    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .gallery-item-group:hover > div:last-child { 
                    opacity: 0.2 !important; 
                }
            `}</style>

            <div
                style={{
                    perspective: `${props.perspective}px`,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    ref={galleryRef}
                    style={{
                        transformStyle: "preserve-3d",
                        transform: `rotateX(4deg) scale(${props.scale})`,
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        transition:
                            "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                        willChange: "transform",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: "-50%",
                            left: 0,
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            gap: `${gap}px`,
                            padding: `${gap}px`,
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {renderedColumns}
                    </div>
                </div>
            </div>

            {props.overlayGradient && (
                <>
                    <div style={overlayStyle("top")} />
                    <div style={overlayStyle("bottom")} />
                    <div style={overlayStyle("left")} />
                    <div style={overlayStyle("right")} />
                </>
            )}
        </div>
    )
}

addPropertyControls(CurtainGallery3D, {
    images: {
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                useUpload: {
                    type: ControlType.Boolean,
                    title: "Input Type",
                    enabledTitle: "Upload",
                    disabledTitle: "URL",
                    defaultValue: true,
                },
                uploadedImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Upload Image",
                    hidden: (props) => !props.useUpload,
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://example.com/image.jpg",
                    hidden: (props) => props.useUpload,
                },
                link: {
                    type: ControlType.Link,
                    title: "CMS Link",
                },
            },
        },
        title: "Images",
        description:
            "Add images to display. Choose upload or URL per image. Leave empty for placeholders.",
        defaultValue: [
            {
                useUpload: false,
                imageUrl:
                    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            },
            {
                useUpload: false,
                imageUrl:
                    "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            },
            {
                useUpload: false,
                imageUrl:
                    "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            },
            {
                useUpload: false,
                imageUrl:
                    "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            },
            {
                useUpload: false,
                imageUrl:
                    "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            },
            {
                useUpload: false,
                imageUrl:
                    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            },
            {
                useUpload: false,
                imageUrl:
                    "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            },
            {
                useUpload: false,
                imageUrl:
                    "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
            },
            {
                useUpload: false,
                imageUrl:
                    "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
            },
            {
                useUpload: false,
                imageUrl:
                    "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            },
        ],
    },

    layoutMode: {
        type: ControlType.Enum,
        title: "Layout",
        description:
            "Layout pattern. Masonry uses varied heights, Grid is uniform, Single is one column, Staggered alternates.",
        options: ["masonry", "grid", "single", "staggered"],
        optionTitles: ["Masonry", "Grid", "Single", "Staggered"],
        defaultValue: "masonry",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        description: "Number of columns in the gallery.",
        defaultValue: 4,
        min: 1,
        max: 8,
        step: 1,
        hidden: (props) => props.layoutMode === "single",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        description: "Spacing between gallery items in pixels.",
        defaultValue: 24,
        min: 0,
        max: 100,
    },
    itemRoundness: {
        type: ControlType.Number,
        title: "Radius",
        description: "Corner radius for items in pixels.",
        defaultValue: 16,
        min: 0,
        max: 100,
    },
    useCustomHeight: {
        type: ControlType.Boolean,
        title: "Custom Height",
        description: "Toggle fixed-height items vs varied heights.",
        defaultValue: false,
        enabledTitle: "Fixed",
        disabledTitle: "Varied",
    },
    customItemHeight: {
        type: ControlType.Number,
        title: "Item Height",
        description: "Fixed height when Custom Height is enabled.",
        defaultValue: 400,
        min: 100,
        max: 1000,
        step: 10,
        hidden: (props) => !props.useCustomHeight,
    },

    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        description: "3D perspective depth. Lower = more dramatic.",
        defaultValue: 1400,
        min: 200,
        max: 3000,
    },
    scale: {
        type: ControlType.Number,
        title: "Scale",
        description:
            "Overall gallery size. Above 1 zooms in, below 1 zooms out.",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
    },

    curtainAngle: {
        type: ControlType.Number,
        title: "Drape",
        description: "Curtain: rotation outward from the top edge.",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.1,
    },

    autoScrollSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        description:
            "Automatic scroll speed. Negative reverses direction, 0 disables.",
        defaultValue: 0.5,
        min: -10,
        max: 10,
        step: 0.1,
    },
    scrollDamping: {
        type: ControlType.Number,
        title: "Damping",
        description: "Scroll smoothness. Higher = slower deceleration.",
        defaultValue: 0.95,
        min: 0.5,
        max: 0.99,
        step: 0.01,
    },
    enableHoverScale: {
        type: ControlType.Boolean,
        title: "Hover Scale",
        description: "Enable scale-on-hover for items.",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Scale Amount",
        description: "Hover scale multiplier.",
        defaultValue: 1.1,
        min: 1,
        max: 1.5,
        step: 0.05,
        hidden: (props) => !props.enableHoverScale,
    },

    grayscale: {
        type: ControlType.Number,
        title: "Grayscale",
        description: "0 = full color, 1 = grayscale.",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.1,
    },
    overlayGradient: {
        type: ControlType.Boolean,
        title: "Overlay",
        description: "Edge-fade gradients on all four sides.",
        defaultValue: true,
    },
    overlayIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        description: "Edge-fade opacity.",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.1,
        hidden: (props) => !props.overlayGradient,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Bg Color",
        description: "Background and edge-fade color.",
        defaultValue: "#0f0f11",
    },
})

export default CurtainGallery3D
