// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, type CSSProperties } from "react" // FIX 3: importar CSSProperties diretamente

/**
 * Orbital Type Distortion — Framer Code Component
 */

interface Props {
    text: string
    font: any
    textColor: string
    accent: string
    background: string
    density: number
    particleSize: number
    particleStyle: "dots" | "lines" | "wire"
    orbitRadius: number
    orbitForce: number
    followForce: number
    friction: number
    velocity: number
    orbitSpeed: number
    distortion: number
    returnSpeed: number
    glow: number
    trail: number
    showField: boolean
    auto: boolean
    disableOnMobile: boolean
    style?: CSSProperties // FIX 3: era React.CSSProperties (React não importado)
}

type P = {
    hx: number
    hy: number
    x: number
    y: number
    li: number
    orbR: number
    dir: number
    spin: number
    cap: boolean
    seed: number
    vx: number
    vy: number
}
type L = {
    x0: number
    x1: number
    y0: number
    y1: number
    act: number
    hover: boolean
}

// FIX 1: hexA não processava rgba() — Framer retorna cores em ambos os formatos.
// hexA("rgba(10,12,16,1)", 0.3) retornava "rgba(10,12,16,1)" (alpha ignorado),
// quebrando glow, field ring e wire style silenciosamente.
function hexA(hex: string, a: number) {
    if (!hex) hex = "#ffffff"
    if (hex[0] === "#" && hex.length >= 7) {
        const r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16)
        return `rgba(${r},${g},${b},${a})`
    }
    // FIX 1: parse rgba()/rgb() extraindo os canais numéricos
    const m = hex.match(/\d+\.?\d*/g)
    if (m && m.length >= 3) return `rgba(${m[0]},${m[1]},${m[2]},${a})`
    return hex
}

// FIX 4 helper: Framer pode retornar "rgba(r,g,b,0)" para cor transparente.
// A checagem anterior (só "transparent"/"none"/"") deixava passar rgba com alpha=0,
// que chamava fillRect com cor invisível → canvas não era limpo → ghosting.
function isClearBg(c: string) {
    if (!c || c === "transparent" || c === "none" || c === "") return true
    const m = c.match(/rgba?\s*\([^)]+\)/)
    if (m) {
        const nums = m[0].match(/[\d.]+/g)
        if (nums && nums.length >= 4 && parseFloat(nums[3]) === 0) return true
    }
    return false
}

function makeSprite(color: string) {
    const s = document.createElement("canvas")
    s.width = s.height = 48
    // FIX 2: era getContext("2d")! — non-null assertion suprime TypeScript mas
    // causa TypeError em runtime se getContext retornar null
    const c = s.getContext("2d")
    if (!c) return s
    const g = c.createRadialGradient(24, 24, 0, 24, 24, 24)
    g.addColorStop(0, hexA(color, 1))
    g.addColorStop(0.3, hexA(color, 0.5))
    g.addColorStop(1, hexA(color, 0))
    c.fillStyle = g
    c.fillRect(0, 0, 48, 48)
    return s
}

