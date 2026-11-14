import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
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


/* ------------------------------------------------------------------ */
/* Types & defaults                                                    */
/* ------------------------------------------------------------------ */

type Align = "top" | "center" | "bottom"
type Easing = "easeOut" | "easeInOut" | "expo" | "linear"

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface MediaItem {
    type?: "image" | "video"
    image?: ImageValue
    video?: string
    poster?: ImageValue
    title?: string
    subtitle?: string
    link?: string
}

interface Slide {
    title: string
    subtitle: string
    href?: string
}

interface PlaybackProps {
    autoplay: boolean
    interval: number
    loop: boolean
    pauseOnHover: boolean
    videos: "visible" | "active"
}

interface MotionProps {
    duration: number
    easing: Easing
}

interface LayoutProps {
    ratio: string
    activeSize: number
    nearSize: number
    farSize: number
    gap: number
    align: Align
    radius: number
    inactiveOpacity: number
}

interface MobileProps {
    breakpoint: number
    activeSize: number
    nearSize: number
    farSize: number
}

type Reveal = "fade" | "rise" | "slide" | "blur" | "stagger" | "cut"
type HoverEffect = "none" | "zoom" | "tint" | "both"
type CursorStyle = "none" | "auto" | "drag" | "view"
type ScrollMode = "off" | "advance" | "scrub"

interface CaptionProps {
    show: boolean
    reveal: Reveal
    revealDistance: number
    lineGap: number
    titleFont: CSSProperties
    titleColor: string
    subtitleFont: CSSProperties
    subtitleColor: string
    gap: number
    align: "left" | "center" | "right"
}

interface ParallaxProps {
    on: boolean
    amount: number
}

interface HoverProps {
    effect: HoverEffect
    zoom: number
    tint: string
    tintOpacity: number
    cursor: CursorStyle
    dragLabel: string
    viewLabel: string
    cursorSize: number
    cursorBg: string
    cursorColor: string
}

interface ScrollProps {
    mode: ScrollMode
    speed: number
}

interface TouchProps {
    threshold: number
    swipeCheck: boolean
}

interface InteractionProps {
    drag: boolean
    clickToFocus: boolean
    keyboard: boolean
    trackpad: boolean
    newTab: boolean
}

interface LoadingProps {
    lazy: boolean
    preload: number
}

interface FocusSlideshowProps {
    source: "manual" | "cms"
    items: MediaItem[]
    cms?: ReactNode
    startIndex: number
    snapping: boolean
    background: string
    playback: Partial<PlaybackProps>
    motion: Partial<MotionProps>
    layout: Partial<LayoutProps>
    tablet: Partial<MobileProps>
    mobile: Partial<MobileProps>
    caption: Partial<CaptionProps>
    parallax: Partial<ParallaxProps>
    hover: Partial<HoverProps>
    scroll: Partial<ScrollProps>
    touch: Partial<TouchProps>
    interaction: Partial<InteractionProps>
    loading: Partial<LoadingProps>
    style?: CSSProperties
}

const DEFAULT_IMAGES = [
    "https://framerusercontent.com/images/jcpAddw1ac6E53CabeggBQ8oFLo.jpg",
    "https://framerusercontent.com/images/ah1CYTvEdYdbLeagcV4hsW3OO4.jpg",
    "https://framerusercontent.com/images/NF5ESAqEMIZbJjc7zlu6lNxrY0.jpg",
    "https://framerusercontent.com/images/mpvJpMQjaRdt9dl8cEFDTBqeQ.jpg",
    "https://framerusercontent.com/images/2bpSuPbJUqCsJkBfV82j3TJuCk.jpg",
    "https://framerusercontent.com/images/wgh3EwmGL9fVQtzceDboPxrSNM.jpg",
]

const DEFAULT_COPY: [string, string][] = [
    ["Harbour Pavilion", "A public room at the water's edge"],
    ["Timber Library", "Reading spaces built from local wood"],
    ["Terrace Gardens", "A network of community spaces and urban farming"],
    ["Mountain Mirror", "A lookout shaped by the landscape"],
    ["Coffee Bar", "Putting the art of brewing centre stage"],
    ["Valley Bridge", "A pedestrian bridge crafted with wonder"],
    ["Opera House", "Connecting performance and public life"],
    ["Annual Report", "Transparency and continuous improvement"],
]

const DEFAULT_ITEMS: MediaItem[] = DEFAULT_COPY.map(([title, subtitle], i) => ({
    type: "image",
    image: { src: DEFAULT_IMAGES[i % DEFAULT_IMAGES.length], alt: title },
    title,
    subtitle,
}))

const PLAYBACK_DEFAULTS: PlaybackProps = {
    autoplay: true,
    interval: 4,
    loop: true,
    pauseOnHover: true,
    videos: "visible",
}
const MOTION_DEFAULTS: MotionProps = { duration: 0.6, easing: "easeOut" }
const LAYOUT_DEFAULTS: LayoutProps = {
    ratio: "3:2",
    activeSize: 36,
    nearSize: 24,
    farSize: 16,
    gap: 0,
    align: "top",
    radius: 0,
    inactiveOpacity: 1,
}
const TABLET_DEFAULTS: MobileProps = {
    breakpoint: 1200,
    activeSize: 50,
    nearSize: 26,
    farSize: 16,
}
const MOBILE_DEFAULTS: MobileProps = {
    breakpoint: 810,
    activeSize: 68,
    nearSize: 50,
    farSize: 50,
}
const TITLE_FONT: CSSProperties = {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 18,
    fontWeight: 300,
    lineHeight: "1.33em",
}
const CAPTION_DEFAULTS: CaptionProps = {
    show: true,
    reveal: "fade",
    revealDistance: 16,
    lineGap: 0,
    titleFont: TITLE_FONT,
    titleColor: "#FFFFFF",
    subtitleFont: TITLE_FONT,
    subtitleColor: "#757575",
    gap: 8,
    align: "left",
}
const INTERACTION_DEFAULTS: InteractionProps = {
    drag: true,
    clickToFocus: true,
    keyboard: true,
    trackpad: true,
    newTab: false,
}
const PARALLAX_DEFAULTS: ParallaxProps = { on: false, amount: 50 }
const HOVER_DEFAULTS: HoverProps = {
    effect: "none",
    zoom: 6,
    tint: "#000000",
    tintOpacity: 0.3,
    cursor: "none",
    dragLabel: "Drag",
    viewLabel: "View",
    cursorSize: 76,
    cursorBg: "#FFFFFF",
    cursorColor: "#000000",
}
const SCROLL_DEFAULTS: ScrollProps = { mode: "off", speed: 1 }
const TOUCH_DEFAULTS: TouchProps = { threshold: 12, swipeCheck: true }
const LOADING_DEFAULTS: LoadingProps = { lazy: true, preload: 4 }

/* Free scrolling (snapping off): how quickly a flick loses speed, and when it counts as stopped. */
const GLIDE_FRICTION = 3.2
const GLIDE_STOP = 0.06

/* ------------------------------------------------------------------ */
/* Math helpers                                                        */
/* ------------------------------------------------------------------ */

const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v))
const mod = (v: number, n: number) => ((v % n) + n) % n
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (t: number) => {
    const x = clamp(t, 0, 1)
    return x * x * (3 - 2 * x)
}

function parseRatio(value: string): number {
    const [a, b] = String(value).split(":").map(Number)
    return a > 0 && b > 0 ? a / b : 3 / 2
}

/* CSS-style cubic bezier easing. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
    const cx = 3 * x1
    const bx = 3 * (x2 - x1) - cx
    const ax = 1 - cx - bx
    const cy = 3 * y1
    const by = 3 * (y2 - y1) - cy
    const ay = 1 - cy - by
    const sx = (s: number) => ((ax * s + bx) * s + cx) * s
    const sy = (s: number) => ((ay * s + by) * s + cy) * s
    const dx = (s: number) => (3 * ax * s + 2 * bx) * s + cx
    return (t: number) => {
        if (t <= 0) return 0
        if (t >= 1) return 1
        let s = t
        for (let i = 0; i < 8; i++) {
            const e = sx(s) - t
            if (Math.abs(e) < 1e-5) break
            const d = dx(s)
            if (Math.abs(d) < 1e-6) break
            s -= e / d
        }
        return sy(clamp(s, 0, 1))
    }
}

const EASINGS: Record<Easing, (t: number) => number> = {
    easeOut: bezier(0.25, 1, 0.5, 1),
    easeInOut: bezier(0.65, 0, 0.35, 1),
    expo: bezier(0.16, 1, 0.3, 1),
    linear: (t) => t,
}

/* ------------------------------------------------------------------ */
/* Layout: every card has a width that depends on its distance from the */
/* centre (active, next to active, further away). Position and width    */
/* are interpolated between those states, so a drag, a flick and an     */
/* autoplay step all move through exactly the same frames.              */
/* ------------------------------------------------------------------ */

