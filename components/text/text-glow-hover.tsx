// User request: Framer code component for a large text with interactive, multi-layered blurred shadow effect, inspired by the provided HTML/CSS/JS. Mouse position controls shadow direction. Font: UnifrakturMaguntia. All Framer best practices applied.

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


/**
 * MouseTextEffect
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
function MouseTextEffect(props) {
    // Property controls
    const {
        text = "Light",
        copies = 100,
        textColor = "#FFFFFF",
        backgroundColor = "#111111",
        font = {
            fontFamily: 'UnifrakturMaguntia, system-ui',
            fontSize: 160,
            fontWeight: 400,
            fontStyle: 'normal',
            letterSpacing: 0,
            lineHeight: 1.1,
        },
        shadowColor = '#FFFFFF',
        useGradientGlow = false,
        glowStartColor = '#FFFFFF',
        glowEndColor = '#BB1111',
    shadowScaleFactor = 0.01,
    } = props


    // Mouse state
    const [direction, setDirection] = React.useState({ horizontal: 1, vertical: 1 })
    const [pulse, setPulse] = React.useState(1)
    const [isHovering, setIsHovering] = React.useState(false)
    const containerRef = React.useRef(null)
    const isOnCanvas = useIsOnFramerCanvas()
    // Throttle updates with requestAnimationFrame
    const rafRef = React.useRef()
    const centerAnimRef = React.useRef()

    // Animate pulse if enabled
    React.useEffect(() => {
        if (!props.animateGlow || isOnCanvas) return
        let frame, start
        function animate(ts) {
            if (!start) start = ts
            const t = (ts - start) / 1000
            // Pulsate between 0.95 and 1.05
            setPulse(0.95 + 0.1 * (0.5 + 0.5 * Math.sin(t * 2)))
            frame = requestAnimationFrame(animate)
        }
        frame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frame)
    }, [props.animateGlow, isOnCanvas])

    // Mouse/touch handler
    const handlePointer = React.useCallback((e) => {
        if (isOnCanvas) return
        setIsHovering(true)
        if (centerAnimRef.current) cancelAnimationFrame(centerAnimRef.current)
        const rect = containerRef.current.getBoundingClientRect()
        let clientX, clientY
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }
        const x = clientX - rect.left
        const y = clientY - rect.top
        let horizontal, vertical
        if (x > rect.width / 2) {
            horizontal = ((x - rect.width / 2) / (rect.width / 2)) * -1
        } else {
            horizontal = (rect.width / 2 - x) / (rect.width / 2)
        }
        if (y > rect.height / 2) {
            vertical = ((y - rect.height / 2) / (rect.height / 2)) * -1
        } else {
            vertical = (rect.height / 2 - y) / (rect.height / 2)
        }
        // Clamp to [-1, 1]
        horizontal = Math.max(-1, Math.min(1, horizontal))
        vertical = Math.max(-1, Math.min(1, vertical))
        // Throttle with RAF
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
            setDirection({ horizontal, vertical })
        })
    }, [isOnCanvas])

    // Mouse leave handler: animate back to center
    const handlePointerLeave = React.useCallback(() => {
        setIsHovering(false)
        if (centerAnimRef.current) cancelAnimationFrame(centerAnimRef.current)
        function animateBack() {
            setDirection(prev => {
                const speed = 0.18
                const h = prev.horizontal + (1 - prev.horizontal) * speed
                const v = prev.vertical + (1 - prev.vertical) * speed
                if (Math.abs(h - 1) < 0.01 && Math.abs(v - 1) < 0.01) {
                    // Snap exactly to center and stop animating
                    if (centerAnimRef.current) cancelAnimationFrame(centerAnimRef.current)
                    return { horizontal: 1, vertical: 1 }
                } else {
                    centerAnimRef.current = requestAnimationFrame(animateBack)
                    return { horizontal: h, vertical: v }
                }
            })
        }
        centerAnimRef.current = requestAnimationFrame(animateBack)
    }, [])

    // Attach listeners
    React.useEffect(() => {
        if (!containerRef.current || isOnCanvas) return
        const el = containerRef.current
        el.addEventListener("mousemove", handlePointer)
        el.addEventListener("touchmove", handlePointer)
        el.addEventListener("mouseleave", handlePointerLeave)
        el.addEventListener("touchend", handlePointerLeave)
        return () => {
            el.removeEventListener("mousemove", handlePointer)
            el.removeEventListener("touchmove", handlePointer)
            el.removeEventListener("mouseleave", handlePointerLeave)
            el.removeEventListener("touchend", handlePointerLeave)
        }
    }, [handlePointer, handlePointerLeave, isOnCanvas])

    // Set CSS variables for direction
    React.useEffect(() => {
        if (!containerRef.current) return
        containerRef.current.style.setProperty("--horizontal", direction.horizontal)
        containerRef.current.style.setProperty("--vertical", direction.vertical)
    }, [direction])

    // Helper: robust color parser (hex, rgb, rgba)
    function parseColor(input) {
        if (!input) return { r: 255, g: 255, b: 255 }
        if (input.startsWith('rgb')) {
            // rgb or rgba
            const match = input.match(/rgba?\(([^)]+)\)/)
            if (match) {
                const parts = match[1].split(',').map(Number)
                return { r: parts[0] || 255, g: parts[1] || 255, b: parts[2] || 255 }
            }
        } else if (input.startsWith('#')) {
            let c = input.replace('#', '')
            if (c.length === 3) {
                c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2]
            }
            if (c.length === 6) {
                // Pad with zeros if needed
                c = c.padStart(6, '0')
                const r = parseInt(c.slice(0,2), 16)
                const g = parseInt(c.slice(2,4), 16)
                const b = parseInt(c.slice(4,6), 16)
                return { r, g, b }
            }
            // 8-digit hex (with alpha)
            if (c.length === 8) {
                c = c.padStart(8, '0')
                const r = parseInt(c.slice(0,2), 16)
                const g = parseInt(c.slice(2,4), 16)
                const b = parseInt(c.slice(4,6), 16)
                // ignore alpha for now
                return { r, g, b }
            }
        }
        // fallback: white
        return { r: 255, g: 255, b: 255 }
    }
    // Helper: interpolate between two colors
    function lerpColor(a, b, t) {
        return {
            r: Math.round(a.r + (b.r - a.r) * t),
            g: Math.round(a.g + (b.g - a.g) * t),
            b: Math.round(a.b + (b.b - a.b) * t),
        }
    }
    const shadowRGB = parseColor(shadowColor)
    const startRGB = parseColor(glowStartColor)
    const endRGB = parseColor(glowEndColor)

    // Precompute shadow color strings for all copies (memoized)
    const shadowColorStrings = React.useMemo(() => {
        const arr = []
        for (let i = 1; i <= copies; i++) {
            let rgb
            if (useGradientGlow) {
                const t = (i - 1) / (copies - 1)
                rgb = lerpColor(startRGB, endRGB, t)
            } else {
                rgb = shadowRGB
            }
            arr.push(`rgba(${rgb.r},${rgb.g},${rgb.b},${1 / i})`)
        }
        return arr
    }, [copies, useGradientGlow, startRGB, endRGB, shadowRGB])

    // Generate shadow copies (static, only update CSS vars for transform)
    const shadowCopies = React.useMemo(() => {
        const arr = []
        for (let i = 1; i <= copies; i++) {
            arr.push(
                <div
                    key={i}
                    aria-hidden="true"
                    className="mouse-text-shadow-copy"
                    style={{
                        '--index': i,
                        '--shadow-color': shadowColorStrings[i - 1],
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                >
                    {text}
                </div>
            )
        }
        return arr
    }, [copies, text, shadowColorStrings])

    // Main text style
    // Compute glow color for text-shadow
    let glowColor = shadowColor
    if (useGradientGlow) {
        glowColor = glowStartColor
    }
    // Parse glow color for alpha
    const glowRGB = parseColor(glowColor)
    const glowAlpha = typeof props.glowOpacity === 'number' ? props.glowOpacity : 1
    const glowBlur = typeof props.glowBlur === 'number' ? props.glowBlur : 32
    const glowColorWithAlpha = `rgba(${glowRGB.r},${glowRGB.g},${glowRGB.b},${glowAlpha})`
    // Use a strong and soft blur for glow
    // Move the glow slightly with mouse direction
    const glowOffset = 0.7 * (typeof font.fontSize === 'number' ? font.fontSize : parseInt(font.fontSize) || 160) / 160 // scale with font size
    const x1 = (direction.horizontal || 0) * glowOffset
    const y1 = (direction.vertical || 0) * glowOffset
    const x2 = (direction.horizontal || 0) * glowOffset * 2
    const y2 = (direction.vertical || 0) * glowOffset * 2
    const x3 = (direction.horizontal || 0) * glowOffset * 0.5
    const y3 = (direction.vertical || 0) * glowOffset * 0.5
    const mainTextStyle = {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        fontFamily: font.fontFamily,
        fontSize: font.fontSize,
        color: textColor,
        fontWeight: font.fontWeight,
        fontStyle: font.fontStyle,
        letterSpacing: font.letterSpacing,
        lineHeight: font.lineHeight,
        zIndex: 1,
        userSelect: "none",
        whiteSpace: "pre",
        textAlign: "center",
        pointerEvents: "auto",
        transition: undefined,
        textShadow: `
            ${x1}px ${y1}px ${glowBlur}px ${glowColorWithAlpha},
            ${x2}px ${y2}px ${glowBlur*2}px ${glowColorWithAlpha},
            ${x3}px ${y3}px ${Math.round(glowBlur/4)}px ${glowColorWithAlpha}
        `,
    }

    // Container style
    const containerStyle = {
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 10,
        minHeight: 10,
        background: backgroundColor,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        cursor: isOnCanvas ? "default" : "pointer",
        WebkitUserSelect: "none",
        userSelect: "none",
    }

    // Inject static CSS for shadow copies (only once)
    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (document.getElementById("mouse-text-shadow-style")) return
        const style = document.createElement("style")
        style.id = "mouse-text-shadow-style"
        style.innerHTML = `
        .mouse-text-shadow-copy {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) translate(calc(var(--index, 1) * var(--horizontal, 1) * 0.1rem), calc(var(--index, 1) * var(--vertical, 1) * 0.1rem)) scale(calc(1 + var(--index, 1) * var(--shadow-scale, 0.01)));
            color: var(--shadow-color, #fff);
            filter: blur(0.1rem);
            user-select: none;
            white-space: pre;
            text-align: center;
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            font-style: inherit;
            letter-spacing: inherit;
            line-height: inherit;
            will-change: transform;
        }
        `
        document.head.appendChild(style)
    }, [])

    // Set CSS vars for font and scale on container
    const cssVars = {
        '--horizontal': direction.horizontal,
        '--vertical': direction.vertical,
        '--shadow-scale': shadowScaleFactor * pulse,
        fontFamily: font.fontFamily,
        fontSize: font.fontSize,
        fontWeight: font.fontWeight,
        fontStyle: font.fontStyle,
        letterSpacing: font.letterSpacing,
        lineHeight: font.lineHeight,
    }

    return (
        <div ref={containerRef} style={{...containerStyle, ...cssVars}}>
            {/* Shadow copies (always behind main text) */}
            {shadowCopies}
            {/* Main text */}
            <div
                role="heading"
                aria-level={1}
                style={mainTextStyle}
            >
                {text}
            </div>
        </div>
    )
}

