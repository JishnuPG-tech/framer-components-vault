import {
    useEffect,
    useRef,
    useState,
    useId,
    useCallback,
    CSSProperties,
    KeyboardEvent,
    PointerEvent,
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
    courtDark: string
    courtLight: string
}

const THEMES: { [key: string]: ThemeConfig } = {
    arcade: {
        name: "Arcade",
        title: "Pong",
        subtitle: "First to the table wins",
        buttonText: "New Game",
        triggerText: "Play Pong",
        glow: "rgba(255,255,255,0.16)",
        background: "linear-gradient(160deg, #07080b 0%, #101319 100%)",
        lightBackground: "linear-gradient(160deg, #f4f6fa 0%, #dfe6f0 100%)",
        courtDark: "#0c0d11",
        courtLight: "#dce2ea",
    },
    neon: {
        name: "Neon Court",
        title: "Night Match",
        subtitle: "Keep the rally alive",
        buttonText: "New Match",
        triggerText: "Open Court",
        glow: "rgba(129,140,248,0.22)",
        background: "linear-gradient(160deg, #06050c 0%, #100a1c 100%)",
        lightBackground: "linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)",
        courtDark: "#0a0714",
        courtLight: "#dde3ff",
    },
    tournament: {
        name: "Tournament",
        title: "Championship",
        subtitle: "Ten rounds. One winner.",
        buttonText: "Restart Bracket",
        triggerText: "Enter Court",
        glow: "rgba(251,191,36,0.20)",
        background: "linear-gradient(160deg, #0c0904 0%, #1a1206 100%)",
        lightBackground: "linear-gradient(160deg, #fff7ed 0%, #fde8cf 100%)",
        courtDark: "#120e08",
        courtLight: "#f3e6d2",
    },
    classic: {
        name: "Classic",
        title: "Table Tennis",
        subtitle: "Arrow keys or drag to play",
        buttonText: "New Game",
        triggerText: "Play a Round",
        glow: "rgba(45,212,191,0.20)",
        background: "linear-gradient(160deg, #04080a 0%, #081619 100%)",
        lightBackground: "linear-gradient(160deg, #ecfeff 0%, #cffafe 100%)",
        courtDark: "#071114",
        courtLight: "#d7f4f6",
    },
}

type DifficultyKey = "easy" | "medium" | "hard"

const DIFFICULTY: {
    [key in DifficultyKey]: {
        botSpeed: number
        ballSpeedX: number
        ballSpeedY: number
        playerSpeed: number
        label: string
    }
} = {
    easy: {
        botSpeed: 4.2,
        ballSpeedX: 5.5,
        ballSpeedY: 3.8,
        playerSpeed: 7.5,
        label: "Easy",
    },
    medium: {
        botSpeed: 5.4,
        ballSpeedX: 6.8,
        ballSpeedY: 4.6,
        playerSpeed: 7.2,
        label: "Medium",
    },
    hard: {
        botSpeed: 6.8,
        ballSpeedX: 8.2,
        ballSpeedY: 5.6,
        playerSpeed: 7.0,
        label: "Hard",
    },
}

const ROUNDS = [5, 5, 5, 4, 4, 4, 3, 3, 3, 1]
const COURT_W = 800
const COURT_H = 500
const PADDLE_H = 90

function PaddleIcon() {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            <rect x="4" y="5" width="3.2" height="14" rx="1.4" fill="#fffceb" />
            <circle cx="15.5" cy="12" r="5.2" fill="#ffc93c" />
            <circle cx="15.5" cy="12" r="1.6" fill="#fffceb" />
        </svg>
    )
}

interface PongGameProps {
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
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 640
 */
export default function PongGame(props: PongGameProps) {
    const {
        accentColor,
        demoMode = false,
        theme = "arcade",
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
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gameRootRef = useRef<HTMLDivElement>(null)
    const delayTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined
    )
    const statusTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined
    )
    const rafRef = useRef<number | null>(null)
    const isVisibleRef = useRef(true)
    const playerMoveRef = useRef(0)
    const paddleTargetRef = useRef<number | null>(null)
    const startGameRef = useRef<(() => void) | null>(null)

