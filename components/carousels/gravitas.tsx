// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

interface CardData {
    image: string | { src: string } | undefined
    title: string
    subtitle: string
}

interface Props {
    cards: CardData[]
    cardWidth: number
    cardHeight: number
    spacing: number
    rotationDeg: number
    scaleStep: number
    perspective: number
    autoplay: boolean
    autoplayDelay: number
    background: string
    headerEyebrow: string
    headerTitle: string
    headerDescription: string
    accent: string
    cornerRadius: number
    showDots: boolean
    font: string
}

// Handles both ControlType.Image (string) and ControlType.ResponsiveImage (object)
function getImageUrl(image: CardData["image"]): string | null {
    if (!image) return null
    if (typeof image === "string") return image
    if (typeof image === "object" && "src" in image) return image.src
    return null
}

const isCanvas =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/canvas")

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 560
 * @framerDisableUnlink
 */
export default function Gravitas(props: Props) {
    const {
        cards,
        cardWidth,
        cardHeight,
        spacing,
        rotationDeg,
        scaleStep,
        perspective,
        autoplay,
        autoplayDelay,
        background,
        headerEyebrow,
        headerTitle,
        headerDescription,
        accent,
        cornerRadius,
        showDots,
        font,
    } = props

    const [active, setActive] = useState(0)
    const isDragging = useRef(false)
    const total = cards?.length || 0

    // autoplay
    useEffect(() => {
        if (!autoplay || total === 0) return
        const t = setTimeout(() => {
            if (!isDragging.current) {
                setActive((i) => (i + 1) % total)
            }
        }, autoplayDelay)
        return () => clearTimeout(t)
    }, [active, autoplay, autoplayDelay, total])

    const goTo = (i: number) => {
        if (total === 0) return
        const next = ((i % total) + total) % total
        setActive(next)
    }

    if (total === 0) {
        // Canvas editor placeholder — distinct from the live empty state
        if (isCanvas) {
            return (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        background,
                        borderRadius: cornerRadius,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 16,
                        boxSizing: "border-box",
                    }}
                >
                    {/* Ghost cards */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 12,
                            marginBottom: 4,
                        }}
                    >
                        {[
                            { scale: 0.78, opacity: 0.25, rotate: 20 },
                            { scale: 0.88, opacity: 0.4, rotate: 10 },
                            { scale: 1, opacity: 0.65, rotate: 0 },
                            { scale: 0.88, opacity: 0.4, rotate: -10 },
                            { scale: 0.78, opacity: 0.25, rotate: -20 },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: 72,
                                    height: 96,
                                    borderRadius: 8,
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    transform: `scale(${item.scale}) rotateY(${item.rotate}deg)`,
                                    opacity: item.opacity,
                                    flexShrink: 0,
                                }}
                            />
                        ))}
                    </div>
                    <div
                        style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 12,
                            font,
                            letterSpacing: 0.2,
                        }}
                    >
                        Gravitas — add cards in the panel
                    </div>
                </div>
            )
        }

        // Live / preview empty state
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background,
                    borderRadius: cornerRadius,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    font,
                    fontSize: 14,
                    opacity: 0.5,
                }}
            >
                Add cards in the property panel →
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background,
                borderRadius: cornerRadius,
                padding: "48px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 32,
                overflow: "hidden",
                boxSizing: "border-box",
                font,
                position: "relative",
            }}
        >
            {/* Header */}
            <div style={{ paddingLeft: 8, flexShrink: 0 }}>
                <div
                    style={{
                        fontSize: 11,
                        letterSpacing: 2,
                        opacity: 0.4,
                        color: "white",
                        textTransform: "uppercase",
                        marginBottom: 10,
                    }}
                >
                    {headerEyebrow}
                </div>
                <h1
                    style={{
                        fontSize: 40,
                        fontWeight: 600,
                        color: "white",
                        margin: 0,
                        marginBottom: 12,
                        letterSpacing: -0.5,
                        lineHeight: 1.1,
                    }}
                >
                    {headerTitle}
                </h1>
                <p
                    style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        opacity: 0.5,
                        color: "white",
                        margin: 0,
                        maxWidth: 520,
                    }}
                >
                    {headerDescription}
                </p>
            </div>

            {/* 3D stage */}
            <motion.div
                style={{
                    flex: 1,
                    position: "relative",
                    perspective: `${perspective}px`,
                    perspectiveOrigin: "center center",
                    cursor: "grab",
                    minHeight: cardHeight + 60,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragStart={() => {
                    isDragging.current = true
                }}
                onDragEnd={(_, info) => {
                    isDragging.current = false
                    const threshold = spacing / 3
                    if (info.offset.x < -threshold) goTo(active + 1)
                    else if (info.offset.x > threshold) goTo(active - 1)
                }}
                whileTap={{ cursor: "grabbing" }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transformStyle: "preserve-3d",
                    }}
                >
                    {cards.map((card, i) => {
                        const offset = i - active
                        const abs = Math.abs(offset)
                        const x = offset * spacing
                        const rotY = -offset * rotationDeg
                        const scale = Math.max(0.5, 1 - abs * scaleStep)
                        const opacity = abs > 3 ? 0 : 1 - abs * 0.18
                        const z = -abs * 60
                        const imageUrl = getImageUrl(card.image)

                        return (
                            <motion.div
                                key={`${card.title}-${i}`}
                                onClick={() => {
                                    if (!isDragging.current) goTo(i)
                                }}
                                animate={{
                                    x,
                                    rotateY: rotY,
                                    scale,
                                    opacity,
                                    z,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 130,
                                    damping: 22,
                                    mass: 0.8,
                                }}
                                style={{
                                    position: "absolute",
                                    width: cardWidth,
                                    height: cardHeight,
                                    transformStyle: "preserve-3d",
                                    zIndex: 100 - abs,
                                    cursor: i === active ? "grab" : "pointer",
                                    pointerEvents: abs > 3 ? "none" : "auto",
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: 12,
                                        overflow: "hidden",
                                        backgroundImage: imageUrl
                                            ? `url("${imageUrl}")`
                                            : "linear-gradient(135deg, #2a2a2e, #1a1a1c)",
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                        boxShadow:
                                            i === active
                                                ? "0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)"
                                                : "0 10px 30px rgba(0,0,0,0.3)",
                                    }}
                                />
                                {/* Caption */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        paddingTop: 14,
                                        textAlign: "center",
                                    }}
                                >
                                    <motion.div
                                        animate={{
                                            opacity: i === active ? 1 : 0.45,
                                        }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            color: "white",
                                            fontSize: 13,
                                            fontWeight: 500,
                                            marginBottom: 3,
                                            letterSpacing: -0.1,
                                        }}
                                    >
                                        {card.title}
                                    </motion.div>
                                    <motion.div
                                        animate={{
                                            opacity: i === active ? 0.5 : 0.25,
                                        }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            color: "white",
                                            fontSize: 10,
                                            letterSpacing: 0.3,
                                        }}
                                    >
                                        {card.subtitle}
                                    </motion.div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </motion.div>

            {/* Dot indicators */}
            {showDots && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                        paddingTop: 8,
                    }}
                >
                    {cards.map((card, i) => {
                        const isActive = i === active
                        return (
                            <motion.button
                                key={`dot-${card.title}-${i}`}
                                onClick={() => goTo(i)}
                                animate={{
                                    width: isActive ? 24 : 6,
                                    backgroundColor: isActive
                                        ? accent
                                        : "rgba(255,255,255,0.25)",
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 250,
                                    damping: 25,
                                }}
                                whileHover={{
                                    backgroundColor: isActive
                                        ? accent
                                        : "rgba(255,255,255,0.5)",
                                }}
                                style={{
                                    height: 6,
                                    borderRadius: 3,
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    outline: "none",
                                }}
                                aria-label={`Go to card ${i + 1}`}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

Gravitas.defaultProps = {
    cards: [
        {
            image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&q=80",
            title: "Ribbon Residence",
            subtitle: "Coastal Neighborhood",
        },
        {
            image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80",
            title: "Garden Pavilion",
            subtitle: "Botanical Edge",
        },
        {
            image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80",
            title: "Monolith Center",
            subtitle: "Midtown District",
        },
        {
            image: "https://images.unsplash.com/photo-1481026469463-66327c86e544?w=600&q=80",
            title: "Courtyard Loft",
            subtitle: "Old Quarter",
        },
        {
            image: "https://images.unsplash.com/photo-1496564203457-11bb12075d90?w=600&q=80",
            title: "Sunset Tower",
            subtitle: "Riverside",
        },
        {
            image: "https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=600&q=80",
            title: "Glass Forum",
            subtitle: "Civic Plaza",
        },
        {
            image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=600&q=80",
            title: "Camera Museum",
            subtitle: "Cultural Mile",
        },
    ],
    cardWidth: 220,
    cardHeight: 280,
    spacing: 200,
    rotationDeg: 25,
    scaleStep: 0.12,
    perspective: 1400,
    autoplay: true,
    autoplayDelay: 2800,
    background: "#0e0e10",
    headerEyebrow: "Issue / Discipline",
    headerTitle: "Architecture",
    headerDescription:
        "A curated study of contemporary architecture, exploring light, structure, and material. Towers, civic spaces, and residences, each paired with a concise label.",
    accent: "#ffffff",
    cornerRadius: 24,
    showDots: true,
    font: "Inter, sans-serif",
}

addPropertyControls(Gravitas, {
    // ─── Content ───────────────────────────────────────────────
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Location",
                },
            },
        },
    },
    // ─── Header ────────────────────────────────────────────────
    headerEyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "Issue / Discipline",
    },
    headerTitle: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Architecture",
    },
    headerDescription: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
    },
    // ─── Layout ────────────────────────────────────────────────
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 100,
        max: 600,
        step: 10,
        defaultValue: 220,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 100,
        max: 800,
        step: 10,
        defaultValue: 280,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        min: 50,
        max: 500,
        step: 5,
        defaultValue: 200,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 400,
        max: 3000,
        step: 50,
        defaultValue: 1400,
    },
    // ─── Style ─────────────────────────────────────────────────
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0e0e10",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#ffffff",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 24,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Show Dots",
        defaultValue: true,
    },
    // ─── Animation ─────────────────────────────────────────────
    rotationDeg: {
        type: ControlType.Number,
        title: "Rotation",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 25,
        unit: "°",
    },
    scaleStep: {
        type: ControlType.Number,
        title: "Scale Falloff",
        min: 0,
        max: 0.4,
        step: 0.01,
        defaultValue: 0.12,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    autoplayDelay: {
        type: ControlType.Number,
        title: "Delay",
        min: 500,
        max: 8000,
        step: 100,
        defaultValue: 2800,
        unit: "ms",
        hidden: (props) => !props.autoplay,
    },
})
