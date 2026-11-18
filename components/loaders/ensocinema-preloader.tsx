import * as React from "react"
import { useEffect, useRef, useState } from "react"
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
 * Enso Cinema Preloader
 * An ensō (a calligraphic ink circle) is painted bristle by bristle on washi
 * paper. Progress = stroke length. At 100% the brush lifts, ink splatters,
 * a red seal is pressed, then the camera "dives through" the circle to
 * reveal the page. Wrapped in a film look: letterbox, subtitles, timecode,
 * grain, film dust, and gate weave.
 *
 * @fr9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8 any
 * @fr9yMnTm4NSzvG9rrwjM2ec8xZgh1cafXH8 any
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 600
 */

type Props = {
    paper: string
    ink: string
    seal: string
    ringSize: number
    brushWidth: number
    duration: number
    hold: number
    exitDuration: number
    waitForLoad: boolean
    oncePerSession: boolean
    fullscreen: boolean
    letterbox: boolean
    showSeal: boolean
    grain: number
    title: string
    subtitle1: string
    subtitle2: string
    subtitle3: string
    barText: string
    onComplete?: () => void
    style?: React.CSSProperties
}

const TAU = Math.PI * 2
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const ss = (a: number, b: number, x: number) => {
    const t = clamp01((x - a) / (b - a))
    return t * t * (3 - 2 * t)
}

