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


// StyledFrame Audio Catalog 0.1.0. No private CMS APIs or collection introspection.
export interface Track {
    id: string
    title: string
    artist?: string
    category?: string
    tags?: string
    audio?: string
    audioUrl?: string
    artwork?: string
    duration?: string
    bpm?: number
    musicalKey?: string
    actionUrl?: string
    actionLabel?: string
    order?: number
}
interface CatalogProps {
    catalogId?: string
    source?: "manual" | "cms"
    tracks?: Track[]
    cmsContent?: React.ReactNode
    title?: string
    description?: string
    eyebrow?: string
    accent?: string
    background?: string
    foreground?: string
    muted?: string
    surface?: string
    border?: string
    radius?: number
    font?: React.CSSProperties
    showBpm?: boolean
    showKey?: boolean
    showActions?: boolean
    autoNext?: boolean
    showShare?: boolean
    stickyPlayer?: boolean
    bottomSpace?: number
    style?: React.CSSProperties
}
type Registered = { token: string; track: Track }
type Channel = { entries: Registered[]; listeners: Set<() => void> }
// Framer may bundle named exports independently. Share only this catalog registry.
const registryKey = Symbol.for("styledframe.audio-catalog.registry.v1")
const registryHost = (typeof window !== "undefined" ? window : {}) as unknown as { [key: symbol]: Map<string, Channel> | undefined }
const channels = registryHost[registryKey] || (registryHost[registryKey] = new Map<string, Channel>())
function channel(id: string) {
    if (!channels.has(id))
        channels.set(id, { entries: [], listeners: new Set() })
    return channels.get(id)!
}
function register(id: string, token: string, track: Track) {
    const c = channel(id)
    c.entries = [
        ...c.entries.filter((e) => e.token !== token),
        { token, track },
    ]
    c.listeners.forEach((fn) => fn())
    return () => {
        c.entries = c.entries.filter((e) => e.token !== token)
        c.listeners.forEach((fn) => fn())
        if (!c.entries.length && !c.listeners.size) channels.delete(id)
    }
}
function useRegistered(id: string) {
    const [entries, setEntries] = React.useState<Registered[]>([])
    React.useEffect(() => {
        const c = channel(id)
        const update = () => setEntries(c.entries)
        c.listeners.add(update)
        update()
        return () => {
            c.listeners.delete(update)
            if (!c.listeners.size && !c.entries.length) channels.delete(id)
        }
    }, [id])
    return entries
}
export function safeUrl(value?: string) {
    if (!value) return ""
    try {
        const u = new URL(value, "https://placeholder.invalid")
        return ["https:", "http:"].includes(u.protocol) ? value : ""
    } catch {
        return ""
    }
}
export function normalizeTracks(input: Track[]) {
    const seen = new Set<string>()
    return input
        .filter((t) => t && t.id?.trim())
        .filter((t) => {
            const id = t.id.trim()
            if (seen.has(id)) return false
            seen.add(id)
            return true
        })
        .map((t) => ({
            ...t,
            audio: t.audio || t.audioUrl,
            id: t.id.trim(),
            title: t.title?.trim() || "Untitled track",
            category: t.category?.trim() || "Uncategorized",
        }))
}
export function filterTracks(tracks: Track[], query: string, category: string) {
    const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
    return tracks.filter(
        (t) =>
            (category === "All" || t.category === category) &&
            words.every((w) =>
                [t.title, t.artist, t.tags, t.category, t.musicalKey, t.bpm]
                    .join(" ")
                    .toLocaleLowerCase()
                    .includes(w)
            )
    )
}
export function formatTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
}
export const sampleTracks: Track[] = [
    [
        "soft-signal",
        "Soft Signal",
        "Electronic",
        "Warm · Cinematic",
        92,
        "D minor",
    ],
    [
        "after-hours",
        "After Hours",
        "Electronic",
        "Ambient · Minimal",
        110,
        "A minor",
    ],
    [
        "first-light",
        "First Light",
        "Cinematic",
        "Hopeful · Gentle",
        78,
        "C major",
    ],
    ["slow-orbit", "Slow Orbit", "Ambient", "Spacious · Dreamy", 68, "G major"],
    [
        "paper-skies",
        "Paper Skies",
        "Cinematic",
        "Reflective · Piano",
        84,
        "F major",
    ],
    [
        "night-drive",
        "Night Drive",
        "Electronic",
        "Focused · Rhythmic",
        120,
        "E minor",
    ],
    ["tidal", "Tidal", "Ambient", "Calm · Floating", 72, "D major"],
    ["small-hours", "Small Hours", "Ambient", "Intimate · Soft", 64, "A minor"],
    [
        "open-road",
        "Open Road",
        "Cinematic",
        "Uplifting · Bright",
        96,
        "C major",
    ],
    [
        "blue-room",
        "Blue Room",
        "Electronic",
        "Mellow · Textural",
        102,
        "G minor",
    ],
    ["daybreak", "Daybreak", "Cinematic", "Warm · Optimistic", 88, "F major"],
    [
        "still-water",
        "Still Water",
        "Ambient",
        "Quiet · Atmospheric",
        60,
        "C major",
    ],
].map((v, i) => ({
    id: String(v[0]),
    title: String(v[1]),
    artist: "StyledFrame Studio",
    category: String(v[2]),
    tags: String(v[3]),
    bpm: Number(v[4]),
    musicalKey: String(v[5]),
    duration: "0:08",
    audio: `demo:${i}`,
    order: i,
}))

