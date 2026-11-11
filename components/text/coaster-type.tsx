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


type Vec3 = { x: number; y: number; z: number }
type TrackFrame = { position: Vec3; forward: Vec3; up: Vec3 }
type SegmentGeometry = {
    length: number
    samplePosition(s: number): Vec3
    sampleTangent(s: number): Vec3
    sampleUp(s: number): Vec3
}
type Carriage = {
    id: string
    text: string
    width: number
    offsetFromHead: number
}
type GlyphLayout = { char: string; advance: number; offsetWithinWord: number }
type WordGlyphLayout = {
    glyphs: GlyphLayout[]
    contentWidth: number
    width: number
}
type VisualGlyph = GlyphLayout & { wordIndex: number; routeOffset: number }
type TypographyConfig = {
    fontFamily: string
    fontSize: number
    color: string
    fontWeight?: React.CSSProperties["fontWeight"]
    fontStyle?: React.CSSProperties["fontStyle"]
}
type DropLayout = {
    holdZoneStart: number
    holdZoneEnd: number
    holdTarget: number
}
type DropPath = {
    geometry: SegmentGeometry
    layout: DropLayout
    trainExtent: number
    exitDistance: number
}
type DropPhase =
    | "idle"
    | "approach"
    | "holding"
    | "dropping"
    | "completed"
    | "returning"

type DropState = {
    phase: DropPhase
    distance: number
    velocity: number
    acceleration: number
    holdRemaining: number
    time: number
}
type View = { width: number; height: number; scale: number; target: Vec3 }
type FrameDriver = {
    requestFrame(callback: (time: number) => void): number
    cancelFrame(id: number): void
    shouldRun(): boolean
    update(dt: number): void
}
type Props = {
    items?: string[]
    font?: React.CSSProperties
    fontSize?: number
    color?: string
    holdDuration?: number
    trigger?: "auto" | "tap"
    loop?: number
    echoEnabled?: boolean
    style?: React.CSSProperties
}
const DEFAULT_ITEMS = ["TYPOGRAPHY", "IS", "A", "TRAIN"]
const DEFAULT_TYPOGRAPHY: TypographyConfig = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: 28,
    color: "#202020",
    fontWeight: 500,
}

const carriageGap = (fontSize: number) => fontSize * 0.5
const DROP_HOLD_MARGIN = 32

const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n))

const V = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z })

const add = (a: Vec3, b: Vec3) => V(a.x + b.x, a.y + b.y, a.z + b.z)

const sub = (a: Vec3, b: Vec3) => V(a.x - b.x, a.y - b.y, a.z - b.z)

const mul = (a: Vec3, s: number) => V(a.x * s, a.y * s, a.z * s)

const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z

const cross = (a: Vec3, b: Vec3) =>
    V(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x)

const norm = (a: Vec3) => mul(a, 1 / Math.max(1e-12, Math.hypot(a.x, a.y, a.z)))

const lerp = (a: Vec3, b: Vec3, t: number) => add(a, mul(sub(b, a), t))

const perpendicular = (up: Vec3, f: Vec3) => {
    const p = sub(up, mul(f, dot(up, f)))
    return Math.hypot(p.x, p.y, p.z) > 1e-7
        ? norm(p)
        : norm(cross(f, Math.abs(f.z) < 0.9 ? V(0, 0, 1) : V(0, 1, 0)))
}

function transport(up: Vec3, from: Vec3, to: Vec3) {
    const axis = cross(from, to),
        c = clamp(dot(from, to), -1, 1)
    if (c < -0.999999) return perpendicular(up, to)
    return perpendicular(
        add(
            add(up, cross(axis, up)),
            mul(cross(axis, cross(axis, up)), 1 / (1 + c))
        ),
        to
    )
}

