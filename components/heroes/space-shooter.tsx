// Retro space shooting game with pixelated graphics, endless gameplay, score tracking, and keyboard/touch controls
import {
    useState,
    useEffect,
    useRef,
    useCallback,
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


interface GameObject {
    x: number
    y: number
    width: number
    height: number
    speed: number
    active: boolean
}

interface Enemy extends GameObject {
    type: number
}

interface Bullet extends GameObject {}

interface EnemyBullet extends GameObject {}

interface Player extends GameObject {}

interface Explosion {
    x: number
    y: number
    frame: number
    active: boolean
}

interface SpaceShooterProps {
    backgroundColor: string
    playerColor: string
    bulletColor: string
    enemyColor: string
    enemyBulletColor: string
    explosionColor: string
    scoreColor: string
    starColor: string
    starSize: number
    font: any
    gameSpeed: number
    playerSize: number
    enemySize: number
    style?: CSSProperties
}

/**
 * Space Shooter Game
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SpaceShooter(props: SpaceShooterProps) {
    const {
        backgroundColor = "#000011",
        playerColor = "#00FF00",
        bulletColor = "#FFFF00",
        enemyColor = "#FF0000",
        enemyBulletColor = "#FF6600",
        explosionColor = "#FFA500",
        scoreColor = "#FFFFFF",
        starColor = "#FFFFFF",
        starSize = 2,
        font,
        gameSpeed = 1,
        playerSize = 32,
        enemySize = 32,
    } = props

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gameLoopRef = useRef<number>()
    const keysRef = useRef<Set<string>>(new Set())
    const touchRef = useRef<{ x: number; y: number } | null>(null)
    const touchStartRef = useRef<{ x: number; y: number } | null>(null)
    const isStatic = useIsStaticRenderer()

    const [score, setScore] = useState(0)
    const [gameState, setGameState] = useState({
        player: {
            x: 400,
            y: 500,
            width: playerSize,
            height: playerSize,
            speed: 5,
            active: true,
        } as Player,
        bullets: [] as Bullet[],
        enemyBullets: [] as EnemyBullet[],
        enemies: [] as Enemy[],
        explosions: [] as Explosion[],
        lastEnemySpawn: 0,
        lastBulletFire: 0,
        gameOver: false,
    })

    const CANVAS_WIDTH = 800
    const CANVAS_HEIGHT = 600
    const PIXEL_SIZE = 4

    // Pixelated drawing functions
    const drawPixelRect = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            width: number,
            height: number,
            color: string
        ) => {
            ctx.fillStyle = color
            const pixelWidth = Math.floor(width / PIXEL_SIZE) * PIXEL_SIZE
            const pixelHeight = Math.floor(height / PIXEL_SIZE) * PIXEL_SIZE
            ctx.fillRect(
                Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE,
                Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE,
                pixelWidth,
                pixelHeight
            )
        },
        []
    )

    const drawPlayer = useCallback(
        (ctx: CanvasRenderingContext2D, player: Player) => {
            const x = Math.floor(player.x / PIXEL_SIZE) * PIXEL_SIZE
            const y = Math.floor(player.y / PIXEL_SIZE) * PIXEL_SIZE
            const scale = player.width / 32 // Scale based on actual player size

            // Draw pixelated spaceship
            ctx.fillStyle = playerColor
            // Main body
            ctx.fillRect(x + 12 * scale, y, 8 * scale, 24 * scale)
            // Wings
            ctx.fillRect(x, y + 16 * scale, 32 * scale, 8 * scale)
            // Cockpit
            ctx.fillRect(x + 8 * scale, y + 4 * scale, 16 * scale, 8 * scale)
            // Engine
            ctx.fillRect(x + 4 * scale, y + 24 * scale, 8 * scale, 8 * scale)
            ctx.fillRect(x + 20 * scale, y + 24 * scale, 8 * scale, 8 * scale)
        },
        [playerColor]
    )

    const drawBullet = useCallback(
        (ctx: CanvasRenderingContext2D, bullet: Bullet) => {
            drawPixelRect(
                ctx,
                bullet.x,
                bullet.y,
                bullet.width,
                bullet.height,
                bulletColor
            )
        },
        [bulletColor, drawPixelRect]
    )

    const drawEnemyBullet = useCallback(
        (ctx: CanvasRenderingContext2D, bullet: EnemyBullet) => {
            drawPixelRect(
                ctx,
                bullet.x,
                bullet.y,
                bullet.width,
                bullet.height,
                enemyBulletColor
            )
        },
        [enemyBulletColor, drawPixelRect]
    )

    const drawEnemy = useCallback(
        (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
            const x = Math.floor(enemy.x / PIXEL_SIZE) * PIXEL_SIZE
            const y = Math.floor(enemy.y / PIXEL_SIZE) * PIXEL_SIZE
            const scale = enemy.width / 24 // Scale based on actual enemy size

            ctx.fillStyle = enemyColor
            // Smaller version of player spaceship design
            // Main body (scaled down from 8px to 4px width)
            ctx.fillRect(x + 10 * scale, y, 4 * scale, 12 * scale)
            // Wings (scaled down from 32px to 16px width, 8px to 4px height)
            ctx.fillRect(x + 4 * scale, y + 8 * scale, 16 * scale, 4 * scale)
            // Cockpit (scaled down from 16px to 8px width, 8px to 4px height)
            ctx.fillRect(x + 8 * scale, y + 2 * scale, 8 * scale, 4 * scale)
            // Engine (scaled down from 8px to 4px width and height)
            ctx.fillRect(x + 6 * scale, y + 12 * scale, 4 * scale, 4 * scale)
            ctx.fillRect(x + 14 * scale, y + 12 * scale, 4 * scale, 4 * scale)
        },
        [enemyColor]
    )

    const drawExplosion = useCallback(
        (ctx: CanvasRenderingContext2D, explosion: Explosion) => {
            const x = Math.floor(explosion.x / PIXEL_SIZE) * PIXEL_SIZE
            const y = Math.floor(explosion.y / PIXEL_SIZE) * PIXEL_SIZE
            const size = explosion.frame * 4

            ctx.fillStyle = explosionColor
            // Pixelated explosion pattern
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (Math.random() > 0.3) {
                        ctx.fillRect(
                            x + i * 8 - size / 2,
                            y + j * 8 - size / 2,
                            8,
                            8
                        )
                    }
                }
            }
        },
        [explosionColor]
    )

    const checkCollision = useCallback(
        (obj1: GameObject, obj2: GameObject): boolean => {
            return (
                obj1.x < obj2.x + obj2.width &&
                obj1.x + obj1.width > obj2.x &&
                obj1.y < obj2.y + obj2.height &&
                obj1.y + obj1.height > obj2.y
            )
        },
        []
    )

    const spawnEnemy = useCallback(() => {
        const enemy: Enemy = {
            x: Math.random() * (CANVAS_WIDTH - enemySize),
            y: -enemySize,
            width: enemySize,
            height: enemySize,
            speed: 2 + Math.random() * 3,
            active: true,
            type: Math.floor(Math.random() * 2),
        }
        return enemy
    }, [enemySize])

    const fireBullet = useCallback((player: Player) => {
        const bullet: Bullet = {
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 12,
            speed: 8,
            active: true,
        }
        return bullet
    }, [])

    const fireEnemyBullet = useCallback((enemy: Enemy) => {
        const bullet: EnemyBullet = {
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 8,
            speed: 4,
            active: true,
        }
        return bullet
    }, [])

    const resetGame = useCallback(() => {
        setScore(0)
        setGameState({
            player: {
                x: 400,
                y: 500,
                width: playerSize,
                height: playerSize,
                speed: 5,
                active: true,
            },
            bullets: [],
            enemyBullets: [],
            enemies: [],
            explosions: [],
            lastEnemySpawn: 0,
            lastBulletFire: 0,
            gameOver: false,
        })
    }, [playerSize])

    const updateGame = useCallback(() => {
        setGameState((prevState) => {
            if (prevState.gameOver) return prevState

            const newState = { ...prevState }
            const currentTime = Date.now()

            // Update player position based on input
            if (keysRef.current.has("ArrowLeft") && newState.player.x > 0) {
                newState.player.x -= newState.player.speed * gameSpeed
            }
            if (
                keysRef.current.has("ArrowRight") &&
                newState.player.x < CANVAS_WIDTH - newState.player.width
            ) {
                newState.player.x += newState.player.speed * gameSpeed
            }
            if (keysRef.current.has("ArrowUp") && newState.player.y > 0) {
                newState.player.y -= newState.player.speed * gameSpeed
            }
            if (
                keysRef.current.has("ArrowDown") &&
                newState.player.y < CANVAS_HEIGHT - newState.player.height
            ) {
                newState.player.y += newState.player.speed * gameSpeed
            }

            // Handle touch input
            if (touchRef.current) {
                const targetX = touchRef.current.x - newState.player.width / 2
                const targetY = touchRef.current.y - newState.player.height / 2

                const dx = targetX - newState.player.x
                const dy = targetY - newState.player.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance > 5) {
                    newState.player.x +=
                        (dx / distance) * newState.player.speed * gameSpeed
                    newState.player.y +=
                        (dy / distance) * newState.player.speed * gameSpeed
                }

                // Keep player in bounds
                newState.player.x = Math.max(
                    0,
                    Math.min(
                        CANVAS_WIDTH - newState.player.width,
                        newState.player.x
                    )
                )
                newState.player.y = Math.max(
                    0,
                    Math.min(
                        CANVAS_HEIGHT - newState.player.height,
                        newState.player.y
                    )
                )
            }

            // Auto-fire bullets
            if (currentTime - newState.lastBulletFire > 200) {
                newState.bullets.push(fireBullet(newState.player))
                newState.lastBulletFire = currentTime
            }

            // Update bullets
            newState.bullets = newState.bullets.filter((bullet) => {
                bullet.y -= bullet.speed * gameSpeed
                return bullet.y > -bullet.height && bullet.active
            })

            // Update enemy bullets
            newState.enemyBullets = newState.enemyBullets.filter((bullet) => {
                bullet.y += bullet.speed * gameSpeed
                return bullet.y < CANVAS_HEIGHT + bullet.height && bullet.active
            })

            // Spawn enemies
            if (currentTime - newState.lastEnemySpawn > 1000) {
                newState.enemies.push(spawnEnemy())
                newState.lastEnemySpawn = currentTime
            }

            // Update enemies and make them shoot
            newState.enemies = newState.enemies.filter((enemy) => {
                enemy.y += enemy.speed * gameSpeed

                // Enemy shooting logic
                if (Math.random() < 0.005 * gameSpeed) {
                    newState.enemyBullets.push(fireEnemyBullet(enemy))
                }

                return enemy.y < CANVAS_HEIGHT + enemy.height && enemy.active
            })

            // Check bullet-enemy collisions
            newState.bullets.forEach((bullet) => {
                newState.enemies.forEach((enemy) => {
                    if (
                        bullet.active &&
                        enemy.active &&
                        checkCollision(bullet, enemy)
                    ) {
                        bullet.active = false
                        enemy.active = false

                        // Add explosion
                        newState.explosions.push({
                            x: enemy.x + enemy.width / 2,
                            y: enemy.y + enemy.height / 2,
                            frame: 0,
                            active: true,
                        })

                        // Increase score
                        startTransition(() =>
                            setScore((prev) => prev + (enemy.type + 1) * 10)
                        )
                    }
                })
            })

            // Check enemy-player collisions
            newState.enemies.forEach((enemy) => {
                if (enemy.active && checkCollision(enemy, newState.player)) {
                    newState.gameOver = true
                    // Add explosion at player position
                    newState.explosions.push({
                        x: newState.player.x + newState.player.width / 2,
                        y: newState.player.y + newState.player.height / 2,
                        frame: 0,
                        active: true,
                    })
                }
            })

            // Check enemy bullet-player collisions
            newState.enemyBullets.forEach((bullet) => {
                if (bullet.active && checkCollision(bullet, newState.player)) {
                    newState.gameOver = true
                    // Add explosion at player position
                    newState.explosions.push({
                        x: newState.player.x + newState.player.width / 2,
                        y: newState.player.y + newState.player.height / 2,
                        frame: 0,
                        active: true,
                    })
                }
            })

            // Filter out inactive objects
            newState.bullets = newState.bullets.filter(
                (bullet) => bullet.active
            )
            newState.enemyBullets = newState.enemyBullets.filter(
                (bullet) => bullet.active
            )
            newState.enemies = newState.enemies.filter((enemy) => enemy.active)

            // Update explosions
            newState.explosions = newState.explosions.filter((explosion) => {
                explosion.frame++
                return explosion.frame < 10
            })

            return newState
        })
    }, [gameSpeed, fireBullet, fireEnemyBullet, spawnEnemy, checkCollision])

    // Update game state when playerSize changes
    useEffect(() => {
        setGameState((prevState) => ({
            ...prevState,
            player: {
                ...prevState.player,
                width: playerSize,
                height: playerSize,
            },
        }))
    }, [playerSize])

    const render = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        // Clear canvas
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

        // Draw stars background
        ctx.fillStyle = starColor
        for (let i = 0; i < 50; i++) {
            const x = (i * 137 + Math.sin(i * 2.3) * 100) % CANVAS_WIDTH
            const y =
                (i * 197 + Math.cos(i * 1.7) * 150 + Date.now() * 0.1) %
                CANVAS_HEIGHT

            // Draw star shape instead of dots
            const starX = Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE
            const starY = Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE
            const size = starSize * PIXEL_SIZE

            // Draw a simple pixelated star (cross pattern)
            ctx.fillRect(starX, starY - size, size, size * 3) // vertical line
            ctx.fillRect(starX - size, starY, size * 3, size) // horizontal line
        }

        // Draw game objects
        if (!gameState.gameOver) {
            drawPlayer(ctx, gameState.player)
        }
        gameState.bullets.forEach((bullet) => drawBullet(ctx, bullet))
        gameState.enemyBullets.forEach((bullet) => drawEnemyBullet(ctx, bullet))
        gameState.enemies.forEach((enemy) => drawEnemy(ctx, enemy))
        gameState.explosions.forEach((explosion) =>
            drawExplosion(ctx, explosion)
        )

        // Draw game over screen
        if (gameState.gameOver) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

            ctx.fillStyle = scoreColor
            ctx.font = "32px monospace"
            ctx.textAlign = "center"
            ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)
            ctx.font = "16px monospace"
            ctx.fillText(
                `Final Score: ${score}`,
                CANVAS_WIDTH / 2,
                CANVAS_HEIGHT / 2
            )
            ctx.fillText(
                "Press any key to restart",
                CANVAS_WIDTH / 2,
                CANVAS_HEIGHT / 2 + 40
            )
        }
    }, [
        backgroundColor,
        starColor,
        starSize,
        gameState,
        score,
        scoreColor,
        drawPlayer,
        drawBullet,
        drawEnemyBullet,
        drawEnemy,
        drawExplosion,
    ])

    const gameLoop = useCallback(() => {
        updateGame()
        render()
        gameLoopRef.current = requestAnimationFrame(gameLoop)
    }, [updateGame, render])

    // Keyboard event handlers
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (
                ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key
                )
            ) {
                e.preventDefault()
                keysRef.current.add(e.key)
            }

            // Restart game on any key press when game is over
            if (gameState.gameOver) {
                e.preventDefault()
                resetGame()
            }
        },
        [gameState.gameOver, resetGame]
    )

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        keysRef.current.delete(e.key)
    }, [])

    // Touch event handlers
    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            e.preventDefault()
            const rect = canvasRef.current?.getBoundingClientRect()
            if (rect && e.touches[0]) {
                const touchX = e.touches[0].clientX - rect.left
                const touchY = e.touches[0].clientY - rect.top
                const centerX = rect.width / 2
                const centerY = rect.height / 2

                // Determine which direction to move based on touch position
                const isLeft = touchX < centerX
                const isRight = touchX > centerX
                const isUp = touchY < centerY
                const isDown = touchY > centerY

                // Only move in one direction (no diagonal)
                const horizontalDistance = Math.abs(touchX - centerX)
                const verticalDistance = Math.abs(touchY - centerY)

                if (horizontalDistance > verticalDistance) {
                    // Move horizontally
                    if (isLeft) {
                        keysRef.current.add("ArrowLeft")
                    } else if (isRight) {
                        keysRef.current.add("ArrowRight")
                    }
                } else {
                    // Move vertically
                    if (isUp) {
                        keysRef.current.add("ArrowUp")
                    } else if (isDown) {
                        keysRef.current.add("ArrowDown")
                    }
                }
            }

            // Restart game on touch when game is over
            if (gameState.gameOver) {
                resetGame()
            }
        },
        [gameState.gameOver, resetGame]
    )

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        e.preventDefault()
        // Clear all movement keys first
        keysRef.current.delete("ArrowLeft")
        keysRef.current.delete("ArrowRight")
        keysRef.current.delete("ArrowUp")
        keysRef.current.delete("ArrowDown")

        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect && e.touches[0]) {
            const touchX = e.touches[0].clientX - rect.left
            const touchY = e.touches[0].clientY - rect.top
            const centerX = rect.width / 2
            const centerY = rect.height / 2

            // Determine which direction to move based on touch position
            const isLeft = touchX < centerX
            const isRight = touchX > centerX
            const isUp = touchY < centerY
            const isDown = touchY > centerY

            // Only move in one direction (no diagonal)
            const horizontalDistance = Math.abs(touchX - centerX)
            const verticalDistance = Math.abs(touchY - centerY)

            if (horizontalDistance > verticalDistance) {
                // Move horizontally
                if (isLeft) {
                    keysRef.current.add("ArrowLeft")
                } else if (isRight) {
                    keysRef.current.add("ArrowRight")
                }
            } else {
                // Move vertically
                if (isUp) {
                    keysRef.current.add("ArrowUp")
                } else if (isDown) {
                    keysRef.current.add("ArrowDown")
                }
            }
        }
    }, [])

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        e.preventDefault()
        // Clear all movement keys when touch ends
        keysRef.current.delete("ArrowLeft")
        keysRef.current.delete("ArrowRight")
        keysRef.current.delete("ArrowUp")
        keysRef.current.delete("ArrowDown")
    }, [])

    // Arrow button handlers
    const handleArrowPress = useCallback((direction: string) => {
        keysRef.current.add(direction)
    }, [])

    const handleArrowRelease = useCallback((direction: string) => {
        keysRef.current.delete(direction)
    }, [])

    // Canvas click handler for mobile restart
    const handleCanvasClick = useCallback(() => {
        if (gameState.gameOver) {
            resetGame()
        }
    }, [gameState.gameOver, resetGame])

    // Initialize game
    useEffect(() => {
        if (isStatic) return

        if (typeof window !== "undefined") {
            window.addEventListener("keydown", handleKeyDown)
            window.addEventListener("keyup", handleKeyUp)
        }

        gameLoopRef.current = requestAnimationFrame(gameLoop)

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("keydown", handleKeyDown)
                window.removeEventListener("keyup", handleKeyUp)
            }
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current)
            }
        }
    }, [gameLoop, handleKeyDown, handleKeyUp, isStatic])

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: scoreColor,
                    ...font,
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "24px", marginBottom: "16px" }}>
                        🚀 SPACE SHOOTER 🚀
                    </div>
                    <div style={{ fontSize: "16px" }}>
                        Use arrow keys or touch to control
                    </div>
                    <div style={{ fontSize: "14px", marginTop: "8px" }}>
                        Preview in browser to play
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                backgroundColor,
                overflow: "hidden",
                userSelect: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                    width: "100%",
                    height: "100%",
                    imageRendering: "pixelated",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleCanvasClick}
            />
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    color: scoreColor,
                    fontSize: "24px",
                    fontWeight: "bold",
                    ...font,
                }}
            >
                SCORE: {score}
            </div>
            <div
                style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "20px",
                    color: scoreColor,
                    fontSize: "12px",
                    ...font,
                }}
            >
                Arrow Keys / Touch to Move
            </div>
        </div>
    )
}

addPropertyControls(SpaceShooter, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000011",
    },
    gameSpeed: {
        type: ControlType.Number,
        title: "Game Speed",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "16px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    scoreColor: {
        type: ControlType.Color,
        title: "Score Color",
        defaultValue: "#FFFFFF",
    },
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#FFFFFF",
    },
    starSize: {
        type: ControlType.Number,
        title: "Star Size",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
    },
    enemySize: {
        type: ControlType.Number,
        title: "Enemy Size",
        defaultValue: 24,
        min: 12,
        max: 48,
        step: 4,
    },
    enemyColor: {
        type: ControlType.Color,
        title: "Enemy Color",
        defaultValue: "#FF0000",
    },
    enemyBulletColor: {
        type: ControlType.Color,
        title: "Enemy Bullet Color",
        defaultValue: "#FF6600",
    },
    explosionColor: {
        type: ControlType.Color,
        title: "Explosion Color",
        defaultValue: "#FFA500",
    },
    playerSize: {
        type: ControlType.Number,
        title: "Player Size",
        defaultValue: 32,
        min: 16,
        max: 64,
        step: 4,
    },
    playerColor: {
        type: ControlType.Color,
        title: "Player Color",
        defaultValue: "#00FF00",
    },
    bulletColor: {
        type: ControlType.Color,
        title: "Player Bullet Color",
        defaultValue: "#FFFF00",
    },
})
