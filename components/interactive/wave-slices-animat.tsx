import * as React from "react"
import { useEffect, useRef } from "react"
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
 * Wave Slices — a ribbon of glowing, sliced discs that flows along a
 * travelling sine wave. Rendered on a single <canvas> for smooth 60fps
 * motion with zero dependencies beyond Framer.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 680
 */

type Direction = "left" | "right"

interface Props {
    // Colors
    background: string
    glowColor: string
    glowIntensity: number
    glowX: number
    glowY: number
    glowSize: number
    highlightColor: string
    midColor: string
    baseColor: string
    shadowColor: string
    sheenColor: string
    sheenAmount: number

    // Animation
    playing: boolean
    speed: number
    twistSpeed: number
    direction: Direction
    transition: number
    previewOnCanvas: boolean
    respectReducedMotion: boolean

    // Shape
    slices: number
    amplitude: number
    waves: number
    sliceHeight: number
    thickness: number
    perspective: number
    tilt: number
    lean: number
    twist: number
    verticalOffset: number

    // Lighting
    edgeShadow: number
    rimLight: number
    coreShade: number
    opacity: number

    // Layout
    radius: number

    style?: React.CSSProperties
}

type RGB = [number, number, number, number]

const TAU = Math.PI * 2

/* ------------------------------------------------------------------ */
/* Color helpers — resolve any Framer color (hex, rgb, hsl, color       */
/* style tokens like var(--token, …)) into numeric RGBA once, so the    */
/* render loop never parses strings.                                    */
/* ------------------------------------------------------------------ */

function parseRgbString(value: string): RGB | null {
    const m = value.match(/rgba?\(([^)]+)\)/i)
    if (!m) return null
    const parts = m[1]
        .split(/[\s,/]+/)
        .filter(Boolean)
        .map(parseFloat)
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1]
}

function parseHex(value: string): RGB | null {
    const m = value.trim().match(/^#([0-9a-f]{3,8})$/i)
    if (!m) return null
    let h = m[1]
    if (h.length === 3 || h.length === 4)
        h = h
            .split("")
            .map((c) => c + c)
            .join("")
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16)
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1]
}

function resolveColor(
    value: string,
    probe: HTMLElement | null,
    fallback: RGB
): RGB {
    if (!value) return fallback
    if (probe) {
        probe.style.color = ""
        probe.style.color = value
        if (probe.style.color) {
            const computed = getComputedStyle(probe).color
            const parsed = parseRgbString(computed)
            if (parsed) return parsed
        }
    }
    // Fallback for tokens: var(--token, #hex) → use the fallback value
    const varMatch = value.match(/var\([^,]+,\s*(.+)\)\s*$/)
    const raw = varMatch ? varMatch[1] : value
    return parseHex(raw) || parseRgbString(raw) || fallback
}

const mix = (a: RGB, b: RGB, t: number): RGB => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    a[3] + (b[3] - a[3]) * t,
]

const css = (c: RGB, alpha = 1) =>
    `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, c[3] * alpha))})`

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

/* ------------------------------------------------------------------ */
/* Renderer                                                            */
/* ------------------------------------------------------------------ */

interface Palette {
    bg: RGB
    glow: RGB
    hi: RGB
    mid: RGB
    base: RGB
    shadow: RGB
    sheen: RGB
}

