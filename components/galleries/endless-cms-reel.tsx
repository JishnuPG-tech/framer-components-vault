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


// Endless CMS Reel · v1.1.1 · Designed by Marso
// An endless horizontal reel of your own cards. Put a horizontal Collection List (or a frame of cards, or several
// cards) into Content. The reel never changes your list or your cards: it draws its own wrappers, puts your whole
// Content into each of them (the first one and its repeats), and moves only those wrappers, end to end, so the loop
// never shows a reset. Every card keeps its own design, size, hover, link and text styles, and Framer's own CMS tools
// keep working on the list (filters, sorting, limits). It plays by itself and moves with a drag, a trackpad swipe, the
// mouse wheel, a finger and the page's scroll, with momentum. Effects: Skew on Speed, Zoom on Drag, Edge Blur and
// Edge Fade, each drawn on the reel's own layers.
//
// Setup: 1. Insert it and give it a size (full width, about 420 px high, or Fit). 2. Put a horizontal Collection List
// of your card into Content, on the Desktop breakpoint; give the card a fixed size in the list; the card's own link
// opens its page. 3. Set Gap to your list's own gap. 4. Adjust it in the panel and link the colours to your colour
// styles.

// ---------- types and defaults (the panel's defaults come from here too)
type Align = "top" | "center" | "bottom"
type Direction = "left" | "right"
type Wheel = "sideways" | "all"
type Place = "bottom-left" | "bottom-right" | "top-left" | "top-right"

interface LayoutProps {
    gap: number
    align: Align
}
interface MotionProps {
    autoPlay: boolean
    speed: number
    direction: Direction
    pauseOnHover: boolean
    glide: number
}
interface EffectProps {
    skew: boolean
    skewAngle: number
    zoom: boolean
    zoomTo: number
    edgeBlur: boolean
    blurWidth: number
    blur: number
    edgeFade: boolean
    fadeWidth: number
}
interface InteractionProps {
    drag: boolean
    wheel: Wheel
    scrollBoost: number
    keys: boolean
}
interface PauseButtonProps {
    show: boolean
    position: Place
}
interface ColorProps {
    focus: string
    buttonFill: string
    buttonIcon: string
    buttonBorder: string
}
interface A11yProps {
    reel: string
    pause: string
    play: string
}
interface Props {
    content?: React.ReactNode
    layout?: Partial<LayoutProps>
    motion?: Partial<MotionProps>
    effect?: Partial<EffectProps>
    interaction?: Partial<InteractionProps>
    pauseButton?: Partial<PauseButtonProps>
    colors?: Partial<ColorProps>
    a11y?: Partial<A11yProps>
    style?: React.CSSProperties
}

const D = {
    layout: { gap: 20, align: "center" } as LayoutProps,
    motion: { autoPlay: true, speed: 36, direction: "left", pauseOnHover: true, glide: 0.95 } as MotionProps,
    effect: { skew: true, skewAngle: 6, zoom: true, zoomTo: 94, edgeBlur: true, blurWidth: 160, blur: 16, edgeFade: false, fadeWidth: 80 } as EffectProps,
    interaction: { drag: true, wheel: "sideways", scrollBoost: 0.5, keys: true } as InteractionProps,
    pauseButton: { show: false, position: "bottom-right" } as PauseButtonProps,
    colors: { focus: "#2F6BFF", buttonFill: "rgba(17, 17, 17, 0.72)", buttonIcon: "#FFFFFF", buttonBorder: "rgba(255, 255, 255, 0.14)" } as ColorProps,
    a11y: { reel: "Gallery", pause: "Pause", play: "Play" } as A11yProps,
}
// the most repeats of your Content the reel keeps in the page (the first one included)
const MAX_COPIES = 40
// the reel's class prefix: fixed, the same on the server and in the browser. A new prefix when a version changes the
// CSS, so two versions on one page never share rules.
const CLS = "ecr11"
// Skew on Speed: the speed (px/s) at which the lean reaches about three quarters of its Angle
const SKEW_SPEED = 1600

// ---------- small helpers
const useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect
function mod(n: number, m: number): number {
    return ((n % m) + m) % m
}
function clamp(v: number, a: number, b: number): number {
    return Math.max(a, Math.min(b, v))
}
function num(v: unknown, fallback: number): number {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
}

