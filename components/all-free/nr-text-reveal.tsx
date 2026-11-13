import {
    useState,
    useEffect,
    useRef,
    useMemo,
    Fragment,
    startTransition,
} from "react"
import type { CSSProperties, ComponentType, ElementType } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
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
 * NR — Text Reveal
 *
 * Editorial split-text reveal. Text is broken into characters, words or
 * lines and staggered into place on scroll. The full string stays readable
 * to screen readers, and the animation switches off for reduced-motion.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 320
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500&display=swap');`

function FontImport() {
    return <style>{FONT_IMPORT}</style>
}

const FONT_FAMILIES = ["Cormorant Garamond", "DM Sans", "DM Mono"] as const
type FontFamily = (typeof FONT_FAMILIES)[number]

const GENERIC: Record<FontFamily, string> = {
    "Cormorant Garamond": "serif",
    "DM Sans": "sans-serif",
    "DM Mono": "monospace",
}

function fontStack(family: FontFamily): string {
    return `"${family}", ${GENERIC[family] ?? "sans-serif"}`
}

const TAGS = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    p: "p",
    div: "div",
} as const

const ALIGN_ITEMS = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
} as const

// Slow-out curve: fast start, long settle. Reads as considered rather than snappy.
const EASE = [0.22, 1, 0.36, 1] as const

type SplitMode = "characters" | "words" | "lines"
type Effect = "rise" | "fade" | "mask" | "blur"

type Palette = {
    text: string
    eyebrow: string
    rule: string
    background: string
}

type TypeSpec = {
    size: number
    weight: number
    lineHeight: number
    tracking: number
    italic: boolean
    eyebrowSize: number
    eyebrowTracking: number
}

type LayoutSpec = {
    paddingX: number
    paddingY: number
    headGap: number
    ruleGap: number
}

type Props = {
    text: string
    eyebrow: string
    showEyebrow: boolean
    showRule: boolean
    tag: keyof typeof TAGS
    split: SplitMode
    effect: Effect
    trigger: "scroll" | "mount"
    once: boolean
    amount: number
    distance: number
    duration: number
    stagger: number
    delay: number
    align: keyof typeof ALIGN_ITEMS
    textFontFamily: FontFamily
    eyebrowFontFamily: FontFamily
    typography: TypeSpec
    colors: Palette
    layout: LayoutSpec
    minWidth: number
    maxWidth: number
    sideMargin: number
    fixedHeight: boolean
    heightValue: number
    style?: CSSProperties
}

type Piece = { text: string; index: number }

/** Words hold their own pieces so a character split still wraps on word boundaries. */
function buildLines(source: string, split: SplitMode): Piece[][][] {
    let index = 0

    return source.split("\n").map((line) => {
        if (split === "lines") {
            const piece = { text: line, index }
            index += 1
            return [[piece]]
        }

        return line
            .split(" ")
            .filter((word) => word.length > 0)
            .map((word) => {
                if (split === "characters") {
                    return Array.from(word).map((character) => {
                        const piece = { text: character, index }
                        index += 1
                        return piece
                    })
                }

                const piece = { text: word, index }
                index += 1
                return [piece]
            })
    })
}

function hiddenState(effect: Effect, distance: number) {
    if (effect === "fade") return { opacity: 0 }
    if (effect === "blur")
        return { opacity: 0, filter: `blur(${Math.max(distance / 2, 4)}px)` }
    // A mask travels the full height of its own clip box, so it ignores distance.
    if (effect === "mask") return { opacity: 1, y: "110%" }
    return { opacity: 0, y: distance }
}

function shownState(effect: Effect) {
    if (effect === "fade") return { opacity: 1 }
    if (effect === "blur") return { opacity: 1, filter: "blur(0px)" }
    return { opacity: 1, y: 0 }
}

