// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"
import * as React from "react"
import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

type Language = "plain" | "js" | "ts" | "jsx" | "tsx" | "css" | "json" | "html"
type ThemePreset = "dark" | "light" | "custom"

interface HeaderSettings {
    enabled: boolean
    showDots: boolean
    background: string
    title: string
    font: any
    titleColor: string
    copy: {
        enabled: boolean
        label: string
        copiedLabel: string
        copiedDurationMs: number
        color: string
        accentColor: string
    }
}

interface CodeAreaSettings {
    showLineNumbers: boolean
    wrap: boolean
    padding: number
    background: string
    selectionColor: string
    textColor: string
    subtleTextColor: string
    font: any
}

interface BorderSettings {
    color: string
    width: number
    radius: string
}

interface Props {
    code: string
    language: Language
    theme: ThemePreset

    header: HeaderSettings
    codeArea: CodeAreaSettings
    border: BorderSettings

    background: string
    style?: React.CSSProperties
}

const DEFAULT_CODE = `import React, { useState } from 'react';

export default function PricingCard() {
  const [isYearly, setIsYearly] = useState(false);
  
  return (
    <div className="pricing-card">
      <h3>Pro Plan</h3>
      <p className="price">
        \${isYearly ? '99' : '12'} 
        <span className="duration">
          /{isYearly ? 'year' : 'month'}
        </span>
      </p>
      
      <button onClick={() => setIsYearly(!isYearly)}>
        Toggle Billing
      </button>
      
      <ul className="features">
        <li>Unlimited Projects</li>
        <li>Priority Support</li>
      </ul>
    </div>
  );
}`

/**
 * Helper to determine if a color is dark
 */
function isColorDark(color: string): boolean {
    if (!color) return false
    let r = 0,
        g = 0,
        b = 0
    let c = color.trim()
    if (c.startsWith("#")) {
        let hex = c.replace("#", "")
        if (hex.length === 3)
            hex = hex
                .split("")
                .map((x) => x + x)
                .join("")
        r = parseInt(hex.substring(0, 2), 16) || 0
        g = parseInt(hex.substring(2, 4), 16) || 0
        b = parseInt(hex.substring(4, 6), 16) || 0
    } else if (c.startsWith("rgb")) {
        const match = c.match(/\d+(\.\d+)?/g)
        if (match && match.length >= 3) {
            r = parseInt(match[0], 10)
            g = parseInt(match[1], 10)
            b = parseInt(match[2], 10)
        }
    }
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5
}

/**
 * Helper to add alpha to any hex or rgb color
 */
function setAlpha(color: string, alpha: number): string {
    if (!color) return "transparent"
    let c = color.trim()
    if (c.startsWith("#")) {
        let hex = c.replace("#", "")
        if (hex.length === 3)
            hex = hex
                .split("")
                .map((x) => x + x)
                .join("")
        if (hex.length === 6) {
            const a = Math.round(alpha * 255)
                .toString(16)
                .padStart(2, "0")
            return `#${hex}${a}`
        }
        if (hex.length === 8) return c
    }
    if (c.startsWith("rgb")) {
        const m = c.match(/\d+(\.\d+)?/g)
        if (m && m.length >= 3) {
            return `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${alpha})`
        }
    }
    return c
}

