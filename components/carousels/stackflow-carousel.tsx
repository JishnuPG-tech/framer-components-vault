import {
    useState,
    useEffect,
    useRef,
    startTransition,
    type CSSProperties,
    Children,
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

import { useMotionValue, useAnimationFrame, animate } from "framer-motion"

interface CurvedSliderProps {
    children?: React.ReactNode
    layoutGroup?: {
        cardWidth: number
        cardHeight: number
        borderRadius: number
        curveIntensity: number
        curveDirection: "up" | "down"
        translateYMultiplier: number
        rotationAngle: number
        spacing: number
    }
    autoPlayGroup?: {
        autoPlay: boolean
        autoPlayInterval: number
        direction: "left" | "right"
        pauseOnHover: boolean
    }
    navigationGroup?: {
        showArrows: boolean
        arrowColor: string
        arrowSize: number
    }
    shadow?: {
        color: string
        blur: number
        spread: number
        offsetX: number
        offsetY: number
    }
    style?: CSSProperties
}

function CurvedSlider(props: CurvedSliderProps) {
    const {
        children,
        layoutGroup,
        autoPlayGroup,
        navigationGroup,
        shadow = {
            color: "rgba(0, 0, 0, 0.2)",
            blur: 30,
            spread: 0,
            offsetX: 0,
            offsetY: 10,
        },
    } = props

    const cardWidth = layoutGroup?.cardWidth ?? 200
    const cardHeight = layoutGroup?.cardHeight ?? 280
    const borderRadius = layoutGroup?.borderRadius ?? 16
    const curveIntensity = layoutGroup?.curveIntensity ?? 37.5
    const curveDirection = layoutGroup?.curveDirection ?? "up"
    const translateYMultiplier = layoutGroup?.translateYMultiplier ?? 1
    const rotationAngle = layoutGroup?.rotationAngle ?? 15
    const spacing = layoutGroup?.spacing ?? 20

    const isAutoPlay = autoPlayGroup?.autoPlay ?? true
    const autoPlayInterval = autoPlayGroup?.autoPlayInterval ?? 3
    const direction = autoPlayGroup?.direction ?? "left"
    const pauseOnHover = autoPlayGroup?.pauseOnHover ?? true

    const showArrows = navigationGroup?.showArrows ?? true
    const arrowColor = navigationGroup?.arrowColor ?? "#000000"
    const arrowSize = navigationGroup?.arrowSize ?? 40

    const childrenArray = Children.toArray(children)
    const totalCards = childrenArray.length

    const [dimensions, setDimensions] = useState({ width: 800, height: 400 })
    const [isHovered, setIsHovered] = useState(false)
    const [isVisible, setIsVisible] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const progress = useMotionValue(0)

    const bufferMultiplier = totalCards <= 3 ? 3 : 5
    const extendedChildren = Array(bufferMultiplier).fill(childrenArray).flat()

    const bufferOffsetMultiplier = Math.floor(bufferMultiplier / 2)

    useEffect(() => {
        if (
            !containerRef.current ||
            typeof IntersectionObserver === "undefined"
        )
            return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            { threshold: 0.1 }
        )

        observer.observe(containerRef.current)

        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!containerRef.current || typeof window === "undefined") return

        const updateDimensions = () => {
            if (containerRef.current) {
                startTransition(() => {
                    setDimensions({
                        width: containerRef.current.offsetWidth,
                        height: containerRef.current.offsetHeight,
                    })
                })
            }
        }

        updateDimensions()
        const resizeObserver = new ResizeObserver(updateDimensions)
        resizeObserver.observe(containerRef.current)

        return () => resizeObserver.disconnect()
    }, [])

    const stepSlide = (deltaIndex: number) => {
        if (totalCards <= 1) return

        const currentPos = progress.get()
        const baseIndex =
            deltaIndex > 0 ? Math.floor(currentPos) : Math.ceil(currentPos)
        const target = baseIndex + deltaIndex

        animate(progress, target, {
            type: "spring",
            stiffness: 220,
            damping: 26,
        })
    }

    useEffect(() => {
        if (!isAutoPlay || totalCards <= 1 || isStatic || !isVisible) return
        if (pauseOnHover && isHovered) return

        const stepDirection = direction === "left" ? 1 : -1
        const intervalMs = autoPlayInterval * 1000

        const interval = setInterval(() => {
            stepSlide(stepDirection)
        }, intervalMs)

        return () => clearInterval(interval)
    }, [
        isAutoPlay,
        autoPlayInterval,
        direction,
        pauseOnHover,
        isHovered,
        isVisible,
        totalCards,
        isStatic,
    ])

    useAnimationFrame(() => {
        if (isStatic || totalCards === 0) return

        let currentProgress = progress.get()

        if (currentProgress >= totalCards) {
            progress.set(currentProgress - totalCards)
        } else if (currentProgress < 0) {
            progress.set(currentProgress + totalCards)
        }
    })

    let responsiveCardWidth = cardWidth
    let responsiveCardHeight = cardHeight

    const maxWidthScale = dimensions.width * 0.8
    const maxHeightScale = dimensions.height * 0.9

    if (
        responsiveCardWidth > maxWidthScale ||
        responsiveCardHeight > maxHeightScale
    ) {
        const widthScale = maxWidthScale / responsiveCardWidth
        const heightScale = maxHeightScale / responsiveCardHeight
        const scale = Math.min(widthScale, heightScale)

        responsiveCardWidth = responsiveCardWidth * scale
        responsiveCardHeight = responsiveCardHeight * scale
    }

    const curveRadius = dimensions.width * (curveIntensity / 200)
    const horizontalPadding = responsiveCardWidth * 0.6
    const verticalPadding = responsiveCardHeight * 0.3

    if (isStatic) {
        return (
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {childrenArray.map((child, index) => {
                    const offset = index - Math.floor(totalCards / 2)
                    const angle = offset * spacing
                    const radian = (angle * Math.PI) / 180
                    const translateX = Math.sin(radian) * curveRadius
                    const translateY =
                        (curveDirection === "down" ? 1 : -1) *
                        (Math.cos(radian) - 1) *
                        curveRadius *
                        translateYMultiplier
                    const rotation = offset * rotationAngle

                    return (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                width: responsiveCardWidth,
                                height: responsiveCardHeight,
                                borderRadius,
                                boxShadow: `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`,
                                transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`,
                                overflow: "hidden",
                            }}
                        >
                            {child}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    width: "100%",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    padding: `${verticalPadding}px ${horizontalPadding}px`,
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {extendedChildren.map((child, index) => (
                        <CardItem
                            key={index}
                            child={child}
                            index={index}
                            totalCards={totalCards}
                            bufferOffsetMultiplier={bufferOffsetMultiplier}
                            progress={progress}
                            spacing={spacing}
                            curveRadius={curveRadius}
                            curveDirection={curveDirection}
                            translateYMultiplier={translateYMultiplier}
                            rotationAngle={rotationAngle}
                            cardWidth={responsiveCardWidth}
                            cardHeight={responsiveCardHeight}
                            borderRadius={borderRadius}
                            shadow={shadow}
                        />
                    ))}
                </div>

                {showArrows && totalCards > 1 && (
                    <>
                        <button
                            onClick={() => stepSlide(-1)}
                            style={{
                                position: "absolute",
                                left: Math.max(10, dimensions.width * 0.02),
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: arrowSize,
                                height: arrowSize,
                                borderRadius: "50%",
                                border: "none",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                color: arrowColor,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 1000,
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                            }}
                            aria-label="Previous slide"
                        >
                            <svg
                                width={arrowSize * 0.5}
                                height={arrowSize * 0.5}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>

                        <button
                            onClick={() => stepSlide(1)}
                            style={{
                                position: "absolute",
                                right: Math.max(10, dimensions.width * 0.02),
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: arrowSize,
                                height: arrowSize,
                                borderRadius: "50%",
                                border: "none",
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                color: arrowColor,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 1000,
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                            }}
                            aria-label="Next slide"
                        >
                            <svg
                                width={arrowSize * 0.5}
                                height={arrowSize * 0.5}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default CurvedSlider

function CardItem({
    child,
    index,
    totalCards,
    bufferOffsetMultiplier,
    progress,
    spacing,
    curveRadius,
    curveDirection,
    translateYMultiplier,
    rotationAngle,
    cardWidth,
    cardHeight,
    borderRadius,
    shadow,
}: any) {
    const cardRef = useRef<HTMLDivElement>(null)

    useAnimationFrame(() => {
        if (!cardRef.current) return

        const currentProgress = progress.get()
        const offset =
            index - (currentProgress + totalCards * bufferOffsetMultiplier)
        const absOffset = Math.abs(offset)

        const angle = offset * spacing
        const radian = (angle * Math.PI) / 180
        const translateX = Math.sin(radian) * curveRadius
        const translateY =
            (curveDirection === "down" ? 1 : -1) *
            (Math.cos(radian) - 1) *
            curveRadius *
            translateYMultiplier

        const rotation = offset * rotationAngle
        const scale = 1 - absOffset * 0.15

        const maxVisibleDistance = totalCards <= 3 ? 1.5 : 3.5
        const opacity =
            absOffset > maxVisibleDistance
                ? 0
                : Math.max(0, 1 - absOffset * 0.3)
        const zIndex = Math.round(1000 - absOffset * 10)

        cardRef.current.style.transform = `translate3d(${translateX}px, ${translateY}px, 0px) rotate(${rotation}deg) scale(${scale})`
        cardRef.current.style.opacity = `${opacity}`
        cardRef.current.style.zIndex = `${zIndex}`
        cardRef.current.style.visibility = opacity <= 0 ? "hidden" : "visible"
    })

    return (
        <div
            ref={cardRef}
            style={{
                position: "absolute",
                width: cardWidth,
                height: cardHeight,
                borderRadius: borderRadius,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`,
                willChange: "transform, opacity",
                overflow: "hidden",
            }}
        >
            <div style={{ width: "100%", height: "100%", objectFit: "cover" }}>
                {child}
            </div>
        </div>
    )
}

addPropertyControls(CurvedSlider, {
    children: {
        type: ControlType.Array,
        title: "Content",
        control: { type: ControlType.ComponentInstance },
    },

    layoutGroup: {
        type: ControlType.Object,
        title: "Layout & Arc",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 200,
                min: 50,
                max: 2000,
                step: 10,
                unit: "px",
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 280,
                min: 50,
                max: 2000,
                step: 10,
                unit: "px",
            },
            borderRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 16,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            curveIntensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 37.5,
                min: 10,
                max: 100,
                step: 1,
                unit: "%",
            },
            curveDirection: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["up", "down"],
                optionTitles: ["Up", "Down"],
                defaultValue: "up",
                displaySegmentedControl: true,
            },
            translateYMultiplier: {
                type: ControlType.Number,
                title: "Vertical Curve",
                defaultValue: 1,
                min: 0,
                max: 3,
                step: 0.1,
            },
            rotationAngle: {
                type: ControlType.Number,
                title: "Rotation",
                defaultValue: 15,
                min: 0,
                max: 45,
                step: 1,
                unit: "deg",
            },
            spacing: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 20,
                min: 5,
                max: 50,
                step: 1,
                unit: "deg",
            },
        },
    },

    autoPlayGroup: {
        type: ControlType.Object,
        title: "Auto Play",
        controls: {
            autoPlay: {
                type: ControlType.Boolean,
                title: "Enable",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            autoPlayInterval: {
                type: ControlType.Number,
                title: "Interval",
                defaultValue: 3,
                min: 1,
                max: 10,
                step: 0.5,
                unit: "s",
                hidden: ({ autoPlay }) => !autoPlay,
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "left",
                displaySegmentedControl: true,
                hidden: ({ autoPlay }) => !autoPlay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: ({ autoPlay }) => !autoPlay,
            },
        },
    },

    navigationGroup: {
        type: ControlType.Object,
        title: "Arrows",
        controls: {
            showArrows: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            arrowColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#000000",
                hidden: ({ showArrows }) => !showArrows,
            },
            arrowSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 40,
                min: 24,
                max: 80,
                step: 4,
                unit: "px",
                hidden: ({ showArrows }) => !showArrows,
            },
        },
    },

    shadow: {
        type: ControlType.Object,
        title: "Shadow",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(0, 0, 0, 0.2)",
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 30,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                defaultValue: 0,
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
            },
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                defaultValue: 0,
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                defaultValue: 10,
                min: -50,
                max: 50,
                step: 1,
                unit: "px",
            },
        },
    },
})
