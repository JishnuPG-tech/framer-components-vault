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


/**
 * DOME POSTER WALL — v3.4
 *
 * Faithful recreation of the reference video:
 *  • Infinite fisheye poster wall with mouse-following lens
 *  • Drag / wheel to pan infinitely, inertia + smooth settling
 *  • Hover preview panel, click → focus mode with info panel
 *  • Functional Like (♥) and Save (+) buttons — persisted per visitor
 *  • Per-card optional Link button, motion blur, vignette
 *  • Card Shape: Portrait / Landscape / Square / Custom (W × H)
 *  • Each card accepts an Image AND/OR a Video — if a video is set it
 *    plays muted/looping in the card; falls back to the image, then a
 *    gradient placeholder
 *  • Optional live Data Source: point it at any public JSON array
 *    (Framer CMS REST API via a small proxy, a Google Sheet, Airtable,
 *    a Notion sync, etc.) and map your field names — the wall updates
 *    automatically
 *
 * IMPORTANT — about Framer's CMS specifically:
 * Framer does not allow code components to read a CMS collection
 * directly on the canvas (platform limitation, not specific to this
 * component — there is no live "collection" object exposed to code).
 * The supported way to go live: turn on the CMS REST API for your
 * project (Settings → CMS → API), which gives you a collection items
 * endpoint, and paste that endpoint's URL into "Data Source" below.
 * Since that endpoint needs a Bearer token, don't call it directly from
 * the published page (the token would be publicly visible) — put a tiny
 * proxy in front of it (a Cloudflare Worker / Vercel function that holds
 * the token server-side and returns plain JSON) and paste the proxy's
 * public URL here instead. Any other public JSON array works the same
 * way with no proxy needed.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 720
 */

// ------------------------------------------------------------------ data

const PLACEHOLDERS: Array<[string, string]> = [
    ["linear-gradient(160deg,#ff5f3c,#7a1020 60%,#12060a)", "Crimson Echo"],
    ["linear-gradient(200deg,#f7c8d0,#d94f6b 55%,#2a0a12)", "Rose Static"],
    ["linear-gradient(150deg,#e8e6ef,#8f8ba8 50%,#1c1a26)", "Pale Signal"],
    ["linear-gradient(140deg,#3a3a3e,#0c0c0e)", "Night Frame"],
    ["linear-gradient(170deg,#ffb35c,#c2452f 55%,#180705)", "Amber Drift"],
    ["linear-gradient(210deg,#9fd8cb,#2f6f66 55%,#07110f)", "Sea Glass"],
    ["linear-gradient(160deg,#f4efe6,#b7a98c 50%,#221d13)", "Dust Letter"],
    ["linear-gradient(190deg,#c9b6ff,#5b3fa8 55%,#0e081c)", "Violet Hour"],
    ["linear-gradient(150deg,#ff8fa3,#a8324f 55%,#1c060c)", "Blush Run"],
    ["linear-gradient(200deg,#8fc3ff,#2f5aa8 55%,#060b1c)", "Cold Orbit"],
    ["linear-gradient(165deg,#ffe08a,#b8862f 55%,#1c1406)", "Gold Noise"],
    ["linear-gradient(185deg,#b9f28f,#4f8a2f 55%,#0b1406)", "Green Room"],
    ["linear-gradient(155deg,#ffd1dc,#c96f98 55%,#1e0a14)", "Soft Riot"],
    ["linear-gradient(175deg,#a0e9ff,#3a7ca5 55%,#06141c)", "Blue Static"],
    ["linear-gradient(145deg,#d7ccc8,#8d6e63 55%,#180f0b)", "Clay Study"],
    ["linear-gradient(195deg,#ffab91,#bf360c 55%,#1a0803)", "Ember Line"],
]

const DEFAULT_DESC =
    "Add an image and/or a video, a title, a year, a description and an optional link for every card in the Cards list — or connect a live Data Source below. Hover a card to preview this panel, click to focus. Press Escape or Close to go back."

interface Item {
    image?: string
    video?: string
    title: string
    meta: string
    description: string
    link?: string
    fallback: string
}

interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
    url?: string
}

interface InputItem {
    image?: string | ResponsiveImageValue
    video?: string
    title?: string
    meta?: string
    description?: string
    link?: string
}

type Orientation = "portrait" | "landscape" | "square" | "custom"

interface GridSettings {
    orientation: Orientation
    cellWidth: number
    cellHeight: number
    gap: number
    radius: number
    staggered: boolean
}

interface MediaSettings {
    autoplayVideo: boolean
    muteVideo: boolean
    loopVideo: boolean
}

interface LensSettings {
    warp: number
    reach: number
    maxScale: number
    minScale: number
    edgeDim: number
    followMouse: boolean
    ease: number
}

interface FocusSettings {
    enabled: boolean
    warp: number
    reach: number
    zoom: number
    dim: number
}

interface PanelSettings {
    show: boolean
    onHover: boolean
    showActions: boolean
    likeColor: string
    saveColor: string
    showLink: boolean
    linkLabel: string
    newTab: boolean
    width: number
}

interface MotionSettings {
    wheelSpeed: number
    drag: boolean
    smoothing: number
    inertia: number
    motionBlur: boolean
    blurAmount: number
    idleDrift: number
}

interface LookSettings {
    background: string
    vignette: number
    cardShadow: boolean
}

interface CmsSettings {
    enabled: boolean
    url: string
    rootPath: string
    imageKey: string
    videoKey: string
    titleKey: string
    metaKey: string
    descriptionKey: string
    linkKey: string
    refreshMinutes: number
}

interface MyComponentProps {
    items?: InputItem[]
    grid?: Partial<GridSettings>
    media?: Partial<MediaSettings>
    lens?: Partial<LensSettings>
    focus?: Partial<FocusSettings>
    panel?: Partial<PanelSettings>
    motion?: Partial<MotionSettings>
    look?: Partial<LookSettings>
    cms?: Partial<CmsSettings>
    style?: React.CSSProperties
}

function mod(n: number, m: number) {
    return ((n % m) + m) % m
}

function itemIndexFor(wc: number, wr: number, count: number) {
    if (count <= 0) return 0
    let h = wc * 374761393 + wr * 668265263
    h = (h ^ (h >> 13)) * 1274126177
    h = h ^ (h >> 16)
    return mod(h, count)
}

// like/save persistence (per visitor, survives reloads on the live site)
const itemKey = (it: Item) => `${it.title}|${it.image || it.video || ""}`

function loadSet(key: string): Set<string> {
    if (typeof window === "undefined") return new Set()
    try {
        const raw = window.localStorage.getItem(key)
        if (raw) return new Set(JSON.parse(raw))
    } catch (e) {}
    return new Set()
}

