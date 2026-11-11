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
 * Pixel Globe Probe
 * A rotating mosaic planet with pins, labels, hover probe and Lego bricks.
 * One WebGL pass, four textures, no libs besides framer and react.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type Num = number

interface SpotProps {
    name: string
    lat: Num
    lon: Num
    image?: any
}
interface GlobeProps {
    cells: Num
    gap: Num
    tilt: Num
    land: Num
    seed: Num
    round: boolean
    real: boolean
    lego: boolean
    style: "Flat" | "3D"
}
interface PaintProps {
    deep: string
    sea: string
    shelf: string
    grass: string
    sand: string
    rock: string
    shade: boolean
    dusk: Num
}
interface LampProps {
    mode: "Sun" | "Cursor"
    radius: Num
    power: Num
    color: string
    shine: Num
}
interface ProbeProps {
    show: boolean
    hue: string
    size: Num
    arcs: Num
    ink: string
    ease: "Spring" | "Smooth"
}
interface LabelProps {
    show: boolean
    note: string
    font: any
    color: string
    plate: string
    units: "Degrees" | "Decimal"
}
interface PinsProps {
    size: Num
    ring: boolean
    label: boolean
    color: string
    font: any
}
interface BackdropProps {
    draw: boolean
    tile: Num
    line: string
    specks: Num
    drift: boolean
    paper: string
    clear: boolean
}
interface MoveProps {
    mode: "Drag" | "Hover" | "Both"
    play: boolean
    speed: Num
    glide: boolean
    pause: boolean
    start: Num
}
export interface PixelGlobeProbeProps {
    width?: Num
    height?: Num
    spots: SpotProps[]
    globe: GlobeProps
    paint: PaintProps
    lamp: LampProps
    probe: ProbeProps
    label: LabelProps
    pins: PinsProps
    backdrop: BackdropProps
    move: MoveProps
}

interface Api {
    kick: () => void
    setSpin: (rad: Num) => void
}

const MAX_SLOTS = 32
const ATLAS_TILES = 64
const ATLAS_COLS = 8
const ATLAS_TILE_PX = 64
const ATLAS_PX = ATLAS_COLS * ATLAS_TILE_PX
const LAB_COLS = 8
const LAB_ROWS = 16
const LAB_TILE_W = 128
const LAB_TILE_H = 32

/* ---------- small math and color helpers ---------- */

const colorCache = new Map<string, [Num, Num, Num, Num]>()
function parseColor(input: string): [Num, Num, Num, Num] {
    const hit = colorCache.get(input)
    if (hit) return hit
    let out: [Num, Num, Num, Num] = [0, 0, 0, 1]
    const s = (input || "#000000").trim()
    if (s[0] === "#") {
        let hex = s.slice(1)
        if (hex.length === 3)
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("")
        const n = parseInt(hex.slice(0, 6), 16)
        out = [
            ((n >> 16) & 255) / 255,
            ((n >> 8) & 255) / 255,
            (n & 255) / 255,
            hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
        ]
    } else {
        const m = s.match(/[\d.]+/g)
        if (m && m.length >= 3) {
            out = [
                Number(m[0]) / 255,
                Number(m[1]) / 255,
                Number(m[2]) / 255,
                m.length > 3 ? Number(m[3]) : 1,
            ]
        }
    }
    colorCache.set(input, out)
    return out
}

function imgUrl(v: any): string | null {
    if (!v) return null
    if (typeof v === "string") return v
    if (typeof v === "object") {
        if (typeof v.src === "string") return v.src
        if (typeof v.url === "string") return v.url
    }
    return null
}

function mulberry32(seed: Num) {
    let a = seed >>> 0
    return function () {
        a |= 0
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function hash3(ix: Num, iy: Num, iz: Num, seed: Num): Num {
    let h =
        Math.imul(ix, 374761393) ^
        Math.imul(iy, 668265263) ^
        Math.imul(iz, 1274126177) ^
        Math.imul(seed, 974634511)
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
}

function noise3(x: Num, y: Num, z: Num, seed: Num): Num {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const iz = Math.floor(z)
    let fx = x - ix
    let fy = y - iy
    let fz = z - iz
    fx = fx * fx * (3 - 2 * fx)
    fy = fy * fy * (3 - 2 * fy)
    fz = fz * fz * (3 - 2 * fz)
    const c000 = hash3(ix, iy, iz, seed)
    const c100 = hash3(ix + 1, iy, iz, seed)
    const c010 = hash3(ix, iy + 1, iz, seed)
    const c110 = hash3(ix + 1, iy + 1, iz, seed)
    const c001 = hash3(ix, iy, iz + 1, seed)
    const c101 = hash3(ix + 1, iy, iz + 1, seed)
    const c011 = hash3(ix, iy + 1, iz + 1, seed)
    const c111 = hash3(ix + 1, iy + 1, iz + 1, seed)
    const x00 = c000 + (c100 - c000) * fx
    const x10 = c010 + (c110 - c010) * fx
    const x01 = c001 + (c101 - c001) * fx
    const x11 = c011 + (c111 - c011) * fx
    const y0 = x00 + (x10 - x00) * fy
    const y1 = x01 + (x11 - x01) * fy
    return y0 + (y1 - y0) * fz
}

function fbm3(x: Num, y: Num, z: Num, seed: Num, oct: Num, f0: Num): Num {
    let amp = 0.5
    let freq = f0
    let sum = 0
    let norm = 0
    for (let o = 0; o < oct; o++) {
        sum += amp * noise3(x * freq, y * freq, z * freq, seed + o * 17)
        norm += amp
        amp *= 0.55
        freq *= 2.03
    }
    return sum / norm
}

/* ---------- real earth land mask, 2 degree bands as longitude spans ---------- */

const EARTH_ROWS: string[] = [
    "",
    "",
    "",
    "-75,-60;-45,-25",
    "-85,-60;-50,-20",
    "-85,-55;-50,-20;10,25;40,60",
    "-110,-75;-70,-20;10,25;40,60;90,110",
    "-115,-75;-70,-20;52,60;85,110",
    "-120,-70;-75,-20;52,60;80,130",
    "-165,-140;-135,-70;-75,-20;15,30;40,180;-180,-172",
    "-165,-140;-135,-65;-55,-25;10,30;35,180;-180,-168",
    "-165,-140;-135,-60;-55,-25;10,30;35,180;-180,-165",
    "-168,-140;-135,-58;-55,-25;-24,-14;8,30;35,180;-180,-165",
    "-168,-140;-130,-58;-55,-25;-24,-14;8,30;35,180;-180,-165",
    "-168,-140;-130,-58;-50,-25;5,30;30,180;-180,-160",
    "-165,-135;-130,-58;-48,-25;5,30;30,180;-180,-160",
    "-165,-130;-125,-60;-45,-25;-6,-2;5,30;30,180;-180,-155",
    "-165,-130;-125,-95;-78,-58;-42,-25;-8,-2;5,10;12,18;20,180;-180,-155",
    "-165,-130;-125,-93;-77,-58;-40,-25;-10,-6;-8,0;4,180;-180,-155",
    "-160,-130;-125,-89;-77,-55;-40,-25;-10,-6;-6,1;2,180;-180,-155",
    "-125,-60;-38,-25;-5,1;-4,180;-180,-155",
    "-125,-65;-38,-25;-4,47;54,180",
    "-125,-65;-4,28;33,36;38,46;54,180",
    "-124,-70;-8,7;8,14;17,28;41,46;54,180",
    "-124,-72;-8,1;8,16;19,46;54,180",
    "-123,-74;-8,0;9,17;20,24;26,44;54,180",
    "-122,-75;-8,-1;12,18;21,26;27,122;126,129;132,137",
    "-120,-76;-7,-2;-6,11;13,15;24,26;27,36;40,119;126,129;132,137",
    "-118,-78;-8,32;34,121;131,135",
    "-115,-80;-10,32;34,121;131,134",
    "-114,-82;-82,-80;-13,33;34,48;52,120;130,132",
    "-110,-84;-81,-80;-15,34;35,50;54,120;121,122",
    "-108,-86;-81,-80;-16,35;36,51;55,119;120,122",
    "-106,-87;-84,-75;-16,36;38,52;56,119;120,122",
    "-105,-87;-84,-77;-17,37;39,53;57,119",
    "-103,-88;-82,-77;-17,38;40,59;72,76;92,107;108,110",
    "-100,-89;-77,-69;-17,39;43,55;73,76;93,106;120,122",
    "-97,-90;-77,-69;-17,40;43,54;73,77;94,106;120,124",
    "-92,-84;-76,-69;-17,41;43,45;55,59;74,78;95,106;121,125",
    "-88,-78;-17,51;75,79;96,106;122,126",
    "-85,-77;-15,49;76,78;97,106;123,127",
    "-82,-75;-13,44;77,78;80,81;98,106;124,127",
    "-79,-75;-10,44;80,82;100,103;108,117;124,127",
    "-79,-75;-9,45;80,82;98,102;108,117;122,126",
    "-80,-77;-9,45;98,102;108,117;119,122;127,128",
    "-80,-44;-9,41;99,103;108,117;119,123;131,141",
    "-80,-35;-8,40;100,104;108,117;119,123;132,143",
    "-80,-35;-8,39;101,117;119,123;133,145",
    "-78,-35;-8,38;106,114;119,123;125,127;134,146",
    "-76,-35;13,37;108,114;119,123;124,127;136,147",
    "-76,-36;12,40;110,114;124,127;132,136;138,148",
    "-75,-37;12,40;129,137;140,149",
    "-74,-38;12,40;124,138;141,145",
    "-72,-39;12,40;44,48;121,136;141,146",
    "-70,-40;12,38;44,48;118,135;142,147",
    "-69,-41;13,37;44,48;115,135;142,148",
    "-68,-42;14,36;44,48;113,149",
    "-67,-46;15,35;45,48;113,153",
    "-66,-48;15,34;46,48;114,153",
    "-66,-49;16,33;47,48;115,153",
    "-66,-51;17,32;116,152",
    "-66,-52;18,31;117,151",
    "-66,-57;18,28;117,149;174,176",
    "-66,-58;19,25;115,118;139,148;173,178",
    "-66,-61;141,147;173,178",
    "-66,-63;172,176",
    "-66,-65;169,174",
    "-67,-66;167,171",
    "-67,-66",
    "-68,-67",
    "-70,-68",
    "-70,-68",
    "-68,-66",
    "",
    "",
    "",
    "-62,-58",
    "-64,-58",
    "-66,-58;40,50",
    "-70,-45;-20,160;-180,-150",
    "-75,-45;-20,160;-180,-150",
    "-80,-40;-20,160;-180,-155",
    "-80,-40;-30,160;-180,-155",
    "-80,-40;-40,160;-180,-160",
    "-80,-40;-40,170;-180,-160",
    "-80,180;-180,-60",
    "-180,180",
    "-180,180",
    "-180,180",
    "-180,180",
]

const MASK_W = 360
const MASK_H = 180

let parsedRows: Num[][] | null = null
function earthRows(): Num[][] {
    if (parsedRows) return parsedRows
    parsedRows = EARTH_ROWS.map((s) => {
        const out: Num[] = []
        if (!s) return out
        const parts = s.split(";")
        for (const pair of parts) {
            const ab = pair.split(",")
            out.push(Number(ab[0]), Number(ab[1]))
        }
        return out
    })
    return parsedRows
}

let maskBlur: Float32Array | null = null
function earthMask(): Float32Array {
    if (maskBlur) return maskBlur
    const rows = earthRows()
    const W = MASK_W
    const H = MASK_H
    const raw = new Float32Array(W * H)
    for (let y = 0; y < H; y++) {
        /* row 0 is the south pole so shader v equals 0 at the south */
        const lat = -90 + (y + 0.5) * (180 / H)
        const rd = Math.max(0, Math.min(89, Math.floor((90 - lat) / 2)))
        const pr = rows[rd]
        for (let x = 0; x < W; x++) {
            const lon = x + 0.5 - 180
            let land = false
            for (let i = 0; i < pr.length; i += 2) {
                if (lon >= pr[i] && lon <= pr[i + 1]) {
                    land = true
                    break
                }
            }
            raw[y * W + x] = land ? 1 : 0
        }
    }
    let src = raw
    for (let pass = 0; pass < 2; pass++) {
        const dst = new Float32Array(W * H)
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                let sum = 0
                let n = 0
                for (let dy = -1; dy <= 1; dy++) {
                    const yy = y + dy
                    if (yy < 0 || yy >= H) continue
                    for (let dx = -1; dx <= 1; dx++) {
                        const xx = (x + dx + W) % W
                        sum += src[yy * W + xx]
                        n++
                    }
                }
                dst[y * W + x] = sum / n
            }
        }
        src = dst
    }
    maskBlur = src
    return src
}