function mulberry32(seed: number) {
    return function () {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const pad = (n: number, l = 2) => String(n).padStart(l, "0")

export default function EnsoCinemaPreloader(props: Props) {
    const {
        paper,
        ink,
        seal,
        ringSize,
        brushWidth,
        duration,
        hold,
        exitDuration,
        waitForLoad,
        oncePerSession,
        fullscreen,
        letterbox,
        showSeal,
        grain,
        title,
        subtitle1,
        subtitle2,
        subtitle3,
        barText,
        onComplete,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()

    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const topRef = useRef<HTMLDivElement>(null)
    const botRef = useRef<HTMLDivElement>(null)
    const tcRef = useRef<HTMLSpanElement>(null)
    const pctRef = useRef<HTMLSpanElement>(null)
    const subRef = useRef<HTMLDivElement>(null)
    const loadedRef = useRef(false)
    const doneRef = useRef(false)
    const onCompleteRef = useRef(onComplete)
    onCompleteRef.current = onComplete

    const [done, setDone] = useState<boolean>(() => {
        if (isCanvas || !oncePerSession || typeof window === "undefined")
            return false
        try {
            return !!sessionStorage.getItem("enso-preloader-seen")
        } catch (e) {
            return false
        }
    })

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        if (!waitForLoad || isCanvas) {
            loadedRef.current = true
            return
        }
        if (document.readyState === "complete") {
            loadedRef.current = true
            return
        }
        const onLoad = () => (loadedRef.current = true)
        window.addEventListener("load", onLoad)
        return () => window.removeEventListener("load", onLoad)
    }, [waitForLoad, isCanvas, isStatic])

    useEffect(() => {
        // Static rendering must never start canvas animation or observers.
        if (done || isStatic) return
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const inkC = document.createElement("canvas")
        const ictx = inkC.getContext("2d") as CanvasRenderingContext2D
        const paperC = document.createElement("canvas")
        const pctx = paperC.getContext("2d") as CanvasRenderingContext2D

        // ---------- static data (deterministic) ----------
        const rnd = mulberry32(21)
        const N = 84
        const bristles = Array.from({ length: N }, (_, i) => {
            const u = (i / (N - 1)) * 2 - 1
            return {
                o: u + (rnd() - 0.5) * 0.05,
                a: 0.42 + 0.5 * (1 - Math.abs(u)) * rnd() + 0.1,
                dry:
                    0.25 +
                    0.75 * Math.pow(Math.abs(u), 0.7) * (0.6 + 0.4 * rnd()),
                rel: (2.0 + rnd() * 2.2) / N,
                f1: 18 + rnd() * 40,
                f2: 5 + rnd() * 18,
                ph: rnd() * TAU,
                ph2: rnd() * TAU,
            }
        })
        const splats = Array.from({ length: 26 }, () => ({
            da: (rnd() - 0.5) * 1.0,
            dist: 0.4 + Math.pow(rnd(), 1.8) * 5.2,
            r: 0.035 + Math.pow(rnd(), 3) * 0.13,
            a: 0.35 + rnd() * 0.55,
            side: rnd() < 0.82 ? 1 : -1,
        }))
        const sealSpecks = Array.from({ length: 40 }, () => ({
            x: rnd(),
            y: rnd(),
            r: 0.01 + rnd() * 0.035,
        }))

        // Film grain
        const grainPats: CanvasPattern[] = []
        for (let v = 0; v < 4; v++) {
            const g = document.createElement("canvas")
            g.width = 192
            g.height = 192
            const gc = g.getContext("2d") as CanvasRenderingContext2D
            const id = gc.createImageData(192, 192)
            for (let i = 0; i < id.data.length; i += 4) {
                const v2 = Math.random() > 0.5 ? 255 : 0
                id.data[i] = v2
                id.data[i + 1] = v2
                id.data[i + 2] = v2
                id.data[i + 3] = Math.random() * 46
            }
            gc.putImageData(id, 0, 0)
            const pat = ctx.createPattern(g, "repeat")
            if (pat) grainPats.push(pat)
        }

        // ---------- state ----------
        let raf = 0
        let isVisible = false
        let pausedAt = 0
        let w = 0
        let h = 0
        let dpr = 1
        let cx = 0
        let cy = 0
        let R = 0
        let W = 0
        const TH0 = -2.35
        const SWEEP = TAU * 0.94
        let drawnT = 0
        let needsRedraw = true
        let splatDrawn = false
        let sealDrawn = false
        let stampAt = 0

        let start = performance.now()
        let last = start
        let prog = 0
        let resolvedAt = 0
        let exitAt = 0
        let finished = false
        let stage = -1
        let restartTimer: any = null
        const subTimers: any[] = []

        // film tick (24 fps)
        let lastTick = 0
        let jx = 0
        let jy = 0
        let gVar = 0
        let gx = 0
        let gy = 0
        let dust: { x: number; y: number; r: number }[] = []
        let scratch = -1

        const reduced =
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const dur = reduced ? Math.min(duration, 1.8) : duration

        const buildPaper = () => {
            paperC.width = Math.max(1, Math.floor(w * dpr))
            paperC.height = Math.max(1, Math.floor(h * dpr))
            pctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            pctx.fillStyle = paper
            pctx.fillRect(0, 0, w, h)
            const pr = mulberry32(5)
            // mottling
            for (let i = 0; i < 9; i++) {
                const x = pr() * w
                const y = pr() * h
                const rr = (0.25 + pr() * 0.5) * Math.max(w, h)
                const g = pctx.createRadialGradient(x, y, 0, x, y, rr)
                g.addColorStop(0, `rgba(120,95,60,${0.03 + pr() * 0.04})`)
                g.addColorStop(1, "rgba(120,95,60,0)")
                pctx.fillStyle = g
                pctx.fillRect(0, 0, w, h)
            }
            // washi fibers
            const n = Math.floor((w * h) / 110)
            pctx.lineCap = "round"
            for (let i = 0; i < n; i++) {
                const x = pr() * w
                const y = pr() * h
                const len = 5 + pr() * 28
                const a = pr() * TAU
                pctx.strokeStyle =
                    pr() < 0.6
                        ? `rgba(110,88,55,${0.025 + pr() * 0.05})`
                        : `rgba(255,255,255,${0.06 + pr() * 0.1})`
                pctx.lineWidth = 0.5 + pr() * 0.7
                pctx.beginPath()
                pctx.moveTo(x, y)
                pctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
                pctx.stroke()
            }
        }

        const resize = () => {
            const r = wrap.getBoundingClientRect()
            dpr = Math.min(window.devicePixelRatio || 1, 2)
            w = r.width
            h = r.height
            canvas.width = Math.max(1, Math.floor(w * dpr))
            canvas.height = Math.max(1, Math.floor(h * dpr))
            inkC.width = canvas.width
            inkC.height = canvas.height
            cx = w / 2
            cy = h / 2
            const minD = Math.min(w, h)
            R = (minD * ringSize) / 100
            W = (R * brushWidth) / 100
            buildPaper()
            needsRedraw = true
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(wrap)

        // ---------- brush ----------
        const pathAt = (t: number) => {
            const th = TH0 + SWEEP * t
            const Rr =
                R *
                (1 +
                    0.025 * Math.sin(th * 2 + 1.3) +
                    0.015 * Math.sin(th * 3.7))
            const wd =
                W *
                (1.12 - 0.22 * ss(0, 0.12, t)) *
                (1 - 0.85 * ss(0.7, 1, t)) *
                (0.94 + 0.06 * Math.sin(t * 9))
            return {
                th,
                R: Rr,
                wd,
                dry: ss(0.45, 1, t),
                press: 1 - 0.4 * ss(0.6, 1, t),
            }
        }

        const drawStroke = (t0: number, t1: number) => {
            ictx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ictx.lineCap = "round"
            ictx.strokeStyle = ink
            ictx.fillStyle = ink
            if (t0 === 0) {
                const p = pathAt(0)
                const sx = cx + Math.cos(p.th) * p.R
                const sy = cy + Math.sin(p.th) * p.R
                const g = ictx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.62)
                g.addColorStop(0, "rgba(0,0,0,0.55)")
                g.addColorStop(1, "rgba(0,0,0,0)")
                ictx.globalAlpha = 1
                ictx.fillStyle = g
                ictx.beginPath()
                ictx.arc(sx, sy, W * 0.62, 0, TAU)
                ictx.fill()
            }
            const step = 0.002
            let tc = t0
            while (tc < t1 - 1e-6) {
                const ta = tc
                const tb = Math.min(t1, tc + step)
                const A = pathAt(ta)
                const B = pathAt(tb)
                for (let i = 0; i < N; i++) {
                    const b = bristles[i]
                    const noise =
                        0.5 +
                        0.5 *
                            Math.sin(A.th * b.f1 + b.ph) *
                            Math.cos(A.th * b.f2 + b.ph2)
                    if (noise < A.dry * b.dry * 0.85) continue
                    const al = b.a * A.press * (0.7 + 0.3 * noise)
                    const rA = A.R + (b.o * A.wd) / 2
                    const rB = B.R + (b.o * B.wd) / 2
                    const x1 = cx + Math.cos(A.th) * rA
                    const y1 = cy + Math.sin(A.th) * rA
                    const x2 = cx + Math.cos(B.th) * rB
                    const y2 = cy + Math.sin(B.th) * rB
                    const lw = Math.max(0.4, b.rel * A.wd)
                    if (i % 3 === 0) {
                        ictx.globalAlpha = al * 0.09
                        ictx.lineWidth = lw * 3.2
                        ictx.beginPath()
                        ictx.moveTo(x1, y1)
                        ictx.lineTo(x2, y2)
                        ictx.stroke()
                    }
                    ictx.globalAlpha = al
                    ictx.lineWidth = lw
                    ictx.beginPath()
                    ictx.moveTo(x1, y1)
                    ictx.lineTo(x2, y2)
                    ictx.stroke()
                }
                tc = tb
            }
            ictx.globalAlpha = 1
        }

        const drawSplatter = () => {
            ictx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ictx.fillStyle = ink
            const end = pathAt(1)
            const ex = cx + Math.cos(end.th) * end.R
            const ey = cy + Math.sin(end.th) * end.R
            const tang = end.th + Math.PI / 2 // brush travel direction (clockwise)
            for (let i = 0; i < splats.length; i++) {
                const s = splats[i]
                const a = tang + s.da
                const d = s.dist * W
                const px =
                    ex +
                    Math.cos(a) * d +
                    Math.cos(end.th) * s.side * W * 0.25 * s.dist * 0.3
                const py =
                    ey +
                    Math.sin(a) * d +
                    Math.sin(end.th) * s.side * W * 0.25 * s.dist * 0.3
                ictx.globalAlpha = s.a
                ictx.beginPath()
                ictx.arc(px, py, Math.max(0.7, s.r * W), 0, TAU)
                ictx.fill()
            }
            ictx.globalAlpha = 1
        }

        const drawSeal = () => {
            const size = Math.max(24, R * 0.2)
            const sx = cx + R * 0.98
            const sy = cy + R * 0.98
            ictx.save()
            ictx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ictx.translate(sx, sy)
            ictx.rotate(-0.05)
            ictx.globalCompositeOperation = "source-over"
            ictx.globalAlpha = 0.9
            ictx.fillStyle = seal
            ictx.fillRect(-size / 2, -size / 2, size, size)
            ictx.globalAlpha = 1
            // carve: frame and lines
            ictx.globalCompositeOperation = "destination-out"
            ictx.strokeStyle = "#000"
            ictx.lineCap = "round"
            ictx.lineWidth = size * 0.07
            const m = size * 0.34
            ictx.strokeRect(-m, -m, m * 2, m * 2)
            ictx.lineWidth = size * 0.09
            ictx.beginPath()
            ictx.moveTo(-m * 0.55, -m * 0.2)
            ictx.lineTo(m * 0.55, -m * 0.2)
            ictx.moveTo(-m * 0.55, m * 0.35)
            ictx.lineTo(m * 0.55, m * 0.35)
            ictx.moveTo(0, -m * 0.75)
            ictx.lineTo(0, m * 0.75)
            ictx.stroke()
            // worn stamp
            ictx.fillStyle = "#000"
            for (let i = 0; i < sealSpecks.length; i++) {
                const sp = sealSpecks[i]
                ictx.globalAlpha = 0.7
                ictx.beginPath()
                ictx.arc(
                    (sp.x - 0.5) * size,
                    (sp.y - 0.5) * size,
                    sp.r * size,
                    0,
                    TAU
                )
                ictx.fill()
            }
            ictx.restore()
        }

        const reset = () => {
            start = performance.now()
            last = start
            prog = 0
            resolvedAt = 0
            exitAt = 0
            finished = false
            stage = -1
            stampAt = 0
            needsRedraw = true
        }

        const setSub = (text: string) => {
            const el = subRef.current
            if (!el) return
            el.style.opacity = "0"
            subTimers.push(
                setTimeout(() => {
                    if (subRef.current) {
                        subRef.current.textContent = text
                        subRef.current.style.opacity = "1"
                    }
                }, 220)
            )
        }

        const frame = (now: number) => {
            if (doneRef.current || !isVisible) return
            raf = requestAnimationFrame(frame)

            const t = (now - start) / 1000
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now

            let target = Math.min(1, t / dur)
            if (!loadedRef.current) target = Math.min(target, 0.93)
            prog += (target - prog) * Math.min(1, dt * 5)
            if (target >= 1 && prog > 0.9995) prog = 1

            // Timeline
            let exitU = -1
            if (prog >= 1) {
                if (!resolvedAt) resolvedAt = now
                const since = (now - resolvedAt) / 1000
                if (since > hold) {
                    if (!exitAt) exitAt = now
                    exitU = clamp01((now - exitAt) / 1000 / exitDuration)
                }
            }

            // Letterbox bars
            const fullBar = letterbox ? Math.max(44, h * 0.11) : 0
            const intro = ss(0.1, 1.0, t)
            const barH =
                fullBar * intro * (1 - ss(0.35, 0.95, exitU < 0 ? 0 : exitU))
            if (topRef.current) topRef.current.style.height = barH + "px"
            if (botRef.current) botRef.current.style.height = barH + "px"

            if (exitU >= 1) {
                if (!finished) {
                    finished = true
                    if (isCanvas) {
                        restartTimer = setTimeout(reset, 900)
                    } else {
                        doneRef.current = true
                        try {
                            sessionStorage.setItem("enso-preloader-seen", "1")
                        } catch (err) {}
                        setDone(true)
                        onCompleteRef.current && onCompleteRef.current()
                        return
                    }
                }
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
                ctx.clearRect(0, 0, w, h)
                return
            }

            // Paint the ink incrementally
            if (needsRedraw) {
                ictx.setTransform(1, 0, 0, 1, 0, 0)
                ictx.clearRect(0, 0, inkC.width, inkC.height)
                drawnT = 0
                splatDrawn = false
                sealDrawn = false
                needsRedraw = false
            }
            const tTarget = Math.min(1, prog)
            if (drawnT < tTarget) {
                drawStroke(drawnT, tTarget)
                drawnT = tTarget
            }
            if (prog >= 1 && !splatDrawn) {
                drawSplatter()
                splatDrawn = true
            }
            if (
                showSeal &&
                prog >= 1 &&
                !sealDrawn &&
                (now - resolvedAt) / 1000 > 0.45
            ) {
                drawSeal()
                sealDrawn = true
                if (!stampAt) stampAt = now
            }

            // Film tick 24fps
            if (now - lastTick > 41.6) {
                lastTick = now
                jx = (Math.random() - 0.5) * 0.9
                jy = (Math.random() - 0.5) * 0.9
                gVar = Math.floor(Math.random() * grainPats.length)
                gx = Math.random() * 192
                gy = Math.random() * 192
                dust = []
                const nd =
                    Math.random() < 0.55 ? 1 + Math.floor(Math.random() * 4) : 0
                for (let i = 0; i < nd; i++)
                    dust.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        r: 0.5 + Math.random() * 1.3,
                    })
                scratch = Math.random() < 0.05 ? Math.random() * w : -1
            }

            // Stamp shake
            let sx = 0
            let sy = 0
            if (stampAt) {
                const ds = (now - stampAt) / 1000
                const amp = 7 * Math.exp(-ds * 13)
                sx = Math.sin(ds * 70) * amp
                sy = Math.cos(ds * 55) * amp * 0.7
            }

            // ---------- composition ----------
            const u = exitU < 0 ? 0 : exitU
            const sc = 1 + 5.6 * Math.pow(u, 2.4)
            const rot = 0.35 * u
            const fadeOv = 1 - ss(0.2, 0.9, u)

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.globalCompositeOperation = "source-over"
            ctx.globalAlpha = 1
            ctx.clearRect(0, 0, w, h)

            ctx.save()
            ctx.translate(jx + sx, jy + sy)

            // Paper
            ctx.drawImage(paperC, -2, -2, w + 4, h + 4)

            // Hole: the camera dives through the circle
            if (exitU > 0) {
                const holeR = R * 0.84 * sc * ss(0, 0.3, u)
                if (holeR > 0.5) {
                    const edge = 4 + holeR * 0.015
                    const g = ctx.createRadialGradient(
                        cx,
                        cy,
                        Math.max(0, holeR - edge),
                        cx,
                        cy,
                        holeR + edge
                    )
                    g.addColorStop(0, "rgba(0,0,0,1)")
                    g.addColorStop(1, "rgba(0,0,0,0)")
                    ctx.globalCompositeOperation = "destination-out"
                    ctx.fillStyle = g
                    ctx.fillRect(-4, -4, w + 8, h + 8)
                    ctx.globalCompositeOperation = "source-over"
                }
            }

            // Ink (multiplied over the paper)
            ctx.globalCompositeOperation = "multiply"
            ctx.globalAlpha = 1 - ss(0.85, 1, u)
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate(rot)
            ctx.scale(sc, sc)
            ctx.translate(-cx, -cy)
            ctx.drawImage(inkC, 0, 0, w, h)
            ctx.restore()
            ctx.globalAlpha = 1
            ctx.globalCompositeOperation = "source-over"
            ctx.restore()

            // Vignette
            if (fadeOv > 0.01) {
                const vg = ctx.createRadialGradient(
                    cx,
                    cy,
                    Math.min(w, h) * 0.3,
                    cx,
                    cy,
                    Math.hypot(w, h) * 0.62
                )
                vg.addColorStop(0, "rgba(30,18,6,0)")
                vg.addColorStop(1, "rgba(30,18,6,0.5)")
                ctx.globalAlpha = fadeOv
                ctx.fillStyle = vg
                ctx.fillRect(0, 0, w, h)

                // Film dust & scratches
                ctx.fillStyle = "rgba(20,14,8,0.55)"
                for (let i = 0; i < dust.length; i++) {
                    ctx.beginPath()
                    ctx.arc(dust[i].x, dust[i].y, dust[i].r, 0, TAU)
                    ctx.fill()
                }
                if (scratch >= 0) {
                    ctx.strokeStyle = "rgba(255,255,255,0.35)"
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(scratch, 0)
                    ctx.lineTo(scratch + (Math.random() - 0.5) * 3, h)
                    ctx.stroke()
                }

                // Grain
                if (grain > 0 && grainPats.length) {
                    ctx.save()
                    ctx.globalAlpha = fadeOv * Math.min(1, grain)
                    ctx.translate(-gx, -gy)
                    ctx.fillStyle = grainPats[gVar]
                    ctx.fillRect(0, 0, w + 192, h + 192)
                    ctx.restore()
                }
                ctx.globalAlpha = 1
            }

            // Fade in from black
            const blk = 1 - ss(0, 0.9, t)
            if (blk > 0.01) {
                ctx.fillStyle = `rgba(0,0,0,${blk})`
                ctx.fillRect(0, 0, w, h)
            }

            // ---------- HUD ----------
            const ft = Math.floor((t % 1) * 24)
            if (tcRef.current)
                tcRef.current.textContent = `${pad(Math.floor(t / 3600))}:${pad(
                    Math.floor((t % 3600) / 60)
                )}:${pad(Math.floor(t % 60))}:${pad(ft)}`
            if (pctRef.current)
                pctRef.current.textContent = `${String(Math.round(prog * 100)).padStart(3, "0")}%`
            const s = prog >= 1 ? 2 : prog > 0.3 ? 1 : 0
            if (s !== stage) {
                stage = s
                setSub([subtitle1, subtitle2, subtitle3][s])
            }
        }
        // Animate only while the component is inside the viewport. When it leaves,
        // cancel the RAF loop and pause the timeline rather than letting it jump ahead.
        let visibilityObserver: IntersectionObserver | null = null
        const startAnimation = () => {
            if (raf || doneRef.current) return
            raf = requestAnimationFrame(frame)
        }
        const stopAnimation = () => {
            if (raf) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        }

        if (typeof IntersectionObserver !== "undefined") {
            visibilityObserver = new IntersectionObserver(
                ([entry]) => {
                    const visible = !!entry?.isIntersecting
                    if (visible === isVisible) return

                    if (visible) {
                        isVisible = true
                        const now = performance.now()
                        if (pausedAt) {
                            const pausedFor = now - pausedAt
                            start += pausedFor
                            last = now
                            if (resolvedAt) resolvedAt += pausedFor
                            if (exitAt) exitAt += pausedFor
                            if (stampAt) stampAt += pausedFor
                            pausedAt = 0
                        }
                        startAnimation()
                    } else {
                        isVisible = false
                        pausedAt = performance.now()
                        stopAnimation()
                    }
                },
                { threshold: 0 }
            )
            visibilityObserver.observe(wrap)
        } else {
            // Graceful fallback for environments without IntersectionObserver.
            isVisible = true
            startAnimation()
        }

        return () => {
            stopAnimation()
            visibilityObserver?.disconnect()
            ro.disconnect()
            clearTimeout(restartTimer)
            subTimers.forEach((x) => clearTimeout(x))
        }
    }, [
        done,
        paper,
        ink,
        seal,
        ringSize,
        brushWidth,
        duration,
        hold,
        exitDuration,
        letterbox,
        showSeal,
        grain,
        subtitle1,
        subtitle2,
        subtitle3,
        isCanvas,
        isStatic,
    ])

    // A lightweight, deterministic poster for Framer's static renderer.
    // It intentionally contains no canvas, timers, observers, or animation loop.
    if (isStatic) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minHeight: 240,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: paper,
                    color: ink,
                    fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        width: "min(42%, 240px)",
                        aspectRatio: "1",
                        border: `${Math.max(3, brushWidth / 5)}px solid ${ink}`,
                        borderRadius: "50%",
                        opacity: 0.9,
                        boxSizing: "border-box",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: 20,
                        right: 20,
                        bottom: 16,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        color: barText,
                        fontSize: 10,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                    }}
                >
                    <span>{title}</span>
                    <span>ENSŌ · PRELOADER</span>
                </div>
                {showSeal && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            width: 34,
                            height: 34,
                            right: "29%",
                            bottom: "27%",
                            background: seal,
                            opacity: 0.9,
                        }}
                    />
                )}
            </div>
        )
    }

    if (done) return null

    const pinned = fullscreen && !isCanvas
    const mono: React.CSSProperties = {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: barText,
        whiteSpace: "nowrap",
    }
    const bar: React.CSSProperties = {
        position: "absolute",
        left: 0,
        right: 0,
        height: 0,
        background: "#050505",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        boxSizing: "border-box",
    }

    return (
        <div
            ref={wrapRef}
            style={{
                ...style,
                position: pinned ? "fixed" : "relative",
                inset: pinned ? 0 : undefined,
                width: pinned ? "100vw" : "100%",
                height: pinned ? "100vh" : "100%",
                zIndex: pinned ? 99999 : undefined,
                overflow: "hidden",
            }}
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
            <div ref={topRef} style={{ ...bar, top: 0 }}>
                <span style={mono}>{title}</span>
                <span ref={tcRef} style={mono}>
                    00:00:00:00
                </span>
            </div>
            <div ref={botRef} style={{ ...bar, bottom: 0 }}>
                <span ref={pctRef} style={{ ...mono, minWidth: 80 }}>
                    000%
                </span>
                <div
                    ref={subRef}
                    style={{
                        fontFamily: "Georgia, 'Times New Roman', serif",
                        fontStyle: "italic",
                        fontSize: 15,
                        letterSpacing: "0.03em",
                        color: "#EFE9DA",
                        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                        transition: "opacity 0.22s ease",
                        textAlign: "center",
                        padding: "0 12px",
                    }}
                />
                <span style={{ ...mono, minWidth: 80, textAlign: "right" }}>
                    24 FPS
                </span>
            </div>
        </div>
    )
}

