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


type LetterState = {
    stroke: number
    tx: number
    ty: number
    rotate: number
    scaleX: number
    scaleY: number
    radius: number
    duration: number
}

type FontStyle = {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    letterSpacing?: number | string
    lineHeight?: number | string
    textAlign?: "left" | "center" | "right"
}

type Props = {
    text: string
    palette: string[]
    minStroke: number
    maxStroke: number
    speed: number
    colorSpeed: number
    jitterX: number
    jitterY: number
    rotate: number
    scaleAmount: number
    radiusAmount: number
    letterDelay: number
    padding: number
    uppercase: boolean
    fillOpacity: number
    activeLetters: number
    style: FontStyle
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function rand(min: number, max: number) {
    return min + Math.random() * (max - min)
}

function createLetterState(props: Props): LetterState {
    const strokeMin = Math.min(props.minStroke, props.maxStroke)
    const strokeMax = Math.max(props.minStroke, props.maxStroke)

    return {
        stroke: rand(strokeMin, strokeMax),
        tx: rand(-props.jitterX, props.jitterX),
        ty: rand(-props.jitterY, props.jitterY),
        rotate: rand(-props.rotate, props.rotate),
        scaleX: rand(1 - props.scaleAmount, 1 + props.scaleAmount),
        scaleY: rand(1 - props.scaleAmount, 1 + props.scaleAmount),
        radius: rand(0, props.radiusAmount),
        duration: rand(Math.max(0.12, props.speed * 0.55), props.speed * 1.35),
    }
}

function createStaticLetterState(props: Props): LetterState {
    const strokeMin = Math.min(props.minStroke, props.maxStroke)
    const strokeMax = Math.max(props.minStroke, props.maxStroke)

    return {
        stroke: (strokeMin + strokeMax) / 2,
        tx: 0,
        ty: 0,
        rotate: 0,
        scaleX: 1,
        scaleY: 1,
        radius: 0,
        duration: 0,
    }
}

function getRandomIndices(length: number, count: number) {
    const indices = Array.from({ length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices.slice(0, count)
}

export default function Animated_Colour_Typo_Componente(props: Partial<Props>) {
    const isStaticRenderer = useIsStaticRenderer()

    const merged = {
        text: "STUDIO",
        palette: ["#2F8CFF", "#FF5A00", "#111111", "#3CB66B"],
        minStroke: 0,
        maxStroke: 10,
        speed: 0.24,
        colorSpeed: 0.8,
        jitterX: 10,
        jitterY: 12,
        rotate: 5,
        scaleAmount: 0.12,
        radiusAmount: 22,
        letterDelay: 0.03,
        padding: 0,
        uppercase: true,
        fillOpacity: 1,
        activeLetters: 2,
        style: {
            fontFamily: "Inter",
            fontSize: 220,
            fontWeight: 800,
            letterSpacing: "-0.06em",
            lineHeight: "0.92em",
            textAlign: "left" as const,
        },
        ...props,
    } as Props

    const text = merged.uppercase ? merged.text.toUpperCase() : merged.text
    const letters = React.useMemo(() => Array.from(text), [text])

    const palette = React.useMemo(() => {
        const valid =
            Array.isArray(merged.palette) && merged.palette.length > 0
                ? merged.palette.filter(Boolean)
                : []

        return valid.length ? valid : ["#2F8CFF"]
    }, [merged.palette])

    const staticStates = React.useMemo(
        () => letters.map(() => createStaticLetterState(merged)),
        [letters, merged.minStroke, merged.maxStroke]
    )

    const [activeColor, setActiveColor] = React.useState(
        palette[0] ?? "#2F8CFF"
    )
    const [states, setStates] = React.useState<LetterState[]>(() =>
        isStaticRenderer
            ? letters.map(() => createStaticLetterState(merged))
            : letters.map(() => createLetterState(merged))
    )

    React.useEffect(() => {
        setStates(
            isStaticRenderer
                ? letters.map(() => createStaticLetterState(merged))
                : letters.map(() => createLetterState(merged))
        )
    }, [
        letters,
        isStaticRenderer,
        merged.minStroke,
        merged.maxStroke,
        merged.jitterX,
        merged.jitterY,
        merged.rotate,
        merged.scaleAmount,
        merged.radiusAmount,
        merged.speed,
    ])

    React.useEffect(() => {
        setActiveColor(palette[0] ?? "#2F8CFF")
    }, [palette])

    React.useEffect(() => {
        if (isStaticRenderer || letters.length === 0) return

        const id = window.setInterval(
            () => {
                setStates((prev) => {
                    const next = [...prev]
                    const count = Math.min(
                        Math.max(1, merged.activeLetters),
                        letters.length
                    )
                    const indices = getRandomIndices(letters.length, count)

                    indices.forEach((i) => {
                        next[i] = createLetterState(merged)
                    })

                    return next
                })
            },
            Math.max(80, merged.speed * 1000)
        )

        return () => window.clearInterval(id)
    }, [
        isStaticRenderer,
        letters,
        merged.activeLetters,
        merged.speed,
        merged.minStroke,
        merged.maxStroke,
        merged.jitterX,
        merged.jitterY,
        merged.rotate,
        merged.scaleAmount,
        merged.radiusAmount,
    ])

    React.useEffect(() => {
        if (isStaticRenderer) return

        if (palette.length <= 1) {
            setActiveColor(palette[0] ?? "#2F8CFF")
            return
        }

        const id = window.setInterval(
            () => {
                setActiveColor((current) => {
                    const available = palette.filter(
                        (color) => color !== current
                    )
                    return (
                        available[
                            Math.floor(Math.random() * available.length)
                        ] ?? current
                    )
                })
            },
            Math.max(120, merged.colorSpeed * 1000)
        )

        return () => window.clearInterval(id)
    }, [isStaticRenderer, palette, merged.colorSpeed])

    const renderedStates = isStaticRenderer ? staticStates : states
    const renderedColor = isStaticRenderer
        ? (palette[0] ?? "#2F8CFF")
        : activeColor

    return (
        <div
            role="img"
            aria-label={text}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent:
                    merged.style?.textAlign === "center"
                        ? "center"
                        : merged.style?.textAlign === "right"
                          ? "flex-end"
                          : "flex-start",
                padding: merged.padding,
                overflow: "visible",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    whiteSpace: "pre-wrap",
                    fontFamily: merged.style.fontFamily,
                    fontSize: merged.style.fontSize,
                    fontWeight: merged.style.fontWeight,
                    letterSpacing: merged.style.letterSpacing,
                    lineHeight: merged.style.lineHeight,
                    textAlign: merged.style.textAlign,
                }}
            >
                {letters.map((char, index) => {
                    if (char === " ") {
                        return <span key={`space-${index}`}> </span>
                    }

                    const state =
                        renderedStates[index] ??
                        (isStaticRenderer
                            ? createStaticLetterState(merged)
                            : createLetterState(merged))

                    return (
                        <span
                            key={`${char}-${index}`}
                            aria-hidden="true"
                            style={{
                                display: "inline-block",
                                transform: `translate(${state.tx}px, ${state.ty}px) rotate(${state.rotate}deg) scale(${state.scaleX}, ${state.scaleY})`,
                                borderRadius: `${state.radius}px`,
                                transitionProperty: isStaticRenderer
                                    ? "none"
                                    : "transform, border-radius, -webkit-text-stroke-width",
                                transitionDuration: isStaticRenderer
                                    ? "0s"
                                    : `${state.duration}s`,
                                transitionTimingFunction: isStaticRenderer
                                    ? "linear"
                                    : "cubic-bezier(0.22, 1, 0.36, 1)",
                                transitionDelay: isStaticRenderer
                                    ? "0s"
                                    : `${index * merged.letterDelay}s`,
                                WebkitTextStrokeWidth: `${clamp(state.stroke, 0, 200)}px`,
                                WebkitTextStrokeColor: renderedColor,
                                WebkitTextFillColor: renderedColor,
                                color: renderedColor,
                                opacity: merged.fillOpacity,
                                transformOrigin: "50% 70%",
                                willChange: isStaticRenderer
                                    ? "auto"
                                    : "transform, border-radius, -webkit-text-stroke-width",
                            }}
                        >
                            {char}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(Animated_Colour_Typo_Componente, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "STUDIO",
    },
    activeLetters: {
        type: ControlType.Number,
        title: "Active Letters",
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 2,
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
    },
    palette: {
        type: ControlType.Array,
        title: "Colors",
        defaultValue: ["#2F8CFF", "#FF5A00", "#111111", "#3CB66B"],
        control: {
            type: ControlType.Color,
            title: "Color",
        },
        maxCount: 8,
    },
    colorSpeed: {
        type: ControlType.Number,
        title: "Color",
        min: 0.12,
        max: 4,
        step: 0.01,
        unit: "s",
        defaultValue: 0.8,
    },
    minStroke: {
        type: ControlType.Number,
        title: "Stroke Min",
        min: 0,
        max: 200,
        step: 0.5,
        defaultValue: 0,
    },
    maxStroke: {
        type: ControlType.Number,
        title: "Stroke Max",
        min: 0,
        max: 200,
        step: 0.5,
        defaultValue: 10,
    },
    speed: {
        type: ControlType.Number,
        title: "Morph",
        min: 0.08,
        max: 2,
        step: 0.01,
        unit: "s",
        defaultValue: 0.24,
    },
    letterDelay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 0.3,
        step: 0.005,
        unit: "s",
        defaultValue: 0.03,
    },
    jitterX: {
        type: ControlType.Number,
        title: "Move X",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 10,
    },
    jitterY: {
        type: ControlType.Number,
        title: "Move Y",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 12,
    },
    rotate: {
        type: ControlType.Number,
        title: "Rotate",
        min: 0,
        max: 20,
        step: 0.5,
        defaultValue: 5,
    },
    scaleAmount: {
        type: ControlType.Number,
        title: "Scale",
        min: 0,
        max: 0.45,
        step: 0.01,
        defaultValue: 0.12,
    },
    radiusAmount: {
        type: ControlType.Number,
        title: "Round",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 22,
    },
    fillOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 120,
        step: 1,
        defaultValue: 0,
    },
    style: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontSize: 220,
            fontWeight: 800,
            letterSpacing: "-0.06em",
            lineHeight: "0.92em",
            textAlign: "left",
        },
    },
})