function drawFrame(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    phase: number,
    phase2: number,
    twistPhase: number,
    p: Props,
    pal: Palette
) {
    // Background
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = css(pal.bg)
    ctx.fillRect(0, 0, w, h)

    // Ambient glow
    if (p.glowIntensity > 0) {
        const gx = (p.glowX / 100) * w
        const gy = (p.glowY / 100) * h
        const gr = Math.max(w, h) * (p.glowSize / 100)
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr)
        const k = p.glowIntensity / 100
        g.addColorStop(0, css(pal.glow, 0.95 * k))
        g.addColorStop(0.25, css(pal.glow, 0.45 * k))
        g.addColorStop(0.6, css(pal.glow, 0.1 * k))
        g.addColorStop(1, css(pal.glow, 0))
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
    }

    // Fewer slices on narrow screens keeps them legible and cheap on phones
    const n = Math.max(
        8,
        Math.min(Math.round(p.slices), Math.round(Math.max(24, w / 7)))
    )
    const span = w * 1.14
    const startX = -w * 0.06
    const unit = Math.min(h, w * 0.75)
    const baseSpacing = span / (n - 1)
    const amp = (p.amplitude / 100) * h * 0.3
    const cy = h * 0.5 + (p.verticalOffset / 100) * h
    const freq = p.waves * TAU
    const persp = p.perspective / 100
    const tiltRad = (p.tilt * Math.PI) / 180
    const leanRad = (p.lean * Math.PI) / 180
    const twistAmt = p.twist / 100
    const edge = p.edgeShadow / 100
    const rim = p.rimLight / 100
    const core = p.coreShade / 100
    const sheenAmt = p.sheenAmount / 100

    // Perspective: slices crowd together and shrink in the distance (left/middle)
    // and spread out and grow toward the viewer (right).
    const pe = persp * 0.65
    const xAt = (t: number) => startX + span * (t * (1 - pe) + t * t * pe)
    // u = horizontal screen position (0 → 1) of a slice. Far slices (middle)
    // are smallest, slices grow toward both edges and most toward the right.
    const scaleAt = (u: number) => {
        const v = 1 - u
        return 1 + persp * (0.25 + 2.9 * u * u * u + 1.5 * v * v * v * v - 1)
    }

    // Second harmonic gives the ribbon an organic, non-mechanical sway.
    // Both phases are continuous, so the motion never repeats with a jump.
    const pathY = (t: number) =>
        cy -
        amp * 0.6 * persp * (t - 0.5) +
        amp * Math.sin(freq * t - phase) +
        amp * 0.3 * Math.sin(freq * 0.53 * t + phase2 + 1.3)

    ctx.globalAlpha = clamp01(p.opacity / 100)

    for (let i = 0; i < n; i++) {
        const t = i / (n - 1)
        const x = xAt(t)
        const y = pathY(t)
        const dt = 0.5 / n
        const slope = (pathY(t + dt) - y) / (xAt(t + dt) - x || 1)
        const u = clamp01((x - startX) / span)
        const scale = scaleAt(u)

        const ry = (p.sliceHeight / 100) * unit * 0.5 * Math.max(0.15, scale)
        // Twist: each slice rotates around the ribbon axis, appearing thinner/wider
        const spin = Math.cos(twistPhase + t * TAU * 1.5)
        const rx = Math.max(
            0.6,
            baseSpacing *
                (p.thickness / 100) *
                (0.35 + 0.45 * scale) *
                (1 - twistAmt * 0.6 * (1 - Math.abs(spin)))
        )

        // Lighting: nearer slices and slices on rising slopes catch more light
        const facing = clamp01(0.4 - slope * 0.5 + spin * 0.15 + u * 0.45)
        const lit = 0.35 + facing * 0.65

        // Far slices are deeper red with a desaturated sheen on their tips and
        // rims; near slices glow warm. The dark core band sits mid-ribbon.
        const sheenK = sheenAmt * clamp01(1.35 - u * 1.6)
        const tipCol = mix(pal.hi, pal.sheen, sheenK)
        const baseCol = mix(pal.base, pal.shadow, 0.3 * (1 - u))
        const warmCol = mix(
            baseCol,
            pal.mid,
            clamp01(lit * (0.2 + u * u * 1.1))
        )
        const coreCol = mix(
            baseCol,
            pal.shadow,
            core * clamp01(1 - Math.abs(u - 0.42) / 0.42)
        )

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(
            Math.atan(slope) * 0.3 + tiltRad - leanRad * Math.pow(1 - u, 1.5)
        )

        const body = ctx.createLinearGradient(0, -ry, 0, ry)
        body.addColorStop(0, css(mix(pal.shadow, tipCol, 0.75)))
        body.addColorStop(0.07, css(mix(warmCol, tipCol, 0.35 + lit * 0.5)))
        body.addColorStop(0.24, css(warmCol))
        body.addColorStop(
            0.5,
            css(mix(coreCol, pal.mid, clamp01(u - 0.5) * lit * 2.2))
        )
        body.addColorStop(0.74, css(mix(warmCol, pal.hi, lit * u * u * 0.55)))
        body.addColorStop(0.93, css(mix(baseCol, tipCol, 0.3 + lit * 0.3)))
        body.addColorStop(1, css(mix(pal.shadow, tipCol, 0.5)))
        ctx.beginPath()
        ctx.ellipse(0, 0, rx, ry, 0, 0, TAU)
        ctx.fillStyle = body
        ctx.fill()

        // Ridge shading across the thin axis. The next (nearer) slice covers
        // this slice's far side, so the rim highlight sits inside the visible
        // fraction and the back edge falls into shadow → crisp layered ridges.
        if (edge > 0 || rim > 0) {
            const localSpacing =
                (xAt(t + dt) - xAt(t - dt)) / (2 * dt * (n - 1))
            const vis =
                i === n - 1
                    ? 1
                    : Math.max(0.3, Math.min(0.95, localSpacing / (2 * rx)))
            const side = ctx.createLinearGradient(-rx, 0, rx, 0)
            side.addColorStop(0, css(pal.shadow, 0.95 * edge))
            side.addColorStop(vis * 0.22, css(pal.shadow, 0.3 * edge))
            side.addColorStop(vis * 0.42, css(pal.shadow, 0))
            side.addColorStop(vis * 0.62, css(tipCol, 0))
            side.addColorStop(
                vis * 0.9,
                css(tipCol, 0.75 * rim * (0.35 + lit * 0.65))
            )
            side.addColorStop(
                Math.min(1, vis * 0.9 + 0.08),
                css(pal.shadow, 0.4 * edge)
            )
            side.addColorStop(1, css(pal.shadow, 0.6 * edge))
            ctx.fillStyle = side
            ctx.fill()
        }

        ctx.restore()
    }

    ctx.globalAlpha = 1
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function WaveSlices(props: Props) {
    const p = { ...defaults, ...props }
    const isStatic = useIsStaticRenderer()

    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const probeRef = useRef<HTMLSpanElement>(null)

    // Live props/palette read by the loop without restarting it
    const propsRef = useRef<Props>(p)
    propsRef.current = p
    const paletteRef = useRef<Palette | null>(null)

    // Continuous animation state — phases accumulate and are wrapped
    // mod 2π, so the motion never resets or jumps.
    const stateRef = useRef({
        phase: 0.8,
        phase2: 0.4,
        twist: 0,
        velocity: 0, // eased speed multiplier (0 → 1)
        fade: 0,
        size: { w: 0, h: 0, dpr: 1 },
        visible: true,
        dirty: true,
    })

    // Resolve colours whenever any colour prop changes
    const colorKey = [
        p.background,
        p.glowColor,
        p.highlightColor,
        p.midColor,
        p.baseColor,
        p.shadowColor,
        p.sheenColor,
    ].join("|")

    useEffect(() => {
        const probe = probeRef.current
        paletteRef.current = {
            bg: resolveColor(p.background, probe, [10, 3, 4, 1]),
            glow: resolveColor(p.glowColor, probe, [214, 30, 12, 1]),
            hi: resolveColor(p.highlightColor, probe, [255, 214, 196, 1]),
            mid: resolveColor(p.midColor, probe, [255, 122, 82, 1]),
            base: resolveColor(p.baseColor, probe, [224, 40, 28, 1]),
            shadow: resolveColor(p.shadowColor, probe, [58, 6, 8, 1]),
            sheen: resolveColor(p.sheenColor, probe, [196, 170, 172, 1]),
        }
        stateRef.current.dirty = true
    }, [colorKey])

    const reducedMotion = usePrefersReducedMotion()
    const shouldAnimate =
        p.playing &&
        (!isStatic || p.previewOnCanvas) &&
        !(p.respectReducedMotion && reducedMotion)
    const animateRef = useRef(shouldAnimate)
    animateRef.current = shouldAnimate

    // Any prop change → redraw (covers paused/static states)
    stateRef.current.dirty = true

    useEffect(() => {
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const s = stateRef.current

        const resize = () => {
            const rect = wrap.getBoundingClientRect()
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            const w = Math.max(1, Math.round(rect.width))
            const h = Math.max(1, Math.round(rect.height))
            if (w === s.size.w && h === s.size.h && dpr === s.size.dpr) return
            s.size = { w, h, dpr }
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            s.dirty = true
        }
        resize()

        const ro = new ResizeObserver(resize)
        ro.observe(wrap)

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(([entry]) => {
                s.visible = entry.isIntersecting
            })
            io.observe(wrap)
        }

        // Static render: draw one finished frame, no fade or motion.
        const still = isStatic && !propsRef.current.previewOnCanvas
        if (still || propsRef.current.transition <= 0) s.fade = 1
        canvas.style.opacity = String(s.fade)

        // Paint the first frame synchronously so static exports and thumbnails
        // never capture an empty canvas.
        if (paletteRef.current) {
            ctx.setTransform(s.size.dpr, 0, 0, s.size.dpr, 0, 0)
            drawFrame(
                ctx,
                s.size.w,
                s.size.h,
                s.phase,
                s.phase2,
                s.twist,
                propsRef.current,
                paletteRef.current
            )
            s.dirty = false
        }

        let raf = 0
        let last = performance.now()

        const tick = (now: number) => {
            raf = requestAnimationFrame(tick)
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
            last = now

            const cur = propsRef.current
            const pal = paletteRef.current
            if (!pal || !s.visible || document.hidden) return

            const animate = animateRef.current
            const ease = Math.max(0.0001, cur.transition)
            // Exponential smoothing: play/pause and speed changes glide instead of snapping
            const k = 1 - Math.exp((-dt * 4) / ease)
            s.velocity += ((animate ? 1 : 0) - s.velocity) * k
            if (Math.abs(s.velocity) < 0.0005 && !animate) s.velocity = 0
            s.fade =
                isStatic && !cur.previewOnCanvas ? 1 : s.fade + (1 - s.fade) * k

            const moving = s.velocity > 0
            const fading = s.fade < 0.999
            if (!moving && !fading && !s.dirty) return

            if (moving) {
                const dir = cur.direction === "left" ? -1 : 1
                const step = dt * cur.speed * 0.9 * dir * s.velocity
                // Each phase wraps on its own 2π period → no visible seam, ever
                s.phase = (s.phase + step) % TAU
                s.phase2 = (s.phase2 + step * 0.5) % TAU
                s.twist =
                    (s.twist + dt * cur.twistSpeed * 0.6 * s.velocity) % TAU
            }

            const { w, h, dpr } = s.size
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            drawFrame(ctx, w, h, s.phase, s.phase2, s.twist, cur, pal)
            canvas.style.opacity = String(fading ? s.fade : 1)
            s.dirty = false
        }
        raf = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            io?.disconnect()
        }
    }, [isStatic])

    return (
        <div
            ref={wrapRef}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: p.radius,
                background: p.background,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
            <span
                ref={probeRef}
                aria-hidden="true"
                style={{ display: "none" }}
            />
        </div>
    )
}

