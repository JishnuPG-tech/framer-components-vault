// @ts-nocheck
// Poster Rail — a digital poster rail: a pad of pages hanging from a brushed-aluminium bar on two steel wires.
// Tear a page off by hand. Throw it away, or set it down on the wall and a magnet holds it.
// Drop in your own images (and an optional link per page) from the properties panel.
// by Shuyi Yuan · https://shuyii0315-arch.github.io/huangli-calendar/
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


const DEMO_BASE = "https://shuyii0315-arch.github.io/huangli-calendar/pages/"
const DEMO_LINK = "https://shuyii0315-arch.github.io/huangli-calendar/"
const ALMANAC = [1, 2, 3, 4, 5, 6, 7].map((i) => ({
    image: { src: DEMO_BASE + "p" + i + ".jpg", alt: "Huangli almanac page" },
    link: DEMO_LINK,
}))
// Utagawa Hiroshige, One Hundred Famous Views of Edo (1856–58). Public domain, via The Metropolitan Museum of Art (CC0).
const MET = "https://images.metmuseum.org/CRDImages/as/web-large/"
const UKIYOE = [
    ["DP130157", 53681, "Plum Garden at Kamata"],
    ["DP130156", 55433, "Sudden Shower over Shin-Ōhashi Bridge and Atake"],
    ["DP121524", 37093, "Fireworks at Ryōgoku Bridge"],
    ["DP121535", 55095, "Moon-Viewing Location"],
    ["DP121529", 37096, "Maples at Mama"],
    ["DP121668", 55733, "Jūmantsubo Plain at Fukagawa Susaki"],
    ["DP121552", 56689, "Kinryūsan Temple at Asakusa"],
].map(([f, id, t]) => ({
    image: { src: MET + f + ".jpg", alt: "Utagawa Hiroshige, " + t },
    link: "https://www.metmuseum.org/art/collection/search/" + id,
}))
const SAMPLES = { Almanac: ALMANAC, "Ukiyo-e": UKIYOE }
const RATIOS = { Auto: 0, "3:4": 4 / 3, "4:5": 1.25, "2:3": 1.5, "1:1": 1 }
const PIN_S = 0.4
const SVGNS = "http://www.w3.org/2000/svg"

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .4  0 0 0 0 .4  0 0 0 0 .4  0 0 0 .22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`
const BRUSH = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='60'><filter id='b'><feTurbulence type='fractalNoise' baseFrequency='.0025 .8' numOctaves='2' seed='9' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .7 -.25'/></filter><rect width='100%' height='100%' filter='url(%23b)'/></svg>")`

