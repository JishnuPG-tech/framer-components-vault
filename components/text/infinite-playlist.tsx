import * as React from "react"
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

import {
    AnimatePresence,
    motion,
    useAnimationFrame,
    useMotionValue,
    useSpring,
    useTransform,
    useVelocity,
} from "framer-motion"

/**
 * Spotify Playlist Marquee
 * Endless, scrolling rows of tracks from a Spotify playlist.
 * Hovering a track reveals its album cover.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 420
 */

// ---------- Types ----------

type Track = {
    title: string
    artist: string
    cover?: string
    url?: string
    album?: string
}

type Layout = "rows" | "list"
type Content = "title" | "artist" | "artist-title" | "title-artist" | "stacked"

// ---------- Helpers ----------

/** Fixed server used by the "Spotify Link" source. Only the playlist ID is sent. */
const DEFAULT_ENDPOINT = "https://infinitespotify.abujacz.workers.dev"

/** Removes "(feat. …)", "[Remastered]", "- … Remix" and similar from titles. */
export function cleanTitle(title: string): string {
    const kw = "feat\\.?|ft\\.?|with|remix|remaster(?:ed)?|version|edit|mix|live|mono|stereo|deluxe|bonus|from"
    return title
        .replace(new RegExp("\\s*[(\\[][^)\\]]*\\b(?:" + kw + ")\\b[^)\\]]*[)\\]]", "gi"), "")
        .replace(new RegExp("\\s+[\\u2014\\u2013-]\\s+[^\\u2014\\u2013]*\\b(?:" + kw + ")\\b.*$", "i"), "")
        .trim() || title
}

/** Parses "Title — Artist" lines (also "-", "–", "|" or a tab as separator). */
function parseQuickList(text: string): Track[] {
    if (!text) return []
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const parts = line.split(/\s+[—–-]\s+|\s*\|\s*|\t/)
            return {
                title: (parts[0] || "").trim(),
                artist: (parts[1] || "").trim(),
                cover: parts[2] && /^https?:/.test(parts[2].trim()) ? parts[2].trim() : undefined,
            }
        })
}

const SAMPLE_TRACKS: Track[] = [
    { artist: "Night Arcade", title: "Velvet Static" },
    { artist: "Mira Holt", title: "Paper Moons" },
    { artist: "The Lowlights", title: "Slow Bloom" },
    { artist: "Kasa Rue", title: "Glass Garden" },
    { artist: "Tidal Hearts", title: "After Hours" },
    { artist: "Oslo Drive", title: "Neon Rain" },
    { artist: "June Atlas", title: "Golden Hour" },
    { artist: "Saint Avenue", title: "Midnight Letters" },
    { artist: "Corale", title: "Blue Season" },
    { artist: "Ivy Lane", title: "Soft Machine" },
    { artist: "Northbound", title: "Hollow Light" },
    { artist: "Lumen", title: "Coastline" },
]

const PLACEHOLDER_GRADIENTS = [
    "linear-gradient(135deg,#ff6a3d,#7b2cbf)",
    "linear-gradient(135deg,#1db954,#0b3d2c)",
    "linear-gradient(135deg,#f9d423,#ff4e50)",
    "linear-gradient(135deg,#43cea2,#185a9d)",
    "linear-gradient(135deg,#ee9ca7,#4a148c)",
    "linear-gradient(135deg,#232526,#9e9e9e)",
]

/** Accepts a playlist URL, URI (spotify:playlist:ID) or a bare ID. */
export function parsePlaylistId(input: string): string {
    if (!input) return ""
    const s = input.trim()
    const m = s.match(/playlist[:/]([A-Za-z0-9]+)/)
    if (m) return m[1]
    return /^[A-Za-z0-9]+$/.test(s) ? s : ""
}

/**
 * Normalizes many JSON shapes into Track[]:
 * - { tracks: Track[] } or Track[]  (format returned by the bundled worker)
 * - raw Spotify playlist items: { items: [{ item | track: {...} }] }
 * - raw Spotify playlist object: { items: { items } } / { tracks: { items } }
 */