/**
 * @framerName Customizable Code Block
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 420
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CodeBlock(props: Props) {
    const isStatic = useIsStaticRenderer()
    const {
        code = DEFAULT_CODE,
        language = "jsx",
        theme = "dark",

        header = {
            enabled: true,
            showDots: true,
            background: "#1A1A1A",
            title: "Example",
            font: undefined,
            titleColor: "#E5E5E5",
            copy: {
                enabled: true,
                label: "Copy",
                copiedLabel: "Copied",
                copiedDurationMs: 1200,
                color: "#888888",
                accentColor: "#E5E5E5",
            },
        },

        codeArea = {
            showLineNumbers: true,
            wrap: true,
            padding: 16,
            background: "#0D0D0D",
            selectionColor: "rgba(255, 255, 255, 0.1)",
            textColor: "#D4D4D4",
            subtleTextColor: "#555555",
            font: undefined,
        },

        border = {
            color: "#1A1A1A",
            width: 1,
            radius: "12px",
        },

        style,
    } = props

    const { showLineNumbers, wrap, padding, font: codeFont } = codeArea

    // Theme Logic: Map values based on selected preset
    const activeColors = useMemo(() => {
        if (theme === "light") {
            return {
                border: "#E5E5E5",
                containerBg: "#FFFFFF",
                headerBg: "#F5F5F5",
                title: "#000000",
                copy: "#A6A6A6",
                copyAccent: "#000000",
                codeBg: "#FFFFFF",
                text: "#383A42",
                subtleText: "#A0A1A7",
                selection: "rgba(0, 153, 255, 0.15)",
                isDark: false,
            }
        }
        if (theme === "dark") {
            return {
                border: "#1A1A1A",
                containerBg: "#0D0D0D",
                headerBg: "#1A1A1A",
                title: "#E5E5E5",
                copy: "#888888",
                copyAccent: "#E5E5E5",
                codeBg: "#0D0D0D",
                text: "#D4D4D4",
                subtleText: "#555555",
                selection: "rgba(255, 255, 255, 0.1)",
                isDark: true,
            }
        }
        // Custom
        return {
            border: border.color,
            containerBg: codeArea.background,
            headerBg: header.background,
            title: header.titleColor,
            copy: header.copy.color,
            copyAccent: header.copy.accentColor,
            codeBg: codeArea.background,
            text: codeArea.textColor,
            subtleText: codeArea.subtleTextColor,
            selection: codeArea.selectionColor,
            isDark: isColorDark(codeArea.background),
        }
    }, [theme, border, header, codeArea])

    const isThumbnail = RenderTarget.current() === RenderTarget.thumbnail
    const [copied, setCopied] = useState(false)
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (timerRef.current !== null && typeof window !== "undefined") {
                window.clearTimeout(timerRef.current)
                timerRef.current = null
            }
        }
    }, [])

    const normalizedCode = useMemo(() => {
        return (code ?? "").replace(/\r\n/g, "\n")
    }, [code])

    const lines = useMemo(() => {
        const arr = normalizedCode.split("\n")
        return arr.length === 0 ? [""] : arr
    }, [normalizedCode])

    const maxLineNumberDigits = useMemo(() => {
        return String(Math.max(1, lines.length)).length
    }, [lines.length])

    const copyToClipboard = useCallback(async () => {
        if (isStatic || isThumbnail) return
        if (typeof window === "undefined" || typeof document === "undefined")
            return

        const text = normalizedCode

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text)
            } else {
                const ta = document.createElement("textarea")
                ta.value = text
                ta.setAttribute("readonly", "true")
                ta.style.position = "absolute"
                ta.style.left = "-9999px"
                ta.style.top = "0"
                document.body.appendChild(ta)
                ta.select()
                document.execCommand("copy")
                document.body.removeChild(ta)
            }

            startTransition(() => setCopied(true))

            if (timerRef.current !== null) window.clearTimeout(timerRef.current)
            timerRef.current = window.setTimeout(
                () => {
                    startTransition(() => setCopied(false))
                },
                Math.max(200, header.copy.copiedDurationMs)
            )
        } catch {
            // ignore
        }
    }, [header.copy.copiedDurationMs, isStatic, isThumbnail, normalizedCode])

    const tokensByLine = useMemo(() => {
        if (language === "plain") return null
        return lines.map((line) => tokenizeLine(line, language))
    }, [lines, language])

    const containerBorder =
        border.width > 0
            ? `${border.width}px solid ${activeColors.border}`
            : "none"

    const headerHeight = 44

    const headerEl = header.enabled ? (
        <div
            style={{
                flex: "0 0 auto",
                height: headerHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "0 12px 0 14px",
                background: activeColors.headerBg,
                borderBottom: `1px solid ${activeColors.border}`,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    minWidth: 0,
                    flex: 1,
                }}
            >
                {header.showDots && (
                    <div
                        aria-hidden="true"
                        style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            flex: "0 0 auto",
                        }}
                    >
                        <Dot color="#F07178" />
                        <Dot color="#FFCB6B" />
                        <Dot color="#C3E88D" />
                    </div>
                )}
                <div
                    style={{
                        minWidth: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: activeColors.title,
                        ...header.font,
                    }}
                >
                    {header.title}
                </div>
            </div>

            {header.copy.enabled && (
                <motion.button
                    type="button"
                    onClick={copyToClipboard}
                    disabled={isStatic || isThumbnail}
                    whileTap={
                        isStatic || isThumbnail ? undefined : { scale: 0.98 }
                    }
                    style={{
                        appearance: "none",
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        color: copied
                            ? activeColors.copyAccent
                            : activeColors.copy,
                        cursor: isStatic || isThumbnail ? "default" : "pointer",
                        padding: "8px 10px",
                        margin: 0,
                        borderRadius: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        opacity: 1,
                        ...header.font,
                    }}
                    aria-label={
                        copied ? header.copy.copiedLabel : header.copy.label
                    }
                >
                    <span style={{ whiteSpace: "nowrap" }}>
                        {copied ? header.copy.copiedLabel : header.copy.label}
                    </span>
                    <CopyIcon />
                </motion.button>
            )}
        </div>
    ) : null

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                border: containerBorder,
                borderRadius: border.radius,
                background: activeColors.containerBg,
                display: "flex",
                flexDirection: "column",
                ...style,
            }}
        >
            {headerEl}

            <div
                style={{
                    position: "relative",
                    flex: "1 1 auto",
                    minHeight: 0,
                }}
            >
                {/* Scrollable Area */}
                <div
                    style={{
                        height: "100%",
                        overflowY: "auto",
                        overflowX: wrap ? "hidden" : "auto",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        padding: padding,
                        background: activeColors.codeBg,
                    }}
                >
                    <pre
                        aria-label={`Code block (${language})`}
                        style={{
                            margin: 0,
                            paddingBottom: "30px", // Extra padding so code doesn't hide behind fade permanently
                            color: activeColors.text,
                            background: "transparent",
                            tabSize: 2,
                            MozTabSize: 2,
                            position: "relative",
                            ...codeFont,
                            lineHeight: codeFont?.lineHeight ?? "1.5em",
                            whiteSpace: wrap ? "pre-wrap" : "pre",
                            overflowWrap: wrap ? "anywhere" : "normal",
                            wordBreak: wrap ? "break-word" : "normal",
                        }}
                    >
                        <style>
                            {`
                            ::selection { background: ${activeColors.selection}; }
                            *::-webkit-scrollbar { width: 0px; height: 0px; }
                            `}
                        </style>

                        <code style={{ display: "block" }}>
                            {lines.map((line, i) => {
                                const ln = i + 1
                                const tokens = tokensByLine
                                    ? tokensByLine[i]
                                    : null

                                return (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 12,
                                        }}
                                    >
                                        {showLineNumbers && (
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    flex: "0 0 auto",
                                                    width: `${Math.max(2, maxLineNumberDigits) + 1}ch`,
                                                    textAlign: "right",
                                                    color: activeColors.subtleText,
                                                    userSelect: "none",
                                                    fontVariantNumeric:
                                                        "tabular-nums",
                                                }}
                                            >
                                                {ln}
                                            </span>
                                        )}

                                        <span
                                            style={{
                                                flex: "1 1 auto",
                                                minWidth: 0,
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {tokens ? (
                                                <HighlightedLine
                                                    tokens={tokens}
                                                    baseColor={
                                                        activeColors.text
                                                    }
                                                    isDark={activeColors.isDark}
                                                />
                                            ) : (
                                                <span
                                                    style={{
                                                        color: activeColors.text,
                                                    }}
                                                >
                                                    {line.length
                                                        ? line
                                                        : "\u00A0"}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )
                            })}
                        </code>
                    </pre>
                </div>

                {/* Bottom Fade Overlay (Max 70% opacity) */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "50px",
                        pointerEvents: "none",
                        background: `linear-gradient(to bottom, transparent, ${setAlpha(activeColors.codeBg, 0.7)})`,
                    }}
                />
            </div>
        </div>
    )
}

