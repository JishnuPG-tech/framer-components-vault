// Interactive Tic Tac Toe game - User (O) vs AI (X) with customizable properties
import { useState, useEffect, useCallback, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TicTacToeProps {
    gridColor: string
    playerOColor: string
    playerXColor: string
    hoverFillColor: string
    backgroundColor: string
    scoreFont: any
    resultFont: any
    resultBackgroundColor: string
    resultTextColor: string
    buttonColor: string
    buttonTextColor: string
    buttonFont: any
    aiPlayerName: string
    style?: CSSProperties
}

type Player = 'O' | 'X' | null
type GameState = 'playing' | 'finished'

/**
 * Tic Tac Toe Game
 * 
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 500
 * 
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TicTacToe(props: TicTacToeProps) {
    const {
        gridColor,
        playerOColor,
        playerXColor,
        hoverFillColor,
        backgroundColor,
        scoreFont,
        resultFont,
        resultBackgroundColor,
        resultTextColor,
        buttonColor,
        buttonTextColor,
        buttonFont,
        aiPlayerName
    } = props

    const [board, setBoard] = useState<Player[]>(Array(9).fill(null))
    const [gameState, setGameState] = useState<GameState>('playing')
    const [winner, setWinner] = useState<Player | 'tie' | null>(null)
    const [scores, setScores] = useState({ O: 0, X: 0 })
    const [hoveredCell, setHoveredCell] = useState<number | null>(null)

    const checkWinner = useCallback((board: Player[]): Player | 'tie' | null => {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6] // diagonals
        ]

        for (const pattern of winPatterns) {
            const [a, b, c] = pattern
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a]
            }
        }

        if (board.every(cell => cell !== null)) {
            return 'tie'
        }

        return null
    }, [])

    const makeAIMove = useCallback((currentBoard: Player[]) => {
        const availableMoves = currentBoard
            .map((cell, index) => cell === null ? index : null)
            .filter(index => index !== null) as number[]

        if (availableMoves.length === 0) return currentBoard

        // Simple AI strategy: try to win, then block, then random
        const testMove = (board: Player[], move: number, player: Player) => {
            const testBoard = [...board]
            testBoard[move] = player
            return checkWinner(testBoard) === player
        }

        // Try to win
        for (const move of availableMoves) {
            if (testMove(currentBoard, move, 'X')) {
                const newBoard = [...currentBoard]
                newBoard[move] = 'X'
                return newBoard
            }
        }

        // Try to block player
        for (const move of availableMoves) {
            if (testMove(currentBoard, move, 'O')) {
                const newBoard = [...currentBoard]
                newBoard[move] = 'X'
                return newBoard
            }
        }

        // Take center if available
        if (availableMoves.includes(4)) {
            const newBoard = [...currentBoard]
            newBoard[4] = 'X'
            return newBoard
        }

        // Take corners
        const corners = [0, 2, 6, 8].filter(corner => availableMoves.includes(corner))
        if (corners.length > 0) {
            const randomCorner = corners[Math.floor(Math.random() * corners.length)]
            const newBoard = [...currentBoard]
            newBoard[randomCorner] = 'X'
            return newBoard
        }

        // Random move
        const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)]
        const newBoard = [...currentBoard]
        newBoard[randomMove] = 'X'
        return newBoard
    }, [checkWinner])

    const handleCellClick = useCallback((index: number) => {
        if (board[index] || gameState === 'finished') return

        const newBoard = [...board]
        newBoard[index] = 'O'
        
        const gameResult = checkWinner(newBoard)
        if (gameResult) {
            startTransition(() => {
                setBoard(newBoard)
                setWinner(gameResult)
                setGameState('finished')
                if (gameResult === 'O') {
                    setScores(prev => ({ ...prev, O: prev.O + 1 }))
                }
            })
            return
        }

        // AI move with delay
        startTransition(() => {
            setBoard(newBoard)
            
            // Add 0.2 second delay before AI makes a move
            setTimeout(() => {
                const aiBoard = makeAIMove(newBoard)
                const aiResult = checkWinner(aiBoard)
                
                startTransition(() => {
                    setBoard(aiBoard)
                    if (aiResult) {
                        setWinner(aiResult)
                        setGameState('finished')
                        if (aiResult === 'X') {
                            setScores(prev => ({ ...prev, X: prev.X + 1 }))
                        }
                    }
                })
            }, 200)
        })
    }, [board, gameState, checkWinner, makeAIMove])

    const resetGame = useCallback(() => {
        startTransition(() => {
            setBoard(Array(9).fill(null))
            setGameState('playing')
            setWinner(null)
            setHoveredCell(null)
        })
    }, [])

    const getResultMessage = () => {
        if (winner === 'O') return 'You Win!'
        if (winner === 'X') return `${aiPlayerName} Wins!`
        if (winner === 'tie') return "It's a Tie!"
        return ''
    }

    const renderCell = (index: number) => {
        const cellValue = board[index]
        const isHovered = hoveredCell === index && !cellValue && gameState === 'playing'

        return (
            <div
                key={index}
                style={{
                    width: '100px',
                    height: '100px',
                    border: `2px solid ${gridColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: gameState === 'playing' && !cellValue ? 'pointer' : 'default',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    backgroundColor: isHovered ? hoverFillColor : 'transparent',
                    transition: 'background-color 0.2s ease',
                    color: cellValue === 'O' ? playerOColor : playerXColor,
                }}
                onClick={() => handleCellClick(index)}
                onMouseEnter={() => setHoveredCell(index)}
                onMouseLeave={() => setHoveredCell(null)}
            >
                {cellValue}
            </div>
        )
    }

    if (gameState === 'finished') {
        return (
            <div
                style={{
                    ...props.style,
                    width: '100%',
                    height: '100%',
                    backgroundColor: resultBackgroundColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px',
                    padding: '20px',
                }}
            >
                <div
                    style={{
                        fontSize: '72px',
                        color: winner === 'O' ? playerOColor : winner === 'X' ? playerXColor : resultTextColor,
                        marginBottom: '20px',
                    }}
                >
                    {winner === 'tie' ? '🤝' : winner}
                </div>
                
                <div
                    style={{
                        ...resultFont,
                        color: resultTextColor,
                        textAlign: 'center',
                        marginBottom: '20px',
                    }}
                >
                    {getResultMessage()}
                </div>

                <button
                    style={{
                        ...buttonFont,
                        backgroundColor: buttonColor,
                        color: buttonTextColor,
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        cursor: 'pointer',
                        fontSize: '16px',
                    }}
                    onClick={resetGame}
                >
                    Play Again
                </button>
            </div>
        )
    }

    return (
        <div
            style={{
                ...props.style,
                width: '100%',
                height: '100%',
                backgroundColor: backgroundColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                padding: '20px',
            }}
        >
            {/* Game Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 100px)',
                    gridTemplateRows: 'repeat(3, 100px)',
                    gap: '0px',
                }}
            >
                {Array.from({ length: 9 }, (_, index) => renderCell(index))}
            </div>

            {/* Score Board */}
            <div
                style={{
                    ...scoreFont,
                    display: 'flex',
                    gap: '40px',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: playerOColor, fontSize: '24px', fontWeight: 'bold' }}>O</span>
                    <span>-</span>
                    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{scores.O}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: playerXColor, fontSize: '24px', fontWeight: 'bold' }}>X</span>
                    <span>-</span>
                    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{scores.X}</span>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(TicTacToe, {
    gridColor: {
        type: ControlType.Color,
        title: "Grid Color",
        defaultValue: "#333333",
    },
    playerOColor: {
        type: ControlType.Color,
        title: "Player O Color",
        defaultValue: "#0099FF",
    },
    playerXColor: {
        type: ControlType.Color,
        title: "Player X Color",
        defaultValue: "#FF5588",
    },
    hoverFillColor: {
        type: ControlType.Color,
        title: "Hover Fill Color",
        defaultValue: "#F5F5F5",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF",
    },
    scoreFont: {
        type: ControlType.Font,
        title: "Score Font",
        defaultValue: {
            fontSize: "18px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    resultFont: {
        type: ControlType.Font,
        title: "Result Font",
        defaultValue: {
            fontSize: "32px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    resultBackgroundColor: {
        type: ControlType.Color,
        title: "Result Background",
        defaultValue: "#F5F5F5",
    },
    resultTextColor: {
        type: ControlType.Color,
        title: "Result Text Color",
        defaultValue: "#333333",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#0099FF",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text Color",
        defaultValue: "#FFFFFF",
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        defaultValue: {
            fontSize: "16px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    aiPlayerName: {
        type: ControlType.String,
        title: "AI Player Name",
        defaultValue: "AI",
    },
})