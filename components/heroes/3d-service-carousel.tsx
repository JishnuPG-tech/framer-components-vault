/**
 * ServiceCarousel3D — Framer Component
 *
 * 3D rotating card carousel for a services section.
 *
 * ARCHITECTURE: Single 8-card octagonal cylinder.
 * Each card sits at 45° intervals (0°, 45°, 90°, ... 315°).
 * Auto-rotates with spring physics. Click arrows/dots to navigate.
 * Pauses on hover.
 *
 * USAGE: Paste into Framer → Assets → Code → New Component.
 * Upload images per card via the property panel.
 */

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ── Types ────────────────────────────────────────────────────────────
interface CardData {
    image?: string
    title: string
    description: string
    tag?: string
    ctaText: string
    ctaUrl: string
    accentColor: string
}

interface Props {
    cards: CardData[]
    backgroundColor: string
    cardBackground: string
    cardDepth: number
    autoPlaySpeed: number
    style?: React.CSSProperties
}

// ── Defaults (no external URLs — gradient placeholders) ──────────────
const DEFAULT_CARDS: CardData[] = [
    {
        title: "Brand Design",
        description:
            "Crafting memorable identities that resonate with your audience.",
        tag: "Popular",
        ctaText: "Learn More →",
        ctaUrl: "#",
        accentColor: "#6366f1",
    },
    {
        title: "Web Development",
        description:
            "High-performance websites built with cutting-edge frameworks.",
        tag: "",
        ctaText: "Learn More →",
        ctaUrl: "#",
        accentColor: "#3b82f6",
    },
    {
        title: "SEO Strategy",
        description:
            "Data-driven search optimization that drives organic growth.",
        tag: "",
        ctaText: "Learn More →",
        ctaUrl: "#",
        accentColor: "#10b981",
    },
    {
        title: "Motion Design",
        description:
            "Captivating animations and micro-interactions for\u00A0better\u00A0UX.",
        tag: "New",
        ctaText: "Learn More →",
        ctaUrl: "#",
        accentColor: "#f59e0b",
    },
    {
        title: "Digital Strategy",
        description:
            "Comprehensive roadmaps aligning business goals with\u00A0execution.",
        tag: "",
        ctaText: "Learn More →",
        ctaUrl: "#",
        accentColor: "#ec4899",
    },
    {
        title: "CMS Solutions",
        description:
            "Flexible content management tailored to editorial\u00A0teams.",
        tag: "",
        ctaText: "Learn More →",
        ctaUrl: "#",
        accentColor: "#8b5cf6",
    },
    {
        title: "Analytics & Data",
        description:
            "Actionable insights from advanced tracking and\u00A0reporting.",
        tag: "",
        ctaText: "Learn More →",
        ctaUrl: "#",
        accentColor: "#14b8a6",
    },
    {
        title: "Creative Branding",
        description:
            "Full-spectrum brand experiences from naming to\u00A0launch.",
        tag: "Premium",
        ctaText: "Learn More →",
        ctaUrl: "#",
        accentColor: "#f43f5e",
    },
]

// ── Font Loader ──────────────────────────────────────────────────────
function loadFonts() {
    if (typeof document === "undefined") return
    if (document.getElementById("sc3d-fonts")) return
    const link = document.createElement("link")
    link.id = "sc3d-fonts"
    link.rel = "stylesheet"
    link.href =
        "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap"
    document.head.appendChild(link)
}

