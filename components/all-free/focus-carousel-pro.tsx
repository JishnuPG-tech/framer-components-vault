/*
 * Marketplace compliance
 * 1. Static renderer: the exported entry calls useIsStaticRenderer() first and
 *    returns <StillStrip />, built from plain divs, images and paused video
 *    elements — no transitions, animations, blur, listeners, observers, timers
 *    or playback run on the canvas or in exports.
 * 2. Offscreen loop: the live rAF loop starts locked out, re-checks visibility on
 *    every frame (IntersectionObserver + visibilitychange + reduced motion) and
 *    sleeps once settled. Auto advance and video playback obey the same permit,
 *    so nothing runs or plays while the section is out of view.
 */
import * as React from "react"
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
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


type CueStyle = "none" | "corners" | "rule" | "rails" | "outline" | "caret"
type LabelLayout = "edge" | "split" | "inline" | "overlay" | "plate"
type MediaKind = "image" | "video"
type ShowMode = MediaKind | "mixed"

interface Piece {
    kind?: MediaKind
    image?: { src?: string } | string
    imageUrl?: string
    video?: { src?: string } | string
    videoUrl?: string
    title?: string
    caption?: string
    link?: string
}

interface OoProps {
    slides: Piece[]
    mediaToggle: boolean
    startMode: ShowMode
    clipPlay: "focus" | "all"
    imageLabel: string
    videoLabel: string
    toggleAlign: "flex-start" | "center" | "flex-end"
    toggleGap: number
    toggleFont: React.CSSProperties
    toggleTrack: string
    togglePill: string
    toggleInk: string
    toggleInkOn: string
    toggleRadius: number
    togglePad: number
    toggleBtnX: number
    toggleBtnY: number
    cardWidth: number
    cardRatio: number
    slotGap: number
    sideSlots: number
    sideSize: number
    sideTaper: number
    cornerRadius: number
    stagePad: number
    surface: string
    sideGrey: number
    sideDim: number
    sideFade: number
    fadeStep: number
    blurStep: number
    blurMax: number
    cueStyle: CueStyle
    cueTint: string
    cueSize: number
    cueOffset: number
    cueWeight: number
    cueFade: number
    labelOn: boolean
    labelLayout: LabelLayout
    textSide: "left" | "right"
    rowGap: number
    labelGap: number
    revealOn: boolean
    titleFont: React.CSSProperties
    titleTint: string
    metaFont: React.CSSProperties
    metaTint: string
    overlayInk: string
    scrimTint: string
    platePaper: string
    insetPad: number
    plateDrop: number
    wheelMode: "off" | "vertical" | "any"
    wheelStep: number
    dragOn: boolean
    throwCutoff: number
    dragSpan: number
    snapRate: number
    cycleOn: boolean
    cycleWait: number
    tickOn: boolean
    tickLevel: number
    tickTone: number
    style?: React.CSSProperties
}

type ToggleKeys =
    | "mediaToggle"
    | "imageLabel"
    | "videoLabel"
    | "toggleAlign"
    | "toggleGap"
    | "toggleFont"
    | "toggleTrack"
    | "togglePill"
    | "toggleInk"
    | "toggleInkOn"
    | "toggleRadius"
    | "togglePad"
    | "toggleBtnX"
    | "toggleBtnY"

type ToggleGroup = Pick<OoProps, ToggleKeys>

type OoInput = Omit<OoProps, ToggleKeys> & {
    toggle?: Partial<ToggleGroup>
}

const TOGGLE_BASE: ToggleGroup = {
    mediaToggle: true,
    imageLabel: "Image",
    videoLabel: "Video",
    toggleAlign: "center",
    toggleGap: 20,
    toggleFont: {
        fontSize: 13,
        lineHeight: "1.2em",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
    },
    toggleTrack: "#F1F1F1",
    togglePill: "#111111",
    toggleInk: "#6B6B6B",
    toggleInkOn: "#FFFFFF",
    toggleRadius: 100,
    togglePad: 4,
    toggleBtnX: 20,
    toggleBtnY: 9,
}

function withToggle(raw: OoInput): OoProps {
    const group = raw.toggle || {}
    const merged: any = { ...TOGGLE_BASE }
    for (const key of Object.keys(group)) {
        const value = (group as any)[key]
        if (value !== undefined && value !== null) merged[key] = value
    }
    const { toggle, ...rest } = raw
    return { ...rest, ...merged } as OoProps
}

const CORNERS = ["tl", "tr", "bl", "br"] as const
const KINDS: MediaKind[] = ["image", "video"]

function ringIndex(value: number, span: number) {
    return ((value % span) + span) % span
}

function clamp01(v: number) {
    return Math.max(0, Math.min(1, v))
}

function readSource(typedUrl?: string, dropped?: { src?: string } | string) {
    const typed = typeof typedUrl === "string" ? typedUrl.trim() : ""
    if (typed) return typed
    if (!dropped) return ""
    if (typeof dropped === "string") return dropped
    return typeof dropped.src === "string" ? dropped.src : ""
}

function kindOf(piece?: Piece): MediaKind {
    return piece && piece.kind === "video" ? "video" : "image"
}

function resolveArt(piece?: Piece): string {
    if (!piece || kindOf(piece) !== "image") return ""
    return readSource(piece.imageUrl, piece.image)
}

function resolveClip(piece?: Piece): string {
    if (!piece || kindOf(piece) !== "video") return ""
    return readSource(piece.videoUrl, piece.video)
}

function readShow(value?: string): ShowMode {
    return value === "video" || value === "mixed" ? value : "image"
}

function pickDeck(slides: Piece[] | undefined, mode: ShowMode): Piece[] {
    if (!slides || !slides.length) return []
    if (mode === "mixed") return slides.filter((s) => !!s)
    return slides.filter((s) => !!s && kindOf(s) === mode)
}

function emptyNote(slides: Piece[] | undefined, mode: ShowMode) {
    if (!slides || !slides.length || mode === "mixed")
        return "Add slides in the property panel"
    return mode === "video"
        ? "No video slides yet — set a slide's Type to Video"
        : "No image slides yet — set a slide's Type to Image"
}

function splitLines(text?: string): string[] {
    if (!text) return []
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
}

function makeLook(c: {
    w: number
    h: number
    gap: number
    near: number
    taper: number
    fade: number
    fadeStep: number
    blurStep: number
    blurMax: number
    grey: number
    dim: number
    reach: number
}) {
    const taper = Math.min(1, Math.max(0.5, c.taper))
    const flat = taper > 0.999
    const slope = Math.log(taper)
    const firstHop = (c.w * (1 + c.near)) / 2 + c.gap
    const pitch = c.w * c.near + c.gap

    return function at(offset: number) {
        const dist = Math.abs(offset)
        const way = offset < 0 ? -1 : 1
        let ratio: number
        let shift: number

        if (dist <= 1) {
            ratio = 1 + (c.near - 1) * dist
            shift = firstHop * dist
        } else {
            const extra = dist - 1
            if (flat) {
                ratio = c.near
                shift = firstHop + pitch * extra
            } else {
                const shrink = Math.pow(taper, extra)
                ratio = c.near * shrink
                shift =
                    firstHop +
                    c.gap * extra +
                    (c.w * c.near * (shrink - 1)) / slope
            }
        }

        const edge = clamp01(c.reach + 0.5 - dist)
        const base =
            dist <= 1
                ? 1 + (c.fade - 1) * dist
                : c.fade * Math.pow(c.fadeStep, dist - 1)
        const toSide = Math.min(1, dist)

        return {
            w: c.w * ratio,
            h: c.h * ratio,
            x: (Number.isFinite(shift) ? shift : firstHop * dist) * way,
            alpha: clamp01(base * edge),
            grey: c.grey * toSide,
            dim: 1 - (1 - c.dim) * toSide,
            haze: Math.min(c.blurMax, c.blurStep * Math.max(0, dist - 1)),
            depth: 400 - Math.round(dist * 12),
        }
    }
}

