import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useScroll, useSpring, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * STACKING CARDS — 3D depth-parallax stack
 *
 * Behaviour: all cards sit pinned in one framed "stage" in the viewport.
 * As you scroll, the active card sits flat at the front (z = 0, scale = 1).
 * The moment the next card takes over, the previous card doesn't move up
 * or down — it slides straight BACK in 3D space (translateZ), shrinks
 * slightly, tilts back a few degrees and dims, like a card being placed
 * behind the rest of a stack/deck. The next card rises up out of that same
 * stack from behind (small scale/tilt/blur-free entrance) into the front
 * spot. Everything happens inside one fixed frame with breathing-room
 * padding around it — nothing ever leaves the viewport.
 *
 * Static rendering: the animated path (framer-motion springs/transforms)
 * and the static/canvas path (plain styled divs) are two entirely
 * separate components — AnimatedCard and StaticCard — so no
 * framer-motion animation hooks are ever instantiated while rendering
 * on the Framer canvas or during export.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 900
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shade(hex: string, amount: number): string {
    let color = (hex || "#888888").replace("#", "")
    if (color.length === 3) {
        color = color
            .split("")
            .map((c) => c + c)
            .join("")
    }
    const num = parseInt(color, 16)
    if (isNaN(num)) return hex

    let r = (num >> 16) & 0xff
    let g = (num >> 8) & 0xff
    let b = num & 0xff

    r = Math.min(255, Math.max(0, Math.round(r + 255 * amount)))
    g = Math.min(255, Math.max(0, Math.round(g + 255 * amount)))
    b = Math.min(255, Math.max(0, Math.round(b + 255 * amount)))

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

// Parses a CSS padding shorthand string (as returned by ControlType.Padding,
// e.g. "140px 140px 140px 140px") into individual side values in px, so the
// stage width/height/centering math can keep working the same way it did
// when Frame Padding was a single number.
function parsePaddingSides(padding: string) {
    const nums = (padding || "0px")
        .trim()
        .split(/\s+/)
        .map((p) => parseFloat(p) || 0)

    let top = 0,
        right = 0,
        bottom = 0,
        left = 0

    if (nums.length === 1) {
        top = right = bottom = left = nums[0]
    } else if (nums.length === 2) {
        top = bottom = nums[0]
        right = left = nums[1]
    } else if (nums.length === 3) {
        top = nums[0]
        right = left = nums[1]
        bottom = nums[2]
    } else {
        ;[top, right, bottom, left] = nums
    }

    return { top, right, bottom, left }
}

interface FontControl {
    fontFamily?: string
    fontWeight?: number | string
    fontSize?: number
    lineHeight?: number | string
    letterSpacing?: number | string
}

interface CardData {
    title: string
    description: string
    image?: { src: string; alt?: string }
    background: string
    titleColor: string
    descriptionColor: string
}

interface DepthSettings {
    zStep: number
    scaleStep: number
    stackOffset: number
    tiltAngle: number
    darkenAmount: number
    opacityFloor: number
    visibleDepth: number
}

interface EntranceSettings {
    distance: number
    scale: number
    tilt: number
}

// ---------------------------------------------------------------------------
// Card visual face (shared between live + static render — no motion hooks)
// ---------------------------------------------------------------------------

interface CardFaceProps {
    data: CardData
    cardRadius: number
    cardPadding: number
    imageRadius: number
    gapAfterHeader: number
    titleFont: FontControl
    descriptionFont: FontControl
    shadow: boolean
    cardShadow: string
    placeholderColor: string
}

function CardFace(props: CardFaceProps) {
    const {
        data,
        cardRadius,
        cardPadding,
        imageRadius,
        gapAfterHeader,
        titleFont,
        descriptionFont,
        shadow,
        cardShadow,
        placeholderColor,
    } = props

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: data.background,
                borderRadius: cardRadius,
                padding: cardPadding,
                boxSizing: "border-box",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: shadow ? cardShadow : "none",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 24,
                    flexWrap: "wrap",
                    flexShrink: 0,
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        color: data.titleColor,
                        ...titleFont,
                    }}
                >
                    {data.title}
                </h3>
                <p
                    style={{
                        margin: 0,
                        maxWidth: 380,
                        color: data.descriptionColor,
                        ...descriptionFont,
                    }}
                >
                    {data.description}
                </p>
            </div>

            <div style={{ height: gapAfterHeader, flexShrink: 0 }} />

            <div
                style={{
                    width: "100%",
                    flex: "1 1 auto",
                    minHeight: 0,
                    borderRadius: imageRadius,
                    overflow: "hidden",
                    background: placeholderColor,
                }}
            >
                {data.image?.src && (
                    <img
                        src={data.image.src}
                        alt={data.image.alt || data.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                    />
                )}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Animated card — framer-motion hooks live here ONLY. Never mounted while
// rendering on the Framer canvas or during export.
// ---------------------------------------------------------------------------

interface AnimatedCardProps {
    data: CardData
    index: number
    isLast: boolean
    activeFloat: any // MotionValue<number>
    cardWidth: number
    cardHeight: number
    cardRadius: number
    cardPadding: number
    imageRadius: number
    gapAfterHeader: number
    titleFont: FontControl
    descriptionFont: FontControl
    perspective: number
    depth: DepthSettings
    entrance: EntranceSettings
    spring: { stiffness: number; damping: number; mass: number }
    shadow: boolean
    cardShadow: string
    zIndexBase: number
}

function AnimatedCard(props: AnimatedCardProps) {
    const {
        data,
        index,
        isLast,
        activeFloat,
        cardWidth,
        cardHeight,
        cardRadius,
        cardPadding,
        imageRadius,
        gapAfterHeader,
        titleFont,
        descriptionFont,
        perspective,
        depth,
        entrance,
        spring,
        shadow,
        cardShadow,
        zIndexBase,
    } = props

    // d < 0  -> card hasn't arrived yet (rising in from behind)
    // d = 0  -> card is the active front card
    // d > 0  -> card has been overtaken, receding into the stack
    const rawD = useTransform(activeFloat, (v: number) => v - index)
    const d = useSpring(rawD, spring)

    const maxDepth = Math.max(depth.visibleDepth, 1)

    const inputRange = [-1, 0, maxDepth]

    const translateZ = useTransform(d, inputRange, [
        -entrance.distance,
        0,
        -depth.zStep * maxDepth,
    ])
    const scale = useTransform(d, inputRange, [
        entrance.scale,
        1,
        1 - depth.scaleStep * maxDepth,
    ])
    const rotateX = useTransform(d, inputRange, [
        entrance.tilt,
        0,
        depth.tiltAngle,
    ])
    const translateY = useTransform(d, inputRange, [
        entrance.distance * 0.25,
        0,
        depth.stackOffset * maxDepth,
    ])
    const opacity = useTransform(
        d,
        [-1, -0.6, 0, maxDepth],
        [0, 1, 1, depth.opacityFloor]
    )
    const darken = useTransform(d, [0, maxDepth], [0, depth.darkenAmount])

    const placeholderColor = useMemo(
        () => shade(data.background, -0.12),
        [data.background]
    )

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                width: cardWidth,
                height: cardHeight,
                margin: "auto",
                perspective: perspective,
                zIndex: zIndexBase + index,
            }}
        >
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    translateZ,
                    translateY,
                    scale,
                    rotateX,
                    opacity,
                    transformOrigin: "50% 100%",
                    transformPerspective: perspective,
                    willChange: "transform, opacity",
                }}
            >
                <CardFace
                    data={data}
                    cardRadius={cardRadius}
                    cardPadding={cardPadding}
                    imageRadius={imageRadius}
                    gapAfterHeader={gapAfterHeader}
                    titleFont={titleFont}
                    descriptionFont={descriptionFont}
                    shadow={shadow}
                    cardShadow={cardShadow}
                    placeholderColor={placeholderColor}
                />
                {!isLast && (
                    <motion.div
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: cardRadius,
                            background: "#0A0A0A",
                            opacity: darken,
                            pointerEvents: "none",
                        }}
                    />
                )}
            </motion.div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Static card — plain divs only, zero framer-motion hooks. This is the only
