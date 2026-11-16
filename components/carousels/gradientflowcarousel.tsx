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


type Photo = { src?: string; srcSet?: string; alt?: string; positionX?: number | string; positionY?: number | string }
type Item = { sample?: string; image?: Photo | string; title?: string; color1?: string; color2?: string; color3?: string; link?: string; newTab?: boolean }
type Palette = [string, string, string]
type Props = {
    items?: Item[]
    paletteMode?: "image" | "custom"
    startSlide?: number
    padding?: string | number
    gap?: string
    radius?: string | number
    imageRadius?: string | number
    imageShape?: "portrait" | "square" | "wide"
    font?: React.CSSProperties
    showTitle?: boolean
    duration?: number
    flow?: boolean
    accessibleLabel?: string
    style?: React.CSSProperties
}

const defaults: Item[] = [
    {
        "sample": "Ember",
        "title": "Ember",
        "image": {
            "src": "https://framerusercontent.com/images/WvmVPcTMG5iP0NztCiIeicCSEis.png",
            "alt": "Ember — sculptural colored glass and refracted light"
        },
        "color1": "#102F88",
        "color2": "#D24E34",
        "color3": "#502654",
        "link": "",
        "newTab": false
    },
    {
        "sample": "Jade",
        "title": "Jade",
        "image": {
            "src": "https://framerusercontent.com/images/Yu5f3SctnaVsx3ABHaUJT53x5pQ.png",
            "alt": "Jade — sculptural colored glass and refracted light"
        },
        "color1": "#123E37",
        "color2": "#367D68",
        "color3": "#3B173E",
        "link": "",
        "newTab": false
    },
    {
        "sample": "Sol",
        "title": "Sol",
        "image": {
            "src": "https://framerusercontent.com/images/aoLOOaEU1eHr5EgDSR8M6iqNKlk.png",
            "alt": "Sol — sculptural colored glass and refracted light"
        },
        "color1": "#6B2033",
        "color2": "#DC7637",
        "color3": "#7B4D8A",
        "link": "",
        "newTab": false
    },
    {
        "sample": "Prism",
        "title": "Prism",
        "image": {
            "src": "https://framerusercontent.com/images/Cw1jmtVk2iR0M1buL9S0e19rBq0.png",
            "alt": "A faceted translucent violet glass monolith, bold diagonal cut, against luminous acid yellow, delicate lavender caustics"
        },
        "color1": "#38224F",
        "color2": "#8A8338",
        "color3": "#69428B",
        "link": "",
        "newTab": false
    },
    {
        "sample": "Azure",
        "title": "Azure",
        "image": {
            "src": "https://framerusercontent.com/images/TNaCTla60DCcbwWzvyiBIeKnhzU.png",
            "alt": "Two interlocking rounded cyan optical-glass arches against deep ultramarine, reflected electric pink edge light"
        },
        "color1": "#102357",
        "color2": "#136B89",
        "color3": "#77315D",
        "link": "",
        "newTab": false
    },
    {
        "sample": "Rose",
        "title": "Rose",
        "image": {
            "src": "https://framerusercontent.com/images/9fkGMIdn9nNCWnljD40ZAEkvxA.png",
            "alt": "A sculptural rose-pink glass knot with broad smooth folds against burgundy, restrained apricot highlights"
        },
        "color1": "#471626",
        "color2": "#A55164",
        "color3": "#733047",
        "link": "",
        "newTab": false
    },
    {
        "sample": "Citrus",
        "title": "Citrus",
        "image": {
            "src": "https://framerusercontent.com/images/KkbUtl3Rlh887hilOu7GDvWop2I.png",
            "alt": "A single spiralling yellow-green translucent glass shell against deep teal, luminous citron rim and fluid optical refractions"
        },
        "color1": "#073D3B",
        "color2": "#758827",
        "color3": "#22665B",
        "link": "",
        "newTab": false
    },
    {
        "sample": "Pearl",
        "title": "Pearl",
        "image": {
            "src": "https://framerusercontent.com/images/T5haBqZ1cS5d4GtV3ZUrMqsdJe8.png",
            "alt": "A pearlescent ice-blue curved glass disc hovering above a peach surface against saturated periwinkle, subtle tangerine reflected light"
        },
        "color1": "#363C79",
        "color2": "#9A655C",
        "color3": "#527D95",
        "link": "",
        "newTab": false
    }
]

const paletteCache = new Map<string, Promise<Palette | null>>()
const mod = (n: number, d: number) => ((n % d) + d) % d
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const source = (image?: Photo | string) => typeof image === "string" ? image : image?.src || ""
const fallback = (item?: Item): Palette => [item?.color1 || "#B66B64", item?.color2 || "#E8BA9D", item?.color3 || "#68758F"]

function focalPosition(value?: number | string): string {
    if (value === undefined || value === null) return "50%"
    const amount = typeof value === "number" ? value : parseFloat(value)
    if (!Number.isFinite(amount)) return "50%"
    const isPercent = typeof value === "string" && value.includes("%")
    return `${clamp(isPercent || Math.abs(amount) > 1 ? amount : amount * 100, 0, 100)}%`
}

function harmoniousColor(rgb: number[], targetLightness: number): string {
    const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
    const l = (max + min) / 2
    let h = 0
    if (d) {
        h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
        h *= 60
    }
    const saturation = d === 0 ? 0.08 : d / (1 - Math.abs(2 * l - 1))
    return `hsl(${Math.round(h)}, ${Math.round(clamp(saturation, 0.12, 0.44) * 100)}%, ${targetLightness}%)`
}

