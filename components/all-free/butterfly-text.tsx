import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Wing = "round" | "swallowtail" | "moth" | "longwing"
type WingMix = "assorted" | Wing
type Mood = "scatter" | "follow" | "gather"
type ArrivalStyle = "flyIn" | "perched"

interface LayoutCfg {
    autoFit: boolean
    fit: number
    floor: number
    ceiling: number
    align: "left" | "center" | "right"
    inset: number
}
interface SwarmCfg {
    count: number
    size: number
    wings: WingMix
    colors: string[]
    edge: string
    spots: string
    body: string
}
interface BehaviourCfg {
    mood: Mood
    reach: number
    speed: number
    settle: number
    gather: number
    wander: number
    rest: boolean
    tapBurst: boolean
}
interface ArrivalCfg {
    style: ArrivalStyle
    stagger: number
}
interface Cfg {
    text: string
    font: any
    ink: string
    paper: string
    layout: LayoutCfg
    swarm: SwarmCfg
    behaviour: BehaviourCfg
    arrival: ArrivalCfg
    style?: React.CSSProperties
}

const HUES = ["#F28C38", "#3E7BD6", "#F2C230", "#E35D7A", "#6DBE9A", "#9A6BD8"]

const BASE: Cfg = {
    text: "Take flight",
    font: {
        fontSize: 100,
        fontWeight: 700,
        lineHeight: "1.08em",
        letterSpacing: "-0.03em",
    },
    ink: "#1C2430",
    paper: "#EAF0F2",
    layout: {
        autoFit: true,
        fit: 16,
        floor: 28,
        ceiling: 210,
        align: "center",
        inset: 48,
    },
    swarm: {
        count: 14,
        size: 0.42,
        wings: "assorted",
        colors: HUES,
        edge: "#1C1A22",
        spots: "#FFFDF6",
        body: "#231F1C",
    },
    behaviour: {
        mood: "scatter",
        reach: 0.9,
        speed: 1,
        settle: 1.6,
        gather: 4,
        wander: 0.5,
        rest: true,
        tapBurst: true,
    },
    arrival: { style: "flyIn", stagger: 2.2 },
}

function settle(p: Partial<Cfg>): Cfg {
    return {
        ...BASE,
        ...p,
        font: p.font || BASE.font,
        layout: { ...BASE.layout, ...(p.layout || {}) },
        swarm: { ...BASE.swarm, ...(p.swarm || {}) },
        behaviour: { ...BASE.behaviour, ...(p.behaviour || {}) },
        arrival: { ...BASE.arrival, ...(p.arrival || {}) },
    } as Cfg
}

function hostStyle(c: Cfg): React.CSSProperties {
    return {
        ...(c.style || {}),
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: c.paper,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: c.layout.inset,
        boxSizing: "border-box",
        containerType: "inline-size",
    } as React.CSSProperties
}

function typeStyle(c: Cfg): React.CSSProperties {
    const f = c.font || {}
    const L = c.layout
    return {
        fontFamily: "system-ui, sans-serif",
        ...f,
        fontSize: L.autoFit
            ? `clamp(${L.floor}px, ${L.fit}cqi, ${L.ceiling}px)`
            : (f.fontSize ?? 100),
        color: c.ink,
        textAlign: L.align,
        margin: 0,
        width: "100%",
        position: "relative",
    }
}

/* ─────────────── static view ─────────────── */

function Still({ cfg }: { cfg: Cfg }) {
    return (
        <div style={hostStyle(cfg)}>
            <div style={{ ...typeStyle(cfg), whiteSpace: "pre-line" }}>
                {cfg.text}
            </div>
        </div>
    )
}

/* ─────────────── wing library (unit space, right side, head at -y) ─────────────── */

type WingDef = {
    d: string
    patch: number[]
    spots: number[][]
    veins: number[][]
}
type Shape = { fore: WingDef; hind: WingDef }

