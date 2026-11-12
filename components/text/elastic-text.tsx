// Elastic Text: letters near the cursor widen and gain weight while the rest
// condense, so each line keeps its length. Built-in fonts stretch on their
// variable width axis; a custom font can use its own width axis or horizontal
// scaling, which works with any font.

import * as React from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Preset {
    title: string
    family: string
    fallback: string
    wdth: [number, number]
    wght: [number, number]
    ital?: boolean
    slnt?: number
    opsz?: [number, number]
}

// Google variable fonts with a width axis (ranges from the Google Fonts metadata).
const FONTS: Record<string, Preset> = {
    anybody: { title: "Anybody", family: "Anybody", fallback: "sans-serif", wdth: [50, 150], wght: [100, 900], ital: true },
    archivo: { title: "Archivo", family: "Archivo", fallback: "sans-serif", wdth: [62, 125], wght: [100, 900], ital: true },
    bricolage: { title: "Bricolage Grotesque", family: "Bricolage Grotesque", fallback: "sans-serif", wdth: [75, 100], wght: [200, 800], opsz: [12, 96] },
    datatype: { title: "Datatype", family: "Datatype", fallback: "monospace", wdth: [50, 150], wght: [100, 900] },
    georama: { title: "Georama", family: "Georama", fallback: "sans-serif", wdth: [62.5, 150], wght: [100, 900], ital: true },
    googleSansFlex: { title: "Google Sans Flex", family: "Google Sans Flex", fallback: "sans-serif", wdth: [25, 151], wght: [1, 1000], slnt: -10, opsz: [6, 144] },
    inconsolata: { title: "Inconsolata", family: "Inconsolata", fallback: "monospace", wdth: [50, 200], wght: [200, 900] },
    monaSans: { title: "Mona Sans", family: "Mona Sans", fallback: "sans-serif", wdth: [75, 125], wght: [200, 900], ital: true },
    notoSerifDisplay: { title: "Noto Serif Display", family: "Noto Serif Display", fallback: "serif", wdth: [62.5, 100], wght: [100, 900], ital: true },
    robotoFlex: { title: "Roboto Flex", family: "Roboto Flex", fallback: "sans-serif", wdth: [25, 151], wght: [100, 1000], slnt: -10, opsz: [8, 144] },
    robotoSerif: { title: "Roboto Serif", family: "Roboto Serif", fallback: "serif", wdth: [50, 150], wght: [100, 900], ital: true, opsz: [8, 144] },
    saira: { title: "Saira", family: "Saira", fallback: "sans-serif", wdth: [50, 125], wght: [100, 900], ital: true },
    scienceGothic: { title: "Science Gothic", family: "Science Gothic", fallback: "sans-serif", wdth: [50, 200], wght: [100, 900], slnt: -10 },
    tourney: { title: "Tourney", family: "Tourney", fallback: "sans-serif", wdth: [75, 125], wght: [100, 900], ital: true },
}
const FONT_KEYS = Object.keys(FONTS)

function googleHref(p: Preset) {
    const axes: string[] = []
    const ranges: string[] = []
    if (p.ital) axes.push("ital")
    if (p.opsz) {
        axes.push("opsz")
        ranges.push(`${p.opsz[0]}..${p.opsz[1]}`)
    }
    if (p.slnt !== undefined) {
        axes.push("slnt")
        ranges.push(`${p.slnt}..0`)
    }
    axes.push("wdth", "wght")
    ranges.push(`${p.wdth[0]}..${p.wdth[1]}`, `${p.wght[0]}..${p.wght[1]}`)
    const r = ranges.join(",")
    const tuples = p.ital ? `0,${r};1,${r}` : r
    return `https://fonts.googleapis.com/css2?family=${p.family.replace(/ /g, "+")}:${axes.join(",")}@${tuples}&display=swap`
}

type Trigger = "cursor" | "scroll" | "wave" | "none"

interface StretchOptions {
    amount: number
    weightBoost: number
    rest: number
    spread: number
    reach: number
    follow: "near" | "page"
    idle: "rest" | "wave"
    touch: "scroll" | "wave" | "rest"
}
interface WaveOptions {
    duration: number
    pause: number
    direction: "loop" | "bounce"
}
interface AppearOptions {
    style: "none" | "rise" | "unfold" | "both"
    delay: number
    stagger: number
    duration: number
    replay: boolean
}
interface SpringOptions {
    stiffness: number
    damping: number
}

interface Props {
    text: string
    font: string
    customFont?: CSSProperties
    method: "axis" | "scale"
    axisMin: number
    axisMax: number
    weight: number
    italic: boolean
    color: string
    stretchColor?: string
    sizing: "fill" | "fixed"
    fontSize: number
    lineFit: "each" | "longest"
    align: "left" | "center" | "right"
    textCase: "none" | "upper" | "lower"
    letterSpacing: number
    lineHeight: number
    trigger: Trigger
    stretch?: Partial<StretchOptions>
    wave?: Partial<WaveOptions>
    appear?: Partial<AppearOptions>
    spring?: Partial<SpringOptions>
    tag: "h1" | "h2" | "h3" | "p" | "span" | "div"
    canvasPreview: boolean
    style?: CSSProperties
}

