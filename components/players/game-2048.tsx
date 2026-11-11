import {
    useState,
    useEffect,
    useCallback,
    useRef,
    useId,
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
}

const THEMES: { [key: string]: ThemeConfig } = {
    classic: {
        name: "Classic",
        title: "2048",
        subtitle: "Slide tiles. Reach 2048.",
        buttonText: "New Game",
        triggerText: "Play 2048",
        glow: "rgba(255,255,255,0.16)",
        background: "linear-gradient(160deg, #07080b 0%, #101319 100%)",
        lightBackground: "linear-gradient(160deg, #f4f6fa 0%, #dfe6f0 100%)",
    },
    neon: {
        name: "Neon",
        title: "Merge Lab",
        subtitle: "Keep the board alive",
        buttonText: "Reset Board",
        triggerText: "Open 2048",
        glow: "rgba(129,140,248,0.22)",
        background: "linear-gradient(160deg, #06050c 0%, #100a1c 100%)",
        lightBackground: "linear-gradient(160deg, #eef2ff 0%, #e0e7ff 100%)",
    },
    gold: {
        name: "Gold",
        title: "High Score",
        subtitle: "Beat your best run",
        buttonText: "New Run",
        triggerText: "Play a Round",
        glow: "rgba(251,191,36,0.20)",
        background: "linear-gradient(160deg, #0c0904 0%, #1a1206 100%)",
        lightBackground: "linear-gradient(160deg, #fff7ed 0%, #fde8cf 100%)",
    },
    night: {
        name: "Night",
        title: "Quiet Board",
        subtitle: "Arrows or swipe to move",
        buttonText: "New Game",
        triggerText: "Start 2048",
        glow: "rgba(45,212,191,0.20)",
        background: "linear-gradient(160deg, #04080a 0%, #081619 100%)",
        lightBackground: "linear-gradient(160deg, #ecfeff 0%, #cffafe 100%)",
    },
}

const SIZE = 4

const TILE_DARK: { [key: number]: string } = {
    2: "rgba(255,255,255,0.08)",
    4: "rgba(255,255,255,0.12)",
    8: "rgba(255,255,255,0.18)",
    16: "rgba(255,255,255,0.24)",
    32: "rgba(255,255,255,0.32)",
    64: "rgba(255,255,255,0.40)",
    128: "rgba(255,255,255,0.52)",
    256: "rgba(255,255,255,0.64)",
    512: "rgba(255,255,255,0.74)",
    1024: "rgba(255,255,255,0.86)",
    2048: "#ffffff",
    4096: "#ffffff",
    8192: "#ffffff",
}

const TILE_LIGHT: { [key: number]: string } = {
    2: "rgba(23,26,33,0.06)",
    4: "rgba(23,26,33,0.10)",
    8: "rgba(23,26,33,0.16)",
    16: "rgba(23,26,33,0.22)",
    32: "rgba(23,26,33,0.30)",
    64: "rgba(23,26,33,0.38)",
    128: "rgba(23,26,33,0.50)",
    256: "rgba(23,26,33,0.62)",
    512: "rgba(23,26,33,0.74)",
    1024: "#171a21",
    2048: "#171a21",
    4096: "#171a21",
    8192: "#171a21",
}

function GiftGridIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#fffceb" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#ffc93c" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#ffc93c" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#fffceb" />
        </svg>
    )
}

