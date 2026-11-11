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
    startTransition,
    type CSSProperties,
    type FocusEvent as ReactFocusEvent,
} from "react"

/**
 * PROJECT INDEX — a complete editorial project list, in one component.
 *
 * This is the standalone, no-CMS build: the projects live in an Array
 * property control, so the component works the moment it's dropped on a
 * canvas. One component, one URL, nothing to wire up.
 *
 * Desktop  — rows dim when a sibling is hovered; one shared image sits
 *            centred behind the list, swaps to the hovered project, and
 *            drifts horizontally with the cursor.
 * Tablet   — a two-up card grid (no hover on touch).
 * Phone    — a single-column feed; each card's media reveals on scroll.
 *
 * Breakpoints are measured from the component's own width, not the window,
 * so Framer's canvas and breakpoint variants render the right layout.
 *
 * (A CMS-connected variant lives in ProjectIndex.tsx — a row component for
 * use inside a native Collection List. This file needs no collection.)
 */

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

interface ResponsiveImage {
    src?: string
    srcSet?: string
    alt?: string
}

interface ProjectItem {
    number?: string
    title?: string
    year?: string
    category?: string
    image?: ResponsiveImage
    video?: string
    /** Still for a video before it plays, and on the canvas, which never
     *  plays it. Falls back to the project's image. */
    poster?: ResponsiveImage
    link?: string
}

/* ------------------------------------------------------------------ *
 * Demo media
 * ------------------------------------------------------------------ */

const IMG = "https://framerusercontent.com/images/"

// The demo's pictures, shown — in order, by row — until a project in the
// list has an image or video of its own. Adding the first one switches
// them all off, so a real list never mixes in demo media.
const DEMO_MEDIA: Pick<ProjectItem, "image" | "video" | "poster">[] = [
    { image: { src: IMG + "EBlkpspK746Ky4wjBHXaPt7DBC8.jpg" } },
    { image: { src: IMG + "cNBqq6QRV8cue9ihrlPkc2q5Qsg.png" } },
    { image: { src: IMG + "IyqaKpQwcNYimoSDzGNx5inGgQ.png" } },
    { image: { src: IMG + "w8y3DCQ9EUNJ50mNeFRj1yEF5s.png" } },
    { image: { src: IMG + "zWf39zkWmAXR5zls4IJp5K3iu0.jpg" } },
    { image: { src: IMG + "bQiZOMm90hllA3w5YaRsKgmeE.png" } },
    {
        video: "https://framerusercontent.com/assets/NZ0ax1lQTCHYmA4lnbuwVtGPa9c.mp4",
        poster: { src: IMG + "bbAiGZaBOoP4jVnB5cA7GNgiflQ.jpg" },
    },
    { image: { src: IMG + "PiZ1rKs6jicoZfaDxxNlYGOU.png" } },
]

const hasMedia = (p: ProjectItem) => !!(p && (p.video || p.image?.src))

function withDemoMedia(list: ProjectItem[]): ProjectItem[] {
    if (list.some(hasMedia)) return list
    return list.map((p, i) => ({ ...p, ...DEMO_MEDIA[i % DEMO_MEDIA.length] }))
}

/* ------------------------------------------------------------------ *
 * Geist
 * ------------------------------------------------------------------ */

// Framer's Font control can't default to a family: an untouched one
// arrives as Inter. The component is drawn in Geist, so it loads Geist
// itself and uses it while a font control is still on that default.
// Picking any other family in the panel takes over as usual.
const GEIST_CSS =
    "@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap');"
const GEIST = '"Geist", "Geist Placeholder", sans-serif'

const onDefaultFamily = (font?: CSSProperties) =>
    !font?.fontFamily || /^\s*"?Inter"?\s*(,|$)/.test(String(font.fontFamily))

const inGeist = (font?: CSSProperties): CSSProperties => ({
    ...font,
    ...(onDefaultFamily(font) ? { fontFamily: GEIST } : null),
})

type ThemeMode = "light" | "dark" | "custom"
type LayoutMode = "auto" | "desktop" | "tablet" | "phone"
type Mode = "desktop" | "tablet" | "phone"
type CompactMode = "scroll" | "feed"
type ScrollMode = "pin" | "flow"

interface Palette {
    bg: string
    text: string
    dim: string
    line: string
    activeLine: string
    count: string
    media: number
}

interface ProjectIndexProps {
    projects: ProjectItem[]

    headline: string
    showHeadline: boolean
    showCount: boolean
    countPrefix: string
    countDigits: number

    theme: ThemeMode
    paintBackground: boolean
    bgColor: string
    textColor: string
    dimColor: string
    lineColor: string
    activeLineColor: string
    countColor: string
    mediaBrightness: number

    headlineFont?: CSSProperties
    rowFont?: CSSProperties
    countFont?: CSSProperties

    sectionHeight: number
    fillViewport: boolean
    margin: number
    columns: number
    gutter: number
    rowHeight: number
    rowPadding: string
    titleColumn: number
    yearColumn: number
    categoryColumn: number
    headlineGap: number

    previewWidth: number
    previewHeight: number
    previewRadius: string
    drift: number
    driftRange: number
    fadeDuration: number

    layoutMode: LayoutMode
    compactMode: CompactMode
    rowScroll: number
    tabletBreakpoint: number
    phoneBreakpoint: number
    mediaRatio: number
    compactMargin: number

    showNumber: boolean
    showArrow: boolean
    newTab: boolean

    style?: CSSProperties
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Smooth Hermite ease (3t² − 2t³): 0→0, 1→1, flat slope at both ends. */
function smoothstep(t: number) {
    const c = Math.max(0, Math.min(1, t))
    return c * c * (3 - 2 * c)
}

/** Framer hands enum values back as either the key or the display title. */
function normalizeEnum(value: unknown, fallback: string) {
    return String(value ?? fallback).toLowerCase()
}

const LIGHT: Palette = {
    bg: "#FFFFFF",
    text: "#0E0E0E",
    dim: "rgba(0, 0, 0, 0.25)",
    line: "rgba(0, 0, 0, 0.15)",
    activeLine: "#000000",
    count: "rgba(0, 0, 0, 0.4)",
    media: 1,
}

/** Trim the line box to cap height, as Figma does, so the row-height maths
 *  lands exactly and the text sits flush to the padding edge. Ignored
 *  gracefully where text-box isn't supported. */
const TRIM: any = { textBoxTrim: "trim-both", textBoxEdge: "cap alphabetic" }

const DARK: Palette = {
    bg: "#0E0E0E",
    text: "#F2F2F2",
    dim: "rgba(255, 255, 255, 0.5)",
    line: "rgba(255, 255, 255, 0.18)",
    activeLine: "#FFFFFF",
    count: "rgba(255, 255, 255, 0.5)",
    // Photos don't invert with the UI — on a dark page their light
    // backgrounds glow, so they get eased back slightly.
    media: 0.88,
}

/** Measure a node's width, before paint, and keep it current. */
function useElementWidth(ref: { current: HTMLElement | null }) {
    const [width, setWidth] = useState(0)

    // useLayoutEffect measures before the first paint, so the right layout
    // renders immediately instead of flashing desktop at phone width. On the
    // server there is nothing to measure, so fall back to useEffect.
    const useIsomorphic =
        typeof window === "undefined" ? useEffect : useLayoutEffect

    useIsomorphic(() => {
        const node = ref.current
        if (!node) return

        // offsetWidth, never getBoundingClientRect: the rect reports the
        // VISUAL size, so any CSS transform on an ancestor scales it.
        // Framer's canvas scales by the zoom level, which made a 1440px
        // frame measure 720px at 50% zoom and flip the layout to phone.
        // offsetWidth and ResizeObserver both report layout pixels.
        const read = () => setWidth(node.offsetWidth)
        read()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", read)
            return () => window.removeEventListener("resize", read)
        }
        const observer = new ResizeObserver(read)
        observer.observe(node)
        return () => observer.disconnect()
    }, [ref])