const CSS = `
.tp-layer{position:absolute;inset:0;overflow:hidden;-webkit-user-select:none;user-select:none;touch-action:none}
.tp-wires{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:4}
.tp-bar{position:absolute;left:0;top:0;z-index:6;border-radius:2px;cursor:grab;
  background:${BRUSH},linear-gradient(180deg,#f4f5f6 0%,#d9dcdf 6%,#c4c8cc 18%,#e3e5e7 42%,#b9bdc1 64%,#cfd2d5 86%,#9ea3a8 100%);
  background-size:600px 100%,100% 100%;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 -1px 0 rgba(0,0,0,.25),inset 1px 0 0 rgba(255,255,255,.5),inset -1px 0 0 rgba(0,0,0,.15),0 3px 4px rgba(30,35,40,.28),0 12px 20px rgba(30,35,40,.16)}
.tp-bar:active{cursor:grabbing}
.tp-bar::before{content:"";position:absolute;left:0;right:0;top:-3px;height:3px;border-radius:2px 2px 0 0;background:linear-gradient(90deg,#c9cdd1,#f7f8f9 30%,#dfe2e4 60%,#f1f2f3 85%,#c4c8cb)}
.tp-hole{position:absolute;top:24%;width:5%;aspect-ratio:1;max-width:14px;border-radius:50%;transform:translateX(-50%);background:radial-gradient(circle at 50% 60%,#2a2d30,#55595d 70%,#8d9296);box-shadow:0 1px 0 rgba(255,255,255,.8)}
.tp-screw{position:absolute;top:50%;width:4%;aspect-ratio:1;max-width:11px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 38% 32%,#fdfdfd 0%,#c9ccd0 35%,#8e9399 75%,#6d7277 100%);box-shadow:0 0 0 1px rgba(0,0,0,.18),0 1px 0 rgba(255,255,255,.8)}
.tp-stack{position:absolute;left:0;top:0;z-index:5;filter:drop-shadow(0 8px 14px rgba(30,35,40,.18))}
.tp-page{position:absolute;inset:0;background-color:#fbfbf9;background-size:cover;background-position:center;cursor:grab}
.tp-page::after{content:"";position:absolute;inset:0;pointer-events:none;background:${GRAIN},linear-gradient(180deg,rgba(0,0,0,.035),transparent 4%);background-size:200px 200px,auto;mix-blend-mode:multiply}
.tp-flap{position:absolute;inset:0;pointer-events:none;z-index:2}
.tp-fly{position:absolute;left:0;top:0;z-index:20;pointer-events:none}
.tp-fly .tp-page{cursor:grabbing;filter:drop-shadow(0 12px 16px rgba(0,0,0,.14))}
.tp-pin{position:absolute;left:0;top:0;z-index:12;transform-origin:50% 0;cursor:grab}
.tp-pin .tp-page{filter:drop-shadow(0 6px 10px rgba(0,0,0,.10));pointer-events:none}
.tp-pin.lift{cursor:grabbing;z-index:22}
.tp-mag{position:absolute;left:50%;top:0;width:28px;height:28px;margin:-10px 0 0 -14px;border-radius:50%;z-index:3;pointer-events:none;
  background:radial-gradient(circle at 38% 32%,#fff 0 6%,transparent 26%),conic-gradient(from 20deg,#d9dadc,#f4f5f6,#b9bbbf,#eceef0,#c6c8cb,#f7f8f9,#d9dadc);
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.10),inset 0 -2px 3px rgba(0,0,0,.12),0 3px 5px rgba(0,0,0,.22),0 1px 1px rgba(0,0,0,.2)}
.tp-mag::after{content:"";position:absolute;inset:7px;border-radius:50%;background:conic-gradient(from 200deg,#cfd1d4,#f3f4f5,#b3b5b9,#e9ebed,#cfd1d4);box-shadow:inset 0 1px 1px rgba(0,0,0,.18)}
.tp-ghost{position:absolute;left:0;top:0;margin:-14px 0 0 -14px;z-index:23;opacity:0;transform:scale(.6);transition:opacity .18s,transform .25s cubic-bezier(.3,1.6,.5,1)}
.tp-ghost.on{opacity:.9;transform:none}
.tp-tip{position:absolute;left:0;top:0;z-index:23;pointer-events:none;white-space:nowrap;transform:translate(-50%,-44px) scale(.9);opacity:0;
  font:500 11px/1 Inter,system-ui,sans-serif;letter-spacing:.01em;color:#3a3b3e;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.92);
  box-shadow:0 0 0 .5px rgba(0,0,0,.1),0 4px 12px rgba(30,35,40,.12);transition:opacity .16s,transform .25s cubic-bezier(.3,1.5,.5,1)}
.tp-tip.on{opacity:1;transform:translate(-50%,-48px)}
.tp-broom{all:unset;position:absolute;top:12px;right:12px;z-index:30;width:34px;height:34px;border-radius:999px;display:grid;place-items:center;cursor:pointer;color:#3A3936;
  background:rgba(255,255,255,.85);box-shadow:0 1px 3px rgba(0,0,0,.05),inset 0 0 0 .5px rgba(26,26,26,.08);opacity:0;transform:scale(.8);pointer-events:none;transition:opacity .2s,transform .25s cubic-bezier(.3,1.5,.5,1)}
.tp-broom.on{opacity:1;transform:none;pointer-events:auto}
.tp-broom:hover{background:#fff}
.tp-broom svg{width:16px;height:16px}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 720
 */
export default function PosterRail(props) {
    const {
        pages,
        sample = "Almanac",
        ratio = "Auto",
        wall = "#F7F7F7",
        pin = true,
        sound = true,
        style,
    } = props
    const own = (pages || []).filter((p) => p && p.image && p.image.src)
    const list = own.length ? own : SAMPLES[sample] || ALMANAC
    const R =
        RATIOS[ratio] ||
        (own.length ? 4 / 3 : sample === "Ukiyo-e" ? 1.5 : 1.32)
    const isStatic = useIsStaticRenderer()
    const root = React.useRef(null)
    const cfg = React.useRef({})
    cfg.current = { list, R, pin, sound }
    const key =
        list.map((p) => p.image.src + "|" + (p.link || "")).join(",") + "|" + R
    const [live, setLive] = React.useState(false)

    React.useEffect(() => {
        if (!root.current) return
        // on the Framer canvas: build the same scene, draw one still frame, no physics or listeners
        const stop = engine(root.current, cfg, isStatic)
        setLive(true)
        return () => {
            stop()
            setLive(false)
        }
    }, [isStatic, key])

    return (
        <div
            ref={root}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: wall,
            }}
        >
            {!live && <StaticView list={list} R={R} />}
        </div>
    )
}

// What the canvas and the server render: the pad at rest, no physics.
function StaticView({ list, R }) {
    const img = list[0].image
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div style={{ width: "34%", position: "relative" }}>
                <div
                    style={{
                        position: "relative",
                        width: "118%",
                        marginLeft: "-9%",
                        aspectRatio: "100 / 9",
                        borderRadius: 2,
                        background:
                            "linear-gradient(180deg,#f4f5f6 0%,#d9dcdf 6%,#c4c8cc 18%,#e3e5e7 42%,#b9bdc1 64%,#cfd2d5 86%,#9ea3a8 100%)",
                        boxShadow:
                            "0 3px 4px rgba(30,35,40,.28),0 12px 20px rgba(30,35,40,.16)",
                        zIndex: 2,
                    }}
                />
                <div
                    style={{
                        marginTop: "-5%",
                        width: "100%",
                        aspectRatio: `100 / ${Math.round(R * 100)}`,
                        backgroundImage: `url("${img.src}")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#fbfbf9",
                        filter: "drop-shadow(0 8px 14px rgba(30,35,40,.18))",
                    }}
                    role="img"
                    aria-label={img.alt || ""}
                />
            </div>
        </div>
    )
}