type Box = ReturnType<ReturnType<typeof makeLook>>

function paintBox(box: Box): Record<string, string> {
    const tone: string[] = []
    if (box.grey > 0.005) tone.push("grayscale(" + box.grey.toFixed(3) + ")")
    if (box.dim < 0.995) tone.push("brightness(" + box.dim.toFixed(3) + ")")
    if (box.haze > 0.05) tone.push("blur(" + box.haze.toFixed(2) + "px)")
    return {
        width: box.w + "px",
        height: box.h + "px",
        opacity: String(box.alpha),
        zIndex: String(box.depth),
        filter: tone.length ? tone.join(" ") : "none",
        transform: "translate3d(" + box.x + "px, 0, 0) translate(-50%, -50%)",
        visibility: box.alpha <= 0.001 ? "hidden" : "visible",
    }
}

function PlayGlyph() {
    return (
        <div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 0,
                height: 0,
                marginLeft: -6,
                marginTop: -9,
                borderTop: "9px solid transparent",
                borderBottom: "9px solid transparent",
                borderLeft: "15px solid rgba(128,128,128,0.55)",
            }}
        />
    )
}

function FocusCue(props: {
    kind: CueStyle
    size: number
    offset: number
    weight: number
    tint: string
}) {
    const { kind, size, offset, weight, tint } = props

    if (kind === "outline") {
        return (
            <div
                style={{
                    position: "absolute",
                    top: -offset,
                    right: -offset,
                    bottom: -offset,
                    left: -offset,
                    border: weight + "px solid " + tint,
                    borderRadius: size,
                }}
            />
        )
    }

    if (kind === "rails") {
        return (
            <>
                <div
                    style={{
                        position: "absolute",
                        top: -offset,
                        left: -size,
                        right: -size,
                        height: weight,
                        background: tint,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: -offset,
                        left: -size,
                        right: -size,
                        height: weight,
                        background: tint,
                    }}
                />
            </>
        )
    }

    if (kind === "rule") {
        return (
            <>
                <div
                    style={{
                        position: "absolute",
                        bottom: -offset,
                        left: 0,
                        right: 0,
                        height: weight,
                        background: tint,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: -offset - size,
                        left: "50%",
                        marginLeft: -weight / 2,
                        width: weight,
                        height: size,
                        background: tint,
                    }}
                />
            </>
        )
    }

    if (kind === "caret") {
        return (
            <div
                style={{
                    position: "absolute",
                    bottom: -offset - size,
                    left: "50%",
                    marginLeft: -size / 2,
                    width: 0,
                    height: 0,
                    borderLeft: size / 2 + "px solid transparent",
                    borderRight: size / 2 + "px solid transparent",
                    borderBottom: size + "px solid " + tint,
                }}
            />
        )
    }

    if (kind === "corners") {
        return (
            <>
                {CORNERS.map((corner) => {
                    const upper = corner === "tl" || corner === "tr"
                    const leading = corner === "tl" || corner === "bl"
                    return (
                        <div
                            key={corner}
                            style={{
                                position: "absolute",
                                width: size,
                                height: size,
                                top: upper ? -offset : undefined,
                                bottom: upper ? undefined : -offset,
                                left: leading ? -offset : undefined,
                                right: leading ? undefined : -offset,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: leading ? 0 : undefined,
                                    right: leading ? undefined : 0,
                                    width: weight,
                                    height: size,
                                    background: tint,
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: upper ? 0 : undefined,
                                    bottom: upper ? undefined : 0,
                                    height: weight,
                                    width: size,
                                    background: tint,
                                }}
                            />
                        </div>
                    )
                })}
            </>
        )
    }

    return null
}

/* ───────────────────────── static (canvas / export) ───────────────────────── */

function StillToggle(props: { p: OoProps; mode: MediaKind }) {
    const { p, mode } = props
    const pad = p.togglePad
    return (
        <div
            style={{
                width: "100%",
                flex: "0 0 auto",
                display: "flex",
                justifyContent: p.toggleAlign,
                marginBottom: p.toggleGap,
                position: "relative",
                zIndex: 700,
            }}
        >
            <div
                style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    padding: pad,
                    background: p.toggleTrack,
                    borderRadius: p.toggleRadius,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: pad,
                        bottom: pad,
                        left: pad,
                        width: "calc((100% - " + pad * 2 + "px) / 2)",
                        borderRadius: Math.max(0, p.toggleRadius - pad),
                        background: p.togglePill,
                        transform:
                            mode === "video" ? "translateX(100%)" : "none",
                    }}
                />
                {KINDS.map((k) => (
                    <div
                        key={k}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            padding: p.toggleBtnY + "px " + p.toggleBtnX + "px",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                            ...p.toggleFont,
                            color: k === mode ? p.toggleInkOn : p.toggleInk,
                        }}
                    >
                        {k === "image" ? p.imageLabel : p.videoLabel}
                    </div>
                ))}
            </div>
        </div>
    )
}

function StillLabels(props: { p: OoProps; piece?: Piece }) {
    const { p, piece } = props
    const layout = p.labelLayout
    const lines = splitLines(piece?.caption)
    const title = piece?.title || ""
    const lead = p.textSide === "right" ? "flex-end" : "flex-start"
    const trail = p.textSide === "right" ? "flex-start" : "flex-end"
    const overlay = layout === "overlay"
    const inkTitle = overlay ? p.overlayInk : p.titleTint
    const inkMeta = overlay ? p.overlayInk : p.metaTint

    const text = (key: string, content: string, look: React.CSSProperties) => (
        <span key={key} style={{ display: "block", margin: 0, ...look }}>
            {content}
        </span>
    )

    const titleEl = title
        ? text("t", title, { ...p.titleFont, color: inkTitle })
        : null
    const captionEls = lines.map((line, i) =>
        text("c" + i, line, { ...p.metaFont, color: inkMeta })
    )

    if (layout === "overlay") {
        return (
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: p.cornerRadius,
                    overflow: "hidden",
                    padding: p.insetPad,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: lead,
                    textAlign: p.textSide,
                    gap: 2,
                    background:
                        "linear-gradient(to top, " +
                        p.scrimTint +
                        " 0%, rgba(0,0,0,0) 58%)",
                }}
            >
                {titleEl}
                {captionEls}
            </div>
        )
    }

    if (layout === "plate") {
        return (
            <div
                style={{
                    position: "absolute",
                    top: "100%",
                    marginTop: -p.plateDrop,
                    left: p.textSide === "left" ? 0 : undefined,
                    right: p.textSide === "right" ? 0 : undefined,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    background: p.platePaper,
                    padding: p.insetPad + "px " + p.insetPad * 1.3 + "px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: lead,
                    textAlign: p.textSide,
                    gap: 2,
                }}
            >
                {titleEl}
                {captionEls}
            </div>
        )
    }

    if (layout === "inline") {
        const joined = lines.join(" / ")
        return (
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "100%",
                    marginTop: p.labelGap,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    justifyContent: lead,
                    gap: p.rowGap,
                }}
            >
                {titleEl}
                {joined
                    ? text("c", joined, { ...p.metaFont, color: inkMeta })
                    : null}
            </div>
        )
    }

    if (layout === "split") {
        const flip = p.textSide === "right"
        return (
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "100%",
                    marginTop: p.labelGap,
                    display: "flex",
                    flexDirection: flip ? "row-reverse" : "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: p.rowGap,
                }}
            >
                <div style={{ textAlign: flip ? "right" : "left" }}>
                    {titleEl}
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: trail,
                        textAlign: flip ? "left" : "right",
                    }}
                >
                    {captionEls}
                </div>
            </div>
        )
    }

    return titleEl || captionEls.length ? (
        <div
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "100%",
                marginTop: p.labelGap,
                display: "flex",
                flexDirection: "column",
                alignItems: lead,
                textAlign: p.textSide,
                gap: p.rowGap,
            }}
        >
            {titleEl}
            {captionEls.length ? <div>{captionEls}</div> : null}
        </div>
    ) : null
}

