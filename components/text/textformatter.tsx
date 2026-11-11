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


/* ───────────────────────────────────────────────────────────────
   TextFormatter
   Paste raw text into one control, get a structured page out.
   ─────────────────────────────────────────────────────────────── */

const RE_MD_HEADING = /^(#{1,6})\s+(.+)$/
const RE_BULLET = /^[-–—*•·▪‣]\s+(.+)$/
const RE_NUMBERED = /^\d{1,3}[.)]\s+(.+)$/
const RE_ROMAN = /^(?:x{0,3})(?:ix|iv|v?i{1,3}|v)[.)]\s+(.+)$/i
const RE_LETTERED = /^[A-Za-z][.)]\s+(.+)$/
const RE_SENTENCE_END = /[.!?][")'\u201d\u2019\]]?$/
const HEADING_MAX_LENGTH = 90

function isAllCaps(text: string) {
    const letters = text.replace(/[^A-Za-z]/g, "")
    return letters.length >= 3 && text === text.toUpperCase()
}

function isLabelLike(text: string) {
    return text.length <= HEADING_MAX_LENGTH && !RE_SENTENCE_END.test(text)
}

/* ── Pass 1: tag every line ─────────────────────────────────── */

type Tag = {
    type: string
    text: string
    role?: string
    level?: number
    ordered?: boolean
}

function tagLine(line: string): Tag {
    if (!line) return { type: "blank", text: "" }
    let m: RegExpMatchArray | null

    if ((m = line.match(RE_MD_HEADING))) {
        const hashes = m[1].length
        return {
            type: "marked",
            role: "heading",
            level: hashes === 1 ? 1 : hashes === 2 ? 2 : 3,
            text: m[2].trim(),
        }
    }
    if ((m = line.match(RE_BULLET)))
        return {
            type: "marked",
            role: "item",
            ordered: false,
            text: m[1].trim(),
        }
    if ((m = line.match(RE_NUMBERED)))
        return { type: "numbered", text: m[1].trim() }
    if ((m = line.match(RE_ROMAN)))
        return { type: "lettered", text: m[1].trim() }
    if ((m = line.match(RE_LETTERED)))
        return { type: "lettered", text: m[1].trim() }

    return { type: "plain", text: line }
}

/* ── Pass 2: resolve ambiguous lines using their neighbours ──── */

function resolveRoles(tags: Tag[], smart: boolean, listThreshold: number) {
    // "1. Order" on its own is a heading. Two or more in a row is a list.
    for (let i = 0; i < tags.length; i++) {
        const t = tags[i]
        if (t.type !== "numbered" && t.type !== "lettered") continue

        let end = i
        while (end + 1 < tags.length && tags[end + 1].type === t.type) end++
        const run = end - i + 1
        const asHeading = smart && run === 1 && isLabelLike(t.text)

        for (let j = i; j <= end; j++) {
            if (asHeading) {
                tags[j].role = "heading"
                tags[j].level = t.type === "numbered" ? 2 : 3
            } else {
                tags[j].role = "item"
                tags[j].ordered = true
            }
        }
        i = end
    }

    // Unmarked lines. A short line on its own is a heading.
    // Three or more short lines in a row is a list that lost its bullets.
    for (let i = 0; i < tags.length; i++) {
        const t = tags[i]
        if (t.type !== "plain") continue

        if (!smart || !isLabelLike(t.text)) {
            t.role = "paragraph"
            continue
        }

        let end = i
        while (
            end + 1 < tags.length &&
            tags[end + 1].type === "plain" &&
            isLabelLike(tags[end + 1].text)
        )
            end++
        const run = end - i + 1

        for (let j = i; j <= end; j++) {
            if (run >= listThreshold) {
                tags[j].role = "item"
                tags[j].ordered = false
            } else {
                tags[j].role = "heading"
                tags[j].level = /:$/.test(tags[j].text) ? 3 : 2
                if (isAllCaps(tags[j].text)) tags[j].level = 2
            }
        }
        i = end
    }
}

/* ── Pass 3: group into renderable blocks ───────────────────── */

type Block =
    | { kind: "title"; text: string }
    | { kind: "heading"; level: number; text: string }
    | { kind: "paragraph"; text: string }
    | { kind: "list"; ordered: boolean; items: string[] }

function buildBlocks(
    raw: string,
    smart: boolean,
    listThreshold: number,
    firstLineAsTitle: boolean
): Block[] {
    const lines = raw
        .replace(/\r\n?/g, "\n")
        .replace(/\u00a0/g, " ")
        .split("\n")
        .map((l) => l.trim())

    // Blank lines are dropped. Spacing comes from margins, not empty divs.
    const tags = lines.map(tagLine).filter((t) => t.type !== "blank")
    resolveRoles(tags, smart, listThreshold)

    if (firstLineAsTitle && tags.length && tags[0].role === "heading") {
        tags[0].role = "title"
    }

    const blocks: Block[] = []
    for (let i = 0; i < tags.length; i++) {
        const t = tags[i]

        if (t.role === "item") {
            const ordered = !!t.ordered
            const items: string[] = []
            while (
                i < tags.length &&
                tags[i].role === "item" &&
                !!tags[i].ordered === ordered
            ) {
                items.push(tags[i].text)
                i++
            }
            i--
            blocks.push({ kind: "list", ordered, items })
        } else if (t.role === "title") {
            blocks.push({ kind: "title", text: t.text })
        } else if (t.role === "heading") {
            blocks.push({ kind: "heading", level: t.level || 2, text: t.text })
        } else {
            blocks.push({ kind: "paragraph", text: t.text })
        }
    }
    return blocks
}

/* ── Inline formatting: bold, italic, code, links, emails ───── */

const RE_INLINE =
    /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|https?:\/\/[^\s<>]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g

function renderInline(text: string, linkColor: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = []
    const linkStyle = { color: linkColor, textDecoration: "underline" }
    let last = 0
    let key = 0
    let m: RegExpExecArray | null

    RE_INLINE.lastIndex = 0
    while ((m = RE_INLINE.exec(text)) !== null) {
        if (m.index > last) nodes.push(text.slice(last, m.index))

        let token = m[0]
        let trailing = ""
        if (/^(https?:\/\/|[A-Za-z0-9._%+-]+@)/.test(token)) {
            const trail = token.match(/[.,;:!?)\]]+$/)
            if (trail) {
                trailing = trail[0]
                token = token.slice(0, -trailing.length)
            }
        }

        if (/^(\*\*|__)/.test(token)) {
            nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>)
        } else if (token.startsWith("`")) {
            nodes.push(
                <code
                    key={key++}
                    style={{
                        fontFamily: "ui-monospace, monospace",
                        fontSize: "0.9em",
                    }}
                >
                    {token.slice(1, -1)}
                </code>
            )
        } else if (token.startsWith("[")) {
            const link = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
            nodes.push(
                <a
                    key={key++}
                    href={link ? link[2] : "#"}
                    style={linkStyle}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {link ? link[1] : token}
                </a>
            )
        } else if (/^https?:\/\//.test(token)) {
            nodes.push(
                <a
                    key={key++}
                    href={token}
                    style={linkStyle}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {token}
                </a>
            )
        } else if (token.includes("@")) {
            nodes.push(
                <a key={key++} href={`mailto:${token}`} style={linkStyle}>
                    {token}
                </a>
            )
        } else {
            nodes.push(<em key={key++}>{token.slice(1, -1)}</em>)
        }

        if (trailing) nodes.push(trailing)
        last = m.index + m[0].length
    }
    if (last < text.length) nodes.push(text.slice(last))
    return nodes
}

