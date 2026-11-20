/**
 * Image Compare

 */

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
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent,
    type KeyboardEvent as ReactKeyboardEvent,
} from "react"

const DEFAULT_WIDTH = 270
const DEFAULT_HEIGHT = 360
const CORNER_DEFAULT = 20
const CORNER_MAX = 28
const POSITION_DEFAULT = 50
const SPRING_K = 620
const SPRING_DAMP = 44
const DT_MAX = 0.033
const EASE_BASE = 4e-4
const EASE_SNAP = 5e-4
const SETTLE_X = 6e-4
const SETTLE_V = 0.002
const BOW_CLAMP = 9
const FLICK_THRESHOLD = 0.0025
const KEY_STEP = 0.1
const LABEL_IN = 0.14
const LABEL_OUT = 0.86
const LABEL_FADE = 4
const FOCUS_RING = "#2231DD"
const LINE_DEFAULT = "#FFFFFF"
const HANDLE_DEFAULT = "#FFFFFF"
const ICON_DEFAULT = "#17181A"
const FONT_STACK =
    '"Inter", "Maison Neue", "MaisonNeue-Book", "Instrument Sans", "Helvetica Neue", Helvetica, Arial, sans-serif'
const BEFORE_SRC =
    "https://framerusercontent.com/images/6ddKptrwFP2UAXhpwnoxsVnSI.jpg"
const AFTER_SRC =
    "https://framerusercontent.com/images/pDxBWksqFvuurlqmLKsRCANKIU.jpg"

const PRESS_VOICE = [
    { hz: 168, ms: 95, gain: 0.028, wave: "sine" as const, cut: 480, atk: 14 },
]
const WHISK_VOICE = [
    {
        hz: 124,
        to: 65,
        ms: 130,
        gain: 0.067,
        wave: "sine" as const,
        cut: 560,
        atk: 50,
    },
]

type Voice = {
    hz: number
    to?: number
    ms: number
    gain: number
    wave: OscillatorType
    cut?: number
    atk: number
}

type ResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
    positionX?: number | string
    positionY?: number | string
}

type AudioBag = {
    ctx: AudioContext | null
    unlocked: boolean
}

