// @ts-nocheck
// Paper Carousel 3D — Three.js motion-design scene.
// Posters travel right → left: each sheet unfolds from a crumpled wad as it reaches the centre,
// then a solo beat crushes the centre sheet into a ball that unfolds into the next poster.
// Geometry: physics-simulated crush (inextensible sheet, run in Web Workers) + a crisp crease
// network, real paper thickness (front, back, edge). Materials: MeshPhysicalMaterial with
// procedural fibre normal/roughness maps. Lighting: studio environment, soft shadow-casting key,
// fill, ambient occlusion (GTAO), backdrop receiving shadows.
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

import { useReducedMotion } from "framer-motion"
import * as THREE from "https://esm.sh/three@0.170.0"
import { RoomEnvironment } from "https://esm.sh/three@0.170.0/examples/jsm/environments/RoomEnvironment.js"
import { EffectComposer } from "https://esm.sh/three@0.170.0/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "https://esm.sh/three@0.170.0/examples/jsm/postprocessing/RenderPass.js"
import { GTAOPass } from "https://esm.sh/three@0.170.0/examples/jsm/postprocessing/GTAOPass.js"
import { OutputPass } from "https://esm.sh/three@0.170.0/examples/jsm/postprocessing/OutputPass.js"
import { gsap } from "https://esm.sh/gsap@3.12.5"

// ================= crumple.js =================
// Position-based-dynamics paper crush.
// An inextensible sheet (stiff stretch + shear, weak bending) is squeezed inside a
// shrinking, flattened ellipsoid with particle self-collision. Because paper cannot
// stretch, it has to buckle — that is what produces real ridges, creases and facets.
// Returns a list of snapshots from flat (index 0) to tight ball (last).
function crumpleSim(opts) {
    const nx = opts.nx || 36
    const ny = opts.ny || 48
    const W = 1
    const H = opts.aspect || 4 / 3
    const stages = opts.stages || 28
    const seed = opts.seed || 1
    const ballR = opts.ballR || 0.2
    const bendK = opts.bend == null ? 0.9 : opts.bend
    const plastic = opts.plastic == null ? 0.5 : opts.plastic

    let s = seed >>> 0 || 1
    const rnd = () => {
        s ^= s << 13; s ^= s >>> 17; s ^= s << 5
        return ((s >>> 0) % 100000) / 100000
    }

    const N = nx * ny
    const dx = W / (nx - 1)
    const dy = H / (ny - 1)
    const P = new Float32Array(N * 3)
    const Q = new Float32Array(N * 3) // previous
    // random low-frequency waves seed the buckling direction
    const waves = []
    for (let i = 0; i < 5; i++) {
        const a = rnd() * Math.PI * 2
        const f = 1 + rnd() * 3
        waves.push([Math.cos(a) * f, Math.sin(a) * f, rnd() * 6.283, 0.004 + rnd() * 0.004])
    }
    const bumps = []
    for (let i = 0; i < 18; i++)
        bumps.push([(rnd() - 0.5) * W, (rnd() - 0.5) * H, 0.1 + rnd() * 0.22, (rnd() - 0.5) * 0.05])
    for (let j = 0; j < ny; j++)
        for (let i = 0; i < nx; i++) {
            const k = (j * nx + i) * 3
            const x = (i / (nx - 1) - 0.5) * W
            const y = (0.5 - j / (ny - 1)) * H
            let z = 0
            for (const [bx, by, br, ba] of bumps) {
                const d2 = ((x - bx) * (x - bx) + (y - by) * (y - by)) / (br * br)
                if (d2 < 9) z += ba * Math.exp(-d2)
            }
            z += (rnd() - 0.5) * 0.003
            z -= (x * x + y * y) * 0.18 // gentle backward dome: the sheet wraps print-side out
            P[k] = x; P[k + 1] = y; P[k + 2] = z
        }
    Q.set(P)

    // constraints
    const ca = [], cb = [], cr = [], ck = []
    const add = (a, b, k) => {
        ca.push(a); cb.push(b)
        const dx_ = P[a * 3] - P[b * 3], dy_ = P[a * 3 + 1] - P[b * 3 + 1]
        cr.push(Math.hypot(dx_, dy_)); ck.push(k)
    }
    const id = (i, j) => j * nx + i
    for (let j = 0; j < ny; j++)
        for (let i = 0; i < nx; i++) {
            if (i + 1 < nx) add(id(i, j), id(i + 1, j), 1)
            if (j + 1 < ny) add(id(i, j), id(i, j + 1), 1)
            if (i + 1 < nx && j + 1 < ny) {
                add(id(i, j), id(i + 1, j + 1), 0.95)
                add(id(i + 1, j), id(i, j + 1), 0.95)
            }
            if (i + 2 < nx) add(id(i, j), id(i + 2, j), bendK)
            if (j + 2 < ny) add(id(i, j), id(i, j + 2), bendK)
            if (i + 4 < nx) add(id(i, j), id(i + 4, j), bendK * 0.5)
            if (j + 4 < ny) add(id(i, j), id(i, j + 4), bendK * 0.5)
        }
    const C = ca.length
    const A = Int32Array.from(ca), B = Int32Array.from(cb)
    const R = Float32Array.from(cr), K = Float32Array.from(ck)

    // self collision via spatial hash
    const minD = Math.min(dx, dy) * 0.8
    const cell = minD
    const HS = 1 << 15
    const head = new Int32Array(HS)
    const next = new Int32Array(N)
    const hash = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) & (HS - 1)
    function collide() {
        head.fill(-1)
        for (let p = 0; p < N; p++) {
            const h = hash(Math.floor(P[p * 3] / cell), Math.floor(P[p * 3 + 1] / cell), Math.floor(P[p * 3 + 2] / cell))
            next[p] = head[h]
            head[h] = p
        }
        const md2 = minD * minD
        for (let p = 0; p < N; p++) {
            const px = P[p * 3], py = P[p * 3 + 1], pz = P[p * 3 + 2]
            const ci = Math.floor(px / cell), cj = Math.floor(py / cell), ck2 = Math.floor(pz / cell)
            const pi = p % nx, pj = (p / nx) | 0
            for (let a = -1; a <= 1; a++)
                for (let b = -1; b <= 1; b++)
                    for (let c = -1; c <= 1; c++) {
                        let q = head[hash(ci + a, cj + b, ck2 + c)]
                        while (q >= 0) {
                            if (q > p) {
                                const qi = q % nx, qj = (q / nx) | 0
                                if (Math.abs(qi - pi) > 2 || Math.abs(qj - pj) > 2) {
                                    const ex = P[q * 3] - px, ey = P[q * 3 + 1] - py, ez = P[q * 3 + 2] - pz
                                    const d2 = ex * ex + ey * ey + ez * ez
                                    if (d2 < md2 && d2 > 1e-12) {
                                        const d = Math.sqrt(d2)
                                        const f = ((minD - d) / d) * 0.5
                                        P[p * 3] -= ex * f; P[p * 3 + 1] -= ey * f; P[p * 3 + 2] -= ez * f
                                        P[q * 3] += ex * f; P[q * 3 + 1] += ey * f; P[q * 3 + 2] += ez * f
                                    }
                                }
                            }
                            q = next[q]
                        }
                    }
        }
    }

    function solve() {
        for (let c = 0; c < C; c++) {
            const a = A[c] * 3, b = B[c] * 3
            const ex = P[b] - P[a], ey = P[b + 1] - P[a + 1], ez = P[b + 2] - P[a + 2]
            const d = Math.sqrt(ex * ex + ey * ey + ez * ez)
            if (d < 1e-9) continue
            const r = R[c]
            const f = ((d - r) / d) * 0.5 * K[c]
            P[a] += ex * f; P[a + 1] += ey * f; P[a + 2] += ez * f
            P[b] -= ex * f; P[b + 1] -= ey * f; P[b + 2] -= ez * f
        }
    }

    const frames = []
    const snap = () => {
        let cx = 0, cy = 0, cz = 0
        for (let p = 0; p < N; p++) { cx += P[p * 3]; cy += P[p * 3 + 1]; cz += P[p * 3 + 2] }
        cx /= N; cy /= N; cz /= N
        const f = new Float32Array(N * 3)
        for (let p = 0; p < N; p++) {
            f[p * 3] = P[p * 3] - cx; f[p * 3 + 1] = P[p * 3 + 1] - cy; f[p * 3 + 2] = P[p * 3 + 2] - cz
        }
        frames.push(f)
    }
    // flat frame without the seeding noise
    {
        const f = new Float32Array(N * 3)
        for (let j = 0; j < ny; j++)
            for (let i = 0; i < nx; i++) {
                const k = (j * nx + i) * 3
                f[k] = (i / (nx - 1) - 0.5) * W
                f[k + 1] = (0.5 - j / (ny - 1)) * H
                f[k + 2] = 0
            }
        frames.push(f)
    }

    const R0 = Math.hypot(W, H) / 2
    const ax = 1 + (rnd() - 0.5) * 0.15
    const ay = 1 + (rnd() - 0.5) * 0.15
    const subs = opts.substeps || 14
    const iters = opts.iterations || 6
    for (let st = 1; st <= stages; st++) {
        const t = st / stages
        // fast at first (sheet buckles), slower near the tight ball
        const e = 1 - Math.pow(1 - t, 1.7)
        const Rc = R0 * 1.02 + (ballR - R0 * 1.02) * e
        const flat = 0.5 + 0.5 * Math.pow(t, 0.8) // pillow-flat early, round late
        const rx = Rc * ax, ry = Rc * ay, rz = Math.max(ballR * 0.8, Rc * flat)
        for (let sub = 0; sub < subs; sub++) {
            // verlet with heavy damping (quasi-static crush)
            for (let p = 0; p < N * 3; p++) {
                const v = (P[p] - Q[p]) * 0.6
                Q[p] = P[p]
                P[p] += v
            }
            // gentle inward squeeze (hands)
            for (let p = 0; p < N; p++) {
                P[p * 3] *= 0.9985; P[p * 3 + 1] *= 0.9985
            }
            for (let it = 0; it < iters; it++) {
                solve()
                for (let p = 0; p < N; p++) {
                    const x = P[p * 3] / rx, y = P[p * 3 + 1] / ry, z = P[p * 3 + 2] / rz
                    const d = x * x + y * y + z * z
                    if (d > 1) {
                        const s2 = 1 / Math.sqrt(d)
                        P[p * 3] *= s2; P[p * 3 + 1] *= s2; P[p * 3 + 2] *= s2
                    }
                }
            }
            if (sub % 2 === 0) collide()
        }
        for (let c = 0; c < C; c++) {
            if (K[c] >= 0.95) continue
            const a = A[c] * 3, b = B[c] * 3
            const d = Math.hypot(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2])
            R[c] += (d - R[c]) * plastic
        }
        snap()
    }
    return { nx, ny, aspect: H, frames }
}

