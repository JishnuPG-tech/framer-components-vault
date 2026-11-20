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


const useBrowserLayoutEffect =
    typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

type ImageValue = string | { src: string; srcSet?: string; alt?: string }
type ColorValue = string | { value: string }
type Slide = {
    image?: ImageValue
    isVideo?: boolean
    videoFile?: string
    imageUrl?: string
    videoUrl?: string
    title?: string
    collection?: string
    link?: string
}
type LayoutSettings = {
    cardWidth?: number
    cardHeight?: number
    radius?: number
    visibleCards?: number
    spacing?: number
    depthPercent?: number
}
type TextSettings = {
    showCaption?: boolean
    captionFont?: React.CSSProperties
    collectionFont?: React.CSSProperties
    textColor?: ColorValue
}
type AppearanceSettings = {
    background?: ColorValue
    shadowPercent?: number
}
type NavigationSettings = {
    initialCard?: number
    scrollMode?: "wheel" | "page"
    sensitivity?: number
    loop?: boolean
    autoplay?: boolean
    interval?: number
    showDots?: boolean
    horizontalDots?: boolean
}
type MotionSettings = {
    smoothing?: number
    hoverLift?: number
}
type Props = Omit<LayoutSettings, "depthPercent"> &
    TextSettings &
    Omit<AppearanceSettings, "shadowPercent"> &
    NavigationSettings &
    MotionSettings & {
        items?: Slide[]
        cardSettings?: { items?: Slide[] } | null
        layout?: LayoutSettings | null
        textSettings?: TextSettings | null
        appearance?: AppearanceSettings | null
        navigation?: NavigationSettings | null
        motion?: MotionSettings | null
        // Legacy instances store these values as fractions.
        depth?: number
        shadow?: number
        onChange?: () => void
        style?: React.CSSProperties
    }

const photo = (
    id: string,
    crop: "center" | "faces" | { y: number } = "center"
) => {
    const cropQuery =
        typeof crop === "string" ? crop : `focalpoint&fp-x=0.5&fp-y=${crop.y}`
    return {
        src: `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=${cropQuery}&w=1000&h=558&q=85`,
    }
}

const cardMediaStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
    userSelect: "none",
    pointerEvents: "none",
}

function CardVideo({ src, playing, onError }: {
    src: string
    playing: boolean
    onError: () => void
}) {
    const videoRef = React.useRef<HTMLVideoElement>(null)

    React.useEffect(() => {
        const video = videoRef.current
        if (!video || !playing) return
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )
        const update = () => {
            if (reducedMotion.matches) video.pause()
            else void video.play().catch(() => {})
        }
        update()
        reducedMotion.addEventListener("change", update)
        return () => {
            reducedMotion.removeEventListener("change", update)
            video.pause()
        }
    }, [src, playing])

    return (
        <video
            ref={videoRef}
            src={src}
            onError={onError}
            muted
            loop
            playsInline
            preload={playing ? "auto" : "metadata"}
            aria-hidden="true"
            style={cardMediaStyle}
        />
    )
}

function CardMedia({ src, image, isVideo, playing, title, width }: {
    src: string
    image?: Exclude<ImageValue, string>
    isVideo: boolean
    playing: boolean
    title: string
    width: number
}) {
    const [failed, setFailed] = React.useState(false)

    if (failed) {
        return (
            <div role="img" aria-label={title + " — media unavailable"} style={{
                ...cardMediaStyle,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, #f3f3f3, #e5e5e5)",
                color: "#666666",
                fontSize: 13,
            }}>
                Media unavailable
            </div>
        )
    }

    if (isVideo) {
        return <CardVideo src={src} playing={playing} onError={() => setFailed(true)} />
    }

    return (
        <img
            src={src}
            srcSet={image?.srcSet}
            sizes={`${Math.round(width)}px`}
            alt={image?.alt || title}
            draggable={false}
            loading="eager"
            decoding="async"
            style={cardMediaStyle}
            onError={() => setFailed(true)}
        />
    )
}

const DEFAULT_ITEMS: Slide[] = [
    {
        title: "Form & Field",
        collection: "Branding Design",
        image: photo("photo-1720575796966-7d1483e238e5", "faces"),
    },
    {
        title: "Juniper Supply",
        collection: "E-commerce",
        image: photo("photo-1765498069277-dc9bc08b54ea"),
    },
    {
        title: "Northline Digital",
        collection: "Web Development",
        image: photo("photo-1776088066852-33ac3d31dffd"),
    },
    {
        title: "Olea House",
        collection: "Art Direction",
        image: photo("photo-1710885858611-3a3c0a94d3f0"),
    },
    {
        title: "Morrow Studio",
        collection: "UI/UX Design",
        image: photo("photo-1760284739389-8a833519d6a5"),
    },
    {
        title: "Bloomwell",
        collection: "Digital Marketing",
        image: photo("photo-1695338012517-f951df1bae62", "faces"),
    },
    {
        title: "Keystone Collective",
        collection: "Brand Strategy",
        image: photo("photo-1764867454983-0da3c72c253e"),
    },
    {
        title: "Studio Atlas",
        collection: "Web Design",
        image: photo("photo-1529139574466-a303027c1d8b", { y: 0.32 }),
    },
    {
        title: "Common Ground",
        collection: "Creative Direction",
        image: photo("photo-1758483928114-60b3fce6473d"),
    },
    {
        title: "Signal Works",
        collection: "Product Design",
        image: photo("photo-1769536426519-615007af6f7a"),
    },
    {
        title: "Lumen Coffee",
        collection: "Brand Identity",
        image: photo("photo-1776590976752-3a157f8d31dc"),
    },
    {
        title: "Cedar & Clay",
        collection: "Content Design",
        image: photo("photo-1689590903552-d1034d40ff76", { y: 0.47 }),
    },
    {
        title: "Sunday Form",
        collection: "Web Design",
        image: photo("photo-1767002295567-e0a3c0c6f318"),
    },
    {
        title: "Brightframe",
        collection: "Growth Marketing",
        image: photo("photo-1771679010792-74beef1e73d1"),
    },
    {
        title: "Fieldnote Labs",
        collection: "Web Development",
        image: photo("photo-1599943238450-b0edf519982b"),
    },
    {
        title: "Arden House",
        collection: "Brand Experience",
        image: photo("photo-1772289093079-2778f6d8ece4"),
    },
]

