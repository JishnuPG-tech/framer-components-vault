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


type Picture = { src?: string; srcSet?: string; alt?: string }
type Slide = { image?: Picture | string; title?: string }
interface Props {
    width?: number | string
    height?: number | string
    items?: Slide[]
    curve?: number
    autoplay?: boolean
    speed?: number
    direction?: "Left" | "Right"
    showCaptions?: boolean
    showNumbers?: boolean
    advanced?: boolean
    cardWidth?: number
    cardHeight?: number
    gap?: number
    radius?: number
    momentum?: number
    paper?: string
    cardBorder?: string
    font?: React.CSSProperties
    captionSize?: number
    captionWeight?: number
    captionColor?: string
    numberSize?: number
    captionPadding?: number
    captionFade?: number
    style?: React.CSSProperties
}
const STARTER_SLIDES: Slide[] = [
    { image: { src: "https://framerusercontent.com/images/lposkZS4I2vcKhxqwVabLOcggzA.png" }, title: "Cantilever" },
    { image: { src: "https://framerusercontent.com/images/eXw2idppiJclVwjIvU3A1yn9eE.png" }, title: "Soft corners" },
    { image: { src: "https://framerusercontent.com/images/PfpkOoVAhfwjsvEZ9nZ3j3Ecjg.png" }, title: "Contour" },
    { image: { src: "https://framerusercontent.com/images/DtvGbqfUVJt71Hr5EIJ29YdCwA.png" }, title: "Repetition" },
    { image: { src: "https://framerusercontent.com/images/ibyckr8f9vkFh5YwhsSuiPo.png" }, title: "Passage" },
    { image: { src: "https://framerusercontent.com/images/oQa3ytREFHQIDtSF0q2cwqNZ0Q.png" }, title: "Elevation" },
    { image: { src: "https://framerusercontent.com/images/DtvGbqfUVJt71Hr5EIJ29YdCwA.png" }, title: "Study" },
    { image: { src: "https://framerusercontent.com/images/EEujJ6Bc6bGS74e0ISWdwINdKk.png" }, title: "Study" },
]
const DEFAULTS = {
    curve: 0.4, autoplay: true, speed: 32, direction: "Left" as const,
    showCaptions: true, showNumbers: true, advanced: false,
    cardWidth: 250, cardHeight: 340, gap: 36, radius: 14, momentum: 0.92,
    paper: "rgb(0, 0, 0)", cardBorder: "rgba(255, 255, 255, 0.02)",
    captionSize: 14, captionWeight: 500, captionColor: "#ffffff",
    numberSize: 12, captionPadding: 14, captionFade: 0.55,
}
const PORTABLE_FONT = '"Curved Carrousel Inter", Inter, sans-serif'
const FONT_FILES = [
    { weight: "400", url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf" },
    { weight: "500", url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf" },
]
let fontTask: Promise<void> | undefined
const imageTasks = new Map<string, Promise<HTMLImageElement | null>>()
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const modulo = (v: number, total: number) => ((v % total) + total) % total
function dimension(value: unknown, backup: number): string | number {
    if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : backup
    if (typeof value === "string") {
        const v = value.trim()
        if (!v || /^(auto|fit-content|max-content|min-content|initial|inherit|unset)$/i.test(v) || /^0(?:\.0+)?(?:px|%|em|rem|vh|vw)?$/i.test(v)) return backup
        return v
    }
    return backup
}
function sourceOf(value: Slide["image"], fallback: Picture): Picture {
    const candidate = typeof value === "string" ? { src: value } : value
    return candidate?.src && /^(https?:\/\/|data:image\/|blob:)/i.test(candidate.src) ? candidate : fallback
}
function preloadFont(): Promise<void> {
    if (!fontTask) {
        fontTask = typeof FontFace === "undefined" || typeof document === "undefined" ? Promise.resolve() :
            Promise.all(FONT_FILES.map(async entry => {
                try {
                    const face = new FontFace("Curved Carrousel Inter", 'url("' + entry.url + '")', { weight: entry.weight, style: "normal", display: "swap" })
                    document.fonts.add(await face.load())
                } catch { /* Keep the readable system fallback when offline. */ }
            })).then(() => undefined)
    }
    return fontTask
}
function preloadImage(src: string): Promise<HTMLImageElement | null> {
    const cached = imageTasks.get(src)
    if (cached) return cached
    const pending = new Promise<HTMLImageElement | null>(resolve => {
        const image = new Image()
        image.decoding = "async"
        const done = (result: HTMLImageElement | null) => {
            image.onload = null
            image.onerror = null
            resolve(result)
        }
        image.onload = () => done(image.naturalWidth && image.naturalHeight ? image : null)
        image.onerror = () => done(null)
        image.src = src
    })
    imageTasks.set(src, pending)
    if (imageTasks.size > 64) imageTasks.delete(imageTasks.keys().next().value as string)
    return pending
}
function colorIn(host: HTMLElement, value: string) {
    const probe = document.createElement("span")
    probe.style.color = value
    probe.style.position = "absolute"
    probe.style.visibility = "hidden"
    host.appendChild(probe)
    const result = getComputedStyle(probe).color
    probe.remove()
    return result
}
function outline(ctx: CanvasRenderingContext2D, x: number, w: number, h: number, radius: number) {
    const r = clamp(radius, 0, Math.min(w, h) / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, 0)
    ctx.lineTo(x + w - r, 0)
    ctx.quadraticCurveTo(x + w, 0, x + w, r)
    ctx.lineTo(x + w, h - r)
    ctx.quadraticCurveTo(x + w, h, x + w - r, h)
    ctx.lineTo(x + r, h)
    ctx.quadraticCurveTo(x, h, x, h - r)
    ctx.lineTo(x, r)
    ctx.quadraticCurveTo(x, 0, x + r, 0)
    ctx.closePath()
}
const srOnly: React.CSSProperties = { position: "absolute", width: 1, height: 1,
    overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap", margin: 0 }

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1392
 * @framerIntrinsicHeight 520
 */
export default function CurvedCarousel(props: Props) {
    const supplied: Partial<Props> = Object.fromEntries(Object.entries(props).filter(([, value]) => value !== null && value !== undefined))
    const p = { ...DEFAULTS, ...supplied }
    const slides = React.useMemo(() => {
        const input = Array.isArray(props.items) && props.items.length ? props.items : STARTER_SLIDES
        return input.slice(0, 30).map((slide, i) => {
            const fallback = STARTER_SLIDES[i % STARTER_SLIDES.length]
            return { title: slide?.title ?? fallback.title ?? "Study",
                image: sourceOf(slide?.image, fallback.image as Picture) }
        })
    }, [props.items])
    const root = React.useRef<HTMLDivElement>(null)
    const canvas = React.useRef<HTMLCanvasElement>(null)
    const texture = React.useRef<{ image: HTMLCanvasElement; scale: number; width: number; height: number } | null>(null)
    const drawing = React.useRef<() => void>(() => {})
    const motion = React.useRef({ offset: 0, velocity: 0, pointer: -1, x: 0, time: 0, resume: 0, keyboard: false })
    const [size, setSize] = React.useState({ width: 1392, height: 520 })
    const [ready, setReady] = React.useState(false)
    const [dragging, setDragging] = React.useState(false)
    const [focusVisible, setFocusVisible] = React.useState(false)
    const [paused, setPaused] = React.useState(false)
    const [reduced, setReduced] = React.useState(false)
    const [inView, setInView] = React.useState(true)
    const [pageVisible, setPageVisible] = React.useState(true)
    const isStatic = useIsStaticRenderer()
    const instructions = React.useId()
    const scale = Math.min(1, Math.max(120, size.width * 0.64) / Math.max(1, p.cardWidth), Math.max(110, size.height - 150) / Math.max(1, p.cardHeight))
    const w = Math.max(80, p.cardWidth * scale)
    const h = Math.max(90, p.cardHeight * scale)
    const pitch = w + Math.max(8, p.gap * scale)
    const total = slides.length * pitch
    const inset = Math.max(0, p.captionPadding)
    const fadeHeight = Math.max(92, inset + Math.max(p.showCaptions ? p.captionSize : 0, p.showNumbers ? p.numberSize : 0) + 38)
    const fontKey = JSON.stringify(p.font ?? {})

    // Cache the unchanging geometry instead of recomputing curvature every frame.
    const projection = React.useMemo(() => {
        const columns = Math.ceil(size.width)
        const rows = new Float64Array(columns * 4)
        const half = Math.max(260, size.width / 2)
        const bend = clamp(p.curve, 0, 1.5)
        const perspective = Math.max(900, size.width * 1.15)
        const lift = Math.min(bend * 120, Math.max(0, (size.height - h) / 2 + 16))
        const arc = (x: number) => x * (1 + bend * 0.2 * Math.pow(x / half, 2))
        for (let column = 0; column < columns; column++) {
            const x = column - size.width / 2
            const normal = (x + 0.5) / half
            const projected = perspective / (perspective + bend * 210 * normal * normal)
            const i = column * 4
            rows[i] = arc(x) + w / 2
            rows[i + 1] = arc(x + 1) - arc(x)
            rows[i + 2] = size.height / 2 - lift * normal * normal - h * 0.5 * projected
            rows[i + 3] = h * projected
        }
        return rows
    }, [size.width, size.height, w, h, p.curve])
    drawing.current = () => {
        const surface = canvas.current
        const atlas = texture.current
        if (!surface || !atlas) return
        const ctx = surface.getContext("2d")
        if (!ctx) return
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        const pw = Math.max(1, Math.round(size.width * dpr))
        const ph = Math.max(1, Math.round(size.height * dpr))
        if (surface.width !== pw) surface.width = pw
        if (surface.height !== ph) surface.height = ph
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, size.width, size.height)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        for (let x = 0, i = 0; i < projection.length; x++, i += 4) {
            const source = modulo(projection[i] - motion.current.offset, atlas.width)
            const span = projection[i + 1]
            const first = Math.min(span, atlas.width - source)
            const destination = first / span
            ctx.drawImage(atlas.image, source * atlas.scale, 0, first * atlas.scale, atlas.image.height,
                x, projection[i + 2], destination + 0.12, projection[i + 3])
            if (first < span) ctx.drawImage(atlas.image, 0, 0, (span - first) * atlas.scale, atlas.image.height,
                x + destination, projection[i + 2], 1 - destination + 0.12, projection[i + 3])
        }
    }

    React.useEffect(() => {
        const host = root.current
        if (!host) return
        let cancelled = false
        let repaint = 0
        const atlas = document.createElement("canvas")
        const density = Math.min(2, 8192 / Math.max(1, total), 2048 / Math.max(1, h))
        atlas.width = Math.max(1, Math.round(total * density))
        atlas.height = Math.max(1, Math.round(h * density))
        const ctx = atlas.getContext("2d")
        if (!ctx) return
        const paper = colorIn(host, p.paper)
        const ink = colorIn(host, p.captionColor)
        const border = colorIn(host, p.cardBorder)
        const family = getComputedStyle(host).fontFamily
        const paint = (images: Array<HTMLImageElement | null>) => {
            if (cancelled) return
            ctx.setTransform(density, 0, 0, density, 0, 0)
            ctx.clearRect(0, 0, total, h)
            slides.forEach((slide, index) => {
                const x = index * pitch
                ctx.save()
                outline(ctx, x, w, h, p.radius)
                ctx.clip()
                ctx.fillStyle = paper
                ctx.fillRect(x, 0, w, h)
                const image = images[index]
                if (image) {
                    const cover = Math.max(w / image.naturalWidth, h / image.naturalHeight)
                    const cw = w / cover, ch = h / cover
                    ctx.drawImage(image, (image.naturalWidth - cw) / 2, (image.naturalHeight - ch) / 2, cw, ch, x, 0, w, h)
                }
                if (p.showCaptions || p.showNumbers) {
                    const fade = ctx.createLinearGradient(0, h - fadeHeight, 0, h)
                    fade.addColorStop(0, "rgba(0,0,0,0)")
                    fade.addColorStop(1, "rgba(0,0,0," + clamp(p.captionFade, 0, 1) + ")")
                    ctx.fillStyle = fade
                    ctx.fillRect(x, h - fadeHeight, w, fadeHeight)
                    ctx.fillStyle = ink
                    ctx.textBaseline = "alphabetic"
                    if (p.showCaptions) {
                        ctx.font = p.captionWeight + " " + p.captionSize + "px " + family
                        ctx.textAlign = "left"
                        const allowance = w - inset * 2 - (p.showNumbers ? Math.max(25, p.numberSize * 2 + 8) : 0)
                        const original = slide.title || "Study"
                        let label = original
                        while (label.length > 1 && ctx.measureText(label).width > allowance) label = label.slice(0, -1)
                        if (label !== original) label += "…"
                        ctx.fillText(label, x + inset, h - inset - ctx.measureText(label).actualBoundingBoxDescent)
                    }
                    if (p.showNumbers) {
                        ctx.font = "400 " + p.numberSize + "px " + family
                        ctx.textAlign = "right"
                        const number = String(index + 1).padStart(2, "0")
                        ctx.fillText(number, x + w - inset, h - inset - ctx.measureText(number).actualBoundingBoxDescent)
                    }
                }
                ctx.strokeStyle = border
                ctx.lineWidth = 2
                ctx.stroke()
                ctx.restore()
            })
            texture.current = { image: atlas, scale: density, width: total, height: h }
            drawing.current()
            setReady(true)
        }
        const pictures = slides.map(slide => preloadImage(slide.image.src || ""))
        Promise.all([Promise.all(pictures), preloadFont()]).then(([images]) => {
            if (!cancelled) repaint = requestAnimationFrame(() => paint(images))
        })
        return () => {
            cancelled = true
            if (repaint) cancelAnimationFrame(repaint)
            if (texture.current?.image === atlas) texture.current = null
        }
    }, [slides, w, h, pitch, total, p.radius, p.paper, p.cardBorder, p.captionColor,
        p.captionSize, p.captionWeight, p.numberSize, p.showCaptions, p.showNumbers, inset, p.captionFade, fadeHeight, fontKey])

    React.useEffect(() => {
        const host = root.current
        if (!host) return
        const measure = () => {
            const width = host.clientWidth || 1392
            const height = host.clientHeight || 520
            setSize(old => old.width === width && old.height === height ? old : { width, height })
        }
        measure()
        const resize = new ResizeObserver(measure)
        resize.observe(host)
        const intersection = new IntersectionObserver(entries => setInView(entries[0]?.isIntersecting ?? true))
        intersection.observe(host)
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const motionPreference = () => setReduced(media.matches)
        const visibility = () => setPageVisible(!document.hidden)
        motionPreference()
        visibility()
        media.addEventListener("change", motionPreference)
        document.addEventListener("visibilitychange", visibility)
        return () => {
            resize.disconnect()
            intersection.disconnect()
            media.removeEventListener("change", motionPreference)
            document.removeEventListener("visibilitychange", visibility)
        }
    }, [])
    React.useEffect(() => { drawing.current() }, [projection, ready])
    React.useEffect(() => {
        if (isStatic || !inView || !pageVisible || !ready) return
        let frame = 0, last = 0
        const tick = (now: number) => {
            const dt = last ? Math.min(0.04, (now - last) / 1000) : 1 / 60
            last = now
            const m = motion.current
            if (m.pointer < 0) {
                const automatic = p.autoplay && !paused && !reduced && !m.keyboard && now > m.resume
                const target = automatic ? clamp(p.speed, 0, 300) * (p.direction === "Left" ? -1 : 1) : 0
                m.velocity = reduced ? 0 : m.velocity + (target - m.velocity) * (1 - Math.pow(clamp(p.momentum, 0.7, 0.98), dt * 60))
                if (Math.abs(m.velocity) > 0.01) {
                    m.offset = modulo(m.offset + m.velocity * dt, total)
                    drawing.current()
                }
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [isStatic, inView, pageVisible, ready, paused, reduced, p.autoplay, p.speed, p.direction, p.momentum, total])

    const press = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || event.button !== 0 || !event.isPrimary) return
        Object.assign(motion.current, { pointer: event.pointerId, x: event.clientX, time: performance.now(), velocity: 0, keyboard: false })
        event.currentTarget.setPointerCapture(event.pointerId)
        setDragging(true)
        setFocusVisible(false)
    }
    const drag = (event: React.PointerEvent<HTMLDivElement>) => {
        const m = motion.current
        if (m.pointer !== event.pointerId) return
        const now = performance.now(), dx = event.clientX - m.x
        m.offset = modulo(m.offset + dx, total)
        m.velocity = clamp(0.35 * m.velocity + 0.65 * dx / (Math.max(8, now - m.time) / 1000), -2200, 2200)
        m.x = event.clientX
        m.time = now
        drawing.current()
    }
    const release = (event: React.PointerEvent<HTMLDivElement>) => {
        const m = motion.current
        if (m.pointer !== event.pointerId) return
        if (event.type !== "pointerup" || performance.now() - m.time > 100 || reduced) m.velocity = 0
        m.pointer = -1
        m.resume = performance.now() + 1100
        setDragging(false)
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const key = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault()
            motion.current.offset = modulo(motion.current.offset + (event.key === "ArrowLeft" ? pitch : -pitch), total)
            motion.current.velocity = 0
            motion.current.resume = performance.now() + 1800
            drawing.current()
        } else if (event.key === " ") {
            event.preventDefault()
            setPaused(value => !value)
        }
    }
    const copies = Math.max(1, Math.ceil((size.width + pitch * 4) / total))
    const fallbackCount = slides.length * copies
    return <div ref={root} role="region" aria-roledescription="carousel" aria-label="Curved Carousel"
        aria-describedby={instructions} tabIndex={0}
        onPointerDown={press} onPointerMove={drag} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
        onKeyDown={key}
        onFocus={event => {
            const visible = event.currentTarget.matches(":focus-visible")
            motion.current.keyboard = visible
            if (visible) motion.current.velocity = 0
            setFocusVisible(visible)
        }}
        onBlur={() => { motion.current.keyboard = false; setFocusVisible(false) }}
        style={{ background: p.paper, color: p.captionColor, fontFamily: PORTABLE_FONT,
            fontSize: p.captionSize, fontWeight: 400, fontStyle: "normal",
            lineHeight: 1, letterSpacing: "normal", textTransform: "none", direction: "ltr",
            ...p.font, ...p.style,
            width: dimension(p.style?.width ?? p.width, 1392),
            height: dimension(p.style?.height ?? p.height, 520),
            display: "block", position: "relative", boxSizing: "border-box",
            overflow: "hidden", isolation: "isolate", userSelect: "none", touchAction: "pan-y",
            cursor: dragging ? "grabbing" : "grab",
            outline: focusVisible ? "2px solid " + p.captionColor : "none", outlineOffset: -4 }}>
        {/* Real in-flow content has dimensions before fonts, images, or effects run. */}
        <canvas ref={canvas} width={1392} height={520} aria-hidden="true"
            style={{ display: "block", position: "relative", width: "100%", height: "100%", pointerEvents: "none" }} />
        {!ready && <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {Array.from({ length: fallbackCount }, (_, i) => {
                const slide = slides[i % slides.length]
                const x = modulo(i * pitch + fallbackCount * pitch / 2, fallbackCount * pitch) - fallbackCount * pitch / 2
                return <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: w, height: h,
                    marginLeft: x - w / 2, marginTop: -h / 2, borderRadius: p.radius,
                    overflow: "hidden", background: p.paper, border: "1px solid " + p.cardBorder, boxSizing: "border-box" }}>
                    <img src={slide.image.src} srcSet={slide.image.srcSet} alt={slide.image.alt || slide.title}
                        draggable={false} decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    {(p.showCaptions || p.showNumbers) && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0,
                        height: fadeHeight, padding: inset, boxSizing: "border-box", display: "flex",
                        alignItems: "flex-end", justifyContent: "space-between", gap: 8,
                        fontSize: p.captionSize, lineHeight: p.captionSize + "px", fontWeight: p.captionWeight,
                        background: "linear-gradient(transparent, rgba(0,0,0," + clamp(p.captionFade, 0, 1) + "))" }}>
                        {p.showCaptions && <span style={{ minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{slide.title}</span>}
                        {p.showNumbers && <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: p.numberSize, fontWeight: 400 }}>{String(i % slides.length + 1).padStart(2, "0")}</span>}
                    </div>}
                </div>
            })}
        </div>}
        <ul style={srOnly}>{slides.map((slide, i) => <li key={i}>{slide.title}. {slide.image.alt}</li>)}</ul>
        <p id={instructions} style={srOnly}>Drag left or right to explore. Use left and right arrow keys when focused. Space pauses or resumes automatic motion.</p>
    </div>
}