// A small, cached, offscreen sample. CORS or image errors always resolve to the editable palette.
function samplePalette(src: string): Promise<Palette | null> {
    if (!src || typeof window === "undefined" || src.startsWith("REPLACE_")) return Promise.resolve(null)
    const cached = paletteCache.get(src)
    if (cached) return cached
    const promise = new Promise<Palette | null>((resolve) => {
        const img = new Image()
        let finished = false
        const finish = (result: Palette | null) => {
            if (finished) return
            finished = true
            window.clearTimeout(timeout)
            img.onload = null
            img.onerror = null
            resolve(result)
        }
        const timeout = window.setTimeout(() => finish(null), 6500)
        img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onerror = () => finish(null)
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas")
                canvas.width = canvas.height = 32
                const context = canvas.getContext("2d", { willReadFrequently: true })
                if (!context) return finish(null)
                context.drawImage(img, 0, 0, 32, 32)
                const pixels = context.getImageData(0, 0, 32, 32).data
                const buckets = new Map<number, { total: number[]; count: number; score: number }>()
                for (let i = 0; i < pixels.length; i += 4) {
                    if (pixels[i + 3] < 180) continue
                    const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]]
                    const high = Math.max(...rgb), low = Math.min(...rgb)
                    if (high < 35 || low > 235) continue
                    const key = (rgb[0] >> 5) * 64 + (rgb[1] >> 5) * 8 + (rgb[2] >> 5)
                    const bucket = buckets.get(key) || { total: [0, 0, 0], count: 0, score: 0 }
                    rgb.forEach((v, index) => bucket.total[index] += v)
                    bucket.count++
                    bucket.score += 0.3 + (high - low) / 255
                    buckets.set(key, bucket)
                }
                const ranked = Array.from(buckets.values()).sort((a, b) => b.score - a.score)
                const selected: number[][] = []
                for (const bucket of ranked) {
                    const color = bucket.total.map(value => value / bucket.count)
                    if (selected.every(other => Math.hypot(...color.map((v, i) => v - other[i])) > 68)) selected.push(color)
                    if (selected.length === 3) break
                }
                if (!selected.length) return finish(null)
                while (selected.length < 3) selected.push(selected[0])
                finish([harmoniousColor(selected[0], 46), harmoniousColor(selected[1], 70), harmoniousColor(selected[2], 57)])
            } catch {
                finish(null)
            }
        }
        img.src = src
    })
    if (paletteCache.size > 100) paletteCache.delete(paletteCache.keys().next().value as string)
    paletteCache.set(src, promise)
    return promise
}