// Original short synthesized demo clips, generated only after a visitor presses Play.
// No external audio service, AudioContext, autoplay or copyrighted recordings.
const demoCache = new Map<string, string>()
export function audioSource(value?: string) {
    if (!/^demo:\d+$/.test(value || "")) return safeUrl(value)
    if (demoCache.has(value!)) return demoCache.get(value!)!
    const seed = Number(value!.split(":")[1])
    const rate = 12000
    const count = rate * 8
    const bytes = new Uint8Array(44 + count * 2)
    const view = new DataView(bytes.buffer)
    const str = (pos: number, s: string) => {
        for (let i = 0; i < s.length; i++) bytes[pos + i] = s.charCodeAt(i)
    }
    str(0, "RIFF")
    view.setUint32(4, 36 + count * 2, true)
    str(8, "WAVE")
    str(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, rate, true)
    view.setUint32(28, rate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    str(36, "data")
    view.setUint32(40, count * 2, true)
    const root = 130.81 * Math.pow(2, (seed % 7) / 12)
    const notes = [0, 7, 12, 3, 10, 7, 5, 3]
    for (let i = 0; i < count; i++) {
        const t = i / rate
        const phase = (t * 2) % 1
        const n = notes[(Math.floor(t * 2) + seed) % notes.length]
        const f = root * Math.pow(2, n / 12)
        const env = Math.min(1, phase * 35) * Math.exp(-phase * 4)
        const fade = Math.min(1, t * 8, (8 - t) * 3)
        const sample =
            (Math.sin(t * f * Math.PI * 2) * 0.24 +
                Math.sin(t * f * Math.PI * 4) * 0.045) *
                env +
            Math.sin(t * root * Math.PI) * 0.09
        view.setInt16(
            44 + i * 2,
            Math.max(-1, Math.min(1, sample * fade)) * 32767,
            true
        )
    }
    let binary = ""
    for (let i = 0; i < bytes.length; i += 8192)
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
    const url = "data:audio/wav;base64," + btoa(binary)
    demoCache.set(value!, url)
    return url
}

/** CMS adapter: place inside a Collection List item and bind each field individually.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 56
 */
export function AudioCatalogTrack(
    props: Omit<Track, "id"> & { trackId?: string; id?: string; catalogId?: string; style?: React.CSSProperties }
) {
    const token = React.useId()
    const group = props.catalogId || "audio-library"
    const {
        id: legacyId,
        title,
        artist,
        category,
        tags,
        audio,
        audioUrl,
        artwork,
        duration,
        bpm,
        musicalKey,
        actionUrl,
        actionLabel,
        order,
    } = props
    const id = props.trackId || legacyId || ""
    React.useEffect(
        () =>
            register(group, token, {
                id,
                title,
                artist,
                category,
                tags,
                audio: audio || audioUrl,
                artwork,
                duration,
                bpm,
                musicalKey,
                actionUrl,
                actionLabel,
                order,
            }),
        [
            group,
            token,
            id,
            title,
            artist,
            category,
            tags,
            audio,
            audioUrl,
            artwork,
            duration,
            bpm,
            musicalKey,
            actionUrl,
            actionLabel,
            order,
        ]
    )
    if (RenderTarget.current() !== RenderTarget.canvas)
        return <span aria-hidden="true" style={{ display: "none" }} />
    return (
        <div
            style={{
                ...props.style,
                font: "12px system-ui",
                padding: 12,
                color: "#302944",
                background: "#f1edf9",
                borderRadius: 8,
            }}
        >
            <strong>{title || "Bind track title"}</strong>
            <br />
            {id ? `ID: ${id} · ${group}` : "Bind a unique CMS slug to Track ID"}
        </div>
    )
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
    const paths: Record<string, React.ReactNode> = {
        play: <path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none" />,
        pause: (
            <>
                <path d="M8 5v14M16 5v14" strokeWidth="4" />
            </>
        ),
        search: (
            <>
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
            </>
        ),
        next: (
            <>
                <path d="m6 5 10 7-10 7Z" fill="currentColor" stroke="none" />
                <path d="M19 5v14" />
            </>
        ),
        prev: (
            <>
                <path d="m18 5-10 7 10 7Z" fill="currentColor" stroke="none" />
                <path d="M5 5v14" />
            </>
        ),
        share: (
            <>
                <path d="M12 16V3m-5 5 5-5 5 5M5 13v7h14v-7" />
            </>
        ),
        volume: (
            <>
                <path d="m10 5-5 4H2v6h3l5 4ZM15 8q6 4 0 8M18 4q11 8 0 16" />
            </>
        ),
        note: (
            <>
                <path d="M9 17V5l11-2v12M9 8l11-2" />
                <ellipse cx="6" cy="18" rx="3" ry="2" />
                <ellipse cx="17" cy="16" rx="3" ry="2" />
            </>
        ),
        arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    }
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[name] || paths.note}
        </svg>
    )
}
function Cover({ track, small = false }: { track: Track; small?: boolean }) {
    const [failed, setFailed] = React.useState(false)
    React.useEffect(() => setFailed(false), [track.artwork])
    const seed = [...track.id].reduce((a, c) => a + c.charCodeAt(0), 0)
    return (
        <div
            className={small ? "ac-cover ac-cover-small" : "ac-cover"}
            style={{
                background: `linear-gradient(${seed % 180}deg,hsl(${seed % 360} 25% 30%),hsl(${(seed + 55) % 360} 35% 65%))`,
            }}
        >
            {safeUrl(track.artwork) && !failed ? (
                <img
                    src={safeUrl(track.artwork)}
                    alt=""
                    loading="lazy"
                    onError={() => setFailed(true)}
                />
            ) : (
                <div className="ac-art-lines">
                    <i />
                    <i />
                    <i />
                </div>
            )}
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1080
 * @framerIntrinsicHeight 900
 */
export default function AudioCatalog(props: CatalogProps) {
    const {
        catalogId = "audio-library",
        source = "manual",
        title = "Find your next sound.",
        description = "A collection of small sounds for big ideas. Browse, listen, make something.",
        eyebrow = "STUDIO / AUDIO LIBRARY",
        tracks: manualTracks = sampleTracks,
        accent = "#d5f87a",
        background = "#121513",
        foreground = "#f2f3ec",
        muted = "#a5aaa1",
        surface = "#1c211d",
        border = "#353c33",
        radius = 18,
        showBpm = true,
        showKey = true,
        showActions = true,
        showShare = true,
        autoNext = false,
    } = props
    const entries = useRegistered(catalogId)
    const raw = source === "cms" ? entries.map((e) => e.track) : manualTracks
    const rawKey = JSON.stringify(raw)
    const tracks = React.useMemo(
        () =>
            normalizeTracks(raw).sort(
                (a, b) =>
                    (a.order || 0) - (b.order || 0) ||
                    a.title.localeCompare(b.title)
            ),
        [rawKey]
    )
    const [query, setQuery] = React.useState("")
    const [category, setCategory] = React.useState("All")
    const [sort, setSort] = React.useState("curated")
    const categories = [
        "All",
        ...Array.from(new Set(tracks.map((t) => t.category!))).sort(),
    ]
    React.useEffect(() => {
        if (!categories.includes(category)) setCategory("All")
    }, [categories.join("|"), category])
    const visible = filterTracks(tracks, query, category).sort((a, b) =>
        sort === "title"
            ? a.title.localeCompare(b.title)
            : sort === "bpm"
              ? (a.bpm || 0) - (b.bpm || 0)
              : 0
    )
    const [selectedId, setSelectedId] = React.useState("")
    const active = tracks.find((t) => t.id === selectedId)
    const [playing, setPlaying] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState("")
    const [time, setTime] = React.useState(0)
    const [duration, setDuration] = React.useState(0)
    const [volume, setVolume] = React.useState(0.75)
    const [notice, setNotice] = React.useState("")
    const audio = React.useRef<HTMLAudioElement>(null)
    const request = React.useRef(0)
    const owner = React.useId()
    const listRef = React.useRef(visible)
    listRef.current = visible
    const activeRef = React.useRef(active)
    activeRef.current = active
    const requestPlay = (track: Track) => {
        const el = audio.current
        if (!el) return
        const src = audioSource(track.audio)
        if (!src) {
            ++request.current
            el.pause()
            el.removeAttribute("src")
            el.load()
            setSelectedId(track.id)
            setTime(0)
            setDuration(0)
            setLoading(false)
            setError("This track needs an audio file or direct audio URL.")
            return
        }
        const ticket = ++request.current
        setError("")
        setSelectedId(track.id)
        setLoading(true)
        if (
            el.dataset.track !== track.id ||
            el.dataset.original !== track.audio
        ) {
            el.pause()
            el.src = src
            el.dataset.track = track.id
            el.dataset.original = track.audio || ""
            setTime(0)
            setDuration(0)
        }
        const result = el.play()
        result?.catch(() => {
            if (ticket === request.current) {
                setLoading(false)
                setPlaying(false)
                setError(
                    "Audio could not play. Check the file URL or try Play again."
                )
            }
        })
    }
    const toggle = (track?: Track) => {
        const target = track || active || visible[0]
        if (!target) return
        if (active?.id === target.id && playing) {
            ++request.current
            audio.current?.pause()
            setLoading(false)
        } else requestPlay(target)
    }
    const step = (direction: number) => {
        const list = listRef.current
        if (!list.length) return
        const index = list.findIndex((t) => t.id === activeRef.current?.id)
        requestPlay(list[(index + direction + list.length) % list.length])
    }
    React.useEffect(() => {
        const el = audio.current
        if (!el) return
        const stopOthers = (event: Event) => {
            if ((event as CustomEvent).detail !== owner) el.pause()
        }
        window.addEventListener("styledframe-audio-playing", stopOthers)
        return () => {
            ++request.current
            el.pause()
            el.removeAttribute("src")
            el.load()
            window.removeEventListener("styledframe-audio-playing", stopOthers)
        }
    }, [owner])
    React.useEffect(() => {
        if (selectedId && !active) {
            ++request.current
            audio.current?.pause()
            audio.current?.removeAttribute("src")
            audio.current?.load()
            setSelectedId("")
            setTime(0)
            setDuration(0)
            setLoading(false)
            setError("")
        }
    }, [selectedId, active?.id])
    React.useEffect(() => {
        if (active && audio.current?.dataset.original !== active.audio) {
            ++request.current
            audio.current?.pause()
            audio.current?.removeAttribute("src")
            setTime(0)
            setDuration(0)
            setLoading(false)
        }
    }, [active?.audio])
    React.useEffect(() => {
        if (audio.current) audio.current.volume = volume
    }, [volume])
    React.useEffect(() => {
        const read = () => {
            const key = new URL(window.location.href).searchParams.get(
                `track_${catalogId}`
            )
            if (key && tracks.some((t) => t.id === key)) setSelectedId(key)
        }
        read()
        window.addEventListener("popstate", read)
        return () => window.removeEventListener("popstate", read)
    }, [catalogId, tracks.map((t) => t.id).join("|")])
    React.useEffect(() => {
        if (!notice) return
        const timer = setTimeout(() => setNotice(""), 3500)
        return () => clearTimeout(timer)
    }, [notice])
    const share = async (track: Track) => {
        const url = new URL(window.location.href)
        url.searchParams.set(`track_${catalogId}`, track.id)
        try {
            await navigator.clipboard.writeText(url.toString())
            setNotice("Track link copied")
        } catch {
            setNotice("Copy the track link below")
            setShareFallback(url.toString())
        }
    }
    const [shareFallback, setShareFallback] = React.useState("")
    const cssVars = {
        "--ac-bg": background,
        "--ac-fg": foreground,
        "--ac-muted": muted,
        "--ac-surface": surface,
        "--ac-border": border,
        "--ac-accent": accent,
        "--ac-radius": `${radius}px`,
        ...props.font,
    } as React.CSSProperties
    return (
        <section
            className="ac"
            aria-label="Audio catalog"
            style={{ ...cssVars, ...props.style, paddingBottom: 40 + Math.max(0, props.bottomSpace ?? 72) }}
        >
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <audio
                ref={audio}
                preload="none"
                onPlay={() => {
                    setPlaying(true)
                    setLoading(false)
                    window.dispatchEvent(
                        new CustomEvent("styledframe-audio-playing", {
                            detail: owner,
                        })
                    )
                }}
                onPause={() => {
                    setPlaying(false)
                    setLoading(false)
                }}
                onWaiting={() => setLoading(true)}
                onPlaying={() => setLoading(false)}
                onTimeUpdate={() => setTime(audio.current?.currentTime || 0)}
                onLoadedMetadata={() =>
                    setDuration(
                        Number.isFinite(audio.current?.duration)
                            ? audio.current!.duration
                            : 0
                    )
                }
                onError={() => {
                    setPlaying(false)
                    setLoading(false)
                    setError(
                        "Audio unavailable. Check the file URL, hosting permissions and format."
                    )
                }}
                onEnded={() => {
                    setPlaying(false)
                    setLoading(false)
                    if (autoNext) step(1)
                }}
            />
            {source === "cms" && (
                <div className="ac-source" aria-hidden="true">
                    {props.cmsContent}
                </div>
            )}
            <header className="ac-header">
                <div>
                    <div className="ac-eyebrow">
                        <span />
                        {eyebrow}
                    </div>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
                <div className="ac-edition">
                    SOUND COLLECTION
                    <span>{String(tracks.length).padStart(2, "0")} TRACKS</span>
                </div>
            </header>
            <div className="ac-toolbar">
                <label className="ac-search">
                    <Icon name="search" />
                    <input
                        aria-label="Search tracks"
                        placeholder="Search sounds, moods, artists…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <button
                            aria-label="Clear search"
                            onClick={() => setQuery("")}
                        >
                            ×
                        </button>
                    )}
                </label>
                <label className="ac-sort">
                    Sort by{" "}
                    <select
                        aria-label="Sort tracks"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="curated">Curated</option>
                        <option value="title">Title A–Z</option>
                        <option value="bpm">BPM: low to high</option>
                    </select>
                </label>
            </div>
            <div className="ac-filterbar">
                <div
                    className="ac-filters"
                    role="group"
                    aria-label="Track categories"
                >
                    {categories.map((c) => (
                        <button
                            key={c}
                            aria-pressed={c === category}
                            className={c === category ? "is-active" : ""}
                            onClick={() => setCategory(c)}
                        >
                            {c}
                            <span>
                                {c === "All"
                                    ? tracks.length
                                    : tracks.filter((t) => t.category === c)
                                          .length}
                            </span>
                        </button>
                    ))}
                </div>
                <span className="ac-count" role="status">
                    {visible.length} {visible.length === 1 ? "sound" : "sounds"}
                </span>
            </div>
            <div className="ac-player" style={{ position: props.stickyPlayer === false ? "relative" : "sticky", top: 16, zIndex: 5, marginBottom: 24 }} aria-label="Audio player">
                <div className="ac-now">
                    {active ? (
                        <Cover track={active} small />
                    ) : (
                        <div className="ac-placeholder">
                            <Icon name="note" />
                        </div>
                    )}
                    <div>
                        <strong>{active?.title || "Pick a sound"}</strong>
                        <span>
                            {active?.artist || "Your next idea starts here"}
                        </span>
                    </div>
                </div>
                <div className="ac-transport">
                    <div className="ac-controls">
                        <button
                            aria-label="Previous track"
                            onClick={() => step(-1)}
                            disabled={!visible.length}
                        >
                            <Icon name="prev" size={16} />
                        </button>
                        <button
                            className="ac-mainplay"
                            aria-label={playing ? "Pause audio" : "Play audio"}
                            disabled={!tracks.length}
                            onClick={() => toggle()}
                        >
                            <Icon name={playing ? "pause" : "play"} size={20} />
                        </button>
                        <button
                            aria-label="Next track"
                            onClick={() => step(1)}
                            disabled={!visible.length}
                        >
                            <Icon name="next" size={16} />
                        </button>
                        <span className="ac-loading" role="status">
                            {loading ? "Loading…" : ""}
                        </span>
                    </div>
                    <div className="ac-progress">
                        <span>{formatTime(time)}</span>
                        <input
                            aria-label="Seek audio"
                            type="range"
                            min={0}
                            max={duration || 1}
                            step={0.1}
                            value={Math.min(time, duration || 1)}
                            disabled={!duration}
                            onChange={(e) => {
                                const n = Number(e.target.value)
                                if (audio.current && duration) {
                                    audio.current.currentTime = n
                                    setTime(n)
                                }
                            }}
                        />
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
                <label className="ac-volume">
                    <Icon name="volume" size={17} />
                    <input
                        aria-label="Volume"
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                    />
                </label>
            </div>
            <div className="ac-columns" aria-hidden="true">
                <span>TRACK / ARTIST</span>
                <span>CATEGORY</span>
                <span>{showBpm ? "BPM" : ""}</span>
                <span>{showKey ? "KEY" : ""}</span>
                <span>TIME</span>
                <span />
            </div>
            <div className="ac-list" role="list" aria-label="Tracks">
                {visible.map((t, i) => (
                    <div
                        key={t.id}
                        role="listitem"
                        className={`ac-row ${active?.id === t.id ? "is-selected" : ""}`}
                    >
                        <div className="ac-track">
                            <span className="ac-index">
                                {String(i + 1).padStart(2, "0")}
                            </span>
                            <Cover track={t} />
                            <button
                                className="ac-play"
                                aria-label={`${active?.id === t.id && playing ? "Pause" : "Play"} ${t.title}`}
                                aria-pressed={active?.id === t.id && playing}
                                onClick={() => toggle(t)}
                            >
                                <Icon
                                    name={
                                        active?.id === t.id && playing
                                            ? "pause"
                                            : "play"
                                    }
                                    size={16}
                                />
                            </button>
                            <div className="ac-tracktext">
                                <strong>
                                    {t.title}
                                    {active?.id === t.id && playing && (
                                        <span
                                            className="ac-live"
                                            aria-label="Playing"
                                        >
                                            ▂▆▃
                                        </span>
                                    )}
                                </strong>
                                <span>
                                    {t.artist || t.tags || "Independent artist"}
                                </span>
                                <span className="ac-mobile-meta">{[t.category, showBpm && t.bpm ? t.bpm + " BPM" : "", showKey ? t.musicalKey : "", t.duration].filter(Boolean).join(" · ")}</span>
                            </div>
                        </div>
                        <div className="ac-category">
                            <span>{t.category}</span>
                        </div>
                        <span className="ac-bpm">
                            {showBpm && t.bpm ? t.bpm : ""}
                        </span>
                        <span className="ac-key">
                            {showKey ? t.musicalKey || "—" : ""}
                        </span>
                        <span className="ac-time">
                            {active?.id === t.id && duration
                                ? formatTime(duration)
                                : t.duration || "—"}
                        </span>
                        <div className="ac-actions">
                            {showActions && safeUrl(t.actionUrl) && (
                                <a
                                    aria-label={`${t.actionLabel || "Details"}: ${t.title}`}
                                    href={safeUrl(t.actionUrl)}
                                >
                                    {t.actionLabel || "Details"}
                                    <Icon name="arrow" size={14} />
                                </a>
                            )}
                            {showShare && (
                                <button
                                    aria-label={`Share ${t.title}`}
                                    onClick={() => share(t)}
                                >
                                    <Icon name="share" size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {!visible.length && (
                <div className="ac-empty">
                    <Icon name="note" size={30} />
                    <h2>
                        {tracks.length
                            ? "No sounds found"
                            : source === "cms"
                              ? "Connect your CMS tracks"
                              : "Your collection starts here"}
                    </h2>
                    <p>
                        {tracks.length
                            ? "Try another keyword or reset your filters."
                            : source === "cms"
                              ? "Place AudioCatalogTrack inside a Collection List, bind its fields, and connect the list to the CMS Content slot. Use the same Catalog ID."
                              : "Add a track with a unique ID and an audio file to get started."}
                    </p>
                    {tracks.length > 0 && (
                        <button
                            onClick={() => {
                                setQuery("")
                                setCategory("All")
                            }}
                        >
                            Reset filters
                        </button>
                    )}
                </div>
            )}
            <div className="ac-footnote">
                <span>CURATED FOR LISTENING. MADE FOR CREATING.</span>
                <span>
                    {source === "manual" &&
                    tracks.some((t) => /^demo:/.test(t.audio || ""))
                        ? "Original 8-second demo clips"
                        : "Preview before you choose"}
                </span>
            </div>
            {error && (
                <div className="ac-error" role="alert">
                    {error}
                    <button
                        onClick={() => {
                            setError("")
                            toggle()
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}
            <div className="ac-notice" role="status">
                {notice}
            </div>
            {shareFallback && (
                <label className="ac-share-fallback">
                    Track link
                    <input
                        aria-label="Track share link"
                        readOnly
                        value={shareFallback}
                        onFocus={(e) => e.target.select()}
                    />
                    <button onClick={() => setShareFallback("")}>Close</button>
                </label>
            )}
        </section>
    )
}

const styles = `
.ac{box-sizing:border-box;width:100%;min-width:0;padding:40px;background:var(--ac-bg);color:var(--ac-fg);font-family:Inter,Arial,sans-serif;font-size:14px;border-radius:var(--ac-radius);container-type:inline-size;position:relative;color-scheme:dark}
.ac *{box-sizing:border-box}.ac button,.ac input,.ac select{font:inherit}.ac button,.ac a,.ac input,.ac select{-webkit-tap-highlight-color:transparent}.ac button{cursor:pointer}.ac button:disabled{opacity:.35;cursor:default}.ac button:focus-visible,.ac a:focus-visible,.ac input:focus-visible,.ac select:focus-visible{outline:2px solid var(--ac-accent);outline-offset:4px}.ac button{color:inherit;background:none;border:0}.ac a{color:inherit;text-decoration:none}.ac-source{position:absolute;inset:0 auto auto 0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}.ac-header{display:flex;justify-content:space-between;gap:32px;padding-bottom:38px;border-bottom:1px solid var(--ac-border)}.ac-eyebrow{display:flex;align-items:center;gap:9px;font-size:10px;letter-spacing:2px;color:var(--ac-muted);font-weight:600}.ac-eyebrow>span{width:6px;height:6px;background:var(--ac-accent);border-radius:50%}.ac h1{font-size:clamp(32px,4.6cqw,58px);letter-spacing:-2px;font-weight:500;line-height:1.06;margin:22px 0 16px}.ac-header p{color:var(--ac-muted);font-size:14px;line-height:1.6;max-width:440px;margin:0}.ac-edition{font-size:9px;letter-spacing:1.7px;color:var(--ac-muted);text-align:right;white-space:nowrap;padding-top:4px}.ac-edition span{display:block;font-size:13px;color:var(--ac-fg);letter-spacing:1px;margin-top:12px}.ac-toolbar{display:flex;align-items:center;gap:24px;padding:24px 0 20px}.ac-search{display:flex;align-items:center;gap:12px;flex:1;padding:12px 16px;border:1px solid var(--ac-border);border-radius:8px;color:var(--ac-muted);min-width:0;background:var(--ac-surface)}.ac-search input{background:transparent;border:0;outline:none;color:var(--ac-fg);width:100%;min-width:0;font-size:13px}.ac input::placeholder{color:var(--ac-muted);opacity:1}.ac-search button{padding:0 4px;font-size:20px}.ac-sort{display:flex;gap:8px;align-items:center;color:var(--ac-muted);font-size:11px}.ac-sort select{background:var(--ac-bg);color:var(--ac-fg);border:0;padding:8px 4px;max-width:155px}.ac-filterbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:24px}.ac-filters{display:flex;flex-wrap:wrap;gap:8px}.ac-filters button{font-size:11px;border:1px solid var(--ac-border);border-radius:6px;padding:9px 12px;white-space:nowrap}.ac-filters button span{font-size:9px;margin-left:10px;opacity:.65}.ac-filters button.is-active{background:var(--ac-accent);border-color:var(--ac-accent);color:#15200b}.ac-count{color:var(--ac-muted);font-size:11px;white-space:nowrap}.ac-columns,.ac-row{display:grid;grid-template-columns:minmax(220px,2.5fr) minmax(85px,1fr) 45px 75px 45px 85px;gap:12px;align-items:center}.ac-columns{padding:0 12px 14px;font-size:9px;letter-spacing:1px;color:var(--ac-muted);border-bottom:1px solid var(--ac-border)}.ac-row{padding:15px 12px;border-bottom:1px solid var(--ac-border);border-radius:8px;min-width:0}.ac-row.is-selected{background:var(--ac-surface)}.ac-row:hover{background:var(--ac-surface)}.ac-track{display:flex;align-items:center;gap:12px;min-width:0}.ac-index{font-size:10px;color:var(--ac-muted);width:17px;flex:none}.ac-cover{position:relative;overflow:hidden;width:44px;height:44px;border-radius:6px;flex:none}.ac-cover img{width:100%;height:100%;object-fit:cover}.ac-art-lines{position:absolute;inset:0;display:flex;gap:6px;align-items:center;justify-content:center;transform:rotate(-22deg)}.ac-art-lines i{width:10px;height:70px;border-radius:100%;border:1px solid #ffffff55}.ac-play{width:28px;height:32px;display:grid;place-items:center;flex:none;border-radius:5px}.ac-tracktext{min-width:0}.ac-tracktext strong{display:flex;gap:9px;align-items:center;font-size:13px;line-height:1.4;font-weight:500;overflow-wrap:anywhere}.ac-tracktext>span{display:block;color:var(--ac-muted);font-size:10px;line-height:1.5;margin-top:5px;overflow-wrap:anywhere}.ac-live{color:var(--ac-accent);white-space:nowrap;font-size:12px}.ac-category>span{font-size:9px;padding:5px 8px;border:1px solid var(--ac-border);border-radius:4px;display:inline-block;overflow-wrap:anywhere}.ac-bpm,.ac-key,.ac-time{font-size:10px;color:var(--ac-muted);font-variant-numeric:tabular-nums}.ac-actions{display:flex;justify-content:flex-end;gap:8px;align-items:center}.ac-actions button{padding:7px;display:grid;place-items:center;color:var(--ac-muted);border-radius:4px}.ac-actions a{display:flex;align-items:center;gap:4px;font-size:10px}.ac-footnote{padding:22px 0 26px;display:flex;justify-content:space-between;gap:16px;font-size:8px;letter-spacing:1px;color:var(--ac-muted)}.ac-footnote>span:last-child{letter-spacing:0;font-size:10px}.ac-player{display:grid;grid-template-columns:minmax(160px,1fr) minmax(200px,1.5fr) 110px;align-items:center;gap:30px;border:1px solid var(--ac-border);border-radius:12px;padding:18px 20px;background:var(--ac-surface)}.ac-now{display:flex;gap:12px;align-items:center;min-width:0}.ac-cover-small,.ac-placeholder{width:42px;height:42px;flex:none;border-radius:6px}.ac-placeholder{display:grid;place-items:center;background:var(--ac-bg);color:var(--ac-muted)}.ac-now>div:last-child{min-width:0}.ac-now strong{display:block;font-weight:500;font-size:12px;overflow-wrap:anywhere}.ac-now span{display:block;color:var(--ac-muted);font-size:10px;margin-top:6px;overflow-wrap:anywhere}.ac-controls{display:flex;justify-content:center;align-items:center;gap:20px;position:relative}.ac-controls button{display:grid;place-items:center;padding:5px;border-radius:6px}.ac-controls .ac-mainplay{background:var(--ac-accent);color:#15200b;border-radius:50%;width:36px;height:36px}.ac-progress{display:flex;gap:10px;align-items:center;margin-top:11px}.ac-progress span{font-size:9px;color:var(--ac-muted);font-variant-numeric:tabular-nums}.ac input[type=range]{accent-color:var(--ac-accent);min-width:0;width:100%;height:16px;cursor:pointer}.ac-volume{display:flex;gap:8px;align-items:center;color:var(--ac-muted)}.ac-loading{position:absolute;right:0;font-size:9px;color:var(--ac-muted)}.ac-empty{text-align:center;padding:50px 24px;color:var(--ac-muted)}.ac-empty>svg{color:var(--ac-accent)}.ac-empty h2{font-size:21px;color:var(--ac-fg);font-weight:500}.ac-empty p{font-size:13px;line-height:1.7;max-width:440px;margin:0 auto 15px}.ac-empty button{border:1px solid var(--ac-border);padding:10px 14px;border-radius:6px}.ac-error{font-size:12px;line-height:1.6;color:#ffb5a6;margin-top:14px}.ac-error button{color:var(--ac-fg);text-decoration:underline;margin-left:12px}.ac-notice{font-size:11px;color:var(--ac-accent);min-height:0;margin-top:8px}.ac-notice:empty{display:none}.ac-share-fallback{display:flex;align-items:center;gap:10px;font-size:11px;margin-top:12px}.ac-share-fallback input{min-width:0;flex:1;background:var(--ac-surface);border:1px solid var(--ac-border);padding:8px;color:var(--ac-fg)}
@container(max-width:850px){.ac-columns,.ac-row{grid-template-columns:minmax(200px,2fr) 85px 40px 65px 40px 35px;gap:8px}.ac-actions a{display:none}.ac-player{gap:16px;grid-template-columns:minmax(130px,1fr) minmax(180px,1.3fr)}.ac-volume{display:none}.ac-edition{display:none}}
@container(max-width:600px){.ac-header{padding-bottom:24px}.ac h1{letter-spacing:-1px;font-size:36px}.ac-toolbar{flex-direction:column;align-items:stretch;gap:10px}.ac-sort{justify-content:flex-end}.ac-columns{display:none}.ac-row{grid-template-columns:minmax(0,1fr) 35px;padding:14px 0;gap:8px}.ac-category,.ac-bpm,.ac-key,.ac-row>.ac-time{display:none}.ac-track{gap:9px}.ac-index{display:none}.ac-tracktext strong{font-size:13px}.ac-cover{width:38px;height:38px}.ac-filterbar{align-items:flex-start;flex-direction:column;margin-bottom:12px}.ac-filters{gap:6px}.ac-filters button{padding:8px 9px}.ac-footnote{flex-direction:column;gap:10px;line-height:1.5}.ac-player{grid-template-columns:1fr;padding:16px;gap:14px}.ac-now{justify-content:flex-start}.ac-controls{gap:25px}.ac-progress{margin-top:10px}.ac-tracktext>span{font-size:10px}.ac-loading{right:8px}.ac-share-fallback{flex-wrap:wrap}}
.ac .ac-mobile-meta{display:none}@container(max-width:600px){.ac .ac-mobile-meta{display:block;font-size:11px;line-height:1.6;margin-top:6px}.ac .ac-player{padding:12px;gap:10px}.ac .ac-now{gap:10px}.ac .ac-now .ac-cover{width:30px;height:30px}.ac .ac-transport{min-width:0}.ac .ac-track{gap:7px}.ac .ac-play{min-width:36px;min-height:44px}.ac .ac-actions a{display:flex}.ac .ac-row{grid-template-columns:minmax(0,1fr) auto}.ac .ac-actions{flex-direction:column;gap:3px}}
@media(prefers-reduced-motion:reduce){.ac *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
`

const string = (title: string, defaultValue = "") => ({
    type: ControlType.String as const,
    title,
    defaultValue,
})
const trackControls = {
    id: string("Track ID"),
    title: string("Title"),
    artist: string("Artist"),
    category: string("Category"),
    tags: string("Tags"),
    audio: {
        type: ControlType.File as const,
        title: "Audio",
        allowedFileTypes: ["mp3", "wav", "ogg", "m4a", "aac"],
    },
    audioUrl: string("Audio URL"),
    artwork: { type: ControlType.Image as const, title: "Artwork" },
    duration: string("Duration"),
    bpm: {
        type: ControlType.Number as const,
        title: "BPM",
        min: 0,
        max: 400,
        defaultValue: 0,
    },
    musicalKey: string("Key"),
    actionUrl: { type: ControlType.Link as const, title: "Action URL" },
    actionLabel: string("Action Label", "Details"),
    order: {
        type: ControlType.Number as const,
        title: "Order",
        defaultValue: 0,
    },
}
const { id: trackIdControl, ...adapterTrackControls } = trackControls
addPropertyControls(AudioCatalogTrack, {
    catalogId: string("Catalog ID", "audio-library"),
    trackId: trackIdControl,
    ...adapterTrackControls,
})
addPropertyControls(AudioCatalog, {
    catalogId: string("Catalog ID", "audio-library"),
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["manual", "cms"],
        optionTitles: ["Manual", "CMS"],
        defaultValue: "manual",
    },
    tracks: {
        type: ControlType.Array,
        title: "Tracks",
        control: { type: ControlType.Object, controls: trackControls },
        defaultValue: sampleTracks,
        hidden: (p) => p.source === "cms",
    },
    cmsContent: {
        type: ControlType.ComponentInstance,
        title: "CMS Content",
        hidden: (p) => p.source !== "cms",
    },
    eyebrow: string("Eyebrow", "STUDIO / AUDIO LIBRARY"),
    title: string("Heading", "Find your next sound."),
    description: {
        ...string(
            "Description",
            "A collection of small sounds for big ideas. Browse, listen, make something."
        ),
        displayTextArea: true,
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#d5f87a",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#121513",
    },
    foreground: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#f2f3ec",
    },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#a5aaa1" },
    surface: {
        type: ControlType.Color,
        title: "Surface",
        defaultValue: "#1c211d",
    },
    border: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#353c33",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 64,
        defaultValue: 18,
    },
    font: { type: ControlType.Font, title: "Font", controls: "extended" },
    showBpm: {
        type: ControlType.Boolean,
        title: "Show BPM",
        defaultValue: true,
    },
    showKey: {
        type: ControlType.Boolean,
        title: "Show Key",
        defaultValue: true,
    },
    showActions: {
        type: ControlType.Boolean,
        title: "Actions",
        defaultValue: true,
    },
    showShare: {
        type: ControlType.Boolean,
        title: "Sharing",
        defaultValue: true,
    },
    stickyPlayer: { type: ControlType.Boolean, title: "Sticky Player", defaultValue: true },
    bottomSpace: { type: ControlType.Number, title: "Bottom Space", defaultValue: 72, min: 0, max: 200 },
    autoNext: {
        type: ControlType.Boolean,
        title: "Auto Next",
        defaultValue: false,
    },
})