export function normalizeTracks(json: any): Track[] {
    let list: any[] = []
    if (Array.isArray(json)) list = json
    else if (Array.isArray(json?.tracks)) list = json.tracks
    else if (Array.isArray(json?.items)) list = json.items
    else if (Array.isArray(json?.items?.items)) list = json.items.items
    else if (Array.isArray(json?.tracks?.items)) list = json.tracks.items

    const out: Track[] = []
    for (const raw of list) {
        if (!raw) continue
        const t = raw.item ?? raw.track ?? raw
        if (!t || typeof t !== "object") continue
        const title = t.title ?? t.name
        if (!title) continue
        let artist = ""
        if (typeof t.artist === "string") artist = t.artist
        else if (Array.isArray(t.artists))
            artist = t.artists
                .map((a: any) => (typeof a === "string" ? a : a?.name))
                .filter(Boolean)
                .join(", ")
        else if (t.show?.name) artist = t.show.name
        const images = t.album?.images ?? t.images ?? t.show?.images
        const cover =
            t.cover ??
            t.image ??
            (Array.isArray(images) && images.length
                ? (images.find((i: any) => i.width && i.width <= 640) ?? images[0])
                      .url
                : undefined)
        out.push({
            title: String(title),
            artist: String(artist),
            cover: cover || undefined,
            url: t.url ?? t.external_urls?.spotify ?? undefined,
            album: typeof t.album === "string" ? t.album : t.album?.name,
        })
    }
    return out
}

const CACHE_TTL = 10 * 60 * 1000

function readCache(key: string): Track[] | null {
    try {
        const raw = sessionStorage.getItem(key)
        if (!raw) return null
        const { t, d } = JSON.parse(raw)
        return Date.now() - t < CACHE_TTL ? d : null
    } catch {
        return null
    }
}

function writeCache(key: string, d: Track[]) {
    try {
        sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d }))
    } catch {}
}

type Entry = { track: Track; index: number }

/** Splits tracks across row lanes. */
function distribute(tracks: Track[], rows: number, mode: string): Entry[][] {
    const entries = tracks.map((track, index) => ({ track, index }))
    const n = Math.max(1, rows)
    if (n === 1 || !entries.length) return [entries]
    // Not enough tracks to split nicely → every lane shows everything, rotated.
    if (mode === "repeat" || entries.length < n * 3) {
        return Array.from({ length: n }, (_, r) => {
            const shift = Math.floor((entries.length / n) * r)
            return [...entries.slice(shift), ...entries.slice(0, shift)]
        })
    }
    const size = Math.ceil(entries.length / n)
    return Array.from({ length: n }, (_, r) =>
        entries.slice(r * size, (r + 1) * size)
    ).filter((l) => l.length)
}

// ---------- Lane (one endless marquee track) ----------

type LaneProps = {
    entries: Entry[]
    laneId: number
    horizontal: boolean
    sign: number
    speed: number
    factor: React.MutableRefObject<number>
    animate: boolean
    renderItem: (e: Entry, lane: number, copy: number) => React.ReactNode
    fill: boolean
}

