import {
    startTransition,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
    type PointerEvent as ReactPointerEvent,
    type WheelEvent as ReactWheelEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Theme = "dark" | "light"
type ResponsiveSize = "desktop" | "tablet" | "phone"
type TimerVariant =
    | "dark-desktop"
    | "light-desktop"
    | "dark-tablet"
    | "light-tablet"
    | "dark-phone"
    | "light-phone"
type Segment = "hours" | "minutes" | "seconds"
type ScrubValues = Record<Segment, number>

interface TimerWidgetProps {
    appearance: TimerVariant
    style?: CSSProperties
}

const DEFAULT_PRESETS = [5 * 60, 10 * 60, 20 * 60]
const DEFAULT_DURATION = DEFAULT_PRESETS[2]
const VARIANT_OPTIONS: TimerVariant[] = [
    "dark-desktop",
    "light-desktop",
    "dark-tablet",
    "light-tablet",
    "dark-phone",
    "light-phone",
]
const SCRUB_LIMITS: Record<Segment, number> = {
    hours: 100,
    minutes: 60,
    seconds: 60,
}

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(maximum, Math.max(minimum, value))
}

function durationToScrubValues(duration: number): ScrubValues {
    const safe = Math.max(0, Math.floor(duration))
    return {
        hours: Math.floor(safe / 3600),
        minutes: Math.floor((safe % 3600) / 60),
        seconds: safe % 60,
    }
}

function scrubValuesToDuration(values: ScrubValues) {
    return values.hours * 3600 + values.minutes * 60 + values.seconds
}

function wrapValue(value: number, limit: number) {
    return ((value % limit) + limit) % limit
}

