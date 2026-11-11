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


// ─────────────────────────────────────────────────────────────
// Mark — the hero eyebrow orb, generalised. One component draws
// one body; the body is a choice in the panel, and every copy of
// the component picks its own. Ten of them share the same
// material: units drawn on a canvas, depth-shaded, painter-sorted,
// and unfolding on hover.
//
// A unit is one of ten cuts: capsule, cube, bar, pyramid, hexagon,
// diamond, cylinder, plate, bead, cross. Which one a body uses is its
// own default, and the panel can override it.
//
// The hover is one behaviour everywhere: each unit leaves on its
// own beat, travels outward, grows, and squares off. How far it
// goes and how much it grows are panel values, because the right
// numbers differ per body — a lattice of cubes needs far less
// growth than a ball of capsules before it turns into a pile.
// ─────────────────────────────────────────────────────────────

const FONT_BODY = '"Urbanist", "Urbanist Placeholder", sans-serif'

function toRGB(c: any): number[] {
    const fallback = [173, 26, 36]
    if (typeof c !== "string") return fallback
    const m = c.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1].split(",").map((x: string) => parseFloat(x))
        if (p.length >= 3 && p.every((v: number) => !isNaN(v))) return [p[0], p[1], p[2]]
        return fallback
    }
    let h = c.replace("#", "").trim()
    if (h.length === 3) h = h.split("").map((x) => x + x).join("")
    if (h.length >= 6) {
        const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
        if (v.every((x) => !isNaN(x))) return v
    }
    return fallback
}

// The lit and unlit tones a body shades itself with, derived from its
// own colour. A saturated colour keeps the warm highlight the red mark
// was built on; a black or a grey has no hue to warm up, so it lifts
// straight toward white instead — and a light colour has to darken on
// the far side rather than fade, or it disappears into the page.
function litOf(rgb: number[]) {
    const mx = Math.max(rgb[0], rgb[1], rgb[2])
    const mn = Math.min(rgb[0], rgb[1], rgb[2])
    const sat = mx > 0 ? (mx - mn) / mx : 0
    if (sat > 0.45 && mx > 60) {
        return rgb.map((v, i) => Math.round(v + ([255, 120, 130][i] - v) * 0.32))
    }
    return rgb.map((v) => Math.round(v + (255 - v) * 0.5))
}

