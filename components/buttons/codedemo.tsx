// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState, useCallback, useMemo } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type EasingType = "linear" | "ease" | "spring"
type ThemeType = "dark" | "light"

interface CodeDemoProps {
    code: string
    filename: string
    duration: number
    delay: number
    writing: boolean
    cursor: boolean
    easing: EasingType
    theme: ThemeType
    showCopyButton: boolean
    showLineNumbers: boolean
    showEditButton: boolean
    fontSize: number
    onCopy?: () => void
    onCodeChange?: (code: string) => void
}

// ─── Token types ──────────────────────────────────────────────────────────────

type TokenType =
    | "keyword"
    | "string"
    | "type"
    | "punctuation"
    | "function"
    | "tag"
    | "attribute"
    | "comment"
    | "number"
    | "plain"

type Token = { type: TokenType; text: string }
type Line = Token[]

// ─── Lightweight TSX tokenizer ────────────────────────────────────────────────

const TOKEN_RULES: Array<{ type: TokenType; re: RegExp }> = [
    { type: "comment", re: /^(\/\/.*|\/\*.*)/ },
    {
        type: "tag",
        re: /^(<\/[A-Za-z][A-Za-z0-9.]*>|<\/?>|<[A-Za-z][A-Za-z0-9.]*(?=[\s/>]))/,
    },
    { type: "attribute", re: /^(\{\.\.\.[\w]+\}|[a-zA-Z][\w-]*(?==))/ },
    {
        type: "string",
        re: /^(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/,
    },
    {
        type: "keyword",
        re: /^(import|export|from|as|type|interface|function|class|const|let|var|return|if|else|for|while|of|in|new|typeof|instanceof|extends|implements|default|async|await|void|never|null|undefined|true|false|this|super|static|readonly|public|private|protected|abstract|declare|namespace|enum|keyof|infer|is)\b/,
    },
    { type: "type", re: /^([A-Z][A-Za-z0-9]*)/ },
    { type: "number", re: /^(\d+\.?\d*)/ },
    { type: "punctuation", re: /^([{}()[\]<>:;,.|&?!=+\-*/^%~@#])/ },
    { type: "function", re: /^([a-z_$][\w$]*(?=\())/ },
    { type: "plain", re: /^([\w$]+|[^\w\s])/ },
    { type: "plain", re: /^(\s+)/ },
]

function tokenizeLine(lineText: string): Token[] {
    const tokens: Token[] = []
    let remaining = lineText
    while (remaining.length > 0) {
        let matched = false
        for (const { type, re } of TOKEN_RULES) {
            const m = remaining.match(re)
            if (m) {
                tokens.push({ type, text: m[1] })
                remaining = remaining.slice(m[1].length)
                matched = true
                break
            }
        }
        if (!matched) {
            tokens.push({ type: "plain", text: remaining[0] })
            remaining = remaining.slice(1)
        }
    }
    return tokens
}

function tokenizeCode(rawCode: string): Line[] {
    return rawCode.split("\n").map((line) => tokenizeLine(line))
}

// ─── Default code ─────────────────────────────────────────────────────────────

const DEFAULT_CODE = `'use client';
 
import * as React from 'react';
  
type MyComponentProps = {
  myProps: string;
} & React.ComponentProps<'div'>;
  
function MyComponent(props: MyComponentProps) {
  return (
    <div {...props}>
      <p>My Component</p>
    </div>
  );
}
export { MyComponent, type MyComponentProps };`

// ─── Themes ───────────────────────────────────────────────────────────────────

const DARK_THEME = {
    window: "#0d1117",
    header: "#161b22",
    border: "#30363d",
    lineNumber: "#484f58",
    keyword: "#ff7b72",
    string: "#a5d6ff",
    type: "#ffa657",
    punctuation: "#79c0ff",
    function: "#d2a8ff",
    tag: "#7ee787",
    attribute: "#79c0ff",
    comment: "#8b949e",
    number: "#79c0ff",
    plain: "#e6edf3",
    cursor: "#58a6ff",
    editorBg: "#010409",
    editorText: "#e6edf3",
    editorBorder: "#21262d",
    copyBtn: { bg: "#21262d", border: "#30363d", text: "#8b949e" },
}

const LIGHT_THEME = {
    window: "#ffffff",
    header: "#f6f8fa",
    border: "#d0d7de",
    lineNumber: "#8c959f",
    keyword: "#cf222e",
    string: "#0a3069",
    type: "#953800",
    punctuation: "#0550ae",
    function: "#8250df",
    tag: "#116329",
    attribute: "#0550ae",
    comment: "#6e7781",
    number: "#0550ae",
    plain: "#24292f",
    cursor: "#0550ae",
    editorBg: "#f6f8fa",
    editorText: "#24292f",
    editorBorder: "#d0d7de",
    copyBtn: { bg: "#f6f8fa", border: "#d0d7de", text: "#57606a" },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEasedTime(
    index: number,
    total: number,
    duration: number,
    easing: EasingType
): number {
    const t = index / Math.max(total - 1, 1)
    let factor: number
    switch (easing) {
        case "ease":
            factor = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
            break
        case "spring": {
            const overshoot = Math.sin(t * Math.PI * 1.5) * 0.08
            factor = Math.min(1, t + overshoot)
            break
        }
        default:
            factor = t
    }
    return factor * duration * 1000
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ReactIcon({ size = 14 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="#58a6ff"
            style={{ flexShrink: 0 }}
        >
            <path d="M12 9.861a2.14 2.14 0 1 0 0 4.279 2.14 2.14 0 0 0 0-4.279zm-5.992 6.394-.472-.12C2.018 15.246 0 13.737 0 11.996s2.018-3.25 5.536-4.139l.472-.119.133.468a23.53 23.53 0 0 0 1.363 3.578l.101.213-.101.213a23.307 23.307 0 0 0-1.363 3.578l-.133.467zM5.317 8.95c-2.674.751-4.315 1.9-4.315 3.046 0 1.145 1.641 2.294 4.315 3.046a24.95 24.95 0 0 1 1.182-3.046A24.752 24.752 0 0 1 5.317 8.95zm12.675 7.444-.133-.468a23.479 23.479 0 0 0-1.363-3.578l-.101-.213.101-.213a23.479 23.479 0 0 0 1.363-3.578l.133-.468.473.119c3.517.889 5.535 2.398 5.535 4.139s-2.018 3.25-5.535 4.139l-.473.12zm-.491-4.259c.48 1.039.877 2.06 1.182 3.046 2.675-.752 4.315-1.901 4.315-3.046 0-1.146-1.641-2.294-4.315-3.046a24.788 24.788 0 0 1-1.182 3.046zM12 16.51l-.478-.43a24.787 24.787 0 0 0-2.647-2.837 24.788 24.788 0 0 0-2.647 2.837l-.478.43.478.43a24.787 24.787 0 0 0 2.647 2.837 24.788 24.788 0 0 0 2.647-2.837l.478-.43zm0-9.02-.478-.43A24.787 24.787 0 0 0 8.875 4.223a24.788 24.788 0 0 0-2.647 2.837l-.478.43.478.43a24.787 24.787 0 0 0 2.647 2.837 24.788 24.788 0 0 0 2.647-2.837L12 7.49z" />
        </svg>
    )
}

function PencilIcon({
    size = 13,
    color = "currentColor",
}: {
    size?: number
    color?: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    )
}

function CheckIcon({
    size = 13,
    color = "currentColor",
}: {
    size?: number
    color?: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

function TokenSpan({
    token,
    colors,
}: {
    token: Token
    colors: typeof DARK_THEME
}) {
    const colorMap: Record<TokenType, string> = {
        keyword: colors.keyword,
        string: colors.string,
        type: colors.type,
        punctuation: colors.punctuation,
        function: colors.function,
        tag: colors.tag,
        attribute: colors.attribute,
        comment: colors.comment,
        number: colors.number,
        plain: colors.plain,
    }
    return <span style={{ color: colorMap[token.type] }}>{token.text}</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CodeDemo({
    code: propCode,
    filename,
    duration,
    delay,
    writing,
    cursor,
    easing,
    theme,
    showCopyButton,
    showLineNumbers,
    showEditButton,
    fontSize,
    onCopy,
    onCodeChange,
}: CodeDemoProps) {
    const colors = theme === "dark" ? DARK_THEME : LIGHT_THEME

    // ── Code state ──────────────────────────────────────────────────────────
    // localCode is the source of truth for what's displayed/animated.
    // It initialises from the `code` prop but can diverge via inline editing.
    const [localCode, setLocalCode] = useState<string>(propCode || DEFAULT_CODE)
    const [isEditing, setIsEditing] = useState(false)
    const [editorDraft, setEditorDraft] = useState<string>(localCode)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Sync prop → local only when the prop itself changes (e.g. from Framer panel)
    // but don't overwrite local edits while the editor is open.
    useEffect(() => {
        if (!isEditing) setLocalCode(propCode || DEFAULT_CODE)
    }, [propCode])

    const codeLines = useMemo(() => tokenizeCode(localCode), [localCode])

    // ── Animation state ─────────────────────────────────────────────────────
    const [visibleLines, setVisibleLines] = useState<number[]>([])
    const [cursorLineIndex, setCursorLineIndex] = useState<number | null>(null)
    const [copied, setCopied] = useState(false)
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

    const clearAllTimers = useCallback(() => {
        timersRef.current.forEach(clearTimeout)
        timersRef.current = []
    }, [])

    const runAnimation = useCallback(() => {
        clearAllTimers()
        setVisibleLines([])
        setCursorLineIndex(null)

        if (isEditing) return // don't animate while editor is open

        const total = codeLines.length
        const delayMs = delay * 1000

        if (!writing) {
            const t = setTimeout(() => {
                setVisibleLines(codeLines.map((_, i) => i))
                if (cursor) setCursorLineIndex(total - 1)
            }, delayMs)
            timersRef.current.push(t)
            return
        }

        codeLines.forEach((_, i) => {
            const offset = delayMs + getEasedTime(i, total, duration, easing)
            const t = setTimeout(() => {
                setVisibleLines((prev) => [...prev, i])
                if (cursor) setCursorLineIndex(i)
            }, offset)
            timersRef.current.push(t)
        })

        if (!cursor) {
            const endT = setTimeout(
                () => setCursorLineIndex(null),
                delayMs + duration * 1000 + 100
            )
            timersRef.current.push(endT)
        }
    }, [
        writing,
        cursor,
        duration,
        delay,
        easing,
        codeLines,
        isEditing,
        clearAllTimers,
    ])

    useEffect(() => {
        runAnimation()
        return clearAllTimers
    }, [runAnimation])

    // ── Editor handlers ──────────────────────────────────────────────────────

    const openEditor = () => {
        setEditorDraft(localCode)
        setIsEditing(true)
        clearAllTimers()
        setVisibleLines(codeLines.map((_, i) => i))
        setCursorLineIndex(null)
        setTimeout(() => textareaRef.current?.focus(), 50)
    }

    const applyEdit = () => {
        setLocalCode(editorDraft)
        setIsEditing(false)
        onCodeChange?.(editorDraft)
        // runAnimation fires automatically because localCode triggers codeLines → runAnimation
    }

    const cancelEdit = () => {
        setEditorDraft(localCode)
        setIsEditing(false)
    }

    const handleTextareaKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (e.key === "Tab") {
            e.preventDefault()
            const el = e.currentTarget
            const start = el.selectionStart
            const end = el.selectionEnd
            const next =
                editorDraft.substring(0, start) +
                "  " +
                editorDraft.substring(end)
            setEditorDraft(next)
            requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = start + 2
            })
        }
        if (e.key === "Escape") cancelEdit()
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) applyEdit()
    }

    // ── Copy ─────────────────────────────────────────────────────────────────

    const handleCopy = () => {
        navigator.clipboard.writeText(localCode).catch(() => {})
        setCopied(true)
        onCopy?.()
        setTimeout(() => setCopied(false), 1500)
    }

    const lineCount = localCode.split("\n").length

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div
            style={{
                width: 420,
                fontFamily:
                    '"Fira Code", "JetBrains Mono", "Cascadia Code", Menlo, monospace',
                fontSize,
                lineHeight: 1.65,
                borderRadius: 10,
                overflow: "hidden",
                border: `1px solid ${colors.border}`,
                boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
                background: colors.window,
                position: "relative",
            }}
        >
            <style>{`
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
                .cd-textarea { caret-color: ${colors.cursor}; }
                .cd-textarea:focus { outline: none; }
                .cd-textarea::selection { background: rgba(88,166,255,0.25); }
            `}</style>

            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    background: colors.header,
                    borderBottom: `1px solid ${colors.border}`,
                }}
            >
                {(["#FF5F56", "#FFBD2E", "#27C93F"] as const).map((c) => (
                    <div
                        key={c}
                        style={{
                            width: 11,
                            height: 11,
                            borderRadius: "50%",
                            background: c,
                        }}
                    />
                ))}

                <div
                    style={{
                        marginLeft: 4,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: fontSize - 1,
                        color: colors.lineNumber,
                    }}
                >
                    <ReactIcon size={14} />
                    {filename}
                </div>

                <div
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    {/* Edit button (shown when not editing) */}
                    {showEditButton && !isEditing && (
                        <button
                            onClick={openEditor}
                            title="Edit code"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "3px 9px",
                                fontSize: fontSize - 2,
                                fontFamily: "inherit",
                                background: colors.copyBtn.bg,
                                border: `1px solid ${colors.copyBtn.border}`,
                                borderRadius: 5,
                                color: colors.copyBtn.text,
                                cursor: "pointer",
                                transition: "opacity 0.15s",
                            }}
                        >
                            <PencilIcon size={11} color={colors.copyBtn.text} />
                            edit
                        </button>
                    )}

                    {/* Cancel / Apply (shown when editing) */}
                    {isEditing && (
                        <>
                            <button
                                onClick={cancelEdit}
                                title="Cancel (Esc)"
                                style={{
                                    padding: "3px 9px",
                                    fontSize: fontSize - 2,
                                    fontFamily: "inherit",
                                    background: "transparent",
                                    border: `1px solid ${colors.copyBtn.border}`,
                                    borderRadius: 5,
                                    color: colors.copyBtn.text,
                                    cursor: "pointer",
                                }}
                            >
                                cancel
                            </button>
                            <button
                                onClick={applyEdit}
                                title="Apply (⌘+Enter)"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "3px 9px",
                                    fontSize: fontSize - 2,
                                    fontFamily: "inherit",
                                    background: "#1D9E75",
                                    border: "1px solid #1D9E75",
                                    borderRadius: 5,
                                    color: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                <CheckIcon size={11} color="#fff" />
                                apply
                            </button>
                        </>
                    )}

                    {showCopyButton && (
                        <button
                            onClick={handleCopy}
                            style={{
                                padding: "3px 10px",
                                fontSize: fontSize - 2,
                                fontFamily: "inherit",
                                background: colors.copyBtn.bg,
                                border: `1px solid ${colors.copyBtn.border}`,
                                borderRadius: 5,
                                color: copied ? "#3fb950" : colors.copyBtn.text,
                                cursor: "pointer",
                                transition: "all 0.15s",
                            }}
                        >
                            {copied ? "copied!" : "copy"}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Code body ─────────────────────────────────────────────────────── */}
            <div style={{ position: "relative", background: colors.window }}>
                {/* Syntax view */}
                <div style={{ padding: "14px 16px", minHeight: 300 }}>
                    {codeLines.map((line, lineIdx) => {
                        const isVisible =
                            isEditing || visibleLines.includes(lineIdx)
                        const isCursorLine =
                            !isEditing && cursorLineIndex === lineIdx
                        return (
                            <div
                                key={lineIdx}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    opacity: isVisible ? 1 : 0,
                                    minHeight: `${fontSize * 1.65}px`,
                                    whiteSpace: "pre",
                                }}
                            >
                                {showLineNumbers && (
                                    <span
                                        style={{
                                            color: colors.lineNumber,
                                            minWidth: 22,
                                            marginRight: 16,
                                            textAlign: "right",
                                            userSelect: "none",
                                            fontSize: fontSize - 1.5,
                                            paddingTop: 1,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {lineIdx + 1}
                                    </span>
                                )}
                                {line.map((token, tIdx) => (
                                    <TokenSpan
                                        key={tIdx}
                                        token={token}
                                        colors={colors}
                                    />
                                ))}
                                {cursor && isCursorLine && (
                                    <span
                                        style={{
                                            display: "inline-block",
                                            width: 2,
                                            height: fontSize + 1,
                                            background: colors.cursor,
                                            marginLeft: 1,
                                            verticalAlign: "middle",
                                            animation:
                                                "blink 1s step-end infinite",
                                        }}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Editor overlay — mounts over the syntax view when isEditing */}
                {isEditing && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: colors.editorBg,
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flex: 1,
                                overflow: "hidden",
                            }}
                        >
                            {/* Line number gutter */}
                            {showLineNumbers && (
                                <div
                                    style={{
                                        padding: "14px 0 14px 16px",
                                        minWidth: 38,
                                        background: colors.editorBg,
                                        borderRight: `1px solid ${colors.editorBorder}`,
                                        userSelect: "none",
                                        overflowY: "hidden",
                                        flexShrink: 0,
                                    }}
                                >
                                    {Array.from(
                                        { length: lineCount },
                                        (_, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    height: `${fontSize * 1.65}px`,
                                                    fontSize: fontSize - 1.5,
                                                    lineHeight: 1.65,
                                                    color: colors.lineNumber,
                                                    textAlign: "right",
                                                    paddingRight: 10,
                                                }}
                                            >
                                                {i + 1}
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Textarea */}
                            <textarea
                                ref={textareaRef}
                                className="cd-textarea"
                                value={editorDraft}
                                onChange={(e) => setEditorDraft(e.target.value)}
                                onKeyDown={handleTextareaKeyDown}
                                spellCheck={false}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                style={{
                                    flex: 1,
                                    padding: "14px 16px 40px",
                                    fontSize,
                                    fontFamily:
                                        '"Fira Code", "JetBrains Mono", "Cascadia Code", Menlo, monospace',
                                    lineHeight: 1.65,
                                    color: colors.editorText,
                                    background: colors.editorBg,
                                    border: "none",
                                    resize: "none",
                                    tabSize: 2,
                                    whiteSpace: "pre",
                                    overflowWrap: "normal",
                                    overflowX: "auto",
                                }}
                            />
                        </div>

                        {/* Hint bar */}
                        <div
                            style={{
                                padding: "5px 14px",
                                background: colors.header,
                                borderTop: `1px solid ${colors.editorBorder}`,
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                fontSize: fontSize - 2.5,
                                color: colors.lineNumber,
                                flexShrink: 0,
                            }}
                        >
                            <span>⌘↵ apply</span>
                            <span>Esc cancel</span>
                            <span>Tab → 2 spaces</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Default props ────────────────────────────────────────────────────────────

CodeDemo.defaultProps = {
    code: DEFAULT_CODE,
    filename: "my-component.tsx",
    duration: 8,
    delay: 0,
    writing: true,
    cursor: true,
    easing: "linear",
    theme: "dark",
    showCopyButton: true,
    showLineNumbers: true,
    showEditButton: true,
    fontSize: 12.5,
}

// ─── Framer property controls ─────────────────────────────────────────────────

addPropertyControls(CodeDemo, {
    code: {
        type: ControlType.String,
        title: "Code",
        defaultValue: DEFAULT_CODE,
        displayTextArea: true,
    },
    filename: {
        type: ControlType.String,
        title: "Filename",
        defaultValue: "my-component.tsx",
        placeholder: "my-component.tsx",
    },
    writing: {
        type: ControlType.Boolean,
        title: "Writing",
        defaultValue: true,
        enabledTitle: "Animated",
        disabledTitle: "Instant",
    },
    cursor: {
        type: ControlType.Boolean,
        title: "Cursor",
        defaultValue: true,
        enabledTitle: "Visible",
        disabledTitle: "Hidden",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 8,
        min: 0.5,
        max: 30,
        step: 0.5,
        unit: "s",
        displayStepper: true,
        hidden: (props) => !props.writing,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "s",
        displayStepper: true,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "linear",
        options: ["linear", "ease", "spring"],
        optionTitles: ["Linear", "Ease In-Out", "Spring"],
        hidden: (props) => !props.writing,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        defaultValue: "dark",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        displaySegmentedControl: true,
    },
    showCopyButton: {
        type: ControlType.Boolean,
        title: "Copy Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showLineNumbers: {
        type: ControlType.Boolean,
        title: "Line Numbers",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showEditButton: {
        type: ControlType.Boolean,
        title: "Edit Button",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 12.5,
        min: 10,
        max: 16,
        step: 0.5,
        unit: "px",
        displayStepper: true,
    },
    onCopy: {
        type: ControlType.EventHandler,
        title: "On Copy",
    },
    onCodeChange: {
        type: ControlType.EventHandler,
        title: "On Code Change",
    },
})