function formatClock(duration: number) {
    const safe = Math.max(0, Math.ceil(duration))
    const hours = Math.floor(safe / 3600)
    const minutes = Math.floor((safe % 3600) / 60)
    const seconds = safe % 60
    if (hours > 0) {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    }
    const totalMinutes = Math.floor(safe / 60)
    return `${String(totalMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function formatPreset(duration: number) {
    const values = durationToScrubValues(duration)
    if (duration % 3600 === 0) return `${values.hours} h`
    if (duration % 60 === 0 && values.hours === 0) return `${Math.floor(duration / 60)} min`
    if (values.hours > 0) return `${values.hours}h ${values.minutes}m`
    if (values.minutes > 0) return `${values.minutes}m ${values.seconds}s`
    return `${values.seconds} sec`
}

function uniqueRecent(duration: number, current: number[]) {
    return [duration, ...current.filter(value => value !== duration)].slice(0, 3)
}

function createSquirclePath(
    width: number,
    height: number,
    inset: number,
    radius: number,
    squircle: number
) {
    const left = inset
    const top = inset
    const right = Math.max(left, width - inset)
    const bottom = Math.max(top, height - inset)
    const safeRadius = Math.min(
        Math.max(0, radius),
        (right - left) / 2,
        (bottom - top) / 2
    )
    const exponent = 2 + clamp(squircle, 0, 100) * 0.03
    const steps = 18
    const commands = [`M ${(left + right) / 2} ${top}`, `L ${right - safeRadius} ${top}`]

    const addCorner = (
        centerX: number,
        centerY: number,
        startAngle: number,
        endAngle: number
    ) => {
        for (let step = 1; step <= steps; step += 1) {
            const angle = startAngle + ((endAngle - startAngle) * step) / steps
            const cosine = Math.cos(angle)
            const sine = Math.sin(angle)
            const x =
                centerX +
                safeRadius * Math.sign(cosine) * Math.abs(cosine) ** (2 / exponent)
            const y =
                centerY +
                safeRadius * Math.sign(sine) * Math.abs(sine) ** (2 / exponent)
            commands.push(`L ${x.toFixed(3)} ${y.toFixed(3)}`)
        }
    }

    addCorner(right - safeRadius, top + safeRadius, -Math.PI / 2, 0)
    commands.push(`L ${right} ${bottom - safeRadius}`)
    addCorner(right - safeRadius, bottom - safeRadius, 0, Math.PI / 2)
    commands.push(`L ${left + safeRadius} ${bottom}`)
    addCorner(left + safeRadius, bottom - safeRadius, Math.PI / 2, Math.PI)
    commands.push(`L ${left} ${top + safeRadius}`)
    addCorner(left + safeRadius, top + safeRadius, Math.PI, (Math.PI * 3) / 2)
    commands.push(`L ${(left + right) / 2} ${top}`, "Z")
    return commands.join(" ")
}

function PlayIcon({ paused }: { paused: boolean }) {
    return paused ? (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <path
                d="M10.8 7.5 22 14.2a.95.95 0 0 1 0 1.63L10.8 22.5a.95.95 0 0 1-1.43-.82V8.32a.95.95 0 0 1 1.43-.82Z"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
            />
        </svg>
    ) : (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <path d="M11 8v14M19 8v14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

function SpeakerIcon({ muted }: { muted: boolean }) {
    return (
        <svg width="25" height="25" viewBox="0 0 25 25" fill="none" aria-hidden="true">
            <path
                d="M4.5 10h3l4-3.5v12L7.5 15h-3v-5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            {!muted && (
                <>
                    <path d="M15 9.2a5 5 0 0 1 0 6.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M18 6.8a8.3 8.3 0 0 1 0 11.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </>
            )}
            {muted && (
                <path d="m15.4 10 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
        </svg>
    )
}

/**
 * @framerIntrinsicWidth 820
 * @framerIntrinsicHeight 440
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TimerWidget(props: TimerWidgetProps) {
    const { appearance = "dark-desktop" } = props
    const safeVariant = VARIANT_OPTIONS.includes(appearance) ? appearance : "dark-desktop"
    const responsiveSize: ResponsiveSize = safeVariant.endsWith("phone")
        ? "phone"
        : safeVariant.endsWith("tablet")
          ? "tablet"
          : "desktop"
    const variantTheme: Theme = safeVariant.startsWith("light") ? "light" : "dark"
    const defaultSize = responsiveSize === "phone"
        ? { width: 360, height: 520 }
        : responsiveSize === "tablet"
          ? { width: 680, height: 420 }
          : { width: 820, height: 440 }
    const isStaticRenderer = useIsStaticRenderer()
    const widgetSize = defaultSize
    const [selectedDuration, setSelectedDuration] = useState(DEFAULT_DURATION)
    const [remaining, setRemaining] = useState(DEFAULT_DURATION)
    const [progress, setProgress] = useState(1)
    const [running, setRunning] = useState(false)
    const [alarm, setAlarm] = useState(false)
    const [muted, setMuted] = useState(false)
    const [presets, setPresets] = useState(DEFAULT_PRESETS)
    const [activePresetDuration, setActivePresetDuration] = useState(DEFAULT_DURATION)
    const [scrubValues, setScrubValues] = useState<ScrubValues>(durationToScrubValues(DEFAULT_DURATION))
    const [activeScrub, setActiveScrub] = useState<Segment | null>(null)
    const [hoveredScrub, setHoveredScrub] = useState<Segment | null>(null)
    const deadlineRef = useRef(0)
    const audioContextRef = useRef<AudioContext | null>(null)
    const draftRef = useRef<ScrubValues>(durationToScrubValues(DEFAULT_DURATION))
    const typedDigitsRef = useRef<{ segment: Segment | null; digits: string }>({ segment: null, digits: "" })
    const wheelRef = useRef<{ segment: Segment | null; delta: number }>({ segment: null, delta: 0 })
    const commitTimerRef = useRef<number | null>(null)
    const dragCleanupRef = useRef<(() => void) | null>(null)

    const config = responsiveSize === "phone"
        ? { padding: 24, outerRadius: 28, progressInset: 10, timeSize: 68, playSize: 68, bottom: 24, bottomWidth: 200, barHeight: 40 }
        : responsiveSize === "tablet"
          ? { padding: 28, outerRadius: 30, progressInset: 11, timeSize: 100, playSize: 68, bottom: 28, bottomWidth: 220, barHeight: 40 }
          : { padding: 32, outerRadius: 32, progressInset: 12, timeSize: 112, playSize: 72, bottom: 32, bottomWidth: 250, barHeight: 40 }
    const theme = variantTheme
    const isPhone = responsiveSize === "phone"
    const isLight = theme === "light"
    const palette = {
        surface: isLight ? "#F5F1E8" : "#11120F",
        accent: isLight ? "#E75F2A" : "#C8FF3D",
        accentText: isLight ? "#FFF9F3" : "#11120F",
        text: isLight ? "#1C1B18" : "#F7F7F5",
        secondaryText: isLight ? "rgba(28,27,24,0.58)" : "rgba(255,255,255,0.58)",
        control: isLight ? "rgba(28,27,24,0.06)" : "rgba(255,255,255,0.08)",
        controlHover: isLight ? "rgba(28,27,24,0.09)" : "rgba(255,255,255,0.12)",
        border: isLight ? "rgba(28,27,24,0.10)" : "rgba(255,255,255,0.10)",
        track: isLight ? "rgba(28,27,24,0.12)" : "rgba(255,255,255,0.10)",
    }

    const stopRunning = useCallback(() => setRunning(false), [])

    const ensureAudioContext = useCallback(() => {
        if (typeof window === "undefined") return null
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioContextClass) return null
        if (!audioContextRef.current || audioContextRef.current.state === "closed") {
            audioContextRef.current = new AudioContextClass()
        }
        if (audioContextRef.current.state === "suspended") {
            void audioContextRef.current.resume().catch(() => undefined)
        }
        return audioContextRef.current
    }, [])

    const beep = useCallback(() => {
        if (muted) return
        const context = ensureAudioContext()
        if (!context) return
        try {
            const scheduleBop = (offset: number, startFrequency: number, endFrequency: number, duration: number) => {
                const start = context.currentTime + offset
                const oscillator = context.createOscillator()
                const gain = context.createGain()
                oscillator.type = "sine"
                oscillator.frequency.setValueAtTime(startFrequency, start)
                oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration)
                gain.gain.setValueAtTime(0.0001, start)
                gain.gain.exponentialRampToValueAtTime(0.95, start + 0.006)
                gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
                oscillator.connect(gain)
                gain.connect(context.destination)
                oscillator.addEventListener("ended", () => {
                    oscillator.disconnect()
                    gain.disconnect()
                }, { once: true })
                oscillator.start(start)
                oscillator.stop(start + duration + 0.01)
            }
            scheduleBop(0, 620, 720, 0.09)
            scheduleBop(0.14, 860, 1040, 0.11)
        } catch {
            // Audio may be unavailable in the canvas or blocked until interaction.
        }
    }, [ensureAudioContext, muted])

    useEffect(() => {
        if (isStaticRenderer || !running) return
        const update = () => {
            const milliseconds = Math.max(0, deadlineRef.current - Date.now())
            const nextRemaining = Math.ceil(milliseconds / 1000)
            const nextProgress = selectedDuration > 0
                ? clamp(milliseconds / (selectedDuration * 1000), 0, 1)
                : 0
            setRemaining(previous => previous === nextRemaining ? previous : nextRemaining)
            setProgress(previous => Math.abs(previous - nextProgress) < 0.001 ? previous : nextProgress)
            if (milliseconds <= 0) {
                setRunning(false)
                setRemaining(0)
                setProgress(0)
                setAlarm(true)
            }
        }
        update()
        const interval = window.setInterval(update, 100)
        return () => window.clearInterval(interval)
    }, [isStaticRenderer, running, selectedDuration])

    useEffect(() => {
        if (isStaticRenderer || !alarm || muted) return
        beep()
        const interval = window.setInterval(beep, 900)
        return () => window.clearInterval(interval)
    }, [alarm, beep, isStaticRenderer, muted])

    useEffect(() => () => {
        dragCleanupRef.current?.()
        if (commitTimerRef.current !== null && typeof window !== "undefined") {
            window.clearTimeout(commitTimerRef.current)
        }
        const context = audioContextRef.current
        if (context && context.state !== "closed") void context.close().catch(() => undefined)
    }, [])

    const chooseDuration = useCallback((duration: number, preserveActiveScrub = false) => {
        const values = durationToScrubValues(duration)
        draftRef.current = values
        stopRunning()
        setAlarm(false)
        setSelectedDuration(duration)
        setRemaining(duration)
        setProgress(1)
        setScrubValues(values)
        if (!preserveActiveScrub) setActiveScrub(null)
    }, [stopRunning])

    const choosePreset = useCallback((duration: number) => {
        setActivePresetDuration(duration)
        chooseDuration(duration)
    }, [chooseDuration])

    const onStartPause = useCallback(() => {
        if (alarm) return
        if (!muted) ensureAudioContext()
        if (running) {
            const nextRemaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
            stopRunning()
            setRemaining(nextRemaining)
            setProgress(selectedDuration > 0 ? nextRemaining / selectedDuration : 0)
            return
        }
        const duration = remaining > 0 ? remaining : selectedDuration
        setRemaining(duration)
        deadlineRef.current = Date.now() + duration * 1000
        setRunning(true)
    }, [alarm, ensureAudioContext, muted, remaining, running, selectedDuration, stopRunning])

    const onReset = useCallback(() => {
        const values = durationToScrubValues(DEFAULT_DURATION)
        draftRef.current = values
        typedDigitsRef.current = { segment: null, digits: "" }
        wheelRef.current = { segment: null, delta: 0 }
        dragCleanupRef.current?.()
        if (commitTimerRef.current !== null && typeof window !== "undefined") {
            window.clearTimeout(commitTimerRef.current)
            commitTimerRef.current = null
        }
        startTransition(() => {
            stopRunning()
            setAlarm(false)
            setMuted(false)
            setPresets(DEFAULT_PRESETS)
            setActivePresetDuration(DEFAULT_DURATION)
            setSelectedDuration(DEFAULT_DURATION)
            setRemaining(DEFAULT_DURATION)
            setProgress(1)
            setScrubValues(values)
            setActiveScrub(null)
        })
    }, [stopRunning])

    const onStop = useCallback(() => {
        startTransition(() => {
            stopRunning()
            setAlarm(false)
            setRemaining(selectedDuration)
            setProgress(1)
        })
    }, [selectedDuration, stopRunning])

    const setSegmentValue = useCallback((segment: Segment, value: number) => {
        const nextValue = wrapValue(value, SCRUB_LIMITS[segment])
        if (draftRef.current[segment] === nextValue) return false
        const next = { ...draftRef.current, [segment]: nextValue }
        draftRef.current = next
        setScrubValues(next)
        return true
    }, [])

    const commitScrub = useCallback(() => {
        if (commitTimerRef.current !== null && typeof window !== "undefined") {
            window.clearTimeout(commitTimerRef.current)
            commitTimerRef.current = null
        }
        typedDigitsRef.current = { segment: null, digits: "" }
        const duration = scrubValuesToDuration(draftRef.current)
        if (duration <= 0) {
            const restored = durationToScrubValues(selectedDuration)
            draftRef.current = restored
            setScrubValues(restored)
            return
        }
        if (duration === selectedDuration) return
        setPresets(current => uniqueRecent(duration, current))
        setActivePresetDuration(duration)
        chooseDuration(duration, true)
    }, [chooseDuration, selectedDuration])

    const scheduleCommit = useCallback((delay = 420) => {
        if (typeof window === "undefined") return
        if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current)
        commitTimerRef.current = window.setTimeout(commitScrub, delay)
    }, [commitScrub])

    const onScrubPointerDown = useCallback((segment: Segment, event: ReactPointerEvent<HTMLButtonElement>) => {
        if (alarm || isStaticRenderer || typeof window === "undefined") return
        event.preventDefault()
        event.currentTarget.focus({ preventScroll: true })
        stopRunning()
        setAlarm(false)
        setActiveScrub(segment)
        dragCleanupRef.current?.()
        const pointerId = event.pointerId
        const startY = event.clientY
        const startValue = draftRef.current[segment]
        typedDigitsRef.current = { segment, digits: "" }
        let lastSteps = 0
        let changed = false

        const cleanup = () => {
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            window.removeEventListener("pointercancel", onPointerUp)
            dragCleanupRef.current = null
        }
        const onPointerMove = (pointerEvent: PointerEvent) => {
            if (pointerEvent.pointerId !== pointerId) return
            const steps = Math.trunc((startY - pointerEvent.clientY) / 12)
            if (steps === lastSteps) return
            lastSteps = steps
            changed = setSegmentValue(segment, startValue + steps) || changed
        }
        const onPointerUp = (pointerEvent: PointerEvent) => {
            if (pointerEvent.pointerId !== pointerId) return
            cleanup()
            if (changed) commitScrub()
            else setActiveScrub(segment)
        }
        dragCleanupRef.current = cleanup
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        window.addEventListener("pointercancel", onPointerUp)
    }, [alarm, commitScrub, isStaticRenderer, setSegmentValue, stopRunning])

    const onScrubWheel = useCallback((segment: Segment, event: ReactWheelEvent<HTMLButtonElement>) => {
        if (alarm || isStaticRenderer) return
        event.preventDefault()
        stopRunning()
        setAlarm(false)
        setActiveScrub(segment)
        if (wheelRef.current.segment !== segment) wheelRef.current = { segment, delta: 0 }
        wheelRef.current.delta += event.deltaY
        const steps = Math.trunc(wheelRef.current.delta / 28)
        if (steps !== 0) {
            wheelRef.current.delta -= steps * 28
            setSegmentValue(segment, draftRef.current[segment] - steps)
        }
        scheduleCommit()
    }, [alarm, isStaticRenderer, scheduleCommit, setSegmentValue, stopRunning])

    const onScrubKeyDown = useCallback((segment: Segment, event: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (alarm || isStaticRenderer) return
        if (/^[0-9]$/.test(event.key)) {
            event.preventDefault()
            stopRunning()
            setAlarm(false)
            const previous = typedDigitsRef.current.segment === segment ? typedDigitsRef.current.digits : ""
            const digits = (previous + event.key).slice(-2)
            typedDigitsRef.current = { segment, digits }
            setSegmentValue(segment, Math.min(Number(digits), SCRUB_LIMITS[segment] - 1))
            scheduleCommit(digits.length >= 2 ? 520 : 900)
            return
        }
        if (event.key === "Backspace" || event.key === "Delete") {
            event.preventDefault()
            stopRunning()
            setAlarm(false)
            const previous = typedDigitsRef.current.segment === segment
                ? typedDigitsRef.current.digits
                : String(draftRef.current[segment]).padStart(2, "0")
            const digits = event.key === "Delete" ? "" : previous.slice(0, -1)
            typedDigitsRef.current = { segment, digits }
            setSegmentValue(segment, digits ? Number(digits) : 0)
            scheduleCommit(900)
            return
        }
        if (event.key === "Enter") {
            event.preventDefault()
            commitScrub()
            return
        }
        if (event.key === "Escape") {
            event.preventDefault()
            typedDigitsRef.current = { segment: null, digits: "" }
            const restored = durationToScrubValues(selectedDuration)
            draftRef.current = restored
            setScrubValues(restored)
            setActiveScrub(null)
            return
        }
        const deltas: Record<string, number> = { ArrowUp: 1, ArrowDown: -1, PageUp: 5, PageDown: -5 }
        const delta = deltas[event.key]
        if (!delta) return
        event.preventDefault()
        typedDigitsRef.current = { segment: null, digits: "" }
        stopRunning()
        setAlarm(false)
        setSegmentValue(segment, draftRef.current[segment] + delta)
        scheduleCommit(300)
    }, [alarm, commitScrub, isStaticRenderer, scheduleCommit, selectedDuration, setSegmentValue, stopRunning])

    const previewDuration = activeScrub ? scrubValuesToDuration(scrubValues) : remaining
    const formattedTime = formatClock(previewDuration)
    const safeInset = config.progressInset + 2.5
    const pathRadius = Math.max(0, config.outerRadius - safeInset)
    const backgroundPath = useMemo(
        () => createSquirclePath(widgetSize.width, widgetSize.height, 0, config.outerRadius, 60),
        [config.outerRadius, widgetSize.height, widgetSize.width]
    )
    const perimeterPath = useMemo(
        () => createSquirclePath(widgetSize.width, widgetSize.height, safeInset, pathRadius, 60),
        [pathRadius, safeInset, widgetSize.height, widgetSize.width]
    )
    const buttonReset: CSSProperties = {
        appearance: "none",
        WebkitAppearance: "none",
        border: 0,
        padding: 0,
        margin: 0,
        background: "transparent",
        color: "inherit",
        font: "inherit",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
    }
    const continuousCorners = { cornerShape: "squircle" } as CSSProperties
    const segmentOrder: Segment[] = ["hours", "minutes", "seconds"]
    const segmentSuffix: Record<Segment, string> = { hours: "h", minutes: "m", seconds: "s" }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "visible",
                isolation: "isolate",
                fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                fontSynthesis: "none",
                color: palette.text,
                transition: "color 240ms ease",
            }}
        >
            <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${widgetSize.width} ${widgetSize.height}`}
                    preserveAspectRatio="none"
                    shapeRendering="geometricPrecision"
                    aria-hidden="true"
                    style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
                >
                    <path d={backgroundPath} fill={palette.surface} style={{ transition: "fill 240ms ease" }} />
                    {!alarm && (
                        <>
                            <path d={perimeterPath} pathLength={1} fill="none" stroke={palette.track} strokeWidth={5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                            <path
                                d={perimeterPath}
                                pathLength={1}
                                fill="none"
                                stroke={palette.accent}
                                strokeWidth={5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray={`${clamp(progress, 0, 1)} ${1 - clamp(progress, 0, 1)}`}
                                vectorEffect="non-scaling-stroke"
                                style={{ transition: "stroke-dasharray 180ms cubic-bezier(0.25,0.1,0.25,1), stroke 240ms ease" }}
                            />
                        </>
                    )}
                </svg>

                <div
                    aria-hidden={alarm}
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: alarm ? 0 : 1,
                        pointerEvents: alarm ? "none" : "auto",
                        transition: "opacity 180ms ease",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: config.padding,
                            left: config.padding,
                            right: config.padding,
                            display: "flex",
                            flexDirection: isPhone ? "column" : "row",
                            justifyContent: "space-between",
                            alignItems: "stretch",
                            gap: isPhone ? 8 : 20,
                        }}
                    >
                        <div
                            role="group"
                            aria-label="Custom duration"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                width: isPhone ? "100%" : responsiveSize === "tablet" ? 184 : 186,
                                height: config.barHeight,
                                padding: 3,
                                borderRadius: 12,
                                ...continuousCorners,
                                background: palette.control,
                                border: `1px solid ${palette.border}`,
                                boxSizing: "border-box",
                                transition: "background 240ms ease, border-color 240ms ease",
                            }}
                        >
                            {segmentOrder.map(segment => {
                                const highlighted = hoveredScrub === segment
                                return (
                                    <button
                                        key={segment}
                                        type="button"
                                        aria-label={`Adjust ${segment}`}
                                        aria-valuenow={scrubValues[segment]}
                                        onPointerDown={event => onScrubPointerDown(segment, event)}
                                        onWheel={event => onScrubWheel(segment, event)}
                                        onKeyDown={event => onScrubKeyDown(segment, event)}
                                        onFocus={() => setActiveScrub(segment)}
                                        onBlur={() => {
                                            if (typedDigitsRef.current.segment === segment) commitScrub()
                                            setActiveScrub(null)
                                        }}
                                        onMouseEnter={() => setHoveredScrub(segment)}
                                        onMouseLeave={() => setHoveredScrub(null)}
                                        style={{
                                            ...buttonReset,
                                            position: "relative",
                                            flex: 1,
                                            height: "100%",
                                            borderRadius: 9,
                                            ...continuousCorners,
                                            background: highlighted ? palette.controlHover : "transparent",
                                            color: palette.secondaryText,
                                            fontSize: 13,
                                            fontWeight: 500,
                                            letterSpacing: -0.1,
                                            fontVariantNumeric: "tabular-nums",
                                            transition: "background 160ms ease, color 160ms ease",
                                            touchAction: "none",
                                            userSelect: "none",
                                            outline: "none",
                                            cursor: "ns-resize",
                                        }}
                                    >
                                        {String(scrubValues[segment]).padStart(2, "0")} {segmentSuffix[segment]}
                                    </button>
                                )
                            })}
                        </div>

                        <div
                            role="group"
                            aria-label="Timer presets"
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                width: isPhone ? "100%" : responsiveSize === "tablet" ? 222 : 246,
                                height: config.barHeight,
                                padding: 3,
                                borderRadius: 12,
                                ...continuousCorners,
                                background: palette.control,
                                border: `1px solid ${palette.border}`,
                                boxSizing: "border-box",
                                overflow: "hidden",
                                transition: "background 240ms ease, border-color 240ms ease",
                            }}
                        >
                            {[1, 2].map(index => (
                                <span
                                    key={index}
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        left: `${(index * 100) / 3}%`,
                                        top: 10,
                                        bottom: 10,
                                        width: 1,
                                        background: palette.border,
                                        transform: "translateX(-0.5px)",
                                        transition: "background 240ms ease",
                                        zIndex: 1,
                                    }}
                                />
                            ))}
                            {presets.map((duration, index) => {
                                const active = duration === activePresetDuration
                                return (
                                    <button
                                        key={`${duration}-${index}`}
                                        type="button"
                                        onClick={() => choosePreset(duration)}
                                        style={{
                                            ...buttonReset,
                                            position: "relative",
                                            zIndex: active ? 2 : 1,
                                            flex: 1,
                                            height: "100%",
                                            borderRadius: 9,
                                            ...continuousCorners,
                                            background: active ? palette.accent : "transparent",
                                            color: active ? palette.accentText : palette.secondaryText,
                                            fontSize: isPhone ? 13 : 13,
                                            fontWeight: active ? 600 : 500,
                                            letterSpacing: -0.1,
                                            whiteSpace: "nowrap",
                                            transition: "background 220ms cubic-bezier(0.25,0.1,0.25,1), color 180ms ease",
                                        }}
                                    >
                                        {formatPreset(duration)}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            left: config.padding,
                            right: config.padding,
                            top: isPhone ? "53%" : "46%",
                            transform: "translateY(-50%)",
                            textAlign: "center",
                            color: palette.text,
                            fontSize: config.timeSize,
                            fontWeight: 500,
                            lineHeight: 0.95,
                            letterSpacing: "-0.045em",
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "nowrap",
                            userSelect: "none",
                            transition: "color 240ms ease",
                        }}
                    >
                        {formattedTime}
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            bottom: config.bottom,
                            width: config.bottomWidth,
                            height: config.playSize,
                            transform: "translateX(-50%)",
                            display: "grid",
                            gridTemplateColumns: `1fr ${config.playSize}px 1fr`,
                            alignItems: "center",
                        }}
                    >
                        <button
                            type="button"
                            onClick={onReset}
                            style={{
                                ...buttonReset,
                                justifySelf: "end",
                                marginRight: responsiveSize === "desktop" ? 36 : 28,
                                color: palette.secondaryText,
                                fontSize: 15,
                                fontWeight: 500,
                                letterSpacing: -0.15,
                                transition: "color 160ms ease",
                            }}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            aria-label={running ? "Pause timer" : "Start timer"}
                            onClick={onStartPause}
                            style={{
                                ...buttonReset,
                                width: config.playSize,
                                height: config.playSize,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: palette.accent,
                                color: isLight ? "#FFF9F3" : "#11120F",
                                transition: "background 240ms ease, color 240ms ease, transform 150ms ease",
                            }}
                        >
                            <PlayIcon paused={!running} />
                        </button>
                        <button
                            type="button"
                            aria-label={muted ? "Unmute alarm" : "Mute alarm"}
                            onClick={() => {
                                const nextMuted = !muted
                                if (!nextMuted) ensureAudioContext()
                                setMuted(nextMuted)
                            }}
                            style={{
                                ...buttonReset,
                                justifySelf: "start",
                                marginLeft: responsiveSize === "desktop" ? 36 : 28,
                                width: 28,
                                height: 28,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: palette.secondaryText,
                                transition: "color 160ms ease",
                            }}
                        >
                            <SpeakerIcon muted={muted} />
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: alarm ? 1 : 0,
                        pointerEvents: alarm ? "auto" : "none",
                        transition: "opacity 180ms ease",
                    }}
                >
                    <button
                        type="button"
                        onClick={onStop}
                        style={{
                            ...buttonReset,
                            width: isPhone ? 144 : 164,
                            height: isPhone ? 68 : 76,
                            borderRadius: isPhone ? 34 : 38,
                            ...continuousCorners,
                            background: palette.accent,
                            color: isLight ? "#FFF9F3" : "#11120F",
                            fontSize: isPhone ? 24 : 27,
                            fontWeight: 600,
                            letterSpacing: -0.5,
                            transition: "background 240ms ease, color 240ms ease",
                        }}
                    >
                        Stop
                    </button>
                </div>
        </div>
    )
}

TimerWidget.displayName = "Timer Widget"

addPropertyControls(TimerWidget, {
    appearance: {
        type: ControlType.Enum,
        title: "Timer Variant",
        options: VARIANT_OPTIONS,
        optionTitles: [
            "Dark",
            "Light",
            "Dark Tablet",
            "Light Tablet",
            "Dark Phone",
            "Light Phone",
        ],
        defaultValue: "dark-desktop",
    },
})
