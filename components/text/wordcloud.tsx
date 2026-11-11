// 3D word panning component with depth and foreground fade effect
import {
    useState,
    useEffect,
    useMemo,
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


interface WordCloudProps {
    words: string[]
    speed: number
    wordCount: number
    backgroundColor: string
    textColor: string
    font: any
    perspective: number
    fadeDistance: number
    xRange: number
    yRange: number
    zRange: number
    enableCollision: boolean
    minSpacing: number
    fadeInDuration: number
    style?: CSSProperties
}

/**
 * 3D Word Panning Component
 * Words move through 3D space from background to foreground and fade out
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function WordCloud(props: WordCloudProps) {
    const {
        words = [
            "Innovation",
            "Design",
            "Technology",
            "Future",
            "Creative",
            "Digital",
            "Modern",
            "Dynamic",
        ],
        speed = 2,
        wordCount = 12,
        backgroundColor = "#000000",
        textColor = "#FFFFFF",
        font,
        perspective = 1000,
        fadeDistance = 200,
        xRange = 1000,
        yRange = 600,
        zRange = 800,
        enableCollision = true,
        minSpacing = 200,
        fadeInDuration = 0.5,
    } = props

    const [wordInstances, setWordInstances] = useState([])
    const isStatic = useIsStaticRenderer()

    // Memoize word pool to prevent unnecessary recalculations
    const wordPool = useMemo(() => {
        if (!words || words.length === 0) {
            return [
                "Innovation",
                "Design",
                "Technology",
                "Future",
                "Creative",
                "Digital",
                "Modern",
                "Dynamic",
            ]
        }
        return words
    }, [words])

    // Check if a new word position overlaps with existing words
    const checkCollision = useCallback(
        (newWord, existingWords, minDistance = 200) => {
            return existingWords.some((existing) => {
                const dx = newWord.x - existing.x
                const dy = newWord.y - existing.y
                const dz = newWord.z - existing.z

                // Calculate 3D distance
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

                // Adjust minimum distance based on scale and z-position
                const avgScale = (newWord.scale + existing.scale) / 2
                const zFactor = Math.max(1, (1000 - Math.abs(newWord.z)) / 1000)
                const adjustedMinDistance = minDistance * avgScale * zFactor

                return distance < adjustedMinDistance
            })
        },
        []
    )

    // Generate random word instance with improved logic
    const generateWordInstance = useCallback(
        (excludeWords = new Set(), existingWords = []) => {
            const availableWords = wordPool.filter(
                (word) => !excludeWords.has(word)
            )
            const selectedWord =
                availableWords.length > 0
                    ? availableWords[
                          Math.floor(Math.random() * availableWords.length)
                      ]
                    : wordPool[Math.floor(Math.random() * wordPool.length)]

            let attempts = 0
            let newWord
            const maxAttempts = 30

            // Try to find a non-overlapping position
            do {
                newWord = {
                    id: Date.now() + Math.random(),
                    text: selectedWord,
                    x: (Math.random() - 0.5) * xRange * 2,
                    y: (Math.random() - 0.5) * yRange * 2,
                    z: -zRange - Math.random() * 400,
                    scale: 0.5 + Math.random() * 1.5,
                    birthTime: Date.now(),
                }
                attempts++
            } while (
                enableCollision &&
                attempts < maxAttempts &&
                existingWords.length > 0 &&
                checkCollision(newWord, existingWords, minSpacing)
            )

            return newWord
        },
        [
            wordPool,
            xRange,
            yRange,
            zRange,
            checkCollision,
            enableCollision,
            minSpacing,
        ]
    )

    // Initialize word instances
    useEffect(() => {
        if (isStatic) {
            // Static preview with positioned words at different depths
            const staticWords = Array.from(
                { length: Math.min(wordCount, 10) },
                (_, i) => {
                    const depthLayer = i / Math.min(wordCount, 10)
                    return {
                        id: i,
                        text: wordPool[i % wordPool.length],
                        x: (Math.random() - 0.5) * (xRange * 0.6),
                        y: (Math.random() - 0.5) * (yRange * 0.6),
                        z: -zRange * 0.2 - depthLayer * zRange * 0.6,
                        scale: 0.6 + depthLayer * 0.8,
                        birthTime: Date.now() - 1000,
                    }
                }
            )
            startTransition(() => setWordInstances(staticWords))
            return
        }

        const initialWords = []
        const usedWords = new Set()

        for (let i = 0; i < Math.min(wordCount, wordPool.length * 2); i++) {
            const word = generateWordInstance(usedWords)
            usedWords.add(word.text)
            initialWords.push(word)

            // Reset used words if we've used all available words
            if (usedWords.size >= wordPool.length) {
                usedWords.clear()
            }
        }

        startTransition(() => setWordInstances(initialWords))
    }, [
        wordPool,
        wordCount,
        xRange,
        yRange,
        zRange,
        isStatic,
        generateWordInstance,
    ])

    // Animation loop with improved performance
    useEffect(() => {
        if (isStatic) return

        const interval = setInterval(() => {
            startTransition(() => {
                setWordInstances((prev) => {
                    const currentWords = new Set(prev.map((w) => w.text))
                    const updatedWords = []

                    prev.forEach((word) => {
                        const newZ = word.z + speed * 20

                        // Reset word when it passes the fade distance
                        if (newZ > fadeDistance) {
                            currentWords.delete(word.text)
                            const newWord = generateWordInstance(
                                currentWords,
                                updatedWords
                            )
                            currentWords.add(newWord.text)
                            updatedWords.push(newWord)
                        } else {
                            updatedWords.push({ ...word, z: newZ })
                        }
                    })

                    return updatedWords
                })
            })
        }, 50)

        return () => clearInterval(interval)
    }, [speed, fadeDistance, generateWordInstance, isStatic])

    const containerStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        backgroundColor,
        overflow: "hidden",
        position: "relative",
        perspective: `${perspective}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

    return (
        <div style={containerStyle}>
            {wordInstances.map((word) => {
                const distance = Math.abs(word.z)

                // Calculate fade-in based on age
                const age = (Date.now() - word.birthTime) / 1000 // age in seconds
                const fadeInOpacity = Math.min(1, age / fadeInDuration)

                // Calculate opacity: full opacity until camera (z=0), then fade
                let opacity = 1
                if (isStatic) {
                    opacity = Math.max(0.2, 1 - distance / 1000)
                } else if (word.z > 0) {
                    // Start fading after passing camera
                    opacity = Math.max(0, 1 - word.z / fadeDistance)
                }

                // Apply fade-in effect
                opacity *= fadeInOpacity

                const fontSize = isStatic
                    ? Math.max(12, 60 - distance / 20)
                    : Math.max(8, 80 - distance / 25)

                return (
                    <div
                        key={word.id}
                        style={{
                            position: "absolute",
                            color: textColor,
                            fontSize: `${fontSize}px`,
                            fontWeight: "bold",
                            opacity,
                            pointerEvents: "none",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                            transform: `
                                translate3d(${word.x}px, ${word.y}px, ${word.z}px)
                                scale(${word.scale})
                            `,
                            transformStyle: "preserve-3d",
                            transition: "opacity 0.3s ease-out",
                            willChange: "transform, opacity",
                            ...font,
                        }}
                    >
                        {word.text}
                    </div>
                )
            })}
        </div>
    )
}

addPropertyControls(WordCloud, {
    // Content Group
    words: {
        type: ControlType.Array,
        title: "Words",
        description: "List of words to display in the 3D space",
        control: {
            type: ControlType.String,
        },
        defaultValue: [
            "Innovation",
            "Design",
            "Technology",
            "Future",
            "Creative",
            "Digital",
            "Modern",
            "Dynamic",
        ],
        maxCount: 20,
    },
    wordCount: {
        type: ControlType.Number,
        title: "Word Count",
        description: "Number of words visible at once",
        defaultValue: 12,
        min: 5,
        max: 30,
        step: 1,
    },

    // Animation Group
    speed: {
        type: ControlType.Number,
        title: "Speed",
        description: "How fast words move through space",
        defaultValue: 2,
        min: 0.5,
        max: 10,
        step: 0.5,
    },
    fadeInDuration: {
        type: ControlType.Number,
        title: "Fade In Duration",
        description: "How long words take to fade in when appearing",
        defaultValue: 0.5,
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    fadeDistance: {
        type: ControlType.Number,
        title: "Fade Distance",
        description: "Distance from camera where words start to fade",
        defaultValue: 200,
        min: 100,
        max: 500,
        step: 50,
        unit: "px",
    },

    // Layout Group
    xRange: {
        type: ControlType.Number,
        title: "X Range",
        description: "Horizontal spread of words",
        defaultValue: 1000,
        min: 200,
        max: 2000,
        step: 100,
        unit: "px",
    },
    yRange: {
        type: ControlType.Number,
        title: "Y Range",
        description: "Vertical spread of words",
        defaultValue: 600,
        min: 200,
        max: 1200,
        step: 100,
        unit: "px",
    },
    zRange: {
        type: ControlType.Number,
        title: "Z Range",
        description: "Depth range where words are positioned",
        defaultValue: 800,
        min: 200,
        max: 1500,
        step: 100,
        unit: "px",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        description: "3D perspective strength",
        defaultValue: 1000,
        min: 500,
        max: 2000,
        step: 100,
        unit: "px",
    },
    enableCollision: {
        type: ControlType.Boolean,
        title: "Collision Detection",
        description: "Prevent words from overlapping",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    minSpacing: {
        type: ControlType.Number,
        title: "Min Spacing",
        description: "Minimum distance between words",
        defaultValue: 200,
        min: 50,
        max: 500,
        step: 25,
        unit: "px",
        hidden: ({ enableCollision }) => !enableCollision,
    },

    // Style Group
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color of the component",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "Color of the words",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        description:
            "More components at [8ighty8 Studio](https://8ighty8studio.lemonsqueezy.com)",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
})