const EASE = "cubic-bezier(.22,1,.36,1)"
// Edge Blur and Edge Fade keep their width on a reel this wide or wider; a narrower reel (a tablet, a phone) gets them
// narrower in proportion, so on a phone they never cover most of a card. In CSS alone (a percentage of the reel), so
// the first frame of the page is already right.
const WIDE = 1200
const edgeW = (px: string, n: string) => "min(var(" + px + "),calc(100% * var(" + n + ") / " + WIDE + "),22%)"
// Every rule below styles the reel's own elements only (the root, its view and stage, its copies and cells, the blur,
// the shield, the button and the hint); nothing reaches into your Content.
function css(c: string): string {
    const R = "." + c
    return (
        // clip, not hidden: a card that gets the keyboard focus must not scroll the reel (the browser would)
        R + "{position:relative;overflow:hidden;overflow:clip;touch-action:pan-y;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;outline:none}" +
        R + "[data-ecr-drag]{cursor:grab}" +
        R + ":focus-visible{box-shadow:inset 0 0 0 2px var(--ecr-focus)}" +
        // the view holds the fade; its own width never grows with the row (the row runs past its end, the root clips it)
        R + "-view{position:relative;height:100%;contain:inline-size}" +
        // the stage: Zoom on Drag and Skew on Speed act on it, from its middle
        R + "-stage{position:relative;height:100%;display:flex;align-items:var(--ecr-align);transform-origin:50% 50%}" +
        // one copy: your whole Content in a row of its own cells; the first one sits in the flow (it gives the reel its
        // Fit height and shows before the code runs), the repeats lie over it at the same height
        R + "-copy{position:relative;flex:none;width:max-content;display:flex;align-items:var(--ecr-align);gap:var(--ecr-gap)}" +
        R + "-copy:not([data-ecr-copy=\"0\"]){position:absolute;left:0;top:0;height:100%}" +
        R + "-copy:not([data-ecr-placed]):not([data-ecr-copy=\"0\"]){visibility:hidden}" +
        R + "-copy[data-ecr-spare]{display:none}" +
        R + "-cell{position:relative;flex:none}" +
        // while a drag lasts, a clear layer over the cards keeps the grabbing hand and lets no card hover
        R + "-shield{position:absolute;inset:0;z-index:4;display:none;cursor:grabbing}" +
        R + "[data-ecr-dragging] " + R + "-shield{display:block}" +
        // Edge Blur: each end holds three layers, the stronger blur nearer the edge, each fading out inwards
        R + "-blur{position:absolute;top:0;bottom:0;z-index:3;width:" + edgeW("--ecr-blur-w", "--ecr-blur-n") + ";pointer-events:none}" +
        R + "-blur[data-side=l]{left:0}" +
        R + "-blur[data-side=r]{right:0}" +
        R + "-blur i{position:absolute;inset:0;-webkit-backdrop-filter:blur(var(--b)) saturate(var(--s));backdrop-filter:blur(var(--b)) saturate(var(--s))}" +
        R + "-blur i:nth-child(1){--b:calc(var(--ecr-blur) * .25);--s:1.1;-webkit-mask-image:linear-gradient(var(--d),#000 40%,transparent 100%);mask-image:linear-gradient(var(--d),#000 40%,transparent 100%)}" +
        R + "-blur i:nth-child(2){--b:calc(var(--ecr-blur) * .55);--s:1.2;-webkit-mask-image:linear-gradient(var(--d),#000 20%,transparent 66%);mask-image:linear-gradient(var(--d),#000 20%,transparent 66%)}" +
        R + "-blur i:nth-child(3){--b:var(--ecr-blur);--s:1.35;-webkit-mask-image:linear-gradient(var(--d),#000 0%,transparent 36%);mask-image:linear-gradient(var(--d),#000 0%,transparent 36%)}" +
        R + "-blur[data-side=l]{--d:90deg}" +
        R + "-blur[data-side=r]{--d:270deg}" +
        R + "[data-ecr-lite] " + R + "-blur{display:none}" +
        R + "[data-ecr-fade] " + R + "-view{--w:" + edgeW("--ecr-fade", "--ecr-fade-n") + ";-webkit-mask-image:linear-gradient(90deg,transparent,#000 var(--w),#000 calc(100% - var(--w)),transparent);mask-image:linear-gradient(90deg,transparent,#000 var(--w),#000 calc(100% - var(--w)),transparent)}" +
        // the pause button
        R + "-btn{all:unset;position:absolute;z-index:5;box-sizing:border-box;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:var(--ecr-btn-fill);box-shadow:inset 0 0 0 1px var(--ecr-btn-border);color:var(--ecr-btn-icon);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);cursor:pointer;touch-action:manipulation;transition:scale .25s " + EASE + "}" +
        R + "-btn:hover{scale:1.04}" +
        R + "-btn:active{scale:.97}" +
        R + "-btn:focus-visible{box-shadow:inset 0 0 0 1px var(--ecr-btn-border),0 0 0 2px var(--ecr-focus)}" +
        R + "-btn[data-pos^=bottom]{bottom:16px}" +
        R + "-btn[data-pos^=top]{top:16px}" +
        R + "-btn[data-pos$=left]{left:16px}" +
        R + "-btn[data-pos$=right]{right:16px}" +
        R + "-btn svg{width:18px;height:18px;display:block}" +
        R + "-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font:500 13px/1.45 system-ui,sans-serif;color:rgba(128,128,128,1);pointer-events:none}" +
        R + "[data-ecr-ready]:not([data-ecr-empty]) " + R + "-empty[data-ecr-hint=list]{display:none}" +
        R + "[data-ecr-empty] " + R + "-btn{display:none}" +
        "@media (prefers-reduced-motion: reduce){" + R + "-btn{transition:none}}"
    )
}

function PauseIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" />
            <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" />
        </svg>
    )
}
function PlayIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.2-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6Z" />
        </svg>
    )
}

/**
 * Endless CMS Reel
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 420
 */
