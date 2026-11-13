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
import { createPortal } from "react-dom"
import { animate } from "framer-motion"
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

type MediaType = "image" | "video"
type Feel = "gentle" | "smooth" | "snappy" | "bouncy" | "custom"
type Orientation = "horizontal" | "vertical" | "tilted"
type IndicatorStyle = "arc" | "line" | "dots" | "numbers" | "none"
type FadeTo = "clear" | "black" | "white"
type Floor = "off" | "reflect" | "glow" | "both"

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface MediaItem {
    type?: MediaType
    image?: ImageValue
    video?: string
    poster?: ImageValue
}

interface PlaybackProps {
    autoplay: boolean
    interval: number
    loop: boolean
    waitForVideo: boolean
    videos: "active" | "visible"
    soundButton: boolean
}

interface CardProps {
    aspectRatio: string
    size: number
    radius: number
    shadow: string
}

interface RingProps {
    orientation: Orientation
    tilt: number
    angle: number
    gap: number
    perspective: number
    visible: number
    fit: boolean
    clip: boolean
}

interface FarProps {
    opacity: number
    scale: number
    fadeTo: FadeTo
    blur: boolean
    blurAmount: number
}

interface EffectsProps {
    floor: Floor
    floorStrength: number
    glowColor: string
    parallax: boolean
    parallaxDepth: number
    cursorTilt: boolean
    tiltAngle: number
}

interface IndicatorProps {
    style: IndicatorStyle
    arrows: boolean
    width: number
    curve: number
    thumbWidth: number
    thickness: number
    dotSize: number
    font: CSSProperties
    gap: number
    trackColor: string
    thumbColor: string
}

interface InteractionProps {
    drag: boolean
    clickToFocus: boolean
    keyboard: boolean
    trackpad: boolean
    scrollSpin: boolean
    scrollSpeed: number
    pauseOnHover: boolean
    expand: boolean
    backdrop: string
}

interface LoadingProps {
    lazy: boolean
    preload: number
}

interface ResponsiveProps {
    maxWidth: number
    angle: number
    visible: number
    size: number
}

interface WhirlSlideshowProps {
    source: "manual" | "cms"
    items: MediaItem[]
    cms?: ReactNode
    startIndex: number
    playback: Partial<PlaybackProps>
    card: Partial<CardProps>
    ring: Partial<RingProps>
    far: Partial<FarProps>
    effects: Partial<EffectsProps>
    feel: Feel
    spring: any
    indicator: Partial<IndicatorProps>
    interaction: Partial<InteractionProps>
    loading: Partial<LoadingProps>
    tablet?: Partial<ResponsiveProps>
    mobile?: Partial<ResponsiveProps>
    style?: CSSProperties
}

const DEFAULT_IMAGES = [
    "https://framerusercontent.com/images/zkL34HHaz6S4VIag4n1M5jo01w.png",
    "https://framerusercontent.com/images/xxZ1y0bIVOkFfD5n7yoTKNgOneA.png",
    "https://framerusercontent.com/images/DtP2ZvW7XSLaa0N6RfCumnDThI.png",
    "https://framerusercontent.com/images/Ndtk8tiJDOesvs0b9vmah6KTLmE.png",
    "https://framerusercontent.com/images/DtP2ZvW7XSLaa0N6RfCumnDThI.png",
]

const DEFAULT_ITEMS: MediaItem[] = DEFAULT_IMAGES.map((src, i) => ({
    type: "image",
    image: { src, alt: `Slide ${i + 1}` },
}))

const PLAYBACK_DEFAULTS: PlaybackProps = {
    autoplay: true,
    interval: 3,
    loop: true,
    waitForVideo: true,
    videos: "active",
    soundButton: false,
}

const CARD_DEFAULTS: CardProps = {
    aspectRatio: "9:16",
    size: 90,
    radius: 12,
    shadow: "0px 24px 48px -20px rgba(0, 0, 0, 0.28)",
}

const RING_DEFAULTS: RingProps = {
    orientation: "horizontal",
    tilt: 20,
    angle: 20,
    gap: 20,
    perspective: 1200,
    visible: 2,
    fit: true,
    clip: false,
}

const FAR_DEFAULTS: FarProps = {
    opacity: 0.4,
    scale: 0.9,
    fadeTo: "clear",
    blur: false,
    blurAmount: 4,
}

const EFFECTS_DEFAULTS: EffectsProps = {
    floor: "off",
    floorStrength: 40,
    glowColor: "rgba(255, 140, 70, 0.6)",
    parallax: false,
    parallaxDepth: 50,
    cursorTilt: false,
    tiltAngle: 8,
}

const INDICATOR_DEFAULTS: IndicatorProps = {
    style: "arc",
    arrows: false,
    width: 340,
    curve: 22,
    thumbWidth: 80,
    thickness: 3,
    dotSize: 8,
    font: {
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "0.06em",
        lineHeight: "1em",
    },
    gap: 24,
    trackColor: "rgba(0, 0, 0, 0.12)",
    thumbColor: "#1A1A1A",
}

const INTERACTION_DEFAULTS: InteractionProps = {
    drag: true,
    clickToFocus: true,
    keyboard: true,
    trackpad: true,
    scrollSpin: false,
    scrollSpeed: 1,
    pauseOnHover: true,
    expand: false,
    backdrop: "rgba(8, 8, 10, 0.92)",
}

const LOADING_DEFAULTS: LoadingProps = {
    lazy: true,
    preload: 3,
}

const DEFAULT_SPRING = { type: "spring", duration: 0.8, bounce: 0.2 }

/* Spring presets: k = stiffness, c = damping (ζ · 2√k). */
const spring = (k: number, zeta: number) => ({ k, c: 2 * zeta * Math.sqrt(k) })
const SPRINGS: Record<string, { k: number; c: number }> = {
    gentle: spring(45, 1),
    smooth: spring(90, 1),
    snappy: spring(220, 1),
    bouncy: spring(130, 0.55),
}
/* Used while a pointer, wheel or scroll is steering the ring: tight, never a hard jump. */
const FOLLOW_SPRING = spring(700, 1)

const ARROW_SIZE = 32
const ARROW_GAP = 14

/* ------------------------------------------------------------------ */
/* Math helpers                                                        */
/* ------------------------------------------------------------------ */

const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v))
const mod = (v: number, n: number) => ((v % n) + n) % n
const pad2 = (v: number) => (v < 10 ? `0${v}` : String(v))

/* A smooth |t|: no cusp at the centre, so scale/opacity/blur ease in. */
const SOFT_E = 0.18
const SOFT_NORM = Math.sqrt(1 + SOFT_E * SOFT_E) - SOFT_E
const softAbs = (t: number) =>
    (Math.sqrt(t * t + SOFT_E * SOFT_E) - SOFT_E) / SOFT_NORM

const smoothstep = (t: number) => {
    const x = clamp(t, 0, 1)
    return x * x * (3 - 2 * x)
}

function parseRatio(value: string): number {
    const [a, b] = String(value).split(":").map(Number)
    return a > 0 && b > 0 ? a / b : 9 / 16
}

