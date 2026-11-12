import { useEffect, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Terrain = "desert" | "mountains" | "ocean" | "forest" | "snow"
type TimeMode = "fixed" | "cycle" | "scroll" | "local" | "theme"
type Weather = "none" | "rain" | "snow" | "fog"
type Traveler =
    | "auto"
    | "none"
    | "caravan"
    | "hikers"
    | "deer"
    | "cyclist"
    | "sailboat"
    | "custom"
type Overlay = "none" | "left" | "center" | "bottom"
type Quality = "auto" | "high" | "low"

interface TimeProps {
    mode: TimeMode
    start: number
    cycle: number
    range: number
}

interface MotionProps {
    speed: number
    scrollWalk: boolean
    scrollAmount: number
    parallax: number
}

interface SkyProps {
    sun: boolean
    stars: boolean
    clouds: boolean
    shootingStars: boolean
    aurora: number
}

interface WeatherProps {
    type: Weather
    amount: number
}

interface TravelerProps {
    type: Traveler
    image?: { src?: string }
    size: number
    position: number
    lights: boolean
}

interface ColorProps {
    custom: boolean
    skyTop: string
    skyBottom: string
    far: string
    near: string
    sun: string
}

interface OverlayProps {
    type: Overlay
    color: string
    strength: number
}

interface Props {
    terrain: Terrain
    time: Partial<TimeProps>
    motion: Partial<MotionProps>
    layers: number
    relief: number
    sky: Partial<SkyProps>
    weather: Partial<WeatherProps>
    traveler: Partial<TravelerProps>
    colors: Partial<ColorProps>
    overlay: Partial<OverlayProps>
    grain: number
    quality: Quality
    style?: CSSProperties
}

type RGB = [number, number, number]

// 하루를 네 장면으로 나눈 색. 0 새벽, 0.25 낮, 0.5 해질녘, 0.75 밤
interface Scene {
    skyTop: string
    skyBottom: string
    far: string
    near: string
    sun: string
}

const PALETTES: Record<Terrain, [Scene, Scene, Scene, Scene]> = {
    desert: [
        {
            skyTop: "#3B4A7A",
            skyBottom: "#F2B28C",
            far: "#D89A7C",
            near: "#8A4F3A",
            sun: "#FFD2A0",
        },
        {
            skyTop: "#4F8FD6",
            skyBottom: "#CFE6F5",
            far: "#E8C08A",
            near: "#B9773F",
            sun: "#FFF4D6",
        },
        {
            skyTop: "#2D2257",
            skyBottom: "#F07A4A",
            far: "#C9684A",
            near: "#5E2F2A",
            sun: "#FFB070",
        },
        {
            skyTop: "#070B1F",
            skyBottom: "#1D2A52",
            far: "#2E3C66",
            near: "#10172E",
            sun: "#DFE8FF",
        },
    ],
    mountains: [
        {
            skyTop: "#2F3D6B",
            skyBottom: "#F0B8A0",
            far: "#8F8DB3",
            near: "#3C3F5E",
            sun: "#FFD7B0",
        },
        {
            skyTop: "#3F7FD0",
            skyBottom: "#D6ECFA",
            far: "#9FB6CF",
            near: "#3E5A6E",
            sun: "#FFFBE8",
        },
        {
            skyTop: "#23234D",
            skyBottom: "#EE8A5A",
            far: "#7A5A7E",
            near: "#2A2338",
            sun: "#FFB27A",
        },
        {
            skyTop: "#050A1C",
            skyBottom: "#17244A",
            far: "#2A3760",
            near: "#0B1124",
            sun: "#E6EEFF",
        },
    ],
    ocean: [
        {
            skyTop: "#36457A",
            skyBottom: "#F5C1A0",
            far: "#6C86B0",
            near: "#20345C",
            sun: "#FFD9B0",
        },
        {
            skyTop: "#3A8AD8",
            skyBottom: "#CDEEFC",
            far: "#3F97C6",
            near: "#0F4D7A",
            sun: "#FFFBE0",
        },
        {
            skyTop: "#2A2156",
            skyBottom: "#F38B5C",
            far: "#6A4F86",
            near: "#2A1F45",
            sun: "#FFB276",
        },
        {
            skyTop: "#040A1D",
            skyBottom: "#13254D",
            far: "#1A3463",
            near: "#06122A",
            sun: "#E6EEFF",
        },
    ],
    forest: [
        {
            skyTop: "#344270",
            skyBottom: "#F3C6A2",
            far: "#7F9A8E",
            near: "#24413A",
            sun: "#FFD8AE",
        },
        {
            skyTop: "#4A90D4",
            skyBottom: "#DFF1F7",
            far: "#7FAE86",
            near: "#24583A",
            sun: "#FFF8DC",
        },
        {
            skyTop: "#2B2352",
            skyBottom: "#EF8D5E",
            far: "#5D6A5E",
            near: "#1D2A26",
            sun: "#FFB47A",
        },
        {
            skyTop: "#050B1A",
            skyBottom: "#142446",
            far: "#1F3A3F",
            near: "#08140F",
            sun: "#E6EEFF",
        },
    ],
    snow: [
        {
            skyTop: "#46598C",
            skyBottom: "#F4CDB8",
            far: "#C3C6E0",
            near: "#6F7AA8",
            sun: "#FFE0C0",
        },
        {
            skyTop: "#5B9BE0",
            skyBottom: "#E9F5FD",
            far: "#D2E1F0",
            near: "#86A2C2",
            sun: "#FFFFFF",
        },
        {
            skyTop: "#352A62",
            skyBottom: "#F0A07A",
            far: "#B09CC4",
            near: "#584C7E",
            sun: "#FFC08A",
        },
        {
            skyTop: "#071027",
            skyBottom: "#1B2D58",
            far: "#3A4E80",
            near: "#1C2A50",
            sun: "#EEF3FF",
        },
    ],
}

// 지형마다 기본으로 걷는 실루엣
const AUTO_TRAVELER: Record<Terrain, Traveler> = {
    desert: "caravan",
    mountains: "hikers",
    ocean: "sailboat",
    forest: "deer",
    snow: "hikers",
}

const TAU = Math.PI * 2

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function smoothstep(a: number, b: number, x: number) {
    const t = clamp((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)
}

function wrap01(value: number) {
    return ((value % 1) + 1) % 1
}

// Framer는 색을 "#RRGGBB" 또는 "rgb(…)/rgba(…)"로 넘겨준다
function parseColor(color: string | undefined, fallback: RGB = [0, 0, 0]): RGB {
    if (!color) return fallback
    const value = color.trim()
    if (value.startsWith("#")) {
        let hex = value.slice(1)
        if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c)
        const n = parseInt(hex.slice(0, 6), 16)
        if (Number.isNaN(n)) return fallback
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    const parts = value.match(/[\d.]+/g)
    if (!parts || parts.length < 3) return fallback
    return [Number(parts[0]), Number(parts[1]), Number(parts[2])]
}

function mix(a: RGB, b: RGB, t: number): RGB {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ]
}

function css(c: RGB, alpha = 1) {
    return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`
}

interface Colors {
    skyTop: RGB
    skyBottom: RGB
    far: RGB
    near: RGB
    sun: RGB
}

function sceneColors(scene: Scene): Colors {
    return {
        skyTop: parseColor(scene.skyTop),
        skyBottom: parseColor(scene.skyBottom),
        far: parseColor(scene.far),
        near: parseColor(scene.near),
        sun: parseColor(scene.sun),
    }
}

// 하루 중 시간 t(0~1)에 맞춰 네 장면 사이의 색을 섞는다
function colorsAt(
    terrain: Terrain,
    t: number,
    custom?: Partial<ColorProps>
): Colors {
    if (custom?.custom) {
        return {
            skyTop: parseColor(custom.skyTop, [40, 50, 90]),
            skyBottom: parseColor(custom.skyBottom, [240, 180, 140]),
            far: parseColor(custom.far, [200, 150, 120]),
            near: parseColor(custom.near, [90, 50, 40]),
            sun: parseColor(custom.sun, [255, 220, 170]),
        }
    }
    const scenes = PALETTES[terrain] ?? PALETTES.desert
    const pos = wrap01(t) * 4
    const i = Math.floor(pos) % 4
    const f = smoothstep(0, 1, pos - Math.floor(pos))
    const a = sceneColors(scenes[i])
    const b = sceneColors(scenes[(i + 1) % 4])
    return {
        skyTop: mix(a.skyTop, b.skyTop, f),
        skyBottom: mix(a.skyBottom, b.skyBottom, f),
        far: mix(a.far, b.far, f),
        near: mix(a.near, b.near, f),
        sun: mix(a.sun, b.sun, f),
    }
}

// 낮이면 0, 한밤이면 1
function nightAmount(t: number) {
    return clamp(-Math.sin(TAU * t) * 3, 0, 1)
}

// 같은 x에는 항상 같은 값이 나오는 1차원 노이즈. 매 프레임 지형이 흔들리지 않는다
function hash(n: number) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
    return s - Math.floor(s)
}

function noise(x: number, seed: number) {
    const i = Math.floor(x)
    const f = x - i
    const u = f * f * (3 - 2 * f)
    return hash(i + seed * 57) * (1 - u) + hash(i + 1 + seed * 57) * u
}

function fbm(x: number, seed: number, octaves: number) {
    let sum = 0
    let amp = 0.5
    let freq = 1
    let total = 0
    for (let o = 0; o < octaves; o++) {
        sum += noise(x * freq, seed + o * 19) * amp
        total += amp
        amp *= 0.5
        freq *= 2.03
    }
    return sum / total
}

// 지형 모양. 0~1 사이 높이를 돌려준다
function ridge(terrain: Terrain, x: number, seed: number, time: number) {
    switch (terrain) {
        case "mountains": {
            let sum = 0
            let amp = 0.55
            let freq = 1
            for (let o = 0; o < 4; o++) {
                const n = 1 - Math.abs(noise(x * freq, seed + o * 7) * 2 - 1)
                sum += n * n * amp
                amp *= 0.48
                freq *= 2.1
            }
            return sum
        }
        case "ocean":
            return (
                0.5 +
                0.28 * Math.sin(x * 2.1 + time * 1.3 + seed) +
                0.14 * Math.sin(x * 4.7 - time * 1.9 + seed * 2) +
                0.08 * (noise(x * 3 + time * 0.4, seed) - 0.5)
            )
        case "desert": {
            // 바람 맞은 쪽은 완만하고 반대쪽은 가파른 모래언덕
            const base = fbm(x * 0.6, seed, 2)
            const crest = Math.pow(
                1 - Math.abs(Math.sin(x * 1.3 + base * 3 + seed)),
                1.8
            )
            return base * 0.55 + crest * 0.45
        }
        case "snow":
            return fbm(x * 0.8, seed, 3)
        default:
            return fbm(x, seed, 2)
    }
}

interface Layer {
    d: number
    base: number
    amp: number
    wl: number
    speed: number
    seed: number
}

function makeLayers(terrain: Terrain, count: number, relief: number): Layer[] {
    const n = clamp(Math.round(count), 3, 7)
    const layers: Layer[] = []
    for (let i = 0; i < n; i++) {
        const d = i / (n - 1)
        let base = 0.5 + 0.32 * d
        let amp = (0.22 - 0.1 * d) * relief
        let wl = 440 - 230 * d
        if (terrain === "mountains") {
            base = 0.4 + 0.42 * d
            amp = (0.42 - 0.22 * d) * relief
            wl = 460 - 220 * d
        } else if (terrain === "desert") {
            amp = (0.3 - 0.13 * d) * relief
            wl = 480 - 250 * d
        } else if (terrain === "ocean") {
            base = 0.6 + 0.3 * d
            amp = (0.012 + 0.05 * d) * relief
            wl = 260 - 120 * d
        }
        layers.push({
            d,
            base,
            amp,
            wl,
            speed: 0.06 + 0.94 * d ** 1.3,
            seed: i * 13.7 + 3,
        })
    }
    // 실루엣이 걷는 층은 완만하게, 가장 가까운 층은 조금 낮게 해서
    // 무리가 크게 오르내리거나 앞 언덕에 자주 가려지지 않게 한다
    if (terrain !== "ocean") {
        const path = layers[n - 2]
        path.amp *= 0.6
        path.wl *= 1.25
        const front = layers[n - 1]
        front.base += 0.04
        front.amp *= 0.75
    }
    return layers
}

function layerColor(c: Colors, d: number, night: number): RGB {
    const body = mix(c.far, c.near, d ** 0.9)
    // 먼 산일수록 하늘색에 묻힌다
    return mix(body, c.skyBottom, (1 - d) * 0.35 * (1 - night * 0.5))
}

// 서버에서 그린 첫 화면. 캔버스가 그려지기 전까지 빈 화면 대신 보인다
function posterBackground(
    terrain: Terrain,
    t: number,
    custom?: Partial<ColorProps>
) {
    const c = colorsAt(terrain, t, custom)
    return `linear-gradient(180deg, ${css(c.skyTop)} 0%, ${css(c.skyBottom)} 52%, ${css(
        mix(c.far, c.near, 0.4)
    )} 70%, ${css(c.near)} 100%)`
}

interface Engine {
    draw: (now: number) => void
    destroy: () => void
}

// 낙타 한 마리. 무리는 한 마리씩 각자 선 자리의 땅에 맞춰 그린다
function drawCamel(ctx: CanvasRenderingContext2D, s: number, step: number) {
    ctx.beginPath()
    ctx.ellipse(0, -20 * s, 15 * s, 8 * s, 0, 0, TAU)
    ctx.ellipse(-2 * s, -27 * s, 7 * s, 6 * s, 0, 0, TAU)
    ctx.fill()
    ctx.lineWidth = 3.2 * s
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(12 * s, -22 * s)
    ctx.quadraticCurveTo(22 * s, -26 * s, 21 * s, -36 * s)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(24 * s, -37 * s, 5 * s, 3 * s, 0.2, 0, TAU)
    ctx.fill()
    ctx.lineWidth = 2.4 * s
    for (const [lx, p] of [
        [-9, 0],
        [-5, Math.PI],
        [7, Math.PI],
        [11, 0],
    ]) {
        const swing = Math.sin(step + p) * 3 * s
        ctx.beginPath()
        ctx.moveTo(lx * s, -15 * s)
        ctx.lineTo(lx * s + swing, 0)
        ctx.stroke()
    }
}

function drawPerson(
    ctx: CanvasRenderingContext2D,
    x: number,
    s: number,
    step: number,
    lights: number,
    pack = false
) {
    ctx.lineCap = "round"
    ctx.lineWidth = 2.6 * s
    ctx.beginPath()
    ctx.arc(x, -30 * s, 3.6 * s, 0, TAU)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x, -26 * s)
    ctx.lineTo(x, -13 * s)
    ctx.stroke()
    for (const p of [0, Math.PI]) {
        ctx.beginPath()
        ctx.moveTo(x, -13 * s)
        ctx.lineTo(x + Math.sin(step + p) * 4 * s, 0)
        ctx.stroke()
    }
    if (pack) {
        ctx.fillRect(x - 6.5 * s, -26 * s, 5 * s, 9 * s)
        ctx.lineWidth = 1.4 * s
        ctx.beginPath()
        ctx.moveTo(x + 4 * s, -20 * s)
        ctx.lineTo(x + 7 * s, 0)
        ctx.stroke()
    }
    if (lights > 0.02) {
        const lx = x + 5 * s
        const ly = -16 * s
        const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 22 * s)
        glow.addColorStop(0, `rgba(255,200,120,${0.75 * lights})`)
        glow.addColorStop(1, "rgba(255,200,120,0)")
        const fill = ctx.fillStyle
        ctx.fillStyle = glow
        ctx.fillRect(lx - 22 * s, ly - 22 * s, 44 * s, 44 * s)
        ctx.fillStyle = `rgba(255,224,170,${lights})`
        ctx.beginPath()
        ctx.arc(lx, ly, 1.8 * s, 0, TAU)
        ctx.fill()
        ctx.fillStyle = fill
    }
}

function drawDeer(ctx: CanvasRenderingContext2D, s: number, step: number) {
    ctx.beginPath()
    ctx.ellipse(0, -22 * s, 13 * s, 6 * s, 0, 0, TAU)
    ctx.fill()
    ctx.lineCap = "round"
    ctx.lineWidth = 3 * s
    ctx.beginPath()
    ctx.moveTo(10 * s, -24 * s)
    ctx.lineTo(15 * s, -36 * s)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(18 * s, -37 * s, 5 * s, 2.8 * s, 0.3, 0, TAU)
    ctx.fill()
    ctx.lineWidth = 1.4 * s
    ctx.beginPath()
    ctx.moveTo(15 * s, -39 * s)
    ctx.lineTo(12 * s, -49 * s)
    ctx.moveTo(13 * s, -45 * s)
    ctx.lineTo(8 * s, -48 * s)
    ctx.moveTo(16 * s, -39 * s)
    ctx.lineTo(18 * s, -49 * s)
    ctx.stroke()
    ctx.lineWidth = 2 * s
    for (const [lx, p] of [
        [-9, 0],
        [-6, Math.PI],
        [7, Math.PI],
        [10, 0],
    ]) {
        ctx.beginPath()
        ctx.moveTo(lx * s, -18 * s)
        ctx.lineTo(lx * s + Math.sin(step + p) * 3.5 * s, 0)
        ctx.stroke()
    }
}

function drawCyclist(ctx: CanvasRenderingContext2D, s: number, phase: number) {
    ctx.lineCap = "round"
    ctx.lineWidth = 2.2 * s
    for (const wx of [-11, 11]) {
        ctx.beginPath()
        ctx.arc(wx * s, -8 * s, 8 * s, 0, TAU)
        ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(-11 * s, -8 * s)
    ctx.lineTo(-2 * s, -8 * s)
    ctx.lineTo(6 * s, -20 * s)
    ctx.lineTo(-5 * s, -20 * s)
    ctx.lineTo(-2 * s, -8 * s)
    ctx.moveTo(6 * s, -20 * s)
    ctx.lineTo(11 * s, -8 * s)
    ctx.stroke()
    // 사람
    ctx.lineWidth = 2.8 * s
    ctx.beginPath()
    ctx.moveTo(-4 * s, -22 * s)
    ctx.lineTo(3 * s, -34 * s)
    ctx.lineTo(8 * s, -22 * s)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(5 * s, -38 * s, 3.6 * s, 0, TAU)
    ctx.fill()
    const px = Math.cos(phase * 1.6) * 4 * s
    const py = Math.sin(phase * 1.6) * 4 * s
    ctx.beginPath()
    ctx.moveTo(-4 * s, -22 * s)
    ctx.lineTo(-2 * s + px, -8 * s + py)
    ctx.moveTo(-4 * s, -22 * s)
    ctx.lineTo(-2 * s - px, -8 * s - py)
    ctx.stroke()
}

function drawBoat(
    ctx: CanvasRenderingContext2D,
    s: number,
    fill: string,
    sail: string
) {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.moveTo(-22 * s, -6 * s)
    ctx.lineTo(22 * s, -6 * s)
    ctx.lineTo(15 * s, 3 * s)
    ctx.lineTo(-15 * s, 3 * s)
    ctx.closePath()
    ctx.fill()
    ctx.fillRect(-1 * s, -48 * s, 2 * s, 42 * s)
    ctx.fillStyle = sail
    ctx.beginPath()
    ctx.moveTo(2 * s, -46 * s)
    ctx.lineTo(20 * s, -10 * s)
    ctx.lineTo(2 * s, -10 * s)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-2 * s, -40 * s)
    ctx.lineTo(-15 * s, -10 * s)
    ctx.lineTo(-2 * s, -10 * s)
    ctx.closePath()
    ctx.fill()
}

function createEngine(
    container: HTMLDivElement,
    canvas: HTMLCanvasElement,
    read: () => Props,
    image: () => HTMLImageElement | null,
    live: boolean
): Engine | null {
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    let width = 1
    let height = 1
    let travel = 0
    let lastNow = performance.now()
    // 하루 순환은 페이지가 열린 때가 아니라 풍경이 처음 나타난 때부터 센다
    const born = performance.now()
    let shownT = -1
    let mouseX = 0
    let mouseY = 0
    let aimX = 0
    let aimY = 0
    let shooting: {
        x: number
        y: number
        vx: number
        vy: number
        life: number
    } | null = null
    let nextShooting = 3

    // 별, 구름, 날씨 입자는 한 번만 만들고 계속 재사용한다
    const stars = Array.from({ length: 140 }, () => ({
        x: Math.random(),
        y: Math.random() * 0.55,
        r: 0.4 + Math.random() * 1.2,
        p: Math.random() * TAU,
    }))
    const clouds = Array.from({ length: 6 }, () => ({
        x: Math.random(),
        y: 0.08 + Math.random() * 0.26,
        r: 0.08 + Math.random() * 0.12,
        v: 4 + Math.random() * 8,
        a: 0.2 + Math.random() * 0.28,
    }))
    const drops = Array.from({ length: 260 }, () => ({
        x: Math.random(),
        y: Math.random(),
        z: 0.4 + Math.random() * 0.6,
        p: Math.random() * TAU,
    }))

    // 필름 질감: 작은 노이즈 타일을 반복해서 깐다
    let grainPattern: CanvasPattern | null = null
    const tile = document.createElement("canvas")
    tile.width = tile.height = 128
    const tctx = tile.getContext("2d")
    if (tctx) {
        const data = tctx.createImageData(128, 128)
        for (let i = 0; i < data.data.length; i += 4) {
            const v = Math.random() > 0.5 ? 255 : 0
            data.data[i] = data.data[i + 1] = data.data[i + 2] = v
            data.data[i + 3] = Math.random() * 255
        }
        tctx.putImageData(data, 0, 0)
        grainPattern = ctx.createPattern(tile, "repeat")
    }

    const resize = () => {
        const props = read()
        width = Math.max(1, container.clientWidth)
        height = Math.max(1, container.clientHeight)
        const cap =
            props.quality === "high" ? 2 : props.quality === "low" ? 1 : 1.5
        const ratio = Math.min(window.devicePixelRatio || 1, cap)
        canvas.width = Math.round(width * ratio)
        canvas.height = Math.round(height * ratio)
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    resize()

    const targetTime = (props: Props, now: number) => {
        const time: TimeProps = {
            mode: "cycle",
            start: 0.42,
            cycle: 120,
            range: 0.5,
            ...props.time,
        }
        switch (time.mode) {
            case "cycle":
                return time.start + now / 1000 / Math.max(5, time.cycle)
            case "scroll": {
                const max =
                    document.documentElement.scrollHeight - window.innerHeight
                const progress = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0
                return time.start + progress * time.range
            }
            case "local": {
                // 방문자 시계로 6시 = 새벽, 12시 = 낮, 18시 = 해질녘, 0시 = 밤
                const d = new Date()
                const hours = d.getHours() + d.getMinutes() / 60
                return (hours - 6) / 24
            }
            case "theme":
                return window.matchMedia?.("(prefers-color-scheme: dark)")
                    .matches
                    ? 0.8
                    : 0.3
            default:
                return time.start
        }
    }

    const draw = (now: number) => {
        const props = read()
        const terrain = props.terrain ?? "desert"
        const motion: MotionProps = {
            speed: 1,
            scrollWalk: true,
            scrollAmount: 1,
            parallax: 0.5,
            ...props.motion,
        }
        const sky: SkyProps = {
            sun: true,
            stars: true,
            clouds: true,
            shootingStars: true,
            aurora: 0,
            ...props.sky,
        }
        const weather: WeatherProps = {
            type: "none",
            amount: 0.5,
            ...props.weather,
        }
        const traveler: TravelerProps = {
            type: "auto",
            size: 1,
            position: 0.3,
            lights: true,
            ...props.traveler,
        }
        const dt = live ? Math.min(0.05, (now - lastNow) / 1000) : 0
        lastNow = now

        // 시간은 목표값을 부드럽게 따라간다(스크롤, 테마 전환이 툭 끊기지 않게)
        const goal = targetTime(props, live ? now - born : 0)
        if (shownT < 0 || !live) shownT = goal
        else {
            let diff = goal - shownT
            diff -= Math.round(diff)
            shownT += diff * Math.min(1, dt * 4)
        }
        const t = wrap01(shownT)
        const night = nightAmount(t)
        const c = colorsAt(terrain, t, props.colors)

        travel += motion.speed * 40 * dt
        mouseX += (aimX - mouseX) * Math.min(1, dt * 3)
        mouseY += (aimY - mouseY) * Math.min(1, dt * 3)
        const seconds = live ? now / 1000 : 12

        // 하늘
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7)
        skyGradient.addColorStop(0, css(c.skyTop))
        skyGradient.addColorStop(1, css(c.skyBottom))
        ctx.fillStyle = skyGradient
        ctx.fillRect(0, 0, width, height)

        if (sky.stars && night > 0.01) {
            for (const star of stars) {
                const twinkle = 0.6 + 0.4 * Math.sin(seconds * 1.5 + star.p)
                ctx.fillStyle = `rgba(255,255,255,${night * twinkle * 0.9})`
                ctx.beginPath()
                ctx.arc(
                    star.x * width - mouseX * 6,
                    star.y * height - mouseY * 3,
                    star.r,
                    0,
                    TAU
                )
                ctx.fill()
            }
        }

        if (sky.aurora > 0 && night > 0.05) {
            ctx.save()
            ctx.globalCompositeOperation = "lighter"
            for (let band = 0; band < 3; band++) {
                const hue = band === 1 ? "140,120,255" : "80,255,190"
                for (let x = 0; x < width; x += 6) {
                    const y =
                        height * (0.16 + band * 0.05) +
                        Math.sin(x * 0.004 + seconds * 0.25 + band) * 34 +
                        Math.sin(x * 0.011 - seconds * 0.4) * 12
                    const tall =
                        70 + 50 * Math.sin(x * 0.007 + seconds * 0.3 + band * 2)
                    const strip = ctx.createLinearGradient(
                        0,
                        y - tall,
                        0,
                        y + 10
                    )
                    strip.addColorStop(0, `rgba(${hue},0)`)
                    strip.addColorStop(
                        0.8,
                        `rgba(${hue},${0.16 * sky.aurora * night})`
                    )
                    strip.addColorStop(1, `rgba(${hue},0)`)
                    ctx.fillStyle = strip
                    ctx.fillRect(x, y - tall, 6, tall + 10)
                }
            }
            ctx.restore()
        }

        if (sky.shootingStars && live && night > 0.5) {
            nextShooting -= dt
            if (!shooting && nextShooting <= 0) {
                shooting = {
                    x: width * (0.2 + Math.random() * 0.7),
                    y: height * (0.05 + Math.random() * 0.2),
                    vx: -(400 + Math.random() * 300),
                    vy: 160 + Math.random() * 120,
                    life: 1,
                }
                nextShooting = 3 + Math.random() * 5
            }
            if (shooting) {
                const tail = 0.12
                const line = ctx.createLinearGradient(
                    shooting.x,
                    shooting.y,
                    shooting.x - shooting.vx * tail,
                    shooting.y - shooting.vy * tail
                )
                line.addColorStop(
                    0,
                    `rgba(255,255,255,${shooting.life * night})`
                )
                line.addColorStop(1, "rgba(255,255,255,0)")
                ctx.strokeStyle = line
                ctx.lineWidth = 1.6
                ctx.beginPath()
                ctx.moveTo(shooting.x, shooting.y)
                ctx.lineTo(
                    shooting.x - shooting.vx * tail,
                    shooting.y - shooting.vy * tail
                )
                ctx.stroke()
                shooting.x += shooting.vx * dt
                shooting.y += shooting.vy * dt
                shooting.life -= dt * 1.4
                if (shooting.life <= 0) shooting = null
            }
        }

        // 해와 달: 0~0.5는 해, 0.5~1은 달이 같은 호를 따라 지나간다
        const horizon = height * 0.62
        const arc = (t % 0.5) / 0.5
        const sunX = width * (0.08 + 0.84 * arc) - mouseX * 10
        const sunY =
            horizon - Math.sin(arc * Math.PI) * height * 0.5 - mouseY * 5
        const isMoon = t >= 0.5
        const sunAlpha = smoothstep(0, 0.08, Math.sin(arc * Math.PI))
        if (sky.sun && sunAlpha > 0) {
            const glowR = Math.min(width, height) * (isMoon ? 0.22 : 0.38)
            const glow = ctx.createRadialGradient(
                sunX,
                sunY,
                0,
                sunX,
                sunY,
                glowR
            )
            glow.addColorStop(0, css(c.sun, (isMoon ? 0.35 : 0.55) * sunAlpha))
            glow.addColorStop(1, css(c.sun, 0))
            ctx.fillStyle = glow
            ctx.fillRect(sunX - glowR, sunY - glowR, glowR * 2, glowR * 2)
            ctx.fillStyle = css(c.sun, sunAlpha)
            ctx.beginPath()
            ctx.arc(
                sunX,
                sunY,
                (isMoon ? 24 : 32) * clamp(height / 700, 0.55, 1.3),
                0,
                TAU
            )
            ctx.fill()
        }

        if (sky.clouds) {
            const cloudColor = mix(
                mix([255, 255, 255], c.skyBottom, 0.35),
                c.skyTop,
                night * 0.6
            )
            for (const c0 of clouds) {
                const cloud = { ...c0, r: c0.r * Math.max(height, 360) }
                const span = width + cloud.r * 4
                const cx =
                    ((((cloud.x * span + seconds * cloud.v - mouseX * 14) %
                        span) +
                        span) %
                        span) -
                    cloud.r * 2
                const cy = cloud.y * height - mouseY * 6
                ctx.fillStyle = css(cloudColor, cloud.a * (1 - night * 0.4))
                ctx.beginPath()
                ctx.ellipse(cx, cy, cloud.r, cloud.r * 0.28, 0, 0, TAU)
                ctx.ellipse(
                    cx - cloud.r * 0.45,
                    cy + cloud.r * 0.05,
                    cloud.r * 0.5,
                    cloud.r * 0.22,
                    0,
                    0,
                    TAU
                )
                ctx.ellipse(
                    cx + cloud.r * 0.35,
                    cy - cloud.r * 0.08,
                    cloud.r * 0.55,
                    cloud.r * 0.3,
                    0,
                    0,
                    TAU
                )
                ctx.fill()
            }
        }

        // 지형: 먼 층부터 가까운 층 순서로
        const layers = makeLayers(terrain, props.layers ?? 6, props.relief ?? 1)
        const step = props.quality === "low" ? 6 : 4
        const travelerLayer = layers.length - 2
        let groundAt = (_x: number) => height
        let travelerColor: RGB = c.near
        const tx = width * clamp(traveler.position, 0, 1)
        const daylight = 1 - night
        const fogBands =
            weather.type === "fog" ? [1, Math.max(2, layers.length - 3)] : []

        for (let li = 0; li < layers.length; li++) {
            const layer = layers[li]
            const offset =
                travel * layer.speed + mouseX * motion.parallax * 50 * layer.d
            const lift = mouseY * motion.parallax * 10 * layer.d
            const color = layerColor(c, layer.d, night)
            const yAt = (x: number) =>
                height *
                    (layer.base -
                        layer.amp *
                            ridge(
                                terrain,
                                (x + offset) / layer.wl,
                                layer.seed,
                                seconds * (0.6 + layer.d)
                            )) +
                lift

            ctx.beginPath()
            ctx.moveTo(0, height)
            for (let x = 0; x <= width + step; x += step) ctx.lineTo(x, yAt(x))
            ctx.lineTo(width, height)
            ctx.closePath()
            const body = ctx.createLinearGradient(
                0,
                height * (layer.base - layer.amp),
                0,
                height
            )
            body.addColorStop(0, css(color))
            body.addColorStop(1, css(mix(color, c.near, 0.5 + 0.5 * layer.d)))
            ctx.fillStyle = body
            ctx.fill()

            // 능선에 비치는 햇빛
            ctx.strokeStyle = css(
                terrain === "ocean" ? [255, 255, 255] : c.sun,
                (terrain === "ocean" ? 0.22 : 0.14) *
                    (0.4 + daylight * 0.6) *
                    (1 - layer.d * 0.5)
            )
            ctx.lineWidth = terrain === "ocean" ? 1.2 : 1
            ctx.beginPath()
            for (let x = 0; x <= width + step; x += step) {
                const y = yAt(x)
                if (x === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
            ctx.stroke()

            // 바다에는 해 아래로 반짝이는 길이 생긴다
            if (terrain === "ocean" && li === 0 && sky.sun && sunAlpha > 0) {
                for (let y = yAt(sunX); y < height; y += 5) {
                    const spread = 6 + (y - horizon) * 0.25
                    const shimmer = 0.5 + 0.5 * Math.sin(y * 0.3 + seconds * 3)
                    ctx.fillStyle = css(c.sun, 0.18 * sunAlpha * shimmer)
                    ctx.fillRect(
                        sunX - spread / 2 + Math.sin(y + seconds) * 4,
                        y,
                        spread,
                        1.6
                    )
                }
            }

            // 숲은 능선 위에 나무를 심는다
            if (terrain === "forest" && layer.d > 0.15) {
                const spacing = 9 + 10 * layer.d
                const scale = 0.5 + layer.d * 1.3
                const first = Math.floor(offset / spacing)
                ctx.fillStyle = css(color)
                for (let k = first; k < first + width / spacing + 2; k++) {
                    if (hash(k + layer.seed) < 0.35) continue
                    const x =
                        k * spacing - offset + (hash(k * 3.1) - 0.5) * spacing
                    const y = yAt(x) + 2
                    const h = (16 + hash(k * 7.3) * 18) * scale
                    const w = h * 0.32
                    ctx.beginPath()
                    ctx.moveTo(x, y - h)
                    ctx.lineTo(x + w, y)
                    ctx.lineTo(x - w, y)
                    ctx.closePath()
                    ctx.fill()
                }
            }

            if (li === travelerLayer) {
                groundAt = yAt
                travelerColor = mix(color, [0, 0, 0], 0.35)
            }

            if (fogBands.includes(li)) {
                const fogY = height * (layer.base + 0.02)
                const fog = ctx.createLinearGradient(
                    0,
                    fogY - height * 0.12,
                    0,
                    fogY + height * 0.08
                )
                const fogColor = mix(c.skyBottom, [255, 255, 255], 0.25)
                fog.addColorStop(0, css(fogColor, 0))
                fog.addColorStop(0.55, css(fogColor, 0.55 * weather.amount))
                fog.addColorStop(1, css(fogColor, 0))
                ctx.fillStyle = fog
                const drift = Math.sin(seconds * 0.15 + li) * 30
                ctx.fillRect(
                    -40 + drift,
                    fogY - height * 0.12,
                    width + 80,
                    height * 0.2
                )
            }

            // 걷는 실루엣은 뒤에서 두 번째 층 위에 선다
            if (li === travelerLayer) {
                let type =
                    traveler.type === "auto"
                        ? AUTO_TRAVELER[terrain]
                        : traveler.type
                const img = image()
                if (type === "custom" && !img) type = "none"
                if (type !== "none") {
                    const s = traveler.size * clamp(height / 800, 0.5, 1.6)
                    const phase = travel * 0.09
                    const lights = traveler.lights ? night : 0
                    // 무리의 한 명 한 명이 자기 발밑 땅 높이와 기울기를 따른다.
                    // 기울기는 넓게 재서 능선 꼭대기에서 휙 꺾이지 않게 한다
                    const place = (
                        dx: number,
                        tilt: number,
                        draw: () => void
                    ) => {
                        const gx = tx + dx
                        const reach = 14 * s
                        const slope = Math.atan2(
                            groundAt(gx + reach) - groundAt(gx - reach),
                            reach * 2
                        )
                        ctx.save()
                        ctx.translate(gx, groundAt(gx) + 1)
                        ctx.rotate(clamp(slope, -0.5, 0.5) * tilt)
                        ctx.fillStyle = css(travelerColor)
                        ctx.strokeStyle = css(travelerColor)
                        draw()
                        ctx.restore()
                    }
                    if (type === "caravan") {
                        for (let k = 0; k < 3; k++) {
                            const step = phase + k * 1.7
                            place(-k * 62 * s, 0.9, () =>
                                drawCamel(ctx, s, step)
                            )
                            // 사람은 비탈에서도 똑바로 선다
                            if (k < 2)
                                place(-k * 62 * s + 36 * s, 0, () =>
                                    drawPerson(ctx, 0, s * 0.9, step, lights)
                                )
                        }
                    } else if (type === "hikers") {
                        for (let k = 0; k < 3; k++)
                            place(-k * 22 * s, 0, () =>
                                drawPerson(
                                    ctx,
                                    0,
                                    s,
                                    phase + k * 1.3,
                                    k === 0 ? lights : 0,
                                    true
                                )
                            )
                    } else if (type === "deer") {
                        for (let k = 0; k < 2; k++)
                            place(-k * 46 * s, 0.9, () =>
                                drawDeer(ctx, s, phase * 1.2 + k * 2)
                            )
                    } else if (type === "cyclist")
                        place(0, 0.9, () => drawCyclist(ctx, s, phase))
                    else if (type === "sailboat")
                        place(0, 1, () =>
                            drawBoat(
                                ctx,
                                s,
                                css(travelerColor),
                                css(
                                    mix(
                                        c.sun,
                                        travelerColor,
                                        0.35 + night * 0.4
                                    )
                                )
                            )
                        )
                    else if (type === "custom" && img)
                        place(0, 0.6, () => {
                            const h = 64 * s
                            const w =
                                (img.naturalWidth /
                                    Math.max(1, img.naturalHeight)) *
                                h
                            ctx.drawImage(img, -w / 2, -h, w, h)
                        })
                }
            }
        }

        // 비와 눈은 맨 앞에 내린다
        if (weather.type === "rain" || weather.type === "snow") {
            const count = Math.round(drops.length * clamp(weather.amount, 0, 1))
            for (let i = 0; i < count; i++) {
                const drop = drops[i]
                if (weather.type === "rain") {
                    drop.y += dt * (1.1 + drop.z)
                    if (drop.y > 1.05) drop.y -= 1.1
                    const x =
                        (((drop.x * width - drop.y * 80) % width) + width) %
                        width
                    const y = drop.y * height
                    ctx.strokeStyle = `rgba(220,230,255,${0.25 + drop.z * 0.25})`
                    ctx.lineWidth = drop.z
                    ctx.beginPath()
                    ctx.moveTo(x, y)
                    ctx.lineTo(x - 4, y + 12 * drop.z)
                    ctx.stroke()
                } else {
                    drop.y += dt * 0.08 * (0.5 + drop.z)
                    if (drop.y > 1.02) drop.y -= 1.04
                    const x =
                        drop.x * width +
                        Math.sin(seconds * 0.8 + drop.p) * 14 * drop.z
                    ctx.fillStyle = `rgba(255,255,255,${0.5 + drop.z * 0.4})`
                    ctx.beginPath()
                    ctx.arc(x, drop.y * height, 0.8 + drop.z * 1.8, 0, TAU)
                    ctx.fill()
                }
            }
        }

        const grain = props.grain ?? 0.06
        if (grain > 0 && grainPattern) {
            ctx.save()
            ctx.globalAlpha = grain
            ctx.translate(Math.random() * 128, Math.random() * 128)
            ctx.fillStyle = grainPattern
            ctx.fillRect(-128, -128, width + 256, height + 256)
            ctx.restore()
        }
    }

    const onScroll = () => {
        const props = read()
        const motion = { scrollWalk: true, scrollAmount: 1, ...props.motion }
        const y = window.scrollY
        if (motion.scrollWalk)
            travel += (y - lastScroll) * motion.scrollAmount * 0.6
        lastScroll = y
    }
    let lastScroll = window.scrollY
    const onPointer = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect()
        aimX = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1)
        aimY = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1)
    }

    const observer = new ResizeObserver(() => {
        resize()
        if (!live) draw(0)
    })
    observer.observe(container)

    // 화면에 보일 때만 그리고, 그때만 스크롤과 마우스를 듣는다
    let frame = 0
    let visible = false
    let running = false
    let lastDraw = 0
    const loop = (now: number) => {
        if (!running) return
        const fps = read().quality === "low" ? 30 : 60
        if (now - lastDraw >= 1000 / fps - 2) {
            lastDraw = now
            draw(now)
        }
        frame = requestAnimationFrame(loop)
    }
    const start = () => {
        if (running) return
        running = true
        lastNow = performance.now()
        lastScroll = window.scrollY
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("pointermove", onPointer, { passive: true })
        frame = requestAnimationFrame(loop)
    }
    const stop = () => {
        running = false
        cancelAnimationFrame(frame)
        window.removeEventListener("scroll", onScroll)
        window.removeEventListener("pointermove", onPointer)
    }

    let io: IntersectionObserver | null = null
    if (live) {
        io = new IntersectionObserver((entries) => {
            visible = entries[0]?.isIntersecting ?? true
            if (visible) start()
            else stop()
        })
        io.observe(container)
    }

    return {
        draw,
        destroy: () => {
            stop()
            io?.disconnect()
            observer.disconnect()
        },
    }
}

function prefersReducedMotion() {
    try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    } catch {
        return false
    }
}

function Landscape(props: Props) {
    const { terrain = "desert", style } = props
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef(props)
    propsRef.current = props
    const engineRef = useRef<Engine | null>(null)
    const imageRef = useRef<HTMLImageElement | null>(null)
    const imageSrc =
        props.traveler?.type === "custom"
            ? props.traveler?.image?.src
            : undefined

    const live = !isStatic
    useEffect(() => {
        const container = containerRef.current
        const canvas = canvasRef.current
        if (!container || !canvas) return
        const animate = live && !prefersReducedMotion()
        const engine = createEngine(
            container,
            canvas,
            () => propsRef.current,
            () => imageRef.current,
            animate
        )
        engineRef.current = engine
        if (!engine) return
        if (!animate) engine.draw(0)
        // 첫 그림이 나오면 서버에서 그린 배경 위로 부드럽게 나타난다
        requestAnimationFrame(() => {
            canvas.style.opacity = "1"
        })
        return () => {
            engine.destroy()
            engineRef.current = null
        }
    }, [live])

    // 움직이지 않는 화면(캔버스 편집, 모션 줄이기)에서는 설정이 바뀔 때마다 다시 그린다
    useEffect(() => {
        if (!live || prefersReducedMotion()) engineRef.current?.draw(0)
    })

    useEffect(() => {
        if (!imageSrc) {
            imageRef.current = null
            return
        }
        const img = new Image()
        img.onload = () => {
            imageRef.current = img
            engineRef.current?.draw(0)
        }
        img.src = imageSrc
        return () => {
            img.onload = null
        }
    }, [imageSrc])

    const time = { mode: "cycle", start: 0.42, ...props.time }
    const overlay: OverlayProps = {
        type: "none",
        color: "#000000",
        strength: 0.45,
        ...props.overlay,
    }
    const shade = css(parseColor(overlay.color), clamp(overlay.strength, 0, 1))
    const clear = css(parseColor(overlay.color), 0)
    const overlayBackground =
        overlay.type === "left"
            ? `linear-gradient(90deg, ${shade} 0%, ${clear} 65%)`
            : overlay.type === "bottom"
              ? `linear-gradient(0deg, ${shade} 0%, ${clear} 60%)`
              : overlay.type === "center"
                ? `radial-gradient(ellipse at center, ${shade} 0%, ${clear} 70%)`
                : "none"

    return (
        <div
            ref={containerRef}
            aria-hidden="true"
            style={{
                width: 1200,
                height: 700,
                ...style,
                position: "relative",
                overflow: "hidden",
                background: posterBackground(terrain, time.start, props.colors),
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
                    opacity: 0,
                    transition: "opacity .6s ease",
                }}
            />
            {overlay.type !== "none" && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: overlayBackground,
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

// ---- component ----
// 무료판: 사막 한 가지, 고정 색, 낙타 행렬. 나머지는 Pro에서 연다

interface LiteProps {
    time: Partial<TimeProps>
    motion: Partial<MotionProps>
    layers: number
    relief: number
    stars: boolean
    clouds: boolean
    caravan: boolean
    grain: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function LivingLandscapeLite(props: LiteProps) {
    const mode = props.time?.mode === "fixed" ? "fixed" : "cycle"
    return (
        <Landscape
            terrain="desert"
            time={{ ...props.time, mode }}
            motion={props.motion}
            layers={props.layers}
            relief={props.relief}
            sky={{
                sun: true,
                stars: props.stars ?? true,
                clouds: props.clouds ?? true,
                shootingStars: false,
                aurora: 0,
            }}
            weather={{ type: "none" }}
            traveler={{
                type: props.caravan === false ? "none" : "caravan",
                size: 1,
                position: 0.3,
                lights: true,
            }}
            colors={{ custom: false }}
            overlay={{ type: "none" }}
            grain={props.grain}
            quality="auto"
            style={props.style}
        />
    )
}

addPropertyControls(LivingLandscapeLite, {
    time: {
        type: ControlType.Object,
        title: "Time",
        description:
            "Free version. [Living Landscape Pro](https://joviseo.vercel.app) adds 5 terrains, your own colors, weather, aurora, scroll and clock-synced time, more travelers and text shade.",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["fixed", "cycle"],
                optionTitles: ["Fixed", "Day Cycle"],
                defaultValue: "cycle",
            },
            start: {
                type: ControlType.Number,
                title: "Time of Day",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.42,
                description: "0 dawn, 0.25 day, 0.5 sunset, 0.75 night",
            },
            cycle: {
                type: ControlType.Number,
                title: "Day Length",
                min: 10,
                max: 600,
                step: 5,
                unit: "s",
                defaultValue: 120,
                hidden: (time) => time.mode === "fixed",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Walk Speed",
                min: 0,
                max: 4,
                step: 0.1,
                defaultValue: 1,
            },
            scrollWalk: {
                type: ControlType.Boolean,
                title: "Scroll Walk",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
            },
            parallax: {
                type: ControlType.Number,
                title: "Mouse Depth",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.5,
            },
        },
    },
    layers: {
        type: ControlType.Number,
        title: "Layers",
        min: 3,
        max: 7,
        step: 1,
        defaultValue: 6,
    },
    relief: {
        type: ControlType.Number,
        title: "Relief",
        min: 0.4,
        max: 1.6,
        step: 0.05,
        defaultValue: 1,
    },
    stars: {
        type: ControlType.Boolean,
        title: "Stars",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    clouds: {
        type: ControlType.Boolean,
        title: "Clouds",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    caravan: {
        type: ControlType.Boolean,
        title: "Caravan",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
    },
    grain: {
        type: ControlType.Number,
        title: "Film Grain",
        min: 0,
        max: 0.15,
        step: 0.01,
        defaultValue: 0.06,
    },
})
