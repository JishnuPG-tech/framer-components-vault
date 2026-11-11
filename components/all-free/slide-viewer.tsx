// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, type CSSProperties } from "react"

// ─────────────────────────────────────────────────────────────
// Types & defaults
// ─────────────────────────────────────────────────────────────

interface Img {
    src?: string
    srcSet?: string
    alt?: string
}
interface Slide {
    image?: Img
    caption?: string
}
interface Palette {
    body?: string
    light?: string
    mount?: string
    caption?: string
    text?: string
    shadow?: string
    shadowStrength?: number
}

interface ViewerProps {
    slides: Slide[]
    mark?: string
    label?: string
    theme: "Dark" | "Light" | "Auto"
    dark?: Palette
    light?: Palette
    font?: Record<string, any>
    auto: boolean
    interval: number
    sound: boolean
    haptics: boolean
    onChange?: () => void
    style?: CSSProperties
}

const DEFAULT_SLIDES: Slide[] = [
    { image: { src: "https://images.unsplash.com/photo-1736641933920-a8ce493f554f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400", alt: "Curved concrete facade with small round windows" }, caption: "Concrete waves" },
    { image: { src: "https://images.unsplash.com/photo-1582854149732-260fb3de24df?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400", alt: "Plant in a white jug on a sill in soft window light" }, caption: "Window, morning" },
    { image: { src: "https://images.unsplash.com/photo-1506452305024-9d3f02d1c9b5?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400", alt: "Pine forest disappearing into fog" }, caption: "Fog over pines" },
    { image: { src: "https://images.unsplash.com/photo-1772208392357-e074b8c1f100?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400", alt: "Corduroy sofa under two warm wall lamps" }, caption: "Reading light" },
    { image: { src: "https://images.unsplash.com/photo-1681174068991-61feda30b993?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400", alt: "Black and white sand dune ripples" }, caption: "Dune ripples" },
]
// strength is in %, 100 = the graphite depth the viewer was drawn with
const DEFAULT_DARK: Required<Palette> = { body: "#2E2E2B", light: "#FFE9C6", mount: "#D9D7D0", caption: "#2B2B28", text: "#A5A59F", shadow: "#000000", shadowStrength: 100 }
const DEFAULT_LIGHT: Required<Palette> = { body: "#E6E5E0", light: "#FFF4E2", mount: "#F6F5F1", caption: "#3A3A36", text: "#9C9B95", shadow: "#2B2A26", shadowStrength: 50 }
// the object's own proportions: body (1 : 0.82) plus room above it for the waiting slides and lever
const OBJECT_RATIO = "1 / 0.91"
const BODY_SHARE = "90.11%" // 0.82 / 0.91
const DEFAULT_FAMILY = '"Geist", "Geist Placeholder", system-ui, sans-serif'

// ─────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────

const SHELL_CSS = `
.jbi-sv-win:focus-visible, .jbi-sv-btn:focus-visible { outline: 2px solid var(--jbi-sv-ring); outline-offset: 3px; }
@keyframes jbiSvOutDown { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, 106%, 0); } }
@keyframes jbiSvInDown { from { transform: translate3d(0, -106%, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes jbiSvOutUp { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, -106%, 0); } }
@keyframes jbiSvInUp { from { transform: translate3d(0, 106%, 0); } to { transform: translate3d(0, 0, 0); } }
@keyframes jbiSvFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes jbiSvEdgeIn { from { transform: translate3d(0, var(--fy), 0) scaleX(var(--fs)); opacity: var(--fo); } to { transform: translate3d(0, 0, 0) scaleX(var(--ts)); opacity: var(--to); } }
@keyframes jbiSvEdgeOut { from { transform: translate3d(0, 0, 0) scaleX(var(--fs)); opacity: var(--fo); } to { transform: translate3d(0, var(--ty), 0) scaleX(var(--fs)); opacity: var(--to); } }
@keyframes jbiSvDip { 0% { opacity: 1; } 35% { opacity: .84; } 55% { opacity: .96; } 70% { opacity: .9; } 100% { opacity: 1; } }
.jbi-sv-glow.dip { animation: jbiSvDip .52s ease-out; }
@media (prefers-reduced-motion: reduce) { .jbi-sv-glow.dip { animation: none; } }
`



// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

