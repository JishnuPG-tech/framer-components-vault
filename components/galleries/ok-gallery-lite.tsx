// @framerIntrinsicSize 800 600

import * as React from "react"
import * as ReactDOM from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* =========================
   Types
========================= */

interface GalleryImage {
    src: string
    alt?: string
}

interface Padding {
    top: number
    right: number
    bottom: number
    left: number
}

interface HoverEffects {
    zoomScale: number
    zoomTransition: number
    tiltIntensity: number
    overlayColor: string
    overlayOpacity: number
    overlayTransition: number
}

interface LightboxSettings {
    enabled: boolean
    opacity: number
    blur: number
    controlsColor: string
}

interface MasonryGalleryProps {
    // Manual array mode
    images: GalleryImage[]
    useDemoImages: boolean
    // CMS mode
    useCMS: boolean
    cmsImages: any[]
    cmsImageKey: string
    cmsAltKey: string
    // Layout
    padding: Padding
    gap: number
    columns: number
    hover: HoverEffects
    lightbox: LightboxSettings
}

/* =========================
   Demo Images
========================= */

const DEMO_IMAGES: GalleryImage[] = [
    {
        src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        alt: "Demo image 1",
    },
    {
        src: "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=1200&q=80",
        alt: "Demo image 2",
    },
    {
        src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
        alt: "Demo image 3",
    },
    {
        src: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1200&q=80",
        alt: "Demo image 4",
    },
    {
        src: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=1200&q=80",
        alt: "Demo image 5",
    },
]

/* =========================
   JS Column Distributor
   Splits images into N column arrays so we can
   apply identical gap values horizontally and
   vertically without CSS columns' quirks.
========================= */

function distributeToColumns(
    items: GalleryImage[],
    n: number
): GalleryImage[][] {
    const cols: GalleryImage[][] = Array.from({ length: n }, () => [])
    items.forEach((item, i) => cols[i % n].push(item))
    return cols
}

/* =========================
   Lightbox Portal
========================= */

interface LightboxPortalProps {
    images: GalleryImage[]
    index: number
    settings: LightboxSettings
    onClose: () => void
    onPrev: () => void
    onNext: () => void
}

