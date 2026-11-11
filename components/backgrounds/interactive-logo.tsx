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


// User request: Remove inner rotating texture from the cursor material circle, keep hidden native cursor/full-area pointer capture, and update logo idle/interaction motion to layered multi-line flow waves while preserving LogoParticleField export and existing controls.

type Particle = {
    x: number
    y: number
    ox: number
    oy: number
    r: number
    g: number
    b: number
    a: number
}

type TrailPoint = {
    x: number
    y: number
    t: number
    vx: number
    vy: number
}

interface MyComponentProps {
    logo: any
    logoSize: number
    backgroundColor: string
    autoColors: boolean
    primaryColor: string
    secondaryColor: string
    accentColor: string
    particleSpacing: number
    particleRadius: number
    backgroundParticleOpacity: number
    idleAnimationStrength: number
    idleAnimationSpeed: number
    cursorInfluenceRadius: number
    trailLifetime: number
    springAttraction: number
    springDamping: number
    interactionBrightness: number
    glowIntensity: number
    inactivityFadeDelay: number
    cellStyle: "Dots" | "Software Symbols"
    symbolSet: string
    symbolFontSizeMultiplier: number
    cursorStyle: "Liquid Trail" | "Simple Chase"
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LogoParticleField(props: MyComponentProps) {
    const {
        logo,
        logoSize,
        backgroundColor,
        autoColors,
        primaryColor,
        secondaryColor,
        accentColor,
        particleSpacing,
        particleRadius,
        backgroundParticleOpacity,
        idleAnimationStrength,
        idleAnimationSpeed,
        cursorInfluenceRadius,
        trailLifetime,
        springAttraction,
        springDamping,
        interactionBrightness,
        glowIntensity,
        inactivityFadeDelay,
        cellStyle,
        symbolSet,
        symbolFontSizeMultiplier,
        cursorStyle,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const rafRef = React.useRef<number>(0)
    const resizeObserverRef = React.useRef<ResizeObserver | null>(null)
    const imageRef = React.useRef<HTMLImageElement | null>(null)
    const particlesRef = React.useRef<Particle[]>([])
    const bgParticlesRef = React.useRef<Array<{ x: number; y: number; c: string; r: number }>>([])
    const dprRef = React.useRef(1)
    const sizeRef = React.useRef({ w: 800, h: 500 })
    const visRef = React.useRef(true)
    const timeRef = React.useRef(0)
    const lastFrameRef = React.useRef(0)
    const pointerInsideRef = React.useRef(false)
    const pointerRef = React.useRef({ x: 0, y: 0, px: 0, py: 0, t: 0, speed: 0, vx: 0, vy: 0 })
    const followerRef = React.useRef({ x: 0, y: 0, vx: 0, vy: 0, influence: 0 })
    const trailRef = React.useRef<TrailPoint[]>([])
    const lastMoveRef = React.useRef(0)
    const paletteRef = React.useRef([primaryColor, secondaryColor, accentColor])
    const processingKeyRef = React.useRef("")
    const isStatic = useIsStaticRenderer()
    const symbolChars = React.useMemo(() => {
        const chars = Array.from((symbolSet || "<>/{}[]01;").trim())
        return chars.length > 0 ? chars : Array.from("<>/{}[]01;")
    }, [symbolSet])

    const resolveLogoSrc = React.useCallback((value: any): string | null => {
        if (!value) return null
        if (typeof value === "string") return value
        if (typeof value === "object") {
            if (typeof value.src === "string") return value.src
        }
        return null
    }, [])

    const hexToRgb = React.useCallback((hex: string) => {
        const safe = hex.replace("#", "")
        const n = safe.length === 3 ? safe.split("").map((c) => c + c).join("") : safe
        const num = Number.parseInt(n, 16)
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
    }, [])

    const colorWithAlpha = React.useCallback(
        (color: string, alpha: number) => {
            if (color.startsWith("#")) {
                const rgb = hexToRgb(color)
                return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
            }
            if (color.startsWith("rgb(")) {
                return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`)
            }
            return color
        },
        [hexToRgb]
    )

    const resizeCanvas = React.useCallback(() => {
        if (!containerRef.current || !canvasRef.current || typeof window === "undefined") return
        const rect = containerRef.current.getBoundingClientRect()
        const w = Math.max(1, rect.width)
        const h = Math.max(1, rect.height)
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        dprRef.current = dpr
        sizeRef.current = { w, h }
        canvasRef.current.width = Math.floor(w * dpr)
        canvasRef.current.height = Math.floor(h * dpr)
        canvasRef.current.style.width = `${w}px`
        canvasRef.current.style.height = `${h}px`
    }, [])

    const generateFallbackImage = React.useCallback(() => {
        if (typeof document === "undefined") return null
        const c = document.createElement("canvas")
        c.width = 380
        c.height = 240
        const ctx = c.getContext("2d")
        if (!ctx) return null
        const g = ctx.createLinearGradient(20, 40, 360, 200)
        g.addColorStop(0, "#56CCF2")
        g.addColorStop(0.5, "#7B61FF")
        g.addColorStop(1, "#FF7A59")
        ctx.fillStyle = "rgba(0,0,0,0)"
        ctx.fillRect(0, 0, c.width, c.height)
        ctx.save()
        ctx.translate(c.width / 2, c.height / 2)
        ctx.beginPath()
        ctx.arc(0, 0, 82, 0, Math.PI * 2)
        ctx.arc(0, 0, 42, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.fillStyle = g
        ctx.fill()
        ctx.restore()
        return c
    }, [])

    const processLogo = React.useCallback(() => {
        const source = imageRef.current || generateFallbackImage()
        if (!source || typeof document === "undefined") return
        const { w, h } = sizeRef.current
        const key = `${w}x${h}:${particleSpacing}:${particleRadius}:${logoSize}:${source.width}x${source.height}`
        if (processingKeyRef.current === key && particlesRef.current.length > 0) return
        processingKeyRef.current = key

        const off = document.createElement("canvas")
        off.width = Math.max(1, Math.floor(w))
        off.height = Math.max(1, Math.floor(h))
        const octx = off.getContext("2d", { willReadFrequently: true })
        if (!octx) return
        octx.clearRect(0, 0, off.width, off.height)

        const fitW = w * logoSize
        const ratio = source.width / Math.max(1, source.height)
        const drawW = fitW
        const drawH = drawW / Math.max(0.0001, ratio)
        const scale = drawH > h * logoSize ? (h * logoSize) / drawH : 1
        const finalW = drawW * scale
        const finalH = drawH * scale
        const dx = (w - finalW) * 0.5
        const dy = (h - finalH) * 0.5
        octx.drawImage(source, dx, dy, finalW, finalH)

        const data = octx.getImageData(0, 0, off.width, off.height).data
        const p: Particle[] = []
        const spacing = Math.max(2, Math.floor(particleSpacing))
        const alphaThreshold = 8
        for (let y = 0; y < off.height; y += spacing) {
            for (let x = 0; x < off.width; x += spacing) {
                const idx = (y * off.width + x) * 4
                const a = data[idx + 3]
                if (a <= alphaThreshold) continue
                p.push({
                    x,
                    y,
                    ox: x,
                    oy: y,
                    r: data[idx],
                    g: data[idx + 1],
                    b: data[idx + 2],
                    a: a / 255,
                })
            }
        }
        if (p.length > 16000) p.length = 16000
        particlesRef.current = p

        if (autoColors && p.length > 40) {
            const sample = [p[5], p[Math.floor(p.length * 0.35)], p[Math.floor(p.length * 0.75)]].filter(Boolean)
            const extracted = sample.map((s) => `rgb(${s.r}, ${s.g}, ${s.b})`)
            paletteRef.current = [extracted[0] || primaryColor, extracted[1] || secondaryColor, extracted[2] || accentColor]
        } else {
            paletteRef.current = [primaryColor, secondaryColor, accentColor]
        }

        const muted = paletteRef.current.map((c) => {
            if (c.startsWith("#")) {
                const rgb = hexToRgb(c)
                return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${backgroundParticleOpacity})`
            }
            return c.replace("rgb(", "rgba(").replace(")", `, ${backgroundParticleOpacity})`)
        })
        const bg: Array<{ x: number; y: number; c: string; r: number }> = []
        const step = 20
        for (let yy = 10; yy < h; yy += step) {
            for (let xx = 10; xx < w; xx += step) {
                const i = (xx + yy) % 3
                bg.push({ x: xx, y: yy, c: muted[i], r: 0.8 + ((xx * yy) % 1000) / 1000 })
            }
        }
        bgParticlesRef.current = bg
    }, [accentColor, autoColors, backgroundParticleOpacity, generateFallbackImage, hexToRgb, logoSize, particleRadius, particleSpacing, primaryColor, secondaryColor])