export default function EndlessCMSReel(props: Props) {
    const L: LayoutProps = { ...D.layout, ...(props.layout || {}) }
    const M: MotionProps = { ...D.motion, ...(props.motion || {}) }
    const E: EffectProps = { ...D.effect, ...(props.effect || {}) }
    const I: InteractionProps = { ...D.interaction, ...(props.interaction || {}) }
    const B: PauseButtonProps = { ...D.pauseButton, ...(props.pauseButton || {}) }
    const CO: ColorProps = { ...D.colors, ...(props.colors || {}) }
    const A: A11yProps = { ...D.a11y, ...(props.a11y || {}) }

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // the reel's own class names are fixed, never made from React.useId(): when an instance differs per breakpoint (a
    // height or a setting on Phone) the published page's server and browser count their ids differently, and the
    // repeats the reel adds after the page loads got a class its CSS did not have (they sat one whole list too far:
    // an empty stretch). Every rule is the same for every instance (their own values come in as CSS variables), so
    // several reels on one page can share them (found on Endless CMS Feed, 2026-11-06).
    const cls = CLS

    const rootRef = React.useRef<HTMLDivElement>(null)
    const stageRef = React.useRef<HTMLDivElement>(null)
    const [copies, setCopies] = React.useState(1)
    const [paused, setPaused] = React.useState(false)

    // everything the loop needs lives in one mutable object, never in React state
    const S = React.useRef<any>(null)
    if (!S.current) {
        S.current = {
            // the reel's own copy wrappers in use, their width with the gap, how many, and the room past each end
            copyEls: [] as HTMLElement[],
            cx: [] as number[],
            period: 0,
            count: 0,
            want: 1,
            total: 0,
            extra: 0,
            width: 0,
            height: 0,
            x: 0,
            prevX: 0,
            v: 0,
            pend: 0,
            playAmt: 0,
            // Skew on Speed and Zoom on Drag: the visitor's own speed (px/s, smoothed), the lean and the size now
            vs: 0,
            skew: 0,
            z: 1,
            tf: "",
            down: null,
            dragging: false,
            suppress: false,
            tap: null,
            tapAt: 0,
            // no input yet: the play may start at once (the page clock starts near 0 on a fast load)
            lastInput: -1e9,
            hovering: false,
            focusIn: false,
            paused: false,
            visible: true,
            hidden: false,
            reduce: false,
            lowPower: false,
            inert: false,
            samples: [] as number[],
            sampleFrom: 0,
            raf: 0,
            running: false,
            copiesAsked: 0,
        }
    }
    const opts = React.useRef<any>({})
    opts.current = { L, M, E, I, isStatic }

    // the blur strips: off on a slow device (their layers are hidden by the reel's own attribute)
    const blurOn = () => !!opts.current.E.edgeBlur && num(opts.current.E.blurWidth, 0) > 0 && num(opts.current.E.blur, 0) > 0 && !S.current.lowPower
    // Skew on Speed and Zoom on Drag: the live site and Preview only, never with reduced motion
    const skewMax = () => {
        const o = opts.current
        return o.E.skew && !o.isStatic && !S.current.reduce ? clamp(num(o.E.skewAngle, 0), 0, 20) : 0
    }
    const zoomMin = () => {
        const o = opts.current
        return o.E.zoom && !o.isStatic && !S.current.reduce ? clamp(num(o.E.zoomTo, 100), 70, 100) / 100 : 1
    }

    // ---------- positions: each copy of your Content at its place on the loop, wrapped on its own, so the row never ends
    const place = (force?: boolean) => {
        const st = S.current
        const els = st.copyEls as HTMLElement[]
        const stage = stageRef.current
        if (!stage || !els.length) return
        const K = els.length
        const P = st.period
        for (let c = 0; c < K; c++) {
            const x = K > 1 && P > 0 ? mod(c * P + st.x + P + st.extra, K * P) - P - st.extra : st.x
            if (force || st.cx[c] !== x) {
                els[c].style.setProperty("translate", x.toFixed(2) + "px 0px")
                st.cx[c] = x
            }
        }
        // the stage leans (Skew on Speed) and steps back (Zoom on Drag); at rest it carries no transform at all
        const tf = Math.abs(st.z - 1) < 0.0005 && Math.abs(st.skew) < 0.02 ? "" : "scale(" + st.z.toFixed(4) + ") skewX(" + st.skew.toFixed(3) + "deg)"
        if (force || tf !== st.tf) {
            stage.style.transform = tf
            st.tf = tf
        }
    }

    // ---------- measure the reel's own first copy and lay the copies out in one row
    const collect = React.useCallback(() => {
        const root = rootRef.current
        const stage = stageRef.current
        const st = S.current
        if (!root || !stage) return
        const o = opts.current
        const width = root.offsetWidth
        if (!width) return
        const height = root.offsetHeight
        st.reduce = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const copyEls = (Array.from(stage.children) as HTMLElement[]).filter((c) => c.hasAttribute("data-ecr-copy"))
        const first = copyEls[0] || null
        // only the reel's own wrapper is measured: its size is your Content's own size
        const setW = first ? first.offsetWidth : 0
        const filled = !!first && setW >= 1 && first.offsetHeight >= 1
        const gap = Math.max(0, num(o.L.gap, 20))
        const period = setW + gap
        // the room past each end the effects can show: Zoom on Drag draws more of the row, Skew on Speed leans its corners out
        const z = zoomMin()
        const extra = (width / z - width) / 2 + ((height / 2) * Math.tan((skewMax() * Math.PI) / 180)) / z + 2
        const want = filled ? clamp(Math.ceil((width + 2 * extra) / Math.max(1, period)) + 1, 2, MAX_COPIES) : 1
        st.want = want
        // the reel shows the first copy at once; the repeats it needs step into their places as they render. First asked
        // as a transition (it lands once the page allows). While the rest of the page is still hydrating (a slow phone)
        // the transition can be held back, and a plain update then would make React redraw parts that are not ready
        // ("recoverable error" #421, live 2026-10-30): so the reel waits until the page has gone quiet and only then asks
        // again with a plain update, and looks once more until the copies are there
        if (filled && want !== copyEls.length) {
            const now = performance.now()
            if (st.copiesAsked !== want) {
                st.copiesAsked = want
                st.asks = 0
            }
            if (!st.asks || (st.quiet && now - st.askedAt > 400)) {
                const plain = st.asks > 0
                st.asks++
                st.askedAt = now
                window.requestAnimationFrame(() => (plain ? setCopies(want) : React.startTransition(() => setCopies(want))))
            }
            if (!st.quiet && !st.waitingQuiet) {
                // quiet: two idle moments of the browser (or, without idle callbacks, a second and a half after the
                // page has loaded); at most 10 s
                st.waitingQuiet = true
                const t0 = performance.now()
                const done = () => {
                    st.quiet = true
                    if (S.current.collect) S.current.collect()
                }
                if (typeof window.requestIdleCallback === "function") {
                    let calm = 0
                    const idle = (d: IdleDeadline) => {
                        calm = d.didTimeout ? 0 : calm + 1
                        if (calm >= 2 || performance.now() - t0 > 10000) done()
                        else st.idleId = window.requestIdleCallback(idle, { timeout: 2000 })
                    }
                    st.idleId = window.requestIdleCallback(idle, { timeout: 2000 })
                } else {
                    const go = () => {
                        st.quietTimer = window.setTimeout(done, 1500)
                    }
                    st.quietGo = go
                    if (document.readyState === "complete") go()
                    else window.addEventListener("load", go, { once: true })
                }
            }
            window.clearTimeout(st.copyTimer)
            st.copyTimer = window.setTimeout(() => {
                if (S.current.collect) S.current.collect()
            }, 450)
        } else if (want === copyEls.length) {
            st.copiesAsked = 0
            st.asks = 0
            window.clearTimeout(st.copyTimer)
        }
        const useCopies = filled ? Math.min(want, copyEls.length) : Math.min(1, copyEls.length)
        // repeats beyond what is needed wait hidden until React removes them; while a keyboard is in use, the repeats
        // are inert (out of the Tab order; screen readers skip them anyway)
        copyEls.forEach((c, i) => {
            if (i < useCopies) c.removeAttribute("data-ecr-spare")
            else c.setAttribute("data-ecr-spare", "")
            if (i > 0 && st.inert) c.setAttribute("inert", "")
            else c.removeAttribute("inert")
        })
        if (st.ro && first && st.roFirst !== first) {
            if (st.roFirst) st.ro.unobserve(st.roFirst)
            st.ro.observe(first)
            st.roFirst = first
        }
        st.copyEls = copyEls.slice(0, useCopies)
        st.cx = []
        st.period = period
        st.count = useCopies
        st.total = useCopies > 1 ? useCopies * period : 0
        st.extra = extra
        st.width = width
        st.height = height
        if (st.total && Math.abs(st.x) > st.total) st.x = mod(st.x, st.total)
        // empty Content (no items, or a filter that finds none): the canvas says so, the live site shows nothing
        if (filled) root.removeAttribute("data-ecr-empty")
        else root.setAttribute("data-ecr-empty", "")
        place(true)
        for (const c of st.copyEls as HTMLElement[]) c.setAttribute("data-ecr-placed", "")
        root.setAttribute("data-ecr-ready", "")
        kick()
    }, [copies])
    S.current.collect = collect

    // ---------- the loop runs only while something moves (never on the canvas or in an export)
    const kick = () => {
        const st = S.current
        if (st.running || opts.current.isStatic) return
        st.running = true
        let last = performance.now()
        st.prevX = st.x
        const step = (now: number) => {
            const o = opts.current
            const ms = Math.min(64, now - last)
            last = now
            const dt = ms / 16.667
            let moving = false
            // a slow device: if the frames come slower than ~45 a second for a while, the blur is turned off
            if (!st.lowPower && blurOn() && st.visible && !st.hidden && now > st.sampleFrom && ms > 0 && ms < 200) {
                st.samples.push(ms)
                if (st.samples.length >= 90) {
                    const sorted = (st.samples as number[]).slice().sort((a, b) => a - b)
                    if (sorted[45] > 22) {
                        st.lowPower = true
                        if (rootRef.current) rootRef.current.setAttribute("data-ecr-lite", "")
                    }
                    st.samples = []
                    st.sampleFrom = Infinity
                }
            }
            if (!st.dragging) {
                // wheel, scroll and key input ease in, a throw glides out
                if (st.reduce) {
                    st.x += st.pend
                    st.pend = 0
                } else {
                    const e = st.pend * (1 - Math.pow(0.8, dt))
                    st.pend -= e
                    st.x += e
                    if (Math.abs(st.pend) < 0.05) {
                        st.x += st.pend
                        st.pend = 0
                    }
                }
                st.x += st.v * dt
                st.v *= st.reduce ? 0 : Math.pow(clamp(num(o.M.glide, 0.95), 0.8, 0.99), dt)
                if (Math.abs(st.v) < 0.01) st.v = 0
                moving = !!(st.v || st.pend)
            }
            // the play: eases in after the visitor lets go, out on hover, focus, the pause button or off screen; it waits
            // until the repeats are in place, so the row never runs out
            const speed = o.M.autoPlay ? Math.max(0, num(o.M.speed, 0)) : 0
            const idle = now - st.lastInput > 700 && !st.down
            const canPlay = speed > 0 && st.count >= st.want && !st.reduce && st.visible && !st.hidden && !st.paused && !(o.M.pauseOnHover && st.hovering) && !st.focusIn
            const target = canPlay && idle ? 1 : 0
            st.playAmt += (target - st.playAmt) * (1 - Math.pow(0.95, dt))
            if (target === 0 && st.playAmt < 0.002) st.playAmt = 0
            if (target === 1 && st.playAmt > 0.998) st.playAmt = 1
            let playDx = 0
            if (st.playAmt > 0) {
                playDx = (o.M.direction === "right" ? 1 : -1) * speed * st.playAmt * (ms / 1000)
                st.x += playDx
                moving = true
            }
            // Skew on Speed follows the visitor's own speed (a drag, a throw, the wheel, the page's scroll), never the play
            const inputDx = st.x - st.prevX - playDx
            const vel = ms > 0 ? (inputDx / ms) * 1000 : 0
            st.vs += (vel - st.vs) * (1 - Math.pow(0.8, dt))
            if (Math.abs(st.vs) < 4) st.vs = 0
            const lean = skewMax()
            st.skew = lean && st.vs ? -lean * Math.tanh(st.vs / SKEW_SPEED) : 0
            if (Math.abs(st.skew) < 0.02) st.skew = 0
            // Zoom on Drag: steps back while held, returns as it is let go
            const zt = st.dragging ? zoomMin() : 1
            st.z += (zt - st.z) * (1 - Math.pow(0.84, dt))
            if (Math.abs(st.z - zt) < 0.0005) st.z = zt
            if (st.vs || st.z !== 1) moving = true
            if (st.total && Math.abs(st.x) > st.total * 4) st.x = mod(st.x, st.total)
            st.prevX = st.x
            place()
            // waiting a moment after the visitor's input before the play comes back also keeps the loop going
            if ((moving || st.dragging || canPlay) && st.visible && !st.hidden) st.raf = window.requestAnimationFrame(step)
            else st.running = false
        }
        st.raf = window.requestAnimationFrame(step)
    }

    // ---------- measure and lay out after every render, and whenever the reel or your Content changes size
    useIso(() => {
        collect()
    })
    React.useEffect(() => {
        const root = rootRef.current
        if (!root) return
        const st = S.current
        let timer = 0
        const later = () => {
            window.clearTimeout(timer)
            timer = window.setTimeout(collect, 60)
        }
        // the reel and its own first copy (a filter, a CMS edit, an image or a font that changes a card's size)
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(later) : null
        st.ro = ro
        st.roFirst = null
        if (ro) {
            ro.observe(root)
            const first = st.copyEls && st.copyEls[0]
            if (first) {
                ro.observe(first)
                st.roFirst = first
            }
        }
        return () => {
            window.clearTimeout(timer)
            window.clearTimeout(st.copyTimer)
            window.clearTimeout(st.quietTimer)
            if (st.idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(st.idleId)
            if (st.quietGo) window.removeEventListener("load", st.quietGo)
            st.waitingQuiet = false
            if (ro) ro.disconnect()
            st.ro = null
            st.roFirst = null
        }
    }, [collect, copies])

    // ---------- off screen, a background tab, reduced motion, Save-Data (the live site and Preview only)
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return
        const st = S.current
        st.sampleFrom = performance.now() + 1500
        const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        if (conn && conn.saveData) {
            st.lowPower = true
            root.setAttribute("data-ecr-lite", "")
        }
        const io =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver((entries) => {
                      const v = entries.some((e) => e.isIntersecting)
                      if (v === st.visible) return
                      st.visible = v
                      place(true)
                      if (v) kick()
                  })
                : null
        if (io) io.observe(root)
        const onVis = () => {
            st.hidden = document.hidden
            place(true)
            if (!st.hidden) kick()
        }
        document.addEventListener("visibilitychange", onVis)
        const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null
        const onMq = () => {
            if (st.collect) st.collect()
        }
        if (mq && mq.addEventListener) mq.addEventListener("change", onMq)
        return () => {
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            if (mq && mq.removeEventListener) mq.removeEventListener("change", onMq)
        }
    }, [isStatic])

    // ---------- pointer, wheel, page scroll, keys and focus (the live site and Preview only)
    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic) return
        const st = S.current
        // a finger moves a little even in a tap: up to 10 px is still a tap
        const slop = (e: PointerEvent) => (e.pointerType === "mouse" ? 6 : 10)
        const inBtn = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-ecr-btn]")
        // opens a card's own link: Framer opens links on a press on phones and on a click on computers, so it gets both
        const openLink = (a: HTMLElement) => {
            const r = a.getBoundingClientRect()
            const o: PointerEventInit = { bubbles: true, cancelable: true, composed: true, isPrimary: true, pointerId: 77, pointerType: "touch", button: 0, buttons: 1, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }
            try {
                a.dispatchEvent(new PointerEvent("pointerdown", o))
                a.dispatchEvent(new PointerEvent("pointerup", { ...o, buttons: 0 }))
            } catch (err) {}
            a.click()
        }
        // the page may be scaled: screen px → the reel's own px
        const scale = () => {
            const w = root.getBoundingClientRect().width
            return root.offsetWidth && w ? w / root.offsetWidth : 1
        }
        // the repeats leave the Tab order while a keyboard is in use (Tab pressed) and come back with the pointer;
        // only the reel's own copy wrappers get the attribute
        const setInert = (on: boolean) => {
            if (st.inert === on) return
            st.inert = on
            ;(st.copyEls as HTMLElement[]).forEach((c, i) => {
                if (i > 0 && on) c.setAttribute("inert", "")
                else c.removeAttribute("inert")
            })
        }
        const onTabKey = (e: KeyboardEvent) => {
            if (e.key === "Tab") setInert(true)
        }
        const onPointerAny = (e: PointerEvent) => {
            if (e.isTrusted) setInert(false)
        }

        // while a pointer is down, its moves and its end are followed even outside the reel
        let follow = false
        const startFollow = () => {
            if (follow) return
            follow = true
            window.addEventListener("pointermove", onMove)
            window.addEventListener("pointerup", onUp)
            window.addEventListener("pointercancel", onUp)
        }
        const stopFollow = () => {
            if (!follow || st.down) return
            follow = false
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
        }

        const onDown = (e: PointerEvent) => {
            // Drag off: the cards take their own clicks and taps
            if ((e.button !== 0 && e.pointerType === "mouse") || !e.isTrusted || inBtn(e.target) || !opts.current.I.drag) return
            // a finger's tap is recognised on pointer-up (browsers may drop the click of the first tap after a drag)
            st.tap = e.pointerType !== "mouse" ? { id: e.pointerId, x: e.clientX, y: e.clientY, t0: performance.now(), target: e.target, moving: Math.abs(st.v) > 2 } : null
            startFollow()
            st.down = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, lt: performance.now(), k: scale() }
            st.v = 0
            st.pend = 0
            st.lastInput = performance.now()
            kick()
        }
        const onMove = (e: PointerEvent) => {
            if (st.tap && st.tap.id === e.pointerId && Math.hypot(e.clientX - st.tap.x, e.clientY - st.tap.y) > slop(e)) st.tap = null
            const d = st.down
            if (!d || d.id !== e.pointerId) return
            if (!st.dragging && Math.hypot(e.clientX - d.x, e.clientY - d.y) > slop(e)) {
                // a finger that starts mostly up or down is the page's (the browser scrolls it)
                if (e.pointerType !== "mouse" && Math.abs(e.clientY - d.y) > Math.abs(e.clientX - d.x)) {
                    st.down = null
                    st.tap = null
                    stopFollow()
                    return
                }
                st.dragging = true
                root.setAttribute("data-ecr-dragging", "")
                try {
                    root.setPointerCapture(e.pointerId)
                } catch (err) {}
                kick()
            }
            if (st.dragging) {
                const now = performance.now()
                // the row follows the pointer exactly, also while Zoom on Drag draws it smaller
                const dx = (e.clientX - d.lx) / d.k / Math.max(0.5, st.z)
                const dt = Math.max(1, now - d.lt) / 16.667
                st.x += dx
                st.v = clamp(st.v * 0.6 + (dx / dt) * 0.4, -160, 160)
                d.lt = now
                st.lastInput = now
            }
            d.lx = e.clientX
        }
        const onUp = (e: PointerEvent) => {
            if (!e.isTrusted) return
            const tap = st.tap
            st.tap = null
            if (tap && tap.id === e.pointerId && e.type === "pointerup" && !tap.moving && !st.dragging && performance.now() - tap.t0 < 700) onTap(tap.target)
            const d = st.down
            if (d && d.id === e.pointerId) {
                if (st.dragging) {
                    st.suppress = true
                    window.setTimeout(() => (st.suppress = false), 0)
                    // a cancelled touch (the browser took it over), a pause before letting go, reduced motion: no glide
                    if (e.type === "pointercancel" || performance.now() - d.lt > 80 || st.reduce) st.v = 0
                }
                st.dragging = false
                st.down = null
                root.removeAttribute("data-ecr-dragging")
                st.lastInput = performance.now()
                kick()
            }
            stopFollow()
        }
        // a finger's tap opens the link it landed on; the browser's own click, if it still comes, is then left out
        const onTap = (target: EventTarget | null) => {
            if (!(target instanceof Element) || !root.contains(target) || inBtn(target)) return
            const a = target.closest("a[href]") as HTMLElement | null
            if (!a || !root.contains(a)) return
            st.tapAt = performance.now()
            openLink(a)
        }
        const onClick = (e: MouseEvent) => {
            if (inBtn(e.target)) return
            if (e.isTrusted && st.tapAt && performance.now() - st.tapAt < 800) {
                e.preventDefault()
                e.stopPropagation()
                return
            }
            if (st.suppress) {
                e.preventDefault()
                e.stopPropagation()
                st.suppress = false
            }
        }
        // a sideways trackpad swipe always moves the reel; the mouse wheel only with Wheel: All
        const onWheel = (e: WheelEvent) => {
            const o = opts.current
            if (e.ctrlKey || e.metaKey) return
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? st.width : 1
            let dx = e.deltaX * unit
            let dy = e.deltaY * unit
            if (e.shiftKey && !dx) {
                dx = dy
                dy = 0
            }
            let d = 0
            if (Math.abs(dx) > Math.abs(dy)) d = dx
            else if (o.I.wheel === "all") d = dy
            else return
            if (!d) return
            e.preventDefault()
            st.pend -= d
            st.lastInput = performance.now()
            kick()
        }
        // the page's scroll moves the reel along: down = the way it plays, up = back
        let lastY = window.scrollY
        const onScroll = () => {
            const y = window.scrollY
            const dy = y - lastY
            lastY = y
            const o = opts.current
            const k = Math.max(0, num(o.I.scrollBoost, 0))
            if (!k || !dy || !st.visible || st.reduce || st.dragging) return
            st.pend += dy * k * (o.M.direction === "right" ? 1 : -1)
            kick()
        }
        // keys act only while the reel (or something in it) has the focus: about a card each way
        const onKey = (e: KeyboardEvent) => {
            const o = opts.current
            if (!o.I.keys || e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || !st.count) return
            const t = e.target
            if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
            let dir = 0
            if (e.key === "ArrowLeft") dir = 1
            else if (e.key === "ArrowRight") dir = -1
            else return
            e.preventDefault()
            st.pend += dir * clamp(st.width * 0.35, 120, 560)
            st.lastInput = performance.now()
            kick()
        }
        // keyboard focus pauses the play (WCAG 2.2.2), and a card reached with Tab slides fully into view
        const keyboardFocus = (el: Element) => {
            try {
                return el.matches(":focus-visible")
            } catch (err) {
                return true
            }
        }
        const onFocusIn = (e: FocusEvent) => {
            const t = e.target
            if (!(t instanceof Element) || !keyboardFocus(t)) return
            st.focusIn = true
            if (t !== root && st.total) {
                // read only: where the focused card is now, in the reel's own px
                const k = scale()
                const rr = root.getBoundingClientRect()
                const r = t.getBoundingClientRect()
                const left = (r.left - rr.left) / k
                const w = r.width / k
                if (w > 0 && w < st.width) {
                    const pad = Math.min(48, Math.max(0, (st.width - w) / 2))
                    let d = 0
                    if (left < pad) d = pad - left
                    else if (left + w > st.width - pad) d = st.width - pad - (left + w)
                    // the shortest way round the loop
                    d = mod(d + st.total / 2, st.total) - st.total / 2
                    st.v = 0
                    st.pend = d
                    st.lastInput = performance.now()
                }
            }
            kick()
        }
        const onFocusOut = (e: FocusEvent) => {
            const next = e.relatedTarget
            if (next instanceof Node && root.contains(next)) return
            st.focusIn = false
            kick()
        }
        const onEnter = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            st.hovering = true
        }
        const onLeave = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            st.hovering = false
            kick()
        }
        const noDrag = (e: Event) => e.preventDefault()
        // older browsers without overflow: clip scroll the reel to a focused card: put it back
        const onOwnScroll = () => {
            if (root.scrollLeft || root.scrollTop) {
                root.scrollLeft = 0
                root.scrollTop = 0
            }
        }

        root.addEventListener("pointerdown", onPointerAny, true)
        root.addEventListener("pointermove", onPointerAny)
        root.addEventListener("pointerdown", onDown)
        root.addEventListener("pointerenter", onEnter)
        root.addEventListener("pointerleave", onLeave)
        root.addEventListener("click", onClick, true)
        root.addEventListener("wheel", onWheel, { passive: false })
        root.addEventListener("keydown", onKey)
        root.addEventListener("focusin", onFocusIn)
        root.addEventListener("focusout", onFocusOut)
        root.addEventListener("dragstart", noDrag)
        root.addEventListener("scroll", onOwnScroll)
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("keydown", onTabKey, true)
        kick()
        return () => {
            root.removeEventListener("pointerdown", onPointerAny, true)
            root.removeEventListener("pointermove", onPointerAny)
            root.removeEventListener("pointerdown", onDown)
            root.removeEventListener("pointerenter", onEnter)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("click", onClick, true)
            root.removeEventListener("wheel", onWheel)
            root.removeEventListener("keydown", onKey)
            root.removeEventListener("focusin", onFocusIn)
            root.removeEventListener("focusout", onFocusOut)
            root.removeEventListener("dragstart", noDrag)
            root.removeEventListener("scroll", onOwnScroll)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("keydown", onTabKey, true)
            st.down = null
            stopFollow()
            window.cancelAnimationFrame(st.raf)
            st.running = false
        }
    }, [isStatic])

    // ---------- the pause button (first in the Tab order: the way to stop the motion comes before the cards)
    const togglePause = () => {
        const st = S.current
        st.paused = !st.paused
        setPaused(st.paused)
        kick()
    }

    // ---------- render
    const speedOn = M.autoPlay && num(M.speed, 0) > 0
    const fade = E.edgeFade ? Math.max(0, num(E.fadeWidth, 0)) : 0
    const blurW = E.edgeBlur ? Math.max(0, num(E.blurWidth, 0)) : 0
    const blurPx = Math.max(0, num(E.blur, 0))
    const align = L.align === "top" ? "flex-start" : L.align === "bottom" ? "flex-end" : "center"
    const rootStyle = {
        ...props.style,
        position: "relative",
        "--ecr-gap": Math.max(0, num(L.gap, 20)) + "px",
        "--ecr-align": align,
        "--ecr-focus": CO.focus,
        "--ecr-fade": fade + "px",
        "--ecr-fade-n": fade,
        "--ecr-blur-w": blurW + "px",
        "--ecr-blur-n": blurW,
        "--ecr-blur": blurPx + "px",
        "--ecr-btn-fill": CO.buttonFill,
        "--ecr-btn-icon": CO.buttonIcon,
        "--ecr-btn-border": CO.buttonBorder,
    } as React.CSSProperties

    // Your Content as the reel's own cells (one per layer you put in: a list, a frame, or each card). The first copy is
    // kept as the very same element while only the repeats change, so adding repeats never redraws it (on a slow page its
    // cards may still be hydrating: an update there is React's "recoverable error" #421, live 2026-10-30). Each repeat
    // loads inside its own Suspense, so a card part that is still loading waits there and never reaches the rest of the
    // page.
    const body = React.useMemo(() => {
        const els = React.Children.toArray(props.content)
        if (!els.length) return null
        return els.map((c, i) => (
            <div key={i} className={cls + "-cell"}>
                {c}
            </div>
        ))
    }, [props.content, cls])
    const firstSet = React.useMemo(
        () =>
            body ? (
                <div key={0} className={cls + "-copy"} data-ecr-copy={0}>
                    {body}
                </div>
            ) : null,
        [body, cls]
    )
    const layers: React.ReactNode[] = []
    if (body) {
        layers.push(firstSet)
        for (let i = 1; i < copies; i++) {
            layers.push(
                <React.Suspense key={i} fallback={null}>
                    <div className={cls + "-copy"} data-ecr-copy={i} aria-hidden={true}>
                        {body}
                    </div>
                </React.Suspense>
            )
        }
    }
    const showButton = B.show && speedOn && !!body
    const showBlur = blurW > 0 && blurPx > 0 && !!body

    return (
        <div
            ref={rootRef}
            className={cls}
            style={rootStyle}
            tabIndex={0}
            role="region"
            aria-label={A.reel || undefined}
            data-lenis-prevent=""
            data-ecr-drag={I.drag ? "" : undefined}
            data-ecr-fade={fade > 0 ? "" : undefined}
        >
            <style dangerouslySetInnerHTML={{ __html: css(cls) }} />
            {showButton ? (
                <button type="button" className={cls + "-btn"} data-ecr-btn="" data-pos={B.position} aria-label={(paused ? A.play : A.pause) || undefined} onClick={togglePause}>
                    {paused ? <PlayIcon /> : <PauseIcon />}
                </button>
            ) : null}
            <div className={cls + "-view"}>
                <div ref={stageRef} className={cls + "-stage"}>
                    {layers}
                </div>
            </div>
            {showBlur ? (
                <>
                    <div className={cls + "-blur"} data-side="l" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                    </div>
                    <div className={cls + "-blur"} data-side="r" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                    </div>
                </>
            ) : null}
            <div className={cls + "-shield"} aria-hidden="true" />
            {isCanvas ? (
                <div className={cls + "-empty"} data-ecr-hint={body ? "list" : "none"}>
                    {body ? "Content has no cards yet." : "Put a horizontal Collection List of your cards (or your cards) into Content."}
                </div>
            ) : null}
        </div>
    )
}

