import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight any
// @framerIntrinsicWidth 1200
// @framerIntrinsicHeight 560
// @framerDisableUnlink

// Bare domains like "mysite.com/case-study" are treated by the browser as relative
// paths (-> 404), so give them a protocol. Everything else is left untouched.
function normalizeLink(raw?: string): string | undefined {
    if (!raw) return undefined
    const s = String(raw).trim()
    if (!s) return undefined
    if (/^(https?:|mailto:|tel:|#|\/|\.{1,2}\/)/i.test(s)) return s
    if (/^[^\s\/]+\.[a-z]{2,}(\/|$|\?|#)/i.test(s)) return "https://" + s
    return s
}

type CardItem = {
    mediaType?: "image" | "gif" | "video"
    image?: { src: string; srcSet?: string; alt?: string } | string
    gif?: string
    video?: string
    url?: string
    title?: string
    link?: string
    backText?: string
    backColor?: string
    backTextColor?: string
}

type Props = {
    items: CardItem[]
    cardWidth: number
    cardHeight: number
    gap: number
    arcRadius: number
    tiltAmount: number
    invert: boolean
    offsetY: number
    scaleFalloff: number
    radius: number
    shadow: string
    background: string
    autoplay: boolean
    speed: number
    direction: "clockwise" | "counterclockwise"
    pauseOnHover: boolean
    drag: boolean
    wheel: boolean
    wheelVertical: boolean
    openNewTab: boolean
    autoShrink: boolean
    phoneScale: number
    phoneMaxWidth: number
    previewPhone: boolean
    backFont: React.CSSProperties
    flipDuration: number
    linkLabel: string
    previewBack: boolean
    edgeFade: number
    flipZoom: number
    ariaLabel: string
    style?: React.CSSProperties
}

const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i

type Media = { kind: "img" | "video"; src: string; srcSet?: string }

function resolveMedia(item: CardItem): Media | null {
    const type = item.mediaType || "image"
    const url = item.url ? item.url.trim() : ""
    if (url) {
        return {
            kind: type === "video" || VIDEO_RE.test(url) ? "video" : "img",
            src: url,
        }
    }
    if (type === "video")
        return item.video ? { kind: "video", src: item.video } : null
    if (type === "gif") return item.gif ? { kind: "img", src: item.gif } : null
    const img = item.image
    if (!img) return null
    if (typeof img === "string") return { kind: "img", src: img }
    return img.src ? { kind: "img", src: img.src, srcSet: img.srcSet } : null
}

// Vertical extent of the arc (centre card + the cards at both visible edges),
// used to centre the whole arc inside the frame so nothing is cut off unevenly.
function arcBounds(
    R: number,
    w: number,
    cw: number,
    ch: number,
    dir: number,
    tilt: number,
    falloff: number
) {
    const thMax = Math.min(
        Math.PI / 2,
        Math.asin(Math.min(1, (w / 2 + cw / 2) / R))
    )
    let top = Infinity
    let bottom = -Infinity
    const N = 40
    for (let k = 0; k <= N; k++) {
        const th = -thMax + (2 * thMax * k) / N
        const X = R * Math.sin(th)
        const Y = dir * R * (1 - Math.cos(th))
        const rot = dir * th * tilt
        const s = Math.max(0.4, 1 - Math.abs(X / (w / 2 || 1)) * falloff)
        const hh =
            s *
            ((ch / 2) * Math.abs(Math.cos(rot)) +
                (cw / 2) * Math.abs(Math.sin(rot)))
        top = Math.min(top, Y - hh)
        bottom = Math.max(bottom, Y + hh)
    }
    return { top, bottom, thMax }
}

/**
 * Arc Carousel
 * Cards sit on a true circle and rotate around its centre, like a fanned-out deck.
 * Supports images, GIFs and videos, autoplay drift, drag with inertia and wheel control.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ArcCarousel(props: Props) {
    const {
        items,
        cardWidth: cardWidthRaw,
        cardHeight: cardHeightRaw,
        gap: gapRaw,
        arcRadius: arcRadiusRaw,
        tiltAmount,
        invert,
        offsetY: offsetYRaw,
        scaleFalloff,
        radius: radiusRaw,
        shadow,
        background,
        autoplay,
        speed,
        pauseOnHover,
        drag,
        wheel,
        wheelVertical,
        openNewTab,
        autoShrink,
        phoneScale,
        phoneMaxWidth,
        previewPhone,
        backFont,
        flipDuration,
        linkLabel,
        previewBack,
        edgeFade,
        ariaLabel,
        style,
    } = props

    const safeItems = items && items.length > 0 ? items : []
    const n = safeItems.length

    const containerRef = React.useRef<HTMLDivElement>(null)
    const cardRefs = React.useRef<(HTMLElement | null)[]>([])
    const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([])
    const videoState = React.useRef<boolean[]>([])
    const [width, setWidth] = React.useState(1200)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const reduced =
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const canPlay = !isCanvas && !isStatic && !reduced

    // Latest props, readable from the animation loop without re-creating it
    const propsRef = React.useRef(props)
    propsRef.current = props

    const offset = React.useRef(0)
    const velocity = React.useRef(0)
    const dragging = React.useRef(false)
    const moved = React.useRef(0)
    const hovering = React.useRef(false)
    const capturedPointer = React.useRef(false)
    const heightRef = React.useRef(560)
    const zoomIdxRef = React.useRef<number | null>(null)
    const zoomP = React.useRef(0)
    const targetOffset = React.useRef<number | null>(null)

    // Which card is showing its back side (index in the items list)
    const [flipped, setFlipped] = React.useState<number | null>(null)
    const flippedRef = React.useRef<number | null>(null)
    flippedRef.current = flipped
    // i = the exact card copy that was clicked (short lists are repeated to fill the arc)
    // Glide the carousel so card copy i ends up in the middle
    const glideTo = (i: number) => {
        const g = geoRef.current
        const st = g.cardWidth + g.gap
        const total = st * countRef.current
        let a = (((i * st - offset.current) % total) + total) % total
        if (a > total / 2) a -= total
        velocity.current = 0
        targetOffset.current = offset.current + a
    }
    // Move by one card; repeated key presses add up
    const nudge = (dirSign: number) => {
        const g = geoRef.current
        const base =
            targetOffset.current !== null
                ? targetOffset.current
                : offset.current
        targetOffset.current = base + dirSign * (g.cardWidth + g.gap)
        velocity.current = 0
    }
    // i = the exact card copy that was clicked (short lists are repeated to fill the arc)
    const onFlipClick = (i: number) => {
        if (flippedRef.current === i) {
            setFlipped(null)
            return
        }
        glideTo(i)
        setFlipped(i)
    }

    // Keyboard: arrow keys move through the cards, Tab focus brings a card to the middle
    const keyboardFocus = React.useRef(false)
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault()
            if (flippedRef.current !== null) setFlipped(null)
            nudge(e.key === "ArrowRight" ? 1 : -1)
        }
    }
    const onFocusCapture = (e: React.FocusEvent) => {
        const t = e.target as HTMLElement
        let viaKeyboard = true
        try {
            viaKeyboard = t.matches(":focus-visible")
        } catch {}
        if (!viaKeyboard) return
        keyboardFocus.current = true
        const i = cardRefs.current.findIndex((el) => !!el && el.contains(t))
        if (i >= 0) glideTo(i)
    }
    const onBlurCapture = (e: React.FocusEvent) => {
        const next = e.relatedTarget as Node | null
        if (
            !containerRef.current ||
            !next ||
            !containerRef.current.contains(next)
        ) {
            keyboardFocus.current = false
        }
    }
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const cls = "ac" + uid
    React.useEffect(() => {
        if (flipped === null) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setFlipped(null)
        }
        // Tap/click anywhere outside the flipped card flips it back
        const onDown = (e: PointerEvent) => {
            const el = cardRefs.current[flipped]
            if (el && !el.contains(e.target as Node)) setFlipped(null)
        }
        document.addEventListener("keydown", onKey)
        document.addEventListener("pointerdown", onDown)
        return () => {
            document.removeEventListener("keydown", onKey)
            document.removeEventListener("pointerdown", onDown)
        }
    }, [flipped])

    // Phone: shrink the whole arc (cards, spacing, radius) by the phone scale
    const [phone, setPhone] = React.useState(false)
    React.useLayoutEffect(() => {
        if (!window.matchMedia) return
        const mq = window.matchMedia(`(max-width: ${phoneMaxWidth}px)`)
        const update = () => setPhone(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [phoneMaxWidth])
    const k = autoShrink && (isCanvas ? previewPhone : phone) ? phoneScale : 1
    const cardWidth = cardWidthRaw * k
    const cardHeight = cardHeightRaw * k
    const gap = gapRaw * k
    const arcRadius = arcRadiusRaw * k
    const offsetY = offsetYRaw * k
    const radius = radiusRaw * k

    // Geometry
    const R = Math.max(100, arcRadius)
    const dir = invert ? -1 : 1
    const step = cardWidth + gap
    const bounds = arcBounds(
        R,
        width,
        cardWidth,
        cardHeight,
        dir,
        tiltAmount,
        scaleFalloff
    )
    const yShift = -(bounds.top + bounds.bottom) / 2 + offsetY
    const halfArc = bounds.thMax * R + cardWidth
    const repeats =
        n === 0
            ? 0
            : Math.max(1, Math.ceil((2 * (halfArc + step)) / (n * step)))
    const count = n * repeats

    const widthRef = React.useRef(width)
    widthRef.current = width
    const countRef = React.useRef(count)
    countRef.current = count
    const yShiftRef = React.useRef(yShift)
    yShiftRef.current = yShift
    const canPlayRef = React.useRef(canPlay)
    canPlayRef.current = canPlay
    const geoRef = React.useRef({ R: arcRadius, cardWidth, cardHeight, gap, k })
    geoRef.current = { R: arcRadius, cardWidth, cardHeight, gap, k }

    const apply = React.useCallback(() => {
        const p = propsRef.current
        const w = widthRef.current
        const c = countRef.current
        if (c === 0) return
        const g = geoRef.current
        const Rr = Math.max(100, g.R)
        const d = p.invert ? -1 : 1
        const st = g.cardWidth + g.gap
        const total = st * c
        const ys = yShiftRef.current
        for (let i = 0; i < c; i++) {
            const el = cardRefs.current[i]
            if (!el) continue
            let a = (((i * st - offset.current) % total) + total) % total
            if (a > total / 2) a -= total
            const th = a / Rr
            const hidden = Math.abs(th) > Math.PI / 2
            const X = Rr * Math.sin(th)
            const Y = d * Rr * (1 - Math.cos(th)) + ys
            const rot = (d * th * p.tiltAmount * 180) / Math.PI
            const s = Math.max(
                0.4,
                1 - Math.abs(X / (w / 2 || 1)) * p.scaleFalloff
            )
            let sc = s
            let yy = Y
            let rr = rot
            let zi = Math.round(1000 - Math.abs(a))
            if (i === zoomIdxRef.current && zoomP.current > 0) {
                zi = 3000
                // On phone the flipped card grows (up to what fits) so the text is readable
                const Z =
                    g.k < 1
                        ? Math.max(
                              1,
                              Math.min(
                                  p.flipZoom,
                                  (w * 0.9) / g.cardWidth,
                                  (heightRef.current * 0.92) / g.cardHeight
                              )
                          )
                        : 1
                if (Z > 1) {
                    const zp = zoomP.current
                    sc = s * (1 + (Z - 1) * zp)
                    yy = Y * (1 - zp)
                    rr = rot * (1 - zp)
                }
            }
            el.style.transform = `translate3d(${X}px, ${yy}px, 0) rotate(${rr}deg) scale(${sc})`
            el.style.visibility = hidden ? "hidden" : "visible"
            // With a tight arc radius, cards would vanish at the side of the circle:
            // fade them out smoothly over the last ~20 degrees instead
            const side = Math.PI / 2 - Math.abs(th)
            const sideOpacity = side >= 0.35 ? 1 : Math.max(0, side / 0.35)

            el.style.opacity = String(sideOpacity)
            el.style.zIndex = String(zi)

            // Only play videos that are actually on screen
            const v = videoRefs.current[i]
            if (v && canPlayRef.current) {
                const vis = !hidden && Math.abs(X) < w / 2 + g.cardWidth
                if (videoState.current[i] !== vis) {
                    videoState.current[i] = vis
                    if (vis) {
                        const r = v.play()
                        if (r && r.catch) r.catch(() => {})
                    } else {
                        v.pause()
                    }
                }
            }
        }
    }, [])

    // Track container width
    React.useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return
        const update = () => {
            setWidth(el.clientWidth || 1200)
            heightRef.current = el.clientHeight || 560
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Re-apply positions whenever layout props change
    React.useLayoutEffect(() => {
        apply()
    })

    // Animation loop. Skipped on the canvas and in static rendering, and paused
    // (videos too) while the carousel is scrolled out of view.
    React.useEffect(() => {
        if (isCanvas || isStatic) return
        const el = containerRef.current
        let raf = 0
        let last = performance.now()
        let running = false
        let lastOffset = NaN

        const tick = (now: number) => {
            if (!running) return
            const dt = Math.min(64, now - last) / 1000
            last = now
            const p = propsRef.current
            if (!dragging.current) {
                if (
                    p.autoplay &&
                    !reduced &&
                    flippedRef.current === null &&
                    !keyboardFocus.current &&
                    !(p.pauseOnHover && hovering.current)
                ) {
                    // Clockwise = cards travel right on an arch (left on a smile)
                    const sign =
                        (p.direction === "clockwise" ? -1 : 1) *
                        (p.invert ? -1 : 1)
                    offset.current +=
                        sign * Math.abs(p.speed) * geoRef.current.k * dt
                }
                offset.current += velocity.current * dt
                velocity.current *= Math.exp(-4 * dt)
                if (Math.abs(velocity.current) < 1) velocity.current = 0
            }
            // Zoom progress of the flipped card, and glide to the middle
            const f = flippedRef.current
            if (f !== null) zoomIdxRef.current = f
            zoomP.current +=
                ((f !== null ? 1 : 0) - zoomP.current) *
                (1 - Math.exp(-(reduced ? 1000 : 10) * dt))
            if (f === null && zoomP.current < 0.01) {
                zoomP.current = 0
                zoomIdxRef.current = null
            }
            if (targetOffset.current !== null) {
                const diff = targetOffset.current - offset.current
                offset.current +=
                    diff * (1 - Math.exp(-(reduced ? 1000 : 9) * dt))
                velocity.current = 0
                if (Math.abs(diff) < 0.3) {
                    offset.current = targetOffset.current
                    targetOffset.current = null
                }
            }
            // Nothing moved: skip the work for this frame
            if (
                offset.current !== lastOffset ||
                zoomIdxRef.current !== null ||
                targetOffset.current !== null
            ) {
                apply()
                lastOffset = offset.current
            }
            raf = requestAnimationFrame(tick)
        }

        const start = () => {
            if (running) return
            running = true
            lastOffset = NaN
            last = performance.now()
            raf = requestAnimationFrame(tick)
        }
        const stop = () => {
            running = false
            cancelAnimationFrame(raf)
            // Pause every video; the ones in view start again when the carousel returns
            videoRefs.current.forEach((v) => v && v.pause())
            videoState.current = []
        }

        let io: IntersectionObserver | undefined
        if (el && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    const entry = entries[entries.length - 1]
                    if (entry.isIntersecting) start()
                    else stop()
                },
                { rootMargin: "100px" }
            )
            io.observe(el)
        } else {
            start()
        }
        return () => {
            if (io) io.disconnect()
            running = false
            cancelAnimationFrame(raf)
        }
    }, [isCanvas, isStatic, reduced, apply])

    // Wheel (needs a non-passive listener to prevent page scroll)
    React.useEffect(() => {
        const el = containerRef.current
        if (!el || !wheel || isCanvas) return
        const onWheel = (e: WheelEvent) => {
            const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
            if (!horizontal && !wheelVertical) return
            e.preventDefault()
            offset.current += horizontal ? e.deltaX : e.deltaY
            velocity.current = 0
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [wheel, wheelVertical, isCanvas])

    // Drag with inertia
    const lastX = React.useRef(0)
    const lastT = React.useRef(0)

    const onPointerDown = (e: React.PointerEvent) => {
        if (!drag || isCanvas) return
        dragging.current = true
        moved.current = 0
        lastX.current = e.clientX
        lastT.current = performance.now()
        velocity.current = 0
        targetOffset.current = null
        capturedPointer.current = false
    }
    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragging.current) return
        const now = performance.now()
        const dx = e.clientX - lastX.current
        const dt = Math.max(1, now - lastT.current) / 1000
        moved.current += Math.abs(dx)
        if (moved.current > 6) {
            if (!capturedPointer.current) {
                capturedPointer.current = true
                try {
                    ;(e.currentTarget as HTMLElement).setPointerCapture(
                        e.pointerId
                    )
                } catch {}
            }
            if (flippedRef.current !== null) setFlipped(null)
        }
        offset.current -= dx
        velocity.current = velocity.current * 0.6 + (-dx / dt) * 0.4
        lastX.current = e.clientX
        lastT.current = now
    }
    const onPointerUp = (e: React.PointerEvent) => {
        if (!dragging.current) return
        dragging.current = false
        if (capturedPointer.current) {
            capturedPointer.current = false
            try {
                ;(e.currentTarget as HTMLElement).releasePointerCapture(
                    e.pointerId
                )
            } catch {}
        }
    }
    const onClickCapture = (e: React.MouseEvent) => {
        // Don't follow a card link after a drag
        if (moved.current > 6) {
            e.preventDefault()
            e.stopPropagation()
            moved.current = 0
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
                    background,
                    color: "#888",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                }}
            >
                Add cards in the properties panel
            </div>
        )
    }

    const noFlipMotion = reduced || isStatic || isCanvas
    // Soft fade at the left/right edges so cards don't get cut off abruptly
    const fade = Math.min(45, Math.max(0, edgeFade))
    const fadeMask =
        fade > 0
            ? `linear-gradient(to right, transparent 0%, #000 ${fade}%, #000 ${100 - fade}%, transparent 100%)`
            : undefined
    const canvasFlipIdx = previewBack
        ? safeItems.findIndex((it) => !!(it.backText && it.backText.trim()))
        : -1
    const faceBase: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: shadow,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
    }
    const coverButton: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        margin: 0,
        padding: 0,
        border: "none",
        background: "none",
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
    }

    const cards = []
    for (let i = 0; i < count; i++) {
        const item = safeItems[i % n]
        const media = resolveMedia(item)
        const label =
            item.title ||
            (typeof item.image === "object" ? item.image?.alt : "") ||
            ""

        const cardStyle: React.CSSProperties = {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: cardWidth,
            height: cardHeight,
            marginLeft: -cardWidth / 2,
            marginTop: -cardHeight / 2,
            borderRadius: radius,
            overflow: "hidden",
            boxShadow: shadow,
            willChange: "transform",
            display: "block",
            background: "rgba(128,128,128,0.15)",
            userSelect: "none",
            WebkitUserSelect: "none",
        }

        let content: React.ReactNode
        if (media && media.kind === "video") {
            // "#t=0.001" makes the browser show the first frame while the video is paused
            const frameSrc = media.src.includes("#")
                ? media.src
                : media.src + "#t=0.001"
            content = (
                <video
                    ref={(el) => {
                        videoRefs.current[i] = el
                    }}
                    src={frameSrc}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={label || undefined}
                    style={mediaStyle}
                />
            )
        } else if (media) {
            content = (
                <img
                    src={media.src}
                    srcSet={media.srcSet}
                    alt={label}
                    draggable={false}
                    style={mediaStyle}
                />
            )
        } else {
            const type = item.mediaType || "image"
            content = (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        background: "rgba(128,128,128,0.25)",
                    }}
                >
                    {type === "video"
                        ? "Add a video"
                        : type === "gif"
                          ? "Add a GIF"
                          : "Add an image"}
                </div>
            )
        }

        const setRef = (el: HTMLElement | null) => {
            cardRefs.current[i] = el
        }

        const href = normalizeLink(item.link)
        const isDup = i >= n // repeated copy, only there to fill the arc

        // Cards with back text flip on click; the link moves to a button on the back
        const backText = item.backText ? item.backText.trim() : ""
        if (backText) {
            const isFlipped = isCanvas ? i === canvasFlipIdx : flipped === i
            const backColor = item.backColor || "#1A1A1A"
            const backTextColor = item.backTextColor || "#FFFFFF"
            cards.push(
                <div
                    key={i}
                    ref={setRef as any}
                    aria-hidden={isDup || undefined}
                    style={{
                        ...cardStyle,
                        overflow: "visible",
                        boxShadow: "none",
                        background: "none",
                        perspective: 1400,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            transformStyle: "preserve-3d",
                            WebkitTransformStyle: "preserve-3d",
                            transform: isFlipped
                                ? "rotateY(180deg)"
                                : "rotateY(0deg)",
                            transition: noFlipMotion
                                ? "none"
                                : `transform ${flipDuration}ms cubic-bezier(0.4, 0.1, 0.2, 1)`,
                        }}
                    >
                        <div
                            style={{
                                ...faceBase,
                                background: "rgba(128,128,128,0.15)",
                            }}
                        >
                            {content}
                            <button
                                type="button"
                                aria-pressed={isFlipped}
                                aria-label={
                                    "Flip card" + (label ? ": " + label : "")
                                }
                                tabIndex={isFlipped || isDup ? -1 : 0}
                                onClick={() => onFlipClick(i)}
                                style={coverButton}
                            />
                        </div>
                        <div
                            aria-hidden={!isFlipped}
                            style={{
                                ...faceBase,
                                transform: "rotateY(180deg)",
                                background: backColor,
                                color: backTextColor,
                            }}
                        >
                            <button
                                type="button"
                                aria-label="Flip card back"
                                tabIndex={isFlipped && !isDup ? 0 : -1}
                                onClick={() => onFlipClick(i)}
                                style={coverButton}
                            />
                            {/* Laid out at full size, then scaled with the card, so the text wraps the same on every screen */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    width: cardWidthRaw,
                                    height: cardHeightRaw,
                                    transform: `scale(${k})`,
                                    transformOrigin: "0 0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    textAlign: "center",
                                    boxSizing: "border-box",
                                    padding: href ? "24px 24px 68px" : 24,
                                    pointerEvents: "none",
                                    ...backFont,
                                }}
                            >
                                <div style={{ whiteSpace: "pre-wrap" }}>
                                    {backText}
                                </div>
                                {href ? (
                                    <a
                                        href={href}
                                        target={
                                            openNewTab ? "_blank" : undefined
                                        }
                                        rel={
                                            openNewTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        tabIndex={isFlipped && !isDup ? 0 : -1}
                                        draggable={false}
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            bottom: 20,
                                            transform: "translateX(-50%)",
                                            zIndex: 2,
                                            pointerEvents: "auto",
                                            padding: "9px 18px",
                                            borderRadius: 999,
                                            background: backTextColor,
                                            color: backColor,
                                            textDecoration: "none",
                                            whiteSpace: "nowrap",
                                            fontFamily: "Inter, sans-serif",
                                            fontSize: 14,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {linkLabel}
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )
            continue
        }

        cards.push(
            href ? (
                <a
                    key={i}
                    ref={setRef as any}
                    href={href}
                    target={openNewTab ? "_blank" : undefined}
                    rel={openNewTab ? "noopener noreferrer" : undefined}
                    aria-label={label || "Project"}
                    aria-hidden={isDup || undefined}
                    tabIndex={isDup ? -1 : undefined}
                    draggable={false}
                    style={cardStyle}
                >
                    {content}
                </a>
            ) : (
                <div
                    key={i}
                    ref={setRef as any}
                    aria-hidden={isDup || undefined}
                    style={cardStyle}
                >
                    {content}
                </div>
            )
        )
    }
    cardRefs.current.length = count
    videoRefs.current.length = count

    return (
        <div
            ref={containerRef}
            className={cls}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel || "Carousel"}
            onKeyDown={onKeyDown}
            onFocusCapture={onFocusCapture}
            onBlurCapture={onBlurCapture}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerEnter={() => (hovering.current = true)}
            onPointerLeave={() => {
                hovering.current = false
                if (!capturedPointer.current) dragging.current = false
            }}
            onClickCapture={onClickCapture}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                minHeight: Math.ceil(bounds.bottom - bounds.top),
                background,
                cursor: drag ? "grab" : "default",
                touchAction: "pan-y",
            }}
        >
            <style>{`.${cls}:focus-visible,.${cls} a:focus-visible,.${cls} button:focus-visible{outline:2px solid #0A84FF;outline-offset:-3px}`}</style>
            {/* Cards live in their own layer so the edge fade doesn't touch the background */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    maskImage: fadeMask,
                    WebkitMaskImage: fadeMask,
                }}
            >
                {cards}
            </div>
        </div>
    )
}

const mediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    pointerEvents: "none",
}

ArcCarousel.defaultProps = {
    items: [],
    cardWidth: 260,
    cardHeight: 360,
    gap: 24,
    arcRadius: 1800,
    tiltAmount: 1,
    invert: false,
    offsetY: 0,
    scaleFalloff: 0.1,
    radius: 20,
    shadow: "0px 18px 40px rgba(0,0,0,0.25)",
    background: "rgba(0,0,0,0)",
    autoplay: true,
    speed: 40,
    direction: "counterclockwise",
    pauseOnHover: false,
    drag: true,
    wheel: true,
    wheelVertical: false,
    openNewTab: false,
    autoShrink: true,
    phoneScale: 0.5,
    phoneMaxWidth: 809,
    previewPhone: false,
    flipDuration: 600,
    linkLabel: "View project",
    previewBack: false,
    edgeFade: 10,
    flipZoom: 1.8,
    ariaLabel: "Carousel",
}

addPropertyControls(ArcCarousel, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "gif", "video"],
                    optionTitles: ["Image", "GIF", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) =>
                        p.mediaType === "gif" || p.mediaType === "video",
                },
                gif: {
                    type: ControlType.File,
                    title: "GIF",
                    allowedFileTypes: ["gif", "webp", "apng"],
                    hidden: (p: any) => p.mediaType !== "gif",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.mediaType !== "video",
                },
                url: {
                    type: ControlType.String,
                    title: "Or URL",
                    placeholder: "https://… (image, GIF or video)",
                },
                title: { type: ControlType.String, title: "Title / alt" },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description:
                        "If Back text is set, the link becomes a button on the back.",
                },
                backText: {
                    type: ControlType.String,
                    title: "Back text",
                    displayTextArea: true,
                    placeholder: "Leave empty for no flip",
                },
                backColor: {
                    type: ControlType.Color,
                    title: "Back color",
                    defaultValue: "#1A1A1A",
                    hidden: (p: any) => !p.backText,
                },
                backTextColor: {
                    type: ControlType.Color,
                    title: "Back text color",
                    defaultValue: "#FFFFFF",
                    hidden: (p: any) => !p.backText,
                },
            },
        },
    },
    backFont: {
        type: ControlType.Font,
        title: "Back font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "20px",
    },
    linkLabel: {
        type: ControlType.String,
        title: "Link label",
        defaultValue: "View project",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card W",
        min: 80,
        max: 800,
        step: 2,
        displayStepper: true,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card H",
        min: 80,
        max: 1000,
        step: 2,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Spacing",
        min: -100,
        max: 200,
        step: 2,
    },
    arcRadius: {
        type: ControlType.Number,
        title: "Arc radius",
        min: 300,
        max: 5000,
        step: 50,
        unit: "px",
        description:
            "Smaller = tighter, more curved fan. Larger = flatter row.",
    },
    tiltAmount: {
        type: ControlType.Number,
        title: "Tilt amount",
        min: 0,
        max: 2,
        step: 0.05,
        description:
            "1 = cards turn exactly with the arc. Lower = less tilt, higher = more.",
    },
    invert: {
        type: ControlType.Boolean,
        title: "Invert curve",
        defaultValue: false,
        enabledTitle: "Smile",
        disabledTitle: "Arch",
    },
    offsetY: {
        type: ControlType.Number,
        title: "Nudge Y",
        min: -300,
        max: 300,
        step: 2,
        unit: "px",
        description:
            "The arc is centred in the frame automatically. Use this to fine-tune.",
    },
    scaleFalloff: {
        type: ControlType.Number,
        title: "Edge shrink",
        min: 0,
        max: 0.5,
        step: 0.01,
    },
    edgeFade: {
        type: ControlType.Number,
        title: "Edge fade",
        min: 0,
        max: 40,
        step: 1,
        unit: "%",
        description:
            "Fades cards in and out at the left and right edges. 0 = off.",
    },
    radius: {
        type: ControlType.Number,
        title: "Corner radius",
        min: 0,
        max: 100,
        step: 1,
    },
    shadow: { type: ControlType.BoxShadow, title: "Shadow" },
    background: { type: ControlType.Color, title: "Background" },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 300,
        step: 5,
        unit: "px/s",
        hidden: (p: any) => !p.autoplay,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Counter-clockwise"],
        displaySegmentedControl: true,
        defaultValue: "counterclockwise",
        description: "Which way the cards travel around the arc.",
        hidden: (p: any) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Hover pause",
        defaultValue: false,
        hidden: (p: any) => !p.autoplay,
    },
    drag: { type: ControlType.Boolean, title: "Drag", defaultValue: true },
    wheel: { type: ControlType.Boolean, title: "Wheel", defaultValue: true },
    wheelVertical: {
        type: ControlType.Boolean,
        title: "Vertical wheel",
        defaultValue: false,
        hidden: (p: any) => !p.wheel,
    },
    openNewTab: {
        type: ControlType.Boolean,
        title: "New tab",
        defaultValue: false,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Accessible label",
        defaultValue: "Carousel",
        description: 'Read out by screen readers, e.g. "Selected projects".',
    },
    flipDuration: {
        type: ControlType.Number,
        title: "Flip speed",
        min: 150,
        max: 1500,
        step: 50,
        unit: "ms",
    },
    flipZoom: {
        type: ControlType.Number,
        title: "Phone flip zoom",
        min: 1,
        max: 3,
        step: 0.1,
        description:
            "On phone, the flipped card grows by up to this much (it never grows past the frame). 1 = no zoom.",
        hidden: (p: any) => !p.autoShrink,
    },
    previewBack: {
        type: ControlType.Boolean,
        title: "Preview back",
        defaultValue: false,
        description:
            "Shows the back of the first card that has back text, on the canvas only.",
    },
    autoShrink: {
        type: ControlType.Boolean,
        title: "Shrink on phone",
        defaultValue: true,
        description:
            "Scales card size, spacing, arc radius and corners on phone-width screens.",
    },
    phoneScale: {
        type: ControlType.Number,
        title: "Phone scale",
        min: 0.2,
        max: 1,
        step: 0.05,
        hidden: (p: any) => !p.autoShrink,
    },
    phoneMaxWidth: {
        type: ControlType.Number,
        title: "Phone max W",
        min: 300,
        max: 1200,
        step: 1,
        unit: "px",
        description:
            "Screens this wide or narrower count as phone. Framer default: 809.",
        hidden: (p: any) => !p.autoShrink,
    },
    previewPhone: {
        type: ControlType.Boolean,
        title: "Preview phone",
        defaultValue: false,
        description:
            "Shows the shrunk size on the canvas only. The live site uses the screen width.",
        hidden: (p: any) => !p.autoShrink,
    },
})
