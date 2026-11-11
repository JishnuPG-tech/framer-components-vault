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


/**
 * Blob Image Card
 * Photo masked into a smooth, merged-circle blob shape that morphs fluidly on hover,
 * with optional image textures (monochrome, duotone, posterize, dither, halftone, pixel).
 * Self-contained: only uses React + Framer's public API (addPropertyControls, useIsStaticRenderer). Nothing global is touched.
 *
 * Performance: all animation is disabled in static renderers (canvas thumbnails / exports),
 * which show a clean static pose instead, and it is paused whenever the card is scrolled out of view.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 560
 */

// x (0-1 of width), y (0-1 of height), r (0-1 of width)
type Circle = [number, number, number]

const SHAPES: Record<string, Circle[]> = {
    totem: [[0.46, 0.27, 0.34], [0.62, 0.55, 0.29], [0.34, 0.8, 0.27]],
    duo: [[0.4, 0.33, 0.37], [0.62, 0.7, 0.33]],
    cascade: [[0.28, 0.2, 0.26], [0.62, 0.42, 0.27], [0.38, 0.66, 0.26], [0.7, 0.88, 0.22]],
    orbit: [[0.5, 0.5, 0.4], [0.84, 0.17, 0.13], [0.15, 0.86, 0.12]],
    bloom: [[0.5, 0.3, 0.3], [0.25, 0.58, 0.24], [0.75, 0.58, 0.24], [0.5, 0.84, 0.26]],
    snake: [[0.3, 0.13, 0.22], [0.7, 0.31, 0.22], [0.3, 0.5, 0.22], [0.7, 0.69, 0.22], [0.3, 0.87, 0.22]],
    diagonal: [[0.22, 0.14, 0.2], [0.42, 0.34, 0.25], [0.62, 0.57, 0.27], [0.8, 0.83, 0.22]],
    capsule: [[0.5, 0.3, 0.38], [0.5, 0.5, 0.38], [0.5, 0.7, 0.38]],
    peanut: [[0.5, 0.3, 0.34], [0.5, 0.72, 0.34]],
    droplet: [[0.5, 0.64, 0.42], [0.5, 0.2, 0.15]],
    cluster: [[0.34, 0.28, 0.28], [0.72, 0.36, 0.24], [0.5, 0.62, 0.3], [0.3, 0.86, 0.2]],
    wave: [[0.17, 0.5, 0.18], [0.39, 0.34, 0.18], [0.61, 0.66, 0.18], [0.83, 0.5, 0.18]],
    stepping: [[0.25, 0.2, 0.24], [0.75, 0.2, 0.24], [0.25, 0.8, 0.24], [0.75, 0.8, 0.24]],
    crescent: [[0.3, 0.5, 0.3], [0.5, 0.2, 0.26], [0.74, 0.34, 0.2], [0.5, 0.82, 0.26], [0.74, 0.68, 0.2]],
}

const BACKGROUNDS: Record<string, { bg: string; ink: string }> = {
    paper: { bg: "#F1F1EC", ink: "#3F3F3A" },
    sage: { bg: "#DCE8DF", ink: "#2F4A3A" },
    sand: { bg: "#EFE3D3", ink: "#5A4630" },
    blush: { bg: "#F6E1E1", ink: "#6B2E3A" },
    sky: { bg: "#DDE7F3", ink: "#2B3F63" },
    dark: { bg: "#141414", ink: "#EDEDE8" },
}

/** Where each circle drifts to when the blob morphs. Deterministic per circle index. */
function morphTarget(c: Circle, i: number, amt: number): Circle {
    const dx = Math.sin(i * 2.1 + 1.0) * 0.09 * amt
    const dy = Math.cos(i * 1.7 + 0.5) * 0.05 * amt
    const sr = 1 + Math.sin(i * 3.3 + 2.0) * 0.18 * amt
    return [c[0] + dx, c[1] + dy, c[2] * sr]
}

/* ------------------------------------------------------------------ */
/* Image textures: processed on an offscreen canvas, output as a data URL */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number]

