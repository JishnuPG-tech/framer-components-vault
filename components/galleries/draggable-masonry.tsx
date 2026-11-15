import {
    memo,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { animate, AnimatePresence, motion, useMotionValue } from "framer-motion"

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

type AspectKey =
    | "portrait"
    | "tall"
    | "square"
    | "landscape"
    | "wide"
    | "custom"
type MediaKind = "image" | "video"

interface Slot {
    enabled?: boolean
    kind?: MediaKind
    image?: any
    imageUrl?: string
    video?: any
    videoUrl?: string
    poster?: any
    posterUrl?: string
    aspect?: AspectKey
    customAspect?: number
    cmsLink?: string
}

interface Piece {
    id: string
    kind: MediaKind
    src: string
    poster: string
    ratio: number
    link: string
}

interface Placed extends Piece {
    x: number
    y: number
    w: number
    h: number
}

interface Props {
    slots?: Slot[]
    colsDesktop?: number
    colsTablet?: number
    colsMobile?: number
    gap?: number
    pad?: number
    minCardWidth?: number
    entrance?: boolean
    entranceDuration?: number
    stagger?: number
    stiffness?: number
    damping?: number
    hoverScale?: number
    dragScale?: number
    dragTilt?: number
    respectReducedMotion?: boolean
    galleryBackground?: string
    cardBackground?: string
    borderColor?: string
    borderWidth?: number
    radius?: number
    shadow?: number
    fit?: "cover" | "contain"
    hoverBrightness?: number
    hoverOpacity?: number
    playInGrid?: boolean
    lightbox?: boolean
    lightboxBackdrop?: string
    lightboxBlur?: number
    lightboxRadius?: number
    lightboxArrows?: boolean
    lightboxControlColor?: string
    lightboxPlayerControls?: boolean
    lightboxAutoplay?: boolean
    style?: CSSProperties
}

/* ------------------------------------------------------------------ *
 * Constants + helpers
 * ------------------------------------------------------------------ */

// width ÷ height for each named aspect
const ASPECTS: Record<Exclude<AspectKey, "custom">, number> = {
    portrait: 4 / 5,
    tall: 2 / 3,
    square: 1,
    landscape: 3 / 2,
    wide: 16 / 9,
}

const SOFT_OUT: [number, number, number, number] = [0.22, 0.61, 0.36, 1]
const RISE = 26 // px a card travels upward during its entrance
const HOLD_MS = 180 // press-and-hold before a touch turns into a drag
const HOLD_SLOP = 10 // px of finger travel that cancels the hold
const SETTLE_GUARD = 130 // ms between reorders, keeps neighbours from flip-flopping
const MOUSE_SLOP = 4 // px of travel before a mouse press becomes a drag
const TABLET_AT = 1024
const PHONE_AT = 640

/**
 * Gap, padding and minimum card width are authored for the widest breakpoint and
 * then eased down as the container narrows, so a value that reads as generous on
 * desktop doesn't eat a phone's screen. Everything is also capped as a share of
 * the measured width, which is what stops padding from swallowing the grid on a
 * very narrow parent. Breakpoints are read from the container, not the viewport,
 * so the gallery behaves the same in a sidebar as it does full-bleed.
 */
function fluidMetrics(
    width: number,
    gap: number,
    pad: number,
    minCard: number
) {
    const phone = width > 0 && width < PHONE_AT
    const tablet = width >= PHONE_AT && width < TABLET_AT
    const gapScale = phone ? 0.6 : tablet ? 0.8 : 1
    const padScale = phone ? 0.5 : tablet ? 0.75 : 1
    const minScale = phone ? 0.65 : tablet ? 0.85 : 1
    return {
        gap: Math.max(
            0,
            Math.round(Math.min(Math.max(0, gap) * gapScale, width * 0.06))
        ),
        pad: Math.max(
            0,
            Math.round(Math.min(Math.max(0, pad) * padScale, width * 0.1))
        ),
        minCard: Math.max(48, Math.round(Math.max(48, minCard) * minScale)),
    }
}

const useIsoLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect

/** Framer hands an upload back as a plain string or as an object with a src. */
function assetUrl(value: any): string {
    if (typeof value === "string") return value.trim()
    if (value && typeof value.src === "string") return String(value.src).trim()
    return ""
}

/** An uploaded file wins over a pasted or CMS-bound URL for the same slot. */
function firstOf(upload: any, url: any): string {
    return assetUrl(upload) || assetUrl(url)
}

function ratioOf(slot: Slot): number {
    const key = (slot.aspect || "portrait") as AspectKey
    if (key === "custom") {
        const r = Number(slot.customAspect)
        return Number.isFinite(r) && r > 0.1 ? Math.min(r, 4) : 1
    }
    return ASPECTS[key] || 1
}

/** Pull the enabled, resolvable slots out of the property-panel array. */
function buildDeck(slots: Slot[] | undefined): Piece[] {
    const out: Piece[] = []
    if (!Array.isArray(slots)) return out
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i] || {}
        if (slot.enabled === false) continue
        const kind: MediaKind = slot.kind === "video" ? "video" : "image"
        out.push({
            id: "slot-" + i,
            kind,
            src:
                kind === "video"
                    ? firstOf(slot.video, slot.videoUrl)
                    : firstOf(slot.image, slot.imageUrl),
            poster: firstOf(slot.poster, slot.posterUrl),
            ratio: ratioOf(slot),
            link: typeof slot.cmsLink === "string" ? slot.cmsLink.trim() : "",
        })
    }
    return out
}

/**
 * Immutably exchange two entries.
 *
 * Reordering by exchange rather than by splicing is deliberate. Splicing a card
 * from index 2 to index 9 shifts every index in between, and because a masonry
 * assigns columns from running column heights, that re-packs the entire grid on
 * a single pointer move — the whole composition scrambles while you drag. An
 * exchange touches exactly two entries, so the rest of the grid keeps its
 * columns and only the two cards trade places.
 */
function exchange<T>(list: T[], a: number, b: number): T[] {
    if (a === b) return list
    const next = list.slice()
    const held = next[a]
    next[a] = next[b]
    next[b] = held
    return next
}

/* ------------------------------------------------------------------ *
 * Environment hooks (live branch only)
 * ------------------------------------------------------------------ */

/** True once the section has been on screen at least once. Falls back to true
 *  when IntersectionObserver is unavailable so the gallery is never left blank. */
