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


const useBeforePaint =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

type Shape = "Portrait" | "Tall" | "Square" | "Landscape" | "Wide"
type ClickMode = "Lightbox" | "Link" | "None"

interface BoxOpts {
    mode: ClickMode
    fill: "Component" | "Screen"
    veil: string
    blur: number
    ink: string
    wrap: boolean
    counter: boolean
    arrows: boolean
}
type Place = "Callout" | "Bottom Left" | "Top Left" | "Bottom Right" | "Cursor"
type Voice = "Serif" | "Sans" | "Custom"

interface Frame {
    image?: { src?: string; srcSet?: string; alt?: string }
    imageUrl?: string
    video?: string
    videoUrl?: string
    title?: string
    caption?: string
    link?: string
    shape?: Shape
}

interface CentreOpts {
    show: boolean
    scale: number
    motion: "Float" | "Inner Orbit" | "Still"
    swing: number
}
type Form = "Field" | "Solar" | "Atom" | "Cloud"
interface OrbitOpts {
    form: Form
    lanes: number
    open: number
    roll: number
    alternate: boolean
    guides: boolean
    guideTone: string
    spin: number
    direction: "Clockwise" | "Counter"
    spread: number
    flatten: number
    tilt: number
    lens: number
    drift: number
    turn: number
    grab: boolean
    sway: number
    swirl: number
    wheel: boolean
    shell: number
    fog: number
}
interface ArrivalOpts {
    play: boolean
    style: "Spiral" | "Depth" | "Curtain"
    length: number
    wave: number
    rings: boolean
    ringTone: string
    again: boolean
}
interface FocusOpts {
    place: Place
    fade: number
    mono: boolean
    rise: number
    hold: number
    marks: boolean
    reach: number
}
interface TypeOpts {
    voice: Voice
    titleSize: number
    titleFont?: React.CSSProperties
    italic: boolean
    titleTone: string
    metaFont?: React.CSSProperties
    metaTone: string
    numbers: boolean
    hint: string
    cta: string
}
interface CardOpts {
    size: number
    radius: number
    shadow: boolean
    blank: string
}

interface Props {
    frames?: Frame[]
    centre?: Partial<CentreOpts>
    orbit?: Partial<OrbitOpts>
    arrival?: Partial<ArrivalOpts>
    focus?: Partial<FocusOpts>
    type?: Partial<TypeOpts>
    card?: Partial<CardOpts>
    box?: Partial<BoxOpts>
    backdrop?: string
    newTab?: boolean
    style?: React.CSSProperties
}

// ─── defaults ────────────────────────────────────────────────────────────────