function parseColor(input: any, fallback: RGB): RGB {
    if (typeof input !== "string") return fallback
    const s = input.trim()
    if (s.startsWith("var(")) {
        const i = s.indexOf(",")
        return i > -1 ? parseColor(s.slice(i + 1, s.lastIndexOf(")")), fallback) : fallback
    }
    if (s[0] === "#") {
        let hex = s.slice(1)
        if (hex.length === 3 || hex.length === 4) hex = hex.split("").map((c) => c + c).join("")
        if (hex.length >= 6) {
            const n = parseInt(hex.slice(0, 6), 16)
            if (!isNaN(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
        }
        return fallback
    }
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1].split(/[ ,/]+/).filter(Boolean).map((v) => parseFloat(v))
        if (p.length >= 3 && p.every((v, i) => i > 2 || !isNaN(v))) return [p[0], p[1], p[2]]
    }
    return fallback
}

function bayer(n: number): number[][] {
    if (n === 2) return [[0, 2], [3, 1]]
    const p = bayer(n / 2)
    const s = p.length
    const add = [[0, 2], [3, 1]]
    const m: number[][] = []
    for (let y = 0; y < s * 2; y++) {
        m[y] = []
        for (let x = 0; x < s * 2; x++) {
            m[y][x] = 4 * p[y % s][x % s] + add[y < s ? 0 : 1][x < s ? 0 : 1]
        }
    }
    return m
}
const BAYER8 = bayer(8)

type TexOpts = {
    texture: string
    w: number
    h: number
    dpr: number
    cell: number
    contrast: number
    levels: number
    mode: string
    invert: boolean
    dark: string
    light: string
}

function processImage(img: HTMLImageElement, o: TexOpts): string {
    const { w, h, texture } = o
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    if (!iw || !ih) throw new Error("image has no size")

    // "cover" crop so the result matches the card's aspect ratio
    const ar = w / h
    let sw = iw
    let sh = ih
    if (iw / ih > ar) sw = ih * ar
    else sh = iw / ar
    const sx = (iw - sw) / 2
    const sy = (ih - sh) / 2

    const rs = Math.min(Math.max(o.dpr, 1), 2, 1400 / Math.max(w, h))
    const outW = Math.max(1, Math.round(w * rs))
    const outH = Math.max(1, Math.round(h * rs))
    const cell = Math.max(1, o.cell)
    const f = 1 + o.contrast / 50
    const adj = (v: number) => Math.min(1, Math.max(0, (v - 0.5) * f + 0.5))
    const lum = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

    let dark = parseColor(o.dark, [12, 20, 16])
    let light = parseColor(o.light, [241, 241, 236])
    if (o.invert) [dark, light] = [light, dark]

    const make = (cw: number, ch: number) => {
        const c = document.createElement("canvas")
        c.width = cw
        c.height = ch
        const x = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D
        x.imageSmoothingEnabled = true
        x.imageSmoothingQuality = "high"
        x.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch)
        return { c, x }
    }
    const upscale = (src: HTMLCanvasElement, ow: number, oh: number) => {
        const c = document.createElement("canvas")
        c.width = ow
        c.height = oh
        const x = c.getContext("2d") as CanvasRenderingContext2D
        x.imageSmoothingEnabled = false
        x.drawImage(src, 0, 0, ow, oh)
        return c
    }

    // ---------- halftone: dots sized by darkness ----------
    if (texture === "halftone") {
        const cp = cell * 2
        const cols = Math.max(1, Math.round(w / cp))
        const rows = Math.max(1, Math.round(h / cp))
        const { x } = make(cols, rows)
        const data = x.getImageData(0, 0, cols, rows).data
        const out = document.createElement("canvas")
        out.width = outW
        out.height = outH
        const ox = out.getContext("2d") as CanvasRenderingContext2D
        ox.fillStyle = `rgb(${light[0]},${light[1]},${light[2]})`
        ox.fillRect(0, 0, outW, outH)
        ox.fillStyle = `rgb(${dark[0]},${dark[1]},${dark[2]})`
        const cw = outW / cols
        const ch = outH / rows
        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const k = (j * cols + i) * 4
                const v = adj(lum(data[k], data[k + 1], data[k + 2]))
                const r = (Math.min(cw, ch) / 2) * 1.15 * Math.sqrt(1 - v)
                if (r < 0.2) continue
                ox.beginPath()
                ox.arc((i + 0.5) * cw, (j + 0.5) * ch, r, 0, Math.PI * 2)
                ox.fill()
            }
        }
        return out.toDataURL("image/png")
    }

    // ---------- chunky pixel-based effects: dither, pixel ----------
    if (texture === "dither" || texture === "pixel") {
        const smallW = Math.max(1, Math.round(w / cell))
        const smallH = Math.max(1, Math.round(h / cell))
        const { c, x } = make(smallW, smallH)
        const im = x.getImageData(0, 0, smallW, smallH)
        const d = im.data
        const L = Math.max(2, Math.round(o.levels))
        for (let y = 0; y < smallH; y++) {
            for (let xx = 0; xx < smallW; xx++) {
                const k = (y * smallW + xx) * 4
                if (texture === "pixel") {
                    d[k] = adj(d[k] / 255) * 255
                    d[k + 1] = adj(d[k + 1] / 255) * 255
                    d[k + 2] = adj(d[k + 2] / 255) * 255
                    d[k + 3] = 255
                    continue
                }
                const t = (BAYER8[y % 8][xx % 8] + 0.5) / 64 - 0.5
                if (o.mode === "color") {
                    for (let ch = 0; ch < 3; ch++) {
                        const v = adj(d[k + ch] / 255) + t / (L - 1)
                        d[k + ch] = (Math.round(Math.min(1, Math.max(0, v)) * (L - 1)) / (L - 1)) * 255
                    }
                } else {
                    const v = adj(lum(d[k], d[k + 1], d[k + 2]))
                    const on = v + t * 0.9 > 0.5
                    const col = on ? light : dark
                    d[k] = col[0]
                    d[k + 1] = col[1]
                    d[k + 2] = col[2]
                }
                d[k + 3] = 255
            }
        }
        x.putImageData(im, 0, 0)
        return upscale(c, outW, outH).toDataURL("image/png")
    }

    // ---------- per-pixel tone effects: monochrome, duotone, posterize ----------
    const { c, x } = make(outW, outH)
    const im = x.getImageData(0, 0, outW, outH)
    const d = im.data
    const L = Math.max(2, Math.round(o.levels))
    for (let k = 0; k < d.length; k += 4) {
        if (texture === "monochrome") {
            const v = adj(lum(d[k], d[k + 1], d[k + 2])) * 255
            d[k] = d[k + 1] = d[k + 2] = v
        } else if (texture === "duotone") {
            const v = adj(lum(d[k], d[k + 1], d[k + 2]))
            d[k] = dark[0] + (light[0] - dark[0]) * v
            d[k + 1] = dark[1] + (light[1] - dark[1]) * v
            d[k + 2] = dark[2] + (light[2] - dark[2]) * v
        } else if (texture === "posterize") {
            for (let ch = 0; ch < 3; ch++) {
                d[k + ch] = (Math.round(adj(d[k + ch] / 255) * (L - 1)) / (L - 1)) * 255
            }
        }
        d[k + 3] = 255
    }
    x.putImageData(im, 0, 0)
    return c.toDataURL("image/png")
}