// ================= paper.js =================
// Thick paper sheet geometry: physics body (from the crush simulation) + a crisp
// crease network on top. The render mesh is built from the crease triangulation
// (each crease triangle subdivided), so creases always lie on mesh edges and stay sharp.

const SUB = 6

function rng32(seed) {
    let s = seed >>> 0 || 1
    return () => {
        s ^= s << 13; s ^= s >>> 17; s ^= s << 5
        return ((s >>> 0) % 1000003) / 1000003
    }
}

// crease pattern in uv space (u right, v down), shared by cards of the same variant
function buildCreasePattern(seed, cx = 8, cy = 11, jitter = 0.4) {
    const rnd = rng32(seed * 7919 + 13)
    const nn = (cx + 1) * (cy + 1)
    const nodes = new Float32Array(nn * 2)
    for (let j = 0; j <= cy; j++)
        for (let i = 0; i <= cx; i++) {
            let u = i / cx, v = j / cy
            if (i > 0 && i < cx) u += (rnd() - 0.5) * 2 * jitter / cx
            if (j > 0 && j < cy) v += (rnd() - 0.5) * 2 * jitter / cy
            const k = j * (cx + 1) + i
            nodes[k * 2] = u; nodes[k * 2 + 1] = v
        }
    const N = (i, j) => j * (cx + 1) + i
    const tris = []
    for (let j = 0; j < cy; j++)
        for (let i = 0; i < cx; i++) {
            const a = N(i, j), b = N(i + 1, j), c = N(i + 1, j + 1), d = N(i, j + 1)
            if (rnd() < 0.5) tris.push([a, d, b], [b, d, c])
            else tris.push([a, c, b], [a, d, c])
        }
    return { cx, cy, nn, nodes, tris }
}

function locate(pat, u, v) {
    // brute-ish point location, used only at build time
    let best = -1e9, bt = pat.tris[0], bw = [1, 0, 0]
    const n = pat.nodes
    for (const t of pat.tris) {
        const x1 = n[t[0] * 2], y1 = n[t[0] * 2 + 1], x2 = n[t[1] * 2], y2 = n[t[1] * 2 + 1], x3 = n[t[2] * 2], y3 = n[t[2] * 2 + 1]
        const den = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
        if (Math.abs(den) < 1e-12) continue
        const l1 = ((y2 - y3) * (u - x3) + (x3 - x2) * (v - y3)) / den
        const l2 = ((y3 - y1) * (u - x3) + (x1 - x3) * (v - y3)) / den
        const l3 = 1 - l1 - l2
        const m = Math.min(l1, l2, l3)
        if (m > best) { best = m; bt = t; bw = [l1, l2, l3]; if (m >= -1e-6) break }
    }
    const s0 = Math.max(0, bw[0]), s1 = Math.max(0, bw[1]), s2 = Math.max(0, bw[2])
    const s = s0 + s1 + s2 || 1
    return [bt, [s0 / s, s1 / s, s2 / s]]
}

// Static topology for one variant
function buildPaperTopology(pat, gnx, gny) {
    const perTri = ((SUB + 1) * (SUB + 2)) / 2
    const nf = pat.tris.length * perTri
    // perimeter samples for the paper edge
    const ES = 56
    const perim = []
    for (let i = 0; i < ES; i++) perim.push([i / ES, 0])
    for (let i = 0; i < ES; i++) perim.push([1, i / ES])
    for (let i = 0; i < ES; i++) perim.push([1 - i / ES, 1])
    for (let i = 0; i < ES; i++) perim.push([0, 1 - i / ES])
    const ne = perim.length
    const total = nf * 2 + ne * 2
    const uv = new Float32Array(total * 2)
    const cIdx = new Uint16Array(total * 3)
    const cW = new Float32Array(total * 3)
    const index = []
    let base = 0
    const node = pat.nodes
    for (const t of pat.tris) {
        const local = []
        let c = 0
        for (let r = 0; r <= SUB; r++) {
            local.push([])
            for (let q = 0; q <= SUB - r; q++) {
                const l1 = q / SUB, l2 = r / SUB, l0 = 1 - l1 - l2
                const vk = base + c
                cIdx[vk * 3] = t[0]; cIdx[vk * 3 + 1] = t[1]; cIdx[vk * 3 + 2] = t[2]
                cW[vk * 3] = l0; cW[vk * 3 + 1] = l1; cW[vk * 3 + 2] = l2
                uv[vk * 2] = node[t[0] * 2] * l0 + node[t[1] * 2] * l1 + node[t[2] * 2] * l2
                uv[vk * 2 + 1] = node[t[0] * 2 + 1] * l0 + node[t[1] * 2 + 1] * l1 + node[t[2] * 2 + 1] * l2
                local[r].push(vk)
                c++
            }
        }
        for (let r = 0; r < SUB; r++)
            for (let q = 0; q < SUB - r; q++) {
                const p0 = local[r][q], p1 = local[r][q + 1], p2 = local[r + 1][q]
                index.push(p0, p1, p2)
                if (q < SUB - r - 1) index.push(p1, local[r + 1][q + 1], p2)
            }
        base += perTri
    }
    const frontCount = index.length
    // back = mirror of front with reversed winding
    for (let v = 0; v < nf; v++) {
        uv[(nf + v) * 2] = uv[v * 2]; uv[(nf + v) * 2 + 1] = uv[v * 2 + 1]
        for (let k = 0; k < 3; k++) { cIdx[(nf + v) * 3 + k] = cIdx[v * 3 + k]; cW[(nf + v) * 3 + k] = cW[v * 3 + k] }
    }
    for (let i = 0; i < frontCount; i += 3) index.push(index[i] + nf, index[i + 2] + nf, index[i + 1] + nf)
    const backCount = index.length - frontCount
    // edge strip
    const e0 = nf * 2
    for (let i = 0; i < ne; i++) {
        const [u, v] = perim[i]
        const [t, w] = locate(pat, u, v)
        for (let s = 0; s < 2; s++) {
            const vk = e0 + i * 2 + s
            uv[vk * 2] = u; uv[vk * 2 + 1] = v
            for (let k = 0; k < 3; k++) { cIdx[vk * 3 + k] = t[k]; cW[vk * 3 + k] = w[k] }
        }
    }
    for (let i = 0; i < ne; i++) {
        const a = e0 + i * 2, b = e0 + ((i + 1) % ne) * 2
        // a: front, a+1: back
        index.push(a, a + 1, b, b, a + 1, b + 1)
    }
    const edgeCount = index.length - frontCount - backCount
    // body grid bilinear lookup
    const gI = new Uint16Array(total), gJ = new Uint16Array(total)
    const gU = new Float32Array(total), gV = new Float32Array(total)
    for (let v = 0; v < total; v++) {
        const x = Math.min(0.99999, Math.max(0, uv[v * 2])) * (gnx - 1)
        const y = Math.min(0.99999, Math.max(0, uv[v * 2 + 1])) * (gny - 1)
        gI[v] = Math.floor(x); gJ[v] = Math.floor(y)
        gU[v] = x - gI[v]; gV[v] = y - gJ[v]
    }
    // texture uv (flip v for three: v=0 bottom)
    const tuv = new Float32Array(total * 2)
    for (let v = 0; v < total; v++) { tuv[v * 2] = uv[v * 2]; tuv[v * 2 + 1] = 1 - uv[v * 2 + 1] }
    return { nf, ne, total, uv, tuv, cIdx, cW, index, frontCount, backCount, edgeCount, gI, gJ, gU, gV, e0 }
}

