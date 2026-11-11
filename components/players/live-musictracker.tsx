// ─────────────────────────────────────────────────────────────────────────────
// MusicWidget.tsx — Last.fm "Now Playing / Last Played" Framer Component
//
// SETUP: Paste your Last.fm username and API key in the Framer property panel.
// Get a free API key at → https://www.last.fm/api/account/create
//
// ── What you can customize (via Framer property panel) ───────────────────────
//   • Last.fm Username   — your Last.fm profile username
//   • API Key            — your Last.fm API key (hidden for safety)
//   • Color              — accent color for the outer border & EQ bars
//   • Refresh (s)        — how often to poll Last.fm (min 10s)
//   • Vinyl Speed (s)    — rotation speed of the vinyl disc
//   • Marquee Speed (s)  — scrolling speed for long track titles
//
// ── What you should NOT touch unless you know what you're doing ──────────────
//   • fetchTrack()       — handles Last.fm API polling logic
//   • fetchDuration()    — handles MusicBrainz fallback for track duration
//   • useEffect blocks   — control polling interval and progress timer
//   • MOCK constant      — placeholder shown before credentials are entered
// ─────────────────────────────────────────────────────────────────────────────

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useState, useRef } from "react"

// ─── Track data shape — do not modify ────────────────────────────────────────

interface Track {
    title: string
    artist: string
    albumArt: string
    isNowPlaying: boolean
    url: string
    durationSec: number
    trackId: string
}
fmtTime
// Placeholder shown in Framer canvas before credentials are entered
// ✏️ You can change "Song Title" and "Artist Name" to preview the layout

const MOCK: Track = {
    title: "Song Title",
    artist: "Artist Name",
    albumArt: "",
    isNowPlaying: false,
    url: "https://www.last.fm",
    durationSec: 0,
    trackId: "mock",
}

// ─── Music icon (uses Bootstrap Icons CDN, injected via useEffect) ────────────

function MusicIcon({ color }: { color: string }) {
    return (
        <i
            className="bi bi-music-note-beamed"
            style={{
                fontSize: 16,
                color: color,
                flexShrink: 0,
                display: "block",
                lineHeight: 1,
            }}
        />
    )
}

// ─── Animated EQ bars — shown when a track is currently playing ───────────────

function EqBars({ color }: { color: string }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                height: 14,
                flexShrink: 0,
            }}
        >
            <style>{`
                @keyframes _eq1{0%,100%{height:3px}50%{height:13px}}
                @keyframes _eq2{0%,100%{height:10px}50%{height:3px}}
                @keyframes _eq3{0%,100%{height:6px}50%{height:13px}}
                @keyframes _eq4{0%,100%{height:12px}50%{height:4px}}
            `}</style>
            {(["_eq1", "_eq2", "_eq3", "_eq4"] as const).map((name, i) => (
                <div
                    key={i}
                    style={{
                        width: 2,
                        background: color,
                        borderRadius: 2,
                        animation: `${name} 0.85s ease-in-out ${i * 0.13}s infinite`,
                    }}
                />
            ))}
        </div>
    )
}

// ─── Static EQ bars — shown when track is paused / last played ───────────────

function EqStatic() {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                height: 14,
                flexShrink: 0,
            }}
        >
            {[4, 10, 6, 12].map((h, i) => (
                <div
                    key={i}
                    style={{
                        width: 2,
                        height: h,
                        background: "#3c3c3c",
                        borderRadius: 2,
                    }}
                />
            ))}
        </div>
    )
}

// ─── Vinyl disc — spins when isNowPlaying is true ────────────────────────────
// ✏️ Center hub color is driven by the accent color property in Framer panel

