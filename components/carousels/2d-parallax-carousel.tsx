import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
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


type Scale = "s" | "m" | "l"
type Shape = "portrait" | "landscape" | "square"

interface Picture {
    src: string
    srcSet?: string
    alt?: string
}

interface Plate {
    image?: Picture | string
    imageUrl?: string
    title?: string
    caption?: string
    link?: string
    scale?: Scale
    shape?: Shape
    depth?: number
}

interface MotionGroup {
    drift?: boolean
    speed?: number
    direction?: "left" | "right"
    pauseOnHover?: boolean
    glide?: number
    wheel?: boolean
    drag?: boolean
    throwForce?: number
}

interface LayoutGroup {
    frameScale?: number
    gap?: number
    stagger?: number
    depthStrength?: number
    radius?: number
    edgeFade?: number
}

interface LookGroup {
    background?: string
    tone?: "mono" | "sepia" | "muted" | "none"
    revealOnHover?: boolean
    hoverZoom?: number
    shadow?: boolean
    focusColor?: string
}

interface CaptionGroup {
    visibility?: "hover" | "always" | "off"
    placement?: "below" | "overlay"
    titleFont?: CSSProperties
    captionFont?: CSSProperties
    titleColor?: string
    captionColor?: string
}

interface ViewerGroup {
    onClick?: "viewer" | "link" | "none"
    newTab?: boolean
    backdrop?: string
    textColor?: string
    showCounter?: boolean
}

interface IntroGroup {
    enabled?: boolean
    duration?: number
    spread?: number
}

interface Props {
    plates?: Plate[]
    motion?: MotionGroup
    layout?: LayoutGroup
    look?: LookGroup
    captions?: CaptionGroup
    viewer?: ViewerGroup
    intro?: IntroGroup
    style?: CSSProperties
}

const PLACEHOLDER =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80"

const HEIGHT_SHARE: Record<Scale, number> = { s: 0.33, m: 0.47, l: 0.6 }
const WIDTH_PER_HEIGHT: Record<Shape, number> = {
    portrait: 0.75,
    landscape: 4 / 3,
    square: 1,
}
const RISE_PATTERN = [0, -0.6, 0.45, -0.2, 0.7, -0.45, 0.2, -0.75]
const TONE_FILTER: Record<string, string> = {
    mono: "grayscale(1)",
    sepia: "sepia(0.8) saturate(0.75)",
    muted: "saturate(0.3) brightness(0.94)",
    none: "none",
}
const CAPTION_ROOM = 54

function pictureOf(plate: Plate): Picture {
    const img = plate.image
    if (img && typeof img === "object" && img.src) return img
    if (typeof img === "string" && img) return { src: img }
    if (plate.imageUrl) return { src: plate.imageUrl }
    return { src: PLACEHOLDER }
}

function wrap(v: number, span: number) {
    return ((v % span) + span) % span
}

function mix(a: number, b: number, t: number) {
    return a + (b - a) * Math.min(1, Math.max(0, t))
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Peristyle(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillGallery {...props} />
    return <LiveGallery {...props} />
}

/* ---------------------------------------------------------------- still -- */

function StillGallery(props: Props) {
    const plates = props.plates ?? []
    const layout = props.layout ?? {}
    const look = props.look ?? {}
    const captions = props.captions ?? {}
    const fs = (layout.frameScale ?? 90) / 100
    const gap = layout.gap ?? 28
    const stagger = (layout.stagger ?? 60) / 100
    const radius = layout.radius ?? 4
    const below =
        captions.visibility === "always" && captions.placement !== "overlay"

    return (
        <div
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: look.background ?? "#EDEBE6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap,
            }}
        >
            {plates.length === 0 ? (
                <div
                    style={{
                        fontFamily: "sans-serif",
                        fontSize: 14,
                        color: "rgba(0,0,0,0.45)",
                    }}
                >
                    Add plates in the properties panel
                </div>
            ) : (
                plates.map((plate, i) => {
                    const pic = pictureOf(plate)
                    const share = HEIGHT_SHARE[plate.scale ?? "m"] * fs
                    const lift =
                        RISE_PATTERN[i % RISE_PATTERN.length] *
                        stagger *
                        (1 - share) *
                        40
                    return (
                        <div
                            key={i}
                            style={{
                                position: "relative",
                                top: `${lift}%`,
                                flexShrink: 0,
                                height: `${share * 100}%`,
                                aspectRatio: `${WIDTH_PER_HEIGHT[plate.shape ?? "portrait"]}`,
                            }}
                        >
                            <img
                                src={pic.src}
                                srcSet={pic.srcSet}
                                alt={pic.alt || plate.title || ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                    borderRadius: radius,
                                }}
                            />
                            {below && (plate.title || plate.caption) && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "calc(100% + 10px)",
                                        left: 0,
                                        right: 0,
                                        fontFamily: "sans-serif",
                                        fontSize: 13,
                                        color: captions.titleColor ?? "#1B1A17",
                                    }}
                                >
                                    {plate.title}
                                </div>
                            )}
                        </div>
                    )
                })
            )}
        </div>
    )
}

