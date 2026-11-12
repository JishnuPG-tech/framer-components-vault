import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type FontSettings = {
    fontFamily: string
    fontWeight: number | string
    fontSize: number
    fontStyle: string
    letterSpacing: number
    lineHeight: number
    color: string
    textAlign?: "left" | "center" | "right" | "justify"
}

type LetterRect = {
    width: number
    height: number
    left: number
    top: number
}

type Dot = {
    id: string
    letterIndex: number
    x: number
    y: number
    startX: number
    startY: number
    angle: number
    speed: number
    distanceMoved: number
    radius: number
    opacity: number
    isFlyingAway: boolean
    flyAngle: number
    flySpeed: number
    flyDistance: number
}

type SecretDotsProps = {
    text: string
    font: FontSettings
    textColor: string
    dotColor: string
    maxDotRadius: number
    minDotRadius: number
    maxDistance: number
    speedMin: number
    speedMax: number
    dotsPerLetter: number
    htmlTag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 100
 *
 * @framerDisableUnlink
 */
export default function Spoiler(props: SecretDotsProps) {
    const {
        text: rawText,
        font,
        textColor,
        dotColor,
        maxDotRadius,
        minDotRadius,
        maxDistance,
        speedMin,
        speedMax,
        dotsPerLetter,
        htmlTag = "div",
        style,
    } = props
    // Convert \n from Framer to actual line break characters
    const text = rawText.replace(/\\n/g, "\n")

    const isOnCanvas = useIsOnFramerCanvas()
    const [isVisible, setIsVisible] = React.useState<boolean>(isOnCanvas)
    const [isTransitioning, setIsTransitioning] = React.useState<boolean>(false)
    const [dots, setDots] = React.useState<Dot[]>([])
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const letterRefs = React.useRef<Array<React.RefObject<HTMLSpanElement>>>([])
    const [letterRects, setLetterRects] = React.useState<LetterRect[]>([])
    const initialLoad = React.useRef<boolean>(true)

    // Maintain refs for each character
    if (letterRefs.current.length !== text.replace(/\n/g, "").length) {
        letterRefs.current = Array(text.replace(/\n/g, "").length)
            .fill(null)
            .map((_, i) => letterRefs.current[i] || React.createRef())
    }

    React.useLayoutEffect(() => {
        const rects: LetterRect[] = letterRefs.current.map((ref) => {
            if (!ref.current) return { width: 0, height: 0, left: 0, top: 0 }
            const r = ref.current.getBoundingClientRect()
            return {
                width: r.width,
                height: r.height,
                left: r.left,
                top: r.top,
            }
        })
        setLetterRects(rects)
    }, [text, font.fontSize])

    const MAX_DOTS_PER_LETTER = dotsPerLetter

    const initDots = React.useCallback(() => {
        const newDots: Dot[] = []
        let charIndex = 0
        text.split("").forEach((char) => {
            if (char === "\n") return

            const rect = letterRects[charIndex]
            if (!rect) {
                charIndex++
                return
            }

            if (char === " ") {
                charIndex++
                return
            }

            for (let i = 0; i < MAX_DOTS_PER_LETTER; i++) {
                if (rect.width === 0 || rect.height === 0) continue
                const x = Math.random() * rect.width
                const y = rect.height * (0.45 + Math.random() * 0.1)
                const angle = Math.random() * 2 * Math.PI
                const speed = speedMin + Math.random() * (speedMax - speedMin)
                newDots.push({
                    id: `${charIndex}-${i}-${Date.now()}`,
                    letterIndex: charIndex,
                    x,
                    y,
                    startX: x,
                    startY: y,
                    angle,
                    speed: Number(speed),
                    distanceMoved: 0,
                    radius: Number(maxDotRadius),
                    opacity: 1,
                    isFlyingAway: false,
                    flyAngle: 0,
                    flySpeed: 0,
                    flyDistance: 0,
                })
            }
            charIndex++
        })
        setDots(newDots)
    }, [
        letterRects,
        maxDotRadius,
        speedMin,
        speedMax,
        MAX_DOTS_PER_LETTER,
        text,
    ])

    React.useEffect(() => {
        if (initialLoad.current && !isVisible && letterRects.length > 0) {
            initDots()
            initialLoad.current = false
        }
    }, [letterRects, isVisible, initDots])

    React.useEffect(() => {
        let animationFrameId: number
        const animate = () => {
            if (dots.length === 0) {
                cancelAnimationFrame(animationFrameId)
                return
            }
            setDots((prevDots: Dot[]) => {
                const newDots = prevDots
                    .map((dot): Dot | null => {
                        if (dot.isFlyingAway) {
                            const dx = Math.cos(dot.flyAngle) * dot.flySpeed
                            const dy = Math.sin(dot.flyAngle) * dot.flySpeed
                            const newX = dot.x + dx
                            const newY = dot.y + dy
                            const newFlyDistance =
                                dot.flyDistance + dot.flySpeed
                            const newOpacity = 1 - newFlyDistance / 150
                            if (newOpacity <= 0) return null
                            return {
                                ...dot,
                                x: newX,
                                y: newY,
                                flyDistance: newFlyDistance,
                                opacity: newOpacity,
                                radius: dot.radius * Math.max(0, newOpacity),
                            }
                        } else {
                            const dx = Math.cos(dot.angle) * dot.speed
                            const dy = Math.sin(dot.angle) * dot.speed
                            const newX = dot.x + dx
                            const newY = dot.y + dy
                            const dist =
                                dot.distanceMoved + Math.sqrt(dx * dx + dy * dy)
                            let newRadius =
                                maxDotRadius -
                                (dist / maxDistance) *
                                    (maxDotRadius - minDotRadius)
                            if (newRadius < minDotRadius)
                                newRadius = minDotRadius
                            let newOpacity = 1 - dist / maxDistance
                            if (newOpacity < 0) newOpacity = 0
                            if (dist >= maxDistance) {
                                const rect = letterRects[dot.letterIndex]
                                if (!rect) return dot // Return if rect doesn't exist
                                const resetX = Math.random() * rect.width
                                const resetY =
                                    rect.height * (0.45 + Math.random() * 0.1)
                                const resetAngle = Math.random() * 2 * Math.PI
                                const resetSpeed =
                                    speedMin +
                                    Math.random() * (speedMax - speedMin)
                                return {
                                    ...dot,
                                    x: resetX,
                                    y: resetY,
                                    startX: resetX,
                                    startY: resetY,
                                    angle: resetAngle,
                                    speed: Number(resetSpeed),
                                    distanceMoved: 0,
                                    radius: Number(maxDotRadius),
                                    opacity: 1,
                                }
                            }
                            return {
                                ...dot,
                                x: newX,
                                y: newY,
                                distanceMoved: dist,
                                radius: newRadius,
                                opacity: newOpacity,
                            }
                        }
                    })
                    .filter(Boolean) as Dot[]
                return newDots
            })
            animationFrameId = requestAnimationFrame(animate)
        }
        animationFrameId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrameId)
    }, [
        dots.length,
        maxDotRadius,
        minDotRadius,
        maxDistance,
        speedMin,
        speedMax,
    ])

    const onDotClick = (dotId: string) => {
        setDots((prevDots: Dot[]) =>
            prevDots.map((dot: Dot) =>
                dot.id === dotId
                    ? {
                          ...dot,
                          isFlyingAway: true,
                          flyAngle: Math.random() * 2 * Math.PI,
                          flySpeed: 3 + Math.random() * 2,
                          flyDistance: 0,
                      }
                    : dot
            )
        )
    }

    const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
        // Execute only when color transition ends and text is not visible
        if (e.propertyName === "color" && !isVisible) {
            initDots()
            setIsTransitioning(false)
        }
    }

    const handleContainerClick = () => {
        if (isTransitioning) return

        if (isVisible) {
            setIsTransitioning(true)
            setIsVisible(false) // This triggers the onTransitionEnd event
        } else {
            setIsTransitioning(true)
            setDots((prevDots: Dot[]) =>
                prevDots.map((dot: Dot) => ({
                    ...dot,
                    isFlyingAway: true,
                    flyAngle: Math.random() * 2 * Math.PI,
                    flySpeed: 2 + Math.random() * 3,
                    flyDistance: 0,
                }))
            )
            setTimeout(() => {
                setIsVisible(true)
                // Remove dots after text fade-in time (400ms)
                setTimeout(() => {
                    setDots([])
                    setIsTransitioning(false)
                }, 400)
            }, 100)
        }
    }

    // Rendering logic
    const renderTextWithLineBreaks = () => {
        let charIndex = 0
        return text.split("\n").map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
                {line.split("").map((char) => {
                    const currentIndex = charIndex
                    charIndex++
                    return (
                        <span
                            key={currentIndex}
                            ref={letterRefs.current[currentIndex]}
                            style={{
                                position: "relative",
                                display: "inline-block",
                            }}
                        >
                            {char}
                            {dots
                                .filter(
                                    (d: Dot) => d.letterIndex === currentIndex
                                )
                                .map(({ x, y, radius, opacity, id }) => (
                                    <div
                                        key={id}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDotClick(id)
                                        }}
                                        onTouchEnd={(e) => {
                                            e.stopPropagation()
                                            onDotClick(id)
                                        }}
                                        style={{
                                            position: "absolute",
                                            pointerEvents: "auto",
                                            top: y,
                                            left: x,
                                            width: radius * 2,
                                            height: radius * 2,
                                            borderRadius: "50%",
                                            backgroundColor: dotColor,
                                            opacity: opacity,
                                            transform: `translate(-50%, -50%)`,
                                            zIndex: 10,
                                            cursor: "pointer",
                                        }}
                                    />
                                ))}
                        </span>
                    )
                })}
                {lineIndex < text.split("\n").length - 1 && <br />}
            </React.Fragment>
        ))
    }

    const Tag = htmlTag as any

    return (
        <Tag
            ref={containerRef}
            onClick={handleContainerClick}
            onTouchEnd={handleContainerClick}
            onTransitionEnd={handleTransitionEnd}
            style={{
                ...style,
                position: "relative",
                display: "inline-block",
                fontSize: font.fontSize,
                fontWeight: font.fontWeight,
                fontFamily: font.fontFamily,
                fontStyle: font.fontStyle,
                letterSpacing: font.letterSpacing,
                lineHeight: font.lineHeight,
                color: isVisible ? textColor : "transparent",
                userSelect: "none",
                whiteSpace: "pre-wrap",
                cursor: "pointer",
                transition: "color 0.4s ease-in-out",
                textAlign: font.textAlign, // Use textAlign from font prop
            }}
            title="Click to toggle text visibility"
        >
            {renderTextWithLineBreaks()}
        </Tag>
    )
}