addPropertyControls(MouseTextEffect, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Light",
        placeholder: "Type text…",
    },

    copies: {
        type: ControlType.Number,
        title: "Shadow Copies",
        defaultValue: 100,
        min: 10,
        max: 200,
        step: 1,
        displayStepper: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !!props.useGradientGlow,
    },
    useGradientGlow: {
        type: ControlType.Boolean,
        title: "Gradient Glow",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    glowStartColor: {
        type: ControlType.Color,
        title: "Glow Start",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.useGradientGlow,
    },
    glowEndColor: {
        type: ControlType.Color,
        title: "Glow End",
        defaultValue: "#BB1111",
        hidden: (props) => !props.useGradientGlow,
    },
    shadowScaleFactor: {
        type: ControlType.Number,
        title: "Shadow Scale",
        defaultValue: 0.01,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        displayStepper: true,
        description: "How much the shadow expands as it moves away from the main text.",
    },
    animateGlow: {
        type: ControlType.Boolean,
        title: "Animate Glow",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    glowBlur: {
        type: ControlType.Number,
        title: "Glow Blur",
        defaultValue: 32,
        min: 0,
        max: 128,
        step: 1,
        displayStepper: true,
        description: "Blur radius of the main text glow.",
    },
    glowOpacity: {
        type: ControlType.Number,
        title: "Glow Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
        displayStepper: true,
        description: "Opacity of the main text glow.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "UnifrakturMaguntia, system-ui",
            fontSize: 160,
            fontWeight: 400,
            fontStyle: "normal",
            letterSpacing: 0,
            lineHeight: 1.1,
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },
})

export default MouseTextEffect