function useSeen(ref: { current: HTMLElement | null }): boolean {
    const [seen, setSeen] = useState(false)
    useEffect(() => {
        const node = ref.current
        if (!node || typeof IntersectionObserver === "undefined") {
            setSeen(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setSeen(true)
                        io.disconnect()
                        break
                    }
                }
            },
            { rootMargin: "12% 0px", threshold: 0.01 }
        )
        io.observe(node)
        return () => io.disconnect()
    }, [ref])
    return seen
}

/** Live on-screen state (unlike useSeen, this one keeps reporting). Video
 *  playback is gated on it so clips never run for a section nobody is looking
 *  at, and it costs one observer rather than a frame loop. */
function useOnScreen(ref: { current: HTMLElement | null }): boolean {
    const [near, setNear] = useState(false)
    useEffect(() => {
        const node = ref.current
        if (!node || typeof IntersectionObserver === "undefined") {
            setNear(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) setNear(entry.isIntersecting)
            },
            { rootMargin: "10% 0px", threshold: 0.01 }
        )
        io.observe(node)
        return () => io.disconnect()
    }, [ref])
    return near
}

/** Tab visibility — keeps the entrance pass from burning frames in a background tab. */
function useTabAwake(): boolean {
    const [awake, setAwake] = useState(true)
    useEffect(() => {
        if (typeof document === "undefined") return
        const read = () => setAwake(document.visibilityState !== "hidden")
        read()
        document.addEventListener("visibilitychange", read)
        return () => document.removeEventListener("visibilitychange", read)
    }, [])
    return awake
}

function useCalmMotion(): boolean {
    const [calm, setCalm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const read = () => setCalm(mq.matches)
        read()
        if (mq.addEventListener) {
            mq.addEventListener("change", read)
            return () => mq.removeEventListener("change", read)
        }
        mq.addListener(read)
        return () => mq.removeListener(read)
    }, [])
    return calm
}

/* ------------------------------------------------------------------ *
 * Entry — one hook, then a hard split between canvas and live paths
 * ------------------------------------------------------------------ */

/**
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 720
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function FlowMasonry(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticGallery {...props} />
    return <LiveGallery {...props} />
}

/* ------------------------------------------------------------------ *
 * Canvas / export branch — plain DOM, CSS columns, nothing running
 * ------------------------------------------------------------------ */

