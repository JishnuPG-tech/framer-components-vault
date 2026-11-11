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


/* User instructions:
Create a component where the first letter is a drop cap, and its top aligns with the body text. Make the perfect logic with appropriate controls. */

type FontLike = {
    fontSize?: string | number
    lineHeight?: string | number
    letterSpacing?: string | number
    textAlign?: any
    fontFamily?: string
    fontWeight?: any
    fontStyle?: any
    textDecoration?: any
    textTransform?: any
} & React.CSSProperties

type SplitText = {
    leading: string
    first: string
    rest: string
}

type Props = {
    text: string
    topLines: number
    enableDropCap: boolean
    capMode: "text" | "image"
    capImage?: { src: string; srcSet?: string; alt?: string }
    capImageWidth: number
    capImageHeight: number
    capImageFit: "cover" | "contain"
    capImageRadius: number

    bodyFont: FontLike
    capFont: FontLike

    bodyColor: string
    capColor: string

    capLineHeight: number
    capTopOffset: number
    capRightGap: number
    capIndent: number

    clipContent: boolean
    style?: React.CSSProperties
}


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function DropCapText(props: Props) {
    const {
        text,
        topLines,
        enableDropCap,
        capMode,
        capImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Drop cap image",
        },
        capImageWidth,
        capImageHeight,
        capImageFit,
        capImageRadius,
        bodyFont,
        capFont,
        bodyColor,
        capColor,
        capLineHeight,
        capTopOffset,
        capRightGap,
        capIndent,
        clipContent,
        style,
    } = props


    const rawText = React.useMemo(() => {
        const raw = String(text ?? "")
        return raw.replace(/\r\n/g, "\n")
    }, [text])

    const topLinesPrefix = React.useMemo(() => {
        return "\n".repeat(Math.max(0, Math.round(Number(topLines) || 0)))
    }, [topLines])


    const containerStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...style,
            position: "relative",
            width: (style as any)?.width ?? "100%",
            maxWidth: "100%",
            height: (style as any)?.height ?? "auto",
            display: "block",
            overflow: clipContent ? "hidden" : "visible",
            color: bodyColor,
        }),
        [style, clipContent, bodyColor],
    )

    const bodyTextStyle: React.CSSProperties = React.useMemo(
        () => ({
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            ...bodyFont,
            color: bodyColor,
        }),
        [bodyFont, bodyColor],
    )

    const capStyle: React.CSSProperties = React.useMemo(
        () => ({
            float: "left",
            display: "block",
            ...capFont,
            fontSize: capFont?.fontSize ?? "52px",
            lineHeight: capLineHeight,
            marginTop: capTopOffset,
            marginRight: capRightGap,
            marginLeft: capIndent,
            color: capColor,
        }),
        [capFont, capLineHeight, capTopOffset, capRightGap, capIndent, capColor],
    )

    const capImageStyle: React.CSSProperties = React.useMemo(
        () => ({
            float: "left",
            display: "block",
            width: capImageWidth,
            height: capImageHeight,
            objectFit: capImageFit,
            borderRadius: capImageRadius,
            marginTop: capTopOffset,
            marginRight: capRightGap,
            marginLeft: capIndent,
            userSelect: "none",
        }),
        [capImageWidth, capImageHeight, capImageFit, capImageRadius, capTopOffset, capRightGap, capIndent],
    )

    const firstParaSplit = React.useMemo<SplitText>(() => {
        const source = String(rawText ?? "")
        if (!source) return { leading: "", first: "", rest: "" }

        let i = 0
        while (i < source.length && /\s/.test(source[i])) i++
        if (i >= source.length) return { leading: source, first: "", rest: "" }

        const leading = source.slice(0, i)
        const remaining = source.slice(i)

        const getFirstGrapheme = (str: string): { first: string; rest: string } => {
            if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
                try {
                    const seg = new (Intl as any).Segmenter(undefined, { granularity: "grapheme" })
                    const it = seg.segment(str)[Symbol.iterator]()
                    const firstSeg = it.next()
                    if (!firstSeg.done && firstSeg.value?.segment) {
                        const first = firstSeg.value.segment as string
                        return { first, rest: str.slice(first.length) }
                    }
                } catch {
                    // fallthrough
                }
            }
            const arr = Array.from(str)
            const first = arr[0] ?? ""
            const rest = arr.slice(1).join("")
            return { first, rest }
        }

        const { first, rest } = getFirstGrapheme(remaining)
        return { leading, first, rest }
    }, [rawText])

    return (
        <div style={containerStyle} aria-label="Drop cap text">
            <p
                style={{
                    ...bodyTextStyle,
                    margin: 0,
                    // Contain the floated cap reliably across render targets
                    display: "block",
                }}
            >
                {firstParaSplit.leading}
                {enableDropCap && firstParaSplit.first ? (
                    capMode === "image" ? (
                        <img
                            {...capImage}
                            alt={capImage?.alt ?? ""}
                            style={capImageStyle}
                            aria-hidden={capImage?.alt ? undefined : true}
                        />
                    ) : (
                        <span aria-hidden="true" style={capStyle}>
                            {firstParaSplit.first}
                        </span>
                    )
                ) : null}
                <span>
                    {enableDropCap && firstParaSplit.first
                        ? `${topLinesPrefix}${firstParaSplit.rest}`
                        : `${topLinesPrefix}${rawText}`}
                </span>
                {enableDropCap && firstParaSplit.first ? (
                    <span aria-hidden="true" style={{ display: "block", clear: "both" }} />
                ) : null}
            </p>
        </div>
    )
}