function Dot({ color }: { color: string }) {
    return (
        <span
            style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: color,
                display: "inline-block",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
            }}
        />
    )
}

function CopyIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M8 7.5V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M6 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    )
}

type TokenType =
    | "plain"
    | "keyword"
    | "string"
    | "number"
    | "comment"
    | "operator"
    | "punct"
    | "tag"
    | "attr"
    | "value"
    | "boolean"
    | "nullish"
    | "function"
    | "class"

type Token = { t: TokenType; v: string }

function HighlightedLine({
    tokens,
    baseColor,
    isDark,
}: {
    tokens: Token[]
    baseColor: string
    isDark: boolean
}) {
    return (
        <span>
            {tokens.map((tok, idx) => (
                <span
                    key={idx}
                    style={{
                        color: tokenColor(tok.t, baseColor, isDark),
                    }}
                >
                    {tok.v.length ? tok.v : "\u00A0"}
                </span>
            ))}
        </span>
    )
}

function tokenColor(t: TokenType, baseColor: string, isDark: boolean): string {
    if (isDark) {
        // Neutral-based Vibrant Pastel
        switch (t) {
            case "keyword":
                return "#D2A8FF" // Soft Purple
            case "function":
                return "#82AAFF" // Soft Blue
            case "class":
                return "#FFCB6B" // Soft Yellow
            case "string":
                return "#C3E88D" // Soft Green
            case "number":
                return "#F78C6C" // Soft Peach/Orange
            case "comment":
                return "#7A7A7A" // Neutral Grey
            case "operator":
                return "#89DDFF" // Soft Cyan
            case "punct":
                return "#D4D4D4" // Light Neutral Grey
            case "tag":
                return "#F07178" // Soft Red
            case "attr":
                return "#FFCB6B" // Soft Yellow
            case "value":
                return "#C3E88D" // Soft Green
            case "boolean":
                return "#F78C6C" // Soft Peach/Orange
            case "nullish":
                return "#F78C6C" // Soft Peach/Orange
            case "plain":
            default:
                return baseColor
        }
    } else {
        // Vibrant Pastel Light
        switch (t) {
            case "keyword":
                return "#8839EF"
            case "function":
                return "#1E66F5"
            case "class":
                return "#DF8E1D"
            case "string":
                return "#40A02B"
            case "number":
                return "#FE640B"
            case "comment":
                return "#8C8FA1"
            case "operator":
                return "#04A5E5"
            case "punct":
                return "#4C4F69"
            case "tag":
                return "#D20F39"
            case "attr":
                return "#DF8E1D"
            case "value":
                return "#40A02B"
            case "boolean":
                return "#FE640B"
            case "nullish":
                return "#FE640B"
            case "plain":
            default:
                return baseColor
        }
    }
}