function sampleMask(u: Num, v: Num): Num {
    const m = earthMask()
    const fx = u * MASK_W - 0.5
    const fy = v * MASK_H - 0.5
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = fx - x0
    const ty = fy - y0
    const xa = ((x0 % MASK_W) + MASK_W) % MASK_W
    const xb = (xa + 1) % MASK_W
    const ya = Math.max(0, Math.min(MASK_H - 1, y0))
    const yb = Math.max(0, Math.min(MASK_H - 1, y0 + 1))
    const m00 = m[ya * MASK_W + xa]
    const m10 = m[ya * MASK_W + xb]
    const m01 = m[yb * MASK_W + xa]
    const m11 = m[yb * MASK_W + xb]
    const a = m00 + (m10 - m00) * tx
    const b = m01 + (m11 - m01) * tx
    return a + (b - a) * ty
}

const MAP_W = 256
const MAP_H = 128
function buildHeightMap(seed: Num, real: boolean): Uint8Array {
    const data = new Uint8Array(MAP_W * MAP_H * 2)
    for (let y = 0; y < MAP_H; y++) {
        const lat = ((y + 0.5) / MAP_H) * Math.PI - Math.PI / 2
        const cl = Math.cos(lat)
        const sy = Math.sin(lat)
        const latAbs = Math.abs(lat)
        const v = (y + 0.5) / MAP_H
        for (let x = 0; x < MAP_W; x++) {
            const lon = ((x + 0.5) / MAP_W) * Math.PI * 2 - Math.PI
            const px = cl * Math.cos(lon)
            const pz = cl * Math.sin(lon)
            const u = (x + 0.5) / MAP_W
            const detail = fbm3(px, sy, pz, seed, 5, 1.7)
            const moist = fbm3(px, sy, pz, seed + 101, 4, 3.1)
            let h: Num
            let mo: Num
            if (real) {
                const ms = sampleMask(u, v)
                const oceanH = 0.2 + 0.26 * detail
                const terrain = fbm3(px, sy, pz, seed + 211, 4, 4.0)
                const landH = 0.56 + 0.3 * terrain
                h = oceanH + (landH - oceanH) * ms + (detail - 0.5) * 0.04
                const dry = latAbs > 0.33 && latAbs < 0.62 ? 1 : 0
                mo = Math.max(
                    0,
                    Math.min(1, moist * 0.75 + 0.1 - 0.3 * dry * ms)
                )
            } else {
                h = detail
                mo = moist
            }
            const i = (y * MAP_W + x) * 2
            data[i] = Math.max(0, Math.min(1, h)) * 255
            data[i + 1] = Math.max(0, Math.min(1, mo)) * 255
        }
    }
    return data
}

function fontString(f: any): string {
    if (typeof f === "string") return f
    const size = f && typeof f.size === "number" ? f.size : 11
    const weight = f && f.weight !== undefined ? f.weight : 500
    const style = f && f.style && f.style !== "normal" ? f.style + " " : ""
    const family = f && f.family ? f.family : "ui-monospace, Menlo, monospace"
    return style + weight + " " + size + "px " + family
}

function fontSizeOf(f: any): Num {
    if (f && typeof f.size === "number") return f.size
    return 11
}

/* inverse of the shader rotation: q = rotY(-spin) * rotX(-tilt) * n */
function screenToSphere(
    sx: Num,
    syUp: Num,
    spin: Num,
    tilt: Num
): { lat: Num; lon: Num } {
    const z = Math.sqrt(Math.max(0, 1 - sx * sx - syUp * syUp))
    const c1 = Math.cos(-tilt)
    const s1 = Math.sin(-tilt)
    const my = syUp * c1 - z * s1
    const mz = syUp * s1 + z * c1
    const c2 = Math.cos(-spin)
    const s2 = Math.sin(-spin)
    const qx = sx * c2 + mz * s2
    const qz = -sx * s2 + mz * c2
    const lat = Math.asin(Math.max(-1, Math.min(1, my)))
    const lon = Math.atan2(qz, qx)
    return { lat, lon }
}

/* forward projection for pins */
function projectSpot(
    lat: Num,
    lon: Num,
    spin: Num,
    tilt: Num
): { x: Num; y: Num; vis: boolean } {
    const cl = Math.cos(lat)
    const qx0 = cl * Math.cos(lon)
    const qy0 = Math.sin(lat)
    const qz0 = cl * Math.sin(lon)
    const c2 = Math.cos(spin)
    const s2 = Math.sin(spin)
    const x2 = qx0 * c2 + qz0 * s2
    const z2 = -qx0 * s2 + qz0 * c2
    const c1 = Math.cos(tilt)
    const s1 = Math.sin(tilt)
    const y3 = qy0 * c1 - z2 * s1
    const z3 = qy0 * s1 + z2 * c1
    return { x: x2, y: y3, vis: z3 > 0.02 }
}

/* ---------- shaders ---------- */