const LIQUID_FRAGMENT = "\n\nconst float GOLDEN_ANGLE = 2.3999632;\nconst float TAU = 6.28318530;\n\n\nuvec3 hash3(uvec3 v) {\n    v = v * 1664525u + 1013904223u;\n    v.x += v.y * v.z;\n    v.y += v.z * v.x;\n    v.z += v.x * v.y;\n    v ^= v >> 16u;\n    v.x += v.y * v.z;\n    v.y += v.z * v.x;\n    v.z += v.x * v.y;\n    return v;\n}\n\n\nvec3 seedRandom(float seedVal) {\n    uvec3 s = uvec3(\n        floatBitsToUint(seedVal),\n        floatBitsToUint(seedVal * 1.5 + 7.31),\n        floatBitsToUint(seedVal * 2.7 + 13.37)\n    );\n    s = hash3(s);\n    return vec3(s) / float(0xFFFFFFFFu);\n}\n\n\nvec3 toLinear(vec3 c) {\n    return pow(c, vec3(2.2));\n}\n\nvec3 toSrgb(vec3 c) {\n    return pow(clamp(c, 0.0, 1.0), vec3(0.4545));\n}\n\nvec3 linearToOklab(vec3 c) {\n    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;\n    float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;\n    float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;\n    \n    l = pow(max(l, 0.0), 1.0/3.0);\n    m = pow(max(m, 0.0), 1.0/3.0);\n    s = pow(max(s, 0.0), 1.0/3.0);\n    \n    return vec3(\n        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,\n        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,\n        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s\n    );\n}\n\nvec3 oklabToLinear(vec3 c) {\n    float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;\n    float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;\n    float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;\n    \n    l = l * l * l;\n    m = m * m * m;\n    s = s * s * s;\n    \n    return vec3(\n        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,\n        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,\n        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s\n    );\n}\n\nvec3 oklabToLch(vec3 lab) {\n    return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));\n}\n\nvec3 lchToOklab(vec3 lch) {\n    return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));\n}\n\nvec3 mixLch(vec3 lab0, vec3 lab1, float t) {\n    vec3 lch0 = oklabToLch(lab0);\n    vec3 lch1 = oklabToLch(lab1);\n    \n    if (lch0.y < 0.05) lch0.z = lch1.z;\n    if (lch1.y < 0.05) lch1.z = lch0.z;\n    \n    float dh = lch1.z - lch0.z;\n    if (dh > 3.14159265) dh -= 6.28318530;\n    if (dh < -3.14159265) dh += 6.28318530;\n    \n    return lchToOklab(vec3(\n        mix(lch0.x, lch1.x, t),\n        mix(lch0.y, lch1.y, t),\n        lch0.z + dh * t\n    ));\n}\n\n\nvec3 getColor(int idx) {\n    if (u_colors_length < 1) return vec3(0.0);\n    int safeIdx = clamp(idx, 0, u_colors_length - 1);\n    return u_colors[safeIdx].rgb;\n}\n\nvec3 paletteN(float t, int count) {\n    if (count < 1) return vec3(0.0);\n    if (count < 2) return toLinear(getColor(0));\n    \n    float segmentSize = 1.0 / float(count - 1);\n    t = clamp(t, 0.0, 1.0);\n    int idx = min(int(floor(t / segmentSize)), count - 2);\n    float localT = clamp((t - float(idx) * segmentSize) / segmentSize, 0.0, 1.0);\n    \n    vec3 lab0 = linearToOklab(toLinear(getColor(idx)));\n    vec3 lab1 = linearToOklab(toLinear(getColor(idx + 1)));\n    \n    return oklabToLinear(mix(lab0, lab1, localT));\n}\n\n\nfloat IGN(vec2 uv) {\n    return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));\n}\n\nfloat quickNoise(vec2 I) {\n    return fract(sin(dot(I, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\n\nfloat getDither(vec2 I, float mode) {\n    if (mode < 0.5) return 0.5;          \n    if (mode < 1.5) return IGN(I);       \n    return quickNoise(I);                \n}\n\n\nvec3 softGamutMap(vec3 linearRgb) {\n    float maxC = max(linearRgb.r, max(linearRgb.g, linearRgb.b));\n    float minC = min(linearRgb.r, min(linearRgb.g, linearRgb.b));\n    \n    if (minC >= 0.0 && maxC <= 1.0) return linearRgb;\n    \n    vec3 lab = linearToOklab(max(linearRgb, 0.0));\n    float L = clamp(lab.x, 0.0, 1.0);\n    float C = length(lab.yz);\n    float h = atan(lab.z, lab.y);\n    \n    float maxChroma = 0.4 * (1.0 - pow(abs(2.0 * L - 1.0), 2.0));\n    \n    if (C > maxChroma * 0.7) {\n        float knee = maxChroma * 0.7;\n        C = knee + (maxChroma - knee) * tanh(min((C - knee) / (maxChroma - knee + 0.001), 10.0));\n    }\n    \n    return clamp(oklabToLinear(vec3(L, C * cos(h), C * sin(h))), 0.0, 1.0);\n}\n\nvec3 applyContrastSaturation(vec3 linearRgb, float contrast, float saturation) {\n    vec3 lab = linearToOklab(linearRgb);\n    float C = length(lab.yz);\n    float h = atan(lab.z, lab.y);\n    \n    lab.x = clamp((lab.x - 0.5) * contrast + 0.5, 0.0, 1.0);\n    C *= saturation;\n    lab.y = C * cos(h);\n    lab.z = C * sin(h);\n    \n    return oklabToLinear(lab);\n}\n\n\nvoid main() {\n    vec2 fragCoord = v_uv * u_resolution;\n    vec2 r = u_resolution;\n    vec2 p = (fragCoord * 2.0 - r) / r.y;\n    \n    int colorCount = u_colors_length;\n    \n    \n    if (colorCount < 1) {\n        fragColor = vec4(0.0, 0.0, 0.0, 1.0);\n        return;\n    }\n\n    float t = u_time * 0.3;\n    \n    \n    float looping = step(0.5, u_loop);\n    float phase = TAU * u_time / max(u_loop, 0.01);\n    float radius = u_loop * u_speed * 0.3 / TAU;\n    float tA = sin(phase) * radius;\n    float tB = (1.0 - cos(phase)) * radius;\n    \n    \n    vec3 seedOffset = seedRandom(u_seed);\n    vec3 seedOffset2 = seedRandom(u_seed + 100.0);\n    \n    \n    float seedAngle = u_seed * GOLDEN_ANGLE;\n    vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;\n    \n    \n    float cs = cos(seedAngle);\n    float sn = sin(seedAngle);\n    mat2 rot = mat2(cs, -sn, sn, cs);\n    p = rot * p;\n\n    \n    \n    \n    vec2 pushField = texture(u_push_buffer, v_uv).xy;\n    p -= rot * pushField * 2.0;\n    \n    \n    float dither = getDither(floor(fragCoord / u_pixelRatio), u_ditherMode);\n    \n    \n    float totalVal = 0.0;\n    float totalWeight = 0.0;\n    int turbIter = int(u_turbIter);\n    \n    float freq = 1.0 / max(u_turbFreq, 0.01);\n    \n    for (float i = 0.0; i < 4.0; i++) {\n        float eph = i / 4.0;\n       \n        vec2 q = p * u_scale;\n        float sq = eph * eph;\n        \n        if (u_jellify > 0.5) {\n            q.yx *= mix(1.0, 0.5, 1.0 - exp(-sq));\n        }\n        \n        float a = seedPhase.x;\n        float d = seedPhase.y;\n        \n        for (int j = 2; j < 13; j++) {\n            if (j >= turbIter) break;\n            float fj = float(j);\n            \n            float t1 = mix(t * u_speed, tA, looping);\n            float t2 = mix(t * u_speed, tB, looping);\n            q += u_turbAmp * sin(q.yx / freq * fj + t1 + vec2(a, d) + seedOffset.xy * fj) / fj;\n            a += cos(fj + d * 1.2 + q.x * 2.0 - t1 + seedOffset2.z + t2 * 0.3 * looping);\n            d += sin(fj * q.y + a + seedOffset.z + t1 + seedOffset2.y + t2 * 0.3 * looping);\n        }\n        \n        float v = 0.5 + 0.5 * sin(length(q.yx + vec2(a, d) * 0.2) * u_waveFreq + i * i + seedOffset.x);\n        float weight = smoothstep(0.0, 0.5, eph) * smoothstep(1.0, 0.5, eph);\n        totalVal += v * weight;\n        totalWeight += weight;\n    }\n    \n    float val = totalVal / totalWeight;\n    val = clamp((val - 0.3) / 0.4, 0.0, 1.0);\n    val = pow(val, exp(-u_distBias));\n    val = clamp(val + (dither - 0.5) * u_dither, 0.0, 1.0);\n    \n    vec3 col = paletteN(val, colorCount);\n    col *= u_exposure;\n    col = applyContrastSaturation(col, u_contrast, u_saturation);\n    col = softGamutMap(col);\n    col = toSrgb(col);\n    \n    fragColor = vec4(col, 1.0);\n}\n"
const LIQUID_PUSH = "\nvoid main() {\n    float aspect = u_resolution.x / u_resolution.y;\n    vec2 aspectFix = vec2(aspect, 1.0);\n\n    vec2 texel = 1.0 / u_resolution;\n\n    \n    vec4 prev = texture(u_push_buffer, v_uv);\n    vec2 c  = prev.xy;\n    vec2 nl = texture(u_push_buffer, v_uv - vec2(texel.x, 0.0)).xy;\n    vec2 nr = texture(u_push_buffer, v_uv + vec2(texel.x, 0.0)).xy;\n    vec2 nd = texture(u_push_buffer, v_uv - vec2(0.0, texel.y)).xy;\n    vec2 nu = texture(u_push_buffer, v_uv + vec2(0.0, texel.y)).xy;\n\n    vec2 blurred = (nl + nr + nd + nu) * 0.25;\n    vec2 field = mix(c, blurred, 0.12);\n\n    float r = clamp(u_deltaTime * 60.0, 0.0, 3.0);\n    float decay = pow(mix(0.86, 0.985, clamp(u_mousePersist, 0.0, 1.0)), r);\n    field *= decay;\n\n    \n    \n    \n    \n    vec2 rawVel = u_mousePosition.zw * aspectFix * u_mouseHover;\n    float smoothK = 1.0 - pow(0.75, r); \n    vec2 mouseVel = mix(prev.zw, rawVel, smoothK);\n\n    float speed    = length(mouseVel);\n    float brush    = max(u_mouseRadius * 0.1, 0.001);\n\n    float speedPerSec = speed / max(u_deltaTime, 1e-4);\n    float moving      = 1.0 - exp(-speedPerSec * 0.5);\n\n    vec2 dir       = speed > 1e-5 ? mouseVel / speed : vec2(1.0, 0.0);\n    vec2 ortho     = vec2(-dir.y, dir.x);\n\n    vec2 toMouse   = (v_uv - u_mousePosition.xy) * aspectFix;\n    \n\n    float along    = dot(toMouse, dir);\n    float across   = dot(toMouse, ortho);\n    float ra       = brush * (1.0 + u_mouseStretch * moving);\n    float rb       = brush;\n    float d2       = (along * along) / (ra * ra) + (across * across) / (rb * rb);\n    float falloff  = exp(-d2);\n\n    field += mouseVel * falloff * (u_mousePush * 0.1) * u_mouseHover;\n\n    field = clamp(field, -1.0, 1.0);\n\n    fragColor = vec4(field, mouseVel);\n}\n"
const LIQUID_DEFAULTS = {"seed": 648, "speed": 0.3, "loop": 0, "scale": 0.42, "turbAmp": 0.6, "turbFreq": 0.65, "turbIter": 5, "waveFreq": 1.65, "distBias": 0, "jellify": false, "mousePush": 0.5, "mouseRadius": 1, "mouseStretch": 0, "mousePersist": 0.8, "ditherMode": 0, "dither": 0.05, "exposure": 1.1, "contrast": 1.02, "saturation": 1}