function VinylDisk({
    spinning,
    speed,
    color,
}: {
    spinning: boolean
    speed: number
    color: string
}) {
    const duration = Math.max(0.5, speed)
    return (
        <>
            <style>{`
                @keyframes _vspin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
            <div
                style={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    position: "relative",
                    flexShrink: 0,
                    overflow: "hidden",
                    background: "#111111",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.9)",
                    animation: spinning
                        ? `_vspin ${duration}s linear infinite`
                        : "none",
                    outline: spinning
                        ? "1.5px solid rgba(255,255,255,0.15)"
                        : "1.5px solid rgba(255,255,255,0.04)",
                    transition: "outline 0.4s ease",
                }}
            >
                {/* Vinyl groove rings */}
                {[8, 14, 20, 26, 32, 38, 44, 50, 56].map((inset, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            inset: `${inset}%`,
                            borderRadius: "50%",
                            border: "1px solid",
                            borderColor:
                                i % 2 === 0
                                    ? "rgba(255,255,255,0.09)"
                                    : "rgba(0,0,0,0.55)",
                            pointerEvents: "none",
                        }}
                    />
                ))}

                {/* Reflective sheen — conic gradient simulating vinyl gloss */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        background:
                            "conic-gradient(from 0deg, rgba(255,255,255,0.04) 0deg, transparent 60deg, rgba(255,255,255,0.06) 120deg, transparent 180deg, rgba(255,255,255,0.03) 240deg, transparent 300deg, rgba(255,255,255,0.04) 360deg)",
                        pointerEvents: "none",
                    }}
                />

                {/* Center label — color driven by accent color property */}
                <div
                    style={{
                        position: "absolute",
                        inset: "30%",
                        borderRadius: "50%",
                        background: color,
                        boxShadow: "inset 0 1px 4px rgba(0,0,0,0.5)",
                        pointerEvents: "none",
                    }}
                >
                    {/* Center spindle hole */}
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "#ffffff",
                        }}
                    />
                </div>
            </div>

            {/* Spinning indicator dot — only visible when spinning */}
            {spinning && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 2,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.5)",
                        boxShadow: "0 0 4px rgba(255,255,255,0.6)",
                        pointerEvents: "none",
                    }}
                />
            )}
        </>
    )
}

// ─── Utility: formats seconds → "mm:ss" ──────────────────────────────────────

function fmtTime(sec: number): string {
    const s = Math.max(0, Math.floor(sec))
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
}

//─── Utility: converts hex color to rgba with opacity ────────────────────────
// Converts any hex or rgb/rgba color string to rgba with given opacity
function toRgba(color: string, alpha: number): string {
    // Handle rgb(...) or rgba(...)
    const rgbMatch = color.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/)
    if (rgbMatch) {
        return `rgba(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]},${alpha})`
    }
    // Handle hex
    const h = color.replace("#", "")
    const full =
        h.length === 3
            ? h
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : h
    const r = parseInt(full.substring(0, 2), 16)
    const g = parseInt(full.substring(2, 4), 16)
    const b = parseInt(full.substring(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(29,185,84,${alpha})`
    return `rgba(${r},${g},${b},${alpha})`
}

// Fetches track duration from MusicBrainz as a fallback when Last.fm doesn't
// return one. Uses a cleaned query to avoid Lucene special-character errors.
// Do not modify unless MusicBrainz changes their API structure.

async function fetchDuration(artist: string, title: string): Promise<number> {
    try {
        const clean = (s: string) => s.replace(/[^\w\s]/g, " ").trim()
        const q = encodeURIComponent(
            `recording:"${clean(title)}" AND artist:"${clean(artist)}"`
        )
        const res = await fetch(
            `https://musicbrainz.org/ws/2/recording?query=${q}&limit=5&fmt=json`,
            { headers: { "User-Agent": "MusicWidget/1.0 (framer-component)" } }
        )
        if (!res.ok) return 0
        const data = await res.json()
        // Pick the first result that actually has a duration
        const match = data?.recordings?.find(
            (r: any) => r.length && r.length > 0
        )
        return match ? Math.round(match.length / 1000) : 0
    } catch {
        return 0
    }
}

// ─── Main Component — do not rename the function (Framer uses it) ────────────

