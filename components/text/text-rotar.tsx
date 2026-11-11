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

import gsap from "https://esm.sh/gsap@3.12.5"

function toNumber(value, fallback) {
    const next = Number(value)
    return Number.isFinite(next) ? next : fallback
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

function splitCharacters(text) {
    return Array.from(String(text || ""))
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 260
 */
export default function TextRotar(props) {
    const {
        style,
        text,
        lineCount,
        color,
        backgroundColor,
        font,
        perspective,
        radiusMode,
        radius,
        depthDivisor,
        duration,
        charStagger,
        lineStagger,
        fromRotation,
        toRotation,
        loop,
        ariaLabel,
    } = props

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const safeLineCount = clamp(Math.round(toNumber(lineCount, 4)), 1, 10)
    const characters = React.useMemo(() => splitCharacters(text), [text])
    const lines = React.useMemo(
        () => Array.from({ length: safeLineCount }),
        [safeLineCount]
    )

    React.useEffect(() => {
        const root = rootRef.current
        if (!root) return

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
        const lineElements = Array.from(
            root.querySelectorAll<HTMLElement>("[data-text-rotar-line]")
        )
        const charGroups = lineElements.map((line) =>
            Array.from(
                line.querySelectorAll<HTMLElement>("[data-text-rotar-char]")
            )
        )
        const allChars = charGroups.flat()
        const safePerspective = Math.max(0, toNumber(perspective, 700))
        const safeDepthDivisor = Math.max(1, toNumber(depthDivisor, 8))
        const width = root.getBoundingClientRect().width || 960
        const autoRadius = width / safeDepthDivisor
        const safeRadius =
            radiusMode === "manual"
                ? Math.max(0, toNumber(radius, autoRadius))
                : autoRadius
        const safeDuration = Math.max(0.01, toNumber(duration, 0.9))
        const safeCharStagger = Math.max(0, toNumber(charStagger, 0.08))
        const safeLineStagger = Math.max(0, toNumber(lineStagger, 0.45))
        const safeFromRotation = toNumber(fromRotation, -90)
        const safeToRotation = toNumber(toRotation, 90)
        const transformOrigin = `50% 50% ${-safeRadius}px`

        const context = gsap.context(() => {
            gsap.set(root, { autoAlpha: 1 })
            gsap.set(lineElements, {
                perspective: safePerspective,
                transformStyle: "preserve-3d",
            })
            gsap.set(allChars, {
                backfaceVisibility: "hidden",
                rotationX: reduceMotion ? 0 : safeFromRotation,
                transformOrigin,
                transformStyle: "preserve-3d",
            })

            if (reduceMotion || allChars.length === 0) return

            const timeline = gsap.timeline({
                repeat: loop ? -1 : 0,
                defaults: { ease: "none" },
            })

            charGroups.forEach((chars, index) => {
                timeline.fromTo(
                    chars,
                    { rotationX: safeFromRotation },
                    {
                        rotationX: safeToRotation,
                        stagger: safeCharStagger,
                        duration: safeDuration,
                        transformOrigin,
                    },
                    index * safeLineStagger
                )
            })
        }, root)

        return () => context.revert()
    }, [
        text,
        safeLineCount,
        perspective,
        radiusMode,
        radius,
        depthDivisor,
        duration,
        charStagger,
        lineStagger,
        fromRotation,
        toRotation,
        loop,
    ])

    return (
        <div
            ref={rootRef}
            aria-label={ariaLabel || text}
            role="text"
            style={{
                alignItems: "center",
                backgroundColor,
                boxSizing: "border-box",
                color,
                display: "flex",
                height: "100%",
                justifyContent: "center",
                overflow: "visible",
                position: "relative",
                transformStyle: "preserve-3d",
                visibility: "hidden",
                width: "100%",
                ...style,
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    height: "100%",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    width: "100%",
                }}
            >
                {lines.map((_, lineIndex) => (
                    <div
                        key={lineIndex}
                        data-text-rotar-line=""
                        style={{
                            left: "50%",
                            lineHeight: 1,
                            margin: 0,
                            position: "absolute",
                            textAlign: "center",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            whiteSpace: "nowrap",
                            willChange: "transform",
                            ...font,
                        }}
                    >
                        {characters.map((char, charIndex) => (
                            <span
                                key={`${lineIndex}-${charIndex}-${char}`}
                                data-text-rotar-char=""
                                style={{
                                    backfaceVisibility: "hidden",
                                    display: "inline-block",
                                    transformStyle: "preserve-3d",
                                    whiteSpace: "pre",
                                    willChange: "transform",
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

TextRotar.defaultProps = {
    text: "textrotar",
    lineCount: 4,
    color: "#111111",
    backgroundColor: "rgba(255,255,255,0)",
    perspective: 700,
    radiusMode: "auto",
    radius: 120,
    depthDivisor: 8,
    duration: 0.9,
    charStagger: 0.08,
    lineStagger: 0.45,
    fromRotation: -90,
    toRotation: 90,
    loop: true,
    ariaLabel: "",
    font: {
        fontSize: 168,
        lineHeight: 1,
        fontWeight: 800,
        letterSpacing: 0,
        textAlign: "center",
    },
}

addPropertyControls(TextRotar, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "textrotar",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: TextRotar.defaultProps.font,
        defaultFontType: "sans-serif",
        displayFontSize: true,
        displayTextAlignment: true,
        controls: "extended",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111111",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(255,255,255,0)",
        optional: true,
    },
    lineCount: {
        type: ControlType.Number,
        title: "Lines",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        displayStepper: true,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 700,
        min: 100,
        max: 2000,
        step: 10,
        unit: "px",
    },
    radiusMode: {
        type: ControlType.Enum,
        title: "Radius",
        options: ["auto", "manual"],
        optionTitles: ["Auto", "Custom"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 120,
        min: 0,
        max: 1200,
        step: 1,
        unit: "px",
        hidden(props) {
            return props.radiusMode !== "manual"
        },
    },
    depthDivisor: {
        type: ControlType.Number,
        title: "Auto Div",
        defaultValue: 8,
        min: 2,
        max: 24,
        step: 0.5,
        hidden(props) {
            return props.radiusMode === "manual"
        },
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.9,
        min: 0.1,
        max: 4,
        step: 0.05,
        unit: "s",
    },
    charStagger: {
        type: ControlType.Number,
        title: "Char Gap",
        defaultValue: 0.08,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
    lineStagger: {
        type: ControlType.Number,
        title: "Line Gap",
        defaultValue: 0.45,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    fromRotation: {
        type: ControlType.Number,
        title: "From",
        defaultValue: -90,
        min: -180,
        max: 180,
        step: 1,
        unit: "deg",
    },
    toRotation: {
        type: ControlType.Number,
        title: "To",
        defaultValue: 90,
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
})