// DEFAULTS:start (scripts/build-template.cjs swaps this block for the Noa Varga template copy)
const BASE = { text: "elastic", font: "anybody", weight: 800, color: "#111111", letterSpacing: -0.01, lineHeight: 0.92, trigger: "cursor" as Trigger, tag: "h1" as Props["tag"], canvasPreview: true }
const STRETCH: StretchOptions = { amount: 85, weightBoost: 250, rest: 40, spread: 1, reach: 120, follow: "near", idle: "wave", touch: "wave" }
const WAVE: WaveOptions = { duration: 2.2, pause: 1.4, direction: "bounce" }
const APPEAR: AppearOptions = { style: "both", delay: 0.1, stagger: 0.05, duration: 1.1, replay: false }
const SPRING: SpringOptions = { stiffness: 200, damping: 18 }
// DEFAULTS:end
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"
const NBSP = " "
const SCALE_MIN = 0.3
const SCALE_MAX = 3
const SCALE_GAIN = 1.6
// Head-room so a stretched line never quite touches the frame edge.
const SAFE = 1.002

const CSS = `
.elx-root{position:relative;margin:0;padding:0;white-space:nowrap;font-kerning:none;-webkit-user-select:none;user-select:none}
.elx-row{display:block}
.elx-mask{display:block;padding:.12em .08em .2em;margin:-.12em -.08em -.2em}
.elx-mask[data-clip="true"]{overflow:clip}
.elx-l{display:inline-block;vertical-align:top}
.elx-in{display:inline-block;transform-origin:0 50%}
.elx-measure{position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;font-size:100px;line-height:1}
.elx-measure>span>span{display:block;width:max-content}
.elx-sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
`

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