function fontPx(font: CSSProperties | undefined): number {
    const v: any = font && font.fontSize
    const n = typeof v === "number" ? v : parseFloat(v)
    return n > 0 ? n : 14
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

interface Geometry {
    n: number
    loop: boolean
    cms: boolean
    cardW: number
    cardH: number
    axisDeg: number
    stepDeg: number
    ringRadius: number
    farOpacity: number
    farScale: number
    blurPx: number
    visible: number
    fit: number
    perspective: number
    tint: "none" | "black" | "white"
    parallaxPx: number
    parallaxScale: number
    reflect: string
    radius: number
    shadow: string
}

interface Tilt {
    x: number
    y: number
    tx: number
    ty: number
}

interface ItemFrame {
    transform: string
    opacity: number
    filter: string
    hidden: boolean
    tintA: number
    media: string
}

function signedDistance(i: number, pos: number, g: Geometry): number {
    let d = i - pos
    if (g.loop) d -= g.n * Math.round(d / g.n)
    return d
}

function frameFor(i: number, pos: number, g: Geometry, tilt: Tilt): ItemFrame {
    const d = signedDistance(i, pos, g)
    const a = Math.abs(d)
    const h = softAbs(a)
    const phi = d * g.stepDeg

    const fade = Math.pow(Math.max(g.farOpacity, 0.001), h)
    let opacity = g.tint === "none" ? fade : 1
    opacity *= smoothstep(g.visible + 1 - a)
    opacity *= smoothstep((95 - Math.abs(phi)) / 25)
    if (g.loop) opacity *= smoothstep((g.n / 2 - a) * 2)

    const scale = Math.pow(Math.max(g.farScale, 0.05), h)
    const blur = g.blurPx * h

    // The centre card leans toward the cursor; the effect falls away with distance.
    const w = smoothstep(1 - a)
    const rx = tilt.x * w
    const ry = tilt.y * w
    const lean =
        rx || ry
            ? ` rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
            : ""
    const lead = g.axisDeg ? `rotateZ(${g.axisDeg}deg) ` : ""
    const unrot = g.axisDeg ? ` rotateZ(${-g.axisDeg}deg)` : ""

    let media = ""
    if (g.parallaxPx > 0) {
        const s = clamp(d, -1.5, 1.5) * g.parallaxPx
        const rad = (g.axisDeg * Math.PI) / 180
        media = `translate3d(${(-s * Math.cos(rad)).toFixed(2)}px, ${(-s * Math.sin(rad)).toFixed(2)}px, 0) scale(${g.parallaxScale.toFixed(4)})`
    }

    return {
        transform: `${lead}rotateY(${phi.toFixed(3)}deg) translate3d(0px, 0px, ${g.ringRadius.toFixed(2)}px)${unrot}${lean} scale(${scale.toFixed(4)})`,
        opacity: Number(opacity.toFixed(4)),
        filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none",
        hidden: opacity < 0.004,
        tintA: g.tint === "none" ? 0 : clamp(1 - fade, 0, 0.94),
        media,
    }
}

/* ------------------------------------------------------------------ */
/* Indicator geometry (an arc, like the ring seen from above)          */
/* ------------------------------------------------------------------ */

interface ArcTable {
    width: number
    height: number
    r: number
    lx: number
    cum: number[]
    total: number
    path: string
}

const ARC_STEPS = 96

function buildArc(width: number, thickness: number, curve: number): ArcTable {
    const r = thickness / 2
    const lx = Math.max(1, width - 2 * r)
    const cum = [0]
    let px = r
    let py = r
    for (let k = 1; k <= ARC_STEPS; k++) {
        const t = k / ARC_STEPS
        const x = r + lx * t
        const y = r + 4 * curve * t * (1 - t)
        cum.push(cum[k - 1] + Math.hypot(x - px, y - py))
        px = x
        py = y
    }
    return {
        width,
        height: curve + thickness,
        r,
        lx,
        cum,
        total: cum[ARC_STEPS],
        path: `M ${r} ${r} Q ${width / 2} ${r + 2 * curve} ${width - r} ${r}`,
    }
}

function arcLengthAtX(arc: ArcTable, x: number): number {
    const t = clamp((x - arc.r) / arc.lx, 0, 1)
    const f = t * ARC_STEPS
    const k = Math.min(Math.floor(f), ARC_STEPS - 1)
    return arc.cum[k] + (arc.cum[k + 1] - arc.cum[k]) * (f - k)
}

interface ThumbGeometry {
    total: number
    length: number
    thickness: number
    n: number
    loop: boolean
}

/* Arc-length position of the thumb's centre for a given slideshow position. */
function thumbCenter(pos: number, t: ThumbGeometry): number {
    if (t.loop) return ((mod(pos, t.n) + 0.5) / t.n) * t.total
    const f = t.n > 1 ? clamp(pos / (t.n - 1), 0, 1) : 0
    return t.length / 2 + f * (t.total - t.length)
}

/* Slideshow position for a given thumb-centre arc length. */
function positionFromThumb(s: number, t: ThumbGeometry): number {
    if (t.loop) return (s / t.total) * t.n - 0.5
    const f = clamp((s - t.length / 2) / Math.max(1, t.total - t.length), 0, 1)
    return f * (t.n - 1)
}

/* dash offset (in the 0–1000 path-length space) that parks the thumb at `pos`.
   In loop mode the dash pattern repeats once per track, so the thumb wraps
   from one end of the track to the other in step with the slides. */
function thumbDashOffset(pos: number, t: ThumbGeometry): number {
    const start = thumbCenter(pos, t) - t.length / 2 + t.thickness / 2
    const s = t.loop ? mod(start, t.total) : start
    return -(s * 1000) / t.total
}

/* ------------------------------------------------------------------ */
/* Lightbox                                                            */
/* ------------------------------------------------------------------ */

interface LightboxMedia {
    type: MediaType
    src: string
    srcSet?: string
    poster?: string
    alt?: string
}

interface LightboxProps {
    media: LightboxMedia
    index: number
    total: number
    backdrop: string
    radius: number
    muted: boolean
    canNavigate: boolean
    onClose: () => void
    onPrev: () => void
    onNext: () => void
}

const stop = (e: { stopPropagation: () => void }) => e.stopPropagation()

function Lightbox(props: LightboxProps) {
    const {
        media,
        index,
        total,
        backdrop,
        radius,
        muted,
        canNavigate,
        onClose,
        onPrev,
        onNext,
    } = props
    const [shown, setShown] = useState(false)
    const closingRef = useRef(false)
    const boxRef = useRef<HTMLDivElement>(null)

    const close = () => {
        if (closingRef.current) return
        closingRef.current = true
        setShown(false)
        window.setTimeout(onClose, 220)
    }

    useEffect(() => {
        const id = requestAnimationFrame(() => setShown(true))
        const previous = document.activeElement as HTMLElement | null
        const overflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        boxRef.current?.focus()
        return () => {
            cancelAnimationFrame(id)
            document.body.style.overflow = overflow
            if (previous && previous.focus) previous.focus()
        }
    }, [])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close()
            else if (e.key === "ArrowRight" && canNavigate) onNext()
            else if (e.key === "ArrowLeft" && canNavigate) onPrev()
            else return
            e.preventDefault()
            e.stopPropagation()
        }
        window.addEventListener("keydown", onKey, true)
        return () => window.removeEventListener("keydown", onKey, true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canNavigate, onNext, onPrev])

    const round: CSSProperties = {
        position: "absolute",
        width: 44,
        height: 44,
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.22)",
        background: "rgba(255,255,255,0.1)",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    }

    return createPortal(
        <div
            ref={boxRef}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded media"
            tabIndex={-1}
            onPointerDown={stop}
            onPointerMove={stop}
            onPointerUp={stop}
            onKeyDown={stop}
            onClick={close}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: backdrop,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                opacity: shown ? 1 : 0,
                transition: "opacity 0.22s ease",
                outline: "none",
                touchAction: "none",
            }}
        >
            <div
                onClick={stop}
                style={{
                    transform: shown ? "scale(1)" : "scale(0.94)",
                    transition:
                        "transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)",
                    maxWidth: "92vw",
                    maxHeight: "86vh",
                    display: "flex",
                }}
            >
                {media.type === "video" ? (
                    <video
                        key={media.src}
                        src={media.src}
                        poster={media.poster}
                        controls
                        autoPlay
                        loop
                        muted={muted}
                        playsInline
                        style={{
                            maxWidth: "92vw",
                            maxHeight: "86vh",
                            borderRadius: radius,
                            background: "#000",
                            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                        }}
                    />
                ) : (
                    <img
                        key={media.src}
                        src={media.src}
                        srcSet={media.srcSet}
                        alt={media.alt || ""}
                        draggable={false}
                        style={{
                            maxWidth: "92vw",
                            maxHeight: "86vh",
                            objectFit: "contain",
                            borderRadius: radius,
                            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                        }}
                    />
                )}
            </div>

            <button
                aria-label="Close"
                className="fcs-lb-btn"
                onClick={(e) => {
                    e.stopPropagation()
                    close()
                }}
                style={{ ...round, top: 20, right: 20 }}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                >
                    <path d="M3 3l10 10M13 3L3 13" />
                </svg>
            </button>
            {canNavigate && (
                <>
                    <button
                        aria-label="Previous"
                        className="fcs-lb-btn"
                        onClick={(e) => {
                            e.stopPropagation()
                            onPrev()
                        }}
                        style={{
                            ...round,
                            left: 20,
                            top: "50%",
                            marginTop: -22,
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M10 3L5 8l5 5" />
                        </svg>
                    </button>
                    <button
                        aria-label="Next"
                        className="fcs-lb-btn"
                        onClick={(e) => {
                            e.stopPropagation()
                            onNext()
                        }}
                        style={{
                            ...round,
                            right: 20,
                            top: "50%",
                            marginTop: -22,
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M6 3l5 5-5 5" />
                        </svg>
                    </button>
                </>
            )}
            <div
                style={{
                    position: "absolute",
                    bottom: 22,
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    color: "rgba(255,255,255,0.7)",
                    fontFamily: "Inter, system-ui, sans-serif",
                    fontSize: 13,
                    letterSpacing: "0.06em",
                    pointerEvents: "none",
                }}
            >
                {pad2(index + 1)} / {pad2(total)}
            </div>
        </div>,
        document.body
    )
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function ArrowButton(props: {
    dir: "prev" | "next"
    disabled: boolean
    color: string
    border: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            className="fcs-arrow"
            aria-label={props.dir === "prev" ? "Previous slide" : "Next slide"}
            disabled={props.disabled}
            onClick={props.onClick}
            style={{
                width: ARROW_SIZE,
                height: ARROW_SIZE,
                flex: "none",
                borderRadius: ARROW_SIZE / 2,
                border: `1px solid ${props.border}`,
                background: "transparent",
                color: props.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                cursor: props.disabled ? "default" : "pointer",
            }}
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path
                    d={props.dir === "prev" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}
                />
            </svg>
        </button>
    )
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

const CSS_TEXT = `
.fcs-root:focus-visible{outline:2px solid rgba(70,110,255,.75);outline-offset:4px;border-radius:8px}
.fcs-item{cursor:default}
.fcs-item *{-webkit-user-drag:none;user-drag:none}
.fcs-root[data-click="1"] .fcs-item{cursor:pointer}
.fcs-root .fcs-item[data-active="1"]{cursor:default}
.fcs-root[data-zoom="1"] .fcs-item[data-active="1"]{cursor:zoom-in}
.fcs-item::after{content:"";position:absolute;left:0;top:0;right:0;bottom:0;background:var(--fcs-tint,#000);opacity:var(--fcs-tint-a,0);pointer-events:none;border-radius:inherit;z-index:3}
.fcs-arrow{transition:background .2s ease,opacity .2s ease,transform .15s ease}
.fcs-arrow:hover:not(:disabled){background:rgba(128,128,128,.14)!important}
.fcs-arrow:active:not(:disabled){transform:scale(.92)}
.fcs-arrow:disabled{opacity:.3}
.fcs-arrow:focus-visible,.fcs-dot:focus-visible,.fcs-snd:focus-visible,.fcs-lb-btn:focus-visible{outline:2px solid rgba(70,110,255,.85);outline-offset:2px}
.fcs-lb-btn:hover{background:rgba(255,255,255,.2)!important}
.fcs-snd{transition:opacity .25s ease,background .2s ease}
.fcs-snd:hover{background:rgba(0,0,0,.65)!important}
`

/**
 * Whirl Slideshow
 *
 * A 3D ring of images, videos or CMS items with a draggable indicator.
 *
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 1160
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function WhirlSlideshow(props: WhirlSlideshowProps) {
    const {
        source = "manual",
        items = DEFAULT_ITEMS,
        cms,
        startIndex = 1,
        feel = "smooth",
        spring: customSpring,
        style,
    } = props

    const playback: PlaybackProps = { ...PLAYBACK_DEFAULTS, ...props.playback }
    const card: CardProps = { ...CARD_DEFAULTS, ...props.card }
    const ring: RingProps = { ...RING_DEFAULTS, ...props.ring }
    const far: FarProps = { ...FAR_DEFAULTS, ...props.far }
    const effects: EffectsProps = { ...EFFECTS_DEFAULTS, ...props.effects }
    const indicator: IndicatorProps = {
        ...INDICATOR_DEFAULTS,
        ...props.indicator,
    }
    const interaction: InteractionProps = {
        ...INTERACTION_DEFAULTS,
        ...props.interaction,
    }
    const loading: LoadingProps = { ...LOADING_DEFAULTS, ...props.loading }

    const isStatic = useIsStaticRenderer()
    const isCms = source === "cms"

    /* ---------------- measuring ---------------- */
    const rootRef = useRef<HTMLDivElement>(null)
    const cmsStageRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 1160, h: 560, measured: false })

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
    const [cmsCount, setCmsCount] = useState(0)

    // A scan queued while in CMS mode can fire after switching back to Manual; it must never
    // touch the manual cards (releasing them would strip their position and size).
    const isCmsRef = useRef(isCms)
    isCmsRef.current = isCms

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
            // items are often plain wrappers without a name or class, so fall back to the tag
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
        if (same) return
        // Give back anything that stopped being an item.
        prev.forEach((node) => {
            if (node && !found.includes(node)) releaseItem(node)
        })
        itemRefs.current = found
        setCmsCount(found.length)
        prepareItems()
        applyAll(posRef.current)
    }

    const releaseItem = (el: HTMLElement) => {
        if (el.hasAttribute("data-fcs-manual")) return
        el.classList.remove("fcs-item")
        ;[
            "data-fcs-i",
            "data-active",
            "role",
            "aria-roledescription",
            "aria-label",
        ].forEach((a) => el.removeAttribute(a))
        el.querySelectorAll("[data-fcs-fill]").forEach((n) => {
            n.removeAttribute("data-fcs-fill")
            ;(n as HTMLElement).style.removeProperty("width")
            ;(n as HTMLElement).style.removeProperty("height")
        })
        const st = el.style
        ;[
            "transform",
            "opacity",
            "filter",
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
            "box-shadow",
            "backface-visibility",
            "will-change",
            "--fcs-tint",
            "--fcs-tint-a",
            "-webkit-box-reflect",
        ].forEach((p) => st.removeProperty(p))
    }

    useEffect(() => {
        if (!isCms) {
            setCmsCount(0)
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
        // Watch for items being added or removed only; our own style writes are attributes.
        const mo = new MutationObserver(schedule)
        mo.observe(stage, { childList: true, subtree: true })
        return () => {
            mo.disconnect()
            if (raf) cancelAnimationFrame(raf)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCms])

    const n = isCms ? cmsCount : items.length

    /* ---------------- derived geometry ---------------- */
    const loopOn = playback.loop && n >= 3

    // Per-breakpoint overrides use the component's own width.
    const bp =
        props.mobile && size.w <= (props.mobile.maxWidth ?? 640)
            ? props.mobile
            : props.tablet && size.w <= (props.tablet.maxWidth ?? 1024)
              ? props.tablet
              : null
    const angleDeg = clamp(bp?.angle ?? ring.angle, 2, 80)
    const visible = Math.round(clamp(bp?.visible ?? ring.visible, 1, 6))
    const cardSize = clamp(bp?.size ?? card.size, 20, 100)

    const axisDeg =
        ring.orientation === "vertical"
            ? 90
            : ring.orientation === "tilted"
              ? clamp(ring.tilt, -80, 80)
              : 0
    const axisRad = (axisDeg * Math.PI) / 180
    const cosA = Math.abs(Math.cos(axisRad))
    const sinA = Math.abs(Math.sin(axisRad))
    const vertical = sinA > 0.99

    const indicatorOn =
        n > 1 && (indicator.style !== "none" || indicator.arrows)
    const dotGap = Math.max(4, Math.round(indicator.dotSize * 0.8))
    const curve = indicator.style === "arc" ? indicator.curve : 0
    const contentH =
        indicator.style === "arc" || indicator.style === "line"
            ? curve + indicator.thickness
            : indicator.style === "dots"
              ? indicator.dotSize
              : indicator.style === "numbers"
                ? Math.ceil(fontPx(indicator.font) * 1.3)
                : 0
    const rowH = indicatorOn
        ? Math.max(contentH, indicator.arrows ? ARROW_SIZE : 0)
        : 0
    const indGap = indicatorOn ? indicator.gap : 0
    const reserveY = vertical ? 0 : rowH + indGap
    const reserveX = vertical ? rowH + indGap : 0
    const availH = Math.max(60, size.h - reserveY)
    const availW = Math.max(60, size.w - reserveX)

    const cardH = Math.max(20, (availH * cardSize) / 100 / (1 + 0.8 * sinA))
    const cardW = cardH * parseRatio(card.aspectRatio)
    // Card size measured along the ring's axis, so neighbours clear each other in every direction.
    const alongCard = cosA * cardW + sinA * cardH
    const ringRadius =
        (alongCard + ring.gap) / (2 * Math.sin((angleDeg * Math.PI) / 360))
    const perspective = Math.max(200, ring.perspective)
    const farScale = clamp(far.scale, 0.05, 1.5)

    // Bounding box (half extents) of the visible part of the ring.
    let maxX = cardW / 2
    let maxY = cardH / 2
    const reach = Math.min(visible, Math.max(0, n - 1))
    for (let d = 1; d <= reach; d++) {
        const sc = Math.pow(farScale, softAbs(d))
        const phi = (d * angleDeg * Math.PI) / 180
        const z = ringRadius * (Math.cos(phi) - 1)
        const persp = perspective / (perspective - z)
        const along = ringRadius * Math.sin(phi) * persp
        const hx = (cardW / 2) * sc * persp * (1 - cosA * (1 - Math.cos(phi)))
        const hy = (cardH / 2) * sc * persp * (1 - sinA * (1 - Math.cos(phi)))
        maxX = Math.max(maxX, Math.abs(along * Math.cos(axisRad)) + hx)
        maxY = Math.max(maxY, Math.abs(along * Math.sin(axisRad)) + hy)
    }
    const fit = ring.fit
        ? clamp(Math.min(availW / 2 / maxX, availH / 2 / maxY), 0.15, 1)
        : 1

    // Cards and indicator form one group, centred in the component. The indicator sits
    // exactly `Spacing` away from the fitted ring, so it never drifts with the height.
    const visualW = 2 * maxX * fit
    const visualH = 2 * maxY * fit
    let stageCX = size.w / 2
    let stageCY = size.h / 2
    let indLeft = size.w / 2
    let indTop = 0
    if (vertical) {
        const groupW = visualW + indGap + rowH
        const groupLeft = (size.w - groupW) / 2
        stageCX = groupLeft + visualW / 2
        indLeft = groupLeft + visualW + indGap + rowH / 2
    } else {
        const groupH = visualH + indGap + rowH
        const groupTop = (size.h - groupH) / 2
        stageCY = groupTop + visualH / 2
        indTop = groupTop + visualH + indGap
    }
    const cardVW = cardW * fit
    const cardVH = cardH * fit

    const tint =
        far.fadeTo === "black"
            ? "black"
            : far.fadeTo === "white"
              ? "white"
              : "none"
    // The floor only makes sense when the ring lies flat (horizontal).
    const floorAllowed = axisDeg === 0
    const reflectOn =
        floorAllowed &&
        (effects.floor === "reflect" || effects.floor === "both")
    const glowOn =
        floorAllowed && (effects.floor === "glow" || effects.floor === "both")
    const reflectAlpha = (
        0.08 +
        (clamp(effects.floorStrength, 0, 100) / 100) * 0.5
    ).toFixed(3)
    const parallaxPx = effects.parallax
        ? alongCard * 0.1 * (clamp(effects.parallaxDepth, 0, 100) / 50)
        : 0

    const geo: Geometry = {
        n,
        loop: loopOn,
        cms: isCms,
        cardW,
        cardH,
        axisDeg,
        stepDeg: angleDeg,
        ringRadius,
        farOpacity: clamp(far.opacity, 0, 1),
        farScale,
        blurPx: far.blur ? Math.max(0, far.blurAmount) : 0,
        visible,
        fit,
        perspective,
        tint,
        parallaxPx,
        parallaxScale:
            parallaxPx > 0 ? 1 + (3 * parallaxPx) / Math.max(40, alongCard) : 1,
        reflect: reflectOn
            ? `below 4px linear-gradient(to bottom, transparent 62%, rgba(255, 255, 255, ${reflectAlpha}))`
            : "",
        radius: card.radius,
        shadow: card.shadow,
    }

    const indW = Math.max(
        80,
        Math.min(
            indicator.width,
            (vertical ? size.h : size.w) -
                24 -
                (indicator.arrows ? 2 * (ARROW_SIZE + ARROW_GAP) : 0)
        )
    )
    const arc = useMemo(
        () => buildArc(indW, indicator.thickness, curve),
        [indW, indicator.thickness, curve]
    )
    // When looping, the thumb marks one slide's share of the track so it rests fully on it.
    const maxThumb = loopOn
        ? Math.max(indicator.thickness * 3, (arc.total / Math.max(1, n)) * 0.9)
        : arc.total
    const thumb: ThumbGeometry = {
        total: arc.total,
        length: clamp(indicator.thumbWidth, indicator.thickness, maxThumb),
        thickness: indicator.thickness,
        n,
        loop: loopOn,
    }
    const dashLen = Math.max(
        0.5,
        ((thumb.length - thumb.thickness) * 1000) / arc.total
    )

    /* ---------------- engine state (refs only: no re-render per frame) ---------------- */
    const initial = clamp(startIndex - 1, 0, Math.max(0, n - 1))
    const posRef = useRef(initial)
    const velRef = useRef(0)
    const targetRef = useRef(initial)
    const rafRef = useRef(0)
    const lastFrameRef = useRef(0)
    const draggingRef = useRef(false)
    const suppressClickRef = useRef(false)
    const scrubRef = useRef(false)
    const hoverRef = useRef(false)
    const inViewRef = useRef(true)
    const lightboxRef = useRef(false)
    const lastActionRef = useRef(0)
    const dirRef = useRef(1)
    const activeRef = useRef(initial)
    const settledRef = useRef(true)
    const customRef = useRef<{ stop: () => void } | null>(null)
    const tiltRef = useRef<Tilt>({ x: 0, y: 0, tx: 0, ty: 0 })
    const parallaxOnRef = useRef(false)
    const mediaCache = useRef(new WeakMap<Element, HTMLElement | null>())
    const thumbRef = useRef<SVGPathElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)

    const geoRef = useRef(geo)
    const thumbGeoRef = useRef(thumb)
    const arcRef = useRef(arc)
    const feelRef = useRef(feel)
    const springRef = useRef(customSpring)
    const verticalRef = useRef(vertical)
    const axisRef = useRef({ c: Math.cos(axisRad), s: Math.sin(axisRad) })
    const pitchRef = useRef(1)
    geoRef.current = geo
    thumbGeoRef.current = thumb
    arcRef.current = arc
    feelRef.current = feel
    springRef.current = customSpring
    verticalRef.current = vertical
    axisRef.current = { c: Math.cos(axisRad), s: Math.sin(axisRad) }
    pitchRef.current = Math.max(24, (alongCard + ring.gap) * fit)

    const [active, setActive] = useState(initial)
    const [inView, setInView] = useState(true)
    const [thumbHot, setThumbHot] = useState(false)
    const [settledUi, setSettledUi] = useState(true)
    const [soundOn, setSoundOn] = useState(false)
    const [lightbox, setLightbox] = useState<number | null>(null)

    const getItems = () => itemRefs.current
    const getVideo = (i: number): HTMLVideoElement | null => {
        const el = itemRefs.current[i]
        return el
            ? (el.querySelector("video") as HTMLVideoElement | null)
            : null
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
        if (!g.n) return
        const list = getItems()
        const tilt = tiltRef.current
        for (let i = 0; i < g.n; i++) {
            const el = list[i]
            if (!el) continue
            const f = frameFor(i, pos, g, tilt)
            const st = el.style
            st.transform = f.transform
            st.opacity = String(f.opacity)
            st.filter = f.filter
            st.visibility = f.hidden ? "hidden" : "visible"
            st.pointerEvents = f.hidden ? "none" : ""
            st.setProperty("--fcs-tint-a", f.tintA.toFixed(3))
            if (g.parallaxPx > 0) {
                const m = getMedia(el)
                if (m) m.style.transform = f.media
            }
        }
        if (g.parallaxPx > 0) parallaxOnRef.current = true
        else if (parallaxOnRef.current) {
            parallaxOnRef.current = false
            for (let i = 0; i < g.n; i++) {
                const el = list[i]
                const m = el ? getMedia(el) : null
                if (m) m.style.transform = ""
            }
        }
        const t = thumbRef.current
        if (t)
            t.style.strokeDashoffset = String(
                thumbDashOffset(pos, thumbGeoRef.current)
            )
    }

    const markActive = (idx: number) => {
        const list = getItems()
        const n2 = geoRef.current.n
        for (let i = 0; i < n2; i++) {
            const el = list[i]
            if (!el) continue
            if (i === idx) el.setAttribute("data-active", "1")
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

    const markMoving = () => {
        if (settledRef.current) {
            settledRef.current = false
            startTransition(() => setSettledUi(false))
        }
    }
    const markSettled = () => {
        if (!settledRef.current) {
            settledRef.current = true
            startTransition(() => setSettledUi(true))
        }
    }

    const stopCustom = () => {
        if (customRef.current) {
            customRef.current.stop()
            customRef.current = null
        }
    }

    const finishAt = (target: number) => {
        const g = geoRef.current
        let x = target
        if (g.loop && g.n) {
            // keep numbers small: shift both by a whole number of laps
            const shift = g.n * Math.floor(x / g.n)
            x -= shift
            targetRef.current = targetRef.current - shift
        }
        posRef.current = x
        velRef.current = 0
        applyAll(x)
        syncActive(x)
        markSettled()
    }

    const tickRef = useRef<(now: number) => void>(() => {})
    tickRef.current = (now: number) => {
        rafRef.current = 0
        const last = lastFrameRef.current || now
        lastFrameRef.current = now
        const dt = clamp((now - last) / 1000, 0, 1 / 20)
        const scrubbing = draggingRef.current || scrubRef.current
        const custom = feelRef.current === "custom" && !scrubbing

        let settled = true
        if (!custom) {
            const sp = scrubbing
                ? FOLLOW_SPRING
                : SPRINGS[feelRef.current] || SPRINGS.smooth
            const sub = Math.max(1, Math.ceil(dt * 240))
            const h = dt / sub
            const target = targetRef.current
            let x = posRef.current
            let v = velRef.current
            for (let s = 0; s < sub; s++) {
                v += (sp.k * (target - x) - sp.c * v) * h
                x += v * h
            }
            settled =
                !scrubbing &&
                Math.abs(target - x) < 0.0004 &&
                Math.abs(v) < 0.002
            posRef.current = x
            velRef.current = v
            if (settled) finishAt(target)
        }

        const tl = tiltRef.current
        const k = 1 - Math.exp(-dt * 9)
        tl.x += (tl.tx - tl.x) * k
        tl.y += (tl.ty - tl.y) * k
        const tiltSettled =
            Math.abs(tl.tx - tl.x) < 0.02 && Math.abs(tl.ty - tl.y) < 0.02
        if (tiltSettled) {
            tl.x = tl.tx
            tl.y = tl.ty
        }

        applyAll(posRef.current)
        syncActive(posRef.current)
        if (!settled || !tiltSettled)
            rafRef.current = requestAnimationFrame((t) => tickRef.current(t))
        else lastFrameRef.current = 0
    }

    const kick = () => {
        if (typeof window === "undefined" || rafRef.current) return
        lastFrameRef.current = 0
        rafRef.current = requestAnimationFrame((t) => tickRef.current(t))
    }

    const constrain = (t: number) => {
        const g = geoRef.current
        return g.loop ? t : clamp(t, 0, Math.max(0, g.n - 1))
    }

    const startCustom = (target: number) => {
        stopCustom()
        const from = posRef.current
        if (Math.abs(target - from) < 1e-4) {
            finishAt(target)
            return
        }
        const tr =
            springRef.current && typeof springRef.current === "object"
                ? springRef.current
                : DEFAULT_SPRING
        customRef.current = animate(from, target, {
            ...(tr as any),
            onUpdate: (v: number) => {
                posRef.current = v
                applyAll(v)
                syncActive(v)
            },
            onComplete: () => {
                customRef.current = null
                finishAt(target)
            },
        })
    }

    const goTo = (t: number) => {
        targetRef.current = constrain(t)
        lastActionRef.current =
            typeof performance !== "undefined" ? performance.now() : 0
        markMoving()
        if (feelRef.current === "custom") startCustom(targetRef.current)
        else kick()
    }

    const beginScrub = () => {
        scrubRef.current = true
        stopCustom()
        markMoving()
    }
    const endScrub = (extra = 0) => {
        scrubRef.current = false
        goTo(Math.round(targetRef.current + extra))
    }

    /* Nearest equivalent target for slide index i (wraps around the ring). */
    const targetForIndex = (i: number) => {
        const g = geoRef.current
        const base = Math.round(targetRef.current)
        if (!g.loop) return clamp(i, 0, Math.max(0, g.n - 1))
        let d = i - mod(base, g.n)
        if (d > g.n / 2) d -= g.n
        if (d < -g.n / 2) d += g.n
        return base + d
    }

    const snapToNearest = (extra = 0) =>
        goTo(Math.round(targetRef.current + extra))

    /* ---------------- static styling for every item (both modes) ---------------- */
    const prepareItems = () => {
        const g = geoRef.current
        const list = getItems()
        if (g.cms) {
            const container = list[0] && list[0].parentElement
            const stage = cmsStageRef.current
            if (stage) {
                // the stage itself must always sit at the centre of the ring
                stage.style.left = "50%"
                stage.style.top = "50%"
            }
            if (container && stage && container !== stage) {
                // Break the list out of its flex layout so every item can be placed on the ring.
                let el: HTMLElement | null = container
                while (el && el !== stage) {
                    el.style.transformStyle = "preserve-3d"
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
        for (let i = 0; i < g.n; i++) {
            const el = list[i]
            if (!el) continue
            const st = el.style
            if (g.cms) {
                el.classList.add("fcs-item")
                el.setAttribute("data-fcs-i", String(i))
                el.setAttribute("role", "group")
                el.setAttribute("aria-roledescription", "slide")
                el.setAttribute("aria-label", `${i + 1} of ${g.n}`)
                st.position = "absolute"
                st.left = `${-g.cardW / 2}px`
                st.top = `${-g.cardH / 2}px`
                st.width = `${g.cardW}px`
                st.height = `${g.cardH}px`
                st.flex = "none"
                st.margin = "0px"
                st.boxSizing = "border-box"
                st.overflow = "hidden"
                st.borderRadius = `${g.radius}px`
                st.boxShadow = g.shadow
                st.backfaceVisibility = "hidden"
                st.willChange = "transform, opacity, filter"
                el.querySelectorAll("a, img").forEach((n) =>
                    n.setAttribute("draggable", "false")
                )
                // Make the template fill the card: stretch each level of a single-child chain
                // (wrapper > link > image frame), once.
                let inner: HTMLElement | null = el
                for (
                    let depth = 0;
                    depth < 4 && inner && inner.children.length === 1;
                    depth++
                ) {
                    inner = inner.children[0] as HTMLElement
                    if (inner.hasAttribute("data-fcs-fill")) continue
                    inner.setAttribute("data-fcs-fill", "1")
                    inner.style.width = "100%"
                    inner.style.height = "100%"
                    if (getComputedStyle(inner).display === "inline")
                        inner.style.display = "block"
                }
            }
            // "none" is ignored by some browsers, so clear the property to remove a reflection
            if (g.reflect) st.setProperty("-webkit-box-reflect", g.reflect)
            else st.removeProperty("-webkit-box-reflect")
            st.setProperty("--fcs-tint", g.tint === "white" ? "#fff" : "#000")
        }
        markActive(activeRef.current)
    }

    useIsoLayoutEffect(() => {
        if (isCms) discoverCms()
        prepareItems()
        applyAll(posRef.current)
    })

    /* Clean up loops and animations. */
    useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = 0
            stopCustom()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /* Re-clamp when the number of slides (or loop mode) changes. */
    const sawItemsRef = useRef(false)
    useEffect(() => {
        if (!n) return
        if (!sawItemsRef.current) {
            // first time slides exist (CMS items arrive asynchronously)
            sawItemsRef.current = true
            const idx = clamp(startIndex - 1, 0, n - 1)
            targetRef.current = idx
            posRef.current = idx
            activeRef.current = idx
            setActive(idx)
        } else {
            targetRef.current = constrain(targetRef.current)
            posRef.current = constrain(posRef.current)
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
        goTo(targetForIndex(clamp(startIndex - 1, 0, n - 1)))
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

    useEffect(() => {
        lightboxRef.current = lightbox !== null
    }, [lightbox])

    /* Autoplay. */
    useEffect(() => {
        if (!playback.autoplay || isStatic || n < 2) return
        if (
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
            return
        const every = Math.max(0.5, playback.interval) * 1000
        lastActionRef.current = performance.now()
        const id = window.setInterval(() => {
            const now = performance.now()
            const paused =
                draggingRef.current ||
                scrubRef.current ||
                lightboxRef.current ||
                (hoverRef.current && interaction.pauseOnHover) ||
                !inViewRef.current ||
                document.hidden
            if (paused) {
                lastActionRef.current = now
                return
            }
            const g = geoRef.current
            const base = Math.round(targetRef.current)
            const advance = () => {
                if (g.loop) goTo(base + 1)
                else {
                    let dir = dirRef.current
                    if (base + dir > g.n - 1 || base + dir < 0) dir = -dir
                    dirRef.current = dir
                    goTo(base + dir)
                }
            }
            // "Finish videos": hold on a playing video, move on as soon as it ends.
            const vid = playback.waitForVideo
                ? getVideo(activeRef.current)
                : null
            if (vid) {
                if (!vid.paused && !vid.ended) {
                    lastActionRef.current = now
                    return
                }
                if (vid.ended) {
                    advance()
                    return
                }
            }
            if (now - lastActionRef.current < every) return
            advance()
        }, 200)
        return () => window.clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        playback.autoplay,
        playback.interval,
        playback.waitForVideo,
        isStatic,
        n,
        interaction.pauseOnHover,
    ])

    /* Videos: play the active one (or every visible one), pause the rest. */
    const [activeHasVideo, setActiveHasVideo] = useState(false)
    useEffect(() => {
        const finish = playback.autoplay && playback.waitForVideo
        let hasVideo = false
        for (let i = 0; i < n; i++) {
            const v = getVideo(i)
            if (!v) continue
            let dist = Math.abs(i - active)
            if (loopOn) {
                const m = mod(i - active, n)
                dist = Math.min(m, n - m)
            }
            if (dist === 0) hasVideo = true
            const shouldPlay =
                !isStatic &&
                inView &&
                lightbox === null &&
                (playback.videos === "visible" ? dist <= visible : dist === 0)
            v.loop = !(finish && dist === 0)
            v.muted = !(soundOn && dist === 0)
            if (shouldPlay) {
                if (finish && dist === 0 && v.ended) v.currentTime = 0
                const p = v.play()
                if (p && typeof p.catch === "function")
                    p.catch(() => {
                        // sound was blocked by the browser: fall back to muted playback
                        v.muted = true
                        const retry = v.play()
                        if (retry && typeof retry.catch === "function")
                            retry.catch(() => {})
                    })
            } else {
                v.pause()
            }
        }
        setActiveHasVideo(hasVideo)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        active,
        n,
        loopOn,
        playback.videos,
        playback.waitForVideo,
        playback.autoplay,
        isStatic,
        inView,
        visible,
        items,
        soundOn,
        lightbox,
        cmsCount,
    ])

    /* ---------------- dragging the slideshow ---------------- */
    const dragRef = useRef<{
        id: number
        startX: number
        startY: number
        startTarget: number
        moved: boolean
        tapIndex: number
        samples: { t: number; v: number }[]
    } | null>(null)

    const rubber = (x: number) => {
        const g = geoRef.current
        if (g.loop) return x
        const max = Math.max(0, g.n - 1)
        if (x < 0) return x * 0.35
        if (x > max) return max + (x - max) * 0.35
        return x
    }

    const lightboxMedia = (i: number): LightboxMedia | null => {
        if (!isCms) {
            const item = items[i]
            if (!item) return null
            if (item.type === "video" && item.video)
                return {
                    type: "video",
                    src: item.video,
                    poster: item.poster?.src,
                }
            const img = item.image?.src
                ? item.image
                : {
                      src: DEFAULT_IMAGES[i % DEFAULT_IMAGES.length],
                      alt: `Slide ${i + 1}`,
                  }
            return {
                type: "image",
                src: img.src as string,
                srcSet: img.srcSet,
                alt: img.alt,
            }
        }
        const el = getItems()[i]
        if (!el) return null
        const v = el.querySelector("video") as HTMLVideoElement | null
        if (v && (v.currentSrc || v.src))
            return {
                type: "video",
                src: v.currentSrc || v.src,
                poster: v.poster,
            }
        const img = el.querySelector("img") as HTMLImageElement | null
        if (img && (img.currentSrc || img.src)) {
            const set = img.srcset
                ? img.srcset.split(",").pop()?.trim().split(" ")[0]
                : ""
            return {
                type: "image",
                src: set || img.currentSrc || img.src,
                alt: img.alt,
            }
        }
        return null
    }

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (isStatic || n < 2) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        const hit = (e.target as HTMLElement).closest?.(
            "[data-fcs-i]"
        ) as HTMLElement | null
        dragRef.current = {
            id: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            startTarget: targetRef.current,
            moved: false,
            tapIndex: hit ? Number(hit.getAttribute("data-fcs-i")) : -1,
            samples: [],
        }
    }

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const root = rootRef.current
        if (!root) return
        const rect = root.getBoundingClientRect()
        const d = dragRef.current

        // Cursor tilt: only for a hovering mouse, never while dragging.
        if (
            effects.cursorTilt &&
            !d &&
            !draggingRef.current &&
            e.pointerType === "mouse" &&
            rect.width
        ) {
            const nx = clamp(
                ((e.clientX - rect.left) / rect.width - 0.5) * 2,
                -1,
                1
            )
            const ny = clamp(
                ((e.clientY - rect.top) / rect.height - 0.5) * 2,
                -1,
                1
            )
            // x = rotateX, y = rotateY. A pointer above the card tips its top forward (negative ny).
            tiltRef.current.tx = -ny * effects.tiltAngle
            tiltRef.current.ty = nx * effects.tiltAngle
            kick()
        }

        if (!d || e.pointerId !== d.id) return
        const screenScale = root.offsetWidth ? rect.width / root.offsetWidth : 1
        const ax = axisRef.current
        const along =
            ((e.clientX - d.startX) * ax.c + (e.clientY - d.startY) * ax.s) /
            (screenScale || 1)
        if (!d.moved) {
            if (!interaction.drag || Math.abs(along) < 6) return
            d.moved = true
            draggingRef.current = true
            suppressClickRef.current = true
            stopCustom()
            markMoving()
            try {
                root.setPointerCapture(e.pointerId)
            } catch (err) {
                /* pointer already released */
            }
            root.style.cursor = "grabbing"
        }
        const t = rubber(d.startTarget - along / pitchRef.current)
        targetRef.current = t
        const now = performance.now()
        d.samples.push({ t: now, v: t })
        while (d.samples.length > 2 && now - d.samples[0].t > 140)
            d.samples.shift()
        lastActionRef.current = now
        kick()
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
            let extra = 0
            if (!cancelled && d.samples.length > 1) {
                const a = d.samples[0]
                const b = d.samples[d.samples.length - 1]
                const dt = (b.t - a.t) / 1000
                if (dt > 0.01) extra = clamp(((b.v - a.v) / dt) * 0.15, -2, 2)
            }
            snapToNearest(extra)
        } else if (!cancelled && d.tapIndex >= 0) {
            if (d.tapIndex === activeRef.current) {
                if (interaction.expand && lightboxMedia(d.tapIndex))
                    setLightbox(d.tapIndex)
            } else if (interaction.clickToFocus) {
                goTo(targetForIndex(d.tapIndex))
            }
        }
    }

    /* ---------------- trackpad swipe + scroll spin ---------------- */
    useEffect(() => {
        const el = rootRef.current
        if (!el || !interaction.trackpad || isStatic || n < 2) return
        let timer = 0
        const onWheel = (e: WheelEvent) => {
            if (lightboxRef.current || draggingRef.current) return
            const ax = Math.abs(e.deltaX)
            const ay = Math.abs(e.deltaY)
            if (ax < 1 || ax <= ay * 1.2) return // vertical scrolling stays with the page
            e.preventDefault()
            const dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX
            beginScrub()
            targetRef.current = constrain(
                targetRef.current + (dx / pitchRef.current) * 0.9
            )
            lastActionRef.current = performance.now()
            kick()
            window.clearTimeout(timer)
            timer = window.setTimeout(() => endScrub(0), 140)
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            el.removeEventListener("wheel", onWheel)
            window.clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interaction.trackpad, isStatic, n])

    useEffect(() => {
        if (!interaction.scrollSpin || isStatic || n < 2) return
        let last = window.scrollY
        let timer = 0
        const onScroll = () => {
            const y = window.scrollY
            const dy = y - last
            last = y
            if (
                !dy ||
                !inViewRef.current ||
                draggingRef.current ||
                lightboxRef.current
            )
                return
            beginScrub()
            targetRef.current = constrain(
                targetRef.current + (dy / 420) * interaction.scrollSpeed
            )
            lastActionRef.current = performance.now()
            kick()
            window.clearTimeout(timer)
            timer = window.setTimeout(() => endScrub(0), 160)
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interaction.scrollSpin, interaction.scrollSpeed, isStatic, n])

    useEffect(() => {
        if (effects.cursorTilt) return
        const tl = tiltRef.current
        if (tl.x || tl.y || tl.tx || tl.ty) {
            tl.tx = 0
            tl.ty = 0
            kick()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effects.cursorTilt])

    /* ---------------- dragging the indicator thumb ---------------- */
    const indDragRef = useRef<{ id: number; offset: number } | null>(null)

    const arcLengthFromClient = (clientX: number, clientY: number) => {
        const svg = svgRef.current
        const a = arcRef.current
        if (!svg) return 0
        const rect = svg.getBoundingClientRect()
        if (verticalRef.current) {
            const k = rect.height ? a.width / rect.height : 1
            return arcLengthAtX(
                a,
                (clientY - (rect.top + rect.height / 2)) * k + a.width / 2
            )
        }
        const k = rect.width ? a.width / rect.width : 1
        return arcLengthAtX(a, (clientX - rect.left) * k)
    }

    const setFromThumb = (centerS: number) => {
        const g = geoRef.current
        const p = positionFromThumb(centerS, thumbGeoRef.current)
        const t = g.loop
            ? p + g.n * Math.round((targetRef.current - p) / g.n)
            : clamp(p, 0, g.n - 1)
        targetRef.current = t
        lastActionRef.current = performance.now()
        kick()
    }

    const onIndicatorDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (isStatic || n < 2) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        e.stopPropagation()
        const s = arcLengthFromClient(e.clientX, e.clientY)
        const tg = thumbGeoRef.current
        const center = thumbCenter(posRef.current, tg)
        const onThumb = Math.abs(s - center) <= tg.length / 2 + 10
        indDragRef.current = {
            id: e.pointerId,
            offset: onThumb ? s - center : 0,
        }
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch (err) {
            /* ignore */
        }
        draggingRef.current = true
        stopCustom()
        markMoving()
        setThumbHot(true)
        setFromThumb(s - indDragRef.current.offset)
    }

    const onIndicatorMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const d = indDragRef.current
        if (!d || e.pointerId !== d.id) return
        setFromThumb(arcLengthFromClient(e.clientX, e.clientY) - d.offset)
    }

    const onIndicatorUp = (e: ReactPointerEvent<HTMLDivElement>) => {
        const d = indDragRef.current
        if (!d || e.pointerId !== d.id) return
        indDragRef.current = null
        draggingRef.current = false
        setThumbHot(false)
        snapToNearest(0)
    }

    /* Items can be links (CMS lists). Only the centre card may follow its link, never after a drag. */
    const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
        const hit = (e.target as HTMLElement).closest?.(
            "[data-fcs-i]"
        ) as HTMLElement | null
        if (!hit) return
        const idx = Number(hit.getAttribute("data-fcs-i"))
        if (
            suppressClickRef.current ||
            idx !== activeRef.current ||
            interaction.expand
        ) {
            e.preventDefault()
            e.stopPropagation()
        }
    }

    /* ---------------- keyboard ---------------- */
    const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!interaction.keyboard || n < 2) return
        const base = Math.round(targetRef.current)
        if (e.key === "ArrowRight" || e.key === "ArrowDown") goTo(base + 1)
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goTo(base - 1)
        else if (e.key === "Home" && !loopOn) goTo(0)
        else if (e.key === "End" && !loopOn) goTo(n - 1)
        else return
        e.preventDefault()
    }

    const step = (dir: number) => goTo(Math.round(targetRef.current) + dir)

    /* ---------------- lazy loading (manual media) ---------------- */
    const loadedRef = useRef(new Set<number>())
    const nearby = Math.max(loading.preload, visible + 1)
    const isNear = (i: number) => {
        let dist = Math.abs(i - active)
        if (loopOn) {
            const m = mod(i - active, n)
            dist = Math.min(m, n - m)
        }
        return dist <= nearby
    }

    /* ---------------- render ---------------- */
    const rootStyle: CSSProperties = {
        ...style,
        position: "relative",
        overflow: ring.clip ? "hidden" : "visible",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: sinA > 0.7 ? "pan-x" : "pan-y",
        outline: "none",
        cursor: interaction.drag && n > 1 && !isStatic ? "grab" : "default",
    }

    const rootData = {
        "data-click": interaction.clickToFocus ? "1" : "0",
        "data-zoom": interaction.expand ? "1" : "0",
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
                    border: "1px dashed rgba(128,128,128,0.5)",
                    borderRadius: 12,
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

    const frames = !isCms
        ? items.map((_, i) => frameFor(i, posRef.current, geo, tiltRef.current))
        : []
    const stageVisible = size.measured && (!isCms || n > 0)

    const thumbStroke = indicator.thickness + (thumbHot ? 2 : 0)
    const prevDisabled = !loopOn && active <= 0
    const nextDisabled = !loopOn && active >= n - 1

    const rowStyle: CSSProperties = vertical
        ? {
              position: "absolute",
              left: indLeft,
              top: size.h / 2,
              transform: "translate(-50%, -50%) rotate(90deg)",
              width: "max-content",
          }
        : {
              position: "absolute",
              left: indLeft,
              top: indTop,
              transform: "translateX(-50%)",
              width: "max-content",
          }

    const numFont: CSSProperties = {
        ...INDICATOR_DEFAULTS.font,
        ...indicator.font,
    }

    const mediaStyle: CSSProperties = {
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
    }

    const showSound =
        playback.soundButton && activeHasVideo && settledUi && lightbox === null
    const lbMedia = lightbox !== null ? lightboxMedia(lightbox) : null

    return (
        <div
            ref={rootRef}
            className="fcs-root"
            role="region"
            aria-roledescription="carousel"
            aria-label="Media slideshow"
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
            onPointerLeave={() => {
                hoverRef.current = false
                if (effects.cursorTilt) {
                    tiltRef.current.tx = 0
                    tiltRef.current.ty = 0
                    kick()
                }
            }}
            style={rootStyle}
            {...rootData}
        >
            <style>{CSS_TEXT}</style>

            {/* Floor glow */}
            {glowOn && stageVisible && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: stageCX - cardVW * 0.8,
                        top: stageCY + cardVH / 2 - cardVW * 0.08,
                        width: cardVW * 1.6,
                        height: cardVW * 0.3,
                        background: `radial-gradient(ellipse at 50% 50%, ${effects.glowColor} 0%, transparent 68%)`,
                        filter: "blur(18px)",
                        opacity: clamp(effects.floorStrength, 0, 100) / 100,
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* 3D stage */}
            <div
                style={{
                    position: "absolute",
                    left: stageCX - size.w / 2,
                    top: stageCY - cardH / 2,
                    width: size.w,
                    height: cardH,
                    transform: fit < 1 ? `scale(${fit})` : undefined,
                    transformOrigin: "50% 50%",
                    visibility: stageVisible ? "visible" : "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        perspective,
                        perspectiveOrigin: "50% 50%",
                    }}
                >
                    <div
                        ref={cmsStageRef}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: 0,
                            height: 0,
                            transformStyle: "preserve-3d",
                            transform: `translate3d(0px, 0px, ${(-ringRadius).toFixed(2)}px)`,
                        }}
                    >
                        {isCms
                            ? cms
                            : items.map((item, i) => {
                                  const f = frames[i]
                                  const isVideo =
                                      item.type === "video" && !!item.video
                                  // ResponsiveImage controls can't carry defaults, so empty slots
                                  // fall back to the starter images until real media is added.
                                  const image: ImageValue = item.image?.src
                                      ? item.image
                                      : {
                                            src: DEFAULT_IMAGES[
                                                i % DEFAULT_IMAGES.length
                                            ],
                                            alt: `Slide ${i + 1}`,
                                        }
                                  const near = !loading.lazy || isNear(i)
                                  if (near) loadedRef.current.add(i)
                                  const mountImage =
                                      !loading.lazy || loadedRef.current.has(i)
                                  return (
                                      <div
                                          key={i}
                                          className="fcs-item"
                                          data-fcs-i={i}
                                          data-fcs-manual="1"
                                          data-active={
                                              i === active ? "1" : undefined
                                          }
                                          ref={(el) => {
                                              itemRefs.current[i] = el
                                          }}
                                          role="group"
                                          aria-roledescription="slide"
                                          aria-label={`${i + 1} of ${n}`}
                                          aria-hidden={i !== active}
                                          style={{
                                              position: "absolute",
                                              left: -cardW / 2,
                                              top: -cardH / 2,
                                              width: cardW,
                                              height: cardH,
                                              borderRadius: card.radius,
                                              boxShadow: card.shadow,
                                              overflow: "hidden",
                                              background:
                                                  "rgba(128, 128, 128, 0.16)",
                                              backfaceVisibility: "hidden",
                                              WebkitBackfaceVisibility:
                                                  "hidden",
                                              willChange:
                                                  "transform, opacity, filter",
                                              transform: f.transform,
                                              opacity: f.opacity,
                                              filter: f.filter,
                                              visibility: f.hidden
                                                  ? "hidden"
                                                  : "visible",
                                          }}
                                      >
                                          {isVideo ? (
                                              near ? (
                                                  <video
                                                      src={
                                                          item.video!.includes(
                                                              "#"
                                                          )
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
                                          ) : mountImage && image.src ? (
                                              <img
                                                  src={image.src}
                                                  srcSet={image.srcSet}
                                                  sizes={`${Math.round(cardW)}px`}
                                                  alt={image.alt || ""}
                                                  decoding="async"
                                                  draggable={false}
                                                  style={mediaStyle}
                                              />
                                          ) : null}
                                      </div>
                                  )
                              })}
                    </div>
                </div>
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
                        border: "1px dashed rgba(128,128,128,0.5)",
                        borderRadius: 12,
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

            {/* Sound button for the active video */}
            {showSound && (
                <button
                    type="button"
                    className="fcs-snd"
                    aria-label={soundOn ? "Mute video" : "Unmute video"}
                    aria-pressed={soundOn}
                    onPointerDown={stop}
                    onClick={() => setSoundOn((s) => !s)}
                    style={{
                        position: "absolute",
                        left: stageCX + cardVW / 2 - 14 - 36,
                        top: stageCY + cardVH / 2 - 14 - 36,
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.28)",
                        background: "rgba(0,0,0,0.5)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        cursor: "pointer",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        zIndex: 5,
                    }}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path
                            d="M11 5 6 9H3v6h3l5 4V5z"
                            fill="currentColor"
                            stroke="none"
                        />
                        {soundOn ? (
                            <>
                                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                                <path d="M18.5 5.5a9 9 0 0 1 0 13" />
                            </>
                        ) : (
                            <path d="M16 9l5 6M21 9l-5 6" />
                        )}
                    </svg>
                </button>
            )}

            {/* Indicator */}
            {indicatorOn && (
                <div
                    onPointerDown={stop}
                    style={{
                        ...rowStyle,
                        display: "flex",
                        alignItems: "center",
                        gap: ARROW_GAP,
                        height: rowH,
                        visibility: size.measured ? "visible" : "hidden",
                    }}
                >
                    {indicator.arrows && (
                        <ArrowButton
                            dir="prev"
                            disabled={prevDisabled}
                            color={indicator.thumbColor}
                            border={indicator.trackColor}
                            onClick={() => step(-1)}
                        />
                    )}

                    {(indicator.style === "arc" ||
                        indicator.style === "line") && (
                        <div
                            aria-hidden="true"
                            onPointerDown={onIndicatorDown}
                            onPointerMove={onIndicatorMove}
                            onPointerUp={onIndicatorUp}
                            onPointerCancel={onIndicatorUp}
                            onPointerEnter={() => setThumbHot(true)}
                            onPointerLeave={() => {
                                if (!indDragRef.current) setThumbHot(false)
                            }}
                            style={{
                                padding: "22px 12px 0",
                                margin: "-22px -12px 0",
                                boxSizing: "content-box",
                                cursor: indDragRef.current
                                    ? "grabbing"
                                    : "grab",
                                touchAction: "none",
                            }}
                        >
                            <svg
                                ref={svgRef}
                                width={arc.width}
                                height={arc.height}
                                viewBox={`0 0 ${arc.width} ${arc.height}`}
                                style={{
                                    display: "block",
                                    overflow: "visible",
                                }}
                            >
                                <path
                                    d={arc.path}
                                    fill="none"
                                    stroke={indicator.trackColor}
                                    strokeWidth={indicator.thickness}
                                    strokeLinecap="round"
                                />
                                <path
                                    ref={thumbRef}
                                    d={arc.path}
                                    pathLength={1000}
                                    fill="none"
                                    stroke={indicator.thumbColor}
                                    strokeWidth={thumbStroke}
                                    strokeLinecap="round"
                                    strokeDasharray={`${dashLen} ${1000 - dashLen}`}
                                    style={{
                                        strokeDashoffset: thumbDashOffset(
                                            posRef.current,
                                            thumb
                                        ),
                                        transition: "stroke-width 0.2s ease",
                                    }}
                                />
                            </svg>
                        </div>
                    )}

                    {indicator.style === "dots" && (
                        <div
                            role="tablist"
                            aria-label="Choose slide"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: dotGap,
                            }}
                        >
                            {Array.from({ length: n }).map((_, i) => {
                                const on = i === active
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        role="tab"
                                        className="fcs-dot"
                                        aria-label={`Slide ${i + 1}`}
                                        aria-selected={on}
                                        onClick={() => goTo(targetForIndex(i))}
                                        style={{
                                            width: on
                                                ? indicator.dotSize * 2.4
                                                : indicator.dotSize,
                                            height: indicator.dotSize,
                                            borderRadius: indicator.dotSize,
                                            border: 0,
                                            padding: 0,
                                            cursor: "pointer",
                                            background: on
                                                ? indicator.thumbColor
                                                : indicator.trackColor,
                                            transition:
                                                "width 0.3s ease, background 0.3s ease",
                                        }}
                                    />
                                )
                            })}
                        </div>
                    )}

                    {indicator.style === "numbers" && (
                        <div
                            aria-live="polite"
                            style={{
                                ...numFont,
                                color: indicator.thumbColor,
                                fontVariantNumeric: "tabular-nums",
                                whiteSpace: "nowrap",
                                minWidth: 64,
                                textAlign: "center",
                            }}
                        >
                            {pad2(active + 1)}
                            <span style={{ opacity: 0.4 }}> / {pad2(n)}</span>
                        </div>
                    )}

                    {indicator.style === "none" && (
                        <div style={{ width: 12 }} />
                    )}

                    {indicator.arrows && (
                        <ArrowButton
                            dir="next"
                            disabled={nextDisabled}
                            color={indicator.thumbColor}
                            border={indicator.trackColor}
                            onClick={() => step(1)}
                        />
                    )}
                </div>
            )}

            {/* Lightbox */}
            {lightbox !== null &&
                lbMedia &&
                typeof document !== "undefined" && (
                    <Lightbox
                        media={lbMedia}
                        index={lightbox}
                        total={n}
                        backdrop={interaction.backdrop}
                        radius={Math.min(card.radius, 20)}
                        muted={!soundOn}
                        canNavigate={n > 1}
                        onClose={() => setLightbox(null)}
                        onPrev={() => {
                            const next = mod(lightbox - 1, n)
                            goTo(targetForIndex(next))
                            setLightbox(next)
                        }}
                        onNext={() => {
                            const next = mod(lightbox + 1, n)
                            goTo(targetForIndex(next))
                            setLightbox(next)
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
    p.source === "cms" ||
    (Array.isArray(p.items) &&
        p.items.some((item: MediaItem) => item && item.type === "video"))

WhirlSlideshow.displayName = "Whirl Slideshow"

addPropertyControls(WhirlSlideshow, {
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
        title: "Media",
        maxCount: 24,
        description: "Used when Source is Manual.",
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
            },
        },
        defaultValue: DEFAULT_ITEMS as any,
    },
    cms: {
        type: ControlType.Slot,
        title: "CMS List",
        maxCount: 1,
        description:
            "Used when Source is CMS. Drop a Collection List here and make its item fill the card (width and height 100%).",
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
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            interval: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: 3,
                min: 1,
                max: 10,
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
            videos: {
                type: ControlType.Enum,
                title: "Play Videos",
                options: ["active", "visible"],
                optionTitles: ["Active Only", "All Visible"],
                defaultValue: "active",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                hidden: (_p: any, root: any) => !hasVideo(root),
            },
            waitForVideo: {
                type: ControlType.Boolean,
                title: "Finish Videos",
                description: "Autoplay waits for a video to end.",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                hidden: (p: any, root: any) => !p.autoplay || !hasVideo(root),
            },
            soundButton: {
                type: ControlType.Boolean,
                title: "Sound Button",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                hidden: (_p: any, root: any) => !hasVideo(root),
            },
        },
        defaultValue: PLAYBACK_DEFAULTS as any,
    },

    /* ---- Layout ---- */
    card: {
        type: ControlType.Object,
        title: "Card",
        icon: "object",
        controls: {
            aspectRatio: {
                type: ControlType.Enum,
                title: "Ratio",
                options: ["9:16", "3:4", "4:5", "1:1", "5:4", "4:3", "16:9"],
                optionTitles: [
                    "9:16",
                    "3:4",
                    "4:5",
                    "1:1",
                    "5:4",
                    "4:3",
                    "16:9",
                ],
                defaultValue: "9:16",
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 90,
                min: 30,
                max: 100,
                step: 1,
                unit: "%",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 12,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue: CARD_DEFAULTS.shadow,
            },
        },
        defaultValue: CARD_DEFAULTS as any,
    },
    ring: {
        type: ControlType.Object,
        title: "3D Ring",
        icon: "object",
        controls: {
            orientation: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["horizontal", "vertical", "tilted"],
                optionTitles: ["Horizontal", "Vertical", "Tilted"],
                defaultValue: "horizontal",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                defaultValue: 20,
                min: -80,
                max: 80,
                step: 1,
                unit: "°",
                hidden: (p: any) => p.orientation !== "tilted",
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 20,
                min: 6,
                max: 50,
                step: 1,
                unit: "°",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 20,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                defaultValue: 1200,
                min: 400,
                max: 3000,
                step: 50,
                unit: "px",
            },
            visible: {
                type: ControlType.Number,
                title: "Side Cards",
                defaultValue: 2,
                min: 1,
                max: 4,
                step: 1,
                displayStepper: true,
            },
            fit: {
                type: ControlType.Boolean,
                title: "Auto Fit",
                description: "Shrinks the ring to stay inside the component.",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            clip: {
                type: ControlType.Boolean,
                title: "Clip",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
        defaultValue: RING_DEFAULTS as any,
    },

    /* ---- Look ---- */
    far: {
        type: ControlType.Object,
        title: "Far Cards",
        icon: "effect",
        controls: {
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.4,
                min: 0,
                max: 1,
                step: 0.01,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                defaultValue: 0.9,
                min: 0.5,
                max: 1,
                step: 0.01,
            },
            fadeTo: {
                type: ControlType.Enum,
                title: "Fade To",
                description:
                    "Clear fades out. Black or White tints the card instead.",
                options: ["clear", "black", "white"],
                optionTitles: ["Clear", "Black", "White"],
                defaultValue: "clear",
                displaySegmentedControl: true,
            },
            blur: {
                type: ControlType.Boolean,
                title: "Blur",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            blurAmount: {
                type: ControlType.Number,
                title: "Blur Amount",
                defaultValue: 4,
                min: 0,
                max: 24,
                step: 0.5,
                unit: "px",
                hidden: (p: any) => !p.blur,
            },
        },
        defaultValue: FAR_DEFAULTS as any,
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        icon: "effect",
        controls: {
            floor: {
                type: ControlType.Enum,
                title: "Floor",
                description:
                    "Horizontal ring only. Reflection works in Chrome, Safari and Edge.",
                options: ["off", "reflect", "glow", "both"],
                optionTitles: ["Off", "Reflect", "Glow", "Both"],
                defaultValue: "off",
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                hidden: (_p: any, root: any) =>
                    !!root &&
                    !!root.ring &&
                    !!root.ring.orientation &&
                    root.ring.orientation !== "horizontal",
            },
            floorStrength: {
                type: ControlType.Number,
                title: "Strength",
                defaultValue: 40,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                hidden: (p: any, root: any) =>
                    p.floor === "off" ||
                    (!!root &&
                        !!root.ring &&
                        !!root.ring.orientation &&
                        root.ring.orientation !== "horizontal"),
            },
            glowColor: {
                type: ControlType.Color,
                title: "Glow Color",
                defaultValue: "rgba(255, 140, 70, 0.6)",
                hidden: (p: any, root: any) =>
                    (p.floor !== "glow" && p.floor !== "both") ||
                    (!!root &&
                        !!root.ring &&
                        !!root.ring.orientation &&
                        root.ring.orientation !== "horizontal"),
            },
            parallax: {
                type: ControlType.Boolean,
                title: "Parallax",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            parallaxDepth: {
                type: ControlType.Number,
                title: "Depth",
                defaultValue: 50,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                hidden: (p: any) => !p.parallax,
            },
            cursorTilt: {
                type: ControlType.Boolean,
                title: "Cursor Tilt",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            tiltAngle: {
                type: ControlType.Number,
                title: "Tilt Angle",
                defaultValue: 8,
                min: 2,
                max: 20,
                step: 1,
                unit: "°",
                hidden: (p: any) => !p.cursorTilt,
            },
        },
        defaultValue: EFFECTS_DEFAULTS as any,
    },

    /* ---- Motion ---- */
    feel: {
        type: ControlType.Enum,
        title: "Feel",
        options: ["gentle", "smooth", "snappy", "bouncy", "custom"],
        optionTitles: ["Gentle", "Smooth", "Snappy", "Bouncy", "Custom"],
        defaultValue: "smooth",
    },
    spring: {
        type: ControlType.Transition,
        title: "Custom Spring",
        defaultValue: DEFAULT_SPRING as any,
        hidden: (p: any) => p.feel !== "custom",
    },

    /* ---- Indicator ---- */
    indicator: {
        type: ControlType.Object,
        title: "Indicator",
        icon: "interaction",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["arc", "line", "dots", "numbers", "none"],
                optionTitles: ["Arc", "Line", "Dots", "Numbers", "None"],
                defaultValue: "arc",
            },
            arrows: {
                type: ControlType.Boolean,
                title: "Arrows",
                defaultValue: false,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 340,
                min: 120,
                max: 900,
                step: 5,
                unit: "px",
                hidden: (p: any) => p.style !== "arc" && p.style !== "line",
            },
            curve: {
                type: ControlType.Number,
                title: "Curve",
                defaultValue: 22,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                hidden: (p: any) => p.style !== "arc",
            },
            thumbWidth: {
                type: ControlType.Number,
                title: "Thumb",
                defaultValue: 80,
                min: 16,
                max: 300,
                step: 2,
                unit: "px",
                hidden: (p: any) => p.style !== "arc" && p.style !== "line",
            },
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 3,
                min: 1,
                max: 10,
                step: 1,
                unit: "px",
                hidden: (p: any) => p.style !== "arc" && p.style !== "line",
            },
            dotSize: {
                type: ControlType.Number,
                title: "Dot Size",
                defaultValue: 8,
                min: 4,
                max: 20,
                step: 1,
                unit: "px",
                hidden: (p: any) => p.style !== "dots",
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "14px",
                    variant: "Medium",
                    letterSpacing: "0.06em",
                    lineHeight: "1em",
                },
                hidden: (p: any) => p.style !== "numbers",
            },
            gap: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 24,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                hidden: (p: any) => p.style === "none" && !p.arrows,
            },
            trackColor: {
                type: ControlType.Color,
                title: "Track",
                defaultValue: "rgba(0, 0, 0, 0.12)",
                hidden: (p: any) => p.style === "none" && !p.arrows,
            },
            thumbColor: {
                type: ControlType.Color,
                title: "Active",
                defaultValue: "#1A1A1A",
                hidden: (p: any) => p.style === "none" && !p.arrows,
            },
        },
        defaultValue: INDICATOR_DEFAULTS as any,
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
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            clickToFocus: {
                type: ControlType.Boolean,
                title: "Click Card",
                description: "Click a side card to bring it to the centre.",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            keyboard: {
                type: ControlType.Boolean,
                title: "Keyboard",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            trackpad: {
                type: ControlType.Boolean,
                title: "Trackpad",
                description: "Swipe sideways with two fingers to rotate.",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            scrollSpin: {
                type: ControlType.Boolean,
                title: "Scroll Spin",
                description: "Rotate the ring as the page scrolls.",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            scrollSpeed: {
                type: ControlType.Number,
                title: "Scroll Speed",
                defaultValue: 1,
                min: 0.2,
                max: 4,
                step: 0.1,
                unit: "x",
                hidden: (p: any) => !p.scrollSpin,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause on Hover",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            expand: {
                type: ControlType.Boolean,
                title: "Expand",
                description: "Click the centre card to open it full screen.",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            backdrop: {
                type: ControlType.Color,
                title: "Backdrop",
                defaultValue: "rgba(8, 8, 10, 0.92)",
                hidden: (p: any) => !p.expand,
            },
        },
        defaultValue: INTERACTION_DEFAULTS as any,
    },

    /* ---- Performance ---- */
    loading: {
        type: ControlType.Object,
        title: "Loading",
        icon: "boolean",
        description: "Applies to Manual media.",
        controls: {
            lazy: {
                type: ControlType.Boolean,
                title: "Lazy Load",
                description: "Only load slides near the centre.",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            preload: {
                type: ControlType.Number,
                title: "Preload",
                defaultValue: 3,
                min: 1,
                max: 8,
                step: 1,
                displayStepper: true,
                hidden: (p: any) => !p.lazy,
            },
        },
        defaultValue: LOADING_DEFAULTS as any,
    },

    /* ---- Responsive ---- */
    tablet: {
        type: ControlType.Object,
        title: "Tablet",
        icon: "object",
        optional: true,
        controls: {
            maxWidth: {
                type: ControlType.Number,
                title: "Below",
                defaultValue: 1024,
                min: 400,
                max: 1600,
                step: 10,
                unit: "px",
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 18,
                min: 6,
                max: 50,
                step: 1,
                unit: "°",
            },
            visible: {
                type: ControlType.Number,
                title: "Side Cards",
                defaultValue: 2,
                min: 1,
                max: 4,
                step: 1,
                displayStepper: true,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 85,
                min: 30,
                max: 100,
                step: 1,
                unit: "%",
            },
        },
    },
    mobile: {
        type: ControlType.Object,
        title: "Mobile",
        icon: "object",
        optional: true,
        controls: {
            maxWidth: {
                type: ControlType.Number,
                title: "Below",
                defaultValue: 640,
                min: 240,
                max: 1000,
                step: 10,
                unit: "px",
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                defaultValue: 24,
                min: 6,
                max: 50,
                step: 1,
                unit: "°",
            },
            visible: {
                type: ControlType.Number,
                title: "Side Cards",
                defaultValue: 1,
                min: 1,
                max: 4,
                step: 1,
                displayStepper: true,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 80,
                min: 30,
                max: 100,
                step: 1,
                unit: "%",
            },
        },
    },
})
