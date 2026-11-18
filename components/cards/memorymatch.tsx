import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
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


type Theme = "Emoji" | "Numbers" | "Letters" | "Custom"

type MultiplayerMode = "Solo" | "Local" | "Remote"

// Fix: define GridPreset type used by props
type GridPreset = "2x2" | "3x4" | "4x4" | "5x6" | "Custom"

type ResponsiveImageLike = {
    src: string
    srcSet?: string
    alt?: string
}

type Card = {
    id: string
    value: string
}

interface MemoryMatchProps {
    cardBackImage: ResponsiveImageLike
    matchingTheme: Theme
    customFaces: any[]
    gridPreset: GridPreset
    gridRows: number
    gridCols: number
    gap: number
    borderRadius: number
    cardFaceColor: string
    cardBackColor: string
    strokeColor: string
    strokeWidth: number
    textColor: string
    font: any
    mismatchDelayMs: number
    maxMoves: number
    winMessage: string
    loseMessage: string
    winOverlayColor: string
    loseOverlayColor: string
    showTimer: boolean
    enableHaptics: boolean
    playAgainButton: boolean
    playAgainLabel: string
    playAgainButtonColor: string
    playAgainTextColor: string
    style?: CSSProperties
    multiplayerMode: MultiplayerMode
    keepTurnOnMatch: boolean
    playerRole: "Player 1" | "Player 2"
    showMultiplayerHUD: boolean
}

/**
 * Instructions:
 * Create a Framer component that follows the Framer component rules and achieves the user's goal.
 * If the user is asking a question, answer it without creating a component.
 *
 * Goal:
 * Memory Match: "A 4x4 grid of cards. Add property controls for 'Card Back Image' and 'Matching Theme'
 */

