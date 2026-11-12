// DinoJumpGame.tsx
import { useState, useEffect, useRef, useCallback, CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 560
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type GameState = "menu" | "playing" | "gameover"
type Difficulty = "easy" | "medium" | "hard"
type Trigger = "manual" | "delay" | "scroll"
type WidgetPosition = "bottom-right" | "bottom-left"

interface Obstacle {
    x: number
    width: number
    height: number
    passed: boolean
}

interface GameRef {
    dinoY: number
    dinoVY: number
    isJumping: boolean
    obstacles: Obstacle[]
    speed: number
    frame: number
    score: number
    animationId: number
    groundY: number
    width: number
    height: number
}

interface FontValue {
    fontFamily?: string
    fontWeight?: number | string
    fontSize?: number | string
    letterSpacing?: number | string
    lineHeight?: number | string
    textAlign?: "left" | "center" | "right" | "justify"
}

interface ImageItem {
    src: string
    srcSet?: string
    alt?: string
}

interface DinoJumpGameProps {
    style?: CSSProperties
    title: string
    subtitle: string
    description: string
    startLabel: string
    playAgainLabel: string
    readyLabel: string
    startHint: string
    gameOverLabel: string
    scoreLabel: string
    bestLabel: string
    tapHint: string
    widgetLabel: string
    widgetEyebrow: string
    background: string
    canvasBackground: string
    groundColor: string
    dinoColor: string
    cactusColor: string
    textColor: string
    mutedColor: string
    buttonBackground: string
    buttonText: string
    overlayBackground: string
    titleFont: FontValue
    bodyFont: FontValue
    defaultDifficulty: Difficulty
    highScoreKey: string
    demoMode?: boolean
    asPopup?: boolean
    trigger?: Trigger
    delaySeconds?: number
    widgetPosition?: WidgetPosition
    widgetIcon?: ImageItem | string
}

const SPEED_MAP: Record<Difficulty, number> = {
    easy: 5,
    medium: 7,
    hard: 9.5,
}

const CANVAS_H = 320

const getImageSrc = (img: ImageItem | string): string =>
    typeof img === "string" ? img : img.src

function DinoIcon() {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <rect x="4" y="10" width="12" height="8" fill="#fff" />
            <rect x="14" y="6" width="7" height="7" fill="#fff" />
            <rect x="18" y="8" width="2" height="2" fill="#111" />
            <rect x="2" y="12" width="4" height="3" fill="#fff" />
        </svg>
    )
}

function CloseIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
                d="M2 2l10 10M12 2L2 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    )
}

