import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
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
 * Spotlight Quotes
 * Center card is in focus, neighbours scale down, fade and blur.
 * Quote, author and arrow buttons sit below.
 *
 * Motion model: one continuous "position" value drives every card.
 * Dragging follows the pointer 1:1, releasing keeps the momentum, and a
 * critically damped spring settles on the nearest card. Styles are written
 * straight to the DOM each frame, so React never re-renders during motion.
 */

type ImageValue = { src: string; srcSet?: string; alt?: string }

type Testimonial = {
    image?: ImageValue
    quote: string
    name: string
    role: string
}

type Props = {
    testimonials: Testimonial[]
    cardWidth: number
    cardHeight: number
    cardRadius: number
    cardGap: number
    scaleStep: number
    sideOpacity: number
    sideBlur: number
    sideRotation: number
    placeholderColor: string
    quoteFont: React.CSSProperties
    nameFont: React.CSSProperties
    roleFont: React.CSSProperties
    quoteColor: string
    nameColor: string
    roleColor: string
    contentGap: number
    controlsGap: number
    buttonSize: number
    buttonColor: string
    buttonIconColor: string
    loop: boolean
    startIndex: number
    autoplay: boolean
    interval: number
    background: string
    padding: string
    style?: React.CSSProperties
}

type Cfg = {
    n: number
    loop: boolean
    cardWidth: number
    cardGap: number
    scaleStep: number
    sideOpacity: number
    sideBlur: number
    sideRotation: number
    fit: number
}

type DragState = {
    id: number
    startX: number
    startPos: number
    moved: boolean
    samples: { x: number; t: number }[]
}

// How many cards are shown on each side of the active one
const MAX_VISIBLE = 2

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

const mod = (a: number, n: number) => ((a % n) + n) % n
const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v))

// Shortest signed distance on a ring, in [-n/2, n/2)
const norm = (d: number, n: number) => {
    const m = mod(d, n)
    return m >= n / 2 ? m - n : m
}

// Piecewise linear lookup
function interp(a: number, pts: [number, number][]) {
    if (a <= pts[0][0]) return pts[0][1]
    for (let i = 1; i < pts.length; i++) {
        const [x1, y1] = pts[i]
        if (a <= x1) {
            const [x0, y0] = pts[i - 1]
            return y0 + (y1 - y0) * ((a - x0) / (x1 - x0 || 1))
        }
    }
    return pts[pts.length - 1][1]
}

// Everything a card needs for a given (fractional) distance from the center
function cardVisuals(d: number, c: Cfg) {
    const a = Math.abs(d)
    const ac = Math.min(a, MAX_VISIBLE + 1)
    const dir = d < 0 ? -1 : 1

    const w = (k: number) => c.cardWidth * Math.pow(c.scaleStep, k)
    const step = (k: number) => w(k - 1) / 2 + c.cardGap + w(k) / 2

    const whole = Math.floor(ac)
    let x = 0
    for (let k = 1; k <= whole; k++) x += step(k)
    x += (ac - whole) * step(whole + 1)

    const scale = Math.pow(c.scaleStep, ac) * c.fit

    // In loop mode a card must be invisible where it wraps around the ring
    const fadeEnd = c.loop
        ? Math.max(1.01, Math.min(MAX_VISIBLE + 1, c.n / 2))
        : MAX_VISIBLE + 1
    const base: [number, number][] = [
        [0, 1],
        [1, c.sideOpacity],
        [2, c.sideOpacity * 0.6],
    ]
    const pts = base.filter((p) => p[0] < fadeEnd)
    pts.push([fadeEnd, 0])
    const opacity = interp(a, pts)

    const b = c.sideBlur || 0
    const blur = interp(ac, [
        [0, 0],
        [1, b],
        [2, b * 1.5],
        [3, b * 1.5],
    ])

    const rotate = -dir * Math.min(ac, 1) * (c.sideRotation || 0)

    return {
        x: dir * x * c.fit,
        scale,
        opacity,
        blur,
        rotate,
        z: Math.round(100 - a * 10),
    }
}

