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

import { motion } from "framer-motion"

const DEFAULT_COVER = "https://framerusercontent.com/images/Lnxh0fOwH4zC5sVgYDzsZvR9qX4.png"
const PREVIEW = 0.38
const PEAK_COUNT = 1200
const PLAY_EVENT = "ap-audio-play"
const EASE_CSS = "cubic-bezier(0.32, 0.72, 0, 1)"

type Img = { src?: string; srcSet?: string; alt?: string }
type Status = "loading" | "ready" | "error"
type Analysis = { peaks: number[]; duration: number; url?: string }

interface Props {
    audio?: string
    showCover: boolean
    cover?: Img
    title: string
    subtitle: string
    loop: boolean
    volume: number
    waveform?: { height?: number; barWidth?: number; gap?: number; radius?: number }
    colors?: {
        surface?: string
        panel?: string
        text?: string
        muted?: string
        bubble?: string
        wave?: string
        hover?: string
        played?: string
        buttonFill?: string
        buttonIcon?: string
    }
    radius: number
    titleFont?: React.CSSProperties
    textFont?: React.CSSProperties
    style?: React.CSSProperties
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const pad = (n: number) => String(n).padStart(2, "0")
function fmt(s: number) {
    if (!isFinite(s) || s < 0) s = 0
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    return h ? h + ":" + pad(m) + ":" + pad(sec) : m + ":" + pad(sec)
}

// ---------- Audio analysis ----------

const analysisCache = new Map<string, Promise<Analysis>>()
let demoCache: Promise<Analysis> | null = null

function offlineCtor(): any {
    if (typeof window === "undefined") return null
    return (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext || null
}

function computePeaks(buffer: AudioBuffer, count = PEAK_COUNT): number[] {
    const channels: Float32Array[] = []
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) channels.push(buffer.getChannelData(ch))
    const len = buffer.length
    const size = len / count
    const out: number[] = new Array(count).fill(0)
    let max = 0
    for (let i = 0; i < count; i++) {
        const start = Math.floor(i * size)
        const end = Math.min(len, Math.floor((i + 1) * size))
        const stride = Math.max(1, Math.floor((end - start) / 400))
        let peak = 0
        let sum = 0
        let n = 0
        for (let j = start; j < end; j += stride) {
            let s = 0
            for (let ch = 0; ch < channels.length; ch++) s += Math.abs(channels[ch][j])
            s /= channels.length || 1
            if (s > peak) peak = s
            sum += s * s
            n++
        }
        const v = n ? Math.sqrt(sum / n) * 0.7 + peak * 0.3 : 0
        out[i] = v
        if (v > max) max = v
    }
    return out.map((v) => (max > 0 ? Math.pow(v / max, 0.85) : 0))
}

function decode(ctx: any, data: ArrayBuffer): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
        try {
            const p = ctx.decodeAudioData(data, resolve, reject)
            if (p && typeof p.then === "function") p.then(resolve, reject)
        } catch (e) {
            reject(e)
        }
    })
}

function analyse(url: string): Promise<Analysis> {
    let p = analysisCache.get(url)
    if (!p) {
        p = (async () => {
            const Ctor = offlineCtor()
            if (!Ctor) throw new Error("Web Audio unavailable")
            const res = await fetch(url)
            if (!res.ok) throw new Error("HTTP " + res.status)
            const data = await res.arrayBuffer()
            const buffer = await decode(new Ctor(1, 1, 44100), data)
            return { peaks: computePeaks(buffer), duration: buffer.duration }
        })()
        p.catch(() => analysisCache.delete(url))
        analysisCache.set(url, p)
    }
    return p
}

function encodeWav(data: Float32Array, sampleRate: number): Blob {
    const n = data.length
    const ab = new ArrayBuffer(44 + n * 2)
    const v = new DataView(ab)
    const w = (o: number, s: string) => {
        for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i))
    }
    w(0, "RIFF")
    v.setUint32(4, 36 + n * 2, true)
    w(8, "WAVE")
    w(12, "fmt ")
    v.setUint32(16, 16, true)
    v.setUint16(20, 1, true)
    v.setUint16(22, 1, true)
    v.setUint32(24, sampleRate, true)
    v.setUint32(28, sampleRate * 2, true)
    v.setUint16(32, 2, true)
    v.setUint16(34, 16, true)
    w(36, "data")
    v.setUint32(40, n * 2, true)
    let o = 44
    for (let i = 0; i < n; i++, o += 2) {
        const s = clamp(data[i], -1, 1)
        v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
    return new Blob([ab], { type: "audio/wav" })
}