const SHAPES: Record<Wing, Shape> = {
    round: {
        fore: {
            d: "M0.02 -0.06 C0.30 -0.70 0.92 -0.90 1.00 -0.52 C1.04 -0.22 0.62 -0.02 0.04 0.02 Z",
            patch: [0.55, -0.42, 0.2, 0.12, -0.5],
            spots: [
                [0.86, -0.62, 0.045],
                [0.93, -0.44, 0.035],
                [0.76, -0.76, 0.03],
            ],
            veins: [
                [0.04, -0.02, 0.85, -0.6],
                [0.04, -0.02, 0.72, -0.2],
                [0.04, -0.04, 0.58, -0.72],
            ],
        },
        hind: {
            d: "M0.03 0.00 C0.55 -0.02 0.88 0.30 0.70 0.62 C0.52 0.88 0.14 0.66 0.02 0.18 Z",
            patch: [0.45, 0.3, 0.16, 0.12, 0.6],
            spots: [
                [0.64, 0.58, 0.04],
                [0.74, 0.42, 0.03],
            ],
            veins: [
                [0.04, 0.04, 0.6, 0.55],
                [0.04, 0.04, 0.76, 0.3],
            ],
        },
    },
    swallowtail: {
        fore: {
            d: "M0.02 -0.06 C0.25 -0.62 0.80 -0.98 1.06 -0.80 C1.00 -0.46 0.60 -0.06 0.04 0.02 Z",
            patch: [0.5, -0.4, 0.22, 0.1, -0.7],
            spots: [
                [0.95, -0.74, 0.04],
                [0.86, -0.58, 0.035],
                [0.74, -0.44, 0.03],
            ],
            veins: [
                [0.04, -0.02, 0.95, -0.76],
                [0.04, -0.02, 0.7, -0.22],
                [0.04, -0.04, 0.5, -0.66],
            ],
        },
        hind: {
            d: "M0.03 0.00 C0.50 0.00 0.78 0.25 0.66 0.55 L0.56 1.02 C0.50 1.08 0.44 1.02 0.46 0.70 C0.30 0.74 0.10 0.58 0.02 0.18 Z",
            patch: [0.4, 0.3, 0.15, 0.12, 0.5],
            spots: [
                [0.6, 0.5, 0.045],
                [0.5, 0.64, 0.035],
            ],
            veins: [
                [0.04, 0.04, 0.6, 0.52],
                [0.04, 0.04, 0.5, 0.9],
            ],
        },
    },
    moth: {
        fore: {
            d: "M0.02 -0.10 C0.35 -0.52 0.90 -0.58 1.05 -0.30 C1.02 -0.05 0.55 0.08 0.04 0.04 Z",
            patch: [0.6, -0.26, 0.24, 0.1, -0.2],
            spots: [
                [0.92, -0.3, 0.04],
                [0.82, -0.4, 0.03],
            ],
            veins: [
                [0.04, -0.04, 0.95, -0.32],
                [0.04, -0.02, 0.7, 0.0],
                [0.04, -0.06, 0.6, -0.48],
            ],
        },
        hind: {
            d: "M0.03 0.02 C0.40 0.02 0.70 0.18 0.60 0.40 C0.45 0.55 0.15 0.45 0.02 0.16 Z",
            patch: [0.38, 0.22, 0.1, 0.1, 0],
            spots: [[0.38, 0.22, 0.05]],
            veins: [[0.04, 0.04, 0.55, 0.36]],
        },
    },
    longwing: {
        fore: {
            d: "M0.02 -0.05 C0.30 -0.45 0.95 -0.70 1.18 -0.50 C1.10 -0.34 0.55 -0.06 0.04 0.02 Z",
            patch: [0.62, -0.34, 0.28, 0.07, -0.4],
            spots: [
                [1.08, -0.5, 0.035],
                [0.98, -0.56, 0.03],
            ],
            veins: [
                [0.04, -0.02, 1.08, -0.5],
                [0.04, -0.02, 0.7, -0.14],
            ],
        },
        hind: {
            d: "M0.03 0.00 C0.45 0.02 0.80 0.18 0.72 0.40 C0.58 0.56 0.18 0.42 0.02 0.15 Z",
            patch: [0.42, 0.2, 0.18, 0.06, 0.3],
            spots: [[0.66, 0.36, 0.03]],
            veins: [[0.04, 0.04, 0.68, 0.36]],
        },
    },
}
const WING_LIST: Wing[] = ["round", "swallowtail", "moth", "longwing"]

let pathBank: Map<string, Path2D> | null = null
function pathOf(d: string): Path2D {
    if (!pathBank) pathBank = new Map()
    let p = pathBank.get(d)
    if (!p) {
        p = new Path2D(d)
        pathBank.set(d, p)
    }
    return p
}

function paintable(c: string): string {
    const m = (c || "").match(/^var\(\s*--[^,]+,\s*(.+)\)$/)
    return m ? m[1].trim() : c || "#000"
}

/* ─────────────── flight model ─────────────── */

const TAU = Math.PI * 2
const STEP = 1 / 120
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const twist = (a: number, b: number) =>
    Math.atan2(Math.sin(b - a), Math.cos(b - a))
const turn = (a: number, b: number, t: number) =>
    a + twist(a, b) * Math.min(1, t)

type Perch = { g: number; u: number; v: number; a: number }
type Cell = { x: number; y: number; w: number; h: number; perches: Perch[] }

type Bug = {
    x: number
    y: number
    vx: number
    vy: number
    head: number
    roll: number
    c1: number
    c2: number
    sm: number
    mode: 0 | 1 | 2 | 3 // perched, homing, free, waiting offstage
    perch: Perch | null
    freeUntil: number
    follow: boolean
    landNear: boolean
    orbit: number
    phase: number
    open: number
    air: number
    seed: number
    hopAt: number
    wakeAt: number
    alpha: number
}

class Flight {
    cells: Cell[] = []
    perches: Perch[] = []
    bugs: Bug[] = []
    key = ""
    fp = 64
    w = 0
    h = 0
    dpr = 1
    ptr = { x: 0, y: 0, in: false, sp: 0, movedAt: 0, t: 0 }
    clock = 0
    acc = 0
    last = 0
    raf = 0
    live = false
    open = false
    seeded = false
    lastGather = -1
    still = false
    ctx: CanvasRenderingContext2D | null = null
    sheen: CanvasGradient | null = null
    scratch: HTMLCanvasElement | null = null
    sctx: CanvasRenderingContext2D | null = null
    surfaceCache = new Map<string, { u: number; v: number; a: number }[]>()

    constructor(
        public cfg: () => Cfg,
        public calm: () => boolean
    ) {}

    /* loop */
    start = () => {
        if (this.live || !this.open || !this.cells.length) return
        this.live = true
        this.last = 0
        this.raf = requestAnimationFrame(this.tick)
    }
    halt = () => {
        if (this.raf) cancelAnimationFrame(this.raf)
        this.raf = 0
        this.live = false
    }
    tick = (now: number) => {
        if (!this.open) {
            this.live = false
            this.raf = 0
            return
        }
        const dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 1 / 60
        this.last = now
        this.acc += dt
        let n = 0
        while (this.acc >= STEP && n < 8) {
            this.step(STEP)
            this.acc -= STEP
            n++
        }
        if (n >= 8) this.acc = 0
        this.render()
        if (this.open && this.busy())
            this.raf = requestAnimationFrame(this.tick)
        else {
            this.live = false
            this.raf = 0
        }
    }
    busy(): boolean {
        if (!this.seeded) return true
        const B = this.cfg().behaviour
        const anyAir = this.bugs.some((b) => b.mode !== 0 || b.alpha < 1)
        if (this.calm()) return anyAir
        return anyAir || B.rest || B.wander > 0
    }

