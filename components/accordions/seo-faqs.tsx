import {
    Children,
    isValidElement,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type KeyboardEvent,
    type ReactNode,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, type Transition } from "framer-motion"

type DisplayMode = "accordion" | "list"
type AccordionStyle = "cards" | "joined" | "minimal"
type IconType = "chevron" | "plus" | "plusRotate" | "arrow" | "none"
type Prefix = "none" | "numbers" | "qa"
type InitialOpen = "none" | "first" | "all"

interface BorderValue {
    borderColor?: string
    borderStyle?: "solid" | "dashed" | "dotted" | "double"
    borderWidth?: number
    borderTopWidth?: number
    borderRightWidth?: number
    borderBottomWidth?: number
    borderLeftWidth?: number
}

interface ItemStyle {
    background: string
    hoverBackground: string
    openBackground: string
    border?: BorderValue
    openBorderColor: string
    radius: string
    padding: string
    shadow: string
    openShadow: string
}

interface IconStyle {
    type: IconType
    position: "right" | "left"
    size: number
    strokeWidth: number
    color: string
    openColor: string
    showBackground: boolean
    background: string
    openBackground: string
    backgroundSize: number
}

interface TextStyle {
    questionColor: string
    openQuestionColor: string
    answerColor: string
    prefixColor: string
    linkColor: string
    headingTag: "h2" | "h3" | "h4" | "p"
}

interface ManualItem {
    question: string
    answer: string
}

interface FAQAccordionProps {
    source: "items" | "richText"
    items: ManualItem[]
    richText?: ReactNode
    displayMode: DisplayMode
    accordionStyle: AccordionStyle
    allowMultiple: boolean
    initialOpen: InitialOpen
    prefix: Prefix
    showAnswerDivider: boolean
    gap: number
    answerSpacing: number
    paragraphSpacing: number
    questionFont: CSSProperties
    answerFont: CSSProperties
    itemStyle: ItemStyle
    icon: IconStyle
    text: TextStyle
    focusColor: string
    transition: any
    emitSchema: boolean
    style?: CSSProperties
}

interface FAQEntry {
    question: ReactNode
    answer: ReactNode[]
}

const HEADING = /^h[1-6]$/

/** Returns [top, right, bottom, left] in px from a CSS padding shorthand. */
function parsePadding(value: string | undefined): [number, number, number, number] {
    const parts = (value || "0px")
        .trim()
        .split(/\s+/)
        .map((p) => parseFloat(p) || 0)
    const [t, r = t, b = t, l = r] = parts
    return [t, r, b, l]
}

function extractText(node: ReactNode): string {
    if (node === null || node === undefined || typeof node === "boolean") return ""
    if (typeof node === "string" || typeof node === "number") return String(node)
    if (Array.isArray(node)) return node.map(extractText).join("")
    if (isValidElement(node)) {
        const children = (node.props as { children?: ReactNode }).children
        const text = extractText(children)
        // Keep block boundaries readable in the schema text.
        return typeof node.type === "string" && /^(p|li|h[1-6])$/.test(node.type)
            ? text + " "
            : text
    }
    return ""
}

/** Finds the flat list of blocks (headings, paragraphs, lists) inside a Rich Text value. */
function getBlocks(node: ReactNode, depth = 0): ReactNode[] {
    if (!isValidElement(node) || depth > 6) return []
    const children = Children.toArray((node.props as { children?: ReactNode }).children)
    const hasHeading = children.some(
        (child) => isValidElement(child) && typeof child.type === "string" && HEADING.test(child.type)
    )
    if (hasHeading) return children
    for (const child of children) {
        const found = getBlocks(child, depth + 1)
        if (found.length) return found
    }
    return []
}

/** Headings become questions; every block until the next heading becomes the answer. */
function parseRichText(richText: ReactNode): FAQEntry[] {
    const entries: FAQEntry[] = []
    let current: FAQEntry | null = null
    for (const block of getBlocks(richText)) {
        if (isValidElement(block) && typeof block.type === "string" && HEADING.test(block.type)) {
            if (current) entries.push(current)
            current = { question: (block.props as { children?: ReactNode }).children, answer: [] }
        } else if (current) {
            current.answer.push(block)
        }
    }
    if (current) entries.push(current)
    return entries
}

