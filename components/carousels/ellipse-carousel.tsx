// Built using Hyperiux Vault: https://vault.hyperiux.com
import * as React from "react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { gsap } from "gsap"

type ImageValue = string | { src?: string; alt?: string } | undefined
type ItemInput = {
    image?: ImageValue
    alt?: string
    title?: string
    subtitle?: string
    bgColor?: string
    textColor?: string
}
type Item = { src?: string; alt: string; title: string; subtitle: string; bgColor?: string; textColor?: string }

// No bundled images: until items are added, the ring mixes text tiles and
// placeholders.
const DEFAULT_ITEMS: Item[] = [
    { alt: "Ellipse", title: "Ellipse", subtitle: "", bgColor: "#f5f5f2", textColor: "#111111" },
    { alt: "Card 2", title: "", subtitle: "" },
    { alt: "Card 3", title: "", subtitle: "" },
    { alt: "Add images", title: "Add", subtitle: "Images", bgColor: "#ffffff", textColor: "#111111" },
    { alt: "Card 5", title: "", subtitle: "" },
    { alt: "Drag", title: "Drag", subtitle: "Or wait", bgColor: "#0a0a0a", textColor: "#ffffff" },
    { alt: "Card 7", title: "", subtitle: "" },
    { alt: "Loop", title: "Loop", subtitle: "", bgColor: "#f2c94c", textColor: "#111111" },
    { alt: "Card 9", title: "", subtitle: "" },
    { alt: "Card 10", title: "", subtitle: "" },
    { alt: "Ring", title: "Ring", subtitle: "", bgColor: "#dd4b39", textColor: "#ffffff" },
    { alt: "Card 12", title: "", subtitle: "" },
]

// Shown in place of any item without an image or a title.
const PLACEHOLDER_GRADIENTS = [
    "linear-gradient(135deg, #ff5f00 0%, #1c1c1c 100%)",
    "linear-gradient(135deg, #4f46e5 0%, #111827 100%)",
    "linear-gradient(135deg, #0ea5e9 0%, #0f172a 100%)",
    "linear-gradient(135deg, #db2777 0%, #1c1c1c 100%)",
    "linear-gradient(135deg, #10b981 0%, #0b0b0b 100%)",
    "linear-gradient(135deg, #a3a3a3 0%, #262626 100%)",
]

type PlaceholderStyle = "gradient" | "solid"

function placeholderBackground(style: PlaceholderStyle, color: string, index: number) {
    return style === "solid" ? color : PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
}

function normalizeItems(input?: ItemInput[]): Item[] {
    if (!Array.isArray(input) || input.length === 0) return DEFAULT_ITEMS
    return input.map((it, i) => {
        const img = it?.image
        const src = typeof img === "string" ? img : img?.src
        const title = it?.title ?? ""
        const alt = it?.alt || (typeof img === "object" && img?.alt) || title || `Card ${i + 1}`
        return { src: src || undefined, alt, title, subtitle: it?.subtitle ?? "", bgColor: it?.bgColor, textColor: it?.textColor }
    })
}

// Image, else a coloured text tile when the item has a title, else a placeholder.
function CardFace({
    item,
    index,
    placeholder,
    placeholderColor,
}: {
    item: Item
    index: number
    placeholder: PlaceholderStyle
    placeholderColor: string
}) {
    if (item.src) return <img src={item.src} alt={item.alt} draggable={false} className="hpx-elc-media" />
    if (item.title || item.subtitle) {
        return (
            <div
                className="hpx-elc-tile"
                style={{ backgroundColor: item.bgColor ?? "#111111", color: item.textColor ?? "#ffffff" }}
            >
                {item.title ? <span className="hpx-elc-tile-title">{item.title}</span> : null}
                {item.subtitle ? <span className="hpx-elc-tile-sub">{item.subtitle}</span> : null}
            </div>
        )
    }
    return (
        <div
            role="img"
            aria-label={item.alt}
            className="hpx-elc-media"
            style={{ background: placeholderBackground(placeholder, placeholderColor, index) }}
        />
    )
}