const VERT = `
attribute vec2 aPos;
void main() {
    gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform vec2 uCenter;
uniform vec2 uMarkerPos;
uniform vec2 uLightPos;
uniform float uDpr;
uniform float uTime;
uniform float uSpin;
uniform float uTilt;
uniform float uCells;
uniform float uGap;
uniform float uRound;
uniform float uRadius;
uniform float uShade;
uniform float uDusk;
uniform float uLand;
uniform float uProbeA;
uniform float uTipA;
uniform float uArcs;
uniform float uArcReach;
uniform float uMarkerSize;
uniform float uSpeckCount;
uniform float uDrift;
uniform float uDrawGrid;
uniform float uTile;
uniform float uTiny;
uniform float uLego;
uniform float uLegoStyle;
uniform float uLightMode;
uniform float uLightRange;
uniform float uPower;
uniform float uShine;
uniform float uClear;
uniform float uLocCount;
uniform float uCellPx;
uniform float uRing;
uniform float uLabH;
uniform vec3 uPaper;
uniform vec3 uDeep;
uniform vec3 uSea;
uniform vec3 uShelf;
uniform vec3 uGrass;
uniform vec3 uSand;
uniform vec3 uRock;
uniform vec3 uInk;
uniform vec3 uMarkerCol;
uniform vec3 uTextCol;
uniform vec3 uLabCol;
uniform vec3 uLightCol;
uniform vec4 uLine;
uniform vec4 uPlate;
uniform vec4 uTipRect;
uniform vec4 uArc[4];
uniform vec4 uSpecks[12];
uniform vec4 uLoc[32];
uniform vec4 uLab[32];
uniform sampler2D uMap;
uniform sampler2D uText;
uniform sampler2D uAtlas;
uniform sampler2D uLabTex;

float sdSeg(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}
vec3 rotX(vec3 v, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
}
vec3 rotY(vec3 v, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
}
void main() {
    vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
    vec3 col = uPaper;
    float a = uClear > 0.5 ? 0.0 : 1.0;
    if (uDrawGrid > 0.5 && uTiny < 0.5 && uClear < 0.5) {
        vec2 g = mod(p, uTile);
        float d = min(min(g.x, uTile - g.x), min(g.y, uTile - g.y));
        float la = 1.0 - smoothstep(0.0, 1.2, d);
        col = mix(col, uLine.rgb, uLine.a * la);
    }
    if (uSpeckCount > 0.5 && uTiny < 0.5 && uClear < 0.5) {
        for (int i = 0; i < 12; i++) {
            if (float(i) < uSpeckCount) {
                vec4 sp = uSpecks[i];
                vec2 pos = sp.xy;
                if (uDrift > 0.5) {
                    pos = mod(pos + uTime * vec2(2.0 + sp.w * 3.0, 1.2 + sp.w * 1.7), uRes);
                }
                if (max(abs(p.x - pos.x), abs(p.y - pos.y)) < sp.z * 0.5) {
                    col = mix(col, vec3(0.52, 0.55, 0.58), 0.9);
                }
            }
        }
    }
    vec2 rel = p - uCenter;
    vec2 s = rel / uRadius;
    float cell = (2.0 * uRadius) / uCells;
    vec2 gid = floor((rel + uRadius) / cell);
    vec2 sc = ((gid + 0.5) * cell - uRadius) / uRadius;
    float inC = step(dot(sc, sc), 1.0);
    float inP = step(dot(s, s), 1.0);
    float drawCell = uRound > 0.5 ? inP : inC;
    if (drawCell > 0.5) {
        vec2 f = fract((rel + uRadius) / cell);
        float db = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * cell;
        vec3 lv = vec3(0.0, 0.0, 1.0);
        float att = 1.0;
        if (uLego > 0.5) {
            if (uLightMode > 0.5) {
                vec3 dv = vec3(uLightPos.x - p.x, uLightPos.y - p.y, uLightRange * 0.6);
                float dl = length(dv);
                lv = dv / max(1e-4, dl);
                att = uPower * (0.30 + 0.70 / (1.0 + pow(dl / uLightRange, 2.0)));
            } else {
                lv = normalize(vec3(-0.5, -0.6, 0.75));
                att = uPower;
            }
        }
        if (db < uGap * 0.5) {
            if (uLego > 0.5) {
                col = uLightCol * (0.16 + 0.20 * att) * 0.9;
                a = 1.0;
            } else {
                col = vec3(1.0);
                a = uClear > 0.5 ? 0.0 : 1.0;
            }
        } else {
            float z = sqrt(max(0.0, 1.0 - dot(sc, sc)));
            vec3 n = vec3(sc.x, -sc.y, z);
            vec3 q = rotY(rotX(n, -uTilt), -uSpin);
            float lat = asin(clamp(q.y, -1.0, 1.0));
            float lon = atan(q.z, q.x);
            vec2 hm = texture2D(uMap, vec2(lon / 6.2831853 + 0.5, lat / 3.14159265 + 0.5)).ra;
            float h = hm.x;
            float mo = hm.y;
            float sl = 0.62 - 0.24 * uLand;
            vec3 c;
            if (h < sl - 0.16) {
                c = uDeep;
            } else if (h < sl) {
                c = uSea;
            } else if (h < sl + 0.05) {
                c = uShelf;
            } else if (h > sl + 0.30) {
                c = uRock;
            } else if (mo < 0.44 && abs(lat) < 0.62 && abs(lat) > 0.10) {
                c = uSand;
            } else {
                c = uGrass;
            }
            if (uLego > 0.5) {
                /* identical front facing brick, perfectly flat stud top */
                vec2 qq = f * uCellPx;
                float vh = fract(sin(dot(gid, vec2(12.9898, 78.233))) * 43758.5453);
                vec3 brick = c * (0.96 + 0.08 * vh);
                vec3 LC = uLightCol;
                float R = 0.33 * uCellPx;
                float aa = max(0.5, uCellPx * 0.025);
                vec2 studC = vec2(0.5, 0.44) * uCellPx;
                vec2 dvec = qq - studC;
                float dS = length(dvec);
                float rr = dS / R;
                vec2 radialU = dvec / max(1e-4, dS);
                vec2 l2 = lv.xy / max(1e-4, length(lv.xy));
                float litSide = dot(radialU, l2);
                /* plate: flat face, seam bevel, mild planar gradient to the lamp */
                vec2 cc2 = vec2(0.5) * uCellPx;
                float gCell = dot((qq - cc2) / (uCellPx * 0.71), l2);
                float bx = min(min(qq.x, uCellPx - qq.x), min(qq.y, uCellPx - qq.y));
                float w = uCellPx * 0.10;
                float hp = smoothstep(0.0, w, bx);
                vec2 outS = -vec2(qq.x < uCellPx * 0.5 ? 1.0 : -1.0, qq.y < uCellPx * 0.5 ? 1.0 : -1.0);
                float edgeGlow = (1.0 - hp) * max(0.0, dot(outS, l2));
                vec3 N = normalize(vec3(outS * ((1.0 - hp) * 0.7), 1.0));
                float dif = max(dot(N, lv), 0.0);
                vec3 plateCol = brick * LC * (0.42 + 0.50 * dif * att);
                plateCol *= 1.0 + 0.22 * gCell;
                plateCol *= 1.0 + 0.45 * edgeGlow * clamp(att, 0.0, 1.5);
                plateCol *= 0.86 + 0.14 * smoothstep(0.0, w * 1.3, bx);
                /* stud: uniform flat top plus crisp 45 degree chamfer ring */
                float inStud = 1.0 - smoothstep(R - aa, R + aa, dS);
                float chamf = smoothstep(0.88, 0.97, rr) * inStud;
                vec3 nCham = normalize(vec3(radialU, 1.0));
                vec3 topCol = brick * LC * (0.46 + 0.52 * lv.z * att);
                topCol *= 1.0 + 0.35 * chamf * max(0.0, litSide);
                /* cylinder wall ring: lit half, dark half, reflection arc */
                vec2 wallC = studC - l2 * (R * 0.10);
                float wallW = uCellPx * (uLegoStyle > 0.5 ? 0.11 : 0.08);
                float dW = length(qq - wallC);
                vec2 udirW = (qq - wallC) / max(1e-4, dW);
                float inWall = smoothstep(R - aa, R + aa, dW) * (1.0 - smoothstep(R + wallW - aa, R + wallW + aa, dW));
                float sideDif = 0.16 + 0.60 * max(0.0, dot(udirW, l2));
                float sideSpec = pow(max(0.0, dot(udirW, l2)), 6.0) * (0.30 + 0.90 * uShine) * att;
                vec3 wallCol = brick * LC * (0.20 + 0.45 * sideDif * att);
                wallCol += mix(LC, vec3(1.0), 0.60) * sideSpec;
                /* mirror pool of the lamp on the flat glossy faces */
                vec3 Hh = normalize(lv + vec3(0.0, 0.0, 1.0));
                float nhF = Hh.z;
                float specTop = (pow(nhF, 30.0) * 0.35 + pow(nhF, 140.0) * 1.00) * (0.30 + 1.10 * uShine) * att;
                specTop += pow(max(dot(nCham, Hh), 0.0), 60.0) * (0.40 + 0.80 * uShine) * att * chamf;
                /* compose */
                vec3 colL = plateCol;
                colL = mix(colL, wallCol, inWall);
                colL = mix(colL, topCol, inStud);
                float elev = clamp(lv.z, 0.25, 1.0);
                vec2 shC = studC - l2 * (R * 0.25 + R * 0.65 * (1.0 - elev));
                float dSh = length(qq - shC);
                float shM = (1.0 - smoothstep(R * 0.9, R * 1.5, dSh)) * smoothstep(R * 0.4, R * 0.8, dS);
                colL *= 1.0 - 0.35 * shM * clamp(att, 0.0, 1.3);
                colL *= 0.86 + 0.14 * smoothstep(R * 0.95, R * 1.25, dS);
                colL += mix(LC, vec3(1.0), 0.50) * specTop * mix(0.35, 1.0, inStud);
                colL = colL / (1.0 + 0.06 * colL);
                c = colL;
            } else {
                vec3 L = normalize(vec3(-0.45, 0.55, 0.72));
                float dif = max(dot(n, L), 0.0);
                float base = clamp(0.34 + dif, 0.0, 1.12);
                float sh = mix(1.0, base, uShade * uDusk);
                c = c * sh;
            }
            col = c;
            a = 1.0;
        }
    }
    if (uLocCount > 0.5 && uTiny < 0.5) {
        for (int i = 0; i < 32; i++) {
            if (float(i) < uLocCount) {
                vec4 Lc = uLoc[i];
                float r = Lc.z;
                if (r > 0.5) {
                    vec2 dp = p - Lc.xy;
                    if (max(abs(dp.x), abs(dp.y)) < r + 2.5) {
                        float d = length(dp);
                        if (d < r + 2.5) {
                            float fill = 1.0 - smoothstep(r - 1.0, r, d);
                            float ring = smoothstep(r - 0.5, r + 0.5, d) * (1.0 - smoothstep(r + 1.0, r + 2.2, d)) * uRing;
                            if (fill > 0.001) {
                                if (Lc.w > 0.5) {
                                    float tile = Lc.w - 1.0;
                                    vec2 base = vec2(mod(tile, 8.0), floor(tile / 8.0));
                                    vec2 uv = (base + clamp(dp / r * 0.5 + 0.5, 0.0, 1.0)) / 8.0;
                                    vec4 tc = texture2D(uAtlas, uv);
                                    col = mix(col, tc.rgb, tc.a * fill);
                                    a = mix(a, 1.0, tc.a * fill);
                                } else {
                                    col = mix(col, uMarkerCol, fill);
                                    a = mix(a, 1.0, fill);
                                }
                            }
                            if (ring > 0.001) {
                                col = mix(col, vec3(1.0), ring * 0.95);
                                a = mix(a, 1.0, ring * 0.95);
                            }
                        }
                    }
                }
            }
        }
        for (int i = 0; i < 32; i++) {
            if (float(i) < uLocCount) {
                vec4 Lb = uLab[i];
                if (Lb.w > 0.5 && Lb.z > 0.5) {
                    vec2 q = p - Lb.xy;
                    if (q.x >= 0.0 && q.y >= 0.0 && q.x <= Lb.z && q.y <= uLabH) {
                        float tile = Lb.w - 1.0;
                        vec2 base = vec2(mod(tile, 8.0), floor(tile / 8.0));
                        vec2 uv = (base + vec2(q.x / 128.0, q.y / 32.0)) / vec2(8.0, 16.0);
                        float ta = texture2D(uLabTex, uv).a;
                        col = mix(col, uLabCol, ta);
                        a = mix(a, 1.0, ta);
                    }
                }
            }
        }
    }
    if (uProbeA > 0.002 && uTiny < 0.5) {
        float dMark = length(p - uMarkerPos);
        if (dMark < uArcReach) {
            for (int i = 0; i < 4; i++) {
                if (float(i) < uArcs) {
                    vec4 ar = uArc[i];
                    vec2 prev = uMarkerPos;
                    float dm = 1e9;
                    for (int j = 0; j < 10; j++) {
                        float t = (float(j) + 1.0) / 10.0;
                        vec2 pt = mix(mix(uMarkerPos, ar.xy, t), mix(ar.xy, ar.zw, t), t);
                        dm = min(dm, sdSeg(p, prev, pt));
                        prev = pt;
                    }
                    float la = 1.0 - smoothstep(0.35, 1.05, dm);
                    col = mix(col, uInk, la * uProbeA);
                    a = mix(a, 1.0, la * uProbeA);
                    if (max(abs(p.x - ar.z), abs(p.y - ar.w)) < 2.2) {
                        col = mix(col, uInk, uProbeA);
                        a = mix(a, 1.0, uProbeA);
                    }
                }
            }
        }
        vec2 dm2 = abs(p - uMarkerPos);
        float hs = uMarkerSize * 0.5;
        if (max(dm2.x, dm2.y) < hs + 1.3) {
            col = mix(col, uInk, uProbeA);
            a = mix(a, 1.0, uProbeA);
        }
        if (max(dm2.x, dm2.y) < hs) {
            col = mix(col, uMarkerCol, uProbeA);
            a = mix(a, 1.0, uProbeA);
        }
    }
    if (uTipA > 0.002 && uTiny < 0.5) {
        vec2 q = p - uTipRect.xy;
        vec2 sz = uTipRect.zw;
        if (q.x >= 0.0 && q.y >= 0.0 && q.x <= sz.x && q.y <= sz.y) {
            vec4 t = texture2D(uText, q / sz);
            vec2 hr = sz * 0.5;
            vec2 dq = abs(q - hr) - (hr - 5.0);
            float sd = length(max(dq, vec2(0.0))) + min(max(dq.x, dq.y), 0.0) - 5.0;
            float pa = (1.0 - smoothstep(-1.0, 1.0, sd)) * uPlate.a * uTipA;
            float ta = max(pa, clamp(t.a, 0.0, 1.0) * uTipA);
            col = mix(col, uPlate.rgb, pa);
            col = mix(col, uTextCol, clamp(t.a, 0.0, 1.0) * uTipA);
            a = mix(a, 1.0, ta);
        }
    }
    gl_FragColor = vec4(col * a, a);
}
`