function transformString(v: ReturnType<typeof cardVisuals>) {
    return v.rotate
        ? `translate3d(${v.x}px, 0, 0) scale(${v.scale}) rotateY(${v.rotate}deg)`
        : `translate(${v.x}px, 0) scale(${v.scale})`
}

function Arrow({
    direction,
    size,
}: {
    direction: "left" | "right"
    size: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {direction === "right" ? (
                <>
                    <path d="M3 8h10" />
                    <path d="M9 4l4 4-4 4" />
                </>
            ) : (
                <>
                    <path d="M13 8H3" />
                    <path d="M7 4L3 8l4 4" />
                </>
            )}
        </svg>
    )
}

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 580
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SpotlightQuotes(props: Props) {
    const {
        testimonials,
        cardWidth,
        cardHeight,
        cardRadius,
        cardGap,
        scaleStep,
        sideOpacity,
        sideBlur,
        sideRotation,
        placeholderColor,
        quoteFont,
        nameFont,
        roleFont,
        quoteColor,
        nameColor,
        roleColor,
        contentGap,
        controlsGap,
        buttonSize,
        buttonColor,
        buttonIconColor,
        loop,
        startIndex,
        autoplay,
        interval,
        background,
        padding,
        style,
    } = props

    const items = testimonials || []
    const n = items.length
    // True on the Framer canvas and in exports: no animation, no continuous effects
    const isStatic = useIsStaticRenderer()

    const startPos = clamp((startIndex || 1) - 1, 0, Math.max(0, n - 1))

    // React state only for things that change per card, never per frame
    const [active, setActive] = useState(Math.round(startPos))
    const [paused, setPaused] = useState(false)
    const [width, setWidth] = useState(0)
    const [reduceMotion, setReduceMotion] = useState(false)

    // Motion state lives in refs
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const posRef = useRef(startPos)
    const targetRef = useRef(startPos)
    const velRef = useRef(0)
    const idxRef = useRef(Math.round(startPos))
    const rafRef = useRef<number | null>(null)
    const lastT = useRef(0)
    const dragRef = useRef<DragState | null>(null)
    const draggingRef = useRef(false)
    const suppressClick = useRef(false)
    const reduceRef = useRef(false)
    const staticRef = useRef(false)
    staticRef.current = isStatic
    const wheelTimer = useRef<number | null>(null)

    // Geometry
    const fit =
        width > 0 ? Math.max(0.3, Math.min(1, (width - 32) / cardWidth)) : 1
    const cfg = useRef<Cfg>({} as Cfg)
    cfg.current = {
        n,
        loop,
        cardWidth,
        cardGap,
        scaleStep,
        sideOpacity,
        sideBlur,
        sideRotation,
        fit,
    }

    const stepPx = () => {
        const c = cfg.current
        return Math.max(
            40,
            (c.cardWidth / 2 + c.cardGap + (c.cardWidth * c.scaleStep) / 2) *
                c.fit
        )
    }

    // Write the current position to every card (no React involved)
    const apply = () => {
        const c = cfg.current
        const p = posRef.current
        for (let i = 0; i < c.n; i++) {
            const el = cardRefs.current[i]
            if (!el) continue
            const d = c.loop ? norm(i - p, c.n) : i - p
            const v = cardVisuals(d, c)
            el.style.transform = transformString(v)
            el.style.opacity = String(v.opacity)
            el.style.filter = v.blur > 0.05 ? `blur(${v.blur}px)` : "none"
            el.style.zIndex = String(v.z)
            el.style.visibility = v.opacity < 0.01 ? "hidden" : "visible"
        }
        const idx = c.loop
            ? mod(Math.round(p), c.n)
            : clamp(Math.round(p), 0, Math.max(0, c.n - 1))
        if (idx !== idxRef.current) {
            idxRef.current = idx
            setActive(idx)
        }
    }

    // Promote cards to their own layers only while they move
    const setWillChange = (on: boolean) => {
        for (const el of cardRefs.current) {
            if (el)
                el.style.willChange = on ? "transform, opacity, filter" : "auto"
        }
    }

    const stopLoop = () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        rafRef.current = null
        setWillChange(false)
    }

    const tick = (now: number) => {
        const dt = Math.min(
            0.032,
            Math.max(0.001, (now - lastT.current) / 1000)
        )
        lastT.current = now

        if (!draggingRef.current) {
            // Critically damped spring, two sub steps for stability
            const k = 120
            const damp = 2 * Math.sqrt(k)
            const h = dt / 2
            for (let s = 0; s < 2; s++) {
                const acc =
                    -k * (posRef.current - targetRef.current) -
                    damp * velRef.current
                velRef.current += acc * h
                posRef.current += velRef.current * h
            }
            if (
                Math.abs(posRef.current - targetRef.current) < 0.0004 &&
                Math.abs(velRef.current) < 0.002
            ) {
                posRef.current = targetRef.current
                velRef.current = 0
                apply()
                stopLoop()
                return
            }
        }
        apply()
        rafRef.current = requestAnimationFrame(tick)
    }

    const startLoop = () => {
        if (rafRef.current !== null) return
        lastT.current = performance.now()
        setWillChange(true)
        rafRef.current = requestAnimationFrame(tick)
    }

    const setTarget = (t: number) => {
        const c = cfg.current
        if (!c.loop) t = clamp(t, 0, Math.max(0, c.n - 1))
        targetRef.current = t
        if (reduceRef.current || staticRef.current) {
            posRef.current = t
            velRef.current = 0
            apply()
            return
        }
        startLoop()
    }

    const step = (dir: number) => {
        const c = cfg.current
        if (c.n < 2) return
        setTarget(Math.round(targetRef.current) + dir)
    }
    const next = () => step(1)
    const prev = () => step(-1)

    // Respect reduced motion
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        reduceRef.current = mq.matches
        setReduceMotion(mq.matches)
        const onChange = (e: MediaQueryListEvent) => {
            reduceRef.current = e.matches
            setReduceMotion(e.matches)
        }
        mq.addEventListener("change", onChange)
        return () => mq.removeEventListener("change", onChange)
    }, [])

    // Measure width so the stage can shrink on small screens
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            setWidth(Math.round(entries[0].contentRect.width))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Reset when the start index / count / loop changes in the Framer panel
    useEffect(() => {
        const p = clamp((startIndex || 1) - 1, 0, Math.max(0, n - 1))
        posRef.current = p
        targetRef.current = p
        velRef.current = 0
        idxRef.current = Math.round(p)
        setActive(Math.round(p))
    }, [startIndex, n, loop])

    // Re-apply after every commit so geometry changes are always reflected
    useIsoLayoutEffect(() => {
        apply()
    })

    // Trackpad / horizontal wheel scrolling follows the pointer smoothly
    useEffect(() => {
        const el = stageRef.current
        if (!el || isStatic) return
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
            e.preventDefault()
            const c = cfg.current
            draggingRef.current = true
            let p = posRef.current + e.deltaX / stepPx()
            if (!c.loop) p = clamp(p, -0.3, c.n - 1 + 0.3)
            posRef.current = p
            velRef.current = 0
            startLoop()
            if (wheelTimer.current !== null)
                window.clearTimeout(wheelTimer.current)
            wheelTimer.current = window.setTimeout(() => {
                draggingRef.current = false
                setTarget(Math.round(posRef.current))
            }, 100)
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [isStatic])

    // Cleanup
    useEffect(() => {
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            if (wheelTimer.current !== null)
                window.clearTimeout(wheelTimer.current)
        }
    }, [])

    // Autoplay (never runs on the canvas, respects reduced motion)
    useEffect(() => {
        if (!autoplay || paused || isStatic || reduceMotion || n < 2) return
        const id = window.setInterval(
            () => {
                const c = cfg.current
                const t = Math.round(targetRef.current)
                setTarget(!c.loop && t >= c.n - 1 ? 0 : t + 1)
            },
            Math.max(1, interval) * 1000
        )
        return () => window.clearInterval(id)
    }, [autoplay, paused, isStatic, reduceMotion, n, interval, active])

    // Drag / swipe
    const onPointerDown = (e: React.PointerEvent) => {
        if (staticRef.current) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        dragRef.current = {
            id: e.pointerId,
            startX: e.clientX,
            startPos: posRef.current,
            moved: false,
            samples: [{ x: e.clientX, t: performance.now() }],
        }
    }

    const onPointerMove = (e: React.PointerEvent) => {
        const d = dragRef.current
        if (!d || d.id !== e.pointerId) return
        const dx = e.clientX - d.startX
        if (!d.moved) {
            if (Math.abs(dx) < 6) return
            d.moved = true
            draggingRef.current = true
            try {
                stageRef.current?.setPointerCapture(e.pointerId)
            } catch (err) {}
            // Re-base so the drag starts without a jump
            d.startX = e.clientX
            d.startPos = posRef.current
            velRef.current = 0
            startLoop()
        }
        const c = cfg.current
        let p = d.startPos - (e.clientX - d.startX) / stepPx()
        if (!c.loop) {
            const max = c.n - 1
            if (p < 0) p = p * 0.35
            else if (p > max) p = max + (p - max) * 0.35
        }
        posRef.current = p

        const now = performance.now()
        d.samples.push({ x: e.clientX, t: now })
        while (d.samples.length > 2 && now - d.samples[0].t > 100) {
            d.samples.shift()
        }
    }

    const endDrag = () => {
        const d = dragRef.current
        dragRef.current = null
        if (!d || !d.moved) return
        draggingRef.current = false
        suppressClick.current = true
        window.setTimeout(() => {
            suppressClick.current = false
        }, 0)

        const s = d.samples
        let v = 0
        if (s.length >= 2) {
            const a = s[0]
            const b = s[s.length - 1]
            const dt = b.t - a.t
            if (dt > 0 && performance.now() - b.t < 80) {
                v = (-((b.x - a.x) / dt) * 1000) / stepPx()
            }
        }
        v = clamp(v, -12, 12)
        velRef.current = v
        const base = Math.round(posRef.current)
        setTarget(
            clamp(Math.round(posRef.current + v * 0.12), base - 3, base + 3)
        )
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            next()
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            prev()
        }
    }

    if (n === 0) {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 200,
                    color: "#999",
                    fontFamily: "sans-serif",
                    fontSize: 14,
                }}
            >
                Add testimonials in the properties panel
            </div>
        )
    }

    const current = Math.min(active, n - 1)
    const canPrev = loop ? n > 1 : current > 0
    const canNext = loop ? n > 1 : current < n - 1

    // Edge to edge width of the visible card row (text matches this)
    const widthAt = (k: number) => cardWidth * Math.pow(scaleStep, k)
    const posAt = (k: number) => {
        let x = 0
        for (let i = 1; i <= k; i++) {
            x += widthAt(i - 1) / 2 + cardGap + widthAt(i) / 2
        }
        return x
    }
    const naturalRowWidth = 2 * posAt(MAX_VISIBLE) + widthAt(MAX_VISIBLE)
    const rowWidth = naturalRowWidth * fit

    const noMotion = reduceMotion || isStatic

    const textStyle = (on: boolean): React.CSSProperties => ({
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(8px)",
        transition: noMotion
            ? "none"
            : on
              ? "opacity 0.35s ease-out 0.15s, transform 0.35s ease-out 0.15s"
              : "opacity 0.15s ease-out, transform 0.15s ease-out",
        pointerEvents: on ? "auto" : "none",
        userSelect: on ? "auto" : "none",
    })

    const btnStyle = (enabled: boolean): React.CSSProperties => ({
        width: buttonSize,
        height: buttonSize,
        borderRadius: "50%",
        border: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        background: buttonColor,
        opacity: enabled ? 1 : 0.35,
        color: buttonIconColor,
        cursor: enabled ? "pointer" : "not-allowed",
        transition: noMotion
            ? "none"
            : "opacity 0.2s ease, transform 0.15s ease",
    })

    return (
        <div
            ref={rootRef}
            className="tc-root"
            role="region"
            aria-roledescription="carousel"
            aria-label="Testimonials"
            tabIndex={0}
            onKeyDown={onKeyDown}
            onMouseEnter={autoplay ? () => setPaused(true) : undefined}
            onMouseLeave={autoplay ? () => setPaused(false) : undefined}
            style={{
                ...style,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                background,
                padding,
            }}
        >
            <style>{`
                .tc-root:focus-visible { outline: 2px solid ${buttonColor}; outline-offset: 4px; }
                .tc-btn:focus-visible { outline: 2px solid ${buttonColor}; outline-offset: 2px; }
                ${isStatic ? "" : ".tc-btn:not(:disabled):hover { transform: scale(1.06); } .tc-btn:not(:disabled):active { transform: scale(0.94); }"}
            `}</style>

            {/* Card stage */}
            <div
                ref={stageRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{
                    position: "relative",
                    width: "100%",
                    height: cardHeight * fit,
                    overflow: "hidden",
                    touchAction: "pan-y",
                    isolation: "isolate",
                    userSelect: "none",
                    cursor: "grab",
                    perspective: sideRotation ? 1200 : undefined,
                }}
            >
                {/* Gives the stage a real width when the component is set to Fit */}
                <div
                    aria-hidden="true"
                    style={{
                        width: naturalRowWidth,
                        maxWidth: "100%",
                        height: 0,
                        pointerEvents: "none",
                    }}
                />
                {items.map((t, i) => {
                    const d = loop
                        ? norm(i - posRef.current, n)
                        : i - posRef.current
                    const v = cardVisuals(d, cfg.current)
                    const isActive = i === current

                    return (
                        <div
                            key={i}
                            ref={(el) => {
                                cardRefs.current[i] = el
                            }}
                            aria-hidden={!isActive}
                            onClick={() => {
                                if (suppressClick.current) return
                                const c = cfg.current
                                const base = Math.round(posRef.current)
                                const dist = c.loop
                                    ? norm(i - base, c.n)
                                    : i - base
                                if (dist !== 0) setTarget(base + dist)
                            }}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: cardWidth,
                                height: cardHeight,
                                marginLeft: -cardWidth / 2,
                                marginTop: -cardHeight / 2,
                                transform: transformString(v),
                                opacity: v.opacity,
                                filter:
                                    v.blur > 0.05
                                        ? `blur(${v.blur}px)`
                                        : "none",
                                zIndex: v.z,
                                visibility:
                                    v.opacity < 0.01 ? "hidden" : "visible",
                                cursor: isActive ? "inherit" : "pointer",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: cardRadius,
                                    overflow: "hidden",
                                    background: placeholderColor,
                                }}
                            >
                                {t.image?.src ? (
                                    <img
                                        src={t.image.src}
                                        srcSet={t.image.srcSet}
                                        alt={t.image.alt || t.name || ""}
                                        draggable={false}
                                        decoding="async"
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            pointerEvents: "none",
                                            userSelect: "none",
                                        }}
                                    />
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Quotes (stacked so the height never jumps between slides) */}
            <div
                aria-live={autoplay ? "off" : "polite"}
                style={{
                    display: "grid",
                    width: "100%",
                    maxWidth: rowWidth,
                    marginTop: contentGap,
                    justifyItems: "center",
                    alignItems: "center",
                }}
            >
                {items.map((t, i) => (
                    <p
                        key={i}
                        aria-hidden={i !== current}
                        style={{
                            gridArea: "1 / 1",
                            margin: 0,
                            color: quoteColor,
                            ...quoteFont,
                            textAlign: "center",
                            ...textStyle(i === current),
                        }}
                    >
                        {t.quote}
                    </p>
                ))}
            </div>

            {/* Author */}
            <div
                style={{
                    display: "grid",
                    marginTop: 20,
                    justifyItems: "center",
                }}
            >
                {items.map((t, i) => (
                    <div
                        key={i}
                        aria-hidden={i !== current}
                        style={{
                            gridArea: "1 / 1",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 2,
                            textAlign: "center",
                            ...textStyle(i === current),
                            pointerEvents: "none",
                        }}
                    >
                        <span style={{ color: nameColor, ...nameFont }}>
                            {t.name}
                        </span>
                        <span style={{ color: roleColor, ...roleFont }}>
                            {t.role}
                        </span>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: controlsGap,
                }}
            >
                <button
                    type="button"
                    className="tc-btn"
                    aria-label="Previous testimonial"
                    disabled={!canPrev}
                    onClick={prev}
                    style={btnStyle(canPrev)}
                >
                    <Arrow
                        direction="left"
                        size={Math.round(buttonSize * 0.45)}
                    />
                </button>
                <button
                    type="button"
                    className="tc-btn"
                    aria-label="Next testimonial"
                    disabled={!canNext}
                    onClick={next}
                    style={btnStyle(canNext)}
                >
                    <Arrow
                        direction="right"
                        size={Math.round(buttonSize * 0.45)}
                    />
                </button>
            </div>
        </div>
    )
}

const PLACEHOLDER_QUOTE =
    "Lorem ipsum dolor sit amet consectetur. Platea cursus convallis senectus pulvinar nibh quam euismod. Leo sit malesuada est quisque"

addPropertyControls(SpotlightQuotes, {
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                    defaultValue: PLACEHOLDER_QUOTE,
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "John Doe",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Designer",
                },
            },
        },
        defaultValue: [
            { quote: PLACEHOLDER_QUOTE, name: "John Doe", role: "Designer" },
            { quote: PLACEHOLDER_QUOTE, name: "Jane Smith", role: "Developer" },
            { quote: PLACEHOLDER_QUOTE, name: "Alex Johnson", role: "Founder" },
            { quote: PLACEHOLDER_QUOTE, name: "Sam Taylor", role: "Marketer" },
            {
                quote: PLACEHOLDER_QUOTE,
                name: "Chris Lee",
                role: "Product Manager",
            },
        ],
    },

    // Cards
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 240,
        min: 80,
        max: 600,
        step: 1,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 292,
        min: 80,
        max: 800,
        step: 1,
        unit: "px",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 12,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    scaleStep: {
        type: ControlType.Number,
        title: "Side Scale",
        defaultValue: 0.85,
        min: 0.4,
        max: 1,
        step: 0.01,
    },
    sideOpacity: {
        type: ControlType.Number,
        title: "Side Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
    },
    sideBlur: {
        type: ControlType.Number,
        title: "Side Blur",
        defaultValue: 4,
        min: 0,
        max: 30,
        step: 0.5,
        unit: "px",
    },
    sideRotation: {
        type: ControlType.Number,
        title: "Side Rotate",
        defaultValue: 0,
        min: 0,
        max: 60,
        step: 1,
        unit: "°",
    },
    placeholderColor: {
        type: ControlType.Color,
        title: "Placeholder",
        defaultValue: "#D9D9D9",
    },

    // Text
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.35em",
        },
    },
    quoteColor: {
        type: ControlType.Color,
        title: "Quote Color",
        defaultValue: "#000000",
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            lineHeight: "1.4em",
        },
    },
    nameColor: {
        type: ControlType.Color,
        title: "Name Color",
        defaultValue: "#000000",
    },
    roleFont: {
        type: ControlType.Font,
        title: "Role Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            lineHeight: "1.4em",
        },
    },
    roleColor: {
        type: ControlType.Color,
        title: "Role Color",
        defaultValue: "#9A9A9A",
    },

    // Layout
    contentGap: {
        type: ControlType.Number,
        title: "Cards to Quote",
        defaultValue: 44,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
    },
    controlsGap: {
        type: ControlType.Number,
        title: "Quote to Controls",
        defaultValue: 36,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
    },

    // Buttons
    buttonSize: {
        type: ControlType.Number,
        title: "Button Size",
        defaultValue: 40,
        min: 24,
        max: 80,
        step: 1,
        unit: "px",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button",
        defaultValue: "#000000",
    },
    buttonIconColor: {
        type: ControlType.Color,
        title: "Button Icon",
        defaultValue: "#FFFFFF",
    },

    // Behavior
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start At",
        defaultValue: 1,
        min: 1,
        step: 1,
        displayStepper: true,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 5,
        min: 1,
        max: 30,
        step: 0.5,
        unit: "s",
        hidden: (props: any) => !props.autoplay,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(255, 255, 255, 0)",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px",
    },
})