function StaticGallery(props: Props) {
    const {
        slots,
        colsDesktop = 4,
        gap = 16,
        pad = 24,
        minCardWidth = 140,
        galleryBackground,
        cardBackground = "#141414",
        borderColor = "rgba(255,255,255,0.08)",
        borderWidth = 0,
        radius = 10,
        shadow = 0.18,
        fit = "cover",
        style,
    } = props

    const deck = buildDeck(slots)
    const frame: CSSProperties = {
        ...style,
        width: "100%",
        maxWidth: "100%",
        padding: pad,
        boxSizing: "border-box",
        background: galleryBackground,
        overflow: "hidden",
    }

    if (deck.length === 0) {
        return (
            <div style={frame}>
                <div
                    style={{
                        width: "100%",
                        height: 200,
                        borderRadius: radius,
                        background: cardBackground,
                        border: borderWidth
                            ? `${borderWidth}px solid ${borderColor}`
                            : undefined,
                        opacity: 0.55,
                    }}
                />
            </div>
        )
    }

    // A CSS multi-column flow approximates the runtime masonry closely enough for
    // the canvas without measuring anything or observing the container.
    return (
        <div style={frame}>
            <div
                style={{
                    // column-width + column-count together let the browser drop
                    // columns as the frame narrows, with the desktop count as the
                    // ceiling — a responsive preview with nothing measured in JS.
                    columnWidth: Math.max(48, minCardWidth),
                    columnCount: Math.max(1, Math.round(colsDesktop)),
                    columnGap: gap,
                }}
            >
                {deck.map((piece) => (
                    <div
                        key={piece.id}
                        style={{
                            breakInside: "avoid",
                            WebkitColumnBreakInside: "avoid",
                            marginBottom: gap,
                            borderRadius: radius,
                            background: cardBackground,
                            border: borderWidth
                                ? `${borderWidth}px solid ${borderColor}`
                                : undefined,
                            boxShadow:
                                shadow > 0
                                    ? `0 10px 28px rgba(0,0,0,${(shadow * 0.5).toFixed(3)})`
                                    : undefined,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                aspectRatio: String(piece.ratio),
                            }}
                        >
                            {/* Video is shown as its poster with playback off and
                                nothing preloaded, so the canvas and the export
                                never contain a running clip. */}
                            {piece.kind === "video" && piece.src ? (
                                <video
                                    src={piece.src}
                                    poster={piece.poster || undefined}
                                    autoPlay={false}
                                    muted
                                    playsInline
                                    preload="none"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: fit,
                                        display: "block",
                                    }}
                                />
                            ) : piece.src ? (
                                <img
                                    src={piece.src}
                                    alt=""
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: fit,
                                        display: "block",
                                    }}
                                />
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ *
 * Live branch
 * ------------------------------------------------------------------ */

function LiveGallery(props: Props) {
    const {
        slots,
        colsDesktop = 4,
        colsTablet = 3,
        colsMobile = 2,
        gap = 16,
        pad = 24,
        minCardWidth = 140,
        entrance = true,
        entranceDuration = 0.6,
        stagger = 0.045,
        stiffness = 260,
        damping = 30,
        hoverScale = 1.04,
        dragScale = 1.05,
        dragTilt = 2,
        respectReducedMotion = true,
        galleryBackground,
        cardBackground = "#141414",
        borderColor = "rgba(255,255,255,0.08)",
        borderWidth = 0,
        radius = 10,
        shadow = 0.18,
        fit = "cover",
        hoverBrightness = 1.06,
        hoverOpacity = 1,
        playInGrid = true,
        lightbox = true,
        lightboxBackdrop = "rgba(10,10,10,0.94)",
        lightboxBlur = 8,
        lightboxRadius = 12,
        lightboxArrows = true,
        lightboxControlColor = "rgba(255,255,255,0.92)",
        lightboxPlayerControls = true,
        lightboxAutoplay = true,
        style,
    } = props

    const frameRef = useRef<HTMLDivElement | null>(null)
    const fieldRef = useRef<HTMLDivElement | null>(null)

    const systemCalm = useCalmMotion()
    const calm = respectReducedMotion && systemCalm
    const seen = useSeen(frameRef)
    const onScreen = useOnScreen(frameRef)
    const awake = useTabAwake()
    const cleanId = "fm" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const deck = useMemo(() => buildDeck(slots), [slots])

    /* -- Order state ------------------------------------------------ *
     * The visual order lives here, not in the props, so a drag survives
     * re-renders. Ids that disappear from the panel drop out; new ids join at
     * the end, which keeps every React key stable across edits and reorders. */
    const [order, setOrder] = useState<string[]>(() => deck.map((p) => p.id))
    useEffect(() => {
        setOrder((prev) => {
            const ids = deck.map((p) => p.id)
            const kept = prev.filter((id) => ids.indexOf(id) !== -1)
            const added = ids.filter((id) => kept.indexOf(id) === -1)
            if (added.length === 0 && kept.length === prev.length) return prev
            return kept.concat(added)
        })
    }, [deck])

    const orderRef = useRef(order)
    orderRef.current = order

    /* -- Container measurement -------------------------------------- *
     * A ResizeObserver on the frame drives every recalculation, so the layout
     * responds to the Framer canvas, a browser resize and a parent that changes
     * width on its own. Falls back to a window listener where RO is missing. */
    const [frameWidth, setFrameWidth] = useState(0)
    useIsoLayout(() => {
        const node = frameRef.current
        if (!node) return
        const read = () => {
            // getBoundingClientRect keeps sub-pixel widths, so columns divide
            // cleanly instead of accumulating a rounding error across the row.
            let next = node.getBoundingClientRect().width || node.clientWidth
            // A parent that hasn't laid out yet reports 0; borrow the viewport so
            // the first paint is close rather than collapsed.
            if (!next && typeof window !== "undefined") {
                next = node.parentElement?.clientWidth || window.innerWidth || 0
            }
            setFrameWidth((prev) => (Math.abs(prev - next) < 0.5 ? prev : next))
        }
        read()
        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(read)
            ro.observe(node)
            return () => ro.disconnect()
        }
        window.addEventListener("resize", read)
        window.addEventListener("orientationchange", read)
        return () => {
            window.removeEventListener("resize", read)
            window.removeEventListener("orientationchange", read)
        }
    }, [])

    // Fluid spacing derived from the measured container width.
    const metrics = useMemo(
        () => fluidMetrics(frameWidth, gap, pad, minCardWidth),
        [frameWidth, gap, pad, minCardWidth]
    )

    /* -- Masonry solve ---------------------------------------------- *
     * Columns: the breakpoint value is the ceiling, then the minimum card width
     * trims it further so a narrow container never squeezes slivers.
     *
     * Packing: walk the deck in order and drop each card into whichever column
     * is currently shortest. Because a card's height is derived from its own
     * aspect ratio rather than a shared row height, columns stay flush and no
     * row gutters appear — the compact, gapless look. Each card ends up with an
     * absolute x/y, which is what makes reordering a pure animation. */
    const solved = useMemo(() => {
        const gap = metrics.gap
        const inner = Math.max(0, frameWidth - metrics.pad * 2)
        const byId = new Map(deck.map((p) => [p.id, p]))
        const ordered: Piece[] = []
        for (const id of order) {
            const piece = byId.get(id)
            if (piece) ordered.push(piece)
        }
        if (inner <= 0 || ordered.length === 0) {
            return { items: [] as Placed[], height: 0, width: inner, colW: 0 }
        }

        const breakpointCols =
            frameWidth < PHONE_AT
                ? colsMobile
                : frameWidth < TABLET_AT
                  ? colsTablet
                  : colsDesktop
        const roomFor = Math.floor((inner + gap) / (metrics.minCard + gap))
        const cols = Math.max(
            1,
            Math.min(Math.round(breakpointCols) || 1, Math.max(1, roomFor))
        )
        const colW = (inner - gap * (cols - 1)) / cols

        const tops = new Array(cols).fill(0)
        const items: Placed[] = ordered.map((piece) => {
            let col = 0
            for (let i = 1; i < cols; i++) {
                if (tops[i] < tops[col] - 0.5) col = i
            }
            const h = Math.max(24, Math.round(colW / piece.ratio))
            const placed: Placed = {
                ...piece,
                x: col * (colW + gap),
                y: tops[col],
                w: colW,
                h,
            }
            tops[col] += h + gap
            return placed
        })

        const tallest = tops.reduce((a, b) => (b > a ? b : a), 0)
        return { items, height: Math.max(0, tallest - gap), width: inner, colW }
    }, [deck, order, frameWidth, metrics, colsDesktop, colsTablet, colsMobile])

    const solvedRef = useRef(solved)
    solvedRef.current = solved

    /* -- Drag reordering -------------------------------------------- *
     * The dragged card is pointer-driven: nothing else writes to its transform
     * until it is let go. As it travels, the card it lands on trades places with
     * it, and the rest of the grid keeps its columns — see exchange() above for
     * why places are traded rather than spliced. Every card that does move
     * springs to its new slot, which reads as the grid opening up around the one
     * in hand. A short cooldown keeps neighbours from swapping every frame. */
    const [heldId, setHeldId] = useState<string | null>(null)
    const lastSwapRef = useRef(0)

    const onLift = useCallback((id: string) => {
        lastSwapRef.current = 0
        setHeldId(id)
    }, [])

    /**
     * Called on every pointer move of a drag. It does two things and returns the
     * result of the first, so the position the card paints and the position the
     * gallery reasons about can never drift apart:
     *
     *  1. Clamps the requested position inside the field, which is what keeps a
     *     card from being pulled out of the section or lost behind its edge.
     *  2. Hit-tests the clamped centre against the resting cards and, when it
     *     lands on the core of one, exchanges the two.
     */
    const onCarry = useCallback((id: string, rawX: number, rawY: number) => {
        const field = solvedRef.current
        const self = field.items.find((p) => p.id === id)
        if (!self) return { x: rawX, y: rawY }

        const px = Math.max(
            0,
            Math.min(rawX, Math.max(0, field.width - self.w))
        )
        const py = Math.max(
            0,
            Math.min(rawY, Math.max(0, field.height - self.h))
        )
        const at = { x: px, y: py }
        if (field.items.length < 2) return at

        const now =
            typeof performance !== "undefined" ? performance.now() : Date.now()
        if (now - lastSwapRef.current < SETTLE_GUARD) return at

        const cx = px + self.w / 2
        const cy = py + self.h / 2

        // The hit area of a resting card is deliberately smaller than the card
        // itself: the pointer has to reach its core rather than merely graze an
        // edge, which is what stops two cards trading places over and over while
        // the pointer sits on the seam between them.
        const inset = 0.15
        let target: Placed | null = null
        for (const item of field.items) {
            if (item.id === id) continue
            const mx = item.w * inset
            const my = item.h * inset
            if (
                cx >= item.x + mx &&
                cx <= item.x + item.w - mx &&
                cy >= item.y + my &&
                cy <= item.y + item.h - my
            ) {
                target = item
                break
            }
        }
        if (!target) return at

        const list = orderRef.current
        const from = list.indexOf(id)
        const to = list.indexOf(target.id)
        if (from < 0 || to < 0 || from === to) return at
        lastSwapRef.current = now
        setOrder(exchange(list, from, to))
        return at
    }, [])

    const onDrop = useCallback(() => {
        setHeldId(null)
    }, [])

    /* -- Opening a card ---------------------------------------------- *
     * A card is only "clicked" when the pointer barely moved, so finishing a
     * drag never fires a link or throws the lightbox open. A CMS link takes
     * precedence: if a card points somewhere, that is what a click is for, and
     * only cards without a link fall through to the lightbox. */
    const [openAt, setOpenAt] = useState(-1)

    const onActivate = useCallback(
        (id: string) => {
            const items = solvedRef.current.items
            const at = items.findIndex((p) => p.id === id)
            if (at < 0) return
            const piece = items[at]
            if (piece.link) {
                if (typeof window === "undefined") return
                const external = /^https?:\/\//i.test(piece.link)
                if (external)
                    window.open(piece.link, "_blank", "noopener,noreferrer")
                else window.location.href = piece.link
                return
            }
            if (lightbox && piece.src) setOpenAt(at)
        },
        [lightbox]
    )

    const closeLightbox = useCallback(() => setOpenAt(-1), [])
    const stepLightbox = useCallback((delta: number) => {
        const items = solvedRef.current.items
        if (items.length === 0) return
        setOpenAt((at) =>
            at < 0 ? at : (at + delta + items.length) % items.length
        )
    }, [])

    // Grid clips run only while the section is on screen, the tab is awake and
    // nothing is open over the top of it.
    const gridPlaying = playInGrid && onScreen && awake && openAt < 0

    /* -- Hover treatment --------------------------------------------- *
     * Done in CSS, scoped to this instance, so hovering never re-renders React
     * and two galleries on one page can't collide. */
    const hoverZoom = calm ? 1 : hoverScale
    const css = `
.${cleanId}-img{
  width:100%;height:100%;display:block;object-fit:var(--${cleanId}-fit);
  transform:translateZ(0);
  transition:transform 620ms cubic-bezier(.22,.61,.36,1),filter 320ms ease,opacity 320ms ease;
}
@media (hover:hover) and (pointer:fine){
  .${cleanId}-card[data-held="0"]:hover .${cleanId}-img{
    transform:scale(${hoverZoom});
    filter:brightness(${hoverBrightness});
    opacity:${hoverOpacity};
  }
}
${calm ? `.${cleanId}-img{transition:filter 320ms ease,opacity 320ms ease;}` : ""}
@media (prefers-reduced-motion: reduce){
  .${cleanId}-img{transition:opacity 200ms ease;}
}
`

    const ready = entrance ? seen && awake : true

    const frameStyle: CSSProperties = {
        ...style,
        width: "100%",
        maxWidth: "100%",
        padding: metrics.pad,
        boxSizing: "border-box",
        background: galleryBackground,
        overflowX: "hidden",
        overflowY: "hidden",
        position: "relative",
    }

    if (deck.length === 0) {
        return (
            <div ref={frameRef} style={frameStyle}>
                <div
                    style={{
                        width: "100%",
                        height: Math.max(120, Math.min(260, frameWidth * 0.3)),
                        borderRadius: radius,
                        background: cardBackground,
                        border: borderWidth
                            ? `${borderWidth}px solid ${borderColor}`
                            : undefined,
                        opacity: 0.55,
                    }}
                />
            </div>
        )
    }

    return (
        <div ref={frameRef} style={frameStyle}>
            <style>{css}</style>
            <div
                ref={fieldRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: solved.height,
                }}
            >
                {solved.items.map((item, index) => (
                    <Card
                        key={item.id}
                        id={item.id}
                        src={item.src}
                        kind={item.kind}
                        poster={item.poster}
                        clickable={!!item.link || (lightbox && !!item.src)}
                        playing={gridPlaying}
                        index={index}
                        tx={item.x}
                        ty={item.y}
                        w={item.w}
                        h={item.h}
                        held={heldId === item.id}
                        ready={ready}
                        calm={calm}
                        entrance={entrance}
                        entranceDuration={entranceDuration}
                        stagger={stagger}
                        stiffness={stiffness}
                        damping={damping}
                        dragScale={dragScale}
                        dragTilt={dragTilt}
                        cardBackground={cardBackground}
                        borderColor={borderColor}
                        borderWidth={borderWidth}
                        radius={radius}
                        shadow={shadow}
                        fit={fit}
                        scope={cleanId}
                        onLift={onLift}
                        onCarry={onCarry}
                        onDrop={onDrop}
                        onActivate={onActivate}
                    />
                ))}
            </div>

            <AnimatePresence>
                {lightbox && openAt >= 0 && solved.items[openAt] ? (
                    <Lightbox
                        piece={solved.items[openAt]}
                        many={solved.items.length > 1}
                        calm={calm}
                        backdrop={lightboxBackdrop}
                        blur={lightboxBlur}
                        radius={lightboxRadius}
                        arrows={lightboxArrows}
                        controlColor={lightboxControlColor}
                        playerControls={lightboxPlayerControls}
                        autoplay={lightboxAutoplay}
                        fit={fit}
                        onClose={closeLightbox}
                        onStep={stepLightbox}
                    />
                ) : null}
            </AnimatePresence>
        </div>
    )
}

/* ------------------------------------------------------------------ *
 * Card
 * ------------------------------------------------------------------ */

interface CardProps {
    id: string
    src: string
    kind: MediaKind
    poster: string
    clickable: boolean
    playing: boolean
    index: number
    tx: number
    ty: number
    w: number
    h: number
    held: boolean
    ready: boolean
    calm: boolean
    entrance: boolean
    entranceDuration: number
    stagger: number
    stiffness: number
    damping: number
    dragScale: number
    dragTilt: number
    cardBackground: string
    borderColor: string
    borderWidth: number
    radius: number
    shadow: number
    fit: "cover" | "contain"
    scope: string
    onLift: (id: string) => void
    onCarry: (
        id: string,
        rawX: number,
        rawY: number
    ) => { x: number; y: number }
    onDrop: () => void
    onActivate: (id: string) => void
}

const Card = memo(function Card(props: CardProps) {
    const {
        id,
        src,
        kind,
        poster,
        clickable,
        playing,
        index,
        tx,
        ty,
        w,
        h,
        held,
        ready,
        calm,
        entrance,
        entranceDuration,
        stagger,
        stiffness,
        damping,
        dragScale,
        dragTilt,
        cardBackground,
        borderColor,
        borderWidth,
        radius,
        shadow,
        fit,
        scope,
        onLift,
        onCarry,
        onDrop,
        onActivate,
    } = props

    // Transform channels are motion values rather than animate props. The drag
    // writes into x/y directly and everything else (entrance, settling after a
    // reorder or a resize) is a one-shot animation onto the same values, so no
    // two systems ever own the same channel at the same moment.
    const x = useMotionValue(tx)
    const y = useMotionValue(ty)
    const scale = useMotionValue(entrance ? 0.94 : 1)
    const opacity = useMotionValue(entrance ? 0 : 1)
    const tilt = useMotionValue(0)

    const [broken, setBroken] = useState(false)
    const [floating, setFloating] = useState(false)
    const heldRef = useRef(false)
    const startedRef = useRef(false)
    const flightRef = useRef(false)
    const lastAimRef = useRef({ x: tx, y: ty })
    const settleRef = useRef<any[]>([])
    const targetRef = useRef({ x: tx, y: ty })
    targetRef.current = { x: tx, y: ty }

    const spring = useMemo(
        () => ({ type: "spring" as const, stiffness, damping, mass: 0.9 }),
        [stiffness, damping]
    )

    /* Entrance: locked out until the parent says the section is on screen and the
     * tab is awake. Reduced motion collapses it to a plain fade in place. */
    useEffect(() => {
        if (!ready || startedRef.current) return
        startedRef.current = true
        const target = targetRef.current

        if (!entrance) {
            x.set(target.x)
            y.set(target.y)
            opacity.set(1)
            scale.set(1)
            return
        }

        const delay = Math.min(index * Math.max(0, stagger), 1.4)

        if (calm) {
            x.set(target.x)
            y.set(target.y)
            scale.set(1)
            const fade = animate(opacity, 1, {
                duration: entranceDuration,
                delay,
            })
            return () => fade.stop()
        }

        x.set(target.x)
        y.set(target.y + RISE)
        lastAimRef.current = { x: target.x, y: target.y }
        flightRef.current = true // the reconciler stands down until the rise lands
        const runs = [
            animate(opacity, 1, {
                duration: entranceDuration,
                delay,
                ease: SOFT_OUT,
            }),
            animate(scale, 1, {
                duration: entranceDuration,
                delay,
                ease: SOFT_OUT,
            }),
            animate(y, target.y, {
                ...spring,
                delay,
                onComplete: () => {
                    flightRef.current = false
                },
            }),
        ]
        return () => runs.forEach((run) => run.stop())
    }, [ready])

    /* Pick up / put down. On grab, any spring still in flight is stopped so the
     * pointer is the only thing writing to x/y. On release the card is handed
     * straight back to the reconciler below. */
    useEffect(() => {
        if (held) {
            heldRef.current = true
            flightRef.current = false
            setFloating(true)
            x.stop()
            y.stop()
            animate(scale, calm ? 1 : dragScale, {
                ...spring,
                stiffness: stiffness * 1.2,
            })
            return
        }
        if (!heldRef.current) return
        heldRef.current = false
        flightRef.current = false
        const aim = targetRef.current
        const settled =
            Math.abs(x.get() - aim.x) < 0.5 && Math.abs(y.get() - aim.y) < 0.5
        if (settled) setFloating(false)
        const runs = [animate(scale, 1, spring), animate(tilt, 0, spring)]
        return () => runs.forEach((run) => run.stop())
    }, [held])

    /* Reconciler. Runs after every render rather than off a dependency list, and
     * asks one question: is this card sitting where the layout says it should be?
     * If the target moved (resize, reorder) or the card was left displaced (it was
     * just dropped), it springs home; otherwise it does nothing at all and no
     * animation is scheduled. Because the check is positional rather than
     * event-driven, no sequence of drags, drops and reflows can strand a card out
     * of its slot or leave two cards sharing one. */
    useEffect(() => {
        if (heldRef.current || !startedRef.current) return
        const aim = lastAimRef.current
        const aimMoved =
            Math.abs(aim.x - tx) > 0.5 || Math.abs(aim.y - ty) > 0.5
        const astray =
            Math.abs(x.get() - tx) > 0.5 || Math.abs(y.get() - ty) > 0.5
        if (!aimMoved && (flightRef.current || !astray)) return

        lastAimRef.current = { x: tx, y: ty }
        flightRef.current = true
        let left = 2
        const done = () => {
            left -= 1
            if (left > 0) return
            flightRef.current = false
            setFloating(false)
        }
        const move = calm
            ? { duration: 0.001, onComplete: done }
            : { ...spring, onComplete: done }
        // No cleanup here on purpose: a spring mid-flight has to survive the
        // parent's next render. Starting a new animation on the same value
        // supersedes the old one, and the unmount effect below stops the rest.
        settleRef.current = [animate(x, tx, move), animate(y, ty, move)]
    })

    useEffect(() => {
        return () => {
            settleRef.current.forEach((run) => run && run.stop())
            settleRef.current = []
        }
    }, [])

    /* -- Media -------------------------------------------------------- */

    const videoRef = useRef<HTMLVideoElement | null>(null)

    /* Grid clips follow the gate handed down by the gallery: on screen, tab
     * awake, nothing open over the top. A rejected play() (autoplay policy, a
     * source that never loaded) is swallowed rather than thrown. */
    useEffect(() => {
        const node = videoRef.current
        if (!node || kind !== "video" || !src || broken) return
        if (playing) {
            const attempt = node.play()
            if (attempt && attempt.catch) attempt.catch(() => {})
        } else {
            node.pause()
        }
    }, [playing, kind, src, broken])

    useEffect(() => {
        return () => {
            const node = videoRef.current
            if (node) node.pause()
        }
    }, [])

    /* -- Pointer gesture ---------------------------------------------- *
     * The drag is hand-rolled rather than delegated to a gesture library, for
     * one reason: the number written into the card's transform and the number
     * the gallery hit-tests with are then the same number. Nothing measures the
     * element, nothing caches a bounding box that can go stale behind a spring,
     * and there is no second constraint system that can clamp the card somewhere
     * the layout doesn't expect.
     *
     * Pointer capture keeps the events coming even when the finger outruns the
     * card. On touch, a card is only picked up after a short hold, so a swipe
     * across the gallery scrolls the page as usual; on mouse it is picked up as
     * soon as the pointer travels a few pixels, which keeps clicks clean. */
    const pressRef = useRef<{
        pointerId: number
        px: number
        py: number
        ox: number
        oy: number
        touch: boolean
        active: boolean
    } | null>(null)
    const holdTimerRef = useRef<number | null>(null)
    const scrollLockRef = useRef<((e: TouchEvent) => void) | null>(null)
    const movedRef = useRef(false)
    const tiltDirRef = useRef(0)
    const lastPxRef = useRef(0)

    const clearHold = useCallback(() => {
        if (holdTimerRef.current !== null) {
            window.clearTimeout(holdTimerRef.current)
            holdTimerRef.current = null
        }
    }, [])

    /* While a touch drag is running the page must stop scrolling underneath it,
     * or the document and the card move at once and the drop lands nowhere near
     * the finger. The blocker lives only as long as that one gesture. */
    const lockScroll = useCallback(() => {
        if (scrollLockRef.current || typeof document === "undefined") return
        const stop = (event: TouchEvent) => {
            if (event.cancelable) event.preventDefault()
        }
        scrollLockRef.current = stop
        document.addEventListener("touchmove", stop, { passive: false })
    }, [])

    const unlockScroll = useCallback(() => {
        if (!scrollLockRef.current || typeof document === "undefined") return
        document.removeEventListener("touchmove", scrollLockRef.current)
        scrollLockRef.current = null
    }, [])

    const beginDrag = useCallback(() => {
        const press = pressRef.current
        if (!press || press.active) return
        press.active = true
        movedRef.current = true
        tiltDirRef.current = 0
        if (press.touch) lockScroll()
        onLift(id)
    }, [id, onLift, lockScroll])

    const onPointerDown = useCallback(
        (event: ReactPointerEvent) => {
            if (event.pointerType === "mouse" && event.button !== 0) return
            const node = event.currentTarget as HTMLElement
            try {
                node.setPointerCapture(event.pointerId)
            } catch (err) {
                /* capture is a nicety, not a requirement */
            }
            pressRef.current = {
                pointerId: event.pointerId,
                px: event.clientX,
                py: event.clientY,
                ox: x.get(),
                oy: y.get(),
                touch: event.pointerType === "touch",
                active: false,
            }
            lastPxRef.current = event.clientX
            movedRef.current = false
            clearHold()
            if (event.pointerType === "touch") {
                holdTimerRef.current = window.setTimeout(() => {
                    holdTimerRef.current = null
                    beginDrag()
                }, HOLD_MS)
            }
        },
        [beginDrag, clearHold, x, y]
    )

    const onPointerMove = useCallback(
        (event: ReactPointerEvent) => {
            const press = pressRef.current
            if (!press || press.pointerId !== event.pointerId) return

            const dx = event.clientX - press.px
            const dy = event.clientY - press.py

            if (!press.active) {
                const slop = press.touch ? HOLD_SLOP : MOUSE_SLOP
                if (dx * dx + dy * dy < slop * slop) return
                // A finger that moves before the hold elapses is scrolling, not
                // dragging: stand down and let the page have it.
                if (press.touch) {
                    clearHold()
                    return
                }
                beginDrag()
                if (!press.active) return
            }

            // The gallery clamps the position to the field and hit-tests with the
            // very same point, then hands it back for the transform.
            const at = onCarry(id, press.ox + dx, press.oy + dy)
            x.set(at.x)
            y.set(at.y)

            if (calm || dragTilt <= 0) return
            const step = event.clientX - lastPxRef.current
            lastPxRef.current = event.clientX
            const dir = step > 1.5 ? 1 : step < -1.5 ? -1 : 0
            if (dir !== 0 && dir !== tiltDirRef.current) {
                tiltDirRef.current = dir
                animate(tilt, dir * dragTilt, {
                    type: "spring",
                    stiffness: 200,
                    damping: 22,
                })
            }
        },
        [id, onCarry, beginDrag, clearHold, calm, dragTilt, x, y, tilt]
    )

    const endPointer = useCallback(
        (event?: ReactPointerEvent) => {
            const press = pressRef.current
            clearHold()
            unlockScroll()
            if (press && event) {
                const node = event.currentTarget as HTMLElement
                try {
                    if (
                        node.hasPointerCapture &&
                        node.hasPointerCapture(press.pointerId)
                    ) {
                        node.releasePointerCapture(press.pointerId)
                    }
                } catch (err) {
                    /* nothing to release */
                }
            }
            pressRef.current = null
            tiltDirRef.current = 0
            if (press && press.active) onDrop()
        },
        [clearHold, unlockScroll, onDrop]
    )

    useEffect(() => {
        return () => {
            clearHold()
            unlockScroll()
        }
    }, [clearHold, unlockScroll])

    const onCardClick = useCallback(() => {
        // Anything that turned into a drag is not a click.
        if (movedRef.current) {
            movedRef.current = false
            return
        }
        if (clickable) onActivate(id)
    }, [clickable, onActivate, id])

    /* -- Paint -------------------------------------------------------- */

    const restShadow =
        shadow > 0
            ? `0 ${Math.round(6 + shadow * 10)}px ${Math.round(18 + shadow * 26)}px rgba(0,0,0,${(shadow * 0.45).toFixed(3)})`
            : "none"
    const liftShadow =
        shadow > 0
            ? `0 ${Math.round(18 + shadow * 22)}px ${Math.round(40 + shadow * 46)}px rgba(0,0,0,${Math.min(0.6, shadow * 0.9).toFixed(3)})`
            : "0 20px 40px rgba(0,0,0,0.22)"

    return (
        <motion.div
            className={`${scope}-card`}
            data-held={held ? "1" : "0"}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            onClick={onCardClick}
            style={
                {
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: w,
                    height: h,
                    x,
                    y,
                    scale,
                    opacity,
                    rotate: tilt,
                    // Stays above the field until the settle finishes, so a dropped
                    // card never slides underneath the cards it is passing over.
                    zIndex: held ? 30 : floating ? 20 : 1,
                    // Vertical page scroll stays available until a drag actually
                    // begins; the gesture then takes over via the scroll lock.
                    touchAction: "pan-y",
                    borderRadius: radius,
                    background: cardBackground,
                    border: borderWidth
                        ? `${borderWidth}px solid ${borderColor}`
                        : undefined,
                    boxShadow: held ? liftShadow : restShadow,
                    overflow: "hidden",
                    cursor: held ? "grabbing" : clickable ? "pointer" : "grab",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitTapHighlightColor: "transparent",
                    ["--" + scope + "-fit"]: fit,
                } as CSSProperties
            }
        >
            {/* A slot that fails to load simply leaves the card's own background
                showing — the rest of the grid is untouched. */}
            {src && !broken ? (
                kind === "video" ? (
                    <video
                        ref={videoRef}
                        className={`${scope}-img`}
                        src={src}
                        poster={poster || undefined}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        disablePictureInPicture
                        onError={() => setBroken(true)}
                    />
                ) : (
                    <img
                        className={`${scope}-img`}
                        src={src}
                        alt=""
                        draggable={false}
                        loading="lazy"
                        decoding="async"
                        onError={() => setBroken(true)}
                    />
                )
            ) : null}
        </motion.div>
    )
})

/* ------------------------------------------------------------------ *
 * Lightbox — live branch only, mounted on demand
 * ------------------------------------------------------------------ */

interface LightboxProps {
    piece: Placed
    many: boolean
    calm: boolean
    backdrop: string
    blur: number
    radius: number
    arrows: boolean
    controlColor: string
    playerControls: boolean
    autoplay: boolean
    fit: "cover" | "contain"
    onClose: () => void
    onStep: (delta: number) => void
}

function Lightbox(props: LightboxProps) {
    const {
        piece,
        many,
        calm,
        backdrop,
        blur,
        radius,
        arrows,
        controlColor,
        playerControls,
        autoplay,
        fit,
        onClose,
        onStep,
    } = props

    const videoRef = useRef<HTMLVideoElement | null>(null)

    /* Keyboard + scroll lock live only as long as the overlay does. */
    useEffect(() => {
        if (typeof window === "undefined") return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
            else if (event.key === "ArrowRight") onStep(1)
            else if (event.key === "ArrowLeft") onStep(-1)
        }
        window.addEventListener("keydown", onKey)
        const previous = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = previous
        }
    }, [onClose, onStep])

    /* Open with sound where the browser allows it; if autoplay policy refuses,
     * fall back to a muted start rather than a frozen first frame. */
    useEffect(() => {
        const node = videoRef.current
        if (!node || piece.kind !== "video" || !autoplay) return
        node.muted = false
        const attempt = node.play()
        if (attempt && attempt.catch) {
            attempt.catch(() => {
                node.muted = true
                const retry = node.play()
                if (retry && retry.catch) retry.catch(() => {})
            })
        }
        return () => node.pause()
    }, [piece.id, piece.kind, autoplay])

    const fade = calm ? { duration: 0.18 } : { duration: 0.28, ease: SOFT_OUT }

    const glyph = (
        path: string,
        label: string,
        onTap: () => void,
        place: CSSProperties
    ) => (
        <button
            type="button"
            aria-label={label}
            onClick={(event) => {
                event.stopPropagation()
                onTap()
            }}
            style={{
                position: "absolute",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                color: controlColor,
                cursor: "pointer",
                padding: 0,
                WebkitTapHighlightColor: "transparent",
                ...place,
            }}
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={controlColor}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d={path} />
            </svg>
        </button>
    )

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: backdrop,
                backdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : undefined,
                cursor: "zoom-out",
            }}
        >
            {glyph("M18 6 6 18M6 6l12 12", "Close", onClose, {
                top: 18,
                right: 18,
            })}
            {arrows && many
                ? glyph("M15 5l-7 7 7 7", "Previous", () => onStep(-1), {
                      left: 18,
                      top: "calc(50% - 22px)",
                  })
                : null}
            {arrows && many
                ? glyph("M9 5l7 7-7 7", "Next", () => onStep(1), {
                      right: 18,
                      top: "calc(50% - 22px)",
                  })
                : null}

            <motion.div
                key={piece.id}
                initial={calm ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={calm ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={calm ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={fade}
                onClick={(event) => event.stopPropagation()}
                style={{
                    // Sized from the slot's own ratio so neither axis can spill
                    // out of the viewport on any screen.
                    width: `min(92vw, ${(84 * piece.ratio).toFixed(2)}vh)`,
                    maxWidth: "92vw",
                    maxHeight: "84vh",
                    aspectRatio: String(piece.ratio),
                    borderRadius: radius,
                    overflow: "hidden",
                    // Cover fills the frame edge to edge (the slot's ratio decides
                    // the crop); contain letterboxes the original instead.
                    background:
                        fit === "contain" ? "rgba(0,0,0,0.4)" : "transparent",
                    cursor: "default",
                }}
            >
                {piece.kind === "video" ? (
                    <video
                        ref={videoRef}
                        src={piece.src}
                        poster={piece.poster || undefined}
                        controls={playerControls}
                        loop
                        playsInline
                        preload="metadata"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: fit,
                            display: "block",
                            background:
                                fit === "contain" ? "#000" : "transparent",
                        }}
                    />
                ) : (
                    <img
                        src={piece.src}
                        alt=""
                        draggable={false}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: fit,
                            display: "block",
                        }}
                    />
                )}
            </motion.div>
        </motion.div>
    )
}