function dimOf(rgb: number[]) {
    const mx = Math.max(rgb[0], rgb[1], rgb[2])
    // a pale body needs a deeper shadow than half its own value, which
    // on silver would still be too light to read against white
    return rgb.map((v) => Math.round(v * (mx > 150 ? 0.34 : 0.5)))
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const TAU = Math.PI * 2
const QUARTER = Math.PI / 2

// a stable scramble per unit: the pieces must not all leave together,
// and Math.random would hand the client a different set than the
// server rendered — a hydration mismatch for a decoration
function jitter(i: number) {
    const n = Math.sin(i * 12.9898) * 43758.5453
    return n - Math.floor(n)
}

function rot(a: number, b: number, ang: number) {
    const s = Math.sin(ang)
    const co = Math.cos(ang)
    return [a * co - b * s, a * s + b * co]
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// ── bodies ───────────────────────────────────────────────────
// Every builder takes the unit count from the panel and returns unit-
// radius points. Every `pos` returns where a point is at a time, with
// `d` nudging its own intrinsic angle, so the renderer can take a
// second sample and lay each unit down the way it is travelling.

// ── 1. sphere ────────────────────────────────────────────────
const SPHERE_BANDS = 5

function buildSphere(n: number) {
    const count = clamp(Math.round(n), 12, 220)
    const pts: any[] = []
    for (let i = 0; i < count; i++) {
        // Fibonacci placement: even coverage without the crowding a
        // naive lat/long grid piles up at the poles
        const y = 1 - (i / (count - 1)) * 2
        const r = Math.sqrt(Math.max(0, 1 - y * y))
        let band = Math.floor(((y + 1) / 2) * SPHERE_BANDS)
        band = clamp(band, 0, SPHERE_BANDS - 1)
        pts.push({ y: y, r: r, theta: i * GOLDEN_ANGLE, band: band, j: jitter(i) })
    }
    return pts
}

// quarter turns already banked by a band, plus the one in flight
function bandTwist(band: number, step: number, frac: number, active: number) {
    const done = step > band ? Math.floor((step - band - 1) / SPHERE_BANDS) + 1 : 0
    const ease = frac < 0.5 ? 4 * frac * frac * frac : 1 - Math.pow(-2 * frac + 2, 3) / 2
    return (done + (band === active ? ease : 0)) * QUARTER
}

function spherePos(p: any, t: number, sp: number, d: number) {
    const cycle = t / (0.42 / sp)
    const step = Math.floor(cycle)
    const a =
        p.theta + t * sp * 2.6 + d +
        bandTwist(p.band, step, cycle - step, step % SPHERE_BANDS)
    return [Math.cos(a) * p.r, p.y, Math.sin(a) * p.r]
}

// ── 2. cube ──────────────────────────────────────────────────
// A grid on each of the six faces, deduplicated down the shared edges.
// The set is symmetric under a quarter turn about any axis, so a slice
// can twist 90 degrees and land exactly on itself — it never resets.
const CUBE_NORM = 1 / Math.sqrt(3)

function buildCube(n: number) {
    const side = clamp(Math.round(n), 2, 7)
    const steps: number[] = []
    for (let k = 0; k < side; k++) steps.push(side === 1 ? 0 : -1 + (2 * k) / (side - 1))
    // The denominator that turns this grid into whole numbers. Half of
    // it (`(side-1)/2`) looks right and is not: on a four-wide grid the
    // inner steps land on ±0.5, both round to the same integer, and the
    // two middle rows collapse into one — which is what tore the cube
    // apart. `side - 1` puts every step on an integer exactly.
    const f = side === 1 ? 1 : side - 1
    const pts: any[] = []
    const seen: any = {}
    let i = 0
    for (let axis = 0; axis < 3; axis++) {
        for (const s of [-1, 1]) {
            for (const u of steps) {
                for (const v of steps) {
                    const c = [0, 0, 0]
                    c[axis] = s
                    c[(axis + 1) % 3] = u
                    c[(axis + 2) % 3] = v
                    const key = c.map((x) => Math.round(x * f)).join("/")
                    if (seen[key]) continue
                    seen[key] = 1
                    pts.push({ c: c, j: jitter(i++) })
                }
            }
        }
    }
    ;(pts as any).lattice = f
    return pts
}

// which slice turns on a given move, and which way
function cubeMove(step: number) {
    return { axis: step % 3, side: Math.floor(step / 3) % 2 === 0 ? 1 : -1 }
}

// The cube remembers. A finished turn is not undone at the end of its
// period — the pieces stay where it left them and the next turn starts
// from there, exactly like a real cube.
function cubeState(pts: any[]) {
    return { c: pts.map((p: any) => p.c.slice()), f: (pts as any).lattice || 1, step: 0 }
}

// Which way a unit lies. Deriving this from the face a piece belongs to
// breaks on the edges, where a piece belongs to two of them and ends up
// lying across its neighbours' rows. So the rule ignores faces: a unit
// stands upright unless it is on the top or bottom, where upright would
// point straight out of the body and it lies along z instead.
function cubeRow(c: number[]) {
    const v = [0, 0, 0]
    if (Math.abs(c[1]) < 0.9) v[1] = 1
    else v[2] = 1
    return v
}

function cubePrep(st: any, t: number, sp: number) {
    const step = Math.floor(t / (0.72 / sp))
    if (step < st.step) st.step = 0 // time ran backwards: start over
    while (st.step < step) {
        const m = cubeMove(st.step)
        const i1 = (m.axis + 1) % 3
        const i2 = (m.axis + 2) % 3
        for (let i = 0; i < st.c.length; i++) {
            const c = st.c[i]
            if (c[m.axis] * m.side <= 0.5) continue
            const r = rot(c[i1], c[i2], QUARTER * m.side)
            c[i1] = Math.round(r[0] * st.f) / st.f // stay exactly on the lattice
            c[i2] = Math.round(r[1] * st.f) / st.f
        }
        st.step++
    }
}

function cubePos(p: any, t: number, sp: number, d: number, st: any, i: number) {
    const cycle = t / (0.72 / sp)
    const step = Math.floor(cycle)
    const frac = cycle - step
    const ease = frac < 0.5 ? 4 * frac * frac * frac : 1 - Math.pow(-2 * frac + 2, 3) / 2
    // one slice at a time, and the axis moves on with every turn
    const m = cubeMove(step)
    const base = st.c[i]
    let c = base.slice()
    let u = cubeRow(base)
    if (base[m.axis] * m.side > 0.5) {
        const i1 = (m.axis + 1) % 3
        const i2 = (m.axis + 2) % 3
        const r = rot(c[i1], c[i2], ease * QUARTER * m.side)
        c[i1] = r[0]
        c[i2] = r[1]
        // Where the piece lands, and the row rule there. Snapping to the
        // new direction at the end of the turn is a visible flick, so the
        // unit turns from one to the other over the length of the turn.
        const landed = base.slice()
        const rl = rot(base[i1], base[i2], QUARTER * m.side)
        landed[i1] = Math.round(rl[0] * st.f) / st.f
        landed[i2] = Math.round(rl[1] * st.f) / st.f
        const uEnd = cubeRow(landed)
        if (Math.abs(u[m.axis]) < 0.5 && Math.abs(uEnd[m.axis]) < 0.5) {
            const a0 = Math.atan2(u[i2], u[i1])
            let da = Math.atan2(uEnd[i2], uEnd[i1]) - a0
            // a unit has no head or tail: never turn more than a right
            // angle to reach the same line
            while (da > QUARTER) da -= Math.PI
            while (da < -QUARTER) da += Math.PI
            const a = a0 + da * ease
            u = [0, 0, 0]
            u[i1] = Math.cos(a)
            u[i2] = Math.sin(a)
        }
    }
    c = [c[0] + u[0] * d, c[1] + u[1] * d, c[2] + u[2] * d]
    // and the whole body tumbles, slowly, on two axes at once. The pitch
    // never crosses zero: a cube seen square-on is a grid of rows, and
    // the only view that says "cube" is the three-quarter one.
    const xz = rot(c[0], c[2], t * sp * 1.5 + 0.62)
    const yz = rot(c[1], xz[1], 0.62 + Math.sin(t * sp * 0.9) * 0.16)
    return [xz[0] * CUBE_NORM, yz[0] * CUBE_NORM, yz[1] * CUBE_NORM]
}

// ── 3. rings ─────────────────────────────────────────────────
// Two plain circles, one above the other, flat and parallel. Nothing
// deforms them: fixed radius, one height per ring, so each stays a true
// circle. The motion is all in how they are turned.
const RING_R = 0.88
const RING_GAP = 0.3

function buildRing(n: number) {
    const count = clamp(Math.round(n), 4, 60)
    const pts: any[] = []
    let i = 0
    for (const dir of [1, -1]) {
        for (let a = 0; a < count; a++) {
            pts.push({
                // the lower ring is offset half a station, so from the side
                // the units interleave instead of stacking in pairs
                theta: ((a + (dir < 0 ? 0.5 : 0)) / count) * TAU,
                dir: dir,
                j: jitter(i++),
            })
        }
    }
    return pts
}

function ringPos(p: any, t: number, sp: number, d: number) {
    // each ring turns the other way, so the pair reads as two bodies
    const th = p.theta + p.dir * (t * sp * 1.5 + d)
    const gap = RING_GAP * (1 + Math.sin(t * sp * 1.1) * 0.28)
    const y = p.dir * gap
    const z = Math.sin(th) * RING_R
    // the whole pair leans as one, which keeps both planes parallel
    const yz = rot(y, z, Math.sin(t * sp * 0.7) * 0.22)
    return [Math.cos(th) * RING_R, yz[0], yz[1]]
}

// ── 4. helix ─────────────────────────────────────────────────
function buildHelix(n: number) {
    const count = clamp(Math.round(n), 8, 160)
    const pts: any[] = []
    for (let i = 0; i < count; i++) {
        const u = i / (count - 1)
        pts.push({ u: u, theta: u * TAU * 2.5, j: jitter(i) })
    }
    return pts
}

function helixPos(p: any, t: number, sp: number, d: number) {
    const th = p.theta + t * sp * 1.7 + d
    // the coil breathes along its own length rather than climbing, which
    // would need the ends to wrap and would show the seam
    const y = (-0.92 + p.u * 1.84) * (1 + Math.sin(t * sp * 1.3) * 0.08)
    const r = 0.62 * (1 + Math.sin(p.u * 3.4 - t * sp * 2.2) * 0.07)
    return [Math.cos(th) * r, y, Math.sin(th) * r]
}

// ── 5. dna ───────────────────────────────────────────────────
function buildDna(n: number) {
    const count = clamp(Math.round(n), 8, 160)
    const pts: any[] = []
    for (let i = 0; i < count; i++) {
        const strand = i % 2
        const u = Math.floor(i / 2) / Math.max(1, Math.ceil(count / 2) - 1)
        pts.push({ u: u, strand: strand, theta: u * TAU * 1.9 + strand * Math.PI, j: jitter(i) })
    }
    return pts
}

function dnaPos(p: any, t: number, sp: number, d: number) {
    const th = p.theta + t * sp * 1.5 + d
    const r = 0.52
    return [Math.cos(th) * r, -0.92 + p.u * 1.84, Math.sin(th) * r]
}

// ── 6. wave ──────────────────────────────────────────────────
function buildWave(n: number) {
    const side = clamp(Math.round(n), 3, 14)
    const pts: any[] = []
    let i = 0
    for (let a = 0; a < side; a++) {
        for (let b = 0; b < side; b++) {
            pts.push({
                x: -0.92 + (1.84 * a) / (side - 1),
                z: -0.92 + (1.84 * b) / (side - 1),
                j: jitter(i++),
            })
        }
    }
    return pts
}

function wavePos(p: any, t: number, sp: number, d: number) {
    const x = p.x + d
    // one swell crossing another, so the sheet never repeats a pose
    const y = 0.3 * Math.sin(x * 2.6 - t * sp * 3.4) * Math.cos(p.z * 2.1 + t * sp * 1.7)
    const xz = rot(x, p.z, t * sp * 0.5)
    return [xz[0], y, xz[1]]
}

// ── 7. vortex ────────────────────────────────────────────────
const VORTEX_ARMS = 3

function buildVortex(n: number) {
    const count = clamp(Math.round(n), 6, 120)
    const pts: any[] = []
    for (let i = 0; i < count; i++) {
        // Laid out along arms rather than by golden angle. Phyllotaxis
        // packs the middle until a disc of capsules is a solid blob; a
        // few clean arms keep the spiral readable and leave the centre
        // open where the units would otherwise pile up.
        const arm = i % VORTEX_ARMS
        const u = (Math.floor(i / VORTEX_ARMS) + 1) / Math.ceil(count / VORTEX_ARMS)
        pts.push({
            r: 0.22 + Math.sqrt(u) * 0.74,
            theta: (arm / VORTEX_ARMS) * TAU + u * 2.1,
            j: jitter(i),
        })
    }
    return pts
}

function vortexPos(p: any, t: number, sp: number, d: number) {
    // the middle turns faster than the rim, which is what winds the arms
    const th = p.theta + t * sp * (2.2 - p.r * 1.3) + d
    return [Math.cos(th) * p.r, 0.1 * Math.sin(th + t * sp * 1.4) * p.r, Math.sin(th) * p.r]
}

// ── 8. cylinder ──────────────────────────────────────────────
const CYL_LEVELS = 5

function buildCylinder(n: number) {
    const count = clamp(Math.round(n), 3, 40)
    const pts: any[] = []
    let i = 0
    for (let l = 0; l < CYL_LEVELS; l++) {
        for (let a = 0; a < count; a++) {
            pts.push({
                theta: ((a + (l % 2) * 0.5) / count) * TAU,
                level: l,
                y: -0.86 + (1.72 * l) / (CYL_LEVELS - 1),
                dir: l % 2 === 0 ? 1 : -1,
                j: jitter(i++),
            })
        }
    }
    return pts
}

function cylinderPos(p: any, t: number, sp: number, d: number) {
    // every other course runs the other way, so the drum shears as it turns
    const th = p.theta + p.dir * (t * sp * 1.4 + d)
    const r = 0.8 * (1 + Math.sin(t * sp * 1.1 + p.level) * 0.05)
    return [Math.cos(th) * r, p.y, Math.sin(th) * r]
}

// ── 9. lattice ───────────────────────────────────────────────
function buildLattice(n: number) {
    const side = clamp(Math.round(n), 3, 8)
    const pts: any[] = []
    let i = 0
    for (let a = 0; a < side; a++) {
        for (let b = 0; b < side; b++) {
            for (let c = 0; c < side; c++) {
                // Edges only. A filled grid is a cloud however carefully it
                // is animated: the interior units read as noise, and the
                // near ones are drawn so much larger than the far ones that
                // no row survives. Twelve edges keep the box legible and
                // leave it open enough to see through.
                const edge = [a, b, c].filter((v) => v === 0 || v === side - 1).length
                if (edge < 2) continue
                const at = (v: number) => -0.88 + (1.76 * v) / (side - 1)
                pts.push({ c: [at(a), at(b), at(c)], j: jitter(i++) })
            }
        }
    }
    return pts
}

function latticePos(p: any, t: number, sp: number, d: number) {
    // One breathing factor for the whole grid. Giving each unit its own
    // phase scattered the block into a cloud — the lattice only reads as
    // a lattice while its rows stay rows, so the only per-unit motion is
    // a small bob along its own column.
    const k = 1 + Math.sin(t * sp * 1.5) * 0.07
    const bob = Math.sin(t * sp * 2.1 + p.j * TAU) * 0.035
    const xz = rot(p.c[0] * k + d, p.c[2] * k, t * sp * 1.1 + 0.6)
    const yz = rot(p.c[1] * k + bob, xz[1], 0.5)
    return [xz[0], yz[0], yz[1]]
}

// ── 10. orbit ────────────────────────────────────────────────
const ORBIT_RINGS = 3

function buildOrbit(n: number) {
    const count = clamp(Math.round(n), 4, 60)
    const pts: any[] = []
    let i = 0
    for (let k = 0; k < ORBIT_RINGS; k++) {
        for (let a = 0; a < count; a++) {
            pts.push({
                theta: (a / count) * TAU,
                lean: (k / ORBIT_RINGS) * Math.PI,
                rate: 1 + k * 0.28,
                j: jitter(i++),
            })
        }
    }
    return pts
}

function orbitPos(p: any, t: number, sp: number, d: number) {
    const th = p.theta + t * sp * 1.5 * p.rate + d
    const r = 0.92
    // each ring sits on its own plane, and the whole set rolls slowly
    const yz = rot(0, Math.sin(th) * r, p.lean + t * sp * 0.35)
    return [Math.cos(th) * r, yz[0], yz[1]]
}

// Per-body defaults. `openX`/`openY` are how far a unit travels on
// hover, `growOpen` how much bigger it gets, `dot` its size, `units`
// what the unit count means here, `mark` which unit shape it uses.
const BODIES: any = {
    sphere: { build: buildSphere, pos: spherePos, tilt: -0.42, openX: 3.9, openY: 1.6, fill: 0.42, dot: 1, mark: "pill", units: 64, growOpen: 2.4 },
    cube: { build: buildCube, pos: cubePos, state: cubeState, prep: cubePrep, tilt: 0, openX: 2.6, openY: 2.1, fill: 0.52, dot: 0.92, mark: "block", units: 4, growOpen: 0.3, rest: 0.44 },
    rings: { build: buildRing, pos: ringPos, tilt: -0.6, openX: 3.2, openY: 2.2, fill: 0.46, dot: 0.9, mark: "bar", units: 15, growOpen: 1.2 },
    helix: { build: buildHelix, pos: helixPos, tilt: -0.34, openX: 3.2, openY: 2.0, fill: 0.5, dot: 0.9, mark: "bar", units: 34, growOpen: 1.4 },
    dna: { build: buildDna, pos: dnaPos, tilt: -0.3, openX: 3.0, openY: 2.2, fill: 0.5, dot: 0.85, mark: "block", units: 40, growOpen: 0.6 },
    wave: { build: buildWave, pos: wavePos, tilt: -0.95, openX: 2.8, openY: 2.4, fill: 0.5, dot: 0.85, mark: "block", units: 8, growOpen: 0.5 },
    vortex: { build: buildVortex, pos: vortexPos, tilt: -0.8, openX: 3.6, openY: 2.4, fill: 0.5, dot: 0.85, mark: "pill", units: 42, growOpen: 2.0 },
    cylinder: { build: buildCylinder, pos: cylinderPos, tilt: -0.5, openX: 3.2, openY: 2.2, fill: 0.5, dot: 0.9, mark: "bar", units: 11, growOpen: 1.2 },
    lattice: { build: buildLattice, pos: latticePos, tilt: 0, openX: 2.8, openY: 2.2, fill: 0.52, dot: 0.8, mark: "block", units: 5, growOpen: 0.4 },
    orbit: { build: buildOrbit, pos: orbitPos, tilt: -0.45, openX: 3.4, openY: 2.2, fill: 0.46, dot: 0.95, mark: "pill", units: 16, growOpen: 1.8 },
}

const SHAPES = ["sphere", "cube", "rings", "helix", "dna", "wave", "vortex", "cylinder", "lattice", "orbit"]

// Point sets are pure functions of body and count, and rebuilding one
// on every render would throw the animation away. They are cached here
// and shared by every copy of the component that asks for the same pair.
const POINT_CACHE: any = {}
function pointsFor(shape: string, units: number) {
    const body = BODIES[shape] || BODIES.sphere
    const n = units && units > 0 ? units : body.units
    const key = shape + ":" + n
    if (!POINT_CACHE[key]) POINT_CACHE[key] = body.build(n)
    return POINT_CACHE[key]
}

// ── unit shapes ──────────────────────────────────────────────

// One shape for both states: corner = h/2 gives the capsule the body is
// built from, a tighter corner gives the block a unit turns into.
function pillPath(ctx: any, x: number, y: number, w: number, h: number, ang: number, corner: number) {
    const hw = Math.max(w, h) / 2
    const hh = h / 2
    const r = Math.max(0.5, Math.min(corner, hh, hw))
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.beginPath()
    ctx.moveTo(-hw + r, -hh)
    ctx.lineTo(hw - r, -hh)
    ctx.arcTo(hw, -hh, hw, -hh + r, r)
    ctx.lineTo(hw, hh - r)
    ctx.arcTo(hw, hh, hw - r, hh, r)
    ctx.lineTo(-hw + r, hh)
    ctx.arcTo(-hw, hh, -hw, hh - r, r)
    ctx.lineTo(-hw, -hh + r)
    ctx.arcTo(-hw, -hh, -hw + r, -hh, r)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
}

function shade(ctx: any, rgb: number[], k: number, alpha: number) {
    const lift = k > 1 ? 40 * (k - 1) : 0
    ctx.fillStyle =
        "rgba(" + Math.round(Math.min(255, rgb[0] * k + lift)) + "," +
        Math.round(Math.min(255, rgb[1] * k + lift)) + "," +
        Math.round(Math.min(255, rgb[2] * k + lift)) + "," + alpha + ")"
}

function poly(ctx: any, pts: number[][]) {
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.closePath()
    ctx.fill()
}

// A little cube, drawn flat: three faces at a fixed isometric angle,
// the top caught by the light and one side in shadow. One flat colour
// each, no gradients, so it stays a printed mark, not a rendering.
const ISO_X = Math.cos(Math.PI / 6)
const ISO_Y = Math.sin(Math.PI / 6)

function blockMark(ctx: any, x: number, y: number, s: number, rgb: number[], alpha: number) {
    const w = s * ISO_X
    const h = s * ISO_Y
    shade(ctx, rgb, 1.5, alpha)
    poly(ctx, [[x, y - s], [x + w, y - s + h], [x, y - s + 2 * h], [x - w, y - s + h]])
    shade(ctx, rgb, 0.72, alpha)
    poly(ctx, [[x - w, y - s + h], [x, y - s + 2 * h], [x, y + s], [x - w, y + s - h]])
    shade(ctx, rgb, 1.02, alpha)
    poly(ctx, [[x + w, y - s + h], [x, y - s + 2 * h], [x, y + s], [x + w, y + s - h]])
}

// A long thin bar with square ends, extruded: a flat face, a lit top
// ridge and a dark end. Drawn straight — a stroked curve pinches on the
// inside of its bend and reads as broken, and a bar short enough to sit
// between two stations does not need to curve at all.
function barMark(ctx: any, x: number, y: number, ang: number, len: number, wid: number, ext: number, rgb: number[], alpha: number) {
    const dx = Math.cos(ang)
    const dy = Math.sin(ang)
    const px = -dy * wid / 2
    const py = dx * wid / 2
    const hx = dx * len / 2
    const hy = dy * len / 2
    // one extrusion direction for every bar, so they are all lit alike
    const ex = ext * 0.42
    const ey = -ext
    const c0 = [x - hx - px, y - hy - py]
    const c1 = [x + hx - px, y + hy - py]
    const c2 = [x + hx + px, y + hy + py]
    const c3 = [x - hx + px, y - hy + py]
    shade(ctx, rgb, 0.72, alpha)
    poly(ctx, [c1, c2, [c2[0] + ex, c2[1] + ey], [c1[0] + ex, c1[1] + ey]])
    shade(ctx, rgb, 1.5, alpha)
    poly(ctx, [c0, c1, [c1[0] + ex, c1[1] + ey], [c0[0] + ex, c0[1] + ey]])
    shade(ctx, rgb, 1, alpha)
    poly(ctx, [c0, c1, c2, c3])
}

// A four-sided pyramid: only the two faces turned toward the light are
// ever visible, so it is two triangles sharing an apex.
function pyramidMark(ctx: any, x: number, y: number, s: number, rgb: number[], alpha: number) {
    const cy = y + s * 0.42
    const w = s * 0.98
    const h = s * 0.52
    const apex = [x, y - s]
    const front = [x, cy + h]
    shade(ctx, rgb, 0.72, alpha)
    poly(ctx, [apex, [x - w, cy], front])
    shade(ctx, rgb, 1.5, alpha)
    poly(ctx, [apex, front, [x + w, cy]])
}

// A hexagonal plate with a wall under it: the top face reads as the
// hexagon, the two lower edges give it thickness.
function hexMark(ctx: any, x: number, y: number, s: number, rgb: number[], alpha: number) {
    const rx = s * 1.02
    const ry = s * 0.62
    const ext = s * 0.5
    const top = y - ext / 2
    const p: number[][] = []
    for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU
        p.push([x + Math.cos(a) * rx, top + Math.sin(a) * ry])
    }
    shade(ctx, rgb, 0.72, alpha)
    poly(ctx, [p[1], p[2], [p[2][0], p[2][1] + ext], [p[1][0], p[1][1] + ext]])
    shade(ctx, rgb, 1.02, alpha)
    poly(ctx, [p[0], p[1], [p[1][0], p[1][1] + ext], [p[0][0], p[0][1] + ext]])
    shade(ctx, rgb, 0.9, alpha)
    poly(ctx, [p[2], p[3], [p[3][0], p[3][1] + ext], [p[2][0], p[2][1] + ext]])
    shade(ctx, rgb, 1.5, alpha)
    poly(ctx, p)
}

// Two pyramids base to base: a cut stone, lit down one side.
function diamondMark(ctx: any, x: number, y: number, s: number, rgb: number[], alpha: number) {
    const w = s * 0.84
    const waist = y - s * 0.18
    shade(ctx, rgb, 1.5, alpha)
    poly(ctx, [[x, y - s], [x + w, waist], [x, waist + s * 0.3]])
    shade(ctx, rgb, 1.05, alpha)
    poly(ctx, [[x, y - s], [x - w, waist], [x, waist + s * 0.3]])
    shade(ctx, rgb, 0.78, alpha)
    poly(ctx, [[x - w, waist], [x, waist + s * 0.3], [x, y + s]])
    shade(ctx, rgb, 0.62, alpha)
    poly(ctx, [[x + w, waist], [x, waist + s * 0.3], [x, y + s]])
}

// A short cylinder stood on end: a wall with a rounded foot, capped by
// the ellipse of its top face.
function cylinderMark(ctx: any, x: number, y: number, s: number, rgb: number[], alpha: number) {
    const rx = s * 0.86
    const ry = s * 0.4
    const h = s * 1.1
    const top = y - h / 2
    const bottom = y + h / 2
    shade(ctx, rgb, 1, alpha)
    ctx.beginPath()
    ctx.moveTo(x - rx, top)
    ctx.lineTo(x - rx, bottom)
    ctx.ellipse(x, bottom, rx, ry, 0, Math.PI, 0, true)
    ctx.lineTo(x + rx, top)
    ctx.closePath()
    ctx.fill()
    shade(ctx, rgb, 1.5, alpha)
    ctx.beginPath()
    ctx.ellipse(x, top, rx, ry, 0, 0, TAU)
    ctx.fill()
}

// The cube, pressed flat: a tile with just enough wall to sit on.
function plateMark(ctx: any, x: number, y: number, s: number, rgb: number[], alpha: number) {
    const w = s * ISO_X * 1.15
    const h = s * ISO_Y * 1.15
    const ext = s * 0.34
    const cy = y - ext / 2
    shade(ctx, rgb, 0.72, alpha)
    poly(ctx, [[x - w, cy], [x, cy + h], [x, cy + h + ext], [x - w, cy + ext]])
    shade(ctx, rgb, 1.02, alpha)
    poly(ctx, [[x + w, cy], [x, cy + h], [x, cy + h + ext], [x + w, cy + ext]])
    shade(ctx, rgb, 1.5, alpha)
    poly(ctx, [[x, cy - h], [x + w, cy], [x, cy + h], [x - w, cy]])
}

// A bead: one circle and the highlight that turns it into a ball.
function dotMark(ctx: any, x: number, y: number, s: number, rgb: number[], alpha: number) {
    shade(ctx, rgb, 1, alpha)
    ctx.beginPath()
    ctx.arc(x, y, s * 0.95, 0, TAU)
    ctx.fill()
    shade(ctx, rgb, 1.55, alpha * 0.9)
    ctx.beginPath()
    ctx.arc(x - s * 0.3, y - s * 0.32, s * 0.4, 0, TAU)
    ctx.fill()
}

// A plus, cut square, lying along the direction the unit travels.
function crossMark(ctx: any, x: number, y: number, ang: number, s: number, rgb: number[], alpha: number) {
    const a = s * 1.25 // arm reach
    const b = s * 0.42 // arm width
    const pts = [
        [-b, -a], [b, -a], [b, -b], [a, -b], [a, b], [b, b],
        [b, a], [-b, a], [-b, b], [-a, b], [-a, -b], [-b, -b],
    ]
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    shade(ctx, rgb, 1, alpha)
    poly(ctx, pts)
    ctx.restore()
}

// How much room the unfolded units need, as a multiple of the body. The
// canvas is drawn at this size and centred on the body, while the
// element in the layout still measures only `size`.
const FIELD = 7.5

// Not exported: Framer lists every exported component in the assets
// panel, and this is the body renderer the real component is built out
// of, not something to place on a canvas by itself.
function MarkOrb({
    shape = "sphere", size = 26, accent = "#AD1A24", speed = 0.25,
    units = 0, unitSize = 1, spread = 1, growth = -1, mark = "auto",
    still = false, hoverRef = null,
}: any) {
    const ref = useRef<any>(null)
    // The canvas, thumbnails and exports are static renders: they get one
    // drawn frame and no loop at all. Asked here as well as by the parent,
    // so the component is safe to drop anywhere on its own.
    const isStatic = useIsStaticRenderer()
    const frozen = still || isStatic

    useEffect(() => {
        const cv = ref.current
        if (!cv) return
        const ctx = cv.getContext ? cv.getContext("2d") : null
        if (!ctx) return

        const body = BODIES[shape] || BODIES.sphere
        const pts = pointsFor(shape, units)
        const unit = mark && mark !== "auto" ? mark : body.mark

        const dpr = Math.min(3, (typeof window !== "undefined" && window.devicePixelRatio) || 1)
        const px = Math.max(1, Math.round(size * dpr))
        const field = Math.max(1, Math.round(size * FIELD * dpr))
        cv.width = field
        cv.height = field

        const rgb = toRGB(accent)
        const lit = litOf(rgb)
        const dim = dimOf(rgb)
        const mid = field / 2
        const radius = px * body.fill // sized off the body, not the canvas
        const sinT = Math.sin(body.tilt)
        const cosT = Math.cos(body.tilt)
        const dotH = Math.max(1.5, px * 0.088 * (body.dot || 1) * unitSize)
        const sp = Math.max(0.05, speed)
        const openX = body.openX * spread
        const openY = body.openY * spread
        const grown = growth < 0 ? body.growOpen : growth
        // a body that has to remember what it already did keeps its own
        // state here, alongside the loop that drives it
        const st = body.state ? body.state(pts) : null
        const order: number[] = pts.map((_: any, i: number) => i)

        // Unfold on hover. Read from a ref inside the loop rather than
        // taken as a prop, so hovering never re-runs this effect and
        // restarts the body.
        const OPEN_S = 0.55
        const SHUT_S = 0.42
        let open = 0
        let last = -1

        const frame = (tSec: number) => {
            const dt = last < 0 ? 0 : Math.min(0.05, tSec - last)
            last = tSec
            const want = hoverRef && hoverRef.current ? 1 : 0
            const dOpen = want - open
            const stepK = dt / (dOpen > 0 ? OPEN_S : SHUT_S)
            open = Math.abs(dOpen) <= stepK ? want : open + (dOpen > 0 ? stepK : -stepK)

            if (body.prep) body.prep(st, tSec, sp)
            const proj: any[] = []
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i]
                const a = body.pos(p, tSec, sp, 0, st, i)
                // a second sample a hair further along its own angle, so
                // each unit lies down the way it is travelling
                const b = body.pos(p, tSec, sp, 0.06, st, i)
                const y1 = a[1] * cosT - a[2] * sinT
                const z1 = a[1] * sinT + a[2] * cosT
                const by = b[1] * cosT - b[2] * sinT
                // each unit leaves on its own beat, then travels outward
                const o = clamp((open - p.j * 0.32) / 0.68, 0, 1)
                const eased = 1 - Math.pow(1 - o, 3)
                const k = 0.5 + p.j
                proj.push({
                    x: mid + a[0] * radius * (1 + eased * openX * k),
                    y: mid + y1 * radius * (1 + eased * openY * k),
                    ang: Math.atan2((by - y1) * radius, (b[0] - a[0]) * radius),
                    depth: (z1 + 1) / 2, // 0 far, 1 near
                    z: z1,
                    open: eased,
                })
            }

            order.sort((i, j) => proj[i].z - proj[j].z) // painter's algorithm
            ctx.clearRect(0, 0, field, field)
            for (let k = 0; k < order.length; k++) {
                const d = proj[order[k]]
                const near = d.depth
                const scale = 0.42 + near * 0.72
                const col = near > 0.5 ? lit : dim
                const tt = near > 0.5 ? (near - 0.5) * 2 : near * 2
                const c = rgb.map((v, i) =>
                    Math.round(v + (col[i] - v) * (near > 0.5 ? tt * 0.7 : (1 - tt) * 0.85))
                )
                const alpha = Math.min(1, 0.18 + near * 0.82 + d.open * 0.34)
                const grow = scale * (1 + d.open * grown)
                // Every unit is drawn off the same size, so a body keeps its
                // weight whichever shape its units are cut into.
                const s = dotH * grow
                if (unit === "block") blockMark(ctx, d.x, d.y, s * 1.5, c, alpha)
                else if (unit === "bar")
                    // long at rest, drawing in to a stub as the unit flies
                    // off, so a hover ends in blocks like everywhere else
                    barMark(ctx, d.x, d.y, d.ang,
                        s * (1.75 - d.open * 0.55), s * 0.52, s * 0.42, c, alpha)
                else if (unit === "pyramid") pyramidMark(ctx, d.x, d.y, s * 1.4, c, alpha)
                else if (unit === "hexagon") hexMark(ctx, d.x, d.y, s * 1.15, c, alpha)
                else if (unit === "diamond") diamondMark(ctx, d.x, d.y, s * 1.45, c, alpha)
                else if (unit === "cylinder") cylinderMark(ctx, d.x, d.y, s * 1.2, c, alpha)
                else if (unit === "plate") plateMark(ctx, d.x, d.y, s * 1.55, c, alpha)
                else if (unit === "dot") dotMark(ctx, d.x, d.y, s * 1.05, c, alpha)
                else if (unit === "cross") crossMark(ctx, d.x, d.y, d.ang, s * 0.95, c, alpha)
                else {
                    // a capsule that never squares all the way to a circle —
                    // that reads as a bead, and the point is that the body is
                    // made of pixel pills
                    shade(ctx, c, 1, alpha)
                    const ratio = 2.1 - d.open * 0.75
                    const corner = (s / 2) * (1 - d.open * 0.42)
                    pillPath(ctx, d.x, d.y, s * ratio, s, d.ang, corner)
                }
            }
        }

        if (frozen) {
            // One frame and nothing else: no animation frame is ever
            // requested in a static render, so the editor stays responsive
            // and an export cannot catch the body mid-blank. The pose is
            // the one that reads best: mid-move for most bodies, at rest
            // between turns for the cube.
            frame(body.rest || 1.1)
            return
        }
        // Runs only while it is actually on screen; one last frame is
        // drawn on the way out so it never freezes mid-blank.
        let raf = 0
        let running = false
        let visible = true
        const t0 = typeof performance !== "undefined" ? performance.now() : 0
        const loop = (now: number) => {
            frame((now - t0) / 1000)
            raf = requestAnimationFrame(loop)
        }
        const startLoop = () => {
            if (running || !visible) return
            running = true
            raf = requestAnimationFrame(loop)
        }
        const stopLoop = () => {
            running = false
            if (raf) cancelAnimationFrame(raf)
            raf = 0
        }
        let io: any = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (es) => es.forEach((e) => {
                    visible = e.isIntersecting
                    if (visible) startLoop()
                    else stopLoop()
                }),
                { rootMargin: "120px" }
            )
            io.observe(cv)
        } else {
            startLoop()
        }
        const onVis = () => (document.hidden ? stopLoop() : startLoop())
        if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVis)
        return () => {
            stopLoop()
            if (io) io.disconnect()
            if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVis)
        }
    }, [shape, size, accent, speed, units, unitSize, spread, growth, mark, frozen, hoverRef])

    return (
        <span style={{ position: "relative", width: size, height: size, flex: "none", display: "block" }}>
            <canvas
                ref={ref}
                aria-hidden="true"
                style={{
                    position: "absolute", left: "50%", top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: size * FIELD, height: size * FIELD,
                    display: "block", pointerEvents: "none",
                }}
            />
        </span>
    )
}

