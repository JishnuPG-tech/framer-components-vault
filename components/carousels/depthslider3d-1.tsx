// A powerful 3D carousel slider component for interactive galleries, portfolios, and showcases
import {
    useEffect,
    useRef,
    useState,
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

import { motion, useMotionValue, useSpring, useInView } from "framer-motion"

interface MediaItem {
    type: "image" | "video"
    src: string
    alt?: string
    title?: string
    uploadedFile?: string
    uploadedImage?: {
        src: string
        srcSet?: string
        alt?: string
    }
    description?: string
}

interface Carousel3DProps {
    usePlugin: boolean
    pluginItems?: MediaItem[]
    items: MediaItem[]
    radius: number
    itemWidth: number
    itemHeight: number
    perspective: number
    autoRotate: boolean
    rotationSpeed: number
    dragSensitivity: number
    showTitles: boolean
    titleFont: CSSProperties
    titleColor: string
    backgroundColor: string
    itemBorderRadius: number
    shadowIntensity: number
    enablePopup: boolean
    popupBackgroundColor: string
    popupOverlayColor: string
    showDescription: boolean
    descriptionFont: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Carousel3D(props: Carousel3DProps) {
    const {
        usePlugin = false,
        pluginItems = [],
        items = [
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=90",
                alt: "Modern Architecture - Glass building with geometric patterns",
                title: "Modern Architecture",
                description:
                    "Contemporary architectural design featuring clean lines and geometric patterns",
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=1200&q=90",
                alt: "Abstract Art - Colorful gradient composition",
                title: "Abstract Art",
                description:
                    "Vibrant abstract composition with flowing colors and shapes",
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&q=90",
                alt: "Nature Landscape - Mountain vista at sunset",
                title: "Nature Vista",
                description:
                    "Breathtaking mountain landscape captured during golden hour",
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=1200&q=90",
                alt: "Technology - Futuristic digital interface",
                title: "Digital Future",
                description: "Cutting-edge technology and digital innovation",
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=1200&q=90",
                alt: "Urban Design - City skyline at night",
                title: "Urban Nights",
                description: "Dynamic city architecture illuminated after dark",
            },
        ],
        radius = 400,
        itemWidth = 300,
        itemHeight = 400,
        perspective = 1200,
        autoRotate = true,
        rotationSpeed = 0.3,
        dragSensitivity = 0.5,
        showTitles = true,
        titleFont,
        titleColor = "#FFFFFF",
        backgroundColor = "#000000",
        itemBorderRadius = 16,
        shadowIntensity = 0.5,
        enablePopup = true,
        popupBackgroundColor = "#FFFFFF",
        popupOverlayColor = "rgba(0, 0, 0, 0.8)",
        showDescription = true,
        descriptionFont,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const rotation = useMotionValue(0)
    const springRotation = useSpring(rotation, { stiffness: 50, damping: 20 })
    const [isDragging, setIsDragging] = useState(false)
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
    const dragStartRef = useRef(0)
    const lastRotationRef = useRef(0)
    const autoRotateRef = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()
    const isInView = useInView(containerRef, { once: false, amount: 0.3 })

    // Use plugin items if enabled, otherwise use manual items
    const displayItems =
        usePlugin && pluginItems && pluginItems.length > 0 ? pluginItems : items

    const itemCount = displayItems.length
    const angleStep = itemCount > 0 ? (Math.PI * 2) / itemCount : 0

    useEffect(() => {
        if (isStatic || !autoRotate || isDragging || !isInView) return

        const startTime = Date.now()
        const startRotation = rotation.get()

        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000
            const newRotation = startRotation + elapsed * rotationSpeed
            rotation.set(newRotation)
            autoRotateRef.current = requestAnimationFrame(animate)
        }

        autoRotateRef.current = requestAnimationFrame(animate)

        return () => {
            if (autoRotateRef.current) {
                cancelAnimationFrame(autoRotateRef.current)
            }
        }
    }, [isStatic, autoRotate, isDragging, rotationSpeed, rotation, isInView])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isStatic) return
        startTransition(() => {
            setIsDragging(true)
            dragStartRef.current = e.clientX
            lastRotationRef.current = rotation.get()
        })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || isStatic) return
        const delta = e.clientX - dragStartRef.current
        const rotationDelta = (delta / 100) * dragSensitivity
        rotation.set(lastRotationRef.current + rotationDelta)
    }

    const handleMouseUp = () => {
        if (isStatic) return
        startTransition(() => {
            setIsDragging(false)
        })
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isStatic) return
        startTransition(() => {
            setIsDragging(true)
            dragStartRef.current = e.touches[0].clientX
            lastRotationRef.current = rotation.get()
        })
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || isStatic) return
        const delta = e.touches[0].clientX - dragStartRef.current
        const rotationDelta = (delta / 100) * dragSensitivity
        rotation.set(lastRotationRef.current + rotationDelta)
    }

    const handleTouchEnd = () => {
        if (isStatic) return
        startTransition(() => {
            setIsDragging(false)
        })
    }

    const handleItemClick = (item: MediaItem) => {
        if (!enablePopup || isDragging) return
        startTransition(() => {
            setSelectedItem(item)
        })
    }

    const handleClosePopup = () => {
        startTransition(() => {
            setSelectedItem(null)
        })
    }

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: backgroundColor,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: "16px",
                        padding: "20px",
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {displayItems.slice(0, 3).map((item, index) => (
                        <div
                            key={index}
                            style={{
                                width: "100%",
                                aspectRatio: "3/4",
                                borderRadius: `${itemBorderRadius}px`,
                                overflow: "hidden",
                                boxShadow: `0 ${10 * shadowIntensity}px ${20 * shadowIntensity}px rgba(0,0,0,${0.3 * shadowIntensity})`,
                            }}
                        >
                            <img
                                src={
                                    item.uploadedImage?.src ||
                                    item.uploadedFile ||
                                    item.src
                                }
                                srcSet={item.uploadedImage?.srcSet}
                                alt={
                                    item.uploadedImage?.alt ||
                                    item.alt ||
                                    `Slide ${index + 1}`
                                }
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: backgroundColor,
                overflow: "hidden",
                position: "relative",
                cursor: isDragging ? "grabbing" : "grab",
                userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: `${perspective}px`,
                    transformStyle: "preserve-3d",
                }}
            >
                {displayItems.map((item, index) => {
                    const angle = index * angleStep

                    return (
                        <motion.div
                            key={index}
                            style={{
                                position: "absolute",
                                width: `${itemWidth}px`,
                                height: `${itemHeight}px`,
                                borderRadius: `${itemBorderRadius}px`,
                                overflow: "hidden",
                                boxShadow: `0 ${20 * shadowIntensity}px ${40 * shadowIntensity}px rgba(0,0,0,${0.3 * shadowIntensity})`,
                                transformStyle: "preserve-3d",
                                backfaceVisibility: "hidden",
                                cursor: enablePopup ? "pointer" : "grab",
                            }}
                            animate={{
                                rotateY:
                                    springRotation.get() * (180 / Math.PI) +
                                    angle * (180 / Math.PI),
                                x:
                                    Math.sin(angle + springRotation.get()) *
                                    radius,
                                z:
                                    Math.cos(angle + springRotation.get()) *
                                    radius,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 50,
                                damping: 20,
                            }}
                            onClick={() => handleItemClick(item)}
                        >
                            {item.type === "image" ? (
                                <img
                                    src={
                                        item.uploadedImage?.src ||
                                        item.uploadedFile ||
                                        item.src
                                    }
                                    srcSet={item.uploadedImage?.srcSet}
                                    alt={
                                        item.uploadedImage?.alt ||
                                        item.alt ||
                                        `Slide ${index + 1}`
                                    }
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                    draggable={false}
                                />
                            ) : (
                                <video
                                    src={item.uploadedFile || item.src}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                    muted
                                    loop
                                    playsInline
                                />
                            )}
                            {showTitles && item.title && (
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: "16px",
                                        background:
                                            "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                                        color: titleColor,
                                        ...titleFont,
                                    }}
                                >
                                    {item.title}
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </motion.div>

            {/* Popup Modal */}
            {selectedItem && (
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
                        backgroundColor: popupOverlayColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        padding: "20px",
                    }}
                    onClick={handleClosePopup}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                        }}
                        style={{
                            backgroundColor: popupBackgroundColor,
                            borderRadius: `${itemBorderRadius}px`,
                            maxWidth: "90vw",
                            maxHeight: "90vh",
                            overflow: "hidden",
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClosePopup}
                            style={{
                                position: "absolute",
                                top: "16px",
                                right: "16px",
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                border: "none",
                                backgroundColor: "rgba(0, 0, 0, 0.5)",
                                color: "#FFFFFF",
                                fontSize: "24px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 10,
                                transition: "background-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "rgba(0, 0, 0, 0.8)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                    "rgba(0, 0, 0, 0.5)"
                            }}
                        >
                            ×
                        </button>

                        {/* Media Content */}
                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                            }}
                        >
                            {selectedItem.type === "image" ? (
                                <img
                                    src={
                                        selectedItem.uploadedImage?.src ||
                                        selectedItem.uploadedFile ||
                                        selectedItem.src
                                    }
                                    srcSet={selectedItem.uploadedImage?.srcSet}
                                    alt={
                                        selectedItem.uploadedImage?.alt ||
                                        selectedItem.alt ||
                                        "Popup image"
                                    }
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "70vh",
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <video
                                    src={
                                        selectedItem.uploadedFile ||
                                        selectedItem.src
                                    }
                                    controls
                                    autoPlay
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "70vh",
                                        objectFit: "contain",
                                    }}
                                />
                            )}
                        </div>

                        {/* Title and Description */}
                        {(selectedItem.title ||
                            (showDescription && selectedItem.description)) && (
                            <div
                                style={{
                                    padding: "24px",
                                    borderTop: "1px solid rgba(0, 0, 0, 0.1)",
                                }}
                            >
                                {selectedItem.title && (
                                    <h3
                                        style={{
                                            margin: "0 0 8px 0",
                                            ...titleFont,
                                        }}
                                    >
                                        {selectedItem.title}
                                    </h3>
                                )}
                                {showDescription &&
                                    selectedItem.description && (
                                        <p
                                            style={{
                                                margin: 0,
                                                ...descriptionFont,
                                            }}
                                        >
                                            {selectedItem.description}
                                        </p>
                                    )}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </div>
    )
}