// One physical sheet
class PaperSheet {
    constructor(topo, pat, body, materials, seed) {
        this.topo = topo
        this.pat = pat
        this.body = body // { nx, ny, frames: Float32Array[] }
        const rnd = rng32(seed * 31 + 7)
        this.nodeRand = new Float32Array(pat.nn)
        for (let i = 0; i < pat.nn; i++) this.nodeRand[i] = rnd() * 2 - 1
        this.bow = (rnd() - 0.5) * 0.05
        const g = new THREE.BufferGeometry()
        this.pos = new Float32Array(topo.total * 3)
        this.nrm = new Float32Array(topo.total * 3)
        g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
        g.setAttribute("normal", new THREE.BufferAttribute(this.nrm, 3).setUsage(THREE.DynamicDrawUsage))
        g.setAttribute("uv", new THREE.BufferAttribute(topo.tuv, 2))
        g.setIndex(topo.index)
        g.addGroup(0, topo.frontCount, 0)
        g.addGroup(topo.frontCount, topo.backCount, 1)
        g.addGroup(topo.frontCount + topo.backCount, topo.edgeCount, 2)
        this.geometry = g
        this.mesh = new THREE.Mesh(g, materials)
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.mesh.frustumCulled = false
        const gn = body.nx * body.ny
        this.bp = new Float32Array(gn * 3)
        this.bn = new Float32Array(gn * 3)
        this.lastC = -1
        this.lastF = 1
        this.thickness = 0.0055
        this.update(0)
    }

    update(c, flat = 1) {
        if (Math.abs(c - this.lastC) < 0.0008 && Math.abs(flat - this.lastF) < 0.002) return
        this.lastC = c
        this.lastF = flat
        const { body, topo } = this
        const { nx, ny, frames } = body
        // --- body at crumple c (frames are not uniform in shape change; c is linear in index)
        const fi = Math.max(0, Math.min(frames.length - 1.0001, c * (frames.length - 1)))
        const i0 = Math.floor(fi), t = fi - i0
        const A = frames[i0], B = frames[i0 + 1]
        const bp = this.bp
        for (let k = 0; k < bp.length; k++) bp[k] = A[k] + (B[k] - A[k]) * t
        if (flat !== 1) for (let k = 2; k < bp.length; k += 3) bp[k] *= flat
        // grid normals (central differences)
        const bn = this.bn
        for (let j = 0; j < ny; j++)
            for (let i = 0; i < nx; i++) {
                const iL = Math.max(0, i - 1), iR = Math.min(nx - 1, i + 1)
                const jU = Math.max(0, j - 1), jD = Math.min(ny - 1, j + 1)
                const a = (j * nx + iR) * 3, b = (j * nx + iL) * 3, cc = (jU * nx + i) * 3, d = (jD * nx + i) * 3
                const tx = bp[a] - bp[b], ty = bp[a + 1] - bp[b + 1], tz = bp[a + 2] - bp[b + 2]
                const sx = bp[cc] - bp[d], sy = bp[cc + 1] - bp[d + 1], sz = bp[cc + 2] - bp[d + 2]
                let x = ty * sz - tz * sy, y = tz * sx - tx * sz, z = tx * sy - ty * sx
                const l = Math.hypot(x, y, z) || 1
                const k = (j * nx + i) * 3
                bn[k] = x / l; bn[k + 1] = y / l; bn[k + 2] = z / l
            }
        // --- crease amplitude: faint memory when flat, crisp facets when crushed
        const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))
        const amp = 0.0005 + (0.016 + 0.01 * (1 - flat)) * sm(c / 0.25) + 0.024 * c * c
        const bow = this.bow * (1 - sm(c / 0.3))
        const pos = this.pos, nr = this.nodeRand
        const { cIdx, cW, gI, gJ, gU, gV, uv } = topo
        const evalF = (v, out) => {
            const i = gI[v], j = gJ[v], fu = gU[v], fv = gV[v]
            const k00 = (j * nx + i) * 3, k10 = k00 + 3, k01 = k00 + nx * 3, k11 = k01 + 3
            const w00 = (1 - fu) * (1 - fv), w10 = fu * (1 - fv), w01 = (1 - fu) * fv, w11 = fu * fv
            let x = bp[k00] * w00 + bp[k10] * w10 + bp[k01] * w01 + bp[k11] * w11
            let y = bp[k00 + 1] * w00 + bp[k10 + 1] * w10 + bp[k01 + 1] * w01 + bp[k11 + 1] * w11
            let z = bp[k00 + 2] * w00 + bp[k10 + 2] * w10 + bp[k01 + 2] * w01 + bp[k11 + 2] * w11
            const nx_ = bn[k00] * w00 + bn[k10] * w10 + bn[k01] * w01 + bn[k11] * w11
            const ny_ = bn[k00 + 1] * w00 + bn[k10 + 1] * w10 + bn[k01 + 1] * w01 + bn[k11 + 1] * w11
            const nz_ = bn[k00 + 2] * w00 + bn[k10 + 2] * w10 + bn[k01 + 2] * w01 + bn[k11 + 2] * w11
            const o = v * 3
            const d = (nr[cIdx[o]] * cW[o] + nr[cIdx[o + 1]] * cW[o + 1] + nr[cIdx[o + 2]] * cW[o + 2]) * amp
            const u = uv[v * 2] * 2 - 1
            const bz = bow * (1 - u * u)
            out[0] = x + nx_ * (d + bz); out[1] = y + ny_ * (d + bz); out[2] = z + nz_ * (d + bz)
        }
        const tmp = [0, 0, 0]
        const nf = topo.nf
        for (let v = 0; v < nf; v++) {
            evalF(v, tmp)
            pos[v * 3] = tmp[0]; pos[v * 3 + 1] = tmp[1]; pos[v * 3 + 2] = tmp[2]
        }
        // front normals (per crease triangle -> sharp creases)
        this._normals(0, topo.frontCount)
        // back = offset along -normal
        const th = this.thickness
        const nrm = this.nrm
        for (let v = 0; v < nf; v++) {
            const a = v * 3, b = (nf + v) * 3
            pos[b] = pos[a] - nrm[a] * th; pos[b + 1] = pos[a + 1] - nrm[a + 1] * th; pos[b + 2] = pos[a + 2] - nrm[a + 2] * th
            nrm[b] = -nrm[a]; nrm[b + 1] = -nrm[a + 1]; nrm[b + 2] = -nrm[a + 2]
        }
        // edges: front point + back point (normal from small finite difference)
        const e0 = topo.e0, ne = topo.ne
        const f0 = [0, 0, 0]
        for (let i = 0; i < ne; i++) {
            const v = e0 + i * 2
            evalF(v, f0)
            // approximate normal from neighbouring perimeter samples' body normal
            const gi = gI[v], gj = gJ[v]
            const kk = (gj * nx + gi) * 3
            const nxx = bn[kk], nyy = bn[kk + 1], nzz = bn[kk + 2]
            pos[v * 3] = f0[0]; pos[v * 3 + 1] = f0[1]; pos[v * 3 + 2] = f0[2]
            pos[(v + 1) * 3] = f0[0] - nxx * th; pos[(v + 1) * 3 + 1] = f0[1] - nyy * th; pos[(v + 1) * 3 + 2] = f0[2] - nzz * th
        }
        this._normals(topo.frontCount + topo.backCount, topo.edgeCount, true)
        this.geometry.attributes.position.needsUpdate = true
        this.geometry.attributes.normal.needsUpdate = true
        this.geometry.computeBoundingSphere()
    }

    _normals(start, count, edge) {
        const idx = this.topo.index, pos = this.pos, nrm = this.nrm
        // clear
        for (let i = start; i < start + count; i++) {
            const v = idx[i] * 3
            nrm[v] = 0; nrm[v + 1] = 0; nrm[v + 2] = 0
        }
        for (let i = start; i < start + count; i += 3) {
            const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3
            const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2]
            const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2]
            const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx
            nrm[a] += x; nrm[a + 1] += y; nrm[a + 2] += z
            nrm[b] += x; nrm[b + 1] += y; nrm[b + 2] += z
            nrm[c] += x; nrm[c + 1] += y; nrm[c + 2] += z
        }
        for (let i = start; i < start + count; i++) {
            const v = idx[i] * 3
            const l = Math.hypot(nrm[v], nrm[v + 1], nrm[v + 2])
            if (l > 1e-12 && Math.abs(l - 1) > 1e-6) { nrm[v] /= l; nrm[v + 1] /= l; nrm[v + 2] /= l }
        }
    }
}

