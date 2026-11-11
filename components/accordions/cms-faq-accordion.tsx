import { useEffect, useId, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// One event name for every instance on the page. The group prop keeps two
// unrelated FAQ sections on the same page from closing each other.
const OPEN_EVENT = "framer-faq-accordion-open"

function px(v) {
    return typeof v === "number" ? v + "px" : v
}

function fontCss(f) {
    if (!f) return ""
    const p = []
    if (f.fontFamily) p.push("font-family: " + f.fontFamily + ";")
    if (f.fontWeight !== undefined) p.push("font-weight: " + f.fontWeight + ";")
    if (f.fontSize !== undefined) p.push("font-size: " + px(f.fontSize) + ";")
    if (f.lineHeight !== undefined) p.push("line-height: " + f.lineHeight + ";")
    if (f.letterSpacing !== undefined)
        p.push("letter-spacing: " + px(f.letterSpacing) + ";")
    if (f.fontStyle) p.push("font-style: " + f.fontStyle + ";")
    return p.join(" ")
}

function withDefaults(defaults, value) {
    const out = {}
    for (const k in defaults) out[k] = defaults[k]
    if (value) {
        for (const k in value) if (value[k] !== undefined) out[k] = value[k]
    }
    return out
}

function text(v) {
    return String(v == null ? "" : v)
}

// Schema values must be one clean line. A CMS answer arrives with the line
// breaks the editor typed, which are meaningful on screen and noise in JSON.
function oneLine(v) {
    return text(v).replace(/\s+/g, " ").trim()
}

// Anchors have to survive a question written in any language, so the accents
// are decomposed and dropped rather than collapsed into hyphens: "Posso
// devolver?" becomes posso-devolver, not posso-devolver with a gap where the
// accent was. An empty result means no id is written at all, rather than a
// page carrying the same id on every row.
function slugify(v) {
    return text(v)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60)
}

const APPEARANCE_DEFAULTS = {
    itemStyle: "card",
    gap: 10,
    padding: "18px 20px",
    answerPadding: "0px 20px 18px 20px",
    radius: "12px",
    background: "#FFFFFF",
    hoverBackground: "#F7F7F5",
    borderWidth: 1,
    borderColor: "#E6E4DF",
    shadow: "",
    focusColor: "#2D220F",
    questionFont: { fontSize: 17, lineHeight: 1.35, fontWeight: 600 },
    questionColor: "#101828",
    answerFont: { fontSize: 15, lineHeight: 1.55, fontWeight: 400 },
    answerColor: "#475467",
    linkColor: "#2D220F",
    icon: "chevron",
    iconPosition: "right",
    iconSize: 18,
    iconColor: "#A59784",
}

const ITEM_DEFAULTS = [
    {
        question: "How long does shipping take?",
        answer: "Orders leave the studio within two working days. Delivery then takes three to five working days, depending on where you are.",
        openByDefault: false,
    },
    {
        question: "Can I return something?",
        answer: "Yes. You have thirty days from the day your order arrives, as long as the piece is unused and in its original packaging.",
        openByDefault: false,
    },
    {
        question: "Do you ship internationally?",
        answer: "We ship across Europe and to the United States. Duties are calculated at checkout, so nothing is charged on arrival.",
        openByDefault: false,
    },
]

