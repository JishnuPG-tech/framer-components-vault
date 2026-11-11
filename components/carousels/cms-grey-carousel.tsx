/**
 * Hemline — infinite mixed-media rail (image or video per card) with a
 * greyscale switch and a fullscreen lightbox.
 *
 * Marketplace compliance
 * 1. Static renderer — the exported entry calls useIsStaticRenderer() before
 *    anything else and returns StillRail: plain divs, posters only, no <video>
 *    elements, no transitions, no filters beyond the resting greyscale value,
 *    no observers, listeners, timers or lightbox. The belt is drawn at rest so
 *    card one sits where the buyer placed it.
 * 2. Offscreen work — the live rAF loop starts locked out (permitRef = false),
 *    re-checks the permit at the top of every frame, and returns without
 *    scheduling another frame once the rail settles. IntersectionObserver,
 *    visibilitychange and prefers-reduced-motion all park it and clear pointer
 *    and momentum state. Video playback is rationed to the few cards nearest
 *    the centre, and every clip is paused the moment the section leaves the
 *    screen, the tab is hidden or the lightbox takes over.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const SEED = [
    {
        seed: "ember",
        title: "Wild Ink Study",
        w: 196,
        h: 268,
        media: "image",
        clip: "",
    },
    {
        seed: "vellum",
        title: "Folded Light",
        w: 302,
        h: 462,
        media: "video",
        clip: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    },
    {
        seed: "cinnabar",
        title: "Paper Theatre",
        w: 198,
        h: 288,
        media: "image",
        clip: "",
    },
    {
        seed: "lacquer",
        title: "Table Notes",
        w: 112,
        h: 178,
        media: "image",
        clip: "",
    },
    {
        seed: "carmine",
        title: "Kitchen Still Life",
        w: 108,
        h: 166,
        media: "video",
        clip: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    },
    {
        seed: "drape",
        title: "Analogue Room",
        w: 212,
        h: 448,
        media: "image",
        clip: "",
    },
    {
        seed: "signal",
        title: "Signal Flare",
        w: 168,
        h: 244,
        media: "video",
        clip: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    },
]

const seedCards = () =>
    SEED.map((s) => {
        const still = {
            src: `https://picsum.photos/seed/${s.seed}/${Math.round(s.w * 2.4)}/${Math.round(s.h * 2.4)}`,
            alt: s.title,
        }
        const clip = s.media === "video"
        return {
            media: s.media,
            image: clip ? undefined : still,
            imageUrl: "",
            video: "",
            videoUrl: s.clip,
            poster: clip ? still : undefined,
            posterUrl: "",
            title: s.title,
            link: "",
            width: s.w,
            height: s.h,
        }
    })

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

const loopValue = (n: number, span: number) => {
    if (!(span > 0)) return 0
    const r = n % span
    return r < 0 ? r + span : r
}

// Image cards read the image slots; video cards read their own poster slots, so
// neither type ever borrows the other's upload.
const stillSlots = (card: any) =>
    card?.media === "video"
        ? { typed: card?.posterUrl, file: card?.poster }
        : { typed: card?.imageUrl, file: card?.image }

const pickSource = (card: any) => {
    const { typed, file } = stillSlots(card)
    const url = typeof typed === "string" ? typed.trim() : ""
    if (url) return url
    if (!file) return ""
    return typeof file === "string" ? file : file.src || ""
}

const pickSrcSet = (card: any) => {
    const { typed, file } = stillSlots(card)
    const url = typeof typed === "string" ? typed.trim() : ""
    if (url) return undefined
    return file && typeof file !== "string" ? file.srcSet : undefined
}

const pickClip = (card: any) => {
    const typed = typeof card?.videoUrl === "string" ? card.videoUrl.trim() : ""
    if (typed) return typed
    const file = card?.video
    if (!file) return ""
    return typeof file === "string" ? file : file.src || ""
}

// A card only counts as a clip when it is set to video AND actually carries one.
const isClip = (card: any) => card?.media === "video" && !!pickClip(card)

const pickHref = (card: any) => {
    const raw = card?.link
    if (!raw) return ""
    return typeof raw === "string" ? raw : String(raw)
}

// Positions every card along one belt pass, then reports the pass length.
const measureBelt = (cards: any[], gap: number, scale: number) => {
    const slots: { w: number; h: number; base: number }[] = []
    let cursor = 0
    let tallest = 0
    for (let i = 0; i < cards.length; i++) {
        const w = Math.max(
            24,
            Math.round((Number(cards[i]?.width) || 200) * scale)
        )
        const h = Math.max(
            24,
            Math.round((Number(cards[i]?.height) || 300) * scale)
        )
        slots.push({ w, h, base: cursor })
        cursor += w + gap
        if (h > tallest) tallest = h
    }
    return { slots, pass: Math.max(1, cursor), tallest }
}

/* ------------------------------------------------------------------ */
/* shared visual tokens (values only — never a shared render helper)   */
/* ------------------------------------------------------------------ */

const captionStyle = (p: any): React.CSSProperties => ({
    marginTop: p.captionGap,
    fontFamily: p.captionFont?.fontFamily,
    fontSize: p.captionFont?.fontSize ?? 11,
    fontWeight: p.captionFont?.fontWeight ?? 400,
    fontStyle: p.captionFont?.fontStyle,
    letterSpacing: p.captionFont?.letterSpacing ?? "0.01em",
    lineHeight: p.captionFont?.lineHeight ?? 1.4,
    color: p.captionColor,
    textAlign: p.captionAlign,
    textTransform: p.captionCase,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
})

// Font controls hand back CSS strings as often as numbers ("28px", "1.4em",
// "120%"), so every value is parsed leniently — a NaN here silently starves the
// reserve and the title gets shaved off.
const asNumber = (v: any, fallback: number) => {
    if (typeof v === "number" && isFinite(v)) return v
    if (typeof v === "string") {
        const n = parseFloat(v)
        if (!isNaN(n)) return n
    }
    return fallback
}

// Vertical room the title line needs under the tallest card.
const captionReserve = (p: any, hasTitles: boolean) => {
    if (!hasTitles) return 0
    const size = asNumber(p.captionFont?.fontSize, 11)
    const raw = p.captionFont?.lineHeight
    let ratio = 1.4
    if (raw !== undefined && raw !== null && raw !== "") {
        const n = asNumber(raw, NaN)
        if (!isNaN(n) && n > 0) {
            if (typeof raw === "string" && raw.indexOf("%") > -1)
                ratio = n / 100
            else ratio = n > 4 ? n / size : n
        }
    }
    // +2 covers descenders sitting below the line box.
    return Math.ceil(size * ratio) + asNumber(p.captionGap, 0) + 2
}

