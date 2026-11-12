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


type ResponsiveImage = {
    src: string
    srcSet?: string
    alt?: string
}

type ReelItem = {
    title: string
    category: string
    year: string
    link: string
    accent: string
    image?: ResponsiveImage
}

type Palette = {
    background: string
    foreground: string
    muted: string
    line: string
    card: string
    control: string
}

type LayoutSettings = {
    padding: number
    gap: number
    cardWidth: number
    cardRadius: number
    radius: number
    compactAt: number
}

type MotionSettings = {
    enabled: boolean
    duration: number
    rotation: number
    lift: number
    depth: number
    dragThreshold: number
}

type MediaSettings = {
    fit: "cover" | "contain"
    overlay: number
    grain: number
    showGrid: boolean
}

type NavigationSettings = {
    initialItem: number
    loop: boolean
    wheel: boolean
    showButtons: boolean
    showProgress: boolean
    openInNewTab: boolean
}

export interface MorrowReelProps {
    items: ReelItem[]
    eyebrow: string
    heading: string
    displayFont: React.CSSProperties
    metaFont: React.CSSProperties
    palette: Palette
    layout: LayoutSettings
    motion: MotionSettings
    media: MediaSettings
    navigation: NavigationSettings
    ariaLabel: string
    style?: React.CSSProperties
}

const defaultItems: ReelItem[] = [
    {
        title: "Monolith",
        category: "ART DIRECTION",
        year: "2026",
        link: "#monolith",
        accent: "#FF603E",
    },
    {
        title: "Silt",
        category: "DIGITAL IDENTITY",
        year: "2025",
        link: "#silt",
        accent: "#2457FF",
    },
    {
        title: "Glasshouse",
        category: "CULTURE & SPACE",
        year: "2026",
        link: "#glasshouse",
        accent: "#D5FF38",
    },
    {
        title: "Afterimage",
        category: "CAMPAIGN SYSTEM",
        year: "2024",
        link: "#afterimage",
        accent: "#B78DFF",
    },
    {
        title: "Commons",
        category: "PRODUCT STORY",
        year: "2025",
        link: "#commons",
        accent: "#FFD84D",
    },
]

const defaults: MorrowReelProps = {
    items: defaultItems,
    eyebrow: "SELECTED ARCHIVE / 2024—26",
    heading: "MORROW REEL",
    displayFont: {
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: 650,
        letterSpacing: "-0.055em",
        lineHeight: "0.9em",
    },
    metaFont: {
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: 550,
        letterSpacing: "0.09em",
        lineHeight: "1em",
    },
    palette: {
        background: "#EAE5DA",
        foreground: "#171713",
        muted: "#767269",
        line: "rgba(23,23,19,0.18)",
        card: "#D6D0C4",
        control: "#171713",
    },
    layout: {
        padding: 30,
        gap: 24,
        cardWidth: 56,
        cardRadius: 22,
        radius: 30,
        compactAt: 620,
    },
    motion: {
        enabled: true,
        duration: 620,
        rotation: 7,
        lift: 24,
        depth: 90,
        dragThreshold: 42,
    },
    media: {
        fit: "cover",
        overlay: 16,
        grain: 8,
        showGrid: true,
    },
    navigation: {
        initialItem: 1,
        loop: true,
        wheel: true,
        showButtons: true,
        showProgress: true,
        openInNewTab: false,
    },
    ariaLabel: "Featured projects gallery",
    style: {},
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function withAlpha(color: string, opacity: number) {
    const amount = clamp(opacity, 0, 1)
    const shortHex = /^#([0-9a-f]{3})$/i.exec(color)
    const longHex = /^#([0-9a-f]{6})$/i.exec(color)
    const base = shortHex
        ? `#${shortHex[1]
              .split("")
              .map((character) => character + character)
              .join("")}`
        : longHex
          ? color
          : null
    if (base) {
        return `${base}${Math.round(amount * 255)
            .toString(16)
            .padStart(2, "0")}`
    }
    return `color-mix(in srgb, ${color} ${amount * 100}%, transparent)`
}

function normalizeIndex(index: number, count: number, loop: boolean) {
    if (count <= 0) return 0
    if (loop) return ((index % count) + count) % count
    return clamp(index, 0, count - 1)
}

function useReducedMotion() {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(media.matches)
        update()
        media.addEventListener?.("change", update)
        return () => media.removeEventListener?.("change", update)
    }, [])
    return reduced
}