function persistSet(key: string, s: Set<string>) {
    try {
        window.localStorage.setItem(key, JSON.stringify(Array.from(s)))
    } catch (e) {}
}

// resolve a dot path like "data.items" against a parsed JSON value
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

function resolvePath(obj: unknown, path: string): unknown {
    if (!path) return obj
    return path.split(".").filter(Boolean).reduce<unknown>((acc, key) => {
        if (!isRecord(acc)) return undefined
        return acc[key]
    }, obj)
}

function readKey(obj: unknown, key: string): unknown {
    if (!obj || !key) return undefined
    if (isRecord(obj) && obj[key] !== undefined) return obj[key]
    return resolvePath(obj, key)
}

const ALLOWED_SCHEMES = ["https:", "http:", "mailto:", "tel:"]

function sanitizeUrl(url: string | undefined): string | undefined {
    if (!url || typeof url !== "string") return undefined
    const trimmed = url.trim()
    try {
        const parsed = new URL(trimmed)
        if (!ALLOWED_SCHEMES.includes(parsed.protocol)) return undefined
        return trimmed
    } catch {
        // relative paths starting with / or # are safe
        if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed
        return undefined
    }
}

// ------------------------------------------------------------------ defaults

const ORIENTATION_RATIOS: Record<string, number> = {
    portrait: 0.72,
    landscape: 1.5,
    square: 1,
}

const D = {
    grid: {
        orientation: "portrait",
        cellWidth: 235,
        cellHeight: 326,
        gap: 22,
        radius: 18,
        staggered: true,
    },
    media: {
        autoplayVideo: true,
        muteVideo: true,
        loopVideo: true,
    },
    lens: {
        warp: 1.15,
        reach: 0.56,
        maxScale: 1.18,
        minScale: 0.32,
        edgeDim: 0.16,
        followMouse: true,
        ease: 0.075,
    },
    focus: {
        enabled: true,
        warp: 2.05,
        reach: 0.36,
        zoom: 1.32,
        dim: 0.8,
    },
    panel: {
        show: true,
        onHover: true,
        showActions: true,
        likeColor: "#FF4D5E",
        saveColor: "#7EE2A0",
        showLink: true,
        linkLabel: "Open",
        newTab: true,
        width: 272,
    },
    motion: {
        wheelSpeed: 1,
        drag: true,
        smoothing: 0.085,
        inertia: 0.92,
        motionBlur: true,
        blurAmount: 1,
        idleDrift: 0,
    },
    look: {
        background: "#050505",
        vignette: 150,
        cardShadow: true,
    },
    cms: {
        enabled: false,
        url: "",
        rootPath: "",
        imageKey: "image",
        videoKey: "video",
        titleKey: "title",
        metaKey: "meta",
        descriptionKey: "description",
        linkKey: "link",
        refreshMinutes: 5,
    },
}

function normalizeImageInput(
    image: string | ResponsiveImageValue | undefined
): string | undefined {
    if (!image) return undefined
    if (typeof image === "string") return image
    if (typeof image.src === "string" && image.src) return image.src
    if (typeof image.url === "string" && image.url) return image.url
    return undefined
}

// ------------------------------------------------------------------ component