/* ── Component ──────────────────────────────────────────────── */

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 720
 */
export default function TextFormatter(props) {
    const {
        rawText,
        smartDetection,
        listThreshold,
        firstLineAsTitle,
        headingFont,
        bodyFont,
        headingWeight,
        titleSize,
        headingSize,
        subheadingSize,
        bodySize,
        headingColor,
        bodyColor,
        linkColor,
        lineHeight,
        paragraphGap,
        headingSpacing,
        listGap,
        listIndent,
        style,
    } = props

    const blocks = React.useMemo(
        () =>
            rawText
                ? buildBlocks(
                      rawText,
                      smartDetection,
                      listThreshold,
                      firstLineAsTitle
                  )
                : [],
        [rawText, smartDetection, listThreshold, firstLineAsTitle]
    )

    const bodyStyle: React.CSSProperties = {
        fontFamily: bodyFont,
        fontSize: bodySize,
        color: bodyColor,
        lineHeight,
    }

    const headingBase: React.CSSProperties = {
        fontFamily: headingFont,
        fontWeight: Number(headingWeight),
        color: headingColor,
        lineHeight: 1.3,
        margin: 0,
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                boxSizing: "border-box",
                ...style,
            }}
        >
            {blocks.length === 0 && (
                <p style={{ ...bodyStyle, opacity: 0.4, margin: 0 }}>
                    Paste your text into the Raw Text control in the properties
                    panel.
                </p>
            )}

            {blocks.map((block, index) => {
                const first = index === 0

                if (block.kind === "title") {
                    return (
                        <h1
                            key={index}
                            style={{
                                ...headingBase,
                                fontSize: titleSize,
                                lineHeight: 1.15,
                                marginBottom: paragraphGap * 1.5,
                            }}
                        >
                            {renderInline(block.text, linkColor)}
                        </h1>
                    )
                }

                if (block.kind === "heading") {
                    const size =
                        block.level === 1
                            ? titleSize
                            : block.level === 2
                              ? headingSize
                              : subheadingSize
                    return React.createElement(
                        block.level === 3 ? "h3" : "h2",
                        {
                            key: index,
                            style: {
                                ...headingBase,
                                fontSize: size,
                                marginTop: first
                                    ? 0
                                    : block.level === 3
                                      ? headingSpacing * 0.55
                                      : headingSpacing,
                                marginBottom: paragraphGap * 0.65,
                            },
                        },
                        renderInline(block.text, linkColor)
                    )
                }

                if (block.kind === "list") {
                    const ListTag = block.ordered ? "ol" : "ul"
                    return React.createElement(
                        ListTag,
                        {
                            key: index,
                            style: {
                                margin: 0,
                                marginBottom: paragraphGap,
                                paddingLeft: listIndent,
                                display: "flex",
                                flexDirection: "column",
                                gap: listGap,
                                listStyleType: block.ordered
                                    ? "decimal"
                                    : "disc",
                            },
                        },
                        block.items.map((item, itemIndex) => (
                            <li key={itemIndex} style={bodyStyle}>
                                {renderInline(item, linkColor)}
                            </li>
                        ))
                    )
                }

                return (
                    <p
                        key={index}
                        style={{
                            ...bodyStyle,
                            margin: 0,
                            marginBottom: paragraphGap,
                        }}
                    >
                        {renderInline(block.text, linkColor)}
                    </p>
                )
            })}
        </div>
    )
}

