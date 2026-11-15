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
import type { CSSProperties } from "react"

/*
 * ARACHNE — a crawling spider through a field of dots.
 *
 * A fully self contained canvas effect. No dependencies, no network calls,
 * no layout thrashing. When useIsStaticRenderer() reports a static context
 * (the Framer canvas, thumbnails, export) the animation loop, timers and
 * event listeners are never created — a single still frame is painted
 * instead. The same still frame is used for prefers-reduced-motion.
 *
 * Exported as a named export so static site generation can resolve it.
 */

const TAU = Math.PI * 2
const MAX_DOTS = 2600
const MAX_SPIDERS = 6

/* ------------------------------------------------------------------ */
/*  Math helpers                                                       */
/* ------------------------------------------------------------------ */

function clamp(value: number, lo: number, hi: number): number {
    return value < lo ? lo : value > hi ? hi : value
}

function smoothstep(t: number): number {
    return t * t * (3 - 2 * t)
}

/** Shortest signed distance between two angles, in radians. */
function shortAngle(a: number, b: number): number {
    let d = (a - b) % TAU
    if (d > Math.PI) d -= TAU
    else if (d < -Math.PI) d += TAU
    return d
}

/** Deterministic PRNG (mulberry32) so the dot field is stable per seed. */
function makeRng(seed: number): () => number {
    let a = seed >>> 0
    if (a === 0) a = 0x9e3779b9
    return function rng() {
        a = (a + 0x6d2b79f5) >>> 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/* ------------------------------------------------------------------ */
/*  Colour helpers                                                     */
/* ------------------------------------------------------------------ */

interface RGBA {
    r: number
    g: number
    b: number
    a: number
}

const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 1 }
const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 1 }
const colorCache = new Map<string, RGBA>()
let probeCtx: CanvasRenderingContext2D | null = null
let probeReady = false

function parseNormalized(input: string): RGBA | null {
    if (!input) return null
    if (input.charCodeAt(0) === 35 /* # */) {
        const h = input.slice(1)
        if (h.length === 3 || h.length === 4) {
            const r = parseInt(h[0] + h[0], 16)
            const g = parseInt(h[1] + h[1], 16)
            const b = parseInt(h[2] + h[2], 16)
            const a = h.length === 4 ? parseInt(h[3] + h[3], 16) / 255 : 1
            if (isNaN(r) || isNaN(g) || isNaN(b)) return null
            return { r, g, b, a }
        }
        if (h.length === 6 || h.length === 8) {
            const r = parseInt(h.slice(0, 2), 16)
            const g = parseInt(h.slice(2, 4), 16)
            const b = parseInt(h.slice(4, 6), 16)
            const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
            if (isNaN(r) || isNaN(g) || isNaN(b)) return null
            return { r, g, b, a }
        }
        return null
    }
    const open = input.indexOf("(")
    const close = input.lastIndexOf(")")
    if (open < 0 || close <= open) return null
    const parts = input.slice(open + 1, close).split(",")
    if (parts.length < 3) return null
    const r = parseFloat(parts[0])
    const g = parseFloat(parts[1])
    const b = parseFloat(parts[2])
    if (!isFinite(r) || !isFinite(g) || !isFinite(b)) return null
    let a = 1
    if (parts.length > 3) {
        const parsed = parseFloat(parts[3])
        a = isFinite(parsed) ? clamp(parsed, 0, 1) : 1
    }
    return { r, g, b, a }
}

/**
 * Resolve any CSS colour string Framer can hand us (hex, rgb, rgba, hsl,
 * named) into numeric channels by letting the browser normalise it.
 */
function resolveColor(input: string, fallback: RGBA): RGBA {
    if (typeof input !== "string" || input.length === 0) return fallback
    const cached = colorCache.get(input)
    if (cached) return cached

    let result = fallback
    if (!probeReady && typeof document !== "undefined") {
        probeReady = true
        try {
            const canvas = document.createElement("canvas")
            canvas.width = 1
            canvas.height = 1
            probeCtx = canvas.getContext("2d")
        } catch (e) {
            probeCtx = null
        }
    }
    if (probeCtx) {
        try {
            probeCtx.fillStyle = "#000000"
            probeCtx.fillStyle = input
            const normalized = probeCtx.fillStyle
            if (typeof normalized === "string") {
                const parsed = parseNormalized(normalized)
                if (parsed) result = parsed
            }
        } catch (e) {
            result = fallback
        }
        if (colorCache.size > 256) colorCache.clear()
        colorCache.set(input, result)
    }
    return result
}

function rgbaStr(c: RGBA, alphaMultiplier: number): string {
    const a = clamp(c.a * alphaMultiplier, 0, 1)
    return (
        "rgba(" +
        Math.round(c.r) +
        "," +
        Math.round(c.g) +
        "," +
        Math.round(c.b) +
        "," +
        a.toFixed(3) +
        ")"
    )
}

/* ------------------------------------------------------------------ */
/*  Simulation types                                                   */
/* ------------------------------------------------------------------ */

interface Dot {
    /** Base (undrifted) position. */
    bx: number
    by: number
    /** Live position, including drift. */
    x: number
    y: number
    size: number
    alpha: number
    phase: number
    /** Claimed by a spider leg. */
    taken: boolean
    /** Proximity highlight, 0–1. */
    glow: number
}

interface Leg {
    /** Resting angle around the body. */
    base: number
    side: number
    dot: Dot | null
    tipX: number
    tipY: number
    fromX: number
    fromY: number
    stepping: boolean
    t: number
    cooldown: number
}

interface Spider {
    x: number
    y: number
    prevX: number
    prevY: number
    heading: number
    legs: Leg[]
    lureX: number
    lureY: number
    wayX: number
    wayY: number
    wayTimer: number
    trail: number[]
    isCursorSpider: boolean
    seed: number
    rng: () => number
}

interface Grid {
    cols: number
    rows: number
    cellW: number
    cellH: number
    cells: Array<Dot | null>
}

interface Sim {
    width: number
    height: number
    dpr: number
    dots: Dot[]
    grid: Grid
    spiders: Spider[]
    time: number
    cursorX: number
    cursorY: number
    cursorSeen: boolean
    cursorInside: boolean
    lastCursorTime: number
    vignetteKey: string
    vignette: CanvasGradient | null
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

type DotShape = "square" | "circle"
type BodyShape = "square" | "circle" | "diamond"
type LegStyle = "straight" | "jointed" | "curved"
type FollowMode = "cursor" | "auto" | "hybrid"
type CursorSource = "page" | "component"

interface ArachneProps {
    background: string
    vignette: number
    vignetteColor: string

    dotDensity: number
    dotScatter: number
    dotShape: DotShape
    dotSize: number
    dotSizeVariation: number
    dotColor: string
    dotOpacity: number
    dotOpacityVariation: number
    twinkleAmount: number
    twinkleSpeed: number
    driftAmount: number
    driftSpeed: number
    proximityGlow: number
    proximityRadius: number