export default function BlobImageCard(props: any) {
    const {
        image,
        shapePreset,
        colorPreset,
        flipShape,
        goo,
        imageScale,
        imageX,
        imageY,
        backgroundColor,
        radius,
        grain,
        morphTrigger,
        morphAmount,
        morphDuration,
        wobble,
        texture,
        textureScale,
        textureContrast,
        textureLevels,
        ditherMode,
        textureInvert,
        darkColor,
        lightColor,
        style,
    } = props

    // true on Framer's canvas thumbnails / exports: no animation loops, just a clean static pose
    const isStatic = useIsStaticRenderer()

    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const ref = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ w: 400, h: 560 })

    React.useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const update = () => {
            const w = el.offsetWidth || 400
            const h = el.offsetHeight || 560
            setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const { w, h } = size
    const pal =
        colorPreset === "custom"
            ? { bg: backgroundColor, ink: "#555555" }
            : BACKGROUNDS[colorPreset] || BACKGROUNDS.paper
    const baseCircles: Circle[] = React.useMemo(() => {
        const list = SHAPES[shapePreset] || SHAPES.totem
        return list.map(([x, y, r]) => [flipShape ? 1 - x : x, y, r] as Circle)
    }, [shapePreset, flipShape])

    const src = image && typeof image === "object" ? image.src : undefined
    const gooBlur = Math.max(1, (w * goo) / 100)

    // ---- image texture (processed off-screen, falls back to the original if the image can't be read) ----
    const [processed, setProcessed] = React.useState<string | null>(null)
    React.useEffect(() => {
        if (!src || !texture || texture === "none" || typeof window === "undefined") {
            setProcessed(null)
            return
        }
        let cancelled = false
        const timer = window.setTimeout(() => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                if (cancelled) return
                try {
                    const url = processImage(img, {
                        texture,
                        w,
                        h,
                        dpr: window.devicePixelRatio || 1,
                        cell: textureScale,
                        contrast: textureContrast,
                        levels: textureLevels,
                        mode: ditherMode,
                        invert: !!textureInvert,
                        dark: darkColor,
                        light: lightColor,
                    })
                    if (!cancelled) setProcessed(url)
                } catch (e) {
                    if (!cancelled) setProcessed(null)
                }
            }
            img.onerror = () => {
                if (!cancelled) setProcessed(null)
            }
            img.src = src
        }, 90)
        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [src, texture, w, h, textureScale, textureContrast, textureLevels, ditherMode, textureInvert, darkColor, lightColor])

    // ---- morph animation (direct DOM updates, no React re-render per frame) ----
    const circleEls = React.useRef<(SVGCircleElement | null)[]>([])
    const prog = React.useRef(0)
    const goal = React.useRef(0)
    const raf = React.useRef(0)
    const last = React.useRef(0)
    const visible = React.useRef(true) // false while the card is scrolled out of view
    const cfg = React.useRef({ w, h, baseCircles, morphTrigger, morphAmount, morphDuration, wobble })
    cfg.current = { w, h, baseCircles, morphTrigger, morphAmount, morphDuration, wobble }

    const apply = React.useCallback((p: number, now: number) => {
        const c = cfg.current
        const e = p * p * (3 - 2 * p) // smoothstep ease in/out
        const amt = c.morphAmount / 50
        const wob = (c.wobble / 100) * p
        c.baseCircles.forEach((b, i) => {
            const el = circleEls.current[i]
            if (!el) return
            const t = morphTarget(b, i, amt)
            const x = b[0] + (t[0] - b[0]) * e + Math.sin(now * 0.0016 + i * 1.9) * 0.022 * wob
            const y = b[1] + (t[1] - b[1]) * e + Math.cos(now * 0.0013 + i * 2.3) * 0.016 * wob
            const r = (b[2] + (t[2] - b[2]) * e) * (1 + Math.sin(now * 0.0019 + i * 1.3) * 0.045 * wob)
            el.setAttribute("cx", String(x * c.w))
            el.setAttribute("cy", String(y * c.h))
            el.setAttribute("r", String(Math.max(0, r * c.w)))
        })
    }, [])

    const tick = React.useCallback(
        (now: number) => {
            // out of view: stop the loop completely, it is restarted when the card scrolls back in
            if (!visible.current) {
                raf.current = 0
                return
            }
            const c = cfg.current
            const dt = Math.min(0.05, (now - last.current) / 1000)
            last.current = now
            if (c.morphTrigger === "loop") {
                prog.current = 0.5 - 0.5 * Math.cos((now / 1000 / Math.max(0.2, c.morphDuration * 2)) * Math.PI * 2)
                apply(prog.current, now)
                raf.current = requestAnimationFrame(tick)
                return
            }
            const rate = 4 / Math.max(0.15, c.morphDuration)
            prog.current += (goal.current - prog.current) * (1 - Math.exp(-dt * rate))
            const settled = Math.abs(goal.current - prog.current) < 0.0015
            if (settled) prog.current = goal.current
            apply(prog.current, now)
            // keep running only while moving, or while liquid wobble is alive at hover
            if (settled && !(goal.current === 1 && c.wobble > 0)) {
                raf.current = 0
                return
            }
            raf.current = requestAnimationFrame(tick)
        },
        [apply]
    )

    const start = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (isStatic) return // never animate in static renderers
        if (!visible.current) return // never animate while out of view
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
        if (!raf.current) {
            last.current = performance.now()
            raf.current = requestAnimationFrame(tick)
        }
    }, [tick, isStatic])

    // pause when scrolled out of view, resume when it comes back
    React.useEffect(() => {
        const el = ref.current
        if (!el || isStatic || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[entries.length - 1]
                if (!entry) return
                visible.current = entry.isIntersecting
                if (!entry.isIntersecting) {
                    if (raf.current) cancelAnimationFrame(raf.current)
                    raf.current = 0
                    return
                }
                const c = cfg.current
                if (c.morphTrigger === "loop" || prog.current !== goal.current || (goal.current === 1 && c.wobble > 0)) {
                    start()
                }
            },
            { threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, start])

    // static renderers: make sure nothing is left running
    React.useEffect(() => {
        if (isStatic && raf.current) {
            cancelAnimationFrame(raf.current)
            raf.current = 0
        }
    }, [isStatic])

    // loop mode starts on its own; changing mode resets state
    React.useEffect(() => {
        if (morphTrigger === "loop") {
            goal.current = 0
            start()
        } else if (raf.current && goal.current === 0 && prog.current === 0) {
            cancelAnimationFrame(raf.current)
            raf.current = 0
        }
        return undefined
    }, [morphTrigger, start])

    React.useEffect(() => {
        return () => {
            if (raf.current) cancelAnimationFrame(raf.current)
            raf.current = 0
        }
    }, [])

    // keep DOM in step with current progress after any re-render (size / shape / prop changes)
    // static renderers always draw the same fixed pose (time 0), so thumbnails and exports are deterministic
    React.useLayoutEffect(() => {
        apply(isStatic ? 0 : prog.current, isStatic ? 0 : performance.now())
    })

    const onEnter = () => {
        if (isStatic || morphTrigger !== "hover") return
        goal.current = 1
        start()
    }
    const onLeave = () => {
        if (isStatic || morphTrigger !== "hover") return
        goal.current = 0
        start()
    }

    return (
        <div
            ref={ref}
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: pal.bg,
                borderRadius: radius,
                isolation: "isolate",
            }}
        >
            <svg
                width={w}
                height={h}
                viewBox={`0 0 ${w} ${h}`}
                style={{ position: "absolute", inset: 0, display: "block" }}
            >
                <defs>
                    <filter
                        id={`goo${uid}`}
                        filterUnits="userSpaceOnUse"
                        x={-w}
                        y={-h}
                        width={w * 3}
                        height={h * 3}
                        colorInterpolationFilters="sRGB"
                    >
                        <feGaussianBlur in="SourceGraphic" stdDeviation={gooBlur} result="b" />
                        <feColorMatrix
                            in="b"
                            type="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11"
                        />
                    </filter>
                    <mask id={`mask${uid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
                        <g filter={`url(#goo${uid})`}>
                            {baseCircles.map(([x, y, r], i) => (
                                <circle
                                    key={i}
                                    ref={(el) => {
                                        circleEls.current[i] = el
                                    }}
                                    cx={x * w}
                                    cy={y * h}
                                    r={r * w}
                                    fill="#fff"
                                />
                            ))}
                        </g>
                    </mask>
                </defs>

                <g mask={`url(#mask${uid})`}>
                    {src ? (
                        <g
                            transform={`translate(${(imageX / 100) * w} ${(imageY / 100) * h}) translate(${w / 2} ${h / 2}) scale(${imageScale}) translate(${-w / 2} ${-h / 2})`}
                        >
                            <image
                                href={processed || src}
                                x={0}
                                y={0}
                                width={w}
                                height={h}
                                preserveAspectRatio={processed ? "none" : "xMidYMid slice"}
                                style={{ imageRendering: processed && (texture === "dither" || texture === "pixel") ? "pixelated" : "auto" }}
                            />
                        </g>
                    ) : (
                        <g>
                            <rect width={w} height={h} fill={pal.ink} opacity={0.15} />
                            <text
                                x={w / 2}
                                y={h / 2}
                                textAnchor="middle"
                                fontSize={Math.max(12, w * 0.04)}
                                fontFamily="sans-serif"
                                fill={pal.ink}
                                opacity={0.7}
                            >
                                Add an image
                            </text>
                        </g>
                    )}
                </g>
            </svg>

            {/* paper grain: a single static noise pass (not animated); skipped in static renderers to keep thumbnails/exports light */}
            {grain > 0 && !isStatic && (
                <svg
                    width={w}
                    height={h}
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        mixBlendMode: "multiply",
                        opacity: (grain / 100) * 0.55,
                    }}
                >
                    <filter id={`grain${uid}`}>
                        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect width={w} height={h} filter={`url(#grain${uid})`} />
                </svg>
            )}
        </div>
    )
}

