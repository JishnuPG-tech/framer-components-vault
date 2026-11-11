import React, {
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useSpring, useReducedMotion } from "framer-motion"

/**
 * @framerSupportedLayoutWidth  any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 72
 *
 * Bloom_Button v10 — precision light engine.
 * · PALETTE MORPH: hover/press swap to an alternate palette that mixes in until it
 *   takes over (opacity+scale crossfade, compositor-only, duration controllable)
 * · Behavior SPEED: hover/press retarget playbackRate via WAAPI (seamless)
 * · STATIC contexts (SSR export / thumbnails): paused launch-frame, zero observers
 * · CANVAS live by default (ANIMATE_ON_CANVAS=false ⇒ strict static)
 * · LIVE: IO pauses offscreen; RO only for responsive sizing; fixed-size = zero reads
 * · Motion Style: Orbit · Wave · Liquid · Pulse · Scan
 * · Base edge light ring (Even | Angle) · editable Cast shadow · under-plate depth
 */

/** false = Canvas renders frozen launch frame (strict Framer static-Canvas guideline) */
const ANIMATE_ON_CANVAS = true

/* --------------------------------- types -------------------------------- */

interface Bloom_ButtonProps {
    items: any[]
    shell: any
    layout: any
    surface: any
    aura: any
    behavior: any
    motion: any
    link: any
    onClick?: () => void
    style?: React.CSSProperties
}

/* ------------------------------- utilities ------------------------------ */

const num = (v: unknown, fb: number, min: number, max: number) => {
    const n = typeof v === "number" && isFinite(v) ? v : fb
    return Math.min(max, Math.max(min, n))
}
const clamp01 = (v: unknown, fb = 0) => num(v, fb, 0, 1)

const rgba = (color: string, alpha: number) => {
    if (!color || typeof color !== "string") return `rgba(0,0,0,${alpha})`
    const c = color.trim()
    if (c.startsWith("#")) {
        let hex = c.slice(1)
        if (hex.length === 3)
            hex = hex
                .split("")
                .map((h) => h + h)
                .join("")
        const r = parseInt(hex.slice(0, 2), 16) || 0
        const g = parseInt(hex.slice(2, 4), 16) || 0
        const b = parseInt(hex.slice(4, 6), 16) || 0
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    const m = c.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1].split(/[\s,\/]+/).filter(Boolean)
        return `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${alpha})`
    }
    return `rgba(0,0,0,${alpha})`
}

/** first color token of a paint string (hex or rgb/rgba), darkened ×f */
const shade = (paint: string, f: number, al: number): string => {
    const tok = (String(paint || "").match(
        /#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)/
    ) || [])[0]
    if (!tok) return ""
    let r = 0,
        g = 0,
        b = 0
    if (tok[0] === "#") {
        let hx = tok.slice(1)
        if (hx.length === 3)
            hx = hx
                .split("")
                .map((c) => c + c)
                .join("")
        if (hx.length < 6) return ""
        r = parseInt(hx.slice(0, 2), 16)
        g = parseInt(hx.slice(2, 4), 16)
        b = parseInt(hx.slice(4, 6), 16)
    } else {
        const m = tok.match(/rgba?\(([^)]+)\)/)
        if (!m) return ""
        const p = m[1].split(/[\s,\/]+/).filter(Boolean)
        r = +p[0] || 0
        g = +p[1] || 0
        b = +p[2] || 0
    }
    if (!isFinite(r) || !isFinite(g) || !isFinite(b)) return ""
    return `rgba(${Math.round(r * f)}, ${Math.round(g * f)}, ${Math.round(b * f)}, ${al})`
}

const SPECTRA: Record<string, [string, string, string]> = {
    Rainbow: ["#4f83ff", "#ff8a3c", "#e44fd0"],
    Pearl: ["#9cc7ff", "#ffffff", "#c9b8ff"],
    Ember: ["#ff9a3c", "#ff5340", "#ffd166"],
    Mint: ["#3ce6c2", "#7ab8ff", "#b8ffd9"],
}

/** spectral base + counter glints for any 3-tone palette */
const buildGrads = (cc: [string, string, string]): [string, string] => {
    const [x1, x2, x3] = cc
    const T = "rgba(255,255,255,0)"
    const W = "rgba(255,255,255,0.96)"
    const S = "rgba(190,196,208,0.22)"
    const a = (c: string, al: number) => rgba(c, al)
    const A = `conic-gradient(from 0deg, ${S} 0deg, ${a(x1, 0.35)} 14deg, ${a(x1, 0.95)} 30deg, ${W} 36deg, ${a(x1, 0.9)} 42deg, ${a(x2, 0.4)} 58deg, ${S} 72deg, ${a(x3, 0.4)} 88deg, ${a(x3, 0.95)} 104deg, ${W} 110deg, ${a(x3, 0.9)} 116deg, ${a(x2, 0.4)} 132deg, ${S} 146deg, ${a(x2, 0.4)} 162deg, ${a(x2, 0.95)} 178deg, ${W} 184deg, ${a(x2, 0.9)} 190deg, ${a(x1, 0.4)} 206deg, ${S} 220deg, ${a(x1, 0.4)} 236deg, ${a(x1, 0.95)} 252deg, ${W} 258deg, ${a(x3, 0.9)} 264deg, ${a(x3, 0.4)} 280deg, ${S} 294deg, ${a(x3, 0.4)} 310deg, ${a(x2, 0.9)} 326deg, ${a(x1, 0.5)} 344deg, ${S} 360deg)`
    const B = `conic-gradient(from 40deg, ${T} 0deg, ${a(x1, 0.55)} 3deg, ${W} 7deg, ${a(x3, 0.55)} 11deg, ${T} 15deg, ${T} 120deg, ${a(x2, 0.55)} 123deg, ${W} 127deg, ${a(x1, 0.55)} 131deg, ${T} 135deg, ${T} 240deg, ${a(x3, 0.55)} 243deg, ${W} 247deg, ${a(x2, 0.55)} 251deg, ${T} 255deg, ${T} 360deg)`
    return [A, B]
}

const SPRINGS: Record<
    string,
    { stiffness: number; damping: number; mass: number }
> = {
    Silky: { stiffness: 260, damping: 26, mass: 0.9 },
    Snappy: { stiffness: 480, damping: 32, mass: 0.7 },
    Bouncy: { stiffness: 380, damping: 17, mass: 0.9 },
}

/** per-style durations (s at speed 1) + easings */
const MOTION_STYLES: Record<
    string,
    { dA: number; dB: number; eA: string; eB: string }
> = {
    Orbit: {
        dA: 16,
        dB: 10,
        eA: "cubic-bezier(.6,.05,.3,.95)",
        eB: "cubic-bezier(.45,.1,.55,.9)",
    },
    Wave: { dA: 22, dB: 14, eA: "ease-in-out", eB: "ease-in-out" },
    Liquid: {
        dA: 26,
        dB: 18,
        eA: "cubic-bezier(.45,.05,.55,.95)",
        eB: "cubic-bezier(.45,.05,.55,.95)",
    },
    Pulse: { dA: 6, dB: 6, eA: "ease-in-out", eB: "ease-in-out" },
    Scan: {
        dA: 10,
        dB: 7,
        eA: "cubic-bezier(.65,0,.35,1)",
        eB: "cubic-bezier(.65,0,.35,1)",
    },
}

const THEMES: Record<string, { bg: string; ink: string; dark: boolean }> = {
    Frost: {
        bg: "linear-gradient(180deg, rgba(252,252,254,0.96) 0%, rgba(240,241,246,0.92) 100%)",
        ink: "#3f434b",
        dark: false,
    },
    Chrome: {
        bg: "linear-gradient(180deg, #fdfdfe 0%, #e8eaee 34%, #c7cad2 58%, #eef0f4 100%)",
        ink: "#43474e",
        dark: false,
    },
    Midnight: {
        bg: "linear-gradient(180deg, #26282e 0%, #101115 100%)",
        ink: "#e9eaee",
        dark: true,
    },
}

const CHROME_RIM =
    "conic-gradient(from 210deg, #f8f9fb 0deg, #b7bbc4 55deg, #ffffff 95deg, #8f939c 150deg, #e8eaee 200deg, #a6aab3 260deg, #ffffff 305deg, #f8f9fb 360deg)"
const CHROME_RIM_DARK =
    "conic-gradient(from 210deg, #6d727c 0deg, #2b2e35 55deg, #8b909b 95deg, #191b20 150deg, #565b66 200deg, #23262c 260deg, #7d828d 305deg, #6d727c 360deg)"

const FALLBACK_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5.5 11.5 12 5l6.5 6.5"/></svg>'

/** ring hugging any border-radius — mask-composite: exclude */
const ringPad = (w: number): React.CSSProperties => ({
    padding: w,
    WebkitMask:
        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    maskComposite: "exclude",
})

