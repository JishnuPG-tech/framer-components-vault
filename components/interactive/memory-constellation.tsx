import { useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    AnimatePresence,
    motion,
    useMotionValue,
    useSpring,
} from "framer-motion"

function mulberry32(a) {
    return function () {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 */
export default function MemoryConstellation(props) {
    const {
        starCount,
        starSize,
        starOpacity,
        twinkleSpeed,
        seed,
        memoryTitles,
        memoryDates,
        memoryLocations,
        memoryDescriptions,
        memoryImages,
        hoverRadius,
        glowIntensity,
        animationSpeed,
        cardOffset,
        smoothness,
        backgroundColor,
        starColor,
        glowColor,
        cardRadius,
        cardWidth,
        headline,
        subheadline,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const [size, setSize] = useState({ w: 0, h: 0 })
    const [activeIndex, setActiveIndex] = useState(null)
    const [activeStrength, setActiveStrength] = useState(0)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const activeRef = useRef({ x: 0, y: 0, strength: 0 })

    const cursorX = useMotionValue(0)
    const cursorY = useMotionValue(0)
    const springConfig = {
        stiffness: 30 + smoothness * 220,
        damping: 12 + smoothness * 22,
    }
    const cardX = useSpring(cursorX, springConfig)
    const cardY = useSpring(cursorY, springConfig)

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const rect = entries[0].contentRect
            setSize({ w: rect.width, h: rect.height })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const decorativeStars = useMemo(() => {
        if (!size.w || !size.h) return []
        const rand = mulberry32(seed * 1013 + 1)
        return Array.from({ length: starCount }, () => ({
            x: rand() * size.w,
            y: rand() * size.h,
            r: starSize * (0.4 + rand() * 1.2),
            baseOpacity: starOpacity * (0.3 + rand() * 0.7),
            phase: rand() * Math.PI * 2,
            rate: 0.5 + rand() * 1.5,
        }))
    }, [seed, starCount, starSize, starOpacity, size.w, size.h])

    const memories = useMemo(() => {
        const count = Math.max(
            memoryTitles?.length || 0,
            memoryDates?.length || 0,
            memoryLocations?.length || 0,
            memoryDescriptions?.length || 0,
            memoryImages?.length || 0
        )
        return Array.from({ length: count }, (_, i) => ({
            title: memoryTitles?.[i] || "",
            date: memoryDates?.[i] || "",
            location: memoryLocations?.[i] || "",
            description: memoryDescriptions?.[i] || "",
            images: (Array.isArray(memoryImages?.[i])
                ? memoryImages[i]
                : memoryImages?.[i]
                  ? [memoryImages[i]]
                  : []
            ).filter(Boolean),
        }))
    }, [
        memoryTitles,
        memoryDates,
        memoryLocations,
        memoryDescriptions,
        memoryImages,
    ])

    const memoryStars = useMemo(() => {
        if (!size.w || !size.h || !memories.length) return []
        const rand = mulberry32(seed * 7919 + 2)
        const margin = 0.14
        return memories.map((m, i) => ({
            ...m,
            x: (margin + rand() * (1 - margin * 2)) * size.w,
            y: (margin + rand() * (1 - margin * 2)) * size.h,
            index: i,
        }))
    }, [seed, memories, size.w, size.h])

    useEffect(() => {
        if (!size.w || !size.h) return
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        const dpr = window.devicePixelRatio || 1
        canvas.width = size.w * dpr
        canvas.height = size.h * dpr
        canvas.style.width = `${size.w}px`
        canvas.style.height = `${size.h}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        function draw(t) {
            ctx.clearRect(0, 0, size.w, size.h)
            const active = activeRef.current
            for (const s of decorativeStars) {
                const twinkle = isStatic
                    ? 0.75
                    : 0.5 +
                      0.5 *
                          Math.sin(t * 0.001 * twinkleSpeed * s.rate + s.phase)
                let opacity = s.baseOpacity * (0.4 + twinkle * 0.6)
                if (active.strength > 0) {
                    const d = Math.hypot(s.x - active.x, s.y - active.y)
                    if (d < hoverRadius * 1.6) {
                        const boost =
                            (1 - d / (hoverRadius * 1.6)) * active.strength
                        opacity = Math.min(1, opacity + boost * 0.5)
                    }
                }
                ctx.globalAlpha = opacity
                ctx.fillStyle = starColor
                ctx.beginPath()
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
                ctx.fill()
            }
            ctx.globalAlpha = 1
        }

        if (isStatic) {
            draw(0)
            return
        }

        let rafId
        function loop(t) {
            draw(t)
            rafId = requestAnimationFrame(loop)
        }
        rafId = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(rafId)
    }, [
        isStatic,
        decorativeStars,
        size.w,
        size.h,
        twinkleSpeed,
        starColor,
        hoverRadius,
    ])

    function handlePointerMove(e) {
        if (isStatic || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        cursorX.set(x + cardOffset)
        cursorY.set(y + cardOffset)

        let closestIndex = null
        let closestDist = Infinity
        for (const star of memoryStars) {
            const d = Math.hypot(star.x - x, star.y - y)
            if (d < closestDist) {
                closestDist = d
                closestIndex = star.index
            }
        }

        if (closestIndex !== null && closestDist < hoverRadius) {
            const strength = 1 - closestDist / hoverRadius
            const star = memoryStars[closestIndex]
            activeRef.current = { x: star.x, y: star.y, strength }
            setActiveIndex(closestIndex)
            setActiveStrength(strength)
        } else {
            activeRef.current = { x: 0, y: 0, strength: 0 }
            setActiveIndex(null)
            setActiveStrength(0)
        }
    }

    function handlePointerLeave() {
        if (isStatic) return
        activeRef.current = { x: 0, y: 0, strength: 0 }
        setActiveIndex(null)
        setActiveStrength(0)
    }

    const activeMemory = isStatic
        ? memoryStars[0]
        : activeIndex !== null
          ? memoryStars[activeIndex]
          : null
    const strength = isStatic ? 1 : activeStrength

    useEffect(() => {
        setGalleryIndex(0)
    }, [activeMemory?.index])

    useEffect(() => {
        if (isStatic || !activeMemory || activeMemory.images.length < 2) return
        const total = activeMemory.images.length
        const id = setInterval(() => {
            setGalleryIndex((i) => (i + 1) % total)
        }, 2200)
        return () => clearInterval(id)
    }, [isStatic, activeMemory?.index, activeMemory?.images?.length])

    return (
        <div
            ref={containerRef}
            onPointerMove={isStatic ? undefined : handlePointerMove}
            onPointerLeave={isStatic ? undefined : handlePointerLeave}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 300,
                minHeight: 200,
                overflow: "hidden",
                background: backgroundColor,
                boxSizing: "border-box",
                cursor: isStatic ? "default" : "pointer",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            />

            {activeMemory && (
                <svg
                    width={size.w}
                    height={size.h}
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                    }}
                >
                    {memoryStars
                        .filter((s) => s.index !== activeMemory.index)
                        .map((s) => {
                            const d = Math.hypot(
                                s.x - activeMemory.x,
                                s.y - activeMemory.y
                            )
                            if (d > hoverRadius * 3) return null
                            return (
                                <line
                                    key={s.index}
                                    x1={activeMemory.x}
                                    y1={activeMemory.y}
                                    x2={s.x}
                                    y2={s.y}
                                    stroke={glowColor}
                                    strokeWidth={1}
                                    opacity={0.18 * strength}
                                />
                            )
                        })}
                </svg>
            )}

            {memoryStars.map((star) => {
                const isActive =
                    activeMemory && activeMemory.index === star.index
                const s = isActive ? strength : 0
                const dotSize = Math.max(4, starSize * 3)
                return (
                    <motion.div
                        key={star.index}
                        animate={{
                            scale: 1 + s * 1.6 * glowIntensity,
                            boxShadow: `0 0 ${8 + s * 26 * glowIntensity}px ${
                                2 + s * 6
                            }px ${glowColor}`,
                        }}
                        transition={{ duration: 0.25 / animationSpeed }}
                        style={{
                            position: "absolute",
                            left: star.x - dotSize / 2,
                            top: star.y - dotSize / 2,
                            width: dotSize,
                            height: dotSize,
                            borderRadius: "50%",
                            background: glowColor,
                            pointerEvents: "none",
                        }}
                    />
                )
            })}

            {!isStatic && (
                <AnimatePresence>
                    {activeMemory && (
                        <motion.div
                            key={activeMemory.index}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.28 / animationSpeed }}
                            style={{
                                position: "absolute",
                                left: cardX,
                                top: cardY,
                                width: cardWidth,
                                pointerEvents: "none",
                                borderRadius: cardRadius,
                                overflow: "hidden",
                                background: "rgba(18,18,26,0.85)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
                            }}
                        >
                            {activeMemory.images.length > 0 && (
                                <div
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        height: cardWidth * 0.62,
                                        overflow: "hidden",
                                    }}
                                >
                                    <AnimatePresence>
                                        <motion.img
                                            key={`${activeMemory.index}-${galleryIndex}`}
                                            src={
                                                activeMemory.images[
                                                    galleryIndex
                                                ]
                                            }
                                            alt=""
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.4 }}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    </AnimatePresence>
                                    {activeMemory.images.length > 1 && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                bottom: 8,
                                                left: 0,
                                                right: 0,
                                                display: "flex",
                                                justifyContent: "center",
                                                gap: 4,
                                            }}
                                        >
                                            {activeMemory.images.map((_, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        width: 5,
                                                        height: 5,
                                                        borderRadius: "50%",
                                                        background:
                                                            i === galleryIndex
                                                                ? "#FFFFFF"
                                                                : "rgba(255,255,255,0.35)",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{ padding: 14 }}>
                                <div
                                    style={{
                                        color: "#FFFFFF",
                                        fontSize: 15,
                                        fontWeight: 700,
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {activeMemory.title}
                                </div>
                                {(activeMemory.date ||
                                    activeMemory.location) && (
                                    <div
                                        style={{
                                            color: "rgba(255,255,255,0.65)",
                                            fontSize: 12,
                                            marginTop: 3,
                                        }}
                                    >
                                        {[
                                            activeMemory.date,
                                            activeMemory.location,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </div>
                                )}
                                {activeMemory.description && (
                                    <div
                                        style={{
                                            color: "rgba(255,255,255,0.8)",
                                            fontSize: 12,
                                            marginTop: 8,
                                            lineHeight: 1.45,
                                        }}
                                    >
                                        {activeMemory.description}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {(headline || subheadline) && (
                <motion.div
                    animate={{ opacity: activeMemory ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        gap: 10,
                        pointerEvents: "none",
                    }}
                >
                    {headline && (
                        <div
                            style={{
                                color: "#FFFFFF",
                                fontSize: 26,
                                fontWeight: 600,
                                opacity: 0.92,
                            }}
                        >
                            {headline}
                        </div>
                    )}
                    {subheadline && (
                        <div
                            style={{
                                color: "#FFFFFF",
                                fontSize: 14,
                                opacity: 0.5,
                            }}
                        >
                            {subheadline}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    )
}

MemoryConstellation.defaultProps = {
    starCount: 220,
    starSize: 1.4,
    starOpacity: 0.8,
    twinkleSpeed: 1,
    seed: 1,
    memoryTitles: [
        "Summer in Paris",
        "Mountain Escape",
        "First Apartment",
        "Late Night Drive",
        "Golden Hour",
        "Her Birthday",
        "The Wedding",
        "Trail to the Summit",
        "Graduation Day",
        "New Year's Eve",
        "The Reunion",
        "Sunday Morning",
        "The Open Road",
        "Camping Under Stars",
        "City Lights",
        "First Snow",
    ],
    memoryDates: [
        "August 2025",
        "March 2024",
        "June 2023",
        "October 2024",
        "July 2022",
        "May 2024",
        "September 2023",
        "January 2025",
        "May 2022",
        "December 2023",
        "April 2024",
        "February 2025",
        "June 2024",
        "August 2023",
        "November 2024",
        "December 2024",
    ],
    memoryLocations: [
        "Paris, France",
        "Swiss Alps",
        "Brooklyn, NY",
        "Pacific Coast Highway",
        "Santorini, Greece",
        "Home",
        "Lake Como, Italy",
        "Rocky Mountains",
        "State University",
        "Times Square, NY",
        "Hometown",
        "The Kitchen",
        "Route 66",
        "Yosemite",
        "Tokyo, Japan",
        "Back Porch",
    ],
    memoryDescriptions: [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
    ],
    memoryImages: [
        [
            "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80",
            "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=500&q=80",
            "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=500&q=80",
            "https://images.unsplash.com/photo-1520939817895-152a02588cca?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&q=80",
        ],
        [
            "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=500&q=80",
        ],
    ],
    hoverRadius: 140,
    glowIntensity: 1,
    animationSpeed: 1,
    cardOffset: 26,
    smoothness: 0.5,
    backgroundColor: "#05050A",
    starColor: "#FFFFFF",
    glowColor: "#BFE3FF",
    cardRadius: 16,
    cardWidth: 220,
    headline: "Some memories never fade.",
    subheadline: "Move your cursor to discover them ✦",
}

addPropertyControls(MemoryConstellation, {
    starCount: {
        type: ControlType.Number,
        title: "Star Count",
        min: 50,
        max: 500,
        step: 10,
        defaultValue: 220,
    },
    starSize: {
        type: ControlType.Number,
        title: "Star Size",
        min: 0.5,
        max: 4,
        step: 0.1,
        defaultValue: 1.4,
    },
    starOpacity: {
        type: ControlType.Number,
        title: "Star Opacity",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.8,
    },
    twinkleSpeed: {
        type: ControlType.Number,
        title: "Twinkle Speed",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    seed: {
        type: ControlType.Number,
        title: "Randomize Seed",
        min: 1,
        max: 9999,
        step: 1,
        defaultValue: 1,
    },
    memoryTitles: {
        type: ControlType.Array,
        title: "Titles",
        maxCount: 20,
        control: { type: ControlType.String },
        defaultValue: [
            "Summer in Paris",
            "Mountain Escape",
            "First Apartment",
            "Late Night Drive",
            "Golden Hour",
            "Her Birthday",
            "The Wedding",
            "Trail to the Summit",
            "Graduation Day",
            "New Year's Eve",
            "The Reunion",
            "Sunday Morning",
            "The Open Road",
            "Camping Under Stars",
            "City Lights",
            "First Snow",
        ],
    },
    memoryDates: {
        type: ControlType.Array,
        title: "Dates",
        maxCount: 20,
        control: { type: ControlType.String },
        defaultValue: [
            "August 2025",
            "March 2024",
            "June 2023",
            "October 2024",
            "July 2022",
            "May 2024",
            "September 2023",
            "January 2025",
            "May 2022",
            "December 2023",
            "April 2024",
            "February 2025",
            "June 2024",
            "August 2023",
            "November 2024",
            "December 2024",
        ],
    },
    memoryLocations: {
        type: ControlType.Array,
        title: "Locations",
        maxCount: 20,
        control: { type: ControlType.String },
        defaultValue: [
            "Paris, France",
            "Swiss Alps",
            "Brooklyn, NY",
            "Pacific Coast Highway",
            "Santorini, Greece",
            "Home",
            "Lake Como, Italy",
            "Rocky Mountains",
            "State University",
            "Times Square, NY",
            "Hometown",
            "The Kitchen",
            "Route 66",
            "Yosemite",
            "Tokyo, Japan",
            "Back Porch",
        ],
    },
    memoryDescriptions: {
        type: ControlType.Array,
        title: "Descriptions",
        maxCount: 20,
        control: { type: ControlType.String, displayTextArea: true },
        defaultValue: [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
        ],
    },
    memoryImages: {
        type: ControlType.Array,
        title: "Image URLs",
        maxCount: 20,
        control: {
            type: ControlType.Array,
            title: "Images",
            control: { type: ControlType.String },
        },
        defaultValue: [
            [
                "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80",
                "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=500&q=80",
                "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=500&q=80",
                "https://images.unsplash.com/photo-1520939817895-152a02588cca?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&q=80",
            ],
            [
                "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=500&q=80",
            ],
        ],
    },
    hoverRadius: {
        type: ControlType.Number,
        title: "Hover Radius",
        min: 40,
        max: 400,
        step: 10,
        defaultValue: 140,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        min: 0,
        max: 2.5,
        step: 0.1,
        defaultValue: 1,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        min: 0.3,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    cardOffset: {
        type: ControlType.Number,
        title: "Card Offset",
        min: 0,
        max: 100,
        step: 2,
        defaultValue: 26,
    },
    smoothness: {
        type: ControlType.Number,
        title: "Spring Smoothness",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#05050A",
    },
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#FFFFFF",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#BFE3FF",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 16,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Size",
        min: 140,
        max: 400,
        step: 10,
        defaultValue: 220,
    },
    headline: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "Some memories never fade.",
    },
    subheadline: {
        type: ControlType.String,
        title: "Subheadline",
        defaultValue: "Move your cursor to discover them ✦",
    },
})