function useReduce() {
    const [reduce, setReduce] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReduce(mq.matches)
        const on = (e: any) => setReduce(e.matches)
        mq.addEventListener?.("change", on)
        return () => mq.removeEventListener?.("change", on)
    }, [])
    return reduce
}

// One body, hoverable, sized by its frame. Every instance on the canvas
// is a copy of this: the shape and all of its numbers are panel values,
// so three of them side by side can be three different marks.
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Mark(props: any) {
    const {
        shape = "sphere",
        accent = "#AD1A24",
        orbSize = 150,
        speed = 0.25,
        units = 0,
        unitSize = 1,
        spread = 1,
        growth = -1,
        mark = "auto",
    } = props
    const hoverRef = useRef(false)
    const reduce = useReduce()
    const isStatic = useIsStaticRenderer()
    return (
        <div
            onMouseEnter={() => { hoverRef.current = true }}
            onMouseLeave={() => { hoverRef.current = false }}
            style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", height: "100%", background: "transparent", ...props.style,
            }}
        >
            <MarkOrb
                shape={shape} size={orbSize} accent={accent} speed={speed}
                units={units} unitSize={unitSize} spread={spread} growth={growth} mark={mark}
                still={isStatic || reduce} hoverRef={hoverRef}
            />
        </div>
    )
}

