// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
} from "react"
import { createPortal } from "react-dom"

interface LollipopImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface LollipopItem {
    image?: LollipopImage | string
    video?: string
    title?: string
    description?: string
    tags?: string
    link?: string
}

interface LollipopCarouselProps {
    items?: LollipopItem[]
    heightMode?: "Fixed" | "Fill"
    itemHeight?: number
    hoverScale?: number
    gap?: number
    speed?: number
    direction?: "Left" | "Right"
    expandedRadius?: number
    shadow?: boolean
    dim?: number
    captions?: boolean
    captionGap?: number
    captionSpace?: number
    titleFont?: CSSProperties
    bodyFont?: CSSProperties
    titleColor?: string
    descriptionColor?: string
    tagColor?: string
    tagBackground?: string
    placeholderTint?: string
    sheetColor?: string
    style?: CSSProperties
}

/** One item after normalisation, ready to lay out. */
interface Source {
    key: string
    src?: string
    srcSet?: string
    /** Cheapest variant with the right shape — used only to measure aspect. */
    probe?: string
    alt: string
    video?: string
    title: string
    description: string
    tags: string[]
    link?: string
}

/** A Source placed at a concrete position in the repeated strip. */
interface Placed extends Source {
    flat: number
}

interface Rect {
    left: number
    top: number
    width: number
    height: number
}

/**
 * The active item, promoted out of the strip into a fixed focus layer.
 * `rest` is where its capsule sat at the moment of activation; `open` is
 * where the expanded card is headed, already clamped to the viewport.
 */
interface Card extends Placed {
    rest: Rect
    open: Rect
    videoTime: number
    state: "open" | "closing"
    seq: number
}

/**
 * Lollipop Carousel — an ambient strip of capsule-shaped media that drifts
 * sideways on its own. Hovering an item lifts it out of the strip into a
 * focus layer: the card expands, the rest of the strip fades back behind it,
 * and a caption opens underneath.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 530
 */
