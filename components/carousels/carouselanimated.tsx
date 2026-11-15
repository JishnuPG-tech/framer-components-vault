import {
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
import { motion, useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// create a 3d animated carousel

type CarouselCard = {
    label: string
    image: { src: string; alt?: string }
}

const DEFAULT_CARDS: CarouselCard[] = [
    {
        label: "Getting that film look in the post",
        image: {
            src: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=600&q=80",
            alt: "Getting that film look in the post",
        },
    },
    {
        label: "Selected projects from the last month",
        image: {
            src: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
            alt: "Selected projects from the last month",
        },
    },
    {
        label: "Otherworldly places located on Earth",
        image: {
            src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=600&q=80",
            alt: "Otherworldly places located on Earth",
        },
    },
    {
        label: "Visualizing distorted sound mixes",
        image: {
            src: "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=600&q=80",
            alt: "Visualizing distorted sound mixes",
        },
    },
    {
        label: "Palettes and color inspirations",
        image: {
            src: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80",
            alt: "Palettes and color inspirations",
        },
    },
]

function getOffset(idx: number, current: number, total: number) {
    let diff = idx - current
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total
    return diff
}

interface CardCarouselProps {
    cards: CarouselCard[]
    cardWidth: number
    cardHeight: number
    cardRadius: number
    spacing: number
    autoplay: boolean
    autoplayDelay: number
    pauseOnHover: boolean
    perspective: number
    rotateY: number
    zDepth: number
    scaleNear: number
    scaleMid: number
    scaleFar: number
    opacityMid: number
    opacityFar: number
    showArrows: boolean
    showDots: boolean
    backgroundColor: string
    borderRadius: number
    paddingY: number
    overlayOpacity: number
    labelColor: string
    labelAlign: "left" | "center" | "right"
    labelSize: number
    arrowBackground: string
    arrowBorder: string
    arrowColor: string
    dotActive: string
    dotInactive: string
    labelFont: any
    responsive: boolean
    responsiveBaseWidth: number
    responsiveMinScale: number
    responsiveMaxScale: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CardCarousel(props: CardCarouselProps) {
    const {
        cards = DEFAULT_CARDS,
        cardWidth = 190,
        cardHeight = 280,
        cardRadius = 18,
        spacing = 155,
        autoplay = true,
        autoplayDelay = 3200,
        pauseOnHover = true,
        perspective = 1200,
        rotateY = 16,
        zDepth = 90,
        scaleNear = 0.82,
        scaleMid = 0.68,
        scaleFar = 0.55,
        opacityMid = 0.45,
        opacityFar = 0.0,
        showArrows = true,
        showDots = true,
        backgroundColor = "#0a0a0a",
        borderRadius = 12,
        paddingY = 40,
        overlayOpacity = 0.72,
        labelColor = "#FFFFFF",
        labelAlign = "left",
        labelSize = 16,
        arrowBackground = "rgba(255,255,255,0.07)",
        arrowBorder = "rgba(255,255,255,0.2)",
        arrowColor = "#FFFFFF",
        dotActive = "rgba(255,255,255,0.9)",
        dotInactive = "rgba(255,255,255,0.25)",
        responsive = true,
        responsiveBaseWidth = 900,
        responsiveMinScale = 0.7,
        responsiveMaxScale = 1.15,
        labelFont,
        style,
    } = props

    const isFixedHeight = !!style && style.height === "100%"

    const n = Math.max(1, cards.length)
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { margin: "-10% 0px -10% 0px" })

    const [containerWidth, setContainerWidth] = useState(0)

    useEffect(() => {
        if (typeof window === "undefined") return
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return

        const ro = new ResizeObserver((entries) => {
            const w = entries?.[0]?.contentRect?.width
            if (typeof w !== "number" || !Number.isFinite(w)) return
            startTransition(() => setContainerWidth(w))
        })

        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const responsiveScale = useMemo(() => {
        if (!responsive) return 1
        if (!containerWidth || !responsiveBaseWidth) return 1
        const s = containerWidth / responsiveBaseWidth
        return Math.max(responsiveMinScale, Math.min(responsiveMaxScale, s))
    }, [responsive, containerWidth, responsiveBaseWidth, responsiveMinScale, responsiveMaxScale])

    const cardW = Math.round(cardWidth * responsiveScale)
    const cardH = Math.round(cardHeight * responsiveScale)
    const spacingX = spacing * responsiveScale
    const perspectivePx = perspective * responsiveScale
    const zDepthPx = zDepth * responsiveScale
    const labelPx = Math.max(1, Math.round(labelSize * responsiveScale))

    const [current, setCurrent] = useState(Math.min(2, n - 1))
    useEffect(() => {
        startTransition(() => setCurrent((c) => Math.min(c, n - 1)))
    }, [n])

    const autoplayRef = useRef<number | null>(null)

    const stopAutoplay = () => {
        if (autoplayRef.current == null) return
        if (typeof window !== "undefined")
            window.clearInterval(autoplayRef.current)
        autoplayRef.current = null
    }

    const startAutoplay = () => {
        stopAutoplay()
        if (!autoplay || isStatic || !inView) return
        if (typeof window === "undefined") return
        autoplayRef.current = window.setInterval(
            () => {
                startTransition(() => setCurrent((c) => (c + 1) % n))
            },
            Math.max(200, autoplayDelay)
        )
    }

    useEffect(() => {
        startAutoplay()
        return () => stopAutoplay()
    }, [autoplay, autoplayDelay, isStatic, inView, n])

    const getCardProps = (pos: number) => {
        const abs = Math.abs(pos)
        const scale =
            abs === 0
                ? 1
                : abs === 1
                  ? scaleNear
                  : abs === 2
                    ? scaleMid
                    : scaleFar
        const opacity =
            abs > 2 ? opacityFar : abs === 2 ? opacityMid : abs === 1 ? 0.75 : 1
        return {
            x: pos * spacingX,
            z: -abs * zDepthPx,
            rotateY: pos * rotateY,
            scale,
            opacity,
            brightness: abs === 0 ? 1 : abs === 1 ? 0.6 : 0.35,
            zIndex: 10 - abs,
        }
    }

    return (
        <div
            ref={rootRef}
            style={{
                background: backgroundColor,
                width: "100%",
                minHeight: 420,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: `${paddingY}px 0 32px`,
                borderRadius,
                overflow: "hidden",
                position: "relative",
                ...style,
            }}
            onMouseEnter={pauseOnHover ? stopAutoplay : undefined}
            onMouseLeave={pauseOnHover ? startAutoplay : undefined}
        >
            {/* Stage */}
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: isFixedHeight ? "100%" : cardH + 60,
                    flex: isFixedHeight ? 1 : undefined,
                    minHeight: 0,
                    perspective: perspectivePx,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* Arrows */}
                {showArrows &&
                    [
                        { dir: -1, label: "←" as const, side: "left" as const },
                        { dir: 1, label: "→" as const, side: "right" as const },
                    ].map(({ dir, label, side }) => (
                        <button
                            key={side}
                            aria-label={dir === -1 ? "Previous" : "Next"}
                            onClick={() =>
                                startTransition(() =>
                                    setCurrent((c) => (c + dir + n) % n)
                                )
                            }
                            style={{
                                position: "absolute",
                                [side]: 16,
                                top: "50%",
                                transform: "translateY(-50%)",
                                zIndex: 100,
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                border: `1px solid ${arrowBorder}`,
                                background: arrowBackground,
                                color: arrowColor,
                                fontSize: 15,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backdropFilter: "blur(4px)",
                            }}
                            type="button"
                        >
                            {label}
                        </button>
                    ))}

                {/* Cards */}
                {cards.map((card, i) => {
                    const pos = getOffset(i, current, n)
                    const p = getCardProps(pos)

                    return (
                        <motion.div
                            key={i}
                            role="button"
                            aria-label={card.label}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    startTransition(() => setCurrent(i))
                                }
                            }}
                            onClick={() => startTransition(() => setCurrent(i))}
                            animate={
                                isStatic
                                    ? undefined
                                    : {
                                          x: p.x,
                                          z: p.z,
                                          rotateY: p.rotateY,
                                          scale: p.scale,
                                          opacity: p.opacity,
                                      }
                            }
                            transition={{
                                type: "spring",
                                stiffness: 280,
                                damping: 30,
                            }}
                            style={{
                                position: "absolute",
                                width: cardW,
                                height: isFixedHeight ? "100%" : cardH,
                                borderRadius: cardRadius,
                                overflow: "hidden",
                                cursor: "pointer",
                                zIndex: p.zIndex,
                                filter: `brightness(${p.brightness})`,
                                pointerEvents:
                                    Math.abs(pos) <= 1 ? "auto" : "none",
                                transformStyle: "preserve-3d",
                                outline: "none",
                                transform: isStatic
                                    ? `translateX(${p.x}px) translateZ(${p.z}px) rotateY(${p.rotateY}deg) scale(${p.scale})`
                                    : undefined,
                                opacity: isStatic ? p.opacity : undefined,
                            }}
                        >
                            {/* Image */}
                            <img
                                src={card.image?.src}
                                alt={card.image?.alt ?? card.label}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                            {/* Gradient overlay */}
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: `linear-gradient(to top, rgba(0,0,0,${Math.max(0, Math.min(1, overlayOpacity))}) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)`,
                                }}
                            />
                            {/* Label */}
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 22,
                                    left: 16,
                                    right: 16,
                                    color: labelColor,
                                    lineHeight: 1.28,
                                    letterSpacing: "-0.01em",
                                    ...(labelFont || {}),
                                    fontSize: labelPx,
                                    textAlign: labelAlign,
                                }}
                            >
                                {card.label}
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {showDots && (
                <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
                    {cards.map((_, i) => (
                        <div
                            key={i}
                            role="button"
                            aria-label={`Go to slide ${i + 1}`}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    startTransition(() => setCurrent(i))
                                }
                            }}
                            onClick={() => startTransition(() => setCurrent(i))}
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background:
                                    i === current ? dotActive : dotInactive,
                                transform:
                                    i === current ? "scale(1.4)" : "scale(1)",
                                transition: "all 0.3s",
                                cursor: "pointer",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

addPropertyControls(CardCarousel, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 12,
        defaultValue: DEFAULT_CARDS,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Card title",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
    },
    cardWidth: {
        type: ControlType.Number,
        defaultValue: 190,
        title: "Card Width",
        min: 120,
        max: 420,
        step: 1,
    },
    cardHeight: {
        type: ControlType.Number,
        defaultValue: 280,
        title: "Card Height",
        min: 120,
        max: 520,
        step: 1,
    },
    cardRadius: {
        type: ControlType.Number,
        defaultValue: 18,
        title: "Card Radius",
        min: 0,
        max: 60,
        step: 1,
    },
    spacing: {
        type: ControlType.Number,
        defaultValue: 155,
        title: "Spacing",
        min: 0,
        max: 400,
        step: 1,
    },
    perspective: {
        type: ControlType.Number,
        defaultValue: 1200,
        title: "Perspective",
        min: 200,
        max: 2400,
        step: 10,
    },
    rotateY: {
        type: ControlType.Number,
        defaultValue: 16,
        title: "Rotate Y",
        min: 0,
        max: 45,
        step: 1,
        unit: "°",
    },
    zDepth: {
        type: ControlType.Number,
        defaultValue: 90,
        title: "Z Depth",
        min: 0,
        max: 240,
        step: 1,
    },
    scaleNear: {
        type: ControlType.Number,
        defaultValue: 0.82,
        title: "Scale (Near)",
        min: 0.2,
        max: 1,
        step: 0.01,
    },
    scaleMid: {
        type: ControlType.Number,
        defaultValue: 0.68,
        title: "Scale (Mid)",
        min: 0.1,
        max: 1,
        step: 0.01,
    },
    scaleFar: {
        type: ControlType.Number,
        defaultValue: 0.55,
        title: "Scale (Far)",
        min: 0.1,
        max: 1,
        step: 0.01,
    },
    opacityMid: {
        type: ControlType.Number,
        defaultValue: 0.45,
        title: "Opacity (Mid)",
        min: 0,
        max: 1,
        step: 0.01,
    },
    opacityFar: {
        type: ControlType.Number,
        defaultValue: 0.0,
        title: "Opacity (Far)",
        min: 0,
        max: 1,
        step: 0.01,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplayDelay: {
        type: ControlType.Number,
        defaultValue: 3200,
        title: "Autoplay (ms)",
        min: 200,
        max: 10000,
        step: 50,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Dots",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    backgroundColor: {
        type: ControlType.Color,
        defaultValue: "#0a0a0a",
        title: "Background",
    },
    borderRadius: {
        type: ControlType.Number,
        defaultValue: 12,
        title: "Radius",
        min: 0,
        max: 40,
        step: 1,
    },
    paddingY: {
        type: ControlType.Number,
        defaultValue: 40,
        title: "Padding Y",
        min: 0,
        max: 120,
        step: 1,
    },
    overlayOpacity: {
        type: ControlType.Number,
        defaultValue: 0.72,
        title: "Overlay",
        min: 0,
        max: 1,
        step: 0.01,
    },
    labelColor: {
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        title: "Label Color",
    },
    labelAlign: {
        type: ControlType.Enum,
        defaultValue: "left",
        title: "Label Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    labelSize: {
        type: ControlType.Number,
        defaultValue: 16,
        title: "Label Size",
        min: 8,
        max: 64,
        step: 1,
        unit: "px",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.28em",
        },
    },
    responsive: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    responsiveBaseWidth: {
        type: ControlType.Number,
        title: "Base Width",
        defaultValue: 900,
        min: 320,
        max: 1920,
        step: 10,
        hidden: ({ responsive }) => !responsive,
    },
    responsiveMinScale: {
        type: ControlType.Number,
        title: "Min Scale",
        defaultValue: 0.7,
        min: 0.3,
        max: 1,
        step: 0.01,
        hidden: ({ responsive }) => !responsive,
    },
    responsiveMaxScale: {
        type: ControlType.Number,
        title: "Max Scale",
        defaultValue: 1.15,
        min: 1,
        max: 2,
        step: 0.01,
        hidden: ({ responsive }) => !responsive,
    },
    arrowBackground: {
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.07)",
        title: "Arrow Bg",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowBorder: {
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.2)",
        title: "Arrow Border",
        hidden: ({ showArrows }) => !showArrows,
    },
    arrowColor: {
        type: ControlType.Color,
        defaultValue: "#FFFFFF",
        title: "Arrow Color",
        hidden: ({ showArrows }) => !showArrows,
    },
    dotActive: {
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.9)",
        title: "Dot Active",
        hidden: ({ showDots }) => !showDots,
    },
    dotInactive: {
        type: ControlType.Color,
        defaultValue: "rgba(255,255,255,0.25)",
        title: "Dot Inactive",
        hidden: ({ showDots }) => !showDots,
    },
})