function Lane(props: LaneProps) {
    const {
        entries,
        laneId,
        horizontal,
        sign,
        speed,
        factor,
        animate,
        renderItem,
        fill,
    } = props
    const viewportRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const [listSize, setListSize] = useState(0)
    const [viewSize, setViewSize] = useState(0)

    useEffect(() => {
        const measure = () => {
            const l = listRef.current
            const v = viewportRef.current
            if (!l || !v) return
            setListSize(horizontal ? l.offsetWidth : l.offsetHeight)
            setViewSize(horizontal ? v.offsetWidth : v.offsetHeight)
        }
        measure()
        ;(document as any).fonts?.ready?.then?.(measure)
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        if (listRef.current) ro.observe(listRef.current)
        if (viewportRef.current) ro.observe(viewportRef.current)
        return () => ro.disconnect()
    }, [horizontal, entries])

    const copies =
        listSize > 0 ? Math.max(2, Math.ceil(viewSize / listSize) + 1) : 2

    const offset = useMotionValue(0)
    const transform = useTransform(offset, (v: number) =>
        horizontal ? "translate3d(" + -v + "px,0,0)" : "translate3d(0," + -v + "px,0)"
    )

    useAnimationFrame((_t: number, delta: number) => {
        if (!animate || listSize <= 0) return
        const dt = Math.min(delta, 64)
        let v = offset.get() + sign * speed * factor.current * (dt / 1000)
        v = ((v % listSize) + listSize) % listSize
        offset.set(v)
    })

    return (
        <div
            ref={viewportRef}
            style={{
                position: "relative",
                overflow: "hidden",
                width: "100%",
                height: fill ? "100%" : undefined,
                flexShrink: 0,
            }}
        >
            <motion.div
                style={{
                    display: "flex",
                    flexDirection: horizontal ? "row" : "column",
                    width: horizontal ? "max-content" : "100%",
                    transform,
                    willChange: "transform",
                }}
            >
                {Array.from({ length: entries.length ? copies : 0 }).map(
                    (_, copy) => (
                        <div
                            key={copy}
                            ref={copy === 0 ? listRef : undefined}
                            style={{
                                display: "flex",
                                flexDirection: horizontal ? "row" : "column",
                                flexShrink: 0,
                            }}
                        >
                            {entries.map((e) => renderItem(e, laneId, copy))}
                        </div>
                    )
                )}
            </motion.div>
        </div>
    )
}

// ---------- Component ----------