// Demo track rendered in the browser when no audio file is set
function getDemo(): Promise<Analysis> {
    if (!demoCache) {
        demoCache = (async () => {
            const Ctor = offlineCtor()
            if (!Ctor) throw new Error("Web Audio unavailable")
            const sr = 22050
            const dur = 32
            const ctx = new Ctor(1, sr * dur, sr)
            const tone = ctx.createBiquadFilter()
            tone.type = "lowpass"
            tone.frequency.value = 3400
            tone.connect(ctx.destination)
            const delay = ctx.createDelay(1)
            delay.delayTime.value = 0.375
            const feedback = ctx.createGain()
            feedback.gain.value = 0.28
            delay.connect(feedback)
            feedback.connect(delay)
            delay.connect(tone)
            const master = ctx.createGain()
            master.gain.value = 0.9
            master.connect(tone)
            master.connect(delay)
            const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)
            const intensity = (t: number) =>
                t < 6 ? 0.25 + (t / 6) * 0.25 : t < 12 ? 0.5 + ((t - 6) / 6) * 0.35 : t < 24 ? 0.85 + 0.15 * Math.sin(((t - 12) / 12) * Math.PI) : Math.max(0.08, 0.8 * (1 - (t - 24) / 8))
            const chords = [
                [57, 60, 64, 67],
                [53, 57, 60, 64],
                [48, 52, 55, 59],
                [55, 59, 62, 65],
            ]
            const bar = 2
            const env = (g: any, t: number, peak: number, attack: number, release: number) => {
                g.gain.setValueAtTime(0.0001, t)
                g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack)
                g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release)
            }
            for (let b = 0; b * bar < dur; b++) {
                const t0 = b * bar
                const chord = chords[b % 4]
                const amp = intensity(t0)
                for (const note of chord) {
                    const o = ctx.createOscillator()
                    o.type = "triangle"
                    o.frequency.value = midi(note - 12)
                    const g = ctx.createGain()
                    g.gain.setValueAtTime(0.0001, t0)
                    g.gain.linearRampToValueAtTime(0.045 * amp, t0 + 0.4)
                    g.gain.linearRampToValueAtTime(0.0001, t0 + bar + 0.3)
                    o.connect(g)
                    g.connect(master)
                    o.start(t0)
                    o.stop(t0 + bar + 0.35)
                }
                for (let i = 0; i < 8; i++) {
                    const t = t0 + (i * bar) / 8
                    const o = ctx.createOscillator()
                    o.type = "sine"
                    o.frequency.value = midi(chord[(i * 3) % 4] + (i % 4 === 3 ? 24 : 12))
                    const g = ctx.createGain()
                    env(g, t, (0.1 + (0.1 * ((i * 7) % 5)) / 5) * amp, 0.008, 0.34)
                    o.connect(g)
                    g.connect(master)
                    o.start(t)
                    o.stop(t + 0.4)
                }
                if (amp > 0.55) {
                    for (let k = 0; k < 4; k++) {
                        const t = t0 + (k * bar) / 4
                        const o = ctx.createOscillator()
                        o.type = "sine"
                        o.frequency.setValueAtTime(120, t)
                        o.frequency.exponentialRampToValueAtTime(42, t + 0.18)
                        const g = ctx.createGain()
                        env(g, t, 0.5 * amp, 0.005, 0.28)
                        o.connect(g)
                        g.connect(master)
                        o.start(t)
                        o.stop(t + 0.32)
                    }
                }
            }
            const buffer: AudioBuffer = await new Promise((resolve, reject) => {
                ctx.oncomplete = (e: any) => resolve(e.renderedBuffer)
                const r = ctx.startRendering()
                if (r && typeof r.then === "function") r.then(resolve, reject)
            })
            const data = buffer.getChannelData(0)
            let max = 0
            for (let i = 0; i < data.length; i++) max = Math.max(max, Math.abs(data[i]))
            const k = max > 0 ? 0.89 / max : 1
            for (let i = 0; i < data.length; i++) data[i] *= k
            const url = URL.createObjectURL(encodeWav(data, sr))
            return { url, peaks: computePeaks(buffer), duration: buffer.duration }
        })()
        demoCache.catch(() => {
            demoCache = null
        })
    }
    return demoCache
}

// ---------- Icons ----------

