import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Flip-card carousel — 3D CSS flip (inspired by the "pick a card" slider pattern).
// Each card sits at translateX(offset * gap) and its inner face spins rotateY(-offset * 180deg),
// so on every step the incoming card flips face-up and the outgoing one flips face-down.

type Img = { src?: string; srcSet?: string; alt?: string }
type Card = { image?: Img; title?: string; description?: string }

interface Props {
    cards: Card[]
    startIndex: number
    // card
    cardWidth: number
    aspectRatio: number
    radius: number
    frameColor: string
    frameWidth: number
    shadow: boolean
    // back
    backColor: string
    backColorBottom: string
    backPattern: "scales" | "rings" | "none" | "image"
    grain: number
    edgeHighlight: boolean
    patternColor: string
    patternScale: number
    backImage?: Img
    // layout + motion
    gap: number
    tilt: number
    tiltSeed: number
    perspective: number
    duration: number
    ease: "inOutQuint" | "inOutCubic" | "outExpo" | "custom"
    customEase: string
    swipe: boolean
    keyboard: boolean
    clickSideCards: boolean
    // arrows
    showArrows: boolean
    arrowSize: number
    arrowBg: string
    arrowColor: string
    arrowOffset: number
    // caption
    showCaption: boolean
    showCounter: boolean
    captionColor: string
    titleFont: any
    bodyFont: any
    counterFont: any
    captionGap: number
    // responsive
    mobileBreakpoint: number
    mobileCardWidth: number
    mobileGap: number
    mobileArrowInset: number
    autoplay: boolean
    interval: number
    style?: CSSProperties
}

const EASES = {
    inOutQuint: "cubic-bezier(0.86, 0, 0.07, 1)",
    inOutCubic: "cubic-bezier(0.65, 0, 0.35, 1)",
    outExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
}

function seeded(i: number, seed: number) {
    const x = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453
    return x - Math.floor(x) // 0..1
}