const pic = (id: string) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=640&q=70`

const SAMPLE: Frame[] = [
    {
        imageUrl: pic("1486718448742-163732cd1544"),
        title: "Folded Light",
        caption: "Study 01 — Perforated shell",
        shape: "Tall",
        link: "",
    },
    {
        imageUrl: pic("1487958449943-2429e8be8625"),
        title: "Quiet Facade",
        caption: "Study 02 — Lime render",
        shape: "Landscape",
        link: "",
    },
    {
        imageUrl: pic("1511818966892-d7d671e672a2"),
        title: "Ribbon Hall",
        caption: "Study 03 — Steel fins",
        shape: "Portrait",
        link: "",
    },
    {
        imageUrl: pic("1479839672679-a46483c0e7c8"),
        title: "North Atrium",
        caption: "Study 04 — Glass & shadow",
        shape: "Square",
        link: "",
    },
    {
        imageUrl: pic("1518005020951-eccb494ad742"),
        title: "Salt Terrace",
        caption: "Study 05 — White mass",
        shape: "Portrait",
        link: "",
    },
    {
        imageUrl: pic("1460574283810-2aab119d8511"),
        title: "Copper Vault",
        caption: "Study 06 — Weathered skin",
        shape: "Tall",
        link: "",
    },
    {
        imageUrl: pic("1431576901776-e539bd916ba2"),
        title: "Paper Stair",
        caption: "Study 07 — Folded concrete",
        shape: "Wide",
        link: "",
    },
    {
        imageUrl: pic("1505843513577-22bb7d21e455"),
        title: "Lumen Court",
        caption: "Study 08 — Open sky",
        shape: "Portrait",
        link: "",
    },
    {
        imageUrl: pic("1449157291145-7efd050a4d0e"),
        title: "Echo Wing",
        caption: "Study 09 — Repeating bays",
        shape: "Landscape",
        link: "",
    },
    {
        imageUrl: pic("1470723710355-95304d8aece4"),
        title: "Slow Tower",
        caption: "Study 10 — Vertical grain",
        shape: "Tall",
        link: "",
    },
    {
        imageUrl: pic("1496568816309-51d7c20e3b21"),
        title: "Shore House",
        caption: "Study 11 — Low horizon",
        shape: "Square",
        link: "",
    },
    {
        imageUrl: pic("1481026469463-66327c86e544"),
        title: "Loom Pavilion",
        caption: "Study 12 — Woven brick",
        shape: "Portrait",
        link: "",
    },
]

const CENTRE: CentreOpts = {
    show: false,
    scale: 1.9,
    motion: "Float",
    swing: 1,
}
const ORBIT: OrbitOpts = {
    form: "Field",
    lanes: 3,
    open: 0.56,
    roll: -9,
    alternate: false,
    guides: false,
    guideTone: "rgba(29, 29, 26, 0.16)",
    spin: 5,
    direction: "Clockwise",
    spread: 1,
    flatten: 0.9,
    tilt: 0,
    lens: 2.2,
    drift: 6,
    turn: 12,
    grab: true,
    sway: 6,
    swirl: 1,
    wheel: true,
    shell: 0.85,
    fog: 0.45,
}
const ARRIVAL: ArrivalOpts = {
    play: true,
    style: "Spiral",
    length: 1.6,
    wave: 1.1,
    rings: false,
    ringTone: "rgba(30, 30, 26, 0.28)",
    again: false,
}
const FOCUS: FocusOpts = {
    place: "Callout",
    fade: 0.28,
    mono: true,
    rise: 0.08,
    hold: 0.15,
    marks: true,
    reach: 34,
}
const TYPE: TypeOpts = {
    voice: "Serif",
    titleSize: 34,
    italic: true,
    titleTone: "#1D1D1A",
    metaTone: "#6E6C64",
    numbers: true,
    hint: "Hover a frame",
    cta: "View",
}
const CARD: CardOpts = { size: 92, radius: 3, shadow: true, blank: "#E3E1DA" }
const BOX: BoxOpts = {
    mode: "Lightbox",
    fill: "Component",
    veil: "rgba(242, 241, 236, 0.9)",
    blur: 16,
    ink: "#1D1D1A",
    wrap: true,
    counter: true,
    arrows: false,
}

const SERIF = `"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif`
const SANS = `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

const merge = <T,>(given: Partial<T> | undefined, base: T): T => ({
    ...base,
    ...(given || {}),
})

// ─── geometry (pure, shared by both branches; no markup) ─────────────────────

const RATIO: Record<Shape, number> = {
    Portrait: 0.76,
    Tall: 0.58,
    Square: 1,
    Landscape: 1.42,
    Wide: 1.8,
}
const DEG = Math.PI / 180
const REST_SPIN = 0.35

function grain(n: number) {
    const v = Math.sin(n * 91.345 + 17.17) * 24634.6345
    return v - Math.floor(v)
}

function footprint(
    shape: Shape | undefined,
    base: number,
    seed: number,
    boost = 1
) {
    const r = RATIO[shape || "Portrait"] ?? 0.76
    const vary = boost === 1 ? 0.8 + grain(seed * 3.1 + 2) * 0.42 : 1
    const root = Math.sqrt(r)
    return { w: base * root * vary * boost, h: (base / root) * vary * boost }
}

interface Anchor {
    rho: number // radius of the loop this card rides
    y: number // height of the loop (cloud only)
    az: number // starting angle on the loop
    incline: number // lean of the loop about the horizontal axis
    roll: number // turn of the loop in the picture plane
    rate: number // angular speed relative to the shared spin
    phase: number
    near: number
    lane: number
    fx?: number // field only: resting spot on the shell (unit radius)
    fy?: number
    fz?: number
}

interface Lane {
    rho: number
    incline: number
    roll: number
}

interface Layout {
    hollow: boolean
    form: Form
    lanes: number
    open: number
    roll: number
    alternate: boolean
}

// Solar: concentric, slightly rolled orbit lanes; cards share each lane evenly,
// inner lanes travel faster. Atom: equal-size lanes rolled evenly around the
// centre so their paths cross. Cloud: every card on a loop of its own.
const FIELD_HALF = 350

function relaxField(
    sizes: { w: number; h: number }[],
    core: { w: number; h: number } | null
) {
    const n = sizes.length
    const gap = 44
    const rad = sizes.map((d) => Math.max(d.w, d.h) / 2 + gap / 2)
    const coreR = core ? Math.max(core.w, core.h) / 2 + gap / 2 : 0
    const fence = 338
    const golden = Math.PI * (3 - Math.sqrt(5))
    const area = rad.reduce(
        (a, r) => a + Math.PI * r * r,
        Math.PI * coreR * coreR
    )
    const start = Math.min(fence * 0.92, Math.sqrt(area / 0.42 / Math.PI))
    const lift = core ? 1.6 : 0
    const pts = sizes.map((_, i) => {
        const r = Math.sqrt((i + 0.5 + lift) / (n + lift)) * start
        const t = i * golden + (grain(i + 5) - 0.5) * 0.4
        return { x: Math.cos(t) * r, y: Math.sin(t) * r }
    })
    for (let it = 0; it < 320; it++) {
        if (it < 240)
            for (const p of pts) {
                p.x *= 0.9985
                p.y *= 0.9985
            }
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                let dx = pts[j].x - pts[i].x
                let dy = pts[j].y - pts[i].y
                let d = Math.hypot(dx, dy)
                const need = rad[i] + rad[j]
                if (d >= need) continue
                if (d < 0.001) {
                    dx = Math.cos(i * 2.4 + j)
                    dy = Math.sin(i * 2.4 + j)
                    d = 1
                }
                const push = (need - d) / 2
                pts[i].x -= (dx / d) * push
                pts[i].y -= (dy / d) * push
                pts[j].x += (dx / d) * push
                pts[j].y += (dy / d) * push
            }
        }
        for (let i = 0; i < n; i++) {
            const p = pts[i]
            let d = Math.hypot(p.x, p.y)
            if (core && d < coreR + rad[i]) {
                if (d < 0.001) {
                    p.x = Math.cos(i * 2.4)
                    p.y = Math.sin(i * 2.4)
                    d = 1
                }
                const f = (coreR + rad[i]) / d
                p.x *= f
                p.y *= f
                d = coreR + rad[i]
            }
            const lim = Math.max(0, fence - rad[i] + gap / 2)
            if (d > lim) {
                p.x *= lim / d
                p.y *= lim / d
            }
        }
    }
    return pts
}

function scatter(
    count: number,
    L: Layout,
    sizes: { w: number; h: number }[] = [],
    core: { w: number; h: number } | null = null
): { anchors: Anchor[]; lanes: Lane[] } {
    const anchors: Anchor[] = []
    const lanes: Lane[] = []
    if (L.form === "Field") {
        // Collision-relaxed scatter in 700px reference space: each card is a
        // circle (half its long side + a gap), so no two cards touch at ANY
        // rotation of the field. Mild gravity keeps the spread even and round.
        const pts = relaxField(sizes, core)
        const edge =
            pts.reduce((m, pt) => Math.max(m, Math.hypot(pt.x, pt.y)), 1) * 1.04
        pts.forEach((pt, i) => {
            const r = Math.hypot(pt.x, pt.y) / edge
            const side = i % 2 === 0 ? 1 : -1
            anchors.push({
                fx: pt.x / FIELD_HALF,
                fy: pt.y / FIELD_HALF,
                fz:
                    side *
                    Math.sqrt(Math.max(0, 1 - r * r)) *
                    (edge / FIELD_HALF),
                rho: Math.hypot(pt.x, pt.y) / FIELD_HALF,
                y: (grain(i + 61) - 0.5) * 0.36,
                az: Math.atan2(pt.y, pt.x) - REST_SPIN,
                incline: -Math.PI / 2,
                roll: 0,
                rate: 1,
                phase: grain(i + 90) * Math.PI * 2,
                near: 0,
                lane: -1,
            })
        })
    } else if (L.form === "Cloud") {
        const golden = Math.PI * (3 - Math.sqrt(5))
        for (let i = 0; i < count; i++) {
            const band = count < 2 ? 0.5 : (i * 0.6180339887 + 0.31) % 1
            const rho = 0.6 + grain(i + 40) * 0.4
            anchors.push({
                rho,
                y: (band * 2 - 1) * 0.72,
                az: i * golden + (grain(i + 5) - 0.5) * 0.5,
                incline: (grain(i + 61) - 0.5) * 0.44 + 0.24,
                roll: 0,
                rate: mix(1.3, 0.82, (rho - 0.6) / 0.4),
                phase: grain(i + 90) * Math.PI * 2,
                near: 0,
                lane: -1,
            })
        }
    } else {
        const n = Math.max(1, Math.min(4, Math.round(L.lanes)))
        const lean = -Math.asin(Math.max(0.05, Math.min(0.95, L.open)))
        for (let l = 0; l < n; l++) {
            const t = n < 2 ? 1 : l / (n - 1)
            const atom = L.form === "Atom"
            lanes.push({
                rho: atom ? mix(0.84, 1, t) : mix(0.5, 1, t),
                incline: atom ? lean * 0.8 : lean,
                roll:
                    L.roll * DEG +
                    (atom ? (l * Math.PI) / n : (l - (n - 1) / 2) * 5 * DEG),
            })
        }
        // Share the cards between lanes by circumference (largest remainder).
        const total = lanes.reduce((a, b) => a + b.rho, 0)
        const exact = lanes.map((ln) => (count * ln.rho) / total)
        const share = exact.map(Math.floor)
        let left = count - share.reduce((a, b) => a + b, 0)
        const byRest = exact
            .map((v, l) => ({ l, r: v - Math.floor(v) }))
            .sort((a, b) => b.r - a.r)
        for (let q = 0; left > 0; q++, left--) share[byRest[q % n].l]++
        let id = 0
        lanes.forEach((ln, l) => {
            const m = share[l]
            const dir = L.alternate && l % 2 === 1 ? -1 : 1
            for (let j = 0; j < m; j++) {
                anchors.push({
                    rho: ln.rho,
                    y: 0,
                    az: (j / Math.max(1, m)) * Math.PI * 2 + l * 0.9,
                    incline: ln.incline,
                    roll: ln.roll,
                    rate: Math.pow(1 / ln.rho, 0.6) * dir,
                    phase: grain(id + 90) * Math.PI * 2,
                    near: 0,
                    lane: l,
                })
                id++
            }
        })
    }
    // Ripple order: planar distance from the centre at the resting angle.
    let far = 0.0001
    const raw = anchors.map((a) => {
        const p = project(a, REST_SPIN, 0, 1, 1, 1000)
        const d = Math.hypot(p.sx, p.sy)
        far = Math.max(far, d)
        return d
    })
    anchors.forEach((a, i) => (a.near = raw[i] / far))
    return { anchors, lanes }
}

function project(
    a: Anchor,
    spin: number,
    tilt: number,
    radius: number,
    flat: number,
    lens: number
) {
    const ang = a.az + spin * a.rate
    const x = Math.cos(ang) * a.rho * radius
    const z0 = Math.sin(ang) * a.rho * radius
    const y0 = a.y * radius * flat
    const ci = Math.cos(a.incline)
    const si = Math.sin(a.incline)
    const y1 = y0 * ci - z0 * si
    const z1 = y0 * si + z0 * ci
    const ct = Math.cos(tilt)
    const st = Math.sin(tilt)
    const y2 = y1 * ct - z1 * st
    const z2 = y1 * st + z1 * ct
    const cr = Math.cos(a.roll)
    const sr = Math.sin(a.roll)
    const xr = x * cr - y2 * sr
    const yr = x * sr + y2 * cr
    const k = lens / Math.max(lens - z2, lens * 0.3)
    return { sx: xr * k, sy: yr * k, k, z: z2 }
}

// Rotate a 3x3 row-major matrix about the world X (0) or Y (1) axis.
function turnWorld(q: number[], axis: 0 | 1, a: number) {
    const c = Math.cos(a)
    const sn = Math.sin(a)
    const top = axis === 1 ? 0 : 3
    for (let j = 0; j < 3; j++) {
        const r0 = q[top + j]
        const r2 = q[6 + j]
        if (axis === 1) {
            q[j] = r0 * c + r2 * sn
            q[6 + j] = -r0 * sn + r2 * c
        } else {
            q[3 + j] = r0 * c - r2 * sn
            q[6 + j] = r0 * sn + r2 * c
        }
    }
}

function orthonormal(q: number[]) {
    let l = Math.hypot(q[0], q[1], q[2]) || 1
    q[0] /= l
    q[1] /= l
    q[2] /= l
    const d = q[0] * q[3] + q[1] * q[4] + q[2] * q[5]
    q[3] -= d * q[0]
    q[4] -= d * q[1]
    q[5] -= d * q[2]
    l = Math.hypot(q[3], q[4], q[5]) || 1
    q[3] /= l
    q[4] /= l
    q[5] /= l
    q[6] = q[1] * q[5] - q[2] * q[4]
    q[7] = q[2] * q[3] - q[0] * q[5]
    q[8] = q[0] * q[4] - q[1] * q[3]
}

// A field card's resting spot on the shell, turned by `v` and seen in perspective.
function fieldPoint(
    a: Anchor,
    v: number[],
    radius: number,
    shell: number,
    lens: number
) {
    const X = (a.fx || 0) * radius
    const Y = (a.fy || 0) * radius
    const Z = (a.fz || 0) * radius * shell
    const wx = v[0] * X + v[1] * Y + v[2] * Z
    const wy = v[3] * X + v[4] * Y + v[5] * Z
    const wz = v[6] * X + v[7] * Y + v[8] * Z
    const k = lens / Math.max(lens - wz, lens * 0.3)
    return { sx: wx * k, sy: wy * k, k, z: wz }
}

// Orbit line for one lane, sampled through the same projection as the cards.
function lanePath(
    ln: Lane,
    tilt: number,
    radius: number,
    lens: number,
    cx: number,
    cy: number
) {
    let d = ""
    const steps = 72
    for (let j = 0; j <= steps; j++) {
        const p = project(
            {
                rho: ln.rho,
                y: 0,
                az: (j / steps) * Math.PI * 2,
                incline: ln.incline,
                roll: ln.roll,
                rate: 0,
                phase: 0,
                near: 0,
                lane: 0,
            },
            0,
            tilt,
            radius,
            1,
            lens
        )
        d += `${j ? "L" : "M"}${(cx + p.sx).toFixed(1)} ${(cy + p.sy).toFixed(1)}`
    }
    return d + "Z"
}

const reachOf = (form: Form) =>
    form === "Field"
        ? 0.5
        : form === "Solar"
          ? 0.4
          : form === "Atom"
            ? 0.38
            : 0.36
const hasLanes = (form: Form) => form === "Solar" || form === "Atom"

const layoutOf = (M: OrbitOpts, hollow: boolean): Layout => ({
    hollow,
    form: M.form,
    lanes: M.lanes,
    open: M.open,
    roll: M.roll,
    alternate: M.alternate,
})

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
// Long, quiet deceleration with no bounce.
const settle = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(1 - t, 4.2))
const softOut = (t: number) => 1 - Math.pow(1 - t, 3)
const longOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))
const pad = (n: number) => String(n).padStart(2, "0")

// Pose that makes a large plate look exactly like the small card it flies from:
// uniform scale to cover the card, then clip the overflow to the card's shape.
function flightPose(from: DOMRect, to: DOMRect, radius: number) {
    const s = Math.max(
        from.width / Math.max(to.width, 1),
        from.height / Math.max(to.height, 1)
    )
    const dx = from.left + from.width / 2 - (to.left + to.width / 2)
    const dy = from.top + from.height / 2 - (to.top + to.height / 2)
    const ix = Math.max(0, (to.width - from.width / s) / 2)
    const iy = Math.max(0, (to.height - from.height / s) / 2)
    return {
        transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${s.toFixed(4)})`,
        clip: `inset(${iy.toFixed(1)}px ${ix.toFixed(1)}px round ${(radius / s).toFixed(1)}px)`,
    }
}

function plateFit(shape: Shape | undefined, w: number, h: number) {
    const r = RATIO[shape || "Portrait"] ?? 0.76
    const maxW = w * (w < 560 ? 0.84 : 0.64)
    const maxH = h * (h < 560 ? 0.56 : 0.6)
    const pw = Math.max(80, Math.min(maxW, maxH * r))
    return { w: pw, h: pw / r }
}

function mediaOf(f: Frame) {
    const still = f.image?.src || f.imageUrl || ""
    const motion = f.video || f.videoUrl || ""
    return {
        still,
        motion,
        srcSet: f.image?.srcSet,
        alt: f.image?.alt || f.title || "",
    }
}

function titleFace(t: TypeOpts): React.CSSProperties {
    if (t.voice === "Custom")
        return {
            fontFamily: SERIF,
            fontSize: t.titleSize,
            ...(t.titleFont || {}),
        }
    return {
        fontFamily: t.voice === "Serif" ? SERIF : SANS,
        fontSize: t.titleSize,
        fontWeight: t.voice === "Serif" ? 400 : 500,
        lineHeight: 1,
        letterSpacing: t.voice === "Serif" ? "-0.02em" : "-0.035em",
    }
}

function cornerBox(place: Place): React.CSSProperties {
    if (place === "Callout" || place === "Cursor")
        return {
            left: 0,
            right: 0,
            bottom: 26,
            textAlign: "center",
            alignItems: "center",
        }
    if (place === "Top Left")
        return {
            left: 28,
            top: 26,
            textAlign: "left",
            alignItems: "flex-start",
        }
    if (place === "Bottom Right")
        return {
            right: 28,
            bottom: 26,
            textAlign: "right",
            alignItems: "flex-end",
        }
    return { left: 28, bottom: 26, textAlign: "left", alignItems: "flex-start" }
}

// ─── entry ───────────────────────────────────────────────────────────────────

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Aureole(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <AureoleStill {...props} />
    return <AureoleLive {...props} />
}

// ─── static branch: plain divs, resting layout, no motion of any kind ────────