export default function OrbitalType(props: Props) {
    const {
        text,
        font,
        textColor,
        accent,
        background,
        density,
        particleSize,
        particleStyle,
        orbitRadius,
        orbitForce,
        followForce,
        friction,
        velocity,
        orbitSpeed,
        distortion,
        returnSpeed,
        glow,
        trail,
        showField,
        auto,
        disableOnMobile,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const ct = containerRef.current,
            cv = canvasRef.current
        if (!ct || !cv) return
        const isMobile =
            typeof matchMedia !== "undefined" &&
            matchMedia("(pointer: coarse)").matches
        if (disableOnMobile && isMobile) return
        let reduced = false
        try {
            reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
        } catch (e) {}

        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        // FIX 2: era getContext("2d")! — null check explícito
        const ctx = cv.getContext("2d")
        if (!ctx) return

        const off = document.createElement("canvas")
        const spA = makeSprite(accent)
        const num = (v: number, d: number) => (isFinite(v) ? v : d)

        let W = 0,
            H = 0
        let particles: P[] = [],
            letters: L[] = []
        let letterReveal: number[] = []
        let letterRevealDelay: number[] = []
        let fontStr = "",
            txt = "ORBITAL",
            tx = 0,
            ty = 0
        let textCx = 0,
            textCy = 0,
            halfW = 0,
            halfH = 0
        let raf = 0,
            running = false,
            dead = false
        let inView = false
        let observer: IntersectionObserver | null = null
        let mouse: { x: number; y: number } | null = null
        let lastMove = -1e9

        function startLoop() {
            if (isStatic || dead || running || !inView || document.hidden)
                return
            running = true
            raf = requestAnimationFrame(loop)
        }

        function stopLoop() {
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            running = false
        }

        function sample() {
            if (!W || !H) return
            off.width = W
            off.height = H

            // FIX 2: era off.getContext("2d")! — null check explícito
            const oc = off.getContext("2d")
            if (!oc) return

            txt = text != null ? String(text) : "ORBITAL"
            const fontFamilyValue =
                font?.fontFamily || "'Space Grotesk', sans-serif"
            const fontSizeValue = Number.parseFloat(
                String(font?.fontSize ?? 150)
            )
            const fontWeightValue = font?.fontWeight || 600
            let fs = num(fontSizeValue, 150) * dpr
            oc.clearRect(0, 0, W, H)
            oc.textBaseline = "middle"
            oc.textAlign = "center"
            oc.font = `${fontWeightValue} ${fs}px ${fontFamilyValue}`
            const tw = oc.measureText(txt).width
            if (tw > W * 0.9) fs *= (W * 0.9) / tw
            fontStr = `${fontWeightValue} ${fs}px ${fontFamilyValue}`
            tx = W / 2
            ty = H / 2 + fs * 0.02
            oc.font = fontStr
            oc.fillStyle = "#fff"
            oc.fillText(txt, tx, ty)
            let img: Uint8ClampedArray
            try {
                img = oc.getImageData(0, 0, W, H).data
            } catch (e) {
                return
            }

            const step = Math.max(2, Math.round(num(density, 4) * dpr))
            const ps: P[] = []
            let minX = W,
                maxX = 0,
                minY = H,
                maxY = 0
            for (let y = 0; y < H; y += step)
                for (let x = 0; x < W; x += step)
                    if (img[(y * W + x) * 4 + 3] > 120) {
                        ps.push({
                            hx: x,
                            hy: y,
                            x,
                            y,
                            li: 0,
                            orbR: 0,
                            dir: Math.random() < 0.5 ? 1 : -1,
                            spin: 1,
                            cap: false,
                            seed: Math.random(),
                            vx: 0,
                            vy: 0,
                        })
                        if (x < minX) minX = x
                        if (x > maxX) maxX = x
                        if (y < minY) minY = y
                        if (y > maxY) maxY = y
                    }
            particles = ps
            textCx = (minX + maxX) / 2
            textCy = (minY + maxY) / 2
            halfW = (maxX - minX) / 2
            halfH = (maxY - minY) / 2

            const cstep = Math.max(2, Math.round(step / 2)),
                minGap = Math.max(4, Math.round(6 * dpr))
            const segs: number[][] = []
            let ss = -1,
                lf = -1
            for (let x = 0; x < W; x += cstep) {
                let fl = false
                for (let y = 0; y < H; y += cstep)
                    if (img[(y * W + x) * 4 + 3] > 120) {
                        fl = true
                        break
                    }
                if (fl) {
                    if (ss < 0) ss = x
                    lf = x
                } else if (ss >= 0 && x - lf > minGap) {
                    segs.push([ss, lf])
                    ss = -1
                }
            }
            if (ss >= 0) segs.push([ss, lf])

            const ls: L[] = (segs.length ? segs : [[minX, maxX]]).map((s) => ({
                x0: s[0],
                x1: s[1],
                y0: H,
                y1: 0,
                act: 0,
                hover: false,
            }))
            for (const p of ps) {
                let li = 0,
                    best = 1e9
                for (let k = 0; k < ls.length; k++) {
                    const Lk = ls[k]
                    if (p.hx >= Lk.x0 && p.hx <= Lk.x1) {
                        li = k
                        break
                    }
                    const c = (Lk.x0 + Lk.x1) / 2,
                        dd = Math.abs(p.hx - c)
                    if (dd < best) {
                        best = dd
                        li = k
                    }
                }
                p.li = li
                const Lk = ls[li]
                if (p.hy < Lk.y0) Lk.y0 = p.hy
                if (p.hy > Lk.y1) Lk.y1 = p.hy
            }
            letters = ls
            letterReveal = ls.map(() => 1)
            letterRevealDelay = ls.map(() => 0)
        }

        function init() {
            const rect = ct.getBoundingClientRect()
            if (rect.width < 2 || rect.height < 2) return
            cv.width = W = Math.round(rect.width * dpr)
            cv.height = H = Math.round(rect.height * dpr)
            sample()
            if (isStatic) {
                drawStatic()
                return
            }
            if (inView) startLoop()
        }

        function clearOrFill() {
            // FIX 4: isClearBg() detecta rgba com alpha=0, que antes passava pela
            // checagem e chamava fillRect com cor invisível → canvas não limpava → ghosting
            if (isClearBg(background)) {
                ctx.clearRect(0, 0, W, H)
            } else {
                ctx.globalCompositeOperation = "source-over"
                ctx.fillStyle = background
                ctx.fillRect(0, 0, W, H)
            }
        }

        function drawCrispText(revealLetters: number[] | null) {
            if (!fontStr) return
            ctx.globalCompositeOperation = "source-over"
            ctx.fillStyle = textColor
            ctx.textBaseline = "middle"
            ctx.textAlign = "center"
            ctx.font = fontStr

            if (!revealLetters || !letters.length) {
                ctx.globalAlpha = 1
                ctx.fillText(txt, tx, ty)
                return
            }

            for (let i = 0; i < letters.length; i++) {
                const alpha = Math.max(0, Math.min(1, revealLetters[i] ?? 1))
                if (alpha <= 0.001) continue
                const letter = letters[i]
                ctx.save()
                ctx.globalAlpha = alpha
                ctx.beginPath()
                ctx.rect(
                    Math.max(0, letter.x0 - 2 * dpr),
                    0,
                    Math.max(1, letter.x1 - letter.x0 + 4 * dpr),
                    H
                )
                ctx.clip()
                ctx.fillText(txt, tx, ty)
                ctx.restore()
            }
            ctx.globalAlpha = 1
        }

        function drawStatic() {
            clearOrFill() // FIX 4
            drawCrispText(null)
        }

        function autoPt(t: number) {
            return {
                x: textCx + Math.sin(t * 0.00035) * (halfW || W * 0.3) * 0.96,
                y:
                    textCy +
                    Math.sin(t * 0.0009 + 1.3) * (halfH || H * 0.2) * 0.4,
            }
        }

        function loop(t: number) {
            if (dead) return
            raf = requestAnimationFrame(loop)
            if (!particles.length) return
            const psize = num(particleSize, 1.4) * dpr
            const distort = num(distortion, 60) / 100
            const ret = num(returnSpeed, 0.18)
            const oSpeed = num(orbitSpeed, 1)
            const gl = num(glow, 30) / 100
            const trl = num(trail, 30) / 100
            const orbitR = num(orbitRadius, 60) * dpr
            const oForce = num(orbitForce, 0.15) * Math.max(0.05, oSpeed)
            const fForce = num(followForce, 0.012)
            const fric = Math.min(0.99, num(friction, 0.95))
            const vel = num(velocity, 1.8)
            const pad = 8 * dpr

            clearOrFill() // FIX 4

            const now = performance.now()
            let cx: number,
                cy: number,
                active = true
            if (mouse && now - lastMove < 1600) {
                cx = mouse.x
                cy = mouse.y
            } else if (auto && !reduced) {
                const a = autoPt(t)
                cx = a.x
                cy = a.y
            } else {
                active = false
                cx = -99999
                cy = -99999
            }

            for (const Lk of letters) {
                const hov =
                    active &&
                    cx >= Lk.x0 - pad &&
                    cx <= Lk.x1 + pad &&
                    cy >= Lk.y0 - pad &&
                    cy <= Lk.y1 + pad
                Lk.hover = hov
                Lk.act += ((hov ? 1 : 0) - Lk.act) * 0.3
                if (!hov && Lk.act < 0.01) Lk.act = 0
            }

            if (active && showField) {
                ctx.strokeStyle = hexA(accent, 0.12)
                ctx.lineWidth = dpr
                ctx.beginPath()
                ctx.arc(cx, cy, orbitR, 0, 6.2832)
                ctx.stroke()
            }

            const capList: P[] | null = particleStyle === "wire" ? [] : null
            for (const p of particles) {
                const Lk = letters[p.li]
                if (Lk && Lk.hover) {
                    const rx = p.x - cx,
                        ry = p.y - cy,
                        rl = Math.max(0.001, Math.sqrt(rx * rx + ry * ry))
                    if (!p.cap) {
                        p.cap = true
                        p.orbR = orbitR * (0.5 + p.seed * 1.15)
                        p.dir = p.seed < 0.8 ? 1 : -1
                        p.spin = 0.55 + p.seed
                        const kick = vel * dpr * 3.0,
                            pop = vel * dpr * 1.6
                        p.vx += (-ry / rl) * p.dir * kick + (rx / rl) * pop
                        p.vy += (rx / rl) * p.dir * kick + (ry / rl) * pop
                    }
                    const nx = rx / rl,
                        ny = ry / rl,
                        tnx = -ny,
                        tny = nx
                    const targetR =
                        p.orbR +
                        Math.sin(t * 0.0026 + p.seed * 6.28) *
                            (3 + distort * 7) *
                            dpr
                    const rErr = targetR - rl
                    let ax =
                        tnx * p.dir * oForce * p.spin * dpr + nx * rErr * 0.03
                    let ay =
                        tny * p.dir * oForce * p.spin * dpr + ny * rErr * 0.03
                    ax +=
                        Math.sin(t * 0.0016 + p.seed * 41) *
                        0.05 *
                        distort *
                        dpr
                    ay +=
                        Math.cos(t * 0.0019 + p.seed * 33) *
                        0.05 *
                        distort *
                        dpr
                    ax += (cx - p.x) * fForce
                    ay += (cy - p.y) * fForce
                    p.vx = (p.vx + ax) * fric
                    p.vy = (p.vy + ay) * fric
                    p.x += p.vx
                    p.y += p.vy
                } else if (p.cap) {
                    p.x += (p.hx - p.x) * ret
                    p.y += (p.hy - p.y) * ret
                    p.vx *= fric
                    p.vy *= fric

                    const dx = p.hx - p.x
                    const dy = p.hy - p.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
                    if (dist < psize * 0.5 && speed < 0.025 * dpr) {
                        p.cap = false
                        p.x = p.hx
                        p.y = p.hy
                        p.vx = 0
                        p.vy = 0
                    }
                } else {
                    p.x = p.hx
                    p.y = p.hy
                    p.vx = 0
                    p.vy = 0
                }
                if (capList && p.cap) capList.push(p)
            }

            const letterHasCaptured = letters.map(() => false)
            for (const p of particles) {
                if (p.cap && letters[p.li]) letterHasCaptured[p.li] = true
            }

            for (let i = 0; i < letters.length; i++) {
                const letter = letters[i]
                const shouldFadeOut =
                    letter.hover || letterHasCaptured[i] || letter.act > 0.02

                if (shouldFadeOut) {
                    letterReveal[i] = 0
                    letterRevealDelay[i] = 0
                } else {
                    const delay = letterRevealDelay[i] ?? 0
                    if (delay > 0) {
                        letterRevealDelay[i] = delay - 1
                        letterReveal[i] = 0
                    } else {
                        const current = letterReveal[i] ?? 0
                        letterReveal[i] = current + (1 - current) * 0.06
                        if (Math.abs(letterReveal[i] - 1) < 0.0005)
                            letterReveal[i] = 1
                    }
                }
            }

            const hasPartialReveal = letterReveal.some((value) => value < 0.999)
            drawCrispText(hasPartialReveal ? letterReveal : null)

            if (gl > 0) {
                ctx.globalCompositeOperation = "lighter"
                for (const p of particles) {
                    if (!p.cap) continue
                    const Lk = letters[p.li],
                        act = Lk ? Lk.act : 0
                    ctx.globalAlpha = act * 0.4 * gl
                    const gs = psize * (2.4 + gl * 2)
                    ctx.drawImage(spA, p.x - gs / 2, p.y - gs / 2, gs, gs)
                }
            }

            ctx.globalCompositeOperation = "source-over"
            ctx.globalAlpha = 1
            for (const p of particles) {
                if (!p.cap) continue
                if (particleStyle === "lines") {
                    ctx.strokeStyle = accent
                    ctx.lineWidth = psize * 1.5
                    ctx.beginPath()
                    ctx.moveTo(
                        p.x - p.vx * (1 + trl * 4),
                        p.y - p.vy * (1 + trl * 4)
                    )
                    ctx.lineTo(p.x, p.y)
                    ctx.stroke()
                } else {
                    ctx.fillStyle = accent
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, psize, 0, 6.2832)
                    ctx.fill()
                }
            }

            if (capList && capList.length > 1) {
                ctx.globalAlpha = 0.5
                ctx.strokeStyle = accent
                ctx.lineWidth = 0.6 * dpr
                const TH = orbitR * 0.6
                for (let i = 0; i < capList.length - 1; i++) {
                    const a = capList[i],
                        b = capList[i + 1],
                        ddx = a.x - b.x,
                        ddy = a.y - b.y
                    if (ddx * ddx + ddy * ddy < TH * TH) {
                        ctx.beginPath()
                        ctx.moveTo(a.x, a.y)
                        ctx.lineTo(b.x, b.y)
                        ctx.stroke()
                    }
                }
            }
            ctx.globalAlpha = 1
            ctx.globalCompositeOperation = "source-over"
        }

        const onMove = (e: PointerEvent) => {
            const r = cv.getBoundingClientRect()
            mouse = {
                x: (e.clientX - r.left) * (cv.width / r.width),
                y: (e.clientY - r.top) * (cv.height / r.height),
            }
            lastMove = performance.now()
        }
        const onLeave = () => {
            lastMove = -1e9
        }
        const onVis = () => {
            if (isStatic) return
            if (document.hidden || !inView) {
                stopLoop()
            } else {
                startLoop()
            }
        }

        if (!isStatic) {
            cv.addEventListener("pointermove", onMove)
            cv.addEventListener("pointerleave", onLeave)
            document.addEventListener("visibilitychange", onVis)

            if (typeof IntersectionObserver !== "undefined") {
                observer = new IntersectionObserver(
                    (entries) => {
                        inView = entries[0]?.isIntersecting ?? false
                        if (inView) {
                            init()
                        } else {
                            stopLoop()
                        }
                    },
                    { threshold: 0 }
                )
                observer.observe(ct)
            } else {
                inView = true
            }
        }

        const ro = new ResizeObserver(() => init())
        ro.observe(ct)
        init()

        // FIX 5: fonts.ready.then() sem .catch() → unhandled promise rejection
        if ((document as any).fonts?.ready)
            (document as any).fonts.ready
                .then(() => {
                    if (!dead) init()
                })
                .catch(() => {}) // FIX 5

        return () => {
            dead = true
            if (raf) cancelAnimationFrame(raf)
            cv.removeEventListener("pointermove", onMove)
            cv.removeEventListener("pointerleave", onLeave)
            document.removeEventListener("visibilitychange", onVis)
            observer?.disconnect()
            ro.disconnect()
        }
    }, [
        text,
        font,
        textColor,
        accent,
        background,
        density,
        particleSize,
        particleStyle,
        orbitRadius,
        orbitForce,
        followForce,
        friction,
        velocity,
        orbitSpeed,
        distortion,
        returnSpeed,
        glow,
        trail,
        showField,
        auto,
        disableOnMobile,
        isStatic,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                ...style,
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
        </div>
    )
}