export default function NRTextReveal(props: Props) {
    const {
        text,
        eyebrow,
        showEyebrow,
        showRule,
        tag,
        split,
        effect,
        trigger,
        once,
        amount,
        distance,
        duration,
        stagger,
        delay,
        align,
        textFontFamily,
        eyebrowFontFamily,
        typography,
        colors,
        layout,
        minWidth,
        maxWidth,
        sideMargin,
        fixedHeight,
        heightValue,
        style,
    } = props

    // True on the canvas and during export or thumbnail rendering. Combined
    // with the reduced-motion preference it drops every animated element for
    // a plain one, so nothing is left measuring or running.
    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const noMotion = isStatic || prefersReducedMotion === true

    const frameRef = useRef<HTMLDivElement>(null)
    const inView = useInView(frameRef, { once, amount })

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        startTransition(() => setMounted(true))
    }, [])

    const revealed = noMotion ? true : trigger === "scroll" ? inView : mounted

    const lines = useMemo(() => buildLines(text ?? "", split), [text, split])

    const Tag: ElementType = TAGS[tag]
    const isMask = effect === "mask"
    const hidden = hiddenState(effect, distance)
    const shown = shownState(effect)
    // The heading waits for the eyebrow and its rule to land first.
    const textDelay = showEyebrow && eyebrow ? delay + 120 : delay

    // Outer box: centres the frame and keeps it off the device edges.
    const wrapperStyle: CSSProperties = {
        ...style,
        display: "flex",
        justifyContent: "center",
        width: "100%",
        boxSizing: "border-box",
        paddingLeft: sideMargin || undefined,
        paddingRight: sideMargin || undefined,
        height: fixedHeight ? heightValue : undefined,
    }

    // Frame: fluid within min/max so the width never tracks the text length.
    const frameStyle: CSSProperties = {
        display: "flex",
        flexDirection: "column",
        alignItems: ALIGN_ITEMS[align],
        gap: layout.headGap,
        width: "100%",
        minWidth: minWidth || undefined,
        maxWidth: maxWidth || undefined,
        height: fixedHeight ? heightValue : undefined,
        minHeight: fixedHeight ? heightValue : undefined,
        overflow: fixedHeight ? "hidden" : undefined,
        boxSizing: "border-box",
        padding: `${layout.paddingY}px ${layout.paddingX}px`,
        background: colors.background,
        borderRadius: 0,
    }

    // A clip box per piece. The negative margin gives descenders room to sit
    // outside the mask without the line box growing.
    const pieceWrapStyle: CSSProperties = {
        display: "inline-block",
        verticalAlign: "bottom",
        overflow: isMask ? "hidden" : undefined,
        paddingBottom: isMask ? "0.16em" : undefined,
        marginBottom: isMask ? "-0.16em" : undefined,
    }

    const pieceInnerStyle: CSSProperties = { display: "inline-block" }

    const eyebrowStyle: CSSProperties = {
        fontFamily: fontStack(eyebrowFontFamily),
        fontWeight: 400,
        fontSize: typography.eyebrowSize,
        lineHeight: "1.4em",
        letterSpacing: `${typography.eyebrowTracking}em`,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        color: colors.eyebrow,
    }

    const ruleStyle: CSSProperties = {
        display: "block",
        flex: "1 1 auto",
        height: 1,
        background: colors.rule,
        transformOrigin: "left center",
    }

    const headingStyle: CSSProperties = {
        fontFamily: fontStack(textFontFamily),
        fontWeight: typography.weight,
        fontSize: typography.size,
        lineHeight: typography.lineHeight,
        letterSpacing: `${typography.tracking}em`,
        fontStyle: typography.italic ? "italic" : "normal",
        color: colors.text,
        textAlign: align,
        width: "100%",
        margin: 0,
    }

    if (!text || text.trim().length === 0) {
        return (
            <div style={wrapperStyle}>
                <FontImport />
                <div
                    ref={frameRef}
                    style={{
                        ...frameStyle,
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: fixedHeight ? heightValue : 120,
                        border: `1px solid ${colors.rule}`,
                        ...eyebrowStyle,
                        color: colors.rule,
                    }}
                >
                    Add text in the properties panel
                </div>
            </div>
        )
    }

    const renderPiece = (piece: Piece) => (
        <span key={piece.index} style={pieceWrapStyle}>
            {noMotion ? (
                <span style={pieceInnerStyle}>{piece.text}</span>
            ) : (
                <motion.span
                    style={pieceInnerStyle}
                    initial={hidden}
                    animate={revealed ? shown : hidden}
                    transition={{
                        duration: duration / 1000,
                        delay: (textDelay + piece.index * stagger) / 1000,
                        ease: EASE,
                    }}
                >
                    {piece.text}
                </motion.span>
            )}
        </span>
    )

    return (
        <div style={wrapperStyle}>
            <FontImport />
            <div ref={frameRef} style={frameStyle}>
                {showEyebrow && eyebrow ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: layout.ruleGap,
                            width: "100%",
                        }}
                    >
                        <span style={pieceWrapStyle}>
                            {noMotion ? (
                                <span
                                    style={{
                                        ...pieceInnerStyle,
                                        ...eyebrowStyle,
                                    }}
                                >
                                    {eyebrow}
                                </span>
                            ) : (
                                <motion.span
                                    style={{
                                        ...pieceInnerStyle,
                                        ...eyebrowStyle,
                                    }}
                                    initial={hidden}
                                    animate={revealed ? shown : hidden}
                                    transition={{
                                        duration: duration / 1000,
                                        delay: delay / 1000,
                                        ease: EASE,
                                    }}
                                >
                                    {eyebrow}
                                </motion.span>
                            )}
                        </span>

                        {showRule ? (
                            noMotion ? (
                                <span style={ruleStyle} />
                            ) : (
                                <motion.span
                                    style={ruleStyle}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: revealed ? 1 : 0 }}
                                    transition={{
                                        duration: (duration * 1.6) / 1000,
                                        delay: (delay + 60) / 1000,
                                        ease: EASE,
                                    }}
                                />
                            )
                        ) : null}
                    </div>
                ) : null}

                {/* The split spans are decorative: assistive technology reads
                    the label instead, so the sentence is never spelled out. */}
                <Tag style={headingStyle} aria-label={text}>
                    <span aria-hidden="true">
                        {lines.map((words, lineIndex) => (
                            <span
                                key={lineIndex}
                                style={{ display: "block", minHeight: "1em" }}
                            >
                                {words.map((pieces, wordIndex) => (
                                    <Fragment key={wordIndex}>
                                        <span
                                            style={{ display: "inline-block" }}
                                        >
                                            {pieces.map(renderPiece)}
                                        </span>
                                        {wordIndex < words.length - 1
                                            ? " "
                                            : null}
                                    </Fragment>
                                ))}
                            </span>
                        ))}
                    </span>
                </Tag>
            </div>
        </div>
    )
}