const JUST = (v: string) =>
    v === "Start"
        ? "flex-start"
        : v === "End"
          ? "flex-end"
          : v === "Between"
            ? "space-between"
            : v === "Around"
              ? "space-around"
              : v === "Evenly"
                ? "space-evenly"
                : "center"

const ALI = (v: string) =>
    v === "Start"
        ? "flex-start"
        : v === "End"
          ? "flex-end"
          : v === "Stretch"
            ? "stretch"
            : v === "Base"
              ? "baseline"
              : "center"

/* ----------------------------- svg handling ----------------------------- */

const sanitizeSvg = (raw: string): string => {
    let s = String(raw || "")
    s = s.replace(/<script[\s\S]*?<\/script>/gi, "")
    s = s.replace(/<script[^>]*\/?>/gi, "")
    s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    s = s.replace(/javascript\s*:/gi, "")
    s = s.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    const open = s.match(/<svg[\s\S]*?>/i)
    if (!open) return ""
    let tag = open[0]
    if (!/xmlns\s*=/.test(tag))
        tag = tag.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"')
    tag = tag.replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*')/gi, "")
    const rest = s.slice(s.indexOf(open[0]) + open[0].length)
    const closeIdx = rest.toLowerCase().lastIndexOf("</svg>")
    const inner = closeIdx >= 0 ? rest.slice(0, closeIdx) : rest
    return `${tag}${inner}</svg>`
}

const maskVersion = (svg: string): string =>
    svg
        .replace(/currentColor/g, "#000")
        .replace(/stroke\s*=\s*"(?!none)[^"]*"/gi, 'stroke="#000"')
        .replace(/fill\s*=\s*"(?!none)[^"]*"/gi, 'fill="#000"')

/* ---------------------------------- css --------------------------------- */

const CSS = `
@property --abp { syntax: "<percentage>"; inherits: true; initial-value: 0%; }
@property --abs { syntax: "<angle>"; inherits: true; initial-value: 0deg; }
.ab-root{position:relative;display:block;width:100%;height:100%;-webkit-tap-highlight-color:transparent}
a.ab-root{display:flex}
.ab-btn{position:relative;display:block;width:100%;height:100%;border:0;padding:0;margin:0;background:transparent;font:inherit;color:inherit;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;will-change:transform}
.ab-btn:focus-visible{outline:2px solid rgba(120,150,255,.75);outline-offset:4px;border-radius:inherit}
.ab-under{position:absolute;pointer-events:none}
.ab-shell{position:absolute;inset:0;display:flex;overflow:hidden;transform:translateZ(0)}
.ab-shine{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,0) 46%)}
.ab-item{position:relative;z-index:2;display:inline-flex;align-items:center;justify-content:center;line-height:1;min-width:0;flex:none}
.ab-text{white-space:nowrap}
.ab-ph{border:1.5px dashed rgba(125,130,145,.4);border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:ui-sans-serif,system-ui,sans-serif}
.ab-holder{position:relative;display:inline-flex;align-items:center;justify-content:center;flex:none}
.ab-holder-content{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;max-width:100%;max-height:100%}
.ab-icon{position:relative;display:inline-block;line-height:0}
.ab-art{position:relative;display:inline-block;line-height:0}
.ab-art img{width:100%;height:100%;display:block;object-fit:contain}
.ab-aura{position:absolute;inset:0;pointer-events:none}
.ab-ring{position:absolute;inset:0;pointer-events:none;transition:opacity .45s ease}
.ab-mask{position:absolute;inset:0;border-radius:inherit;overflow:hidden}
.ab-lay{position:absolute;inset:0}
.ab-spin{position:absolute;left:50%;top:50%;will-change:transform}
`

/* ------------------------------- icon view ------------------------------- */

const IconView: React.FC<{
    item: any
    px: number
    paint: string
    power: number
    base: number
    tint: string
    gradA: string
    gradB: string
    gradA2: string
    gradB2: string
    altConfigured: boolean
    altOn: boolean
    altTr: string
    animA: React.CSSProperties
    animB: React.CSSProperties
    edgeFilter: string
    filterTr: string
    c1: string
    c3: string
}> = ({
    item,
    px,
    paint,
    power,
    base,
    tint,
    gradA,
    gradB,
    gradA2,
    gradB2,
    altConfigured,
    altOn,
    altTr,
    animA,
    animB,
    edgeFilter,
    filterTr,
    c1,
    c3,
}) => {
    const [uploaded, setUploaded] = useState("")

    useEffect(() => {
        if (item.source !== "Upload") return
        const f: any = item.file
        if (!f) {
            setUploaded("")
            return
        }
        if (typeof f === "string") {
            setUploaded(f)
            return
        }
        if (typeof f.text === "function") {
            let live = true
            f.text().then((t: string) => {
                if (live) setUploaded(t)
            })
            return () => {
                live = false
            }
        }
        setUploaded("")
    }, [item.source, item.file])

    const rawSvg = useMemo(() => {
        if (
            item.source === "Upload" &&
            typeof item.file === "string" &&
            item.file
        )
            return sanitizeSvg(item.file)
        const raw = item.source === "Paste" ? item.code || "" : uploaded
        return sanitizeSvg(raw || FALLBACK_SVG)
    }, [item.source, item.file, item.code, uploaded])

    const maskUri = useMemo(() => {
        if (paint === "Artwork") return ""
        if (
            item.source === "Upload" &&
            typeof item.file === "string" &&
            item.file
        )
            return `url("${item.file}")`
        return rawSvg
            ? `url("data:image/svg+xml,${encodeURIComponent(maskVersion(rawSvg))}")`
            : ""
    }, [paint, item.source, item.file, rawSvg])

    /* SAFE: render via <img> + data URI — browser sandboxes the SVG completely,
       so no scripts, event handlers, or external fetches can execute.
       This is exactly the "safe image-based approach" Framer's reviewer requested. */
    const svgDataUri = useMemo(() => {
        if (!rawSvg || paint !== "Artwork") return ""
        return `data:image/svg+xml,${encodeURIComponent(rawSvg)}`
    }, [rawSvg, paint])

    const rz = px * 2.6
    const glowFilter =
        power > 0.02
            ? `drop-shadow(0 0 ${Math.round(2 + 4 * power)}px ${rgba("#66aaff", 0.35 * power)}) drop-shadow(${(1.2 * power).toFixed(1)}px 0 ${Math.round(1 + power)}px ${rgba(c1, 0.4 * power)}) drop-shadow(-${(1.2 * power).toFixed(1)}px 0 ${Math.round(1 + power)}px ${rgba(c3, 0.38 * power)})`
            : "none"
    const combinedFilter =
        `${glowFilter === "none" ? "" : glowFilter + " "}${edgeFilter === "none" ? "" : edgeFilter}`.trim() ||
        undefined

    if (paint === "Artwork") {
        return (
            <span
                className="ab-art"
                style={{
                    width: px,
                    height: px,
                    maxWidth: "100%",
                    maxHeight: "100%",
                }}
            >
                <img
                    src={svgDataUri}
                    alt=""
                    draggable={false}
                    referrerPolicy="no-referrer"
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "contain",
                        filter: combinedFilter,
                        transition: filterTr,
                    }}
                />
            </span>
        )
    }

    return (
        <span
            className="ab-icon"
            style={{
                width: px,
                height: px,
                maxWidth: "100%",
                maxHeight: "100%",
                background: paint === "Tint" ? tint : undefined,
                filter: combinedFilter,
                transition: filterTr,
                WebkitMaskImage: maskUri || undefined,
                maskImage: maskUri || undefined,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
            }}
        >
            {paint === "Aura" && (
                <>
                    <span
                        className="ab-lay"
                        style={{
                            background:
                                "linear-gradient(180deg,#ffffff 0%,#c9cdd6 55%,#eef0f4 100%)",
                            opacity: clamp01(1 - power * 0.85) * base,
                        }}
                    />
                    <span
                        className="ab-spin"
                        style={{
                            width: rz,
                            height: rz,
                            marginLeft: -rz / 2,
                            marginTop: -rz / 2,
                            background: gradA,
                            ...animA,
                        }}
                    />
                    <span
                        className="ab-spin"
                        style={{
                            width: rz,
                            height: rz,
                            marginLeft: -rz / 2,
                            marginTop: -rz / 2,
                            background: gradB,
                            mixBlendMode: "screen",
                            ...animB,
                        }}
                    />
                    {altConfigured && (
                        <span
                            className="ab-lay"
                            style={{
                                opacity: altOn ? 1 : 0,
                                transform: altOn ? "scale(1)" : "scale(1.035)",
                                transition: altTr,
                            }}
                        >
                            <span
                                className="ab-spin"
                                style={{
                                    width: rz,
                                    height: rz,
                                    marginLeft: -rz / 2,
                                    marginTop: -rz / 2,
                                    background: gradA2,
                                    ...animA,
                                }}
                            />
                            <span
                                className="ab-spin"
                                style={{
                                    width: rz,
                                    height: rz,
                                    marginLeft: -rz / 2,
                                    marginTop: -rz / 2,
                                    background: gradB2,
                                    mixBlendMode: "screen",
                                    ...animB,
                                }}
                            />
                        </span>
                    )}
                </>
            )}
        </span>
    )
}