addPropertyControls(Mark, {
    shape: {
        type: ControlType.Enum, title: "Shape",
        options: SHAPES,
        optionTitles: ["Sphere", "Cube", "Rings", "Helix", "DNA", "Wave", "Vortex", "Cylinder", "Lattice", "Orbit"],
        defaultValue: "sphere",
    },
    accent: { type: ControlType.Color, title: "Colour", defaultValue: "#AD1A24" },
    orbSize: {
        type: ControlType.Number, title: "Size", defaultValue: 150, min: 16, max: 400, step: 2,
        description: "The body itself. Units flying out on hover reach well past it.",
    },
    speed: { type: ControlType.Number, title: "Speed", defaultValue: 0.25, min: 0.05, max: 1.5, step: 0.05 },
    units: {
        type: ControlType.Number, title: "Units", defaultValue: 0, min: 0, max: 220, step: 1,
        description: "0 keeps the shape's own count. Grids read it as a side (cube, wave, lattice), rings and coils as a count per turn.",
    },
    unitSize: { type: ControlType.Number, title: "Unit size", defaultValue: 1, min: 0.3, max: 3, step: 0.05 },
    mark: {
        type: ControlType.Enum, title: "Unit shape",
        options: ["auto", "pill", "block", "bar", "pyramid", "hexagon", "diamond", "cylinder", "plate", "dot", "cross"],
        optionTitles: ["Auto", "Capsule", "Cube", "Bar", "Pyramid", "Hexagon", "Diamond", "Cylinder", "Plate", "Bead", "Cross"],
        defaultValue: "auto",
        description: "Ten units to cut the body from. Auto uses the shape's own.",
    },
    spread: {
        type: ControlType.Number, title: "Hover spread", defaultValue: 1, min: 0, max: 4, step: 0.05,
        description: "How far the units travel when the mark is hovered.",
    },
    growth: {
        type: ControlType.Number, title: "Hover growth", defaultValue: -1, min: -1, max: 4, step: 0.05,
        description: "How much bigger a unit gets as it flies. -1 keeps the shape's own value.",
    },
})
