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

import { AnimatePresence, motion, useInView } from "framer-motion"

interface MyComponentProps {
    audio: string
    title: string
    autoplay: boolean
    accentColor: string
    backgroundColor: string
    buttonColor: string
    trackColor: string
    mutedColor: string
    controlHoverColor: string
    borderRadius: number
    waveBars: number
    waveGap: number
    waveOpacity: number
    waveMinHeightPct: number
    waveMaxHeightPct: number
    waveBarWidth: number
    waveHeightScale: number
    waveOverflow: boolean
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 */
export default function ListenToArticlePlayer(props: MyComponentProps) {
    const {
        audio = "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3",
        title = "Listen to article",
        autoplay = false,
        accentColor = "#FFFFFF",
        backgroundColor = "#111111",
        buttonColor = "#202020",
        trackColor = "rgba(255,255,255,0.15)",
        mutedColor = "rgba(255,255,255,0.6)",
        controlHoverColor = "rgba(255,255,255,0.14)",
        borderRadius = 16,
        waveBars = 34,
        waveGap = 3,
        waveOpacity = 0.95,
        waveMinHeightPct = 18,
        waveMaxHeightPct = 90,
        waveBarWidth = 3,
        waveHeightScale = 1.4,
        waveOverflow = true,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const progressRef = React.useRef<HTMLDivElement | null>(null)
    const waveAreaRef = React.useRef<HTMLDivElement | null>(null)

    const audioRef = React.useRef<HTMLAudioElement | null>(null)
    const isDraggingRef = React.useRef(false)

    const audioContextRef = React.useRef<AudioContext | null>(null)
    const analyserRef = React.useRef<AnalyserNode | null>(null)
    const sourceNodeRef = React.useRef<MediaElementAudioSourceNode | null>(null)
    const frequencyDataRef = React.useRef<Uint8Array | null>(null)

    const animationFrameRef = React.useRef<number | null>(null)
    const phaseRef = React.useRef(0)
    const smoothedBarsRef = React.useRef<number[]>([])

    const webAudioAvailableRef = React.useRef(true)

    const isInView = useInView(containerRef, {
        amount: 0.2,
    })

    const [isPlaying, setIsPlaying] = React.useState(false)
    const [hasStarted, setHasStarted] = React.useState(false)
    const [currentTime, setCurrentTime] = React.useState(0)
    const [audioDuration, setAudioDuration] = React.useState(0)
    const [playbackRate, setPlaybackRate] = React.useState(1)

    const [waveSize, setWaveSize] = React.useState({
        width: 320,
        height: 24,
    })

    const [barHeights, setBarHeights] = React.useState<number[]>(
        Array.from({ length: waveBars }, () => 6)
    )

    /*
     * ---------------------------------------------------------
     * AUDIO ANALYSER
     * ---------------------------------------------------------
     */

    const ensureAudioAnalyser = React.useCallback(
        (audioElement: HTMLAudioElement) => {
            if (typeof window === "undefined") return

            const AudioContextCtor =
                window.AudioContext ||
                (
                    window as Window & {
                        webkitAudioContext?: typeof AudioContext
                    }
                ).webkitAudioContext

            if (!AudioContextCtor) {
                webAudioAvailableRef.current = false
                return
            }

            try {
                if (!audioContextRef.current) {
                    audioContextRef.current = new AudioContextCtor()
                }

                if (!analyserRef.current) {
                    analyserRef.current =
                        audioContextRef.current.createAnalyser()

                    analyserRef.current.fftSize = 256
                    analyserRef.current.smoothingTimeConstant = 0.7
                }

                if (!sourceNodeRef.current) {
                    sourceNodeRef.current =
                        audioContextRef.current.createMediaElementSource(
                            audioElement
                        )

                    sourceNodeRef.current.connect(analyserRef.current)

                    analyserRef.current.connect(
                        audioContextRef.current.destination
                    )
                }

                frequencyDataRef.current = new Uint8Array(
                    analyserRef.current.frequencyBinCount
                )

                webAudioAvailableRef.current = true
            } catch (_error) {
                webAudioAvailableRef.current = false
            }
        },
        []
    )

    /*
     * ---------------------------------------------------------
     * AUDIO LIFECYCLE
     * ---------------------------------------------------------
     */

    React.useEffect(() => {
        if (isStatic) return

        const audioElement = new Audio()

        audioRef.current = audioElement
        audioElement.preload = "metadata"
        audioElement.crossOrigin = "anonymous"

        ensureAudioAnalyser(audioElement)

        const handlePlay = () => {
            if (audioContextRef.current?.state === "suspended") {
                audioContextRef.current.resume().catch(() => {})
            }

            React.startTransition(() => {
                setIsPlaying(true)
                setHasStarted(true)
            })
        }

        const handlePause = () => {
            React.startTransition(() => {
                setIsPlaying(false)
            })
        }

        const handleEnded = () => {
            audioElement.currentTime = 0

            React.startTransition(() => {
                setIsPlaying(false)
                setHasStarted(false)
                setCurrentTime(0)
            })
        }

        const handleTimeUpdate = () => {
            React.startTransition(() => {
                setCurrentTime(audioElement.currentTime)
            })
        }

        const handleLoadedMetadata = () => {
            if (audioElement.duration && !isNaN(audioElement.duration)) {
                React.startTransition(() => {
                    setAudioDuration(audioElement.duration)
                })
            }
        }

        audioElement.addEventListener("play", handlePlay)
        audioElement.addEventListener("pause", handlePause)
        audioElement.addEventListener("ended", handleEnded)
        audioElement.addEventListener("timeupdate", handleTimeUpdate)
        audioElement.addEventListener("loadedmetadata", handleLoadedMetadata)

        if (audio) {
            audioElement.src = audio
            audioElement.load()
        }

        if (autoplay && audio) {
            audioElement.play().catch(() => {})
        }

        return () => {
            audioElement.pause()
            audioElement.removeAttribute("src")

            audioElement.removeEventListener("play", handlePlay)
            audioElement.removeEventListener("pause", handlePause)
            audioElement.removeEventListener("ended", handleEnded)
            audioElement.removeEventListener("timeupdate", handleTimeUpdate)
            audioElement.removeEventListener(
                "loadedmetadata",
                handleLoadedMetadata
            )

            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect()
                sourceNodeRef.current = null
            }

            if (analyserRef.current) {
                analyserRef.current.disconnect()
                analyserRef.current = null
            }

            if (audioContextRef.current) {
                audioContextRef.current.suspend().catch(() => {})
            }
        }
    }, [audio, autoplay, isStatic, ensureAudioAnalyser])

    /*
     * ---------------------------------------------------------
     * WAVEFORM SIZE
     * ---------------------------------------------------------
     *
     * The waveform is no longer treated as a 24px-high object.
     *
     * Its visual height is calculated independently.
     * The controls are then centered against this height.
     */

    React.useEffect(() => {
        if (isStatic || typeof window === "undefined" || !waveAreaRef.current) {
            return
        }

        const element = waveAreaRef.current

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0]

            if (!entry) return

            React.startTransition(() => {
                setWaveSize({
                    width: Math.max(1, entry.contentRect.width),
                    height: Math.max(24, entry.contentRect.height),
                })
            })
        })

