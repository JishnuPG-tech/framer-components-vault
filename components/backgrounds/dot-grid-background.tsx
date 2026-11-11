"use client"

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"

interface Props {
    dotColor: string
    dotSize: number
    dotSpacing: number
    orbitSpeed: number
    impactRadius: number
    scaleOnHover: number
    enableRevolve: boolean
    style?: React.CSSProperties
    width?: number | string
    height?: number | string
}

function smoothstep(t: number): number {
    const c = Math.max(0, Math.min(1, t))
    return c * c * (3 - 2 * c)
}

function parseColor(
    raw: string,
    el: HTMLElement
): { r: number; g: number; b: number } {
    const color = resolveVar(raw, el)
    if (color.startsWith("rgb")) {
        const m = color.match(/[\d.]+/g) || []
        return {
            r: Number(m[0]) || 0,
            g: Number(m[1]) || 0,
            b: Number(m[2]) || 0,
        }
    }
    let h = color.replace("#", "")
    if (h.length === 3)
        h = h
            .split("")
            .map((c) => c + c)
            .join("")
    const n = parseInt(h.slice(0, 6), 16)
    if (isNaN(n)) return { r: 136, g: 136, b: 136 }
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function resolveVar(raw: string, el: HTMLElement): string {
    const s = raw.trim()
    if (!s.startsWith("var(")) return s
    const inner = s.slice(4, -1).trim()
    const commaIdx = inner.indexOf(",")
    const varName = (commaIdx !== -1 ? inner.slice(0, commaIdx) : inner).trim()
    const fallback = commaIdx !== -1 ? inner.slice(commaIdx + 1).trim() : ""
    try {
        const resolved = getComputedStyle(el).getPropertyValue(varName).trim()
        if (resolved) return resolved
    } catch (_) {}
    if (fallback) return resolveVar(fallback, el)
    return "#888888"
}

export default function DotGridBackground({
    dotColor = "#6366f1",
    dotSize = 3,
    dotSpacing = 28,
    orbitSpeed = 1.5,
    impactRadius = 100,
    scaleOnHover = 1.8,
    enableRevolve = true,
    style,
    width = "100%",
    height = "100%",
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const cfgRef = useRef({
        dotColor,
        dotSize,
        dotSpacing,
        orbitSpeed,
        impactRadius,
        scaleOnHover,
        enableRevolve,
    })
    cfgRef.current.dotColor = dotColor
    cfgRef.current.dotSize = dotSize
    cfgRef.current.dotSpacing = dotSpacing
    cfgRef.current.orbitSpeed = orbitSpeed
    cfgRef.current.impactRadius = impactRadius
    cfgRef.current.scaleOnHover = scaleOnHover
    cfgRef.current.enableRevolve = enableRevolve

    const dotsRef = useRef<
        {
            bx: number
            by: number
            // Per-dot orbital parameters — randomised once at build time, never change
            inclination: number // tilt of the orbital plane (0 = flat, π/2 = edge-on)
            ascension: number // rotation of the orbital plane around the vertical axis
            phase: number // starting position along the orbit
            speedMult: number // slight per-dot speed variation for organic feel
        }[]
    >([])
    const spacingSnapRef = useRef(dotSpacing)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")!
        const dpr = window.devicePixelRatio || 1

        let W = 0,
            H = 0
        let mouse = { x: -9999, y: -9999 }
        let hovering = false
        let leaveTs = 0
        let prevTs = 0
        let raf = 0
        let globalAngle = 0

        function buildDots() {
            const sp = cfgRef.current.dotSpacing
            spacingSnapRef.current = sp
            dotsRef.current = []
            const cols = Math.ceil(W / sp) + 2
            const rows = Math.ceil(H / sp) + 2
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    dotsRef.current.push({
                        bx: c * sp,
                        by: r * sp,
                        inclination: Math.random() * Math.PI, // full range of tilts
                        ascension: Math.random() * Math.PI * 2, // any rotation around Z
                        phase: Math.random() * Math.PI * 2, // random start position
                        speedMult: 0.7 + Math.random() * 0.6, // 0.7× – 1.3× speed
                    })
                }
            }
        }

        function resize() {
            const rect = canvas.getBoundingClientRect()
            W = rect.width
            H = rect.height
            canvas.width = W * dpr
            canvas.height = H * dpr
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            buildDots()
        }

        const ro = new ResizeObserver(resize)
        ro.observe(canvas)
        resize()

        canvas.addEventListener("mousemove", (e) => {
            const rect = canvas.getBoundingClientRect()
            mouse.x = e.clientX - rect.left
            mouse.y = e.clientY - rect.top
        })
        canvas.addEventListener("mouseenter", (e) => {
            const rect = canvas.getBoundingClientRect()
            mouse.x = e.clientX - rect.left
            mouse.y = e.clientY - rect.top
            hovering = true
        })
        canvas.addEventListener("mouseleave", () => {
            mouse.x = -9999
            mouse.y = -9999
            hovering = false
            leaveTs = performance.now()
        })

        function loop(ts: number) {
            raf = requestAnimationFrame(loop)
            const dt = Math.min((ts - (prevTs || ts)) / 1000, 0.05)
            prevTs = ts

            const cfg = cfgRef.current
            if (spacingSnapRef.current !== cfg.dotSpacing) buildDots()

            globalAngle += cfg.orbitSpeed * dt

            ctx.clearRect(0, 0, W, H)

            const rgb = parseColor(cfg.dotColor, canvas)
            const mx = mouse.x,
                my = mouse.y

            const timeSinceLeave = hovering
                ? 0
                : Math.max(0, ts - leaveTs) / 1000
            const decay = hovering
                ? 1
                : smoothstep(Math.max(0, 1 - timeSinceLeave * 1.5))

            for (const d of dotsRef.current) {
                const dx = d.bx - mx
                const dy = d.by - my
                const dist = Math.sqrt(dx * dx + dy * dy)
                const inRange = dist < cfg.impactRadius && dist > 0

                let x = d.bx,
                    y = d.by,
                    scale = 1,
                    alpha = 0.3

                if (inRange) {
                    const t = dist / cfg.impactRadius
                    const inf = smoothstep(1 - t) * decay

                    if (cfg.enableRevolve) {
                        // Orbital radius scales with distance from cursor edge
                        const orbitR = (1 - t) * cfg.dotSpacing * 0.7 * inf

                        // Current angle along this dot's orbit
                        const theta = globalAngle * d.speedMult + d.phase

                        // 3-D orbit: parametric ellipse in a tilted plane.
                        // We project a unit circle onto a plane defined by
                        // inclination (tilt from XY) and ascension (rotation around Z).
                        //
                        // In the orbital plane:
                        //   local x = cos(theta)
                        //   local y = sin(theta)
                        //
                        // Rotate by inclination around the X axis of the orbital plane:
                        //   proj_x = cos(theta)
                        //   proj_y = sin(theta) * cos(inclination)
                        //   proj_z = sin(theta) * sin(inclination)  ← depth for size/alpha
                        //
                        // Then rotate the whole plane by ascension around Z:
                        const cosA = Math.cos(d.ascension)
                        const sinA = Math.sin(d.ascension)
                        const cosI = Math.cos(d.inclination)
                        const sinI = Math.sin(d.inclination)

                        const lx = Math.cos(theta)
                        const ly = Math.sin(theta) * cosI
                        const lz = Math.sin(theta) * sinI // +1 = toward viewer, -1 = away

                        // Final 2-D screen offset from the dot's rest position
                        const ox = (lx * cosA - ly * sinA) * orbitR
                        const oy = (lx * sinA + ly * cosA) * orbitR

                        x = d.bx + ox
                        y = d.by + oy

                        // Depth cue: dots "behind" the plane are slightly smaller and dimmer
                        const depthScale = 0.75 + 0.25 * ((lz + 1) * 0.5) // 0.75 – 1.0
                        scale = (1 + (cfg.scaleOnHover - 1) * inf) * depthScale
                        alpha = (0.3 + 0.7 * inf) * depthScale
                    } else {
                        scale = 1 + (cfg.scaleOnHover - 1) * inf
                        alpha = 0.3 + 0.7 * inf
                    }
                }

                const r = (cfg.dotSize / 2) * scale
                ctx.beginPath()
                ctx.arc(x, y, r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
                ctx.fill()
            }
        }

        raf = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: "block",
                width: width as any,
                height: height as any,
                ...style,
            }}
        />
    )
}

DotGridBackground.displayName = "Dot Grid Background"

addPropertyControls(DotGridBackground, {
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#6366f1",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 3,
        min: 1,
        max: 12,
        step: 0.5,
        unit: "px",
        displayStepper: true,
    },
    dotSpacing: {
        type: ControlType.Number,
        title: "Grid Spacing",
        defaultValue: 28,
        min: 12,
        max: 80,
        step: 2,
        unit: "px",
        displayStepper: true,
    },
    enableRevolve: {
        type: ControlType.Boolean,
        title: "Enable Orbiting",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    orbitSpeed: {
        type: ControlType.Number,
        title: "Orbit Speed",
        defaultValue: 1.5,
        min: 0.1,
        max: 10,
        step: 0.1,
        displayStepper: true,
        hidden: (props) => !props.enableRevolve,
    },
    impactRadius: {
        type: ControlType.Number,
        title: "Impact Radius",
        defaultValue: 100,
        min: 20,
        max: 400,
        step: 5,
        unit: "px",
        displayStepper: true,
    },
    scaleOnHover: {
        type: ControlType.Number,
        title: "Scale on Hover",
        defaultValue: 1.8,
        min: 1,
        max: 5,
        step: 0.1,
        displayStepper: true,
    },
})