// ================= posters.js =================
// Original poster artwork, drawn to canvas and used as the printed side of each sheet.
// Photo posters take an image URL; typographic posters are fully generated.
const POSTER_W = 1024
const POSTER_H = 1365

function cv() {
    const c = document.createElement("canvas")
    c.width = POSTER_W
    c.height = POSTER_H
    return [c, c.getContext("2d")]
}

function cover(ctx, img, x, y, w, h, fx = 0.5, fy = 0.4) {
    const ir = img.width / img.height, r = w / h
    let sw, sh, sx, sy
    if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) * fx; sy = 0 }
    else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) * fy }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

const F = {
    display: '"Anton", "Impact", "Arial Narrow", sans-serif',
    serif: '"Instrument Serif", "Times New Roman", serif',
    sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
    mono: '"DM Mono", "Courier New", monospace',
}

const DESIGNS = {
    ampersand(ctx) {
        ctx.fillStyle = "#a9f06a"; ctx.fillRect(0, 0, POSTER_W, POSTER_H)
        ctx.fillStyle = "#0d0f0c"
        ctx.font = "italic 1080px " + F.serif
        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"
        ctx.fillText("&", POSTER_W * 0.5, POSTER_H * 0.82)
        ctx.font = "500 30px " + F.mono; ctx.textAlign = "left"
        ctx.fillText("ISSUE 07 — PAPER & PRESS", 64, 92)
        ctx.textAlign = "right"; ctx.fillText("2026", POSTER_W - 64, 92)
    },
    still(ctx) {
        ctx.fillStyle = "#0f2324"; ctx.fillRect(0, 0, POSTER_W, POSTER_H)
        ctx.fillStyle = "#7fe3cf"
        ctx.font = "120px " + F.serif; ctx.textAlign = "left"; ctx.textBaseline = "top"
        ctx.fillText("Still.", 70, 70)
        ctx.textAlign = "right"; ctx.textBaseline = "alphabetic"
        ctx.fillText("Here.", POSTER_W - 70, POSTER_H - 80)
        ctx.font = "400 22px " + F.mono; ctx.textAlign = "center"; ctx.fillStyle = "rgba(127,227,207,0.75)"
        const lines = ["SOME THINGS STAY FOLDED IN YOUR POCKET", "FOR YEARS AND STILL OPEN LIKE NEW.", "KEEP THE CREASES — THEY ARE THE STORY."]
        lines.forEach((l, i) => ctx.fillText(l, POSTER_W / 2, POSTER_H * 0.48 + i * 34))
    },
    loud(ctx) {
        ctx.fillStyle = "#f6f5f1"; ctx.fillRect(0, 0, POSTER_W, POSTER_H)
        ctx.save(); ctx.translate(POSTER_W * 0.53, POSTER_H * 0.5); ctx.rotate(-Math.PI / 2)
        ctx.fillStyle = "#0b0b0b"; ctx.font = "760px " + F.display; ctx.textAlign = "center"; ctx.textBaseline = "middle"
        ctx.fillText("LOUD", 0, 30)
        ctx.restore()
        ctx.fillStyle = "#0b0b0b"; ctx.font = "500 26px " + F.mono; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"
        ctx.fillText("VOL. 3", 56, POSTER_H - 56)
    },
    ledger(ctx) {
        ctx.fillStyle = "#1b0a33"; ctx.fillRect(0, 0, POSTER_W, POSTER_H)
        ctx.fillStyle = "#c9a8ff"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"
        const vals = ["12,400", "13,950", "15,320", "16,880", "18,240", "19,610", "21,000"]
        let y = 140
        vals.forEach((v, i) => {
            const size = 46 + i * 21
            ctx.font = "300 " + size + "px " + F.sans
            y += size * 1.06
            ctx.fillText("$" + v, 60, y)
        })
    },
    plane(ctx) {
        ctx.fillStyle = "#fbfaf7"; ctx.fillRect(0, 0, POSTER_W, POSTER_H)
        ctx.strokeStyle = "#111"; ctx.lineWidth = 9; ctx.lineJoin = "round"; ctx.lineCap = "round"
        // paper plane
        ctx.beginPath()
        ctx.moveTo(250, 760); ctx.lineTo(800, 520); ctx.lineTo(470, 830); ctx.closePath(); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(800, 520); ctx.lineTo(520, 760); ctx.lineTo(470, 830); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(520, 760); ctx.lineTo(560, 900); ctx.lineTo(470, 830); ctx.stroke()
        // dashed loop trail
        ctx.setLineDash([2, 26]); ctx.lineWidth = 8
        ctx.beginPath(); ctx.moveTo(240, 770)
        ctx.bezierCurveTo(60, 860, 90, 1120, 330, 1080)
        ctx.bezierCurveTo(560, 1040, 420, 880, 300, 980)
        ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = "#111"; ctx.font = "64px " + F.serif; ctx.textAlign = "left"
        ctx.fillText("Let it fly.", 70, 170)
    },
    photo(ctx, img, label) {
        ctx.fillStyle = "#222"; ctx.fillRect(0, 0, POSTER_W, POSTER_H)
        if (img) cover(ctx, img, 0, 0, POSTER_W, POSTER_H)
        if (label) {
            ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.font = "500 26px " + F.mono
            ctx.textAlign = "left"; ctx.fillText(label, 52, POSTER_H - 52)
        }
    },
}

