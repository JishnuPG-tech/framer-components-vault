import * as React from "react"
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
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

import { motion } from "framer-motion"

type Lang =
    | "typescript"
    | "javascript"
    | "python"
    | "go"
    | "rust"
    | "ruby"
    | "php"
    | "java"
    | "shell"
    | "json"

type ThemeName =
    | "midnight"
    | "graphite"
    | "abyss"
    | "ember"
    | "porcelain"
    | "linen"
type Mode = "dark" | "light"

type Kind =
    | "pl"
    | "kw"
    | "st"
    | "nu"
    | "co"
    | "fn"
    | "ty"
    | "pr"
    | "pu"
    | "op"
    | "va"
    | "at"
    | "bo"

interface Tok {
    k: Kind
    v: string
}

interface TabItem {
    label?: string
    language?: Lang
    fileName?: string
    code?: string
    highlight?: string
}

interface FrameOpts {
    radius?: number
    codeSize?: number
    lineHeight?: number
    padding?: number
}

interface PanelOpts {
    windowDots?: boolean
    colorDots?: boolean
    fileBar?: boolean
    lineNumbers?: boolean
    statusBar?: boolean
    copyButton?: boolean
    themeToggle?: boolean
    wrap?: boolean
    italicComments?: boolean
}

interface MotionOpts {
    reveal?: boolean
    autoCycle?: boolean
    cycleSeconds?: number
    caret?: boolean
    glow?: boolean
}

interface Props {
    tabs?: TabItem[]
    defaultTab?: number
    theme?: ThemeName
    lightTheme?: ThemeName
    startMode?: Mode
    customAccent?: boolean
    accent?: string
    frame?: FrameOpts
    panels?: PanelOpts
    motionOpts?: MotionOpts
    copyLabel?: string
    copiedLabel?: string
    codeFont?: any
    uiFont?: any
    style?: React.CSSProperties
}

/* ------------------------------------------------------------------ */
/* Language data                                                      */
/* ------------------------------------------------------------------ */

const LANG_META: Record<Lang, { name: string; dot: string }> = {
    typescript: { name: "TypeScript", dot: "#4F8EF7" },
    javascript: { name: "JavaScript", dot: "#F2D04B" },
    python: { name: "Python", dot: "#64D2B0" },
    go: { name: "Go", dot: "#5AC8FA" },
    rust: { name: "Rust", dot: "#E2844A" },
    ruby: { name: "Ruby", dot: "#E2556A" },
    php: { name: "PHP", dot: "#9B8CFF" },
    java: { name: "Java", dot: "#E9A246" },
    shell: { name: "Shell", dot: "#A3D977" },
    json: { name: "JSON", dot: "#B3B3C2" },
}
const LANG_KEYS = Object.keys(LANG_META) as Lang[]

interface Spec {
    kw: Set<string>
    bo: Set<string>
    ty: Set<string>
    line: string[]
    block: [string, string][]
    quotes: string[]
    triple?: boolean
    decor?: boolean
    shell?: boolean
    json?: boolean
    macro?: boolean
    dollar?: boolean
}

const W = (s: string) => new Set(s.split(" ").filter(Boolean))

const JS_KW =
    "const let var function return if else for while do switch case break continue new class extends import from export default async await try catch finally throw typeof instanceof in of this super yield interface type enum implements public private protected readonly as void static get set declare namespace keyof satisfies"
const C_BLOCK: [string, string][] = [["/*", "*/"]]

const SPECS: Record<Lang, Spec> = {
    typescript: {
        kw: W(JS_KW),
        bo: W("true false null undefined NaN"),
        ty: W("string number boolean any unknown never object bigint symbol"),
        line: ["//"],
        block: C_BLOCK,
        quotes: ["'", '"', "`"],
    },
    javascript: {
        kw: W(JS_KW),
        bo: W("true false null undefined NaN"),
        ty: W(""),
        line: ["//"],
        block: C_BLOCK,
        quotes: ["'", '"', "`"],
    },
    python: {
        kw: W(
            "def return if elif else for while in not and or is import from as class try except finally raise with lambda yield pass break continue global nonlocal async await del assert self"
        ),
        bo: W("True False None"),
        ty: W("str int float bool dict list tuple set bytes"),
        line: ["#"],
        block: [],
        quotes: ["'", '"'],
        triple: true,
        decor: true,
    },
    go: {
        kw: W(
            "package import func return if else for range switch case default break continue go defer chan map struct interface type var const select fallthrough goto"
        ),
        bo: W("true false nil iota"),
        ty: W(
            "string int int32 int64 uint uint8 float32 float64 error bool byte rune any"
        ),
        line: ["//"],
        block: C_BLOCK,
        quotes: ['"', "`"],
    },
    rust: {
        kw: W(
            "fn let mut pub use mod struct enum impl trait for in if else match return loop while break continue as ref where async await move const static crate self super dyn unsafe type"
        ),
        bo: W("true false None Some Ok Err"),
        ty: W(
            "u8 u16 u32 u64 i8 i16 i32 i64 f32 f64 usize isize bool char str"
        ),
        line: ["//"],
        block: C_BLOCK,
        quotes: ['"'],
        macro: true,
    },
    ruby: {
        kw: W(
            "def end do if elsif else unless while until for in return class module require require_relative begin rescue ensure yield then case when self attr_accessor attr_reader"
        ),
        bo: W("true false nil"),
        ty: W(""),
        line: ["#"],
        block: [],
        quotes: ["'", '"'],
    },
    php: {
        kw: W(
            "function return if else elseif foreach for while as echo new class public private protected static use namespace require require_once try catch throw fn match"
        ),
        bo: W("true false null"),
        ty: W("array string int float bool void"),
        line: ["//", "#"],
        block: C_BLOCK,
        quotes: ["'", '"'],
        dollar: true,
    },
    java: {
        kw: W(
            "public private protected class interface extends implements static final void return if else for while new try catch finally throw throws import package var this super switch case default break continue"
        ),
        bo: W("true false null"),
        ty: W("int long double float boolean char byte short"),
        line: ["//"],
        block: C_BLOCK,
        quotes: ['"'],
        decor: true,
    },
    shell: {
        kw: W(
            "if then else elif fi for in do done while case esac function return export local set"
        ),
        bo: W("true false"),
        ty: W(""),
        line: ["#"],
        block: [],
        quotes: ["'", '"'],
        shell: true,
        dollar: true,
    },
    json: {
        kw: W(""),
        bo: W("true false null"),
        ty: W(""),
        line: [],
        block: [],
        quotes: ['"'],
        json: true,
    },
}

/* ------------------------------------------------------------------ */
/* Tokenizer (pure)                                                   */
/* ------------------------------------------------------------------ */

const isSpace = (c: string | undefined) => c === " " || c === "\t" || c === "\r"