// card renderer mounted while on the Framer canvas or during export.
// ---------------------------------------------------------------------------

interface StaticCardProps {
    data: CardData
    index: number
    cardWidth: number
    cardHeight: number
    cardRadius: number
    cardPadding: number
    imageRadius: number
    gapAfterHeader: number
    titleFont: FontControl
    descriptionFont: FontControl
    shadow: boolean
    cardShadow: string
    zIndexBase: number
}

function StaticCard(props: StaticCardProps) {
    const {
        data,
        index,
        cardWidth,
        cardHeight,
        cardRadius,
        cardPadding,
        imageRadius,
        gapAfterHeader,
        titleFont,
        descriptionFont,
        shadow,
        cardShadow,
        zIndexBase,
    } = props

    const placeholderColor = useMemo(
        () => shade(data.background, -0.12),
        [data.background]
    )

    const staticOffset = index * 14
    const staticScale = 1 - index * 0.045

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                width: cardWidth,
                height: cardHeight,
                margin: "auto",
                transform: `translateY(${staticOffset}px) scale(${staticScale})`,
                zIndex: zIndexBase + (1000 - index),
            }}
        >
            <CardFace
                data={data}
                cardRadius={cardRadius}
                cardPadding={cardPadding}
                imageRadius={imageRadius}
                gapAfterHeader={gapAfterHeader}
                titleFont={titleFont}
                descriptionFont={descriptionFont}
                shadow={shadow}
                cardShadow={cardShadow}
                placeholderColor={placeholderColor}
            />
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface StackingCardsProps {
    cards: CardData[]
    titleFont: FontControl
    descriptionFont: FontControl
    cardRadius: number
    imageRadius: number
    cardPadding: number
    cardWidth: number
    cardHeight: number
    gapAfterHeader: number
    framePadding: string
    stagePosition: number
    sectionHeight: number
    topSpacing: number
    bottomSpacing: number
    perspective: number
    depthSettings: DepthSettings
    entranceSettings: EntranceSettings
    shadow: boolean
    cardShadow: string
    springTransition: {
        type?: string
        stiffness: number
        damping: number
        mass: number
    }
    smoothScroll: boolean
    smoothness: number
    background: string
    stageBackground: string
}