export default function DinoJumpGame(props: DinoJumpGameProps) {
    const {
        style,
        title,
        subtitle,
        description,
        startLabel,
        playAgainLabel,
        readyLabel,
        startHint,
        gameOverLabel,
        scoreLabel,
        bestLabel,
        tapHint,
        widgetLabel,
        widgetEyebrow,
        background,
        canvasBackground,
        groundColor,
        dinoColor,
        cactusColor,
        textColor,
        mutedColor,
        buttonBackground,
        buttonText,
        overlayBackground,
        titleFont,
        bodyFont,
        defaultDifficulty,
        highScoreKey,
        demoMode = false,
        asPopup = false,
        trigger = "manual",
        delaySeconds = 4,
        widgetPosition = "bottom-right",
        widgetIcon,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const focusRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const canvasWrapRef = useRef<HTMLDivElement>(null)
    const demoBarRef = useRef<HTMLDivElement>(null)
    const widgetTriggerRef = useRef<HTMLButtonElement>(null)
    const isVisibleRef = useRef(true)
    const mountedRef = useRef(true)
    const wasPopupOpenRef = useRef(false)

    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(0)
    const [gameState, setGameState] = useState<GameState>("menu")
    const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty)
    const [isVisible, setIsVisible] = useState(true)
    const [popupOpen, setPopupOpen] = useState(!asPopup)
    const [scrollTriggered, setScrollTriggered] = useState(false)
    const [demoAsPopup, setDemoAsPopup] = useState(asPopup)
    const [demoDifficulty, setDemoDifficulty] =
        useState<Difficulty>(defaultDifficulty)
    const [demoBarHeight, setDemoBarHeight] = useState(0)

    const isPopupMode = demoMode ? demoAsPopup : asPopup
    const activeDifficulty = demoMode ? demoDifficulty : difficulty

    const gameRef = useRef<GameRef>({
        dinoY: 0,
        dinoVY: 0,
        isJumping: false,
        obstacles: [],
        speed: SPEED_MAP[defaultDifficulty],
        frame: 0,
        score: 0,
        animationId: 0,
        groundY: CANVAS_H - 48,
        width: 640,
        height: CANVAS_H,
    })

    const focusGame = useCallback(() => {
        if (isStatic) return
        focusRef.current?.focus({ preventScroll: true })
    }, [isStatic])

    const drawDino = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            frame: number
        ) => {
            ctx.fillStyle = dinoColor
            ctx.fillRect(x + 8, y + 12, 28, 24)
            ctx.fillRect(x + 28, y + 4, 18, 16)
            ctx.fillStyle = canvasBackground
            ctx.fillRect(x + 38, y + 8, 4, 4)
            ctx.fillStyle = dinoColor
            const legOffset = Math.floor(frame / 6) % 2 === 0 ? 0 : 4
            ctx.fillRect(x + 10, y + 36, 6, 12 - legOffset)
            ctx.fillRect(x + 24, y + 36, 6, 12 + legOffset - 4)
            ctx.fillRect(x, y + 18, 10, 6)
        },
        [canvasBackground, dinoColor]
    )

    const drawCactus = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            w: number,
            h: number
        ) => {
            ctx.fillStyle = cactusColor
            ctx.fillRect(x + w * 0.3, y, w * 0.4, h)
            ctx.fillRect(x, y + h * 0.3, w * 0.35, w * 0.35)
            ctx.fillRect(x + w * 0.65, y + h * 0.5, w * 0.35, w * 0.3)
        },
        [cactusColor]
    )

    const sizeCanvas = useCallback(() => {
        const wrap = canvasWrapRef.current
        const canvas = canvasRef.current
        if (!canvas) return
        const g = gameRef.current
        const rect = wrap?.getBoundingClientRect()
        const w = Math.max(
            320,
            Math.floor(rect?.width || wrap?.clientWidth || 640)
        )
        const h = Math.max(
            240,
            Math.floor(rect?.height || wrap?.clientHeight || CANVAS_H)
        )
        canvas.width = w
        canvas.height = h
        g.width = w
        g.height = h
        g.groundY = h - 48
        if (!g.isJumping) g.dinoY = g.groundY - 48
    }, [])

    const paintIdle = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const g = gameRef.current
        const w = canvas.width || 640
        const h = canvas.height || CANVAS_H
        ctx.fillStyle = canvasBackground
        ctx.fillRect(0, 0, w, h)
        ctx.strokeStyle = groundColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, g.groundY + 2)
        ctx.lineTo(w, g.groundY + 2)
        ctx.stroke()
        drawDino(ctx, 60, g.groundY - 48, 0)
        drawCactus(ctx, Math.max(180, w * 0.62), g.groundY - 44, 22, 44)
    }, [canvasBackground, drawCactus, drawDino, groundColor])

    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
        }
    }, [])

    useEffect(() => {
        if (isStatic) return
        try {
            const saved = localStorage.getItem(highScoreKey)
            if (saved) setHighScore(parseInt(saved, 10) || 0)
        } catch {
            /* ignore */
        }
    }, [highScoreKey, isStatic])

    useEffect(() => {
        setDifficulty(defaultDifficulty)
        setDemoDifficulty(defaultDifficulty)
    }, [defaultDifficulty])

    useEffect(() => {
        setPopupOpen(!isPopupMode)
    }, [isPopupMode])

    useEffect(() => {
        if (isStatic) return
        if (!isPopupMode || trigger !== "delay") return
        const t = setTimeout(() => setPopupOpen(true), delaySeconds * 1000)
        return () => clearTimeout(t)
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
        const ro = new ResizeObserver(([entry]) => {
            setDemoBarHeight(entry.contentRect.height)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [demoMode, isStatic])

    useEffect(() => {
        if (isStatic) return
        if (isPopupMode && !popupOpen && wasPopupOpenRef.current) {
            widgetTriggerRef.current?.focus()
        }
        wasPopupOpenRef.current = popupOpen
    }, [isPopupMode, popupOpen, isStatic])

    useEffect(() => {
        if (!isStatic) return
        sizeCanvas()
        paintIdle()
    }, [isStatic, sizeCanvas, paintIdle])

    useEffect(() => {
        if (isStatic) return
        if (isPopupMode && !popupOpen) return
        let id1 = 0
        let id2 = 0
        id1 = requestAnimationFrame(() => {
            sizeCanvas()
            paintIdle()
            focusGame()
            id2 = requestAnimationFrame(() => {
                sizeCanvas()
                if (gameState !== "playing") paintIdle()
                focusGame()
            })
        })
        return () => {
            cancelAnimationFrame(id1)
            cancelAnimationFrame(id2)
        }
    }, [
        isStatic,
        popupOpen,
        isPopupMode,
        sizeCanvas,
        paintIdle,
        gameState,
        focusGame,
    ])

    useEffect(() => {
        if (isStatic) return
        const el = focusRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic, popupOpen])

    useEffect(() => {
        if (isStatic) return
        const wrap = canvasWrapRef.current
        if (!wrap) return
        sizeCanvas()
        paintIdle()
        const ro = new ResizeObserver(() => {
            sizeCanvas()
            if (gameRef.current.animationId === 0 || gameState !== "playing") {
                paintIdle()
            }
        })
        ro.observe(wrap)
        return () => ro.disconnect()
    }, [isStatic, sizeCanvas, paintIdle, popupOpen, isPopupMode, gameState])

    useEffect(() => {
        if (isStatic) return
        sizeCanvas()
        if (gameState !== "playing" || !isVisible) {
            paintIdle()
            return
        }

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const g = gameRef.current
        g.speed = SPEED_MAP[activeDifficulty]
        g.obstacles = []
        g.score = 0
        g.frame = 0
        g.dinoY = g.groundY - 48
        g.dinoVY = 0
        g.isJumping = false
        setScore(0)

        const spawnObstacle = () => {
            g.obstacles.push({
                x: g.width + 20,
                width: 18 + Math.random() * 12,
                height: 30 + Math.random() * 25,
                passed: false,
            })
        }
        spawnObstacle()

        const loop = () => {
            if (!mountedRef.current || !isVisibleRef.current) return
            g.frame++
            ctx.fillStyle = canvasBackground
            ctx.fillRect(0, 0, g.width, g.height)
            ctx.strokeStyle = groundColor
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(0, g.groundY + 2)
            ctx.lineTo(g.width, g.groundY + 2)
            ctx.stroke()

            if (g.isJumping) {
                g.dinoVY += 0.85
                g.dinoY += g.dinoVY
                if (g.dinoY >= g.groundY - 48) {
                    g.dinoY = g.groundY - 48
                    g.dinoVY = 0
                    g.isJumping = false
                }
            }

            drawDino(ctx, 60, g.dinoY, g.frame)

            for (let i = g.obstacles.length - 1; i >= 0; i--) {
                const obs = g.obstacles[i]
                obs.x -= g.speed
                drawCactus(
                    ctx,
                    obs.x,
                    g.groundY - obs.height,
                    obs.width,
                    obs.height
                )

                if (
                    60 + 36 > obs.x &&
                    60 < obs.x + obs.width &&
                    g.dinoY + 48 > g.groundY - obs.height
                ) {
                    setGameState("gameover")
                    if (g.score > highScore) {
                        setHighScore(g.score)
                        try {
                            localStorage.setItem(highScoreKey, String(g.score))
                        } catch {
                            /* ignore */
                        }
                    }
                    return
                }

                if (obs.x + obs.width < 60 && !obs.passed) {
                    obs.passed = true
                    g.score += 1
                    setScore(g.score)
                }
                if (obs.x + obs.width < 0) g.obstacles.splice(i, 1)
            }

            if (
                g.obstacles.length === 0 ||
                g.obstacles[g.obstacles.length - 1].x <
                    g.width - 280 - Math.random() * 200
            ) {
                spawnObstacle()
            }

            if (g.frame % 400 === 0) g.speed += 0.25
            g.animationId = requestAnimationFrame(loop)
        }

        g.animationId = requestAnimationFrame(loop)
        return () => {
            cancelAnimationFrame(g.animationId)
            g.animationId = 0
        }
    }, [
        isStatic,
        gameState,
        activeDifficulty,
        isVisible,
        canvasBackground,
        groundColor,
        drawDino,
        drawCactus,
        highScore,
        highScoreKey,
        sizeCanvas,
        paintIdle,
    ])

    const jump = useCallback(() => {
        if (isStatic) return
        if (gameState === "menu") {
            setGameState("playing")
            return
        }
        if (gameState !== "playing") return
        const g = gameRef.current
        if (!g.isJumping) {
            g.isJumping = true
            g.dinoVY = -14.5
        }
    }, [gameState, isStatic])

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (isStatic) return
        if (e.key === "Escape" && isPopupMode) {
            e.preventDefault()
            setPopupOpen(false)
            return
        }
        if (e.code === "Space" || e.key === " " || e.key === "ArrowUp") {
            e.preventDefault()
            e.stopPropagation()
            jump()
        }
        if (e.key === "Enter" && gameState !== "playing") {
            e.preventDefault()
            jump()
        }
    }

    const btnBase: CSSProperties = {
        background: "transparent",
        border: `1px solid ${groundColor}`,
        borderRadius: 8,
        padding: "7px 16px",
        fontSize: 13,
        fontWeight: 500,
        color: textColor,
        cursor: "pointer",
        transition: isStatic
            ? "none"
            : "background 0.15s ease, color 0.15s ease",
        fontFamily: bodyFont.fontFamily,
    }

    const overlayStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        background: overlayBackground,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 16,
        pointerEvents: "auto",
    }

    const closeButton = (
        <button
            type="button"
            onClick={() => setPopupOpen(false)}
            aria-label="Close"
            style={styles.popupClose}
        >
            <CloseIcon />
        </button>
    )

    const gameCard = (
        <div
            ref={focusRef}
            role="application"
            aria-label={title}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onClick={focusGame}
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background,
                fontFamily: bodyFont.fontFamily,
                userSelect: "none",
                outline: "none",
                borderRadius: 22,
                padding: "24px 16px 16px",
                boxSizing: "border-box",
                ...style,
            }}
        >
            <header
                style={{
                    textAlign: "center",
                    marginBottom: 16,
                    width: "100%",
                    maxWidth: 640,
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        color: textColor,
                        fontFamily: titleFont.fontFamily,
                        fontWeight: titleFont.fontWeight,
                        fontSize: titleFont.fontSize,
                        letterSpacing: titleFont.letterSpacing,
                        lineHeight: titleFont.lineHeight,
                        textAlign: titleFont.textAlign ?? "center",
                    }}
                >
                    {title}
                </h2>
                <p
                    style={{
                        margin: "6px 0 0",
                        fontSize: bodyFont.fontSize,
                        color: mutedColor,
                    }}
                >
                    {subtitle}
                </p>
                <p
                    style={{
                        margin: "8px auto 0",
                        fontSize: 13,
                        color: mutedColor,
                        maxWidth: 520,
                        lineHeight: 1.45,
                    }}
                >
                    {description}
                </p>
                <div
                    aria-live="polite"
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 24,
                        marginTop: 12,
                        fontSize: 14,
                        color: mutedColor,
                    }}
                >
                    <span>
                        {scoreLabel}:{" "}
                        <b style={{ color: textColor }}>{score}</b>
                    </span>
                    <span>
                        {bestLabel}:{" "}
                        <b style={{ color: textColor }}>{highScore}</b>
                    </span>
                </div>
                {!demoMode && (
                    <div
                        role="radiogroup"
                        aria-label="Difficulty"
                        style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "center",
                            marginTop: 14,
                            flexWrap: "wrap",
                        }}
                    >
                        {(["easy", "medium", "hard"] as const).map((level) => {
                            const selected = difficulty === level
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => {
                                        setDifficulty(level)
                                        if (gameState === "playing")
                                            setGameState("menu")
                                    }}
                                    style={{
                                        ...btnBase,
                                        background: selected
                                            ? buttonBackground
                                            : "transparent",
                                        color: selected
                                            ? buttonText
                                            : textColor,
                                        borderColor: selected
                                            ? buttonBackground
                                            : groundColor,
                                    }}
                                >
                                    {level.charAt(0).toUpperCase() +
                                        level.slice(1)}
                                </button>
                            )
                        })}
                    </div>
                )}
            </header>

            <div
                ref={canvasWrapRef}
                onPointerDown={(e) => {
                    e.preventDefault()
                    focusGame()
                    jump()
                }}
                style={{
                    position: "relative",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                    background: canvasBackground,
                    width: "100%",
                    maxWidth: 900,
                    height: CANVAS_H,
                    minHeight: CANVAS_H,
                    flexShrink: 0,
                    cursor: "pointer",
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={640}
                    height={CANVAS_H}
                    role="img"
                    aria-label={`${title}. Press Space to jump.`}
                    style={{
                        display: "block",
                        width: "100%",
                        height: CANVAS_H,
                        background: canvasBackground,
                    }}
                />

                {gameState === "menu" && (
                    <div style={overlayStyle}>
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: 600,
                                marginBottom: 8,
                                color: textColor,
                                fontFamily: titleFont.fontFamily,
                            }}
                        >
                            {readyLabel}
                        </div>
                        <div
                            style={{
                                fontSize: 14,
                                color: mutedColor,
                                marginBottom: 20,
                            }}
                        >
                            {startHint}
                        </div>
                        <button
                            type="button"
                            onPointerDown={(e) => {
                                e.stopPropagation()
                                jump()
                            }}
                            style={{
                                ...btnBase,
                                background: buttonBackground,
                                color: buttonText,
                                borderColor: buttonBackground,
                                padding: "10px 28px",
                            }}
                        >
                            {startLabel}
                        </button>
                    </div>
                )}

                {gameState === "gameover" && (
                    <div style={overlayStyle} role="alert">
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: 600,
                                marginBottom: 8,
                                color: textColor,
                                fontFamily: titleFont.fontFamily,
                            }}
                        >
                            {gameOverLabel}
                        </div>
                        <div
                            style={{
                                fontSize: 15,
                                color: mutedColor,
                                marginBottom: 6,
                            }}
                        >
                            {scoreLabel}: {score}
                        </div>
                        <button
                            type="button"
                            onPointerDown={(e) => {
                                e.stopPropagation()
                                setGameState("playing")
                            }}
                            style={{
                                ...btnBase,
                                background: buttonBackground,
                                color: buttonText,
                                borderColor: buttonBackground,
                                padding: "10px 28px",
                                marginTop: 12,
                            }}
                        >
                            {playAgainLabel}
                        </button>
                    </div>
                )}
            </div>

            <p
                style={{
                    marginTop: 16,
                    fontSize: 12,
                    color: mutedColor,
                    textAlign: "center",
                }}
            >
                {tapHint}
            </p>
        </div>
    )

    const widgetOnRight = widgetPosition !== "bottom-left"

    const demoBar = demoMode ? (
        <div ref={demoBarRef} style={styles.demoBar}>
            <div style={styles.demoChip}>
                <div style={styles.demoDot} />
                <span style={styles.demoTitle}>Demo</span>
            </div>
            <div style={styles.demoRow}>
                <span style={styles.demoLabel}>Difficulty</span>
                <div style={styles.demoBtns}>
                    {(["easy", "medium", "hard"] as const).map((level) => (
                        <button
                            key={level}
                            type="button"
                            aria-pressed={demoDifficulty === level}
                            onClick={() => {
                                setDemoDifficulty(level)
                                setGameState("menu")
                            }}
                            style={
                                demoDifficulty === level
                                    ? styles.demoBtnOn
                                    : styles.demoBtnOff
                            }
                        >
                            {level}
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
                        onClick={() => {
                            setDemoAsPopup(true)
                            setGameState("menu")
                        }}
                        style={
                            demoAsPopup ? styles.demoBtnOn : styles.demoBtnOff
                        }
                    >
                        On
                    </button>
                    <button
                        type="button"
                        aria-pressed={!demoAsPopup}
                        onClick={() => {
                            setDemoAsPopup(false)
                            setGameState("menu")
                        }}
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
                onClick={() => setGameState("menu")}
            >
                Reset Game
            </button>
        </div>
    ) : null

    const widgetButton = (
        <button
            ref={widgetTriggerRef}
            type="button"
            onClick={() => {
                setPopupOpen(true)
                setGameState("menu")
            }}
            aria-label={widgetLabel}
            style={styles.widgetPill}
        >
            <span style={styles.widgetIconCircle}>
                {widgetIcon ? (
                    <img
                        src={getImageSrc(widgetIcon)}
                        alt=""
                        style={styles.widgetIconImg}
                    />
                ) : (
                    <DinoIcon />
                )}
            </span>
            <span style={styles.widgetPillTextCol}>
                <span style={styles.widgetPillEyebrow}>{widgetEyebrow}</span>
                <span style={styles.widgetPillText}>{widgetLabel}</span>
            </span>
        </button>
    )

    if (!isPopupMode) {
        return (
            <div ref={rootRef}>
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

    return (
        <div ref={rootRef}>
            {!popupOpen && (
                <div
                    style={{
                        ...styles.widgetContainer,
                        ...(widgetOnRight ? { right: 24 } : { left: 24 }),
                    }}
                >
                    {isStatic ? (
                        widgetButton
                    ) : (
                        <motion.div
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {widgetButton}
                        </motion.div>
                    )}
                </div>
            )}

            {isStatic ? (
                popupOpen ? (
                    <div
                        style={{
                            ...styles.popupOverlayFixed,
                            top: demoMode ? demoBarHeight : 0,
                        }}
                    >
                        <div style={styles.popupCardWrap}>
                            {closeButton}
                            {gameCard}
                        </div>
                    </div>
                ) : null
            ) : (
                <AnimatePresence>
                    {popupOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onKeyDown={onKeyDown}
                            style={{
                                ...styles.popupOverlayFixed,
                                top: demoMode ? demoBarHeight : 0,
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.94, y: 16 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.96, opacity: 0 }}
                                transition={{
                                    duration: 0.35,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                                role="dialog"
                                aria-modal="true"
                                aria-label={title}
                                style={styles.popupCardWrap}
                            >
                                {closeButton}
                                {gameCard}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
            {demoBar}
        </div>
    )
}

const styles: { [key: string]: CSSProperties } = {
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
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
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
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10001,
        padding: 24,
        boxSizing: "border-box",
    },
    popupCardWrap: {
        width: "min(640px, 100%)",
        position: "relative",
        overflow: "visible",
        borderRadius: 22,
        flexShrink: 0,
    },
    popupClose: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "1px solid rgba(0,0,0,0.12)",
        background: "#111",
        color: "#fff",
        cursor: "pointer",
        zIndex: 20,
        padding: 0,
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        lineHeight: 1,
    },
    inlineDemoStage: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 20,
        paddingRight: 20,
        boxSizing: "border-box",
        background: "#f4f4f5",
    },
    inlineDemoCardWrap: { width: "100%", maxWidth: 720 },
    demoBar: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10002,
        background: "rgba(8,8,10,0.92)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "12px 16px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        rowGap: 10,
        overflowX: "hidden",
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
    demoRow: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        minWidth: 0,
    },
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
        whiteSpace: "nowrap",
        marginLeft: 0,
    },
}

DinoJumpGame.defaultProps = {
    title: "Dino Jump Game",
    subtitle: "Space / Arrow Up / tap to jump",
    description: "Endless runner. Jump over cacti and beat your high score.",
    startLabel: "Start Game",
    playAgainLabel: "Play Again",
    readyLabel: "Ready?",
    startHint: "Press Space or tap to start",
    gameOverLabel: "Game Over",
    scoreLabel: "Score",
    bestLabel: "Best",
    tapHint: "Space, Arrow Up or tap to jump",
    widgetLabel: "Play Dino",
    widgetEyebrow: "Mini game",
    background: "#fafafa",
    canvasBackground: "#ffffff",
    groundColor: "#e0e0e0",
    dinoColor: "#333333",
    cactusColor: "#2d5a27",
    textColor: "#111111",
    mutedColor: "#888888",
    buttonBackground: "#111111",
    buttonText: "#ffffff",
    overlayBackground: "rgba(250,250,250,0.92)",
    titleFont: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 600,
        fontSize: 22,
        textAlign: "center",
    },
    bodyFont: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 13,
        textAlign: "center",
    },
    defaultDifficulty: "medium",
    highScoreKey: "dino-jump-highscore",
    demoMode: false,
    asPopup: false,
    trigger: "manual",
    delaySeconds: 4,
    widgetPosition: "bottom-right",
}

addPropertyControls(DinoJumpGame, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Dino Jump Game",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Space / Arrow Up / tap to jump",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
        defaultValue:
            "Endless runner. Jump over cacti and beat your high score.",
    },
    startLabel: {
        type: ControlType.String,
        title: "Start Label",
        defaultValue: "Start Game",
    },
    playAgainLabel: {
        type: ControlType.String,
        title: "Play Again",
        defaultValue: "Play Again",
    },
    readyLabel: {
        type: ControlType.String,
        title: "Ready Label",
        defaultValue: "Ready?",
    },
    startHint: {
        type: ControlType.String,
        title: "Start Hint",
        defaultValue: "Press Space or tap to start",
    },
    gameOverLabel: {
        type: ControlType.String,
        title: "Game Over",
        defaultValue: "Game Over",
    },
    scoreLabel: {
        type: ControlType.String,
        title: "Score Label",
        defaultValue: "Score",
    },
    bestLabel: {
        type: ControlType.String,
        title: "Best Label",
        defaultValue: "Best",
    },
    tapHint: {
        type: ControlType.String,
        title: "Tap Hint",
        defaultValue: "Space, Arrow Up or tap to jump",
    },
    widgetEyebrow: {
        type: ControlType.String,
        title: "Widget Eyebrow",
        defaultValue: "Mini game",
    },
    widgetLabel: {
        type: ControlType.String,
        title: "Widget Label",
        defaultValue: "Play Dino",
    },
    defaultDifficulty: {
        type: ControlType.Enum,
        title: "Difficulty",
        options: ["easy", "medium", "hard"],
        optionTitles: ["Easy", "Medium", "Hard"],
        defaultValue: "medium",
    },
    highScoreKey: {
        type: ControlType.String,
        title: "Storage Key",
        defaultValue: "dino-jump-highscore",
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
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#fafafa",
    },
    canvasBackground: {
        type: ControlType.Color,
        title: "Canvas BG",
        defaultValue: "#ffffff",
    },
    groundColor: {
        type: ControlType.Color,
        title: "Ground",
        defaultValue: "#e0e0e0",
    },
    dinoColor: {
        type: ControlType.Color,
        title: "Dino",
        defaultValue: "#333333",
    },
    cactusColor: {
        type: ControlType.Color,
        title: "Cactus",
        defaultValue: "#2d5a27",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#111111",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "#888888",
    },
    buttonBackground: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: "#111111",
    },
    buttonText: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#ffffff",
    },
    overlayBackground: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "rgba(250,250,250,0.92)",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultValue: {
            fontSize: 22,
            lineHeight: "1.2em",
            textAlign: "center",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
        defaultValue: {
            fontSize: 13,
            lineHeight: "1.4em",
            textAlign: "center",
        },
    },
})