function useMedia(query: string) {
    const [match, setMatch] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia(query)
        const update = () => setMatch(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [query])
    return match
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

interface Letter {
    ch: string
    line: number
    pos: number // index within its line
}

/**
 * Elastic Text
 *
 * Text that stretches toward the cursor. Letters near the pointer widen while
 * the rest condense, so the line keeps its length.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ElasticText(props: Props) {
    const {
        text = BASE.text,
        font = BASE.font,
        customFont,
        method = "scale",
        axisMin = 75,
        axisMax = 125,
        weight = BASE.weight,
        italic = false,
        color = BASE.color,
        stretchColor,
        sizing = "fill",
        fontSize = 96,
        lineFit = "each",
        align = "left",
        textCase = "none",
        letterSpacing = BASE.letterSpacing,
        lineHeight = BASE.lineHeight,
        trigger = BASE.trigger,
        tag = BASE.tag,
        canvasPreview = BASE.canvasPreview,
        style,
    } = props
    const st = { ...STRETCH, ...props.stretch }
    const wv = { ...WAVE, ...props.wave }
    const ap = { ...APPEAR, ...props.appear }
    const sp = { ...SPRING, ...props.spring }

    const target = RenderTarget.current()
    const isStatic = target === RenderTarget.canvas || target === RenderTarget.thumbnail || target === RenderTarget.export
    const reduce = useMedia("(prefers-reduced-motion: reduce)")
    const fine = useMedia("(hover: hover) and (pointer: fine)")
    const instant = isStatic || reduce

    // ---- Font model -------------------------------------------------------
    const preset = font !== "custom" ? FONTS[font] ?? FONTS.anybody : null
    const useScale = !preset && method === "scale"
    const fontStyle: CSSProperties = preset
        ? { fontFamily: `"${preset.family}", ${preset.fallback}`, fontStyle: italic && preset.ital ? "italic" : "normal" }
        : {
              fontFamily: customFont?.fontFamily ?? "inherit",
              fontStyle: (customFont?.fontStyle as any) ?? "normal",
              fontWeight: (customFont?.fontWeight as any) ?? 400,
          }
    const slant = preset && italic && !preset.ital && preset.slnt !== undefined ? preset.slnt : 0
    const wRange: [number, number] = useScale ? [SCALE_MIN, SCALE_MAX] : preset ? preset.wdth : [Math.min(axisMin, axisMax), Math.max(axisMin, axisMax)]
    const gRange: [number, number] = preset ? preset.wght : [1, 1000]
    const wRest = useScale ? 1 : wRange[0] + (clamp(st.rest, 0, 100) / 100) * (wRange[1] - wRange[0])
    const wGain = useScale ? (st.amount / 100) * SCALE_GAIN : (st.amount / 100) * (wRange[1] - wRange[0])
    const gRest = preset ? clamp(weight, gRange[0], gRange[1]) : Number(customFont?.fontWeight ?? 400) || 400
    const useWeight = !!preset || st.weightBoost > 0
    const wStart = useScale ? 0.35 : wRange[0]

    // ---- Text model -------------------------------------------------------
    const cased = textCase === "upper" ? text.toUpperCase() : textCase === "lower" ? text.toLowerCase() : text
    const lines = useMemo(() => cased.split(/\r?\n/).map((l) => Array.from(l.replace(/ /g, NBSP))), [cased])
    const letters: Letter[] = useMemo(() => {
        const out: Letter[] = []
        lines.forEach((l, li) => l.forEach((ch, pos) => out.push({ ch, line: li, pos })))
        return out
    }, [lines])
    const n = letters.length
    const multi = lines.length > 1

    // Fill width needs a fixed width to fill; with auto width it falls back to Font size.
    const fixedWidth = !style || style.width === "100%" || typeof style.width === "number"
    const fill = sizing === "fill" && fixedWidth

    const rootRef = useRef<HTMLElement>(null)
    const measureRef = useRef<HTMLSpanElement>(null)
    const outer = useRef<(HTMLSpanElement | null)[]>([])
    const inner = useRef<(HTMLSpanElement | null)[]>([])
    // Letter widths in em at the narrowest, resting and widest stretch, per letter.
    const [metrics, setMetrics] = useState<{ ratios: number[]; widths: number[]; lo: number[]; hi: number[] } | null>(null)
    const [ready, setReady] = useState(false)
    const [phaseState, setPhase] = useState<"hidden" | "playing" | "done">(instant || ap.style === "none" ? "done" : "hidden")
    const phase = instant || ap.style === "none" ? "done" : phaseState

    const sim = useRef({
        w: [] as number[],
        vw: [] as number[],
        g: [] as number[],
        vg: [] as number[],
        tw: [] as number[],
        tg: [] as number[],
        tint: [] as number[],
        raf: 0,
        last: 0,
        pointer: null as null | { x: number; y: number },
        lastActive: -1e9,
        waveT: 0,
        entered: instant || ap.style === "none",
        visible: true,
    })
    if (sim.current.w.length !== n) {
        const s = sim.current
        const startW = s.entered ? wRest : ap.style === "unfold" || ap.style === "both" ? wStart : wRest
        s.w = letters.map(() => startW)
        s.tw = letters.map(() => startW)
        s.vw = letters.map(() => 0)
        s.g = letters.map(() => gRest)
        s.tg = letters.map(() => gRest)
        s.vg = letters.map(() => 0)
        s.tint = letters.map(() => -1)
    }

    // rAF always enters through `frame`, which runs the tick from the latest render,
    // so effects that captured an older `kick` never animate with stale props.
    const tickRef = useRef<(now: number) => void>(() => {})
    const frame = useRef((now: number) => tickRef.current(now)).current
    const instantRef = useRef(instant)
    instantRef.current = instant
    const kick = () => {
        const s = sim.current
        // Canvas, thumbnails and reduced motion render a still frame: never start the loop.
        if (instantRef.current || s.raf || typeof window === "undefined") return
        s.raf = requestAnimationFrame(frame)
    }

    // ---- Measuring --------------------------------------------------------
    useIsoLayoutEffect(() => {
        const m = measureRef.current
        if (!m) return
        let cancelled = false
        const measure = () => {
            if (cancelled || !measureRef.current) return
            const groups = Array.from(measureRef.current.children) as HTMLElement[]
            const read = (group: HTMLElement | undefined, ratios?: number[]) => {
                const out: number[] = []
                if (!group) return out
                Array.from(group.children).forEach((row) => {
                    if (ratios) ratios.push(Math.max(row.getBoundingClientRect().width, 1) / 100)
                    Array.from(row.children).forEach((c) => out.push((c as HTMLElement).getBoundingClientRect().width / 100))
                })
                return out
            }
            const ratios: number[] = []
            const widths = read(groups[0], ratios)
            let lo = widths.map((w) => w * SCALE_MIN)
            let hi = widths.map((w) => w * SCALE_MAX)
            if (!useScale) {
                lo = read(groups[1])
                hi = read(groups[2])
            }
            if (widths.length === n && lo.length === n && hi.length === n && ratios.every((r) => r > 0)) {
                setMetrics({ ratios, widths, lo, hi })
                setReady(true)
            }
        }
        measure()
        const fonts = (document as any).fonts
        const family = preset ? preset.family : String(customFont?.fontFamily ?? "").split(",")[0].replace(/["']/g, "").trim()
        if (fonts && family) {
            const spec = `${fontStyle.fontStyle === "italic" ? "italic " : ""}${Math.round(gRest)} 100px "${family}"`
            Promise.race([fonts.load(spec).catch(() => null), new Promise((r) => setTimeout(r, 2500))]).then(measure)
            fonts.ready?.then(measure)
            fonts.addEventListener?.("loadingdone", measure)
        }
        const timeout = window.setTimeout(() => setReady(true), 3000)
        return () => {
            cancelled = true
            clearTimeout(timeout)
            fonts?.removeEventListener?.("loadingdone", measure)
        }
    }, [cased, font, customFont?.fontFamily, customFont?.fontStyle, gRest, wRest, italic, letterSpacing, useScale, n])

    // ---- Writing ----------------------------------------------------------
    const restWidths = metrics?.widths
    const write = () => {
        const s = sim.current
        for (let i = 0; i < n; i++) {
            const el = outer.current[i]
            if (!el) continue
            const w = s.w[i]
            const gw = s.g[i]
            const parts: string[] = []
            if (!useScale) parts.push(`"wdth" ${w.toFixed(2)}`)
            if (useWeight) parts.push(`"wght" ${gw.toFixed(0)}`)
            if (slant) parts.push(`"slnt" ${slant}`)
            el.style.fontVariationSettings = parts.join(", ")
            if (useScale) {
                const nat = restWidths?.[i]
                if (nat) el.style.width = `${(nat * w).toFixed(4)}em`
                const inEl = inner.current[i]
                if (inEl) inEl.style.transform = `scaleX(${w.toFixed(4)})`
            }
            if (stretchColor) {
                const p = clamp((w - wRest) / Math.max(1e-6, (useScale ? wGain : wRange[1] - wRest)), 0, 1)
                const pct = Math.round(p * 100)
                if (pct !== s.tint[i]) {
                    s.tint[i] = pct
                    el.style.color = pct > 0 ? `color-mix(in srgb, ${stretchColor} ${pct}%, ${color})` : ""
                }
            } else if (s.tint[i] !== -1) {
                s.tint[i] = -1
                el.style.color = ""
            }
        }
    }

    // Targets: what the active letters gain the others give back, weighted by width and per line.
    const setTargets = (g: number[], amount: number) => {
        const s = sim.current
        const widths = restWidths ?? letters.map(() => 1)
        const sums = lines.map(() => 0)
        const tot = lines.map(() => 0)
        for (let i = 0; i < n; i++) {
            sums[letters[i].line] += g[i] * widths[i]
            tot[letters[i].line] += widths[i]
        }
        for (let i = 0; i < n; i++) {
            const mean = sums[letters[i].line] / (tot[letters[i].line] || 1)
            const d = amount * (g[i] - mean)
            s.tw[i] = clamp(wRest + wGain * d, wRange[0], wRange[1])
            s.tg[i] = clamp(gRest + st.weightBoost * d, gRange[0], gRange[1])
        }
        if (metrics) balance(s.tw)
    }

    // Width of letter i (em) at stretch value v, interpolated from the three measurements.
    const widthAt = (i: number, v: number) => {
        const m = metrics!
        if (v <= wRest) return m.lo[i] + (m.widths[i] - m.lo[i]) * ((v - wRange[0]) / Math.max(1e-6, wRest - wRange[0]))
        return m.widths[i] + (m.hi[i] - m.widths[i]) * ((v - wRest) / Math.max(1e-6, wRange[1] - wRest))
    }
    const slopeAt = (i: number, v: number) => {
        const m = metrics!
        return v < wRest ? (m.widths[i] - m.lo[i]) / Math.max(1e-6, wRest - wRange[0]) : (m.hi[i] - m.widths[i]) / Math.max(1e-6, wRange[1] - wRest)
    }
    const balance = (tw: number[]) => {
        for (let li = 0; li < lines.length; li++) {
            for (let iter = 0; iter < 5; iter++) {
                let excess = 0
                let give = 0
                for (let i = 0; i < n; i++) if (letters[i].line === li) excess += widthAt(i, tw[i]) - metrics!.widths[i]
                if (Math.abs(excess) < 1e-4) break
                for (let i = 0; i < n; i++) {
                    if (letters[i].line !== li) continue
                    const free = excess > 0 ? tw[i] > wRange[0] + 1e-6 : tw[i] < wRange[1] - 1e-6
                    if (free) give += slopeAt(i, tw[i]) || 1e-3
                }
                if (give <= 0) break
                const shift = -excess / give
                for (let i = 0; i < n; i++) {
                    if (letters[i].line !== li) continue
                    const free = excess > 0 ? tw[i] > wRange[0] + 1e-6 : tw[i] < wRange[1] - 1e-6
                    if (free) tw[i] = clamp(tw[i] + shift, wRange[0], wRange[1])
                }
            }
        }
    }
    const setRest = () => {
        const s = sim.current
        s.tw.fill(wRest)
        s.tg.fill(gRest)
    }

    // Influence of a bump at position p (in letters) travelling along every line.
    const lineBump = (p: number) => {
        const sigma = Math.max(0.3, st.spread * 1.15)
        return letters.map((l) => {
            const len = lines[l.line].length
            const x = p * (len + 3) - 1.5
            return Math.exp(-((l.pos - x) ** 2) / (2 * sigma * sigma))
        })
    }

    const fromPointer = () => {
        const s = sim.current
        const p = s.pointer
        const root = rootRef.current
        if (!p || !root) return false
        const box = root.getBoundingClientRect()
        const far = st.follow === "near" && (p.y < box.top - st.reach - box.height || p.y > box.bottom + st.reach + box.height)
        if (far) return false
        const g: number[] = []
        let any = false
        for (let i = 0; i < n; i++) {
            const r = outer.current[i]?.getBoundingClientRect()
            if (!r) return false
            const size = r.height || 100
            const sigma = 0.75 * size * Math.max(0.2, st.spread)
            const dx = p.x - (r.left + r.width / 2)
            let fy = 1
            if (st.follow === "near") {
                const dy = Math.max(0, Math.abs(p.y - (r.top + r.height / 2)) - r.height / 2)
                fy = st.reach > 0 ? clamp(1 - dy / st.reach, 0, 1) : dy > 0 ? 0 : 1
            }
            const v = Math.exp(-(dx * dx) / (2 * sigma * sigma)) * fy
            if (v > 0.01) any = true
            g.push(v)
        }
        if (!any) return false
        setTargets(g, 1)
        return true
    }

    const waveAt = (t: number) => {
        const cycle = wv.duration + wv.pause
        const k = (t % cycle) / Math.max(0.01, wv.duration)
        if (k > 1) return null
        const eased = 0.5 - Math.cos(Math.PI * k) / 2
        const dir = wv.direction === "bounce" && Math.floor(t / cycle) % 2 === 1 ? 1 - eased : eased
        return lineBump(dir)
    }

    // Which behaviour drives the letters right now.
    const mode: Trigger | "touchScroll" | "touchWave" = trigger === "cursor" && !fine ? (st.touch === "scroll" ? "touchScroll" : st.touch === "wave" ? "touchWave" : "none") : trigger
    const continuous = mode === "wave" || mode === "touchWave" || (mode === "cursor" && st.idle === "wave")

    const tick = (now: number) => {
        const s = sim.current
        const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 1 / 60
        s.last = now
        let keepAlive = false
        if (s.entered && s.visible) {
            if (mode === "cursor") {
                if (fromPointer()) s.lastActive = now
                else if (st.idle === "wave" && now - s.lastActive > 700) {
                    s.waveT += dt
                    const g = waveAt(s.waveT)
                    g ? setTargets(g, 1) : setRest()
                } else setRest()
                if (st.idle === "wave") keepAlive = true
            } else if (mode === "wave" || mode === "touchWave") {
                s.waveT += dt
                const g = waveAt(s.waveT)
                g ? setTargets(g, 1) : setRest()
                keepAlive = true
            } else if (mode === "scroll" || mode === "touchScroll") {
                const r = rootRef.current?.getBoundingClientRect()
                if (r) {
                    const vh = window.innerHeight
                    const k = ((vh - r.top) / (vh + r.height) - 0.3) / 0.5
                    k > 0 && k < 1 ? setTargets(lineBump(k), 0.9) : setRest()
                }
            }
        }
        // Fixed-step spring, so the feel is the same at 60 Hz and 120 Hz.
        const h = 1 / 240
        const steps = Math.min(48, Math.ceil(dt / h))
        const k = sp.stiffness
        const c = sp.damping
        const epsW = useScale ? 0.0015 : (wRange[1] - wRange[0]) * 0.0015
        let moving = false
        for (let i = 0; i < n; i++) {
            let w = s.w[i], vw = s.vw[i], gg = s.g[i], vg = s.vg[i]
            const tw = s.tw[i], tg = s.tg[i]
            for (let j = 0; j < steps; j++) {
                vw += (k * (tw - w) - c * vw) * h
                w += vw * h
                vg += (k * (tg - gg) - c * vg) * h
                gg += vg * h
            }
            s.w[i] = w; s.vw[i] = vw; s.g[i] = gg; s.vg[i] = vg
            if (Math.abs(tw - w) > epsW || Math.abs(vw) > epsW * 4 || Math.abs(tg - gg) > 0.5 || Math.abs(vg) > 2) moving = true
        }
        write()
        if ((moving || keepAlive) && s.visible) s.raf = requestAnimationFrame(frame)
        else {
            s.raf = 0
            s.last = 0
        }
    }
    tickRef.current = tick

    // ---- Static & reduced-motion rendering -----------------------------------
    useIsoLayoutEffect(() => {
        if (!instant) return
        const s = sim.current
        s.entered = true
        if (isStatic && canvasPreview && trigger !== "none") setTargets(lineBump(0.38), 1)
        else setRest()
        s.w = s.tw.slice()
        s.g = s.tg.slice()
        write()
    })

    // Rest values changed (weight, rest width, font): settle there.
    useEffect(() => {
        if (instant || !sim.current.entered) return
        setRest()
        kick()
    }, [wRest, gRest, wRange[0], wRange[1], useScale])

    useIsoLayoutEffect(() => {
        if (instant || !(ap.style === "unfold" || ap.style === "both") || phase !== "hidden") return
        const s = sim.current
        s.w.fill(wStart)
        s.tw.fill(wStart)
        s.vw.fill(0)
        write()
    }, [ready, phase, metrics, instant, ap.style, wStart])

    // ---- Visibility & appear ------------------------------------------------
    const [inView, setInView] = useState(false)
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            ([e]) => {
                sim.current.visible = e.isIntersecting
                setInView(e.isIntersecting && e.intersectionRatio >= 0.2)
                if (e.isIntersecting) kick()
            },
            { threshold: [0, 0.2] }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    const rise = ap.style === "rise" || ap.style === "both"
    const unfold = ap.style === "unfold" || ap.style === "both"
    useEffect(() => {
        if (instant || !ready || ap.style === "none") return
        const s = sim.current
        if (!inView) {
            if (ap.replay && phase === "done") {
                s.entered = false
                if (unfold) {
                    s.w.fill(wStart)
                    s.tw.fill(wStart)
                    s.vw.fill(0)
                    write()
                }
                setPhase("hidden")
            }
            return
        }
        if (phase !== "hidden") return
        setPhase("playing")
        const timers: number[] = []
        if (unfold) {
            s.w.fill(wStart)
            s.tw.fill(wStart)
            write()
            letters.forEach((_, i) =>
                timers.push(
                    window.setTimeout(() => {
                        s.tw[i] = wRest
                        kick()
                    }, (ap.delay + i * ap.stagger) * 1000)
                )
            )
        }
        timers.push(
            window.setTimeout(() => {
                s.entered = true
                setPhase("done")
                kick()
            }, (ap.delay + Math.max(0, n - 1) * ap.stagger + ap.duration) * 1000)
        )
        return () => timers.forEach(clearTimeout)
    }, [inView, ready, instant, ap.style, ap.replay])

    // ---- Input -------------------------------------------------------------
    useEffect(() => {
        if (instant || mode !== "cursor") return
        const onMove = (e: PointerEvent) => {
            if (e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return
            sim.current.pointer = { x: e.clientX, y: e.clientY }
            kick()
        }
        const onLeave = () => {
            sim.current.pointer = null
            kick()
        }
        const onScroll = () => sim.current.pointer && kick()
        window.addEventListener("pointermove", onMove, { passive: true })
        window.addEventListener("scroll", onScroll, { passive: true })
        document.documentElement.addEventListener("pointerleave", onLeave)
        window.addEventListener("blur", onLeave)
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("scroll", onScroll)
            document.documentElement.removeEventListener("pointerleave", onLeave)
            window.removeEventListener("blur", onLeave)
        }
    }, [instant, mode])

    useEffect(() => {
        if (instant || (mode !== "scroll" && mode !== "touchScroll")) return
        const onScroll = () => kick()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
        }
    }, [instant, mode])

    // Continuous modes and settings changes restart the loop.
    useEffect(() => {
        if (instant) return
        if (continuous || sim.current.entered) kick()
    }, [instant, continuous, mode, sp.stiffness, sp.damping, st.amount, st.weightBoost, st.spread, wv.duration, wv.pause, wv.direction])

    useEffect(() => {
        const s = sim.current
        return () => {
            cancelAnimationFrame(s.raf)
            s.raf = 0
        }
    }, [])

    // ---- Render ------------------------------------------------------------
    const ratios = metrics?.ratios ?? lines.map((l) => Math.max(1, l.length) * 0.6)
    const longest = Math.max(...ratios)
    const rowFont = (li: number) => {
        if (!fill) return `${fontSize}px`
        const r = lineFit === "each" ? ratios[li] : longest
        return `calc(100cqw / ${(r * SAFE).toFixed(4)})`
    }
    const rowAlign = fill && lineFit === "each" ? "left" : align
    const restSettings = [!useScale ? `"wdth" ${wRest.toFixed(2)}` : "", useWeight ? `"wght" ${Math.round(gRest)}` : "", slant ? `"slnt" ${slant}` : ""].filter(Boolean).join(", ")
    const withWidth = (v: number) => restSettings.replace(/"wdth" [\d.]+/, `"wdth" ${v}`)
    const startSettings = !useScale && unfold && !instant ? withWidth(wStart) : restSettings
    const hiddenRise = rise && !instant && phase === "hidden"

    const Tag = tag as any
    let index = -1
    return (
        <Tag
            ref={rootRef}
            className="elx-root"
            style={{
                ...style,
                ...fontStyle,
                color,
                width: fill ? "100%" : style?.width ?? "max-content",
                containerType: fill ? "inline-size" : undefined,
                lineHeight,
                letterSpacing: `${letterSpacing}em`,
                textAlign: rowAlign,
            }}
        >
            <style>{CSS}</style>
            {preset && <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />}
            {preset && <link rel="stylesheet" href={googleHref(preset)} />}
            <span className="elx-sr">{lines.map((l) => l.join("").replace(/ /g, " ")).join(" ")}</span>
            <span aria-hidden="true" style={{ display: "block", visibility: ready ? "visible" : "hidden" }}>
                {lines.map((line, li) => (
                    <span key={li} className="elx-row" style={{ fontSize: rowFont(li) }}>
                        <span className="elx-mask" data-clip={rise && !instant && phase !== "done" ? "true" : "false"}>
                            {line.map((ch) => {
                                index++
                                const i = index
                                return (
                                    <span
                                        key={i}
                                        className="elx-l"
                                        ref={(el) => {
                                            outer.current[i] = el
                                        }}
                                        style={{
                                            fontVariationSettings: phase === "done" ? restSettings : startSettings,
                                            transform: hiddenRise ? "translateY(115%)" : "none",
                                            transition: rise && phase === "playing" ? `transform ${ap.duration}s ${EASE} ${(ap.delay + i * ap.stagger).toFixed(3)}s` : "none",
                                        }}
                                    >
                                        {useScale ? (
                                            <span
                                                className="elx-in"
                                                ref={(el) => {
                                                    inner.current[i] = el
                                                }}
                                            >
                                                {ch}
                                            </span>
                                        ) : (
                                            ch
                                        )}
                                    </span>
                                )
                            })}
                        </span>
                    </span>
                ))}
            </span>
            <span className="elx-measure" aria-hidden="true" ref={measureRef}>
                {(useScale ? [restSettings] : [restSettings, withWidth(wRange[0]), withWidth(wRange[1])]).map((fvs, gi) => (
                    <span key={gi}>
                        {lines.map((line, li) => (
                            <span key={li}>
                                {line.map((ch, ci) => (
                                    <span key={ci} className="elx-l" style={{ fontVariationSettings: fvs }}>
                                        {ch}
                                    </span>
                                ))}
                            </span>
                        ))}
                    </span>
                ))}
            </span>
        </Tag>
    )
}

ElasticText.displayName = "Elastic Text"

const isCustom = (p: Partial<Props>) => p.font === "custom"
const fontOptions = [...FONT_KEYS, "custom"]
const fontTitles = [...FONT_KEYS.map((k) => FONTS[k].title), "Custom"]

addPropertyControls(ElasticText, {
    text: { type: ControlType.String, title: "Text", defaultValue: BASE.text, displayTextArea: true, description: "Each new line becomes its own row." },
    font: { type: ControlType.Enum, title: "Font", options: fontOptions, optionTitles: fontTitles, defaultValue: BASE.font },
    customFont: {
        type: ControlType.Font,
        title: "Family",
        controls: "basic",
        defaultFontType: "sans-serif",
        displayFontSize: false,
        displayTextAlignment: false,
        hidden: (p: Partial<Props>) => !isCustom(p),
    },
    method: {
        type: ControlType.Enum,
        title: "Stretch by",
        options: ["scale", "axis"],
        optionTitles: ["Scaling", "Width axis"],
        displaySegmentedControl: true,
        defaultValue: "scale",
        description: "Scaling works with any font. Width axis needs a variable font with a wdth axis.",
        hidden: (p: Partial<Props>) => !isCustom(p),
    },
    axisMin: { type: ControlType.Number, title: "Axis min", defaultValue: 75, min: 1, max: 200, step: 0.5, hidden: (p: Partial<Props>) => !isCustom(p) || p.method !== "axis" },
    axisMax: { type: ControlType.Number, title: "Axis max", defaultValue: 125, min: 1, max: 200, step: 0.5, hidden: (p: Partial<Props>) => !isCustom(p) || p.method !== "axis" },
    weight: { type: ControlType.Number, title: "Weight", defaultValue: BASE.weight, min: 100, max: 1000, step: 10, hidden: isCustom },
    italic: { type: ControlType.Boolean, title: "Italic", defaultValue: false, description: "Uses the italic or slant axis when the font has one.", hidden: isCustom },
    color: { type: ControlType.Color, title: "Color", defaultValue: BASE.color },
    stretchColor: { type: ControlType.Color, title: "Stretch color", optional: true, description: "Tints letters as they widen." },
    sizing: {
        type: ControlType.Enum,
        title: "Size",
        options: ["fill", "fixed"],
        optionTitles: ["Fill width", "Fixed"],
        displaySegmentedControl: true,
        defaultValue: "fill",
        description: "Fill width sizes the text to the frame. It needs a fixed width.",
    },
    fontSize: { type: ControlType.Number, title: "Font size", defaultValue: 96, min: 8, max: 600, step: 1, unit: "px", hidden: (p: Partial<Props>) => p.sizing !== "fixed" },
    lineFit: {
        type: ControlType.Enum,
        title: "Rows",
        options: ["each", "longest"],
        optionTitles: ["Each fills", "Same size"],
        displaySegmentedControl: true,
        defaultValue: "each",
        hidden: (p: Partial<Props>) => p.sizing === "fixed" || !String(p.text ?? "").includes("\n"),
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
        hidden: (p: Partial<Props>) => p.sizing !== "fixed" && !(p.lineFit === "longest" && String(p.text ?? "").includes("\n")),
    },
    textCase: { type: ControlType.Enum, title: "Case", options: ["none", "upper", "lower"], optionTitles: ["As typed", "Upper", "Lower"], displaySegmentedControl: true, defaultValue: "none" },
    letterSpacing: { type: ControlType.Number, title: "Spacing", defaultValue: BASE.letterSpacing, min: -0.1, max: 0.3, step: 0.005, unit: "em" },
    lineHeight: { type: ControlType.Number, title: "Line height", defaultValue: BASE.lineHeight, min: 0.6, max: 1.6, step: 0.01, unit: "em", hidden: (p: Partial<Props>) => !String(p.text ?? "").includes("\n") },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["cursor", "scroll", "wave", "none"],
        optionTitles: ["Cursor", "Scroll", "Wave", "None"],
        defaultValue: BASE.trigger,
        description: "Cursor follows the pointer. Scroll runs through the text as it scrolls by. Wave plays on its own.",
    },
    stretch: {
        type: ControlType.Object,
        title: "Stretch",
        icon: "effect",
        hidden: (p: Partial<Props>) => p.trigger === "none",
        controls: {
            amount: { type: ControlType.Number, title: "Amount", defaultValue: STRETCH.amount, min: 0, max: 100, step: 1, unit: "%" },
            weightBoost: { type: ControlType.Number, title: "Weight", defaultValue: STRETCH.weightBoost, min: 0, max: 600, step: 10, description: "Extra weight for wide letters. Needs a variable font." },
            rest: { type: ControlType.Number, title: "Rest width", hidden: (_: any, root: Partial<Props>) => root?.font === "custom" && root?.method !== "axis", defaultValue: STRETCH.rest, min: 0, max: 100, step: 1, unit: "%", description: "Where the width axis sits when nothing moves." },
            spread: { type: ControlType.Number, title: "Spread", defaultValue: STRETCH.spread, min: 0.3, max: 3, step: 0.05, description: "How many letters each bulge covers." },
            reach: { type: ControlType.Number, title: "Reach", hidden: (_: any, root: Partial<Props>) => root?.trigger !== "cursor", defaultValue: STRETCH.reach, min: 0, max: 800, step: 10, unit: "px", description: "How far above or below the text the cursor still counts." },
            follow: { type: ControlType.Enum, title: "Follow", hidden: (_: any, root: Partial<Props>) => root?.trigger !== "cursor", options: ["near", "page"], optionTitles: ["Near text", "Whole page"], displaySegmentedControl: true, defaultValue: STRETCH.follow },
            idle: { type: ControlType.Enum, title: "When idle", hidden: (_: any, root: Partial<Props>) => root?.trigger !== "cursor", options: ["rest", "wave"], optionTitles: ["Rest", "Wave"], displaySegmentedControl: true, defaultValue: STRETCH.idle },
            touch: { type: ControlType.Enum, title: "On touch", hidden: (_: any, root: Partial<Props>) => root?.trigger !== "cursor", options: ["scroll", "wave", "rest"], optionTitles: ["Scroll", "Wave", "Rest"], displaySegmentedControl: true, defaultValue: STRETCH.touch, description: "Phones and tablets have no cursor." },
        },
    },
    wave: {
        type: ControlType.Object,
        title: "Wave",
        icon: "effect",
        hidden: (p: Partial<Props>) => p.trigger === "none" || p.trigger === "scroll",
        controls: {
            duration: { type: ControlType.Number, title: "Pass", defaultValue: WAVE.duration, min: 0.4, max: 10, step: 0.1, unit: "s" },
            pause: { type: ControlType.Number, title: "Pause", defaultValue: WAVE.pause, min: 0, max: 5, step: 0.1, unit: "s" },
            direction: { type: ControlType.Enum, title: "Direction", options: ["loop", "bounce"], optionTitles: ["Loop", "Bounce"], displaySegmentedControl: true, defaultValue: WAVE.direction },
        },
    },
    appear: {
        type: ControlType.Object,
        title: "Appear",
        icon: "effect",
        controls: {
            style: { type: ControlType.Enum, title: "Style", options: ["none", "rise", "unfold", "both"], optionTitles: ["None", "Rise", "Unfold", "Both"], defaultValue: APPEAR.style },
            delay: { type: ControlType.Number, title: "Delay", defaultValue: APPEAR.delay, min: 0, max: 5, step: 0.05, unit: "s" },
            stagger: { type: ControlType.Number, title: "Stagger", defaultValue: APPEAR.stagger, min: 0, max: 0.5, step: 0.01, unit: "s" },
            duration: { type: ControlType.Number, title: "Duration", defaultValue: APPEAR.duration, min: 0.2, max: 3, step: 0.05, unit: "s" },
            replay: { type: ControlType.Boolean, title: "Replay", defaultValue: APPEAR.replay },
        },
    },
    spring: {
        type: ControlType.Object,
        title: "Spring",
        icon: "interaction",
        hidden: (p: Partial<Props>) => p.trigger === "none",
        controls: {
            stiffness: { type: ControlType.Number, title: "Stiffness", defaultValue: SPRING.stiffness, min: 20, max: 1000, step: 5 },
            damping: { type: ControlType.Number, title: "Damping", defaultValue: SPRING.damping, min: 1, max: 80, step: 1, description: "Lower values bounce more." },
        },
    },
    tag: { type: ControlType.Enum, title: "Tag", options: ["h1", "h2", "h3", "p", "span", "div"], optionTitles: ["H1", "H2", "H3", "P", "Span", "Div"], defaultValue: BASE.tag },
    canvasPreview: {
        type: ControlType.Boolean,
        title: "On canvas",
        defaultValue: BASE.canvasPreview,
        enabledTitle: "Stretched",
        disabledTitle: "At rest",
        description: "How the text looks while you design. The live site always starts at rest.",
    },
})
