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
import { Flip } from "gsap/Flip"

gsap.registerPlugin(Flip)

type Mode = "flat" | "tilt" | "ring" | "gallery"
type ImageValue = string | { src?: string; alt?: string } | undefined
type ItemInput = { image?: ImageValue; alt?: string }
type Item = { src?: string; alt: string }

// No bundled images: until items are added, every card is a placeholder.
const DEFAULT_ITEMS: Item[] = Array.from({ length: 16 }, (_, i) => ({ alt: `Card ${i + 1}` }))

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
}: {
    src?: string
    alt: string
    index: number
    placeholder: PlaceholderStyle
    placeholderColor: string
}) {
    if (src) return <img src={src} alt={alt} draggable={false} className="hpx-ofs-media" />
    return (
        <div
            role="img"
            aria-label={alt}
            className="hpx-ofs-media"
            style={{ background: placeholderBackground(placeholder, placeholderColor, index) }}
        />
    )
}

function normalizeItems(input?: ItemInput[]): Item[] {
    if (!Array.isArray(input) || input.length === 0) return DEFAULT_ITEMS
    return input.map((it, i) => {
        const img = it?.image
        const src = typeof img === "string" ? img : img?.src
        const alt = it?.alt || (typeof img === "object" && img?.alt) || `Card ${i + 1}`
        return { src: src || undefined, alt }
    })
}

// ---------------------------------------------------------------------------
// Layout math (unchanged from the registry source). Every mode is the same
// ring of flat, forward-facing cards; modes only change the camera's zoom,
// tilt and framing.
// ---------------------------------------------------------------------------

interface CardBox {
    x: number
    y: number
    width: number
    height: number
    zIndex: number
}

interface FlatTransform {
    radiusX: number
    radiusY: number
    scale: number
}

interface AxisTransform {
    x: number
    y: number
    z: number
    radiusX: number
    radiusY: number
    scale: number
    moveY: number
}

interface ModeTransforms {
    flat: FlatTransform
    tilt: AxisTransform
    ring: AxisTransform
    gallery: AxisTransform
}

const MODES: { key: Mode; label: string }[] = [
    { key: "flat", label: "Flat" },
    { key: "tilt", label: "Tilt" },
    { key: "ring", label: "Ring" },
    { key: "gallery", label: "Gallery" },
]

const FLIP_DURATION = 0.9
const MOBILE_BREAKPOINT = 768
const MOBILE_FLAT_RADIUS_X_SCALE = 0.55
const MOBILE_TILT_RADIUS_X_SCALE = 0.6
const MOBILE_TILT_RADIUS_Y_SCALE = 0.8
const MOBILE_RING_SCALE = 0.6
const MOBILE_GALLERY_SCALE = 0.6
// Reference width for the static (canvas / export) render.
const STATIC_W = 1440

const degToRad = (deg: number) => (deg * Math.PI) / 180

const getBaseOrbitRadius = (count: number, cardWidth: number, cardHeight: number, imageGap: number) => {
    const baseSpan = Math.max(cardWidth, cardHeight) + imageGap
    return Math.max(((count * baseSpan) / (2 * Math.PI)) * 0.62, baseSpan * 0.9)
}

interface CoverflowParams {
    radius: number
    tiltDeg: number
    camDistFactor: number
    offsetDeg: number
    positionScaleStrength: number
    sizeScaleStrength: number
}

const buildCoverflowLayout = (
    count: number,
    cx: number,
    cy: number,
    size: { w: number; h: number },
    p: CoverflowParams
): CardBox[] => {
    const camDist = p.radius * p.camDistFactor
    const tilt = degToRad(p.tiltDeg)
    return Array.from({ length: count }, (_, i) => {
        const theta = degToRad(p.offsetDeg + (i / count) * 360)
        const px = p.radius * Math.sin(theta)
        const pz0 = -p.radius * Math.cos(theta)
        const py = -pz0 * Math.sin(tilt)
        const pz = pz0 * Math.cos(tilt)
        const scale = Math.max(camDist / (camDist + pz), 0.05)
        const positionScale = 1 + (scale - 1) * p.positionScaleStrength
        const sizeScale = 1 + (scale - 1) * p.sizeScaleStrength
        return {
            x: cx + px * positionScale,
            y: cy + py * positionScale,
            width: size.w * sizeScale,
            height: size.h * sizeScale,
            zIndex: Math.round(scale * 1000) + 1,
        }
    })
}