// ── Card Component ───────────────────────────────────────────────────
function ServiceCard({ card, bg }: { card: CardData; bg: string }) {
    const [hovered, setHovered] = useState(false)

    const hasImage = !!card.image

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: 18,
                display: "flex",
                flexDirection: "column",
                cursor: "pointer",
                overflow: "hidden",
                background: bg,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: hovered
                    ? `0 10px 40px rgba(0,0,0,0.6), 0 0 20px 2px ${card.accentColor}80, 0 0 50px 5px ${card.accentColor}50`
                    : "0 8px 32px rgba(0,0,0,0.4)",
                border: hovered
                    ? `2px solid ${card.accentColor}`
                    : "1px solid rgba(255,255,255,0.07)",
                transform: hovered
                    ? "translateY(-12px) scale(1.03)"
                    : "translateY(0) scale(1)",
                transition:
                    "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease, border 0.4s ease",
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            {/* Image / Gradient placeholder — fills remaining space */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    flex: 1,
                    overflow: "hidden",
                    minHeight: 180,
                }}
            >
                {hasImage ? (
                    <img
                        src={card.image}
                        alt={card.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            transform: hovered ? "scale(1.08)" : "scale(1)",
                            transition:
                                "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            background: `linear-gradient(135deg, ${card.accentColor}40 0%, ${card.accentColor}15 50%, transparent 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 14,
                                background: `${card.accentColor}25`,
                                border: `1px solid ${card.accentColor}30`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 24,
                                color: card.accentColor,
                            }}
                        >
                            ✦
                        </div>
                    </div>
                )}
                {/* Gradient fade to card bg */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 50,
                        background: `linear-gradient(transparent, ${bg.includes("rgba") ? "rgba(10,10,20,0.85)" : bg})`,
                        pointerEvents: "none" as const,
                    }}
                />
                {/* Tag */}
                {card.tag && (
                    <div
                        style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: `${card.accentColor}dd`,
                            color: "#fff",
                        }}
                    >
                        {card.tag}
                    </div>
                )}
            </div>

            {/* Content */}
            <div
                style={{
                    position: "relative",
                    zIndex: 3,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                }}
            >
                <h3
                    style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: 19,
                        color: "#fff",
                        margin: "0 0 6px",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.2,
                        textWrap: "balance" as any,
                    }}
                >
                    {card.title}
                </h3>

                <p
                    style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        margin: 0,
                        color: hovered
                            ? "rgba(255,255,255,0.72)"
                            : "rgba(255,255,255,0.45)",
                        transition: "color 0.4s ease",
                        textWrap: "pretty" as any,
                    }}
                >
                    {card.description}
                </p>

                <a
                    href={card.ctaUrl}
                    style={{
                        marginTop: 14,
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        color: card.accentColor,
                        textDecoration: "none",
                        opacity: hovered ? 1 : 0.6,
                        transform: hovered
                            ? "translateX(4px)"
                            : "translateX(0)",
                        transition: "all 0.35s ease 0.1s",
                    }}
                >
                    {card.ctaText}
                </a>
            </div>
        </div>
    )
}