// Cards are laid out at their authored pixel heights, but the section frame is
// fixed. When Card Scale pushes the tallest card past the frame, the title row
// would fall outside the clipped edge — so shrink the whole belt by whatever
// factor is needed to seat the tallest card AND its title inside the frame.
const fitFactor = (
    tallestRaw: number,
    labelRoom: number,
    frameH: number,
    enabled: boolean
) => {
    if (!enabled || !(frameH > 0) || !(tallestRaw > 0)) return 1
    const room = frameH - labelRoom - 1
    if (!(room > 0)) return 0.1
    return room < tallestRaw ? Math.max(0.1, room / tallestRaw) : 1
}

const tallestAt = (cards: any[], scale: number) => {
    let t = 0
    for (let i = 0; i < cards.length; i++) {
        const h = Math.max(
            24,
            Math.round((Number(cards[i]?.height) || 300) * scale)
        )
        if (h > t) t = h
    }
    return t
}

const veilStyle = (fade: number): React.CSSProperties => {
    if (fade <= 0) return {}
    const g = `linear-gradient(to right, transparent 0px, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent 100%)`
    return { WebkitMaskImage: g, maskImage: g }
}

/* ------------------------------------------------------------------ */
/* greyscale switch + clip badge — shared geometry, never shared markup */
/* ------------------------------------------------------------------ */

const anchorStyle = (place: string, inset: number): React.CSSProperties => {
    const v = place.indexOf("bottom") === 0 ? { bottom: inset } : { top: inset }
    const h = place.indexOf("Right") > -1 ? { right: inset } : { left: inset }
    return { position: "absolute", zIndex: 4, ...v, ...h }
}

const pillShell = (p: any): React.CSSProperties => ({
    position: "relative",
    display: "inline-flex",
    alignItems: "stretch",
    padding: 4,
    borderRadius: 999,
    background: p.toggleSurface,
    border: `1px solid ${p.toggleBorder}`,
    boxShadow:
        "0 1px 1px rgba(16,14,12,0.04), 0 10px 30px -14px rgba(16,14,12,0.45)",
    boxSizing: "border-box",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
})

const segmentStyle = (active: boolean, p: any): React.CSSProperties => ({
    position: "relative",
    zIndex: 1,
    padding: "8px 16px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    lineHeight: 1,
    whiteSpace: "nowrap",
    color: active ? p.toggleActiveText : p.toggleText,
    boxSizing: "border-box",
})

// Only the static branch paints the fill straight onto the active segment;
// the live branch slides a measured pellet behind them instead.
const restingFill = (active: boolean, p: any): React.CSSProperties =>
    active
        ? {
              background: p.toggleAccent,
              boxShadow: "0 1px 2px rgba(16,14,12,0.22)",
          }
        : {}

// Corner marker that tells a buyer a card holds a clip.
const badgeSeat = (size: number): React.CSSProperties => ({
    position: "absolute",
    left: 10,
    bottom: 10,
    width: size,
    height: size,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
})

const badgeGlyph = (size: number, tint: string): React.CSSProperties => ({
    width: 0,
    height: 0,
    marginLeft: Math.round(size * 0.1),
    borderTop: `${Math.round(size * 0.17)}px solid transparent`,
    borderBottom: `${Math.round(size * 0.17)}px solid transparent`,
    borderLeft: `${Math.round(size * 0.28)}px solid ${tint}`,
})

/* ================================================================== */
/* STATIC BRANCH — plain divs only, posters instead of playback        */
/* ================================================================== */