const applyZRotation = (boxes: CardBox[], cx: number, cy: number, zDeg: number) => {
    if (!zDeg) return boxes
    const rad = degToRad(zDeg)
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    return boxes.map((b) => {
        const dx = b.x - cx
        const dy = b.y - cy
        return { ...b, x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
    })
}

const applyRadiusScale = (boxes: CardBox[], cx: number, cy: number, sx: number, sy: number) => {
    if (sx === 1 && sy === 1) return boxes
    return boxes.map((b) => ({ ...b, x: cx + (b.x - cx) * sx, y: cy + (b.y - cy) * sy }))
}

const applyUniformScale = (boxes: CardBox[], cx: number, cy: number, scale: number) => {
    if (scale === 1) return boxes
    return boxes.map((b) => ({
        ...b,
        x: cx + (b.x - cx) * scale,
        y: cy + (b.y - cy) * scale,
        width: b.width * scale,
        height: b.height * scale,
    }))
}

// Positions are relative to (cx, cy); the static renderer passes 0,0 and
// offsets every card from the frame's centre in CSS.
function buildLayout(
    mode: Mode,
    count: number,
    cx: number,
    cy: number,
    size: { w: number; h: number },
    transforms: ModeTransforms,
    imageGap: number,
    rotationOffsetDeg: number
): CardBox[] {
    const baseRadius = getBaseOrbitRadius(count, size.w, size.h, imageGap)

    if (mode === "flat") {
        const f = transforms.flat
        const rx = baseRadius * f.radiusX
        const ry = baseRadius * f.radiusY
        const boxes = Array.from({ length: count }, (_, i) => {
            const angle = (i / count) * Math.PI * 2 - Math.PI / 2 + degToRad(rotationOffsetDeg)
            return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), width: size.w, height: size.h, zIndex: i + 1 }
        })
        return applyUniformScale(boxes, cx, cy, f.scale)
    }

    const t = transforms[mode]
    const gallery = mode === "gallery"
    const radius = gallery ? baseRadius * 1.55 : baseRadius * 1.12
    const boxes = buildCoverflowLayout(count, cx, cy, size, {
        radius,
        tiltDeg: t.x,
        camDistFactor: gallery ? 1.55 : 1.75,
        offsetDeg: -90 + t.y + rotationOffsetDeg,
        positionScaleStrength: gallery ? 0.28 : 0.45,
        sizeScaleStrength: gallery ? 0.16 : 0.42,
    })
    const stretched = applyRadiusScale(boxes, cx, cy, t.radiusX, t.radiusY)
    const scaled = applyUniformScale(stretched, cx, cy, t.scale)
    const rotated = applyZRotation(scaled, cx, cy, t.z)
    return t.moveY ? rotated.map((b) => ({ ...b, y: b.y + t.moveY })) : rotated
}

