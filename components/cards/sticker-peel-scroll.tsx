// Sticker Peel Scroll
// A sticky scroll section that peels cards off from the top-right corner,
// revealing the next cards underneath.

import * as React from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import * as framer from "framer"
const { addPropertyControls, ControlType, useIsStaticRenderer } = framer as any
import type { CSSProperties } from "react"

interface CarouselImage {
    src: string
    alt?: string
}

interface StickerPeelScrollProps {
    children?: React.ReactNode
    images?: CarouselImage[]
    backColor?: string
    cardAspectRatio?: "custom" | "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
    cardWidth?: number
    cardHeight?: number
    cardRounding?: number
    fadeOutFlap?: boolean
    alignmentX?: "flex-start" | "center" | "flex-end"
    alignmentY?: "flex-start" | "center" | "flex-end"
    padding?: number
    disableAnimation?: boolean
    style?: CSSProperties
}

/** Default placeholder images */
const DEFAULT_IMAGES: CarouselImage[] = [
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Card 1",
    },
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Card 2",
    },
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Card 3",
    },
]

export default function StickerPeelScroll(props: StickerPeelScrollProps) {
    const {
        children,
        images = [],
        backColor = "#ffffff",
        cardAspectRatio = "custom",
        cardWidth = 400,
        cardHeight: initialCardHeight = 600,
        cardRounding = 16,
        fadeOutFlap = true,
        alignmentX = "center",
        alignmentY = "center",
        padding = 20,
        disableAnimation = false,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement>(null)

    // Process children & images into a unified array of items
    const items = React.useMemo(() => {
        const slots = React.Children.toArray(children)
        const combined: any[] = []
        if (images.length === 0 && slots.length === 0) {
            DEFAULT_IMAGES.forEach((img) =>
                combined.push({ type: "image", src: img.src, alt: img.alt })
            )
        } else {
            images.forEach((img) =>
                combined.push({
                    type: "image",
                    src: img.src || (img as any),
                    alt: img.alt,
                })
            )
            slots.forEach((slot) => combined.push({ type: "slot", node: slot }))
        }
        return combined
    }, [children, images])

    const N = items.length

    const computedCardHeight = React.useMemo(() => {
        switch (cardAspectRatio) {
            case "1:1":
                return cardWidth
            case "16:9":
                return cardWidth * (9 / 16)
            case "9:16":
                return cardWidth * (16 / 9)
            case "4:3":
                return cardWidth * (3 / 4)
            case "3:4":
                return cardWidth * (4 / 3)
            default:
                return initialCardHeight
        }
    }, [cardAspectRatio, cardWidth, initialCardHeight])

    // Scroll tracking
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    const containerHeight =
        isStatic || disableAnimation ? "100%" : `${Math.max(1, N) * 100}vh`

    return (
        <section
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                height: containerHeight,
                width: "100%",
                // REMOVED overflowX: "hidden" to fix CSS sticky positioning
            }}
        >
            <div
                style={{
                    position:
                        isStatic || disableAnimation ? "relative" : "sticky",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: isStatic || disableAnimation ? "100%" : "100vh",
                    display: "flex",
                    justifyContent: alignmentX,
                    alignItems: alignmentY,
                    padding: padding,
                    // Removed overflow: "hidden" to prevent ugly clipping boundary when flap peels away
                }}
            >
                {/* Deck of cards container */}
                <div
                    style={{
                        position: "relative",
                        width: cardWidth,
                        height: computedCardHeight,
                        maxWidth: "100%",
                        maxHeight: "100%",
                    }}
                >
                    {items.map((item, i) => (
                        <PeelCard
                            key={i}
                            item={item}
                            index={i}
                            total={N}
                            scrollYProgress={scrollYProgress}
                            isStatic={isStatic || disableAnimation}
                            backColor={backColor}
                            cardRounding={cardRounding}
                            fadeOutFlap={fadeOutFlap}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

interface PeelCardProps {
    item: any
    index: number
    total: number
    scrollYProgress: any
    isStatic: boolean
    backColor: string
    cardRounding: number
    fadeOutFlap: boolean
}

function PeelCard({
    item,
    index,
    total,
    scrollYProgress,
    isStatic,
    backColor,
    cardRounding,
    fadeOutFlap,
}: PeelCardProps) {
    const cardRef = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ w: 0, h: 0 })

    React.useEffect(() => {
        const el = cardRef.current
        if (!el) return

        // Initial size
        setSize({ w: el.offsetWidth, h: el.offsetHeight })

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect.width > 0) {
                    setSize({
                        w: entry.contentRect.width,
                        h: entry.contentRect.height,
                    })
                }
            }
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // Progress mapping: each card gets its slice of the overall scroll
    const scrollStart = total > 1 ? index / total : 0
    const scrollEnd = total > 1 ? (index + 1) / total : 1

    const cardProgress = useTransform(
        scrollYProgress,
        [scrollStart, scrollEnd],
        [0, 1],
        { clamp: true }
    )

    // Math for the peel cut line: Y - X = d
    // d sweeps from -W (top right corner) to H (bottom left corner)

    // Unpeeled Clip Path (base card)
    const unpeeledClipPath = useTransform(cardProgress, (p) => {
        if (isStatic || p <= 0)
            return `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`
        if (p >= 1) return `polygon(0% 100%, 0% 100%, 0% 100%)`

        const W = size.w || 100
        const H = size.h || 100
        // Exact math, no offsets. Offsetting causes the base card to stick out visibly.
        const d = -W + p * (W + H)

        const pts = []
        pts.push(`0px ${H}px`) // Always bottom-left

        if (d < H - W) {
            pts.push(`${W}px ${H}px`)
            pts.push(`${W}px ${d + W}px`)
        } else {
            pts.push(`${H - d}px ${H}px`)
        }

        if (d < 0) {
            pts.push(`${-d}px 0px`)
            pts.push(`0px 0px`)
        } else {
            pts.push(`0px ${d}px`)
        }

        return `polygon(${pts.join(", ")})`
    })

    // Peeled Clip Path (for the flap)
    const peeledClipPath = useTransform(cardProgress, (p) => {
        if (isStatic || p <= 0 || p >= 1)
            return `polygon(0px 0px, 0px 0px, 0px 0px)`

        const W = size.w || 100
        const H = size.h || 100
        const d = -W + p * (W + H)
        const R = cardRounding || 0

        const pts = []

        // Generate a smooth arc for the top-right corner to match the border-radius perfectly.
        // We calculate points along a quarter circle of radius R.
        if (R > 0) {
            const arcSteps = 8 // 8 points is plenty for a smooth CSS corner
            for (let i = 0; i <= arcSteps; i++) {
                const angle = (i / arcSteps) * (Math.PI / 2) // 0 to 90 degrees
                // Center of the top-right border-radius circle is at (W - R, R)
                const x = W - R + R * Math.cos(angle)
                const y = R - R * Math.sin(angle)
                pts.push(`${x}px ${y}px`)
            }
        } else {
            pts.push(`${W}px 0px`)
        }

        if (d < 0) {
            pts.push(`${-d}px 0px`)
        } else {
            pts.push(`0px 0px`)
            pts.push(`0px ${d}px`)
        }

        if (d < H - W) {
            pts.push(`${W}px ${d + W}px`)
        } else {
            pts.push(`${H - d}px ${H}px`)
            pts.push(`${W}px ${H}px`)
        }

        return `polygon(${pts.join(", ")})`
    })

    // Transform to mirror the peeled flap across the cut line Y = X + d
    const flapTransform = useTransform(cardProgress, (p) => {
        if (isStatic || p <= 0 || p >= 1)
            return `translateY(0px) matrix(1,0,0,1,0,0) translateY(0px)`
        const W = size.w || 100
        const H = size.h || 100
        const d = -W + p * (W + H)
        // Add a 1px translate towards the top-right AFTER the mirror to perfectly cover the anti-aliasing seam.
        return `translate(1px, -1px) translateY(${d}px) matrix(0,1,1,0,0,0) translateY(${-d}px)`
    })

    // Flap Opacity: Fade in the flap slightly to prevent harsh visual pop on frame 1
    // and optionally fade it out at the end of the peel
    const flapOpacity = useTransform(cardProgress, (p) => {
        if (isStatic || p <= 0 || p >= 1) return 0
        const W = size.w || 100
        const H = size.h || 100
        const d = -W + p * (W + H)
        const dist = d + W // distance from top right corner

        // Initial fade in
        let opacity = 1
        if (dist < 4) return 0
        if (dist < 12) opacity = (dist - 4) / 8

        // Final fade out
        if (fadeOutFlap) {
            // Fade out during the last 20% of the card's progress
            if (p > 0.8) {
                opacity *= 1 - (p - 0.8) / 0.2
            }
        }

        return opacity
    })

    // Z-index: top card (index 0) has highest z-index
    const zIndex = total - index

    // Render inner content
    const content =
        item.type === "image" ? (
            <img
                src={item.src}
                alt={item.alt || "Card"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                draggable={false}
            />
        ) : (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {item.node}
            </div>
        )

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                zIndex,
                pointerEvents: "none", // wrapper doesn't block clicks
            }}
        >
            {/* Base Card (Unpeeled) */}
            <motion.div
                ref={cardRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: unpeeledClipPath,
                    pointerEvents: "auto", // hit test only the clipped polygon!
                    overflow: "hidden",
                    borderRadius: cardRounding,
                }}
            >
                {content}
            </motion.div>

            {/* Sticker Flap */}
            {!isStatic && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        // Removed overflow: hidden so the flap can peel infinitely outwards
                    }}
                >
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            clipPath: peeledClipPath,
                            transform: flapTransform,
                            transformOrigin: "0 0",
                            pointerEvents: "none",
                            filter: "drop-shadow(-4px 4px 12px rgba(0,0,0,0.3))",
                            opacity: flapOpacity,
                        }}
                    >
                        {/* Inner flap handles the visual background and rounding ONLY */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: backColor,
                                borderTopRightRadius: cardRounding,
                                // Ensure the inner background covers the exact bounding box
                                width: "100%",
                                height: "100%",
                            }}
                        />
                    </motion.div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(StickerPeelScroll, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
    },
    children: {
        // @ts-ignore: ControlType.Slot exists in Framer runtime
        type: ControlType.Slot,
        title: "Children Slots",
    },
    backColor: {
        type: ControlType.Color,
        title: "Flap Color",
        defaultValue: "#ffffff",
    },
    cardAspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["custom", "1:1", "16:9", "9:16", "4:3", "3:4"],
        optionTitles: ["Custom", "1:1 (Square)", "16:9", "9:16", "4:3", "3:4"],
        defaultValue: "custom",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 100,
        max: 2000,
        defaultValue: 400,
        displayStepper: true,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 100,
        max: 2000,
        defaultValue: 500,
        displayStepper: true,
        hidden(props: any) {
            return props.cardAspectRatio !== "custom"
        },
    },
    cardRounding: {
        type: ControlType.Number,
        title: "Rounding",
        min: 0,
        max: 200,
        defaultValue: 16,
    },
    fadeOutFlap: {
        type: ControlType.Boolean,
        title: "Fade Out",
        defaultValue: true,
        description:
            "Smoothly fades out the peeled flap as it moves further away from the card.",
    },
    alignmentX: {
        type: ControlType.Enum,
        title: "Align X",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
    },
    alignmentY: {
        type: ControlType.Enum,
        title: "Align Y",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "center",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 200,
        defaultValue: 20,
    },
    disableAnimation: {
        type: ControlType.Boolean,
        title: "Disable Anim",
        defaultValue: false,
    },
})