interface Game2048Props {
    accentColor?: string
    demoMode?: boolean
    theme?: string
    lightMode?: boolean
    asPopup?: boolean
    trigger?: "manual" | "delay" | "scroll"
    delaySeconds?: number
    widgetPosition?: "bottom-right" | "bottom-left"
    widgetIcon?: ImageItem | string
    storageKey?: string
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 640
 */
export default function Game2048(props: Game2048Props) {
    const {
        accentColor,
        demoMode = false,
        theme = "classic",
        lightMode = false,
        asPopup = false,
        trigger = "manual",
        delaySeconds = 4,
        widgetPosition = "bottom-right",
        widgetIcon,
        storageKey = "",
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const demoBarRef = useRef<HTMLDivElement>(null)
    const popupCardRef = useRef<HTMLDivElement>(null)
    const widgetTriggerRef = useRef<HTMLButtonElement>(null)
    const gameRootRef = useRef<HTMLDivElement>(null)
    const boardRef = useRef<HTMLDivElement>(null)
    const delayTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined
    )
    const touchStart = useRef({ x: 0, y: 0 })

    const [board, setBoard] = useState<number[]>([])
    const [score, setScore] = useState(0)
    const [best, setBest] = useState(0)
    const [status, setStatus] = useState<"playing" | "won" | "lost">("playing")
    const [won, setWon] = useState(false)
    const [popupOpen, setPopupOpen] = useState(!asPopup)
    const [scrollTriggered, setScrollTriggered] = useState(false)
    const [demoTheme, setDemoTheme] = useState(theme)
    const [demoAsPopup, setDemoAsPopup] = useState(asPopup)
    const [demoLightMode, setDemoLightMode] = useState(lightMode)
    const [demoBarHeight, setDemoBarHeight] = useState(72)

    const activeThemeKey = demoMode ? demoTheme : theme
    const activeTheme = THEMES[activeThemeKey] || THEMES.classic
    const isPopupMode = demoMode ? demoAsPopup : asPopup
    const isLight = demoMode ? demoLightMode : lightMode
    const resolvedAccent = accentColor || "#ffffff"
    const widgetOnRight = widgetPosition !== "bottom-left"
    const widgetGlowStrong = activeTheme.glow.replace(
        /,\s*[\d.]+\)$/,
        ", 0.85)"
    )
    const demoOffset = demoMode ? demoBarHeight : 0
    const suffix = storageKey.trim() ? `-${storageKey.trim()}` : ""
    const bestKey = `2048-best${suffix}`

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
              overlayBg: "rgba(255,255,255,0.86)",
              modalBg: "rgba(255,255,255,0.75)",
              modalBorder: "rgba(23,26,33,0.12)",
              chromeBg: "#ffffff",
              chromeBorder: "rgba(23,26,33,0.1)",
              stageBg: "#eef1f5",
              boardBg: "rgba(23,26,33,0.06)",
              cellBg: "rgba(23,26,33,0.06)",
              tileInkHigh: "#ffffff",
              tileInkLow: "#171a21",
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
              overlayBg: "rgba(4,4,6,0.86)",
              modalBg: "rgba(255,255,255,0.06)",
              modalBorder: "rgba(255,255,255,0.16)",
              chromeBg: "rgba(10,10,15,0.92)",
              chromeBorder: "rgba(255,255,255,0.16)",
              stageBg: "#050506",
              boardBg: "rgba(255,255,255,0.04)",
              cellBg: "rgba(255,255,255,0.05)",
              tileInkHigh: "#0a0a0f",
              tileInkLow: "#ffffff",
          }

    const tilePalette = isLight ? TILE_LIGHT : TILE_DARK

    useEffect(() => {
        return () => clearTimeout(delayTimerRef.current)
    }, [])

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
        if (!isPopupMode || popupOpen) gameRootRef.current?.focus()
        else if (wasPopupOpenRef.current) widgetTriggerRef.current?.focus()
        wasPopupOpenRef.current = popupOpen
    }, [isPopupMode, popupOpen, isStatic])

    const addRandomTile = (b: number[]) => {
        const empty: number[] = []
        b.forEach((v, i) => {
            if (v === 0) empty.push(i)
        })
        if (empty.length === 0) return b
        const idx = empty[Math.floor(Math.random() * empty.length)]
        b[idx] = Math.random() < 0.9 ? 2 : 4
        return b
    }

    const init = useCallback(() => {
        const empty = Array(SIZE * SIZE).fill(0)
        addRandomTile(empty)
        addRandomTile(empty)
        setBoard(empty)
        setScore(0)
        setStatus("playing")
        setWon(false)
    }, [])

    useEffect(() => {
        if (isStatic) {
            setBoard([2, 0, 0, 4, 0, 8, 0, 0, 0, 0, 16, 0, 0, 2, 0, 0])
            return
        }
        try {
            const savedBest = localStorage.getItem(bestKey)
            if (savedBest) setBest(parseInt(savedBest, 10))
        } catch {
            /* ignore */
        }
        init()
    }, [init, bestKey, isStatic])

    const slide = (row: number[]) => {
        let arr = row.filter((v) => v !== 0)
        let scoreAdd = 0
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2
                scoreAdd += arr[i]
                arr[i + 1] = 0
            }
        }
        arr = arr.filter((v) => v !== 0)
        while (arr.length < SIZE) arr.push(0)
        return { row: arr, scoreAdd }
    }

    const isGameOver = (b: number[]) => {
        if (b.includes(0)) return false
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const v = b[r * SIZE + c]
                if (c < SIZE - 1 && v === b[r * SIZE + c + 1]) return false
                if (r < SIZE - 1 && v === b[(r + 1) * SIZE + c]) return false
            }
        }
        return true
    }

    const move = (direction: "up" | "down" | "left" | "right") => {
        if (status === "lost" || isStatic) return

        const newBoard = [...board]
        let moved = false
        let scoreAdd = 0
        const get = (r: number, c: number) => newBoard[r * SIZE + c]
        const set = (r: number, c: number, v: number) => {
            newBoard[r * SIZE + c] = v
        }

        if (direction === "left" || direction === "right") {
            for (let r = 0; r < SIZE; r++) {
                let row: number[] = []
                for (let c = 0; c < SIZE; c++) row.push(get(r, c))
                if (direction === "right") row.reverse()
                const result = slide(row)
                if (direction === "right") result.row.reverse()
                for (let c = 0; c < SIZE; c++) {
                    if (get(r, c) !== result.row[c]) moved = true
                    set(r, c, result.row[c])
                }
                scoreAdd += result.scoreAdd
            }
        } else {
            for (let c = 0; c < SIZE; c++) {
                let col: number[] = []
                for (let r = 0; r < SIZE; r++) col.push(get(r, c))
                if (direction === "down") col.reverse()
                const result = slide(col)
                if (direction === "down") result.row.reverse()
                for (let r = 0; r < SIZE; r++) {
                    if (get(r, c) !== result.row[r]) moved = true
                    set(r, c, result.row[r])
                }
                scoreAdd += result.scoreAdd
            }
        }

        if (!moved) return
        addRandomTile(newBoard)
        setBoard(newBoard)
        const newScore = score + scoreAdd
        setScore(newScore)
        if (newScore > best) {
            setBest(newScore)
            try {
                localStorage.setItem(bestKey, newScore.toString())
            } catch {
                /* ignore */
            }
        }
        if (!won && newBoard.includes(2048)) {
            setWon(true)
            setStatus("won")
        }
        if (isGameOver(newBoard)) setStatus("lost")
    }

    const onCardKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape" && isPopupMode) {
            setPopupOpen(false)
            return
        }
        const map: { [key: string]: "up" | "down" | "left" | "right" } = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
            w: "up",
            W: "up",
            s: "down",
            S: "down",
            a: "left",
            A: "left",
            d: "right",
            D: "right",
        }
        const dir = map[e.key]
        if (!dir) return
        e.preventDefault()
        move(dir)
    }

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        touchStart.current = { x: e.clientX, y: e.clientY }
        e.currentTarget.setPointerCapture?.(e.pointerId)
    }

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        const deltaX = e.clientX - touchStart.current.x
        const deltaY = e.clientY - touchStart.current.y
        if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) return
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            move(deltaX > 0 ? "right" : "left")
        } else {
            move(deltaY > 0 ? "down" : "up")
        }
    }

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
            aria-label={`${activeTheme.title} number puzzle`}
            onKeyDown={onCardKeyDown}
            onPointerDown={() => gameRootRef.current?.focus()}
            itemScope
            itemType="https://schema.org/VideoGame"
        >
            <meta itemProp="name" content={activeTheme.title} />
            <meta itemProp="genre" content="Puzzle" />
            <meta
                itemProp="description"
                content="Play 2048 in the browser. Slide tiles, merge matching numbers, and reach 2048."
            />
            <meta itemProp="gamePlatform" content="Web Browser" />

            <header style={styles.headerBlock}>
                <h2
                    id={`${uid}-title`}
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
                    { label: "Score", value: score },
                    { label: "Best", value: best },
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

            <motion.button
                type="button"
                onClick={init}
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

            <div
                ref={boardRef}
                style={{
                    ...styles.board,
                    background: mode.boardBg,
                    border: `1px solid ${mode.surfaceBorder}`,
                }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
            >
                {Array.from({ length: SIZE * SIZE }).map((_, i) => (
                    <div
                        key={`bg-${i}`}
                        style={{
                            ...styles.cellBg,
                            background: mode.cellBg,
                        }}
                    />
                ))}
                <AnimatePresence>
                    {board.map((value, i) => {
                        if (value === 0) return null
                        const row = Math.floor(i / SIZE)
                        const col = i % SIZE
                        const high = value >= 128
                        return (
                            <motion.div
                                key={`${i}-${value}`}
                                style={{
                                    ...styles.tile,
                                    backgroundColor:
                                        tilePalette[value] || resolvedAccent,
                                    color: high
                                        ? mode.tileInkHigh
                                        : mode.tileInkLow,
                                    fontSize:
                                        value >= 1000
                                            ? 22
                                            : value >= 100
                                              ? 26
                                              : 30,
                                    gridRow: row + 1,
                                    gridColumn: col + 1,
                                    transition: isStatic ? "none" : undefined,
                                }}
                                initial={isStatic ? false : { scale: 0.7 }}
                                animate={{ scale: 1 }}
                                exit={isStatic ? undefined : { scale: 0 }}
                                transition={
                                    isStatic
                                        ? { duration: 0 }
                                        : {
                                              type: "spring",
                                              stiffness: 300,
                                              damping: 20,
                                          }
                                }
                                layout={!isStatic}
                            >
                                {value}
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {(status === "won" || status === "lost") && (
                    <motion.div
                        style={{
                            ...styles.overlay,
                            background: mode.overlayBg,
                        }}
                        initial={isStatic ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={isStatic ? undefined : { opacity: 0 }}
                    >
                        <motion.div
                            initial={isStatic ? false : { scale: 0.96, y: 12 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{
                                ...styles.modal,
                                background: mode.modalBg,
                                border: `1px solid ${mode.modalBorder}`,
                            }}
                        >
                            <h3
                                style={{
                                    ...styles.modalTitle,
                                    color: mode.ink,
                                }}
                            >
                                {status === "won" ? "You won" : "Game over"}
                            </h3>
                            <div
                                style={{
                                    ...styles.modalDivider,
                                    background: mode.divider,
                                }}
                            />
                            {status === "won" && (
                                <button
                                    type="button"
                                    style={{
                                        ...styles.claimBtn,
                                        background: resolvedAccent,
                                        marginBottom: 8,
                                    }}
                                    onClick={() => setStatus("playing")}
                                >
                                    Keep Going
                                </button>
                            )}
                            <button
                                type="button"
                                style={{
                                    ...styles.claimBtn,
                                    background: resolvedAccent,
                                }}
                                onClick={init}
                            >
                                Try Again
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p style={{ ...styles.hint, color: mode.inkFaint }}>
                Arrow keys or swipe the board
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
                                init()
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
            <button type="button" style={styles.demoResetBtn} onClick={init}>
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
                            <GiftGridIcon />
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
        justifyContent: "flex-start",
        borderRadius: 22,
        padding: "32px 26px",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        userSelect: "none",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        outline: "none",
        touchAction: "none",
    },
    headerBlock: { textAlign: "center", marginBottom: 18, width: "100%" },
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
        width: "100%",
        maxWidth: 340,
        marginBottom: 16,
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
    button: {
        padding: "14px 30px",
        borderRadius: 40,
        border: "none",
        color: "#0a0a0f",
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: "pointer",
        marginBottom: 18,
    },
    board: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(4, 1fr)",
        gap: 8,
        padding: 10,
        borderRadius: 14,
        width: "100%",
        maxWidth: 340,
        aspectRatio: "1 / 1",
        position: "relative",
        touchAction: "none",
    },
    cellBg: { borderRadius: 10 },
    tile: {
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        zIndex: 10,
        fontFamily: "Georgia, 'Times New Roman', serif",
    },
    overlay: {
        position: "absolute",
        inset: 0,
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        borderRadius: 22,
        padding: 16,
    },
    modal: {
        backdropFilter: "blur(20px)",
        borderRadius: 18,
        padding: "28px 24px",
        width: "100%",
        maxWidth: 260,
        textAlign: "center",
    },
    modalTitle: {
        margin: 0,
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 24,
        fontWeight: 400,
    },
    modalDivider: {
        width: 28,
        height: 1,
        margin: "12px auto 16px",
    },
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
        maxWidth: 420,
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
    inlineDemoCardWrap: { width: "100%", maxWidth: 420, margin: "0 auto" },
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

addPropertyControls(Game2048, {
    theme: {
        type: ControlType.Enum,
        title: "Concept",
        options: Object.keys(THEMES),
        optionTitles: Object.values(THEMES).map((t) => t.name),
        defaultValue: "classic",
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
    storageKey: {
        type: ControlType.String,
        title: "Storage Key",
        placeholder: "leave empty unless using 2+ instances",
        defaultValue: "",
    },
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