function sampledGeometry(
    points: Vec3[],
    initialUp = V(0, -1, 0)
): SegmentGeometry {
    if (points.length < 2)
        throw new Error("Geometry requires two distinct points")
    const p = points.filter(
        (v, i) =>
            !i || Math.hypot(...Object.values(sub(v, points[i - 1]))) > 1e-9
    )
    if (p.length < 2) throw new Error("Geometry has zero length")
    const distances = [0]
    for (let i = 1; i < p.length; i++)
        distances.push(
            distances[i - 1] +
                Math.hypot(
                    p[i].x - p[i - 1].x,
                    p[i].y - p[i - 1].y,
                    p[i].z - p[i - 1].z
                )
        )
    const tangents = p.map((_, i) =>
        norm(sub(p[Math.min(i + 1, p.length - 1)], p[Math.max(0, i - 1)]))
    )
    const ups = [perpendicular(initialUp, tangents[0])]
    for (let i = 1; i < p.length; i++)
        ups.push(transport(ups[i - 1], tangents[i - 1], tangents[i]))
    const lookup = (distance: number) => {
        const s = clamp(distance, 0, distances[distances.length - 1])
        let lo = 0,
            hi = p.length - 1
        while (hi - lo > 1) {
            const m = (lo + hi) >> 1
            if (distances[m] <= s) lo = m
            else hi = m
        }
        return {
            lo,
            hi,
            t: (s - distances[lo]) / (distances[hi] - distances[lo]),
        }
    }
    const sample = (values: Vec3[], distance: number) => {
        const { lo, hi, t } = lookup(distance)
        return lerp(values[lo], values[hi], t)
    }
    return {
        length: distances[distances.length - 1],
        samplePosition: (s) => sample(p, s),
        sampleTangent: (s) => norm(sample(tangents, s)),
        sampleUp: (s) =>
            perpendicular(sample(ups, s), norm(sample(tangents, s))),
    }
}

function frameAt(g: SegmentGeometry, s: number): TrackFrame {
    return {
        position: g.samplePosition(s),
        forward: g.sampleTangent(s),
        up: g.sampleUp(s),
    }
}

function makeDropGeometry(cars: Carriage[]): {
    geometry: SegmentGeometry
    layout: DropLayout
} {
    const points: Vec3[] = [V()]
    let distance = 0

    const append = (run: number, rise: (t: number) => number) => {
        const origin = points[points.length - 1],
            count = Math.ceil(run / 4)
        for (let i = 1; i <= count; i++) {
            const t = i / count,
                point = V(origin.x + run * t, origin.y + rise(t), 0)
            const previous = points[points.length - 1]
            distance += Math.hypot(
                point.x - previous.x,
                point.y - previous.y,
                point.z - previous.z
            )
            points.push(point)
        }
    }
    append(40, () => 0)
    append(
        520,
        (t) =>
            -270 * (6 * t * t * t * t * t - 15 * t * t * t * t + 10 * t * t * t)
    )
    const holdZoneStart = distance
    const extent = carriageTrainExtent(cars)
    append(Math.max(1, extent) + 2 * DROP_HOLD_MARGIN, () => 0)
    const holdZoneEnd = distance
    const rearReach = cars.length
        ? Math.max(...cars.map((c) => c.offsetFromHead + c.width / 2))
        : 0
    const frontReach = cars.length
        ? Math.max(...cars.map((c) => c.width / 2 - c.offsetFromHead))
        : 0
    const holdTarget =
        (holdZoneStart + holdZoneEnd + rearReach - frontReach) / 2

    const slope = 1100 / (260 / 2 + 460 + 300 / 2)
    append(260, (t) => slope * 260 * (t * t * t - 0.5 * t * t * t * t))
    append(460, (t) => slope * 460 * t)
    append(300, (t) => slope * 300 * (t - t * t * t + 0.5 * t * t * t * t))
    append(180, () => 0)
    return {
        geometry: sampledGeometry(points),
        layout: { holdZoneStart, holdZoneEnd, holdTarget },
    }
}

