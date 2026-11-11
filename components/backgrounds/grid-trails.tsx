// GridTrails — an original Framer code component.
// A rectangular grid with glowing "light trails" that wander along its lines,
// plus a pointer-following trail on hover. Rendered with a single WebGL pass.
// Cells can be square or rectangular (see "Cell Shape").
//
// Written from scratch (own structure, own shader math). You are free to use it
// in your own projects.

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


/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const MAX_DPR = 2
const MAX_WALKERS = 8
const MAX_TRAIL = 6
// Per actor: 1 head point + 1 leading segment + up to MAX_TRAIL tail segments
const SEGS_PER_ACTOR = MAX_TRAIL + 2
// Walkers + 1 pointer-chaser
const MAX_SEG = (MAX_WALKERS + 1) * SEGS_PER_ACTOR // 72  (must match the shader)

const WALK_SPEED = 1.7 // cells per second at speed = 50
const TAIL_FALLOFF = 0.6
const HEAD_BOOST = 1.4

const CHASE_BASE = 3
const CHASE_GAIN = 3
const CHASE_CAP = 36
const CHASE_TELEPORT = 24 // grid steps; farther than this => jump

type RGB = [number, number, number]

const FALLBACK_BG: RGB = [0, 0, 0]
const FALLBACK_LINE: RGB = [0.06, 0.06, 0.06]
const FALLBACK_GLOW: RGB = [1, 0.165, 0.094]

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform vec2  uCell;   // cell width and height in pixels
uniform float uLineW;
uniform float uReach;
uniform vec3  uBase;
uniform vec3  uGroove;
uniform vec3  uGlowCol;
uniform int   uCount;
uniform vec4  uSeg[72];
uniform float uWt[72];

float edgeDist(float t) { return abs(t - floor(t + 0.5)); }

float hash2(vec2 q) {
    return fract(sin(dot(q, vec2(17.31, 59.17))) * 9157.31);
}