/* ------------------------------------------------------------ live hooks -- */

function useInView(ref: React.RefObject<HTMLElement>) {
    const [seen, setSeen] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setSeen(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                const hit = entries[entries.length - 1]?.isIntersecting ?? false
                startTransition(() => setSeen(hit))
            },
            { threshold: 0.01 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])
    return seen
}

function usePageShown() {
    const [shown, setShown] = useState(
        typeof document === "undefined"
            ? true
            : document.visibilityState !== "hidden"
    )
    useEffect(() => {
        if (typeof document === "undefined") return
        const on = () => setShown(document.visibilityState !== "hidden")
        document.addEventListener("visibilitychange", on)
        return () => document.removeEventListener("visibilitychange", on)
    }, [])
    return shown
}

function usePrefersCalm() {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const q = window.matchMedia("(prefers-reduced-motion: reduce)")
        const on = () => setCalm(q.matches)
        on()
        q.addEventListener?.("change", on)
        return () => q.removeEventListener?.("change", on)
    }, [])
    return calm
}

/* -------------------------------------------------------------- geometry -- */

interface Slot {
    key: string
    plate: number
    w: number
    h: number
    y: number
    base: number
    lean: number
    z: number
}

interface Geometry {
    slots: Slot[]
    span: number
    margin: number
    origin: number
}

function measure(
    plates: Plate[],
    W: number,
    H: number,
    layout: LayoutGroup,
    captionRoom: number
): Geometry | null {
    const n = plates.length
    if (!n || W < 2 || H < 2) return null
    const fs = (layout.frameScale ?? 90) / 100
    const gap = Math.max(0, layout.gap ?? 28)
    const stagger = (layout.stagger ?? 60) / 100
    const strength = (layout.depthStrength ?? 50) / 100

    let cursor = 0
    let widest = 0
    const row = plates.map((plate, i) => {
        const h = Math.max(
            24,
            Math.min(
                H - 24 - captionRoom,
                H * HEIGHT_SHARE[plate.scale ?? "m"] * fs
            )
        )
        const w = h * WIDTH_PER_HEIGHT[plate.shape ?? "portrait"]
        const free = Math.max(0, H - h - captionRoom)
        const rise = RISE_PATTERN[i % RISE_PATTERN.length]
        const y =
            free < 24
                ? free / 2
                : Math.min(
                      free - 12,
                      Math.max(12, free / 2 + (rise * stagger * free) / 2)
                  )
        const depth = Math.min(100, Math.max(0, plate.depth ?? 50)) / 100
        const cell = {
            plate: i,
            w,
            h,
            y,
            base: cursor,
            lean: (depth - 0.5) * strength * 0.5,
            z: Math.round(depth * 100) + 1,
        }
        cursor += w + gap
        widest = Math.max(widest, w)
        return cell
    })

    const stripW = cursor
    const margin = widest + (W / 2 + widest) * strength * 0.25 + 32
    const copies = Math.max(1, Math.ceil((W + 2 * margin) / stripW))
    const slots: Slot[] = []
    for (let c = 0; c < copies; c++) {
        for (const cell of row) {
            slots.push({
                ...cell,
                key: `${c}-${cell.plate}`,
                base: cell.base + c * stripW,
            })
        }
    }
    return {
        slots,
        span: stripW * copies,
        margin,
        origin: row[0].base + row[0].w / 2 - W / 2,
    }
}

