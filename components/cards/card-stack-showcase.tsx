import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { gsap } from "gsap"

interface ServiceData {
    cardType: "text" | "media"
    number: string
    title: string
    description: string
    url: string
    linkLabel: string
    theme: "light" | "dark" | "custom"
    backgroundColor: string
    textColor: string
    numberColor: string
    numberColorOverride: string
    centerIcon: string
    centerIconColor: string
    centerIconOpacity: number
    tilt: number
    yShift: number
    // Media card fields
    mediaType: "image" | "video"
    imageSrc: string
    imageSrcSet: string
    imageAlt: string
    videoSrc: string
    posterSrc: string
    mediaFit: "cover" | "contain"
    videoPlayback: "autoplay" | "hover"
    showText: boolean
    overlayStrength: number
    mediaTextColor: string
}

function isSvgSource(src: string) {
    return /^data:image\/svg\+xml/i.test(src) || /\.svg(?:[?#]|$)/i.test(src)
}

// Soft icon centered in a card, behind its content. SVGs are recolorable via
// a CSS mask; other image types are shown as-is.
function CenterIcon({
    src,
    color,
    opacity,
    isStatic = false,
}: {
    src: string
    color: string
    opacity: number
    isStatic?: boolean
}) {
    if (!src) return null
    const size: React.CSSProperties = {
        width: "28%",
        maxWidth: 112,
        minWidth: 48,
        aspectRatio: "1",
    }
    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                pointerEvents: "none",
                zIndex: 0,
            }}
        >
            {isSvgSource(src) ? (
                <div
                    style={{
                        ...size,
                        background: color,
                        opacity,
                        maskImage: `url("${src}")`,
                        WebkitMaskImage: `url("${src}")`,
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                        maskSize: "contain",
                        WebkitMaskSize: "contain",
                        transition: isStatic
                            ? "none"
                            : "background-color 0.3s ease",
                    }}
                />
            ) : (
                <img
                    src={src}
                    alt=""
                    draggable={false}
                    style={{ ...size, objectFit: "contain", opacity }}
                />
            )}
        </div>
    )
}

function getFontStyle(font: any): React.CSSProperties {
    if (!font) return {}
    return {
        fontFamily: font.fontFamily ?? font.family ?? undefined,
        fontSize: font.fontSize ?? undefined,
        fontWeight: font.fontWeight ?? font.weight ?? undefined,
        fontStyle: font.fontStyle ?? font.style ?? undefined,
        lineHeight: font.lineHeight ?? undefined,
        letterSpacing: font.letterSpacing ?? undefined,
        textTransform: font.textTransform ?? undefined,
    }
}

function getEntry(dir: string, i: number = 0) {
    const bottom = {
        x: 0,
        y: "120vh",
        rotationX: -30,
        rotationY: 0,
        scale: 0.9,
    }
    const top = { x: 0, y: "-120vh", rotationX: 30, rotationY: 0, scale: 0.9 }
    const left = { x: "-120vw", y: 0, rotationX: 0, rotationY: 30, scale: 0.9 }
    const right = { x: "120vw", y: 0, rotationX: 0, rotationY: -30, scale: 0.9 }
    switch (dir) {
        case "top":
            return top
        case "left":
            return left
        case "right":
            return right
        case "alternate":
            return i % 2 === 0 ? bottom : top
        case "sides":
            return i % 2 === 0 ? left : right
        case "center":
            return { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 0.2 }
        default:
            return bottom
    }
}

function resolveService(
    raw: any,
    defaultNumberColor: string,
    applyToMedia: boolean = false
): ServiceData {
    const theme = raw.theme || "light"
    const dark = theme === "dark"
    const custom = theme === "custom"
    const image = raw.image
    const imageObj = typeof image === "object" && image ? image : null
    return {
        cardType: raw.cardType === "media" ? "media" : "text",
        number: raw.number ?? "01",
        title: raw.title ?? "Service title",
        description:
            raw.description ?? "Add a short description of this service.",
        url: raw.url ?? "",
        linkLabel: raw.linkLabel ?? "Learn more",
        theme,
        backgroundColor: custom
            ? raw.backgroundColor || "#ffffff"
            : dark
              ? "#1c1c1a"
              : "#ffffff",
        textColor: custom
            ? raw.textColor || "#111817"
            : dark
              ? "#ffffff"
              : "#111817",
        numberColor: raw.numberColor || defaultNumberColor,
        centerIcon: typeof raw.centerIcon === "string" ? raw.centerIcon : "",
        centerIconColor: raw.centerIconColor || "",
        centerIconOpacity:
            Math.max(0, Math.min(100, Number(raw.centerIconOpacity ?? 12))) /
            100,
        numberColorOverride:
            raw.numberColor || (applyToMedia ? defaultNumberColor : ""),
        tilt: raw.tilt ?? 0,
        yShift: raw.yShift ?? 0,
        mediaType: raw.mediaType === "video" ? "video" : "image",
        imageSrc:
            (imageObj
                ? imageObj.src
                : typeof image === "string"
                  ? image
                  : "") || "",
        imageSrcSet: imageObj?.srcSet || "",
        imageAlt: imageObj?.alt || raw.title || "",
        videoSrc: raw.video || raw.videoUrl || "",
        posterSrc:
            typeof raw.poster === "object" && raw.poster
                ? raw.poster.src || ""
                : raw.poster || "",
        mediaFit: raw.mediaFit === "contain" ? "contain" : "cover",
        videoPlayback: raw.videoPlayback === "hover" ? "hover" : "autoplay",
        showText: raw.showText ?? true,
        overlayStrength: raw.overlayStrength ?? 45,
        mediaTextColor: raw.mediaTextColor || "#ffffff",
    }
}

interface CardProps {
    service: ServiceData
    radius: number
    padding: number
    shadow: string
    isHovered: boolean
    enableHoverColors: boolean
    hoverBackgroundColor: string
    hoverTextColor: string
    numberStyle: React.CSSProperties
    titleStyle: React.CSSProperties
    descriptionStyle: React.CSSProperties
    counterBackgroundEnabled: boolean
    counterBackgroundColor: string
    counterHoverBackgroundColor: string
    counterHoverTextColor?: string
    counterRadius: number
    showCounter: boolean
    uppercaseTitles: boolean
    linkMode: "card" | "button"
    loadMedia: boolean
    playInView: boolean
    respectReducedMotion: boolean
    isStatic?: boolean
}

const mediaFill = (fit: "cover" | "contain"): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: fit,
    display: "block",
})