export default function StackingCards(props: StackingCardsProps) {
    const {
        cards,
        titleFont,
        descriptionFont,
        cardRadius,
        imageRadius,
        cardPadding,
        cardWidth,
        cardHeight,
        gapAfterHeader,
        framePadding,
        stagePosition,
        sectionHeight,
        topSpacing,
        bottomSpacing,
        perspective,
        depthSettings,
        entranceSettings,
        shadow,
        cardShadow,
        springTransition,
        smoothScroll,
        smoothness,
        background,
        stageBackground,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const list = cards && cards.length ? cards : []
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerHeight, setContainerHeight] = useState(0)

    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return
        const measure = () => setContainerHeight(el.scrollHeight)
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [list.length, sectionHeight, topSpacing, bottomSpacing, isStatic])

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    })

    // px scrolled from the top of this component
    const pxScrolled = useTransform(
        scrollYProgress,
        (v: number) => v * containerHeight
    )

    // fractional index of the card that is currently "active" / front
    const activeFloat = useTransform(pxScrolled, (v: number) =>
        sectionHeight > 0 ? (v - topSpacing) / sectionHeight : 0
    )

    // Optional inertia-based smooth scroll (skipped on canvas / static / disabled)
    useEffect(() => {
        if (
            isCanvas ||
            isStatic ||
            !smoothScroll ||
            typeof window === "undefined"
        )
            return

        let lenis: any
        let rafId = 0
        let cancelled = false

        // RAF loop only ever runs while the component is intersecting the
        // viewport — startLoop()/stopLoop() are gated by the
        // IntersectionObserver below so idle/offscreen instances don't burn
        // CPU on every frame.
        const raf = (time: number) => {
            if (lenis) lenis.raf(time)
            rafId = requestAnimationFrame(raf)
        }

        const startLoop = () => {
            if (rafId || cancelled) return
            rafId = requestAnimationFrame(raf)
        }

        const stopLoop = () => {
            if (rafId) {
                cancelAnimationFrame(rafId)
                rafId = 0
            }
        }

        // Bundled npm dependency (resolved and bundled at publish time by
        // Framer — not loaded as remote executable code at runtime).
        import("lenis")
            .then((mod) => {
                if (cancelled) return
                const Lenis = mod.default
                lenis = new Lenis({
                    duration: 0.6 + smoothness * 1.2,
                    easing: (t: number) => 1 - Math.pow(1 - t, 3),
                    smoothWheel: true,
                    wheelMultiplier: 1,
                })
            })
            .catch(() => {})

        const el = containerRef.current
        let observer: IntersectionObserver | undefined

        if (el && typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        startLoop()
                    } else {
                        stopLoop()
                    }
                },
                { threshold: 0 }
            )
            observer.observe(el)
        } else {
            // No IntersectionObserver support — fall back to the previous
            // always-on behavior.
            startLoop()
        }

        return () => {
            cancelled = true
            stopLoop()
            if (observer) observer.disconnect()
            if (lenis) lenis.destroy()
        }
    }, [isCanvas, isStatic, smoothScroll, smoothness])

    const spring = {
        stiffness: springTransition?.stiffness ?? 260,
        damping: springTransition?.damping ?? 34,
        mass: springTransition?.mass ?? 1,
    }

    const {
        top: padTop,
        right: padRight,
        bottom: padBottom,
        left: padLeft,
    } = parsePaddingSides(framePadding)
    const avgPadding = (padTop + padRight + padBottom + padLeft) / 4

    const frameWidth = cardWidth + padLeft + padRight
    const frameHeight = cardHeight + padTop + padBottom
    const stageRadius = cardRadius + avgPadding * 0.4

    // Static / canvas thumbnail — render a lightweight, non-scroll-driven
    // fanned stack (StaticCard, no framer-motion hooks at all) so it still
    // looks intentional in the Framer canvas & exports.
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    minHeight: frameHeight,
                    background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: framePadding,
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: cardWidth,
                        height: cardHeight,
                        maxWidth: "100%",
                        background: stageBackground,
                        borderRadius: cardRadius,
                    }}
                >
                    {list.slice(0, 4).map((card, i) => (
                        <StaticCard
                            key={i}
                            data={card}
                            index={i}
                            cardWidth={cardWidth}
                            cardHeight={cardHeight}
                            cardRadius={cardRadius}
                            cardPadding={cardPadding}
                            imageRadius={imageRadius}
                            gapAfterHeader={gapAfterHeader}
                            titleFont={titleFont}
                            descriptionFont={descriptionFont}
                            shadow={shadow}
                            cardShadow={cardShadow}
                            zIndexBase={1}
                        />
                    ))}
                    {list.length === 0 && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#999",
                                fontFamily: "Inter, sans-serif",
                            }}
                        >
                            Add cards →
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height:
                    sectionHeight * Math.max(list.length - 1, 0) +
                    topSpacing +
                    bottomSpacing +
                    cardHeight,
                background,
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top: `calc(50vh - ${frameHeight / 2}px + ${stagePosition}px)`,
                    width: frameWidth,
                    maxWidth: "100%",
                    height: frameHeight,
                    margin: "0 auto",
                    padding: framePadding,
                    boxSizing: "border-box",
                    background: stageBackground,
                    borderRadius: stageRadius,
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {list.map((card, i) => (
                        <AnimatedCard
                            key={i}
                            data={card}
                            index={i}
                            isLast={i === list.length - 1}
                            activeFloat={activeFloat}
                            cardWidth={cardWidth}
                            cardHeight={cardHeight}
                            cardRadius={cardRadius}
                            cardPadding={cardPadding}
                            imageRadius={imageRadius}
                            gapAfterHeader={gapAfterHeader}
                            titleFont={titleFont}
                            descriptionFont={descriptionFont}
                            perspective={perspective}
                            depth={depthSettings}
                            entrance={entranceSettings}
                            spring={spring}
                            shadow={shadow}
                            cardShadow={cardShadow}
                            zIndexBase={1}
                        />
                    ))}

                    {list.length === 0 && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#999",
                                fontFamily: "Inter, sans-serif",
                            }}
                        >
                            Add cards from the property panel →
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Property Controls
// ---------------------------------------------------------------------------