addPropertyControls(Spoiler as any, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hello World!",
        multiline: true,
    },
    htmlTag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "P", "Span"],
        defaultValue: "span",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: 48,
            fontStyle: "normal",
            letterSpacing: 0,
            lineHeight: 1.2,
            color: "#000000",
            textAlign: "left",
        },
        displayTextAlignment: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Font Color",
        defaultValue: "#000000",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Particle Color",
        defaultValue: "#000000",
    },
    minDotRadius: {
        type: ControlType.Number,
        title: "Particle Size(Min)",
        defaultValue: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    maxDotRadius: {
        type: ControlType.Number,
        title: "Particle Size(Max)",
        defaultValue: 8,
        min: 1,
        max: 20,
    },
    speedMin: {
        type: ControlType.Number,
        title: "Particle Speed(Min)",
        defaultValue: 0.5,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    speedMax: {
        type: ControlType.Number,
        title: "Particle Speed(Max)",
        defaultValue: 2.5,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    dotsPerLetter: {
        type: ControlType.Number,
        title: "Particle Amount",
        defaultValue: 5,
        min: 1,
        max: 20,
        step: 1,
    },
    maxDistance: {
        type: ControlType.Number,
        title: "Particle Distance",
        defaultValue: 50,
        min: 10,
        max: 300,
        description:
            "Explore more components at [THE DESIGN FUTURIST](https://thedesignfuturist.zip)",
    },
})

// Alias for Framer compatibility
export const SecretDots = Spoiler