    spiderCount: number
    bodyShape: BodyShape
    bodySize: number
    bodyColor: string
    bodyGlow: number
    rotateBody: boolean

    legCount: number
    legStyle: LegStyle
    legColor: string
    legWidth: number
    legOpacity: number
    legFade: number
    legReach: number
    legSpread: number
    kneeLift: number
    stepDuration: number
    anchorColor: string
    anchorScale: number
    anchorGlow: number

    followMode: FollowMode
    followEase: number
    wanderSpeed: number
    idleDelay: number
    edgePadding: number
    cursorSource: CursorSource

    showTrail: boolean
    trailColor: string
    trailLength: number
    trailWidth: number

    additiveGlow: boolean
    seed: number
    maxDPR: number
    pauseOffscreen: boolean
    respectReducedMotion: boolean

    style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/*  Simulation                                                         */
/* ------------------------------------------------------------------ */

function createSim(): Sim {
    return {
        width: 0,
        height: 0,
        dpr: 1,
        dots: [],
        grid: { cols: 0, rows: 0, cellW: 1, cellH: 1, cells: [] },
        spiders: [],
        time: 0,
        cursorX: 0,
        cursorY: 0,
        cursorSeen: false,
        cursorInside: false,
        lastCursorTime: -1e9,
        vignetteKey: "",
        vignette: null,
    }
}

function buildDots(sim: Sim, p: ArachneProps) {
    // Legs point at dots, so any rebuild must drop stale references first.
    for (let s = 0; s < sim.spiders.length; s++) {
        const legs = sim.spiders[s].legs
        for (let i = 0; i < legs.length; i++) legs[i].dot = null
    }

    const w = sim.width
    const h = sim.height
    sim.dots = []
    sim.grid = { cols: 0, rows: 0, cellW: 1, cellH: 1, cells: [] }
    if (w < 2 || h < 2) return

    const area = w * h
    const target = clamp(
        Math.round((p.dotDensity / 100000) * area),
        4,
        MAX_DOTS
    )
    const ideal = Math.sqrt(area / target)
    const cols = clamp(Math.round(w / ideal), 1, 200)
    const rows = clamp(Math.round(h / ideal), 1, 200)
    const cellW = w / cols
    const cellH = h / rows

    const rng = makeRng(Math.round(p.seed) * 2654435761)
    const cells: Array<Dot | null> = new Array(cols * rows).fill(null)
    const scatter = clamp(p.dotScatter, 0, 1)

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const jx = (rng() - 0.5) * scatter * 0.98
            const jy = (rng() - 0.5) * scatter * 0.98
            const x = clamp((col + 0.5 + jx) * cellW, 0, w)
            const y = clamp((row + 0.5 + jy) * cellH, 0, h)
            const sizeRoll = rng()
            const alphaRoll = rng()
            const dot: Dot = {
                bx: x,
                by: y,
                x,
                y,
                size: Math.max(
                    0.4,
                    p.dotSize *
                        (1 - clamp(p.dotSizeVariation, 0, 1) * sizeRoll * 0.8)
                ),
                alpha: clamp(
                    p.dotOpacity *
                        (1 -
                            clamp(p.dotOpacityVariation, 0, 1) *
                                alphaRoll *
                                0.9),
                    0,
                    1
                ),
                phase: rng() * TAU,
                taken: false,
                glow: 0,
            }
            sim.dots.push(dot)
            cells[row * cols + col] = dot
        }
    }

    sim.grid = { cols, rows, cellW, cellH, cells }
}

function makeLegs(count: number, rng: () => number): Leg[] {
    const legs: Leg[] = []
    const n = clamp(Math.round(count), 3, 12)
    for (let i = 0; i < n; i++) {
        legs.push({
            base: (i / n) * TAU + (rng() - 0.5) * 0.12,
            side: i % 2 === 0 ? 1 : -1,
            dot: null,
            tipX: 0,
            tipY: 0,
            fromX: 0,
            fromY: 0,
            stepping: false,
            t: 1,
            cooldown: rng() * 0.3,
        })
    }
    return legs
}

function buildSpiders(sim: Sim, p: ArachneProps) {
    for (let i = 0; i < sim.dots.length; i++) sim.dots[i].taken = false

    const count = clamp(Math.round(p.spiderCount), 1, MAX_SPIDERS)
    const w = sim.width || 800
    const h = sim.height || 500
    const next: Spider[] = []

    for (let i = 0; i < count; i++) {
        const previous = sim.spiders[i]
        const seed = Math.round(p.seed) * 7919 + i * 104729 + 17
        const rng = makeRng(seed)
        const startX = count === 1 ? w * 0.5 : w * ((i + 0.5) / count)
        const startY = count === 1 ? h * 0.5 : h * (0.3 + 0.4 * rng())
        const spider: Spider = {
            x: previous ? clamp(previous.x, 0, w) : startX,
            y: previous ? clamp(previous.y, 0, h) : startY,
            prevX: previous ? previous.x : startX,
            prevY: previous ? previous.y : startY,
            heading: previous ? previous.heading : rng() * TAU,
            legs: makeLegs(p.legCount, rng),
            lureX: previous ? previous.lureX : startX,
            lureY: previous ? previous.lureY : startY,
            wayX: startX,
            wayY: startY,
            wayTimer: 0,
            trail: [],
            isCursorSpider: i === 0,
            seed,
            rng,
        }
        for (let l = 0; l < spider.legs.length; l++) {
            const leg = spider.legs[l]
            leg.tipX = spider.x + Math.cos(leg.base) * p.legReach * 0.5
            leg.tipY = spider.y + Math.sin(leg.base) * p.legReach * 0.5
            leg.fromX = leg.tipX
            leg.fromY = leg.tipY
        }
        next.push(spider)
    }

    sim.spiders = next
}

function sectorHalfAngle(p: ArachneProps, legCount: number): number {
    const n = Math.max(3, legCount)
    return (Math.PI / n) * clamp(0.4 + p.legSpread * 1.4, 0.2, 3)
}