const PlayIcon = () => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7 4.8v14.4c0 .9 1 1.4 1.7.9l11-7.2c.7-.4.7-1.4 0-1.8l-11-7.2C8 3.4 7 3.9 7 4.8z" />
    </svg>
)
const PauseIcon = () => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <rect x="6" y="4.5" width="4" height="15" rx="1.2" />
        <rect x="14" y="4.5" width="4" height="15" rx="1.2" />
    </svg>
)
const Spinner = () => (
    <svg className="ap-spin" width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.2} strokeWidth={2.5} />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
)
const VolumeIcon = ({ level }: { level: number }) => (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
        <path d="M4 9.5v5c0 .3.2.5.5.5H8l4.2 3.6c.3.3.8 0 .8-.4V5.8c0-.4-.5-.7-.8-.4L8 9H4.5c-.3 0-.5.2-.5.5z" fill="currentColor" stroke="none" />
        {level <= 0 ? <path d="M17 9.5l5 5M22 9.5l-5 5" /> : level < 0.5 ? <path d="M16.5 9a4 4 0 0 1 0 6" /> : <path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" />}
    </svg>
)

const reset: React.CSSProperties = {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "inherit",
    padding: 0,
    margin: 0,
    font: "inherit",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
}

const BarLayer = React.memo(function BarLayer(props: { values: number[]; color: string; barW: number; height: number; radius: number; pulse: boolean }) {
    const { values, color, barW, height, radius, pulse } = props
    return (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {values.map((v, i) => (
                <div
                    key={i}
                    className={pulse ? "ap-pulse" : undefined}
                    style={{
                        flex: "0 0 " + barW + "px",
                        height: Math.max(Math.max(2, barW), v * height),
                        borderRadius: radius,
                        background: color,
                        transition: "height 0.6s " + EASE_CSS + " " + Math.min(i * 5, 500) + "ms",
                        animationDelay: (i * 28) % 1400 + "ms",
                    }}
                />
            ))}
        </div>
    )
})

type Phase = "loading" | "morph" | "done"

// Dot-matrix grid while loading, morphing into solid waveform bars
const MatrixLayer = React.memo(function MatrixLayer(props: {
    values: number[]
    color: string
    loadColor: string
    barW: number
    gapW: number
    height: number
    radius: number
    morph: boolean
}) {
    const { values, color, loadColor, barW, gapW, height, radius, morph } = props
    const space = Math.max(1, gapW)
    const step = barW + space
    const rows = Math.max(3, Math.floor((height + space) / step))
    const gridH = rows * step - space
    const offset = (height - gridH) / 2
    const mid = (rows - 1) / 2
    const dotR = barW / 2
    const center = height / 2
    return (
        <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
            {values.map((v, i) => {
                const bh = Math.max(Math.max(2, barW), v * height)
                const top0 = (height - bh) / 2
                // Dots keep their order and gather inside the bar's final range
                const spread = rows > 1 ? Math.max(0, bh - barW) / (rows - 1) : 0
                const d = Math.min(i * 5, 600)
                const move = "0.7s " + EASE_CSS + " " + d + "ms"
                return (
                    <div key={i} style={{ position: "relative", flex: "0 0 " + barW + "px", height: "100%" }}>
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                opacity: morph ? 0 : 1,
                                transition: "opacity 0.45s ease " + (d + 180) + "ms",
                            }}
                        >
                            {Array.from({ length: rows }, (_, j) => (
                                <div
                                    key={j}
                                    className="ap-dot"
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        width: "100%",
                                        height: barW,
                                        borderRadius: dotR,
                                        background: loadColor,
                                        top: morph ? center - barW / 2 + (j - mid) * spread : offset + j * step,
                                        transition: "top " + move,
                                        animationDelay: -((i * 45 + Math.abs(j - mid) * 140) % 1800) + "ms",
                                    }}
                                />
                            ))}
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                width: "100%",
                                top: morph ? top0 : center - barW / 2,
                                height: morph ? bh : barW,
                                borderRadius: radius,
                                background: color,
                                opacity: morph ? 1 : 0,
                                transition: "top " + move + ", height " + move + ", opacity 0.4s ease " + (d + 120) + "ms",
                            }}
                        />
                    </div>
                )
            })}
        </div>
    )
})

/**
 * Audio player with a waveform generated from the audio file.
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 560
 */