// ---------- the panel
EndlessCMSReel.displayName = "Endless CMS Reel"
addPropertyControls(EndlessCMSReel, {
    content: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 40,
        description: "A horizontal Collection List of your card, a frame of cards, or your cards one by one. Set it on the Desktop breakpoint.",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        controls: {
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 160, step: 1, unit: "px", defaultValue: D.layout.gap, description: "Between the end of your list and its next repeat: set it to your list's own gap. Also between cards added one by one." },
            align: { type: ControlType.Enum, title: "Align", options: ["top", "center", "bottom"], optionTitles: ["Top", "Center", "Bottom"], displaySegmentedControl: true, defaultValue: D.layout.align, description: "Where the row sits in a reel taller than it." },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "interaction",
        controls: {
            autoPlay: { type: ControlType.Boolean, title: "Auto-Play", defaultValue: D.motion.autoPlay },
            speed: { type: ControlType.Number, title: "Speed", min: 0, max: 400, step: 1, unit: "px/s", defaultValue: D.motion.speed, hidden: (p: any) => !p.autoPlay },
            direction: { type: ControlType.Enum, title: "Direction", options: ["left", "right"], optionTitles: ["Left", "Right"], displaySegmentedControl: true, defaultValue: D.motion.direction, description: "The way it plays, and the way the page's scroll moves it." },
            pauseOnHover: { type: ControlType.Boolean, title: "Pause on Hover", defaultValue: D.motion.pauseOnHover, hidden: (p: any) => !p.autoPlay },
            glide: { type: ControlType.Number, title: "Glide", min: 0.8, max: 0.99, step: 0.01, defaultValue: D.motion.glide, description: "How far the reel glides after a throw." },
        },
    },
    effect: {
        type: ControlType.Object,
        title: "Effects",
        icon: "effect",
        description: "Each effect on or off with one click. All of them rest with reduced motion; the blur also on slow devices.",
        controls: {
            skew: { type: ControlType.Boolean, title: "Skew on Speed", defaultValue: D.effect.skew, description: "The row leans into a fast drag, throw or scroll, and stands straight again as it slows." },
            skewAngle: { type: ControlType.Number, title: "Angle", min: 1, max: 15, step: 0.5, unit: "°", defaultValue: D.effect.skewAngle, description: "The most it leans, at full speed.", hidden: (p: any) => !p.skew },
            zoom: { type: ControlType.Boolean, title: "Zoom on Drag", defaultValue: D.effect.zoom, description: "The reel steps back while it is held, and comes forward again when let go." },
            zoomTo: { type: ControlType.Number, title: "Zoom To", min: 80, max: 99, step: 1, unit: "%", defaultValue: D.effect.zoomTo, hidden: (p: any) => !p.zoom },
            edgeBlur: { type: ControlType.Boolean, title: "Edge Blur", defaultValue: D.effect.edgeBlur, description: "The cards blur at both ends, like frosted glass." },
            blurWidth: { type: ControlType.Number, title: "Blur Width", min: 20, max: 400, step: 4, unit: "px", defaultValue: D.effect.blurWidth, description: "At each end of a reel 1200 px or wider; a narrower reel (a phone) gets it narrower in proportion.", hidden: (p: any) => !p.edgeBlur },
            blur: { type: ControlType.Number, title: "Blur Amount", min: 1, max: 40, step: 1, unit: "px", defaultValue: D.effect.blur, hidden: (p: any) => !p.edgeBlur },
            edgeFade: { type: ControlType.Boolean, title: "Edge Fade", defaultValue: D.effect.edgeFade, description: "The reel fades out at both ends." },
            fadeWidth: { type: ControlType.Number, title: "Fade Width", min: 20, max: 400, step: 4, unit: "px", defaultValue: D.effect.fadeWidth, description: "At each end of a reel 1200 px or wider; a narrower reel (a phone) gets it narrower in proportion.", hidden: (p: any) => !p.edgeFade },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        icon: "interaction",
        controls: {
            drag: { type: ControlType.Boolean, title: "Drag", defaultValue: D.interaction.drag, description: "With the mouse or a finger, with momentum. A drag never opens a card." },
            wheel: { type: ControlType.Enum, title: "Wheel", options: ["sideways", "all"], optionTitles: ["Sideways", "All"], displaySegmentedControl: true, defaultValue: D.interaction.wheel, description: "Sideways: a trackpad swipe moves the reel, the mouse wheel scrolls the page. All: the mouse wheel moves the reel too." },
            scrollBoost: { type: ControlType.Number, title: "Scroll Boost", min: 0, max: 3, step: 0.1, defaultValue: D.interaction.scrollBoost, description: "Scrolling the page moves the reel along. 0 = off." },
            keys: { type: ControlType.Boolean, title: "Arrow Keys", defaultValue: D.interaction.keys, description: "While the reel has the focus: about a card each way." },
        },
    },
    pauseButton: {
        type: ControlType.Object,
        title: "Pause Button",
        icon: "interaction",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: D.pauseButton.show, description: "A button that stops and starts the play (while Auto-Play is on)." },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["bottom-left", "bottom-right", "top-left", "top-right"],
                optionTitles: ["Bottom Left", "Bottom Right", "Top Left", "Top Right"],
                defaultValue: D.pauseButton.position,
                hidden: (p: any) => !p.show,
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        description: "Link them to your colour styles so light and dark follow.",
        controls: {
            focus: { type: ControlType.Color, title: "Focus Ring", defaultValue: D.colors.focus, description: "Shown around the reel and its button for keyboard users." },
            buttonFill: { type: ControlType.Color, title: "Button Fill", defaultValue: D.colors.buttonFill },
            buttonIcon: { type: ControlType.Color, title: "Button Icon", defaultValue: D.colors.buttonIcon },
            buttonBorder: { type: ControlType.Color, title: "Button Border", defaultValue: D.colors.buttonBorder },
        },
    },
    a11y: {
        type: ControlType.Object,
        title: "Accessibility",
        icon: "object",
        description: "Read out by screen readers.",
        controls: {
            reel: { type: ControlType.String, title: "Reel Label", defaultValue: D.a11y.reel },
            pause: { type: ControlType.String, title: "Pause Label", defaultValue: D.a11y.pause },
            play: { type: ControlType.String, title: "Play Label", defaultValue: D.a11y.play },
        },
    },
})
