import {
    useState,
    useEffect,
    useCallback,
    useRef,
    useId,
    CSSProperties,
    MouseEvent,
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


interface ImageItem {
    src: string
    srcSet?: string
    alt?: string
}

const getImageSrc = (img: ImageItem | string): string =>
    typeof img === "string" ? img : img.src

interface ThemeConfig {
    name: string
    title: string
    subtitle: string
    buttonText: string
    triggerText: string
    glow: string
    background: string
    lightBackground: string
}

const THEMES: { [key: string]: ThemeConfig } = {
    night: {
        name: "Night Field",
        title: "Mines",
        subtitle: "Clear the field. Flag the rest.",
        buttonText: "New Field",
        triggerText: "Play Mines",
        glow: "rgba(255,255,255,0.16)",
        background: "linear-gradient(160deg, #07080b 0%, #101319 100%)",
        lightBackground: "linear-gradient(160deg, #f4f6fa 0%, #dfe6f0 100%)",
    },
    neon: {
        name: "Neon Sweep",
        title: "Sweep",
        subtitle: "First click is always safe",
        buttonText: "Reset Grid",
        triggerText: "Open Sweep",
        glow: "rgba(129,140,248,0.22)",
        background: "linear-gradient(160deg, #06050c 0%, #100a1c 100%)",
        lightBackground: "linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)",
    },
    gold: {
        name: "Gold Vein",
        title: "Field",
        subtitle: "Beginner to expert",
        buttonText: "New Board",
        triggerText: "Start Field",
        glow: "rgba(251,191,36,0.20)",
        background: "linear-gradient(160deg, #0c0904 0%, #1a1206 100%)",
        lightBackground: "linear-gradient(160deg, #fff7ed 0%, #fde8cf 100%)",
    },
    tide: {
        name: "Tide",
        title: "Clear",
        subtitle: "Left open · right flag",
        buttonText: "Replay",
        triggerText: "Play Clear",
        glow: "rgba(45,212,191,0.20)",
        background: "linear-gradient(160deg, #04080a 0%, #081619 100%)",
        lightBackground: "linear-gradient(160deg, #ecfeff 0%, #cffafe 100%)",
    },
}

const SETTINGS: {
    [key: string]: { rows: number; cols: number; mines: number; label: string }
} = {
    beginner: { rows: 9, cols: 9, mines: 10, label: "Beginner" },
    intermediate: { rows: 16, cols: 16, mines: 40, label: "Medium" },
    expert: { rows: 16, cols: 30, mines: 99, label: "Expert" },
}

function MineIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="5" fill="#ffc93c" />
            <path
                d="M12 3v3M12 18v3M3 12h3M18 12h3"
                stroke="#fffceb"
                strokeWidth="1.6"
            />
        </svg>
    )
}