const MOBILE_BREAKPOINT = 768
const MOBILE_RADIUS_X_SCALE = 1.45
const MOBILE_RADIUS_Y_SCALE = 0.82
const MOBILE_CARD_SCALE = 0.75

type Geometry = { cx: number; cy: number; radiusX: number; radiusY: number; cardW: number; cardH: number }

// Card i sits at angle i*step + rotation on the ellipse; it is largest at
// the right-hand vertex (cos = 1) and shrinks to minScale on the left.
function cardPose(i: number, total: number, rotation: number, minScale: number) {
    const theta = (i * (Math.PI * 2)) / total + rotation
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)
    const scale = minScale + (1 - minScale) * ((cos + 1) / 2)
    return { cos, sin, scale }
}

function usePrefersReducedMotion() {
    const [reduce, setReduce] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)")
        if (!mq) return
        const sync = () => setReduce(mq.matches)
        sync()
        mq.addEventListener("change", sync)
        return () => mq.removeEventListener("change", sync)
    }, [])
    return reduce
}

// True while the element is near the viewport and the tab is visible.
function useActive(ref: React.RefObject<HTMLElement>, enabled: boolean) {
    const [inView, setInView] = useState(true)
    const [tabVisible, setTabVisible] = useState(true)
    useEffect(() => {
        if (!enabled) return
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { rootMargin: "256px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [enabled])
    useEffect(() => {
        if (!enabled) return
        const sync = () => setTabVisible(!document.hidden)
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [enabled])
    return inView && tabVisible
}

const STYLE_ID = "hpx-ellipse-carousel-styles"
const CSS = `
.hpx-elc-root { position: relative; width: 100%; height: 100%; overflow: hidden; user-select: none; -webkit-user-select: none; container-type: inline-size; font-family: inherit; }
.hpx-elc-stage { position: absolute; inset: 0; outline: none; touch-action: pan-y; }
.hpx-elc-stage[data-draggable="true"] { cursor: grab; }
.hpx-elc-label { position: absolute; inset: 0; z-index: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.hpx-elc-label span { font-size: max(20px, 3.4cqw); font-weight: 500; letter-spacing: -0.02em; }
.hpx-elc-card { position: absolute; left: 0; top: 0; overflow: hidden; border-radius: var(--hpx-elc-radius); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); will-change: transform; }
.hpx-elc-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; -webkit-user-drag: none; }
.hpx-elc-tile { display: flex; width: 100%; height: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 12px; box-sizing: border-box; text-align: center; overflow: hidden; }
.hpx-elc-tile-title { font-size: 24px; font-weight: 900; line-height: 1; }
.hpx-elc-tile-sub { font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.7; }
`

function injectStyles() {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return
    const el = document.createElement("style")
    el.id = STYLE_ID
    el.textContent = CSS
    document.head.appendChild(el)
}

interface Props {
    items?: ItemInput[]
    backgroundColor?: string
    centerLabel?: string
    labelColor?: string
    showCenterLabel?: boolean
    cardWidth?: number
    cardHeight?: number
    cardRadius?: number
    minScale?: number
    radiusXRatio?: number
    radiusYRatio?: number
    autoPlay?: boolean
    holdDuration?: number
    stepDuration?: number
    stepEase?: string
    pauseOnHover?: boolean
    draggable?: boolean
    dragSensitivity?: number
    placeholder?: PlaceholderStyle
    placeholderColor?: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 */
export default function HyperiuxEllipseCarousel({
    items: itemsInput,
    backgroundColor = "#eeeeee",
    centerLabel = "Ellipse Carousel",
    labelColor = "rgba(0, 0, 0, 0.9)",
    showCenterLabel = true,
    cardWidth = 130,
    cardHeight = 180,
    cardRadius = 0,
    minScale = 0.2,
    radiusXRatio = 0.25,
    radiusYRatio = 0.36,
    autoPlay = true,
    holdDuration = 1,
    stepDuration = 0.7,
    stepEase = "power2.inOut",
    pauseOnHover = true,
    draggable = true,
    dragSensitivity = 1,
    placeholder = "gradient",
    placeholderColor = "#2e2e2e",
    style,
}: Props) {
    injectStyles()
    const items = useMemo(() => normalizeItems(itemsInput), [itemsInput])
    const total = items.length
    const isStatic = useIsStaticRenderer()
    const reduce = usePrefersReducedMotion()

    const rootRef = useRef<HTMLElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const rotationRef = useRef(0)
    const hoverCountRef = useRef(0)
    const draggingRef = useRef(false)
    const lastAngleRef = useRef(0)
    const originRef = useRef({ left: 0, top: 0 })
    const settleRef = useRef<gsap.core.Tween | null>(null)
    const stepRef = useRef<gsap.core.Tween | null>(null)
    const delayRef = useRef<gsap.core.Tween | null>(null)
    const geometryRef = useRef<Geometry>({ cx: 0, cy: 0, radiusX: 320, radiusY: 260, cardW: cardWidth, cardH: cardHeight })
    const active = useActive(rootRef, !isStatic)

    // Geometry comes from the stage's own size, not the window.
    const measure = useCallback(() => {
        const stage = stageRef.current
        if (!stage) return
        const width = stage.offsetWidth
        const height = stage.offsetHeight
        const mobile = width < MOBILE_BREAKPOINT
        const cardScale = mobile ? MOBILE_CARD_SCALE : 1
        geometryRef.current = {
            cx: width / 2,
            cy: height / 2,
            radiusX: width * radiusXRatio * (mobile ? MOBILE_RADIUS_X_SCALE : 1),
            radiusY: height * radiusYRatio * (mobile ? MOBILE_RADIUS_Y_SCALE : 1),
            cardW: cardWidth * cardScale,
            cardH: cardHeight * cardScale,
        }
    }, [cardHeight, cardWidth, radiusXRatio, radiusYRatio])

    const render = useCallback(() => {
        if (!total) return
        const { cx, cy, radiusX, radiusY, cardW, cardH } = geometryRef.current
        for (let i = 0; i < total; i += 1) {
            const card = cardRefs.current[i]
            if (!card) continue
            const { cos, sin, scale } = cardPose(i, total, rotationRef.current, minScale)
            const w = cardW * scale
            const h = cardH * scale
            card.style.width = `${w}px`
            card.style.height = `${h}px`
            card.style.transform = `translate3d(${cx + radiusX * cos - w / 2}px, ${cy + radiusY * sin - h / 2}px, 0)`
            card.style.zIndex = `${Math.round(scale * 1000)}`
        }
    }, [minScale, total])

    useLayoutEffect(() => {
        if (isStatic) return
        const update = () => {
            measure()
            render()
        }
        update()
        const stage = stageRef.current
        if (!stage || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(stage)
        return () => ro.disconnect()
    }, [isStatic, measure, render])

    const stopAutoplay = useCallback(() => {
        delayRef.current?.kill()
        stepRef.current?.kill()
        delayRef.current = null
        stepRef.current = null
    }, [])

    // Autoplay: hold, then step one card; repeats while on screen and the
    // tab is visible. Holds in place while dragging or hovered.
    const scheduleNextStep = useCallback(() => {
        if (!autoPlay || reduce || !total || !active) return
        delayRef.current = gsap.delayedCall(holdDuration, () => {
            if (draggingRef.current || (pauseOnHover && hoverCountRef.current > 0)) {
                scheduleNextStep()
                return
            }
            const step = (Math.PI * 2) / total
            const state = { r: rotationRef.current }
            stepRef.current = gsap.to(state, {
                r: state.r - step,
                duration: stepDuration,
                ease: stepEase,
                onUpdate: () => {
                    rotationRef.current = state.r
                    render()
                },
                onComplete: scheduleNextStep,
            })
        })
    }, [active, autoPlay, holdDuration, pauseOnHover, reduce, render, stepDuration, stepEase, total])

    useEffect(() => {
        if (isStatic) return
        scheduleNextStep()
        return () => stopAutoplay()
    }, [isStatic, scheduleNextStep, stopAutoplay])

    // Drag around the ellipse - all listeners on the stage element.
    useEffect(() => {
        if (isStatic) return
        const stage = stageRef.current
        if (!stage || !draggable || !total) return

        const pointerAngle = (e: PointerEvent) => {
            const { cx, cy, radiusX, radiusY } = geometryRef.current
            const localX = e.clientX - originRef.current.left
            const localY = e.clientY - originRef.current.top
            return Math.atan2((localY - cy) / radiusY, (localX - cx) / radiusX)
        }

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0 && e.pointerType === "mouse") return
            stopAutoplay()
            settleRef.current?.kill()
            settleRef.current = null
            draggingRef.current = true
            const rect = stage.getBoundingClientRect()
            originRef.current = { left: rect.left, top: rect.top }
            lastAngleRef.current = pointerAngle(e)
            try {
                stage.setPointerCapture(e.pointerId)
            } catch {}
            stage.style.cursor = "grabbing"
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!draggingRef.current) return
            const angle = pointerAngle(e)
            let delta = angle - lastAngleRef.current
            delta = ((((delta + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI
            lastAngleRef.current = angle
            rotationRef.current += delta * dragSensitivity
            render()
        }

        const endDrag = (e: PointerEvent) => {
            if (!draggingRef.current) return
            draggingRef.current = false
            stage.style.cursor = ""
            if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId)
            const step = (Math.PI * 2) / total
            const target = Math.round(rotationRef.current / step) * step
            if (reduce) {
                rotationRef.current = target
                render()
                scheduleNextStep()
                return
            }
            const state = { r: rotationRef.current }
            settleRef.current = gsap.to(state, {
                r: target,
                duration: 0.5,
                ease: "power3.out",
                onUpdate: () => {
                    rotationRef.current = state.r
                    render()
                },
                onComplete: () => {
                    settleRef.current = null
                    scheduleNextStep()
                },
            })
        }

        stage.addEventListener("pointerdown", onPointerDown)
        stage.addEventListener("pointermove", onPointerMove)
        stage.addEventListener("pointerup", endDrag)
        stage.addEventListener("pointercancel", endDrag)
        return () => {
            stage.removeEventListener("pointerdown", onPointerDown)
            stage.removeEventListener("pointermove", onPointerMove)
            stage.removeEventListener("pointerup", endDrag)
            stage.removeEventListener("pointercancel", endDrag)
            settleRef.current?.kill()
        }
    }, [isStatic, dragSensitivity, draggable, reduce, render, scheduleNextStep, stopAutoplay, total])

    const onCardEnter = useCallback(() => {
        hoverCountRef.current += 1
    }, [])
    const onCardLeave = useCallback(() => {
        hoverCountRef.current = Math.max(0, hoverCountRef.current - 1)
    }, [])

    const rootStyle = {
        backgroundColor,
        ["--hpx-elc-radius" as any]: `${cardRadius}px`,
        ...style,
    } as React.CSSProperties

    const label =
        showCenterLabel && centerLabel ? (
            <div className="hpx-elc-label">
                <span style={{ color: labelColor }}>{centerLabel}</span>
            </div>
        ) : null

    if (!total) return null

    // Static renderer (canvas / export): the ellipse at rest. Positions are
    // percentages of the frame (the radii are ratios of width and height),
    // so it lays out correctly at any size with no measuring and no JS.
    if (isStatic) {
        return (
            <section className="hpx-elc-root" style={rootStyle}>
                <div className="hpx-elc-stage">
                    {label}
                    {items.map((item, i) => {
                        const { cos, sin, scale } = cardPose(i, total, 0, minScale)
                        return (
                            <div
                                key={i}
                                className="hpx-elc-card"
                                style={{
                                    width: cardWidth * scale,
                                    height: cardHeight * scale,
                                    left: `${50 + radiusXRatio * 100 * cos}%`,
                                    top: `${50 + radiusYRatio * 100 * sin}%`,
                                    transform: "translate(-50%, -50%)",
                                    zIndex: Math.round(scale * 1000),
                                }}
                            >
                                <CardFace item={item} index={i} placeholder={placeholder} placeholderColor={placeholderColor} />
                            </div>
                        )
                    })}
                </div>
            </section>
        )
    }

    return (
        <section ref={rootRef} className="hpx-elc-root" style={rootStyle}>
            <div
                ref={stageRef}
                tabIndex={0}
                role="region"
                aria-label="Ellipse card carousel"
                className="hpx-elc-stage"
                data-draggable={draggable ? "true" : "false"}
            >
                {label}
                {items.map((item, i) => (
                    <div
                        key={i}
                        ref={(el) => {
                            cardRefs.current[i] = el
                        }}
                        className="hpx-elc-card"
                        onPointerEnter={onCardEnter}
                        onPointerLeave={onCardLeave}
                    >
                        <CardFace item={item} index={i} placeholder={placeholder} placeholderColor={placeholderColor} />
                    </div>
                ))}
            </div>
        </section>
    )
}

HyperiuxEllipseCarousel.displayName = "Hyperiux Ellipse Carousel"

addPropertyControls(HyperiuxEllipseCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 30,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", description: "Used as a text tile when there's no image." },
                subtitle: { type: ControlType.String, title: "Subtitle" },
                bgColor: { type: ControlType.Color, title: "Tile Fill", defaultValue: "#111111" },
                textColor: { type: ControlType.Color, title: "Tile Text", defaultValue: "#ffffff" },
            },
        },
    },
    showCenterLabel: { type: ControlType.Boolean, title: "Label", defaultValue: true },
    centerLabel: {
        type: ControlType.String,
        title: "Label Text",
        defaultValue: "Ellipse Carousel",
        hidden: (p: Props) => !p.showCenterLabel,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "rgba(0, 0, 0, 0.9)",
        hidden: (p: Props) => !p.showCenterLabel,
    },
    cardWidth: { type: ControlType.Number, title: "Card Width", min: 40, max: 500, unit: "px", defaultValue: 130 },
    cardHeight: { type: ControlType.Number, title: "Card Height", min: 40, max: 700, unit: "px", defaultValue: 180 },
    cardRadius: { type: ControlType.Number, title: "Radius", min: 0, max: 60, unit: "px", defaultValue: 0 },
    minScale: { type: ControlType.Number, title: "Far Scale", min: 0.05, max: 1, step: 0.05, defaultValue: 0.2 },
    radiusXRatio: { type: ControlType.Number, title: "Width", min: 0.05, max: 0.5, step: 0.01, defaultValue: 0.25 },
    radiusYRatio: { type: ControlType.Number, title: "Height", min: 0.05, max: 0.5, step: 0.01, defaultValue: 0.36 },
    autoPlay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: true },
    holdDuration: {
        type: ControlType.Number,
        title: "Hold",
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
        defaultValue: 1,
        hidden: (p: Props) => !p.autoPlay,
    },
    stepDuration: {
        type: ControlType.Number,
        title: "Step",
        min: 0.1,
        max: 3,
        step: 0.05,
        unit: "s",
        defaultValue: 0.7,
        hidden: (p: Props) => !p.autoPlay,
    },
    stepEase: {
        type: ControlType.Enum,
        title: "Step Ease",
        options: ["power2.inOut", "power3.inOut", "expo.inOut", "sine.inOut", "back.inOut(1.4)"],
        optionTitles: ["Power 2", "Power 3", "Expo", "Sine", "Back"],
        defaultValue: "power2.inOut",
        hidden: (p: Props) => !p.autoPlay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Hover Pause",
        defaultValue: true,
        hidden: (p: Props) => !p.autoPlay,
    },
    draggable: { type: ControlType.Boolean, title: "Draggable", defaultValue: true },
    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Speed",
        min: 0.2,
        max: 3,
        step: 0.1,
        defaultValue: 1,
        hidden: (p: Props) => !p.draggable,
    },
    backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#eeeeee" },
    placeholder: {
        type: ControlType.Enum,
        title: "Placeholder",
        options: ["gradient", "solid"],
        optionTitles: ["Gradient", "Solid"],
        defaultValue: "gradient",
        displaySegmentedControl: true,
        description: "Shown for items with no image and no title.",
    },
    placeholderColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#2e2e2e",
        hidden: (p: Props) => p.placeholder !== "solid",
    },
})