void main() {
    vec2 p = gl_FragCoord.xy - 0.5 * uRes;

    // Grid coordinates: vertices sit at integer (g.x, g.y)
    vec2 g = p / uCell;

    // Distance in pixels to the nearest vertical or horizontal line
    float d = min(edgeDist(g.x) * uCell.x, edgeDist(g.y) * uCell.y);

    float onLine = 1.0 - smoothstep(uLineW, uLineW + 1.0, d);
    float bevel  = 1.0 - smoothstep(uLineW, uLineW * 5.0, d);

    // Each cell gets a slightly different tint
    float tint = hash2(floor(g));

    vec3 col = uBase * (0.86 + 0.28 * tint);
    col += 0.02 * bevel * (1.0 - onLine);
    col = mix(col, uGroove, onLine);

    // Accumulate light from every trail segment
    float core = 0.0;
    float halo = 0.0;
    float inv = 1.0 / max(uReach * uReach, 1.0);
    for (int i = 0; i < 72; i++) {
        if (i >= uCount) break;
        vec4 s = uSeg[i];
        vec2 pa = p - s.xy;
        vec2 ba = s.zw - s.xy;
        float len2 = dot(ba, ba);
        float k = len2 > 0.0001 ? clamp(dot(pa, ba) / len2, 0.0, 1.0) : 0.0;
        vec2 r = pa - ba * k;
        float q = dot(r, r) * inv;
        float w = uWt[i];
        core += w * exp(-q * 7.0);
        halo += w / (1.0 + q * 3.0);
    }

    float lit = min(core, 2.5);
    col += uGlowCol * onLine * lit * 2.0;
    col += uGlowCol * core * 0.08;
    col += uGlowCol * halo * 0.04;
    col += vec3(1.0) * onLine * pow(min(lit, 1.0), 6.0) * 0.55;

    vec2 uv = gl_FragCoord.xy / uRes - 0.5;
    col *= 1.0 - 0.5 * dot(uv, uv);

    gl_FragColor = vec4(col, 1.0);
}
`

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function num(v: unknown, fallback: number): number {
    return typeof v === "number" && isFinite(v) ? v : fallback
}

function clamp(v: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, v))
}

/**
 * Resolve any CSS colour (hex, rgb, hsl, named, Framer colour tokens such as
 * var(--token-..., #fff)) to 0–1 RGB by letting the browser compute it.
 */
function resolveColor(
    host: HTMLElement,
    value: string | undefined,
    fallback: RGB
): RGB {
    if (!value) return fallback
    const probe = document.createElement("span")
    probe.style.color = value
    if (!probe.style.color) return fallback
    probe.style.display = "none"
    host.appendChild(probe)
    const computed = getComputedStyle(probe).color
    host.removeChild(probe)

    const nums = computed.match(/-?\d*\.?\d+(?:e-?\d+)?/g)
    if (!nums || nums.length < 3) return fallback
    const scale = computed.startsWith("color(") ? 1 : 255
    return [
        clamp(parseFloat(nums[0]) / scale, 0, 1),
        clamp(parseFloat(nums[1]) / scale, 0, 1),
        clamp(parseFloat(nums[2]) / scale, 0, 1),
    ]
}

function buildShader(gl: WebGLRenderingContext, type: number, src: string) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("GridTrails shader error:", gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }
    return shader
}

// Four grid directions, 90° apart, in (i, j) grid coordinates:
// right, up, left, down
const STEPS: ReadonlyArray<readonly [number, number]> = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
]

// [turn offset, weight] — mostly straight, sometimes a left or right turn,
// never a U-turn. Offset 1 = quarter turn one way, 3 = the other way.
const TURN_TABLE: ReadonlyArray<readonly [number, number]> = [
    [0, 0.6],
    [1, 0.2],
    [3, 0.2],
]
const TURN_TOTAL = TURN_TABLE.reduce((sum, [, w]) => sum + w, 0)

function nextHeading(dir: number): number {
    let roll = Math.random() * TURN_TOTAL
    for (const [offset, weight] of TURN_TABLE) {
        roll -= weight
        if (roll <= 0) return (dir + offset) % 4
    }
    return dir
}

// Number of grid steps between two vertices (Manhattan distance)
function gridDistance(di: number, dj: number): number {
    return Math.abs(di) + Math.abs(dj)
}

interface Actor {
    i: number
    j: number
    dir: number
    t: number // progress along the current edge, 0..1
    trail: number[] // flat list of previous vertices: i0, j0, i1, j1, ...
}

function newActor(): Actor {
    return { i: 0, j: 0, dir: 0, t: 0, trail: [] }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface GridTrailsProps {
    style?: React.CSSProperties
    background?: string
    lineColor?: string
    accent?: string
    cellSize?: number
    cellShape?: number
    lights?: number
    speed?: number
    trailLength?: number
    glow?: number
    hover?: number
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function GridTrails(props: GridTrailsProps) {
    const {
        style,
        background = "#000000",
        lineColor = "#0F0F0F",
        accent = "#4D17FF",
        cellSize = 110,
        cellShape = 1,
        lights = 8,
        speed = 50,
        trailLength = 2,
        glow = 92,
        hover = 100,
    } = props

    const isStatic = useIsStaticRenderer()

    const hostRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const redrawRef = useRef<(() => void) | null>(null)

    const colorsRef = useRef<{ bg: RGB; line: RGB; glow: RGB }>({
        bg: FALLBACK_BG,
        line: FALLBACK_LINE,
        glow: FALLBACK_GLOW,
    })

    // Latest numeric settings, read by the render loop without restarting it
    const cfgRef = useRef({
        cellW: 110,
        cellH: 110,
        lights: 8,
        speed: 1,
        trail: 2,
        glow: 0.92,
        hover: 1,
    })
    const width = clamp(num(cellSize, 110), 16, 600)
    const shape = clamp(num(cellShape, 1), 0.25, 4) // height ÷ width
    cfgRef.current = {
        cellW: width,
        cellH: width * shape,
        lights: clamp(Math.round(num(lights, 8)), 1, MAX_WALKERS),
        speed: Math.max(0, num(speed, 50)) / 50,
        trail: clamp(Math.round(num(trailLength, 2)), 1, MAX_TRAIL),
        glow: Math.max(0.01, num(glow, 92) / 100),
        hover: Math.max(0, num(hover, 100) / 100),
    }

    // Colours — resolved through the DOM so Framer tokens work
    useEffect(() => {
        const host = hostRef.current
        if (!host) return
        colorsRef.current = {
            bg: resolveColor(host, background, FALLBACK_BG),
            line: resolveColor(host, lineColor, FALLBACK_LINE),
            glow: resolveColor(host, accent, FALLBACK_GLOW),
        }
        redrawRef.current?.()
    }, [background, lineColor, accent])

    // Redraw a frozen frame when any setting changes (static / reduced motion)
    useEffect(() => {
        redrawRef.current?.()
    }, [cellSize, cellShape, lights, speed, trailLength, glow, hover])

    // WebGL setup + animation loop
    useEffect(() => {
        const host = hostRef.current
        const canvas = canvasRef.current
        if (!host || !canvas) return

        const gl = canvas.getContext("webgl", {
            antialias: false,
            alpha: false,
            depth: false,
        })
        if (!gl) {
            console.error("GridTrails: WebGL is not available")
            return
        }

        const vs = buildShader(gl, gl.VERTEX_SHADER, VERTEX)
        const fs = buildShader(gl, gl.FRAGMENT_SHADER, FRAGMENT)
        if (!vs || !fs) return
        const program = gl.createProgram()
        if (!program) return
        gl.attachShader(program, vs)
        gl.attachShader(program, fs)
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(
                "GridTrails link error:",
                gl.getProgramInfoLog(program)
            )
            return
        }
        gl.useProgram(program)

        // One oversized triangle covers the whole viewport
        const buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )
        const aPos = gl.getAttribLocation(program, "aPos")
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

        const U = {
            res: gl.getUniformLocation(program, "uRes"),
            cell: gl.getUniformLocation(program, "uCell"),
            lineW: gl.getUniformLocation(program, "uLineW"),
            reach: gl.getUniformLocation(program, "uReach"),
            base: gl.getUniformLocation(program, "uBase"),
            groove: gl.getUniformLocation(program, "uGroove"),
            glow: gl.getUniformLocation(program, "uGlowCol"),
            count: gl.getUniformLocation(program, "uCount"),
            seg: gl.getUniformLocation(program, "uSeg[0]"),
            wt: gl.getUniformLocation(program, "uWt[0]"),
        }

        const segs = new Float32Array(MAX_SEG * 4)
        const weights = new Float32Array(MAX_SEG)

        const reduceMotion =
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const frozen = isStatic || reduceMotion

        let cssW = host.clientWidth || 1200
        let cssH = host.clientHeight || 800

        const walkers: Actor[] = []
        const chaser = newActor()
        let presence = 0

        const pointer = { x: 0, y: 0, inside: false }

        /* ---- geometry ------------------------------------------------ */

        const geometry = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
            const bw = Math.max(1, Math.round(cssW * dpr))
            const bh = Math.max(1, Math.round(cssH * dpr))
            const sx = cfgRef.current.cellW * dpr
            const sy = cfgRef.current.cellH * dpr
            return { dpr, bw, bh, sx, sy }
        }
        type Geo = ReturnType<typeof geometry>

        const vx = (i: number, g: Geo) => i * g.sx
        const vy = (j: number, g: Geo) => j * g.sy

        const nearestVertex = (
            x: number,
            y: number,
            g: Geo
        ): [number, number] => [Math.round(x / g.sx), Math.round(y / g.sy)]

        // Direction whose next vertex is closest to the target.
        // Keeps the current heading on ties so the path stays straight.
        const headToward = (a: Actor, ti: number, tj: number): number => {
            let best = a.dir
            let bestD = gridDistance(
                ti - (a.i + STEPS[a.dir][0]),
                tj - (a.j + STEPS[a.dir][1])
            )
            for (let k = 0; k < 4; k++) {
                const d = gridDistance(
                    ti - (a.i + STEPS[k][0]),
                    tj - (a.j + STEPS[k][1])
                )
                if (d < bestD) {
                    bestD = d
                    best = k
                }
            }
            return best
        }

        const respawn = (a: Actor, g: Geo) => {
            const x = (Math.random() - 0.5) * g.bw * 1.05
            const y = (Math.random() - 0.5) * g.bh * 1.05
            const [i, j] = nearestVertex(x, y, g)
            a.i = i
            a.j = j
            a.dir = Math.floor(Math.random() * 4)
            a.t = Math.random()
            a.trail.length = 0
        }

        /* ---- simulation ---------------------------------------------- */

        const simulate = (dt: number, g: Geo) => {
            const cfg = cfgRef.current
            while (walkers.length < cfg.lights) {
                const a = newActor()
                respawn(a, g)
                walkers.push(a)
            }
            if (walkers.length > cfg.lights) walkers.length = cfg.lights

            const advance = dt * WALK_SPEED * cfg.speed
            const limitX = g.bw * 0.5 + g.sx * 2
            const limitY = g.bh * 0.5 + g.sy * 2

            for (const w of walkers) {
                w.t += advance
                while (w.t >= 1) {
                    w.t -= 1
                    w.trail.unshift(w.i, w.j)
                    w.i += STEPS[w.dir][0]
                    w.j += STEPS[w.dir][1]
                    w.dir = nextHeading(w.dir)
                }
                if (w.trail.length > cfg.trail * 2)
                    w.trail.length = cfg.trail * 2

                if (
                    Math.abs(vx(w.i, g)) > limitX ||
                    Math.abs(vy(w.j, g)) > limitY
                ) {
                    respawn(w, g)
                }
            }

            // Pointer chaser
            if (cfg.hover > 0 && !frozen) {
                presence = pointer.inside
                    ? Math.min(1, presence + dt / 0.12)
                    : Math.max(0, presence - dt / 0.3)

                const px = (pointer.x - cssW * 0.5) * g.dpr
                const py = (cssH * 0.5 - pointer.y) * g.dpr
                const [ti, tj] = nearestVertex(px, py, g)

                const gap = gridDistance(ti - chaser.i, tj - chaser.j)
                if (gap > CHASE_TELEPORT || presence === 0) {
                    chaser.i = ti
                    chaser.j = tj
                    chaser.t = 0
                    chaser.trail.length = 0
                } else if (gap > 0) {
                    if (chaser.t === 0) chaser.dir = headToward(chaser, ti, tj)
                    const rate = Math.min(
                        CHASE_CAP,
                        CHASE_BASE + gap * CHASE_GAIN
                    )
                    chaser.t += dt * rate
                    while (chaser.t >= 1) {
                        chaser.t -= 1
                        chaser.trail.unshift(chaser.i, chaser.j)
                        chaser.i += STEPS[chaser.dir][0]
                        chaser.j += STEPS[chaser.dir][1]
                        if (chaser.i === ti && chaser.j === tj) {
                            chaser.t = 0
                            break
                        }
                        chaser.dir = headToward(chaser, ti, tj)
                    }
                }
                if (chaser.trail.length > cfg.trail * 2)
                    chaser.trail.length = cfg.trail * 2
            } else {
                presence = 0
            }
        }

        /* ---- drawing ------------------------------------------------- */

        let used = 0

        const pushSeg = (
            x0: number,
            y0: number,
            x1: number,
            y1: number,
            w: number
        ) => {
            if (used >= MAX_SEG || w <= 0) return
            const o = used * 4
            segs[o] = x0
            segs[o + 1] = y0
            segs[o + 2] = x1
            segs[o + 3] = y1
            weights[used] = w
            used++
        }

        const emitActor = (a: Actor, strength: number, g: Geo) => {
            if (strength <= 0) return
            const cx = vx(a.i, g)
            const cy = vy(a.j, g)
            const ni = a.i + STEPS[a.dir][0]
            const nj = a.j + STEPS[a.dir][1]
            const hx = cx + (vx(ni, g) - cx) * a.t
            const hy = cy + (vy(nj, g) - cy) * a.t

            pushSeg(hx, hy, hx, hy, HEAD_BOOST * strength) // bright head dot
            pushSeg(cx, cy, hx, hy, strength) // vertex -> head

            const count = a.trail.length / 2
            const full = count >= cfgRef.current.trail
            let prevX = cx
            let prevY = cy
            for (let k = 0; k < count; k++) {
                const ax = vx(a.trail[k * 2], g)
                const ay = vy(a.trail[k * 2 + 1], g)
                let w = Math.pow(TAIL_FALLOFF, k + 1) * strength
                if (full && k === count - 1) w *= 1 - a.t // tail eases out
                pushSeg(ax, ay, prevX, prevY, w)
                prevX = ax
                prevY = ay
            }
        }

        const render = (dt: number) => {
            const cfg = cfgRef.current
            const g = geometry()

            if (canvas.width !== g.bw || canvas.height !== g.bh) {
                canvas.width = g.bw
                canvas.height = g.bh
                gl.viewport(0, 0, g.bw, g.bh)
            }

            simulate(dt, g)

            used = 0
            for (const w of walkers) emitActor(w, 1, g)
            if (cfg.hover > 0 && !frozen)
                emitActor(chaser, cfg.hover * presence, g)

            const c = colorsRef.current
            gl.uniform2f(U.res, g.bw, g.bh)
            gl.uniform2f(U.cell, g.sx, g.sy)
            gl.uniform1f(U.lineW, Math.max(0.75, 0.9 * g.dpr))
            gl.uniform1f(
                U.reach,
                Math.max(2, Math.min(g.sx, g.sy) * 0.9 * cfg.glow)
            )
            gl.uniform3f(U.base, c.bg[0], c.bg[1], c.bg[2])
            gl.uniform3f(U.groove, c.line[0], c.line[1], c.line[2])
            gl.uniform3f(U.glow, c.glow[0], c.glow[1], c.glow[2])
            gl.uniform1i(U.count, used)
            gl.uniform4fv(U.seg, segs)
            gl.uniform1fv(U.wt, weights)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        // Pre-roll so a frozen frame (Canvas / export) already shows trails
        if (frozen) {
            const g = geometry()
            for (let k = 0; k < 24; k++) simulate(0.05, g)
        }

        redrawRef.current = () => render(0)

        /* ---- events -------------------------------------------------- */

        const onPointer = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            // Convert to layout pixels (robust to parent scale transforms)
            const x = ((e.clientX - rect.left) * cssW) / rect.width
            const y = ((e.clientY - rect.top) * cssH) / rect.height
            pointer.x = x
            pointer.y = y
            pointer.inside = x >= 0 && y >= 0 && x <= cssW && y <= cssH
        }
        const onLeave = () => {
            pointer.inside = false
        }

        if (!frozen) {
            window.addEventListener("pointermove", onPointer, { passive: true })
            window.addEventListener("pointerdown", onPointer, { passive: true })
            window.addEventListener("blur", onLeave)
            document.documentElement.addEventListener("pointerleave", onLeave)
        }

        const resizeObserver = new ResizeObserver(() => {
            cssW = host.clientWidth || cssW
            cssH = host.clientHeight || cssH
            if (frozen) render(0)
        })
        resizeObserver.observe(host)

        /* ---- loop ---------------------------------------------------- */

        let raf = 0
        let visible = true
        let last = performance.now()

        const frame = (now: number) => {
            if (!visible) {
                raf = 0
                return
            }
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            render(dt)
            raf = requestAnimationFrame(frame)
        }

        let io: IntersectionObserver | null = null
        if (frozen) {
            render(0)
        } else {
            raf = requestAnimationFrame(frame)
            // Pause rendering while scrolled out of view
            io = new IntersectionObserver(([entry]) => {
                visible = entry.isIntersecting
                if (visible && !raf) {
                    last = performance.now()
                    raf = requestAnimationFrame(frame)
                }
            })
            io.observe(host)
        }

        return () => {
            redrawRef.current = null
            cancelAnimationFrame(raf)
            resizeObserver.disconnect()
            io?.disconnect()
            window.removeEventListener("pointermove", onPointer)
            window.removeEventListener("pointerdown", onPointer)
            window.removeEventListener("blur", onLeave)
            document.documentElement.removeEventListener(
                "pointerleave",
                onLeave
            )
            gl.deleteBuffer(buffer)
            gl.deleteProgram(program)
            gl.deleteShader(vs)
            gl.deleteShader(fs)
        }
    }, [isStatic])

    return (
        <div
            ref={hostRef}
            style={{
                position: "relative",
                overflow: "hidden",
                width: "100%",
                height: "100%",
                background,
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

GridTrails.displayName = "Grid Trails"

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

addPropertyControls(GridTrails, {
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Lines",
        defaultValue: "#0F0F0F",
    },
    accent: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "#4D17FF",
    },
    cellSize: {
        type: ControlType.Number,
        title: "Cell Width",
        defaultValue: 110,
        min: 24,
        max: 400,
        step: 1,
        unit: "px",
    },
    cellShape: {
        type: ControlType.Number,
        title: "Cell Shape",
        description: "Height ÷ width. 1 = square cells.",
        defaultValue: 1,
        min: 0.25,
        max: 4,
        step: 0.05,
    },
    lights: {
        type: ControlType.Number,
        title: "Lights",
        defaultValue: 8,
        min: 1,
        max: MAX_WALKERS,
        step: 1,
        displayStepper: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 50,
        min: 0,
        max: 200,
        step: 1,
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail",
        defaultValue: 2,
        min: 1,
        max: MAX_TRAIL,
        step: 1,
        displayStepper: true,
    },
    glow: {
        type: ControlType.Number,
        title: "Glow Size",
        defaultValue: 92,
        min: 10,
        max: 300,
        step: 1,
        unit: "%",
    },
    hover: {
        type: ControlType.Number,
        title: "Hover Light",
        defaultValue: 100,
        min: 0,
        max: 200,
        step: 1,
        unit: "%",
    },
})