// Video that only loads its file once the section is near the viewport, and
// only plays when it should: always while in view ("autoplay"), or while the
// card is hovered / focused ("hover"). On mobile layouts there is no hover, so
// "hover" videos play while the card is in view instead.
function LazyVideo({
    src,
    poster,
    label,
    fit,
    mode,
    active,
    playInView,
    loadMedia,
    respectReducedMotion,
}: {
    src: string
    poster: string
    label: string
    fit: "cover" | "contain"
    mode: "autoplay" | "hover"
    active: boolean
    playInView: boolean
    loadMedia: boolean
    respectReducedMotion: boolean
}) {
    const ref = useRef<HTMLVideoElement>(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => setInView(entries[0].isIntersecting),
            { threshold: 0.5 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    const reduce =
        respectReducedMotion &&
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const wantPlay =
        !reduce &&
        (mode === "hover" ? active || (playInView && inView) : inView)

    useEffect(() => {
        const v = ref.current
        if (!v || !loadMedia) return
        v.muted = true
        if (wantPlay) {
            const p = v.play()
            if (p && typeof p.catch === "function") p.catch(() => {})
        } else {
            v.pause()
            if (mode === "hover") {
                try {
                    v.currentTime = 0
                } catch (e) {}
            }
        }
    }, [wantPlay, loadMedia, mode])

    return (
        <video
            ref={ref}
            src={loadMedia ? src : undefined}
            poster={poster || undefined}
            muted
            loop
            playsInline
            preload={mode === "hover" ? "metadata" : "auto"}
            aria-label={label}
            style={mediaFill(fit)}
        />
    )
}

function MediaLayer({
    service,
    isStatic,
    isHovered,
    loadMedia,
    playInView,
    respectReducedMotion,
}: {
    service: ServiceData
    isStatic?: boolean
    isHovered: boolean
    loadMedia: boolean
    playInView: boolean
    respectReducedMotion: boolean
}) {
    const fill = mediaFill(service.mediaFit)

    if (service.mediaType === "video" && service.videoSrc) {
        // On the Framer canvas / export, show the poster instead of playing.
        if (isStatic) {
            return service.posterSrc ? (
                <img src={service.posterSrc} alt="" style={fill} />
            ) : (
                <div style={{ ...fill, background: "#222" }} />
            )
        }
        return (
            <LazyVideo
                src={service.videoSrc}
                poster={service.posterSrc}
                label={service.imageAlt || service.title}
                fit={service.mediaFit}
                mode={service.videoPlayback}
                active={isHovered}
                playInView={playInView}
                loadMedia={loadMedia}
                respectReducedMotion={respectReducedMotion}
            />
        )
    }

    if (service.imageSrc) {
        // Hold the file back until the section is near the viewport.
        if (!loadMedia) {
            return (
                <div aria-hidden style={{ ...fill, background: "#d9ddd6" }} />
            )
        }
        return (
            <img
                src={service.imageSrc}
                srcSet={service.imageSrcSet || undefined}
                alt={service.imageAlt}
                decoding="async"
                draggable={false}
                style={fill}
            />
        )
    }

    // Placeholder when no media has been chosen yet
    return (
        <div
            style={{
                ...fill,
                background: "#d9ddd6",
                display: "grid",
                placeItems: "center",
                color: "#6b726b",
                fontSize: 13,
                textAlign: "center",
                padding: 16,
                boxSizing: "border-box",
            }}
        >
            Add an image or video
        </div>
    )
}

function ServiceCard(props: CardProps) {
    const { service, radius, padding, shadow, isHovered, linkMode } = props
    const isMedia = service.cardType === "media"

    return isMedia ? <MediaCard {...props} /> : <TextCard {...props} />
}

function TextCard({
    service,
    radius,
    padding,
    shadow,
    isHovered,
    enableHoverColors,
    hoverBackgroundColor,
    hoverTextColor,
    numberStyle,
    titleStyle,
    descriptionStyle,
    counterBackgroundEnabled,
    counterBackgroundColor,
    counterHoverBackgroundColor,
    counterHoverTextColor,
    counterRadius,
    showCounter,
    uppercaseTitles,
    linkMode,
    isStatic,
}: CardProps) {
    const useHoverColors = enableHoverColors && isHovered
    const cardBackground = useHoverColors
        ? hoverBackgroundColor
        : service.backgroundColor
    const cardText = useHoverColors ? hoverTextColor : service.textColor

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding,
                borderRadius: radius,
                background: cardBackground,
                color: cardText,
                boxShadow: shadow,
                display: "flex",
                flexDirection: "column",
                justifyContent: showCounter ? "space-between" : "flex-end",
                overflow: "hidden",
                position: "relative",
                transition: isStatic
                    ? "none"
                    : "background-color 0.3s ease, color 0.3s ease",
            }}
        >
            <CenterIcon
                src={service.centerIcon}
                color={service.centerIconColor || cardText}
                opacity={service.centerIconOpacity}
                isStatic={isStatic}
            />
            {showCounter && (
                <span
                    style={{
                        position: "relative",
                        zIndex: 1,
                        ...numberStyle,
                        color: isHovered
                            ? counterHoverTextColor ||
                              (useHoverColors
                                  ? cardText
                                  : service.numberColor || cardText)
                            : service.numberColor || cardText,
                        backgroundColor: counterBackgroundEnabled
                            ? isHovered
                                ? counterHoverBackgroundColor
                                : counterBackgroundColor
                            : "transparent",
                        borderRadius: counterBackgroundEnabled
                            ? counterRadius
                            : 0,
                        width: counterBackgroundEnabled ? 40 : undefined,
                        height: counterBackgroundEnabled ? 40 : undefined,
                        boxSizing: "border-box",
                        display: counterBackgroundEnabled
                            ? "inline-flex"
                            : "block",
                        transition: isStatic
                            ? "none"
                            : "background-color 0.25s ease, color 0.25s ease",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {service.number}
                </span>
            )}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <h3
                    style={{
                        ...titleStyle,
                        color: cardText,
                        textTransform: uppercaseTitles
                            ? "uppercase"
                            : undefined,
                        margin: 0,
                        whiteSpace: "pre-line",
                    }}
                >
                    {service.title}
                </h3>
                <p
                    style={{
                        ...descriptionStyle,
                        color: cardText,
                        opacity: useHoverColors ? 0.82 : 0.62,
                        margin: 0,
                        whiteSpace: "pre-line",
                    }}
                >
                    {service.description}
                </p>
                {service.url && linkMode === "button" && (
                    <a
                        href={service.url}
                        style={{
                            display: "inline-flex",
                            alignSelf: "flex-start",
                            color: cardText,
                            font: "inherit",
                            textDecoration: "underline",
                            textUnderlineOffset: 4,
                            marginTop: 4,
                            position: "relative",
                            zIndex: 2,
                        }}
                    >
                        {service.linkLabel || "Learn more"}
                    </a>
                )}
            </div>
            {service.url && linkMode === "card" && (
                <a
                    href={service.url}
                    aria-label={service.title}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        borderRadius: "inherit",
                    }}
                />
            )}
        </div>
    )
}

