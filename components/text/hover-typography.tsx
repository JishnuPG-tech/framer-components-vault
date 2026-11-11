import * as React from "react"
import { useRef, useEffect, useCallback, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function MagneticTypography(incomingProps) {
    // STEP 1: Intercept & Flatten
    const props = {
        ...incomingProps,
        ...(incomingProps.interaction || {}),
    }

    const {
        text,
        textColor,
        hoverColor,
        textFont,
        alignment,
        entryAnimation,
        radius,
        minWeight,
        maxWeight,
        minWidth,
        maxWidth,
        popScale,
        waveY,
        skewIntensity,
        lerpSpeed,
    } = props

    const containerRef = useRef(null)
    const charsRef = useRef([])
    const charDataRef = useRef([])
    const linesRef = useRef([])
    const rafId = useRef(null)

    // Track mouse & velocity physics
    const mouseRef = useRef({
        x: -1000,
        y: -1000,
        vx: 0,
        lastTime: 0,
        isHovered: false,
    })

    // Respect user OS motion settings
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        setPrefersReducedMotion(mediaQuery.matches)
        const onChange = () => setPrefersReducedMotion(mediaQuery.matches)
        mediaQuery.addEventListener("change", onChange)
        return () => mediaQuery.removeEventListener("change", onChange)
    }, [])

    let globalIndex = 0
    const tokens = (text || "").split(/(\s+)/)

    // The core 60FPS physics loop (Zero Garbage Collection)
    const renderLoop = useCallback(() => {
        if (!containerRef.current || prefersReducedMotion) return

        const { x: mouseX, y: mouseY, isHovered } = mouseRef.current
        let isMoving = false // Used for sleep culling

        // Decay velocity
        mouseRef.current.vx *= 0.9
        const globalSkew = mouseRef.current.vx * skewIntensity

        // Step A: Calculate targets
        charsRef.current.forEach((node, i) => {
            if (!node || !charDataRef.current[i]) return
            const data = charDataRef.current[i]

            // Default Resting States
            data.targetW = minWeight
            data.targetWd = minWidth
            data.targetS = 1
            data.targetTY = 0
            data.targetIntensity = 0
            data.targetSkew = 0

            if (isHovered) {
                const dx = mouseX - data.cx
                const dy = mouseY - data.cy
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < radius) {
                    const intensity = 1 - dist / radius
                    const ease = 1 - Math.pow(1 - intensity, 3)

                    data.targetW = minWeight + (maxWeight - minWeight) * ease
                    data.targetWd = minWidth + (maxWidth - minWidth) * ease
                    data.targetS = 1 + popScale * ease
                    data.targetTY = -waveY * ease
                    data.targetIntensity = ease
                    data.targetSkew = globalSkew * ease
                }
            }
        })

        // Step B: Calculate Exact Physical TX Gaps
        linesRef.current.forEach((line) => {
            let totalExpansion = 0
            line.forEach((i) => {
                const data = charDataRef.current[i]
                if (data && data.origWidth) {
                    totalExpansion += data.origWidth * (data.targetS - 1)
                }
            })

            // Adjust starting shift based on alignment preference
            let currentShift = 0
            if (alignment === "center") currentShift = -totalExpansion / 2
            else if (alignment === "right") currentShift = -totalExpansion

            line.forEach((i) => {
                const data = charDataRef.current[i]
                if (data && data.origWidth) {
                    const charExpansion = data.origWidth * (data.targetS - 1)
                    data.targetTX = currentShift + charExpansion / 2
                    currentShift += charExpansion
                }
            })
        })

        // Step C: Lerp & Apply (Direct DOM Mutation)
        charsRef.current.forEach((node, i) => {
            if (!node || !charDataRef.current[i]) return
            const data = charDataRef.current[i]

            // Lerp math
            data.currentW += (data.targetW - data.currentW) * lerpSpeed
            data.currentWd += (data.targetWd - data.currentWd) * lerpSpeed
            data.currentS += (data.targetS - data.currentS) * lerpSpeed
            data.currentTX += (data.targetTX - data.currentTX) * lerpSpeed
            data.currentTY += (data.targetTY - data.currentTY) * lerpSpeed
            data.currentIntensity +=
                (data.targetIntensity - data.currentIntensity) * lerpSpeed
            data.currentSkew += (data.targetSkew - data.currentSkew) * lerpSpeed

            // Check if we need to keep rendering
            const wDiff = Math.abs(data.targetW - data.currentW)
            const txDiff = Math.abs(data.targetTX - data.currentTX)
            if (
                wDiff > 0.5 ||
                txDiff > 0.1 ||
                Math.abs(mouseRef.current.vx) > 0.1
            ) {
                isMoving = true
            }

            // Apply via CSS Variables & Transforms
            node.style.fontVariationSettings = `"wght" ${data.currentW}, "wdth" ${data.currentWd}`
            node.style.transform = `translate(${data.currentTX}px, ${data.currentTY}px) scale(${data.currentS}) skewX(${data.currentSkew}deg)`
            node.style.setProperty("--intensity", data.currentIntensity)
        })

        // Step D: Sleep Culling (Stop RAF if completely at rest)
        if (isMoving || isHovered) {
            rafId.current = requestAnimationFrame(renderLoop)
        } else {
            rafId.current = null
        }
    }, [
        radius,
        minWeight,
        maxWeight,
        minWidth,
        maxWidth,
        popScale,
        waveY,
        skewIntensity,
        lerpSpeed,
        alignment,
        prefersReducedMotion,
    ])

    const startLoop = useCallback(() => {
        if (!rafId.current && !prefersReducedMotion) {
            rafId.current = requestAnimationFrame(renderLoop)
        }
    }, [renderLoop, prefersReducedMotion])

    // Initialization & Layout Measurement
    useEffect(() => {
        charsRef.current = charsRef.current.slice(0, globalIndex)
        charDataRef.current = charDataRef.current.slice(0, globalIndex)

        const updatePositions = () => {
            if (!containerRef.current) return

            // 1. Temporarily remove transforms to measure pure layout
            const currentTransforms = charsRef.current.map((el) =>
                el ? el.style.transform : ""
            )
            charsRef.current.forEach((el) => {
                if (el) {
                    el.style.transform = "none"
                    el.style.fontVariationSettings = `"wght" ${minWeight}, "wdth" ${minWidth}`
                }
            })

            void containerRef.current.offsetHeight

            // 2. Measure & Group
            linesRef.current = []
            let currentLine = []
            let prevData = null

            charsRef.current.forEach((el, i) => {
                if (!el) return
                const rect = el.getBoundingClientRect()

                // Initialize or preserve data mapping
                // (Entry animation logic cascades staggered Y & Scale values)
                if (!charDataRef.current[i]) {
                    charDataRef.current[i] = {
                        currentW: minWeight,
                        currentWd: minWidth,
                        currentS: entryAnimation ? 0.2 : 1,
                        currentTX: 0,
                        currentTY: entryAnimation ? 40 + i * 2 : 0,
                        currentIntensity: 0,
                        currentSkew: 0,
                        targetW: minWeight,
                        targetWd: minWidth,
                        targetS: 1,
                        targetTX: 0,
                        targetTY: 0,
                        targetIntensity: 0,
                        targetSkew: 0,
                        origWidth: 0,
                        origHeight: 0,
                        cx: 0,
                        cy: 0,
                    }
                }

                const data = charDataRef.current[i]
                data.origWidth = rect.width
                data.origHeight = rect.height
                data.cx = rect.left + rect.width / 2
                data.cy = rect.top + rect.height / 2

                if (prevData) {
                    const threshold = data.origHeight * 0.5
                    const isNewLine =
                        data.cy - prevData.cy > threshold ||
                        data.cx < prevData.cx - threshold
                    if (isNewLine) {
                        linesRef.current.push(currentLine)
                        currentLine = []
                    }
                }
                currentLine.push(i)
                prevData = data
            })

            if (currentLine.length > 0) linesRef.current.push(currentLine)

            // 3. Restore transforms
            charsRef.current.forEach((el, i) => {
                if (el) el.style.transform = currentTransforms[i]
            })

            // 4. Trigger initial loop to resolve entry animations or immediate states
            startLoop()
        }

        const timeout = setTimeout(updatePositions, 50)
        window.addEventListener("resize", updatePositions)
        window.addEventListener("scroll", updatePositions, { passive: true })

        return () => {
            clearTimeout(timeout)
            window.removeEventListener("resize", updatePositions)
            window.removeEventListener("scroll", updatePositions)
        }
    }, [
        text,
        textFont,
        alignment,
        minWeight,
        minWidth,
        entryAnimation,
        globalIndex,
        startLoop,
    ])

    // Gyroscope Mobile Parity
    useEffect(() => {
        const handleOrientation = (e) => {
            if (!e.beta || !e.gamma || prefersReducedMotion) return
            // Map gamma (-90 to 90) and beta (-180 to 180) to screen coordinates
            const x =
                (e.gamma / 90) * (window.innerWidth / 2) + window.innerWidth / 2
            const y =
                (e.beta / 90) * (window.innerHeight / 2) +
                window.innerHeight / 2

            mouseRef.current.x = x
            mouseRef.current.y = y
            mouseRef.current.isHovered = true
            startLoop()
        }
        window.addEventListener("deviceorientation", handleOrientation)
        return () =>
            window.removeEventListener("deviceorientation", handleOrientation)
    }, [startLoop, prefersReducedMotion])

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (rafId.current) cancelAnimationFrame(rafId.current)
        }
    }, [])

    const handlePointerMove = (e) => {
        const now = performance.now()
        const dt = Math.max(1, now - mouseRef.current.lastTime)
        const dx = e.clientX - mouseRef.current.x

        mouseRef.current.vx = dx / dt
        mouseRef.current.x = e.clientX
        mouseRef.current.y = e.clientY
        mouseRef.current.lastTime = now
        mouseRef.current.isHovered = true
        startLoop()
    }

    const handlePointerLeave = () => {
        mouseRef.current.isHovered = false
        startLoop()
    }

    return (
        <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            aria-label={text} // Screen reader sees whole text block perfectly
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems:
                    alignment === "left"
                        ? "flex-start"
                        : alignment === "right"
                          ? "flex-end"
                          : "center",
                justifyContent: "center",
                overflow: "visible",
                cursor: "crosshair",
                backgroundColor: "transparent",
            }}
        >
            <div
                aria-hidden="true" // Hide broken spans from screen reader
                style={{
                    ...textFont,
                    maxWidth: "100%",
                    textAlign: alignment,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                }}
            >
                {tokens.map((token, tokenIdx) => {
                    if (/^\s+$/.test(token)) {
                        const i = globalIndex++
                        return (
                            <span
                                key={`space-${tokenIdx}`}
                                ref={(el) => (charsRef.current[i] = el)}
                                style={{
                                    display: "inline-block",
                                    whiteSpace: "pre",
                                    transformOrigin: "center bottom",
                                    willChange: "transform",
                                }}
                            >
                                {token}
                            </span>
                        )
                    }

                    return (
                        <span
                            key={`word-${tokenIdx}`}
                            style={{
                                display: "inline-block",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {token.split("").map((char) => {
                                const i = globalIndex++
                                return (
                                    <span
                                        key={`char-${i}`}
                                        ref={(el) => (charsRef.current[i] = el)}
                                        style={{
                                            ...textFont,
                                            display: "inline-block",
                                            transformOrigin: "center bottom",
                                            willChange:
                                                "font-variation-settings, transform, color",
                                            // Award Winning Touch: Hardware-accelerated vibrant color mixing!
                                            color: `color-mix(in oklch, ${hoverColor} calc(var(--intensity, 0) * 100%), ${textColor})`,
                                            transition: prefersReducedMotion
                                                ? "all 0.2s ease"
                                                : "none",
                                        }}
                                    >
                                        {char}
                                    </span>
                                )
                            })}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}

// STEP 2: Nested Defaults
MagneticTypography.defaultProps = {
    text: "HOVER ME\nAND SEE\nTHE MAGIC",
    alignment: "center",
    textColor: "#111111",
    hoverColor: "#FF4400",
    entryAnimation: true,
    textFont: {
        fontSize: "84px",
        variant: "Regular",
        letterSpacing: "0em",
        lineHeight: "1.1em",
        fontFamily: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    },
    interaction: {
        radius: 200,
        minWeight: 200,
        maxWeight: 900,
        minWidth: 100,
        maxWidth: 150,
        popScale: 0.25,
        waveY: 15,
        skewIntensity: 10,
        lerpSpeed: 0.12,
    },
}

// STEP 3: UI Categorization
addPropertyControls(MagneticTypography, {
    text: {
        type: ControlType.String,
        displayTextArea: true,
        title: "Text",
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
    },
    entryAnimation: {
        type: ControlType.Boolean,
        title: "Entry Animate",
    },
    textFont: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: { type: ControlType.Color, title: "Text Color" },
    hoverColor: { type: ControlType.Color, title: "Hover Color" },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Magnet Radius",
                min: 50,
                max: 800,
                step: 10,
            },
            minWeight: {
                type: ControlType.Number,
                title: "Base Weight",
                min: 100,
                max: 900,
                step: 100,
            },
            maxWeight: {
                type: ControlType.Number,
                title: "Hover Weight",
                min: 100,
                max: 900,
                step: 100,
            },
            minWidth: {
                type: ControlType.Number,
                title: "Base Width",
                min: 50,
                max: 200,
                step: 10,
            },
            maxWidth: {
                type: ControlType.Number,
                title: "Hover Width",
                min: 50,
                max: 200,
                step: 10,
            },
            popScale: {
                type: ControlType.Number,
                title: "Bulge Scale",
                min: 0,
                max: 2,
                step: 0.05,
            },
            waveY: {
                type: ControlType.Number,
                title: "Wave (Y Axis)",
                min: 0,
                max: 100,
                step: 1,
            },
            skewIntensity: {
                type: ControlType.Number,
                title: "Wind Skew",
                min: 0,
                max: 50,
                step: 1,
            },
            lerpSpeed: {
                type: ControlType.Number,
                title: "Fluidity",
                min: 0.01,
                max: 1,
                step: 0.01,
            },
        },
    },
})