/**
 * User request: update component for Marketplace readiness while preserving current visual design and existing control behavior.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function DomePosterWall(props: MyComponentProps) {
    const grid = { ...D.grid, ...(props.grid || {}) }
    const media = { ...D.media, ...(props.media || {}) }
    const lens = { ...D.lens, ...(props.lens || {}) }
    const focus = { ...D.focus, ...(props.focus || {}) }
    const panel = { ...D.panel, ...(props.panel || {}) }
    const motion = { ...D.motion, ...(props.motion || {}) }
    const look = { ...D.look, ...(props.look || {}) }
    const cms = { ...D.cms, ...(props.cms || {}) }

    const isStaticMode = useIsStaticRenderer()

    // ---------------- live data source (optional)
    const [remote, setRemote] = React.useState<{
        status: "idle" | "loading" | "ready" | "error"
        items: Item[]
        message?: string
    }>({ status: "idle", items: [] })

    React.useEffect(() => {
        if (isStaticMode) return
        if (!cms.enabled || !cms.url) {
            React.startTransition(() => {
                setRemote({ status: "idle", items: [] })
            })
            return
        }
        let cancelled = false
        let requestSeq = 0
        let activeController: AbortController | null = null
        const load = async () => {
            const seq = ++requestSeq
            if (activeController) activeController.abort()
            activeController = new AbortController()
            React.startTransition(() => {
                setRemote((r) => ({ ...r, status: "loading" }))
            })
            try {
                const res = await fetch(cms.url, {
                    headers: { Accept: "application/json" },
                    signal: activeController.signal,
                })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const json = await res.json()
                const list = resolvePath(json, cms.rootPath)
                if (!Array.isArray(list)) {
                    throw new Error(
                        "Response is not an array — check the Root Path"
                    )
                }
                const mapped: Item[] = list.map((raw: unknown, i: number) => {
                    const image = readKey(raw, cms.imageKey)
                    const video = readKey(raw, cms.videoKey)
                    const title = readKey(raw, cms.titleKey)
                    const meta = readKey(raw, cms.metaKey)
                    const description = readKey(raw, cms.descriptionKey)
                    const link = readKey(raw, cms.linkKey)
                    return {
                        image:
                            typeof image === "string"
                                ? image
                                : normalizeImageInput(image),
                        video:
                            typeof video === "string"
                                ? video
                                : normalizeImageInput(
                                      video as
                                          | string
                                          | ResponsiveImageValue
                                          | undefined
                                  ),
                        title:
                            typeof title === "string"
                                ? title
                                : `Untitled ${i + 1}`,
                        meta: typeof meta === "string" ? meta : "",
                        description:
                            typeof description === "string"
                                ? description
                                : DEFAULT_DESC,
                        link: sanitizeUrl(
                            typeof link === "string" ? link : undefined
                        ),
                        fallback:
                            PLACEHOLDERS[i % PLACEHOLDERS.length][0],
                    }
                })
                if (!cancelled && seq === requestSeq) {
                    React.startTransition(() => {
                        setRemote({ status: "ready", items: mapped })
                    })
                }
            } catch (err: unknown) {
                const isAbortError =
                    typeof DOMException !== "undefined" &&
                    err instanceof DOMException &&
                    err.name === "AbortError"
                const message =
                    err instanceof Error ? err.message : "Failed to load data"
                if (!cancelled && seq === requestSeq && !isAbortError) {
                    React.startTransition(() => {
                        setRemote({
                            status: "error",
                            items: [],
                            message,
                        })
                    })
                }
            }
        }
        load()
        const ms = Math.max(0.5, cms.refreshMinutes) * 60 * 1000
        const id = cms.refreshMinutes > 0 ? setInterval(load, ms) : undefined
        return () => {
            cancelled = true
            if (activeController) activeController.abort()
            if (id) clearInterval(id)
        }
    }, [
        cms.enabled,
        cms.url,
        cms.rootPath,
        cms.imageKey,
        cms.videoKey,
        cms.titleKey,
        cms.metaKey,
        cms.descriptionKey,
        cms.linkKey,
        cms.refreshMinutes,
        isStaticMode,
    ])

    // ---------------- items (remote data source takes priority when ready)
    const items: Item[] = React.useMemo(() => {
        if (cms.enabled && remote.status === "ready" && remote.items.length) {
            return remote.items
        }
        const user = (props.items || [])
            .filter((it) => it && (it.image || it.video || it.title))
            .map((it, i: number) => ({
                image: normalizeImageInput(it.image),
                video: it.video,
                title: it.title || `Untitled ${i + 1}`,
                meta: it.meta || "",
                description: it.description || DEFAULT_DESC,
                link: sanitizeUrl(it.link || undefined),
                fallback: PLACEHOLDERS[i % PLACEHOLDERS.length][0],
            }))
        if (user.length >= 4) return user
        const ph: Item[] = PLACEHOLDERS.map(([g, t], i) => ({
            image: undefined,
            video: undefined,
            title: t,
            meta: `20${10 + (i % 16)}`,
            description: DEFAULT_DESC,
            link: undefined,
            fallback: g,
        }))
        return user.length ? [...user, ...ph] : ph
    }, [props.items, cms.enabled, remote.status, remote.items])

    // ---------------- like / save state (persisted per visitor)
    const [liked, setLiked] = React.useState<Set<string>>(() =>
        loadSet("dpw_liked")
    )
    const [saved, setSaved] = React.useState<Set<string>>(() =>
        loadSet("dpw_saved")
    )
    const toggleLike = React.useCallback((it: Item) => {
        React.startTransition(() => {
            setLiked((prev) => {
                const next = new Set(prev)
                const k = itemKey(it)
                next.has(k) ? next.delete(k) : next.add(k)
                persistSet("dpw_liked", next)
                return next
            })
        })
    }, [])
    const toggleSave = React.useCallback((it: Item) => {
        React.startTransition(() => {
            setSaved((prev) => {
                const next = new Set(prev)
                const k = itemKey(it)
                next.has(k) ? next.delete(k) : next.add(k)
                persistSet("dpw_saved", next)
                return next
            })
        })
    }, [])

    // ---------------- card size (orientation presets or fully custom)
    const cellW = Math.max(80, grid.cellWidth)
    const cellH =
        grid.orientation === "custom"
            ? Math.max(80, grid.cellHeight)
            : cellW /
              (ORIENTATION_RATIOS[grid.orientation] ||
                  ORIENTATION_RATIOS.portrait)
    const stepX = cellW + grid.gap
    const stepY = cellH + grid.gap

    const containerRef = React.useRef<HTMLDivElement>(null)
    const worldRef = React.useRef<HTMLDivElement>(null)
    const panelRef = React.useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = React.useState(true)
    const [viewport, setViewport] = React.useState({ w: 1280, h: 720 })

    React.useEffect(() => {
        if (isStaticMode) return
        const el = containerRef.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            React.startTransition(() => setIsVisible(true))
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                React.startTransition(() => {
                    setIsVisible(Boolean(entry?.isIntersecting))
                })
            },
            { threshold: 0.01 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStaticMode])

    React.useLayoutEffect(() => {
        if (isStaticMode) return
        const el = containerRef.current
        if (!el) return
        const measure = () =>
            React.startTransition(() => {
                setViewport({
                    w: el.clientWidth || 1280,
                    h: el.clientHeight || 720,
                })
            })
        measure()
        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(measure)
            ro.observe(el)
            return () => ro.disconnect()
        }
        if (typeof window !== "undefined") {
            window.addEventListener("resize", measure)
            return () => window.removeEventListener("resize", measure)
        }
        return
    }, [isStaticMode])

    const COVER_X = 3.0
    const COVER_Y = 3.6
    const cols = Math.max(5, Math.ceil((viewport.w * COVER_X) / stepX) | 1)
    const rows = Math.max(5, Math.ceil((viewport.h * COVER_Y) / stepY) | 1)

    // ---------------- mutable state (no re-render)
    const S = React.useRef({
        cam: { x: 0, y: 0 },
        camT: { x: 0, y: 0 },
        vel: { x: 0, y: 0 },
        lens: { x: 640, y: 360 },
        lensT: { x: 640, y: 360 },
        pointer: { x: 0, y: 0, inside: false },
        focusT: 0,
        dragging: false,
        dragMoved: 0,
        lastP: { x: 0, y: 0, t: 0 },
        blur: 0,
        hoverCell: null as null | { wc: number; wr: number },
    }).current

    const [display, setDisplay] = React.useState<{
        mode: "hover" | "focus"
        wc: number
        wr: number
        item: Item
    } | null>(null)
    const displayRef = React.useRef(display)
    displayRef.current = display

    const cardEls = React.useRef<Map<string, HTMLDivElement>>(new Map())
    const cardState = React.useRef<Map<string, { wc: number; wr: number }>>(
        new Map()
    )
    const videoBlockedAt = React.useRef<Map<string, number>>(new Map())
    const interactionVersion = React.useRef(0)
    const clearAutoplayBlock = React.useCallback(() => {
        interactionVersion.current += 1
    }, [])

    const tryPlayVideo = React.useCallback(
        (vid: HTMLVideoElement, src: string, forceRetry = false) => {
            const blockedVersion = videoBlockedAt.current.get(src)
            if (
                !forceRetry &&
                blockedVersion !== undefined &&
                blockedVersion === interactionVersion.current
            ) {
                return
            }
            const p = vid.play()
            if (p && p.catch) {
                p.catch(() => {
                    videoBlockedAt.current.set(src, interactionVersion.current)
                })
            }
        },
        []
    )

    const cellScreenPos = React.useCallback(
        (
            wc: number,
            wr: number,
            Rmax: number,
            strength: number,
            cx: number,
            cy: number
        ) => {
            const worldX = wc * stepX
            const worldY =
                wr * stepY +
                (grid.staggered && mod(wc, 2) === 1 ? stepY / 2 : 0)
            const ux = cx + (worldX - S.cam.x)
            const uy = cy + (worldY - S.cam.y)
            const dx = ux - S.lens.x
            const dy = uy - S.lens.y
            const r = Math.hypot(dx, dy) || 0.0001
            const t = Math.tanh((strength * r) / Rmax)
            const rr = (Rmax * t) / strength
            return {
                x: S.lens.x + (dx / r) * rr,
                y: S.lens.y + (dy / r) * rr,
                d: 1 - t * t,
            }
        },
        [stepX, stepY, grid.staggered]
    )

    // ---------------- frame
    const applyFrame = React.useCallback(() => {
        if (items.length === 0) return
        const vw = viewport.w
        const vh = viewport.h
        const cx = vw / 2
        const cy = vh / 2
        const diag = Math.hypot(vw, vh)
        const disp = displayRef.current
        const focusing = disp?.mode === "focus" && focus.enabled

        const f = S.focusT
        const Rmax = diag * (lens.reach + (focus.reach - lens.reach) * f)
        const strength = lens.warp + (focus.warp - lens.warp) * f

        if (focusing) {
            S.lensT.x = cx + (disp!.wc * stepX - S.cam.x)
            S.lensT.y =
                cy +
                (disp!.wr * stepY +
                    (grid.staggered && mod(disp!.wc, 2) === 1
                        ? stepY / 2
                        : 0) -
                    S.cam.y)
        } else if (lens.followMouse && S.pointer.inside) {
            S.lensT.x = S.pointer.x
            S.lensT.y = S.pointer.y
        } else {
            S.lensT.x = cx
            S.lensT.y = cy
        }
        S.lens.x += (S.lensT.x - S.lens.x) * lens.ease
        S.lens.y += (S.lensT.y - S.lens.y) * lens.ease

        if (!S.dragging) {
            S.camT.x += S.vel.x
            S.camT.y += S.vel.y
            S.vel.x *= motion.inertia
            S.vel.y *= motion.inertia
            if (motion.idleDrift && !focusing)
                S.camT.y += motion.idleDrift * 0.5
        }
        const px = S.cam.x
        const py = S.cam.y
        S.cam.x += (S.camT.x - S.cam.x) * motion.smoothing
        S.cam.y += (S.camT.y - S.cam.y) * motion.smoothing
        const speed = Math.hypot(S.cam.x - px, S.cam.y - py)

        if (motion.motionBlur && worldRef.current) {
            const target = Math.min(
                speed * 0.06 * motion.blurAmount,
                7 * motion.blurAmount
            )
            S.blur += (target - S.blur) * 0.18
            worldRef.current.style.filter =
                S.blur > 0.15 ? `blur(${S.blur.toFixed(2)}px)` : "none"
        }

        const centerCol = Math.round(S.cam.x / stepX)
        const centerRow = Math.round(S.cam.y / stepY)
        const n = items.length

        cardEls.current.forEach((el, key) => {
            const us = key.indexOf("_")
            const i = +key.slice(0, us)
            const j = +key.slice(us + 1)
            const wc = i + cols * Math.round((centerCol - i) / cols)
            const wr = j + rows * Math.round((centerRow - j) / rows)

            const prev = cardState.current.get(key)
            if (!prev || prev.wc !== wc || prev.wr !== wr) {
                cardState.current.set(key, { wc, wr })
                const item = items[itemIndexFor(wc, wr, n)]
                el.dataset.wc = String(wc)
                el.dataset.wr = String(wr)
                el.setAttribute("aria-label", item.title || "Poster card")
                el.style.background = item.fallback

                const img = el.children[0] as HTMLImageElement
                const vid = el.children[1] as HTMLVideoElement

                if (item.video) {
                    if (vid.getAttribute("src") !== item.video) {
                        vid.pause()
                        vid.setAttribute("src", item.video)
                        vid.load()
                        if (media.autoplayVideo)
                            tryPlayVideo(vid, item.video, true)
                    } else if (media.autoplayVideo && vid.paused) {
                        tryPlayVideo(vid, item.video)
                    }
                    vid.style.display = "block"
                    img.style.display = "none"
                } else {
                    if (!vid.paused) vid.pause()
                    vid.style.display = "none"
                    if (item.image) {
                        if (img.getAttribute("src") !== item.image) {
                            img.style.opacity = "0"
                            img.setAttribute("src", item.image)
                        }
                        img.style.display = "block"
                    } else {
                        img.style.display = "none"
                    }
                }
            }

            const pos = cellScreenPos(wc, wr, Rmax, strength, cx, cy)
            const d = pos.d
            const isFoc = focusing && disp!.wc === wc && disp!.wr === wr

            const scale =
                (lens.minScale + (lens.maxScale - lens.minScale) * d) *
                (isFoc ? 1 + (focus.zoom - 1) * f : 1)

            let bright = lens.edgeDim + (1 - lens.edgeDim) * Math.pow(d, 1.25)
            if (f > 0.001) {
                if (isFoc) bright = bright + (1 - bright) * f
                else bright *= 1 - focus.dim * f * (1 - d * 0.35)
            }

            const nextTransform = `translate3d(${(pos.x - cellW / 2).toFixed(2)}px, ${(pos.y - cellH / 2).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
            const nextFilter = `brightness(${bright.toFixed(3)})`
            const nextZ = isFoc ? "4500" : String(100 + Math.round(d * 999))
            if (el.style.transform !== nextTransform)
                el.style.transform = nextTransform
            if (el.style.filter !== nextFilter) el.style.filter = nextFilter
            if (el.style.zIndex !== nextZ) el.style.zIndex = nextZ
        })

        S.focusT += ((focusing ? 1 : 0) - S.focusT) * 0.09

        if (
            !focusing &&
            panel.show &&
            panel.onHover &&
            S.pointer.inside &&
            !S.dragging &&
            !isStaticMode
        ) {
            const dxp = S.pointer.x - S.lens.x
            const dyp = S.pointer.y - S.lens.y
            const rp = Math.hypot(dxp, dyp) || 0.0001
            const tt = Math.min(0.999, (rp * strength) / Rmax)
            const rInv = (Rmax * Math.atanh(tt)) / strength
            const uxp = S.lens.x + (dxp / rp) * rInv - cx + S.cam.x
            const uyp = S.lens.y + (dyp / rp) * rInv - cy + S.cam.y
            const wc = Math.round(uxp / stepX)
            const stag = grid.staggered && mod(wc, 2) === 1 ? stepY / 2 : 0
            const wr = Math.round((uyp - stag) / stepY)
            const prevH = S.hoverCell
            if (!prevH || prevH.wc !== wc || prevH.wr !== wr) {
                S.hoverCell = { wc, wr }
                const item = items[itemIndexFor(wc, wr, items.length)]
                React.startTransition(() => {
                    setDisplay({ mode: "hover", wc, wr, item })
                })
            }
        }

        if (panelRef.current) {
            const p = panelRef.current
            const target = disp
            if (target && panel.show) {
                const pos = cellScreenPos(
                    target.wc,
                    target.wr,
                    Rmax,
                    strength,
                    cx,
                    cy
                )
                const zoomNow =
                    target.mode === "focus" ? 1 + (focus.zoom - 1) * f : 1
                const desiredWidth = Math.min(panel.width, Math.max(160, vw - 28))
                const desiredWidthPx = `${desiredWidth}px`
                if (p.style.width !== desiredWidthPx) p.style.width = desiredWidthPx
                const pw = p.offsetWidth || desiredWidth
                const phh = p.offsetHeight || 170
                const halfW = (cellW * zoomNow) / 2
                let pxp = pos.x - halfW - pw - 18
                let pyp = pos.y - (cellH * zoomNow) / 2 - 6
                if (pxp < 14) pxp = pos.x + halfW + 18
                const maxX = Math.max(14, vw - pw - 14)
                pxp = Math.min(Math.max(14, pxp), maxX)
                pyp = Math.min(Math.max(14, pyp), vh - phh - 14)
                const nextPanelTransform = `translate3d(${pxp.toFixed(1)}px, ${pyp.toFixed(1)}px, 0)`
                if (p.style.transform !== nextPanelTransform)
                    p.style.transform = nextPanelTransform
                const vis =
                    target.mode === "focus" ? Math.min(1, S.focusT * 1.6) : 1
                const nextOpacity = String(vis)
                const nextPointerEvents = vis > 0.4 ? "auto" : "none"
                if (p.style.opacity !== nextOpacity) p.style.opacity = nextOpacity
                if (p.style.pointerEvents !== nextPointerEvents)
                    p.style.pointerEvents = nextPointerEvents
            } else {
                if (p.style.opacity !== "0") p.style.opacity = "0"
                if (p.style.pointerEvents !== "none") p.style.pointerEvents = "none"
            }
        }
    }, [
        viewport,
        items,
        cols,
        rows,
        stepX,
        stepY,
        cellW,
        cellH,
        cellScreenPos,
        grid.staggered,
        media.autoplayVideo,
        lens.warp,
        lens.reach,
        lens.maxScale,
        lens.minScale,
        lens.edgeDim,
        lens.followMouse,
        lens.ease,
        focus.enabled,
        focus.warp,
        focus.reach,
        focus.zoom,
        focus.dim,
        panel.show,
        panel.onHover,
        panel.width,
        motion.smoothing,
        motion.inertia,
        motion.motionBlur,
        motion.blurAmount,
        motion.idleDrift,
        isStaticMode,
        tryPlayVideo,
    ])

    React.useEffect(() => {
        if (isStaticMode || !isVisible) return
        let raf = 0
        const loop = () => {
            applyFrame()
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [applyFrame, isStaticMode, isVisible])

    // ---------------- input
    React.useEffect(() => {
        const el = containerRef.current
        if (!el || isStaticMode) return

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            clearAutoplayBlock()
            S.camT.y += e.deltaY * motion.wheelSpeed
            S.camT.x += e.deltaX * motion.wheelSpeed
            S.vel.x = 0
            S.vel.y = 0
        }
        const onMove = (e: PointerEvent) => {
            const b = el.getBoundingClientRect()
            S.pointer.x = e.clientX - b.left
            S.pointer.y = e.clientY - b.top
            S.pointer.inside = true
            if (S.dragging && motion.drag) {
                const now = performance.now()
                const ddx = e.clientX - S.lastP.x
                const ddy = e.clientY - S.lastP.y
                S.dragMoved += Math.abs(ddx) + Math.abs(ddy)
                S.camT.x -= ddx
                S.camT.y -= ddy
                const dt = Math.max(1, now - S.lastP.t)
                S.vel.x = (-ddx / dt) * 14
                S.vel.y = (-ddy / dt) * 14
                S.lastP = { x: e.clientX, y: e.clientY, t: now }
                el.style.cursor = "grabbing"
            }
        }
        const onDown = (e: PointerEvent) => {
            if ((e.target as HTMLElement)?.closest?.("[data-panel]")) return
            clearAutoplayBlock()
            S.dragging = true
            S.dragMoved = 0
            S.vel.x = 0
            S.vel.y = 0
            if (motion.drag) el.style.touchAction = "none"
            S.lastP = { x: e.clientX, y: e.clientY, t: performance.now() }
        }
        const onUp = (e: PointerEvent) => {
            const wasDrag = S.dragMoved > 6
            const wasDragging = S.dragging
            S.dragging = false
            el.style.touchAction = "pan-x pan-y"
            el.style.cursor = motion.drag ? "grab" : "default"
            if (!wasDragging || wasDrag) return
            if ((e.target as HTMLElement)?.closest?.("[data-panel]")) return
            const t = (e.target as HTMLElement)?.closest?.(
                "[data-card]"
            ) as HTMLElement | null
            if (t && t.dataset.wc !== undefined && focus.enabled) {
                const wc = +t.dataset.wc!
                const wr = +t.dataset.wr!
                const item = items[itemIndexFor(wc, wr, items.length)]
                S.vel.x = 0
                S.vel.y = 0
                React.startTransition(() => {
                    setDisplay({ mode: "focus", wc, wr, item })
                })
            } else {
                React.startTransition(() => {
                    setDisplay((d) => (d?.mode === "focus" ? null : d))
                })
            }
        }
        const onLeave = () => {
            S.pointer.inside = false
            S.dragging = false
            S.hoverCell = null
            React.startTransition(() => {
                setDisplay((d) => (d?.mode === "hover" ? null : d))
            })
            el.style.touchAction = "pan-x pan-y"
            el.style.cursor = motion.drag ? "grab" : "default"
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                React.startTransition(() => {
                    setDisplay((d) => (d?.mode === "focus" ? null : d))
                })
                return
            }
            if ((e.key === "Enter" || e.key === " ") && focus.enabled) {
                const target = e.target as HTMLElement
                const t = target?.closest?.("[data-card]") as HTMLElement | null
                if (t && t.dataset.wc !== undefined && t.dataset.wr !== undefined) {
                    e.preventDefault()
                    clearAutoplayBlock()
                    const wc = +t.dataset.wc
                    const wr = +t.dataset.wr
                    const item = items[itemIndexFor(wc, wr, items.length)]
                    React.startTransition(() => {
                        setDisplay({ mode: "focus", wc, wr, item })
                    })
                }
            }
        }

        el.addEventListener("wheel", onWheel, { passive: false })
        el.addEventListener("pointermove", onMove)
        el.addEventListener("pointerdown", onDown)
        window.addEventListener("pointerup", onUp)
        el.addEventListener("pointerleave", onLeave)
        window.addEventListener("keydown", onKey)
        return () => {
            el.removeEventListener("wheel", onWheel)
            el.removeEventListener("pointermove", onMove)
            el.removeEventListener("pointerdown", onDown)
            window.removeEventListener("pointerup", onUp)
            el.removeEventListener("pointerleave", onLeave)
            window.removeEventListener("keydown", onKey)
        }
    }, [
        items,
        motion.wheelSpeed,
        motion.drag,
        focus.enabled,
        isStaticMode,
        clearAutoplayBlock,
    ])

    // ---------------- pool
    const poolKeys = React.useMemo(() => {
        const arr: string[] = []
        for (let i = 0; i < cols; i++)
            for (let j = 0; j < rows; j++) arr.push(`${i}_${j}`)
        cardState.current.clear()
        return arr
    }, [cols, rows])

    const poolJSX = React.useMemo(
        () => (
            <div
                ref={worldRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    willChange: "filter",
                }}
            >
                {poolKeys.map((key) => (
                    <div
                        key={key}
                        data-card
                        role="button"
                        aria-label="Poster card"
                        tabIndex={0}
                        ref={(node) => {
                            if (node) cardEls.current.set(key, node)
                            else {
                                cardEls.current.delete(key)
                                cardState.current.delete(key)
                            }
                        }}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: cellW,
                            height: cellH,
                            borderRadius: grid.radius,
                            overflow: "hidden",
                            willChange: "transform, filter",
                            boxShadow: look.cardShadow
                                ? "0 8px 26px rgba(0,0,0,0.55)"
                                : "none",
                            cursor: "pointer",
                        }}
                    >
                        <img
                            alt=""
                            draggable={false}
                            onLoad={(e) =>
                                ((e.target as HTMLImageElement).style.opacity =
                                    "1")
                            }
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "none",
                                opacity: 0,
                                transition: "opacity 0.3s ease",
                                pointerEvents: "none",
                            }}
                        />
                        <video
                            muted={media.muteVideo}
                            loop={media.loopVideo}
                            playsInline
                            preload="metadata"
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "none",
                                pointerEvents: "none",
                            }}
                        />
                    </div>
                ))}
            </div>
        ),
        [
            poolKeys,
            cellW,
            cellH,
            grid.radius,
            look.cardShadow,
            media.muteVideo,
            media.loopVideo,
        ]
    )

    const dItem = display?.item
    const isFocusMode = display?.mode === "focus"
    const isLiked = dItem ? liked.has(itemKey(dItem)) : false
    const isSaved = dItem ? saved.has(itemKey(dItem)) : false

    const staticCards = React.useMemo(() => {
        const safeItems: Item[] =
            items.length > 0
                ? items
                : PLACEHOLDERS.map(([g, t], i) => ({
                      image: undefined,
                      video: undefined,
                      title: t,
                      meta: `20${10 + (i % 16)}`,
                      description: DEFAULT_DESC,
                      link: undefined,
                      fallback: g,
                  }))
        const count = 18
        return Array.from({ length: count }, (_, i) => {
            const item = safeItems[i % safeItems.length]
            const col = i % 6
            const row = Math.floor(i / 6)
            const x = 9 + col * 15.5 + (row % 2 ? 2.3 : 0)
            const y = 11 + row * 30.5
            const scale = 0.88 + ((i * 7) % 11) / 100
            const rot = ((i % 5) - 2) * 0.7
            return { i, item, x, y, scale, rot }
        })
    }, [items])

    if (isStaticMode) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    background: look.background,
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    touchAction: "pan-x pan-y",
                    ...props.style,
                }}
            >
                {staticCards.map(({ i, item, x, y, scale, rot }) => (
                    <div
                        key={`static_${i}`}
                        style={{
                            position: "absolute",
                            left: `${x}%`,
                            top: `${y}%`,
                            width: `${Math.max(8, Math.min(22, (cellW / 1280) * 100))}%`,
                            aspectRatio: `${cellW} / ${Math.max(1, cellH)}`,
                            borderRadius: grid.radius,
                            overflow: "hidden",
                            boxShadow: look.cardShadow
                                ? "0 8px 26px rgba(0,0,0,0.55)"
                                : "none",
                            background: item.fallback,
                            transform: `translate(-50%, -50%) scale(${scale.toFixed(
                                3
                            )}) rotate(${rot.toFixed(2)}deg)`,
                        }}
                        aria-label={item.title}
                    >
                        {item.image ? (
                            <img
                                src={item.image}
                                alt=""
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : null}
                    </div>
                ))}
                {look.vignette > 0 && (
                    <>
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: look.vignette,
                                background: `linear-gradient(180deg, ${look.background}, transparent)`,
                                pointerEvents: "none",
                                zIndex: 4000,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: look.vignette,
                                background: `linear-gradient(0deg, ${look.background}, transparent)`,
                                pointerEvents: "none",
                                zIndex: 4000,
                            }}
                        />
                    </>
                )}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: look.background,
                cursor: motion.drag ? "grab" : "default",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "pan-x pan-y",
                ...props.style,
            }}
        >
            <style>{`@keyframes dpwPop{0%{transform:scale(0.5)}55%{transform:scale(1.3)}100%{transform:scale(1)}}`}</style>

            {poolJSX}

            {/* vignette */}
            {look.vignette > 0 && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: look.vignette,
                            background: `linear-gradient(180deg, ${look.background}, transparent)`,
                            pointerEvents: "none",
                            zIndex: 4000,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: look.vignette,
                            background: `linear-gradient(0deg, ${look.background}, transparent)`,
                            pointerEvents: "none",
                            zIndex: 4000,
                        }}
                    />
                </>
            )}

            {/* info panel */}
            {panel.show && (
                <div
                    ref={panelRef}
                    data-panel
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: panel.width,
                        padding: "15px 16px 13px",
                        borderRadius: 14,
                        background: "rgba(12,12,14,0.84)",
                        backdropFilter: "blur(14px)",
                        WebkitBackdropFilter: "blur(14px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#fff",
                        opacity: 0,
                        pointerEvents: "none",
                        zIndex: 6000,
                        fontFamily:
                            "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                        transition: "opacity 0.22s ease",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 7,
                            marginBottom: 7,
                            paddingRight: 8,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 16,
                                fontWeight: 700,
                                lineHeight: 1.25,
                            }}
                        >
                            {dItem?.title || ""}
                        </span>
                        {dItem?.meta ? (
                            <span
                                style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.55)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                ({dItem.meta})
                            </span>
                        ) : null}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            lineHeight: 1.55,
                            color: "rgba(255,255,255,0.65)",
                            marginBottom: isFocusMode ? 13 : 0,
                            display: "-webkit-box",
                            WebkitLineClamp: isFocusMode ? 5 : 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {dItem?.description || ""}
                    </div>
                    {isFocusMode && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            {panel.showActions && (
                                <>
                                    <button
                                        type="button"
                                        style={{
                                            ...iconBtn,
                                            border: `1px solid ${
                                                isLiked
                                                    ? panel.likeColor
                                                    : "rgba(255,255,255,0.25)"
                                            }`,
                                            background: isLiked
                                                ? `${panel.likeColor}26`
                                                : "transparent",
                                            color: isLiked
                                                ? panel.likeColor
                                                : "rgba(255,255,255,0.85)",
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (dItem) toggleLike(dItem)
                                        }}
                                        aria-label="Like"
                                        aria-pressed={isLiked}
                                        title={isLiked ? "Unlike" : "Like"}
                                    >
                                        <span
                                            key={`h_${isLiked}`}
                                            style={{
                                                display: "inline-block",
                                                animation:
                                                    "dpwPop 0.32s ease",
                                            }}
                                        >
                                            {isLiked ? "♥" : "♡"}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        style={{
                                            ...iconBtn,
                                            border: `1px solid ${
                                                isSaved
                                                    ? panel.saveColor
                                                    : "rgba(255,255,255,0.25)"
                                            }`,
                                            background: isSaved
                                                ? `${panel.saveColor}26`
                                                : "transparent",
                                            color: isSaved
                                                ? panel.saveColor
                                                : "rgba(255,255,255,0.85)",
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (dItem) toggleSave(dItem)
                                        }}
                                        aria-label="Save"
                                        aria-pressed={isSaved}
                                        title={
                                            isSaved ? "Remove" : "Save"
                                        }
                                    >
                                        <span
                                            key={`s_${isSaved}`}
                                            style={{
                                                display: "inline-block",
                                                animation:
                                                    "dpwPop 0.32s ease",
                                            }}
                                        >
                                            {isSaved ? "✓" : "+"}
                                        </span>
                                    </button>
                                </>
                            )}
                            <div style={{ flex: 1 }} />
                            {panel.showLink &&
                            dItem?.link &&
                            sanitizeUrl(dItem.link) ? (
                                <a
                                    href={sanitizeUrl(dItem.link)}
                                    target={panel.newTab ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        border: "1px solid rgba(255,255,255,0.3)",
                                        borderRadius: 999,
                                        padding: "6px 14px",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#fff",
                                        textDecoration: "none",
                                        background: "transparent",
                                    }}
                                >
                                    {panel.linkLabel} ↗
                                </a>
                            ) : null}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    React.startTransition(() => {
                                        setDisplay(null)
                                    })
                                }}
                                style={{
                                    border: "none",
                                    borderRadius: 999,
                                    padding: "7px 18px",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: "rgba(240,240,240,0.95)",
                                    color: "#111",
                                    cursor: "pointer",
                                }}
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}

            {cms.enabled && remote.status === "error" && (
                <div
                    style={{
                        position: "absolute",
                        top: 14,
                        left: 14,
                        right: 14,
                        padding: "8px 14px",
                        borderRadius: 10,
                        background: "rgba(120,20,20,0.9)",
                        color: "#fff",
                        fontSize: 11,
                        fontFamily: "Inter, sans-serif",
                        zIndex: 7000,
                        pointerEvents: "none",
                    }}
                >
                    Data Source error: {remote.message} — showing placeholder
                    cards instead.
                </div>
            )}
        </div>
    )
}