function usePrefersReducedMotion() {
    const [reduced, setReduced] = React.useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])
    return reduced
}

/* ------------------------------------------------------------------ */
/* Defaults & Property Controls                                        */
/* ------------------------------------------------------------------ */

const defaults: Props = {
    background: "#080203",
    glowColor: "#E0180A",
    glowIntensity: 90,
    glowX: 100,
    glowY: 70,
    glowSize: 45,
    highlightColor: "#FFC3A0",
    midColor: "#FF5A26",
    baseColor: "#CF1D14",
    shadowColor: "#240304",
    sheenColor: "#B7A3A7",
    sheenAmount: 60,

    playing: true,
    speed: 1,
    twistSpeed: 0.6,
    direction: "right",
    transition: 1.2,
    previewOnCanvas: true,
    respectReducedMotion: true,

    slices: 64,
    amplitude: 55,
    waves: 1.1,
    sliceHeight: 40,
    thickness: 110,
    perspective: 90,
    tilt: 4,
    lean: 34,
    twist: 30,
    verticalOffset: 0,

    edgeShadow: 85,
    rimLight: 60,
    coreShade: 55,
    opacity: 100,

    radius: 0,
}

WaveSlices.displayName = "Wave Slices"

addPropertyControls(WaveSlices, {
    // —— Colors ——
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: defaults.background,
    },
    highlightColor: {
        type: ControlType.Color,
        title: "Highlight",
        defaultValue: defaults.highlightColor,
    },
    midColor: {
        type: ControlType.Color,
        title: "Mid Tone",
        defaultValue: defaults.midColor,
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base",
        defaultValue: defaults.baseColor,
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow",
        defaultValue: defaults.shadowColor,
    },
    sheenColor: {
        type: ControlType.Color,
        title: "Sheen",
        defaultValue: defaults.sheenColor,
    },
    sheenAmount: {
        type: ControlType.Number,
        title: "Sheen Mix",
        defaultValue: defaults.sheenAmount,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: defaults.glowColor,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Amount",
        defaultValue: defaults.glowIntensity,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    glowX: {
        type: ControlType.Number,
        title: "Glow X",
        defaultValue: defaults.glowX,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p: Props) => p.glowIntensity === 0,
    },
    glowY: {
        type: ControlType.Number,
        title: "Glow Y",
        defaultValue: defaults.glowY,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p: Props) => p.glowIntensity === 0,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Glow Size",
        defaultValue: defaults.glowSize,
        min: 10,
        max: 150,
        step: 1,
        unit: "%",
        hidden: (p: Props) => p.glowIntensity === 0,
    },

    // —— Animation ——
    playing: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: defaults.playing,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    speed: {
        type: ControlType.Number,
        title: "Wave Speed",
        defaultValue: defaults.speed,
        min: 0,
        max: 5,
        step: 0.05,
        displayStepper: true,
        hidden: (p: Props) => !p.playing,
    },
    twistSpeed: {
        type: ControlType.Number,
        title: "Twist Speed",
        defaultValue: defaults.twistSpeed,
        min: 0,
        max: 5,
        step: 0.05,
        displayStepper: true,
        hidden: (p: Props) => !p.playing,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["right", "left"],
        optionTitles: ["Right", "Left"],
        defaultValue: defaults.direction,
        displaySegmentedControl: true,
        hidden: (p: Props) => !p.playing,
    },
    transition: {
        type: ControlType.Number,
        title: "Transition",
        description:
            "Seconds to fade in and to ease between speed / play changes.",
        defaultValue: defaults.transition,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    previewOnCanvas: {
        type: ControlType.Boolean,
        title: "Canvas Preview",
        defaultValue: defaults.previewOnCanvas,
        enabledTitle: "Play",
        disabledTitle: "Still",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        description: "Pause for visitors who prefer reduced motion.",
        defaultValue: defaults.respectReducedMotion,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
    },

    // —— Shape ——
    slices: {
        type: ControlType.Number,
        title: "Slices",
        defaultValue: defaults.slices,
        min: 16,
        max: 160,
        step: 1,
        displayStepper: true,
    },
    amplitude: {
        type: ControlType.Number,
        title: "Amplitude",
        defaultValue: defaults.amplitude,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    waves: {
        type: ControlType.Number,
        title: "Waves",
        defaultValue: defaults.waves,
        min: 0.25,
        max: 4,
        step: 0.05,
    },
    sliceHeight: {
        type: ControlType.Number,
        title: "Slice Size",
        defaultValue: defaults.sliceHeight,
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
    },
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: defaults.thickness,
        min: 20,
        max: 250,
        step: 1,
        unit: "%",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: defaults.perspective,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    tilt: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: defaults.tilt,
        min: -60,
        max: 60,
        step: 1,
        unit: "°",
    },
    lean: {
        type: ControlType.Number,
        title: "Lean",
        description: "Extra lean of the far slices for depth.",
        defaultValue: defaults.lean,
        min: -60,
        max: 60,
        step: 1,
        unit: "°",
    },
    twist: {
        type: ControlType.Number,
        title: "Twist",
        defaultValue: defaults.twist,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    verticalOffset: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: defaults.verticalOffset,
        min: -40,
        max: 40,
        step: 1,
        unit: "%",
    },

    // —— Lighting ——
    edgeShadow: {
        type: ControlType.Number,
        title: "Edge Shadow",
        defaultValue: defaults.edgeShadow,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    rimLight: {
        type: ControlType.Number,
        title: "Rim Light",
        defaultValue: defaults.rimLight,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    coreShade: {
        type: ControlType.Number,
        title: "Core Shade",
        defaultValue: defaults.coreShade,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: defaults.opacity,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },

    // —— Layout ——
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: defaults.radius,
        min: 0,
        max: 200,
        step: 1,
    },
})