export default function LollipopCarousel(props: LollipopCarouselProps) {
    const {
        items = DEFAULT_ITEMS,
        heightMode = "Fixed",
        itemHeight: itemHeightProp = 150,
        hoverScale = 2.6,
        gap = 0,
        speed = 60,
        direction = "Left",
        expandedRadius = 48,
        shadow = true,
        dim = 65,
        captions = true,
        captionGap = 20,
        captionSpace = 140,
        titleFont,
        bodyFont,
        titleColor = "#0d0d0d",
        descriptionColor = "#6b6b6b",
        tagColor = "#333333",
        tagBackground = "#f0f0f0",
        placeholderTint = "#EFEFED",
        sheetColor = "#FCFCFB",
        style,
    } = props

    // True on the Framer canvas AND during static export/thumbnail renders —
    // both must stay still, so every animation and continuous effect below
    // gates on this. (Marketplace review requires useIsStaticRenderer, not
    // RenderTarget.canvas, which misses exports.)
    const isStatic = useIsStaticRenderer()
    // No Theme control: the page owns its theme, and this only needs to know
    // which way to throw a shadow. Follows `data-theme` on the document, then
    // the OS.
    const isDark = useIsDark()

    // Touch devices and narrow windows get the modal presentation: the card is
    // fitted to the screen over a sheet, with a close button and dots, rather
    // than hovering above a page it is too wide for.
    const modal = useTouchLayout() && !isStatic

    // How far the neighbours fade back while a card is open. The control is
    // expressed as how much they *lose*, which is the way you think about it
    // when tuning; the style wants what is left.
    const dimOpacity = Math.max(0, Math.min(1, 1 - dim / 100))

    // Optical alignment for the caption against the card's rounded corner.
    const captionInset = captionInsetFor(expandedRadius)

    // Handed to the CSS as custom properties rather than baked into the
    // stylesheet, so the clocks live in exactly one place.
    const clock = {
        "--lollipop-open-dur": `${OPEN_MS}ms`,
        "--lollipop-close-dur": `${CLOSE_MS}ms`,
        // Corner radius is paint-only: it cannot be composited, so every
        // frame of it re-rasters the card on the main thread. That is the one
        // thing standing between this animation and a pure compositor job, so
        // it gets a short clock — done inside the first third, while the eye
        // is tracking gross movement and can't see corner detail — leaving
        // the settle to run as transform alone.
        "--lollipop-radius-dur": "240ms",
        "--lollipop-open-ease": OPEN_SPRING,
        "--lollipop-close-ease": CLOSE_SPRING,
        "--lollipop-ease-fb": EASE_FALLBACK,
    } as CSSProperties

    /* ---------------------------------------------------------------- data */

    // Normalise whatever the controls hand us into a flat, predictable shape.
    // Entries with nothing in them are dropped so a half-filled array in the
    // editor doesn't render ghost capsules.
    const sources = useMemo<Source[]>(() => {
        const list = Array.isArray(items) ? items : []
        return list
            .map((raw, i) => {
                const item = raw || {}
                const image = item.image
                const picked =
                    typeof image === "string" ? image : image?.src || undefined
                // Framer drops `defaultValue` for both ResponsiveImage and File
                // controls, so a default item arrives carrying only its copy.
                // Fill the media back in by position — but only while the item
                // is untouched, so an author's own choice is never overridden.
                const untouched = !picked && !item.video
                const demo = DEMO_ITEMS[i % DEMO_ITEMS.length]
                const src = picked || (untouched ? demo.src : undefined)
                // One demo item is a video over a still poster, so the video
                // has to come back on the same terms as the image — otherwise
                // a fresh instance shows that piece frozen on its poster.
                const video = item.video || (untouched ? demo.video : undefined)
                // An author's ResponsiveImage brings its own srcSet, with
                // descriptors Framer already got right. The demo imagery gets
                // one synthesised from its measured source size — keyed off
                // the resolved URL rather than off the untouched branch,
                // because `DEFAULT_ITEMS` hands the same pictures over as an
                // explicit `image.src`, which is not the untouched path and
                // silently skipped this entirely.
                const known = src ? MEDIA_DIMENSIONS.get(src) : undefined
                // A GIF gets no srcSet at all. Its frames are rewritten at
                // runtime to loop (see forceGifLoop), which produces a single
                // blob URL that a srcSet would simply override — and the
                // service returns the identical file for every size anyway,
                // so there is nothing to choose between.
                const srcSet = isGif(src)
                    ? undefined
                    : (typeof image === "object" ? image?.srcSet : undefined) ||
                      (known && src
                          ? framerSrcSet(src, known[0], known[1])
                          : undefined)
                return {
                    key: `${i}`,
                    src,
                    srcSet,
                    probe: probeUrl(srcSet, src),
                    alt:
                        (typeof image === "object" && image?.alt) ||
                        item.title ||
                        "",
                    video,
                    title: item.title || "",
                    description: item.description || "",
                    tags: String(item.tags || "")
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    link: item.link || undefined,
                }
            })
            .filter((item) => item.src || item.video || item.title)
    }, [items])

    /* ------------------------------------------------------- fill height */

    // In Fill mode the capsule size is derived from whatever vertical room the
    // component has been given, capped by Size — so a page can hand the strip
    // `1fr` and have it scale, instead of Size being tuned per breakpoint.
    const rootRef = useRef<HTMLDivElement | null>(null)
    const [rootHeight, setRootHeight] = useState(0)

    // Measured in both modes, not just Fill: Fill derives the capsule size
    // from it, and *both* modes need it to keep the caption reserve inside the
    // room the component was actually given.
    useLayoutEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => setRootHeight(el.clientHeight)
        measure()
        window.addEventListener("resize", measure)
        const observer =
            typeof ResizeObserver === "undefined"
                ? null
                : new ResizeObserver(measure)
        observer?.observe(el)
        return () => {
            window.removeEventListener("resize", measure)
            observer?.disconnect()
        }
    }, [heightMode])

    // Under the modal the caption opens in the focus layer over a sheet, never
    // under the strip — so the room kept for it below the row is room nobody
    // can use. On a phone that was 140px of dead space between the strip and
    // the footer.
    const requestedReserve = captions && !modal ? captionSpace : 0

    // Likewise the growth headroom: `band` is normally tall enough to hold an
    // expanded card so that opening one never reflows the row, but a modal card
    // is a fixed overlay and takes no room in the strip at all. Asking for
    // 2.6x the capsule height there demanded 390px to draw a 150px row.
    const growth = modal ? 1 : hoverScale

    const itemHeight =
        heightMode === "Fill" && rootHeight > 0
            ? Math.max(
                  MIN_ITEM_HEIGHT,
                  Math.min(
                      itemHeightProp,
                      Math.floor((rootHeight - requestedReserve) / growth)
                  )
              )
            : itemHeightProp

    /* ------------------------------------------------------------- geometry */

    // The tallest a capsule can ever get, and so the height of the strip: an
    // item expanding never changes the scroll container's content height.
    // Collapses to the capsule itself under the modal, where expansion happens
    // in the overlay and the strip has nothing to make room for.
    //
    // …but not *exactly* the capsule. A horizontal scroller cannot have visible
    // overflow on the other axis — CSS computes `overflow-y: visible` to `auto`
    // the moment `overflow-x` isn't visible — so a band the height of the
    // capsule clips its own shadow flat. That is a real edge visible on a
    // phone, and it arrived with the collapse.
    const band = itemHeight * growth + (modal ? SHADOW_ROOM * 2 : 0)
    const mediaCenterY = band / 2
    // Empty room kept under the strip. The caption itself lives in the focus
    // layer and can't be clipped by anything — but without a reserve it opens
    // on top of whatever the page put below the carousel.
    //
    // It is *page spacing, not a hard requirement*: reserving room the
    // component wasn't given makes the strip paint outside its own container,
    // which is what a buyer sees if they drop it into a section shorter than
    // band + Caption Room. Take whatever is actually left instead.
    const reserve =
        rootHeight > 0
            ? Math.max(0, Math.min(requestedReserve, rootHeight - band))
            : requestedReserve
    const blockHeight = band + reserve

    /* ----------------------------------------------------- aspect ratios */

    // Every capsule is as wide as its media is, which means we need the real
    // aspect ratio before we can lay anything out. Measuring off-DOM first —
    // rather than reacting to onLoad — keeps capsules from visibly resizing as
    // images stream in, and keeps the laid-out width honest from frame one.
    const [aspects, setAspects] = useState<Record<string, number>>({})
    const [measured, setMeasured] = useState(false)

    useEffect(() => {
        const needed = sources.filter((item) => item.src || item.video)
        if (needed.length === 0) {
            setMeasured(true)
            return
        }

        let cancelled = false
        let pending = needed.length

        // Results are applied as they land rather than batched at the end: a
        // straggler that misses the reveal deadline below still corrects its
        // own capsule instead of being stuck at a guessed 1:1 forever.
        const record = (key: string, ratio: number) => {
            if (cancelled) return
            if (Number.isFinite(ratio) && ratio > 0) {
                setAspects((prev) =>
                    prev[key] === ratio ? prev : { ...prev, [key]: ratio }
                )
            }
            pending -= 1
            if (pending === 0) setMeasured(true)
        }

        // Don't let one slow or broken asset hold the strip hostage forever.
        // This used to be 2s, which on a slow connection meant the strip
        // appeared with every capsule at a guessed 1:1 and then visibly
        // resized as the real ratios landed — the precise jump this whole
        // measurement pass exists to avoid. There's a skeleton to look at
        // now, so waiting longer is the better trade.
        const timeout = setTimeout(() => {
            if (!cancelled) setMeasured(true)
        }, MEASURE_DEADLINE_MS)

        needed.forEach((item) => {
            // A GIF is going to be fetched anyway so its frames can be
            // rewritten to loop, and it declares its own size in the header —
            // so take the ratio from those bytes rather than downloading the
            // file again. (An `<img>` load and a `fetch` are different request
            // modes and do not share a cache entry, so this really was two
            // downloads.) Falls through to the image path if that fetch fails.
            if (item.src && isGif(item.src) && typeof fetch !== "undefined") {
                const source = item.src
                loopingGif(source)
                    .then(({ width, height }) =>
                        record(item.key, height ? width / height : 0)
                    )
                    .catch(() => record(item.key, 0))
                return
            }
            if (item.src) {
                const image = new Image()
                image.onload = () =>
                    record(
                        item.key,
                        image.naturalHeight
                            ? image.naturalWidth / image.naturalHeight
                            : 0
                    )
                image.onerror = () => record(item.key, 0)
                // The smallest variant, not the source file: this pass wants
                // the image's *shape*, which is the same at every scale. It
                // was pulling full-size originals — the dominant cost of the
                // whole component — to compute a division.
                image.src = item.probe || item.src
                return
            }
            const video = document.createElement("video")
            video.preload = "metadata"
            video.muted = true
            video.onloadedmetadata = () =>
                record(
                    item.key,
                    video.videoHeight
                        ? video.videoWidth / video.videoHeight
                        : 0
                )
            video.onerror = () => record(item.key, 0)
            if (item.video) video.src = item.video
        })

        return () => {
            cancelled = true
            clearTimeout(timeout)
        }
    }, [sources])

    const widthOf = useCallback(
        (key: string) => Math.round(itemHeight * (aspects[key] ?? 1)),
        [aspects, itemHeight]
    )

    /* ------------------------------------------------------- infinite track */

    const scrollerRef = useRef<HTMLDivElement | null>(null)
    const [viewport, setViewport] = useState(0)

    useLayoutEffect(() => {
        const el = scrollerRef.current
        if (!el) return
        const measure = () => setViewport(el.clientWidth)
        measure()
        window.addEventListener("resize", measure)
        const observer =
            typeof ResizeObserver === "undefined"
                ? null
                : new ResizeObserver(measure)
        observer?.observe(el)
        return () => {
            window.removeEventListener("resize", measure)
            observer?.disconnect()
        }
    }, [measured])

    // One "copy" has to be at least as wide as the viewport, otherwise the
    // seam shows when we wrap. Repeat the source list until it is, then lay
    // down three copies and live in the middle one.
    const unitWidth = useMemo(
        () => sources.reduce((sum, item) => sum + widthOf(item.key) + gap, 0),
        [sources, widthOf, gap]
    )

    const repeats = useMemo(() => {
        if (!unitWidth || !viewport) return 1
        return Math.max(
            1,
            Math.min(12, Math.ceil((viewport * 1.25) / unitWidth))
        )
    }, [unitWidth, viewport])

    const COPIES = 3
    const copyWidth = unitWidth * repeats

    const rendered = useMemo<Placed[]>(() => {
        const out: Placed[] = []
        for (let copy = 0; copy < COPIES; copy++) {
            for (let rep = 0; rep < repeats; rep++) {
                sources.forEach((item) => {
                    out.push({ ...item, flat: out.length })
                })
            }
        }
        return out
    }, [sources, repeats])

    // Keyboard focus walks the middle copy only, so Tab doesn't step through
    // three identical passes of the same content.
    const middleStart = repeats * sources.length
    const middleEnd = middleStart + repeats * sources.length

    /* -------------------------------------------------------- scroll engine */

    // We drive scrollLeft from a float accumulator: reading it back each frame
    // would round away sub-pixel motion and stall the drift at low speeds.
    const posRef = useRef(0)
    const appliedRef = useRef(0)
    const copyWidthRef = useRef(0)
    const seededRef = useRef(false)
    // Eased scroll target, consumed by the rAF loop. Native smooth scrolling
    // would fight the accumulator — every frame it moved scrollLeft we would
    // read the change back as an external scroll and re-baseline.
    const glideRef = useRef<number | null>(null)
    // A throw's velocity, handed to the rAF loop once on release.
    const flingRef = useRef<number | null>(null)

    /**
     * Where the scroller is *going*, which is not always where it is.
     *
     * Every rect the focus layer derives has to be measured against this rather
     * than against the live `scrollLeft`. Session 6c established the rule for
     * the drift — a card must land where its capsule *will be* — and a glide is
     * the same kind of motion under a card that cannot follow it. Without this,
     * stepping to the next item aims the card at a capsule that is still on its
     * way to the middle, and it lands short by however far the glide had left
     * to run.
     */
    const effectiveScroll = useCallback(() => {
        const el = scrollerRef.current
        if (!el) return 0
        return glideRef.current ?? el.scrollLeft
    }, [])

    // Folds the offset back into the middle copy and reports how far it moved,
    // so a caller mid-gesture can re-baseline against the jump.
    // Set while any card is alive, and read by `wrap`.
    //
    // Folding renumbers which copy of the strip you are looking at, and a live
    // card is pinned to one index in one copy — fold underneath it and it
    // closes onto a capsule a whole copy away. `rebase` is the one thing
    // allowed to renumber while a card is open, because it moves the card's
    // index and the scroller together. So the automatic fold stands down for
    // the length of the interaction.
    //
    // Safe to suspend: the only thing moving the strip then is a glide toward
    // a centred middle-copy column, which keeps the position inside
    // [w − viewport, 2w) — comfortably within the three copies laid down, since
    // a copy is always at least 1.25 viewports wide. It resumes, and folds once
    // invisibly, as soon as the last card retires.
    const cardsAliveRef = useRef(false)
    const draggingRef = useRef(false)
    // True from the moment a finger lands until the scroll it started has gone
    // quiet. The browser owns `scrollLeft` for that whole window — including
    // the momentum after the finger has left — and anything of ours that
    // writes it in the meantime is fighting a native scroll.
    const touchingRef = useRef(false)
    const touchIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    // Whether the rAF loop is alive, held in a ref because the stepping
    // helpers are declared above the loop and only read it when called.
    const runningRef = useRef(false)

    /**
     * Hand `scrollLeft` back once a touch scroll has actually stopped.
     *
     * Re-armed on every scroll event, so the clock only runs out when the
     * momentum does. There is no event for "momentum finished" — this is the
     * standard way to infer it.
     */
    const settleTouch = useCallback(() => {
        if (touchIdleRef.current !== null) clearTimeout(touchIdleRef.current)
        touchIdleRef.current = setTimeout(() => {
            touchIdleRef.current = null
            touchingRef.current = false
            const el = scrollerRef.current
            if (el) {
                // Adopt wherever the browser left it, then fold if the gesture
                // ran past a copy boundary — deferred until now precisely
                // because setting scrollLeft mid-momentum stops it dead.
                posRef.current = el.scrollLeft
                appliedRef.current = el.scrollLeft
                wrapRef.current?.()
            }
        }, TOUCH_IDLE_MS)
    }, [])

    // `wrap` is defined below and `settleTouch` above it, so they meet here.
    const wrapRef = useRef<(() => number) | null>(null)

    const wrap = useCallback(() => {
        const el = scrollerRef.current
        const width = copyWidthRef.current
        if (!el || width <= 0) return 0
        // Never fold while the browser is scrolling: writing scrollLeft kills
        // momentum on iOS, and the seam is exactly where a flick tends to land.
        // Three copies give plenty of runway to wait.
        if (touchingRef.current) return 0
        // …and only while there is room to stand down: the argument above
        // rests on a copy being wider than the viewport, which `repeats`
        // guarantees from a real measurement but not from a failed one.
        if (
            cardsAliveRef.current &&
            !draggingRef.current &&
            width > el.clientWidth
        )
            return 0
        const pos = posRef.current
        let delta = 0
        if (pos >= 2 * width) delta = -width
        else if (pos < width) delta = width
        else return 0
        posRef.current = pos + delta
        appliedRef.current = posRef.current
        el.scrollLeft = posRef.current
        if (glideRef.current !== null) glideRef.current += delta
        return delta
    }, [])

    // Park the viewport in the middle copy once we know how wide a copy is,
    // and hold our place when that width changes underneath us (the frame
    // resizing, or itemHeight being edited on the canvas).
    useLayoutEffect(() => {
        const el = scrollerRef.current
        if (!el || copyWidth <= 0) return
        const previous = copyWidthRef.current
        copyWidthRef.current = copyWidth
        if (!seededRef.current) {
            seededRef.current = true
            posRef.current = copyWidth
        } else if (previous > 0) {
            // Keep how far we are *through* a copy, not the raw offset.
            const progress = (posRef.current - previous) / previous
            posRef.current = copyWidth + progress * copyWidth
        }
        appliedRef.current = posRef.current
        el.scrollLeft = posRef.current
    }, [copyWidth])

    wrapRef.current = wrap

    // Anything that isn't us moving the scroller — a drag, a trackpad swipe —
    // has to be folded back into the accumulator.
    const onScroll = useCallback(() => {
        const el = scrollerRef.current
        if (!el) return
        if (Math.abs(el.scrollLeft - appliedRef.current) > 1.5) {
            posRef.current = el.scrollLeft
            appliedRef.current = el.scrollLeft
            glideRef.current = null
        }
        // While a finger is in charge, keep re-arming the idle clock instead of
        // folding: this fires throughout the momentum, so it is the cheapest
        // signal that the scroll is still running.
        if (touchingRef.current) {
            settleTouch()
            return
        }
        wrap()
    }, [wrap, settleTouch])

    /* ------------------------------------------------------------ hovering */

    const [active, setActive] = useState<number | null>(null)
    const activeRef = useRef<number | null>(null)

    /**
     * Closing is held back by a short grace period; opening and switching are
     * immediate.
     *
     * A capsule is only `itemHeight` tall inside a `band`-tall column, so
     * there is a lot of empty row above and below it that resolves to "no
     * target". A pointer sweeping across the strip crosses those, and with no
     * grace at all a single stray frame tore the card down and rebuilt it —
     * which reads as flicker, not as a close. Switching straight from one
     * item to another stays instant: once a card is open, hesitating before
     * showing the next one is the thing that feels sluggish.
     */
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const setActiveIndex = useCallback((next: number | null) => {
        if (closeTimerRef.current !== null) {
            clearTimeout(closeTimerRef.current)
            closeTimerRef.current = null
        }
        if (activeRef.current === next) return
        if (next === null && activeRef.current !== null) {
            closeTimerRef.current = setTimeout(() => {
                closeTimerRef.current = null
                activeRef.current = null
                setActive(null)
            }, EXIT_GRACE_MS)
            return
        }
        activeRef.current = next
        setActive(next)
    }, [])

    /**
     * Close at once, with no grace period.
     *
     * The grace exists to absorb the empty row a pointer sweeps through
     * between capsules — it has nothing to forgive when someone has said
     * "close" out loud, by pressing Escape, tapping the sheet or hitting the
     * close button. Waiting there reads as a button that didn't take.
     */
    const closeNow = useCallback(() => {
        if (closeTimerRef.current !== null) {
            clearTimeout(closeTimerRef.current)
            closeTimerRef.current = null
        }
        if (activeRef.current === null) return
        activeRef.current = null
        setActive(null)
    }, [])

    useEffect(
        () => () => {
            if (closeTimerRef.current !== null)
                clearTimeout(closeTimerRef.current)
        },
        []
    )

    const indexAtPoint = useCallback((x: number, y: number) => {
        if (typeof document === "undefined") return null
        const hit = document.elementFromPoint(x, y)
        if (!(hit instanceof Element)) return null
        const capsule = hit.closest("[data-lollipop-index]")
        if (!capsule) return null
        // Scoped to *this* strip. `elementFromPoint` searches the whole
        // document, and the index attribute is not namespaced, so on a page
        // with two carousels moving the pointer onto the second one resolved
        // to a real index for the first — which then opened its own item at
        // that index, from a hover it never received. One gesture, two cards.
        if (!scrollerRef.current?.contains(capsule)) return null
        const index = Number(capsule.getAttribute("data-lollipop-index"))
        return Number.isInteger(index) ? index : null
    }, [])

    // Hit-testing on pointermove rather than CSS :hover — the strip slides
    // under a stationary cursor, and only a real pointer move should change
    // what is focused.
    const lastPointRef = useRef({ x: -1, y: -1 })

    const onStripPointerMove = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (event.pointerType !== "mouse") return
            if (draggingRef.current) return
            // Drift slides content under a still cursor; only act on movement
            // the person actually made.
            const last = lastPointRef.current
            if (last.x === event.clientX && last.y === event.clientY) return
            lastPointRef.current = { x: event.clientX, y: event.clientY }
            const target = event.target
            if (!(target instanceof Element)) return
            const hit = target.closest("[data-lollipop-index]")
            if (!hit) {
                setActiveIndex(null)
                return
            }
            const index = Number(hit.getAttribute("data-lollipop-index"))
            setActiveIndex(Number.isInteger(index) ? index : null)
        },
        [setActiveIndex]
    )

    const onStripPointerLeave = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (event.pointerType !== "mouse") return
            // While a card is open the document-level handler owns hover; the
            // pointer is legitimately outside the strip when it's on the card.
            if (activeRef.current !== null) return
            setActiveIndex(null)
        },
        [setActiveIndex]
    )

    /* --------------------------------------------------------- focus cards */

    const [cards, setCards] = useState<Card[]>([])
    const seqRef = useRef(0)
    // Only keyboard activation should move focus — stealing it on hover would
    // yank the caret out of whatever the person was actually doing.
    const focusIntentRef = useRef(false)
    const returnFocusRef = useRef<number | null>(null)
    // The portalled focus layer, held so pointer hit-testing can be scoped to
    // this instance rather than to whatever is in document.body.
    const layerRef = useRef<HTMLDivElement | null>(null)
    const cardElements = useRef(new Map<number, HTMLElement>())
    const captionElements = useRef(new Map<number, HTMLElement>())
    const cardsRef = useRef<Card[]>(cards)
    cardsRef.current = cards
    cardsAliveRef.current = cards.length > 0

    // Open cards only: a *closing* card's capsule starts fading back in
    // underneath it (see the .lollipop-media reveal delay), so the strip is
    // already whole the frame the card retires — no hole, no pop-in.
    const hiddenInStrip = useMemo(
        () =>
            new Set(
                cards
                    .filter((card) => card.state === "open")
                    .map((card) => card.flat)
            ),
        [cards]
    )

    // The capsules under a closing card. They are distinguished from ordinary
    // neighbours because their fade has to be held until the card has landed
    // on top of them — fading in early shows the image twice.
    const returningInStrip = useMemo(
        () =>
            new Set(
                cards
                    .filter((card) => card.state === "closing")
                    .map((card) => card.flat)
            ),
        [cards]
    )

    // How far neighbours part around a given item: half the growth of the
    // item being opened, so the gap matches the card that fills it.
    const spreadFor = useCallback(
        (flat: number | null) => {
            // Nothing parts under the sheet: the strip is behind an opaque
            // surface, so it would be work nobody sees. Zeroed here rather than
            // at the call sites so `settledRect` and the strip can never
            // disagree about where the gap is — the closing card lands on the
            // capsule's real resting place either way.
            if (modal) return 0
            const item = flat === null ? null : rendered[flat]
            return item ? (0.9 * (hoverScale - 1) * widthOf(item.key)) / 2 : 0
        },
        [rendered, widthOf, hoverScale, modal]
    )

    /**
     * Where a capsule will *settle*, in viewport coordinates — as opposed to
     * where it happens to be drawn this instant.
     *
     * Derived from layout (`offsetLeft`, immune to the parting transform,
     * which may still be animating) plus the destination parting shift for
     * the given active item, plus the scroller's live scroll offset. A
     * closing card animates to this rather than to the rect captured when it
     * opened: by then the strip has drifted and its neighbours have re-parted,
     * so the captured rect points at empty space and the card visibly lands
     * off its capsule.
     */
    const settledRect = useCallback(
        (flat: number, activeFlat: number | null): Rect | null => {
            const scroller = scrollerRef.current
            const capsule = scroller?.querySelector(
                `.lollipop-media[data-lollipop-index="${flat}"]`
            )
            const column = capsule?.parentElement
            if (!scroller || !(column instanceof HTMLElement)) return null
            const frame = scroller.getBoundingClientRect()
            const shift =
                activeFlat === null || activeFlat === flat
                    ? 0
                    : spreadFor(activeFlat) * (flat < activeFlat ? -1 : 1)
            return {
                left:
                    frame.left - effectiveScroll() + column.offsetLeft + shift,
                top: frame.top + mediaCenterY - itemHeight / 2,
                width: column.offsetWidth,
                height: itemHeight,
            }
        },
        [spreadFor, mediaCenterY, itemHeight, effectiveScroll]
    )

    // Build the fixed geometry for an item: where its capsule is right now,
    // and where the expanded card should land.
    const buildCard = useCallback(
        (flat: number): Card | null => {
            const scroller = scrollerRef.current
            if (!scroller || typeof window === "undefined") return null
            const item = rendered[flat]
            if (!item) return null
            const capsule = scroller.querySelector(
                `.lollipop-media[data-lollipop-index="${flat}"]`
            )
            const column = capsule?.parentElement
            if (!(capsule instanceof HTMLElement) || !column) return null

            // Where the capsule will *settle* once any pending glide has run,
            // falling back to where it is drawn right now. A stepped card is
            // built while the strip is still gliding the new item to the
            // middle, so the live box points at a capsule on its way through —
            // the card would grow out of the wrong place, and in from off
            // screen once the step is more than a neighbour away.
            const settled = settledRect(flat, flat)
            const live = capsule.getBoundingClientRect()
            const restBox = settled ?? {
                left: live.left,
                top: live.top,
                width: live.width,
                height: live.height,
            }
            const frame = scroller.getBoundingClientRect()

            // offsetLeft is a layout value, so it is immune to the parting
            // transform that may still be animating on this column. Deriving
            // the target from it means the card lands where the gap opens,
            // not where the column happens to be mid-flight.
            const trackLeft = frame.left - effectiveScroll()
            const centerX =
                trackLeft + column.offsetLeft + column.offsetWidth / 2

            const width = widthOf(item.key)

            const vw = window.innerWidth
            const vh = window.innerHeight
            const margin = modal ? MODAL_MARGIN : EDGE_MARGIN
            // Vertical room the card is *not* allowed to take: the modal keeps
            // a bar's worth above for the close button and a block below for
            // the caption and dots.
            const chrome = modal
                ? MODAL_TOP + (captions ? MODAL_BOTTOM : MODAL_BOTTOM_BARE)
                : margin * 2

            /**
             * The expansion is a **uniform** scale on both axes — that is what
             * makes `invert` an exact substitution rather than an
             * approximation, and it is why the whole animation can run as
             * `transform` alone on the compositor.
             *
             * It used to be `hoverScale` flat, with only the card's *position*
             * clamped to the viewport — so a card wider than the window was
             * centred and simply allowed to bleed off both edges. On a 390px
             * phone a 16:9 item opened ~639px wide and lost ~124px either
             * side. Fitting the scale instead keeps the whole picture on
             * screen at every width, and on a desktop with room to spare the
             * fit is slack and `s === hoverScale`, i.e. nothing changes.
             *
             * The modal drops the `hoverScale` ceiling entirely: on a phone the
             * point is to fill the screen, and a 2.6× capsule would leave a
             * postage stamp in the middle of a sheet.
             */
            const fitWidth = (vw - margin * 2) / width
            const fitHeight = (vh - chrome) / itemHeight
            const scale = Math.max(
                1,
                modal
                    ? Math.min(fitWidth, fitHeight)
                    : Math.min(hoverScale, fitWidth, fitHeight)
            )
            const openWidth = width * scale
            const openHeight = itemHeight * scale

            const left = modal
                ? (vw - openWidth) / 2
                : Math.min(
                      Math.max(centerX - openWidth / 2, margin),
                      Math.max(margin, vw - margin - openWidth)
                  )

            let top = modal
                ? MODAL_TOP + (vh - chrome - openHeight) / 2
                : frame.top + mediaCenterY - openHeight / 2
            if (!modal && openHeight < vh - margin * 2) {
                top = Math.min(
                    Math.max(top, margin),
                    vh - margin - openHeight
                )
            }

            const video =
                capsule.querySelector("video") instanceof HTMLVideoElement
                    ? (capsule.querySelector("video") as HTMLVideoElement)
                    : null

            seqRef.current += 1
            return {
                ...item,
                rest: restBox,
                open: { left, top, width: openWidth, height: openHeight },
                videoTime: video ? video.currentTime : 0,
                state: "open",
                seq: seqRef.current,
            }
        },
        [
            rendered,
            widthOf,
            hoverScale,
            itemHeight,
            mediaCenterY,
            modal,
            captions,
            settledRect,
            effectiveScroll,
        ]
    )

    // Re-aim a card at its capsule's settled position at the moment it starts
    // closing. Everything the captured `rest` knew is stale by now — the strip
    // has drifted under it and the neighbours have re-parted around whatever
    // is active next.
    const closeCard = useCallback(
        (card: Card, activeFlat: number | null): Card =>
            card.state === "closing"
                ? card
                : {
                      ...card,
                      state: "closing" as const,
                      rest: settledRect(card.flat, activeFlat) ?? card.rest,
                  },
        [settledRect]
    )

    useLayoutEffect(() => {
        if (isStatic) return
        if (active === null) {
            setCards((prev) =>
                prev.every((card) => card.state === "closing")
                    ? prev
                    : prev.map((card) => closeCard(card, null))
            )
            return
        }
        setCards((prev) => {
            const current = prev.find((card) => card.flat === active)
            if (current && current.state === "open") return prev
            const built = buildCard(active)
            if (!built) return prev
            // Keep at most one outgoing card so a fast sweep across the strip
            // can't pile up clones.
            const closing = prev
                .filter((card) => card.flat !== active)
                .map((card) => closeCard(card, active))
                .slice(-1)
            return [...closing, built]
        })
    }, [active, isStatic, buildCard, closeCard])

    // Geometry is written imperatively rather than through the style prop:
    // React never re-renders these properties, so a re-render mid-transition
    // can't snap the card back to where it started.
    useLayoutEffect(() => {
        if (isStatic) return
        for (const card of cards) {
            const el = cardElements.current.get(card.flat)
            if (!el) continue
            const stamp = `${card.state}:${card.seq}`
            if (el.dataset.applied === stamp) continue
            const caption = captionElements.current.get(card.flat)
            // The element is laid out at its final rect for the whole
            // interaction and only a transform moves it, so not a single frame
            // of the animation touches layout — the compositor can run it on
            // its own thread, away from the drift loop and Framer's runtime.
            const toRest = () => {
                writeRect(el, card.open)
                el.style.transform = invert(card.rest, card.open)
                // Under a scale of s the painted radius is scaled too, so the
                // value that *looks* like a pill is the one that reads as a
                // pill after scaling: half the open height.
                el.style.borderRadius = `${card.open.height / 2}px`
            }
            const toOpen = () => {
                el.style.transform = "none"
                el.style.borderRadius = `${expandedRadius}px`
            }
            if (card.state === "open") {
                if (!el.dataset.applied) {
                    toRest()
                    // Flush the resting values so the transition has a start.
                    void el.offsetWidth
                }
                toOpen()
                el.dataset.open = "true"
                // positionCaption reads offsetHeight, which flushes the
                // caption's closed state — so flipping data-open right after
                // gives it a transition to run instead of popping in.
                positionCaption(
                    caption,
                    card.open,
                    captionGap,
                    viewport,
                    captionInset,
                    modal
                )
                if (caption) caption.dataset.open = "true"
                // Opened from the keyboard: the capsule that had focus is
                // about to be hidden, so hand focus to the card and remember
                // where to give it back.
                if (focusIntentRef.current) {
                    focusIntentRef.current = false
                    returnFocusRef.current = card.flat
                    el.focus({ preventScroll: true })
                }
            } else {
                toRest()
                el.dataset.open = "false"
                if (caption) caption.dataset.open = "false"
            }
            el.dataset.applied = stamp
        }
    }, [
        cards,
        isStatic,
        expandedRadius,
        captionGap,
        viewport,
        captionInset,
        modal,
    ])

    // Give focus back to the capsule the card came from. Without this a
    // keyboard user is dropped on <body> and the next Tab restarts from the
    // top of the document.
    useEffect(() => {
        if (active !== null || returnFocusRef.current === null) return
        const flat = returnFocusRef.current
        returnFocusRef.current = null
        const el = scrollerRef.current?.querySelector(
            `.lollipop-media[data-lollipop-index="${flat}"]`
        )
        if (el instanceof HTMLElement) el.focus({ preventScroll: true })
    }, [active])

    // Retire a closing card once its geometry has finished animating, with a
    // timer as a backstop for tabs that never deliver transitionend.
    useEffect(() => {
        if (!cards.some((card) => card.state === "closing")) return
        const drop = () =>
            setCards((prev) => prev.filter((card) => card.state !== "closing"))
        const timer = setTimeout(drop, CLOSE_MS + 120)
        return () => clearTimeout(timer)
    }, [cards])

    /* ------------------------------------------------------------ keyboard */

    const [focusIndex, setFocusIndex] = useState<number | null>(null)
    const rovingIndex =
        focusIndex !== null && focusIndex >= middleStart && focusIndex < middleEnd
            ? focusIndex
            : middleStart

    const centreOn = useCallback(
        (flat: number) => {
            const scroller = scrollerRef.current
            if (!scroller) return
            const column = scroller.querySelector(
                `[data-lollipop-column="${flat}"]`
            )
            if (!(column instanceof HTMLElement)) return
            // Clamped to the track the three copies actually lay down. A
            // centred target sits half a viewport ahead of its column, which
            // for the outermost columns points past the end — and since the
            // automatic fold stands down while a card is open, nothing else
            // would pull it back.
            const track = copyWidthRef.current * COPIES
            const target = Math.min(
                Math.max(
                    column.offsetLeft +
                        column.offsetWidth / 2 -
                        scroller.clientWidth / 2,
                    0
                ),
                Math.max(0, track - scroller.clientWidth)
            )
            // The rAF loop is what consumes `glideRef`, and it doesn't run
            // under reduced motion — which meant the existing keyboard arrows
            // were silently not scrolling at all for anyone who asks for less
            // movement. Jump instead: no animation is the point.
            if (!runningRef.current) {
                posRef.current = target
                appliedRef.current = target
                scroller.scrollLeft = target
                glideRef.current = null
                wrap()
                return
            }
            glideRef.current = target
        },
        [wrap]
    )

    /**
     * Shift the whole interaction one copy along, invisibly.
     *
     * The strip lays three identical copies down and everything that matters —
     * keyboard focus, the active index, a live card — addresses the middle
     * one. Step off either end of it and the item you want is the twin in a
     * neighbouring copy, so the index has to fold back into the middle. That
     * fold is only invisible if the scroller folds with it: shifting the
     * position by exactly one copy width moves every column by exactly one
     * period, which by construction paints the identical picture.
     *
     * Live cards are re-keyed by the same number of items, because a card
     * closes onto its capsule and would otherwise aim a whole copy away. They
     * are keyed on `seq` in the render, not on `flat`, precisely so this can
     * renumber them without React unmounting and restarting the animation.
     */
    const rebase = useCallback(
        (copies: number) => {
            const el = scrollerRef.current
            const width = copyWidthRef.current
            const span = middleEnd - middleStart
            if (!el || width <= 0 || span <= 0 || copies === 0) return
            const delta = -copies * width
            posRef.current += delta
            appliedRef.current = posRef.current
            el.scrollLeft = posRef.current
            if (glideRef.current !== null) glideRef.current += delta
            const items = -copies * span
            setCards((prev) =>
                prev.length === 0
                    ? prev
                    : prev.map((card) => ({
                          ...card,
                          flat: card.flat + items,
                      }))
            )
            if (activeRef.current !== null) {
                activeRef.current += items
                setActive(activeRef.current)
            }
        },
        [middleStart, middleEnd]
    )

    /**
     * Move the strip's attention one item along: keyboard focus order, the
     * glide that centres it, and — only if a card is already open — the card.
     *
     * One place, because four separate inputs step through the strip now
     * (arrow keys, a sideways wheel, a swipe on the card, a tap on a dot) and
     * they must not each grow their own idea of what "next" means.
     */
    const stepFrom = useCallback(
        (from: number, delta: number) => {
            const span = middleEnd - middleStart
            if (span <= 0) return null
            const raw = from + delta
            // Crossing the end of the middle copy: fold the index back and
            // carry the scroller with it, so the step is one capsule's travel
            // rather than a rewind across the whole strip.
            const copies =
                raw >= middleEnd
                    ? Math.floor((raw - middleStart) / span)
                    : raw < middleStart
                      ? -Math.ceil((middleStart - raw) / span)
                      : 0
            if (copies !== 0) rebase(copies)
            const next = raw - copies * span
            setFocusIndex(next)
            // Before setActiveIndex, so the card is built against the glide
            // target rather than against where the capsule happens to be.
            centreOn(next)
            if (activeRef.current !== null) setActiveIndex(next)
            return next
        },
        [middleStart, middleEnd, rebase, centreOn, setActiveIndex]
    )

    const moveFocus = useCallback(
        (delta: number) => {
            const next = stepFrom(rovingIndex, delta)
            if (next === null) return
            const el = scrollerRef.current?.querySelector(
                `.lollipop-media[data-lollipop-index="${next}"]`
            )
            if (el instanceof HTMLElement) el.focus({ preventScroll: true })
        },
        [rovingIndex, stepFrom]
    )

    /**
     * Step the *open card* to its neighbour — as opposed to `moveFocus`, which
     * steps the keyboard's roving focus and only drags the card along if one
     * happens to be open. A card opened by hover or by a tap has no focus to
     * rove, so this counts from the active item instead.
     */
    const stepActive = useCallback(
        (delta: number) => {
            const from = activeRef.current
            if (from === null) return
            stepFrom(from, delta)
        },
        [stepFrom]
    )

    /** Jump to a given source item — the dots in the modal. */
    const stepToSource = useCallback(
        (source: number) => {
            const from = activeRef.current
            const count = sources.length
            if (from === null || count === 0) return
            // Shortest way round, so tapping the first dot from the last item
            // walks one step forward rather than all the way back.
            const forward = (((source - (from % count)) % count) + count) % count
            const delta = forward > count / 2 ? forward - count : forward
            if (delta !== 0) stepFrom(from, delta)
        },
        [sources.length, stepFrom]
    )

    const onKeyDown = useCallback(
        (event: ReactKeyboardEvent<HTMLDivElement>) => {
            const flat = Number(
                (event.target as Element | null)?.getAttribute?.(
                    "data-lollipop-index"
                )
            )
            switch (event.key) {
                case "ArrowLeft":
                    event.preventDefault()
                    moveFocus(-1)
                    return
                case "ArrowRight":
                    event.preventDefault()
                    moveFocus(1)
                    return
                case "Enter":
                case " ":
                    if (!Number.isInteger(flat)) return
                    event.preventDefault()
                    if (activeRef.current === flat) {
                        setActiveIndex(null)
                    } else {
                        focusIntentRef.current = true
                        setActiveIndex(flat)
                    }
                    return
                case "Escape":
                    setActiveIndex(null)
                    return
                default:
            }
        },
        [moveFocus, setActiveIndex]
    )

    // While a card is open the document owns hover resolution. The card is a
    // fixed element above the strip, so a plain listener on the scroller would
    // never see the pointer once it moved onto the card — and handing off
    // between the two produced a null frame that flickered the frost.
    useEffect(() => {
        if (isStatic || cards.length === 0 || typeof document === "undefined")
            return
        const onMove = (event: PointerEvent) => {
            if (event.pointerType !== "mouse" || draggingRef.current) return
            const last = lastPointRef.current
            if (last.x === event.clientX && last.y === event.clientY) return
            lastPointRef.current = { x: event.clientX, y: event.clientY }
            const openCard = cardsRef.current.find(
                (card) => card.state === "open"
            )
            if (openCard && withinCard(event, openCard.flat, layerRef.current))
                return
            setActiveIndex(indexAtPoint(event.clientX, event.clientY))
        }
        document.addEventListener("pointermove", onMove)
        return () => document.removeEventListener("pointermove", onMove)
    }, [cards.length, isStatic, indexAtPoint, setActiveIndex])

    // Touch has no hover: a tap opens a card and a tap anywhere else closes it.
    useEffect(() => {
        if (isStatic || cards.length === 0 || typeof document === "undefined")
            return
        const onDown = (event: PointerEvent) => {
            if (event.pointerType === "mouse") return
            if (withinCard(event, activeRef.current, layerRef.current)) return
            // The close button and the dots sit outside the card's wrapper, so
            // without this a tap on either would close the card out from under
            // itself — the dot would step and the close would land on nothing.
            if (withinChrome(event, layerRef.current)) return
            closeNow()
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeNow()
                return
            }
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
            // A card opened by hover or by a tap holds no focus, so the
            // scroller's own onKeyDown never sees a thing — which is why the
            // arrows did nothing at all once a card was up. Listening on the
            // document is the only way to reach that state, so guard the two
            // cases where the keys belong to someone else: a card that is
            // already on its way out, and anywhere text is being typed.
            if (!cardsRef.current.some((card) => card.state === "open")) return
            if (isTyping(event.target)) return
            event.preventDefault()
            stepActive(event.key === "ArrowRight" ? 1 : -1)
        }

        /**
         * A sideways trackpad swipe or a tilt wheel steps between cards.
         *
         * Scoped by containment to this instance's own strip or focus layer —
         * both because a page may carry two carousels, and because a
         * horizontal wheel anywhere else on the page is still the page's.
         * Non-passive so it can be prevented: unprevented, a horizontal wheel
         * at the end of a scroll region is browser back-navigation, the same
         * hazard `overscroll-behavior-x` was added for.
         */
        let travel = 0
        let steppedAt = 0
        let movedAt = 0
        const onWheel = (event: WheelEvent) => {
            if (event.ctrlKey) return // pinch zoom
            const dx = normaliseWheel(event.deltaX, event.deltaMode)
            const dy = normaliseWheel(event.deltaY, event.deltaMode)
            if (Math.abs(dx) <= Math.abs(dy)) return
            const target = event.target
            if (!(target instanceof Node)) return
            if (
                !layerRef.current?.contains(target) &&
                !scrollerRef.current?.contains(target)
            )
                return
            event.preventDefault()
            if (!cardsRef.current.some((card) => card.state === "open")) return
            const now = performance.now()
            // Momentum arrives as a long decaying tail of small deltas. One
            // flick has to be one step, so the tail is swallowed wholesale
            // rather than accumulated. Measured against performance.now()
            // rather than a timer, because setTimeout is clamped to a second
            // in a backgrounded tab and this would be untestable.
            if (now - steppedAt < WHEEL_COOLDOWN_MS) return
            // A gap, or a change of direction, starts the count again.
            if (now - movedAt > WHEEL_IDLE_MS) travel = 0
            if (travel !== 0 && Math.sign(dx) !== Math.sign(travel)) travel = 0
            movedAt = now
            travel += dx
            if (Math.abs(travel) < WHEEL_STEP) return
            steppedAt = now
            stepActive(travel > 0 ? 1 : -1)
            travel = 0
        }

        document.addEventListener("pointerdown", onDown)
        document.addEventListener("keydown", onKey)
        document.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            document.removeEventListener("pointerdown", onDown)
            document.removeEventListener("keydown", onKey)
            document.removeEventListener("wheel", onWheel)
        }
    }, [cards.length, isStatic, closeNow, stepActive])

    /* ----------------------------------------------------------- the modal */

    const closeButtonRef = useRef<HTMLButtonElement | null>(null)
    const modalOpen = modal && cards.length > 0

    // A dialog holds the page still behind it. The demo page happens not to
    // scroll, but a buyer's will, and a sheet you can scroll the page under is
    // the giveaway that it isn't really modal. Restores the previous value
    // rather than clearing it, since the host may have set one.
    useEffect(() => {
        if (!modalOpen || typeof document === "undefined") return
        const body = document.body
        const previous = body.style.overflow
        body.style.overflow = "hidden"
        return () => {
            body.style.overflow = previous
        }
    }, [modalOpen])

    /**
     * Record whether the person is currently working by keyboard, and let the
     * layer's CSS key its focus ring off that.
     *
     * `:focus-visible` is meant to answer this, but for *programmatic* focus it
     * is a per-browser heuristic: Safari on iOS treats the dialog's
     * `closeButton.focus()` as visible, Chrome on the desktop does not. So a
     * keyboard affordance was being drawn around the X on every phone that
     * opened a card, and no amount of checking on the desktop would have shown
     * it — it took a real device.
     */
    useEffect(() => {
        if (isStatic || typeof document === "undefined") return
        const mark = (keyboard: boolean) => {
            const layer = layerRef.current
            if (layer) layer.dataset.keyboard = keyboard ? "true" : "false"
        }
        const onKey = (event: KeyboardEvent) => {
            // Modifier presses on their own aren't navigation.
            if (event.metaKey || event.ctrlKey || event.altKey) return
            mark(true)
        }
        const onPointer = () => mark(false)
        document.addEventListener("keydown", onKey, true)
        document.addEventListener("pointerdown", onPointer, true)
        return () => {
            document.removeEventListener("keydown", onKey, true)
            document.removeEventListener("pointerdown", onPointer, true)
        }
    }, [isStatic])

    // Focus enters the dialog when it opens and goes back to the capsule when
    // it closes, through the same return path a keyboard expand uses. Only on
    // the opening edge: re-running it per step would be harmless but pointless,
    // and the close button never unmounts between steps.
    const modalWasOpen = useRef(false)
    useEffect(() => {
        if (modalOpen === modalWasOpen.current) return
        modalWasOpen.current = modalOpen
        if (!modalOpen) return
        if (activeRef.current !== null)
            returnFocusRef.current = activeRef.current
        closeButtonRef.current?.focus({ preventScroll: true })
    }, [modalOpen])

    /* ---------------------------------------------------------- drag to pan */

    useEffect(() => {
        const el = scrollerRef.current
        if (!el || isStatic) return

        let down = false
        let startX = 0
        let startScroll = 0
        let travelled = 0
        let pointerId = -1
        let tapIndex: number | null = null
        let tapType = "mouse"
        let slop = DRAG_SLOP
        // Throw velocity, in scroll pixels per second. Sampled continuously
        // and smoothed, so the number handed to the loop is the speed of the
        // gesture rather than of its last stuttering frame.
        let throwSpeed = 0
        let lastX = 0
        let lastAt = 0

        const onDown = (event: PointerEvent) => {
            if (event.pointerType === "mouse" && event.button !== 0) return
            down = true
            travelled = 0
            startX = event.clientX
            startScroll = el.scrollLeft
            pointerId = event.pointerId
            tapType = event.pointerType
            // A finger is not a mouse; see dragSlopFor.
            slop = dragSlopFor(event.pointerType)
            throwSpeed = 0
            lastX = event.clientX
            lastAt = performance.now()
            tapIndex = indexAtPoint(event.clientX, event.clientY)

            if (event.pointerType !== "mouse") {
                // Touch scrolls natively (see touchAction). All this has to do
                // is hold the drift still so the loop isn't writing scrollLeft
                // underneath the finger, and remember enough to tell a tap from
                // a scroll when the finger comes up.
                touchingRef.current = true
                glideRef.current = null
                flingRef.current = null
                return
            }

            draggingRef.current = true
            glideRef.current = null
            flingRef.current = null
            // Guarded the same way the release below is. Capture throws if the
            // pointer is no longer active by the time we ask — which a real
            // gesture can do at the edge of the viewport, and which would
            // otherwise abandon the rest of this handler and leave the cursor
            // wrong for the whole drag.
            try {
                el.setPointerCapture?.(pointerId)
            } catch {}
            el.style.cursor = "grabbing"
        }

        const onMove = (event: PointerEvent) => {
            if (!down || tapType !== "mouse") return
            const dx = event.clientX - startX
            travelled = Math.max(travelled, Math.abs(dx))
            posRef.current = startScroll - dx
            appliedRef.current = posRef.current
            el.scrollLeft = posRef.current
            // Wrap here rather than waiting on the scroll event, and shift our
            // own baseline by the same amount so the drag doesn't jump.
            startScroll += wrap()
            if (travelled > slop) setActiveIndex(null)

            const now = performance.now()
            const elapsed = now - lastAt
            // Content moving left is the scroller moving right, hence the sign.
            if (elapsed > 0) {
                const sample = (-(event.clientX - lastX) / elapsed) * 1000
                // Exponentially weighted, so a single jittery frame at the end
                // of a swipe can't decide the whole throw.
                throwSpeed = throwSpeed === 0 ? sample : throwSpeed * 0.7 + sample * 0.3
                lastX = event.clientX
                lastAt = now
            }
        }

        const onUp = (event?: PointerEvent) => {
            if (!down) return
            down = false

            if (tapType !== "mouse") {
                // A tap on touch is the equivalent of a hover: open that card,
                // or close the one already open. It counts as a tap only if
                // neither the finger nor the strip went anywhere — the strip
                // matters because the browser is scrolling it now, and a flick
                // that barely moves the finger can still send it a long way.
                const moved =
                    event && Math.abs(event.clientX - startX) > slop
                const scrolled = Math.abs(el.scrollLeft - startScroll) > slop
                if (!moved && !scrolled) {
                    setActiveIndex(
                        tapIndex !== null && activeRef.current !== tapIndex
                            ? tapIndex
                            : null
                    )
                }
                // The drift stays held until the scroll goes quiet — momentum
                // is still running at this point, and resuming into it would
                // fight it exactly the way the old drag did.
                settleTouch()
                return
            }

            draggingRef.current = false
            if (pointerId !== -1) {
                try {
                    el.releasePointerCapture?.(pointerId)
                } catch {}
                pointerId = -1
            }
            el.style.cursor = ""
            // Let go mid-swipe and the strip should carry on and ease back into
            // its drift, the way a thrown thing does. The component drives
            // scrollLeft from its own accumulator, so the platform's momentum
            // was bypassed to stop the two fighting — and until now nothing was
            // put back in its place: every swipe stopped dead on release.
            if (
                travelled > slop &&
                Math.abs(throwSpeed) > MIN_FLING_SPEED
            ) {
                flingRef.current = Math.max(
                    -MAX_FLING_SPEED,
                    Math.min(MAX_FLING_SPEED, throwSpeed)
                )
            }
        }

        // Swallow the click that ends a drag, so a dragged capsule never reads
        // as a tap on whatever was underneath the cursor.
        const onClick = (event: MouseEvent) => {
            if (travelled > slop) {
                event.preventDefault()
                event.stopPropagation()
                travelled = 0
            }
        }

        // The browser takes the gesture over the moment it decides this is a
        // scroll, and cancels the pointer. That is not a tap, and the strip is
        // now moving under its own steam.
        const onCancel = () => {
            if (!down) return
            down = false
            if (tapType !== "mouse") {
                settleTouch()
                return
            }
            draggingRef.current = false
            el.style.cursor = ""
        }

        const onDragStart = (event: Event) => event.preventDefault()

        el.addEventListener("pointerdown", onDown)
        el.addEventListener("pointermove", onMove)
        el.addEventListener("pointerup", onUp)
        el.addEventListener("pointercancel", onCancel)
        el.addEventListener("click", onClick, true)
        el.addEventListener("dragstart", onDragStart)
        return () => {
            el.removeEventListener("pointerdown", onDown)
            el.removeEventListener("pointermove", onMove)
            el.removeEventListener("pointerup", onUp)
            el.removeEventListener("pointercancel", onCancel)
            el.removeEventListener("click", onClick, true)
            el.removeEventListener("dragstart", onDragStart)
        }
    }, [isStatic, setActiveIndex, measured, wrap, indexAtPoint, settleTouch])

    /* --------------------------------------------------------- auto-scroll */

    const [documentHidden, setDocumentHidden] = useState(false)
    const [reducedMotion, setReducedMotion] = useState(false)

    useEffect(() => {
        if (typeof document === "undefined") return
        const sync = () => setDocumentHidden(document.hidden)
        sync()
        document.addEventListener("visibilitychange", sync)
        return () => document.removeEventListener("visibilitychange", sync)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReducedMotion(query.matches)
        sync()
        query.addEventListener?.("change", sync)
        return () => query.removeEventListener?.("change", sync)
    }, [])

    // The drift also holds while a card is on its way back down, not just
    // while one is open. Resuming at the moment hover ends meant the strip
    // slid out from under a card that still had its whole close ahead of it,
    // so it landed beside its capsule instead of on it — read as a glitch,
    // and the more so the slower and softer the close became.
    //
    // Holding through the settle is not a preference — a card has to land on
    // its own capsule, and it cannot if the strip slides out from under it.
    const settling = cards.some((card) => card.state === "closing")
    const paused = documentHidden || active !== null || settling
    const pausedRef = useRef(paused)
    pausedRef.current = paused

    // Stop dead the moment a card opens. Easing to a halt kept the strip
    // moving for ~200ms under a pointer that had already chosen an item, and
    // the card is anchored to where the capsule was at that instant.
    const hardStopRef = useRef(false)
    useEffect(() => {
        if (active !== null) hardStopRef.current = true
    }, [active])

    const targetSpeed = speed * (direction === "Right" ? -1 : 1)
    const targetRef = useRef(targetSpeed)
    targetRef.current = targetSpeed

    const running =
        !isStatic && measured && !reducedMotion && copyWidth > 0
    runningRef.current = running

    useEffect(() => {
        if (!running) return
        let raf = 0
        let last = performance.now()
        let velocity = 0

        const tick = (now: number) => {
            const dt = Math.min(now - last, 64) / 1000
            last = now
            const el = scrollerRef.current
            // While the browser is scrolling this element — finger down, or
            // momentum still running — the loop must not write scrollLeft at
            // all. Not "write zero": not write. Two owners of one property is
            // what made a swipe feel like it was fighting back.
            if (el && touchingRef.current) {
                velocity = 0
                raf = requestAnimationFrame(tick)
                return
            }
            if (el) {
                if (hardStopRef.current) {
                    velocity = 0
                    hardStopRef.current = false
                }
                // A throw seeds the velocity directly and is then left to the
                // same ease as everything else — no separate decay maths, and
                // the strip lands back on its drift rather than stopping and
                // starting again.
                if (flingRef.current !== null) {
                    velocity = flingRef.current
                    flingRef.current = null
                }
                // Ease toward the target rather than snapping, so resuming
                // glides back up to speed instead of jolting.
                const goal = pausedRef.current ? 0 : targetRef.current
                // Coasting gets a long time constant and everything else the
                // short one. At 0.12s a throw would be spent inside a fifth of
                // a second, which reads as the strip being caught rather than
                // released; the drift's own resume still wants to be brisk.
                const coasting =
                    Math.abs(velocity) > Math.abs(goal) * 1.5 + FLING_FLOOR
                velocity +=
                    (goal - velocity) *
                    (1 - Math.exp(-dt / (coasting ? 0.45 : 0.12)))
                let moved = false
                if (glideRef.current !== null) {
                    const remaining = glideRef.current - posRef.current
                    if (Math.abs(remaining) < 0.5) {
                        posRef.current = glideRef.current
                        glideRef.current = null
                    } else {
                        posRef.current +=
                            remaining * (1 - Math.exp(-dt / 0.14))
                    }
                    moved = true
                } else if (Math.abs(velocity) > 0.01) {
                    posRef.current += velocity * dt
                    moved = true
                }
                if (moved) {
                    appliedRef.current = posRef.current
                    el.scrollLeft = posRef.current
                    wrap()
                }
            }
            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [running, wrap])

    /* --------------------------------------------------------------- video */

    // Only play what's actually on screen; a strip of a dozen looping videos
    // will happily saturate a laptop otherwise.
    const [inView, setInView] = useState<Set<string>>(() => new Set())

    // Without an observer we can't tell what's on screen, so play everything
    // rather than silently leaving every video frozen on its poster.
    const playAllVideos =
        !isStatic && typeof IntersectionObserver === "undefined"

    useEffect(() => {
        const el = scrollerRef.current
        if (!el || isStatic || typeof IntersectionObserver === "undefined")
            return
        const observer = new IntersectionObserver(
            (entries) => {
                setInView((prev) => {
                    const next = new Set(prev)
                    let changed = false
                    for (const entry of entries) {
                        const key = entry.target.getAttribute(
                            "data-lollipop-video"
                        )
                        if (!key) continue
                        if (entry.isIntersecting && !next.has(key)) {
                            next.add(key)
                            changed = true
                        } else if (!entry.isIntersecting && next.has(key)) {
                            next.delete(key)
                            changed = true
                        }
                    }
                    return changed ? next : prev
                })
            },
            { root: el, threshold: 0.1 }
        )
        el.querySelectorAll("[data-lollipop-video]").forEach((node) =>
            observer.observe(node)
        )
        return () => observer.disconnect()
        // `measured` matters: capsules don't mount until it flips, so without
        // it this runs once against an empty scroller, observes nothing, and no
        // video ever plays.
    }, [isStatic, measured, rendered.length])

    /* -------------------------------------------------------------- render */

    // Sizing the parting off the active item used to make the interaction
    // unstable — the hovered capsule slid out from under the cursor — but the
    // pointer now rests on a fixed card that cannot move, so the constraint
    // is gone. `settledRect` reads the same helper, so a closing card and the
    // strip it is returning to can never disagree about where the gap is.
    const spread = spreadFor(active)

    // A soft editorial lift, not a drop shadow. On a dark surface a drop
    // shadow reads as nothing at all, so the light theme's shadow is swapped
    // for a hairline rim plus a deeper, softer pool.
    const boxShadow = shadow ? (isDark ? SHADOW_DARK : SHADOW_LIGHT) : "none"
    const cardShadow = shadow
        ? isDark
            ? CARD_SHADOW_DARK
            : CARD_SHADOW_LIGHT
        : "none"

    if (sources.length === 0) {
        // The first thing an author sees on a fresh instance — so it uses the
        // same tokens and typeface as everything else rather than the
        // hardcoded grey it shipped with.
        return (
            <div
                style={{
                    ...style,
                    ...emptyStyle,
                    background: placeholderTint,
                    color: descriptionColor,
                    fontFamily: FALLBACK_FONT,
                }}
            >
                Add items to the Lollipop Carousel
            </div>
        )
    }

    const captionStyle = { fontFamily: FALLBACK_FONT }
    const tagFontSize = Math.max(
        10,
        Math.round(0.85 * (toPx(bodyFont?.fontSize) || 13))
    )

    const renderCaption = (item: Placed) =>
        !captions || !item.title ? null : (
            <>
                <div
                    style={{
                        ...titleFont,
                        color: titleColor,
                        // Nothing is pinned any more, so a long title simply
                        // takes the lines it needs instead of being forced
                        // through a narrow column. `break-word` is still the
                        // last resort for a single unbreakable word.
                        overflowWrap: "break-word",
                    }}
                >
                    {item.title}
                </div>
                {item.description ? (
                    <p
                        style={{
                            margin: "8px 0 0 0",
                            ...bodyFont,
                            color: descriptionColor,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {item.description}
                    </p>
                ) : null}
                {item.tags.length > 0 ? (
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            marginTop: 12,
                        }}
                    >
                        {item.tags.map((tag, i) => (
                            <span
                                key={i}
                                style={{
                                    ...bodyFont,
                                    // Derived, not literal: a hardcoded
                                    // 11px meant changing the Body size
                                    // moved the description and left the
                                    // pills behind.
                                    fontSize: tagFontSize,
                                    lineHeight: `${tagFontSize + 5}px`,
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    background: tagBackground,
                                    color: tagColor,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                ) : null}
            </>
        )

    // Which of the source items is showing, for the dots. The strip repeats the
    // list, so every capsule's flat index reduces to its source by the length
    // of that list.
    const activeSource =
        active === null || sources.length === 0
            ? null
            : ((active % sources.length) + sources.length) % sources.length

    /**
     * Swipe the open card to move along the strip.
     *
     * Measured on release against a threshold rather than tracked live: the
     * card's `transform` is the FLIP invert and belongs to the open/close
     * transition, so writing a drag offset into it would fight whatever is
     * already running there.
     */
    const swipeRef = useRef<{ id: number; x: number; y: number } | null>(null)
    const onCardPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!modal || event.pointerType === "mouse") return
        swipeRef.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
        }
    }
    const onCardPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        const start = swipeRef.current
        swipeRef.current = null
        if (!start || start.id !== event.pointerId) return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        if (Math.abs(dx) < SWIPE_STEP || Math.abs(dx) <= Math.abs(dy)) return
        // Dragging the picture leftwards pulls the next one in behind it.
        stepActive(dx < 0 ? 1 : -1)
    }

    const focusLayer =
        isStatic || typeof document === "undefined" || cards.length === 0
            ? null
            : createPortal(
                  <div
                      className="lollipop-layer"
                      ref={layerRef}
                      data-modal={modal ? "true" : "false"}
                      role={modal ? "dialog" : undefined}
                      aria-modal={modal ? true : undefined}
                      aria-label={
                          modal
                              ? active !== null
                                  ? rendered[active]?.title || "Expanded media"
                                  : "Expanded media"
                              : undefined
                      }
                      style={clock}
                  >
                      {/* The sheet. First child, so it paints under the card
                          without needing a z-index — and so the card is the
                          only thing above it. A flat fill, not a blur: this is
                          the page's own surface colour brought forward, which
                          keeps the phone free of the one effect DECISIONS #26
                          took off the desktop. */}
                      {modal ? (
                          <div
                              className="lollipop-sheet"
                              data-open={
                                  cards.some((card) => card.state === "open")
                                      ? "true"
                                      : "false"
                              }
                              style={{ background: sheetColor }}
                              onPointerDown={closeNow}
                          />
                      ) : null}
                      {/* No backdrop pane. A full-viewport blur under a
                          moving card was both the heaviest thing on the page
                          and, in Hendri's words, worse to interact with — the
                          strip now recedes by fading its own capsules back
                          instead, which reads as depth rather than as a
                          scrim. See DECISIONS #26. */}
                      {cards.map((card) => (
                          // Keyed on `seq`, not on `flat`: `rebase` renumbers a
                          // live card when the strip folds a copy, and keying on
                          // the index would unmount it mid-flight and restart the
                          // animation from its resting rect.
                          <div
                              key={card.seq}
                              data-lollipop-card={card.flat}
                              onPointerDown={onCardPointerDown}
                              onPointerUp={onCardPointerUp}
                              onPointerCancel={() => {
                                  swipeRef.current = null
                              }}
                          >
                              <CardMedia
                                  card={card}
                                  shadow={cardShadow}
                                  tint={placeholderTint}
                                  describedBy={
                                      captions && card.title
                                          ? `lollipop-caption-${card.flat}`
                                          : undefined
                                  }
                                  register={(el) => {
                                      if (el)
                                          cardElements.current.set(
                                              card.flat,
                                              el
                                          )
                                      else
                                          cardElements.current.delete(
                                              card.flat
                                          )
                                  }}
                              />
                              {captions && card.title ? (
                                  <div
                                      className="lollipop-caption"
                                      id={`lollipop-caption-${card.flat}`}
                                      style={captionStyle}
                                      ref={(el) => {
                                          if (el)
                                              captionElements.current.set(
                                                  card.flat,
                                                  el
                                              )
                                          else
                                              captionElements.current.delete(
                                                  card.flat
                                              )
                                      }}
                                  >
                                      {renderCaption(card)}
                                  </div>
                              ) : null}
                          </div>
                      ))}
                      {/* Last, so it paints above the card. Held in the layer
                          rather than in each card's wrapper: it must not blink
                          out and back as one card retires and the next opens
                          while stepping. */}
                      {modal ? (
                          <div
                              className="lollipop-chrome"
                              data-lollipop-chrome="true"
                              data-open={
                                  cards.some((card) => card.state === "open")
                                      ? "true"
                                      : "false"
                              }
                          >
                              <button
                                  ref={closeButtonRef}
                                  type="button"
                                  className="lollipop-close"
                                  aria-label="Close"
                                  onClick={closeNow}
                                  style={{ color: titleColor }}
                              >
                                  <svg
                                      width="18"
                                      height="18"
                                      viewBox="0 0 18 18"
                                      aria-hidden="true"
                                      focusable="false"
                                  >
                                      <path
                                          d="M3 3 L15 15 M15 3 L3 15"
                                          stroke="currentColor"
                                          strokeWidth="1.6"
                                          strokeLinecap="round"
                                          fill="none"
                                      />
                                  </svg>
                              </button>
                              {sources.length > 1 ? (
                                  <div
                                      className="lollipop-dots"
                                      role="group"
                                      aria-label="Choose an item"
                                  >
                                      {sources.map((item, index) => (
                                          <button
                                              key={item.key}
                                              type="button"
                                              className="lollipop-dot"
                                              data-on={
                                                  index === activeSource
                                                      ? "true"
                                                      : "false"
                                              }
                                              aria-label={
                                                  item.title ||
                                                  `Item ${index + 1}`
                                              }
                                              aria-current={
                                                  index === activeSource
                                              }
                                              onClick={() =>
                                                  stepToSource(index)
                                              }
                                              style={{ color: titleColor }}
                                          >
                                              <span aria-hidden="true" />
                                          </button>
                                      ))}
                                  </div>
                              ) : null}
                          </div>
                      ) : null}
                  </div>,
                  document.body
              )

    return (
        <div ref={rootRef} style={{ ...style, ...rootStyle }}>
            <style>{styleSheet}</style>
            {/* The strip sits at the top of a taller block so that the empty
                caption room below it is centred along with the strip, rather
                than the strip centring on its own and the caption running off
                the bottom into whatever the page has down there. */}
            <div style={{ width: "100%", height: blockHeight }}>
            <div
                ref={scrollerRef}
                className="lollipop-scroller"
                // Holds column layer promotion for the card's whole lifetime —
                // keying will-change off [data-parting] alone demoted the
                // layers mid-close the moment parting flipped false.
                data-focus={cards.length > 0 ? "true" : "false"}
                role="region"
                aria-label="Media carousel"
                aria-roledescription="carousel"
                style={{
                    ...scrollerStyle,
                    ...clock,
                    height: band,
                    cursor: isStatic ? "default" : "grab",
                }}
                onScroll={isStatic ? undefined : onScroll}
                onPointerMove={isStatic ? undefined : onStripPointerMove}
                onPointerLeave={isStatic ? undefined : onStripPointerLeave}
                onKeyDown={isStatic ? undefined : onKeyDown}
            >
                {/* Hold the real capsules back until every aspect ratio is in
                    — mounting at a guessed 1:1 would make each one visibly
                    resize the moment its real size landed. A skeleton stands
                    in meanwhile, because on a one-screen page the strip *is*
                    the content and an empty band reads as broken. */}
                {!measured
                    ? SKELETON_RATIOS.map((ratio, i) => (
                          <div
                              // Namespaced so React cannot reuse these nodes
                              // for the real capsules, whose keys are plain
                              // indices too. It did, and the consequence was
                              // that the first twelve capsules *transitioned*
                              // their width from the skeleton's placeholder
                              // ratio to their true one — the exact visible
                              // resize the off-DOM measurement pass exists to
                              // prevent (DECISIONS #16, #18).
                              key={`skeleton-${i}`}
                              className="lollipop-column"
                              aria-hidden="true"
                              style={{
                                  width: Math.round(itemHeight * ratio),
                                  height: band,
                                  marginRight: gap,
                              }}
                          >
                              <div
                                  className="lollipop-media"
                                  style={{
                                      top: mediaCenterY - itemHeight / 2,
                                      left: 0,
                                      width: Math.round(itemHeight * ratio),
                                      height: itemHeight,
                                      borderRadius: 999,
                                      background: placeholderTint,
                                  }}
                              />
                          </div>
                      ))
                    : rendered.map((item) => {
                          const isActive = item.flat === active
                          const width = widthOf(item.key)
                          const focusable =
                              item.flat >= middleStart && item.flat < middleEnd

                          // Everything that isn't the active capsule slides
                          // away from it, so nothing has to reflow.
                          const shift =
                              active === null || isActive
                                  ? 0
                                  : item.flat < active
                                    ? -spread
                                    : spread

                          // Four states, and they need different opacity
                          // clocks rather than different values on one:
                          // `hidden` vanishes fast under the card that
                          // replaced it, `returning` waits for that card to
                          // land before fading back, and `dim`/`lit` are the
                          // neighbours receding and coming back.
                          const state = hiddenInStrip.has(item.flat)
                              ? "hidden"
                              : returningInStrip.has(item.flat)
                                ? "returning"
                                : active !== null
                                  ? "dim"
                                  : "lit"
                          // A capsule returning while another card is open
                          // belongs with the other neighbours, not at full
                          // strength — it is behind something now too.
                          const restingOpacity =
                              active !== null ? dimOpacity : 1

                          const capsuleStyle: CSSProperties = {
                              top: mediaCenterY - itemHeight / 2,
                              left: 0,
                              width,
                              height: itemHeight,
                              borderRadius: 999,
                              boxShadow,
                              background: placeholderTint,
                              // Hidden with opacity rather than `visibility`
                              // so it stays focusable — a keyboard expand used
                              // to drop focus onto <body> the moment the
                              // capsule went `visibility: hidden`.
                              opacity:
                                  state === "hidden" ? 0 : restingOpacity,
                              pointerEvents: hiddenInStrip.has(item.flat)
                                  ? "none"
                                  : "auto",
                          }
                          const tabIndex = focusable
                              ? item.flat === rovingIndex
                                  ? 0
                                  : -1
                              : -1
                          const onFocus = focusable
                              ? () => setFocusIndex(item.flat)
                              : undefined
                          const media = (
                              <Media
                                  item={item}
                                  sizes={`${Math.round(width * hoverScale)}px`}
                                  videoKey={String(item.flat)}
                                  playing={
                                      !isStatic &&
                                      !hiddenInStrip.has(item.flat) &&
                                      (playAllVideos ||
                                          inView.has(String(item.flat)))
                                  }
                              />
                          )

                          return (
                              <div
                                  key={item.flat}
                                  className="lollipop-column"
                                  data-lollipop-column={item.flat}
                                  data-parting={
                                      active !== null ? "true" : "false"
                                  }
                                  style={{
                                      width,
                                      height: band,
                                      marginRight: gap,
                                      transform: `translate3d(${shift}px, 0, 0)`,
                                  }}
                              >
                                  {item.link ? (
                                      <a
                                          className="lollipop-media"
                                          data-lollipop-index={item.flat}
                                          data-state={state}
                                          href={item.link}
                                          aria-label={
                                              focusable
                                                  ? item.title ||
                                                    item.alt ||
                                                    undefined
                                                  : undefined
                                          }
                                          aria-hidden={!focusable}
                                          tabIndex={tabIndex}
                                          onFocus={onFocus}
                                          style={capsuleStyle}
                                      >
                                          {media}
                                      </a>
                                  ) : (
                                      <div
                                          className="lollipop-media"
                                          data-lollipop-index={item.flat}
                                          data-state={state}
                                          // The loop lays down three copies of
                                          // the list. Exposing all of them
                                          // announced every item three times;
                                          // only the middle copy is real as far
                                          // as assistive tech is concerned.
                                          role={focusable ? "button" : undefined}
                                          aria-hidden={!focusable}
                                          aria-label={
                                              focusable
                                                  ? item.title ||
                                                    item.alt ||
                                                    undefined
                                                  : undefined
                                          }
                                          aria-expanded={
                                              focusable ? isActive : undefined
                                          }
                                          tabIndex={tabIndex}
                                          onFocus={onFocus}
                                          style={capsuleStyle}
                                      >
                                          {media}
                                      </div>
                                  )}
                              </div>
                          )
                      })}
            </div>
            </div>
            {/* Focus lands on the card and the card is described by its
                caption, which covers keyboard users. This covers the ones who
                opened it with a pointer or a tap. */}
            <div className="lollipop-sr" aria-live="polite">
                {active !== null && rendered[active]?.title
                    ? `${rendered[active].title}, expanded`
                    : ""}
            </div>
            {focusLayer}
        </div>
    )
}

/* -------------------------------------------------------------------- gifs */

function isGif(url: string | undefined) {
    if (!url) return false
    // The URL usually carries a query, so test the path rather than the end.
    return /\.gif(\?|$)/i.test(url)
}

/**
 * Rewrite a GIF so it loops forever.
 *
 * A GIF only repeats if it carries a NETSCAPE2.0 application-extension block
 * naming a loop count, and `0` there means "forever". A file with **no such
 * block plays exactly once** — which is the spec-correct behaviour, and why a
 * GIF that loops happily in Finder or Photoshop can stop dead in a browser.
 * Plenty of export tools omit it.
 *
 * There is no way to restart an animated GIF in an `<img>` from script, so the
 * fix is upstream of the decoder: insert the block (or zero an existing
 * counter) and hand the browser the patched bytes. Nineteen bytes, native
 * decoding, no canvas and no per-frame work.
 */
function forceGifLoop(bytes: Uint8Array): Uint8Array | null {
    const magic = String.fromCharCode(...bytes.subarray(0, 6))
    if (magic !== "GIF87a" && magic !== "GIF89a") return null

    // Header (6) + logical screen descriptor (7), then the global colour
    // table if the packed field says there is one. Everything else follows.
    let start = 13
    const packed = bytes[10]
    if (packed & 0x80) start += 3 * (1 << ((packed & 7) + 1))

    for (let i = start; i < bytes.length - 17; i++) {
        if (bytes[i] !== 0x21 || bytes[i + 1] !== 0xff) continue
        const name = String.fromCharCode(...bytes.subarray(i + 3, i + 14))
        if (name !== "NETSCAPE2.0") continue
        const sub = i + 14
        if (bytes[sub] >= 3 && bytes[sub + 1] === 1) {
            const out = bytes.slice()
            out[sub + 2] = 0 // loop count, little-endian
            out[sub + 3] = 0
            return out
        }
    }

    const block = new Uint8Array([
        0x21, 0xff, 0x0b, 0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45,
        0x32, 0x2e, 0x30, 0x03, 0x01, 0x00, 0x00, 0x00,
    ])
    const out = new Uint8Array(bytes.length + block.length)
    out.set(bytes.subarray(0, start), 0)
    out.set(block, start)
    out.set(bytes.subarray(start), start + block.length)
    return out
}

/**
 * One entry per GIF, shared by everything that needs it.
 *
 * Keyed on the *promise*, not the result: the strip lays down three copies of
 * the list and the focus card clones a fourth, so a dozen elements mount in
 * the same tick and would every one of them miss a results-only cache and
 * patch their own copy. (Measured: fifteen elements, fifteen blob URLs, ~2MB
 * retained for one 148KB GIF.)
 *
 * It carries the dimensions as well as the URL because a GIF states its own
 * size in the logical screen descriptor — so the aspect-ratio pass can read
 * them from these bytes instead of downloading the file a second time. It
 * genuinely was a second time: an `<img>` load is a no-cors request and
 * `fetch` is a cors one, and the two do not share a cache entry.
 */
const GIF_LOOPS = new Map<
    string,
    Promise<{ url: string; width: number; height: number }>
>()

function loopingGif(src: string) {
    let pending = GIF_LOOPS.get(src)
    if (pending) return pending
    pending = fetch(src)
        .then((response) =>
            response.ok
                ? response.arrayBuffer()
                : Promise.reject(new Error(String(response.status)))
        )
        .then((buffer) => {
            const bytes = new Uint8Array(buffer)
            const patched = forceGifLoop(bytes)
            if (!patched) throw new Error("not a gif")
            return {
                // Deliberately never revoked: one URL is shared by every copy
                // and by the focus card, so revoking on a single unmount would
                // blank the others. The map is bounded by the number of
                // distinct GIFs on the page.
                // `.buffer` rather than the view: TypeScript's Uint8Array is
                // generic over ArrayBufferLike, which admits SharedArrayBuffer
                // and so is not a BlobPart. Both of forceGifLoop's return
                // paths allocate their own exact-length buffer, so handing the
                // buffer over is the same bytes, not a wider window onto them.
                url: URL.createObjectURL(
                    new Blob([patched.buffer as ArrayBuffer], {
                        type: "image/gif",
                    })
                ),
                // Logical screen descriptor, little-endian.
                width: bytes[6] | (bytes[7] << 8),
                height: bytes[8] | (bytes[9] << 8),
            }
        })
    // Drop a failure from the cache so a transient network error doesn't pin
    // this GIF to "unpatched" for the page's lifetime.
    pending.catch(() => GIF_LOOPS.delete(src))
    GIF_LOOPS.set(src, pending)
    return pending
}

/**
 * Returns a looping blob URL for a GIF, or undefined for anything else and
 * while the rewrite is in flight. On any failure the caller keeps the original
 * URL, so the worst case is the play-once behaviour we started with.
 */
function useLoopingGif(src: string | undefined, enabled: boolean) {
    const [looping, setLooping] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (!enabled || !isGif(src) || !src || typeof fetch === "undefined") {
            setLooping(undefined)
            return
        }
        let cancelled = false
        loopingGif(src)
            .then(({ url }) => {
                if (!cancelled) setLooping(url)
            })
            .catch(() => {
                // Cross-origin without CORS, offline, or not really a GIF.
                if (!cancelled) setLooping(undefined)
            })
        return () => {
            cancelled = true
        }
    }, [src, enabled])

    return looping
}

