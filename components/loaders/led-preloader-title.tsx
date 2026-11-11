import * as React from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const MARKS = "™®©℠"
const hash = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
    return x - Math.floor(x)
}
const noise = (t: number) => 0.5 + 0.28 * Math.sin(t * 1.1) + 0.14 * Math.sin(t * 2.3 + 1.7) + 0.08 * Math.sin(t * 3.7 + 4.1)
const glowShadow = (gl: number) =>
    "0 0 0.024em currentColor, 0 0 0.08em color-mix(in srgb, currentColor calc((0.55 + var(--g, 0.5) * 0.35) * " + gl * 100 + "%), transparent), 0 0 0.27em color-mix(in srgb, currentColor calc((0.3 + var(--g, 0.5) * 0.3) * " + gl * 100 + "%), transparent)"

type Target = { left: number; top: number; width: number; height: number; fs: number; lettersW: number; color: string; family: string; weight: string }

// Hard lock while the intro plays: overflow alone doesn't stop wheel, touch, keys or scripted scrolling.
const KEYS = [" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]
const block = (e: Event) => {
    const w: any = window
    if (!w.__crtScrollLocked) return
    if (e.type === "keydown" && KEYS.indexOf((e as KeyboardEvent).key) === -1) return
    e.preventDefault()
}
const lock = () => {
    const w: any = window
    if (w.__crtScrollLocked) return
    w.__crtScrollLocked = true
    w.__crtPrevOverflow = [document.documentElement.style.overflow, document.body.style.overflow, document.documentElement.style.scrollbarGutter]
    // keep the scrollbar's width reserved, so the page does not change width (and the title does not re-fit) when the lock ends
    document.documentElement.style.scrollbarGutter = "stable"
    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    window.addEventListener("wheel", block, { passive: false, capture: true })
    window.addEventListener("touchmove", block, { passive: false, capture: true })
    window.addEventListener("keydown", block, { capture: true })
}
const unlock = () => {
    const w: any = window
    if (!w.__crtScrollLocked) return
    w.__crtScrollLocked = false
    const prev = w.__crtPrevOverflow || ["", "", ""]
    document.documentElement.style.overflow = prev[0]
    document.body.style.overflow = prev[1]
    document.documentElement.style.scrollbarGutter = prev[2] || ""
    window.removeEventListener("wheel", block, true)
    window.removeEventListener("touchmove", block, true)
    window.removeEventListener("keydown", block, true)
}

interface IntroProps {
    chars: string[]
    fontStyle: React.CSSProperties
    color: string
    background: string
    glow: number
    duration: number
    hold: number
    exit: "slide" | "fade"
    sizePct: number
    lockScroll: boolean
    getTarget: () => Target | null
    getG: () => string
    onHandoff: () => void
    onDone: () => void
}

// The full-screen intro: the word starts dark in the middle of the screen, lights up letter by letter,
// then flies onto the title that is already on the page. It lives in a portal on <body>, so no ancestor can clip or offset it.
function Intro(p: IntroProps) {
    const [t, setT] = React.useState(0)
    const [phase, setPhase] = React.useState<"ignite" | "fly" | "exit">("ignite")
    const [target, setTarget] = React.useState<Target | null>(() => p.getTarget())
    const [ownFs, setOwnFs] = React.useState<number | null>(null)
    const root = React.useRef<HTMLDivElement>(null)
    const text = React.useRef<HTMLDivElement>(null)
    const meas = React.useRef<HTMLSpanElement>(null)
    const latest = React.useRef(target)
    latest.current = target
    const pr = React.useRef(p)
    pr.current = p
    const label = p.chars.join("")

    // size used when there is no title to land on (it is off screen): a share of the viewport width
    React.useLayoutEffect(() => {
        const run = () => {
            const m = meas.current
            if (m && m.offsetWidth > 0) setOwnFs((100 * window.innerWidth * p.sizePct) / 100 / m.offsetWidth)
        }
        run()
        window.addEventListener("resize", run)
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(run)
        return () => window.removeEventListener("resize", run)
    }, [label, p.sizePct])

    // keep the landing spot fresh while the intro runs (fonts load, the title fits)
    React.useEffect(() => {
        const id = window.setInterval(() => {
            const n = pr.current.getTarget()
            setTarget((old) => (old && n && Math.abs(old.left - n.left) < 0.5 && Math.abs(old.top - n.top) < 0.5 && Math.abs(old.fs - n.fs) < 0.2 && Math.abs(old.width - n.width) < 0.5 ? old : n))
        }, 100)
        return () => window.clearInterval(id)
    }, [])

    React.useEffect(() => {
        const t0 = performance.now()
        let raf = 0
        let landed = false
        let scheduled = false
        let finished = false
        const finish = () => {
            if (finished) return
            finished = true
            // swap in the same frame: show the real title and hide ours together, so the two glows never add up
            if (text.current) text.current.style.visibility = "hidden"
            pr.current.onHandoff()
            window.setTimeout(() => pr.current.onDone(), 80)
        }
        const land = () => {
            if (landed) return
            landed = true
            const fresh = pr.current.getTarget()
            const tx = text.current
            const ov = root.current
            const onScreen = !!fresh && fresh.top < window.innerHeight * 0.94 && fresh.top + fresh.height > 0
            if (fresh && latest.current && tx && ov && onScreen) {
                setPhase("fly")
                ov.style.pointerEvents = "none"
                ov.style.transition = "background-color 0.9s ease 0.15s"
                ov.style.backgroundColor = "transparent"
                const a = tx.animate([{ transform: tx.style.transform || "none" }, { transform: "translate(0px, 0px) scale(1)" }], { duration: 1150, easing: "cubic-bezier(0.9, 0, 0.1, 1)", fill: "forwards" })
                a.onfinish = finish
                window.setTimeout(finish, 1500)
            } else {
                setPhase("exit")
                window.setTimeout(() => {
                    pr.current.onHandoff()
                    pr.current.onDone()
                }, 950)
            }
        }
        const tick = (now: number) => {
            const q = pr.current
            const pp = Math.min(1, (now - t0) / 1000 / q.duration)
            setT(pp)
            // follow the title's breathing so the glow matches at the swap
            const g = q.getG()
            if (text.current) text.current.style.setProperty("--g", g || noise((now - t0) / 1000).toFixed(3))
            if (pp >= 1 && !scheduled) {
                scheduled = true
                window.setTimeout(land, q.hold * 1000)
            }
            if (!landed || !finished) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        const safety = window.setTimeout(land, (p.duration + p.hold) * 1000 + 2500)
        return () => {
            cancelAnimationFrame(raf)
            clearTimeout(safety)
        }
    }, [])

    const useTarget = !!target
    const fs = useTarget ? target!.fs : ownFs || 100
    const overall = Math.min(1, t * 1.15)
    const shade = glowShadow(p.glow * overall)
    const lit = (i: number) => {
        const s = 0.12 + hash(i + 3) * 0.72
        if (t < s) return 0
        const dt = (t - s) / 0.1
        if (dt >= 1) return 1
        const slot = Math.floor(dt * 9)
        return hash(i * 31 + slot) > 0.45 ? 0.7 + hash(i + slot) * 0.3 : 0.08
    }
    let letter = -1
    const word = (f: number) =>
        p.chars.map((c, i) => {
            if (MARKS.indexOf(c) > -1)
                return (
                    <sup key={i} style={{ fontSize: f * 0.14 + "px", verticalAlign: "top", position: "relative", top: f * 0.1 + "px", margin: "0 " + f * 0.03 + "px", letterSpacing: 0, lineHeight: 1, display: "inline-block", opacity: 0.1 + overall * 0.9, textShadow: shade }}>
                        {c}
                    </sup>
                )
            letter++
            const k = lit(letter)
            return (
                <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: 0.1 + k * 0.9, textShadow: k > 0.5 ? shade : "none" }}>
                    {c === " " ? "\u00a0" : c}
                </span>
            )
        })

    let startTransform = "none"
    if (useTarget) {
        const vw = window.innerWidth
        const vh = window.innerHeight
        const s0 = (vw * p.sizePct) / 100 / target!.lettersW
        const dx = vw / 2 - (target!.left + target!.width / 2)
        const dy = vh / 2 - (target!.top + target!.height / 2)
        startTransform = "translate(" + dx + "px," + dy + "px) scale(" + s0 + ")"
    }
    const leaving = phase === "exit"
    return createPortal(
        <div
            ref={root}
            data-crt-preloader="1"
            aria-hidden="true"
            style={{
                position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 10000, background: p.background, overflow: "hidden",
                clipPath: leaving && p.exit === "slide" ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
                opacity: leaving && p.exit === "fade" ? 0 : 1,
                transition: "clip-path 0.9s cubic-bezier(0.9, 0, 0.1, 1), opacity 0.7s ease",
            }}
        >
            {/* locks scrolling from the first paint of the overlay */}
            {p.lockScroll && <style>{"html,body{overflow:hidden!important;overscroll-behavior:none}"}</style>}
            <span ref={meas} style={{ ...p.fontStyle, position: "absolute", visibility: "hidden", fontSize: 100, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>
                {label}
            </span>
            {useTarget ? (
                <div
                    ref={text}
                    style={{ position: "absolute", left: target!.left, top: target!.top, width: target!.width, color: target!.color, fontFamily: target!.family, fontWeight: target!.weight as any, letterSpacing: "-0.03em", lineHeight: 0.95, whiteSpace: "nowrap", transformOrigin: "50% 50%", transform: startTransform, willChange: "transform" }}
                >
                    <div style={{ fontSize: fs, display: "block" }}>{word(fs)}</div>
                </div>
            ) : (
                <div ref={text} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: p.color, ...p.fontStyle, letterSpacing: "-0.03em", lineHeight: 0.95, whiteSpace: "nowrap" }}>
                    <div style={{ fontSize: fs, display: "block" }}>{word(fs)}</div>
                </div>
            )}
        </div>,
        document.body
    )
}