NRTextReveal.displayName = "NR — Text Reveal"

NRTextReveal.defaultProps = {
    text: "Type is the interface.\nEverything else is decoration.",
    eyebrow: "Typography",
    showEyebrow: true,
    showRule: true,
    tag: "h2",
    // Words by default: splitting a serif headline per character breaks the shaping
    // run, so kerning pairs and fi/fl ligatures are lost. Character split stays
    // available and suits short display lines.
    split: "words",
    effect: "rise",
    trigger: "scroll",
    once: true,
    amount: 0.4,
    distance: 24,
    duration: 700,
    stagger: 24,
    delay: 0,
    align: "left",
    textFontFamily: "Cormorant Garamond",
    eyebrowFontFamily: "DM Mono",
    typography: {
        size: 56,
        weight: 300,
        lineHeight: 1.08,
        tracking: -0.02,
        italic: false,
        eyebrowSize: 11,
        eyebrowTracking: 0.16,
    },
    colors: {
        text: "#0C0C0B",
        eyebrow: "#E8604A",
        rule: "#D4CFC6",
        background: "#F6F2EB",
    },
    layout: {
        paddingX: 24,
        paddingY: 24,
        headGap: 32,
        ruleGap: 16,
    },
    minWidth: 320,
    maxWidth: 720,
    sideMargin: 0,
    fixedHeight: false,
    heightValue: 320,
} satisfies Partial<Props>

