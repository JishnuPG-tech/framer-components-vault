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


type FontValue = React.CSSProperties

interface Props {
    lineOne: string
    lineTwo: string
    textColor: string
    strokeColor: string
    backgroundColor: string
    dotColor: string
    dotOpacity: number
    patternSize: number
    font: FontValue
    topSize: number
    bottomSize: number
    topStrokeWidth: number
    bottomStrokeWidth: number
    shadowX: number
    shadowY: number
    arc: number
    rotation: number
    letterSpacing: number
    lineGap: number
    responsive: "auto" | "single" | "stack"
    breakpoint: number
    mobileTopSize: number
    mobileBottomSize: number
    mobileLineGap: number
    wordGap: number
    duration: number
    stagger: number
    delay: number
    replay: boolean
    trigger: "appear" | "hover"
    style?: React.CSSProperties
}

const split = (value: string) => Array.from(value || " ")

export default function DreamBigText(props: Props) {
    const {
        lineOne,
        lineTwo,
        textColor,
        strokeColor,
        backgroundColor,
        dotColor,
        dotOpacity,
        patternSize,
        font,
        topSize,
        bottomSize,
        topStrokeWidth,
        bottomStrokeWidth,
        shadowX,
        shadowY,
        arc,
        rotation,
        letterSpacing,
        lineGap,
        responsive,
        breakpoint,
        mobileTopSize,
        mobileBottomSize,
        mobileLineGap,
        wordGap,
        duration,
        stagger,
        delay,
        replay,
        trigger,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [run, setRun] = React.useState(0)
    const [scale, setScale] = React.useState(1)
    const [rootWidth, setRootWidth] = React.useState<number | null>(null)
    const rootRef = React.useRef<HTMLElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const top = split(lineOne)
    const words = (lineOne.trim() || " ").split(/\s+/)
    const bottom = split(lineTwo)
    const stacked =
        responsive === "stack" ||
        (responsive === "auto" && rootWidth !== null && rootWidth <= breakpoint)
    const activeTopSize = stacked ? mobileTopSize : topSize
    const activeBottomSize = stacked ? mobileBottomSize : bottomSize
    const activeLineGap = stacked ? mobileLineGap : lineGap

    React.useEffect(() => {
        if (trigger === "appear") setRun((value) => value + 1)
    }, [lineOne, lineTwo, trigger])

    React.useLayoutEffect(() => {
        const root = rootRef.current
        const content = contentRef.current
        if (!root || !content) return

        const fit = () => {
            setRootWidth(root.clientWidth)
            const availableWidth = Math.max(1, root.clientWidth * 0.9)
            const availableHeight = Math.max(1, root.clientHeight * 0.86)
            const widthScale = availableWidth / Math.max(1, content.scrollWidth)
            const heightScale =
                availableHeight / Math.max(1, content.scrollHeight)
            setScale(Math.min(1, widthScale, heightScale))
        }

        fit()
        const observer = new ResizeObserver(fit)
        observer.observe(root)
        observer.observe(content)
        return () => observer.disconnect()
    }, [
        lineOne,
        lineTwo,
        font,
        topSize,
        bottomSize,
        mobileTopSize,
        mobileBottomSize,
        arc,
        rotation,
        letterSpacing,
        lineGap,
        mobileLineGap,
        responsive,
        breakpoint,
        wordGap,
    ])

    const restart = React.useCallback(() => {
        if (trigger === "hover" || replay) setRun((value) => value + 1)
    }, [replay, trigger])

    const commonText: React.CSSProperties = {
        color: textColor,
        paintOrder: "stroke fill",
        textShadow: `${shadowX}px ${shadowY}px 0 ${strokeColor}`,
        textTransform: "uppercase",
        ...font,
    }

    const renderTopLetter = (
        letter: string,
        index: number,
        wordLength: number,
        animationIndex: number
    ) => {
        const center = (wordLength - 1) / 2
        const offset = index - center
        const normalized = center > 0 ? offset / center : 0
        const angle = normalized * rotation
        const rise = Math.pow(Math.abs(normalized), 1.65) * arc
        const capitalBoost = /[A-ZА-ЯЁ]/.test(letter) ? 1.2 : 1
        const animate = !isStatic

        return (
            <span
                data-dbt-letter
                key={`${run}-top-${index}-${letter}`}
                aria-hidden="true"
                style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    fontSize: activeTopSize * capitalBoost,
                    marginInline:
                        letter === " "
                            ? Math.max(8, wordGap * 0.5)
                            : letterSpacing / 2,
                    transform: `translateY(${rise}px) rotate(${angle}deg)`,
                    transformOrigin: `50% ${activeTopSize * 1.18}px`,
                    opacity: animate ? 0 : 1,
                    animation: animate
                        ? `dbt-pop ${duration}s cubic-bezier(.68,-.55,.265,1.55) forwards`
                        : undefined,
                    animationDelay: animate
                        ? `${delay + animationIndex * stagger}s`
                        : undefined,
                }}
            >
                {letter === " " ? "\u00A0" : letter}
            </span>
        )
    }

    return (
        <section
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                backgroundImage: `radial-gradient(circle, color-mix(in srgb, ${dotColor} ${dotOpacity * 100}%, transparent) ${Math.max(1, patternSize * 0.1)}px, transparent ${Math.max(1.5, patternSize * 0.11)}px)`,
                backgroundSize: `${patternSize}px ${patternSize}px`,
                isolation: "isolate",
                visibility:
                    isStatic || rootWidth !== null ? "visible" : "hidden",
            }}
            onMouseEnter={restart}
            aria-label={`${lineOne} ${lineTwo}`.trim()}
        >
            <style>{`
                @keyframes dbt-pop {
                    0% { opacity: 0; translate: 0 45%; scale: .15; }
                    65% { opacity: 1; translate: 0 -4%; scale: 1.06; }
                    100% { opacity: 1; translate: 0 0; scale: 1; }
                }
                @keyframes dbt-fade {
                    from { opacity: 0; translate: 8px 0; }
                    to { opacity: 1; translate: 0 0; }
                }
                @media (prefers-reduced-motion: reduce) {
                    [data-dbt-letter] { animation: none !important; opacity: 1 !important; }
                }
            `}</style>
            <div
                ref={contentRef}
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: "max-content",
                    textAlign: "center",
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: "center center",
                    paddingTop: Math.max(18, activeTopSize * 0.22),
                    paddingBottom: Math.max(
                        18,
                        activeBottomSize * 0.35 + shadowY
                    ),
                    paddingLeft:
                        Math.max(18, activeTopSize * 0.18) +
                        Math.max(0, -shadowX),
                    paddingRight:
                        Math.max(18, activeTopSize * 0.18) +
                        Math.max(0, shadowX) +
                        Math.max(topStrokeWidth, bottomStrokeWidth),
                }}
            >
                <div
                    style={{
                        ...commonText,
                        WebkitTextStroke: `${topStrokeWidth}px ${strokeColor}`,
                        display: "flex",
                        flexDirection: stacked ? "column" : "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: stacked
                            ? Math.max(4, wordGap * 0.2)
                            : wordGap + activeTopSize * 0.12,
                        lineHeight: 0.72,
                        whiteSpace: "nowrap",
                    }}
                >
                    {stacked ? (
                        words.map((word, wordIndex) => {
                            const previousLetters = words
                                .slice(0, wordIndex)
                                .reduce((sum, item) => sum + item.length, 0)
                            return (
                                <div
                                    key={`${word}-${wordIndex}`}
                                    style={{
                                        whiteSpace: "nowrap",
                                        paddingInline: activeTopSize * 0.08,
                                        marginTop:
                                            wordIndex > 0
                                                ? -activeTopSize * 0.08
                                                : 0,
                                    }}
                                >
                                    {split(word).map((letter, index) =>
                                        renderTopLetter(
                                            letter,
                                            index,
                                            word.length,
                                            previousLetters + index
                                        )
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div style={{ whiteSpace: "nowrap" }}>
                            {top.map((letter, index) =>
                                renderTopLetter(
                                    letter,
                                    index,
                                    top.length,
                                    index
                                )
                            )}
                        </div>
                    )}
                </div>
                <div
                    style={{
                        ...commonText,
                        WebkitTextStroke: `${bottomStrokeWidth}px ${strokeColor}`,
                        marginTop: activeLineGap,
                        fontSize: activeBottomSize,
                        lineHeight: 0.9,
                        letterSpacing,
                        whiteSpace: "nowrap",
                        textShadow: `${Math.max(2, shadowX * 0.55)}px ${Math.max(2, shadowY * 0.55)}px 0 ${strokeColor}`,
                    }}
                >
                    {bottom.map((letter, index) => (
                        <span
                            data-dbt-letter
                            aria-hidden="true"
                            key={`${run}-bottom-${index}-${letter}`}
                            style={{
                                display: "inline-block",
                                whiteSpace: "pre",
                                marginInline:
                                    letter === " "
                                        ? Math.max(8, activeBottomSize * 0.12)
                                        : 0,
                                opacity: isStatic ? 1 : 0,
                                animation: isStatic
                                    ? undefined
                                    : `dbt-fade ${duration * 0.75}s ease forwards`,
                                animationDelay: isStatic
                                    ? undefined
                                    : `${delay + (top.length + index) * stagger}s`,
                            }}
                        >
                            {letter === " " ? "\u00A0" : letter}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}

DreamBigText.defaultProps = {
    lineOne: "Dream Big",
    lineTwo: "Start small",
    textColor: "#FEDC0C",
    strokeColor: "#0A1C20",
    backgroundColor: "#6FBFD9",
    dotColor: "#0A1C20",
    dotOpacity: 0.1,
    patternSize: 40,
    font: {
        fontFamily: "Luckiest Guy, Impact, Arial Black, sans-serif",
        fontWeight: 400,
    },
    topSize: 150,
    bottomSize: 52,
    topStrokeWidth: 4,
    bottomStrokeWidth: 2,
    shadowX: 7,
    shadowY: 9,
    arc: 28,
    rotation: 18,
    letterSpacing: -4,
    lineGap: 38,
    responsive: "auto",
    breakpoint: 600,
    mobileTopSize: 96,
    mobileBottomSize: 34,
    mobileLineGap: 28,
    wordGap: 32,
    duration: 0.55,
    stagger: 0.1,
    delay: 0.15,
    replay: true,
    trigger: "appear",
    style: { width: "100%", height: "100%" },
}

addPropertyControls(DreamBigText, {
    lineOne: {
        type: ControlType.String,
        title: "Top Text",
        defaultValue: "Dream Big",
    },
    lineTwo: {
        type: ControlType.String,
        title: "Bottom Text",
        defaultValue: "Start small",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultValue: { fontFamily: "Luckiest Guy", fontWeight: "400" },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FEDC0C",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke",
        defaultValue: "#0A1C20",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#6FBFD9",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Dots",
        defaultValue: "#0A1C20",
    },
    dotOpacity: {
        type: ControlType.Number,
        title: "Dot Opacity",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
    },
    patternSize: {
        type: ControlType.Number,
        title: "Pattern",
        min: 8,
        max: 100,
        step: 1,
        defaultValue: 40,
        unit: "px",
    },
    topSize: {
        type: ControlType.Number,
        title: "Top Size",
        min: 20,
        max: 300,
        step: 1,
        defaultValue: 150,
        unit: "px",
    },
    bottomSize: {
        type: ControlType.Number,
        title: "Bottom Size",
        min: 10,
        max: 140,
        step: 1,
        defaultValue: 52,
        unit: "px",
    },
    topStrokeWidth: {
        type: ControlType.Number,
        title: "Top Stroke",
        min: 0,
        max: 12,
        step: 0.5,
        defaultValue: 4,
        unit: "px",
    },
    bottomStrokeWidth: {
        type: ControlType.Number,
        title: "Bottom Stroke",
        min: 0,
        max: 12,
        step: 0.5,
        defaultValue: 2,
        unit: "px",
    },
    shadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        min: 0,
        max: 24,
        step: 1,
        defaultValue: 7,
        unit: "px",
    },
    shadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        min: 0,
        max: 30,
        step: 1,
        defaultValue: 9,
        unit: "px",
    },
    arc: {
        type: ControlType.Number,
        title: "Arc",
        min: -80,
        max: 100,
        step: 1,
        defaultValue: 28,
        unit: "px",
    },
    rotation: {
        type: ControlType.Number,
        title: "Fan",
        min: 0,
        max: 45,
        step: 1,
        defaultValue: 18,
        unit: "°",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        min: -20,
        max: 30,
        step: 1,
        defaultValue: -4,
        unit: "px",
    },
    lineGap: {
        type: ControlType.Number,
        title: "Line Gap",
        min: -20,
        max: 140,
        step: 1,
        defaultValue: 38,
        unit: "px",
    },
    responsive: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["auto", "single", "stack"],
        optionTitles: ["Auto", "Single Line", "Stack"],
        defaultValue: "auto",
    },
    breakpoint: {
        type: ControlType.Number,
        title: "Breakpoint",
        min: 240,
        max: 1000,
        step: 10,
        defaultValue: 600,
        unit: "px",
        hidden: (props) => props.responsive !== "auto",
    },
    mobileTopSize: {
        type: ControlType.Number,
        title: "Mobile Top",
        min: 20,
        max: 220,
        step: 1,
        defaultValue: 96,
        unit: "px",
        hidden: (props) => props.responsive === "single",
    },
    mobileBottomSize: {
        type: ControlType.Number,
        title: "Mobile Bottom",
        min: 10,
        max: 100,
        step: 1,
        defaultValue: 34,
        unit: "px",
        hidden: (props) => props.responsive === "single",
    },
    mobileLineGap: {
        type: ControlType.Number,
        title: "Mobile Gap",
        min: -20,
        max: 100,
        step: 1,
        defaultValue: 28,
        unit: "px",
        hidden: (props) => props.responsive === "single",
    },
    wordGap: {
        type: ControlType.Number,
        title: "Word Gap",
        min: 0,
        max: 120,
        step: 1,
        defaultValue: 32,
        unit: "px",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["appear", "hover"],
        optionTitles: ["On Appear", "On Hover"],
        displaySegmentedControl: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 2,
        step: 0.05,
        defaultValue: 0.55,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 0.4,
        step: 0.01,
        defaultValue: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 0.15,
        unit: "s",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
