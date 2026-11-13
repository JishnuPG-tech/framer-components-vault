import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const CAPTION_FONT =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
const LABEL_FONT =
    "'SFMono-Regular', Menlo, Consolas, 'Liberation Mono', monospace"
const PRINT_MAX_SIDE = 640
const LIGHTBOX_MAX_SIDE = 960

// Drying-line geometry (px)
const ROW_TOP = 34
const WIRE_Y = 8

const RATIOS = {
    "4:5": 4 / 5,
    "1:1": 1,
    "3:2": 3 / 2,
    "2:3": 2 / 3,
}

// Shadow and highlight colours for each print toning
const TONES = {
    bw: [
        [16, 16, 17],
        [250, 250, 247],
    ],
    sepia: [
        [48, 30, 18],
        [250, 238, 218],
    ],
    cyanotype: [
        [16, 44, 96],
        [236, 242, 246],
    ],
}

// Shown only until the user adds their own images
const DEMO_ITEMS = [
    { caption: "Harbour, early light" },
    { caption: "Ridge line" },
    { caption: "Night market" },
    { caption: "Pines after rain" },
    { caption: "Salt flats" },
    { caption: "The long road home" },
]

function usePrefersReducedMotion() {
    const [prefers, setPrefers] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setPrefers(mq.matches)
        function handler(e) {
            setPrefers(e.matches)
        }
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [])
    return prefers
}

function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v
}

function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function hash2(x, y, seed) {
    let h =
        Math.imul(x, 374761393) ^
        Math.imul(y, 668265263) ^
        Math.imul(seed + 1, 1442695041)
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    h ^= h >>> 16
    return (h >>> 0) / 4294967295
}

function valueNoise(x, y, seed) {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = x - xi
    const yf = y - yi
    const u = xf * xf * (3 - 2 * xf)
    const v = yf * yf * (3 - 2 * yf)
    const a = hash2(xi, yi, seed)
    const b = hash2(xi + 1, yi, seed)
    const c = hash2(xi, yi + 1, seed)
    const d = hash2(xi + 1, yi + 1, seed)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function parseColor(color, fallback) {
    if (typeof document === "undefined") return fallback
    const ctx = document.createElement("canvas").getContext("2d")
    if (!ctx) return fallback
    ctx.fillStyle = "#000"
    ctx.fillStyle = color || ""
    const v = String(ctx.fillStyle)
    if (v[0] === "#" && v.length === 7) {
        return [
            parseInt(v.slice(1, 3), 16),
            parseInt(v.slice(3, 5), 16),
            parseInt(v.slice(5, 7), 16),
        ]
    }
    const m = v.match(/[\d.]+/g)
    return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : fallback
}

function imageSrc(image) {
    if (!image) return ""
    if (typeof image === "string") return image
    return image.src || ""
}

function toneFilter(tone) {
    if (tone === "bw") return "grayscale(1)"
    if (tone === "sepia") return "sepia(0.85)"
    if (tone === "cyanotype")
        return "grayscale(1) sepia(1) hue-rotate(175deg) saturate(2.2)"
    return "none"
}

function printLabel(index) {
    return `No. ${String(index + 1).padStart(2, "0")}`
}

// ---------------------------------------------------------------------------
// Built-in demo photographs (drawn procedurally, no external assets)
// ---------------------------------------------------------------------------

function ridge(ctx, w, h, baseY, amp, freq, seed, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, h)
    for (let i = 0; i <= 64; i++) {
        const x = (i / 64) * w
        const n =
            valueNoise((i / 64) * freq, 0.5, seed) * 0.7 +
            valueNoise((i / 64) * freq * 3, 2.5, seed + 7) * 0.3
        ctx.lineTo(x, baseY - n * amp)
    }
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()
}

function vGradient(ctx, y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1)
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c))
    return g
}