// Curated Unsplash set (free licence): editorial portraits, architecture and 3D art
const DEFAULT_POSTERS = [
    { design: "photo", src: "https://images.unsplash.com/photo-1659469377768-4f42f2f091c5?auto=format&fit=crop&w=1100&q=82" },
    { design: "photo", src: "https://images.unsplash.com/photo-1733413788848-6f9e0c1c414c?auto=format&fit=crop&w=1100&q=82" },
    { design: "photo", src: "https://images.unsplash.com/photo-1691036562015-56ebf6648f8c?auto=format&fit=crop&w=1100&q=82" },
    { design: "photo", src: "https://images.unsplash.com/photo-1670189577367-2c6ef31a4b8c?auto=format&fit=crop&w=1100&q=82" },
    { design: "photo", src: "https://images.unsplash.com/photo-1660361339436-ddd4b85372da?auto=format&fit=crop&w=1100&q=82" },
    { design: "photo", src: "https://images.unsplash.com/photo-1695157712101-7336d70c373e?auto=format&fit=crop&w=1100&q=82" },
    { design: "photo", src: "https://images.unsplash.com/photo-1714924674541-9e11b2d1dd1d?auto=format&fit=crop&w=1100&q=82" },
    { design: "photo", src: "https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?auto=format&fit=crop&w=1100&q=82" },
    { design: "photo", src: "https://images.unsplash.com/photo-1793891546267-5edd70f3ee5e?auto=format&fit=crop&w=1100&q=82" },
    { design: "photo", src: "https://images.unsplash.com/photo-1676731820551-4b2988ae4e29?auto=format&fit=crop&w=1100&q=82" },
]

function loadImage(src) {
    return new Promise((res) => {
        if (!src) return res(null)
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => res(img)
        img.onerror = () => res(null)
        img.src = src
    })
}

// returns a canvas; redraw(canvas) can be called again after fonts load
function drawPoster(def, img) {
    const [c, ctx] = cv()
    const d = DESIGNS[def.design] || DESIGNS.photo
    if (def.design === "photo") d(ctx, img, def.label)
    else d(ctx)
    return c
}

// ================= scene.js =================

// ---------- procedural paper fibre maps ----------
function fibreMaps(size = 512, seed = 3) {
    let s = seed
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    const h = new Float32Array(size * size)
    // layered value noise + elongated fibres
    const octave = (cell, amp) => {
        const gw = Math.ceil(size / cell) + 2
        const g = new Float32Array(gw * gw).map(() => rnd())
        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++) {
                const fx = x / cell, fy = y / cell
                const ix = Math.floor(fx), iy = Math.floor(fy)
                let tx = fx - ix, ty = fy - iy
                tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty)
                const a = g[iy * gw + ix], b = g[iy * gw + ix + 1], c = g[(iy + 1) * gw + ix], d = g[(iy + 1) * gw + ix + 1]
                h[y * size + x] += (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty) * amp
            }
    }
    octave(64, 0.35); octave(16, 0.3); octave(4, 0.25); octave(1.5, 0.35)
    for (let i = 0; i < 2600; i++) {
        let x = rnd() * size, y = rnd() * size
        const ang = rnd() * Math.PI
        const len = 6 + rnd() * 26
        const st = 0.06 + rnd() * 0.12
        for (let t = 0; t < len; t++) {
            const xi = ((Math.floor(x + Math.cos(ang) * t) % size) + size) % size
            const yi = ((Math.floor(y + Math.sin(ang) * t) % size) + size) % size
            h[yi * size + xi] += st
        }
    }
    const nCanvas = document.createElement("canvas")
    nCanvas.width = nCanvas.height = size
    const nctx = nCanvas.getContext("2d")
    const nimg = nctx.createImageData(size, size)
    const rCanvas = document.createElement("canvas")
    rCanvas.width = rCanvas.height = size
    const rctx = rCanvas.getContext("2d")
    const rimg = rctx.createImageData(size, size)
    let mn = 1e9, mx = -1e9
    for (const v of h) { mn = Math.min(mn, v); mx = Math.max(mx, v) }
    const H = (x, y) => (h[((y + size) % size) * size + ((x + size) % size)] - mn) / (mx - mn)
    for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
            const dx = (H(x + 1, y) - H(x - 1, y)) * 2.2
            const dy = (H(x, y + 1) - H(x, y - 1)) * 2.2
            const l = Math.hypot(dx, dy, 1)
            const i = (y * size + x) * 4
            nimg.data[i] = ((-dx / l) * 0.5 + 0.5) * 255
            nimg.data[i + 1] = ((dy / l) * 0.5 + 0.5) * 255
            nimg.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255
            nimg.data[i + 3] = 255
            const r = 200 + H(x, y) * 55
            rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = r
            rimg.data[i + 3] = 255
        }
    nctx.putImageData(nimg, 0, 0)
    rctx.putImageData(rimg, 0, 0)
    const normal = new THREE.CanvasTexture(nCanvas)
    const rough = new THREE.CanvasTexture(rCanvas)
    for (const t of [normal, rough]) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping
        t.repeat.set(2, 2.67)
        t.anisotropy = 4
    }
    return { normal, rough }
}

function createPaperScene(container, opts = {}) {
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" })
    renderer.setPixelRatio(Math.min(opts.maxDpr || 2, window.devicePixelRatio || 1))
    // no tone mapping: poster colours and the backdrop colour stay exactly as authored
    renderer.toneMapping = THREE.NoToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.VSMShadowMap
    container.appendChild(renderer.domElement)
    renderer.domElement.style.display = "block"
    renderer.domElement.style.width = "100%"
    renderer.domElement.style.height = "100%"

    const scene = new THREE.Scene()
    const bg = new THREE.Color(opts.background || "#f7f7f5")
    scene.background = bg
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    const LS = opts.lightScale || 0.68 // calibrated so a white sheet renders just below full white
    scene.environmentIntensity = 0.38 * LS

    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100)

    // backdrop: matte sweep just behind the paper
    // invisible shadow catcher: the backdrop shows the exact chosen colour, only shadows darken it
    const backMat = new THREE.ShadowMaterial({ color: new THREE.Color("#1d1a16"), opacity: opts.shadowOpacity == null ? 0.34 : opts.shadowOpacity })
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), backMat)
    backdrop.position.z = -0.42
    backdrop.receiveShadow = true
    scene.add(backdrop)

    // studio lights
    const key = new THREE.DirectionalLight(0xffffff, 2.25 * LS)
    key.position.set(-1.6, 3.2, 5.5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -6; key.shadow.camera.right = 6
    key.shadow.camera.top = 4; key.shadow.camera.bottom = -4
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 20
    key.shadow.radius = 14
    key.shadow.blurSamples = 20
    key.shadow.bias = -0.0004
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.45 * LS)
    fill.position.set(3.5, -0.5, 4)
    scene.add(fill)
    const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d6d2, 0.18 * LS)
    scene.add(hemi)

    // materials
    const fib = fibreMaps(512, 7)
    const paperBack = new THREE.MeshPhysicalMaterial({
        color: "#f4f2ed", roughness: 0.92, roughnessMap: fib.rough, normalMap: fib.normal,
        normalScale: new THREE.Vector2(0.35, 0.35), sheen: 0.35, sheenRoughness: 0.8, sheenColor: new THREE.Color("#ffffff"),
    })
    const paperEdge = new THREE.MeshPhysicalMaterial({ color: "#ebe8e1", roughness: 0.95, side: THREE.DoubleSide })
    const makeFront = (tex) =>
        new THREE.MeshPhysicalMaterial({
            map: tex, roughness: 0.82, roughnessMap: fib.rough, normalMap: fib.normal,
            normalScale: new THREE.Vector2(0.22, 0.22), sheen: 0.05, sheenRoughness: 0.9, sheenColor: new THREE.Color("#ffffff"),
        })

    // composer: render -> ambient occlusion -> output (tone map + sRGB)
    const target = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4 })
    const composer = new EffectComposer(renderer, target)
    composer.addPass(new RenderPass(scene, camera))
    const gtao = new GTAOPass(scene, camera, 2, 2)
    gtao.updateGtaoMaterial({ radius: 0.18, distanceExponent: 1.4, thickness: 1, scale: 1.1, samples: 16 })
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 })
    gtao.blendIntensity = opts.aoIntensity == null ? 0.9 : opts.aoIntensity
    composer.addPass(gtao)
    composer.addPass(new OutputPass())

    // paper variants
    const bodies = opts.bodies // array of {nx, ny, frames}
    const variants = bodies.map((b, i) => {
        const pat = buildCreasePattern(i + 1)
        return { pat, topo: buildPaperTopology(pat, b.nx, b.ny), body: b }
    })

    const sheets = []
    function addSheet(tex, variantIndex, seed) {
        const v = variants[variantIndex % variants.length]
        const mats = [makeFront(tex), paperBack, paperEdge]
        const s = new PaperSheet(v.topo, v.pat, v.body, mats, seed)
        scene.add(s.mesh)
        sheets.push(s)
        return s
    }

    let W = 1, H = 1
    function resize(w, h) {
        W = Math.max(1, w); H = Math.max(1, h)
        renderer.setSize(W, H, false)
        composer.setSize(W, H)
        gtao.setSize(W * renderer.getPixelRatio(), H * renderer.getPixelRatio())
        camera.aspect = W / H
        // frame: card height (1.333) occupies ~52% of view height, but keep 3+ cards on narrow screens
        const cardH = 4 / 3
        const vfov = THREE.MathUtils.degToRad(camera.fov)
        // landscape: card height ~64% of the view; portrait: card width ~54% of the view
        let viewH = cardH / 0.64
        if (camera.aspect < 1) viewH = Math.max(viewH, 1 / 0.54 / camera.aspect)
        camera.position.set(0, 0, viewH / 2 / Math.tan(vfov / 2))
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
    }

    function render() {
        composer.render()
    }

    function dispose() {
        renderer.dispose()
        renderer.forceContextLoss()
        composer.dispose && composer.dispose()
        container.removeChild(renderer.domElement)
    }

    return { THREE, scene, camera, renderer, addSheet, sheets, resize, render, dispose, makeFront, key }
}

