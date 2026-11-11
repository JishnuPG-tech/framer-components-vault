// Bento Creator Component - Creates a customizable bento grid layout over an image
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { type CSSProperties, useState, startTransition, useMemo, useEffect } from "react"

interface BentoGridCreatorProps {
    images: Array<{
        src: string
        alt: string
    }>
    gridColumns: number
    gridRows: number
    gap: number
    borderRadius: number
    borderWidth: number
    borderColor: string
    backgroundColor: string
    opacity: number
    overlayColor: string
    overlayOpacity: number
    showOverlay: boolean
    enableLightbox: boolean
    animationDuration: number
    lightboxBackgroundColor: string
    lightboxOpacity: number
    enableSpanning: boolean
    spanConfig: Array<{
        imageIndex: number
        colSpan: number
        rowSpan: number
    }>
    grayscaleOnHover: boolean
    style?: CSSProperties
}

/**
 * Bento Creator Component
 * 
 * Creates a customizable bento grid layout with individual images for each cell.
 * Each bento card has its own image that maintains aspect ratio without stretching.
 * Click on cards to shift their positions with smooth animations or open in lightbox.
 * Cards can span multiple columns and rows for dynamic layouts.
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function BentoGridCreator(props: BentoGridCreatorProps) {
    const {
        images = [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 1" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 2" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 3" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 4" },
        ],
        gridColumns = 2,
        gridRows = 2,
        gap = 8,
        borderRadius = 24,
        borderWidth = 0,
        borderColor = "#000000",
        backgroundColor = "#FFFFFF",
        opacity = 1,
        overlayColor = "#000000",
        overlayOpacity = 0.2,
        showOverlay = false,
        enableLightbox = false,
        animationDuration = 0.3,
        lightboxBackgroundColor = "#000000",
        lightboxOpacity = 0.9,
        enableSpanning = false,
        spanConfig = [
            { imageIndex: 0, colSpan: 2, rowSpan: 1 },
            { imageIndex: 2, colSpan: 1, rowSpan: 2 },
        ],
        grayscaleOnHover = false,
        style
    } = props

    // Calculate grid layout with spanning
    const gridLayout = useMemo(() => {
        if (!enableSpanning) {
            // Regular grid without spanning - distribute images without repetition
            const totalCells = gridColumns * gridRows
            // Fill all cells with images, cycling through the images array if needed
            return Array.from({ length: totalCells }, (_, index) => ({
                imageIndex: images.length > 0 ? index % images.length : index % 4,
                colSpan: 1,
                rowSpan: 1,
                gridColumn: (index % gridColumns) + 1,
                gridRow: Math.floor(index / gridColumns) + 1,
                cellIndex: index
            }))
        }

        // Create a grid matrix to track occupied cells
        const grid = Array(gridRows).fill(null).map(() => Array(gridColumns).fill(false))
        const layout = []
        const usedImages = new Set()

        // Place spanning items first
        spanConfig.forEach((span) => {
            if (span.imageIndex < images.length && !usedImages.has(span.imageIndex)) {
                // Find the first available position for this span
                for (let row = 0; row <= gridRows - span.rowSpan; row++) {
                    for (let col = 0; col <= gridColumns - span.colSpan; col++) {
                        // Check if the area is available
                        let canPlace = true
                        for (let r = row; r < row + span.rowSpan; r++) {
                            for (let c = col; c < col + span.colSpan; c++) {
                                if (grid[r][c]) {
                                    canPlace = false
                                    break
                                }
                            }
                            if (!canPlace) break
                        }

                        if (canPlace) {
                            // Mark the area as occupied
                            for (let r = row; r < row + span.rowSpan; r++) {
                                for (let c = col; c < col + span.colSpan; c++) {
                                    grid[r][c] = true
                                }
                            }

                            layout.push({
                                imageIndex: span.imageIndex,
                                colSpan: span.colSpan,
                                rowSpan: span.rowSpan,
                                gridColumn: col + 1,
                                gridRow: row + 1,
                                cellIndex: layout.length
                            })
                            usedImages.add(span.imageIndex)
                            return // Move to next span
                        }
                    }
                }
            }
        })

        // Fill remaining cells with 1x1 items using unused images
        let currentImageIndex = 0
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridColumns; col++) {
                if (!grid[row][col]) {
                    // Find next unused image
                    while (currentImageIndex < images.length && usedImages.has(currentImageIndex)) {
                        currentImageIndex++
                    }
                    
                    const imageIndex = currentImageIndex < images.length ? currentImageIndex : null
                    
                    layout.push({
                        imageIndex: imageIndex,
                        colSpan: 1,
                        rowSpan: 1,
                        gridColumn: col + 1,
                        gridRow: row + 1,
                        cellIndex: layout.length
                    })
                    
                    if (imageIndex !== null) {
                        usedImages.add(imageIndex)
                        currentImageIndex++
                    }
                }
            }
        }

        return layout
    }, [enableSpanning, spanConfig, gridColumns, gridRows, images.length])
    
    // State for lightbox
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null)
    const [lightboxImageIndex, setLightboxImageIndex] = useState(0)

    // Function to handle card clicks
    const handleCardClick = (clickedIndex: number) => {
        const imageIndex = enableSpanning ? gridLayout[clickedIndex].imageIndex : clickedIndex
        const currentImage = images[imageIndex] || { 
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", 
            alt: "Default Image" 
        }
        
        if (enableLightbox) {
            // Open lightbox
            const imageSrc = typeof currentImage === 'object' && currentImage !== null 
                ? (currentImage.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg")
                : "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
            
            const imageAlt = typeof currentImage === 'object' && currentImage !== null 
                ? (currentImage.alt || "Image")
                : "Image"
            
            startTransition(() => {
                setLightboxImage({ src: imageSrc, alt: imageAlt })
                setLightboxImageIndex(imageIndex)
                setLightboxOpen(true)
            })
        }
    }

    // Function to navigate to next image in lightbox
    const navigateToNextImage = () => {
        const nextIndex = (lightboxImageIndex + 1) % images.length
        const nextImage = images[nextIndex] || { 
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", 
            alt: "Default Image" 
        }
        
        const imageSrc = typeof nextImage === 'object' && nextImage !== null 
            ? (nextImage.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg")
            : "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
        
        const imageAlt = typeof nextImage === 'object' && nextImage !== null 
            ? (nextImage.alt || "Image")
            : "Image"
        
        startTransition(() => {
            setLightboxImage({ src: imageSrc, alt: imageAlt })
            setLightboxImageIndex(nextIndex)
        })
    }

    // Function to navigate to previous image in lightbox
    const navigateToPreviousImage = () => {
        const prevIndex = lightboxImageIndex === 0 ? images.length - 1 : lightboxImageIndex - 1
        const prevImage = images[prevIndex] || { 
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", 
            alt: "Default Image" 
        }
        
        const imageSrc = typeof prevImage === 'object' && prevImage !== null 
            ? (prevImage.src || "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg")
            : "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"
        
        const imageAlt = typeof prevImage === 'object' && prevImage !== null 
            ? (prevImage.alt || "Image")
            : "Image"
        
        startTransition(() => {
            setLightboxImage({ src: imageSrc, alt: imageAlt })
            setLightboxImageIndex(prevIndex)
        })
    }

    // Function to close lightbox
    const closeLightbox = () => {
        startTransition(() => {
            setLightboxOpen(false)
            setLightboxImage(null)
            setLightboxImageIndex(0)
        })
    }

    // Add keyboard event listeners for lightbox navigation
    useEffect(() => {
        if (!lightboxOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            switch (event.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault()
                    navigateToNextImage()
                    break
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault()
                    navigateToPreviousImage()
                    break
                case 'Escape':
                    event.preventDefault()
                    closeLightbox()
                    break
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener('keydown', handleKeyDown)
            }
        }
    }, [lightboxOpen, lightboxImageIndex, images.length])

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: borderRadius,
                backgroundColor: backgroundColor,
            }}
        >
            {/* Bento Grid */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                    gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                    gap: `${gap}px`,
                    padding: `${gap}px`,
                    zIndex: 2,
                }}
            >
                {Array.from({ length: gridLayout.length }, (_, index) => {
                    const imageIndex = gridLayout[index].imageIndex
                    // Only show an image if imageIndex is not null and index < 4 (no placeholders after 4)
                    if (imageIndex === null) return null
                    // fallback to default images if images array is empty or missing
                    const fallbackImages = [
                        { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 1" },
                        { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 2" },
                        { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 3" },
                        { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 4" },
                    ]
                    const currentImage = (images && images.length > 0 && images[imageIndex]) || fallbackImages[imageIndex] || fallbackImages[0]
                    const imageSrc = typeof currentImage === 'object' && currentImage !== null 
                        ? (currentImage.src || fallbackImages[0].src)
                        : fallbackImages[0].src
                    const imageAlt = typeof currentImage === 'object' && currentImage !== null 
                        ? (currentImage.alt || "Image")
                        : "Image"
                    const layoutItem = gridLayout[index]
                    return (
                        <div
                            key={index}
                            onClick={() => handleCardClick(index)}
                            style={{
                                width: "100%",
                                height: "100%",
                                border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : "none",
                                borderRadius: `${Math.max(0, borderRadius - gap)}px`,
                                backgroundColor: "transparent",
                                overflow: "hidden",
                                position: "relative",
                                cursor: enableLightbox ? "pointer" : "default",
                                transition: `all ${animationDuration}s ease-in-out`,
                                transform: "scale(1)",
                                gridColumn: enableSpanning ? `${layoutItem.gridColumn} / span ${layoutItem.colSpan}` : "auto",
                                gridRow: enableSpanning ? `${layoutItem.gridRow} / span ${layoutItem.rowSpan}` : "auto",
                            }}
                        >
                            {/* Container for image and overlay that scales together */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    transition: `transform ${animationDuration}s ease-in-out`,
                                    transform: "scale(1)",
                                    overflow: "hidden",
                                }}
                                className={`bento-card-${index}`}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "scale(1.03)"
                                    if (grayscaleOnHover) {
                                        const img = e.currentTarget.querySelector('img')
                                        if (img) {
                                            img.style.filter = "grayscale(100%)"
                                        }
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "scale(1)"
                                    if (grayscaleOnHover) {
                                        const img = e.currentTarget.querySelector('img')
                                        if (img) {
                                            img.style.filter = "grayscale(0%)"
                                        }
                                    }
                                }}
                            >
                                {/* Individual cell image */}
                                <img
                                    src={imageSrc}
                                    alt={imageAlt}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        objectPosition: "center",
                                        opacity: opacity,
                                        transition: `filter ${animationDuration}s ease-in-out`,
                                    }}
                                />
                                {/* Individual cell overlay */}
                                {showOverlay && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: overlayColor,
                                            opacity: overlayOpacity,
                                            transition: `opacity ${animationDuration}s ease-in-out`,
                                            zIndex: 1,
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Lightbox */}
            {lightboxOpen && lightboxImage && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: lightboxBackgroundColor,
                        opacity: lightboxOpacity,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                        cursor: "pointer",
                        animation: `fadeIn ${animationDuration}s ease-in-out`,
                    }}
                    onClick={closeLightbox}
                >
                    <img
                        src={lightboxImage.src}
                        alt={lightboxImage.alt}
                        style={{
                            width: "60vh",
                            height: "80vh",
                            objectFit: "cover",
                            borderRadius: borderRadius,
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
                            animation: `scaleIn ${animationDuration}s ease-in-out`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="lightbox-image"
                    />
                    
                    {/* Close button */}
                    <button
                        onClick={closeLightbox}
                        style={{
                            position: "absolute",
                            top: "20px",
                            right: "20px",
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            border: "none",
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            color: "#000",
                            fontSize: "20px",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            transition: `all ${animationDuration}s ease-in-out`,
                            // Center the X icon perfectly
                            padding: 0,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 1)"
                            e.currentTarget.style.transform = "scale(1.1)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)"
                            e.currentTarget.style.transform = "scale(1)"
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display: "block"}}>
                            <line x1="5" y1="5" x2="15" y2="15" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                            <line x1="15" y1="5" x2="5" y2="15" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: ${lightboxOpacity}; }
                }
                
                @keyframes scaleIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                @media (max-width: 768px) {
                    .lightbox-image {
                        width: calc(100vw - 40px) !important;
                        height: auto !important;
                        max-height: calc(100vh - 80px) !important;
                    }
                }
            `}</style>
        </div>
    )
}

addPropertyControls(BentoGridCreator, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 1" },
            { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 2" },
            { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 3" },
            { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 4" },
            { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Image 5" },
        ],
        maxCount: 20,
    },
    gridColumns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    gridRows: {
        type: ControlType.Number,
        title: "Rows", 
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 24,
        min: 0,
        max: 100,
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
        hidden: ({ borderWidth }) => borderWidth === 0,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.1,
    },
    grayscaleOnHover: {
        type: ControlType.Boolean,
        title: "Grayscale on Hover",
        description: "Apply grayscale filter to images on hover",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showOverlay: {
        type: ControlType.Boolean,
        title: "Overlay",
        description: "Toggle overlay on bento cards",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
        hidden: ({ showOverlay }) => !showOverlay,
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.1,
        hidden: ({ showOverlay }) => !showOverlay,
    },
    enableLightbox: {
        type: ControlType.Boolean,
        title: "Lightbox",
        description: "Enable image lightbox modal on card click.",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    lightboxBackgroundColor: {
        type: ControlType.Color,
        title: "Lightbox Background",
        defaultValue: "#000000",
        hidden: ({ enableLightbox }) => !enableLightbox,
    },
    lightboxOpacity: {
        type: ControlType.Number,
        title: "Lightbox Opacity",
        defaultValue: 0.9,
        min: 0,
        max: 1,
        step: 0.1,
        hidden: ({ enableLightbox }) => !enableLightbox,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    enableSpanning: {
        type: ControlType.Boolean,
        title: "Spanning",
        description: "Allow cards to span multiple columns and rows",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    spanConfig: {
        type: ControlType.Array,
        title: "Bento Span",
        description: "Configure which images span multiple cells. Set imageIndex to the image position (0-based), colSpan for columns, and rowSpan for rows.",
        control: {
            type: ControlType.Object,
            controls: {
                imageIndex: {
                    type: ControlType.Number,
                    title: "Image Index",
                    defaultValue: 0,
                    min: 0,
                    max: 10,
                    step: 1,
                    displayStepper: true,
                },
                colSpan: {
                    type: ControlType.Number,
                    title: "Col Span",
                    defaultValue: 1,
                    min: 1,
                    max: 10,
                    step: 1,
                    displayStepper: true,
                },
                rowSpan: {
                    type: ControlType.Number,
                    title: "Row Span",
                    defaultValue: 1,
                    min: 1,
                    max: 10,
                    step: 1,
                    displayStepper: true,
                },
            },
        },
        defaultValue: [
            { imageIndex: 0, colSpan: 2, rowSpan: 1 },
            { imageIndex: 2, colSpan: 1, rowSpan: 2 },
        ],
        hidden: ({ enableSpanning }) => !enableSpanning,
    },
})