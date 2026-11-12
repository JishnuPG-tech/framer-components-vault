/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import {
    useState,
    useRef,
    useCallback,
    useEffect,
    startTransition,
    type CSSProperties,
    type KeyboardEvent,
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

import { motion, AnimatePresence } from "framer-motion"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Hotspot {
    title: string
    description: string
    price: string
    ctaText: string
    ctaLink: string
    x: number
    y: number
    markerColor: string
}

interface CardPosition {
    top?: string
    bottom?: string
    left?: string
    right?: string
}

interface Props {
    image: string
    imageAlt: string
    imageLoading: "lazy" | "eager"
    hotspots: Hotspot[]
    markerSize: number
    pulseAnimation: boolean
    style?: CSSProperties
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_COLOR = "#111111"
const CARD_W = 196
const CARD_H = 190

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Hide hotspots that have no content at all. */
function hotspotIsVisible(h: Hotspot): boolean {
    return !!(h.title?.trim() || h.description?.trim() || h.price?.trim())
}

/**
 * Compute floating card position anchored to a %-based marker.
 * Prefers right-then-left horizontally, below-then-above vertically.
 */
function computeCardPosition(
    x: number,
    y: number,
    containerWidth: number,
    containerHeight: number
): CardPosition {
    const GAP = 10
    const pxX = (x / 100) * containerWidth
    const pxY = (y / 100) * containerHeight
    const pos: CardPosition = {}

    if (containerWidth - pxX >= CARD_W + GAP) {
        pos.left = `calc(${x}% + ${GAP}px)`
    } else if (pxX >= CARD_W + GAP) {
        pos.right = `calc(${100 - x}% + ${GAP}px)`
    } else {
        const clamped = Math.max(
            GAP,
            Math.min(pxX - CARD_W / 2, containerWidth - CARD_W - GAP)
        )
        pos.left = `${clamped}px`
    }

    if (containerHeight - pxY >= CARD_H + GAP) {
        pos.top = `calc(${y}% + ${GAP}px)`
    } else if (pxY >= CARD_H + GAP) {
        pos.bottom = `calc(${100 - y}% + ${GAP}px)`
    } else {
        const clamped = Math.max(
            GAP,
            Math.min(pxY - CARD_H / 2, containerHeight - CARD_H - GAP)
        )
        pos.top = `${clamped}px`
    }

    return pos
}

// ─── Pulse ring ───────────────────────────────────────────────────────────────

function pulseRingStyle(
    color: string,
    size: number,
    delay: number
): CSSProperties {
    return {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        opacity: 0,
        transform: "translate(-50%, -50%)",
        animation: `hs-pulse 2.6s ease-out ${delay}s infinite`,
        pointerEvents: "none",
    }
}

// ─── Marker ───────────────────────────────────────────────────────────────────

interface MarkerProps {
    hotspot: Hotspot
    index: number
    isOpen: boolean
    markerSize: number
    pulseAnimation: boolean
    onClick: (index: number) => void
}

function HotspotMarker({
    hotspot,
    index,
    isOpen,
    markerSize,
    pulseAnimation,
    onClick,
}: MarkerProps) {
    // All dimensions derived proportionally from markerSize so nothing looks
    // out of scale at any size (e.g. border stays thin, icon stays centred)
    const borderWidth = Math.max(1, markerSize * 0.08)
    const iconSize = markerSize * 0.38
    const strokeW = Math.max(1, markerSize * 0.09)
    const shadowSpread = Math.max(1, Math.round(markerSize * 0.1))

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick(index)
        }
    }

    return (
        <div
            style={{
                position: "absolute",
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: isOpen ? 30 : 20,
                pointerEvents: "none",
            }}
        >
            {pulseAnimation && !isOpen && (
                <>
                    <span
                        style={pulseRingStyle(
                            hotspot.markerColor,
                            markerSize,
                            0
                        )}
                    />
                    <span
                        style={pulseRingStyle(
                            hotspot.markerColor,
                            markerSize,
                            0.5
                        )}
                    />
                </>
            )}

            <motion.button
                aria-label={`Hotspot: ${hotspot.title || "Unnamed"}`}
                aria-expanded={isOpen}
                onClick={() => onClick(index)}
                onKeyDown={handleKeyDown}
                whileHover={{ scale: 1.18 }}
                whileTap={{ scale: 0.88 }}
                animate={
                    isOpen
                        ? { scale: 1.15, rotate: 45 }
                        : { scale: 1, rotate: 0 }
                }
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
                style={{
                    position: "relative",
                    width: markerSize,
                    height: markerSize,
                    borderRadius: "50%",
                    background: hotspot.markerColor,
                    border: `${borderWidth}px solid rgba(255,255,255,0.88)`,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 0 0 ${shadowSpread}px rgba(0,0,0,0.10), 0 ${shadowSpread}px ${shadowSpread * 3}px rgba(0,0,0,0.22)`,
                    pointerEvents: "auto",
                    outline: "none",
                    flexShrink: 0,
                    padding: 0,
                }}
            >
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                    style={{ display: "block", flexShrink: 0 }}
                >
                    <line
                        x1="6"
                        y1="1"
                        x2="6"
                        y2="11"
                        stroke="white"
                        strokeWidth={strokeW}
                        strokeLinecap="round"
                    />
                    <line
                        x1="1"
                        y1="6"
                        x2="11"
                        y2="6"
                        stroke="white"
                        strokeWidth={strokeW}
                        strokeLinecap="round"
                    />
                </svg>
            </motion.button>
        </div>
    )
}

// ─── Info Card ────────────────────────────────────────────────────────────────

interface InfoCardProps {
    hotspot: Hotspot
    position: CardPosition
    onClose: () => void
}

function InfoCard({ hotspot, position, onClose }: InfoCardProps) {
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") onClose()
    }

    return (
        <motion.div
            role="dialog"
            aria-label={hotspot.title || "Hotspot info"}
            aria-modal="false"
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            style={{
                position: "absolute",
                ...position,
                zIndex: 40,
                width: CARD_W,
                background: "rgba(255,255,255,0.96)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderRadius: 10,
                boxShadow:
                    "0 6px 24px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)",
                overflow: "hidden",
                fontFamily: "inherit",
                pointerEvents: "auto",
            }}
        >
            {/* Accent bar */}
            <div style={{ height: 2.5, background: hotspot.markerColor }} />

            <div style={{ padding: "11px 13px 13px" }}>
                {/* Title + close */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 6,
                        marginBottom: 5,
                    }}
                >
                    {hotspot.title?.trim() && (
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#111",
                                lineHeight: 1.3,
                                flex: 1,
                            }}
                        >
                            {hotspot.title}
                        </span>
                    )}
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "none",
                            background: "#ebebeb",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            padding: 0,
                        }}
                    >
                        <svg
                            width="8"
                            height="8"
                            viewBox="0 0 10 10"
                            fill="none"
                            aria-hidden="true"
                        >
                            <line
                                x1="1"
                                y1="1"
                                x2="9"
                                y2="9"
                                stroke="#555"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                            <line
                                x1="9"
                                y1="1"
                                x2="1"
                                y2="9"
                                stroke="#555"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                {/* Price */}
                {hotspot.price?.trim() && (
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: hotspot.markerColor,
                            marginBottom: 6,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {hotspot.price}
                    </div>
                )}

                {/* Description */}
                {hotspot.description?.trim() && (
                    <p
                        style={{
                            fontSize: 11.5,
                            color: "#555",
                            lineHeight: 1.55,
                            margin: "0 0 10px",
                        }}
                    >
                        {hotspot.description}
                    </p>
                )}

                {/* CTA */}
                {hotspot.ctaText?.trim() && (
                    <a
                        href={hotspot.ctaLink || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "block",
                            textAlign: "center",
                            padding: "6.5px 10px",
                            borderRadius: 6,
                            background: hotspot.markerColor,
                            color: "#fff",
                            fontSize: 11.5,
                            fontWeight: 600,
                            textDecoration: "none",
                            letterSpacing: "0.01em",
                            transition: "opacity 0.15s ease",
                        }}
                        onMouseEnter={(e) =>
                            ((
                                e.currentTarget as HTMLAnchorElement
                            ).style.opacity = "0.8")
                        }
                        onMouseLeave={(e) =>
                            ((
                                e.currentTarget as HTMLAnchorElement
                            ).style.opacity = "1")
                        }
                    >
                        {hotspot.ctaText}
                    </a>
                )}
            </div>
        </motion.div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImageHotspot(props: Props) {
    const {
        image,
        imageAlt,
        imageLoading,
        hotspots = [],
        markerSize,
        pulseAnimation,
        style,
    } = props

    const [openIndex, setOpenIndex] = useState<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

    // Only render hotspots that have at least one filled content field
    const visibleHotspots = hotspots
        .map((hotspot, originalIndex) => ({ hotspot, originalIndex }))
        .filter(({ hotspot }) => hotspotIsVisible(hotspot))

    // Track container dimensions for card placement
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const update = () =>
            startTransition(() =>
                setContainerSize({
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                })
            )
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const handleContainerClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const target = e.target as HTMLElement
            if (
                !target.closest("[data-hotspot-marker]") &&
                !target.closest("[data-hotspot-card]")
            ) {
                startTransition(() => setOpenIndex(null))
            }
        },
        []
    )

    const handleMarkerClick = useCallback((index: number) => {
        startTransition(() =>
            setOpenIndex((prev) => (prev === index ? null : index))
        )
    }, [])

    const handleClose = useCallback(() => {
        startTransition(() => setOpenIndex(null))
    }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Escape") startTransition(() => setOpenIndex(null))
    }, [])

    const activeEntry =
        openIndex !== null
            ? visibleHotspots.find((v) => v.originalIndex === openIndex)
            : null

    return (
        <>
            <style>{`
                @keyframes hs-pulse {
                    0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.5; }
                    80%  { transform: translate(-50%,-50%) scale(2.8); opacity: 0;   }
                    100% { transform: translate(-50%,-50%) scale(2.8); opacity: 0;   }
                }
            `}</style>

            <div
                ref={containerRef}
                onClick={handleContainerClick}
                onKeyDown={handleKeyDown}
                role="region"
                aria-label="Interactive image with hotspots"
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    borderRadius: (style as any)?.borderRadius ?? 0,
                    ...style,
                    cursor: "default",
                    userSelect: "none",
                }}
            >
                {/* Image or placeholder */}
                {image ? (
                    <img
                        src={image}
                        alt={imageAlt || ""}
                        loading={imageLoading}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                        draggable={false}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            background:
                                "linear-gradient(135deg, #e8eaed 0%, #d1d5db 100%)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            color: "#9ca3af",
                        }}
                    >
                        <svg
                            width="36"
                            height="36"
                            viewBox="0 0 40 40"
                            fill="none"
                            aria-hidden="true"
                        >
                            <rect
                                x="4"
                                y="4"
                                width="32"
                                height="32"
                                rx="4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            />
                            <circle cx="15" cy="15" r="3" fill="currentColor" />
                            <path
                                d="M4 28l9-9 6 6 5-5 12 8"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>
                            Upload an image
                        </span>
                    </div>
                )}

                {/* Markers */}
                {visibleHotspots.map(({ hotspot, originalIndex }) => (
                    <div key={originalIndex} data-hotspot-marker="true">
                        <HotspotMarker
                            hotspot={hotspot}
                            index={originalIndex}
                            isOpen={openIndex === originalIndex}
                            markerSize={markerSize}
                            pulseAnimation={pulseAnimation}
                            onClick={handleMarkerClick}
                        />
                    </div>
                ))}

                {/* Info card */}
                <AnimatePresence>
                    {activeEntry && (
                        <div
                            data-hotspot-card="true"
                            key={activeEntry.originalIndex}
                        >
                            <InfoCard
                                hotspot={activeEntry.hotspot}
                                position={computeCardPosition(
                                    activeEntry.hotspot.x,
                                    activeEntry.hotspot.y,
                                    containerSize.width,
                                    containerSize.height
                                )}
                                onClose={handleClose}
                            />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

ImageHotspot.defaultProps = {
    image: "",
    imageAlt: "",
    imageLoading: "lazy",
    markerSize: 18,
    pulseAnimation: true,
    hotspots: [
        {
            title: "Product Name",
            description: "A short description of this item.",
            price: "$99",
            ctaText: "Shop Now",
            ctaLink: "https://example.com",
            x: 30,
            y: 40,
            markerColor: DEFAULT_COLOR,
        },
        {
            title: "Another Item",
            description: "Describe what makes this special.",
            price: "$149",
            ctaText: "Learn More",
            ctaLink: "https://example.com",
            x: 65,
            y: 60,
            markerColor: DEFAULT_COLOR,
        },
    ],
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(ImageHotspot, {
    // Image
    image: {
        type: ControlType.Image,
        title: "Image",
    },
    imageAlt: {
        type: ControlType.String,
        title: "Alt Text",
        placeholder: "Describe the image…",
        defaultValue: "",
    },
    imageLoading: {
        type: ControlType.Enum,
        title: "Loading",
        options: ["lazy", "eager"],
        optionTitles: ["Lazy", "Eager"],
        defaultValue: "lazy",
    },

    // Marker
    markerSize: {
        type: ControlType.Number,
        title: "Marker Size",
        min: 12,
        max: 48,
        step: 1,
        defaultValue: 18,
        // No displayStepper → renders as slider in Framer
    },
    pulseAnimation: {
        type: ControlType.Boolean,
        title: "Pulse",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    // Hotspots
    hotspots: {
        type: ControlType.Array,
        title: "Hotspots",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Product Name",
                },
                price: {
                    type: ControlType.String,
                    title: "Price",
                    defaultValue: "$99",
                    placeholder: "$0.00",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "A short description of this item.",
                },
                ctaText: {
                    type: ControlType.String,
                    title: "CTA Text",
                    defaultValue: "Shop Now",
                    placeholder: "Shop Now",
                },
                ctaLink: {
                    type: ControlType.Link,
                    title: "CTA Link",
                },
                x: {
                    type: ControlType.Number,
                    title: "X (%)",
                    min: 0,
                    max: 100,
                    step: 0.5,
                    defaultValue: 30,
                    description: "Horizontal position (% of image width)",
                    // Slider — no displayStepper
                },
                y: {
                    type: ControlType.Number,
                    title: "Y (%)",
                    min: 0,
                    max: 100,
                    step: 0.5,
                    defaultValue: 40,
                    description: "Vertical position (% of image height)",
                    // Slider — no displayStepper
                },
                markerColor: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#111111",
                },
            },
        },
        defaultValue: [
            {
                title: "Product Name",
                description: "A short description of this item.",
                price: "$99",
                ctaText: "Shop Now",
                ctaLink: "https://example.com",
                x: 30,
                y: 40,
                markerColor: "#111111",
            },
            {
                title: "Another Item",
                description: "Describe what makes this special.",
                price: "$149",
                ctaText: "Learn More",
                ctaLink: "https://example.com",
                x: 65,
                y: 60,
                markerColor: "#111111",
            },
        ],
    },
})
