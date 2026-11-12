// Built using Hyperiux Vault: https://vault.hyperiux.com
import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { flushSync } from "react-dom"
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
type SlideInput = { image?: ImageValue; text?: string }
type Slide = { src?: string; text: string }

// No bundled images: until slides are added, every card is a placeholder.
const DEFAULT_SLIDES: Slide[] = [
    { text: "Dimensional Switch" },
    { text: "Add Your Images" },
    { text: "Flip To Reveal" },
    { text: "Slide Four" },
    { text: "Slide Five" },
]

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


const DEFAULT_EASE = "cubic-bezier(1, -0.001, 0.159, 0.838)"
const CUBIC_BEZIER_RE = /^cubic-bezier\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)$/

// CSS-style cubic-bezier as a GSAP ease function (Newton-Raphson with a
// bisection fallback), so no easing plugin is needed.
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
    const cx = 3 * x1
    const bx = 3 * (x2 - x1) - cx
    const ax = 1 - cx - bx
    const cy = 3 * y1
    const by = 3 * (y2 - y1) - cy
    const ay = 1 - cy - by
    const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
    const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
    const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
    return (x: number) => {
        if (x <= 0) return 0
        if (x >= 1) return 1
        let t = x
        for (let i = 0; i < 8; i += 1) {
            const err = sampleX(t) - x
            if (Math.abs(err) < 1e-6) return sampleY(t)
            const d = slopeX(t)
            if (Math.abs(d) < 1e-6) break
            t -= err / d
        }
        let lo = 0
        let hi = 1
        t = x
        for (let i = 0; i < 40; i += 1) {
            const v = sampleX(t)
            if (Math.abs(v - x) < 1e-6) break
            if (x > v) lo = t
            else hi = t
            t = (lo + hi) / 2
        }
        return sampleY(t)
    }
}

const easeCache = new Map<string, string | ((p: number) => number)>()

function resolveEase(ease: string): string | ((p: number) => number) {
    const cached = easeCache.get(ease)
    if (cached) return cached
    const match = ease.match(CUBIC_BEZIER_RE)
    const resolved = match
        ? cubicBezier(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]))
        : ease
    easeCache.set(ease, resolved)
    return resolved
}

const EASE = "power4.inOut"
const DURATION = 0.9
const TEXT_TRANSLATE_PERCENT = 40
const TEXT_ROTATE_DEG = 45
const OUTGOING_DURATION = DURATION * 0.45
const VERTICAL_TEXT_TRANSLATE_PERCENT = 40
const VERTICAL_TEXT_ROTATE_DEG = 45
const VERTICAL_OUTGOING_DURATION = DURATION * 0.45
const TEXT_Z = 60