interface MinesweeperProps {
    difficulty?: string
    accentColor?: string
    demoMode?: boolean
    theme?: string
    lightMode?: boolean
    asPopup?: boolean
    trigger?: "manual" | "delay" | "scroll"
    delaySeconds?: number
    widgetPosition?: "bottom-right" | "bottom-left"
    widgetIcon?: ImageItem | string
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 620
 */
export default function MinesweeperGame(props: MinesweeperProps) {
    const {
        difficulty: difficultyProp = "beginner",
        accentColor,
        demoMode = false,
        theme = "night",
        lightMode = false,
        asPopup = false,
        trigger = "manual",
        delaySeconds = 4,
        widgetPosition = "bottom-right",
        widgetIcon,
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const demoBarRef = useRef<HTMLDivElement>(null)
    const popupCardRef = useRef<HTMLDivElement>(null)
    const widgetTriggerRef = useRef<HTMLButtonElement>(null)
    const gameRootRef = useRef<HTMLDivElement>(null)
    const gridHostRef = useRef<HTMLDivElement>(null)
    const delayTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>()
    const timerRef = useRef<ReturnType<typeof setInterval> | undefined>()
    const isVisibleRef = useRef(true)

    const [difficulty, setDifficulty] = useState(difficultyProp)
    const [board, setBoard] = useState<number[]>([])
    const [revealed, setRevealed] = useState<boolean[]>([])
    const [flagged, setFlagged] = useState<boolean[]>([])
    const [gameStatus, setGameStatus] = useState<
        "ready" | "playing" | "won" | "lost"
    >("ready")
    const [time, setTime] = useState(0)
    const [minesLeft, setMinesLeft] = useState(SETTINGS[difficultyProp].mines)
    const [firstClick, setFirstClick] = useState(true)
    const [popupOpen, setPopupOpen] = useState(!asPopup)
    const [scrollTriggered, setScrollTriggered] = useState(false)
    const [demoTheme, setDemoTheme] = useState(theme)
    const [demoAsPopup, setDemoAsPopup] = useState(asPopup)
    const [demoLightMode, setDemoLightMode] = useState(lightMode)
    const [demoBarHeight, setDemoBarHeight] = useState(72)
    const [boardScale, setBoardScale] = useState(1)

    const config = SETTINGS[difficulty] || SETTINGS.beginner
    const { rows, cols, mines } = config
    const totalCells = rows * cols
    const cellSize =
        difficulty === "expert" ? 14 : difficulty === "intermediate" ? 17 : 22
    const cardMax =
        difficulty === "expert"
            ? 560
            : difficulty === "intermediate"
              ? 500
              : 420
    const activeTheme = THEMES[demoMode ? demoTheme : theme] || THEMES.night
    const isPopupMode = demoMode ? demoAsPopup : asPopup
    const isLight = demoMode ? demoLightMode : lightMode
    const resolvedAccent = accentColor || "#ffffff"
    const widgetOnRight = widgetPosition !== "bottom-left"
    const widgetGlowStrong = activeTheme.glow.replace(
        /,\s*[\d.]+\)$/,
        ", 0.85)"
    )
    const demoOffset = demoMode ? demoBarHeight : 0
    const gridGap = 3
    const gridPad = 16
    const gridW = cols * cellSize + (cols - 1) * gridGap + gridPad
    const gridH = rows * cellSize + (rows - 1) * gridGap + gridPad

    const mode = isLight
        ? {
              ink: "#171a21",
              inkSoft: "rgba(23,26,33,0.7)",
              inkFaint: "rgba(23,26,33,0.4)",
              divider: "rgba(23,26,33,0.18)",
              surface: "rgba(255,255,255,0.65)",
              surfaceBorder: "rgba(23,26,33,0.1)",
              cardBorder: "rgba(23,26,33,0.08)",
              overlayBg: "rgba(255,255,255,0.86)",
              modalBg: "rgba(255,255,255,0.75)",
              modalBorder: "rgba(23,26,33,0.12)",
              chromeBg: "#ffffff",
              chromeBorder: "rgba(23,26,33,0.1)",
              stageBg: "#eef1f5",
              cell: "rgba(23,26,33,0.06)",
              cellOpen: "rgba(23,26,33,0.03)",
              cellBoom: "rgba(23,26,33,0.12)",
              focus: "0 0 0 2px rgba(23,26,33,0.35)",
          }
        : {
              ink: "#ffffff",
              inkSoft: "rgba(255,255,255,0.7)",
              inkFaint: "rgba(255,255,255,0.4)",
              divider: "rgba(255,255,255,0.3)",
              surface: "rgba(255,255,255,0.06)",
              surfaceBorder: "rgba(255,255,255,0.12)",
              cardBorder: "rgba(255,255,255,0.08)",
              overlayBg: "rgba(4,4,6,0.86)",
              modalBg: "rgba(255,255,255,0.06)",
              modalBorder: "rgba(255,255,255,0.16)",
              chromeBg: "rgba(10,10,15,0.92)",
              chromeBorder: "rgba(255,255,255,0.16)",
              stageBg: "#050506",
              cell: "rgba(255,255,255,0.08)",
              cellOpen: "rgba(255,255,255,0.03)",
              cellBoom: "rgba(255,255,255,0.16)",
              focus: "0 0 0 2px rgba(255,255,255,0.45)",
          }

    const numberColors = isLight
        ? [
              "",
              "#1d4ed8",
              "#15803d",
              "#b91c1c",
              "#1e3a8a",
              "#7f1d1d",
              "#0f766e",
              "#111",
              "#6b7280",
          ]
        : [
              "",
              "#93c5fd",
              "#86efac",
              "#fca5a5",
              "#bfdbfe",
              "#fecaca",
              "#5eead4",
              "#fff",
              "#9ca3af",
          ]

    useEffect(() => {
        return () => {
            clearTimeout(delayTimerRef.current)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [])

    useEffect(() => {
        if (isStatic) return
        if (!rootRef.current) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        observer.observe(rootRef.current)
        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        setPopupOpen(!isPopupMode)
    }, [isPopupMode])

    useEffect(() => {
        if (isStatic) return
        if (!isPopupMode || trigger !== "delay") return
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = setTimeout(
            () => setPopupOpen(true),
            delaySeconds * 1000
        )
        return () => clearTimeout(delayTimerRef.current)
    }, [isPopupMode, trigger, delaySeconds, isStatic])

    useEffect(() => {
        if (isStatic) return
        if (!isPopupMode || trigger !== "scroll" || !rootRef.current) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !scrollTriggered) {
                    setScrollTriggered(true)
                    setPopupOpen(true)
                }
            },
            { threshold: 0.4 }
        )
        observer.observe(rootRef.current)
        return () => observer.disconnect()
    }, [isPopupMode, trigger, isStatic, scrollTriggered])

