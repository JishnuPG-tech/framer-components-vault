import { useRef, useEffect } from "react"
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
 * FILAMENT FLOWER
 * Rotating bundle of curved filaments converging to a bright core, with a
 * petal curvature that drifts over time, travelling opacity waves, a fixed
 * ring of nodes, rotating process labels, and a smooth onion-bow hover that
 * pushes nearby threads aside (anchored at both ends).
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 640
 */
const LABEL_STACK =
    'ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace'

export default function FilamentFlower(props) {
    const {
        background,
        lineColor,
        labelColor,
        nodes,
        petals,
        curve,
        drift,
        spin,
        lineOpacity,
        ringDots,
        waveSpeed,
        waveDensity,
        hoverPush,
        hoverRadius,
        buildTime,
        showLabels,
        labels,
        labelSize,
        trailingDots,
        width,
        height,
        style,
    } = props

    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const cfg = useRef<any>(null)
    cfg.current = {
        background,
        lineColor,
        labelColor,
        nodes,
        petals,
        curve,
        drift,
        spin,
        lineOpacity,
        ringDots,
        waveSpeed,
        waveDensity,
        hoverPush,
        hoverRadius,
        buildTime,
        showLabels,
        labels,
        labelSize,
        trailingDots,
    }

    // Static during Framer canvas + export → render one frame, no animation.
    const isStatic = useIsStaticRenderer()
    const reduced =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const noAnim = isStatic || reduced

    useEffect(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        if (!wrap || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let W = 0,
            H = 0,
            cx = 0,
            cy = 0,
            R = 0,
            DPR = 1
        let nodeList: any[] = []
        let rot = 0,
            curveT = 0,
            energy = 0,
            lastT = 0
        let active: any[] = [],
            lastSpawn = 0
        const mouse = { x: -9999, y: -9999, on: false }
        const SAMPLES = 24
        let raf = 0
        let visible = true

        function buildNodes(n: number) {
            nodeList = []
            for (let i = 0; i < n; i++) {
                nodeList.push({
                    a0: (i / n) * Math.PI * 2,
                    jitter: (Math.random() - 0.5) * 0.18,
                    bright: 0.6 + Math.random() * 0.4,
                })
            }
        }

        function measure() {
            const r = wrap.getBoundingClientRect()
            W = Math.max(1, r.width)
            H = Math.max(1, r.height)
            DPR = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = W * DPR
            canvas.height = H * DPR
            canvas.style.width = W + "px"
            canvas.style.height = H + "px"
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
            cx = W * 0.5
            cy = H * 0.5
            R = Math.min(W, H) * 0.44
        }

        function render(t: number, animate: boolean) {
            const c = cfg.current
            const dt = lastT ? Math.min(t - lastT, 50) : 16
            lastT = t

            if (nodeList.length !== (c.nodes | 0)) buildNodes(c.nodes | 0)

            if (animate) {
                rot += c.spin * 0.016
                curveT += (dt / 1000) * c.drift
                energy +=
                    ((mouse.on ? 1 : -1) * (dt / 1000)) /
                    (mouse.on ? c.buildTime : 0.9)
                energy = Math.max(0, Math.min(1, energy))
            }
            const ws = (t / 1000) * c.waveSpeed
            const dotR = Math.max(1.2, R * 0.006)

            ctx.fillStyle = c.background
            ctx.fillRect(0, 0, W, H)

            ctx.globalCompositeOperation = "lighter"
            ctx.lineWidth = 1.1
            ctx.lineCap = "round"
            ctx.strokeStyle = c.lineColor

            for (const nd of nodeList) {
                const a = nd.a0 + rot
                const ex = cx + Math.cos(a) * R
                const ey = cy + Math.sin(a) * R
                const tang =
                    c.curve * Math.sin(c.petals * nd.a0 + curveT) + nd.jitter
                const ca = a + tang
                const cr = R * 0.5
                const ctrlx = cx + Math.cos(ca) * cr
                const ctrly = cy + Math.sin(ca) * cr

                const bx: number[] = [],
                    by: number[] = []
                for (let s = 0; s <= SAMPLES; s++) {
                    const u = s / SAMPLES,
                        iu = 1 - u
                    bx[s] = iu * iu * cx + 2 * iu * u * ctrlx + u * u * ex
                    by[s] = iu * iu * cy + 2 * iu * u * ctrly + u * u * ey
                }

                let amp = 0,
                    sign = 1
                const nx = -Math.sin(a),
                    ny = Math.cos(a)
                if (energy > 0.001) {
                    let md = 1e9
                    for (let s = 0; s <= SAMPLES; s += 3) {
                        const dx = bx[s] - mouse.x,
                            dy = by[s] - mouse.y
                        const d = dx * dx + dy * dy
                        if (d < md) md = d
                    }
                    md = Math.sqrt(md)
                    if (md < c.hoverRadius) {
                        amp =
                            0.5 *
                            (1 + Math.cos(Math.PI * (md / c.hoverRadius))) *
                            c.hoverPush *
                            energy
                        const mx = bx[SAMPLES >> 1] - mouse.x,
                            my = by[SAMPLES >> 1] - mouse.y
                        sign = mx * nx + my * ny >= 0 ? 1 : -1
                    }
                }

                for (let s = 0; s < SAMPLES; s++) {
                    const u0 = s / SAMPLES,
                        u1 = (s + 1) / SAMPLES
                    const k0 = amp ? sign * amp * Math.sin(Math.PI * u0) : 0
                    const k1 = amp ? sign * amp * Math.sin(Math.PI * u1) : 0
                    const x0 = bx[s] + nx * k0,
                        y0 = by[s] + ny * k0
                    const x1 = bx[s + 1] + nx * k1,
                        y1 = by[s + 1] + ny * k1
                    const um = (u0 + u1) / 2
                    const grad = 1 - 0.62 * um
                    const wave =
                        0.45 +
                        0.55 *
                            Math.sin(
                                um * c.waveDensity * Math.PI -
                                    ws +
                                    nd.jitter * 30
                            )
                    ctx.globalAlpha =
                        c.lineOpacity * nd.bright * grad * Math.max(0, wave)
                    ctx.beginPath()
                    ctx.moveTo(x0, y0)
                    ctx.lineTo(x1, y1)
                    ctx.stroke()
                }
            }
            ctx.globalAlpha = 1
            ctx.globalCompositeOperation = "source-over"

            if (c.ringDots) {
                ctx.fillStyle = c.lineColor
                for (const nd of nodeList) {
                    const a = nd.a0 + rot
                    ctx.globalAlpha = 0.55 + 0.45 * nd.bright
                    ctx.beginPath()
                    ctx.arc(
                        cx + Math.cos(a) * R,
                        cy + Math.sin(a) * R,
                        dotR,
                        0,
                        Math.PI * 2
                    )
                    ctx.fill()
                }
                ctx.globalAlpha = 1
            }

            if (c.showLabels && c.labels && c.labels.length) {
                active = active.filter((l) => t - l.born < l.life)
                if (animate && t - lastSpawn > 700 && active.length < 4) {
                    lastSpawn = t
                    let ang: number | null = null
                    for (let tries = 0; tries < 14; tries++) {
                        const cand = Math.random() * Math.PI * 2
                        let ok = true
                        for (const l of active) {
                            const d = Math.abs(
                                ((cand - l.ang + Math.PI) % (Math.PI * 2)) -
                                    Math.PI
                            )
                            if (d < 0.62) {
                                ok = false
                                break
                            }
                        }
                        if (ok) {
                            ang = cand
                            break
                        }
                    }
                    if (ang !== null) {
                        active.push({
                            text: c.labels[
                                (Math.random() * c.labels.length) | 0
                            ],
                            ang,
                            born: t,
                            life: 1900 + Math.random() * 1500,
                        })
                    }
                }
                const px = Math.max(8, Math.min(c.labelSize || 11, R * 0.045))
                ctx.font = `${px.toFixed(0)}px ${LABEL_STACK}`
                ctx.textAlign = "center"
                ctx.textBaseline = "middle"
                ctx.fillStyle = c.labelColor
                // in static render show a couple of labels so the frame isn't bare
                if (!animate && active.length === 0) {
                    const n = Math.min(3, c.labels.length)
                    for (let i = 0; i < n; i++)
                        active.push({
                            text: c.labels[i],
                            ang: (i / n) * Math.PI * 2,
                            born: t - 800,
                            life: 3000,
                        })
                }
                for (const l of active) {
                    const p = (t - l.born) / l.life
                    ctx.globalAlpha = animate
                        ? 0.7 * Math.sin(p * Math.PI)
                        : 0.6
                    const aa = l.ang + rot
                    const lr = R * 1.07
                    ctx.fillText(
                        (l.text || "") + (c.trailingDots ? "..." : ""),
                        cx + Math.cos(aa) * lr,
                        cy + Math.sin(aa) * lr
                    )
                }
                ctx.globalAlpha = 1
            }
        }

        measure()
        buildNodes(cfg.current.nodes | 0)

        // re-render on resize (static gets a fresh frame, animated picks up next tick)
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => {
                      measure()
                      if (noAnim) render(0, false)
                  })
                : null
        if (ro) ro.observe(wrap)

        if (noAnim) {
            render(0, false)
            return () => {
                if (ro) ro.disconnect()
            }
        }

        // ---- animated path ----
        const move = (e: PointerEvent) => {
            const r = canvas.getBoundingClientRect()
            mouse.x = e.clientX - r.left
            mouse.y = e.clientY - r.top
            mouse.on = true
        }
        const leave = () => {
            mouse.on = false
        }
        wrap.addEventListener("pointermove", move)
        wrap.addEventListener("pointerdown", move)
        wrap.addEventListener("pointerleave", leave)

        const loop = (t: number) => {
            render(t, true)
            raf = requestAnimationFrame(loop)
        }
        const start = () => {
            if (!raf) {
                lastT = 0
                raf = requestAnimationFrame(loop)
            }
        }
        const stop = () => {
            if (raf) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        }

        // only animate while the component is on screen
        const io =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      (entries) => {
                          visible = entries[0].isIntersecting
                          if (visible) start()
                          else stop()
                      },
                      { threshold: 0 }
                  )
                : null
        if (io) io.observe(wrap)
        else start() // fallback if IO unavailable

        return () => {
            stop()
            if (io) io.disconnect()
            if (ro) ro.disconnect()
            wrap.removeEventListener("pointermove", move)
            wrap.removeEventListener("pointerdown", move)
            wrap.removeEventListener("pointerleave", leave)
        }
    }, [noAnim])

    return (
        <div
            ref={wrapRef}
            style={{
                ...style,
                width: typeof width === "number" ? width : "100%",
                height: typeof height === "number" ? height : "100%",
                position: "relative",
                overflow: "hidden",
                touchAction: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            />
        </div>
    )
}

FilamentFlower.defaultProps = {
    background: "#1A46C4",
    lineColor: "#FFFFFF",
    labelColor: "#DBE7FF",
    nodes: 130,
    petals: 5,
    curve: 0.9,
    drift: 0.4,
    spin: 0.014,
    lineOpacity: 0.16,
    ringDots: true,
    waveSpeed: 2.2,
    waveDensity: 3,
    hoverPush: 90,
    hoverRadius: 280,
    buildTime: 1.8,
    showLabels: true,
    labels: [
        "ATTENTION",
        "ENCODING",
        "EMBEDDING",
        "SYNTHESIS",
        "INFERENCE",
        "SIGNAL MAP",
        "SAMPLING",
        "ROUTING",
    ],
    labelSize: 11,
    trailingDots: false,
}

addPropertyControls(FilamentFlower, {
    background: { type: ControlType.Color, title: "Background" },
    lineColor: { type: ControlType.Color, title: "Lines" },
    nodes: {
        type: ControlType.Number,
        title: "Nodes",
        min: 40,
        max: 240,
        step: 1,
    },
    petals: {
        type: ControlType.Number,
        title: "Petals",
        min: 1,
        max: 12,
        step: 1,
    },
    curve: {
        type: ControlType.Number,
        title: "Curve",
        min: 0,
        max: 1.8,
        step: 0.01,
    },
    drift: {
        type: ControlType.Number,
        title: "Curve drift",
        min: 0,
        max: 2,
        step: 0.02,
    },
    spin: {
        type: ControlType.Number,
        title: "Spin",
        min: 0,
        max: 0.1,
        step: 0.002,
    },
    lineOpacity: {
        type: ControlType.Number,
        title: "Line opacity",
        min: 0.02,
        max: 0.6,
        step: 0.01,
    },
    ringDots: {
        type: ControlType.Boolean,
        title: "Ring dots",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    waveSpeed: {
        type: ControlType.Number,
        title: "Wave speed",
        min: 0,
        max: 6,
        step: 0.1,
    },
    waveDensity: {
        type: ControlType.Number,
        title: "Wave density",
        min: 0,
        max: 8,
        step: 0.2,
    },
    hoverPush: {
        type: ControlType.Number,
        title: "Hover bow",
        min: 0,
        max: 260,
        step: 1,
    },
    hoverRadius: {
        type: ControlType.Number,
        title: "Hover radius",
        min: 60,
        max: 600,
        step: 5,
    },
    buildTime: {
        type: ControlType.Number,
        title: "Hover build",
        min: 0.2,
        max: 6,
        step: 0.1,
        unit: "s",
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    labels: {
        type: ControlType.Array,
        title: "Label texts",
        control: { type: ControlType.String, placeholder: "LABEL" },
        defaultValue: [
            "ATTENTION",
            "ENCODING",
            "EMBEDDING",
            "SYNTHESIS",
            "INFERENCE",
            "SIGNAL MAP",
            "SAMPLING",
            "ROUTING",
        ],
        hidden: (p) => !p.showLabels,
    },
    labelSize: {
        type: ControlType.Number,
        title: "Label size",
        min: 8,
        max: 28,
        step: 1,
        unit: "px",
        hidden: (p) => !p.showLabels,
    },
    trailingDots: {
        type: ControlType.Boolean,
        title: "Trailing ...",
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.showLabels,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label color",
        hidden: (p) => !p.showLabels,
    },
})