/* ------------------------------------------------------------------ media */

function Media({
    item,
    playing,
    videoKey,
    startAt,
    sizes,
}: {
    item: Placed
    playing: boolean
    /**
     * The widest this image will ever be *displayed*, in CSS px — which is the
     * expanded card, not the capsule. Without it the browser assumes `100vw`
     * and takes the largest candidate in the srcSet regardless of how small
     * the element is. Deliberately the card's width rather than the capsule's,
     * so hovering never triggers a second, larger fetch mid-animation.
     */
    sizes?: string
    videoKey?: string
    startAt?: number
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null)

    useEffect(() => {
        const el = videoRef.current
        if (!el) return
        if (startAt && Number.isFinite(startAt) && el.currentTime === 0) {
            try {
                el.currentTime = startAt
            } catch {}
        }
        if (playing) {
            const attempt = el.play()
            if (attempt && typeof attempt.catch === "function")
                attempt.catch(() => {})
        } else {
            el.pause()
        }
    }, [playing, startAt])

    // Rewritten so it repeats; undefined for everything that isn't a GIF, and
    // while the rewrite is in flight (the original shows meanwhile). Static
    // renders (canvas, export) keep the original bytes — a looping GIF is a
    // continuous effect, and the fetch is pointless there.
    const staticRender = useIsStaticRenderer()
    const loopingGif = useLoopingGif(item.src, !staticRender)

    if (item.video) {
        return (
            <video
                ref={videoRef}
                data-lollipop-video={videoKey}
                src={item.video}
                poster={item.src}
                muted
                loop
                playsInline
                preload="metadata"
                style={mediaFill}
            />
        )
    }

    if (item.src) {
        return (
            <img
                // A looping GIF, once rewritten, is a single blob URL — a
                // srcSet alongside it would just win and undo the looping.
                // When a srcSet *is* present `src` is only the fallback, but
                // the browser fetches it as well unless it is one of the
                // candidates, which quietly doubled the payload with a
                // full-size original per image. Point it at the smallest
                // candidate: the measurement pass has already cached that one.
                src={
                    loopingGif ||
                    (item.srcSet ? item.probe || item.src : item.src)
                }
                srcSet={loopingGif ? undefined : item.srcSet}
                sizes={!loopingGif && item.srcSet ? sizes : undefined}
                alt={item.alt}
                draggable={false}
                // Neither lazy nor async-decoded, deliberately. The
                // aspect-ratio pass has already fetched every source before
                // the strip mounts, so lazy saves nothing and only risks a
                // capsule popping in as the strip drifts it into view — and
                // an async decode lets the first frame paint without the
                // artwork, which is exactly the blank-then-pop we measured
                // aspect ratios up front to avoid.
                decoding="sync"
                style={mediaFill}
            />
        )
    }

    return null
}

