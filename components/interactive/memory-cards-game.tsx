// Memory Cards Game
import { useState, useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CardItem {
    color: string
    uniqueId: number
}

type Difficulty = "easy" | "medium" | "hard"
type PopupPosition = "bottom-right" | "bottom-left"

interface MemoryCardsGameProps {
    width?: number
    height?: number
    difficulty?: Difficulty
    position?: PopupPosition
    defaultOpen?: boolean
}

const ALL_COLORS = [
    "#FF2D55", // Vivid Red
    "#007AFF", // Blue
    "#34C759", // Green
    "#FF9500", // Orange
    "#AF52DE", // Purple
    "#FFCC00", // Yellow
    "#5AC8FA", // Light Blue
    "#FF3B30", // Red
    "#30D158", // Lime
    "#BF5AF2", // Violet
    "#64D2FF", // Cyan
    "#FF9F0A", // Amber
]

function shuffle<T>(array: T[]): T[] {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

const playSound = (type: "flip" | "match" | "win") => {
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as Window & { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext
        if (!AudioContextClass) return
        const ctx = new AudioContextClass()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        if (type === "flip") {
            osc.frequency.value = 380
            gain.gain.value = 0.04
            osc.start()
            osc.stop(ctx.currentTime + 0.07)
        } else if (type === "match") {
            osc.frequency.value = 700
            gain.gain.value = 0.07
            osc.start()
            osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.12)
            osc.stop(ctx.currentTime + 0.12)
        } else {
            osc.frequency.value = 500
            gain.gain.value = 0.09
            osc.start()
            osc.frequency.linearRampToValueAtTime(1300, ctx.currentTime + 0.35)
            osc.stop(ctx.currentTime + 0.35)
        }
    } catch (e) {}
}

const CardsIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
            x="2"
            y="4"
            width="9"
            height="12"
            rx="2"
            transform="rotate(-8 6.5 10)"
            fill="white"
            fillOpacity="0.9"
        />
        <rect x="12" y="6" width="10" height="14" rx="2.5" fill="white" />
    </svg>
)

/**
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 460
 */