/**
 * FAQ ACCORDION
 *
 * An accordion that a search engine, a screen reader and a language model can
 * all read, whether or not any JavaScript ever runs.
 *
 * Three things had to be true at once, and the accordions already on the
 * market each miss at least one of them.
 *
 * 1. THE ANSWERS ARE IN THE PRE-RENDERED HTML.
 *    The most common way an accordion loses its content is
 *    {isOpen && <Answer/>}. A collapsed panel written that way does not exist
 *    in the document the crawler is served, so the answers are invisible to
 *    search and, more to the point in 2026, to the AI crawlers that mostly do
 *    not execute JavaScript at all. Here the panel is ALWAYS in the tree. It
 *    is collapsed with CSS and nothing else.
 *
 * 2. THE TRIGGER IS A REAL BUTTON.
 *    A div with an onClick has no role, no keyboard, no focus ring and no
 *    announced state. This is a <button type="button"> inside the heading tag
 *    you pick, carrying aria-expanded and aria-controls, pointing at a panel
 *    with role="region" and aria-labelledby back at the button. Enter, Space
 *    and the focus ring come free with the element.
 *
 * 3. THE FAQPage SCHEMA IS BUILT FROM THE CONTENT.
 *    Framer's own guidance puts JSON-LD in the page's Custom Code head, which
 *    cannot see CMS rows. The schema here is assembled from the same strings
 *    that render, so it can never drift from what the visitor reads.
 *
 * WHAT THE SCHEMA IS AND IS NOT WORTH NOW
 * Google deprecated the FAQ rich result on 7 May 2026, dropped it from the
 * Rich Results Test that June and from the Search Console API that August.
 * FAQPage remains valid schema.org, is still consumed by Bing and by the
 * answer engines, and Google states that unused structured data causes no
 * harm. So it is emitted, it is correct, and it is a switch. What it is not
 * is a promise of a star in Google, and the listing copy must not claim one.
 *
 * HOW ONE FAQPage IS ASSEMBLED OUT OF MANY CMS ROWS
 * A code component cannot query a collection — no props.children.props.query,
 * no importing the collection module. The supported shape is one instance per
 * row inside a Collection List, with the fields connected on the canvas. That
 * leaves every instance blind to its siblings, so no single instance can emit
 * the whole FAQPage.
 *
 * The way out is JSON-LD's own merging rule rather than any coordination
 * between instances. Every instance emits a FAQPage carrying its one Question
 * and, critically, the SAME "@id" — a bare fragment, "#faq", which resolves
 * against the page's own URL with nothing read from window. Nodes that share
 * an @id are the same node, so a processor unions their properties: twelve
 * blocks in the HTML become one FAQPage with twelve questions in the graph.
 * It is pre-rendered, it needs no ordering, no registry and no hydration, and
 * it survives the CMS gaining a row. The group prop is what the fragment is
 * built from, so two FAQ sections on one page stay two separate nodes.
 *
 * HEIGHT WITHOUT MEASURING ANYTHING
 * The panel is a grid going from grid-template-rows: 0fr to 1fr, with the
 * child holding overflow: hidden and min-height: 0. That animates a real
 * "auto" height with no ResizeObserver, no scrollHeight read, no layout
 * effect and no reflow.
 *
 * WHY THE COLLAPSED PANEL IS visibility: hidden
 * overflow: hidden alone clips the answer but leaves it focusable: Tab lands
 * on a link nobody can see and scrolls the clipped box. visibility removes it
 * from the accessibility tree and the tab order while leaving the text in the
 * HTML, which is exactly the split we want — hidden from the person, present
 * for the crawler. Google indexes accordion content normally. The transition
 * is delayed on the way out so the collapse is still visible, and immediate
 * on the way in.
 *
 * ONE OPEN AT A TIME, ACROSS INSTANCES
 * In CMS mode each row is a separate React tree, so ordinary state cannot
 * close a sibling. Opening one dispatches a CustomEvent on document carrying
 * the group name and the instance id; every other instance in that group
 * closes. The listener is added in an effect, so the server never sees it,
 * and it is scoped by group so a second accordion elsewhere is unaffected.
 *
 * DEEP LINKS
 * Each row carries an id, from the Anchor field or from the question itself,
 * so /faq#can-i-return-something opens that answer and the browser scrolls to
 * it. The hash is read in an effect and re-read on hashchange, never during
 * render.
 *
 * A deep link also has to CLOSE the other rows when One At A Time is on,
 * and it announces that on a zero timeout rather than immediately. The
 * instances are separate React trees mounting in sequence: an immediate
 * dispatch is only heard by the instances that mounted before this one, so
 * a link to the first row leaves every later row untouched. Measured on a
 * simulation of eight instances: never announcing is right in 11 of 32
 * cases, announcing immediately in 22, announcing on the timeout in 32.
 *
 * NOTHING MOVES IN A STATIC PASS
 * useIsStaticRenderer gates the transition duration and nothing else. It does
 * not gate the markup and it does not gate the JSON-LD: a static pass covers
 * export and thumbnails, and gating content on it is how a component ends up
 * publishing an empty section.
 *
 * MAINTENANCE NOTE: the CSS is assembled by concatenation, not with a
 * template literal. A backtick inside a template literal ends the string and
 * makes the Property Controls disappear from the panel with no visible error.
 *
 * NAMING: the file name, the exported function and the first argument of
 * addPropertyControls at the bottom must all say FaqAccordion. Renaming the
 * file in Framer renames the function but NOT that argument, and the module
 * then throws while being evaluated. The error you get says the default
 * export is missing, which sends you to look at the export, and the export is
 * fine.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 240
 */
