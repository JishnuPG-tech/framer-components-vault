import {
    useState,
    useEffect,
    useCallback,
    useRef,
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
        name: "Night Match",
        title: "Memory",
        subtitle: "Find the matching marks",
        buttonText: "New Game",
        triggerText: "Play Memory",
        glow: "rgba(255,255,255,0.16)",
        background: "linear-gradient(160deg, #07080b 0%, #101319 100%)",
        lightBackground: "linear-gradient(160deg, #f4f6fa 0%, #dfe6f0 100%)",
    },
    neon: {
        name: "Neon Pair",
        title: "Recall",
        subtitle: "Flip two. Keep the pair.",
        buttonText: "Shuffle",
        triggerText: "Open Memory",
        glow: "rgba(129,140,248,0.22)",
        background: "linear-gradient(160deg, #06050c 0%, #100a1c 100%)",
        lightBackground: "linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)",
    },
    gold: {
        name: "Gold Set",
        title: "Pairs",
        subtitle: "Fewer moves, higher score",
        buttonText: "Deal Again",
        triggerText: "Start Pairs",
        glow: "rgba(251,191,36,0.20)",
        background: "linear-gradient(160deg, #0c0904 0%, #1a1206 100%)",
        lightBackground: "linear-gradient(160deg, #fff7ed 0%, #fde8cf 100%)",
    },
    tide: {
        name: "Tide",
        title: "Match",
        subtitle: "Easy, medium or hard",
        buttonText: "New Board",
        triggerText: "Play Match",
        glow: "rgba(45,212,191,0.20)",
        background: "linear-gradient(160deg, #04080a 0%, #081619 100%)",
        lightBackground: "linear-gradient(160deg, #ecfeff 0%, #cffafe 100%)",
    },
}

const MARKS = [
    { id: "orb", mark: "●" },
    { id: "ring", mark: "○" },
    { id: "plus", mark: "+" },
    { id: "dash", mark: "—" },
    { id: "sq", mark: "■" },
    { id: "dia", mark: "◆" },
    { id: "tri", mark: "▲" },
    { id: "star", mark: "✶" },
]

const DIFFICULTY: {
    [key: string]: { pairs: number; label: string; columns: number }
} = {
    easy: { pairs: 4, label: "Easy", columns: 4 },
    medium: { pairs: 6, label: "Medium", columns: 4 },
    hard: { pairs: 8, label: "Hard", columns: 4 },
}

function MemoryIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <rect
                x="3"
                y="3"
                width="8"
                height="8"
                rx="1.5"
                stroke="#ffc93c"
                strokeWidth="1.6"
            />
            <rect
                x="13"
                y="3"
                width="8"
                height="8"
                rx="1.5"
                stroke="#fffceb"
                strokeWidth="1.6"
            />
            <rect
                x="3"
                y="13"
                width="8"
                height="8"
                rx="1.5"
                stroke="#fffceb"
                strokeWidth="1.6"
            />
            <rect
                x="13"
                y="13"
                width="8"
                height="8"
                rx="1.5"
                stroke="#ffc93c"
                strokeWidth="1.6"
            />
        </svg>
    )
}

interface Tile {
    id: number
    markId: string
    mark: string
}