// Literal dimensions are intentional: the shared asset has a fixed initial size.
CurvedCarousel.defaultProps = { width: 1392, height: 520, items: STARTER_SLIDES, ...DEFAULTS }
const customize = (p: Props) => p.advanced !== true
const captions = (p: Props) => customize(p) || p.showCaptions === false
const numbers = (p: Props) => customize(p) || p.showNumbers === false
const labels = (p: Props) => customize(p) || (p.showCaptions === false && p.showNumbers === false)
addPropertyControls(CurvedCarousel, {
    items: { type: ControlType.Array, title: "Images", maxCount: 30, defaultValue: STARTER_SLIDES,
        control: { type: ControlType.Object, controls: {
            image: { type: ControlType.ResponsiveImage, title: "Image" },
            title: { type: ControlType.String, title: "Caption", defaultValue: "Study" },
        } } },
    curve: { type: ControlType.Number, title: "Curve", defaultValue: 0.4, min: 0, max: 1.5, step: 0.05 },
    autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: true },
    speed: { type: ControlType.Number, title: "Speed", defaultValue: 32, min: 0, max: 180, step: 1, unit: "px/s", hidden: p => p.autoplay === false },
    direction: { type: ControlType.Enum, title: "Direction", options: ["Left", "Right"], defaultValue: "Left", hidden: p => p.autoplay === false },
    showCaptions: { type: ControlType.Boolean, title: "Captions", defaultValue: true },
    showNumbers: { type: ControlType.Boolean, title: "Numbers", defaultValue: true },
    advanced: { type: ControlType.Boolean, title: "Customize", defaultValue: false, enabledTitle: "Show", disabledTitle: "Hide" },
    cardWidth: { type: ControlType.Number, title: "Width", defaultValue: 250, min: 100, max: 700, step: 1, unit: "px", hidden: customize },
    cardHeight: { type: ControlType.Number, title: "Height", defaultValue: 340, min: 100, max: 800, step: 1, unit: "px", hidden: customize },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 36, min: 8, max: 100, step: 1, unit: "px", hidden: customize },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 14, min: 0, max: 60, step: 1, unit: "px", hidden: customize },
    momentum: { type: ControlType.Number, title: "Momentum", defaultValue: 0.92, min: 0.7, max: 0.98, step: 0.01, hidden: customize },
    paper: { type: ControlType.Color, title: "Card Fill", defaultValue: "rgb(0, 0, 0)", hidden: customize },
    cardBorder: { type: ControlType.Color, title: "Border", defaultValue: "rgba(255, 255, 255, 0.02)", hidden: customize },
    font: { type: ControlType.Font, title: "Font", defaultFontType: "sans-serif", hidden: labels },
    captionSize: { type: ControlType.Number, title: "Text Size", defaultValue: 14, min: 10, max: 40, step: 1, unit: "px", hidden: captions },
    captionWeight: { type: ControlType.Number, title: "Text Weight", defaultValue: 500, min: 100, max: 900, step: 100, hidden: captions },
    captionColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#ffffff", hidden: labels },
    numberSize: { type: ControlType.Number, title: "Number Size", defaultValue: 12, min: 8, max: 24, step: 1, unit: "px", hidden: numbers },
    captionPadding: { type: ControlType.Number, title: "Text Inset", defaultValue: 14, min: 0, max: 60, step: 1, unit: "px", hidden: labels },
    captionFade: { type: ControlType.Number, title: "Text Shade", defaultValue: 0.55, min: 0, max: 1, step: 0.05, hidden: labels },
})
CurvedCarousel.displayName = "Curved Carousel"
