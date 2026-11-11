/**
 * OrbitType3D
 *
 * Review notes
 * 1. Static renderer — the exported entry calls useIsStaticRenderer() and
 *    nothing else, then returns <OrbitStill /> on the canvas and during
 *    export. That branch is plain divs held at the rest pose: no animation
 *    loop, listeners, observers, timers, will-change or font loading.
 * 2. Offscreen work — <OrbitLive /> owns a single requestAnimationFrame
 *    loop. It starts parked, runs only while the section intersects the
 *    viewport and the tab is visible, re-checks both on every frame, puts
 *    itself to sleep as soon as nothing is moving, and is cancelled on
 *    unmount. prefers-reduced-motion switches off spin, easing, throw and
 *    pointer tilt.
 */
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


type Axis = "vertical" | "horizontal"
type DriveMode = "spin" | "scroll" | "both"
type BackMode = "hide" | "mirror" | "read"
type Heading = "forward" | "reverse"
type Shape =
    | "cylinder"
    | "sphere"
    | "cone"
    | "hourglass"
    | "barrel"
    | "prism"
    | "pyramid"
    | "oval"
    | "wave"
type Profile = "straight" | "sphere" | "cone" | "hourglass" | "barrel"
type SectionKind = "round" | "polygon" | "oval" | "wave"

const SHAPES: readonly Shape[] = [
    "cylinder",
    "sphere",
    "cone",
    "hourglass",
    "barrel",
    "prism",
    "pyramid",
    "oval",
    "wave",
]

const FORMS: Record<Shape, [Profile, SectionKind]> = {
    cylinder: ["straight", "round"],
    sphere: ["sphere", "round"],
    cone: ["cone", "round"],
    hourglass: ["hourglass", "round"],
    barrel: ["barrel", "round"],
    prism: ["straight", "polygon"],
    pyramid: ["cone", "polygon"],
    oval: ["straight", "oval"],
    wave: ["straight", "wave"],
}