function tokenizeLine(line: string, language: Language): Token[] {
    if (language === "html") return tokenizeHtmlLine(line)
    if (language === "json") return tokenizeJsonLine(line)
    if (language === "css") return tokenizeCssLine(line)
    return tokenizeCodeLine(line)
}

function tokenizeHtmlLine(line: string): Token[] {
    const tokens: Token[] = []
    let i = 0
    while (i < line.length) {
        const ch = line[i]
        if (ch === "<") {
            const close = line.indexOf(">", i + 1)
            const end = close === -1 ? line.length : close + 1
            const segment = line.slice(i, end)

            const m = segment.match(/^<\/?\s*([a-zA-Z0-9:-]+)/)
            if (m) {
                const tagName = m[1]
                const prefixLen = segment.indexOf(tagName)
                if (prefixLen > 0)
                    tokens.push({ t: "punct", v: segment.slice(0, prefixLen) })
                tokens.push({ t: "tag", v: tagName })
                const rest = segment.slice(prefixLen + tagName.length)
                tokens.push(...tokenizeHtmlAttrs(rest))
            } else {
                tokens.push({ t: "tag", v: segment })
            }

            i = end
            continue
        }

        const next = line.indexOf("<", i)
        const end = next === -1 ? line.length : next
        tokens.push({ t: "plain", v: line.slice(i, end) })
        i = end
    }
    return tokens
}

