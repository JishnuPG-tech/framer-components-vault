/**
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 560
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
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


const CREDIT = "Built by [Yoab](https://yoab.framer.website)"

interface Screen {
    image?: { src?: string; srcSet?: string; alt?: string }
    alt?: string
    scrolls?: boolean
    caption?: string
    customBg?: boolean
    bg?: string
}
interface Props {
    screens: Screen[]
    preset: "custom" | "minimal" | "soft" | "glass" | "bold"
    layout: "coverflow" | "fan" | "stack"
    captionSize: number
    autoPlay: boolean
    interval: number
    showPause: boolean
    showArrows: boolean
    showDots: boolean
    frame: "island" | "notch" | "punch" | "minimal"
    finish: "matte" | "titanium"
    bezelColor: string
    bezelWidth: number
    cornerRadius: number
    sideButtons: boolean
    statusBar: boolean
    statusTime: string
    statusStyle: "light" | "dark"
    homeIndicator: boolean
    tilt: boolean
    tiltAmount: number
    glare: boolean
    glareStrength: number
    scrollMode: "auto" | "hover"
    scrollDuration: number
    phoneWidth: number
    accent: string
    background: string
    speed: number
    onChange?: () => void
    onNext?: () => void
    onPrevious?: () => void
    onPause?: () => void
    onPlay?: () => void
    style?: React.CSSProperties
}

const mod = (a: number, n: number) => ((a % n) + n) % n
const clamp = (v: unknown, min: number, max: number, d: number) => {
    const x = Number(v)
    return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : d
}

type Look = Pick<
    Props,
    | "frame"
    | "finish"
    | "bezelColor"
    | "bezelWidth"
    | "cornerRadius"
    | "sideButtons"
    | "glare"
    | "glareStrength"
    | "accent"
    | "background"
>
const PRESETS: Record<Exclude<Props["preset"], "custom">, Look> = {
    minimal: {
        frame: "minimal",
        finish: "matte",
        bezelColor: "#111111",
        bezelWidth: 6,
        cornerRadius: 28,
        sideButtons: false,
        glare: false,
        glareStrength: 0,
        accent: "#111111",
        background: "#ffffff",
    },
    soft: {
        frame: "island",
        finish: "matte",
        bezelColor: "#ffffff",
        bezelWidth: 9,
        cornerRadius: 38,
        sideButtons: false,
        glare: true,
        glareStrength: 25,
        accent: "#2b2f3a",
        background: "#eceef3",
    },
    glass: {
        frame: "island",
        finish: "titanium",
        bezelColor: "#2a2d36",
        bezelWidth: 8,
        cornerRadius: 40,
        sideButtons: true,
        glare: true,
        glareStrength: 55,
        accent: "#ffffff",
        background: "#12141c",
    },
    bold: {
        frame: "notch",
        finish: "matte",
        bezelColor: "#000000",
        bezelWidth: 12,
        cornerRadius: 30,
        sideButtons: true,
        glare: true,
        glareStrength: 30,
        accent: "#111111",
        background: "#f6c945",
    },
}
/** A preset replaces the look settings; everything else (screens, behavior, layout) stays yours. */
const resolvePreset = (p: Props): Props =>
    p.preset !== "custom" && PRESETS[p.preset]
        ? { ...p, ...PRESETS[p.preset] }
        : p