/** The expanded card in the focus layer — a fixed clone of the capsule. */
function CardMedia({
    card,
    shadow,
    tint,
    describedBy,
    register,
}: {
    card: Card
    shadow: string
    tint: string
    describedBy?: string
    register: (el: HTMLElement | null) => void
}) {
    const media = (
        <Media
            item={card}
            playing
            startAt={card.videoTime}
            sizes={`${Math.round(card.open.width)}px`}
        />
    )
    const style: CSSProperties = { boxShadow: shadow, background: tint }
    const label = card.title || card.alt || undefined
    if (card.link) {
        return (
            <a
                ref={register}
                className="lollipop-focus-card"
                data-lollipop-index={card.flat}
                href={card.link}
                aria-label={label}
                aria-describedby={describedBy}
                style={style}
            >
                {media}
            </a>
        )
    }
    return (
        <div
            ref={register}
            className="lollipop-focus-card"
            data-lollipop-index={card.flat}
            // Focusable programmatically so a keyboard expand has somewhere to
            // land, but never a tab stop of its own.
            tabIndex={-1}
            role="group"
            aria-label={label}
            aria-describedby={describedBy}
            style={style}
        >
            {media}
        </div>
    )
}

/* --------------------------------------------------------------- helpers */

/** Font control sizes arrive as a number or a "13px" string. */
function toPx(value: unknown): number {
    if (typeof value === "number") return value
    if (typeof value === "string") return parseFloat(value) || 0
    return 0
}