// Image / video card. Media fills the card; text (optional) sits on top of a
// dark gradient so it stays readable. Hover colors are not applied here,
// because the media is the background.
function MediaCard({
    service,
    radius,
    padding,
    shadow,
    isHovered,
    numberStyle,
    titleStyle,
    descriptionStyle,
    counterBackgroundEnabled,
    counterBackgroundColor,
    counterHoverBackgroundColor,
    counterHoverTextColor,
    counterRadius,
    showCounter,
    uppercaseTitles,
    linkMode,
    loadMedia,
    playInView,
    respectReducedMotion,
    isStatic,
}: CardProps) {
    const text = service.mediaTextColor
    const showText = service.showText
    const strength = Math.max(0, Math.min(100, service.overlayStrength)) / 100

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                borderRadius: radius,
                background: "#1c1c1a",
                color: text,
                boxShadow: shadow,
                overflow: "hidden",
                position: "relative",
                isolation: "isolate",
            }}
        >
            <MediaLayer
                service={service}
                isStatic={isStatic}
                isHovered={isHovered}
                loadMedia={loadMedia}
                playInView={playInView}
                respectReducedMotion={respectReducedMotion}
            />

            {showText && strength > 0 && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(to top, rgba(0,0,0,${strength}) 0%, rgba(0,0,0,${strength * 0.45}) 55%, rgba(0,0,0,${strength * 0.15}) 100%)`,
                        pointerEvents: "none",
                    }}
                />
            )}

            <CenterIcon
                src={service.centerIcon}
                color={service.centerIconColor || text}
                opacity={service.centerIconOpacity}
                isStatic={isStatic}
            />

            {showText && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        padding,
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: showCounter
                            ? "space-between"
                            : "flex-end",
                    }}
                >
                    {showCounter && (
                        <span
                            style={{
                                ...numberStyle,
                                color: isHovered
                                    ? counterHoverTextColor ||
                                      service.numberColorOverride ||
                                      text
                                    : service.numberColorOverride || text,
                                backgroundColor: counterBackgroundEnabled
                                    ? isHovered
                                        ? counterHoverBackgroundColor
                                        : counterBackgroundColor
                                    : "transparent",
                                borderRadius: counterBackgroundEnabled
                                    ? counterRadius
                                    : 0,
                                width: counterBackgroundEnabled
                                    ? 40
                                    : undefined,
                                height: counterBackgroundEnabled
                                    ? 40
                                    : undefined,
                                boxSizing: "border-box",
                                display: counterBackgroundEnabled
                                    ? "inline-flex"
                                    : "block",
                                alignSelf: "flex-start",
                                transition: isStatic
                                    ? "none"
                                    : "background-color 0.25s ease, color 0.25s ease",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {service.number}
                        </span>
                    )}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        <h3
                            style={{
                                ...titleStyle,
                                color: text,
                                textTransform: uppercaseTitles
                                    ? "uppercase"
                                    : undefined,
                                margin: 0,
                                whiteSpace: "pre-line",
                            }}
                        >
                            {service.title}
                        </h3>
                        {service.description && (
                            <p
                                style={{
                                    ...descriptionStyle,
                                    color: text,
                                    opacity: 0.85,
                                    margin: 0,
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {service.description}
                            </p>
                        )}
                        {service.url && linkMode === "button" && (
                            <a
                                href={service.url}
                                style={{
                                    display: "inline-flex",
                                    alignSelf: "flex-start",
                                    color: text,
                                    font: "inherit",
                                    textDecoration: "underline",
                                    textUnderlineOffset: 4,
                                    marginTop: 4,
                                    position: "relative",
                                    zIndex: 2,
                                }}
                            >
                                {service.linkLabel || "Learn more"}
                            </a>
                        )}
                    </div>
                </div>
            )}

            {service.url && (linkMode === "card" || !showText) && (
                <a
                    href={service.url}
                    aria-label={service.title || service.imageAlt}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        borderRadius: "inherit",
                    }}
                />
            )}
        </div>
    )
}

// Base tilt (deg) and vertical offset (px) for card i of n, from a deck preset.
// Per-card Rotation / Move Up/Down values are added on top of this.
function deckOffset(
    preset: string,
    i: number,
    n: number,
    tiltAmount: number,
    yAmount: number
) {
    const t = n > 1 ? (i / (n - 1)) * 2 - 1 : 0 // -1 (first) to 1 (last)
    switch (preset) {
        case "fan": // ends fan out and drop, like a hand of cards
            return { tilt: t * tiltAmount, y: t * t * yAmount }
        case "arch": // ends fan out, middle rises
            return { tilt: t * tiltAmount, y: -(1 - t * t) * yAmount }
        case "cascade": // steps down from left to right
            return { tilt: t * tiltAmount * 0.5, y: t * yAmount }
        case "zigzag": // alternating up/down and left/right lean
            return {
                tilt: (i % 2 === 0 ? -1 : 1) * tiltAmount,
                y: (i % 2 === 0 ? -0.5 : 0.5) * yAmount,
            }
        case "wave":
            return {
                tilt: Math.cos(i * 1.2) * tiltAmount,
                y: Math.sin(i * 1.2) * yAmount,
            }
        case "scatter": {
            // Deterministic, so the layout is the same on every load
            const r = (k: number) => {
                const x = Math.sin((i + 1) * k) * 43758.5453
                return x - Math.floor(x)
            }
            return {
                tilt: (r(12.9898) * 2 - 1) * tiltAmount,
                y: (r(78.233) * 2 - 1) * yAmount,
            }
        }
        default: // "flat" and "custom"
            return { tilt: 0, y: 0 }
    }
}

const SHADOW_PRESETS: Record<string, string> = {
    none: "none",
    soft: "0 12px 30px -10px rgba(0,0,0,0.12)",
    medium: "0 24px 50px -12px rgba(0,0,0,0.12)",
    strong: "0 30px 60px -12px rgba(0,0,0,0.32)",
    hard: "6px 6px 0 0 rgba(0,0,0,0.85)",
}

const FOCUS_CSS = `
.sls-card:focus-visible{outline:3px solid var(--sls-focus,#2f5d50);outline-offset:5px}
.sls-card a:focus-visible{outline:3px solid var(--sls-focus,#2f5d50);outline-offset:3px}
@supports selector(:has(*)){
.sls-card:has(a:focus-visible){outline:3px solid var(--sls-focus,#2f5d50);outline-offset:5px}
.sls-card a:focus-visible{outline:none}
}
`

/**
 * @framerDisableUnlink
 */
export default function CardStackShowcase(props: any) {
    const {
        services: rawServices = [],
        pageBackground = "#f1f3ef",
        numberColor = "#2f5d50",
        numberColorOnMedia = true,
        canvasHeight = "100vh",
        cardWidth = 300,
        cardHeight = 260,
        cardRadius = 24,
        cardDistance = 315,
        cardPadding = 24,
        deckLayout = "custom",
        deckTilt = 8,
        deckY = 30,
        enableHover = true,
        hoverMode = "lift",
        shiftDistance = 70,
        enableHoverColors = true,
        hoverBackgroundColor = "#2f5d50",
        hoverTextColor = "#ffffff",
        shadowStyle: shadowStyleProp,
        enableShadow,
        shadowX = 0,
        shadowY = 24,
        shadowBlur = 50,
        shadowSpread = -12,
        shadowColor = "rgba(0,0,0,0.12)",
        animationDuration = 1.2,
        entryDirection = "bottom",
        showLiveEntrySelector = false,
        numberFont,
        titleFont,
        descriptionFont,
        counterBackgroundEnabled = false,
        counterBackgroundColor = "#1c1c1a",
        counterHoverBackgroundColor = "#2f5d50",
        counterHoverTextColor,
        counterRadius = 0,
        showCounter = true,
        uppercaseTitles = false,
        linkMode = "button",
        staggerDelay = 0.25,
        animationEase = "back.out(1.4)",
        animationOrder = "forward",
        respectReducedMotion = true,
        mobileLayout = "stack",
        mobileGap = 20,
        mobilePadding = 24,
        focusColor = "#2f5d50",
    } = props

    const isStatic = useIsStaticRenderer()
    const [liveEntryDirection, setLiveEntryDirection] = useState(entryDirection)
    const [liveDeckLayout, setLiveDeckLayout] = useState(deckLayout)
    const cards = (rawServices as any[]).map((c, i, all) => {
        const card = resolveService(c, numberColor, numberColorOnMedia)
        const base = deckOffset(liveDeckLayout, i, all.length, deckTilt, deckY)
        // Per-card custom tilt / Y only applies in the Custom layout.
        // Other layouts use their own preset offsets (or none for Flat).
        if (liveDeckLayout !== "custom") {
            card.tilt = 0
            card.yShift = 0
        }
        card.tilt += base.tilt
        card.yShift += base.y
        return card
    })
    const n = cards.length

    const containerRef = useRef<HTMLDivElement>(null)
    const cardsRef = useRef<(HTMLDivElement | null)[]>([])
    const stackedRef = useRef(false)
    // Hover bookkeeping for Push Apart / touch tap-to-select
    const activeRef = useRef<number | null>(null)
    const lastPointerType = useRef<string>("mouse")
    const applyHoverRef = useRef<(a: number | null) => void>(() => {})
    const [stacked, setStacked] = useState(false)
    const [visible, setVisible] = useState(false)
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)

    // Responsive layout + lazy media state
    const rootRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState<number | null>(null)
    const [nearViewport, setNearViewport] = useState(false)
    const [mobileShown, setMobileShown] = useState(false)
    const measured = width !== null
    const neededWidth = (n - 1) * cardDistance + cardWidth + 32
    const isMobile =
        !isStatic &&
        measured &&
        mobileLayout !== "off" &&
        (width as number) < neededWidth

    const prefersReduced = () =>
        respectReducedMotion &&
        typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Measure the component's own width (not the window), so it also adapts
    // when placed inside a narrow frame.
    useEffect(() => {
        if (isStatic || n === 0) return
        const el = rootRef.current
        if (!el) return
        setWidth(el.getBoundingClientRect().width)
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) =>
            setWidth(entries[0].contentRect.width)
        )
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic, n])

    // Lazy loading: media files start loading once the section is within
    // 600px of the viewport.
    useEffect(() => {
        if (isStatic || n === 0) return
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setNearViewport(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setNearViewport(true)
                    io.disconnect()
                }
            },
            { rootMargin: "600px 0px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, n])

    // Mobile layouts fade their cards in once, when they scroll into view.
    useEffect(() => {
        if (isStatic || !isMobile) return
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setMobileShown(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setMobileShown(true)
                    io.disconnect()
                }
            },
            { threshold: 0.1 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, isMobile, n])

    const numberStyle = getFontStyle(numberFont)
    const titleStyle = getFontStyle(titleFont)
    const descriptionStyle = getFontStyle(descriptionFont)
    // Older instances only had an on/off switch, so fall back to it.
    const shadowStyle =
        shadowStyleProp ?? (enableShadow === false ? "none" : "medium")
    const shadow =
        shadowStyle === "custom"
            ? `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`
            : (SHADOW_PRESETS[shadowStyle] ?? SHADOW_PRESETS.medium)

    // Resting horizontal position of card i
    const offset = (i: number) => (i - (n - 1) / 2) * cardDistance

    const cardProps = {
        radius: cardRadius,
        padding: cardPadding,
        shadow,
        enableHoverColors,
        hoverBackgroundColor,
        hoverTextColor,
        numberStyle,
        titleStyle,
        descriptionStyle,
        counterBackgroundEnabled,
        counterBackgroundColor,
        counterHoverBackgroundColor,
        counterHoverTextColor,
        counterRadius,
        showCounter,
        uppercaseTitles,
        linkMode,
        loadMedia: nearViewport,
        playInView: isMobile,
        respectReducedMotion,
    }

    // Tap outside any card on touch devices resets the selected card.
    useEffect(() => {
        if (isStatic) return
        const onDown = (e: PointerEvent) => {
            if (e.pointerType !== "touch") return
            if (!(e.target as HTMLElement).closest("[data-stack-card]")) {
                applyHoverRef.current(null)
            }
        }
        document.addEventListener("pointerdown", onDown)
        return () => document.removeEventListener("pointerdown", onDown)
    }, [isStatic])

    // Keep the live selector in sync when the Framer property changes.
    useEffect(() => {
        if (isStatic) return
        setLiveEntryDirection(entryDirection)
    }, [entryDirection, isStatic])
    useEffect(() => {
        if (isStatic) return
        setLiveDeckLayout(deckLayout)
    }, [deckLayout, isStatic])

    // On-appear animation. The live selector can replay it with another direction.
    useEffect(() => {
        if (isStatic || n === 0 || !measured || isMobile) return
        const els = cardsRef.current.filter(Boolean) as HTMLDivElement[]
        activeRef.current = null
        const reduceMotion =
            respectReducedMotion &&
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        if (reduceMotion) {
            els.forEach((el, i) => {
                gsap.set(el, {
                    x: offset(i),
                    y: cards[i].yShift,
                    rotation: cards[i].tilt,
                    rotationX: 0,
                    rotationY: 0,
                    opacity: 1,
                    scale: 1,
                })
            })
            setVisible(true)
            stackedRef.current = true
            setStacked(true)
            return () => gsap.killTweensOf(els)
        }

        els.forEach((el, i) =>
            gsap.set(el, {
                ...getEntry(liveEntryDirection, i),
                rotation: cards[i].tilt * 2,
                opacity: 0,
            })
        )
        setVisible(false)
        stackedRef.current = false
        setStacked(false)

        const tl = gsap.timeline({ paused: true })
        cards.forEach((c, i) => {
            const el = cardsRef.current[i]
            if (!el) return
            tl.to(
                el,
                {
                    x: offset(i),
                    y: c.yShift,
                    rotation: c.tilt,
                    rotationX: 0,
                    rotationY: 0,
                    opacity: 1,
                    scale: 1,
                    duration: animationDuration,
                    ease: animationEase,
                },
                (animationOrder === "reverse" ? n - 1 - i : i) * staggerDelay
            )
        })
        tl.eventCallback("onStart", () => setVisible(true))
        tl.eventCallback("onComplete", () => {
            stackedRef.current = true
            setStacked(true)
        })

        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    tl.play()
                    io.disconnect()
                }
            },
            { threshold: 0.2 }
        )
        if (containerRef.current) io.observe(containerRef.current)

        return () => {
            io.disconnect()
            tl.kill()
            gsap.killTweensOf(els)
        }
    }, [
        isStatic,
        n,
        cardDistance,
        cardWidth,
        cardHeight,
        animationDuration,
        liveEntryDirection,
        staggerDelay,
        animationEase,
        animationOrder,
        respectReducedMotion,
        liveDeckLayout,
        deckTilt,
        deckY,
        isMobile,
        measured,
    ])

    // Hover handling. "lift": only the hovered card rises.
    // "shift": the hovered card rises AND neighbors spring away from it,
    // with a stronger push on adjacent cards and a weaker one further out.
    const applyHover = (active: number | null) => {
        if (isStatic || isMobile || !stackedRef.current || !enableHover) return
        activeRef.current = active
        setHoveredCard(active)
        const push = hoverMode === "shift"

        cards.forEach((c, j) => {
            const el = cardsRef.current[j]
            if (!el) return
            const isActive = active === j
            const d = active === null ? 0 : j - active
            const spread =
                push && active !== null && !isActive
                    ? Math.sign(d) *
                      shiftDistance *
                      Math.max(0.35, 1 - (Math.abs(d) - 1) * 0.3)
                    : 0

            const reduceMotion =
                respectReducedMotion &&
                typeof window !== "undefined" &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
            gsap.to(el, {
                x: offset(j) + spread,
                y: c.yShift + (isActive ? -30 : 0),
                rotation: isActive ? 0 : c.tilt,
                scale: isActive ? 1.04 : 1,
                zIndex: isActive ? 100 : j + 1,
                duration: reduceMotion ? 0 : push ? 0.8 : 0.35,
                ease: reduceMotion
                    ? "none"
                    : push
                      ? "elastic.out(1, 0.75)"
                      : "power2.out",
                overwrite: "auto",
            })
        })
    }
    applyHoverRef.current = applyHover

    // Keyboard: arrow keys move between cards, Escape drops the lifted card.
    const focusCard = (j: number) => {
        const el = cardsRef.current[j]
        if (!el) return
        const target = (el.querySelector("a") as HTMLElement | null) ?? el
        target.focus()
    }

    if (n === 0) {
        return (
            <div
                style={{
                    width: "100%",
                    height: canvasHeight,
                    background: pageBackground,
                    display: "grid",
                    placeItems: "center",
                    color: "#888",
                    fontSize: 14,
                }}
            >
                Add services in the Services control
            </div>
        )
    }

    // Static renderer (Framer canvas / export): plain, non-animated fallback.
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: canvasHeight,
                    background: pageBackground,
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                }}
            >
                {cards.map((card, i) => (
                    <div
                        key={i}
                        style={{
                            gridArea: "1 / 1",
                            width: cardWidth,
                            height: cardHeight,
                            zIndex: i + 1,
                            transform: `translate(${offset(i)}px, ${card.yShift}px) rotate(${card.tilt}deg)`,
                        }}
                    >
                        <ServiceCard
                            service={card}
                            isHovered={false}
                            {...cardProps}
                            loadMedia
                            isStatic
                        />
                    </div>
                ))}
            </div>
        )
    }

    // Accessible name for a card wrapper that has no link of its own.
    const cardLabel = (card: ServiceData) =>
        card.url ? undefined : card.title || card.imageAlt || undefined

    const mobileVisible = mobileShown || prefersReduced()
    const mobileCard = (card: ServiceData, i: number) => {
        const delay = prefersReduced() ? 0 : i * 0.08
        return (
            <div
                key={i}
                className="sls-card"
                tabIndex={card.url ? undefined : 0}
                role={card.url ? undefined : "group"}
                aria-label={cardLabel(card)}
                style={
                    {
                        "--sls-focus": focusColor,
                        position: "relative",
                        boxSizing: "border-box",
                        height: cardHeight,
                        borderRadius: cardRadius,
                        width: "100%",
                        maxWidth: 560,
                        opacity: mobileVisible ? 1 : 0,
                        // The mobile stack still reflects the selected deck preset;
                        // the entrance offset is layered onto its preset position.
                        transform: mobileVisible
                            ? `translateY(${card.yShift}px) rotate(${card.tilt}deg)`
                            : `translateY(${card.yShift + 24}px) rotate(${card.tilt}deg)`,
                        transition: prefersReduced()
                            ? "none"
                            : `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
                    } as React.CSSProperties
                }
            >
                <ServiceCard service={card} isHovered={false} {...cardProps} />
            </div>
        )
    }

    const mobileContent = (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: mobileGap,
                padding: mobilePadding,
                boxSizing: "border-box",
            }}
        >
            {cards.map(mobileCard)}
        </div>
    )

    const desktopContent = (
        <div
            ref={containerRef}
            style={{
                height: canvasHeight,
                position: "relative",
            }}
        >
            <div
                style={{
                    position: "relative",
                    height: "100%",
                    width: "100%",
                    overflow: "visible",
                    display: "grid",
                    placeItems: "center",
                    boxSizing: "border-box",
                    perspective: 1200,
                }}
            >
                {cards.map((card, i) => (
                    <div
                        key={i}
                        data-stack-card
                        className="sls-card"
                        ref={(el) => {
                            cardsRef.current[i] = el
                        }}
                        tabIndex={card.url ? undefined : 0}
                        role={card.url ? undefined : "group"}
                        aria-label={cardLabel(card)}
                        onPointerDown={(e) => {
                            lastPointerType.current = e.pointerType
                        }}
                        onPointerEnter={(e) => {
                            if (e.pointerType !== "touch") applyHover(i)
                        }}
                        onPointerLeave={(e) => {
                            if (e.pointerType !== "touch") applyHover(null)
                        }}
                        onClick={() => {
                            if (lastPointerType.current !== "touch") return
                            applyHover(activeRef.current === i ? null : i)
                        }}
                        onFocus={(e) => {
                            // Only keyboard focus lifts the card; a mouse
                            // click already does it through hover.
                            try {
                                if (!e.target.matches(":focus-visible")) return
                            } catch (err) {}
                            applyHover(i)
                        }}
                        onBlur={(e) => {
                            if (
                                activeRef.current === i &&
                                !e.currentTarget.contains(
                                    e.relatedTarget as Node | null
                                )
                            )
                                applyHover(null)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                applyHover(null)
                                return
                            }
                            const dir =
                                e.key === "ArrowRight"
                                    ? 1
                                    : e.key === "ArrowLeft"
                                      ? -1
                                      : 0
                            if (!dir) return
                            e.preventDefault()
                            focusCard(i + dir)
                        }}
                        style={
                            {
                                "--sls-focus": focusColor,
                                gridArea: "1 / 1",
                                width: cardWidth,
                                height: cardHeight,
                                zIndex: i + 1,
                                flexShrink: 0,
                                borderRadius: cardRadius,
                                willChange: "transform, opacity",
                                visibility: visible ? "visible" : "hidden",
                                pointerEvents: stacked ? "auto" : "none",
                                cursor:
                                    stacked && enableHover
                                        ? "pointer"
                                        : "default",
                            } as React.CSSProperties
                        }
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                            }}
                        >
                            <ServiceCard
                                service={card}
                                isHovered={hoveredCard === i}
                                {...cardProps}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                background: pageBackground,
                position: "relative",
            }}
        >
            <style>{FOCUS_CSS}</style>
            {!isStatic && showLiveEntrySelector && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 200,
                        top: 16,
                        right: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.92)",
                        color: "#1c1c1a",
                        font: "12px/1.2 system-ui, sans-serif",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                    }}
                >
                    <span>Enter from</span>
                    <select
                        aria-label="Choose card entrance direction"
                        value={liveEntryDirection}
                        onChange={(event) =>
                            setLiveEntryDirection(event.target.value)
                        }
                        style={{
                            border: "1px solid rgba(0,0,0,0.2)",
                            borderRadius: 5,
                            padding: "5px 7px",
                            background: "#fff",
                            color: "inherit",
                            font: "inherit",
                        }}
                    >
                        <option value="bottom">Bottom</option>
                        <option value="top">Top</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="alternate">
                            Top &amp; Bottom (alternate)
                        </option>
                        <option value="sides">
                            Left &amp; Right (alternate)
                        </option>
                        <option value="center">Center (zoom in)</option>
                    </select>
                    <span aria-hidden="true" style={{ opacity: 0.35 }}>
                        │
                    </span>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <span>Deck layout</span>
                        <select
                            aria-label="Choose card deck layout"
                            value={liveDeckLayout}
                            onChange={(event) =>
                                setLiveDeckLayout(event.target.value)
                            }
                            style={{
                                border: "1px solid rgba(0,0,0,0.2)",
                                borderRadius: 5,
                                padding: "5px 7px",
                                background: "#fff",
                                color: "inherit",
                                font: "inherit",
                            }}
                        >
                            <option value="custom">Custom</option>
                            <option value="flat">Flat</option>
                            <option value="fan">Fan</option>
                            <option value="arch">Arch</option>
                            <option value="cascade">Cascade</option>
                            <option value="zigzag">Zigzag</option>
                            <option value="wave">Wave</option>
                            <option value="scatter">Scatter</option>
                        </select>
                    </label>
                </div>
            )}
            {isMobile ? mobileContent : desktopContent}
        </div>
    )
}