const safeColor = (c: unknown) =>
    typeof c === "string" && /^[#\w\s(),.%/-]+$/.test(c.trim())
        ? c.trim()
        : undefined

const CSS = `
.pc{container:pc/inline-size;position:relative;width:100%;--pc-step:calc(var(--pc-w)*.72);color:var(--pc-accent)}
.pc *{box-sizing:border-box}
.pc-frame{display:grid;gap:8px;padding:40px 24px 8px;background:var(--pc-stage,var(--pc-bg));transition:background-color var(--pc-speed) ease}
.pc[data-static="true"] .pc-frame{transition:none}
.pc-wrap{position:relative;touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:grab}
.pc-wrap[data-drag="true"]{cursor:grabbing}
.pc-stage{display:grid;justify-items:center;overflow:hidden;padding-block:8px 40px}
.pc-slide{--x:0;--s:1;--o:1;grid-area:1/1;justify-self:center;width:100%;min-width:0;display:grid;justify-items:center;
transform:translate(calc(var(--x)*var(--pc-step) + var(--pc-dx,0px)),var(--y,0px)) rotate(var(--r,0deg)) scale(var(--s));opacity:var(--o);
transition:transform var(--pc-speed) cubic-bezier(.2,.7,.2,1),opacity var(--pc-speed) cubic-bezier(.2,.7,.2,1)}
.pc[data-static="true"] .pc-slide,.pc-wrap[data-drag="true"] .pc-slide{transition:none}
.pc-slide[data-pos="0"]{z-index:3}
.pc-slide[data-pos="-1"]{--x:-1;--s:.8;--o:.5;z-index:2;cursor:pointer}
.pc-slide[data-pos="1"]{--x:1;--s:.8;--o:.5;z-index:2;cursor:pointer}
.pc-slide[data-pos="far-left"],.pc-slide[data-pos="-2"]{--x:-1.7;--s:.65;--o:0;z-index:1;pointer-events:none}
.pc-slide[data-pos="far-right"],.pc-slide[data-pos="2"]{--x:1.7;--s:.65;--o:0;z-index:1;pointer-events:none}
.pc[data-layout="fan"] .pc-slide{transform-origin:50% 130%}
.pc[data-layout="fan"] .pc-slide[data-pos="-1"]{--x:-.55;--y:14px;--r:-9deg;--s:.92;--o:.95}
.pc[data-layout="fan"] .pc-slide[data-pos="1"]{--x:.55;--y:14px;--r:9deg;--s:.92;--o:.95}
.pc[data-layout="fan"] .pc-slide[data-pos="-2"]{--x:-1;--y:40px;--r:-18deg;--s:.84;--o:.7;pointer-events:auto;cursor:pointer}
.pc[data-layout="fan"] .pc-slide[data-pos="2"]{--x:1;--y:40px;--r:18deg;--s:.84;--o:.7;pointer-events:auto;cursor:pointer}
.pc[data-layout="stack"] .pc-slide[data-pos="-1"]{--x:-.08;--y:-12px;--r:-3deg;--s:.95;--o:.9}
.pc[data-layout="stack"] .pc-slide[data-pos="1"]{--x:.08;--y:-12px;--r:3deg;--s:.95;--o:.9}
.pc[data-layout="stack"] .pc-slide[data-pos="-2"]{--x:-.14;--y:-24px;--r:-6deg;--s:.9;--o:.6;pointer-events:auto;cursor:pointer}
.pc[data-layout="stack"] .pc-slide[data-pos="2"]{--x:.14;--y:-24px;--r:6deg;--s:.9;--o:.6;pointer-events:auto;cursor:pointer}
.pc-phone{position:relative;width:min(100%,var(--pc-w));padding:var(--pc-bw);border-radius:var(--pc-radius);background:var(--pc-bezel);transition:box-shadow var(--pc-speed) ease,transform .22s ease-out}
.pc-slide[data-pos="0"] .pc-phone{box-shadow:0 22px 44px -20px rgba(0,0,0,.5)}
.pc-screen{position:relative;aspect-ratio:9/19.5;overflow:hidden;border-radius:max(0px,calc(var(--pc-radius) - var(--pc-bw) + 1px));background:#e6e6e3}
.pc-screen img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;pointer-events:none;-webkit-user-drag:none}
.pc-slide[data-pos="0"] .pc-phone{transform:perspective(calc(900px*var(--pc-u))) rotateX(var(--pc-rx,0deg)) rotateY(var(--pc-ry,0deg))}
.pc[data-static="true"] .pc-phone,.pc-wrap[data-drag="true"] .pc-phone{transition:none}
.pc-glare{position:absolute;inset:0;z-index:4;pointer-events:none;background:radial-gradient(circle at var(--pc-gx,28%) var(--pc-gy,0%),rgba(255,255,255,.6),rgba(255,255,255,0) 58%);opacity:var(--pc-gl,calc(var(--pc-glare)*.4));transition:opacity .22s ease-out}
.pc-slide:not([data-pos="0"]) .pc-glare{display:none}
.pc-phone[data-finish="titanium"]{background-image:linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,0) 40%,rgba(255,255,255,.08));box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.22),inset 0 0 0 3px rgba(0,0,0,.4)}
.pc-slide[data-pos="0"] .pc-phone[data-finish="titanium"]{box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.22),inset 0 0 0 3px rgba(0,0,0,.4),0 22px 44px -20px rgba(0,0,0,.5)}
.pc-phone[data-buttons="true"]::before,.pc-phone[data-buttons="true"]::after{content:"";position:absolute;background:var(--pc-bezel)}
.pc-phone[data-buttons="true"]::before{left:-2px;top:calc(60px*var(--pc-u));width:3px;height:calc(28px*var(--pc-u));border-radius:2px 0 0 2px;box-shadow:0 calc(40px*var(--pc-u)) 0 var(--pc-bezel)}
.pc-phone[data-buttons="true"]::after{right:-2px;top:calc(84px*var(--pc-u));width:3px;height:calc(46px*var(--pc-u));border-radius:0 2px 2px 0}
.pc-cut{position:absolute;z-index:3;left:50%;translate:-50% 0;background:#000;pointer-events:none}
.pc-cut[data-frame="island"]{top:calc(9px*var(--pc-u));width:calc(70px*var(--pc-u));height:calc(20px*var(--pc-u));border-radius:999px}
.pc-cut[data-frame="notch"]{top:0;width:calc(92px*var(--pc-u));height:calc(19px*var(--pc-u));border-radius:0 0 calc(12px*var(--pc-u)) calc(12px*var(--pc-u))}
.pc-cut[data-frame="punch"]{top:calc(10px*var(--pc-u));width:calc(9px*var(--pc-u));height:calc(9px*var(--pc-u));border-radius:50%}
.pc-status{position:absolute;z-index:2;top:0;left:0;right:0;height:calc(38px*var(--pc-u));display:flex;align-items:center;justify-content:space-between;padding:calc(4px*var(--pc-u)) calc(20px*var(--pc-u)) 0;color:var(--pc-ink);font:600 calc(11px*var(--pc-u))/1 system-ui,-apple-system,sans-serif;pointer-events:none}
.pc-status-icons{display:flex;align-items:center;gap:calc(3px*var(--pc-u))}
.pc-status svg{display:block;height:calc(8px*var(--pc-u));width:auto}
.pc-home{position:absolute;z-index:2;bottom:calc(6px*var(--pc-u));left:50%;translate:-50% 0;width:calc(78px*var(--pc-u));height:calc(3px*var(--pc-u));border-radius:3px;background:var(--pc-ink);opacity:.85;pointer-events:none}
.pc-scroll{position:absolute;top:0;left:0;right:0;will-change:transform}
.pc-scroll img{height:auto;object-fit:initial}
.pc-slide[data-scrolling="true"] .pc-scroll{animation:pc-scroll var(--pc-sdur) ease-in-out infinite paused}
.pc[data-scroll-run="true"] .pc-slide[data-pos="0"] .pc-scroll{animation-play-state:running}
.pc[data-scroll="hover"] .pc-scroll{animation:none!important;transform:translateY(calc(var(--pc-sc,0)*var(--pc-sy,0)*-100%));transition:transform .35s ease-out}
@keyframes pc-scroll{0%,10%{transform:translateY(0)}45%,55%{transform:translateY(calc(var(--pc-sc,0)*-100%))}90%,100%{transform:translateY(0)}}
@media (hover:none){.pc[data-scroll="hover"] .pc-slide[data-scrolling="true"] .pc-scroll{animation:pc-scroll var(--pc-sdur) ease-in-out infinite paused!important;transform:none;transition:none}
.pc[data-scroll="hover"][data-scroll-run="true"] .pc-slide[data-pos="0"] .pc-scroll{animation-play-state:running!important}}
.pc[data-static="true"] .pc-scroll{animation:none!important;transition:none}
.pc-empty{display:grid;place-items:center;width:100%;height:100%;font:500 13px/1.3 system-ui,sans-serif;color:#8a8a86}
.pc-arrow{position:absolute;top:50%;translate:0 -50%;z-index:5;display:grid;place-items:center;width:44px;height:44px;padding:0;
border:1px solid rgba(128,128,128,.35);border-radius:50%;background:var(--pc-stage,var(--pc-bg));color:var(--pc-accent);cursor:pointer;transition:transform .15s ease}
.pc-arrow[data-dir="prev"]{left:0}.pc-arrow[data-dir="next"]{right:0}
.pc-arrow:hover{transform:scale(1.06)}.pc-arrow:active{transform:scale(.96)}
.pc-caption{min-height:1.4em;max-width:min(100%,420px);margin:0 auto;padding-inline:8px;text-align:center;font-family:inherit;font-weight:500;font-size:var(--pc-capsize);line-height:1.4;color:var(--pc-accent)}
.pc-caption span{display:block;animation:pc-cap .4s ease both}
@keyframes pc-cap{from{opacity:0;transform:translateY(6px)}}
.pc[data-static="true"] .pc-caption span{animation:none}
.pc-controls{display:flex;align-items:center;justify-content:center;gap:8px}
.pc-pause{display:grid;place-items:center;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:none;color:var(--pc-accent);cursor:pointer}
.pc-dots{display:flex;align-items:center}
.pc-dot{display:grid;place-items:center;width:24px;height:44px;padding:0;border:0;background:none;color:inherit;cursor:pointer;transition:width .3s ease}
.pc-dot[data-active="true"]{width:40px}
.pc-dot span{position:relative;display:block;width:8px;height:8px;overflow:hidden;border-radius:999px;transition:width .3s ease}
.pc-dot span::before{content:"";position:absolute;inset:0;background:var(--pc-accent);opacity:.25}
.pc-dot span::after{content:"";position:absolute;inset:0;background:var(--pc-accent);transform:scaleX(0);transform-origin:left center}
.pc-dot[data-active="true"] span{width:28px}
.pc-dot[data-active="true"] span::after{transform:scaleX(1)}
.pc-dot[data-active="true"][data-playing="true"] span::after{transform:scaleX(0);animation:pc-fill var(--pc-interval) linear forwards}
@keyframes pc-fill{to{transform:scaleX(1)}}
.pc :focus-visible{outline:2px solid var(--pc-accent);outline-offset:3px}
.pc-sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@container pc (max-width:520px){.pc{--pc-step:calc(var(--pc-w)*.62)}.pc-frame{padding-inline:12px}.pc-slide[data-pos="-1"],.pc-slide[data-pos="1"]{--s:.76}}
@media (prefers-reduced-motion:reduce){.pc-caption span{animation:none}.pc-frame{transition:none}.pc-scroll{animation:none!important;transition:none}.pc-slide,.pc-phone,.pc-dot,.pc-dot span,.pc-glare{transition:none}}
`

const Chevron = ({ dir }: { dir: "prev" | "next" }) => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden="true"
    >
        <path
            d={
                dir === "prev"
                    ? "M11 3.5 5.5 9l5.5 5.5"
                    : "M7 3.5 12.5 9 7 14.5"
            }
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

/** Sets how far a tall screenshot can scroll (share of its own height) once its size is known. */
const fitTall = (img: HTMLImageElement | null) => {
    if (!img || !img.naturalWidth) return
    const sc = Math.max(
        0,
        1 - 19.5 / 9 / (img.naturalHeight / img.naturalWidth)
    )
    img.parentElement?.style.setProperty("--pc-sc", sc.toFixed(4))
}

const StatusBar = ({ time }: { time: string }) => (
    <div className="pc-status" aria-hidden="true">
        <span>{time}</span>
        <span className="pc-status-icons">
            <svg viewBox="0 0 17 11" fill="currentColor">
                <rect x="0" y="7" width="3" height="4" rx=".7" />
                <rect x="4.7" y="5" width="3" height="6" rx=".7" />
                <rect x="9.4" y="2.5" width="3" height="8.5" rx=".7" />
                <rect x="14" y="0" width="3" height="11" rx=".7" />
            </svg>
            <svg viewBox="0 0 16 11" fill="currentColor">
                <path d="M8 2.2c2.1 0 4 .8 5.4 2.2l1-1.1A9.3 9.3 0 0 0 8 .7 9.3 9.3 0 0 0 1.6 3.3l1 1.1A7.7 7.7 0 0 1 8 2.2Zm0 3.4c1.2 0 2.3.5 3.1 1.2l1-1.1A6.6 6.6 0 0 0 8 4.1c-1.6 0-3.1.6-4.1 1.6l1 1.1c.8-.7 1.9-1.2 3.1-1.2Zm0 3.2c.5 0 1 .2 1.4.6L8 10.9 6.6 9.4c.4-.4.9-.6 1.4-.6Z" />
            </svg>
            <svg viewBox="0 0 26 12" fill="none">
                <rect
                    x=".5"
                    y=".5"
                    width="22"
                    height="11"
                    rx="3.2"
                    stroke="currentColor"
                    opacity=".45"
                />
                <rect
                    x="2"
                    y="2"
                    width="19"
                    height="8"
                    rx="2"
                    fill="currentColor"
                />
                <rect
                    x="24"
                    y="4"
                    width="1.6"
                    height="4"
                    rx=".8"
                    fill="currentColor"
                    opacity=".5"
                />
            </svg>
        </span>
    </div>
)

export default function PhoneCarousel(raw: Props) {
    const props = resolvePreset(raw)
    const isStatic = useIsStaticRenderer()
    const items =
        props.screens && props.screens.length > 0 ? props.screens : [{}, {}, {}]
    const n = items.length
    // Two screens are duplicated so the glide always has a neighbour on each side.
    const slides = React.useMemo(() => {
        const base = items.map((s, i) => ({ s, i, clone: false }))
        return n === 2
            ? [...base, ...base.map((x) => ({ ...x, clone: true }))]
            : base
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.screens, n])
    const m = slides.length
    const ms = Math.max(1500, Number(props.interval) || 4000)

    const [active, setActive] = React.useState(0)
    const [userPaused, setUserPaused] = React.useState(false)
    const [hover, setHover] = React.useState(false)
    const [kbFocus, setKbFocus] = React.useState(false)
    const [inView, setInView] = React.useState(true)
    const [docVisible, setDocVisible] = React.useState(true)
    const [reduce, setReduce] = React.useState(false)
    const [dragging, setDragging] = React.useState(false)

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const wrapRef = React.useRef<HTMLDivElement | null>(null)
    const stageRef = React.useRef<HTMLDivElement | null>(null)
    const drag = React.useRef<{
        x: number
        y: number
        id: number
        on: boolean
        dx: number
    } | null>(null)
    const suppressClick = React.useRef(false)
    const suppressTimer = React.useRef(0)
    const raf = React.useRef(0)
    const latest = React.useRef(props)
    latest.current = props
    const tiltPt = React.useRef<{ x: number; y: number } | null>(null)

    const interactive = m > 1 && !isStatic
    const canPlay = props.autoPlay && interactive && !reduce
    const scrollRun =
        !isStatic &&
        !reduce &&
        inView &&
        docVisible &&
        !dragging &&
        !hover &&
        !kbFocus &&
        !userPaused
    const playing =
        canPlay &&
        !userPaused &&
        !hover &&
        !kbFocus &&
        !dragging &&
        inView &&
        docVisible
    const hoverScroll = props.scrollMode === "hover"
    const fx =
        (props.tilt || props.glare || hoverScroll) && interactive && !reduce
    const cur = isStatic ? 0 : mod(active, m)
    // A scrolling screenshot gets one full pass before the auto swipe moves on.
    const hasCaptions = items.some((x) => x.caption)
    const stageBg = slides[cur].s.customBg
        ? safeColor(slides[cur].s.bg)
        : undefined
    const dwell =
        !isStatic && !reduce && !hoverScroll && slides[cur].s.scrolls
            ? Math.max(ms, clamp(props.scrollDuration, 2, 30, 10) * 1000)
            : ms
    const dot = cur % n

    const step = React.useCallback(
        (d: number) => setActive((a) => mod(a + d, m)),
        [m]
    )
    // User-initiated moves (arrows, keys, swipe, clicking a neighbour) also fire onNext / onPrevious.
    const userStep = (d: number) => {
        step(d)
        if (isStatic) return
        const fn = d > 0 ? latest.current.onNext : latest.current.onPrevious
        fn?.()
    }
    const lastDot = React.useRef(dot)
    React.useEffect(() => {
        if (lastDot.current === dot) return
        lastDot.current = dot
        if (!isStatic) latest.current.onChange?.()
    }, [dot, isStatic])
    const toggleAuto = () => {
        const next = !userPaused
        setUserPaused(next)
        const fn = next ? props.onPause : props.onPlay
        fn?.()
    }
    const goToDot = (j: number) => {
        let delta = mod(j - dot, n)
        if (delta > n / 2) delta -= n
        setActive((a) => mod(a + delta, m))
    }

    React.useEffect(() => {
        if (isStatic) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const on = () => setReduce(mq.matches)
        on()
        mq.addEventListener("change", on)
        const vis = () => setDocVisible(!document.hidden)
        document.addEventListener("visibilitychange", vis)
        return () => {
            mq.removeEventListener("change", on)
            document.removeEventListener("visibilitychange", vis)
        }
    }, [isStatic])

    React.useEffect(() => {
        const el = rootRef.current
        if (isStatic || !el || typeof IntersectionObserver === "undefined")
            return
        const io = new IntersectionObserver(
            (e) => setInView(e[e.length - 1].isIntersecting),
            { threshold: 0.25 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    // Auto swipe. Any change of `active` or `playing` restarts the countdown.
    React.useEffect(() => {
        if (!playing) return
        const id = window.setTimeout(() => step(1), dwell)
        return () => window.clearTimeout(id)
    }, [playing, active, dwell, step])

    React.useEffect(
        () => () => {
            window.clearTimeout(suppressTimer.current)
            window.cancelAnimationFrame(raf.current)
        },
        []
    )

    // Tilt and glare follow the mouse (desktop only). Frame-throttled, and reset when the pointer leaves.
    const applyFx = () => {
        raf.current = 0
        const pt = tiltPt.current
        const st = stageRef.current
        const phone = st?.querySelector('.pc-slide[data-pos="0"] .pc-phone')
        if (!pt || !st || !phone) return
        const r = phone.getBoundingClientRect()
        if (!r.width || !r.height) return
        const nx = clamp(((pt.x - r.left) / r.width - 0.5) * 2, -1, 1, 0)
        const ny = clamp(((pt.y - r.top) / r.height - 0.5) * 2, -1, 1, 0)
        const a = clamp(props.tiltAmount, 0, 20, 8)
        if (props.tilt) {
            st.style.setProperty("--pc-ry", `${(nx * a).toFixed(2)}deg`)
            st.style.setProperty("--pc-rx", `${(-ny * a).toFixed(2)}deg`)
        }
        if (hoverScroll)
            st.style.setProperty(
                "--pc-sy",
                clamp((pt.y - r.top) / r.height, 0, 1, 0).toFixed(3)
            )
        if (props.glare) {
            st.style.setProperty("--pc-gx", `${((nx + 1) * 50).toFixed(1)}%`)
            st.style.setProperty("--pc-gy", `${((ny + 1) * 50).toFixed(1)}%`)
            st.style.setProperty("--pc-gl", "var(--pc-glare)")
        }
    }
    const resetFx = () => {
        window.cancelAnimationFrame(raf.current)
        raf.current = 0
        tiltPt.current = null
        for (const v of [
            "--pc-rx",
            "--pc-ry",
            "--pc-gx",
            "--pc-gy",
            "--pc-gl",
            "--pc-sy",
        ])
            stageRef.current?.style.removeProperty(v)
    }
    // Clear leftover inline values when the effect settings change or the component unmounts.
    React.useEffect(
        () => resetFx,
        [props.tilt, props.glare, props.tiltAmount, props.scrollMode]
    ) // eslint-disable-line react-hooks/exhaustive-deps

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!interactive || (e.pointerType === "mouse" && e.button !== 0))
            return
        if ((e.target as HTMLElement).closest("button")) return
        drag.current = {
            x: e.clientX,
            y: e.clientY,
            id: e.pointerId,
            on: false,
            dx: 0,
        }
    }
    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (fx && e.pointerType === "mouse" && !drag.current?.on) {
            tiltPt.current = { x: e.clientX, y: e.clientY }
            if (!raf.current)
                raf.current = window.requestAnimationFrame(applyFx)
        }
        const d = drag.current
        if (!d || e.pointerId !== d.id) return
        const dx = e.clientX - d.x
        const dy = e.clientY - d.y
        if (!d.on) {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                d.on = true
                resetFx()
                setDragging(true)
                wrapRef.current?.setPointerCapture?.(e.pointerId)
            } else return
        }
        d.dx = Math.max(-220, Math.min(220, dx))
        stageRef.current?.style.setProperty("--pc-dx", `${d.dx}px`)
    }
    const endDrag = (
        e: React.PointerEvent<HTMLDivElement>,
        cancelled: boolean
    ) => {
        const d = drag.current
        if (!d || e.pointerId !== d.id) return
        drag.current = null
        if (!d.on) return
        stageRef.current?.style.removeProperty("--pc-dx")
        setDragging(false)
        if (!cancelled && d.dx <= -40) userStep(1)
        else if (!cancelled && d.dx >= 40) userStep(-1)
        suppressClick.current = true
        suppressTimer.current = window.setTimeout(
            () => (suppressClick.current = false),
            0
        )
    }
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!interactive) return
        const k = e.key
        if (
            k !== "ArrowRight" &&
            k !== "ArrowLeft" &&
            k !== "Home" &&
            k !== "End"
        )
            return
        e.preventDefault()
        if (k === "ArrowRight") userStep(1)
        else if (k === "ArrowLeft") userStep(-1)
        else goToDot(k === "Home" ? 0 : n - 1)
    }
    const onFocus = (e: React.FocusEvent) => {
        try {
            if ((e.target as HTMLElement).matches(":focus-visible"))
                setKbFocus(true)
        } catch {
            /* :focus-visible unsupported */
        }
    }
    const onBlur = (e: React.FocusEvent<HTMLElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
            setKbFocus(false)
    }

    const vars = {
        "--pc-w": `${clamp(props.phoneWidth, 120, 480, 240)}px`,
        "--pc-u": clamp(props.phoneWidth, 120, 480, 240) / 240,
        "--pc-bw": `${clamp(props.bezelWidth, 2, 24, 10)}px`,
        "--pc-glare": clamp(props.glareStrength, 0, 100, 35) / 100,
        "--pc-ink": props.statusStyle === "dark" ? "#000000" : "#ffffff",
        "--pc-radius": `${clamp(props.cornerRadius, 0, 60, 34)}px`,
        "--pc-bezel": props.bezelColor,
        "--pc-accent": props.accent,
        "--pc-bg": props.background,
        "--pc-capsize": `${clamp(props.captionSize, 12, 28, 16)}px`,
        "--pc-speed": `${clamp(props.speed, 100, 1500, 600)}ms`,
        "--pc-interval": `${dwell}ms`,
        "--pc-sdur": `${clamp(props.scrollDuration, 2, 30, 10)}s`,
        ...props.style,
    } as React.CSSProperties

    return (
        <div
            ref={rootRef}
            className="pc"
            data-static={isStatic}
            data-scroll={props.scrollMode}
            data-layout={props.layout}
            data-scroll-run={scrollRun}
            style={vars}
            role={interactive ? "region" : undefined}
            aria-roledescription={interactive ? "carousel" : undefined}
            aria-label={interactive ? "App screens" : undefined}
            onKeyDown={onKeyDown}
            onFocus={interactive ? onFocus : undefined}
            onBlur={interactive ? onBlur : undefined}
            onPointerEnter={
                interactive
                    ? (e) => e.pointerType === "mouse" && setHover(true)
                    : undefined
            }
            onPointerLeave={
                interactive
                    ? (e) => e.pointerType === "mouse" && setHover(false)
                    : undefined
            }
        >
            <style>{CSS}</style>
            <div
                className="pc-frame"
                style={
                    stageBg
                        ? ({ "--pc-stage": stageBg } as React.CSSProperties)
                        : undefined
                }
            >
                <div
                    ref={wrapRef}
                    className="pc-wrap"
                    data-drag={dragging}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={(e) => endDrag(e, false)}
                    onPointerCancel={(e) => endDrag(e, true)}
                    onPointerLeave={fx ? resetFx : undefined}
                >
                    <div
                        ref={stageRef}
                        className="pc-stage"
                        aria-live={playing ? "off" : "polite"}
                        aria-atomic="true"
                    >
                        {slides.map((x, k) => {
                            let rel = mod(k - cur, m)
                            if (rel > m / 2) rel -= m
                            const pos =
                                rel === 0
                                    ? "0"
                                    : Math.abs(rel) <= 2
                                      ? String(rel)
                                      : rel > 0
                                        ? "far-right"
                                        : "far-left"
                            const src = x.s.image?.src
                            return (
                                <div
                                    key={`${x.i}-${x.clone ? "c" : "r"}`}
                                    className="pc-slide"
                                    data-pos={pos}
                                    data-scrolling={
                                        x.s.scrolls ? "true" : undefined
                                    }
                                    role="group"
                                    aria-roledescription="slide"
                                    aria-label={`${x.i + 1} of ${n}`}
                                    aria-hidden={pos === "0" ? undefined : true}
                                    onClick={() => {
                                        if (suppressClick.current) return
                                        if (
                                            pos === "far-left" ||
                                            pos === "far-right"
                                        )
                                            return
                                        if (pos !== "0") userStep(Number(pos))
                                    }}
                                >
                                    <div
                                        className="pc-phone"
                                        data-finish={props.finish}
                                        data-buttons={props.sideButtons}
                                    >
                                        <div className="pc-screen">
                                            {src ? (
                                                x.s.scrolls ? (
                                                    <div className="pc-scroll">
                                                        <img
                                                            ref={fitTall}
                                                            onLoad={(e) =>
                                                                fitTall(
                                                                    e.currentTarget
                                                                )
                                                            }
                                                            src={src}
                                                            srcSet={
                                                                x.s.image
                                                                    ?.srcSet
                                                            }
                                                            alt={
                                                                x.s.alt ||
                                                                x.s.image
                                                                    ?.alt ||
                                                                ""
                                                            }
                                                            loading={
                                                                x.i === 0 &&
                                                                !x.clone
                                                                    ? "eager"
                                                                    : "lazy"
                                                            }
                                                            decoding="async"
                                                            draggable={false}
                                                        />
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={src}
                                                        srcSet={
                                                            x.s.image?.srcSet
                                                        }
                                                        alt={
                                                            x.s.alt ||
                                                            x.s.image?.alt ||
                                                            ""
                                                        }
                                                        loading={
                                                            x.i === 0 &&
                                                            !x.clone
                                                                ? "eager"
                                                                : "lazy"
                                                        }
                                                        decoding="async"
                                                        draggable={false}
                                                    />
                                                )
                                            ) : (
                                                <div className="pc-empty">
                                                    Screen {x.i + 1}
                                                </div>
                                            )}
                                            {props.frame !== "minimal" ? (
                                                <i
                                                    className="pc-cut"
                                                    data-frame={props.frame}
                                                    aria-hidden="true"
                                                />
                                            ) : null}
                                            {props.statusBar ? (
                                                <StatusBar
                                                    time={(
                                                        props.statusTime ||
                                                        "9:41"
                                                    ).slice(0, 8)}
                                                />
                                            ) : null}
                                            {props.homeIndicator ? (
                                                <i
                                                    className="pc-home"
                                                    aria-hidden="true"
                                                />
                                            ) : null}
                                            {props.glare ? (
                                                <i
                                                    className="pc-glare"
                                                    aria-hidden="true"
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {interactive && props.showArrows ? (
                        <>
                            <button
                                type="button"
                                className="pc-arrow"
                                data-dir="prev"
                                aria-label="Previous screen"
                                onClick={() => userStep(-1)}
                            >
                                <Chevron dir="prev" />
                            </button>
                            <button
                                type="button"
                                className="pc-arrow"
                                data-dir="next"
                                aria-label="Next screen"
                                onClick={() => userStep(1)}
                            >
                                <Chevron dir="next" />
                            </button>
                        </>
                    ) : null}
                </div>
                {hasCaptions ? (
                    <p
                        className="pc-caption"
                        aria-live={playing ? "off" : "polite"}
                    >
                        <span key={cur}>{slides[cur].s.caption}</span>
                    </p>
                ) : null}
                {interactive &&
                ((canPlay && props.showPause) || props.showDots) ? (
                    <div className="pc-controls">
                        {canPlay && props.showPause ? (
                            <button
                                type="button"
                                className="pc-pause"
                                aria-label={
                                    userPaused
                                        ? "Play auto-swipe"
                                        : "Pause auto-swipe"
                                }
                                onClick={toggleAuto}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 14 14"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    {userPaused ? (
                                        <path d="M3.5 2.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L4.4 1.7a.6.6 0 0 0-.9.5Z" />
                                    ) : (
                                        <>
                                            <rect
                                                x="2.5"
                                                y="2"
                                                width="3"
                                                height="10"
                                                rx="1"
                                            />
                                            <rect
                                                x="8.5"
                                                y="2"
                                                width="3"
                                                height="10"
                                                rx="1"
                                            />
                                        </>
                                    )}
                                </svg>
                            </button>
                        ) : null}
                        {props.showDots ? (
                            <div
                                className="pc-dots"
                                role="group"
                                aria-label="Choose screen"
                            >
                                {items.map((_, j) => (
                                    <button
                                        key={j}
                                        type="button"
                                        className="pc-dot"
                                        aria-label={`Go to screen ${j + 1} of ${n}`}
                                        aria-current={
                                            j === dot ? "true" : undefined
                                        }
                                        data-active={j === dot}
                                        data-playing={j === dot && playing}
                                        onClick={() => goToDot(j)}
                                    >
                                        <span />
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}

PhoneCarousel.displayName = "Phone Carousel"

PhoneCarousel.defaultProps = {
    screens: [{}, {}, {}],
    preset: "custom",
    layout: "coverflow",
    captionSize: 16,
    autoPlay: true,
    interval: 4000,
    showPause: true,
    showArrows: true,
    showDots: true,
    frame: "island",
    finish: "matte",
    bezelColor: "#17171a",
    bezelWidth: 10,
    cornerRadius: 34,
    sideButtons: true,
    statusBar: false,
    statusTime: "9:41",
    statusStyle: "light",
    homeIndicator: false,
    tilt: true,
    tiltAmount: 8,
    glare: true,
    glareStrength: 35,
    scrollMode: "auto",
    scrollDuration: 10,
    phoneWidth: 240,
    accent: "#111111",
    background: "#f4f4f2",
    speed: 600,
}

addPropertyControls(PhoneCarousel, {
    screens: {
        type: ControlType.Array,
        title: "Screens",
        defaultValue: [{}, {}, {}],
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: {
                    type: ControlType.String,
                    title: "Alt text",
                    placeholder: "Describe this screen",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    placeholder: "Shown under the phones",
                    displayTextArea: true,
                },
                customBg: {
                    type: ControlType.Boolean,
                    title: "Custom background",
                    defaultValue: false,
                    description:
                        "Turn on to change the background color while this screen is active.",
                },
                bg: {
                    type: ControlType.Color,
                    title: "Screen color",
                    defaultValue: "#f4f4f2",
                    description: "Used only when Custom background is on.",
                },
                scrolls: {
                    type: ControlType.Boolean,
                    title: "Tall screenshot",
                    defaultValue: false,
                    description:
                        "Scrolls inside the phone. Use a full-length screenshot, same width as the phone.",
                },
            },
        },
        description: "Use portrait screenshots, about 9:19.5 (e.g. 1170×2532).",
    },
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["custom", "minimal", "soft", "glass", "bold"],
        optionTitles: ["Custom", "Minimal", "Soft", "Glass", "Bold"],
        defaultValue: "custom",
        description:
            "A ready-made look. Choose Custom to adjust the frame, colors and glare yourself.",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["coverflow", "fan", "stack"],
        optionTitles: ["Coverflow", "Fan", "Stack"],
        defaultValue: "coverflow",
    },
    captionSize: {
        type: ControlType.Number,
        title: "Caption size",
        min: 12,
        max: 28,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
    frame: {
        type: ControlType.Enum,
        title: "Frame",
        options: ["island", "notch", "punch", "minimal"],
        optionTitles: ["Dynamic Island", "Notch", "Punch-hole", "Minimal"],
        defaultValue: "island",
        hidden: (p: Props) => p.preset !== "custom",
    },
    finish: {
        type: ControlType.Enum,
        title: "Finish",
        options: ["matte", "titanium"],
        optionTitles: ["Matte", "Titanium"],
        defaultValue: "matte",
        displaySegmentedControl: true,
        hidden: (p: Props) => p.preset !== "custom",
    },
    bezelColor: {
        type: ControlType.Color,
        title: "Bezel",
        defaultValue: "#17171a",
        hidden: (p: Props) => p.preset !== "custom",
    },
    bezelWidth: {
        type: ControlType.Number,
        title: "Bezel width",
        min: 2,
        max: 24,
        step: 1,
        unit: "px",
        defaultValue: 10,
        hidden: (p: Props) => p.preset !== "custom",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner radius",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 34,
        hidden: (p: Props) => p.preset !== "custom",
    },
    sideButtons: {
        type: ControlType.Boolean,
        title: "Side buttons",
        defaultValue: true,
        hidden: (p: Props) => p.preset !== "custom",
    },
    statusBar: {
        type: ControlType.Boolean,
        title: "Status bar",
        defaultValue: false,
        description: "Leave off if your screenshots already include one.",
    },
    statusTime: {
        type: ControlType.String,
        title: "Time",
        defaultValue: "9:41",
        hidden: (p: Props) => !p.statusBar,
    },
    statusStyle: {
        type: ControlType.Enum,
        title: "Status color",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
        hidden: (p: Props) => !p.statusBar,
    },
    homeIndicator: {
        type: ControlType.Boolean,
        title: "Home bar",
        defaultValue: false,
    },
    tilt: {
        type: ControlType.Boolean,
        title: "Tilt",
        defaultValue: true,
        description:
            "The active phone leans toward the mouse. Off for touch, static previews and reduced motion.",
    },
    tiltAmount: {
        type: ControlType.Number,
        title: "Tilt amount",
        min: 0,
        max: 20,
        step: 1,
        unit: "°",
        defaultValue: 8,
        hidden: (p: Props) => !p.tilt,
    },
    glare: {
        type: ControlType.Boolean,
        title: "Glare",
        defaultValue: true,
        description: "A soft highlight on the glass that follows the mouse.",
        hidden: (p: Props) => p.preset !== "custom",
    },
    glareStrength: {
        type: ControlType.Number,
        title: "Glare strength",
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        defaultValue: 35,
        hidden: (p: Props) => p.preset !== "custom" || !p.glare,
    },
    scrollMode: {
        type: ControlType.Enum,
        title: "Scroll",
        options: ["auto", "hover"],
        optionTitles: ["Auto", "Follow mouse"],
        defaultValue: "auto",
        displaySegmentedControl: true,
        description:
            "For screens marked Tall screenshot. Follow mouse scrolls with the pointer, and plays automatically on touch devices.",
    },
    scrollDuration: {
        type: ControlType.Number,
        title: "Scroll time",
        min: 2,
        max: 30,
        step: 1,
        unit: "s",
        defaultValue: 10,
        hidden: (p: Props) => p.scrollMode === "hover",
        description:
            "One full pass down and back. The auto swipe waits for it.",
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto swipe",
        defaultValue: true,
        description: "Always off for visitors who prefer reduced motion.",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        min: 1500,
        max: 12000,
        step: 100,
        unit: "ms",
        defaultValue: 4000,
        hidden: (p: Props) => !p.autoPlay,
    },
    showPause: {
        type: ControlType.Boolean,
        title: "Pause button",
        defaultValue: true,
        hidden: (p: Props) => !p.autoPlay,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
    showDots: { type: ControlType.Boolean, title: "Dots", defaultValue: true },
    phoneWidth: {
        type: ControlType.Number,
        title: "Phone width",
        min: 120,
        max: 480,
        step: 5,
        unit: "px",
        defaultValue: 240,
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#111111",
        description: "Dots, icons and focus ring.",
        hidden: (p: Props) => p.preset !== "custom",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#f4f4f2",
        hidden: (p: Props) => p.preset !== "custom",
    },
    onChange: { type: ControlType.EventHandler },
    onNext: { type: ControlType.EventHandler },
    onPrevious: { type: ControlType.EventHandler },
    onPause: { type: ControlType.EventHandler },
    onPlay: { type: ControlType.EventHandler },
    speed: {
        type: ControlType.Number,
        title: "Glide speed",
        min: 100,
        max: 1500,
        step: 50,
        unit: "ms",
        defaultValue: 600,
        description: CREDIT,
    },
})