function tokenizeHtmlAttrs(rest: string): Token[] {
    const tokens: Token[] = []
    let s = rest
    while (s.length) {
        const quoteIdx = s.search(/["']/)
        if (quoteIdx === -1) {
            tokens.push({ t: "punct", v: s })
            break
        }
        if (quoteIdx > 0) {
            tokens.push(...tokenizeAttrNames(s.slice(0, quoteIdx)))
            s = s.slice(quoteIdx)
        }
        const q = s[0]
        const end = s.indexOf(q, 1)
        const v = end === -1 ? s : s.slice(0, end + 1)
        tokens.push({ t: "value", v })
        s = end === -1 ? "" : s.slice(end + 1)
    }
    return tokens
}

function tokenizeAttrNames(text: string): Token[] {
    const tokens: Token[] = []
    let i = 0
    while (i < text.length) {
        const m = text.slice(i).match(/^[\s/=>]+/)
        if (m) {
            tokens.push({ t: "punct", v: m[0] })
            i += m[0].length
            continue
        }
        const n = text.slice(i).match(/^[a-zA-Z_:][-a-zA-Z0-9_:.]*/)
        if (n) {
            tokens.push({ t: "attr", v: n[0] })
            i += n[0].length
            continue
        }
        tokens.push({ t: "punct", v: text[i] })
        i++
    }
    return tokens
}

function tokenizeJsonLine(line: string): Token[] {
    return tokenizeGeneric(line, {
        keywords: ["true", "false", "null"],
        keywordType: (w) => (w === "null" ? "nullish" : "boolean"),
        commentStyle: "none",
    })
}

function tokenizeCssLine(line: string): Token[] {
    return tokenizeGeneric(line, {
        keywords: [],
        keywordType: () => "keyword",
        commentStyle: "block",
    })
}

function tokenizeCodeLine(line: string): Token[] {
    return tokenizeGeneric(line, {
        keywords: [
            "const",
            "let",
            "var",
            "function",
            "return",
            "if",
            "else",
            "for",
            "while",
            "do",
            "switch",
            "case",
            "break",
            "continue",
            "try",
            "catch",
            "finally",
            "throw",
            "new",
            "class",
            "extends",
            "super",
            "this",
            "import",
            "from",
            "export",
            "default",
            "type",
            "interface",
            "implements",
            "public",
            "private",
            "protected",
            "readonly",
            "as",
            "async",
            "await",
            "yield",
            "in",
            "of",
            "instanceof",
            "typeof",
            "void",
            "delete",
            "get",
            "set",
        ],
        keywordType: () => "keyword",
        commentStyle: "line+block",
    })
}

function tokenizeGeneric(
    line: string,
    opts: {
        keywords: string[]
        keywordType: (w: string) => TokenType
        commentStyle: "none" | "line" | "block" | "line+block"
    }
): Token[] {
    const tokens: Token[] = []
    const kw = new Set(opts.keywords)
    let i = 0

    const push = (t: TokenType, v: string) => {
        if (!v) return
        tokens.push({ t, v })
    }

    while (i < line.length) {
        const ch = line[i]

        if (
            (opts.commentStyle === "line" ||
                opts.commentStyle === "line+block") &&
            ch === "/" &&
            line[i + 1] === "/"
        ) {
            push("comment", line.slice(i))
            break
        }

        if (
            (opts.commentStyle === "block" ||
                opts.commentStyle === "line+block") &&
            ch === "/" &&
            line[i + 1] === "*"
        ) {
            const end = line.indexOf("*/", i + 2)
            const seg = end === -1 ? line.slice(i) : line.slice(i, end + 2)
            push("comment", seg)
            i += seg.length
            continue
        }

        if (ch === '"' || ch === "'" || ch === "`") {
            const q = ch
            let j = i + 1
            let escaped = false
            while (j < line.length) {
                const cj = line[j]
                if (escaped) {
                    escaped = false
                } else if (cj === "\\") {
                    escaped = true
                } else if (cj === q) {
                    j++
                    break
                }
                j++
            }
            push("string", line.slice(i, j))
            i = j
            continue
        }

        if (isDigit(ch) || (ch === "." && isDigit(line[i + 1] ?? ""))) {
            let j = i + 1
            while (j < line.length && /[0-9._eE+-]/.test(line[j])) j++
            push("number", line.slice(i, j))
            i = j
            continue
        }

        if (isIdentStart(ch)) {
            let j = i + 1
            while (j < line.length && isIdentPart(line[j])) j++
            const word = line.slice(i, j)

            let k = j
            while (k < line.length && (line[k] === " " || line[k] === "\t")) k++
            const isFunctionCall = line[k] === "("
            const isUppercase = /^[A-Z]/.test(word)

            if (kw.has(word)) push(opts.keywordType(word), word)
            else if (word === "true" || word === "false") push("boolean", word)
            else if (word === "null" || word === "undefined")
                push("nullish", word)
            else if (isFunctionCall) push("function", word)
            else if (isUppercase) push("class", word)
            else push("plain", word)

            i = j
            continue
        }

        if (/[=+\-*/%<>!&|^~?:]/.test(ch)) {
            const two = line.slice(i, i + 2)
            const three = line.slice(i, i + 3)
            if (["===", "!==", ">>>"].includes(three)) {
                push("operator", three)
                i += 3
                continue
            }
            if (
                [
                    "==",
                    "!=",
                    "<=",
                    ">=",
                    "=>",
                    "&&",
                    "||",
                    "??",
                    "++",
                    "--",
                    "+=",
                    "-=",
                    "*=",
                    "/=",
                ].includes(two)
            ) {
                push("operator", two)
                i += 2
                continue
            }
            push("operator", ch)
            i++
            continue
        }

        if (/[()[\]{},.;]/.test(ch)) {
            push("punct", ch)
            i++
            continue
        }

        if (ch === " " || ch === "\t") {
            let j = i + 1
            while (j < line.length && (line[j] === " " || line[j] === "\t")) j++
            push("plain", line.slice(i, j))
            i = j
            continue
        }

        push("plain", ch)
        i++
    }

    return tokens.length ? tokens : [{ t: "plain", v: "\u00A0" }]
}

function isDigit(ch: string) {
    return ch >= "0" && ch <= "9"
}
function isIdentStart(ch: string) {
    return (
        (ch >= "A" && ch <= "Z") ||
        (ch >= "a" && ch <= "z") ||
        ch === "_" ||
        ch === "$"
    )
}
function isIdentPart(ch: string) {
    return isIdentStart(ch) || isDigit(ch)
}

addPropertyControls(CodeBlock, {
    code: {
        type: ControlType.String,
        title: "Code",
        defaultValue: DEFAULT_CODE,
        displayTextArea: true,
        preventLocalization: true,
    },
    language: {
        type: ControlType.Enum,
        title: "Language",
        options: ["plain", "js", "ts", "jsx", "tsx", "css", "json", "html"],
        optionTitles: [
            "Plain",
            "JavaScript",
            "TypeScript",
            "JSX",
            "TSX",
            "CSS",
            "JSON",
            "HTML",
        ],
        defaultValue: "jsx",
        displaySegmentedControl: false,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light", "custom"],
        optionTitles: ["Dark", "Light", "Custom"],
        defaultValue: "dark",
        displaySegmentedControl: false,
    },

    header: {
        type: ControlType.Object,
        title: "Header",
        icon: "object",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            showDots: {
                type: ControlType.Boolean,
                title: "Window Dots",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                hidden: (h: any) => !h?.enabled,
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#1A1A1A",
                hidden: (h: any, props: any) =>
                    !h?.enabled ||
                    props?.theme === "dark" ||
                    props?.theme === "light",
            },
            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Example",
                hidden: (h: any) => !h?.enabled,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "13px",
                    variant: "Medium",
                    letterSpacing: "-0.01em",
                    lineHeight: "1em",
                },
                hidden: (h: any) => !h?.enabled,
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#E5E5E5",
                hidden: (h: any, props: any) =>
                    !h?.enabled ||
                    props?.theme === "dark" ||
                    props?.theme === "light",
            },
            copy: {
                type: ControlType.Object,
                title: "Copy",
                icon: "interaction",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Button",
                        defaultValue: true,
                        enabledTitle: "Show",
                        disabledTitle: "Hide",
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#888888",
                        hidden: (c: any, props: any) =>
                            !c?.enabled ||
                            props?.theme === "dark" ||
                            props?.theme === "light",
                    },
                    label: {
                        type: ControlType.String,
                        title: "Label",
                        defaultValue: "Copy",
                        hidden: (c: any) => !c?.enabled,
                    },
                    copiedLabel: {
                        type: ControlType.String,
                        title: "Copied Label",
                        defaultValue: "Copied",
                        hidden: (c: any) => !c?.enabled,
                    },
                    copiedDurationMs: {
                        type: ControlType.Number,
                        title: "Copied Time",
                        defaultValue: 1200,
                        min: 200,
                        max: 5000,
                        step: 50,
                        unit: "ms",
                        hidden: (c: any) => !c?.enabled,
                    },
                    accentColor: {
                        type: ControlType.Color,
                        title: "Accent",
                        defaultValue: "#E5E5E5",
                        hidden: (c: any, props: any) =>
                            !c?.enabled ||
                            props?.theme === "dark" ||
                            props?.theme === "light",
                    },
                },
                hidden: (h: any) => !h?.enabled,
                defaultValue: {
                    enabled: true,
                    color: "#888888",
                    label: "Copy",
                    copiedLabel: "Copied",
                    copiedDurationMs: 1200,
                    accentColor: "#E5E5E5",
                },
            },
        },
        defaultValue: {
            enabled: true,
            showDots: true,
            background: "#1A1A1A",
            title: "Example",
            font: undefined,
            titleColor: "#E5E5E5",
            copy: {
                enabled: true,
                color: "#888888",
                label: "Copy",
                copiedLabel: "Copied",
                copiedDurationMs: 1200,
                accentColor: "#E5E5E5",
            },
        },
    },

    codeArea: {
        type: ControlType.Object,
        title: "Code Area",
        icon: "object",
        controls: {
            showLineNumbers: {
                type: ControlType.Boolean,
                title: "Line Numbers",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#0D0D0D",
                hidden: (c: any, props: any) =>
                    props?.theme === "dark" || props?.theme === "light",
            },
            selectionColor: {
                type: ControlType.Color,
                title: "Selection",
                defaultValue: "rgba(255, 255, 255, 0.1)",
                hidden: (c: any, props: any) =>
                    props?.theme === "dark" || props?.theme === "light",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#D4D4D4",
                hidden: (c: any, props: any) =>
                    props?.theme === "dark" || props?.theme === "light",
            },
            subtleTextColor: {
                type: ControlType.Color,
                title: "Subtle",
                defaultValue: "#555555",
                hidden: (c: any, props: any) =>
                    !c?.showLineNumbers ||
                    props?.theme === "dark" ||
                    props?.theme === "light",
            },
            wrap: {
                type: ControlType.Boolean,
                title: "Wrap",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                defaultValue: 16,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",
            },
            font: {
                type: ControlType.Font,
                title: "Code Font",
                controls: "extended",
                defaultFontType: "monospace",
                defaultValue: {
                    fontSize: "13px",
                    letterSpacing: "-0.01em",
                    lineHeight: "1.55em",
                },
            },
        },
        defaultValue: {
            showLineNumbers: true,
            wrap: true,
            padding: 16,
            background: "#0D0D0D",
            selectionColor: "rgba(255, 255, 255, 0.1)",
            textColor: "#D4D4D4",
            subtleTextColor: "#555555",
        },
    },

    border: {
        type: ControlType.Object,
        title: "Border",
        icon: "object",
        controls: {
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#1A1A1A",
                hidden: (b: any, props: any) =>
                    props?.theme === "dark" || props?.theme === "light",
            },
            width: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 1,
                min: 0,
                max: 8,
                step: 1,
                unit: "px",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "12px",
            },
        },
        defaultValue: {
            color: "#1A1A1A",
            width: 1,
            radius: "12px",
        },
    },
})

CodeBlock.displayName = "Customizable Code Block"