interface Layout {
    W: number
    A: number
    N: number
    F: number
    gap: number
    ratio: number
    lefts: number[]
    K: number
    hMax: number
}

function makeLayout(
    W: number,
    active: number,
    near: number,
    far: number,
    gap: number,
    ratio: number
): Layout {
    const A = (W * clamp(active, 4, 100)) / 100
    const N = (W * clamp(near, 4, 100)) / 100
    const F = Math.max(8, (W * clamp(far, 4, 100)) / 100)
    const width = (k: number) => (k <= 0 ? A : k === 1 ? N : F)
    const lefts = [(W - A) / 2]
    let c = 0
    let K = 0
    for (let k = 1; k < 64; k++) {
        c += width(k - 1) / 2 + width(k) / 2 + gap
        lefts.push(W / 2 + c - width(k) / 2)
        if (!K && lefts[k] >= W) K = k
        if (K && k > K) break
    }
    if (!K) K = lefts.length - 2
    return { W, A, N, F, gap, ratio, lefts, K, hMax: A / ratio }
}

interface Frame {
    x: number
    y: number
    w: number
    h: number
    o: number
    hidden: boolean
}

function frameAt(d: number, L: Layout, align: Align, inactive: number): Frame {
    const a = Math.abs(d)
    const k = Math.min(Math.floor(a), L.K)
    const f = a - k
    const wk = (i: number) => (i <= 0 ? L.A : i === 1 ? L.N : L.F)
    const w = lerp(wk(k), wk(k + 1), f)
    let x = lerp(L.lefts[k], L.lefts[k + 1], f)
    if (a > L.K + 1) x = L.lefts[L.K + 1] + (a - L.K - 1) * (L.F + L.gap)
    if (d < 0) x = L.W - x - w
    const h = w / L.ratio
    const y =
        align === "top" ? 0 : align === "center" ? (L.hMax - h) / 2 : L.hMax - h
    return {
        x,
        y,
        w,
        h,
        o: inactive >= 1 ? 1 : lerp(1, inactive, Math.min(a, 1)),
        hidden: x >= L.W + 2 || x + w <= -2,
    }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

const CSS_TEXT = `
.fsl-root:focus-visible{outline:2px solid rgba(70,110,255,.75);outline-offset:-2px}
.fsl-item{display:block;color:inherit;text-decoration:none;-webkit-user-drag:none;user-drag:none}
.fsl-item *{-webkit-user-drag:none;user-drag:none}
.fsl-item img,.fsl-item video{transition:scale .6s cubic-bezier(.2,.8,.2,1)}
.fsl-item::after{content:"";position:absolute;left:0;top:0;right:0;bottom:0;background:var(--fsl-tint,#000);opacity:0;transition:opacity .4s ease;pointer-events:none;z-index:3}
@media (hover:hover){
.fsl-root[data-hz="1"] .fsl-item:hover img,.fsl-root[data-hz="1"] .fsl-item:hover video{scale:var(--fsl-zoom,1.06)}
.fsl-root[data-ht="1"] .fsl-item:hover::after{opacity:var(--fsl-tint-o,.3)}
}
.fsl-root[data-cur="1"],.fsl-root[data-cur="1"] .fsl-item,.fsl-root[data-cur="1"] .fsl-item *{cursor:none!important}
.fsl-cursor{position:absolute;left:0;top:0;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:20;opacity:0;scale:.5;transition:opacity .2s ease,scale .3s cubic-bezier(.2,.8,.2,1);font:500 13px/1 Inter,system-ui,sans-serif;letter-spacing:.02em;white-space:nowrap}
.fsl-cursor[data-on="1"]{opacity:1;scale:1}
.fsl-cursor[data-down="1"]{scale:.82}
.fsl-root[data-click="1"] .fsl-item{cursor:pointer}
.fsl-root[data-click="1"] .fsl-item[data-active="1"]{cursor:default}
.fsl-root[data-link="1"] .fsl-item[data-active="1"]{cursor:pointer}
`

interface DragState {
    id: number
    startX: number
    startY: number
    startPos: number
    wasMoving: boolean
    moved: boolean
    tapSlot: number
    samples: { t: number; v: number }[]
}

/**
 * Focus Slideshow
 *
 * An edge-to-edge slideshow where the centre card grows and its neighbours step down in size.
 *
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 420
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FocusSlideshow(props: FocusSlideshowProps) {
    const {
        source = "manual",
        items = DEFAULT_ITEMS,
        cms,
        startIndex = 1,
        snapping = true,
        background = "#000000",
        style,
    } = props

    const playback: PlaybackProps = { ...PLAYBACK_DEFAULTS, ...props.playback }
    const motion: MotionProps = { ...MOTION_DEFAULTS, ...props.motion }
    const layout: LayoutProps = { ...LAYOUT_DEFAULTS, ...props.layout }
    const tablet: MobileProps = { ...TABLET_DEFAULTS, ...props.tablet }
    const mobile: MobileProps = { ...MOBILE_DEFAULTS, ...props.mobile }
    const captionCfg: CaptionProps = { ...CAPTION_DEFAULTS, ...props.caption }
    const interaction: InteractionProps = {
        ...INTERACTION_DEFAULTS,
        ...props.interaction,
    }
    const loading: LoadingProps = { ...LOADING_DEFAULTS, ...props.loading }
    const parallax: ParallaxProps = { ...PARALLAX_DEFAULTS, ...props.parallax }
    const hover: HoverProps = { ...HOVER_DEFAULTS, ...props.hover }
    const scroll: ScrollProps = { ...SCROLL_DEFAULTS, ...props.scroll }
    const touch: TouchProps = { ...TOUCH_DEFAULTS, ...props.touch }

    const isStatic = useIsStaticRenderer()
    const isCms = source === "cms"

    /* ---------------- measuring ---------------- */
    const rootRef = useRef<HTMLDivElement>(null)
    const cmsStageRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 1440, h: 420, measured: false })

    useIsoLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const w = el.offsetWidth
            const h = el.offsetHeight
            if (!w || !h) return
            setSize((s) =>
                s.measured && s.w === w && s.h === h
                    ? s
                    : { w, h, measured: true }
            )
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    /* ---------------- CMS discovery ---------------- */
    const itemRefs = useRef<(HTMLElement | null)[]>([])
    const capRefs = useRef<(HTMLElement | null)[]>([])
    const titleRefs = useRef<(HTMLElement | null)[]>([])
    const subRefs = useRef<(HTMLElement | null)[]>([])
    const cursorRef = useRef<HTMLDivElement>(null)
    const slidesRef = useRef<Slide[]>([])
    const mediaCache = useRef(new WeakMap<Element, HTMLElement | null>())
    const parallaxOnRef = useRef(false)
    const revealRef = useRef<{ style: Reveal; dist: number }>({
        style: "fade",
        dist: 16,
    })
    const scrollIdleRef = useRef(true)
    const [cmsSlides, setCmsSlides] = useState<Slide[]>([])
    const cmsCount = cmsSlides.length

    // A scan queued while in CMS mode can fire after switching back to Manual; it must never
    // touch the manual cards.
    const isCmsRef = useRef(isCms)
    isCmsRef.current = isCms

    const readSlide = (el: HTMLElement): Slide => {
        // Text in a CMS item becomes the caption (first line = title, second = subtitle).
        const lines: string[] = []
        el.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6").forEach(
            (t) => {
                const text = (t.textContent || "").trim()
                if (!text) return
                lines.push(text)
                const box =
                    (t.closest(
                        "[data-framer-component-type='RichTextContainer']"
                    ) as HTMLElement | null) || t
                box.setAttribute("data-fsl-text", "1")
            }
        )
        const link = el.querySelector("a[href]")
        return {
            title: lines[0] || "",
            subtitle: lines[1] || "",
            href: link?.getAttribute("href") || undefined,
        }
    }

    const discoverCms = () => {
        const stage = cmsStageRef.current
        if (!stage || !isCmsRef.current) return
        // A Collection List renders one container whose direct children are the repeated items,
        // so they share the same layer name / class. Anything else is not treated as a list.
        let el: Element = stage
        while (el.children.length === 1) el = el.children[0]
        let found: HTMLElement[] = []
        if (el !== stage && el.children.length >= 2) {
            const kids = Array.from(el.children) as HTMLElement[]
            const key = (k: HTMLElement) =>
                k.getAttribute("data-framer-name") ||
                String(k.className) ||
                k.tagName
            const first = key(kids[0])
            if (first && kids.every((k) => key(k) === first)) found = kids
        }
        const prev = itemRefs.current
        const same =
            prev.length === found.length &&
            found.every((node, i) => prev[i] === node)
        const slides = found.map(readSlide)
        setCmsSlides((old) =>
            JSON.stringify(old) === JSON.stringify(slides) ? old : slides
        )
        if (same) return
        prev.forEach((node) => {
            if (node && !found.includes(node)) releaseItem(node)
        })
        itemRefs.current = found
        prepareItems()
        applyAll(posRef.current)
    }

    const round = (node: HTMLElement) => {
        node.setAttribute("data-fsl-rad", "1")
        node.style.setProperty("border-radius", "inherit", "important")
    }

    const releaseItem = (el: HTMLElement) => {
        if (el.hasAttribute("data-fsl-manual")) return
        el.classList.remove("fsl-item")
        ;[
            "data-fcs-i",
            "data-fsl-i",
            "data-active",
            "role",
            "aria-roledescription",
            "aria-label",
        ].forEach((a) => el.removeAttribute(a))
        el.querySelectorAll("[data-fsl-fill]").forEach((n) => {
            n.removeAttribute("data-fsl-fill")
            ;(n as HTMLElement).style.removeProperty("width")
            ;(n as HTMLElement).style.removeProperty("height")
        })
        el.querySelectorAll("[data-fsl-rad]").forEach((n) => {
            n.removeAttribute("data-fsl-rad")
            ;(n as HTMLElement).style.removeProperty("border-radius")
        })
        el.querySelectorAll("[data-fsl-text]").forEach((n) => {
            n.removeAttribute("data-fsl-text")
            ;(n as HTMLElement).style.removeProperty("display")
        })
        const st = el.style
        ;[
            "transform",
            "opacity",
            "visibility",
            "pointer-events",
            "position",
            "left",
            "top",
            "width",
            "height",
            "flex",
            "margin",
            "box-sizing",
            "overflow",
            "border-radius",
            "will-change",
        ].forEach((p) => st.removeProperty(p))
    }

    useEffect(() => {
        if (!isCms) {
            setCmsSlides((old) => (old.length ? [] : old))
            return
        }
        const stage = cmsStageRef.current
        if (!stage) return
        let raf = 0
        const schedule = () => {
            if (raf) return
            raf = requestAnimationFrame(() => {
                raf = 0
                discoverCms()
            })
        }
        discoverCms()
        if (typeof MutationObserver === "undefined") return
        // Watch for items being added or removed (and text edits); our own style writes are attributes.
        const mo = new MutationObserver(schedule)
        mo.observe(stage, {
            childList: true,
            subtree: true,
            characterData: true,
        })
        return () => {
            mo.disconnect()
            if (raf) cancelAnimationFrame(raf)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCms])

    const n = isCms ? cmsCount : items.length

    /* ---------------- derived geometry ---------------- */
    // "Below" is exclusive, like Framer's own breakpoints: a 810px wide component is already Tablet and
    // a 1200px wide one is Desktop. Mobile wins over Tablet, which wins over Desktop (the Layout group).
    const isMobile = size.w < mobile.breakpoint
    const isTablet = !isMobile && size.w < tablet.breakpoint
    const bp = isMobile ? mobile : isTablet ? tablet : layout
    const ratio = parseRatio(layout.ratio)
    const L = useMemo(
        () =>
            makeLayout(
                size.w,
                bp.activeSize,
                bp.nearSize,
                bp.farSize,
                layout.gap,
                ratio
            ),
        [size.w, bp.activeSize, bp.nearSize, bp.farSize, layout.gap, ratio]
    )

    const loopOn = playback.loop && n >= (isCms ? 3 : 2)
    // Manual slides are repeated until the track is full, so a short list still loops seamlessly.
    const reps =
        !isCms && loopOn
            ? clamp(Math.ceil((2 * L.K + 2) / Math.max(1, n)), 1, 6)
            : 1
    const nr = n * reps

    interface Geo {
        n: number
        nr: number
        loop: boolean
        L: Layout
        align: Align
        inactive: number
        parallax: number
    }
    const geo: Geo = {
        n,
        nr,
        loop: loopOn,
        L,
        align: layout.align,
        inactive: clamp(layout.inactiveOpacity, 0, 1),
        parallax: parallax.on
            ? (clamp(parallax.amount, 0, 100) / 100) * 0.1
            : 0,
    }
    revealRef.current = {
        style: captionCfg.reveal,
        dist: captionCfg.revealDistance,
    }

    /* ---------------- engine state (refs only: no re-render per frame) ---------------- */
    const initial = clamp(startIndex - 1, 0, Math.max(0, n - 1))
    const posRef = useRef(initial)
    const targetRef = useRef(initial)
    const velRef = useRef(0)
    const modeRef = useRef<"idle" | "tween" | "drag" | "glide" | "follow">(
        "idle"
    )
    const tweenRef = useRef<{
        from: number
        to: number
        t0: number
        dur: number
        ease: (t: number) => number
    } | null>(null)
    const rafRef = useRef(0)
    const lastFrameRef = useRef(0)
    const draggingRef = useRef(false)
    const scrubRef = useRef(false)
    const suppressClickRef = useRef(false)
    const hoverRef = useRef(false)
    const inViewRef = useRef(true)
    const lastActionRef = useRef(0)
    const dirRef = useRef(1)
    const activeRef = useRef(initial)
    const dragRef = useRef<DragState | null>(null)

    const geoRef = useRef(geo)
    const motionRef = useRef(motion)
    const snapRef = useRef(snapping)
    const pitchRef = useRef(1)
    geoRef.current = geo
    motionRef.current = motion
    snapRef.current = snapping
    pitchRef.current = Math.max(60, (L.A + L.N) / 2 + L.gap)

    const [active, setActive] = useState(initial)
    const [inView, setInView] = useState(true)

    const signedDistance = (k: number, pos: number, g: Geo) => {
        let d = k - pos
        if (g.loop) d -= g.nr * Math.round(d / g.nr)
        return d
    }

    const getMedia = (el: HTMLElement): HTMLElement | null => {
        let m = mediaCache.current.get(el)
        if (!m || !m.isConnected) {
            m = el.querySelector("img, video") as HTMLElement | null
            mediaCache.current.set(el, m)
        }
        return m
    }

    const applyAll = (pos: number) => {
        const g = geoRef.current
        if (!g.nr) return
        const list = itemRefs.current
        for (let k = 0; k < g.nr; k++) {
            const el = list[k]
            if (!el) continue
            const d = signedDistance(k, pos, g)
            const f = frameAt(d, g.L, g.align, g.inactive)
            const st = el.style
            st.width = `${f.w.toFixed(2)}px`
            st.height = `${f.h.toFixed(2)}px`
            st.transform = `translate3d(${f.x.toFixed(2)}px, ${f.y.toFixed(2)}px, 0)`
            st.opacity = f.o >= 1 ? "" : f.o.toFixed(3)
            st.visibility = f.hidden ? "hidden" : "visible"
            st.pointerEvents = f.hidden ? "none" : ""
            if (g.parallax > 0 && !f.hidden) {
                // the photo drifts against the card's movement, over-scaled so its edges never show
                const m = getMedia(el)
                if (m) {
                    const dd = clamp(d, -1.5, 1.5)
                    m.style.transform = `translate3d(${(-dd * g.parallax * f.w).toFixed(2)}px, 0, 0) scale(${(1 + 3 * g.parallax).toFixed(4)})`
                }
            }
        }
        if (g.parallax > 0) parallaxOnRef.current = true
        else if (parallaxOnRef.current) {
            parallaxOnRef.current = false
            for (let k = 0; k < g.nr; k++) {
                const el = list[k]
                const m = el ? getMedia(el) : null
                if (m) m.style.transform = ""
            }
        }
        // Captions follow the cards: each one reveals as its card arrives and hides as it leaves.
        const caps = capRefs.current
        const { style: reveal, dist } = revealRef.current
        for (let i = 0; i < g.n; i++) {
            const el = caps[i]
            if (!el) continue
            let d = i - pos
            if (g.loop) d -= g.n * Math.round(d / g.n)
            const a = Math.abs(d)
            const side = d >= 0 ? 1 : -1
            const base =
                reveal === "cut"
                    ? a < 0.5
                        ? 1
                        : 0
                    : 1 - smoothstep((a - 0.1) / 0.6)
            // stagger: the subtitle arrives a beat after the title and leaves a beat before it
            const sub = reveal === "stagger" ? 1 - smoothstep(a / 0.42) : base
            el.style.pointerEvents = base > 0.6 ? "auto" : "none"
            const lines: [HTMLElement | null, number][] = [
                [titleRefs.current[i], base],
                [subRefs.current[i], sub],
            ]
            for (const [line, o] of lines) {
                if (!line) continue
                const e = 1 - o
                const ls = line.style
                ls.opacity = o.toFixed(3)
                ls.transform =
                    reveal === "rise" || reveal === "stagger"
                        ? `translate3d(0, ${(side * e * dist).toFixed(1)}px, 0)`
                        : reveal === "slide"
                          ? `translate3d(${(side * e * dist).toFixed(1)}px, 0, 0)`
                          : ""
                ls.filter =
                    reveal === "blur" ? `blur(${(e * 6).toFixed(2)}px)` : ""
            }
        }
    }

    const activeIndexFor = (pos: number) => {
        const g = geoRef.current
        return g.loop
            ? mod(Math.round(pos), g.n)
            : clamp(Math.round(pos), 0, g.n - 1)
    }

    const markActive = (idx: number) => {
        const g = geoRef.current
        for (let k = 0; k < g.nr; k++) {
            const el = itemRefs.current[k]
            if (!el) continue
            if (k % g.n === idx) el.setAttribute("data-active", "1")
            else el.removeAttribute("data-active")
        }
    }

    const syncActive = (pos: number) => {
        const g = geoRef.current
        if (!g.n) return
        const idx = activeIndexFor(pos)
        if (idx !== activeRef.current) {
            activeRef.current = idx
            markActive(idx)
            startTransition(() => setActive(idx))
        }
    }

    const constrain = (t: number) => {
        const g = geoRef.current
        return g.loop ? t : clamp(t, 0, Math.max(0, g.n - 1))
    }

    const settle = (pos: number) => {
        const g = geoRef.current
        let x = pos
        if (g.loop && g.nr) {
            // keep numbers small: shift by a whole number of laps
            const shift = g.nr * Math.floor(x / g.nr)
            x -= shift
        }
        posRef.current = x
        targetRef.current = x
        velRef.current = 0
        tweenRef.current = null
        modeRef.current = "idle"
        applyAll(x)
        syncActive(x)
    }

    const tickRef = useRef<(now: number) => void>(() => {})
    tickRef.current = (now: number) => {
        rafRef.current = 0
        const mode = modeRef.current
        if (mode === "tween" && tweenRef.current) {
            const tw = tweenRef.current
            const p = clamp((now - tw.t0) / (tw.dur * 1000), 0, 1)
            posRef.current = lerp(tw.from, tw.to, tw.ease(p))
            applyAll(posRef.current)
            syncActive(posRef.current)
            if (p >= 1) settle(tw.to)
            else schedule()
        } else if (mode === "follow") {
            // scroll-linked: ease toward where the page scroll says we should be
            const last = lastFrameRef.current || now
            lastFrameRef.current = now
            const dt = clamp((now - last) / 1000, 0, 1 / 20)
            const target = targetRef.current
            const x =
                posRef.current +
                (target - posRef.current) * (1 - Math.exp(-dt * 10))
            posRef.current = x
            applyAll(x)
            syncActive(x)
            if (Math.abs(target - x) < 0.0008 && scrollIdleRef.current) {
                posRef.current = target
                release(0)
            } else schedule()
        } else if (mode === "glide") {
            const last = lastFrameRef.current || now
            lastFrameRef.current = now
            const dt = clamp((now - last) / 1000, 0, 1 / 20)
            let v = velRef.current
            let x = posRef.current + v * dt
            v *= Math.exp(-GLIDE_FRICTION * dt)
            const g = geoRef.current
            if (!g.loop && (x < 0 || x > g.n - 1)) {
                // ran past the end: ease back to the edge
                posRef.current = x
                goTo(constrain(x))
                return
            }
            posRef.current = x
            velRef.current = v
            targetRef.current = x
            applyAll(x)
            syncActive(x)
            if (Math.abs(v) < GLIDE_STOP) settle(x)
            else schedule()
        }
    }

    const schedule = () => {
        if (typeof window === "undefined" || rafRef.current) return
        rafRef.current = requestAnimationFrame((t) => tickRef.current(t))
    }

    const goTo = (t: number) => {
        const target = constrain(t)
        const from = posRef.current
        lastActionRef.current =
            typeof performance !== "undefined" ? performance.now() : 0
        targetRef.current = target
        if (Math.abs(target - from) < 1e-4) {
            settle(target)
            return
        }
        const m = motionRef.current
        const dur =
            Math.max(0.05, m.duration) *
            clamp(Math.sqrt(Math.abs(target - from)), 0.5, 1.8)
        tweenRef.current = {
            from,
            to: target,
            t0: performance.now(),
            dur,
            ease: EASINGS[m.easing] || EASINGS.easeOut,
        }
        modeRef.current = "tween"
        velRef.current = 0
        schedule()
    }

    /* Nearest equivalent target for slot k (wraps around the track). */
    const targetForSlot = (k: number) => {
        const g = geoRef.current
        const d = signedDistance(k, posRef.current, g)
        return Math.round(posRef.current + d)
    }

    const step = (dir: number) => goTo(Math.round(targetRef.current) + dir)

    /* A drag/scroll ended: snap to a card, or let it coast to rest where it falls. */
    const release = (velocity: number) => {
        const g = geoRef.current
        if (snapRef.current) {
            goTo(Math.round(posRef.current + clamp(velocity * 0.12, -1, 1)))
            return
        }
        const out = !g.loop && (posRef.current < 0 || posRef.current > g.n - 1)
        if (out) {
            goTo(constrain(posRef.current))
        } else if (Math.abs(velocity) > 0.3) {
            velRef.current = clamp(velocity, -7, 7)
            modeRef.current = "glide"
            lastFrameRef.current = 0
            schedule()
        } else {
            settle(posRef.current)
        }
    }

    /* ---------------- static styling for every item ---------------- */
    const prepareItems = () => {
        const g = geoRef.current
        const list = itemRefs.current
        if (isCmsRef.current) {
            const container = list[0] && list[0].parentElement
            const stage = cmsStageRef.current
            if (container && stage && container !== stage) {
                // Break the list out of its flex layout so every item can be placed on the track.
                let el: HTMLElement | null = container
                while (el && el !== stage) {
                    el.style.overflow = "visible"
                    el = el.parentElement
                }
                const cs = container.style
                cs.display = "block"
                cs.position = "absolute"
                cs.left = "0px"
                cs.top = "0px"
                cs.width = "0px"
                cs.height = "0px"
                cs.padding = "0px"
                cs.margin = "0px"
                cs.gap = "0px"
            }
        }
        for (let i = 0; i < g.nr; i++) {
            const el = list[i]
            if (!el) continue
            const st = el.style
            if (isCmsRef.current) {
                el.classList.add("fsl-item")
                el.setAttribute("data-fsl-i", String(i))
                el.setAttribute("role", "group")
                el.setAttribute("aria-roledescription", "slide")
                el.setAttribute("aria-label", `${i + 1} of ${g.n}`)
                st.position = "absolute"
                st.left = "0px"
                st.top = "0px"
                st.flex = "none"
                st.margin = "0px"
                st.boxSizing = "border-box"
                st.overflow = "hidden"
                st.willChange = "transform"
                el.querySelectorAll("a, img").forEach((a) =>
                    a.setAttribute("draggable", "false")
                )
                // Make the media fill the card: stretch each frame between the item and its image/video.
                const media = el.querySelector("img, video")
                // The card's corner radius is the component's: frames and the image inside the CMS item
                // follow the card instead of keeping a radius of their own.
                if (media) round(media as HTMLElement)
                let inner = media ? media.parentElement : null
                while (inner && inner !== el) {
                    round(inner as HTMLElement)
                    if (
                        !inner.hasAttribute(
                            "data-framer-background-image-wrapper"
                        )
                    ) {
                        inner.setAttribute("data-fsl-fill", "1")
                        inner.style.width = "100%"
                        inner.style.height = "100%"
                        if (getComputedStyle(inner).display === "inline")
                            inner.style.display = "block"
                    }
                    inner = inner.parentElement
                }
                // CMS text becomes the caption underneath, so it is hidden on the card itself.
                el.querySelectorAll<HTMLElement>("[data-fsl-text]").forEach(
                    (t) => {
                        t.style.display = captionShown ? "none" : ""
                    }
                )
            }
            st.setProperty("border-radius", `${layout.radius}px`, "important")
        }
        markActive(activeRef.current)
    }

    const captionShown = captionCfg.show

    useIsoLayoutEffect(() => {
        if (isCms) discoverCms()
        itemRefs.current.length = isCms ? n : nr
        prepareItems()
        applyAll(posRef.current)
    })

    /* Clean up loops. */
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = 0
        }
    }, [])

    /* Re-clamp when the number of slides (or loop mode) changes. */
    const sawItemsRef = useRef(false)
    useEffect(() => {
        if (!n) return
        if (!sawItemsRef.current) {
            // first time slides exist (CMS items arrive asynchronously)
            sawItemsRef.current = true
            const idx = clamp(startIndex - 1, 0, n - 1)
            posRef.current = idx
            targetRef.current = idx
            activeRef.current = idx
            setActive(idx)
        } else {
            posRef.current = constrain(posRef.current)
            targetRef.current = constrain(targetRef.current)
        }
        syncActive(posRef.current)
        applyAll(posRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [n, loopOn])

    /* "Start Item" changes animate to the new slide (handy while designing). */
    const startRef = useRef(startIndex)
    useEffect(() => {
        if (startRef.current === startIndex) return
        startRef.current = startIndex
        if (!n) return
        const idx = clamp(startIndex - 1, 0, n - 1)
        const g = geoRef.current
        let t = idx
        if (g.loop) {
            const base = Math.round(targetRef.current)
            let d = idx - mod(base, g.n)
            if (d > g.n / 2) d -= g.n
            if (d < -g.n / 2) d += g.n
            t = base + d
        }
        goTo(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startIndex])

    /* Only animate / play while on screen. */
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([entry]) => {
            inViewRef.current = entry.isIntersecting
            startTransition(() => setInView(entry.isIntersecting))
        })
        io.observe(el)
        return () => io.disconnect()
    }, [])

    /* Autoplay. */
    useEffect(() => {
        if (!playback.autoplay || isStatic || n < 2 || scroll.mode === "scrub")
            return
        if (
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
            return
        const every = Math.max(1, playback.interval) * 1000
        lastActionRef.current = performance.now()
        const id = window.setInterval(() => {
            const now = performance.now()
            const paused =
                draggingRef.current ||
                scrubRef.current ||
                (hoverRef.current && playback.pauseOnHover) ||
                !inViewRef.current ||
                document.hidden
            if (paused) {
                lastActionRef.current = now
                return
            }
            if (now - lastActionRef.current < every) return
            const g = geoRef.current
            const base = Math.round(targetRef.current)
            if (g.loop) goTo(base + 1)
            else {
                let dir = dirRef.current
                if (base + dir > g.n - 1 || base + dir < 0) dir = -dir
                dirRef.current = dir
                goTo(base + dir)
            }
        }, 200)
        return () => window.clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        playback.autoplay,
        playback.interval,
        playback.pauseOnHover,
        isStatic,
        n,
        scroll.mode,
    ])

    /* Videos: either every card on the track plays, or only the active one (which then starts from the beginning). */
    useEffect(() => {
        const activeOnly = playback.videos === "active"
        for (let k = 0; k < nr; k++) {
            const el = itemRefs.current[k]
            const v = el
                ? (el.querySelector("video") as HTMLVideoElement | null)
                : null
            if (!v) continue
            const d = Math.abs(
                signedDistance(k, posRef.current, geoRef.current)
            )
            const isActive = n ? k % n === active : false
            v.muted = true
            const shouldPlay =
                !isStatic && inView && (activeOnly ? isActive : d <= L.K)
            if (shouldPlay) {
                if (activeOnly && v.getAttribute("data-fsl-on") !== "1")
                    v.currentTime = 0
                v.setAttribute("data-fsl-on", "1")
                const p = v.play()
                if (p && typeof p.catch === "function") p.catch(() => {})
            } else {
                v.removeAttribute("data-fsl-on")
                v.pause()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, nr, inView, isStatic, items, cmsCount, L.K, playback.videos])

    /* ---------------- dragging ---------------- */
    const rubber = (x: number) => {
        const g = geoRef.current
        if (g.loop) return x
        const max = Math.max(0, g.n - 1)
        if (x < 0) return x * 0.35
        if (x > max) return max + (x - max) * 0.35
        return x
    }

    const slotOf = (target: EventTarget | null) => {
        const hit = (target as HTMLElement | null)?.closest?.(
            "[data-fsl-i]"
        ) as HTMLElement | null
        return hit ? Number(hit.getAttribute("data-fsl-i")) : -1
    }

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (isStatic || n < 2) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        dragRef.current = {
            id: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startPos: posRef.current,
            wasMoving: modeRef.current !== "idle",
            moved: false,
            tapSlot: slotOf(e.target),
            samples: [],
        }
    }

    /* The custom "Drag" / "View" cursor follows the mouse, and its label depends on the card underneath. */
    const updateCursor = (
        e: ReactPointerEvent<HTMLDivElement>,
        leaving = false
    ) => {
        const c = cursorRef.current
        const root = rootRef.current
        if (!c || !root || e.pointerType !== "mouse") return
        const mode = hover.cursor
        if (mode === "none" || isStatic) return
        const slot = leaving ? -1 : slotOf(e.target)
        const idx = slot >= 0 && n ? slot % n : -1
        const dragging = draggingRef.current
        let label = ""
        if (dragging && !leaving) label = hover.dragLabel
        else if (idx >= 0) {
            const linked = !!slidesRef.current[idx]?.href
            if (mode === "view") label = hover.viewLabel
            else if (mode === "drag") label = hover.dragLabel
            else
                label =
                    idx === activeRef.current && linked
                        ? hover.viewLabel
                        : hover.dragLabel
        }
        const on = !!label
        if (on) {
            // only move while visible: when it fades out it stays where it was, and when it comes
            // back it appears at the pointer instead of sliding in from the old spot
            const rect = root.getBoundingClientRect()
            const sx = root.offsetWidth ? rect.width / root.offsetWidth : 1
            // the individual `translate` property is applied outside `scale`, so shrinking never drags the cursor sideways
            c.style.translate = `${(e.clientX - rect.left) / sx}px ${(e.clientY - rect.top) / sx}px`
            if (c.textContent !== label) c.textContent = label
        }
        c.setAttribute("data-on", on ? "1" : "0")
        c.setAttribute("data-down", dragging ? "1" : "0")
        root.setAttribute("data-cur", on ? "1" : "0")
    }

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        updateCursor(e)
        const root = rootRef.current
        const d = dragRef.current
        if (!root || !d || e.pointerId !== d.id) return
        const rect = root.getBoundingClientRect()
        const screenScale = root.offsetWidth ? rect.width / root.offsetWidth : 1
        const dx = (e.clientX - d.startX) / (screenScale || 1)
        if (!d.moved) {
            if (!interaction.drag) return
            if (e.pointerType === "mouse") {
                if (Math.abs(dx) < 6) return
            } else {
                // touch / pen: a larger threshold, and the gesture has to be mostly sideways,
                // otherwise it is a page scroll and we step aside
                const dy = (e.clientY - d.startY) / (screenScale || 1)
                const adx = Math.abs(dx)
                const ady = Math.abs(dy)
                const limit = Math.max(6, touch.threshold)
                if (touch.swipeCheck && ady > limit * 0.6 && ady > adx) {
                    dragRef.current = null
                    return
                }
                if (adx < limit || (touch.swipeCheck && adx < ady * 1.2)) return
            }
            d.moved = true
            draggingRef.current = true
            suppressClickRef.current = true
            tweenRef.current = null
            modeRef.current = "drag"
            // grabbing a moving track: continue from where it is, so the cards never jump
            if (d.wasMoving) {
                d.startPos = posRef.current
                d.startX = e.clientX
            }
            try {
                root.setPointerCapture(e.pointerId)
            } catch (err) {
                /* pointer already released */
            }
            root.style.cursor = "grabbing"
            cursorRef.current?.setAttribute("data-down", "1")
            if (d.wasMoving) return
        }
        const pos = rubber(d.startPos - dx / pitchRef.current)
        posRef.current = pos
        targetRef.current = pos
        const now = performance.now()
        d.samples.push({ t: now, v: pos })
        while (d.samples.length > 2 && now - d.samples[0].t > 120)
            d.samples.shift()
        lastActionRef.current = now
        applyAll(pos)
        syncActive(pos)
    }

    const endDrag = (
        e: ReactPointerEvent<HTMLDivElement>,
        cancelled: boolean
    ) => {
        const d = dragRef.current
        const root = rootRef.current
        if (!d || e.pointerId !== d.id) return
        dragRef.current = null
        if (d.moved) {
            draggingRef.current = false
            window.setTimeout(() => {
                suppressClickRef.current = false
            }, 80)
            if (root) root.style.cursor = interaction.drag ? "grab" : "default"
            cursorRef.current?.setAttribute("data-down", "0")
            let v = 0
            if (!cancelled && d.samples.length > 1) {
                const a = d.samples[0]
                const b = d.samples[d.samples.length - 1]
                const dt = (b.t - a.t) / 1000
                if (dt > 0.01) v = (b.v - a.v) / dt
            }
            release(v)
        } else if (!cancelled && d.tapSlot >= 0 && interaction.clickToFocus) {
            const target = targetForSlot(d.tapSlot)
            if (target !== Math.round(targetRef.current)) goTo(target)
        }
    }

    /* Scroll-linked: "advance" steps the slides as the page scrolls, "scrub" ties them to the component's place on screen. */
    useEffect(() => {
        if (scroll.mode === "off" || isStatic || n < 2) return
        const el = rootRef.current
        if (!el) return
        let last = window.scrollY
        let timer = 0
        const onScroll = () => {
            const y = window.scrollY
            const dy = y - last
            last = y
            if (!inViewRef.current || draggingRef.current) return
            let t: number
            if (scroll.mode === "advance") {
                if (!dy) return
                t = targetRef.current + (dy / 420) * scroll.speed
            } else {
                const rect = el.getBoundingClientRect()
                const vh = window.innerHeight || 1
                const p = clamp((vh - rect.top) / (vh + rect.height), 0, 1)
                t = p * (geoRef.current.n - 1) * scroll.speed
            }
            if (modeRef.current !== "follow") {
                tweenRef.current = null
                modeRef.current = "follow"
                lastFrameRef.current = 0
            }
            targetRef.current = constrain(t)
            scrollIdleRef.current = false
            lastActionRef.current = performance.now()
            schedule()
            window.clearTimeout(timer)
            timer = window.setTimeout(() => {
                scrollIdleRef.current = true
                schedule()
            }, 160)
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        if (scroll.mode === "scrub") onScroll()
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scroll.mode, scroll.speed, isStatic, n])

    /* Trackpad / sideways wheel. */
    useEffect(() => {
        const el = rootRef.current
        if (!el || !interaction.trackpad || isStatic || n < 2) return
        let timer = 0
        const onWheel = (e: WheelEvent) => {
            if (draggingRef.current) return
            const ax = Math.abs(e.deltaX)
            const ay = Math.abs(e.deltaY)
            if (ax < 1 || ax <= ay * 1.2) return // vertical scrolling stays with the page
            e.preventDefault()
            const dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX
            if (!scrubRef.current) {
                scrubRef.current = true
                tweenRef.current = null
                modeRef.current = "drag"
            }
            const pos = constrain(
                posRef.current + (dx / pitchRef.current) * 0.9
            )
            posRef.current = pos
            targetRef.current = pos
            lastActionRef.current = performance.now()
            applyAll(pos)
            syncActive(pos)
            window.clearTimeout(timer)
            timer = window.setTimeout(() => {
                scrubRef.current = false
                release(0)
            }, 140)
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            el.removeEventListener("wheel", onWheel)
            window.clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interaction.trackpad, isStatic, n])

    /* Only the centre card follows its link, and never straight after a drag. */
    const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
        const slot = slotOf(e.target)
        if (slot < 0) return
        const isActive = slot % Math.max(1, n) === activeRef.current
        if (
            suppressClickRef.current ||
            (!isActive && interaction.clickToFocus)
        ) {
            e.preventDefault()
            e.stopPropagation()
        }
    }

    const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!interaction.keyboard || n < 2) return
        if (e.key === "ArrowRight" || e.key === "ArrowDown") step(1)
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") step(-1)
        else if (e.key === "Home" && !loopOn) goTo(0)
        else if (e.key === "End" && !loopOn) goTo(n - 1)
        else return
        e.preventDefault()
    }

    /* ---------------- lazy loading (manual media) ---------------- */
    const loadedRef = useRef(new Set<number>())
    const nearby = Math.max(loading.preload, L.K + 1)
    const isNear = (i: number) => {
        let dist = Math.abs(i - active)
        if (loopOn) dist = Math.min(mod(i - active, n), mod(active - i, n))
        return dist <= nearby
    }

    /* ---------------- render ---------------- */
    const rootVars = {
        "--fsl-zoom": String(1 + clamp(hover.zoom, 0, 40) / 100),
        "--fsl-tint": hover.tint,
        "--fsl-tint-o": String(clamp(hover.tintOpacity, 0, 1)),
    } as CSSProperties
    const rootStyle: CSSProperties = {
        ...style,
        position: "relative",
        overflow: "hidden",
        background,
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "pan-y",
        outline: "none",
        cursor: interaction.drag && n > 1 && !isStatic ? "grab" : "default",
        ...rootVars,
    }

    const rootData = {
        "data-click": interaction.clickToFocus ? "1" : "0",
        "data-link": "1",
        "data-hz":
            hover.effect === "zoom" || hover.effect === "both" ? "1" : "0",
        "data-ht":
            hover.effect === "tint" || hover.effect === "both" ? "1" : "0",
    }

    if (!isCms && !n) {
        return (
            <div
                ref={rootRef}
                style={{
                    ...rootStyle,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(128,128,128,0.9)",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 14,
                    cursor: "default",
                }}
            >
                Add images or videos in the properties panel
            </div>
        )
    }

    const slides: Slide[] = isCms
        ? cmsSlides
        : items.map((item, i) => ({
              title: item.title ?? "",
              subtitle: item.subtitle ?? "",
              href: item.link,
          }))

    slidesRef.current = slides
    const stageVisible = size.measured && (!isCms || n > 0)
    const mediaStyle: CSSProperties = {
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
    }

    const renderMedia = (item: MediaItem, idx: number): ReactNode => {
        const near = !loading.lazy || isNear(idx)
        if (near) loadedRef.current.add(idx)
        const mount = !loading.lazy || loadedRef.current.has(idx)
        if (item.type === "video" && item.video) {
            return mount ? (
                <video
                    src={
                        item.video.includes("#")
                            ? item.video
                            : `${item.video}#t=0.001`
                    }
                    poster={item.poster?.src}
                    muted
                    loop
                    playsInline
                    preload="auto"
                    draggable={false}
                    style={mediaStyle}
                />
            ) : item.poster?.src ? (
                <img
                    src={item.poster.src}
                    alt=""
                    draggable={false}
                    style={mediaStyle}
                />
            ) : null
        }
        // ResponsiveImage controls can't carry defaults, so empty slots fall back to the starter images.
        const image: ImageValue = item.image?.src
            ? item.image
            : {
                  src: DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length],
                  alt: item.title || `Slide ${idx + 1}`,
              }
        return mount && image.src ? (
            <img
                src={image.src}
                srcSet={image.srcSet}
                sizes={`${Math.round(L.A)}px`}
                alt={image.alt || ""}
                decoding="async"
                draggable={false}
                style={mediaStyle}
            />
        ) : null
    }

    const itemStyle: CSSProperties = {
        position: "absolute",
        left: 0,
        top: 0,
        overflow: "hidden",
        borderRadius: layout.radius,
        background: "rgba(128, 128, 128, 0.16)",
        willChange: "transform",
        visibility: "hidden",
    }

    const target = interaction.newTab ? "_blank" : undefined
    const rel = interaction.newTab ? "noopener noreferrer" : undefined
    const capTop = L.hMax + captionCfg.gap

    return (
        <div
            ref={rootRef}
            className="fsl-root"
            role="region"
            aria-roledescription="carousel"
            aria-label="Slideshow"
            tabIndex={interaction.keyboard && n > 1 ? 0 : -1}
            onKeyDown={onKeyDown}
            onClickCapture={onClickCapture}
            onDragStart={(e) => e.preventDefault()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endDrag(e, false)}
            onPointerCancel={(e) => endDrag(e, true)}
            onPointerEnter={(e) => {
                if (e.pointerType === "mouse") hoverRef.current = true
            }}
            onPointerLeave={(e) => {
                hoverRef.current = false
                updateCursor(e, true)
            }}
            style={rootStyle}
            {...rootData}
        >
            <style>{CSS_TEXT}</style>

            {/* Track: cards are positioned from the centre, top aligned */}
            <div
                ref={cmsStageRef}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    visibility: stageVisible ? "visible" : "hidden",
                }}
            >
                {isCms
                    ? cms
                    : Array.from({ length: nr }).map((_, k) => {
                          const idx = k % n
                          const item = items[idx]
                          const common = {
                              className: "fsl-item",
                              "data-fsl-i": k,
                              "data-fsl-manual": "1",
                              "data-active": idx === active ? "1" : undefined,
                              ref: (el: HTMLElement | null) => {
                                  itemRefs.current[k] = el
                              },
                              role: "group",
                              "aria-roledescription": "slide",
                              "aria-label": `${idx + 1} of ${n}`,
                              style: itemStyle,
                          }
                          return item.link ? (
                              <a
                                  key={k}
                                  {...(common as any)}
                                  href={item.link}
                                  target={target}
                                  rel={rel}
                                  draggable={false}
                              >
                                  {renderMedia(item, idx)}
                              </a>
                          ) : (
                              <div key={k} {...(common as any)}>
                                  {renderMedia(item, idx)}
                              </div>
                          )
                      })}
            </div>

            {/* CMS empty state */}
            {isCms && n === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: 24,
                        color: "rgba(128,128,128,0.95)",
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 14,
                        lineHeight: 1.4,
                        pointerEvents: "none",
                    }}
                >
                    Drop a Collection List into “CMS List”
                </div>
            )}

            {/* Captions: one per slide, stacked, the active one fades in */}
            {captionShown && stageVisible && slides.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        left: (size.w - L.A) / 2,
                        top: capTop,
                        width: L.A,
                        display: "grid",
                        gridTemplateColumns: "100%",
                    }}
                >
                    {slides.map((s, i) => {
                        const on = i === active
                        const inner = (
                            <>
                                {s.title && (
                                    <p
                                        ref={(el) => {
                                            titleRefs.current[i] = el
                                        }}
                                        style={{
                                            willChange: "opacity, transform",
                                            margin: 0,
                                            ...captionCfg.titleFont,
                                            color: captionCfg.titleColor,
                                            textAlign: captionCfg.align,
                                        }}
                                    >
                                        {s.title}
                                    </p>
                                )}
                                {s.subtitle && (
                                    <p
                                        ref={(el) => {
                                            subRefs.current[i] = el
                                        }}
                                        style={{
                                            willChange: "opacity, transform",
                                            margin:
                                                captionCfg.align === "center"
                                                    ? `${captionCfg.lineGap}px auto 0`
                                                    : captionCfg.align ===
                                                        "right"
                                                      ? `${captionCfg.lineGap}px 0 0 auto`
                                                      : `${captionCfg.lineGap}px 0 0`,
                                            maxWidth: "50ch",
                                            ...captionCfg.subtitleFont,
                                            color: captionCfg.subtitleColor,
                                            textAlign: captionCfg.align,
                                            ...({
                                                textWrap: "pretty",
                                            } as CSSProperties),
                                        }}
                                    >
                                        {s.subtitle}
                                    </p>
                                )}
                            </>
                        )
                        const capStyle: CSSProperties = {
                            gridArea: "1 / 1",
                            color: "inherit",
                            textDecoration: "none",
                            display: "block",
                        }
                        return s.href ? (
                            <a
                                key={i}
                                ref={(el) => {
                                    capRefs.current[i] = el
                                }}
                                href={s.href}
                                target={target}
                                rel={rel}
                                draggable={false}
                                aria-hidden={!on}
                                tabIndex={on ? 0 : -1}
                                style={capStyle}
                            >
                                {inner}
                            </a>
                        ) : (
                            <div
                                key={i}
                                ref={(el) => {
                                    capRefs.current[i] = el
                                }}
                                aria-hidden={!on}
                                style={capStyle}
                            >
                                {inner}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Custom cursor ("Drag" / "View") */}
            {hover.cursor !== "none" && !isStatic && (
                <div
                    ref={cursorRef}
                    className="fsl-cursor"
                    aria-hidden="true"
                    data-on="0"
                    style={{
                        width: hover.cursorSize,
                        height: hover.cursorSize,
                        marginLeft: -hover.cursorSize / 2,
                        marginTop: -hover.cursorSize / 2,
                        background: hover.cursorBg,
                        color: hover.cursorColor,
                    }}
                />
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

const hasVideo = (p: any) =>
    !p ||
    p.source === "cms" ||
    (Array.isArray(p.items) &&
        p.items.some((item: MediaItem) => item && item.type === "video"))

FocusSlideshow.displayName = "Focus Slideshow"

const onOff = { enabledTitle: "On", disabledTitle: "Off" }
const yesNo = { enabledTitle: "Yes", disabledTitle: "No" }

addPropertyControls(FocusSlideshow, {
    /* ---- Content ---- */
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["manual", "cms"],
        optionTitles: ["Manual", "CMS"],
        defaultValue: "manual",
        displaySegmentedControl: true,
    },
    items: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 24,
        description: "Used when Source is Manual.",
        hidden: (p: any) => p.source === "cms",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) => p.type === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => p.type !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: (p: any) => p.type !== "video",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project title",
                },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "A short description of the project",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS as any,
    },
    cms: {
        type: ControlType.Slot,
        title: "CMS List",
        maxCount: 1,
        hidden: (p: any) => p.source !== "cms",
        description:
            "Drop a Collection List here. Each item needs an image (fill the card) and, optionally, a title and a subtitle text: they become the caption.",
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start Item",
        defaultValue: 1,
        min: 1,
        max: 24,
        step: 1,
        displayStepper: true,
    },
    snapping: {
        type: ControlType.Boolean,
        title: "Snapping",
        description:
            "On: dragging always settles on a card. Off: it glides freely and stops wherever it ends.",
        defaultValue: true,
        ...yesNo,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },

    /* ---- Playback ---- */
    playback: {
        type: ControlType.Object,
        title: "Playback",
        icon: "interaction",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
                ...onOff,
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: 4,
                min: 1,
                max: 12,
                step: 0.5,
                unit: "s",
                hidden: (p: any) => !p.autoplay,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                enabledTitle: "Infinite",
                disabledTitle: "Off",
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
                ...onOff,
                hidden: (p: any) => !p.autoplay,
            },
            videos: {
                type: ControlType.Enum,
                title: "Play Videos",
                description:
                    "All Visible: every video on screen plays. Active Only: a video plays only while its card is the active one, restarting each time.",
                options: ["visible", "active"],
                optionTitles: ["All Visible", "Active Only"],
                defaultValue: "visible",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                hidden: (_p: any, root: any) => !hasVideo(root),
            },
        },
        defaultValue: PLAYBACK_DEFAULTS as any,
    },

    /* ---- Motion ---- */
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "effect",
        controls: {
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 0.6,
                min: 0.1,
                max: 2,
                step: 0.05,
                unit: "s",
            },
            easing: {
                type: ControlType.Enum,
                title: "Easing",
                options: ["easeOut", "easeInOut", "expo", "linear"],
                optionTitles: ["Ease Out", "Ease In-Out", "Expo Out", "Linear"],
                defaultValue: "easeOut",
            },
        },
        defaultValue: MOTION_DEFAULTS as any,
    },

    /* ---- Layout ---- */
    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        controls: {
            ratio: {
                type: ControlType.Enum,
                title: "Ratio",
                options: [
                    "3:2",
                    "4:3",
                    "16:9",
                    "1:1",
                    "4:5",
                    "3:4",
                    "2:3",
                    "9:16",
                ],
                optionTitles: [
                    "3:2",
                    "4:3",
                    "16:9",
                    "1:1",
                    "4:5",
                    "3:4",
                    "2:3",
                    "9:16",
                ],
                defaultValue: "3:2",
            },
            activeSize: {
                type: ControlType.Number,
                title: "Active",
                description: "Card widths as a share of the component's width.",
                defaultValue: 36,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
            },
            nearSize: {
                type: ControlType.Number,
                title: "Next To Active",
                defaultValue: 24,
                min: 5,
                max: 100,
                step: 1,
                unit: "%",
            },
            farSize: {
                type: ControlType.Number,
                title: "Further Away",
                defaultValue: 16,
                min: 5,
                max: 100,
                step: 1,
                unit: "%",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 0,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["top", "center", "bottom"],
                optionTitles: ["Top", "Center", "Bottom"],
                defaultValue: "top",
                displaySegmentedControl: true,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 0,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
            },
            inactiveOpacity: {
                type: ControlType.Number,
                title: "Inactive Opacity",
                defaultValue: 1,
                min: 0,
                max: 1,
                step: 0.05,
            },
        },
        defaultValue: LAYOUT_DEFAULTS as any,
    },
    tablet: {
        type: ControlType.Object,
        title: "Tablet",
        icon: "object",
        controls: {
            breakpoint: {
                type: ControlType.Number,
                title: "Below",
                description:
                    "Applies when the component is narrower than this (its own width, not the window).",
                defaultValue: 1200,
                min: 400,
                max: 2000,
                step: 10,
                unit: "px",
            },
            activeSize: {
                type: ControlType.Number,
                title: "Active",
                defaultValue: 50,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
            },
            nearSize: {
                type: ControlType.Number,
                title: "Next To Active",
                defaultValue: 26,
                min: 5,
                max: 100,
                step: 1,
                unit: "%",
            },
            farSize: {
                type: ControlType.Number,
                title: "Further Away",
                defaultValue: 16,
                min: 5,
                max: 100,
                step: 1,
                unit: "%",
            },
        },
        defaultValue: TABLET_DEFAULTS as any,
    },
    mobile: {
        type: ControlType.Object,
        title: "Mobile",
        icon: "object",
        controls: {
            breakpoint: {
                type: ControlType.Number,
                title: "Below",
                description:
                    "Applies when the component is narrower than this (its own width, not the window).",
                defaultValue: 810,
                min: 200,
                max: 1600,
                step: 10,
                unit: "px",
            },
            activeSize: {
                type: ControlType.Number,
                title: "Active",
                defaultValue: 68,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
            },
            nearSize: {
                type: ControlType.Number,
                title: "Next To Active",
                defaultValue: 50,
                min: 5,
                max: 100,
                step: 1,
                unit: "%",
            },
            farSize: {
                type: ControlType.Number,
                title: "Further Away",
                defaultValue: 50,
                min: 5,
                max: 100,
                step: 1,
                unit: "%",
            },
        },
        defaultValue: MOBILE_DEFAULTS as any,
    },

    /* ---- Caption ---- */
    caption: {
        type: ControlType.Object,
        title: "Caption",
        icon: "boolean",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Caption",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            reveal: {
                type: ControlType.Enum,
                title: "Reveal",
                description:
                    "How the text appears and disappears as cards move.",
                options: ["fade", "rise", "slide", "blur", "stagger", "cut"],
                optionTitles: [
                    "Fade",
                    "Rise",
                    "Slide",
                    "Blur",
                    "Stagger",
                    "Cut",
                ],
                defaultValue: "fade",
                hidden: (p: any) => !p.show,
            },
            revealDistance: {
                type: ControlType.Number,
                title: "Distance",
                defaultValue: 16,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (p: any) =>
                    !p.show ||
                    (p.reveal !== "rise" &&
                        p.reveal !== "slide" &&
                        p.reveal !== "stagger"),
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "18px",
                    variant: "Light",
                    lineHeight: "1.33em",
                },
                hidden: (p: any) => !p.show,
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => !p.show,
            },
            subtitleFont: {
                type: ControlType.Font,
                title: "Subtitle Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "18px",
                    variant: "Light",
                    lineHeight: "1.33em",
                },
                hidden: (p: any) => !p.show,
            },
            subtitleColor: {
                type: ControlType.Color,
                title: "Subtitle",
                defaultValue: "#757575",
                hidden: (p: any) => !p.show,
            },
            lineGap: {
                type: ControlType.Number,
                title: "Line Spacing",
                description: "Space between the title and the subtitle.",
                defaultValue: 0,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                hidden: (p: any) => !p.show,
            },
            gap: {
                type: ControlType.Number,
                title: "Card Spacing",
                description: "Space between the card and the caption.",
                defaultValue: 8,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (p: any) => !p.show,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                hidden: (p: any) => !p.show,
            },
        },
        defaultValue: CAPTION_DEFAULTS as any,
    },

    /* ---- Parallax ---- */
    parallax: {
        type: ControlType.Object,
        title: "Parallax",
        icon: "effect",
        controls: {
            on: {
                type: ControlType.Boolean,
                title: "Image Parallax",
                defaultValue: false,
                ...onOff,
            },
            amount: {
                type: ControlType.Number,
                title: "Amount",
                description: "How far the photo drifts inside its card.",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                hidden: (p: any) => !p.on,
            },
        },
        defaultValue: PARALLAX_DEFAULTS as any,
    },

    /* ---- Hover ---- */
    hover: {
        type: ControlType.Object,
        title: "Hover",
        icon: "interaction",
        controls: {
            effect: {
                type: ControlType.Enum,
                title: "Card Effect",
                options: ["none", "zoom", "tint", "both"],
                optionTitles: ["None", "Zoom", "Tint", "Zoom + Tint"],
                defaultValue: "none",
            },
            zoom: {
                type: ControlType.Number,
                title: "Zoom",
                defaultValue: 6,
                min: 1,
                max: 30,
                step: 1,
                unit: "%",
                hidden: (p: any) => p.effect !== "zoom" && p.effect !== "both",
            },
            tint: {
                type: ControlType.Color,
                title: "Tint",
                defaultValue: "#000000",
                hidden: (p: any) => p.effect !== "tint" && p.effect !== "both",
            },
            tintOpacity: {
                type: ControlType.Number,
                title: "Tint Opacity",
                defaultValue: 0.3,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p: any) => p.effect !== "tint" && p.effect !== "both",
            },
            cursor: {
                type: ControlType.Enum,
                title: "Cursor",
                description:
                    "Auto: Drag on most cards, View on the active card when it has a link. Mouse only.",
                options: ["none", "auto", "drag", "view"],
                optionTitles: ["Default", "Auto", "Drag", "View"],
                defaultValue: "none",
            },
            dragLabel: {
                type: ControlType.String,
                title: "Drag Label",
                defaultValue: "Drag",
                hidden: (p: any) => p.cursor === "none" || p.cursor === "view",
            },
            viewLabel: {
                type: ControlType.String,
                title: "View Label",
                defaultValue: "View",
                hidden: (p: any) => p.cursor === "none" || p.cursor === "drag",
            },
            cursorSize: {
                type: ControlType.Number,
                title: "Cursor Size",
                defaultValue: 76,
                min: 32,
                max: 160,
                step: 2,
                unit: "px",
                hidden: (p: any) => p.cursor === "none",
            },
            cursorBg: {
                type: ControlType.Color,
                title: "Cursor Fill",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => p.cursor === "none",
            },
            cursorColor: {
                type: ControlType.Color,
                title: "Cursor Text",
                defaultValue: "#000000",
                hidden: (p: any) => p.cursor === "none",
            },
        },
        defaultValue: HOVER_DEFAULTS as any,
    },

    /* ---- Scroll ---- */
    scroll: {
        type: ControlType.Object,
        title: "Scroll",
        icon: "interaction",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Scroll Link",
                description:
                    "Advance: scrolling the page steps through the slides. Scrub: the slides follow the component's position on screen (turns autoplay off).",
                options: ["off", "advance", "scrub"],
                optionTitles: ["Off", "Advance", "Scrub"],
                defaultValue: "off",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 1,
                min: 0.2,
                max: 3,
                step: 0.1,
                hidden: (p: any) => p.mode === "off",
            },
        },
        defaultValue: SCROLL_DEFAULTS as any,
    },

    /* ---- Touch ---- */
    touch: {
        type: ControlType.Object,
        title: "Touch",
        icon: "interaction",
        controls: {
            threshold: {
                type: ControlType.Number,
                title: "Drag Threshold",
                description:
                    "How far a finger must move sideways before the slideshow starts to drag.",
                defaultValue: 12,
                min: 6,
                max: 40,
                step: 1,
                unit: "px",
            },
            swipeCheck: {
                type: ControlType.Boolean,
                title: "Scroll Check",
                description:
                    "Only drag on mostly-sideways swipes, so up/down gestures still scroll the page.",
                defaultValue: true,
                ...onOff,
            },
        },
        defaultValue: TOUCH_DEFAULTS as any,
    },

    /* ---- Interaction ---- */
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        icon: "interaction",
        controls: {
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
                ...onOff,
            },
            clickToFocus: {
                type: ControlType.Boolean,
                title: "Click Card",
                description: "Click a side card to bring it to the centre.",
                defaultValue: true,
                ...onOff,
            },
            keyboard: {
                type: ControlType.Boolean,
                title: "Keyboard",
                defaultValue: true,
                ...onOff,
            },
            trackpad: {
                type: ControlType.Boolean,
                title: "Trackpad",
                description: "Swipe sideways with two fingers.",
                defaultValue: true,
                ...onOff,
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                description: "Open links in a new tab.",
                defaultValue: false,
                ...yesNo,
            },
        },
        defaultValue: INTERACTION_DEFAULTS as any,
    },

    /* ---- Loading ---- */
    loading: {
        type: ControlType.Object,
        title: "Loading",
        icon: "effect",
        controls: {
            lazy: {
                type: ControlType.Boolean,
                title: "Lazy Load",
                description: "Only load media near the active card.",
                defaultValue: true,
                ...onOff,
            },
            preload: {
                type: ControlType.Number,
                title: "Preload",
                defaultValue: 4,
                min: 1,
                max: 12,
                step: 1,
                displayStepper: true,
                hidden: (p: any) => !p.lazy,
            },
        },
        defaultValue: LOADING_DEFAULTS as any,
    },
})