function tokenize(src: string, lang: Lang | undefined): Tok[][] {
    const spec = SPECS[lang || "typescript"] || SPECS.typescript
    const out: Tok[] = []
    const n = src.length
    let i = 0
    let lineStart = true

    const push = (k: Kind, v: string) => {
        const last = out[out.length - 1]
        if (last && last.k === k && (k === "pl" || k === "co")) last.v += v
        else out.push({ k, v })
    }
    const prevSig = (): Tok | null => {
        for (let j = out.length - 1; j >= 0; j--)
            if (out[j].v.trim()) return out[j]
        return null
    }
    const nextChar = (from: number) => {
        let j = from
        while (j < n && isSpace(src[j])) j++
        return src[j]
    }

    outer: while (i < n) {
        const c = src[i]

        if (c === "\n") {
            push("pl", "\n")
            i++
            lineStart = true
            continue
        }
        if (isSpace(c)) {
            let j = i
            while (j < n && isSpace(src[j])) j++
            push("pl", src.slice(i, j))
            i = j
            continue
        }

        for (const [o, cl] of spec.block) {
            if (src.startsWith(o, i)) {
                const e = src.indexOf(cl, i + o.length)
                const j = e < 0 ? n : e + cl.length
                push("co", src.slice(i, j))
                i = j
                lineStart = false
                continue outer
            }
        }
        for (const lc of spec.line) {
            if (src.startsWith(lc, i)) {
                if (spec.shell && !(lineStart || isSpace(src[i - 1]))) break
                const e = src.indexOf("\n", i)
                const j = e < 0 ? n : e
                push("co", src.slice(i, j))
                i = j
                continue outer
            }
        }

        if (spec.shell) {
            const url = /^https?:\/\/[^\s'"\\]+/.exec(src.slice(i, i + 400))
            if (url) {
                push("st", url[0])
                i += url[0].length
                lineStart = false
                continue
            }
            if (
                c === "-" &&
                (lineStart || isSpace(src[i - 1])) &&
                /[A-Za-z-]/.test(src[i + 1] || "")
            ) {
                const m = /^--?[\w-]+/.exec(src.slice(i, i + 80))
                if (m) {
                    push("at", m[0])
                    i += m[0].length
                    lineStart = false
                    continue
                }
            }
        }

        if (spec.quotes.includes(c)) {
            let j: number
            if (spec.triple && src.startsWith(c + c + c, i)) {
                const e = src.indexOf(c + c + c, i + 3)
                j = e < 0 ? n : e + 3
            } else {
                const multi = c === "`" || !!spec.shell
                j = i + 1
                while (j < n) {
                    const d = src[j]
                    if (d === "\\") {
                        j += 2
                        continue
                    }
                    if (d === c) {
                        j++
                        break
                    }
                    if (d === "\n" && !multi) break
                    j++
                }
            }
            const v = src.slice(i, j)
            push(spec.json && nextChar(j) === ":" ? "pr" : "st", v)
            i = j
            lineStart = false
            continue
        }

        if (spec.dollar && c === "$") {
            const m = /^\$\{?[\w@#?*!]*\}?/.exec(src.slice(i, i + 80))
            if (m && m[0].length > 1) {
                push("va", m[0])
                i += m[0].length
                lineStart = false
                continue
            }
        }

        if (spec.decor && c === "@") {
            const m = /^@[\w.]+/.exec(src.slice(i, i + 80))
            if (m && m[0].length > 1) {
                push("at", m[0])
                i += m[0].length
                lineStart = false
                continue
            }
        }

        if (/[0-9]/.test(c)) {
            const m =
                /^(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(
                    src.slice(i, i + 64)
                )
            if (m) {
                push("nu", m[0])
                i += m[0].length
                lineStart = false
                continue
            }
        }

        if (/[A-Za-z_]/.test(c)) {
            const m = /^[A-Za-z_][\w]*/.exec(src.slice(i, i + 120))!
            const w = m[0]
            const ps = prevSig()
            const after = nextChar(i + w.length)
            let k: Kind = "pl"
            if (spec.shell && lineStart) k = "fn"
            else if (spec.kw.has(w)) k = "kw"
            else if (spec.bo.has(w)) k = "bo"
            else if (ps && ps.v === "." && !spec.shell)
                k = after === "(" ? "fn" : "pr"
            else if (after === "(" || (spec.macro && after === "!")) k = "fn"
            else if (
                !spec.shell &&
                src[i + w.length] === ":" &&
                src[i + w.length + 1] !== ":" &&
                src[i + w.length + 1] !== "="
            )
                k = "pr"
            else if (spec.ty.has(w) || /^[A-Z]/.test(w)) k = "ty"
            push(k, w)
            i += w.length
            lineStart = false
            continue
        }

        if (/[{}()[\];,.]/.test(c)) {
            push("pu", c)
            i++
            lineStart = false
            continue
        }
        const op = /^[=+\-*/%<>!&|^~?:\\]+/.exec(src.slice(i, i + 8))
        if (op) {
            push("op", op[0])
            i += op[0].length
            lineStart = false
            continue
        }
        push("pl", c)
        i++
        lineStart = false
    }

    const lines: Tok[][] = [[]]
    for (const t of out) {
        const parts = t.v.split("\n")
        parts.forEach((part, idx) => {
            if (idx > 0) lines.push([])
            if (part) lines[lines.length - 1].push({ k: t.k, v: part })
        })
    }
    if (lines.length > 1 && lines[lines.length - 1].length === 0) lines.pop()
    return lines
}

function parseRanges(s: string): Set<number> {
    const set = new Set<number>()
    for (const raw of (s || "").split(",")) {
        const part = raw.trim()
        if (!part) continue
        const m = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(part)
        if (!m) continue
        const a = parseInt(m[1], 10)
        const b = m[2] ? parseInt(m[2], 10) : a
        for (let x = Math.min(a, b); x <= Math.max(a, b) && x - a < 500; x++)
            set.add(x)
    }
    return set
}

/* ------------------------------------------------------------------ */
/* Themes (pure)                                                      */
/* ------------------------------------------------------------------ */

interface Theme {
    bg: string
    header: string
    border: string
    text: string
    muted: string
    faint: string
    tabActive: string
    hover: string
    thumb: string
    accent: string
    light?: boolean
    tokens: Record<Kind, string>
}

const THEMES: Record<ThemeName, Theme> = {
    midnight: {
        bg: "#0A0C12",
        header: "#0D1018",
        border: "rgba(255,255,255,0.07)",
        text: "#D7DEEA",
        muted: "#6B7488",
        faint: "#3A4152",
        tabActive: "rgba(255,255,255,0.06)",
        hover: "rgba(255,255,255,0.025)",
        thumb: "rgba(255,255,255,0.12)",
        accent: "#8D7CFF",
        tokens: {
            pl: "#D7DEEA",
            kw: "#B49CFF",
            st: "#8EE3B5",
            nu: "#FFB673",
            co: "#535C70",
            fn: "#79C3FF",
            ty: "#F4D27A",
            pr: "#9ADBE8",
            pu: "#7F889C",
            op: "#C9A7FF",
            va: "#FF8E9E",
            at: "#FFC49E",
            bo: "#FF9F6B",
        },
    },
    graphite: {
        bg: "#111111",
        header: "#151515",
        border: "rgba(255,255,255,0.08)",
        text: "#E6E6E6",
        muted: "#7A7A7A",
        faint: "#3D3D3D",
        tabActive: "rgba(255,255,255,0.07)",
        hover: "rgba(255,255,255,0.03)",
        thumb: "rgba(255,255,255,0.14)",
        accent: "#EDEDED",
        tokens: {
            pl: "#E6E6E6",
            kw: "#FF7AB2",
            st: "#B8E986",
            nu: "#F7A26A",
            co: "#5E5E5E",
            fn: "#7FB2FF",
            ty: "#FFD479",
            pr: "#C9C9C9",
            pu: "#8C8C8C",
            op: "#FF7AB2",
            va: "#F49A9A",
            at: "#F7C59F",
            bo: "#F7A26A",
        },
    },
    abyss: {
        bg: "#06141A",
        header: "#081A21",
        border: "rgba(120,220,230,0.10)",
        text: "#CFE8EC",
        muted: "#5E8089",
        faint: "#2A4A52",
        tabActive: "rgba(120,220,230,0.08)",
        hover: "rgba(120,220,230,0.035)",
        thumb: "rgba(120,220,230,0.16)",
        accent: "#2DD4BF",
        tokens: {
            pl: "#CFE8EC",
            kw: "#5EEAD4",
            st: "#FDE68A",
            nu: "#FCA5A5",
            co: "#4A6B73",
            fn: "#7DD3FC",
            ty: "#C4B5FD",
            pr: "#A5F3FC",
            pu: "#6B8F98",
            op: "#5EEAD4",
            va: "#FDBA74",
            at: "#F9A8D4",
            bo: "#FCA5A5",
        },
    },
    ember: {
        bg: "#140F0D",
        header: "#1A1310",
        border: "rgba(255,190,150,0.09)",
        text: "#F1E4DA",
        muted: "#8A766A",
        faint: "#4A3B33",
        tabActive: "rgba(255,190,150,0.08)",
        hover: "rgba(255,190,150,0.035)",
        thumb: "rgba(255,190,150,0.16)",
        accent: "#FF7A45",
        tokens: {
            pl: "#F1E4DA",
            kw: "#FF8A5B",
            st: "#D8E3A0",
            nu: "#FFC46B",
            co: "#6E5B50",
            fn: "#9CC9FF",
            ty: "#FFD58A",
            pr: "#F3B4A2",
            pu: "#9A857A",
            op: "#FF8A5B",
            va: "#FFA48A",
            at: "#E8C7A0",
            bo: "#FFC46B",
        },
    },
    porcelain: {
        bg: "#FFFFFF",
        header: "#F7F7F9",
        border: "rgba(15,23,42,0.08)",
        text: "#1F2433",
        muted: "#8A91A3",
        faint: "#C3C8D3",
        tabActive: "#FFFFFF",
        light: true,
        hover: "rgba(15,23,42,0.025)",
        thumb: "rgba(15,23,42,0.14)",
        accent: "#6366F1",
        tokens: {
            pl: "#1F2433",
            kw: "#7C3AED",
            st: "#0F8A5F",
            nu: "#C2410C",
            co: "#9AA1B2",
            fn: "#2563EB",
            ty: "#B45309",
            pr: "#BE185D",
            pu: "#6B7280",
            op: "#0E7490",
            va: "#DC2626",
            at: "#A16207",
            bo: "#C2410C",
        },
    },
    linen: {
        bg: "#FBF8F3",
        header: "#F4EFE7",
        border: "rgba(70,45,20,0.10)",
        text: "#2B2420",
        muted: "#8C8177",
        faint: "#CEC4B7",
        tabActive: "#FFFFFF",
        light: true,
        hover: "rgba(70,45,20,0.03)",
        thumb: "rgba(70,45,20,0.16)",
        accent: "#D9622B",
        tokens: {
            pl: "#2B2420",
            kw: "#B4432A",
            st: "#4F7A28",
            nu: "#B7651B",
            co: "#A89C8F",
            fn: "#2F6CA8",
            ty: "#8A5A00",
            pr: "#8E3B6E",
            pu: "#7B7067",
            op: "#B4432A",
            va: "#C0392B",
            at: "#9A6A2F",
            bo: "#B7651B",
        },
    },
}

const WINDOW_DOTS = ["#FF5F57", "#FEBC2E", "#28C840"]

const MONO = "ui-monospace, monospace"
const SANS = "system-ui, sans-serif"

const mix = (c: string, pct: number) =>
    `color-mix(in srgb, ${c} ${pct}%, transparent)`
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

function themeKey(p: Props, mode: Mode): ThemeName {
    return mode === "light"
        ? p.lightTheme || "porcelain"
        : p.theme || "midnight"
}

function resolve(p: Props, mode: Mode) {
    const theme = THEMES[themeKey(p, mode)] || THEMES.midnight
    const accent = p.customAccent && p.accent ? p.accent : theme.accent
    const tabs: TabItem[] = p.tabs && p.tabs.length ? p.tabs : DEFAULT_TABS
    const frame = {
        radius: 18,
        codeSize: 13,
        lineHeight: 1.75,
        padding: 22,
        ...(p.frame || {}),
    }
    const panels = {
        windowDots: true,
        colorDots: true,
        fileBar: true,
        lineNumbers: true,
        statusBar: true,
        copyButton: true,
        themeToggle: true,
        wrap: false,
        italicComments: true,
        ...(p.panels || {}),
    }
    const mo = {
        reveal: true,
        autoCycle: false,
        cycleSeconds: 6,
        caret: true,
        glow: true,
        ...(p.motionOpts || {}),
    }
    const codeFamily = (p.codeFont && p.codeFont.fontFamily) || MONO
    const uiFamily = (p.uiFont && p.uiFont.fontFamily) || SANS
    const light = !!theme.light
    const shadow = mo.glow
        ? `0 40px 90px -40px ${mix(accent, light ? 35 : 55)}, 0 18px 40px -24px rgba(0,0,0,${light ? 0.18 : 0.6})`
        : `0 18px 40px -24px rgba(0,0,0,${light ? 0.14 : 0.5})`
    return {
        theme,
        accent,
        tabs,
        frame,
        panels,
        mo,
        codeFamily,
        uiFamily,
        shadow,
        light,
    }
}

/* Static SVG icons — no styles, no animation, safe for both branches. */
function IconCopy({ size = 14 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <rect
                x="5.25"
                y="5.25"
                width="8.5"
                height="8.5"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.4"
            />
            <path
                d="M10.75 3.5V3.25a1.5 1.5 0 0 0-1.5-1.5h-5.5a1.5 1.5 0 0 0-1.5 1.5v5.5a1.5 1.5 0 0 0 1.5 1.5H4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    )
}
function IconCheck({ size = 14 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M3.5 8.5l2.75 2.75L12.5 5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
function IconSun({ size = 13 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <circle
                cx="8"
                cy="8"
                r="3"
                stroke="currentColor"
                strokeWidth="1.4"
            />
            <path
                d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    )
}
function IconMoon({ size = 13 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M13.6 9.9A5.75 5.75 0 0 1 6.1 2.4a5.75 5.75 0 1 0 7.5 7.5z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
            />
        </svg>
    )
}
function IconFile({ size = 13 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
        >
            <path
                d="M9 1.75H4.5a1.5 1.5 0 0 0-1.5 1.5v9.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5V5.75L9 1.75z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
            />
            <path
                d="M9 1.75v4h4"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/* ------------------------------------------------------------------ */
/* Hooks (live branch only)                                           */
/* ------------------------------------------------------------------ */

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

function useInView(ref: React.RefObject<HTMLElement>) {
    const [inView, setInView] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => setInView(!!entries[0]?.isIntersecting),
            {
                rootMargin: "60px",
            }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [ref])
    return inView
}

function usePageVisible() {
    const [vis, setVis] = useState(() =>
        typeof document === "undefined"
            ? true
            : document.visibilityState !== "hidden"
    )
    useEffect(() => {
        if (typeof document === "undefined") return
        const on = () => setVis(document.visibilityState !== "hidden")
        document.addEventListener("visibilitychange", on)
        return () => document.removeEventListener("visibilitychange", on)
    }, [])
    return vis
}

function usePrefersReducedMotion() {
    const [rm, setRm] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const on = () => setRm(mq.matches)
        on()
        if (mq.addEventListener) mq.addEventListener("change", on)
        else (mq as any).addListener(on)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", on)
            else (mq as any).removeListener(on)
        }
    }, [])
    return rm
}

function writeClipboard(text: string) {
    const fallback = () => {
        try {
            const ta = document.createElement("textarea")
            ta.value = text
            ta.setAttribute("readonly", "")
            ta.style.position = "fixed"
            ta.style.opacity = "0"
            document.body.appendChild(ta)
            ta.select()
            document.execCommand("copy")
            document.body.removeChild(ta)
        } catch (e) {}
    }
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(fallback)
            return
        }
    } catch (e) {}
    fallback()
}

/* ------------------------------------------------------------------ */
/* Live view                                                          */
/* ------------------------------------------------------------------ */

function LiveView(p: Props) {
    const [mode, setMode] = useState<Mode>(
        p.startMode === "light" ? "light" : "dark"
    )
    useEffect(() => {
        setMode(p.startMode === "light" ? "light" : "dark")
    }, [p.startMode])
    const r = resolve(p, mode)
    const { theme, accent, tabs, frame, panels, mo } = r
    const uid = "sc" + useId().replace(/[^a-zA-Z0-9]/g, "")

    const rootRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

    const inView = useInView(rootRef)
    const pageVisible = usePageVisible()
    const reduced = usePrefersReducedMotion()
    const live = inView && pageVisible

    const [active, setActive] = useState(() =>
        clamp((p.defaultTab || 1) - 1, 0, tabs.length - 1)
    )
    const [seen, setSeen] = useState(false)
    const [hovering, setHovering] = useState(false)
    const [hoverLine, setHoverLine] = useState<number | null>(null)
    const [copied, setCopied] = useState(false)
    const [pill, setPill] = useState({ x: 0, w: 0, ready: false })

    useEffect(() => {
        setActive(clamp((p.defaultTab || 1) - 1, 0, tabs.length - 1))
    }, [p.defaultTab, tabs.length])

    useEffect(() => {
        if (inView && !seen) setSeen(true)
    }, [inView, seen])

    const safeActive = clamp(active, 0, tabs.length - 1)
    const tab = tabs[safeActive] || {}
    const lang: Lang = (tab.language as Lang) || "typescript"
    const meta = LANG_META[lang] || LANG_META.typescript
    const lines = useMemo(
        () => tokenize(tab.code || "", lang),
        [tab.code, lang]
    )
    const hl = useMemo(() => parseRanges(tab.highlight || ""), [tab.highlight])

    /* sliding tab pill */
    const measure = useCallback(() => {
        const el = tabRefs.current[safeActive]
        const list = listRef.current
        if (!el || !list) return
        setPill({ x: el.offsetLeft, w: el.offsetWidth, ready: true })
        const left = el.offsetLeft
        const right = left + el.offsetWidth
        if (left < list.scrollLeft)
            list.scrollTo({
                left: left - 8,
                behavior: reduced ? "auto" : "smooth",
            })
        else if (right > list.scrollLeft + list.clientWidth)
            list.scrollTo({
                left: right - list.clientWidth + 8,
                behavior: reduced ? "auto" : "smooth",
            })
    }, [safeActive, reduced])

    useIsoLayoutEffect(() => {
        measure()
    }, [measure, tabs, r.uiFamily])

    useEffect(() => {
        const list = listRef.current
        if (!list || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => measure())
        ro.observe(list)
        return () => ro.disconnect()
    }, [measure])

    /* auto-cycle: locked out unless visible, page visible, motion allowed, not hovered */
    const cycleMs = Math.max(1500, (mo.cycleSeconds || 6) * 1000)
    const cycling = !!mo.autoCycle && tabs.length > 1 && !reduced
    const cycleRunning = cycling && live && !hovering
    const remainRef = useRef(cycleMs)

    useEffect(() => {
        remainRef.current = cycleMs
    }, [safeActive, cycleMs])

    useEffect(() => {
        if (!cycleRunning) return
        const started = performance.now()
        const t = window.setTimeout(
            () => {
                remainRef.current = cycleMs
                setActive((a) => (a + 1) % tabs.length)
            },
            Math.max(0, remainRef.current)
        )
        return () => {
            window.clearTimeout(t)
            remainRef.current = Math.max(
                0,
                remainRef.current - (performance.now() - started)
            )
        }
    }, [cycleRunning, safeActive, cycleMs, tabs.length])

    /* copy */
    const copyTimer = useRef<number | undefined>(undefined)
    useEffect(() => () => window.clearTimeout(copyTimer.current), [])
    const onCopy = () => {
        writeClipboard(tab.code || "")
        setCopied(true)
        window.clearTimeout(copyTimer.current)
        copyTimer.current = window.setTimeout(() => setCopied(false), 1800)
    }

    const onTabsKey = (e: React.KeyboardEvent) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
        e.preventDefault()
        const dir = e.key === "ArrowRight" ? 1 : -1
        const next = (safeActive + dir + tabs.length) % tabs.length
        setActive(next)
        tabRefs.current[next]?.focus()
    }

    const gutter = `calc(${String(lines.length).length}ch + 22px)`
    const padX = frame.padding
    const padY = Math.round(frame.padding * 0.75)
    const reveal = mo.reveal && !reduced
    const playState = live ? "running" : "paused"
    const ease = [0.22, 0.8, 0.24, 1] as const

    const css = `
.${uid}-root,.${uid}-root div,.${uid}-root span,.${uid}-root button{transition-property:background-color,border-color,color,box-shadow;transition-duration:.35s;transition-timing-function:ease}
.${uid}-scroll{scrollbar-width:thin;scrollbar-color:${theme.thumb} transparent}
.${uid}-scroll::-webkit-scrollbar{width:10px;height:10px}
.${uid}-scroll::-webkit-scrollbar-track{background:transparent}
.${uid}-scroll::-webkit-scrollbar-thumb{background:${theme.thumb};border-radius:10px;border:3px solid transparent;background-clip:padding-box}
.${uid}-scroll::-webkit-scrollbar-corner{background:transparent}
.${uid}-tabs{scrollbar-width:none}
.${uid}-tabs::-webkit-scrollbar{display:none}
.${uid}-ln{transition:background-color .18s ease}
.${uid}-ln:hover{background-color:${theme.hover}}
.${uid}-tab{transition:color .2s ease}
.${uid}-tab:hover{color:${theme.text} !important}
.${uid}-btn{transition:background-color .2s ease,color .2s ease,border-color .2s ease}
.${uid}-btn:hover{background-color:${theme.tabActive};border-color:${mix(accent, 35)} !important}
.${uid}-tab:focus-visible,.${uid}-btn:focus-visible{outline:2px solid ${mix(accent, 80)};outline-offset:2px;border-radius:9px}
@keyframes ${uid}-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@keyframes ${uid}-prog{from{transform:scaleX(0)}to{transform:scaleX(1)}}
`

    const codeStyle: React.CSSProperties = {
        ...(p.codeFont || {}),
        fontFamily: r.codeFamily,
        fontSize: frame.codeSize,
        lineHeight: frame.lineHeight,
        fontVariantLigatures: "contextual",
        tabSize: 4 as any,
    }
    const uiStyle: React.CSSProperties = {
        ...(p.uiFont || {}),
        fontFamily: r.uiFamily,
    }

    return (
        <div
            ref={rootRef}
            className={`${uid}-root`}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => {
                setHovering(false)
                setHoverLine(null)
            }}
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                background: theme.bg,
                borderRadius: frame.radius,
                border: `1px solid ${theme.border}`,
                boxShadow: r.shadow,
                overflow: "hidden",
                color: theme.text,
                boxSizing: "border-box",
                isolation: "isolate",
            }}
        >
            <style>{css}</style>

            {/* top edge sheen */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: 0,
                    left: "12%",
                    right: "12%",
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${mix(accent, 70)}, transparent)`,
                    opacity: mo.glow ? 0.9 : 0.35,
                    zIndex: 3,
                    pointerEvents: "none",
                }}
            />

            {/* header */}
            <div
                style={{
                    ...uiStyle,
                    position: "relative",
                    flexShrink: 0,
                    height: 52,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 10px 0 16px",
                    background: `radial-gradient(120% 140% at 0% 0%, ${mix(accent, r.light ? 6 : 9)}, transparent 60%), ${theme.header}`,
                    borderBottom: `1px solid ${theme.border}`,
                }}
            >
                {panels.windowDots && (
                    <div
                        style={{ display: "flex", gap: 7, flexShrink: 0 }}
                        aria-hidden="true"
                    >
                        {[0, 1, 2].map((d) => (
                            <span
                                key={d}
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 999,
                                    background: panels.colorDots
                                        ? WINDOW_DOTS[d]
                                        : theme.faint,
                                    opacity: panels.colorDots
                                        ? 1
                                        : 0.9 - d * 0.18,
                                    boxShadow: panels.colorDots
                                        ? `inset 0 0 0 0.5px rgba(0,0,0,0.18)`
                                        : "none",
                                }}
                            />
                        ))}
                    </div>
                )}

                <div
                    ref={listRef}
                    className={`${uid}-tabs`}
                    role="tablist"
                    aria-label="Code languages"
                    onKeyDown={onTabsKey}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        overflowX: "auto",
                        overflowY: "hidden",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            padding: "3px 0",
                        }}
                    >
                        <motion.div
                            aria-hidden="true"
                            initial={false}
                            animate={{
                                x: pill.x,
                                width: pill.w,
                                opacity: pill.ready ? 1 : 0,
                            }}
                            transition={
                                reduced
                                    ? { duration: 0 }
                                    : {
                                          type: "spring",
                                          stiffness: 430,
                                          damping: 36,
                                          mass: 0.8,
                                      }
                            }
                            style={{
                                position: "absolute",
                                top: 3,
                                bottom: 3,
                                left: 0,
                                borderRadius: 9,
                                background: theme.tabActive,
                                boxShadow: r.light
                                    ? `0 1px 2px rgba(15,23,42,0.08), 0 0 0 1px ${theme.border}`
                                    : `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${theme.border}`,
                                overflow: "hidden",
                                zIndex: 0,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    left: 10,
                                    right: 10,
                                    bottom: 0,
                                    height: 1.5,
                                    borderRadius: 2,
                                    background: mix(accent, cycling ? 25 : 85),
                                }}
                            />
                            {cycling && (
                                <div
                                    key={`${safeActive}-${cycleMs}`}
                                    style={{
                                        position: "absolute",
                                        left: 10,
                                        right: 10,
                                        bottom: 0,
                                        height: 1.5,
                                        borderRadius: 2,
                                        background: accent,
                                        transformOrigin: "0 50%",
                                        transform: "scaleX(0)",
                                        animation: `${uid}-prog ${cycleMs}ms linear forwards`,
                                        animationPlayState: cycleRunning
                                            ? "running"
                                            : "paused",
                                    }}
                                />
                            )}
                        </motion.div>

                        {tabs.map((t, idx) => {
                            const on = idx === safeActive
                            const m =
                                LANG_META[
                                    (t.language as Lang) || "typescript"
                                ] || LANG_META.typescript
                            return (
                                <button
                                    key={idx}
                                    ref={(el) => {
                                        tabRefs.current[idx] = el
                                    }}
                                    className={`${uid}-tab`}
                                    role="tab"
                                    aria-selected={on}
                                    tabIndex={on ? 0 : -1}
                                    onClick={() => setActive(idx)}
                                    style={{
                                        ...uiStyle,
                                        position: "relative",
                                        zIndex: 1,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "7px 13px",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        fontSize: 12.5,
                                        fontWeight: 500,
                                        letterSpacing: "-0.005em",
                                        color: on ? theme.text : theme.muted,
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 7,
                                            height: 7,
                                            borderRadius: 999,
                                            background: m.dot,
                                            opacity: on ? 1 : 0.45,
                                            boxShadow: on
                                                ? `0 0 10px ${mix(m.dot, 70)}`
                                                : "none",
                                            transition:
                                                "opacity .25s ease, box-shadow .25s ease",
                                        }}
                                    />
                                    {t.label || m.name}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {panels.themeToggle && (
                    <button
                        className={`${uid}-btn`}
                        role="switch"
                        aria-checked={mode === "light"}
                        aria-label={
                            mode === "light"
                                ? "Switch to dark theme"
                                : "Switch to light theme"
                        }
                        onClick={() =>
                            setMode((m) => (m === "light" ? "dark" : "light"))
                        }
                        style={{
                            position: "relative",
                            flexShrink: 0,
                            width: 58,
                            height: 32,
                            padding: 0,
                            borderRadius: 999,
                            border: `1px solid ${theme.border}`,
                            background: "transparent",
                            color: theme.muted,
                            cursor: "pointer",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                left: 9,
                                top: 9,
                                display: "flex",
                                opacity: 0.7,
                            }}
                        >
                            <IconMoon />
                        </span>
                        <span
                            style={{
                                position: "absolute",
                                right: 9,
                                top: 9,
                                display: "flex",
                                opacity: 0.7,
                            }}
                        >
                            <IconSun />
                        </span>
                        <motion.span
                            initial={false}
                            animate={{
                                x: mode === "light" ? 26 : 0,
                                rotate: mode === "light" ? 90 : 0,
                            }}
                            transition={
                                reduced
                                    ? { duration: 0 }
                                    : {
                                          type: "spring",
                                          stiffness: 480,
                                          damping: 30,
                                      }
                            }
                            style={{
                                position: "absolute",
                                top: 3,
                                left: 3,
                                width: 24,
                                height: 24,
                                borderRadius: 999,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: r.light
                                    ? "#FFFFFF"
                                    : theme.tabActive,
                                color: accent,
                                boxShadow: r.light
                                    ? `0 1px 3px rgba(0,0,0,0.14), 0 0 0 1px ${theme.border}`
                                    : `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${theme.border}, 0 0 14px ${mix(accent, 30)}`,
                            }}
                        >
                            {mode === "light" ? <IconSun /> : <IconMoon />}
                        </motion.span>
                    </button>
                )}

                {panels.copyButton && (
                    <button
                        className={`${uid}-btn`}
                        onClick={onCopy}
                        aria-label={
                            copied
                                ? p.copiedLabel || "Copied"
                                : p.copyLabel || "Copy"
                        }
                        style={{
                            ...uiStyle,
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            height: 32,
                            padding: "0 12px",
                            borderRadius: 9,
                            border: `1px solid ${theme.border}`,
                            background: "transparent",
                            color: copied ? accent : theme.muted,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer",
                            overflow: "hidden",
                        }}
                    >
                        <span
                            style={{
                                position: "relative",
                                width: 14,
                                height: 14,
                                display: "inline-block",
                            }}
                        >
                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: copied ? 0 : 1,
                                    scale: copied ? 0.5 : 1,
                                    rotate: copied ? -30 : 0,
                                }}
                                transition={{
                                    duration: reduced ? 0 : 0.22,
                                    ease,
                                }}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                }}
                            >
                                <IconCopy />
                            </motion.span>
                            <motion.span
                                initial={false}
                                animate={{
                                    opacity: copied ? 1 : 0,
                                    scale: copied ? 1 : 0.5,
                                }}
                                transition={
                                    reduced
                                        ? { duration: 0 }
                                        : {
                                              type: "spring",
                                              stiffness: 520,
                                              damping: 22,
                                          }
                                }
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                }}
                            >
                                <IconCheck />
                            </motion.span>
                        </span>
                        <span
                            style={{
                                position: "relative",
                                display: "inline-grid",
                            }}
                        >
                            <motion.span
                                initial={false}
                                animate={{
                                    y: copied ? -14 : 0,
                                    opacity: copied ? 0 : 1,
                                }}
                                transition={{
                                    duration: reduced ? 0 : 0.24,
                                    ease,
                                }}
                                style={{ gridArea: "1 / 1" }}
                            >
                                {p.copyLabel || "Copy"}
                            </motion.span>
                            <motion.span
                                initial={false}
                                animate={{
                                    y: copied ? 0 : 14,
                                    opacity: copied ? 1 : 0,
                                }}
                                transition={{
                                    duration: reduced ? 0 : 0.24,
                                    ease,
                                }}
                                style={{ gridArea: "1 / 1" }}
                            >
                                {p.copiedLabel || "Copied"}
                            </motion.span>
                        </span>
                    </button>
                )}
            </div>

            {/* file bar */}
            {panels.fileBar && (
                <div
                    style={{
                        ...uiStyle,
                        flexShrink: 0,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: `0 ${padX}px`,
                        fontSize: 12,
                        color: theme.muted,
                        borderBottom: `1px solid ${theme.border}`,
                    }}
                >
                    <span style={{ display: "flex", color: theme.muted }}>
                        <IconFile />
                    </span>
                    <motion.span
                        key={`f-${safeActive}`}
                        initial={reveal ? { opacity: 0, y: 4 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease }}
                        style={{
                            color: theme.text,
                            opacity: 0.9,
                            fontFamily: r.codeFamily,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            minWidth: 0,
                        }}
                    >
                        {tab.fileName || "untitled"}
                    </motion.span>
                    <span style={{ flex: 1 }} />
                    <span
                        style={{
                            flexShrink: 0,
                            fontSize: 10.5,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            padding: "3px 8px",
                            borderRadius: 6,
                            color: meta.dot,
                            background: mix(meta.dot, 10),
                            border: `1px solid ${mix(meta.dot, 22)}`,
                        }}
                    >
                        {meta.name}
                    </span>
                </div>
            )}

            {/* code */}
            <div
                style={{
                    position: "relative",
                    flex: "1 1 0px",
                    minHeight: 0,
                    minWidth: 0,
                }}
            >
                <div
                    className={`${uid}-scroll`}
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "auto",
                        overscrollBehavior: "contain",
                    }}
                    onMouseLeave={() => setHoverLine(null)}
                >
                    <motion.div
                        key={`c-${safeActive}`}
                        initial={false}
                        style={{
                            ...codeStyle,
                            padding: `${padY}px 0`,
                            minWidth: "100%",
                            width: panels.wrap ? "100%" : "max-content",
                            boxSizing: "border-box",
                        }}
                    >
                        {lines.map((line, i) => {
                            const n = i + 1
                            const isHl = hl.has(n)
                            const isLast = i === lines.length - 1
                            return (
                                <motion.div
                                    key={i}
                                    className={`${uid}-ln`}
                                    initial={
                                        reveal ? { opacity: 0, x: -8 } : false
                                    }
                                    animate={
                                        seen || !reveal
                                            ? { opacity: 1, x: 0 }
                                            : { opacity: 0, x: -8 }
                                    }
                                    transition={{
                                        duration: 0.4,
                                        delay: reveal
                                            ? Math.min(i * 0.022, 0.6)
                                            : 0,
                                        ease,
                                    }}
                                    onMouseEnter={() => setHoverLine(n)}
                                    style={{
                                        display: "flex",
                                        padding: `0 ${padX}px 0 ${panels.lineNumbers ? Math.max(8, padX - 10) : padX}px`,
                                        background: isHl
                                            ? mix(accent, r.light ? 8 : 11)
                                            : undefined,
                                        boxShadow: isHl
                                            ? `inset 2px 0 0 ${accent}`
                                            : undefined,
                                    }}
                                >
                                    {panels.lineNumbers && (
                                        <span
                                            aria-hidden="true"
                                            style={{
                                                width: gutter,
                                                flexShrink: 0,
                                                textAlign: "right",
                                                paddingRight: 20,
                                                boxSizing: "border-box",
                                                userSelect: "none",
                                                color: isHl
                                                    ? accent
                                                    : hoverLine === n
                                                      ? theme.muted
                                                      : theme.faint,
                                                transition: "color .18s ease",
                                            }}
                                        >
                                            {n}
                                        </span>
                                    )}
                                    <span
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            whiteSpace: panels.wrap
                                                ? "pre-wrap"
                                                : "pre",
                                            wordBreak: panels.wrap
                                                ? "break-word"
                                                : undefined,
                                        }}
                                    >
                                        {line.map((t, j) => (
                                            <span
                                                key={j}
                                                style={{
                                                    color: theme.tokens[t.k],
                                                    fontStyle:
                                                        t.k === "co" &&
                                                        panels.italicComments
                                                            ? "italic"
                                                            : undefined,
                                                }}
                                            >
                                                {t.v}
                                            </span>
                                        ))}
                                        {line.length === 0 &&
                                        !(isLast && mo.caret)
                                            ? "\u200b"
                                            : null}
                                        {isLast && mo.caret && (
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    display: "inline-block",
                                                    width: "0.55em",
                                                    height: "1.2em",
                                                    marginLeft: 3,
                                                    verticalAlign:
                                                        "text-bottom",
                                                    borderRadius: 1.5,
                                                    background: accent,
                                                    opacity: 0.85,
                                                    animation: reduced
                                                        ? "none"
                                                        : `${uid}-blink 1.1s steps(1) infinite`,
                                                    animationPlayState:
                                                        playState,
                                                }}
                                            />
                                        )}
                                    </span>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                </div>
            </div>

            {/* status bar */}
            {panels.statusBar && (
                <div
                    style={{
                        ...uiStyle,
                        flexShrink: 0,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: `0 ${padX}px`,
                        fontSize: 11.5,
                        color: theme.muted,
                        borderTop: `1px solid ${theme.border}`,
                        background: theme.header,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                        }}
                    >
                        <span
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 999,
                                background: meta.dot,
                            }}
                        />
                        {meta.name}
                    </span>
                    {hl.size > 0 && (
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 2,
                                    borderRadius: 2,
                                    background: accent,
                                }}
                            />
                            {hl.size} highlighted
                        </span>
                    )}
                    <span style={{ flex: 1 }} />
                    <span
                        style={{
                            minWidth: 64,
                            textAlign: "right",
                            color: hoverLine ? theme.text : theme.muted,
                            transition: "color .2s ease",
                        }}
                    >
                        {hoverLine
                            ? `Ln ${hoverLine}`
                            : `${lines.length} lines`}
                    </span>
                    <span>UTF-8</span>
                </div>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Static view — plain divs only                                      */
/* ------------------------------------------------------------------ */

function StaticView(p: Props) {
    const staticMode: Mode = p.startMode === "light" ? "light" : "dark"
    const r = resolve(p, staticMode)
    const { theme, accent, tabs, frame, panels, mo } = r
    const active = clamp((p.defaultTab || 1) - 1, 0, tabs.length - 1)
    const tab = tabs[active] || {}
    const lang: Lang = (tab.language as Lang) || "typescript"
    const meta = LANG_META[lang] || LANG_META.typescript
    const lines = tokenize(tab.code || "", lang)
    const hl = parseRanges(tab.highlight || "")
    const gutter = `calc(${String(lines.length).length}ch + 22px)`
    const padX = frame.padding
    const padY = Math.round(frame.padding * 0.75)
    const uiStyle: React.CSSProperties = {
        ...(p.uiFont || {}),
        fontFamily: r.uiFamily,
    }

    return (
        <div
            style={{
                ...p.style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                background: theme.bg,
                borderRadius: frame.radius,
                border: `1px solid ${theme.border}`,
                boxShadow: r.shadow,
                overflow: "hidden",
                color: theme.text,
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: "12%",
                    right: "12%",
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${mix(accent, 70)}, transparent)`,
                    opacity: mo.glow ? 0.9 : 0.35,
                    zIndex: 3,
                }}
            />

            <div
                style={{
                    ...uiStyle,
                    flexShrink: 0,
                    height: 52,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0 10px 0 16px",
                    background: `radial-gradient(120% 140% at 0% 0%, ${mix(accent, r.light ? 6 : 9)}, transparent 60%), ${theme.header}`,
                    borderBottom: `1px solid ${theme.border}`,
                }}
            >
                {panels.windowDots && (
                    <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                        {[0, 1, 2].map((d) => (
                            <div
                                key={d}
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 999,
                                    background: panels.colorDots
                                        ? WINDOW_DOTS[d]
                                        : theme.faint,
                                    opacity: panels.colorDots
                                        ? 1
                                        : 0.9 - d * 0.18,
                                    boxShadow: panels.colorDots
                                        ? `inset 0 0 0 0.5px rgba(0,0,0,0.18)`
                                        : "none",
                                }}
                            />
                        ))}
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            padding: "3px 0",
                        }}
                    >
                        {tabs.map((t, idx) => {
                            const on = idx === active
                            const m =
                                LANG_META[
                                    (t.language as Lang) || "typescript"
                                ] || LANG_META.typescript
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        ...uiStyle,
                                        position: "relative",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "7px 13px",
                                        borderRadius: 9,
                                        whiteSpace: "nowrap",
                                        fontSize: 12.5,
                                        fontWeight: 500,
                                        color: on ? theme.text : theme.muted,
                                        background: on
                                            ? theme.tabActive
                                            : "transparent",
                                        boxShadow: on
                                            ? r.light
                                                ? `0 1px 2px rgba(15,23,42,0.08), 0 0 0 1px ${theme.border}`
                                                : `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px ${theme.border}`
                                            : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 7,
                                            height: 7,
                                            borderRadius: 999,
                                            background: m.dot,
                                            opacity: on ? 1 : 0.45,
                                        }}
                                    />
                                    {t.label || m.name}
                                    {on && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 10,
                                                right: 10,
                                                bottom: 0,
                                                height: 1.5,
                                                borderRadius: 2,
                                                background: mix(accent, 85),
                                            }}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
                {panels.themeToggle && (
                    <div
                        style={{
                            position: "relative",
                            flexShrink: 0,
                            width: 58,
                            height: 32,
                            borderRadius: 999,
                            border: `1px solid ${theme.border}`,
                            color: theme.muted,
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 9,
                                top: 9,
                                display: "flex",
                                opacity: 0.7,
                            }}
                        >
                            <IconMoon />
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                right: 9,
                                top: 9,
                                display: "flex",
                                opacity: 0.7,
                            }}
                        >
                            <IconSun />
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                top: 3,
                                left: staticMode === "light" ? 29 : 3,
                                width: 24,
                                height: 24,
                                borderRadius: 999,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: r.light
                                    ? "#FFFFFF"
                                    : theme.tabActive,
                                color: accent,
                                boxShadow: r.light
                                    ? `0 1px 3px rgba(0,0,0,0.14), 0 0 0 1px ${theme.border}`
                                    : `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${theme.border}`,
                            }}
                        >
                            {staticMode === "light" ? (
                                <IconSun />
                            ) : (
                                <IconMoon />
                            )}
                        </div>
                    </div>
                )}

                {panels.copyButton && (
                    <div
                        style={{
                            ...uiStyle,
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            height: 32,
                            padding: "0 12px",
                            borderRadius: 9,
                            border: `1px solid ${theme.border}`,
                            color: theme.muted,
                            fontSize: 12,
                            fontWeight: 500,
                        }}
                    >
                        <div style={{ display: "flex" }}>
                            <IconCopy />
                        </div>
                        {p.copyLabel || "Copy"}
                    </div>
                )}
            </div>

            {panels.fileBar && (
                <div
                    style={{
                        ...uiStyle,
                        flexShrink: 0,
                        height: 36,
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: `0 ${padX}px`,
                        fontSize: 12,
                        color: theme.muted,
                        borderBottom: `1px solid ${theme.border}`,
                    }}
                >
                    <div style={{ display: "flex" }}>
                        <IconFile />
                    </div>
                    <div
                        style={{
                            color: theme.text,
                            opacity: 0.9,
                            fontFamily: r.codeFamily,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            minWidth: 0,
                        }}
                    >
                        {tab.fileName || "untitled"}
                    </div>
                    <div style={{ flex: 1 }} />
                    <div
                        style={{
                            flexShrink: 0,
                            fontSize: 10.5,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            padding: "3px 8px",
                            borderRadius: 6,
                            color: meta.dot,
                            background: mix(meta.dot, 10),
                            border: `1px solid ${mix(meta.dot, 22)}`,
                        }}
                    >
                        {meta.name}
                    </div>
                </div>
            )}

            <div
                style={{
                    position: "relative",
                    flex: "1 1 0px",
                    minHeight: 0,
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            ...(p.codeFont || {}),
                            fontFamily: r.codeFamily,
                            fontSize: frame.codeSize,
                            lineHeight: frame.lineHeight,
                            tabSize: 4 as any,
                            padding: `${padY}px 0`,
                            minWidth: "100%",
                            width: panels.wrap ? "100%" : "max-content",
                            boxSizing: "border-box",
                        }}
                    >
                        {lines.map((line, i) => {
                            const n = i + 1
                            const isHl = hl.has(n)
                            return (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        padding: `0 ${padX}px 0 ${panels.lineNumbers ? Math.max(8, padX - 10) : padX}px`,
                                        background: isHl
                                            ? mix(accent, r.light ? 8 : 11)
                                            : undefined,
                                        boxShadow: isHl
                                            ? `inset 2px 0 0 ${accent}`
                                            : undefined,
                                    }}
                                >
                                    {panels.lineNumbers && (
                                        <div
                                            style={{
                                                width: gutter,
                                                flexShrink: 0,
                                                textAlign: "right",
                                                paddingRight: 20,
                                                boxSizing: "border-box",
                                                color: isHl
                                                    ? accent
                                                    : theme.faint,
                                            }}
                                        >
                                            {n}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            whiteSpace: panels.wrap
                                                ? "pre-wrap"
                                                : "pre",
                                            wordBreak: panels.wrap
                                                ? "break-word"
                                                : undefined,
                                        }}
                                    >
                                        {line.map((t, j) => (
                                            <span
                                                key={j}
                                                style={{
                                                    color: theme.tokens[t.k],
                                                    fontStyle:
                                                        t.k === "co" &&
                                                        panels.italicComments
                                                            ? "italic"
                                                            : undefined,
                                                }}
                                            >
                                                {t.v}
                                            </span>
                                        ))}
                                        {line.length === 0 ? "\u200b" : null}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {panels.statusBar && (
                <div
                    style={{
                        ...uiStyle,
                        flexShrink: 0,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: `0 ${padX}px`,
                        fontSize: 11.5,
                        color: theme.muted,
                        borderTop: `1px solid ${theme.border}`,
                        background: theme.header,
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                        }}
                    >
                        <div
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 999,
                                background: meta.dot,
                            }}
                        />
                        {meta.name}
                    </div>
                    {hl.size > 0 && (
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <div
                                style={{
                                    width: 8,
                                    height: 2,
                                    borderRadius: 2,
                                    background: accent,
                                }}
                            />
                            {hl.size} highlighted
                        </div>
                    )}
                    <div style={{ flex: 1 }} />
                    <div>{`${lines.length} lines`}</div>
                    <div>UTF-8</div>
                </div>
            )}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_TABS: TabItem[] = [
    {
        label: "TypeScript",
        language: "typescript",
        fileName: "src/onboard.ts",
        highlight: "11-15",
        code: `import { createClient } from "@example/sdk"

const client = createClient({
  apiKey: process.env.API_KEY,
  region: "eu-west",
})

// Create a customer and start a trial
export async function onboard(email: string) {
  const customer = await client.customers.create({ email })
  const plan = await client.subscriptions.create({
    customer: customer.id,
    price: "price_pro_monthly",
    trialDays: 14,
  })

  return { customer, plan }
}

onboard("hello@example.com").then(console.log)`,
    },
    {
        label: "Python",
        language: "python",
        fileName: "onboard.py",
        highlight: "10-14",
        code: `import os
from example_sdk import Client

client = Client(api_key=os.environ["API_KEY"], region="eu-west")


def onboard(email: str) -> dict:
    """Create a customer and start a trial."""
    customer = client.customers.create(email=email)
    plan = client.subscriptions.create(
        customer=customer.id,
        price="price_pro_monthly",
        trial_days=14,
    )
    return {"customer": customer, "plan": plan}


if __name__ == "__main__":
    print(onboard("hello@example.com"))`,
    },
    {
        label: "Shell",
        language: "shell",
        fileName: "create-customer.sh",
        highlight: "",
        code: `# Create a customer and start a trial
curl -X POST https://api.example.com/v1/customers \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "hello@example.com",
    "plan": "price_pro_monthly",
    "trial_days": 14
  }'`,
    },
    {
        label: "Go",
        language: "go",
        fileName: "main.go",
        highlight: "14-17",
        code: `package main

import (
    "context"
    "fmt"
    "os"

    "example.com/sdk"
)

func main() {
    client := sdk.NewClient(os.Getenv("API_KEY"))

    customer, err := client.Customers.Create(context.Background(), &sdk.CustomerParams{
        Email:     "hello@example.com",
        TrialDays: 14,
    })
    if err != nil {
        panic(err)
    }

    fmt.Println("created", customer.ID)
}`,
    },
    {
        label: "Response",
        language: "json",
        fileName: "200 OK · application/json",
        highlight: "3-4",
        code: `{
  "id": "cus_8f2k1q",
  "email": "hello@example.com",
  "status": "trialing",
  "trial_ends_at": "2026-11-03T00:00:00Z",
  "plan": {
    "id": "price_pro_monthly",
    "amount": 4900,
    "currency": "usd",
    "interval": "month"
  },
  "livemode": false
}`,
    },
]