function LiquidSurface({ colors, moving, instant }: { colors: Palette; moving: boolean; instant: boolean }) {
    const element = React.useRef<HTMLCanvasElement>(null)
    const settings = React.useRef({ colors, moving, instant })
    settings.current = { colors, moving, instant }
    const wake = React.useRef<() => void>(() => {})
    const clock = React.useRef(0)
    const [ready, setReady] = React.useState(false)
    const [generation, setGeneration] = React.useState(0)
    React.useEffect(() => {
        const canvas = element.current
        if (!canvas) return
        const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" })
        if (!gl) return
        let frame = 0, previous = 0, disposed = false, onscreen = true, shown = false
        const programs: WebGLProgram[] = [], shaders: WebGLShader[] = [], textures: WebGLTexture[] = [], buffers: WebGLFramebuffer[] = []
        const makeShader = (type: number, source: string) => {
            const shader = gl.createShader(type)!
            shaders.push(shader); gl.shaderSource(shader, source); gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed")
            return shader
        }
        const header = `#version 300 es\nprecision highp float; precision highp int;\nin vec2 v_uv; out vec4 fragColor;\nuniform vec2 u_resolution; uniform float u_time,u_deltaTime,u_pixelRatio;\nuniform sampler2D u_push_buffer; uniform vec4 u_mousePosition; uniform float u_mouseHover;\nuniform vec4 u_colors[8]; uniform int u_colors_length;\n` + Object.keys(LIQUID_DEFAULTS).filter(k => k !== "colors").map(k => `uniform float u_${k};`).join("\n")
        const makeProgram = (fragment: string) => {
            const program = gl.createProgram()!; programs.push(program)
            gl.attachShader(program, makeShader(gl.VERTEX_SHADER, `#version 300 es\nin vec2 position; out vec2 v_uv; void main(){v_uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`))
            gl.attachShader(program, makeShader(gl.FRAGMENT_SHADER, header + fragment)); gl.linkProgram(program)
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Shader link failed")
            return program
        }
        let vertexBuffer: WebGLBuffer | null = null
        const cleanupGPU = () => { programs.forEach(p => gl.deleteProgram(p)); shaders.forEach(s => gl.deleteShader(s)); textures.forEach(t => gl.deleteTexture(t)); buffers.forEach(b => gl.deleteFramebuffer(b)); gl.deleteBuffer(vertexBuffer) }
        try {
            if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("Float framebuffer unavailable")
            const push = makeProgram(LIQUID_PUSH), surface = makeProgram(LIQUID_FRAGMENT)
            vertexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
            for (let i=0;i<2;i++) {
                const texture=gl.createTexture()!; textures.push(texture); gl.bindTexture(gl.TEXTURE_2D,texture)
                gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST)
                gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)
                gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,1,1,0,gl.RGBA,gl.HALF_FLOAT,null)
                const buffer=gl.createFramebuffer()!; buffers.push(buffer); gl.bindFramebuffer(gl.FRAMEBUFFER,buffer)
                gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0)
                if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error("Framebuffer unavailable")
                gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT)
            }
            const locations = new Map<WebGLProgram, Record<string, WebGLUniformLocation | null>>()
            programs.forEach(program => {
                const names=[...Object.keys(LIQUID_DEFAULTS),"colors","resolution","time","deltaTime","pixelRatio","push_buffer","mousePosition","mouseHover","colors_length"]
                locations.set(program,Object.fromEntries(names.map(k=>[k,gl.getUniformLocation(program,`u_${k === "colors" ? "colors[0]" : k}`)])))
            })
            const parser=document.createElement("canvas").getContext("2d")!
            const parse=(value:string)=> { parser.clearRect(0,0,1,1); parser.fillStyle=value; parser.fillRect(0,0,1,1); return Array.from(parser.getImageData(0,0,1,1).data).map(v=>v/255) }
            let key="", target:number[] = [], current:number[] = [], velocity:number[] = [], ping=0
            const colorBuffer=new Float32Array(12)
            const attributes=new Map<WebGLProgram,number>()
            programs.forEach(program=>{
                gl.useProgram(program)
                const u=locations.get(program)!
                attributes.set(program,gl.getAttribLocation(program,"position"))
                Object.entries(LIQUID_DEFAULTS).forEach(([k,v])=>{if(k!=="colors")gl.uniform1f(u[k],k==="speed"?.12:Number(v))})
                gl.uniform4f(u.mousePosition,0,0,0,0);gl.uniform1f(u.mouseHover,0)
                gl.uniform1i(u.colors_length,3);gl.uniform1i(u.push_buffer,0)
            })
            let width=1,height=1,ratio=1
            const measure=()=>{
                const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight)
                ratio=Math.min(1,Math.sqrt(1100000/(w*h)))
                width=Math.round(w*ratio);height=Math.round(h*ratio)
            }
            measure()
            const draw=(now:number)=> {
                frame=0
                if(disposed || document.hidden || !onscreen || gl.isContextLost()) { previous=0; return }
                const dt=previous ? Math.min((now-previous)/1000,.05) : 1/60; previous=now
                const config=settings.current
                const nextKey=config.colors.join("|")
                if(key!==nextKey) { key=nextKey; target=config.colors.flatMap(parse); if(!current.length){current=[...target];velocity=target.map(()=>0)} }
                let distance=0
                // Critically damped color motion retains velocity when interrupted.
                const omega=3.6, decay=Math.exp(-omega*dt)
                for(let i=0;i<current.length;i++){
                    const value=current[i]
                    if(config.instant){velocity[i]=0;current[i]=target[i];continue}
                    const offset=value-target[i], impulse=velocity[i]+omega*offset
                    const next=target[i]+(offset+impulse*dt)*decay
                    velocity[i]=(velocity[i]-omega*impulse*dt)*decay
                    distance=Math.max(distance,Math.abs(target[i]-next),Math.abs(velocity[i]))
                    current[i]=next
                }
                if(config.moving) clock.current+=dt
                if(canvas.width!==width || canvas.height!==height) {canvas.width=width;canvas.height=height}
                const render=(program:WebGLProgram,pass:boolean)=> {
                    gl.useProgram(program)
                    const u=locations.get(program)!
                    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer)
                    const attr=attributes.get(program)!; gl.enableVertexAttribArray(attr); gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0)
                    gl.uniform1f(u.pixelRatio,ratio);gl.uniform1f(u.time,clock.current);gl.uniform1f(u.deltaTime,dt)
                    colorBuffer.set(current);gl.uniform4fv(u.colors,colorBuffer)
                    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures[ping]);gl.uniform1i(u.push_buffer,0)
                    gl.bindFramebuffer(gl.FRAMEBUFFER,pass ? buffers[1-ping] : null)
                    gl.viewport(0,0,pass ? 1 : width,pass ? 1 : height)
                    gl.uniform2f(u.resolution,pass ? 1 : width,pass ? 1 : height)
                    gl.drawArrays(gl.TRIANGLES,0,6)
                }
                render(push,true);ping=1-ping;render(surface,false)
                if(!shown){shown=true;setReady(true)}
                if(config.moving || distance>.001) frame=requestAnimationFrame(draw)
                else previous=0
            }
            const start=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(draw)}
            wake.current=start
            const resize=new ResizeObserver(()=>{measure();start()});resize.observe(canvas)
            const visibility=()=>{previous=0;if(document.hidden){cancelAnimationFrame(frame);frame=0}else start()}
            document.addEventListener("visibilitychange",visibility)
            const intersection=new IntersectionObserver(entries=>{onscreen=entries[0].isIntersecting;visibility()});intersection.observe(canvas)
            const lost=(event:Event)=>{event.preventDefault();cancelAnimationFrame(frame);frame=0;setReady(false)}
            const restored=()=>setGeneration(value=>value+1)
            canvas.addEventListener("webglcontextlost",lost);canvas.addEventListener("webglcontextrestored",restored)
            start()
            return ()=>{disposed=true;cancelAnimationFrame(frame);wake.current=()=>{};resize.disconnect();intersection.disconnect();document.removeEventListener("visibilitychange",visibility);canvas.removeEventListener("webglcontextlost",lost);canvas.removeEventListener("webglcontextrestored",restored);cleanupGPU()}
        } catch { cleanupGPU();setReady(false) }
    }, [generation])
    React.useEffect(()=>wake.current(),[colors.join("|"),moving,instant])
    return <canvas ref={element} aria-hidden="true" className="gfc-liquid" data-ready={ready} style={{position:"absolute",inset:0,width:"100%",height:"100%",display:"block",opacity:ready?1:0,filter:"blur(16px)",transform:"scale(1.07)",pointerEvents:"none"}} />
}

