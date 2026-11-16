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
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
    photos,
    onClose,
}: {
    photos: string[]
    onClose: () => void
}) {
    const [selected, setSelected] = useState<string | null>(null)
    const valid = photos.filter(Boolean)

    const content = (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                background: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
            }}
        >
            {/* Close */}
            <button
                onClick={onClose}
                style={{
                    position: "absolute",
                    top: 20,
                    right: 24,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 600,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                }}
            >
                ✕
            </button>

            <AnimatePresence mode="wait">
                {selected ? (
                    <motion.div
                        key="full"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 16,
                        }}
                    >
                        <img
                            src={selected}
                            style={{
                                maxWidth: "min(85vw, 700px)",
                                maxHeight: "75vh",
                                borderRadius: 16,
                                objectFit: "contain",
                                boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
                            }}
                        />
                        <button
                            onClick={() => setSelected(null)}
                            style={{
                                background: "rgba(255,255,255,0.12)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 500,
                                padding: "6px 18px",
                                borderRadius: 999,
                                cursor: "pointer",
                            }}
                        >
                            ← Back
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${Math.min(valid.length, 3)}, 1fr)`,
                            gap: 8,
                            width: "min(560px, 88vw)",
                        }}
                    >
                        {valid.map((src, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.04 }}
                                onClick={() => setSelected(src)}
                                style={{
                                    aspectRatio: "1",
                                    borderRadius: 12,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                }}
                            >
                                <img
                                    src={src}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )

    return createPortal(content, document.body)
}

// ─── Photo placeholder ────────────────────────────────────────────────────────

function PhotoPlaceholder({ index }: { index: number }) {
    const hues = [210, 250, 190]
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: `hsl(${hues[index % 3]}, 20%, 88%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="3"
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="1.5"
                />
                <circle cx="8.5" cy="8.5" r="1.5" fill="rgba(0,0,0,0.2)" />
                <path
                    d="M3 16l5-5 4 4 3-3 6 6"
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageItem {
    image: string
}

interface Props {
    folderTitle: string
    photoCount: string
    previewImages: ImageItem[]
    galleryImages: ImageItem[]
    showSticker1: boolean
    sticker1: string
    showSticker2: boolean
    sticker2: string
    folderColor: string
    folderFrontOpacity: number
    folderWidth: number
    folderHeight: number
    pillBackground: string
    pillBorderRadius: number
    countColor: string
    titleFont: any
    titleColor: string
    countFont: any
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PhotoFolder({
    folderTitle = "Italy 2025",
    photoCount = "68 photos",
    previewImages = [],
    galleryImages = [],
    showSticker1 = true,
    sticker1 = "🇮🇹",
    showSticker2 = true,
    sticker2 = "🍋",
    folderColor = "#e8eaf0",
    folderFrontOpacity = 85,
    folderWidth = 240,
    folderHeight = 160,
    pillBackground = "rgba(0,0,0,0.07)",
    pillBorderRadius = 999,
    countColor = "#666666",
    titleFont = {},
    titleColor = "#1a1a1a",
    countFont = {},
}: Props) {
    const isCanvas = useIsOnFramerCanvas()
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerW, setContainerW] = useState(folderWidth)

    useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerW(entry.contentRect.width || folderWidth)
            }
        })
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [folderWidth])

    const w = containerW
    const h = Math.round(w * (folderHeight / folderWidth))
    const photoH = Math.round(h * 0.52)
    const photoW = Math.round(w * 0.4)
    const photoOverlap = Math.round(h * 0.06)
    const folderTop = Math.round(photoH - photoOverlap)
    const photoTop = 0
    const photoSpread = Math.round(w * 0.15)
    const totalHeight = folderTop + h
    const tabW = Math.round(w * 0.38)
    const tabH = Math.round(h * 0.12)

    // Safe hex → rgba with opacity, fallback to raw color
    let frontBg = folderColor
    try {
        const hex = folderColor.replace("#", "")
        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                frontBg = `rgba(${r},${g},${b},${(folderFrontOpacity / 100).toFixed(2)})`
            }
        }
    } catch (_) {}

    const galleryPhotos = (galleryImages || [])
        .map((item) => item?.image)
        .filter(Boolean)

    const previewConfigs = [
        { rotate: -10, x: -photoSpread, zIndex: 3 },
        { rotate: 7, x: photoSpread, zIndex: 4 },
        { rotate: 0, x: 0, zIndex: 5 },
    ]
    const previews = previewConfigs.map((cfg, i) => ({
        ...cfg,
        src: previewImages?.[i]?.image || "",
    }))

    return (
        <>
            <AnimatePresence>
                {open && !isCanvas && (
                    <Lightbox
                        photos={galleryPhotos}
                        onClose={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: Math.round(w * 0.05),
                    userSelect: "none",
                }}
            >
                {/* ── Folder */}
                <motion.div
                    onClick={() => !isCanvas && setOpen(true)}
                    whileHover={isCanvas ? {} : { y: -4 }}
                    whileTap={isCanvas ? {} : { scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    style={{
                        position: "relative",
                        width: w,
                        height: totalHeight,
                        cursor: "pointer",
                    }}
                >
                    {/* Preview photos */}
                    {previews.map((p, i) => (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                top: photoTop + i * 2,
                                left: "50%",
                                transform: `translateX(calc(-50% + ${p.x}px)) rotate(${p.rotate}deg)`,
                                width: photoW,
                                height: photoH,
                                borderRadius: 9,
                                overflow: "hidden",
                                zIndex: p.zIndex,
                                boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
                                border: "2px solid rgba(255,255,255,0.95)",
                            }}
                        >
                            {p.src ? (
                                <img
                                    src={p.src}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            ) : (
                                <PhotoPlaceholder index={i} />
                            )}
                        </div>
                    ))}

                    {/* Folder back */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: h,
                            borderRadius: "0 16px 20px 20px",
                            background: folderColor,
                            boxShadow:
                                "0 6px 12px rgba(100,100,180,0.10), 0 2px 4px rgba(100,100,180,0.08)",
                            zIndex: 2,
                        }}
                    />

                    {/* Tab */}
                    <div
                        style={{
                            position: "absolute",
                            top: folderTop - tabH,
                            left: 0,
                            width: tabW,
                            height: tabH,
                            borderRadius: "10px 10px 0 0",
                            background: folderColor,
                            zIndex: 2,
                        }}
                    />

                    {/* Folder front */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: h - Math.round(h * 0.08),
                            borderRadius: "0 12px 20px 20px",
                            background: `linear-gradient(170deg, ${frontBg} 0%, ${folderColor}bb 100%)`,
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            border: "1.5px solid rgba(255,255,255,0.85)",
                            boxShadow:
                                "inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 16px rgba(100,100,180,0.10), 0 3px 6px rgba(100,100,180,0.08)",
                            zIndex: 6,
                        }}
                    />

                    {/* Bottom lines */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 22,
                            left: 16,
                            right: 16,
                            height: 1.5,
                            borderRadius: 999,
                            background: "rgba(160,162,180,0.30)",
                            zIndex: 7,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            bottom: 13,
                            left: 24,
                            right: 24,
                            height: 1.5,
                            borderRadius: 999,
                            background: "rgba(160,162,180,0.18)",
                            zIndex: 7,
                        }}
                    />

                    {/* Sticker 1 */}
                    {showSticker1 && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: Math.round(h * 0.28),
                                left: Math.round(w * 0.15),
                                fontSize: Math.round(w * 0.14),
                                zIndex: 8,
                                filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.15))",
                                lineHeight: 1,
                            }}
                        >
                            {sticker1}
                        </div>
                    )}

                    {/* Sticker 2 */}
                    {showSticker2 && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: Math.round(h * 0.34),
                                right: Math.round(w * 0.15),
                                fontSize: Math.round(w * 0.16),
                                zIndex: 8,
                                filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.13))",
                                lineHeight: 1,
                            }}
                        >
                            {sticker2}
                        </div>
                    )}
                </motion.div>

                {/* Title */}
                <div
                    style={{
                        ...titleFont,
                        color: titleColor,
                        letterSpacing: "-0.02em",
                    }}
                >
                    {folderTitle}
                </div>

                {/* Count pill */}
                <div
                    style={{
                        ...countFont,
                        color: countColor,
                        background: pillBackground,
                        padding: "5px 14px",
                        borderRadius: pillBorderRadius,
                    }}
                >
                    {photoCount}
                </div>
            </div>
        </>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(PhotoFolder, {
    // ── Content
    folderTitle: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Italy 2025",
    },
    photoCount: {
        type: ControlType.String,
        title: "Photo count",
        defaultValue: "68 photos",
    },

    // ── Preview Images
    previewImages: {
        type: ControlType.Array,
        title: "Preview Images",
        maxCount: 3,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
            },
        },
    },

    // ── Gallery Images
    galleryImages: {
        type: ControlType.Array,
        title: "Gallery Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
            },
        },
    },

    // ── Stickers
    showSticker1: {
        type: ControlType.Boolean,
        title: "Sticker 1",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    sticker1: {
        type: ControlType.String,
        title: "Sticker 1 Emoji",
        defaultValue: "🇮🇹",
        hidden: (p) => !p.showSticker1,
    },
    showSticker2: {
        type: ControlType.Boolean,
        title: "Sticker 2",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    sticker2: {
        type: ControlType.String,
        title: "Sticker 2 Emoji",
        defaultValue: "🍋",
        hidden: (p) => !p.showSticker2,
    },

    // ── Folder Appearance
    folderColor: {
        type: ControlType.Color,
        title: "Folder Color",
        defaultValue: "#e8eaf0",
    },
    folderFrontOpacity: {
        type: ControlType.Number,
        title: "Front Opacity",
        min: 20,
        max: 100,
        step: 5,
        defaultValue: 85,
        displayStepper: true,
    },
    folderWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 160,
        max: 480,
        step: 4,
        defaultValue: 240,
    },
    folderHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 100,
        max: 320,
        step: 4,
        defaultValue: 160,
    },

    // ── Label & Pill
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#1a1a1a",
    },
    countFont: {
        type: ControlType.Font,
        title: "Count Font",
        controls: "basic",
    },
    countColor: {
        type: ControlType.Color,
        title: "Count Color",
        defaultValue: "#666666",
    },
    pillBackground: {
        type: ControlType.Color,
        title: "Pill Background",
        defaultValue: "rgba(0,0,0,0.07)",
    },
    pillBorderRadius: {
        type: ControlType.Number,
        title: "Pill Radius",
        min: 0,
        max: 999,
        step: 2,
        defaultValue: 999,
    },
})
