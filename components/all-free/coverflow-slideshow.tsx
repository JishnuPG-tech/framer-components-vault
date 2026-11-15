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

import { animate } from "framer-motion"

/* ------------------------------------------------------------------ */
/* Types & defaults                                                    */
/* ------------------------------------------------------------------ */

type MotionStyle = "spring" | "ease"
type EaseName = "expo" | "quart" | "soft"
type NavPlace = "below" | "sides"
type NavIcon = "arrow" | "chevron"
type TagPlace = "top-left" | "top-center" | "top-right"
type CapAlign = "left" | "center" | "right"

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface SlideItem {
    type?: "image" | "video"
    image?: ImageValue
    video?: string
    poster?: ImageValue
    title?: string
    tag?: string
    link?: string
}

/** One slide, whether it came from the Slides control or from a CMS item. */
interface Slide {
    type: "image" | "video"
    src?: string
    srcSet?: string
    video?: string
    poster?: string
    alt?: string
    title: string
    tag: string
    link?: string
}

interface LayoutProps {
    ratio: string
    fill: number
    maxWidth: number
    visible: number
    radius: number
    shadow: number
}

interface DepthProps {
    sideScale: number
    falloff: number
    spacing: number
    tilt: number
    perspective: number
    lift: number
    sideOpacity: number
    dim: number
    dimColor: string
}

interface CaptionProps {
    show: boolean
    font: CSSProperties
    color: string
    sideOpacity: number
    uppercase: boolean
    align: CapAlign
    padding: number
    gradient: number
    gradientColor: string
}

interface TagProps {
    show: boolean
    font: CSSProperties
    color: string
    background: string
    blur: number
    place: TagPlace
    inset: number
}

interface NavProps {
    show: boolean
    place: NavPlace
    icon: NavIcon
    size: number
    gap: number
    distance: number
    stroke: number
    color: string
    background: string
    border: string
    hoverBackground: string
    hoverColor: string
    disabledOpacity: number
}

interface MotionProps {
    style: MotionStyle
    duration: number
    bounce: number
    ease: EaseName
    parallax: number
}

interface PlaybackProps {
    autoplay: boolean
    interval: number
    loop: boolean
    pauseOnHover: boolean
    videos: "visible" | "active"
}

interface ResponsiveProps {
    breakpoint: number
    visible: number
    sideScale: number
    falloff: number
}

interface InteractionProps {
    drag: boolean
    clickToFocus: boolean
    keyboard: boolean
    trackpad: boolean
    hoverZoom: number
    newTab: boolean
}

interface CoverflowProps {
    source: "manual" | "cms"
    items: SlideItem[]
    cms?: ReactNode
    startIndex: number
    background: string
    layout: Partial<LayoutProps>
    depth: Partial<DepthProps>
    caption: Partial<CaptionProps>
    tag: Partial<TagProps>
    nav: Partial<NavProps>
    motion: Partial<MotionProps>
    playback: Partial<PlaybackProps>
    tablet: Partial<ResponsiveProps>
    mobile: Partial<ResponsiveProps>
    interaction: Partial<InteractionProps>
    style?: CSSProperties
}

const DEFAULT_VIDEO =
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"

const DEFAULT_IMAGES = [
    "https://framerusercontent.com/images/jcpAddw1ac6E53CabeggBQ8oFLo.jpg",
    "https://framerusercontent.com/images/ah1CYTvEdYdbLeagcV4hsW3OO4.jpg",
    "https://framerusercontent.com/images/NF5ESAqEMIZbJjc7zlu6lNxrY0.jpg",
    "https://framerusercontent.com/images/mpvJpMQjaRdt9dl8cEFDTBqeQ.jpg",
    "https://framerusercontent.com/images/2bpSuPbJUqCsJkBfV82j3TJuCk.jpg",
    "https://framerusercontent.com/images/wgh3EwmGL9fVQtzceDboPxrSNM.jpg",
]

const DEFAULT_COPY: [string, string][] = [
    ["The Roseline Ring", "Ring"],
    ["The Zoe Earrings", "Earrings"],
    ["The Hibiscus Ring II", "Ring"],
    ["The Chubby Hoops", "Earrings"],
    ["The Chubby Hoops", "Hoops"],
    ["The Marlowe Chain", "Necklace"],
]

const DEFAULT_ITEMS: SlideItem[] = DEFAULT_COPY.map(([title, tag], i) => ({
    type: "image" as const,
    image: { src: DEFAULT_IMAGES[i % DEFAULT_IMAGES.length], alt: title },
    title,
    tag,
    ...(i === 0 ? { link: "/blog" } : {}),
}))

const LAYOUT_DEFAULTS: LayoutProps = {
    ratio: "2:3",
    fill: 100,
    maxWidth: 100,
    visible: 5,
    radius: 36,
    shadow: 47,
}
const DEPTH_DEFAULTS: DepthProps = {
    sideScale: 82,
    falloff: 95,
    spacing: 12,
    tilt: 36,
    perspective: 1850,
    lift: -16,
    sideOpacity: 100,
    dim: 40,
    dimColor: "#0B0806",
}
const CAPTION_DEFAULTS: CaptionProps = {
    show: true,
    font: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 15,
        fontWeight: 500,
        letterSpacing: "0.02em",
        lineHeight: "1.2em",
    },
    color: "#FFFFFF",
    sideOpacity: 70,
    uppercase: true,
    align: "left",
    padding: 18,
    gradient: 70,
    gradientColor: "#000000",
}
const TAG_DEFAULTS: TagProps = {
    show: true,
    font: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 500,
        lineHeight: "1em",
    },
    color: "#FFFFFF",
    background: "rgba(40, 32, 28, 0.45)",
    blur: 20,
    place: "top-left",
    inset: 14,
}
const NAV_DEFAULTS: NavProps = {
    show: true,
    place: "below",
    icon: "chevron",
    size: 40,
    gap: 12,
    distance: 64,
    stroke: 2,
    color: "#FFFFFF",
    background: "rgba(255, 255, 255, 0)",
    border: "rgba(255, 255, 255, 0.45)",
    hoverBackground: "#FFFFFF",
    hoverColor: "#0B0806",
    disabledOpacity: 35,
}
const MOTION_DEFAULTS: MotionProps = {
    style: "spring",
    duration: 1,
    bounce: 0,
    ease: "expo",
    parallax: 15,
}
const PLAYBACK_DEFAULTS: PlaybackProps = {
    autoplay: true,
    interval: 2.5,
    loop: true,
    pauseOnHover: true,
    videos: "active",
}
const TABLET_DEFAULTS: ResponsiveProps = {
    breakpoint: 1200,
    visible: 5,
    sideScale: 82,
    falloff: 95,
}
const MOBILE_DEFAULTS: ResponsiveProps = {
    breakpoint: 810,
    visible: 3,
    sideScale: 82,
    falloff: 90,
}
const INTERACTION_DEFAULTS: InteractionProps = {
    drag: true,
    clickToFocus: true,
    keyboard: true,
    trackpad: true,
    hoverZoom: 4,
    newTab: false,
}

/* ------------------------------------------------------------------ */
/* Math helpers                                                        */
/* ------------------------------------------------------------------ */

const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v))
const mod = (v: number, n: number) => ((v % n) + n) % n
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => {
    const x = clamp(t, 0, 1)
    return x * x * (3 - 2 * x)
}