function StillRail(props: any) {
    const {
        cards,
        gap,
        cardScale,
        radius,
        edgeFade,
        padding,
        background,
        imageBg,
        mono,
        monoAmount,
        fitHeight,
        badgeShow,
        badgeSize,
        badgeFill,
        badgeTint,
    } = props
    const restingTone = mono ? `grayscale(${monoAmount}%)` : "none"
    const list = Array.isArray(cards) && cards.length ? cards : []
    const labelRoom = captionReserve(
        props,
        list.some((c: any) => !!c?.title)
    )
    const frameH = Number(props.height) || 0
    const asked = cardScale / 100
    const seated =
        asked * fitFactor(tallestAt(list, asked), labelRoom, frameH, fitHeight)
    const { slots, tallest } = measureBelt(list, gap, seated)

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                boxSizing: "border-box",
            }}
        >
            {props.toggleShow ? (
                <div style={anchorStyle(props.togglePlace, props.toggleInset)}>
                    <div style={pillShell(props)}>
                        <div
                            style={{
                                ...segmentStyle(!mono, props),
                                ...restingFill(!mono, props),
                            }}
                        >
                            {props.toggleLabelPlain}
                        </div>
                        <div
                            style={{
                                ...segmentStyle(!!mono, props),
                                ...restingFill(!!mono, props),
                            }}
                        >
                            {props.toggleLabelGrey}
                        </div>
                    </div>
                </div>
            ) : null}
            <div style={{ width: "100%", ...veilStyle(edgeFade) }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap,
                        paddingLeft: padding,
                        paddingRight: padding,
                        minHeight: tallest + labelRoom,
                        boxSizing: "content-box",
                    }}
                >
                    {list.map((card: any, i: number) => (
                        <div
                            key={i}
                            style={{ width: slots[i].w, flex: "0 0 auto" }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: slots[i].h,
                                    borderRadius: radius,
                                    overflow: "hidden",
                                    background: imageBg,
                                }}
                            >
                                {pickSource(card) ? (
                                    <img
                                        src={pickSource(card)}
                                        alt={card?.title || ""}
                                        width={slots[i].w}
                                        height={slots[i].h}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            filter: restingTone,
                                        }}
                                    />
                                ) : null}
                                {badgeShow && isClip(card) ? (
                                    <div
                                        style={{
                                            ...badgeSeat(badgeSize),
                                            background: badgeFill,
                                        }}
                                    >
                                        <div
                                            style={badgeGlyph(
                                                badgeSize,
                                                badgeTint
                                            )}
                                        />
                                    </div>
                                ) : null}
                            </div>
                            {card?.title ? (
                                <div style={captionStyle(props)}>
                                    {card.title}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/* ================================================================== */
/* LIGHTBOX — mounted by the live branch only                          */
/* ================================================================== */

function Spotlight(props: any) {
    const { card, index, count, onClose, onStep, p } = props
    const [entered, setEntered] = useState(false)
    const clipRef = useRef<HTMLVideoElement | null>(null)

    useEffect(() => {
        const id = requestAnimationFrame(() => setEntered(true))
        return () => cancelAnimationFrame(id)
    }, [])

    // Fresh clip on every step — reset and re-arm playback.
    useEffect(() => {
        const node = clipRef.current
        if (!node) return
        node.muted = !!p.sheetMuted
        if (p.sheetPlays) {
            const attempt = node.play()
            if (attempt && typeof attempt.catch === "function")
                attempt.catch(() => {})
        }
        return () => {
            try {
                node.pause()
            } catch (_) {}
        }
    }, [index, p.sheetPlays, p.sheetMuted])

    const clip = pickClip(card)
    const still = pickSource(card)
    const showClip = card?.media === "video" && !!clip

    const glyph = (dir: number): React.CSSProperties => ({
        width: 11,
        height: 11,
        borderTop: `1.5px solid ${p.sheetTint}`,
        borderRight: `1.5px solid ${p.sheetTint}`,
        transform: `rotate(${dir > 0 ? 45 : -135}deg)`,
        marginLeft: dir > 0 ? -3 : 3,
    })

    const circleBtn: React.CSSProperties = {
        width: 46,
        height: 46,
        borderRadius: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${p.sheetEdge}`,
        background: p.sheetControl,
        cursor: "pointer",
        appearance: "none",
        padding: 0,
        transition: "opacity 200ms ease, transform 200ms ease",
        opacity: entered ? 1 : 0,
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                padding: 32,
                boxSizing: "border-box",
                background: p.sheetScrim,
                backdropFilter: p.sheetBlur
                    ? `blur(${p.sheetBlur}px) saturate(120%)`
                    : undefined,
                WebkitBackdropFilter: p.sheetBlur
                    ? `blur(${p.sheetBlur}px) saturate(120%)`
                    : undefined,
                opacity: entered ? 1 : 0,
                transition: "opacity 260ms ease",
            }}
        >
            <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                style={{
                    ...circleBtn,
                    position: "absolute",
                    top: 24,
                    right: 24,
                    width: 40,
                    height: 40,
                }}
            >
                <span
                    style={{
                        position: "relative",
                        width: 13,
                        height: 13,
                        display: "block",
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            top: 6,
                            left: 0,
                            width: 13,
                            height: 1.5,
                            background: p.sheetTint,
                            transform: "rotate(45deg)",
                        }}
                    />
                    <span
                        style={{
                            position: "absolute",
                            top: 6,
                            left: 0,
                            width: 13,
                            height: 1.5,
                            background: p.sheetTint,
                            transform: "rotate(-45deg)",
                        }}
                    />
                </span>
            </button>

            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: "min(1180px, calc(100vw - 200px))",
                    maxHeight: "78vh",
                    borderRadius: p.sheetRadius,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.24)",
                    transform: entered ? "scale(1)" : "scale(0.965)",
                    transition:
                        "transform 320ms cubic-bezier(0.22,0.61,0.36,1)",
                    display: "flex",
                }}
            >
                {showClip ? (
                    <video
                        ref={clipRef}
                        key={clip}
                        src={clip}
                        poster={still || undefined}
                        controls
                        loop={!!p.sheetLoops}
                        playsInline
                        preload="metadata"
                        style={{
                            display: "block",
                            maxWidth: "min(1180px, calc(100vw - 200px))",
                            maxHeight: "78vh",
                            objectFit: "contain",
                        }}
                    />
                ) : still ? (
                    <img
                        src={still}
                        srcSet={pickSrcSet(card)}
                        alt={card?.title || ""}
                        draggable={false}
                        style={{
                            display: "block",
                            maxWidth: "min(1180px, calc(100vw - 200px))",
                            maxHeight: "78vh",
                            objectFit: "contain",
                        }}
                    />
                ) : (
                    <div style={{ width: 420, height: 260 }} />
                )}
            </div>

            {count > 1 ? (
                <button
                    type="button"
                    aria-label="Previous"
                    onClick={(e) => {
                        e.stopPropagation()
                        onStep(-1)
                    }}
                    style={{
                        ...circleBtn,
                        position: "absolute",
                        left: p.sheetArrowInset,
                        top: "50%",
                        marginTop: -23,
                        transform: entered
                            ? "translateX(0)"
                            : "translateX(-10px)",
                    }}
                >
                    <span style={glyph(-1)} />
                </button>
            ) : null}

            {count > 1 ? (
                <button
                    type="button"
                    aria-label="Next"
                    onClick={(e) => {
                        e.stopPropagation()
                        onStep(1)
                    }}
                    style={{
                        ...circleBtn,
                        position: "absolute",
                        right: p.sheetArrowInset,
                        top: "50%",
                        marginTop: -23,
                        transform: entered
                            ? "translateX(0)"
                            : "translateX(10px)",
                    }}
                >
                    <span style={glyph(1)} />
                </button>
            ) : null}

            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    opacity: entered ? 1 : 0,
                    transition: "opacity 320ms ease 90ms",
                }}
            >
                <div style={{ textAlign: "center", minWidth: 120 }}>
                    {p.sheetCaption && card?.title ? (
                        <div
                            style={{
                                fontFamily: p.captionFont?.fontFamily,
                                fontSize: 14,
                                letterSpacing: "0.02em",
                                color: p.sheetTint,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "60vw",
                            }}
                        >
                            {card.title}
                        </div>
                    ) : null}
                    {p.sheetCounter ? (
                        <div
                            style={{
                                marginTop: 6,
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                color: p.sheetTint,
                                opacity: 0.58,
                            }}
                        >
                            {index + 1} / {count}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

/* ================================================================== */
/* LIVE BRANCH                                                         */
/* ================================================================== */

function DriftRail(props: any) {
    const {
        cards,
        gap,
        cardScale,
        radius,
        edgeFade,
        padding,
        background,
        imageBg,
        dragEnabled,
        wheelMode,
        wheelStrength,
        glide,
        driftSpeed,
        hoverZoom,
        zoomEase,
        mono,
        monoAmount,
        playMode,
        maxPlaying,
        clipMuted,
        clipLoops,
        tapAction,
        badgeShow,
        badgeSize,
        badgeFill,
        badgeTint,
    } = props

    const list = useMemo(
        () => (Array.isArray(cards) && cards.length ? cards : []),
        [cards]
    )

    const [greyOn, setGreyOn] = useState(!!mono)
    const segBoxRef = useRef<HTMLDivElement | null>(null)
    const segRefs = useRef<Array<HTMLButtonElement | null>>([null, null])
    const [pellet, setPellet] = useState({ x: 0, w: 0 })
    useEffect(() => {
        setGreyOn(!!mono)
    }, [mono])
    const restTone = greyOn ? `grayscale(${monoAmount}%)` : "none"

    const shellRef = useRef<HTMLDivElement | null>(null)
    const nodesRef = useRef<Array<HTMLDivElement | null>>([])
    const clipsRef = useRef<Array<HTMLVideoElement | null>>([])
    const xsRef = useRef<number[]>([])

    const [viewport, setViewport] = useState(0)
    const [frameH, setFrameH] = useState(0)
    const [calm, setCalm] = useState(false)

    const capRef = useRef<HTMLDivElement | null>(null)
    const [measuredCap, setMeasuredCap] = useState(0)

    /* ---- lightbox state ---- */
    const [sheet, setSheet] = useState({ open: false, index: 0 })
    const sheetRef = useRef(sheet)
    sheetRef.current = sheet
    const lightboxLive = !!props.lightbox && tapAction === "lightbox"

    const estimatedCap = useMemo(
        () =>
            captionReserve(
                props,
                list.some((c: any) => !!c?.title)
            ),
        [list, props.captionFont, props.captionGap]
    )
    // The estimate is a floor; the rendered line is the truth.
    const labelRoom = estimatedCap > 0 ? Math.max(estimatedCap, measuredCap) : 0

    // Asked-for scale, then the seated scale after fitting to the frame.
    const seated = useMemo(() => {
        const asked = cardScale / 100
        const box = frameH || Number(props.height) || 0
        return (
            asked *
            fitFactor(tallestAt(list, asked), labelRoom, box, props.fitHeight)
        )
    }, [list, cardScale, frameH, labelRoom, props.fitHeight, props.height])

    const belt = useMemo(
        () => measureBelt(list, gap, seated),
        [list, gap, seated]
    )

    // How many belt passes are needed to blanket the viewport plus one card of
    // headroom on each flank.
    const passes = useMemo(() => {
        const widest = belt.slots.reduce((m, s) => Math.max(m, s.w), 0)
        const need = viewport + (widest + gap) * 2
        return Math.max(2, Math.ceil(need / belt.pass) + 1)
    }, [belt, viewport, gap])

    // Flattened placement table: one entry per rendered node.
    const placement = useMemo(() => {
        const out: {
            card: any
            slot: number
            w: number
            h: number
            anchor: number
            clip: string
            key: string
        }[] = []
        for (let p = 0; p < passes; p++) {
            for (let i = 0; i < list.length; i++) {
                out.push({
                    card: list[i],
                    slot: i,
                    w: belt.slots[i].w,
                    h: belt.slots[i].h,
                    anchor: belt.slots[i].base + p * belt.pass,
                    clip: isClip(list[i]) ? pickClip(list[i]) : "",
                    key: `${p}-${i}`,
                })
            }
        }
        return out
    }, [list, belt, passes])

    const span = belt.pass * passes
    const flank = useMemo(
        () => belt.slots.reduce((m, s) => Math.max(m, s.w), 0) + gap,
        [belt, gap]
    )

    /* ---- live-updating mirrors for the loop and handlers ---- */
    const geoRef = useRef({ placement, span, flank })
    geoRef.current = { placement, span, flank }

    const viewRef = useRef(viewport)
    viewRef.current = viewport

    const tuneRef = useRef<any>({})
    tuneRef.current = {
        glide: Math.min(0.995, Math.max(0.7, glide)),
        drift: calm ? 0 : driftSpeed,
        wheelMode,
        wheelStrength,
        dragEnabled,
        calm,
        playMode,
        maxPlaying,
        clipMuted,
        padding,
    }

    const offsetRef = useRef(0)
    const velRef = useRef(0)
    const rafRef = useRef(0)
    const stampRef = useRef(0)
    const rationStampRef = useRef(0)
    const permitRef = useRef(false)
    const grabRef = useRef({ down: false, x: 0, travel: 0, flick: 0 })

    /* ---- playback ---- */
    const hushAll = useCallback(() => {
        const nodes = clipsRef.current
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i]
            if (!n) continue
            try {
                n.pause()
            } catch (_) {}
        }
    }, [])

    // Only the few clips nearest the middle of the frame are allowed to run.
    const ration = useCallback(() => {
        const t = tuneRef.current
        if (
            !permitRef.current ||
            t.calm ||
            t.playMode !== "auto" ||
            sheetRef.current.open
        ) {
            hushAll()
            return
        }
        const rows = geoRef.current.placement
        const nodes = clipsRef.current
        const mid = viewRef.current / 2
        const scored: { i: number; d: number }[] = []
        for (let i = 0; i < rows.length; i++) {
            if (!nodes[i]) continue
            const x = xsRef.current[i]
            if (typeof x !== "number") continue
            const centre = x + t.padding + rows[i].w / 2
            scored.push({ i, d: Math.abs(centre - mid) })
        }
        scored.sort((a, b) => a.d - b.d)
        const cap = Math.max(0, Math.round(t.maxPlaying))
        const allow = new Set<number>()
        for (let k = 0; k < scored.length && k < cap; k++)
            allow.add(scored[k].i)
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i]
            if (!n) continue
            if (allow.has(i)) {
                n.muted = t.clipMuted !== false
                if (n.paused) {
                    const attempt = n.play()
                    if (attempt && typeof attempt.catch === "function")
                        attempt.catch(() => {})
                }
            } else if (!n.paused) {
                try {
                    n.pause()
                } catch (_) {}
            }
        }
    }, [hushAll])

    /* ---- paint: place every node from the current offset ---- */
    const paint = useCallback(() => {
        const { placement: rows, span: total, flank: lead } = geoRef.current
        const off = offsetRef.current
        for (let i = 0; i < rows.length; i++) {
            const node = nodesRef.current[i]
            const x = loopValue(rows[i].anchor - off + lead, total) - lead
            xsRef.current[i] = x
            if (!node) continue
            node.style.transform = `translate3d(${x}px, 0, 0)`
        }
    }, [])

    const awake = useCallback(() => {
        const t = tuneRef.current
        return (
            grabRef.current.down ||
            Math.abs(velRef.current) > 0.04 ||
            (t.drift !== 0 && !t.calm)
        )
    }, [])

    const step = useCallback(
        (now: number) => {
            rafRef.current = 0
            if (!permitRef.current) {
                velRef.current = 0
                grabRef.current.down = false
                hushAll()
                return
            }
            const prev = stampRef.current || now
            stampRef.current = now
            const k = Math.min(3, Math.max(0.2, (now - prev) / 16.667))
            const t = tuneRef.current

            if (!grabRef.current.down) {
                if (t.drift !== 0) offsetRef.current += t.drift * k
                if (Math.abs(velRef.current) > 0.04) {
                    offsetRef.current += velRef.current * k
                    velRef.current *= Math.pow(t.glide, k)
                } else {
                    velRef.current = 0
                }
                paint()
            }

            if (now - rationStampRef.current > 280) {
                rationStampRef.current = now
                ration()
            }

            if (awake()) rafRef.current = requestAnimationFrame(step)
        },
        [paint, awake, ration, hushAll]
    )

    const wake = useCallback(() => {
        if (!permitRef.current || rafRef.current) return
        stampRef.current = 0
        rafRef.current = requestAnimationFrame(step)
    }, [step])

    /* ---- viewport measurement ---- */
    useEffect(() => {
        const shell = shellRef.current
        if (!shell) return
        const read = () => {
            setViewport(shell.clientWidth || 0)
            setFrameH(shell.clientHeight || 0)
        }
        read()
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", read)
            return () => window.removeEventListener("resize", read)
        }
        const ro = new ResizeObserver(read)
        ro.observe(shell)
        return () => ro.disconnect()
    }, [])

    /* ---- reduced motion ---- */
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setCalm(!!mq.matches)
        sync()
        if (mq.addEventListener) {
            mq.addEventListener("change", sync)
            return () => mq.removeEventListener("change", sync)
        }
        mq.addListener(sync)
        return () => mq.removeListener(sync)
    }, [])

    /* ---- true caption height (settles in one pass) ---- */
    useEffect(() => {
        const node = capRef.current
        if (!node) {
            if (measuredCap !== 0) setMeasuredCap(0)
            return
        }
        const real = Math.ceil(
            node.offsetHeight + asNumber(props.captionGap, 0) + 2
        )
        if (Math.abs(real - measuredCap) > 0.5) setMeasuredCap(real)
    })

    /* ---- seat the sliding pellet under the active segment ---- */
    useEffect(() => {
        const box = segBoxRef.current
        const node = segRefs.current[greyOn ? 1 : 0]
        if (!box || !node) {
            if (pellet.w !== 0) setPellet({ x: 0, w: 0 })
            return
        }
        const x = node.offsetLeft
        const w = node.offsetWidth
        if (Math.abs(x - pellet.x) > 0.5 || Math.abs(w - pellet.w) > 0.5)
            setPellet({ x, w })
    })

    /* ---- permit: intersection + tab visibility ---- */
    useEffect(() => {
        const shell = shellRef.current
        if (!shell) return

        let onScreen = typeof IntersectionObserver === "undefined"
        let tabOpen = typeof document === "undefined" || !document.hidden

        const settle = () => {
            const allowed = onScreen && tabOpen
            permitRef.current = allowed
            if (!allowed) {
                if (rafRef.current) cancelAnimationFrame(rafRef.current)
                rafRef.current = 0
                velRef.current = 0
                grabRef.current.down = false
                grabRef.current.travel = 0
                hushAll()
            } else {
                wake()
                ration()
            }
        }

        let io: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    onScreen = entries.some((e) => e.isIntersecting)
                    settle()
                },
                { rootMargin: "120px" }
            )
            io.observe(shell)
        }

        const onTab = () => {
            tabOpen = !document.hidden
            settle()
        }
        document.addEventListener("visibilitychange", onTab)
        settle()

        return () => {
            if (io) io.disconnect()
            document.removeEventListener("visibilitychange", onTab)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = 0
            permitRef.current = false
            hushAll()
        }
    }, [wake, ration, hushAll])

    /* ---- repaint whenever geometry changes ---- */
    useEffect(() => {
        nodesRef.current.length = placement.length
        clipsRef.current.length = placement.length
        xsRef.current.length = placement.length
        paint()
        wake()
        ration()
    }, [placement, paint, wake, ration])

    /* ---- re-ration when playback settings or the sheet change ---- */
    useEffect(() => {
        ration()
    }, [playMode, maxPlaying, clipMuted, calm, sheet.open, ration])

    /* ---- wheel ---- */
    useEffect(() => {
        const shell = shellRef.current
        if (!shell || wheelMode === "off") return

        const onWheel = (e: WheelEvent) => {
            if (!permitRef.current || sheetRef.current.open) return
            const t = tuneRef.current
            const lateral = Math.abs(e.deltaX) > Math.abs(e.deltaY)
            const delta =
                t.wheelMode === "lateral"
                    ? e.deltaX
                    : lateral
                      ? e.deltaX
                      : e.deltaY
            if (!delta) return
            if (t.wheelMode === "lateral" && !lateral) return
            e.preventDefault()
            offsetRef.current += delta * t.wheelStrength
            velRef.current = delta * t.wheelStrength * 0.22
            paint()
            wake()
        }

        shell.addEventListener("wheel", onWheel, { passive: false })
        return () => shell.removeEventListener("wheel", onWheel)
    }, [wheelMode, paint, wake])

    /* ---- lightbox keyboard + page scroll lock ---- */
    useEffect(() => {
        if (!sheet.open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSheet({ open: false, index: 0 })
            else if (e.key === "ArrowRight") stepSheet(1)
            else if (e.key === "ArrowLeft") stepSheet(-1)
        }
        window.addEventListener("keydown", onKey)
        const prior = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = prior
        }
    }, [sheet.open, list.length])

    const stepSheet = (dir: number) => {
        const total = list.length
        if (!total) return
        setSheet((s) => ({
            open: true,
            index: (s.index + dir + total) % total,
        }))
    }

    const openSheet = (slot: number) => {
        hushAll()
        setSheet({ open: true, index: slot })
    }

    /* ---- pointer drag ----
       No setPointerCapture here. A captured pointer makes the browser retarget
       the following click to the capturing element, which swallows every card
       tap and kills the lightbox. Window listeners give the same off-edge drag
       without touching the click target. */
    const dropRef = useRef<null | (() => void)>(null)

    const onDown = (e: React.PointerEvent) => {
        if (!dragEnabled || !permitRef.current || sheetRef.current.open) return
        if (dropRef.current) dropRef.current()
        grabRef.current = { down: true, x: e.clientX, travel: 0, flick: 0 }
        velRef.current = 0

        const move = (ev: PointerEvent) => {
            const g = grabRef.current
            if (!g.down) return
            const dx = ev.clientX - g.x
            g.x = ev.clientX
            g.travel += Math.abs(dx)
            g.flick = g.flick * 0.6 + dx * 0.4
            offsetRef.current -= dx
            paint()
        }

        const up = () => {
            const g = grabRef.current
            if (g.down) {
                g.down = false
                velRef.current = tuneRef.current.calm
                    ? 0
                    : Math.max(-90, Math.min(90, -g.flick * 1.15))
                stampRef.current = 0
                wake()
            }
            drop()
        }

        const drop = () => {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
            window.removeEventListener("pointercancel", up)
            dropRef.current = null
        }

        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
        window.addEventListener("pointercancel", up)
        dropRef.current = drop
        wake()
    }

    useEffect(
        () => () => {
            if (dropRef.current) dropRef.current()
        },
        []
    )

    // A tap is anything under the slop threshold; anything past it was a drag
    // and must not open the sheet or follow a link.
    const dragged = () => grabRef.current.travel > 6

    const swallowClick = (e: React.MouseEvent) => {
        if (dragged()) {
            e.preventDefault()
            e.stopPropagation()
        }
    }

    const onCardTap = (e: React.MouseEvent, slot: number) => {
        e.preventDefault()
        e.stopPropagation()
        if (dragged()) return
        openSheet(slot)
    }

    /* ---- render ---- */
    return (
        <div
            ref={shellRef}
            onPointerDown={onDown}
            style={{
                width: "100%",
                height: "100%",
                background,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                touchAction: "pan-y",
                cursor: dragEnabled ? "grab" : "default",
                boxSizing: "border-box",
                position: "relative",
            }}
        >
            {props.toggleShow ? (
                <div style={anchorStyle(props.togglePlace, props.toggleInset)}>
                    <div
                        ref={segBoxRef}
                        role="group"
                        aria-label={props.toggleLabelGrey}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                            ...pillShell(props),
                            backdropFilter: "blur(14px) saturate(150%)",
                            WebkitBackdropFilter: "blur(14px) saturate(150%)",
                        }}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                zIndex: 0,
                                top: 4,
                                bottom: 4,
                                left: 0,
                                width: pellet.w,
                                transform: `translateX(${pellet.x}px)`,
                                borderRadius: 999,
                                background: props.toggleAccent,
                                boxShadow: "0 1px 2px rgba(16,14,12,0.22)",
                                opacity: pellet.w ? 1 : 0,
                                transition:
                                    "transform 380ms cubic-bezier(0.22,0.61,0.36,1), width 380ms cubic-bezier(0.22,0.61,0.36,1), background 300ms ease",
                            }}
                        />
                        {[false, true].map((wantsGrey) => {
                            const active = greyOn === wantsGrey
                            return (
                                <button
                                    key={String(wantsGrey)}
                                    type="button"
                                    role="radio"
                                    aria-checked={active}
                                    ref={(n) => {
                                        segRefs.current[wantsGrey ? 1 : 0] = n
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setGreyOn(wantsGrey)
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!active)
                                            e.currentTarget.style.opacity =
                                                "0.62"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.opacity = "1"
                                    }}
                                    style={{
                                        ...segmentStyle(active, props),
                                        appearance: "none",
                                        background: "transparent",
                                        border: "none",
                                        font: "inherit",
                                        cursor: "pointer",
                                        opacity: 1,
                                        transition:
                                            "color 260ms ease, opacity 200ms ease",
                                    }}
                                >
                                    {wantsGrey
                                        ? props.toggleLabelGrey
                                        : props.toggleLabelPlain}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ) : null}

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: belt.tallest + labelRoom,
                    paddingLeft: padding,
                    paddingRight: padding,
                    boxSizing: "border-box",
                    ...veilStyle(edgeFade),
                }}
            >
                {placement.map((row, i) => {
                    const href = pickHref(row.card)
                    const still = pickSource(row.card)
                    const clip = row.clip
                    const mediaCommon: React.CSSProperties = {
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transform: "scale(1)",
                        filter: restTone,
                        transition: `transform ${zoomEase}ms cubic-bezier(0.22, 0.61, 0.36, 1), filter ${zoomEase}ms cubic-bezier(0.22, 0.61, 0.36, 1)`,
                        userSelect: "none",
                    }

                    const enterMedia = (ev: React.MouseEvent<HTMLElement>) => {
                        const el = ev.currentTarget as HTMLElement
                        if (hoverZoom !== 1)
                            el.style.transform = `scale(${hoverZoom})`
                        if (greyOn) el.style.filter = "none"
                        if (clip && tuneRef.current.playMode === "hover") {
                            const v = el as HTMLVideoElement
                            v.muted = tuneRef.current.clipMuted !== false
                            const attempt = v.play()
                            if (attempt && typeof attempt.catch === "function")
                                attempt.catch(() => {})
                        }
                    }

                    const leaveMedia = (ev: React.MouseEvent<HTMLElement>) => {
                        const el = ev.currentTarget as HTMLElement
                        el.style.transform = "scale(1)"
                        el.style.filter = restTone
                        if (clip && tuneRef.current.playMode === "hover") {
                            const v = el as HTMLVideoElement
                            try {
                                v.pause()
                                v.currentTime = 0
                            } catch (_) {}
                        }
                    }

                    const body = (
                        <>
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: row.h,
                                    borderRadius: radius,
                                    overflow: "hidden",
                                    background: imageBg,
                                }}
                            >
                                {clip ? (
                                    <video
                                        ref={(n) => {
                                            clipsRef.current[i] = n
                                        }}
                                        src={clip}
                                        poster={still || undefined}
                                        muted={clipMuted !== false}
                                        loop={!!clipLoops}
                                        playsInline
                                        preload="metadata"
                                        onMouseEnter={enterMedia}
                                        onMouseLeave={leaveMedia}
                                        style={mediaCommon}
                                    />
                                ) : still ? (
                                    <img
                                        src={still}
                                        srcSet={pickSrcSet(row.card)}
                                        alt={row.card?.title || ""}
                                        draggable={false}
                                        onMouseEnter={enterMedia}
                                        onMouseLeave={leaveMedia}
                                        style={mediaCommon}
                                    />
                                ) : null}
                                {badgeShow && clip ? (
                                    <div
                                        style={{
                                            ...badgeSeat(badgeSize),
                                            background: badgeFill,
                                            backdropFilter: "blur(8px)",
                                            WebkitBackdropFilter: "blur(8px)",
                                        }}
                                    >
                                        <div
                                            style={badgeGlyph(
                                                badgeSize,
                                                badgeTint
                                            )}
                                        />
                                    </div>
                                ) : null}
                            </div>
                            {row.card?.title ? (
                                <div
                                    ref={i === 0 ? capRef : undefined}
                                    style={captionStyle(props)}
                                >
                                    {row.card.title}
                                </div>
                            ) : null}
                        </>
                    )

                    let shell = body as any
                    if (lightboxLive) {
                        shell = (
                            <div
                                role="button"
                                tabIndex={0}
                                aria-label={row.card?.title || "Open"}
                                onClick={(e) => onCardTap(e, row.slot)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault()
                                        openSheet(row.slot)
                                    }
                                }}
                                style={{ display: "block", cursor: "pointer" }}
                            >
                                {body}
                            </div>
                        )
                    } else if (tapAction === "link" && href) {
                        shell = (
                            <a
                                href={href}
                                onClick={swallowClick}
                                style={{
                                    display: "block",
                                    textDecoration: "none",
                                    color: "inherit",
                                }}
                            >
                                {body}
                            </a>
                        )
                    }

                    return (
                        <div
                            key={row.key}
                            ref={(n) => {
                                nodesRef.current[i] = n
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: padding,
                                width: row.w,
                                transform: `translate3d(${
                                    loopValue(
                                        row.anchor - offsetRef.current + flank,
                                        span
                                    ) - flank
                                }px, 0, 0)`,
                                willChange: "transform",
                            }}
                        >
                            {shell}
                        </div>
                    )
                })}
            </div>

            {sheet.open && list.length ? (
                <Spotlight
                    card={list[sheet.index]}
                    index={sheet.index}
                    count={list.length}
                    onClose={() =>
                        setSheet({ open: false, index: sheet.index })
                    }
                    onStep={stepSheet}
                    p={props}
                />
            ) : null}
        </div>
    )
}

/* ================================================================== */
/* ENTRY                                                               */
/* ================================================================== */

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 560
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Hemline(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillRail {...props} />
    return <DriftRail {...props} />
}

Hemline.defaultProps = {
    cards: seedCards(),
    gap: 28,
    cardScale: 100,
    radius: 0,
    padding: 40,
    edgeFade: 120,
    background: "#ffffff",
    imageBg: "#f2f0ee",
    captionGap: 12,
    captionColor: "#7a7570",
    captionAlign: "left",
    captionCase: "none",
    captionFont: {
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: "0.02em",
        lineHeight: 1.4,
    },
    dragEnabled: true,
    wheelMode: "any",
    wheelStrength: 1,
    glide: 0.93,
    driftSpeed: 0,
    hoverZoom: 1.04,
    zoomEase: 620,
    mono: true,
    monoAmount: 100,
    fitHeight: true,

    playMode: "auto",
    maxPlaying: 3,
    clipMuted: true,
    clipLoops: true,
    badgeShow: true,
    badgeSize: 30,
    badgeFill: "rgba(255, 255, 255, 0.82)",
    badgeTint: "#141210",

    tapAction: "lightbox",
    lightbox: true,
    sheetScrim: "rgba(12, 11, 10, 0.9)",
    sheetBlur: 10,
    sheetRadius: 6,
    sheetTint: "#ffffff",
    sheetArrowInset: 32,
    sheetControl: "rgba(255, 255, 255, 0.1)",
    sheetEdge: "rgba(255, 255, 255, 0.18)",
    sheetCaption: true,
    sheetCounter: true,
    sheetPlays: true,
    sheetMuted: false,
    sheetLoops: true,

    toggleShow: true,
    toggleLabelPlain: "Original",
    toggleLabelGrey: "Greyscale",
    togglePlace: "topLeft",
    toggleInset: 24,
    toggleSurface: "rgba(255, 255, 255, 0.74)",
    toggleBorder: "rgba(16, 14, 12, 0.08)",
    toggleAccent: "#141210",
    toggleText: "rgba(20, 18, 16, 0.62)",
    toggleActiveText: "#ffffff",
}

/**
 * @framerDisableUnlink
 */
addPropertyControls(Hemline, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            buttonTitle: "Card",
            controls: {
                media: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Upload",
                    hidden: (c: any) => c?.media === "video",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    description: "Overrides the upload when filled",
                    hidden: (c: any) => c?.media === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Upload",
                    allowedFileTypes: ["mp4", "webm", "ogg", "mov"],
                    hidden: (c: any) => c?.media !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://….mp4",
                    description: "Overrides the upload when filled",
                    hidden: (c: any) => c?.media !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: (c: any) => c?.media !== "video",
                },
                posterUrl: {
                    type: ControlType.String,
                    title: "Poster URL",
                    placeholder: "https://…",
                    description: "Still frame shown before the clip plays",
                    hidden: (c: any) => c?.media !== "video",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Untitled",
                },
                link: { type: ControlType.Link, title: "CMS Link" },
                width: {
                    type: ControlType.Number,
                    title: "Width",
                    defaultValue: 200,
                    min: 40,
                    max: 900,
                    step: 2,
                    displayStepper: false,
                    unit: "px",
                },
                height: {
                    type: ControlType.Number,
                    title: "Height",
                    defaultValue: 300,
                    min: 40,
                    max: 1400,
                    step: 2,
                    displayStepper: false,
                    unit: "px",
                },
            },
        },
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
    },
    cardScale: {
        type: ControlType.Number,
        title: "Card Scale",
        min: 30,
        max: 300,
        step: 1,
        unit: "%",
        description: "Scales every card's width and height together",
    },
    fitHeight: {
        type: ControlType.Boolean,
        title: "Fit To Frame",
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Holds the tallest card and its title inside the section height",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Inset",
        min: 0,
        max: 200,
        step: 2,
        unit: "px",
    },
    edgeFade: {
        type: ControlType.Number,
        title: "Edge Fade",
        min: 0,
        max: 400,
        step: 4,
        unit: "px",
    },
    background: { type: ControlType.Color, title: "Background" },
    imageBg: { type: ControlType.Color, title: "Card Fill" },

    captionFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    captionColor: { type: ControlType.Color, title: "Title Color" },
    captionGap: {
        type: ControlType.Number,
        title: "Title Gap",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    captionAlign: {
        type: ControlType.Enum,
        title: "Title Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    captionCase: {
        type: ControlType.Enum,
        title: "Title Case",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["As Is", "Upper", "Lower", "Title"],
    },

    dragEnabled: {
        type: ControlType.Boolean,
        title: "Drag",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    wheelMode: {
        type: ControlType.Enum,
        title: "Wheel",
        options: ["any", "lateral", "off"],
        optionTitles: ["Any Axis", "Trackpad X", "Off"],
    },
    wheelStrength: {
        type: ControlType.Number,
        title: "Wheel Speed",
        min: 0.2,
        max: 4,
        step: 0.1,
        hidden: (p: any) => p.wheelMode === "off",
    },
    glide: {
        type: ControlType.Number,
        title: "Glide",
        min: 0.7,
        max: 0.99,
        step: 0.01,
        description: "How long the rail keeps moving after a flick",
    },
    driftSpeed: {
        type: ControlType.Number,
        title: "Auto Drift",
        min: -4,
        max: 4,
        step: 0.1,
        description: "Idle travel per frame — 0 keeps the rail still",
    },

    playMode: {
        type: ControlType.Enum,
        title: "Clip Play",
        options: ["auto", "hover", "off"],
        optionTitles: ["Near Centre", "On Hover", "Poster Only"],
        description: "How video cards behave while they sit on the rail",
    },
    maxPlaying: {
        type: ControlType.Number,
        title: "Clips At Once",
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
        description: "Cap on simultaneous playback, nearest the centre first",
        hidden: (p: any) => p.playMode !== "auto",
    },
    clipMuted: {
        type: ControlType.Boolean,
        title: "Rail Muted",
        enabledTitle: "Muted",
        disabledTitle: "Sound",
        hidden: (p: any) => p.playMode === "off",
    },
    clipLoops: {
        type: ControlType.Boolean,
        title: "Rail Loop",
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p: any) => p.playMode === "off",
    },
    badgeShow: {
        type: ControlType.Boolean,
        title: "Play Badge",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Small marker on cards that hold a clip",
    },
    badgeSize: {
        type: ControlType.Number,
        title: "Badge Size",
        min: 18,
        max: 64,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.badgeShow,
    },
    badgeFill: {
        type: ControlType.Color,
        title: "Badge Fill",
        hidden: (p: any) => !p.badgeShow,
    },
    badgeTint: {
        type: ControlType.Color,
        title: "Badge Mark",
        hidden: (p: any) => !p.badgeShow,
    },

    tapAction: {
        type: ControlType.Enum,
        title: "On Click",
        options: ["lightbox", "link", "none"],
        optionTitles: ["Lightbox", "Open Link", "Nothing"],
    },
    lightbox: {
        type: ControlType.Boolean,
        title: "Lightbox",
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p: any) => p.tapAction !== "lightbox",
    },
    sheetScrim: {
        type: ControlType.Color,
        title: "Sheet Scrim",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetBlur: {
        type: ControlType.Number,
        title: "Sheet Blur",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetRadius: {
        type: ControlType.Number,
        title: "Sheet Radius",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetTint: {
        type: ControlType.Color,
        title: "Sheet Text",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetControl: {
        type: ControlType.Color,
        title: "Button Fill",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetArrowInset: {
        type: ControlType.Number,
        title: "Arrow Inset",
        min: 8,
        max: 120,
        step: 2,
        unit: "px",
        description: "Distance of the side arrows from each screen edge",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetEdge: {
        type: ControlType.Color,
        title: "Button Edge",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetCaption: {
        type: ControlType.Boolean,
        title: "Sheet Title",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetCounter: {
        type: ControlType.Boolean,
        title: "Sheet Count",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetPlays: {
        type: ControlType.Boolean,
        title: "Sheet Autoplay",
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetMuted: {
        type: ControlType.Boolean,
        title: "Sheet Muted",
        enabledTitle: "Muted",
        disabledTitle: "Sound",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },
    sheetLoops: {
        type: ControlType.Boolean,
        title: "Sheet Loop",
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p: any) => p.tapAction !== "lightbox" || !p.lightbox,
    },

    mono: {
        type: ControlType.Boolean,
        title: "Greyscale",
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Cards rest in greyscale and return to full colour on hover",
    },
    monoAmount: {
        type: ControlType.Number,
        title: "Grey Depth",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p: any) => !p.mono,
    },
    toggleShow: {
        type: ControlType.Boolean,
        title: "Grey Buttons",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "On-canvas pair of buttons — colour or greyscale for the whole rail",
    },
    toggleLabelPlain: {
        type: ControlType.String,
        title: "Colour Label",
        hidden: (p: any) => !p.toggleShow,
    },
    toggleLabelGrey: {
        type: ControlType.String,
        title: "Grey Label",
        hidden: (p: any) => !p.toggleShow,
    },
    togglePlace: {
        type: ControlType.Enum,
        title: "Switch Spot",
        options: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
        optionTitles: ["Top Left", "Top Right", "Bottom Left", "Bottom Right"],
        hidden: (p: any) => !p.toggleShow,
    },
    toggleInset: {
        type: ControlType.Number,
        title: "Switch Inset",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
        hidden: (p: any) => !p.toggleShow,
    },
    toggleSurface: {
        type: ControlType.Color,
        title: "Switch Fill",
        hidden: (p: any) => !p.toggleShow,
    },
    toggleBorder: {
        type: ControlType.Color,
        title: "Switch Edge",
        hidden: (p: any) => !p.toggleShow,
    },
    toggleAccent: {
        type: ControlType.Color,
        title: "Active Pill",
        hidden: (p: any) => !p.toggleShow,
    },
    toggleText: {
        type: ControlType.Color,
        title: "Idle Text",
        hidden: (p: any) => !p.toggleShow,
    },
    toggleActiveText: {
        type: ControlType.Color,
        title: "Active Text",
        hidden: (p: any) => !p.toggleShow,
    },

    hoverZoom: {
        type: ControlType.Number,
        title: "Hover Zoom",
        min: 1,
        max: 1.3,
        step: 0.01,
    },
    zoomEase: {
        type: ControlType.Number,
        title: "Hover Ease",
        min: 100,
        max: 1600,
        step: 20,
        unit: "ms",
        hidden: (p: any) => p.hoverZoom === 1 && !p.mono,
    },
})