addPropertyControls(DropCapText, {
    text: {
        type: ControlType.String,
        title: "Text",
        description: "Tip: use Shift+Enter to add a new line.",
        defaultValue: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        displayTextArea: true,
    },
    topLines: {
        type: ControlType.Number,
        title: "Start line",
        description: "Adds blank lines before the text (like pressing Enter).",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 1,
    },
    enableDropCap: {
        type: ControlType.Boolean,
        title: "Drop cap",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    capMode: {
        type: ControlType.Enum,
        title: "Cap mode",
        defaultValue: "text",
        options: ["text", "image"],
        optionTitles: ["Text", "Image"],
        displaySegmentedControl: true,
        hidden: ({ enableDropCap }) => !enableDropCap,
    },
    capImage: {
        type: ControlType.ResponsiveImage,
        title: "Cap image",
        hidden: ({ enableDropCap, capMode }) => !enableDropCap || capMode !== "image",
    },
    capImageWidth: {
        type: ControlType.Number,
        title: "Image width",
        defaultValue: 56,
        min: 8,
        max: 1200,
        step: 1,
        unit: "px",
        hidden: ({ enableDropCap, capMode }) => !enableDropCap || capMode !== "image",
    },
    capImageHeight: {
        type: ControlType.Number,
        title: "Image height",
        defaultValue: 56,
        min: 8,
        max: 1200,
        step: 1,
        unit: "px",
        hidden: ({ enableDropCap, capMode }) => !enableDropCap || capMode !== "image",
    },
    capImageFit: {
        type: ControlType.Enum,
        title: "Image fit",
        description: "Cover: fills the box (may crop). Contain: shows the whole image (may add empty space).",
        defaultValue: "cover",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        displaySegmentedControl: true,
        hidden: ({ enableDropCap, capMode }) => !enableDropCap || capMode !== "image",
    },
    capImageRadius: {
        type: ControlType.Number,
        title: "Image radius",
        defaultValue: 8,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        hidden: ({ enableDropCap, capMode }) => !enableDropCap || capMode !== "image",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            lineHeight: "1.5em",
            letterSpacing: "-0.01em",
            variant: "Regular",
        },
    },
    capFont: {
        type: ControlType.Font,
        title: "Cap",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "52px",
            lineHeight: "1em",
            letterSpacing: "-0.04em",
            variant: "Bold",
        },
        hidden: ({ enableDropCap, capMode }) => !enableDropCap || capMode !== "text",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body color",
        defaultValue: "#000000",
    },
    capColor: {
        type: ControlType.Color,
        title: "Cap color",
        defaultValue: "#000000",
        hidden: ({ enableDropCap, capMode }) => !enableDropCap || capMode !== "text",
    },
    capLineHeight: {
        type: ControlType.Number,
        title: "Cap line height",
        description: "Adjusts the drop cap’s internal line-height (tighter/looser vertical spacing).",
        defaultValue: 0.9,
        min: 0.5,
        max: 2.5,
        step: 0.05,
        hidden: ({ enableDropCap, capMode }) => !enableDropCap || capMode !== "text",
    },
    capTopOffset: {
        type: ControlType.Number,
        title: "Cap top",
        description: "Moves the drop cap up/down to better align its top with the body text.",
        defaultValue: 0,
        min: -40,
        max: 40,
        step: 1,
        unit: "px",
        hidden: ({ enableDropCap }) => !enableDropCap,
    },
    capRightGap: {
        type: ControlType.Number,
        title: "Cap gap",
        description: "Horizontal space between the drop cap and the body text.",
        defaultValue: 8,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
        hidden: ({ enableDropCap }) => !enableDropCap,
    },
    capIndent: {
        type: ControlType.Number,
        title: "Cap indent",
        description: "Adds left indent before the drop cap (useful for quotes or inset paragraphs).",
        defaultValue: 0,
        min: -200,
        max: 200,
        step: 1,
        unit: "px",
        hidden: ({ enableDropCap }) => !enableDropCap,
    },
    clipContent: {
        type: ControlType.Boolean,
        title: "Clipping",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