    /* geometry */
    span(c: Cfg) {
        return c.swarm.size * this.fp
    }
    anchor(p: Perch): [number, number] | null {
        const g = this.cells[p.g]
        if (!g) return null
        return [g.x + p.u * g.w, g.y + p.v * g.h]
    }
    restOf(p: Perch | null, R: number): [number, number] | null {
        if (!p) return null
        const a = this.anchor(p)
        if (!a) return null
        return [
            a[0] + Math.cos(p.a) * R * 0.38,
            a[1] + Math.sin(p.a) * R * 0.38,
        ]
    }
    hopGap(B: BehaviourCfg) {
        return (12 + Math.random() * 24) / Math.max(0.05, B.wander)
    }

    surface(
        ch: string,
        font: string,
        gw: number,
        gh: number,
        base: number,
        fp: number
    ) {
        const ck = `${font}|${ch}|${Math.round(gw)}|${Math.round(gh)}`
        const hit = this.surfaceCache.get(ck)
        if (hit) return hit
        if (!this.scratch) {
            this.scratch = document.createElement("canvas")
            this.sctx = this.scratch.getContext("2d", {
                willReadFrequently: true,
            } as any) as CanvasRenderingContext2D
        }
        const ctx = this.sctx
        const out: { u: number; v: number; a: number }[] = []
        if (!ctx || gw <= 0 || gh <= 0 || !ch.trim()) {
            this.surfaceCache.set(ck, out)
            return out
        }
        const over = fp * 0.2
        const sc = Math.min(1, 100 / Math.max(gh, 1))
        const W = Math.ceil((gw + over * 2) * sc) + 4
        const H = Math.ceil((gh + over * 2) * sc) + 4
        this.scratch!.width = W
        this.scratch!.height = H
        ctx.setTransform(sc, 0, 0, sc, 2 + over * sc, 2 + over * sc)
        ctx.font = font
        ctx.textBaseline = "alphabetic"
        ctx.fillStyle = "#000"
        ctx.fillText(ch, 0, base)
        const px = ctx.getImageData(0, 0, W, H).data
        const step = Math.max(1, Math.round(fp * 0.06 * sc))
        const tops: number[] = []
        for (let x = 0; x < W; x += step) {
            let top = -1
            for (let y = 0; y < H; y++) {
                if (px[(y * W + x) * 4 + 3] >= 128) {
                    top = y
                    break
                }
            }
            tops.push(top)
        }
        for (let i = 1; i < tops.length - 1; i++) {
            const t = tops[i]
            const l = tops[i - 1]
            const r = tops[i + 1]
            if (t < 0 || l < 0 || r < 0) continue
            const slope = (r - l) / (2 * step)
            if (Math.abs(slope) > 1.3) continue
            const x = i * step
            out.push({
                u: ((x - 2) / sc - over) / gw,
                v: ((t - 2) / sc - over) / gh,
                a: Math.atan2(-1, slope),
            })
        }
        if (this.surfaceCache.size > 500) this.surfaceCache.clear()
        this.surfaceCache.set(ck, out)
        return out
    }

    /* perch selection */
    choose(
        b: Bug,
        how: "any" | "hop" | "far" | "near",
        only = -1
    ): Perch | null {
        const pool =
            only >= 0 && this.cells[only]
                ? this.cells[only].perches
                : this.perches
        if (!pool.length) return null
        const S = this.span(this.cfg())
        const gap2 = S * 0.78 * (S * 0.78)
        const taken: number[][] = []
        for (const o of this.bugs) {
            if (o === b || !o.perch || o.mode === 2) continue
            const a = this.anchor(o.perch)
            if (a) taken.push(a)
        }
        const tries = only >= 0 ? pool.length : Math.min(pool.length, 70)
        let best: Perch | null = null
        let bestScore = -Infinity
        for (let i = 0; i < tries; i++) {
            const p =
                only >= 0 ? pool[i] : pool[(Math.random() * pool.length) | 0]
            const a = this.anchor(p)
            if (!a) continue
            let ok = true
            for (const t of taken) {
                const dx = t[0] - a[0]
                const dy = t[1] - a[1]
                if (dx * dx + dy * dy < gap2) {
                    ok = false
                    break
                }
            }
            if (!ok) continue
            let s = Math.random()
            const fp = this.fp
            if (how === "hop")
                s = -Math.hypot(a[0] - b.x, a[1] - b.y) / fp + Math.random() * 2
            else if (how === "far" && this.ptr.in)
                s =
                    Math.hypot(a[0] - this.ptr.x, a[1] - this.ptr.y) / fp +
                    Math.random() * 1.5
            else if (how === "near")
                s =
                    -Math.hypot(a[0] - this.ptr.x, a[1] - this.ptr.y) / fp +
                    Math.random() * 0.6
            else if (only >= 0) s = Math.random()
            if (s > bestScore) {
                bestScore = s
                best = p
            }
        }
        return best
    }

    lift(b: Bug, dx: number, dy: number, power: number) {
        const B = this.cfg().behaviour
        const l = Math.hypot(dx, dy) || 1
        b.mode = 2
        b.perch = null
        b.vx = (dx / l) * power
        b.vy = (dy / l) * power - power * 0.5
        b.freeUntil =
            this.clock + Math.max(0.2, B.settle) * (0.7 + Math.random() * 0.6)
        b.phase = 0
    }

    burst(x: number, y: number) {
        const c = this.cfg()
        const maxV = this.fp * 4.2 * c.behaviour.speed
        for (const b of this.bugs) {
            if (b.mode === 3) continue
            const dx = b.x - x || Math.random() - 0.5
            const dy = b.y - y || -1
            this.lift(b, dx, dy, maxV * (0.9 + Math.random() * 0.5))
            b.follow = false
        }
        this.lastGather = -1
    }