// ================= timeline.js =================
// Carousel choreography from a continuous position s (s = index of the poster at centre).
// Interactive: s is driven by autoplay, page scroll or arrows; hover state adds lift,
// cursor-follow tilt on the centre sheet and a partial un-crumple on hovered wads.
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x)
const sm = (x) => { x = clamp01(x); return x * x * (3 - 2 * x) }

function hash(j) {
    let h = (j | 0) * 374761393 + 668265263
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const tiltOf = (j) => (hash(j * 3 + 1) - 0.62) * 0.2

function settle(dt) {
    if (dt < 0 || dt > 2) return 0
    return Math.exp(-5.5 * dt) * Math.sin(12 * dt)
}

// o: { wad, time, lastArrive, hover: Map<key, 0..1>, pointer: {x, y} (-1..1 over component) }
function carouselItems(s, nPosters, o) {
    const P = (j) => ((j % nPosters) + nPosters) % nPosters
    const items = []
    const wad = o.wad
    const D = o.camZ || 4.9 // camera distance, used to keep perspective size constant when depth-layering
    const lo = Math.floor(s) - 3, hi = Math.ceil(s) + 3
    // hover on the centre sheet pushes the neighbours outward to give it room
    let hc = 0
    if (o.hover) {
        const jc = Math.round(s)
        if (Math.abs(jc - s) < 0.5) hc = o.hover.get("j" + jc) || 0
    }
    for (let j = lo; j <= hi; j++) {
        const p = j - s
        const a = Math.abs(p)
        if (a > 3.2) continue
        const sgn = p < 0 ? -1 : 1
        const k = sm(a)
        const key = "j" + j
        const h = (o.hover && o.hover.get(key)) || 0
        let c = wad * k + (a > 1 ? (a - 1) * 0.08 : 0)
        c *= 1 - 0.32 * h * k // hovered wad breathes open a little
        const tumble = 1 - 0.55 * h
        let rx = Math.cos(p * 1.35 + j * 0.7) * 0.34 * k * tumble
        let ry = Math.sin(p * 1.85 + j) * 0.46 * k * tumble
        let rz = tiltOf(j) * (1 - k) - p * 0.5 * k * tumble
        if (a < 0.5) rz += settle(o.time - o.lastArrive) * 0.075
        const centreW = 1 - sm(a / 0.5)
        if (h > 0 && centreW > 0) {
            rx += -o.pointer.y * 0.1 * h * centreW
            ry += o.pointer.x * 0.13 * h * centreW
        }
        // depth layers: centre sheet in front, wads well behind it, outer wads further back
        let x = sgn * (a <= 1 ? a * 0.97 : 0.97 + (a - 1) * 0.88)
        x += sgn * k * (0.07 * hc + 0.05 * h) // make room for the hovered card / opening wad
        let z = -0.3 * k - 0.07 * Math.max(0, a - 1) * k
        z += h * (centreW * 0.06 + (1 - centreW) * 0.03)
        const persp = (D - z) / D // compensate the size lost to depth
        items.push({
            key, j, poster: P(j),
            x: x * persp, y: (-0.015 * k + 0.008 * h) * persp, z,
            rx, ry, rz, spin: 0,
            c, flat: 0.55,
            scale: (1 + 0.03 * h * centreW) * persp,
        })
    }
    return items
}

// ================= app.js =================

async function createPaperCarousel(container, { bodies, posters, background, maxDpr }) {
    const S = createPaperScene(container, { bodies, background, maxDpr })
    // poster textures
    const textures = []
    const imgs = await Promise.all(posters.map((p) => loadImage(p.src)))
    posters.forEach((p, i) => {
        const canvas = drawPoster(p, imgs[i])
        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = S.renderer.capabilities.getMaxAnisotropy()
        tex.generateMipmaps = true
        tex.minFilter = THREE.LinearMipmapLinearFilter
        textures.push({ tex, def: p, img: imgs[i] })
    })
    function redrawPosters() {
        textures.forEach((t) => {
            const c = drawPoster(t.def, t.img)
            t.tex.image = c
            t.tex.needsUpdate = true
        })
    }

    const pool = new Map() // key -> sheet
    const nVar = bodies.length
    const q = new THREE.Quaternion()
    const qz = new THREE.Quaternion()
    const e = new THREE.Euler()
    const axis = new THREE.Vector3()

    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    // returns the key of the sheet under a point given in normalised device coords
    function pick(nx, ny) {
        ndc.set(nx, ny)
        ray.setFromCamera(ndc, S.camera)
        const vis = []
        for (const [k, sh] of pool) if (sh.mesh.visible) vis.push([k, sh])
        const hits = ray.intersectObjects(vis.map((v) => v[1].mesh), false)
        if (!hits.length) return null
        const m = hits[0].object
        for (const [k, sh] of vis) if (sh.mesh === m) return k
        return null
    }

    function render(items) {
        const used = new Set()
        for (const it of items) {
            let sh = pool.get(it.key)
            if (!sh) {
                const v = ((it.j % nVar) + nVar) % nVar
                sh = S.addSheet(textures[it.poster].tex, v, Math.abs(it.j) + 1)
                pool.set(it.key, sh)
            }
            used.add(it.key)
            const mat = sh.mesh.material[0]
            const tex = textures[it.poster].tex
            if (mat.map !== tex) { mat.map = tex; mat.needsUpdate = true }
            sh.update(it.c, it.flat == null ? 1 : it.flat)
            sh.mesh.visible = true
            sh.mesh.position.set(it.x, it.y, it.z)
            e.set(it.rx, it.ry, it.rz)
            sh.mesh.quaternion.setFromEuler(e)
            if (it.spin) {
                axis.set(it.spinAxis[0], it.spinAxis[1], it.spinAxis[2])
                q.setFromAxisAngle(axis, it.spin)
                qz.setFromAxisAngle(axis.set(0, 0, 1), it.rz)
                sh.mesh.quaternion.copy(qz).multiply(q)
            }
            sh.mesh.scale.setScalar(it.scale)
        }
        for (const [k, sh] of pool) {
            if (!used.has(k)) {
                sh.mesh.visible = false
                if (pool.size > 14) {
                    S.scene.remove(sh.mesh)
                    sh.geometry.dispose()
                    sh.mesh.material[0].dispose()
                    pool.delete(k)
                    const i = S.sheets.indexOf(sh)
                    if (i >= 0) S.sheets.splice(i, 1)
                }
            }
        }
        S.render()
    }

    return { render, pick, count: textures.length, resize: S.resize, redrawPosters, dispose: S.dispose, S }
}

// ---------------------------------------------------------------- Framer component
// Crush simulations run once per page in Web Workers and are shared by every instance.
// A 24x32 body grid matches the look of the full grid (the crisp creases come from the crease layer)
// at a fraction of the cost, so the carousel appears almost immediately.
const SIM_GRID = { nx: 24, ny: 32 }
let bodiesPromise = null
function makeBodies(seeds) {
    if (bodiesPromise) return bodiesPromise
    const run = (seed) =>
        new Promise((resolve) => {
            const opts = { seed, nx: SIM_GRID.nx, ny: SIM_GRID.ny }
            try {
                const src =
                    "self.onmessage=function(e){var f=(" + crumpleSim.toString() + ");var r=f(e.data);" +
                    "self.postMessage(r,r.frames.map(function(x){return x.buffer}))}"
                const url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }))
                const w = new Worker(url)
                let settled = false
                const finish = (data) => { if (settled) return; settled = true; clearTimeout(timer); w.terminate(); URL.revokeObjectURL(url); resolve(data || crumpleSim(opts)) }
                // if workers are blocked or slow (some sandboxes), simulate on the main thread instead
                const timer = setTimeout(() => finish(null), 4000)
                w.onmessage = (e) => finish(e.data)
                w.onerror = () => finish(null)
                w.postMessage(opts)
            } catch (err) {
                resolve(crumpleSim(opts))
            }
        })
    bodiesPromise = Promise.all(seeds.map(run))
    return bodiesPromise
}
const BODY_SEEDS = [11, 22, 33]
// start simulating as soon as the module loads, before the component mounts
if (typeof window !== "undefined" && typeof Worker !== "undefined") {
    try { makeBodies(BODY_SEEDS) } catch (e) {}
}