const titleFontStyle = {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: "18px",
    lineHeight: "1.3em",
    letterSpacing: "-0.45px",
} satisfies React.CSSProperties
const labelFontStyle = {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "1em",
    letterSpacing: "-0.2px",
} satisfies React.CSSProperties
const titleFontDefault = { ...titleFontStyle, variant: "Regular" as const }
const labelFontDefault = { ...labelFontStyle, variant: "Regular" as const }

const DEFAULTS = {
    items: DEFAULT_ITEMS,
    cardWidth: 430,
    cardHeight: 240,
    radius: 16,
    visibleCards: 12,
    spacing: 33.5,
    depth: 0.07,
    showCaption: true,
    textColor: "#111111",
    background: "#FFFFFF",
    shadow: 0.2,
    scrollMode: "wheel" as const,
    initialCard: 8,
    showDots: true,
    horizontalDots: false,
    loop: true,
    sensitivity: 260,
    autoplay: false,
    interval: 3,
    smoothing: 0.16,
    hoverLift: 28,
}

const mod = (value: number, total: number) => ((value % total) + total) % total
const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value))
const color = (value: ColorValue) =>
    typeof value === "object" ? value.value : value
const imageSource = (value?: ImageValue) =>
    typeof value === "string" ? value : value?.src
function projectLink(value?: string) {
    const href = value?.trim()
    if (!href) return undefined
    try {
        const { protocol } = new URL(href, "https://example.invalid")
        return protocol === "https:" || protocol === "http:" ? href : undefined
    } catch {
        return undefined
    }
}