// Unwraps Framer's var(--token, rgb()) and returns [r, g, b, a]
function parseColor(input: string | undefined, fallback: number[] = [26, 26, 25, 1]): number[] {
    if (!input) return fallback
    let s = input.trim()
    const v = s.match(/^var\([^,]+,\s*(.+)\)$/)
    if (v) s = v[1].trim()
    if (s === "transparent") return [0, 0, 0, 0]
    const hex = s.match(/^#([0-9a-f]{3,8})$/i)
    if (hex) {
        let h = hex[1]
        if (h.length <= 4) h = h.split("").map((c) => c + c).join("")
        const n = parseInt(h.slice(0, 6), 16)
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255, h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1]
    }
    const rgb = s.match(/rgba?\(([^)]+)\)/)
    if (rgb) {
        const p = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number)
        return [p[0] || 0, p[1] || 0, p[2] || 0, p[3] ?? 1]
    }
    return fallback
}
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const shadeOf = (c: number[], k: number) => `rgb(${Math.round(clamp(c[0] * k, 0, 255))},${Math.round(clamp(c[1] * k, 0, 255))},${Math.round(clamp(c[2] * k, 0, 255))})`

const pad = (n: number) => String(n).padStart(2, "0")

// Auto theme follows the visitor; dark until we know, so the server render matches
function usePrefersDark() {
    const [dark, setDark] = useState(true)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const m = window.matchMedia("(prefers-color-scheme: dark)")
        const on = () => setDark(m.matches)
        on()
        m.addEventListener?.("change", on)
        return () => m.removeEventListener?.("change", on)
    }, [])
    return dark
}

// ─────────────────────────────────────────────────────────────
// Slide viewer
// ─────────────────────────────────────────────────────────────

/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 364
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight any-prefer-auto
 */