TextFormatter.defaultProps = {
    rawText: "",
    smartDetection: true,
    listThreshold: 3,
    firstLineAsTitle: true,
    headingFont: "Inter, sans-serif",
    bodyFont: "Inter, sans-serif",
    headingWeight: "700",
    titleSize: 34,
    headingSize: 22,
    subheadingSize: 17,
    bodySize: 15,
    headingColor: "#111111",
    bodyColor: "#444444",
    linkColor: "#1A6DFF",
    lineHeight: 1.7,
    paragraphGap: 14,
    headingSpacing: 34,
    listGap: 8,
    listIndent: 24,
}

addPropertyControls(TextFormatter, {
    rawText: {
        type: ControlType.String,
        title: "Raw Text",
        displayTextArea: true,
        defaultValue: "",
        description:
            "Paste unformatted text here. Markdown headings (#), bullets and numbered lines are all read automatically.",
    },
    smartDetection: {
        type: ControlType.Boolean,
        title: "Smart Detect",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        description:
            "On: guesses headings and lists from line length and spacing. Off: only reads #, bullets and numbers.",
    },
    listThreshold: {
        type: ControlType.Number,
        title: "List Run",
        defaultValue: 3,
        min: 2,
        max: 6,
        step: 1,
        description:
            "How many short lines in a row count as a list instead of headings.",
        hidden: (p) => p.smartDetection === false,
    },
    firstLineAsTitle: {
        type: ControlType.Boolean,
        title: "First Line",
        enabledTitle: "Title",
        disabledTitle: "Heading",
        defaultValue: true,
    },
    headingFont: {
        type: ControlType.String,
        title: "Heading Font",
        defaultValue: "Inter, sans-serif",
    },
    bodyFont: {
        type: ControlType.String,
        title: "Body Font",
        defaultValue: "Inter, sans-serif",
    },
    headingWeight: {
        type: ControlType.Enum,
        title: "Heading Weight",
        options: ["500", "600", "700", "800"],
        optionTitles: ["Medium", "Semibold", "Bold", "Extrabold"],
        defaultValue: "700",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Title Size",
        defaultValue: 34,
        min: 16,
        max: 72,
        step: 1,
        unit: "px",
    },
    headingSize: {
        type: ControlType.Number,
        title: "Heading Size",
        defaultValue: 22,
        min: 12,
        max: 48,
        step: 1,
        unit: "px",
    },
    subheadingSize: {
        type: ControlType.Number,
        title: "Subheading",
        defaultValue: 17,
        min: 10,
        max: 36,
        step: 1,
        unit: "px",
    },
    bodySize: {
        type: ControlType.Number,
        title: "Body Size",
        defaultValue: 15,
        min: 10,
        max: 28,
        step: 1,
        unit: "px",
    },
    headingColor: {
        type: ControlType.Color,
        title: "Heading Color",
        defaultValue: "#111111",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "#444444",
    },
    linkColor: {
        type: ControlType.Color,
        title: "Link Color",
        defaultValue: "#1A6DFF",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.7,
        min: 1,
        max: 3,
        step: 0.05,
    },
    paragraphGap: {
        type: ControlType.Number,
        title: "Paragraph Gap",
        defaultValue: 14,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    headingSpacing: {
        type: ControlType.Number,
        title: "Space Above H",
        defaultValue: 34,
        min: 0,
        max: 96,
        step: 1,
        unit: "px",
    },
    listGap: {
        type: ControlType.Number,
        title: "List Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    listIndent: {
        type: ControlType.Number,
        title: "List Indent",
        defaultValue: 24,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
})