function frontCardIndex(current: number, target: number, count: number) {
    const nearest = Math.round(current)
    // Use the animated position, since captions can update before the card arrives.
    return Math.abs(current - nearest) < 0.04 &&
        Math.abs(target - nearest) < 0.04
        ? mod(nearest, count)
        : null
}
const stackY = (distance: number, depth: number, spacing: number) =>
    (-spacing * distance) / (1 + depth * distance) +
    spacing * 0.24 * Math.sin((Math.PI * Math.min(distance, 12)) / 12)

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */
export default function CMSStackCarousel(props: Props) {
    const {
        cardSettings,
        layout,
        textSettings,
        appearance,
        navigation,
        motion,
        onChange,
        style,
    } = props

    // Grouped controls override individual legacy values field by field.
    const cardWidth = layout?.cardWidth ?? props.cardWidth ?? DEFAULTS.cardWidth
    const cardHeight =
        layout?.cardHeight ?? props.cardHeight ?? DEFAULTS.cardHeight
    const radius = layout?.radius ?? props.radius ?? DEFAULTS.radius
    const visibleCards =
        layout?.visibleCards ?? props.visibleCards ?? DEFAULTS.visibleCards
    const spacing = layout?.spacing ?? props.spacing ?? DEFAULTS.spacing
    const depth =
        layout?.depthPercent != null
            ? layout.depthPercent / 100
            : (props.depth ?? DEFAULTS.depth)

    const showCaption =
        textSettings?.showCaption ?? props.showCaption ?? DEFAULTS.showCaption
    const captionFont = textSettings?.captionFont ?? props.captionFont
    const collectionFont = textSettings?.collectionFont ?? props.collectionFont
    const textColor =
        textSettings?.textColor ?? props.textColor ?? DEFAULTS.textColor

    const background =
        appearance?.background ?? props.background ?? DEFAULTS.background
    const shadow =
        appearance?.shadowPercent != null
            ? appearance.shadowPercent / 100
            : (props.shadow ?? DEFAULTS.shadow)

    const scrollMode =
        navigation?.scrollMode ?? props.scrollMode ?? DEFAULTS.scrollMode
    const initialCard =
        navigation?.initialCard ?? props.initialCard ?? DEFAULTS.initialCard
    const showDots = navigation?.showDots ?? props.showDots ?? DEFAULTS.showDots
    const horizontalDots =
        navigation?.horizontalDots ??
        props.horizontalDots ??
        DEFAULTS.horizontalDots
    const loop = navigation?.loop ?? props.loop ?? DEFAULTS.loop
    const sensitivity =
        navigation?.sensitivity ?? props.sensitivity ?? DEFAULTS.sensitivity
    const autoplay = navigation?.autoplay ?? props.autoplay ?? DEFAULTS.autoplay
    const interval = navigation?.interval ?? props.interval ?? DEFAULTS.interval

    const smoothing = motion?.smoothing ?? props.smoothing ?? DEFAULTS.smoothing
    const hoverLift = motion?.hoverLift ?? props.hoverLift ?? DEFAULTS.hoverLift

    const items = props.items ?? cardSettings?.items ?? DEFAULTS.items
    const slides = items.length ? items : DEFAULT_ITEMS
    const count = slides.length
    const height = Math.max(60, cardHeight)
    const frontTop = 345
    const perspectiveDepth = 1100
    const perspectiveOriginY = 420
    const shadowTop = frontTop + height + 25
    const shadowHeight = 100
    const dotsHeight = 20
    const activeDotSize = 5
    const dotsEdgeInset = 50
    const shadowEndOffset = shadowTop + shadowHeight + 10 - 390
    const starting =
        scrollMode === "page"
            ? 0
            : clamp(Math.round(initialCard) - 1, 0, count - 1)
    const [selected, setSelected] = React.useState(starting)
    const [frontCard, setFrontCard] = React.useState<number | null>(starting)
    const root = React.useRef<HTMLDivElement>(null)
    const viewport = React.useRef<HTMLDivElement>(null)
    const stage = React.useRef<HTMLDivElement>(null)
    const cards = React.useRef<(HTMLDivElement | null)[]>([])
    const actions = React.useRef<(HTMLAnchorElement | HTMLButtonElement | null)[]>([])
    const lastCardStyles = React.useRef<React.CSSProperties[]>([])
    const focusedCard = React.useRef<number | null>(null)
    const shadowElement = React.useRef<HTMLDivElement>(null)
    const engine = React.useRef({
        current: starting,
        target: starting,
        frame: 0,
        last: 0,
        selected: starting,
        frontCard: starting as number | null,
    })
    const configuration = React.useRef({ count, starting, scrollMode })
    const wake = React.useRef<() => void>(() => {})
    const reducedMotion = React.useRef(false)
    const pageNavigate = React.useRef<(index: number) => void>(() => {})
    const lastInteraction = React.useRef(0)
    const changeCallback = React.useRef(onChange)
    const gesture = React.useRef<{
        x: number
        y: number
        startX: number
        startY: number
        moved: boolean
    } | null>(null)
    const suppressClick = React.useRef(false)
    const isStaticRenderer = useIsStaticRenderer()
    const interactive = !isStaticRenderer
    const [isOnscreen, setIsOnscreen] = React.useState(false)

    React.useEffect(() => {
        const element = root.current
        if (!interactive || !element) return
        let intersects = false
        const update = () => setIsOnscreen(intersects && !document.hidden)
        if (typeof IntersectionObserver === "undefined") {
            intersects = true
            update()
            document.addEventListener("visibilitychange", update)
            return () => document.removeEventListener("visibilitychange", update)
        }
        const observer = new IntersectionObserver(([entry]) => {
            intersects = entry.isIntersecting && entry.intersectionRatio > 0
            update()
        })
        observer.observe(element)
        document.addEventListener("visibilitychange", update)
        return () => {
            observer.disconnect()
            document.removeEventListener("visibilitychange", update)
        }
    }, [interactive])

    React.useEffect(() => {
        changeCallback.current = onChange
    }, [onChange])

    // Reveal the stack only after its actual frame has been measured.
    // The same hidden markup is used for the server and hydration render.
    useBrowserLayoutEffect(() => {
        const element = viewport.current
        const scene = stage.current
        const container = root.current
        if (!element || !scene || !container) return
        const resize = () => {
            const width = element.clientWidth
            const height = element.clientHeight
            if (width <= 0 || height <= 0) {
                scene.style.visibility = "hidden"
                return
            }
            const bottomClearance =
                showDots && count > 1 && horizontalDots
                    ? dotsEdgeInset + activeDotSize / 2 + dotsHeight / 2 + 6
                    : 8
            const shadowSpace = Math.max(1, height / 2 - bottomClearance)
            const scale = Math.max(
                0.01,
                Math.min(
                    width / 740,
                    height / 780,
                    shadowSpace / shadowEndOffset
                )
            )
            scene.style.transform = `translate(-50%, -50%) scale(${scale})`
            scene.style.visibility = "visible"
        }
        resize()
        const observer = new ResizeObserver(resize)
        observer.observe(element)
        observer.observe(container)
        window.addEventListener("resize", resize)
        return () => {
            observer.disconnect()
            window.removeEventListener("resize", resize)
        }
    }, [
        scrollMode,
        showDots,
        count,
        horizontalDots,
        dotsEdgeInset,
        dotsHeight,
        activeDotSize,
        shadowEndOffset,
    ])

    React.useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => {
            reducedMotion.current = query.matches
        }
        update()
        query.addEventListener("change", update)
        return () => query.removeEventListener("change", update)
    }, [])

    // A single fractional position drives every card. Trackpads and touch
    // therefore scrub the motion continuously, rather than firing slide timers.
    React.useEffect(() => {
        if (!interactive || !isOnscreen) return
        const state = engine.current
        const previous = configuration.current
        if (
            previous.count !== count ||
            previous.starting !== starting ||
            previous.scrollMode !== scrollMode
        ) {
            state.current = starting
            state.target = starting
            state.selected = starting
            setSelected(starting)
        }
        configuration.current = { count, starting, scrollMode }
        const draw = () => {
            const current = state.current
            const front = frontCardIndex(current, state.target, count)
            if (front !== state.frontCard) {
                state.frontCard = front
                setFrontCard(front)
            }
            const cap = Math.min(visibleCards, count)
            for (let index = 0; index < count; index++) {
                const element = cards.current[index]
                if (!element) continue
                let distance = mod(index - current, count)
                if (distance > count - 1 && count > 1) distance -= count
                let y = 0
                let scale = 1
                let angle = 0
                let opacity = 1
                let folded = false
                if (distance < 0) {
                    // The outgoing card drops toward the viewer and folds flat.
                    const progress = -distance
                    const travel = clamp((progress - 0.37) / 0.63, 0, 1)
                    const flight = travel * travel * (3 - 2 * travel)
                    y = 400 * flight
                    scale = 1 + 0.21 * flight
                    // The edge-on angle depends on the camera and the hinge position.
                    // Local scale does not change it because it scales both axes.
                    const edgeAngle =
                        (Math.atan2(
                            perspectiveDepth,
                            frontTop + y - perspectiveOriginY
                        ) *
                            180) /
                        Math.PI
                    angle = -edgeAngle * Math.pow(flight, 0.75)
                    // Keep the card solid through most of the tilt, then ease it out.
                    const exitFade = clamp((progress - 0.72) / 0.26, 0, 1)
                    opacity = 1 - exitFade * exitFade * (3 - 2 * exitFade)
                    folded = flight >= 0.999 && !reducedMotion.current
                    if (reducedMotion.current) {
                        y = 0
                        scale = 1
                        angle = 0
                        opacity = 1 - progress
                    }
                } else {
                    scale = 1 / (1 + depth * distance)
                    y = stackY(distance, depth, spacing)
                    opacity = clamp(cap - distance, 0, 1)
                }
                const style: React.CSSProperties = {
                    transform: `translate3d(0, ${y.toFixed(3)}px, 0) scale(${scale.toFixed(5)}) rotateX(${angle.toFixed(3)}deg)`,
                    opacity,
                    zIndex: distance < 0 ? 200 : 100 - Math.floor(distance * 4),
                    pointerEvents: opacity < 0.25 || distance < -0.12 ? "none" : "auto",
                    visibility: folded || opacity <= 0 ? "hidden" : "visible",
                }
                lastCardStyles.current[index] = style
                Object.assign(element.style, style)
            }
            // Caption and dots follow the requested card immediately, even
            // when a click crosses several cards during the visual transition.
            const nearest = mod(Math.round(state.target), count)
            if (nearest !== state.selected) {
                state.selected = nearest
                setSelected(nearest)
                changeCallback.current?.()
            }
            if (shadowElement.current) {
                const moving = Math.abs(current - Math.round(current)) * 2
                shadowElement.current.style.opacity = String(
                    shadow * (1 - moving * 0.14)
                )
            }
        }
        const tick = (now: number) => {
            const elapsed = state.last ? Math.min(now - state.last, 50) : 16.67
            state.last = now
            const difference = state.target - state.current
            if (Math.abs(difference) < 0.0003) {
                state.current = state.target
                draw()
                state.frame = 0
                state.last = 0
                // Keep numbers small even after a long looping session.
                if (Math.abs(state.current) > count * 100) {
                    const cycles = Math.trunc(state.current / count) * count
                    state.current -= cycles
                    state.target -= cycles
                }
                return
            }
            const timeConstant = reducedMotion.current
                ? 35
                : Math.max(25, smoothing * 1000)
            state.current +=
                difference * (1 - Math.exp(-elapsed / timeConstant))
            draw()
            state.frame = requestAnimationFrame(tick)
        }
        wake.current = () => {
            if (!state.frame) state.frame = requestAnimationFrame(tick)
        }
        draw()
        if (Math.abs(state.target - state.current) > 0.0003) wake.current()
        return () => {
            cancelAnimationFrame(state.frame)
            state.frame = 0
            state.last = 0
            wake.current = () => {}
        }
    }, [interactive, isOnscreen, count, starting, scrollMode, visibleCards, depth, spacing, smoothing, shadow])

    const move = (delta: number) => {
        lastInteraction.current = Date.now()
        const state = engine.current
        state.target = loop
            ? state.target + delta
            : clamp(state.target + delta, 0, count - 1)
        wake.current()
    }

    const select = (index: number) => {
        if (!interactive) return
        lastInteraction.current = Date.now()
        if (scrollMode === "page") {
            pageNavigate.current(index)
            return
        }
        const state = engine.current
        let delta = index - mod(state.target, count)
        if (loop) {
            if (delta > count / 2) delta -= count
            if (delta < -count / 2) delta += count
        }
        state.target += delta
        wake.current()
    }

    // A non-passive wheel listener is scoped to this component. In finite mode
    // the page regains scrolling at the first and last card.
    React.useEffect(() => {
        const element = root.current
        if (!element || !interactive || scrollMode !== "wheel" || count < 2)
            return
        let snap: ReturnType<typeof setTimeout> | undefined
        let gestureStart = Math.round(engine.current.target)
        let lastWheel = 0
        const wheel = (event: WheelEvent) => {
            if (event.ctrlKey) return
            const raw =
                Math.abs(event.deltaY) >= Math.abs(event.deltaX)
                    ? event.deltaY
                    : event.deltaX
            if (!raw) return
            const unit =
                event.deltaMode === 1
                    ? 18
                    : event.deltaMode === 2
                      ? element.clientHeight
                      : 1
            const state = engine.current
            if (
                !loop &&
                ((state.target <= 0 && raw < 0) ||
                    (state.target >= count - 1 && raw > 0))
            )
                return
            event.preventDefault()
            lastInteraction.current = Date.now()
            if (Date.now() - lastWheel > 180)
                gestureStart = Math.round(state.target)
            lastWheel = Date.now()
            const delta = clamp(
                (raw * unit) / Math.max(40, sensitivity),
                -1.5,
                1.5
            )
            state.target = loop
                ? state.target + delta
                : clamp(state.target + delta, 0, count - 1)
            wake.current()
            clearTimeout(snap)
            snap = setTimeout(() => {
                const travel = state.target - gestureStart
                let next = Math.round(state.target)
                if (next === gestureStart && Math.abs(travel) >= 0.14)
                    next += Math.sign(travel)
                state.target = loop ? next : clamp(next, 0, count - 1)
                wake.current()
            }, 160)
        }
        element.addEventListener("wheel", wheel, { passive: false })
        return () => {
            element.removeEventListener("wheel", wheel)
            clearTimeout(snap)
        }
    }, [interactive, scrollMode, count, sensitivity, loop])

    // Optional page-scroll mode: use a tall instance (for example 4200 px).
    // Its stage stays sticky; clicking a card scrolls to its section position.
    React.useEffect(() => {
        const element = root.current
        if (!element || !interactive || !isOnscreen || scrollMode !== "page") return
        let settle: ReturnType<typeof setTimeout> | undefined
        const position = () => {
            const rect = element.getBoundingClientRect()
            const travel = Math.max(
                1,
                element.offsetHeight - window.innerHeight
            )
            const mapped = clamp(-rect.top / travel, 0, 1) * (count - 1)
            engine.current.target = mapped
            wake.current()
            clearTimeout(settle)
            settle = setTimeout(() => {
                engine.current.target = Math.round(mapped)
                wake.current()
            }, 180)
        }
        pageNavigate.current = (index) => {
            const top = element.getBoundingClientRect().top + window.scrollY
            const travel = Math.max(
                1,
                element.offsetHeight - window.innerHeight
            )
            window.scrollTo({
                top: top + (travel * index) / Math.max(1, count - 1),
                behavior: reducedMotion.current
                    ? ("instant" as ScrollBehavior)
                    : "smooth",
            })
        }
        position()
        window.addEventListener("scroll", position, { passive: true })
        window.addEventListener("resize", position)
        const observer = new ResizeObserver(position)
        observer.observe(element)
        return () => {
            window.removeEventListener("scroll", position)
            window.removeEventListener("resize", position)
            observer.disconnect()
            clearTimeout(settle)
        }
    }, [interactive, isOnscreen, scrollMode, count])

    React.useEffect(() => {
        if (!autoplay || !interactive || !isOnscreen || scrollMode === "page" || count < 2)
            return
        const timer = setInterval(
            () => {
                if (document.hidden || reducedMotion.current || gesture.current)
                    return
                if (Date.now() - lastInteraction.current < interval * 1000)
                    return
                const state = engine.current
                if (!loop && state.target >= count - 1) return
                const next = Math.round(state.target) + 1
                state.target = loop ? next : clamp(next, 0, count - 1)
                wake.current()
            },
            Math.max(1000, interval * 1000)
        )
        return () => clearInterval(timer)
    }, [autoplay, interactive, isOnscreen, scrollMode, count, loop, interval])

    const startGesture = (event: React.PointerEvent<HTMLDivElement>) => {
        if (
            !interactive ||
            scrollMode === "page" ||
            event.pointerType === "mouse"
        )
            return
        gesture.current = {
            x: event.clientX,
            y: event.clientY,
            startX: event.clientX,
            startY: event.clientY,
            moved: false,
        }
        suppressClick.current = false
    }
    const dragGesture = (event: React.PointerEvent<HTMLDivElement>) => {
        const current = gesture.current
        if (!current) return
        const deltaX = current.x - event.clientX
        const deltaY = current.y - event.clientY
        if (
            Math.hypot(
                event.clientX - current.startX,
                event.clientY - current.startY
            ) > 7
        )
            current.moved = true
        if (current.moved) {
            suppressClick.current = true
            move(
                (Math.abs(deltaY) >= Math.abs(deltaX) ? deltaY : deltaX) /
                    Math.max(80, sensitivity * 0.65)
            )
        }
        current.x = event.clientX
        current.y = event.clientY
    }
    const endGesture = () => {
        if (!gesture.current) return
        gesture.current = null
        engine.current.target = Math.round(engine.current.target)
        wake.current()
        // A swipe may not generate a click; do not swallow the next real tap.
        setTimeout(() => {
            suppressClick.current = false
        }, 80)
    }

    const width = Math.max(100, cardWidth)
    const currentSlide = slides[selected] || slides[0]
    const pageMode = scrollMode === "page"

    return (
        <div
            ref={root}
            className="psc-root"
            data-interactive={interactive ? "true" : undefined}
            role="region"
            aria-roledescription="carousel"
            aria-label="Scrollable photo stack"
            tabIndex={interactive ? 0 : -1}
            onKeyDown={(event) => {
                if (!interactive) return
                if (
                    [
                        "ArrowDown",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowLeft",
                        "Home",
                        "End",
                    ].includes(event.key)
                ) {
                    event.preventDefault()
                    event.currentTarget.focus({ preventScroll: true })
                    if (event.key === "Home") select(0)
                    else if (event.key === "End") select(count - 1)
                    else if (pageMode)
                        select(
                            clamp(
                                selected +
                                    (["ArrowUp", "ArrowLeft"].includes(
                                        event.key
                                    )
                                        ? -1
                                        : 1),
                                0,
                                count - 1
                            )
                        )
                    else {
                        engine.current.target = Math.round(
                            engine.current.target
                        )
                        move(
                            ["ArrowUp", "ArrowLeft"].includes(event.key)
                                ? -1
                                : 1
                        )
                    }
                }
            }}
            onPointerDown={startGesture}
            onPointerMove={dragGesture}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
            style={{
                width: "100%",
                height: "100%",
                ...style,
                position: "relative",
                background: color(background),
                color: color(textColor),
                overflow: pageMode ? "visible" : "hidden",
                touchAction: interactive
                    ? pageMode
                        ? "pan-y"
                        : "none"
                    : "auto",
                fontFamily: "Arial, Helvetica, sans-serif",
                WebkitTapHighlightColor: "transparent",
                isolation: "isolate",
                ["--psc-lift" as string]: `${hoverLift}px`,
            }}
        >
            <style>{`
                .psc-root { outline: none; }
                .psc-root:focus-visible { outline: 2px solid currentColor; outline-offset: -3px; }
                .psc-card { display: block; }
                .psc-action { display: block; width: 100%; height: 100%; padding: 0; border: 0; border-radius: inherit; background: transparent; color: inherit; font: inherit; cursor: pointer; text-decoration: none; -webkit-appearance: none; appearance: none; }
                .psc-card .psc-skin { transition: transform 380ms cubic-bezier(.2,.8,.2,1), filter 380ms ease; }
                .psc-card .psc-gloss { opacity: 0; transition: opacity 300ms ease; }
                @media (hover: hover) and (pointer: fine) {
                    .psc-root[data-interactive="true"] .psc-card:hover .psc-skin { transform: translateY(calc(-1 * var(--psc-lift))) scale(1.012); filter: brightness(1.06); }
                    .psc-root[data-interactive="true"] .psc-card:hover .psc-gloss { opacity: 1; }
                }
                .psc-action:focus-visible { outline: 2px solid currentColor; outline-offset: -3px; }
                .psc-dot { border: 0; padding: 0; background: transparent; cursor: pointer; display: grid; place-items: center; }
                .psc-dot:focus-visible { outline: 1px solid currentColor; outline-offset: 0px; border-radius: 3px; }
                .psc-dot > span { transition: transform 220ms ease, opacity 220ms ease; }
                .psc-root[data-interactive="true"] .psc-dot:hover > span { opacity: .65 !important; transform: scale(1.6); }
                .psc-root[data-interactive="true"] .psc-caption { animation: psc-caption-in 180ms ease both; }
                @keyframes psc-caption-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                @media (prefers-reduced-motion: reduce) {
                    .psc-card .psc-skin, .psc-card .psc-gloss, .psc-dot > span { transition: none; }
                    .psc-root[data-interactive="true"] .psc-caption { animation: none; }
                }
            `}</style>
            <div ref={viewport}
                style={{
                    position: pageMode ? "sticky" : "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: pageMode ? "min(100vh, 100%)" : "100%",
                    overflow: "hidden",
                }}
            >
                <div
                    ref={stage}
                    style={{
                        visibility: "hidden",
                        width: 740,
                        height: 780,
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        transformOrigin: "50% 50%",
                    }}
                >
                    {showCaption && (
                        <div
                            key={selected}
                            className="psc-caption"
                            aria-live={pageMode ? "off" : "polite"}
                            aria-atomic="true"
                            style={{
                                position: "absolute",
                                top: 42,
                                left: 70,
                                right: 70,
                                textAlign: "center",
                                pointerEvents: "none",
                                zIndex: 300,
                            }}
                        >
                            <div
                                style={{
                                    ...labelFontStyle,
                                    textTransform: "uppercase",
                                    opacity: 0.42,
                                    ...collectionFont,
                                }}
                            >
                                {currentSlide.collection}
                            </div>
                            <div
                                style={{
                                    ...titleFontStyle,
                                    marginTop: 8,
                                    ...captionFont,
                                }}
                            >
                                {currentSlide.title || `Photo ${selected + 1}`}
                            </div>
                        </div>
                    )}
                    <div
                        ref={shadowElement}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: (740 - width) / 2 - 7,
                            top: shadowTop,
                            width: width + 14,
                            height: shadowHeight,
                            filter: "blur(10px)",
                            opacity: shadow,
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                background:
                                    "linear-gradient(to bottom, rgba(70,62,73,0.03), rgba(70,62,73,1))",
                                clipPath:
                                    "polygon(12% 0, 88% 0, 100% 100%, 0% 100%)",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            perspective: perspectiveDepth,
                            perspectiveOrigin: `370px ${perspectiveOriginY}px`,
                        }}
                    >
                        {slides.map((slide, index) => {
                            const distance = mod(index - starting, count)
                            const scale = 1 / (1 + depth * distance)
                            const isVideo = slide.isVideo === true
                            const imageUrl = projectLink(slide.imageUrl)
                            // Framer may serialize the sample text without the default image.
                            const image =
                                slide.image ??
                                DEFAULT_ITEMS.find(
                                    (item) =>
                                        item.title === slide.title &&
                                        item.collection === slide.collection
                                )?.image
                            const src = isVideo
                                ? (projectLink(slide.videoUrl) ??
                                  slide.videoFile)
                                : (imageUrl ?? imageSource(image))
                            const responsive =
                                !isVideo &&
                                !imageUrl &&
                                typeof image === "object"
                                    ? image
                                    : undefined
                            const link = projectLink(slide.link)
                            const href =
                                interactive && frontCard === index
                                    ? link
                                    : undefined
                            const Card = href ? "a" : "button"
                            const title = slide.title || `photo ${index + 1}`
                            const canOpenLink = () => {
                                const { current, target } = engine.current
                                return (
                                    href &&
                                    frontCardIndex(current, target, count) ===
                                        index
                                )
                            }
                            return (
                                <div
                                    key={index}
                                    ref={(element: HTMLDivElement | null) => {
                                        cards.current[index] = element
                                        if (element) Object.assign(element.style, lastCardStyles.current[index])
                                    }}
                                    className="psc-card"
                                    style={{
                                        position: "absolute",
                                        left: (740 - width) / 2,
                                        top: frontTop,
                                        width,
                                        height,
                                        borderRadius: radius,
                                        color: "inherit",
                                        transformOrigin: "50% 0%",
                                        willChange: "transform, opacity",
                                        transform: `translate3d(0, ${stackY(distance, depth, spacing)}px, 0) scale(${scale})`,
                                        opacity: clamp(
                                            Math.min(visibleCards, count) -
                                                distance,
                                            0,
                                            1
                                        ),
                                        zIndex: 100 - distance * 4,
                                    }}
                                >

                                    <div
                                        className="psc-skin"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            position: "relative",
                                            borderRadius: "inherit",
                                            overflow: "hidden",
                                            background: `hsl(${175 + index * 21} 22% 70%)`,
                                            boxShadow:
                                                "0 1px 2px rgba(18,20,24,.05)",
                                        }}
                                    >
                                        {src && (
                                            <CardMedia
                                                key={`${isVideo}:${src}:${responsive?.srcSet || ""}`}
                                                src={src}
                                                image={responsive}
                                                isVideo={isVideo}
                                                playing={interactive && isOnscreen && frontCard === index}
                                                title={title}
                                                width={width}
                                            />
                                        )}
                                        <div
                                            className="psc-gloss"
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                background:
                                                    "linear-gradient(145deg, rgba(255,255,255,.25), rgba(255,255,255,.04))",
                                                pointerEvents: "none",
                                            }}
                                        />
                                        <Card
                                    ref={(element: HTMLAnchorElement | HTMLButtonElement | null) => {
                                        const previous = actions.current[index]
                                        if (!element && previous === document.activeElement) {
                                            focusedCard.current = index
                                        }
                                        actions.current[index] = element
                                        if (element) {
                                            if (focusedCard.current === index) {
                                                focusedCard.current = null
                                                element.focus({ preventScroll: true })
                                            }
                                        }
                                    }}
                                            className="psc-action"
                                    type={href ? undefined : "button"}
                                    href={href}
                                    target={href ? "_blank" : undefined}
                                    rel={
                                        href ? "noopener noreferrer" : undefined
                                    }
                                    draggable={href ? false : undefined}
                                    aria-label={
                                        href
                                            ? `Open ${title} (new tab)`
                                            : `Show ${title}`
                                    }
                                    aria-pressed={
                                        href ? undefined : selected === index
                                    }
                                    tabIndex={
                                        interactive &&
                                        (href || selected === index)
                                            ? 0
                                            : -1
                                    }
                                    onClick={(
                                        event: React.MouseEvent<HTMLElement>
                                    ) => {
                                        if (suppressClick.current) {
                                            event.preventDefault()
                                            suppressClick.current = false
                                            return
                                        }
                                        if (canOpenLink()) return
                                        event.preventDefault()
                                        if (!href) select(index)
                                    }}
                                    onAuxClick={(
                                        event: React.MouseEvent<HTMLElement>
                                    ) => {
                                        if (
                                            suppressClick.current ||
                                            !canOpenLink()
                                        )
                                            event.preventDefault()
                                    }}

                                            style={{ position: "absolute", inset: 0, zIndex: 1 }}
                                        />
                                    </div>

                                </div>
                            )
                        })}
                    </div>
                </div>
                {showDots && count > 1 && (
                    <nav
                        aria-label="Choose photo"
                        style={{
                            position: "absolute",
                            zIndex: 300,
                            display: "flex",
                            alignItems: "center",
                            flexDirection: horizontalDots ? "row" : "column",
                            ...(horizontalDots
                                ? {
                                      left: "50%",
                                      bottom: dotsEdgeInset + activeDotSize / 2,
                                      transform: "translate(-50%, 50%)",
                                      maxWidth: "calc(100% - 32px)",
                                  }
                                : {
                                      right: dotsEdgeInset,
                                      top: "50%",
                                      transform: "translate(50%, -50%)",
                                      maxHeight: "calc(100% - 16px)",
                                  }),
                        }}
                    >
                        {slides.map((slide, index) => (
                            <button
                                key={index}
                                className="psc-dot"
                                type="button"
                                aria-label={`Go to ${slide.title || `photo ${index + 1}`}`}
                                aria-current={
                                    index === selected ? "true" : undefined
                                }
                                tabIndex={interactive ? 0 : -1}
                                onClick={() => select(index)}
                                style={{
                                    width: horizontalDots ? 12 : 16,
                                    height: horizontalDots ? dotsHeight : 9,
                                    minWidth: 0,
                                    minHeight: 0,
                                    color: "inherit",
                                }}
                            >
                                <span
                                    style={{
                                        width:
                                            index === selected
                                                ? activeDotSize
                                                : activeDotSize / 2,
                                        height:
                                            index === selected
                                                ? activeDotSize
                                                : activeDotSize / 2,
                                        borderRadius: "50%",
                                        background: "currentColor",
                                        opacity: index === selected ? 1 : 0.16,
                                    }}
                                />
                            </button>
                        ))}
                    </nav>
                )}
            </div>
        </div>
    )
}