export default function SlideViewer(props: ViewerProps) {
    const {
        slides: slidesProp = DEFAULT_SLIDES,
        label = "Gallery",
        theme = "Dark",
        auto = false,
        interval = 5,
        sound = true,
        haptics = true,
        font,
        style,
    } = props

    const isOnCanvas = useIsOnFramerCanvas()
    const isStatic = useIsStaticRenderer()
    const live = !isOnCanvas && !isStatic

    const prefersDark = usePrefersDark()
    const isLight = theme === "Light" || (theme === "Auto" && !prefersDark)
    const base = isLight ? DEFAULT_LIGHT : DEFAULT_DARK
    const col = { ...base, ...((isLight ? props.light : props.dark) || {}) }
    const shC = parseColor(col.shadow, parseColor(base.shadow))
    const shK = clamp((col.shadowStrength ?? base.shadowStrength) / 100, 0, 2)
    // every shadow, rim and engraved edge goes through here
    const sh = (a: number) => rgba(shC, clamp(a * shK, 0, 1))
    // light materials need a much gentler falloff than graphite
    const g3 = (dark: number, light: number) => (isLight ? light : dark)
    // Framer drops image defaults inside arrays, so empty slides borrow a sample image
    const slides = (slidesProp && slidesProp.length ? slidesProp : DEFAULT_SLIDES).slice(0, 24).map((s, i) => (s?.image?.src ? s : { ...s, image: { ...DEFAULT_SLIDES[i % DEFAULT_SLIDES.length].image, alt: s?.caption || DEFAULT_SLIDES[i % DEFAULT_SLIDES.length].image?.alt } }))
    const N = slides.length

    const [idx, setIdx] = useState(0)
    const [prev, setPrev] = useState<number | null>(null)
    const [dir, setDir] = useState<1 | -1>(1)
    const [turn, setTurn] = useState(0) // bumps each change to restart animations
    const [pressed, setPressed] = useState(false)
    const busyRef = useRef(false)
    const audioRef = useRef<{ ctx: AudioContext; noise: AudioBuffer } | null>(null)
    const soundRef = useRef(sound)
    soundRef.current = sound
    const P = useRef(props)
    P.current = props
    const rootRef = useRef<HTMLDivElement>(null)
    const reduce = useRef(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        const m = window.matchMedia("(prefers-reduced-motion: reduce)")
        const on = () => (reduce.current = m.matches)
        on()
        m.addEventListener?.("change", on)
        return () => m.removeEventListener?.("change", on)
    }, [])
    useEffect(() => {
        if (idx >= N) setIdx(0)
    }, [N])

    // preload the neighbours so a change never shows an empty window
    useEffect(() => {
        if (typeof window === "undefined") return
        for (const k of [0, 1, -1]) decode(slides[(idx + k + N) % N]?.image?.src)
    }, [idx, N])

    const wake = () => {
        if (typeof window === "undefined") return
        if (audioRef.current) {
            if (audioRef.current.ctx.state === "suspended") audioRef.current.ctx.resume()
            return
        }
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext
        if (!AC) return
        const ctx: AudioContext = new AC()
        const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
        const d = noise.getChannelData(0)
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
        audioRef.current = { ctx, noise }
    }
    useEffect(
        () => () => {
            audioRef.current?.ctx.close?.()
            audioRef.current = null
        },
        []
    )
    // lever down, slide shuffle, lever up
    const clack = () => {
        const a = audioRef.current
        if (!soundRef.current || !a || a.ctx.state !== "running") return
        const { ctx, noise } = a
        const t0 = ctx.currentTime
        const burst = (at: number, f: number, q: number, dur: number, gain: number) => {
            const t = t0 + at
            const s = ctx.createBufferSource()
            s.buffer = noise
            const fl = ctx.createBiquadFilter()
            fl.type = "bandpass"
            fl.frequency.value = f
            fl.Q.value = q
            const g = ctx.createGain()
            g.gain.setValueAtTime(0.0001, t)
            g.gain.exponentialRampToValueAtTime(gain, t + 0.002)
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
            s.connect(fl).connect(g).connect(ctx.destination)
            s.start(t, Math.random() * 0.6)
            s.stop(t + dur + 0.03)
        }
        const thump = (at: number, f: number, gain: number) => {
            const t = t0 + at
            const o = ctx.createOscillator()
            o.type = "triangle"
            o.frequency.setValueAtTime(f, t)
            o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.07)
            const g = ctx.createGain()
            g.gain.setValueAtTime(0.0001, t)
            g.gain.exponentialRampToValueAtTime(gain, t + 0.003)
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
            o.connect(g).connect(ctx.destination)
            o.start(t)
            o.stop(t + 0.1)
        }
        burst(0, 2200, 1.2, 0.03, 0.2)
        thump(0, 170, 0.12)
        burst(0.05, 1200, 0.6, 0.16, 0.05)
        burst(0.24, 3000, 1.4, 0.025, 0.14)
        thump(0.24, 240, 0.07)
    }
    const buzz = (ms: number | number[]) => {
        if (!haptics) return
        try {
            navigator.vibrate?.(ms)
        } catch {
            // no haptics
        }
    }

    const decoded = useRef<Record<string, boolean>>({})
    const decode = (src?: string) =>
        new Promise<void>((res) => {
            if (!src || decoded.current[src] || typeof window === "undefined") return res()
            const im = new Image()
            im.src = src
            const done = () => {
                decoded.current[src] = true
                res()
            }
            ;(im.decode ? im.decode() : Promise.reject()).then(done, () => (im.complete ? done() : ((im.onload = done), (im.onerror = () => res()))))
            window.setTimeout(res, 900) // never hold the lever longer than this
        })
    const go = async (d: 1 | -1) => {
        if (N < 2 || busyRef.current) return
        busyRef.current = true
        await decode(slides[(idx + d + N) % N]?.image?.src)
        wake()
        clack()
        buzz([8, 30, 6])
        setPressed(true)
        window.setTimeout(() => setPressed(false), 170)
        setDir(d)
        setPrev(idx)
        setIdx((i) => (i + d + N) % N)
        setTurn((t) => t + 1)
        P.current.onChange?.()
        window.setTimeout(() => {
            busyRef.current = false
            setPrev(null)
        }, reduce.current ? 200 : 680)
    }

    // optional slideshow, paused while off screen or the tab is hidden
    useEffect(() => {
        if (!live || !auto || N < 2) return
        let visible = true
        let timer = 0
        const io =
            typeof IntersectionObserver !== "undefined" && rootRef.current
                ? new IntersectionObserver(([en]) => {
                      visible = !!en?.isIntersecting
                  })
                : null
        if (rootRef.current) io?.observe(rootRef.current)
        const loop = () => {
            timer = window.setTimeout(() => {
                if (visible && !document.hidden) go(1)
                loop()
            }, clamp(interval, 2, 30) * 1000)
        }
        loop()
        return () => {
            window.clearTimeout(timer)
            io?.disconnect()
        }
    }, [live, auto, interval, N, idx])

    // swipe on touch, without trapping vertical scroll
    const touch = useRef<{ x: number; y: number } | null>(null)
    const onPointerDown = (e: any) => {
        wake()
        touch.current = { x: e.clientX, y: e.clientY }
    }
    const onPointerUp = (e: any) => {
        const t = touch.current
        touch.current = null
        if (!t || !live) return
        const dx = e.clientX - t.x
        const dy = e.clientY - t.y
        if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1)
        else if (Math.hypot(dx, dy) < 8) go(1)
    }

    const cur = slides[idx] || slides[0]
    const old = prev !== null ? slides[prev] : null
    const fam = font?.fontFamily || DEFAULT_FAMILY
    const weight = font?.fontWeight || 400
    const body = parseColor(col.body, [46, 46, 43, 1])
    const lightC = parseColor(col.light, [255, 233, 198, 1])
    const mount = parseColor(col.mount, [217, 215, 208, 1])
    const capC = parseColor(col.caption, [43, 43, 40, 1])
    const fixedHeight = !!style?.height && style.height !== "auto"
    const imgStyle: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", userSelect: "none", WebkitUserDrag: "none" } as CSSProperties
    // a 35mm slide: pale mount, rounded opening, caption and number printed on the bottom margin
    const mountEl = (sl: Slide | undefined, n: number) => (
        <div style={{ position: "absolute", inset: 0, borderRadius: "1.92cqw", padding: "5.5% 6% 0", display: "flex", flexDirection: "column", background: `linear-gradient(180deg, ${shadeOf(mount, 1.04)}, ${shadeOf(mount, 0.93)})`, boxShadow: `0 0.64cqw 1.54cqw ${sh(.35)}, inset 0 1px 0 rgba(255,255,255,.5), inset 0 -1px 0 ${sh(.12)}` }}>
            <div style={{ position: "relative", flex: 1, borderRadius: "0.64cqw", overflow: "hidden", background: shadeOf(mount, 0.62), boxShadow: `inset 0 0 0 1px ${sh(.25)}` }}>
                <img src={sl?.image?.src} srcSet={sl?.image?.srcSet} alt={sl?.image?.alt || sl?.caption || ""} draggable={false} decoding="sync" style={imgStyle} />
            </div>
            <div style={{ flex: "none", height: "17%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2.56cqw", fontSize: "2.76cqw", lineHeight: 1, color: rgba(capC, capC[3]), fontVariantNumeric: "tabular-nums" }}>
                <span style={{ fontWeight: Math.max(500, Number(weight) || 400), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sl?.caption || ""}</span>
                <span style={{ flex: "none", color: rgba(capC, 0.58) }}>{pad(n + 1)}</span>
            </div>
        </div>
    )
    const anim = (name: string, dur: number, ease: string) => (reduce.current ? `jbiSvFade .2s ease both` : `${name} ${dur}s ${ease} both`)



    return (
        <div
            ref={rootRef}
            role="region"
            aria-roledescription="slide viewer"
            aria-label={label}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                // fit height hugs the object; a fixed height lets it scale to fit inside, centred
                height: fixedHeight ? style?.height : undefined,
                aspectRatio: fixedHeight ? undefined : OBJECT_RATIO,
                boxSizing: "border-box",
                minWidth: 0,
                background: "transparent",
                display: "grid",
                placeItems: "center",
                fontFamily: fam,
                fontWeight: weight,
                userSelect: "none",
                WebkitUserSelect: "none",
                WebkitTapHighlightColor: "transparent",
                ...({ containerType: fixedHeight ? "size" : "inline-size", "--jbi-sv-ring": isLight ? "#141413" : "#F2F2F0" } as CSSProperties),
            }}
        >
            <style>{SHELL_CSS}</style>
            {/* the object: as large as fits, kept in its own proportions */}
            <div style={{ position: "relative", width: fixedHeight ? "min(100cqw, calc(100cqh / 0.91))" : "100%", aspectRatio: OBJECT_RATIO }}>
            {/* the viewer body sits at the bottom; magazine and lever rise above it */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: BODY_SHARE, ...({ containerType: "inline-size" } as CSSProperties) }}>
                    {/* slides waiting in the magazine, one edge each. On every change the bottom slide drops
                        into the slot, the rest step down one place and the slide just seen returns on top
                        (all reversed when going back). The box clips at the slot so nothing shows below it. */}
                    <div aria-hidden="true" style={{ position: "absolute", left: "12%", width: "44%", bottom: "calc(98.5% - 0.6cqw)", height: "12cqw", zIndex: 3, overflow: "hidden", pointerEvents: "none" }}>
                        {(() => {
                            const K = Math.min(5, Math.max(0, N - 1))
                            const step = 1.6 // cqw between edges
                            const at = (k: number) => 0.09 + k * step
                            const sc = (k: number) => 1 - k * 0.029
                            const op = (k: number) => 1 - k * 0.12
                            const moving = turn > 0 && !reduce.current
                            const edge = (k: number, extra: CSSProperties, key: string) => (
                                <span
                                    key={key}
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: `${at(k)}cqw`,
                                        height: "1.15cqw",
                                        borderRadius: "0.51cqw 0.51cqw 0 0",
                                        background: `linear-gradient(180deg, ${shadeOf(mount, 1.04)}, ${shadeOf(mount, 0.86)})`,
                                        boxShadow: `0 -1px 0 ${sh(.25)}`,
                                        transform: `scaleX(${sc(k)})`,
                                        opacity: op(k),
                                        willChange: moving ? "transform, opacity" : undefined,
                                        ...extra,
                                    }}
                                />
                            )
                            const ease = "cubic-bezier(.22,1,.36,1)"
                            const vars = (v: Record<string, string | number>) => v as CSSProperties
                            const out: any[] = []
                            for (let k = 0; k < K; k++) {
                                if (!moving) {
                                    out.push(edge(k, {}, `e${k}`))
                                    continue
                                }
                                const fwd = dir > 0
                                // where this edge was before the change
                                const fromK = fwd ? k + 1 : k - 1
                                const arriving = fwd ? k === K - 1 : k === 0
                                const fy = arriving ? (fwd ? -step * 1.4 : 2.4) : fwd ? -step : step
                                const delay = fwd ? (arriving ? 0.3 : 0.1 + k * 0.035) : arriving ? 0.12 : 0.04 + (K - 1 - k) * 0.035
                                out.push(
                                    edge(
                                        k,
                                        {
                                            ...vars({ "--fy": `${fy}cqw`, "--fs": sc(arriving ? k : fromK), "--ts": sc(k), "--fo": arriving && fwd ? 0 : op(clamp(fromK, 0, K)), "--to": op(k) }),
                                            animation: `jbiSvEdgeIn ${arriving ? 0.36 : 0.42}s ${ease} ${delay}s both`,
                                        },
                                        `e${turn}-${k}`
                                    )
                                )
                            }
                            // the edge that leaves: into the slot going forward, off the top going back
                            if (moving && K > 0) {
                                const fwd = dir > 0
                                const k = fwd ? 0 : K - 1
                                out.push(
                                    edge(
                                        k,
                                        {
                                            ...vars({ "--fs": sc(k), "--fo": op(k), "--ty": fwd ? "2.6cqw" : `${-step}cqw`, "--to": fwd ? op(k) : 0 }),
                                            animation: fwd ? "jbiSvEdgeOut .26s cubic-bezier(.55,0,.8,.2) 0s both" : `jbiSvEdgeOut .3s ${ease} 0s both`,
                                        },
                                        `x${turn}`
                                    )
                                )
                            }
                            return out
                        })()}
                    </div>
                    {/* advance lever */}
                    <button
                        type="button"
                        className="jbi-sv-btn"
                        aria-label="Next slide"
                        disabled={!live}
                        onClick={() => go(1)}
                        style={{
                            position: "absolute",
                            right: "11%",
                            bottom: pressed ? "97%" : "99.4%",
                            width: "17%",
                            height: "7%",
                            borderRadius: "3.33cqw 3.33cqw 0.51cqw 0.51cqw",
                            border: 0,
                            padding: 0,
                            cursor: live ? "pointer" : "default",
                            background: `linear-gradient(180deg, ${shadeOf(body, g3(2.4, 1.05))} 0%, ${shadeOf(body, g3(1.5, 1.02))} 14%, ${shadeOf(body, g3(1.05, 0.94))} 100%)`,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,.35), inset 0 -2px 3px ${sh(.35)}, 0 0.51cqw 1.03cqw ${sh(.5)}`,
                            transition: "bottom .13s cubic-bezier(.3,1.6,.5,1)",
                            zIndex: 0,
                        }}
                    />
                    {/* body */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "7.95cqw 7.95cqw 6.92cqw 6.92cqw",
                            background: `linear-gradient(180deg, ${shadeOf(body, g3(1.55, 1.05))} 0%, ${shadeOf(body, g3(1.16, 1.02))} 6%, ${col.body} 30%, ${shadeOf(body, g3(0.78, 0.93))} 100%)`,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,.17), inset 0 -1px 0 ${sh(.5)}, 0 0 0 .4px ${sh(.75)}, 0 1.79cqw 3.33cqw ${sh(.45)}, 0 7.69cqw 12.82cqw -2.56cqw ${sh(.6)}`,
                            zIndex: 1,
                        }}
                    />
                    {/* slot in the top edge the waiting slides drop into */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: "11.4%",
                            width: "45.2%",
                            top: "0.2%",
                            height: "1.9%",
                            borderRadius: "1.03cqw",
                            background: `linear-gradient(180deg, ${shadeOf(body, g3(0.5, 0.8))}, ${shadeOf(body, g3(0.78, 0.9))})`,
                            boxShadow: `inset 0 0.45cqw 0.58cqw ${sh(.45)}, 0 1px 0 rgba(255,255,255,${isLight ? 0.55 : 0.07})`,
                            zIndex: 2,
                        }}
                    />
                    {/* machined bezel ring around the window */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: "6.5%",
                            right: "6.5%",
                            top: "7.5%",
                            bottom: "17%",
                            borderRadius: "4.87cqw",
                            background: `linear-gradient(180deg, ${shadeOf(body, g3(2.0, 1.03))}, ${shadeOf(body, g3(1.25, 0.99))} 40%, ${shadeOf(body, g3(0.9, 0.92))})`,
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,.28), inset 0 -1px 0 ${sh(.4)}, 0 0.64cqw 1.28cqw ${sh(.35)}`,
                            zIndex: 2,
                        }}
                    />
                    {/* window: lit diffuser, the slide in its mount, glass on top */}
                    <div
                        className="jbi-sv-win"
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${idx + 1} of ${N}${cur?.caption ? `: ${cur.caption}` : ""}`}
                        tabIndex={live ? 0 : -1}
                        onPointerDown={onPointerDown}
                        onPointerUp={onPointerUp}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "Enter") {
                                e.preventDefault()
                                go(1)
                            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                                e.preventDefault()
                                go(-1)
                            }
                        }}
                        style={{
                            position: "absolute",
                            left: "8.3%",
                            right: "8.3%",
                            top: "9.6%",
                            bottom: "19.2%",
                            borderRadius: "3.72cqw",
                            overflow: "hidden",
                            cursor: live && N > 1 ? "pointer" : "default",
                            touchAction: "pan-y",
                            outline: "none",
                            zIndex: 3,
                            background: shadeOf(lightC, 0.42),
                        }}
                    >
                        <div
                            key={`g${turn}`}
                            className={`jbi-sv-glow${turn ? " dip" : ""}`}
                            aria-hidden="true"
                            style={{ position: "absolute", inset: 0, background: `radial-gradient(85% 75% at 50% 46%, ${shadeOf(lightC, 1.02)} 0%, ${shadeOf(lightC, 0.9)} 45%, ${shadeOf(lightC, 0.55)} 85%, ${shadeOf(lightC, 0.4)} 100%)` }}
                        />
                        {old && (
                            <div key={`o${turn}`} style={{ position: "absolute", inset: "7% 9% 6%", animation: anim(dir > 0 ? "jbiSvOutDown" : "jbiSvOutUp", 0.64, "cubic-bezier(.65,0,.35,1)"), willChange: "transform" }}>
                                {mountEl(old, prev ?? 0)}
                            </div>
                        )}
                        <div key={`c${turn}`} style={{ position: "absolute", inset: "7% 9% 6%", animation: turn ? anim(dir > 0 ? "jbiSvInDown" : "jbiSvInUp", 0.64, "cubic-bezier(.65,0,.35,1)") : undefined, willChange: "transform" }}>
                            {mountEl(cur, idx)}
                        </div>
                        {/* depth: the window is recessed into the body */}
                        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit", boxShadow: `inset 0 1.54cqw 2.56cqw ${sh(.55)}, inset 0 -0.77cqw 1.54cqw ${sh(.35)}, inset 0 0 0 1px ${sh(.6)}` }} />
                        {/* glass: crisp top-left highlight and a soft sweep */}
                        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit", background: "linear-gradient(118deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,.06) 22%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 72%, rgba(255,255,255,.06) 100%)", boxShadow: "inset 1px 1px 0 rgba(255,255,255,.18)" }} />
                    </div>
                    {/* engraved wordmark */}
                    {props.mark !== "" && (
                        <span aria-hidden="true" style={{ position: "absolute", left: "9%", bottom: "6.6%", zIndex: 2, fontSize: "3.08cqw", fontWeight: 500, letterSpacing: "0.01em", color: col.text, textShadow: isLight ? "0 1px 0 rgba(255,255,255,.75)" : `0 -1px 0 ${sh(.6)}, 0 1px 0 rgba(255,255,255,.07)` }}>
                            {props.mark ?? "portfolio"}
                        </span>
                    )}
                    <span aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
                        {cur?.caption || ""}
                    </span>
                </div>
            </div>
        </div>
    )
}