/**
 * How far the caption is inset from the card's box.
 *
 * Text set flush to the card's left edge *measures* aligned and *looks*
 * wrong: the nearest part of the card to the caption is the bottom-left
 * corner, which has curved away, so the eye takes that curve as the edge and
 * reads the text as hanging off it.
 *
 * The compensation is a *fraction* of the radius, not the whole of it. The
 * caption sits below the card, so the edge it aligns to optically is
 * somewhere between the straight left edge (inset 0) and the full corner
 * (inset = radius). Five-sixths is where Hendri landed after seeing the two
 * side by side: at the default 48px radius that is 40px, and the full 48 read
 * as slightly too far in.
 *
 * Derived rather than exposed, because it isn't an independent choice — it is
 * a consequence of the radius. A square-cornered card gets no inset (correct:
 * there is no curve to compensate for), and the ceiling stops a decorative
 * 200px radius from marching the text into the middle of the page.
 */
const CAPTION_INSET_RATIO = 5 / 6

function captionInsetFor(radius: number) {
    return Math.max(0, Math.min(Math.round(radius * CAPTION_INSET_RATIO), 64))
}

/**
 * The width of the caption's *text column*.
 *
 * Measured inside the card's optical edges — card width less the inset on
 * both sides — with a floor so a narrow portrait doesn't squeeze the
 * description into a ribbon, and a ceiling so a wide landscape card doesn't
 * drag it out to a 100-character line. Under a narrow card the floor wins and
 * the text runs wider than the image, which is intended: a caption is a
 * caption, not a column rule.
 *
 * Measured against the **viewport**, not the component. The expanded card is
 * clamped to the viewport by design — it is a page-level focus layer — so
 * sizing the caption off the component's own width put the two in different
 * frames. In a 200px-wide container that produced a 585px card with a 152px
 * caption under it.
 */
