// Create immersive image sequences where each layer smoothly scales and stacks over the previous one. Control timing, motion, and depth to build cinematic zoom effects and seamless looping compositions.

import {
    useEffect,
    useState,
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

import { motion, useAnimation, useInView, type Transition } from "framer-motion"

interface ImageItem {
    image: {
        src: string
        alt: string
    }
    objectPosition: string
}

interface ZoomStackProps {
    items: ImageItem[]
    previewSlide: number
    transition: Transition
    nextDelay: number
    scaleWrapperFrom: number
    scaleImageFrom: number
    rotateImageFrom: number
    loop: boolean
    restartView: boolean
    firstFull: boolean
    delay: number
    background: string
    radius: number
    style?: CSSProperties
}

/**
 * Zoom Stack - Immersive layered image animations
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ZoomStack(props: ZoomStackProps) {
    const {
        items = [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 1",
                },
                objectPosition: "center",
            },
        ],
        previewSlide = 1,
        transition = {
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 1,
        },
        nextDelay = 0.5,
        scaleWrapperFrom = 0.1,
        scaleImageFrom = 2,
        rotateImageFrom = 0,
        loop = true,
        restartView = true,
        firstFull = false,
        delay = 0,
        background = "#000000",
        radius = 0,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: false })
    const [currentIndex, setCurrentIndex] = useState(0)
    const [visibleLayers, setVisibleLayers] = useState<number[]>([])
    const [loopCount, setLoopCount] = useState(0)
    const animationIntervalRef = useRef<number | null>(null)
    const [animationStartTimes, setAnimationStartTimes] = useState<Map<number, number>>(new Map())

    const totalItems = items.length

    // Calculate total duration for one image cycle
    const transitionDuration = transition.duration || 1
    const cycleDuration = (transitionDuration + nextDelay) * 1000

    useEffect(() => {
        if (isStatic || totalItems === 0) return

        const shouldAnimate = restartView ? isInView : true

        if (shouldAnimate) {
            // Clear any existing interval
            if (animationIntervalRef.current !== null) {
                clearInterval(animationIntervalRef.current)
            }

            // Start with first image after initial delay
            const initialTimeout = window.setTimeout(
                () => {
                    startTransition(() => {
                        setCurrentIndex(0)
                        setVisibleLayers([0])
                        setAnimationStartTimes(new Map([[0, Date.now()]]))
                    })

                    // Set up continuous animation
                    animationIntervalRef.current = window.setInterval(() => {
                        startTransition(() => {
                            setCurrentIndex((prevIndex) => {
                                const nextIndex = prevIndex + 1
                                if (nextIndex >= totalItems) {
                                    if (loop) {
                                        setVisibleLayers([])
                                        setAnimationStartTimes(new Map())
                                        setLoopCount((prev) => prev + 1)
                                        // Reset to first image after a brief moment
                                        setTimeout(() => {
                                            startTransition(() => {
                                                setCurrentIndex(0)
                                                setVisibleLayers([0])
                                                setAnimationStartTimes(new Map([[0, Date.now()]]))
                                            })
                                        }, 100)
                                        return 0
                                    }
                                    return prevIndex
                                }
                                setVisibleLayers((prev) => [...prev, nextIndex])
                                setAnimationStartTimes((prev) => {
                                    const newMap = new Map(prev)
                                    newMap.set(nextIndex, Date.now())
                                    return newMap
                                })
                                return nextIndex
                            })
                        })
                    }, cycleDuration)
                },
                (firstFull ? delay : 0) * 1000
            )

            return () => {
                clearTimeout(initialTimeout)
                if (animationIntervalRef.current !== null) {
                    clearInterval(animationIntervalRef.current)
                }
            }
        } else {
            // Stop animation when out of view
            if (animationIntervalRef.current !== null) {
                clearInterval(animationIntervalRef.current)
            }
        }
    }, [
        isStatic,
        isInView,
        restartView,
        totalItems,
        loop,
        cycleDuration,
        firstFull,
        delay,
    ])

    const displayIndex = isStatic
        ? Math.max(0, Math.min(previewSlide - 1, totalItems - 1))
        : currentIndex

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: background,
                borderRadius: radius,
            }}
        >
            {items.map((item, index) => {
                const {
                    image = {
                        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                        alt: "Default Image",
                    },
                    objectPosition = "center",
                } = item
                const isActive = index === displayIndex
                const shouldShow = isStatic
                    ? index === displayIndex
                    : visibleLayers.includes(index)

                if (!shouldShow && !isStatic) return null

                // No delay - each image animates immediately when it becomes visible
                const animationDelay = 0

                return (
                    <motion.div
                        key={`${index}-${loopCount}`}
                        initial={
                            !isStatic ? { scale: scaleWrapperFrom, opacity: 0 } : false
                        }
                        animate={
                            !isStatic
                                ? {
                                      scale: 1,
                                      opacity: 1,
                                  }
                                : { scale: 1 }
                        }
                        transition={
                            !isStatic 
                                ? transition
                                : { duration: 0 }
                        }
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                            borderRadius: radius,
                            zIndex: index,
                        }}
                    >
                        <motion.img
                            src={image.src}
                            alt={image.alt}
                            initial={
                                !isStatic
                                    ? {
                                          scale: scaleImageFrom,
                                          rotate: rotateImageFrom,
                                      }
                                    : false
                            }
                            animate={
                                !isStatic
                                    ? {
                                          scale: 1,
                                          rotate: 0,
                                      }
                                    : {
                                          scale: 1,
                                          rotate: 0,
                                      }
                            }
                            transition={
                                !isStatic
                                    ? transition
                                    : { duration: 0 }
                            }
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: objectPosition,
                            }}
                        />
                    </motion.div>
                )
            })}
        </div>
    )
}

addPropertyControls(ZoomStack, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                objectPosition: {
                    type: ControlType.Enum,
                    title: "Focal Point",
                    options: ["center", "top", "bottom", "left", "right"],
                    optionTitles: ["Center", "Top", "Bottom", "Left", "Right"],
                    defaultValue: "center",
                },
            },
        },
        defaultValue: [
            {
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Image 1",
                },
                objectPosition: "center",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Image 2",
                },
                objectPosition: "center",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Image 3",
                },
                objectPosition: "center",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Image 4",
                },
                objectPosition: "center",
            },
            {
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Image 5",
                },
                objectPosition: "center",
            },
        ],
    },
    previewSlide: {
        type: ControlType.Number,
        title: "Preview Slide",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
    },
    nextDelay: {
        type: ControlType.Number,
        title: "Next Delay",
        defaultValue: 0.5,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    scaleWrapperFrom: {
        type: ControlType.Number,
        title: "Scale Wrapper From",
        defaultValue: 0.1,
        min: 0,
        max: 2,
        step: 0.1,
    },
    scaleImageFrom: {
        type: ControlType.Number,
        title: "Scale Image From",
        defaultValue: 2,
        min: 0.1,
        max: 5,
        step: 0.1,
    },
    rotateImageFrom: {
        type: ControlType.Number,
        title: "Rotate Image From",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    restartView: {
        type: ControlType.Boolean,
        title: "Restart View",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    firstFull: {
        type: ControlType.Boolean,
        title: "First Full",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
})