CMSStackCarousel.displayName = "CMS Stack Carousel"
CMSStackCarousel.defaultProps = { ...DEFAULTS, items: undefined }

const captionsHidden = (settings: TextSettings | undefined, props?: Props) =>
    (settings?.showCaption ?? props?.showCaption ?? DEFAULTS.showCaption) ===
    false
const isPageScroll = (
    settings: NavigationSettings | undefined,
    props?: Props
) =>
    (settings?.scrollMode ?? props?.scrollMode ?? DEFAULTS.scrollMode) ===
    "page"

const cardListControl = {
    type: ControlType.Array,
    maxCount: 50,
    control: {
        type: ControlType.Object,
        controls: {
            isVideo: {
                type: ControlType.Boolean,
                title: "Media",
                defaultValue: false,
                enabledTitle: "Video",
                disabledTitle: "Image",
            },
            image: {
                type: ControlType.ResponsiveImage,
                title: "Upload Image",
                hidden: (card?: Slide) => card?.isVideo === true,
            },
            videoFile: {
                type: ControlType.File,
                title: "Upload Video",
                allowedFileTypes: ["mp4", "webm", "mov"],
                hidden: (card?: Slide) => card?.isVideo !== true,
            },
            imageUrl: {
                type: ControlType.String,
                title: "Media URL",
                placeholder: "https://example.com/image.jpg",
                description:
                    "Paste a direct image URL to use it instead of the upload.",
                hidden: (card?: Slide) => card?.isVideo === true,
            },
            videoUrl: {
                type: ControlType.String,
                title: "Media URL",
                placeholder: "https://example.com/video.mp4",
                description:
                    "Paste a direct video file URL to use it instead of the upload. The front card plays muted and loops.",
                hidden: (card?: Slide) => card?.isVideo !== true,
            },
            title: {
                type: ControlType.String,
                title: "Title",
                placeholder: "e.g. Summit",
            },
            collection: {
                type: ControlType.String,
                title: "Collection Label",
                placeholder: "e.g. Alpine Collective",
                description:
                    "The small label above the card title. Leave blank to show the title on its own.",
            },
            link: {
                type: ControlType.Link,
                title: "Project Link",
                description:
                    "Opens in a new tab when this card is clicked at the front of the stack.",
            },
        },
    },
} as const

