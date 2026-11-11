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
type ItemInput = { image?: ImageValue; title?: string; description?: string }
type Item = { src?: string; alt: string; title: string; description: string }

// No bundled images: until items are added, every card is a placeholder.
const DEFAULT_ITEMS: Item[] = Array.from({ length: 8 }, (_, i) => ({
    alt: `Placeholder ${i + 1}`,
    title: `Card ${String(i + 1).padStart(2, "0")}`,
    description: "Add an image, title and description in Items.",
}))

// Shown in place of any item without an image.
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

function Media({
    src,
    alt,
    index,
    placeholder,
    placeholderColor,
    className,
}: {
    src?: string
    alt: string
    index: number
    placeholder: PlaceholderStyle
    placeholderColor: string
    className?: string
}) {
    if (src) return <img src={src} alt={alt} draggable={false} className={className} />
    return (
        <div
            role="img"
            aria-label={alt}
            className={className}
            style={{ width: "100%", height: "100%", background: placeholderBackground(placeholder, placeholderColor, index) }}
        />
    )
}

function normalizeItems(input?: ItemInput[]): Item[] {
    if (!Array.isArray(input) || input.length === 0) return DEFAULT_ITEMS
    const out: Item[] = []
    for (const it of input) {
        const img = it?.image
        const src = typeof img === "string" ? img : img?.src
        const alt = (typeof img === "object" && img?.alt) || it?.title || `Item ${out.length + 1}`
        out.push({ src: src || undefined, alt, title: it?.title ?? "", description: it?.description ?? "" })
    }
    return out.length ? out : DEFAULT_ITEMS
}

const DRAG_SMOOTHING = 14
const VELOCITY_WINDOW = 90
const MAX_FLICK = 9
const STAGGER_LAG_STRENGTH = 0.85
const MIN_FOLLOW_FRACTION = 0.6
// Reference frame for the static (canvas / export) render.
const STATIC_W = 1440
const STATIC_H = 900

const clamp = (min: number, max: number, v: number) => Math.min(max, Math.max(min, v))
const snapTo = (step: number, v: number) => Math.round(v / step) * step

type Geometry = {
    minCardWidth: number
    maxCardWidth: number
    cardRatio: number
    cardAspect: number
    radiusRatio: number
    overlap: number
    arcOffset: number
}

