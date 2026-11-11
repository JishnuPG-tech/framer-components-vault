// SnakeGameWidget.tsx
import {
    useState,
    useEffect,
    useRef,
    useCallback,
    useId,
    CSSProperties,
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


type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"
type Point = { x: number; y: number }
type GameState = "ready" | "playing" | "gameover"
type Difficulty = "easy" | "medium" | "hard"

interface ThemeConfig {
    name: string
    title: string
    subtitle: string
    triggerText: string
    pageBackground: string
    boardBackground: string
    gridColor: string
    snakeHead: string
    snakeBody: string
    foodColor: string
    accentColor: string
    glow: string
}

const THEMES: { [key: string]: ThemeConfig } = {
    classic: {
        name: "Classic",
        title: "Snake",
        subtitle: "Eat, grow, don't crash",
        triggerText: "Play Snake",
        pageBackground: "linear-gradient(160deg, #f4f6fa 0%, #e8edf4 100%)",
        boardBackground: "#ffffff",
        gridColor: "#ececec",
        snakeHead: "#111111",
        snakeBody: "#333333",
        foodColor: "#ef4444",
        accentColor: "#111111",
        glow: "rgba(17,17,17,0.12)",
    },
    violet: {
        name: "Violet",
        title: "Violet Snake",
        subtitle: "Soft arcade high score hunt",
        triggerText: "Play Violet Snake",
        pageBackground: "linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)",
        boardBackground: "#ffffff",
        gridColor: "#e4e7fb",
        snakeHead: "#4338ca",
        snakeBody: "#6366f1",
        foodColor: "#db2777",
        accentColor: "#4f46e5",
        glow: "rgba(79,70,229,0.18)",
    },
    retro: {
        name: "Retro",
        title: "Pixel Snake",
        subtitle: "Old-school high score hunt",
        triggerText: "Play Pixel Snake",
        pageBackground: "linear-gradient(160deg, #fff7ed 0%, #fde8cf 100%)",
        boardBackground: "#fffdf8",
        gridColor: "#f3e6d4",
        snakeHead: "#3f6212",
        snakeBody: "#65a30d",
        foodColor: "#ea580c",
        accentColor: "#3f6212",
        glow: "rgba(63,98,18,0.16)",
    },
}

interface SnakeGameWidgetProps {
    theme?: string
    asPopup?: boolean
    trigger?: "manual" | "delay" | "scroll"
    delaySeconds?: number
    widgetPosition?: "bottom-right" | "bottom-left"
    storageKey?: string
    demoMode?: boolean
    defaultDifficulty?: Difficulty
    gridSize?: number
    style?: CSSProperties
}

const GAME_KEYS = [
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "w",
    "a",
    "s",
    "d",
    " ",
]

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 620
 */
export default function SnakeGameWidget(props: SnakeGameWidgetProps) {
    const {
        theme = "classic",
        asPopup = false,
        trigger = "manual",
        delaySeconds = 4,
        widgetPosition = "bottom-right",
        storageKey = "",
        demoMode = false,
        defaultDifficulty = "medium",
        gridSize = 15,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = useId()
    const titleId = `${uid}-title`
    const hintId = `${uid}-hint`
    const statusId = `${uid}-status`

    const rootRef = useRef<HTMLDivElement>(null)
    const demoBarRef = useRef<HTMLDivElement>(null)
    const popupCardRef = useRef<HTMLDivElement>(null)
    const gameRootRef = useRef<HTMLDivElement>(null)
    const widgetTriggerRef = useRef<HTMLButtonElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const boardWrapRef = useRef<HTMLDivElement>(null)
    const isVisibleRef = useRef(true)
    const wasPopupOpenRef = useRef(false)

    const [demoTheme, setDemoTheme] = useState(theme)
    const [demoAsPopup, setDemoAsPopup] = useState(asPopup)
    const [demoBarHeight, setDemoBarHeight] = useState(0)
    const [popupOpen, setPopupOpen] = useState(!asPopup)
    const [scrollTriggered, setScrollTriggered] = useState(false)

    const activeTheme = THEMES[demoMode ? demoTheme : theme] || THEMES.classic
    const isPopupMode = demoMode ? demoAsPopup : asPopup

    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [gameState, setGameState] = useState<GameState>("ready")
    const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty)

    const snakeRef = useRef<Point[]>([{ x: 7, y: 7 }])
    const directionRef = useRef<Direction>("RIGHT")
    const nextDirectionRef = useRef<Direction>("RIGHT")
    const foodRef = useRef<Point>({ x: 3, y: 3 })
    const cellSizeRef = useRef(24)
    const speedRef = useRef(110)
    const lastTimeRef = useRef(0)
    const animationRef = useRef(0)
    const touchStartRef = useRef<{ x: number; y: number } | null>(null)
    const scoreRef = useRef(0)
    const highScoreRef = useRef(0)
    const gameStateRef = useRef<GameState>("ready")

    const suffix = storageKey.trim() ? `-${storageKey.trim()}` : ""
    const highScoreKey = `snake-highscore${suffix}`
    const cells = Math.max(8, Math.min(24, gridSize))

    useEffect(() => {
        scoreRef.current = score
    }, [score])
    useEffect(() => {
        highScoreRef.current = highScore
    }, [highScore])
    useEffect(() => {
        gameStateRef.current = gameState
    }, [gameState])

    useEffect(() => {
        if (difficulty === "easy") speedRef.current = 160
        else if (difficulty === "medium") speedRef.current = 110
        else speedRef.current = 70
    }, [difficulty])

    useEffect(() => {
        if (isStatic) return
        try {
            const saved = localStorage.getItem(highScoreKey)
            if (saved) {
                const n = Number(saved)
                if (!Number.isNaN(n)) {
                    setHighScore(n)
                    highScoreRef.current = n
                }
            }
        } catch {
            /* ignore */
        }
    }, [isStatic, highScoreKey])

    useEffect(() => {
        setPopupOpen(!isPopupMode)
    }, [isPopupMode])

    useEffect(() => {
        if (!isPopupMode || trigger !== "delay" || isStatic) return
        const t = setTimeout(() => setPopupOpen(true), delaySeconds * 1000)
        return () => clearTimeout(t)
    }, [isPopupMode, trigger, delaySeconds, isStatic])

    useEffect(() => {
        if (
            !isPopupMode ||
            trigger !== "scroll" ||
            isStatic ||
            !rootRef.current
        )
            return
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
        if (!demoMode || isStatic || !demoBarRef.current) return
        const el = demoBarRef.current
        const ro = new ResizeObserver(([entry]) => {
            setDemoBarHeight(entry.contentRect.height)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [demoMode, isStatic])

    useEffect(() => {
        if (isStatic) return
        isVisibleRef.current = true
        const el =
            gameRootRef.current ?? boardWrapRef.current ?? rootRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic, popupOpen, isPopupMode])

    useEffect(() => {
        if (isStatic) return

        if (isPopupMode && popupOpen) {
            const focusTimer = setTimeout(() => {
                gameRootRef.current?.focus()
            }, 30)

            const body = document.body
            const html = document.documentElement
            const prevBodyOverflow = body.style.overflow
            const prevHtmlOverflow = html.style.overflow
            const prevBodyPad = body.style.paddingRight
            const scrollbar = window.innerWidth - html.clientWidth
            body.style.overflow = "hidden"
            html.style.overflow = "hidden"
            if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

            return () => {
                clearTimeout(focusTimer)
                body.style.overflow = prevBodyOverflow
                html.style.overflow = prevHtmlOverflow
                body.style.paddingRight = prevBodyPad
            }
        }

        if (isPopupMode && !popupOpen && wasPopupOpenRef.current) {
            widgetTriggerRef.current?.focus()
        }
        wasPopupOpenRef.current = popupOpen
    }, [isPopupMode, popupOpen, isStatic])

    const placeFood = (snake: Point[]) => {
        let newFood: Point
        do {
            newFood = {
                x: Math.floor(Math.random() * cells),
                y: Math.floor(Math.random() * cells),
            }
        } while (snake.some((s) => s.x === newFood.x && s.y === newFood.y))
        foodRef.current = newFood
    }

    const resetGame = useCallback(() => {
        const mid = Math.floor(cells / 2)
        snakeRef.current = [{ x: mid, y: mid }]
        directionRef.current = "RIGHT"
        nextDirectionRef.current = "RIGHT"
        placeFood(snakeRef.current)
        scoreRef.current = 0
        setScore(0)
        setGameState("ready")
        gameStateRef.current = "ready"
    }, [cells])

    const startGame = useCallback(() => {
        if (gameStateRef.current === "gameover") resetGame()
        setGameState("playing")
        gameStateRef.current = "playing"
        isVisibleRef.current = true
        gameRootRef.current?.focus()
    }, [resetGame])

    const endGame = useCallback(() => {
        setGameState("gameover")
        gameStateRef.current = "gameover"
        const current = scoreRef.current
        if (current > highScoreRef.current) {
            highScoreRef.current = current
            setHighScore(current)
            try {
                localStorage.setItem(highScoreKey, String(current))
            } catch {
                /* ignore */
            }
        }
    }, [highScoreKey])

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const size = cellSizeRef.current
        const w = cells * size
        const h = cells * size
        ctx.fillStyle = activeTheme.boardBackground
        ctx.fillRect(0, 0, w, h)
        ctx.strokeStyle = activeTheme.gridColor
        ctx.lineWidth = 1
        for (let i = 0; i <= cells; i++) {
            ctx.beginPath()
            ctx.moveTo(i * size, 0)
            ctx.lineTo(i * size, h)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(0, i * size)
            ctx.lineTo(w, i * size)
            ctx.stroke()
        }
        const food = foodRef.current
        ctx.fillStyle = activeTheme.foodColor
        ctx.beginPath()
        ctx.roundRect(
            food.x * size + 3,
            food.y * size + 3,
            size - 6,
            size - 6,
            6
        )
        ctx.fill()
        snakeRef.current.forEach((segment, index) => {
            const isHead = index === 0
            ctx.fillStyle = isHead
                ? activeTheme.snakeHead
                : activeTheme.snakeBody
            ctx.beginPath()
            ctx.roundRect(
                segment.x * size + 2,
                segment.y * size + 2,
                size - 4,
                size - 4,
                isHead ? 8 : 5
            )
            ctx.fill()
        })
    }, [activeTheme, cells])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        if (isStatic) {
            cellSizeRef.current = 20
            canvas.width = cells * 20
            canvas.height = cells * 20
            draw()
            return
        }
        const applySize = () => {
            const containerW = boardWrapRef.current?.clientWidth || 320
            const maxSize = Math.min(containerW, 340)
            const size = Math.max(8, Math.floor(maxSize / cells))
            cellSizeRef.current = size
            canvas.width = cells * size
            canvas.height = cells * size
            draw()
        }
        applySize()
        const target = boardWrapRef.current
        if (!target) return
        const ro = new ResizeObserver(() => applySize())
        ro.observe(target)
        return () => ro.disconnect()
    }, [isStatic, cells, draw, popupOpen])

    useEffect(() => {
        if (isStatic) return
        const tick = (time: number) => {
            if (!isVisibleRef.current) {
                animationRef.current = requestAnimationFrame(tick)
                return
            }
            if (gameStateRef.current !== "playing") {
                draw()
                animationRef.current = requestAnimationFrame(tick)
                return
            }
            if (time - lastTimeRef.current > speedRef.current) {
                lastTimeRef.current = time
                directionRef.current = nextDirectionRef.current
                const snake = [...snakeRef.current]
                const head = { ...snake[0] }
                if (directionRef.current === "UP") head.y -= 1
                if (directionRef.current === "DOWN") head.y += 1
                if (directionRef.current === "LEFT") head.x -= 1
                if (directionRef.current === "RIGHT") head.x += 1
                if (
                    head.x < 0 ||
                    head.x >= cells ||
                    head.y < 0 ||
                    head.y >= cells ||
                    snake.some((s) => s.x === head.x && s.y === head.y)
                ) {
                    endGame()
                    animationRef.current = requestAnimationFrame(tick)
                    return
                }
                snake.unshift(head)
                if (
                    head.x === foodRef.current.x &&
                    head.y === foodRef.current.y
                ) {
                    const next = scoreRef.current + 1
                    scoreRef.current = next
                    setScore(next)
                    placeFood(snake)
                } else {
                    snake.pop()
                }
                snakeRef.current = snake
            }
            draw()
            animationRef.current = requestAnimationFrame(tick)
        }
        animationRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animationRef.current)
    }, [isStatic, cells, draw, endGame, popupOpen])

    const applyDirection = (next: Direction) => {
        const dir = directionRef.current
        if (next === "UP" && dir !== "DOWN") nextDirectionRef.current = "UP"
        if (next === "DOWN" && dir !== "UP") nextDirectionRef.current = "DOWN"
        if (next === "LEFT" && dir !== "RIGHT")
            nextDirectionRef.current = "LEFT"
        if (next === "RIGHT" && dir !== "LEFT")
            nextDirectionRef.current = "RIGHT"
    }

    const handleGameKeyDown = (e: React.KeyboardEvent) => {
        const key = e.key.toLowerCase()

        if (key === "escape" && isPopupMode) {
            e.preventDefault()
            setPopupOpen(false)
            return
        }

        if (GAME_KEYS.includes(key)) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (gameStateRef.current !== "playing") {
            if (
                key === " " ||
                key.startsWith("arrow") ||
                ["w", "a", "s", "d"].includes(key)
            ) {
                startGame()
            }
            return
        }

        if (key === "arrowup" || key === "w") applyDirection("UP")
        else if (key === "arrowdown" || key === "s") applyDirection("DOWN")
        else if (key === "arrowleft" || key === "a") applyDirection("LEFT")
        else if (key === "arrowright" || key === "d") applyDirection("RIGHT")
    }

    const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== "Tab" || !popupCardRef.current) return
        const nodes = popupCardRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const list = Array.from(nodes).filter(
            (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
        )
        if (list.length === 0) {
            e.preventDefault()
            gameRootRef.current?.focus()
            return
        }
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
        }
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0]
        touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return
        const touch = e.changedTouches[0]
        const dx = touch.clientX - touchStartRef.current.x
        const dy = touch.clientY - touchStartRef.current.y
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        if (Math.max(absDx, absDy) < 30) {
            if (gameState !== "playing") startGame()
            touchStartRef.current = null
            return
        }
        if (gameState !== "playing") {
            startGame()
            touchStartRef.current = null
            return
        }
        if (absDx > absDy) {
            if (dx > 0) applyDirection("RIGHT")
            else applyDirection("LEFT")
        } else {
            if (dy > 0) applyDirection("DOWN")
            else applyDirection("UP")
        }
        touchStartRef.current = null
    }

    const statusText =
        gameState === "playing"
            ? `Playing. Score ${score}.`
            : gameState === "gameover"
              ? `Game over. Score ${score}. Press Space or Start to play again.`
              : "Ready. Press arrow keys, WASD, or Start to play."

    const gameCard = (
        <div
            ref={gameRootRef}
            tabIndex={0}
            role="application"
            aria-labelledby={titleId}
            aria-describedby={`${hintId} ${statusId}`}
            onKeyDown={handleGameKeyDown}
            onClick={() => gameRootRef.current?.focus()}
            style={{
                ...styles.wrapper,
                background: activeTheme.pageBackground,
                ...style,
            }}
        >
            <div style={styles.headerBlock}>
                <h2 id={titleId} style={styles.title}>
                    {activeTheme.title}
                </h2>
                <div style={styles.divider} />
                <p style={styles.subtitle}>{activeTheme.subtitle}</p>
                <div style={styles.scoreRow} aria-hidden="true">
                    <span>
                        Score <b>{score}</b>
                    </span>
                    <span>
                        Best <b>{highScore}</b>
                    </span>
                </div>
                <div
                    id={statusId}
                    role="status"
                    aria-live="polite"
                    style={styles.srOnly}
                >
                    {statusText} Best {highScore}.
                </div>
                <div
                    role="radiogroup"
                    aria-label="Difficulty"
                    style={styles.diffRow}
                >
                    {(["easy", "medium", "hard"] as const).map((level) => {
                        const on = difficulty === level
                        return (
                            <button
                                key={level}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => {
                                    setDifficulty(level)
                                    if (gameState === "playing") resetGame()
                                    gameRootRef.current?.focus()
                                }}
                                style={{
                                    ...styles.diffBtn,
                                    background: on
                                        ? activeTheme.accentColor
                                        : "#fff",
                                    color: on ? "#fff" : "#111",
                                    borderColor: on
                                        ? activeTheme.accentColor
                                        : "#e5e5e5",
                                    transition: isStatic
                                        ? "none"
                                        : "all 0.15s ease",
                                }}
                            >
                                {level}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div
                ref={boardWrapRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={styles.board}
            >
                <canvas
                    ref={canvasRef}
                    role="img"
                    aria-label={`${activeTheme.title} board. Score ${score}. Best ${highScore}.`}
                    style={styles.canvas}
                />
                {gameState !== "playing" && (
                    <div style={styles.overlay}>
                        <div style={styles.overlayTitle}>
                            {gameState === "gameover" ? "Game Over" : "Ready?"}
                        </div>
                        <div style={styles.overlayHint}>
                            {gameState === "gameover"
                                ? `Score ${score}`
                                : "Arrow keys, WASD, or swipe"}
                        </div>
                        <button
                            type="button"
                            onClick={startGame}
                            style={{
                                ...styles.primaryBtn,
                                background: activeTheme.accentColor,
                                transition: isStatic
                                    ? "none"
                                    : "all 0.15s ease",
                            }}
                        >
                            {gameState === "gameover"
                                ? "Play Again"
                                : "Start Game"}
                        </button>
                    </div>
                )}
            </div>
            <p id={hintId} style={styles.hint}>
                Use arrow keys or WASD to move. Escape closes the widget.
            </p>
        </div>
    )

    const demoBar = demoMode ? (
        <div ref={demoBarRef} style={styles.demoBar} aria-label="Demo controls">
            <div style={styles.demoChip}>
                <div style={styles.demoDot} />
                <span style={styles.demoTitle}>Demo</span>
            </div>
            <div style={styles.demoRow}>
                <span style={styles.demoLabel}>Theme</span>
                <div style={styles.demoBtns}>
                    {Object.keys(THEMES).map((key) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={demoTheme === key}
                            onClick={() => {
                                setDemoTheme(key)
                                resetGame()
                            }}
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
                <span style={styles.demoLabel}>Widget</span>
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
                onClick={resetGame}
            >
                Reset Game
            </button>
        </div>
    ) : null

    if (!isPopupMode) {
        return (
            <div ref={rootRef} style={{ width: "100%", maxWidth: "100%" }}>
                {demoMode ? (
                    <div
                        style={{
                            ...styles.inlineDemoStage,
                            paddingTop: demoBarHeight + 24,
                        }}
                    >
                        <div style={styles.inlineDemoCardWrap}>{gameCard}</div>
                    </div>
                ) : (
                    gameCard
                )}
                {demoBar}
            </div>
        )
    }

    const widgetOnRight = widgetPosition !== "bottom-left"

    return (
        <div ref={rootRef} style={{ width: "100%", maxWidth: "100%" }}>
            <div
                style={{
                    ...styles.widgetContainer,
                    ...(widgetOnRight ? { right: 16 } : { left: 16 }),
                }}
            >
                <motion.button
                    ref={widgetTriggerRef}
                    type="button"
                    onClick={() => setPopupOpen(true)}
                    whileHover={isStatic ? undefined : { scale: 1.04 }}
                    whileTap={isStatic ? undefined : { scale: 0.97 }}
                    aria-haspopup="dialog"
                    aria-expanded={popupOpen}
                    aria-controls={`${uid}-dialog`}
                    aria-label={activeTheme.triggerText}
                    style={{
                        ...styles.widgetPill,
                        boxShadow: `0 8px 30px ${activeTheme.glow}, 0 4px 16px rgba(0,0,0,0.12)`,
                    }}
                >
                    <span style={styles.widgetIconCircle} aria-hidden="true">
                        <span style={styles.widgetIconDot} />
                    </span>
                    <span style={styles.widgetPillTextCol}>
                        <span style={styles.widgetPillEyebrow}>
                            {activeTheme.triggerText}
                        </span>
                        <span style={styles.widgetPillText}>Play now</span>
                    </span>
                </motion.button>
            </div>

            <AnimatePresence>
                {popupOpen && (
                    <motion.div
                        initial={isStatic ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            ...styles.popupOverlayFixed,
                            paddingTop: demoMode ? demoBarHeight + 24 : 24,
                        }}
                        onWheel={(e) => e.preventDefault()}
                        onTouchMove={(e) => {
                            if (e.target === e.currentTarget) e.preventDefault()
                        }}
                    >
                        <motion.div
                            id={`${uid}-dialog`}
                            ref={popupCardRef}
                            initial={isStatic ? false : { scale: 0.96, y: 12 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0 }}
                            transition={{
                                duration: isStatic ? 0 : 0.3,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={titleId}
                            aria-describedby={hintId}
                            tabIndex={-1}
                            onKeyDown={(e) => {
                                trapFocus(e)
                                handleGameKeyDown(e)
                            }}
                            style={styles.popupCardWrap}
                        >
                            <button
                                type="button"
                                onClick={() => setPopupOpen(false)}
                                aria-label="Close snake game"
                                style={styles.popupClose}
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    aria-hidden="true"
                                    focusable="false"
                                >
                                    <path
                                        d="M2 2l8 8M10 2L2 10"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                            {gameCard}
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
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderRadius: 22,
        padding: "28px 18px 16px",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        userSelect: "none",
        boxSizing: "border-box",
        outline: "none",
        border: "1px solid rgba(23,26,33,0.08)",
        color: "#111",
        overflow: "hidden",
    },
    headerBlock: { textAlign: "center", width: "100%", marginBottom: 14 },
    title: {
        margin: 0,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 24,
        fontWeight: 400,
        color: "#111",
    },
    divider: {
        width: 32,
        height: 1,
        background: "rgba(17,17,17,0.18)",
        margin: "10px auto",
    },
    subtitle: {
        margin: 0,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "#888",
    },
    scoreRow: {
        display: "flex",
        justifyContent: "center",
        gap: 24,
        marginTop: 12,
        fontSize: 13,
        color: "#666",
    },
    diffRow: {
        display: "flex",
        justifyContent: "center",
        gap: 8,
        marginTop: 14,
        flexWrap: "wrap",
    },
    diffBtn: {
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 600,
        textTransform: "capitalize",
        cursor: "pointer",
        border: "1px solid #e5e5e5",
        background: "#fff",
    },
    board: {
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        width: "100%",
        maxWidth: 340,
    },
    canvas: {
        display: "block",
        width: "100%",
        height: "auto",
        touchAction: "none",
    },
    overlay: {
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        background: "rgba(250,250,250,0.92)",
    },
    overlayTitle: {
        fontSize: 20,
        fontWeight: 600,
        marginBottom: 6,
        color: "#111",
    },
    overlayHint: { fontSize: 13, marginBottom: 16, color: "#888" },
    primaryBtn: {
        border: "none",
        borderRadius: 8,
        padding: "10px 22px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        color: "#fff",
    },
    hint: { marginTop: 12, fontSize: 12, textAlign: "center", color: "#999" },
    srOnly: {
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
    },
    widgetContainer: {
        position: "fixed",
        bottom: 16,
        zIndex: 9998,
        maxWidth: "calc(100vw - 32px)",
    },
    widgetPill: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 56,
        maxWidth: "100%",
        padding: "6px 18px 6px 6px",
        borderRadius: 999,
        border: "1px solid rgba(23,26,33,0.08)",
        cursor: "pointer",
        background: "#ffffff",
        boxSizing: "border-box",
    },
    widgetIconCircle: {
        width: 44,
        height: 44,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#121212",
        flexShrink: 0,
    },
    widgetIconDot: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#ffffff",
        display: "block",
        flexShrink: 0,
    },
    widgetPillTextCol: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 0,
    },
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
        textTransform: "uppercase",
        color: "#171a21",
    },
    popupOverlayFixed: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 24,
        boxSizing: "border-box",
        overflow: "hidden",
        overscrollBehavior: "none",
        touchAction: "none",
    },
    popupCardWrap: {
        width: "100%",
        maxWidth: 400,
        maxHeight: "min(640px, calc(100dvh - 48px))",
        position: "relative",
        overflow: "auto",
        overscrollBehavior: "contain",
        borderRadius: 22,
        boxSizing: "border-box",
        outline: "none",
    },
    popupClose: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "1px solid rgba(23,26,33,0.12)",
        background: "#fff",
        color: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 20,
        padding: 0,
        lineHeight: 1,
    },
    inlineDemoStage: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 16,
        paddingRight: 16,
        boxSizing: "border-box",
        background: "#eef1f5",
    },
    inlineDemoCardWrap: { width: "100%", maxWidth: 420 },
    demoBar: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: "rgba(8,8,10,0.9)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "14px 16px",
        display: "flex",
        flexWrap: "nowrap",
        alignItems: "center",
        gap: 16,
        overflowX: "auto",
        boxSizing: "border-box",
    },
    demoChip: { display: "flex", alignItems: "center", gap: 7, flexShrink: 0 },
    demoDot: { width: 6, height: 6, borderRadius: "50%", background: "#fff" },
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
    },
    demoBtns: { display: "flex", gap: 6 },
    demoBtnOn: {
        padding: "5px 11px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.3)",
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 700,
        background: "#fff",
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
        flexShrink: 0,
    },
}

addPropertyControls(SnakeGameWidget, {
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: Object.keys(THEMES),
        optionTitles: Object.values(THEMES).map((t) => t.name),
        defaultValue: "classic",
    },
    asPopup: {
        type: ControlType.Boolean,
        title: "Widget Mode",
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
        unit: "s",
        hidden: (p) => !p.asPopup || p.trigger !== "delay",
    },
    widgetPosition: {
        type: ControlType.Enum,
        title: "↳ Corner",
        options: ["bottom-right", "bottom-left"],
        optionTitles: ["Bottom Right", "Bottom Left"],
        defaultValue: "bottom-right",
        hidden: (p) => !p.asPopup,
    },
    defaultDifficulty: {
        type: ControlType.Enum,
        title: "Difficulty",
        options: ["easy", "medium", "hard"],
        optionTitles: ["Easy", "Medium", "Hard"],
        defaultValue: "medium",
    },
    gridSize: {
        type: ControlType.Number,
        title: "Grid",
        min: 8,
        max: 20,
        step: 1,
        defaultValue: 15,
    },
    storageKey: {
        type: ControlType.String,
        title: "Storage Key",
        defaultValue: "",
        placeholder: "only if using 2+ instances",
    },
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