/* ------------------------------- component ------------------------------- */

export default function Bloom_Button(props: Bloom_ButtonProps) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const isStaticRenderer = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    /* static = export/SSR/thumbnails always; Canvas too unless ANIMATE_ON_CANVAS */
    const isStatic = isStaticRenderer && !(isCanvas && ANIMATE_ON_CANVAS)
    const reduced = useReducedMotion() === true

    const rootRef = useRef<HTMLElement | null>(null)

    /* geometry: prefer frame style props (zero layout reads); measure only if absent */
    const stW =
        props.style && typeof (props.style as any).width === "number"
            ? (props.style as any).width
            : 0
    const stH =
        props.style && typeof (props.style as any).height === "number"
            ? (props.style as any).height
            : 0
    const hasStyleSize = stW > 0 && stH > 0
    const [size, setSize] = useState(() =>
        hasStyleSize ? { w: stW, h: stH } : { w: 240, h: 72 }
    )
    const [hover, setHover] = useState(false)
    const [pressed, setPressed] = useState(false)
    const [inView, setInView] = useState(true)

    /* reads */
    const items = Array.isArray(props.items) ? props.items : []
    const shell = props.shell || {}
    const lay = props.layout || {}
    const surface = props.surface || {}
    const aura = props.aura || {}
    const beh = props.behavior || {}
    const mot = props.motion || {}

    const shape = shell.shape || "Custom"
    const softRadius = num(shell.radius, 120, 2, 120)

    const flow = lay.flow === "Column" ? "Column" : "Row"
    const justify = lay.justify || "Start"
    const align = lay.align || "Center"
    const lines = lay.lines || "Center"
    const wrap = !!lay.wrap
    const gap = num(lay.gap, 20, 0, 160)
    const gapY = num(lay.gapY, 10, 0, 160)
    const padT = num(lay.padT, 10, 0, 160)
    const padR = num(lay.padR, 25, 0, 160)
    const padB = num(lay.padB, 10, 0, 160)
    const padL = num(lay.padL, 15, 0, 160)
    const scaleCtl = num(lay.scale, 0.9, 0.4, 2)

    const theme = surface.theme || "Custom"
    const th = THEMES[theme] || THEMES.Frost
    const gloss = clamp01(surface.gloss, 0)
    const frost = num(surface.frost, 0, 0, 30)
    const rimCtl = num(surface.rim, 0.5, 0, 6)
    const stepCtl = num(surface.step, 5, 0, 14)
    const stepTone = surface.tone || "Ink"
    const stepInk = surface.ink || "#0d0d0d"
    const baseLightMode = surface.baseLightMode || "Even"
    const baseAngle = num(surface.baseAngle, 180, 0, 360)
    const baseLight = surface.baseLight || "#ffffff"

    const master = aura.master !== false
    const spectrum = aura.spectrum || "Mint"
    const thick = num(aura.thick, 0.5, 0, 12)
    const glow = num(aura.glow, 40, 0, 40)
    const bloom = clamp01(aura.bloom, 0.8)
    const track = clamp01(aura.track, 0.85)
    const speed = num(aura.speed, 0.8, 0, 4)
    const ccw = aura.dir === "CCW"
    const cast = clamp01(aura.cast, 1)
    const castDrop = num(aura.castDrop, 6, 0, 60)
    const castSoft = num(aura.castSoft, 30, 0, 90)
    const castSource = aura.castSource || "Palette"
    const castInk = aura.castInk || "#0a0f14"

    /* behavior — two sub-menus (fx / lift / time / power / speed / palette / mix) */
    const hov = beh.hover || {}
    const prs = beh.press || {}
    const idle = beh.idle || "Color"
    const hoverFx = hov.fx || "Pour"
    const hoverLift = num(hov.lift, 0, 0, 16)
    const hoverTime = reduced ? 0 : num(hov.time, 650, 0, 1600)
    const hoverPower = clamp01(hov.power, 0.5)
    const hoverSpeed = num(hov.speed, 1.5, 0, 4)
    const hoverPal = hov.palette || "None"
    const hoverMix = reduced ? 0 : num(hov.mix, 900, 0, 2000)
    const pressFx = prs.fx || "Flare"
    const pressSquish = num(prs.squish, 0.97, 0.85, 1)
    const pressTime = reduced ? 0 : num(prs.time, 200, 0, 1200)
    const pressPower = clamp01(prs.power, 0.6)
    const pressSpeed = num(prs.speed, 0.5, 0, 4)
    const pressPal = prs.palette || "None"
    const pressMix = reduced ? 0 : num(prs.mix, 500, 0, 2000)
    const altConfigured = hoverPal !== "None" || pressPal !== "None"

    const motStyle = MOTION_STYLES[mot.style] ? mot.style : "Orbit"
    const springCfg = SPRINGS[mot.spring] || SPRINGS.Silky

    const w = hasStyleSize ? stW : size.w
    const h = hasStyleSize ? stH : size.h

    /* one synchronous measure at mount ONLY when style lacks a numeric size */
    useLayoutEffect(() => {
        if (hasStyleSize || isStatic) return
        if (typeof window === "undefined") return
        const el = rootRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height })
    }, [hasStyleSize, isStatic])

    /* ResizeObserver: live contexts with responsive sizing only; guarded; cleaned up */
    useEffect(() => {
        if (hasStyleSize || isStatic) return
        if (
            typeof window === "undefined" ||
            typeof ResizeObserver === "undefined"
        )
            return
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const r = el.getBoundingClientRect()
            if (r.width > 0 && r.height > 0)
                setSize((p) =>
                    p.w === r.width && p.h === r.height
                        ? p
                        : { w: r.width, h: r.height }
                )
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [hasStyleSize, isStatic])

    /* IntersectionObserver: live contexts only — pauses animations offscreen */
    useEffect(() => {
        if (isStatic) return
        if (
            typeof window === "undefined" ||
            typeof IntersectionObserver === "undefined"
        )
            return
        const el = rootRef.current
        if (!el) return
        const io = new IntersectionObserver(
            (e) => setInView(e[0].isIntersecting),
            {
                threshold: 0.05,
            }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    /* motion (springs animate only during interaction; framer-motion cleans up) */
    const y = useSpring(0, springCfg)
    const sc = useSpring(1, springCfg)
    useEffect(() => {
        if (reduced || isStatic) {
            y.set(0)
            sc.set(1)
            return
        }
        y.set(pressed ? 1 : hover ? -hoverLift : 0)
        sc.set(pressed ? pressSquish : 1)
    }, [hover, pressed, hoverLift, pressSquish, reduced, isStatic, y, sc])

    /* palette */
    const [c1, c2, c3] =
        spectrum === "Custom"
            ? [aura.c1 || "#4f83ff", aura.c2 || "#ff8a3c", aura.c3 || "#e44fd0"]
            : SPECTRA[spectrum] || SPECTRA.Mint

    const [gradA, gradB] = useMemo(() => buildGrads([c1, c2, c3]), [c1, c2, c3])

    /* geometry */
    const k = h / 72
    const s = k * scaleCtl
    const R = shape === "Custom" ? softRadius * k : h / 2
    const ringW = Math.max(thick * k, thick > 0 ? 1 : 0)
    const rimW = Math.max(rimCtl * k, rimCtl > 0 ? 0.75 : 0)
    const rotor = Math.ceil(Math.hypot(w, h) * 1.12) + 16
    /* static ⇒ paused at the launch frame; live ⇒ paused offscreen / reduced-motion / Freeze */
    const run =
        !reduced &&
        !isStatic &&
        speed > 0 &&
        inView &&
        !(pressed && pressFx === "Freeze")
    const playState = run ? "running" : "paused"
    const hi = hover && !isCanvas ? 1 : 0
    const hoverActive = hover && !isCanvas
    const pressedActive = pressed && !isCanvas

    /* palette morph state: press overrides hover; mixes in until takeover */
    const activePal =
        pressedActive && pressPal !== "None"
            ? pressPal
            : hoverActive && hoverPal !== "None"
              ? hoverPal
              : "None"
    const altOn = altConfigured && activePal !== "None"
    const altMixDur = pressedActive && pressPal !== "None" ? pressMix : hoverMix
    const altTr = `opacity ${Math.max(altMixDur, 1)}ms cubic-bezier(.35,.65,.15,1), transform ${Math.max(altMixDur, 1)}ms cubic-bezier(.35,.65,.15,1)`
    const altCols = useMemo((): [string, string, string] => {
        if (activePal === "Invert") return [c3, c2, c1]
        return (SPECTRA[activePal] || [c1, c2, c3]) as [string, string, string]
    }, [activePal, c1, c2, c3])
    const [gradA2, gradB2] = useMemo(() => buildGrads(altCols), [altCols])

    /* seamless playback-rate modulation: press overrides hover overrides base ×1 */
    const targetRate = pressedActive ? pressSpeed : hoverActive ? hoverSpeed : 1
    useEffect(() => {
        if (isStatic || reduced) return
        if (typeof window === "undefined") return
        const el = rootRef.current as HTMLElement | null
        if (!el || typeof el.getAnimations !== "function") return
        const Ctor: any = (window as any).CSSAnimation || null
        let anims: Animation[] = []
        try {
            anims = (el as any).getAnimations({ subtree: true }) as Animation[]
        } catch {
            anims = el.getAnimations()
        }
        for (const a of anims) {
            const isCssAnim = Ctor
                ? a instanceof Ctor
                : !!(a.constructor && a.constructor.name === "CSSAnimation")
            if (!isCssAnim) continue
            try {
                if (typeof a.updatePlaybackRate === "function")
                    a.updatePlaybackRate(targetRate)
                else a.playbackRate = targetRate
            } catch {
                /* animation vanished mid-update — safe to ignore */
            }
        }
    }, [
        targetRate,
        motStyle,
        playState,
        master,
        isStatic,
        reduced,
        items.length,
    ])

    /* behavior state machine */
    const idleMono = master && idle !== "Color"
    const spatial = idleMono && (hoverFx === "Pour" || hoverFx === "Sweep")
    const monoOp = !idleMono ? 0 : hoverFx === "None" ? 1 : hoverActive ? 0 : 1
    const colorOp = !idleMono
        ? 1
        : hoverFx === "Pour" || hoverFx === "Sweep"
          ? 1
          : hoverFx === "Fade"
            ? hoverActive
                ? 1
                : 0
            : 0
    const idleFilter =
        idle === "Mono"
            ? "grayscale(1) contrast(1.02)"
            : idle === "Dim"
              ? "grayscale(.85) brightness(.78)"
              : "none"
    const edgeFilter = idleMono
        ? hoverActive
            ? "grayscale(0) brightness(1)"
            : idleFilter
        : "none"
    const filterTr = `filter ${Math.max(hoverTime, 1)}ms cubic-bezier(.4,.1,.2,1)`
    const monoTr = `opacity ${Math.round(hoverTime * 0.5)}ms ease ${hoverActive ? Math.round(hoverTime * 0.45) : Math.round(hoverTime * 0.25)}ms`
    const colorTr = `opacity ${Math.round(hoverTime * 0.6)}ms ease ${hoverActive ? 0 : Math.round(hoverTime * 0.2)}ms`
    const pd = Math.max(Math.round(pressTime), 80)
    const pressFilter =
        pressedActive && pressFx === "Flare"
            ? `brightness(${1 + 0.32 * pressPower}) saturate(${1 + 0.35 * pressPower}) contrast(1.05)`
            : "none"
    const pressOp =
        pressedActive && pressFx === "Sink" ? 1 - 0.55 * pressPower : 1
    const auraTr = `filter ${pd}ms ease, opacity ${pd}ms ease`

    const pourColor = `linear-gradient(to top, #000 0%, #000 calc(var(--abp) - 14%), rgba(0,0,0,0) var(--abp))`
    const pourMono = `linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0) calc(var(--abp) - 14%), #000 calc(var(--abp) - 2%))`
    const sweepColor = `conic-gradient(from -90deg, #000 0deg, #000 var(--abs), rgba(0,0,0,0) calc(var(--abs) + 50deg), rgba(0,0,0,0) 360deg)`
    const sweepMono = `conic-gradient(from -90deg, rgba(0,0,0,0) 0deg, rgba(0,0,0,0) calc(var(--abs) - 8deg), #000 calc(var(--abs) + 6deg), #000 360deg)`
    const colorMask = !spatial
        ? undefined
        : hoverFx === "Pour"
          ? pourColor
          : sweepColor
    const monoMask = !spatial
        ? undefined
        : hoverFx === "Pour"
          ? pourMono
          : sweepMono

    /* flow — per-style durations & easings */
    const ms = MOTION_STYLES[motStyle]
    const dA = ms.dA / Math.max(speed, 0.001)
    const dB = ms.dB / Math.max(speed, 0.001)
    const dirA = ccw ? "reverse" : "normal"
    const dirB = ccw ? "normal" : "reverse"

    const animA: React.CSSProperties = {
        animationName: `ma${uid}`,
        animationDuration: `${dA}s`,
        animationTimingFunction: ms.eA,
        animationIterationCount: "infinite",
        animationDirection: dirA as any,
        animationPlayState: playState,
    }
    const animB: React.CSSProperties = {
        animationName: `mb${uid}`,
        animationDuration: `${dB}s`,
        animationTimingFunction: ms.eB,
        animationIterationCount: "infinite",
        animationDirection: dirB as any,
        animationPlayState: playState,
    }

    const rotors = (rz: number, full: boolean) => (
        <>
            <span
                className="ab-spin"
                style={{
                    width: rz,
                    height: rz,
                    marginLeft: -rz / 2,
                    marginTop: -rz / 2,
                    background: gradA,
                    ...animA,
                }}
            />
            {full && (
                <span
                    className="ab-spin"
                    style={{
                        width: rz,
                        height: rz,
                        marginLeft: -rz / 2,
                        marginTop: -rz / 2,
                        background: gradB,
                        mixBlendMode: "screen",
                        ...animB,
                    }}
                />
            )}
        </>
    )

    /** alternate-palette overlay: mixes over the base until it takes over */
    const altLayer = (rz: number) =>
        altConfigured ? (
            <span
                className="ab-lay"
                style={{
                    opacity: altOn ? 1 : 0,
                    transform: altOn ? "scale(1)" : "scale(1.035)",
                    transition: altTr,
                }}
            >
                <span
                    className="ab-spin"
                    style={{
                        width: rz,
                        height: rz,
                        marginLeft: -rz / 2,
                        marginTop: -rz / 2,
                        background: gradA2,
                        ...animA,
                    }}
                />
                <span
                    className="ab-spin"
                    style={{
                        width: rz,
                        height: rz,
                        marginLeft: -rz / 2,
                        marginTop: -rz / 2,
                        background: gradB2,
                        mixBlendMode: "screen",
                        ...animB,
                    }}
                />
            </span>
        ) : null

    const stacks = (rz: number) => (
        <>
            {idleMono && (
                <span
                    className="ab-lay"
                    style={{
                        opacity: monoOp,
                        transition: monoTr,
                        filter: idleFilter,
                        WebkitMaskImage: monoMask,
                        maskImage: monoMask,
                    }}
                >
                    {rotors(rz, false)}
                </span>
            )}
            {(colorOp > 0 || spatial) && (
                <span
                    className="ab-lay"
                    style={{
                        opacity: colorOp,
                        transition: hoverFx === "Fade" ? colorTr : undefined,
                        WebkitMaskImage: colorMask,
                        maskImage: colorMask,
                    }}
                >
                    {rotors(rz, true)}
                    {altLayer(rz)}
                </span>
            )}
        </>
    )

    /** crisp band on opaque track + single soft halo (blur on parent of masked ring) */
    const auraGroup = (rad: number, W: number, rz: number, crispOp: number) => {
        const haloSpread = (1 + bloom * 6) * k
        const haloBlur = Math.max(3, (5 + bloom * 22) * k)
        const surge =
            1 +
            hoverPower * hi * 0.7 +
            (pressFx === "Flare" && pressedActive ? 0.5 * pressPower : 0)
        return (
            <span
                className="ab-aura"
                style={{
                    filter: pressFilter,
                    opacity: pressOp,
                    transition: auraTr,
                }}
            >
                {bloom > 0.02 && glow > 0.5 && (
                    <span
                        className="ab-ring"
                        style={{
                            borderRadius: rad,
                            opacity: Math.min(
                                1,
                                (0.25 + 0.6 * bloom) *
                                    (0.55 + (0.45 * glow) / 40) *
                                    surge
                            ),
                            filter: `blur(${haloBlur}px) saturate(1.5)`,
                        }}
                    >
                        <span
                            className="ab-mask"
                            style={{
                                ...ringPad(W + haloSpread),
                                borderRadius: rad,
                            }}
                        >
                            {stacks(rz)}
                        </span>
                    </span>
                )}
                <span
                    className="ab-ring"
                    style={{ borderRadius: rad, opacity: crispOp }}
                >
                    <span
                        className="ab-mask"
                        style={{
                            ...ringPad(Math.max(W, 1)),
                            borderRadius: rad,
                            filter: "saturate(1.18) contrast(1.06)",
                        }}
                    >
                        {track > 0.02 && (
                            <span
                                className="ab-lay"
                                style={{
                                    background: "#0a0c11",
                                    opacity: track,
                                }}
                            />
                        )}
                        {stacks(rz)}
                    </span>
                </span>
            </span>
        )
    }

    /* shell paint — gloss-driven highlights only; cast shadow is its own editable group */
    const dark = theme === "Midnight"
    const shellBg = theme === "Custom" ? surface.fill || "#000000" : th.bg
    const ink = theme === "Custom" ? "#3f434b" : th.ink
    const rimBg = dark ? CHROME_RIM_DARK : CHROME_RIM

    const castShadows =
        cast > 0.01 && bloom > 0.02
            ? castSource === "Ink"
                ? [
                      `0 ${Math.round(castDrop * k)}px ${Math.round(castSoft * k)}px ${rgba(castInk, 0.3 * cast)}`,
                      `0 ${Math.round(castDrop * 1.35 * k)}px ${Math.round(castSoft * 1.2 * k)}px ${rgba(castInk, 0.22 * cast)}`,
                  ]
                : [
                      `0 ${Math.round(castDrop * k)}px ${Math.round(castSoft * k)}px ${rgba(c1, 0.16 * bloom * cast)}`,
                      `0 ${Math.round(castDrop * 1.35 * k)}px ${Math.round(castSoft * 1.2 * k)}px ${rgba(c3, 0.14 * bloom * cast)}`,
                  ]
            : []

    const shellShadow = [
        gloss > 0.01
            ? `inset 0 1px 0 ${rgba("#ffffff", gloss * (dark ? 0.18 : 0.5))}`
            : "",
        `inset 0 -1px 0 ${rgba("#000000", dark ? 0.35 : 0.08)}`,
        ...castShadows,
    ]
        .filter(Boolean)
        .join(", ")

    /* under-plate: REAL second layer beneath · edge light = 1px ring on its edge only */
    const u = stepCtl * k
    const underBase =
        stepTone === "Light"
            ? "linear-gradient(180deg, #eef0f5 0%, #b9bec9 100%)"
            : stepTone === "Dark"
              ? "linear-gradient(180deg, #1a1c22 0%, #08090c 100%)"
              : stepTone === "Ink"
                ? `linear-gradient(180deg, ${stepInk} 0%, ${shade(stepInk, 0.55, 1) || "rgba(0,0,0,1)"} 100%)`
                : `linear-gradient(180deg, ${shade(shellBg, 0.72, 1) || "rgba(0,0,0,0.45)"} 0%, ${shade(shellBg, 0.45, 1) || "rgba(0,0,0,0.6)"} 100%)`
    const edgeLightW = Math.max(1 * k, 0.75)
    const edgeLightBg =
        baseLightMode === "Angle"
            ? `linear-gradient(${baseAngle}deg, ${rgba(baseLight, 0.95)} 0%, ${rgba(baseLight, 0.45)} 30%, ${rgba(baseLight, 0)} 62%)`
            : rgba(baseLight, 0.85)

    const TEXT_POS = "81.25% 0, -70.85% 0, 0 0, 0 0"

    /* motion-style keyframes (transform-only) */
    const ma = `ma${uid}`
    const mb = `mb${uid}`
    const styleKeyframes =
        motStyle === "Wave"
            ? `
@keyframes ${ma}{0%{transform:translate(-6%,0) rotate(0deg)}25%{transform:translate(0,-4%) rotate(5deg)}50%{transform:translate(6%,0) rotate(0deg)}75%{transform:translate(0,4%) rotate(-5deg)}100%{transform:translate(-6%,0) rotate(0deg)}}
@keyframes ${mb}{0%{transform:translate(5%,3%) rotate(0deg)}50%{transform:translate(-5%,-3%) rotate(-10deg)}100%{transform:translate(5%,3%) rotate(0deg)}}`
            : motStyle === "Liquid"
              ? `
@keyframes ${ma}{0%{transform:rotate(0deg) scale(1,1) skew(0deg,0deg)}33%{transform:rotate(120deg) scale(1.08,.94) skew(4deg,0deg)}66%{transform:rotate(240deg) scale(.94,1.08) skew(-4deg,0deg)}100%{transform:rotate(360deg) scale(1,1) skew(0deg,0deg)}}
@keyframes ${mb}{0%{transform:rotate(0deg) scale(1,1)}50%{transform:rotate(-180deg) scale(1.1,.9) skew(0deg,3deg)}100%{transform:rotate(-360deg) scale(1,1)}}`
              : motStyle === "Pulse"
                ? `
@keyframes ${ma}{0%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.08) rotate(10deg)}100%{transform:scale(1) rotate(0deg)}}
@keyframes ${mb}{0%{transform:scale(1.05) rotate(0deg)}50%{transform:scale(.94) rotate(-12deg)}100%{transform:scale(1.05) rotate(0deg)}}`
                : motStyle === "Scan"
                  ? `
@keyframes ${ma}{0%{transform:rotate(-42deg) scale(1,1)}50%{transform:rotate(42deg) scale(1.03,.98)}100%{transform:rotate(-42deg) scale(1,1)}}
@keyframes ${mb}{0%{transform:rotate(30deg)}50%{transform:rotate(-30deg)}100%{transform:rotate(30deg)}}`
                  : `
@keyframes ${ma}{0%{transform:rotate(0deg) scale(1,1)}22%{transform:rotate(74deg) scale(1.035,.975)}48%{transform:rotate(176deg) scale(.99,1.02)}74%{transform:rotate(262deg) scale(1.04,.97)}100%{transform:rotate(360deg) scale(1,1)}}
@keyframes ${mb}{0%{transform:rotate(0deg) scale(1,1)}50%{transform:rotate(-180deg) scale(.97,1.04)}100%{transform:rotate(-360deg) scale(1,1)}}`

    const keyframes =
        styleKeyframes +
        `
@keyframes as${uid}{0%{background-position:${TEXT_POS}}100%{background-position:-81.25% 0, 70.85% 0, 0 0, 0 0}}`

    const link = props.link
    const href = link ? (typeof link === "string" ? link : link.href || "") : ""

    /* items */
    const rendered = items.map((raw, i) => {
        const it = raw || {}
        const kind: "Text" | "SVG" = it.kind === "SVG" ? "SVG" : "Text"
        const paint: "Aura" | "Tint" | "Artwork" =
            it.paint || (it.fill === false ? "Tint" : "Aura")
        const power = Math.min(
            1.2,
            clamp01(it.power, 0.8) * (0.8 + 0.45 * hoverPower * hi)
        )
        const base = clamp01(it.base, 0.3)
        const fade = clamp01(it.fade, 1)

        let content: React.ReactNode

        if (kind === "Text") {
            const f: any = it.font
            const fontSize =
                (num(it.size, 0, 0, 200) > 0
                    ? num(it.size, 0, 0, 200)
                    : f?.fontSize || f?.size || 20) * s
            const baseCss: React.CSSProperties = {
                fontFamily:
                    (f && (f.fontFamily || f.family)) ||
                    "ui-sans-serif, system-ui, -apple-system, 'Inter', sans-serif",
                fontSize,
                fontWeight: f?.fontWeight ?? f?.weight ?? 500,
                fontStyle: f?.fontStyle ?? "normal",
                letterSpacing: f?.letterSpacing,
                lineHeight: 1.15,
            }
            const inkT = it.ink || ink
            if (paint === "Aura" && master) {
                const p = power
                const textSpan = (
                    cols: [string, string, string],
                    extra: React.CSSProperties,
                    hidden?: boolean
                ) => {
                    const [t1, t2, t3] = cols
                    const T = "rgba(255,255,255,0)"
                    const bandA = `linear-gradient(115deg, ${T} 0%, ${rgba(t1, 0.9 * p)} 6%, ${rgba(t2, 0.85 * p)} 12%, ${rgba(t3, 0.9 * p)} 18%, ${T} 26%, ${T} 50%, ${rgba(t3, 0.8 * p)} 56%, ${rgba(t1, 0.85 * p)} 62%, ${rgba(t2, 0.8 * p)} 68%, ${T} 76%, ${T} 100%)`
                    const bandB = `linear-gradient(65deg, ${T} 0%, ${rgba(t2, 0.7 * p)} 8%, ${rgba(t3, 0.75 * p)} 15%, ${T} 24%, ${T} 52%, ${rgba(t1, 0.7 * p)} 60%, ${rgba(t2, 0.65 * p)} 68%, ${T} 78%, ${T} 100%)`
                    const sheen = `linear-gradient(180deg, ${rgba("#ffffff", 0.45)} 0%, ${rgba("#ffffff", 0)} 55%)`
                    return (
                        <span
                            className="ab-text"
                            aria-hidden={hidden || undefined}
                            style={{
                                ...baseCss,
                                backgroundImage: `${bandA}, ${bandB}, ${sheen}, linear-gradient(0deg, ${inkT} 0%, ${inkT} 100%)`,
                                backgroundSize:
                                    "260% 100%, 340% 100%, 100% 100%, 100% 100%",
                                backgroundPosition: TEXT_POS,
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                                WebkitTextFillColor: "transparent",
                                filter: `drop-shadow(${p.toFixed(1)}px 0 ${rgba(t1, 0.28 * p)}) drop-shadow(-${p.toFixed(1)}px 0 ${rgba(t3, 0.26 * p)}) ${edgeFilter === "none" ? "" : edgeFilter}`,
                                transition: filterTr,
                                animationName: `as${uid}`,
                                animationDuration: `${9 / Math.max(speed, 0.001)}s`,
                                animationTimingFunction: "linear",
                                animationIterationCount: "infinite",
                                animationPlayState: playState,
                                ...extra,
                            }}
                        >
                            {it.label ?? "Aura"}
                        </span>
                    )
                }
                content = altConfigured ? (
                    <span
                        style={{
                            position: "relative",
                            display: "inline-block",
                        }}
                    >
                        {textSpan([c1, c2, c3], {})}
                        {textSpan(
                            altCols,
                            {
                                position: "absolute",
                                left: 0,
                                top: 0,
                                right: 0,
                                bottom: 0,
                                opacity: altOn ? 1 : 0,
                                transform: altOn ? "scale(1)" : "scale(1.02)",
                                transition: altTr,
                            },
                            true
                        )}
                    </span>
                ) : (
                    textSpan([c1, c2, c3], {})
                )
            } else {
                content = (
                    <span
                        className="ab-text"
                        style={{
                            ...baseCss,
                            color: inkT,
                            filter:
                                edgeFilter === "none" ? undefined : edgeFilter,
                            transition: filterTr,
                        }}
                    >
                        {it.label ?? "Aura"}
                    </span>
                )
            }
        } else {
            const holderOn = !!it.holder
            const D = holderOn ? num(it.box, 52, 16, 240) * s : 0
            const basePx = holderOn ? D : h * 0.82
            const px = Math.min(
                basePx,
                (num(it.iconSize, 55, 5, 100) / 100) * basePx
            )
            content = (
                <IconView
                    item={{ ...it, kind }}
                    px={px}
                    paint={master ? paint : paint === "Aura" ? "Tint" : paint}
                    power={power}
                    base={base}
                    tint={it.ink2 || it.ink || it.tint || ink}
                    gradA={gradA}
                    gradB={gradB}
                    gradA2={gradA2}
                    gradB2={gradB2}
                    altConfigured={altConfigured}
                    altOn={altOn}
                    altTr={altTr}
                    animA={animA}
                    animB={animB}
                    edgeFilter={edgeFilter}
                    filterTr={filterTr}
                    c1={c1}
                    c3={c3}
                />
            )
        }

        if (it.holder) {
            const isSvg = kind === "SVG"
            const D = isSvg ? num(it.box, 52, 16, 240) * s : undefined
            const pad = num(it.holderPad, 12, 0, 80) * s
            const rad =
                it.holderShape === "Circle"
                    ? "50%"
                    : it.holderShape === "Square"
                      ? 10 * k
                      : 26 * k
            const look = it.holderLook || "Glass"
            const bg =
                look === "Chrome"
                    ? "linear-gradient(180deg,#ffffff 0%,#e6e8ec 40%,#c4c8d0 62%,#eef0f4 100%)"
                    : look === "Dark"
                      ? "linear-gradient(180deg,#262931 0%,#0e1014 100%)"
                      : look === "Tint"
                        ? it.holderTint || "#dfe5ee"
                        : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(233,236,241,0.92) 100%)"
            const holderDark = look === "Dark"
            const hRz =
                Math.ceil((isSvg ? num(it.box, 52, 16, 240) * s : h) * 1.6) + 16
            content = (
                <span
                    className="ab-holder"
                    style={{
                        width: D,
                        height: D,
                        padding: isSvg ? 0 : `${pad * 0.72}px ${pad * 1.35}px`,
                        borderRadius: rad,
                        background: bg,
                        boxShadow: [
                            gloss > 0.01
                                ? `inset 0 1px 0 ${rgba("#ffffff", holderDark ? 0.1 : gloss * 0.5)}`
                                : "",
                            `inset 0 -1px 0 ${rgba("#000000", holderDark ? 0.45 : 0.06)}`,
                        ]
                            .filter(Boolean)
                            .join(", "),
                    }}
                >
                    {rimW > 0 && (!master || ringW <= 0) && (
                        <span
                            className="ab-ring"
                            style={{
                                borderRadius: rad,
                                opacity: 0.9,
                                ...ringPad(rimW),
                                background: rimBg,
                            }}
                        />
                    )}
                    {master &&
                        it.holderAura !== false &&
                        auraGroup(rad as any, ringW, hRz, 0.9)}
                    <span className="ab-holder-content">{content}</span>
                </span>
            )
        }

        return (
            <span key={i} className="ab-item" style={{ opacity: fade }}>
                {content}
            </span>
        )
    })

    /* render */
    const inner = (
        <motion.span
            className="ab-btn"
            style={
                {
                    y,
                    scale: sc,
                    "--abp": hoverActive && spatial ? "112%" : "0%",
                    "--abs": hoverActive && spatial ? "366deg" : "0deg",
                    transition: `--abp ${Math.max(hoverTime, 1)}ms cubic-bezier(.33,.72,.2,1), --abs ${Math.max(hoverTime, 1)}ms cubic-bezier(.5,.05,.3,1)`,
                } as any
            }
            onHoverStart={() => setHover(true)}
            onHoverEnd={() => {
                setHover(false)
                setPressed(false)
            }}
            onTapStart={() => setPressed(true)}
            onTap={() => setPressed(false)}
            onTapCancel={() => setPressed(false)}
            onClick={props.onClick}
        >
            {u > 0.4 && (
                <span
                    className="ab-under"
                    style={{
                        left: -u,
                        right: -u,
                        top: -u,
                        bottom: -u,
                        borderRadius: R + u,
                        background: underBase,
                    }}
                >
                    <span
                        className="ab-ring"
                        style={{
                            borderRadius: R + u,
                            ...ringPad(edgeLightW),
                            background: edgeLightBg,
                        }}
                    />
                </span>
            )}

            <span
                className="ab-shell"
                style={{
                    borderRadius: R,
                    background: shellBg,
                    boxShadow: shellShadow,
                    backdropFilter:
                        frost > 0
                            ? `blur(${frost}px) saturate(1.3)`
                            : undefined,
                    WebkitBackdropFilter:
                        frost > 0
                            ? `blur(${frost}px) saturate(1.3)`
                            : undefined,
                    padding:
                        shape === "Circle"
                            ? 0
                            : `${padT * s}px ${padR * s}px ${padB * s}px ${padL * s}px`,
                    flexDirection: flow === "Column" ? "column" : "row",
                    flexWrap: wrap ? "wrap" : "nowrap",
                    justifyContent: JUST(justify),
                    alignItems: ALI(align),
                    alignContent: wrap ? JUST(lines) : undefined,
                    columnGap: (flow === "Row" ? gap : gapY) * s,
                    rowGap: (flow === "Row" ? gapY : gap) * s,
                }}
            >
                {gloss > 0.01 && (
                    <span
                        className="ab-shine"
                        style={{
                            opacity: gloss * (dark ? 0.22 : 0.7),
                            borderRadius: R,
                        }}
                    />
                )}
                {rendered.length > 0 ? (
                    rendered
                ) : (
                    <span
                        className="ab-ph"
                        style={{
                            width: h * 1.8,
                            height: h * 0.5,
                            color: rgba(ink, 0.45),
                            fontSize: Math.max(10, h * 0.16),
                        }}
                    >
                        Add items
                    </span>
                )}
            </span>

            {rimW > 0 && (!master || ringW <= 0) && (
                <span
                    className="ab-ring"
                    style={{
                        borderRadius: R,
                        opacity: 0.9,
                        ...ringPad(rimW),
                        background: rimBg,
                    }}
                />
            )}

            {master && auraGroup(R, ringW, rotor, 0.95)}
        </motion.span>
    )

    return (
        <>
            <style>{CSS + keyframes}</style>
            {href ? (
                <a
                    ref={rootRef as any}
                    className="ab-root"
                    style={props.style}
                    href={href}
                    target={link?.target === "_blank" ? "_blank" : undefined}
                    rel={
                        link?.target === "_blank"
                            ? "noreferrer noopener"
                            : undefined
                    }
                >
                    {inner}
                </a>
            ) : (
                <span
                    ref={rootRef as any}
                    className="ab-root"
                    style={props.style}
                >
                    {inner}
                </span>
            )}
        </>
    )
}

/* ---------------------------- property controls ---------------------------- */

const isText = (p: any) => p.kind !== "Text"
const isSvg = (p: any) => p.kind !== "SVG"
const noHolder = (p: any) => !p.holder
const notAuraPaint = (p: any) => p.paint !== "Aura"
const noBase = (p: any) => p.step === 0
const noCast = (p: any) => p.cast === 0

const PAL_OPTIONS = ["None", "Rainbow", "Pearl", "Ember", "Mint", "Invert"]
const PAL_TITLES = ["Off", "Rainbow", "Pearl", "Ember", "Mint", "Invert"]

addPropertyControls(Bloom_Button as any, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["Text", "SVG"],
                    optionTitles: ["Text", "SVG"],
                    defaultValue: "Text",
                },

                label: {
                    type: ControlType.String,
                    title: "Words",
                    defaultValue: "Aura Button",
                    hidden: isText,
                },
                font: {
                    type: ControlType.Font,
                    title: "Font",
                    defaultValue: {
                        fontFamily: "ui-sans-serif, system-ui, sans-serif",
                        fontSize: 20,
                        fontWeight: 600,
                    },
                    hidden: isText,
                },
                size: {
                    type: ControlType.Number,
                    title: "Size",
                    min: 0,
                    max: 200,
                    step: 1,
                    unit: "px",
                    defaultValue: 0,
                    hidden: isText,
                },
                ink: {
                    type: ControlType.Color,
                    title: "Ink",
                    defaultValue: "#3f434b",
                    hidden: isText,
                },

                source: {
                    type: ControlType.Enum,
                    title: "Source",
                    options: ["Upload", "Paste"],
                    optionTitles: ["File", "Paste"],
                    defaultValue: "Upload",
                    hidden: isSvg,
                },
                file: {
                    type: ControlType.File,
                    title: "File",
                    allowedFileTypes: ["svg"],
                    hidden: (p: any) =>
                        p.kind !== "SVG" || p.source !== "Upload",
                },
                code: {
                    type: ControlType.String,
                    title: "Code",
                    displayTextArea: true,
                    defaultValue: FALLBACK_SVG,
                    hidden: (p: any) =>
                        p.kind !== "SVG" || p.source !== "Paste",
                },
                iconSize: {
                    type: ControlType.Number,
                    title: "Size",
                    min: 5,
                    max: 100,
                    step: 1,
                    unit: "%",
                    defaultValue: 55,
                    hidden: isSvg,
                },

                paint: {
                    type: ControlType.Enum,
                    title: "Paint",
                    options: ["Aura", "Tint", "Artwork"],
                    optionTitles: ["Aura", "Tint", "Art"],
                    defaultValue: "Aura",
                },
                power: {
                    type: ControlType.Number,
                    title: "Power",
                    min: 0,
                    max: 1,
                    step: 0.05,
                    defaultValue: 0.8,
                    hidden: notAuraPaint,
                },
                base: {
                    type: ControlType.Number,
                    title: "Base",
                    min: 0,
                    max: 1,
                    step: 0.05,
                    defaultValue: 0.25,
                    hidden: notAuraPaint,
                },
                ink2: {
                    type: ControlType.Color,
                    title: "Ink",
                    defaultValue: "#565b64",
                    hidden: (p: any) => p.kind !== "SVG" || p.paint === "Aura",
                },

                holder: {
                    type: ControlType.Boolean,
                    title: "Holder",
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    defaultValue: false,
                },
                holderAura: {
                    type: ControlType.Boolean,
                    title: "Rim",
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    defaultValue: true,
                    hidden: noHolder,
                },
                holderLook: {
                    type: ControlType.Enum,
                    title: "Look",
                    options: ["Glass", "Chrome", "Dark", "Tint"],
                    optionTitles: ["Glass", "Chrome", "Dark", "Tint"],
                    defaultValue: "Dark",
                    hidden: noHolder,
                },
                holderTint: {
                    type: ControlType.Color,
                    title: "Tint",
                    defaultValue: "#dfe5ee",
                    hidden: (p: any) => !p.holder || p.holderLook !== "Tint",
                },
                holderShape: {
                    type: ControlType.Enum,
                    title: "Shape",
                    options: ["Circle", "Round", "Square"],
                    optionTitles: ["Circle", "Round", "Square"],
                    defaultValue: "Circle",
                    hidden: noHolder,
                },
                box: {
                    type: ControlType.Number,
                    title: "Box",
                    min: 16,
                    max: 240,
                    step: 1,
                    unit: "px",
                    defaultValue: 52,
                    hidden: (p: any) => !p.holder || p.kind !== "SVG",
                },
                holderPad: {
                    type: ControlType.Number,
                    title: "Pad",
                    min: 0,
                    max: 80,
                    step: 1,
                    unit: "px",
                    defaultValue: 12,
                    hidden: (p: any) => !p.holder || p.kind !== "Text",
                },

                fade: {
                    type: ControlType.Number,
                    title: "Fade",
                    min: 0,
                    max: 1,
                    step: 0.05,
                    defaultValue: 1,
                },
            },
        },
        defaultValue: [
            {
                kind: "SVG",
                source: "Paste",
                code: FALLBACK_SVG,
                iconSize: 52,
                paint: "Aura",
                power: 0.85,
                base: 0.5,
                holder: true,
                holderAura: true,
                holderLook: "Dark",
                holderShape: "Circle",
                box: 52,
                fade: 1,
            },
            {
                kind: "Text",
                label: "Aura Button",
                ink: "#3f434b",
                paint: "Aura",
                power: 0.7,
                holder: false,
                fade: 1,
            },
        ],
    },
    shell: {
        type: ControlType.Object,
        title: "Shell",
        controls: {
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["Pill", "Custom", "Circle"],
                optionTitles: ["Pill", "Custom", "Circle"],
                defaultValue: "Custom",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 2,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 120,
                hidden: (p: any) => p.shape !== "Custom",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            flow: {
                type: ControlType.Enum,
                title: "Flow",
                options: ["Row", "Column"],
                optionTitles: ["Row", "Col"],
                defaultValue: "Row",
            },
            justify: {
                type: ControlType.Enum,
                title: "Spread",
                options: [
                    "Start",
                    "Center",
                    "End",
                    "Between",
                    "Around",
                    "Evenly",
                ],
                optionTitles: [
                    "Start",
                    "Center",
                    "End",
                    "Between",
                    "Around",
                    "Evenly",
                ],
                defaultValue: "Start",
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["Start", "Center", "End", "Stretch", "Base"],
                optionTitles: ["Start", "Center", "End", "Stretch", "Base"],
                defaultValue: "Center",
            },
            wrap: {
                type: ControlType.Boolean,
                title: "Wrap",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: false,
            },
            lines: {
                type: ControlType.Enum,
                title: "Rows",
                options: [
                    "Start",
                    "Center",
                    "End",
                    "Between",
                    "Around",
                    "Evenly",
                ],
                optionTitles: [
                    "Start",
                    "Center",
                    "End",
                    "Between",
                    "Around",
                    "Evenly",
                ],
                defaultValue: "Center",
                hidden: (p: any) => !p.wrap,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap X",
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: 20,
            },
            gapY: {
                type: ControlType.Number,
                title: "Gap Y",
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: 10,
                hidden: (p: any) => !p.wrap,
            },
            padT: {
                type: ControlType.Number,
                title: "Pad T",
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: 10,
            },
            padR: {
                type: ControlType.Number,
                title: "Pad R",
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: 25,
            },
            padB: {
                type: ControlType.Number,
                title: "Pad B",
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: 10,
            },
            padL: {
                type: ControlType.Number,
                title: "Pad L",
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
                defaultValue: 15,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0.4,
                max: 2,
                step: 0.05,
                defaultValue: 0.9,
            },
        },
    },
    surface: {
        type: ControlType.Object,
        title: "Surface",
        controls: {
            theme: {
                type: ControlType.Enum,
                title: "Theme",
                options: ["Frost", "Chrome", "Midnight", "Custom"],
                optionTitles: ["Frost", "Chrome", "Night", "Custom"],
                defaultValue: "Custom",
            },
            fill: {
                type: ControlType.Color,
                title: "Paint",
                defaultValue: "#000000",
                hidden: (p: any) => p.theme !== "Custom",
            },
            gloss: {
                type: ControlType.Number,
                title: "Gloss",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0,
            },
            frost: {
                type: ControlType.Number,
                title: "Frost",
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            rim: {
                type: ControlType.Number,
                title: "Rim",
                min: 0,
                max: 6,
                step: 0.5,
                unit: "px",
                defaultValue: 0.5,
            },
            step: {
                type: ControlType.Number,
                title: "Base",
                min: 0,
                max: 14,
                step: 0.5,
                unit: "px",
                defaultValue: 5,
            },
            tone: {
                type: ControlType.Enum,
                title: "Tone",
                options: ["Auto", "Light", "Dark", "Ink"],
                optionTitles: ["Auto", "Light", "Dark", "Ink"],
                defaultValue: "Ink",
                hidden: noBase,
            },
            ink: {
                type: ControlType.Color,
                title: "Ink",
                defaultValue: "#0d0d0d",
                hidden: (p: any) => noBase(p) || p.tone !== "Ink",
            },
            baseLightMode: {
                type: ControlType.Enum,
                title: "Light",
                options: ["Even", "Angle"],
                optionTitles: ["Even", "Angle"],
                defaultValue: "Even",
                hidden: noBase,
            },
            baseAngle: {
                type: ControlType.Number,
                title: "Angle",
                min: 0,
                max: 360,
                step: 15,
                unit: "deg",
                defaultValue: 180,
                hidden: (p: any) => noBase(p) || p.baseLightMode !== "Angle",
            },
            baseLight: {
                type: ControlType.Color,
                title: "Edge",
                defaultValue: "#ffffff",
                hidden: noBase,
            },
        },
    },
    aura: {
        type: ControlType.Object,
        title: "Aura",
        controls: {
            master: {
                type: ControlType.Boolean,
                title: "Master",
                enabledTitle: "On",
                disabledTitle: "Off",
                defaultValue: true,
            },
            spectrum: {
                type: ControlType.Enum,
                title: "Palette",
                options: ["Rainbow", "Pearl", "Ember", "Mint", "Custom"],
                optionTitles: ["Rainbow", "Pearl", "Ember", "Mint", "Custom"],
                defaultValue: "Mint",
                hidden: (p: any) => p.master === false,
            },
            c1: {
                type: ControlType.Color,
                title: "Tone 1",
                defaultValue: "#4f83ff",
                hidden: (p: any) =>
                    p.master === false || p.spectrum !== "Custom",
            },
            c2: {
                type: ControlType.Color,
                title: "Tone 2",
                defaultValue: "#ff8a3c",
                hidden: (p: any) =>
                    p.master === false || p.spectrum !== "Custom",
            },
            c3: {
                type: ControlType.Color,
                title: "Tone 3",
                defaultValue: "#e44fd0",
                hidden: (p: any) =>
                    p.master === false || p.spectrum !== "Custom",
            },
            thick: {
                type: ControlType.Number,
                title: "Width",
                min: 0,
                max: 12,
                step: 0.5,
                unit: "px",
                defaultValue: 0.5,
                hidden: (p: any) => p.master === false,
            },
            track: {
                type: ControlType.Number,
                title: "Track",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.85,
                hidden: (p: any) => p.master === false,
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 40,
                hidden: (p: any) => p.master === false,
            },
            bloom: {
                type: ControlType.Number,
                title: "Bloom",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.8,
                hidden: (p: any) => p.master === false,
            },
            cast: {
                type: ControlType.Number,
                title: "Cast",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 1,
                hidden: (p: any) => p.master === false,
            },
            castDrop: {
                type: ControlType.Number,
                title: "Drop",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 6,
                hidden: (p: any) => noCast(p) || p.master === false,
            },
            castSoft: {
                type: ControlType.Number,
                title: "Soft",
                min: 0,
                max: 90,
                step: 1,
                unit: "px",
                defaultValue: 30,
                hidden: (p: any) => noCast(p) || p.master === false,
            },
            castSource: {
                type: ControlType.Enum,
                title: "Source",
                options: ["Palette", "Ink"],
                optionTitles: ["Palette", "Ink"],
                defaultValue: "Palette",
                hidden: (p: any) => noCast(p) || p.master === false,
            },
            castInk: {
                type: ControlType.Color,
                title: "Ink",
                defaultValue: "#0a0f14",
                hidden: (p: any) =>
                    noCast(p) || p.castSource !== "Ink" || p.master === false,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 4,
                step: 0.1,
                defaultValue: 0.8,
                hidden: (p: any) => p.master === false,
            },
            dir: {
                type: ControlType.Enum,
                title: "Spin",
                options: ["CW", "CCW"],
                optionTitles: ["CW", "CCW"],
                defaultValue: "CW",
                hidden: (p: any) => p.master === false,
            },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            idle: {
                type: ControlType.Enum,
                title: "Idle",
                options: ["Color", "Mono", "Dim"],
                optionTitles: ["Color", "Mono", "Dim"],
                defaultValue: "Color",
            },
            hover: {
                type: ControlType.Object,
                title: "On Hover",
                controls: {
                    fx: {
                        type: ControlType.Enum,
                        title: "Effect",
                        options: ["Pour", "Sweep", "Fade", "None"],
                        optionTitles: ["Pour", "Sweep", "Fade", "None"],
                        defaultValue: "Pour",
                        hidden: (p: any) => p.idle === "Color",
                    },
                    lift: {
                        type: ControlType.Number,
                        title: "Lift",
                        min: 0,
                        max: 16,
                        step: 1,
                        unit: "px",
                        defaultValue: 0,
                    },
                    time: {
                        type: ControlType.Number,
                        title: "Time",
                        min: 0,
                        max: 1600,
                        step: 25,
                        unit: "ms",
                        defaultValue: 650,
                        hidden: (p: any) =>
                            p.idle === "Color" || p.hover?.fx === "None",
                    },
                    power: {
                        type: ControlType.Number,
                        title: "Power",
                        min: 0,
                        max: 1,
                        step: 0.05,
                        defaultValue: 0.5,
                    },
                    speed: {
                        type: ControlType.Number,
                        title: "Speed",
                        min: 0,
                        max: 4,
                        step: 0.1,
                        defaultValue: 1.5,
                    },
                    palette: {
                        type: ControlType.Enum,
                        title: "Palette",
                        options: PAL_OPTIONS,
                        optionTitles: PAL_TITLES,
                        defaultValue: "None",
                    },
                    mix: {
                        type: ControlType.Number,
                        title: "Mix",
                        min: 0,
                        max: 2000,
                        step: 50,
                        unit: "ms",
                        defaultValue: 900,
                        hidden: (p: any) =>
                            !p.hover?.palette || p.hover?.palette === "None",
                    },
                },
            },
            press: {
                type: ControlType.Object,
                title: "While Press",
                controls: {
                    fx: {
                        type: ControlType.Enum,
                        title: "Effect",
                        options: ["None", "Flare", "Freeze", "Sink"],
                        optionTitles: ["None", "Flare", "Freeze", "Sink"],
                        defaultValue: "Flare",
                    },
                    squish: {
                        type: ControlType.Number,
                        title: "Squish",
                        min: 0.85,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.97,
                    },
                    time: {
                        type: ControlType.Number,
                        title: "Time",
                        min: 0,
                        max: 1200,
                        step: 25,
                        unit: "ms",
                        defaultValue: 200,
                        hidden: (p: any) =>
                            p.press?.fx === "None" || p.press?.fx === "Freeze",
                    },
                    power: {
                        type: ControlType.Number,
                        title: "Power",
                        min: 0,
                        max: 1,
                        step: 0.05,
                        defaultValue: 0.6,
                        hidden: (p: any) =>
                            p.press?.fx === "None" || p.press?.fx === "Freeze",
                    },
                    speed: {
                        type: ControlType.Number,
                        title: "Speed",
                        min: 0,
                        max: 4,
                        step: 0.1,
                        defaultValue: 0.5,
                        hidden: (p: any) =>
                            p.press?.fx === "None" || p.press?.fx === "Freeze",
                    },
                    palette: {
                        type: ControlType.Enum,
                        title: "Palette",
                        options: PAL_OPTIONS,
                        optionTitles: PAL_TITLES,
                        defaultValue: "None",
                    },
                    mix: {
                        type: ControlType.Number,
                        title: "Mix",
                        min: 0,
                        max: 2000,
                        step: 50,
                        unit: "ms",
                        defaultValue: 500,
                        hidden: (p: any) =>
                            !p.press?.palette || p.press?.palette === "None",
                    },
                },
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["Orbit", "Wave", "Liquid", "Pulse", "Scan"],
                optionTitles: ["Orbit", "Wave", "Liquid", "Pulse", "Scan"],
                defaultValue: "Orbit",
            },
            spring: {
                type: ControlType.Enum,
                title: "Feel",
                options: ["Silky", "Snappy", "Bouncy"],
                optionTitles: ["Silky", "Snappy", "Bouncy"],
                defaultValue: "Silky",
            },
        },
    },
    link: { type: ControlType.Link, title: "Link" },
    onClick: { type: ControlType.EventHandler, title: "On Click" },
})