function Arrow({ next = false }: { next?: boolean }) {
    return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d={next ? "M5 12h14m-6-6 6 6-6 6" : "M19 12H5m6-6-6 6 6 6"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

const css = `
.gfc-root button,.gfc-root a{-webkit-tap-highlight-color:transparent}
.gfc-root button{font:inherit}
.gfc-root button:focus:not(:focus-visible),.gfc-root a:focus:not(:focus-visible){outline:none}
.gfc-root button:focus-visible,.gfc-root a:focus-visible{outline:3px solid #262631;outline-offset:4px;box-shadow:0 0 0 4px #fff!important}
.gfc-root .gfc-arrow{position:relative;isolation:isolate;appearance:none;display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:transparent;color:inherit;cursor:pointer;transition:background .2s ease,opacity .2s ease}
.gfc-root .gfc-arrow::before{content:"";position:absolute;inset:0px;z-index:-1;border-radius:50%;background:rgba(12,12,24,.25);border:1px solid rgba(255,255,255,.32);transition:background .2s ease,border-color .2s ease,transform .2s ease}
@media(hover:hover){.gfc-root .gfc-arrow:not(:disabled):hover::before{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.65)}}
.gfc-root .gfc-arrow:not(:disabled):active::before{transform:scale(.94);background:rgba(255,255,255,.22)}
.gfc-root .gfc-arrow:disabled{opacity:.25;cursor:default}
.gfc-root .gfc-card{appearance:none;display:block;padding:0;border:0;text-align:inherit;background:transparent;touch-action:pan-y;cursor:pointer;user-select:none;-webkit-user-select:none}
.gfc-root .gfc-card img{user-select:none;-webkit-user-select:none;-webkit-user-drag:none}
.gfc-root .gfc-caption-link{color:inherit;text-decoration:none;border-radius:6px;min-height:44px;display:flex;justify-content:center;align-items:center;flex-direction:column}
.gfc-root .gfc-caption-link:hover .gfc-title{text-decoration:underline;text-underline-offset:4px}
.gfc-root .gfc-navigation{isolation:isolate}
.gfc-root .gfc-navigation::before{display:none}
.gfc-root .gfc-blob{position:absolute;pointer-events:none;will-change:transform;mask-image:radial-gradient(ellipse at center,#000 12%,rgba(0,0,0,.82) 28%,transparent 72%);-webkit-mask-image:radial-gradient(ellipse at center,#000 12%,rgba(0,0,0,.82) 28%,transparent 72%)}
.gfc-root .gfc-blob{animation:none!important;will-change:auto}
@media(prefers-reduced-motion:reduce){.gfc-root .gfc-blob{animation:none!important;will-change:auto}.gfc-root .gfc-card{transition:none!important}.gfc-root .gfc-arrow,.gfc-root .gfc-arrow svg{transition:none!important}.gfc-root .gfc-arrow svg{transform:none!important}.gfc-root .gfc-arrow::before{transition:none!important;transform:none!important}}
@media(prefers-reduced-transparency:reduce),(prefers-contrast:more){.gfc-root .gfc-navigation{background:#F2F3F1!important;color:#22222B!important;border-radius:12px}.gfc-root .gfc-navigation .gfc-count{color:#35353D!important}}
@media(forced-colors:active){.gfc-root .gfc-navigation{background:Canvas!important;color:CanvasText!important;border:1px solid ButtonText!important}.gfc-root .gfc-navigation::before{display:none}.gfc-root .gfc-arrow{background:ButtonFace!important;color:ButtonText!important;border:1px solid ButtonText!important}.gfc-root .gfc-caption-link{color:LinkText!important}.gfc-root .gfc-count{color:CanvasText!important}}
`

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 620
 * @framerDisableUnlink
 */
export default function GradientFlowCarousel(props: Props) {
    const {
        items = defaults, paletteMode = "image", startSlide = 1, padding = "32px", gap = "32px 24px",
        radius = "32px", imageRadius = "18px", imageShape = "portrait", font = {}, showTitle = true,
        duration = 0.95, flow = true, accessibleLabel = "Landscape gallery", style,
    } = props
    const staticRenderer = useIsStaticRenderer()
    const canvas = RenderTarget.current() === RenderTarget.canvas
    const still = staticRenderer || canvas
    const list = (Array.isArray(items) ? items.filter(Boolean) : defaults).map((item, index) => ({ ...item, image: source(item.image) ? item.image : defaults.find(sample => sample.sample === item.sample)?.image }))
    const count = list.length
    const [position, setPosition] = React.useState(Math.max(0, Math.floor(startSlide) - 1))
    const [reduced, setReduced] = React.useState(false)
    const [palettes, setPalettes] = React.useState<Record<string, Palette>>({})
    const [size, setSize] = React.useState({ width: 1024, height: 420 })
    const [drag, setDrag] = React.useState(0)
    const rail = React.useRef<HTMLDivElement>(null)
    const gesture = React.useRef<{ x: number; y: number; id: number; captured: boolean; vertical: boolean } | null>(null)
    const suppressClick = React.useRef(0)
    const activeIndex = count ? mod(position, count) : 0
    const active = list[activeIndex]
    const src = source(active?.image)
    const colors = paletteMode === "image" && palettes[src] ? palettes[src] : fallback(active)
    const motionOff = still || reduced
    const transition = motionOff ? "none" : `${clamp(duration, 0.15, 2)}s cubic-bezier(.22,.68,.12,1)`
    const colorTransition = motionOff ? "none" : `background-color ${Math.max(1.6, duration * 2)}s cubic-bezier(.4,0,.2,1)`
    const compact = size.width < 600
    const imageRatio = imageShape === "wide" ? 1.33 : imageShape === "square" ? 1 : 0.8
    const activeWidth = Math.max(1, Math.min(size.height * imageRatio, size.width * (compact ? 0.8 : 0.51)))
    const sideWidth = Math.max(1, Math.min(compact ? 100 : 240, size.width * (compact ? 0.22 : 0.18)))
    const gapValues = String(gap).trim().split(/\s+/)
    const horizontalGap = clamp(parseFloat(gapValues[1] || gapValues[0]) || 0, 0, 100)
    const activeHeight = Math.max(1, size.height)
    const slots = count > 1 ? Array.from({ length: 7 }, (_, i) => position + i - 3) : count ? [position] : []
    const caption = active?.title || `Image ${activeIndex + 1}`

    React.useEffect(() => {
        setPosition(Math.max(0, Math.floor(startSlide || 1) - 1))
    }, [startSlide])

    React.useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(media.matches)
        update()
        media.addEventListener("change", update)
        return () => media.removeEventListener("change", update)
    }, [])

    React.useEffect(() => {
        const element = rail.current
        if (!element) return
        const measure = () => {
            const { width, height } = element.getBoundingClientRect()
            // client dimensions stay correct when the Framer canvas is zoomed.
            setSize({ width: element.clientWidth || width || 1, height: element.clientHeight || height || 1 })
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const sourceKey = list.map(item => source(item.image)).join("\n")
    React.useEffect(() => {
        if (paletteMode !== "image") return
        let alive = true
        const sources = Array.from(new Set(sourceKey.split("\n").filter(Boolean)))
        sources.forEach(imageSource => {
            samplePalette(imageSource).then(result => {
                if (alive && result) setPalettes(previous => ({ ...previous, [imageSource]: result }))
            })
        })
        return () => { alive = false }
    }, [sourceKey, paletteMode])

    // One navigation per horizontal trackpad gesture, including its momentum tail.
    React.useEffect(() => {
        const element=rail.current
        if(!element || count<2 || still) return
        let total=0, last=0, fired=false, firedAt=-Infinity
        let direction=0, previousMagnitude=0, peak=0, decayed=false
        const wheel=(event:WheelEvent)=>{
            if(event.ctrlKey || event.metaKey) return
            if(Math.abs(event.deltaX)<=Math.abs(event.deltaY)*1.2) return
            event.preventDefault()
            const now=performance.now()
            const delta=event.deltaX*(event.deltaMode===1?16:event.deltaMode===2?element.clientWidth:1)
            const magnitude=Math.abs(delta), nextDirection=Math.sign(delta)
            if(!nextDirection) return
            // Momentum can keep delivering events between two deliberate swipes.
            // Re-arm on a fresh acceleration or reversal, not only on silence.
            const idle=now-last>140
            const reverse=nextDirection!==direction && magnitude>=4
            const freshImpulse=decayed && magnitude>=8 && magnitude>previousMagnitude*1.45
            if(idle || ((reverse || freshImpulse) && now-firedAt>160)){
                total=0;fired=false;peak=0;decayed=false
            }
            last=now
            direction=nextDirection
            peak=Math.max(peak,magnitude)
            if(magnitude<peak*.65) decayed=true
            previousMagnitude=magnitude
            if(fired) return
            if(total && Math.sign(total)!==nextDirection) total=0
            total+=delta
            if(Math.abs(total)>=45){
                fired=true;firedAt=now
                suppressClick.current=Date.now()+350
                setPosition(previous=>previous+(total>0?1:-1))
            }
        }
        element.addEventListener("wheel",wheel,{passive:false})
        return ()=>element.removeEventListener("wheel",wheel)
    },[count,still])

    const navigate = (amount: number) => {
        if (count < 2) return
        setPosition(previous => previous + amount)
    }
    const finishGesture = (event: React.PointerEvent<HTMLDivElement>) => {
        const current = gesture.current
        if (!current || current.id !== event.pointerId) return
        const dx = event.clientX - current.x, dy = event.clientY - current.y
        if (!current.vertical && Math.abs(dx) > 32 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            navigate(dx < 0 ? 1 : -1)
            suppressClick.current = Date.now() + 350
        }
        if (current.captured && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
        gesture.current = null
        setDrag(0)
    }

    const captionDetails = <>
        {showTitle && count > 0 && <span className="gfc-title" title={caption} style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{caption}</span>}
        <span className="gfc-count" aria-hidden="true" style={{ marginTop: showTitle && count ? 2 : 0, fontSize: 11, lineHeight: "15px", fontWeight: 400, fontVariantNumeric: "tabular-nums", letterSpacing: ".06em", color: "#E7E5EC", whiteSpace: "nowrap" }}>{String(count ? activeIndex + 1 : 0).padStart(2, "0")}<span style={{ padding: "0 6px" }}>/</span>{String(count).padStart(2, "0")}</span>
    </>

    return <div
        className="gfc-root"
        role="region"
        aria-roledescription="carousel"
        aria-label={accessibleLabel || "Image gallery"}
        data-flow={flow && !motionOff ? "true" : "false"}
        onKeyDown={event => {
            if (event.altKey || event.ctrlKey || event.metaKey || count < 2) return
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault()
                navigate(event.key === "ArrowRight" ? 1 : -1)
            } else if (event.key === "Home" || event.key === "End") {
                event.preventDefault()
                        setPosition(previous => previous - mod(previous, count) + (event.key === "End" ? count - 1 : 0))
            }
        }}
        style={{
            position: "relative", isolation: "isolate", width: "100%", ...style,
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", boxSizing: "border-box",
            overflow: "hidden", padding, gap: gapValues[0] || "28px", borderRadius: radius,
            backgroundColor: colors[0], transition: colorTransition,
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            color: "#FFFFFF",
        }}
    >
        <style>{css}</style>
        <div aria-hidden="true" style={{ position: "absolute", inset: -1, overflow: "hidden", pointerEvents: "none", zIndex: -1 }}>
            <div className="gfc-blob" style={{ width: "130%", height: "160%", left: "-42%", top: "-60%", backgroundColor: colors[1], transition: colorTransition, opacity: 1 }} />
            <div className="gfc-blob" style={{ width: "140%", height: "160%", left: "18%", top: "-10%", backgroundColor: colors[2], transition: colorTransition, opacity: 0.95 }} />
            <div className="gfc-blob" style={{ width: "115%", height: "145%", left: "5%", top: "-65%", backgroundColor: colors[0], transition: colorTransition, opacity: 0.85 }} />
            <div className="gfc-blob" style={{ width: "110%", height: "135%", left: "-28%", top: "5%", backgroundColor: colors[1], transition: colorTransition, opacity: 0.62 }} />
            <LiquidSurface colors={colors} moving={flow && !motionOff} instant={motionOff} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(9,8,24,.04) 0%,rgba(9,8,24,.06) 55%,rgba(9,8,24,.66) 100%)" }} />
        </div>
        <div
            ref={rail}
            style={{ position: "relative", width: "100%", flex: "1 1 680px", height: "100%", minHeight: 0, maxHeight: 780, touchAction: "pan-y" }}
            onPointerDown={event => {
                if (count < 2 || event.button !== 0) return
                gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId, captured: false, vertical: false }
            }}
            onPointerMove={event => {
                const current = gesture.current
                if (!current || current.id !== event.pointerId || current.vertical) return
                const dx = event.clientX - current.x, dy = event.clientY - current.y
                if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { current.vertical = true; return }
                if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                    if (!current.captured) { event.currentTarget.setPointerCapture(event.pointerId); current.captured = true }
                    if (!motionOff) setDrag(clamp(dx * 0.38, -75, 75))
                }
            }}
            onPointerUp={finishGesture}
            onPointerCancel={() => { if(gesture.current?.captured) suppressClick.current=Date.now()+350; gesture.current = null; setDrag(0) }}
            onLostPointerCapture={() => { gesture.current=null; setDrag(0) }}
        >
            {slots.map(slot => {
                const delta = slot - position
                const distance = Math.abs(delta)
                const index = mod(slot, count)
                const item = list[index]
                const image = typeof item.image === "string" ? { src: item.image } : item.image
                const selected = delta === 0
                const visible = distance <= 2 && (count > 3 || distance <= 1)
                const width = selected ? activeWidth : sideWidth * (distance > 1 ? 0.84 : 1)
                const height = activeHeight * (selected ? 1 : distance === 1 ? 0.86 : 0.72)
                const x = selected ? 0 : Math.sign(delta) * (activeWidth / 2 + horizontalGap + sideWidth / 2 + (distance - 1) * (sideWidth + horizontalGap))
                const CardTag = item.link ? "a" : "button"
                return <CardTag
                    href={item.link || undefined}
                    target={item.link && item.newTab ? "_blank" : undefined}
                    rel={item.link && item.newTab ? "noopener noreferrer sponsored" : undefined}
                    key={slot}
                    type="button"
                    className="gfc-card"
                    draggable={false}
                    onDragStart={event => event.preventDefault()}
                    aria-label={`${item.title || "Image"}${image?.alt ? ` — ${image.alt}` : ""}, ${index + 1} of ${count}`}
                    aria-current={selected ? "true" : undefined}
                    aria-hidden={!visible ? true : undefined}
                    tabIndex={selected ? 0 : -1}
                    onClick={event => {
                        if (Date.now() < suppressClick.current || !visible) { event.preventDefault(); return }
                        if (!item.link) setPosition(slot)
                    }}
                    style={{
                        position: "absolute", left: "50%", top: "50%", width, height,
                        transform: `translate(calc(-50% + ${x + drag}px), -50%)`,
                        borderRadius: imageRadius, overflow: "hidden", zIndex: 10 - distance,
                        opacity: visible ? selected ? 1 : distance === 1 ? 0.94 : 0.72 : 0,
                        pointerEvents: visible ? "auto" : "none",
                        boxShadow: selected ? "0 30px 70px -30px rgba(28,24,33,.3)" : "none",
                        transition: drag || motionOff ? "none" : `width ${transition},height ${transition},transform ${transition},opacity ${transition},box-shadow ${transition}`,
                        background: `linear-gradient(145deg,${item.color1 || colors[0]},${item.color2 || colors[1]} 60%,${item.color3 || colors[2]})`,
                    }}
                >
                    {image?.src && <img
                        key={image.src}
                        src={image.src}
                        srcSet={image.srcSet}
                        sizes={`${Math.ceil(selected ? activeWidth : sideWidth)}px`}
                        alt=""
                        draggable={false}
                        decoding="async"
                        loading={distance < 2 ? "eager" : "lazy"}
                        onError={event => { event.currentTarget.style.opacity = "0" }}
                        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: `${focalPosition(image.positionX)} ${focalPosition(image.positionY)}`, opacity: 1 }}
                    />}
                    <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "inherit", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.2)", pointerEvents: "none" }} />
                </CardTag>
            })}
            {!count && <div style={{ position: "absolute", inset: "10% 20%", borderRadius: imageRadius, border: "1px solid rgba(255,255,255,.4)", display: "grid", placeItems: "center", background: "rgba(255,255,255,.3)", fontSize: 14 }}>Add images</div>}
        </div>
        <div className="gfc-navigation" style={{ position: "relative", flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxSizing: "border-box", width: 240, maxWidth: "100%", color: "#FFFFFF" }}>
            <button type="button" className="gfc-arrow" data-direction="previous" onClick={() => navigate(-1)} disabled={count < 2} aria-label="Previous image"><Arrow /></button>
            <div style={{ flex: "1 1 0", minWidth: 0, textAlign: "center", fontSize: 13, fontWeight: 500, lineHeight: "1.35em", ...font }}>
                {active?.link ? <a className="gfc-caption-link" href={active.link} target={active.newTab ? "_blank" : undefined} rel={active.newTab ? "noopener noreferrer" : undefined} aria-label={showTitle ? undefined : `Open ${caption}`} title={caption}>{captionDetails}</a> : <div style={{ minHeight: 44, display: "flex", alignItems: "center", flexDirection: "column", justifyContent: "center" }}>{captionDetails}</div>}
            </div>
            <button type="button" className="gfc-arrow" data-direction="next" onClick={() => navigate(1)} disabled={count < 2} aria-label="Next image"><Arrow next /></button>
        </div>
        <span aria-live="polite" aria-atomic="true" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap", border: 0 }}>{count ? `${caption}, ${activeIndex + 1} of ${count}` : "No images"}</span>
    </div>
}