addPropertyControls(Carousel3D, {
    usePlugin: {
        type: ControlType.Boolean,
        title: "Use Plugin",
        defaultValue: false,
        enabledTitle: "Plugin",
        disabledTitle: "Manual",
    },
    pluginItems: {
        type: ControlType.Array,
        title: "Plugin Items",
        hidden: (props) => !props.usePlugin,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                src: {
                    type: ControlType.String,
                    title: "Source URL",
                    defaultValue:
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=90",
                },
                uploadedImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Or Upload Image",
                },
                uploadedFile: {
                    type: ControlType.File,
                    title: "Or Upload Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.type === "image",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "Image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Slide",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "",
                },
            },
        },
        defaultValue: [
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=90",
                alt: "Modern Architecture",
                title: "Architecture",
                description: "Contemporary architectural design",
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=1200&q=90",
                alt: "Abstract Art",
                title: "Abstract",
                description: "Vibrant abstract composition",
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&q=90",
                alt: "Nature Landscape",
                title: "Nature",
                description: "Mountain landscape at sunset",
            },
        ],
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        hidden: (props) => props.usePlugin,
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                },
                src: {
                    type: ControlType.String,
                    title: "Source URL",
                    defaultValue:
                        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=90",
                },
                uploadedImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Or Upload Image",
                },
                uploadedFile: {
                    type: ControlType.File,
                    title: "Or Upload Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (props) => props.type === "image",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "Image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Slide",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "",
                },
            },
        },
        defaultValue: [
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=90",
                alt: "Modern Architecture - Glass building with geometric patterns",
                title: "Modern Architecture",
                description:
                    "Contemporary architectural design featuring clean lines",
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=1200&q=90",
                alt: "Abstract Art - Colorful gradient composition",
                title: "Abstract Art",
                description: "Vibrant abstract composition with flowing colors",
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&q=90",
                alt: "Nature Landscape - Mountain vista at sunset",
                title: "Nature Vista",
                description: "Breathtaking mountain landscape at golden hour",
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=1200&q=90",
                alt: "Technology - Futuristic digital interface",
                title: "Digital Future",
                description: "Cutting-edge technology and innovation",
            },
            {
                type: "image",
                src: "https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=1200&q=90",
                alt: "Urban Design - City skyline at night",
                title: "Urban Nights",
                description: "Dynamic city architecture at night",
            },
        ],
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 400,
        min: 200,
        max: 800,
        step: 10,
        unit: "px",
    },
    itemWidth: {
        type: ControlType.Number,
        title: "Item Width",
        defaultValue: 300,
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
    },
    itemHeight: {
        type: ControlType.Number,
        title: "Item Height",
        defaultValue: 400,
        min: 100,
        max: 800,
        step: 10,
        unit: "px",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1200,
        min: 500,
        max: 2000,
        step: 50,
        unit: "px",
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        defaultValue: 0.3,
        min: 0.1,
        max: 2,
        step: 0.1,
        hidden: (props) => !props.autoRotate,
    },
    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Sensitivity",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
    },
    showTitles: {
        type: ControlType.Boolean,
        title: "Show Titles",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        hidden: (props) => !props.showTitles,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.showTitles,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    itemBorderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow Intensity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
    },
    enablePopup: {
        type: ControlType.Boolean,
        title: "Enable Popup",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    popupBackgroundColor: {
        type: ControlType.Color,
        title: "Popup Background",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.enablePopup,
    },
    popupOverlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "rgba(0, 0, 0, 0.8)",
        hidden: (props) => !props.enablePopup,
    },
    showDescription: {
        type: ControlType.Boolean,
        title: "Show Description",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => !props.enablePopup,
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.5em",
        },
        hidden: (props) => !props.enablePopup || !props.showDescription,
    },
})