function StillStrip(props: OoProps) {
    const {
        slides,
        startMode,
        mediaToggle,
        cardWidth,
        cardRatio,
        slotGap,
        sideSlots,
        sideSize,
        sideTaper,
        sideGrey,
        sideDim,
        sideFade,
        fadeStep,
        cornerRadius,
        stagePad,
        surface,
        cueStyle,
        cueTint,
        cueSize,
        cueOffset,
        cueWeight,
        labelOn,
        metaFont,
        metaTint,
        style,
    } = props

    const mode = readShow(startMode)
    const deck = pickDeck(slides, mode)
    const span = deck.length
    const cardHeight = cardWidth / Math.max(0.2, cardRatio)
    const at = makeLook({
        w: cardWidth,
        h: cardHeight,
        gap: slotGap,
        near: sideSize,
        taper: sideTaper,
        fade: sideFade,
        fadeStep,
        blurStep: 0,
        blurMax: 0,
        grey: sideGrey,
        dim: sideDim,
        reach: sideSlots,
    })

    const cells: number[] = []
    if (span) for (let k = -sideSlots; k <= sideSlots; k++) cells.push(k)

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: stagePad,
                background: surface,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            {mediaToggle && mode !== "mixed" ? (
                <StillToggle p={props} mode={mode} />
            ) : null}

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    flex: "1 1 auto",
                    minHeight: 0,
                }}
            >
                {!span ? (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            ...metaFont,
                            color: metaTint,
                        }}
                    >
                        {emptyNote(slides, mode)}
                    </div>
                ) : null}

                {cells.map((k) => {
                    const box = at(k)
                    if (box.alpha <= 0) return null
                    const entry = deck[ringIndex(k, Math.max(1, span))]
                    const art = resolveArt(entry)
                    const clip = resolveClip(entry)
                    const tone: string[] = []
                    if (box.grey > 0.005)
                        tone.push("grayscale(" + box.grey + ")")
                    if (box.dim < 0.995)
                        tone.push("brightness(" + box.dim + ")")
                    const still = clip
                        ? clip.indexOf("#") === -1
                            ? clip + "#t=0.1"
                            : clip
                        : ""
                    return (
                        <div
                            key={k}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: box.w,
                                height: box.h,
                                marginLeft: box.x - box.w / 2,
                                marginTop: -box.h / 2,
                                opacity: box.alpha,
                                zIndex: box.depth,
                                borderRadius: cornerRadius,
                                overflow: "hidden",
                                background: "rgba(128,128,128,0.16)",
                                filter: tone.length ? tone.join(" ") : "none",
                            }}
                        >
                            {art ? (
                                <img
                                    src={art}
                                    alt=""
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : still ? (
                                <video
                                    src={still}
                                    muted
                                    playsInline
                                    autoPlay={false}
                                    preload="metadata"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            ) : kindOf(entry) === "video" ? (
                                <PlayGlyph />
                            ) : null}
                        </div>
                    )
                })}

                {span && cueStyle !== "none" ? (
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: cardWidth,
                            height: cardHeight,
                            marginLeft: -cardWidth / 2,
                            marginTop: -cardHeight / 2,
                            zIndex: 500,
                        }}
                    >
                        <FocusCue
                            kind={cueStyle}
                            size={cueSize}
                            offset={cueOffset}
                            weight={cueWeight}
                            tint={cueTint}
                        />
                    </div>
                ) : null}

                {labelOn && span ? (
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: cardWidth,
                            height: cardHeight,
                            marginLeft: -cardWidth / 2,
                            marginTop: -cardHeight / 2,
                            zIndex: 600,
                        }}
                    >
                        <StillLabels p={props} piece={deck[0]} />
                    </div>
                ) : null}
            </div>
        </div>
    )
}

/* ───────────────────────────── live (preview / site) ───────────────────────────── */

function LiveToggle(props: {
    p: OoProps
    mode: MediaKind
    scope: string
    onPick: (k: MediaKind) => void
}) {
    const { p, mode, scope, onPick } = props
    const pad = p.togglePad
    return (
        <div
            style={{
                width: "100%",
                flex: "0 0 auto",
                display: "flex",
                justifyContent: p.toggleAlign,
                marginBottom: p.toggleGap,
                position: "relative",
                zIndex: 700,
            }}
        >
            <div
                role="radiogroup"
                aria-label="Media type"
                style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    padding: pad,
                    background: p.toggleTrack,
                    borderRadius: p.toggleRadius,
                }}
            >
                <div
                    aria-hidden="true"
                    className={scope + "-pill"}
                    style={{
                        position: "absolute",
                        top: pad,
                        bottom: pad,
                        left: pad,
                        width: "calc((100% - " + pad * 2 + "px) / 2)",
                        borderRadius: Math.max(0, p.toggleRadius - pad),
                        background: p.togglePill,
                        transform:
                            mode === "video" ? "translateX(100%)" : "none",
                    }}
                />
                {KINDS.map((k) => {
                    const on = k === mode
                    return (
                        <button
                            key={k}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            className={scope + "-seg"}
                            onClick={() => onPick(k)}
                            style={{
                                position: "relative",
                                zIndex: 1,
                                appearance: "none",
                                WebkitAppearance: "none",
                                border: 0,
                                margin: 0,
                                background: "transparent",
                                cursor: on ? "default" : "pointer",
                                padding:
                                    p.toggleBtnY + "px " + p.toggleBtnX + "px",
                                textAlign: "center",
                                whiteSpace: "nowrap",
                                ...p.toggleFont,
                                color: on ? p.toggleInkOn : p.toggleInk,
                            }}
                        >
                            {k === "image" ? p.imageLabel : p.videoLabel}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function LiveLabels(props: {
    p: OoProps
    piece?: Piece
    scope: string
    botRef: React.MutableRefObject<HTMLDivElement | null>
}) {
    const { p, piece, scope, botRef } = props
    const layout = p.labelLayout
    const lines = splitLines(piece?.caption)
    const title = piece?.title || ""
    const lead = p.textSide === "right" ? "flex-end" : "flex-start"
    const trail = p.textSide === "right" ? "flex-start" : "flex-end"
    const overlay = layout === "overlay"
    const inkTitle = overlay ? p.overlayInk : p.titleTint
    const inkMeta = overlay ? p.overlayInk : p.metaTint

    const rise = (
        key: string,
        order: number,
        content: string,
        look: React.CSSProperties
    ) => {
        if (!p.revealOn) {
            return (
                <span
                    key={key}
                    style={{ display: "block", margin: 0, ...look }}
                >
                    {content}
                </span>
            )
        }
        return (
            <span
                key={key}
                style={{
                    display: "block",
                    overflow: "hidden",
                    margin: 0,
                    ...look,
                }}
            >
                <span
                    className={scope + "-rise"}
                    style={{
                        display: "block",
                        animationDelay: order * 70 + "ms",
                    }}
                >
                    {content}
                </span>
            </span>
        )
    }

    const titleEl = title
        ? rise("t", 0, title, { ...p.titleFont, color: inkTitle })
        : null
    const captionEls = lines.map((line, i) =>
        rise("c" + i, 1 + i, line, { ...p.metaFont, color: inkMeta })
    )

    if (layout === "overlay") {
        return (
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: p.cornerRadius,
                    overflow: "hidden",
                    padding: p.insetPad,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: lead,
                    textAlign: p.textSide,
                    gap: 2,
                    background:
                        "linear-gradient(to top, " +
                        p.scrimTint +
                        " 0%, rgba(0,0,0,0) 58%)",
                }}
            >
                {titleEl}
                {captionEls}
            </div>
        )
    }

    if (layout === "plate") {
        return (
            <div
                ref={botRef}
                className={p.revealOn ? scope + "-plate" : undefined}
                style={{
                    position: "absolute",
                    top: "100%",
                    marginTop: -p.plateDrop,
                    left: p.textSide === "left" ? 0 : undefined,
                    right: p.textSide === "right" ? 0 : undefined,
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    background: p.platePaper,
                    padding: p.insetPad + "px " + p.insetPad * 1.3 + "px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: lead,
                    textAlign: p.textSide,
                    gap: 2,
                }}
            >
                {titleEl}
                {captionEls}
            </div>
        )
    }

    if (layout === "inline") {
        const joined = lines.join(" / ")
        return (
            <div
                ref={botRef}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "100%",
                    marginTop: p.labelGap,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    justifyContent: lead,
                    gap: p.rowGap,
                }}
            >
                {titleEl}
                {joined
                    ? rise("c", 1, joined, { ...p.metaFont, color: inkMeta })
                    : null}
            </div>
        )
    }

    if (layout === "split") {
        const flip = p.textSide === "right"
        return (
            <div
                ref={botRef}
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "100%",
                    marginTop: p.labelGap,
                    display: "flex",
                    flexDirection: flip ? "row-reverse" : "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: p.rowGap,
                }}
            >
                <div style={{ textAlign: flip ? "right" : "left" }}>
                    {titleEl}
                </div>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: trail,
                        textAlign: flip ? "left" : "right",
                    }}
                >
                    {captionEls}
                </div>
            </div>
        )
    }

    return titleEl || captionEls.length ? (
        <div
            ref={botRef}
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "100%",
                marginTop: p.labelGap,
                display: "flex",
                flexDirection: "column",
                alignItems: lead,
                textAlign: p.textSide,
                gap: p.rowGap,
            }}
        >
            {titleEl}
            {captionEls.length ? <div>{captionEls}</div> : null}
        </div>
    ) : null
}