function parseRatio(value: string): number {
    const [a, b] = String(value).split(":").map(Number)
    return a > 0 && b > 0 ? a / b : 3 / 4
}

const EMPTY_SLIDE: Slide = { type: "image", title: "", tag: "" }

function manualSlide(item: SlideItem, idx: number): Slide {
    const title = item.title ?? ""
    const tag = item.tag ?? ""
    if (item.type === "video") {
        return {
            type: "video",
            video: item.video || DEFAULT_VIDEO,
            // Keep the card visually populated while the video loads (and in static previews).
            // If the user hasn't supplied a poster, reuse the corresponding starter image.
            poster: item.poster?.src || DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length],
            alt: title,
            title,
            tag,
            link: item.link,
        }
    }
    // ResponsiveImage controls can't carry defaults, so empty slots fall back to the starter images.
    const image: ImageValue = item.image?.src
        ? item.image
        : {
              src: DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length],
              alt: title || "Slide " + (idx + 1),
          }
    return {
        type: "image",
        src: image.src,
        srcSet: image.srcSet,
        alt: image.alt || title,
        title,
        tag,
        link: item.link,
    }
}

/* A CMS item is read from the DOM (the Collection List renders hidden): media, first two text lines, link. */
function readCmsSlide(el: HTMLElement): Slide {
    const lines: string[] = []
    el.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6").forEach(
        (t) => {
            const text = (t.textContent || "").trim()
            if (text) lines.push(text)
        }
    )
    const video = el.querySelector("video")
    const img = el.querySelector("img")
    const a = el.querySelector("a[href]")
    const videoSrc = video
        ? video.getAttribute("src") ||
          video.querySelector("source")?.getAttribute("src") ||
          ""
        : ""
    const imgSrc = img?.getAttribute("src") || undefined
    return {
        type: videoSrc ? "video" : "image",
        video: videoSrc || undefined,
        poster:
            video?.getAttribute("poster") || (videoSrc ? imgSrc : undefined),
        src: imgSrc,
        srcSet: img?.getAttribute("srcset") || undefined,
        alt: img?.getAttribute("alt") || lines[0] || "",
        title: lines[0] || "",
        tag: lines[1] || "",
        link: a?.getAttribute("href") || undefined,
    }
}

function readCms(stage: HTMLElement): Slide[] {
    // A Collection List renders one container whose direct children are the repeated items,
    // so they share the same layer name / class. Anything else is not treated as a list.
    let el: Element = stage
    while (el.children.length === 1) el = el.children[0]
    if (el === stage || el.children.length < 2) return []
    const kids = Array.from(el.children) as HTMLElement[]
    const key = (k: HTMLElement) =>
        k.getAttribute("data-framer-name") || String(k.className) || k.tagName
    const first = key(kids[0])
    if (!first || !kids.every((k) => key(k) === first)) return []
    return kids.map(readCmsSlide)
}

const EASES: Record<EaseName, [number, number, number, number]> = {
    expo: [0.16, 1, 0.3, 1],
    quart: [0.76, 0, 0.24, 1],
    soft: [0.25, 1, 0.5, 1],
}

/* ------------------------------------------------------------------ */
/* Geometry: every card is placed from its signed distance `d` to the   */
/* centre. Drag, click, arrows and autoplay all just change one number   */
/* (the track position) so they move through exactly the same frames.   */
/* ------------------------------------------------------------------ */

interface Geo {
    n: number
    nr: number
    loop: boolean
    W: number
    H: number
    top: number
    cx: number
    V: number
    offsets: number[]
    scales: number[]
    tilt: number
    lift: number
    sideOpacity: number
    dim: number
    capSide: number
    parallax: number
}

const REF = {
    sideScale: 0.82,
    falloff: 0.9,
    spacing: 14,
    tilt: 28,
    perspective: 1400,
}

/**
 * Card centres for the right-hand side, measured on screen. Tilted cards recede at their inner edge, so the
 * offsets are solved through the perspective projection until the visible gap between neighbours equals the gap.
 */
function track(
    W: number,
    V: number,
    scales: number[],
    gap: number,
    tilt: number,
    persp: number
) {
    const rad = (tilt * Math.PI) / 180
    const c = Math.cos(rad)
    const s = Math.sin(rad)
    const offsets = [0]
    const edges = [W / 2]
    for (let k = 1; k <= V + 1; k++) {
        const hw = (W * scales[k]) / 2
        const o = ((edges[k - 1] + gap) * (persp + hw * s)) / persp + hw * c
        offsets.push(o)
        edges.push(
            ((o + hw * c) * persp) / Math.max(persp * 0.2, persp - hw * s)
        )
    }
    return { offsets, edges }
}

function scalesFor(V: number, side: number, fall: number) {
    const out = [1]
    for (let k = 1; k <= V + 1; k++)
        out.push(Math.max(0.2, side * Math.pow(fall, k - 1)))
    return out
}

/** The widest the centre card can be: capped by Max Width and by every visible card fitting inside the component. */
function widthLimit(stageW: number, V: number, layout: LayoutProps): number {
    const refScales = scalesFor(V, REF.sideScale, REF.falloff)
    const avail = stageW / 2 - 12
    let lo = 40
    let hi = Math.max(80, stageW)
    for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2
        if (
            track(mid, V, refScales, REF.spacing, REF.tilt, REF.perspective)
                .edges[V] <= avail
        )
            lo = mid
        else hi = mid
    }
    return Math.min((stageW * clamp(layout.maxWidth, 20, 100)) / 100, lo)
}

/**
 * Transforms do not contribute to an auto-sized parent's height. When the side cards are
 * lifted and/or scaled, they can extend beyond the centre card's natural bounds, so Fit
 * height needs to reserve that overflow explicitly.
 */
function fitVerticalBounds(H: number, sideScale: number, lift: number) {
    const s = clamp(sideScale, 30, 100) / 100
    const y = clamp(lift, -30, 30) / 100
    // Leave a small paint-safe margin. The calculated transform bounds can land exactly on
    // the clipping edge, and rotateY + perspective can introduce sub-pixel rounding at that edge.
    const safety = Math.max(4, Math.min(12, H * 0.025))
    const top = Math.max(0, -(y + (1 - s) / 2) * H) + safety
    const bottom = Math.max(0, (y - (1 - s) / 2) * H) + safety
    return { top, bottom }
}

function makeGeo(
    stageW: number,
    stageH: number,
    wLimit: number,
    ratio: number,
    layout: LayoutProps,
    depth: DepthProps,
    n: number,
    nr: number,
    loop: boolean,
    capSide: number,
    parallax: number,
    stageTop?: number
): Geo {
    const V = Math.max(1, Math.round((clamp(layout.visible, 3, 9) - 1) / 2))
    const scales = scalesFor(
        V,
        clamp(depth.sideScale, 30, 100) / 100,
        clamp(depth.falloff, 40, 100) / 100
    )
    // The centre card is sized from the width limit (fixed reference proportions), so Side Scale, Falloff,
    // Spacing and Tilt only change the side cards and never resize the active card.
    const W = Math.min(stageH * ratio, wLimit)
    const H = W / ratio
    const offsets = track(
        W,
        V,
        scales,
        depth.spacing,
        depth.tilt,
        Math.max(200, depth.perspective)
    ).offsets
    return {
        n,
        nr,
        loop,
        W,
        H,
        top: stageTop ?? (stageH - H) / 2,
        cx: stageW / 2,
        V,
        offsets,
        scales,
        tilt: depth.tilt,
        lift: depth.lift / 100,
        sideOpacity: clamp(depth.sideOpacity, 0, 100) / 100,
        dim: clamp(depth.dim, 0, 100) / 100,
        capSide: clamp(capSide, 0, 100) / 100,
        parallax: clamp(parallax, 0, 30) / 100,
    }
}

