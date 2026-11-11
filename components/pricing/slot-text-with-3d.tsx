import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function Slot_Text_with_3D(props) {
    const {
        text = "PORTFOLIO",
        link,
        openInNewTab = false,
        triggerMode = "Hover",
        noRepeat = false,
        cycles = 1,
        randomDigits = false,
        flipAxis = "Vertical (X)",
        doubleSides = false,
        randomDirection = false,
        inverseAnimation = false,
        easeType = "power3.inOut",
        layerDistance = 20,
        flipDuration = 0.5,
        staggerDelay = 0.04,
        textColor = "#1a1a1a",
        hoverColor = "#d32f2f",
        font, // Native Framer font object
        style,
    } = props

    const controls = useAnimation()

    // Check if component is rendered on Framer canvas (design mode)
    const isStatic = useIsStaticRenderer()

    // Local state to manage incoming face color smoothly
    const [isHovered, setIsHovered] = useState(false)

    // Extract properties from Framer's native font control with fallbacks
    const fontFamily = font?.fontFamily || "Inter, sans-serif"
    // Safe parsing to ensure fontSize is ALWAYS a number
    const rawFontSize = font?.fontSize || 110
    const parsedFontSize = parseFloat(rawFontSize.toString()) || 110

    const fontWeight = font?.fontWeight || 400
    const fontStyle = font?.fontStyle || "normal"
    const letterSpacing = font?.letterSpacing || 0
    const lineHeight = font?.lineHeight || 1
    const textAlign = font?.textAlign || "center"

    const safeLetterSpacing =
        typeof letterSpacing === "number"
            ? `${letterSpacing}px`
            : letterSpacing || "normal"

    // -----------------------------------------------------------------------
    // PRE-CALCULATE TOTAL CHARACTERS FOR "DOUBLE SIDES" SPLIT
    // -----------------------------------------------------------------------
    let totalCharsCount = 0
    text.split("\n").forEach((line) => {
        line.split(/(\s+)/).forEach((token) => {
            if (token) totalCharsCount += token.length
        })
    })

    const isOdd = totalCharsCount % 2 !== 0
    const centerIndex = Math.floor(totalCharsCount / 2)

    // -----------------------------------------------------------------------
    // SESSION CACHING & DERIVED STATE LOGIC
    // -----------------------------------------------------------------------
    const cacheKey = `slot3d-${encodeURIComponent(
        text.substring(0, 30)
    )}-${fontFamily.replace(/\s/g, "")}-${parsedFontSize}-${fontWeight}-${letterSpacing}`

    const [metricsState, setMetricsState] = useState(() => {
        let initialMetrics = {}
        if (typeof window !== "undefined") {
            try {
                const cached = sessionStorage.getItem(cacheKey)
                if (cached) initialMetrics = JSON.parse(cached)
            } catch (e) {}
        }
        return { key: cacheKey, metrics: initialMetrics }
    })

    if (metricsState.key !== cacheKey) {
        let updatedMetrics = {}
        if (typeof window !== "undefined") {
            try {
                const cached = sessionStorage.getItem(cacheKey)
                if (cached) updatedMetrics = JSON.parse(cached)
            } catch (e) {}
        }
        setMetricsState({ key: cacheKey, metrics: updatedMetrics })
    }

    const kerningMetrics = metricsState.metrics

    // -----------------------------------------------------------------------
    // MAGIC KERNING MEASUREMENT HOOK
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined")
            return

        if (Object.keys(kerningMetrics).length > 0) return

        let isMounted = true

        const measureKerning = async () => {
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready
            }

            if (!isMounted) return

            let globalIndex = 0
            const newMetrics = {}

            const container = document.createElement("div")
            container.style.position = "absolute"
            container.style.visibility = "hidden"
            container.style.pointerEvents = "none"
            container.style.opacity = "0"
            container.style.top = "-9999px"
            container.style.left = "-9999px"
            document.body.appendChild(container)

            const lines = text.split("\n")

            lines.forEach((line) => {
                if (!line) return

                const span = document.createElement("span")
                span.style.fontFamily = fontFamily
                span.style.fontSize = `${parsedFontSize}px`
                span.style.fontWeight = fontWeight.toString()
                span.style.fontStyle = fontStyle
                span.style.letterSpacing = safeLetterSpacing
                span.style.whiteSpace = "pre"
                span.innerText = line
                container.appendChild(span)

                const textNode = span.firstChild
                if (textNode && textNode.textContent) {
                    const range = document.createRange()
                    const len = textNode.textContent.length

                    for (let i = 0; i < len; i++) {
                        range.setStart(textNode, i)
                        range.setEnd(textNode, i + 1)
                        const rect1 = range.getBoundingClientRect()

                        let marginRight = 0

                        if (i < len - 1) {
                            range.setStart(textNode, i + 1)
                            range.setEnd(textNode, i + 2)
                            const rect2 = range.getBoundingClientRect()
                            marginRight =
                                rect2.left - (rect1.left + rect1.width)
                        }

                        newMetrics[globalIndex] = {
                            width: rect1.width,
                            marginRight: marginRight,
                        }
                        globalIndex++
                    }
                }
                container.removeChild(span)
            })

            document.body.removeChild(container)

            if (isMounted) {
                setMetricsState({ key: cacheKey, metrics: newMetrics })
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify(newMetrics))
                } catch (e) {}
            }
        }

        measureKerning()

        return () => {
            isMounted = false
        }
    }, [
        text,
        fontFamily,
        parsedFontSize,
        fontWeight,
        fontStyle,
        letterSpacing,
        cacheKey,
        kerningMetrics,
        safeLetterSpacing,
    ])

    // -----------------------------------------------------------------------
    // ANIMATION & DOM REFS
    // -----------------------------------------------------------------------
    const isAnimating = useRef(false)
    const hasPlayed = useRef(false)
    const outgoingRefs = useRef([])
    const incomingRefs = useRef([])
    const timers = useRef({ intervals: [], timeouts: [] })

    useEffect(() => {
        return () => {
            timers.current.intervals.forEach(clearInterval)
            timers.current.timeouts.forEach(clearTimeout)
        }
    }, [])

    const flexAlignment =
        textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center"

    const easeMapping = {
        "power1.inOut": "easeInOut",
        "power2.inOut": [0.45, 0, 0.55, 1],
        "power3.inOut": [0.65, 0, 0.35, 1],
        "back.inOut(1.5)": [0.68, -0.6, 0.32, 1.6],
        "elastic.inOut(1, 0.5)": [0.68, -0.55, 0.27, 1.55],
    }

    const activeEase = easeMapping[easeType] || "easeInOut"
    const activeCycles = triggerMode === "On View" ? cycles : 1
    const isHorizontal = flipAxis === "Horizontal (Y)"

    const playEntrance = async () => {
        if (isStatic || isAnimating.current) return
        if (triggerMode === "On View" && noRepeat && hasPlayed.current) return

        isAnimating.current = true

        if (randomDigits && triggerMode === "On View") {
            incomingRefs.current.forEach((el, index) => {
                if (!el) return
                const originalText = el.getAttribute("data-char")
                if (!originalText || originalText.trim() === "") return

                const delayMs = index * staggerDelay * 1000
                const durationMs = flipDuration * activeCycles * 1000

                const startTimeout = setTimeout(() => {
                    const interval = setInterval(() => {
                        const randomNum = Math.floor(
                            Math.random() * 10
                        ).toString()
                        if (outgoingRefs.current[index]) {
                            outgoingRefs.current[index].innerText = randomNum
                        }
                        el.innerText = randomNum
                    }, 40)

                    timers.current.intervals.push(interval)

                    const stopTimeout = setTimeout(() => {
                        clearInterval(interval)
                        if (outgoingRefs.current[index]) {
                            outgoingRefs.current[index].innerText = originalText
                        }
                        el.innerText = originalText
                    }, durationMs)

                    timers.current.timeouts.push(stopTimeout)
                }, delayMs)

                timers.current.timeouts.push(startTimeout)
            })
        }

        await controls.set("initial")
        await controls.start("animate")

        isAnimating.current = false
        hasPlayed.current = true
    }

    // Dynamic variants using custom props to support per-character directions and axis
    const outgoingVariants = {
        initial: { x: "0em", y: "0em", rotateX: 0, rotateY: 0, opacity: 1 },
        animate: ({ i, cycles, dir, isHorizontal }) => {
            const translateDist = -layerDistance * dir * 0.01
            return {
                x: isHorizontal ? `${translateDist}em` : "0em",
                y: !isHorizontal ? `${translateDist}em` : "0em",
                rotateX: !isHorizontal ? 90 * dir : 0,
                rotateY: isHorizontal ? 90 * dir : 0,
                opacity: 0,
                transition: {
                    duration: flipDuration,
                    ease: activeEase,
                    delay: i * staggerDelay,
                    repeat: cycles - 1,
                    repeatType: "loop",
                },
            }
        },
    }

    const incomingVariants = {
        initial: ({ dir, isHorizontal }) => {
            const translateDist = layerDistance * dir * 0.01
            return {
                x: isHorizontal ? `${translateDist}em` : "0em",
                y: !isHorizontal ? `${translateDist}em` : "0em",
                rotateX: !isHorizontal ? -90 * dir : 0,
                rotateY: isHorizontal ? -90 * dir : 0,
                opacity: 0,
            }
        },
        animate: ({ i, cycles, dir, isHorizontal }) => ({
            x: "0em",
            y: "0em",
            rotateX: 0,
            rotateY: 0,
            opacity: 1,
            transition: {
                duration: flipDuration,
                ease: activeEase,
                delay: i * staggerDelay,
                repeat: cycles - 1,
                repeatType: "loop",
            },
        }),
    }

    const lines = text.split("\n")
    const Component = link ? motion.a : motion.div
    let globalCharIndex = 0

    return (
        <Component
            href={link && !isStatic ? link : undefined}
            target={link && openInNewTab && !isStatic ? "_blank" : undefined}
            rel={
                link && openInNewTab && !isStatic
                    ? "noopener noreferrer"
                    : undefined
            }
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                alignItems: flexAlignment,
                justifyContent: "center",
                width: "100%",
                height: "auto",
                background: "transparent",
                perspective: "1000px",
                transformStyle: "preserve-3d",
                textDecoration: "none",
                cursor: link && !isStatic ? "pointer" : "default",
                color: textColor,
            }}
            onMouseEnter={() => {
                setIsHovered(true)
                if (triggerMode === "Hover" && !isStatic) playEntrance()
            }}
            onMouseLeave={() => {
                setIsHovered(false)
            }}
            onViewportEnter={
                triggerMode === "On View" && !isStatic
                    ? playEntrance
                    : undefined
            }
            viewport={{ once: false, margin: "-30% 0px -30% 0px" }}
            initial={!isStatic ? "initial" : false}
            animate={!isStatic ? controls : false}
        >
            {lines.map((line, lineIndex) => (
                <div
                    key={lineIndex}
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: flexAlignment,
                        width: "100%",
                        transformStyle: "preserve-3d",
                    }}
                >
                    {line.split(/(\s+)/).map((token, tokenIndex) => {
                        if (!token) return null
                        return (
                            <div
                                key={`${lineIndex}-${tokenIndex}`}
                                style={{
                                    display: "flex",
                                    whiteSpace: "nowrap",
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                {token.split("").map((char, charIndex) => {
                                    const currentIndex = globalCharIndex++

                                    const metrics = kerningMetrics[
                                        currentIndex
                                    ] || { width: "auto", marginRight: 0 }
                                    const hasMetrics = metrics.width !== "auto"

                                    const currentLetterSpacing = hasMetrics
                                        ? "normal"
                                        : safeLetterSpacing

                                    const isSpace = char.trim() === ""
                                    const displayChar = isSpace
                                        ? "\u00A0"
                                        : char

                                    // Determine direction and stagger for this specific character
                                    let charDir = inverseAnimation ? -1 : 1
                                    let staggerIndex = currentIndex

                                    if (randomDirection) {
                                        const rand =
                                            Math.sin(currentIndex * 12.9898) *
                                            43758.5453
                                        charDir =
                                            rand - Math.floor(rand) > 0.5
                                                ? charDir
                                                : -charDir
                                    } else if (doubleSides) {
                                        const belongsToLeft = isOdd
                                            ? currentIndex <= centerIndex
                                            : currentIndex < centerIndex

                                        if (belongsToLeft) {
                                            charDir = charDir
                                            staggerIndex = currentIndex
                                        } else {
                                            charDir = -charDir
                                            // Invert the stagger delay so both sides meet in the middle simultaneously
                                            staggerIndex =
                                                totalCharsCount -
                                                1 -
                                                currentIndex
                                        }
                                    }

                                    const customParams = {
                                        i: staggerIndex,
                                        cycles: activeCycles,
                                        dir: charDir,
                                        isHorizontal: isHorizontal,
                                    }

                                    return (
                                        <div
                                            key={`${lineIndex}-${tokenIndex}-${charIndex}`}
                                            style={{
                                                position: "relative",
                                                display: "inline-block",
                                                width: hasMetrics
                                                    ? `${metrics.width}px`
                                                    : "auto",
                                                marginRight: hasMetrics
                                                    ? `${metrics.marginRight}px`
                                                    : 0,
                                                transformStyle: "preserve-3d",
                                            }}
                                        >
                                            {/* Outgoing Layer */}
                                            <motion.span
                                                ref={(el) =>
                                                    (outgoingRefs.current[
                                                        currentIndex
                                                    ] = el)
                                                }
                                                data-char={displayChar}
                                                custom={customParams}
                                                variants={
                                                    !isStatic
                                                        ? outgoingVariants
                                                        : {}
                                                }
                                                style={{
                                                    display: "inline-block",
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    width: "100%",
                                                    textAlign: "center",
                                                    color: textColor,
                                                    fontSize: parsedFontSize,
                                                    fontWeight: fontWeight,
                                                    fontStyle: fontStyle,
                                                    fontFamily: fontFamily,
                                                    fontKerning: "normal",
                                                    letterSpacing:
                                                        currentLetterSpacing,
                                                    lineHeight: lineHeight,
                                                    transformOrigin: `50% 50% -${
                                                        parsedFontSize * 0.4
                                                    }px`,
                                                    zIndex: 1,
                                                    opacity: isStatic
                                                        ? 0
                                                        : undefined,
                                                }}
                                            >
                                                {displayChar}
                                            </motion.span>

                                            {/* Incoming Layer */}
                                            <motion.span
                                                ref={(el) =>
                                                    (incomingRefs.current[
                                                        currentIndex
                                                    ] = el)
                                                }
                                                data-char={displayChar}
                                                custom={customParams}
                                                variants={
                                                    !isStatic
                                                        ? incomingVariants
                                                        : {}
                                                }
                                                style={{
                                                    display: "inline-block",
                                                    position: "relative",
                                                    width: "100%",
                                                    textAlign: "center",
                                                    color:
                                                        isHovered &&
                                                        triggerMode ===
                                                            "Hover" &&
                                                        !isStatic
                                                            ? hoverColor
                                                            : textColor,
                                                    transition:
                                                        "color 0.3s ease",
                                                    fontSize: parsedFontSize,
                                                    fontWeight: fontWeight,
                                                    fontStyle: fontStyle,
                                                    fontFamily: fontFamily,
                                                    fontKerning: "normal",
                                                    letterSpacing:
                                                        currentLetterSpacing,
                                                    lineHeight: lineHeight,
                                                    transformOrigin: `50% 50% -${
                                                        parsedFontSize * 0.4
                                                    }px`,
                                                    zIndex: 3,
                                                    opacity: isStatic
                                                        ? 1
                                                        : undefined,
                                                }}
                                            >
                                                {displayChar}
                                            </motion.span>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            ))}
        </Component>
    )
}

function createFontControl(defaultValue: object): ControlType {
    return "font" as unknown as ControlType
}

// Framer Property Controls Setup
addPropertyControls(Slot_Text_with_3D, {
    text: {
        type: ControlType.String,
        defaultValue: "PORTFOLIO",
        title: "Text",
        displayTextArea: true,
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "New Tab",
        hidden(props) {
            return !props.link
        },
    },
    textColor: {
        type: ControlType.Color,
        defaultValue: "#1a1a1a",
        title: "Text Color",
    },
    hoverColor: {
        type: ControlType.Color,
        defaultValue: "#4D4D4D",
        title: "Hover Color",
        hidden(props) {
            return props.triggerMode !== "Hover"
        },
    },
    font: {
        type: createFontControl({}),
        controls: "extended",
        title: "Typography",
        defaultValue: {
            fontFamily: "Inter, sans-serif",
            fontSize: 110,
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: 1,
            textAlign: "center",
        },
    } as any,
    triggerMode: {
        type: ControlType.Enum,
        options: ["Hover", "On View"],
        defaultValue: "Hover",
        title: "Trigger",
    },
    noRepeat: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "No Repeat",
        hidden(props) {
            return props.triggerMode !== "On View"
        },
    },
    cycles: {
        type: ControlType.Number,
        defaultValue: 1,
        title: "Cycles",
        min: 1,
        max: 5,
        step: 1,
        displayStepper: true,
        hidden(props) {
            return props.triggerMode !== "On View"
        },
    },
    randomDigits: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "Random Digits",
        hidden(props) {
            return props.triggerMode !== "On View"
        },
    },
    flipAxis: {
        type: ControlType.Enum,
        options: ["Vertical (X)", "Horizontal (Y)"],
        defaultValue: "Vertical (X)",
        title: "Axis",
    },
    doubleSides: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "Double Sides",
        hidden(props) {
            return props.randomDirection === true
        },
    },
    randomDirection: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "Random Dir",
    },
    inverseAnimation: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "Inverse Anim",
    },
    easeType: {
        type: ControlType.Enum,
        options: [
            "power1.inOut",
            "power2.inOut",
            "power3.inOut",
            "back.inOut(1.5)",
            "elastic.inOut(1, 0.5)",
        ],
        defaultValue: "power3.inOut",
        title: "Easing",
    },
    layerDistance: {
        type: ControlType.Number,
        defaultValue: 20,
        title: "Distance Y (%)",
        min: 1,
        max: 50,
    },
    flipDuration: {
        type: ControlType.Number,
        defaultValue: 0.5,
        title: "Duration",
        step: 0.05,
        min: 0.1,
        max: 2,
    },
    staggerDelay: {
        type: ControlType.Number,
        defaultValue: 0.04,
        title: "Stagger",
        step: 0.01,
        min: 0.0,
        max: 0.2,
    },
})