function useElementWidth(ref: React.RefObject<HTMLElement>) {
    const [width, setWidth] = React.useState(1080)
    React.useEffect(() => {
        const node = ref.current
        if (!node) return
        const update = () => {
            const next = node.getBoundingClientRect().width
            if (next > 0) setWidth(next)
        }
        update()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(update)
        observer.observe(node)
        return () => observer.disconnect()
    }, [ref])
    return width
}

function Grain({ opacity }: { opacity: number }) {
    if (opacity <= 0) return null
    const noise = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity=".8"/></svg>`
    )
    return (
        <span
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 8,
                pointerEvents: "none",
                opacity: opacity / 100,
                mixBlendMode: "soft-light",
                backgroundImage: `url("data:image/svg+xml,${noise}")`,
                backgroundSize: "180px 180px",
            }}
        />
    )
}

function Arrow({ direction }: { direction: "previous" | "next" }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
        >
            <path
                d={
                    direction === "next"
                        ? "M5 12h13m-5-5 5 5-5 5"
                        : "M19 12H6m5-5-5 5 5 5"
                }
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/**
 * MORROW REEL
 * A tactile editorial project gallery with drag, wheel, buttons, and keyboard navigation.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 720
 */
export default function MorrowReel(rawProps: MorrowReelProps) {
    const props = { ...defaults, ...rawProps }
    const items = props.items?.length ? props.items.slice(0, 10) : defaultItems
    const palette = { ...defaults.palette, ...props.palette }
    const layout = { ...defaults.layout, ...props.layout }
    const motion = { ...defaults.motion, ...props.motion }
    const media = { ...defaults.media, ...props.media }
    const navigation = { ...defaults.navigation, ...props.navigation }
    const staticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const canAnimate = motion.enabled && !staticRenderer && !reducedMotion
    const rootRef = React.useRef<HTMLElement>(null)
    const viewportRef = React.useRef<HTMLDivElement>(null)
    const trackRef = React.useRef<HTMLDivElement>(null)
    const width = useElementWidth(rootRef)
    const compact = width <= layout.compactAt
    const cardPercent = compact
        ? Math.min(88, layout.cardWidth + 22)
        : layout.cardWidth
    const cardWidth = clamp(
        (width * cardPercent) / 100,
        compact ? 230 : 320,
        760
    )
    const gap = compact ? Math.min(layout.gap, 14) : layout.gap
    const step = cardWidth + gap
    const start = normalizeIndex(
        Math.round(navigation.initialItem || 0),
        items.length,
        navigation.loop
    )
    const [activeIndex, setActiveIndex] = React.useState(start)
    const [dragging, setDragging] = React.useState(false)
    const wheelLock = React.useRef(false)
    const drag = React.useRef({
        pointerId: -1,
        startX: 0,
        lastX: 0,
        lastTime: 0,
        velocity: 0,
        baseOffset: 0,
        moved: false,
    })

    React.useEffect(() => {
        setActiveIndex(start)
    }, [start, items.length])

    const offsetFor = React.useCallback(
        (index: number) => width / 2 - cardWidth / 2 - index * step,
        [cardWidth, step, width]
    )

    const select = React.useCallback(
        (next: number) => {
            setActiveIndex(normalizeIndex(next, items.length, navigation.loop))
        },
        [items.length, navigation.loop]
    )

    const onPointerDown = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (
                staticRenderer ||
                (event.pointerType === "mouse" && event.button !== 0)
            )
                return
            const node = event.currentTarget
            node.setPointerCapture(event.pointerId)
            const time = performance.now()
            drag.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                lastX: event.clientX,
                lastTime: time,
                velocity: 0,
                baseOffset: offsetFor(activeIndex),
                moved: false,
            }
            setDragging(true)
        },
        [activeIndex, offsetFor, staticRenderer]
    )

    const onPointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!dragging || drag.current.pointerId !== event.pointerId) return
            const now = performance.now()
            const delta = event.clientX - drag.current.startX
            const elapsed = Math.max(8, now - drag.current.lastTime)
            drag.current.velocity =
                (event.clientX - drag.current.lastX) / elapsed
            drag.current.lastX = event.clientX
            drag.current.lastTime = now
            if (Math.abs(delta) > 5) drag.current.moved = true
            if (trackRef.current) {
                trackRef.current.style.transition = "none"
                trackRef.current.style.transform = `translate3d(${drag.current.baseOffset + delta}px,0,0)`
            }
        },
        [dragging]
    )

    const finishDrag = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!dragging || drag.current.pointerId !== event.pointerId) return
            const node = event.currentTarget
            if (node.hasPointerCapture(event.pointerId))
                node.releasePointerCapture(event.pointerId)
            const delta = event.clientX - drag.current.startX
            const projected = delta + drag.current.velocity * 180
            const crossed = Math.abs(delta) >= motion.dragThreshold
            const travel = crossed ? Math.round(-projected / step) : 0
            setDragging(false)
            select(activeIndex + travel)
            requestAnimationFrame(() => {
                if (!trackRef.current) return
                trackRef.current.style.transition = ""
                trackRef.current.style.transform = ""
            })
        },
        [activeIndex, dragging, motion.dragThreshold, select, step]
    )

    React.useEffect(() => {
        const node = viewportRef.current
        if (!node || !navigation.wheel || staticRenderer) return
        const onWheel = (event: WheelEvent) => {
            if (wheelLock.current) return
            const delta =
                Math.abs(event.deltaX) > Math.abs(event.deltaY)
                    ? event.deltaX
                    : event.deltaY
            if (Math.abs(delta) < 14) return
            event.preventDefault()
            wheelLock.current = true
            select(activeIndex + (delta > 0 ? 1 : -1))
            window.setTimeout(
                () => {
                    wheelLock.current = false
                },
                canAnimate ? clamp(motion.duration * 0.72, 180, 720) : 80
            )
        }
        node.addEventListener("wheel", onWheel, { passive: false })
        return () => node.removeEventListener("wheel", onWheel)
    }, [
        activeIndex,
        canAnimate,
        motion.duration,
        navigation.wheel,
        select,
        staticRenderer,
    ])

    const onKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLElement>) => {
            if (event.key === "ArrowRight") {
                event.preventDefault()
                select(activeIndex + 1)
            } else if (event.key === "ArrowLeft") {
                event.preventDefault()
                select(activeIndex - 1)
            } else if (event.key === "Home") {
                event.preventDefault()
                select(0)
            } else if (event.key === "End") {
                event.preventDefault()
                select(items.length - 1)
            }
        },
        [activeIndex, items.length, select]
    )

    const duration = canAnimate ? clamp(motion.duration, 120, 1400) : 0
    const active = items[activeIndex] || items[0]
    const target = navigation.openInNewTab ? "_blank" : undefined
    const rel = navigation.openInNewTab ? "noreferrer noopener" : undefined

    return (
        <section
            ref={rootRef}
            className="morrow-root"
            role="region"
            aria-roledescription="carousel"
            aria-label={props.ariaLabel || "Featured projects gallery"}
            tabIndex={0}
            onKeyDown={onKeyDown}
            style={{
                position: "relative",
                width: 1080,
                height: 720,
                maxWidth: "100%",
                overflow: "hidden",
                isolation: "isolate",
                containerType: "inline-size",
                containerName: "morrow-reel",
                borderRadius: layout.radius,
                border: `1px solid ${palette.line}`,
                color: palette.foreground,
                background: palette.background,
                boxSizing: "border-box",
                WebkitFontSmoothing: "antialiased",
                outline: "none",
                ...props.style,
            }}
        >
            <style>{`
                .morrow-root:focus-visible { box-shadow: inset 0 0 0 2px ${active.accent}; }
                .morrow-card:focus-visible { outline: 2px solid ${active.accent}; outline-offset: 4px; }
                .morrow-control:focus-visible { outline: 2px solid ${active.accent}; outline-offset: 3px; }
                @container morrow-reel (max-width: ${layout.compactAt}px) {
                    .morrow-heading { font-size: clamp(34px, 10cqw, 54px) !important; }
                    .morrow-eyebrow-center { display: none !important; }
                    .morrow-card-title { font-size: clamp(35px, 11cqw, 54px) !important; }
                    .morrow-card-category { max-width: 120px; }
                    .morrow-footer-note { display: none !important; }
                }
                @media (pointer: coarse) {
                    .morrow-viewport { cursor: grab !important; }
                }
            `}</style>

            <header
                style={{
                    position: "absolute",
                    top: layout.padding,
                    left: layout.padding,
                    right: layout.padding,
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "start",
                    gap: 16,
                    zIndex: 20,
                    pointerEvents: "none",
                }}
            >
                <h2
                    className="morrow-heading"
                    style={{
                        margin: 0,
                        ...props.displayFont,
                        fontSize: "clamp(38px, 5.2cqw, 66px)",
                        whiteSpace: "nowrap",
                    }}
                >
                    {props.heading}
                </h2>
                <span
                    className="morrow-eyebrow-center"
                    style={{
                        paddingTop: 7,
                        ...props.metaFont,
                        fontSize: 9,
                        color: palette.muted,
                    }}
                >
                    {props.eyebrow}
                </span>
                <span
                    style={{
                        justifySelf: "end",
                        paddingTop: 7,
                        ...props.metaFont,
                        fontSize: 9,
                    }}
                >
                    {String(activeIndex + 1).padStart(2, "0")} /{" "}
                    {String(items.length).padStart(2, "0")}
                </span>
            </header>

            <div
                ref={viewportRef}
                className="morrow-viewport"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                style={{
                    position: "absolute",
                    inset: `${compact ? 104 : 116}px 0 ${compact ? 74 : 82}px`,
                    overflow: "hidden",
                    cursor: dragging ? "grabbing" : "grab",
                    touchAction: "pan-y",
                    perspective: 1500,
                }}
            >
                <div
                    ref={trackRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        gap,
                        width: "max-content",
                        transform: `translate3d(${offsetFor(activeIndex)}px,0,0)`,
                        transition: dragging
                            ? "none"
                            : `transform ${duration}ms cubic-bezier(.22,.76,.18,1)`,
                        willChange:
                            canAnimate || dragging ? "transform" : undefined,
                    }}
                >
                    {items.map((item, index) => {
                        const distance = index - activeIndex
                        const selected = distance === 0
                        const absoluteDistance = Math.abs(distance)
                        const rotateY = canAnimate
                            ? clamp(distance * -motion.rotation, -16, 16)
                            : 0
                        const rotateZ = canAnimate
                            ? clamp(distance * motion.rotation * 0.18, -3, 3)
                            : 0
                        const lift = canAnimate
                            ? selected
                                ? -motion.lift
                                : absoluteDistance * 12
                            : 0
                        const scale = canAnimate
                            ? clamp(1 - absoluteDistance * 0.085, 0.78, 1)
                            : 1
                        const fallback = `radial-gradient(circle at ${
                            24 + (index % 3) * 26
                        }% ${22 + (index % 2) * 52}%, ${item.accent} 0%, ${withAlpha(
                            item.accent,
                            0.78
                        )} 18%, transparent 43%), linear-gradient(${
                            118 + index * 17
                        }deg, ${palette.card} 4%, ${withAlpha(item.accent, 0.48)} 56%, #11110F 130%)`

                        return (
                            <article
                                key={`${item.title}-${index}`}
                                aria-hidden={!selected}
                                style={{
                                    position: "relative",
                                    flex: "0 0 auto",
                                    width: cardWidth,
                                    height: "92%",
                                    overflow: "hidden",
                                    borderRadius: layout.cardRadius,
                                    border: `1px solid ${selected ? withAlpha(item.accent, 0.72) : palette.line}`,
                                    background: fallback,
                                    boxShadow: selected
                                        ? `0 ${28 + motion.depth * 0.2}px ${48 + motion.depth * 0.45}px rgba(31,28,22,.22), 0 0 0 1px rgba(255,255,255,.18) inset`
                                        : "0 18px 34px rgba(31,28,22,.1)",
                                    transform: `translate3d(0,${lift}px,${selected && canAnimate ? motion.depth : 0}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                                    opacity: clamp(
                                        1 - absoluteDistance * 0.22,
                                        0.42,
                                        1
                                    ),
                                    transition: `transform ${duration}ms cubic-bezier(.22,.76,.18,1), opacity ${duration}ms ease, box-shadow ${duration}ms ease, border-color ${duration}ms ease`,
                                    transformStyle: "preserve-3d",
                                    willChange: canAnimate
                                        ? "transform"
                                        : undefined,
                                }}
                            >
                                {item.image?.src && (
                                    <img
                                        src={item.image.src}
                                        srcSet={item.image.srcSet}
                                        alt=""
                                        draggable={false}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: media.fit,
                                            transform:
                                                selected && canAnimate
                                                    ? "scale(1.035)"
                                                    : "scale(1)",
                                            transition: `transform ${duration}ms ease`,
                                        }}
                                    />
                                )}

                                {media.showGrid && (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            opacity: 0.34,
                                            backgroundImage: `linear-gradient(${palette.line} 1px, transparent 1px), linear-gradient(90deg, ${palette.line} 1px, transparent 1px)`,
                                            backgroundSize: "44px 44px",
                                            maskImage:
                                                "linear-gradient(to bottom, black, transparent 76%)",
                                            WebkitMaskImage:
                                                "linear-gradient(to bottom, black, transparent 76%)",
                                        }}
                                    />
                                )}

                                <span
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        width: "58%",
                                        aspectRatio: "1",
                                        top: "13%",
                                        right: "-8%",
                                        borderRadius: "50%",
                                        border: "1px solid rgba(255,255,255,.52)",
                                        boxShadow:
                                            "0 0 0 28px rgba(255,255,255,.045), 0 0 0 74px rgba(255,255,255,.025)",
                                        transform:
                                            selected && canAnimate
                                                ? "translate3d(-8px,8px,0)"
                                                : "none",
                                        transition: `transform ${duration}ms ease`,
                                    }}
                                />

                                <span
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: `linear-gradient(180deg, ${withAlpha(
                                            palette.foreground,
                                            media.overlay / 300
                                        )}, transparent 44%, rgba(8,8,7,.72) 100%)`,
                                    }}
                                />

                                <div
                                    style={{
                                        position: "absolute",
                                        inset: compact ? 20 : 26,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        zIndex: 4,
                                        color: "#F6F1E7",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: 16,
                                            ...props.metaFont,
                                            fontSize: 9,
                                        }}
                                    >
                                        <span>
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <span>{item.year}</span>
                                    </div>

                                    <div>
                                        <h3
                                            className="morrow-card-title"
                                            style={{
                                                margin: "0 0 14px",
                                                ...props.displayFont,
                                                fontSize:
                                                    "clamp(42px, 6.4cqw, 78px)",
                                                overflowWrap: "anywhere",
                                            }}
                                        >
                                            {item.title}
                                        </h3>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-end",
                                                justifyContent: "space-between",
                                                gap: 18,
                                            }}
                                        >
                                            <span
                                                className="morrow-card-category"
                                                style={{
                                                    ...props.metaFont,
                                                    fontSize: 9,
                                                }}
                                            >
                                                {item.category}
                                            </span>
                                            <a
                                                className="morrow-card"
                                                href={item.link || "#"}
                                                target={target}
                                                rel={rel}
                                                tabIndex={selected ? 0 : -1}
                                                aria-label={`Open ${item.title}`}
                                                aria-current={
                                                    selected
                                                        ? "true"
                                                        : undefined
                                                }
                                                onClick={(event) => {
                                                    if (drag.current.moved)
                                                        event.preventDefault()
                                                }}
                                                style={{
                                                    display: "grid",
                                                    placeItems: "center",
                                                    width: 46,
                                                    height: 46,
                                                    flex: "0 0 auto",
                                                    borderRadius: "50%",
                                                    color: palette.foreground,
                                                    background: item.accent,
                                                    textDecoration: "none",
                                                    transform: selected
                                                        ? "rotate(-14deg)"
                                                        : "rotate(0deg)",
                                                    transition: `transform ${duration}ms ease`,
                                                }}
                                            >
                                                <Arrow direction="next" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <Grain opacity={media.grain} />
                            </article>
                        )
                    })}
                </div>
            </div>

            <footer
                style={{
                    position: "absolute",
                    left: layout.padding,
                    right: layout.padding,
                    bottom: layout.padding,
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                    gap: 16,
                    zIndex: 20,
                }}
            >
                <span
                    className="morrow-footer-note"
                    style={{
                        ...props.metaFont,
                        fontSize: 9,
                        color: palette.muted,
                    }}
                >
                    DRAG / SCROLL / USE ARROWS
                </span>

                {navigation.showProgress && (
                    <div
                        aria-hidden="true"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                        }}
                    >
                        {items.map((item, index) => (
                            <span
                                key={`${item.title}-progress`}
                                style={{
                                    display: "block",
                                    width: index === activeIndex ? 34 : 8,
                                    height: 4,
                                    borderRadius: 999,
                                    background:
                                        index === activeIndex
                                            ? item.accent
                                            : palette.line,
                                    transition: `width ${duration}ms ease, background ${duration}ms ease`,
                                }}
                            />
                        ))}
                    </div>
                )}

                {navigation.showButtons && (
                    <div
                        style={{
                            justifySelf: "end",
                            display: "flex",
                            gap: 8,
                        }}
                    >
                        {(["previous", "next"] as const).map((direction) =>
                            (() => {
                                const disabled =
                                    !navigation.loop &&
                                    ((direction === "previous" &&
                                        activeIndex === 0) ||
                                        (direction === "next" &&
                                            activeIndex === items.length - 1))
                                return (
                                    <button
                                        key={direction}
                                        className="morrow-control"
                                        type="button"
                                        disabled={disabled}
                                        aria-label={`${direction === "next" ? "Next" : "Previous"} project`}
                                        onClick={() =>
                                            select(
                                                activeIndex +
                                                    (direction === "next"
                                                        ? 1
                                                        : -1)
                                            )
                                        }
                                        style={{
                                            display: "grid",
                                            placeItems: "center",
                                            width: 42,
                                            height: 42,
                                            padding: 0,
                                            borderRadius: "50%",
                                            border: `1px solid ${palette.line}`,
                                            color: palette.background,
                                            background: palette.control,
                                            cursor: disabled
                                                ? "not-allowed"
                                                : "pointer",
                                            opacity: disabled ? 0.35 : 1,
                                        }}
                                    >
                                        <Arrow direction={direction} />
                                    </button>
                                )
                            })()
                        )}
                    </div>
                )}
            </footer>

            <span
                aria-live="polite"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0,0,0,0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {active.title}, item {activeIndex + 1} of {items.length}
            </span>

            <Grain opacity={media.grain * 0.34} />
        </section>
    )
}

MorrowReel.defaultProps = defaults

addPropertyControls(MorrowReel, {
    items: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 10,
        defaultValue: defaultItems,
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "ART DIRECTION",
                },
                year: {
                    type: ControlType.String,
                    title: "Year",
                    defaultValue: "2026",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "#",
                },
                accent: {
                    type: ControlType.Color,
                    title: "Accent",
                    defaultValue: "#FF603E",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        description:
            "Add up to ten linked projects. Images are optional; each item has a designed fallback artwork.",
    },
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: defaults.eyebrow,
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: defaults.heading,
    },
    displayFont: {
        type: ControlType.Font,
        title: "Display",
        defaultFontType: "sans-serif",
        controls: "extended",
        defaultValue: defaults.displayFont as any,
    },
    metaFont: {
        type: ControlType.Font,
        title: "Utility",
        defaultFontType: "sans-serif",
        controls: "extended",
        defaultValue: defaults.metaFont as any,
    },
    palette: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: defaults.palette.background,
            },
            foreground: {
                type: ControlType.Color,
                title: "Foreground",
                defaultValue: defaults.palette.foreground,
            },
            muted: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: defaults.palette.muted,
            },
            line: {
                type: ControlType.Color,
                title: "Lines",
                defaultValue: defaults.palette.line,
            },
            card: {
                type: ControlType.Color,
                title: "Card Base",
                defaultValue: defaults.palette.card,
            },
            control: {
                type: ControlType.Color,
                title: "Controls",
                defaultValue: defaults.palette.control,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 14,
                max: 72,
                unit: "px",
                defaultValue: defaults.layout.padding,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: defaults.layout.gap,
            },
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 38,
                max: 82,
                unit: "%",
                defaultValue: defaults.layout.cardWidth,
            },
            cardRadius: {
                type: ControlType.Number,
                title: "Card Radius",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: defaults.layout.cardRadius,
            },
            radius: {
                type: ControlType.Number,
                title: "Frame Radius",
                min: 0,
                max: 80,
                unit: "px",
                defaultValue: defaults.layout.radius,
            },
            compactAt: {
                type: ControlType.Number,
                title: "Compact At",
                min: 380,
                max: 900,
                unit: "px",
                defaultValue: defaults.layout.compactAt,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: defaults.motion.enabled,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 120,
                max: 1400,
                step: 10,
                unit: "ms",
                defaultValue: defaults.motion.duration,
            },
            rotation: {
                type: ControlType.Number,
                title: "Rotation",
                min: 0,
                max: 18,
                unit: "deg",
                defaultValue: defaults.motion.rotation,
            },
            lift: {
                type: ControlType.Number,
                title: "Active Lift",
                min: 0,
                max: 60,
                unit: "px",
                defaultValue: defaults.motion.lift,
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                min: 0,
                max: 180,
                unit: "px",
                defaultValue: defaults.motion.depth,
            },
            dragThreshold: {
                type: ControlType.Number,
                title: "Drag Threshold",
                min: 12,
                max: 120,
                unit: "px",
                defaultValue: defaults.motion.dragThreshold,
            },
        },
        description:
            "Motion is automatically disabled on Canvas/export and for reduced-motion visitors.",
    },
    media: {
        type: ControlType.Object,
        title: "Media",
        controls: {
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                displaySegmentedControl: true,
                defaultValue: defaults.media.fit,
            },
            overlay: {
                type: ControlType.Number,
                title: "Overlay",
                min: 0,
                max: 80,
                unit: "%",
                defaultValue: defaults.media.overlay,
            },
            grain: {
                type: ControlType.Number,
                title: "Grain",
                min: 0,
                max: 30,
                unit: "%",
                defaultValue: defaults.media.grain,
            },
            showGrid: {
                type: ControlType.Boolean,
                title: "Grid",
                defaultValue: defaults.media.showGrid,
            },
        },
    },
    navigation: {
        type: ControlType.Object,
        title: "Navigation",
        controls: {
            initialItem: {
                type: ControlType.Number,
                title: "Canvas Item",
                min: 0,
                max: 9,
                step: 1,
                displayStepper: true,
                defaultValue: defaults.navigation.initialItem,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: defaults.navigation.loop,
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Wheel",
                defaultValue: defaults.navigation.wheel,
            },
            showButtons: {
                type: ControlType.Boolean,
                title: "Buttons",
                defaultValue: defaults.navigation.showButtons,
            },
            showProgress: {
                type: ControlType.Boolean,
                title: "Progress",
                defaultValue: defaults.navigation.showProgress,
            },
            openInNewTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: defaults.navigation.openInNewTab,
            },
        },
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: defaults.ariaLabel,
        description: "Accessible name for the carousel region.",
    },
})