function captionWidthFor(
    cardWidth: number,
    viewport: number,
    inset: number,
    modal: boolean
) {
    const vw = typeof window === "undefined" ? viewport : window.innerWidth
    const margin = modal ? MODAL_MARGIN : EDGE_MARGIN
    const room = Math.max(0, vw - margin * 2)
    // The floor is there so a narrow portrait card on a wide page doesn't
    // squeeze its description into a ribbon. Under the modal the card is
    // already as wide as the screen allows, so the floor has nothing to
    // protect and would only push the caption out past the picture.
    const target = modal
        ? cardWidth - inset * 2
        : Math.min(
              Math.max(cardWidth - inset * 2, CAPTION_MIN_WIDTH),
              CAPTION_MAX_WIDTH
          )
    return Math.max(0, Math.min(target, room))
}

function writeRect(el: HTMLElement, rect: Rect) {
    el.style.left = `${rect.left}px`
    el.style.top = `${rect.top}px`
    el.style.width = `${rect.width}px`
    el.style.height = `${rect.height}px`
}

/**
 * The FLIP invert: the transform that makes an element laid out at `open`
 * appear exactly at `rest`. With `transform-origin: 0 0` a point p maps to
 * `translate + scale · p`, so the translation is simply the difference of the
 * two origins and the scale is the ratio of the two widths.
 *
 * The expansion is a *uniform* scale by construction — a capsule is
 * `w × itemHeight` and its card is `w·s × itemHeight·s`, the same s on both
 * axes for every aspect ratio — which is what makes this substitution exact
 * rather than an approximation.
 */
function invert(rest: Rect, open: Rect) {
    const scale = open.width > 0 ? rest.width / open.width : 1
    return `translate(${rest.left - open.left}px, ${
        rest.top - open.top
    }px) scale(${scale})`
}

/**
 * Place the caption against the viewport rather than inside the strip. It
 * hangs under the card when there is room and flips above it when there
 * isn't, so a footer — or the bottom of the window — can never clip it.
 */
function positionCaption(
    el: HTMLElement | undefined,
    card: Rect,
    gap: number,
    viewport: number,
    inset: number,
    modal: boolean
) {
    if (!el || typeof window === "undefined") return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = modal ? MODAL_MARGIN : EDGE_MARGIN
    // Under the modal the dot row owns the foot of the screen, so the caption's
    // floor stops above it rather than at the window's edge.
    const floor = vh - (modal ? MODAL_DOTS_ROOM : EDGE_MARGIN)
    const width = captionWidthFor(card.width, viewport, inset, modal)
    el.style.width = `${width}px`
    // Width drives wrapping, so it has to be applied before the height read.
    const height = el.offsetHeight
    // Ranged off the card's left edge, not centred under it — the stacked
    // lockup reads as a column hanging off the card, and a centred ragged-left
    // block against a fixed-width card looks accidental. The inset carries it
    // clear of the corner radius; see captionInsetFor.
    let left = card.left + inset
    left = Math.min(Math.max(left, margin), Math.max(margin, vw - margin - width))
    let top = card.top + card.height + gap
    if (top + height > floor) {
        const above = card.top - gap - height
        top = above >= margin ? above : floor - height
    }
    el.style.left = `${left}px`
    el.style.top = `${top}px`
}

/**
 * Wheel deltas arrive in three units depending on the device and the browser.
 * Pixels are the common case; a mouse wheel in Firefox reports lines, and a
 * page-mode wheel reports screens. Without this a line-mode wheel reports a
 * delta of 3 against a 50px step and never gets anywhere.
 */
function normaliseWheel(delta: number, mode: number) {
    if (mode === 1) return delta * 16 // lines
    if (mode === 2) return delta * 400 // pages
    return delta
}

/** Keys belong to whatever is being typed into, not to the carousel. */
function isTyping(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false
    if (target.isContentEditable) return true
    const tag = target.tagName
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

/**
 * Is this pointer event inside the open card or its caption?
 *
 * The `[data-lollipop-card]` wrapper holds both the card and its caption, so
 * one selector covers the pair. It is checked against **this instance's** own
 * focus layer: two carousels on a page each portal a layer into the same
 * `document.body` and number their cards from zero, so an unscoped match let
 * one instance mistake the other's open card for its own and refuse to close.
 */
function withinCard(
    event: PointerEvent,
    flat: number | null,
    layer: HTMLElement | null
) {
    if (flat === null || !layer) return false
    const target = event.target
    if (!(target instanceof Element)) return false
    const wrapper = target.closest(`[data-lollipop-card="${flat}"]`)
    return Boolean(wrapper && layer.contains(wrapper))
}

/**
 * Is this pointer event on the modal's own furniture — the close button or the
 * dots? Scoped to this instance's layer for the same reason `withinCard` is.
 */
function withinChrome(event: PointerEvent, layer: HTMLElement | null) {
    if (!layer) return false
    const target = event.target
    if (!(target instanceof Element)) return false
    const chrome = target.closest("[data-lollipop-chrome]")
    return Boolean(chrome && layer.contains(chrome))
}

/**
 * Should this render the modal presentation rather than the hover one?
 *
 * True for anything that cannot hover — every phone and tablet — and for a
 * window narrow enough that a card would otherwise be clamped against both
 * margins, whatever is pointing at it. Both halves matter: `(hover: none)`
 * alone leaves a coarse-pointer tablet with an interaction built for a mouse,
 * and a width test alone gives a narrow desktop window a card wider than
 * itself.
 *
 * Deliberately `window.resize` and a media query rather than a
 * `ResizeObserver`: an RO never fires at all in a backgrounded tab, so this
 * would be untestable from the agent's browser.
 */
function useTouchLayout() {
    const [touch, setTouch] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        const query = window.matchMedia?.("(hover: none)")
        const sync = () =>
            setTouch(
                Boolean(query?.matches) || window.innerWidth <= MODAL_MAX_WIDTH
            )
        sync()
        window.addEventListener("resize", sync)
        window.addEventListener("orientationchange", sync)
        query?.addEventListener?.("change", sync)
        return () => {
            window.removeEventListener("resize", sync)
            window.removeEventListener("orientationchange", sync)
            query?.removeEventListener?.("change", sync)
        }
    }, [])

    return touch
}