    useEffect(() => {
        if (isStatic) return
        if (!demoMode || !demoBarRef.current) return
        const el = demoBarRef.current
        const ro = new ResizeObserver(([entry]) =>
            setDemoBarHeight(entry.contentRect.height)
        )
        ro.observe(el)
        return () => ro.disconnect()
    }, [demoMode, isStatic])

    useEffect(() => {
        if (isStatic) return
        const el = gridHostRef.current
        if (!el) return
        const apply = (w: number) => {
            const next = w <= 0 ? 1 : Math.min(1, w / gridW)
            setBoardScale(next)
        }
        apply(el.clientWidth)
        const ro = new ResizeObserver(([entry]) =>
            apply(entry.contentRect.width)
        )
        ro.observe(el)
        return () => ro.disconnect()
    }, [isStatic, gridW, popupOpen, isPopupMode])

    const wasPopupOpenRef = useRef(false)
    useEffect(() => {
        if (isStatic) return
        if (!isPopupMode || popupOpen) gameRootRef.current?.focus()
        else if (wasPopupOpenRef.current) widgetTriggerRef.current?.focus()
        wasPopupOpenRef.current = popupOpen
    }, [isPopupMode, popupOpen, isStatic])

    const initBoard = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        setBoard(Array(totalCells).fill(0))
        setRevealed(Array(totalCells).fill(false))
        setFlagged(Array(totalCells).fill(false))
        setGameStatus("ready")
        setTime(0)
        setMinesLeft(mines)
        setFirstClick(true)
    }, [totalCells, mines])

    useEffect(() => {
        if (isStatic) {
            initBoard()
            return
        }
        initBoard()
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [difficulty, initBoard, isStatic])

    const getNeighbors = (index: number) => {
        const r = Math.floor(index / cols)
        const c = index % cols
        const res: number[] = []
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue
                const nr = r + dr
                const nc = c + dc
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols)
                    res.push(nr * cols + nc)
            }
        }
        return res
    }

    const placeMines = (firstIndex: number) => {
        const newBoard = Array(totalCells).fill(0)
        let placed = 0
        while (placed < mines) {
            const idx = Math.floor(Math.random() * totalCells)
            if (idx !== firstIndex && newBoard[idx] !== -1) {
                newBoard[idx] = -1
                placed++
            }
        }
        for (let i = 0; i < totalCells; i++) {
            if (newBoard[i] === -1) continue
            let count = 0
            getNeighbors(i).forEach((n) => {
                if (newBoard[n] === -1) count++
            })
            newBoard[i] = count
        }
        setBoard(newBoard)
        return newBoard
    }

    const revealCells = (
        index: number,
        currentBoard: number[],
        currentRevealed: boolean[],
        currentFlagged: boolean[]
    ): boolean[] => {
        if (currentRevealed[index] || currentFlagged[index])
            return currentRevealed
        const next = [...currentRevealed]
        next[index] = true
        if (currentBoard[index] === 0) {
            getNeighbors(index).forEach((n) => {
                if (!next[n]) {
                    const deeper = revealCells(
                        n,
                        currentBoard,
                        next,
                        currentFlagged
                    )
                    deeper.forEach((v, i) => {
                        next[i] = v
                    })
                }
            })
        }
        return next
    }

    const handleClick = (index: number) => {
        if (isStatic) return
        if (gameStatus === "won" || gameStatus === "lost" || flagged[index])
            return
        let currentBoard = board
        if (firstClick) {
            currentBoard = placeMines(index)
            setFirstClick(false)
            setGameStatus("playing")
            timerRef.current = setInterval(() => {
                if (!isVisibleRef.current) return
                setTime((t) => t + 1)
            }, 1000)
        }
        if (currentBoard[index] === -1) {
            const allRevealed = revealed.map((_, i) =>
                currentBoard[i] === -1 ? true : revealed[i]
            )
            allRevealed[index] = true
            setRevealed(allRevealed)
            setGameStatus("lost")
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }
        const newRevealed = revealCells(index, currentBoard, revealed, flagged)
        setRevealed(newRevealed)
        const unrevealed = newRevealed.filter((r) => !r).length
        if (unrevealed === mines) {
            setGameStatus("won")
            if (timerRef.current) clearInterval(timerRef.current)
            setFlagged(currentBoard.map((v) => v === -1))
            setMinesLeft(0)
        }
    }

    const handleRightClick = (e: MouseEvent, index: number) => {
        e.preventDefault()
        if (isStatic) return
        if (gameStatus === "won" || gameStatus === "lost" || revealed[index])
            return
        const next = [...flagged]
        next[index] = !next[index]
        setFlagged(next)
        setMinesLeft((prev) => (next[index] ? prev - 1 : prev + 1))
    }

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    }

    const wrapperStyle: CSSProperties = {
        ...styles.wrapper,
        background: isLight
            ? activeTheme.lightBackground
            : activeTheme.background,
        border: `1px solid ${mode.cardBorder}`,
        maxWidth: cardMax,
        padding: difficulty === "beginner" ? "28px 22px" : "20px 16px",
        ...(isPopupMode
            ? {
                  height: "auto",
                  minHeight: 0,
                  maxHeight: `calc(100vh - ${demoOffset + 56}px)`,
                  overflow: "hidden",
              }
            : {}),
    }

    const gameCard = (
        <div
            ref={gameRootRef}
            style={wrapperStyle}
            tabIndex={0}
            role="application"
            aria-label={`${activeTheme.title} minesweeper`}
            onPointerDown={() => gameRootRef.current?.focus()}
            onFocus={(e) => {
                e.currentTarget.style.boxShadow = mode.focus
            }}
            onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none"
            }}
            lang="en"
            itemScope
            itemType="https://schema.org/VideoGame"
        >
            <meta
                itemProp="name"
                content={`${activeTheme.title} Minesweeper`}
            />
            <meta itemProp="genre" content="Puzzle" />
            <meta itemProp="gamePlatform" content="Web Browser" />
            <meta itemProp="playMode" content="SinglePlayer" />
            <meta itemProp="inLanguage" content="en" />
            <meta
                itemProp="description"
                content="Clear a minefield in the browser. Flag mines, race the clock."
            />
            <header style={styles.headerBlock}>
                <p style={{ ...styles.kicker, color: mode.inkFaint }}>
                    Browser puzzle
                </p>
                <h2
                    id={`${uid}-title`}
                    itemProp="headline"
                    style={{ ...styles.title, color: mode.ink }}
                >
                    {activeTheme.title}
                </h2>
                <div style={{ ...styles.divider, background: mode.divider }} />
                <p style={{ ...styles.subtitle, color: mode.inkFaint }}>
                    {activeTheme.subtitle}
                </p>
            </header>
            <div style={styles.scoreRow} aria-live="polite">
                {[
                    {
                        label: "Mines",
                        value: minesLeft.toString().padStart(2, "0"),
                    },
                    { label: "Time", value: formatTime(time) },
                    { label: "Level", value: config.label },
                ].map((item) => (
                    <div
                        key={item.label}
                        style={{
                            ...styles.scoreBox,
                            background: mode.surface,
                            border: `1px solid ${mode.surfaceBorder}`,
                        }}
                    >
                        <div
                            style={{
                                ...styles.scoreLabel,
                                color: mode.inkFaint,
                            }}
                        >
                            {item.label}
                        </div>
                        <div style={{ ...styles.scoreValue, color: mode.ink }}>
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>
            <div style={styles.diffRow} role="group" aria-label="Difficulty">
                {Object.keys(SETTINGS).map((level) => (
                    <button
                        key={level}
                        type="button"
                        aria-pressed={difficulty === level}
                        onClick={() => setDifficulty(level)}
                        style={{
                            ...styles.diffBtn,
                            background:
                                difficulty === level
                                    ? resolvedAccent
                                    : mode.surface,
                            color: difficulty === level ? "#0a0a0f" : mode.ink,
                            border: `1px solid ${mode.surfaceBorder}`,
                            transition: isStatic
                                ? "none"
                                : "background 0.2s ease",
                        }}
                    >
                        {SETTINGS[level].label}
                    </button>
                ))}
            </div>
            <motion.button
                type="button"
                onClick={initBoard}
                whileHover={isStatic ? undefined : { scale: 1.03 }}
                whileTap={isStatic ? undefined : { scale: 0.97 }}
                style={{
                    ...styles.button,
                    background: resolvedAccent,
                    transition: isStatic ? "none" : "transform 0.2s ease",
                }}
            >
                {activeTheme.buttonText}
            </motion.button>

            <div
                ref={gridHostRef}
                style={{ ...styles.gridWrap, maxWidth: cardMax }}
            >
                <div
                    style={{
                        height: gridH * boardScale,
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            ...styles.grid,
                            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                            border: `1px solid ${mode.surfaceBorder}`,
                            transform: `scale(${boardScale})`,
                            transformOrigin: "top center",
                        }}
                    >
                        {Array.from({ length: totalCells }).map((_, i) => {
                            const isOpen = revealed[i]
                            const isMine = board[i] === -1
                            const boom =
                                isOpen && isMine && gameStatus === "lost"
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={
                                        flagged[i]
                                            ? "Flagged"
                                            : isOpen
                                              ? isMine
                                                  ? "Mine"
                                                  : board[i] > 0
                                                    ? `${board[i]} adjacent`
                                                    : "Empty"
                                              : "Hidden cell"
                                    }
                                    onClick={() => handleClick(i)}
                                    onContextMenu={(e) =>
                                        handleRightClick(e, i)
                                    }
                                    disabled={
                                        gameStatus === "won" ||
                                        gameStatus === "lost"
                                    }
                                    style={{
                                        ...styles.cell,
                                        width: cellSize,
                                        height: cellSize,
                                        lineHeight: `${cellSize}px`,
                                        fontSize: cellSize > 16 ? 11 : 9,
                                        background: boom
                                            ? mode.cellBoom
                                            : isOpen
                                              ? mode.cellOpen
                                              : mode.cell,
                                        color:
                                            board[i] > 0 && isOpen
                                                ? numberColors[board[i]]
                                                : mode.ink,
                                        transition: isStatic
                                            ? "none"
                                            : "background 0.15s ease",
                                    }}
                                >
                                    {flagged[i] && !isOpen
                                        ? "▴"
                                        : isOpen && isMine
                                          ? "●"
                                          : isOpen && board[i] > 0
                                            ? board[i]
                                            : ""}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
            <p style={{ ...styles.hint, color: mode.inkFaint }}>
                Click to open · hold to flag
            </p>
            <AnimatePresence>
                {(gameStatus === "won" || gameStatus === "lost") && (
                    <motion.div
                        role="dialog"
                        aria-labelledby={`${uid}-end`}
                        style={{
                            ...styles.overlay,
                            background: mode.overlayBg,
                        }}
                        initial={isStatic ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={isStatic ? undefined : { opacity: 0 }}
                    >
                        <div
                            style={{
                                ...styles.modal,
                                background: mode.modalBg,
                                border: `1px solid ${mode.modalBorder}`,
                            }}
                        >
                            <h3
                                id={`${uid}-end`}
                                style={{
                                    ...styles.modalTitle,
                                    color: mode.ink,
                                }}
                            >
                                {gameStatus === "won"
                                    ? "Field cleared"
                                    : "Mine hit"}
                            </h3>
                            <div
                                style={{
                                    ...styles.modalDivider,
                                    background: mode.divider,
                                }}
                            />
                            <p
                                style={{
                                    ...styles.modalLine,
                                    color: mode.inkSoft,
                                }}
                            >
                                {formatTime(time)} · {config.label}
                            </p>
                            <button
                                type="button"
                                style={{
                                    ...styles.claimBtn,
                                    background: resolvedAccent,
                                }}
                                onClick={initBoard}
                            >
                                Play Again
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )

    const demoBar = demoMode ? (
        <div ref={demoBarRef} style={styles.demoBar}>
            <div style={styles.demoChip}>
                <div style={styles.demoDot} />
                <span style={styles.demoTitle}>Demo</span>
            </div>
            <div style={styles.demoRow}>
                <span style={styles.demoLabel}>Concept</span>
                <div style={styles.demoBtns}>
                    {Object.keys(THEMES).map((key) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={demoTheme === key}
                            onClick={() => setDemoTheme(key)}
                            style={
                                demoTheme === key
                                    ? styles.demoBtnOn
                                    : styles.demoBtnOff
                            }
                        >
                            {THEMES[key].name}
                        </button>
                    ))}
                </div>
            </div>
            <div style={styles.demoRow}>
                <span style={styles.demoLabel}>Mode</span>
                <div style={styles.demoBtns}>
                    <button
                        type="button"
                        aria-pressed={!demoLightMode}
                        onClick={() => setDemoLightMode(false)}
                        style={
                            !demoLightMode
                                ? styles.demoBtnOn
                                : styles.demoBtnOff
                        }
                    >
                        Dark
                    </button>
                    <button
                        type="button"
                        aria-pressed={demoLightMode}
                        onClick={() => setDemoLightMode(true)}
                        style={
                            demoLightMode ? styles.demoBtnOn : styles.demoBtnOff
                        }
                    >
                        Light
                    </button>
                </div>
            </div>
            <div style={styles.demoRow}>
                <span style={styles.demoLabel}>Popup Mode</span>
                <div style={styles.demoBtns}>
                    <button
                        type="button"
                        aria-pressed={demoAsPopup}
                        onClick={() => setDemoAsPopup(true)}
                        style={
                            demoAsPopup ? styles.demoBtnOn : styles.demoBtnOff
                        }
                    >
                        On
                    </button>
                    <button
                        type="button"
                        aria-pressed={!demoAsPopup}
                        onClick={() => setDemoAsPopup(false)}
                        style={
                            !demoAsPopup ? styles.demoBtnOn : styles.demoBtnOff
                        }
                    >
                        Off
                    </button>
                </div>
            </div>
            <button
                type="button"
                style={styles.demoResetBtn}
                onClick={initBoard}
            >
                Reset Field
            </button>
        </div>
    ) : null

    if (!isPopupMode) {
        return (
            <div ref={rootRef}>
                {demoMode ? (
                    <div
                        style={{
                            ...styles.inlineDemoStage,
                            paddingTop: demoOffset + 24,
                            paddingBottom: 24,
                            background: mode.stageBg,
                        }}
                    >
                        <div
                            style={{
                                ...styles.inlineDemoCardWrap,
                                maxWidth: cardMax,
                            }}
                        >
                            {gameCard}
                        </div>
                    </div>
                ) : (
                    gameCard
                )}
                {demoBar}
            </div>
        )
    }

    return (
        <div ref={rootRef}>
            <div
                style={{
                    ...styles.widgetContainer,
                    ...(widgetOnRight ? { right: 24 } : { left: 24 }),
                }}
            >
                <motion.button
                    ref={widgetTriggerRef}
                    type="button"
                    onClick={() => setPopupOpen(true)}
                    whileHover={isStatic ? undefined : { scale: 1.04 }}
                    whileTap={isStatic ? undefined : { scale: 0.97 }}
                    aria-label={activeTheme.triggerText}
                    style={{
                        ...styles.widgetPill,
                        boxShadow: `0 8px 30px ${activeTheme.glow}, 0 4px 16px rgba(0,0,0,0.4)`,
                        transition: isStatic ? "none" : "transform 0.2s ease",
                    }}
                >
                    <span style={styles.widgetIconCircle}>
                        {widgetIcon ? (
                            <img
                                src={getImageSrc(widgetIcon)}
                                alt=""
                                style={styles.widgetIconImg}
                            />
                        ) : (
                            <MineIcon />
                        )}
                    </span>
                    <span style={styles.widgetPillTextCol}>
                        <span style={styles.widgetPillEyebrow}>
                            {activeTheme.triggerText}
                        </span>
                        <motion.span
                            style={styles.widgetPillText}
                            animate={
                                isStatic
                                    ? undefined
                                    : {
                                          textShadow: [
                                              `0 0 3px ${widgetGlowStrong}`,
                                              `0 0 10px ${widgetGlowStrong}`,
                                              `0 0 3px ${widgetGlowStrong}`,
                                          ],
                                      }
                            }
                            transition={
                                isStatic
                                    ? undefined
                                    : {
                                          duration: 2,
                                          repeat: Infinity,
                                          ease: "easeInOut",
                                      }
                            }
                        >
                            Play Now
                        </motion.span>
                    </span>
                </motion.button>
            </div>
            <AnimatePresence>
                {popupOpen && (
                    <motion.div
                        initial={isStatic ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={isStatic ? undefined : { opacity: 0 }}
                        style={{
                            ...styles.popupOverlayFixed,
                            top: demoOffset,
                            paddingTop: 16,
                            paddingBottom: 16,
                        }}
                    >
                        <motion.div
                            ref={popupCardRef}
                            initial={isStatic ? false : { scale: 0.94, y: 16 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={
                                isStatic
                                    ? undefined
                                    : { scale: 0.96, opacity: 0 }
                            }
                            transition={{
                                duration: 0.35,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={`${uid}-title`}
                            style={{
                                ...styles.popupCardWrap,
                                maxWidth: cardMax,
                                maxHeight: `calc(100vh - ${demoOffset + 56}px)`,
                                overflow: "hidden",
                            }}
                        >
                            {gameCard}
                            <button
                                type="button"
                                onClick={() => setPopupOpen(false)}
                                aria-label="Close game"
                                style={{
                                    ...styles.popupClose,
                                    background: mode.chromeBg,
                                    border: `1px solid ${mode.chromeBorder}`,
                                    color: mode.ink,
                                }}
                            >
                                ×
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {demoBar}
        </div>
    )
}

const styles: { [key: string]: CSSProperties } = {
    wrapper: {
        width: "100%",
        minHeight: "100%",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: 22,
        padding: "28px 22px",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        userSelect: "none",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        outline: "none",
    },
    headerBlock: { textAlign: "center", marginBottom: 12, width: "100%" },
    kicker: {
        margin: "0 0 6px",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
    },
    title: {
        margin: 0,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 25,
        fontWeight: 400,
        letterSpacing: "-0.02em",
    },
    divider: { width: 32, height: 1, margin: "10px auto" },
    subtitle: {
        margin: 0,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
    },
    scoreRow: {
        display: "flex",
        gap: 8,
        width: "100%",
        maxWidth: 380,
        marginBottom: 12,
    },
    scoreBox: {
        flex: 1,
        borderRadius: 14,
        padding: "8px 8px",
        textAlign: "center",
        backdropFilter: "blur(8px)",
        minWidth: 0,
    },
    scoreLabel: {
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
    },
    scoreValue: {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 16,
        fontWeight: 400,
    },
    diffRow: {
        display: "flex",
        gap: 8,
        marginBottom: 12,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    diffBtn: {
        padding: "7px 14px",
        borderRadius: 20,
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
        minWidth: 72,
    },
    button: {
        marginBottom: 14,
        padding: "12px 28px",
        borderRadius: 40,
        border: "none",
        color: "#0a0a0f",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: "pointer",
    },
    gridWrap: { width: "100%", overflow: "hidden" },
    grid: {
        display: "grid",
        gap: 3,
        margin: "0 auto",
        padding: 8,
        borderRadius: 14,
        width: "max-content",
    },
    cell: {
        padding: 0,
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        fontWeight: 700,
    },
    hint: {
        marginTop: 12,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        textAlign: "center",
    },
    overlay: {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
        backdropFilter: "blur(6px)",
    },
    modal: {
        borderRadius: 18,
        padding: "28px 24px",
        width: "100%",
        maxWidth: 280,
        textAlign: "center",
        backdropFilter: "blur(20px)",
    },
    modalTitle: {
        margin: 0,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 22,
        fontWeight: 400,
    },
    modalDivider: { width: 28, height: 1, margin: "12px auto 14px" },
    modalLine: { margin: "0 0 8px", fontSize: 13 },
    claimBtn: {
        width: "100%",
        padding: "13px",
        borderRadius: 40,
        border: "none",
        color: "#0a0a0f",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: "pointer",
    },
    widgetContainer: {
        position: "fixed",
        bottom: 24,
        zIndex: 9998,
        display: "flex",
        alignItems: "center",
    },
    widgetPill: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 56,
        padding: "6px 20px 6px 6px",
        borderRadius: 999,
        border: "1px solid rgba(23,26,33,0.08)",
        cursor: "pointer",
        background: "#ffffff",
        backdropFilter: "blur(10px)",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    },
    widgetIconCircle: {
        width: 44,
        height: 44,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#121212",
        border: "1px solid rgba(255,255,255,0.1)",
    },
    widgetIconImg: {
        width: 24,
        height: 24,
        objectFit: "cover",
        borderRadius: "50%",
    },
    widgetPillTextCol: { display: "flex", flexDirection: "column", gap: 2 },
    widgetPillEyebrow: {
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(23,26,33,0.4)",
        whiteSpace: "nowrap",
    },
    widgetPillText: {
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        color: "#171a21",
        whiteSpace: "nowrap",
    },

    popupOverlayFixed: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
        boxSizing: "border-box",
    },
    popupCardWrap: { width: "100%", position: "relative", margin: "0 auto" },
    popupClose: {
        position: "absolute",
        top: -14,
        right: -14,
        width: 32,
        height: 32,
        borderRadius: "50%",
        fontSize: 17,
        lineHeight: "30px",
        textAlign: "center",
        cursor: "pointer",
        padding: 0,
        zIndex: 100,
    },
    inlineDemoStage: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 20,
        paddingRight: 20,
        boxSizing: "border-box",
    },
    inlineDemoCardWrap: { width: "100%", margin: "0 auto" },
    demoBar: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: "rgba(8,8,10,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "18px 20px",
        display: "flex",
        flexWrap: "nowrap",
        alignItems: "center",
        gap: 20,
        overflowX: "auto",
        boxSizing: "border-box",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    },
    demoChip: { display: "flex", alignItems: "center", gap: 7, flexShrink: 0 },
    demoDot: {
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "#ffffff",
    },
    demoTitle: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.7)",
        textTransform: "uppercase",
    },
    demoRow: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
    demoLabel: {
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.15em",
        color: "rgba(255,255,255,0.4)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
    },
    demoBtns: { display: "flex", flexWrap: "wrap", gap: 6 },
    demoBtnOn: {
        padding: "5px 11px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.3)",
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 700,
        background: "#ffffff",
        color: "#0a0a0f",
    },
    demoBtnOff: {
        padding: "5px 11px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.12)",
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 700,
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.7)",
    },
    demoResetBtn: {
        padding: "5px 11px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.12)",
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 700,
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.7)",
        marginLeft: "auto",
        whiteSpace: "nowrap",
    },
}

addPropertyControls(MinesweeperGame, {
    theme: {
        type: ControlType.Enum,
        title: "Concept",
        options: Object.keys(THEMES),
        optionTitles: Object.values(THEMES).map((t) => t.name),
        defaultValue: "night",
    },
    lightMode: {
        type: ControlType.Boolean,
        title: "Light Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#ffffff",
        optional: true,
    },
    difficulty: {
        type: ControlType.Enum,
        title: "Difficulty",
        options: ["beginner", "intermediate", "expert"],
        optionTitles: ["Beginner 9×9", "Medium 16×16", "Expert 16×30"],
        defaultValue: "beginner",
    },
    asPopup: {
        type: ControlType.Boolean,
        title: "Popup Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    trigger: {
        type: ControlType.Enum,
        title: "↳ Trigger",
        options: ["manual", "delay", "scroll"],
        optionTitles: ["Button Click", "Auto (Delay)", "On Scroll Into View"],
        defaultValue: "manual",
        hidden: (p) => !p.asPopup,
    },
    delaySeconds: {
        type: ControlType.Number,
        title: "↳ Delay",
        defaultValue: 4,
        min: 1,
        max: 60,
        step: 1,
        unit: "s",
        hidden: (p) => !p.asPopup || p.trigger !== "delay",
    },
    widgetPosition: {
        type: ControlType.Enum,
        title: "↳ Widget Corner",
        options: ["bottom-right", "bottom-left"],
        optionTitles: ["Bottom Right", "Bottom Left"],
        defaultValue: "bottom-right",
        hidden: (p) => !p.asPopup,
    },
    widgetIcon: {
        type: ControlType.ResponsiveImage,
        title: "↳ Widget Icon",
        hidden: (p) => !p.asPopup,
    },
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