// Narrow frames pull the ring in so it doesn't overflow.
function responsive(transforms: ModeTransforms, width: number): ModeTransforms {
    if (width >= MOBILE_BREAKPOINT) return transforms
    return {
        flat: { ...transforms.flat, radiusX: transforms.flat.radiusX * MOBILE_FLAT_RADIUS_X_SCALE },
        tilt: {
            ...transforms.tilt,
            radiusX: transforms.tilt.radiusX * MOBILE_TILT_RADIUS_X_SCALE,
            radiusY: transforms.tilt.radiusY * MOBILE_TILT_RADIUS_Y_SCALE,
        },
        ring: { ...transforms.ring, scale: transforms.ring.scale * MOBILE_RING_SCALE },
        gallery: { ...transforms.gallery, scale: transforms.gallery.scale * MOBILE_GALLERY_SCALE },
    }
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

const STYLE_ID = "hpx-orbit-flip-slider-styles"
const CSS = `
.hpx-ofs-root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: inherit; }
.hpx-ofs-track { position: absolute; inset: 0; overflow: hidden; }
.hpx-ofs-card { position: absolute; left: 0; top: 0; perspective: 500px; }
.hpx-ofs-inner { position: relative; width: 100%; height: 100%; overflow: hidden; background: #ffffff; border-radius: var(--hpx-ofs-radius); box-shadow: 0 1px 2px rgba(0,0,0,0.08); transform-style: preserve-3d; }
.hpx-ofs-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; -webkit-user-drag: none; }
.hpx-ofs-modes { position: absolute; top: 24px; left: 24px; z-index: 5000; display: flex; flex-wrap: wrap; gap: 8px; }
.hpx-ofs-mode { padding: 8px 20px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.15); background: rgba(255,255,255,0.7); color: rgba(0,0,0,0.7); font: inherit; font-size: 14px; line-height: 1.2; cursor: pointer; transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease; }
.hpx-ofs-mode:hover { background: rgba(0,0,0,0.1); }
.hpx-ofs-mode[aria-pressed="true"] { border-color: var(--hpx-ofs-accent); background: var(--hpx-ofs-accent); color: #ffffff; }
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
    initialMode?: Mode
    showModeButtons?: boolean
    backgroundColor?: string
    accentColor?: string
    imageWidth?: number
    imageHeight?: number
    imageGap?: number
    cornerRadius?: number
    rotate?: boolean
    rotateSpeed?: number
    stopRotationOnHover?: boolean
    enableHoverMovement?: boolean
    hoverMoveY?: number
    perspectiveRotateValue?: number
    perspectiveRotateDirection?: "left" | "right"
    flat?: Partial<FlatTransform>
    tilt?: Partial<AxisTransform>
    ring?: Partial<AxisTransform>
    gallery?: Partial<AxisTransform>
    placeholder?: PlaceholderStyle
    placeholderColor?: string
    style?: React.CSSProperties
}

const DEFAULT_FLAT: FlatTransform = { radiusX: 1, radiusY: 1, scale: 1 }
const DEFAULT_TILT: AxisTransform = { x: 70, y: 0, z: 0, radiusX: 1.2, radiusY: 1, scale: 1, moveY: 325 }
const DEFAULT_RING: AxisTransform = { x: 31, y: 56, z: -25, radiusX: 1.5, radiusY: 0.65, scale: 0.6, moveY: 0 }
const DEFAULT_GALLERY: AxisTransform = { x: 10, y: 0, z: 0, radiusX: 1, radiusY: 1, scale: 1, moveY: 0 }

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 */
export default function HyperiuxOrbitFlipSlider({
    items: itemsInput,
    initialMode = "flat",
    showModeButtons = true,
    backgroundColor = "#e9e9ea",
    accentColor = "#000000",
    imageWidth = 140,
    imageHeight = 200,
    imageGap = 0,
    cornerRadius = 0,
    rotate = true,
    rotateSpeed = 4,
    stopRotationOnHover = true,
    enableHoverMovement = true,
    hoverMoveY = -8,
    perspectiveRotateValue = 180,
    perspectiveRotateDirection = "right",
    flat,
    tilt,
    ring,
    gallery,
    placeholder = "gradient",
    placeholderColor = "#2e2e2e",
    style,
}: Props) {
    injectStyles()
    const items = useMemo(() => normalizeItems(itemsInput), [itemsInput])
    const count = items.length
    const isStatic = useIsStaticRenderer()
    const reduce = usePrefersReducedMotion()

    const transforms: ModeTransforms = {
        flat: { ...DEFAULT_FLAT, ...flat },
        tilt: { ...DEFAULT_TILT, ...tilt },
        ring: { ...DEFAULT_RING, ...ring },
        gallery: { ...DEFAULT_GALLERY, ...gallery },
    }
    const size = { w: imageWidth, h: imageHeight }
    // Everything the layout reads, as one string: a change re-lays the ring.
    const layoutKey = JSON.stringify([transforms, size, imageGap, count])

    const rootRef = useRef<HTMLDivElement | null>(null)
    const trackRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const modeRef = useRef<Mode>(initialMode)
    const rotationRef = useRef(0)
    const flippingRef = useRef(false)
    const flipTimerRef = useRef<number | null>(null)
    const hoverCountRef = useRef(0)
    const widthRef = useRef(STATIC_W)
    const configRef = useRef({ transforms, size, imageGap })
    configRef.current = { transforms, size, imageGap }
    const [activeMode, setActiveMode] = useState<Mode>(initialMode)
    const active = useActive(rootRef, !isStatic)

    const applyLayout = useCallback(
        (mode: Mode, animate: boolean) => {
            const track = trackRef.current
            if (!track) return
            const cards = cardRefs.current.slice(0, count).filter(Boolean) as HTMLDivElement[]
            if (!cards.length) return
            const width = track.offsetWidth
            const height = track.offsetHeight
            widthRef.current = width
            const { transforms: t, size: s, imageGap: gap } = configRef.current
            const layout = buildLayout(mode, cards.length, width / 2, height / 2, s, responsive(t, width), gap, rotationRef.current)

            const commit = () => {
                cards.forEach((card, i) => {
                    const box = layout[i]
                    gsap.set(card, {
                        x: box.x,
                        y: box.y,
                        xPercent: -50,
                        yPercent: -50,
                        width: box.width,
                        height: box.height,
                        zIndex: box.zIndex,
                    })
                })
            }

            if (!animate || reduce) {
                commit()
                return
            }

            const state = Flip.getState(cards)
            commit()
            flippingRef.current = true
            if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current)
            flipTimerRef.current = window.setTimeout(() => {
                flippingRef.current = false
                flipTimerRef.current = null
            }, FLIP_DURATION * 1000)
            Flip.from(state, { duration: FLIP_DURATION, ease: "power3.inOut", stagger: 0.015, absolute: true })
        },
        [count, reduce]
    )

    // First layout before paint, then again whenever the frame resizes.
    useLayoutEffect(() => {
        if (isStatic) return
        applyLayout(modeRef.current, false)
        const track = trackRef.current
        if (!track || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => applyLayout(modeRef.current, false))
        ro.observe(track)
        return () => ro.disconnect()
    }, [isStatic, applyLayout])

    // Property changes animate the ring into its new shape.
    const didMountRef = useRef(false)
    useEffect(() => {
        if (isStatic) return
        if (!didMountRef.current) {
            didMountRef.current = true
            return
        }
        applyLayout(modeRef.current, true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, layoutKey])

    const changeMode = useCallback(
        (mode: Mode) => {
            if (mode === modeRef.current) return
            modeRef.current = mode
            setActiveMode(mode)
            applyLayout(mode, true)
        },
        [applyLayout]
    )

    useEffect(() => {
        if (isStatic) return
        changeMode(initialMode)
    }, [isStatic, initialMode, changeMode])

    // Idle spin: nudges the ring's rotation each frame. Paused off-screen,
    // with the tab hidden, during a mode Flip, and (optionally) on hover.
    useEffect(() => {
        if (isStatic || !rotate || reduce || !active) return
        let rafId = 0
        let last = performance.now()
        const tick = (now: number) => {
            const dt = Math.min(now - last, 50) / 1000
            last = now
            const paused = flippingRef.current || (stopRotationOnHover && hoverCountRef.current > 0)
            if (!paused) {
                rotationRef.current += rotateSpeed * dt
                applyLayout(modeRef.current, false)
            }
            rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafId)
    }, [isStatic, rotate, rotateSpeed, stopRotationOnHover, reduce, active, applyLayout])

    useEffect(
        () => () => {
            if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current)
        },
        []
    )

    // Hover pops a card toward the viewer with a bouncy turn.
    const onCardEnter = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            hoverCountRef.current += 1
            if (reduce || !enableHoverMovement || widthRef.current < MOBILE_BREAKPOINT) return
            const inner = e.currentTarget.querySelector<HTMLElement>(".hpx-ofs-inner")
            if (!inner) return
            const rotateY =
                perspectiveRotateDirection === "left" ? -Math.abs(perspectiveRotateValue) : Math.abs(perspectiveRotateValue)
            gsap.killTweensOf(inner)
            gsap.to(inner, {
                y: hoverMoveY,
                rotateY,
                boxShadow: "0 14px 26px rgba(0,0,0,0.2)",
                duration: 0.8,
                ease: "back.out(2.2)",
            })
        },
        [enableHoverMovement, hoverMoveY, perspectiveRotateDirection, perspectiveRotateValue, reduce]
    )

    const onCardLeave = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            hoverCountRef.current = Math.max(0, hoverCountRef.current - 1)
            if (reduce || !enableHoverMovement || widthRef.current < MOBILE_BREAKPOINT) return
            const inner = e.currentTarget.querySelector<HTMLElement>(".hpx-ofs-inner")
            if (!inner) return
            gsap.killTweensOf(inner)
            gsap.to(inner, {
                y: 0,
                rotateY: 0,
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                duration: 0.7,
                ease: "back.out(2.2)",
            })
        },
        [enableHoverMovement, reduce]
    )

    const rootStyle = {
        backgroundColor,
        ["--hpx-ofs-radius" as any]: `${cornerRadius}px`,
        ["--hpx-ofs-accent" as any]: accentColor,
        ...style,
    } as React.CSSProperties

    const modeButtons = (onSelect?: (m: Mode) => void, current: Mode = activeMode) =>
        showModeButtons ? (
            <div className="hpx-ofs-modes">
                {MODES.map((m) => (
                    <button
                        key={m.key}
                        type="button"
                        className="hpx-ofs-mode"
                        aria-pressed={current === m.key}
                        onClick={onSelect ? () => onSelect(m.key) : undefined}
                    >
                        {m.label}
                    </button>
                ))}
            </div>
        ) : null

    // Static renderer (canvas / export): the ring at rest in its initial
    // mode, every card placed in plain CSS relative to the frame's centre.
    // No refs, no RAF, no Flip, no GSAP.
    if (isStatic) {
        const layout = buildLayout(initialMode, count, 0, 0, size, responsive(transforms, STATIC_W), imageGap, 0)
        return (
            <div className="hpx-ofs-root" style={rootStyle}>
                <div className="hpx-ofs-track">
                    {items.map((item, i) => {
                        const box = layout[i]
                        return (
                            <div
                                key={i}
                                className="hpx-ofs-card"
                                style={{
                                    left: `calc(50% + ${box.x}px)`,
                                    top: `calc(50% + ${box.y}px)`,
                                    width: box.width,
                                    height: box.height,
                                    zIndex: box.zIndex,
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                <div className="hpx-ofs-inner">
                                    <Media src={item.src} alt={item.alt} index={i} placeholder={placeholder} placeholderColor={placeholderColor} />
                                </div>
                            </div>
                        )
                    })}
                </div>
                {modeButtons(undefined, initialMode)}
            </div>
        )
    }

    return (
        <div ref={rootRef} className="hpx-ofs-root" style={rootStyle}>
            <div ref={trackRef} className="hpx-ofs-track">
                {items.map((item, i) => (
                    <div
                        key={i}
                        ref={(el) => {
                            cardRefs.current[i] = el
                        }}
                        className="hpx-ofs-card"
                        onMouseEnter={onCardEnter}
                        onMouseLeave={onCardLeave}
                    >
                        <div className="hpx-ofs-inner">
                            <Media src={item.src} alt={item.alt} index={i} placeholder={placeholder} placeholderColor={placeholderColor} />
                        </div>
                    </div>
                ))}
            </div>
            {modeButtons(changeMode)}
        </div>
    )
}

HyperiuxOrbitFlipSlider.displayName = "Hyperiux Orbit Flip Slider"

const axisControls = (d: AxisTransform, withMoveY: boolean): Record<string, any> => ({
    x: { type: ControlType.Number, title: "Rotate X", min: -90, max: 90, unit: "°", defaultValue: d.x },
    y: { type: ControlType.Number, title: "Rotate Y", min: -180, max: 180, unit: "°", defaultValue: d.y },
    z: { type: ControlType.Number, title: "Rotate Z", min: -180, max: 180, unit: "°", defaultValue: d.z },
    radiusX: { type: ControlType.Number, title: "Radius X", min: 0.2, max: 3, step: 0.05, defaultValue: d.radiusX },
    radiusY: { type: ControlType.Number, title: "Radius Y", min: 0.2, max: 3, step: 0.05, defaultValue: d.radiusY },
    scale: { type: ControlType.Number, title: "Scale", min: 0.2, max: 3, step: 0.05, defaultValue: d.scale },
    ...(withMoveY
        ? { moveY: { type: ControlType.Number, title: "Move Y", min: -600, max: 600, unit: "px", defaultValue: d.moveY } }
        : {}),
})

addPropertyControls(HyperiuxOrbitFlipSlider, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: { type: ControlType.String, title: "Alt" },
            },
        },
    },
    initialMode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["flat", "tilt", "ring", "gallery"],
        optionTitles: ["Flat", "Tilt", "Ring", "Gallery"],
        defaultValue: "flat",
    },
    showModeButtons: { type: ControlType.Boolean, title: "Mode Buttons", defaultValue: true },
    imageWidth: { type: ControlType.Number, title: "Card Width", min: 40, max: 600, unit: "px", defaultValue: 140 },
    imageHeight: { type: ControlType.Number, title: "Card Height", min: 40, max: 800, unit: "px", defaultValue: 200 },
    imageGap: { type: ControlType.Number, title: "Gap", min: 0, max: 200, unit: "px", defaultValue: 0 },
    cornerRadius: { type: ControlType.Number, title: "Radius", min: 0, max: 60, unit: "px", defaultValue: 0 },
    rotate: { type: ControlType.Boolean, title: "Spin", defaultValue: true },
    rotateSpeed: {
        type: ControlType.Number,
        title: "Spin Speed",
        min: -40,
        max: 40,
        step: 0.5,
        unit: "°/s",
        defaultValue: 4,
        hidden: (p: Props) => !p.rotate,
    },
    stopRotationOnHover: {
        type: ControlType.Boolean,
        title: "Hover Pause",
        defaultValue: true,
        hidden: (p: Props) => !p.rotate,
    },
    enableHoverMovement: { type: ControlType.Boolean, title: "Hover Pop", defaultValue: true },
    hoverMoveY: {
        type: ControlType.Number,
        title: "Pop Lift",
        min: -60,
        max: 0,
        unit: "px",
        defaultValue: -8,
        hidden: (p: Props) => !p.enableHoverMovement,
    },
    perspectiveRotateValue: {
        type: ControlType.Number,
        title: "Pop Turn",
        min: 0,
        max: 360,
        unit: "°",
        defaultValue: 180,
        hidden: (p: Props) => !p.enableHoverMovement,
    },
    perspectiveRotateDirection: {
        type: ControlType.Enum,
        title: "Turn Dir.",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
        hidden: (p: Props) => !p.enableHoverMovement,
    },
    flat: {
        type: ControlType.Object,
        title: "Flat",
        controls: {
            radiusX: { type: ControlType.Number, title: "Radius X", min: 0.2, max: 3, step: 0.05, defaultValue: 1 },
            radiusY: { type: ControlType.Number, title: "Radius Y", min: 0.2, max: 3, step: 0.05, defaultValue: 1 },
            scale: { type: ControlType.Number, title: "Scale", min: 0.2, max: 3, step: 0.05, defaultValue: 1 },
        },
    },
    tilt: { type: ControlType.Object, title: "Tilt", controls: axisControls(DEFAULT_TILT, true) },
    ring: { type: ControlType.Object, title: "Ring", controls: axisControls(DEFAULT_RING, false) },
    gallery: { type: ControlType.Object, title: "Gallery", controls: axisControls(DEFAULT_GALLERY, false) },
    backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#e9e9ea" },
    accentColor: { type: ControlType.Color, title: "Active Button", defaultValue: "#000000" },
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