/* ---------- component ---------- */

function PixelGlobeProbe(props: PixelGlobeProbeProps) {
    const wrapRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const apiRef = useRef<Api | null>(null)
    const lastStartRef = useRef<Num>(props.move.start)
    const propsRef = useRef(props)
    propsRef.current = props
    const isStatic = useIsStaticRenderer()
    const staticRef = useRef(isStatic)
    staticRef.current = isStatic

    useEffect(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return
        const gl = canvas.getContext("webgl", {
            alpha: true,
            premultipliedAlpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance",
        })
        if (!gl) return

        function compile(type: Num, src: string): WebGLShader | null {
            const sh = gl!.createShader(type)
            if (!sh) return null
            gl!.shaderSource(sh, src)
            gl!.compileShader(sh)
            if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) return null
            return sh
        }
        const vs = compile(gl.VERTEX_SHADER, VERT)
        const fs = compile(gl.FRAGMENT_SHADER, FRAG)
        const prog = gl.createProgram()
        if (!vs || !fs || !prog) return
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 3, -1, -1, 3]),
            gl.STATIC_DRAW
        )
        const aPos = gl.getAttribLocation(prog, "aPos")
        gl.enableVertexAttribArray(aPos)
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

        const U = {} as Record<string, WebGLUniformLocation | null>
        const names = [
            "uRes",
            "uCenter",
            "uMarkerPos",
            "uLightPos",
            "uDpr",
            "uTime",
            "uSpin",
            "uTilt",
            "uCells",
            "uGap",
            "uRound",
            "uRadius",
            "uShade",
            "uDusk",
            "uLand",
            "uProbeA",
            "uTipA",
            "uArcs",
            "uArcReach",
            "uMarkerSize",
            "uSpeckCount",
            "uDrift",
            "uDrawGrid",
            "uTile",
            "uTiny",
            "uLego",
            "uLegoStyle",
            "uLightMode",
            "uLightRange",
            "uPower",
            "uShine",
            "uClear",
            "uLocCount",
            "uCellPx",
            "uRing",
            "uLabH",
            "uPaper",
            "uDeep",
            "uSea",
            "uShelf",
            "uGrass",
            "uSand",
            "uRock",
            "uInk",
            "uMarkerCol",
            "uTextCol",
            "uLabCol",
            "uLightCol",
            "uLine",
            "uPlate",
            "uTipRect",
            "uMap",
            "uText",
            "uAtlas",
            "uLabTex",
            "uArc[0]",
            "uSpecks[0]",
            "uLoc[0]",
            "uLab[0]",
        ]
        for (const n of names) U[n] = gl.getUniformLocation(prog, n)

        /* planet map texture, baked once per seed and mode */
        const mapTex = gl.createTexture()
        let mapKey = ""
        function ensureMap(seed: Num, real: boolean) {
            const key = seed + ":" + (real ? 1 : 0)
            if (key === mapKey) return
            mapKey = key
            const data = buildHeightMap(seed, real)
            gl!.bindTexture(gl!.TEXTURE_2D, mapTex)
            gl!.texImage2D(
                gl!.TEXTURE_2D,
                0,
                gl!.LUMINANCE_ALPHA,
                MAP_W,
                MAP_H,
                0,
                gl!.LUMINANCE_ALPHA,
                gl!.UNSIGNED_BYTE,
                data
            )
            gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.REPEAT)
            gl!.texParameteri(
                gl!.TEXTURE_2D,
                gl!.TEXTURE_WRAP_T,
                gl!.CLAMP_TO_EDGE
            )
            gl!.texParameteri(
                gl!.TEXTURE_2D,
                gl!.TEXTURE_MIN_FILTER,
                gl!.LINEAR
            )
            gl!.texParameteri(
                gl!.TEXTURE_2D,
                gl!.TEXTURE_MAG_FILTER,
                gl!.LINEAR
            )
        }

        /* tooltip text texture, rebuilt only when its content changes */
        const textCanvas = document.createElement("canvas")
        const textCtx = textCanvas.getContext("2d")!
        const textTex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, textTex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        let tipKey = ""
        let tipW = 2
        let tipH = 2
        function ensureText(
            key: string,
            line1: string,
            line2: string,
            font: any,
            color: string
        ) {
            if (key === tipKey) return
            tipKey = key
            const dprTex = Math.min(2, window.devicePixelRatio || 1)
            textCtx.font = fontString(font)
            const w1 = textCtx.measureText(line1).width
            const w2 = textCtx.measureText(line2).width
            const size = fontSizeOf(font)
            const lh = Math.ceil(size * 1.45)
            const padX = 9
            const padY = 7
            tipW = Math.ceil(Math.max(w1, w2)) + padX * 2
            tipH = lh * 2 + padY * 2
            textCanvas.width = Math.max(2, Math.floor(tipW * dprTex))
            textCanvas.height = Math.max(2, Math.floor(tipH * dprTex))
            textCtx.setTransform(dprTex, 0, 0, dprTex, 0, 0)
            textCtx.clearRect(0, 0, tipW, tipH)
            textCtx.font = fontString(font)
            textCtx.textBaseline = "top"
            textCtx.fillStyle = color
            textCtx.fillText(line1, padX, padY)
            textCtx.globalAlpha = 0.62
            textCtx.fillText(line2, padX, padY + lh)
            textCtx.globalAlpha = 1
            gl!.bindTexture(gl.TEXTURE_2D, textTex)
            gl!.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                textCanvas
            )
        }

        /* spot image atlas, one texture for the whole list */
        const atlasCanvas = document.createElement("canvas")
        atlasCanvas.width = ATLAS_PX
        atlasCanvas.height = ATLAS_PX
        const atlasCtx = atlasCanvas.getContext("2d")!
        const atlasTex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, atlasTex)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            ATLAS_PX,
            ATLAS_PX,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array(ATLAS_PX * ATLAS_PX * 4)
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        const imgCache = new Map<
            string,
            { img: HTMLImageElement; loaded: boolean }
        >()
        const tileDrawn = new Map<string, Num>()
        function spotImage(url: string | null): HTMLImageElement | null {
            if (!url) return null
            let entry = imgCache.get(url)
            if (!entry) {
                const img = new Image()
                img.crossOrigin = "anonymous"
                entry = { img: img, loaded: false }
                imgCache.set(url, entry)
                img.onload = () => {
                    entry!.loaded = true
                    kick()
                }
                img.src = url
            }
            return entry.loaded ? entry.img : null
        }
        function drawTile(tile: Num, img: HTMLImageElement) {
            const tx = (tile % ATLAS_COLS) * ATLAS_TILE_PX
            const ty = Math.floor(tile / ATLAS_COLS) * ATLAS_TILE_PX
            atlasCtx.save()
            atlasCtx.beginPath()
            atlasCtx.arc(tx + 32, ty + 32, 32, 0, Math.PI * 2)
            atlasCtx.clip()
            const w = img.naturalWidth || 1
            const h = img.naturalHeight || 1
            const side = Math.min(w, h)
            atlasCtx.drawImage(
                img,
                (w - side) / 2,
                (h - side) / 2,
                side,
                side,
                tx,
                ty,
                ATLAS_TILE_PX,
                ATLAS_TILE_PX
            )
            atlasCtx.restore()
        }
        function updateAtlas(spots: SpotProps[]) {
            let dirty = false
            const n = Math.min(ATLAS_TILES, spots.length)
            for (let i = 0; i < n; i++) {
                const url = imgUrl(spots[i].image)
                if (!url) continue
                const drawnFor = tileDrawn.get(url)
                if (drawnFor === i) continue
                const img = spotImage(url)
                if (!img) continue
                drawTile(i, img)
                tileDrawn.set(url, i)
                dirty = true
            }
            if (dirty) {
                gl!.bindTexture(gl.TEXTURE_2D, atlasTex)
                gl!.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    atlasCanvas
                )
            }
        }

        /* spot label atlas, white glyphs tinted in the shader, rebaked on identity change */
        const labCanvas = document.createElement("canvas")
        labCanvas.width = LAB_COLS * LAB_TILE_W
        labCanvas.height = LAB_ROWS * LAB_TILE_H
        const labCtx = labCanvas.getContext("2d")!
        const labTex = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, labTex)
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            labCanvas.width,
            labCanvas.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array(labCanvas.width * labCanvas.height * 4)
        )
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        const labWidth = new Float32Array(ATLAS_TILES)
        let labSpots: SpotProps[] | null = null
        let labFont: any = null
        let labH = 16
        function ensureLabels(spots: SpotProps[], font: any) {
            if (spots === labSpots && font === labFont) return
            labSpots = spots
            labFont = font
            labH = Math.max(10, Math.min(28, Math.ceil(fontSizeOf(font) * 1.5)))
            labCtx.setTransform(1, 0, 0, 1, 0, 0)
            labCtx.clearRect(0, 0, labCanvas.width, labCanvas.height)
            labCtx.font = fontString(font)
            labCtx.textBaseline = "top"
            labCtx.fillStyle = "#ffffff"
            const n = Math.min(ATLAS_TILES, spots.length)
            for (let i = 0; i < n; i++) {
                const name = spots[i].name || ""
                const tx = (i % LAB_COLS) * LAB_TILE_W
                const ty = Math.floor(i / LAB_COLS) * LAB_TILE_H
                labCtx.fillText(name, tx + 4, ty + 6)
                labWidth[i] = Math.min(
                    LAB_TILE_W - 8,
                    Math.ceil(labCtx.measureText(name).width)
                )
            }
            gl!.bindTexture(gl.TEXTURE_2D, labTex)
            gl!.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                labCanvas
            )
        }

        /* mutable view state, kept out of react renders */
        const st = {
            w: 0,
            h: 0,
            dpr: 1,
            radius: 100,
            cx: 0,
            cy: 0,
            tiny: false,
            spin: (propsRef.current.move.start * Math.PI) / 180,
            tiltUser: 0,
            spinVel: 0,
            tiltVel: 0,
            dragging: false,
            lastX: 0,
            lastY: 0,
            lastT: 0,
            hoverLat: 0,
            hoverLon: 0,
            hoverInside: false,
            hoverPin: -1,
            tx: 0,
            ty: 0,
            mx: 0,
            my: 0,
            mvx: 0,
            mvy: 0,
            hadProbe: false,
            probeA: 0,
            tipA: 0,
            time: 0,
            prev: 0,
            raf: 0,
            running: false,
            reduced: false,
            pinR: 8,
            slotCount: 0,
            px: 0,
            py: 0,
            lx: 0,
            ly: 0,
            ltx: 0,
            lty: 0,
            rectL: 0,
            rectT: 0,
            rectDirty: true,
            visible: true,
            hidden: false,
            resizePending: true,
        }
        const speckArr = new Float32Array(48)
        const arcArr = new Float32Array(16)
        const locArr = new Float32Array(MAX_SLOTS * 4)
        const labArr = new Float32Array(MAX_SLOTS * 4)
        const slotSpot = new Int32Array(MAX_SLOTS)
        const arcAng = [-2.0, -1.05, -0.15, 2.6]

        const mq = window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)")
            : null
        st.reduced = mq ? mq.matches : false
        const onMq = () => {
            st.reduced = mq ? mq.matches : false
            st.spinVel = 0
            st.tiltVel = 0
            kick()
        }
        if (mq && mq.addEventListener) mq.addEventListener("change", onMq)

        function refreshRect() {
            const r = canvas!.getBoundingClientRect()
            st.rectL = r.left
            st.rectT = r.top
            st.rectDirty = false
        }

        function buildSpecks() {
            const p = propsRef.current
            const count = Math.max(
                0,
                Math.min(12, Math.round(p.backdrop.specks))
            )
            const rng = mulberry32(p.globe.seed * 7919 + count * 131 + 5)
            for (let i = 0; i < 12; i++) {
                let x = 0
                let y = 0
                let ok = false
                for (let t = 0; t < 40 && !ok; t++) {
                    x = 10 + rng() * Math.max(1, st.w - 20)
                    y = 10 + rng() * Math.max(1, st.h - 20)
                    const d = Math.hypot(x - st.cx, y - st.cy)
                    ok = d > st.radius + 50
                }
                speckArr[i * 4] = x
                speckArr[i * 4 + 1] = y
                speckArr[i * 4 + 2] = 3 + rng() * 3
                speckArr[i * 4 + 3] = rng()
            }
        }

        /* single layout read, applied once inside the frame loop */
        function doResize() {
            const r = wrap!.getBoundingClientRect()
            st.w = Math.max(1, Math.round(r.width))
            st.h = Math.max(1, Math.round(r.height))
            st.rectL = r.left
            st.rectT = r.top
            st.rectDirty = false
            const rawDpr = window.devicePixelRatio || 1
            const budget = Math.sqrt(6500000 / Math.max(1, st.w * st.h))
            st.dpr = Math.max(1, Math.min(2, rawDpr, budget))
            canvas!.width = Math.floor(st.w * st.dpr)
            canvas!.height = Math.floor(st.h * st.dpr)
            st.cx = st.w * 0.5
            st.cy = st.h * 0.5
            st.radius = Math.max(20, Math.min(st.w, st.h) * 0.5 - 10)
            st.tiny = st.w < 120 || st.h < 120
            gl!.viewport(0, 0, canvas!.width, canvas!.height)
            buildSpecks()
        }

        function cellMetrics(): Num {
            const cells = Math.max(8, propsRef.current.globe.cells)
            return (2 * st.radius) / cells
        }

        function updateLocs(spots: SpotProps[]) {
            const p = propsRef.current
            const tilt = (p.globe.tilt * Math.PI) / 180 + st.tiltUser
            st.pinR =
                Math.max(6, cellMetrics() * 0.6) * Math.max(0.2, p.pins.size)
            let slot = 0
            for (let i = 0; i < spots.length && slot < MAX_SLOTS; i++) {
                const sp = spots[i]
                const pr = projectSpot(
                    (sp.lat * Math.PI) / 180,
                    (sp.lon * Math.PI) / 180,
                    st.spin,
                    tilt
                )
                if (!pr.vis || st.tiny) continue
                const x = st.cx + pr.x * st.radius
                const y = st.cy - pr.y * st.radius
                locArr[slot * 4] = x
                locArr[slot * 4 + 1] = y
                locArr[slot * 4 + 2] = st.pinR
                locArr[slot * 4 + 3] =
                    imgUrl(sp.image) && i < ATLAS_TILES ? i + 1 : 0
                if (p.pins.label && sp.name && i < ATLAS_TILES) {
                    const w = labWidth[i]
                    let lx2 = x + st.pinR + 6
                    if (lx2 + w > st.w - 4) lx2 = x - st.pinR - 6 - w
                    labArr[slot * 4] = lx2
                    labArr[slot * 4 + 1] = y - labH * 0.5
                    labArr[slot * 4 + 2] = w
                    labArr[slot * 4 + 3] = i + 1
                } else {
                    labArr[slot * 4 + 2] = 0
                    labArr[slot * 4 + 3] = 0
                }
                slotSpot[slot] = i
                slot++
            }
            st.slotCount = slot
            for (let s = slot; s < MAX_SLOTS; s++) {
                locArr[s * 4 + 2] = 0
                labArr[s * 4 + 2] = 0
            }
        }

        function computeHover(px: Num, py: Num) {
            const p = propsRef.current
            st.hoverPin = -1
            const spots = p.spots || []
            for (let s = 0; s < st.slotCount; s++) {
                const r = locArr[s * 4 + 2]
                if (r < 0.5) continue
                const d = Math.hypot(px - locArr[s * 4], py - locArr[s * 4 + 1])
                if (d < r + 2) {
                    const idx = slotSpot[s]
                    st.hoverPin = idx
                    st.hoverLat = (spots[idx].lat * Math.PI) / 180
                    st.hoverLon = (spots[idx].lon * Math.PI) / 180
                    st.hoverInside = true
                    return
                }
            }
            const cell = cellMetrics()
            const relX = px - st.cx
            const relY = py - st.cy
            const gidX = Math.floor((relX + st.radius) / cell)
            const gidY = Math.floor((relY + st.radius) / cell)
            const ccX = (gidX + 0.5) * cell - st.radius
            const ccY = (gidY + 0.5) * cell - st.radius
            const scX = ccX / st.radius
            const scY = ccY / st.radius
            const sX = relX / st.radius
            const sY = relY / st.radius
            const inCenter = scX * scX + scY * scY <= 1
            const inPointer = sX * sX + sY * sY <= 1
            const inside = p.globe.round ? inPointer : inCenter
            if (!inside || sX * sX + sY * sY > 1.0001) {
                st.hoverInside = false
                return
            }
            const tilt = (p.globe.tilt * Math.PI) / 180 + st.tiltUser
            const ll = screenToSphere(sX, -sY, st.spin, tilt)
            st.hoverLat = ll.lat
            st.hoverLon = ll.lon
            st.tx = st.cx + ccX
            st.ty = st.cy + ccY
            if (!st.hadProbe) {
                st.mx = st.tx
                st.my = st.ty
                st.mvx = 0
                st.mvy = 0
                st.hadProbe = true
            }
            st.hoverInside = true
        }

        function formatCoords(latRad: Num, lonRad: Num): string {
            const p = propsRef.current
            const latD = (latRad * 180) / Math.PI
            let lonD = (lonRad * 180) / Math.PI
            if (lonD > 180) lonD -= 360
            if (lonD < -180) lonD += 360
            if (p.label.units === "Decimal") {
                return latD.toFixed(4) + ", " + lonD.toFixed(4)
            }
            return (
                Math.abs(latD).toFixed(4) +
                "\u00B0 " +
                (latD >= 0 ? "N" : "S") +
                " \u00B7 " +
                Math.abs(lonD).toFixed(4) +
                "\u00B0 " +
                (lonD >= 0 ? "E" : "W")
            )
        }

        function render() {
            const p = propsRef.current
            const spots = p.spots || []
            ensureMap(p.globe.seed, p.globe.real)
            updateAtlas(spots)
            ensureLabels(spots, p.pins.font)
            updateLocs(spots)
            gl!.uniform2f(U["uRes"], st.w, st.h)
            gl!.uniform2f(U["uCenter"], st.cx, st.cy)
            gl!.uniform2f(U["uMarkerPos"], st.mx, st.my)
            gl!.uniform2f(U["uLightPos"], st.lx, st.ly)
            gl!.uniform1f(U["uDpr"], st.dpr)
            gl!.uniform1f(U["uTime"], st.time)
            gl!.uniform1f(U["uSpin"], st.spin)
            gl!.uniform1f(
                U["uTilt"],
                (p.globe.tilt * Math.PI) / 180 + st.tiltUser
            )
            gl!.uniform1f(U["uCells"], Math.max(8, p.globe.cells))
            gl!.uniform1f(U["uGap"], p.globe.gap)
            gl!.uniform1f(U["uRound"], p.globe.round ? 1 : 0)
            gl!.uniform1f(U["uRadius"], st.radius)
            gl!.uniform1f(U["uShade"], p.paint.shade ? 1 : 0)
            gl!.uniform1f(U["uDusk"], p.paint.dusk)
            gl!.uniform1f(U["uLand"], p.globe.land)
            gl!.uniform1f(U["uTiny"], st.tiny ? 1 : 0)
            gl!.uniform1f(U["uLego"], p.globe.lego ? 1 : 0)
            gl!.uniform1f(U["uLegoStyle"], p.globe.style === "3D" ? 1 : 0)
            gl!.uniform1f(U["uLightMode"], p.lamp.mode === "Cursor" ? 1 : 0)
            gl!.uniform1f(
                U["uLightRange"],
                st.radius * Math.max(0.2, p.lamp.radius)
            )
            gl!.uniform1f(U["uPower"], Math.max(0.05, p.lamp.power))
            gl!.uniform1f(U["uShine"], Math.max(0, Math.min(1, p.lamp.shine)))
            gl!.uniform1f(U["uClear"], p.backdrop.clear ? 1 : 0)
            gl!.uniform1f(U["uCellPx"], cellMetrics())
            gl!.uniform1f(U["uRing"], p.pins.ring ? 1 : 0)
            gl!.uniform1f(U["uLabH"], labH)
            const paper = parseColor(p.backdrop.paper)
            gl!.uniform3f(U["uPaper"], paper[0], paper[1], paper[2])
            const deep = parseColor(p.paint.deep)
            gl!.uniform3f(U["uDeep"], deep[0], deep[1], deep[2])
            const sea = parseColor(p.paint.sea)
            gl!.uniform3f(U["uSea"], sea[0], sea[1], sea[2])
            const shelf = parseColor(p.paint.shelf)
            gl!.uniform3f(U["uShelf"], shelf[0], shelf[1], shelf[2])
            const grass = parseColor(p.paint.grass)
            gl!.uniform3f(U["uGrass"], grass[0], grass[1], grass[2])
            const sand = parseColor(p.paint.sand)
            gl!.uniform3f(U["uSand"], sand[0], sand[1], sand[2])
            const rock = parseColor(p.paint.rock)
            gl!.uniform3f(U["uRock"], rock[0], rock[1], rock[2])
            const ink = parseColor(p.probe.ink)
            gl!.uniform3f(U["uInk"], ink[0], ink[1], ink[2])
            const hue = parseColor(p.probe.hue)
            gl!.uniform3f(U["uMarkerCol"], hue[0], hue[1], hue[2])
            const tcol = parseColor(p.label.color)
            gl!.uniform3f(U["uTextCol"], tcol[0], tcol[1], tcol[2])
            const labCol = parseColor(p.pins.color)
            gl!.uniform3f(U["uLabCol"], labCol[0], labCol[1], labCol[2])
            const lampCol = parseColor(p.lamp.color)
            gl!.uniform3f(U["uLightCol"], lampCol[0], lampCol[1], lampCol[2])
            const line = parseColor(p.backdrop.line)
            gl!.uniform4f(U["uLine"], line[0], line[1], line[2], line[3])
            const plate = parseColor(p.label.plate)
            gl!.uniform4f(U["uPlate"], plate[0], plate[1], plate[2], plate[3])
            gl!.uniform1f(
                U["uDrawGrid"],
                p.backdrop.draw && !p.backdrop.clear ? 1 : 0
            )
            gl!.uniform1f(U["uTile"], Math.max(3, p.backdrop.tile))
            gl!.uniform1f(
                U["uSpeckCount"],
                p.backdrop.clear
                    ? 0
                    : Math.max(0, Math.min(12, Math.round(p.backdrop.specks)))
            )
            gl!.uniform1f(U["uDrift"], p.backdrop.drift && !st.reduced ? 1 : 0)
            gl!.uniform4fv(U["uSpecks[0]"], speckArr)

            const cell = cellMetrics()
            const mSize = cell * 0.92 * Math.max(0.2, p.probe.size)
            gl!.uniform1f(U["uMarkerSize"], mSize)
            gl!.uniform1f(U["uProbeA"], st.probeA * (p.probe.show ? 1 : 0))
            const arcs = Math.max(0, Math.min(4, Math.round(p.probe.arcs)))
            gl!.uniform1f(U["uArcs"], arcs)
            gl!.uniform1f(
                U["uArcReach"],
                cell * (2.1 + 0.75 * Math.max(0, arcs - 1)) + 6
            )
            for (let i = 0; i < 4; i++) {
                const ang = arcAng[i]
                const dist = cell * (2.1 + 0.75 * i)
                arcArr[i * 4] = st.mx + Math.cos(ang + 0.5) * dist * 0.55
                arcArr[i * 4 + 1] = st.my + Math.sin(ang + 0.5) * dist * 0.55
                arcArr[i * 4 + 2] = st.mx + Math.cos(ang) * dist
                arcArr[i * 4 + 3] = st.my + Math.sin(ang) * dist
            }
            gl!.uniform4fv(U["uArc[0]"], arcArr)

            gl!.uniform1f(U["uLocCount"], st.slotCount)
            gl!.uniform4fv(U["uLoc[0]"], locArr)
            gl!.uniform4fv(U["uLab[0]"], labArr)

            /* tooltip */
            const wantTip =
                p.label.show &&
                p.move.mode !== "Drag" &&
                st.hoverInside &&
                !st.tiny
            if (wantTip || st.tipA > 0.01) {
                let line1 = formatCoords(st.hoverLat, st.hoverLon)
                let line2 = p.label.note
                if (st.hoverPin >= 0 && spots[st.hoverPin]) {
                    line1 = spots[st.hoverPin].name || "Spot"
                    line2 = formatCoords(st.hoverLat, st.hoverLon)
                }
                const key =
                    line1 +
                    "|" +
                    line2 +
                    "|" +
                    fontString(p.label.font) +
                    "|" +
                    p.label.color
                ensureText(key, line1, line2, p.label.font, p.label.color)
                let tx = st.mx + 16
                if (tx + tipW > st.w - 8) tx = st.mx - 16 - tipW
                let ty = st.my - tipH - 12
                if (ty < 8) ty = st.my + 14
                tx = Math.max(8, Math.min(st.w - 8 - tipW, tx))
                ty = Math.max(8, Math.min(st.h - 8 - tipH, ty))
                gl!.uniform4f(U["uTipRect"], tx, ty, tipW, tipH)
            }
            gl!.uniform1f(U["uTipA"], st.tipA * (p.label.show ? 1 : 0))

            gl!.activeTexture(gl.TEXTURE0)
            gl!.bindTexture(gl.TEXTURE_2D, mapTex)
            gl!.uniform1i(U["uMap"], 0)
            gl!.activeTexture(gl.TEXTURE1)
            gl!.bindTexture(gl.TEXTURE_2D, textTex)
            gl!.uniform1i(U["uText"], 1)
            gl!.activeTexture(gl.TEXTURE2)
            gl!.bindTexture(gl.TEXTURE_2D, atlasTex)
            gl!.uniform1i(U["uAtlas"], 2)
            gl!.activeTexture(gl.TEXTURE3)
            gl!.bindTexture(gl.TEXTURE_2D, labTex)
            gl!.uniform1i(U["uLabTex"], 3)
            gl!.drawArrays(gl.TRIANGLES, 0, 3)
        }

        function step(dt: Num) {
            const p = propsRef.current
            const autoActive =
                p.move.play &&
                !st.reduced &&
                !st.tiny &&
                !st.dragging &&
                !(p.move.pause && st.hoverInside)
            if (autoActive) st.spin += p.move.speed * 0.5 * dt
            if (
                !st.dragging &&
                (Math.abs(st.spinVel) > 1e-4 || Math.abs(st.tiltVel) > 1e-4)
            ) {
                st.spin += st.spinVel * dt
                st.tiltUser = Math.max(
                    -1.25,
                    Math.min(1.25, st.tiltUser + st.tiltVel * dt)
                )
                const dec = Math.exp(-3.2 * dt)
                st.spinVel *= dec
                st.tiltVel *= dec
                if (Math.abs(st.spinVel) < 1e-4) st.spinVel = 0
                if (Math.abs(st.tiltVel) < 1e-4) st.tiltVel = 0
            }
            /* cursor lamp tracks the global pointer, inside or outside the frame */
            if (p.globe.lego && p.lamp.mode === "Cursor") {
                st.ltx = st.px
                st.lty = st.py
                const k = st.reduced ? 1 : 1 - Math.exp(-18 * dt)
                st.lx += (st.ltx - st.lx) * k
                st.ly += (st.lty - st.ly) * k
            }
            const probeOn =
                p.probe.show &&
                p.move.mode !== "Drag" &&
                st.hoverInside &&
                !st.tiny
            const tipOn =
                p.label.show &&
                p.move.mode !== "Drag" &&
                st.hoverInside &&
                !st.tiny
            const pTarget = probeOn ? 1 : 0
            const tTarget = tipOn ? 1 : 0
            const rate = 1 - Math.exp(-10 * dt)
            st.probeA += (pTarget - st.probeA) * rate
            st.tipA += (tTarget - st.tipA) * rate
            if (Math.abs(pTarget - st.probeA) < 0.002) st.probeA = pTarget
            if (Math.abs(tTarget - st.tipA) < 0.002) st.tipA = tTarget
            if (!probeOn && st.probeA === 0) st.hadProbe = false
            if (st.hadProbe) {
                if (p.probe.ease === "Spring" && !st.reduced) {
                    const accX = (st.tx - st.mx) * 170 - st.mvx * 26
                    const accY = (st.ty - st.my) * 170 - st.mvy * 26
                    st.mvx += accX * dt
                    st.mvy += accY * dt
                    st.mx += st.mvx * dt
                    st.my += st.mvy * dt
                } else {
                    const k = st.reduced ? 1 : 1 - Math.exp(-16 * dt)
                    st.mx += (st.tx - st.mx) * k
                    st.my += (st.ty - st.my) * k
                    st.mvx = 0
                    st.mvy = 0
                }
            }
        }

        function canAnimate(): boolean {
            if (staticRef.current) return false
            if (!st.visible || st.hidden) return false
            if (st.tiny || st.reduced) return false
            return true
        }

        function animating(): boolean {
            if (!canAnimate()) return false
            const p = propsRef.current
            const autoActive =
                p.move.play && !st.dragging && !(p.move.pause && st.hoverInside)
            const gliding =
                Math.abs(st.spinVel) > 1e-4 || Math.abs(st.tiltVel) > 1e-4
            const springing =
                st.hadProbe &&
                (Math.abs(st.tx - st.mx) > 0.15 ||
                    Math.abs(st.ty - st.my) > 0.15 ||
                    Math.abs(st.mvx) > 2 ||
                    Math.abs(st.mvy) > 2)
            const fading =
                Math.abs(st.probeA - Math.round(st.probeA)) > 0.002 ||
                Math.abs(st.tipA - Math.round(st.tipA)) > 0.002
            const drifting =
                p.backdrop.specks > 0 && p.backdrop.drift && !p.backdrop.clear
            const lightMove =
                p.globe.lego &&
                p.lamp.mode === "Cursor" &&
                (Math.abs(st.ltx - st.lx) > 0.5 ||
                    Math.abs(st.lty - st.ly) > 0.5)
            return (
                autoActive ||
                gliding ||
                springing ||
                fading ||
                drifting ||
                lightMove
            )
        }

        function loop(t: Num) {
            st.raf = 0
            if (st.resizePending) {
                st.resizePending = false
                doResize()
            }
            if (st.rectDirty) refreshRect()
            if (!st.visible || st.hidden) {
                st.running = false
                return
            }
            const dt = Math.min(0.05, Math.max(0.001, (t - st.prev) / 1000))
            st.prev = t
            st.time += dt
            step(dt)
            render()
            if (animating()) {
                st.raf = requestAnimationFrame(loop)
            } else {
                st.running = false
            }
        }

        function kick() {
            if (st.running) return
            if (!st.visible || st.hidden) return
            st.running = true
            st.prev = performance.now()
            st.raf = requestAnimationFrame(loop)
        }

        function stopLoop() {
            if (st.raf) cancelAnimationFrame(st.raf)
            st.raf = 0
            st.running = false
        }

        apiRef.current = {
            kick: kick,
            setSpin: (rad: Num) => {
                st.spin = rad
                st.spinVel = 0
            },
        }

        /* pointer interaction, offset based to avoid layout reads */
        function eventPos(e: PointerEvent): { x: Num; y: Num } {
            if (
                typeof e.offsetX === "number" &&
                typeof e.offsetY === "number"
            ) {
                return { x: e.offsetX, y: e.offsetY }
            }
            if (st.rectDirty) refreshRect()
            return { x: e.clientX - st.rectL, y: e.clientY - st.rectT }
        }
        const onDown = (e: PointerEvent) => {
            const p = propsRef.current
            if (p.move.mode === "Hover") return
            const pos = eventPos(e)
            st.dragging = true
            st.lastX = pos.x
            st.lastY = pos.y
            st.lastT = performance.now()
            st.spinVel = 0
            st.tiltVel = 0
            canvas!.setPointerCapture(e.pointerId)
            canvas!.style.cursor = "grabbing"
            kick()
        }
        const onMove = (e: PointerEvent) => {
            const p = propsRef.current
            const pos = eventPos(e)
            if (p.move.mode !== "Drag") computeHover(pos.x, pos.y)
            if (st.dragging) {
                const now = performance.now()
                const dt = Math.max(0.008, (now - st.lastT) / 1000)
                const dx = pos.x - st.lastX
                const dy = pos.y - st.lastY
                st.spin += dx * 0.005
                st.tiltUser = Math.max(
                    -1.25,
                    Math.min(1.25, st.tiltUser + dy * 0.005)
                )
                if (p.move.glide && !st.reduced) {
                    st.spinVel = st.spinVel * 0.5 + ((dx * 0.005) / dt) * 0.5
                    st.tiltVel = st.tiltVel * 0.5 + ((dy * 0.005) / dt) * 0.5
                }
                st.lastX = pos.x
                st.lastY = pos.y
                st.lastT = now
            }
            kick()
        }
        const onUp = (e: PointerEvent) => {
            if (!st.dragging) return
            st.dragging = false
            if (!propsRef.current.move.glide || st.reduced) {
                st.spinVel = 0
                st.tiltVel = 0
            }
            if (canvas!.hasPointerCapture(e.pointerId))
                canvas!.releasePointerCapture(e.pointerId)
            canvas!.style.cursor =
                propsRef.current.move.mode === "Hover" ? "crosshair" : "grab"
            kick()
        }
        const onLeave = () => {
            st.hoverInside = false
            st.hoverPin = -1
            kick()
        }
        /* global pointer tracking keeps the lamp glued to the cursor anywhere */
        const onWinMove = (e: PointerEvent) => {
            if (st.rectDirty) refreshRect()
            st.px = e.clientX - st.rectL
            st.py = e.clientY - st.rectT
            kick()
        }
        const onScroll = () => {
            st.rectDirty = true
        }
        canvas.addEventListener("pointerdown", onDown)
        canvas.addEventListener("pointermove", onMove)
        canvas.addEventListener("pointerup", onUp)
        canvas.addEventListener("pointercancel", onUp)
        canvas.addEventListener("pointerleave", onLeave)
        window.addEventListener("pointermove", onWinMove, { passive: true })
        window.addEventListener("scroll", onScroll, {
            passive: true,
            capture: true,
        })
        canvas.style.cursor = props.move.mode === "Hover" ? "crosshair" : "grab"
        canvas.style.touchAction = "none"

        /* observers: resize is coalesced, visibility pauses the loop */
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(() => {
                st.resizePending = true
                kick()
            })
            ro.observe(wrap)
        }
        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    const was = st.visible
                    st.visible = entry.isIntersecting
                    if (st.visible && !was) {
                        st.resizePending = true
                        kick()
                    }
                    if (!st.visible) stopLoop()
                }
            })
            io.observe(wrap)
        }
        const onVis = () => {
            st.hidden = document.hidden
            if (st.hidden) stopLoop()
            else kick()
        }
        document.addEventListener("visibilitychange", onVis)

        doResize()
        st.resizePending = false
        st.px = st.cx - st.radius * 0.45
        st.py = st.cy - st.radius * 0.45
        st.lx = st.px
        st.ly = st.py
        ensureMap(propsRef.current.globe.seed, propsRef.current.globe.real)
        render()

        return () => {
            stopLoop()
            apiRef.current = null
            if (ro) ro.disconnect()
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            window.removeEventListener("pointermove", onWinMove)
            window.removeEventListener("scroll", onScroll)
            if (mq && mq.removeEventListener)
                mq.removeEventListener("change", onMq)
            canvas.removeEventListener("pointerdown", onDown)
            canvas.removeEventListener("pointermove", onMove)
            canvas.removeEventListener("pointerup", onUp)
            canvas.removeEventListener("pointercancel", onUp)
            canvas.removeEventListener("pointerleave", onLeave)
            gl.deleteTexture(mapTex)
            gl.deleteTexture(textTex)
            gl.deleteTexture(atlasTex)
            gl.deleteTexture(labTex)
            imgCache.clear()
            tileDrawn.clear()
            gl.deleteBuffer(buf)
            gl.deleteProgram(prog)
        }
    }, [])

    /* any prop change redraws once, seed and mode rebake inside render */
    useEffect(() => {
        const api = apiRef.current
        if (!api) return
        if (lastStartRef.current !== props.move.start) {
            lastStartRef.current = props.move.start
            api.setSpin((props.move.start * Math.PI) / 180)
        }
        api.kick()
    })

    const bg = props.backdrop.clear ? "transparent" : props.backdrop.paper
    return (
        <div
            ref={wrapRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: bg,
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

PixelGlobeProbe.defaultProps = {
    width: 600,
    height: 500,
    spots: [],
    globe: {
        cells: 60,
        gap: 1,
        tilt: 10,
        land: 0.5,
        seed: 7,
        round: false,
        real: false,
        lego: false,
        style: "Flat",
    },
    paint: {
        deep: "#2b4a7c",
        sea: "#4779b4",
        shelf: "#a9c9e2",
        grass: "#69a76f",
        sand: "#e3c05c",
        rock: "#9aa1a9",
        shade: true,
        dusk: 0.6,
    },
    lamp: {
        mode: "Cursor",
        radius: 1.4,
        power: 1.15,
        color: "#fff2dd",
        shine: 0.8,
    },
    probe: {
        show: true,
        hue: "#e9c05a",
        size: 1,
        arcs: 0,
        ink: "#141414",
        ease: "Spring",
    },
    label: {
        show: true,
        note: "Scaled \u00B7 4 witnesses \u00B7 0.36 s",
        font: {
            family: "JetBrains Mono, ui-monospace, Menlo, monospace",
            size: 11,
            weight: 500,
            style: "normal",
        },
        color: "#16181c",
        plate: "rgba(255, 255, 255, 0.94)",
        units: "Degrees",
    },
    pins: {
        size: 1,
        ring: true,
        label: true,
        color: "#ffffff",
        font: {
            family: "JetBrains Mono, ui-monospace, Menlo, monospace",
            size: 10,
            weight: 600,
            style: "normal",
        },
    },
    backdrop: {
        draw: true,
        tile: 8,
        line: "rgba(70, 90, 120, 0.10)",
        specks: 6,
        drift: true,
        paper: "#f2f4f7",
        clear: false,
    },
    move: {
        mode: "Both",
        play: true,
        speed: 0.25,
        glide: true,
        pause: true,
        start: 20,
    },
}

addPropertyControls(PixelGlobeProbe, {
    spots: {
        type: ControlType.Array,
        title: "Spots",
        control: {
            type: ControlType.Object,
            title: "Spot",
            controls: {
                name: { type: ControlType.String, title: "Name" },
                lat: {
                    type: ControlType.Number,
                    title: "Lat",
                    min: -90,
                    max: 90,
                    step: 0.5,
                },
                lon: {
                    type: ControlType.Number,
                    title: "Lon",
                    min: -180,
                    max: 180,
                    step: 0.5,
                },
                image: { type: ControlType.Image, title: "Image" },
            },
        },
        defaultValue: [],
    },
    globe: {
        type: ControlType.Object,
        title: "Globe",
        controls: {
            cells: {
                type: ControlType.Number,
                title: "Cells",
                min: 16,
                max: 160,
                step: 4,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 4,
                step: 0.5,
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: -60,
                max: 60,
                step: 1,
            },
            land: {
                type: ControlType.Number,
                title: "Land",
                min: 0,
                max: 1,
                step: 0.05,
            },
            seed: {
                type: ControlType.Number,
                title: "Seed",
                min: 1,
                max: 999,
                step: 1,
            },
            round: { type: ControlType.Boolean, title: "Round" },
            real: { type: ControlType.Boolean, title: "Real" },
            lego: { type: ControlType.Boolean, title: "Lego" },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["Flat", "3D"],
                hidden: (p: any) => !p.lego,
            },
        },
    },
    paint: {
        type: ControlType.Object,
        title: "Paint",
        controls: {
            deep: { type: ControlType.Color, title: "Deep" },
            sea: { type: ControlType.Color, title: "Sea" },
            shelf: { type: ControlType.Color, title: "Shelf" },
            grass: { type: ControlType.Color, title: "Grass" },
            sand: { type: ControlType.Color, title: "Sand" },
            rock: { type: ControlType.Color, title: "Rock" },
            shade: { type: ControlType.Boolean, title: "Shade" },
            dusk: {
                type: ControlType.Number,
                title: "Dusk",
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: any) => !p.shade,
            },
        },
    },
    lamp: {
        type: ControlType.Object,
        title: "Lamp",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["Sun", "Cursor"],
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0.3,
                max: 3,
                step: 0.1,
                hidden: (p: any) => p.mode === "Sun",
            },
            power: {
                type: ControlType.Number,
                title: "Power",
                min: 0.2,
                max: 3,
                step: 0.1,
            },
            color: { type: ControlType.Color, title: "Color" },
            shine: {
                type: ControlType.Number,
                title: "Shine",
                min: 0,
                max: 1,
                step: 0.05,
            },
        },
    },
    probe: {
        type: ControlType.Object,
        title: "Probe",
        controls: {
            show: { type: ControlType.Boolean, title: "Show" },
            hue: {
                type: ControlType.Color,
                title: "Hue",
                hidden: (p: any) => !p.show,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 0.4,
                max: 2,
                step: 0.1,
                hidden: (p: any) => !p.show,
            },
            arcs: {
                type: ControlType.Number,
                title: "Arcs",
                min: 0,
                max: 4,
                step: 1,
                hidden: (p: any) => !p.show,
            },
            ink: {
                type: ControlType.Color,
                title: "Ink",
                hidden: (p: any) => !p.show || p.arcs < 1,
            },
            ease: {
                type: ControlType.Enum,
                title: "Ease",
                options: ["Spring", "Smooth"],
                hidden: (p: any) => !p.show,
            },
        },
    },
    label: {
        type: ControlType.Object,
        title: "Label",
        controls: {
            show: { type: ControlType.Boolean, title: "Show" },
            note: {
                type: ControlType.String,
                title: "Note",
                hidden: (p: any) => !p.show,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                hidden: (p: any) => !p.show,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                hidden: (p: any) => !p.show,
            },
            plate: {
                type: ControlType.Color,
                title: "Plate",
                hidden: (p: any) => !p.show,
            },
            units: {
                type: ControlType.Enum,
                title: "Units",
                options: ["Degrees", "Decimal"],
                hidden: (p: any) => !p.show,
            },
        },
    },
    pins: {
        type: ControlType.Object,
        title: "Pins",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 0.4,
                max: 3,
                step: 0.1,
            },
            ring: { type: ControlType.Boolean, title: "Ring" },
            label: { type: ControlType.Boolean, title: "Label" },
            color: {
                type: ControlType.Color,
                title: "Color",
                hidden: (p: any) => !p.label,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                hidden: (p: any) => !p.label,
            },
        },
    },
    backdrop: {
        type: ControlType.Object,
        title: "Backdrop",
        controls: {
            clear: { type: ControlType.Boolean, title: "Clear" },
            draw: {
                type: ControlType.Boolean,
                title: "Draw",
                hidden: (p: any) => p.clear,
            },
            tile: {
                type: ControlType.Number,
                title: "Tile",
                min: 4,
                max: 40,
                step: 2,
                hidden: (p: any) => !p.draw || p.clear,
            },
            line: {
                type: ControlType.Color,
                title: "Line",
                hidden: (p: any) => !p.draw || p.clear,
            },
            specks: {
                type: ControlType.Number,
                title: "Specks",
                min: 0,
                max: 12,
                step: 1,
                hidden: (p: any) => p.clear,
            },
            drift: {
                type: ControlType.Boolean,
                title: "Drift",
                hidden: (p: any) => p.specks === 0 || p.clear,
            },
            paper: {
                type: ControlType.Color,
                title: "Paper",
                hidden: (p: any) => p.clear,
            },
        },
    },
    move: {
        type: ControlType.Object,
        title: "Move",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["Drag", "Hover", "Both"],
            },
            play: { type: ControlType.Boolean, title: "Play" },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: any) => !p.play,
            },
            glide: { type: ControlType.Boolean, title: "Glide" },
            pause: {
                type: ControlType.Boolean,
                title: "Pause",
                hidden: (p: any) => !p.play,
            },
            start: {
                type: ControlType.Number,
                title: "Start",
                min: -180,
                max: 180,
                step: 5,
            },
        },
    },
})

export default PixelGlobeProbe