function screenX(slot: Slot, pos: number, g: Geometry, W: number) {
    const x = wrap(slot.base - pos + g.margin, g.span) - g.margin
    return x + (x + slot.w / 2 - W / 2) * slot.lean
}

/* ------------------------------------------------------------------ live -- */

function LiveGallery(props: Props) {
    const plates = props.plates ?? []
    const layout = props.layout ?? {}
    const look = props.look ?? {}
    const captions = props.captions ?? {}
    const viewer = props.viewer ?? {}
    const intro = props.intro ?? {}
    const motion = props.motion ?? {}

    const rootRef = useRef<HTMLDivElement>(null)
    const scope = "pst" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const [box, setBox] = useState({ w: 0, h: 0 })
    const inView = useInView(rootRef)
    const shown = usePageShown()
    const calm = usePrefersCalm()

    const captionMode = captions.visibility ?? "hover"
    const captionBelow =
        captionMode !== "off" && (captions.placement ?? "below") === "below"

    const geo = useMemo(
        () =>
            measure(
                plates,
                box.w,
                box.h,
                layout,
                captionBelow ? CAPTION_ROOM : 0
            ),
        [
            plates,
            box.w,
            box.h,
            layout.frameScale,
            layout.gap,
            layout.stagger,
            layout.depthStrength,
            captionBelow,
        ]
    )

    const liveProps = useRef(props)
    liveProps.current = props
    const geoRef = useRef(geo)
    geoRef.current = geo
    const boxRef = useRef(box)
    boxRef.current = box
    const calmRef = useRef(calm)
    calmRef.current = calm
    const permitRef = useRef(false)
    const slotEls = useRef<(HTMLDivElement | null)[]>([])
    const suppressClick = useRef(false)

    const state = useRef({
        pos: 0,
        aim: 0,
        seeded: false,
        hover: false,
        hold: false,
        running: false,
        raf: 0,
        last: 0,
        drag: null as null | {
            x: number
            aim: number
            lastX: number
            lastT: number
            v: number
            moved: number
        },
    })

    const [openPlate, setOpenPlate] = useState<number | null>(null)
    const [introPhase, setIntroPhase] = useState<"wait" | "play">("wait")

    // Track the component box
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const read = () => {
            const r = el.getBoundingClientRect()
            const w = Math.round(el.clientWidth || r.width)
            const h = Math.round(el.clientHeight || r.height)
            setBox((b) => (b.w === w && b.h === h ? b : { w, h }))
        }
        read()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(read)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Seed the strip so the first plate sits centred
    useEffect(() => {
        const s = state.current
        if (geo && !s.seeded) {
            s.pos = s.aim = geo.origin
            s.seeded = true
        }
    }, [geo])

    const paint = () => {
        const g = geoRef.current
        if (!g) return
        const W = boxRef.current.w
        const pos = state.current.pos
        for (let k = 0; k < g.slots.length; k++) {
            const el = slotEls.current[k]
            if (!el) continue
            el.style.transform = `translate3d(${screenX(g.slots[k], pos, g, W).toFixed(2)}px,0,0)`
        }
    }

    const tick = (t: number) => {
        const s = state.current
        if (!permitRef.current) {
            s.running = false
            s.raf = 0
            s.last = 0
            return
        }
        const dt = s.last ? Math.min(0.05, (t - s.last) / 1000) : 1 / 60
        s.last = t
        const m = liveProps.current.motion ?? {}
        const quiet = calmRef.current
        const drifting =
            !!m.drift &&
            !quiet &&
            !s.drag &&
            !s.hold &&
            !(m.pauseOnHover !== false && s.hover)
        if (drifting) {
            s.aim += (m.direction === "right" ? -1 : 1) * (m.speed ?? 36) * dt
        }
        const k = quiet ? 40 : mix(16, 2.2, (m.glide ?? 60) / 100)
        s.pos += (s.aim - s.pos) * (1 - Math.exp(-k * dt))
        const settled = Math.abs(s.aim - s.pos) < 0.05
        if (settled) s.pos = s.aim
        paint()
        if (!drifting && settled && !s.drag) {
            s.running = false
            s.raf = 0
            s.last = 0
            return
        }
        s.raf = requestAnimationFrame(tick)
    }

    const wake = () => {
        const s = state.current
        if (s.running || !permitRef.current) return
        s.running = true
        s.last = 0
        s.raf = requestAnimationFrame(tick)
    }

    // Visibility permit
    useEffect(() => {
        const s = state.current
        permitRef.current = inView && shown
        if (permitRef.current) {
            wake()
        } else {
            if (s.raf) cancelAnimationFrame(s.raf)
            s.raf = 0
            s.running = false
            s.last = 0
            s.drag = null
            s.aim = s.pos
        }
    }, [inView, shown])

    // Wake when motion settings change
    useEffect(() => {
        wake()
    }, [motion.drift, motion.speed, motion.direction, calm, geo])

    // Unmount
    useEffect(() => {
        return () => {
            const s = state.current
            if (s.raf) cancelAnimationFrame(s.raf)
            s.raf = 0
            s.running = false
            permitRef.current = false
        }
    }, [])

    // Intro cascade fires on first sight
    useEffect(() => {
        if (introPhase === "play" || !inView) return
        startTransition(() => setIntroPhase("play"))
    }, [inView, introPhase])

    // Wheel (non-passive so the page does not scroll while steering)
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            if (liveProps.current.motion?.wheel === false) return
            const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
            const d =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
            if (!d) return
            e.preventDefault()
            state.current.aim += d * unit
            wake()
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [])

    // Drag via pointer events; window listeners while a drag is live
    const onPointerDown = (e: React.PointerEvent) => {
        if (liveProps.current.motion?.drag === false) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        const s = state.current
        const now = performance.now()
        s.drag = {
            x: e.clientX,
            aim: s.aim,
            lastX: e.clientX,
            lastT: now,
            v: 0,
            moved: 0,
        }
        suppressClick.current = false
        rootRef.current?.setAttribute("data-grabbing", "")

        const move = (ev: PointerEvent) => {
            const d = s.drag
            if (!d) return
            const dx = ev.clientX - d.x
            d.moved = Math.max(d.moved, Math.abs(dx))
            s.aim = d.aim - dx
            const t = performance.now()
            const dt = Math.max(1, t - d.lastT) / 1000
            d.v = d.v * 0.6 + ((ev.clientX - d.lastX) / dt) * 0.4
            d.lastX = ev.clientX
            d.lastT = t
            wake()
        }
        const up = () => {
            const d = s.drag
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
            window.removeEventListener("pointercancel", up)
            rootRef.current?.removeAttribute("data-grabbing")
            if (!d) return
            if (d.moved > 6) suppressClick.current = true
            const force = (liveProps.current.motion?.throwForce ?? 50) / 100
            if (performance.now() - d.lastT < 90) {
                s.aim -= d.v * force * 0.4
            }
            s.drag = null
            wake()
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
        window.addEventListener("pointercancel", up)
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.target !== rootRef.current) return
        const step = boxRef.current.w * 0.4
        if (e.key === "ArrowRight") {
            e.preventDefault()
            state.current.aim += step
            wake()
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            state.current.aim -= step
            wake()
        }
    }

    const activate = (plateIndex: number) => {
        if (suppressClick.current) {
            suppressClick.current = false
            return
        }
        const plate = plates[plateIndex]
        const mode = viewer.onClick ?? "viewer"
        if (mode === "none" || !plate) return
        if (mode === "link") {
            if (plate.link && typeof window !== "undefined") {
                window.open(
                    plate.link,
                    viewer.newTab === false ? "_self" : "_blank",
                    "noopener"
                )
            }
            return
        }
        state.current.hold = true
        startTransition(() => setOpenPlate(plateIndex))
    }

    const closeViewer = () => {
        state.current.hold = false
        startTransition(() => setOpenPlate(null))
        wake()
    }

    const stepViewer = (dir: number) => {
        if (!plates.length) return
        startTransition(() =>
            setOpenPlate((v) => (v === null ? v : wrap(v + dir, plates.length)))
        )
    }

    // Viewer keyboard
    useEffect(() => {
        if (openPlate === null) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeViewer()
            else if (e.key === "ArrowRight") stepViewer(1)
            else if (e.key === "ArrowLeft") stepViewer(-1)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [openPlate, plates.length])

    /* ---------------------------------------------------------- styles -- */

    const radius = layout.radius ?? 4
    const tone = TONE_FILTER[look.tone ?? "mono"] ?? "none"
    const reveal = look.revealOnHover !== false
    const zoom = 1 + (look.hoverZoom ?? 6) / 100
    const introOn = intro.enabled !== false && !calm
    const introDur = Math.max(0.1, intro.duration ?? 1.1)
    const introSpread = Math.max(0, intro.spread ?? 0.7)
    const fade = Math.max(0, layout.edgeFade ?? 48)
    const mask =
        fade > 0
            ? `linear-gradient(90deg, transparent 0, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent 100%)`
            : undefined

    const css = `
.${scope} { cursor: grab; }
.${scope}[data-grabbing] { cursor: grabbing; }
.${scope}:focus-visible { outline: 2px solid ${look.focusColor ?? "#1B1A17"}; outline-offset: -2px; }
.${scope} .pst-art { filter: ${tone}; transform: scale(1); transition: filter .7s ease, transform 1s cubic-bezier(.2,.75,.2,1); }
.${scope} .pst-slot:hover .pst-art, .${scope} .pst-slot:focus-visible .pst-art { ${reveal ? "filter: none;" : ""} transform: scale(${zoom}); }
.${scope} .pst-slot:focus-visible { outline: 2px solid ${look.focusColor ?? "#1B1A17"}; outline-offset: 4px; }
.${scope} .pst-cap[data-mode="hover"] { opacity: 0; transform: translateY(6px); transition: opacity .4s ease, transform .4s ease; }
.${scope} .pst-slot:hover .pst-cap[data-mode="hover"], .${scope} .pst-slot:focus-visible .pst-cap[data-mode="hover"] { opacity: 1; transform: none; }
@keyframes ${scope}fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ${scope}lift { from { opacity: 0; transform: translateY(18px) scale(.97) } to { opacity: 1; transform: none } }
.${scope}-viewer { animation: ${scope}fade .35s ease both; }
.${scope}-viewer figure { animation: ${scope}lift .5s cubic-bezier(.2,.75,.2,1) both; }
.${scope}-btn { opacity: .75; transition: opacity .25s ease, transform .35s cubic-bezier(.2,.75,.2,1); }
.${scope}-btn:hover { opacity: 1; transform: rotate(90deg); }
.${scope}-btn:active { transform: rotate(90deg) scale(.88); }
.${scope}-btn:focus-visible { outline: 1px solid currentColor; outline-offset: 4px; }
`

    const titleFont: CSSProperties = {
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.25,
        ...captions.titleFont,
    }
    const captionFont: CSSProperties = {
        fontSize: 12,
        lineHeight: 1.35,
        ...captions.captionFont,
    }

    const W = box.w
    const startPos = state.current.seeded
        ? state.current.pos
        : (geo?.origin ?? 0)
    const open = openPlate !== null ? plates[openPlate] : null
    const openPic = open ? pictureOf(open) : null
    const viewerText = viewer.textColor ?? "#FFFFFF"

    return (
        <div
            ref={rootRef}
            className={scope}
            tabIndex={0}
            role="region"
            aria-roledescription="gallery"
            aria-label="Image gallery"
            onPointerDown={onPointerDown}
            onPointerEnter={() => {
                state.current.hover = true
            }}
            onPointerLeave={() => {
                state.current.hover = false
                wake()
            }}
            onKeyDown={onKeyDown}
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: look.background ?? "#EDEBE6",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
                outline: "none",
            }}
        >
            <style>{css}</style>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    WebkitMaskImage: mask,
                    maskImage: mask,
                }}
            >
                {geo &&
                    geo.slots.map((slot, k) => {
                        const plate = plates[slot.plate]
                        const pic = pictureOf(plate)
                        const x0 = screenX(slot, startPos, geo, W)
                        const introX = screenX(slot, geo.origin, geo, W)
                        const delay =
                            Math.min(1, Math.max(0, introX / Math.max(1, W))) *
                            introSpread
                        const hidden = introOn && introPhase === "wait"
                        const hasText =
                            captionMode !== "off" &&
                            !!(plate.title || plate.caption)
                        return (
                            <div
                                key={slot.key}
                                ref={(el) => {
                                    slotEls.current[k] = el
                                }}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: slot.y,
                                    width: slot.w,
                                    height: slot.h,
                                    zIndex: slot.z,
                                    transform: `translate3d(${x0.toFixed(2)}px,0,0)`,
                                    willChange: "transform",
                                }}
                            >
                                <div
                                    className="pst-slot"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={
                                        plate.title
                                            ? `Open ${plate.title}`
                                            : `Open image ${slot.plate + 1}`
                                    }
                                    onClick={() => activate(slot.plate)}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            e.preventDefault()
                                            suppressClick.current = false
                                            activate(slot.plate)
                                        }
                                    }}
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        height: "100%",
                                        cursor: "pointer",
                                        opacity: hidden ? 0 : 1,
                                        transform: hidden
                                            ? "translateY(48px) scale(0.96)"
                                            : "none",
                                        transition: introOn
                                            ? `opacity ${introDur}s ease ${delay}s, transform ${introDur}s cubic-bezier(.16,.8,.24,1) ${delay}s`
                                            : undefined,
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            overflow: "hidden",
                                            borderRadius: radius,
                                            boxShadow:
                                                look.shadow === false
                                                    ? "none"
                                                    : "0 18px 40px -22px rgba(0,0,0,0.45)",
                                            background: "rgba(0,0,0,0.06)",
                                        }}
                                    >
                                        <img
                                            className="pst-art"
                                            src={pic.src}
                                            srcSet={pic.srcSet}
                                            alt={pic.alt || plate.title || ""}
                                            draggable={false}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                                pointerEvents: "none",
                                            }}
                                        />
                                        {hasText && !captionBelow && (
                                            <div
                                                className="pst-cap"
                                                data-mode={captionMode}
                                                style={{
                                                    position: "absolute",
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    padding: "36px 14px 12px",
                                                    background:
                                                        "linear-gradient(180deg, transparent, rgba(0,0,0,0.6))",
                                                }}
                                            >
                                                {plate.title && (
                                                    <div
                                                        style={{
                                                            ...titleFont,
                                                            color:
                                                                captions.titleColor ??
                                                                "#FFFFFF",
                                                        }}
                                                    >
                                                        {plate.title}
                                                    </div>
                                                )}
                                                {plate.caption && (
                                                    <div
                                                        style={{
                                                            ...captionFont,
                                                            marginTop: 3,
                                                            color:
                                                                captions.captionColor ??
                                                                "rgba(255,255,255,0.75)",
                                                        }}
                                                    >
                                                        {plate.caption}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {hasText && captionBelow && (
                                        <div
                                            className="pst-cap"
                                            data-mode={captionMode}
                                            style={{
                                                position: "absolute",
                                                top: "calc(100% + 10px)",
                                                left: 0,
                                                width: Math.max(slot.w, 140),
                                            }}
                                        >
                                            {plate.title && (
                                                <div
                                                    style={{
                                                        ...titleFont,
                                                        color:
                                                            captions.titleColor ??
                                                            "#1B1A17",
                                                    }}
                                                >
                                                    {plate.title}
                                                </div>
                                            )}
                                            {plate.caption && (
                                                <div
                                                    style={{
                                                        ...captionFont,
                                                        marginTop: 3,
                                                        color:
                                                            captions.captionColor ??
                                                            "rgba(27,26,23,0.6)",
                                                    }}
                                                >
                                                    {plate.caption}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
            </div>

            {plates.length === 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "sans-serif",
                        fontSize: 14,
                        color: "rgba(0,0,0,0.45)",
                    }}
                >
                    Add plates in the properties panel
                </div>
            )}

            {open && openPic && (
                <div
                    className={`${scope}-viewer`}
                    role="dialog"
                    aria-modal="true"
                    aria-label={open.title || "Image viewer"}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={closeViewer}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1000,
                        background: viewer.backdrop ?? "rgba(14,13,12,0.92)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "zoom-out",
                    }}
                >
                    <figure
                        key={openPlate ?? 0}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            margin: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: 14,
                            maxWidth: "86vw",
                            cursor: "default",
                        }}
                    >
                        <img
                            src={openPic.src}
                            srcSet={openPic.srcSet}
                            alt={openPic.alt || open.title || ""}
                            style={{
                                maxWidth: "86vw",
                                maxHeight: "74vh",
                                objectFit: "contain",
                                display: "block",
                                borderRadius: radius,
                            }}
                        />
                        <figcaption
                            style={{
                                display: "flex",
                                gap: 16,
                                alignItems: "baseline",
                                color: viewerText,
                            }}
                        >
                            {viewer.showCounter !== false && (
                                <span
                                    style={{
                                        ...captionFont,
                                        opacity: 0.55,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {String((openPlate ?? 0) + 1).padStart(
                                        2,
                                        "0"
                                    )}{" "}
                                    / {String(plates.length).padStart(2, "0")}
                                </span>
                            )}
                            <span>
                                {open.title && (
                                    <span
                                        style={{
                                            ...titleFont,
                                            display: "block",
                                        }}
                                    >
                                        {open.title}
                                    </span>
                                )}
                                {open.caption && (
                                    <span
                                        style={{
                                            ...captionFont,
                                            display: "block",
                                            marginTop: 3,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {open.caption}
                                    </span>
                                )}
                            </span>
                        </figcaption>
                    </figure>

                    <button
                        type="button"
                        aria-label="Close viewer"
                        className={`${scope}-btn`}
                        onClick={(e) => {
                            e.stopPropagation()
                            closeViewer()
                        }}
                        style={{
                            position: "absolute",
                            top: 18,
                            right: 18,
                            width: 36,
                            height: 36,
                            border: "none",
                            background: "transparent",
                            color: viewerText,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                        }}
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <path d="M5 5l14 14M19 5L5 19" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    )
}

/* -------------------------------------------------------------- controls -- */

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80`

addPropertyControls(Peristyle, {
    plates: {
        type: ControlType.Array,
        title: "Plates",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    description: "Used when no image is uploaded.",
                },
                title: { type: ControlType.String, title: "Title" },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    displayTextArea: true,
                },
                link: { type: ControlType.Link, title: "Link" },
                scale: {
                    type: ControlType.Enum,
                    title: "Size",
                    options: ["s", "m", "l"],
                    optionTitles: ["S", "M", "L"],
                    displaySegmentedControl: true,
                    defaultValue: "m",
                },
                shape: {
                    type: ControlType.Enum,
                    title: "Shape",
                    options: ["portrait", "landscape", "square"],
                    optionTitles: ["Portrait", "Landscape", "Square"],
                    defaultValue: "portrait",
                },
                depth: {
                    type: ControlType.Number,
                    title: "Depth",
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    defaultValue: 50,
                    description: "Closer plates travel faster and sit on top.",
                },
            },
        },
        defaultValue: [
            {
                imageUrl: u("1500530855697-b586d89ba3ee"),
                title: "Plate 01",
                caption: "Morning ridge",
                scale: "m",
                shape: "portrait",
                depth: 40,
            },
            {
                imageUrl: u("1469474968028-56623f02e42e"),
                title: "Plate 02",
                caption: "Open valley",
                scale: "l",
                shape: "landscape",
                depth: 20,
            },
            {
                imageUrl: u("1501785888041-af3ef285b470"),
                title: "Plate 03",
                caption: "Still water",
                scale: "s",
                shape: "portrait",
                depth: 90,
            },
            {
                imageUrl: u("1470071459604-3b5ec3a7fe05"),
                title: "Plate 04",
                caption: "Low cloud",
                scale: "m",
                shape: "square",
                depth: 60,
            },
            {
                imageUrl: u("1441974231531-c6227db76b6e"),
                title: "Plate 05",
                caption: "Forest path",
                scale: "l",
                shape: "portrait",
                depth: 30,
            },
            {
                imageUrl: u("1506744038136-46273834b3fb"),
                title: "Plate 06",
                caption: "Evening shore",
                scale: "s",
                shape: "landscape",
                depth: 80,
            },
        ],
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            drift: {
                type: ControlType.Boolean,
                title: "Auto Drift",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            speed: {
                type: ControlType.Number,
                title: "Drift Speed",
                min: 4,
                max: 240,
                step: 1,
                unit: "px/s",
                defaultValue: 36,
                hidden: (p: MotionGroup) => !p.drift,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                displaySegmentedControl: true,
                defaultValue: "left",
                hidden: (p: MotionGroup) => !p.drift,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Hover Pause",
                defaultValue: true,
                hidden: (p: MotionGroup) => !p.drift,
            },
            glide: {
                type: ControlType.Number,
                title: "Glide",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 60,
                description: "Higher values ease the strip in more softly.",
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Wheel Steer",
                defaultValue: true,
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
            },
            throwForce: {
                type: ControlType.Number,
                title: "Throw",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 50,
                hidden: (p: MotionGroup) => p.drag === false,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            frameScale: {
                type: ControlType.Number,
                title: "Plate Scale",
                min: 40,
                max: 160,
                step: 1,
                unit: "%",
                defaultValue: 90,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: -120,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 28,
                description: "Negative values overlap plates.",
            },
            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 60,
            },
            depthStrength: {
                type: ControlType.Number,
                title: "Parallax",
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
                defaultValue: 50,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 4,
            },
            edgeFade: {
                type: ControlType.Number,
                title: "Edge Fade",
                min: 0,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 48,
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#EDEBE6",
            },
            tone: {
                type: ControlType.Enum,
                title: "Resting Tone",
                options: ["mono", "sepia", "muted", "none"],
                optionTitles: ["Mono", "Sepia", "Muted", "Full Colour"],
                defaultValue: "mono",
            },
            revealOnHover: {
                type: ControlType.Boolean,
                title: "Colour on Hover",
                defaultValue: true,
                hidden: (p: LookGroup) => p.tone === "none",
            },
            hoverZoom: {
                type: ControlType.Number,
                title: "Hover Zoom",
                min: 0,
                max: 25,
                step: 1,
                unit: "%",
                defaultValue: 6,
            },
            shadow: {
                type: ControlType.Boolean,
                title: "Shadow",
                defaultValue: true,
            },
            focusColor: {
                type: ControlType.Color,
                title: "Focus Ring",
                defaultValue: "#1B1A17",
            },
        },
    },
    captions: {
        type: ControlType.Object,
        title: "Captions",
        controls: {
            visibility: {
                type: ControlType.Enum,
                title: "Show",
                options: ["hover", "always", "off"],
                optionTitles: ["On Hover", "Always", "Off"],
                defaultValue: "hover",
            },
            placement: {
                type: ControlType.Enum,
                title: "Placement",
                options: ["below", "overlay"],
                optionTitles: ["Below", "Overlay"],
                displaySegmentedControl: true,
                defaultValue: "below",
                hidden: (p: CaptionGroup) => p.visibility === "off",
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 14, lineHeight: "1.25em" },
                hidden: (p: CaptionGroup) => p.visibility === "off",
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title Colour",
                defaultValue: "#1B1A17",
                hidden: (p: CaptionGroup) => p.visibility === "off",
            },
            captionFont: {
                type: ControlType.Font,
                title: "Caption Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: 12, lineHeight: "1.35em" },
                hidden: (p: CaptionGroup) => p.visibility === "off",
            },
            captionColor: {
                type: ControlType.Color,
                title: "Caption Colour",
                defaultValue: "rgba(27,26,23,0.6)",
                hidden: (p: CaptionGroup) => p.visibility === "off",
            },
        },
    },
    viewer: {
        type: ControlType.Object,
        title: "Click",
        controls: {
            onClick: {
                type: ControlType.Enum,
                title: "On Click",
                options: ["viewer", "link", "none"],
                optionTitles: ["Open Viewer", "Follow Link", "Nothing"],
                defaultValue: "viewer",
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: true,
                hidden: (p: ViewerGroup) => p.onClick !== "link",
            },
            backdrop: {
                type: ControlType.Color,
                title: "Backdrop",
                defaultValue: "rgba(14,13,12,0.92)",
                hidden: (p: ViewerGroup) =>
                    (p.onClick ?? "viewer") !== "viewer",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
                hidden: (p: ViewerGroup) =>
                    (p.onClick ?? "viewer") !== "viewer",
            },
            showCounter: {
                type: ControlType.Boolean,
                title: "Counter",
                defaultValue: true,
                hidden: (p: ViewerGroup) =>
                    (p.onClick ?? "viewer") !== "viewer",
            },
        },
    },
    intro: {
        type: ControlType.Object,
        title: "Intro",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Rise In",
                defaultValue: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.2,
                max: 3,
                step: 0.1,
                unit: "s",
                defaultValue: 1.1,
                hidden: (p: IntroGroup) => p.enabled === false,
            },
            spread: {
                type: ControlType.Number,
                title: "Cascade",
                min: 0,
                max: 2,
                step: 0.05,
                unit: "s",
                defaultValue: 0.7,
                hidden: (p: IntroGroup) => p.enabled === false,
            },
        },
    },
})
