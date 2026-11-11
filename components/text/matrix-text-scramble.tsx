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
 * Matrix Text Scramble
 * Decrypt-style text reveal with customizable character sets and animation timing.
 * Perfect for headlines, hero sections, and cyberpunk aesthetics.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 80
 */

// Largura base do componente — usada para calcular o scale automático via drag de arestas
const INTRINSIC_WIDTH = 420

const CHAR_SETS = {
    katakana:
        "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン",
    binary: "01",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?/~`",
    alphanumeric:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    hex: "0123456789ABCDEF",
}

function getRandomChar(charSet) {
    return charSet[Math.floor(Math.random() * charSet.length)]
}

function createCharStates(text, charset, scrambleDuration, stagger, scrambled) {
    return text.split("").map((char, i) => ({
        current: scrambled && char !== " " ? getRandomChar(charset) : char,
        target: char,
        revealed: !scrambled || char === " ",
        frame: 0,
        totalFrames: Math.max(
            1,
            Math.round(scrambleDuration * 60 + i * stagger * 60)
        ),
    }))
}

export default function MatrixTextScramble(props) {
    const {
        text,
        characterSet,
        speed,
        stagger,
        scrambleDuration,
        autoStart,
        loop,
        loopDelay,
        triggerOnHover,
        color,
        font,
        scale,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const [chars, setChars] = React.useState([])
    const [isAnimating, setIsAnimating] = React.useState(false)
    const [prefersReducedMotion, setPrefersReducedMotion] =
        React.useState(false)
    const frameRef = React.useRef(null)
    const loopTimeoutRef = React.useRef(null)
    const hasAutoStartedRef = React.useRef(false)

    const displayText = String(text ?? "")
    const charset = CHAR_SETS[characterSet] || CHAR_SETS.katakana
    const frameStep = React.useMemo(() => {
        return 0.35 + ((Number(speed) || 1) - 1) * (1.65 / 9)
    }, [speed])

    // Quando o usuário arrasta as arestas no Framer, style.width vira um número.
    // Dividimos pela largura intrínseca para obter o scale proporcional automático.
    const frameWidth = typeof style?.width === "number" ? style.width : null
    const containerScale = frameWidth ? frameWidth / INTRINSIC_WIDTH : 1
    const finalScale = Math.max(0.01, (Number(scale) || 1) * containerScale)

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        const updatePreference = () => {
            setPrefersReducedMotion(mediaQuery.matches)
        }

        updatePreference()
        mediaQuery.addEventListener?.("change", updatePreference)

        return () => {
            mediaQuery.removeEventListener?.("change", updatePreference)
        }
    }, [])

    // Initialize character states
    // In static rendering (canvas thumbnails, image export) we skip the
    // scrambled starting state entirely and render the final text directly.
    React.useEffect(() => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current)
        if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)

        hasAutoStartedRef.current = false
        setIsAnimating(false)
        setChars(
            createCharStates(
                displayText,
                charset,
                scrambleDuration,
                stagger,
                autoStart && !prefersReducedMotion && !isStatic
            )
        )
    }, [
        displayText,
        charset,
        scrambleDuration,
        stagger,
        autoStart,
        prefersReducedMotion,
        isStatic,
    ])

    // Animation loop
    const animate = React.useCallback(() => {
        setChars((prev) => {
            return prev.map((char) => {
                if (char.revealed) return char

                const newFrame = char.frame + frameStep
                const progress = newFrame / char.totalFrames

                if (progress >= 1) {
                    return {
                        ...char,
                        current: char.target,
                        revealed: true,
                        frame: newFrame,
                    }
                }

                const shouldUpdate = Math.random() < 0.28 + progress * 0.5
                return {
                    ...char,
                    current: shouldUpdate
                        ? char.target === " "
                            ? " "
                            : getRandomChar(charset)
                        : char.current,
                    frame: newFrame,
                }
            })
        })

        frameRef.current = requestAnimationFrame(animate)
    }, [charset, frameStep])

    // Start animation function
    const startAnimation = React.useCallback(() => {
        if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
        if (frameRef.current) cancelAnimationFrame(frameRef.current)

        // Static rendering (canvas thumbnails, image export) never runs
        // RAF loops or timers — jump straight to the fully revealed text.
        if (prefersReducedMotion || isStatic) {
            setChars((prev) =>
                prev.map((char) => ({
                    ...char,
                    current: char.target,
                    revealed: true,
                    frame: char.totalFrames,
                }))
            )
            setIsAnimating(false)
            return
        }

        setChars((prev) =>
            prev.map((char, i) => ({
                ...char,
                current: char.target === " " ? " " : getRandomChar(charset),
                revealed: char.target === " ",
                frame: 0,
                totalFrames: Math.max(
                    1,
                    Math.round(scrambleDuration * 60 + i * stagger * 60)
                ),
            }))
        )
        setIsAnimating(true)
    }, [charset, scrambleDuration, stagger, prefersReducedMotion, isStatic])

    // Auto start
    React.useEffect(() => {
        if (
            autoStart &&
            !isStatic &&
            !hasAutoStartedRef.current &&
            chars.length > 0
        ) {
            hasAutoStartedRef.current = true
            startAnimation()
        }
    }, [autoStart, isStatic, startAnimation, chars.length])

    // Loop after all characters settle
    React.useEffect(() => {
        if (!isAnimating || chars.length === 0) return
        if (!chars.every((char) => char.revealed)) return

        setIsAnimating(false)

        if (loop && !prefersReducedMotion && !isStatic) {
            if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
            loopTimeoutRef.current = setTimeout(startAnimation, loopDelay)
        }
    }, [
        chars,
        isAnimating,
        loop,
        loopDelay,
        prefersReducedMotion,
        isStatic,
        startAnimation,
    ])

    // Animation frame loop — never runs during static rendering
    React.useEffect(() => {
        if (isAnimating && !isStatic) {
            frameRef.current = requestAnimationFrame(animate)
        }
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
        }
    }, [isAnimating, isStatic, animate])

    // Cleanup
    React.useEffect(() => {
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
            if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current)
        }
    }, [])

    const handleClick = () => {
        if (!triggerOnHover && !isAnimating) startAnimation()
    }

    const handleMouseEnter = () => {
        if (triggerOnHover && !isAnimating) startAnimation()
    }

    return (
        // Outer wrapper recebe o width/height do Framer (drag de arestas + K tool)
        <div
            style={{
                ...style,
                position: "relative",
                overflow: "visible",
            }}
        >
            {/* Inner text — scale proporcional: slider × containerScale */}
            <div
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                aria-label={displayText}
                role="text"
                style={{
                    ...font,
                    color,
                    cursor:
                        triggerOnHover || !autoStart ? "pointer" : "default",
                    display: "inline-block",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    transform: `scale(${finalScale})`,
                    transformOrigin: "top left",
                }}
            >
                {chars.map((char, i) => (
                    <span
                        key={i}
                        aria-hidden="true"
                        style={{
                            display: "inline-block",
                            minWidth:
                                char.target === " " ? "0.25em" : undefined,
                        }}
                    >
                        {char.current}
                    </span>
                ))}
            </div>
        </div>
    )
}

MatrixTextScramble.defaultProps = {
    text: "ENTER THE MATRIX",
    characterSet: "katakana",
    speed: 7,
    stagger: 0.03,
    scrambleDuration: 0.8,
    autoStart: true,
    loop: false,
    loopDelay: 2000,
    triggerOnHover: false,
    color: "#00FF41",
    scale: 1,
    font: {
        fontFamily: "Inter",
        fontSize: 48,
        variant: "Bold",
        letterSpacing: 0.02,
        lineHeight: 1.2,
        textAlign: "left",
    },
}

addPropertyControls(MatrixTextScramble, {
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue: "ENTER THE MATRIX",
        displayTextArea: true,
    },
    characterSet: {
        title: "Character Set",
        type: ControlType.Enum,
        options: ["katakana", "binary", "symbols", "alphanumeric", "hex"],
        optionTitles: [
            "Katakana (Matrix)",
            "Binary",
            "Symbols",
            "Alphanumeric",
            "Hexadecimal",
        ],
        defaultValue: "katakana",
    },
    speed: {
        title: "Speed",
        type: ControlType.Number,
        min: 1,
        max: 10,
        step: 0.5,
        defaultValue: 7,
        description: "Animation speed (1=slow, 10=fast)",
    },
    stagger: {
        title: "Stagger",
        type: ControlType.Number,
        min: 0,
        max: 0.15,
        step: 0.005,
        defaultValue: 0.03,
    },
    scrambleDuration: {
        title: "Duration",
        type: ControlType.Number,
        min: 0.2,
        max: 3,
        step: 0.1,
        defaultValue: 0.8,
        description: "How long each character scrambles",
    },
    autoStart: {
        title: "Auto Start",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    loop: {
        title: "Loop",
        type: ControlType.Boolean,
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loopDelay: {
        title: "Loop Delay",
        type: ControlType.Number,
        min: 500,
        max: 10000,
        step: 100,
        defaultValue: 2000,
        hidden: (props) => !props.loop,
    },
    triggerOnHover: {
        title: "Hover Trigger",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    color: {
        title: "Color",
        type: ControlType.Color,
        defaultValue: "#00FF41",
    },
    scale: {
        title: "Scale",
        type: ControlType.Number,
        min: 0.1,
        max: 10,
        step: 0.05,
        defaultValue: 1,
        description: "Escala uniforme da tipografia (X e Y juntos)",
    },
    font: {
        title: "Font",
        type: ControlType.Font,
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 48,
            variant: "Bold",
            letterSpacing: 0.02,
            lineHeight: 1.2,
            textAlign: "left",
        },
        defaultFontType: "sans-serif",
        defaultFontSize: "48px",
        displayFontSize: true,
        displayTextAlignment: true,
        controls: "extended",
    },
})
