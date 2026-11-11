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

import { useInView, useReducedMotion } from "framer-motion"

interface ImageValue { src: string; srcSet?: string; alt?: string }
interface Props {
    showRibbon?: boolean
    appearSettings?: { enabled?: boolean; duration?: number; delay?: number; scale?: number; rotation?: number; x?: number; y?: number; opacity?: number; easing?: "back" | "easeOut" | "easeInOut" | "linear" }
    objectSettings?: { size?: number; x?: number; y?: number; shadow?: boolean }
    ribbonSettings?: { fitObject?: boolean; color?: string; width?: number; loopWidth?: number; archHeight?: number }
    leadingTipSettings?: { enabled?: boolean; color?: string; length?: number }
    tipSettings?: { enabled?: boolean; color?: string; length?: number }
    motionSettings?: { enabled?: boolean; duration?: number; delay?: number; repeat?: boolean; pause?: number }
    image?: ImageValue | string
    productLink?: string
    color?: string
    tipColor?: string
    thickness?: number
    objectSize?: number
    objectX?: number
    objectY?: number
    loopWidth?: number
    archHeight?: number
    duration?: number
    delay?: number
    animated?: boolean
    repeat?: boolean
    repeatDelay?: number
    style?: React.CSSProperties
}

const clamp = (n: number, low = 0, high = 1) => Math.min(high, Math.max(low, n))

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function WrapRibbon({
    appearSettings, objectSettings, ribbonSettings, leadingTipSettings, tipSettings, motionSettings,
    showRibbon = true, image, productLink, color = "#FFF9EC", tipColor = "#D6EDFF", thickness = 30,
    objectSize = 440, objectX = 50, objectY = 48, loopWidth = 115,
    archHeight = 45, duration = 4.6, delay = 0.15, animated = true,
    repeat = false, repeatDelay = 2, style,
}: Props) {
    objectSize = objectSettings?.size ?? objectSize
    objectX = objectSettings?.x ?? objectX
    objectY = objectSettings?.y ?? objectY
    color = ribbonSettings?.color ?? color
    thickness = ribbonSettings?.width ?? thickness
    loopWidth = ribbonSettings?.loopWidth ?? loopWidth
    archHeight = ribbonSettings?.archHeight ?? archHeight
    tipSettings = leadingTipSettings ?? tipSettings
    tipColor = tipSettings?.color ?? tipColor
    animated = motionSettings?.enabled ?? animated
    duration = motionSettings?.duration ?? duration
    delay = motionSettings?.delay ?? delay
    repeat = motionSettings?.repeat ?? repeat
    repeatDelay = motionSettings?.pause ?? repeatDelay
    const appearEnabled = appearSettings?.enabled ?? true
    const appearDuration = Math.max(0.1, appearSettings?.duration ?? 0.8)
    const appearDelay = Math.max(0, appearSettings?.delay ?? 0.15)
    const appearScale = clamp((appearSettings?.scale ?? 12) / 100, 0, 2)
    const appearRotation = appearSettings?.rotation ?? -8
    const appearX = appearSettings?.x ?? 0
    const appearY = appearSettings?.y ?? 0
    const appearOpacity = clamp((appearSettings?.opacity ?? 0) / 100)
    const appearEasing = appearSettings?.easing ?? "back"
    const tipEnabled = tipSettings?.enabled ?? true
    const tipFraction = clamp((tipSettings?.length ?? 7.5) / 100)
    const root = React.useRef<HTMLDivElement>(null)
    const object = React.useRef<HTMLDivElement>(null)
    const imageElement = React.useRef<HTMLImageElement>(null)
    const completePath = React.useRef<SVGPathElement>(null)
    const prefixPath = React.useRef<SVGPathElement>(null)
    const frontPath = React.useRef<SVGPathElement>(null)
    const backTip = React.useRef<SVGPathElement>(null)
    const frontTip = React.useRef<SVGPathElement>(null)
    const clock = React.useRef({ elapsed: 0, key: "" })
    const [size, setSize] = React.useState({ width: 1200, height: 800 })
    const [photo, setPhoto] = React.useState({ src: "", ratio: 0.75, bounds: { x: 0, y: 0, width: 1, height: 1 } })
    const fitObject = ribbonSettings?.fitObject ?? true
    const [imageFailure, setImageFailure] = React.useState({ src: "", cors: false, failed: false })
    const staticRenderer = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = staticRenderer || isCanvas
    const reduced = useReducedMotion()
    const visible = useInView(root, { margin: "80px" })
    const chosenImage = image
    const source = typeof chosenImage === "string" ? chosenImage : chosenImage?.src || ""
    const srcSet = typeof image === "object" ? image?.srcSet : undefined
    const imageAlt = (typeof image === "object" ? image?.alt : "") || ""
    const productHref = typeof productLink === "string" ? productLink.trim() : ""
    const useCors = fitObject && !(imageFailure.src === source && imageFailure.cors)
    const imageFailed = imageFailure.src === source && imageFailure.failed
    const effectiveThickness = Math.max(1, thickness * (fitObject ? Math.min(1, size.width / 600) : 1))


    const handleImageLoad = React.useCallback((el: HTMLImageElement) => {
        if (!el.naturalWidth || !el.naturalHeight) return

        const ratio = el.naturalWidth / Math.max(1, el.naturalHeight)
        let bounds = { x: 0, y: 0, width: 1, height: 1 }
        if (fitObject) {
            try {
                const canvas = document.createElement("canvas")
                const scanScale = Math.min(1, 192 / Math.max(1, el.naturalWidth, el.naturalHeight))
                canvas.width = Math.max(1, Math.round(el.naturalWidth * scanScale))
                canvas.height = Math.max(1, Math.round(el.naturalHeight * scanScale))
                const context = canvas.getContext("2d", { willReadFrequently: true })
                if (context) {
                    context.drawImage(el, 0, 0, canvas.width, canvas.height)
                    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
                    let left = canvas.width, top = canvas.height, right = -1, bottom = -1
                    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
                        if (pixels[(y * canvas.width + x) * 4 + 3] > 40) {
                            left = Math.min(left, x); right = Math.max(right, x)
                            top = Math.min(top, y); bottom = Math.max(bottom, y)
                        }
                    }
                    if (right >= left && bottom >= top) bounds = { x: left / canvas.width, y: top / canvas.height, width: (right - left + 1) / canvas.width, height: (bottom - top + 1) / canvas.height }
                }
            } catch { /* Use full image bounds when pixels cannot be read. */ }
        }
        setPhoto(previous => previous.src === source && previous.ratio === ratio && JSON.stringify(previous.bounds) === JSON.stringify(bounds) ? previous : { src: source, ratio, bounds })
    }, [source, fitObject])

    const handleImageError = React.useCallback(() => {
        // Retry once without CORS so external images can still display.
        // Unreadable alpha falls back to the full image rectangle.
        setImageFailure(previous => previous.src === source && previous.failed
            ? previous
            : { src: source, cors: true, failed: !useCors })
    }, [source, useCors])

    React.useLayoutEffect(() => {
        // Cached images may finish before hydration attaches React's load handler.
        // Synchronize readiness on mount and whenever the image element changes.
        const el = imageElement.current
        if (!source || !el || !el.complete) return
        if (el.naturalWidth > 0) handleImageLoad(el)
        else handleImageError()
    }, [source, srcSet, useCors, handleImageLoad, handleImageError])

    React.useLayoutEffect(() => {
        const el = root.current
        if (!el) return
        const measure = () => {
            const width = el.clientWidth || 1200
            const height = el.clientHeight || 800
            setSize(previous => previous.width === width && previous.height === height ? previous : { width, height })
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const geometry = React.useMemo(() => {
        const w = size.width, h = size.height
        const ratio = photo.src === source ? photo.ratio : 0.75
        const iw = Math.min(Math.max(40, objectSize), w * 0.86, h * 0.84 * ratio)
        const ih = iw / ratio
        const cx = w * clamp(objectX / 100, 0.15, 0.85)
        const cy = h * clamp(objectY / 100, 0.2, 0.8)
        if (fitObject) {
            const b = photo.src === source ? photo.bounds : { x: 0, y: 0, width: 1, height: 1 }
            const ox = cx + iw * (b.x + b.width / 2 - 0.5), oy = cy + ih * (b.y + b.height / 2 - 0.5)
            const ow = iw * b.width, oh = ih * b.height
            const radius = ow * (0.5 + (clamp(loopWidth / 100, 0.8, 1.8) - 0.8) * 0.1) + effectiveThickness / 2
            const rise = oh * clamp(archHeight / 100, 0.25, 0.7)
            const rightX = ox + radius, leftX = ox - radius
            const rightY = oy - oh * 0.02, leftY = oy + oh * 0.08
            const prefix = `M ${-w * 0.12} ${oy + oh * 0.03} C ${ox - radius} ${oy - rise * 0.6} ${ox - radius * 0.28} ${oy - rise} ${ox + radius * 0.1} ${oy - rise} C ${ox + radius * 0.7} ${oy - rise} ${rightX} ${oy - rise * 0.6} ${rightX} ${rightY}`
            const front = `M ${rightX} ${rightY} C ${rightX} ${oy + oh * 0.43} ${leftX} ${oy + oh * 0.48} ${leftX} ${leftY}`
            const exit = ` C ${leftX} ${oy - oh * 0.25} ${ox + radius * 0.15} ${oy + oh * 0.22} ${ox + radius * 0.55} ${oy + oh * 0.4} C ${ox + radius} ${oy + oh * 0.65} ${w * 0.96} ${oy + oh * 0.58} ${w * 1.12} ${oy + oh * 0.58}`
            return { w, h, cx, cy, iw, ih, prefix, front, full: prefix + front.slice(front.indexOf(" C")) + exit }
        }
        const rx = iw * clamp(loopWidth / 100, 0.8, 1.8)
        const lift = ih * clamp(archHeight / 100, 0.25, 0.7)
        const prefix = `M ${-w * 0.12} ${cy - ih * 0.03} C ${cx - rx * 1.2} ${cy + ih * 0.25} ${cx - rx * 0.72} ${cy - lift} ${cx - rx * 0.05} ${cy - lift} C ${cx + rx * 0.65} ${cy - lift} ${cx + rx * 0.78} ${cy - ih * 0.02} ${cx + rx * 0.47} ${cy + ih * 0.2}`
        const front = `M ${cx + rx * 0.47} ${cy + ih * 0.2} C ${cx + rx * 0.15} ${cy + ih * 0.44} ${cx - rx * 0.5} ${cy + ih * 0.46} ${cx - rx * 0.5} ${cy + ih * 0.19}`
        const frontContinuation = front.slice(front.indexOf(" C"))
        const exit = ` C ${cx - rx * 0.5} ${cy - ih * 0.04} ${cx + rx * 0.18} ${cy - ih * 0.03} ${cx + rx * 0.46} ${cy + ih * 0.28} C ${cx + rx * 0.88} ${cy + ih * 0.65} ${w * 0.93} ${cy + ih * 0.56} ${w + 120} ${cy + ih * 0.53}`
        return { w, h, cx, cy, iw, ih, prefix, front, full: prefix + frontContinuation + exit }
    }, [size, photo, source, objectSize, objectX, objectY, loopWidth, archHeight, fitObject, effectiveThickness])

    React.useLayoutEffect(() => {
        const back = completePath.current, front = frontPath.current
        if (!back || !front || !prefixPath.current) return
        const length = back.getTotalLength()
        const frontStart = prefixPath.current.getTotalLength()
        const frontLength = front.getTotalLength()
        let frame = 0
        const key = [source, showRibbon, animated, duration, delay, repeat, repeatDelay, tipEnabled, tipFraction, tipColor, appearEnabled, appearDuration, appearDelay, appearScale, appearRotation, appearX, appearY, appearOpacity, appearEasing].join("|")
        if (clock.current.key !== key) clock.current = { elapsed: 0, key }
        function draw(el: SVGPathElement | null, start: number, end: number, total: number) {
            if (!el) return
            const amount = Math.max(0, end - start)
            el.style.opacity = amount > 0.05 ? "1" : "0"
            el.style.strokeDasharray = `${amount} ${total + 1}`
            el.style.strokeDashoffset = `${-start}`
        }
        function paint(t: number, objectProgress: number) {
            const q = objectProgress - 1
            const ease = appearEasing === "linear" ? objectProgress
                : appearEasing === "easeOut" ? 1 - Math.pow(1 - objectProgress, 3)
                : appearEasing === "easeInOut" ? objectProgress * objectProgress * (3 - 2 * objectProgress)
                : 1 + 1.4 * q * q * q + 0.4 * q * q
            if (object.current) {
                object.current.style.willChange = isStatic || objectProgress >= 1 ? "auto" : "transform, opacity"
                const fade = appearEasing === "back" ? clamp(objectProgress * 5) : objectProgress
                object.current.style.opacity = `${appearOpacity + (1 - appearOpacity) * fade}`
                object.current.style.transform = `translate(-50%, -50%) translate(${appearX * (1 - ease)}px, ${appearY * (1 - ease)}px) scale(${appearScale + ease * (1 - appearScale)}) rotate(${appearRotation * (1 - ease)}deg)`
            }
            const p = clamp((t - 0.18) / 0.74)
            const travel = length * p
            draw(back, 0, travel, length)
            draw(front, 0, clamp(travel - frontStart, 0, frontLength), frontLength)
            const headLength = length * tipFraction
            const headStart = Math.max(0, travel - headLength)
            if (!tipEnabled || tipFraction === 0 || p >= 0.999 || p <= 0) {
                if (backTip.current) backTip.current.style.opacity = "0"
                if (frontTip.current) frontTip.current.style.opacity = "0"
            } else {
                draw(backTip.current, headStart, travel, length)
                draw(frontTip.current, clamp(headStart - frontStart, 0, frontLength), clamp(travel - frontStart, 0, frontLength), frontLength)
            }
        }
        if (isStatic || reduced || ((!animated || !showRibbon) && !appearEnabled)) { paint(1, 1); return }
        const seconds = Math.max(1.8, duration)
        const wait = Math.max(0, delay)
        const cycle = Math.max(animated && showRibbon ? wait + seconds : 0, appearEnabled ? appearDelay + appearDuration : 0) + Math.max(0, repeatDelay)
        const ready = !source || photo.src === source || imageFailed
        const progressAt = (elapsed: number) => ({
            ribbon: animated && showRibbon ? clamp((elapsed - wait) / seconds) : 1,
            object: appearEnabled ? clamp((elapsed - appearDelay) / appearDuration) : 1,
        })
        const initial = progressAt(clock.current.elapsed)
        paint(initial.ribbon, initial.object)
        if (!visible || !ready) return
        let last = 0
        const tick = (now: number) => {
            if (last) clock.current.elapsed += Math.min((now - last) / 1000, 0.1)
            last = now
            if (repeat && clock.current.elapsed >= cycle) clock.current.elapsed %= cycle
            const progress = progressAt(clock.current.elapsed)
            paint(progress.ribbon, progress.object)
            if (progress.ribbon < 1 || progress.object < 1 || repeat) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [geometry, source, showRibbon, photo.src, imageFailed, isStatic, reduced, animated, visible, duration, delay, repeat, repeatDelay, thickness, tipEnabled, tipFraction, tipColor, appearEnabled, appearDuration, appearDelay, appearScale, appearRotation, appearX, appearY, appearOpacity, appearEasing])

    const stroke = { fill: "none", stroke: color, strokeWidth: effectiveThickness, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
    const svgStyle: React.CSSProperties = { opacity: showRibbon ? 1 : 0, position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }
    return (
        <div ref={root} style={{ position: "relative", width: "100%", height: "100%", overflow: "visible", ...style }}>
            <svg aria-hidden="true" viewBox={`0 0 ${geometry.w} ${geometry.h}`} style={svgStyle}>
                <path ref={prefixPath} d={geometry.prefix} fill="none" stroke="none" />
                <path ref={completePath} d={geometry.full} {...stroke} />
                <path ref={backTip} d={geometry.full} {...stroke} stroke={tipColor} />
            </svg>
            {source && <div ref={object} style={{ position: "absolute", left: geometry.cx, top: geometry.cy, width: geometry.iw, height: geometry.ih, transform: "translate(-50%, -50%)", transformOrigin: "50% 78%", willChange: appearEnabled && !isStatic && !reduced ? "transform" : undefined, pointerEvents: "none" }}>
                {objectSettings?.shadow && <div aria-hidden="true" style={{ position: "absolute", left: "10%", bottom: "-0.3%", width: "80%", height: "6%", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(47, 26, 10, 0.46) 0%, rgba(47, 26, 10, 0.16) 44%, transparent 72%)", pointerEvents: "none" }} />}
                <img ref={imageElement} key={source + (useCors ? ":cors" : ":plain")} crossOrigin={useCors ? "anonymous" : undefined} src={source} srcSet={srcSet} alt={imageAlt} draggable={false} onLoad={event => handleImageLoad(event.currentTarget)} onError={handleImageError} style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }} />
                {productHref && !isCanvas && <a
                    href={productHref}
                    aria-label={imageAlt || "View product"}
                    draggable={false}
                    style={{ position: "absolute", inset: 0, display: "block", pointerEvents: "auto", cursor: "pointer", borderRadius: 2 }}
                />}
            </div>}
            <svg aria-hidden="true" viewBox={`0 0 ${geometry.w} ${geometry.h}`} style={svgStyle}>
                <path ref={frontPath} d={geometry.front} {...stroke} />
                <path ref={frontTip} d={geometry.front} {...stroke} stroke={tipColor} />
            </svg>
        </div>
    )
}

addPropertyControls(WrapRibbon, {
    showRibbon: { type: ControlType.Boolean, title: "Show Ribbon", defaultValue: true },
    image: { type: ControlType.ResponsiveImage, title: "Image", description: "Use a transparent PNG/WebP for a front-and-back wrap. Opaque images hide the ribbon across their rectangle. Add alt text for content; leave blank for decoration." },
    productLink: { type: ControlType.Link, title: "Product Link", description: "Optional. Link the product image to a page, URL, or CMS link field. Leave empty to disable." },
    objectSettings: {
        type: ControlType.Object, title: "Object", description: "Size and position the image. Use Fixed or Fill height; Fit Content cannot measure absolute layers.", defaultValue: { size: 440, x: 50, y: 48 },
        controls: {
            shadow: { type: ControlType.Boolean, title: "Contact Shadow", defaultValue: false },
            size: { type: ControlType.Number, title: "Size", min: 80, max: 1000, step: 1, unit: "px", defaultValue: 440 },
            x: { type: ControlType.Number, title: "Horizontal", min: 15, max: 85, step: 0.1, unit: "%", defaultValue: 50 },
            y: { type: ControlType.Number, title: "Vertical", min: 20, max: 80, step: 0.1, unit: "%", defaultValue: 48 },
        },
    },
    appearSettings: {
        type: ControlType.Object, title: "Object Appear", description: "Independent image entrance. Off keeps the image visible; ribbon motion still works. Reduced motion shows the final state.",
        controls: {
            enabled: { type: ControlType.Boolean, title: "Animate", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
            duration: { type: ControlType.Number, title: "Duration", defaultValue: 0.8, min: 0.1, max: 5, step: 0.05, unit: "s", hidden: p => p.enabled === false },
            delay: { type: ControlType.Number, title: "Delay", defaultValue: 0.15, min: 0, max: 5, step: 0.05, unit: "s", hidden: p => p.enabled === false },
            easing: { type: ControlType.Enum, title: "Easing", options: ["back", "easeOut", "easeInOut", "linear"], optionTitles: ["Soft Pop", "Ease Out", "Ease In Out", "Linear"], defaultValue: "back", hidden: p => p.enabled === false },
            scale: { type: ControlType.Number, title: "Start Scale", defaultValue: 12, min: 0, max: 200, step: 1, unit: "%", hidden: p => p.enabled === false },
            rotation: { type: ControlType.Number, title: "Start Rotate", defaultValue: -8, min: -180, max: 180, step: 1, unit: "°", hidden: p => p.enabled === false },
            x: { type: ControlType.Number, title: "Offset X", defaultValue: 0, min: -500, max: 500, step: 1, unit: "px", hidden: p => p.enabled === false },
            y: { type: ControlType.Number, title: "Offset Y", defaultValue: 0, min: -500, max: 500, step: 1, unit: "px", hidden: p => p.enabled === false },
            opacity: { type: ControlType.Number, title: "Start Opacity", defaultValue: 0, min: 0, max: 100, step: 1, unit: "%", hidden: p => p.enabled === false },
        },
    },
    ribbonSettings: {
        type: ControlType.Object, title: "Ribbon", description: "Fit Object follows visible image bounds when readable; Off uses the wider hero curve. Clip the parent to contain overflow.", defaultValue: { color: "#FFF9EC", width: 30, loopWidth: 115, archHeight: 45 },
        controls: {
            fitObject: { type: ControlType.Boolean, title: "Fit Object", defaultValue: true },
            color: { type: ControlType.Color, title: "Color", defaultValue: "#FFF9EC" },
            width: { type: ControlType.Number, title: "Width", description: "Maximum width in px. Fit Object scales it below 600px; all slider values apply.", min: 4, max: 72, step: 1, unit: "px", defaultValue: 30 },
            loopWidth: { type: ControlType.Number, title: "Loop Width", description: "Wrap tightness: 80% is closest with Fit Object; higher values loosen it.", min: 80, max: 180, step: 1, unit: "%", defaultValue: 115 },
            archHeight: { type: ControlType.Number, title: "Arch Height", min: 25, max: 70, step: 1, unit: "%", defaultValue: 45 },
        },
    },
    leadingTipSettings: {
        type: ControlType.Object, title: "Leading Tip", defaultValue: { enabled: true, color: "#D6EDFF", length: 7.5 },
        controls: {
            enabled: { type: ControlType.Boolean, title: "Show", defaultValue: true },
            color: { type: ControlType.Color, title: "Color", defaultValue: "#D6EDFF", hidden: p => p.enabled === false },
            length: { type: ControlType.Number, title: "Length", min: 0, max: 100, step: 0.5, unit: "%", defaultValue: 7.5, description: "Colored tip length as a percentage of the full ribbon.", hidden: p => p.enabled === false },
        },
    },
    motionSettings: {
        type: ControlType.Object, title: "Ribbon Animation", description: "Starts near the viewport; pauses offscreen. Repeat replays all enabled motion, including Object Appear.\n\n1. [View Setup Guide](https://framer.link/tqYka28)\n2. [View Complete Template](https://framer.link/AVGjxxi)", defaultValue: { enabled: true, duration: 4.6, delay: 0.15, repeat: false, pause: 2 },
        controls: {
            enabled: { type: ControlType.Boolean, title: "Play", defaultValue: true },
            duration: { type: ControlType.Number, title: "Duration", min: 1.8, max: 12, step: 0.1, unit: "s", defaultValue: 4.6, hidden: p => p.enabled === false },
            delay: { type: ControlType.Number, title: "Start Delay", min: 0, max: 5, step: 0.1, unit: "s", defaultValue: 0.15, hidden: p => p.enabled === false },
            repeat: { type: ControlType.Boolean, title: "Repeat", defaultValue: false, hidden: p => p.enabled === false },
            pause: { type: ControlType.Number, title: "Pause", min: 0, max: 10, step: 0.5, unit: "s", defaultValue: 2, hidden: p => p.enabled === false || !p.repeat },
        },
    },
    // Keep earlier control keys hidden so existing instances and bindings stay compatible.
    tipSettings: { type: ControlType.Object, title: "Legacy Tip", hidden: () => true, controls: {
        enabled: { type: ControlType.Boolean, defaultValue: true },
        color: { type: ControlType.Color, defaultValue: "#D6EDFF" },
        length: { type: ControlType.Number, defaultValue: 7.5 },
    } },
    objectSize: { type: ControlType.Number, title: "Object Size", min: 80, max: 1000, step: 1, defaultValue: 440, unit: "px", hidden: () => true },
    objectX: { type: ControlType.Number, title: "Object X", min: 15, max: 85, step: 0.1, defaultValue: 50, unit: "%", hidden: () => true },
    objectY: { type: ControlType.Number, title: "Object Y", min: 20, max: 80, step: 0.1, defaultValue: 48, unit: "%", hidden: () => true },
    color: { type: ControlType.Color, title: "Ribbon", defaultValue: "#FFF9EC", hidden: () => true },
    tipColor: { type: ControlType.Color, title: "Leading Tip", defaultValue: "#D6EDFF", hidden: () => true },
    thickness: { type: ControlType.Number, title: "Ribbon Width", min: 4, max: 72, step: 1, defaultValue: 30, unit: "px", hidden: () => true },
    loopWidth: { type: ControlType.Number, title: "Loop Width", min: 80, max: 180, step: 1, defaultValue: 115, unit: "%", hidden: () => true },
    archHeight: { type: ControlType.Number, title: "Arch Height", min: 25, max: 70, step: 1, defaultValue: 45, unit: "%", hidden: () => true },
    animated: { type: ControlType.Boolean, title: "Animate", defaultValue: true, hidden: () => true },
    duration: { type: ControlType.Number, title: "Duration", min: 1.8, max: 12, step: 0.1, defaultValue: 4.6, unit: "s", hidden: () => true},
    delay: { type: ControlType.Number, title: "Delay", min: 0, max: 5, step: 0.1, defaultValue: 0.15, unit: "s", hidden: () => true},
    repeat: { type: ControlType.Boolean, title: "Repeat", defaultValue: false, hidden: () => true},
    repeatDelay: { type: ControlType.Number, title: "Repeat Pause", min: 0, max: 10, step: 0.5, defaultValue: 2, unit: "s", hidden: () => true},
})