function computeLayout(width: number, height: number, g: Geometry) {
    const cardWidth = clamp(g.minCardWidth, g.maxCardWidth, width * g.cardRatio)
    const cardHeight = cardWidth / g.cardAspect
    const radius = Math.max(width * g.radiusRatio, cardWidth * 4.2)
    const step = (cardWidth * (1 - clamp(-0.5, 0.85, g.overlap))) / radius
    const centerX = width / 2
    const centerY = height * g.arcOffset + radius
    const discRadius = radius - cardHeight * 0.66
    const reach = Math.min(1, (width / 2 + cardWidth * 1.2) / radius)
    const maxAngle = Math.asin(reach) + 0.12
    return { radius, cardWidth, cardHeight, step, centerX, centerY, discRadius, maxAngle }
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

const STYLE_ID = "hpx-arc-flow-carousel-styles"
const CSS = `
.hpx-afc-root { position: relative; width: 100%; height: 100%; overflow: hidden; user-select: none; -webkit-user-select: none; container-type: inline-size; font-family: inherit; }
.hpx-afc-stage { position: absolute; inset: 0; cursor: grab; outline: none; touch-action: pan-y; }
.hpx-afc-disc { position: absolute; border-radius: 50%; transform: translateX(-50%); pointer-events: none; }
.hpx-afc-card { position: absolute; top: 0; left: 0; will-change: transform; }
.hpx-afc-inner { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: var(--hpx-afc-radius); background: rgba(0,0,0,0.05); box-shadow: 0 18px 40px -12px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.15); }
.hpx-afc-inner img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; -webkit-user-drag: none; }
.hpx-afc-shade { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 0.3s ease-out; background: linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.16) 45%, rgba(0,0,0,0.62) 100%); }
.hpx-afc-caption { position: absolute; left: 0; right: 0; bottom: 0; padding: 16px; color: #fff; pointer-events: none; opacity: 0; transform: translateY(16px); transition: opacity 0.3s ease-out, transform 0.3s ease-out; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 35%, rgba(0,0,0,0.26) 100%); }
.hpx-afc-card:hover .hpx-afc-shade, .hpx-afc-reduce .hpx-afc-shade { opacity: 1; }
.hpx-afc-card:hover .hpx-afc-caption, .hpx-afc-reduce .hpx-afc-caption { opacity: 1; transform: translateY(0); }
.hpx-afc-title { margin: 0; font-size: max(12px, 1.4cqw); font-weight: 500; text-transform: uppercase; color: rgba(255,255,255,0.95); }
.hpx-afc-desc { margin: 8px 0 0; max-width: 22ch; font-size: max(11px, 1.1cqw); line-height: 1.1; color: rgba(255,255,255,0.75); }
`

function injectStyles() {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return
    const el = document.createElement("style")
    el.id = STYLE_ID
    el.textContent = CSS
    document.head.appendChild(el)
}

function CardContent({
    item,
    index,
    showCaptions,
    placeholder,
    placeholderColor,
}: {
    item: Item
    index: number
    showCaptions: boolean
    placeholder: PlaceholderStyle
    placeholderColor: string
}) {
    const hasCaption = showCaptions && (item.title || item.description)
    return (
        <>
            <Media src={item.src} alt={item.alt} index={index} placeholder={placeholder} placeholderColor={placeholderColor} />
            {hasCaption ? <div className="hpx-afc-shade" /> : null}
            {hasCaption ? (
                <div className="hpx-afc-caption">
                    {item.title ? <p className="hpx-afc-title">{item.title}</p> : null}
                    {item.description ? <p className="hpx-afc-desc">{item.description}</p> : null}
                </div>
            ) : null}
        </>
    )
}

interface Props {
    items?: ItemInput[]
    radiusRatio?: number
    cardRatio?: number
    minCardWidth?: number
    maxCardWidth?: number
    cardAspect?: number
    overlap?: number
    arcOffset?: number
    cardRadius?: number
    smoothing?: number
    dragSensitivity?: number
    momentum?: number
    snap?: boolean
    wheelControl?: "horizontal" | "both" | "off"
    autoRotateSpeed?: number
    pauseOnHover?: boolean
    showCaptions?: boolean
    surfaceColor?: string
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
export default function HyperiuxArcFlowCarousel({
    items: itemsInput,
    radiusRatio = 0.85,
    cardRatio = 0.21,
    minCardWidth = 150,
    maxCardWidth = 320,
    cardAspect = 0.62,
    overlap = -0.04,
    arcOffset = 0.5,
    cardRadius = 10,
    smoothing = 5.5,
    dragSensitivity = 1.2,
    momentum = 1,
    snap = false,
    wheelControl = "horizontal",
    autoRotateSpeed = 0,
    pauseOnHover = true,
    showCaptions = true,
    surfaceColor = "#000000",
    placeholder = "gradient",
    placeholderColor = "#2e2e2e",
    style,
}: Props) {
    injectStyles()
    const items = useMemo(() => normalizeItems(itemsInput), [itemsInput])
    const total = items.length
    const isStatic = useIsStaticRenderer()
    const reduceMotion = usePrefersReducedMotion()

    const rootRef = useRef<HTMLElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const discRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const innerRefs = useRef<(HTMLDivElement | null)[]>([])
    const active = useActive(rootRef, !isStatic)

    const geometry: Geometry = { minCardWidth, maxCardWidth, cardRatio, cardAspect, radiusRatio, overlap, arcOffset }

    const [slotCount, setSlotCount] = useState(() => Math.max(total, 12))
    const layoutRef = useRef({ radius: 900, cardWidth: 220, cardHeight: 330, step: 0.14, centerX: 0, centerY: 0, maxAngle: 1 })
    const currentRef = useRef(0)
    const targetRef = useRef(0)
    const slotOffsetsRef = useRef<number[]>([])
    const draggingRef = useRef(false)
    const pointerIdRef = useRef<number | null>(null)
    const lastXRef = useRef(0)
    const samplesRef = useRef<{ t: number; value: number }[]>([])
    const revealRef = useRef(0)
    const revealStartRef = useRef(0)
    const wheelSettleRef = useRef(0)
    const hoveredRef = useRef(false)

    const measure = useCallback(() => {
        const stage = stageRef.current
        if (!stage || !total) return
        const l = computeLayout(stage.offsetWidth, stage.offsetHeight, geometry)
        layoutRef.current = l
        const disc = discRef.current
        if (disc) {
            disc.style.width = `${l.discRadius * 2}px`
            disc.style.height = `${l.discRadius * 2}px`
            disc.style.left = `${l.centerX}px`
            disc.style.top = `${l.centerY - l.discRadius}px`
        }
        const needed = Math.ceil((l.maxAngle * 2) / l.step) + 2
        setSlotCount((prev) => {
            const next = Math.max(total, Math.ceil(needed / total) * total)
            return next === prev ? prev : next
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [arcOffset, cardAspect, cardRatio, maxCardWidth, minCardWidth, overlap, radiusRatio, total])

    useLayoutEffect(() => {
        if (isStatic) return
        measure()
        const stage = stageRef.current
        if (!stage) return
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure)
            return () => window.removeEventListener("resize", measure)
        }
        const ro = new ResizeObserver(measure)
        ro.observe(stage)
        return () => ro.disconnect()
    }, [isStatic, measure])

    // Render loop. One frame is always painted; the ticker itself only runs
    // while the carousel is on screen and the tab is visible.
    useEffect(() => {
        if (isStatic || !total) return
        if (reduceMotion) revealRef.current = 1

        const draw = (dt: number) => {
            const { radius, cardWidth, cardHeight, step, centerX, centerY, maxAngle } = layoutRef.current
            const span = slotCount * step
            const half = span / 2
            const reveal = revealRef.current
            const rate = draggingRef.current || reduceMotion ? DRAG_SMOOTHING : smoothing
            const offsets = slotOffsetsRef.current
            if (offsets.length !== slotCount) {
                offsets.length = slotCount
                offsets.fill(currentRef.current)
            }

            for (let i = 0; i < slotCount; i += 1) {
                const card = cardRefs.current[i]
                if (!card) continue

                if (reduceMotion) {
                    offsets[i] = currentRef.current
                } else {
                    // Cards further from the active one follow with more lag,
                    // so motion ripples outward instead of moving as one piece.
                    let rank = (i * step - offsets[i]) % span
                    if (rank < -half) rank += span
                    else if (rank >= half) rank -= span
                    const distance = clamp(0, 1, Math.abs(rank) / maxAngle)
                    const followRate = Math.max(rate * (1 - distance * STAGGER_LAG_STRENGTH), rate * MIN_FOLLOW_FRACTION)
                    offsets[i] += (currentRef.current - offsets[i]) * (1 - Math.exp(-followRate * dt))
                }

                let angle = (i * step - offsets[i]) % span
                if (angle < -half) angle += span
                else if (angle >= half) angle -= span

                if (Math.abs(angle) > maxAngle) {
                    if (card.style.visibility !== "hidden") card.style.visibility = "hidden"
                    continue
                }
                if (card.style.visibility === "hidden") card.style.visibility = "visible"

                const x = centerX + radius * Math.sin(angle) - cardWidth / 2
                const y = centerY - radius * Math.cos(angle) - cardHeight / 2
                card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}rad)`
                card.style.width = `${cardWidth}px`
                card.style.height = `${cardHeight}px`
                card.style.zIndex = `${Math.round((angle + half) * 1000)}`

                const inner = innerRefs.current[i]
                if (inner && reveal < 1) {
                    // Staggered entrance, outward from the middle of the fan.
                    const delay = Math.min(1, Math.abs(angle) / maxAngle) * 0.45
                    const p = clamp(0, 1, (reveal - delay) / (1 - delay || 1))
                    const eased = 1 - Math.pow(1 - p, 3)
                    inner.style.opacity = `${eased}`
                    inner.style.transform = `translate3d(0, ${(1 - eased) * cardHeight * 0.35}px, 0)`
                } else if (inner && inner.style.opacity !== "1") {
                    inner.style.opacity = "1"
                    inner.style.transform = "translate3d(0, 0, 0)"
                }
            }
        }

        const tick = (_time: number, deltaTime: number) => {
            const dt = Math.min(deltaTime, 50) / 1000
            const rate = draggingRef.current || reduceMotion ? DRAG_SMOOTHING : smoothing
            const delta = targetRef.current - currentRef.current
            currentRef.current += delta * (1 - Math.exp(-rate * dt))
            if (Math.abs(delta) < 0.00002) currentRef.current = targetRef.current

            if (revealRef.current < 1) {
                const now = performance.now()
                if (!revealStartRef.current) revealStartRef.current = now
                revealRef.current = Math.min(1, (now - revealStartRef.current) / 1100)
            }

            if (autoRotateSpeed && !reduceMotion && !draggingRef.current && !(pauseOnHover && hoveredRef.current)) {
                targetRef.current += autoRotateSpeed * dt
            }
            draw(dt)
        }

        draw(1)
        if (!active) return
        gsap.ticker.add(tick)
        return () => gsap.ticker.remove(tick)
    }, [isStatic, active, autoRotateSpeed, pauseOnHover, reduceMotion, slotCount, smoothing, total])

    // Pointer drag, flick, wheel and arrow keys - all bound to the stage element.
    useEffect(() => {
        if (isStatic) return
        const stage = stageRef.current
        if (!stage || !total) return

        const pushSample = () => {
            const now = performance.now()
            const samples = samplesRef.current
            samples.push({ t: now, value: targetRef.current })
            while (samples.length > 2 && now - samples[0].t > VELOCITY_WINDOW) samples.shift()
        }

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0 && e.pointerType === "mouse") return
            draggingRef.current = true
            pointerIdRef.current = e.pointerId
            lastXRef.current = e.clientX
            samplesRef.current = [{ t: performance.now(), value: targetRef.current }]
            targetRef.current = currentRef.current
            stage.setPointerCapture(e.pointerId)
            stage.style.cursor = "grabbing"
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!draggingRef.current || e.pointerId !== pointerIdRef.current) return
            const dx = e.clientX - lastXRef.current
            lastXRef.current = e.clientX
            targetRef.current -= (dx * dragSensitivity) / layoutRef.current.radius
            pushSample()
        }

        const endDrag = (e: PointerEvent) => {
            if (!draggingRef.current || e.pointerId !== pointerIdRef.current) return
            draggingRef.current = false
            pointerIdRef.current = null
            stage.style.cursor = "grab"
            if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId)
            pushSample()

            let projected = targetRef.current
            if (!reduceMotion) {
                const samples = samplesRef.current
                const first = samples[0]
                const last = samples[samples.length - 1]
                const dt = last && first ? (last.t - first.t) / 1000 : 0
                if (dt > 0.008) {
                    const velocity = (last.value - first.value) / dt
                    projected = targetRef.current + clamp(-MAX_FLICK, MAX_FLICK, velocity / smoothing) * momentum
                }
            }
            targetRef.current = snap ? snapTo(layoutRef.current.step, projected) : projected
            samplesRef.current = []
        }

        const onWheel = (e: WheelEvent) => {
            if (wheelControl === "off") return
            const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
            if (wheelControl === "horizontal" && !horizontal) return
            e.preventDefault()
            targetRef.current += ((horizontal ? e.deltaX : e.deltaY) * dragSensitivity) / layoutRef.current.radius
            if (snap) {
                window.clearTimeout(wheelSettleRef.current)
                wheelSettleRef.current = window.setTimeout(() => {
                    targetRef.current = snapTo(layoutRef.current.step, targetRef.current)
                }, 140)
            }
        }

        const onKeyDown = (e: KeyboardEvent) => {
            const { step } = layoutRef.current
            if (e.key === "ArrowRight") {
                e.preventDefault()
                targetRef.current += step
            } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                targetRef.current -= step
            }
        }

        const onEnter = () => {
            hoveredRef.current = true
        }
        const onLeave = () => {
            hoveredRef.current = false
        }

        stage.addEventListener("pointerdown", onPointerDown)
        stage.addEventListener("pointermove", onPointerMove)
        stage.addEventListener("pointerup", endDrag)
        stage.addEventListener("pointercancel", endDrag)
        stage.addEventListener("pointerenter", onEnter)
        stage.addEventListener("pointerleave", onLeave)
        stage.addEventListener("wheel", onWheel, { passive: false })
        stage.addEventListener("keydown", onKeyDown)
        return () => {
            stage.removeEventListener("pointerdown", onPointerDown)
            stage.removeEventListener("pointermove", onPointerMove)
            stage.removeEventListener("pointerup", endDrag)
            stage.removeEventListener("pointercancel", endDrag)
            stage.removeEventListener("pointerenter", onEnter)
            stage.removeEventListener("pointerleave", onLeave)
            stage.removeEventListener("wheel", onWheel)
            stage.removeEventListener("keydown", onKeyDown)
            window.clearTimeout(wheelSettleRef.current)
        }
    }, [isStatic, dragSensitivity, momentum, reduceMotion, smoothing, snap, total, wheelControl])

    const rootStyle = {
        backgroundColor: surfaceColor,
        ["--hpx-afc-radius" as any]: `${cardRadius}px`,
        ...style,
    } as React.CSSProperties

    // Static renderer (canvas / export): the fan at rest, positioned purely in
    // CSS from a 1440x900 reference layout, centred on the frame. No refs, no
    // measuring, no ticker, no JS-applied visibility.
    if (isStatic) {
        const l = computeLayout(STATIC_W, STATIC_H, geometry)
        const reach = Math.floor(l.maxAngle / l.step)
        const cards: React.ReactNode[] = []
        for (let k = -reach; k <= reach; k += 1) {
            const angle = k * l.step
            const itemIndex = ((k % total) + total) % total
            const item = items[itemIndex]
            cards.push(
                <div
                    key={k}
                    className="hpx-afc-card"
                    style={{
                        width: l.cardWidth,
                        height: l.cardHeight,
                        left: `calc(50% + ${l.radius * Math.sin(angle) - l.cardWidth / 2}px)`,
                        top: `calc(${arcOffset * 100}% + ${l.radius * (1 - Math.cos(angle)) - l.cardHeight / 2}px)`,
                        transform: `rotate(${angle}rad)`,
                        zIndex: k + reach + 1,
                    }}
                >
                    <div className="hpx-afc-inner">
                        <CardContent item={item} index={itemIndex} showCaptions={false} placeholder={placeholder} placeholderColor={placeholderColor} />
                    </div>
                </div>
            )
        }
        return (
            <section className="hpx-afc-root" style={rootStyle}>
                <div className="hpx-afc-stage">
                    <div
                        className="hpx-afc-disc"
                        style={{
                            backgroundColor: surfaceColor,
                            width: l.discRadius * 2,
                            height: l.discRadius * 2,
                            left: "50%",
                            top: `calc(${arcOffset * 100}% + ${l.radius - l.discRadius}px)`,
                        }}
                    />
                    {cards}
                </div>
            </section>
        )
    }

    if (!total) return null
    const slots = Array.from({ length: slotCount }, (_, i) => items[i % total])

    return (
        <section ref={rootRef} className={`hpx-afc-root${reduceMotion ? " hpx-afc-reduce" : ""}`} style={rootStyle}>
            <div ref={stageRef} tabIndex={0} role="region" aria-label="Draggable image carousel" className="hpx-afc-stage">
                <div ref={discRef} aria-hidden className="hpx-afc-disc" style={{ backgroundColor: surfaceColor }} />
                {slots.map((item, i) => (
                    <div
                        key={i}
                        ref={(el) => {
                            cardRefs.current[i] = el
                        }}
                        className="hpx-afc-card"
                        style={{ visibility: "hidden" }}
                    >
                        <div
                            ref={(el) => {
                                innerRefs.current[i] = el
                            }}
                            className="hpx-afc-inner"
                            style={{ opacity: reduceMotion ? 1 : 0 }}
                        >
                            <CardContent item={item} index={i % total} showCaptions={showCaptions} placeholder={placeholder} placeholderColor={placeholderColor} />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

HyperiuxArcFlowCarousel.displayName = "Hyperiux Arc Flow Carousel"

addPropertyControls(HyperiuxArcFlowCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Title" },
                description: { type: ControlType.String, title: "Description", defaultValue: "", displayTextArea: true },
            },
        },
    },
    showCaptions: { type: ControlType.Boolean, title: "Captions", defaultValue: true },
    radiusRatio: { type: ControlType.Number, title: "Arc Radius", min: 0.4, max: 3, step: 0.05, defaultValue: 0.85 },
    arcOffset: { type: ControlType.Number, title: "Arc Position", min: 0.1, max: 0.9, step: 0.01, defaultValue: 0.5 },
    cardRatio: { type: ControlType.Number, title: "Card Size", min: 0.08, max: 0.5, step: 0.01, defaultValue: 0.21 },
    minCardWidth: { type: ControlType.Number, title: "Min Width", min: 60, max: 600, unit: "px", defaultValue: 150 },
    maxCardWidth: { type: ControlType.Number, title: "Max Width", min: 100, max: 800, unit: "px", defaultValue: 320 },
    cardAspect: { type: ControlType.Number, title: "Aspect", min: 0.3, max: 2, step: 0.01, defaultValue: 0.62 },
    overlap: { type: ControlType.Number, title: "Overlap", min: -0.5, max: 0.85, step: 0.01, defaultValue: -0.04 },
    cardRadius: { type: ControlType.Number, title: "Radius", min: 0, max: 60, unit: "px", defaultValue: 10 },
    smoothing: { type: ControlType.Number, title: "Smoothing", min: 1, max: 20, step: 0.5, defaultValue: 5.5 },
    dragSensitivity: { type: ControlType.Number, title: "Drag Speed", min: 0.2, max: 4, step: 0.1, defaultValue: 1.2 },
    momentum: { type: ControlType.Number, title: "Momentum", min: 0, max: 3, step: 0.1, defaultValue: 1 },
    snap: { type: ControlType.Boolean, title: "Snap", defaultValue: false },
    wheelControl: {
        type: ControlType.Enum,
        title: "Wheel",
        options: ["horizontal", "both", "off"],
        optionTitles: ["Horizontal", "Both", "Off"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    autoRotateSpeed: { type: ControlType.Number, title: "Auto Rotate", min: -0.5, max: 0.5, step: 0.01, defaultValue: 0 },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Hover Pause",
        defaultValue: true,
        hidden: (p: Props) => !p.autoRotateSpeed,
    },
    surfaceColor: { type: ControlType.Color, title: "Background", defaultValue: "#000000" },
    placeholder: {
        type: ControlType.Enum,
        title: "Placeholder",
        options: ["gradient", "solid"],
        optionTitles: ["Gradient", "Solid"],
        defaultValue: "gradient",
        displaySegmentedControl: true,
        description: "Shown for items without an image.",
    },
    placeholderColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#2e2e2e",
        hidden: (p: Props) => p.placeholder !== "solid",
    },
})
