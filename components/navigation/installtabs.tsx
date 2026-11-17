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


// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

type Language = "json" | "yaml" | "text"

interface TabIcon {
    src: string
    alt?: string
    srcSet?: string
}

interface TabItem {
    id: string
    label: string
    language: Language
    code: string
    icon?: TabIcon
    iconSize?: number
}

interface InstallTabsProps {
    tabs: TabItem[]
    defaultTabId: string

    equalHeight: boolean
    extraHeightPadding: number
    borderRadius: number
    borderWidth: number

    backgroundColor: string
    codeBackground: string
    borderColor: string
    accentColor: string
    titleColor: string
    mutedTextColor: string
    hoverTabBackground: string

    codeTextColor: string
    keyColor: string
    stringColor: string
    numberColor: string
    booleanColor: string
    commentColor: string
    punctColor: string

    labelFont: React.CSSProperties
    codeFont: React.CSSProperties

    copyLabel: string
    copiedLabel: string
    showCopyButton: boolean
}

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────

/**
 * Install Tabs — switch between code snippets per client, with copy.
 *
 * Common uses: npm/yarn/pnpm/bun install commands, MCP server configs
 * for Claude/Cursor/Cline, SDK init snippets across languages.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 280
 */
export default function InstallTabs(props: InstallTabsProps) {
    const {
        tabs,
        defaultTabId,
        equalHeight,
        extraHeightPadding,
        borderRadius,
        borderWidth,
        backgroundColor,
        codeBackground,
        borderColor,
        accentColor,
        titleColor,
        mutedTextColor,
        hoverTabBackground,
        codeTextColor,
        keyColor,
        stringColor,
        numberColor,
        booleanColor,
        commentColor,
        punctColor,
        labelFont,
        codeFont,
        copyLabel,
        copiedLabel,
        showCopyButton,
    } = props

    const safeTabs = Array.isArray(tabs) ? tabs : []
    const initialId =
        safeTabs.find((t) => t.id === defaultTabId)?.id ?? safeTabs[0]?.id ?? ""

    const [activeId, setActiveId] = React.useState<string>(initialId)
    const [copied, setCopied] = React.useState(false)
    const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
    const [maxPanelHeight, setMaxPanelHeight] = React.useState(0)

    const timeoutRef = React.useRef<number | null>(null)
    const measureRef = React.useRef<HTMLDivElement | null>(null)

    // Re-sync active tab if the tabs array changes in the editor
    React.useEffect(() => {
        if (!safeTabs.find((t) => t.id === activeId)) {
            setActiveId(safeTabs[0]?.id ?? "")
        }
    }, [safeTabs, activeId])

    // Cleanup pending copy-flip timeout on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
        }
    }, [])

    // Measure every tab off-screen to find the tallest, then lock the
    // panel to that height. Prevents the card from resizing when
    // switching between long and short snippets.
    //
    // useLayoutEffect runs synchronously before paint, so the lock is
    // applied on the first frame — no flash of unlocked content.
    //
    // Then a ResizeObserver re-measures whenever a child's height
    // changes (font swap, container width change, etc.) so the lock
    // stays correct after fonts load or the page reflows.
    React.useLayoutEffect(() => {
        if (!equalHeight) {
            setMaxPanelHeight(0)
            return
        }
        const container = measureRef.current
        if (!container) return

        const measure = () => {
            const children = container.children
            let tallest = 0
            for (let i = 0; i < children.length; i++) {
                const h = (children[i] as HTMLElement).offsetHeight
                if (h > tallest) tallest = h
            }
            if (tallest > 0) {
                // Functional update with equality check prevents an
                // infinite loop when ResizeObserver fires on its own
                // commit-induced reflows.
                setMaxPanelHeight((prev) => (prev === tallest ? prev : tallest))
            }
        }

        measure()

        // Re-measure once webfonts finish loading. Spread fonts often
        // arrive after the initial commit and change line heights.
        if (
            typeof document !== "undefined" &&
            (document as any).fonts?.ready?.then
        ) {
            ;(document as any).fonts.ready.then(measure).catch(() => {})
        }

        let ro: ResizeObserver | undefined
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure)
            const children = container.children
            for (let i = 0; i < children.length; i++) {
                ro.observe(children[i])
            }
        }

        return () => {
            if (ro) ro.disconnect()
        }
    }, [safeTabs, codeFont, equalHeight])

    if (safeTabs.length === 0) {
        return (
            <div
                style={{
                    ...labelFont,
                    padding: 40,
                    border: `1px dashed ${borderColor}`,
                    borderRadius,
                    background: backgroundColor,
                    color: mutedTextColor,
                    textAlign: "center",
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                Add tabs in the property panel.
            </div>
        )
    }

    const activeTab = safeTabs.find((t) => t.id === activeId) ?? safeTabs[0]

    const handleCopy = async () => {
        if (typeof window === "undefined") return
        const text = activeTab.code
        if (!text) return

        let success = false

        // Modern Clipboard API — preferred when available.
        if (navigator?.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text)
                success = true
            } catch {
                // Common in iframes without clipboard-write permission
                // (e.g. the Framer Marketplace preview) or when the
                // document isn't focused. Fall through to legacy path.
            }
        }

        // Legacy execCommand fallback — works in iframes without any
        // explicit clipboard permission and doesn't require focus.
        if (!success && typeof document !== "undefined" && document.body) {
            try {
                const textarea = document.createElement("textarea")
                textarea.value = text
                textarea.setAttribute("readonly", "")
                textarea.style.position = "fixed"
                textarea.style.left = "-9999px"
                textarea.style.top = "0"
                textarea.style.opacity = "0"
                textarea.style.pointerEvents = "none"
                document.body.appendChild(textarea)

                // Preserve any existing user selection on the page.
                const selection = document.getSelection()
                const previousRange =
                    selection && selection.rangeCount > 0
                        ? selection.getRangeAt(0)
                        : null

                textarea.focus()
                textarea.select()
                textarea.setSelectionRange(0, text.length)

                success = document.execCommand("copy")

                document.body.removeChild(textarea)

                if (previousRange && selection) {
                    selection.removeAllRanges()
                    selection.addRange(previousRange)
                }
            } catch {
                // Clipboard genuinely unavailable — give up silently.
            }
        }

        if (success) {
            setCopied(true)
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
            timeoutRef.current = window.setTimeout(
                () => setCopied(false),
                2000
            ) as unknown as number
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
        if (e.key === "ArrowRight") {
            e.preventDefault()
            setActiveId(safeTabs[(idx + 1) % safeTabs.length].id)
        } else if (e.key === "ArrowLeft") {
            e.preventDefault()
            setActiveId(
                safeTabs[(idx - 1 + safeTabs.length) % safeTabs.length].id
            )
        } else if (e.key === "Home") {
            e.preventDefault()
            setActiveId(safeTabs[0].id)
        } else if (e.key === "End") {
            e.preventDefault()
            setActiveId(safeTabs[safeTabs.length - 1].id)
        }
    }

    // Shared code block style — used for both the visible panel and the
    // hidden measure pass so heights are guaranteed to match.
    const codeBlockStyle: React.CSSProperties = {
        ...codeFont,
        background: codeBackground,
        color: codeTextColor,
        padding: 20,
        paddingRight: showCopyButton ? 80 : 20,
        margin: 0,
        overflowX: "auto",
        lineHeight: 1.55,
        whiteSpace: "pre",
        boxSizing: "border-box",
    }

    const lockedHeight =
        equalHeight && maxPanelHeight > 0
            ? maxPanelHeight + (extraHeightPadding || 0)
            : undefined

    return (
        <div
            style={{
                position: "relative",
                background: backgroundColor,
                border: `${borderWidth}px solid ${borderColor}`,
                borderRadius,
                width: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            {/* Inline style — webkit needs a pseudo-element rule to hide
                scrollbars; the inline scrollbarWidth: "none" only works
                in Firefox. */}
            <style>{`.it-tabs-row::-webkit-scrollbar{display:none;}`}</style>

            {/* Tabs row */}
            <div
                role="tablist"
                aria-label="Code variants"
                className="it-tabs-row"
                style={{
                    display: "flex",
                    overflowX: "auto",
                    overflowY: "hidden",
                    scrollbarWidth: "none",
                    touchAction: "pan-x",
                    overscrollBehavior: "contain",
                    WebkitOverflowScrolling: "touch",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    borderBottom: `${borderWidth}px solid ${borderColor}`,
                    background: backgroundColor,
                }}
            >
                {safeTabs.map((tab, idx) => {
                    const isActive = tab.id === activeId
                    const isHover = hoverIdx === idx
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            id={`it-tab-${tab.id}`}
                            aria-selected={isActive}
                            aria-controls={`it-panel-${tab.id}`}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => setActiveId(tab.id)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            onMouseEnter={() => setHoverIdx(idx)}
                            onMouseLeave={() => setHoverIdx(null)}
                            style={{
                                ...labelFont,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "12px 18px",
                                background:
                                    !isActive && isHover
                                        ? hoverTabBackground
                                        : "transparent",
                                color: isActive ? titleColor : mutedTextColor,
                                border: "none",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition:
                                    "color 120ms ease, background 120ms ease",
                                outline: "none",
                                flexShrink: 0,
                                boxShadow: isActive
                                    ? `inset 0 -2px 0 ${accentColor}`
                                    : "none",
                                fontFamily: "inherit",
                            }}
                        >
                            {tab.icon?.src && (
                                <img
                                    src={tab.icon.src}
                                    srcSet={tab.icon.srcSet}
                                    alt={tab.icon.alt || tab.label}
                                    style={{
                                        width: tab.iconSize || 16,
                                        height: tab.iconSize || 16,
                                        objectFit: "contain",
                                        display: "block",
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Panel */}
            <div
                role="tabpanel"
                id={`it-panel-${activeTab.id}`}
                aria-labelledby={`it-tab-${activeTab.id}`}
                style={{ position: "relative" }}
            >
                {showCopyButton && (
                    <button
                        type="button"
                        onClick={handleCopy}
                        aria-label={
                            copied
                                ? "Code copied to clipboard"
                                : "Copy code to clipboard"
                        }
                        style={{
                            ...labelFont,
                            position: "absolute",
                            top: 12,
                            right: 12,
                            padding: "6px 10px",
                            background: copied ? accentColor : backgroundColor,
                            color: copied
                                ? getReadableForeground(accentColor)
                                : mutedTextColor,
                            border: `1px solid ${copied ? accentColor : borderColor}`,
                            borderRadius: Math.max(borderRadius - 4, 4),
                            cursor: "pointer",
                            transition:
                                "background 160ms ease, color 160ms ease, border-color 160ms ease",
                            zIndex: 2,
                            fontFamily: "inherit",
                            fontSize: 11,
                            fontWeight: 500,
                            lineHeight: 1.2,
                        }}
                    >
                        {copied ? copiedLabel : copyLabel}
                    </button>
                )}

                <pre
                    style={{
                        ...codeBlockStyle,
                        minHeight: lockedHeight,
                    }}
                >
                    <code style={{ fontFamily: "inherit" }}>
                        <TokenizedCode
                            source={activeTab.code}
                            language={activeTab.language || "text"}
                            keyColor={keyColor}
                            stringColor={stringColor}
                            numberColor={numberColor}
                            booleanColor={booleanColor}
                            commentColor={commentColor}
                            punctColor={punctColor}
                            textColor={codeTextColor}
                        />
                    </code>
                </pre>
            </div>

            {/* Hidden measure pass — renders every tab off-screen so we
                can find the tallest. Uses raw text (no tokenizer) which
                is faster and still measures correctly. */}
            {equalHeight && (
                <div
                    ref={measureRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        visibility: "hidden",
                        pointerEvents: "none",
                        left: 0,
                        right: 0,
                        top: 0,
                        boxSizing: "border-box",
                    }}
                >
                    {safeTabs.map((tab) => (
                        <pre key={tab.id} style={codeBlockStyle}>
                            <code style={{ fontFamily: "inherit" }}>
                                {tab.code}
                            </code>
                        </pre>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────
// Foreground color picker for the "Copied" state
// ─────────────────────────────────────────────────────────────────

function getReadableForeground(input: string): string {
    if (!input) return "#FFFFFF"
    // Accept #RGB, #RRGGBB, or rgb()/rgba(). Anything else → white.
    let r = 0,
        g = 0,
        b = 0
    if (input.startsWith("#")) {
        let h = input.slice(1)
        if (h.length === 3)
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        if (h.length < 6) return "#FFFFFF"
        r = parseInt(h.slice(0, 2), 16)
        g = parseInt(h.slice(2, 4), 16)
        b = parseInt(h.slice(4, 6), 16)
    } else if (input.startsWith("rgb")) {
        const m = input.match(/(\d+(?:\.\d+)?)/g)
        if (!m || m.length < 3) return "#FFFFFF"
        r = parseInt(m[0], 10)
        g = parseInt(m[1], 10)
        b = parseInt(m[2], 10)
    } else {
        return "#FFFFFF"
    }
    const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luma > 0.6 ? "#0A0A0A" : "#FFFFFF"
}

// ─────────────────────────────────────────────────────────────────
// Tokenizer + renderer
// ─────────────────────────────────────────────────────────────────

type TokenType =
    | "key"
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "comment"
    | "punct"
    | "ws"
    | "text"

interface Token {
    type: TokenType
    value: string
}

function TokenizedCode(props: {
    source: string
    language: Language
    keyColor: string
    stringColor: string
    numberColor: string
    booleanColor: string
    commentColor: string
    punctColor: string
    textColor: string
}) {
    const {
        source,
        language,
        keyColor,
        stringColor,
        numberColor,
        booleanColor,
        commentColor,
        punctColor,
        textColor,
    } = props

    const tokens = React.useMemo(() => {
        const src = source ?? ""
        if (language === "json") return tokenizeJson(src)
        if (language === "yaml") return tokenizeYaml(src)
        return [{ type: "text" as TokenType, value: src }]
    }, [source, language])

    return (
        <>
            {tokens.map((t, i) => {
                let color = textColor
                if (t.type === "key") color = keyColor
                else if (t.type === "string") color = stringColor
                else if (t.type === "number") color = numberColor
                else if (t.type === "boolean" || t.type === "null")
                    color = booleanColor
                else if (t.type === "comment") color = commentColor
                else if (t.type === "punct") color = punctColor
                return (
                    <span key={i} style={{ color }}>
                        {t.value}
                    </span>
                )
            })}
        </>
    )
}

function tokenizeJson(input: string): Token[] {
    const tokens: Token[] = []
    let i = 0
    while (i < input.length) {
        const c = input[i]

        if (/\s/.test(c)) {
            let end = i
            while (end < input.length && /\s/.test(input[end])) end++
            tokens.push({ type: "ws", value: input.slice(i, end) })
            i = end
            continue
        }

        if (c === '"') {
            let end = i + 1
            while (end < input.length) {
                if (input[end] === "\\") {
                    end += 2
                    continue
                }
                if (input[end] === '"') {
                    end++
                    break
                }
                end++
            }
            let look = end
            while (look < input.length && /\s/.test(input[look])) look++
            const isKey = input[look] === ":"
            tokens.push({
                type: isKey ? "key" : "string",
                value: input.slice(i, end),
            })
            i = end
            continue
        }

        if (/\d/.test(c) || (c === "-" && /\d/.test(input[i + 1] ?? ""))) {
            let end = i + 1
            while (end < input.length && /[\d.eE+\-]/.test(input[end])) end++
            tokens.push({ type: "number", value: input.slice(i, end) })
            i = end
            continue
        }

        if (input.startsWith("true", i)) {
            tokens.push({ type: "boolean", value: "true" })
            i += 4
            continue
        }
        if (input.startsWith("false", i)) {
            tokens.push({ type: "boolean", value: "false" })
            i += 5
            continue
        }
        if (input.startsWith("null", i)) {
            tokens.push({ type: "null", value: "null" })
            i += 4
            continue
        }

        if (/[{}[\]:,]/.test(c)) {
            tokens.push({ type: "punct", value: c })
            i++
            continue
        }

        tokens.push({ type: "text", value: c })
        i++
    }
    return tokens
}

function tokenizeYaml(input: string): Token[] {
    const tokens: Token[] = []
    let i = 0
    let atLineStart = true

    while (i < input.length) {
        const c = input[i]

        if (c === "\n") {
            tokens.push({ type: "ws", value: c })
            i++
            atLineStart = true
            continue
        }

        if (c === " " || c === "\t") {
            let end = i
            while (
                end < input.length &&
                (input[end] === " " || input[end] === "\t")
            )
                end++
            tokens.push({ type: "ws", value: input.slice(i, end) })
            i = end
            continue
        }

        // Comment — # to end of line
        if (c === "#") {
            let end = i
            while (end < input.length && input[end] !== "\n") end++
            tokens.push({ type: "comment", value: input.slice(i, end) })
            i = end
            continue
        }

        // Quoted string
        if (c === '"' || c === "'") {
            const quote = c
            let end = i + 1
            while (end < input.length && input[end] !== quote) {
                if (input[end] === "\\") {
                    end += 2
                    continue
                }
                end++
            }
            if (end < input.length) end++
            tokens.push({ type: "string", value: input.slice(i, end) })
            atLineStart = false
            i = end
            continue
        }

        // Number — only when not the start of a list item or bare key
        if (/\d/.test(c)) {
            let end = i + 1
            while (end < input.length && /[\d.eE+\-]/.test(input[end])) end++
            // If followed by alphabetic chars, it's probably a version-ish
            // string token — fall through to identifier handling below.
            if (end < input.length && /[a-zA-Z_]/.test(input[end])) {
                // continue as identifier
            } else {
                tokens.push({ type: "number", value: input.slice(i, end) })
                atLineStart = false
                i = end
                continue
            }
        }

        // Identifier — key, boolean, or bare scalar
        if (/[a-zA-Z_@$]/.test(c) || /\d/.test(c)) {
            let end = i
            while (end < input.length && /[\w\-./@]/.test(input[end])) end++
            const word = input.slice(i, end)
            let look = end
            while (
                look < input.length &&
                (input[look] === " " || input[look] === "\t")
            )
                look++
            if (input[look] === ":") {
                tokens.push({ type: "key", value: word })
            } else if (word === "true" || word === "false") {
                tokens.push({ type: "boolean", value: word })
            } else if (word === "null" || word === "~") {
                tokens.push({ type: "null", value: word })
            } else {
                tokens.push({ type: "text", value: word })
            }
            atLineStart = false
            i = end
            continue
        }

        // List dash at start of line — punctuation
        if (c === "-" && atLineStart) {
            tokens.push({ type: "punct", value: c })
            atLineStart = false
            i++
            continue
        }

        // Other YAML punctuation
        if (/[:[\]{},|>]/.test(c)) {
            tokens.push({ type: "punct", value: c })
            atLineStart = false
            i++
            continue
        }

        tokens.push({ type: "text", value: c })
        atLineStart = false
        i++
    }
    return tokens
}

// ─────────────────────────────────────────────────────────────────
// Defaults — Toolcall MCP server install configs across clients,
// preserved verbatim from the original ClientInstaller component.
// ─────────────────────────────────────────────────────────────────

const DEFAULT_CLAUDE = `{
  "mcpServers": {
    "toolcall": {
      "command": "npx",
      "args": ["-y", "@toolcall/connect"],
      "env": {
        "TOOLCALL_API_KEY": "tc_live_..."
      }
    }
  }
}`

const DEFAULT_CURSOR = DEFAULT_CLAUDE

const DEFAULT_CLINE = `{
  "mcpServers": {
    "toolcall": {
      "command": "npx",
      "args": ["-y", "@toolcall/connect"],
      "env": {
        "TOOLCALL_API_KEY": "tc_live_..."
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}`

const DEFAULT_CONTINUE = `experimental:
  modelContextProtocolServers:
    - transport:
        type: stdio
        command: npx
        args: ["-y", "@toolcall/connect"]
        env:
          TOOLCALL_API_KEY: tc_live_...`

const DEFAULT_ZED = `{
  "context_servers": {
    "toolcall": {
      "command": {
        "path": "npx",
        "args": ["-y", "@toolcall/connect"]
      },
      "env": {
        "TOOLCALL_API_KEY": "tc_live_..."
      }
    }
  }
}`

const DEFAULT_WINDSURF = DEFAULT_CLAUDE

const DEFAULT_CODEX = `{
  "mcpServers": {
    "toolcall": {
      "command": "npx",
      "args": ["-y", "@toolcall/connect"],
      "env": {
        "TOOLCALL_API_KEY": "tc_live_..."
      }
    }
  }
}`

// ─────────────────────────────────────────────────────────────────
// Property controls
// ─────────────────────────────────────────────────────────────────

addPropertyControls(InstallTabs, {
    // ── Content
    tabs: {
        type: ControlType.Array,
        title: "Tabs",
        control: {
            type: ControlType.Object,
            controls: {
                id: {
                    type: ControlType.String,
                    title: "ID",
                    defaultValue: "claude-desktop",
                    description:
                        "Unique identifier used to track the active tab. Lowercase, no spaces.",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "CLAUDE DESKTOP",
                    description: "Text shown on the tab.",
                },
                language: {
                    type: ControlType.Enum,
                    title: "Language",
                    options: ["text", "json", "yaml"],
                    optionTitles: ["Plain text", "JSON", "YAML"],
                    defaultValue: "json",
                    description:
                        "Syntax highlighting mode for this tab. Use plain text for shell commands.",
                },
                code: {
                    type: ControlType.String,
                    title: "Code",
                    displayTextArea: true,
                    defaultValue: DEFAULT_CLAUDE,
                    description: "Code shown when this tab is active.",
                },
                icon: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                    description:
                        "Optional small icon shown to the left of the label.",
                },
                iconSize: {
                    type: ControlType.Number,
                    title: "Icon Size",
                    defaultValue: 16,
                    min: 10,
                    max: 32,
                    step: 1,
                    unit: "px",
                },
            },
        },
        defaultValue: [
            {
                id: "claude-desktop",
                label: "CLAUDE DESKTOP",
                language: "json",
                code: DEFAULT_CLAUDE,
                iconSize: 16,
            },
            {
                id: "cursor",
                label: "CURSOR",
                language: "json",
                code: DEFAULT_CURSOR,
                iconSize: 16,
            },
            {
                id: "cline",
                label: "CLINE",
                language: "json",
                code: DEFAULT_CLINE,
                iconSize: 16,
            },
            {
                id: "continue",
                label: "CONTINUE",
                language: "yaml",
                code: DEFAULT_CONTINUE,
                iconSize: 16,
            },
            {
                id: "zed",
                label: "ZED",
                language: "json",
                code: DEFAULT_ZED,
                iconSize: 16,
            },
            {
                id: "windsurf",
                label: "WINDSURF",
                language: "json",
                code: DEFAULT_WINDSURF,
                iconSize: 16,
            },
            {
                id: "codex-cli",
                label: "CODEX CLI",
                language: "json",
                code: DEFAULT_CODEX,
                iconSize: 16,
            },
        ],
    },
    defaultTabId: {
        type: ControlType.String,
        title: "Active Tab",
        defaultValue: "claude-desktop",
        description: "ID of the tab shown on first load.",
    },

    // ── Layout
    equalHeight: {
        type: ControlType.Boolean,
        title: "Equal Height",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        description:
            "Locks the panel to the tallest tab so switching never causes a height jump.",
    },
    extraHeightPadding: {
        type: ControlType.Number,
        title: "Extra Height",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
        hidden: ({ equalHeight }: any) => !equalHeight,
        description: "Adds extra room below the tallest tab.",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 10,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 1,
        unit: "px",
    },

    // ── Color
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    codeBackground: {
        type: ControlType.Color,
        title: "Code BG",
        defaultValue: "#FAFAFA",
        description: "Background of the code area below the tabs.",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E5E5E5",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0A0A0A",
        description:
            "Underline color for the active tab and the copy confirmation state.",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Active Text",
        defaultValue: "#0A0A0A",
        description: "Color of the active tab label.",
    },
    mutedTextColor: {
        type: ControlType.Color,
        title: "Muted Text",
        defaultValue: "#737373",
        description: "Color of inactive tabs and the copy button.",
    },
    hoverTabBackground: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "rgba(0,0,0,0.03)",
        description: "Background of an inactive tab on hover.",
    },

    // ── Syntax colors
    codeTextColor: {
        type: ControlType.Color,
        title: "Code Text",
        defaultValue: "#0A0A0A",
        description: "Default color for code text.",
    },
    keyColor: {
        type: ControlType.Color,
        title: "Keys",
        defaultValue: "#0A0A0A",
        description: "JSON or YAML keys.",
    },
    stringColor: {
        type: ControlType.Color,
        title: "Strings",
        defaultValue: "#0E7C5C",
        description: "Quoted string values.",
    },
    numberColor: {
        type: ControlType.Color,
        title: "Numbers",
        defaultValue: "#8855B7",
    },
    booleanColor: {
        type: ControlType.Color,
        title: "Booleans",
        defaultValue: "#8855B7",
        description: "Booleans and null values.",
    },
    commentColor: {
        type: ControlType.Color,
        title: "Comments",
        defaultValue: "#94A3B8",
        description: "YAML comments (lines starting with #).",
    },
    punctColor: {
        type: ControlType.Color,
        title: "Punctuation",
        defaultValue: "#94A3B8",
        description: "Braces, brackets, commas, and colons.",
    },

    // ── Typography
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 13,
            variant: "Medium",
            lineHeight: "1.4em",
            letterSpacing: "0",
        },
    },
    codeFont: {
        type: ControlType.Font,
        title: "Code Font",
        controls: "extended",
        defaultFontType: "monospace",
        defaultValue: {
            fontSize: 13,
            variant: "Regular",
            lineHeight: "1.55em",
        },
    },

    // ── Copy button
    showCopyButton: {
        type: ControlType.Boolean,
        title: "Copy Button",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    copyLabel: {
        type: ControlType.String,
        title: "Copy Label",
        defaultValue: "Copy",
        hidden: ({ showCopyButton }: any) => !showCopyButton,
    },
    copiedLabel: {
        type: ControlType.String,
        title: "Copied Label",
        defaultValue: "Copied",
        hidden: ({ showCopyButton }: any) => !showCopyButton,
    },
})