export default function MemoryCardsGame(props: MemoryCardsGameProps) {
    const {
        width,
        height,
        difficulty: propDifficulty = "medium",
        position = "bottom-right",
        defaultOpen = false,
    } = props

    const isStatic = useIsStaticRenderer()

    const [isOpen, setIsOpen] = useState(defaultOpen)
    const [difficulty, setDifficulty] = useState<Difficulty>(propDifficulty)
    const pairCount = difficulty === "easy" ? 6 : difficulty === "hard" ? 12 : 8

    const [cards, setCards] = useState<CardItem[]>([])
    const [flipped, setFlipped] = useState<number[]>([])
    const [matched, setMatched] = useState<string[]>([])
    const [moves, setMoves] = useState(0)
    const [time, setTime] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [bestScore, setBestScore] = useState<number | null>(null)

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        const saved = localStorage.getItem("framer-memory-best")
        if (saved) setBestScore(Number(saved))
    }, [])

    useEffect(() => {
        setDifficulty(propDifficulty)
    }, [propDifficulty])

    useEffect(() => {
        startGame()
    }, [difficulty])

    useEffect(() => {
        if (isStatic || !isRunning) return
        timerRef.current = setInterval(() => setTime((t) => t + 1), 1000)
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [isRunning, isStatic])

    const startGame = () => {
        const selectedColors = ALL_COLORS.slice(0, pairCount)
        const doubled = [...selectedColors, ...selectedColors]
        const shuffled = shuffle(doubled).map((color, index) => ({
            color,
            uniqueId: index,
        }))
        setCards(shuffled)
        setFlipped([])
        setMatched([])
        setMoves(0)
        setTime(0)
        setIsRunning(false)
        setShowModal(false)
    }

    const handleCardClick = (uniqueId: number, color: string) => {
        if (
            flipped.length === 2 ||
            flipped.includes(uniqueId) ||
            matched.includes(color)
        )
            return

        if (!isRunning) setIsRunning(true)
        if (!isStatic) playSound("flip")

        const newFlipped = [...flipped, uniqueId]
        setFlipped(newFlipped)

        if (newFlipped.length === 2) {
            setMoves((m) => m + 1)
            const first = cards.find((c) => c.uniqueId === newFlipped[0])
            const second = cards.find((c) => c.uniqueId === newFlipped[1])
            if (!first || !second) return

            if (first.color === second.color) {
                if (!isStatic) playSound("match")
                setMatched((prev) => [...prev, first.color])
                setFlipped([])

                if (matched.length + 1 === pairCount) {
                    setIsRunning(false)
                    if (!isStatic) playSound("win")
                    setTimeout(() => {
                        setShowModal(true)
                        if (!bestScore || moves + 1 < bestScore) {
                            localStorage.setItem(
                                "framer-memory-best",
                                String(moves + 1)
                            )
                            setBestScore(moves + 1)
                        }
                    }, 400)
                }
            } else {
                setTimeout(() => setFlipped([]), 600)
            }
        }
    }

    const Confetti = () => (
        <div
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        width: 6 + Math.random() * 6,
                        height: 6 + Math.random() * 6,
                        background: ALL_COLORS[i % ALL_COLORS.length],
                        left: Math.random() * 100 + "%",
                        top: -20,
                        borderRadius: Math.random() > 0.5 ? "50%" : 2,
                        animation: isStatic
                            ? "none"
                            : `confetti-fall ${2 + Math.random() * 2}s linear forwards`,
                        animationDelay: isStatic
                            ? "0s"
                            : Math.random() * 0.5 + "s",
                    }}
                />
            ))}
        </div>
    )

    const columns = pairCount <= 6 ? 4 : pairCount <= 8 ? 4 : 6

    return (
        <div
            className={`widget-root ${isStatic ? "is-static" : ""}`}
            style={{ width, height }}
        >
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }

                .widget-root {
                    position: relative;
                    overflow: visible;
                    font-family: Inter, system-ui, sans-serif;
                }

                .widget-root.is-static,
                .widget-root.is-static * {
                    transition: none !important;
                    animation: none !important;
                }

                .card:focus-visible {
                    outline: 2px solid #5AC8FA;
                    outline-offset: 2px;
                }

                .fab {
                    position: absolute;
                    bottom: 0;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    background: linear-gradient(135deg, #FF2D55, #AF52DE);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
                    transition: transform 0.2s ease, opacity 0.2s ease;
                    z-index: 10;
                }
                .fab.bottom-right { right: 0; }
                .fab.bottom-left { left: 0; }
                .fab:hover { transform: scale(1.06); }
                .fab.is-hidden {
                    opacity: 0;
                    pointer-events: none;
                    transform: scale(0.8);
                }

                .panel {
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    opacity: 0;
                    transform: scale(0.85) translateY(12px);
                    pointer-events: none;
                    transition: transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease;
                    z-index: 20;
                    background: #0a0a0a;
                    color: white;
                    display: flex;
                    flex-direction: column;
                }
                .panel.bottom-right { right: 0; transform-origin: bottom right; }
                .panel.bottom-left { left: 0; transform-origin: bottom left; }
                .panel.is-open {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                    pointer-events: auto;
                }

                .close-btn {
                    background: rgba(255,255,255,0.12);
                    border: none;
                    color: white;
                    width: 26px;
                    height: 26px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 15px;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .close-btn:hover {
                    background: rgba(255,255,255,0.2);
                }

                .header {
                    flex-shrink: 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 14px;
                    background: rgba(255,255,255,0.06);
                    font-size: 13px;
                    font-weight: 600;
                    gap: 12px;
                }

                .header-left {
                    display: flex;
                    gap: 16px;
                }

                .stat-label {
                    opacity: 0.5;
                    font-weight: 500;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    margin-right: 2px;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .reset-btn {
                    background: rgba(255,255,255,0.12);
                    border: none;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 5px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                }
                .reset-btn:hover {
                    background: rgba(255,255,255,0.2);
                }

                .difficulty-select {
                    background: rgba(255,255,255,0.12);
                    border: none;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 5px 10px;
                    border-radius: 8px;
                    cursor: pointer;
                    outline: none;
                }
                .difficulty-select option {
                    background: #1c1c1e;
                    color: white;
                }

                .game {
                    flex: 1;
                    min-height: 0;
                    display: grid;
                    grid-template-columns: repeat(${columns}, minmax(0, 1fr));
                    gap: 8px;
                    padding: 10px;
                    overflow: hidden;
                }

                .card {
                    min-width: 0;
                    min-height: 0;
                    perspective: 800px;
                    cursor: pointer;
                }

                .inside {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    transform-style: preserve-3d;
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    border-radius: 12px;
                }

                .inside.flipped {
                    transform: rotateY(180deg);
                }

                .inside.matched {
                    animation: matchPulse 0.4s ease;
                }

                @keyframes matchPulse {
                    0%   { transform: rotateY(180deg) scale(1); }
                    50%  { transform: rotateY(180deg) scale(1.06); }
                    100% { transform: rotateY(180deg) scale(1); }
                }

                .front, .back {
                    position: absolute;
                    inset: 0;
                    backface-visibility: hidden;
                    border-radius: 12px;
                }

                .back {
                    background: white;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.25);
                }

                .front {
                    transform: rotateY(180deg);
                }

                .modal-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.88);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                }

                .modal {
                    background: #1c1c1e;
                    padding: 32px 24px;
                    border-radius: 18px;
                    text-align: center;
                    width: 90%;
                    max-width: 320px;
                    border: 1px solid rgba(255,255,255,0.08);
                }

                .modal h2 {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    background: linear-gradient(90deg, #FF2D55, #AF52DE);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .stats {
                    margin: 16px 0;
                    font-size: 15px;
                    opacity: 0.9;
                    line-height: 1.5;
                }

                .restart {
                    background: linear-gradient(90deg, #FF2D55, #AF52DE);
                    border: none;
                    color: white;
                    font-weight: 700;
                    font-size: 15px;
                    padding: 12px 26px;
                    border-radius: 11px;
                    cursor: pointer;
                }

                @keyframes confetti-fall {
                    0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
            `}</style>

            {/* Floating trigger button */}
            <button
                className={`fab ${position} ${isOpen ? "is-hidden" : ""}`}
                onClick={() => setIsOpen(true)}
                aria-label="Open memory game"
            >
                <CardsIcon />
            </button>

            {/* Popup panel */}
            <div className={`panel ${position} ${isOpen ? "is-open" : ""}`}>
                {/* Header */}
                <div className="header">
                    <div className="header-left">
                        <span>
                            <span className="stat-label">Time</span> {time}s
                        </span>
                        <span>
                            <span className="stat-label">Moves</span> {moves}
                        </span>
                        <span>
                            <span className="stat-label">Best</span>{" "}
                            {bestScore ?? "—"}
                        </span>
                    </div>

                    <div className="header-right">
                        <button className="reset-btn" onClick={startGame}>
                            Reset
                        </button>

                        <select
                            className="difficulty-select"
                            value={difficulty}
                            onChange={(e) =>
                                setDifficulty(e.target.value as Difficulty)
                            }
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>

                        <button
                            className="close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close memory game"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Game Grid */}
                <div className="game">
                    {cards.map((card) => {
                        const isFlipped =
                            flipped.includes(card.uniqueId) ||
                            matched.includes(card.color)
                        return (
                            <div
                                key={card.uniqueId}
                                className="card"
                                role="button"
                                tabIndex={0}
                                aria-pressed={isFlipped}
                                aria-label={
                                    isFlipped
                                        ? "Memory card, revealed"
                                        : "Memory card, hidden"
                                }
                                onClick={() =>
                                    handleCardClick(card.uniqueId, card.color)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault()
                                        handleCardClick(
                                            card.uniqueId,
                                            card.color
                                        )
                                    }
                                }}
                            >
                                <div
                                    className={`inside ${isFlipped ? "flipped" : ""} ${matched.includes(card.color) ? "matched" : ""}`}
                                >
                                    <div className="back" />
                                    <div
                                        className="front"
                                        style={{ background: card.color }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Win Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <Confetti />
                        <div className="modal">
                            <h2>You Rock!</h2>
                            <div className="stats">
                                <div>{moves} moves</div>
                                <div>{time} seconds</div>
                                {bestScore === moves && (
                                    <div
                                        style={{
                                            marginTop: 6,
                                            color: "#FFD700",
                                        }}
                                    >
                                        New record!
                                    </div>
                                )}
                            </div>
                            <button className="restart" onClick={startGame}>
                                Play Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(MemoryCardsGame, {
    position: {
        type: ControlType.Enum,
        title: "Popup Side",
        description: "Corner the toggle button and popup panel anchor to.",
        options: ["bottom-right", "bottom-left"],
        optionTitles: ["Bottom Right", "Bottom Left"],
        defaultValue: "bottom-right",
    },
    defaultOpen: {
        type: ControlType.Boolean,
        title: "Open by Default",
        description:
            "Show the game panel expanded instead of collapsed to the button.",
        defaultValue: false,
    },
    difficulty: {
        type: ControlType.Enum,
        title: "Difficulty",
        description: "Number of pairs to match.",
        options: ["easy", "medium", "hard"],
        optionTitles: ["Easy (6 pairs)", "Medium (8 pairs)", "Hard (12 pairs)"],
        defaultValue: "medium",
    },
})