GradientFlowCarousel.defaultProps = {
    items: defaults, paletteMode: "image" as const, startSlide: 1, padding: "32px", gap: "32px 24px",
    radius: "32px", imageRadius: "18px", imageShape: "portrait" as const, showTitle: true, duration: 0.95, flow: true,
    font: { fontFamily: "Inter", fontSize: 13, fontWeight: 500, lineHeight: "1.35em", letterSpacing: "-0.01em" },
    accessibleLabel: "Landscape gallery",
}

addPropertyControls(GradientFlowCarousel, {
    items: {
        type: ControlType.Array, title: "Images", maxCount: 20, defaultValue: defaults,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                sample: { type: ControlType.Enum, title: "Sample Image", options: ["none", "Ember", "Jade", "Sol", "Prism", "Azure", "Rose", "Citrus", "Pearl"], optionTitles: ["None", "Ember", "Jade", "Sol", "Prism", "Azure", "Rose", "Citrus", "Pearl"], defaultValue: "none", hidden: p => Boolean(source(p.image)) },
                title: { type: ControlType.String, title: "Title", defaultValue: "Untitled" },
                color1: { type: ControlType.Color, title: "Color 1", defaultValue: "#B66B64" },
                color2: { type: ControlType.Color, title: "Color 2", defaultValue: "#E8BA9D" },
                color3: { type: ControlType.Color, title: "Color 3", defaultValue: "#68758F" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
                newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false },
            },
        },
    },
    paletteMode: { type: ControlType.Enum, title: "Colors", options: ["image", "custom"], optionTitles: ["From Image", "Custom"], defaultValue: "image", displaySegmentedControl: true, description: "Image colors are sampled automatically. Custom colors also provide the fallback for protected images." },
    startSlide: { type: ControlType.Number, title: "Start Image", min: 1, max: 20, step: 1, displayStepper: true, defaultValue: 1 },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "32px" },
    gap: { type: ControlType.Gap, title: "Gap", defaultValue: "32px 24px" },
    radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "32px" },
    imageRadius: { type: ControlType.BorderRadius, title: "Image Radius", defaultValue: "18px" },
    imageShape: { type: ControlType.Enum, title: "Image Shape", options: ["portrait", "square", "wide"], optionTitles: ["Portrait", "Square", "Wide"], defaultValue: "portrait" },
    showTitle: { type: ControlType.Boolean, title: "Titles", defaultValue: true },
    font: { type: ControlType.Font, title: "Title Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: 13, variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.35em" } },
    duration: { type: ControlType.Number, title: "Transition", min: 0.2, max: 1.5, step: 0.05, unit: "s", defaultValue: 0.95 },
    accessibleLabel: { type: ControlType.String, title: "ARIA Label", defaultValue: "Landscape gallery" },
    flow: { type: ControlType.Boolean, title: "Gradient Flow", defaultValue: true, description: "Built by Matthias Ölschlegel 💪  \n[Explore more components](https://dub.sh/dsw13)" },
})