function LiveStrip(props: OoProps) {
    const {
        slides,
        startMode,
        mediaToggle,
        cardWidth,
        cardRatio,
        sideSlots,
        cornerRadius,
        stagePad,
        surface,
        cueStyle,
        cueTint,
        cueSize,
        cueOffset,
        cueWeight,
        labelOn,
        metaFont,
        metaTint,
        style,
    } = props

    const scope = "oo" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const [mode, setMode] = useState<ShowMode>(readShow(startMode))
    useEffect(() => {
        setMode(readShow(startMode))
    }, [startMode])

    const deck = useMemo(() => pickDeck(slides, mode), [slides, mode])
    const span = deck.length

    const live = useRef(props)
    live.current = props

    const shellRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const cueRef = useRef<HTMLDivElement | null>(null)
    const labelRef = useRef<HTMLDivElement | null>(null)
    const botRowRef = useRef<HTMLDivElement | null>(null)
    const gaugeRef = useRef<() => void>(() => {})
    const cellRefs = useRef(new Map<number, HTMLDivElement>())
    const clipRefs = useRef(new Map<number, HTMLVideoElement>())

    const [focus, setFocus] = useState(0)
    const focusRef = useRef(0)
    const [fit, setFit] = useState(1)
    const fitRef = useRef(1)
    const [warm, setWarm] = useState(false)

    const drive = useRef({
        pos: 0,
        vel: 0,
        aim: 0 as number | null,
        stiff: 200,
        held: false,
        moved: false,
        grabX: 0,
        grabPos: 0,
        trail: [] as Array<{ x: number; t: number }>,
        clock: 0,
        hover: false,
    })

    const allowed = useRef(false)
    const stilled = useRef(false)
    const beat = useRef(0)
    const lastKnock = useRef(0)
    const audio = useRef<{
        ctx: AudioContext | null
        grain: AudioBuffer | null
    }>({ ctx: null, grain: null })

    const readLook = useCallback(() => {
        const p = live.current
        const scale = fitRef.current
        const base = p.cardWidth * scale
        return makeLook({
            w: base,
            h: base / Math.max(0.2, p.cardRatio),
            gap: p.slotGap * scale,
            near: p.sideSize,
            taper: p.sideTaper,
            fade: p.sideFade,
            fadeStep: p.fadeStep,
            blurStep: p.blurStep,
            blurMax: p.blurMax,
            grey: p.sideGrey,
            dim: p.sideDim,
            reach: p.sideSlots,
        })
    }, [])

    const apply = useCallback(() => {
        const at = readLook()
        const pos = drive.current.pos
        cellRefs.current.forEach((node, index) => {
            Object.assign(node.style, paintBox(at(index - pos)))
        })

        const off = Math.abs(pos - Math.round(pos))

        const cue = cueRef.current
        if (cue) {
            const give = live.current.cueFade
            cue.style.transform =
                "translate(-50%, -50%) scale(" + (1 - off * 0.3 * give) + ")"
            cue.style.opacity = String(1 - off * 0.9 * give)
        }

        const labels = labelRef.current
        if (labels) labels.style.opacity = String(1 - Math.min(1, off * 2.4))
    }, [readLook])

    const syncClips = useCallback(() => {
        const p = live.current
        const ok = allowed.current && !stilled.current
        const at = readLook()
        const pos = drive.current.pos
        const centre = Math.round(pos)
        clipRefs.current.forEach((clip, index) => {
            const seen = at(index - pos).alpha > 0.02
            const want =
                ok && seen && (p.clipPlay === "all" || index === centre)
            if (want) {
                if (clip.paused) {
                    const run = clip.play()
                    if (run && typeof run.catch === "function")
                        run.catch(() => {})
                }
            } else if (!clip.paused) {
                clip.pause()
            }
        })
    }, [readLook])

    const armAudio = useCallback(() => {
        if (!live.current.tickOn || audio.current.ctx) return
        try {
            const Maker =
                (window as any).AudioContext ||
                (window as any).webkitAudioContext
            if (!Maker) return
            const ctx: AudioContext = new Maker()
            const count = Math.floor(ctx.sampleRate * 0.09)
            const grain = ctx.createBuffer(1, count, ctx.sampleRate)
            const wave = grain.getChannelData(0)
            for (let i = 0; i < count; i++) {
                wave[i] = (Math.random() * 2 - 1) * (1 - i / count)
            }
            audio.current.ctx = ctx
            audio.current.grain = grain
            if (ctx.state === "suspended") ctx.resume().catch(() => {})
        } catch {}
    }, [])

    const knock = useCallback(() => {
        const p = live.current
        if (!p.tickOn) return
        const ctx = audio.current.ctx
        const grain = audio.current.grain
        if (!ctx || !grain || ctx.state !== "running") return
        const now = ctx.currentTime
        if (now - lastKnock.current < 0.03) return
        lastKnock.current = now
        try {
            const source = ctx.createBufferSource()
            source.buffer = grain
            const shape = ctx.createBiquadFilter()
            shape.type = "bandpass"
            shape.frequency.value = p.tickTone
            shape.Q.value = 4.5
            const level = ctx.createGain()
            level.gain.setValueAtTime(Math.max(0.0001, p.tickLevel), now)
            level.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
            source.connect(shape)
            shape.connect(level)
            level.connect(ctx.destination)
            source.start(now)
            source.stop(now + 0.07)
        } catch {}
    }, [])

    const halt = useCallback(() => {
        if (beat.current) cancelAnimationFrame(beat.current)
        beat.current = 0
    }, [])

    const frame = useCallback(
        (stamp: number) => {
            beat.current = 0
            const m = drive.current

            if (!allowed.current) {
                m.vel = 0
                m.held = false
                m.trail.length = 0
                m.aim = Math.round(m.pos)
                m.pos = m.aim
                apply()
                return
            }

            const dt = m.clock
                ? Math.min(0.05, (stamp - m.clock) / 1000)
                : 1 / 60
            m.clock = stamp

            if (!m.held) {
                if (stilled.current) {
                    m.pos = m.aim === null ? Math.round(m.pos) : m.aim
                    m.aim = m.pos
                    m.vel = 0
                } else if (m.aim === null) {
                    m.vel *= Math.pow(0.955, dt * 60)
                    m.pos += m.vel * dt
                    if (Math.abs(m.vel) < 0.75) {
                        m.aim = Math.round(m.pos + m.vel * 0.2)
                        m.stiff = live.current.snapRate * 24 + 80
                    }
                } else {
                    const brake = 2 * Math.sqrt(m.stiff)
                    const force = -m.stiff * (m.pos - m.aim) - brake * m.vel
                    m.vel += force * dt
                    m.pos += m.vel * dt
                }
            }

            const landed = Math.round(m.pos)
            if (landed !== focusRef.current) {
                focusRef.current = landed
                setFocus(landed)
                knock()
            }

            const done =
                !m.held &&
                m.aim !== null &&
                Math.abs(m.vel) < 0.02 &&
                Math.abs(m.pos - m.aim) < 0.0015

            if (done) {
                m.pos = m.aim as number
                m.vel = 0
                m.clock = 0
                apply()
                return
            }

            apply()
            beat.current = requestAnimationFrame(frame)
        },
        [apply, knock]
    )

    const wake = useCallback(() => {
        if (beat.current || !allowed.current) return
        drive.current.clock = 0
        beat.current = requestAnimationFrame(frame)
    }, [frame])

    const glideTo = useCallback(
        (target: number, brisk: boolean) => {
            const m = drive.current
            m.aim = target
            m.stiff = brisk ? live.current.snapRate * 40 + 200 : 120
            wake()
        },
        [wake]
    )

    useEffect(() => {
        const node = shellRef.current
        if (!node) return

        let seen = true
        let open = true
        let quiet = false

        const query =
            typeof window !== "undefined" && window.matchMedia
                ? window.matchMedia("(prefers-reduced-motion: reduce)")
                : null
        quiet = !!query?.matches

        const review = () => {
            stilled.current = quiet
            const ok = seen && open
            allowed.current = ok
            if (ok) setWarm(true)
            if (!ok) {
                halt()
                const m = drive.current
                m.vel = 0
                m.held = false
                m.trail.length = 0
                m.aim = Math.round(m.pos)
                m.pos = m.aim
                focusRef.current = m.pos
                setFocus(m.pos)
                apply()
            } else if (quiet) {
                const m = drive.current
                m.vel = 0
                m.pos = m.aim === null ? Math.round(m.pos) : m.aim
                m.aim = m.pos
                apply()
            } else {
                wake()
            }
            syncClips()
        }

        let watcher: IntersectionObserver | null = null
        if (typeof IntersectionObserver !== "undefined") {
            seen = false
            watcher = new IntersectionObserver(
                (entries) => {
                    seen = entries.some((entry) => entry.isIntersecting)
                    review()
                },
                { threshold: 0.01 }
            )
            watcher.observe(node)
        }

        const onTab = () => {
            open = document.visibilityState !== "hidden"
            review()
        }
        const onQuiet = (e: MediaQueryListEvent) => {
            quiet = e.matches
            review()
        }

        document.addEventListener("visibilitychange", onTab)
        query?.addEventListener?.("change", onQuiet)
        review()

        return () => {
            watcher?.disconnect()
            document.removeEventListener("visibilitychange", onTab)
            query?.removeEventListener?.("change", onQuiet)
            halt()
            allowed.current = false
            clipRefs.current.forEach((clip) => {
                try {
                    clip.pause()
                } catch {}
            })
        }
    }, [halt, apply, wake, syncClips])

    useEffect(() => {
        const node = stageRef.current
        if (!node) return

        const gauge = () => {
            const p = live.current
            const boxW = node.clientWidth
            const boxH = node.clientHeight
            if (!boxW || !boxH) return
            const tall = p.cardWidth / Math.max(0.2, p.cardRatio)
            const below = botRowRef.current?.offsetHeight || 0
            let reserve = 0
            if (p.labelOn) {
                if (p.labelLayout === "plate") {
                    reserve = Math.max(0, below - p.plateDrop)
                } else if (p.labelLayout !== "overlay") {
                    reserve = below > 0 ? below + p.labelGap : 0
                }
            }
            const room = Math.max(60, boxH - 2 * reserve)
            const next = Math.max(
                0.2,
                Math.min(1, boxW / p.cardWidth, room / tall)
            )
            if (Math.abs(next - fitRef.current) > 0.002) {
                fitRef.current = next
                setFit(next)
                apply()
            }
        }

        gaugeRef.current = gauge
        gauge()
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", gauge)
            return () => window.removeEventListener("resize", gauge)
        }
        const sizer = new ResizeObserver(gauge)
        sizer.observe(node)
        return () => sizer.disconnect()
    }, [apply])

    // switching between Image and Video restarts the strip on its first card
    useLayoutEffect(() => {
        halt()
        const m = drive.current
        m.pos = 0
        m.vel = 0
        m.aim = 0
        m.held = false
        m.moved = false
        m.trail.length = 0
        focusRef.current = 0
        setFocus(0)
    }, [mode, halt])

    useLayoutEffect(() => {
        gaugeRef.current()
        apply()
    })

    useEffect(() => {
        syncClips()
    }, [focus, mode, span, props.clipPlay, syncClips])

    useEffect(() => {
        const node = stageRef.current
        if (!node) return
        let pooled = 0
        let thrown = false
        let cooldown = 0

        const onWheel = (e: WheelEvent) => {
            const p = live.current
            if (p.wheelMode === "off" || !allowed.current || span < 2) return

            const boost = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
            const dx = e.deltaX * boost
            const dy = e.deltaY * boost

            let push: number
            if (p.wheelMode === "vertical") {
                if (Math.abs(dy) < 1) return
                push = dy
            } else {
                push = Math.abs(dx) > Math.abs(dy) ? dx : dy
            }
            if (!push) return
            e.preventDefault()
            armAudio()

            if (Math.abs(push) >= p.throwCutoff) {
                thrown = true
                window.clearTimeout(cooldown)
                cooldown = window.setTimeout(() => {
                    thrown = false
                    pooled = 0
                }, 320)
            }

            const m = drive.current
            if (thrown) {
                m.aim = null
                m.vel = Math.max(-26, Math.min(26, m.vel + push * 0.06))
                wake()
            } else {
                pooled += push
                if (Math.abs(pooled) >= p.wheelStep) {
                    const way = pooled > 0 ? 1 : -1
                    pooled -= way * p.wheelStep
                    const from = m.aim === null ? Math.round(m.pos) : m.aim
                    glideTo(from + way, true)
                }
            }
        }

        node.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            node.removeEventListener("wheel", onWheel)
            window.clearTimeout(cooldown)
        }
    }, [wake, glideTo, armAudio, span])

    const onDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.pointerType === "mouse" && e.button !== 0) return
            if (!allowed.current || span < 2) return
            armAudio()
            const m = drive.current
            m.held = true
            m.moved = false
            m.grabX = e.clientX
            m.grabPos = m.pos
            m.vel = 0
            m.aim = null
            m.trail = [{ x: e.clientX, t: e.timeStamp }]
            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch {}
            wake()
        },
        [wake, armAudio, span]
    )

    const onMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const m = drive.current
            if (!m.held || !live.current.dragOn) return
            const dx = e.clientX - m.grabX
            if (!m.moved && Math.abs(dx) > 4) m.moved = true
            const reach = Math.max(40, live.current.dragSpan * fitRef.current)
            m.pos = m.grabPos - dx / reach
            m.trail.push({ x: e.clientX, t: e.timeStamp })
            while (m.trail.length > 2 && e.timeStamp - m.trail[0].t > 110) {
                m.trail.shift()
            }
            wake()
        },
        [wake]
    )

    const onUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const m = drive.current
            if (!m.held) return
            m.held = false
            try {
                e.currentTarget.releasePointerCapture(e.pointerId)
            } catch {}

            if (!m.moved) {
                const stage = stageRef.current
                if (stage) {
                    const rect = stage.getBoundingClientRect()
                    const relX = e.clientX - (rect.left + rect.width / 2)
                    const at = readLook()
                    const middle = Math.round(m.pos)
                    let pick: number | null = null
                    let closest = Infinity
                    for (
                        let s = middle - live.current.sideSlots;
                        s <= middle + live.current.sideSlots;
                        s++
                    ) {
                        const box = at(s - m.pos)
                        if (box.alpha <= 0.02) continue
                        const away = Math.abs(relX - box.x)
                        if (away <= box.w / 2 + 6 && away < closest) {
                            closest = away
                            pick = s
                        }
                    }
                    if (pick !== null && pick !== middle) {
                        glideTo(pick, false)
                        return
                    }
                    if (pick === middle) {
                        const href =
                            deck[ringIndex(middle, Math.max(1, span))]?.link
                        if (href) {
                            window.open(href, "_blank", "noopener,noreferrer")
                            return
                        }
                    }
                }
                m.aim = Math.round(m.pos)
                m.stiff = live.current.snapRate * 40 + 200
                wake()
                return
            }

            const trail = m.trail
            let hurl = 0
            if (trail.length >= 2) {
                const head = trail[0]
                const tail = trail[trail.length - 1]
                const gap = tail.t - head.t
                if (gap > 0) {
                    const reach = Math.max(
                        40,
                        live.current.dragSpan * fitRef.current
                    )
                    hurl = (-(tail.x - head.x) / reach) * (1000 / gap)
                }
            }
            m.trail.length = 0
            m.vel = Math.max(-26, Math.min(26, hurl))
            m.aim = Math.abs(m.vel) < 0.75 ? Math.round(m.pos) : null
            if (m.aim !== null) m.stiff = live.current.snapRate * 40 + 200
            wake()
        },
        [readLook, wake, glideTo, deck, span]
    )

    const onKey = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (span < 2) return
            const m = drive.current
            const from = m.aim === null ? Math.round(m.pos) : m.aim
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                armAudio()
                glideTo(from + 1, true)
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                armAudio()
                glideTo(from - 1, true)
            }
        },
        [glideTo, armAudio, span]
    )

    const pickMode = useCallback((k: MediaKind) => {
        setMode((prev) => (prev === k ? prev : k))
    }, [])

    useEffect(() => {
        if (!props.cycleOn || span < 2) return
        const timer = window.setInterval(
            () => {
                const m = drive.current
                if (!allowed.current || m.held || m.hover) return
                const from = m.aim === null ? Math.round(m.pos) : m.aim
                glideTo(from + 1, true)
            },
            Math.max(800, props.cycleWait * 1000)
        )
        return () => window.clearInterval(timer)
    }, [props.cycleOn, props.cycleWait, glideTo, span])

    useEffect(() => {
        return () => {
            const ctx = audio.current.ctx
            audio.current.ctx = null
            audio.current.grain = null
            ctx?.close().catch(() => {})
        }
    }, [])

    // once the section has been seen, Image and Video both stay mounted: the
    // standby side waits parked on its first cards with its videos buffering
    const layers: ShowMode[] =
        mediaToggle && mode !== "mixed"
            ? KINDS.filter((k) => k === mode || warm)
            : [mode]
    const standbyLook = readLook()

    const showing = span ? deck[ringIndex(focus, span)] : undefined
    const liveW = cardWidth * fit
    const liveH = liveW / Math.max(0.2, cardRatio)

    return (
        <div
            ref={shellRef}
            role="region"
            aria-label={
                mode === "video"
                    ? "Video strip"
                    : mode === "mixed"
                      ? "Media strip"
                      : "Image strip"
            }
            aria-roledescription="carousel"
            tabIndex={0}
            onKeyDown={onKey}
            onMouseEnter={() => {
                drive.current.hover = true
            }}
            onMouseLeave={() => {
                drive.current.hover = false
            }}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: stagePad,
                background: surface,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                outline: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <style>{`
                @keyframes ${scope}-up {
                    from { transform: translateY(105%); }
                    to   { transform: translateY(0); }
                }
                @keyframes ${scope}-drop {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes ${scope}-in {
                    from { opacity: 0; transform: scale(0.985); }
                    to   { opacity: 1; transform: scale(1); }
                }
                .${scope}-rise { animation: ${scope}-up 560ms cubic-bezier(0.19,0.8,0.24,1) both; }
                .${scope}-plate { animation: ${scope}-drop 420ms cubic-bezier(0.19,0.8,0.24,1) both; }
                .${scope}-layer[data-on="1"] { animation: ${scope}-in 420ms cubic-bezier(0.19,0.8,0.24,1) both; }
                .${scope}-clip { transition: opacity 260ms ease; }
                .${scope}-pill { transition: transform 420ms cubic-bezier(0.22,0.9,0.25,1); }
                .${scope}-seg { transition: color 280ms ease, opacity 200ms ease; }
                .${scope}-seg:hover { opacity: 0.85; }
                .${scope}-seg:focus-visible { outline: 2px solid currentColor; outline-offset: -4px; border-radius: inherit; }
                .${scope}-cell img, .${scope}-cell video { -webkit-user-drag: none; }
                @media (prefers-reduced-motion: reduce) {
                    .${scope}-rise, .${scope}-plate, .${scope}-layer { animation: none !important; }
                    .${scope}-clip { transition: none; }
                    .${scope}-pill, .${scope}-seg { transition: none; }
                }
            `}</style>

            {mediaToggle && mode !== "mixed" ? (
                <LiveToggle
                    p={props}
                    mode={mode}
                    scope={scope}
                    onPick={pickMode}
                />
            ) : null}

            <div
                ref={stageRef}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onDragStart={(e) => e.preventDefault()}
                style={{
                    position: "relative",
                    width: "100%",
                    flex: "1 1 auto",
                    minHeight: 0,
                    touchAction: "pan-y",
                    cursor: props.dragOn && span > 1 ? "grab" : "default",
                }}
            >
                {!span ? (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            ...metaFont,
                            color: metaTint,
                        }}
                    >
                        {emptyNote(slides, mode)}
                    </div>
                ) : null}

                {layers.map((layer) => {
                    const on = layer === mode
                    const layerDeck = on ? deck : pickDeck(slides, layer)
                    const n = layerDeck.length
                    const centre = on ? focus : 0
                    const slots: number[] = []
                    if (n) {
                        for (
                            let s = centre - sideSlots;
                            s <= centre + sideSlots;
                            s++
                        )
                            slots.push(s)
                    }
                    return (
                        <div
                            key={"layer-" + layer}
                            className={scope + "-layer"}
                            data-on={on ? "1" : "0"}
                            aria-hidden={on ? undefined : true}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                pointerEvents: "none",
                                opacity: on ? 1 : 0,
                                visibility: on ? "visible" : "hidden",
                            }}
                        >
                            {slots.map((index) => {
                                const entry = layerDeck[ringIndex(index, n)]
                                const art = resolveArt(entry)
                                const clip = resolveClip(entry)
                                const near = Math.abs(index - centre) <= 2
                                const parked = on
                                    ? {}
                                    : (paintBox(
                                          standbyLook(index)
                                      ) as React.CSSProperties)
                                return (
                                    <div
                                        key={index}
                                        className={scope + "-cell"}
                                        ref={(node) => {
                                            if (!on) return
                                            if (node)
                                                cellRefs.current.set(
                                                    index,
                                                    node
                                                )
                                            else cellRefs.current.delete(index)
                                        }}
                                        style={{
                                            position: "absolute",
                                            left: "50%",
                                            top: "50%",
                                            borderRadius: cornerRadius,
                                            overflow: "hidden",
                                            background:
                                                "rgba(128,128,128,0.16)",
                                            willChange:
                                                "transform, opacity, filter",
                                            transformOrigin: "50% 50%",
                                            ...parked,
                                        }}
                                    >
                                        {clip ? (
                                            <video
                                                ref={(video) => {
                                                    if (video) {
                                                        video.muted = true
                                                        video.defaultMuted = true
                                                        if (
                                                            video.readyState >=
                                                            2
                                                        )
                                                            video.style.opacity =
                                                                "1"
                                                        if (on) {
                                                            clipRefs.current.set(
                                                                index,
                                                                video
                                                            )
                                                        } else if (
                                                            !video.paused
                                                        ) {
                                                            video.pause()
                                                        }
                                                    } else if (on) {
                                                        clipRefs.current.delete(
                                                            index
                                                        )
                                                    }
                                                }}
                                                onLoadedData={(e) => {
                                                    e.currentTarget.style.opacity =
                                                        "1"
                                                }}
                                                className={scope + "-clip"}
                                                src={clip}
                                                muted
                                                loop
                                                playsInline
                                                preload={
                                                    near ? "auto" : "metadata"
                                                }
                                                aria-label={entry?.title || ""}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                    pointerEvents: "none",
                                                    opacity: 0,
                                                }}
                                            />
                                        ) : art ? (
                                            <img
                                                src={art}
                                                alt={entry?.title || ""}
                                                draggable={false}
                                                decoding="async"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                    pointerEvents: "none",
                                                }}
                                            />
                                        ) : kindOf(entry) === "video" ? (
                                            <PlayGlyph />
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}

                {span && cueStyle !== "none" ? (
                    <div
                        ref={cueRef}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: liveW,
                            height: liveH,
                            transform: "translate(-50%, -50%)",
                            zIndex: 500,
                            pointerEvents: "none",
                        }}
                    >
                        <FocusCue
                            kind={cueStyle}
                            size={cueSize}
                            offset={cueOffset}
                            weight={cueWeight}
                            tint={cueTint}
                        />
                    </div>
                ) : null}

                <div
                    ref={labelRef}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: liveW,
                        height: liveH,
                        marginLeft: -liveW / 2,
                        marginTop: -liveH / 2,
                        zIndex: 600,
                        pointerEvents: "none",
                    }}
                >
                    {labelOn && span ? (
                        <div
                            key={"lab" + mode + focus}
                            aria-live="polite"
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }}
                        >
                            <LiveLabels
                                p={props}
                                piece={showing}
                                scope={scope}
                                botRef={botRowRef}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Oo(raw: OoInput) {
    const frozen = useIsStaticRenderer()
    const props = withToggle(raw)
    if (frozen) return <StillStrip {...props} />
    return <LiveStrip {...props} />
}