// ── Mobile Card ──────────────────────────────────────────────────────
function MobileCard({ card, bg }: { card: CardData; bg: string }) {
    const hasImage = !!card.image
    return (
        <div
            style={{
                borderRadius: 18,
                overflow: "hidden",
                background: bg,
                backdropFilter: "blur(24px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.07)",
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            <div style={{ width: "100%", height: 160, overflow: "hidden" }}>
                {hasImage ? (
                    <img
                        src={card.image}
                        alt={card.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            background: `linear-gradient(135deg, ${card.accentColor}40, ${card.accentColor}10)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <div style={{ fontSize: 28, color: card.accentColor }}>
                            ✦
                        </div>
                    </div>
                )}
            </div>
            <div style={{ padding: "14px 18px 18px" }}>
                {card.tag && (
                    <span
                        style={{
                            display: "inline-block",
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            padding: "3px 8px",
                            borderRadius: 5,
                            marginBottom: 10,
                            background: `${card.accentColor}22`,
                            color: card.accentColor,
                        }}
                    >
                        {card.tag}
                    </span>
                )}
                <h3
                    style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: 17,
                        color: "#fff",
                        margin: "0 0 6px",
                        textWrap: "balance" as any,
                    }}
                >
                    {card.title}
                </h3>
                <p
                    style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.55)",
                        lineHeight: 1.6,
                        margin: 0,
                        textWrap: "pretty" as any,
                    }}
                >
                    {card.description}
                </p>
                <a
                    href={card.ctaUrl}
                    style={{
                        display: "inline-block",
                        marginTop: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        color: card.accentColor,
                        textDecoration: "none",
                    }}
                >
                    {card.ctaText}
                </a>
            </div>
        </div>
    )
}

// ── Nav Arrow ────────────────────────────────────────────────────────
function NavArrow({
    direction,
    onClick,
}: {
    direction: "left" | "right"
    onClick: () => void
}) {
    const [hovered, setHovered] = useState(false)
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                position: "absolute",
                top: "50%",
                zIndex: 20,
                [direction === "left" ? "left" : "right"]: 12,
                transform: "translateY(-50%)",
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: hovered
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.3s",
                backdropFilter: "blur(12px)",
            }}
        >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path
                    d={
                        direction === "left"
                            ? "M11 4L6 9L11 14"
                            : "M7 4L12 9L7 14"
                    }
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )
}

// ── Main Component ───────────────────────────────────────────────────
function ServiceCarousel3D(props: Props) {
    const {
        cards = DEFAULT_CARDS,
        backgroundColor = "#06060f",
        cardBackground = "rgba(10, 10, 20, 0.85)",
        cardDepth = 400,
        autoPlaySpeed = 4000,
        style,
    } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    // Track cumulative rotation to avoid backward jumps
    const [cumulativeRotation, setCumulativeRotation] = useState(0)
    const totalCards = Math.min(cards.length, 8)
    const anglePerCard = 360 / totalCards

    useEffect(() => {
        loadFonts()
    }, [])

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    // Auto-play
    useEffect(() => {
        if (isPaused || autoPlaySpeed <= 0) return
        const timer = setInterval(() => {
            setActiveIndex((prev) => {
                const next = (prev + 1) % totalCards
                setCumulativeRotation((r) => r - anglePerCard)
                return next
            })
        }, autoPlaySpeed)
        return () => clearInterval(timer)
    }, [isPaused, autoPlaySpeed, totalCards, anglePerCard])

    const goTo = (targetIndex: number) => {
        setActiveIndex((prev) => {
            // Calculate shortest rotation direction
            let diff = targetIndex - prev
            if (diff > totalCards / 2) diff -= totalCards
            if (diff < -totalCards / 2) diff += totalCards
            setCumulativeRotation((r) => r - diff * anglePerCard)
            return targetIndex
        })
    }

    const goPrev = () => {
        setActiveIndex((prev) => {
            setCumulativeRotation((r) => r + anglePerCard)
            return (prev - 1 + totalCards) % totalCards
        })
    }

    const goNext = () => {
        setActiveIndex((prev) => {
            setCumulativeRotation((r) => r - anglePerCard)
            return (prev + 1) % totalCards
        })
    }

    // Card face angles for the octagonal cylinder
    const faceAngles = Array.from(
        { length: totalCards },
        (_, i) => i * anglePerCard
    )

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                minHeight: 580,
                background: backgroundColor,
                overflow: "hidden",
                fontFamily: "'DM Sans', sans-serif",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px 20px",
                ...style,
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Noise */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.03,
                    pointerEvents: "none" as const,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    backgroundSize: "128px 128px",
                }}
            />
            {/* Dot grid */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.04,
                    pointerEvents: "none" as const,
                    backgroundImage:
                        "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                }}
            />

            {isMobile ? (
                /* ── Mobile ── */
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        width: "100%",
                        maxWidth: 380,
                    }}
                >
                    {cards.slice(0, totalCards).map((card, i) => (
                        <MobileCard key={i} card={card} bg={cardBackground} />
                    ))}
                </div>
            ) : (
                /* ── Desktop 3D ── */
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        maxWidth: 1100,
                    }}
                >
                    {/* 3D Stage */}
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: 480,
                            perspective: 1200,
                            perspectiveOrigin: "50% 50%",
                        }}
                    >
                        <motion.div
                            animate={{ rotateY: cumulativeRotation }}
                            transition={{
                                type: "spring",
                                stiffness: 45,
                                damping: 16,
                                mass: 1.2,
                            }}
                            style={{
                                position: "absolute",
                                width: 300,
                                height: 440,
                                left: "50%",
                                top: "50%",
                                marginLeft: -150,
                                marginTop: -220,
                                transformStyle: "preserve-3d",
                            }}
                        >
                            {cards.slice(0, totalCards).map((card, i) => (
                                <div
                                    key={i}
                                    style={{
                                        position: "absolute",
                                        width: 300,
                                        height: 440,
                                        top: 0,
                                        left: 0,
                                        transform: `rotateY(${faceAngles[i]}deg) translateZ(${cardDepth}px)`,
                                        backfaceVisibility: "hidden",
                                    }}
                                >
                                    <ServiceCard
                                        card={card}
                                        bg={cardBackground}
                                    />
                                </div>
                            ))}
                        </motion.div>

                        <NavArrow direction="left" onClick={goPrev} />
                        <NavArrow direction="right" onClick={goNext} />
                    </div>

                    {/* Dots */}
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "center",
                            marginTop: 20,
                            position: "relative",
                            zIndex: 10,
                        }}
                    >
                        {Array.from({ length: totalCards }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                style={{
                                    width: i === activeIndex ? 24 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    background:
                                        i === activeIndex
                                            ? cards[i]?.accentColor || "#fff"
                                            : "rgba(255,255,255,0.15)",
                                    transition: "all 0.35s ease",
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Property Controls ────────────────────────────────────────────────
addPropertyControls(ServiceCarousel3D, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#06060f",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "rgba(10, 10, 20, 0.85)",
    },
    cardDepth: {
        type: ControlType.Number,
        title: "3D Depth (px)",
        defaultValue: 400,
        min: 200,
        max: 600,
        step: 10,
    },
    autoPlaySpeed: {
        type: ControlType.Number,
        title: "Auto-play (ms)",
        defaultValue: 4000,
        min: 0,
        max: 10000,
        step: 500,
    },
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Service Title",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue:
                        "A short description of this service offering.",
                },
                tag: {
                    type: ControlType.String,
                    title: "Tag",
                    defaultValue: "",
                },
                ctaText: {
                    type: ControlType.String,
                    title: "CTA Text",
                    defaultValue: "Learn More →",
                },
                ctaUrl: {
                    type: ControlType.Link,
                    title: "CTA URL",
                    defaultValue: "#",
                },
                accentColor: {
                    type: ControlType.Color,
                    title: "Accent",
                    defaultValue: "#6366f1",
                },
            },
        },
        defaultValue: DEFAULT_CARDS,
    },
})

export default ServiceCarousel3D