        observer.observe(element)

        return () => observer.disconnect()
    }, [isStatic])

    /*
     * ---------------------------------------------------------
     * WAVEFORM GEOMETRY
     * ---------------------------------------------------------
     */

    const waveformGeometry = React.useMemo(() => {
        const trackHeight = 24

        const minPct = Math.min(waveMinHeightPct, waveMaxHeightPct)

        const maxPct = Math.max(waveMinHeightPct, waveMaxHeightPct)

        const scale = Math.max(0.1, waveHeightScale || 1)

        /*
         * Maximum requested visual bar height.
         */
        const maxBarHeight = Math.max(1, (maxPct / 100) * trackHeight * scale)

        /*
         * Minimum requested visual bar height.
         */
        const minBarHeight = Math.max(1, (minPct / 100) * trackHeight * scale)

        /*
         * Give the waveform enough vertical room
         * so it doesn't depend on CSS overflow.
         */
        const visualHeight = Math.max(trackHeight, Math.ceil(maxBarHeight + 8))

        /*
         * Keep the waveform centered.
         */
        const centerY = visualHeight / 2

        return {
            trackHeight,
            minBarHeight,
            maxBarHeight,
            visualHeight,
            centerY,
        }
    }, [waveMinHeightPct, waveMaxHeightPct, waveHeightScale])

    /*
     * ---------------------------------------------------------
     * PLAYER HEIGHT
     * ---------------------------------------------------------
     *
     * The player grows only when the waveform needs it.
     * This keeps the controls centered with the actual waveform.
     */

    const playerHeight = React.useMemo(() => {
        return Math.max(50, waveformGeometry.visualHeight + 24)
    }, [waveformGeometry.visualHeight])

    /*
     * ---------------------------------------------------------
     * WAVEFORM ANIMATION
     * ---------------------------------------------------------
     */

    React.useEffect(() => {
        if (isStatic || !isInView) return

        const tick = () => {
            const minPx = waveformGeometry.minBarHeight
            const maxPx = waveformGeometry.maxBarHeight

            const rangePx = Math.max(1, maxPx - minPx)

            const next = new Array(waveBars).fill(minPx)

            const analyser = analyserRef.current
            const frequencyData = frequencyDataRef.current

            if (
                isPlaying &&
                webAudioAvailableRef.current &&
                analyser &&
                frequencyData &&
                hasStarted
            ) {
                analyser.getByteFrequencyData(frequencyData)

                for (let i = 0; i < waveBars; i++) {
                    const idx = Math.floor(
                        (i / Math.max(1, waveBars - 1)) *
                            (frequencyData.length - 1)
                    )

                    const amplitude = frequencyData[idx] / 255

                    next[i] = minPx + amplitude * rangePx
                }
            } else {
                phaseRef.current += 0.06

                for (let i = 0; i < waveBars; i++) {
                    const sine =
                        0.5 +
                        0.5 *
                            Math.sin(
                                phaseRef.current + i * 0.35 + currentTime * 0.2
                            )

                    next[i] = minPx + sine * rangePx * 0.26
                }
            }

            const previous =
                smoothedBarsRef.current.length === waveBars
                    ? smoothedBarsRef.current
                    : Array.from(
                          {
                              length: waveBars,
                          },
                          () => minPx
                      )

            const eased = next.map((target, i) => {
                const last = previous[i] ?? minPx

                return last + (target - last) * 0.22
            })

            smoothedBarsRef.current = eased

            React.startTransition(() => {
                setBarHeights(eased)
            })

            animationFrameRef.current = window.requestAnimationFrame(tick)
        }

        animationFrameRef.current = window.requestAnimationFrame(tick)

        return () => {
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current)

                animationFrameRef.current = null
            }
        }
    }, [
        isStatic,
        isPlaying,
        isInView,
        hasStarted,
        currentTime,
        waveBars,
        waveformGeometry,
    ])

    /*
     * ---------------------------------------------------------
     * CLEANUP
     * ---------------------------------------------------------
     */

    React.useEffect(() => {
        return () => {
            if (
                typeof window !== "undefined" &&
                animationFrameRef.current !== null
            ) {
                window.cancelAnimationFrame(animationFrameRef.current)
            }

            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {})

                audioContextRef.current = null
            }
        }
    }, [])

    /*
     * ---------------------------------------------------------
     * PLAY / PAUSE
     * ---------------------------------------------------------
     */

    const togglePlayback = React.useCallback(
        (e?: React.MouseEvent | React.KeyboardEvent) => {
            if (e) e.stopPropagation()

            if (isStatic) return

            const audioElement = audioRef.current

            if (!audioElement || !audio) return

            if (audioElement.paused) {
                audioElement.play().catch(() => {})
            } else {
                audioElement.pause()
            }
        },
        [audio, isStatic]
    )

    /*
     * ---------------------------------------------------------
     * SPEED
     * ---------------------------------------------------------
     */

    const cycleSpeed = React.useCallback(
        (e?: React.MouseEvent) => {
            if (e) e.stopPropagation()

            if (isStatic) return

            const rates = [1, 1.25, 1.5, 2]

            React.startTransition(() => {
                setPlaybackRate((previousRate) => {
                    const nextIndex =
                        (rates.indexOf(previousRate) + 1) % rates.length

                    const newRate = rates[nextIndex]

                    if (audioRef.current) {
                        audioRef.current.playbackRate = newRate
                    }

                    return newRate
                })
            })
        },
        [isStatic]
    )

    /*
     * ---------------------------------------------------------
     * KEYBOARD PLAY
     * ---------------------------------------------------------
     */

    const playPauseKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (isStatic) return

            if (event.key === " " || event.key === "Enter") {
                event.preventDefault()
                togglePlayback(event)
            }
        },
        [togglePlayback, isStatic]
    )

    /*
     * ---------------------------------------------------------
     * TIME
     * ---------------------------------------------------------
     */

    const formatTime = React.useCallback((timeInSeconds: number) => {
        if (!timeInSeconds || isNaN(timeInSeconds)) {
            return "0:00"
        }

        const minutes = Math.floor(timeInSeconds / 60)

        const seconds = Math.floor(timeInSeconds % 60)

        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
    }, [])

    const progress = React.useMemo(() => {
        if (!audioDuration || audioDuration <= 0) {
            return 0
        }

        return Math.min(1, Math.max(0, currentTime / audioDuration))
    }, [currentTime, audioDuration])

    /*
     * ---------------------------------------------------------
     * BAR GEOMETRY
     * ---------------------------------------------------------
     */

    const barGeometry = React.useMemo(() => {
        const barsSafe = Math.max(2, waveBars)

        const width = Math.max(1, waveSize.width)

        const totalGap = waveGap * (barsSafe - 1)

        const maxNonOverlapWidth = (width - totalGap) / barsSafe

        const barWidth = Math.max(
            0.5,
            Math.min(
                waveBarWidth,
                Number.isFinite(maxNonOverlapWidth)
                    ? maxNonOverlapWidth
                    : waveBarWidth
            )
        )

        const usableWidth = Math.max(0, width - barWidth)

        const stepX = barsSafe > 1 ? usableWidth / (barsSafe - 1) : 0

        return {
            barsSafe,
            width,
            barWidth,
            stepX,
        }
    }, [waveBars, waveSize.width, waveGap, waveBarWidth])

    /*
     * ---------------------------------------------------------
     * SEEKING
     * ---------------------------------------------------------
     */

    const seekToRatio = React.useCallback(
        (ratio: number) => {
            if (isStatic || !audioRef.current || !audioDuration) {
                return
            }

            const clamped = Math.min(1, Math.max(0, ratio))

            audioRef.current.currentTime = clamped * audioDuration
        },
        [audioDuration, isStatic]
    )

    const seekFromClientX = React.useCallback(
        (clientX: number) => {
            if (!progressRef.current) return

            const rect = progressRef.current.getBoundingClientRect()

            if (rect.width <= 0) return

            const ratio = (clientX - rect.left) / rect.width

            seekToRatio(ratio)
        },
        [seekToRatio]
    )

    const onProgressPointerDown = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return

            event.preventDefault()

            isDraggingRef.current = true

            event.currentTarget.setPointerCapture(event.pointerId)

            seekFromClientX(event.clientX)
        },
        [isStatic, seekFromClientX]
    )

    const onProgressPointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (!isDraggingRef.current || isStatic) {
                return
            }

            seekFromClientX(event.clientX)
        },
        [isStatic, seekFromClientX]
    )

    const onProgressPointerUp = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isStatic) return

            isDraggingRef.current = false

            try {
                event.currentTarget.releasePointerCapture(event.pointerId)
            } catch {}
        },
        [isStatic]
    )

    const onProgressKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (isStatic || !audioRef.current) {
                return
            }

            const step = event.shiftKey ? 10 : 5

            if (event.key === "ArrowRight") {
                event.preventDefault()

                audioRef.current.currentTime = Math.min(
                    audioDuration || 0,
                    audioRef.current.currentTime + step
                )
            } else if (event.key === "ArrowLeft") {
                event.preventDefault()

                audioRef.current.currentTime = Math.max(
                    0,
                    audioRef.current.currentTime - step
                )
            } else if (event.key === "Home") {
                event.preventDefault()

                audioRef.current.currentTime = 0
            } else if (event.key === "End" && audioDuration) {
                event.preventDefault()

                audioRef.current.currentTime = audioDuration
            }
        },
        [audioDuration, isStatic]
    )

    /*
     * ---------------------------------------------------------
     * TEXT
     * ---------------------------------------------------------
     */

    const textStyle = {
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        fontWeight: 500,
        color: mutedColor,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap" as const,
        lineHeight: 1,
    }

    /*
     * ---------------------------------------------------------
     * STATIC RENDER
     * ---------------------------------------------------------
     */

    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 12,
                    padding: "12px 16px 12px 10px",
                    minHeight: playerHeight,
                    width: "100%",
                    maxWidth: 640,
                    boxSizing: "border-box",
                    outline: "none",
                    userSelect: "none",
                    color: accentColor,
                    overflow: "visible",
                    background: "transparent",
                }}
            >
                <div
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                            d="M3.5 2.2L11 7L3.5 11.8V2.2Z"
                            fill={accentColor}
                        />
                    </svg>
                </div>

                <div
                    style={{
                        ...textStyle,
                        minWidth: 36,
                    }}
                >
                    0:00
                </div>

                <div
                    style={{
                        flex: 1,
                        minHeight: waveformGeometry.visualHeight,
                        display: "flex",
                        alignItems: "center",
                        position: "relative",
                        overflow: waveOverflow ? "visible" : "hidden",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: "50%",
                            height: 24,
                            transform: "translateY(-50%)",
                            borderRadius: 8,
                            background: trackColor,
                            overflow: waveOverflow ? "visible" : "hidden",
                        }}
                    >
                        <svg
                            width="100%"
                            height={waveformGeometry.visualHeight}
                            viewBox={`0 0 ${Math.max(1, waveSize.width)} ${
                                waveformGeometry.visualHeight
                            }`}
                            preserveAspectRatio="none"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: "50%",
                                transform: "translateY(-50%)",
                                overflow: "visible",
                            }}
                        >
                            {Array.from({
                                length: Math.max(2, waveBars),
                            }).map((_, i) => {
                                const minPx = waveformGeometry.minBarHeight

                                const maxPx = waveformGeometry.maxBarHeight

                                const h =
                                    minPx +
                                    (0.2 + Math.sin(i * 0.45) * 0.08) *
                                        (maxPx - minPx)

                                const x =
                                    ((i + 0.5) / Math.max(2, waveBars)) *
                                    Math.max(1, waveSize.width)

                                return (
                                    <line
                                        key={`static-wave-${i}`}
                                        x1={x}
                                        y1={
                                            waveformGeometry.visualHeight / 2 -
                                            h / 2
                                        }
                                        x2={x}
                                        y2={
                                            waveformGeometry.visualHeight / 2 +
                                            h / 2
                                        }
                                        stroke={accentColor}
                                        strokeWidth={waveBarWidth}
                                        strokeLinecap="round"
                                        opacity={waveOpacity}
                                    />
                                )
                            })}
                        </svg>
                    </div>
                </div>

                <div
                    style={{
                        ...textStyle,
                        minWidth: 36,
                    }}
                >
                    0:00
                </div>

                <div
                    style={{
                        minWidth: 28,
                        height: 24,
                        borderRadius: 999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: accentColor,
                        flexShrink: 0,
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    1x
                </div>
            </div>
        )
    }

    /*
     * ---------------------------------------------------------
     * LIVE PLAYER
     * ---------------------------------------------------------
     */

    return (
        <motion.div
            ref={containerRef}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{
                opacity: {
                    duration: 0.2,
                    ease: "easeInOut",
                },
            }}
            style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 12,
                padding: "12px 16px 12px 10px",
                minHeight: playerHeight,
                width: "100%",
                maxWidth: 640,
                boxSizing: "border-box",
                outline: "none",
                userSelect: "none",
                color: accentColor,
                overflow: "visible",
                background: "transparent",
            }}
            aria-label={title}
        >
            {/* PLAY BUTTON */}

            <motion.div
                role="button"
                tabIndex={0}
                aria-label={
                    isPlaying ? "Pause article audio" : "Play article audio"
                }
                onClick={togglePlayback}
                onKeyDown={playPauseKeyDown}
                initial={{
                    backgroundColor: "rgba(0,0,0,0)",
                    scale: 1,
                }}
                whileHover={{
                    scale: 1.06,
                    backgroundColor: controlHoverColor,
                }}
                whileTap={{
                    scale: 0.9,
                    backgroundColor: controlHoverColor,
                }}
                whileFocus={{
                    boxShadow: `0 0 0 2px ${accentColor}66`,
                }}
                transition={{
                    duration: 0.12,
                    ease: "easeOut",
                }}
                style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    cursor: audio ? "pointer" : "default",
                    outline: "none",
                }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isPlaying ? (
                        <motion.svg
                            key="pause"
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            initial={{
                                opacity: 0,
                                scale: 0.7,
                                rotate: -30,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                rotate: 0,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.7,
                                rotate: 30,
                            }}
                            transition={{
                                duration: 0.12,
                                ease: "easeOut",
                            }}
                        >
                            <rect
                                x="2"
                                y="1.5"
                                width="3"
                                height="11"
                                rx="1"
                                fill={accentColor}
                            />

                            <rect
                                x="9"
                                y="1.5"
                                width="3"
                                height="11"
                                rx="1"
                                fill={accentColor}
                            />
                        </motion.svg>
                    ) : (
                        <motion.svg
                            key="play"
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            initial={{
                                opacity: 0,
                                scale: 0.7,
                                rotate: 30,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                rotate: 0,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.7,
                                rotate: -30,
                            }}
                            transition={{
                                duration: 0.12,
                                ease: "easeOut",
                            }}
                        >
                            <path
                                d="M3.5 2.2L11 7L3.5 11.8V2.2Z"
                                fill={accentColor}
                            />
                        </motion.svg>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* CURRENT TIME */}

            <div
                style={{
                    ...textStyle,
                    minWidth: 36,
                }}
            >
                {formatTime(currentTime)}
            </div>

            {/* WAVEFORM */}

            <div
                ref={progressRef}
                role="slider"
                tabIndex={0}
                aria-label="Audio progress"
                aria-valuemin={0}
                aria-valuemax={audioDuration || 0}
                aria-valuenow={currentTime}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(
                    audioDuration
                )}`}
                onPointerDown={onProgressPointerDown}
                onPointerMove={onProgressPointerMove}
                onPointerUp={onProgressPointerUp}
                onPointerCancel={onProgressPointerUp}
                onKeyDown={onProgressKeyDown}
                style={{
                    position: "relative",
                    flex: 1,
                    minWidth: 0,
                    height: waveformGeometry.visualHeight,
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    outline: "none",
                    overflow: waveOverflow ? "visible" : "hidden",
                }}
            >
                <div
                    ref={waveAreaRef}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "50%",
                        height: 24,
                        transform: "translateY(-50%)",
                        borderRadius: 8,
                        background: trackColor,
                        overflow: waveOverflow ? "visible" : "hidden",
                    }}
                >
                    <svg
                        width="100%"
                        height={waveformGeometry.visualHeight}
                        viewBox={`0 0 ${Math.max(1, waveSize.width)} ${
                            waveformGeometry.visualHeight
                        }`}
                        preserveAspectRatio="none"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "block",
                            overflow: "visible",
                        }}
                    >
                        {barHeights.map((height, i) => {
                            const x =
                                barGeometry.barWidth / 2 + i * barGeometry.stepX

                            const barHeight = Math.max(1, height)

                            const opacity =
                                i / Math.max(1, barGeometry.barsSafe - 1) <=
                                progress
                                    ? waveOpacity
                                    : waveOpacity * 0.45

                            return (
                                <line
                                    key={`wave-${i}`}
                                    x1={x}
                                    y1={
                                        waveformGeometry.visualHeight / 2 -
                                        barHeight / 2
                                    }
                                    x2={x}
                                    y2={
                                        waveformGeometry.visualHeight / 2 +
                                        barHeight / 2
                                    }
                                    stroke={accentColor}
                                    strokeWidth={barGeometry.barWidth}
                                    strokeLinecap="round"
                                    opacity={opacity}
                                />
                            )
                        })}
                    </svg>

                    {/* SEEK KNOB */}

                    <motion.div
                        animate={{
                            left: `${progress * 100}%`,
                        }}
                        transition={{
                            duration: 0.12,
                            ease: "linear",
                        }}
                        style={{
                            position: "absolute",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            background: accentColor,
                            boxShadow: `0 0 0 1px ${backgroundColor}, 0 0 0 2px ${trackColor}`,
                            opacity: hasStarted ? 0.95 : 0.65,
                        }}
                    />
                </div>
            </div>

            {/* DURATION */}

            <div
                style={{
                    ...textStyle,
                    minWidth: 36,
                }}
            >
                {formatTime(audioDuration)}
            </div>

            {/* SPEED */}

            <motion.button
                type="button"
                aria-label={`Playback speed ${playbackRate}x. Click to change speed`}
                onClick={cycleSpeed}
                initial={{
                    backgroundColor: "rgba(0,0,0,0)",
                    scale: 1,
                }}
                whileHover={{
                    scale: 1.05,
                    backgroundColor: controlHoverColor,
                }}
                whileTap={{
                    scale: 0.95,
                    backgroundColor: controlHoverColor,
                }}
                transition={{
                    duration: 0.12,
                    ease: "easeOut",
                }}
                style={{
                    minWidth: 28,
                    height: 24,
                    borderRadius: 999,
                    border: "none",
                    background: "transparent",
                    color: accentColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: "0 6px",
                    flexShrink: 0,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {playbackRate}x
            </motion.button>
        </motion.div>
    )
}

/*
 * ---------------------------------------------------------
 * FRAMER CONTROLS
 * ---------------------------------------------------------
 */

addPropertyControls(ListenToArticlePlayer, {
    audio: {
        type: ControlType.File,
        allowedFileTypes: ["mp3", "wav", "ogg", "m4a", "aac"],
        title: "Audio File",
    },

    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Listen to article",
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },

    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#FFFFFF",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },

    buttonColor: {
        type: ControlType.Color,
        title: "Play Btn BG",
        defaultValue: "#202020",
    },

    trackColor: {
        type: ControlType.Color,
        title: "Progress Track",
        defaultValue: "rgba(255,255,255,0.15)",
    },

    mutedColor: {
        type: ControlType.Color,
        title: "Time Text",
        defaultValue: "rgba(255,255,255,0.6)",
    },

    controlHoverColor: {
        type: ControlType.Color,
        title: "Control Hover Flash",
        defaultValue: "rgba(255,255,255,0.14)",
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 999,
        step: 1,
    },

    waveBars: {
        type: ControlType.Number,
        title: "Wave Bars",
        defaultValue: 34,
        min: 8,
        max: 80,
        step: 1,
    },

    waveGap: {
        type: ControlType.Number,
        title: "Wave Gap",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
    },

    waveOpacity: {
        type: ControlType.Number,
        title: "Wave Opacity",
        defaultValue: 0.95,
        min: 0.1,
        max: 1,
        step: 0.05,
    },

    waveMinHeightPct: {
        type: ControlType.Number,
        title: "Wave Min %",
        defaultValue: 18,
        min: 4,
        max: 80,
        step: 1,
    },

    waveMaxHeightPct: {
        type: ControlType.Number,
        title: "Wave Max %",
        defaultValue: 90,
        min: 20,
        max: 100,
        step: 1,
    },

    waveBarWidth: {
        type: ControlType.Number,
        title: "Bar Thickness",
        defaultValue: 3,
        min: 1,
        max: 12,
        step: 0.5,
    },

    waveHeightScale: {
        type: ControlType.Number,
        title: "Bar Height Scale",
        defaultValue: 1.4,
        min: 0.5,
        max: 8,
        step: 0.1,
    },

    waveOverflow: {
        type: ControlType.Boolean,
        title: "Allow Bar Overflow",
        defaultValue: true,
    },
})
