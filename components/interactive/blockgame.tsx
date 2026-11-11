import {
    useState,
    useEffect,
    useCallback,
    startTransition,
    useRef,
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


const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const EMPTY_CELL = 0

const TETROMINOES = {
    I: {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        color: "#06B6D4",
    },
    O: {
        shape: [
            [1, 1],
            [1, 1],
        ],
        color: "#EAB308",
    },
    T: {
        shape: [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: "#A855F7",
    },
    S: {
        shape: [
            [0, 1, 1],
            [1, 1, 0],
            [0, 0, 0],
        ],
        color: "#22C55E",
    },
    Z: {
        shape: [
            [1, 1, 0],
            [0, 1, 1],
            [0, 0, 0],
        ],
        color: "#EF4444",
    },
    J: {
        shape: [
            [1, 0, 0],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: "#3B82F6",
    },
    L: {
        shape: [
            [0, 0, 1],
            [1, 1, 1],
            [0, 0, 0],
        ],
        color: "#F97316",
    },
}

const TETROMINO_KEYS = Object.keys(TETROMINOES)

type TetrominoType = keyof typeof TETROMINOES
type Board = number[][]
type Position = { x: number; y: number }

interface Piece {
    shape: number[][]
    color: string
    position: Position
    type: TetrominoType
}

interface BlockGameProps {
    backgroundColor: string
    boardBackgroundColor: string
    cellBorderColor: string
    placedBlockColor: string
    textColor: string
    cardBackgroundColor: string
    buttonColor: string
    buttonTextColor: string
    titleFont: any
    bodyFont: any
    borderRadius: number
    style?: CSSProperties
}

/**
 *
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function BlockGame(props: BlockGameProps) {
    const {
        backgroundColor,
        boardBackgroundColor,
        cellBorderColor,
        placedBlockColor,
        textColor,
        cardBackgroundColor,
        buttonColor,
        buttonTextColor,
        titleFont,
        bodyFont,
        borderRadius,
    } = props

    const [board, setBoard] = useState<Board>(() =>
        Array(BOARD_HEIGHT)
            .fill(null)
            .map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL))
    )
    const [currentPiece, setCurrentPiece] = useState<Piece | null>(null)
    const [score, setScore] = useState(0)
    const [level, setLevel] = useState(1)
    const [lines, setLines] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)

    const isStatic = useIsStaticRenderer()
    const wrapperRef = useRef<HTMLDivElement>(null)

    const createNewPiece = useCallback((): Piece => {
        const randomType = TETROMINO_KEYS[
            Math.floor(Math.random() * TETROMINO_KEYS.length)
        ] as TetrominoType
        const tetromino = TETROMINOES[randomType]
        return {
            shape: tetromino.shape,
            color: tetromino.color,
            position: {
                x:
                    Math.floor(BOARD_WIDTH / 2) -
                    Math.floor(tetromino.shape[0].length / 2),
                y: 0,
            },
            type: randomType,
        }
    }, [])

    const canPlacePiece = useCallback(
        (piece: Piece, newPosition: Position): boolean => {
            for (let y = 0; y < piece.shape.length; y++) {
                for (let x = 0; x < piece.shape[y].length; x++) {
                    if (piece.shape[y][x]) {
                        const newX = newPosition.x + x
                        const newY = newPosition.y + y

                        if (
                            newX < 0 ||
                            newX >= BOARD_WIDTH ||
                            newY >= BOARD_HEIGHT
                        ) {
                            return false
                        }

                        if (newY >= 0 && board[newY][newX] !== EMPTY_CELL) {
                            return false
                        }
                    }
                }
            }
            return true
        },
        [board]
    )

    const rotatePiece = useCallback((piece: Piece): Piece => {
        const rotated = piece.shape[0].map((_, index) =>
            piece.shape.map((row) => row[index]).reverse()
        )
        return { ...piece, shape: rotated }
    }, [])

    const placePieceOnBoard = useCallback(
        (piece: Piece): Board => {
            const newBoard = board.map((row) => [...row])

            for (let y = 0; y < piece.shape.length; y++) {
                for (let x = 0; x < piece.shape[y].length; x++) {
                    if (piece.shape[y][x]) {
                        const boardY = piece.position.y + y
                        const boardX = piece.position.x + x
                        if (boardY >= 0) {
                            newBoard[boardY][boardX] = 1
                        }
                    }
                }
            }

            return newBoard
        },
        [board]
    )

    const clearLines = useCallback(
        (board: Board): { newBoard: Board; linesCleared: number } => {
            const newBoard = board.filter((row) =>
                row.some((cell) => cell === EMPTY_CELL)
            )
            const linesCleared = BOARD_HEIGHT - newBoard.length

            while (newBoard.length < BOARD_HEIGHT) {
                newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL))
            }

            return { newBoard, linesCleared }
        },
        []
    )

    const movePieceDown = useCallback(() => {
        if (!currentPiece || gameOver || isPaused) return

        const newPosition = {
            ...currentPiece.position,
            y: currentPiece.position.y + 1,
        }

        if (canPlacePiece(currentPiece, newPosition)) {
            startTransition(() =>
                setCurrentPiece({ ...currentPiece, position: newPosition })
            )
        } else {
            const newBoard = placePieceOnBoard(currentPiece)
            const { newBoard: clearedBoard, linesCleared } =
                clearLines(newBoard)

            startTransition(() => {
                setBoard(clearedBoard)
                setLines((prev) => prev + linesCleared)
                setScore((prev) => prev + linesCleared * 100 * level)

                const nextPiece = createNewPiece()
                if (canPlacePiece(nextPiece, nextPiece.position)) {
                    setCurrentPiece(nextPiece)
                } else {
                    setGameOver(true)
                }
            })
        }
    }, [
        currentPiece,
        gameOver,
        isPaused,
        canPlacePiece,
        placePieceOnBoard,
        clearLines,
        level,
        createNewPiece,
    ])

    const handleKeyPress = useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (!currentPiece || gameOver || isPaused || !gameStarted) return

            switch (event.key) {
                case "ArrowLeft":
                    event.preventDefault()
                    const leftPosition = {
                        ...currentPiece.position,
                        x: currentPiece.position.x - 1,
                    }
                    if (canPlacePiece(currentPiece, leftPosition)) {
                        startTransition(() =>
                            setCurrentPiece({
                                ...currentPiece,
                                position: leftPosition,
                            })
                        )
                    }
                    break

                case "ArrowRight":
                    event.preventDefault()
                    const rightPosition = {
                        ...currentPiece.position,
                        x: currentPiece.position.x + 1,
                    }
                    if (canPlacePiece(currentPiece, rightPosition)) {
                        startTransition(() =>
                            setCurrentPiece({
                                ...currentPiece,
                                position: rightPosition,
                            })
                        )
                    }
                    break

                case "ArrowDown":
                    event.preventDefault()
                    movePieceDown()
                    break

                case "ArrowUp":
                case " ":
                    event.preventDefault()
                    const rotated = rotatePiece(currentPiece)
                    if (canPlacePiece(rotated, rotated.position)) {
                        startTransition(() => setCurrentPiece(rotated))
                    }
                    break
            }
        },
        [
            currentPiece,
            gameOver,
            isPaused,
            canPlacePiece,
            movePieceDown,
            rotatePiece,
            gameStarted,
        ]
    )

    useEffect(() => {
        if (!gameStarted || gameOver || isPaused || isStatic) return

        const interval = setInterval(
            () => {
                movePieceDown()
            },
            Math.max(100, 1000 - (level - 1) * 100)
        )

        return () => clearInterval(interval)
    }, [gameStarted, gameOver, isPaused, level, movePieceDown, isStatic])

    useEffect(() => {
        startTransition(() => setLevel(Math.floor(lines / 10) + 1))
    }, [lines])

    const startGame = () => {
        startTransition(() => {
            setBoard(
                Array(BOARD_HEIGHT)
                    .fill(null)
                    .map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL))
            )
            setCurrentPiece(createNewPiece())
            setScore(0)
            setLevel(1)
            setLines(0)
            setGameOver(false)
            setIsPaused(false)
            setGameStarted(true)
        })
    }

    const renderBoard = () => {
        const displayBoard = board.map((row) => [...row])

        if (currentPiece) {
            for (let y = 0; y < currentPiece.shape.length; y++) {
                for (let x = 0; x < currentPiece.shape[y].length; x++) {
                    if (currentPiece.shape[y][x]) {
                        const boardY = currentPiece.position.y + y
                        const boardX = currentPiece.position.x + x
                        if (
                            boardY >= 0 &&
                            boardY < BOARD_HEIGHT &&
                            boardX >= 0 &&
                            boardX < BOARD_WIDTH
                        ) {
                            displayBoard[boardY][boardX] = 2
                        }
                    }
                }
            }
        }

        return displayBoard.map((row, y) => (
            <div key={y} style={{ display: "flex" }}>
                {row.map((cell, x) => (
                    <div
                        key={x}
                        style={{
                            width: 24,
                            height: 24,
                            border: `1px solid ${cellBorderColor}`,
                            backgroundColor:
                                cell === 1
                                    ? placedBlockColor
                                    : cell === 2
                                      ? currentPiece?.color || "#6B7280"
                                      : "#F3F4F6",
                        }}
                    />
                ))}
            </div>
        ))
    }

    const cardStyle: CSSProperties = {
        backgroundColor: cardBackgroundColor,
        borderRadius,
        padding: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }

    const buttonStyle: CSSProperties = {
        backgroundColor: buttonColor,
        color: buttonTextColor,
        border: "none",
        borderRadius,
        padding: "10px 20px",
        cursor: "pointer",
        width: "100%",
        ...bodyFont,
    }

    const outlineButtonStyle: CSSProperties = {
        ...buttonStyle,
        backgroundColor: "transparent",
        border: `1px solid ${buttonColor}`,
        color: buttonColor,
    }

    return (
        <div
            ref={wrapperRef}
            tabIndex={0}
            onKeyDown={isStatic ? undefined : handleKeyPress}
            aria-label="Block Game - Tetris game board"
            aria-describedby="game-instructions"
            role="application"
            style={{
                ...props.style,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: 20,
                backgroundColor,
                overflow: "auto",
                borderRadius,
                outline: "none",
            }}
        >
            <h1
                style={{
                    ...titleFont,
                    color: textColor,
                    marginBottom: 24,
                }}
            >
                Block Game
            </h1>

            <div
                id="game-instructions"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0, 0, 0, 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                Use arrow keys to move and rotate blocks. Left and right arrows
                move the piece, down arrow drops faster, up arrow or space bar
                rotates. Start the game with the Start Game button, then focus
                the game board to play.
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 24,
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}
            >
                <div style={{ ...cardStyle, padding: 16 }}>
                    <div
                        style={{
                            border: `2px solid ${cellBorderColor}`,
                            backgroundColor: boardBackgroundColor,
                            borderRadius,
                        }}
                    >
                        {renderBoard()}
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    <div style={cardStyle}>
                        <h3
                            style={{
                                ...titleFont,
                                fontSize: 18,
                                color: textColor,
                                margin: 0,
                                marginBottom: 8,
                            }}
                        >
                            Score
                        </h3>
                        <p
                            style={{
                                ...bodyFont,
                                fontSize: 24,
                                fontWeight: "bold",
                                color: textColor,
                                margin: 0,
                            }}
                        >
                            {score}
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <h3
                            style={{
                                ...titleFont,
                                fontSize: 18,
                                color: textColor,
                                margin: 0,
                                marginBottom: 8,
                            }}
                        >
                            Level
                        </h3>
                        <p
                            style={{
                                ...bodyFont,
                                fontSize: 24,
                                fontWeight: "bold",
                                color: textColor,
                                margin: 0,
                            }}
                        >
                            {level}
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <h3
                            style={{
                                ...titleFont,
                                fontSize: 18,
                                color: textColor,
                                margin: 0,
                                marginBottom: 8,
                            }}
                        >
                            Lines
                        </h3>
                        <p
                            style={{
                                ...bodyFont,
                                fontSize: 24,
                                fontWeight: "bold",
                                color: textColor,
                                margin: 0,
                            }}
                        >
                            {lines}
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <h3
                            style={{
                                ...titleFont,
                                fontSize: 18,
                                color: textColor,
                                margin: 0,
                                marginBottom: 8,
                            }}
                        >
                            Controls
                        </h3>
                        <div
                            style={{
                                ...bodyFont,
                                fontSize: 14,
                                color: textColor,
                            }}
                        >
                            <p style={{ margin: "4px 0" }}>← → Move</p>
                            <p style={{ margin: "4px 0" }}>↓ Soft drop</p>
                            <p style={{ margin: "4px 0" }}>↑ / Space Rotate</p>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        {!gameStarted || gameOver ? (
                            <button onClick={startGame} style={buttonStyle}>
                                {gameOver ? "Play Again" : "Start Game"}
                            </button>
                        ) : (
                            <button
                                onClick={() =>
                                    startTransition(() =>
                                        setIsPaused(!isPaused)
                                    )
                                }
                                style={outlineButtonStyle}
                            >
                                {isPaused ? "Resume" : "Pause"}
                            </button>
                        )}
                    </div>

                    {gameOver && (
                        <div
                            style={{
                                ...cardStyle,
                                border: "2px solid #EF4444",
                            }}
                        >
                            <p
                                style={{
                                    ...bodyFont,
                                    textAlign: "center",
                                    color: "#EF4444",
                                    fontWeight: "bold",
                                    margin: "0 0 8px 0",
                                }}
                            >
                                Game Over!
                            </p>
                            <p
                                style={{
                                    ...bodyFont,
                                    textAlign: "center",
                                    fontSize: 14,
                                    color: textColor,
                                    margin: 0,
                                }}
                            >
                                Final Score: {score}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(BlockGame, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(247, 249, 250, 0.6)",
    },
    boardBackgroundColor: {
        type: ControlType.Color,
        title: "Board Background",
        defaultValue: "#FFFFFF",
    },
    cellBorderColor: {
        type: ControlType.Color,
        title: "Cell Border",
        defaultValue: "#D1D5DB",
    },
    placedBlockColor: {
        type: ControlType.Color,
        title: "Placed Block",
        defaultValue: "#374151",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111827",
    },
    cardBackgroundColor: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#FFFFFF",
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
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: "32px",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        description:
            "More components at [Hamim Reza @hreza](https://hreza.lemonsqueezy.com)",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: "15px",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})