const iconBtn: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: "50%",
    fontSize: 14,
    lineHeight: "28px",
    textAlign: "center",
    cursor: "pointer",
    padding: 0,
    transition: "border-color 0.2s ease, background 0.2s ease, color 0.2s ease",
}

// ------------------------------------------------------------------ controls

addPropertyControls(DomePosterWall, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 60,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov", "m4v"],
                    description: "Optional — overrides the image when set",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    placeholder: "Card title",
                },
                meta: {
                    type: ControlType.String,
                    title: "Year",
                    placeholder: "2026",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                    placeholder: "Short description…",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        hidden: (p: Partial<MyComponentProps>) => p.cms?.enabled,
    },
    media: {
        type: ControlType.Object,
        title: "Media",
        controls: {
            autoplayVideo: {
                type: ControlType.Boolean,
                title: "Autoplay Video",
                defaultValue: D.media.autoplayVideo,
            },
            muteVideo: {
                type: ControlType.Boolean,
                title: "Mute Video",
                defaultValue: D.media.muteVideo,
                description: "Browsers block autoplay with sound on",
            },
            loopVideo: {
                type: ControlType.Boolean,
                title: "Loop Video",
                defaultValue: D.media.loopVideo,
            },
        },
    },
    cms: {
        type: ControlType.Object,
        title: "Data Source",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Use Live Data",
                defaultValue: D.cms.enabled,
                description:
                    "Off = use the Cards list above. On = fetch cards from a URL below (see the note at the top of the code for how to connect Framer's CMS).",
            },
            url: {
                type: ControlType.String,
                title: "JSON URL",
                placeholder: "https://your-endpoint.example.com/cards.json",
                defaultValue: D.cms.url,
                hidden: (p: Partial<CmsSettings>) => !p.enabled,
            },
            rootPath: {
                type: ControlType.String,
                title: "Root Path",
                placeholder:
                    "e.g. items (leave blank if the JSON is a plain array)",
                defaultValue: D.cms.rootPath,
                hidden: (p: Partial<CmsSettings>) => !p.enabled,
            },
            imageKey: {
                type: ControlType.String,
                title: "Image Field",
                defaultValue: D.cms.imageKey,
                hidden: (p: Partial<CmsSettings>) => !p.enabled,
            },
            videoKey: {
                type: ControlType.String,
                title: "Video Field",
                defaultValue: D.cms.videoKey,
                hidden: (p: Partial<CmsSettings>) => !p.enabled,
            },
            titleKey: {
                type: ControlType.String,
                title: "Title Field",
                defaultValue: D.cms.titleKey,
                hidden: (p: Partial<CmsSettings>) => !p.enabled,
            },
            metaKey: {
                type: ControlType.String,
                title: "Year Field",
                defaultValue: D.cms.metaKey,
                hidden: (p: Partial<CmsSettings>) => !p.enabled,
            },
            descriptionKey: {
                type: ControlType.String,
                title: "Description Field",
                defaultValue: D.cms.descriptionKey,
                hidden: (p: Partial<CmsSettings>) => !p.enabled,
            },
            linkKey: {
                type: ControlType.String,
                title: "Link Field",
                defaultValue: D.cms.linkKey,
                hidden: (p: Partial<CmsSettings>) => !p.enabled,
            },
            refreshMinutes: {
                type: ControlType.Number,
                title: "Refresh (min)",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: D.cms.refreshMinutes,
                description: "0 = fetch once on load only",
                hidden: (p: Partial<CmsSettings>) => !p.enabled,
            },
        },
    },
    grid: {
        type: ControlType.Object,
        title: "Grid",
        controls: {
            orientation: {
                type: ControlType.Enum,
                title: "Card Shape",
                options: ["portrait", "landscape", "square", "custom"],
                optionTitles: ["Portrait", "Landscape", "Square", "Custom"],
                defaultValue: D.grid.orientation,
            },
            cellWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 100,
                max: 600,
                step: 1,
                defaultValue: D.grid.cellWidth,
            },
            cellHeight: {
                type: ControlType.Number,
                title: "Card Height",
                min: 100,
                max: 600,
                step: 1,
                defaultValue: D.grid.cellHeight,
                hidden: (p: Partial<GridSettings>) => p.orientation !== "custom",
                description: "Only used with Custom shape",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: D.grid.gap,
            },
            radius: {
                type: ControlType.Number,
                title: "Corner Radius",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: D.grid.radius,
            },
            staggered: {
                type: ControlType.Boolean,
                title: "Stagger Columns",
                defaultValue: D.grid.staggered,
            },
        },
    },
    lens: {
        type: ControlType.Object,
        title: "Lens",
        controls: {
            warp: {
                type: ControlType.Number,
                title: "Warp",
                min: 0.3,
                max: 2.5,
                step: 0.05,
                defaultValue: D.lens.warp,
                description: "How strongly the wall curves",
            },
            reach: {
                type: ControlType.Number,
                title: "Reach",
                min: 0.3,
                max: 1,
                step: 0.01,
                defaultValue: D.lens.reach,
                description: "Size of the bright zone",
            },
            maxScale: {
                type: ControlType.Number,
                title: "Center Scale",
                min: 0.8,
                max: 2,
                step: 0.01,
                defaultValue: D.lens.maxScale,
            },
            minScale: {
                type: ControlType.Number,
                title: "Edge Scale",
                min: 0.05,
                max: 0.9,
                step: 0.01,
                defaultValue: D.lens.minScale,
            },
            edgeDim: {
                type: ControlType.Number,
                title: "Edge Brightness",
                min: 0,
                max: 0.8,
                step: 0.01,
                defaultValue: D.lens.edgeDim,
            },
            followMouse: {
                type: ControlType.Boolean,
                title: "Follow Mouse",
                defaultValue: D.lens.followMouse,
            },
            ease: {
                type: ControlType.Number,
                title: "Follow Ease",
                min: 0.02,
                max: 0.3,
                step: 0.005,
                defaultValue: D.lens.ease,
            },
        },
    },
    focus: {
        type: ControlType.Object,
        title: "Focus (Click)",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: D.focus.enabled,
            },
            warp: {
                type: ControlType.Number,
                title: "Warp",
                min: 1,
                max: 3.5,
                step: 0.05,
                defaultValue: D.focus.warp,
            },
            reach: {
                type: ControlType.Number,
                title: "Reach",
                min: 0.2,
                max: 0.8,
                step: 0.01,
                defaultValue: D.focus.reach,
            },
            zoom: {
                type: ControlType.Number,
                title: "Card Zoom",
                min: 1,
                max: 2,
                step: 0.01,
                defaultValue: D.focus.zoom,
            },
            dim: {
                type: ControlType.Number,
                title: "Background Dim",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: D.focus.dim,
            },
        },
    },
    panel: {
        type: ControlType.Object,
        title: "Info Panel",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show Panel",
                defaultValue: D.panel.show,
            },
            onHover: {
                type: ControlType.Boolean,
                title: "Preview on Hover",
                defaultValue: D.panel.onHover,
            },
            showActions: {
                type: ControlType.Boolean,
                title: "Like/Save Buttons",
                defaultValue: D.panel.showActions,
            },
            likeColor: {
                type: ControlType.Color,
                title: "Like Color",
                defaultValue: D.panel.likeColor,
                hidden: (p: Partial<PanelSettings>) => !p.showActions,
            },
            saveColor: {
                type: ControlType.Color,
                title: "Save Color",
                defaultValue: D.panel.saveColor,
                hidden: (p: Partial<PanelSettings>) => !p.showActions,
            },
            showLink: {
                type: ControlType.Boolean,
                title: "Show Link Button",
                defaultValue: D.panel.showLink,
            },
            linkLabel: {
                type: ControlType.String,
                title: "Link Label",
                defaultValue: D.panel.linkLabel,
                hidden: (p: Partial<PanelSettings>) => !p.showLink,
            },
            newTab: {
                type: ControlType.Boolean,
                title: "Open in New Tab",
                defaultValue: D.panel.newTab,
                hidden: (p: Partial<PanelSettings>) => !p.showLink,
            },
            width: {
                type: ControlType.Number,
                title: "Panel Width",
                min: 220,
                max: 400,
                step: 1,
                defaultValue: D.panel.width,
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            wheelSpeed: {
                type: ControlType.Number,
                title: "Scroll Speed",
                min: 0.2,
                max: 3,
                step: 0.05,
                defaultValue: D.motion.wheelSpeed,
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag to Pan",
                defaultValue: D.motion.drag,
            },
            smoothing: {
                type: ControlType.Number,
                title: "Smoothing",
                min: 0.03,
                max: 0.25,
                step: 0.005,
                defaultValue: D.motion.smoothing,
                description: "Lower = floatier",
            },
            inertia: {
                type: ControlType.Number,
                title: "Inertia",
                min: 0.8,
                max: 0.98,
                step: 0.005,
                defaultValue: D.motion.inertia,
            },
            motionBlur: {
                type: ControlType.Boolean,
                title: "Motion Blur",
                defaultValue: D.motion.motionBlur,
            },
            blurAmount: {
                type: ControlType.Number,
                title: "Blur Amount",
                min: 0.2,
                max: 2,
                step: 0.05,
                defaultValue: D.motion.blurAmount,
                hidden: (p: Partial<MotionSettings>) => !p.motionBlur,
            },
            idleDrift: {
                type: ControlType.Number,
                title: "Idle Drift",
                min: 0,
                max: 3,
                step: 0.1,
                defaultValue: D.motion.idleDrift,
                description: "Auto-scroll when idle (0 = off)",
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: D.look.background,
            },
            vignette: {
                type: ControlType.Number,
                title: "Vignette Size",
                min: 0,
                max: 400,
                step: 1,
                defaultValue: D.look.vignette,
            },
            cardShadow: {
                type: ControlType.Boolean,
                title: "Card Shadow",
                defaultValue: D.look.cardShadow,
            },
        },
    },
})