function parseManual(items: ManualItem[] = []): FAQEntry[] {
    return items
        .filter((item) => item && item.question)
        .map((item) => ({
            question: item.question,
            answer: (item.answer || "")
                .split(/\n\s*\n/)
                .filter(Boolean)
                .map((paragraph, i) => <p key={i}>{paragraph}</p>),
        }))
}

function Icon({ icon, open, isStatic }: { icon: IconStyle; open: boolean; isStatic: boolean }) {
    if (icon.type === "none") return null
    const color = open ? icon.openColor : icon.color
    const ease: Transition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    const svgProps = {
        width: icon.size,
        height: icon.size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: icon.strokeWidth,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        "aria-hidden": true,
    }

    let glyph: ReactNode
    if (icon.type === "plus") {
        // Plus that collapses into a minus.
        const vertical = { scaleY: open ? 0 : 1, opacity: open ? 0 : 1 }
        const origin = { transformBox: "fill-box", transformOrigin: "center" } as CSSProperties
        glyph = (
            <svg {...svgProps} style={{ display: "block" }}>
                <path d="M5 12h14" />
                {isStatic ? (
                    <path d="M12 5v14" style={{ ...origin, opacity: vertical.opacity, transform: `scaleY(${vertical.scaleY})` }} />
                ) : (
                    <motion.path d="M12 5v14" style={origin} initial={false} animate={vertical} transition={ease} />
                )}
            </svg>
        )
    } else {
        const shapes: Record<string, { d: string; rotate: number }> = {
            chevron: { d: "M6 9l6 6 6-6", rotate: 180 },
            arrow: { d: "M5 12h14M13 6l6 6-6 6", rotate: 90 },
            plusRotate: { d: "M12 5v14M5 12h14", rotate: 45 },
        }
        const shape = shapes[icon.type] ?? shapes.chevron
        const rotate = open ? shape.rotate : 0
        glyph = isStatic ? (
            <svg {...svgProps} style={{ display: "block", transform: `rotate(${rotate}deg)` }}>
                <path d={shape.d} />
            </svg>
        ) : (
            <motion.svg
                {...svgProps}
                style={{ display: "block", transition: "stroke 0.2s ease" }}
                initial={false}
                animate={{ rotate }}
                transition={ease}
            >
                <path d={shape.d} />
            </motion.svg>
        )
    }

    const wrapperSize = icon.showBackground ? Math.max(icon.backgroundSize, icon.size) : icon.size
    return (
        <span
            aria-hidden
            style={{
                flexShrink: 0,
                width: wrapperSize,
                height: wrapperSize,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: icon.showBackground ? (open ? icon.openBackground : icon.background) : "transparent",
                transition: isStatic ? undefined : "background-color 0.2s ease",
            }}
        >
            {glyph}
        </span>
    )
}

function AnswerPanel({
    id,
    labelledBy,
    open,
    transition,
    isStatic,
    children,
}: {
    id: string
    labelledBy: string
    open: boolean
    transition: any
    isStatic: boolean
    children: ReactNode
}) {
    const ref = useRef<HTMLDivElement>(null)
    // Closed answers stay readable by screen readers and crawlers, but links
    // inside them leave the tab order so keyboard focus never lands on hidden text.
    useEffect(() => {
        const panel = ref.current
        if (!panel) return
        const focusable = panel.querySelectorAll<HTMLElement>(
            "a[href], button, input, select, textarea, [tabindex]"
        )
        focusable.forEach((node) => {
            if (!open) {
                if (!node.hasAttribute("data-faq-tabindex")) {
                    node.setAttribute("data-faq-tabindex", node.getAttribute("tabindex") ?? "")
                }
                node.setAttribute("tabindex", "-1")
            } else if (node.hasAttribute("data-faq-tabindex")) {
                const previous = node.getAttribute("data-faq-tabindex")
                if (previous) node.setAttribute("tabindex", previous)
                else node.removeAttribute("tabindex")
                node.removeAttribute("data-faq-tabindex")
            }
        })
    }, [open, children])
    // Canvas and export: show the final state with no height or opacity animation.
    if (isStatic) {
        return (
            <div
                ref={ref}
                id={id}
                role="region"
                aria-labelledby={labelledBy}
                style={{ overflow: "hidden", height: open ? "auto" : 0 }}
            >
                {children}
            </div>
        )
    }
    return (
        <motion.div
            ref={ref}
            id={id}
            role="region"
            aria-labelledby={labelledBy}
            initial={false}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
            transition={{ ...transition, opacity: { duration: open ? 0.25 : 0.15, delay: open ? 0.05 : 0 } }}
            style={{ overflow: "hidden" }}
        >
            {children}
        </motion.div>
    )
}