    return width
}

/** The viewport's height, kept current. 0 until measured (and on the
 *  server), which callers read as "unknown — don't constrain". */
function useViewportHeight() {
    const [height, setHeight] = useState(0)

    useEffect(() => {
        if (typeof window === "undefined") return
        const read = () => startTransition(() => setHeight(window.innerHeight))
        read()
        window.addEventListener("resize", read)
        return () => window.removeEventListener("resize", read)
    }, [])

    return height
}

function useReducedMotion() {
    const [reduced, setReduced] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => startTransition(() => setReduced(mql.matches))
        update()
        mql.addEventListener("change", update)
        return () => mql.removeEventListener("change", update)
    }, [])

    return reduced
}

/* ================================================================== *
 * Project Index
 * ================================================================== */

/**
 * Project Index
 *
 * A ready-to-use editorial project list. Add your projects in the
 * **Projects** control — no CMS collection required.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function EditorialProjectIndex(props: ProjectIndexProps) {
    const {
        projects: chosenProjects = [],

        headline = "PROJECTS",
        showHeadline = true,
        showCount = true,
        countPrefix = "/",
        countDigits = 2,

        theme = "light",
        paintBackground = true,
        bgColor = "#FFFFFF",
        textColor = "#0E0E0E",
        dimColor = "rgba(0, 0, 0, 0.25)",
        lineColor = "rgba(0, 0, 0, 0.15)",
        activeLineColor = "#000000",
        countColor = "rgba(0, 0, 0, 0.4)",
        mediaBrightness = 1,

        headlineFont: headlineFontChosen,
        rowFont: rowFontChosen,
        countFont: countFontChosen,

        sectionHeight = 800,
        fillViewport = true,
        margin = 20,
        columns = 14,
        gutter = 4,
        rowHeight = 44,
        rowPadding = "12px 0px 24px 0px",
        titleColumn = 2,
        yearColumn = 13,
        categoryColumn = 14,
        headlineGap = 125,

        previewWidth = 398,
        previewHeight = 545,
        previewRadius = "0px",
        drift = 100,
        driftRange = 260,
        fadeDuration = 0.45,

        layoutMode = "auto",
        compactMode = "scroll",
        rowScroll = 55,
        tabletBreakpoint = 1100,
        phoneBreakpoint = 768,
        mediaRatio = 0.73,
        compactMargin = 10,

        showNumber = true,
        showArrow = true,
        newTab = false,

        style,
    } = props
    const projects = useMemo(() => withDemoMedia(chosenProjects), [chosenProjects])
    const headlineFont = inGeist(headlineFontChosen)
    const rowFont = inGeist(rowFontChosen)
    const countFont = inGeist(countFontChosen)
    const loadGeist = [headlineFontChosen, rowFontChosen, countFontChosen].some(onDefaultFamily)

    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()

    const rootRef = useRef<HTMLDivElement | null>(null)
    const headlineRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLUListElement | null>(null)
    const previewRef = useRef<HTMLDivElement | null>(null)
    const driftRef = useRef<HTMLDivElement | null>(null)

    const width = useElementWidth(rootRef)
    const viewportHeight = useViewportHeight()

    /* ---- Breakpoint ------------------------------------------------ *
     * Measured from the component, not the window: Framer's canvas and
     * its breakpoint variants resize the component, while the editor
     * window stays wide — a media query would report the wrong layout. */
    const forced = normalizeEnum(layoutMode, "auto")
    const mode: Mode =
        forced === "desktop" || forced === "list"
            ? "desktop"
            : forced === "tablet" || forced === "grid"
              ? "tablet"
              : forced === "phone" || forced === "stacked"
                ? "phone"
                : width === 0
                  ? "desktop" // pre-measure; corrected before paint
                  : width <= phoneBreakpoint
                    ? "phone"
                    : width <= tabletBreakpoint
                      ? "tablet"
                      : "desktop"

    const isDesktop = mode === "desktop"

    /* ---- Compact behaviour -----------------------------------------
     * Scroll keeps the desktop grammar below the breakpoint — one shared
     * image, one row at full weight, the rest dimmed — with the scroll
     * position standing in for the cursor. Feed is the older layout: a
     * stack of cards, each carrying its own picture.
     *
     * At tablet width the scroll layout is the desktop composition
     * outright, image centred behind a full-width list, so it borrows the
     * desktop row and positioning throughout. */
    //
    // Someone who has asked for less motion gets the feed instead. Scroll
    // is motion by definition — the image changes as the page moves — and
    // switching the driver off isn't enough on its own: the pinned track
    // would still be thousands of pixels of scrolling with nothing on
    // screen changing. The feed shows every project with its own picture,
    // and its reveal already stands down under reduced motion.
    //
    // Not on the canvas, though: Framer's renderer reports reduced motion
    // there, and nothing on a canvas moves anyway — honouring it would
    // show the designer the feed while every visitor gets the scroll.
    const motionFallback = reducedMotion && !isStatic
    const compactScroll =
        !isDesktop &&
        !motionFallback &&
        normalizeEnum(compactMode, "scroll") === "scroll"
    // At tablet width the scroll layout IS the desktop one, so its rows
    // use the desktop grid rather than the compact four-column card.
    const rowMode: Mode =
        isDesktop || (compactScroll && mode === "tablet") ? "desktop" : mode
    // Dim the siblings of whichever row is active. The feed doesn't: with
    // every picture on screen at once there is nothing to point at.
    const emphasise = isDesktop || compactScroll

    /* ---- Palette --------------------------------------------------- */
    const themeMode = normalizeEnum(theme, "light")
    const palette: Palette =
        themeMode === "dark"
            ? DARK
            : themeMode === "custom"
              ? {
                    bg: bgColor,
                    text: textColor,
                    dim: dimColor,
                    line: lineColor,
                    activeLine: activeLineColor,
                    count: countColor,
                    media: mediaBrightness,
                }
              : LIGHT

    /* ---- Selection -------------------------------------------------
     * One row is always active (full weight); the rest dim. Defaults to
     * the first project and reverts there when the pointer leaves. */
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        // Keep the selection valid if projects are added or removed.
        if (activeIndex > projects.length - 1) setActiveIndex(0)
    }, [projects.length, activeIndex])

    const onRowEnter = useCallback((index: number) => {
        setActiveIndex(index)
    }, [])

    // Leaving the list rests back on the first project, exactly as the
    // original does — adjacent rows hand over without passing through it.
    const onListLeave = useCallback(() => setActiveIndex(0), [])

    const onListBlur = useCallback((event: ReactFocusEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setActiveIndex(0)
        }
    }, [])

    const active = projects[activeIndex] ?? projects[0]

    /* ---- Headline anchoring ----------------------------------------
     * The list is vertically centred, so the headline is positioned
     * relative to the list's measured height — which keeps the design's
     * spacing at any number of rows or any row height. */
    const [listHeight, setListHeight] = useState(0)

    const useIsomorphic =
        typeof window === "undefined" ? useEffect : useLayoutEffect

    useIsomorphic(() => {
        const node = listRef.current
        if (!node || !isDesktop) return
        // offsetHeight for the same reason — a scaled rect would halve the
        // list height and mis-anchor the headline above it.
        const read = () => setListHeight(node.offsetHeight)
        read()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(read)
        observer.observe(node)
        return () => observer.disconnect()
    }, [isDesktop, projects.length, rowHeight, rowPadding])

    /* ---- Compact scroll: pin or flow --------------------------------
     * Pinned, the whole stage holds still and the section becomes a tall
     * track with a slice per project. That reads best, but the list has
     * to share one screen with the image, so it has a ceiling. Past it
     * only the image pins and the list scrolls underneath.
     *
     * The ceiling is worked out from the space a full-size picture needs:
     * the image ratio is the one thing that never gives. */
    const [scrollMode, setScrollMode] = useState<ScrollMode>("pin")

    // The phone stage's gaps around the image: 14px when there's room,
    // shrinking towards 8px when there isn't.
    const PHONE_GAP = 14
    const PHONE_GAP_MIN = 8

    const imageRatio =
        previewWidth > 0 ? previewHeight / previewWidth : 1635 / 1194

    useIsomorphic(() => {
        if (!compactScroll || isStatic) return

        const measure = () => {
            const headlineH = headlineRef.current
                ? headlineRef.current.offsetHeight + 40
                : 72
            // Rects, not offsetHeight: rounding each row up can cost a
            // project from a list that genuinely fits.
            let rowsH = 0
            const listNode = listRef.current
            if (listNode) {
                Array.from(listNode.children).forEach((row) => {
                    rowsH += row.getBoundingClientRect().height
                })
            }
            // The natural width, not the drawn one: in flow mode a short
            // screen can shrink the image, and measuring that would make
            // pin look like it fits again — which grows the image back,
            // which tips it into flow, round and round.
            const rootW = rootRef.current?.offsetWidth ?? 0
            const imageW = Math.max(0, rootW - 2 * compactMargin)
            // On a phone the three stack and divide one screen between
            // them; on a tablet the image sits behind the list, so only
            // the headline and list compete for the height.
            const fixed =
                mode === "phone"
                    ? // The two gaps around the image at their minimum:
                      // they run 14px but give way to 8px on a tight
                      // screen, so the decision isn't balanced on a
                      // fraction of a pixel. Browsers disagree by half a
                      // pixel per row; over eight rows that was enough to
                      // tip a fitting list into flow.
                      headlineH + 2 * PHONE_GAP_MIN + imageW * imageRatio
                    : headlineGap + 32 + 24
            startTransition(() =>
                setScrollMode(
                    fixed + rowsH > window.innerHeight ? "flow" : "pin"
                )
            )
        }

        measure()
        window.addEventListener("resize", measure)
        return () => window.removeEventListener("resize", measure)
    }, [
        compactScroll,
        isStatic,
        mode,
        projects.length,
        rowHeight,
        rowPadding,
        headlineGap,
        imageRatio,
        compactMargin,
    ])

    const isPinned = compactScroll && scrollMode === "pin"

    /* ---- Compact scroll: the driver ---------------------------------
     * Pinned, the active project comes from progress along the track.
     * Flowing, it is the last row to have risen past a line just under
     * the image — so the project on show is always the one directly
     * beneath its own photograph. */
    useEffect(() => {
        if (!compactScroll || isStatic || reducedMotion) return
        if (typeof window === "undefined") return

        const rowNodes = () =>
            listRef.current ? Array.from(listRef.current.children) : []

        let ticking = false

        const pick = () => {
            ticking = false
            const root = rootRef.current
            if (!root) return

            let next = 0
            if (scrollMode === "pin") {
                const travel = root.offsetHeight - window.innerHeight
                if (travel > 0) {
                    const scrolled = -root.getBoundingClientRect().top
                    const progress = Math.min(
                        1,
                        Math.max(0, scrolled / travel)
                    )
                    next = Math.min(
                        projects.length - 1,
                        Math.floor(progress * projects.length)
                    )
                }
            } else {
                const focus =
                    (previewRef.current?.getBoundingClientRect().bottom ?? 0) +
                    28
                rowNodes().forEach((row, i) => {
                    if (row.getBoundingClientRect().top <= focus) next = i
                })
                const atBottom =
                    window.innerHeight + window.scrollY >=
                    document.documentElement.scrollHeight - 2
                if (atBottom) next = projects.length - 1
            }

            setActiveIndex((current) => (current === next ? current : next))
        }

        const onScroll = () => {
            if (ticking) return
            ticking = true
            requestAnimationFrame(pick)
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        pick()
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
        }
    }, [compactScroll, isStatic, reducedMotion, scrollMode, projects.length])

    /* ---- Cursor drift ----------------------------------------------
     * The "grab" model: the drift arms only once the cursor is actually
     * over the image, then tracks how far it has travelled left or right
     * of that grab point. Leaving the list releases it back to centre
     * with slower easing, so the return reads as a glide, not a snap. */
    const targetX = useRef(0)
    const currentX = useRef(0)
    const rafId = useRef<number | null>(null)
    const armed = useRef(false)
    const anchorX = useRef(0)
    const gateUntil = useRef(0)

    useEffect(() => {
        if (isStatic || reducedMotion || !isDesktop || drift === 0) return
        const listNode = listRef.current
        if (!listNode) return

        const EASE_FOLLOW = 0.12 // responsive tracking while dragging
        const EASE_GATE = 0.05 // slower glide when releasing to centre
        const GATE_MS = 650 // how long that slow easing lasts

        const tick = () => {
            const ease =
                performance.now() < gateUntil.current ? EASE_GATE : EASE_FOLLOW
            currentX.current += (targetX.current - currentX.current) * ease
            if (Math.abs(targetX.current - currentX.current) < 0.05) {
                currentX.current = targetX.current
            }
            if (driftRef.current) {
                // translate3d keeps the drift on the GPU compositor.
                driftRef.current.style.transform = `translate3d(${currentX.current.toFixed(2)}px,0,0)`
            }
            rafId.current =
                currentX.current !== targetX.current
                    ? requestAnimationFrame(tick)
                    : null
        }

        const ensureAnimating = () => {
            if (rafId.current === null) {
                rafId.current = requestAnimationFrame(tick)
            }
        }

        const onMove = (event: MouseEvent) => {
            if (!armed.current) {
                const node = previewRef.current
                if (!node) return
                // The transform lives on the inner div, so this rect is
                // the image's stable resting box.
                const r = node.getBoundingClientRect()
                const over =
                    event.clientX >= r.left &&
                    event.clientX <= r.right &&
                    event.clientY >= r.top &&
                    event.clientY <= r.bottom
                if (!over) return
                armed.current = true
                anchorX.current = event.clientX // grab point
            }

            const delta = event.clientX - anchorX.current
            const n = Math.max(-1, Math.min(1, delta / Math.max(1, driftRange)))
            targetX.current = Math.sign(n) * smoothstep(Math.abs(n)) * drift
            ensureAnimating()
        }

        const release = () => {
            if (armed.current) {
                armed.current = false
                gateUntil.current = performance.now() + GATE_MS
            }
            targetX.current = 0
            ensureAnimating()
        }

        listNode.addEventListener("mousemove", onMove)
        listNode.addEventListener("mouseleave", release)
        return () => {
            listNode.removeEventListener("mousemove", onMove)
            listNode.removeEventListener("mouseleave", release)
            if (rafId.current !== null) cancelAnimationFrame(rafId.current)
            rafId.current = null
        }
    }, [isStatic, reducedMotion, isDesktop, drift, driftRange])

    /* ---- Styles ---------------------------------------------------- */

    // The design keeps a 20px margin down to tablet and tightens to 10px on
    // phones, so only the phone layout uses the compact value.
    const sideMargin = mode === "phone" ? compactMargin : margin
    const contentWidth = Math.max(0, width - 2 * sideMargin)

    /* How the three pieces are arranged.
     *
     *  absolute  the desktop composition — image centred behind a list
     *            that is itself centred on the section. Tablet borrows it
     *            while pinned, since it has the width for it.
     *  flexStage headline, image, list stacked down one pinned screen.
     *  flow      nothing pinned but the image; the list scrolls past it. */
    const flowComposition = compactScroll && scrollMode === "flow"
    const absoluteComposition =
        isDesktop || (compactScroll && mode === "tablet" && !flowComposition)
    const flexStage =
        compactScroll && mode === "phone" && !flowComposition

    /* The picture's size. Desktop uses the figures as given; the compact
     * layouts derive a width from the grid and take the height from the
     * ratio, so the photograph is never cropped to fit a layout. */
    const columnWidth =
        columns > 0 ? (contentWidth - (columns - 1) * gutter) / columns : 0
    const rawSpan = Math.floor((previewWidth + gutter) / (columnWidth + gutter))
    // Even spans only, so the image can sit symmetrically on the grid.
    const span = Math.max(2, Math.min(columns, rawSpan - (rawSpan % 2)))

    /* How tall the picture may be. Holding the ratio isn't enough on its
     * own: a phone turned sideways is a tablet only 390px tall, and the
     * grid-derived image there came out at 469px — taller than the screen,
     * covering it, with the list never in view.
     *
     *  pinned (tablet)  the image sits behind the list in a one-screen
     *                   stage, so it just has to fit the screen.
     *  flowing          it pins under the headline, and below it needs
     *                   the focus line plus a few rows of list to read.
     *
     * Not on the canvas, whose viewport is the editor's, not a visitor's. */
    const LIST_WINDOW = 120
    const imageCap =
        isStatic || !compactScroll || viewportHeight <= 0
            ? Infinity
            : flowComposition
              ? viewportHeight - 16 - 28 - LIST_WINDOW
              : mode === "tablet"
                ? viewportHeight - 32
                : Infinity

    // Step down by even spans, so it stays centred on column edges and
    // keeps its ratio — it only ever gets smaller, never squashed.
    const spanWidth = (n: number) => n * columnWidth + (n - 1) * gutter
    let tabletSpan = span
    while (tabletSpan > 2 && spanWidth(tabletSpan) * imageRatio > imageCap) {
        tabletSpan -= 2
    }
    // A phone's grid is four columns, so the only narrower centred span
    // is the middle two.
    const phoneColumn = (contentWidth - 3 * 4) / 4
    const phoneWidth =
        contentWidth * imageRatio > imageCap
            ? 2 * phoneColumn + 4
            : contentWidth

    const previewBox = isDesktop
        ? { w: previewWidth, h: previewHeight }
        : mode === "tablet"
          ? { w: spanWidth(tabletSpan), h: spanWidth(tabletSpan) * imageRatio }
          : { w: phoneWidth, h: phoneWidth * imageRatio }

    const sectionBase = fillViewport ? "100svh" : `${sectionHeight}px`
    // Room for the list plus the headline gap and its own margin at each
    // end, so a long list is framed like a short one instead of pushing
    // the headline off the top. At the default eight it stays as set.
    const desktopMin = `max(${sectionBase}, ${Math.round(
        listHeight + 2 * headlineGap + 198
    )}px)`
    // Whether the desktop section is taller than the screen, which only a
    // long list makes it. Unknown (server, canvas, first paint) reads as no.
    const desktopHeight = Math.max(
        fillViewport ? viewportHeight : sectionHeight,
        Math.round(listHeight + 2 * headlineGap + 198)
    )
    const outgrowsViewport =
        !isStatic && viewportHeight > 0 && desktopHeight > viewportHeight + 1

    // Pinned: one screen to read the first project, then a slice each.
    const pinTrack = `calc(100svh + ${Math.max(
        0,
        projects.length - 1
    )} * ${rowScroll}svh)`

    const rootStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        background: paintBackground ? palette.bg : undefined,
        color: palette.text,
        minHeight: isDesktop
            ? desktopMin
            : // The absolute composition has nothing in normal flow to
              // give it a height, so on the canvas — where the stage isn't
              // pinned — it needs one stated outright or it collapses and
              // the centred content spills off the top.
              isStatic && absoluteComposition
              ? desktopMin
              : // The canvas doesn't scroll either, so the pinned track
                // would show as the composition followed by several
                // thousand pixels of empty runway. There it sizes to its
                // content instead.
                compactScroll && !flowComposition && !isStatic
                ? pinTrack
                : undefined,
        // clip, not hidden: both contain the drifting preview, but hidden
        // makes this a scroll container, which would anchor the sticky
        // image to a box that never scrolls.
        overflow: isDesktop ? "clip" : undefined,
        ...style,
    }

    const stageStyle: CSSProperties = {
        position: isStatic ? "static" : "sticky",
        top: 0,
        height: isStatic ? "auto" : "100svh",
        overflow: isStatic ? "visible" : "hidden",
        display: flexStage ? "flex" : "block",
        flexDirection: flexStage ? "column" : undefined,
    }

    const headlineBlock = showHeadline ? (
        <div
            ref={headlineRef}
            style={{
                position: absoluteComposition ? "absolute" : "static",
                left: absoluteComposition ? margin : undefined,
                // Anchored above the centred list: half the list, plus the
                // design's headline-to-list distance.
                top: absoluteComposition
                    ? `calc(50% - ${listHeight / 2 + headlineGap}px)`
                    : undefined,
                margin: absoluteComposition
                    ? undefined
                    : flexStage || flowComposition
                      ? `40px ${sideMargin}px 0`
                      : mode === "tablet"
                        ? `56px ${sideMargin}px 16px`
                        : `40px ${sideMargin}px 40px`,
                flex: "none",
                display: "flex",
                alignItems: "flex-start",
                gap: 4,
                zIndex: 3,
            }}
        >
            <h2
                style={{
                    margin: 0,
                    fontSize: 32,
                    fontWeight: 300,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    textTransform: "uppercase",
                    color: palette.text,
                    // The absolute composition anchors the headline off
                    // its cap-top; the flowing ones space it with plain
                    // margins, so they keep the untrimmed line box.
                    ...(absoluteComposition ? TRIM : null),
                    ...headlineFont,
                }}
            >
                {headline}
            </h2>
            {showCount && (
                <span
                    style={{
                        marginTop: 1,
                        fontSize: 10,
                        fontWeight: 300,
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                        whiteSpace: "nowrap",
                        color: palette.count,
                        ...countFont,
                    }}
                >
                    {`${countPrefix}${String(projects.length).padStart(
                        Math.max(0, countDigits),
                        "0"
                    )}`}
                </span>
            )}
        </div>
    ) : null

    const listStyle: CSSProperties = absoluteComposition
        ? {
              position: "absolute",
              left: margin,
              right: margin,
              top: "50%",
              transform: "translateY(-50%)",
              listStyle: "none",
              margin: 0,
              padding: 0,
              zIndex: 1,
          }
        : flexStage
          ? {
                listStyle: "none",
                margin: `0 0 auto`,
                padding: `0 ${sideMargin}px`,
                flex: "none",
            }
          : flowComposition
            ? {
                  listStyle: "none",
                  // Trailing room so the last rows can still reach the
                  // focus line under the image.
                  margin: "24px 0 0",
                  padding: `0 ${sideMargin}px 46svh`,
              }
            : {
                  listStyle: "none",
                  margin: "12px 0 16px",
                  padding: `0 ${sideMargin}px`,
                  display: mode === "tablet" ? "grid" : undefined,
                  gridTemplateColumns: mode === "tablet" ? "1fr 1fr" : undefined,
                  columnGap: mode === "tablet" ? 20 : undefined,
                  rowGap: mode === "tablet" ? 16 : undefined,
                  alignItems: mode === "tablet" ? "start" : undefined,
              }

    // On the desktop row grid the list owns the columns and every row
    // subgrids into them, so alignment holds whatever the content.
    if (rowMode === "desktop") {
        Object.assign(listStyle, {
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            columnGap: gutter,
            rowGap: 0,
        })
    }

    /* ---- Preview ---------------------------------------------------- */

    // On the canvas there's no hover, so show the first project's media.
    const previewItem = isStatic ? projects[0] : active
    const previewMedia = previewItem?.video
        ? {
              kind: "video" as const,
              src: previewItem.video,
              poster: previewItem.poster?.src ?? previewItem.image?.src,
          }
        : previewItem?.image?.src
          ? { kind: "image" as const, item: previewItem }
          : null

    const mediaStyle: CSSProperties = {
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter:
            palette.media !== 1 ? `brightness(${palette.media})` : undefined,
    }

    const previewPlacement: CSSProperties = isDesktop
        ? !outgrowsViewport
            ? {
                  // Centred on the section, like the headline and list. A
                  // section that fits on screen scrolls as one piece, so
                  // the image has no reason to stick — and sticking to the
                  // viewport's middle put it below the section's middle
                  // whenever the window was taller than the section. The
                  // canvas always lands here: it doesn't scroll, and svh
                  // there is the editor window's height.
                  position: "absolute",
                  top: `calc(50% - ${previewBox.h / 2}px)`,
                  left: `calc(50% - ${previewBox.w / 2}px)`,
              }
            : {
                  // Taller than the screen (a long list): sticky, so the
                  // image stays in view while the list scrolls past. It
                  // rests a half-screen down, and holds the screen's
                  // middle from there. svh, not %: a percentage inset on
                  // a sticky box resolves against the containing block,
                  // which here is the whole tall section.
                  position: "sticky",
                  top: `calc(50svh - ${previewBox.h / 2}px)`,
                  margin: `calc(50svh - ${previewBox.h / 2}px) auto 0`,
              }
        : absoluteComposition
          ? {
                position: "absolute",
                top: `calc(50% - ${previewBox.h / 2}px)`,
                left: `calc(50% - ${previewBox.w / 2}px)`,
            }
          : flowComposition
            ? { position: "sticky", top: 16, margin: `24px auto 0` }
            : {
                  position: "static",
                  // The gaps either side come from the stage's spacers
                  // (14px, shrinking to 8 on a tight screen); whatever a
                  // taller phone has over that falls under the list.
                  margin: "0 auto",
                  flex: "none",
              }

    // A component dropped fresh has no pictures yet, and with nothing in
    // the preview slot the hover looks broken rather than empty. On the
    // canvas only, the slot is drawn as a hairline frame saying what goes
    // there. Never on a published page — a missing image there should
    // just be absent, not announce itself to visitors.
    const showPlaceholder = isStatic && !previewMedia

    const previewBlock =
        (isDesktop || compactScroll) && (previewMedia || showPlaceholder) ? (
            <div
                ref={previewRef}
                aria-hidden
                style={{
                    width: previewBox.w,
                    height: previewBox.h,
                    pointerEvents: "none",
                    zIndex: 2, // above the row separators
                    animation:
                        reducedMotion || isStatic
                            ? undefined
                            : `framerProjectIndexFade ${fadeDuration}s ease`,
                    ...previewPlacement,
                }}
            >
                {/* The drift transform and the clip live on the SAME element,
                    so the whole box travels as a unit — the image is never
                    cut against a stationary overflow window. */}
                <div
                    ref={driftRef}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        borderRadius: previewRadius,
                        willChange: "transform",
                    }}
                >
                    {!previewMedia ? (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 16,
                                border: `0.5px solid ${palette.line}`,
                                color: palette.dim,
                                fontSize: 10,
                                fontWeight: 300,
                                lineHeight: 1.5,
                                letterSpacing: 0,
                                textTransform: "uppercase",
                                textAlign: "center",
                                ...rowFont,
                            }}
                        >
                            Add an image to each project
                            <br />
                            in the Projects control
                        </div>
                    ) : previewMedia.kind === "video" ? (
                        <video
                            key={previewMedia.src}
                            src={previewMedia.src}
                            poster={previewMedia.poster}
                            muted
                            loop
                            playsInline
                            autoPlay
                            style={mediaStyle}
                        />
                    ) : (
                        <img
                            src={previewMedia.item.image?.src}
                            srcSet={previewMedia.item.image?.srcSet}
                            alt={previewMedia.item.title ?? ""}
                            style={mediaStyle}
                        />
                    )}
                </div>
            </div>
        ) : null

    // On desktop the image needs a full-height box to be sticky within;
    // a sticky element takes part in the flow, so without one it would
    // push the list down by its own height.
    const previewLayer =
        isDesktop && previewBlock ? (
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 2,
                }}
            >
                {previewBlock}
            </div>
        ) : (
            previewBlock
        )

    /* ---- Render ----------------------------------------------------- */

    // The phone stage's gaps are elements rather than margins, because
    // margins can't shrink: 14px at rest, giving way towards 8px when a
    // screen is a pixel or two short instead of clipping the list.
    const gap = flexStage ? (
        <div
            aria-hidden
            style={{
                flex: `0 1 ${PHONE_GAP}px`,
                minHeight: PHONE_GAP_MIN,
            }}
        />
    ) : null

    const body = (
        <>
            {headlineBlock}
            {gap}
            {previewLayer}
            {gap}

            <ul
                ref={listRef}
                style={listStyle}
                onMouseLeave={isDesktop ? onListLeave : undefined}
                onBlur={isDesktop ? onListBlur : undefined}
            >
                {projects.map((project, index) => (
                    <Row
                        key={index}
                        project={project}
                        index={index}
                        total={projects.length}
                        mode={rowMode}
                        palette={palette}
                        isActive={index === activeIndex}
                        dimmed={emphasise && index !== activeIndex}
                        emphasise={emphasise}
                        showMedia={!isDesktop && !compactScroll}
                        onEnter={onRowEnter}
                        rowFont={rowFont}
                        columns={columns}
                        gutter={gutter}
                        rowHeight={rowHeight}
                        rowPadding={rowPadding}
                        titleColumn={titleColumn}
                        yearColumn={yearColumn}
                        categoryColumn={categoryColumn}
                        showNumber={showNumber}
                        showArrow={showArrow}
                        newTab={newTab}
                        mediaRatio={mediaRatio}
                        reducedMotion={reducedMotion}
                        isStatic={isStatic}
                    />
                ))}
            </ul>
        </>
    )

    return (
        <div ref={rootRef} style={rootStyle}>
            {loadGeist && <style>{GEIST_CSS}</style>}
            {/* Pinned, the whole composition holds still inside one screen
                while the track scrolls behind it. */}
            {compactScroll && !flowComposition ? (
                <div style={stageStyle}>{body}</div>
            ) : (
                body
            )}

            {projects.length === 0 && (
                <div
                    style={{
                        padding: sideMargin,
                        fontSize: 10,
                        lineHeight: 1.5,
                        textTransform: "uppercase",
                        color: palette.dim,
                        ...rowFont,
                    }}
                >
                    Add projects in the Projects control
                </div>
            )}

            <style>
                {"@keyframes framerProjectIndexFade{from{opacity:0}to{opacity:1}}"}
            </style>
        </div>
    )
}

