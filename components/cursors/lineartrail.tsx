// Image trail effect that follows cursor horizontally with trailing images
import { useEffect, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TrailItem {
    id: number
    x: number
    opacity: number
    imageIndex: number
    size: number
    delay: number
    createdAt: number
}

interface LinearTrailProps {
    images: { src: string; alt?: string }[]
    trailLength: number
    sizeSettings: {
        imageSize: number
        sizeVariability: number
        constrainToSquare: boolean
        borderRadius: number
    }
    spacing: number
    trailSpeed: number
    spawnSettings: {
        spawnRate: number
        initialOpacity: number
        spawnOffset: number
    }
    fadeSettings: {
        fadeDelay: number
        fadeSpeedPreset: "slow" | "medium" | "fast" | "custom"
        fadeSpeedCustom: number
    }
    staggerDelay: number
    cursorSettings: {
        showCursor: boolean
        cursorColor: string
        cursorSize: number
    }
    trailShape: {
        shapeType: "straight" | "wave" | "arc"
        amplitude: number
    }
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function LinearTrail(props: LinearTrailProps) {
    const {
        images = [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Trail image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Trail image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1oS60.jpg",
                alt: "Trail image 3",
            },
        ],
        trailLength,
        sizeSettings = {
            imageSize: 60,
            sizeVariability: 20,
            constrainToSquare: false,
            borderRadius: 0,
        },
        spacing,
        trailSpeed = 1,
        spawnSettings = {
            spawnRate: 1,
            initialOpacity: 1,
            spawnOffset: 0,
        },
        fadeSettings = {
            fadeDelay: 500,
            fadeSpeedPreset: "medium",
            fadeSpeedCustom: 0.05,
        },
        staggerDelay,
        cursorSettings = {
            showCursor: true,
            cursorColor: "#000000",
            cursorSize: 24,
        },
        trailShape = {
            shapeType: "straight",
            amplitude: 50,
        },
    } = props

    const { imageSize, sizeVariability, constrainToSquare, borderRadius } =
        sizeSettings
    const { spawnRate, initialOpacity, spawnOffset } = spawnSettings
    const { fadeDelay, fadeSpeedPreset, fadeSpeedCustom } = fadeSettings
    const { showCursor, cursorColor, cursorSize } = cursorSettings
    const { shapeType, amplitude } = trailShape

    // Calculate effective spacing based on trail speed
    const effectiveSpacing = spacing / trailSpeed

    const [trail, setTrail] = useState<TrailItem[]>([])
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
    const [isCursorActive, setIsCursorActive] = useState(false)
    const [cursorDirection, setCursorDirection] = useState<
        "left" | "right" | null
    >(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const lastXRef = useRef<number>(0)
    const idCounterRef = useRef<number>(0)
    const spawnCounterRef = useRef<number>(0)
    const inactivityTimerRef = useRef<number>(0)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        if (isStatic) return

        // Clear inactivity timer on unmount
        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current)
            }
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            // Check if cursor is within container bounds
            if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
                return
            }

            if (Math.abs(x - lastXRef.current) > effectiveSpacing) {
                lastXRef.current = x

                // Spawn rate control - only spawn every Nth movement
                spawnCounterRef.current++
                if (spawnCounterRef.current % spawnRate !== 0) return

                startTransition(() => {
                    setTrail((prev) => {
                        const sizeVariation =
                            (Math.random() - 0.5) * 2 * sizeVariability
                        const itemSize = Math.max(20, imageSize + sizeVariation)

                        // Apply spawn offset (random offset from cursor position)
                        const offsetX = (Math.random() - 0.5) * 2 * spawnOffset

                        const newItem: TrailItem = {
                            id: idCounterRef.current++,
                            x: x + offsetX,
                            opacity: initialOpacity,
                            imageIndex: idCounterRef.current % images.length,
                            size: itemSize,
                            delay: 0,
                            createdAt: Date.now(),
                        }

                        const updated = [newItem, ...prev].slice(0, trailLength)
                        return updated.map((item, index) => ({
                            ...item,
                            delay: index * staggerDelay,
                        }))
                    })
                })
            }
        }

        containerRef.current?.addEventListener("mousemove", handleMouseMove)
        return () =>
            containerRef.current?.removeEventListener(
                "mousemove",
                handleMouseMove
            )
    }, [
        spacing,
        trailLength,
        isStatic,
        images.length,
        spawnRate,
        initialOpacity,
        spawnOffset,
        imageSize,
        sizeVariability,
        staggerDelay,
    ])

    useEffect(() => {
        if (isStatic) return

        // Calculate fade speed based on preset or custom value
        const fadeSpeedPresets = {
            slow: 0.02,
            medium: 0.05,
            fast: 0.1,
            custom: fadeSpeedCustom,
        }
        const actualFadeSpeed = fadeSpeedPresets[fadeSpeedPreset]

        const interval = setInterval(() => {
            startTransition(() => {
                setTrail((prev) =>
                    prev
                        .map((item) => {
                            // Calculate age in milliseconds
                            const age = Date.now() - item.createdAt

                            // Only start fading after the delay
                            if (age < fadeDelay) {
                                return item
                            }

                            return {
                                ...item,
                                opacity: item.opacity - actualFadeSpeed,
                            }
                        })
                        .filter((item) => item.opacity > 0)
                )
            })
        }, 50)

        return () => clearInterval(interval)
    }, [fadeSpeedPreset, fadeSpeedCustom, fadeDelay, isStatic])

    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                }}
            >
                {images.map((image, index) => {
                    const sizeVariation =
                        (Math.random() - 0.5) * 2 * sizeVariability
                    const itemSize = Math.max(20, imageSize + sizeVariation)
                    return (
                        <img
                            key={index}
                            src={image.src}
                            alt={image.alt || ""}
                            style={{
                                width: itemSize,
                                height: itemSize,
                                objectFit: constrainToSquare
                                    ? "cover"
                                    : "contain",
                                pointerEvents: "none",
                                opacity: 0.5,
                                borderRadius: borderRadius,
                            }}
                        />
                    )
                })}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                cursor: "none",
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "auto",
                }}
                onMouseMove={(e) => {
                    if (!containerRef.current) return

                    const rect = containerRef.current.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const y = e.clientY - rect.top

                    // Update cursor position and direction
                    startTransition(() => {
                        setCursorPos((prev) => {
                            // Determine direction based on movement
                            if (x > prev.x) {
                                setCursorDirection("right")
                            } else if (x < prev.x) {
                                setCursorDirection("left")
                            }
                            return { x, y }
                        })
                        setIsCursorActive(true)
                    })

                    // Reset inactivity timer
                    if (inactivityTimerRef.current) {
                        clearTimeout(inactivityTimerRef.current)
                    }
                    inactivityTimerRef.current = window.setTimeout(() => {
                        startTransition(() => {
                            setIsCursorActive(false)
                        })
                    }, 500)

                    if (Math.abs(x - lastXRef.current) > effectiveSpacing) {
                        lastXRef.current = x

                        spawnCounterRef.current++
                        if (spawnCounterRef.current % spawnRate !== 0) return

                        startTransition(() => {
                            setTrail((prev) => {
                                const sizeVariation =
                                    (Math.random() - 0.5) * 2 * sizeVariability
                                const itemSize = Math.max(
                                    20,
                                    imageSize + sizeVariation
                                )

                                const offsetX =
                                    (Math.random() - 0.5) * 2 * spawnOffset

                                const newItem: TrailItem = {
                                    id: idCounterRef.current++,
                                    x: x + offsetX,
                                    opacity: initialOpacity,
                                    imageIndex:
                                        idCounterRef.current % images.length,
                                    size: itemSize,
                                    delay: 0,
                                    createdAt: Date.now(),
                                }

                                const updated = [newItem, ...prev].slice(
                                    0,
                                    trailLength
                                )
                                return updated.map((item, index) => ({
                                    ...item,
                                    delay: index * staggerDelay,
                                }))
                            })
                        })
                    }
                }}
                onMouseLeave={() => {
                    startTransition(() => {
                        setIsCursorActive(false)
                    })
                    // Clear the inactivity timer when leaving
                    if (inactivityTimerRef.current) {
                        clearTimeout(inactivityTimerRef.current)
                    }
                }}
                onTouchStart={(e) => {
                    if (!containerRef.current) return

                    const touch = e.touches[0]
                    const rect = containerRef.current.getBoundingClientRect()
                    const x = touch.clientX - rect.left
                    const y = touch.clientY - rect.top

                    startTransition(() => {
                        setCursorPos({ x, y })
                        setIsCursorActive(true)
                    })

                    lastXRef.current = x
                }}
                onTouchMove={(e) => {
                    if (!containerRef.current) return

                    const touch = e.touches[0]
                    const rect = containerRef.current.getBoundingClientRect()
                    const x = touch.clientX - rect.left
                    const y = touch.clientY - rect.top

                    // Update cursor position and direction
                    startTransition(() => {
                        setCursorPos((prev) => {
                            // Determine direction based on movement
                            if (x > prev.x) {
                                setCursorDirection("right")
                            } else if (x < prev.x) {
                                setCursorDirection("left")
                            }
                            return { x, y }
                        })
                        setIsCursorActive(true)
                    })

                    // Reset inactivity timer
                    if (inactivityTimerRef.current) {
                        clearTimeout(inactivityTimerRef.current)
                    }
                    inactivityTimerRef.current = window.setTimeout(() => {
                        startTransition(() => {
                            setIsCursorActive(false)
                        })
                    }, 500)

                    if (Math.abs(x - lastXRef.current) > effectiveSpacing) {
                        lastXRef.current = x

                        spawnCounterRef.current++
                        if (spawnCounterRef.current % spawnRate !== 0) return

                        startTransition(() => {
                            setTrail((prev) => {
                                const sizeVariation =
                                    (Math.random() - 0.5) * 2 * sizeVariability
                                const itemSize = Math.max(
                                    20,
                                    imageSize + sizeVariation
                                )

                                const offsetX =
                                    (Math.random() - 0.5) * 2 * spawnOffset

                                const newItem: TrailItem = {
                                    id: idCounterRef.current++,
                                    x: x + offsetX,
                                    opacity: initialOpacity,
                                    imageIndex:
                                        idCounterRef.current % images.length,
                                    size: itemSize,
                                    delay: 0,
                                    createdAt: Date.now(),
                                }

                                const updated = [newItem, ...prev].slice(
                                    0,
                                    trailLength
                                )
                                return updated.map((item, index) => ({
                                    ...item,
                                    delay: index * staggerDelay,
                                }))
                            })
                        })
                    }
                }}
                onTouchEnd={() => {
                    startTransition(() => {
                        setIsCursorActive(false)
                    })
                    // Clear the inactivity timer when touch ends
                    if (inactivityTimerRef.current) {
                        clearTimeout(inactivityTimerRef.current)
                    }
                }}
            />
            {/* Custom cursor with arrows */}
            {showCursor && isCursorActive && (
                <div
                    style={{
                        position: "absolute",
                        left: cursorPos.x,
                        top: cursorPos.y,
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: cursorSize * 0.5,
                        zIndex: 10000,
                    }}
                >
                    {/* Left arrow */}
                    <svg
                        width={cursorSize}
                        height={cursorSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={cursorColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            opacity: cursorDirection === "right" ? 0 : 1,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    {/* Right arrow */}
                    <svg
                        width={cursorSize}
                        height={cursorSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={cursorColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            opacity: cursorDirection === "left" ? 0 : 1,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            )}
            {trail.map((item, index) => {
                const image = images[item.imageIndex]

                // Calculate vertical offset based on shape type
                let yOffset = 0
                if (shapeType === "wave") {
                    // Sine wave pattern
                    yOffset = Math.sin(index * 0.5) * amplitude
                } else if (shapeType === "arc") {
                    // Parabolic arc pattern
                    const normalizedIndex =
                        index / Math.max(1, trail.length - 1)
                    yOffset =
                        -Math.pow(normalizedIndex * 2 - 1, 2) * amplitude +
                        amplitude
                }

                return (
                    <img
                        key={item.id}
                        src={image.src}
                        alt={image.alt || ""}
                        style={{
                            position: "absolute",
                            left: item.x,
                            top: `calc(50% + ${yOffset}px)`,
                            transform: "translate(-50%, -50%)",
                            width: item.size,
                            height: item.size,
                            objectFit: constrainToSquare ? "cover" : "contain",
                            opacity: item.opacity,
                            pointerEvents: "none",
                            zIndex: index,
                            borderRadius: borderRadius,
                        }}
                    />
                )
            })}
        </div>
    )
}

addPropertyControls(LinearTrail, {
    images: {
        type: ControlType.Array,
        title: "Images",
        description: "Images that will appear in the trail effect",
        control: {
            type: ControlType.ResponsiveImage,
        },
        defaultValue: [
            {
                src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                alt: "Trail image 1",
            },
            {
                src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                alt: "Trail image 2",
            },
            {
                src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1oS60.jpg",
                alt: "Trail image 3",
            },
        ],
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        description: "Maximum number of images visible in the trail",
        defaultValue: 10,
        min: 1,
        max: 50,
        step: 1,
    },
    sizeSettings: {
        type: ControlType.Object,
        title: "Size",
        description: "Control the size and appearance of trail images",
        controls: {
            imageSize: {
                type: ControlType.Number,
                title: "Image Size",
                description: "Base size for trail images",
                defaultValue: 60,
                min: 20,
                max: 500,
                step: 5,
                unit: "px",
            },
            sizeVariability: {
                type: ControlType.Number,
                title: "Variability",
                description: "Random size variation applied to each image",
                defaultValue: 20,
                min: 0,
                max: 100,
                step: 5,
                unit: "px",
            },
            constrainToSquare: {
                type: ControlType.Boolean,
                title: "Constrain to Square",
                description:
                    "Toggle between cover (fill square) and contain (fit within square)",
                defaultValue: false,
                enabledTitle: "Cover",
                disabledTitle: "Contain",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Border Radius",
                description: "Roundness of the image corners",
                defaultValue: 0,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
        },
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        description: "Minimum horizontal distance between spawned images",
        defaultValue: 200,
        min: 5,
        max: 300,
        step: 5,
        unit: "px",
    },
    trailSpeed: {
        type: ControlType.Number,
        title: "Trail Speed",
        description:
            "Overall speed of trail movement (higher = faster response to cursor)",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    spawnSettings: {
        type: ControlType.Object,
        title: "Spawn",
        description: "Control how images appear in the trail",
        controls: {
            spawnRate: {
                type: ControlType.Number,
                title: "Rate",
                description:
                    "Spawn an image every Nth cursor movement (higher = fewer images)",
                defaultValue: 1,
                min: 1,
                max: 10,
                step: 1,
            },
            initialOpacity: {
                type: ControlType.Number,
                title: "Initial Opacity",
                description: "Starting opacity when images first appear",
                defaultValue: 1,
                min: 0,
                max: 1,
                step: 0.1,
            },
            spawnOffset: {
                type: ControlType.Number,
                title: "Offset",
                description: "Random position offset from cursor when spawning",
                defaultValue: 0,
                min: 0,
                max: 100,
                step: 5,
                unit: "px",
            },
        },
    },
    fadeSettings: {
        type: ControlType.Object,
        title: "Fade",
        description: "Control how images fade out over time",
        controls: {
            fadeDelay: {
                type: ControlType.Number,
                title: "Delay",
                description: "Time before images start to fade out",
                defaultValue: 500,
                min: 0,
                max: 2000,
                step: 100,
                unit: "ms",
            },
            fadeSpeedPreset: {
                type: ControlType.Enum,
                title: "Speed",
                description: "How quickly images fade out after the delay",
                options: ["slow", "medium", "fast", "custom"],
                optionTitles: ["Slow", "Medium", "Fast", "Custom"],
                defaultValue: "medium",
                displaySegmentedControl: true,
            },
            fadeSpeedCustom: {
                type: ControlType.Number,
                title: "Custom Speed",
                description: "Custom fade speed value (higher = faster fade)",
                defaultValue: 0.05,
                min: 0.01,
                max: 1,
                step: 0.01,
                hidden: ({ fadeSpeedPreset }) => fadeSpeedPreset !== "custom",
            },
        },
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        description: "Delay between each image in the trail sequence",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 10,
        unit: "ms",
    },
    cursorSettings: {
        type: ControlType.Object,
        title: "Cursor",
        description: "Customize the cursor appearance",
        controls: {
            showCursor: {
                type: ControlType.Boolean,
                title: "Show Cursor",
                description: "Toggle custom cursor with arrows",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            cursorColor: {
                type: ControlType.Color,
                title: "Color",
                description: "Color of the cursor arrows",
                defaultValue: "#000000",
            },
            cursorSize: {
                type: ControlType.Number,
                title: "Size",
                description: "Size of the cursor arrows",
                defaultValue: 24,
                min: 12,
                max: 48,
                step: 2,
                unit: "px",
            },
        },
    },
    trailShape: {
        type: ControlType.Object,
        title: "Trail Shape",
        description: "Control the path shape of the image trail",
        controls: {
            shapeType: {
                type: ControlType.Enum,
                title: "Shape",
                description: "Type of curve for the trail path",
                options: ["straight", "wave", "arc"],
                optionTitles: ["Straight", "Wave", "Arc"],
                defaultValue: "straight",
                displaySegmentedControl: true,
            },
            amplitude: {
                type: ControlType.Number,
                title: "Amplitude",
                description: "Strength of the curve effect",
                defaultValue: 50,
                min: 0,
                max: 200,
                step: 5,
                unit: "px",
            },
        },
    },
})