function AureoleStill(props: Props) {
    const frames = props.frames && props.frames.length ? props.frames : SAMPLE
    const C = merge(props.centre, CENTRE)
    const M = merge(props.orbit, ORBIT)
    const T = merge(props.type, TYPE)
    const K = merge(props.card, CARD)
    const lead = C.show && frames.length > 0 ? 1 : 0
    const sdims = frames.map((f, i) =>
        footprint(f.shape, K.size, i, lead === 1 && i === 0 ? C.scale : 1)
    )
    const { anchors, lanes } = scatter(
        frames.length - lead,
        layoutOf(M, lead === 1),
        sdims.slice(lead),
        lead ? sdims[0] : null
    )
    const place = merge(props.focus, FOCUS).place
    const hintAt: Place = place
    const REF = 700
    const R = REF * reachOf(M.form) * M.spread
    const still = [1, 0, 0, 0, 1, 0, 0, 0, 1]
    turnWorld(still, 0, -M.tilt * DEG)
    const lens = REF * M.lens

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: props.backdrop ?? "#F2F1EC",
                containerType: "size",
            }}
        >
            {hasLanes(M.form) && M.guides ? (
                <svg
                    aria-hidden
                    viewBox={`0 0 ${REF} ${REF}`}
                    preserveAspectRatio="none"
                    width="100%"
                    height="100%"
                    style={{ position: "absolute", inset: 0, zIndex: 2 }}
                >
                    {lanes.map((ln, l) => (
                        <path
                            key={l}
                            d={lanePath(
                                ln,
                                M.tilt * DEG,
                                R,
                                lens,
                                REF / 2,
                                REF / 2
                            )}
                            fill="none"
                            stroke={M.guideTone}
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                </svg>
            ) : null}
            {frames.map((f, i) => {
                const m = mediaOf(f)
                const isLead = lead === 1 && i === 0
                const dim = sdims[i]
                let left = 0
                let top = 0
                let k = 1
                let z = 0
                let haze = 1
                if (!isLead) {
                    const a = anchors[i - lead]
                    if (M.form === "Field") {
                        const rf = (REF / 2) * M.spread
                        const fp = fieldPoint(
                            a,
                            still,
                            rf,
                            M.shell,
                            REF * M.lens * 1.45
                        )
                        left = fp.sx / 7
                        top = fp.sy / 7
                        k = fp.k
                        z = fp.z
                        haze = mix(
                            1 - M.fog,
                            1,
                            clamp01(
                                (fp.z /
                                    Math.max(1, rf * Math.max(0.25, M.shell)) +
                                    1) /
                                    2
                            )
                        )
                    } else {
                        const p = project(
                            a,
                            REST_SPIN,
                            M.tilt * DEG,
                            R,
                            M.flatten,
                            lens
                        )
                        left = p.sx / 7
                        top = p.sy / 7
                        k = p.k
                        z = p.z
                        haze = 0.62 + 0.38 * ((p.z / R + 1) / 2)
                    }
                }
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: `calc(50% + ${left.toFixed(3)}cqmin)`,
                            top: `calc(50% + ${top.toFixed(3)}cqmin)`,
                            width: `${(dim.w / 7).toFixed(3)}cqmin`,
                            height: `${(dim.h / 7).toFixed(3)}cqmin`,
                            transform: `translate(-50%, -50%) scale(${k})`,
                            zIndex: 1000 + Math.round(z),
                            opacity: haze,
                            borderRadius: K.radius,
                            overflow: "hidden",
                            background: K.blank,
                            boxShadow: K.shadow
                                ? "0 18px 36px -20px rgba(24,22,16,0.38)"
                                : "none",
                        }}
                    >
                        {m.still ? (
                            <img
                                src={m.still}
                                alt={m.alt}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : null}
                    </div>
                )
            })}
            {T.hint ? (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 6000,
                        display: "flex",
                        flexDirection: "column",
                        ...cornerBox(hintAt),
                        fontFamily: SANS,
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        ...(T.metaFont || {}),
                        color: T.metaTone,
                    }}
                >
                    {T.hint}
                </div>
            ) : null}
        </div>
    )
}

// ─── live branch ─────────────────────────────────────────────────────────────

interface Sim {
    raf: number
    last: number
    clock: number
    spin: number
    fling: number
    arrival: number
    open: boolean
    seen: boolean
    calm: boolean
    w: number
    h: number
    px: number
    py: number
    tx: number
    ty: number
    cx: number
    cy: number
    gx: number
    gy: number
    hold: null | {
        x: number
        y: number
        t: number
        v: number
        vx: number
        a: number
    }
    cang: number[]
    cvel: number[]
    qm: number[]
    view: number[]
    flingX: number
    travel: number
    touch: boolean
    boxed: boolean
    hidden: number
    hot: number
    draw: number
    hx: number
    hy: number
    hw: number
    hh: number
    lw: number
    lh: number
    side: number
    lift: number[]
    hush: number[]
    clips: string[]
    zooms: string[]
    gkey: string
    gdraw: string
    tint: string[]
}