SlideViewer.displayName = "Slide Viewer"

const paletteControls = (d: Required<Palette>): Record<string, any> => ({
    body: { type: ControlType.Color, title: "Body", defaultValue: d.body, description: "Viewer body and lever. Highlights and edges are worked out from it." },
    light: { type: ControlType.Color, title: "Backlight", defaultValue: d.light, description: "Glow behind the slide." },
    mount: { type: ControlType.Color, title: "Mount", defaultValue: d.mount, description: "Slide mounts that hold each image." },
    caption: { type: ControlType.Color, title: "Caption", defaultValue: d.caption, description: "Caption and number printed on the mount." },
    text: { type: ControlType.Color, title: "Engraving", defaultValue: d.text, description: "Wordmark engraved on the body." },
    shadow: { type: ControlType.Color, title: "Shadow", defaultValue: d.shadow },
    shadowStrength: { type: ControlType.Number, title: "Strength", defaultValue: d.shadowStrength, min: 0, max: 150, step: 1, unit: "%", description: "How deep the shadows, rims and engraving are." },
})

addPropertyControls(SlideViewer, {
    // Content
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                caption: { type: ControlType.String, title: "Caption", defaultValue: "Caption" },
            },
        },
        defaultValue: DEFAULT_SLIDES,
        description: "Images shown in the viewer, with a short caption under each. Landscape images fit best.",
    },
    mark: {
        type: ControlType.String,
        title: "Wordmark",
        defaultValue: "portfolio",
        description: "Engraved under the window. Leave empty for none.",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Gallery",
        description: "Name read out by screen readers.",
    },

    // Appearance
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Dark", "Light", "Auto"],
        defaultValue: "Dark",
        displaySegmentedControl: true,
        description: "Auto follows the visitor's light or dark setting.",
    },
    dark: { type: ControlType.Object, title: "Dark", buttonTitle: "Colors", controls: paletteControls(DEFAULT_DARK), hidden: (p: any) => p.theme === "Light" },
    light: { type: ControlType.Object, title: "Light", buttonTitle: "Colors", controls: paletteControls(DEFAULT_LIGHT), hidden: (p: any) => p.theme === "Dark" || !p.theme },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
        description: "Family and weight for the captions and wordmark. Sizes scale with the viewer.",
    },

    // Behaviour
    auto: {
        type: ControlType.Boolean,
        title: "Slideshow",
        defaultValue: false,
        description: "Advance on its own. Pauses while off screen.",
    },
    interval: {
        type: ControlType.Number,
        title: "Every",
        defaultValue: 5,
        min: 2,
        max: 30,
        step: 1,
        unit: "s",
        hidden: (p: any) => !p.auto,
        description: "Seconds per slide.",
    },
    sound: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: true,
        description: "A mechanical clack on each change. Starts after the first touch.",
    },
    haptics: {
        type: ControlType.Boolean,
        title: "Haptics",
        defaultValue: true,
        description: "A short buzz on each change, on phones that support it.",
    },
    onChange: { type: ControlType.EventHandler, title: "On change" },
})