/* ------------------------------------------------------------------ *
 * Property controls
 * ------------------------------------------------------------------ */

const ASPECT_OPTIONS: AspectKey[] = [
    "portrait",
    "tall",
    "square",
    "landscape",
    "wide",
    "custom",
]
const ASPECT_TITLES = ["4:5", "2:3", "1:1", "3:2", "16:9", "Custom"]

const sample = (seed: string, w: number, h: number) =>
    `https://picsum.photos/seed/${seed}/${w}/${h}`

const DEFAULT_SLOTS: Slot[] = [
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf01", 800, 1000),
        aspect: "portrait",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf02", 900, 900),
        aspect: "square",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf03", 1200, 800),
        aspect: "landscape",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf04", 800, 1200),
        aspect: "tall",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf05", 800, 1000),
        aspect: "portrait",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf06", 1280, 720),
        aspect: "wide",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf07", 900, 900),
        aspect: "square",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf08", 800, 1200),
        aspect: "tall",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf09", 1200, 800),
        aspect: "landscape",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf10", 800, 1000),
        aspect: "portrait",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf11", 900, 900),
        aspect: "square",
    },
    {
        enabled: true,
        kind: "image",
        imageUrl: sample("fmf12", 1280, 720),
        aspect: "wide",
    },
]

addPropertyControls(FlowMasonry, {
    slots: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            title: "Image",
            controls: {
                enabled: {
                    type: ControlType.Boolean,
                    title: "Show",
                    defaultValue: true,
                },
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (o: Slot) => o.kind === "video",
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    hidden: (o: Slot) => o.kind === "video",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov", "m4v"],
                    hidden: (o: Slot) => o.kind !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://….mp4",
                    defaultValue: "",
                    hidden: (o: Slot) => o.kind !== "video",
                },
                poster: {
                    type: ControlType.Image,
                    title: "Poster",
                    hidden: (o: Slot) => o.kind !== "video",
                },
                posterUrl: {
                    type: ControlType.String,
                    title: "Poster URL",
                    placeholder: "https://…",
                    defaultValue: "",
                    hidden: (o: Slot) => o.kind !== "video",
                },
                aspect: {
                    type: ControlType.Enum,
                    title: "Ratio",
                    options: ASPECT_OPTIONS,
                    optionTitles: ASPECT_TITLES,
                    defaultValue: "portrait",
                },
                customAspect: {
                    type: ControlType.Number,
                    title: "Custom",
                    min: 0.3,
                    max: 3,
                    step: 0.01,
                    defaultValue: 1,
                    hidden: (o: Slot) => o.aspect !== "custom",
                },
                cmsLink: {
                    type: ControlType.Link,
                    title: "CMS Link",
                },
            },
        },
        defaultValue: DEFAULT_SLOTS,
    },

    colsDesktop: {
        type: ControlType.Number,
        title: "Desktop",
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 4,
        displayStepper: true,
    },
    colsTablet: {
        type: ControlType.Number,
        title: "Tablet",
        min: 1,
        max: 6,
        step: 1,
        defaultValue: 3,
        displayStepper: true,
    },
    colsMobile: {
        type: ControlType.Number,
        title: "Mobile",
        min: 1,
        max: 4,
        step: 1,
        defaultValue: 2,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 64,
        step: 1,
        defaultValue: 16,
        unit: "px",
    },
    pad: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 120,
        step: 1,
        defaultValue: 24,
        unit: "px",
    },
    minCardWidth: {
        type: ControlType.Number,
        title: "Min Width",
        min: 60,
        max: 520,
        step: 10,
        defaultValue: 140,
        unit: "px",
    },

    entrance: {
        type: ControlType.Boolean,
        title: "Entrance",
        defaultValue: true,
    },
    entranceDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 2,
        step: 0.05,
        defaultValue: 0.6,
        unit: "s",
        hidden: (p: Props) => !p.entrance,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 0.2,
        step: 0.005,
        defaultValue: 0.045,
        unit: "s",
        hidden: (p: Props) => !p.entrance,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        min: 60,
        max: 600,
        step: 10,
        defaultValue: 260,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 8,
        max: 60,
        step: 1,
        defaultValue: 30,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        min: 1,
        max: 1.2,
        step: 0.005,
        defaultValue: 1.04,
    },
    dragScale: {
        type: ControlType.Number,
        title: "Drag Scale",
        min: 1,
        max: 1.2,
        step: 0.005,
        defaultValue: 1.05,
    },
    dragTilt: {
        type: ControlType.Number,
        title: "Drag Tilt",
        min: 0,
        max: 8,
        step: 0.5,
        defaultValue: 2,
        unit: "°",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
    },

    galleryBackground: {
        type: ControlType.Color,
        title: "Gallery",
        defaultValue: "rgba(0,0,0,0)",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card",
        defaultValue: "#141414",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255,255,255,0.08)",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border W",
        min: 0,
        max: 6,
        step: 0.5,
        defaultValue: 0,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 48,
        step: 1,
        defaultValue: 10,
        unit: "px",
    },
    shadow: {
        type: ControlType.Number,
        title: "Shadow",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.18,
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    hoverBrightness: {
        type: ControlType.Number,
        title: "Brightness",
        min: 0.5,
        max: 1.5,
        step: 0.01,
        defaultValue: 1.06,
    },
    hoverOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0.2,
        max: 1,
        step: 0.01,
        defaultValue: 1,
    },

    playInGrid: {
        type: ControlType.Boolean,
        title: "Play In Grid",
        defaultValue: true,
    },
    lightbox: {
        type: ControlType.Boolean,
        title: "Lightbox",
        defaultValue: true,
    },
    lightboxBackdrop: {
        type: ControlType.Color,
        title: "Backdrop",
        defaultValue: "rgba(10,10,10,0.94)",
        hidden: (p: Props) => !p.lightbox,
    },
    lightboxBlur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 8,
        unit: "px",
        hidden: (p: Props) => !p.lightbox,
    },
    lightboxRadius: {
        type: ControlType.Number,
        title: "LB Radius",
        min: 0,
        max: 48,
        step: 1,
        defaultValue: 12,
        unit: "px",
        hidden: (p: Props) => !p.lightbox,
    },
    lightboxArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
        hidden: (p: Props) => !p.lightbox,
    },
    lightboxControlColor: {
        type: ControlType.Color,
        title: "Controls",
        defaultValue: "rgba(255,255,255,0.92)",
        hidden: (p: Props) => !p.lightbox,
    },
    lightboxPlayerControls: {
        type: ControlType.Boolean,
        title: "Player Bar",
        defaultValue: true,
        hidden: (p: Props) => !p.lightbox,
    },
    lightboxAutoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        hidden: (p: Props) => !p.lightbox,
    },
})