/**
 * FAQ Accordion — questions and answers from manual items or a Rich Text field,
 * shown as an accordion or a plain list, with FAQPage JSON-LD for SEO.
 *
 * In Rich Text mode, headings (h1–h6) become questions and every block that
 * follows (paragraphs, lists, links) becomes that question's answer.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 640
 * @framerDisableUnlink
 */
export default function FAQAccordion(props: FAQAccordionProps) {
    const {
        source,
        items,
        richText,
        displayMode,
        accordionStyle,
        allowMultiple,
        initialOpen,
        prefix,
        showAnswerDivider,
        gap,
        answerSpacing,
        paragraphSpacing,
        questionFont,
        answerFont,
        itemStyle,
        icon,
        text,
        focusColor,
        transition,
        emitSchema,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = useId().replace(/:/g, "")
    const scope = `faq-${uid}`

    const entries = useMemo<FAQEntry[]>(() => {
        if (source === "richText") {
            const parsed = parseRichText(richText)
            if (parsed.length || !isStatic) return parsed
            return [
                { question: "Add headings for questions", answer: [<p key="0">Paragraphs below each heading become the answer.</p>] },
                { question: "Lists and links are supported", answer: [<p key="0">Anything until the next heading is kept.</p>] },
            ]
        }
        return parseManual(items)
    }, [source, richText, items, isStatic])

    const initialSet = (): Set<number> => {
        if (initialOpen === "all") return new Set(entries.map((_, i) => i))
        if (initialOpen === "first" && entries.length) return new Set([0])
        return new Set()
    }
    const [openSet, setOpenSet] = useState<Set<number>>(initialSet)
    // Keep the canvas preview in sync with the "Initially Open" control.
    useEffect(() => {
        if (isStatic) setOpenSet(initialSet())
    }, [initialOpen, entries.length, isStatic])

    const triggers = useRef<(HTMLButtonElement | null)[]>([])

    const toggle = (index: number) => {
        startTransition(() =>
            setOpenSet((prev) => {
                const next = new Set(allowMultiple ? prev : [])
                if (prev.has(index)) next.delete(index)
                else next.add(index)
                return next
            })
        )
    }

    const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
        const count = entries.length
        let target: number | null = null
        if (event.key === "ArrowDown") target = (index + 1) % count
        else if (event.key === "ArrowUp") target = (index - 1 + count) % count
        else if (event.key === "Home") target = 0
        else if (event.key === "End") target = count - 1
        if (target !== null) {
            event.preventDefault()
            triggers.current[target]?.focus()
        }
    }

    const schema = useMemo(
        () =>
            JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: entries.map((entry) => ({
                    "@type": "Question",
                    name: extractText(entry.question).trim(),
                    acceptedAnswer: { "@type": "Answer", text: extractText(entry.answer).trim() },
                })),
            }),
        [entries]
    )

    const HeadingTag = (text.headingTag || "h3") as any
    const [padT, padR, padB, padL] = parsePadding(itemStyle.padding)
    const iconWidth = icon.type === "none" ? 0 : icon.showBackground ? Math.max(icon.backgroundSize, icon.size) : icon.size
    const headerGap = 16
    const answerIndent = icon.position === "left" && iconWidth ? iconWidth + headerGap : 0

    const border = itemStyle.border || {}
    const borderWidth = border.borderWidth ?? 0
    const borderColor = border.borderColor || "transparent"
    const borderStyle = border.borderStyle || "solid"
    const divider = borderWidth ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none"

    const renderPrefix = (index: number, kind: "q" | "a") => {
        if (prefix === "none") return null
        const label = prefix === "numbers" ? (kind === "q" ? String(index + 1).padStart(2, "0") : null) : kind === "q" ? "Q" : "A"
        if (!label) return null
        return (
            <span aria-hidden style={{ color: text.prefixColor, fontVariantNumeric: "tabular-nums", marginRight: "0.6em", flexShrink: 0 }}>
                {label}
                {prefix === "qa" ? ":" : ""}
            </span>
        )
    }

    const css = `
        .${scope} .faq-answer > * { margin: 0; }
        .${scope} .faq-answer > * + * { margin-top: ${paragraphSpacing}px; }
        .${scope} .faq-answer ul, .${scope} .faq-answer ol { padding-left: 1.25em; }
        .${scope} .faq-answer li + li { margin-top: 0.35em; }
        .${scope} .faq-answer a { color: ${text.linkColor}; text-decoration: underline; text-underline-offset: 0.2em; }
        ${isStatic ? "" : `.${scope} .faq-item { transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.25s ease; }`}
        .${scope} .faq-item[data-open="false"]:not([data-minimal="true"]):hover { background-color: ${itemStyle.hoverBackground} !important; }
        .${scope} .faq-trigger { all: unset; box-sizing: border-box; cursor: pointer; width: 100%; -webkit-tap-highlight-color: transparent; }
        .${scope} .faq-trigger:focus-visible { outline: 2px solid ${focusColor}; outline-offset: -2px; border-radius: ${itemStyle.radius}; }
    `

    const answerContent = (entry: FAQEntry, index: number) => (
        <div className="faq-answer" style={{ color: text.answerColor, ...answerFont }}>
            {prefix === "qa" ? (
                <div style={{ display: "flex" }}>
                    {renderPrefix(index, "a")}
                    <div className="faq-answer" style={{ flex: 1, minWidth: 0 }}>
                        {entry.answer}
                    </div>
                </div>
            ) : (
                entry.answer
            )}
        </div>
    )

    const renderList = () => (
        <div style={{ display: "flex", flexDirection: "column", gap }}>
            {entries.map((entry, index) => (
                <div key={index}>
                    <HeadingTag
                        style={{
                            margin: 0,
                            marginBottom: answerSpacing,
                            display: "flex",
                            color: text.questionColor,
                            ...questionFont,
                        }}
                    >
                        {renderPrefix(index, "q")}
                        <span style={{ flex: 1, minWidth: 0 }}>{entry.question}</span>
                    </HeadingTag>
                    {answerContent(entry, index)}
                </div>
            ))}
        </div>
    )

    const renderAccordion = () => {
        const joined = accordionStyle === "joined"
        const minimal = accordionStyle === "minimal"
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: joined || minimal ? 0 : gap,
                    ...(joined
                        ? {
                              border: divider,
                              borderRadius: itemStyle.radius,
                              boxShadow: itemStyle.shadow,
                              overflow: "hidden",
                              background: itemStyle.background,
                          }
                        : {}),
                }}
            >
                {entries.map((entry, index) => {
                    const open = openSet.has(index)
                    const triggerId = `${scope}-q-${index}`
                    const panelId = `${scope}-a-${index}`

                    const itemCss: CSSProperties = minimal
                        ? {
                              background: "transparent",
                              borderBottom: divider,
                              borderColor: open ? itemStyle.openBorderColor : borderColor,
                          }
                        : joined
                          ? {
                                background: open ? itemStyle.openBackground : itemStyle.background,
                                borderTop: index > 0 ? divider : "none",
                            }
                          : {
                                background: open ? itemStyle.openBackground : itemStyle.background,
                                borderStyle,
                                borderColor: open ? itemStyle.openBorderColor : borderColor,
                                borderTopWidth: border.borderTopWidth ?? borderWidth,
                                borderRightWidth: border.borderRightWidth ?? borderWidth,
                                borderBottomWidth: border.borderBottomWidth ?? borderWidth,
                                borderLeftWidth: border.borderLeftWidth ?? borderWidth,
                                borderRadius: itemStyle.radius,
                                boxShadow: open ? itemStyle.openShadow || itemStyle.shadow : itemStyle.shadow,
                            }

                    return (
                        <div
                            key={index}
                            className="faq-item"
                            data-open={open ? "true" : "false"}
                            data-minimal={minimal ? "true" : "false"}
                            style={{ overflow: "hidden", ...itemCss }}
                        >
                            <HeadingTag style={{ margin: 0, font: "inherit" }}>
                                <button
                                    ref={(el) => {
                                        triggers.current[index] = el
                                    }}
                                    id={triggerId}
                                    type="button"
                                    className="faq-trigger"
                                    aria-expanded={open}
                                    aria-controls={panelId}
                                    onClick={() => toggle(index)}
                                    onKeyDown={(e) => onTriggerKeyDown(e, index)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        flexDirection: icon.position === "left" ? "row-reverse" : "row",
                                        gap: headerGap,
                                        padding: `${padT}px ${minimal ? 0 : padR}px ${padB}px ${minimal ? 0 : padL}px`,
                                        textAlign: "left",
                                        color: open ? text.openQuestionColor : text.questionColor,
                                        transition: isStatic ? undefined : "color 0.2s ease",
                                        ...questionFont,
                                    }}
                                >
                                    <span style={{ flex: 1, minWidth: 0, display: "flex" }}>
                                        {renderPrefix(index, "q")}
                                        <span style={{ flex: 1, minWidth: 0 }}>{entry.question}</span>
                                    </span>
                                    <Icon icon={icon} open={open} isStatic={isStatic} />
                                </button>
                            </HeadingTag>
                            <AnswerPanel id={panelId} labelledBy={triggerId} open={open} transition={transition} isStatic={isStatic}>
                                <div
                                    style={{
                                        padding: `0 ${minimal ? 0 : padR}px ${padB}px ${(minimal ? 0 : padL) + answerIndent}px`,
                                    }}
                                >
                                    {showAnswerDivider && (
                                        <div
                                            aria-hidden
                                            style={{
                                                height: Math.max(borderWidth, 1),
                                                background: borderColor,
                                                marginBottom: answerSpacing,
                                                opacity: 0.8,
                                            }}
                                        />
                                    )}
                                    <div style={{ paddingTop: showAnswerDivider ? 0 : Math.max(answerSpacing - padB, 0) }}>
                                        {answerContent(entry, index)}
                                    </div>
                                </div>
                            </AnswerPanel>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className={scope} style={{ ...style, position: "relative", width: "100%" }}>
            <style>{css}</style>
            {displayMode === "list" ? renderList() : renderAccordion()}
            {emitSchema && entries.length > 0 && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />
            )}
        </div>
    )
}