EnsoCinemaPreloader.defaultProps = {
    paper: "#E8E0CF",
    ink: "#0E0D0C",
    seal: "#B3261E",
    ringSize: 27,
    brushWidth: 30,
    duration: 5,
    hold: 1.1,
    exitDuration: 1.9,
    waitForLoad: true,
    oncePerSession: false,
    fullscreen: true,
    letterbox: true,
    showSeal: true,
    grain: 0.8,
    title: "Reel 01 / Enso",
    subtitle1: "Preparing the canvas",
    subtitle2: "The ink begins to flow",
    subtitle3: "No circle is ever perfect",
    barText: "#8F8878",
}

addPropertyControls(EnsoCinemaPreloader, {
    paper: { type: ControlType.Color, title: "Paper" },
    ink: { type: ControlType.Color, title: "Ink" },
    seal: { type: ControlType.Color, title: "Seal" },
    ringSize: {
        type: ControlType.Number,
        title: "Ring Size",
        min: 14,
        max: 40,
        step: 1,
        unit: "%",
        description: "Circle radius relative to the shortest side",
    },
    brushWidth: {
        type: ControlType.Number,
        title: "Brush",
        min: 12,
        max: 50,
        step: 1,
        unit: "%",
        description: "Brush thickness relative to the radius",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 2,
        max: 12,
        step: 0.1,
        unit: "s",
    },
    hold: {
        type: ControlType.Number,
        title: "Hold",
        min: 0,
        max: 3,
        step: 0.1,
        unit: "s",
        description: "Pause after the seal, before the camera dives through",
    },
    exitDuration: {
        type: ControlType.Number,
        title: "Exit Time",
        min: 0.8,
        max: 4,
        step: 0.1,
        unit: "s",
    },
    waitForLoad: {
        type: ControlType.Boolean,
        title: "Wait Load",
        description: "Hold at 93% until the page has finished loading",
    },
    oncePerSession: { type: ControlType.Boolean, title: "Once/Session" },
    fullscreen: { type: ControlType.Boolean, title: "Fullscreen" },
    letterbox: { type: ControlType.Boolean, title: "Letterbox" },
    showSeal: { type: ControlType.Boolean, title: "Red Seal" },
    grain: {
        type: ControlType.Number,
        title: "Film Grain",
        min: 0,
        max: 1,
        step: 0.05,
    },
    title: { type: ControlType.String, title: "Title" },
    subtitle1: { type: ControlType.String, title: "Subtitle 1" },
    subtitle2: { type: ControlType.String, title: "Subtitle 2" },
    subtitle3: { type: ControlType.String, title: "Subtitle 3" },
    barText: { type: ControlType.Color, title: "Bar Text" },
    onComplete: { type: ControlType.EventHandler },
})