addPropertyControls(StackingCards, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Your Card's title",
                    displayTextArea: false,
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue:
                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.",
                    displayTextArea: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                background: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#f0f0f0",
                },
                titleColor: {
                    type: ControlType.Color,
                    title: "Title Color",
                    defaultValue: "#1A1A1A",
                },
                descriptionColor: {
                    type: ControlType.Color,
                    title: "Description Color",
                    defaultValue: "#3A2E28",
                },
            },
        },
        defaultValue: [
            {
                title: "Web Design + Dev",
                description:
                    "Thoughtful, high-converting websites built around your brand, audience, and business goals.",
                background: "#ffffff",
                titleColor: "#1A1A1A",
                descriptionColor: "#3A2E28",
            },
            {
                title: "Brand Identity",
                description:
                    "We shape the visual language behind brands, from identity systems to the details that make them recognizable.",
                background: "#ffffff",
                titleColor: "#1A1A1A",
                descriptionColor: "#3A2E28",
            },
            {
                title: "Content Creation",
                description:
                    "Visual content designed to communicate your ideas, showcase your products, and keep your audience engaged.",
                background: "#ffffff",
                titleColor: "#1A1A1A",
                descriptionColor: "#3A2E28",
            },
            {
                title: "Motion Design",
                description:
                    "Purposeful animation and interaction that makes digital experiences feel more dynamic and engaging.",
                background: "#ffffff",
                titleColor: "#1A1A1A",
                descriptionColor: "#3A2E28",
            },
        ],
    },

    // Typography — Framer's native font controls
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "inter-display",
            fontWeight: 600,
            fontSize: 34,
            lineHeight: "0.95em",
            letterSpacing: "-0.02em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "inter-display",
            fontWeight: 400,
            fontSize: 17,
            lineHeight: "1.35em",
            letterSpacing: "-0.02em",
        },
    },

    // Layout
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 280,
        max: 1000,
        step: 10,
        defaultValue: 920,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 200,
        max: 900,
        step: 10,
        defaultValue: 600,
    },
    framePadding: {
        type: ControlType.Padding,
        title: "Frame Padding",
        description: "Breathing room around the card stack inside the stage",
        defaultValue: "140px 140px 140px 140px",
    },
    stageBackground: {
        type: ControlType.Color,
        title: "Frame Background",
        defaultValue: "",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 24,
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        min: 0,
        max: 120,
        step: 1,
        defaultValue: 42,
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Image Radius",
        min: 0,
        max: 60,
        step: 1,
        defaultValue: 16,
    },
    gapAfterHeader: {
        type: ControlType.Number,
        title: "Header Gap",
        min: 0,
        max: 120,
        step: 2,
        defaultValue: 42,
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Card Shadow",
        defaultValue: true,
    },
    cardShadow: {
        type: ControlType.BoxShadow,
        title: "Shadow Style",
        defaultValue:
            "0px 30px 60px -20px rgba(0,0,0,0.28), 0px 10px 20px -10px rgba(0,0,0,0.18)",
        hidden: (props) => !props.shadow,
    },
    background: {
        type: ControlType.Color,
        title: "Page Background",
        defaultValue: "#f0f0f0",
    },

    // Scroll / stacking behaviour
    stagePosition: {
        type: ControlType.Number,
        title: "Vertical Nudge",
        description:
            "The stage is centered in the viewport automatically — use this only to fine-tune (0 = perfectly centered)",
        min: -300,
        max: 300,
        step: 1,
        defaultValue: 0,
    },
    sectionHeight: {
        type: ControlType.Number,
        title: "Scroll Per Card",
        description:
            "Scroll distance (px) each card owns before the next takes over",
        min: 200,
        max: 2000,
        step: 10,
        defaultValue: 900,
    },
    topSpacing: {
        type: ControlType.Number,
        title: "Top Spacing",
        min: 0,
        max: 800,
        step: 10,
        defaultValue: 90,
    },
    bottomSpacing: {
        type: ControlType.Number,
        title: "Bottom Spacing",
        min: 0,
        max: 800,
        step: 10,
        defaultValue: 300,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        description: "Lower = more dramatic 3D depth, higher = subtler",
        min: 300,
        max: 3000,
        step: 50,
        defaultValue: 1200,
    },

    // Depth / stack look — grouped so the panel stays readable
    depthSettings: {
        type: ControlType.Object,
        title: "Depth & Stack",
        controls: {
            visibleDepth: {
                type: ControlType.Number,
                title: "Visible Depth",
                description:
                    "How many receded cards stay visible behind the front card",
                min: 1,
                max: 6,
                step: 1,
                defaultValue: 3,
            },
            zStep: {
                type: ControlType.Number,
                title: "Depth Per Card",
                description:
                    "How far back (px) each receded card sits behind the front one",
                min: 0,
                max: 300,
                step: 5,
                defaultValue: 0,
            },
            scaleStep: {
                type: ControlType.Number,
                title: "Shrink Per Card",
                min: 0,
                max: 0.2,
                step: 0.005,
                defaultValue: 0.05,
            },
            stackOffset: {
                type: ControlType.Number,
                title: "Stack Offset",
                description:
                    "Small downward nudge per depth level, for a paper-stack look",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 16,
            },
            tiltAngle: {
                type: ControlType.Number,
                title: "Recede Tilt",
                description: "Degrees the farthest receded card tilts back",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 5,
            },
            darkenAmount: {
                type: ControlType.Number,
                title: "Darken Per Card",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.3,
            },
            opacityFloor: {
                type: ControlType.Number,
                title: "Min Opacity",
                description: "Opacity of the farthest visible receded card",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 1,
            },
        },
        defaultValue: {
            visibleDepth: 3,
            zStep: 0,
            scaleStep: 0.05,
            stackOffset: 16,
            tiltAngle: 5,
            darkenAmount: 0.3,
            opacityFloor: 1,
        },
    },

    entranceSettings: {
        type: ControlType.Object,
        title: "Entrance",
        controls: {
            distance: {
                type: ControlType.Number,
                title: "Rise Distance",
                description:
                    "How far back (px) an incoming card starts before arriving",
                min: 0,
                max: 400,
                step: 5,
                defaultValue: 40,
            },
            scale: {
                type: ControlType.Number,
                title: "Start Scale",
                min: 0.5,
                max: 1,
                step: 0.01,
                defaultValue: 0.5,
            },
            tilt: {
                type: ControlType.Number,
                title: "Start Tilt",
                description:
                    "Degrees an incoming card tilts as it rises into place",
                min: -40,
                max: 40,
                step: 1,
                defaultValue: 0,
            },
        },
        defaultValue: {
            distance: 40,
            scale: 0.5,
            tilt: 0,
        },
    },

    springTransition: {
        type: ControlType.Transition,
        title: "Motion Feel",
        defaultValue: {
            type: "spring",
            stiffness: 260,
            damping: 34,
            mass: 1,
        },
    },

    // Smooth scrolling
    smoothScroll: {
        type: ControlType.Boolean,
        title: "Smooth Scroll",
        defaultValue: true,
    },
    smoothness: {
        type: ControlType.Number,
        title: "Scroll Smoothness",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.25,
        hidden: (props) => !props.smoothScroll,
    },
})