BlobImageCard.defaultProps = {
    image: undefined,
    shapePreset: "totem",
    colorPreset: "paper",
    flipShape: false,
    goo: 7,
    imageScale: 1,
    imageX: 0,
    imageY: 0,
    backgroundColor: "#F1F1EC",
    radius: 0,
    grain: 25,
    morphTrigger: "hover",
    morphAmount: 50,
    morphDuration: 0.9,
    wobble: 40,
    texture: "none",
    textureScale: 3,
    textureContrast: 0,
    textureLevels: 4,
    ditherMode: "tone",
    textureInvert: false,
    darkColor: "#0C1410",
    lightColor: "#F1F1EC",
}

const usesTwoColors = (p: any) =>
    p.texture === "duotone" || p.texture === "halftone" || (p.texture === "dither" && p.ditherMode !== "color")

addPropertyControls(BlobImageCard, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },

    shapePreset: {
        type: ControlType.Enum,
        title: "Shape",
        options: [
            "totem", "duo", "cascade", "orbit", "bloom", "snake", "diagonal",
            "capsule", "peanut", "droplet", "cluster", "wave", "stepping", "crescent",
        ],
        optionTitles: [
            "Totem", "Duo", "Cascade", "Orbit", "Bloom", "Snake", "Diagonal",
            "Capsule", "Peanut", "Droplet", "Cluster", "Wave", "Stepping", "Crescent",
        ],
        defaultValue: "totem",
    },
    flipShape: { type: ControlType.Boolean, title: "Flip", defaultValue: false },
    goo: { type: ControlType.Number, title: "Blob merge", min: 2, max: 14, step: 0.5, defaultValue: 7 },

    texture: {
        type: ControlType.Enum,
        title: "Texture",
        options: ["none", "monochrome", "duotone", "posterize", "dither", "halftone", "pixel"],
        optionTitles: ["None", "Monochrome", "Duotone", "Posterize", "Dither", "Halftone", "Pixel"],
        defaultValue: "none",
    },
    ditherMode: {
        type: ControlType.Enum,
        title: "Dither mode",
        options: ["tone", "color"],
        optionTitles: ["Two-tone", "Color"],
        defaultValue: "tone",
        hidden: (p: any) => p.texture !== "dither",
    },
    textureScale: {
        type: ControlType.Number,
        title: "Texture scale",
        min: 1,
        max: 24,
        step: 1,
        unit: "px",
        defaultValue: 3,
        hidden: (p: any) => !["dither", "halftone", "pixel"].includes(p.texture),
    },
    textureLevels: {
        type: ControlType.Number,
        title: "Levels",
        min: 2,
        max: 8,
        step: 1,
        defaultValue: 4,
        hidden: (p: any) => !(p.texture === "posterize" || (p.texture === "dither" && p.ditherMode === "color")),
    },
    textureContrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: -50,
        max: 100,
        step: 1,
        defaultValue: 0,
        hidden: (p: any) => !p.texture || p.texture === "none",
    },
    darkColor: { type: ControlType.Color, title: "Dark color", defaultValue: "#0C1410", hidden: (p: any) => !usesTwoColors(p) },
    lightColor: { type: ControlType.Color, title: "Light color", defaultValue: "#F1F1EC", hidden: (p: any) => !usesTwoColors(p) },
    textureInvert: { type: ControlType.Boolean, title: "Invert", defaultValue: false, hidden: (p: any) => !usesTwoColors(p) },

    morphTrigger: {
        type: ControlType.Enum,
        title: "Morph",
        options: ["hover", "loop", "off"],
        optionTitles: ["On hover", "Always (loop)", "Off"],
        defaultValue: "hover",
    },
    morphAmount: {
        type: ControlType.Number,
        title: "Morph amount",
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 50,
        hidden: (p: any) => p.morphTrigger === "off",
    },
    morphDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.3,
        max: 3,
        step: 0.1,
        unit: "s",
        defaultValue: 0.9,
        hidden: (p: any) => p.morphTrigger === "off",
    },
    wobble: {
        type: ControlType.Number,
        title: "Liquid wobble",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 40,
        hidden: (p: any) => p.morphTrigger === "off",
    },

    imageScale: { type: ControlType.Number, title: "Img zoom", min: 0.5, max: 3, step: 0.05, defaultValue: 1 },
    imageX: { type: ControlType.Number, title: "Img X %", min: -50, max: 50, step: 1, defaultValue: 0 },
    imageY: { type: ControlType.Number, title: "Img Y %", min: -50, max: 50, step: 1, defaultValue: 0 },

    colorPreset: {
        type: ControlType.Enum,
        title: "Background",
        options: ["paper", "sage", "sand", "blush", "sky", "dark", "custom"],
        optionTitles: ["Paper", "Sage", "Sand", "Blush", "Sky", "Dark", "Custom"],
        defaultValue: "paper",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#F1F1EC",
        hidden: (p: any) => p.colorPreset !== "custom",
    },

    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 80, step: 1, defaultValue: 0 },
    grain: { type: ControlType.Number, title: "Paper grain", min: 0, max: 100, step: 1, unit: "%", defaultValue: 25 },
})