interface Props {
    text: string
    font?: React.CSSProperties
    color: string
    sizing: "fit" | "fixed"
    fontSize: number
    fillRatio: number
    align: "left" | "center" | "right"
    glow: number
    pulse: number
    flicker: number
    level: number
    preloader: boolean
    background: string
    ignite: number
    hold: number
    introWidth: number
    exit: "slide" | "fade"
    lockScroll: boolean
    onlyFirstVisit: boolean
    style?: React.CSSProperties
}

/**
 * Y2K CRT Preloader + Title: one component. A glowing phosphor headline whose glow breathes while a random letter glitches off now and then, plus an optional full-screen intro: the screen is dead, the word lights up letter by letter, then flies onto the headline so the two become one.
 * Put it where the headline goes. Turn Preloader off to use it as a plain glowing title. Use one per page for the intro.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function CRTPreloaderTitle(props: Props) {
    const { text, font, color, sizing, fontSize, fillRatio, align, glow, pulse, flicker, level, preloader, background, ignite, hold, introWidth, exit, lockScroll, onlyFirstVisit } = props
    const isStatic = useIsStaticRenderer()
    const label = (text || "").trim() || "SIGNAL"
    const fit = sizing !== "fixed"
    const fontStyle: React.CSSProperties = { fontFamily: "Michroma, sans-serif", fontWeight: 400, ...(font || {}) }
    const box = React.useRef<HTMLDivElement>(null)
    const meas = React.useRef<HTMLSpanElement>(null)
    const titleEl = React.useRef<HTMLDivElement>(null)
    const refs = React.useRef<(HTMLSpanElement | null)[]>([])
    const fitted = React.useRef(!fit)
    const [size, setSize] = React.useState(fit ? 100 : fontSize)
    // hidden until the intro hands over (or until we know there is none); the server render is hidden too, so there is no flash of the headline before the intro
    const [hidden, setHidden] = React.useState(preloader)
    const [playing, setPlaying] = React.useState(false)
    const [visible, setVisible] = React.useState(true)

    // loops only run while the title is on screen
    React.useEffect(() => {
        const el = box.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" })
        io.observe(el)
        return () => io.disconnect()
    }, [])

    // decide whether the intro plays
    React.useEffect(() => {
        if (!preloader || isStatic) {
            setHidden(false)
            return
        }
        const w: any = window
        let seen = false
        try {
            seen = onlyFirstVisit && sessionStorage.getItem("crt-intro") === "1"
            sessionStorage.setItem("crt-intro", "1")
        } catch (e) {}
        // reduced motion, a repeat visit, or another intro already running on this page: show the headline right away
        if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches || w.__crtIntroClaimed) {
            setHidden(false)
            return
        }
        w.__crtIntroClaimed = true
        if (lockScroll) {
            try {
                window.history.scrollRestoration = "manual"
            } catch (e) {}
            window.scrollTo(0, 0)
            lock()
        }
        setHidden(true)
        setPlaying(true)
        // never leave the page hidden or locked if something goes wrong
        const safety = window.setTimeout(() => {
            setHidden(false)
            setPlaying(false)
            unlock()
        }, (ignite + hold) * 1000 + 6000)
        return () => {
            clearTimeout(safety)
            w.__crtIntroClaimed = false
            unlock()
        }
    }, [preloader, onlyFirstVisit, lockScroll])

    // Fit: scale the font so the whole title spans the container. Fixed: use the Size control.
    React.useEffect(() => {
        if (!fit) {
            setSize(fontSize)
            fitted.current = true
            return
        }
        const el = box.current
        const m = meas.current
        if (!el || !m) return
        const run = () => {
            // offsetWidth is in layout pixels; getBoundingClientRect would include the editor's zoom
            const w = m.offsetWidth
            if (w > 0 && el.clientWidth > 0) {
                setSize((100 * el.clientWidth * fillRatio) / w)
                fitted.current = true
            }
        }
        run()
        const ro = new ResizeObserver(run)
        ro.observe(el)
        // the measuring copy changes width when the web font swaps in, so refit on that too
        ro.observe(m)
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(run)
        if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener("loadingdone", run)
        return () => {
            ro.disconnect()
            if (document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener("loadingdone", run)
        }
    }, [label, fit, fontSize, fillRatio, fontStyle.fontFamily, fontStyle.fontWeight])

    // every 2-3 s one random letter flashes, goes dark for ~100 ms and comes back
    React.useEffect(() => {
        if (isStatic) return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
        if (flicker <= 0 || !visible) return
        let alive = true
        let timer = 0
        const step = (o: number, at: number) => ({ opacity: o, offset: at, easing: "steps(1, end)" })
        const blink = () => {
            if (!alive) return
            const els = refs.current.filter((e) => !!e) as HTMLSpanElement[]
            const el = els[Math.floor(Math.random() * els.length)]
            if (el && el.animate) el.animate([step(1, 0), step(0.35, 0.12), step(1, 0.24), step(0.04, 0.36), step(0.04, 0.78), step(1, 0.8), { opacity: 1, offset: 1 }], { duration: 340 })
            timer = window.setTimeout(blink, (2000 + Math.random() * 1000) / flicker)
        }
        timer = window.setTimeout(blink, 1200)
        return () => {
            alive = false
            clearTimeout(timer)
        }
    }, [flicker, label, visible])

    // --g runs 0..1 and drives the glow; incommensurate sines so the breathing never repeats like a looped clip
    React.useEffect(() => {
        const el = box.current
        if (!el) return
        if (isStatic) return
        if (!visible) return
        if (pulse <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            el.style.setProperty("--g", "0.6")
            return
        }
        let raf = 0
        const t0 = performance.now()
        const tick = (now: number) => {
            const t = ((now - t0) / 1000) * pulse
            el.style.setProperty("--g", noise(t).toFixed(3))
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [pulse, visible])

    // where the intro lands: the headline's real position, size and letters
    const getTarget = React.useCallback((): Target | null => {
        const h = titleEl.current
        if (!h || !fitted.current) return null
        const r = h.getBoundingClientRect()
        const ls = h.querySelectorAll("[data-crt-letter]")
        const cs = getComputedStyle(h)
        const fs = parseFloat(cs.fontSize)
        if (!ls.length || r.width < 20 || !(fs > 4)) return null
        let l = 1e9
        let rr = -1e9
        ls.forEach((e) => {
            const q = e.getBoundingClientRect()
            l = Math.min(l, q.left)
            rr = Math.max(rr, q.right)
        })
        return { left: r.left, top: r.top, width: r.width, height: r.height, fs, lettersW: rr - l, color: cs.color, family: cs.fontFamily, weight: cs.fontWeight }
    }, [])
    const getG = React.useCallback(() => (box.current ? box.current.style.getPropertyValue("--g") : ""), [])
    const onHandoff = React.useCallback(() => {
        if (box.current) box.current.style.opacity = "1"
        setHidden(false)
    }, [])
    const onDone = React.useCallback(() => {
        setPlaying(false)
        window.setTimeout(unlock, 450)
    }, [])

    const shade = glowShadow(glow)
    const chars = Array.from(label)
    let letter = -1
    const body = (fs: number, live: boolean) =>
        chars.map((c, i) => {
            if (MARKS.indexOf(c) > -1) {
                return (
                    <sup key={i} style={{ fontSize: fs * 0.14 + "px", verticalAlign: "top", position: "relative", top: fs * 0.1 + "px", margin: "0 " + fs * 0.03 + "px", letterSpacing: 0, lineHeight: 1, display: "inline-block", textShadow: live ? shade : undefined }}>
                        {c}
                    </sup>
                )
            }
            if (!live) return c === " " ? "\u00a0" : c
            letter++
            const my = letter
            return (
                <span
                    key={i}
                    data-crt-letter="1"
                    ref={(e) => {
                        refs.current[my] = e
                    }}
                    style={{ display: "inline-block", whiteSpace: "pre", textShadow: shade }}
                >
                    {c === " " ? "\u00a0" : c}
                </span>
            )
        })
    return (
        <div ref={box} style={{ ...props.style, opacity: hidden ? 0 : 1, width: "100%", position: "relative", color: color, ...fontStyle, letterSpacing: "-0.03em", lineHeight: 0.95, whiteSpace: "nowrap", overflow: "visible", textAlign: align }}>
            <span ref={meas} aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, visibility: "hidden", fontSize: 100, whiteSpace: "nowrap", pointerEvents: "none" }}>
                {body(100, false)}
            </span>
            <div ref={titleEl} role="heading" aria-level={level} aria-label={label} style={{ fontSize: size, display: "block" }}>
                {body(size, true)}
            </div>
            {playing && <Intro chars={chars} fontStyle={{ ...fontStyle }} color={color} background={background} glow={glow} duration={ignite} hold={hold} exit={exit} sizePct={introWidth} lockScroll={lockScroll} getTarget={getTarget} getG={getG} onHandoff={onHandoff} onDone={onDone} />}
        </div>
    )
}

CRTPreloaderTitle.defaultProps = { color: "#ecebe7", sizing: "fit", fontSize: 96, fillRatio: 1, align: "left", glow: 0.7, pulse: 1, flicker: 1, level: 1, preloader: true, background: "#0a0a0a", ignite: 2.4, hold: 0.45, introWidth: 86, exit: "slide", lockScroll: true, onlyFirstVisit: false }

addPropertyControls(CRTPreloaderTitle, {
    text: { type: ControlType.String, title: "Text", defaultValue: "SIGNAL™ 01", description: "™ ® © are raised automatically." },
    font: { type: ControlType.Font, title: "Font", controls: "basic", defaultFontType: "sans-serif" },
    color: { type: ControlType.Color, title: "Color" },
    sizing: { type: ControlType.Enum, title: "Sizing", options: ["fit", "fixed"], optionTitles: ["Fit width", "Fixed size"], displaySegmentedControl: true },
    fontSize: { type: ControlType.Number, title: "Size", min: 12, max: 400, unit: "px", hidden: (p: Props) => p.sizing !== "fixed" },
    fillRatio: { type: ControlType.Number, title: "Fill", min: 0.5, max: 1, step: 0.01, hidden: (p: Props) => p.sizing === "fixed" },
    align: { type: ControlType.Enum, title: "Align", options: ["left", "center", "right"], displaySegmentedControl: true, hidden: (p: Props) => p.sizing !== "fixed" },
    glow: { type: ControlType.Number, title: "Glow", min: 0, max: 1, step: 0.05 },
    pulse: { type: ControlType.Number, title: "Pulse", min: 0, max: 3, step: 0.1, description: "Glow breathing speed. 0 = static" },
    flicker: { type: ControlType.Number, title: "Glitch", min: 0, max: 3, step: 0.1, description: "How often a letter cuts out. 0 = off" },
    level: { type: ControlType.Number, title: "Heading", min: 1, max: 6, step: 1, displayStepper: true },
    preloader: { type: ControlType.Boolean, title: "Preloader", description: "Full-screen intro that lands on this headline. Use one per page." },
    background: { type: ControlType.Color, title: "Intro bg", hidden: (p: Props) => !p.preloader },
    ignite: { type: ControlType.Number, title: "Ignite", min: 0.6, max: 6, step: 0.1, unit: "s", hidden: (p: Props) => !p.preloader },
    hold: { type: ControlType.Number, title: "Hold", min: 0, max: 2, step: 0.05, unit: "s", hidden: (p: Props) => !p.preloader },
    introWidth: { type: ControlType.Number, title: "Intro width", min: 20, max: 100, unit: "%", hidden: (p: Props) => !p.preloader },
    exit: { type: ControlType.Enum, title: "Exit", options: ["slide", "fade"], optionTitles: ["Slide up", "Fade"], displaySegmentedControl: true, hidden: (p: Props) => !p.preloader, description: "Used when the headline is off screen and the intro cannot land on it." },
    lockScroll: { type: ControlType.Boolean, title: "Lock scroll", hidden: (p: Props) => !p.preloader },
    onlyFirstVisit: { type: ControlType.Boolean, title: "Once per visit", hidden: (p: Props) => !p.preloader },
})