function AureoleLive(props: Props) {
    const uid = "au" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const frames = props.frames && props.frames.length ? props.frames : SAMPLE
    const C = merge(props.centre, CENTRE)
    const F = merge(props.focus, FOCUS)
    const T = merge(props.type, TYPE)
    const K = merge(props.card, CARD)
    const A = merge(props.arrival, ARRIVAL)
    const lead = C.show && frames.length > 0 ? 1 : 0
    const Mo = merge(props.orbit, ORBIT)
    const dims = frames.map((f, i) =>
        footprint(f.shape, K.size, i, lead === 1 && i === 0 ? C.scale : 1)
    )
    const sizeKey = dims
        .map((d) => `${d.w.toFixed(1)}x${d.h.toFixed(1)}`)
        .join(",")
    const { anchors, lanes } = React.useMemo(
        () =>
            scatter(
                frames.length - lead,
                layoutOf(Mo, lead === 1),
                dims.slice(lead),
                lead ? dims[0] : null
            ),
        [
            frames.length,
            lead,
            Mo.form,
            Mo.lanes,
            Mo.open,
            Mo.roll,
            Mo.alternate,
            sizeKey,
        ]
    )

    const stage = React.useRef<HTMLDivElement>(null)
    const cards = React.useRef<(HTMLDivElement | null)[]>([])
    const shades = React.useRef<(HTMLDivElement | null)[]>([])
    const rings = React.useRef<(HTMLDivElement | null)[]>([])
    const lines = React.useRef<(SVGPathElement | null)[]>([])
    const reels = React.useRef<(HTMLVideoElement | null)[]>([])
    const label = React.useRef<HTMLDivElement>(null)
    const plate = React.useRef<HTMLDivElement>(null)
    const shut = React.useRef<HTMLButtonElement>(null)
    const boxReel = React.useRef<HTMLVideoElement | null>(null)
    const launch = React.useRef<DOMRect | null>(null)
    const leaveTimer = React.useRef(0)
    const viaKey = React.useRef(false)
    const swipe = React.useRef<number | null>(null)
    const leader = React.useRef<SVGPathElement>(null)
    const pin = React.useRef<SVGCircleElement>(null)
    const marks = React.useRef<HTMLDivElement>(null)
    const placed = React.useRef<Place | "">("")
    const B = merge(props.box, BOX)
    const [box, setBox] = React.useState<{
        index: number
        start: number
        seq: number
        leaving: boolean
    } | null>(null)
    const boxRef = React.useRef(box)
    boxRef.current = box
    const [area, setArea] = React.useState({ w: 700, h: 700 })

    const latest = React.useRef({
        props,
        anchors,
        lanes,
        dims,
        lead,
        count: frames.length,
    })
    latest.current = { props, anchors, lanes, dims, lead, count: frames.length }

    const [lit, setLit] = React.useState<{ index: number; on: boolean }>({
        index: -1,
        on: false,
    })
    const litRef = React.useRef(-1)

    const sim = React.useRef<Sim>({
        raf: 0,
        last: 0,
        clock: 0,
        spin: REST_SPIN,
        fling: 0,
        arrival: -1,
        open: false,
        seen: false,
        calm: false,
        w: 0,
        h: 0,
        px: 0,
        py: 0,
        tx: 0,
        ty: 0,
        cx: 0,
        cy: 0,
        gx: 0,
        gy: 0,
        hold: null,
        travel: 0,
        touch: false,
        boxed: false,
        hidden: -1,
        hot: -1,
        draw: 0,
        hx: 0,
        hy: 0,
        hw: 0,
        hh: 0,
        lw: 0,
        lh: 0,
        side: 0,
        lift: [],
        hush: [],
        clips: [],
        zooms: [],
        cang: [],
        cvel: [],
        qm: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        view: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        flingX: 0,
        gkey: "",
        gdraw: "",
        tint: [],
    })

    const engine = React.useRef<{
        wake: () => void
        reels: (go: boolean) => void
    }>({
        wake: () => {},
        reels: () => {},
    })

    React.useEffect(() => {
        const node = stage.current
        if (!node) return
        const s = sim.current

        const reelsGo = (go: boolean) => {
            ;[...reels.current, boxReel.current].forEach((v) => {
                if (!v) return
                if (go && !s.calm) {
                    const p = v.play()
                    if (p && typeof p.catch === "function") p.catch(() => {})
                } else v.pause()
            })
        }

        const park = () => {
            if (s.raf) cancelAnimationFrame(s.raf)
            s.raf = 0
            s.last = 0
            s.hold = null
            s.fling = 0
            s.travel = 0
        }

        const step = (now: number) => {
            s.raf = 0
            if (!s.open) {
                park()
                return
            }
            const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 1 / 60
            s.last = now
            const {
                props: P,
                anchors: list,
                lanes: rings2,
                dims: size,
                lead: one,
                count,
            } = latest.current
            const M = merge(P.orbit, ORBIT)
            const Ar = merge(P.arrival, ARRIVAL)
            const Fo = merge(P.focus, FOCUS)
            const corner = merge(P.card, CARD).radius
            const Ce = merge(P.centre, CENTRE)
            const W = s.w
            const H = s.h
            if (!W || !H) return

            let busy = false
            const calm = s.calm
            const entering = Ar.play && !calm
            const ringSpan = Ar.length * 1.5
            const finish =
                Math.max(
                    0.2 + Ar.wave + Ar.length,
                    Ar.rings ? 0.44 + ringSpan : 0
                ) + 0.05
            if (s.arrival < 0) s.arrival = 0
            if (entering && s.arrival < finish) {
                s.arrival += dt
                busy = true
            }
            if (!calm) s.clock += dt

            const lit = litRef.current
            const dir = M.direction === "Counter" ? -1 : 1
            const auto =
                calm || s.boxed
                    ? 0
                    : M.spin * DEG * dir * (lit >= 0 ? Fo.hold : 1)
            if (!s.hold) {
                s.fling *= Math.pow(0.14, dt)
                if (Math.abs(s.fling) < 0.003) s.fling = 0
            }
            s.spin += (auto + s.fling) * dt
            if (auto !== 0 || s.fling !== 0 || s.hold) busy = true

            const ease = 1 - Math.pow(0.004, dt)
            s.px += (s.tx - s.px) * ease
            s.py += (s.ty - s.py) * ease
            if (Math.abs(s.tx - s.px) + Math.abs(s.ty - s.py) > 0.0008)
                busy = true

            const R = Math.min(W, H) * reachOf(M.form) * M.spread
            const lens = Math.min(W, H) * M.lens
            const sway = calm ? 0 : M.sway
            const tilt = (M.tilt + s.py * sway) * DEG
            const spinNow = s.spin + s.px * sway * DEG
            const bob = calm || s.boxed ? 0 : M.drift
            if (bob > 0) busy = true
            const field = M.form === "Field"
            const unit = Math.min(W, H) / 700
            const Rf = (Math.min(W, H) / 2) * M.spread
            const lensF = Math.min(W, H) * M.lens * 1.45
            const view = s.view
            if (field) {
                // Auto motion tumbles on a slowly wandering axis so no card ever
                // sits on the spin axis; drag and scroll add angular momentum.
                if (!s.hold) {
                    s.flingX *= Math.pow(0.14, dt)
                    if (Math.abs(s.flingX) < 0.003) s.flingX = 0
                }
                const ay = (auto + s.fling) * dt
                const ax =
                    (auto * 0.45 * Math.sin(s.clock * 0.23 + 0.7) + s.flingX) *
                    dt
                if (ay) turnWorld(s.qm, 1, ay)
                if (ax) turnWorld(s.qm, 0, ax)
                if (s.flingX !== 0) busy = true
                orthonormal(s.qm)
                for (let q = 0; q < 9; q++) view[q] = s.qm[q]
                turnWorld(view, 1, s.px * sway * DEG)
                turnWorld(view, 0, -(M.tilt + s.py * sway) * DEG)
            }

            const snap = 1 - Math.pow(0.0006, dt)
            for (let i = 0; i < count; i++) {
                const el = cards.current[i]
                if (!el) continue
                const d = size[i]
                if (!d) continue
                const isLead = one === 1 && i === 0
                const a = isLead ? null : list[i - one]
                if (!isLead && !a) continue

                const upGoal = lit === i ? 1 : 0
                const hushGoal = lit >= 0 && lit !== i ? 1 : 0
                const up = (s.lift[i] ?? 0) + (upGoal - (s.lift[i] ?? 0)) * snap
                const hu =
                    (s.hush[i] ?? 0) + (hushGoal - (s.hush[i] ?? 0)) * snap
                s.lift[i] = Math.abs(up - upGoal) < 0.002 ? upGoal : up
                s.hush[i] = Math.abs(hu - hushGoal) < 0.002 ? hushGoal : hu
                if (s.lift[i] !== upGoal || s.hush[i] !== hushGoal) busy = true

                // Entrance. Spiral: cards unfurl out from behind the centre along
                // their own loops. Depth: they surface from far back in the fog.
                // Curtain: each frame opens in place as a wave passes outward.
                const order = isLead
                    ? 0
                    : Ar.style === "Spiral"
                      ? (i - one) / Math.max(1, count - one - 1)
                      : (a as Anchor).near
                const wait = isLead ? 0 : 0.2 + order * Ar.wave
                const t = entering ? clamp01((s.arrival - wait) / Ar.length) : 1
                const e = settle(t)
                let reach = 1
                let grow = 1
                let show = 1
                let unwind = 0
                let sink = 0
                let zoom = 1
                let clip = "none"
                if (t < 1) {
                    if (isLead) {
                        clip = `inset(${((1 - e) * 100).toFixed(2)}% 0% 0% 0% round ${corner}px)`
                        zoom = mix(1.28, 1, e)
                        show = clamp01(t * 6)
                    } else if (Ar.style === "Spiral") {
                        reach = mix(0.04, 1, e)
                        unwind = (1 - e) * 2.7
                        grow = mix(0.5, 1, e)
                        show = clamp01(t * 3.2)
                    } else if (Ar.style === "Depth") {
                        reach = mix(0.72, 1, e)
                        grow = mix(0.18, 1, e)
                        sink = (1 - e) * 44
                        show = softOut(clamp01(t * 1.5))
                    } else {
                        const gap = ((1 - e) * 50).toFixed(2)
                        clip = `inset(${gap}% 0% ${gap}% 0% round ${corner}px)`
                        zoom = mix(1.4, 1, e)
                        grow = mix(0.94, 1, e)
                        show = clamp01(t * 5)
                    }
                }
                if (s.clips[i] !== clip) {
                    el.style.clipPath = clip
                    s.clips[i] = clip
                }

                let x = W / 2
                let y = H / 2
                let k = 1
                let z = 0
                let haze = 1
                let turn = 0
                let pitch = 0
                let lean = 0
                if (isLead) {
                    let base = 1
                    const moving = Ce.motion !== "Still" && !calm && !s.boxed
                    if (moving) {
                        busy = true
                        const sw = Ce.swing * (1 - s.lift[i] * 0.7)
                        const c = s.clock
                        if (Ce.motion === "Inner Orbit") {
                            // A small tilted loop of its own, slower than the outer ring.
                            const p = project(
                                {
                                    rho: 0.26,
                                    y: 0,
                                    az: 1.1,
                                    incline: 0,
                                    roll: 0,
                                    rate: 0.55,
                                    phase: 0,
                                    near: 0,
                                    lane: -1,
                                },
                                spinNow,
                                tilt,
                                R * sw,
                                M.flatten,
                                lens
                            )
                            x += p.sx
                            y += p.sy + Math.sin(c * 0.6) * bob * 0.6
                            base = p.k
                            z = p.z
                            turn =
                                -(p.sx / Math.max(R * 0.26, 1)) * 10 * sw +
                                s.px * sway
                            pitch = -s.py * sway * 0.8
                        } else {
                            // Lissajous float with a slow breathing tilt.
                            const amp = (bob * 1.6 * unit + R * 0.04) * sw
                            x += Math.sin(c * 0.29 + 0.6) * amp
                            y += Math.sin(c * 0.43) * amp * 0.85
                            base = 1 + Math.sin(c * 0.37) * 0.022 * sw
                            turn = Math.sin(c * 0.33) * 9 * sw + s.px * sway
                            pitch =
                                Math.cos(c * 0.27) * 6 * sw - s.py * sway * 0.8
                        }
                    }
                    k = base * unit * (1 + s.lift[i] * Fo.rise * 0.5)
                } else {
                    const an = a as Anchor
                    const bx =
                        Math.cos(s.clock * 0.47 + an.phase * 1.3) *
                        bob *
                        0.5 *
                        unit
                    const by = Math.sin(s.clock * 0.71 + an.phase) * bob * unit
                    if (field) {
                        // True 3D: the card's point on the shell is turned by the
                        // field's rotation (drag / scroll / auto tumble), then seen
                        // through perspective. Cards stay facing the viewer.
                        const fp = fieldPoint(an, view, Rf, M.shell, lensF)
                        let sx = fp.sx
                        let sy = fp.sy
                        if (unwind) {
                            const c = Math.cos(-unwind * dir)
                            const sn = Math.sin(-unwind * dir)
                            const tx = sx * c - sy * sn
                            sy = sx * sn + sy * c
                            sx = tx
                        }
                        x += (sx + bx) * reach
                        y += (sy + by) * reach + sink * unit
                        k = fp.k * unit * grow * (1 + s.lift[i] * Fo.rise)
                        z = fp.z
                        const front = clamp01(
                            (fp.z / Math.max(1, Rf * Math.max(0.25, M.shell)) +
                                1) /
                                2
                        )
                        haze = mix(1 - M.fog, 1, front)
                        turn =
                            -(fp.sx / Math.max(Rf, 1)) *
                            M.turn *
                            (1 - s.lift[i])
                        pitch =
                            (fp.sy / Math.max(Rf, 1)) *
                            M.turn *
                            0.6 *
                            (1 - s.lift[i])
                    } else {
                        const p = project(
                            an,
                            spinNow - (unwind * dir) / an.rate,
                            tilt,
                            R,
                            M.flatten,
                            lens
                        )
                        x += (p.sx + bx) * reach
                        y += (p.sy + by) * reach + sink * unit
                        k = p.k * unit * grow * (1 + s.lift[i] * Fo.rise)
                        z = p.z
                        haze = 0.62 + 0.38 * ((p.z / R + 1) / 2)
                        turn =
                            -(p.sx / Math.max(R, 1)) * M.turn * (1 - s.lift[i])
                    }
                }
                const fade = 1 - s.hush[i] * (1 - Fo.fade)
                el.style.transform = `translate3d(${(x - d.w / 2).toFixed(2)}px, ${(y - d.h / 2).toFixed(2)}px, 0) perspective(760px) rotateX(${pitch.toFixed(2)}deg) rotateY(${turn.toFixed(2)}deg) rotateZ(${lean.toFixed(2)}deg) scale(${k.toFixed(4)})`
                el.style.opacity =
                    s.hidden === i ? "0" : (show * haze * fade).toFixed(3)
                el.style.zIndex = String(
                    lit === i ? 5000 : 1000 + Math.round(z)
                )
                if (i === s.hot) {
                    s.hx = x
                    s.hy = y
                    s.hw = d.w * k
                    s.hh = d.h * k
                }

                const shade = shades.current[i]
                if (shade) {
                    const scale =
                        zoom > 1.0001 ? `scale(${zoom.toFixed(4)})` : "none"
                    if (s.zooms[i] !== scale) {
                        shade.style.transform = scale
                        s.zooms[i] = scale
                    }
                    const tone = Fo.mono
                        ? `grayscale(${s.hush[i].toFixed(2)})`
                        : "none"
                    if (s.tint[i] !== tone) {
                        shade.style.filter = tone
                        s.tint[i] = tone
                    }
                }
            }

            if (hasLanes(M.form) && M.guides) {
                const key = `${tilt.toFixed(4)}|${R.toFixed(1)}|${lens.toFixed(1)}|${W}|${H}|${rings2.length}|${M.roll}|${M.open}|${M.form}`
                if (s.gkey !== key) {
                    s.gkey = key
                    rings2.forEach((ln, l) => {
                        const el = lines.current[l]
                        if (el)
                            el.setAttribute(
                                "d",
                                lanePath(ln, tilt, R, lens, W / 2, H / 2)
                            )
                    })
                }
                const g = entering
                    ? settle(clamp01(s.arrival / (Ar.length * 0.9)))
                    : 1
                const off = (1 - g).toFixed(4)
                if (s.gdraw !== off) {
                    s.gdraw = off
                    lines.current.forEach((el) => {
                        if (el) el.style.strokeDashoffset = off
                    })
                }
            }

            for (let r = 0; r < 3; r++) {
                const ring = rings.current[r]
                if (!ring) continue
                const rt = (s.arrival - r * 0.22) / ringSpan
                if (Ar.rings && entering && rt > 0 && rt < 1) {
                    const dia = mix(0.08, 1, longOut(rt)) * R * 2.5
                    ring.style.width = `${dia}px`
                    ring.style.height = `${dia}px`
                    ring.style.transform = `translate3d(${W / 2 - dia / 2}px, ${H / 2 - dia / 2}px, 0)`
                    ring.style.opacity = ((1 - rt) * (1 - rt)).toFixed(3)
                } else ring.style.opacity = "0"
            }

            // Callout: a hairline leader draws out of the hovered card's outer corner
            // to an elbow, then runs under the title; registration marks lock on.
            if (Fo.place === "Callout" && label.current) {
                const goal = lit >= 0 ? 1 : 0
                const pace = 1 - Math.pow(goal ? 0.0025 : 0.0002, dt)
                s.draw += (goal - s.draw) * pace
                if (Math.abs(goal - s.draw) < 0.002) s.draw = goal
                else busy = true
                const on = s.draw
                const lw = s.lw || 220
                const lh = s.lh || 80
                const arm = Fo.reach
                const hw = s.hw / 2
                const hh = s.hh / 2
                const room = (side: number) =>
                    side > 0
                        ? W - (s.hx + hw + arm + lw + 14)
                        : s.hx - hw - arm - lw - 14
                let side = s.hx >= W / 2 ? 1 : -1
                if (room(side) < 0 && room(-side) > room(side)) side = -side
                const lift = s.hy <= H / 2 ? -1 : 1
                const ax = s.hx + side * hw
                const ay = s.hy + lift * hh
                const ex = ax + side * arm
                let ey = ay + lift * arm
                if (lift < 0) ey = Math.max(ey, lh + 18)
                else ey = Math.min(ey, H - lh - 18)
                let left = side > 0 ? ex : ex - lw
                left = Math.max(10, Math.min(W - lw - 10, left))
                const top = lift < 0 ? ey - lh - 9 : ey + 9
                const tail = side > 0 ? left + lw : left
                const path = leader.current
                if (path) {
                    path.setAttribute(
                        "d",
                        `M${ax.toFixed(1)} ${ay.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}L${tail.toFixed(1)} ${ey.toFixed(1)}`
                    )
                    path.style.strokeDashoffset = (1 - on).toFixed(4)
                    path.style.opacity = on > 0.001 ? "1" : "0"
                }
                const dot = pin.current
                if (dot) {
                    dot.setAttribute("cx", ax.toFixed(1))
                    dot.setAttribute("cy", ay.toFixed(1))
                    dot.style.opacity = clamp01(on * 3).toFixed(3)
                }
                label.current.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`
                if (s.side !== side) {
                    s.side = side
                    label.current.style.alignItems =
                        side > 0 ? "flex-start" : "flex-end"
                    label.current.style.textAlign = side > 0 ? "left" : "right"
                    label.current.style.setProperty(
                        "--row",
                        side > 0 ? "flex-start" : "flex-end"
                    )
                }
                const frame = marks.current
                if (frame) {
                    const gap = 7
                    const grow = mix(1.22, 1, softOut(on))
                    frame.style.width = `${(s.hw + gap * 2).toFixed(1)}px`
                    frame.style.height = `${(s.hh + gap * 2).toFixed(1)}px`
                    frame.style.transform = `translate3d(${(s.hx - hw - gap).toFixed(1)}px, ${(s.hy - hh - gap).toFixed(1)}px, 0) scale(${grow.toFixed(4)})`
                    frame.style.opacity = Fo.marks ? on.toFixed(3) : "0"
                }
                if (lit < 0 && s.draw === 0) s.hot = -1
            }

            if (label.current && Fo.place === "Cursor") {
                const follow = 1 - Math.pow(0.0009, dt)
                s.cx += (s.gx - s.cx) * follow
                s.cy += (s.gy - s.cy) * follow
                label.current.style.transform = `translate3d(${(s.cx + 22).toFixed(1)}px, ${(s.cy + 18).toFixed(1)}px, 0)`
                if (Math.abs(s.gx - s.cx) + Math.abs(s.gy - s.cy) > 0.3)
                    busy = true
            }

            if (busy && s.open) s.raf = requestAnimationFrame(step)
        }

        const wake = () => {
            if (!s.open || s.raf) return
            s.last = 0
            s.raf = requestAnimationFrame(step)
        }

        let inView = typeof IntersectionObserver === "undefined"
        let tabOn =
            typeof document === "undefined" ||
            document.visibilityState !== "hidden"

        const sync = () => {
            const next = inView && tabOn
            if (next === s.open) return
            s.open = next
            if (next) {
                const again = merge(latest.current.props.arrival, ARRIVAL).again
                if (!s.seen || again) s.arrival = 0
                s.seen = true
                reelsGo(true)
                wake()
            } else {
                park()
                reelsGo(false)
            }
        }

        const measure = () => {
            s.w = node.clientWidth
            s.h = node.clientHeight
            wake()
        }
        measure()

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    const e = entries[entries.length - 1]
                    inView = !!e && e.isIntersecting
                    sync()
                },
                { threshold: 0 }
            )
            io.observe(node)
        }

        const onTab = () => {
            tabOn = document.visibilityState !== "hidden"
            sync()
        }
        document.addEventListener("visibilitychange", onTab)

        const mq =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        s.calm = !!(mq && mq.matches)
        const onCalm = () => {
            s.calm = !!(mq && mq.matches)
            reelsGo(s.open)
            wake()
        }
        if (mq) {
            if (typeof mq.addEventListener === "function")
                mq.addEventListener("change", onCalm)
            else if (typeof mq.addListener === "function")
                mq.addListener(onCalm)
        }

        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure)
            ro.observe(node)
        } else window.addEventListener("resize", measure)

        // Scroll spins the orbit (and glides on). Native, non-passive, so the page
        // does not scroll while the pointer is over the stage.
        const onWheel = (e: WheelEvent) => {
            const Mw = merge(latest.current.props.orbit, ORBIT)
            if (!Mw.wheel || s.boxed) return
            const raw =
                Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
            const step = e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? 420 : 1
            s.fling = Math.max(-6, Math.min(6, s.fling + raw * step * 0.0017))
            e.preventDefault()
            wake()
        }
        node.addEventListener("wheel", onWheel, { passive: false })

        engine.current = { wake, reels: reelsGo }
        sync()

        return () => {
            node.removeEventListener("wheel", onWheel)
            io && io.disconnect()
            ro ? ro.disconnect() : window.removeEventListener("resize", measure)
            document.removeEventListener("visibilitychange", onTab)
            if (mq) {
                if (typeof mq.removeEventListener === "function")
                    mq.removeEventListener("change", onCalm)
                else if (typeof mq.removeListener === "function")
                    mq.removeListener(onCalm)
            }
            s.open = false
            park()
            reelsGo(false)
            engine.current = { wake: () => {}, reels: () => {} }
        }
    }, [])

    // Callout size is read once per render (content changes only), never per frame.
    useBeforePaint(() => {
        const node = label.current
        if (!node) return
        if (placed.current !== F.place) {
            placed.current = F.place
            sim.current.side = 0
            engine.current.wake()
        }
        sim.current.lw = node.offsetWidth
        sim.current.lh = node.offsetHeight
    })

    // Property-panel edits and content changes: redraw, and start any new reels.
    React.useEffect(() => {
        sim.current.gkey = ""
        sim.current.gdraw = ""
        engine.current.reels(sim.current.open)
        engine.current.wake()
    })

    const light = (i: number) => {
        if (litRef.current === i) return
        litRef.current = i
        const s = sim.current
        if (i >= 0 && i !== s.hot) {
            s.hot = i
            s.draw = 0
        }
        setLit((prev) =>
            i >= 0 ? { index: i, on: true } : { index: prev.index, on: false }
        )
        engine.current.wake()
    }

    const follow = (cx: number, cy: number) => {
        const node = stage.current
        if (!node) return
        const box = node.getBoundingClientRect()
        const s = sim.current
        const x = cx - box.left
        const y = cy - box.top
        s.tx = box.width ? (x / box.width) * 2 - 1 : 0
        s.ty = box.height ? (y / box.height) * 2 - 1 : 0
        if (s.gx === 0 && s.gy === 0) {
            s.cx = x
            s.cy = y
        }
        s.gx = x
        s.gy = y
    }

    const onDown = (e: React.PointerEvent) => {
        const s = sim.current
        if (s.boxed) return
        s.touch = e.pointerType === "touch"
        s.travel = 0
        follow(e.clientX, e.clientY)
        if (merge(props.orbit, ORBIT).grab) {
            s.hold = {
                x: e.clientX,
                y: e.clientY,
                t: performance.now(),
                v: 0,
                vx: 0,
                a: 0,
            }
            s.fling = 0
            s.flingX = 0
        }
        engine.current.wake()
    }

    const onMove = (e: React.PointerEvent) => {
        const s = sim.current
        follow(e.clientX, e.clientY)
        if (s.hold) {
            const now = performance.now()
            const dx = e.clientX - s.hold.x
            const dy = e.clientY - s.hold.y
            const span = Math.max(1, now - s.hold.t) / 1000
            const per =
                0.0065 * (700 / Math.max(240, Math.min(s.w, s.h) || 700))
            const turn = dx * per
            if (merge(props.orbit, ORBIT).form === "Field") {
                // Trackball: horizontal drag turns the shell around its vertical
                // axis, vertical drag tips it over — cards travel in depth.
                const tip = -dy * per
                turnWorld(s.qm, 1, turn)
                turnWorld(s.qm, 0, tip)
                s.hold.vx = mix(s.hold.vx, tip / span, 0.35)
                s.travel += Math.abs(dx) + Math.abs(dy)
            } else {
                s.spin += turn
                s.travel += Math.abs(dx)
            }
            s.hold.v = mix(s.hold.v, turn / span, 0.35)
            s.hold.x = e.clientX
            s.hold.y = e.clientY
            s.hold.t = now
        }
        engine.current.wake()
    }

    const release = () => {
        const s = sim.current
        if (s.hold) {
            const stale = performance.now() - s.hold.t > 90
            s.fling =
                s.travel > 4 && !stale ? Math.max(-5, Math.min(5, s.hold.v)) : 0
            s.flingX =
                s.travel > 4 && !stale
                    ? Math.max(-5, Math.min(5, s.hold.vx))
                    : 0
            s.hold = null
        }
        engine.current.wake()
    }

    const onLeaveStage = () => {
        const s = sim.current
        s.tx = 0
        s.ty = 0
        release()
        if (!s.touch) light(-1)
    }

    const onKey = (e: React.KeyboardEvent) => {
        if (boxRef.current) return
        if (
            (e.key === "ArrowUp" || e.key === "ArrowDown") &&
            merge(props.orbit, ORBIT).form === "Field"
        ) {
            sim.current.flingX += e.key === "ArrowDown" ? 1.1 : -1.1
            engine.current.wake()
            e.preventDefault()
            return
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            sim.current.fling += e.key === "ArrowRight" ? 1.1 : -1.1
            engine.current.wake()
            e.preventDefault()
        }
    }

    const go = (f: Frame) => {
        if (!f.link) return
        if (props.newTab ?? true)
            window.open(f.link, "_blank", "noopener,noreferrer")
        else window.location.href = f.link
    }

    // ── lightbox ──
    const openBox = (i: number, byKey: boolean) => {
        const node = stage.current
        const card = cards.current[i]
        const fill = merge(latest.current.props.box, BOX).fill
        launch.current = card ? card.getBoundingClientRect() : null
        viaKey.current = byKey
        window.clearTimeout(leaveTimer.current)
        setArea(
            fill === "Screen"
                ? { w: window.innerWidth, h: window.innerHeight }
                : {
                      w: node ? node.clientWidth : 700,
                      h: node ? node.clientHeight : 700,
                  }
        )
        const s = sim.current
        s.boxed = true
        s.hidden = i
        s.hold = null
        s.fling = 0
        litRef.current = -1
        setLit((prev) => ({ index: prev.index, on: false }))
        setBox({
            index: i,
            start: i,
            seq: (boxRef.current?.seq ?? 0) + 1,
            leaving: false,
        })
        engine.current.wake()
    }

    const closeBox = () => {
        const b = boxRef.current
        if (!b || b.leaving) return
        const s = sim.current
        const el = plate.current
        const card = cards.current[b.index]
        const corner = merge(latest.current.props.card, CARD).radius
        setBox({ ...b, leaving: true })
        if (el && card && !s.calm) {
            const p = flightPose(
                card.getBoundingClientRect(),
                el.getBoundingClientRect(),
                corner
            )
            const curve = "cubic-bezier(.62,0,.22,1)"
            el.style.transition = `transform 0.62s ${curve}, clip-path 0.62s ${curve}`
            el.style.transform = p.transform
            el.style.clipPath = p.clip
        }
        window.clearTimeout(leaveTimer.current)
        leaveTimer.current = window.setTimeout(
            () => {
                s.boxed = false
                s.hidden = -1
                setBox(null)
                engine.current.wake()
                if (viaKey.current)
                    cards.current[b.index]?.focus({ preventScroll: true })
            },
            s.calm ? 0 : 640
        )
    }

    const stepBox = (d: number) => {
        const b = boxRef.current
        if (!b || b.leaving) return
        const n = latest.current.count
        const wrap = merge(latest.current.props.box, BOX).wrap
        let next = b.index + d
        if (next < 0 || next >= n) {
            if (!wrap) return
            next = (next + n) % n
        }
        sim.current.hidden = next
        setBox({ ...b, index: next })
        engine.current.wake()
    }

    // Zoom the plate out of the clicked card (FLIP: measure, invert, release).
    useBeforePaint(() => {
        const el = plate.current
        if (!box || box.leaving || !el) return
        const from = launch.current
        launch.current = null
        const corner = merge(latest.current.props.card, CARD).radius
        const curve = "cubic-bezier(.16,.84,.24,1)"
        if (from && !sim.current.calm) {
            const p = flightPose(from, el.getBoundingClientRect(), corner)
            el.style.transition = "none"
            el.style.transform = p.transform
            el.style.clipPath = p.clip
            void el.offsetWidth
        }
        el.style.transition = `transform 0.78s ${curve}, clip-path 0.78s ${curve}, width 0.55s ${curve}, height 0.55s ${curve}`
        el.style.transform = "none"
        el.style.clipPath = `inset(0px 0px round ${corner}px)`
        shut.current?.focus({ preventScroll: true })
    }, [box?.seq])

    // Keys, resize and scroll lock exist only while the lightbox is open.
    React.useEffect(() => {
        if (!box || box.leaving) return
        const fill = merge(latest.current.props.box, BOX).fill
        const onKeys = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeBox()
            else if (e.key === "ArrowRight") stepBox(1)
            else if (e.key === "ArrowLeft") stepBox(-1)
            else return
            e.preventDefault()
        }
        const onSize = () => {
            const node = stage.current
            setArea(
                fill === "Screen"
                    ? { w: window.innerWidth, h: window.innerHeight }
                    : {
                          w: node ? node.clientWidth : 700,
                          h: node ? node.clientHeight : 700,
                      }
            )
        }
        window.addEventListener("keydown", onKeys)
        window.addEventListener("resize", onSize)
        const before = document.body.style.overflow
        if (fill === "Screen") document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKeys)
            window.removeEventListener("resize", onSize)
            if (fill === "Screen") document.body.style.overflow = before
        }
    }, [box?.seq, box?.leaving])

    React.useEffect(() => () => window.clearTimeout(leaveTimer.current), [])

    const pick = (i: number, byKey = false) => {
        const s = sim.current
        if (!byKey && s.travel > 6) return
        const mode = merge(props.box, BOX).mode
        if (mode === "None") return
        if (mode === "Lightbox") {
            openBox(i, byKey)
            return
        }
        if (!byKey && s.touch && litRef.current !== i) {
            light(i)
            return
        }
        go(frames[i])
    }

    const shown = lit.index >= 0 ? frames[lit.index] : null
    const cue =
        !!shown &&
        (B.mode === "Lightbox" || (B.mode === "Link" && !!shown.link))

    const opened = box ? frames[box.index] : null
    const openedMedia = opened
        ? mediaOf(opened)
        : { still: "", motion: "", srcSet: undefined, alt: "" }
    const fit = plateFit(opened?.shape, area.w, area.h)
    const compact = area.w < 520
    const plateTitle = compact
        ? Math.min(T.titleSize * 0.85, 28)
        : Math.min(T.titleSize * 1.1, 40)
    const halt = (e: React.SyntheticEvent) => e.stopPropagation()
    const enter = (delay: number): React.CSSProperties =>
        box && box.leaving
            ? {
                  opacity: 0,
                  transition: "opacity 0.26s ease",
                  animation: "none",
              }
            : {
                  animation: `${uid}-rest 0.55s cubic-bezier(.2,.7,.2,1) ${delay}s backwards`,
              }
    const words = (shown?.title || "").split(" ").filter(Boolean)
    let tick = 0
    const face = titleFace(T)
    const meta: React.CSSProperties = {
        fontFamily: SANS,
        fontSize: 11,
        letterSpacing: "0.14em",
        lineHeight: 1.4,
        textTransform: "uppercase",
        ...(T.metaFont || {}),
        color: T.metaTone,
    }
    const atCursor = F.place === "Cursor"
    const callout = F.place === "Callout"
    const lag = callout ? 0.16 : 0
    const titleBox: React.CSSProperties = callout
        ? { left: 0, top: 0, maxWidth: 250, gap: 8, willChange: "transform" }
        : atCursor
          ? {
                left: 0,
                top: 0,
                maxWidth: 300,
                alignItems: "flex-start",
                textAlign: "left",
                willChange: "transform",
            }
          : { ...cornerBox(F.place), maxWidth: "62%" }
    const notch = (pos: "tl" | "tr" | "bl" | "br"): React.CSSProperties => ({
        position: "absolute",
        width: 9,
        height: 9,
        top: pos[0] === "t" ? 0 : undefined,
        bottom: pos[0] === "b" ? 0 : undefined,
        left: pos[1] === "l" ? 0 : undefined,
        right: pos[1] === "r" ? 0 : undefined,
        borderTop: pos[0] === "t" ? `1px solid ${T.titleTone}` : undefined,
        borderBottom: pos[0] === "b" ? `1px solid ${T.titleTone}` : undefined,
        borderLeft: pos[1] === "l" ? `1px solid ${T.titleTone}` : undefined,
        borderRight: pos[1] === "r" ? `1px solid ${T.titleTone}` : undefined,
    })
    const hintBox: React.CSSProperties = cornerBox(F.place)

    return (
        <div
            ref={stage}
            role="region"
            aria-label="Orbit gallery"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={release}
            onPointerCancel={release}
            onPointerLeave={onLeaveStage}
            onKeyDown={onKey}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: props.backdrop ?? "#F2F1EC",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: merge(props.orbit, ORBIT).grab ? "grab" : "default",
            }}
        >
            <style>{`
@keyframes ${uid}-rise { from { transform: translate3d(0, 108%, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes ${uid}-lift { from { opacity: 0; transform: translate3d(0, 8px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
@keyframes ${uid}-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ${uid}-rest { from { opacity: 0; transform: translate3d(0, 10px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
@keyframes ${uid}-swap { from { opacity: 0; transform: scale(1.04); } to { opacity: 1; transform: scale(1); } }
.${uid}-btn { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; padding: 0; margin: 0; background: transparent; color: inherit; border: 1px solid currentColor; cursor: pointer; opacity: 0.62; transition: opacity 0.25s ease, transform 0.3s cubic-bezier(.2,.8,.2,1); -webkit-tap-highlight-color: transparent; }
.${uid}-btn:hover { opacity: 1; transform: scale(1.06); }
.${uid}-btn:focus { outline: none; }
.${uid}-btn:focus-visible { opacity: 1; outline: 1px solid currentColor; outline-offset: 4px; }
.${uid}-btn:disabled { opacity: 0.16; cursor: default; transform: none; }
.${uid}-go { color: inherit; text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 2px; white-space: nowrap; }
.${uid}-go:hover { opacity: 0.6; }
@media (prefers-reduced-motion: reduce) { .${uid}-ch, .${uid}-mt, .${uid}-fx, .${uid}-sw { animation: none !important; } }
`}</style>

            {[0, 1, 2].map((r) => (
                <div
                    key={`ring${r}`}
                    ref={(el) => {
                        rings.current[r] = el
                    }}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 0,
                        height: 0,
                        borderRadius: "50%",
                        border: `1px solid ${A.ringTone}`,
                        opacity: 0,
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                />
            ))}

            {hasLanes(Mo.form) && Mo.guides ? (
                <svg
                    aria-hidden
                    width="100%"
                    height="100%"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        pointerEvents: "none",
                        overflow: "visible",
                    }}
                >
                    {lanes.map((_, l) => (
                        <path
                            key={`lane${l}`}
                            ref={(el) => {
                                lines.current[l] = el
                            }}
                            d="M0 0"
                            pathLength={1}
                            strokeDasharray="1"
                            fill="none"
                            stroke={Mo.guideTone}
                            strokeWidth={1}
                            style={{ strokeDashoffset: 1 }}
                        />
                    ))}
                </svg>
            ) : null}

            {frames.map((f, i) => {
                const m = mediaOf(f)
                const d = dims[i]
                return (
                    <div
                        key={i}
                        ref={(el) => {
                            cards.current[i] = el
                        }}
                        role={
                            B.mode === "Lightbox"
                                ? "button"
                                : B.mode === "Link" && f.link
                                  ? "link"
                                  : "img"
                        }
                        aria-label={f.title || `Frame ${i + 1}`}
                        tabIndex={0}
                        onPointerEnter={(e) => {
                            if (e.pointerType !== "touch") light(i)
                        }}
                        onPointerLeave={(e) => {
                            if (
                                e.pointerType !== "touch" &&
                                litRef.current === i
                            )
                                light(-1)
                        }}
                        onFocus={() => light(i)}
                        onBlur={() => {
                            if (litRef.current === i) light(-1)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                pick(i, true)
                            }
                        }}
                        onClick={() => pick(i)}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: d.w,
                            height: d.h,
                            opacity: 0,
                            transformOrigin: "50% 50%",
                            willChange: "transform, opacity",
                            borderRadius: K.radius,
                            overflow: "hidden",
                            background: K.blank,
                            boxShadow: K.shadow
                                ? "0 18px 36px -20px rgba(24,22,16,0.38)"
                                : "none",
                            cursor:
                                B.mode === "Lightbox" ||
                                (B.mode === "Link" && f.link)
                                    ? "pointer"
                                    : "inherit",
                            outline: "none",
                        }}
                    >
                        <div
                            ref={(el) => {
                                shades.current[i] = el
                            }}
                            style={{ position: "absolute", inset: 0 }}
                        >
                            {m.motion ? (
                                <video
                                    ref={(el) => {
                                        reels.current[i] = el
                                    }}
                                    src={m.motion}
                                    poster={m.still || undefined}
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        pointerEvents: "none",
                                    }}
                                />
                            ) : m.still ? (
                                <img
                                    src={m.still}
                                    srcSet={m.srcSet}
                                    alt={m.alt}
                                    draggable={false}
                                    decoding="async"
                                    onError={(e) => {
                                        ;(
                                            e.currentTarget as HTMLImageElement
                                        ).style.visibility = "hidden"
                                    }}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        pointerEvents: "none",
                                    }}
                                />
                            ) : null}
                        </div>
                    </div>
                )
            })}

            {T.hint ? (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        zIndex: 6000,
                        display: "flex",
                        flexDirection: "column",
                        pointerEvents: "none",
                        ...hintBox,
                        ...meta,
                        opacity: lit.on ? 0 : 1,
                        transition: "opacity 0.4s ease",
                    }}
                >
                    {T.hint}
                </div>
            ) : null}

            {callout ? (
                <>
                    <svg
                        aria-hidden
                        width="100%"
                        height="100%"
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 5999,
                            pointerEvents: "none",
                            overflow: "visible",
                        }}
                    >
                        <path
                            ref={leader}
                            d="M0 0"
                            pathLength={1}
                            fill="none"
                            stroke={T.titleTone}
                            strokeWidth={1}
                            strokeDasharray="1"
                            strokeLinecap="round"
                            style={{ strokeDashoffset: 1, opacity: 0 }}
                        />
                        <circle
                            ref={pin}
                            r={2.6}
                            cx={0}
                            cy={0}
                            fill={T.titleTone}
                            style={{ opacity: 0 }}
                        />
                    </svg>
                    <div
                        ref={marks}
                        aria-hidden
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: 0,
                            height: 0,
                            zIndex: 5998,
                            opacity: 0,
                            pointerEvents: "none",
                            transformOrigin: "50% 50%",
                        }}
                    >
                        <div style={notch("tl")} />
                        <div style={notch("tr")} />
                        <div style={notch("bl")} />
                        <div style={notch("br")} />
                    </div>
                </>
            ) : null}

            <div
                ref={label}
                aria-live="polite"
                style={{
                    position: "absolute",
                    zIndex: 6001,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    pointerEvents: "none",
                    ...titleBox,
                    opacity: lit.on ? 1 : 0,
                    transition: "opacity 0.35s ease",
                }}
            >
                {shown ? (
                    <React.Fragment key={lit.index}>
                        {T.numbers ? (
                            <div
                                className={`${uid}-mt`}
                                style={{
                                    ...meta,
                                    animation: `${uid}-lift 0.5s cubic-bezier(.2,.7,.2,1) ${lag}s both`,
                                }}
                            >
                                {pad(lit.index + 1)}{" "}
                                <span style={{ opacity: 0.5 }}>
                                    / {pad(frames.length)}
                                </span>
                            </div>
                        ) : null}
                        {words.length ? (
                            <div
                                style={{
                                    ...face,
                                    color: T.titleTone,
                                    margin: 0,
                                }}
                            >
                                {words.map((w, wi) => {
                                    const lean =
                                        T.italic &&
                                        words.length > 1 &&
                                        wi === words.length - 1
                                    return (
                                        <React.Fragment key={wi}>
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    overflow: "hidden",
                                                    verticalAlign: "top",
                                                    paddingBottom: "0.1em",
                                                    marginBottom: "-0.1em",
                                                    fontStyle: lean
                                                        ? "italic"
                                                        : undefined,
                                                }}
                                            >
                                                {Array.from(w).map((ch, ci) => {
                                                    const delay = (
                                                        lag +
                                                        tick++ * 0.022 +
                                                        wi * 0.03
                                                    ).toFixed(3)
                                                    return (
                                                        <span
                                                            key={ci}
                                                            className={`${uid}-ch`}
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                animation: `${uid}-rise 0.72s cubic-bezier(.16,.84,.24,1) ${delay}s both`,
                                                            }}
                                                        >
                                                            {ch}
                                                        </span>
                                                    )
                                                })}
                                            </span>
                                            {wi < words.length - 1 ? " " : null}
                                        </React.Fragment>
                                    )
                                })}
                            </div>
                        ) : null}
                        {shown.caption || (cue && T.cta) ? (
                            <div
                                className={`${uid}-mt`}
                                style={{
                                    ...meta,
                                    display: "flex",
                                    gap: 14,
                                    flexWrap: "wrap",
                                    justifyContent: callout
                                        ? "var(--row, flex-start)"
                                        : F.place === "Bottom Right"
                                          ? "flex-end"
                                          : "flex-start",
                                    animation: `${uid}-lift 0.55s cubic-bezier(.2,.7,.2,1) ${0.16 + lag}s both`,
                                }}
                            >
                                {shown.caption ? (
                                    <span>{shown.caption}</span>
                                ) : null}
                                {cue && T.cta ? (
                                    <span
                                        style={{
                                            color: T.titleTone,
                                            borderBottom: `1px solid ${T.titleTone}`,
                                        }}
                                    >
                                        {T.cta}{" "}
                                        {B.mode === "Lightbox" ? "+" : "↗"}
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                    </React.Fragment>
                ) : null}
            </div>

            {box && opened ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={opened.title || `Frame ${box.index + 1}`}
                    onPointerDown={halt}
                    onPointerMove={halt}
                    onPointerUp={halt}
                    onKeyDown={halt}
                    style={{
                        position: B.fill === "Screen" ? "fixed" : "absolute",
                        inset: 0,
                        zIndex: B.fill === "Screen" ? 2147483000 : 7000,
                        color: B.ink,
                        cursor: "default",
                        touchAction: "none",
                    }}
                >
                    <div
                        aria-hidden
                        className={`${uid}-fx`}
                        onClick={closeBox}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: B.veil,
                            backdropFilter: B.blur
                                ? `blur(${B.blur}px)`
                                : undefined,
                            WebkitBackdropFilter: B.blur
                                ? `blur(${B.blur}px)`
                                : undefined,
                            ...(box.leaving
                                ? {
                                      opacity: 0,
                                      transition: "opacity 0.5s ease 0.1s",
                                  }
                                : { animation: `${uid}-fade 0.5s ease` }),
                        }}
                    />

                    {B.counter ? (
                        <div
                            className={`${uid}-fx`}
                            style={{
                                position: "absolute",
                                left: 24,
                                top: 30,
                                ...meta,
                                color: B.ink,
                                ...enter(0.22),
                            }}
                        >
                            {pad(box.index + 1)}{" "}
                            <span style={{ opacity: 0.5 }}>
                                / {pad(frames.length)}
                            </span>
                        </div>
                    ) : null}

                    <button
                        ref={shut}
                        type="button"
                        aria-label="Close"
                        className={`${uid}-btn ${uid}-fx`}
                        onClick={closeBox}
                        style={{
                            position: "absolute",
                            right: 18,
                            top: 18,
                            ...enter(0.22),
                        }}
                    >
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            aria-hidden
                        >
                            <path d="M1 1l12 12M13 1L1 13" />
                        </svg>
                    </button>

                    {B.arrows && frames.length > 1 ? (
                        <>
                            <div
                                style={{
                                    position: "absolute",
                                    left: compact ? 10 : 18,
                                    top: "calc(50% - 21px)",
                                    zIndex: 2,
                                }}
                            >
                                <button
                                    type="button"
                                    aria-label="Previous"
                                    className={`${uid}-btn ${uid}-fx`}
                                    disabled={!B.wrap && box.index === 0}
                                    onClick={() => stepBox(-1)}
                                    style={enter(0.3)}
                                >
                                    <svg
                                        width="16"
                                        height="12"
                                        viewBox="0 0 16 12"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.3"
                                        aria-hidden
                                    >
                                        <path d="M15 6H1M6 1L1 6l5 5" />
                                    </svg>
                                </button>
                            </div>
                            <div
                                style={{
                                    position: "absolute",
                                    right: compact ? 10 : 18,
                                    top: "calc(50% - 21px)",
                                    zIndex: 2,
                                }}
                            >
                                <button
                                    type="button"
                                    aria-label="Next"
                                    className={`${uid}-btn ${uid}-fx`}
                                    disabled={
                                        !B.wrap &&
                                        box.index === frames.length - 1
                                    }
                                    onClick={() => stepBox(1)}
                                    style={enter(0.3)}
                                >
                                    <svg
                                        width="16"
                                        height="12"
                                        viewBox="0 0 16 12"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.3"
                                        aria-hidden
                                    >
                                        <path d="M1 6h14M10 1l5 5-5 5" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : null}

                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: compact ? 14 : 22,
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            ref={plate}
                            onPointerDown={(e) => {
                                swipe.current = e.clientX
                            }}
                            onPointerUp={(e) => {
                                const x0 = swipe.current
                                swipe.current = null
                                if (x0 === null) return
                                const dx = e.clientX - x0
                                if (Math.abs(dx) > 42) stepBox(dx < 0 ? 1 : -1)
                            }}
                            style={{
                                position: "relative",
                                width: fit.w,
                                height: fit.h,
                                overflow: "hidden",
                                borderRadius: K.radius,
                                background: K.blank,
                                boxShadow:
                                    "0 44px 90px -44px rgba(20,18,12,0.5)",
                                transformOrigin: "50% 50%",
                                willChange: "transform",
                                pointerEvents: "auto",
                            }}
                        >
                            <div
                                key={box.index}
                                className={`${uid}-sw`}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    animation:
                                        box.index !== box.start
                                            ? `${uid}-swap 0.6s cubic-bezier(.2,.7,.2,1)`
                                            : undefined,
                                }}
                            >
                                {openedMedia.motion ? (
                                    <video
                                        ref={boxReel}
                                        src={openedMedia.motion}
                                        poster={openedMedia.still || undefined}
                                        autoPlay={!sim.current.calm}
                                        muted
                                        loop
                                        playsInline
                                        controls
                                        preload="auto"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                ) : openedMedia.still ? (
                                    <img
                                        src={openedMedia.still}
                                        srcSet={openedMedia.srcSet}
                                        alt={openedMedia.alt}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            pointerEvents: "none",
                                        }}
                                    />
                                ) : null}
                            </div>
                        </div>

                        <div
                            className={`${uid}-fx`}
                            style={{
                                width: Math.min(
                                    area.w - 40,
                                    Math.max(fit.w, 360)
                                ),
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                gap: 12,
                                pointerEvents: "auto",
                                ...enter(0.3),
                            }}
                        >
                            <div
                                key={box.index}
                                className={`${uid}-sw`}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 8,
                                    maxWidth: "100%",
                                    animation:
                                        box.index !== box.start
                                            ? `${uid}-rest 0.5s cubic-bezier(.2,.7,.2,1)`
                                            : undefined,
                                }}
                            >
                                {opened.title ? (
                                    <div
                                        style={{
                                            ...face,
                                            ...(T.voice === "Custom"
                                                ? {}
                                                : { fontSize: plateTitle }),
                                            color: T.titleTone,
                                            margin: 0,
                                        }}
                                    >
                                        {opened.title
                                            .split(" ")
                                            .map((w, wi, all) => (
                                                <React.Fragment key={wi}>
                                                    <span
                                                        style={{
                                                            fontStyle:
                                                                T.italic &&
                                                                all.length >
                                                                    1 &&
                                                                wi ===
                                                                    all.length -
                                                                        1
                                                                    ? "italic"
                                                                    : undefined,
                                                        }}
                                                    >
                                                        {w}
                                                    </span>
                                                    {wi < all.length - 1
                                                        ? " "
                                                        : null}
                                                </React.Fragment>
                                            ))}
                                    </div>
                                ) : null}
                                {opened.caption ? (
                                    <div style={meta}>{opened.caption}</div>
                                ) : null}
                            </div>
                            {opened.link ? (
                                <a
                                    className={`${uid}-go`}
                                    href={opened.link}
                                    target={
                                        (props.newTab ?? true)
                                            ? "_blank"
                                            : undefined
                                    }
                                    rel="noopener noreferrer"
                                    style={{ ...meta, color: B.ink }}
                                >
                                    {T.cta || "Open"} ↗
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

// ─── property controls ───────────────────────────────────────────────────────

const SHAPES: Shape[] = ["Portrait", "Tall", "Square", "Landscape", "Wide"]

addPropertyControls(Aureole, {
    frames: {
        type: ControlType.Array,
        title: "Frames",
        maxCount: 24,
        defaultValue: SAMPLE,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://….mp4",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Untitled",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    defaultValue: "",
                },
                link: { type: ControlType.Link, title: "CMS Link" },
                shape: {
                    type: ControlType.Enum,
                    title: "Shape",
                    options: SHAPES,
                    optionTitles: SHAPES,
                    defaultValue: "Portrait",
                },
            },
        },
    },
    centre: {
        type: ControlType.Object,
        title: "Centre",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Focal Frame",
                defaultValue: CENTRE.show,
                enabledTitle: "First",
                disabledTitle: "None",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 1,
                max: 3,
                step: 0.05,
                defaultValue: CENTRE.scale,
                hidden: (o: any) => !o.show,
            },
            motion: {
                type: ControlType.Enum,
                title: "Motion",
                options: ["Float", "Inner Orbit", "Still"],
                optionTitles: ["Float", "Inner Orbit", "Still"],
                displaySegmentedControl: true,
                defaultValue: CENTRE.motion,
                hidden: (o: any) => !o.show,
            },
            swing: {
                type: ControlType.Number,
                title: "Amount",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: CENTRE.swing,
                hidden: (o: any) => !o.show || o.motion === "Still",
            },
        },
    },
    orbit: {
        type: ControlType.Object,
        title: "Orbit",
        controls: {
            form: {
                type: ControlType.Enum,
                title: "Layout",
                options: ["Field", "Solar", "Atom", "Cloud"],
                optionTitles: ["Field", "Solar", "Atom", "Cloud"],
                displaySegmentedControl: true,
                defaultValue: ORBIT.form,
            },
            lanes: {
                type: ControlType.Number,
                title: "Orbits",
                min: 1,
                max: 4,
                step: 1,
                displayStepper: true,
                defaultValue: ORBIT.lanes,
                hidden: (o: any) => o.form === "Cloud" || o.form === "Field",
            },
            open: {
                type: ControlType.Number,
                title: "Openness",
                min: 0.1,
                max: 0.9,
                step: 0.01,
                defaultValue: ORBIT.open,
                hidden: (o: any) => o.form === "Cloud" || o.form === "Field",
            },
            roll: {
                type: ControlType.Number,
                title: "Roll",
                min: -45,
                max: 45,
                step: 1,
                unit: "°",
                defaultValue: ORBIT.roll,
                hidden: (o: any) => o.form === "Cloud" || o.form === "Field",
            },
            alternate: {
                type: ControlType.Boolean,
                title: "Counter Lanes",
                defaultValue: ORBIT.alternate,
                hidden: (o: any) => o.form === "Cloud" || o.form === "Field",
            },
            guides: {
                type: ControlType.Boolean,
                title: "Orbit Lines",
                defaultValue: ORBIT.guides,
                hidden: (o: any) => o.form === "Cloud" || o.form === "Field",
            },
            guideTone: {
                type: ControlType.Color,
                title: "Line Color",
                defaultValue: ORBIT.guideTone,
                hidden: (o: any) =>
                    o.form === "Cloud" || o.form === "Field" || !o.guides,
            },
            spin: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 40,
                step: 0.5,
                unit: "°/s",
                defaultValue: ORBIT.spin,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["Clockwise", "Counter"],
                optionTitles: ["Clockwise", "Counter"],
                displaySegmentedControl: true,
                defaultValue: ORBIT.direction,
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                min: 0.5,
                max: 1.6,
                step: 0.02,
                defaultValue: ORBIT.spread,
            },
            flatten: {
                type: ControlType.Number,
                title: "Height",
                min: 0.4,
                max: 1.3,
                step: 0.02,
                defaultValue: ORBIT.flatten,
                hidden: (o: any) => o.form !== "Cloud",
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: -40,
                max: 40,
                step: 1,
                unit: "°",
                defaultValue: ORBIT.tilt,
            },
            lens: {
                type: ControlType.Number,
                title: "Perspective",
                min: 1.2,
                max: 5,
                step: 0.1,
                defaultValue: ORBIT.lens,
            },
            drift: {
                type: ControlType.Number,
                title: "Float",
                min: 0,
                max: 24,
                step: 1,
                unit: "px",
                defaultValue: ORBIT.drift,
            },
            turn: {
                type: ControlType.Number,
                title: "Card Turn",
                min: 0,
                max: 45,
                step: 1,
                unit: "°",
                defaultValue: ORBIT.turn,
            },
            sway: {
                type: ControlType.Number,
                title: "Parallax",
                min: 0,
                max: 20,
                step: 1,
                unit: "°",
                defaultValue: ORBIT.sway,
            },
            grab: {
                type: ControlType.Boolean,
                title: "Drag Spin",
                defaultValue: ORBIT.grab,
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Scroll Spin",
                defaultValue: ORBIT.wheel,
            },
            shell: {
                type: ControlType.Number,
                title: "Depth",
                min: 0,
                max: 1.5,
                step: 0.05,
                defaultValue: ORBIT.shell,
                hidden: (o: any) => o.form !== "Field",
            },
            fog: {
                type: ControlType.Number,
                title: "Back Fade",
                min: 0,
                max: 0.9,
                step: 0.05,
                defaultValue: ORBIT.fog,
                hidden: (o: any) => o.form !== "Field",
            },
        },
    },
    arrival: {
        type: ControlType.Object,
        title: "Entrance",
        controls: {
            play: {
                type: ControlType.Boolean,
                title: "Animate",
                defaultValue: ARRIVAL.play,
            },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["Spiral", "Depth", "Curtain"],
                optionTitles: ["Spiral", "Depth", "Curtain"],
                displaySegmentedControl: true,
                defaultValue: ARRIVAL.style,
                hidden: (o: any) => !o.play,
            },
            length: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.3,
                max: 3,
                step: 0.05,
                unit: "s",
                defaultValue: ARRIVAL.length,
                hidden: (o: any) => !o.play,
            },
            wave: {
                type: ControlType.Number,
                title: "Wave",
                min: 0,
                max: 2.5,
                step: 0.05,
                unit: "s",
                defaultValue: ARRIVAL.wave,
                hidden: (o: any) => !o.play,
            },
            rings: {
                type: ControlType.Boolean,
                title: "Rings",
                defaultValue: ARRIVAL.rings,
                hidden: (o: any) => !o.play,
            },
            ringTone: {
                type: ControlType.Color,
                title: "Ring Color",
                defaultValue: ARRIVAL.ringTone,
                hidden: (o: any) => !o.play || !o.rings,
            },
            again: {
                type: ControlType.Boolean,
                title: "Replay",
                defaultValue: ARRIVAL.again,
                enabledTitle: "In View",
                disabledTitle: "Once",
                hidden: (o: any) => !o.play,
            },
        },
    },
    focus: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            place: {
                type: ControlType.Enum,
                title: "Title At",
                options: [
                    "Callout",
                    "Cursor",
                    "Bottom Left",
                    "Top Left",
                    "Bottom Right",
                ],
                optionTitles: [
                    "Callout",
                    "Cursor",
                    "Bottom Left",
                    "Top Left",
                    "Bottom Right",
                ],
                defaultValue: FOCUS.place,
            },
            marks: {
                type: ControlType.Boolean,
                title: "Corner Marks",
                defaultValue: FOCUS.marks,
                hidden: (o: any) => o.place !== "Callout",
            },
            reach: {
                type: ControlType.Number,
                title: "Leader",
                min: 10,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: FOCUS.reach,
                hidden: (o: any) => o.place !== "Callout",
            },
            fade: {
                type: ControlType.Number,
                title: "Others",
                min: 0,
                max: 1,
                step: 0.02,
                defaultValue: FOCUS.fade,
            },
            mono: {
                type: ControlType.Boolean,
                title: "Mono Others",
                defaultValue: FOCUS.mono,
            },
            rise: {
                type: ControlType.Number,
                title: "Lift",
                min: 0,
                max: 0.4,
                step: 0.01,
                defaultValue: FOCUS.rise,
            },
            hold: {
                type: ControlType.Number,
                title: "Spin Kept",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: FOCUS.hold,
            },
        },
    },
    type: {
        type: ControlType.Object,
        title: "Type",
        controls: {
            voice: {
                type: ControlType.Enum,
                title: "Title Face",
                options: ["Serif", "Sans", "Custom"],
                optionTitles: ["Serif", "Sans", "Custom"],
                displaySegmentedControl: true,
                defaultValue: TYPE.voice,
            },
            titleSize: {
                type: ControlType.Number,
                title: "Title Size",
                min: 18,
                max: 140,
                step: 1,
                defaultValue: TYPE.titleSize,
                hidden: (o: any) => o.voice === "Custom",
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 54,
                    lineHeight: "1em",
                    letterSpacing: "-0.02em",
                },
                hidden: (o: any) => o.voice !== "Custom",
            },
            italic: {
                type: ControlType.Boolean,
                title: "Italic Last",
                defaultValue: TYPE.italic,
            },
            titleTone: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: TYPE.titleTone,
            },
            metaFont: {
                type: ControlType.Font,
                title: "Meta Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 11,
                    lineHeight: "1.4em",
                    letterSpacing: "0.14em",
                },
            },
            metaTone: {
                type: ControlType.Color,
                title: "Meta Color",
                defaultValue: TYPE.metaTone,
            },
            numbers: {
                type: ControlType.Boolean,
                title: "Index",
                defaultValue: TYPE.numbers,
            },
            hint: {
                type: ControlType.String,
                title: "Idle Hint",
                defaultValue: TYPE.hint,
            },
            cta: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: TYPE.cta,
            },
        },
    },
    card: {
        type: ControlType.Object,
        title: "Cards",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 40,
                max: 260,
                step: 1,
                unit: "px",
                defaultValue: CARD.size,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: CARD.radius,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: CARD.shadow,
            },
            blank: {
                type: ControlType.Color,
                title: "Placeholder",
                defaultValue: CARD.blank,
            },
        },
    },
    box: {
        type: ControlType.Object,
        title: "Click",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "On Click",
                options: ["Lightbox", "Link", "None"],
                optionTitles: ["Lightbox", "Link", "None"],
                displaySegmentedControl: true,
                defaultValue: BOX.mode,
            },
            fill: {
                type: ControlType.Enum,
                title: "Lightbox",
                options: ["Component", "Screen"],
                optionTitles: ["In Frame", "Full Screen"],
                displaySegmentedControl: true,
                defaultValue: BOX.fill,
                hidden: (o: any) => o.mode !== "Lightbox",
            },
            veil: {
                type: ControlType.Color,
                title: "Veil",
                defaultValue: BOX.veil,
                hidden: (o: any) => o.mode !== "Lightbox",
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: BOX.blur,
                hidden: (o: any) => o.mode !== "Lightbox",
            },
            ink: {
                type: ControlType.Color,
                title: "Controls",
                defaultValue: BOX.ink,
                hidden: (o: any) => o.mode !== "Lightbox",
            },
            counter: {
                type: ControlType.Boolean,
                title: "Counter",
                defaultValue: BOX.counter,
                hidden: (o: any) => o.mode !== "Lightbox",
            },
            arrows: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: BOX.arrows,
                hidden: (o: any) => o.mode !== "Lightbox",
            },
            wrap: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: BOX.wrap,
                hidden: (o: any) => o.mode !== "Lightbox",
            },
        },
    },
    backdrop: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F2F1EC",
    },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: true },
})