function drawPlaceholder(ctx, w, h, variant) {
    const v = variant % 6
    ctx.save()
    if (v === 0) {
        // Harbour, early light
        ctx.fillStyle = vGradient(ctx, 0, h * 0.6, [
            "#F6C9A0",
            "#C8B6C8",
            "#8FA9C4",
        ])
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = "#FFE7C2"
        ctx.beginPath()
        ctx.arc(w * 0.68, h * 0.5, w * 0.09, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = vGradient(ctx, h * 0.58, h, ["#7F98B2", "#3E5770"])
        ctx.fillRect(0, h * 0.58, w, h * 0.42)
        ctx.fillStyle = "rgba(255,231,194,0.5)"
        for (let i = 0; i < 9; i++) {
            ctx.fillRect(
                w * 0.6 + hash2(i, 1, 3) * w * 0.14,
                h * (0.61 + i * 0.035),
                w * 0.06,
                2
            )
        }
        ctx.fillStyle = "#1E2A36"
        for (let i = 0; i < 3; i++) {
            const bx = w * (0.14 + i * 0.16)
            const by = h * (0.66 + i * 0.05)
            ctx.fillRect(bx - w * 0.05, by, w * 0.1, h * 0.02)
            ctx.beginPath()
            ctx.moveTo(bx, by)
            ctx.lineTo(bx, by - h * 0.12)
            ctx.lineTo(bx + w * 0.05, by - h * 0.01)
            ctx.closePath()
            ctx.fill()
        }
        ctx.fillRect(0, h * 0.86, w * 0.42, h * 0.025)
        for (let i = 0; i < 5; i++)
            ctx.fillRect(w * (0.04 + i * 0.09), h * 0.86, w * 0.012, h * 0.14)
    } else if (v === 1) {
        // Ridge line
        ctx.fillStyle = vGradient(ctx, 0, h, ["#DCE6EE", "#F2E6D8"])
        ctx.fillRect(0, 0, w, h)
        ridge(ctx, w, h, h * 0.5, h * 0.22, 3, 11, "#A7B4C2")
        ridge(ctx, w, h, h * 0.66, h * 0.24, 4, 23, "#6F8094")
        ridge(ctx, w, h, h * 0.84, h * 0.26, 5, 37, "#34404F")
        ctx.strokeStyle = "rgba(30,36,44,0.8)"
        ctx.lineWidth = Math.max(1, w * 0.004)
        for (let i = 0; i < 3; i++) {
            const bx = w * (0.3 + i * 0.05)
            const by = h * (0.2 + hash2(i, 2, 5) * 0.06)
            ctx.beginPath()
            ctx.moveTo(bx - w * 0.015, by)
            ctx.lineTo(bx, by + w * 0.008)
            ctx.lineTo(bx + w * 0.015, by)
            ctx.stroke()
        }
    } else if (v === 2) {
        // Night market
        ctx.fillStyle = vGradient(ctx, 0, h, ["#141B33", "#2B2547", "#4A2E3E"])
        ctx.fillRect(0, 0, w, h)
        let x = 0
        let i = 0
        while (x < w) {
            const bw = w * (0.09 + hash2(i, 3, 9) * 0.1)
            const bh = h * (0.3 + hash2(i, 4, 9) * 0.35)
            ctx.fillStyle = "#0F1222"
            ctx.fillRect(x, h - bh, bw, bh)
            for (
                let wy = h - bh + h * 0.03;
                wy < h - h * 0.2;
                wy += h * 0.045
            ) {
                for (
                    let wx = x + bw * 0.15;
                    wx < x + bw - bw * 0.2;
                    wx += bw * 0.25
                ) {
                    if (hash2(Math.round(wx), Math.round(wy), 4) > 0.55) {
                        ctx.fillStyle = "#F4C46A"
                        ctx.fillRect(wx, wy, bw * 0.1, h * 0.018)
                    }
                }
            }
            x += bw
            i++
        }
        for (let k = 0; k < 24; k++) {
            const t = k / 23
            const lx = t * w
            const ly = h * 0.55 + Math.sin(t * Math.PI) * h * 0.06
            ctx.fillStyle = ["#FF8A5B", "#FFD36E", "#F05A7E"][k % 3]
            ctx.beginPath()
            ctx.arc(lx, ly, w * 0.008, 0, Math.PI * 2)
            ctx.fill()
        }
        ctx.fillStyle = "#E2593F"
        ctx.fillRect(w * 0.1, h * 0.78, w * 0.3, h * 0.05)
        ctx.fillStyle = "#3C8D7E"
        ctx.fillRect(w * 0.55, h * 0.8, w * 0.32, h * 0.05)
        ctx.fillStyle = "#0A0C16"
        ctx.fillRect(0, h * 0.86, w, h * 0.14)
    } else if (v === 3) {
        // Pines after rain
        ctx.fillStyle = vGradient(ctx, 0, h, ["#E3EAE4", "#B9C9BE"])
        ctx.fillRect(0, 0, w, h)
        const rows = [
            ["#9DB3A6", 0.55, 0.05],
            ["#6E8D7D", 0.72, 0.075],
            ["#3A5A4A", 0.92, 0.11],
        ]
        rows.forEach(([color, base, size], r) => {
            ctx.fillStyle = color
            for (let k = -1; k < 14; k++) {
                const tx = (k + hash2(k, r, 6) * 0.6) * (w / 11)
                const th = h * size * (2.4 + hash2(k, r, 8) * 1.4)
                const tw = w * size * 0.9
                ctx.beginPath()
                ctx.moveTo(tx, h * base - th)
                ctx.lineTo(tx + tw / 2, h * base)
                ctx.lineTo(tx - tw / 2, h * base)
                ctx.closePath()
                ctx.fill()
            }
            ctx.fillRect(0, h * base - 1, w, h)
        })
    } else if (v === 4) {
        // Salt flats
        ctx.fillStyle = vGradient(ctx, 0, h * 0.62, ["#9CC3E0", "#E7F0F4"])
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = vGradient(ctx, h * 0.62, h, ["#F4F2EC", "#D9D6CC"])
        ctx.fillRect(0, h * 0.62, w, h * 0.38)
        ctx.strokeStyle = "rgba(160,150,130,0.35)"
        ctx.lineWidth = 1
        for (let k = 0; k < 18; k++) {
            ctx.beginPath()
            ctx.moveTo(hash2(k, 1, 2) * w, h * 0.64 + hash2(k, 2, 2) * h * 0.36)
            ctx.lineTo(hash2(k, 3, 2) * w, h * 0.64 + hash2(k, 4, 2) * h * 0.36)
            ctx.stroke()
        }
        ctx.fillStyle = "rgba(255,255,255,0.9)"
        ctx.beginPath()
        ctx.ellipse(w * 0.3, h * 0.2, w * 0.14, h * 0.03, 0, 0, Math.PI * 2)
        ctx.ellipse(w * 0.72, h * 0.32, w * 0.1, h * 0.022, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#2A2622"
        const fx = w * 0.62
        const fy = h * 0.66
        ctx.fillRect(fx - w * 0.008, fy - h * 0.07, w * 0.016, h * 0.07)
        ctx.beginPath()
        ctx.arc(fx, fy - h * 0.08, w * 0.012, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "rgba(42,38,34,0.25)"
        ctx.fillRect(fx - w * 0.008, fy, w * 0.016, h * 0.05)
    } else {
        // The long road home
        ctx.fillStyle = vGradient(ctx, 0, h * 0.5, ["#F2A65A", "#F7D9A8"])
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = "#FFF1D6"
        ctx.beginPath()
        ctx.arc(w * 0.5, h * 0.46, w * 0.08, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = vGradient(ctx, h * 0.46, h, ["#B7A16A", "#6F6236"])
        ctx.fillRect(0, h * 0.46, w, h * 0.54)
        ctx.fillStyle = "#3B3833"
        ctx.beginPath()
        ctx.moveTo(w * 0.48, h * 0.46)
        ctx.lineTo(w * 0.52, h * 0.46)
        ctx.lineTo(w * 0.82, h)
        ctx.lineTo(w * 0.18, h)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = "#EDE3C8"
        for (let k = 0; k < 7; k++) {
            const t0 = Math.pow(k / 7, 1.6)
            const t1 = Math.pow((k + 0.5) / 7, 1.6)
            const y0 = h * 0.46 + t0 * h * 0.54
            const y1 = h * 0.46 + t1 * h * 0.54
            const lw0 = w * (0.002 + t0 * 0.012)
            const lw1 = w * (0.002 + t1 * 0.012)
            ctx.beginPath()
            ctx.moveTo(w * 0.5 - lw0, y0)
            ctx.lineTo(w * 0.5 + lw0, y0)
            ctx.lineTo(w * 0.5 + lw1, y1)
            ctx.lineTo(w * 0.5 - lw1, y1)
            ctx.closePath()
            ctx.fill()
        }
        ctx.fillStyle = "#2E2A22"
        for (let k = 0; k < 6; k++) {
            const t = Math.pow(k / 6, 1.5)
            const px = w * (0.47 - t * 0.33)
            const py = h * 0.46 + t * h * 0.5
            ctx.fillRect(
                px,
                py - h * (0.02 + t * 0.12),
                w * (0.003 + t * 0.006),
                h * (0.02 + t * 0.12)
            )
        }
    }
    ctx.restore()
}

// ---------------------------------------------------------------------------
// The developing emulsion: blank paper → image, shadows first
// ---------------------------------------------------------------------------

function DevelopingPhoto({
    src,
    variant,
    alt,
    ratio,
    target,
    delay,
    duration,
    tone,
    paperColor,
    latentImage,
    ripple,
    grain,
    maxSide,
    isStatic,
    reducedMotion,
    onRatio,
    radius,
}) {
    const boxRef = useRef(null)
    const canvasRef = useRef(null)
    const imgRef = useRef(null)
    const optsRef = useRef(null)
    const reducedRef = useRef(reducedMotion)
    const onRatioRef = useRef(onRatio)
    const st = useRef({
        p: 0,
        target: 0,
        raf: 0,
        timer: 0,
        last: 0,
        t: 0,
        w: 0,
        h: 0,
        tone: null,
        lum: null,
        noise: null,
        out: null,
        paper: [241, 238, 230],
    })
    const [box, setBox] = useState({ w: 0, h: 0 })
    const [fallback, setFallback] = useState(false)

    optsRef.current = { duration, latentImage, ripple, tone }
    reducedRef.current = reducedMotion
    onRatioRef.current = onRatio

    function draw() {
        const s = st.current
        const cfg = optsRef.current
        const latent = clamp01(cfg.latentImage)
        const d = latent + (1 - latent) * easeInOut(s.p)
        const motion = reducedRef.current ? 0 : Math.sin(Math.PI * s.p)

        if (imgRef.current) {
            const el = imgRef.current
            el.style.opacity = String(clamp01(d * 1.15))
            el.style.filter = `${toneFilter(cfg.tone)} contrast(${0.6 + d * 0.5}) blur(${
                motion * cfg.ripple * 0.8
            }px)`
        }

        const canvas = canvasRef.current
        if (!canvas || !s.out || !s.tone) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const { w, h, lum, noise, out } = s
        const toneBuf = s.tone
        const o = out.data
        const [pr, pg, pb] = s.paper
        const amp = motion * cfg.ripple * w * 0.012
        const phase = s.t * 2.4

        for (let y = 0; y < h; y++) {
            const off = amp
                ? Math.round(
                      Math.sin(y * 0.06 + phase) * amp +
                          Math.sin(y * 0.021 - phase * 0.7) * amp * 0.6
                  )
                : 0
            const row = y * w
            for (let x = 0; x < w; x++) {
                const i = row + x
                let sx = x + off
                if (sx < 0) sx = 0
                else if (sx >= w) sx = w - 1
                const si = row + sx

                // Uneven development: each spot of the print crosses its own threshold
                const n = noise[i] * 0.55
                let L = (d - n) / 0.45
                L = L < 0 ? 0 : L > 1 ? 1 : L * L * (3 - 2 * L)
                // Shadows appear first, highlights last — like a real print in the tray
                let a = L * 1.7 - lum[si] * 0.7
                a = a < 0 ? 0 : a > 1 ? 1 : a

                const j = i * 4
                const k = si * 4
                o[j] = pr + (toneBuf[k] - pr) * a
                o[j + 1] = pg + (toneBuf[k + 1] - pg) * a
                o[j + 2] = pb + (toneBuf[k + 2] - pb) * a
                o[j + 3] = 255
            }
        }
        ctx.putImageData(out, 0, 0)

        // Wet sheen sliding across the print while it develops
        const sheen = motion * 0.22 * cfg.ripple
        if (sheen > 0.01) {
            const gx = (((s.t * 0.3) % 1.6) - 0.3) * w
            const g = ctx.createLinearGradient(gx - w * 0.4, 0, gx + w * 0.4, h)
            g.addColorStop(0, "rgba(255,255,255,0)")
            g.addColorStop(0.5, `rgba(255,255,255,${sheen})`)
            g.addColorStop(1, "rgba(255,255,255,0)")
            ctx.fillStyle = g
            ctx.fillRect(0, 0, w, h)
        }
    }

    function tick(now) {
        const s = st.current
        const dt = Math.min(0.05, Math.max(0, (now - s.last) / 1000))
        s.last = now
        s.t += dt
        const dur = Math.max(0.1, optsRef.current.duration)
        // Fading back is quicker than developing
        const step = (dt / dur) * (s.target < s.p ? 1.8 : 1)
        if (s.p < s.target) s.p = Math.min(s.target, s.p + step)
        else s.p = Math.max(s.target, s.p - step)
        draw()
        s.raf = s.p !== s.target ? requestAnimationFrame(tick) : 0
    }

    function animateTo(value, wait) {
        const s = st.current
        clearTimeout(s.timer)
        const go = () => {
            s.target = value
            if (reducedRef.current) {
                s.p = value
                draw()
                return
            }
            if (!s.raf && s.p !== s.target) {
                s.last = performance.now()
                s.raf = requestAnimationFrame(tick)
            }
        }
        if (wait > 0) s.timer = setTimeout(go, wait * 1000)
        else go()
    }

    useEffect(() => {
        const s = st.current
        return () => {
            cancelAnimationFrame(s.raf)
            clearTimeout(s.timer)
        }
    }, [])

    useEffect(() => {
        if (isStatic) {
            const s = st.current
            s.p = 1
            s.target = 1
            draw()
            return
        }
        animateTo(target, target > st.current.target ? delay || 0 : 0)
    }, [target, isStatic])

    // Track the emulsion area size
    useEffect(() => {
        const el = boxRef.current
        if (!el) return
        const update = () => {
            const w = Math.round(el.offsetWidth)
            const h = Math.round(el.offsetHeight)
            setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
        }
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Build the image buffers whenever the source, size or toning changes
    useEffect(() => {
        if (!box.w || !box.h || typeof document === "undefined") return
        let cancelled = false
        const s = st.current
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const scale = Math.min(dpr, maxSide / Math.max(box.w, box.h))
        const w = Math.max(1, Math.round(box.w * scale))
        const h = Math.max(1, Math.round(box.h * scale))
        s.paper = parseColor(paperColor, [241, 238, 230])

        const build = (img) => {
            if (cancelled) return
            const off = document.createElement("canvas")
            off.width = w
            off.height = h
            const octx = off.getContext("2d")
            if (!octx) return
            if (img && img.naturalWidth && img.naturalHeight) {
                const k = Math.max(w / img.naturalWidth, h / img.naturalHeight)
                const dw = img.naturalWidth * k
                const dh = img.naturalHeight * k
                octx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
            } else {
                drawPlaceholder(octx, w, h, variant)
            }

            let data
            try {
                data = octx.getImageData(0, 0, w, h).data
            } catch (err) {
                // Cross-origin image: fall back to a CSS-driven development
                s.tone = null
                setFallback(true)
                return
            }
            setFallback(false)

            const count = w * h
            const toneBuf = new Uint8ClampedArray(count * 4)
            const lum = new Float32Array(count)
            const noise = new Float32Array(count)
            const pair = TONES[tone]
            const f1 = 4 / Math.max(w, h)
            const f2 = 14 / Math.max(w, h)
            const seed = variant * 17 + 3
            const grainAmp = grain * 26

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const i = y * w + x
                    const j = i * 4
                    const r = data[j]
                    const g = data[j + 1]
                    const b = data[j + 2]
                    const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                    lum[i] = l
                    const gr = grainAmp
                        ? (hash2(x, y, seed + 11) - 0.5) * grainAmp
                        : 0
                    if (pair) {
                        const c = clamp01((l - 0.5) * 1.12 + 0.5)
                        toneBuf[j] =
                            pair[0][0] + (pair[1][0] - pair[0][0]) * c + gr
                        toneBuf[j + 1] =
                            pair[0][1] + (pair[1][1] - pair[0][1]) * c + gr
                        toneBuf[j + 2] =
                            pair[0][2] + (pair[1][2] - pair[0][2]) * c + gr
                    } else {
                        toneBuf[j] = r + gr
                        toneBuf[j + 1] = g + gr
                        toneBuf[j + 2] = b + gr
                    }
                    toneBuf[j + 3] = 255
                    // Developer washes in from the top, in uneven patches
                    noise[i] =
                        valueNoise(x * f1, y * f1, seed) * 0.55 +
                        valueNoise(x * f2, y * f2, seed + 5) * 0.25 +
                        (y / h) * 0.2
                }
            }

            const canvas = canvasRef.current
            if (!canvas) return
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            s.w = w
            s.h = h
            s.tone = toneBuf
            s.lum = lum
            s.noise = noise
            s.out = ctx.createImageData(w, h)
            draw()
        }

        if (!src) {
            build(null)
        } else {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.decoding = "async"
            img.onload = () => {
                if (!cancelled && onRatioRef.current && img.naturalHeight) {
                    onRatioRef.current(img.naturalWidth / img.naturalHeight)
                }
                build(img)
            }
            img.onerror = () => build(null)
            img.src = src
        }
        return () => {
            cancelled = true
        }
    }, [box.w, box.h, src, tone, paperColor, variant, grain, maxSide])

    // Redraw when visual settings change while idle
    useEffect(() => {
        if (!st.current.raf) draw()
    }, [latentImage, ripple, fallback])

    return (
        <div
            ref={boxRef}
            style={{
                position: "relative",
                width: "100%",
                aspectRatio: String(ratio),
                background: paperColor,
                overflow: "hidden",
                borderRadius: radius || 0,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: fallback ? "none" : "block",
                }}
            />
            {fallback && src && (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt || ""}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0,
                    }}
                />
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// A print in the gallery (grid card or hanging on the drying line)
// ---------------------------------------------------------------------------

function Peg({ left, color }) {
    const len = ROW_TOP - WIRE_Y
    return (
        <div
            style={{
                position: "absolute",
                top: -len,
                left,
                width: 9,
                height: len + 12,
                marginLeft: -4.5,
                borderRadius: 2,
                backgroundColor: color,
                backgroundImage:
                    "linear-gradient(90deg, rgba(0,0,0,0.28), rgba(255,255,255,0.18) 45%, rgba(0,0,0,0.28))",
                boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                zIndex: 2,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: -1,
                    right: -1,
                    top: "42%",
                    height: 3,
                    background: "rgba(40,40,40,0.75)",
                    borderRadius: 1,
                }}
            />
        </div>
    )
}

function Print({
    item,
    index,
    cfg,
    sagOffset,
    dimmed,
    isStatic,
    reducedMotion,
    onHover,
    onOpen,
}) {
    const wrapRef = useRef(null)
    const swingRef = useRef(null)
    const [target, setTarget] = useState(0)
    const [hovered, setHovered] = useState(false)
    const cfgRef = useRef(cfg)
    cfgRef.current = cfg

    const {
        layout,
        trigger,
        keepDeveloped,
        staggerDelay,
        swing,
        tilt,
        printColor,
        borderWidth,
        radius,
        showCaptions,
        showNumbers,
        captionColor,
        pegColor,
        focusDim,
        lightbox,
    } = cfg
    const onLine = layout === "line"

    // Scroll-into-view trigger
    useEffect(() => {
        if (isStatic || trigger !== "inView") {
            if (trigger !== "inView") setTarget(0)
            return
        }
        const el = wrapRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setTarget(1)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) setTarget(1)
                else if (!cfgRef.current.keepDeveloped) setTarget(0)
            },
            { threshold: 0.3 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [trigger, isStatic])

    function playSwing() {
        const el = swingRef.current
        if (!el || !el.animate || reducedMotion || !swing) return
        const a = 5 * swing
        el.animate(
            [
                { transform: "rotate(0deg)" },
                { transform: `rotate(${a}deg)` },
                { transform: `rotate(${-a * 0.7}deg)` },
                { transform: `rotate(${a * 0.4}deg)` },
                { transform: `rotate(${-a * 0.15}deg)` },
                { transform: "rotate(0deg)" },
            ],
            { duration: 1700, easing: "ease-out" }
        )
    }

    function onEnter() {
        if (isStatic) return
        setHovered(true)
        onHover(index)
        if (onLine) playSwing()
        if (trigger === "hover") setTarget(1)
    }

    function onLeave() {
        if (isStatic) return
        setHovered(false)
        onHover(null)
        if (trigger === "hover" && !keepDeveloped) setTarget(0)
    }

    function onClick(e) {
        if (isStatic || !lightbox) return
        e.preventDefault()
        onOpen(index)
    }

    const rotation = (hash2(index, 7, 1) * 2 - 1) * tilt
    const lift = hovered && !isStatic && !reducedMotion && !onLine
    const Wrapper = item.link && !lightbox ? "a" : "div"

    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                marginTop: onLine ? sagOffset : 0,
                transformOrigin: "50% 0",
                transform: `translateY(${lift ? -6 : 0}px) rotate(${
                    lift ? rotation * 0.3 : rotation
                }deg)`,
                filter: dimmed
                    ? `brightness(${1 - focusDim})`
                    : "brightness(1)",
                transition:
                    "transform 0.45s cubic-bezier(.2,.8,.2,1), filter 0.4s ease",
            }}
        >
            <div ref={swingRef} style={{ transformOrigin: "50% 0" }}>
                {onLine && <Peg left="22%" color={pegColor} />}
                {onLine && <Peg left="78%" color={pegColor} />}
                <Wrapper
                    href={Wrapper === "a" ? item.link : undefined}
                    onPointerEnter={onEnter}
                    onPointerLeave={onLeave}
                    onClick={onClick}
                    role={lightbox ? "button" : undefined}
                    tabIndex={lightbox ? 0 : undefined}
                    aria-label={
                        lightbox
                            ? `Open ${item.caption || printLabel(index)}`
                            : undefined
                    }
                    onKeyDown={(e) => {
                        if (lightbox && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            onOpen(index)
                        }
                    }}
                    style={{
                        display: "block",
                        position: "relative",
                        background: printColor,
                        padding: borderWidth,
                        paddingBottom: showCaptions
                            ? borderWidth + 4
                            : borderWidth,
                        borderRadius: radius,
                        textDecoration: "none",
                        cursor: lightbox || item.link ? "zoom-in" : "default",
                        boxShadow: lift
                            ? "0 18px 34px rgba(0,0,0,0.38), 0 3px 8px rgba(0,0,0,0.25)"
                            : "0 6px 14px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.25)",
                        transition: "box-shadow 0.45s ease",
                        outline: "none",
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    <DevelopingPhoto
                        src={imageSrc(item.image)}
                        variant={index}
                        alt={item.caption}
                        ratio={cfg.ratio}
                        target={isStatic ? 1 : target}
                        delay={trigger === "inView" ? index * staggerDelay : 0}
                        duration={cfg.duration}
                        tone={cfg.tone}
                        paperColor={cfg.paperColor}
                        latentImage={cfg.latentImage}
                        ripple={cfg.ripple}
                        grain={cfg.grain}
                        maxSide={PRINT_MAX_SIDE}
                        isStatic={isStatic}
                        reducedMotion={reducedMotion}
                        radius={Math.max(0, radius - borderWidth)}
                    />
                    {showCaptions && (item.caption || showNumbers) && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                justifyContent: "space-between",
                                gap: 8,
                                marginTop: Math.max(6, borderWidth * 0.6),
                                color: captionColor,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: CAPTION_FONT,
                                    fontSize: 13,
                                    lineHeight: 1.3,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item.caption}
                            </span>
                            {showNumbers && (
                                <span
                                    style={{
                                        fontFamily: LABEL_FONT,
                                        fontSize: 10,
                                        letterSpacing: "0.08em",
                                        opacity: 0.6,
                                        flexShrink: 0,
                                    }}
                                >
                                    {printLabel(index)}
                                </span>
                            )}
                        </div>
                    )}
                </Wrapper>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Full-screen viewer — the selected print develops again, large
// ---------------------------------------------------------------------------

function NavButton({ label, onClick, children, style }) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
            style={{
                position: "absolute",
                width: 46,
                height: 46,
                borderRadius: 23,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "#F4EFE8",
                fontSize: 20,
                lineHeight: "44px",
                textAlign: "center",
                cursor: "pointer",
                padding: 0,
                backdropFilter: "blur(6px)",
                ...style,
            }}
        >
            {children}
        </button>
    )
}

function Lightbox({ list, index, cfg, reducedMotion, onClose, onNav }) {
    const rootRef = useRef(null)
    const swipeRef = useRef(null)
    const [ratio, setRatio] = useState(cfg.ratio)
    const item = list[index] || {}
    const src = imageSrc(item.image)
    const many = list.length > 1

    useEffect(() => {
        setRatio(cfg.ratio)
    }, [index, cfg.ratio])

    useEffect(() => {
        const el = rootRef.current
        if (el && el.animate && !reducedMotion) {
            el.animate([{ opacity: 0 }, { opacity: 1 }], {
                duration: 280,
                easing: "ease-out",
            })
        }
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        const onKey = (e) => {
            if (e.key === "Escape") onClose()
            else if (e.key === "ArrowRight") onNav(1)
            else if (e.key === "ArrowLeft") onNav(-1)
        }
        window.addEventListener("keydown", onKey)
        return () => {
            document.body.style.overflow = prevOverflow
            window.removeEventListener("keydown", onKey)
        }
    }, [])

    const r = ratio || 1
    const frame = Math.max(10, cfg.borderWidth * 1.4)

    return (
        <div
            ref={rootRef}
            role="dialog"
            aria-modal="true"
            onClick={onClose}
            onPointerDown={(e) => {
                swipeRef.current = e.clientX
            }}
            onPointerUp={(e) => {
                const start = swipeRef.current
                swipeRef.current = null
                if (start == null || !many) return
                const dx = e.clientX - start
                if (Math.abs(dx) > 60) onNav(dx < 0 ? 1 : -1)
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                padding: 24,
                boxSizing: "border-box",
                background: `radial-gradient(120% 80% at 50% -20%, rgba(190,38,28,${
                    cfg.safelight ? 0.35 : 0
                }), rgba(190,38,28,0) 70%), rgba(12,10,10,0.94)`,
                touchAction: "pan-y",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: `min(86vw, calc(74vh * ${r}))`,
                    background: cfg.printColor,
                    padding: frame,
                    borderRadius: cfg.radius,
                    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
                    boxSizing: "content-box",
                }}
            >
                <DevelopingPhoto
                    key={index}
                    src={src}
                    variant={index}
                    alt={item.caption}
                    ratio={r}
                    target={1}
                    delay={0.15}
                    duration={cfg.duration}
                    tone={cfg.lightboxColor ? "color" : cfg.tone}
                    paperColor={cfg.paperColor}
                    latentImage={0}
                    ripple={cfg.ripple}
                    grain={cfg.grain}
                    maxSide={LIGHTBOX_MAX_SIDE}
                    isStatic={false}
                    reducedMotion={reducedMotion}
                    onRatio={setRatio}
                    radius={Math.max(0, cfg.radius - frame)}
                />
            </div>

            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 14,
                    color: "#F4EFE8",
                    fontFamily: CAPTION_FONT,
                    maxWidth: "86vw",
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        fontFamily: LABEL_FONT,
                        fontSize: 11,
                        opacity: 0.55,
                        letterSpacing: "0.1em",
                    }}
                >
                    {printLabel(index)} / {String(list.length).padStart(2, "0")}
                </span>
                {item.caption && (
                    <span style={{ fontSize: 15 }}>{item.caption}</span>
                )}
                {item.link && (
                    <a
                        href={item.link}
                        style={{
                            fontSize: 13,
                            color: "#F4EFE8",
                            opacity: 0.8,
                            textUnderlineOffset: 3,
                        }}
                    >
                        Open ↗
                    </a>
                )}
            </div>

            <NavButton
                label="Close"
                onClick={onClose}
                style={{ top: 18, right: 18 }}
            >
                ×
            </NavButton>
            {many && (
                <NavButton
                    label="Previous"
                    onClick={() => onNav(-1)}
                    style={{ left: 18, top: "50%", marginTop: -23 }}
                >
                    ‹
                </NavButton>
            )}
            {many && (
                <NavButton
                    label="Next"
                    onClick={() => onNav(1)}
                    style={{ right: 18, top: "50%", marginTop: -23 }}
                >
                    ›
                </NavButton>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

/**
 * Darkroom Gallery
 *
 * Photos develop like prints in a darkroom tray — emerging unevenly from
 * blank paper, shadows first, with a liquid ripple and wet sheen.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1000
 */
export default function DarkroomGallery(props) {
    const {
        items,
        layout,
        trigger,
        keepDeveloped,
        duration,
        staggerDelay,
        tone,
        latentImage,
        ripple,
        grain,
        lightbox,
        lightboxColor,
        columns,
        printWidth,
        maxWidth,
        gap,
        padding,
        aspectRatio,
        tilt,
        swing,
        sag,
        focusDim,
        printColor,
        paperColor,
        borderWidth,
        radius,
        showCaptions,
        showNumbers,
        captionColor,
        wireColor,
        pegColor,
        backgroundColor,
        safelight,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reducedMotion = usePrefersReducedMotion()
    const containerRef = useRef(null)
    const glowRef = useRef(null)
    const [width, setWidth] = useState(0)
    const [hoveredIndex, setHoveredIndex] = useState(null)
    const [openIndex, setOpenIndex] = useState(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const update = () => setWidth(el.offsetWidth || 0)
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Slow breathing of the red safelight
    useEffect(() => {
        const el = glowRef.current
        if (!el || !el.animate || isStatic || reducedMotion || !safelight)
            return
        const anim = el.animate(
            [{ opacity: 1 }, { opacity: 0.7 }, { opacity: 1 }],
            {
                duration: 5200,
                iterations: Infinity,
                easing: "ease-in-out",
            }
        )
        return () => anim.cancel()
    }, [isStatic, reducedMotion, safelight])

    // Show exactly the images the user added; demo prints only when there are none
    const added = Array.isArray(items)
        ? items.filter((it) => it && imageSrc(it.image))
        : []
    const list = added.length ? added : DEMO_ITEMS

    const onLine = layout === "line"
    const contentWidth = Math.max(
        0,
        Math.min(width - padding * 2, maxWidth > 0 ? maxWidth : Infinity)
    )
    const fit = contentWidth
        ? Math.max(1, Math.floor((contentWidth + gap) / (printWidth + gap)))
        : columns
    const cols = Math.max(1, Math.min(columns, fit))
    const colWidth = contentWidth ? (contentWidth - gap * (cols - 1)) / cols : 0

    const rows = []
    for (let i = 0; i < list.length; i += cols)
        rows.push(list.slice(i, i + cols))

    const cfg = {
        layout,
        trigger,
        keepDeveloped,
        duration,
        staggerDelay,
        tone,
        latentImage,
        ripple,
        grain,
        lightbox,
        lightboxColor,
        ratio: RATIOS[aspectRatio] || RATIOS["4:5"],
        tilt: onLine ? tilt * 0.6 : tilt,
        swing,
        focusDim,
        printColor,
        paperColor,
        borderWidth,
        radius,
        showCaptions,
        showNumbers,
        captionColor,
        pegColor,
        safelight,
    }

    function nav(dir) {
        setOpenIndex((i) =>
            i == null ? i : (i + dir + list.length) % list.length
        )
    }

    const wireH = WIRE_Y + Math.max(0, sag) + 4

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
                padding,
                background: backgroundColor,
                overflow: "hidden",
                ...style,
            }}
        >
            {safelight && (
                <div
                    ref={glowRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "radial-gradient(120% 70% at 50% -10%, rgba(190,38,28,0.34), rgba(190,38,28,0) 70%)",
                        pointerEvents: "none",
                    }}
                />
            )}

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: maxWidth > 0 ? maxWidth : undefined,
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: onLine ? gap + 10 : gap,
                }}
            >
                {rows.map((row, r) => {
                    const rowWidth = colWidth
                        ? row.length * colWidth + (row.length - 1) * gap
                        : 0
                    const startX = (contentWidth - rowWidth) / 2
                    return (
                        <div
                            key={r}
                            style={{
                                position: "relative",
                                paddingTop: onLine ? ROW_TOP : 0,
                            }}
                        >
                            {onLine && (
                                <svg
                                    width="100%"
                                    height={wireH}
                                    viewBox={`0 0 100 ${wireH}`}
                                    preserveAspectRatio="none"
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        overflow: "visible",
                                        pointerEvents: "none",
                                    }}
                                >
                                    <path
                                        d={`M0,${WIRE_Y} Q50,${WIRE_Y + 2 * sag} 100,${WIRE_Y}`}
                                        fill="none"
                                        stroke={wireColor}
                                        strokeWidth={1.5}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </svg>
                            )}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: colWidth
                                        ? `repeat(${row.length}, ${colWidth}px)`
                                        : `repeat(${cols}, minmax(0, 1fr))`,
                                    justifyContent: "center",
                                    gap,
                                    alignItems: "start",
                                }}
                            >
                                {row.map((item, c) => {
                                    const index = r * cols + c
                                    const cx =
                                        startX +
                                        c * (colWidth + gap) +
                                        colWidth / 2
                                    const t = contentWidth
                                        ? clamp01(cx / contentWidth)
                                        : 0.5
                                    return (
                                        <Print
                                            key={index}
                                            item={item || {}}
                                            index={index}
                                            cfg={cfg}
                                            sagOffset={4 * sag * t * (1 - t)}
                                            dimmed={
                                                focusDim > 0 &&
                                                hoveredIndex != null &&
                                                hoveredIndex !== index
                                            }
                                            isStatic={isStatic}
                                            reducedMotion={reducedMotion}
                                            onHover={setHoveredIndex}
                                            onOpen={setOpenIndex}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {mounted &&
                !isStatic &&
                openIndex != null &&
                typeof document !== "undefined" &&
                createPortal(
                    <Lightbox
                        list={list}
                        index={openIndex}
                        cfg={cfg}
                        reducedMotion={reducedMotion}
                        onClose={() => setOpenIndex(null)}
                        onNav={nav}
                    />,
                    document.body
                )}
        </div>
    )
}

DarkroomGallery.defaultProps = {
    items: [],
    layout: "line",
    trigger: "hover",
    keepDeveloped: false,
    duration: 2.2,
    staggerDelay: 0.25,
    tone: "bw",
    latentImage: 0.12,
    ripple: 1,
    grain: 0.35,
    lightbox: true,
    lightboxColor: true,
    columns: 3,
    printWidth: 200,
    maxWidth: 0,
    gap: 32,
    padding: 40,
    aspectRatio: "4:5",
    tilt: 1.5,
    swing: 1,
    sag: 14,
    focusDim: 0.3,
    printColor: "#FAF8F3",
    paperColor: "#F1EEE6",
    borderWidth: 14,
    radius: 2,
    showCaptions: true,
    showNumbers: true,
    captionColor: "#3A3633",
    wireColor: "#8A7F76",
    pegColor: "#B8946A",
    backgroundColor: "#151313",
    safelight: true,
}

addPropertyControls(DarkroomGallery, {
    items: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 24,
        defaultValue: [],
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                caption: { type: ControlType.String, title: "Caption" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["line", "grid"],
        optionTitles: ["Drying Line", "Grid"],
        defaultValue: "line",
        displaySegmentedControl: true,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Develop On",
        options: ["hover", "inView"],
        optionTitles: ["Hover", "Scroll Into View"],
        defaultValue: "hover",
    },
    keepDeveloped: {
        type: ControlType.Boolean,
        title: "Keep Developed",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: false,
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 1.5,
        step: 0.05,
        unit: "s",
        defaultValue: 0.25,
        hidden: (p) => p.trigger !== "inView",
    },
    duration: {
        type: ControlType.Number,
        title: "Develop Time",
        min: 0.3,
        max: 6,
        step: 0.1,
        unit: "s",
        defaultValue: 2.2,
    },
    tone: {
        type: ControlType.Enum,
        title: "Print Tone",
        options: ["bw", "sepia", "cyanotype", "color"],
        optionTitles: ["Black & White", "Sepia", "Cyanotype", "Color"],
        defaultValue: "bw",
    },
    latentImage: {
        type: ControlType.Number,
        title: "Latent Image",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.12,
    },
    ripple: {
        type: ControlType.Number,
        title: "Liquid Ripple",
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 1,
    },
    grain: {
        type: ControlType.Number,
        title: "Film Grain",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
    },
    lightbox: {
        type: ControlType.Boolean,
        title: "Lightbox",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    lightboxColor: {
        type: ControlType.Boolean,
        title: "Lightbox Color",
        enabledTitle: "Full",
        disabledTitle: "Toned",
        defaultValue: true,
        hidden: (p) => !p.lightbox,
    },
    columns: {
        type: ControlType.Number,
        title: "Max Columns",
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
        defaultValue: 3,
    },
    printWidth: {
        type: ControlType.Number,
        title: "Min Print Width",
        min: 100,
        max: 600,
        step: 10,
        unit: "px",
        defaultValue: 200,
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        min: 0,
        max: 2400,
        step: 20,
        unit: "px",
        defaultValue: 0,
        description: "0 = use the full component width.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 120,
        step: 1,
        defaultValue: 32,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 160,
        step: 1,
        defaultValue: 40,
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Ratio",
        options: ["4:5", "1:1", "3:2", "2:3"],
        optionTitles: ["4:5", "1:1", "3:2", "2:3"],
        defaultValue: "4:5",
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        min: 0,
        max: 6,
        step: 0.5,
        unit: "°",
        defaultValue: 1.5,
    },
    swing: {
        type: ControlType.Number,
        title: "Swing",
        min: 0,
        max: 2,
        step: 0.1,
        defaultValue: 1,
        hidden: (p) => p.layout !== "line",
    },
    sag: {
        type: ControlType.Number,
        title: "Wire Sag",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 14,
        hidden: (p) => p.layout !== "line",
    },
    wireColor: {
        type: ControlType.Color,
        title: "Wire Color",
        defaultValue: "#8A7F76",
        hidden: (p) => p.layout !== "line",
    },
    pegColor: {
        type: ControlType.Color,
        title: "Peg Color",
        defaultValue: "#B8946A",
        hidden: (p) => p.layout !== "line",
    },
    focusDim: {
        type: ControlType.Number,
        title: "Focus Dim",
        min: 0,
        max: 0.7,
        step: 0.05,
        defaultValue: 0.3,
    },
    printColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#FAF8F3",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 14,
    },
    paperColor: {
        type: ControlType.Color,
        title: "Blank Paper",
        defaultValue: "#F1EEE6",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 24,
        step: 1,
        defaultValue: 2,
    },
    showCaptions: {
        type: ControlType.Boolean,
        title: "Captions",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    showNumbers: {
        type: ControlType.Boolean,
        title: "Print Numbers",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
        hidden: (p) => !p.showCaptions,
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#3A3633",
        hidden: (p) => !p.showCaptions,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#151313",
    },
    safelight: {
        type: ControlType.Boolean,
        title: "Safelight Glow",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
})