addPropertyControls(PosterRail, {
    pages: {
        type: ControlType.Array,
        title: "Pages",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        description: "Add your own images. Empty shows a sample set.",
    },
    sample: {
        type: ControlType.Enum,
        title: "Sample",
        options: Object.keys(SAMPLES),
        defaultValue: "Almanac",
        hidden: (p) => (p.pages || []).some((x) => x && x.image && x.image.src),
    },
    ratio: {
        type: ControlType.Enum,
        title: "Page",
        options: Object.keys(RATIOS),
        defaultValue: "Auto",
    },
    wall: { type: ControlType.Color, title: "Wall", defaultValue: "#F7F7F7" },
    pin: {
        type: ControlType.Boolean,
        title: "Pin to wall",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    sound: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})

/* ===================================================================== */
/* The engine: plain DOM + one rAF loop, scoped to this instance's box.   */
/* ===================================================================== */
function engine(host, cfgRef, still = false) {
    const doc = host.ownerDocument
    const win = doc.defaultView
    const cfg = () => cfgRef.current
    const el = (tag, cls) => {
        const e = doc.createElement(tag)
        if (cls) e.className = cls
        return e
    }
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
    const easeOut = (p) => 1 - Math.pow(1 - p, 3)
    let alive = true

    const layer = el("div", "tp-layer")
    const style = el("style")
    style.textContent = CSS
    layer.append(style)
    const wires = doc.createElementNS(SVGNS, "svg")
    wires.setAttribute("class", "tp-wires")
    const bar = el("div", "tp-bar")
    ;[
        ["tp-hole", 14],
        ["tp-hole", 86],
        ["tp-screw", 4],
        ["tp-screw", 96],
    ].forEach(([c, x]) => {
        const s = el("span", c)
        s.style.left = x + "%"
        bar.append(s)
    })
    const stack = el("div", "tp-stack")
    const ghost = el("i", "tp-mag tp-ghost")
    const tip = el("span", "tp-tip")
    tip.textContent = "Let go to pin"
    const broom = el("button", "tp-broom")
    broom.title = "Clear the wall"
    broom.setAttribute("aria-label", "Clear the wall")
    broom.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(38 12 12)"><path d="M12 1.8v8.4"/><rect x="9" y="10.2" width="6" height="2.6" rx=".8"/><path d="M9.2 12.8 7.4 21h9.2l-1.8-8.2"/><path d="M10.6 16v5M13.4 16v5"/></g></svg>'
    layer.append(wires, stack, bar, ghost, tip, broom)
    host.append(layer)

    /* ---------- sound ---------- */
    let ac = null,
        master = null
    const audio = () => {
        if (!cfg().sound) return null
        if (ac) return ac
        try {
            ac = new (win.AudioContext || win.webkitAudioContext)()
            master = ac.createGain()
            master.gain.value = 0.55
            master.connect(ac.destination)
        } catch (e) {
            ac = null
        }
        return ac
    }
    const noiseBuf = (sec, fn) => {
        const n = Math.floor(ac.sampleRate * sec),
            b = ac.createBuffer(1, n, ac.sampleRate),
            d = b.getChannelData(0)
        for (let i = 0; i < n; i++) d[i] = fn(i / n)
        return b
    }
    function sndTear(k = 1) {
        if (!audio()) return
        let env = 0
        const buf = noiseBuf(0.32 + Math.random() * 0.12, (t) => {
            const dens = t < 0.85 ? 0.55 - t * 0.35 : 0.05
            if (Math.random() < dens * 0.06) env = 0.5 + Math.random() * 0.5
            env *= 0.985
            const tail =
                t < 0.08
                    ? t / 0.08
                    : 1 - Math.pow(Math.max(0, t - 0.6) / 0.4, 2)
            return (
                (Math.random() * 2 - 1) * (env * 0.9 + 0.12) * Math.max(0, tail)
            )
        })
        const src = ac.createBufferSource()
        src.buffer = buf
        const hp = ac.createBiquadFilter()
        hp.type = "highpass"
        hp.frequency.value = 900
        const pk = ac.createBiquadFilter()
        pk.type = "peaking"
        pk.frequency.value = 3200
        pk.gain.value = 5
        pk.Q.value = 0.8
        const g = ac.createGain()
        g.gain.value = 0.5 * k
        src.connect(hp)
        hp.connect(pk)
        pk.connect(g)
        g.connect(master)
        src.start()
    }
    function sndMagnet(v = 1) {
        if (!audio()) return
        const t = ac.currentTime,
            o = ac.createOscillator(),
            g = ac.createGain()
        o.type = "triangle"
        o.frequency.setValueAtTime(1900, t)
        o.frequency.exponentialRampToValueAtTime(700, t + 0.05)
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(0.22 * v, t + 0.004)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
        o.connect(g)
        g.connect(master)
        o.start(t)
        o.stop(t + 0.1)
        const n = ac.createBufferSource()
        n.buffer = noiseBuf(
            0.03,
            (x) => (Math.random() * 2 - 1) * Math.pow(1 - x, 5)
        )
        const hp = ac.createBiquadFilter()
        hp.type = "highpass"
        hp.frequency.value = 2500
        const g2 = ac.createGain()
        g2.gain.value = 0.35 * v
        n.connect(hp)
        hp.connect(g2)
        g2.connect(master)
        n.start(t)
    }
    function sndPluck(k = 1) {
        if (!audio()) return
        const o = ac.createOscillator(),
            g = ac.createGain()
        o.type = "triangle"
        o.frequency.value = 520 + Math.random() * 60
        g.gain.setValueAtTime(0.05 * k + 0.015, ac.currentTime)
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.35)
        o.connect(g)
        g.connect(master)
        o.start()
        o.stop(ac.currentTime + 0.4)
    }

    /* ---------- layout ---------- */
    let W = 0,
        H = 0,
        pw = 0,
        ph = 0,
        barW = 0,
        barH = 0,
        wireL = 0,
        Lp = 200
    const sw = { a: 0.012, v: 0 }
    let swX = 0,
        swY = 0,
        stackL = 0,
        stackT = 0
    function layout() {
        // layout size, not screen size: the Framer canvas zooms with a transform
        W = host.offsetWidth
        H = host.offsetHeight
        const R = cfg().R
        pw = Math.max(
            60,
            Math.min(W * (W / H < 0.9 ? 0.62 : 0.44), (H * 0.84) / (R + 0.11))
        )
        ph = pw * R
        barH = Math.max(12, pw * 0.1)
        barW = pw * 1.18
        wireL = Math.max(18, (H - barH - ph) * 0.42)
        Lp = Math.max(wireL, 160)
        bar.style.width = barW + "px"
        bar.style.height = barH + "px"
        stack.style.width = pw + "px"
        stack.style.height = ph + "px"
    }
    const ro = new win.ResizeObserver(() => layout())
    ro.observe(host)
    layout()

    /* ---------- pages ---------- */
    let idx = 0
    function jag() {
        // torn top edge, right to left
        const pts = []
        for (let i = 0; i <= 28; i++)
            pts.push(
                `${(100 - (i * 100) / 28).toFixed(2)}% ${(Math.random() * 2.6).toFixed(1)}px`
            )
        return pts.join(",")
    }
    const clipWith = (top, s, side) => {
        if (s <= 0) return `polygon(0% 100%,100% 100%,${top})`
        return side === "r"
            ? `polygon(0% 100%,calc(100% - ${s}px) 100%,100% calc(100% - ${s}px),${top})`
            : `polygon(0% calc(100% - ${s}px),${s}px 100%,100% 100%,${top})`
    }
    function setCurl(p, s, side) {
        p.style.clipPath = clipWith(p._top, s, side)
        let f = p.querySelector(".tp-flap")
        if (s <= 0) {
            if (f) f.remove()
            return
        }
        if (!f) {
            f = el("div", "tp-flap")
            p.append(f)
        }
        f.style.clipPath =
            side === "r"
                ? `polygon(calc(100% - ${s}px) 100%,100% calc(100% - ${s}px),calc(100% - ${s}px) calc(100% - ${s}px))`
                : `polygon(${s}px 100%,0% calc(100% - ${s}px),${s}px calc(100% - ${s}px))`
        f.style.background = `linear-gradient(${side === "r" ? "to top left" : "to top right"}, #d9d9d4 0%, #ececE8 ${Math.max(10, 40 - s * 0.08)}%, #f8f8f5 75%, #ffffff 100%)`
        f.style.filter = "drop-shadow(-2px -2px 3px rgba(0,0,0,.12))"
    }
    function makePage(i) {
        const L = cfg().list,
            p = L[((i % L.length) + L.length) % L.length]
        const pg = el("div", "tp-page")
        pg.style.backgroundImage = `url("${p.image.src}")`
        if (p.image.alt) {
            pg.setAttribute("role", "img")
            pg.setAttribute("aria-label", p.image.alt)
        }
        pg._item = p
        pg._top = jag()
        pg.style.clipPath = clipWith(pg._top, 0)
        return pg
    }
    function fillStack() {
        stack.innerHTML = ""
        stack.append(makePage(idx + 1), makePage(idx))
        bindTop()
    }
    const topPage = () => stack.lastElementChild
    function advance() {
        idx++
        stack.prepend(makePage(idx + 1))
        bindTop()
    }
    // preload so tearing never reveals a blank page
    cfg().list.forEach((p) => {
        const im = new win.Image()
        im.src = p.image.src
    })
    fillStack()

    /* ---------- local coordinates ---------- */
    let hostRect = host.getBoundingClientRect()
    const local = (e) => {
        const k = hostRect.width / Math.max(1, host.offsetWidth) || 1
        return {
            x: (e.clientX - hostRect.left) / k,
            y: (e.clientY - hostRect.top) / k,
        }
    }
    const stackRect = () => ({
        left: stackL,
        top: stackT,
        right: stackL + pw,
        bottom: stackT + ph,
    })
    const barRect = () => ({
        left: W / 2 - barW / 2 + swX,
        top: wireL - swY,
        right: W / 2 + barW / 2 + swX,
        bottom: wireL - swY + barH,
    })

    /* ---------- corner peek ---------- */
    const peek = { el: null, side: "r", s: 0, tgt: 0, raf: 0 }
    function peekStep() {
        peek.raf = 0
        const p = peek.el
        if (!p || grab) {
            peek.s = 0
            return
        }
        peek.s += (peek.tgt - peek.s) * 0.22
        if (Math.abs(peek.tgt - peek.s) < 0.3) peek.s = peek.tgt
        setCurl(p, peek.s, peek.side)
        if (peek.s !== peek.tgt) peek.raf = win.requestAnimationFrame(peekStep)
        else if (peek.s === 0) peek.el = null
    }
    function hover(e) {
        if (grab || pinDrag || barDrag || e.buttons) return
        const p = topPage()
        if (!p) return
        const q = local(e),
            x = q.x - stackL,
            y = q.y - stackT,
            Z = Math.min(96, pw * 0.2)
        let tgt = 0,
            side = peek.side
        if (y > ph - Z && y < ph + 8 && x > -8 && x < pw + 8) {
            const dx = x < pw / 2 ? x : pw - x,
                d = Math.hypot(Math.max(0, dx), Math.max(0, ph - y))
            if (d < Z) {
                tgt = 10 + 22 * (1 - d / Z)
                side = x < pw / 2 ? "l" : "r"
            }
        }
        if (peek.el && peek.el !== p) {
            setCurl(peek.el, 0)
            peek.s = 0
        }
        if (tgt && peek.s > 0 && side !== peek.side) {
            setCurl(p, 0)
            peek.s = 0
        }
        peek.el = tgt || peek.s ? p : null
        peek.tgt = tgt
        peek.side = side
        if (peek.el && !peek.raf) peek.raf = win.requestAnimationFrame(peekStep)
    }

    /* ---------- tearing ---------- */
    let grab = null
    const flyers = []
    function bindTop() {
        const p = topPage()
        p.onpointerdown = (e) => {
            if (e.button) return
            hostRect = host.getBoundingClientRect()
            audio()
            const q = local(e)
            grab = {
                el: p,
                g: { x: q.x - stackL, y: q.y - stackT },
                x0: q.x,
                y0: q.y,
                moved: false,
                side: 0,
                hist: [[q.x, q.y, performance.now()]],
            }
            grab.curl = grab.g.y > ph * 0.62
            grab.cside = grab.g.x > pw / 2 ? "r" : "l"
            grab.cs0 = peek.el === p ? peek.s : 0
            if (grab.cs0) {
                grab.curl = true
                grab.cside = peek.side
            }
            peek.el = null
            peek.tgt = 0
            peek.s = 0
            try {
                p.setPointerCapture(e.pointerId)
            } catch (err) {}
            e.preventDefault()
        }
        p.onpointermove = (e) => {
            if (grab && grab.el === p) dragMove(e)
        }
        p.onpointerup = p.onpointercancel = (e) => {
            if (grab && grab.el === p) dragEnd(e)
        }
    }
    const velocity = (h) => {
        const n = h.length
        if (n < 2) return [0, 0]
        const a = h[Math.max(0, n - 5)],
            b = h[n - 1],
            dt = Math.max(8, b[2] - a[2])
        return [((b[0] - a[0]) / dt) * 1000, ((b[1] - a[1]) / dt) * 1000]
    }
    function dragMove(e) {
        const G = grab,
            q = local(e)
        G.hist.push([q.x, q.y, performance.now()])
        if (G.hist.length > 8) G.hist.shift()
        const dx = q.x - G.x0,
            dy = q.y - G.y0
        if (!G.moved && Math.hypot(dx, dy) < 10) return
        G.moved = true
        if (G.fly) {
            G.fly.tx = q.x - G.fly.o.x
            G.fly.ty = q.y - G.fly.o.y
            return
        }
        const P = { x: q.x - stackL, y: q.y - stackT },
            g = G.g
        if (!G.side || Math.abs(dx) > 14)
            G.side = Math.abs(dx) > 3 ? Math.sign(dx) : g.x < pw / 2 ? 1 : -1
        const pv = { x: G.side > 0 ? 0 : pw, y: 0 }
        let th =
            ((Math.atan2(P.y - pv.y, P.x - pv.x) -
                Math.atan2(g.y - pv.y, g.x - pv.x)) *
                180) /
            Math.PI
        th = ((th + 540) % 360) - 180
        th = clamp(th, -28, 28)
        const stretch = Math.max(
            0,
            Math.hypot(P.x - pv.x, P.y - pv.y) -
                Math.hypot(g.x - pv.x, g.y - pv.y)
        )
        const ty = Math.min(7, stretch * 0.1),
            lift = Math.min(1, (Math.abs(th) + ty * 2) / 18)
        const p = G.el
        p.style.transformOrigin = `${pv.x}px 0px`
        p.style.filter = `drop-shadow(0 ${3 + lift * 8}px ${5 + lift * 10}px rgba(0,0,0,${0.05 + lift * 0.1}))`
        sw.v += -(th - (G.th || 0)) * 0.0008
        G.th = th
        if (G.curl) {
            const d = Math.hypot(dx, dy),
                cs = Math.min(pw * 0.42, Math.max(G.cs0 || 0, d * 0.8))
            setCurl(p, cs, G.cside)
            p.style.transform = `translateY(${ty.toFixed(1)}px) rotate(${(th * 0.3).toFixed(2)}deg)`
            if (d > pw * 0.26) tear(q, th * 0.3, pv, ty)
            return
        }
        p.style.transform = `translateY(${ty.toFixed(1)}px) rotate(${th.toFixed(2)}deg)`
        if (Math.abs(th) > 10 || stretch > 45) tear(q, th, pv, ty)
    }
    function tear(q, th, pv, ty) {
        const G = grab,
            p = G.el
        setCurl(p, 0)
        p.querySelectorAll(".tp-flap").forEach((x) => x.remove())
        sndTear(0.8 + Math.random() * 0.3)
        // re-parent into a flyer, keeping the same place on screen: rotate about the hand instead of the corner
        const fl = el("div", "tp-fly")
        fl.style.width = pw + "px"
        fl.style.height = ph + "px"
        p.style.transform = ""
        p.style.transformOrigin = ""
        p.style.filter = ""
        p.onpointerdown = null
        fl.append(p)
        layer.append(fl)
        const o = { x: G.g.x, y: G.g.y }
        // where the hand's point sits now, given the corner rotation we were showing
        const a = (th * Math.PI) / 180,
            rx = o.x - pv.x,
            ry = o.y - pv.y
        const hx = stackL + pv.x + rx * Math.cos(a) - ry * Math.sin(a),
            hy = stackT + ty + pv.y + rx * Math.sin(a) + ry * Math.cos(a)
        fl.style.transformOrigin = `${o.x}px ${o.y}px`
        const f = {
            el: fl,
            item: p._item,
            o,
            held: true,
            x: hx - o.x,
            y: hy - o.y,
            tx: q.x - o.x,
            ty: q.y - o.y,
            r: th,
            rv: 0,
            sc: 1,
            scT: 1,
            offx: 0,
            offy: 0,
            t: 0,
            seed: Math.random() * 6,
            flip: 0,
        }
        flyers.push(f)
        G.fly = f
        sw.v += Math.sign(th) * 0.04
        advance()
        // the old page keeps listening for this pointer through capture; route moves via the host
    }
    function dragEnd(e) {
        const G = grab
        grab = null
        if (!G) return
        if (G.fly) {
            const [vx, vy] = velocity(G.hist),
                f = G.fly
            showGhost(null)
            if (e && e.clientX != null && tryPin(f, vx, vy)) return
            f.held = false
            f.x += f.offx
            f.y += f.offy
            f.offx = f.offy = 0
            f.vx = clamp(vx, -1400, 1400)
            f.vy = clamp(vy, -600, 1400)
            f.w = f.rv / 60
            f.t = 0
            return
        }
        const p = G.el
        if (!G.moved) {
            if (G.cs0) {
                peek.el = p
                peek.s = peek.tgt = G.cs0
                peek.side = G.cside
            }
            nudge(p)
            return
        }
        if (G.curl) {
            const m = (p.style.clipPath.match(/- ([\d.]+)px/) || [])[1],
                cs0 = parseFloat(m || 0)
            tween(260, (t) => setCurl(p, cs0 * (1 - easeOut(t)), G.cside))
        }
        p.animate(
            [{ transform: p.style.transform || "none" }, { transform: "none" }],
            { duration: 480, easing: "cubic-bezier(.3,1.5,.5,1)" }
        )
        p.style.transform = ""
        p.style.filter = ""
    }
    const nudge = (p) =>
        p.animate(
            [
                { transform: "none" },
                { transform: "translateY(3px) rotate(.4deg)" },
                { transform: "none" },
            ],
            { duration: 360, easing: "ease-out" }
        )

    /* ---------- wall ---------- */
    const pinned = []
    const syncBroom = () => broom.classList.toggle("on", pinned.length > 0)
    function topMid(f, s = f.sc, r = f.r) {
        const a = (r * Math.PI) / 180,
            dx = (pw / 2 - f.o.x) * s,
            dy = -f.o.y * s
        return {
            x: f.x + f.offx + f.o.x + dx * Math.cos(a) - dy * Math.sin(a),
            y: f.y + f.offy + f.o.y + dx * Math.sin(a) + dy * Math.cos(a),
        }
    }
    function canPin(x, y, w, h) {
        const m = 10,
            box = { l: x - w / 2, r: x + w / 2, t: y, b: y + h }
        const hit = (q) =>
            box.l < q.right + m &&
            box.r > q.left - m &&
            box.t < q.bottom + m &&
            box.b > q.top - m
        const br = { left: W - 46, top: 12, right: W - 12, bottom: 46 }
        return (
            !hit(stackRect()) && !hit(barRect()) && !(pinned.length && hit(br))
        )
    }
    function pinSpot(f) {
        const w = pw * PIN_S,
            h = ph * PIN_S,
            hx = f.tx + f.o.x,
            hy = f.ty + f.o.y
        const x = clamp(hx, w / 2 + 10, W - w / 2 - 10),
            y = clamp(hy - h * 0.42, 14, H - h - 10)
        return canPin(x, y, w, h) ? { x, y } : null
    }
    function showGhost(sp) {
        ghost.classList.toggle("on", !!sp)
        tip.classList.toggle("on", !!sp)
        if (sp) {
            ghost.style.left = tip.style.left = sp.x + "px"
            ghost.style.top = tip.style.top = sp.y + "px"
        }
    }
    // the hand slows down over open wall → the page shrinks to wall size and a magnet asks to be let go
    function preview(f, dt, speed) {
        if (!cfg().pin) return
        f.spd = (f.spd || 0) + (speed - (f.spd || 0)) * Math.min(1, dt * 8)
        f.slow = f.spd < 520 ? (f.slow || 0) + dt : 0
        let sp = null
        if (f.pv) {
            sp = pinSpot(f)
            if (!sp || f.spd > 1800) {
                f.pv = false
                sp = null
            }
        } else if (f.slow > 0.12) {
            sp = pinSpot(f)
            f.pv = !!sp
        }
        f.spot = sp
        f.scT = sp ? PIN_S : 1
        showGhost(sp)
        let ox = 0,
            oy = 0
        if (sp) {
            const sx = f.offx,
                sy = f.offy
            f.offx = f.offy = 0
            const q = topMid(f, PIN_S, f.r)
            ox = sp.x - q.x
            oy = sp.y - q.y
            f.offx = sx
            f.offy = sy
        }
        const k = Math.min(1, dt * 14)
        f.offx += (ox - f.offx) * k
        f.offy += (oy - f.offy) * k
    }
    function tryPin(f, vx, vy) {
        const sp = f.spot
        if (!sp || Math.hypot(vx, vy) > 1500) return false
        const from = topMid(f)
        flyers.splice(flyers.indexOf(f), 1)
        const node = f.el
        node.className = "tp-pin"
        node.style.transformOrigin = "50% 0"
        const P = {
            el: node,
            item: f.item,
            x: sp.x,
            y: sp.y,
            r: (Math.random() * 2 - 1) * 3.5,
        }
        mountPin(P, { x: from.x, y: from.y, s: f.sc, r: f.r })
        sndMagnet()
        return true
    }
    const T = (P, x, y, s, r) =>
        `translate(${x - pw / 2}px, ${y}px) rotate(${r}deg) scale(${s})`
    const placePin = (P, s = PIN_S, r = P.r) => {
        P.el.style.transform = T(P, P.x, P.y, s, r)
    }
    function mountPin(P, from) {
        const node = P.el
        let mag = node.querySelector(".tp-mag")
        if (!mag) {
            mag = el("i", "tp-mag")
            mag.style.transform = `scale(${1 / PIN_S})`
            mag.style.transformOrigin = "50% 36%"
            node.append(mag)
        }
        pinned.push(P)
        syncBroom()
        placePin(P)
        const L = (u, v, t) => u + (v - u) * t
        tween(
            420,
            (t) => {
                const e = easeOut(t),
                    b = Math.sin(Math.PI * Math.min(1, t / 0.85))
                node.style.transform = T(
                    P,
                    L(from.x, P.x, e),
                    L(from.y, P.y, e) - 6 * b,
                    L(from.s, PIN_S, e) * (1 + 0.04 * b),
                    L(from.r, P.r, e)
                )
            },
            () => swingPin(P, (P.r > 0 ? -1 : 1) * 5)
        )
        mag.style.opacity = 0
        win.setTimeout(
            () =>
                tween(300, (t) => {
                    const s =
                        t < 0.75
                            ? L(1.9, 0.9, easeOut(t / 0.75))
                            : L(0.9, 1, (t - 0.75) / 0.25)
                    mag.style.opacity = Math.min(1, t / 0.5)
                    mag.style.transform = `scale(${s / PIN_S})`
                }),
            220
        )
        bindPin(P)
    }
    function swingPin(P, kick) {
        if (P.stop) P.stop()
        P.stop = tween(
            1100,
            (t) => {
                P.el.style.transform = T(
                    P,
                    P.x,
                    P.y,
                    PIN_S,
                    P.r + kick * Math.exp(-4.5 * t) * Math.cos(t * Math.PI * 5)
                )
            },
            () => {
                P.stop = null
                placePin(P)
            }
        )
    }
    let pinDrag = null
    function bindPin(P) {
        const node = P.el
        node.onpointerdown = (e) => {
            if (e.button) return
            e.stopPropagation()
            e.preventDefault()
            hostRect = host.getBoundingClientRect()
            const q0 = local(e)
            pinDrag = {
                P,
                x0: q0.x,
                y0: q0.y,
                px: P.x,
                py: P.y,
                hist: [[q0.x, q0.y, performance.now()]],
                moved: false,
            }
            try {
                node.setPointerCapture(e.pointerId)
            } catch (err) {}
        }
        node.onpointermove = (e) => {
            const D = pinDrag
            if (!D || D.P !== P) return
            const q = local(e)
            D.hist.push([q.x, q.y, performance.now()])
            if (D.hist.length > 8) D.hist.shift()
            if (!D.moved && Math.hypot(q.x - D.x0, q.y - D.y0) < 6) return
            if (!D.moved) {
                D.moved = true
                node.classList.add("lift")
                if (P.stop) {
                    P.stop()
                    P.stop = null
                }
                sndPluck(0.5)
            }
            P.x = D.px + q.x - D.x0
            P.y = D.py + q.y - D.y0
            placePin(P, PIN_S * 1.06, P.r * 0.5)
        }
        node.onpointerup = node.onpointercancel = (e) => {
            const D = pinDrag
            if (!D || D.P !== P) return
            pinDrag = null
            node.classList.remove("lift")
            if (!D.moved) {
                // tap: open the page's link
                const link = P.item && P.item.link
                if (link) win.open(link, "_blank", "noopener")
                else
                    node.animate(
                        [
                            { transform: node.style.transform },
                            {
                                transform:
                                    node.style.transform + " translateY(-6px)",
                            },
                            { transform: node.style.transform },
                        ],
                        { duration: 260, easing: "ease-out" }
                    )
                return
            }
            const [vx, vy] = velocity(D.hist)
            if (
                Math.hypot(vx, vy) > 900 ||
                !canPin(P.x, P.y, pw * PIN_S, ph * PIN_S)
            ) {
                dropPin(P, vx, vy)
                sndTear(0.35)
                return
            }
            placePin(P)
            swingPin(P, clamp(vx * 0.004, -6, 6))
            sndMagnet(0.6)
        }
    }
    function dropPin(P, vx = 0, vy = 0) {
        const node = P.el
        pinned.splice(pinned.indexOf(P), 1)
        syncBroom()
        if (P.stop) {
            P.stop()
            P.stop = null
        }
        node.onpointerdown =
            node.onpointermove =
            node.onpointerup =
            node.onpointercancel =
                null
        const m = node.querySelector(".tp-mag")
        if (m) m.remove()
        node.className = "tp-fly"
        node.style.transformOrigin = "50% 0"
        flyers.push({
            el: node,
            o: { x: pw / 2, y: 0 },
            held: false,
            sc: PIN_S,
            x: P.x - pw / 2,
            y: P.y,
            r: P.r,
            offx: 0,
            offy: 0,
            vx: clamp(vx, -1400, 1400),
            vy: clamp(vy, -300, 1400),
            w: (Math.random() * 2 - 1) * 0.6,
            t: 0,
            seed: Math.random() * 6,
            flip: 0,
        })
    }
    broom.onclick = (e) => {
        e.stopPropagation()
        ;[...pinned]
            .sort((a, b) => a.x - b.x)
            .forEach((P, i) =>
                win.setTimeout(() => {
                    if (pinned.includes(P)) {
                        dropPin(P, (Math.random() * 2 - 1) * 80, 40)
                        sndMagnet(0.35)
                    }
                }, i * 90)
            )
    }

    /* ---------- bar: drag it, pluck the wires ---------- */
    let barDrag = null
    bar.onpointerdown = (e) => {
        if (e.button) return
        hostRect = host.getBoundingClientRect()
        audio()
        barDrag = { x0: local(e).x, dx: 0 }
        try {
            bar.setPointerCapture(e.pointerId)
        } catch (err) {}
        e.preventDefault()
    }
    bar.onpointermove = (e) => {
        if (barDrag) barDrag.dx = local(e).x - barDrag.x0
    }
    bar.onpointerup = bar.onpointercancel = () => {
        barDrag = null
    }
    let lastP = null
    function pluck(e) {
        if (grab || pinDrag || barDrag) {
            lastP = null
            return
        }
        const q = local(e),
            now = performance.now()
        if (lastP && q.y > 0 && q.y < wireL - swY) {
            const wx = [W / 2 - barW * 0.36, W / 2 + barW * 0.36].map(
                (x) => x + swX * (q.y / Math.max(1, wireL - swY))
            )
            const vx = ((q.x - lastP.x) / Math.max(8, now - lastP.t)) * 1000
            wx.forEach((x) => {
                if (
                    Math.sign(lastP.x - x) !== Math.sign(q.x - x) &&
                    Math.abs(vx) > 60
                ) {
                    sw.v += clamp(vx * 0.00022, -0.35, 0.35)
                    sndPluck(Math.min(1, Math.abs(vx) / 1500))
                }
            })
        }
        lastP = { x: q.x, y: q.y, t: now }
    }

    /* ---------- host-level pointer routing ---------- */
    const onMove = (e) => {
        hostRect = host.getBoundingClientRect()
        if (grab && grab.fly) dragMove(e)
        hover(e)
        pluck(e)
    }
    const onUp = (e) => {
        if (grab) dragEnd(e)
        if (barDrag) barDrag = null
    }
    const onCancel = () => {
        if (grab) dragEnd({})
    }
    if (still) layer.style.pointerEvents = "none"
    else {
        win.addEventListener("pointermove", onMove)
        win.addEventListener("pointerup", onUp)
        win.addEventListener("pointercancel", onCancel)
        win.addEventListener("blur", onCancel)
    }

    /* ---------- tiny rAF tween ---------- */
    const tweens = new Set()
    function tween(ms, fn, done) {
        let t0 = null,
            id = 0
        const go = (now) => {
            if (!alive) return
            if (t0 === null) t0 = now
            const t = Math.min(1, (now - t0) / ms)
            fn(t)
            if (t < 1) id = win.requestAnimationFrame(go)
            else {
                tweens.delete(stop)
                if (done) done()
            }
        }
        const stop = () => {
            win.cancelAnimationFrame(id)
            tweens.delete(stop)
        }
        tweens.add(stop)
        id = win.requestAnimationFrame(go)
        return stop
    }

    /* ---------- the loop ---------- */
    let last = performance.now(),
        raf = 0
    function frame(t) {
        if (!alive) return
        const dt = Math.min(0.033, Math.max(0, (t - last) / 1000))
        last = t
        // swing like a pendulum on two parallel wires
        if (barDrag) {
            const tgt = clamp(
                Math.asin(clamp(barDrag.dx / (Lp * 0.9), -0.95, 0.95)),
                -0.55,
                0.55
            )
            const na = sw.a + (tgt - sw.a) * Math.min(1, dt * 18)
            sw.v = (na - sw.a) / Math.max(dt, 0.001)
            sw.a = na
        } else {
            sw.v += ((-9.81 / (Lp / 400)) * Math.sin(sw.a) - 1.1 * sw.v) * dt
            sw.a += sw.v * dt
        }
        swX = Math.sin(sw.a) * Lp * 0.35
        swY = Lp * 0.35 * (1 - Math.cos(sw.a))
        const bx = W / 2 - barW / 2 + swX,
            by = wireL - swY
        bar.style.transform = `translate(${bx}px, ${by}px)`
        stackL = W / 2 - pw / 2 + swX
        stackT = by + barH * 0.82
        stack.style.transform = `translate(${stackL}px, ${stackT}px)`
        // wires + hooks
        const ax = [W / 2 - barW * 0.36, W / 2 + barW * 0.36]
        const hr = Math.max(3, barH * 0.22)
        wires.innerHTML = ax
            .map((x) => {
                const ex = x + swX,
                    ey = by + barH * 0.3
                return (
                    `<path d="M${x} 0 L${ex} ${ey - hr * 2.4}" stroke="#9aa0a6" stroke-width="1.1" fill="none"/>` +
                    `<path d="M${ex} ${ey - hr * 2.4} q${hr} 0 ${hr} ${hr} t${-hr} ${hr} t${-hr * 0.2} ${hr * 0.6}" stroke="#7d8389" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
                )
            })
            .join("")
        // pages in the air
        for (let i = flyers.length - 1; i >= 0; i--) {
            const f = flyers[i]
            if (f.held) {
                const px = f.x,
                    py = f.y
                f.sc += (f.scT - f.sc) * Math.min(1, dt * 14)
                f.x += (f.tx - f.x) * Math.min(1, dt * 28)
                f.y += (f.ty - f.y) * Math.min(1, dt * 28)
                const vx = (f.x - px) / Math.max(dt, 0.001),
                    vy = (f.y - py) / Math.max(dt, 0.001)
                preview(f, dt, Math.hypot(vx, vy))
                const target = clamp(-vx * 0.035, -32, 32)
                f.rv += ((target - f.r) * 70 - f.rv * 11) * dt
                f.r += f.rv * dt
                f.flip +=
                    (clamp(vx * 0.02, -18, 18) - f.flip) * Math.min(1, dt * 6)
                f.el.style.transformOrigin = `${f.o.x}px ${f.o.y}px`
                f.el.style.transform = `translate(${f.x + f.offx}px, ${f.y + f.offy}px) rotate(${f.r}deg) scale(${f.sc}) perspective(1200px) rotateY(${f.flip}deg)`
                continue
            }
            f.t += dt
            f.vy += 900 * dt
            f.vx *= Math.pow(0.35, dt)
            f.vy *= Math.pow(0.6, dt)
            f.vx += Math.sin(f.t * 3 + f.seed) * 70 * dt
            f.x += f.vx * dt
            f.y += f.vy * dt
            f.w += -f.w * 1.2 * dt + Math.sin(f.t * 3 + f.seed) * 6 * dt
            f.r += f.w * dt * 20
            const flip = Math.sin(f.t * 3 + f.seed) * 10 * Math.min(1, f.t * 2)
            f.el.style.transform = `translate(${f.x}px, ${f.y}px) rotate(${f.r}deg) scale(${f.sc || 1}) perspective(1200px) rotateX(${flip}deg)`
            f.el.style.opacity = Math.max(0, 1 - Math.max(0, f.t - 0.5) * 1.4)
            if (f.y > H + 200 || f.t > 1.4) {
                f.el.remove()
                flyers.splice(i, 1)
            }
        }
        if (!still) raf = win.requestAnimationFrame(frame)
    }
    if (still) {
        sw.a = 0
        frame(performance.now())
        ro.disconnect()
        const ro2 = new win.ResizeObserver(() => {
            layout()
            frame(performance.now())
        })
        ro2.observe(host)
        tweens.add(() => ro2.disconnect())
    } else raf = win.requestAnimationFrame(frame)

    return () => {
        alive = false
        win.cancelAnimationFrame(raf)
        if (peek.raf) win.cancelAnimationFrame(peek.raf)
        tweens.forEach((s) => s())
        ro.disconnect()
        win.removeEventListener("pointermove", onMove)
        win.removeEventListener("pointerup", onUp)
        win.removeEventListener("pointercancel", onCancel)
        win.removeEventListener("blur", onCancel)
        try {
            if (ac) ac.close()
        } catch (e) {}
        layer.remove()
    }
}