function findAnchor(
    sim: Sim,
    spider: Spider,
    sectorAngle: number,
    p: ArachneProps,
    halfAngle: number
): Dot | null {
    const grid = sim.grid
    if (grid.cols === 0 || grid.rows === 0) return null

    const reach = Math.max(8, p.legReach)
    const minReach = reach * 0.14
    const preferred = reach * 0.7
    const span = Math.max(1, Math.min(grid.cellW, grid.cellH))
    const rings = clamp(Math.ceil(reach / span) + 1, 1, 16)
    const col0 = Math.floor(spider.x / grid.cellW)
    const row0 = Math.floor(spider.y / grid.cellH)

    let best: Dot | null = null
    let bestScore = Infinity

    for (let row = row0 - rings; row <= row0 + rings; row++) {
        if (row < 0 || row >= grid.rows) continue
        const rowOffset = row * grid.cols
        for (let col = col0 - rings; col <= col0 + rings; col++) {
            if (col < 0 || col >= grid.cols) continue
            const dot = grid.cells[rowOffset + col]
            if (!dot || dot.taken) continue

            const vx = dot.x - spider.x
            const vy = dot.y - spider.y
            const dist = Math.sqrt(vx * vx + vy * vy)
            if (dist > reach || dist < minReach) continue

            const deviation = Math.abs(
                shortAngle(Math.atan2(vy, vx), sectorAngle)
            )
            if (deviation > halfAngle) continue

            const score =
                deviation * reach * 0.85 + Math.abs(dist - preferred) * 0.6
            if (score < bestScore) {
                bestScore = score
                best = dot
            }
        }
    }

    return best
}

function pickWaypoint(spider: Spider, sim: Sim, p: ArachneProps) {
    const pad = clamp(p.edgePadding, 0, Math.min(sim.width, sim.height) * 0.45)
    const minX = pad
    const maxX = Math.max(pad + 1, sim.width - pad)
    const minY = pad
    const maxY = Math.max(pad + 1, sim.height - pad)
    const minTravel = Math.min(sim.width, sim.height) * 0.28

    let x = minX
    let y = minY
    for (let attempt = 0; attempt < 8; attempt++) {
        x = minX + spider.rng() * (maxX - minX)
        y = minY + spider.rng() * (maxY - minY)
        const dx = x - spider.lureX
        const dy = y - spider.lureY
        if (Math.sqrt(dx * dx + dy * dy) >= minTravel) break
    }

    spider.wayX = x
    spider.wayY = y
    spider.wayTimer = 3 + spider.rng() * 7
}

function stepSim(sim: Sim, p: ArachneProps, dt: number) {
    sim.time += dt

    const drift = Math.max(0, p.driftAmount)
    const driftSpeed = Math.max(0, p.driftSpeed)
    const dots = sim.dots
    for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        if (drift > 0 && driftSpeed > 0) {
            dot.x = dot.bx + Math.sin(sim.time * driftSpeed + dot.phase) * drift
            dot.y =
                dot.by +
                Math.cos(sim.time * driftSpeed * 0.9 + dot.phase * 1.7) * drift
        } else {
            dot.x = dot.bx
            dot.y = dot.by
        }
        dot.glow = 0
    }

    const reach = Math.max(8, p.legReach)
    const stepDuration = Math.max(0.05, p.stepDuration)
    const easeK = 1 - Math.pow(1 - clamp(p.followEase, 0.005, 1), dt * 60)
    const cursorUsable =
        p.followMode !== "auto" &&
        sim.cursorSeen &&
        (p.cursorSource === "page" || sim.cursorInside) &&
        (p.followMode === "cursor" ||
            sim.time - sim.lastCursorTime < Math.max(0, p.idleDelay))

    for (let s = 0; s < sim.spiders.length; s++) {
        const spider = sim.spiders[s]
        const legs = spider.legs
        const halfAngle = sectorHalfAngle(p, legs.length)

        let targetX: number
        let targetY: number

        if (cursorUsable && spider.isCursorSpider) {
            targetX = sim.cursorX
            targetY = sim.cursorY
            spider.lureX = sim.cursorX
            spider.lureY = sim.cursorY
        } else {
            spider.wayTimer -= dt
            const dx = spider.wayX - spider.lureX
            const dy = spider.wayY - spider.lureY
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 10 || spider.wayTimer <= 0) {
                pickWaypoint(spider, sim, p)
            } else {
                const move = Math.min(
                    Math.max(0, p.wanderSpeed) * 110 * dt,
                    dist
                )
                spider.lureX += (dx / dist) * move
                spider.lureY += (dy / dist) * move
            }
            targetX = spider.lureX
            targetY = spider.lureY
        }

        spider.prevX = spider.x
        spider.prevY = spider.y
        spider.x = clamp(spider.x + (targetX - spider.x) * easeK, 0, sim.width)
        spider.y = clamp(spider.y + (targetY - spider.y) * easeK, 0, sim.height)

        const vx = spider.x - spider.prevX
        const vy = spider.y - spider.prevY
        const speed = Math.sqrt(vx * vx + vy * vy)
        if (speed > 0.12) {
            const desired = Math.atan2(vy, vx)
            spider.heading +=
                shortAngle(desired, spider.heading) * Math.min(1, dt * 8)
        }

        let steppingCount = 0
        for (let i = 0; i < legs.length; i++) {
            if (legs[i].stepping) steppingCount++
        }
        const maxStepping = Math.max(1, Math.round(legs.length * 0.4))

        for (let i = 0; i < legs.length; i++) {
            const leg = legs[i]
            const sector = (p.rotateBody ? spider.heading : 0) + leg.base

            if (leg.cooldown > 0) leg.cooldown -= dt

            if (leg.stepping) {
                leg.t += dt / stepDuration
                if (leg.t >= 1) {
                    leg.t = 1
                    leg.stepping = false
                    leg.cooldown = 0.04 + spider.rng() * 0.12
                    steppingCount--
                }
            }

            if (!leg.stepping && leg.cooldown <= 0) {
                let needsStep = false
                let currentDist = 0
                if (!leg.dot) {
                    needsStep = true
                } else {
                    const dx = leg.dot.x - spider.x
                    const dy = leg.dot.y - spider.y
                    currentDist = Math.sqrt(dx * dx + dy * dy)
                    if (currentDist > reach || currentDist < reach * 0.12) {
                        needsStep = true
                    } else if (
                        Math.abs(
                            shortAngle(Math.atan2(dy, dx), sector)
                        ) >
                        halfAngle * 1.35
                    ) {
                        needsStep = true
                    }
                }

                if (needsStep && steppingCount < maxStepping) {
                    const found = findAnchor(sim, spider, sector, p, halfAngle)
                    if (found) {
                        if (leg.dot) leg.dot.taken = false
                        found.taken = true
                        leg.fromX = leg.tipX
                        leg.fromY = leg.tipY
                        leg.dot = found
                        leg.stepping = true
                        leg.t = 0
                        steppingCount++
                    } else {
                        leg.cooldown = 0.1 + spider.rng() * 0.15
                        // Nothing in range: let go rather than stretch forever.
                        if (leg.dot && currentDist > reach * 1.5) {
                            leg.dot.taken = false
                            leg.dot = null
                        }
                    }
                }
            }

            if (leg.dot) {
                if (leg.stepping) {
                    const t = clamp(leg.t, 0, 1)
                    const eased = smoothstep(t)
                    const dx = leg.dot.x - leg.fromX
                    const dy = leg.dot.y - leg.fromY
                    const len = Math.sqrt(dx * dx + dy * dy) || 1
                    const arc =
                        Math.sin(Math.PI * t) *
                        Math.min(len * 0.18, 26) *
                        leg.side
                    leg.tipX = leg.fromX + dx * eased + (-dy / len) * arc
                    leg.tipY = leg.fromY + dy * eased + (dx / len) * arc
                } else {
                    leg.tipX = leg.dot.x
                    leg.tipY = leg.dot.y
                }
            } else {
                const restX = spider.x + Math.cos(sector) * reach * 0.5
                const restY = spider.y + Math.sin(sector) * reach * 0.5
                const k = Math.min(1, dt * 6)
                leg.tipX += (restX - leg.tipX) * k
                leg.tipY += (restY - leg.tipY) * k
            }
        }

        if (p.showTrail) {
            const maxPoints = clamp(Math.round(p.trailLength), 2, 120)
            const n = spider.trail.length
            if (
                n < 2 ||
                Math.abs(spider.x - spider.trail[n - 2]) +
                    Math.abs(spider.y - spider.trail[n - 1]) >
                    2
            ) {
                spider.trail.push(spider.x, spider.y)
                while (spider.trail.length > maxPoints * 2) {
                    spider.trail.splice(0, 2)
                }
            }
        } else if (spider.trail.length > 0) {
            spider.trail.length = 0
        }
    }

    // Proximity highlight for dots close to any body.
    const glowRadius = Math.max(0, p.proximityRadius)
    if (p.proximityGlow > 0.001 && glowRadius > 1 && sim.grid.cols > 0) {
        const grid = sim.grid
        const span = Math.max(1, Math.min(grid.cellW, grid.cellH))
        const rings = clamp(Math.ceil(glowRadius / span) + 1, 1, 24)
        for (let s = 0; s < sim.spiders.length; s++) {
            const spider = sim.spiders[s]
            const col0 = Math.floor(spider.x / grid.cellW)
            const row0 = Math.floor(spider.y / grid.cellH)
            for (let row = row0 - rings; row <= row0 + rings; row++) {
                if (row < 0 || row >= grid.rows) continue
                const rowOffset = row * grid.cols
                for (let col = col0 - rings; col <= col0 + rings; col++) {
                    if (col < 0 || col >= grid.cols) continue
                    const dot = grid.cells[rowOffset + col]
                    if (!dot) continue
                    const dx = dot.x - spider.x
                    const dy = dot.y - spider.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist > glowRadius) continue
                    const intensity = 1 - dist / glowRadius
                    if (intensity > dot.glow) dot.glow = intensity
                }
            }
        }
    }
}