    gatherAt(x: number, y: number) {
        const c = this.cfg()
        const pad = this.fp * 0.1
        let gi = -1
        for (let i = 0; i < this.cells.length; i++) {
            const g = this.cells[i]
            if (
                x >= g.x - pad &&
                x <= g.x + g.w + pad &&
                y >= g.y - pad &&
                y <= g.y + g.h + pad
            ) {
                gi = i
                break
            }
        }
        if (gi === this.lastGather) return
        this.lastGather = gi
        if (gi < 0 || !this.cells[gi].perches.length) return
        const g = this.cells[gi]
        const cx = g.x + g.w / 2
        const cy = g.y + g.h / 2
        const callable = this.bugs
            .filter((b) => b.mode !== 3 && !(b.perch && b.perch.g === gi))
            .sort(
                (a, b) =>
                    Math.hypot(a.x - cx, a.y - cy) -
                    Math.hypot(b.x - cx, b.y - cy)
            )
        const n = Math.max(0, Math.round(c.behaviour.gather))
        const maxV = this.fp * 4.2 * c.behaviour.speed
        for (let i = 0; i < callable.length && i < n; i++) {
            const b = callable[i]
            const p = this.choose(b, "any", gi)
            if (!p) break
            if (b.mode === 0) {
                b.vx = 0
                b.vy = -maxV * 0.5
                b.phase = 0
            }
            b.perch = p
            b.mode = 1
            b.follow = false
        }
    }

    populate(c: Cfg, calm: boolean) {
        if (!this.cells.length || !this.perches.length) return
        const want = Math.max(0, Math.round(c.swarm.count))
        if (this.bugs.length > want) this.bugs.length = want
        const first = !this.seeded
        const S = this.span(c)
        const maxV = this.fp * 4.2 * c.behaviour.speed
        for (let i = this.bugs.length; i < want; i++) {
            const b: Bug = {
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                head: -Math.PI / 2,
                roll: Math.random(),
                c1: (Math.random() * 997) | 0,
                c2: (Math.random() * 997) | 0,
                sm: 0.8 + Math.random() * 0.4,
                mode: 0,
                perch: null,
                freeUntil: 0,
                follow: false,
                landNear: false,
                orbit: Math.random() * TAU,
                phase: Math.random() * TAU,
                open: 1,
                air: 0,
                seed: Math.random(),
                hopAt: 0,
                wakeAt: 0,
                alpha: 1,
            }
            b.hopAt = this.clock + this.hopGap(c.behaviour)
            this.bugs.push(b)
            b.perch = this.choose(b, "any")
            const R = S * 0.5 * b.sm
            const flyIn = !calm && (!first || c.arrival.style === "flyIn")
            if (!b.perch) {
                b.mode = 2
                b.x = Math.random() * this.w
                b.y = Math.random() * this.h
                b.freeUntil = this.clock + 1
            } else if (flyIn) {
                const side = (Math.random() * 4) | 0
                const m = R * 2.5
                b.x =
                    side === 0
                        ? -m
                        : side === 1
                          ? this.w + m
                          : Math.random() * this.w
                b.y =
                    side === 2
                        ? -m
                        : side === 3
                          ? this.h + m
                          : Math.random() * this.h
                const rest = this.restOf(b.perch, R)
                if (rest) {
                    b.head = Math.atan2(rest[1] - b.y, rest[0] - b.x)
                    b.vx = Math.cos(b.head) * maxV * 0.5
                    b.vy = Math.sin(b.head) * maxV * 0.5
                }
                b.air = 1
                b.mode = 3
                b.wakeAt =
                    this.clock +
                    (first
                        ? Math.max(0, c.arrival.stagger) *
                          (i / Math.max(1, want))
                        : 0) +
                    Math.random() * 0.25
            } else {
                const rest = this.restOf(b.perch, R)
                if (rest) {
                    b.x = rest[0]
                    b.y = rest[1]
                }
                b.head = b.perch.a
                b.mode = 0
                b.alpha = calm ? 1 : 0
            }
        }
        this.seeded = true
    }

    step(h: number) {
        const c = this.cfg()
        const calm = this.calm()
        this.clock += h
        this.populate(c, calm)
        const B = c.behaviour
        const S = this.span(c)
        const maxV = this.fp * 4.2 * B.speed
        const reach = B.reach * this.fp
        const p = this.ptr
        p.sp *= Math.exp(-6 * h)
        this.still = this.clock - p.movedAt > Math.max(0.2, B.settle)
        for (const b of this.bugs) {
            if (b.follow && (B.mood !== "follow" || !p.in || this.still)) {
                b.follow = false
                b.freeUntil = this.clock
                b.landNear = true
            }
        }
        for (const b of this.bugs) this.move(b, h, c, calm, S, maxV, reach)
    }