addPropertyControls(CMSStackCarousel, {
    items: {
        ...cardListControl,
        title: "Cards",
        defaultValue: DEFAULTS.items,
        description:
            "Add or reorder cards. Open a card to choose its media, edit the caption, or set a project link.",
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        optional: true,
        description:
            "Set the card size and how much of the stack is visible. Cards scale with the component.",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                defaultValue: DEFAULTS.cardWidth,
                min: 200,
                max: 620,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Card Height",
                defaultValue: DEFAULTS.cardHeight,
                min: 100,
                max: 360,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            radius: {
                type: ControlType.Number,
                title: "Corner Radius",
                defaultValue: DEFAULTS.radius,
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
            },
            visibleCards: {
                type: ControlType.Number,
                title: "Visible Cards",
                defaultValue: DEFAULTS.visibleCards,
                min: 2,
                max: 20,
                step: 1,
                displayStepper: true,
                description:
                    "How many cards appear in the stack, including the front card.",
            },
            spacing: {
                type: ControlType.Number,
                title: "Stack Spacing",
                defaultValue: DEFAULTS.spacing,
                min: 12,
                max: 55,
                step: 0.5,
                unit: "px",
                description:
                    "Increase spacing to reveal more of each card behind the front card.",
            },
            depthPercent: {
                type: ControlType.Number,
                title: "Stack Depth",
                defaultValue: Math.round(DEFAULTS.depth * 100),
                min: 2,
                max: 20,
                step: 0.5,
                unit: "%",
                description:
                    "Higher values make cards farther back appear smaller.",
            },
        },
    },
    textSettings: {
        type: ControlType.Object,
        title: "Text Settings",
        icon: "object",
        optional: true,
        description:
            "Style the title and collection label above the stack. Edit the words in Cards.",
        controls: {
            showCaption: {
                type: ControlType.Boolean,
                title: "Show Caption",
                defaultValue: DEFAULTS.showCaption,
                description:
                    "Show the selected card’s title and collection label.",
            },
            captionFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultValue: titleFontDefault,
                hidden: captionsHidden,
            },
            collectionFont: {
                type: ControlType.Font,
                title: "Collection Font",
                controls: "extended",
                defaultValue: labelFontDefault,
                hidden: captionsHidden,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text & Dot Color",
                defaultValue: DEFAULTS.textColor,
                description: "Applies to the caption and navigation dots.",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        icon: "color",
        optional: true,
        description:
            "Set the color behind the stack and the shadow beneath it.",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: DEFAULTS.background,
            },
            shadowPercent: {
                type: ControlType.Number,
                title: "Shadow Opacity",
                defaultValue: DEFAULTS.shadow * 100,
                min: 0,
                max: 60,
                step: 1,
                unit: "%",
                description: "Set to 0% to remove the shadow under the stack.",
            },
        },
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        icon: "interaction",
        optional: true,
        description: "Choose how visitors move through the cards.",
        controls: {
            scrollMode: {
                type: ControlType.Enum,
                title: "Scroll Mode",
                defaultValue: DEFAULTS.scrollMode,
                options: ["wheel", "page"],
                optionTitles: ["Wheel & Touch", "Page Scroll"],
                description:
                    "**Wheel & Touch** scrolls the stack directly. For **Page Scroll**, set the component height to about 4,200 px and its parent’s overflow to Visible.",
            },
            initialCard: {
                type: ControlType.Number,
                title: "Starting Card",
                defaultValue: DEFAULTS.initialCard,
                min: 1,
                max: 50,
                step: 1,
                displayStepper: true,
                hidden: isPageScroll,
                description:
                    "Choose which card appears first by its position in the Cards list. The first card is 1.",
            },
            showDots: {
                type: ControlType.Boolean,
                title: "Show Dots",
                defaultValue: DEFAULTS.showDots,
                description: "Show clickable dots for jumping to any card.",
            },
            horizontalDots: {
                type: ControlType.Boolean,
                title: "Dot Orientation",
                defaultValue: DEFAULTS.horizontalDots,
                enabledTitle: "Horizontal",
                disabledTitle: "Vertical",
                hidden: (
                    settings: NavigationSettings | undefined,
                    props?: Props
                ) =>
                    !(
                        settings?.showDots ??
                        props?.showDots ??
                        DEFAULTS.showDots
                    ),
                description:
                    "Position the dots 50 px from the bottom or right edge.",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop Cards",
                defaultValue: DEFAULTS.loop,
                hidden: isPageScroll,
                description:
                    "Continue from the last card to the first, and back again.",
            },
            sensitivity: {
                type: ControlType.Number,
                title: "Scroll per Card",
                defaultValue: DEFAULTS.sensitivity,
                min: 60,
                max: 800,
                step: 10,
                unit: "px",
                hidden: isPageScroll,
                description:
                    "Lower values move through the cards with a shorter scroll or swipe.",
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: DEFAULTS.autoplay,
                hidden: isPageScroll,
                description: "Advance cards automatically when visitors pause.",
            },
            interval: {
                type: ControlType.Number,
                title: "Time per Card",
                defaultValue: DEFAULTS.interval,
                min: 1,
                max: 12,
                step: 0.5,
                unit: "s",
                hidden: (settings: NavigationSettings, props?: Props) =>
                    isPageScroll(settings, props) ||
                    !(
                        settings?.autoplay ??
                        props?.autoplay ??
                        DEFAULTS.autoplay
                    ),
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        icon: "effect",
        optional: true,
        description:
            "Fine-tune the feel of the card transitions and hover effect.\n\nMade by [Zelo Studio](https://framer.link/kjFVSDz)\n[→ More Components](https://framer.link/kjFVSDz)",
        controls: {
            smoothing: {
                type: ControlType.Number,
                title: "Response Time",
                defaultValue: DEFAULTS.smoothing,
                min: 0.03,
                max: 0.5,
                step: 0.01,
                unit: "s",
                description:
                    "Lower values make cards respond sooner to scrolling and clicks.",
            },
            hoverLift: {
                type: ControlType.Number,
                title: "Hover Lift",
                defaultValue: DEFAULTS.hoverLift,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                description:
                    "How far a card lifts when a pointer moves over it.",
            },
        },
    },
    onChange: {
        type: ControlType.EventHandler,
        title: "On Card Change",
        description:
            "Trigger a Framer interaction when the selected card changes.",
    },

    // Keep previous control IDs registered so saved instance values remain readable.
    cardSettings: {
        type: ControlType.Object,
        hidden: true,
        controls: { items: cardListControl },
    },
    cardWidth: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.cardWidth,
        min: 200,
        max: 620,
        step: 1,
        hidden: true,
    },
    cardHeight: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.cardHeight,
        min: 100,
        max: 360,
        step: 1,
        hidden: true,
    },
    radius: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.radius,
        min: 0,
        max: 80,
        step: 1,
        hidden: true,
    },
    visibleCards: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.visibleCards,
        min: 2,
        max: 20,
        step: 1,
        hidden: true,
    },
    spacing: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.spacing,
        min: 12,
        max: 55,
        step: 0.5,
        hidden: true,
    },
    depth: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.depth,
        min: 0.02,
        max: 0.2,
        step: 0.005,
        hidden: true,
    },
    showCaption: {
        type: ControlType.Boolean,
        defaultValue: DEFAULTS.showCaption,
        hidden: true,
    },
    captionFont: {
        type: ControlType.Font,
        defaultValue: titleFontDefault,
        controls: "extended",
        hidden: true,
    },
    collectionFont: {
        type: ControlType.Font,
        defaultValue: labelFontDefault,
        controls: "extended",
        hidden: true,
    },
    textColor: {
        type: ControlType.Color,
        defaultValue: DEFAULTS.textColor,
        hidden: true,
    },
    background: {
        type: ControlType.Color,
        defaultValue: DEFAULTS.background,
        hidden: true,
    },
    shadow: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.shadow,
        min: 0,
        max: 0.6,
        step: 0.01,
        hidden: true,
    },
    scrollMode: {
        type: ControlType.Enum,
        defaultValue: DEFAULTS.scrollMode,
        options: ["wheel", "page"],
        hidden: true,
    },
    initialCard: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.initialCard,
        min: 1,
        max: 50,
        step: 1,
        hidden: true,
    },
    showDots: {
        type: ControlType.Boolean,
        defaultValue: DEFAULTS.showDots,
        hidden: true,
    },
    loop: {
        type: ControlType.Boolean,
        defaultValue: DEFAULTS.loop,
        hidden: true,
    },
    sensitivity: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.sensitivity,
        min: 60,
        max: 800,
        step: 10,
        hidden: true,
    },
    autoplay: {
        type: ControlType.Boolean,
        defaultValue: DEFAULTS.autoplay,
        hidden: true,
    },
    interval: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.interval,
        min: 1,
        max: 12,
        step: 0.5,
        hidden: true,
    },
    smoothing: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.smoothing,
        min: 0.03,
        max: 0.5,
        step: 0.01,
        hidden: true,
    },
    hoverLift: {
        type: ControlType.Number,
        defaultValue: DEFAULTS.hoverLift,
        min: 0,
        max: 40,
        step: 1,
        hidden: true,
    },
})