export default function SpotifyPlaylistMarquee(props) {
    const {
        source,
        playlist,
        manualTracks,
        quickList,
        limit,
        shuffle,

        layout,
        rows,
        distribution,
        rowGap,
        direction,
        listDirection,
        alternate,
        speed,
        speedVariation,
        hoverSpeed,
        animateInCanvas,
        fadeEdges,
        fadeSize,

        content,
        separator,
        suffix,
        align,
        textTransform,
        titleFont,
        artistFont,
        titleColor,
        artistColor,
        separatorColor,
        titleHoverColor,
        artistHoverColor,
        dimOthers,
        itemGap,
        textGap,

        dividers,
        dividerColor,
        dividerWidth,

        showCover,
        coverPosition,
        coverSize,
        coverRadius,
        coverOffsetX,
        coverOffsetY,
        coverLayer,
        coverTilt,
        coverShadow,
        followSmoothness,

        openLinks,
        shortTitles,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const isRows = layout !== "list"
    const horizontal = isRows
    const baseSign = isRows
        ? direction === "right"
            ? -1
            : 1
        : listDirection === "down"
          ? -1
          : 1

    // ----- Data -----

    const [remote, setRemote] = useState<Track[] | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (source !== "link") return
        setError(null)
        const id = parsePlaylistId(playlist)
        if (!id) {
            setRemote(null)
            if (playlist) setError("Paste a Spotify playlist link")
            return
        }
        const url = new URL(DEFAULT_ENDPOINT)
        url.searchParams.set("playlist", id)
        const key = "spm:" + url.toString()
        const cached = readCache(key)
        if (cached) {
            setRemote(cached)
            return
        }
        const ctrl = new AbortController()
        fetch(url.toString(), { signal: ctrl.signal })
            .then(async (r) => {
                if (!r.ok) {
                    let msg = "HTTP " + r.status
                    try {
                        const j = await r.json()
                        if (j?.error) msg += " – " + j.error
                    } catch {}
                    throw new Error(msg)
                }
                return r.json()
            })
            .then((json) => {
                const tracks = normalizeTracks(json)
                setRemote(tracks)
                writeCache(key, tracks)
                if (!tracks.length) setError("Playlist is empty")
            })
            .catch((e) => {
                if (e?.name !== "AbortError") setError(String(e?.message ?? e))
            })
        return () => ctrl.abort()
    }, [source, playlist])

    const tracks: Track[] = useMemo(() => {
        let list: Track[]
        // Manual tracks are also the fallback when Spotify fails.
        const useManual =
            source === "manual" || (!!error && !(remote && remote.length))
        if (useManual) {
            list = [
                ...(manualTracks ?? []).map((t: any) => ({
                    artist: t?.artist ?? "",
                    title: t?.title ?? "",
                    cover: typeof t?.cover === "string" ? t.cover : t?.cover?.src,
                    url: t?.link || undefined,
                })),
                ...parseQuickList(quickList),
            ].filter((t) => t.title || t.artist)
        } else list = remote ?? []
        list = list.filter((t) => t.title || t.artist)
        if (!list.length && isCanvas) list = SAMPLE_TRACKS
        if (shuffle && !isCanvas) {
            list = [...list]
            for (let i = list.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[list[i], list[j]] = [list[j], list[i]]
            }
        }
        return limit > 0 ? list.slice(0, limit) : list
    }, [source, manualTracks, quickList, remote, error, limit, shuffle, isCanvas])

    const lanes = useMemo(
        () => (isRows ? distribute(tracks, rows, distribution) : [tracks.map((track, index) => ({ track, index }))]),
        [tracks, isRows, rows, distribution]
    )

    // Preload covers so the hover reveal is instant.
    useEffect(() => {
        if (!showCover || isCanvas || isStatic) return
        tracks.forEach((t) => {
            if (t.cover) {
                const img = new Image()
                img.src = t.cover
            }
        })
    }, [tracks, showCover, isCanvas, isStatic])

    // ----- Hover / speed -----

    const rootRef = useRef<HTMLDivElement>(null)
    const pointer = useRef({ x: 0, y: 0, inside: false })
    const speedFactor = useRef(1)
    const lastHitTest = useRef(0)
    // "lane-copy-index" of the hovered item instance
    const [hoveredKey, setHoveredKey] = useState<string | null>(null)
    const [hovered, setHovered] = useState<number | null>(null)

    const hitTest = useCallback(() => {
        const p = pointer.current
        let key: string | null = null
        let idx: number | null = null
        if (p.inside) {
            const el = document.elementFromPoint(p.x, p.y) as HTMLElement | null
            const item = el?.closest?.("[data-spm-key]") as HTMLElement | null
            if (item && rootRef.current?.contains(item)) {
                key = item.dataset.spmKey ?? null
                idx = Number(item.dataset.spmIndex)
            }
        }
        setHoveredKey(key)
        setHovered(idx)
    }, [])

    const shouldAnimate = !isStatic && (!isCanvas || animateInCanvas)

    useAnimationFrame((time: number, delta: number) => {
        if (isStatic) return
        const dt = Math.min(delta, 64)
        const target = pointer.current.inside ? hoverSpeed / 100 : 1
        speedFactor.current +=
            (target - speedFactor.current) * Math.min(1, dt / 250)
        if (Math.abs(target - speedFactor.current) < 0.005)
            speedFactor.current = target
        // Content moves under a still cursor – keep hover in sync.
        if (pointer.current.inside && time - lastHitTest.current > 80) {
            lastHitTest.current = time
            hitTest()
        }
    })

    // Cover follow
    const s = Math.max(0, Math.min(100, followSmoothness))
    const springCfg = {
        stiffness: 400 - s * 3.5,
        damping: 30 + s * 0.2,
        mass: 0.5 + s / 100,
    }
    const cx = useSpring(0, springCfg)
    const cy = useSpring(0, springCfg)
    const vx = useVelocity(cx)
    const rotate = useTransform(vx, (v: number) =>
        Math.max(-coverTilt, Math.min(coverTilt, (v / 1000) * coverTilt))
    )

    const updatePointer = (e: React.PointerEvent, jump = false) => {
        if (isStatic) return
        const rect = rootRef.current?.getBoundingClientRect()
        if (!rect) return
        pointer.current = { x: e.clientX, y: e.clientY, inside: true }
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        if (jump) {
            cx.jump(x)
            cy.jump(y)
        } else {
            cx.set(x)
            cy.set(y)
        }
        hitTest()
    }

    const onPointerLeave = () => {
        pointer.current.inside = false
        setHoveredKey(null)
        setHovered(null)
    }

    // ----- Item rendering -----

    const justify =
        align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start"
    const divider =
        !isRows && dividers ? dividerWidth + "px solid " + dividerColor : undefined
    const stacked = content === "stacked" && !isRows
    const colorTransition = "color .3s ease, opacity .3s ease"

    const renderItem = (e: Entry, lane: number, copy: number) => {
        const { track: t, index: i } = e
        const key = lane + "-" + copy + "-" + i
        const active = hoveredKey === key
        const dim = hoveredKey !== null && !active

        const titleEl = (
            <span
                key="t"
                style={{
                    ...titleFont,
                    color: active ? titleHoverColor : titleColor,
                    textTransform,
                    transition: colorTransition,
                }}
            >
                {shortTitles ? cleanTitle(t.title) : t.title}
            </span>
        )
        const artistEl = (
            <span
                key="a"
                style={{
                    ...artistFont,
                    color: active ? artistHoverColor : artistColor,
                    textTransform,
                    transition: colorTransition,
                }}
            >
                {t.artist}
            </span>
        )
        const sepEl = (
            <span
                key="s"
                style={{ ...titleFont, color: separatorColor, whiteSpace: "pre" }}
            >
                {separator}
            </span>
        )

        let parts: React.ReactNode[]
        switch (content) {
            case "title":
                parts = [titleEl]
                break
            case "artist":
                parts = [artistEl]
                break
            case "title-artist":
                parts = t.artist ? [titleEl, sepEl, artistEl] : [titleEl]
                break
            case "stacked":
                parts = isRows
                    ? [artistEl, sepEl, titleEl]
                    : [artistEl, titleEl]
                break
            default:
                parts = t.artist ? [artistEl, sepEl, titleEl] : [titleEl]
        }
        if (suffix) {
            const last =
                content === "artist" ||
                (content === "title-artist" && t.artist)
                    ? artistFont
                    : titleFont
            parts.push(
                <span
                    key="x"
                    style={{
                        ...last,
                        color: separatorColor,
                        whiteSpace: "pre",
                    }}
                >
                    {suffix}
                </span>
            )
        }

        const clickable = openLinks && !!t.url

        return (
            <div
                key={key}
                data-spm-key={key}
                data-spm-index={i}
                aria-hidden={copy > 0 ? true : undefined}
                onClick={
                    clickable
                        ? () => window.open(t.url, "_blank", "noopener")
                        : undefined
                }
                style={{
                    display: "flex",
                    flexDirection: stacked ? "column" : "row",
                    alignItems: stacked ? justify : "baseline",
                    justifyContent: stacked ? undefined : isRows ? undefined : justify,
                    flexWrap: isRows || stacked ? "nowrap" : "wrap",
                    gap: stacked ? textGap : 0,
                    textAlign: align,
                    whiteSpace: isRows ? "nowrap" : undefined,
                    flexShrink: 0,
                    padding: isRows ? "0 " + itemGap / 2 + "px" : itemGap / 2 + "px 0",
                    borderBottom: divider,
                    opacity: dim ? dimOthers / 100 : 1,
                    transition: colorTransition,
                    cursor: clickable ? "pointer" : "default",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                }}
            >
                {parts}
            </div>
        )
    }

    // ----- Layout -----

    const mask = fadeEdges
        ? "linear-gradient(" + (isRows ? "to right" : "to bottom") + ", transparent 0, #000 " + fadeSize + "px, #000 calc(100% - " + fadeSize + "px), transparent 100%)"
        : undefined

    const current = hovered !== null ? tracks[hovered] : undefined
    const coverStyle: any =
        coverPosition === "cursor"
            ? {
                  left: -coverSize / 2 + coverOffsetX,
                  top: -coverSize / 2 + coverOffsetY,
                  x: cx,
                  y: cy,
                  rotate,
              }
            : {
                  left: "calc(50% - " + coverSize / 2 + "px + " + coverOffsetX + "px)",
                  top: "calc(50% - " + coverSize / 2 + "px + " + coverOffsetY + "px)",
              }

    const laneCount = lanes.length

    return (
        <div
            ref={rootRef}
            onPointerEnter={(e) => updatePointer(e, true)}
            onPointerMove={(e) => updatePointer(e)}
            onPointerLeave={onPointerLeave}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: isRows ? style?.height : "100%",
                minHeight: isRows ? "100%" : undefined,
                background: "transparent",
            }}
        >
            <div
                style={{
                    position: isRows ? "relative" : "absolute",
                    inset: isRows ? undefined : 0,
                    width: "100%",
                    minHeight: isRows ? "100%" : undefined,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: rowGap,
                    zIndex: 1,
                    WebkitMaskImage: mask,
                    maskImage: mask,
                }}
            >
                {lanes.map((entries, lane) => {
                    const variation =
                        laneCount > 1
                            ? 1 - (speedVariation / 100) * (lane / (laneCount - 1))
                            : 1
                    const sign =
                        alternate && lane % 2 === 1 ? -baseSign : baseSign
                    return (
                        <Lane
                            key={lane}
                            laneId={lane}
                            entries={entries}
                            horizontal={horizontal}
                            sign={sign}
                            speed={speed * variation}
                            factor={speedFactor}
                            animate={shouldAnimate}
                            renderItem={renderItem}
                            fill={!isRows}
                        />
                    )
                })}
            </div>

            {showCover && !isStatic && (
                <motion.div
                    style={{
                        position: "absolute",
                        width: coverSize,
                        height: coverSize,
                        pointerEvents: "none",
                        zIndex: coverLayer === "above" ? 2 : 0,
                        ...coverStyle,
                    }}
                >
                    <AnimatePresence>
                        {current && (
                            <motion.div
                                key={hovered}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: coverRadius,
                                    overflow: "hidden",
                                    boxShadow: coverShadow
                                        ? "0 20px 50px rgba(0,0,0,0.35)"
                                        : undefined,
                                    background: current.cover
                                        ? undefined
                                        : PLACEHOLDER_GRADIENTS[
                                              (hovered ?? 0) % PLACEHOLDER_GRADIENTS.length
                                          ],
                                }}
                            >
                                {current.cover && (
                                    <img
                                        src={current.cover}
                                        alt={current.album ?? current.artist + " – " + current.title}
                                        draggable={false}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {isCanvas && error && (
                <div
                    style={{
                        position: "absolute",
                        left: 8,
                        bottom: 8,
                        zIndex: 3,
                        padding: "6px 10px",
                        borderRadius: 6,
                        background: "rgba(255,59,48,0.9)",
                        color: "#fff",
                        font: "12px/1.3 system-ui, sans-serif",
                        maxWidth: "calc(100% - 16px)",
                    }}
                >
                    Spotify Playlist: {error}
                </div>
            )}
        </div>
    )
}

SpotifyPlaylistMarquee.displayName = "Spotify Playlist Marquee"

// ---------- Defaults ----------

SpotifyPlaylistMarquee.defaultProps = {
    source: "manual",
    playlist: "",
    manualTracks: [],
    quickList: "",
    limit: 0,
    shuffle: false,

    layout: "rows",
    rows: 3,
    distribution: "split",
    rowGap: 0,
    direction: "left",
    listDirection: "up",
    alternate: false,
    speed: 60,
    speedVariation: 15,
    hoverSpeed: 30,
    animateInCanvas: true,
    fadeEdges: false,
    fadeSize: 80,

    content: "title",
    separator: " — ",
    suffix: ", ",
    align: "left",
    textTransform: "none",
    titleColor: "#111111",
    artistColor: "#111111",
    separatorColor: "#111111",
    titleHoverColor: "#111111",
    artistHoverColor: "#111111",
    dimOthers: 100,
    itemGap: 24,
    textGap: 2,

    dividers: false,
    dividerColor: "rgba(0,0,0,0.12)",
    dividerWidth: 1,

    showCover: true,
    coverPosition: "cursor",
    coverSize: 280,
    coverRadius: 0,
    coverOffsetX: 0,
    coverOffsetY: 0,
    coverLayer: "above",
    coverTilt: 0,
    coverShadow: false,
    followSmoothness: 30,

    openLinks: true,
    shortTitles: false,
}

// ---------- Property Controls ----------

const isList = (p: any) => p.layout === "list"
const noCover = (p: any) => !p.showCover
const hasArtist = (p: any) => p.content !== "title"
const hasTitle = (p: any) => p.content !== "artist"
const hasSeparator = (p: any) =>
    p.content === "artist-title" ||
    p.content === "title-artist" ||
    (p.content === "stacked" && p.layout !== "list")

addPropertyControls(SpotifyPlaylistMarquee, {
    // ---- Data
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["manual", "link"],
        optionTitles: ["Manual", "Spotify Link"],
        displaySegmentedControl: true,
    },
    playlist: {
        type: ControlType.String,
        title: "Playlist",
        placeholder: "https://open.spotify.com/playlist/…",
        description: "Link to a public Spotify playlist.",
        hidden: (p: any) => p.source === "manual",
    },
    quickList: {
        type: ControlType.String,
        title: "Quick List",
        displayTextArea: true,
        placeholder: "Lovely Day — Bill Withers\nSo What — Miles Davis",
        description: "One track per line: Title — Artist. Also used as a fallback if Spotify fails.",
    },
    manualTracks: {
        type: ControlType.Array,
        title: "Tracks",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                artist: { type: ControlType.String, title: "Artist" },
                cover: { type: ControlType.ResponsiveImage, title: "Cover" },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    limit: {
        type: ControlType.Number,
        title: "Max Tracks",
        min: 0,
        max: 500,
        step: 1,
        displayStepper: true,
        description: "0 = all",
    },
    shuffle: { type: ControlType.Boolean, title: "Shuffle" },

    // ---- Layout & motion
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["rows", "list"],
        optionTitles: ["Rows", "List"],
        displaySegmentedControl: true,
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
        hidden: isList,
    },
    distribution: {
        type: ControlType.Enum,
        title: "Tracks per Row",
        options: ["split", "repeat"],
        optionTitles: ["Split", "All"],
        displaySegmentedControl: true,
        hidden: (p: any) => isList(p) || p.rows < 2,
    },
    rowGap: {
        type: ControlType.Number,
        title: "Row Gap",
        min: -100,
        max: 200,
        unit: "px",
        hidden: isList,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["←", "→"],
        displaySegmentedControl: true,
        hidden: isList,
    },
    listDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down"],
        optionTitles: ["↑", "↓"],
        displaySegmentedControl: true,
        hidden: (p: any) => !isList(p),
    },
    alternate: {
        type: ControlType.Boolean,
        title: "Alternate",
        description: "Every other row moves the opposite way.",
        hidden: (p: any) => isList(p) || p.rows < 2,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 500,
        step: 1,
        unit: "px/s",
    },
    speedVariation: {
        type: ControlType.Number,
        title: "Speed Variation",
        min: 0,
        max: 90,
        step: 5,
        unit: "%",
        description: "Each following row is a bit slower.",
        hidden: (p: any) => isList(p) || p.rows < 2,
    },
    hoverSpeed: {
        type: ControlType.Number,
        title: "On Hover",
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        description: "Speed while hovered (0 = pause).",
    },
    animateInCanvas: { type: ControlType.Boolean, title: "Canvas Play" },
    fadeEdges: { type: ControlType.Boolean, title: "Fade Edges" },
    fadeSize: {
        type: ControlType.Number,
        title: "Fade Size",
        min: 0,
        max: 400,
        unit: "px",
        hidden: (p: any) => !p.fadeEdges,
    },

    // ---- Text
    content: {
        type: ControlType.Enum,
        title: "Content",
        options: ["title", "artist", "artist-title", "title-artist", "stacked"],
        optionTitles: [
            "Title",
            "Artist",
            "Artist — Title",
            "Title — Artist",
            "Stacked (List)",
        ],
    },
    separator: {
        type: ControlType.String,
        title: "Separator",
        hidden: (p: any) => !hasSeparator(p),
    },
    suffix: {
        type: ControlType.String,
        title: "After Item",
        description: "Text after every item, e.g. “, ” or “ • ”.",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        hidden: (p: any) => !isList(p),
    },
    shortTitles: {
        type: ControlType.Boolean,
        title: "Short Titles",
        description: "Hide “(feat. …)”, “– Remix”, “[Remastered]” etc.",
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Case",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["Aa", "AA", "aa", "Aa Aa"],
        displaySegmentedControl: true,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: 110,
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        hidden: (p: any) => !hasTitle(p),
    },
    artistFont: {
        type: ControlType.Font,
        title: "Artist Font",
        controls: "extended",
        defaultFontType: "serif",
        defaultValue: {
            fontSize: 110,
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        hidden: (p: any) => !hasArtist(p),
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title",
        hidden: (p: any) => !hasTitle(p),
    },
    artistColor: {
        type: ControlType.Color,
        title: "Artist",
        hidden: (p: any) => !hasArtist(p),
    },
    separatorColor: { type: ControlType.Color, title: "Separators" },
    titleHoverColor: {
        type: ControlType.Color,
        title: "Title Hover",
        hidden: (p: any) => !hasTitle(p),
    },
    artistHoverColor: {
        type: ControlType.Color,
        title: "Artist Hover",
        hidden: (p: any) => !hasArtist(p),
    },
    dimOthers: {
        type: ControlType.Number,
        title: "Others Hover",
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        description: "Opacity of other items while one is hovered.",
    },
    itemGap: {
        type: ControlType.Number,
        title: "Item Gap",
        min: 0,
        max: 300,
        unit: "px",
    },
    textGap: {
        type: ControlType.Number,
        title: "Line Gap",
        min: 0,
        max: 100,
        unit: "px",
        hidden: (p: any) => !(isList(p) && p.content === "stacked"),
    },

    // ---- Dividers (list)
    dividers: {
        type: ControlType.Boolean,
        title: "Dividers",
        hidden: (p: any) => !isList(p),
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider",
        hidden: (p: any) => !isList(p) || !p.dividers,
    },
    dividerWidth: {
        type: ControlType.Number,
        title: "Divider Width",
        min: 1,
        max: 10,
        unit: "px",
        hidden: (p: any) => !isList(p) || !p.dividers,
    },

    // ---- Cover
    showCover: { type: ControlType.Boolean, title: "Cover" },
    coverPosition: {
        type: ControlType.Enum,
        title: "Cover Position",
        options: ["cursor", "center"],
        optionTitles: ["Cursor", "Center"],
        displaySegmentedControl: true,
        hidden: noCover,
    },
    coverSize: {
        type: ControlType.Number,
        title: "Cover Size",
        min: 40,
        max: 1000,
        unit: "px",
        hidden: noCover,
    },
    coverRadius: {
        type: ControlType.Number,
        title: "Cover Radius",
        min: 0,
        max: 500,
        unit: "px",
        hidden: noCover,
    },
    coverOffsetX: {
        type: ControlType.Number,
        title: "Offset X",
        min: -600,
        max: 600,
        unit: "px",
        hidden: noCover,
    },
    coverOffsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        min: -600,
        max: 600,
        unit: "px",
        hidden: noCover,
    },
    coverLayer: {
        type: ControlType.Enum,
        title: "Cover Layer",
        options: ["above", "below"],
        optionTitles: ["Above Text", "Below Text"],
        displaySegmentedControl: true,
        hidden: noCover,
    },
    coverTilt: {
        type: ControlType.Number,
        title: "Tilt",
        min: 0,
        max: 30,
        unit: "°",
        hidden: (p: any) => noCover(p) || p.coverPosition !== "cursor",
    },
    followSmoothness: {
        type: ControlType.Number,
        title: "Smoothness",
        min: 0,
        max: 100,
        hidden: (p: any) => noCover(p) || p.coverPosition !== "cursor",
    },
    coverShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        hidden: noCover,
    },

    openLinks: {
        type: ControlType.Boolean,
        title: "Open in Spotify",
        description: "Hover a track to reveal its cover.",
    },
})