function patternUrl(kind: string, color: string, scale: number) {
    const s = 40 * scale
    const c = encodeURIComponent(color)
    if (kind === "scales") {
        // fish-scale arcs, like a classic playing-card back
        const arcs = [0.5, 0.36, 0.22]
            .map((r) => {
                const rr = s * r
                return [
                    [s / 2, s / 2],
                    [0, 0],
                    [s, 0],
                    [0, s],
                    [s, s],
                ]
                    .map(
                        ([x, y]) =>
                            `<circle cx='${x}' cy='${y}' r='${rr}' fill='none' stroke='${c}' stroke-width='${Math.max(0.6, scale * 0.9)}'/>`
                    )
                    .join("")
            })
            .join("")
        return `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}'>${arcs}</svg>")`
    }
    if (kind === "rings") {
        const rings = [0.45, 0.3, 0.15]
            .map(
                (r) =>
                    `<circle cx='${s / 2}' cy='${s / 2}' r='${s * r}' fill='none' stroke='${c}' stroke-width='${Math.max(0.6, scale * 0.9)}'/>`
            )
            .join("")
        return `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}'>${rings}</svg>")`
    }
    return "none"
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 860
 */
export default function FlipCardCarousel(props: Props) {
    const {
        cards = [],
        startIndex = 0,
        cardWidth = 375,
        aspectRatio = 0.62,
        radius = 12,
        frameColor = "#F3EEE3",
        frameWidth = 0,
        shadow = true,
        backColor = "#F1F1F1",
        backColorBottom = "#C6C6C6",
        backPattern = "none",
        grain = 4,
        edgeHighlight = true,
        patternColor = "#B8B8B8",
        patternScale = 1.4,
        backImage,
        gap = 50,
        tilt = 7,
        tiltSeed = 3,
        perspective = 1000,
        duration = 0.8,
        ease = "inOutQuint",
        customEase = "cubic-bezier(0.86, 0, 0.07, 1)",
        swipe = true,
        keyboard = true,
        clickSideCards = true,
        showArrows = true,
        arrowSize = 36,
        arrowBg = "#EEEEEF",
        arrowColor = "#1D1D1F",
        arrowOffset = 100,
        showCaption = true,
        showCounter = true,
        captionColor = "#111111",
        titleFont,
        bodyFont,
        counterFont,
        captionGap = 28,
        mobileBreakpoint = 900,
        mobileCardWidth = 180,
        mobileGap = 65,
        mobileArrowInset = 31,
        autoplay = false,
        interval = 3,
        style,
    } = props

    const count = cards.length
    const fallback = FALLBACK_IMAGES
    const clamp = (n: number) => Math.max(0, Math.min(count - 1, n))
    const [index, setIndex] = useState(() => clamp(startIndex))
    const [shown, setShown] = useState(index) // caption index (lags for crossfade)
    const [fading, setFading] = useState(false)
    const root = useRef<HTMLDivElement>(null)
    const drag = useRef<{ x: number; id: number } | null>(null)
    const [width, setWidth] = useState<number | null>(null)

    useEffect(() => {
        const el = root.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(([entry]) => {
            const w = Math.round(entry.contentRect.width)
            setWidth((prev) => (prev === w ? prev : w))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const reduce =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const dur = reduce ? 0 : duration
    const easing = ease === "custom" ? customEase : EASES[ease]

    useEffect(() => setIndex((i) => clamp(i)), [count])
    useEffect(() => setIndex(clamp(startIndex)), [startIndex])

    // Caption: blur/fade out → swap text → fade in
    useEffect(() => {
        if (shown === index) return
        setFading(true)
        const t = setTimeout(() => {
            setShown(index)
            setFading(false)
        }, (dur * 1000) / 2)
        return () => clearTimeout(t)
    }, [index])

    const go = (d: number) => setIndex((i) => clamp(i + d))

    // Autoplay: step forward every `interval` seconds, wrap to the first card at the end
    useEffect(() => {
        if (!autoplay || count < 2 || typeof window === "undefined") return
        const t = window.setTimeout(() => setIndex((i) => (i >= count - 1 ? 0 : i + 1)), interval * 1000)
        return () => window.clearTimeout(t)
    }, [autoplay, interval, index, count])

    useEffect(() => {
        if (!keyboard) return
        const el = root.current
        if (!el) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") go(1)
            if (e.key === "ArrowLeft") go(-1)
        }
        el.addEventListener("keydown", onKey)
        return () => el.removeEventListener("keydown", onKey)
    }, [keyboard, count])

    const tilts = useMemo(
        () =>
            cards.map((_, i) => {
                const r = seeded(i, tiltSeed) * 2 - 1
                // keep neighbours leaning in different directions
                const sign = i % 2 === 0 ? 1 : -1
                return sign * (0.35 + 0.65 * Math.abs(r)) * tilt
            }),
        [count, tilt, tiltSeed]
    )

    // Mobile layout mirrors the reference: smaller card, wider spacing, arrows pinned to the edges
    const isMobile = width !== null && width < mobileBreakpoint
    const cw = isMobile ? mobileCardWidth : cardWidth
    const g = isMobile ? mobileGap : gap
    const cardHeight = cw / aspectRatio
    const stageHeight = Math.round(cardHeight * 1.15)
    const fixedHeight = style?.height === "100%"
    // Pixel spacing from the measured width keeps every animated value a plain px transform,
    // which the browser can run on the compositor (container units / % can fall back to main thread)
    const gapPx = Math.round(((width ?? 1200) * g) / 100)
    const ready = width !== null
    // Mobile: park each arrow halfway between the active card's edge and the side card's inner edge,
    // so it never touches either card whatever the screen width
    const arrowX = isMobile ? gapPx / 2 : cw / 2 + arrowOffset
    const tr = ready ? `transform ${dur}s ${easing}` : "none"
    const backBg =
        backPattern === "image" && backImage?.src
            ? `url("${backImage.src}") center / cover no-repeat`
            : undefined

    const onPointerDown = (e: any) => {
        if (!swipe) return
        drag.current = { x: e.clientX, id: e.pointerId }
    }
    const onPointerUp = (e: any) => {
        const d = drag.current
        drag.current = null
        if (!d) return
        const dx = e.clientX - d.x
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
    }

    const caption = cards[shown] || {}


    return (
        <div
            ref={root}
            tabIndex={keyboard ? 0 : -1}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (drag.current = null)}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: fixedHeight ? "100%" : "auto",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                ...({ containerType: "inline-size" } as CSSProperties),
                outline: "none",
                touchAction: swipe ? "pan-y" : "auto",
                userSelect: "none",
            }}
        >
            {/* Stage */}
            <div
                style={{
                    position: "relative",
                    flex: fixedHeight ? "1 1 auto" : "0 0 auto",
                    height: fixedHeight ? undefined : stageHeight,
                    minHeight: stageHeight,
                }}
            >
                {count === 0 && (
                    <div style={{ ...center, color: captionColor, opacity: 0.6, fontSize: 14 }}>
                        Add cards in the properties panel →
                    </div>
                )}
                {cards.map((card, i) => {
                    const off = i - index
                    card = { ...card, image: card.image?.src ? card.image : fallback[i % fallback.length] }
                    const active = off === 0
                    return (
                        <div
                            key={i}
                            onClick={() => clickSideCards && !active && setIndex(i)}
                            style={{
                                position: "absolute",
                                left: `calc(50% - ${cw / 2}px)`,
                                top: `calc(50% - ${cardHeight / 2}px)`,
                                width: cw,
                                height: cardHeight,
                                perspective,
                                zIndex: 100 - Math.abs(off),
                                cursor: clickSideCards && !active ? "pointer" : "default",
                                transform: `translate3d(${off * gapPx}px, 0, 0) rotate(${tilts[i]}deg)`,
                                willChange: "transform",
                                backfaceVisibility: "hidden",
                                // z-index switches instantly: cards are a full gap apart when a flip starts, so no visible pop,
                                // and a delayed z-index transition would be a main-thread animation on the same element
                                transition: tr,
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    transformStyle: "preserve-3d",
                                    transform: `rotateY(${-off * 180}deg)`,
                                    transition: tr,
                                    willChange: "transform",
                                }}
                            >
                                {/* Front */}
                                <div
                                    style={{
                                        ...face,
                                        borderRadius: radius,
                                        background: frameWidth > 0 ? frameColor : "transparent",
                                        padding: frameWidth,
                                        boxShadow: shadow ? SOFT_SHADOW : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: Math.max(0, radius - frameWidth / 2),
                                            overflow: "hidden",
                                            background: card.image?.src
                                                ? "transparent"
                                                : `linear-gradient(160deg, ${patternColor}, ${backColor})`,
                                        }}
                                    >
                                        {card.image?.src ? (
                                            <img
                                                decoding="async"
                                                src={card.image.src}
                                                srcSet={card.image.srcSet}
                                                alt={card.image.alt || card.title || ""}
                                                draggable={false}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                }}
                                            />
                                        ) : (
                                            <div style={{ ...center, color: frameColor, opacity: 0.7, fontSize: 13 }}>
                                                Front image
                                            </div>
                                        )}
                                    </div>
                                    {edgeHighlight && <div style={{ ...edge, borderRadius: radius }} />}
                                </div>
                                {/* Back */}
                                <div
                                    style={{
                                        ...face,
                                        transform: "rotateY(180deg)",
                                        borderRadius: radius,
                                        background: frameWidth > 0 ? frameColor : "transparent",
                                        padding: frameWidth,
                                        boxShadow: shadow ? SOFT_SHADOW : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: Math.max(0, radius - frameWidth / 2),
                                            overflow: "hidden",
                                            position: "relative",
                                            ...(backBg
                                                ? { background: backBg }
                                                : {
                                                      backgroundColor: backColorBottom,
                                                      backgroundImage: [
                                                          patternUrl(backPattern, patternColor, patternScale),
                                                          `linear-gradient(180deg, ${backColor} 0%, ${backColorBottom} 100%)`,
                                                      ]
                                                          .filter((x) => x !== "none")
                                                          .join(", "),
                                                  }),
                                        }}
                                    >
                                        {grain > 0 && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    backgroundImage: NOISE,
                                                    backgroundSize: "160px 160px",
                                                    opacity: grain / 100,
                                                }}
                                            />
                                        )}
                                    </div>
                                    {edgeHighlight && <div style={{ ...edge, borderRadius: radius }} />}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {showArrows && count > 1 && (
                    <>
                        <Arrow
                            dir={-1}
                            disabled={index === 0}
                            onClick={() => go(-1)}
                            size={arrowSize}
                            bg={arrowBg}
                            color={arrowColor}
                            x={-arrowX}
                        />
                        <Arrow
                            dir={1}
                            disabled={index === count - 1}
                            onClick={() => go(1)}
                            size={arrowSize}
                            bg={arrowBg}
                            color={arrowColor}
                            x={arrowX}
                        />
                    </>
                )}
            </div>

            {/* Caption */}
            {showCaption && count > 0 && (
                <div
                    style={{
                        position: "relative",
                        flex: "0 0 auto",
                        marginTop: captionGap,
                        padding: "0 24px",
                        height: 110,
                        overflow: "hidden",
                        contain: "layout paint style",
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        gap: 10,
                        color: captionColor,
                        opacity: fading ? 0 : 1,
                        transform: fading ? "translate3d(0, 6px, 0)" : "translate3d(0, 0, 0)",
                        willChange: "opacity, transform",
                        transition: `opacity ${dur / 2}s ${EASES.inOutCubic}, transform ${dur / 2}s ${EASES.inOutCubic}`,
                    }}
                >
                    {showCounter && (
                        <div style={{ fontSize: 12, letterSpacing: "0.1em", ...counterFont }}>
                            {shown + 1} / {count}
                        </div>
                    )}
                    {caption.title && (
                        <div style={{ fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase", ...titleFont }}>
                            {caption.title}
                        </div>
                    )}
                    {caption.description && (
                        <div style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 440, opacity: 0.8, ...bodyFont }}>
                            {caption.description}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

interface ArrowProps {
    dir: number
    disabled: boolean
    onClick: () => void
    size: number
    bg: string
    color: string
    x: number
}

function Arrow({ dir, disabled, onClick, size, bg, color, x }: ArrowProps) {
    const [hover, setHover] = useState(false)
    return (
        <button
            aria-label={dir < 0 ? "Previous card" : "Next card"}
            disabled={disabled}
            aria-hidden={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={(e) => {
                e.stopPropagation()
                onClick()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: size,
                height: size,
                marginLeft: x - size / 2,
                marginTop: -size / 2,
                zIndex: 200,
                borderRadius: "50%",
                border: "none",
                padding: 0,
                background: bg,
                color,
                display: "grid",
                placeItems: "center",
                cursor: disabled ? "default" : "pointer",
                // no faded "disabled" state: the arrow simply goes away at either end
                opacity: disabled ? 0 : 1,
                visibility: disabled ? "hidden" : "visible",
                pointerEvents: disabled ? "none" : "auto",
                transform: `scale(${hover && !disabled ? 1.08 : 1})`,
                transition: `transform .4s cubic-bezier(0.77,0,0.175,1), opacity .3s, visibility 0s ${disabled ? ".3s" : "0s"}`,
            }}
        >
            <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 10 10" fill="none">
                <path
                    d={dir < 0 ? "M6.5 1.5 3 5l3.5 3.5" : "M3.5 1.5 7 5 3.5 8.5"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    )
}

const FALLBACK_IMAGES: Img[] = [
    { src: "https://images.unsplash.com/photo-1645871161190-7934d30467d1?w=900&q=80&auto=format&fit=crop", alt: "Motion" },
    { src: "https://images.unsplash.com/photo-1653113403344-c09b131231b0?w=900&q=80&auto=format&fit=crop", alt: "Signal" },
    { src: "https://images.unsplash.com/photo-1633872907288-626f275d845d?w=900&q=80&auto=format&fit=crop", alt: "Form" },
    { src: "https://images.unsplash.com/photo-1732164975299-a5f11464be8c?w=900&q=80&auto=format&fit=crop", alt: "Threshold" },
    { src: "https://images.unsplash.com/photo-1637453593829-45dfba2e63eb?w=900&q=80&auto=format&fit=crop", alt: "Vapor" },
    { src: "https://images.unsplash.com/photo-1729009704569-474ddd86ed3a?w=900&q=80&auto=format&fit=crop", alt: "Haze" },
]

// Soft, layered drop shadow tuned for light backgrounds
const SOFT_SHADOW =
    "0 1px 1px rgba(0,0,0,0.04), 0 4px 10px -4px rgba(0,0,0,0.08), 0 18px 36px -18px rgba(0,0,0,0.18)"

// Lit top edge + hairline, like a printed card catching light
const edge: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    boxShadow: "inset 0 2px 2px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.06)",
}

const NOISE = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`

const face: CSSProperties = {
    position: "absolute",
    inset: 0,
    boxSizing: "border-box",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    willChange: "transform",
    contain: "paint",
}

const center: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    fontFamily: "Inter, sans-serif",
}

addPropertyControls(FlipCardCarousel, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Title" },
                description: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: "" },
            },
        },
        defaultValue: [
            { title: "Motion", description: "Bodies in flux, caught between frames." },
            { title: "Signal", description: "Low sun, one figure, the rest is noise." },
            { title: "Form", description: "Shape before detail. Feeling before form." },
            { title: "Threshold", description: "Every entrance is a decision." },
            { title: "Vapor", description: "What moves stays unseen." },
            { title: "Haze", description: "Edges dissolve, the story stays." },
        ],
        maxCount: 20,
    },

    cardWidth: { type: ControlType.Number, title: "Card Width", min: 160, max: 600, unit: "px", defaultValue: 375 },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 40, unit: "px", defaultValue: 12 },
    shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: true },
    backColor: { type: ControlType.Color, title: "Back Top", defaultValue: "#F1F1F1" },
    backColorBottom: { type: ControlType.Color, title: "Back Bottom", defaultValue: "#C6C6C6" },

    tilt: { type: ControlType.Number, title: "Tilt", min: 0, max: 15, unit: "°", defaultValue: 7 },
    duration: { type: ControlType.Number, title: "Speed", min: 0.4, max: 2, step: 0.05, unit: "s", defaultValue: 0.8 },
    autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: false },
    interval: { type: ControlType.Number, title: "Every", min: 1, max: 15, step: 0.5, unit: "s", defaultValue: 3, hidden: (p) => !p.autoplay },

    showArrows: { type: ControlType.Boolean, title: "Arrows", defaultValue: true },
    arrowBg: { type: ControlType.Color, title: "Arrow Fill", defaultValue: "#EEEEEF", hidden: (p) => !p.showArrows },
    arrowColor: { type: ControlType.Color, title: "Arrow Icon", defaultValue: "#1D1D1F", hidden: (p) => !p.showArrows },

    showCaption: { type: ControlType.Boolean, title: "Caption", defaultValue: true },
    captionColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#111111", hidden: (p) => !p.showCaption },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "22px", letterSpacing: "0.12em", lineHeight: "1.2em", textAlign: "center" },
        hidden: (p) => !p.showCaption,
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", lineHeight: "1.5em", textAlign: "center" },
        hidden: (p) => !p.showCaption,
    },
})