/**
 * Light or dark, from the page's own theme switch if there is one and the OS
 * otherwise. There is deliberately no Theme control: this only decides which
 * way to throw a shadow, and every ink colour is already a property control
 * that Framer hands over as a theme-aware token.
 */
function useIsDark() {
    const [systemDark, setSystemDark] = useState(false)
    const [forced, setForced] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const query = window.matchMedia("(prefers-color-scheme: dark)")
        const sync = () => setSystemDark(query.matches)
        sync()
        query.addEventListener?.("change", sync)
        return () => query.removeEventListener?.("change", sync)
    }, [])

    useEffect(() => {
        if (typeof document === "undefined") return
        const root = document.documentElement
        const sync = () => setForced(root.getAttribute("data-theme"))
        sync()
        const observer = new MutationObserver(sync)
        observer.observe(root, {
            attributes: true,
            attributeFilter: ["data-theme"],
        })
        return () => observer.disconnect()
    }, [])

    if (forced === "dark") return true
    if (forced === "light") return false
    return systemDark
}

/* ------------------------------------------------------------------ styles */

/**
 * The demo content — Hendri van Niekerk's own work.
 *
 * Both `ControlType.ResponsiveImage` and `ControlType.File` ignore
 * `defaultValue`, so a freshly dropped instance would otherwise be a row of
 * blank capsules. These stand in per position until the author picks their own
 * media, and the copy travels with the picture rather than sitting in a
 * parallel array — the two used to be paired by index, which is one edit away
 * from captioning the wrong image.
 *
 * `width`/`height` are the **measured** source size, not a guess, because they
 * are what makes the `srcSet` descriptors honest. `?scale-down-to=N` fits the
 * **longest** edge to N and never upscales — so on a portrait, asking for 1536
 * returns 1024 of *width*, and on the small signature PNG it returns the
 * source at any N. A descriptor that claimed 1536w in either case would make
 * the browser pick a file too small for the slot, and the card would render
 * visibly soft. Which it did, until this was measured.
 *
 * Ordered for shape, not chronology: no two neighbours share an aspect ratio,
 * and the two moving pieces (the signature video, the Pukka GIF) sit three
 * apart so the strip always has exactly one thing moving in view.
 *
 * ⚠️ **This copy is mirrored on the demo page's instance, and the page is the
 * source of truth** — Hendri edits it there. They had drifted by two em dashes,
 * which sounds trivial and is not: these defaults ship inside every downloaded
 * copy, so a buyer was getting punctuation he had already taken out of his own
 * page. Diff the two before shipping (`$control__items` on the instance).
 */
interface DemoItem {
    src: string
    width: number
    height: number
    /** Optional — the capsule plays this and uses `src` as its poster. */
    video?: string
    title: string
    description: string
    tags: string
}

const DEMO_ITEMS: DemoItem[] = [
    {
        src: "https://framerusercontent.com/images/H9SNjQodx6JiOpDBTlrPSxFOxU.png",
        width: 1600,
        height: 1200,
        title: "Bettr Sticker Pack",
        description:
            "Holographic stickers for the Bettr identity: coin motifs, and a slogan cut to survive a circle.",
        tags: "Identity, Print",
    },
    {
        src: "https://framerusercontent.com/images/fGuwSND0tMi21uip15rgzKdyRs.png",
        width: 899,
        height: 900,
        video: "https://framerusercontent.com/assets/gwzpy8Klb5QAw7Y8LxxI5Trmajw.mp4",
        title: "Signature",
        description:
            "A lettermark built in three dimensions and set turning, so the form reads from every angle.",
        tags: "Motion, Identity",
    },
    {
        src: "https://framerusercontent.com/images/n8MlLCV7eLkqXhsy8H8NTDVI00.jpg",
        width: 1920,
        height: 1080,
        title: "Aidan Bennetts",
        description:
            "A studio site built around one long process page, shown in the room it was made for.",
        tags: "Web, Art Direction",
    },
    {
        src: "https://framerusercontent.com/images/dcHtQku7vBYwjk8xc7GiY4iXP8o.png",
        width: 1080,
        height: 1350,
        title: "REMfluence",
        description:
            "A wordmark set against vertical blue light, built as the brand's opening frame.",
        tags: "Identity, Motion",
    },
    {
        src: "https://framerusercontent.com/images/1Um6SxIgYferww4xILZc9AhOss.gif",
        width: 600,
        height: 600,
        title: "Pukka Kreative",
        description:
            "The mark drawing itself, script over block, on a ground speckled like newsprint.",
        tags: "Logo, Animation",
    },
    {
        src: "https://framerusercontent.com/images/ZJziwWgF71xNvzrmDo500RpsZ6s.jpg",
        width: 6016,
        height: 4016,
        title: "Loraine Roux",
        description:
            "Catalogue photography where the mark has to work at button scale, on the garment itself.",
        tags: "Photography, Identity",
    },
    {
        src: "https://framerusercontent.com/images/h5BN6104tcTndAQCGCgYgwqjKu0.jpg",
        width: 1080,
        height: 1080,
        title: "Addicted",
        description:
            "A skull, a phonetic spelling, and one loud yellow doing the rest of the work.",
        tags: "Logo, Type",
    },
]

/**
 * Resolved URL → measured source size, for the demo imagery.
 *
 * The demo pieces run to 6k px on their long edge at source. A capsule renders
 * one at ~225px and its expanded card at ~585px, so served raw the browser
 * downloads and decodes roughly twenty-five times the pixels it can put on
 * screen — 16.5MB of it, measured, before any of this existed.
 *
 * framerusercontent resizes on demand from `?scale-down-to=N`, so the demo
 * imagery gets a real `srcSet`. Author-supplied images already arrive with one
 * from `ControlType.ResponsiveImage`; what neither had was a `sizes`, without
 * which the browser assumes `100vw` and picks the *largest* candidate every
 * time — which is why a correct `srcSet` was still fetching 4k files.
 */
const MEDIA_DIMENSIONS = new Map<string, [number, number]>(
    DEMO_ITEMS.map((item) => [item.src, [item.width, item.height]])
)

const MEDIA_STEPS = [512, 1024, 1536, 2048]

/** A srcSet whose descriptors state the width the service will really send. */
function framerSrcSet(url: string, sourceW: number, sourceH: number) {
    const seen = new Set<number>()
    const parts: string[] = []
    for (const step of MEDIA_STEPS) {
        // The service fits the longest edge and never upscales, so a small
        // source yields the same file at every step — emit it once.
        const scale = Math.min(1, step / Math.max(sourceW, sourceH))
        const width = Math.round(sourceW * scale)
        if (seen.has(width)) continue
        seen.add(width)
        parts.push(`${url}?scale-down-to=${step} ${width}w`)
    }
    return parts.join(", ")
}

/**
 * The cheapest URL that still has the right aspect ratio.
 *
 * The measurement pass only needs the *shape* of each image, and shape is
 * scale-invariant — so it reads the smallest candidate rather than the full
 * file. This is where most of that 16.5MB actually went: every source was
 * being downloaded at full size purely to divide its width by its height.
 */
function probeUrl(srcSet: string | undefined, src: string | undefined) {
    if (!srcSet) return src
    const smallest = srcSet
        .split(",")
        .map((part) => part.trim().split(/\s+/))
        .map(([url, descriptor]) => ({
            url,
            width: parseInt(descriptor ?? "", 10) || Number.MAX_SAFE_INTEGER,
        }))
        .filter((candidate) => candidate.url)
        .sort((a, b) => a.width - b.width)[0]
    return smallest?.url ?? src
}

const DEFAULT_ITEMS: LollipopItem[] = DEMO_ITEMS.map((item) => ({
    title: item.title,
    description: item.description,
    tags: item.tags,
    video: item.video,
    image: { src: item.src, alt: item.title },
}))

const MIN_ITEM_HEIGHT = 40
const EDGE_MARGIN = 24

/* ------------------------------------------------------------ modal layout */

// Anything at or below this width gets the modal, whatever is pointing at it —
// a desktop window this narrow has the same problem a phone does.
const MODAL_MAX_WIDTH = 700
// Tighter than EDGE_MARGIN: on a 390px screen 24px either side is a tenth of
// the width given away.
const MODAL_MARGIN = 16
// Room kept above the card for the close button, and below it for the caption
// and the dots. The card is fitted into whatever is left, so these are what
// stop it growing under its own furniture.
const MODAL_TOP = 72
const MODAL_BOTTOM = 172
const MODAL_BOTTOM_BARE = 84
// The dot row is pinned to the bottom of the screen rather than hung off the
// caption, so it stays put when a long caption reflows — or flips above the
// card, which positionCaption will do on a short screen.
const MODAL_DOTS_ROOM = 56
// Room above and below the capsules for their own shadow, once the band has
// collapsed to the capsule height. The deepest of the four shadows reaches
// about 24px past the box (offset 10 + blur 22 − spread 8).
const SHADOW_ROOM = 24

/**
 * How far a pointer may travel and still count as a tap.
 *
 * A finger is not a mouse: contact wanders several pixels during an ordinary
 * tap, so the mouse's 4px threshold classified a great many phone taps as
 * drags — and a drag opens nothing. That single number was most of what made
 * touch feel broken.
 */
function dragSlopFor(pointerType: string) {
    return pointerType === "mouse" ? 4 : 10
}
const DRAG_SLOP = 4

/* ------------------------------------------------------------------ fling */

// Below this a release is a considered stop, not a throw, and the strip should
// simply resume its drift from where it was let go.
const MIN_FLING_SPEED = 120
// A guard against a nonsense sample — a pointer that jumps across the screen in
// one frame — rather than a design limit. Real throws sit well under it.
const MAX_FLING_SPEED = 4000
// Headroom over the drift speed before a velocity counts as coasting, so the
// ordinary resume from a pause is never mistaken for a throw.
const FLING_FLOOR = 60

/**
 * Two motion clocks, shared by everything that moves together: the focus card,
 * the parting columns, the dimming neighbours and the capsule reveal.
 *
 * Both are **critically damped** — no overshoot at all, long decelerating
 * tails. A bouncier open (~1.5% overshoot) and a shorter close were built
 * alongside these and compared side by side in the harness; Hendri chose
 * these. Don't reintroduce the bounce without asking.
 *
 * The curves are damped-spring physics baked into CSS `linear()` easings
 * (regenerate with scripts/gen-springs.mjs), so the browser owns the
 * interpolation and the motion needs no JS animation loop to run.
 */
const OPEN_MS = 750
const OPEN_SPRING =
    "linear(0, 0.0074, 0.0272, 0.0563, 0.0922, 0.133, 0.1769, 0.2227, 0.2692, 0.3156, 0.3614, 0.4059, 0.4489, 0.4901, 0.5292, 0.5663, 0.6012, 0.634, 0.6646, 0.6931, 0.7195, 0.744, 0.7667, 0.7876, 0.8068, 0.8244, 0.8406, 0.8554, 0.869, 0.8814, 0.8926, 0.9029, 0.9123, 0.9208, 0.9285, 0.9355, 0.9418, 0.9476, 0.9528, 0.9575, 0.9618, 0.9656, 0.9691, 0.9722, 0.975, 0.9776, 0.9799, 0.9819, 0.9838, 0.9855, 0.987, 0.9883, 0.9895, 0.9906, 0.9916, 0.9925, 0.9933, 0.994, 0.9946, 1, 1, 1, 1)"
const CLOSE_MS = 600
const CLOSE_SPRING =
    "linear(0, 0.0105, 0.0381, 0.0777, 0.1254, 0.1781, 0.2333, 0.2894, 0.345, 0.3991, 0.451, 0.5003, 0.5466, 0.5898, 0.6298, 0.6668, 0.7007, 0.7317, 0.7599, 0.7855, 0.8086, 0.8295, 0.8484, 0.8653, 0.8804, 0.894, 0.9061, 0.9169, 0.9266, 0.9351, 0.9428, 0.9495, 0.9555, 0.9608, 0.9655, 0.9697, 0.9733, 0.9766, 0.9794, 0.9819, 0.9842, 0.9861, 0.9878, 0.9893, 0.9907, 0.9918, 0.9928, 0.9937, 0.9945, 1)"

// Bezier approximation at the SAME durations, for browsers without linear()
// (Safari < 17.2, Chrome < 113, Firefox < 112). The JS timers below are
// derived from the durations, so only the easing may differ — never the clock.
const EASE_FALLBACK = "cubic-bezier(0.22, 0.61, 0.36, 1)"
const MEASURE_DEADLINE_MS = 6000
/* ------------------------------------------------------------- stepping */

// Horizontal wheel travel that makes one step. Low enough that a deliberate
// two-finger flick registers immediately, high enough that the drift of a
// finger resting on a trackpad doesn't.
const WHEEL_STEP = 50
// Everything arriving inside this window after a step is momentum, and belongs
// to the flick that already stepped.
const WHEEL_COOLDOWN_MS = 260
// A pause this long ends a gesture, so two small nudges a second apart don't
// add up into a step.
const WHEEL_IDLE_MS = 200
// Quiet required after a touch scroll before the drift takes the wheel back.
// Long enough to outlast iOS momentum's dying frames, short enough that the
// strip doesn't feel dead after a flick.
const TOUCH_IDLE_MS = 220
// How far a finger has to travel across an open card to move to the next one.
const SWIPE_STEP = 48
// Continuous "no target" required before a card actually closes. Long enough
// to swallow the empty row above and below a capsule as the pointer sweeps
// past, short enough that a deliberate exit still feels immediate.
const EXIT_GRACE_MS = 120
// Below this the title can't sit beside the body without breaking mid-word.
const CAPTION_MIN_WIDTH = 320
// ~80 characters at the default body size. Above this the description stops
// reading as a caption and starts reading as a paragraph.
const CAPTION_MAX_WIDTH = 480
// Stand-in shapes while aspect ratios are measured. Deliberately varied so the
// skeleton reads as a strip of media rather than a progress bar.
const SKELETON_RATIOS = [
    1.6, 0.62, 1.33, 1, 0.8, 1.78, 1, 1.33, 0.62, 1.6, 1.15, 0.75,
]

// Without this the caption drops to the browser's serif default whenever the
// Font controls haven't been touched.
const FALLBACK_FONT =
    '"Space Grotesk", Inter, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif'

const SHADOW_LIGHT =
    "0 10px 20px -6px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.06)"
const SHADOW_DARK =
    "0 10px 22px -8px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07)"
const CARD_SHADOW_LIGHT =
    "0 32px 64px -24px rgba(0,0,0,0.26), 0 8px 20px -12px rgba(0,0,0,0.14)"
