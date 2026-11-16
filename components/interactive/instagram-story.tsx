// Instagram-style story component with image slides and timer
import {
    useState,
    useEffect,
    useRef,
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

import { motion, AnimatePresence } from "framer-motion"

interface Story {
    image: {
        src: string
        alt: string
    }
    duration: number
}

interface StoryViewerProps {
    stories: Story[]
    autoPlay: boolean
    pauseOnHover: boolean
    showProgressBars: boolean
    progressBarColor: string
    progressBarBackground: string
    progressBarHeight: number
    borderRadius: number
    onComplete?: () => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function InstagramStoryViewer(props: StoryViewerProps) {
    const {
        stories = [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Story 1",
                },
                duration: 5,
            },
        ],
        autoPlay = true,
        pauseOnHover = true,
        showProgressBars = true,
        progressBarColor = "#FFFFFF",
        progressBarBackground = "rgba(255, 255, 255, 0.3)",
        progressBarHeight = 2,
        borderRadius = 0,
        onComplete,
    } = props

    const isStatic = useIsStaticRenderer()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const intervalRef = useRef<number | null>(null)

    const currentStory = stories[currentIndex] || stories[0]
    const currentImage = currentStory?.image || {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Story",
    }
    const duration = (currentStory?.duration || 5) * 1000

    useEffect(() => {
        if (!autoPlay || isPaused || isStatic) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            return
        }

        const increment = 100 / (duration / 50)

        intervalRef.current = window.setInterval(() => {
            startTransition(() => {
                setProgress((prev) => {
                    const newProgress = prev + increment
                    if (newProgress >= 100) {
                        goToNext()
                        return 0
                    }
                    return newProgress
                })
            })
        }, 50)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [currentIndex, duration, autoPlay, isPaused, isStatic])

    const goToNext = () => {
        startTransition(() => {
            if (currentIndex < stories.length - 1) {
                setCurrentIndex((prev) => prev + 1)
                setProgress(0)
            } else {
                setCurrentIndex(0)
                setProgress(0)
                if (onComplete) onComplete()
            }
        })
    }

    const goToPrevious = () => {
        startTransition(() => {
            if (currentIndex > 0) {
                setCurrentIndex((prev) => prev - 1)
                setProgress(0)
            }
        })
    }

    const handleClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const isLeftSide = x < rect.width / 2

        if (isLeftSide) {
            goToPrevious()
        } else {
            goToNext()
        }
    }

    const handleMouseEnter = () => {
        if (pauseOnHover && !isStatic) {
            startTransition(() => setIsPaused(true))
        }
    }

    const handleMouseLeave = () => {
        if (pauseOnHover && !isStatic) {
            startTransition(() => setIsPaused(false))
        }
    }

    // Show static preview in canvas mode
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    backgroundColor: "#000000",
                    borderRadius,
                }}
            >
                <img
                    src={currentImage.src}
                    alt={currentImage.alt || "Story"}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius,
                    }}
                />
                {showProgressBars && (
                    <div
                        style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            right: 8,
                            display: "flex",
                            gap: 4,
                            zIndex: 10,
                        }}
                    >
                        {stories.map((_, index) => (
                            <div
                                key={index}
                                style={{
                                    flex: 1,
                                    height: progressBarHeight,
                                    backgroundColor: progressBarBackground,
                                    borderRadius: progressBarHeight / 2,
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        backgroundColor: progressBarColor,
                                        width: index === 0 ? "30%" : "0%",
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor: "#000000",
                cursor: "pointer",
                borderRadius,
            }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/*
                To avoid the black fade between images we:
                - Use AnimatePresence with mode="sync" so enter and exit run simultaneously
                - Keep both exiting and entering items fully opaque (no fade-out)
                - Use a short crossfade-ish transition on the entering item only if needed
                This prevents the background (black) from showing during the switch.
            */}
            <AnimatePresence mode="sync">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 1 }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        borderRadius,
                    }}
                >
                    <img
                        src={currentImage.src}
                        alt={currentImage.alt || "Story"}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius,
                        }}
                    />
                </motion.div>
            </AnimatePresence>

            {showProgressBars && (
                <div
                    style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        right: 8,
                        display: "flex",
                        gap: 4,
                        zIndex: 10,
                    }}
                >
                    {stories.map((_, index) => (
                        <div
                            key={index}
                            style={{
                                flex: 1,
                                height: progressBarHeight,
                                backgroundColor: progressBarBackground,
                                borderRadius: progressBarHeight / 2,
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    backgroundColor: progressBarColor,
                                    width:
                                        index < currentIndex
                                            ? "100%"
                                            : index === currentIndex
                                              ? `${progress}%`
                                              : "0%",
                                    transition:
                                        index === currentIndex
                                            ? "width 0.1s linear"
                                            : "width 0.5s ease",
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Set a clear display name for Framer’s layer list
InstagramStoryViewer.displayName = "Instagram Story Viewer (no-fade)"

addPropertyControls(InstagramStoryViewer, {
    stories: {
        type: ControlType.Array,
        title: "Stories",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                duration: {
                    type: ControlType.Number,
                    title: "Duration (s)",
                    defaultValue: 5,
                    min: 1,
                    max: 30,
                    step: 1,
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Story 1",
                },
                duration: 5,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Story 2",
                },
                duration: 5,
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Story 3",
                },
                duration: 5,
            },
        ],
    },
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    showProgressBars: {
        type: ControlType.Boolean,
        title: "Progress Bars",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    progressBarColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showProgressBars }) => !showProgressBars,
    },
    progressBarBackground: {
        type: ControlType.Color,
        title: "Bar Background",
        defaultValue: "rgba(255, 255, 255, 0.3)",
        hidden: ({ showProgressBars }) => !showProgressBars,
    },
    progressBarHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
        hidden: ({ showProgressBars }) => !showProgressBars,
    },
})