OrbitalType.defaultProps = {
    text: "ORBITAL",
    font: { fontSize: 150, variant: "Semibold" },
    textColor: "#eef2f6",
    accent: "#4ee0d4",
    background: "#0a0c10",
    density: 4,
    particleSize: 1.4,
    particleStyle: "dots",
    orbitRadius: 60,
    orbitForce: 0.16,
    followForce: 0.012,
    friction: 0.95,
    velocity: 1.8,
    orbitSpeed: 1,
    distortion: 60,
    returnSpeed: 0.18,
    glow: 30,
    trail: 30,
    showField: false,
    auto: false,
    disableOnMobile: true,
}

addPropertyControls(OrbitalType, {
    text: { type: ControlType.String, title: "Text", defaultValue: "ORBITAL" },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: { fontSize: 150, variant: "Semibold" },
        defaultFontType: "sans-serif",
        controls: "extended",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#eef2f6",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#4ee0d4",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0c10",
    },
    density: {
        type: ControlType.Number,
        title: "Density",
        min: 2,
        max: 10,
        step: 1,
        defaultValue: 4,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        min: 0.5,
        max: 5,
        step: 0.1,
        defaultValue: 1.4,
    },
    particleStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["dots", "lines", "wire"],
        optionTitles: ["Dots", "Lines", "Wire"],
        defaultValue: "dots",
    },
    orbitRadius: {
        type: ControlType.Number,
        title: "Orbit Radius",
        min: 10,
        max: 240,
        step: 1,
        defaultValue: 60,
    },
    orbitForce: {
        type: ControlType.Number,
        title: "Orbit Force",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.16,
    },
    followForce: {
        type: ControlType.Number,
        title: "Follow Force",
        min: 0,
        max: 0.05,
        step: 0.001,
        defaultValue: 0.012,
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        min: 0.8,
        max: 0.99,
        step: 0.01,
        defaultValue: 0.95,
    },
    velocity: {
        type: ControlType.Number,
        title: "Velocity",
        min: 0,
        max: 4,
        step: 0.1,
        defaultValue: 1.8,
    },
    orbitSpeed: {
        type: ControlType.Number,
        title: "Orbit Speed",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    distortion: {
        type: ControlType.Number,
        title: "Distortion",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 60,
    },
    returnSpeed: {
        type: ControlType.Number,
        title: "Return Speed",
        min: 0.01,
        max: 0.4,
        step: 0.01,
        defaultValue: 0.18,
    },
    glow: {
        type: ControlType.Number,
        title: "Glow",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 30,
    },
    trail: {
        type: ControlType.Number,
        title: "Trail",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 30,
    },
    showField: {
        type: ControlType.Boolean,
        title: "Field Ring",
        defaultValue: false,
    },
    auto: {
        type: ControlType.Boolean,
        title: "Auto Animate",
        defaultValue: false,
    },
    disableOnMobile: {
        type: ControlType.Boolean,
        title: "Disable Mobile",
        defaultValue: true,
    },
})