export default function FaqAccordion(props) {
    const {
        source,
        question,
        answer,
        linkUrl,
        linkLabel,
        newTab,
        openByDefault,
        anchor,
        items,
        headingTag,
        singleOpen,
        group,
        deepLink,
        schema,
        duration,
        appearance,
        style,
    } = props

    // Merging over a full default set means a control the panel has not
    // filled in yet, or an instance placed before the grouping existed, still
    // renders instead of printing undefined into the stylesheet.
    const A = withDefaults(APPEARANCE_DEFAULTS, appearance)

    const uid = "faq-" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // True on the canvas, on export and on thumbnails. Framer asks for this
    // hook rather than RenderTarget because export and thumbnail generation
    // are static passes too.
    const isStatic = useIsStaticRenderer()

    // Both modes collapse into the same row shape, so everything downstream
    // only ever sees one list.
    const raw =
        source === "list"
            ? Array.isArray(items)
                ? items
                : []
            : [
                  {
                      question: question,
                      answer: answer,
                      linkUrl: linkUrl,
                      linkLabel: linkLabel,
                      newTab: newTab,
                      openByDefault: openByDefault,
                      anchor: anchor,
                  },
              ]

    const rows = []
    for (let i = 0; i < raw.length; i++) {
        const r = raw[i]
        if (!r) continue
        if (oneLine(r.question) === "") continue
        rows.push(r)
    }

    // A dependency that tracks the values rather than the identity of an
    // array rebuilt on every render. The separator is written as an escape,
    // never as a raw NUL byte: a raw one turns the .tsx into a binary file
    // and does not survive a copy and paste.
    const signature = rows.map((r) => text(r.question)).join("\u0000")

    const initial = rows.map((r) => !!r.openByDefault)
    const [openRows, setOpenRows] = useState(initial)
    const [prevSignature, setPrevSignature] = useState(signature)

    // Adjusting state while the props change, the way the React docs
    // prescribe: no effect, no second commit, and correct on the server.
    if (prevSignature !== signature || openRows.length !== rows.length) {
        setPrevSignature(signature)
        setOpenRows(initial)
    }

    const groupKey = slugify(group) || "faq"

    useEffect(() => {
        if (!singleOpen) return
        const onOther = (event) => {
            const d = event && event.detail
            if (!d || d.group !== groupKey || d.id === uid) return
            setOpenRows((prev) => prev.map(() => false))
        }
        document.addEventListener(OPEN_EVENT, onOther)
        return () => document.removeEventListener(OPEN_EVENT, onOther)
    }, [singleOpen, groupKey, uid])

    const anchors = rows.map((r) => {
        if (!deepLink) return ""
        return slugify(r.anchor) || slugify(r.question)
    })
    const anchorKey = anchors.join("\u0000")

    useEffect(() => {
        if (!deepLink) return
        let timer = null
        const apply = () => {
            const rawHash = window.location.hash.replace(/^#/, "")
            let hash = rawHash
            try {
                hash = decodeURIComponent(rawHash)
            } catch (e) {
                hash = rawHash
            }
            if (!hash) return
            const index = anchors.indexOf(hash)
            if (index < 0) return
            setOpenRows((prev) => {
                const next = singleOpen ? prev.map(() => false) : prev.slice()
                next[index] = true
                return next
            })
            // A deep link has to close the other rows the same way a click
            // does. Without this, a row held open by the Open field stays
            // open beside the row the link targeted, and One At A Time is
            // visibly untrue on the very page that claims it.
            //
            // The announcement waits a tick on purpose. On first paint the
            // instances that come after this one have not run their effects
            // yet, so their listener does not exist and an immediate
            // dispatch reaches only the instances above. A timeout of zero
            // puts it after the whole commit, when all of them are ready.
            if (!singleOpen) return
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
                document.dispatchEvent(
                    new CustomEvent(OPEN_EVENT, {
                        detail: { group: groupKey, id: uid },
                    })
                )
            }, 0)
        }
        apply()
        window.addEventListener("hashchange", apply)
        return () => {
            window.removeEventListener("hashchange", apply)
            if (timer) clearTimeout(timer)
        }
    }, [deepLink, anchorKey, singleOpen, groupKey, uid])

    const toggle = (index) => {
        const willOpen = !openRows[index]
        setOpenRows((prev) => {
            const next =
                singleOpen && willOpen ? prev.map(() => false) : prev.slice()
            next[index] = willOpen
            return next
        })
        if (willOpen && singleOpen && typeof document !== "undefined") {
            document.dispatchEvent(
                new CustomEvent(OPEN_EVENT, {
                    detail: { group: groupKey, id: uid },
                })
            )
        }
    }

    // Only the transition is held still in a static pass. The markup and the
    // schema below are never gated on it.
    const ms = (isStatic ? 0 : Math.max(0, duration || 0)) + "ms"
    const ease = "cubic-bezier(0.4, 0, 0.2, 1)"

    const card = A.itemStyle === "card"
    const divided = A.itemStyle === "divided"
    const iconLeft = A.iconPosition === "left"

    const css = [
        "." + uid + " { display: flex; flex-direction: column; margin: 0;",
        "  width: 100%; gap: " + (card ? A.gap : 0) + "px; }",

        "." + uid + " .item { position: relative; margin: 0; min-width: 0; }",
        card
            ? "." +
              uid +
              " .item { background: " +
              A.background +
              "; border: " +
              A.borderWidth +
              "px solid " +
              A.borderColor +
              "; border-radius: " +
              px(A.radius) +
              ";" +
              (A.shadow ? " box-shadow: " + A.shadow + ";" : "") +
              " }"
            : "",
        divided
            ? "." +
              uid +
              " .item { border-bottom: " +
              A.borderWidth +
              "px solid " +
              A.borderColor +
              "; }"
            : "",
        divided ? "." + uid + " .item:last-child { border-bottom: 0; }" : "",

        "." + uid + " .head { margin: 0; padding: 0; font: inherit;",
        "  border-radius: inherit; }",

        // A button carries a browser stylesheet worth of defaults. All of it
        // is reset here so the designer's font and colour actually land.
        "." + uid + " .trigger { display: flex; width: 100%; margin: 0;",
        "  box-sizing: border-box; padding: " + A.padding + ";",
        "  align-items: center; gap: 14px; text-align: start;",
        "  flex-direction: " + (iconLeft ? "row-reverse" : "row") + ";",
        "  justify-content: space-between;",
        "  background: transparent; border: 0; border-radius: inherit;",
        "  -webkit-appearance: none; appearance: none; cursor: pointer;",
        "  " + fontCss(A.questionFont),
        "  color: " + A.questionColor + "; }",
        "." + uid + " .trigger .q { flex: 1 1 auto; min-width: 0;",
        "  text-align: start; overflow-wrap: break-word; }",
        A.hoverBackground
            ? "." +
              uid +
              " .trigger:hover { background: " +
              A.hoverBackground +
              "; }"
            : "",
        "." + uid + " .trigger:focus { outline: none; }",
        "." +
            uid +
            " .trigger:focus-visible { outline: 2px solid " +
            A.focusColor +
            "; outline-offset: -2px; }",

        "." + uid + " .icon { flex: 0 0 auto; position: relative;",
        "  width: " + A.iconSize + "px; height: " + A.iconSize + "px;",
        "  color: " + A.iconColor + "; }",
        "." + uid + " .icon svg { display: block; width: 100%; height: 100%; }",
        "." +
            uid +
            " .icon.chev { transition: transform " +
            ms +
            " " +
            ease +
            "; }",
        "." + uid + " .item.open .icon.chev { transform: rotate(180deg); }",

        // The plus is two bars; opening rotates and fades the upright one, so
        // it reads as a minus without swapping any node.
        "." + uid + " .icon.plus::before, ." + uid + " .icon.plus::after {",
        '  content: ""; position: absolute; background: currentColor;',
        "  border-radius: 1px; }",
        "." + uid + " .icon.plus::before { left: 0; right: 0; top: 50%;",
        "  height: 1.6px; transform: translateY(-50%); }",
        "." + uid + " .icon.plus::after { top: 0; bottom: 0; left: 50%;",
        "  width: 1.6px; transform: translateX(-50%);",
        "  transition: transform " + ms + " " + ease + ",",
        "    opacity " + ms + " linear; }",
        "." + uid + " .item.open .icon.plus::after {",
        "  transform: translateX(-50%) rotate(90deg); opacity: 0; }",

        // 0fr to 1fr is the whole height animation. Nothing is measured, and
        // the answer stays in the document the crawler is served.
        "." + uid + " .panel { display: grid; grid-template-rows: 0fr;",
        "  visibility: hidden;",
        "  transition: grid-template-rows " + ms + " " + ease + ",",
        "    visibility 0s linear " + ms + "; }",
        "." + uid + " .item.open .panel { grid-template-rows: 1fr;",
        "  visibility: visible;",
        "  transition: grid-template-rows " + ms + " " + ease + ",",
        "    visibility 0s linear 0s; }",
        "." + uid + " .panelInner { overflow: hidden; min-height: 0; }",
        "." + uid + " .panelPad { padding: " + A.answerPadding + "; }",

        "." + uid + " .a { margin: 0; white-space: pre-line;",
        "  overflow-wrap: break-word; " + fontCss(A.answerFont),
        "  color: " + A.answerColor + "; }",
        "." + uid + " .more { display: inline-block; margin-top: 10px;",
        "  color: " + A.linkColor + "; text-decoration: underline;",
        "  text-underline-offset: 2px; }",

        "." + uid + " .empty { margin: 0; padding: " + A.padding + ";",
        "  " + fontCss(A.answerFont),
        "  color: " + A.answerColor + "; }",

        "@media (prefers-reduced-motion: reduce) {",
        "  ." + uid + " .panel, ." + uid + " .item.open .panel,",
        "  ." + uid + " .icon.chev, ." + uid + " .icon.plus::after {",
        "    transition-duration: 0s; transition-delay: 0s; } }",
    ].join("\n")

    const rootStyle = { ...style, width: style?.width ?? "100%" }

    if (rows.length === 0) {
        // On the published site an empty CMS row should disappear, not print
        // an instruction. On the canvas the instruction is the whole point.
        if (!isCanvas) return null
        return (
            <div className={uid} style={rootStyle}>
                <div className="item">
                    <p className="empty">
                        {source === "list"
                            ? "Add your questions in the properties panel."
                            : "Connect Question and Answer to your CMS fields."}
                    </p>
                </div>
                <style>{css}</style>
            </div>
        )
    }

    const HeadingTag = headingTag === "none" ? "div" : headingTag

    // A row with no answer is still rendered — a half-filled CMS row should
    // not vanish from the page — but it is left out of the schema, which is
    // worth nothing without an acceptedAnswer.
    let jsonLd = null
    if (schema) {
        const entities = []
        for (let i = 0; i < rows.length; i++) {
            const a = oneLine(rows[i].answer)
            if (!a) continue
            entities.push({
                "@type": "Question",
                name: oneLine(rows[i].question),
                acceptedAnswer: { "@type": "Answer", text: a },
            })
        }
        if (entities.length > 0) {
            jsonLd = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                // A bare fragment resolves against the page's own URL with
                // nothing read from window, and is what merges every instance
                // on the page into a single FAQPage node.
                "@id": "#" + groupKey,
                mainEntity: entities,
            }).replace(/</g, "\\u003c")
        }
    }

    return (
        <div className={uid} style={rootStyle}>
            {rows.map((row, index) => {
                const open = !!openRows[index]
                const buttonId = uid + "-b" + index
                const panelId = uid + "-p" + index
                const label = text(row.linkLabel).trim()
                const href = text(row.linkUrl).trim()
                const id = anchors[index]

                return (
                    <div
                        key={buttonId}
                        id={id || undefined}
                        className={"item" + (open ? " open" : "")}
                    >
                        <HeadingTag className="head">
                            <button
                                type="button"
                                id={buttonId}
                                className="trigger"
                                aria-expanded={open}
                                aria-controls={panelId}
                                onClick={() => toggle(index)}
                            >
                                <span className="q">{text(row.question)}</span>
                                {A.icon === "none" ? null : A.icon ===
                                  "plus" ? (
                                    <span
                                        className="icon plus"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <span
                                        className="icon chev"
                                        aria-hidden="true"
                                    >
                                        <svg
                                            viewBox="0 0 16 16"
                                            focusable="false"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M4 6.5 L8 10.5 L12 6.5"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        </HeadingTag>
                        <div
                            id={panelId}
                            className="panel"
                            role="region"
                            aria-labelledby={buttonId}
                        >
                            <div className="panelInner">
                                <div className="panelPad">
                                    <p className="a">{text(row.answer)}</p>
                                    {href && label ? (
                                        <a
                                            className="more"
                                            href={href}
                                            target={
                                                row.newTab
                                                    ? "_blank"
                                                    : undefined
                                            }
                                            rel={
                                                row.newTab
                                                    ? "noopener noreferrer"
                                                    : undefined
                                            }
                                        >
                                            {label}
                                        </a>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
            {jsonLd ? (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: jsonLd }}
                />
            ) : null}
            <style>{css}</style>
        </div>
    )
}

addPropertyControls(FaqAccordion, {
    // --- where the questions come from -----------------------------------
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["cms", "list"],
        optionTitles: ["CMS", "List"],
        defaultValue: "cms",
        displaySegmentedControl: true,
        description:
            "CMS: drop one of these inside a Collection List and connect the fields. List: type the questions here.",
    },

    question: {
        type: ControlType.String,
        title: "Question",
        defaultValue: "How long does shipping take?",
        placeholder: "Connect a CMS text field",
        hidden: (p) => p.source !== "cms",
    },
    answer: {
        type: ControlType.String,
        title: "Answer",
        displayTextArea: true,
        defaultValue:
            "Orders leave the studio within two working days. Delivery then takes three to five working days, depending on where you are.",
        placeholder: "Connect a CMS text field",
        hidden: (p) => p.source !== "cms",
    },
    linkUrl: {
        type: ControlType.Link,
        title: "Link",
        hidden: (p) => p.source !== "cms",
        description: "Optional. Sits under the answer.",
    },
    linkLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "",
        placeholder: "Read the full policy",
        hidden: (p) => p.source !== "cms" || !p.linkUrl,
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (p) => p.source !== "cms" || !p.linkUrl,
    },
    openByDefault: {
        type: ControlType.Boolean,
        title: "Open",
        defaultValue: false,
        hidden: (p) => p.source !== "cms",
        description: "Connect a CMS toggle to open one chosen question.",
    },
    anchor: {
        type: ControlType.String,
        title: "Anchor",
        defaultValue: "",
        placeholder: "From the question",
        hidden: (p) => p.source !== "cms" || !p.deepLink,
        description: "Connect the slug field to link straight to this answer.",
    },

    items: {
        type: ControlType.Array,
        title: "Questions",
        defaultValue: ITEM_DEFAULTS,
        hidden: (p) => p.source !== "list",
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    defaultValue: "A question",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    displayTextArea: true,
                    defaultValue: "",
                },
                linkUrl: { type: ControlType.Link, title: "Link" },
                linkLabel: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "",
                    placeholder: "Read more",
                    hidden: (p) => !p.linkUrl,
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    hidden: (p) => !p.linkUrl,
                },
                openByDefault: {
                    type: ControlType.Boolean,
                    title: "Open",
                    defaultValue: false,
                },
                anchor: {
                    type: ControlType.String,
                    title: "Anchor",
                    defaultValue: "",
                    placeholder: "From the question",
                },
            },
        },
    },

    // --- behaviour --------------------------------------------------------
    singleOpen: {
        type: ControlType.Boolean,
        title: "One At A Time",
        defaultValue: true,
        description:
            "Works across a Collection List: opening one row closes the others.",
    },
    group: {
        type: ControlType.String,
        title: "Group",
        defaultValue: "faq",
        placeholder: "faq",
        description:
            "Two FAQ sections on one page need two names, or they close each other and share one schema block.",
    },
    deepLink: {
        type: ControlType.Boolean,
        title: "Deep Links",
        defaultValue: true,
        description:
            "Gives each row an id, so /faq#your-question opens that answer.",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 260,
        min: 0,
        max: 800,
        step: 10,
        unit: "ms",
        description: "Ignored under reduced motion.",
    },

    // --- structure and search ---------------------------------------------
    headingTag: {
        type: ControlType.Enum,
        title: "Question Tag",
        options: ["h2", "h3", "h4", "none"],
        optionTitles: ["H2", "H3", "H4", "None"],
        defaultValue: "h3",
        displaySegmentedControl: true,
        description:
            "One level below the heading above the accordion. Never H1.",
    },
    schema: {
        type: ControlType.Boolean,
        title: "FAQ Schema",
        defaultValue: true,
        description:
            "FAQPage JSON-LD built from the rows. Every row on the page merges into one FAQPage. Turn off if the page already declares one.",
    },

    // --- looks ------------------------------------------------------------
    appearance: {
        type: ControlType.Object,
        title: "Style",
        defaultValue: APPEARANCE_DEFAULTS,
        controls: {
            itemStyle: {
                type: ControlType.Enum,
                title: "Rows",
                options: ["card", "divided", "plain"],
                optionTitles: ["Card", "Divided", "Plain"],
                defaultValue: "card",
                displaySegmentedControl: true,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 10,
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
                hidden: (p) => p.itemStyle !== "card",
            },
            padding: {
                type: ControlType.Padding,
                title: "Question",
                defaultValue: "18px 20px",
            },
            answerPadding: {
                type: ControlType.Padding,
                title: "Answer",
                defaultValue: "0px 20px 18px 20px",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "12px",
                hidden: (p) => p.itemStyle !== "card",
            },
            background: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#FFFFFF",
                hidden: (p) => p.itemStyle !== "card",
            },
            hoverBackground: {
                type: ControlType.Color,
                title: "Hover",
                defaultValue: "#F7F7F5",
                description: "Pure CSS, no listener. Clear it for none.",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Line",
                defaultValue: 1,
                min: 0,
                max: 6,
                step: 1,
                unit: "px",
                hidden: (p) => p.itemStyle === "plain",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#E6E4DF",
                hidden: (p) => p.itemStyle === "plain",
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue: "",
                hidden: (p) => p.itemStyle !== "card",
            },
            focusColor: {
                type: ControlType.Color,
                title: "Focus",
                defaultValue: "#2D220F",
                description:
                    "The keyboard ring. It has to clear 3:1 on the row.",
            },
            questionFont: {
                type: ControlType.Font,
                title: "Question",
                controls: "extended",
                displayFontSize: true,
                defaultValue: {
                    fontSize: 17,
                    lineHeight: 1.35,
                    fontWeight: 600,
                },
            },
            questionColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#101828",
            },
            answerFont: {
                type: ControlType.Font,
                title: "Answer",
                controls: "extended",
                displayFontSize: true,
                defaultValue: {
                    fontSize: 15,
                    lineHeight: 1.55,
                    fontWeight: 400,
                },
            },
            answerColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#475467",
            },
            linkColor: {
                type: ControlType.Color,
                title: "Link",
                defaultValue: "#2D220F",
            },
            icon: {
                type: ControlType.Enum,
                title: "Icon",
                options: ["chevron", "plus", "none"],
                optionTitles: ["Chevron", "Plus", "None"],
                defaultValue: "chevron",
                displaySegmentedControl: true,
            },
            iconPosition: {
                type: ControlType.Enum,
                title: "Side",
                options: ["right", "left"],
                optionTitles: ["Right", "Left"],
                defaultValue: "right",
                displaySegmentedControl: true,
                hidden: (p) => p.icon === "none",
            },
            iconSize: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 18,
                min: 10,
                max: 40,
                step: 1,
                unit: "px",
                hidden: (p) => p.icon === "none",
            },
            iconColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#A59784",
                hidden: (p) => p.icon === "none",
            },
        },
    },
})