export default function MusicWidget({
    username,
    apiKey,
    accentColor,
    refreshInterval,
    vinylSpeed,
    marqueeSpeed,
}: {
    username: string
    apiKey: string
    accentColor: string
    refreshInterval: number
    vinylSpeed: number
    marqueeSpeed: number
}) {
    const [track, setTrack] = useState<Track>(MOCK)
    const [imgError, setImgError] = useState(false)
    const [elapsedSec, setElapsedSec] = useState(0)

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const fetchRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const lastTrackIdRef = useRef<string>("mock")
    const durationRef = useRef<number>(0)

    // ── Injects Archivo font + Bootstrap Icons into the page head once ────────
    // ✏️ To change the font, replace the Google Fonts URL and update
    //    fontFamily throughout the JSX below

    useEffect(() => {
        const id = "archivo-font"
        if (!document.getElementById(id)) {
            const link = document.createElement("link")
            link.id = id
            link.rel = "stylesheet"
            link.href =
                "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap"
            document.head.appendChild(link)
        }
        const biId = "bootstrap-icons"
        if (!document.getElementById(biId)) {
            const bi = document.createElement("link")
            bi.id = biId
            bi.rel = "stylesheet"
            bi.href =
                "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
            document.head.appendChild(bi)
        }
    }, [])

    // ── Polls Last.fm for the latest track, updates state on change ──────────
    // Do not modify the fetch URL structure or the @attr.nowplaying check

    async function fetchTrack() {
        if (!username || !apiKey) {
            setTrack(MOCK)
            return
        }
        try {
            const res = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks` +
                    `&user=${encodeURIComponent(username)}` +
                    `&api_key=${encodeURIComponent(apiKey)}` +
                    `&format=json&limit=1`
            )
            if (!res.ok) throw new Error(`${res.status}`)
            const data = await res.json()
            const item = data?.recenttracks?.track?.[0]
            if (!item) return

            const images: { "#text": string; size: string }[] = item.image ?? []
            const art =
                images.find((i) => i.size === "extralarge")?.["#text"] ||
                images.find((i) => i.size === "large")?.["#text"] ||
                ""

            const nowPlaying = !!item["@attr"]?.nowplaying
            const title = item.name ?? "Unknown"
            const artist = item.artist?.["#text"] ?? "Unknown"

            const trackId = `${artist}__${title}`
            const isNewTrack = trackId !== lastTrackIdRef.current

            // Last.fm duration is often "0" for now-playing tracks,
            // so MusicBrainz is used as a fallback when that happens
            const lastfmDuration = parseInt(item.duration ?? "0", 10)

            if (isNewTrack) {
                if (lastfmDuration > 0) {
                    durationRef.current = lastfmDuration
                } else {
                    durationRef.current = await fetchDuration(artist, title)
                }
                setElapsedSec(0)
            }
            const durationSec = durationRef.current

            lastTrackIdRef.current = trackId

            setImgError(false)
            setTrack({
                title,
                artist,
                albumArt: art,
                isNowPlaying: nowPlaying,
                url: item.url ?? "https://last.fm",
                durationSec,
                trackId,
            })
        } catch (_) {
            /* keep current */
        }
    }

    useEffect(() => {
        fetchTrack()
        fetchRef.current = setInterval(
            fetchTrack,
            Math.max(refreshInterval, 10) * 1000
        )
        return () => {
            if (fetchRef.current) clearInterval(fetchRef.current)
        }
    }, [username, apiKey, refreshInterval])

    // ── Increments elapsed time every second while a track is playing ─────────
    // Resets automatically when the track changes via track.trackId dependency

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (!track.isNowPlaying) return
        timerRef.current = setInterval(() => {
            setElapsedSec((s) => {
                const max = track.durationSec > 0 ? track.durationSec : 9999
                return Math.min(s + 1, max)
            })
        }, 1000)
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [track.isNowPlaying, track.trackId])

    const totalSec = track.durationSec > 0 ? track.durationSec : 0
    const progress = totalSec > 0 ? Math.min(elapsedSec / totalSec, 1) : 0
    const art =
        !imgError &&
        track.albumArt &&
        !track.albumArt.includes("2a96cbd8b46e442fc41c2b86b821562f")
            ? track.albumArt
            : ""
    const accent = accentColor || "#1DB954"

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div
            style={{
                width: 320,
                height: 132,
                overflow: "visible",
                background: toRgba(accent, 0.25),
                borderRadius: 20,
                padding: 4,
                boxSizing: "border-box",
                fontFamily: "'Archivo', sans-serif",
                display: "flex",
            }}
        >
            <style>{`
                @keyframes _marquee {
                    0%   { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>

            {/* Inner dark card */}
            <div
                style={{
                    flex: 1,
                    background: "#171515",
                    borderRadius: 16,
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Ambient glow from album art */}
                {art && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 0,
                            backgroundImage: `url(${art})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            opacity: 0.08,
                            filter: "blur(24px)",
                            transform: "scale(1.3)",
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* Content row */}
                <div
                    style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        right: 12,
                        bottom: 12,
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 12,
                        zIndex: 1,
                    }}
                >
                    {/* Vinyl + Album art */}
                    <div
                        style={{
                            position: "relative",
                            width: 140,
                            height: 96,
                            flexShrink: 0,
                        }}
                    >
                        <div style={{ position: "absolute", left: 0, top: 3 }}>
                            <VinylDisk
                                spinning={track.isNowPlaying}
                                speed={vinylSpeed}
                                color={accent}
                            />
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                right: 0,
                                top: 0,
                                width: 96,
                                height: 96,
                                borderRadius: 6,
                                overflow: "hidden",
                                background: "#222",
                            }}
                        >
                            {art ? (
                                <img
                                    src={art}
                                    alt={track.title}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background:
                                            "linear-gradient(135deg,#2a2a2a,#1a1a1a)",
                                    }}
                                >
                                    <svg
                                        width="28"
                                        height="28"
                                        viewBox="0 0 24 24"
                                        fill="rgba(255,255,255,0.12)"
                                    >
                                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info column */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            height: 96,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            paddingRight: 32,
                        }}
                    >
                        {/* Icon + status label */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                }}
                            >
                                <MusicIcon color={accent} />
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: "#f5f5f5",
                                        whiteSpace: "nowrap",
                                        lineHeight: 1,
                                        fontFamily: "'Archivo', sans-serif",
                                    }}
                                >
                                    Music
                                </span>
                            </div>
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 400,
                                    color: "#717171",
                                    whiteSpace: "nowrap",
                                    lineHeight: 1,
                                    fontFamily: "'Archivo', sans-serif",
                                }}
                            >
                                {track.isNowPlaying
                                    ? "Now playing"
                                    : "Last played"}
                            </span>
                        </div>

                        {/* Track info + progress */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                }}
                            >
                                {/* Scrolling track title */}
                                <div
                                    style={{
                                        overflow: "hidden",
                                        width: "100%",
                                        position: "relative",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            gap: 48,
                                            animation:
                                                track.title.length > 18
                                                    ? `_marquee ${marqueeSpeed}s linear infinite`
                                                    : "none",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {/* Duplicate title for seamless loop */}
                                        {[0, 1].map((i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 500,
                                                    color: "#fff",
                                                    lineHeight: "14px",
                                                    fontFamily:
                                                        "'Archivo', sans-serif",
                                                    whiteSpace: "nowrap",
                                                    display:
                                                        track.title.length >
                                                            18 || i === 0
                                                            ? "inline"
                                                            : "none",
                                                }}
                                            >
                                                {track.title}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Artist name */}
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 10,
                                        fontWeight: 400,
                                        color: "#717171",
                                        lineHeight: "10px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        fontFamily: "'Archivo', sans-serif",
                                    }}
                                >
                                    {track.artist}
                                </p>
                            </div>

                            {/* Progress bar — fills based on elapsed / total duration */}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                }}
                            >
                                <div
                                    style={{
                                        height: 8,
                                        background: "#3c3c3c",
                                        borderRadius: 100,
                                        overflow: "hidden",
                                        padding: 2,
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "relative",
                                            height: 4,
                                            width: `${Math.round(progress * 100)}%`,
                                            minWidth: 0,
                                            transition: "width 1s linear",
                                        }}
                                    >
                                        {/* Base gradient fill */}
                                        <div
                                            style={{
                                                height: 4,
                                                width: "100%",
                                                background:
                                                    "linear-gradient(to right, #888888, #FFFFFF)",
                                                borderRadius: 100,
                                            }}
                                        />
                                        {/* Glow overlay for the progress fill */}
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                height: 4,
                                                width: "100%",
                                                background:
                                                    "linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.5))",
                                                borderRadius: 100,
                                                filter: "blur(2px)",
                                                mixBlendMode:
                                                    "plus-lighter" as any,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Elapsed / total time labels */}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        fontFamily: "'Archivo', sans-serif",
                                        fontSize: 10,
                                        fontWeight: 400,
                                        lineHeight: "8px",
                                    }}
                                >
                                    <span style={{ color: "#fff" }}>
                                        {fmtTime(elapsedSec)}
                                    </span>
                                    <span style={{ color: "#717171" }}>
                                        {/* Shows "--:--" until duration is fetched */}
                                        {totalSec > 0
                                            ? fmtTime(totalSec)
                                            : "--:--"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EQ bars — bottom-right corner, animated when playing */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 20,
                        right: 12,
                        zIndex: 2,
                    }}
                >
                    {track.isNowPlaying ? (
                        <EqBars color={accent} />
                    ) : (
                        <EqStatic />
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Framer Property Controls ────────────────────────────────────────────────
// ✏️ Safe to edit: titles, descriptions, min/max/step values, defaultValue
// ✋ Do not rename the prop keys (username, apiKey, etc.) — they must match
//    the component's function parameters above

MusicWidget.defaultProps = {
    username: "",
    apiKey: "",
    accentColor: "#1DB954",
    refreshInterval: 30,
    vinylSpeed: 4,
    marqueeSpeed: 8,
}

addPropertyControls(MusicWidget, {
    username: {
        type: ControlType.String,
        title: "Last.fm Username",
        placeholder: "your_username",
        description: "Your Last.fm profile username",
    },
    apiKey: {
        type: ControlType.String,
        title: "API Key",
        placeholder: "paste api key here",
        description: "From last.fm/api/account/create",
        obscured: true,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#1DB954",
        description: "Color of the outer border glow & EQ bars",
    },
    refreshInterval: {
        type: ControlType.Number,
        title: "Refresh (s)",
        min: 10,
        max: 300,
        step: 5,
        defaultValue: 30,
        description: "How often to poll Last.fm (seconds)",
    },
    vinylSpeed: {
        type: ControlType.Number,
        title: "Vinyl Speed (s)",
        min: 0.5,
        max: 20,
        step: 0.5,
        defaultValue: 4,
        description: "Seconds per full rotation. Lower = faster.",
    },
    marqueeSpeed: {
        type: ControlType.Number,
        title: "Marquee Speed (s)",
        min: 2,
        max: 30,
        step: 1,
        defaultValue: 8,
        description: "Seconds to scroll across once. Lower = faster.",
    },
})