FAQAccordion.displayName = "FAQ Accordion"

const isList = (p: Partial<FAQAccordionProps>) => p.displayMode === "list"

addPropertyControls(FAQAccordion, {
    source: {
        type: ControlType.Enum,
        title: "Content",
        options: ["items", "richText"],
        optionTitles: ["Items", "Rich Text"],
        defaultValue: "items",
        displaySegmentedControl: true,
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        hidden: (p) => p.source === "richText",
        control: {
            type: ControlType.Object,
            controls: {
                question: { type: ControlType.String, title: "Question", defaultValue: "What is your question?" },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    displayTextArea: true,
                    defaultValue: "Write the answer here. Leave a blank line to start a new paragraph.",
                },
            },
        },
        defaultValue: [
            {
                question: "What is this component?",
                answer: "An accessible FAQ that works as an accordion or a plain list, and adds FAQ structured data so search engines can show your questions in results.",
            },
            {
                question: "Where do the questions come from?",
                answer: "Use Items to type questions and answers directly in the properties panel. Leave a blank line in an answer to start a new paragraph.",
            },
            {
                question: "Can I connect it to the CMS?",
                answer: "Yes. Switch Content to Rich Text and bind a CMS field. Each heading becomes a question, and everything below it until the next heading (paragraphs, lists and links) becomes the answer.",
            },
            {
                question: "Can more than one answer be open?",
                answer: "Turn on Allow Multiple to let visitors expand several answers at once. Initially Open decides whether none, the first or all answers start expanded.",
            },
            {
                question: "How do I change the look?",
                answer: "Pick a Style: Cards for separate items, Joined for one block with dividers, or Minimal for simple lines. The Item group sets fill, hover and open colors, border, radius, padding and shadows.",
            },
            {
                question: "Which icons are available?",
                answer: "Chevron, Plus / Minus, Plus / Close, Arrow or none. Place the icon on the left or right, adjust its size and stroke, and add a circular background that changes color when open.",
            },
            {
                question: "Can I number the questions?",
                answer: "Set Prefix to 01 for numbered questions, or Q / A to label questions and answers. Prefix color is set in Text Colors.",
            },
            {
                question: "Is it accessible?",
                answer: "Each question is a real button that announces whether it is open. Visitors can use Tab, the arrow keys, Home and End to move between questions, with a focus ring you can recolor.",
            },
            {
                question: "How does it help SEO?",
                answer: "SEO Schema adds FAQPage structured data. Closed answers stay in the page so search engines can still read them. Turn it off if another FAQ on the same page already adds schema.",
            },
            {
                question: "Can I show it without the accordion?",
                answer: "Switch Display to List to show every question and answer at once, using the same fonts, colors and spacing.",
            },
        ],
    },
    richText: {
        // RichText exists at runtime but is missing from the public typings.
        type: (ControlType as any).RichText,
        title: "Rich Text",
        hidden: (p) => p.source !== "richText",
    },
    displayMode: {
        type: ControlType.Enum,
        title: "Display",
        options: ["accordion", "list"],
        optionTitles: ["Accordion", "List"],
        defaultValue: "accordion",
        displaySegmentedControl: true,
    },
    accordionStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["cards", "joined", "minimal"],
        optionTitles: ["Cards", "Joined", "Minimal"],
        defaultValue: "cards",
        displaySegmentedControl: true,
        hidden: isList,
    },
    allowMultiple: {
        type: ControlType.Boolean,
        title: "Allow Multiple",
        defaultValue: false,
        hidden: isList,
    },
    initialOpen: {
        type: ControlType.Enum,
        title: "Initially Open",
        options: ["none", "first", "all"],
        optionTitles: ["None", "First", "All"],
        defaultValue: "first",
        displaySegmentedControl: true,
        hidden: isList,
    },
    prefix: {
        type: ControlType.Enum,
        title: "Prefix",
        options: ["none", "numbers", "qa"],
        optionTitles: ["None", "01", "Q / A"],
        defaultValue: "none",
        displaySegmentedControl: true,
    },
    showAnswerDivider: {
        type: ControlType.Boolean,
        title: "Answer Divider",
        defaultValue: false,
        hidden: isList,
    },
    gap: {
        type: ControlType.Number,
        title: "Item Gap",
        min: 0,
        max: 80,
        unit: "px",
        defaultValue: 12,
    },
    answerSpacing: {
        type: ControlType.Number,
        title: "Q → A Spacing",
        min: 0,
        max: 60,
        unit: "px",
        defaultValue: 12,
    },
    paragraphSpacing: {
        type: ControlType.Number,
        title: "Paragraph Gap",
        min: 0,
        max: 40,
        unit: "px",
        defaultValue: 12,
    },
    questionFont: {
        type: ControlType.Font,
        title: "Question Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "18px", variant: "Semibold", letterSpacing: "-0.01em", lineHeight: "1.4em" },
    },
    answerFont: {
        type: ControlType.Font,
        title: "Answer Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "16px", variant: "Regular", letterSpacing: "0em", lineHeight: "1.6em" },
    },
    text: {
        type: ControlType.Object,
        title: "Text Colors",
        icon: "color",
        controls: {
            questionColor: { type: ControlType.Color, title: "Question", defaultValue: "#111111" },
            openQuestionColor: { type: ControlType.Color, title: "Question Open", defaultValue: "#111111" },
            answerColor: { type: ControlType.Color, title: "Answer", defaultValue: "#555555" },
            prefixColor: { type: ControlType.Color, title: "Prefix", defaultValue: "#999999" },
            linkColor: { type: ControlType.Color, title: "Links", defaultValue: "#0066FF" },
            headingTag: {
                type: ControlType.Enum,
                title: "Question Tag",
                options: ["h2", "h3", "h4", "p"],
                optionTitles: ["H2", "H3", "H4", "P"],
                defaultValue: "h3",
                displaySegmentedControl: true,
            },
        },
    },
    itemStyle: {
        type: ControlType.Object,
        title: "Item",
        icon: "effect",
        hidden: isList,
        controls: {
            background: { type: ControlType.Color, title: "Fill", defaultValue: "#FFFFFF" },
            hoverBackground: { type: ControlType.Color, title: "Hover Fill", defaultValue: "#FAFAFA" },
            openBackground: { type: ControlType.Color, title: "Open Fill", defaultValue: "#FFFFFF" },
            border: {
                type: ControlType.Border,
                title: "Border",
                defaultValue: { borderWidth: 1, borderStyle: "solid", borderColor: "rgba(0, 0, 0, 0.08)" },
            },
            openBorderColor: { type: ControlType.Color, title: "Open Border", defaultValue: "rgba(0, 0, 0, 0.16)" },
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "14px" },
            padding: { type: ControlType.Padding, title: "Padding", defaultValue: "20px 24px 20px 24px" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0px 1px 2px 0px rgba(0, 0, 0, 0.04)" },
            openShadow: {
                type: ControlType.BoxShadow,
                title: "Open Shadow",
                defaultValue: "0px 8px 24px -8px rgba(0, 0, 0, 0.12)",
            },
        },
    },
    icon: {
        type: ControlType.Object,
        title: "Icon",
        hidden: isList,
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Type",
                options: ["chevron", "plus", "plusRotate", "arrow", "none"],
                optionTitles: ["Chevron", "Plus / Minus", "Plus / Close", "Arrow", "None"],
                defaultValue: "chevron",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "right",
                displaySegmentedControl: true,
            },
            size: { type: ControlType.Number, title: "Size", min: 12, max: 48, unit: "px", defaultValue: 20 },
            strokeWidth: { type: ControlType.Number, title: "Stroke", min: 1, max: 4, step: 0.25, defaultValue: 2 },
            color: { type: ControlType.Color, title: "Color", defaultValue: "#111111" },
            openColor: { type: ControlType.Color, title: "Open Color", defaultValue: "#111111" },
            showBackground: { type: ControlType.Boolean, title: "Background", defaultValue: false },
            background: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#F2F2F2",
                hidden: (p: IconStyle) => !p.showBackground,
            },
            openBackground: {
                type: ControlType.Color,
                title: "Open Fill",
                defaultValue: "#111111",
                hidden: (p: IconStyle) => !p.showBackground,
            },
            backgroundSize: {
                type: ControlType.Number,
                title: "Fill Size",
                min: 16,
                max: 64,
                unit: "px",
                defaultValue: 32,
                hidden: (p: IconStyle) => !p.showBackground,
            },
        },
    },
    focusColor: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "#0066FF",
        hidden: isList,
    },
    transition: {
        type: ControlType.Transition,
        title: "Animation",
        defaultValue: { type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.35 },
        hidden: isList,
    },
    emitSchema: {
        type: ControlType.Boolean,
        title: "SEO Schema",
        description: "Adds FAQPage structured data. Turn off if another FAQ on the page already emits it.",
        defaultValue: true,
    },
})