/**
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function MemoryMatch(props: MemoryMatchProps) {
    const {
        cardBackImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Card back",
        },
        matchingTheme = "Emoji",
        customFaces = [],
        gridPreset = "4x4",
        gridRows = 4,
        gridCols = 4,
        gap = 10,
        borderRadius = 12,
        cardFaceColor = "#FFFFFF",
        cardBackColor = "#F5F5F5",
        strokeColor = "#EEEEEE",
        strokeWidth = 1,
        textColor = "#000000",
        font,
        mismatchDelayMs = 850,
        maxMoves = 0,
        winMessage = "You won!",
        loseMessage = "Game over!",
        winOverlayColor = "rgba(34,204,102,0.45)",
        loseOverlayColor = "rgba(255,85,136,0.45)",
        showTimer = true,
        enableHaptics = true,
        playAgainButton = true,
        playAgainLabel = "Play again",
        playAgainButtonColor = "rgba(0,0,0,0.85)",
        playAgainTextColor = "#FFFFFF",
        style,
        multiplayerMode = "Solo",
        keepTurnOnMatch = true,
        playerRole = "Player 1",
        showMultiplayerHUD = true,
    } = props

    const isStatic = useIsStaticRenderer()

    const haptic = useCallback(
        (pattern: number | number[]) => {
            if (isStatic) return
            if (!enableHaptics) return
            if (typeof window === "undefined") return
            const vibrate = window.navigator?.vibrate
            if (typeof vibrate !== "function") return
            try {
                vibrate(pattern)
            } catch (e) {
                // ignore
            }
        },
        [enableHaptics, isStatic],
    )

    const containerRef = useRef<HTMLDivElement>(null)
    const [columns, setColumns] = useState(4)

    const [dealReady, setDealReady] = useState(false)
    const [shuffleStage, setShuffleStage] = useState<0 | 1 | 2>(2)
    const [shuffleSeed, setShuffleSeed] = useState(1)
    const [gameId, setGameId] = useState(0)

    const dealTimeoutRef = useRef<number | null>(null)
    const shuffleTimeoutRef = useRef<number | null>(null)

    const { selectedRows, selectedCols, totalCards, pairCount } = useMemo(() => {
        const presetMap: Record<string, { r: number; c: number }> = {
            "2x2": { r: 2, c: 2 },
            "3x4": { r: 3, c: 4 },
            "4x4": { r: 4, c: 4 },
            "5x6": { r: 5, c: 6 },
        }

        const preset = presetMap[gridPreset]
        const r = gridPreset === "Custom" ? Math.max(1, Math.floor(gridRows)) : preset?.r ?? 4
        const c = gridPreset === "Custom" ? Math.max(1, Math.floor(gridCols)) : preset?.c ?? 4
        const total = Math.max(2, r * c)
        const evenTotal = total % 2 === 0 ? total : total - 1
        const pairs = Math.max(1, evenTotal / 2)

        return { selectedRows: r, selectedCols: c, totalCards: evenTotal, pairCount: pairs }
    }, [gridCols, gridPreset, gridRows])

    const rows = useMemo(() => Math.ceil(totalCards / Math.max(1, columns)), [columns, totalCards])

    useEffect(() => {
        if (isStatic) {
            startTransition(() => {
                setDealReady(true)
                setShuffleStage(2)
            })
            return
        }
        if (typeof window === "undefined") return

        if (dealTimeoutRef.current !== null) {
            window.clearTimeout(dealTimeoutRef.current)
            dealTimeoutRef.current = null
        }
        if (shuffleTimeoutRef.current !== null) {
            window.clearTimeout(shuffleTimeoutRef.current)
            shuffleTimeoutRef.current = null
        }

        startTransition(() => {
            setDealReady(false)
            setShuffleStage(1)
        })

        dealTimeoutRef.current = window.setTimeout(() => {
            dealTimeoutRef.current = null
            startTransition(() => setDealReady(true))
        }, 40) as unknown as number

        shuffleTimeoutRef.current = window.setTimeout(() => {
            shuffleTimeoutRef.current = null
            startTransition(() => setShuffleStage(2))
        }, 300) as unknown as number

        return () => {
            if (dealTimeoutRef.current !== null) {
                window.clearTimeout(dealTimeoutRef.current)
                dealTimeoutRef.current = null
            }
            if (shuffleTimeoutRef.current !== null) {
                window.clearTimeout(shuffleTimeoutRef.current)
                shuffleTimeoutRef.current = null
            }
        }
    }, [gameId, isStatic, shuffleSeed])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        if (!containerRef.current) return

        const el = containerRef.current

        const getColumnsForWidth = (w: number) => {
            if (w < 320) return 2
            if (w < 440) return 3
            return 4
        }

        const apply = (w: number) => {
            const maxByWidth = getColumnsForWidth(w)
            const next = Math.max(1, Math.min(selectedCols, maxByWidth))
            startTransition(() => setColumns((prev) => (prev === next ? prev : next)))
        }

        const ro = new ResizeObserver((entries) => {
            const entry = entries[0]
            const width = entry?.contentRect?.width ?? el.getBoundingClientRect().width
            apply(width)
        })

        ro.observe(el)
        apply(el.getBoundingClientRect().width)

        return () => ro.disconnect()
    }, [isStatic, selectedCols])

    const values = useMemo(() => {
        const emoji = ["🍓", "🌙", "⚡️", "🍀", "🎈", "🧩", "🌸", "⭐️", "🍉", "🦋", "🌈", "🔥", "🍕", "🎧", "🚀", "🧠", "🧸", "🍩", "🎯", "🏆", "🎲", "🪩", "🧊", "🧿"]
        const numbers = Array.from({ length: 30 }, (_, i) => String(i + 1))
        const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

        if (matchingTheme === "Custom") {
            return Array.from({ length: pairCount }, (_, i) => String(i))
        }
        if (matchingTheme === "Emoji") {
            return emoji.slice(0, pairCount)
        }
        if (matchingTheme === "Numbers") {
            return numbers.slice(0, pairCount)
        }
        return letters.slice(0, pairCount)
    }, [matchingTheme, pairCount])

    const makeDeck = useCallback((): Card[] => {
        const doubled: Card[] = values.flatMap((v) => [
            { id: `${v}-a`, value: v },
            { id: `${v}-b`, value: v },
        ])

        // Fisher–Yates shuffle
        const arr = doubled.slice(0, totalCards)
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    }, [totalCards, values])

    const [deck, setDeck] = useState<Card[]>(() => makeDeck())
    const [flipped, setFlipped] = useState<number[]>([])
    const [matched, setMatched] = useState<Record<number, true>>({})
    const [locked, setLocked] = useState(false)
    const [moves, setMoves] = useState(0)

    const isMultiplayer = multiplayerMode !== "Solo"
    const isRemote = multiplayerMode === "Remote"

    const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0)
    const currentPlayerRef = useRef<0 | 1>(0)
    const [scores, setScores] = useState<[number, number]>([0, 0])

    const myPlayerIndex = useMemo<0 | 1>(() => (playerRole === "Player 2" ? 1 : 0), [playerRole])
    const canAct = useMemo(() => {
        if (isStatic) return false
        if (!isMultiplayer) return true
        if (!isRemote) return true
        return currentPlayer === myPlayerIndex
    }, [currentPlayer, isMultiplayer, isRemote, isStatic, myPlayerIndex])

    const [remoteTurnCode, setRemoteTurnCode] = useState("")
    const [remoteError, setRemoteError] = useState("")

    const timeoutRef = useRef<number | null>(null)

    const startTimeRef = useRef<number>(0)
    const intervalRef = useRef<number | null>(null)
    const [elapsedMs, setElapsedMs] = useState(0)

    const [resetFocused, setResetFocused] = useState(false)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

    const reset = useCallback(() => {
        if (isStatic) return

        if (timeoutRef.current !== null && typeof window !== "undefined") {
            window.clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }

        if (intervalRef.current !== null && typeof window !== "undefined") {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
        }

        const now = typeof window !== "undefined" ? Date.now() : 0

        startTransition(() => {
            setDealReady(false)
            setShuffleStage(2)
            setShuffleSeed((s) => s + 1)
            setDeck(makeDeck())
            setFlipped([])
            setMatched({})
            setLocked(false)
            setMoves(0)
            setElapsedMs(0)
            setHoveredIndex(null)
            setGameId((id) => id + 1)

            if (isMultiplayer) {
                currentPlayerRef.current = 0
                setCurrentPlayer(0)
                setScores([0, 0])
            }

            if (isRemote) {
                setRemoteError("")
                setRemoteTurnCode("")
            }
        })

        startTimeRef.current = now
    }, [isMultiplayer, isRemote, isStatic, makeDeck])

    const shuffleOffsets = useMemo(() => {
        const rand = (n: number) => {
            const x = Math.sin(n) * 10000
            return x - Math.floor(x)
        }

        return Array.from({ length: totalCards }, (_, i) => {
            const r1 = rand(shuffleSeed * 997 + i * 17)
            const r2 = rand(shuffleSeed * 313 + i * 29)
            const r3 = rand(shuffleSeed * 181 + i * 43)
            return {
                x: (r1 - 0.5) * 28,
                y: (r2 - 0.5) * 28,
                r: (r3 - 0.5) * 18,
            }
        })
    }, [shuffleSeed, totalCards])

    const allMatched = useMemo(() => Object.keys(matched).length >= totalCards, [matched, totalCards])

    const gameState = useMemo<"playing" | "won" | "lost">(() => {
        if (allMatched) return "won"
        if (maxMoves > 0 && moves >= maxMoves) return "lost"
        return "playing"
    }, [allMatched, maxMoves, moves])

    const gameOver = gameState !== "playing"

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        if (!startTimeRef.current) startTimeRef.current = Date.now()

        if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
        }

        if (gameOver) return

        intervalRef.current = window.setInterval(() => {
            const next = Date.now() - startTimeRef.current
            startTransition(() => setElapsedMs(next))
        }, 250) as unknown as number

        return () => {
            if (intervalRef.current !== null) {
                window.clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [gameId, gameOver, isStatic])

    const formattedTime = useMemo(() => {
        const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
        const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
        const ss = String(totalSeconds % 60).padStart(2, "0")
        return `${mm}:${ss}`
    }, [elapsedMs])

    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null && typeof window !== "undefined") {
                window.clearTimeout(timeoutRef.current)
            }
            if (intervalRef.current !== null && typeof window !== "undefined") {
                window.clearInterval(intervalRef.current)
            }
            if (dealTimeoutRef.current !== null && typeof window !== "undefined") {
                window.clearTimeout(dealTimeoutRef.current)
            }
            if (shuffleTimeoutRef.current !== null && typeof window !== "undefined") {
                window.clearTimeout(shuffleTimeoutRef.current)
            }
        }
    }, [])

    const tryResolvePair = useCallback(
        (aIndex: number, bIndex: number) => {
            const a = deck[aIndex]
            const b = deck[bIndex]
            if (!a || !b) {
                startTransition(() => {
                    setFlipped([])
                    setLocked(false)
                })
                return
            }

            if (a.value === b.value) {
                haptic([10, 30, 10])
                startTransition(() => {
                    setMatched((prev) => ({ ...prev, [aIndex]: true, [bIndex]: true }))
                    setFlipped([])
                    setLocked(false)
                    if (isMultiplayer) {
                        setScores((prev) => {
                            const next: [number, number] = [prev[0], prev[1]]
                            next[currentPlayerRef.current] = (next[currentPlayerRef.current] ?? 0) + 1
                            return next
                        })
                        if (!keepTurnOnMatch) {
                            const nextPlayer: 0 | 1 = currentPlayerRef.current === 0 ? 1 : 0
                            currentPlayerRef.current = nextPlayer
                            setCurrentPlayer(nextPlayer)
                        }
                    }
                })
                return
            }

            if (typeof window === "undefined") {
                startTransition(() => {
                    setFlipped([])
                    setLocked(false)
                })
                return
            }

            timeoutRef.current = window.setTimeout(() => {
                timeoutRef.current = null
                startTransition(() => {
                    setFlipped([])
                    setLocked(false)
                    if (isMultiplayer) {
                        const nextPlayer: 0 | 1 = currentPlayerRef.current === 0 ? 1 : 0
                        currentPlayerRef.current = nextPlayer
                        setCurrentPlayer(nextPlayer)
                    }
                })
            }, Math.max(0, Math.min(5000, mismatchDelayMs))) as unknown as number
        },
        [deck, haptic, isMultiplayer, keepTurnOnMatch, mismatchDelayMs],
    )

    const onCardActivate = useCallback(
        (index: number) => {
            if (isStatic) return
            if (gameOver) return
            if (!canAct) return
            if (locked) return
            if (matched[index]) return
            if (flipped.includes(index)) return

            haptic(10)

            if (timeoutRef.current !== null && typeof window !== "undefined") {
                window.clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }

            if (flipped.length === 0) {
                startTransition(() => setFlipped([index]))
                return
            }

            if (flipped.length === 1) {
                const first = flipped[0]
                startTransition(() => {
                    setFlipped([first, index])
                    setLocked(true)
                    setMoves((m) => m + 1)
                })
                tryResolvePair(first, index)
                return
            }

            // Safety fallback
            startTransition(() => {
                setFlipped([index])
                setLocked(false)
            })
        },
        [canAct, flipped, gameOver, haptic, isStatic, locked, matched, tryResolvePair],
    )

    const isFlipped = useCallback(
        (index: number) => {
            return Boolean(matched[index]) || flipped.includes(index)
        },
        [flipped, matched],
    )

    const rootStyles: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            ...style,
        }),
        [style],
    )

    const containerStyles: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            gap,
            padding: gap,
            boxSizing: "border-box",
            userSelect: "none",
            touchAction: "manipulation",
        }),
        [columns, gap, rows],
    )

    const cardBaseStyles: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            aspectRatio: "1 / 1",
            borderRadius,
            border: `${strokeWidth}px solid ${strokeColor}`,
            overflow: "hidden",
            padding: 0,
            margin: 0,
            background: "transparent",
            cursor: isStatic ? "default" : "pointer",
            outline: "none",
            WebkitTapHighlightColor: "transparent",
            perspective: 900,
        }),
        [borderRadius, isStatic, strokeColor, strokeWidth],
    )

    const flipInnerBaseStyles: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transition: isStatic ? undefined : "transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            willChange: isStatic ? undefined : "transform",
        }),
        [isStatic],
    )

    const faceStyles: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: cardFaceColor,
            color: textColor,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            ...font,
        }),
        [cardFaceColor, font, textColor],
    )

    const backStyles: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            backgroundColor: cardBackColor,
            backgroundImage: cardBackImage?.src ? `url(${cardBackImage.src})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
        }),
        [cardBackColor, cardBackImage?.src],
    )

    const topOverlayStyles: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            borderRadius,
            background:
                gameState === "won" && !isStatic
                    ? winOverlayColor
                    : gameState === "lost" && !isStatic
                      ? loseOverlayColor
                      : "rgba(0,0,0,0)",
            pointerEvents: "none",
            transition: isStatic ? undefined : "background 200ms ease",
        }),
        [borderRadius, gameState, isStatic, loseOverlayColor, winOverlayColor],
    )

    const overlayLabelStyles: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 12,
            color: "#FFFFFF",
            display: gameOver && !isStatic ? "block" : "none",
            pointerEvents: "none",
            zIndex: 3,
            ...font,
            fontSize: font?.fontSize ?? "14px",
            lineHeight: font?.lineHeight ?? "1.2em",
            letterSpacing: font?.letterSpacing,
            textAlign: "center",
            width: "auto",
        }),
        [font, gameOver, isStatic],
    )

    const playAgainButtonStyles: CSSProperties = useMemo(
        () => ({
            pointerEvents: "auto",
            height: 34,
            minWidth: 132,
            borderRadius: 10,
            border: `1px solid ${strokeColor}`,
            background: playAgainButtonColor,
            color: playAgainTextColor,
            cursor: isStatic ? "default" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 12px",
            boxSizing: "border-box",
            marginTop: 10,
            outline: "none",
            WebkitTapHighlightColor: "transparent",
            ...font,
            fontSize: "14px",
            lineHeight: "1em",
        }),
        [font, isStatic, playAgainButtonColor, playAgainTextColor, strokeColor],
    )

    const overlayButtonStyles: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            border: "none",
            borderRadius,
            background: "transparent",
            cursor: isStatic ? "default" : "pointer",
            padding: 0,
        }),
        [borderRadius, isStatic],
    )

    const encodeState = useCallback((state: any) => {
        if (typeof window === "undefined") return ""
        try {
            return window.btoa(unescape(encodeURIComponent(JSON.stringify(state))))
        } catch (e) {
            return ""
        }
    }, [])

    const decodeState = useCallback((code: string) => {
        if (typeof window === "undefined") return null
        try {
            const json = decodeURIComponent(escape(window.atob(code.trim())))
            return JSON.parse(json)
        } catch (e) {
            return null
        }
    }, [])

    const makeTurnCode = useCallback(() => {
        const payload = {
            v: 1,
            deck,
            flipped: [],
            matched,
            locked: false,
            moves,
            elapsedMs,
            currentPlayer,
            scores,
            matchingTheme,
            gridPreset,
            gridRows: selectedRows,
            gridCols: selectedCols,
            totalCards,
        }
        return encodeState(payload)
    }, [currentPlayer, deck, elapsedMs, encodeState, matched, matchingTheme, moves, scores, gridCols, gridPreset, gridRows, selectedCols, selectedRows, totalCards])

    const syncFromTurnCode = useCallback(
        (code: string) => {
            const data = decodeState(code)
            if (!data || !Array.isArray(data.deck)) {
                startTransition(() => setRemoteError("Invalid turn code"))
                return
            }
            startTransition(() => {
                setRemoteError("")
                setDeck(data.deck)
                setMatched(data.matched ?? {})
                setFlipped([])
                setLocked(false)
                setMoves(Number.isFinite(data.moves) ? data.moves : 0)
                const nextElapsed = Number.isFinite(data.elapsedMs) ? data.elapsedMs : 0
                setElapsedMs(nextElapsed)
                startTimeRef.current = typeof window !== "undefined" ? Date.now() - nextElapsed : 0
                setGameId((id) => id + 1)
                const nextPlayer: 0 | 1 = data.currentPlayer === 1 ? 1 : 0
                currentPlayerRef.current = nextPlayer
                setCurrentPlayer(nextPlayer)
                setScores(Array.isArray(data.scores) ? [data.scores[0] ?? 0, data.scores[1] ?? 0] : [0, 0])
            })
        },
        [decodeState],
    )

    useEffect(() => {
        currentPlayerRef.current = currentPlayer
    }, [currentPlayer])

    useEffect(() => {
        if (!isRemote) return
        // keep current code updated for sharing
        const code = makeTurnCode()
        startTransition(() => setRemoteTurnCode(code))
    }, [currentPlayer, isRemote, makeTurnCode, matched, moves, scores])

    return (
        <div style={rootStyles}>
            <div
                aria-label="Game controls"
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: `${gap}px ${gap}px 0 ${gap}px`,
                    boxSizing: "border-box",
                    flex: "0 0 auto",
                }}
            >
                {!isStatic && showTimer && (
                    <div
                        aria-label="Game time"
                        style={{
                            height: 34,
                            borderRadius: 10,
                            border: `1px solid ${strokeColor}`,
                            background: "rgba(255,255,255,0.85)",
                            backdropFilter: "blur(6px)",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0 10px",
                            boxSizing: "border-box",
                            pointerEvents: "none",
                        }}
                    >
                        <span
                            style={{
                                ...font,
                                color: "#000",
                                fontSize: "14px",
                                lineHeight: "1em",
                                minWidth: "max-content",
                            }}
                        >
                            {formattedTime}
                        </span>
                    </div>
                )}

                {!isStatic && (
                    <button
                        type="button"
                        aria-label="Reset game"
                        title="Reset game"
                        onClick={reset}
                        onFocus={() => startTransition(() => setResetFocused(true))}
                        onBlur={() => startTransition(() => setResetFocused(false))}
                        style={{
                            height: 34,
                            minWidth: 88,
                            borderRadius: 10,
                            border: resetFocused ? "2px solid rgba(0,0,0,0.95)" : `1px solid ${strokeColor}`,
                            background: "rgba(0,0,0,0.85)",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                            backdropFilter: "blur(6px)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            padding: "0 12px",
                            boxSizing: "border-box",
                            outline: "none",
                        }}
                    >
                        <span style={{ ...font, color: "#fff", fontSize: "14px", lineHeight: "1em", minWidth: "max-content" }}>
                            Reset
                        </span>
                        <span style={{ ...font, color: "#fff", fontSize: "16px", lineHeight: "1em", minWidth: "max-content" }}>
                            ↻
                        </span>
                    </button>
                )}
            </div>

            <div
                ref={containerRef}
                style={{ ...containerStyles, paddingTop: gap }}
                aria-label="Memory match grid"
                role="grid"
            >
                {deck.slice(0, totalCards).map((card, index) => {
                    const showFace = isStatic ? false : isFlipped(index)
                    const disabled =
                        isStatic ||
                        gameOver ||
                        locked ||
                        Boolean(matched[index]) ||
                        (flipped.length === 2 && !showFace)
                    const isHovered = hoveredIndex === index && !disabled
                    const label = showFace
                        ? matchingTheme === "Custom"
                            ? `Card ${index + 1}: face`
                            : `Card ${index + 1}: ${card.value}`
                        : `Card ${index + 1}: hidden`

                    const dealDelay = Math.min(220, index * 16)
                    const baseScale = dealReady ? 1 : 0.94
                    const hoverScale = isHovered ? 1.02 : 1

                    const shuffle = shuffleOffsets[index] ?? { x: 0, y: 0, r: 0 }
                    const shuffleActive = shuffleStage === 1

                    return (
                        <button
                            key={card.id}
                            type="button"
                            style={{
                                ...cardBaseStyles,
                                opacity: dealReady ? 1 : 0,
                                transform: shuffleActive
                                    ? `translate3d(${shuffle.x}px, ${shuffle.y}px, 0) rotate(${shuffle.r}deg) scale(${0.94})`
                                    : `scale(${baseScale * hoverScale})`,
                                boxShadow: isHovered ? "0 10px 22px rgba(0,0,0,0.12)" : "none",
                                transition: isStatic
                                    ? undefined
                                    : shuffleActive
                                      ? `transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 180ms ease`
                                      : `opacity 220ms ease ${dealDelay}ms, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1) ${dealDelay}ms, box-shadow 180ms ease`,
                            }}
                            onClick={disabled ? undefined : () => onCardActivate(index)}
                            onMouseEnter={
                                disabled
                                    ? undefined
                                    : () => startTransition(() => setHoveredIndex(index))
                            }
                            onMouseLeave={() => startTransition(() => setHoveredIndex(null))}
                            onKeyDown={(e) => {
                                if (disabled) return
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    onCardActivate(index)
                                }
                            }}
                            aria-label={label}
                            aria-disabled={disabled}
                            role="gridcell"
                        >
                            <div
                                style={{
                                    ...flipInnerBaseStyles,
                                    transform: showFace ? "rotateY(180deg)" : "rotateY(0deg)",
                                }}
                            >
                                <div style={backStyles} />
                                <div style={faceStyles}>
                                    {showFace ? (
                                        matchingTheme === "Custom" ? (
                                            <div
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {customFaces[Number(card.value)] ?? (
                                                    <span style={{ minWidth: "max-content" }}>{Number(card.value) + 1}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ minWidth: "max-content" }}>{card.value}</span>
                                        )
                                    ) : null}
                                </div>
                            </div>
                        </button>
                    )
                })}

                <div style={topOverlayStyles} aria-hidden={!gameOver} />
                <div style={overlayLabelStyles} aria-hidden={!gameOver}>
                    {gameState === "won" ? winMessage : gameState === "lost" ? loseMessage : null}
                    {gameOver ? (
                        <div style={{ opacity: 0.9, marginTop: 6, fontSize: "14px" }}>
                            {gameState === "won"
                                ? `Moves: ${moves}${maxMoves > 0 ? ` / ${maxMoves}` : ""}${showTimer ? ` · Time: ${formattedTime}` : ""}`
                                : `Moves: ${moves} / ${maxMoves}${showTimer ? ` · Time: ${formattedTime}` : ""}`}
                        </div>
                    ) : null}
                    {gameOver && !isStatic && playAgainButton ? (
                        <button type="button" aria-label={playAgainLabel} onClick={reset} style={playAgainButtonStyles}>
                            {playAgainLabel}
                        </button>
                    ) : null}
                </div>

                {/* Multiplayer HUD */}
                {!isStatic && showMultiplayerHUD && isMultiplayer && (
                    <div
                        aria-label="Multiplayer status"
                        style={{
                            position: "absolute",
                            top: gap + (showTimer ? 44 : 0),
                            left: gap,
                            borderRadius: 10,
                            border: `1px solid ${strokeColor}`,
                            background: "rgba(255,255,255,0.9)",
                            backdropFilter: "blur(6px)",
                            padding: "8px 10px",
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            minWidth: 180,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                            <span
                                style={{
                                    ...font,
                                    color: "#000",
                                    fontSize: "13px",
                                    lineHeight: "1em",
                                    minWidth: "max-content",
                                }}
                            >
                                {multiplayerMode === "Local"
                                    ? `Turn: Player ${currentPlayer + 1}`
                                    : `You: ${playerRole} · Turn: Player ${currentPlayer + 1}`}
                            </span>
                            <span
                                style={{
                                    ...font,
                                    color: "#000",
                                    fontSize: "13px",
                                    lineHeight: "1em",
                                    minWidth: "max-content",
                                    opacity: 0.85,
                                }}
                            >
                                {`Score ${scores[0]}–${scores[1]}`}
                            </span>
                        </div>

                        {isRemote && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button
                                        type="button"
                                        aria-label="Copy turn code"
                                        onClick={() => {
                                            if (typeof window === "undefined") return
                                            const code = makeTurnCode()
                                            startTransition(() => setRemoteTurnCode(code))
                                            if (navigator?.clipboard?.writeText) {
                                                navigator.clipboard.writeText(code).catch(() => {})
                                            }
                                        }}
                                        style={{
                                            ...font,
                                            fontSize: "12px",
                                            lineHeight: "1em",
                                            padding: "6px 8px",
                                            borderRadius: 8,
                                            border: `1px solid ${strokeColor}`,
                                            background: "#fff",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Copy Turn
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Paste and sync turn code"
                                        onClick={() => syncFromTurnCode(remoteTurnCode)}
                                        style={{
                                            ...font,
                                            fontSize: "12px",
                                            lineHeight: "1em",
                                            padding: "6px 8px",
                                            borderRadius: 8,
                                            border: `1px solid ${strokeColor}`,
                                            background: "#fff",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Sync
                                    </button>
                                </div>
                                <input
                                    aria-label="Turn code"
                                    value={remoteTurnCode}
                                    onChange={(e) => startTransition(() => setRemoteTurnCode(e.target.value))}
                                    style={{
                                        ...font,
                                        fontSize: "12px",
                                        lineHeight: "1.2em",
                                        padding: "6px 8px",
                                        borderRadius: 8,
                                        border: `1px solid ${strokeColor}`,
                                        outline: "none",
                                        width: "100%",
                                        boxSizing: "border-box",
                                    }}
                                    placeholder="Paste turn code from the other player"
                                />
                                {remoteError ? (
                                    <span style={{ ...font, fontSize: "12px", lineHeight: "1.1em", color: "#b00020" }}>
                                        {remoteError}
                                    </span>
                                ) : null}
                                {!canAct ? (
                                    <span style={{ ...font, fontSize: "12px", lineHeight: "1.1em", color: "#000", opacity: 0.8 }}>
                                        Waiting for the other player.
                                    </span>
                                ) : null}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(MemoryMatch, {
    cardBackImage: {
        type: ControlType.ResponsiveImage,
        title: "Card Back Image",
    },
    matchingTheme: {
        type: ControlType.Enum,
        title: "Matching Theme",
        options: ["Emoji", "Numbers", "Letters", "Custom"],
        optionTitles: ["Emoji", "Numbers", "Letters", "Custom"],
        defaultValue: "Emoji",
        displaySegmentedControl: true,
    },
    customFaces: {
        type: ControlType.Array,
        title: "Custom Faces",
        control: {
            type: ControlType.ComponentInstance,
        },
        maxCount: 15,
        defaultValue: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        hidden: ({ matchingTheme }) => matchingTheme !== "Custom",
    },
    gridPreset: {
        type: ControlType.Enum,
        title: "Grid Size",
        options: ["2x2", "3x4", "4x4", "5x6", "Custom"],
        optionTitles: ["2×2", "3×4", "4×4", "5×6", "Custom"],
        defaultValue: "4x4",
    },
    gridRows: {
        type: ControlType.Number,
        title: "Rows",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ gridPreset }) => gridPreset !== "Custom",
    },
    gridCols: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ gridPreset }) => gridPreset !== "Custom",
    },
    maxMoves: {
        type: ControlType.Number,
        title: "Max Moves",
        defaultValue: 0,
        min: 0,
        max: 60,
        step: 1,
        description: "0 = no losing state",
    },
    winMessage: {
        type: ControlType.String,
        title: "Win Message",
        defaultValue: "You won!",
    },
    loseMessage: {
        type: ControlType.String,
        title: "Lose Message",
        defaultValue: "Game over!",
    },
    winOverlayColor: {
        type: ControlType.Color,
        title: "Win Overlay",
        defaultValue: "rgba(34,204,102,0.45)",
    },
    loseOverlayColor: {
        type: ControlType.Color,
        title: "Lose Overlay",
        defaultValue: "rgba(255,85,136,0.45)",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cardFaceColor: {
        type: ControlType.Color,
        title: "Face",
        defaultValue: "#FFFFFF",
    },
    cardBackColor: {
        type: ControlType.Color,
        title: "Back",
        defaultValue: "#F5F5F5",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke",
        defaultValue: "#EEEEEE",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke W",
        defaultValue: 1,
        min: 0,
        max: 6,
        step: 1,
        unit: "px",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "22px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.1em",
            textAlign: "center",
        },
    },
    mismatchDelayMs: {
        type: ControlType.Number,
        title: "Mismatch Delay",
        defaultValue: 850,
        min: 0,
        max: 2000,
        step: 50,
        unit: "ms",
    },
    showTimer: {
        type: ControlType.Boolean,
        title: "Timer",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    enableHaptics: {
        type: ControlType.Boolean,
        title: "Haptics",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    playAgainButton: {
        type: ControlType.Boolean,
        title: "Play Again",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    playAgainLabel: {
        type: ControlType.String,
        title: "Play Label",
        defaultValue: "Play again",
        hidden: ({ playAgainButton }) => !playAgainButton,
    },
    playAgainButtonColor: {
        type: ControlType.Color,
        title: "Play BG",
        defaultValue: "#000000",
        hidden: ({ playAgainButton }) => !playAgainButton,
    },
    playAgainTextColor: {
        type: ControlType.Color,
        title: "Play Text",
        defaultValue: "#FFFFFF",
        hidden: ({ playAgainButton }) => !playAgainButton,
    },
    multiplayerMode: {
        type: ControlType.Enum,
        title: "Multiplayer",
        options: ["Solo", "Local", "Remote"],
        optionTitles: ["Solo", "Two Players (Same Device)", "Remote (Turn Code)"],
        defaultValue: "Solo",
    },
    keepTurnOnMatch: {
        type: ControlType.Boolean,
        title: "Keep Turn",
        defaultValue: true,
        enabledTitle: "On Match",
        disabledTitle: "Switch",
        hidden: ({ multiplayerMode }) => multiplayerMode === "Solo",
    },
    playerRole: {
        type: ControlType.Enum,
        title: "You Are",
        options: ["Player 1", "Player 2"],
        optionTitles: ["Player 1", "Player 2"],
        defaultValue: "Player 1",
        hidden: ({ multiplayerMode }) => multiplayerMode !== "Remote",
    },
    showMultiplayerHUD: {
        type: ControlType.Boolean,
        title: "Multiplayer HUD",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ multiplayerMode }) => multiplayerMode === "Solo",
    },
})