/* ------------------------------------------------------------------ */
/* Entry                                                              */
/* ------------------------------------------------------------------ */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function Scriptorium(props: Props) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StaticView {...props} />
    return <LiveView {...props} />
}

addPropertyControls(Scriptorium, {
    tabs: {
        type: ControlType.Array,
        title: "Tabs",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "TypeScript",
                },
                language: {
                    type: ControlType.Enum,
                    title: "Language",
                    options: LANG_KEYS,
                    optionTitles: LANG_KEYS.map((k) => LANG_META[k].name),
                    defaultValue: "typescript",
                },
                fileName: {
                    type: ControlType.String,
                    title: "File",
                    defaultValue: "index.ts",
                },
                code: {
                    type: ControlType.String,
                    title: "Code",
                    displayTextArea: true,
                    defaultValue: `const greeting = "Hello"\nconsole.log(greeting)`,
                },
                highlight: {
                    type: ControlType.String,
                    title: "Highlight",
                    placeholder: "e.g. 3-5, 9",
                    defaultValue: "",
                },
            },
        },
        defaultValue: DEFAULT_TABS,
    },
    defaultTab: {
        type: ControlType.Number,
        title: "Start Tab",
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
        defaultValue: 1,
    },
    startMode: {
        type: ControlType.Enum,
        title: "Start Mode",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        displaySegmentedControl: true,
        defaultValue: "dark",
    },
    theme: {
        type: ControlType.Enum,
        title: "Dark Theme",
        options: ["midnight", "graphite", "abyss", "ember"],
        optionTitles: ["Midnight", "Graphite", "Abyss", "Ember"],
        defaultValue: "midnight",
    },
    lightTheme: {
        type: ControlType.Enum,
        title: "Light Theme",
        options: ["porcelain", "linen"],
        optionTitles: ["Porcelain", "Linen"],
        defaultValue: "porcelain",
    },
    customAccent: {
        type: ControlType.Boolean,
        title: "Own Accent",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: false,
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#8D7CFF",
        hidden: (p: Props) => !p.customAccent,
    },
    frame: {
        type: ControlType.Object,
        title: "Frame",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 18,
            },
            codeSize: {
                type: ControlType.Number,
                title: "Code Size",
                min: 10,
                max: 20,
                step: 0.5,
                defaultValue: 13,
            },
            lineHeight: {
                type: ControlType.Number,
                title: "Line Height",
                min: 1.2,
                max: 2.4,
                step: 0.05,
                defaultValue: 1.75,
            },
            padding: {
                type: ControlType.Number,
                title: "Padding",
                min: 8,
                max: 48,
                step: 1,
                defaultValue: 22,
            },
        },
    },
    panels: {
        type: ControlType.Object,
        title: "Panels",
        controls: {
            windowDots: {
                type: ControlType.Boolean,
                title: "Window Dots",
                defaultValue: true,
            },
            colorDots: {
                type: ControlType.Boolean,
                title: "Dot Style",
                enabledTitle: "Color",
                disabledTitle: "Mono",
                defaultValue: true,
                hidden: (o: PanelOpts) => !o.windowDots,
            },
            fileBar: {
                type: ControlType.Boolean,
                title: "File Bar",
                defaultValue: true,
            },
            lineNumbers: {
                type: ControlType.Boolean,
                title: "Line Numbers",
                defaultValue: true,
            },
            statusBar: {
                type: ControlType.Boolean,
                title: "Status Bar",
                defaultValue: true,
            },
            copyButton: {
                type: ControlType.Boolean,
                title: "Copy Button",
                defaultValue: true,
            },
            themeToggle: {
                type: ControlType.Boolean,
                title: "Theme Toggle",
                defaultValue: true,
            },
            wrap: {
                type: ControlType.Boolean,
                title: "Wrap Lines",
                defaultValue: false,
            },
            italicComments: {
                type: ControlType.Boolean,
                title: "Italic Notes",
                defaultValue: true,
            },
        },
    },
    motionOpts: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            reveal: {
                type: ControlType.Boolean,
                title: "Line Reveal",
                defaultValue: true,
            },
            autoCycle: {
                type: ControlType.Boolean,
                title: "Auto Cycle",
                defaultValue: false,
            },
            cycleSeconds: {
                type: ControlType.Number,
                title: "Every",
                min: 2,
                max: 20,
                step: 0.5,
                unit: "s",
                defaultValue: 6,
                hidden: (o: MotionOpts) => !o.autoCycle,
            },
            caret: {
                type: ControlType.Boolean,
                title: "Caret",
                defaultValue: true,
            },
            glow: {
                type: ControlType.Boolean,
                title: "Glow",
                defaultValue: true,
            },
        },
    },
    copyLabel: {
        type: ControlType.String,
        title: "Copy Text",
        defaultValue: "Copy",
    },
    copiedLabel: {
        type: ControlType.String,
        title: "Copied Text",
        defaultValue: "Copied",
    },
    codeFont: {
        type: ControlType.Font,
        title: "Code Font",
        controls: "basic",
        defaultFontType: "monospace",
    },
    uiFont: {
        type: ControlType.Font,
        title: "UI Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
})
