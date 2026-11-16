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

import { motion, AnimatePresence } from "framer-motion"

interface GalleryItem {
    image: string
    category: string
}

interface Props {
    items: GalleryItem[]
    columns: number
    gap: number
    borderRadius: number
    overlayColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
    enableLightbox: boolean
    enableCursor: boolean
    blurStrength: number
    hoverZoom: number
    itemsPerLoad: number
}

export default function PremiumTattooGallery(props: Props) {
    const {
        items,
        columns,
        gap,
        borderRadius,
        overlayColor,
        accentColor,
        backgroundColor,
        textColor,
        enableLightbox,
        enableCursor,
        blurStrength,
        hoverZoom,
        itemsPerLoad,
    } = props

    const [activeFilter, setActiveFilter] = React.useState("All")
    const [visibleItems, setVisibleItems] = React.useState(itemsPerLoad)
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(
        null
    )

    const [cursorVisible, setCursorVisible] = React.useState(false)

    const [cursorPosition, setCursorPosition] = React.useState({
        x: 0,
        y: 0,
    })

    const categories = [
        "All",
        ...Array.from(new Set(items.map((item) => item.category))),
    ]

    const filteredItems =
        activeFilter === "All"
            ? items
            : items.filter((item) => item.category === activeFilter)

    const displayedItems = filteredItems.slice(0, visibleItems)

    function openLightbox(index: number) {
        setLightboxIndex(index)
    }

    function nextImage() {
        setLightboxIndex((prev) => {
            if (prev === null) return 0
            return (prev + 1) % displayedItems.length
        })
    }

    function prevImage() {
        setLightboxIndex((prev) => {
            if (prev === null) return 0
            return prev === 0 ? displayedItems.length - 1 : prev - 1
        })
    }

    React.useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (lightboxIndex === null) return

            if (e.key === "Escape") {
                setLightboxIndex(null)
            }

            if (e.key === "ArrowRight") {
                nextImage()
            }

            if (e.key === "ArrowLeft") {
                prevImage()
            }
        }

        window.addEventListener("keydown", handleKey)

        return () => window.removeEventListener("keydown", handleKey)
    }, [lightboxIndex, displayedItems.length])

    return (
        <div
            style={{
                width: "100%",
                background: backgroundColor,
                color: textColor,
                position: "relative",
                overflow: "hidden",
            }}
            onMouseMove={(e) => {
                setCursorPosition({
                    x: e.clientX,
                    y: e.clientY,
                })
            }}
        >
            {/* CUSTOM CURSOR */}

            {enableCursor && cursorVisible && (
                <motion.div
                    animate={{
                        x: cursorPosition.x - 40,
                        y: cursorPosition.y - 40,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 220,
                        damping: 24,
                        mass: 0.6,
                    }}
                    style={{
                        position: "fixed",
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.08)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        zIndex: 999999,
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#fff",
                        mixBlendMode: "difference",
                    }}
                >
                    VIEW
                </motion.div>
            )}

            {/* FILTER BAR */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 40,
                }}
            >
                {categories.map((category) => {
                    const active = activeFilter === category

                    return (
                        <motion.button
                            key={category}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                                setActiveFilter(category)
                                setVisibleItems(itemsPerLoad)
                            }}
                            style={{
                                padding: "14px 24px",
                                borderRadius: 8,
                                border: "none",
                                background: active
                                    ? accentColor
                                    : "rgba(255,255,255,0.06)",
                                color: "#fff",
                                fontWeight: 600,
                                cursor: "pointer",
                                backdropFilter: "blur(10px)",
                                transition: "background 0.3s ease",
                            }}
                        >
                            {category}
                        </motion.button>
                    )
                })}
            </div>

            {/* GRID */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
                    gap,
                }}
            >
                {displayedItems.map((item, index) => {
                    return (
                        <motion.div
                            key={index}
                            layout
                            initial={{
                                opacity: 0,
                                scale: 0.96,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                            }}
                            transition={{
                                duration: 0.45,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            whileHover={{
                                y: -4,
                            }}
                            onMouseEnter={() => setCursorVisible(true)}
                            onMouseLeave={() => setCursorVisible(false)}
                            onClick={() => {
                                if (enableLightbox) {
                                    openLightbox(index)
                                }
                            }}
                            style={{
                                position: "relative",
                                overflow: "hidden",
                                borderRadius,
                                cursor: "pointer",
                                minHeight: 150,
                                background: "#111",
                                transform: "translateZ(0)",
                                willChange: "transform",
                            }}
                        >
                            {/* IMAGE */}

                            <motion.img
                                src={item.image}
                                loading="lazy"
                                alt={item.category}
                                whileHover={{
                                    scale: hoverZoom,
                                }}
                                transition={{
                                    duration: 0.7,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    transform: "translateZ(0)",
                                    willChange: "transform",
                                    backfaceVisibility: "hidden",
                                }}
                            />

                            {/* DARK OVERLAY */}

                            <motion.div
                                initial={{ opacity: 0.2 }}
                                whileHover={{ opacity: 0.45 }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeOut",
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background:
                                        "linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.1))",
                                    pointerEvents: "none",
                                }}
                            />

                            {/* COLOR OVERLAY */}

                            <motion.div
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                                transition={{
                                    duration: 0.45,
                                    ease: "easeOut",
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: overlayColor,
                                    mixBlendMode: "overlay",
                                    pointerEvents: "none",
                                }}
                            />

                            {/* CATEGORY */}

                            <motion.div
                                initial={{
                                    opacity: 0,
                                    y: 10,
                                }}
                                whileHover={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    duration: 0.35,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                style={{
                                    position: "absolute",
                                    left: 20,
                                    bottom: 20,
                                    zIndex: 5,
                                }}
                            >
                                <div
                                    style={{
                                        padding: "10px 16px",
                                        borderRadius: 999,
                                        background: "rgba(255,255,255,0.08)",
                                        backdropFilter: "blur(14px)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        color: "#fff",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        letterSpacing: 0.4,
                                    }}
                                >
                                    {item.category}
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>

            {/* EMPTY STATE */}

            {displayedItems.length === 0 && (
                <div
                    style={{
                        padding: "120px 20px",
                        textAlign: "center",
                        opacity: 0.6,
                        fontSize: 18,
                    }}
                >
                    No artworks found in this category.
                </div>
            )}

            {/* LOAD MORE */}

            {visibleItems < filteredItems.length && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: 50,
                    }}
                >
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() =>
                            setVisibleItems((prev) => prev + itemsPerLoad)
                        }
                        style={{
                            padding: "18px 34px",
                            borderRadius: 999,
                            border: "none",
                            background: accentColor,
                            color: "#fff",
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        Load More
                    </motion.button>
                </div>
            )}

            {/* LIGHTBOX */}

            <AnimatePresence>
                {enableLightbox && lightboxIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxIndex(null)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 999999,
                            background: "rgba(0,0,0,0.92)",
                            backdropFilter: `blur(${blurStrength}px)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 20,
                        }}
                    >
                        {/* PREV */}

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                prevImage()
                            }}
                            style={navButtonStyle("left")}
                        >
                            ←
                        </button>

                        {/* NEXT */}

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                nextImage()
                            }}
                            style={navButtonStyle("right")}
                        >
                            →
                        </button>

                        {/* IMAGE */}

                        <motion.img
                            initial={{
                                scale: 0.92,
                                opacity: 0,
                            }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                            }}
                            exit={{
                                opacity: 0,
                            }}
                            transition={{
                                duration: 0.35,
                            }}
                            src={displayedItems[lightboxIndex].image}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: "90vw",
                                maxHeight: "86vh",
                                objectFit: "contain",
                                borderRadius,
                                userSelect: "none",
                            }}
                        />

                        {/* CLOSE */}

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setLightboxIndex(null)
                            }}
                            style={{
                                position: "absolute",
                                top: 24,
                                right: 24,
                                width: 52,
                                height: 52,
                                borderRadius: "50%",
                                border: "none",
                                background: "rgba(255,255,255,0.08)",
                                color: "#fff",
                                fontSize: 26,
                                cursor: "pointer",
                                backdropFilter: "blur(12px)",
                            }}
                        >
                            ×
                        </button>

                        {/* COUNTER */}

                        <div
                            style={{
                                position: "absolute",
                                bottom: 28,
                                left: "50%",
                                transform: "translateX(-50%)",
                                padding: "12px 18px",
                                borderRadius: 999,
                                background: "rgba(255,255,255,0.08)",
                                color: "#fff",
                                fontWeight: 700,
                                backdropFilter: "blur(12px)",
                            }}
                        >
                            {lightboxIndex + 1} / {displayedItems.length}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function navButtonStyle(side: "left" | "right") {
    return {
        position: "absolute" as const,
        top: "50%",
        [side]: 24,
        transform: "translateY(-50%)",
        width: 58,
        height: 58,
        borderRadius: "50%",
        border: "none",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontSize: 24,
        cursor: "pointer",
        zIndex: 20,
        backdropFilter: "blur(12px)",
    }
}

PremiumTattooGallery.defaultProps = {
    items: [],
    columns: 3,
    gap: 24,
    borderRadius: 28,
    overlayColor: "rgba(255,91,46,0.15)",
    accentColor: "#ff5b2e",
    backgroundColor: "#050505",
    textColor: "#ffffff",
    enableLightbox: true,
    enableCursor: true,
    blurStrength: 10,
    hoverZoom: 1.06,
    itemsPerLoad: 6,
}

addPropertyControls(PremiumTattooGallery, {
    items: {
        type: ControlType.Array,
        title: "Gallery",
        propertyControl: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },

                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "Blackwork",
                },
            },
        },
    },

    columns: {
        type: ControlType.Number,
        title: "Columns",
        min: 1,
        max: 5,
        step: 1,
    },

    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 60,
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
    },

    accentColor: {
        type: ControlType.Color,
        title: "Accent",
    },

    overlayColor: {
        type: ControlType.Color,
        title: "Overlay",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
    },

    blurStrength: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 40,
    },

    hoverZoom: {
        type: ControlType.Number,
        title: "Hover Zoom",
        min: 1,
        max: 1.15,
        step: 0.01,
    },

    itemsPerLoad: {
        type: ControlType.Number,
        title: "Load Count",
        min: 3,
        max: 20,
        step: 1,
    },

    enableLightbox: {
        type: ControlType.Boolean,
        title: "Lightbox",
        defaultValue: true,
    },

    enableCursor: {
        type: ControlType.Boolean,
        title: "Cursor",
        defaultValue: true,
    },
})