/* ------------------------------------------------------------------ */
/*  Rendering                                                          */
/* ------------------------------------------------------------------ */

function tracePath(
    ctx: CanvasRenderingContext2D,
    shape: BodyShape,
    x: number,
    y: number,
    radius: number,
    rotation: number
) {
    ctx.beginPath()
    if (shape === "circle") {
        ctx.arc(x, y, radius, 0, TAU)
        return
    }
    const angle = shape === "diamond" ? rotation + Math.PI / 4 : rotation
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const corners = [
        [-radius, -radius],
        [radius, -radius],
        [radius, radius],
        [-radius, radius],
    ]
    for (let i = 0; i < corners.length; i++) {
        const cx = x + corners[i][0] * cos - corners[i][1] * sin
        const cy = y + corners[i][0] * sin + corners[i][1] * cos
        if (i === 0) ctx.moveTo(cx, cy)
        else ctx.lineTo(cx, cy)
    }
    ctx.closePath()
}

function drawSim(ctx: CanvasRenderingContext2D, sim: Sim, p: ArachneProps) {
    const w = sim.width
    const h = sim.height
    if (w < 1 || h < 1) return

    const bg = resolveColor(p.background, BLACK)
    const dotRGBA = resolveColor(p.dotColor, WHITE)
    const legRGBA = resolveColor(p.legColor, WHITE)
    const bodyRGBA = resolveColor(p.bodyColor, WHITE)
    const anchorRGBA = resolveColor(p.anchorColor, WHITE)
    const trailRGBA = resolveColor(p.trailColor, WHITE)

    ctx.setTransform(sim.dpr, 0, 0, sim.dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.globalCompositeOperation = "source-over"
    ctx.globalAlpha = 1

    if (bg.a > 0.001) {
        ctx.fillStyle = rgbaStr(bg, 1)
        ctx.fillRect(0, 0, w, h)
    }

    /* --- dot field --- */
    const twinkleAmount = clamp(p.twinkleAmount, 0, 1)
    const twinkleSpeed = Math.max(0, p.twinkleSpeed)
    const proximity = clamp(p.proximityGlow, 0, 1)
    const isCircle = p.dotShape === "circle"
    const dots = sim.dots

    ctx.fillStyle = rgbaStr(dotRGBA, 1)
    for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]
        let alpha = dot.alpha
        if (twinkleAmount > 0 && twinkleSpeed > 0) {
            const wave = Math.sin(sim.time * twinkleSpeed * 1.6 + dot.phase)
            alpha *= 1 - twinkleAmount * 0.5 + twinkleAmount * 0.5 * wave
        }
        if (proximity > 0 && dot.glow > 0) {
            alpha += (1 - alpha) * dot.glow * proximity
        }
        if (alpha <= 0.004) continue

        const size = dot.size * (1 + dot.glow * proximity * 0.35)
        ctx.globalAlpha = clamp(alpha, 0, 1)
        if (isCircle) {
            ctx.beginPath()
            ctx.arc(dot.x, dot.y, size * 0.5, 0, TAU)
            ctx.fill()
        } else {
            ctx.fillRect(dot.x - size * 0.5, dot.y - size * 0.5, size, size)
        }
    }
    ctx.globalAlpha = 1

    const additive = p.additiveGlow
    if (additive) ctx.globalCompositeOperation = "lighter"

    /* --- trails --- */
    if (p.showTrail && p.trailWidth > 0) {
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.lineWidth = Math.max(0.1, p.trailWidth)
        for (let s = 0; s < sim.spiders.length; s++) {
            const trail = sim.spiders[s].trail
            const points = trail.length / 2
            if (points < 2) continue
            for (let i = 1; i < points; i++) {
                const fade = i / (points - 1)
                ctx.strokeStyle = rgbaStr(trailRGBA, fade * fade * 0.85)
                ctx.beginPath()
                ctx.moveTo(trail[(i - 1) * 2], trail[(i - 1) * 2 + 1])
                ctx.lineTo(trail[i * 2], trail[i * 2 + 1])
                ctx.stroke()
            }
        }
    }

    /* --- legs --- */
    const legOpacity = clamp(p.legOpacity, 0, 1)
    const legFade = clamp(p.legFade, 0, 1)
    const legBaseColor = rgbaStr(legRGBA, legOpacity)
    const legTipColor = rgbaStr(legRGBA, legOpacity * (1 - legFade))
    const reach = Math.max(8, p.legReach)
    const kneeLift = clamp(p.kneeLift, 0, 1)

    ctx.lineWidth = Math.max(0.1, p.legWidth)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.shadowBlur = 0

    if (legOpacity > 0.004) {
        for (let s = 0; s < sim.spiders.length; s++) {
            const spider = sim.spiders[s]
            const legs = spider.legs
            for (let i = 0; i < legs.length; i++) {
                const leg = legs[i]
                // A leg with nothing to hold is hidden rather than drawn
                // as a stub ending in empty space.
                if (!leg.dot) continue
                const dx = leg.tipX - spider.x
                const dy = leg.tipY - spider.y
                const len = Math.sqrt(dx * dx + dy * dy)
                if (len < 1) continue

                if (legFade > 0.01) {
                    const gradient = ctx.createLinearGradient(
                        spider.x,
                        spider.y,
                        leg.tipX,
                        leg.tipY
                    )
                    gradient.addColorStop(0, legBaseColor)
                    gradient.addColorStop(1, legTipColor)
                    ctx.strokeStyle = gradient
                } else {
                    ctx.strokeStyle = legBaseColor
                }

                ctx.beginPath()
                ctx.moveTo(spider.x, spider.y)
                if (p.legStyle === "straight" || kneeLift <= 0.001) {
                    ctx.lineTo(leg.tipX, leg.tipY)
                } else {
                    const compression = clamp(1 - len / reach, 0, 1)
                    let lift =
                        (0.1 + compression * 0.5) * reach * kneeLift * 0.5
                    if (leg.stepping) {
                        lift *= 1 + 0.6 * Math.sin(Math.PI * clamp(leg.t, 0, 1))
                    }
                    const relative = shortAngle(
                        Math.atan2(dy, dx),
                        p.rotateBody ? spider.heading : 0
                    )
                    const bend = relative >= 0 ? 1 : -1
                    const nx = (-dy / len) * lift * bend
                    const ny = (dx / len) * lift * bend
                    const kneeX = spider.x + dx * 0.5 + nx
                    const kneeY = spider.y + dy * 0.5 + ny
                    if (p.legStyle === "curved") {
                        ctx.quadraticCurveTo(kneeX, kneeY, leg.tipX, leg.tipY)
                    } else {
                        ctx.lineTo(kneeX, kneeY)
                        ctx.lineTo(leg.tipX, leg.tipY)
                    }
                }
                ctx.stroke()
            }
        }
    }

    /* --- anchored dot highlights --- */
    const anchorScale = Math.max(1, p.anchorScale)
    const anchorGlow = Math.max(0, p.anchorGlow)
    ctx.fillStyle = rgbaStr(anchorRGBA, 1)
    if (anchorGlow > 0) {
        ctx.shadowColor = rgbaStr(anchorRGBA, 1)
        ctx.shadowBlur = anchorGlow
    }
    for (let s = 0; s < sim.spiders.length; s++) {
        const legs = sim.spiders[s].legs
        for (let i = 0; i < legs.length; i++) {
            const dot = legs[i].dot
            if (!dot) continue
            const size = dot.size * anchorScale
            if (isCircle) {
                ctx.beginPath()
                ctx.arc(dot.x, dot.y, size * 0.5, 0, TAU)
                ctx.fill()
            } else {
                ctx.fillRect(dot.x - size * 0.5, dot.y - size * 0.5, size, size)
            }
        }
    }
    ctx.shadowBlur = 0

    /* --- bodies --- */
    const bodyRadius = Math.max(0.5, p.bodySize * 0.5)
    const bodyGlow = Math.max(0, p.bodyGlow)
    ctx.fillStyle = rgbaStr(bodyRGBA, 1)
    if (bodyGlow > 0) {
        ctx.shadowColor = rgbaStr(bodyRGBA, 1)
        ctx.shadowBlur = bodyGlow
    }
    for (let s = 0; s < sim.spiders.length; s++) {
        const spider = sim.spiders[s]
        tracePath(
            ctx,
            p.bodyShape,
            spider.x,
            spider.y,
            bodyRadius,
            p.rotateBody ? spider.heading : 0
        )
        ctx.fill()
    }
    ctx.shadowBlur = 0
    ctx.globalCompositeOperation = "source-over"

    /* --- vignette --- */
    const vignetteAmount = clamp(p.vignette, 0, 1)
    if (vignetteAmount > 0.004) {
        const key = w + "x" + h + "|" + p.vignetteColor
        if (sim.vignetteKey !== key || !sim.vignette) {
            const vc = resolveColor(p.vignetteColor, BLACK)
            const radius = Math.sqrt(w * w + h * h) * 0.5
            const gradient = ctx.createRadialGradient(
                w * 0.5,
                h * 0.5,
                radius * 0.25,
                w * 0.5,
                h * 0.5,
                radius
            )
            gradient.addColorStop(0, rgbaStr(vc, 0))
            gradient.addColorStop(0.6, rgbaStr(vc, 0.35))
            gradient.addColorStop(1, rgbaStr(vc, 1))
            sim.vignette = gradient
            sim.vignetteKey = key
        }
        ctx.globalAlpha = vignetteAmount
        ctx.fillStyle = sim.vignette
        ctx.fillRect(0, 0, w, h)
        ctx.globalAlpha = 1
    }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/** Framer can hand back explicit `undefined` for unset props. */