const defaultServices = [
    {
        cardType: "text",
        number: "01",
        title: "New custom homes",
        description:
            "Designed from an empty lot to suit your family, your land and the climate.",
    },
    {
        cardType: "text",
        number: "02",
        title: "Teardown and rebuilds",
        description:
            "Keep your lot and your neighbourhood, and start fresh with a home that fits.",
    },
    {
        cardType: "text",
        number: "03",
        title: "Extensions and\nrenovations",
        description: "Add space and light to the home you already love.",
    },
    {
        cardType: "text",
        number: "04",
        title: "Townhouses and multi-unit",
        description: "Well-built homes for small developments and investors.",
    },
]

const isText = (p: any) => p.cardType !== "media"
const isMedia = (p: any) => p.cardType === "media"

addPropertyControls(CardStackShowcase, {
    // ───────────── SERVICES ─────────────
    services: {
        type: ControlType.Array,
        title: "Services",
        description: "Add, remove or reorder cards. Drag to reorder.",
        defaultValue: defaultServices,
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                cardType: {
                    type: ControlType.Enum,
                    title: "Card Type",
                    options: ["text", "media"],
                    optionTitles: ["Text", "Image / Video"],
                    displaySegmentedControl: true,
                    defaultValue: "text",
                },

                // ── Media settings ──
                mediaType: {
                    type: ControlType.Enum,
                    title: "Media",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                    hidden: isText,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p: any) => isText(p) || p.mediaType !== "image",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    description:
                        "Upload a file, or paste a link below. Plays muted and looped.",
                    hidden: (p: any) => isText(p) || p.mediaType !== "video",
                },
                videoPlayback: {
                    type: ControlType.Enum,
                    title: "Playback",
                    options: ["autoplay", "hover"],
                    optionTitles: ["Autoplay", "On Hover"],
                    displaySegmentedControl: true,
                    defaultValue: "autoplay",
                    description:
                        "On Hover plays while the card is hovered or focused. On mobile layouts it plays while the card is in view.",
                    hidden: (p: any) => isText(p) || p.mediaType !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                    hidden: (p: any) =>
                        isText(p) || p.mediaType !== "video" || !!p.video,
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    description:
                        "Shown while the video loads and on the Framer canvas.",
                    hidden: (p: any) => isText(p) || p.mediaType !== "video",
                },
                mediaFit: {
                    type: ControlType.Enum,
                    title: "Fit",
                    options: ["cover", "contain"],
                    optionTitles: ["Fill", "Fit"],
                    displaySegmentedControl: true,
                    defaultValue: "cover",
                    hidden: isText,
                },
                showText: {
                    type: ControlType.Boolean,
                    title: "Show Text",
                    defaultValue: true,
                    enabledTitle: "On",
                    disabledTitle: "Off",
                    description: "Off shows the media only, with no text.",
                    hidden: isText,
                },
                overlayStrength: {
                    type: ControlType.Number,
                    title: "Overlay",
                    defaultValue: 45,
                    min: 0,
                    max: 90,
                    step: 5,
                    unit: "%",
                    description: "Dark gradient behind text for readability.",
                    hidden: (p: any) => isText(p) || !p.showText,
                },
                mediaTextColor: {
                    type: ControlType.Color,
                    title: "Text Color",
                    defaultValue: "#ffffff",
                    hidden: (p: any) => isText(p) || !p.showText,
                },

                // ── Shared content ──
                number: {
                    type: ControlType.String,
                    title: "Number",
                    placeholder: "01",
                    defaultValue: "01",
                    hidden: (p: any) => isMedia(p) && !p.showText,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    displayTextArea: true,
                    placeholder: "Service title",
                    defaultValue: "New custom homes",
                    hidden: (p: any) => isMedia(p) && !p.showText,
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    placeholder: "Short service description",
                    defaultValue: "Designed around your needs.",
                    hidden: (p: any) => isMedia(p) && !p.showText,
                },
                url: {
                    type: ControlType.Link,
                    title: "Link URL",
                },
                linkLabel: {
                    type: ControlType.String,
                    title: "Button Label",
                    defaultValue: "Learn more",
                    hidden: (p: any) => !p.url || (isMedia(p) && !p.showText),
                },

                centerIcon: {
                    type: ControlType.Image,
                    title: "Center Icon",
                    description:
                        "Optional icon shown softly in the center of the card, behind the text. Works on text and image/video cards.",
                },
                centerIconColor: {
                    type: ControlType.Color,
                    title: "Icon Color",
                    optional: true,
                    description:
                        "SVG icons only. Leave off to follow the card's text color.",
                    hidden: (p: any) =>
                        !p.centerIcon || !isSvgSource(p.centerIcon),
                },
                centerIconOpacity: {
                    type: ControlType.Number,
                    title: "Icon Opacity",
                    defaultValue: 12,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                    hidden: (p: any) => !p.centerIcon,
                },

                // ── Text card styling ──
                theme: {
                    type: ControlType.Enum,
                    title: "Style",
                    options: ["light", "dark", "custom"],
                    optionTitles: ["Light", "Dark", "Custom"],
                    displaySegmentedControl: true,
                    defaultValue: "light",
                    hidden: isMedia,
                },
                backgroundColor: {
                    type: ControlType.Color,
                    title: "Card Color",
                    defaultValue: "#ffffff",
                    hidden: (p: any) => isMedia(p) || p.theme !== "custom",
                },
                textColor: {
                    type: ControlType.Color,
                    title: "Text Color",
                    defaultValue: "#111817",
                    hidden: (p: any) => isMedia(p) || p.theme !== "custom",
                },
                numberColor: {
                    type: ControlType.Color,
                    title: "Number Color",
                    optional: true,
                    description:
                        "Leave off to use the global number color (text cards) or the card text color (media cards).",
                },

                // ── Position ──
                tilt: {
                    type: ControlType.Number,
                    title: "Rotation",
                    defaultValue: 0,
                    min: -30,
                    max: 30,
                    step: 1,
                    unit: "°",
                    description:
                        "Tilts this card left (−) or right (+). Added on top of the Deck Layout.",
                },
                yShift: {
                    type: ControlType.Number,
                    title: "Move Up/Down",
                    defaultValue: 0,
                    min: -200,
                    max: 200,
                    step: 5,
                    unit: "px",
                    description:
                        "Negative moves up, positive moves down. Added on top of the Deck Layout.",
                },
            },
        },
    },

    linkMode: {
        type: ControlType.Enum,
        title: "Link Interaction",
        options: ["card", "button"],
        optionTitles: ["Whole Card", "Button"],
        displaySegmentedControl: true,
        defaultValue: "button",
        description:
            "Choose whether a URL makes the whole card clickable or adds a text link button. Media cards with no text are always fully clickable.",
    },

    // ───────────── ANIMATION ─────────────
    showLiveEntrySelector: {
        type: ControlType.Boolean,
        title: "Live Demo",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "Show a visitor-facing dropdown on the live site to preview entrance directions.",
    },
    entryDirection: {
        type: ControlType.Enum,
        title: "Enter From",
        options: [
            "bottom",
            "top",
            "left",
            "right",
            "alternate",
            "sides",
            "center",
        ],
        optionTitles: [
            "Bottom",
            "Top",
            "Left",
            "Right",
            "Top & Bottom (alternate)",
            "Left & Right (alternate)",
            "Center (zoom in)",
        ],
        defaultValue: "bottom",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Appear Time",
        defaultValue: 1.2,
        min: 0.2,
        max: 4,
        step: 0.1,
        unit: "s",
        displayStepper: true,
        description: "How long each card takes to appear.",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 0.25,
        min: 0,
        max: 1.5,
        step: 0.05,
        unit: "s",
        displayStepper: true,
        description: "Delay between each card starting its entrance.",
    },
    animationEase: {
        type: ControlType.Enum,
        title: "Entrance Easing",
        options: [
            "back.out(1.4)",
            "power3.out",
            "power2.out",
            "elastic.out(1, 0.75)",
            "none",
        ],
        optionTitles: ["Back", "Smooth", "Gentle", "Elastic", "Linear"],
        defaultValue: "back.out(1.4)",
    },
    animationOrder: {
        type: ControlType.Enum,
        title: "Card Sequence",
        options: ["forward", "reverse"],
        optionTitles: ["Forward", "Reverse"],
        displaySegmentedControl: true,
        defaultValue: "forward",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Respect Reduced Motion",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Skip entrance and hover motion when the visitor prefers reduced motion.",
    },
    enableHover: {
        type: ControlType.Boolean,
        title: "Hover Lift",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Cards rise when hovered (tap on touch).",
    },
    hoverMode: {
        type: ControlType.Enum,
        title: "Hover Style",
        options: ["lift", "shift"],
        optionTitles: ["Lift Only", "Push Apart"],
        displaySegmentedControl: true,
        defaultValue: "lift",
        description: "Push Apart makes neighboring cards spring away.",
        hidden: (p: any) => !p.enableHover,
    },
    shiftDistance: {
        type: ControlType.Number,
        title: "Push Distance",
        defaultValue: 70,
        min: 10,
        max: 200,
        step: 5,
        unit: "px",
        displayStepper: true,
        hidden: (p: any) => !p.enableHover || p.hoverMode !== "shift",
    },
    enableHoverColors: {
        type: ControlType.Boolean,
        title: "Hover Colors",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Change the active text card's background and text colors. Media cards keep their media.",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover Background",
        defaultValue: "#2f5d50",
        hidden: (p: any) => !p.enableHoverColors,
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#ffffff",
        hidden: (p: any) => !p.enableHoverColors,
    },

    // ───────────── LAYOUT ─────────────
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 300,
        min: 240,
        max: 640,
        step: 10,
        unit: "px",
        displayStepper: true,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 260,
        min: 200,
        max: 800,
        step: 10,
        unit: "px",
        displayStepper: true,
    },
    cardDistance: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 260,
        min: 0,
        max: 600,
        step: 5,
        unit: "px",
        displayStepper: true,
        description:
            "Distance between card centers. Lower = more overlap, higher = more gap.",
    },
    deckLayout: {
        type: ControlType.Enum,
        title: "Deck Layout",
        options: [
            "custom",
            "flat",
            "fan",
            "arch",
            "cascade",
            "zigzag",
            "wave",
            "scatter",
        ],
        optionTitles: [
            "Custom (per card)",
            "Flat",
            "Fan",
            "Arch",
            "Cascade",
            "Zigzag",
            "Wave",
            "Scatter",
        ],
        defaultValue: "custom",
        description:
            "Sets rotation and vertical position for all cards. Per-card values are added on top.",
    },
    deckTilt: {
        type: ControlType.Number,
        title: "Deck Tilt",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
        unit: "°",
        displayStepper: true,
        hidden: (p: any) =>
            p.deckLayout === "custom" || p.deckLayout === "flat",
    },
    deckY: {
        type: ControlType.Number,
        title: "Deck Y Offset",
        defaultValue: 30,
        min: 0,
        max: 150,
        step: 5,
        unit: "px",
        displayStepper: true,
        hidden: (p: any) =>
            p.deckLayout === "custom" || p.deckLayout === "flat",
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 32,
        min: 12,
        max: 80,
        unit: "px",
        displayStepper: true,
        description: "Space inside each card.",
    },
    canvasHeight: {
        type: ControlType.String,
        title: "Section Height",
        defaultValue: "100vh",
        placeholder: "100vh",
        description: "Use px, vh or % for the component height.",
    },

    // ───────────── MOBILE ─────────────
    mobileLayout: {
        type: ControlType.Enum,
        title: "Mobile Layout",
        options: ["stack", "off"],
        optionTitles: ["Vertical List", "Off (keep deck)"],
        displaySegmentedControl: true,
        defaultValue: "stack",
        description:
            "Switches automatically when the deck no longer fits the available width. Wider layouts keep the deck entrance and hover effects.",
    },
    mobileGap: {
        type: ControlType.Number,
        title: "Mobile Gap",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        displayStepper: true,
        hidden: (p: any) => p.mobileLayout === "off",
    },
    mobilePadding: {
        type: ControlType.Number,
        title: "Mobile Padding",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
        displayStepper: true,
        hidden: (p: any) => p.mobileLayout === "off",
    },

    // ───────────── STYLE ─────────────
    pageBackground: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#f1efe8",
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#2f5d50",
        description: "Default for all cards. Override per card if needed.",
    },
    numberColorOnMedia: {
        type: ControlType.Boolean,
        title: "Number Color on Media",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "On: image/video cards use the Number Color too. Off: they keep their own text color.",
        hidden: (p: any) => !p.showCounter,
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Show Counter",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Turn off to hide the number on every card.",
    },
    counterBackgroundEnabled: {
        type: ControlType.Boolean,
        title: "Counter Background",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p: any) => !p.showCounter,
    },
    counterBackgroundColor: {
        type: ControlType.Color,
        title: "Counter Background Color",
        defaultValue: "#1c1c1a",
        hidden: (p: any) => !p.showCounter || !p.counterBackgroundEnabled,
    },
    counterHoverBackgroundColor: {
        type: ControlType.Color,
        title: "Counter Hover Background",
        defaultValue: "#2f5d50",
        hidden: (p: any) =>
            !p.showCounter || !p.enableHover || !p.counterBackgroundEnabled,
    },
    counterHoverTextColor: {
        type: ControlType.Color,
        title: "Counter Hover Color",
        optional: true,
        description:
            "Number color while its card is hovered. Leave off to follow the card's hover text color.",
        hidden: (p: any) => !p.showCounter || !p.enableHover,
    },
    counterRadius: {
        type: ControlType.Number,
        title: "Counter Corner Radius",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (p: any) => !p.showCounter || !p.counterBackgroundEnabled,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Corners",
        defaultValue: 24,
        min: 0,
        max: 40,
        unit: "px",
        displayStepper: true,
    },
    shadowStyle: {
        type: ControlType.Enum,
        title: "Card Shadow",
        options: ["none", "soft", "medium", "strong", "hard", "custom"],
        optionTitles: [
            "None",
            "Soft",
            "Medium",
            "Strong",
            "Hard Offset",
            "Custom",
        ],
        defaultValue: "medium",
    },
    shadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (p: any) => p.shadowStyle !== "custom",
    },
    shadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        defaultValue: 24,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (p: any) => p.shadowStyle !== "custom",
    },
    shadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        defaultValue: 50,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (p: any) => p.shadowStyle !== "custom",
    },
    shadowSpread: {
        type: ControlType.Number,
        title: "Shadow Spread",
        defaultValue: -12,
        min: -100,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: true,
        hidden: (p: any) => p.shadowStyle !== "custom",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,0.12)",
        hidden: (p: any) => p.shadowStyle !== "custom",
    },

    focusColor: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "#2f5d50",
        description: "Outline shown when a card is reached with the keyboard.",
    },

    // ───────────── TYPOGRAPHY ─────────────
    uppercaseTitles: {
        type: ControlType.Boolean,
        title: "Uppercase Titles",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Service Title",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            fontWeight: "700",
            letterSpacing: "-0.02em",
            lineHeight: "1.15em",
        },
    },
    numberFont: {
        type: ControlType.Font,
        title: "Service Number",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            fontWeight: "700",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Service Description",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            fontWeight: "400",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
    },
})
