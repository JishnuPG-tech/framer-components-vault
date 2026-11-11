// Mini Pomodoro timer embedded into any site for focus sessions
import {
    useState,
    useEffect,
    useRef,
    startTransition,
    type CSSProperties,
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


interface PomodoroTimerProps {
    workDuration: number
    breakDuration: number
    longBreakDuration: number
    enableLongBreak: boolean
    longBreakInterval: number
    backgroundColor?: string
    textColor?: string
    buttonColor?: string
    buttonTextColor?: string
    progressColor?: string

    progressBackgroundColor?: string
    font: any
    buttonFont: any
    borderRadius: number
    showProgress: boolean
    autoStart: boolean
    enableSounds: boolean
    workStartSound: string
    workEndSound: string
    breakStartSound: string
    breakEndSound: string
    longBreakStartSound: string
    longBreakEndSound: string
    showGoal: boolean
    defaultGoal: string
    showNotes: boolean
    enableGoalInput: boolean
    enableNotesInput: boolean
    maxCycles: number
    enableCycleLimit: boolean
    enableCalendarIntegration: boolean
    calendarProvider: string
    autoCreateEvents: boolean
    eventTitle: string
    eventDescription: string
    enableTargets: boolean
    targetType: string
    dailyTarget: number
    weeklyTarget: number
    showTargetProgress: boolean
    targetProgressColor: string
    enableTimeTracking: boolean
    showTimeStats: boolean
    trackingPeriod: string
    resetStatsDaily: boolean
    showDetailedStats: boolean
    showStyleOptions: boolean
    style?: CSSProperties
}

interface TimeStats {
    totalFocusTime: number // in minutes
    totalSessions: number
    lastSessionDate: string
    dailyStats: { [date: string]: { focusTime: number; sessions: number } }
    weeklyStats: { [week: string]: { focusTime: number; sessions: number } }
    monthlyStats: { [month: string]: { focusTime: number; sessions: number } }
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function PomodoroTimer(props: PomodoroTimerProps) {
    const {
        workDuration = 25,
        breakDuration = 5,
        longBreakDuration = 15,
        enableLongBreak = false,
        longBreakInterval = 4,

        backgroundColor,
        textColor,
        buttonColor,
        buttonTextColor,
        progressColor,

        progressBackgroundColor,
        font,
        buttonFont,
        borderRadius = 8,
        showProgress,
        autoStart,
        enableSounds,
        workStartSound,
        workEndSound,
        breakStartSound,
        breakEndSound,
        longBreakStartSound,
        longBreakEndSound,
        showGoal,
        defaultGoal,
        showNotes,
        enableGoalInput,
        enableNotesInput,
        maxCycles,
        enableCycleLimit,
        enableCalendarIntegration,
        calendarProvider,
        autoCreateEvents,
        eventTitle,
        eventDescription,
        enableTargets,
        targetType,
        dailyTarget,
        weeklyTarget,
        showTargetProgress,
        targetProgressColor,
        enableTimeTracking,
        showTimeStats,
        trackingPeriod,
        resetStatsDaily,
        showDetailedStats,
        showStyleOptions,
    } = props

    const [timeLeft, setTimeLeft] = useState(workDuration * 60)
    const [isActive, setIsActive] = useState(false)
    const [isWork, setIsWork] = useState(true)
    const [cycles, setCycles] = useState(0)
    const [currentGoal, setCurrentGoal] = useState(defaultGoal || "")
    const [sessionNotes, setSessionNotes] = useState("")
    const [isCompleted, setIsCompleted] = useState(false)
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
    const [calendarEventCreated, setCalendarEventCreated] = useState(false)
    const [timeStats, setTimeStats] = useState<TimeStats>({
        totalFocusTime: 0,
        totalSessions: 0,
        lastSessionDate: "",
        dailyStats: {},
        weeklyStats: {},
        monthlyStats: {},
    })
    const [currentSessionFocusTime, setCurrentSessionFocusTime] = useState(0)
    const intervalRef = useRef<number | null>(null)
    const isStatic = useIsStaticRenderer()

    const totalTime = isWork ? workDuration * 60 : breakDuration * 60
    const progress = ((totalTime - timeLeft) / totalTime) * 100

    // Load stats from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined" || !enableTimeTracking) return

        try {
            const savedStats = localStorage.getItem("pomodoroTimeStats")
            if (savedStats) {
                const parsedStats = JSON.parse(savedStats)

                // Reset daily stats if enabled and it's a new day
                if (resetStatsDaily) {
                    const today = new Date().toDateString()
                    if (
                        parsedStats.lastSessionDate &&
                        new Date(parsedStats.lastSessionDate).toDateString() !==
                            today
                    ) {
                        parsedStats.dailyStats = {}
                    }
                }

                setTimeStats(parsedStats)
            }
        } catch (error) {
            console.warn("Failed to load time stats:", error)
        }
    }, [enableTimeTracking, resetStatsDaily])

    // Save stats to localStorage whenever they change
    useEffect(() => {
        if (typeof window === "undefined" || !enableTimeTracking) return

        try {
            localStorage.setItem("pomodoroTimeStats", JSON.stringify(timeStats))
        } catch (error) {
            console.warn("Failed to save time stats:", error)
        }
    }, [timeStats, enableTimeTracking])

    // Helper functions for date formatting
    const getDateKey = (date: Date) => date.toISOString().split("T")[0]
    const getWeekKey = (date: Date) => {
        const year = date.getFullYear()
        const week = Math.ceil(
            (date.getTime() - new Date(year, 0, 1).getTime()) /
                (7 * 24 * 60 * 60 * 1000)
        )
        return `${year}-W${week.toString().padStart(2, "0")}`
    }
    const getMonthKey = (date: Date) =>
        `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`

    // Update time tracking when work session completes
    const updateTimeStats = (focusMinutes: number) => {
        if (!enableTimeTracking) return

        const now = new Date()
        const dateKey = getDateKey(now)
        const weekKey = getWeekKey(now)
        const monthKey = getMonthKey(now)

        setTimeStats((prev) => ({
            ...prev,
            totalFocusTime: prev.totalFocusTime + focusMinutes,
            totalSessions: prev.totalSessions + 1,
            lastSessionDate: now.toISOString(),
            dailyStats: {
                ...prev.dailyStats,
                [dateKey]: {
                    focusTime:
                        (prev.dailyStats[dateKey]?.focusTime || 0) +
                        focusMinutes,
                    sessions: (prev.dailyStats[dateKey]?.sessions || 0) + 1,
                },
            },
            weeklyStats: {
                ...prev.weeklyStats,
                [weekKey]: {
                    focusTime:
                        (prev.weeklyStats[weekKey]?.focusTime || 0) +
                        focusMinutes,
                    sessions: (prev.weeklyStats[weekKey]?.sessions || 0) + 1,
                },
            },
            monthlyStats: {
                ...prev.monthlyStats,
                [monthKey]: {
                    focusTime:
                        (prev.monthlyStats[monthKey]?.focusTime || 0) +
                        focusMinutes,
                    sessions: (prev.monthlyStats[monthKey]?.sessions || 0) + 1,
                },
            },
        }))
    }

    // Get current period stats based on tracking period
    const getCurrentPeriodStats = () => {
        const now = new Date()

        switch (trackingPeriod) {
            case "daily":
                const dateKey = getDateKey(now)
                return (
                    timeStats.dailyStats[dateKey] || {
                        focusTime: 0,
                        sessions: 0,
                    }
                )
            case "weekly":
                const weekKey = getWeekKey(now)
                return (
                    timeStats.weeklyStats[weekKey] || {
                        focusTime: 0,
                        sessions: 0,
                    }
                )
            case "monthly":
                const monthKey = getMonthKey(now)
                return (
                    timeStats.monthlyStats[monthKey] || {
                        focusTime: 0,
                        sessions: 0,
                    }
                )
            default:
                return {
                    focusTime: timeStats.totalFocusTime,
                    sessions: timeStats.totalSessions,
                }
        }
    }

    // Format time for display
    const formatTimeDisplay = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes}m`
        }
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return remainingMinutes > 0
            ? `${hours}h ${remainingMinutes}m`
            : `${hours}h`
    }

    // Track window size for responsive behavior
    useEffect(() => {
        if (typeof window === "undefined") return

        const updateSize = () => {
            startTransition(() => {
                setWindowSize({
                    width: window.innerWidth,
                    height: window.innerHeight,
                })
            })
        }

        updateSize()
        window.addEventListener("resize", updateSize)
        window.addEventListener("orientationchange", updateSize)

        return () => {
            window.removeEventListener("resize", updateSize)
            window.removeEventListener("orientationchange", updateSize)
        }
    }, [])

    // Responsive breakpoints
    const isMobile = windowSize.width <= 768
    const isTablet = windowSize.width > 768 && windowSize.width <= 1024
    const isLandscape = windowSize.width > windowSize.height

    // Calendar integration functions
    const createCalendarEvent = (
        startTime: Date,
        duration: number,
        title: string,
        description: string
    ) => {
        if (
            !enableCalendarIntegration ||
            isStatic ||
            typeof window === "undefined"
        )
            return

        const endTime = new Date(startTime.getTime() + duration * 60 * 1000)
        const startISO =
            startTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
        const endISO =
            endTime.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

        const eventDetails = {
            title: encodeURIComponent(title),
            description: encodeURIComponent(description),
            start: startISO,
            end: endISO,
        }

        let calendarUrl = ""

        switch (calendarProvider) {
            case "google":
                calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventDetails.title}&details=${eventDetails.description}&dates=${eventDetails.start}/${eventDetails.end}`
                break
            case "outlook":
                calendarUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${eventDetails.title}&body=${eventDetails.description}&startdt=${eventDetails.start}&enddt=${eventDetails.end}`
                break
            case "office365":
                calendarUrl = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${eventDetails.title}&body=${eventDetails.description}&startdt=${eventDetails.start}&enddt=${eventDetails.end}`
                break
            default:
                return
        }

        try {
            window.open(calendarUrl, "_blank", "noopener,noreferrer")
        } catch (error) {
            console.warn("Failed to open calendar:", error)
        }
    }

    const scheduleSession = () => {
        if (!enableCalendarIntegration || isStatic) return

        const now = new Date()
        const sessionDuration = enableCycleLimit
            ? (workDuration + breakDuration) * maxCycles
            : workDuration + breakDuration

        const title =
            eventTitle ||
            `Focus Session${currentGoal ? `: ${currentGoal}` : ""}`
        const description =
            eventDescription ||
            `Pomodoro focus session\n${currentGoal ? `Goal: ${currentGoal}\n` : ""}Duration: ${workDuration}min work, ${breakDuration}min break${enableCycleLimit ? `\nCycles: ${maxCycles}` : ""}`

        createCalendarEvent(now, sessionDuration, title, description)
    }

    const blockFocusTime = () => {
        if (!enableCalendarIntegration || isStatic) return

        const now = new Date()
        const title = `🔒 Focus Time - ${currentGoal || "Deep Work"}`
        const description = `Blocked time for focused work\n${currentGoal ? `Goal: ${currentGoal}\n` : ""}Please do not disturb during this time.`

        createCalendarEvent(now, workDuration, title, description)
    }

    // Sound notification function
    const playSound = (soundType: string) => {
        if (!enableSounds || isStatic || typeof window === "undefined") return

        try {
            const audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            // Different sound patterns for different notifications
            switch (soundType) {
                case "bell":
                    // Bell sound - single tone
                    oscillator.frequency.setValueAtTime(
                        800,
                        audioContext.currentTime
                    )
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.5
                    )
                    oscillator.start(audioContext.currentTime)
                    oscillator.stop(audioContext.currentTime + 0.5)
                    break
                case "chime":
                    // Chime sound - ascending tones
                    oscillator.frequency.setValueAtTime(
                        523,
                        audioContext.currentTime
                    ) // C5
                    oscillator.frequency.setValueAtTime(
                        659,
                        audioContext.currentTime + 0.2
                    ) // E5
                    oscillator.frequency.setValueAtTime(
                        784,
                        audioContext.currentTime + 0.4
                    ) // G5
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.8
                    )
                    oscillator.start(audioContext.currentTime)
                    oscillator.stop(audioContext.currentTime + 0.8)
                    break
                case "beep":
                    // Beep sound - short high tone
                    oscillator.frequency.setValueAtTime(
                        1000,
                        audioContext.currentTime
                    )
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.2
                    )
                    oscillator.start(audioContext.currentTime)
                    oscillator.stop(audioContext.currentTime + 0.2)
                    break
                case "ding":
                    // Ding sound - two quick tones
                    oscillator.frequency.setValueAtTime(
                        800,
                        audioContext.currentTime
                    )
                    oscillator.frequency.setValueAtTime(
                        1000,
                        audioContext.currentTime + 0.1
                    )
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.01,
                        audioContext.currentTime + 0.3
                    )
                    oscillator.start(audioContext.currentTime)
                    oscillator.stop(audioContext.currentTime + 0.3)
                    break
                case "none":
                default:
                    // No sound
                    break
            }
        } catch (error) {
            console.warn("Audio playback failed:", error)
        }
    }

    useEffect(() => {
        if (autoStart && !isStatic) {
            startTransition(() => setIsActive(true))
        }
    }, [autoStart, isStatic])

    useEffect(() => {
        if (isStatic) return

        if (isActive && timeLeft > 0) {
            intervalRef.current = window.setInterval(() => {
                startTransition(() => {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            setIsActive(false)
                            if (isWork) {
                                // Work period ended - track time
                                const sessionMinutes = workDuration
                                updateTimeStats(sessionMinutes)
                                setCurrentSessionFocusTime(
                                    (prev) => prev + sessionMinutes
                                )

                                playSound(workEndSound)
                                setCycles((c) => {
                                    const newCycles = c + 1
                                    // Check if cycle limit reached
                                    if (
                                        enableCycleLimit &&
                                        newCycles >= maxCycles
                                    ) {
                                        setIsCompleted(true)
                                        return newCycles
                                    }

                                    // Check for long break
                                    if (
                                        enableLongBreak &&
                                        newCycles % longBreakInterval === 0
                                    ) {
                                        setIsWork(false)
                                        setTimeout(
                                            () =>
                                                playSound(longBreakStartSound),
                                            100
                                        )
                                        return newCycles
                                    }

                                    return newCycles
                                })

                                // Determine break type
                                const isLongBreak =
                                    enableLongBreak &&
                                    (cycles + 1) % longBreakInterval === 0
                                setIsWork(false)

                                // Break period starting
                                setTimeout(
                                    () =>
                                        playSound(
                                            isLongBreak
                                                ? longBreakStartSound
                                                : breakStartSound
                                        ),
                                    100
                                )
                                return isLongBreak
                                    ? longBreakDuration * 60
                                    : breakDuration * 60
                            } else {
                                // Break period ended
                                const isLongBreak =
                                    enableLongBreak &&
                                    cycles % longBreakInterval === 0
                                playSound(
                                    isLongBreak
                                        ? longBreakEndSound
                                        : breakEndSound
                                )
                                setIsWork(true)
                                // Work period starting
                                setTimeout(() => playSound(workStartSound), 100)
                                return workDuration * 60
                            }
                        }
                        return prev - 1
                    })
                })
            }, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [
        isActive,
        timeLeft,
        isWork,
        workDuration,
        breakDuration,
        longBreakDuration,
        enableLongBreak,
        longBreakInterval,
        cycles,
        isStatic,
        enableSounds,
        workStartSound,
        workEndSound,
        breakStartSound,
        breakEndSound,
        longBreakStartSound,
        longBreakEndSound,
        enableCycleLimit,
        maxCycles,
    ])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const handleStartPause = () => {
        if (isStatic) return

        if (!isActive && !sessionStartTime) {
            // Starting a new session
            const now = new Date()
            setSessionStartTime(now)

            // Auto-create calendar event if enabled
            if (enableCalendarIntegration && autoCreateEvents) {
                const sessionDuration = enableCycleLimit
                    ? (workDuration + breakDuration) * maxCycles
                    : workDuration + breakDuration

                const title =
                    eventTitle ||
                    `Focus Session${currentGoal ? `: ${currentGoal}` : ""}`
                const description =
                    eventDescription ||
                    `Pomodoro focus session\n${currentGoal ? `Goal: ${currentGoal}\n` : ""}Duration: ${workDuration}min work, ${breakDuration}min break${enableCycleLimit ? `\nCycles: ${maxCycles}` : ""}`

                createCalendarEvent(now, sessionDuration, title, description)
                setCalendarEventCreated(true)
            }
        }

        startTransition(() => setIsActive(!isActive))
    }

    const handleReset = () => {
        if (isStatic) return
        startTransition(() => {
            setIsActive(false)
            setTimeLeft(isWork ? workDuration * 60 : breakDuration * 60)
            setCycles(0)
            setIsCompleted(false)
            setSessionStartTime(null)
            setCalendarEventCreated(false)
        })
    }

    const handleSkip = () => {
        if (isStatic) return
        startTransition(() => {
            setIsActive(false)
            if (isWork) {
                setCycles((c) => {
                    const newCycles = c + 1
                    if (enableCycleLimit && newCycles >= maxCycles) {
                        setIsCompleted(true)
                    }
                    return newCycles
                })
                setIsWork(false)
                setTimeLeft(breakDuration * 60)
            } else {
                setIsWork(true)
                setTimeLeft(workDuration * 60)
            }
        })
    }

    const handleNewSession = () => {
        if (isStatic) return
        startTransition(() => {
            setIsActive(false)
            setIsWork(true)
            setCycles(0)
            setTimeLeft(workDuration * 60)
            setIsCompleted(false)
            setSessionNotes("")
            setSessionStartTime(null)
            setCalendarEventCreated(false)
        })
    }

    const isFixedWidth = props?.style && props.style.width === "100%"
    const isFixedHeight = props?.style && props.style.height === "100%"

    if (isCompleted) {
        return (
            <div
                style={{
                    ...props.style,
                    position: "relative",
                    ...(isFixedWidth
                        ? { width: "100%" }
                        : { width: "max-content" }),
                    ...(isFixedHeight
                        ? { height: "100%" }
                        : { height: "max-content" }),
                    background: backgroundColor,
                    color: textColor,
                    borderRadius,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    ...font,
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}
                >
                    <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                        🎉 Session Complete!
                    </div>
                    <div style={{ fontSize: "14px", opacity: 0.7 }}>
                        Completed {cycles} focus cycles
                    </div>
                    {showGoal && currentGoal && (
                        <div style={{ fontSize: "14px", opacity: 0.8 }}>
                            Goal: {currentGoal}
                        </div>
                    )}
                </div>

                {showNotes && enableNotesInput && (
                    <textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="How did your session go? Any notes..."
                        style={{
                            width: "100%",
                            minHeight: "60px",
                            padding: "8px",
                            border: `1px solid ${textColor}20`,
                            borderRadius: 4,
                            background: "transparent",
                            color: textColor,
                            resize: "vertical",
                            ...font,
                            fontSize: "12px",
                        }}
                    />
                )}

                <button
                    onClick={handleNewSession}
                    style={{
                        background: buttonColor,
                        color: buttonTextColor,
                        border: "none",
                        borderRadius: 6,
                        padding: "12px 24px",
                        cursor: isStatic ? "default" : "pointer",
                        ...buttonFont,
                    }}
                >
                    Start New Session
                </button>
            </div>
        )
    }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                ...(isFixedWidth
                    ? { width: "100%" }
                    : { width: "max-content" }),
                ...(isFixedHeight
                    ? { height: "100%" }
                    : { height: "max-content" }),
                background: backgroundColor,
                color: textColor,
                borderRadius,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                ...font,
            }}
        >
            {/* Goal Input/Display */}
            {showGoal && (
                <div style={{ width: "100%", textAlign: "center" }}>
                    {enableGoalInput ? (
                        <input
                            type="text"
                            value={currentGoal}
                            onChange={(e) => setCurrentGoal(e.target.value)}
                            placeholder="What's your focus goal?"
                            style={{
                                width: "100%",
                                padding: "8px",
                                border: `1px solid ${textColor}20`,
                                borderRadius: 4,
                                background: "transparent",
                                color: textColor,
                                textAlign: "center",
                                ...font,
                                fontSize: "14px",
                            }}
                        />
                    ) : (
                        currentGoal && (
                            <div
                                style={{
                                    fontSize: "14px",
                                    opacity: 0.8,
                                    fontStyle: "italic",
                                }}
                            >
                                Goal: {currentGoal}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Calendar Integration Controls */}
            {enableCalendarIntegration && !isActive && (
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        gap: 8,
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        onClick={scheduleSession}
                        style={{
                            background: "transparent",
                            color: buttonColor,
                            border: `1px solid ${buttonColor}`,
                            borderRadius: 4,
                            padding: "6px 12px",
                            cursor: isStatic ? "default" : "pointer",
                            fontSize: "12px",
                            ...buttonFont,
                            opacity: isStatic ? 0.7 : 1,
                        }}
                    >
                        📅 Schedule Session
                    </button>
                    <button
                        onClick={blockFocusTime}
                        style={{
                            background: "transparent",
                            color: buttonColor,
                            border: `1px solid ${buttonColor}`,
                            borderRadius: 4,
                            padding: "6px 12px",
                            cursor: isStatic ? "default" : "pointer",
                            fontSize: "12px",
                            ...buttonFont,
                            opacity: isStatic ? 0.7 : 1,
                        }}
                    >
                        🔒 Block Time
                    </button>
                </div>
            )}

            {/* Calendar Event Status */}
            {enableCalendarIntegration && calendarEventCreated && (
                <div
                    style={{
                        fontSize: "12px",
                        opacity: 0.7,
                        textAlign: "center",
                        color: progressColor,
                    }}
                >
                    ✓ Calendar event created
                </div>
            )}

            {/* Status and Cycles */}
            <div
                style={{
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                }}
            >
                <div style={{ fontSize: "14px", opacity: 0.7 }}>
                    {isWork ? "🎯 Focus Time" : "☕ Break Time"} • Cycle{" "}
                    {cycles + 1}
                    {enableCycleLimit && ` of ${maxCycles}`}
                </div>
            </div>

            {/* Timer Display */}
            <div
                style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    textAlign: "center",
                    minWidth: "120px",
                }}
            >
                {formatTime(timeLeft)}
            </div>

            {/* Progress Bar */}
            {showProgress && (
                <div
                    style={{
                        width: "100%",
                        height: 6,
                        backgroundColor: progressBackgroundColor || "rgba(0,0,0,0.1)",
                        borderRadius: 3,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${progress}%`,
                            height: "100%",
                            backgroundColor: progressColor,
                            transition: "width 1s ease",
                        }}
                    />
                </div>
            )}

            {/* Session Notes */}
            {showNotes && enableNotesInput && (
                <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Session notes..."
                    style={{
                        width: "100%",
                        minHeight: "40px",
                        padding: "8px",
                        border: `1px solid ${textColor}20`,
                        borderRadius: 4,
                        background: "transparent",
                        color: textColor,
                        resize: "vertical",
                        ...font,
                        fontSize: "12px",
                    }}
                />
            )}

            {/* Controls */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    width: "100%",
                    justifyContent: "center",
                }}
            >
                <button
                    onClick={handleStartPause}
                    style={{
                        background: buttonColor,
                        color: buttonTextColor,
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 16px",
                        cursor: isStatic ? "default" : "pointer",
                        ...buttonFont,
                        opacity: isStatic ? 0.7 : 1,
                    }}
                >
                    {isActive ? "Pause" : "Start"}
                </button>
                <button
                    onClick={handleReset}
                    style={{
                        background: "transparent",
                        color: buttonColor,
                        border: `1px solid ${buttonColor}`,
                        borderRadius: 6,
                        padding: "8px 16px",
                        cursor: isStatic ? "default" : "pointer",
                        ...buttonFont,
                        opacity: isStatic ? 0.7 : 1,
                    }}
                >
                    Reset
                </button>
                <button
                    onClick={handleSkip}
                    style={{
                        background: "transparent",
                        color: buttonColor,
                        border: `1px solid ${buttonColor}`,
                        borderRadius: 6,
                        padding: "8px 16px",
                        cursor: isStatic ? "default" : "pointer",
                        ...buttonFont,
                        opacity: isStatic ? 0.7 : 1,
                    }}
                >
                    Skip
                </button>
            </div>

            {showTimeStats && (
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 16,
                    }}
                >
                    <div
                        style={{
                            fontSize: "14px",
                            opacity: 0.7,
                            textAlign: "center",
                        }}
                    >
                        {showDetailedStats ? "Detailed Stats" : "Summary"}
                    </div>
                    <div
                        style={{
                            fontSize: "14px",
                            opacity: 0.7,
                            textAlign: "center",
                        }}
                    >
                        {showDetailedStats
                            ? "Period: " + trackingPeriod
                            : "Total Focus Time: " +
                              formatTimeDisplay(
                                  getCurrentPeriodStats().focusTime
                              )}
                    </div>
                    {showDetailedStats && (
                        <div
                            style={{
                                fontSize: "14px",
                                opacity: 0.7,
                                textAlign: "center",
                            }}
                        >
                            Total Sessions: {getCurrentPeriodStats().sessions}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

addPropertyControls(PomodoroTimer, {

    workDuration: {
        type: ControlType.Number,
        title: "Work Duration",
        defaultValue: 25,
        min: 1,
        max: 60,
        step: 1,
        unit: "min",
    },
    breakDuration: {
        type: ControlType.Number,
        title: "Break Duration",
        defaultValue: 5,
        min: 1,
        max: 30,
        step: 1,
        unit: "min",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#000000",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#FFFFFF",
    },
    progressColor: {
        type: ControlType.Color,
        title: "Progress Color",
        defaultValue: "#000000",
    },

    progressBackgroundColor: {
        type: ControlType.Color,
        title: "Progress Background Color",
        defaultValue: "#F5F5F5",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    showGoal: {
        type: ControlType.Boolean,
        title: "Show Goal",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    enableGoalInput: {
        type: ControlType.Boolean,
        title: "Goal Input",
        defaultValue: true,
        enabledTitle: "Editable",
        disabledTitle: "Display Only",
        hidden: ({ showGoal }) => !showGoal,
    },
    defaultGoal: {
        type: ControlType.String,
        title: "Default Goal",
        defaultValue: "Complete project tasks",
        placeholder: "Enter your focus goal...",
        hidden: ({ showGoal }) => !showGoal,
    },
    showNotes: {
        type: ControlType.Boolean,
        title: "Show Notes",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    enableNotesInput: {
        type: ControlType.Boolean,
        title: "Notes Input",
        defaultValue: true,
        enabledTitle: "Editable",
        disabledTitle: "Display Only",
        hidden: ({ showNotes }) => !showNotes,
    },
    enableCycleLimit: {
        type: ControlType.Boolean,
        title: "Cycle Limit",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    maxCycles: {
        type: ControlType.Number,
        title: "Max Cycles",
        defaultValue: 4,
        min: 1,
        max: 20,
        step: 1,
        hidden: ({ enableCycleLimit }) => !enableCycleLimit,
    },
    enableCalendarIntegration: {
        type: ControlType.Boolean,
        title: "Calendar Integration",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    calendarProvider: {
        type: ControlType.Enum,
        title: "Calendar Provider",
        defaultValue: "google",
        options: ["google", "outlook", "office365"],
        optionTitles: ["Google Calendar", "Outlook.com", "Office 365"],
        hidden: ({ enableCalendarIntegration }) => !enableCalendarIntegration,
    },
    autoCreateEvents: {
        type: ControlType.Boolean,
        title: "Auto Create Events",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableCalendarIntegration }) => !enableCalendarIntegration,
    },
    eventTitle: {
        type: ControlType.String,
        title: "Event Title",
        defaultValue: "Focus Session",
        placeholder: "Enter event title...",
        hidden: ({ enableCalendarIntegration }) => !enableCalendarIntegration,
    },
    eventDescription: {
        type: ControlType.String,
        title: "Event Description",
        defaultValue: "Pomodoro focus session for deep work",
        placeholder: "Enter event description...",
        displayTextArea: true,
        hidden: ({ enableCalendarIntegration }) => !enableCalendarIntegration,
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Show Progress",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    autoStart: {
        type: ControlType.Boolean,
        title: "Auto Start",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableSounds: {
        type: ControlType.Boolean,
        title: "Enable Sounds",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    workStartSound: {
        type: ControlType.Enum,
        title: "Work Start Sound",
        defaultValue: "none",
        options: ["none", "bell", "chime", "beep", "ding"],
        hidden: ({ enableSounds }) => !enableSounds,
    },
    workEndSound: {
        type: ControlType.Enum,
        title: "Work End Sound",
        defaultValue: "none",
        options: ["none", "bell", "chime", "beep", "ding"],
        hidden: ({ enableSounds }) => !enableSounds,
    },
    breakStartSound: {
        type: ControlType.Enum,
        title: "Break Start Sound",
        defaultValue: "none",
        options: ["none", "bell", "chime", "beep", "ding"],
        hidden: ({ enableSounds }) => !enableSounds,
    },
    breakEndSound: {
        type: ControlType.Enum,
        title: "Break End Sound",
        defaultValue: "none",
        options: ["none", "bell", "chime", "beep", "ding"],
        hidden: ({ enableSounds }) => !enableSounds,
    },
    enableTargets: {
        type: ControlType.Boolean,
        title: "Enable Targets",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    targetType: {
        type: ControlType.Enum,
        title: "Target Type",
        defaultValue: "daily",
        options: ["daily", "weekly"],
        optionTitles: ["Daily", "Weekly"],
        hidden: ({ enableTargets }) => !enableTargets,
    },
    dailyTarget: {
        type: ControlType.Number,
        title: "Daily Target",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ enableTargets, targetType }) =>
            !enableTargets || targetType !== "daily",
    },
    weeklyTarget: {
        type: ControlType.Number,
        title: "Weekly Target",
        defaultValue: 5,
        min: 1,
        max: 50,
        step: 1,
        hidden: ({ enableTargets, targetType }) =>
            !enableTargets || targetType !== "weekly",
    },
    showTargetProgress: {
        type: ControlType.Boolean,
        title: "Show Target Progress",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ enableTargets }) => !enableTargets,
    },
    targetProgressColor: {
        type: ControlType.Color,
        title: "Target Progress Color",
        defaultValue: "#000000",
        hidden: ({ enableTargets, showTargetProgress }) =>
            !enableTargets || !showTargetProgress,
    },
    enableTimeTracking: {
        type: ControlType.Boolean,
        title: "Enable Time Tracking",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showTimeStats: {
        type: ControlType.Boolean,
        title: "Show Time Stats",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ enableTimeTracking }) => !enableTimeTracking,
    },
    trackingPeriod: {
        type: ControlType.Enum,
        title: "Tracking Period",
        defaultValue: "daily",
        options: ["daily", "weekly", "monthly"],
        optionTitles: ["Daily", "Weekly", "Monthly"],
        hidden: ({ enableTimeTracking, showTimeStats }) =>
            !enableTimeTracking || !showTimeStats,
    },
    resetStatsDaily: {
        type: ControlType.Boolean,
        title: "Reset Stats Daily",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ enableTimeTracking, showTimeStats, trackingPeriod }) =>
            !enableTimeTracking || !showTimeStats || trackingPeriod !== "daily",
    },
    showDetailedStats: {
        type: ControlType.Boolean,
        title: "Show Detailed Stats",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ enableTimeTracking, showTimeStats, trackingPeriod }) =>
            !enableTimeTracking || !showTimeStats || trackingPeriod !== "daily",
    },

})
