import * as React from "react"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

// User request: detect static renderer contexts and disable all animation/autoplay/looping effects, rendering a styled static preview fallback while preserving existing controls and runtime behavior.

/**
 * Cover Flow Gallery
 *
 * A 3D "cover flow" card carousel. Drag across the stage and the
 * nearest card glides to the front while the rest fold away into the
 * perspective with a soft spring bounce.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_IMAGES = [
    "https://picsum.photos/id/1015/600/760",
    "https://picsum.photos/id/1016/600/760",
    "https://picsum.photos/id/1025/600/760",
    "https://picsum.photos/id/1039/600/760",
    "https://picsum.photos/id/1043/600/760",
    "https://picsum.photos/id/1050/600/760",
    "https://picsum.photos/id/1060/600/760",
    "https://picsum.photos/id/1074/600/760",
    "https://picsum.photos/id/1080/600/760",
]

const SPRING_PRESETS: Record<
    string,
    { stiffness: number; damping: number; mass: number }
> = {
    Gentle: { stiffness: 120, damping: 20, mass: 1 },
    Snappy: { stiffness: 260, damping: 22, mass: 1 },
    Bouncy: { stiffness: 300, damping: 12, mass: 1 },
    Stiff: { stiffness: 420, damping: 34, mass: 1 },
    Custom: { stiffness: 220, damping: 18, mass: 1 },
}

function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * clamp(t, 0, 1)
}

// ---------------------------------------------------------------------------
// Single Card
// ---------------------------------------------------------------------------

interface CardProps {
    index: number
    total: number
    activeFloat: any // MotionValue<number>
    src: string
    cardWidth: number
    cardHeight: number
    gap: number
    rotation: number
    curve: number
    scaleFalloff: number
    opacityFalloff: number
    brightnessFalloff: number
    minOpacity: number
    minScale: number
    radius: number
    borderWidth: number
    borderColor: string
    shadow: boolean
    shadowColor: string
    shadowBlur: number
    shadowY: number
    activeGlow: boolean
    glowColor: string
    onSelect: (i: number) => void
    mode: string
}

function Card(props: CardProps) {
    const {
        index,
        total,
        activeFloat,
        src,
        cardWidth,
        cardHeight,
        gap,
        rotation,
        curve,
        scaleFalloff,
        opacityFalloff,
        brightnessFalloff,
        minOpacity,
        minScale,
        radius,
        borderWidth,
        borderColor,
        shadow,
        shadowColor,
        shadowBlur,
        shadowY,
        activeGlow,
        glowColor,
        onSelect,
        mode,
    } = props

    const clickable = mode === "click"
    const hoverable = mode === "hover"
    const interactive = clickable || hoverable

    const step = cardWidth + gap

    const x = useTransform(activeFloat, (a: number) => (index - a) * step)
    const y = useTransform(
        activeFloat,
        (a: number) => Math.abs(index - a) * curve
    )
    const rotateY = useTransform(activeFloat, (a: number) => {
        const d = index - a
        return clamp(-d * rotation, -85, 85)
    })
    const scale = useTransform(activeFloat, (a: number) => {
        const d = Math.abs(index - a)
        return lerp(1, minScale, d / Math.max(scaleFalloff, 0.001))
    })
    const opacity = useTransform(activeFloat, (a: number) => {
        const d = Math.abs(index - a)
        return lerp(1, minOpacity, d / Math.max(opacityFalloff, 0.001))
    })
    const brightness = useTransform(activeFloat, (a: number) => {
        const d = Math.abs(index - a)
        return clamp(1 - d * brightnessFalloff, 0.35, 1)
    })
    const zIndex = useTransform(activeFloat, (a: number) =>
        Math.round(1000 - Math.abs(index - a) * 10)
    )
    const glowOpacity = useTransform(activeFloat, (a: number) => {
        const d = Math.abs(index - a)
        return clamp(1 - d * 2, 0, 1)
    })

    return (
        <motion.div
            onClick={() => clickable && onSelect(index)}
            onPointerEnter={() => hoverable && onSelect(index)}
            style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: cardWidth,
                height: cardHeight,
                marginLeft: -cardWidth / 2,
                marginTop: -cardHeight / 2,
                x,
                y,
                rotateY,
                scale,
                opacity,
                zIndex,
                filter: useTransform(brightness, (b) => `brightness(${b})`),
                borderRadius: radius,
                overflow: "hidden",
                border:
                    borderWidth > 0
                        ? `${borderWidth}px solid ${borderColor}`
                        : "none",
                boxShadow: shadow
                    ? `0 ${shadowY}px ${shadowBlur}px 0 ${shadowColor}`
                    : "none",
                cursor: interactive ? "pointer" : "default",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                willChange: "transform",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    pointerEvents: "none",
                }}
            />
            {activeGlow && (
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: radius,
                        boxShadow: `inset 0 0 0 2px ${glowColor}`,
                        opacity: glowOpacity,
                        pointerEvents: "none",
                    }}
                />
            )}
        </motion.div>
    )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CoverFlowGallery(props: any) {
    const { images } = props
    const isStaticRenderer = useIsStaticRenderer()

    const {
        cardWidth = 260,
        cardHeight = 330,
        gap = 94,
        radius = 0,
    } = props.layout || {}

    const {
        perspective = 1200,
        rotation = 45,
        curve = 0,
        scaleFalloff = 4,
        minScale = 0.56,
        opacityFalloff = 6,
        minOpacity = 1,
        brightnessFalloff = 0.09,
    } = props.depth || {}

    const {
        interaction = "drag",
        activeIndex = 4,
        dragSensitivity = 1,
        autoplaySpeed = 1600,
        autoplayDirection = "Forward",
        springPreset = "Bouncy",
        stiffness = 220,
        damping = 18,
        mass = 1,
    } = props.motionSettings || {}

    const {
        backgroundColor = "#dedede",
        borderWidth = 0,
        borderColor = "#FFFFFF",
        shadow = true,
        shadowColor = "rgba(0,0,0,0.55)",
        shadowBlur = 40,
        shadowY = 18,
        activeGlow = false,
        glowColor = "#FFFFFF",
    } = props.styleSettings || {}

    const {
        showDots = false,
        dotColor = "rgba(255,255,255,0.35)",
        dotActiveColor = "#FFFFFF",
    } = props.indicators || {}

    const sourceImages: string[] =
        images && images.length > 0
            ? images
                  .map((i: any) => (typeof i === "string" ? i : i?.src))
                  .filter(Boolean)
            : DEFAULT_IMAGES

    const total = sourceImages.length
    const containerRef = useRef<HTMLDivElement>(null)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const interactive =
        !isStaticRenderer &&
        !isCanvas &&
        (interaction === "drag" ||
            interaction === "hover" ||
            interaction === "click")

    const springConfig =
        springPreset === "Custom"
            ? { stiffness, damping, mass }
            : SPRING_PRESETS[springPreset] || SPRING_PRESETS.Snappy

    const target = useMotionValue(clamp(activeIndex, 0, Math.max(total - 1, 0)))
    const activeFloat = useSpring(target, springConfig)

    const [displayIndex, setDisplayIndex] = useState(
        clamp(Math.round(activeIndex), 0, Math.max(total - 1, 0))
    )

    const setActive = useCallback(
        (i: number) => {
            const clamped = clamp(i, 0, total - 1)
            target.set(clamped)
            React.startTransition(() => setDisplayIndex(clamped))
        },
        [target, total]
    )

    // Manual / canvas mode: reflect the Active Index control directly.
    useEffect(() => {
        if (!interactive) {
            const clamped = clamp(
                Math.round(activeIndex),
                0,
                Math.max(total - 1, 0)
            )
            target.set(clamped)
            React.startTransition(() => setDisplayIndex(clamped))
        }
    }, [activeIndex, interactive, total, target])

    // Drag mode: click-and-drag (or touch) across the stage to move
    // through the cards, smoothed by the same spring as every other mode.
    const isDraggingRef = useRef(false)
    const dragStartXRef = useRef(0)
    const dragStartTargetRef = useRef(0)

    const handleDragPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (interaction !== "drag") return
            isDraggingRef.current = true
            dragStartXRef.current = e.clientX
            dragStartTargetRef.current = target.get()
            ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        },
        [interaction, target]
    )

    const handleDragPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (interaction !== "drag" || !isDraggingRef.current) return
            const step = Math.max(Math.abs(cardWidth + gap), 40)
            const deltaX = e.clientX - dragStartXRef.current
            const deltaIndex = (-deltaX / step) * dragSensitivity
            const next = clamp(
                dragStartTargetRef.current + deltaIndex,
                0,
                total - 1
            )
            target.set(next)
            React.startTransition(() => setDisplayIndex(Math.round(next)))
        },
        [interaction, cardWidth, gap, dragSensitivity, total, target]
    )

    const handleDragPointerUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (interaction !== "drag") return
            isDraggingRef.current = false
            ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
        },
        [interaction]
    )

    // Autoplay mode.
    useEffect(() => {
        if (
            interaction !== "autoplay" ||
            isCanvas ||
            isStaticRenderer ||
            total < 2
        )
            return
        const dir = autoplayDirection === "Backward" ? -1 : 1
        const id = setInterval(
            () => {
                React.startTransition(() =>
                    setDisplayIndex((prev) => {
                        const next = (prev + dir + total) % total
                        target.set(next)
                        return next
                    })
                )
            },
            Math.max(300, autoplaySpeed)
        )
        return () => clearInterval(id)
    }, [
        interaction,
        autoplaySpeed,
        autoplayDirection,
        total,
        target,
        isCanvas,
        isStaticRenderer,
    ])

    const staticPreviewIndex = useMemo(
        () => clamp(Math.round(activeIndex), 0, Math.max(total - 1, 0)),
        [activeIndex, total]
    )
    const staticPreviewImage = sourceImages[staticPreviewIndex] || sourceImages[0]

    if (isStaticRenderer) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    background: backgroundColor,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        perspective: perspective,
                        transformStyle: "preserve-3d",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            width: cardWidth,
                            height: cardHeight,
                            borderRadius: radius,
                            overflow: "hidden",
                            border:
                                borderWidth > 0
                                    ? `${borderWidth}px solid ${borderColor}`
                                    : "none",
                            boxShadow: shadow
                                ? `0 ${shadowY}px ${shadowBlur}px 0 ${shadowColor}`
                                : "none",
                            backgroundImage: `url(${staticPreviewImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        {activeGlow && (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: radius,
                                    boxShadow: `inset 0 0 0 2px ${glowColor}`,
                                }}
                            />
                        )}
                    </div>
                </div>

                {showDots && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 18,
                            left: 0,
                            right: 0,
                            display: "flex",
                            justifyContent: "center",
                            gap: 8,
                            zIndex: 2000,
                        }}
                    >
                        {sourceImages.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: 999,
                                    background:
                                        i === staticPreviewIndex
                                            ? dotActiveColor
                                            : dotColor,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onPointerDown={
                interaction === "drag" ? handleDragPointerDown : undefined
            }
            onPointerMove={
                interaction === "drag" ? handleDragPointerMove : undefined
            }
            onPointerUp={
                interaction === "drag" ? handleDragPointerUp : undefined
            }
            onPointerCancel={
                interaction === "drag" ? handleDragPointerUp : undefined
            }
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: backgroundColor,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor:
                    interaction === "drag"
                        ? isDraggingRef.current
                            ? "grabbing"
                            : "grab"
                        : undefined,
                touchAction: interaction === "drag" ? "none" : undefined,
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    perspective: perspective,
                    transformStyle: "preserve-3d",
                }}
            >
                {sourceImages.map((src, i) => (
                    <Card
                        key={i}
                        index={i}
                        total={total}
                        activeFloat={activeFloat}
                        src={src}
                        cardWidth={cardWidth}
                        cardHeight={cardHeight}
                        gap={gap}
                        rotation={rotation}
                        curve={curve}
                        scaleFalloff={scaleFalloff}
                        opacityFalloff={opacityFalloff}
                        brightnessFalloff={brightnessFalloff}
                        minScale={minScale}
                        minOpacity={minOpacity}
                        radius={radius}
                        borderWidth={borderWidth}
                        borderColor={borderColor}
                        shadow={shadow}
                        shadowColor={shadowColor}
                        shadowBlur={shadowBlur}
                        shadowY={shadowY}
                        activeGlow={activeGlow}
                        glowColor={glowColor}
                        onSelect={setActive}
                        mode={interaction}
                    />
                ))}
            </div>

            {showDots && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 18,
                        left: 0,
                        right: 0,
                        display: "flex",
                        justifyContent: "center",
                        gap: 8,
                        zIndex: 2000,
                    }}
                >
                    {sourceImages.map((_, i) => (
                        <div
                            key={i}
                            onClick={() =>
                                (interaction === "click" ||
                                    interaction === "hover") &&
                                setActive(i)
                            }
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: 999,
                                background:
                                    i === displayIndex
                                        ? dotActiveColor
                                        : dotColor,
                                cursor:
                                    interaction === "click" ||
                                    interaction === "hover"
                                        ? "pointer"
                                        : "default",
                                transition: "background 150ms ease",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

CoverFlowGallery.displayName = "Cover Flow Gallery"

// ---------------------------------------------------------------------------
// Property Controls
// ---------------------------------------------------------------------------

addPropertyControls(CoverFlowGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        defaultValue: [],
        maxCount: 20,
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 40,
                max: 1000,
                step: 1,
                defaultValue: 260,
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Card Height",
                min: 40,
                max: 1200,
                step: 1,
                defaultValue: 330,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: -200,
                max: 200,
                step: 1,
                defaultValue: 94,
            },
            radius: {
                type: ControlType.Number,
                title: "Corner Radius",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: 0,
            },
        },
    } as any,

    depth: {
        type: ControlType.Object,
        title: "3D Depth",
        controls: {
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                min: 200,
                max: 4000,
                step: 10,
                defaultValue: 1200,
            },
            rotation: {
                type: ControlType.Number,
                title: "Fold Angle",
                min: 0,
                max: 90,
                step: 1,
                defaultValue: 45,
                description:
                    "Rotation (deg) applied per card away from the active one",
            },
            curve: {
                type: ControlType.Number,
                title: "Arc Curve",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 0,
                description: "Vertical drop for cards away from center",
            },
            scaleFalloff: {
                type: ControlType.Number,
                title: "Scale Reach",
                min: 1,
                max: 12,
                step: 0.5,
                defaultValue: 4,
                description: "Cards needed to reach Min Scale",
            },
            minScale: {
                type: ControlType.Number,
                title: "Min Scale",
                min: 0.2,
                max: 1,
                step: 0.01,
                defaultValue: 0.56,
            },
            opacityFalloff: {
                type: ControlType.Number,
                title: "Fade Reach",
                min: 1,
                max: 12,
                step: 0.5,
                defaultValue: 6,
                description: "Cards needed to reach Min Opacity",
            },
            minOpacity: {
                type: ControlType.Number,
                title: "Min Opacity",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 1,
            },
            brightnessFalloff: {
                type: ControlType.Number,
                title: "Dim Amount",
                min: 0,
                max: 0.3,
                step: 0.01,
                defaultValue: 0.09,
                description: "Darkening applied per card away from center",
            },
        },
    } as any,

    motionSettings: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            interaction: {
                type: ControlType.Enum,
                title: "Interaction",
                options: ["drag", "hover", "click", "autoplay", "manual"],
                optionTitles: [
                    "Drag",
                    "Hover Card",
                    "Click Card",
                    "Autoplay",
                    "Manual (Active Index)",
                ],
                defaultValue: "drag",
            },
            activeIndex: {
                type: ControlType.Number,
                title: "Active Index",
                min: 0,
                max: 30,
                step: 1,
                defaultValue: 4,
                hidden: (p: any) => p.interaction !== "manual",
            },
            dragSensitivity: {
                type: ControlType.Number,
                title: "Drag Sensitivity",
                min: 0.2,
                max: 3,
                step: 0.1,
                defaultValue: 1,
                description:
                    "How far you need to drag to move one card forward",
                hidden: (p: any) => p.interaction !== "drag",
            },
            autoplaySpeed: {
                type: ControlType.Number,
                title: "Autoplay Speed",
                min: 300,
                max: 6000,
                step: 100,
                defaultValue: 1600,
                unit: "ms",
                hidden: (p: any) => p.interaction !== "autoplay",
            },
            autoplayDirection: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["Forward", "Backward"],
                defaultValue: "Forward",
                hidden: (p: any) => p.interaction !== "autoplay",
            },
            springPreset: {
                type: ControlType.Enum,
                title: "Bounce",
                options: ["Gentle", "Snappy", "Bouncy", "Stiff", "Custom"],
                defaultValue: "Bouncy",
            },
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                min: 20,
                max: 800,
                step: 5,
                defaultValue: 220,
                hidden: (p: any) => p.springPreset !== "Custom",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                min: 2,
                max: 80,
                step: 1,
                defaultValue: 18,
                hidden: (p: any) => p.springPreset !== "Custom",
            },
            mass: {
                type: ControlType.Number,
                title: "Mass",
                min: 0.1,
                max: 5,
                step: 0.1,
                defaultValue: 1,
                hidden: (p: any) => p.springPreset !== "Custom",
            },
        },
    } as any,

    styleSettings: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#dedede",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                min: 0,
                max: 20,
                step: 1,
                defaultValue: 0,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border Color",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => p.borderWidth === 0,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: true,
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow Color",
                defaultValue: "rgba(0,0,0,0.55)",
                hidden: (p: any) => !p.shadow,
            },
            shadowBlur: {
                type: ControlType.Number,
                title: "Shadow Blur",
                min: 0,
                max: 120,
                step: 1,
                defaultValue: 40,
                hidden: (p: any) => !p.shadow,
            },
            shadowY: {
                type: ControlType.Number,
                title: "Shadow Y",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: 18,
                hidden: (p: any) => !p.shadow,
            },
            activeGlow: {
                type: ControlType.Boolean,
                title: "Active Glow",
                defaultValue: false,
            },
            glowColor: {
                type: ControlType.Color,
                title: "Glow Color",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => !p.activeGlow,
            },
        },
    } as any,

    indicators: {
        type: ControlType.Object,
        title: "Dots",
        controls: {
            showDots: {
                type: ControlType.Boolean,
                title: "Show Dots",
                defaultValue: false,
            },
            dotColor: {
                type: ControlType.Color,
                title: "Dot Color",
                defaultValue: "rgba(255,255,255,0.35)",
                hidden: (p: any) => !p.showDots,
            },
            dotActiveColor: {
                type: ControlType.Color,
                title: "Active Dot",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => !p.showDots,
            },
        },
    } as any,
})