export default function AudioPlayer(props: Props) {
    const { audio, showCover, cover, title, subtitle, loop, volume: initialVolume, radius, titleFont, textFont, style } = props
    const wave = { height: 64, barWidth: 3, gap: 2, radius: 2, ...props.waveform }
    const c = {
        surface: "rgb(217, 217, 217)",
        panel: "rgb(230, 230, 230)",
        text: "rgb(23, 23, 23)",
        muted: "rgba(23, 23, 23, 0.7)",
        wave: "rgba(23, 23, 23, 0.18)",
        hover: "rgba(23, 23, 23, 0.42)",
        played: "rgb(23, 23, 23)",
        buttonFill: "rgb(230, 230, 230)",
        buttonIcon: "rgb(23, 23, 23)",
        bubble: "rgb(230, 230, 230)",
        ...props.colors,
    }
    const isCanvas = RenderTarget.current() !== RenderTarget.preview
    const uid = "ap" + String(React.useId()).replace(/[^a-zA-Z0-9_-]/g, "")

    const rootRef = useRef<HTMLDivElement>(null)
    const waveRef = useRef<HTMLDivElement>(null)
    const volRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)
    const dragRef = useRef<{ x: number; start: number; moved: boolean } | null>(null)
    const volDrag = useRef(false)
    const pendingSeek = useRef<number | null>(null)
    const intentRef = useRef(false)

    const [src, setSrc] = useState("")
    const [status, setStatus] = useState<Status>("loading")
    const [peaks, setPeaks] = useState<number[] | null>(null)
    const [duration, setDuration] = useState(0)
    const [time, setTime] = useState(0)
    const [playing, setPlaying] = useState(false)
    const [waiting, setWaiting] = useState(false)
    const [intent, setIntentState] = useState(false)
    const [audioError, setAudioError] = useState(false)
    const [volume, setVolume] = useState(clamp(initialVolume ?? 0.8))
    const [muted, setMuted] = useState(false)
    const [hover, setHover] = useState<number | null>(null)
    const [drag, setDrag] = useState<number | null>(null)
    const [rootW, setRootW] = useState(560)
    const [waveW, setWaveW] = useState(480)
    const [phase, setPhase] = useState<Phase>("loading")

    useEffect(() => {
        if (status === "loading") {
            setPhase("loading")
            return
        }
        if (status === "error") {
            setPhase("done")
            return
        }
        setPhase("morph")
        const t = setTimeout(() => setPhase("done"), 1500)
        return () => clearTimeout(t)
    }, [status])

    const setIntent = (v: boolean) => {
        intentRef.current = v
        setIntentState(v)
    }

    // Resolve the source and analyse its waveform
    useEffect(() => {
        let cancelled = false
        setStatus("loading")
        setPeaks(null)
        setAudioError(false)
        setTime(0)
        setDuration(0)
        setPlaying(false)
        setWaiting(false)
        setIntent(false)
        pendingSeek.current = null
        const done = (a: Analysis) => {
            if (cancelled) return
            if (a.url) setSrc(a.url)
            setPeaks(a.peaks)
            if (isFinite(a.duration) && a.duration > 0) setDuration((d) => d || a.duration)
            setStatus("ready")
        }
        const fail = () => {
            if (!cancelled) setStatus("error")
        }
        if (audio) {
            setSrc(audio)
            analyse(audio).then(done, fail)
        } else {
            setSrc("")
            getDemo().then(done, () => {
                if (cancelled) return
                setStatus("error")
                setAudioError(true)
            })
        }
        return () => {
            cancelled = true
        }
    }, [audio])

    useEffect(() => setVolume(clamp(initialVolume ?? 0.8)), [initialVolume])

    useEffect(() => {
        const a = audioRef.current
        if (!a) return
        a.volume = clamp(volume)
        a.muted = muted
    }, [volume, muted, src])

    // Smooth progress while playing
    useEffect(() => {
        if (!playing) return
        let raf = 0
        const tick = () => {
            const a = audioRef.current
            if (a && !dragRef.current) setTime(a.currentTime)
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [playing])

    // Only one player plays at a time
    useEffect(() => {
        if (typeof window === "undefined") return
        const onOther = (e: any) => {
            const a = audioRef.current
            if (e.detail !== uid && a && !a.paused) a.pause()
        }
        window.addEventListener(PLAY_EVENT, onOther)
        return () => window.removeEventListener(PLAY_EVENT, onOther)
    }, [uid])

    // Measure sizes
    useEffect(() => {
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const w = Math.round(entry.contentRect.width)
                if (!w) continue
                if (entry.target === rootRef.current) setRootW(w)
                if (entry.target === waveRef.current) setWaveW(w)
            }
        })
        if (rootRef.current) ro.observe(rootRef.current)
        if (waveRef.current) ro.observe(waveRef.current)
        return () => ro.disconnect()
    }, [])

    const play = useCallback(() => {
        if (isCanvas || audioError) return
        setIntent(true)
        const a = audioRef.current
        if (!a || !src) return
        const p = a.play()
        if (p && typeof p.catch === "function") p.catch(() => setIntent(false))
    }, [isCanvas, audioError, src])

    const pause = useCallback(() => {
        setIntent(false)
        const a = audioRef.current
        if (a) a.pause()
    }, [])

    const toggle = () => {
        const a = audioRef.current
        if (playing || (a && !a.paused)) pause()
        else if (intentRef.current) pause()
        else play()
    }

    const seek = (f: number) => {
        if (isCanvas) return
        const a = audioRef.current
        const d = duration || (a && isFinite(a.duration) ? a.duration : 0)
        if (!a || !d) {
            pendingSeek.current = clamp(f)
            return
        }
        const t = Math.min(clamp(f) * d, Math.max(0, d - 0.01))
        a.currentTime = t
        setTime(t)
    }

    const toggleMute = () => {
        if (muted || volume === 0) {
            setMuted(false)
            if (volume === 0) setVolume(0.6)
        } else setMuted(true)
    }

    // ----- Waveform interaction
    const d = duration
    const liveProgress = d > 0 ? clamp(time / d) : 0
    const progress = isCanvas ? PREVIEW : drag != null ? drag : liveProgress
    const shownTime = isCanvas ? PREVIEW * d : drag != null ? drag * d : time

    const fracAt = (x: number) => {
        const el = waveRef.current
        if (!el) return 0
        const r = el.getBoundingClientRect()
        return clamp((x - r.left) / Math.max(1, r.width))
    }

    const onWaveDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isCanvas || audioError || (e.pointerType === "mouse" && e.button !== 0)) return
        try {
            e.currentTarget.setPointerCapture(e.pointerId)
        } catch (_) {}
        const f = fracAt(e.clientX)
        dragRef.current = { x: e.clientX, start: progress, moved: false }
        setDrag(f)
        if (e.pointerType !== "mouse") setHover(f)
    }
    const onWaveMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isCanvas) return
        const f = fracAt(e.clientX)
        const s = dragRef.current
        if (e.pointerType === "mouse" || s) setHover(f)
        if (!s) return
        if (Math.abs(e.clientX - s.x) > 4) s.moved = true
        setDrag(f)
    }
    const onWaveUp = (e: React.PointerEvent<HTMLDivElement>) => {
        const s = dragRef.current
        if (!s) return
        dragRef.current = null
        const f = fracAt(e.clientX)
        setDrag(null)
        if (e.pointerType !== "mouse") setHover(null)
        if (!s.moved) {
            const w = waveRef.current ? waveRef.current.offsetWidth : 1
            if (playing && Math.abs(f - s.start) * w < 10) {
                pause()
                return
            }
            seek(f)
            if (!playing) play()
        } else seek(f)
    }
    const onWaveCancel = () => {
        dragRef.current = null
        setDrag(null)
        setHover(null)
    }

    const onWaveKey = (e: React.KeyboardEvent) => {
        const step = (s: number) => {
            if (d) seek((time + s) / d)
        }
        switch (e.key) {
            case "ArrowRight":
            case "ArrowUp":
                e.preventDefault()
                step(e.shiftKey ? 15 : 5)
                break
            case "ArrowLeft":
            case "ArrowDown":
                e.preventDefault()
                step(e.shiftKey ? -15 : -5)
                break
            case "PageUp":
                e.preventDefault()
                step(d * 0.1)
                break
            case "PageDown":
                e.preventDefault()
                step(-d * 0.1)
                break
            case "Home":
                e.preventDefault()
                seek(0)
                break
            case "End":
                e.preventDefault()
                seek(1)
                break
            case " ":
            case "Enter":
            case "k":
            case "K":
                e.preventDefault()
                toggle()
                break
            case "m":
            case "M":
                e.preventDefault()
                toggleMute()
                break
        }
    }

    // ----- Volume interaction
    const volAt = (x: number) => {
        const el = volRef.current
        if (!el) return volume
        const r = el.getBoundingClientRect()
        return clamp((x - r.left) / Math.max(1, r.width))
    }
    const setVol = (v: number) => {
        setVolume(clamp(v))
        setMuted(false)
    }
    const onVolKey = (e: React.KeyboardEvent) => {
        const cur = muted ? 0 : volume
        const map: Record<string, number> = { ArrowRight: 0.05, ArrowUp: 0.05, ArrowLeft: -0.05, ArrowDown: -0.05, PageUp: 0.2, PageDown: -0.2 }
        if (e.key in map) {
            e.preventDefault()
            setVol(cur + map[e.key])
        } else if (e.key === "Home") {
            e.preventDefault()
            setVol(0)
        } else if (e.key === "End") {
            e.preventDefault()
            setVol(1)
        } else if (e.key === "m" || e.key === "M") {
            e.preventDefault()
            toggleMute()
        }
    }

    // ----- Bars
    const barW = Math.max(1, wave.barWidth)
    const gapW = Math.max(0, wave.gap)
    const H = Math.max(16, wave.height)
    const count = Math.max(12, Math.floor((waveW + gapW) / (barW + gapW)))
    const skeleton = useMemo(() => Array.from({ length: count }, (_, i) => 0.16 + 0.22 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.113))), [count])
    const values = useMemo(() => {
        if (!peaks || !peaks.length) return skeleton
        const out: number[] = new Array(count)
        const per = peaks.length / count
        for (let i = 0; i < count; i++) {
            const s = Math.floor(i * per)
            const e = Math.max(s + 1, Math.floor((i + 1) * per))
            let m = 0
            let sum = 0
            let n = 0
            for (let j = s; j < e && j < peaks.length; j++) {
                m = Math.max(m, peaks[j])
                sum += peaks[j]
                n++
            }
            out[i] = m * 0.6 + (n ? sum / n : 0) * 0.4
        }
        return out
    }, [peaks, count, skeleton])

    const loadingWave = status === "loading"
    const effVolume = muted ? 0 : volume
    const compact = rootW < 440
    const coverSize = compact ? 52 : 64
    const innerRadius = Math.max(4, radius - 8)
    const loadingPlay = intent && (!playing || waiting) && !audioError
    const showPlayhead = isCanvas || playing || progress > 0 || drag != null
    const showBubble = hover != null && d > 0 && !isCanvas
    const coverImg = cover && cover.src ? cover : { src: DEFAULT_COVER, srcSet: undefined, alt: "" }
    const fontFamily = (textFont && (textFont as any).fontFamily) || "Inter, system-ui, sans-serif"
    const statusText = audioError
        ? "Couldn’t load audio"
        : status === "loading"
          ? ""
          : status === "error"
            ? "Waveform unavailable"
            : intent && waiting
              ? "Buffering…"
              : ""

    const css =
        "[data-ap='" + uid + "'] .ap-focus:focus-visible{outline:2px solid " + c.played + ";outline-offset:3px}" +
        "@keyframes ap-pulse{0%,100%{opacity:.35}50%{opacity:1}}" +
        "@keyframes ap-dot{0%,100%{opacity:.18}45%{opacity:1}}" +
        "[data-ap='" + uid + "'] .ap-dot{animation:ap-dot 1.8s ease-in-out infinite}" +
        "@keyframes ap-spin{to{transform:rotate(360deg)}}" +
        "@keyframes ap-eq{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}" +
        "[data-ap='" + uid + "'] .ap-pulse{animation:ap-pulse 1.4s ease-in-out infinite}" +
        "[data-ap='" + uid + "'] .ap-spin{animation:ap-spin .8s linear infinite;transform-origin:50% 50%}" +
        "[data-ap='" + uid + "'] .ap-eq{animation:ap-eq .9s ease-in-out infinite;transform-origin:50% 100%}" +
        "@media (prefers-reduced-motion: reduce){[data-ap='" + uid + "'] .ap-pulse,[data-ap='" + uid + "'] .ap-eq,[data-ap='" + uid + "'] .ap-dot{animation:none;opacity:.5}}"

    const timeStyle: React.CSSProperties = {
        ...textFont,
        fontSize: 13,
        lineHeight: "1em",
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
    }

    return (
        <div
            ref={rootRef}
            data-ap={uid}
            role="group"
            aria-label={title ? "Audio player: " + title : "Audio player"}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 8,
                boxSizing: "border-box",
                background: c.surface,
                borderRadius: radius,
                color: c.text,
                fontFamily,
                minWidth: 280,
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <style>{css}</style>
            <audio
                ref={audioRef}
                src={src || undefined}
                preload="metadata"
                loop={loop}
                onLoadedMetadata={(e) => {
                    const a = e.currentTarget
                    if (isFinite(a.duration) && a.duration > 0) setDuration(a.duration)
                    a.volume = clamp(volume)
                    a.muted = muted
                    if (pendingSeek.current != null && isFinite(a.duration)) {
                        a.currentTime = Math.min(pendingSeek.current * a.duration, Math.max(0, a.duration - 0.01))
                        setTime(a.currentTime)
                        pendingSeek.current = null
                    }
                    if (intentRef.current && a.paused && !isCanvas) a.play().catch(() => setIntent(false))
                }}
                onDurationChange={(e) => {
                    const v = e.currentTarget.duration
                    if (isFinite(v) && v > 0) setDuration(v)
                }}
                onPlay={() => {
                    setPlaying(true)
                    setIntent(true)
                    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: uid }))
                }}
                onPause={() => {
                    setPlaying(false)
                    setWaiting(false)
                    setIntent(false)
                }}
                onWaiting={() => setWaiting(true)}
                onPlaying={() => setWaiting(false)}
                onCanPlay={() => setWaiting(false)}
                onEnded={(e) => {
                    setPlaying(false)
                    setIntent(false)
                    setTime(e.currentTarget.currentTime)
                }}
                onTimeUpdate={(e) => {
                    if (!playing && !dragRef.current) setTime(e.currentTarget.currentTime)
                }}
                onError={() => {
                    if (!src) return
                    setAudioError(true)
                    setIntent(false)
                    setPlaying(false)
                }}
            />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 8 }}>
                {showCover && (
                    <div
                        style={{
                            position: "relative",
                            width: coverSize,
                            height: coverSize,
                            flexShrink: 0,
                            borderRadius: innerRadius,
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.04)",
                        }}
                    >
                        <img
                            src={coverImg.src}
                            srcSet={coverImg.srcSet}
                            alt={coverImg.alt || (title ? title + " cover" : "")}
                            draggable={false}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "center",
                                gap: 3,
                                paddingBottom: 10,
                                background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)",
                                opacity: playing && !waiting ? 1 : 0,
                                transition: "opacity 0.3s " + EASE_CSS,
                            }}
                        >
                            {[0, 1, 2].map((i) => (
                                <span
                                    key={i}
                                    className={playing && !waiting ? "ap-eq" : undefined}
                                    style={{ width: 3, height: 14, borderRadius: 2, background: "#FFFFFF", animationDelay: i * 0.18 + "s", transform: "scaleY(0.35)", transformOrigin: "50% 100%" }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div
                        style={{
                            fontSize: 16,
                            lineHeight: "1.3em",
                            letterSpacing: "-0.02em",
                            fontWeight: 600,
                            ...titleFont,
                            color: c.text,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {title}
                    </div>
                    {subtitle ? (
                        <div
                            style={{
                                fontSize: 14,
                                lineHeight: "1.4em",
                                ...textFont,
                                color: c.muted,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {subtitle}
                        </div>
                    ) : null}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <motion.button
                        className="ap-focus"
                        type="button"
                        aria-label={loadingPlay ? "Loading" : playing ? "Pause" : "Play"}
                        aria-busy={loadingPlay || undefined}
                        disabled={audioError}
                        onClick={toggle}
                        whileHover={audioError ? undefined : { scale: 1.04 }}
                        whileTap={audioError ? undefined : { scale: 0.92 }}
                        style={{
                            ...reset,
                            width: 48,
                            height: 48,
                            borderRadius: innerRadius,
                            background: c.buttonFill,
                            color: c.buttonIcon,
                            opacity: audioError ? 0.35 : 1,
                            cursor: audioError ? "not-allowed" : "pointer",
                        }}
                    >
                        {loadingPlay ? <Spinner /> : playing ? <PauseIcon /> : <PlayIcon />}
                    </motion.button>
                    <motion.button
                        className="ap-focus"
                        type="button"
                        aria-label={effVolume === 0 ? "Unmute" : "Mute"}
                        aria-pressed={effVolume === 0}
                        onClick={toggleMute}
                        initial={false}
                        animate={{ opacity: 0.7 }}
                        whileHover={{ opacity: 1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ ...reset, width: 36, height: 36, borderRadius: 18, color: c.text }}
                    >
                        <VolumeIcon level={effVolume} />
                    </motion.button>
                    {!compact && (
                        <div
                            ref={volRef}
                            className="ap-focus"
                            role="slider"
                            tabIndex={0}
                            aria-label="Volume"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(effVolume * 100)}
                            aria-valuetext={Math.round(effVolume * 100) + "%"}
                            onKeyDown={onVolKey}
                            onPointerDown={(e) => {
                                if (e.pointerType === "mouse" && e.button !== 0) return
                                try {
                                    e.currentTarget.setPointerCapture(e.pointerId)
                                } catch (_) {}
                                volDrag.current = true
                                setVol(volAt(e.clientX))
                            }}
                            onPointerMove={(e) => {
                                if (volDrag.current) setVol(volAt(e.clientX))
                            }}
                            onPointerUp={() => (volDrag.current = false)}
                            onPointerCancel={() => (volDrag.current = false)}
                            style={{ position: "relative", width: 80, height: 28, marginRight: 10, cursor: "pointer", touchAction: "none", borderRadius: 6 }}
                        >
                            <div style={{ position: "absolute", left: 0, right: 0, top: 12, height: 4, borderRadius: 2, background: c.wave }} />
                            <div style={{ position: "absolute", left: 0, top: 12, height: 4, width: effVolume * 100 + "%", borderRadius: 2, background: c.played }} />
                            <div
                                style={{
                                    position: "absolute",
                                    top: 8,
                                    left: "calc(" + effVolume * 100 + "% - 6px)",
                                    width: 12,
                                    height: 12,
                                    borderRadius: 6,
                                    background: c.played,
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Waveform panel */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    padding: "20px 16px 14px",
                    borderRadius: innerRadius,
                    background: c.panel,
                }}
            >
                <div
                    ref={waveRef}
                    className="ap-focus"
                    role="slider"
                    tabIndex={0}
                    aria-label={title ? "Seek " + title : "Seek"}
                    aria-valuemin={0}
                    aria-valuemax={Math.round(d)}
                    aria-valuenow={Math.round(shownTime)}
                    aria-valuetext={fmt(shownTime) + " of " + fmt(d)}
                    aria-disabled={audioError || undefined}
                    onKeyDown={onWaveKey}
                    onPointerDown={onWaveDown}
                    onPointerMove={onWaveMove}
                    onPointerUp={onWaveUp}
                    onPointerCancel={onWaveCancel}
                    onPointerLeave={(e) => {
                        if (e.pointerType === "mouse" && !dragRef.current) setHover(null)
                    }}
                    style={{
                        position: "relative",
                        height: H,
                        cursor: audioError ? "default" : "pointer",
                        touchAction: "pan-y",
                        borderRadius: 4,
                        opacity: status === "error" ? 0.5 : 1,
                    }}
                >
                    {phase === "done" ? (
                        <BarLayer values={values} color={c.wave} barW={barW} height={H} radius={wave.radius} pulse={false} />
                    ) : (
                        <MatrixLayer values={values} color={c.wave} loadColor={c.hover} barW={barW} gapW={gapW} height={H} radius={wave.radius} morph={phase === "morph"} />
                    )}
                    {phase === "done" && (
                        <>
                            <div style={{ position: "absolute", inset: 0, clipPath: "inset(0 " + (1 - (hover ?? 0)) * 100 + "% 0 0)", pointerEvents: "none" }}>
                                <BarLayer values={values} color={c.hover} barW={barW} height={H} radius={wave.radius} pulse={false} />
                            </div>
                            <div style={{ position: "absolute", inset: 0, clipPath: "inset(0 " + (1 - progress) * 100 + "% 0 0)", pointerEvents: "none" }}>
                                <BarLayer values={values} color={c.played} barW={barW} height={H} radius={wave.radius} pulse={false} />
                            </div>
                        </>
                    )}
                    {showPlayhead && phase === "done" && (
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                top: -6,
                                bottom: -6,
                                left: progress * 100 + "%",
                                width: 2,
                                marginLeft: -1,
                                borderRadius: 1,
                                background: c.played,
                                boxShadow: "0 0 0 2px " + c.surface,
                                pointerEvents: "none",
                            }}
                        />
                    )}
                    {showBubble && hover != null && (
                        <div
                            aria-hidden
                            style={{
                                position: "absolute",
                                bottom: "calc(100% + 10px)",
                                left: hover * 100 + "%",
                                transform: "translateX(-50%)",
                                padding: "5px 8px",
                                borderRadius: 8,
                                background: c.bubble,
                                color: c.text,
                                ...timeStyle,
                                fontSize: 12,
                                pointerEvents: "none",
                                zIndex: 3,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                            }}
                        >
                            {fmt(hover * d)}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <span aria-hidden style={{ ...timeStyle, color: c.text }}>
                        {fmt(shownTime)}
                    </span>
                    <span aria-live="polite" style={{ ...timeStyle, color: c.muted, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {statusText}
                    </span>
                    <span aria-hidden style={{ ...timeStyle, color: c.muted }}>
                        {d > 0 ? fmt(d) : "--:--"}
                    </span>
                </div>
            </div>
        </div>
    )
}

AudioPlayer.displayName = "Audio Player"

addPropertyControls(AudioPlayer, {
    audio: {
        type: ControlType.File,
        title: "Audio",
        allowedFileTypes: ["mp3", "wav", "m4a", "aac", "ogg", "oga", "flac", "webm"],
    },
    showCover: { type: ControlType.Boolean, title: "Cover", defaultValue: true },
    cover: { type: ControlType.ResponsiveImage, title: "Image", hidden: (p: any) => !p.showCover },
    title: { type: ControlType.String, title: "Title", defaultValue: "Low Tide" },
    subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "Maren Holt", placeholder: "Optional" },
    loop: { type: ControlType.Boolean, title: "Loop", defaultValue: false },
    volume: { type: ControlType.Number, title: "Volume", min: 0, max: 1, step: 0.05, defaultValue: 0.8 },
    waveform: {
        type: ControlType.Object,
        title: "Waveform",
        controls: {
            height: { type: ControlType.Number, title: "Height", min: 24, max: 200, step: 1, defaultValue: 64 },
            barWidth: { type: ControlType.Number, title: "Bar Width", min: 1, max: 12, step: 1, defaultValue: 3 },
            gap: { type: ControlType.Number, title: "Gap", min: 0, max: 12, step: 1, defaultValue: 2 },
            radius: { type: ControlType.Number, title: "Radius", min: 0, max: 6, step: 0.5, defaultValue: 2 },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            surface: { type: ControlType.Color, title: "Surface", defaultValue: "rgb(217, 217, 217)" },
            panel: { type: ControlType.Color, title: "Panel", defaultValue: "rgb(230, 230, 230)" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "rgb(23, 23, 23)" },
            muted: { type: ControlType.Color, title: "Muted", defaultValue: "rgba(23, 23, 23, 0.7)" },
            wave: { type: ControlType.Color, title: "Wave", defaultValue: "rgba(23, 23, 23, 0.18)" },
            hover: { type: ControlType.Color, title: "Hover", defaultValue: "rgba(23, 23, 23, 0.42)" },
            played: { type: ControlType.Color, title: "Played", defaultValue: "rgb(23, 23, 23)" },
            buttonFill: { type: ControlType.Color, title: "Button", defaultValue: "rgb(230, 230, 230)" },
            buttonIcon: { type: ControlType.Color, title: "Icon", defaultValue: "rgb(23, 23, 23)" },
            bubble: { type: ControlType.Color, title: "Bubble", defaultValue: "rgb(230, 230, 230)" },
        },
    },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 40, step: 1, defaultValue: 20 },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Semibold", fontSize: 16, lineHeight: "1.3em", letterSpacing: "-0.02em" },
    },
    textFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Regular", fontSize: 14, lineHeight: "1.4em", letterSpacing: "-0.01em" },
    },
})