    const [scoreA, setScoreA] = useState(0)
    const [scoreB, setScoreB] = useState(0)
    const [round, setRound] = useState(1)
    const [status, setStatus] = useState("Click the court to start")
    const [difficulty, setDifficulty] = useState<DifficultyKey>("medium")
    const [gameKey, setGameKey] = useState(0)
    const [isCoarsePointer, setIsCoarsePointer] = useState(false)
    const [popupOpen, setPopupOpen] = useState(!asPopup)
    const [scrollTriggered, setScrollTriggered] = useState(false)
    const [demoTheme, setDemoTheme] = useState(theme)
    const [demoAsPopup, setDemoAsPopup] = useState(asPopup)
    const [demoLightMode, setDemoLightMode] = useState(lightMode)
    const [demoBarHeight, setDemoBarHeight] = useState(72)

    const activeThemeKey = demoMode ? demoTheme : theme
    const activeTheme = THEMES[activeThemeKey] || THEMES.arcade
    const isPopupMode = demoMode ? demoAsPopup : asPopup
    const isLight = demoMode ? demoLightMode : lightMode
    const resolvedAccent = accentColor || "#ffffff"
    const widgetOnRight = widgetPosition !== "bottom-left"
    const widgetGlowStrong = activeTheme.glow.replace(
        /,\s*[\d.]+\)$/,
        ", 0.85)"
    )
    const neededPoints = ROUNDS[round - 1] || 1
    const demoOffset = demoMode ? demoBarHeight : 0

    const mode = isLight
        ? {
              ink: "#171a21",
              inkSoft: "rgba(23,26,33,0.7)",
              inkMuted: "rgba(23,26,33,0.5)",
              inkFaint: "rgba(23,26,33,0.4)",
              divider: "rgba(23,26,33,0.18)",
              surface: "rgba(255,255,255,0.65)",
              surfaceBorder: "rgba(23,26,33,0.1)",
              cardBorder: "rgba(23,26,33,0.08)",
              overlayBg: "rgba(255,255,255,0.82)",
              chromeBg: "#ffffff",
              chromeBorder: "rgba(23,26,33,0.1)",
              stageBg: "#eef1f5",
              net: "rgba(23,26,33,0.28)",
              paddle: "#171a21",
          }
        : {
              ink: "#ffffff",
              inkSoft: "rgba(255,255,255,0.7)",
              inkMuted: "rgba(255,255,255,0.45)",
              inkFaint: "rgba(255,255,255,0.4)",
              divider: "rgba(255,255,255,0.3)",
              surface: "rgba(255,255,255,0.06)",
              surfaceBorder: "rgba(255,255,255,0.12)",
              cardBorder: "rgba(255,255,255,0.08)",
              overlayBg: "rgba(4,4,6,0.78)",
              chromeBg: "rgba(10,10,15,0.92)",
              chromeBorder: "rgba(255,255,255,0.16)",
              stageBg: "#050506",
              net: "rgba(255,255,255,0.28)",
              paddle: "#ffffff",
          }

    useEffect(() => {
        return () => {
            clearTimeout(delayTimerRef.current)
            clearTimeout(statusTimerRef.current)
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const mq = window.matchMedia("(pointer: coarse)")
        const apply = () => setIsCoarsePointer(mq.matches)
        apply()
        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", apply)
            return () => mq.removeEventListener("change", apply)
        }
        return undefined
    }, [isStatic])

    useEffect(() => {
        setPopupOpen(!isPopupMode)
    }, [isPopupMode])

    useEffect(() => {
        if (!isPopupMode || trigger !== "delay" || isStatic) return
        clearTimeout(delayTimerRef.current)
        delayTimerRef.current = setTimeout(
            () => setPopupOpen(true),
            delaySeconds * 1000
        )
        return () => clearTimeout(delayTimerRef.current)
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
        if (isStatic || !gameRootRef.current) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        observer.observe(gameRootRef.current)
        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (!demoMode || isStatic || !demoBarRef.current) return
        const el = demoBarRef.current
        const ro = new ResizeObserver(([entry]) => {
            setDemoBarHeight(entry.contentRect.height)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [demoMode, isStatic])

    const wasPopupOpenRef = useRef(false)
    useEffect(() => {
        if (isStatic) return
        if (!isPopupMode || popupOpen) {
            gameRootRef.current?.focus()
        } else if (wasPopupOpenRef.current) {
            widgetTriggerRef.current?.focus()
        }
        wasPopupOpenRef.current = popupOpen
    }, [isPopupMode, popupOpen, isStatic, gameKey])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.width = COURT_W
        canvas.height = COURT_H

        const settings = DIFFICULTY[difficulty]
        const court = isLight ? activeTheme.courtLight : activeTheme.courtDark
        let running = false
        let gameOver = false
        let currentRound = 0
        let timer = 0
        let playerTurn: "player" | "bot" | null = null
        let cancelled = false

        const player = {
            x: 40,
            y: COURT_H / 2 - PADDLE_H / 2,
            w: 14,
            h: PADDLE_H,
            speed: settings.playerSpeed,
            score: 0,
        }
        const bot = {
            x: COURT_W - 54,
            y: COURT_H / 2 - PADDLE_H / 2,
            w: 14,
            h: PADDLE_H,
            speed: settings.botSpeed,
            score: 0,
        }
        const ball = {
            x: COURT_W / 2,
            y: COURT_H / 2,
            size: 14,
            speedX: settings.ballSpeedX,
            speedY: settings.ballSpeedY,
            dirX: 0,
            dirY: 0,
        }

        const clampPaddle = (y: number) => {
            if (y < 0) return 0
            if (y + PADDLE_H > COURT_H) return COURT_H - PADDLE_H
            return y
        }

        const resetBall = () => {
            ball.x = COURT_W / 2
            ball.y = COURT_H / 2
            ball.dirX = 0
            ball.dirY = 0
        }

        const serve = () => {
            const dir = playerTurn === "player" ? 1 : -1
            ball.dirX = dir
            ball.dirY = Math.random() > 0.5 ? 1 : -1
            ball.y = (playerTurn === "player" ? player.y : bot.y) + 45
            playerTurn = null
        }

        const levelUp = () => {
            currentRound++
            setRound(currentRound + 1)
            player.score = 0
            bot.score = 0
            setScoreA(0)
            setScoreB(0)
            player.speed += 0.2
            bot.speed += 0.15
            ball.speedX += 0.22
            ball.speedY += 0.18
        }

        const update = () => {
            if (paddleTargetRef.current !== null) {
                player.y = clampPaddle(paddleTargetRef.current)
                paddleTargetRef.current = null
            } else {
                player.y = clampPaddle(
                    player.y + playerMoveRef.current * player.speed
                )
            }

            const target = ball.y - bot.h / 2
            if (bot.y < target - 3) bot.y += bot.speed
            else if (bot.y > target + 3) bot.y -= bot.speed
            bot.y = clampPaddle(bot.y)

            if (ball.dirX !== 0) {
                ball.x += ball.dirX * ball.speedX
                ball.y += ball.dirY * ball.speedY
            }

            if (ball.y <= 0 || ball.y + ball.size >= COURT_H) ball.dirY *= -1

            const hitPaddle = (p: typeof player) =>
                ball.x < p.x + p.w &&
                ball.x + ball.size > p.x &&
                ball.y < p.y + p.h &&
                ball.y + ball.size > p.y

            if (hitPaddle(player)) {
                ball.dirX = 1
                ball.x = player.x + player.w
            }
            if (hitPaddle(bot)) {
                ball.dirX = -1
                ball.x = bot.x - ball.size
            }

            if (ball.x + ball.size < 0) {
                bot.score++
                setScoreB(bot.score)
                playerTurn = "player"
                resetBall()
                timer = performance.now()
            }
            if (ball.x > COURT_W) {
                player.score++
                setScoreA(player.score)
                playerTurn = "bot"
                resetBall()
                timer = performance.now()
            }

            if (playerTurn && performance.now() - timer > 900) serve()

            const needed = ROUNDS[currentRound] || 1
            if (player.score >= needed) {
                if (currentRound >= ROUNDS.length - 1) {
                    gameOver = true
                    setStatus("You win")
                    running = false
                } else {
                    levelUp()
                    setStatus(`Round ${currentRound + 1}`)
                    clearTimeout(statusTimerRef.current)
                    statusTimerRef.current = setTimeout(() => {
                        if (!cancelled) setStatus("")
                    }, 1100)
                }
            } else if (bot.score >= needed) {
                gameOver = true
                setStatus("Game over")
                running = false
            }
        }

        const draw = () => {
            ctx.fillStyle = court
            ctx.fillRect(0, 0, COURT_W, COURT_H)
            ctx.setLineDash([6, 12])
            ctx.beginPath()
            ctx.moveTo(COURT_W / 2, 30)
            ctx.lineTo(COURT_W / 2, COURT_H - 30)
            ctx.lineWidth = 4
            ctx.strokeStyle = mode.net
            ctx.stroke()
            ctx.setLineDash([])
            ctx.fillStyle = mode.paddle
            ctx.fillRect(player.x, player.y, player.w, player.h)
            ctx.fillRect(bot.x, bot.y, bot.w, bot.h)
            if (ball.dirX !== 0 || !playerTurn) {
                ctx.beginPath()
                ctx.arc(
                    ball.x + ball.size / 2,
                    ball.y + ball.size / 2,
                    ball.size / 2,
                    0,
                    Math.PI * 2
                )
                ctx.fill()
            }
        }

        const loop = () => {
            if (cancelled || !running || gameOver) return
            if (isVisibleRef.current) {
                update()
                draw()
            }
            rafRef.current = requestAnimationFrame(loop)
        }

        const startGame = () => {
            if (isStatic || running || gameOver) return
            running = true
            setStatus("")
            playerTurn = "bot"
            timer = performance.now()
            rafRef.current = requestAnimationFrame(loop)
        }

        startGameRef.current = startGame
        playerMoveRef.current = 0
        paddleTargetRef.current = null
        draw()

        return () => {
            cancelled = true
            running = false
            startGameRef.current = null
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            clearTimeout(statusTimerRef.current)
        }
    }, [
        difficulty,
        gameKey,
        isLight,
        activeTheme,
        mode.net,
        mode.paddle,
        isStatic,
    ])

    const beginPlay = () => {
        startGameRef.current?.()
    }

    const setPaddleFromClientY = (clientY: number) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        if (rect.height <= 0) return
        const scaleY = COURT_H / rect.height
        paddleTargetRef.current = (clientY - rect.top) * scaleY - PADDLE_H / 2
    }

    const onCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape" && isPopupMode) {
            setPopupOpen(false)
            return
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === " ") {
            e.preventDefault()
        }
        beginPlay()
        if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
            playerMoveRef.current = -1
        }
        if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
            playerMoveRef.current = 1
        }
    }

    const onCardKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
        if (
            e.key === "w" ||
            e.key === "W" ||
            e.key === "s" ||
            e.key === "S" ||
            e.key === "ArrowUp" ||
            e.key === "ArrowDown"
        ) {
            playerMoveRef.current = 0
        }
    }

    const onCourtPointerDown = (e: PointerEvent<HTMLDivElement>) => {
        beginPlay()
        setPaddleFromClientY(e.clientY)
        e.currentTarget.setPointerCapture?.(e.pointerId)
    }

    const onCourtPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (e.buttons === 0 && e.pointerType !== "touch") return
        setPaddleFromClientY(e.clientY)
    }

    const changeDifficulty = (level: DifficultyKey) => {
        setDifficulty(level)
        setScoreA(0)
        setScoreB(0)
        setRound(1)
        setStatus("Click the court to start")
        setGameKey((k) => k + 1)
    }

    const restart = useCallback(() => {
        playerMoveRef.current = 0
        paddleTargetRef.current = null
        setScoreA(0)
        setScoreB(0)
        setRound(1)
        setStatus(
            isCoarsePointer
                ? "Tap the court to start"
                : "Click the court to start"
        )
        setGameKey((k) => k + 1)
    }, [isCoarsePointer])

    const wrapperStyle: CSSProperties = {
        ...styles.wrapper,
        background: isLight
            ? activeTheme.lightBackground
            : activeTheme.background,
        border: `1px solid ${mode.cardBorder}`,
        ...(isPopupMode
            ? {
                  height: "auto",
                  minHeight: 0,
                  maxHeight: `calc(100vh - ${demoOffset + 48}px)`,
                  overflowY: "auto",
              }
            : {}),
    }

    const gameCard = (
        <div
            ref={gameRootRef}
            style={wrapperStyle}
            tabIndex={0}
            role="application"
            aria-label={`${activeTheme.title} table tennis game`}
            onKeyDown={onCardKeyDown}
            onKeyUp={onCardKeyUp}
            onPointerDown={() => gameRootRef.current?.focus()}
            itemScope
            itemType="https://schema.org/VideoGame"
        >
            <meta itemProp="name" content={activeTheme.title} />
            <meta itemProp="genre" content="Arcade" />
            <meta
                itemProp="description"
                content="Play a browser Pong match against a bot. Choose Easy, Medium, or Hard and win ten escalating rounds."
            />
            <meta itemProp="gamePlatform" content="Web Browser" />

            <header style={styles.headerBlock}>
                <h2
                    id={`${uid}-title`}
                    itemProp="alternateName"
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
                <div
                    style={{
                        ...styles.scoreBox,
                        background: mode.surface,
                        border: `1px solid ${mode.surfaceBorder}`,
                    }}
                >
                    <div style={{ ...styles.scoreLabel, color: mode.inkFaint }}>
                        You
                    </div>
                    <div style={{ ...styles.scoreValue, color: mode.ink }}>
                        {scoreA}
                    </div>
                </div>
                <div
                    style={{
                        ...styles.scoreBox,
                        background: mode.surface,
                        border: `1px solid ${mode.surfaceBorder}`,
                    }}
                >
                    <div style={{ ...styles.scoreLabel, color: mode.inkFaint }}>
                        Bot
                    </div>
                    <div style={{ ...styles.scoreValue, color: mode.ink }}>
                        {scoreB}
                    </div>
                </div>
            </div>

            <div
                role="radiogroup"
                aria-label="Difficulty"
                style={styles.diffRow}
            >
                {(["easy", "medium", "hard"] as DifficultyKey[]).map(
                    (level) => {
                        const on = difficulty === level
                        return (
                            <button
                                key={level}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() => changeDifficulty(level)}
                                style={{
                                    ...(on ? styles.diffOn : styles.diffOff),
                                    color: on ? "#0a0a0f" : mode.inkSoft,
                                    background: on
                                        ? resolvedAccent
                                        : mode.surface,
                                    border: `1px solid ${
                                        on ? "transparent" : mode.surfaceBorder
                                    }`,
                                    transition: isStatic
                                        ? "none"
                                        : "transform 0.2s ease, opacity 0.2s ease",
                                }}
                            >
                                {DIFFICULTY[level].label}
                            </button>
                        )
                    }
                )}
            </div>

            <p style={{ ...styles.roundInfo, color: mode.inkMuted }}>
                Round {round} · First to {neededPoints}
            </p>

            <div
                style={styles.canvasWrap}
                onPointerDown={onCourtPointerDown}
                onPointerMove={onCourtPointerMove}
            >
                <canvas
                    ref={canvasRef}
                    style={styles.canvas}
                    aria-label="Pong court. Left paddle is you, right paddle is the bot."
                />
                {status ? (
                    <div
                        style={{
                            ...styles.overlay,
                            background: mode.overlayBg,
                            pointerEvents: "auto",
                            cursor: "pointer",
                        }}
                        onPointerDown={(e) => {
                            e.stopPropagation()
                            beginPlay()
                            gameRootRef.current?.focus()
                        }}
                    >
                        <p
                            style={{ ...styles.statusText, color: mode.ink }}
                            role="status"
                        >
                            {status}
                        </p>
                    </div>
                ) : null}
            </div>

            <motion.button
                type="button"
                onClick={restart}
                whileHover={isStatic ? undefined : { scale: 1.03 }}
                whileTap={isStatic ? undefined : { scale: 0.97 }}
                style={{
                    ...styles.button,
                    background: resolvedAccent,
                    transition: isStatic ? "none" : undefined,
                }}
            >
                {activeTheme.buttonText}
            </motion.button>

            <p style={{ ...styles.hint, color: mode.inkFaint }}>
                {isCoarsePointer
                    ? "Drag on the court to move your paddle"
                    : "Click the court, then use W / S or arrow keys"}
            </p>
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
                            onClick={() => {
                                setDemoTheme(key)
                                restart()
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
            <button type="button" style={styles.demoResetBtn} onClick={restart}>
                Reset Game
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
                            paddingTop: demoOffset + 32,
                            paddingBottom: 32,
                            background: mode.stageBg,
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
                        transition: isStatic ? "none" : undefined,
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
                            <PaddleIcon />
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
                            paddingTop: 24,
                            paddingBottom: 24,
                            alignItems: "center",
                            justifyContent: "center",
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
                                maxHeight: `calc(100vh - ${demoOffset + 48}px)`,
                                margin: "0 auto",
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
        justifyContent: "flex-start",
        borderRadius: 22,
        padding: "32px 26px",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        userSelect: "none",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        outline: "none",
    },
    headerBlock: {
        textAlign: "center",
        marginBottom: 18,
        width: "100%",
    },
    title: {
        margin: 0,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 25,
        fontWeight: 400,
        letterSpacing: "-0.02em",
        lineHeight: 1.15,
    },
    divider: { width: 32, height: 1, margin: "12px auto" },
    subtitle: {
        margin: 0,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
    },
    scoreRow: {
        display: "flex",
        gap: 10,
        marginBottom: 14,
        width: "100%",
        maxWidth: 340,
    },
    scoreBox: {
        flex: 1,
        borderRadius: 14,
        padding: "10px 12px",
        textAlign: "center",
        backdropFilter: "blur(8px)",
    },
    scoreLabel: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
    },
    scoreValue: {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 28,
        fontWeight: 400,
    },
    diffRow: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        justifyContent: "center",
        marginBottom: 10,
    },
    diffOn: {
        padding: "8px 14px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        cursor: "pointer",
    },
    diffOff: {
        padding: "8px 14px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        cursor: "pointer",
    },
    roundInfo: {
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        margin: "0 0 14px",
        textAlign: "center",
    },
    canvasWrap: {
        position: "relative",
        width: "100%",
        maxWidth: 460,
        borderRadius: 14,
        overflow: "hidden",
        aspectRatio: "16 / 10",
        border: "1px solid rgba(255,255,255,0.08)",
        touchAction: "none",
        cursor: "pointer",
    },
    canvas: {
        display: "block",
        width: "100%",
        height: "100%",
        touchAction: "none",
        pointerEvents: "none",
    },
    overlay: {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(6px)",
    },
    statusText: {
        margin: 0,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 22,
        fontWeight: 400,
        textAlign: "center",
    },
    button: {
        marginTop: 18,
        padding: "14px 30px",
        borderRadius: 40,
        border: "none",
        color: "#0a0a0f",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: "pointer",
    },
    hint: {
        marginTop: 14,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        textAlign: "center",
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
        flexShrink: 0,
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
        padding: 20,
        boxSizing: "border-box",
    },
    popupCardWrap: {
        width: "100%",
        maxWidth: 480,
        maxHeight: "90vh",
        position: "relative",
        margin: "0 auto",
    },
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
    inlineDemoCardWrap: { width: "100%", maxWidth: 520, margin: "0 auto" },
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
        flexShrink: 0,
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

addPropertyControls(PongGame, {
    theme: {
        type: ControlType.Enum,
        title: "Concept",
        options: Object.keys(THEMES),
        optionTitles: Object.values(THEMES).map((t) => t.name),
        defaultValue: "arcade",
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