type DragBag = {
    v: number
    t: number
    last: number
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function parseHex(hex: string): [number, number, number] | null {
    const n = hex.replace("#", "").trim()
    const s =
        n.length === 3
            ? n
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : n
    if (s.length !== 6) return null
    const r = parseInt(s.slice(0, 2), 16)
    const g = parseInt(s.slice(2, 4), 16)
    const b = parseInt(s.slice(4, 6), 16)
    if ([r, g, b].some((v) => Number.isNaN(v))) return null
    return [r, g, b]
}

function glowFrom(color: string) {
    const rgb = parseHex(color)
    if (!rgb) return "rgba(255, 255, 255, 0.5)"
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`
}

function canUseAudio() {
    return typeof window !== "undefined" && typeof AudioContext !== "undefined"
}

function unlockAudio(audio: AudioBag) {
    if (!canUseAudio()) return
    try {
        audio.ctx ??= new AudioContext()
        if (audio.ctx.state !== "running") audio.ctx.resume()
        if (!audio.unlocked && audio.ctx) {
            audio.unlocked = true
            const src = audio.ctx.createBufferSource()
            src.buffer = audio.ctx.createBuffer(1, 1, audio.ctx.sampleRate)
            src.connect(audio.ctx.destination)
            src.start(0)
        }
    } catch {
        // ignore
    }
}

function playVoice(audio: AudioBag, voice: Voice[]) {
    if (!canUseAudio()) return
    unlockAudio(audio)
    const ctx = audio.ctx
    if (!ctx || ctx.state !== "running") return
    const start = ctx.currentTime
    for (const note of voice) {
        const t0 = start
        const t1 = t0 + note.ms / 1000
        const osc = ctx.createOscillator()
        osc.type = note.wave
        osc.frequency.setValueAtTime(note.hz, t0)
        if (note.to !== undefined) {
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(note.to, 1e-4),
                t1
            )
        }
        const filter = ctx.createBiquadFilter()
        filter.type = "lowpass"
        if (note.cut) filter.frequency.value = note.cut
        const gain = ctx.createGain()
        const attack = Math.min(note.atk / 1000, (note.ms / 1000) * 0.6)
        gain.gain.setValueAtTime(1e-4, t0)
        gain.gain.exponentialRampToValueAtTime(note.gain, t0 + attack)
        gain.gain.exponentialRampToValueAtTime(1e-4, t1)
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t0)
        osc.stop(t1 + 0.02)
    }
}

function closeAudio(audio: AudioBag) {
    const ctx = audio.ctx
    audio.ctx = null
    audio.unlocked = false
    if (ctx && ctx.state !== "closed") {
        void ctx.close().catch(() => {
            // ignore
        })
    }
}

function imageSrc(image: ResponsiveImage | undefined, fallback: string) {
    const src = image?.src?.trim()
    return src || fallback
}

function objectPosition(image: ResponsiveImage | undefined) {
    if (!image) return undefined
    const x = image.positionX
    const y = image.positionY
    if (x === undefined && y === undefined) return undefined
    const px =
        x === undefined
            ? "50%"
            : typeof x === "number"
              ? `${x * 100}%`
              : String(x)
    const py =
        y === undefined
            ? "50%"
            : typeof y === "number"
              ? `${y * 100}%`
              : String(y)
    return `${px} ${py}`
}

export interface ImageCompareProps {
    before?: ResponsiveImage
    after?: ResponsiveImage
    position?: number
    showLabels?: boolean
    beforeLabel?: string
    afterLabel?: string
    corner?: number
    lineColor?: string
    handleColor?: string
    handleIcon?: string
    sound?: boolean
    style?: CSSProperties
}

/**
 * Drag the line to compare two pictures; flick it and it glides to the edge.
 */
// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight any
// @framerIntrinsicWidth 270
// @framerIntrinsicHeight 360
export default function ImageCompare(props: ImageCompareProps) {
    const isStatic = useIsStaticRenderer()

    const {
        before,
        after,
        position = POSITION_DEFAULT,
        showLabels = true,
        beforeLabel = "Before",
        afterLabel = "After",
        corner = CORNER_DEFAULT,
        lineColor = LINE_DEFAULT,
        handleColor = HANDLE_DEFAULT,
        handleIcon = ICON_DEFAULT,
        sound = true,
        style,
    } = props

    const initial = clamp(
        (Number.isFinite(position) ? position : POSITION_DEFAULT) / 100,
        0,
        1
    )
    const radius = clamp(
        Number.isFinite(corner) ? corner : CORNER_DEFAULT,
        0,
        CORNER_MAX
    )

    const [pos, setPos] = useState(initial)
    const [bow, setBow] = useState(0)
    const [held, setHeld] = useState(false)
    const [size, setSize] = useState({ w: DEFAULT_WIDTH, h: DEFAULT_HEIGHT })

    const rootRef = useRef<HTMLDivElement>(null)
    const posRef = useRef(initial)
    const targetRef = useRef<number | null>(null)
    const endsRef = useRef({ x: initial, v: 0 })
    const rafRef = useRef(0)
    const dragRef = useRef<DragBag | null>(null)
    const pointerIdRef = useRef<number | null>(null)
    const audioRef = useRef<AudioBag>({ ctx: null, unlocked: false })
    const soundRef = useRef(sound)
    const isStaticRef = useRef(isStatic)
    const sizeRef = useRef(size)
    soundRef.current = sound
    isStaticRef.current = isStatic
    sizeRef.current = size

    useEffect(() => {
        if (isStatic) return
        const next = clamp(
            (Number.isFinite(position) ? position : POSITION_DEFAULT) / 100,
            0,
            1
        )
        posRef.current = next
        targetRef.current = null
        endsRef.current = { x: next, v: 0 }
        setPos(next)
        setBow(0)
    }, [isStatic, position])

    useEffect(() => {
        if (isStatic) return
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const apply = () => {
            const rect = el.getBoundingClientRect()
            const w = rect.width || DEFAULT_WIDTH
            const h = rect.height || DEFAULT_HEIGHT
            setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
        }
        apply()
        const ro = new ResizeObserver(apply)
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        return () => {
            if (rafRef.current && typeof cancelAnimationFrame === "function") {
                cancelAnimationFrame(rafRef.current)
            }
            rafRef.current = 0
            dragRef.current = null
            const node = rootRef.current
            if (node && pointerIdRef.current != null) {
                try {
                    node.releasePointerCapture(pointerIdRef.current)
                } catch {
                    // ignore
                }
            }
            pointerIdRef.current = null
            closeAudio(audioRef.current)
        }
    }, [isStatic])

    const startLoop = () => {
        if (isStaticRef.current) return
        if (
            typeof window === "undefined" ||
            typeof requestAnimationFrame !== "function"
        )
            return
        if (rafRef.current) return
        let last = performance.now()
        const tick = (now: number) => {
            if (isStaticRef.current) {
                rafRef.current = 0
                return
            }
            const dt = Math.min(DT_MAX, (now - last) / 1000)
            last = now
            const target = targetRef.current
            if (target !== null) {
                posRef.current +=
                    (target - posRef.current) * (1 - EASE_BASE ** dt)
                if (Math.abs(target - posRef.current) < EASE_SNAP) {
                    posRef.current = target
                    targetRef.current = null
                }
            }
            const ends = endsRef.current
            ends.v +=
                ((posRef.current - ends.x) * SPRING_K - ends.v * SPRING_DAMP) *
                dt
            ends.x += ends.v * dt
            const width = sizeRef.current.w
            setPos(posRef.current)
            setBow(
                clamp(
                    (posRef.current - ends.x) * width * 0.5,
                    -BOW_CLAMP,
                    BOW_CLAMP
                )
            )
            if (
                targetRef.current === null &&
                Math.abs(posRef.current - ends.x) < SETTLE_X &&
                Math.abs(ends.v) < SETTLE_V
            ) {
                ends.x = posRef.current
                ends.v = 0
                setBow(0)
                rafRef.current = 0
                return
            }
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
    }

    const easeTo = (unit: number) => {
        if (isStaticRef.current) return
        targetRef.current = clamp(unit, 0, 1)
        startLoop()
    }

    const snapTo = (unit: number) => {
        if (isStaticRef.current) return
        const next = clamp(unit, 0, 1)
        targetRef.current = null
        posRef.current = next
        setPos(next)
        startLoop()
    }

    const unitFromClientX = (clientX: number) => {
        const el = rootRef.current
        if (!el) return posRef.current
        const rect = el.getBoundingClientRect()
        return clamp((clientX - rect.left) / rect.width, 0, 1)
    }

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        try {
            event.currentTarget.setPointerCapture(event.pointerId)
            pointerIdRef.current = event.pointerId
        } catch {
            // ignore
        }
        const unit = unitFromClientX(event.clientX)
        dragRef.current = { v: 0, t: performance.now(), last: unit }
        setHeld(true)
        easeTo(unit)
        if (soundRef.current) playVoice(audioRef.current, PRESS_VOICE)
    }

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current
        if (!drag) return
        const unit = unitFromClientX(event.clientX)
        const now = performance.now()
        drag.v = (unit - drag.last) / Math.max(1, now - drag.t)
        drag.t = now
        drag.last = unit
        snapTo(unit)
    }

    const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current
        dragRef.current = null
        setHeld(false)
        try {
            event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {
            // ignore
        }
        pointerIdRef.current = null
        if (drag && Math.abs(drag.v) > FLICK_THRESHOLD) {
            easeTo(+(drag.v > 0))
            if (soundRef.current) playVoice(audioRef.current, WHISK_VOICE)
        }
    }

    const onPointerCancel = () => {
        dragRef.current = null
        setHeld(false)
        pointerIdRef.current = null
    }

    const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault()
            easeTo(
                clamp((targetRef.current ?? posRef.current) - KEY_STEP, 0, 1)
            )
        }
        if (event.key === "ArrowRight") {
            event.preventDefault()
            easeTo(
                clamp((targetRef.current ?? posRef.current) + KEY_STEP, 0, 1)
            )
        }
    }

    const interactive = !isStatic
    const displayPos = isStatic ? initial : pos
    const displayBow = isStatic ? 0 : bow
    const width = size.w
    const height = size.h
    const knobX = displayPos * width
    const edgeX = knobX - displayBow
    const ctrlX = knobX + displayBow
    const linePath = `M ${edgeX.toFixed(2)} 0 Q ${ctrlX.toFixed(2)} ${height / 2} ${edgeX.toFixed(2)} ${height}`
    const clipPath = `path("M 0 0 L ${edgeX.toFixed(2)} 0 Q ${ctrlX.toFixed(2)} ${height / 2} ${edgeX.toFixed(2)} ${height} L 0 ${height} Z")`
    const beforeOpacity = clamp((displayPos - LABEL_IN) * LABEL_FADE, 0, 1)
    const afterOpacity = clamp((LABEL_OUT - displayPos) * LABEL_FADE, 0, 1)
    const beforeUrl = imageSrc(before, BEFORE_SRC)
    const afterUrl = imageSrc(after, AFTER_SRC)
    const beforePos = objectPosition(before)
    const afterPos = objectPosition(after)

    const imgStyle = (objectPos?: string): CSSProperties => ({
        objectFit: "cover",
        width: "100%",
        height: "100%",
        display: "block",
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        ...(objectPos ? { objectPosition: objectPos } : {}),
    })

    return (
        <div
            ref={interactive ? rootRef : undefined}
            className="icmp"
            data-held={interactive && held ? true : undefined}
            role="slider"
            tabIndex={interactive ? 0 : undefined}
            aria-label="Image compare"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(displayPos * 100)}
            aria-disabled={interactive ? undefined : true}
            style={{
                width: "100%",
                height: "100%",
                borderRadius: radius,
                touchAction: interactive ? "none" : "auto",
                cursor: interactive ? "ew-resize" : "default",
                userSelect: interactive ? "none" : undefined,
                WebkitUserSelect: interactive ? "none" : undefined,
                WebkitTapHighlightColor: interactive
                    ? "transparent"
                    : undefined,
                pointerEvents: interactive ? undefined : "none",
                background: ICON_DEFAULT,
                outline: "none",
                position: "relative",
                overflow: "hidden",
                ...style,
            }}
            onPointerDown={interactive ? onPointerDown : undefined}
            onPointerMove={interactive ? onPointerMove : undefined}
            onPointerUp={interactive ? onPointerUp : undefined}
            onPointerCancel={interactive ? onPointerCancel : undefined}
            onKeyDown={interactive ? onKeyDown : undefined}
        >
            <style>{`
                .icmp:focus { outline: none; }
                .icmp:focus-visible { box-shadow: 0 0 0 2px ${FOCUS_RING}; }
                .icmp-img { -webkit-user-drag: none; }
                .icmp-knob { transition: scale 0.22s cubic-bezier(0.24, 1.34, 0.38, 1); }
                .icmp:hover .icmp-knob { scale: 1.08; }
                .icmp[data-held] .icmp-knob { scale: 0.9; }
            `}</style>
            <img
                className="icmp-img icmp-after"
                src={afterUrl}
                srcSet={after?.srcSet}
                alt={after?.alt ?? ""}
                draggable={false}
                style={imgStyle(afterPos)}
            />
            <div
                className="icmp-before"
                style={{ position: "absolute", inset: 0, clipPath }}
            >
                <img
                    className="icmp-img"
                    src={beforeUrl}
                    srcSet={before?.srcSet}
                    alt={before?.alt ?? ""}
                    draggable={false}
                    style={imgStyle(beforePos)}
                />
            </div>
            {showLabels ? (
                <>
                    <span
                        className="icmp-tag"
                        style={{
                            opacity: beforeOpacity,
                            WebkitBackdropFilter: "blur(10px)",
                            backdropFilter: "blur(10px)",
                            color: "#fff",
                            fontFamily: FONT_STACK,
                            pointerEvents: "none",
                            letterSpacing: 0,
                            background: "#17181a5c",
                            borderRadius: 999,
                            padding: "4px 12px",
                            fontSize: 12,
                            fontWeight: 500,
                            position: "absolute",
                            top: 12,
                            left: 12,
                            lineHeight: 1.2,
                        }}
                    >
                        {beforeLabel}
                    </span>
                    <span
                        className="icmp-tag icmp-right"
                        style={{
                            opacity: afterOpacity,
                            WebkitBackdropFilter: "blur(10px)",
                            backdropFilter: "blur(10px)",
                            color: "#fff",
                            fontFamily: FONT_STACK,
                            pointerEvents: "none",
                            letterSpacing: 0,
                            background: "#17181a5c",
                            borderRadius: 999,
                            padding: "4px 12px",
                            fontSize: 12,
                            fontWeight: 500,
                            position: "absolute",
                            top: 12,
                            right: 12,
                            lineHeight: 1.2,
                        }}
                    >
                        {afterLabel}
                    </span>
                </>
            ) : null}
            <svg
                className="icmp-line"
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                aria-hidden="true"
                style={{
                    pointerEvents: "none",
                    filter: `drop-shadow(0 0 6px ${glowFrom(lineColor)})`,
                    position: "absolute",
                    inset: 0,
                    overflow: "visible",
                    width: "100%",
                    height: "100%",
                }}
            >
                <path
                    d={linePath}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={2}
                />
            </svg>
            <span
                className="icmp-grip"
                style={{
                    pointerEvents: "none",
                    width: 0,
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: knobX,
                }}
            >
                <span
                    className="icmp-knob"
                    style={{
                        background: handleColor,
                        width: 36,
                        height: 36,
                        color: handleIcon,
                        borderRadius: "50%",
                        placeItems: "center",
                        display: "grid",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        translate: "-50% -50%",
                        boxShadow: "0 2px 12px #17181a40",
                    }}
                >
                    <svg
                        width="16"
                        height="10"
                        viewBox="0 0 16 10"
                        aria-hidden="true"
                    >
                        <path
                            d="M5 1 1 5l4 4M11 1l4 4-4 4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </span>
        </div>
    )
}

addPropertyControls(ImageCompare, {
    before: {
        type: ControlType.ResponsiveImage,
        title: "Before",
    },
    after: {
        type: ControlType.ResponsiveImage,
        title: "After",
    },
    position: {
        type: ControlType.Number,
        title: "Position",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: POSITION_DEFAULT,
        displayStepper: true,
        description:
            "Where the divider starts. 0 shows only the after image; 100 shows only the before.",
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Labels",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    beforeLabel: {
        type: ControlType.String,
        title: "Before label",
        defaultValue: "Before",
        hidden(props: ImageCompareProps) {
            return props.showLabels === false
        },
    },
    afterLabel: {
        type: ControlType.String,
        title: "After label",
        defaultValue: "After",
        hidden(props: ImageCompareProps) {
            return props.showLabels === false
        },
    },
    corner: {
        type: ControlType.Number,
        title: "Corner",
        min: 0,
        max: CORNER_MAX,
        step: 1,
        unit: "px",
        defaultValue: CORNER_DEFAULT,
        displayStepper: true,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line",
        defaultValue: LINE_DEFAULT,
    },
    handleColor: {
        type: ControlType.Color,
        title: "Handle",
        defaultValue: HANDLE_DEFAULT,
    },
    handleIcon: {
        type: ControlType.Color,
        title: "Icon",
        defaultValue: ICON_DEFAULT,
    },
    sound: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