const SHAPE_TITLES: Record<Shape, string> = {
    cylinder: "Cylinder",
    sphere: "Sphere",
    cone: "Cone",
    hourglass: "Hourglass",
    barrel: "Barrel",
    prism: "Prism",
    pyramid: "Pyramid",
    oval: "Oval",
    wave: "Wave",
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
    return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`
}

function wavyPath(): string {
    const pts: string[] = []
    for (let i = 0; i <= 96; i++) {
        const t = (i / 96) * Math.PI * 2
        const r = 5 + 0.9 * Math.cos(6 * t)
        pts.push(
            `${(8 + r * Math.sin(t)).toFixed(2)} ${(8 - r * Math.cos(t)).toFixed(2)}`
        )
    }
    return `M${pts.join("L")}Z`
}

const SHAPE_ICONS: Record<Shape, string> = {
    cylinder: ellipsePath(8, 4, 5, 1.8) + "M3 4v8M13 4v8M3 12a5 1.8 0 0 0 10 0",
    sphere: ellipsePath(8, 8, 5.5, 5.5) + ellipsePath(8, 8, 5.5, 2),
    cone: "M8 2.5 3 12M8 2.5 13 12" + ellipsePath(8, 12, 5, 1.6),
    hourglass: "M4 2.5h8L8.6 8 12 13.5H4L7.4 8z",
    barrel: "M5 2.5h6c1.8 1.6 2.4 3.6 2.4 5.5s-.6 3.9-2.4 5.5H5C3.2 11.9 2.6 9.9 2.6 8S3.2 4.1 5 2.5zM2.8 6h10.4M2.8 10h10.4",
    prism: "M3 5l5-2.5L13 5v6l-5 2.5L3 11zM3 5l5 2.5L13 5M8 7.5v6",
    pyramid: "M8 2.5 2.5 12 8 13.5 13.5 12zM8 2.5v11",
    oval: ellipsePath(8, 8, 6, 3.6),
    wave: wavyPath(),
}

const AXES: readonly Axis[] = ["vertical", "horizontal"]

const AXIS_TITLES: Record<Axis, string> = {
    vertical: "Vertical",
    horizontal: "Horizontal",
}

const AXIS_ICONS: Record<Axis, string> = {
    vertical:
        "M8 1.5v13M6 3.5 8 1.5l2 2M6 12.5l2 2 2-2" +
        ellipsePath(8, 8, 5.5, 1.9),
    horizontal:
        "M1.5 8h13M3.5 6 1.5 8l2 2M12.5 6l2 2-2 2" +
        ellipsePath(8, 8, 1.9, 5.5),
}

type ButtonLabels = "both" | "icon" | "text"

type Side = "top" | "bottom"
type BarGroup = "shape" | "axis"
type BarSpot = { group: BarGroup; side: Side; inset: number }

type SwitcherInput = {
    show: boolean
    shapeButtons: boolean
    axisButtons: boolean
    labels: ButtonLabels
    shapeSide: Side
    axisSide: Side
    offset: number
    fill: string
    stroke: string
    ink: string
    activeFill: string
    activeInk: string
    morph: number
}

const SWITCHER: SwitcherInput = {
    show: true,
    shapeButtons: true,
    axisButtons: true,
    labels: "both",
    shapeSide: "top",
    axisSide: "top",
    offset: 24,
    fill: "rgba(255, 255, 255, 0.06)",
    stroke: "rgba(255, 255, 255, 0.12)",
    ink: "#F2EFE8",
    activeFill: "#F2EFE8",
    activeInk: "#0C0C0F",
    morph: 800,
}

const DEFAULT_BUTTON_FONT: React.CSSProperties = {
    fontSize: 13,
    letterSpacing: "0.01em",
    lineHeight: "1",
}

const BAR_HEIGHT = 44

const SHAPED_BY_AMOUNT: readonly Shape[] = [
    "cone",
    "hourglass",
    "barrel",
    "pyramid",
    "oval",
    "wave",
]

type BandInput = {
    text?: string
    tint?: string
    counter?: boolean
}

type CylinderInput = {
    radius: number
    spacing: number
    tracking: number
    separator: string
    wrap: boolean
    camera: number
    tilt: number
    twist: number
}

type MotionInput = {
    mode: DriveMode
    speed: number
    direction: Heading
    wheel: boolean
    wheelGain: number
    lockPage: boolean
    turns: number
    runway: number
    glide: number
    drag: boolean
    throwing: number
    sway: number
}

type BackInput = {
    mode: BackMode
    tint: string
    fade: number
}

type OrbitType3DProps = {
    bands: BandInput[]
    axis: Axis
    shape: Shape
    sides: number
    petals: number
    amount: number
    spine: boolean
    font: React.CSSProperties
    uppercase: boolean
    fit: boolean
    cylinder: CylinderInput
    motion: MotionInput
    back: BackInput
    switcher: SwitcherInput
    buttonFont: React.CSSProperties
    background: string
    style?: React.CSSProperties
}

const INK = "#F2EFE8"

const DEFAULT_BANDS: BandInput[] = [
    { text: "Shape the space", tint: INK, counter: false },
    { text: "Motion with intent", tint: "#FF6B3D", counter: true },
    { text: "Detail at every turn", tint: INK, counter: false },
]

const DEFAULT_FONT: React.CSSProperties = {
    fontSize: 96,
    letterSpacing: "-0.01em",
    lineHeight: "1",
}

const CYLINDER: CylinderInput = {
    radius: 3.4,
    spacing: 1.15,
    tracking: 0.04,
    separator: " • ",
    wrap: true,
    camera: 14,
    tilt: 12,
    twist: 0,
}

const MOTION: MotionInput = {
    mode: "spin",
    speed: 10,
    direction: "forward",
    wheel: true,
    wheelGain: 0.3,
    lockPage: true,
    turns: 1,
    runway: 3,
    glide: 0.55,
    drag: true,
    throwing: 0.6,
    sway: 6,
}

const BACK: BackInput = {
    mode: "mirror",
    tint: INK,
    fade: 0.22,
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const TAU = Math.PI * 2
const TO_DEG = 180 / Math.PI

type Section = {
    kind: SectionKind
    sides: number
    amount: number
    petals: number
    total: number
    theta: Float64Array
}

type Ring = { o: number; k: number; lean: number }

const SECTION_SAMPLES = 720
const sectionCache = new Map<string, Section>()

function unitRadius(
    kind: SectionKind,
    t: number,
    sides: number,
    amount: number,
    petals: number
): number {
    if (kind === "polygon") {
        const seg = TAU / sides
        const local = ((((t + seg / 2) % seg) + seg) % seg) - seg / 2
        return Math.cos(Math.PI / sides) / Math.cos(local)
    }
    if (kind === "oval") {
        const b = 1 - 0.55 * amount
        const s = Math.sin(t)
        const c = Math.cos(t)
        return b / Math.sqrt(b * b * s * s + c * c)
    }
    if (kind === "wave") {
        const w = 0.22 * amount
        return (1 + w * Math.cos(petals * t)) / (1 + w)
    }
    return 1
}

function buildSection(
    kind: SectionKind,
    sides: number,
    amount: number,
    petals: number
): Section {
    const key = `${kind}|${sides}|${amount.toFixed(3)}|${petals}`
    const hit = sectionCache.get(key)
    if (hit) return hit

    const fine = 2048
    const run = new Float64Array(fine + 1)
    let px = 0
    let pz = unitRadius(kind, 0, sides, amount, petals)
    for (let i = 1; i <= fine; i++) {
        const t = (i / fine) * TAU
        const r = unitRadius(kind, t, sides, amount, petals)
        const x = r * Math.sin(t)
        const z = r * Math.cos(t)
        run[i] = run[i - 1] + Math.hypot(x - px, z - pz)
        px = x
        pz = z
    }
    const total = run[fine] || TAU

    const theta = new Float64Array(SECTION_SAMPLES + 1)
    let j = 0
    for (let m = 0; m <= SECTION_SAMPLES; m++) {
        const target = (m / SECTION_SAMPLES) * total
        while (j < fine - 1 && run[j + 1] < target) j++
        const span = run[j + 1] - run[j] || 1
        const frac = Math.min(1, Math.max(0, (target - run[j]) / span))
        theta[m] = ((j + frac) / fine) * TAU
    }

    const made: Section = { kind, sides, amount, petals, total, theta }
    if (sectionCache.size > 40) sectionCache.clear()
    sectionCache.set(key, made)
    return made
}

function sectionPoint(sec: Section, u: number) {
    const f = (((u % 1) + 1) % 1) * SECTION_SAMPLES
    const i = Math.min(SECTION_SAMPLES - 1, Math.floor(f))
    const t = sec.theta[i] + (sec.theta[i + 1] - sec.theta[i]) * (f - i)
    const r = unitRadius(sec.kind, t, sec.sides, sec.amount, sec.petals)
    const h = 0.0015
    const dr =
        (unitRadius(sec.kind, t + h, sec.sides, sec.amount, sec.petals) -
            unitRadius(sec.kind, t - h, sec.sides, sec.amount, sec.petals)) /
        (2 * h)
    return { theta: t, rho: r, off: Math.atan2(dr, r) }
}

function profileScale(profile: Profile, s: number, amount: number): number {
    if (profile === "cone") return 1 - amount * 0.85 * ((1 - s) / 2)
    if (profile === "hourglass") return 1 - amount * 0.7 * (1 - s * s)
    if (profile === "barrel") return 1 - amount * 0.6 * s * s
    return 1
}

function buildRings(
    profile: Profile,
    count: number,
    spacing: number,
    radius: number,
    amount: number,
    axisSign: number
): Ring[] {
    const half = (count - 1) / 2
    const reach =
        count > 1
            ? Math.min((78 * Math.PI) / 180, (half * spacing * 1.6) / radius)
            : 0
    const at = (s: number) => {
        if (profile === "sphere") {
            const lat = s * reach
            return { o: radius * Math.sin(lat), k: Math.cos(lat) }
        }
        return { o: s * half * spacing, k: profileScale(profile, s, amount) }
    }
    const rings: Ring[] = []
    for (let i = 0; i < count; i++) {
        const s = count > 1 ? (i / (count - 1)) * 2 - 1 : 0
        const here = at(s)
        const a = at(s - 0.01)
        const b = at(s + 0.01)
        const dO = (b.o - a.o) * axisSign
        const dR = (b.k - a.k) * radius
        const lean = Math.abs(dO) > 1e-6 ? Math.atan(dR / dO) * TO_DEG : 0
        rings.push({
            o: here.o * axisSign,
            k: Math.max(0.12, here.k),
            lean,
        })
    }
    return rings
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

type Resolved = {
    bands: { text: string; tint: string; counter: boolean }[]
    shape: Shape
    switcher: SwitcherInput
    buttonFace: React.CSSProperties
    spots: BarSpot[]
    reserveTop: number
    reserveBottom: number
    axis: Axis
    stacked: boolean
    section: Section
    rings: Ring[]
    face: React.CSSProperties
    fontKey: string
    size: string
    tracking: number
    drum: CylinderInput
    drive: MotionInput
    back: BackInput
    background: string
    label: string
    planKey: string
    style?: React.CSSProperties
}

function num(v: unknown, lo: number, hi: number, fb: number): number {
    const n = typeof v === "number" && Number.isFinite(v) ? v : fb
    return Math.min(hi, Math.max(lo, n))
}

function pick<T extends string>(v: unknown, allowed: readonly T[], fb: T): T {
    return allowed.includes(v as T) ? (v as T) : fb
}

function pxOf(v: unknown, fb: number): number {
    if (typeof v === "number" && Number.isFinite(v)) return v
    if (typeof v === "string") {
        const n = parseFloat(v)
        if (Number.isFinite(n)) return /r?em\s*$/.test(v) ? n * 16 : n
    }
    return fb
}

function emOf(v: unknown, cap: number): number {
    if (typeof v === "number" && Number.isFinite(v)) return v / cap
    if (typeof v === "string") {
        const n = parseFloat(v)
        if (!Number.isFinite(n)) return 0
        if (/em\s*$/.test(v)) return n
        if (/%\s*$/.test(v)) return n / 100
        return n / cap
    }
    return 0
}

function fontLine(font: React.CSSProperties): string {
    const family =
        typeof font.fontFamily === "string" && font.fontFamily.trim()
            ? font.fontFamily
            : "sans-serif"
    const weight = font.fontWeight ?? 400
    const slant = font.fontStyle ?? "normal"
    return `${slant} ${weight} 100px ${family}`
}

function lensSize(
    cap: number,
    fit: boolean,
    axis: Axis,
    drum: CylinderInput,
    rings: Ring[]
): string {
    if (!fit) return `${cap}px`
    let lo = 0
    let hi = 0
    let maxK = 0
    for (const ring of rings) {
        lo = Math.min(lo, ring.o)
        hi = Math.max(hi, ring.o)
        maxK = Math.max(maxK, ring.k)
    }
    const reach = drum.radius * Math.max(0.2, maxK)
    const lean = (Math.abs(drum.tilt) * Math.PI) / 180
    const swell = drum.camera / Math.max(0.5, drum.camera - reach)
    const round = reach * 2.08 + 0.9
    const long =
        (hi - lo + 1.15) * swell * Math.cos(lean) + reach * 2 * Math.sin(lean)
    const wide = axis === "vertical" ? round : long
    const tall = axis === "vertical" ? long : round
    return `min(${cap}px, ${(92 / wide).toFixed(3)}cqw, ${(92 / tall).toFixed(3)}cqh)`
}

function placeBars(sw: SwitcherInput) {
    const spots: BarSpot[] = []
    const stack = { top: 0, bottom: 0 }
    const wanted: Array<[BarGroup, boolean, Side]> = [
        ["axis", sw.axisButtons, sw.axisSide],
        ["shape", sw.shapeButtons, sw.shapeSide],
    ]
    if (sw.show) {
        for (const [group, on, side] of wanted) {
            if (!on) continue
            spots.push({
                group,
                side,
                inset: sw.offset + stack[side] * (BAR_HEIGHT + 8),
            })
            stack[side]++
        }
    }
    const room = (n: number) => (n > 0 ? sw.offset + n * (BAR_HEIGHT + 8) : 0)
    return {
        spots,
        reserveTop: room(stack.top),
        reserveBottom: room(stack.bottom),
    }
}

function resolve(props: Partial<OrbitType3DProps>): Resolved {
    const rawDrum = { ...CYLINDER, ...(props.cylinder ?? {}) }
    const radius = num(rawDrum.radius, 1.2, 12, CYLINDER.radius)
    const drum: CylinderInput = {
        radius,
        spacing: num(rawDrum.spacing, 0.4, 6, CYLINDER.spacing),
        tracking: num(rawDrum.tracking, -0.3, 1, CYLINDER.tracking),
        separator:
            typeof rawDrum.separator === "string" ? rawDrum.separator : " • ",
        wrap: rawDrum.wrap !== false,
        camera: Math.max(
            radius * 1.6,
            num(rawDrum.camera, 4, 60, CYLINDER.camera)
        ),
        tilt: num(rawDrum.tilt, -60, 60, CYLINDER.tilt),
        twist: num(rawDrum.twist, -180, 180, 0),
    }

    const rawDrive = { ...MOTION, ...(props.motion ?? {}) }
    const drive: MotionInput = {
        mode: pick(
            rawDrive.mode as string,
            ["spin", "scroll", "both"] as const,
            "spin"
        ),
        speed: num(rawDrive.speed, 0, 360, MOTION.speed),
        direction: pick(
            rawDrive.direction,
            ["forward", "reverse"] as const,
            "forward"
        ),
        wheel: rawDrive.wheel !== false,
        wheelGain: num(rawDrive.wheelGain, 0.02, 2, MOTION.wheelGain),
        lockPage: rawDrive.lockPage !== false,
        turns: num(rawDrive.turns, 0, 12, MOTION.turns),
        runway: num(rawDrive.runway, 1, 12, MOTION.runway),
        glide: num(rawDrive.glide, 0, 1, MOTION.glide),
        drag: rawDrive.drag !== false,
        throwing: num(rawDrive.throwing, 0, 1, MOTION.throwing),
        sway: num(rawDrive.sway, 0, 30, MOTION.sway),
    }

    const rawBack = { ...BACK, ...(props.back ?? {}) }
    const back: BackInput = {
        mode: pick(rawBack.mode, ["hide", "mirror", "read"] as const, "mirror"),
        tint: rawBack.tint || INK,
        fade: num(rawBack.fade, 0, 1, BACK.fade),
    }

    const upper = props.uppercase ?? true
    const shape = (s: string) => (upper ? s.toUpperCase() : s)
    drum.separator = shape(drum.separator)

    const source = Array.isArray(props.bands) ? props.bands : DEFAULT_BANDS
    const cleaned = source
        .map((b) => ({
            text: typeof b?.text === "string" ? b.text.trim() : "",
            tint: b?.tint || INK,
            counter: !!b?.counter,
        }))
        .filter((b) => b.text.length > 0)
    const bands = (
        cleaned.length > 0
            ? cleaned
            : DEFAULT_BANDS.map((b) => ({
                  text: b.text as string,
                  tint: b.tint as string,
                  counter: !!b.counter,
              }))
    ).map((b) => ({ ...b, text: shape(b.text) }))

    const axis = pick(
        props.axis,
        ["vertical", "horizontal"] as const,
        "vertical"
    )
    const stacked = axis === "horizontal" && props.spine === false

    const form = pick(props.shape, SHAPES, "cylinder")
    const [profile, kind] = FORMS[form]
    const sides = Math.round(num(props.sides, 3, 12, 6))
    const petals = Math.round(num(props.petals, 2, 16, 6))
    const amount = num(props.amount, 0, 1, 0.6)
    const section = buildSection(kind, sides, amount, petals)
    const rings = buildRings(
        profile,
        bands.length,
        drum.spacing,
        drum.radius,
        amount,
        1
    )

    const font = { ...DEFAULT_FONT, ...(props.font ?? {}) }
    const cap = pxOf(font.fontSize, 96)
    const tracking = drum.tracking + emOf(font.letterSpacing, cap)
    const fontKey = fontLine(font)

    const face: React.CSSProperties = {
        ...font,
        fontSize: "1em",
        letterSpacing: 0,
        lineHeight: 1,
    }

    const rawSwitch = { ...SWITCHER, ...(props.switcher ?? {}) }
    const shapeButtons = rawSwitch.shapeButtons !== false
    const axisButtons = rawSwitch.axisButtons !== false
    const switcher: SwitcherInput = {
        show: rawSwitch.show !== false && (shapeButtons || axisButtons),
        shapeButtons,
        axisButtons,
        labels: pick(
            rawSwitch.labels,
            ["both", "icon", "text"] as const,
            "both"
        ),
        shapeSide: pick(rawSwitch.shapeSide, ["top", "bottom"] as const, "top"),
        axisSide: pick(rawSwitch.axisSide, ["top", "bottom"] as const, "top"),
        offset: num(rawSwitch.offset, 0, 240, SWITCHER.offset),
        fill: rawSwitch.fill || SWITCHER.fill,
        stroke: rawSwitch.stroke || SWITCHER.stroke,
        ink: rawSwitch.ink || SWITCHER.ink,
        activeFill: rawSwitch.activeFill || SWITCHER.activeFill,
        activeInk: rawSwitch.activeInk || SWITCHER.activeInk,
        morph: num(rawSwitch.morph, 0, 3000, SWITCHER.morph),
    }

    return {
        bands,
        shape: form,
        switcher,
        buttonFace: {
            ...DEFAULT_BUTTON_FONT,
            ...(props.buttonFont ?? {}),
        },
        ...placeBars(switcher),
        axis,
        stacked,
        section,
        rings,
        face,
        fontKey,
        size: lensSize(cap, props.fit ?? true, axis, drum, rings),
        tracking,
        drum,
        drive,
        back,
        background: props.background ?? "#0C0C0F",
        label: bands.map((b) => b.text).join(" / "),
        planKey: [
            fontKey,
            axis,
            stacked ? 1 : 0,
            form,
            sides,
            petals,
            amount.toFixed(3),
            drum.radius,
            drum.spacing,
            drum.wrap ? 1 : 0,
            drum.separator,
            tracking.toFixed(4),
            bands.map((b) => b.text).join("\u0001"),
        ].join("|"),
        style: props.style,
    }
}

/* ------------------------------------------------------------------ */
/* Glyph planning                                                      */
/* ------------------------------------------------------------------ */

type Glyph = { ch: string; pose: string }

let meterPad: CanvasRenderingContext2D | null | undefined

function meter(): CanvasRenderingContext2D | null {
    if (meterPad !== undefined) return meterPad
    if (typeof document === "undefined") return null
    try {
        meterPad = document.createElement("canvas").getContext("2d")
    } catch {
        meterPad = null
    }
    return meterPad
}

function advances(
    chars: string[],
    fontKey: string,
    tracking: number,
    stacked: boolean
): number[] {
    if (stacked) {
        return chars.map((c) => (c.trim() ? 0.96 : 0.5) + tracking)
    }
    const pad = meter()
    if (pad) pad.font = fontKey
    return chars.map((c) => {
        const raw = pad ? pad.measureText(c).width / 100 : c.trim() ? 0.6 : 0.28
        return Math.max(0.05, raw + tracking)
    })
}

function glyphPose(cfg: Resolved, ring: Ring, u: number): string {
    const p = sectionPoint(cfg.section, u)
    const rho = cfg.drum.radius * ring.k * p.rho
    return (
        `rotateY(${(p.theta * TO_DEG).toFixed(3)}deg) ` +
        `translateZ(${rho.toFixed(4)}em) ` +
        `rotateY(${(-p.off * TO_DEG).toFixed(2)}deg) ` +
        `rotateX(${ring.lean.toFixed(2)}deg)` +
        (cfg.stacked ? " rotateZ(90deg)" : "")
    )
}

function planBand(text: string, cfg: Resolved, index: number): Glyph[] {
    const ring = cfg.rings[index] ?? { o: 0, k: 1, lean: 0 }
    const perimeter = cfg.section.total * cfg.drum.radius * ring.k
    const out: Glyph[] = []

    if (cfg.drum.wrap) {
        const unit = Array.from(text + cfg.drum.separator)
        const step = advances(unit, cfg.fontKey, cfg.tracking, cfg.stacked)
        const unitLen = step.reduce((a, b) => a + b, 0) || 1
        const ceiling = Math.max(1, Math.floor(240 / Math.max(1, unit.length)))
        const reps = Math.min(
            ceiling,
            Math.max(1, Math.round(perimeter / unitLen))
        )
        const whole = unitLen * reps
        let run = 0
        for (let r = 0; r < reps; r++) {
            for (let i = 0; i < unit.length; i++) {
                const w = step[i]
                if (unit[i].trim()) {
                    out.push({
                        ch: unit[i],
                        pose: glyphPose(cfg, ring, (run + w / 2) / whole),
                    })
                }
                run += w
            }
        }
        return out
    }

    const chars = Array.from(text)
    const step = advances(chars, cfg.fontKey, cfg.tracking, cfg.stacked)
    const len = step.reduce((a, b) => a + b, 0)
    let run = -len / 2
    for (let i = 0; i < chars.length; i++) {
        const w = step[i]
        if (chars[i].trim()) {
            out.push({
                ch: chars[i],
                pose: glyphPose(cfg, ring, (run + w / 2) / perimeter),
            })
        }
        run += w
    }
    return out
}

function planAll(cfg: Resolved): Glyph[][] {
    return cfg.bands.map((b, i) => planBand(b.text, cfg, i))
}

/* ------------------------------------------------------------------ */
/* Pose strings                                                        */
/* ------------------------------------------------------------------ */

function bandAngle(
    base: number,
    i: number,
    counter: boolean,
    twist: number
): number {
    return (counter ? -base : base) + twist * i
}

function bandPose(offset: number, angle: number): string {
    return `translate3d(0, ${offset.toFixed(3)}em, 0) rotateY(${angle.toFixed(3)}deg)`
}

function rigPose(axis: Axis, tilt: number, swayH: number, swayV: number) {
    return axis === "vertical"
        ? `rotateX(${(-tilt - swayV).toFixed(3)}deg) rotateY(${swayH.toFixed(3)}deg)`
        : `rotateY(${(tilt + swayH).toFixed(3)}deg) rotateX(${(-swayV).toFixed(3)}deg)`
}

function turnPose(axis: Axis): string {
    return axis === "horizontal" ? "rotateZ(-90deg)" : "rotateZ(0deg)"
}

function backPose(mode: BackMode, stacked: boolean): string {
    if (mode === "mirror") return "translate(-50%, -50%) scale3d(1, 1, -1)"
    return `translate(-50%, -50%) ${stacked ? "rotateX(180deg)" : "rotateY(180deg)"}`
}

const POINT: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    transformStyle: "preserve-3d",
}

const FACE: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    display: "block",
    whiteSpace: "pre",
    userSelect: "none",
    pointerEvents: "none",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
}

const SIZE_CONTAINER = { containerType: "size" } as React.CSSProperties

type Chip = {
    id: string
    d: string
    title: string
    on: boolean
}

function chipList(cfg: Resolved, group: BarGroup): Chip[] {
    if (group === "shape") {
        return SHAPES.map((s) => ({
            id: s,
            d: SHAPE_ICONS[s],
            title: SHAPE_TITLES[s],
            on: s === cfg.shape,
        }))
    }
    return AXES.map((a) => ({
        id: a,
        d: AXIS_ICONS[a],
        title: AXIS_TITLES[a],
        on: a === cfg.axis,
    }))
}

function pinned(mode: DriveMode): boolean {
    return mode === "scroll" || mode === "both"
}

/* ------------------------------------------------------------------ */
/* Static branch                                                       */
/* ------------------------------------------------------------------ */

function OrbitStill({ cfg }: { cfg: Resolved }) {
    const plans = planAll(cfg)
    const scrolls = pinned(cfg.drive.mode)

    return (
        <div
            style={{
                ...cfg.style,
                position: "relative",
                width: "100%",
                height: scrolls ? `${cfg.drive.runway * 100}vh` : "100%",
                background: cfg.background,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: scrolls ? "100vh" : "100%",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        ...SIZE_CONTAINER,
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: cfg.reserveTop,
                        bottom: cfg.reserveBottom,
                    }}
                >
                    <div
                        role="img"
                        aria-label={cfg.label}
                        style={{
                            position: "absolute",
                            inset: 0,
                            fontSize: cfg.size,
                            perspective: `${cfg.drum.camera}em`,
                            perspectiveOrigin: "50% 50%",
                        }}
                    >
                        <div
                            style={{
                                ...POINT,
                                left: "50%",
                                top: "50%",
                                transform: rigPose(
                                    cfg.axis,
                                    cfg.drum.tilt,
                                    0,
                                    0
                                ),
                            }}
                        >
                            <div
                                style={{
                                    ...POINT,
                                    transform: turnPose(cfg.axis),
                                }}
                            >
                                {cfg.bands.map((band, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            ...POINT,
                                            transform: bandPose(
                                                cfg.rings[i]?.o ?? 0,
                                                bandAngle(
                                                    0,
                                                    i,
                                                    band.counter,
                                                    cfg.drum.twist
                                                )
                                            ),
                                        }}
                                    >
                                        {plans[i].map((g, k) => (
                                            <div
                                                key={k}
                                                style={{
                                                    ...POINT,
                                                    transform: g.pose,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        ...cfg.face,
                                                        ...FACE,
                                                        color: band.tint,
                                                        transform:
                                                            "translate(-50%, -50%)",
                                                    }}
                                                >
                                                    {g.ch}
                                                </span>
                                                {cfg.back.mode !== "hide" ? (
                                                    <span
                                                        style={{
                                                            ...cfg.face,
                                                            ...FACE,
                                                            color: cfg.back
                                                                .tint,
                                                            opacity:
                                                                cfg.back.fade,
                                                            transform: backPose(
                                                                cfg.back.mode,
                                                                cfg.stacked
                                                            ),
                                                        }}
                                                    >
                                                        {g.ch}
                                                    </span>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {cfg.spots.map((spot) => (
                    <div
                        key={spot.group}
                        style={{
                            position: "absolute",
                            left: "50%",
                            [spot.side]: spot.inset,
                            transform: "translateX(-50%)",
                            zIndex: 2,
                            maxWidth: "calc(100% - 24px)",
                            height: BAR_HEIGHT,
                            boxSizing: "border-box",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            padding: 4,
                            borderRadius: 999,
                            background: cfg.switcher.fill,
                            border: `1px solid ${cfg.switcher.stroke}`,
                            overflow: "hidden",
                        }}
                    >
                        {chipList(cfg, spot.group).map((chip) => (
                            <div
                                key={chip.id}
                                style={{
                                    ...cfg.buttonFace,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 7,
                                    height: BAR_HEIGHT - 10,
                                    padding:
                                        cfg.switcher.labels === "icon"
                                            ? "0 10px"
                                            : "0 14px",
                                    borderRadius: 999,
                                    whiteSpace: "nowrap",
                                    flex: "0 0 auto",
                                    background: chip.on
                                        ? cfg.switcher.activeFill
                                        : "transparent",
                                    color: chip.on
                                        ? cfg.switcher.activeInk
                                        : cfg.switcher.ink,
                                    opacity: chip.on ? 1 : 0.62,
                                }}
                            >
                                {cfg.switcher.labels !== "text" ? (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.4}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                        aria-hidden
                                    >
                                        <path d={chip.d} />
                                    </svg>
                                ) : null}
                                {cfg.switcher.labels !== "icon" ? (
                                    <span>{chip.title}</span>
                                ) : null}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Live branch                                                         */
/* ------------------------------------------------------------------ */

function wrapTurn(deg: number): number {
    return ((deg % 360) + 360) % 360
}

class DrumEngine {
    cfg!: Resolved

    shell: HTMLDivElement | null = null
    stage: HTMLDivElement | null = null
    lens: HTMLDivElement | null = null
    rig: HTMLDivElement | null = null
    bands: Array<HTMLDivElement | null> = []

    inView = false
    tabOn = true
    calm = false

    spin = 0
    fling = 0
    vel = 0
    debt = 0
    scrollAt: number | null = null
    swayH = 0
    swayV = 0
    aimH = 0
    aimV = 0

    held = false
    pointer = -1
    lastPos = 0
    lastStamp = 0
    degPerPx = 0.1

    raf = 0
    prev = 0
    ringO: number[] = []

    allowed(): boolean {
        return this.inView && this.tabOn
    }

    wake = () => {
        if (this.raf || !this.allowed()) return
        if (typeof requestAnimationFrame === "undefined") return
        this.raf = requestAnimationFrame(this.step)
    }

    park = () => {
        if (this.raf && typeof cancelAnimationFrame !== "undefined") {
            cancelAnimationFrame(this.raf)
        }
        this.raf = 0
        this.prev = 0
        this.held = false
        this.pointer = -1
        this.vel = 0
        this.debt = 0
        this.scrollAt = null
        this.aimH = 0
        this.aimV = 0
    }

    readScroll(): number {
        const el = this.shell
        if (!el || typeof window === "undefined") return 0
        const box = el.getBoundingClientRect()
        const span = box.height - window.innerHeight
        const progress =
            span > 1 ? Math.min(1, Math.max(0, -box.top / span)) : 0
        const sign = this.cfg.drive.direction === "forward" ? -1 : 1
        return progress * this.cfg.drive.turns * 360 * sign
    }

    paint = () => {
        const c = this.cfg
        if (!c) return
        const base = this.spin + this.fling + (this.scrollAt ?? 0)
        const count = c.bands.length
        for (let i = 0; i < count; i++) {
            const el = this.bands[i]
            if (!el) continue
            el.style.transform = bandPose(
                this.ringO[i] ?? c.rings[i]?.o ?? 0,
                bandAngle(base, i, c.bands[i].counter, c.drum.twist)
            )
        }
        if (this.rig) {
            this.rig.style.transform = rigPose(
                c.axis,
                c.drum.tilt,
                this.swayH,
                this.swayV
            )
        }
    }

    step = (now: number) => {
        this.raf = 0
        if (!this.allowed()) {
            this.park()
            return
        }
        const d = this.cfg.drive
        const dt = this.prev
            ? Math.min(0.05, Math.max(0, (now - this.prev) / 1000))
            : 1 / 60
        this.prev = now
        let busy = false

        const sign = d.direction === "forward" ? -1 : 1
        if (d.mode !== "scroll" && !this.calm && d.speed > 0 && !this.held) {
            this.spin = wrapTurn(this.spin + d.speed * sign * dt)
            busy = true
        }

        if (!this.held) {
            if (this.calm || d.throwing <= 0) this.vel = 0
            if (Math.abs(this.vel) > 0.4) {
                this.fling = wrapTurn(this.fling + this.vel * dt)
                const decay = 0.9 + (1 - d.throwing) * 7
                this.vel *= Math.exp(-decay * dt)
                busy = true
            } else {
                this.vel = 0
            }
        }

        if (this.debt !== 0) {
            if (this.calm || Math.abs(this.debt) < 0.01) {
                this.fling = wrapTurn(this.fling + this.debt)
                this.debt = 0
            } else {
                const take = this.debt * (1 - Math.exp(-dt * 9))
                this.fling = wrapTurn(this.fling + take)
                this.debt -= take
                busy = true
            }
        }

        if (pinned(d.mode)) {
            const aim = this.readScroll()
            if (this.scrollAt === null || this.calm || d.glide <= 0) {
                this.scrollAt = aim
            } else {
                const gap = aim - this.scrollAt
                if (Math.abs(gap) < 0.02) {
                    this.scrollAt = aim
                } else {
                    const rate = 2.5 + (1 - d.glide) * 28
                    this.scrollAt += gap * (1 - Math.exp(-dt * rate))
                    busy = true
                }
            }
        } else {
            this.scrollAt = 0
        }

        const rings = this.cfg.rings
        this.ringO.length = rings.length
        const morph = this.cfg.switcher.morph
        const pull = morph > 0 ? 1 - Math.exp((-dt * 4600) / morph) : 1
        for (let i = 0; i < rings.length; i++) {
            const goal = rings[i].o
            const cur = this.ringO[i]
            if (cur === undefined || this.calm || pull >= 1) {
                this.ringO[i] = goal
            } else if (Math.abs(goal - cur) < 0.001) {
                this.ringO[i] = goal
            } else {
                this.ringO[i] = cur + (goal - cur) * pull
                busy = true
            }
        }

        const aimH = this.calm ? 0 : this.aimH
        const aimV = this.calm ? 0 : this.aimV
        const ease = 1 - Math.exp(-dt * 5)
        if (
            Math.abs(aimH - this.swayH) > 0.01 ||
            Math.abs(aimV - this.swayV) > 0.01
        ) {
            this.swayH += (aimH - this.swayH) * ease
            this.swayV += (aimV - this.swayV) * ease
            busy = true
        } else {
            this.swayH = aimH
            this.swayV = aimV
        }

        this.paint()

        if (busy) {
            this.raf = requestAnimationFrame(this.step)
        } else {
            this.prev = 0
        }
    }

    down = (e: React.PointerEvent<HTMLDivElement>) => {
        const c = this.cfg
        if (!c.drive.drag) return
        if (c.axis !== "vertical" && e.pointerType === "touch") return
        if (e.pointerType === "mouse" && e.button !== 0) return
        this.held = true
        this.pointer = e.pointerId
        this.vel = 0
        this.debt = 0
        this.lastPos = c.axis === "vertical" ? e.clientX : e.clientY
        this.lastStamp = e.timeStamp
        let px = 16
        if (this.lens && typeof getComputedStyle !== "undefined") {
            px = parseFloat(getComputedStyle(this.lens).fontSize) || 16
        }
        this.degPerPx = 180 / (Math.PI * Math.max(8, c.drum.radius * px))
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
        if (this.stage) this.stage.style.cursor = "grabbing"
        this.wake()
    }

    move = (e: React.PointerEvent<HTMLDivElement>) => {
        const c = this.cfg
        if (e.pointerType === "mouse" && !this.calm && c.drive.sway > 0) {
            const box = e.currentTarget.getBoundingClientRect()
            if (box.width > 0 && box.height > 0) {
                const nx = ((e.clientX - box.left) / box.width) * 2 - 1
                const ny = ((e.clientY - box.top) / box.height) * 2 - 1
                this.aimH = Math.max(-1, Math.min(1, nx)) * c.drive.sway
                this.aimV = Math.max(-1, Math.min(1, ny)) * c.drive.sway
                this.wake()
            }
        }
        if (!this.held || e.pointerId !== this.pointer) return
        const pos = c.axis === "vertical" ? e.clientX : e.clientY
        const flip = c.axis === "horizontal" ? -1 : 1
        const deg = (pos - this.lastPos) * this.degPerPx * flip
        const span = Math.max(1, e.timeStamp - this.lastStamp) / 1000
        this.fling = wrapTurn(this.fling + deg)
        this.vel = this.vel * 0.5 + (deg / span) * 0.5
        this.lastPos = pos
        this.lastStamp = e.timeStamp
        this.wake()
    }

    up = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!this.held || e.pointerId !== this.pointer) return
        this.held = false
        this.pointer = -1
        if (e.timeStamp - this.lastStamp > 90) this.vel = 0
        this.vel = Math.max(-1440, Math.min(1440, this.vel))
        try {
            e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}
        if (this.stage) {
            this.stage.style.cursor = this.cfg.drive.drag ? "grab" : "default"
        }
        this.wake()
    }

    wheel = (e: WheelEvent) => {
        const d = this.cfg.drive
        if (!d.wheel || pinned(d.mode) || e.ctrlKey) return
        const unit =
            e.deltaMode === 1
                ? 16
                : e.deltaMode === 2
                  ? typeof window !== "undefined"
                      ? window.innerHeight
                      : 800
                  : 1
        const raw =
            Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
        const px = Math.max(-400, Math.min(400, raw * unit))
        if (px === 0) return
        if (d.lockPage) {
            if (e.cancelable) e.preventDefault()
            e.stopPropagation()
        }
        const sign =
            (d.direction === "forward" ? -1 : 1) *
            (this.cfg.axis === "horizontal" ? -1 : 1)
        this.vel = 0
        this.debt = Math.max(
            -720,
            Math.min(720, this.debt + px * d.wheelGain * sign)
        )
        this.wake()
    }

    leave = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== "mouse") return
        this.aimH = 0
        this.aimV = 0
        this.wake()
    }
}

const useIsoLayout =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function OrbitLive({ props }: { props: Partial<OrbitType3DProps> }) {
    const [picked, setPicked] = React.useState<Shape | null>(null)
    const [pickedAxis, setPickedAxis] = React.useState<Axis | null>(null)
    React.useEffect(() => {
        setPicked(null)
    }, [props.shape])
    React.useEffect(() => {
        setPickedAxis(null)
    }, [props.axis])
    const cfg = resolve({
        ...props,
        shape: picked ?? props.shape,
        axis: pickedAxis ?? props.axis,
    })

    const holder = React.useRef<DrumEngine | null>(null)
    if (!holder.current) holder.current = new DrumEngine()
    const eng = holder.current
    eng.cfg = cfg

    const uid = "ot" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const barRefs = React.useRef<
        Partial<Record<BarGroup, HTMLDivElement | null>>
    >({})
    const pillRef = React.useRef<HTMLDivElement | null>(null)
    const axisPillRef = React.useRef<HTMLDivElement | null>(null)
    const buttonRefs = React.useRef<
        Partial<Record<Shape, HTMLButtonElement | null>>
    >({})
    const axisRefs = React.useRef<
        Partial<Record<Axis, HTMLButtonElement | null>>
    >({})
    const pillPlaced = React.useRef(false)

    const morphMs = eng.calm ? 0 : cfg.switcher.morph
    const glide =
        morphMs > 0
            ? `transform ${morphMs}ms cubic-bezier(0.22, 0.8, 0.2, 1)`
            : undefined

    const placePill = React.useCallback(
        (animate: boolean) => {
            const pairs: Array<
                [HTMLDivElement | null, HTMLButtonElement | null | undefined]
            > = [
                [pillRef.current, buttonRefs.current[eng.cfg.shape]],
                [axisPillRef.current, axisRefs.current[eng.cfg.axis]],
            ]
            for (const [pill, button] of pairs) {
                if (!pill || !button) continue
                pill.style.transition =
                    animate && !eng.calm
                        ? "transform 460ms cubic-bezier(0.2, 0.8, 0.2, 1), width 460ms cubic-bezier(0.2, 0.8, 0.2, 1)"
                        : "none"
                pill.style.width = `${button.offsetWidth}px`
                pill.style.transform = `translateX(${button.offsetLeft}px)`
            }
        },
        [eng]
    )

    const reveal = (
        button: HTMLButtonElement | null | undefined,
        group: BarGroup
    ) => {
        const bar = barRefs.current[group]
        if (bar && button && bar.scrollWidth > bar.clientWidth) {
            const left =
                button.offsetLeft - (bar.clientWidth - button.offsetWidth) / 2
            try {
                bar.scrollTo({ left, behavior: eng.calm ? "auto" : "smooth" })
            } catch {
                bar.scrollLeft = left
            }
        }
    }

    const choose = (shape: Shape) => {
        setPicked(shape)
        reveal(buttonRefs.current[shape], "shape")
    }

    const chooseAxis = (axis: Axis) => {
        setPickedAxis(axis)
        reveal(axisRefs.current[axis], "axis")
    }

    const [inked, setInked] = React.useState(0)
    const plans = React.useMemo(() => planAll(cfg), [cfg.planKey, inked])

    const count = cfg.bands.length
    const scrolls = pinned(cfg.drive.mode)

    useIsoLayout(() => {
        eng.bands.length = count
        eng.paint()
        eng.wake()
    })

    useIsoLayout(() => {
        if (cfg.spots.length === 0) {
            pillPlaced.current = false
            return
        }
        placePill(pillPlaced.current)
        pillPlaced.current = true
    }, [
        cfg.shape,
        cfg.axis,
        cfg.switcher.show,
        cfg.switcher.shapeButtons,
        cfg.switcher.axisButtons,
        cfg.switcher.labels,
        cfg.buttonFace.fontSize,
        cfg.buttonFace.fontFamily,
        placePill,
    ])

    const spotKey = cfg.spots.map((b) => b.group).join(",")
    React.useEffect(() => {
        if (typeof ResizeObserver === "undefined") return
        const watcher = new ResizeObserver(() => placePill(false))
        for (const bar of Object.values(barRefs.current)) {
            if (bar) watcher.observe(bar)
        }
        return () => watcher.disconnect()
    }, [spotKey, placePill])

    React.useEffect(() => {
        let alive = true
        const fonts =
            typeof document !== "undefined" ? (document as any).fonts : null
        if (fonts && typeof fonts.load === "function") {
            fonts
                .load(cfg.fontKey)
                .then(() => {
                    if (alive) setInked((v) => v + 1)
                })
                .catch(() => {})
        }
        return () => {
            alive = false
        }
    }, [cfg.fontKey])

    React.useEffect(() => {
        const media =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        const onCalm = () => {
            eng.calm = !!media?.matches
            if (eng.calm) {
                eng.vel = 0
                eng.aimH = 0
                eng.aimV = 0
            }
            eng.wake()
        }
        onCalm()
        if (media) {
            if (media.addEventListener) media.addEventListener("change", onCalm)
            else (media as any).addListener?.(onCalm)
        }

        const onTab = () => {
            eng.tabOn = document.visibilityState !== "hidden"
            if (eng.tabOn) eng.wake()
            else eng.park()
        }
        onTab()
        document.addEventListener("visibilitychange", onTab)

        let watcher: IntersectionObserver | null = null
        if (typeof IntersectionObserver === "undefined" || !eng.shell) {
            eng.inView = true
            eng.wake()
        } else {
            watcher = new IntersectionObserver(
                (entries) => {
                    const hit = entries.some((entry) => entry.isIntersecting)
                    eng.inView = hit
                    if (hit) eng.wake()
                    else eng.park()
                },
                { rootMargin: "60px 0px" }
            )
            watcher.observe(eng.shell)
        }

        const onScroll = () => {
            if (pinned(eng.cfg.drive.mode)) eng.wake()
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        const pad = eng.stage
        pad?.addEventListener("wheel", eng.wheel, { passive: false })

        return () => {
            pad?.removeEventListener("wheel", eng.wheel)
            if (media) {
                if (media.removeEventListener)
                    media.removeEventListener("change", onCalm)
                else (media as any).removeListener?.(onCalm)
            }
            document.removeEventListener("visibilitychange", onTab)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
            watcher?.disconnect()
            eng.inView = false
            eng.park()
        }
    }, [eng])

    return (
        <div
            ref={(el) => {
                eng.shell = el
            }}
            style={{
                ...cfg.style,
                position: "relative",
                width: "100%",
                height: scrolls ? `${cfg.drive.runway * 100}vh` : "100%",
                background: cfg.background,
            }}
        >
            <div
                ref={(el) => {
                    eng.stage = el
                }}
                data-lenis-prevent={
                    cfg.drive.wheel && cfg.drive.lockPage && !scrolls
                        ? ""
                        : undefined
                }
                onPointerDown={eng.down}
                onPointerMove={eng.move}
                onPointerUp={eng.up}
                onPointerCancel={eng.up}
                onPointerLeave={eng.leave}
                style={{
                    position: scrolls ? "sticky" : "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: scrolls ? "100vh" : "100%",
                    overflow: "hidden",
                    cursor: cfg.drive.drag ? "grab" : "default",
                    touchAction:
                        cfg.drive.drag && cfg.axis === "vertical"
                            ? "pan-y"
                            : "auto",
                    userSelect: "none",
                }}
            >
                <div
                    style={{
                        ...SIZE_CONTAINER,
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: cfg.reserveTop,
                        bottom: cfg.reserveBottom,
                        transition:
                            morphMs > 0
                                ? `top ${morphMs}ms ease, bottom ${morphMs}ms ease`
                                : undefined,
                    }}
                >
                    <div
                        ref={(el) => {
                            eng.lens = el
                        }}
                        role="img"
                        aria-label={cfg.label}
                        style={{
                            position: "absolute",
                            inset: 0,
                            fontSize: cfg.size,
                            perspective: `${cfg.drum.camera}em`,
                            perspectiveOrigin: "50% 50%",
                            transition:
                                morphMs > 0
                                    ? `font-size ${morphMs}ms cubic-bezier(0.22, 0.8, 0.2, 1)`
                                    : undefined,
                        }}
                    >
                        <div
                            ref={(el) => {
                                eng.rig = el
                            }}
                            style={{
                                ...POINT,
                                left: "50%",
                                top: "50%",
                                transform: rigPose(
                                    cfg.axis,
                                    cfg.drum.tilt,
                                    0,
                                    0
                                ),
                                willChange: "transform",
                            }}
                        >
                            <div
                                style={{
                                    ...POINT,
                                    transform: turnPose(cfg.axis),
                                    transition: glide,
                                }}
                            >
                                {cfg.bands.map((band, i) => (
                                    <div
                                        key={i}
                                        ref={(el) => {
                                            eng.bands[i] = el
                                        }}
                                        style={{
                                            ...POINT,
                                            transform: bandPose(
                                                cfg.rings[i]?.o ?? 0,
                                                bandAngle(
                                                    0,
                                                    i,
                                                    band.counter,
                                                    cfg.drum.twist
                                                )
                                            ),
                                            willChange: "transform",
                                        }}
                                    >
                                        {(plans[i] ?? []).map((g, k) => (
                                            <div
                                                key={k}
                                                style={{
                                                    ...POINT,
                                                    transform: g.pose,
                                                    transition: glide,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        ...cfg.face,
                                                        ...FACE,
                                                        color: band.tint,
                                                        transform:
                                                            "translate(-50%, -50%)",
                                                    }}
                                                >
                                                    {g.ch}
                                                </span>
                                                {cfg.back.mode !== "hide" ? (
                                                    <span
                                                        style={{
                                                            ...cfg.face,
                                                            ...FACE,
                                                            color: cfg.back
                                                                .tint,
                                                            opacity:
                                                                cfg.back.fade,
                                                            transform: backPose(
                                                                cfg.back.mode,
                                                                cfg.stacked
                                                            ),
                                                        }}
                                                    >
                                                        {g.ch}
                                                    </span>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {cfg.spots.length > 0 ? (
                    <style>{`
.${uid}-bar{scrollbar-width:none;-ms-overflow-style:none}
.${uid}-bar::-webkit-scrollbar{display:none}
.${uid}-btn{appearance:none;-webkit-appearance:none;margin:0;outline:none;-webkit-tap-highlight-color:transparent}
.${uid}-btn[aria-checked="false"]{opacity:.62;transition:opacity 220ms ease,color 320ms ease}
.${uid}-btn[aria-checked="false"]:hover{opacity:1}
.${uid}-btn:focus-visible{box-shadow:0 0 0 2px ${cfg.switcher.activeFill};opacity:1}
.${uid}-btn:active{transform:scale(.96)}
.${uid}-btn svg{transition:transform 320ms cubic-bezier(.2,.8,.2,1)}
.${uid}-btn:hover svg{transform:rotate(-8deg) scale(1.06)}
@media (prefers-reduced-motion: reduce){.${uid}-btn,.${uid}-btn svg{transition:none!important;transform:none!important}}
`}</style>
                ) : null}
                {cfg.spots.map((spot) => {
                    const isShape = spot.group === "shape"
                    return (
                        <div
                            key={spot.group}
                            ref={(el) => {
                                barRefs.current[spot.group] = el
                            }}
                            className={`${uid}-bar`}
                            role="radiogroup"
                            aria-label={isShape ? "Shape" : "Axis"}
                            onPointerDown={(e) => e.stopPropagation()}
                            style={{
                                position: "absolute",
                                left: "50%",
                                [spot.side]: spot.inset,
                                transform: "translateX(-50%)",
                                zIndex: 2,
                                maxWidth: "calc(100% - 24px)",
                                height: BAR_HEIGHT,
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                padding: 4,
                                borderRadius: 999,
                                background: cfg.switcher.fill,
                                border: `1px solid ${cfg.switcher.stroke}`,
                                backdropFilter: "blur(16px) saturate(140%)",
                                WebkitBackdropFilter:
                                    "blur(16px) saturate(140%)",
                                boxShadow:
                                    "0 10px 30px -12px rgba(0, 0, 0, 0.45)",
                                overflowX: "auto",
                                overflowY: "hidden",
                                cursor: "default",
                                touchAction: "pan-x",
                            }}
                        >
                            <div
                                ref={isShape ? pillRef : axisPillRef}
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    top: 4,
                                    left: 0,
                                    height: BAR_HEIGHT - 10,
                                    width: 0,
                                    borderRadius: 999,
                                    background: cfg.switcher.activeFill,
                                    pointerEvents: "none",
                                }}
                            />
                            {chipList(cfg, spot.group).map((chip) => (
                                <button
                                    key={chip.id}
                                    ref={(el) => {
                                        if (isShape) {
                                            buttonRefs.current[
                                                chip.id as Shape
                                            ] = el
                                        } else {
                                            axisRefs.current[chip.id as Axis] =
                                                el
                                        }
                                    }}
                                    type="button"
                                    role="radio"
                                    aria-checked={chip.on}
                                    aria-label={chip.title}
                                    title={
                                        cfg.switcher.labels === "icon"
                                            ? chip.title
                                            : undefined
                                    }
                                    className={`${uid}-btn`}
                                    onClick={() =>
                                        isShape
                                            ? choose(chip.id as Shape)
                                            : chooseAxis(chip.id as Axis)
                                    }
                                    style={{
                                        ...cfg.buttonFace,
                                        position: "relative",
                                        zIndex: 1,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 7,
                                        height: BAR_HEIGHT - 10,
                                        padding:
                                            cfg.switcher.labels === "icon"
                                                ? "0 10px"
                                                : "0 14px",
                                        border: 0,
                                        borderRadius: 999,
                                        background: "transparent",
                                        color: chip.on
                                            ? cfg.switcher.activeInk
                                            : cfg.switcher.ink,
                                        whiteSpace: "nowrap",
                                        flex: "0 0 auto",
                                        cursor: "pointer",
                                    }}
                                >
                                    {cfg.switcher.labels !== "text" ? (
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.4}
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                            aria-hidden
                                        >
                                            <path d={chip.d} />
                                        </svg>
                                    ) : null}
                                    {cfg.switcher.labels !== "icon" ? (
                                        <span>{chip.title}</span>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Entry                                                               */
/* ------------------------------------------------------------------ */

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 620
 * @framerDisableUnlink
 */
export default function OrbitType3D(props: Partial<OrbitType3DProps>) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <OrbitStill cfg={resolve(props)} />
    return <OrbitLive props={props} />
}

/**
 * @framerDisableUnlink
 */
addPropertyControls(OrbitType3D, {
    bands: {
        type: ControlType.Array,
        title: "Bands",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "New band",
                },
                tint: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: INK,
                },
                counter: {
                    type: ControlType.Boolean,
                    title: "Counter Spin",
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                    defaultValue: false,
                },
            },
        },
        defaultValue: DEFAULT_BANDS,
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: [...SHAPES],
        optionTitles: [
            "Cylinder",
            "Sphere",
            "Cone",
            "Hourglass",
            "Barrel",
            "Prism",
            "Pyramid",
            "Oval",
            "Wave",
        ],
        defaultValue: "cylinder",
    },
    sides: {
        type: ControlType.Number,
        title: "Sides",
        min: 3,
        max: 12,
        step: 1,
        displayStepper: true,
        defaultValue: 6,
        hidden: (p: any) => p.shape !== "prism" && p.shape !== "pyramid",
    },
    petals: {
        type: ControlType.Number,
        title: "Waves",
        min: 2,
        max: 16,
        step: 1,
        displayStepper: true,
        defaultValue: 6,
        hidden: (p: any) => p.shape !== "wave",
    },
    amount: {
        type: ControlType.Number,
        title: "Shape Amount",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.6,
        hidden: (p: any) => !SHAPED_BY_AMOUNT.includes(p.shape),
    },
    axis: {
        type: ControlType.Enum,
        title: "Axis",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        displaySegmentedControl: true,
        defaultValue: "vertical",
    },
    spine: {
        type: ControlType.Boolean,
        title: "Letters",
        enabledTitle: "Along",
        disabledTitle: "Stacked",
        defaultValue: true,
        hidden: (p: any) => p.axis !== "horizontal",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: DEFAULT_FONT,
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Case",
        enabledTitle: "Upper",
        disabledTitle: "As Typed",
        defaultValue: true,
    },
    fit: {
        type: ControlType.Boolean,
        title: "Fit Frame",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        description:
            "Font size becomes a ceiling; the shape shrinks to stay inside the frame.",
    },
    cylinder: {
        type: ControlType.Object,
        title: "Geometry",
        defaultValue: CYLINDER,
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 1.5,
                max: 10,
                step: 0.1,
                unit: "em",
                defaultValue: CYLINDER.radius,
            },
            spacing: {
                type: ControlType.Number,
                title: "Band Gap",
                min: 0.6,
                max: 4,
                step: 0.05,
                unit: "em",
                defaultValue: CYLINDER.spacing,
            },
            tracking: {
                type: ControlType.Number,
                title: "Tracking",
                min: -0.2,
                max: 0.6,
                step: 0.01,
                unit: "em",
                defaultValue: CYLINDER.tracking,
            },
            wrap: {
                type: ControlType.Boolean,
                title: "Fill Ring",
                enabledTitle: "Yes",
                disabledTitle: "No",
                defaultValue: true,
            },
            separator: {
                type: ControlType.String,
                title: "Divider",
                defaultValue: CYLINDER.separator,
                hidden: (o: any) => o.wrap === false,
            },
            camera: {
                type: ControlType.Number,
                title: "Camera",
                min: 5,
                max: 40,
                step: 0.5,
                unit: "em",
                defaultValue: CYLINDER.camera,
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: -40,
                max: 40,
                step: 1,
                unit: "°",
                defaultValue: CYLINDER.tilt,
            },
            twist: {
                type: ControlType.Number,
                title: "Twist",
                min: -90,
                max: 90,
                step: 1,
                unit: "°",
                defaultValue: CYLINDER.twist,
                description: "Angle offset added per band.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        defaultValue: MOTION,
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Drive",
                options: ["spin", "scroll", "both"],
                optionTitles: ["Free", "Page", "Page + Spin"],
                defaultValue: MOTION.mode,
                description:
                    "Free: auto spin, mouse wheel and drag. Page: section pins and rotates as the page scrolls.",
            },
            speed: {
                type: ControlType.Number,
                title: "Spin Speed",
                min: 0,
                max: 120,
                step: 1,
                unit: "°/s",
                defaultValue: MOTION.speed,
                hidden: (o: any) => o.mode === "scroll",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["forward", "reverse"],
                optionTitles: ["Forward", "Reverse"],
                displaySegmentedControl: true,
                defaultValue: MOTION.direction,
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Mouse Wheel",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
                hidden: (o: any) => o.mode === "scroll" || o.mode === "both",
            },
            wheelGain: {
                type: ControlType.Number,
                title: "Wheel Speed",
                min: 0.05,
                max: 1.5,
                step: 0.05,
                defaultValue: MOTION.wheelGain,
                hidden: (o: any) =>
                    o.wheel === false ||
                    o.mode === "scroll" ||
                    o.mode === "both",
            },
            lockPage: {
                type: ControlType.Boolean,
                title: "Hold Page",
                enabledTitle: "Yes",
                disabledTitle: "No",
                defaultValue: true,
                description:
                    "While the pointer is over the shape, the page stops scrolling so the wheel only turns it.",
                hidden: (o: any) =>
                    o.wheel === false ||
                    o.mode === "scroll" ||
                    o.mode === "both",
            },
            turns: {
                type: ControlType.Number,
                title: "Turns",
                min: 0.25,
                max: 6,
                step: 0.25,
                defaultValue: MOTION.turns,
                description: "Full rotations across the scroll length.",
                hidden: (o: any) => o.mode !== "scroll" && o.mode !== "both",
            },
            runway: {
                type: ControlType.Number,
                title: "Scroll Length",
                min: 1.5,
                max: 8,
                step: 0.5,
                unit: "×",
                defaultValue: MOTION.runway,
                description: "Screens of scroll the stage stays pinned for.",
                hidden: (o: any) => o.mode !== "scroll" && o.mode !== "both",
            },
            glide: {
                type: ControlType.Number,
                title: "Scroll Ease",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: MOTION.glide,
                hidden: (o: any) => o.mode !== "scroll" && o.mode !== "both",
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
            },
            throwing: {
                type: ControlType.Number,
                title: "Throw",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: MOTION.throwing,
                hidden: (o: any) => o.drag === false,
            },
            sway: {
                type: ControlType.Number,
                title: "Pointer Tilt",
                min: 0,
                max: 20,
                step: 1,
                unit: "°",
                defaultValue: MOTION.sway,
            },
        },
    },
    back: {
        type: ControlType.Object,
        title: "Back Side",
        defaultValue: BACK,
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Show",
                options: ["hide", "mirror", "read"],
                optionTitles: ["Hide", "Mirror", "Read"],
                displaySegmentedControl: true,
                defaultValue: BACK.mode,
            },
            tint: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: BACK.tint,
                hidden: (o: any) => o.mode === "hide",
            },
            fade: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: BACK.fade,
                hidden: (o: any) => o.mode === "hide",
            },
        },
    },
    switcher: {
        type: ControlType.Object,
        title: "Shape Buttons",
        defaultValue: SWITCHER,
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Buttons",
                enabledTitle: "Show",
                disabledTitle: "Hide",
                defaultValue: true,
            },
            axisButtons: {
                type: ControlType.Boolean,
                title: "Axis Toggle",
                enabledTitle: "Show",
                disabledTitle: "Hide",
                defaultValue: true,
                hidden: (o: any) => o.show === false,
            },
            axisSide: {
                type: ControlType.Enum,
                title: "Axis Place",
                options: ["top", "bottom"],
                optionTitles: ["Top", "Bottom"],
                displaySegmentedControl: true,
                defaultValue: SWITCHER.axisSide,
                hidden: (o: any) => o.show === false || o.axisButtons === false,
            },
            shapeButtons: {
                type: ControlType.Boolean,
                title: "Shape Toggle",
                enabledTitle: "Show",
                disabledTitle: "Hide",
                defaultValue: true,
                hidden: (o: any) => o.show === false,
            },
            shapeSide: {
                type: ControlType.Enum,
                title: "Shape Place",
                options: ["top", "bottom"],
                optionTitles: ["Top", "Bottom"],
                displaySegmentedControl: true,
                defaultValue: SWITCHER.shapeSide,
                hidden: (o: any) =>
                    o.show === false || o.shapeButtons === false,
            },
            labels: {
                type: ControlType.Enum,
                title: "Content",
                options: ["both", "icon", "text"],
                optionTitles: ["Icon + Text", "Icon", "Text"],
                defaultValue: SWITCHER.labels,
                hidden: (o: any) => o.show === false,
            },
            offset: {
                type: ControlType.Number,
                title: "Offset",
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: SWITCHER.offset,
                hidden: (o: any) => o.show === false,
            },
            fill: {
                type: ControlType.Color,
                title: "Bar",
                defaultValue: SWITCHER.fill,
                hidden: (o: any) => o.show === false,
            },
            stroke: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: SWITCHER.stroke,
                hidden: (o: any) => o.show === false,
            },
            ink: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: SWITCHER.ink,
                hidden: (o: any) => o.show === false,
            },
            activeFill: {
                type: ControlType.Color,
                title: "Active",
                defaultValue: SWITCHER.activeFill,
                hidden: (o: any) => o.show === false,
            },
            activeInk: {
                type: ControlType.Color,
                title: "Active Text",
                defaultValue: SWITCHER.activeInk,
                hidden: (o: any) => o.show === false,
            },
            morph: {
                type: ControlType.Number,
                title: "Morph Time",
                min: 0,
                max: 2000,
                step: 50,
                unit: "ms",
                defaultValue: SWITCHER.morph,
                description:
                    "How long the letters take to reshape when a button is clicked.",
            },
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: DEFAULT_BUTTON_FONT,
        hidden: (p: any) => p.switcher?.show === false,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0C0C0F",
    },
})