    move(
        b: Bug,
        h: number,
        c: Cfg,
        calm: boolean,
        S: number,
        maxV: number,
        reach: number
    ) {
        const B = c.behaviour
        const p = this.ptr
        const R = S * 0.5 * b.sm
        const flyRate = TAU * (7.5 + b.seed * 3) * (0.7 + 0.3 * B.speed)
        const restRate = TAU * (0.3 + b.seed * 0.35)
        b.phase += h * (b.mode === 0 ? restRate : flyRate)

        if (b.mode === 3) {
            if (this.clock >= b.wakeAt) b.mode = 1
            else return
        }
        if (b.alpha < 1) b.alpha = Math.min(1, b.alpha + h * 2.5)

        if (b.mode === 0) {
            const pos = this.restOf(b.perch, R)
            if (!pos) {
                b.mode = 2
                b.perch = null
                b.freeUntil = this.clock
                return
            }
            b.x = pos[0]
            b.y = pos[1]
            b.vx = 0
            b.vy = 0
            b.head = turn(
                b.head,
                (b.perch as Perch).a + (b.seed - 0.5) * 0.35,
                h * 6
            )
            b.air = Math.max(0, b.air - h * 4)
            b.open =
                B.rest && !calm
                    ? 1 - 0.85 * Math.pow(Math.max(0, Math.sin(b.phase)), 6)
                    : 1
            const d = p.in ? Math.hypot(b.x - p.x, b.y - p.y) : Infinity
            if (B.mood === "scatter" && d < reach) {
                this.lift(b, b.x - p.x, b.y - p.y, maxV * 1.1)
            } else if (
                B.mood === "follow" &&
                p.in &&
                !this.still &&
                p.sp > this.fp * 0.8 &&
                d < reach * 1.4
            ) {
                this.lift(b, 0, -1, maxV * 0.7)
                b.follow = true
            } else if (B.wander > 0 && !calm && this.clock > b.hopAt) {
                b.hopAt = this.clock + this.hopGap(B)
                const np = this.choose(b, "hop")
                if (np) {
                    b.perch = np
                    b.mode = 1
                    b.vy = -maxV * 0.4
                    b.phase = 0
                }
            }
            return
        }

        if (calm) {
            if (b.mode === 2) {
                const np = this.choose(
                    b,
                    b.landNear ? "near" : B.mood === "scatter" ? "far" : "any"
                )
                if (np) {
                    b.perch = np
                    b.mode = 1
                }
            }
            if (b.mode === 1) {
                const pos = this.restOf(b.perch, R)
                if (pos) {
                    b.x = pos[0]
                    b.y = pos[1]
                    b.head = (b.perch as Perch).a
                    b.mode = 0
                    b.landNear = false
                    b.air = 0
                    b.open = 1
                    b.alpha = 1
                } else {
                    b.mode = 2
                    b.perch = null
                }
            }
            return
        }

        let tx = NaN
        let ty = NaN
        if (b.mode === 1) {
            const pos = this.restOf(b.perch, R)
            if (!pos) {
                b.mode = 2
                b.perch = null
                b.freeUntil = this.clock
            } else {
                tx = pos[0]
                ty = pos[1]
            }
        }
        const pd = p.in ? Math.hypot(b.x - p.x, b.y - p.y) : Infinity
        if (
            B.mood === "follow" &&
            p.in &&
            !this.still &&
            pd < reach * 3 &&
            b.mode !== 0
        ) {
            b.follow = true
            b.mode = 2
            b.perch = null
            tx = NaN
        }
        if (b.mode === 2) {
            if (b.follow && p.in) {
                b.orbit += h * (1.3 + b.seed) * (b.seed > 0.5 ? 1 : -1)
                const r = reach * (0.45 + 0.45 * b.seed)
                tx = p.x + Math.cos(b.orbit) * r
                ty = p.y + Math.sin(b.orbit) * r * 0.7
            } else if (this.clock >= b.freeUntil) {
                const np = this.choose(
                    b,
                    b.landNear ? "near" : B.mood === "scatter" ? "far" : "any"
                )
                if (np) {
                    b.perch = np
                    b.mode = 1
                    b.landNear = false
                } else b.freeUntil = this.clock + 0.5
            }
        }

        let ax = 0
        let ay = 0
        let d = Infinity
        if (!isNaN(tx)) {
            const dx = tx - b.x
            const dy = ty - b.y
            d = Math.hypot(dx, dy)
            const want = Math.min(maxV, d * 3)
            if (d > 0.001) {
                ax += ((dx / d) * want - b.vx) * 5
                ay += ((dy / d) * want - b.vy) * 5
            }
        } else {
            const sp0 = Math.hypot(b.vx, b.vy)
            if (sp0 < maxV * 0.35) {
                ax += Math.cos(b.head) * maxV * 1.5
                ay += Math.sin(b.head) * maxV * 1.5
            }
            ax -= b.vx * 0.6
            ay -= b.vy * 0.6
        }

        const sp = Math.hypot(b.vx, b.vy) || 1
        const wob =
            Math.sin(this.clock * 1.9 + b.seed * 40) +
            0.6 * Math.sin(this.clock * 3.3 + b.seed * 13)
        const fade = isFinite(d) ? clamp(d / (R * 5), 0, 1) : 1
        ax += (-b.vy / sp) * wob * maxV * 1.1 * fade
        ay += (b.vx / sp) * wob * maxV * 1.1 * fade

        if (p.in && B.mood === "scatter") {
            const dx = b.x - p.x
            const dy = b.y - p.y
            const RR = reach * 1.4
            if (pd < RR && pd > 0.01) {
                const f = (1 - pd / RR) * maxV * 7
                ax += (dx / pd) * f
                ay += (dy / pd) * f
                if (b.mode === 1 && pd < reach) {
                    b.mode = 2
                    b.perch = null
                    b.freeUntil = this.clock + Math.max(0.2, B.settle) * 0.6
                }
            }
        }

        if (b.mode === 2) {
            const m = R * 1.2
            if (b.x < m) ax += (m - b.x) * 25
            if (b.x > this.w - m) ax -= (b.x - (this.w - m)) * 25
            if (b.y < m) ay += (m - b.y) * 25
            if (b.y > this.h - m) ay -= (b.y - (this.h - m)) * 25
        }

        b.vx += ax * h
        b.vy += ay * h
        const cap = maxV * 1.35
        const s2 = Math.hypot(b.vx, b.vy)
        if (s2 > cap) {
            b.vx *= cap / s2
            b.vy *= cap / s2
        }
        b.x += b.vx * h
        b.y += b.vy * h

        if (b.mode === 1 && d < R * 2 && b.perch)
            b.head = turn(b.head, b.perch.a, h * 8)
        else if (s2 > 4) b.head = turn(b.head, Math.atan2(b.vy, b.vx), h * 8)
        b.air = Math.min(1, b.air + h * 4)
        b.open = 0.5 + 0.5 * Math.cos(b.phase)
        if (b.mode === 1 && d < R * 1.6) b.open = b.open * 0.5 + 0.45

        if (b.mode === 1 && d < Math.max(1.5, R * 0.12)) {
            b.mode = 0
            b.landNear = false
            b.vx = 0
            b.vy = 0
            b.phase = Math.PI * 0.35
            b.hopAt = this.clock + this.hopGap(B)
        }
    }