/* ------------------------------------------------------------------ *
 * Row
 * ------------------------------------------------------------------ */

interface RowProps {
    project: ProjectItem
    index: number
    total: number
    mode: Mode
    palette: Palette
    isActive: boolean
    dimmed: boolean
    /** Mark the active row — full weight text and a solid hairline. */
    emphasise: boolean
    /** The feed carries a picture per row; the scroll layouts don't. */
    showMedia: boolean
    onEnter: (index: number) => void
    rowFont?: CSSProperties
    columns: number
    gutter: number
    rowHeight: number
    rowPadding: string
    titleColumn: number
    yearColumn: number
    categoryColumn: number
    showNumber: boolean
    showArrow: boolean
    newTab: boolean
    mediaRatio: number
    reducedMotion: boolean
    isStatic: boolean
}

function Row({
    project,
    index,
    mode,
    palette,
    isActive,
    dimmed,
    emphasise,
    showMedia,
    onEnter,
    rowFont,
    columns,
    gutter,
    rowHeight,
    rowPadding,
    titleColumn,
    yearColumn,
    categoryColumn,
    showNumber,
    showArrow,
    newTab,
    mediaRatio,
    reducedMotion,
    isStatic,
}: RowProps) {
    const isDesktop = mode === "desktop"
    const handleEnter = useCallback(() => onEnter(index), [onEnter, index])

    const rowStyle: CSSProperties = {
        position: "relative",
        display: "grid",
        // Desktop rows are a true n-column grid (the design: 14 columns,
        // 4px gutter), so every cell snaps to the section's layout grid at
        // any width. Compact keeps its own 4-column card grid.
        // Desktop rows take their columns from the list (subgrid) instead
        // of each sizing its own. A 1fr column can't shrink below its text,
        // so with a grid per row a long category widened the last column in
        // that row alone and pulled its year left — up to 30px out of line
        // below ~1280px. Shared columns size once, from every row's content,
        // and the year column moves for all rows together.
        gridColumn: isDesktop ? "1 / -1" : undefined,
        gridTemplateColumns: isDesktop ? "subgrid" : "repeat(4, 1fr)",
        // A subgrid inherits the list's gutter.
        columnGap: isDesktop ? undefined : 4,
        rowGap: isDesktop || !showMedia ? 0 : mode === "tablet" ? 16 : 20,
        alignItems: "start",
        width: "100%",
        boxSizing: "border-box",
        // Fixed desktop row height (the design: 44px = 12 top + cap-height
        // text + 24 bottom). Compact cards size to their content.
        height: isDesktop && rowHeight > 0 ? rowHeight : undefined,
        padding: isDesktop
            ? rowPadding
            : !showMedia
              ? "8px 0px 9px"
              : mode === "tablet"
                ? "14px 0px 28px"
                : "12px 0px 24px",
        borderTop: `0.5px solid ${
            isActive && emphasise ? palette.activeLine : palette.line
        }`,
        color: dimmed ? palette.dim : palette.text,
        textDecoration: "none",
        textTransform: "uppercase",
        fontSize: 10,
        fontWeight: 300,
        lineHeight: 1.2,
        // The line marks which row you're on, so it keeps up with the
        // pointer; the text dim is atmosphere and can stay slower.
        transition: reducedMotion
            ? undefined
            : "color 0.35s ease, border-color 0.18s ease",
        ...rowFont,
    }

    const content = isDesktop ? (
        <>
            {showNumber && (
                <span style={{ gridColumn: "1 / 2", ...TRIM }}>
                    {project.number}
                </span>
            )}
            <span
                style={{
                    gridColumn: `${titleColumn} / ${yearColumn}`,
                    whiteSpace: "nowrap",
                    ...TRIM,
                }}
            >
                {project.title}
            </span>
            <span
                style={{
                    gridColumn: `${yearColumn} / ${categoryColumn}`,
                    ...TRIM,
                }}
            >
                {project.year}
            </span>
            <span
                style={{
                    gridColumn: `${categoryColumn} / -1`,
                    display: "flex",
                    alignItems: "flex-start",
                    // One gutter between the category and its arrow. Where
                    // the column sizes to its content, this is what stops
                    // the longest category running into the arrow.
                    columnGap: gutter,
                }}
            >
                <span style={TRIM}>{project.category}</span>
                {showArrow && (
                    <svg
                        viewBox="0 0 8.19849 8.26562"
                        style={{
                            width: 8.2,
                            height: 8.27,
                            marginLeft: "auto",
                            flexShrink: 0,
                            opacity: isActive ? 1 : 0,
                            transition: reducedMotion
                                ? undefined
                                : "opacity 0.35s ease",
                        }}
                    >
                        <path
                            d="M8.0918 3.875C8.2341 4.01733 8.23402 4.24825 8.0918 4.39062L4.2168 8.26562L3.70117 7.75L6.94531 4.50586H0V3.77734H6.96289L3.70117 0.515625L4.2168 0L8.0918 3.875Z"
                            fill="currentColor"
                        />
                    </svg>
                )}
            </span>
        </>
    ) : (
        <>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    gridColumn: "1 / 3",
                }}
            >
                {showNumber && <span>{project.number}</span>}
                <span style={{ whiteSpace: "nowrap" }}>{project.title}</span>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    alignItems: "center",
                    columnGap: 4,
                    gridColumn: "3 / 5",
                }}
            >
                <span>{project.year}</span>
                {/* The arrow shares this cell with the category rather than
                    taking a column of its own, so it arrives by making
                    room: the category's padding opens and the text slides
                    left as the arrow fades in on the column edge. Both
                    need an explicit grid-row, or auto-placement drops the
                    second onto a new row underneath. */}
                <span
                    style={{
                        gridColumn: 2,
                        gridRow: 1,
                        justifySelf: "end",
                        textAlign: "right",
                        paddingRight: showArrow && isActive ? 12.2 : 0,
                        transition: reducedMotion
                            ? undefined
                            : "padding-right 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                >
                    {project.category}
                </span>
                {showArrow && !showMedia && (
                    <svg
                        viewBox="0 0 8.19849 8.26562"
                        style={{
                            gridColumn: 2,
                            gridRow: 1,
                            justifySelf: "end",
                            alignSelf: "center",
                            width: 8.2,
                            height: 8.27,
                            opacity: isActive ? 1 : 0,
                            transform: isActive ? undefined : "translateX(4px)",
                            transition: reducedMotion
                                ? undefined
                                : "opacity 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                    >
                        <path
                            d="M8.0918 3.875C8.2341 4.01733 8.23402 4.24825 8.0918 4.39062L4.2168 8.26562L3.70117 7.75L6.94531 4.50586H0V3.77734H6.96289L3.70117 0.515625L4.2168 0L8.0918 3.875Z"
                            fill="currentColor"
                        />
                    </svg>
                )}
            </div>

            {showMedia && (
                <InlineMedia
                    project={project}
                    ratio={mediaRatio}
                    brightness={palette.media}
                    reducedMotion={reducedMotion}
                    isStatic={isStatic}
                />
            )}
        </>
    )

    const label = [project.title, project.year, project.category]
        .filter(Boolean)
        .join(", ")

    return (
        <li
            style={{
                listStyle: "none",
                ...(isDesktop
                    ? {
                          display: "grid",
                          gridColumn: "1 / -1",
                          gridTemplateColumns: "subgrid",
                      }
                    : null),
            }}
        >
            {project.link ? (
                <a
                    href={project.link}
                    target={newTab ? "_blank" : undefined}
                    rel={newTab ? "noopener noreferrer" : undefined}
                    aria-label={label}
                    style={rowStyle}
                    onMouseEnter={handleEnter}
                    onFocus={handleEnter}
                >
                    {content}
                </a>
            ) : (
                <div style={rowStyle} onMouseEnter={handleEnter}>
                    {content}
                </div>
            )}
        </li>
    )
}

/* ------------------------------------------------------------------ *
 * Inline media — compact modes only, revealed on scroll
 * ------------------------------------------------------------------ */

function InlineMedia({
    project,
    ratio,
    brightness,
    reducedMotion,
    isStatic,
}: {
    project: ProjectItem
    ratio: number
    brightness: number
    reducedMotion: boolean
    isStatic: boolean
}) {
    const ref = useRef<HTMLDivElement | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        // On the canvas an artboard isn't a real viewport — show the media
        // immediately rather than waiting for an intersection that may
        // never come.
        if (isStatic) {
            setInView(true)
            return
        }
        const node = ref.current
        if (!node || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        startTransition(() => setInView(true))
                        videoRef.current?.play().catch(() => {})
                    } else {
                        videoRef.current?.pause()
                    }
                })
            },
            // Reveal as soon as any part of the card enters the viewport,
            // so cards already visible on load show immediately.
            { threshold: 0, rootMargin: "0px 0px -8% 0px" }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [isStatic])

    if (!project.video && !project.image?.src) return null

    const mediaStyle: CSSProperties = {
        display: "block",
        width: "100%",
        aspectRatio: String(ratio),
        objectFit: "cover",
        filter: brightness !== 1 ? `brightness(${brightness})` : undefined,
    }

    const revealed = inView || reducedMotion

    return (
        <div
            ref={ref}
            style={{
                position: "relative",
                gridColumn: "1 / -1",
                width: "100%",
                opacity: revealed ? 1 : 0,
                transform: revealed ? "none" : "translateY(24px)",
                transition: reducedMotion
                    ? undefined
                    : "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
        >
            {project.video ? (
                <video
                    ref={videoRef}
                    src={project.video}
                    poster={project.poster?.src ?? project.image?.src}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    style={mediaStyle}
                />
            ) : (
                <img
                    src={project.image?.src}
                    srcSet={project.image?.srcSet}
                    alt={project.title ?? ""}
                    loading="lazy"
                    style={mediaStyle}
                />
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ *
 * Property controls
 * ------------------------------------------------------------------ */

const isCustom = (props: any) =>
    normalizeEnum(props.theme, "light") !== "custom"

const sample = (
    number: string,
    title: string,
    year: string,
    category: string
): ProjectItem => ({ number, title, year, category })

// Named for the file: the Marketplace form refused the plain ProjectIndex
// ("a component with this source code name already exists"), and a
// display name of "Project Index" would read as the same name.
EditorialProjectIndex.displayName = "Editorial Project Index"

addPropertyControls(EditorialProjectIndex, {
    projects: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 50,
        control: {
            type: ControlType.Object,
            controls: {
                number: {
                    type: ControlType.String,
                    title: "Number",
                    defaultValue: "01.",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Project",
                },
                year: {
                    type: ControlType.String,
                    title: "Year",
                    defaultValue: "2024",
                },
                category: {
                    type: ControlType.String,
                    title: "Category",
                    defaultValue: "category",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    description:
                        "Shown behind the list on hover, and inline on mobile.",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm"],
                    description: "Optional. Takes priority over the image.",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    description:
                        "Video only. The still shown before it plays, and on the canvas and in screenshots. Uses the Image if left empty.",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: [
            sample("01.", "Frequency", "2024", "music"),
            sample("02.", "Endless Horizon", "2024", "equestrian"),
            sample("03.", "Afterglow", "2025", "leisure"),
            sample("04.", "Rotunda", "2025", "architecture"),
            sample("05.", "Primal Form", "2025", "sports"),
            sample("06.", "Drift State", "2025", "automotive"),
            sample("07.", "Stateless", "2026", "fashion"),
            sample("08.", "Open Field", "2026", "lifestyle"),
        ],
    },

    /* ---- Headline ---- */
    showHeadline: {
        type: ControlType.Boolean,
        title: "Show Headline",
        defaultValue: true,
    },
    headline: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "PROJECTS",
        hidden: (props: any) => !props.showHeadline,
    },
    showCount: {
        type: ControlType.Boolean,
        title: "Show Count",
        defaultValue: true,
        description: "A live total beside the headline — /08.",
        hidden: (props: any) => !props.showHeadline,
    },
    countPrefix: {
        type: ControlType.String,
        title: "Count Prefix",
        defaultValue: "/",
        hidden: (props: any) => !props.showHeadline || !props.showCount,
    },
    countDigits: {
        type: ControlType.Number,
        title: "Count Digits",
        defaultValue: 2,
        min: 0,
        max: 4,
        step: 1,
        displayStepper: true,
        description: "Zero-pads the total: 8 → 08.",
        hidden: (props: any) => !props.showHeadline || !props.showCount,
    },

    /* ---- Theme ---- */
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        defaultValue: "light",
        options: ["light", "dark", "custom"],
        optionTitles: ["Light", "Dark", "Custom"],
        displaySegmentedControl: true,
        description:
            "Tuned palettes for light or dark sites. Custom reveals every colour.",
    },
    paintBackground: {
        type: ControlType.Boolean,
        title: "Show Background",
        defaultValue: true,
        description: "Off to sit on the page's own background.",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF",
        hidden: isCustom,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#0E0E0E",
        hidden: isCustom,
    },
    dimColor: {
        type: ControlType.Color,
        title: "Dimmed Color",
        defaultValue: "rgba(0, 0, 0, 0.25)",
        hidden: isCustom,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "rgba(0, 0, 0, 0.15)",
        hidden: isCustom,
    },
    activeLineColor: {
        type: ControlType.Color,
        title: "Active Line Color",
        defaultValue: "#000000",
        hidden: isCustom,
    },
    countColor: {
        type: ControlType.Color,
        title: "Count Color",
        defaultValue: "rgba(0, 0, 0, 0.4)",
        hidden: isCustom,
    },
    mediaBrightness: {
        type: ControlType.Number,
        title: "Media Dim",
        defaultValue: 1,
        min: 0.5,
        max: 1,
        step: 0.01,
        description: "Eases photos back on dark pages (the dark preset uses 0.88).",
        hidden: isCustom,
    },

    /* ---- Typography ---- */
    headlineFont: {
        type: ControlType.Font,
        title: "Headline Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Light",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    rowFont: {
        type: ControlType.Font,
        title: "Row Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "10px",
            variant: "Light",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
    },
    countFont: {
        type: ControlType.Font,
        title: "Count Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "10px",
            variant: "Light",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },

    /* ---- Layout ---- */
    fillViewport: {
        type: ControlType.Boolean,
        title: "Full Height",
        defaultValue: true,
        description: "Desktop only — makes the section one screen tall.",
    },
    sectionHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 800,
        min: 320,
        max: 2000,
        step: 10,
        unit: "px",
        description: "Desktop height the list is centred in.",
        hidden: (props: any) => !!props.fillViewport,
    },
    margin: {
        type: ControlType.Number,
        title: "Margin",
        defaultValue: 20,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
        description: "Desktop side margin.",
    },
    compactMargin: {
        type: ControlType.Number,
        title: "Margin (S)",
        defaultValue: 10,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        description: "Side margin on phones. Tablet keeps the desktop margin.",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 14,
        min: 4,
        max: 24,
        step: 1,
        displayStepper: true,
        description: "Desktop layout grid the row cells snap to.",
    },
    gutter: {
        type: ControlType.Number,
        title: "Gutter",
        defaultValue: 4,
        min: 0,
        max: 40,
        step: 1,
        displayStepper: true,
    },
    rowHeight: {
        type: ControlType.Number,
        title: "Row Height",
        defaultValue: 44,
        min: 0,
        max: 200,
        step: 1,
        displayStepper: true,
        description:
            "Fixed desktop row height (the design: 44px). 0 lets the padding and line-height set it instead.",
    },
    rowPadding: {
        type: ControlType.Padding,
        title: "Row Padding",
        defaultValue: "12px 0px 24px 0px",
    },
    titleColumn: {
        type: ControlType.Number,
        title: "Title Col",
        defaultValue: 2,
        min: 1,
        max: 24,
        step: 1,
        displayStepper: true,
    },
    yearColumn: {
        type: ControlType.Number,
        title: "Year Col",
        defaultValue: 13,
        min: 1,
        max: 24,
        step: 1,
        displayStepper: true,
    },
    categoryColumn: {
        type: ControlType.Number,
        title: "Category Col",
        defaultValue: 14,
        min: 1,
        max: 24,
        step: 1,
        displayStepper: true,
    },
    headlineGap: {
        type: ControlType.Number,
        title: "Headline Gap",
        defaultValue: 125,
        min: 0,
        max: 400,
        step: 0.5,
        unit: "px",
        description: "Headline cap-top to the top of the centred list.",
        hidden: (props: any) => !props.showHeadline,
    },
    showNumber: {
        type: ControlType.Boolean,
        title: "Numbers",
        defaultValue: true,
    },
    showArrow: {
        type: ControlType.Boolean,
        title: "Arrow",
        defaultValue: true,
        description: "Shows on the active row, pinned to the right edge.",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        description: "Opens project links in a new tab.",
    },

    /* ---- Preview image ---- */
    previewWidth: {
        type: ControlType.Number,
        title: "Preview W",
        defaultValue: 398,
        min: 80,
        max: 1200,
        step: 1,
        unit: "px",
    },
    previewHeight: {
        type: ControlType.Number,
        title: "Preview H",
        defaultValue: 545,
        min: 80,
        max: 1600,
        step: 1,
        unit: "px",
    },
    previewRadius: {
        type: ControlType.BorderRadius,
        title: "Preview Radius",
        defaultValue: "0px",
    },
    drift: {
        type: ControlType.Number,
        title: "Drift",
        defaultValue: 100,
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        description: "How far the image follows the cursor. 0 to disable.",
    },
    driftRange: {
        type: ControlType.Number,
        title: "Drift Range",
        defaultValue: 260,
        min: 50,
        max: 800,
        step: 10,
        unit: "px",
        description: "Cursor travel from the grab point to reach the limit.",
        hidden: (props: any) => !props.drift,
    },
    fadeDuration: {
        type: ControlType.Number,
        title: "Fade",
        defaultValue: 0.45,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
    },

    /* ---- Responsive ---- */
    layoutMode: {
        type: ControlType.Enum,
        title: "Layout",
        defaultValue: "auto",
        options: ["auto", "desktop", "tablet", "phone"],
        optionTitles: ["Auto", "List", "Grid", "Stacked"],
        displaySegmentedControl: true,
        description:
            "Auto switches on the component's own width. Force one to preview it on the canvas.",
    },
    compactMode: {
        type: ControlType.Enum,
        title: "Compact Layout",
        defaultValue: "scroll",
        options: ["scroll", "feed"],
        optionTitles: ["Scroll", "Feed"],
        displaySegmentedControl: true,
        description:
            "Scroll keeps the hover grammar below the breakpoint, with scroll position standing in for the cursor. Feed gives every project its own picture inline.",
    },
    rowScroll: {
        type: ControlType.Number,
        title: "Scroll Per Row",
        defaultValue: 55,
        min: 20,
        max: 150,
        step: 5,
        unit: "svh",
        description:
            "How far you scroll per project while the list is pinned. Lower is brisker.",
        hidden: (props: any) =>
            normalizeEnum(props.compactMode, "scroll") !== "scroll",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet ≤",
        defaultValue: 1100,
        min: 480,
        max: 1600,
        step: 10,
        unit: "px",
        description: "At or below this width the hover list becomes a card grid.",
    },
    phoneBreakpoint: {
        type: ControlType.Number,
        title: "Phone ≤",
        defaultValue: 768,
        min: 320,
        max: 1100,
        step: 10,
        unit: "px",
        description: "At or below this width the grid becomes one column.",
    },
    mediaRatio: {
        type: ControlType.Number,
        title: "Media Ratio",
        defaultValue: 0.73,
        min: 0.3,
        max: 2,
        step: 0.01,
        description: "Width ÷ height of the inline media below the breakpoint.",
        hidden: (props: any) =>
            normalizeEnum(props.compactMode, "scroll") === "scroll",
    },
})