function normalizeSlides(input?: SlideInput[]): Slide[] {
    if (!Array.isArray(input) || input.length === 0) return DEFAULT_SLIDES
    const out: Slide[] = []
    for (const item of input) {
        const img = item?.image
        const src = typeof img === "string" ? img : img?.src
        out.push({ src: src || undefined, text: item?.text ?? "" })
    }
    return out.length ? out : DEFAULT_SLIDES
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

const STYLE_ID = "hpx-dimensional-switch-styles"
const CSS = `
.hpx-dss-root { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; container-type: size; font-family: inherit; }
.hpx-dss-card { position: relative; perspective: 1000px; }
.hpx-dss-flipper { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
.hpx-dss-face { position: absolute; inset: 0; overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.hpx-dss-back-y { transform: rotateY(180deg); }
.hpx-dss-back-x { transform: rotateX(180deg); }
.hpx-dss-face img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; -webkit-user-drag: none; }
.hpx-dss-textwrap { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; perspective: 1000px; pointer-events: none; }
.hpx-dss-text { position: absolute; width: fit-content; max-width: 92%; margin: 0; text-align: center; font-weight: 600; line-height: 1.1; }
.hpx-dss-text-next { opacity: 0; }
.hpx-dss-dots { position: absolute; left: 50%; bottom: 104px; z-index: 10; display: flex; gap: 8px; transform: translateX(-50%); }
.hpx-dss-dot { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 999px; background: rgba(255,255,255,0.3); cursor: pointer; transition: width 0.3s ease, background-color 0.3s ease; }
.hpx-dss-dot:hover { background: rgba(255,255,255,0.5); }
.hpx-dss-dot[aria-current="true"] { width: 24px; background: var(--hpx-dss-accent); }
.hpx-dss-controls { position: absolute; left: 50%; bottom: 32px; z-index: 10; display: flex; gap: 16px; transform: translateX(-50%); }
.hpx-dss-btn { width: 48px; height: 48px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: #fff; cursor: pointer; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); transition: background-color 0.3s ease; }
.hpx-dss-btn:hover:not(:disabled) { background: var(--hpx-dss-accent); }
.hpx-dss-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.hpx-dss-btn svg { width: 22px; height: 22px; }
`

function injectStyles() {
    if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return
    const el = document.createElement("style")
    el.id = STYLE_ID
    el.textContent = CSS
    document.head.appendChild(el)
}

function Arrow({ dir }: { dir: "left" | "right" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {dir === "left" ? (
                <>
                    <path d="m12 19-7-7 7-7" />
                    <path d="M19 12H5" />
                </>
            ) : (
                <>
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                </>
            )}
        </svg>
    )
}

interface Props {
    slides?: SlideInput[]
    direction?: "horizontal" | "vertical"
    infinite?: boolean
    autoplay?: boolean
    autoplayDelay?: number
    ease?: string
    cardWidth?: number
    cardHeight?: number
    cardRadius?: number
    textSize?: number
    textColor?: string
    accentColor?: string
    bgColor?: string
    placeholder?: PlaceholderStyle
    placeholderColor?: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function HyperiuxDimensionalSwitch({
    slides,
    direction = "horizontal",
    infinite = true,
    autoplay = true,
    autoplayDelay = 2.6,
    ease = DEFAULT_EASE,
    cardWidth = 680,
    cardHeight = 460,
    cardRadius = 16,
    textSize = 84,
    textColor = "#ffffff",
    accentColor = "#ff5f00",
    bgColor = "#000000",
    placeholder = "gradient",
    placeholderColor = "#2e2e2e",
    style,
}: Props) {
    injectStyles()
    const items = useMemo(() => normalizeSlides(slides), [slides])
    const count = items.length
    const isStatic = useIsStaticRenderer()
    const reduce = usePrefersReducedMotion()

    const isVertical = direction === "vertical"
    const flipAxis = isVertical ? "rotateX" : "rotateY"
    const rootRef = useRef<HTMLDivElement>(null)
    const flipperRef = useRef<HTMLDivElement>(null)
    const prevTextRef = useRef<HTMLDivElement>(null)
    const nextTextRef = useRef<HTMLDivElement>(null)
    const showingNextRef = useRef(false)
    const isAnimatingRef = useRef(false)
    const rotationRef = useRef(0)
    const [frontIndex, setFrontIndex] = useState(0)
    const [backIndex, setBackIndex] = useState(1 % count)
    const [currentIndex, setCurrentIndex] = useState(0)
    const active = useActive(rootRef, !isStatic)

    // Keep indices valid if the slide list shrinks.
    const safeFront = frontIndex % count
    const safeBack = backIndex % count
    const safeCurrent = currentIndex % count

    useEffect(() => {
        if (isStatic) return
        gsap.set([prevTextRef.current, nextTextRef.current], { z: TEXT_Z })
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        gsap.killTweensOf([flipperRef.current, prevTextRef.current, nextTextRef.current])
        const wasShowingNext = showingNextRef.current
        rotationRef.current = wasShowingNext ? 180 : 0
        gsap.set(flipperRef.current, { rotateX: 0, rotateY: 0, [flipAxis]: rotationRef.current })
        const visible = wasShowingNext ? nextTextRef : prevTextRef
        const hidden = wasShowingNext ? prevTextRef : nextTextRef
        gsap.set(visible.current, { xPercent: 0, yPercent: 0, rotateX: 0, rotateY: 0, opacity: 1 })
        gsap.set(hidden.current, { xPercent: 0, yPercent: 0, rotateX: 0, rotateY: 0, opacity: 0 })
        isAnimatingRef.current = false
    }, [isStatic, direction, flipAxis])

    const flipTo = useCallback(
        (dir: "prev" | "next", newIndex: number) => {
            const goingNext = dir === "next"
            if (isAnimatingRef.current) return
            const wasShowingNext = showingNextRef.current
            flushSync(() => {
                setCurrentIndex(newIndex)
                if (wasShowingNext) setFrontIndex(newIndex)
                else setBackIndex(newIndex)
            })
            showingNextRef.current = !wasShowingNext

            const outgoing = wasShowingNext ? nextTextRef : prevTextRef
            const incoming = wasShowingNext ? prevTextRef : nextTextRef
            const flipGoingNext = isVertical ? !goingNext : goingNext
            rotationRef.current += flipGoingNext ? 180 : -180
            const rotateValue = rotationRef.current

            if (reduce) {
                gsap.set(flipperRef.current, { [flipAxis]: rotateValue })
                gsap.set(outgoing.current, { xPercent: 0, yPercent: 0, rotateX: 0, rotateY: 0, opacity: 0 })
                gsap.set(incoming.current, { xPercent: 0, yPercent: 0, rotateX: 0, rotateY: 0, opacity: 1 })
                isAnimatingRef.current = false
                return
            }

            isAnimatingRef.current = true
            const resolvedEase = resolveEase(ease)
            const tl = gsap.timeline({
                defaults: { duration: DURATION, ease: EASE },
                onComplete: () => {
                    isAnimatingRef.current = false
                },
            })
            tl.to(flipperRef.current, { [flipAxis]: rotateValue, ease: resolvedEase, duration: 0.7 }, 0)

            const textTl = gsap.timeline()
            if (isVertical) {
                // Vertical mode reverses both text rotation and travel.
                const rotateNext = !goingNext
                const translateNext = !goingNext
                const outRotate = rotateNext ? VERTICAL_TEXT_ROTATE_DEG : -VERTICAL_TEXT_ROTATE_DEG
                const outY = translateNext ? -VERTICAL_TEXT_TRANSLATE_PERCENT * 2 : VERTICAL_TEXT_TRANSLATE_PERCENT * 2
                const inRotate = rotateNext ? -VERTICAL_TEXT_ROTATE_DEG : VERTICAL_TEXT_ROTATE_DEG
                const inY = translateNext ? VERTICAL_TEXT_TRANSLATE_PERCENT * 2 : -VERTICAL_TEXT_TRANSLATE_PERCENT * 2
                textTl.to(outgoing.current, { yPercent: outY, rotateX: outRotate, duration: VERTICAL_OUTGOING_DURATION * 1.5, ease: resolvedEase }, 0)
                textTl.to(outgoing.current, { opacity: 0, delay: -0.3, duration: 0 })
                textTl.fromTo(
                    incoming.current,
                    { yPercent: inY, rotateX: inRotate, opacity: 0 },
                    { yPercent: 0, rotateX: 0, opacity: 1, duration: VERTICAL_OUTGOING_DURATION * 1.5, ease: resolvedEase },
                    0.15
                )
            } else {
                const outRotate = goingNext ? TEXT_ROTATE_DEG : -TEXT_ROTATE_DEG
                const outX = goingNext ? TEXT_TRANSLATE_PERCENT : -TEXT_TRANSLATE_PERCENT
                const inRotate = goingNext ? -TEXT_ROTATE_DEG : TEXT_ROTATE_DEG
                const inX = goingNext ? -TEXT_TRANSLATE_PERCENT : TEXT_TRANSLATE_PERCENT
                textTl.to(outgoing.current, { xPercent: outX, rotateY: outRotate, duration: OUTGOING_DURATION * 1.5, ease: resolvedEase }, 0)
                textTl.to(outgoing.current, { opacity: 0, delay: -0.3, duration: 0 })
                textTl.fromTo(
                    incoming.current,
                    { xPercent: inX, rotateY: inRotate, opacity: 0 },
                    { xPercent: 0, rotateY: 0, opacity: 1, duration: OUTGOING_DURATION * 1.5, ease: resolvedEase },
                    0.15
                )
            }
            tl.add(textTl, 0)
        },
        [ease, flipAxis, isVertical, reduce]
    )

    const switchTo = useCallback(
        (dir: "prev" | "next") => {
            const goingNext = dir === "next"
            const visibleIndex = showingNextRef.current ? safeBack : safeFront
            const raw = visibleIndex + (goingNext ? 1 : -1)
            const next = infinite ? ((raw % count) + count) % count : raw
            if (!infinite && (next < 0 || next >= count)) return
            flipTo(dir, next)
        },
        [count, flipTo, infinite, safeBack, safeFront]
    )

    const goToIndex = useCallback(
        (target: number) => {
            if (target === safeCurrent) return
            let dir: "prev" | "next"
            if (infinite) {
                const forward = (((target - safeCurrent) % count) + count) % count
                dir = forward <= count - forward ? "next" : "prev"
            } else {
                dir = target > safeCurrent ? "next" : "prev"
            }
            flipTo(dir, target)
        },
        [count, flipTo, infinite, safeCurrent]
    )

    // Autoplay only runs while the slider is on screen and the tab is visible.
    useEffect(() => {
        if (isStatic || !autoplay || autoplayDelay <= 0 || reduce || !active) return
        const id = window.setInterval(() => switchTo("next"), autoplayDelay * 1000)
        return () => window.clearInterval(id)
    }, [isStatic, autoplay, autoplayDelay, reduce, active, switchTo])

    const rootStyle = {
        backgroundColor: bgColor,
        ["--hpx-dss-accent" as any]: accentColor,
        ...style,
    } as React.CSSProperties
    const cardStyle: React.CSSProperties = {
        width: `min(${cardWidth}px, 85cqw, ${(70 * cardWidth) / cardHeight}cqh)`,
        aspectRatio: `${cardWidth} / ${cardHeight}`,
    }
    const faceStyle: React.CSSProperties = { borderRadius: cardRadius }
    const textStyle: React.CSSProperties = { color: textColor }
    const textWrapStyle: React.CSSProperties = { fontSize: `min(${textSize}px, 10cqw)` }
    const backClass = `hpx-dss-face ${isVertical ? "hpx-dss-back-x" : "hpx-dss-back-y"}`

    // Static renderer (canvas / export): the first slide at rest, no refs, no handlers.
    if (isStatic) {
        return (
            <div className="hpx-dss-root" style={rootStyle}>
                <div className="hpx-dss-card" style={cardStyle}>
                    <div className="hpx-dss-flipper">
                        <div className="hpx-dss-face" style={faceStyle}>
                            <Media src={items[0].src} alt={items[0].text} index={0} placeholder={placeholder} placeholderColor={placeholderColor} />
                        </div>
                    </div>
                </div>
                <div className="hpx-dss-textwrap" style={textWrapStyle}>
                    <div className="hpx-dss-text" style={textStyle}>
                        {items[0].text}
                    </div>
                </div>
                <div className="hpx-dss-controls">
                    <button type="button" className="hpx-dss-btn" aria-label="Previous" disabled={!infinite}>
                        <Arrow dir="left" />
                    </button>
                    <button type="button" className="hpx-dss-btn" aria-label="Next">
                        <Arrow dir="right" />
                    </button>
                </div>
                <div className="hpx-dss-dots">
                    {items.map((item, idx) => (
                        <button key={idx} type="button" className="hpx-dss-dot" aria-label={`Go to ${item.text}`} aria-current={idx === 0} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div ref={rootRef} className="hpx-dss-root" style={rootStyle}>
            <div className="hpx-dss-card" style={cardStyle}>
                <div ref={flipperRef} className="hpx-dss-flipper">
                    <div className="hpx-dss-face" style={faceStyle}>
                        <Media src={items[safeFront].src} alt={items[safeFront].text} index={safeFront} placeholder={placeholder} placeholderColor={placeholderColor} />
                    </div>
                    <div className={backClass} style={faceStyle}>
                        <Media src={items[safeBack].src} alt={items[safeBack].text} index={safeBack} placeholder={placeholder} placeholderColor={placeholderColor} />
                    </div>
                </div>
            </div>
            <div className="hpx-dss-textwrap" style={textWrapStyle}>
                <div ref={prevTextRef} className="hpx-dss-text" style={textStyle}>
                    {items[safeFront].text}
                </div>
                <div ref={nextTextRef} className="hpx-dss-text hpx-dss-text-next" style={textStyle}>
                    {items[safeBack].text}
                </div>
            </div>
            <div className="hpx-dss-controls">
                <button
                    type="button"
                    className="hpx-dss-btn"
                    onClick={() => switchTo("prev")}
                    aria-label="Previous"
                    disabled={!infinite && safeCurrent === 0}
                >
                    <Arrow dir="left" />
                </button>
                <button
                    type="button"
                    className="hpx-dss-btn"
                    onClick={() => switchTo("next")}
                    aria-label="Next"
                    disabled={!infinite && safeCurrent === count - 1}
                >
                    <Arrow dir="right" />
                </button>
            </div>
            <div className="hpx-dss-dots">
                {items.map((item, idx) => (
                    <button
                        key={idx}
                        type="button"
                        className="hpx-dss-dot"
                        onClick={() => goToIndex(idx)}
                        aria-label={`Go to ${item.text || `slide ${idx + 1}`}`}
                        aria-current={idx === safeCurrent}
                    />
                ))}
            </div>
        </div>
    )
}

HyperiuxDimensionalSwitch.displayName = "Hyperiux Dimensional Switch"

addPropertyControls(HyperiuxDimensionalSwitch, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                text: { type: ControlType.String, title: "Text", defaultValue: "Slide" },
            },
        },
    },
    direction: {
        type: ControlType.Enum,
        title: "Flip Axis",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    infinite: { type: ControlType.Boolean, title: "Loop", defaultValue: true },
    autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: true },
    autoplayDelay: {
        type: ControlType.Number,
        title: "Delay",
        min: 1,
        max: 10,
        step: 0.1,
        unit: "s",
        defaultValue: 2.6,
        hidden: (p: Props) => !p.autoplay,
    },
    ease: {
        type: ControlType.Enum,
        title: "Flip Ease",
        options: [DEFAULT_EASE, "power4.inOut", "expo.inOut", "power2.inOut", "back.inOut(1.4)"],
        optionTitles: ["Snap", "Power 4", "Expo", "Power 2", "Back"],
        defaultValue: DEFAULT_EASE,
    },
    cardWidth: { type: ControlType.Number, title: "Card Width", min: 200, max: 1200, step: 10, unit: "px", defaultValue: 680 },
    cardHeight: { type: ControlType.Number, title: "Card Height", min: 150, max: 1000, step: 10, unit: "px", defaultValue: 460 },
    cardRadius: { type: ControlType.Number, title: "Radius", min: 0, max: 60, unit: "px", defaultValue: 16 },
    textSize: { type: ControlType.Number, title: "Text Size", min: 16, max: 200, unit: "px", defaultValue: 84 },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#ffffff" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#ff5f00" },
    bgColor: { type: ControlType.Color, title: "Background", defaultValue: "#000000" },
    placeholder: {
        type: ControlType.Enum,
        title: "Placeholder",
        options: ["gradient", "solid"],
        optionTitles: ["Gradient", "Solid"],
        defaultValue: "gradient",
        displaySegmentedControl: true,
        description: "Shown for slides without an image.",
    },
    placeholderColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#2e2e2e",
        hidden: (p: Props) => p.placeholder !== "solid",
    },
})