    /* drawing */
    render() {
        const ctx = this.ctx
        if (!ctx) return
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
        ctx.globalAlpha = 1
        ctx.clearRect(0, 0, this.w, this.h)
        if (!this.cells.length) return
        if (!this.sheen) {
            const g = ctx.createRadialGradient(0.05, 0, 0, 0.05, 0, 1.05)
            g.addColorStop(0, "rgba(255,255,255,0.42)")
            g.addColorStop(0.55, "rgba(255,255,255,0.08)")
            g.addColorStop(1, "rgba(255,255,255,0)")
            this.sheen = g
        }
        const c = this.cfg()
        const S = this.span(c)
        const cols = (
            c.swarm.colors && c.swarm.colors.length ? c.swarm.colors : HUES
        ).map(paintable)
        const edge = paintable(c.swarm.edge)
        const spots = paintable(c.swarm.spots)
        const body = paintable(c.swarm.body)
        for (let pass = 0; pass < 2; pass++) {
            for (const b of this.bugs) {
                if ((b.mode === 0) !== (pass === 0)) continue
                this.drawBug(ctx, b, c, S, cols, edge, spots, body)
            }
        }
        ctx.globalAlpha = 1
    }

    drawBug(
        ctx: CanvasRenderingContext2D,
        b: Bug,
        c: Cfg,
        S: number,
        cols: string[],
        edge: string,
        spots: string,
        body: string
    ) {
        if (b.alpha <= 0.01) return
        const R = S * 0.5 * b.sm * (1 + 0.14 * b.air)
        const y = b.y - Math.sin(b.phase) * R * 0.1 * b.air
        if (b.air > 0.04) {
            ctx.globalAlpha = 0.13 * b.air * b.alpha
            ctx.fillStyle = "rgb(24,20,16)"
            ctx.beginPath()
            ctx.ellipse(
                b.x + R * 0.2,
                b.y + R * (0.5 + 0.7 * b.air),
                R * (0.25 + 0.55 * b.open),
                R * 0.16,
                0,
                0,
                TAU
            )
            ctx.fill()
        }
        ctx.globalAlpha = b.alpha
        ctx.save()
        ctx.translate(b.x, y)
        ctx.rotate(b.head + Math.PI / 2)
        ctx.scale(R, R)
        const kind: Wing =
            c.swarm.wings === "assorted"
                ? WING_LIST[Math.floor(b.roll * 4) % 4]
                : c.swarm.wings
        const shape = SHAPES[kind] || SHAPES.round
        const n = cols.length
        const c1 = cols[b.c1 % n]
        let c2 = cols[b.c2 % n]
        if (c2 === c1 && n > 1) c2 = cols[(b.c2 + 1) % n]
        const o = clamp(b.open, 0.07, 1)
        for (const side of [1, -1]) {
            ctx.save()
            ctx.scale(side * o, 1)
            this.wing(ctx, shape.hind, c1, c2, edge, spots)
            this.wing(ctx, shape.fore, c1, c2, edge, spots)
            ctx.restore()
        }
        ctx.fillStyle = body
        ctx.beginPath()
        ctx.ellipse(0, 0.22, 0.06, 0.3, 0, 0, TAU)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(0, -0.03, 0.085, 0.12, 0, 0, TAU)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(0, -0.18, 0.065, 0, TAU)
        ctx.fill()
        ctx.strokeStyle = body
        ctx.lineWidth = 0.025
        ctx.lineCap = "round"
        for (const side of [1, -1]) {
            ctx.beginPath()
            ctx.moveTo(0.02 * side, -0.22)
            ctx.quadraticCurveTo(0.1 * side, -0.45, 0.2 * side, -0.6)
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(0.2 * side, -0.6, 0.032, 0, TAU)
            ctx.fill()
        }
        ctx.restore()
    }

    wing(
        ctx: CanvasRenderingContext2D,
        def: WingDef,
        c1: string,
        c2: string,
        edge: string,
        spots: string
    ) {
        const path = pathOf(def.d)
        ctx.save()
        ctx.clip(path)
        ctx.fillStyle = c1
        ctx.fill(path)
        const ga = ctx.globalAlpha
        const q = def.patch
        ctx.globalAlpha = ga * 0.9
        ctx.fillStyle = c2
        ctx.beginPath()
        ctx.ellipse(q[0], q[1], q[2], q[3], q[4], 0, TAU)
        ctx.fill()
        ctx.globalAlpha = ga
        if (this.sheen) {
            ctx.fillStyle = this.sheen
            ctx.fill(path)
        }
        ctx.strokeStyle = "rgba(0,0,0,0.2)"
        ctx.lineWidth = 0.02
        ctx.beginPath()
        for (const v of def.veins) {
            ctx.moveTo(v[0], v[1])
            ctx.lineTo(v[2], v[3])
        }
        ctx.stroke()
        ctx.strokeStyle = edge
        ctx.lineWidth = 0.22
        ctx.stroke(path)
        ctx.fillStyle = spots
        for (const s of def.spots) {
            ctx.beginPath()
            ctx.arc(s[0], s[1], s[2], 0, TAU)
            ctx.fill()
        }
        ctx.restore()
        ctx.strokeStyle = edge
        ctx.lineWidth = 0.025
        ctx.stroke(path)
    }
}

/* ─────────────── live view ─────────────── */

function useCalm() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(q.matches)
        sync()
        q.addEventListener?.("change", sync)
        return () => q.removeEventListener?.("change", sync)
    }, [])
    return calm
}

const hidden: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}