function LightboxPortal({
    images,
    index,
    settings,
    onClose,
    onPrev,
    onNext,
}: LightboxPortalProps) {
    const el = React.useMemo(() => document.createElement("div"), [])

    React.useEffect(() => {
        document.body.appendChild(el)
        document.body.style.overflow = "hidden"
        return () => {
            document.body.removeChild(el)
            document.body.style.overflow = ""
        }
    }, [el])

    const btnBase: React.CSSProperties = {
        position: "fixed",
        background: "none",
        border: "none",
        color: settings.controlsColor,
        cursor: "pointer",
        zIndex: 2147483647,
        lineHeight: 1,
    }

    const content = (
        <>
            {/* Backdrop + image */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: `rgba(0,0,0,${settings.opacity})`,
                    backdropFilter: `blur(${settings.blur}px)`,
                    zIndex: 2147483640,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <img
                    src={images[index].src}
                    alt={images[index].alt ?? `Image ${index + 1}`}
                    style={{
                        maxWidth: "min(88vw, 1400px)",
                        maxHeight: "88vh",
                        width: "auto",
                        height: "auto",
                        borderRadius: 10,
                        pointerEvents: "none",
                        display: "block",
                    }}
                />
            </div>

            {/* ← Prev */}
            <button
                style={{
                    ...btnBase,
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 64,
                    padding: "20px 20px 20px 12px",
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    onPrev()
                }}
            >
                ‹
            </button>

            {/* → Next */}
            <button
                style={{
                    ...btnBase,
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 64,
                    padding: "20px 12px 20px 20px",
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    onNext()
                }}
            >
                ›
            </button>

            {/* × Close */}
            <button
                style={{
                    ...btnBase,
                    top: 16,
                    right: 16,
                    fontSize: 36,
                    padding: 12,
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                }}
            >
                ×
            </button>
        </>
    )

    return ReactDOM.createPortal(content, el)
}

/* =========================
   Main Component
========================= */

export default function MasonryGallery({
    images,
    useDemoImages,
    useCMS,
    cmsImages,
    cmsImageKey,
    cmsAltKey,
    padding,
    gap,
    columns,
    hover,
    lightbox,
}: MasonryGalleryProps) {
    // Resolve image source: CMS > manual array > demo
    const galleryImages: GalleryImage[] = React.useMemo(() => {
        if (useCMS && Array.isArray(cmsImages) && cmsImages.length > 0) {
            return cmsImages
                .map((item) => ({
                    src: item[cmsImageKey] ?? "",
                    alt: cmsAltKey ? (item[cmsAltKey] ?? "") : "",
                }))
                .filter((img) => img.src)
        }
        if (images.length > 0) return images
        if (useDemoImages) return DEMO_IMAGES
        return []
    }, [useCMS, cmsImages, cmsImageKey, cmsAltKey, images, useDemoImages])

    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(
        null
    )
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
    const [tilt, setTilt] = React.useState({ x: 0, y: 0 })
    const [visibleImages, setVisibleImages] = React.useState<Set<string>>(
        new Set()
    )
    const [currentColumns, setCurrentColumns] = React.useState(columns)

    /* Responsive columns */
    React.useEffect(() => {
        function handleResize() {
            const width = window.innerWidth
            if (width < 480) setCurrentColumns(1)
            else if (width < 768) setCurrentColumns(Math.min(2, columns))
            else if (width < 1024) setCurrentColumns(Math.min(3, columns))
            else setCurrentColumns(columns)
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [columns])

    /* Staggered fade-in — keyed by src so new images animate in */
    React.useEffect(() => {
        galleryImages.forEach((img, i) => {
            setTimeout(() => {
                setVisibleImages((prev) => new Set([...prev, img.src]))
            }, i * 80)
        })
    }, [galleryImages])

    /* Keyboard nav */
    React.useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (lightboxIndex === null) return
            if (e.key === "ArrowLeft")
                setLightboxIndex(
                    (lightboxIndex - 1 + galleryImages.length) %
                        galleryImages.length
                )
            else if (e.key === "ArrowRight")
                setLightboxIndex((lightboxIndex + 1) % galleryImages.length)
            else if (e.key === "Escape") setLightboxIndex(null)
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [lightboxIndex, galleryImages.length])

    /* Hover */
    const [supportsHover, setSupportsHover] = React.useState(true)
    React.useEffect(() => {
        setSupportsHover(window.matchMedia("(hover: hover)").matches)
    }, [])

    const handleMouseMove = (
        e: React.MouseEvent<HTMLDivElement>,
        index: number
    ) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x =
            ((e.clientX - rect.left) / rect.width - 0.5) *
            hover.tiltIntensity *
            2
        const y =
            ((e.clientY - rect.top) / rect.height - 0.5) *
            -hover.tiltIntensity *
            2
        setTilt({ x, y })
        setHoverIndex(index)
    }

    // Distribute images into columns for uniform gap control
    const columnArrays = distributeToColumns(galleryImages, currentColumns)

    return (
        <div
            style={{
                paddingTop: padding.top,
                paddingRight: padding.right,
                paddingBottom: padding.bottom,
                paddingLeft: padding.left,
                position: "relative",
                minHeight: 200,
            }}
        >
            {/* Empty state */}
            {galleryImages.length === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        color: "rgba(150,150,150,0.8)",
                        fontSize: 13,
                        pointerEvents: "none",
                        border: "1.5px dashed rgba(150,150,150,0.3)",
                        borderRadius: 8,
                    }}
                >
                    <span style={{ fontSize: 26, opacity: 0.5 }}>⊕</span>
                    <span>
                        Add images via Properties or connect a CMS collection
                    </span>
                </div>
            )}

            {/* JS-distributed columns — uniform gap in both axes */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: gap,
                    alignItems: "flex-start",
                }}
            >
                {columnArrays.map((col, colIndex) => (
                    <div
                        key={colIndex}
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: gap,
                            minWidth: 0,
                        }}
                    >
                        {col.map((image, rowIndex) => {
                            // Global index for lightbox
                            const globalIndex =
                                rowIndex * currentColumns + colIndex
                            const isVisible = visibleImages.has(image.src)

                            return (
                                <div
                                    key={image.src + rowIndex}
                                    style={{
                                        borderRadius: 12,
                                        overflow: "hidden",
                                        cursor: lightbox.enabled
                                            ? "pointer"
                                            : "default",
                                        opacity: isVisible ? 1 : 0,
                                        transform: isVisible
                                            ? "translateY(0)"
                                            : "translateY(16px)",
                                        transition:
                                            "opacity 0.5s ease, transform 0.5s ease",
                                    }}
                                    onMouseEnter={(e) =>
                                        supportsHover &&
                                        handleMouseMove(e, globalIndex)
                                    }
                                    onMouseMove={(e) =>
                                        supportsHover &&
                                        handleMouseMove(e, globalIndex)
                                    }
                                    onMouseLeave={() => {
                                        setHoverIndex(null)
                                        setTilt({ x: 0, y: 0 })
                                    }}
                                    onClick={() => {
                                        if (lightbox.enabled)
                                            setLightboxIndex(globalIndex)
                                    }}
                                >
                                    <div style={{ position: "relative" }}>
                                        <img
                                            src={image.src}
                                            alt={
                                                image.alt ??
                                                `Image ${globalIndex + 1}`
                                            }
                                            loading="lazy"
                                            style={{
                                                width: "100%",
                                                display: "block",
                                                transition: `transform ${hover.zoomTransition}s ease`,
                                                transform:
                                                    supportsHover &&
                                                    hoverIndex === globalIndex
                                                        ? `scale(${hover.zoomScale}) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`
                                                        : "scale(1)",
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                backgroundColor:
                                                    hover.overlayColor,
                                                opacity:
                                                    supportsHover &&
                                                    hoverIndex === globalIndex
                                                        ? hover.overlayOpacity
                                                        : 0,
                                                transition: `opacity ${hover.overlayTransition}s ease`,
                                                pointerEvents: "none",
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>

            {/* Lightbox portal */}
            {lightbox.enabled && lightboxIndex !== null && (
                <LightboxPortal
                    images={galleryImages}
                    index={lightboxIndex}
                    settings={lightbox}
                    onClose={() => setLightboxIndex(null)}
                    onPrev={() =>
                        setLightboxIndex(
                            (lightboxIndex - 1 + galleryImages.length) %
                                galleryImages.length
                        )
                    }
                    onNext={() =>
                        setLightboxIndex(
                            (lightboxIndex + 1) % galleryImages.length
                        )
                    }
                />
            )}
        </div>
    )
}

/* =========================
   Default Props
========================= */

MasonryGallery.defaultProps = {
    images: [],
    useDemoImages: true,
    useCMS: false,
    cmsImages: [],
    cmsImageKey: "image",
    cmsAltKey: "alt",
    padding: { top: 20, right: 0, bottom: 20, left: 0 },
    gap: 12,
    columns: 3,
    hover: {
        zoomScale: 1.05,
        zoomTransition: 0.1,
        tiltIntensity: 5,
        overlayColor: "#F15B2A",
        overlayOpacity: 0.2,
        overlayTransition: 0.1,
    },
    lightbox: {
        enabled: true,
        opacity: 0.85,
        blur: 6,
        controlsColor: "#ffffff",
    },
}

/* =========================
   Property Controls
========================= */

addPropertyControls(MasonryGallery, {
    // ── Images ──────────────────────────────────
    useDemoImages: {
        type: ControlType.Boolean,
        title: "Demo Images",
        section: "Images",
        defaultValue: true,
        hidden(props) {
            return props.useCMS || props.images?.length > 0
        },
    },

    images: {
        type: ControlType.Array,
        title: "Images",
        section: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.Image, title: "Image" },
                alt: { type: ControlType.String, title: "Alt Text" },
            },
        },
        hidden(props) {
            return props.useCMS
        },
    },

    // ── CMS ─────────────────────────────────────
    useCMS: {
        type: ControlType.Boolean,
        title: "Use CMS",
        section: "CMS Collection",
        defaultValue: false,
    },

    cmsImages: {
        type: ControlType.Array,
        title: "Collection",
        section: "CMS Collection",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                alt: { type: ControlType.String, title: "Alt Text" },
            },
        },
        hidden(props) {
            return !props.useCMS
        },
    },

    cmsImageKey: {
        type: ControlType.String,
        title: "Image Field",
        section: "CMS Collection",
        defaultValue: "image",
        hidden(props) {
            return !props.useCMS
        },
    },

    cmsAltKey: {
        type: ControlType.String,
        title: "Alt Field",
        section: "CMS Collection",
        defaultValue: "alt",
        hidden(props) {
            return !props.useCMS
        },
    },

    // ── Layout ──────────────────────────────────
    padding: {
        type: ControlType.Object,
        section: "Layout",
        controls: {
            top: { type: ControlType.Number },
            right: { type: ControlType.Number },
            bottom: { type: ControlType.Number },
            left: { type: ControlType.Number },
        },
    },

    gap: {
        type: ControlType.Number,
        section: "Layout",
        title: "Gap",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 12,
    },

    columns: {
        type: ControlType.Number,
        section: "Layout",
        min: 1,
        max: 6,
        step: 1,
    },

    // ── Hover ───────────────────────────────────
    hover: {
        type: ControlType.Object,
        section: "Hover Effects",
        controls: {
            zoomScale: { type: ControlType.Number, min: 1, max: 2, step: 0.01 },
            zoomTransition: {
                type: ControlType.Number,
                min: 0,
                max: 2,
                step: 0.05,
            },
            tiltIntensity: {
                type: ControlType.Number,
                min: 0,
                max: 15,
                step: 0.5,
            },
            overlayColor: { type: ControlType.Color },
            overlayOpacity: {
                type: ControlType.Number,
                min: 0,
                max: 1,
                step: 0.05,
            },
            overlayTransition: {
                type: ControlType.Number,
                min: 0,
                max: 2,
                step: 0.05,
            },
        },
    },

    // ── Lightbox ────────────────────────────────
    lightbox: {
        type: ControlType.Object,
        section: "Lightbox",
        controls: {
            enabled: { type: ControlType.Boolean },
            opacity: { type: ControlType.Number, min: 0, max: 1, step: 0.05 },
            blur: { type: ControlType.Number, min: 0, max: 50, step: 1 },
            controlsColor: { type: ControlType.Color },
        },
    },
})
