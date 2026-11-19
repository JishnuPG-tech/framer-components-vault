import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]
const KEY = "__vinylPlayer"
const SPIN = "@keyframes vinyl-spin{to{transform:rotate(360deg)}}"
const GROOVES =
    "repeating-radial-gradient(circle closest-side, rgba(255,255,255,.08) 0, rgba(255,255,255,.08) 1px, transparent 1px, transparent 4%)"

type Track = { title?: string; audio: string; cover?: { src: string } }

// One shared audio element lives on window, so music survives page changes
// and several discs on a page stay in sync.
type Player = {
    audio: HTMLAudioElement
    tracks: Track[]
    index: number
    src: string
    listeners: Set<() => void>
}

const emit = (p: Player) => p.listeners.forEach((l) => l())

function select(p: Player, i: number, play: boolean) {
    const n = p.tracks.length
    if (!n) return
    p.index = ((i % n) + n) % n
    p.src = p.tracks[p.index].audio
    p.audio.src = p.src
    if (play) p.audio.play().catch(() => {})
    emit(p)
}

function getPlayer(): Player | null {
    if (typeof window === "undefined") return null
    const w = window as any
    if (w[KEY]) return w[KEY]
    const audio = new Audio()
    audio.volume = 0.25
    audio.preload = "metadata"
    const p: Player = { audio, tracks: [], index: 0, src: "", listeners: new Set() }
    audio.addEventListener("play", () => emit(p))
    audio.addEventListener("pause", () => emit(p))
    audio.addEventListener("ended", () => select(p, p.index + 1, true))
    return (w[KEY] = p)
}

function setTracks(p: Player, tracks: Track[]) {
    p.tracks = tracks
    if (p.index >= tracks.length) p.index = 0
    const next = tracks[p.index]?.audio
    // Never swap the source under a playing track.
    if (next && next !== p.src && p.audio.paused) {
        p.src = next
        p.audio.src = next
    }
    emit(p)
}

const toggle = (p: Player) => {
    if (p.audio.paused) p.audio.play().catch(() => {})
    else p.audio.pause()
}
const skip = (p: Player) => select(p, p.index + 1, !p.audio.paused)

interface Props {
    discColor: string
    style?: React.CSSProperties
    [slot: string]: any
}

/**
 * @framerIntrinsicWidth 120
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function DiscPlayer(props: Props) {
    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()
    const player = isStatic ? null : getPlayer()
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)

    const subscribe = useCallback(
        (cb: () => void) => {
            player?.listeners.add(cb)
            return () => void player?.listeners.delete(cb)
        },
        [player]
    )
    const playing = useSyncExternalStore(subscribe, () => !!player && !player.audio.paused, () => false)
    const index = useSyncExternalStore(subscribe, () => player?.index ?? 0, () => 0)

    const deps = SLOTS.flatMap((i) => [props[`track${i}Title`], props[`track${i}Audio`], props[`track${i}Cover`]?.src])
    const tracks = useMemo<Track[]>(
        () =>
            SLOTS.map((i) => ({
                title: props[`track${i}Title`],
                audio: props[`track${i}Audio`],
                cover: props[`track${i}Cover`],
            })).filter((t) => t.audio),
        deps
    )

    useEffect(() => {
        if (player) setTracks(player, tracks)
    }, [player, tracks])

    const active = tracks[Math.min(index, tracks.length - 1)]

    // Double-click arrives as two clicks: the first already toggled, so undo it, then skip.
    const onClick = (e: React.MouseEvent) => {
        if (!player) return
        if (e.detail > 0 && e.detail % 2 === 0) {
            toggle(player)
            skip(player)
        } else toggle(player)
    }
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (!player) return
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            toggle(player)
        } else if (e.key === "ArrowRight") skip(player)
    }

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible", ...props.style }}>
            <style>{SPIN}</style>
            <AnimatePresence>
                {(hovered || focused) && active && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{
                            position: "absolute",
                            bottom: "115%",
                            left: "50%",
                            x: "-50%",
                            background: "rgba(15,15,15,.85)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid rgba(255,255,255,.08)",
                            borderRadius: 12,
                            padding: "10px 14px",
                            whiteSpace: "nowrap",
                            color: "#fff",
                            zIndex: 9999,
                            pointerEvents: "none",
                        }}
                    >
                        <div style={{ opacity: 0.6, fontSize: 11, marginBottom: 2 }}>Now Playing</div>
                        <div style={{ fontSize: 13 }}>{active.title || "Unknown Track"}</div>
                        <div style={{ opacity: 0.45, fontSize: 10, marginTop: 4 }}>Double-click for next track</div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                role="button"
                tabIndex={0}
                aria-label={`${playing ? "Pause" : "Play"}${active?.title ? ": " + active.title : ""}`}
                aria-pressed={playing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={onClick}
                onKeyDown={onKeyDown}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onFocus={(e) => setFocused(e.currentTarget.matches(":focus-visible"))}
                onBlur={() => setFocused(false)}
                style={{ position: "relative", width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", cursor: "pointer" }}
            >
                {/* Spinning layer: pausing keeps the angle, so resuming never jumps. */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: props.discColor || "#111111",
                        backgroundImage: active?.cover ? `${GROOVES}, url("${active.cover.src}")` : GROOVES,
                        backgroundSize: "100% 100%, cover",
                        backgroundPosition: "center",
                        animation: "vinyl-spin 6s linear infinite",
                        animationPlayState: playing && !reduceMotion ? "running" : "paused",
                        willChange: playing ? "transform" : undefined,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "32%",
                            height: "32%",
                            transform: "translate(-50%, -50%)",
                            borderRadius: "50%",
                            background: "#E2B23E",
                            boxShadow: "0 0 0 2px rgba(0,0,0,.08), inset 0 0 8px rgba(0,0,0,.1)",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: "12%",
                                height: "12%",
                                transform: "translate(-50%, -50%)",
                                borderRadius: "50%",
                                background: "#555",
                            }}
                        />
                    </div>
                </div>
                {/* Gloss stays still while the record turns, like real light on vinyl. */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background:
                            "linear-gradient(135deg, rgba(255,255,255,.15), transparent 25%, transparent 75%, rgba(255,255,255,.05))",
                    }}
                />
            </motion.div>
        </div>
    )
}

const controls: Record<string, any> = {
    discColor: { type: ControlType.Color, title: "Disc", defaultValue: "#111111" },
}
for (const i of SLOTS) {
    controls[`track${i}Title`] = { type: ControlType.String, title: `T${i} Title` }
    controls[`track${i}Audio`] = { type: ControlType.File, title: `T${i} Audio`, allowedFileTypes: ["mp3", "wav", "ogg"] }
    controls[`track${i}Cover`] = { type: ControlType.ResponsiveImage, title: `T${i} Cover` }
}
addPropertyControls(DiscPlayer, controls)
