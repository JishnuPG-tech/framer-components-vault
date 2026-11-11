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


const DEFAULT_IMAGES = [
    {
        src: "https://i.ibb.co.com/spSd6BRM/Snowboarder-Mid-Jump.png",
        srcSet: "",
        alt: "Snowboarder Mid Jump",
    },
    {
        src: "https://i.ibb.co.com/JwJddFmp/Mid-Air-Majesty-Snowboarders-Flight-Against-the-Blue.png",
        srcSet: "",
        alt: "Mid Air Majesty",
    },
    {
        src: "https://i.ibb.co.com/dsn1PT9C/Golden-Hour-Snowboarders-in-Sync.png",
        srcSet: "",
        alt: "Golden Hour Snowboarders",
    },
    {
        src: "https://i.ibb.co.com/TqtFhjDq/Dynamic-Ski-Descent.png",
        srcSet: "",
        alt: "Dynamic Ski Descent",
    },
    {
        src: "https://i.ibb.co.com/gbVGY68F/Dynamic-Snowboarder-Carving-Powder.png",
        srcSet: "",
        alt: "Dynamic Snowboarder",
    },
    {
        src: "https://i.ibb.co.com/hxMCxZxV/Snowboarding-Adventure.png",
        srcSet: "",
        alt: "Snowboarding Adventure",
    },
]

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function GradientSlider(props: any) {
    const {
        images,
        gap,
        maxRotation,
        maxDepth,
        minScale,
        scaleRange,
        friction,
        wheelSensitivity,
        dragSensitivity,
        borderRadius,
        blurAmount,
        bgBlur,
        bgSaturation,
        cardAspectRatio,
        cardWidth,
        showGradientBg,
        gradientTransitionSpeed,
        gradientColors,
        gradColor1,
        gradColor2,
        autoSlide,
        autoSlideSpeed,
        autoSlideDirection,
        pauseOnHover,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const cardsRef = React.useRef<HTMLDivElement>(null)

    // Carousel state refs
    const stateRef = React.useRef({
        items: [] as { el: HTMLElement; x: number }[],
        positions: null as Float32Array | null,
        activeIndex: -1,
        scrollX: 0,
        vX: 0,
        cardW: 300,
        cardH: 400,
        step: 328,
        track: 0,
        vwHalf: 450,
        dragging: false,
        lastX: 0,
        lastT: 0,
        lastDelta: 0,
        rafId: null as number | null,
        bgRafId: null as number | null,
        lastTime: 0,
        lastBgDraw: 0,
        bgFastUntil: 0,
        gradPalette: [] as { c1: number[]; c2: number[] }[],
        gradCurrent: {
            r1: 240,
            g1: 240,
            b1: 240,
            r2: 235,
            g2: 235,
            b2: 235,
        },
        gradTarget: null as any,
        gradTweenStart: 0,
        gradTweenDur: 450,
        gradTweenFrom: null as any,
        mounted: true,
        hovered: false,
    })

    // Store latest props in ref for animation loops
    const propsRef = React.useRef(props)
    propsRef.current = props

    // ── Utility ──
    const mod = (n: number, m: number) => ((n % m) + m) % m

    // ── Color utilities ──
    const parseColor = (color: string): [number, number, number] => {
        if (!color) return [128, 128, 128]
        const trimmed = color.trim()
        if (trimmed.startsWith("#")) {
            let hex = trimmed.slice(1)
            if (hex.length === 3)
                hex = hex
                    .split("")
                    .map((c) => c + c)
                    .join("")
            if (hex.length === 6) {
                return [
                    parseInt(hex.slice(0, 2), 16),
                    parseInt(hex.slice(2, 4), 16),
                    parseInt(hex.slice(4, 6), 16),
                ]
            }
        }
        const m = trimmed.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/)
        if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])]
        return [128, 128, 128]
    }

    const rgbToHsl = (
        r: number,
        g: number,
        b: number
    ): [number, number, number] => {
        r /= 255
        g /= 255
        b /= 255
        const max = Math.max(r, g, b),
            min = Math.min(r, g, b)
        let h = 0,
            s = 0
        const l = (max + min) / 2
        if (max !== min) {
            const d = max - min
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0)
                    break
                case g:
                    h = (b - r) / d + 2
                    break
                default:
                    h = (r - g) / d + 4
                    break
            }
            h /= 6
        }
        return [h * 360, s, l]
    }

    const hslToRgb = (
        h: number,
        s: number,
        l: number
    ): [number, number, number] => {
        h = (((h % 360) + 360) % 360) / 360
        let r: number, g: number, b: number
        if (s === 0) {
            r = g = b = l
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1
                if (t > 1) t -= 1
                if (t < 1 / 6) return p + (q - p) * 6 * t
                if (t < 1 / 2) return q
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
                return p
            }
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s
            const p = 2 * l - q
            r = hue2rgb(p, q, h + 1 / 3)
            g = hue2rgb(p, q, h)
            b = hue2rgb(p, q, h - 1 / 3)
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
    }

    const fallbackFromIndex = (idx: number) => {
        const h = (idx * 37) % 360
        const s = 0.65
        return { c1: hslToRgb(h, s, 0.52), c2: hslToRgb(h, s, 0.72) }
    }

    const extractColors = (img: HTMLImageElement, idx: number) => {
        try {
            const MAX = 48
            const ratio =
                img.naturalWidth && img.naturalHeight
                    ? img.naturalWidth / img.naturalHeight
                    : 1
            const tw = ratio >= 1 ? MAX : Math.max(16, Math.round(MAX * ratio))
            const th = ratio >= 1 ? Math.max(16, Math.round(MAX / ratio)) : MAX
            const canvas = document.createElement("canvas")
            canvas.width = tw
            canvas.height = th
            const ctx = canvas.getContext("2d")
            if (!ctx) return fallbackFromIndex(idx)
            ctx.drawImage(img, 0, 0, tw, th)
            const data = ctx.getImageData(0, 0, tw, th).data

            const H_BINS = 36,
                S_BINS = 5,
                SIZE = H_BINS * S_BINS
            const wSum = new Float32Array(SIZE)
            const rSum = new Float32Array(SIZE)
            const gSum = new Float32Array(SIZE)
            const bSum = new Float32Array(SIZE)

            for (let i = 0; i < data.length; i += 4) {
                const a = data[i + 3] / 255
                if (a < 0.05) continue
                const r = data[i],
                    g = data[i + 1],
                    b = data[i + 2]
                const [h, s, l] = rgbToHsl(r, g, b)
                if (l < 0.1 || l > 0.92 || s < 0.08) continue
                const w = a * (s * s) * (1 - Math.abs(l - 0.5) * 0.6)
                const hi = Math.max(
                    0,
                    Math.min(H_BINS - 1, Math.floor((h / 360) * H_BINS))
                )
                const si = Math.max(
                    0,
                    Math.min(S_BINS - 1, Math.floor(s * S_BINS))
                )
                const bidx = hi * S_BINS + si
                wSum[bidx] += w
                rSum[bidx] += r * w
                gSum[bidx] += g * w
                bSum[bidx] += b * w
            }

            let pIdx = -1,
                pW = 0
            for (let i = 0; i < SIZE; i++) {
                if (wSum[i] > pW) {
                    pW = wSum[i]
                    pIdx = i
                }
            }
            if (pIdx < 0 || pW <= 0) return fallbackFromIndex(idx)
            const pHue = Math.floor(pIdx / S_BINS) * (360 / H_BINS)

            let sIdx = -1,
                sW = 0
            for (let i = 0; i < SIZE; i++) {
                const w = wSum[i]
                if (w <= 0) continue
                const h = Math.floor(i / S_BINS) * (360 / H_BINS)
                let dh = Math.abs(h - pHue)
                dh = Math.min(dh, 360 - dh)
                if (dh >= 25 && w > sW) {
                    sW = w
                    sIdx = i
                }
            }

            const avgRGB = (idx: number): [number, number, number] => {
                const w = wSum[idx] || 1e-6
                return [
                    Math.round(rSum[idx] / w),
                    Math.round(gSum[idx] / w),
                    Math.round(bSum[idx] / w),
                ]
            }

            const [pr, pg, pb] = avgRGB(pIdx)
            let [h1, s1] = rgbToHsl(pr, pg, pb)
            s1 = Math.max(0.45, Math.min(1, s1 * 1.15))
            const c1 = hslToRgb(h1, s1, 0.5)

            let c2: [number, number, number]
            if (sIdx >= 0 && sW >= pW * 0.6) {
                const [sr, sg, sb] = avgRGB(sIdx)
                let [h2, s2] = rgbToHsl(sr, sg, sb)
                s2 = Math.max(0.45, Math.min(1, s2 * 1.05))
                c2 = hslToRgb(h2, s2, 0.72)
            } else {
                c2 = hslToRgb(h1, s1, 0.72)
            }
            return { c1, c2 }
        } catch {
            return fallbackFromIndex(idx)
        }
    }

    // ── Gradient tween ──
    const tweenGradient = () => {
        const s = stateRef.current
        if (!s.gradTarget || !s.gradTweenFrom) return
        const elapsed = performance.now() - s.gradTweenStart
        const t = Math.min(1, elapsed / s.gradTweenDur)
        const e = 1 - (1 - t) * (1 - t)
        const from = s.gradTweenFrom
        const to = s.gradTarget
        s.gradCurrent = {
            r1: from.r1 + (to.r1 - from.r1) * e,
            g1: from.g1 + (to.g1 - from.g1) * e,
            b1: from.b1 + (to.b1 - from.b1) * e,
            r2: from.r2 + (to.r2 - from.r2) * e,
            g2: from.g2 + (to.g2 - from.g2) * e,
            b2: from.b2 + (to.b2 - from.b2) * e,
        }
        if (t >= 1) {
            s.gradTarget = null
            s.gradTweenFrom = null
        }
    }

    const setActiveGradient = (idx: number) => {
        const s = stateRef.current
        if (idx < 0 || idx >= s.gradPalette.length || idx === s.activeIndex)
            return
        s.activeIndex = idx
        const pal = s.gradPalette[idx] || {
            c1: [240, 240, 240],
            c2: [235, 235, 235],
        }
        const to = {
            r1: pal.c1[0],
            g1: pal.c1[1],
            b1: pal.c1[2],
            r2: pal.c2[0],
            g2: pal.c2[1],
            b2: pal.c2[2],
        }
        s.gradTweenFrom = { ...s.gradCurrent }
        s.gradTarget = to
        s.gradTweenStart = performance.now()
        s.gradTweenDur = propsRef.current.gradientTransitionSpeed
        s.bgFastUntil = performance.now() + s.gradTweenDur + 100
    }

    // ── Transform calculation ──
    const computeTransformComponents = (screenX: number, vwHalf: number) => {
        const p = propsRef.current
        const norm = Math.max(-1, Math.min(1, screenX / vwHalf))
        const absNorm = Math.abs(norm)
        const invNorm = 1 - absNorm
        const ry = -norm * p.maxRotation
        const tz = invNorm * p.maxDepth
        const scale = p.minScale + invNorm * p.scaleRange
        return { norm, absNorm, invNorm, ry, tz, scale }
    }

    const transformForScreenX = (screenX: number, vwHalf: number) => {
        const { ry, tz, scale } = computeTransformComponents(screenX, vwHalf)
        return {
            transform: `translate3d(${screenX}px,-50%,${tz}px) rotateY(${ry}deg) scale(${scale})`,
            z: tz,
        }
    }

    // ── Update transforms ──
    const updateCarouselTransforms = () => {
        const s = stateRef.current
        const p = propsRef.current
        if (!s.items.length || !s.positions) return

        const half = s.track / 2
        let closestIdx = -1
        let closestDist = Infinity

        for (let i = 0; i < s.items.length; i++) {
            let pos = s.items[i].x - s.scrollX
            if (pos < -half) pos += s.track
            if (pos > half) pos -= s.track
            s.positions[i] = pos
            const dist = Math.abs(pos)
            if (dist < closestDist) {
                closestDist = dist
                closestIdx = i
            }
        }

        const prevIdx = (closestIdx - 1 + s.items.length) % s.items.length
        const nextIdx = (closestIdx + 1) % s.items.length

        for (let i = 0; i < s.items.length; i++) {
            const it = s.items[i]
            const pos = s.positions[i]
            const norm = Math.max(-1, Math.min(1, pos / s.vwHalf))
            const { transform, z } = transformForScreenX(pos, s.vwHalf)
            it.el.style.transform = transform
            it.el.style.zIndex = String(1000 + Math.round(z))
            const isCore = i === closestIdx || i === prevIdx || i === nextIdx
            const blur = isCore
                ? 0
                : p.blurAmount * Math.pow(Math.abs(norm), 1.1)
            it.el.style.filter = `blur(${blur.toFixed(2)}px)`
        }

        if (closestIdx !== s.activeIndex) {
            setActiveGradient(closestIdx)
        }
    }

    // ── Animation loop ──
    const tick = (t: number) => {
        const s = stateRef.current
        if (!s.mounted) return
        const p = propsRef.current

        const dt = s.lastTime ? (t - s.lastTime) / 1000 : 0
        s.lastTime = t

        s.scrollX = mod(s.scrollX + s.vX * dt, s.track)
        const decay = Math.pow(p.friction, dt * 60)
        s.vX *= decay
        if (Math.abs(s.vX) < 0.02) s.vX = 0

        updateCarouselTransforms()
        s.rafId = requestAnimationFrame(tick)
    }

    // ── Background drawing ──
    const drawBackground = () => {
        const s = stateRef.current
        if (!s.mounted) return
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d", { alpha: false })
        if (!ctx) return

        const now = performance.now()
        const minInterval = now < s.bgFastUntil ? 16 : 33
        if (now - s.lastBgDraw < minInterval) {
            s.bgRafId = requestAnimationFrame(drawBackground)
            return
        }
        s.lastBgDraw = now

        tweenGradient()

        const container = containerRef.current
        if (!container) return
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
        const w = container.clientWidth
        const h = container.clientHeight
        const tw = Math.floor(w * dpr)
        const th = Math.floor(h * dpr)
        if (canvas.width !== tw || canvas.height !== th) {
            canvas.width = tw
            canvas.height = th
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        ctx.fillStyle = "#f6f7f9"
        ctx.fillRect(0, 0, w, h)

        const time = now * 0.0002
        const cx = w * 0.5,
            cy = h * 0.5
        const a1 = Math.min(w, h) * 0.35
        const a2 = Math.min(w, h) * 0.28
        const x1 = cx + Math.cos(time) * a1
        const y1 = cy + Math.sin(time * 0.8) * a1 * 0.4
        const x2 = cx + Math.cos(-time * 0.9 + 1.2) * a2
        const y2 = cy + Math.sin(-time * 0.7 + 0.7) * a2 * 0.5
        const r1 = Math.max(w, h) * 0.75
        const r2 = Math.max(w, h) * 0.65

        const gc = s.gradCurrent
        const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, r1)
        g1.addColorStop(0, `rgba(${gc.r1 | 0},${gc.g1 | 0},${gc.b1 | 0},0.85)`)
        g1.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = g1
        ctx.fillRect(0, 0, w, h)

        const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, r2)
        g2.addColorStop(0, `rgba(${gc.r2 | 0},${gc.g2 | 0},${gc.b2 | 0},0.70)`)
        g2.addColorStop(1, "rgba(255,255,255,0)")
        ctx.fillStyle = g2
        ctx.fillRect(0, 0, w, h)

        s.bgRafId = requestAnimationFrame(drawBackground)
    }

    // ── Build palette from loaded images ──
    const buildPalette = () => {
        const s = stateRef.current
        const p = propsRef.current
        if (p.gradientColors === "custom") {
            // Use user-defined custom colors for every card
            const c1 = parseColor(p.gradColor1)
            const c2 = parseColor(p.gradColor2)
            s.gradPalette = s.items.map(() => ({ c1, c2 }))
        } else {
            s.gradPalette = s.items.map((it, i) => {
                const img = it.el.querySelector("img") as HTMLImageElement
                if (!img || !img.complete || !img.naturalWidth)
                    return fallbackFromIndex(i)
                return extractColors(img, i)
            })
        }
    }

    // ── Setup effect ──
    React.useEffect(() => {
        const container = containerRef.current
        const cardsRoot = cardsRef.current
        if (!container || !cardsRoot) return

        const s = stateRef.current
        s.mounted = true
        s.activeIndex = -1
        s.scrollX = 0
        s.vX = 0

        const imgSrcs = images && images.length > 0 ? images : DEFAULT_IMAGES

        // Clear cards container safely
        while (cardsRoot.firstChild) {
            cardsRoot.removeChild(cardsRoot.firstChild)
        }

        const fragment = document.createDocumentFragment()
        const newItems: { el: HTMLElement; x: number }[] = []

        imgSrcs.forEach((imgData: any, i: number) => {
            // Support both plain string URLs and ResponsiveImage objects
            const src =
                typeof imgData === "string" ? imgData : imgData?.src || ""
            const srcSet = imgData?.srcSet || ""
            const altText = imgData?.alt || ""

            const card = document.createElement("article")
            card.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: ${cardWidth}px;
                aspect-ratio: ${cardAspectRatio};
                isolation: isolate;
                transform-style: preserve-3d;
                backface-visibility: hidden;
                will-change: transform, filter;
                transform-origin: 90% center;
                contain: layout paint;
            `
            const img = new Image()
            img.style.cssText = `
                border-radius: ${borderRadius}px;
                opacity: 1;
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                transform: translateZ(0);
                pointer-events: none;
                user-select: none;
                -webkit-user-drag: none;
            `
            img.decoding = "async"
            img.loading = "eager"
            img.draggable = false
            img.src = src
            if (srcSet) img.srcset = srcSet
            img.alt = altText
            card.appendChild(img)
            fragment.appendChild(card)
            newItems.push({ el: card, x: i * (cardWidth + gap) })
        })

        cardsRoot.appendChild(fragment)
        s.items = newItems

        // Measure
        s.cardW = cardWidth
        s.step = cardWidth + gap
        s.track = s.items.length * s.step
        s.positions = new Float32Array(s.items.length)
        s.vwHalf = container.clientWidth * 0.5

        s.items.forEach((it, i) => {
            it.x = i * s.step
        })

        // Wait for images then start
        const imgElements = Array.from(
            cardsRoot.querySelectorAll("img")
        ) as HTMLImageElement[]
        const loadPromises = imgElements.map((img) => {
            if (img.complete) return Promise.resolve()
            return new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
            })
        })

        Promise.all(loadPromises).then(() => {
            if (!s.mounted) return
            buildPalette()

            // Find initial centered card
            const half = s.track / 2
            let closestIdx = 0,
                closestDist = Infinity
            for (let i = 0; i < s.items.length; i++) {
                let pos = s.items[i].x - s.scrollX
                if (pos < -half) pos += s.track
                if (pos > half) pos -= s.track
                if (Math.abs(pos) < closestDist) {
                    closestDist = Math.abs(pos)
                    closestIdx = i
                }
            }
            setActiveGradient(closestIdx)
            updateCarouselTransforms()

            // Entry animation: fade in cards
            s.items.forEach((it) => {
                it.el.style.opacity = "0"
            })
            requestAnimationFrame(() => {
                s.items.forEach((it, i) => {
                    setTimeout(() => {
                        it.el.style.transition = "opacity 0.5s ease"
                        it.el.style.opacity = "1"
                        setTimeout(() => {
                            it.el.style.transition = ""
                        }, 600)
                    }, i * 50)
                })
            })

            // Start loops
            s.lastTime = 0
            s.rafId = requestAnimationFrame(tick)
            if (showGradientBg) {
                s.bgRafId = requestAnimationFrame(drawBackground)
            }
        })

        // ── Events ──
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const delta =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            s.vX += delta * wheelSensitivity * 20
        }

        const onPointerDown = (e: PointerEvent) => {
            s.dragging = true
            s.lastX = e.clientX
            s.lastT = performance.now()
            s.lastDelta = 0
            container.setPointerCapture(e.pointerId)
            container.style.cursor = "grabbing"
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!s.dragging) return
            const now = performance.now()
            const dx = e.clientX - s.lastX
            const dt = Math.max(1, now - s.lastT) / 1000
            s.scrollX = mod(s.scrollX - dx * dragSensitivity, s.track)
            s.lastDelta = dx / dt
            s.lastX = e.clientX
            s.lastT = now
        }

        const onPointerUp = (e: PointerEvent) => {
            if (!s.dragging) return
            s.dragging = false
            container.releasePointerCapture(e.pointerId)
            s.vX = -s.lastDelta * dragSensitivity
            container.style.cursor = "grab"
        }

        const onResize = () => {
            if (!s.mounted) return
            s.vwHalf = container.clientWidth * 0.5
            updateCarouselTransforms()
        }

        container.addEventListener("wheel", onWheel, { passive: false })
        container.addEventListener("pointerdown", onPointerDown)
        container.addEventListener("pointermove", onPointerMove)
        container.addEventListener("pointerup", onPointerUp)
        container.addEventListener("pointercancel", onPointerUp)
        container.addEventListener("dragstart", (e) => e.preventDefault())

        const ro = new ResizeObserver(onResize)
        ro.observe(container)

        const onVis = () => {
            if (document.hidden) {
                if (s.rafId) cancelAnimationFrame(s.rafId)
                if (s.bgRafId) cancelAnimationFrame(s.bgRafId)
                s.rafId = null
                s.bgRafId = null
            } else {
                s.lastTime = 0
                if (!s.rafId) s.rafId = requestAnimationFrame(tick)
                if (showGradientBg && !s.bgRafId)
                    s.bgRafId = requestAnimationFrame(drawBackground)
            }
        }
        document.addEventListener("visibilitychange", onVis)

        return () => {
            s.mounted = false
            if (s.rafId) cancelAnimationFrame(s.rafId)
            if (s.bgRafId) cancelAnimationFrame(s.bgRafId)
            s.rafId = null
            s.bgRafId = null
            container.removeEventListener("wheel", onWheel)
            container.removeEventListener("pointerdown", onPointerDown)
            container.removeEventListener("pointermove", onPointerMove)
            container.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("pointercancel", onPointerUp)
            document.removeEventListener("visibilitychange", onVis)
            ro.disconnect()
            while (cardsRoot.firstChild) {
                cardsRoot.removeChild(cardsRoot.firstChild)
            }
        }
    }, [images, gap, cardWidth, cardAspectRatio, borderRadius, showGradientBg])

    // ── Rebuild palette when custom gradient colors change ──
    React.useEffect(() => {
        const s = stateRef.current
        if (!s.items.length) return
        buildPalette()
        // Re-trigger gradient for the current active card
        const prevActive = s.activeIndex
        s.activeIndex = -1
        if (prevActive >= 0) setActiveGradient(prevActive)
    }, [gradientColors, gradColor1, gradColor2])

    // ── Auto-slide effect ──
    React.useEffect(() => {
        if (!autoSlide) return
        const s = stateRef.current
        const container = containerRef.current
        if (!container) return

        const dir = autoSlideDirection === "right" ? 1 : -1
        const speed = autoSlideSpeed

        const onEnter = () => {
            s.hovered = true
        }
        const onLeave = () => {
            s.hovered = false
        }

        if (pauseOnHover) {
            container.addEventListener("pointerenter", onEnter)
            container.addEventListener("pointerleave", onLeave)
        }

        const intervalId = setInterval(() => {
            if (!s.mounted) return
            if (pauseOnHover && s.hovered) return
            if (s.dragging) return
            s.vX += dir * speed * 0.3
        }, 50)

        return () => {
            clearInterval(intervalId)
            if (pauseOnHover) {
                container.removeEventListener("pointerenter", onEnter)
                container.removeEventListener("pointerleave", onLeave)
            }
        }
    }, [autoSlide, autoSlideSpeed, autoSlideDirection, pauseOnHover])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "#f0f0f0",
                perspective: "1800px",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "none",
                cursor: "grab",
                ...style,
            }}
        >
            {showGradientBg && (
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        display: "block",
                        filter: `blur(${bgBlur}px) saturate(${bgSaturation})`,
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
            )}
            <div
                ref={cardsRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    transformStyle: "preserve-3d",
                }}
            />
        </div>
    )
}

GradientSlider.defaultProps = {
    images: DEFAULT_IMAGES,
    gap: 28,
    maxRotation: 28,
    maxDepth: 140,
    minScale: 0.92,
    scaleRange: 0.1,
    friction: 0.9,
    wheelSensitivity: 0.6,
    dragSensitivity: 1.0,
    borderRadius: 15,
    blurAmount: 2,
    bgBlur: 24,
    bgSaturation: 1.05,
    cardAspectRatio: "4/5",
    cardWidth: 280,
    showGradientBg: true,
    gradientTransitionSpeed: 450,
    gradientColors: "auto",
    gradColor1: "#6C8EF5",
    gradColor2: "#B46CF5",
    autoSlide: false,
    autoSlideSpeed: 60,
    autoSlideDirection: "left",
    pauseOnHover: true,
}

addPropertyControls(GradientSlider, {
    // ── Content ──
    images: {
        title: "Images",
        type: ControlType.Array,
        control: { type: ControlType.ResponsiveImage },
        maxCount: 20,
        defaultValue: DEFAULT_IMAGES,
    },

    // ── Card Style ──
    cardWidth: {
        title: "Card Width",
        type: ControlType.Number,
        defaultValue: 280,
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
        displayStepper: true,
    },
    cardAspectRatio: {
        title: "Aspect Ratio",
        type: ControlType.Enum,
        options: ["4/5", "3/4", "1/1", "16/9", "9/16"],
        optionTitles: ["4:5", "3:4", "1:1", "16:9", "9:16"],
        defaultValue: "4/5",
    },
    gap: {
        title: "Card Gap",
        type: ControlType.Number,
        defaultValue: 28,
        min: 0,
        max: 100,
        step: 4,
        unit: "px",
        displayStepper: true,
    },
    borderRadius: {
        title: "Corner Radius",
        type: ControlType.Number,
        defaultValue: 15,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        displayStepper: true,
    },

    // ── Background ──
    showGradientBg: {
        title: "Gradient BG",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    gradientColors: {
        title: "Colors",
        type: ControlType.Enum,
        options: ["auto", "custom"],
        optionTitles: ["Auto from image", "Custom"],
        defaultValue: "auto",
        description: "Auto extracts colors from each image.",
        hidden: (props: any) => !props.showGradientBg,
    },
    gradColor1: {
        title: "Color 1",
        type: ControlType.Color,
        defaultValue: "#6C8EF5",
        hidden: (props: any) =>
            !props.showGradientBg || props.gradientColors !== "custom",
    },
    gradColor2: {
        title: "Color 2",
        type: ControlType.Color,
        defaultValue: "#B46CF5",
        hidden: (props: any) =>
            !props.showGradientBg || props.gradientColors !== "custom",
    },

    // ── Motion ──
    maxRotation: {
        title: "3D Rotation",
        type: ControlType.Number,
        defaultValue: 28,
        min: 0,
        max: 60,
        step: 1,
        unit: "°",
        description: "Max Y-axis rotation of side cards.",
    },

    // ── Auto Slide ──
    autoSlide: {
        title: "Auto Slide",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoSlideDirection: {
        title: "Direction",
        type: ControlType.Enum,
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
        hidden: (props: any) => !props.autoSlide,
    },
    autoSlideSpeed: {
        title: "Speed",
        type: ControlType.Number,
        defaultValue: 60,
        min: 10,
        max: 300,
        step: 10,
        description: "Auto-scroll velocity.",
        hidden: (props: any) => !props.autoSlide,
    },
    pauseOnHover: {
        title: "Pause on Hover",
        type: ControlType.Boolean,
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props: any) => !props.autoSlide,
    },
})
