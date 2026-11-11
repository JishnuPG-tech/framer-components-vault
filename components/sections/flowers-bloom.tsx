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

import { startTransition } from "react"

type PaletteMode = "mixed" | "warm" | "cool" | "pink"

type HSL = { h: number; s: number; l: number }

interface HoverBloomProps {
    showAdvanced: boolean
    spawnOn: "move" | "still"
    growthMode: "upright" | "creep"
    spawnRate: number
    maxBlooms: number
    resetOnLeave: boolean

    backgroundColor: string
    paperTint: string
    grid: boolean
    gridSize: number
    gridDotSize: number
    gridColor: string

    paletteMode: PaletteMode
    useCustomPalette: boolean
    customPalette: string[]

    stemHue: number
    stemSaturation: number
    stemLightness: number

    flowerSaturation: number
    flowerLightness: number
    bloomScale: number
    blur: number
    watercolor: number
    trailFade: number

    style?: React.CSSProperties
}

/**
 * User instructions:
 * "realizza un componente che con hover genera fiori come questi"
 */

/**
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 560
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function HoverBloom(props: HoverBloomProps) {
    const {
        showAdvanced,
        spawnOn,
        growthMode,
        spawnRate,
        maxBlooms,
        resetOnLeave,
        backgroundColor,
        paperTint,
        grid,
        gridSize,
        gridDotSize,
        gridColor,
        paletteMode,
        useCustomPalette,
        customPalette,
        stemHue,
        stemSaturation,
        stemLightness,
        flowerSaturation,
        flowerLightness,
        bloomScale,
        blur,
        watercolor,
        trailFade,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const hostRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

    const paintCanvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const rafRef = React.useRef<number | null>(null)
    const runningRef = React.useRef(false)

    const sizeRef = React.useRef({ w: 0, h: 0, dpr: 1 })
    const hoverRef = React.useRef(false)
    const lastPointerRef = React.useRef<{ x: number; y: number; t: number } | null>(null)
    const spawnAccRef = React.useRef(0)

    type StemSeg = { x: number; y: number; a: number }
    type Stem = {
        id: string
        x: number
        y: number
        targetLen: number
        grown: number
        speed: number
        a: number
        targetA: number
        segs: StemSeg[]
        done: boolean
        hasFlower: boolean
        type: number
        scale: number
        hue: number
        sat: number
        light: number
    }

    type Bloom = {
        id: string
        x: number
        y: number
        age: number
        maxAge: number
        type: number
        scale: number
        hue: number
        sat: number
        light: number
    }

    const stemsRef = React.useRef<Stem[]>([])
    const bloomsRef = React.useRef<Bloom[]>([])

    const colorsForMode = React.useCallback(
        (mode: PaletteMode) => {
            const base: number[] =
                mode === "warm"
                    ? [12, 22, 35, 5, 18]
                    : mode === "cool"
                      ? [210, 245, 190, 275, 200]
                      : mode === "pink"
                        ? [330, 345, 350, 315, 5]
                        : [350, 15, 330, 40, 300, 5, 345, 20]
            return base
        },
        []
    )

    const pick = React.useCallback((arr: any[]) => arr[(Math.random() * arr.length) | 0], [])

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

    const hexToHsl = React.useCallback((hex: string): HSL | null => {
        if (!hex) return null
        const raw = hex.trim().replace(/^#/, "")
        const s = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw
        if (!/^([0-9a-fA-F]{6})$/.test(s)) return null
        const r = parseInt(s.slice(0, 2), 16) / 255
        const g = parseInt(s.slice(2, 4), 16) / 255
        const b = parseInt(s.slice(4, 6), 16) / 255

        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const d = max - min
        let h = 0
        const l = (max + min) / 2
        const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))

        if (d !== 0) {
            switch (max) {
                case r:
                    h = ((g - b) / d) % 6
                    break
                case g:
                    h = (b - r) / d + 2
                    break
                case b:
                    h = (r - g) / d + 4
                    break
            }
            h *= 60
            if (h < 0) h += 360
        }

        return { h, s: sat * 100, l: l * 100 }
    }, [])

    const get2D = React.useCallback((c: HTMLCanvasElement): CanvasRenderingContext2D | null => {
        // Explicitly type the context to avoid RenderingContext unions in TS
        const ctx = c.getContext("2d", { alpha: true, desynchronized: true } as any)
        return (ctx || c.getContext("2d")) as CanvasRenderingContext2D | null
    }, [])

    const hsl = React.useCallback((c: HSL, a: number) => {
        const hh = ((c.h % 360) + 360) % 360
        return `hsla(${hh}, ${Math.max(0, Math.min(100, c.s))}%, ${Math.max(0, Math.min(100, c.l))}%, ${Math.max(
            0,
            Math.min(1, a)
        )})`
    }, [])

    const ensureCanvases = React.useCallback(() => {
        if (typeof window === "undefined") return

        if (!paintCanvasRef.current) {
            paintCanvasRef.current = document.createElement("canvas")
        }
    }, [])

    const resizeToHost = React.useCallback(() => {
        const host = hostRef.current
        const canvas = canvasRef.current
        const paint = paintCanvasRef.current
        if (!host || !canvas || !paint) return

        const rect = host.getBoundingClientRect()
        const w = Math.max(1, Math.round(rect.width))
        const h = Math.max(1, Math.round(rect.height))
        const dpr = Math.max(1, Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1))

        const prev = sizeRef.current
        if (prev.w === w && prev.h === h && prev.dpr === dpr) return

        sizeRef.current = { w, h, dpr }

        canvas.width = Math.floor(w * dpr)
        canvas.height = Math.floor(h * dpr)
        canvas.style.width = "100%"
        canvas.style.height = "100%"

        const prevW = paint.width
        const prevH = paint.height
        const snapshot = document.createElement("canvas")
        snapshot.width = prevW
        snapshot.height = prevH
        const snapCtx = snapshot.getContext("2d")
        if (snapCtx) snapCtx.drawImage(paint, 0, 0)

        paint.width = Math.floor(w * dpr)
        paint.height = Math.floor(h * dpr)

        const pctx = get2D(paint)
        if (pctx) {
            pctx.setTransform(1, 0, 0, 1, 0, 0)
            pctx.scale(dpr, dpr)
            pctx.lineCap = "round"
            pctx.lineJoin = "round"
            pctx.globalCompositeOperation = "source-over"
            pctx.fillStyle = backgroundColor
            pctx.fillRect(0, 0, w, h)

            if (prevW > 0 && prevH > 0) {
                const dx = (w * dpr - prevW) * 0.5
                const dy = h * dpr - prevH
                pctx.setTransform(1, 0, 0, 1, 0, 0)
                pctx.drawImage(snapshot, dx, dy)
                pctx.setTransform(1, 0, 0, 1, 0, 0)
                pctx.scale(dpr, dpr)

                const shiftX = dx / dpr
                const shiftY = dy / dpr
                for (const s of stemsRef.current) {
                    s.x += shiftX
                    s.y += shiftY
                    for (const seg of s.segs) {
                        seg.x += shiftX
                        seg.y += shiftY
                    }
                }
                for (const b of bloomsRef.current) {
                    b.x += shiftX
                    b.y += shiftY
                }
            }
        }
    }, [backgroundColor, get2D])

    const clearAll = React.useCallback(() => {
        const paint = paintCanvasRef.current
        const canvas = canvasRef.current
        if (!paint || !canvas) return
        const { w, h, dpr } = sizeRef.current
        const pctx = get2D(paint)
        const dctx = get2D(canvas)
        if (!pctx || !dctx) return
        pctx.setTransform(1, 0, 0, 1, 0, 0)
        pctx.clearRect(0, 0, paint.width, paint.height)
        pctx.scale(dpr, dpr)
        pctx.fillStyle = backgroundColor
        pctx.fillRect(0, 0, w, h)

        dctx.setTransform(1, 0, 0, 1, 0, 0)
        dctx.clearRect(0, 0, canvas.width, canvas.height)

        stemsRef.current = []
        bloomsRef.current = []
    }, [backgroundColor, get2D])

    const spawnStemAt = React.useCallback(
        (x: number, y: number, intensity: number) => {
            const { w, h } = sizeRef.current
            if (w <= 0 || h <= 0) return

            if (stemsRef.current.length + bloomsRef.current.length >= Math.max(1, maxBlooms)) {
                stemsRef.current.splice(0, Math.max(0, stemsRef.current.length - (maxBlooms - 1)))
                bloomsRef.current.splice(0, Math.max(0, bloomsRef.current.length - (maxBlooms - 1)))
            }

            let hue = 0
            let sat = flowerSaturation
            let light = flowerLightness

            const canUseCustom = useCustomPalette && Array.isArray(customPalette) && customPalette.length > 0
            if (canUseCustom) {
                const chosen = pick(customPalette)
                const parsed = hexToHsl(String(chosen))
                if (parsed) {
                    hue = parsed.h
                    sat = parsed.s
                    light = parsed.l
                }
            }

            if (!canUseCustom || hue === 0) {
                const hueChoices = colorsForMode(paletteMode)
                hue = pick(hueChoices) + (Math.random() * 10 - 5)
                sat = flowerSaturation
                light = flowerLightness
            }

            const scale = Math.max(0.2, bloomScale) * (0.65 + Math.random() * 0.6) * (0.8 + intensity * 0.6)

            const isCreep = growthMode === "creep"
            const targetA = isCreep ? -Math.PI * 0.15 : -Math.PI / 2
            const len = (h * (isCreep ? 0.22 : 0.12) + Math.random() * (h * (isCreep ? 0.32 : 0.22)) + 40) * (0.65 + scale)
            const angle = targetA + (Math.random() - 0.5) * (isCreep ? 0.8 : 0.75)

            const s: Stem = {
                id: `${Date.now()}-${Math.random()}`,
                x: Math.max(w * 0.03, Math.min(w * 0.97, x + (Math.random() - 0.5) * 14)),
                y: Math.max(h * 0.1, Math.min(h * 0.98, y + 10 + Math.random() * 18)),
                targetLen: len,
                grown: 0,
                speed: 1.6 + Math.random() * 2.2,
                a: angle,
                targetA,
                segs: [{ x, y, a: angle }],
                done: false,
                hasFlower: false,
                type: growthMode === "creep" ? ((Math.random() * 4) | 0) : ((Math.random() * 6) | 0),
                scale,
                hue,
                sat,
                light,
            }

            stemsRef.current.push(s)
        },
        [
            bloomScale,
            colorsForMode,
            customPalette,
            flowerLightness,
            flowerSaturation,
            growthMode,
            hexToHsl,
            maxBlooms,
            paletteMode,
            pick,
            useCustomPalette,
        ]
    )

    const addBloom = React.useCallback((x: number, y: number, type: number, scale: number, hue: number, sat: number, light: number) => {
        const b: Bloom = {
            id: `${Date.now()}-${Math.random()}`,
            x,
            y,
            age: 0,
            maxAge: 70 + Math.random() * 70,
            type,
            scale,
            hue,
            sat,
            light,
        }
        bloomsRef.current.push(b)
    }, [])

    const drawBlob = React.useCallback(
        (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: HSL, a: number, angle = 0, stretch = 1.6) => {
            const jitter = r * 0.25
            for (let i = 0; i < 2; i++) {
                const jx = (Math.random() - 0.5) * jitter
                const jy = (Math.random() - 0.5) * jitter
                const rr = Math.max(0.6, r * (0.75 + Math.random() * 0.5))
                const rx = rr * stretch
                const ry = rr * (0.55 + Math.random() * 0.55)
                const aa = angle + (Math.random() - 0.5) * 0.35
                ctx.beginPath()
                ctx.ellipse(x + jx, y + jy, rx, ry, aa, 0, Math.PI * 2)
                ctx.fillStyle = hsl(
                    { h: c.h + (Math.random() * 10 - 5), s: c.s, l: c.l + (Math.random() * 12 - 6) },
                    a
                )
                ctx.fill()
            }
        },
        [hsl]
    )

    const stroke = React.useCallback(
        (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, c: HSL, w: number, a: number) => {
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.strokeStyle = hsl(
                { h: c.h + (Math.random() * 8 - 4), s: c.s, l: c.l + (Math.random() * 10 - 5) },
                a
            )
            ctx.lineWidth = Math.max(0.2, w * (0.8 + Math.random() * 0.5))
            ctx.stroke()
        },
        [hsl]
    )

    const stepStem = React.useCallback(
        (s: Stem) => {
            const stepSize = 5
            const steps = Math.max(1, Math.floor(s.speed))
            for (let k = 0; k < steps; k++) {
                if (s.grown >= s.targetLen) {
                    s.done = true
                    break
                }
                const last = s.segs[s.segs.length - 1]
                let a = last.a
                a += ((s.targetA ?? -Math.PI / 2) - a) * 0.04 + (Math.random() - 0.5) * 0.12
                const nx = last.x + Math.cos(a) * stepSize
                const ny = last.y + Math.sin(a) * stepSize
                s.segs.push({ x: nx, y: ny, a })
                s.grown += stepSize
            }
            if (s.grown >= s.targetLen) s.done = true
        },
        []
    )

    const drawStem = React.useCallback(
        (ctx: CanvasRenderingContext2D, s: Stem) => {
            const segs = s.segs
            if (segs.length < 2) return

            const stemBase: HSL = { h: stemHue, s: stemSaturation, l: stemLightness }
            const stemAlt: HSL = { h: stemHue + 18, s: stemSaturation, l: Math.max(10, stemLightness - 8) }

            const maxI = segs.length - 1
            const total = Math.max(1, Math.floor(s.targetLen / 5))
            const start = Math.max(1, maxI - 4)

            for (let i = start; i <= maxI; i++) {
                const prev = segs[i - 1]
                const cur = segs[i]
                const t = i / total
                const w = (2.8 * (1 - t) + 0.8) * s.scale
                stroke(ctx, prev.x, prev.y, cur.x, cur.y, stemAlt, w * 0.7, 0.18)
                stroke(ctx, prev.x, prev.y, cur.x, cur.y, stemBase, w, 0.14)

                const leafChance = s.targetA > -1.2 ? 0.16 : 0.08
                if (i > 5 && i < maxI - 3 && Math.random() < leafChance) {
                    const a = cur.a + (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.7)
                    const len = (10 + Math.random() * 22) * s.scale
                    const tipX = cur.x + Math.cos(a) * len
                    const tipY = cur.y + Math.sin(a) * len
                    const leaf: HSL = { h: stemHue + (Math.random() * 10 - 5), s: stemSaturation, l: Math.min(65, stemLightness + 10) }
                    drawBlob(ctx, (cur.x + tipX) * 0.5, (cur.y + tipY) * 0.5, (4 + Math.random() * 4) * s.scale, leaf, 0.09, a, 2.2)
                    stroke(ctx, cur.x, cur.y, tipX, tipY, stemAlt, Math.max(0.35, w * 0.35), 0.14)
                }
            }
        },
        [drawBlob, stemHue, stemLightness, stemSaturation, stroke]
    )

    const drawBloom = React.useCallback(
        (ctx: CanvasRenderingContext2D, b: Bloom) => {
            b.age += 1
            const t = clamp01(b.age / 60)
            const bloom = 0.15 + t * 0.85
            const persist = !resetOnLeave
            const fadeOut = persist ? 1 : clamp01((b.maxAge - b.age) / 20)

            const hue = b.hue
            const fs = b.sat
            const fl = b.light
            const base: HSL = { h: hue, s: fs, l: fl }
            const light: HSL = { h: hue + 2, s: Math.max(20, fs - 10), l: Math.min(92, fl + 12) }
            const dark: HSL = { h: hue, s: Math.min(100, fs + 12), l: Math.max(16, fl - 22) }
            const stamen: HSL = { h: 40, s: 85, l: 52 }

            const s = b.scale
            const headX = b.x + (Math.random() - 0.5) * 0.2
            const headY = b.y - (8 + Math.random() * 6) * s * bloom

            const creep = b.type <= 3

            const petalCount = creep
                ? b.type === 0
                    ? 18
                    : b.type === 1
                      ? 6
                      : b.type === 2
                        ? 10
                        : 8
                : b.type === 1
                  ? 5
                  : b.type === 4
                    ? 12
                    : b.type === 3
                      ? 9
                      : 7

            const radius = (creep ? 7.5 : 10) * s * bloom + (b.type === 0 ? 4 * s * bloom : 0)
            const spread = creep ? (b.type === 1 ? 1.25 : 1.0) : b.type === 2 ? 0.75 : 1.0

            for (let i = 0; i < petalCount; i++) {
                if (Math.random() > 0.75) continue
                const baseA = creep && b.type === 1 ? (-Math.PI / 2 + (i % 2 === 0 ? -0.45 : 0.45) + (Math.random() - 0.5) * 0.25) : -Math.PI / 2 + (Math.PI * 2 * i) / petalCount
                const a = baseA + (Math.random() - 0.5) * 0.35
                const dist = radius * (0.75 + Math.random() * 0.85) * spread
                const px = headX + Math.cos(a) * dist
                const py = headY + Math.sin(a) * dist
                const stretch = (creep ? 2.2 : 1.6) + Math.random() * (creep ? 1.0 : 0.9)
                const main = Math.random() > 0.65 ? light : base
                drawBlob(
                    ctx,
                    px,
                    py,
                    radius * (0.55 + Math.random() * 0.25),
                    main,
                    fadeOut * 0.055 * (0.6 + watercolor * 0.8),
                    a,
                    stretch
                )
                drawBlob(
                    ctx,
                    (px + headX) * 0.5,
                    (py + headY) * 0.5,
                    radius * 0.45,
                    dark,
                    fadeOut * 0.04 * (0.7 + watercolor * 0.7),
                    a + 0.1,
                    stretch * 0.95
                )
            }

            const core = (5 + Math.random() * 3) * s * bloom
            drawBlob(ctx, headX, headY + 1 * s, core * 1.05, dark, fadeOut * 0.06 * (0.7 + watercolor * 0.8), 0, 1.2)

            if (b.age > 10) {
                for (let i = 0; i < 7; i++) {
                    if (Math.random() > 0.5) continue
                    const aa = Math.random() * Math.PI * 2
                    const dd = (1 + Math.random() * 5) * s * bloom
                    const dx = headX + Math.cos(aa) * dd
                    const dy = headY + Math.sin(aa) * dd
                    drawBlob(ctx, dx, dy, (1.2 + Math.random() * 1.8) * s * bloom, stamen, fadeOut * 0.07, aa, 1.0)
                }
            }
        },
        [clamp01, drawBlob, resetOnLeave, watercolor]
    )

    const render = React.useCallback(function render() {
        const canvas = canvasRef.current
        const paint = paintCanvasRef.current
        if (!canvas || !paint) return

        const { w, h, dpr } = sizeRef.current
        if (w <= 0 || h <= 0) return

        const pctx = get2D(paint)
        const dctx = get2D(canvas)
        if (!pctx || !dctx) return

        const persist = !resetOnLeave

        // Fade the accumulated paint back to the background only when we want trails to disappear.
        if (!persist) {
            pctx.save()
            pctx.globalCompositeOperation = "source-over"
            pctx.fillStyle = backgroundColor
            pctx.globalAlpha = Math.max(0.02, clamp01(trailFade) * 0.35)
            pctx.setTransform(1, 0, 0, 1, 0, 0)
            pctx.scale(dpr, dpr)
            pctx.fillRect(0, 0, w, h)
            pctx.restore()
        }

        for (const s of stemsRef.current) {
            if (!s.done) {
                stepStem(s)
                drawStem(pctx, s)
            } else if (!s.hasFlower) {
                const segs = s.segs
                const anchor = segs[Math.max(1, segs.length - 2)]
                addBloom(anchor.x, anchor.y, s.type, Math.max(0.2, s.scale * (0.8 + Math.random() * 0.5)), s.hue, s.sat, s.light)
                if (segs.length > 18 && Math.random() > 0.55) {
                    const node = segs[Math.max(5, segs.length - (10 + ((Math.random() * 10) | 0)))]
                    const side = Math.random() < 0.5 ? -1 : 1
                    const a = node.a + side * (0.85 + Math.random() * 0.5)
                    const budX = node.x + Math.cos(a) * (10 + Math.random() * 12) * s.scale
                    const budY = node.y + Math.sin(a) * (10 + Math.random() * 12) * s.scale
                    addBloom(budX, budY, (s.type + 1 + ((Math.random() * 3) | 0)) % 6, Math.max(0.18, s.scale * 0.7), s.hue + 8, s.sat, s.light)
                }
                s.hasFlower = true
            }
        }

        let anyBloomAlive = false
        const blooms = bloomsRef.current
        for (let i = 0; i < blooms.length; i++) {
            const b = blooms[i]
            if (b.age < b.maxAge) {
                drawBloom(pctx, b)
                anyBloomAlive = true
            }
        }

        dctx.setTransform(1, 0, 0, 1, 0, 0)
        dctx.clearRect(0, 0, canvas.width, canvas.height)
        dctx.scale(dpr, dpr)

        const blurPx = Math.max(0, blur)
        const wc = clamp01(watercolor)
        dctx.filter = `blur(${blurPx * (0.5 + wc * 0.9)}px) contrast(${1.02 + wc * 0.08}) saturate(${1.05 + wc * 0.15})`
        dctx.globalAlpha = 1
        dctx.drawImage(paint, 0, 0, w * dpr, h * dpr, 0, 0, w, h)
        dctx.filter = "none"

        stemsRef.current = stemsRef.current.filter((s) => !(s.done && s.hasFlower))
        if (bloomsRef.current.length > maxBlooms) bloomsRef.current.splice(0, bloomsRef.current.length - maxBlooms)

        const shouldContinue = hoverRef.current || stemsRef.current.length > 0 || anyBloomAlive
        if (shouldContinue) {
            rafRef.current = requestAnimationFrame(render)
        } else {
            // If Reset Leave is off, we keep the last painted frame on screen.
            if (!persist) {
                // Ensure the canvas returns fully to the background when all blooms are done.
                clearAll()
            }
            runningRef.current = false
            rafRef.current = null
        }
    }, [addBloom, backgroundColor, blur, clearAll, drawBloom, drawStem, get2D, maxBlooms, resetOnLeave, stepStem, trailFade, watercolor])

    const ensureLoop = React.useCallback(() => {
        if (typeof window === "undefined") return
        if (runningRef.current) return
        runningRef.current = true
        rafRef.current = requestAnimationFrame(render)
    }, [render])

    const onPointerEnter = React.useCallback(() => {
        hoverRef.current = true
        ensureLoop()
    }, [ensureLoop])

    const onPointerLeave = React.useCallback(() => {
        hoverRef.current = false
        lastPointerRef.current = null
        spawnAccRef.current = 0
        if (resetOnLeave) {
            clearAll()
        }
    }, [clearAll, resetOnLeave])

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!hoverRef.current) return

            const host = hostRef.current
            if (!host) return
            const rect = host.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            const now = typeof performance !== "undefined" ? performance.now() : Date.now()
            const last = lastPointerRef.current
            let intensity = 0.35
            if (last) {
                const dt = Math.max(1, now - last.t)
                const dx = x - last.x
                const dy = y - last.y
                const speed = Math.sqrt(dx * dx + dy * dy) / dt
                intensity = clamp01(0.25 + speed * 3.2)
            }
            lastPointerRef.current = { x, y, t: now }

            if (spawnOn === "move") {
                const rate = Math.max(0, spawnRate)
                const dt = last ? Math.max(0, now - last.t) / 1000 : 1 / 60
                spawnAccRef.current += rate * dt
                while (spawnAccRef.current >= 1) {
                    spawnAccRef.current -= 1
                    spawnStemAt(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, intensity)
                }
                ensureLoop()
            }
        },
        [ensureLoop, spawnOn, spawnRate, spawnStemAt]
    )

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const host = hostRef.current
            if (!host) return
            const rect = host.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            spawnStemAt(x, y, 0.9)
            ensureLoop()
        },
        [ensureLoop, spawnStemAt]
    )

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        ensureCanvases()
        resizeToHost()

        const host = hostRef.current
        if (!host) return

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                resizeToHost()
            })
            ro.observe(host)
        }

        return () => {
            if (ro) ro.disconnect()
        }
    }, [ensureCanvases, isStatic, resizeToHost])

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            runningRef.current = false
        }
    }, [isStatic])

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        startTransition(() => {
            resizeToHost()
        })
    }, [backgroundColor, isStatic, resizeToHost])

    const gridBackground = React.useMemo(() => {
        if (!grid) return "none"
        const s = Math.max(6, gridSize)
        const dot = Math.max(0.5, gridDotSize)
        return `radial-gradient(${gridColor} ${dot}px, transparent ${dot}px)`
    }, [grid, gridColor, gridDotSize, gridSize])

    if (isStatic) {
        return (
            <div
                ref={hostRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    backgroundColor,
                    backgroundImage: gridBackground,
                    backgroundSize: grid ? `${gridSize}px ${gridSize}px` : undefined,
                    boxShadow: `inset 0 0 80px rgba(0,0,0,0.03)`,
                    ...style,
                }}
                aria-label="Hover Bloom (static)"
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(135deg, ${paperTint} 0%, rgba(255,255,255,0) 60%)`,
                        mixBlendMode: "multiply",
                        opacity: 0.55,
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: 18,
                        bottom: 14,
                        color: "rgba(0,0,0,0.45)",
                        fontSize: 12,
                        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
                        pointerEvents: "none",
                    }}
                >
                    Hover in Preview to bloom
                </div>
            </div>
        )
    }

    return (
        <div
            ref={hostRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                backgroundImage: gridBackground,
                backgroundSize: grid ? `${Math.max(6, gridSize)}px ${Math.max(6, gridSize)}px` : undefined,
                boxShadow: `inset 0 0 80px rgba(0,0,0,0.03)`,
                touchAction: "none",
                ...style,
            }}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
            role="application"
            aria-label="Hover Bloom canvas"
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(135deg, ${paperTint} 0%, rgba(255,255,255,0) 62%)`,
                    mixBlendMode: "multiply",
                    opacity: 0.55,
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

addPropertyControls(HoverBloom, {
    showAdvanced: {
        type: ControlType.Boolean,
        title: "Advanced",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Show advanced tuning controls.",
    },
    spawnOn: {
        type: ControlType.Enum,
        title: "Spawn",
        defaultValue: "move",
        options: ["move", "still"],
        optionTitles: ["On Move", "On Hover"],
        displaySegmentedControl: true,
        description: "On Move spawns along your pointer path. On Hover spawns on click/tap.",
    },
    growthMode: {
        type: ControlType.Enum,
        title: "Growth",
        defaultValue: "upright",
        options: ["upright", "creep"],
        optionTitles: ["Upright", "Creep"],
        displaySegmentedControl: true,
        description: "Upright grows mostly upwards. Creep grows more sideways like a vine.",
    },
    spawnRate: {
        type: ControlType.Number,
        title: "Rate",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "/s",
        hidden: (p) => p.spawnOn !== "move",
        description: "How many stems are spawned per second while moving.",
    },
    maxBlooms: {
        type: ControlType.Number,
        title: "Max",
        defaultValue: 80,
        min: 10,
        max: 240,
        step: 1,
        description: "Safety cap for performance.",
    },
    resetOnLeave: {
        type: ControlType.Boolean,
        title: "Reset Leave",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "If enabled, clears everything immediately when the pointer leaves.",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    paperTint: {
        type: ControlType.Color,
        title: "Paper Tint",
        defaultValue: "#F5F5F5",
        description: "Subtle overlay tint (watercolor/paper feel).",
    },

    grid: {
        type: ControlType.Boolean,
        title: "Grid",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    gridSize: {
        type: ControlType.Number,
        title: "Grid Size",
        defaultValue: 24,
        min: 8,
        max: 64,
        step: 1,
        unit: "px",
        hidden: (p) => !p.grid || !p.showAdvanced,
        description: "Dot grid spacing.",
    },
    gridDotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.5,
        unit: "px",
        hidden: (p) => !p.grid || !p.showAdvanced,
    },
    gridColor: {
        type: ControlType.Color,
        title: "Grid Color",
        defaultValue: "#CCCCCC",
        hidden: (p) => !p.grid || !p.showAdvanced,
    },

    paletteMode: {
        type: ControlType.Enum,
        title: "Palette",
        defaultValue: "mixed",
        options: ["mixed", "warm", "cool", "pink"],
        optionTitles: ["Mixed", "Warm", "Cool", "Pink"],
        hidden: (p) => p.useCustomPalette,
    },
    useCustomPalette: {
        type: ControlType.Boolean,
        title: "Custom Colors",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Use your own flower colors instead of the preset palette.",
        hidden: (p) => !p.showAdvanced,
    },
    customPalette: {
        type: ControlType.Array,
        title: "Colors",
        control: { type: ControlType.Color },
        maxCount: 12,
        defaultValue: ["#FF5588", "#FFBB00", "#8855FF"],
        hidden: (p) => !p.showAdvanced || !p.useCustomPalette,
        description: "Flower colors used when Custom Colors is enabled.",
    },

    stemHue: {
        type: ControlType.Number,
        title: "Stem Hue",
        defaultValue: 115,
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
        hidden: (p) => !p.showAdvanced,
    },
    stemSaturation: {
        type: ControlType.Number,
        title: "Stem Sat",
        defaultValue: 28,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => !p.showAdvanced,
    },
    stemLightness: {
        type: ControlType.Number,
        title: "Stem Light",
        defaultValue: 38,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => !p.showAdvanced,
    },

    flowerSaturation: {
        type: ControlType.Number,
        title: "Flower Sat",
        defaultValue: 78,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => !p.showAdvanced || p.useCustomPalette,
    },
    flowerLightness: {
        type: ControlType.Number,
        title: "Flower Light",
        defaultValue: 66,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => !p.showAdvanced || p.useCustomPalette,
    },

    bloomScale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 1,
        min: 0.4,
        max: 2.2,
        step: 0.05,
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 0.6,
        min: 0,
        max: 4,
        step: 0.1,
        unit: "px",
        hidden: (p) => !p.showAdvanced,
        description: "Post-process blur applied to the watercolor layer.",
    },
    watercolor: {
        type: ControlType.Number,
        title: "Watercolor",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !p.showAdvanced,
        description: "Strength of the watercolor look (affects softness and saturation).",
    },
    trailFade: {
        type: ControlType.Number,
        title: "Trail Fade",
        defaultValue: 0.08,
        min: 0,
        max: 1,
        step: 0.02,
        hidden: (p) => !p.showAdvanced,
        description: "Higher values clear the canvas faster (everything disappears sooner).",
    },
})