const blankPiece = {
    kind: "image" as MediaKind,
    image: "",
    imageUrl: "",
    video: "",
    videoUrl: "",
    title: "Title",
    caption: "Short caption",
    link: "",
}

const noText = (p: OoProps) => !p.labelOn
const noToggle = (t: any) => !!t && t.mediaToggle === false

addPropertyControls(Oo, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            title: "Slide",
            controls: {
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    displaySegmentedControl: true,
                    defaultValue: "image",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (p: any) => !!p && p.kind === "video",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    hidden: (p: any) => !!p && p.kind === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p: any) => !p || p.kind !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://….mp4",
                    defaultValue: "",
                    hidden: (p: any) => !p || p.kind !== "video",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Title",
                },
                caption: {
                    type: ControlType.String,
                    title: "Caption",
                    displayTextArea: true,
                    defaultValue: "Short caption",
                },
                link: { type: ControlType.Link, title: "CMS Link" },
            },
        },
        defaultValue: [
            { ...blankPiece, title: "Marrow", caption: "Quiet Studio Hours" },
            {
                ...blankPiece,
                kind: "video",
                title: "Tessellate",
                caption: "Glass Form Study",
            },
            { ...blankPiece, title: "Ochre", caption: "Desert Light Series" },
            {
                ...blankPiece,
                kind: "video",
                title: "Brindle",
                caption: "Slow Portrait Work",
            },
            { ...blankPiece, title: "Fathom", caption: "Deep Water Notes" },
            {
                ...blankPiece,
                kind: "video",
                title: "Quillon",
                caption: "Edge and Shadow",
            },
            { ...blankPiece, title: "Salvia", caption: "Garden Room Session" },
            {
                ...blankPiece,
                kind: "video",
                title: "Pewter",
                caption: "Cold Morning Frames",
            },
            { ...blankPiece, title: "Umbra", caption: "Half Lit Faces" },
            {
                ...blankPiece,
                kind: "video",
                title: "Kestrel",
                caption: "Open Field Motion",
            },
        ],
    },

    startMode: {
        type: ControlType.Enum,
        title: "Show",
        options: ["image", "video", "mixed"],
        optionTitles: ["Images", "Videos", "Mixed"],
        displaySegmentedControl: true,
        defaultValue: "image",
    },
    clipPlay: {
        type: ControlType.Enum,
        title: "Video Play",
        options: ["focus", "all"],
        optionTitles: ["Centre", "All Visible"],
        displaySegmentedControl: true,
        defaultValue: "focus",
    },
    toggle: {
        type: ControlType.Object,
        title: "Toggle",
        hidden: (p: any) => p.startMode === "mixed",
        controls: {
            mediaToggle: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: TOGGLE_BASE.mediaToggle,
            },
            imageLabel: {
                type: ControlType.String,
                title: "Image Label",
                defaultValue: TOGGLE_BASE.imageLabel,
                hidden: noToggle,
            },
            videoLabel: {
                type: ControlType.String,
                title: "Video Label",
                defaultValue: TOGGLE_BASE.videoLabel,
                hidden: noToggle,
            },
            toggleAlign: {
                type: ControlType.Enum,
                title: "Align",
                options: ["flex-start", "center", "flex-end"],
                optionTitles: ["Left", "Center", "Right"],
                displaySegmentedControl: true,
                defaultValue: TOGGLE_BASE.toggleAlign,
                hidden: noToggle,
            },
            toggleGap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: TOGGLE_BASE.toggleGap,
                hidden: noToggle,
            },
            toggleFont: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: TOGGLE_BASE.toggleFont,
                hidden: noToggle,
            },
            toggleTrack: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: TOGGLE_BASE.toggleTrack,
                hidden: noToggle,
            },
            togglePill: {
                type: ControlType.Color,
                title: "Active Fill",
                defaultValue: TOGGLE_BASE.togglePill,
                hidden: noToggle,
            },
            toggleInk: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: TOGGLE_BASE.toggleInk,
                hidden: noToggle,
            },
            toggleInkOn: {
                type: ControlType.Color,
                title: "Active Text",
                defaultValue: TOGGLE_BASE.toggleInkOn,
                hidden: noToggle,
            },
            toggleRadius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
                defaultValue: TOGGLE_BASE.toggleRadius,
                hidden: noToggle,
            },
            togglePad: {
                type: ControlType.Number,
                title: "Inset",
                min: 0,
                max: 16,
                step: 1,
                unit: "px",
                defaultValue: TOGGLE_BASE.togglePad,
                hidden: noToggle,
            },
            toggleBtnX: {
                type: ControlType.Number,
                title: "Padding X",
                min: 4,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: TOGGLE_BASE.toggleBtnX,
                hidden: noToggle,
            },
            toggleBtnY: {
                type: ControlType.Number,
                title: "Padding Y",
                min: 2,
                max: 30,
                step: 1,
                unit: "px",
                defaultValue: TOGGLE_BASE.toggleBtnY,
                hidden: noToggle,
            },
        },
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Main Width",
        min: 160,
        max: 900,
        step: 10,
        unit: "px",
        defaultValue: 320,
    },
    cardRatio: {
        type: ControlType.Number,
        title: "Ratio W/H",
        min: 0.4,
        max: 2.5,
        step: 0.01,
        defaultValue: 0.75,
    },
    sideSize: {
        type: ControlType.Number,
        title: "Side Size",
        min: 0.2,
        max: 0.9,
        step: 0.01,
        defaultValue: 0.52,
    },
    sideTaper: {
        type: ControlType.Number,
        title: "Side Taper",
        min: 0.6,
        max: 1,
        step: 0.01,
        defaultValue: 1,
    },
    slotGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },
    sideSlots: {
        type: ControlType.Number,
        title: "Side Slots",
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 5,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
    stagePad: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
        defaultValue: 24,
    },
    surface: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },

    sideGrey: {
        type: ControlType.Number,
        title: "Side Grey",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
    },
    sideDim: {
        type: ControlType.Number,
        title: "Side Tone",
        min: 0.5,
        max: 1.2,
        step: 0.01,
        defaultValue: 0.92,
    },
    sideFade: {
        type: ControlType.Number,
        title: "Side Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
    },
    fadeStep: {
        type: ControlType.Number,
        title: "Fade Step",
        min: 0.4,
        max: 1,
        step: 0.01,
        defaultValue: 0.86,
    },
    blurStep: {
        type: ControlType.Number,
        title: "Blur Step",
        min: 0,
        max: 8,
        step: 0.25,
        unit: "px",
        defaultValue: 2.5,
    },
    blurMax: {
        type: ControlType.Number,
        title: "Blur Max",
        min: 0,
        max: 24,
        step: 0.5,
        unit: "px",
        defaultValue: 12,
    },

    cueStyle: {
        type: ControlType.Enum,
        title: "Focus Cue",
        options: ["none", "corners", "rule", "rails", "outline", "caret"],
        optionTitles: [
            "None",
            "Corner Marks",
            "Base Rule",
            "Rails",
            "Outline",
            "Caret",
        ],
        defaultValue: "none",
    },
    cueTint: {
        type: ControlType.Color,
        title: "Cue Color",
        defaultValue: "#111111",
        hidden: (p: OoProps) => p.cueStyle === "none",
    },
    cueSize: {
        type: ControlType.Number,
        title: "Cue Size",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 8,
        hidden: (p: OoProps) => p.cueStyle === "none",
    },
    cueOffset: {
        type: ControlType.Number,
        title: "Cue Offset",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 16,
        hidden: (p: OoProps) => p.cueStyle === "none",
    },
    cueWeight: {
        type: ControlType.Number,
        title: "Cue Weight",
        min: 1,
        max: 6,
        step: 1,
        unit: "px",
        defaultValue: 1,
        hidden: (p: OoProps) => p.cueStyle === "none",
    },
    cueFade: {
        type: ControlType.Number,
        title: "Cue Reaction",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
        hidden: (p: OoProps) => p.cueStyle === "none",
    },

    labelOn: {
        type: ControlType.Boolean,
        title: "Text",
        defaultValue: true,
    },
    labelLayout: {
        type: ControlType.Enum,
        title: "Text Layout",
        options: ["edge", "split", "inline", "overlay", "plate"],
        optionTitles: [
            "Stack Below",
            "Split Below",
            "Inline Strip",
            "Overlay",
            "Hanging Plate",
        ],
        defaultValue: "edge",
        hidden: noText,
    },
    textSide: {
        type: ControlType.Enum,
        title: "Text Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
        hidden: noText,
    },
    rowGap: {
        type: ControlType.Number,
        title: "Line Gap",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 10,
        hidden: noText,
    },
    labelGap: {
        type: ControlType.Number,
        title: "Text Gap",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 26,
        hidden: (p: OoProps) =>
            !p.labelOn ||
            p.labelLayout === "overlay" ||
            p.labelLayout === "plate",
    },
    revealOn: {
        type: ControlType.Boolean,
        title: "Line Reveal",
        defaultValue: true,
        hidden: noText,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            lineHeight: "1.3em",
            letterSpacing: "0em",
            textTransform: "uppercase",
        },
        hidden: noText,
    },
    titleTint: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#111111",
        hidden: noText,
    },
    metaFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            lineHeight: "1.6em",
            letterSpacing: "0em",
            textTransform: "uppercase",
        },
        hidden: noText,
    },
    metaTint: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#111111",
        hidden: noText,
    },
    overlayInk: {
        type: ControlType.Color,
        title: "Overlay Ink",
        defaultValue: "#FFFFFF",
        hidden: (p: OoProps) => !p.labelOn || p.labelLayout !== "overlay",
    },
    scrimTint: {
        type: ControlType.Color,
        title: "Scrim",
        defaultValue: "rgba(0,0,0,0.55)",
        hidden: (p: OoProps) => !p.labelOn || p.labelLayout !== "overlay",
    },
    platePaper: {
        type: ControlType.Color,
        title: "Plate Fill",
        defaultValue: "#FFFFFF",
        hidden: (p: OoProps) => !p.labelOn || p.labelLayout !== "plate",
    },
    plateDrop: {
        type: ControlType.Number,
        title: "Plate Overlap",
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
        defaultValue: 48,
        hidden: (p: OoProps) => !p.labelOn || p.labelLayout !== "plate",
    },
    insetPad: {
        type: ControlType.Number,
        title: "Inset",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 18,
        hidden: (p: OoProps) =>
            !p.labelOn ||
            (p.labelLayout !== "overlay" && p.labelLayout !== "plate"),
    },

    wheelMode: {
        type: ControlType.Enum,
        title: "Wheel",
        options: ["off", "vertical", "any"],
        optionTitles: ["Off", "Vertical", "Any"],
        defaultValue: "vertical",
    },
    wheelStep: {
        type: ControlType.Number,
        title: "Step Travel",
        min: 20,
        max: 400,
        step: 5,
        unit: "px",
        defaultValue: 110,
        hidden: (p: OoProps) => p.wheelMode === "off",
    },
    throwCutoff: {
        type: ControlType.Number,
        title: "Throw At",
        min: 20,
        max: 300,
        step: 5,
        unit: "px",
        defaultValue: 70,
        hidden: (p: OoProps) => p.wheelMode === "off",
    },
    dragOn: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
    },
    dragSpan: {
        type: ControlType.Number,
        title: "Drag Per Card",
        min: 60,
        max: 600,
        step: 10,
        unit: "px",
        defaultValue: 240,
        hidden: (p: OoProps) => !p.dragOn,
    },
    snapRate: {
        type: ControlType.Number,
        title: "Snap Speed",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 6,
    },
    cycleOn: {
        type: ControlType.Boolean,
        title: "Auto Advance",
        defaultValue: false,
    },
    cycleWait: {
        type: ControlType.Number,
        title: "Every",
        min: 1,
        max: 15,
        step: 0.5,
        unit: "s",
        defaultValue: 3.5,
        hidden: (p: OoProps) => !p.cycleOn,
    },

    tickOn: {
        type: ControlType.Boolean,
        title: "Click Sound",
        defaultValue: false,
    },
    tickLevel: {
        type: ControlType.Number,
        title: "Volume",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.3,
        hidden: (p: OoProps) => !p.tickOn,
    },
    tickTone: {
        type: ControlType.Number,
        title: "Tone",
        min: 400,
        max: 5000,
        step: 50,
        unit: "Hz",
        defaultValue: 1800,
        hidden: (p: OoProps) => !p.tickOn,
    },
})