interface CardState {
    transform: string
    opacity: number
    hidden: boolean
    z: number
    dim: number
    cap: number
    tag: number
    img: string
}

function cardAt(d: number, g: Geo): CardState {
    const a = Math.abs(d)
    const sgn = d < 0 ? -1 : 1
    const ac = Math.min(a, g.V + 1)
    let k = Math.floor(ac)
    let f = ac - k
    if (k > g.V) {
        k = g.V
        f = 1
    }
    const offset = lerp(g.offsets[k], g.offsets[k + 1], f)
    const scale = lerp(g.scales[k], g.scales[k + 1], f)
    const near = smooth(Math.min(a, 1))
    // the card turns to face the centre: inner edge recedes
    const rot = -sgn * g.tilt * near
    const y = g.lift * g.H * near
    const edge = 1 - smooth(clamp(a - g.V, 0, 1))
    const opacity = lerp(1, g.sideOpacity, near) * edge
    const shift = clamp(d, -1, 1)
    return {
        transform: `translate3d(${(sgn * offset).toFixed(2)}px, ${y.toFixed(2)}px, 0) rotateY(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
        opacity,
        hidden: a >= g.V + 1 - 0.001,
        z: Math.round(1000 - a * 20),
        dim: g.dim * near,
        cap: lerp(1, g.capSide, near),
        tag: 1 - smooth(a / 0.55),
        img:
            g.parallax > 0
                ? `translate3d(${(-shift * g.parallax * g.W).toFixed(2)}px, 0, 0) scale(${(1 + 2 * g.parallax).toFixed(4)})`
                : "",
    }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

const CSS_TEXT = `
.cvf-root:focus-visible{outline:2px solid rgba(120,150,255,.7);outline-offset:-2px}
.cvf-card{display:block;color:inherit;text-decoration:none;-webkit-user-drag:none;backface-visibility:hidden;isolation:isolate}
.cvf-card *{-webkit-user-drag:none}
.cvf-img{transition:scale .9s cubic-bezier(.16,1,.3,1)}
@media (hover:hover){
.cvf-root[data-hz="1"] .cvf-card[data-active="1"]:hover .cvf-img{scale:var(--cvf-zoom,1.04)}
}
.cvf-root[data-click="1"] .cvf-card{cursor:pointer}
.cvf-root[data-click="1"] .cvf-card[data-active="1"]{cursor:inherit}
.cvf-root .cvf-card[data-has-link="1"]{cursor:pointer!important}
.cvf-root[data-drag="1"] .cvf-card{cursor:grabbing!important}
.cvf-btn{appearance:none;-webkit-appearance:none;margin:0;padding:0;display:flex;align-items:center;justify-content:center;border-radius:50%;cursor:pointer;transition:background-color .35s cubic-bezier(.16,1,.3,1),color .35s cubic-bezier(.16,1,.3,1),border-color .35s ease,opacity .35s ease,transform .35s cubic-bezier(.16,1,.3,1)}
.cvf-btn:disabled{cursor:default;opacity:var(--cvf-nav-dis,.35)}
.cvf-btn:focus-visible{outline:2px solid rgba(120,150,255,.8);outline-offset:3px}
@media (hover:hover){
.cvf-btn:hover:not(:disabled){background:var(--cvf-nav-hbg)!important;color:var(--cvf-nav-hc)!important}
}
.cvf-btn:active:not(:disabled){transform:scale(.94)}
`

interface DragState {
    id: number
    startX: number
    startY: number
    startPos: number
    moved: boolean
    wasMoving: boolean
    tapSlot: number
    samples: { t: number; v: number }[]
}

function Arrow({
    icon,
    dir,
    stroke,
}: {
    icon: NavIcon
    dir: 1 | -1
    stroke: number
}) {
    const flip: CSSProperties = dir < 0 ? { transform: "scaleX(-1)" } : {}
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={flip}
            aria-hidden="true"
        >
            {icon === "arrow" ? (
                <>
                    <path d="M4 12h16" />
                    <path d="M14 6l6 6-6 6" />
                </>
            ) : (
                <path d="M9 5l7 7-7 7" />
            )}
        </svg>
    )
}

/**
 * Coverflow Slideshow
 *
 * A centred 3D carousel: the active card sits upright in the middle while its neighbours tilt, shrink and fade away on both sides.
 *
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CoverflowSlideshow(props: CoverflowProps) {
    const {
        source = "manual",
        items = DEFAULT_ITEMS,
        cms,
        startIndex = 3,
        background = "#0D0A08",
        style,
    } = props

    const layout: LayoutProps = { ...LAYOUT_DEFAULTS, ...props.layout }
    const depth: DepthProps = { ...DEPTH_DEFAULTS, ...props.depth }
    const captionCfg: CaptionProps = { ...CAPTION_DEFAULTS, ...props.caption }
    const tagCfg: TagProps = { ...TAG_DEFAULTS, ...props.tag }
    const nav: NavProps = { ...NAV_DEFAULTS, ...props.nav }
    const motion: MotionProps = { ...MOTION_DEFAULTS, ...props.motion }
    const playback: PlaybackProps = { ...PLAYBACK_DEFAULTS, ...props.playback }
    const tablet: ResponsiveProps = { ...TABLET_DEFAULTS, ...props.tablet }
    const mobile: ResponsiveProps = { ...MOBILE_DEFAULTS, ...props.mobile }
    const interaction: InteractionProps = {
        ...INTERACTION_DEFAULTS,
        ...props.interaction,
    }

    const isStatic = useIsStaticRenderer()
    const isCms = source === "cms"
    const cmsRef = useRef<HTMLDivElement>(null)
    const [cmsSlides, setCmsSlides] = useState<Slide[]>([])
    const slides: Slide[] = isCms ? cmsSlides : items.map(manualSlide)
    const n = slides.length

    /* ---------------- measuring ---------------- */
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    // w: the component's width. h: the height the cards' stage actually gets (0 until measured).
    const [size, setSize] = useState({ w: 960, h: 0 })

    useIsoLayoutEffect(() => {
        const el = rootRef.current
        const stage = stageRef.current
        if (!el || !stage) return
        const measure = () => {
            const w = el.offsetWidth
            const h = stage.offsetHeight
            if (!w) return
            setSize((s) => (s.w === w && s.h === h ? s : { w, h }))
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        ro.observe(stage)
        return () => ro.disconnect()
    }, [])

    /* ---------------- derived geometry ---------------- */
    const navBelow = nav.show && nav.place === "below" && n > 1
    const navBlock = navBelow ? nav.size + nav.distance : 0
    const ratio = parseRatio(layout.ratio)
    // Match Focus Slideshow's responsive model: the breakpoint is based on the component's own width.
    // Mobile wins over Tablet, and Desktop uses the main Cards / Depth values.
    const isMobile = size.w < mobile.breakpoint
    const isTablet = !isMobile && size.w < tablet.breakpoint
    const responsive = isMobile ? mobile : isTablet ? tablet : null
    const effectiveVisible = responsive?.visible ?? layout.visible
    const effectiveSideScale = responsive?.sideScale ?? depth.sideScale
    const effectiveFalloff = responsive?.falloff ?? depth.falloff
    const loopOn = playback.loop && n >= 2
    const V = Math.max(1, Math.round((clamp(effectiveVisible, 3, 9) - 1) / 2))
    // The cards' natural height comes from the width alone. The stage is that tall, so a "Fit" height hugs the
    // cards and the arrows; with a fixed height the stage may only shrink (never grow), so spare height never
    // opens a gap between the cards and the arrows.
    const wLim = useMemo(
        () => widthLimit(size.w, V, layout),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [size.w, V, layout.maxWidth]
    )
    const natH = wLim / ratio
    const fitBounds = fitVerticalBounds(natH, effectiveSideScale, depth.lift)
    const natStageH = natH + fitBounds.top + fitBounds.bottom
    const heightStyle = style?.height
    // Framer can pass Fit height through as 100% rather than auto. Treat that as intrinsic sizing too.
    const isFitHeight =
        heightStyle === "auto" || heightStyle === "100%" || heightStyle == null
    const constrainedStage =
        !isFitHeight && size.h > 0 && size.h < natStageH - 1
    const stageH = constrainedStage ? size.h : natStageH
    const stageTop = constrainedStage
        ? Math.max(0, (stageH - natH) / 2)
        : fitBounds.top
    // Short lists are repeated until the track is full, so a loop never shows a gap.
    const reps = loopOn
        ? clamp(Math.ceil((2 * V + 3) / Math.max(1, n)), 1, 8)
        : 1
    const nr = n * reps

    const geo = useMemo(
        () =>
            makeGeo(
                size.w,
                stageH,
                wLim,
                ratio,
                { ...layout, visible: effectiveVisible },
                {
                    ...depth,
                    sideScale: effectiveSideScale,
                    falloff: effectiveFalloff,
                },
                n,
                nr,
                loopOn,
                captionCfg.sideOpacity,
                motion.parallax,
                stageTop
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            size.w,
            stageH,
            wLim,
            ratio,
            effectiveVisible,
            effectiveSideScale,
            effectiveFalloff,
            stageTop,
            depth.spacing,
            depth.tilt,
            depth.lift,
            depth.sideOpacity,
            depth.dim,
            n,
            nr,
            loopOn,
            captionCfg.sideOpacity,
            motion.parallax,
        ]
    )

    /* ---------------- engine state (refs only: no re-render per frame) ---------------- */
    const initial = clamp(startIndex - 1, 0, Math.max(0, n - 1))
    const initialRef = useRef(initial)
    const posRef = useRef(initial)
    const targetRef = useRef(initial)
    const velRef = useRef(0)
    const animRef = useRef<{ stop: () => void } | null>(null)
    const draggingRef = useRef(false)
    const scrubRef = useRef(false)
    const suppressClickRef = useRef(false)
    const hoverRef = useRef(false)
    const inViewRef = useRef(true)
    const lastActionRef = useRef(0)
    const activeRef = useRef(initial)
    const dragRef = useRef<DragState | null>(null)

    const cardRefs = useRef<(HTMLElement | null)[]>([])
    const dimRefs = useRef<(HTMLElement | null)[]>([])
    const capRefs = useRef<(HTMLElement | null)[]>([])
    const tagRefs = useRef<(HTMLElement | null)[]>([])
    const imgRefs = useRef<(HTMLElement | null)[]>([])

    const geoRef = useRef(geo)
    const motionRef = useRef(motion)
    geoRef.current = geo
    motionRef.current = motion

    const [active, setActive] = useState(initial)
    const [inView, setInView] = useState(true)

    const signedDistance = (k: number, pos: number, g: Geo) => {
        let d = k - pos
        if (g.loop) d -= g.nr * Math.round(d / g.nr)
        return d
    }

    const applyAll = (pos: number) => {
        const g = geoRef.current
        for (let k = 0; k < g.nr; k++) {
            const el = cardRefs.current[k]
            if (!el) continue
            const c = cardAt(signedDistance(k, pos, g), g)
            const st = el.style
            st.transform = c.transform
            st.opacity = c.opacity >= 1 ? "" : c.opacity.toFixed(3)
            st.visibility = c.hidden ? "hidden" : "visible"
            st.pointerEvents = c.hidden ? "none" : ""
            st.zIndex = String(c.z)
            const dim = dimRefs.current[k]
            if (dim) dim.style.opacity = c.dim.toFixed(3)
            const cap = capRefs.current[k]
            if (cap) cap.style.opacity = c.cap.toFixed(3)
            const tag = tagRefs.current[k]
            if (tag) {
                tag.style.opacity = c.tag.toFixed(3)
                tag.style.transform = `translate3d(0, ${((1 - c.tag) * -6).toFixed(2)}px, 0)`
            }
            const img = imgRefs.current[k]
            if (img) img.style.transform = c.img
        }
    }

    const markActive = (idx: number) => {
        const g = geoRef.current
        for (let k = 0; k < g.nr; k++) {
            const el = cardRefs.current[k]
            if (!el) continue
            if (k % g.n === idx) el.setAttribute("data-active", "1")
            else el.removeAttribute("data-active")
        }
    }

    const syncActive = (pos: number) => {
        const g = geoRef.current
        if (!g.n) return
        const idx = g.loop
            ? mod(Math.round(pos), g.n)
            : clamp(Math.round(pos), 0, g.n - 1)
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
        // keep numbers small: shift by a whole number of laps
        if (g.loop && g.nr) x -= g.nr * Math.floor(x / g.nr)
        animRef.current = null
        posRef.current = x
        targetRef.current = x
        velRef.current = 0
        applyAll(x)
        syncActive(x)
    }

    const goTo = (t: number, velocity = 0) => {
        const target = constrain(t)
        const from = posRef.current
        lastActionRef.current =
            typeof performance !== "undefined" ? performance.now() : 0
        animRef.current?.stop()
        animRef.current = null
        targetRef.current = target
        if (Math.abs(target - from) < 1e-4) {
            settle(target)
            return
        }
        const m = motionRef.current
        const dur =
            Math.max(0.15, m.duration) *
            clamp(Math.sqrt(Math.abs(target - from)), 0.7, 1.6)
        let last = from
        let lastT = performance.now()
        const common = {
            onUpdate: (v: number) => {
                const now = performance.now()
                const dt = (now - lastT) / 1000
                if (dt > 0) velRef.current = (v - last) / dt
                last = v
                lastT = now
                posRef.current = v
                applyAll(v)
                syncActive(v)
            },
            onComplete: () => settle(target),
        }
        const transition =
            m.style === "spring"
                ? {
                      type: "spring" as const,
                      duration: dur,
                      bounce: clamp(m.bounce, 0, 0.5),
                      velocity: velocity || velRef.current,
                      ...common,
                  }
                : {
                      type: "tween" as const,
                      duration: dur,
                      ease: EASES[m.ease] || EASES.expo,
                      ...common,
                  }
        animRef.current = animate(from, target, transition as any) as any
    }

    /* Nearest equivalent target for slot k (wraps around the track). */
    const targetForSlot = (k: number) => {
        const g = geoRef.current
        return Math.round(posRef.current + signedDistance(k, posRef.current, g))
    }

    const step = (dir: number) => goTo(Math.round(targetRef.current) + dir)

    /* ---------------- keep DOM in sync with state ---------------- */
    useIsoLayoutEffect(() => {
        cardRefs.current.length = nr
        markActive(activeRef.current)
        applyAll(posRef.current)
    })

    useEffect(() => {
        return () => {
            animRef.current?.stop()
        }
    }, [])

    /* Re-clamp when the number of slides (or loop mode) changes. CMS items arrive after the first render. */
    const sawItemsRef = useRef(n > 0)
    useIsoLayoutEffect(() => {
        if (!n) return
        if (!sawItemsRef.current) {
            sawItemsRef.current = true
            const idx = clamp(startIndex - 1, 0, n - 1)
            initialRef.current = idx
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
        let t = idx
        if (geoRef.current.loop) {
            const base = Math.round(targetRef.current)
            let d = idx - mod(base, geoRef.current.n)
            if (d > geoRef.current.n / 2) d -= geoRef.current.n
            if (d < -geoRef.current.n / 2) d += geoRef.current.n
            t = base + d
        }
        goTo(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startIndex])

    /* Only play while on screen. */
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
        if (!playback.autoplay || isStatic || n < 2) return
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
            if (g.loop || base < g.n - 1) goTo(base + 1)
            else goTo(0)
        }, 200)
        return () => window.clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        playback.autoplay,
        playback.interval,
        playback.pauseOnHover,
        isStatic,
        n,
    ])

    /* CMS: the Collection List renders hidden, and its items are mirrored into slides. */
    useEffect(() => {
        if (!isCms) {
            setCmsSlides((old) => (old.length ? [] : old))
            return
        }
        const stage = cmsRef.current
        if (!stage) return
        let raf = 0
        const scan = () => {
            raf = 0
            const next = readCms(stage)
            setCmsSlides((old) =>
                JSON.stringify(old) === JSON.stringify(next) ? old : next
            )
        }
        const schedule = () => {
            if (!raf) raf = requestAnimationFrame(scan)
        }
        scan()
        // Items can finish rendering a moment after mount (hydration), so look again a few times.
        const timers = [150, 600, 1500].map((t) => window.setTimeout(scan, t))
        if (typeof MutationObserver === "undefined")
            return () => timers.forEach((t) => window.clearTimeout(t))
        const mo = new MutationObserver(schedule)
        mo.observe(stage, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["src", "srcset", "poster", "href"],
        })
        return () => {
            mo.disconnect()
            timers.forEach((t) => window.clearTimeout(t))
            if (raf) cancelAnimationFrame(raf)
        }
    }, [isCms])

    /* Videos: either every visible card plays, or only the active one (which then restarts from the beginning). */
    const videoKey = slides.map((s) => s.video || "").join("|")
    useEffect(() => {
        const activeOnly = playback.videos === "active"
        for (let k = 0; k < nr; k++) {
            const el = cardRefs.current[k]
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
                !isStatic &&
                inView &&
                (activeOnly ? isActive : d <= geoRef.current.V + 0.5)
            if (shouldPlay) {
                if (activeOnly && v.getAttribute("data-cvf-on") !== "1")
                    v.currentTime = 0
                v.setAttribute("data-cvf-on", "1")
                const p = v.play()
                if (p && typeof p.catch === "function") p.catch(() => {})
            } else {
                v.removeAttribute("data-cvf-on")
                v.pause()
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, nr, inView, isStatic, videoKey, geo.V, playback.videos])

    /* ---------------- dragging ---------------- */
    const pitch = Math.max(60, geo.offsets[1])

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
            "[data-cvf-i]"
        ) as HTMLElement | null
        return hit ? Number(hit.getAttribute("data-cvf-i")) : -1
    }

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (isStatic || n < 2) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        if ((e.target as HTMLElement).closest?.(".cvf-btn")) return
        dragRef.current = {
            id: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startPos: posRef.current,
            moved: false,
            wasMoving: !!animRef.current,
            tapSlot: slotOf(e.target),
            samples: [],
        }
    }

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const root = rootRef.current
        const d = dragRef.current
        if (!root || !d || e.pointerId !== d.id) return
        const rect = root.getBoundingClientRect()
        const sx = root.offsetWidth ? rect.width / root.offsetWidth : 1
        const dx = (e.clientX - d.startX) / (sx || 1)
        if (!d.moved) {
            if (!interaction.drag) return
            if (e.pointerType === "mouse") {
                if (Math.abs(dx) < 6) return
            } else {
                const dy = (e.clientY - d.startY) / (sx || 1)
                if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
                    dragRef.current = null
                    return
                }
                if (Math.abs(dx) < 10) return
            }
            d.moved = true
            draggingRef.current = true
            suppressClickRef.current = true
            animRef.current?.stop()
            animRef.current = null
            // grabbing a moving track: continue from where it is, so cards never jump
            d.startPos = posRef.current
            d.startX = e.clientX
            try {
                root.setPointerCapture(e.pointerId)
            } catch (err) {
                /* pointer already released */
            }
            root.style.cursor = "grabbing"
            root.setAttribute("data-drag", "1")
            return
        }
        const pos = rubber(d.startPos - dx / pitch)
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
            if (root) {
                root.style.cursor = interaction.drag ? "grab" : "default"
                root.removeAttribute("data-drag")
            }
            let v = 0
            if (!cancelled && d.samples.length > 1) {
                const a = d.samples[0]
                const b = d.samples[d.samples.length - 1]
                const dt = (b.t - a.t) / 1000
                if (dt > 0.01) v = (b.v - a.v) / dt
            }
            // settle on a card, nudged by how hard the flick was
            goTo(
                Math.round(posRef.current + clamp(v * 0.12, -1.2, 1.2)),
                v * 0.4
            )
        } else if (!cancelled && d.tapSlot >= 0 && interaction.clickToFocus) {
            const target = targetForSlot(d.tapSlot)
            if (target !== Math.round(targetRef.current)) goTo(target)
        }
    }

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
                animRef.current?.stop()
                animRef.current = null
            }
            const pos = constrain(posRef.current + (dx / pitch) * 0.9)
            posRef.current = pos
            targetRef.current = pos
            lastActionRef.current = performance.now()
            applyAll(pos)
            syncActive(pos)
            window.clearTimeout(timer)
            timer = window.setTimeout(() => {
                scrubRef.current = false
                goTo(Math.round(posRef.current))
            }, 140)
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            el.removeEventListener("wheel", onWheel)
            window.clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interaction.trackpad, isStatic, n, pitch])

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

    /* ---------------- render ---------------- */
    const rootStyle: CSSProperties = {
        ...style,
        position: "relative",
        overflow: "clip",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "stretch",
        background,
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "pan-y",
        outline: "none",
        cursor: interaction.drag && n > 1 && !isStatic ? "grab" : "default",
        ["--cvf-zoom" as any]: String(
            1 + clamp(interaction.hoverZoom, 0, 20) / 100
        ),
        ["--cvf-nav-hbg" as any]: nav.hoverBackground,
        ["--cvf-nav-hc" as any]: nav.hoverColor,
        ["--cvf-nav-dis" as any]: String(
            clamp(nav.disabledOpacity, 0, 100) / 100
        ),
    }

    const canPrev = loopOn || active > 0
    const canNext = loopOn || active < n - 1
    const target = interaction.newTab ? "_blank" : undefined
    const rel = interaction.newTab ? "noopener noreferrer" : undefined
    const sideNav = nav.show && nav.place === "sides" && n > 1
    const r = layout.radius
    const capPad = captionCfg.padding
    const gradH = Math.round(geo.H * 0.55)
    const shadowA = clamp(layout.shadow, 0, 100) / 100

    const cardBase: CSSProperties = {
        position: "absolute",
        left: geo.cx - geo.W / 2,
        top: geo.top,
        width: geo.W,
        height: geo.H,
        overflow: "hidden",
        borderRadius: r,
        background: "rgba(128, 128, 128, 0.18)",
        boxShadow:
            shadowA > 0
                ? `0 ${Math.round(geo.H * 0.06)}px ${Math.round(geo.H * 0.16)}px rgba(0,0,0,${(0.5 * shadowA).toFixed(2)})`
                : "none",
        willChange: "transform, opacity",
    }

    const mediaStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        pointerEvents: "none",
    }

    const tagPos: CSSProperties =
        tagCfg.place === "top-center"
            ? {
                  left: 0,
                  right: 0,
                  marginLeft: "auto",
                  marginRight: "auto",
                  width: "fit-content",
              }
            : tagCfg.place === "top-right"
              ? { right: tagCfg.inset }
              : { left: tagCfg.inset }

    const renderCard = (k: number) => {
        const idx = k % n
        const item = slides[idx] || EMPTY_SLIDE
        const init = cardAt(signedDistance(k, initialRef.current, geo), geo)
        const common = {
            className: "cvf-card",
            "data-cvf-i": k,
            "data-active": idx === active ? "1" : undefined,
            "data-has-link": item.link ? "1" : undefined,
            ref: (el: HTMLElement | null) => {
                cardRefs.current[k] = el
            },
            role: "group",
            "aria-roledescription": "slide",
            "aria-label": `${idx + 1} of ${n}`,
            "aria-hidden": idx === active ? undefined : true,
            style: {
                ...cardBase,
                transform: init.transform,
                opacity: init.opacity >= 1 ? undefined : init.opacity,
                visibility: init.hidden
                    ? ("hidden" as const)
                    : ("visible" as const),
                zIndex: init.z,
            },
        }
        const inner = (
            <>
                {item.type === "video" && item.video ? (
                    <video
                        className="cvf-img"
                        ref={(el) => {
                            imgRefs.current[k] = el
                        }}
                        src={
                            item.video.includes("#")
                                ? item.video
                                : item.video + "#t=0.001"
                        }
                        poster={item.poster}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        draggable={false}
                        style={{
                            ...mediaStyle,
                            transform: init.img || undefined,
                        }}
                    />
                ) : item.src ? (
                    <img
                        className="cvf-img"
                        ref={(el) => {
                            imgRefs.current[k] = el
                        }}
                        src={item.src}
                        srcSet={item.srcSet}
                        sizes={Math.round(geo.W) + "px"}
                        alt={item.alt || item.title || ""}
                        decoding="async"
                        draggable={false}
                        style={{
                            ...mediaStyle,
                            transform: init.img || undefined,
                        }}
                    />
                ) : null}
                <div
                    ref={(el) => {
                        dimRefs.current[k] = el
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: depth.dimColor,
                        opacity: init.dim,
                        pointerEvents: "none",
                    }}
                />
                {captionCfg.show && item.title && (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: gradH,
                            background: `linear-gradient(to top, ${captionCfg.gradientColor} 0%, transparent 100%)`,
                            opacity: clamp(captionCfg.gradient, 0, 100) / 100,
                            pointerEvents: "none",
                        }}
                    />
                )}
                {tagCfg.show && item.tag && (
                    <div
                        ref={(el) => {
                            tagRefs.current[k] = el
                        }}
                        style={{
                            position: "absolute",
                            top: tagCfg.inset,
                            ...tagPos,
                            padding: "7px 13px",
                            borderRadius: 999,
                            background: tagCfg.background,
                            color: tagCfg.color,
                            backdropFilter:
                                tagCfg.blur > 0
                                    ? `blur(${tagCfg.blur}px)`
                                    : undefined,
                            WebkitBackdropFilter:
                                tagCfg.blur > 0
                                    ? `blur(${tagCfg.blur}px)`
                                    : undefined,
                            whiteSpace: "nowrap",
                            pointerEvents: "none",
                            opacity: init.tag,
                            ...tagCfg.font,
                        }}
                    >
                        {item.tag}
                    </div>
                )}
                {captionCfg.show && item.title && (
                    <div
                        ref={(el) => {
                            capRefs.current[k] = el
                        }}
                        style={{
                            position: "absolute",
                            left: capPad,
                            right: capPad,
                            bottom: capPad,
                            color: captionCfg.color,
                            textAlign: captionCfg.align,
                            textTransform: captionCfg.uppercase
                                ? "uppercase"
                                : "none",
                            pointerEvents: "none",
                            opacity: init.cap,
                            ...captionCfg.font,
                        }}
                    >
                        {item.title}
                    </div>
                )}
            </>
        )
        return item.link ? (
            <a
                key={k}
                {...(common as any)}
                href={item.link}
                target={target}
                rel={rel}
                draggable={false}
            >
                {inner}
            </a>
        ) : (
            <div key={k} {...(common as any)}>
                {inner}
            </div>
        )
    }

    const btnBase: CSSProperties = {
        width: nav.size,
        height: nav.size,
        color: nav.color,
        background: nav.background,
        border: `1px solid ${nav.border}`,
    }

    const navButtons = (
        <>
            <button
                type="button"
                className="cvf-btn"
                aria-label="Previous slide"
                disabled={!canPrev}
                onClick={() => step(-1)}
                style={btnBase}
            >
                <Arrow icon={nav.icon} dir={-1} stroke={nav.stroke} />
            </button>
            <button
                type="button"
                className="cvf-btn"
                aria-label="Next slide"
                disabled={!canNext}
                onClick={() => step(1)}
                style={btnBase}
            >
                <Arrow icon={nav.icon} dir={1} stroke={nav.stroke} />
            </button>
        </>
    )

    return (
        <div
            ref={rootRef}
            className="cvf-root"
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
            onPointerOver={(e) => {
                // only the cards pause autoplay, not the arrows or the empty space around them
                if (e.pointerType === "mouse")
                    hoverRef.current = !!(e.target as HTMLElement).closest?.(
                        ".cvf-card"
                    )
            }}
            onPointerLeave={() => {
                hoverRef.current = false
            }}
            style={rootStyle}
            data-click={interaction.clickToFocus ? "1" : "0"}
            data-link="1"
            data-hz={interaction.hoverZoom > 0 ? "1" : "0"}
        >
            <style>{CSS_TEXT}</style>

            {/* CMS: the Collection List renders hidden; its items are read into slides */}
            {isCms && (
                <div
                    ref={cmsRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 1,
                        height: 1,
                        overflow: "hidden",
                        opacity: 0,
                        visibility: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {cms}
                </div>
            )}

            {!n && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: 24,
                        color: "rgba(128,128,128,0.9)",
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 14,
                        lineHeight: 1.4,
                        pointerEvents: "none",
                    }}
                >
                    {isCms
                        ? "Drop a Collection List into “CMS List”"
                        : "Add slides in the properties panel"}
                </div>
            )}

            {/* Stage: perspective lives here, cards are placed from the centre */}
            <div
                ref={stageRef}
                style={{
                    position: "relative",
                    flex: "0 1 auto",
                    width: "100%",
                    height: stageH,
                    minHeight: 0,
                    perspective: Math.max(200, depth.perspective),
                    perspectiveOrigin: "50% 50%",
                }}
            >
                {Array.from({ length: nr }).map((_, k) => renderCard(k))}
            </div>

            {navBelow && (
                <div
                    style={{
                        position: "relative",
                        flex: "none",
                        width: "100%",
                        height: nav.size,
                        marginTop: nav.distance,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: nav.gap,
                        zIndex: 2000,
                    }}
                >
                    {navButtons}
                </div>
            )}

            {sideNav && (
                <div
                    style={{
                        position: "absolute",
                        left: 16,
                        right: 16,
                        top: "50%",
                        marginTop: -nav.size / 2,
                        display: "flex",
                        justifyContent: "space-between",
                        pointerEvents: "none",
                        zIndex: 2000,
                    }}
                >
                    <span style={{ pointerEvents: "auto", display: "flex" }}>
                        <button
                            type="button"
                            className="cvf-btn"
                            aria-label="Previous slide"
                            disabled={!canPrev}
                            onClick={() => step(-1)}
                            style={btnBase}
                        >
                            <Arrow
                                icon={nav.icon}
                                dir={-1}
                                stroke={nav.stroke}
                            />
                        </button>
                    </span>
                    <span style={{ pointerEvents: "auto", display: "flex" }}>
                        <button
                            type="button"
                            className="cvf-btn"
                            aria-label="Next slide"
                            disabled={!canNext}
                            onClick={() => step(1)}
                            style={btnBase}
                        >
                            <Arrow
                                icon={nav.icon}
                                dir={1}
                                stroke={nav.stroke}
                            />
                        </button>
                    </span>
                </div>
            )}
        </div>
    )
}

CoverflowSlideshow.displayName = "Coverflow Slideshow"

/* ------------------------------------------------------------------ */
/* Property controls                                                   */
/* ------------------------------------------------------------------ */

const onOff = { enabledTitle: "On", disabledTitle: "Off" }
const showHide = { enabledTitle: "Show", disabledTitle: "Hide" }
const px = { type: ControlType.Number, min: 0, step: 1, unit: "px" } as const

const hasVideo = (p: any) =>
    !p ||
    p.source === "cms" ||
    (Array.isArray(p.items) &&
        p.items.some((item: SlideItem) => item && item.type === "video"))

addPropertyControls(CoverflowSlideshow, {
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
                    defaultValue: "Product name",
                },
                tag: {
                    type: ControlType.String,
                    title: "Tag",
                    defaultValue: "Category",
                },
                link: { type: ControlType.Link, title: "Link" },
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
            "Drop a Collection List here. Each item needs an image or video; its first text becomes the title, the second the tag, and a link on the item makes the card clickable.",
    },
    startIndex: {
        type: ControlType.Number,
        title: "Start Item",
        defaultValue: 3,
        min: 1,
        max: 24,
        step: 1,
        displayStepper: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0D0A08",
    },

    /* ---- Cards ---- */
    layout: {
        type: ControlType.Object,
        title: "Cards",
        icon: "object",
        controls: {
            ratio: {
                type: ControlType.Enum,
                title: "Ratio",
                options: [
                    "1:1",
                    "4:5",
                    "3:4",
                    "5:7",
                    "5:8",
                    "2:3",
                    "9:16",
                    "4:3",
                ],
                optionTitles: [
                    "1:1",
                    "4:5",
                    "3:4",
                    "5:7",
                    "5:8",
                    "2:3",
                    "9:16",
                    "4:3",
                ],
                defaultValue: "2:3",
            },
            fill: {
                type: ControlType.Number,
                title: "Height",
                description:
                    "Fixed height only: the most of the component's height (minus the arrows) the cards may use. With a Fit height, the cards are sized by the width.",
                defaultValue: 100,
                min: 40,
                max: 100,
                step: 1,
                unit: "%",
            },
            maxWidth: {
                type: ControlType.Number,
                title: "Max Width",
                description:
                    "Optional cap on the centre card's width. Cards already shrink so every visible card fits.",
                defaultValue: 100,
                min: 30,
                max: 100,
                step: 1,
                unit: "%",
            },
            visible: {
                type: ControlType.Number,
                title: "Visible",
                defaultValue: 5,
                min: 3,
                max: 9,
                step: 2,
                displayStepper: true,
            },
            radius: { ...px, title: "Radius", defaultValue: 36, max: 80 },
            shadow: {
                type: ControlType.Number,
                title: "Shadow",
                defaultValue: 47,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
        },
    },

    /* ---- Responsive ---- */
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
            visible: {
                type: ControlType.Number,
                title: "Visible",
                description: "Number of cards visible across the track.",
                defaultValue: 5,
                min: 3,
                max: 9,
                step: 2,
            },
            sideScale: {
                type: ControlType.Number,
                title: "Side Scale",
                defaultValue: 82,
                min: 40,
                max: 100,
                step: 1,
                unit: "%",
            },
            falloff: {
                type: ControlType.Number,
                title: "Falloff",
                defaultValue: 95,
                min: 60,
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
            visible: {
                type: ControlType.Number,
                title: "Visible",
                description: "Number of cards visible across the track.",
                defaultValue: 3,
                min: 3,
                max: 9,
                step: 2,
            },
            sideScale: {
                type: ControlType.Number,
                title: "Side Scale",
                defaultValue: 82,
                min: 40,
                max: 100,
                step: 1,
                unit: "%",
            },
            falloff: {
                type: ControlType.Number,
                title: "Falloff",
                defaultValue: 90,
                min: 60,
                max: 100,
                step: 1,
                unit: "%",
            },
        },
        defaultValue: MOBILE_DEFAULTS as any,
    },

    /* ---- Depth ---- */
    depth: {
        type: ControlType.Object,
        title: "Depth",
        icon: "effect",
        controls: {
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                description: "How far the side cards turn toward the centre.",
                defaultValue: 36,
                min: 0,
                max: 70,
                step: 1,
                unit: "°",
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                description: "Lower = stronger 3D.",
                defaultValue: 1850,
                min: 400,
                max: 4000,
                step: 50,
                unit: "px",
            },
            sideScale: {
                type: ControlType.Number,
                title: "Side Scale",
                description:
                    "Size of the side cards. The active card keeps its size.",
                defaultValue: 82,
                min: 40,
                max: 100,
                step: 1,
                unit: "%",
            },
            falloff: {
                type: ControlType.Number,
                title: "Falloff",
                description: "How much smaller each further card gets.",
                defaultValue: 95,
                min: 60,
                max: 100,
                step: 1,
                unit: "%",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                description: "The visible gap between neighbouring cards.",
                defaultValue: 12,
                min: -120,
                max: 120,
                step: 1,
                unit: "px",
            },
            lift: {
                type: ControlType.Number,
                title: "Side Lift",
                description:
                    "Raise (negative) or drop (positive) the side cards, as a share of card height.",
                defaultValue: -16,
                min: -30,
                max: 30,
                step: 1,
                unit: "%",
            },
            sideOpacity: {
                type: ControlType.Number,
                title: "Side Opacity",
                defaultValue: 100,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            dim: {
                type: ControlType.Number,
                title: "Side Dimming",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            dimColor: {
                type: ControlType.Color,
                title: "Dim Color",
                defaultValue: "#0B0806",
                hidden: (p: any) => !p.dim,
            },
        },
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
                ...showHide,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "15px",
                    variant: "Medium",
                    letterSpacing: "0.02em",
                    lineHeight: "1.2em",
                },
                hidden: (p: any) => !p.show,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => !p.show,
            },
            uppercase: {
                type: ControlType.Boolean,
                title: "Uppercase",
                defaultValue: true,
                ...onOff,
                hidden: (p: any) => !p.show,
            },
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
                hidden: (p: any) => !p.show,
            },
            padding: {
                ...px,
                title: "Padding",
                defaultValue: 18,
                max: 80,
                hidden: (p: any) => !p.show,
            },
            sideOpacity: {
                type: ControlType.Number,
                title: "Side Opacity",
                description:
                    "How visible the captions of non-active cards are.",
                defaultValue: 70,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                hidden: (p: any) => !p.show,
            },
            gradient: {
                type: ControlType.Number,
                title: "Shade",
                description:
                    "A soft gradient behind the text so it stays readable on any photo.",
                defaultValue: 70,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                hidden: (p: any) => !p.show,
            },
            gradientColor: {
                type: ControlType.Color,
                title: "Shade Color",
                defaultValue: "#000000",
                hidden: (p: any) => !p.show || !p.gradient,
            },
        },
    },

    /* ---- Tag ---- */
    tag: {
        type: ControlType.Object,
        title: "Tag",
        icon: "boolean",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Tag",
                defaultValue: true,
                ...showHide,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "12px",
                    variant: "Medium",
                    lineHeight: "1em",
                },
                hidden: (p: any) => !p.show,
            },
            color: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => !p.show,
            },
            background: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "rgba(40, 32, 28, 0.45)",
                hidden: (p: any) => !p.show,
            },
            blur: {
                ...px,
                title: "Blur",
                defaultValue: 20,
                max: 40,
                hidden: (p: any) => !p.show,
            },
            place: {
                type: ControlType.Enum,
                title: "Position",
                options: ["top-left", "top-center", "top-right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "top-left",
                displaySegmentedControl: true,
                hidden: (p: any) => !p.show,
            },
            inset: {
                ...px,
                title: "Inset",
                defaultValue: 14,
                max: 60,
                hidden: (p: any) => !p.show,
            },
        },
    },

    /* ---- Navigation ---- */
    nav: {
        type: ControlType.Object,
        title: "Navigation",
        icon: "interaction",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: true,
                ...showHide,
            },
            place: {
                type: ControlType.Enum,
                title: "Position",
                options: ["below", "sides"],
                optionTitles: ["Below", "Sides"],
                defaultValue: "below",
                displaySegmentedControl: true,
                hidden: (p: any) => !p.show,
            },
            icon: {
                type: ControlType.Enum,
                title: "Icon",
                options: ["arrow", "chevron"],
                optionTitles: ["Arrow", "Chevron"],
                defaultValue: "chevron",
                displaySegmentedControl: true,
                hidden: (p: any) => !p.show,
            },
            size: {
                ...px,
                title: "Size",
                defaultValue: 40,
                min: 28,
                max: 80,
                hidden: (p: any) => !p.show,
            },
            gap: {
                ...px,
                title: "Gap",
                defaultValue: 12,
                max: 60,
                hidden: (p: any) => !p.show || p.place !== "below",
            },
            distance: {
                ...px,
                title: "Distance",
                description: "Space between the cards and the buttons.",
                defaultValue: 64,
                max: 120,
                hidden: (p: any) => !p.show || p.place !== "below",
            },
            stroke: {
                type: ControlType.Number,
                title: "Stroke",
                defaultValue: 2,
                min: 1,
                max: 3,
                step: 0.25,
                hidden: (p: any) => !p.show,
            },
            color: {
                type: ControlType.Color,
                title: "Icon",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => !p.show,
            },
            background: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "rgba(255, 255, 255, 0)",
                hidden: (p: any) => !p.show,
            },
            border: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "rgba(255, 255, 255, 0.45)",
                hidden: (p: any) => !p.show,
            },
            hoverBackground: {
                type: ControlType.Color,
                title: "Hover Fill",
                defaultValue: "#FFFFFF",
                hidden: (p: any) => !p.show,
            },
            hoverColor: {
                type: ControlType.Color,
                title: "Hover Icon",
                defaultValue: "#0B0806",
                hidden: (p: any) => !p.show,
            },
            disabledOpacity: {
                type: ControlType.Number,
                title: "Disabled",
                description: "Opacity of an arrow that can't go any further.",
                defaultValue: 35,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                hidden: (p: any) => !p.show,
            },
        },
    },

    /* ---- Motion ---- */
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "effect",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Feel",
                description:
                    "Spring keeps momentum when you flick or click quickly. Ease is a fixed curve.",
                options: ["spring", "ease"],
                optionTitles: ["Spring", "Ease"],
                defaultValue: "spring",
                displaySegmentedControl: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 1,
                min: 0.3,
                max: 3,
                step: 0.05,
                unit: "s",
            },
            bounce: {
                type: ControlType.Number,
                title: "Bounce",
                defaultValue: 0,
                min: 0,
                max: 0.5,
                step: 0.01,
                hidden: (p: any) => p.style !== "spring",
            },
            ease: {
                type: ControlType.Enum,
                title: "Curve",
                options: ["expo", "quart", "soft"],
                optionTitles: ["Expo Out", "Quart In-Out", "Soft Out"],
                defaultValue: "expo",
                hidden: (p: any) => p.style !== "ease",
            },
            parallax: {
                type: ControlType.Number,
                title: "Parallax",
                description:
                    "The photo drifts slightly inside its card as it moves.",
                defaultValue: 15,
                min: 0,
                max: 30,
                step: 1,
                unit: "%",
            },
        },
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
                defaultValue: 2.5,
                min: 1,
                max: 12,
                step: 0.5,
                unit: "s",
                hidden: (p: any) => !p.autoplay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                description: "Pause while the pointer is over a card.",
                defaultValue: true,
                ...onOff,
                hidden: (p: any) => !p.autoplay,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                enabledTitle: "Infinite",
                disabledTitle: "Off",
            },
            videos: {
                type: ControlType.Enum,
                title: "Play Videos",
                description:
                    "All Visible: every video on screen plays. Active Only: a video plays only while its card is the active one, restarting each time.",
                options: ["visible", "active"],
                optionTitles: ["All Visible", "Active Only"],
                defaultValue: "active",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                hidden: (_p: any, root: any) => !hasVideo(root),
            },
        },
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
                description: "Clicking a side card brings it to the centre.",
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
                defaultValue: true,
                ...onOff,
            },
            hoverZoom: {
                type: ControlType.Number,
                title: "Hover Zoom",
                description: "Slow zoom on the active photo while hovering.",
                defaultValue: 4,
                min: 0,
                max: 20,
                step: 1,
                unit: "%",
            },
            newTab: {
                type: ControlType.Boolean,
                title: "Open Links",
                defaultValue: false,
                enabledTitle: "New Tab",
                disabledTitle: "Same Tab",
            },
        },
    },
})