const CARD_SHADOW_DARK =
    "0 32px 64px -24px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.09)"

const rootStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
}

const scrollerStyle: CSSProperties = {
    width: "100%",
    // offsetLeft on a column is read against this box to derive where the
    // focus card should land, so the scroller has to be the offset parent.
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    overflowX: "auto",
    overflowY: "hidden",
    scrollBehavior: "auto",
    overscrollBehaviorX: "contain",
    // `pan-x` as well as `pan-y`, so a finger scrolls the strip NATIVELY.
    //
    // It used to be `pan-y` alone, which hands the horizontal axis to JS — and
    // the JS on the other end was a pointermove handler writing `scrollLeft`
    // while the drift loop wrote the same property every frame from its own
    // accumulator. Two owners of one value, sixty times a second: on a real
    // phone that reads as the strip refusing to follow your finger. The
    // browser is a better scrubber than either of them, and it brings momentum
    // and rubber-banding for nothing. The mouse drag is unaffected —
    // `touch-action` governs touch and pen only.
    willChange: "scroll-position",
    transform: "translateZ(0)",
    userSelect: "none",
    touchAction: "pan-x pan-y",
    outline: "none",
}

const mediaFill: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    userSelect: "none",
}

const emptyStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    borderRadius: 8,
}

// Geometry is animated with CSS transitions rather than a JS animation loop:
// the resting values stay literal inline styles (so layout is never a frame
// behind the data) and the browser owns the interpolation.
const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)"

const styleSheet = `
.lollipop-scroller::-webkit-scrollbar { display: none; }
.lollipop-scroller { scrollbar-width: none; -ms-overflow-style: none; }

/* Every clock below reads the same custom properties, set once by the
   component — so the two durations and their curves live in exactly one place
   and nothing can drift out of step with the card.

   The linear() springs cannot use the two-declaration fallback trick here:
   var() is substituted at computed-value time, too late for the parser to
   drop a bad declaration. The @supports block at the foot of this sheet
   swaps the easings for beziers instead, which is one place rather than ten. */

/* The parting columns share the card's clocks exactly — same duration, same
   literal curve — so the gap the card vacates seals in lockstep with the card
   at every frame. A 0.26s column racing a 0.34s card is what used to leave
   the row unflush on close. */
.lollipop-column {
  position: relative;
  flex: 0 0 auto;
  /* Hit-testing belongs to the capsule, not this full-height column. */
  pointer-events: none;
  user-select: none;
  transition: transform var(--lollipop-close-dur) var(--lollipop-close-ease);
}
.lollipop-column[data-parting="true"] {
  transition: transform var(--lollipop-open-dur) var(--lollipop-open-ease);
}
/* Promote only while a card is alive — otherwise every column in a
   forty-item track holds a compositor layer for nothing. Keyed off the
   scroller, not [data-parting], so the layers aren't demoted mid-close the
   moment parting flips false. */
.lollipop-scroller[data-focus="true"] .lollipop-column { will-change: transform; }

.lollipop-media {
  position: absolute;
  overflow: hidden;
  pointer-events: auto;
  display: block;
  text-decoration: none;
  backface-visibility: hidden;
  /* 'lit' — the resting strip, and neighbours coming back up as a card
     closes. Rides the close clock so the strip brightens in step with the
     card shrinking rather than as a separate event. */
  transition:
    top 0.26s ${EASE},
    width 0.26s ${EASE},
    height 0.26s ${EASE},
    opacity var(--lollipop-close-dur) ${EASE};
}
/* 'dim' — neighbours receding while a card is open. This is what replaced
   the frost: the strip falls back on its own instead of having a pane laid
   over it, so nothing is blurred and nothing is composited full-screen. */
.lollipop-media[data-state="dim"] {
  transition:
    top 0.26s ${EASE},
    width 0.26s ${EASE},
    height 0.26s ${EASE},
    opacity 0.3s ${EASE};
}
/* 'hidden' — near-instant; the lifting card sits exactly on top of it. */
.lollipop-media[data-state="hidden"] {
  transition:
    top 0.26s ${EASE},
    width 0.26s ${EASE},
    height 0.26s ${EASE},
    opacity 90ms linear;
}
/* 'returning' — held at zero until the closing card has LANDED, then
   crossfaded underneath it during the retire buffer. Fading in mid-flight
   showed the image twice: a soft duplicate behind the still-larger card. */
.lollipop-media[data-state="returning"] {
  transition:
    top 0.26s ${EASE},
    width 0.26s ${EASE},
    height 0.26s ${EASE},
    opacity 110ms linear var(--lollipop-close-dur);
}
.lollipop-media:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

.lollipop-sr {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0; border: 0;
  overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%);
  white-space: nowrap;
}

.lollipop-focus-card:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

.lollipop-layer {
  position: fixed;
  inset: 0;
  z-index: 100000;
  pointer-events: none;
}

.lollipop-focus-card {
  position: fixed;
  overflow: hidden;
  display: block;
  text-decoration: none;
  pointer-events: auto;
  transform-origin: 0 0;
  /* One layout write, then nothing but compositor work — see the invert
     helper. will-change only promotes compositable properties, so the old
     declaration for left/top/width/height bought nothing at all; the card is
     a transient portal that exists only for the length of the gesture, which
     is the textbook lifetime for the hint. */
  will-change: transform;
  contain: layout paint;
}
.lollipop-focus-card[data-open="true"] {
  transition:
    transform var(--lollipop-open-dur) var(--lollipop-open-ease),
    border-radius var(--lollipop-radius-dur) ${EASE};
}
/* A card on its way out must not re-capture the pointer. */
.lollipop-focus-card[data-open="false"] {
  pointer-events: none;
  transition:
    transform var(--lollipop-close-dur) var(--lollipop-close-ease),
    border-radius var(--lollipop-radius-dur) ${EASE};
}

/* ------------------------------------------------------------ the modal */

/* The sheet the card sits on where there is no hover to sit above. Opacity
   only — the strip and the page chrome recede by being covered, not blurred,
   so the phone keeps the property the desktop gained in DECISIONS #26: not one
   backdrop filter anywhere on the page. */
.lollipop-sheet {
  position: fixed;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--lollipop-close-dur) ${EASE};
}
.lollipop-sheet[data-open="true"] {
  opacity: 1;
  pointer-events: auto;
  transition: opacity var(--lollipop-open-dur) var(--lollipop-open-ease);
}

.lollipop-chrome {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--lollipop-close-dur) ${EASE};
}
.lollipop-chrome[data-open="true"] {
  opacity: 1;
  transition: opacity 0.24s 0.12s ${EASE};
}

/* 44x44 is the floor for a touch target, and the glyph inside is 18px — the
   padding is the tap area, not decoration. Offset by the safe-area insets so
   it clears a notch or a rounded corner. */
.lollipop-close {
  position: absolute;
  top: calc(env(safe-area-inset-top, 0px) + 8px);
  right: calc(env(safe-area-inset-right, 0px) + 8px);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: 0;
  background: none;
  cursor: pointer;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
}

.lollipop-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  pointer-events: none;
}
/* Same trick as the close button: a 44px target carrying a 7px dot, so the
   row reads as small marks rather than as a strip of buttons. */
.lollipop-dot {
  width: 28px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border: 0;
  background: none;
  cursor: pointer;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;
}
.lollipop-dot > span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
  /* 0.45, not the 0.28 this was drawn at. An inactive dot is still a control
     you have to see in order to count the items and aim at one, so it owes the
     3:1 that WCAG asks of a UI component — and at 0.28 it measured 1.91:1 in
     light and 2.29:1 in dark. Light is the binding case; 0.45 clears it at
     3.09 / 4.17, and the active dot keeps its distance through full opacity
     plus the scale below. */
  opacity: 0.45;
  transition:
    opacity 0.24s ${EASE},
    transform 0.24s ${EASE};
}
.lollipop-dot[data-on="true"] > span {
  opacity: 1;
  transform: scale(1.15);
}
/* The modal's own controls do NOT use :focus-visible.

   The dialog moves focus to its close button when it opens, which is right —
   but whether that programmatic focus counts as "visible" is a per-browser
   heuristic, and Safari on iOS says yes where Chrome on the desktop says no.
   The consequence was a keyboard affordance drawn around the X on every phone
   that ever opened a card, which is how it was found: on a real device, not in
   any test here.

   So the ring is gated on this component's own record of the last input
   instead — see the modality effect. Deterministic across browsers, and it
   still lights up for the people it is for.

   Round, not the old 4px: the target is a 44px circle and a squared-off ring
   around it read as a box drawn on top of the icon rather than as its focus. */
/* Suppress the UA ring first. This is not belt-and-braces: the browser draws
   its own focus ring on a focused button, and the old :focus-visible rule only
   happened to hide it by overriding the same declaration whenever the
   heuristic agreed. Gate the ring on our own flag without this and the default
   ring — a blue rounded rectangle in Chrome, a light one in Safari — shows
   through on touch, which is the exact artefact this was meant to remove. */
.lollipop-close:focus,
.lollipop-dot:focus {
  outline: none;
}
.lollipop-layer[data-keyboard="true"] .lollipop-close:focus,
.lollipop-layer[data-keyboard="true"] .lollipop-dot:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
  border-radius: 999px;
}

/* The card is the gesture surface under the modal — nothing behind it scrolls
   while it is up, so it can take the whole gesture rather than sharing it. */
.lollipop-layer[data-modal="true"] .lollipop-focus-card { touch-action: none; }

.lollipop-caption {
  position: fixed;
  display: flex;
  /* One column, always. The two-column row pinned the title to a fixed share
     of the caption, which collapsed to its floor on a narrow card and broke
     long titles mid-word. */
  flex-direction: column;
  align-items: flex-start;
  pointer-events: none;
  opacity: 0;
  transform: translateY(10px);
  /* Exit: quick and immediate — it's disappearing, no spring needed. */
  transition:
    opacity 0.18s ${EASE},
    transform 0.18s ${EASE};
}

.lollipop-caption[data-open="true"] {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  /* Enter: held back just long enough for the card to have opened up, then
     the rise rides the card's spring so both decelerate on one profile. */
  transition:
    opacity 0.26s 0.12s ${EASE},
    transform var(--lollipop-open-dur) 0.12s var(--lollipop-open-ease);
}
/* linear() cannot use the two-declaration fallback trick once it arrives via
   var(): substitution happens at computed-value time, long after the parser
   could have dropped a bad declaration. Swapping the custom properties
   themselves is one place instead of ten. */
@supports not (transition-timing-function: linear(0, 1)) {
  .lollipop-layer, .lollipop-scroller {
    --lollipop-open-ease: var(--lollipop-ease-fb);
    --lollipop-close-ease: var(--lollipop-ease-fb);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lollipop-column,
  .lollipop-media,
  .lollipop-focus-card,
  .lollipop-sheet,
  .lollipop-chrome,
  .lollipop-dot > span,
  .lollipop-caption { transition-duration: 0.01ms; transition-delay: 0s; }
}
`

/* ---------------------------------------------------------------- controls */

addPropertyControls(LollipopCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Untitled",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    defaultValue: "",
                },
                tags: {
                    type: ControlType.String,
                    title: "Tags",
                    placeholder: "Comma, separated",
                    defaultValue: "",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    heightMode: {
        type: ControlType.Enum,
        title: "Height",
        options: ["Fixed", "Fill"],
        optionTitles: ["Fixed", "Fill"],
        defaultValue: "Fixed",
        displaySegmentedControl: true,
        description:
            "Fill scales the capsules to the height the component is given, up to Size.",
    },
    itemHeight: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 150,
        min: 40,
        max: 400,
        step: 2,
        displayStepper: true,
        description:
            "Capsule height at rest. Width follows each image's own aspect ratio.",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Expand",
        defaultValue: 2.6,
        min: 1,
        max: 6,
        step: 0.1,
        displayStepper: true,
        description:
            "How much larger a card grows when it opens. The row is always this tall, so the strip never reflows.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 0,
        min: 0,
        max: 120,
        step: 2,
        description:
            "Space between capsules. At 0 they meet as one continuous ribbon.",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 60,
        min: 0,
        max: 400,
        step: 5,
        description: "Pixels per second. Set to 0 to hold still.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Drift",
        options: ["Left", "Right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "Left",
        displaySegmentedControl: true,
        description: "Which way the strip drifts when it is left alone.",
    },
    expandedRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 48,
        min: 0,
        max: 200,
        step: 2,
        description:
            "Corner radius once expanded. Idle capsules stay pill-shaped.",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        description: "A soft lift under the capsules and the expanded card.",
    },
    dim: {
        type: ControlType.Number,
        title: "Dim",
        defaultValue: 65,
        min: 0,
        max: 100,
        unit: "%",
        step: 5,
        description:
            "How far the rest of the strip fades back while a card is open. At 0 nothing recedes.",
    },
    captions: {
        type: ControlType.Boolean,
        title: "Captions",
        defaultValue: true,
        description: "Shows the title, description and tags under an open card.",
    },
    captionGap: {
        type: ControlType.Number,
        title: "Caption Y",
        defaultValue: 20,
        min: 0,
        max: 120,
        step: 2,
        hidden: (props: LollipopCarouselProps) => props.captions === false,
        description: "Distance between the bottom of the card and its caption.",
    },
    captionSpace: {
        type: ControlType.Number,
        title: "Caption Room",
        // 120 was sized for the old two-column caption, which was ~62px tall.
        // The stacked lockup is ~104px; 140 keeps the same margin of safety
        // under it without lifting the strip noticeably up the page.
        defaultValue: 140,
        min: 0,
        max: 400,
        step: 4,
        description:
            "Empty space kept under the strip so a caption has somewhere to open.",
        hidden: (props: LollipopCarouselProps) => props.captions === false,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 13,
            variant: "Semibold",
            lineHeight: "1.3em",
        },
        hidden: (props: LollipopCarouselProps) => props.captions === false,
        description: "The item title, above its description.",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 13,
            variant: "Regular",
            lineHeight: "1.45em",
        },
        hidden: (props: LollipopCarouselProps) => props.captions === false,
        description:
            "The description and the tags. Tag size follows this, at 85%.",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Ink",
        defaultValue: "#0d0d0d",
        hidden: (props: LollipopCarouselProps) => props.captions === false,
        description:
            "Bind to a colour token so it follows the page theme — a raw hex stays light-mode forever.",
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Body Ink",
        defaultValue: "#6b6b6b",
        hidden: (props: LollipopCarouselProps) => props.captions === false,
        description:
            "Body text under the title. Bind to a token so dark mode follows.",
    },
    tagColor: {
        type: ControlType.Color,
        title: "Tag Ink",
        defaultValue: "#333333",
        hidden: (props: LollipopCarouselProps) => props.captions === false,
        description: "Tag text. Bind to a token so dark mode follows.",
    },
    tagBackground: {
        type: ControlType.Color,
        title: "Tag Fill",
        defaultValue: "#f0f0f0",
        hidden: (props: LollipopCarouselProps) => props.captions === false,
        description: "Tag pill fill. Bind to a token so dark mode follows.",
    },
    placeholderTint: {
        type: ControlType.Color,
        title: "Placeholder",
        defaultValue: "#EFEFED",
        description:
            "Shown for the moment before an image has decoded. Bind to a token so dark mode follows.",
    },
    sheetColor: {
        type: ControlType.Color,
        title: "Sheet",
        defaultValue: "#FCFCFB",
        description:
            "The surface an open image sits on where there is no hover — phones, tablets and narrow windows. Bind to your page background token so it follows the theme.",
    },
})