function Aloft({ cfg }: { cfg: Cfg }) {
    const hostRef = useRef<HTMLDivElement>(null)
    const typeRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const cfgRef = useRef(cfg)
    cfgRef.current = cfg
    const calm = useCalm()
    const calmRef = useRef(calm)
    calmRef.current = calm
    const flightRef = useRef<Flight | null>(null)
    if (!flightRef.current)
        flightRef.current = new Flight(
            () => cfgRef.current,
            () => calmRef.current
        )
    const flight = flightRef.current

    const read = useCallback(() => {
        const host = hostRef.current
        const type = typeRef.current
        const cv = canvasRef.current
        if (!host || !type || !cv) return
        const f = flight
        const w = host.offsetWidth
        const h = host.offsetHeight
        if (w <= 0 || h <= 0) return
        const box = host.getBoundingClientRect()
        const k = box.width > 0 ? w / box.width : 1
        if (f.w && (f.w !== w || f.h !== h)) {
            const sx = w / f.w
            const sy = h / f.h
            for (const b of f.bugs) {
                if (b.mode !== 0) {
                    b.x *= sx
                    b.y *= sy
                }
            }
        }
        f.w = w
        f.h = h
        f.dpr = Math.min(2, window.devicePixelRatio || 1)
        const pw = Math.max(1, Math.round(w * f.dpr))
        const ph = Math.max(1, Math.round(h * f.dpr))
        if (cv.width !== pw) cv.width = pw
        if (cv.height !== ph) cv.height = ph
        if (!f.ctx) {
            f.ctx = cv.getContext("2d")
            f.sheen = null
        }

        const marks = Array.from(
            type.querySelectorAll<HTMLElement>("[data-ch]")
        )
        if (!marks.length) {
            f.cells = []
            f.perches = []
            f.bugs = []
            f.key = ""
            f.seeded = false
            f.render()
            return
        }
        const cs = getComputedStyle(marks[0])
        const fp = parseFloat(cs.fontSize) || 64
        const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
        if (!f.scratch) {
            f.scratch = document.createElement("canvas")
            f.sctx = f.scratch.getContext("2d", {
                willReadFrequently: true,
            } as any) as CanvasRenderingContext2D
        }
        if (!f.sctx) return
        f.sctx.setTransform(1, 0, 0, 1, 0, 0)
        f.sctx.font = font
        const m = f.sctx.measureText("Hg")
        const asc =
            (m as any).fontBoundingBoxAscent ??
            m.actualBoundingBoxAscent ??
            fp * 0.8
        const desc =
            (m as any).fontBoundingBoxDescent ??
            m.actualBoundingBoxDescent ??
            fp * 0.2

        const chars: string[] = []
        const cells: Cell[] = []
        marks.forEach((el, gi) => {
            const r = el.getBoundingClientRect()
            const gw = r.width * k
            const gh = r.height * k
            const ch = el.textContent || ""
            chars.push(ch)
            const base = (gh - (asc + desc)) / 2 + asc
            const surf = f.surface(ch, font, gw, gh, base, fp)
            cells.push({
                x: (r.left - box.left) * k,
                y: (r.top - box.top) * k,
                w: gw,
                h: gh,
                perches: surf.map((s) => ({ g: gi, u: s.u, v: s.v, a: s.a })),
            })
        })
        const key = chars.join("")
        if (key !== f.key) {
            f.key = key
            f.bugs = []
            f.seeded = false
            f.lastGather = -1
        }
        f.fp = fp
        f.cells = cells
        f.perches = cells.flatMap((c) => c.perches)
        f.render()
        f.start()
    }, [flight])

    useEffect(() => {
        read()
        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => read())
                : null
        if (ro && hostRef.current) ro.observe(hostRef.current)
        if (ro && typeRef.current) ro.observe(typeRef.current)
        const fonts = (document as any).fonts
        let alive = true
        fonts?.ready?.then(() => alive && read())
        const onFont = () => read()
        fonts?.addEventListener?.("loadingdone", onFont)
        return () => {
            alive = false
            ro?.disconnect()
            fonts?.removeEventListener?.("loadingdone", onFont)
        }
    }, [read])

    const fontSig = JSON.stringify(cfg.font || {})
    const L = cfg.layout
    useEffect(() => {
        read()
    }, [
        cfg.text,
        fontSig,
        L.autoFit,
        L.fit,
        L.floor,
        L.ceiling,
        L.align,
        L.inset,
        read,
    ])

    // visibility gate — starts closed
    useEffect(() => {
        const el = hostRef.current
        if (!el) return
        let seen = typeof IntersectionObserver === "undefined"
        let shown = typeof document === "undefined" ? true : !document.hidden
        const sync = () => {
            const ok = seen && shown
            if (ok === flight.open) return
            flight.open = ok
            if (ok) flight.start()
            else {
                flight.halt()
                flight.ptr.in = false
                flight.lastGather = -1
            }
        }
        let io: IntersectionObserver | null = null
        if (!seen) {
            io = new IntersectionObserver((entries) => {
                for (const en of entries) seen = en.isIntersecting
                sync()
            })
            io.observe(el)
        }
        const onVis = () => {
            shown = !document.hidden
            sync()
        }
        document.addEventListener("visibilitychange", onVis)
        sync()
        return () => {
            io?.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            flight.open = false
            flight.halt()
        }
    }, [flight])

    useEffect(() => {
        flight.start()
    }, [cfg, calm, flight])

    const at = (ev: React.PointerEvent): [number, number] => {
        const host = hostRef.current as HTMLDivElement
        const box = host.getBoundingClientRect()
        const k = box.width > 0 ? host.offsetWidth / box.width : 1
        return [(ev.clientX - box.left) * k, (ev.clientY - box.top) * k]
    }

    const onMove = (ev: React.PointerEvent) => {
        const f = flight
        if (!f.open || !f.cells.length || !hostRef.current) return
        const [x, y] = at(ev)
        const p = f.ptr
        const dt = Math.max(0.008, (ev.timeStamp - p.t) / 1000)
        const v = p.in ? Math.hypot(x - p.x, y - p.y) / dt : 0
        p.sp = p.sp * 0.6 + v * 0.4
        if (v > f.fp * 0.3 || !p.in) p.movedAt = f.clock
        p.x = x
        p.y = y
        p.t = ev.timeStamp
        p.in = true
        if (cfgRef.current.behaviour.mood === "gather") f.gatherAt(x, y)
        f.start()
    }
    const onDown = (ev: React.PointerEvent) => {
        onMove(ev)
        const f = flight
        if (!f.open || !cfgRef.current.behaviour.tapBurst) return
        f.burst(f.ptr.x, f.ptr.y)
        f.start()
    }
    const onLeave = () => {
        flight.ptr.in = false
        flight.lastGather = -1
    }
    const onUp = (ev: React.PointerEvent) => {
        if (ev.pointerType !== "mouse") onLeave()
    }

    const letters = useMemo(() => {
        let gi = 0
        return (cfg.text || "").split("\n").map((line, li) => (
            <React.Fragment key={li}>
                {li > 0 && <br />}
                {line.split(/(\s+)/).map((tok, ti) => {
                    if (!tok) return null
                    if (/^\s+$/.test(tok))
                        return <React.Fragment key={ti}>{tok}</React.Fragment>
                    return (
                        <span
                            key={ti}
                            style={{
                                display: "inline-block",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {Array.from(tok).map((ch, ci) => (
                                <span
                                    key={ci}
                                    data-ch={gi++}
                                    style={{
                                        display: "inline-block",
                                        whiteSpace: "pre",
                                    }}
                                >
                                    {ch}
                                </span>
                            ))}
                        </span>
                    )
                })}
            </React.Fragment>
        ))
    }, [cfg.text])

    return (
        <div
            ref={hostRef}
            style={hostStyle(cfg)}
            onPointerMove={onMove}
            onPointerDown={onDown}
            onPointerLeave={onLeave}
            onPointerUp={onUp}
            onPointerCancel={onLeave}
        >
            <span style={hidden}>{cfg.text}</span>
            <div ref={typeRef} style={typeStyle(cfg)} aria-hidden="true">
                {letters}
            </div>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

/* ─────────────── entry ─────────────── */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Volitant(props: Partial<Cfg>) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <Still cfg={settle(props)} />
    return <Aloft cfg={settle(props)} />
}

addPropertyControls(Volitant, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: BASE.text,
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: BASE.font,
    },
    ink: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: BASE.ink,
    },
    paper: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: BASE.paper,
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            autoFit: {
                type: ControlType.Boolean,
                title: "Auto Fit",
                defaultValue: BASE.layout.autoFit,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            fit: {
                type: ControlType.Number,
                title: "Fit",
                defaultValue: BASE.layout.fit,
                min: 2,
                max: 40,
                step: 0.5,
                unit: "%",
                hidden: (v: any) => v?.autoFit === false,
            },
            floor: {
                type: ControlType.Number,
                title: "Min Size",
                defaultValue: BASE.layout.floor,
                min: 8,
                max: 200,
                step: 1,
                unit: "px",
                hidden: (v: any) => v?.autoFit === false,
            },
            ceiling: {
                type: ControlType.Number,
                title: "Max Size",
                defaultValue: BASE.layout.ceiling,
                min: 16,
                max: 600,
                step: 1,
                unit: "px",
                hidden: (v: any) => v?.autoFit === false,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: BASE.layout.align,
                displaySegmentedControl: true,
            },
            inset: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: BASE.layout.inset,
                min: 0,
                max: 240,
                step: 1,
                unit: "px",
            },
        },
    },
    swarm: {
        type: ControlType.Object,
        title: "Butterflies",
        controls: {
            count: {
                type: ControlType.Number,
                title: "Count",
                defaultValue: BASE.swarm.count,
                min: 1,
                max: 40,
                step: 1,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: BASE.swarm.size,
                min: 0.15,
                max: 1,
                step: 0.01,
            },
            wings: {
                type: ControlType.Enum,
                title: "Wings",
                options: [
                    "assorted",
                    "round",
                    "swallowtail",
                    "moth",
                    "longwing",
                ],
                optionTitles: [
                    "Assorted",
                    "Round",
                    "Swallowtail",
                    "Moth",
                    "Longwing",
                ],
                defaultValue: BASE.swarm.wings,
            },
            colors: {
                type: ControlType.Array,
                title: "Colors",
                control: { type: ControlType.Color },
                defaultValue: HUES,
                maxCount: 12,
            },
            edge: {
                type: ControlType.Color,
                title: "Edge",
                defaultValue: BASE.swarm.edge,
            },
            spots: {
                type: ControlType.Color,
                title: "Spots",
                defaultValue: BASE.swarm.spots,
            },
            body: {
                type: ControlType.Color,
                title: "Body",
                defaultValue: BASE.swarm.body,
            },
        },
    },
    behaviour: {
        type: ControlType.Object,
        title: "Behaviour",
        controls: {
            mood: {
                type: ControlType.Enum,
                title: "On Hover",
                options: ["scatter", "follow", "gather"],
                optionTitles: ["Scatter", "Follow", "Gather"],
                defaultValue: BASE.behaviour.mood,
            },
            reach: {
                type: ControlType.Number,
                title: "Reach",
                defaultValue: BASE.behaviour.reach,
                min: 0.2,
                max: 3,
                step: 0.05,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: BASE.behaviour.speed,
                min: 0.3,
                max: 2.5,
                step: 0.05,
            },
            settle: {
                type: ControlType.Number,
                title: "Settle",
                defaultValue: BASE.behaviour.settle,
                min: 0.2,
                max: 6,
                step: 0.1,
                unit: "s",
            },
            gather: {
                type: ControlType.Number,
                title: "Per Letter",
                defaultValue: BASE.behaviour.gather,
                min: 1,
                max: 12,
                step: 1,
                hidden: (v: any) => v?.mood !== "gather",
            },
            wander: {
                type: ControlType.Number,
                title: "Wander",
                defaultValue: BASE.behaviour.wander,
                min: 0,
                max: 2,
                step: 0.05,
            },
            rest: {
                type: ControlType.Boolean,
                title: "Idle Flutter",
                defaultValue: BASE.behaviour.rest,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            tapBurst: {
                type: ControlType.Boolean,
                title: "Tap Burst",
                defaultValue: BASE.behaviour.tapBurst,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },
    arrival: {
        type: ControlType.Object,
        title: "Arrival",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["flyIn", "perched"],
                optionTitles: ["Fly In", "Already Perched"],
                defaultValue: BASE.arrival.style,
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: BASE.arrival.stagger,
                min: 0,
                max: 6,
                step: 0.1,
                unit: "s",
                hidden: (v: any) => v?.style === "perched",
            },
        },
    },
})