let fontsInjected = false
function injectFonts() {
    if (fontsInjected || typeof document === "undefined") return
    fontsInjected = true
    const l = document.createElement("link")
    l.rel = "stylesheet"
    l.href = "https://fonts.googleapis.com/css2?family=Anton&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=Inter:wght@300;500&display=swap"
    document.head.appendChild(l)
}

function Chevron({ dir, size, color }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d={dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function ArrowButton({ dir, onClick, a }) {
    const [hover, setHover] = React.useState(false)
    const [down, setDown] = React.useState(false)
    return (
        <button
            type="button"
            aria-label={dir < 0 ? "Previous poster" : "Next poster"}
            onClick={onClick}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => { setHover(false); setDown(false) }}
            onPointerDown={() => setDown(true)}
            onPointerUp={() => setDown(false)}
            style={{
                width: a.size, height: a.size, borderRadius: a.radius, border: a.border ? "1px solid " + a.borderColor : "none",
                background: hover ? a.hoverFill : a.fill, color: a.color, cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto",
                boxShadow: a.shadow ? "0 1px 2px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.10)" : "none",
                backdropFilter: a.blur ? "blur(10px)" : "none", WebkitBackdropFilter: a.blur ? "blur(10px)" : "none",
                transform: "scale(" + (down ? 0.92 : hover ? 1.06 : 1) + ") translateX(" + (hover ? dir * 2 : 0) + "px)",
                transition: "transform 0.25s cubic-bezier(.2,.8,.2,1), background 0.2s",
            }}
        >
            <Chevron dir={dir} size={Math.round(a.size * 0.42)} color={a.color} />
        </button>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 720
 */
export default function PaperCarousel3D(props) {
    const {
        mode = "auto", interval = 1.2, scrollPerStep = 420,
        crumple = 0.32, hoverEffect = true, images, background = "#F7F7F5", quality = "high",
        arrowPosition = "bottom", arrowSize = 48, arrowColor = "#111111",
        arrowFill = "rgba(255,255,255,0.85)", arrowHoverFill = "#FFFFFF", arrowRadius = 999,
        arrowBorder = true, arrowBorderColor = "rgba(0,0,0,0.08)", arrowShadow = true, arrowBlur = true, arrowInset = 32, arrowGap = 12,
        style,
    } = props
    const hostRef = React.useRef(null)
    const appRef = React.useRef(null)
    const ctl = React.useRef(null) // navigation controller
    const live = React.useRef({})
    live.current = { mode, interval, scrollPerStep, crumple, hoverEffect }
    const [status, setStatus] = React.useState("loading")
    const reduceMotion = useReducedMotion()
    const rt = RenderTarget.current()
    const isStatic = rt === RenderTarget.canvas || rt === RenderTarget.export

    const imageKey = (images || []).map((x) => (typeof x === "string" ? x : x && x.src) || "").join("|")

    React.useEffect(() => {
        const host = hostRef.current
        if (!host) return
        let disposed = false
        let raf = 0
        let ro = null, io = null
        let visible = true
        const cleanups = []
        injectFonts()
        const userImgs = imageKey ? imageKey.split("|").filter(Boolean) : []
        const posters = userImgs.length ? userImgs.map((src) => ({ design: "photo", src })) : DEFAULT_POSTERS

        // navigation state
        const now = () => performance.now() / 1000
        const st = { s: 0, T: 0, lastArrive: -10, lastStep: now(), hover: new Map(), hoverKey: null, pointer: { x: 0, y: 0 }, dirty: true, tw: null }
        // glide from the current position to T, timed by the real clock (immune to ticker lag smoothing)
        const ease = gsap.parseEase("power3.inOut")
        const goTo = (T) => {
            st.T = T
            st.lastStep = now()
            st.tw = { from: st.s, to: T, t0: now(), dur: reduceMotion ? 0.001 : 0.62 }
            st.dirty = true
        }
        ctl.current = { next: () => goTo(st.T + 1), prev: () => goTo(st.T - 1) }

        const start = async () => {
            const bodies = await makeBodies(BODY_SEEDS)
            if (disposed) return
            let app
            try {
                app = await createPaperCarousel(host, { bodies, posters, background, maxDpr: quality === "high" ? 2 : 1.25 })
            } catch (e) {
                setStatus("error")
                return
            }
            if (disposed) { app.dispose(); return }
            appRef.current = app
            const canvas = app.S.renderer.domElement
            const draw = () => {
                const L = live.current
                app.render(carouselItems(st.s, app.count, { wad: L.crumple, time: now(), lastArrive: st.lastArrive, hover: st.hover, pointer: st.pointer, camZ: app.S.camera.position.z }))
            }
            const size = () => { app.resize(host.clientWidth || 1, host.clientHeight || 1); st.dirty = true; if (isStatic) draw() }
            // no loading state: the backdrop shows until the first frame is drawn, then the scene fades in
            if (!isStatic) { canvas.style.opacity = "0"; canvas.style.transition = "opacity 0.5s ease" }
            size()
            draw()
            if (!isStatic) requestAnimationFrame(() => requestAnimationFrame(() => { if (!disposed) canvas.style.opacity = "1" }))
            ro = new ResizeObserver(size)
            ro.observe(host)
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!disposed) { app.redrawPosters(); st.dirty = true; if (isStatic) draw() } })
            setStatus("ready")
            if (isStatic) { draw(); return }

            // ---- scroll source (window, or the nearest scrollable ancestor)
            const findScroller = () => {
                let el = host.parentElement
                while (el && el !== document.body && el !== document.documentElement) {
                    const cs = getComputedStyle(el)
                    if (/(auto|scroll|overlay)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) return el
                    el = el.parentElement
                }
                return null
            }
            let scroller = findScroller()
            let lastFind = now()
            const getScrollTop = () => {
                if (now() - lastFind > 1) { scroller = findScroller(); lastFind = now() }
                const se = document.scrollingElement || document.documentElement
                return (scroller ? scroller.scrollTop : 0) + (window.scrollY || se.scrollTop || 0)
            }
            // ---- input
            const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); cleanups.push(() => el.removeEventListener(ev, fn, opt)) }
            // hover / pointer
            on(canvas, "pointermove", (e) => {
                const r = canvas.getBoundingClientRect()
                const nx = ((e.clientX - r.left) / r.width) * 2 - 1
                const ny = -(((e.clientY - r.top) / r.height) * 2 - 1)
                st.pointer.x = nx; st.pointer.y = ny
                st.hoverKey = live.current.hoverEffect ? app.pick(nx, ny) : null
                st.dirty = true
            })
            on(canvas, "pointerleave", () => { st.hoverKey = null; st.dirty = true })
            // keyboard
            on(host, "keydown", (e) => {
                if (live.current.mode !== "arrows") return
                if (e.key === "ArrowRight") { e.preventDefault(); goTo(st.T + 1) }
                if (e.key === "ArrowLeft") { e.preventDefault(); goTo(st.T - 1) }
            })
            io = new IntersectionObserver((en) => { visible = en[0] ? en[0].isIntersecting : true })
            io.observe(host)

            let last = now()
            const tick = () => {
                raf = requestAnimationFrame(tick)
                const t = now()
                const dt = Math.min(0.05, t - last)
                last = t
                if (!visible) return
                const L = live.current
                // autoplay: Hold = how long each poster rests at the centre after landing
                if (L.mode === "auto" && !st.tw && t - Math.max(st.lastArrive, st.lastStep) > Math.max(0.3, L.interval)) goTo(st.T + 1)
                // page scroll: follows whichever element actually scrolls (window or a Framer scroll container)
                if (L.mode === "page") {
                    const target = getScrollTop() / Math.max(50, L.scrollPerStep)
                    if (Math.abs(target - st.s) > 1e-4) {
                        st.tw = null
                        st.s += (target - st.s) * Math.min(1, dt * 9)
                        if (Math.abs(target - st.s) < 1e-3) st.s = target
                        st.T = Math.round(st.s)
                        st.dirty = true
                    }
                }
                if (st.tw) {
                    const k = Math.min(1, (t - st.tw.t0) / st.tw.dur)
                    st.s = st.tw.from + (st.tw.to - st.tw.from) * ease(k)
                    st.dirty = true
                    if (k >= 1) { st.s = st.tw.to; st.tw = null; st.lastArrive = t }
                }
                // smooth hover amounts
                for (const [k, v] of st.hover) {
                    const goal = k === st.hoverKey ? 1 : 0
                    const nv = v + (goal - v) * Math.min(1, dt * 9)
                    if (Math.abs(nv - goal) < 0.002) { if (goal === 0) st.hover.delete(k); else st.hover.set(k, 1) } else st.hover.set(k, nv)
                    st.dirty = true
                }
                if (st.hoverKey && !st.hover.has(st.hoverKey)) { st.hover.set(st.hoverKey, 0.001); st.dirty = true }
                const settling = t - st.lastArrive < 1.4
                if (st.dirty || settling || st.hoverKey) { st.dirty = false; draw() }
            }
            raf = requestAnimationFrame(tick)
        }
        start()
        return () => {
            disposed = true
            cancelAnimationFrame(raf)
            cleanups.forEach((f) => f())
            if (ro) ro.disconnect()
            if (io) io.disconnect()
            if (appRef.current) { appRef.current.dispose(); appRef.current = null }
        }
    }, [imageKey, background, quality, isStatic, reduceMotion])

    const a = { size: arrowSize, color: arrowColor, fill: arrowFill, hoverFill: arrowHoverFill, radius: arrowRadius, border: arrowBorder, borderColor: arrowBorderColor, shadow: arrowShadow, blur: arrowBlur }
    const prev = () => ctl.current && ctl.current.prev()
    const next = () => ctl.current && ctl.current.next()

    return (
        <div
            ref={hostRef}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label={mode === "arrows" ? "Paper poster carousel. Use the arrow buttons or arrow keys to browse." : "Paper poster carousel"}
            style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background, outline: "none", ...style }}
        >
            {status === "error" && isStatic && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", font: "500 12px/1 Inter, sans-serif", letterSpacing: 1, color: "rgba(0,0,0,0.35)" }}>
                    WebGL is not available
                </div>
            )}
            {mode === "arrows" && status === "ready" && (arrowPosition === "sides" ? (
                <>
                    <div style={{ position: "absolute", left: arrowInset, top: "50%", transform: "translateY(-50%)", zIndex: 2 }}><ArrowButton dir={-1} onClick={prev} a={a} /></div>
                    <div style={{ position: "absolute", right: arrowInset, top: "50%", transform: "translateY(-50%)", zIndex: 2 }}><ArrowButton dir={1} onClick={next} a={a} /></div>
                </>
            ) : (
                <div style={{ position: "absolute", left: 0, right: 0, bottom: arrowInset, display: "flex", justifyContent: "center", gap: arrowGap, zIndex: 2, pointerEvents: "none" }}>
                    <ArrowButton dir={-1} onClick={prev} a={a} />
                    <ArrowButton dir={1} onClick={next} a={a} />
                </div>
            ))}
        </div>
    )
}