const glyphMetricCache = new Map<string, number>()
function getGlyphAdvance(char: string, config: TypographyConfig): number {
    const key = JSON.stringify([
        char,
        config.fontFamily,
        config.fontSize,
        config.fontWeight,
        config.fontStyle,
    ])
    const cached = glyphMetricCache.get(key)
    if (cached !== undefined) return cached
    const mono = /mono|consolas|menlo|courier/i.test(config.fontFamily)
    const factor = mono
        ? 0.62
        : /[MW@#%]/u.test(char)
          ? 1.05
          : /[ilI.,'!| ]/u.test(char)
            ? 0.4
            : /[^\u0000-\u024f]/u.test(char)
              ? 1.05
              : /[A-Z]/u.test(char)
                ? 0.78
                : 0.64
    const advance = config.fontSize * factor
    if (glyphMetricCache.size > 4096) glyphMetricCache.clear()
    glyphMetricCache.set(key, advance)
    return advance
}
function makeGlyphLayout(
    text: string,
    typography: TypographyConfig | number = DEFAULT_TYPOGRAPHY
): WordGlyphLayout {
    const config =
        typeof typography === "number"
            ? { ...DEFAULT_TYPOGRAPHY, fontSize: typography }
            : typography
    const chars = Array.from(text),
        advances = chars.map((char) => getGlyphAdvance(char, config))
    const contentWidth =
        advances.reduce((a, b) => a + b, 0) +
        Math.max(0, chars.length - 1) * (config.fontSize * 0.035)
    let cursor = -contentWidth / 2
    const glyphs = chars.map((char, i) => {
        const advance = advances[i],
            offsetWithinWord = cursor + advance / 2
        cursor += advance + config.fontSize * 0.035
        return { char, advance, offsetWithinWord }
    })
    return { glyphs, contentWidth, width: Math.max(34, contentWidth + 12) }
}
function makeVisualGlyphs(
    cars: Carriage[],
    config = DEFAULT_TYPOGRAPHY
): VisualGlyph[] {
    return cars.flatMap((car, wordIndex) =>
        makeGlyphLayout(car.text, config)
            .glyphs.filter((glyph) => !/^\s$/u.test(glyph.char))
            .map((glyph) => ({
                ...glyph,
                wordIndex,
                routeOffset: -car.offsetFromHead + glyph.offsetWithinWord,
            }))
    )
}
function makeCarriages(
    items: string[],
    config = DEFAULT_TYPOGRAPHY
): Carriage[] {
    const labels = items
        .filter((s) => typeof s === "string" && s.trim())
        .slice(0, 8)
    const cars: Carriage[] = labels.map((text, i) => ({
        id: `car-${i}`,
        text,
        width: makeGlyphLayout(text, config).width,
        offsetFromHead: 0,
    }))
    for (let i = cars.length - 2; i >= 0; i--)
        cars[i].offsetFromHead =
            cars[i + 1].offsetFromHead +
            cars[i + 1].width / 2 +
            carriageGap(config.fontSize) +
            cars[i].width / 2
    return cars
}

function carriageTrainExtent(cars: Carriage[]) {
    if (!cars.length) return 0
    const rear = Math.max(...cars.map((c) => c.offsetFromHead + c.width / 2))
    const front = Math.min(...cars.map((c) => c.offsetFromHead - c.width / 2))
    return rear - front
}

function makeDropPath(cars: Carriage[]): DropPath {
    const { geometry: base, layout } = makeDropGeometry(cars),
        trainExtent = carriageTrainExtent(cars)
    const lead = 180,
        tail = trainExtent + 1400,
        end = frameAt(base, base.length)
    const beyond = lead + base.length
    return {
        trainExtent,
        exitDistance: beyond,
        layout: {
            holdZoneStart: layout.holdZoneStart + lead,
            holdZoneEnd: layout.holdZoneEnd + lead,
            holdTarget: layout.holdTarget + lead,
        },
        geometry: {
            length: beyond + tail,
            samplePosition: (s) =>
                s < lead
                    ? V(s - lead, 0, 0)
                    : s > beyond
                      ? add(end.position, mul(end.forward, s - beyond))
                      : base.samplePosition(s - lead),
            sampleTangent: (s) =>
                s < lead
                    ? V(1, 0, 0)
                    : s > beyond
                      ? end.forward
                      : base.sampleTangent(s - lead),
            sampleUp: (s) =>
                s < lead
                    ? V(0, -1, 0)
                    : s > beyond
                      ? end.up
                      : base.sampleUp(s - lead),
        },
    }
}

function createDropState(): DropState {
    return {
        phase: "idle",
        distance: 0,
        velocity: 0,
        acceleration: 0,
        holdRemaining: 0,
        time: 0,
    }
}

function armAtCrest(path: DropPath): DropState {
    return {
        phase: "idle",
        distance: path.layout.holdTarget,
        velocity: 0,
        acceleration: 0,
        holdRemaining: 0,
        time: 0,
    }
}
function startDrop(state: DropState) {
    if (state.phase !== "idle" && state.phase !== "completed") return
    Object.assign(state, createDropState(), { phase: "approach" })
}
function needsSimulation(state: DropState) {
    return (
        state.phase === "approach" ||
        state.phase === "holding" ||
        state.phase === "dropping" ||
        state.phase === "returning"
    )
}

function advanceApproachMotion(state: DropState, path: DropPath, h: number) {
    const before = state.velocity,
        gap = path.layout.holdTarget - state.distance
    const target = Math.min(95, Math.sqrt(2 * 140 * Math.max(0, gap)) * 0.58)
    state.velocity = Math.max(
        0,
        before + clamp(target - before, -140 * h, 140 * h)
    )
    state.acceleration = (state.velocity - before) / h
    return { before, gap }
}

function advanceDrop(
    state: DropState,
    path: DropPath,
    dt: number,
    holdDuration: number,
    tapMode = false
) {
    let remaining = clamp(dt, 0, 0.05)
    while (remaining > 1e-9 && needsSimulation(state)) {
        const h = Math.min(remaining, 1 / 120)
        remaining -= h
        state.time += h
        if (state.phase === "holding") {
            state.holdRemaining = Math.max(0, state.holdRemaining - h)
            if (state.holdRemaining < 1e-9) {
                state.holdRemaining = 0
                state.phase = "dropping"
            }
            continue
        }
        if (state.phase === "approach" || state.phase === "returning") {
            const { before, gap } = advanceApproachMotion(state, path, h)
            const travel = (before + state.velocity) * 0.5 * h
            if (travel >= gap || gap < 0.02) {
                state.distance = path.layout.holdTarget
                state.velocity = 0
                state.acceleration = 0
                if (state.phase === "approach") {
                    state.holdRemaining = clamp(holdDuration, 0, 10)
                    state.phase =
                        state.holdRemaining > 0 ? "holding" : "dropping"
                } else {
                    state.phase = "idle"
                }
            } else {
                state.distance = Math.min(
                    path.geometry.length,
                    state.distance + travel
                )
            }
            continue
        }
        // dropping
        const before = state.velocity

        const GRAVITY = 820
        const AIR_DRAG = 0.12
        const DRIVE_TARGET = 105
        const DRIVE_ACCEL = 32

        const tangent = path.geometry.sampleTangent(state.distance)

        const gravityAlongTrack = GRAVITY * tangent.y

        const driveBlend = clamp(1 - tangent.y / 0.22, 0, 1)

        const driveAccel =
            (clamp(DRIVE_TARGET - before, -DRIVE_ACCEL * h, DRIVE_ACCEL * h) /
                h) *
            driveBlend

        const acceleration = gravityAlongTrack + driveAccel - AIR_DRAG * before

        state.velocity = Math.max(0, before + acceleration * h)

        state.acceleration = (state.velocity - before) / h
        const travel = (before + state.velocity) * 0.5 * h
        state.distance = Math.min(path.geometry.length, state.distance + travel)
        if (state.distance === path.geometry.length) {
            state.phase = "completed"
            state.velocity = 0
            state.acceleration = 0

            if (tapMode) {
                state.phase = "returning"
                state.distance = 0
                state.velocity = 0
                state.acceleration = 0
            }
        }
    }
}

function createDropScheduler(driver: FrameDriver) {
    let frame: number | null = null,
        last: number | null = null,
        disposed = false
    const tick = (time: number) => {
        frame = null
        if (disposed || !driver.shouldRun()) {
            last = null
            return
        }
        const dt = last === null ? 0 : clamp((time - last) / 1000, 0, 0.05)
        last = time
        driver.update(dt)
        if (driver.shouldRun()) frame = driver.requestFrame(tick)
        else last = null
    }
    const suspend = () => {
        if (frame !== null) driver.cancelFrame(frame)
        frame = null
        last = null
    }
    return {
        wake: () => {
            if (!disposed && frame === null && driver.shouldRun())
                frame = driver.requestFrame(tick)
        },
        suspend,
        dispose: () => {
            disposed = true
            suspend()
        },
    }
}

function makeView(path: DropPath, width: number, height: number): View {
    const target = path.geometry.samplePosition(
        (path.layout.holdZoneStart + path.layout.holdZoneEnd) / 2
    )

    const readableWidth = width * 0.88
    const trainWidth = path.trainExtent

    const scale = clamp(readableWidth / Math.max(trainWidth, 1), 0.72, 1)
    return { width, height, scale, target: add(target, V(0, -20, 0)) }
}
function project(view: View, p: Vec3) {
    return {
        x: view.width / 2 + (p.x - view.target.x) * view.scale,
        y: view.height * 0.42 + (p.y - view.target.y) * view.scale,
    }
}
function glyphPose(path: DropPath, view: View, distance: number) {
    const frame = frameAt(path.geometry, distance),
        p = project(view, frame.position)
    const angle = (Math.atan2(frame.forward.y, frame.forward.x) * 180) / Math.PI
    return {
        ...p,
        angle,
        frame,
        distance,
        transform: `translate(${p.x} ${p.y}) rotate(${angle}) scale(${view.scale})`,
    }
}
type PaintCache = { distance?: number; phase?: DropPhase; visible: boolean[] }

const ECHO_MAX = 3
const ECHO_LOW = 180,
    ECHO_MID = 550,
    ECHO_HIGH = 900
const lerp1 = (a: number, b: number, t: number) => a + (b - a) * t
type EchoParams = { count: number; offsets: number[]; opacities: number[] }
function computeEchoParams(velocity: number): EchoParams {
    const v = Math.abs(velocity)
    const count = v >= ECHO_HIGH ? 3 : v >= ECHO_MID ? 2 : v >= ECHO_LOW ? 1 : 0
    const t = clamp((v - ECHO_LOW) / (ECHO_HIGH - ECHO_LOW), 0, 1)
    return {
        count,
        offsets: [lerp1(4, 10, t), lerp1(10, 18, t), lerp1(18, 28, t)],
        opacities: [
            lerp1(0.2, 0.28, t),
            lerp1(0.1, 0.16, t),
            lerp1(0.04, 0.1, t),
        ],
    }
}

function paintGlyphs(
    path: DropPath,
    view: View,
    state: DropState,
    glyphs: VisualGlyph[],
    nodes: (SVGGElement | null)[],
    echoNodes: (SVGTextElement | null)[][],
    echoEnabled: boolean,
    cache: PaintCache,
    fontSize: number
) {
    if (cache.distance === state.distance && cache.phase === state.phase)
        return 0
    cache.distance = state.distance
    cache.phase = state.phase

    const echo = echoEnabled ? computeEchoParams(state.velocity) : null
    let samples = 0
    for (let i = 0; i < glyphs.length; i++) {
        const node = nodes[i]
        if (!node) continue

        const d =
            (state.phase === "idle" ? path.layout.holdTarget : state.distance) +
            glyphs[i].routeOffset
        let visible =
            state.phase !== "completed" && d >= 0 && d <= path.geometry.length
        if (visible) {
            const pose = glyphPose(path, view, d)
            samples++
            const margin = fontSize * 2 * view.scale
            visible =
                pose.x >= -margin &&
                pose.x <= view.width + margin &&
                pose.y >= -margin &&
                pose.y <= view.height + margin
            if (visible) node.setAttribute("transform", pose.transform)
        }
        if (cache.visible[i] !== visible) {
            node.style.opacity = visible ? "1" : "0"
            cache.visible[i] = visible
        }
        if (echo) {
            const echoRow = echoNodes[i]
            if (echoRow) {
                for (let k = 0; k < echoRow.length; k++) {
                    const echoNode = echoRow[k]
                    if (!echoNode) continue

                    const active = visible && k < echo.count
                    echoNode.style.opacity = active
                        ? String(echo.opacities[k])
                        : "0"
                    if (active)
                        echoNode.setAttribute(
                            "transform",
                            `translate(${-echo.offsets[k]} 0)`
                        )
                }
            }
        }
    }
    return samples
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 560
 */
export default function TypeDrop({
    items = DEFAULT_ITEMS,
    font,
    fontSize = 28,
    color = "#202020",
    holdDuration = 5,
    trigger = "auto",
    loop = 0,
    echoEnabled = true,
    style,
}: Props) {
    const isStatic = useIsStaticRenderer()
    const [reduced, setReduced] = React.useState(true)
    const [size, setSize] = React.useState({ width: 960, height: 560 })
    const [phase, setPhase] = React.useState<DropPhase>("idle")
    const root = React.useRef<HTMLDivElement>(null)
    const nodes = React.useRef<(SVGGElement | null)[]>([]),
        echoNodes = React.useRef<(SVGTextElement | null)[][]>([])
    const state = React.useRef(createDropState())
    const wake = React.useRef(() => {}),
        suspend = React.useRef(() => {})
    const itemKey = JSON.stringify(items)
    const typography = React.useMemo<TypographyConfig>(
        () => ({
            fontFamily: font?.fontFamily || DEFAULT_TYPOGRAPHY.fontFamily,
            fontSize: clamp(fontSize, 12, 58),
            fontWeight: font?.fontWeight || 500,
            fontStyle: font?.fontStyle,
            color,
        }),
        [font?.fontFamily, font?.fontWeight, font?.fontStyle, fontSize, color]
    )
    const metricKey = JSON.stringify([
        typography.fontFamily,
        typography.fontSize,
        typography.fontWeight,
        typography.fontStyle,
    ])
    const cars = React.useMemo(
        () => makeCarriages(items, typography),
        [itemKey, metricKey]
    )
    const glyphs = React.useMemo(
        () => makeVisualGlyphs(cars, typography),
        [cars]
    )
    const path = React.useMemo(() => makeDropPath(cars), [cars])
    const view = React.useMemo(
        () => makeView(path, Math.max(1, size.width), Math.max(1, size.height)),
        [path, size]
    )
    const fixed = isStatic || reduced || !cars.length
    const duration = clamp(holdDuration, 0, 10)
    const viewport: React.CSSProperties = {
        ...style,
        width:
            style?.width == null || style.width === "auto" ? 960 : style.width,
        height:
            style?.height == null || style.height === "auto"
                ? 560
                : style.height,
        minWidth: 0,
        minHeight: 0,
        position: "relative",
        overflow: "hidden",
        contain: "size layout paint",
        background: "transparent",
    }
    React.useEffect(() => {
        if (isStatic) return
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(media.matches)
        update()
        media.addEventListener("change", update)
        return () => media.removeEventListener("change", update)
    }, [isStatic])
    React.useEffect(() => {
        if (!root.current || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect
            if (width > 0 && height > 0)
                setSize((old) =>
                    Math.abs(old.width - width) < 0.5 &&
                    Math.abs(old.height - height) < 0.5
                        ? old
                        : { width, height }
                )
        })
        observer.observe(root.current)
        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        suspend.current()
        if (trigger === "tap") {
            Object.assign(state.current, armAtCrest(path))
        } else {
            Object.assign(state.current, createDropState())
            if (!fixed && trigger === "auto") startDrop(state.current)
        }
        setPhase(state.current.phase)
    }, [path, duration, fixed, trigger])
    React.useEffect(() => {
        if (fixed) return
        const m = state.current,
            cache: PaintCache = { visible: [] }
        let reported = m.phase
        const paint = () => {
            paintGlyphs(
                path,
                view,
                m,
                glyphs,
                nodes.current,
                echoNodes.current,
                echoEnabled,
                cache,
                typography.fontSize
            )
        }
        const publish = () => {
            if (reported !== m.phase) {
                reported = m.phase
                setPhase(m.phase)
            }
        }
        const scheduler = createDropScheduler({
            requestFrame: (callback) => requestAnimationFrame(callback),
            cancelFrame: (id) => cancelAnimationFrame(id),
            shouldRun: () => !document.hidden && needsSimulation(m),
            update: (dt) => {
                advanceDrop(m, path, dt, duration, trigger === "tap")
                paint()
                publish()
            },
        })
        const schedule = () => {
            paint()
            publish()
            scheduler.wake()
        }
        wake.current = schedule
        suspend.current = scheduler.suspend
        const visibility = () => {
            scheduler.suspend()
            if (!document.hidden) schedule()
        }
        document.addEventListener("visibilitychange", visibility)
        schedule()
        return () => {
            scheduler.dispose()
            wake.current = () => {}
            suspend.current = () => {}
            document.removeEventListener("visibilitychange", visibility)
        }
    }, [path, view, glyphs, duration, fixed, trigger, echoEnabled])

    React.useEffect(() => {
        if (fixed || trigger !== "tap") return
        const el = root.current
        if (!el) return
        const MOVE_THRESHOLD = 8
        const INTERACTIVE =
            'a, button, input, textarea, select, [role="button"], [role="link"]'
        let gesture: {
            pointerId: number
            x: number
            y: number
            moved: boolean
        } | null = null
        const onDown = (e: PointerEvent) => {
            if (gesture) return
            gesture = {
                pointerId: e.pointerId,
                x: e.clientX,
                y: e.clientY,
                moved: false,
            }
        }
        const onMove = (e: PointerEvent) => {
            if (!gesture || e.pointerId !== gesture.pointerId) return
            if (
                Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) >
                MOVE_THRESHOLD
            )
                gesture.moved = true
        }
        const onCancel = (e: PointerEvent) => {
            if (gesture && e.pointerId === gesture.pointerId) gesture = null
        }
        const onUp = (e: PointerEvent) => {
            if (!gesture || e.pointerId !== gesture.pointerId) {
                gesture = null
                return
            }
            const g = gesture
            gesture = null
            if (g.moved) return
            const composedPath =
                typeof e.composedPath === "function" ? e.composedPath() : []
            if (
                composedPath.some(
                    (node) =>
                        node instanceof Element && node.matches?.(INTERACTIVE)
                )
            )
                return
            const rect = el.getBoundingClientRect()
            if (
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom
            )
                return

            const s = state.current
            if (s.phase !== "idle") return
            s.distance = path.layout.holdTarget
            s.velocity = 0
            s.acceleration = 0
            s.phase = "dropping"
            setPhase(s.phase)
            wake.current()
        }
        document.addEventListener("pointerdown", onDown, { passive: true })
        document.addEventListener("pointermove", onMove, { passive: true })
        document.addEventListener("pointerup", onUp, { passive: true })
        document.addEventListener("pointercancel", onCancel, { passive: true })
        return () => {
            document.removeEventListener("pointerdown", onDown)
            document.removeEventListener("pointermove", onMove)
            document.removeEventListener("pointerup", onUp)
            document.removeEventListener("pointercancel", onCancel)
        }
    }, [fixed, trigger, path])

    React.useEffect(() => {
        if (fixed || trigger !== "auto" || phase !== "completed" || loop <= 0)
            return
        const id = window.setTimeout(
            () => {
                if (state.current.phase !== "completed") return
                suspend.current()
                startDrop(state.current)
                setPhase(state.current.phase)
                wake.current()
            },
            clamp(loop, 0, 60) * 1000
        )
        return () => window.clearTimeout(id)
    }, [phase, fixed, trigger, loop, path])
    const fallback = React.useMemo(
        () => (cars.length ? cars : makeCarriages(DEFAULT_ITEMS, typography)),
        [cars, metricKey]
    )

    const staticGlyphs = React.useMemo(() => {
        const result: { char: string; x: number; y: number }[] = []
        const gap = carriageGap(typography.fontSize)
        let x = 20,
            y = typography.fontSize + 20,
            rowStart = 0
        const finishRow = () => {
            const shift = Math.max(0, (view.width - (x - gap) - 20) / 2)
            for (let i = rowStart; i < result.length; i++) result[i].x += shift
            rowStart = result.length
        }
        for (const car of fallback) {
            if (x > 20 && x + car.width > view.width - 20) {
                finishRow()
                x = 20
                y += typography.fontSize * 1.6
            }
            const layout = makeGlyphLayout(car.text, typography)
            if (car.width <= view.width - 40) {
                for (const g of layout.glyphs)
                    if (!/^\s$/u.test(g.char))
                        result.push({
                            char: g.char,
                            x: x + car.width / 2 + g.offsetWithinWord,
                            y,
                        })
                x += car.width + gap
            } else {
                for (const g of layout.glyphs) {
                    if (x > 20 && x + g.advance > view.width - 20) {
                        finishRow()
                        x = 20
                        y += typography.fontSize * 1.6
                    }
                    if (!/^\s$/u.test(g.char))
                        result.push({ char: g.char, x: x + g.advance / 2, y })
                    x += g.advance + typography.fontSize * 0.035
                }
                x += gap
            }
        }
        finishRow()
        const shift = Math.max(0, (view.height - y - 20) / 2)
        return result.map((g) => ({ ...g, y: g.y + shift }))
    }, [fallback, view, metricKey])
    const label = fallback.map((c) => c.text).join(" ")
    return (
        <div
            ref={root}
            role="group"
            aria-label={label}
            data-type-drop=""
            data-phase={phase}
            style={viewport}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${view.width} ${view.height}`}
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                {fixed
                    ? staticGlyphs.map((g, i) => (
                          <text
                              key={`static-${i}`}
                              textAnchor="middle"
                              x={g.x}
                              y={g.y}
                              fontFamily={typography.fontFamily}
                              fontSize={typography.fontSize}
                              fontWeight={typography.fontWeight}
                              fontStyle={typography.fontStyle}
                              fill={typography.color}
                          >
                              {g.char}
                          </text>
                      ))
                    : glyphs.map((g, i) => {
                          const pose = glyphPose(
                              path,
                              view,
                              path.layout.holdTarget + g.routeOffset
                          )
                          return (
                              <g
                                  key={`glyph-${i}`}
                                  ref={(node) => {
                                      nodes.current[i] = node
                                  }}
                                  data-word-index={g.wordIndex}
                                  transform={pose.transform}
                              >
                                  {echoEnabled &&
                                      Array.from({ length: ECHO_MAX }).map(
                                          (_, k) => (
                                              <text
                                                  key={`echo-${i}-${k}`}
                                                  ref={(node) => {
                                                      ;(echoNodes.current[i] ||=
                                                          [null, null, null])[
                                                          k
                                                      ] = node
                                                  }}
                                                  aria-hidden="true"
                                                  textAnchor="middle"
                                                  y={
                                                      (-17 *
                                                          typography.fontSize) /
                                                      28
                                                  }
                                                  fontFamily={
                                                      typography.fontFamily
                                                  }
                                                  fontSize={typography.fontSize}
                                                  fontWeight={
                                                      typography.fontWeight
                                                  }
                                                  fontStyle={
                                                      typography.fontStyle
                                                  }
                                                  fill={typography.color}
                                                  opacity={0}
                                                  style={{
                                                      userSelect: "none",
                                                      mixBlendMode:
                                                          "difference",
                                                  }}
                                              >
                                                  {g.char}
                                              </text>
                                          )
                                      )}
                                  <text
                                      textAnchor="middle"
                                      y={(-17 * typography.fontSize) / 28}
                                      fontFamily={typography.fontFamily}
                                      fontSize={typography.fontSize}
                                      fontWeight={typography.fontWeight}
                                      fontStyle={typography.fontStyle}
                                      fill={typography.color}
                                      style={{ userSelect: "none" }}
                                  >
                                      {g.char}
                                  </text>
                              </g>
                          )
                      })}
            </svg>
        </div>
    )
}

TypeDrop.defaultProps = {
    items: DEFAULT_ITEMS,
    fontSize: 28,
    color: "#202020",
    holdDuration: 5,
    trigger: "auto",
    loop: 0,
    echoEnabled: true,
}

addPropertyControls(TypeDrop, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: { type: ControlType.String },
        defaultValue: DEFAULT_ITEMS,
        maxCount: 8,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "monospace",
        displayFontSize: false,
        displayTextAlignment: false,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 28,
        min: 12,
        max: 58,
        step: 1,
    },
    color: {
        type: ControlType.Color,
        title: "Font Color",
        defaultValue: "#202020",
    },
    holdDuration: {
        type: ControlType.Number,
        title: "Hold Duration",
        defaultValue: 5,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: (props) => props.trigger !== "auto",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["auto", "tap"],
        optionTitles: ["Auto", "Tap"],
        defaultValue: "auto",
    },
    loop: {
        type: ControlType.Number,
        title: "Repeat Delay",
        defaultValue: 0,
        min: 0,
        max: 60,
        step: 0.5,
        unit: "s",
        hidden: (props) => props.trigger !== "auto",
    },
    echoEnabled: {
        type: ControlType.Boolean,
        title: "Motion Echo",
        defaultValue: true,
    },
})