    const draw = React.useCallback(
        (ts: number) => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext("2d")
            if (!ctx) return
            const now = ts || 0
            const dt = Math.min(0.033, Math.max(0.001, (now - (lastFrameRef.current || now)) / 1000))
            lastFrameRef.current = now
            timeRef.current += dt
            if (!visRef.current && !isStatic) return

            const dpr = dprRef.current
            const { w, h } = sizeRef.current
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.clearRect(0, 0, w, h)
            ctx.fillStyle = backgroundColor
            ctx.fillRect(0, 0, w, h)

            const ptr = pointerRef.current
            const follower = followerRef.current
            const attraction = springAttraction
            follower.vx += (ptr.x - follower.x) * attraction
            follower.vy += (ptr.y - follower.y) * attraction
            follower.vx *= springDamping
            follower.vy *= springDamping
            follower.x += follower.vx
            follower.y += follower.vy

            const inactiveSeconds = now / 1000 - lastMoveRef.current
            const activityTarget = pointerInsideRef.current || inactiveSeconds < inactivityFadeDelay ? 1 : 0
            follower.influence += (activityTarget - follower.influence) * 0.04
            const influence = follower.influence
            const t = timeRef.current * idleAnimationSpeed
            const stretch = Math.min(1.5, ptr.speed / 800)
            const dirX = ptr.vx || 1
            const dirY = ptr.vy || 0
            const len = Math.hypot(dirX, dirY) || 1
            const ndx = dirX / len
            const ndy = dirY / len
            const simpleChase = cursorStyle === "Simple Chase"
            const ir = cursorInfluenceRadius
            const fieldRadius = 90
            const fieldReach = Math.max(ir, fieldRadius)

            for (const b of bgParticlesRef.current) {
                const bdx = follower.x - b.x
                const bdy = follower.y - b.y
                const bDist = Math.hypot(bdx, bdy)
                const bn = Math.max(0, 1 - bDist / Math.max(1, fieldReach * 1.15)) * influence
                const bx = b.x + (bdx / Math.max(1, bDist)) * bn * (1.8 + interactionBrightness * 2.4)
                const by = b.y + (bdy / Math.max(1, bDist)) * bn * (1.2 + interactionBrightness * 1.6)
                ctx.beginPath()
                ctx.fillStyle = b.c
                ctx.arc(bx, by, b.r * (1 + bn * 1.1), 0, Math.PI * 2)
                ctx.fill()
            }

            const pal = paletteRef.current
            if (influence > 0.01) {
                ctx.save()
                ctx.beginPath()
                ctx.arc(follower.x, follower.y, fieldRadius, 0, Math.PI * 2)
                ctx.clip()
                const fieldGradient = ctx.createRadialGradient(
                    follower.x,
                    follower.y,
                    fieldRadius * 0.2,
                    follower.x,
                    follower.y,
                    fieldRadius
                )
                fieldGradient.addColorStop(0, colorWithAlpha(pal[1], 0.07 * influence))
                fieldGradient.addColorStop(0.55, colorWithAlpha(pal[0], 0.035 * influence))
                fieldGradient.addColorStop(1, colorWithAlpha(pal[2], 0.015 * influence))
                ctx.fillStyle = fieldGradient
                ctx.fillRect(follower.x - fieldRadius, follower.y - fieldRadius, fieldRadius * 2, fieldRadius * 2)
                ctx.restore()
            }

            for (let i = 0; i < particlesRef.current.length; i++) {
                const p = particlesRef.current[i]
                const flowBand1 = Math.sin(p.ox * 0.023 - p.oy * 0.011 + t * 1.35)
                const flowBand2 = Math.sin(p.ox * -0.014 + p.oy * 0.027 - t * 1.05)
                const flowBand3 = Math.cos(p.ox * 0.008 + p.oy * 0.02 + t * 1.7)
                const flowMix = flowBand1 * 0.5 + flowBand2 * 0.33 + flowBand3 * 0.27
                const flowX = idleAnimationStrength * flowMix
                const flowY = idleAnimationStrength * (flowBand1 * -0.24 + flowBand2 * 0.58 + flowBand3 * 0.3)
                let x = p.ox + flowX
                let y = p.oy + flowY
                const dx = follower.x - x
                const dy = follower.y - y
                const dist = Math.hypot(dx, dy)
                const n = Math.max(0, 1 - dist / fieldReach) * influence
                const coreN = Math.max(0, 1 - dist / Math.max(36, fieldReach * 0.5)) * influence
                if (n > 0) {
                    const pull = (n * (simpleChase ? 5 : 8.8) + coreN * 5.2) * (1 + interactionBrightness * 0.8)
                    x += (dx / Math.max(1, dist)) * pull
                    y += (dy / Math.max(1, dist)) * pull
                }

                const b = 0.92 + 0.14 * Math.sin(t * 1.5 + p.ox * 0.04)
                const rr = Math.min(255, p.r * b)
                const gg = Math.min(255, p.g * b)
                const bb = Math.min(255, p.b * b)
                const rad = particleRadius * (1 + 0.15 * Math.sin(t * 2 + p.oy * 0.03) + n * 0.95 + coreN * 0.35)
                ctx.fillStyle = `rgba(${rr}, ${gg}, ${bb}, ${Math.min(1, p.a * (0.8 + n * 0.55 + coreN * 0.2))})`
                if (cellStyle === "Software Symbols") {
                    const phase = Math.floor(t * 0.22 + i * 0.002)
                    const hash = ((p.ox * 73856093) ^ (p.oy * 19349663) ^ phase) >>> 0
                    const glyph = symbolChars[hash % symbolChars.length]
                    const fontSize = Math.max(
                        6,
                        (particleSpacing * symbolFontSizeMultiplier + n * particleSpacing * 0.8 + coreN * particleSpacing * 0.45) *
                            (0.85 + p.a * 0.35)
                    )
                    ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
                    ctx.textAlign = "center"
                    ctx.textBaseline = "middle"
                    ctx.fillText(glyph, x, y)
                } else {
                    ctx.beginPath()
                    ctx.arc(x, y, Math.max(0.2, rad), 0, Math.PI * 2)
                    ctx.fill()
                }
            }
            ctx.shadowBlur = 0

            const trailNow = now / 1000
            trailRef.current = trailRef.current.filter((tp) => trailNow - tp.t <= trailLifetime)
            const fieldScale = Math.max(1, cursorInfluenceRadius / 120)
            if (influence > 0.01) {
                const followerSize = (simpleChase ? 9 + cursorInfluenceRadius * 0.08 : 14 + cursorInfluenceRadius * 0.2) * influence
                const angle = Math.atan2(ndy, ndx)
                const followerParticles = simpleChase
                    ? Math.min(20, Math.floor(10 + glowIntensity * 3 + fieldScale * 3))
                    : Math.min(40, Math.floor(16 + glowIntensity * 8 + fieldScale * 8))
                for (let i = 0; i < followerParticles; i++) {
                    const pr = (i / Math.max(1, followerParticles - 1)) * Math.PI * 2
                    const ring = 0.25 + ((i * 17) % 100) / 100
                    const ex = Math.cos(pr) * followerSize * (0.35 + ring) * (1 + (simpleChase ? 0.15 : stretch * 0.8))
                    const ey = Math.sin(pr) * followerSize * (0.35 + ring) * (1 - (simpleChase ? 0.08 : stretch * 0.35))
                    const rx = ex * Math.cos(angle) - ey * Math.sin(angle)
                    const ry = ex * Math.sin(angle) + ey * Math.cos(angle)
                    const alpha = (simpleChase ? 0.06 : 0.05 + 0.18 * (1 - ring)) * influence
                    const c = i % 3 === 0 ? pal[0] : i % 3 === 1 ? pal[1] : pal[2]
                    ctx.fillStyle = c.startsWith("#")
                        ? (() => {
                              const rgb = hexToRgb(c)
                              return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
                          })()
                        : c.replace("rgb(", "rgba(").replace(")", `, ${alpha})`)
                    ctx.beginPath()
                    ctx.arc(
                        follower.x + rx,
                        follower.y + ry,
                        1 + (simpleChase ? 1.8 * (1 - ring) : 3.8 * (1 - ring) + glowIntensity * 0.5) * influence,
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()
                }
            }
            if (!simpleChase) {
                for (let i = 0; i < trailRef.current.length; i++) {
                    const tp = trailRef.current[i]
                    const age = trailNow - tp.t
                    const k = Math.max(0, 1 - age / trailLifetime) * influence
                    if (k <= 0.001) continue
                    const elongate = 1 + stretch * k * 1.8
                    const base = (2 + 11 * k * fieldScale) * (1 + glowIntensity * 0.16)
                    const c = i % 3 === 0 ? pal[0] : i % 3 === 1 ? pal[1] : pal[2]
                    const angle = Math.atan2(ndy, ndx)
                    ctx.save()
                    ctx.translate(tp.x, tp.y)
                    ctx.rotate(angle)
                    ctx.fillStyle = c.startsWith("#")
                        ? (() => {
                              const rgb = hexToRgb(c)
                              return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.4 * k})`
                          })()
                        : c.replace("rgb(", "rgba(").replace(")", `, ${0.4 * k})`)
                    ctx.beginPath()
                    ctx.ellipse(0, 0, base * elongate, base * 0.75, 0, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                }
            }
            ctx.shadowBlur = 0
        },
        [
            backgroundColor,
            cellStyle,
            cursorStyle,
            cursorInfluenceRadius,
            glowIntensity,
            hexToRgb,
            idleAnimationSpeed,
            idleAnimationStrength,
            inactivityFadeDelay,
            interactionBrightness,
            isStatic,
            particleRadius,
            particleSpacing,
            springAttraction,
            springDamping,
            symbolChars,
            symbolFontSizeMultiplier,
            trailLifetime,
            colorWithAlpha,
        ]
    )

    const animate = React.useCallback(
        (ts: number) => {
            draw(ts)
            if (!isStatic) {
                rafRef.current = requestAnimationFrame(animate)
            }
        },
        [draw, isStatic]
    )

    React.useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return
        const onVisibility = () => {
            visRef.current = !document.hidden
        }
        document.addEventListener("visibilitychange", onVisibility)
        onVisibility()
        return () => document.removeEventListener("visibilitychange", onVisibility)
    }, [])

    React.useEffect(() => {
        resizeCanvas()
        processLogo()
        if (typeof window !== "undefined" && containerRef.current) {
            resizeObserverRef.current = new ResizeObserver(() => {
                resizeCanvas()
                processLogo()
                draw(performance.now())
            })
            resizeObserverRef.current.observe(containerRef.current)
        }
        draw(0)
        if (!isStatic && typeof window !== "undefined") {
            rafRef.current = requestAnimationFrame(animate)
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            if (resizeObserverRef.current) resizeObserverRef.current.disconnect()
        }
    }, [animate, draw, isStatic, processLogo, resizeCanvas])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const src = resolveLogoSrc(logo)
        processingKeyRef.current = ""
        if (!src) {
            imageRef.current = null
            processLogo()
            return
        }
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            imageRef.current = img
            processLogo()
        }
        img.onerror = () => {
            imageRef.current = null
            processLogo()
        }
        img.src = src
        return () => {
            imageRef.current = null
        }
    }, [logo, processLogo, resolveLogoSrc])

    const onPointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const now = typeof performance !== "undefined" ? performance.now() : Date.now()
        const p = pointerRef.current
        const dt = Math.max(0.001, (now - (p.t || now)) / 1000)
        p.vx = (x - p.px) / dt
        p.vy = (y - p.py) / dt
        p.speed = Math.hypot(p.vx, p.vy)
        p.px = x
        p.py = y
        p.x = x
        p.y = y
        p.t = now
        pointerInsideRef.current = true
        lastMoveRef.current = now / 1000
        trailRef.current.push({ x, y, t: now / 1000, vx: p.vx, vy: p.vy })
        if (trailRef.current.length > 80) trailRef.current.shift()
    }, [])

    const onPointerLeave = React.useCallback(() => {
        pointerInsideRef.current = false
    }, [])

    return (
        <div
            ref={containerRef}
            onPointerMove={onPointerMove}
            onPointerEnter={onPointerMove}
            onPointerLeave={onPointerLeave}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: "none",
                touchAction: "none",
            }}
        >
            <canvas ref={canvasRef} style={{ cursor: "none" }} />
        </div>
    )
}

addPropertyControls(LogoParticleField, {
    logo: { type: ControlType.ResponsiveImage, title: "Logo" },
    logoSize: { type: ControlType.Number, title: "Logo Size", defaultValue: 0.62, min: 0.2, max: 1.5, step: 0.01 },
    backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#0B0B12" },
    autoColors: { type: ControlType.Boolean, title: "Auto Colors", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    primaryColor: { type: ControlType.Color, title: "Primary", defaultValue: "#56CCF2" },
    secondaryColor: { type: ControlType.Color, title: "Secondary", defaultValue: "#7B61FF" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#FF7A59" },
    particleSpacing: { type: ControlType.Number, title: "Spacing", defaultValue: 4, min: 2, max: 16, step: 1 },
    particleRadius: { type: ControlType.Number, title: "Particle Radius", defaultValue: 1.6, min: 0.6, max: 5, step: 0.1 },
    backgroundParticleOpacity: { type: ControlType.Number, title: "BG Opacity", defaultValue: 0.12, min: 0.01, max: 0.5, step: 0.01 },
    idleAnimationStrength: { type: ControlType.Number, title: "Idle Strength", defaultValue: 3.2, min: 0, max: 12, step: 0.1 },
    idleAnimationSpeed: { type: ControlType.Number, title: "Idle Speed", defaultValue: 1, min: 0.1, max: 4, step: 0.1 },
    cursorInfluenceRadius: { type: ControlType.Number, title: "Influence Radius", defaultValue: 120, min: 40, max: 260, step: 1 },
    trailLifetime: { type: ControlType.Number, title: "Trail Lifetime", defaultValue: 1.5, min: 0.3, max: 4, step: 0.1 },
    springAttraction: { type: ControlType.Number, title: "Spring Attraction", defaultValue: 0.1, min: 0.02, max: 0.25, step: 0.01 },
    springDamping: { type: ControlType.Number, title: "Spring Damping", defaultValue: 0.86, min: 0.5, max: 0.98, step: 0.01 },
    interactionBrightness: { type: ControlType.Number, title: "Brightness", defaultValue: 0.6, min: 0, max: 2, step: 0.05 },
    glowIntensity: { type: ControlType.Number, title: "Glow", defaultValue: 1.1, min: 0, max: 4, step: 0.1 },
    inactivityFadeDelay: { type: ControlType.Number, title: "Inactivity Delay", defaultValue: 1.2, min: 0.2, max: 6, step: 0.1 },
    cursorStyle: {
        type: ControlType.Enum,
        title: "Cursor Style",
        options: ["Liquid Trail", "Simple Chase"],
        optionTitles: ["Liquid Trail", "Simple Chase"],
        defaultValue: "Liquid Trail",
    },
    cellStyle: {
        type: ControlType.Enum,
        title: "Cell Style",
        options: ["Dots", "Software Symbols"],
        optionTitles: ["Dots", "Software Symbols"],
        defaultValue: "Dots",
    },
    symbolSet: {
        type: ControlType.String,
        title: "Symbol Set",
        defaultValue: "<>/{}[]01;",
        hidden(props) {
            return props.cellStyle !== "Software Symbols"
        },
    },
    symbolFontSizeMultiplier: {
        type: ControlType.Number,
        title: "Symbol Size",
        defaultValue: 1.35,
        min: 0.5,
        max: 3,
        step: 0.05,
        hidden(props) {
            return props.cellStyle !== "Software Symbols"
        },
    },
})