interface MemoryGame2Props {
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
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 680
 */
export default function MemoryGame2(props: MemoryGame2Props) {
    const {
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
    const delayTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>()
    const flipTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>()
    const winTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>()
    const isVisibleRef = useRef(true)
    const generationRef = useRef(0)

    const [difficulty, setDifficulty] = useState("medium")
    const [tiles, setTiles] = useState<Tile[]>([])
    const [flipped, setFlipped] = useState<number[]>([])
    const [matched, setMatched] = useState<number[]>([])
    const [locked, setLocked] = useState(false)
    const [moves, setMoves] = useState(0)
    const [score, setScore] = useState(0)
    const [won, setWon] = useState(false)
    const [popupOpen, setPopupOpen] = useState(!asPopup)
    const [scrollTriggered, setScrollTriggered] = useState(false)
    const [demoTheme, setDemoTheme] = useState(theme)
    const [demoAsPopup, setDemoAsPopup] = useState(asPopup)
    const [demoLightMode, setDemoLightMode] = useState(lightMode)
    const [demoBarHeight, setDemoBarHeight] = useState(72)

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
              face: "rgba(23,26,33,0.06)",
              faceInk: "#171a21",
              back: "rgba(255,255,255,0.85)",
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
              face: "rgba(255,255,255,0.06)",
              faceInk: "rgba(255,255,255,0.55)",
              back: "rgba(255,255,255,0.1)",
              focus: "0 0 0 2px rgba(255,255,255,0.45)",
          }
    useEffect(() => {
        return () => {
            clearTimeout(delayTimerRef.current)
            clearTimeout(flipTimerRef.current)
            clearTimeout(winTimerRef.current)
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

    const wasPopupOpenRef = useRef(false)
    useEffect(() => {
        if (isStatic) return
        if (!isPopupMode || popupOpen) gameRootRef.current?.focus()
        else if (wasPopupOpenRef.current) widgetTriggerRef.current?.focus()
        wasPopupOpenRef.current = popupOpen
    }, [isPopupMode, popupOpen, isStatic])

    const shuffle = (array: { id: string; mark: string }[]) => {
        const arr = [...array]
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    }

    const createBoard = useCallback(
        (level = difficulty) => {
            generationRef.current += 1
            clearTimeout(flipTimerRef.current)
            clearTimeout(winTimerRef.current)
            const pairCount = DIFFICULTY[level].pairs
            const selected = MARKS.slice(0, pairCount)
            const pairs = isStatic
                ? [...selected, ...selected]
                : shuffle([...selected, ...selected])
            setTiles(
                pairs.map((item, index) => ({
                    id: index,
                    markId: item.id,
                    mark: item.mark,
                }))
            )
            setFlipped([])
            setMatched([])
            setLocked(false)
            setMoves(0)
            setScore(0)
            setWon(false)
        },
        [difficulty, isStatic]
    )

    useEffect(() => {
        if (isStatic) {
            createBoard(difficulty)
            return
        }
        createBoard(difficulty)
    }, [difficulty, createBoard, isStatic])

    const changeDifficulty = (level: string) => {
        setDifficulty(level)
        createBoard(level)
    }

    const handleClick = (tile: Tile) => {
        if (isStatic || !isVisibleRef.current || locked) return
        if (flipped.includes(tile.id) || matched.includes(tile.id)) return
        if (flipped.length === 2) return

        const newFlipped = [...flipped, tile.id]
        setFlipped(newFlipped)

        if (newFlipped.length === 2) {
            setLocked(true)
            setMoves((m) => m + 1)
            const first = tiles.find((t) => t.id === newFlipped[0])
            const second = tiles.find((t) => t.id === newFlipped[1])
            if (!first || !second) {
                setLocked(false)
                return
            }
            const gen = generationRef.current
            if (first.markId === second.markId) {
                clearTimeout(flipTimerRef.current)
                flipTimerRef.current = setTimeout(() => {
                    if (gen !== generationRef.current) return
                    setMatched((prev) => [...prev, first.id, second.id])
                    setFlipped([])
                    setLocked(false)
                    const points =
                        difficulty === "hard"
                            ? 150
                            : difficulty === "easy"
                              ? 80
                              : 100
                    setScore((s) => s + points)
                    if (matched.length + 2 === tiles.length) {
                        clearTimeout(winTimerRef.current)
                        winTimerRef.current = setTimeout(() => {
                            if (gen !== generationRef.current) return
                            setWon(true)
                        }, 400)
                    }
                }, 420)
            } else {
                const delay = difficulty === "hard" ? 700 : 900
                clearTimeout(flipTimerRef.current)
                flipTimerRef.current = setTimeout(() => {
                    if (gen !== generationRef.current) return
                    setFlipped([])
                    setLocked(false)
                }, delay)
            }
        }
    }

    const columns = DIFFICULTY[difficulty].columns

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
            aria-label={`${activeTheme.title} memory game`}
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
                content={`${activeTheme.title} Memory Game`}
            />
            <meta itemProp="genre" content="Puzzle" />
            <meta itemProp="gamePlatform" content="Web Browser" />
            <meta itemProp="playMode" content="SinglePlayer" />
            <meta itemProp="inLanguage" content="en" />
            <meta
                itemProp="description"
                content="Flip cards, match pairs, and chase a high score in the browser."
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
                    { label: "Score", value: `${score}` },
                    { label: "Moves", value: `${moves}` },
                    { label: "Level", value: DIFFICULTY[difficulty].label },
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
                {["easy", "medium", "hard"].map((level) => (
                    <button
                        key={level}
                        type="button"
                        aria-pressed={difficulty === level}
                        onClick={() => changeDifficulty(level)}
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
                        {DIFFICULTY[level].label}
                    </button>
                ))}
            </div>
            <motion.button
                type="button"
                onClick={() => createBoard(difficulty)}
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
                style={{
                    ...styles.board,
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    maxWidth: difficulty === "hard" ? 380 : 340,
                }}
            >
                {tiles.map((tile) => {
                    const isFlipped =
                        flipped.includes(tile.id) || matched.includes(tile.id)
                    const isMatched = matched.includes(tile.id)
                    return (
                        <button
                            key={tile.id}
                            type="button"
                            aria-label={
                                isFlipped ? `Mark ${tile.mark}` : "Hidden card"
                            }
                            aria-pressed={isFlipped}
                            onClick={() => handleClick(tile)}
                            style={styles.card}
                        >
                            <motion.div
                                style={{
                                    ...styles.cardShell,
                                    opacity: isMatched ? 0 : 1,
                                    transform: isMatched
                                        ? "scale(0.6)"
                                        : "scale(1)",
                                    transition: isStatic
                                        ? "none"
                                        : "opacity 0.35s ease, transform 0.35s ease",
                                    pointerEvents: isMatched ? "none" : "auto",
                                }}
                            >
                                <motion.div
                                    style={styles.cardInner}
                                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                                    transition={
                                        isStatic
                                            ? { duration: 0 }
                                            : {
                                                  duration: 0.45,
                                                  ease: [0.4, 0, 0.2, 1],
                                              }
                                    }
                                >
                                    <div
                                        style={{
                                            ...styles.front,
                                            background: mode.face,
                                            border: `1px solid ${mode.surfaceBorder}`,
                                        }}
                                    >
                                        <span
                                            style={{
                                                ...styles.question,
                                                color: mode.faceInk,
                                            }}
                                        >
                                            ?
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            ...styles.back,
                                            background: mode.back,
                                            border: `1px solid ${mode.surfaceBorder}`,
                                        }}
                                    >
                                        <span
                                            style={{
                                                ...styles.mark,
                                                color: mode.ink,
                                            }}
                                        >
                                            {tile.mark}
                                        </span>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </button>
                    )
                })}
            </div>
            <p style={{ ...styles.hint, color: mode.inkFaint }}>
                {DIFFICULTY[difficulty].pairs} pairs · tap two cards
            </p>
            <AnimatePresence>
                {won && (
                    <motion.div
                        role="dialog"
                        aria-labelledby={`${uid}-win`}
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
                                id={`${uid}-win`}
                                style={{
                                    ...styles.modalTitle,
                                    color: mode.ink,
                                }}
                            >
                                You won
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
                                {score} points · {moves} moves
                            </p>
                            <p style={{ ...styles.modalLine, color: mode.ink }}>
                                {DIFFICULTY[difficulty].label}
                            </p>
                            <button
                                type="button"
                                style={{
                                    ...styles.claimBtn,
                                    background: resolvedAccent,
                                }}
                                onClick={() => createBoard(difficulty)}
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
                onClick={() => createBoard(difficulty)}
            >
                Reset Board
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
                            <MemoryIcon />
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
    headerBlock: { textAlign: "center", marginBottom: 14, width: "100%" },
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
        gap: 8,
        width: "100%",
        maxWidth: 380,
        marginBottom: 14,
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
    diffRow: { display: "flex", gap: 8, marginBottom: 14 },
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
        marginBottom: 16,
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
    board: { display: "grid", gap: 10, width: "100%" },
    card: {
        aspectRatio: "1",
        perspective: 900,
        cursor: "pointer",
        padding: 0,
        border: "none",
        background: "transparent",
    },
    cardShell: { width: "100%", height: "100%" },
    cardInner: {
        width: "100%",
        height: "100%",
        position: "relative",
        transformStyle: "preserve-3d",
    },
    front: {
        position: "absolute",
        inset: 0,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backfaceVisibility: "hidden",
    },
    question: {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 22,
        fontWeight: 400,
    },
    back: {
        position: "absolute",
        inset: 0,
        borderRadius: 14,
        backfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    mark: { fontSize: 22, lineHeight: 1 },
    hint: {
        marginTop: 14,
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
        padding: 20,
        boxSizing: "border-box",
    },
    popupCardWrap: {
        width: "100%",
        maxWidth: 520,
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
    inlineDemoCardWrap: { width: "100%", maxWidth: 480, margin: "0 auto" },
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

addPropertyControls(MemoryGame2, {
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