addPropertyControls(NRTextReveal, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: "Type is the interface.\nEverything else is decoration.",
        description:
            "Line breaks are kept. Long copy is lighter to animate by word.",
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["h1", "h2", "h3", "p", "div"],
        optionTitles: ["H1", "H2", "H3", "Paragraph", "Div"],
        defaultValue: "h2",
    },
    showEyebrow: {
        type: ControlType.Boolean,
        title: "Eyebrow",
        defaultValue: true,
    },
    eyebrow: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Typography",
        hidden: (props: Partial<Props>) => !props.showEyebrow,
    },
    showRule: {
        type: ControlType.Boolean,
        title: "Rule Line",
        defaultValue: true,
        hidden: (props: Partial<Props>) => !props.showEyebrow,
    },
    split: {
        type: ControlType.Enum,
        title: "Split By",
        options: ["characters", "words", "lines"],
        optionTitles: ["Characters", "Words", "Lines"],
        defaultValue: "words",
        displaySegmentedControl: true,
    },
    effect: {
        type: ControlType.Enum,
        title: "Effect",
        options: ["rise", "fade", "mask", "blur"],
        optionTitles: ["Rise", "Fade", "Mask", "Blur"],
        defaultValue: "rise",
    },
    distance: {
        type: ControlType.Number,
        title: "Distance",
        min: 4,
        max: 200,
        step: 4,
        unit: "px",
        defaultValue: 24,
        hidden: (props: Partial<Props>) =>
            props.effect === "fade" ||
            props.effect === "mask" ||
            props.effect === "blur",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Play",
        options: ["scroll", "mount"],
        optionTitles: ["On Scroll", "On Load"],
        defaultValue: "scroll",
        displaySegmentedControl: true,
    },
    once: {
        type: ControlType.Boolean,
        title: "Repeat",
        defaultValue: true,
        enabledTitle: "Once",
        disabledTitle: "Always",
        hidden: (props: Partial<Props>) => props.trigger !== "scroll",
    },
    amount: {
        type: ControlType.Number,
        title: "Threshold",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.4,
        description: "How much of the block must be on screen before it plays.",
        hidden: (props: Partial<Props>) => props.trigger !== "scroll",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 100,
        max: 3000,
        step: 50,
        unit: "ms",
        defaultValue: 700,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 200,
        step: 2,
        unit: "ms",
        defaultValue: 24,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 3000,
        step: 50,
        unit: "ms",
        defaultValue: 0,
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    textFontFamily: {
        type: ControlType.Enum,
        title: "Text Font",
        options: [...FONT_FAMILIES],
        optionTitles: ["Cormorant", "DM Sans", "DM Mono"],
        defaultValue: "Cormorant Garamond",
    },
    eyebrowFontFamily: {
        type: ControlType.Enum,
        title: "Label Font",
        options: [...FONT_FAMILIES],
        optionTitles: ["Cormorant", "DM Sans", "DM Mono"],
        defaultValue: "DM Mono",
        hidden: (props: Partial<Props>) => !props.showEyebrow,
    },
    typography: {
        type: ControlType.Object,
        title: "Type",
        icon: "object",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 12,
                max: 200,
                step: 1,
                unit: "px",
                defaultValue: 56,
            },
            weight: {
                type: ControlType.Enum,
                title: "Weight",
                options: [300, 400, 500],
                optionTitles: ["Light", "Regular", "Medium"],
                defaultValue: 300,
            },
            lineHeight: {
                type: ControlType.Number,
                title: "Leading",
                min: 0.8,
                max: 2,
                step: 0.01,
                defaultValue: 1.08,
            },
            tracking: {
                type: ControlType.Number,
                title: "Tracking",
                min: -0.08,
                max: 0.3,
                step: 0.005,
                unit: "em",
                defaultValue: -0.02,
            },
            italic: {
                type: ControlType.Boolean,
                title: "Italic",
                defaultValue: false,
            },
            eyebrowSize: {
                type: ControlType.Number,
                title: "Label",
                min: 8,
                max: 24,
                step: 1,
                unit: "px",
                defaultValue: 11,
            },
            eyebrowTracking: {
                type: ControlType.Number,
                title: "Label Trk",
                min: 0,
                max: 0.4,
                step: 0.01,
                unit: "em",
                defaultValue: 0.16,
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        controls: {
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#0C0C0B",
            },
            eyebrow: {
                type: ControlType.Color,
                title: "Label",
                defaultValue: "#E8604A",
            },
            rule: {
                type: ControlType.Color,
                title: "Rule",
                defaultValue: "#D4CFC6",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#F6F2EB",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",
        controls: {
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                min: 0,
                max: 96,
                step: 8,
                unit: "px",
                defaultValue: 24,
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                min: 0,
                max: 96,
                step: 8,
                unit: "px",
                defaultValue: 24,
            },
            headGap: {
                type: ControlType.Number,
                title: "Label Gap",
                min: 0,
                max: 128,
                step: 8,
                unit: "px",
                defaultValue: 32,
            },
            ruleGap: {
                type: ControlType.Number,
                title: "Rule Gap",
                min: 0,
                max: 64,
                step: 8,
                unit: "px",
                defaultValue: 16,
            },
        },
    },
    minWidth: {
        type: ControlType.Number,
        title: "Min Width",
        min: 0,
        max: 1200,
        step: 8,
        unit: "px",
        defaultValue: 320,
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        min: 200,
        max: 1600,
        step: 8,
        unit: "px",
        defaultValue: 720,
        description:
            "The frame fills its container between Min and Max, so width never tracks the text.",
    },
    sideMargin: {
        type: ControlType.Number,
        title: "Side Margin",
        min: 0,
        max: 120,
        step: 4,
        unit: "px",
        defaultValue: 0,
    },
    fixedHeight: {
        type: ControlType.Boolean,
        title: "Height",
        defaultValue: false,
        enabledTitle: "Fixed",
        disabledTitle: "Auto",
    },
    heightValue: {
        type: ControlType.Number,
        title: "Value",
        min: 120,
        max: 1200,
        step: 8,
        unit: "px",
        defaultValue: 320,
        hidden: (props: Partial<Props>) => !props.fixedHeight,
    },
})

// Framer resolves these from its own Google Fonts catalog by family name, so
// family, weight and style are what matter here. Every family carries every
// weight the code can apply, since any family can be chosen for any slot.
const FONT_SOURCES: Record<FontFamily, string> = {
    "Cormorant Garamond":
        "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2",
    "DM Sans":
        "https://fonts.gstatic.com/s/dmsans/v17/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2",
    "DM Mono":
        "https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYthqQBK6PYK0.woff2",
}

const FONT_FACES = FONT_FAMILIES.flatMap((family) =>
    ["300", "400", "500"].flatMap((weight) =>
        ["normal", "italic"].map((style) => ({
            family,
            weight,
            style,
            url: FONT_SOURCES[family],
        }))
    )
)

addFonts(NRTextReveal as ComponentType<unknown>, FONT_FACES)
