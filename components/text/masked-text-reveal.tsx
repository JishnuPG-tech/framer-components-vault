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

import {
    motion,
    useInView,
    type Transition,
    type Variants,
} from "framer-motion"

type TextAlign = "left" | "center" | "right"

type Props = {
    text: string
    headingTag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p"
    uppercase: boolean
    hyphenate: boolean
    language: string
    textColor: string
    font: any
    align: TextAlign
    stagger: number
    fromY: number
    rotateFrom: number
    blur: number
    once: boolean
    viewportAmount: number
    animation: Transition
    wordMaskPadding: number
    style?: React.CSSProperties
}

/**
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight auto
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function MaskedTextReveal(props: Props) {
    const {
        text,
        headingTag,
        uppercase,
        hyphenate,
        language,
        textColor,
        font,
        align,
        stagger,
        fromY,
        rotateFrom,
        blur,
        once,
        viewportAmount,
        animation,
        wordMaskPadding,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLElement | null>(null)
    const inView = useInView(containerRef, {
        amount: viewportAmount,
        once: isStatic ? true : once,
    })
    const isItalic = React.useMemo(() => {
        const f: any = font ?? {}
        if (f.fontStyle === "italic") return true
        if (typeof f.variant === "string" && f.variant.toLowerCase().includes("italic")) return true
        return false
    }, [font])
    const HeadingTag = (headingTag || "h1") as
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "p"

    const words = React.useMemo(() => {
        const trimmed = (text ?? "").trim()
        if (!trimmed) return []
        return trimmed.split(/\s+/g)
    }, [text])

    const wordVariants = React.useMemo(() => {
        const makeTransition = (i: number): Transition => {
            const t = (animation ?? {}) as Transition
            const animDelay =
                typeof (t as any).delay === "number" ? (t as any).delay : 0
            return {
                ...t,
                delay: animDelay + i * stagger,
            } as Transition
        }

        return {
            hidden: {
                y: fromY,
                rotate: rotateFrom,
                filter: blur > 0 ? `blur(${blur}px)` : "blur(0px)",
                opacity: 1,
            },
            visible: (i: number) => ({
                y: 0,
                rotate: 0,
                filter: "blur(0px)",
                opacity: 1,
                transition: makeTransition(i),
            }),
        } as Variants
    }, [fromY, rotateFrom, blur, stagger, animation])

    const showFinal = isStatic || (words.length > 0 && inView)

    return (
        <HeadingTag
            ref={containerRef as any}
            aria-label={text}
            lang={language || "de"}
            style={{
                ...font,
                ...style,
                margin: 0,
                padding: 0,
                display: "flex",
                flexWrap: "wrap",
                columnGap: "0.28em", // Das ersetzt die physischen Leerzeichen!
                justifyContent:
                    align === "center"
                        ? "center"
                        : align === "right"
                          ? "flex-end"
                          : "flex-start",
                color: textColor,
                textTransform: uppercase ? "uppercase" : "none",
                hyphens: hyphenate ? ("auto" as any) : ("manual" as any),
                WebkitHyphens: hyphenate ? ("auto" as any) : ("manual" as any),
                overflowWrap: hyphenate ? "anywhere" : ("normal" as any),
                wordBreak: ("normal" as any),
            }}
        >
            {words.length === 0 ? (
                <span style={{ minWidth: "max-content" }}>{text}</span>
            ) : (
                words.map((w, i) =>
                    hyphenate && w.length > 12 ? (
                        <span
                            key={`${w}-${i}`}
                            aria-hidden="true"
                            style={{
                                display: "inline",
                            }}
                        >
                            {w}
                        </span>
                    ) : (
                        <span
                            key={`${w}-${i}`}
                            aria-hidden="true"
                            style={{
                                display: "inline-flex",
                                overflow: "hidden",
                                paddingTop: isItalic ? "0.12em" : 0,
                                marginTop: isItalic ? "-0.12em" : 0,
                                paddingLeft: isItalic ? "0.08em" : 0,
                                paddingRight: isItalic ? "0.08em" : 0,
                                marginLeft: isItalic ? "-0.08em" : 0,
                                marginRight: isItalic ? "-0.08em" : 0,
                                paddingBottom: wordMaskPadding,
                                marginBottom: -wordMaskPadding,
                            }}
                        >
                            <motion.span
                                custom={i}
                                variants={wordVariants}
                                initial={isStatic ? false : "hidden"}
                                animate={showFinal ? "visible" : "hidden"}
                                style={{
                                    display: "inline-block",
                                    transformOrigin: "50% 100%",
                                    willChange: isStatic
                                        ? "auto"
                                        : "transform, filter",
                                }}
                            >
                                {w}
                            </motion.span>
                        </span>
                    )
                )
            )}
        </HeadingTag>
    )
}

addPropertyControls(MaskedTextReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Text",
    },
    headingTag: {
        type: ControlType.Enum,
        title: "SEO Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "P"],
        defaultValue: "h1",
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    hyphenate: {
        type: ControlType.Boolean,
        title: "Hyphenation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    language: {
        type: ControlType.String,
        title: "Language",
        defaultValue: "de",
        placeholder: "de, en, …",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#0A0A0A",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "5.25rem",
            variant: "Bold",
            letterSpacing: "-2px",
            lineHeight: "1em",
            textAlign: "left",
        },
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    fromY: {
        type: ControlType.Number,
        title: "From Y",
        defaultValue: 200,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
    },
    rotateFrom: {
        type: ControlType.Number,
        title: "Rotate",
        defaultValue: 4,
        min: -45,
        max: 45,
        step: 1,
        unit: "deg",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 0.5,
        unit: "px",
    },
    animation: {
        type: ControlType.Transition,
        title: "Animation",
        defaultValue: {
            type: "tween",
            ease: [0, 0.75, 0.25, 0.98],
            duration: 1,
            delay: 0.2,
        },
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.08,
        min: 0,
        max: 1,
        step: 0.01,
        unit: "s",
    },
    viewportAmount: {
        type: ControlType.Number,
        title: "InView %",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.05,
    },
    wordMaskPadding: {
        type: ControlType.Number,
        title: "Mask Pad",
        defaultValue: 4,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },
    once: {
        type: ControlType.Boolean,
        title: "Once",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