function mergeProps(props: Partial<ArachneProps> | undefined): ArachneProps {
    const merged: Record<string, unknown> = { ...defaults }
    if (props) {
        const keys = Object.keys(props)
        for (let i = 0; i < keys.length; i++) {
            const value = (props as Record<string, unknown>)[keys[i]]
            if (value !== undefined && value !== null) merged[keys[i]] = value
        }
    }
    return merged as ArachneProps
}

/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export function Arachne(props: Partial<ArachneProps>) {
    const p = mergeProps(props)

    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const simRef = useRef<Sim>(createSim())
    const propsRef = useRef<ArachneProps>(p)
    propsRef.current = p

    // True on the Framer canvas, in thumbnails and during export. Every
    // animation, timer and event listener is skipped in that case; a single
    // still frame is painted instead.
    const isStaticTarget = useIsStaticRenderer()

    /* --- shared helpers, stable across renders --- */
    const apiRef = useRef<{ renderStatic: () => void } | null>(null)

    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const sim = simRef.current
        let rafId = 0
        let lastTime = 0
        let visible = true
        let reduced = false
        let stillDrawn = false
        let disposed = false
        let pointerClientX = 0
        let pointerClientY = 0

        const measure = (rect?: DOMRect): boolean => {
            const current = propsRef.current
            const box = rect || container.getBoundingClientRect()
            const width = Math.max(1, Math.round(box.width))
            const height = Math.max(1, Math.round(box.height))
            const dpr = clamp(
                typeof window !== "undefined" && window.devicePixelRatio
                    ? window.devicePixelRatio
                    : 1,
                1,
                clamp(current.maxDPR, 1, 3)
            )
            if (
                sim.width === width &&
                sim.height === height &&
                sim.dpr === dpr
            ) {
                return false
            }
            sim.width = width
            sim.height = height
            sim.dpr = dpr
            canvas.width = Math.max(1, Math.round(width * dpr))
            canvas.height = Math.max(1, Math.round(height * dpr))
            sim.vignette = null
            sim.vignetteKey = ""
            buildDots(sim, current)
            if (sim.spiders.length === 0) buildSpiders(sim, current)
            for (let s = 0; s < sim.spiders.length; s++) {
                const spider = sim.spiders[s]
                spider.x = clamp(spider.x, 0, width)
                spider.y = clamp(spider.y, 0, height)
                spider.lureX = clamp(spider.lureX, 0, width)
                spider.lureY = clamp(spider.lureY, 0, height)
                spider.wayTimer = 0
                spider.trail.length = 0
            }
            return true
        }

        const renderStatic = () => {
            const current = propsRef.current
            measure()
            if (sim.width < 2 || sim.height < 2) return
            const sim2 = sim
            sim2.time = 0
            sim2.cursorSeen = false
            for (let s = 0; s < sim2.spiders.length; s++) {
                const spider = sim2.spiders[s]
                const count = sim2.spiders.length
                spider.x =
                    count === 1
                        ? sim2.width * 0.5
                        : sim2.width * ((s + 0.5) / count)
                spider.y = sim2.height * (count === 1 ? 0.5 : 0.32 + 0.36 * s)
                spider.y = clamp(spider.y, 0, sim2.height)
                spider.prevX = spider.x
                spider.prevY = spider.y
                spider.lureX = spider.x
                spider.lureY = spider.y
                spider.wayX = spider.x
                spider.wayY = spider.y
                spider.wayTimer = 1e6
                spider.heading = 0
                spider.trail.length = 0
                // Reset the stream so repeated still renders are identical.
                spider.rng = makeRng(spider.seed)
                for (let i = 0; i < spider.legs.length; i++) {
                    const leg = spider.legs[i]
                    if (leg.dot) leg.dot.taken = false
                    leg.dot = null
                    leg.stepping = false
                    leg.cooldown = i * 0.01
                    leg.tipX = spider.x + Math.cos(leg.base) * 4
                    leg.tipY = spider.y + Math.sin(leg.base) * 4
                }
            }
            // Settle the legs onto dots, then draw one frame. Roaming is
            // switched off so the still frame stays put while you design.
            const frozen: ArachneProps = {
                ...current,
                twinkleAmount: 0,
                driftAmount: 0,
                showTrail: false,
                wanderSpeed: 0,
                followEase: 1,
            }
            for (let i = 0; i < 150; i++) stepSim(sim2, frozen, 1 / 60)
            sim2.time = 0
            drawSim(ctx, sim2, { ...current, showTrail: false })
        }

        apiRef.current = { renderStatic }

        /* ---------- static renderer: one frame, no loop, no listeners --- */
        if (isStaticTarget) {
            measure()
            if (sim.spiders.length === 0) buildSpiders(sim, propsRef.current)
            renderStatic()

            const staticObserver =
                typeof ResizeObserver !== "undefined"
                    ? new ResizeObserver(() => {
                          if (!disposed) renderStatic()
                      })
                    : null
            if (staticObserver) staticObserver.observe(container)

            // Catches display changes that alter devicePixelRatio without
            // changing the element's box.
            const onWindowResize = () => {
                if (!disposed) renderStatic()
            }
            window.addEventListener("resize", onWindowResize)

            return () => {
                disposed = true
                if (staticObserver) staticObserver.disconnect()
                window.removeEventListener("resize", onWindowResize)
                apiRef.current = null
            }
        }

        /* ---------- live animation ----------
         * The loop always runs and cheaply bails out when idle, so every
         * property stays live-editable without tearing down listeners.
         */
        const frame = (now: number) => {
            if (disposed) return
            rafId = requestAnimationFrame(frame)

            const current = propsRef.current

            if (reduced && current.respectReducedMotion) {
                if (!stillDrawn) {
                    stillDrawn = true
                    renderStatic()
                }
                lastTime = 0
                return
            }
            stillDrawn = false

            if (!visible && current.pauseOffscreen) {
                lastTime = 0
                return
            }

            if (lastTime === 0) lastTime = now
            const dt = clamp((now - lastTime) / 1000, 0, 1 / 20)
            lastTime = now
            if (dt <= 0) return

            const rect = container.getBoundingClientRect()
            measure(rect)
            if (sim.width < 2 || sim.height < 2) return
            if (sim.spiders.length === 0) buildSpiders(sim, current)

            // Convert the last pointer position into canvas space.
            if (sim.cursorSeen) {
                sim.cursorX = pointerClientX - rect.left
                sim.cursorY = pointerClientY - rect.top
                sim.cursorInside =
                    sim.cursorX >= 0 &&
                    sim.cursorY >= 0 &&
                    sim.cursorX <= rect.width &&
                    sim.cursorY <= rect.height
            }

            stepSim(sim, current, dt)
            drawSim(ctx, sim, current)
        }

        const onPointerMove = (event: PointerEvent | MouseEvent) => {
            pointerClientX = event.clientX
            pointerClientY = event.clientY
            sim.cursorSeen = true
            sim.lastCursorTime = sim.time
        }

        const onTouchMove = (event: TouchEvent) => {
            const touch = event.touches && event.touches[0]
            if (!touch) return
            pointerClientX = touch.clientX
            pointerClientY = touch.clientY
            sim.cursorSeen = true
            sim.lastCursorTime = sim.time
        }

        let motionQuery: MediaQueryList | null = null
        const onMotionChange = () => {
            reduced = motionQuery ? motionQuery.matches : false
            stillDrawn = false
        }
        if (typeof window !== "undefined" && window.matchMedia) {
            try {
                motionQuery = window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                )
                reduced = motionQuery.matches
                if (motionQuery.addEventListener) {
                    motionQuery.addEventListener("change", onMotionChange)
                } else if (motionQuery.addListener) {
                    motionQuery.addListener(onMotionChange)
                }
            } catch (e) {
                motionQuery = null
            }
        }

        window.addEventListener("pointermove", onPointerMove, { passive: true })
        window.addEventListener("touchmove", onTouchMove, { passive: true })

        const resizeObserver =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => {
                      if (!disposed) stillDrawn = false
                  })
                : null
        if (resizeObserver) resizeObserver.observe(container)

        const intersectionObserver =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      (entries) => {
                          if (disposed) return
                          const entry = entries[entries.length - 1]
                          visible = entry ? entry.isIntersecting : true
                      },
                      { rootMargin: "120px" }
                  )
                : null
        if (intersectionObserver) intersectionObserver.observe(container)

        measure()
        buildSpiders(sim, propsRef.current)
        rafId = requestAnimationFrame(frame)

        return () => {
            disposed = true
            if (rafId) cancelAnimationFrame(rafId)
            rafId = 0
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("touchmove", onTouchMove)
            if (resizeObserver) resizeObserver.disconnect()
            if (intersectionObserver) intersectionObserver.disconnect()
            if (motionQuery) {
                if (motionQuery.removeEventListener) {
                    motionQuery.removeEventListener("change", onMotionChange)
                } else if (motionQuery.removeListener) {
                    motionQuery.removeListener(onMotionChange)
                }
            }
            apiRef.current = null
        }
        // The loop reads live props from a ref, so it never needs to restart.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStaticTarget])

    /* --- rebuild the dot field when its shape changes --- */
    useEffect(() => {
        if (!apiRef.current) return
        const sim = simRef.current
        if (sim.width < 2) return
        buildDots(sim, propsRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        p.dotDensity,
        p.dotScatter,
        p.dotSize,
        p.dotSizeVariation,
        p.dotOpacity,
        p.dotOpacityVariation,
        p.seed,
    ])

    /* --- rebuild spiders when their structure changes --- */
    useEffect(() => {
        if (!apiRef.current) return
        const sim = simRef.current
        if (sim.width < 2) return
        buildSpiders(sim, propsRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [p.spiderCount, p.legCount, p.seed])

    /* --- keep the still preview in sync with every prop change --- */
    useEffect(() => {
        if (!isStaticTarget) return
        const api = apiRef.current
        if (api) api.renderStatic()
    })

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: "none",
                ...p.style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />
        </div>
    )
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const defaults: ArachneProps = {
    background: "#000000",
    vignette: 0,
    vignetteColor: "#000000",

    dotDensity: 18,
    dotScatter: 0.85,
    dotShape: "square",
    dotSize: 3,
    dotSizeVariation: 0.5,
    dotColor: "#FFFFFF",
    dotOpacity: 0.8,
    dotOpacityVariation: 0.6,
    twinkleAmount: 0.35,
    twinkleSpeed: 1,
    driftAmount: 2,
    driftSpeed: 0.35,
    proximityGlow: 0.9,
    proximityRadius: 180,

    spiderCount: 1,
    bodyShape: "square",
    bodySize: 16,
    bodyColor: "#FF4D2E",
    bodyGlow: 16,
    rotateBody: true,

    legCount: 8,
    legStyle: "straight",
    legColor: "#FF4D2E",
    legWidth: 1.2,
    legOpacity: 0.95,
    legFade: 0.35,
    legReach: 230,
    legSpread: 0.8,
    kneeLift: 0.35,
    stepDuration: 0.28,
    anchorColor: "#FFFFFF",
    anchorScale: 1.8,
    anchorGlow: 12,

    followMode: "hybrid",
    followEase: 0.12,
    wanderSpeed: 1,
    idleDelay: 1.6,
    edgePadding: 60,
    cursorSource: "page",

    showTrail: false,
    trailColor: "#FF4D2E",
    trailLength: 40,
    trailWidth: 1.5,

    additiveGlow: true,
    seed: 1337,
    maxDPR: 2,
    pauseOffscreen: true,
    respectReducedMotion: true,
}

/* ------------------------------------------------------------------ */
/*  Property controls                                                  */
/* ------------------------------------------------------------------ */

addPropertyControls(Arachne, {
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: defaults.background,
    },
    vignette: {
        type: ControlType.Number,
        title: "Vignette",
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.vignette,
    },
    vignetteColor: {
        type: ControlType.Color,
        title: "Vignette Tint",
        defaultValue: defaults.vignetteColor,
        hidden: (props) => (props.vignette ?? 0) <= 0,
    },

    dotDensity: {
        type: ControlType.Number,
        title: "Density",
        description: "Dots per 100k px². Higher values add more dots.",
        min: 2,
        max: 120,
        step: 1,
        displayStepper: false,
        defaultValue: defaults.dotDensity,
    },
    dotScatter: {
        type: ControlType.Number,
        title: "Scatter",
        description: "0 is a perfect grid, 1 is fully random.",
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.dotScatter,
    },
    dotShape: {
        type: ControlType.Enum,
        title: "Dot Shape",
        options: ["square", "circle"],
        optionTitles: ["Square", "Circle"],
        displaySegmentedControl: true,
        defaultValue: defaults.dotShape,
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        min: 0.5,
        max: 14,
        step: 0.1,
        unit: "px",
        displayStepper: false,
        defaultValue: defaults.dotSize,
    },
    dotSizeVariation: {
        type: ControlType.Number,
        title: "Size Variety",
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.dotSizeVariation,
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: defaults.dotColor,
    },
    dotOpacity: {
        type: ControlType.Number,
        title: "Dot Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.dotOpacity,
    },
    dotOpacityVariation: {
        type: ControlType.Number,
        title: "Opacity Variety",
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.dotOpacityVariation,
    },
    twinkleAmount: {
        type: ControlType.Number,
        title: "Twinkle",
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.twinkleAmount,
    },
    twinkleSpeed: {
        type: ControlType.Number,
        title: "Twinkle Speed",
        min: 0,
        max: 4,
        step: 0.05,
        displayStepper: false,
        defaultValue: defaults.twinkleSpeed,
        hidden: (props) => (props.twinkleAmount ?? 0) <= 0,
    },
    driftAmount: {
        type: ControlType.Number,
        title: "Drift",
        min: 0,
        max: 24,
        step: 0.5,
        unit: "px",
        displayStepper: false,
        defaultValue: defaults.driftAmount,
    },
    driftSpeed: {
        type: ControlType.Number,
        title: "Drift Speed",
        min: 0,
        max: 2,
        step: 0.05,
        displayStepper: false,
        defaultValue: defaults.driftSpeed,
        hidden: (props) => (props.driftAmount ?? 0) <= 0,
    },
    proximityGlow: {
        type: ControlType.Number,
        title: "Aura",
        description: "How strongly dots light up near a spider.",
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.proximityGlow,
    },
    proximityRadius: {
        type: ControlType.Number,
        title: "Aura Radius",
        min: 20,
        max: 600,
        step: 5,
        unit: "px",
        displayStepper: false,
        defaultValue: defaults.proximityRadius,
        hidden: (props) => (props.proximityGlow ?? 0) <= 0,
    },

    spiderCount: {
        type: ControlType.Number,
        title: "Spiders",
        min: 1,
        max: MAX_SPIDERS,
        step: 1,
        displayStepper: true,
        defaultValue: defaults.spiderCount,
    },
    bodyShape: {
        type: ControlType.Enum,
        title: "Body",
        options: ["square", "circle", "diamond"],
        optionTitles: ["Square", "Circle", "Diamond"],
        defaultValue: defaults.bodyShape,
    },
    bodySize: {
        type: ControlType.Number,
        title: "Body Size",
        min: 2,
        max: 80,
        step: 1,
        unit: "px",
        displayStepper: false,
        defaultValue: defaults.bodySize,
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: defaults.bodyColor,
    },
    bodyGlow: {
        type: ControlType.Number,
        title: "Body Glow",
        min: 0,
        max: 60,
        step: 1,
        displayStepper: false,
        defaultValue: defaults.bodyGlow,
    },
    rotateBody: {
        type: ControlType.Boolean,
        title: "Face Motion",
        description:
            "Rotate the body and leg sectors toward the direction of travel.",
        defaultValue: defaults.rotateBody,
    },

    legCount: {
        type: ControlType.Number,
        title: "Legs",
        min: 3,
        max: 12,
        step: 1,
        displayStepper: true,
        defaultValue: defaults.legCount,
    },
    legStyle: {
        type: ControlType.Enum,
        title: "Leg Style",
        options: ["straight", "jointed", "curved"],
        optionTitles: ["Straight", "Jointed", "Curved"],
        defaultValue: defaults.legStyle,
    },
    legColor: {
        type: ControlType.Color,
        title: "Leg Color",
        defaultValue: defaults.legColor,
    },
    legWidth: {
        type: ControlType.Number,
        title: "Leg Width",
        min: 0.25,
        max: 8,
        step: 0.05,
        unit: "px",
        displayStepper: false,
        defaultValue: defaults.legWidth,
    },
    legOpacity: {
        type: ControlType.Number,
        title: "Leg Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.legOpacity,
    },
    legFade: {
        type: ControlType.Number,
        title: "Leg Fade",
        description: "Fades each leg out toward its tip.",
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.legFade,
    },
    legReach: {
        type: ControlType.Number,
        title: "Reach",
        min: 40,
        max: 700,
        step: 5,
        unit: "px",
        displayStepper: false,
        defaultValue: defaults.legReach,
    },
    legSpread: {
        type: ControlType.Number,
        title: "Spread",
        description: "How wide each leg searches for a dot.",
        min: 0.1,
        max: 1.5,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.legSpread,
    },
    kneeLift: {
        type: ControlType.Number,
        title: "Knee",
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.kneeLift,
        hidden: (props) => props.legStyle === "straight",
    },
    stepDuration: {
        type: ControlType.Number,
        title: "Step Time",
        min: 0.05,
        max: 1.5,
        step: 0.01,
        unit: "s",
        displayStepper: false,
        defaultValue: defaults.stepDuration,
    },
    anchorColor: {
        type: ControlType.Color,
        title: "Anchor Color",
        defaultValue: defaults.anchorColor,
    },
    anchorScale: {
        type: ControlType.Number,
        title: "Anchor Size",
        min: 1,
        max: 5,
        step: 0.05,
        displayStepper: false,
        defaultValue: defaults.anchorScale,
    },
    anchorGlow: {
        type: ControlType.Number,
        title: "Anchor Glow",
        min: 0,
        max: 40,
        step: 1,
        displayStepper: false,
        defaultValue: defaults.anchorGlow,
    },

    followMode: {
        type: ControlType.Enum,
        title: "Motion",
        options: ["hybrid", "cursor", "auto"],
        optionTitles: ["Cursor + Idle", "Cursor", "Autonomous"],
        defaultValue: defaults.followMode,
    },
    followEase: {
        type: ControlType.Number,
        title: "Smoothing",
        description: "Lower is heavier and more lagged.",
        min: 0.01,
        max: 1,
        step: 0.01,
        displayStepper: false,
        defaultValue: defaults.followEase,
    },
    wanderSpeed: {
        type: ControlType.Number,
        title: "Roam Speed",
        min: 0,
        max: 3,
        step: 0.05,
        displayStepper: false,
        defaultValue: defaults.wanderSpeed,
        hidden: (props) => props.followMode === "cursor",
    },
    idleDelay: {
        type: ControlType.Number,
        title: "Idle Delay",
        description: "Seconds without cursor movement before roaming resumes.",
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        displayStepper: false,
        defaultValue: defaults.idleDelay,
        hidden: (props) => props.followMode !== "hybrid",
    },
    edgePadding: {
        type: ControlType.Number,
        title: "Edge Padding",
        min: 0,
        max: 300,
        step: 5,
        unit: "px",
        displayStepper: false,
        defaultValue: defaults.edgePadding,
        hidden: (props) => props.followMode === "cursor",
    },
    cursorSource: {
        type: ControlType.Enum,
        title: "Track",
        options: ["page", "component"],
        optionTitles: ["Whole Page", "This Frame"],
        displaySegmentedControl: true,
        defaultValue: defaults.cursorSource,
        hidden: (props) => props.followMode === "auto",
    },

    showTrail: {
        type: ControlType.Boolean,
        title: "Silk Trail",
        defaultValue: defaults.showTrail,
    },
    trailColor: {
        type: ControlType.Color,
        title: "Trail Color",
        defaultValue: defaults.trailColor,
        hidden: (props) => !props.showTrail,
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        min: 4,
        max: 120,
        step: 1,
        displayStepper: false,
        defaultValue: defaults.trailLength,
        hidden: (props) => !props.showTrail,
    },
    trailWidth: {
        type: ControlType.Number,
        title: "Trail Width",
        min: 0.25,
        max: 8,
        step: 0.05,
        unit: "px",
        displayStepper: false,
        defaultValue: defaults.trailWidth,
        hidden: (props) => !props.showTrail,
    },

    additiveGlow: {
        type: ControlType.Boolean,
        title: "Additive Glow",
        description:
            "Blends legs and glows for a neon look. Best on dark backgrounds.",
        defaultValue: defaults.additiveGlow,
    },
    seed: {
        type: ControlType.Number,
        title: "Seed",
        description: "Changes the dot layout without changing anything else.",
        min: 1,
        max: 9999,
        step: 1,
        displayStepper: true,
        defaultValue: defaults.seed,
    },
    maxDPR: {
        type: ControlType.Number,
        title: "Max Pixel Ratio",
        min: 1,
        max: 3,
        step: 0.5,
        displayStepper: true,
        defaultValue: defaults.maxDPR,
    },
    pauseOffscreen: {
        type: ControlType.Boolean,
        title: "Pause Offscreen",
        defaultValue: defaults.pauseOffscreen,
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        description: "Show a still frame for visitors who ask for less motion.",
        defaultValue: defaults.respectReducedMotion,
    },
})