PaperCarousel3D.displayName = "Paper Carousel 3D"

addPropertyControls(PaperCarousel3D, {
    mode: {
        type: ControlType.Enum, title: "Navigation", options: ["auto", "page", "arrows"], optionTitles: ["Auto Play", "Page Scroll", "Arrows"],
        defaultValue: "auto",
        description: "Page Scroll needs a page taller than the screen: put the carousel in a tall section with a sticky frame.",
    },
    interval: { type: ControlType.Number, title: "Hold", min: 0.3, max: 8, step: 0.1, unit: "s", defaultValue: 1.2, hidden: (p) => p.mode !== "auto" },
    scrollPerStep: { type: ControlType.Number, title: "Scroll / Poster", min: 100, max: 2000, step: 10, unit: "px", defaultValue: 420, hidden: (p) => p.mode !== "page" },
    crumple: { type: ControlType.Number, title: "Crumple", min: 0.05, max: 0.7, step: 0.01, defaultValue: 0.32 },
    hoverEffect: { type: ControlType.Boolean, title: "Hover", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    images: {
        type: ControlType.Array, title: "Posters",
        description: "Leave empty for the built-in set. Images are printed full-bleed (3:4).",
        control: { type: ControlType.Image },
    },
    background: { type: ControlType.Color, title: "Backdrop", defaultValue: "#F7F7F5" },
    quality: { type: ControlType.Enum, title: "Quality", options: ["high", "balanced"], optionTitles: ["High", "Balanced"], displaySegmentedControl: true, defaultValue: "high" },
    arrowPosition: { type: ControlType.Enum, title: "Arrow Spot", options: ["bottom", "sides"], optionTitles: ["Bottom", "Sides"], displaySegmentedControl: true, defaultValue: "bottom", hidden: (p) => p.mode !== "arrows" },
    arrowSize: { type: ControlType.Number, title: "Arrow Size", min: 28, max: 96, step: 1, unit: "px", defaultValue: 48, hidden: (p) => p.mode !== "arrows" },
    arrowColor: { type: ControlType.Color, title: "Icon", defaultValue: "#111111", hidden: (p) => p.mode !== "arrows" },
    arrowFill: { type: ControlType.Color, title: "Fill", defaultValue: "rgba(255,255,255,0.85)", hidden: (p) => p.mode !== "arrows" },
    arrowHoverFill: { type: ControlType.Color, title: "Hover Fill", defaultValue: "#FFFFFF", hidden: (p) => p.mode !== "arrows" },
    arrowRadius: { type: ControlType.Number, title: "Radius", min: 0, max: 999, step: 1, defaultValue: 999, hidden: (p) => p.mode !== "arrows" },
    arrowBorder: { type: ControlType.Boolean, title: "Border", defaultValue: true, hidden: (p) => p.mode !== "arrows" },
    arrowBorderColor: { type: ControlType.Color, title: "Border Color", defaultValue: "rgba(0,0,0,0.08)", hidden: (p) => p.mode !== "arrows" || !p.arrowBorder },
    arrowShadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: true, hidden: (p) => p.mode !== "arrows" },
    arrowBlur: { type: ControlType.Boolean, title: "Glass Blur", defaultValue: true, hidden: (p) => p.mode !== "arrows" },
    arrowInset: { type: ControlType.Number, title: "Inset", min: 0, max: 200, step: 1, unit: "px", defaultValue: 32, hidden: (p) => p.mode !== "arrows" },
    arrowGap: { type: ControlType.Number, title: "Gap", min: 0, max: 200, step: 1, unit: "px", defaultValue: 12, hidden: (p) => p.mode !== "arrows" || p.arrowPosition !== "bottom" },
})
