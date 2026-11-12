import React, { useState, useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Complete Space Invaders Game Component
export default function SpaceInvadersGame(props) {
    const {
        // Ship properties
        shipColor,
        shipSize,
        bottomOffset,
        smoothness,
        glowEffect,
        glowColor,
        showTrail,
        trailColor,
        shipStyle,
        enableShooting,
        bulletColor,
        shootSpeed,
        shootControl,

        // Title properties
        titleText,
        titleSize,
        titleColor,
        titleHitColor,
        titlePosition,
        enableTitleShooting,
        pixelFont,
        showScore,
        hitEffect,
        backgroundColor,
        showStars,

        // Mobile controls
        mobileMode,
        mobileButtonColor,
        mobileButtonSize,
        mobileButtonOpacity,

        // Framer frame props
        width = 800,
        height = 600,

        ...rest
    } = props

    const [mouseX, setMouseX] = useState(0)
    const [shipX, setShipX] = useState(0)
    const [bullets, setBullets] = useState([])
    const [spacePressed, setSpacePressed] = useState(false)
    const [letterHits, setLetterHits] = useState(new Map())
    const [score, setScore] = useState(0)
    const [stars, setStars] = useState([])
    const [containerSize, setContainerSize] = useState({
        width: 800,
        height: 400,
    })

    // Mobile control states
    const [leftPressed, setLeftPressed] = useState(false)
    const [rightPressed, setRightPressed] = useState(false)
    const [shootPressed, setShootPressed] = useState(false)
    const [isActive, setIsActive] = useState(false)

    const containerRef = useRef(null)
    const animationFrameRef = useRef(null)
    const moveIntervalRef = useRef(null)
    const hasShot = useRef(false)

    // Update container size and initialize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setContainerSize({ width: rect.width, height: rect.height })
                setMouseX(rect.width / 2)
                setShipX(rect.width / 2)
            }
        }

        const resizeObserver = new ResizeObserver(updateSize)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
            updateSize()
        }

        return () => resizeObserver.disconnect()
    }, [])

    // Initialize stars
    useEffect(() => {
        if (showStars && containerSize.width > 0) {
            const starCount = Math.floor(
                (containerSize.width * containerSize.height) / 8000
            )
            const newStars = Array.from(
                { length: Math.max(20, Math.min(100, starCount)) },
                (_, i) => ({
                    id: i,
                    x: Math.random() * containerSize.width,
                    y: Math.random() * containerSize.height,
                    size: Math.random() * 3 + 1,
                    twinkle: Math.random() * 2 + 1,
                })
            )
            setStars(newStars)
        }
    }, [showStars, containerSize])

    // Focus on mount and ensure keyboard events work
    useEffect(() => {
        if (containerRef.current) {
            // Focus immediately
            containerRef.current.focus()

            // Handle click to activate
            const handleClick = () => {
                setIsActive(true)
                if (containerRef.current) {
                    containerRef.current.focus()
                }
            }

            // Also focus on any mouse movement over the component
            const handleMouseEnter = () => {
                if (containerRef.current && isActive) {
                    containerRef.current.focus()
                }
            }

            const container = containerRef.current
            container.addEventListener("click", handleClick)
            container.addEventListener("mouseenter", handleMouseEnter)

            return () => {
                container.removeEventListener("click", handleClick)
                container.removeEventListener("mouseenter", handleMouseEnter)
            }
        }
    }, [isActive])

    // Desktop mouse and keyboard controls
    useEffect(() => {
        // Skip desktop controls if in mobile mode
        if (mobileMode) return

        const handleMouseMove = (e) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                const relativeX = e.clientX - rect.left
                setMouseX(Math.max(0, Math.min(containerSize.width, relativeX)))
            }
        }

        const handleKeyDown = (e) => {
            if (!enableShooting) return

            const isShootKey =
                (shootControl === "space" && e.code === "Space") ||
                (shootControl === "upArrow" && e.code === "ArrowUp") ||
                (shootControl === "sKey" && (e.key === "s" || e.key === "S"))

            if (isShootKey) {
                e.preventDefault()
                setSpacePressed(true)
            }
        }

        const handleKeyUp = (e) => {
            const isShootKey =
                (shootControl === "space" && e.code === "Space") ||
                (shootControl === "upArrow" && e.code === "ArrowUp") ||
                (shootControl === "sKey" && (e.key === "s" || e.key === "S"))

            if (isShootKey) {
                setSpacePressed(false)
            }
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("keyup", handleKeyUp)
        }
    }, [enableShooting, shootControl, containerSize.width, mobileMode])

    // Mobile movement logic
    useEffect(() => {
        if (!mobileMode) return

        if (leftPressed || rightPressed) {
            moveIntervalRef.current = setInterval(() => {
                setShipX((prevX) => {
                    let newX = prevX
                    if (leftPressed) newX -= 5
                    if (rightPressed) newX += 5
                    return Math.max(
                        shipSize / 2,
                        Math.min(containerSize.width - shipSize / 2, newX)
                    )
                })
            }, 16)
        } else {
            if (moveIntervalRef.current) {
                clearInterval(moveIntervalRef.current)
                moveIntervalRef.current = null
            }
        }

        return () => {
            if (moveIntervalRef.current) {
                clearInterval(moveIntervalRef.current)
            }
        }
    }, [leftPressed, rightPressed, mobileMode, shipSize, containerSize.width])

    // Smooth ship movement (desktop only)
    useEffect(() => {
        if (mobileMode) return

        const animate = () => {
            setShipX((prevX) => {
                const diff = mouseX - prevX
                const newX = prevX + diff * smoothness

                if (Math.abs(diff) > 0.1) {
                    animationFrameRef.current = requestAnimationFrame(animate)
                }

                return Math.max(
                    shipSize / 2,
                    Math.min(containerSize.width - shipSize / 2, newX)
                )
            })
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        animationFrameRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [mouseX, smoothness, containerSize.width, shipSize, mobileMode])

    // Shooting mechanism
    useEffect(() => {
        const isPressed = mobileMode ? shootPressed : spacePressed

        if (isPressed && enableShooting) {
            // Fire immediately on first press only
            if (!hasShot.current) {
                setBullets((prev) => [
                    ...prev,
                    {
                        id: Date.now() + Math.random(),
                        x: shipX,
                        y: bottomOffset + shipSize,
                    },
                ])
                hasShot.current = true
            }

            // Then continue firing at intervals
            const shootInterval = setInterval(() => {
                setBullets((prev) => [
                    ...prev,
                    {
                        id: Date.now() + Math.random(),
                        x: shipX,
                        y: bottomOffset + shipSize,
                    },
                ])
            }, shootSpeed)

            return () => clearInterval(shootInterval)
        } else {
            // Reset the shot flag when button is released
            hasShot.current = false
        }
    }, [
        spacePressed,
        shootPressed,
        enableShooting,
        shipX,
        bottomOffset,
        shipSize,
        shootSpeed,
        mobileMode,
    ])

    // Clean up expired letter hits
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            const now = Date.now()
            setLetterHits((prev) => {
                const newHits = new Map()
                prev.forEach((timestamp, letterIndex) => {
                    if (now - timestamp < 5000) {
                        newHits.set(letterIndex, timestamp)
                    }
                })
                return newHits
            })
        }, 1000)

        return () => clearInterval(cleanupInterval)
    }, [])

    // Bullet animation and collision detection
    useEffect(() => {
        const speedPerTick = 8
        const animateBullets = () => {
            setBullets((prev) => {
                const newBullets = []

                prev.forEach((bullet) => {
                    const newY = bullet.y + speedPerTick
                    let bulletHit = false

                    // Check collision with title if enabled
                    if (enableTitleShooting) {
                        const titleElement =
                            containerRef.current?.querySelector(
                                ".space-invaders-title"
                            )
                        if (titleElement) {
                            const containerRect =
                                containerRef.current.getBoundingClientRect()
                            const titleRect =
                                titleElement.getBoundingClientRect()

                            // Convert bullet position to screen coordinates
                            const bulletScreenY = containerRect.bottom - newY
                            const bulletScreenX = containerRect.left + bullet.x

                            // Check if bullet is in title area
                            if (
                                bulletScreenY >= titleRect.top &&
                                bulletScreenY <= titleRect.bottom &&
                                bulletScreenX >= titleRect.left &&
                                bulletScreenX <= titleRect.right
                            ) {
                                // Calculate which letter was hit
                                const relativeX = bulletScreenX - titleRect.left
                                const pixelSize = titleSize / 10
                                const letterWidth = 6 * pixelSize + pixelSize
                                const letterIndex = Math.floor(
                                    relativeX / letterWidth
                                )

                                if (
                                    letterIndex >= 0 &&
                                    letterIndex < titleText.length
                                ) {
                                    setLetterHits((prev) => {
                                        const newHits = new Map(prev)
                                        newHits.set(letterIndex, Date.now())
                                        return newHits
                                    })
                                    setScore((prev) => prev + 10)
                                    bulletHit = true
                                }
                            }
                        }
                    }

                    // Keep bullet if it hasn't hit anything and is still in container
                    if (!bulletHit && newY < containerSize.height + 200) {
                        newBullets.push({ ...bullet, y: newY })
                    }
                })

                return newBullets
            })
        }

        const bulletAnimation = setInterval(animateBullets, 16)
        return () => clearInterval(bulletAnimation)
    }, [enableTitleShooting, titleSize, titleText.length, containerSize.height])

    // Mobile button handlers
    const handleMobileButtonPress = (action, pressed) => {
        switch (action) {
            case "left":
                setLeftPressed(pressed)
                break
            case "right":
                setRightPressed(pressed)
                break
            case "shoot":
                setShootPressed(pressed)
                break
        }
    }

    // Spaceship SVG paths
    const getSpaceshipPath = () => {
        const size = shipSize
        switch (shipStyle) {
            case "classic":
                return `M ${size / 2} 0 L ${size * 0.8} ${size * 0.4} L ${size * 0.9} ${size * 0.6} L ${size * 0.7} ${size * 0.8} L ${size * 0.3} ${size * 0.8} L ${size * 0.1} ${size * 0.6} L ${size * 0.2} ${size * 0.4} Z`
            case "modern":
                return `M ${size / 2} 0 L ${size * 0.75} ${size * 0.3} L ${size * 0.85} ${size * 0.5} L ${size * 0.75} ${size * 0.7} L ${size * 0.6} ${size * 0.9} L ${size * 0.4} ${size * 0.9} L ${size * 0.25} ${size * 0.7} L ${size * 0.15} ${size * 0.5} L ${size * 0.25} ${size * 0.3} Z`
            case "angular":
                return `M ${size / 2} 0 L ${size * 0.8} ${size * 0.5} L ${size * 0.6} ${size * 0.8} L ${size * 0.4} ${size * 0.8} L ${size * 0.2} ${size * 0.5} Z`
            default:
                return `M ${size / 2} 0 L ${size * 0.8} ${size * 0.4} L ${size * 0.9} ${size * 0.6} L ${size * 0.7} ${size * 0.8} L ${size * 0.3} ${size * 0.8} L ${size * 0.1} ${size * 0.6} L ${size * 0.2} ${size * 0.4} Z`
        }
    }

    // Create pixel-style letters for the title
    const createPixelLetter = (letter, index) => {
        const letterPatterns = {
            A: [
                [0, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
            ],
            B: [
                [1, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 0],
            ],
            C: [
                [0, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 1],
                [0, 1, 1, 1, 0],
            ],
            D: [
                [1, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 0],
            ],
            E: [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 1, 1, 1, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 1, 1, 1, 1],
            ],
            F: [
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 1, 1, 1, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
            ],
            G: [
                [0, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 0],
                [1, 0, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [0, 1, 1, 1, 0],
            ],
            H: [
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
            ],
            I: [
                [1, 1, 1, 1, 1],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [1, 1, 1, 1, 1],
            ],
            J: [
                [1, 1, 1, 1, 1],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 1, 0],
                [1, 0, 0, 1, 0],
                [0, 1, 1, 0, 0],
            ],
            K: [
                [1, 0, 0, 0, 1],
                [1, 0, 0, 1, 0],
                [1, 0, 1, 0, 0],
                [1, 1, 0, 0, 0],
                [1, 0, 1, 0, 0],
                [1, 0, 0, 1, 0],
                [1, 0, 0, 0, 1],
            ],
            L: [
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 1, 1, 1, 1],
            ],
            M: [
                [1, 0, 0, 0, 1],
                [1, 1, 0, 1, 1],
                [1, 0, 1, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
            ],
            N: [
                [1, 0, 0, 0, 1],
                [1, 1, 0, 0, 1],
                [1, 0, 1, 0, 1],
                [1, 0, 0, 1, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
            ],
            O: [
                [0, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [0, 1, 1, 1, 0],
            ],
            P: [
                [1, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
            ],
            Q: [
                [0, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 1, 0, 1],
                [1, 0, 0, 1, 1],
                [0, 1, 1, 1, 1],
            ],
            R: [
                [1, 1, 1, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 1, 1, 1, 0],
                [1, 0, 1, 0, 0],
                [1, 0, 0, 1, 0],
                [1, 0, 0, 0, 1],
            ],
            S: [
                [0, 1, 1, 1, 1],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [0, 1, 1, 1, 0],
                [0, 0, 0, 0, 1],
                [0, 0, 0, 0, 1],
                [1, 1, 1, 1, 0],
            ],
            T: [
                [1, 1, 1, 1, 1],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
            ],
            U: [
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [0, 1, 1, 1, 0],
            ],
            V: [
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [0, 1, 0, 1, 0],
                [0, 0, 1, 0, 0],
            ],
            W: [
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 1, 0, 1],
                [1, 1, 0, 1, 1],
                [1, 0, 0, 0, 1],
            ],
            X: [
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [0, 1, 0, 1, 0],
                [0, 0, 1, 0, 0],
                [0, 1, 0, 1, 0],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
            ],
            Y: [
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [1, 0, 0, 0, 1],
                [0, 1, 0, 1, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 1, 0, 0],
            ],
            Z: [
                [1, 1, 1, 1, 1],
                [0, 0, 0, 0, 1],
                [0, 0, 0, 1, 0],
                [0, 0, 1, 0, 0],
                [0, 1, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 1, 1, 1, 1],
            ],
            " ": [
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
            ],
        }

        const pattern =
            letterPatterns[letter.toUpperCase()] || letterPatterns[" "]
        const pixelSize = titleSize / 10
        const letterWidth = 6 * pixelSize
        const letterHeight = 7 * pixelSize

        // Check if this letter is currently hit
        const isLetterHit = letterHits.has(index)
        const hitTime = letterHits.get(index)
        const timeSinceHit = hitTime ? Date.now() - hitTime : 0
        const isRecentHit = isLetterHit && timeSinceHit < 5000

        return (
            <div
                key={index}
                style={{
                    display: "inline-block",
                    width: letterWidth,
                    height: letterHeight,
                    marginRight: pixelSize,
                    transform:
                        isRecentHit && hitEffect ? "scale(1.05)" : "scale(1)",
                    transition: hitEffect ? "all 0.3s ease" : "none",
                    filter:
                        isRecentHit && hitEffect
                            ? `drop-shadow(0 0 ${pixelSize * 3}px ${titleHitColor})`
                            : "none",
                }}
            >
                {pattern.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        style={{ display: "flex", height: pixelSize }}
                    >
                        {row.map((pixel, pixelIndex) => {
                            return (
                                <div
                                    key={pixelIndex}
                                    style={{
                                        width: pixelSize,
                                        height: pixelSize,
                                        backgroundColor: pixel
                                            ? isRecentHit
                                                ? titleHitColor
                                                : titleColor
                                            : "transparent",
                                        transition: hitEffect
                                            ? "all 0.3s ease"
                                            : "none",
                                    }}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div
            {...rest}
            ref={containerRef}
            tabIndex={0}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: "200px",
                minWidth: "200px",
                backgroundColor: backgroundColor,
                pointerEvents: "auto",
                overflow: "hidden",
                outline: "none",
                fontFamily: pixelFont ? '"Courier New", monospace' : "inherit",
                ...rest.style,
            }}
        >
            {/* Stars */}
            {showStars &&
                stars.map((star) => (
                    <div
                        key={star.id}
                        style={{
                            position: "absolute",
                            left: star.x,
                            top: star.y,
                            width: star.size,
                            height: star.size,
                            backgroundColor: "#ffffff",
                            borderRadius: "50%",
                            animation: `twinkle ${star.twinkle}s infinite alternate`,
                        }}
                    />
                ))}

            {/* CSS for animations */}
            <style>
                {`
                @keyframes twinkle {
                    0% { opacity: 0.3; }
                    100% { opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
                .mobile-button {
                    user-select: none;
                    -webkit-user-select: none;
                    -webkit-touch-callout: none;
                }
                .mobile-button:active {
                    transform: scale(0.95);
                }
                `}
            </style>

            {/* Click to Start Overlay */}
            {!isActive && !mobileMode && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 1000,
                    }}
                    onClick={() => {
                        setIsActive(true)
                        if (containerRef.current) {
                            containerRef.current.focus()
                        }
                    }}
                >
                    <div
                        style={{
                            fontSize: titleSize / 2,
                            color: titleColor,
                            fontFamily: pixelFont
                                ? '"Courier New", monospace'
                                : "inherit",
                            fontWeight: "bold",
                            marginBottom: 20,
                            animation: "pulse 2s infinite",
                        }}
                    >
                        CLICK TO START
                    </div>
                    <div
                        style={{
                            fontSize: titleSize / 4,
                            color: titleColor,
                            fontFamily: pixelFont
                                ? '"Courier New", monospace'
                                : "inherit",
                            opacity: 0.7,
                        }}
                    >
                        {shootControl === "space" && "Press SPACE to shoot"}
                        {shootControl === "upArrow" &&
                            "Press UP ARROW to shoot"}
                        {shootControl === "sKey" && "Press S to shoot"}
                    </div>
                </div>
            )}

            {/* Pixel Title */}
            <div
                className="space-invaders-title"
                style={{
                    position: "absolute",
                    left: "50%",
                    top: titlePosition,
                    transform: "translateX(-50%)",
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                {titleText
                    .split("")
                    .map((letter, index) => createPixelLetter(letter, index))}
            </div>

            {/* Score */}
            {showScore && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 20,
                        right: 20,
                        color: titleColor,
                        fontSize: titleSize / 5,
                        fontFamily: pixelFont
                            ? '"Courier New", monospace'
                            : "inherit",
                        fontWeight: "bold",
                    }}
                >
                    SCORE: {score}
                </div>
            )}

            {/* Trail effect */}
            {showTrail && (
                <div
                    style={{
                        position: "absolute",
                        bottom: bottomOffset + shipSize / 2,
                        left: 0,
                        width: "4px",
                        height: "20px",
                        background: `linear-gradient(to top, ${trailColor}, transparent)`,
                        borderRadius: "2px",
                        opacity: 0.6,
                        transform: `translateX(${shipX - 2}px)`,
                        transition: "none",
                    }}
                />
            )}

            {/* Spaceship */}
            <div
                style={{
                    position: "absolute",
                    bottom: bottomOffset,
                    left: 0,
                    transform: `translateX(${shipX - shipSize / 2}px)`,
                    transition: "none",
                    filter: glowEffect
                        ? `drop-shadow(0 0 ${shipSize / 4}px ${glowColor})`
                        : "none",
                }}
            >
                <svg
                    width={shipSize}
                    height={shipSize}
                    viewBox={`0 0 ${shipSize} ${shipSize}`}
                >
                    <defs>
                        <linearGradient
                            id="shipGradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor={shipColor} />
                            <stop
                                offset="100%"
                                stopColor={shipColor}
                                stopOpacity="0.7"
                            />
                        </linearGradient>
                    </defs>
                    <path
                        d={getSpaceshipPath()}
                        fill="url(#shipGradient)"
                        stroke={shipColor}
                        strokeWidth="1"
                    />
                </svg>
            </div>

            {/* Bullets */}
            {enableShooting &&
                bullets.map((bullet) => (
                    <div
                        key={bullet.id}
                        style={{
                            position: "absolute",
                            left: bullet.x - 1,
                            bottom: bullet.y,
                            width: "3px",
                            height: "10px",
                            backgroundColor: bulletColor,
                            borderRadius: "1px",
                            boxShadow: `0 0 6px ${bulletColor}`,
                        }}
                    />
                ))}

            {/* Mobile Controls */}
            {mobileMode && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 20,
                        left: 20,
                        display: "flex",
                        gap: 15,
                        alignItems: "center",
                    }}
                >
                    {/* Left Arrow Button */}
                    <div
                        className="mobile-button"
                        style={{
                            width: mobileButtonSize,
                            height: mobileButtonSize,
                            backgroundColor: mobileButtonColor,
                            opacity: leftPressed ? 1 : mobileButtonOpacity,
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.1s ease",
                            fontSize: mobileButtonSize * 0.4,
                            color: "white",
                            fontWeight: "bold",
                        }}
                        onTouchStart={(e) => {
                            e.preventDefault()
                            handleMobileButtonPress("left", true)
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault()
                            handleMobileButtonPress("left", false)
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault()
                            handleMobileButtonPress("left", true)
                        }}
                        onMouseUp={(e) => {
                            e.preventDefault()
                            handleMobileButtonPress("left", false)
                        }}
                        onMouseLeave={(e) => {
                            handleMobileButtonPress("left", false)
                        }}
                    >
                        ◀
                    </div>

                    {/* Right Arrow Button */}
                    <div
                        className="mobile-button"
                        style={{
                            width: mobileButtonSize,
                            height: mobileButtonSize,
                            backgroundColor: mobileButtonColor,
                            opacity: rightPressed ? 1 : mobileButtonOpacity,
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.1s ease",
                            fontSize: mobileButtonSize * 0.4,
                            color: "white",
                            fontWeight: "bold",
                        }}
                        onTouchStart={(e) => {
                            e.preventDefault()
                            handleMobileButtonPress("right", true)
                        }}
                        onTouchEnd={(e) => {
                            e.preventDefault()
                            handleMobileButtonPress("right", false)
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault()
                            handleMobileButtonPress("right", true)
                        }}
                        onMouseUp={(e) => {
                            e.preventDefault()
                            handleMobileButtonPress("right", false)
                        }}
                        onMouseLeave={(e) => {
                            handleMobileButtonPress("right", false)
                        }}
                    >
                        ▶
                    </div>

                    {/* Shoot Button */}
                    {enableShooting && (
                        <div
                            className="mobile-button"
                            style={{
                                width: mobileButtonSize * 1.2,
                                height: mobileButtonSize,
                                backgroundColor: mobileButtonColor,
                                opacity: shootPressed ? 1 : mobileButtonOpacity,
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.1s ease",
                                fontSize: mobileButtonSize * 0.25,
                                color: "white",
                                fontWeight: "bold",
                                marginLeft: 10,
                            }}
                            onTouchStart={(e) => {
                                e.preventDefault()
                                handleMobileButtonPress("shoot", true)
                            }}
                            onTouchEnd={(e) => {
                                e.preventDefault()
                                handleMobileButtonPress("shoot", false)
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                handleMobileButtonPress("shoot", true)
                            }}
                            onMouseUp={(e) => {
                                e.preventDefault()
                                handleMobileButtonPress("shoot", false)
                            }}
                            onMouseLeave={(e) => {
                                handleMobileButtonPress("shoot", false)
                            }}
                        >
                            FIRE
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Set default size for Framer
SpaceInvadersGame.defaultProps = {
    width: 800,
    height: 600,
}

// Property Controls for Framer
addPropertyControls(SpaceInvadersGame, {
    // Device Mode Controls
    mobileMode: {
        type: ControlType.Boolean,
        title: "Mobile Mode",
        defaultValue: false,
    },
    mobileButtonColor: {
        type: ControlType.Color,
        title: "Mobile Button Color",
        defaultValue: "#333333",
        hidden: (props) => !props.mobileMode,
    },
    mobileButtonSize: {
        type: ControlType.Number,
        title: "Mobile Button Size",
        min: 40,
        max: 80,
        step: 5,
        defaultValue: 60,
        hidden: (props) => !props.mobileMode,
    },
    mobileButtonOpacity: {
        type: ControlType.Number,
        title: "Mobile Button Opacity",
        min: 0.3,
        max: 1,
        step: 0.1,
        defaultValue: 0.7,
        hidden: (props) => !props.mobileMode,
    },

    // Ship Controls
    shipStyle: {
        type: ControlType.Enum,
        title: "Ship Style",
        options: ["classic", "modern", "angular"],
        optionTitles: ["Classic", "Modern", "Angular"],
        defaultValue: "classic",
    },
    shipColor: {
        type: ControlType.Color,
        title: "Ship Color",
        defaultValue: "#00FF41",
    },
    shipSize: {
        type: ControlType.Number,
        title: "Ship Size",
        min: 20,
        max: 80,
        step: 2,
        defaultValue: 40,
    },
    bottomOffset: {
        type: ControlType.Number,
        title: "Bottom Offset",
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 30,
    },
    smoothness: {
        type: ControlType.Number,
        title: "Movement Smoothness (Desktop)",
        min: 0.01,
        max: 1,
        step: 0.05,
        defaultValue: 0.15,
        hidden: (props) => props.mobileMode,
    },
    glowEffect: {
        type: ControlType.Boolean,
        title: "Ship Glow Effect",
        defaultValue: true,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Ship Glow Color",
        defaultValue: "#00FF41",
        hidden: (props) => !props.glowEffect,
    },
    showTrail: {
        type: ControlType.Boolean,
        title: "Show Ship Trail",
        defaultValue: true,
    },
    trailColor: {
        type: ControlType.Color,
        title: "Trail Color",
        defaultValue: "#00FF41",
        hidden: (props) => !props.showTrail,
    },

    // Shooting Controls
    enableShooting: {
        type: ControlType.Boolean,
        title: "Enable Shooting",
        defaultValue: true,
    },
    bulletColor: {
        type: ControlType.Color,
        title: "Bullet Color",
        defaultValue: "#FFFF00",
        hidden: (props) => !props.enableShooting,
    },
    shootSpeed: {
        type: ControlType.Number,
        title: "Shoot Speed (ms)",
        min: 50,
        max: 500,
        step: 25,
        defaultValue: 150,
        hidden: (props) => !props.enableShooting,
    },
    shootControl: {
        type: ControlType.Enum,
        title: "Shoot Control (Desktop)",
        options: ["space", "upArrow", "sKey"],
        optionTitles: ["Space Bar", "Up Arrow", "S Key"],
        defaultValue: "space",
        hidden: (props) => !props.enableShooting || props.mobileMode,
    },

    // Title Controls
    titleText: {
        type: ControlType.String,
        title: "Title Text",
        defaultValue: "SPACE INVADERS",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        min: 30,
        max: 200,
        step: 10,
        defaultValue: 80,
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#00FF41",
    },
    titleHitColor: {
        type: ControlType.Color,
        title: "Title Hit Color",
        defaultValue: "#FF6B6B",
    },
    titlePosition: {
        type: ControlType.Number,
        title: "Title Position (px from top)",
        min: 50,
        max: 400,
        step: 10,
        defaultValue: 150,
    },
    enableTitleShooting: {
        type: ControlType.Boolean,
        title: "Enable Title Shooting",
        defaultValue: true,
    },
    hitEffect: {
        type: ControlType.Boolean,
        title: "Hit Glow Effect",
        defaultValue: true,
        hidden: (props) => !props.enableTitleShooting,
    },

    // Game Controls
    showScore: {
        type: ControlType.Boolean,
        title: "Show Score",
        defaultValue: true,
        hidden: (props) => !props.enableTitleShooting,
    },
    pixelFont: {
        type: ControlType.Boolean,
        title: "Pixel Font",
        defaultValue: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
    },
    showStars: {
        type: ControlType.Boolean,
        title: "Show Stars",
        defaultValue: true,
    },
})
