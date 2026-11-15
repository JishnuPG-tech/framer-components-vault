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
    animate,
    useMotionValue,
    useTransform,
    useInView,
    useReducedMotion,
    AnimatePresence,
    Variants,
} from "framer-motion"

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

interface Repo {
    name: string
    full_name: string
    description: string | null
    html_url: string
    clone_url: string
    stargazers_count: number
    forks_count: number
    watchers_count: number
    subscribers_count?: number
    open_issues_count: number
    language: string | null
    license: { name: string; spdx_id: string } | null
    owner: { login: string; html_url: string }
    pushed_at: string
    default_branch: string
    archived: boolean
    fork: boolean
}
interface Lang {
    name: string
    pct: number
}

type Preset = "paper" | "ink" | "github" | "custom"
type Variant = "card" | "strip"
type Reveal = "load" | "scroll" | "off"
type LangTint = "github" | "accent"

interface AppearanceProps {
    preset: Preset
    background: string
    text: string
    accent: string
    radius: string
    showBorder: boolean
    shadow?: string
    langTint: LangTint
}
interface LayoutProps {
    variant: Variant
    padding: string
    gap: number
    heatRows: number
}
interface ContentProps {
    showDescription: boolean
    showStars: boolean
    showForks: boolean
    showWatchers: boolean
    showIssues: boolean
    showHeatmap: boolean
    showTrend: boolean
    showLanguages: boolean
    showMeta: boolean
    showClone: boolean
    showLink: boolean
}
interface AnimationProps {
    reveal: Reveal
    countUp: boolean
    heatFill: boolean
    pulse: boolean
    transition: any
}
interface AdvancedProps {
    token: string
    cacheMinutes: number
    liveOnCanvas: boolean
}

interface Props {
    repo?: string
    appearance?: Partial<AppearanceProps>
    layout?: Partial<LayoutProps>
    content?: Partial<ContentProps>
    animation?: Partial<AnimationProps>
    advanced?: Partial<AdvancedProps>
    font?: any
    style?: React.CSSProperties
}

/* ═══════════════════════════════════════════════════════════════════════
   Defaults
   ═══════════════════════════════════════════════════════════════════════ */

const MONO =
    'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const DEFAULTS = {
    repo: "https://github.com/facebook/react",
    appearance: {
        preset: "paper" as Preset,
        background: "#faf9f5",
        text: "#1d1c1a",
        accent: "#d97757",
        radius: "16px",
        showBorder: true,
        shadow: undefined as string | undefined,
        langTint: "github" as LangTint,
    },
    layout: {
        variant: "card" as Variant,
        padding: "20px",
        gap: 18,
        heatRows: 4,
    },
    content: {
        showDescription: true,
        showStars: true,
        showForks: true,
        showWatchers: true,
        showIssues: true,
        showHeatmap: true,
        showTrend: true,
        showLanguages: true,
        showMeta: true,
        showClone: true,
        showLink: true,
    },
    animation: {
        reveal: "load" as Reveal,
        countUp: true,
        heatFill: true,
        pulse: true,
        transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 },
    },
    advanced: { token: "", cacheMinutes: 10, liveOnCanvas: false },
    font: { fontSize: 13, lineHeight: "1.5em" },
}

const PRESETS: Record<
    Exclude<Preset, "custom">,
    { bg: string; text: string; accent: string }
> = {
    paper: { bg: "#faf9f5", text: "#1d1c1a", accent: "#d97757" },
    ink: { bg: "#1b1a18", text: "#f1ede6", accent: "#e0805f" },
    github: { bg: "#0d1117", text: "#e6edf3", accent: "#39d353" },
}

/* ═══════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════ */

const parseToken = (v: unknown): string | undefined => {
    if (v && typeof v === "object" && "value" in (v as any))
        return (v as { value: string }).value
    return typeof v === "string" && v.trim() ? v : undefined
}

const toPx = (v: unknown, fallback: number): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v
    if (typeof v === "string") {
        const n = parseFloat(v)
        if (Number.isFinite(n)) return /r?em$/.test(v.trim()) ? n * 16 : n
    }
    return fallback
}

/** Drop undefined keys so a spread never overwrites a fallback with undefined. */
const clean = <T extends object>(o: T): Partial<T> => {
    const out: any = {}
    for (const k in o) if ((o as any)[k] !== undefined) out[k] = (o as any)[k]
    return out
}

function toRGB(color: string): [number, number, number] | null {
    const c = (color || "").trim()
    const hex = c.match(/^#([0-9a-f]{3,8})$/i)
    if (hex) {
        let h = hex[1]
        if (h.length <= 4)
            h = h
                .split("")
                .map((x) => x + x)
                .join("")
        return [
            parseInt(h.slice(0, 2), 16),
            parseInt(h.slice(2, 4), 16),
            parseInt(h.slice(4, 6), 16),
        ]
    }
    const rgb = c.match(/^rgba?\(([^)]+)\)$/i)
    if (rgb) {
        const [r, g, b] = rgb[1]
            .split(/[\s,\/]+/)
            .filter(Boolean)
            .map(Number)
        if ([r, g, b].every(Number.isFinite)) return [r, g, b]
    }
    return null
}

function withAlpha(color: string, alpha: number): string {
    const rgb = toRGB(color)
    if (rgb) return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
    return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`
}

function isDarkColor(color: string): boolean {
    const rgb = toRGB(color)
    if (!rgb) return false
    const [r, g, b] = rgb.map((v) => v / 255)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5
}

const compactFmt = (() => {
    try {
        return new Intl.NumberFormat("en", {
            notation: "compact",
            maximumFractionDigits: 1,
        })
    } catch {
        return null
    }
})()
const formatCompact = (n: number): string => {
    if (!Number.isFinite(n)) return "–"
    if (compactFmt) return compactFmt.format(n).toLowerCase()
    if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}m`
    if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}k`
    return String(n)
}
const formatFull = (n: number) => n.toLocaleString("en-US")

const shortAgo = (iso: string): string => {
    const t = new Date(iso).getTime()
    if (!Number.isFinite(t)) return "–"
    const s = Math.max(0, (Date.now() - t) / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    const mo = Math.floor(d / 30)
    const y = Math.floor(d / 365)
    if (s < 60) return "just now"
    if (m < 60) return `${m}m ago`
    if (h < 24) return `${h}h ago`
    if (d < 30) return `${d}d ago`
    if (mo < 12) return `${mo}mo ago`
    return `${y}y ago`
}

const weekLabel = (ms: number) =>
    new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" })

/** Accepts full URLs, `owner/repo`, ssh, trailing slashes, query strings, .git */
function extractRepoPath(input: string): string | null {
    if (!input) return null
    let s = input.trim().replace(/^git@github\.com:/i, "github.com/")
    s = s.split(/[?#]/)[0]
    const m =
        s.match(/github\.com\/([^\/\s]+)\/([^\/\s]+)/i) ||
        s.match(/^\/?([^\/\s]+)\/([^\/\s]+)\/?$/)
    if (!m) return null
    const repo = m[2].replace(/\.git$/i, "")
    return m[1] && repo ? `${m[1]}/${repo}` : null
}

/** 0 = quiet, 1 = this month, 2 = this week, 3 = active (24h) */
function freshness(iso: string): 0 | 1 | 2 | 3 {
    const t = new Date(iso).getTime()
    if (!Number.isFinite(t)) return 0
    const h = (Date.now() - t) / 36e5
    if (h < 24) return 3
    if (h < 24 * 7) return 2
    if (h < 24 * 30) return 1
    return 0
}

function heatLevel(v: number, max: number): 0 | 1 | 2 | 3 | 4 {
    if (v <= 0) return 0
    const r = Math.sqrt(v / max)
    return r > 0.8 ? 4 : r > 0.55 ? 3 : r > 0.3 ? 2 : 1
}

function trend(
    weeks: number[]
): { dir: "up" | "down" | "flat"; pct: number | null } | null {
    if (weeks.length < 8) return null
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
    const last = sum(weeks.slice(-4))
    const prev = sum(weeks.slice(-8, -4))
    if (!last && !prev) return null
    if (!prev) return { dir: "up", pct: null }
    const pct = ((last - prev) / prev) * 100
    return { dir: pct > 2 ? "up" : pct < -2 ? "down" : "flat", pct }
}

const LANG_COLORS: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    Vue: "#41b883",
    Svelte: "#ff3e00",
    HTML: "#e34c26",
    CSS: "#563d7c",
    SCSS: "#c6538c",
    Shell: "#89e051",
    Elixir: "#6e4a7e",
    Haskell: "#5e5086",
    Lua: "#000080",
    Zig: "#ec915c",
    "Objective-C": "#438eff",
    "Jupyter Notebook": "#DA5B0B",
    MDX: "#fcb32c",
    Dockerfile: "#384d54",
    Solidity: "#AA6746",
    Scala: "#c22d40",
    Nix: "#7e7eff",
}
const langColor = (name: string): string => {
    if (LANG_COLORS[name]) return LANG_COLORS[name]
    let h = 0
    for (let i = 0; i < name.length; i++)
        h = (h * 31 + name.charCodeAt(i)) >>> 0
    return `hsl(${h % 360} 55% 55%)`
}

/* ═══════════════════════════════════════════════════════════════════════
   Data layer
   ═══════════════════════════════════════════════════════════════════════ */

const API = "https://api.github.com"
const STORE = "gh-pulse-v1:"

class ApiError extends Error {
    status: number
    resetAt?: number
    constructor(message: string, status: number, resetAt?: number) {
        super(message)
        this.name = "ApiError"
        this.status = status
        this.resetAt = resetAt
    }
}

interface Entry {
    ts: number
    repo: Repo
    languages?: Lang[] | null // undefined = never fetched, null = unavailable
    activity?: number[] | null
}

const mem = new Map<string, Entry>()
const inflight = new Map<string, Promise<any>>()

function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    let p = inflight.get(key) as Promise<T> | undefined
    if (!p) {
        p = fn().finally(() => inflight.delete(key))
        inflight.set(key, p)
    }
    return p
}

function readCache(key: string, ttl: number): Entry | null {
    const now = Date.now()
    const m = mem.get(key)
    if (m && now - m.ts < ttl) return m
    try {
        if (typeof sessionStorage === "undefined") return null
        const raw = sessionStorage.getItem(STORE + key)
        if (!raw) return null
        const e = JSON.parse(raw) as Entry
        if (e?.repo && now - e.ts < ttl) {
            mem.set(key, e)
            return e
        }
    } catch {}
    return null
}
function writeCache(key: string, e: Entry) {
    mem.set(key, e)
    try {
        sessionStorage.setItem(STORE + key, JSON.stringify(e))
    } catch {}
}
function clearCache(key: string) {
    mem.delete(key)
    try {
        sessionStorage.removeItem(STORE + key)
    } catch {}
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function ghFetch(url: string, token?: string) {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
    }
    if (token) headers.Authorization = `Bearer ${token}`
    return fetch(url, { headers })
}

function toApiError(res: Response): ApiError {
    const remaining = res.headers.get("x-ratelimit-remaining")
    const reset = Number(res.headers.get("x-ratelimit-reset"))
    if ((res.status === 403 || res.status === 429) && remaining === "0")
        return new ApiError(
            "rate limit reached",
            res.status,
            reset ? reset * 1000 : undefined
        )
    if (res.status === 404) return new ApiError("repository not found", 404)
    if (res.status === 401) return new ApiError("invalid token", 401)
    return new ApiError(`github responded ${res.status}`, res.status)
}

async function fetchRepo(path: string, token?: string): Promise<Repo> {
    const res = await ghFetch(`${API}/repos/${path}`, token)
    if (!res.ok) throw toApiError(res)
    return res.json()
}

async function fetchLanguages(
    path: string,
    token?: string
): Promise<Lang[] | null> {
    try {
        const res = await ghFetch(`${API}/repos/${path}/languages`, token)
        if (!res.ok) return null
        const json = (await res.json()) as Record<string, number>
        const entries = Object.entries(json)
        const total = entries.reduce((a, [, b]) => a + b, 0)
        if (!total) return null
        return entries
            .sort((a, b) => b[1] - a[1])
            .map(([name, bytes]) => ({ name, pct: (bytes / total) * 100 }))
    } catch {
        return null
    }
}

async function fetchActivity(
    path: string,
    token?: string,
    attempt = 0
): Promise<number[] | null> {
    try {
        const res = await ghFetch(
            `${API}/repos/${path}/stats/participation`,
            token
        )
        if (res.status === 202) {
            // GitHub is computing the stats — retry a few times.
            if (attempt >= 3) return null
            await sleep(1200)
            return fetchActivity(path, token, attempt + 1)
        }
        if (!res.ok) return null
        const json = await res.json()
        return Array.isArray(json?.all) ? json.all.slice(-52) : null
    } catch {
        return null
    }
}

/* Sample data for the canvas */
function buildMock(path: string): Repo {
    const [owner, name] = path.split("/")
    return {
        name,
        full_name: path,
        description:
            "Sample description — live repository data loads in preview and on your published site.",
        html_url: `https://github.com/${path}`,
        clone_url: `https://github.com/${path}.git`,
        stargazers_count: 236412,
        forks_count: 48731,
        watchers_count: 236412,
        subscribers_count: 6684,
        open_issues_count: 1043,
        language: "TypeScript",
        license: { name: "MIT License", spdx_id: "MIT" },
        owner: { login: owner, html_url: `https://github.com/${owner}` },
        pushed_at: new Date(Date.now() - 5 * 36e5).toISOString(),
        default_branch: "main",
        archived: false,
        fork: false,
    }
}
const MOCK_LANGS: Lang[] = [
    { name: "TypeScript", pct: 68.2 },
    { name: "JavaScript", pct: 17.4 },
    { name: "CSS", pct: 8.9 },
    { name: "HTML", pct: 3.6 },
    { name: "Shell", pct: 1.9 },
]
const MOCK_ACTIVITY: number[] = Array.from({ length: 52 }, (_, i) => {
    const v = Math.round(16 + 13 * Math.sin(i / 3.1) + ((i * 7) % 11) - 6)
    return i % 9 === 4 ? 0 : Math.max(0, v)
})

/* ═══════════════════════════════════════════════════════════════════════
   Icons (12–16px, stroke-based, currentColor friendly)
   ═══════════════════════════════════════════════════════════════════════ */

type IconProps = { color: string; size?: number }
const I = {
    github: ({ color, size = 16 }: IconProps) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
        >
            <path
                d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.619.069-.606.069-.606 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.748-1.026 2.748-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10Z"
                fill={color}
            />
        </svg>
    ),
    star: ({ color, size = 12 }: IconProps) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
        >
            <path
                d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.5l-3.8 2.1.7-4.3-3.1-3 4.3-.6L8 1.8z"
                fill={color}
            />
        </svg>
    ),
    fork: ({ color, size = 12 }: IconProps) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
        >
            <circle cx="4" cy="3.5" r="1.6" stroke={color} strokeWidth="1.5" />
            <circle cx="12" cy="3.5" r="1.6" stroke={color} strokeWidth="1.5" />
            <circle cx="8" cy="12.5" r="1.6" stroke={color} strokeWidth="1.5" />
            <path
                d="M4 5.1v1.2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5.1M8 8.3v2.6"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    ),
    eye: ({ color, size = 12 }: IconProps) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
        >
            <path
                d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"
                stroke={color}
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <circle cx="8" cy="8" r="1.8" fill={color} />
        </svg>
    ),
    issue: ({ color, size = 12 }: IconProps) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
        >
            <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.5" />
            <circle cx="8" cy="8" r="1.8" fill={color} />
        </svg>
    ),
    arrow: ({ color, size = 14 }: IconProps) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
        >
            <path
                d="M4.5 11.5l7-7M6 4.5h5.5V10"
                stroke={color}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    copy: ({ color, size = 12 }: IconProps) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
        >
            <rect
                x="5.5"
                y="5.5"
                width="8"
                height="8"
                rx="1.8"
                stroke={color}
                strokeWidth="1.5"
            />
            <path
                d="M10.5 5.5v-1a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1"
                stroke={color}
                strokeWidth="1.5"
            />
        </svg>
    ),
    check: ({ color, size = 12 }: IconProps) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
        >
            <path
                d="M3 8.5l3 3 7-7"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    scale: ({ color, size = 12 }: IconProps) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
        >
            <path
                d="M8 2.5v11M3.5 5h9M4.5 5l-2 4.5a2 2 0 0 0 4 0L4.5 5zm7 0l-2 4.5a2 2 0 0 0 4 0L11.5 5z"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    branch: ({ color, size = 12 }: IconProps) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
        >
            <circle cx="4" cy="3.5" r="1.5" stroke={color} strokeWidth="1.4" />
            <circle cx="4" cy="12.5" r="1.5" stroke={color} strokeWidth="1.4" />
            <circle cx="12" cy="5" r="1.5" stroke={color} strokeWidth="1.4" />
            <path
                d="M4 5v6M12 6.5C12 9 9 8.5 6 9.5"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    ),
}

/* ═══════════════════════════════════════════════════════════════════════
   Shared UI context
   ═══════════════════════════════════════════════════════════════════════ */

interface Colors {
    bg: string
    text: string
    accent: string
    muted: string
    faint: string
    border: string
    surface: string
    shadow: string
    dark: boolean
}
interface UI {
    c: Colors
    fs: number
    anim: boolean // motion allowed (not static, not reduced)
    live: boolean // interactive (not canvas/export)
}

/* ═══════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════ */

function Num({
    value,
    enabled,
    active,
}: {
    value: number
    enabled: boolean
    active: boolean
}) {
    const mv = useMotionValue(enabled ? 0 : value)
    const text = useTransform(mv, (v) => formatCompact(Math.round(v)))
    React.useEffect(() => {
        if (!enabled) {
            mv.set(value)
            return
        }
        if (!active) return
        const c = animate(mv, value, { duration: 1.3, ease: EASE })
        return () => c.stop()
    }, [value, enabled, active, mv])
    return <motion.span>{text}</motion.span>
}

function Label({
    ui,
    children,
    right,
}: {
    ui: UI
    children: React.ReactNode
    right?: React.ReactNode
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 8,
                fontSize: Math.max(ui.fs - 3, 9),
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: ui.c.muted,
                lineHeight: 1.4,
            }}
        >
            <span>{children}</span>
            {right && (
                <span style={{ textTransform: "none", letterSpacing: 0 }}>
                    {right}
                </span>
            )}
        </div>
    )
}

function Stat({
    ui,
    icon,
    value,
    label,
    countUp,
    active,
    first,
}: {
    ui: UI
    icon: React.ReactNode
    value: number
    label: string
    countUp: boolean
    active: boolean
    first: boolean
}) {
    return (
        <div
            title={`${formatFull(value)} ${label}`}
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                minWidth: 0,
                paddingLeft: first ? 0 : 12,
                borderLeft: first ? "none" : `1px solid ${ui.c.border}`,
            }}
        >
            <span
                style={{
                    fontSize: ui.fs + 6,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                    color: ui.c.text,
                    whiteSpace: "nowrap",
                }}
            >
                <Num value={value} enabled={countUp} active={active} />
            </span>
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: Math.max(ui.fs - 3, 9),
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: ui.c.muted,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                }}
            >
                {icon}
                {label}
            </span>
        </div>
    )
}

function Pulse({
    ui,
    level,
    animate: anim,
}: {
    ui: UI
    level: 0 | 1 | 2 | 3
    animate: boolean
}) {
    const color =
        level === 3
            ? ui.c.accent
            : level === 2
              ? withAlpha(ui.c.accent, 0.7)
              : level === 1
                ? ui.c.muted
                : ui.c.faint
    return (
        <span
            aria-hidden
            style={{
                position: "relative",
                width: 7,
                height: 7,
                flexShrink: 0,
                display: "inline-block",
            }}
        >
            <span
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: color,
                }}
            />
            {anim && level >= 2 && (
                <motion.span
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 0.6,
                        ease: "easeOut",
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "50%",
                        border: `1px solid ${color}`,
                    }}
                />
            )}
        </span>
    )
}

function Heatmap({
    ui,
    weeks,
    rows,
    fill,
    active,
    hover,
    onHover,
}: {
    ui: UI
    weeks: number[]
    rows: number
    fill: boolean
    active: boolean
    hover: number | null
    onHover: (i: number | null) => void
}) {
    const cols = Math.max(1, Math.ceil(weeks.length / rows))
    const max = Math.max(1, ...weeks)
    const total = weeks.reduce((a, b) => a + b, 0)
    const levels = [0, 0.26, 0.5, 0.75, 1]
    return (
        <div
            role="img"
            aria-label={`${formatFull(total)} commits in the last ${weeks.length} weeks`}
            onPointerLeave={() => onHover(null)}
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap: rows >= 4 ? 4 : 3,
            }}
        >
            {weeks.map((v, i) => {
                const lvl = heatLevel(v, max)
                const bg =
                    lvl === 0
                        ? withAlpha(ui.c.text, ui.c.dark ? 0.09 : 0.06)
                        : withAlpha(ui.c.accent, levels[lvl])
                return (
                    <motion.div
                        key={i}
                        onPointerEnter={() => ui.live && onHover(i)}
                        initial={fill ? { opacity: 0, scale: 0.4 } : false}
                        animate={
                            fill && !active
                                ? { opacity: 0, scale: 0.4 }
                                : { opacity: 1, scale: 1 }
                        }
                        transition={{
                            duration: 0.4,
                            ease: EASE,
                            delay: fill ? 0.15 + i * 0.011 : 0,
                        }}
                        style={{
                            aspectRatio: "1 / 1",
                            borderRadius: "22%",
                            background: bg,
                            boxShadow:
                                hover === i
                                    ? `0 0 0 1.5px ${ui.c.text}`
                                    : "none",
                        }}
                    />
                )
            })}
        </div>
    )
}

function Spark({ ui, weeks }: { ui: UI; weeks: number[] }) {
    const w = weeks.slice(-24)
    const max = Math.max(1, ...w)
    return (
        <span
            aria-hidden
            style={{
                display: "inline-flex",
                alignItems: "flex-end",
                gap: 1.5,
                height: 14,
            }}
        >
            {w.map((v, i) => (
                <span
                    key={i}
                    style={{
                        width: 2.5,
                        height: `${Math.max(14, (v / max) * 100)}%`,
                        borderRadius: 1,
                        background:
                            v === 0
                                ? withAlpha(ui.c.text, 0.12)
                                : withAlpha(
                                      ui.c.accent,
                                      0.35 + 0.65 * (v / max)
                                  ),
                    }}
                />
            ))}
        </span>
    )
}

function Languages({
    ui,
    langs,
    tint,
}: {
    ui: UI
    langs: Lang[]
    tint: LangTint
}) {
    const top = langs.slice(0, 4)
    const rest = langs.slice(4).reduce((a, l) => a + l.pct, 0)
    const segs = rest > 0.5 ? [...top, { name: "Other", pct: rest }] : top
    const color = (name: string, i: number) =>
        name === "Other"
            ? ui.c.faint
            : tint === "accent"
              ? withAlpha(ui.c.accent, Math.max(0.25, 1 - i * 0.22))
              : langColor(name)
    return (
        <div>
            <div
                role="img"
                aria-label={segs
                    .map((s) => `${s.name} ${s.pct.toFixed(1)}%`)
                    .join(", ")}
                style={{
                    display: "flex",
                    height: 3,
                    gap: 2,
                    borderRadius: 2,
                    overflow: "hidden",
                }}
            >
                {segs.map((s, i) => (
                    <span
                        key={s.name}
                        style={{
                            flex: `${s.pct} 1 0%`,
                            minWidth: 2,
                            background: color(s.name, i),
                        }}
                    />
                ))}
            </div>
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px 14px",
                    marginTop: 9,
                    fontSize: Math.max(ui.fs - 2, 10),
                    lineHeight: 1.4,
                }}
            >
                {segs.map((s, i) => (
                    <span
                        key={s.name}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <span
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: color(s.name, i),
                            }}
                        />
                        <span style={{ color: ui.c.text }}>{s.name}</span>
                        <span style={{ color: ui.c.muted }}>
                            {s.pct.toFixed(1)}%
                        </span>
                    </span>
                ))}
            </div>
        </div>
    )
}

function CloneButton({ ui, url }: { ui: UI; url: string }) {
    const [copied, setCopied] = React.useState(false)
    const timer = React.useRef<number | null>(null)
    React.useEffect(
        () => () => {
            if (timer.current) window.clearTimeout(timer.current)
        },
        []
    )
    const cmd = `git clone ${url}`
    const copy = async () => {
        if (!ui.live) return
        try {
            await navigator.clipboard.writeText(cmd)
        } catch {
            return
        }
        React.startTransition(() => setCopied(true))
        if (timer.current) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(
            () => React.startTransition(() => setCopied(false)),
            1500
        )
    }
    return (
        <motion.button
            type="button"
            onClick={copy}
            whileTap={ui.live ? { scale: 0.96 } : undefined}
            aria-label="Copy git clone command"
            title={cmd}
            style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "5px 9px",
                borderRadius: 6,
                border: `1px solid ${ui.c.border}`,
                background: ui.c.surface,
                color: copied ? ui.c.text : ui.c.muted,
                fontFamily: "inherit",
                fontSize: Math.max(ui.fs - 2, 10),
                lineHeight: 1,
                cursor: "pointer",
                minWidth: 68,
                justifyContent: "center",
            }}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={copied ? "done" : "idle"}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    {copied ? (
                        <I.check color={ui.c.accent} />
                    ) : (
                        <I.copy color={ui.c.muted} />
                    )}
                    {copied ? "copied" : "clone"}
                </motion.span>
            </AnimatePresence>
        </motion.button>
    )
}

/* ── States ─────────────────────────────────────────────────────────── */

const Bone = ({
    ui,
    w,
    h,
    r = 4,
    shimmer,
}: {
    ui: UI
    w: string | number
    h: number
    r?: number
    shimmer: boolean
}) => (
    <div
        style={{
            width: w,
            height: h,
            borderRadius: r,
            background: shimmer
                ? `linear-gradient(90deg, ${withAlpha(ui.c.text, 0.05)} 25%, ${withAlpha(ui.c.text, 0.1)} 50%, ${withAlpha(ui.c.text, 0.05)} 75%)`
                : withAlpha(ui.c.text, 0.06),
            backgroundSize: "200% 100%",
            animation: shimmer
                ? "ghp-shimmer 1.5s ease-in-out infinite"
                : "none",
        }}
    />
)

function Skeleton({ ui, gap, strip }: { ui: UI; gap: number; strip: boolean }) {
    const s = ui.anim
    if (strip)
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Bone ui={ui} w={16} h={16} r={8} shimmer={s} />
                <Bone ui={ui} w="34%" h={12} shimmer={s} />
                <Bone ui={ui} w={44} h={12} shimmer={s} />
                <Bone ui={ui} w={44} h={12} shimmer={s} />
                <span style={{ flex: 1 }} />
                <Bone ui={ui} w={70} h={14} shimmer={s} />
            </div>
        )
    return (
        <div style={{ display: "flex", flexDirection: "column", gap }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Bone ui={ui} w="55%" h={16} shimmer={s} />
                <Bone ui={ui} w="90%" h={11} shimmer={s} />
                <Bone ui={ui} w="70%" h={11} shimmer={s} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
                {[0, 1, 2, 3].map((i) => (
                    <Bone key={i} ui={ui} w="25%" h={36} shimmer={s} />
                ))}
            </div>
            <Bone ui={ui} w="100%" h={96} r={6} shimmer={s} />
            <Bone ui={ui} w="100%" h={3} r={2} shimmer={s} />
            <Bone ui={ui} w="100%" h={22} shimmer={s} />
        </div>
    )
}

function EmptyState({ ui }: { ui: UI }) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 12,
                padding: "28px 8px",
                color: ui.c.muted,
            }}
        >
            <I.github color={ui.c.faint} size={28} />
            <div style={{ fontSize: ui.fs, color: ui.c.text }}>
                github pulse
            </div>
            <div
                style={{ fontSize: ui.fs - 1, maxWidth: 260, lineHeight: 1.5 }}
            >
                paste a repository URL to show stars, forks, languages and 52
                weeks of commits.
            </div>
            <code
                style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: `1px dashed ${withAlpha(ui.c.text, 0.25)}`,
                    fontSize: ui.fs - 1,
                    fontFamily: "inherit",
                }}
            >
                github.com/owner/repo
            </code>
        </div>
    )
}

function ErrorState({
    ui,
    error,
    onRetry,
}: {
    ui: UI
    error: ApiError
    onRetry: () => void
}) {
    const hint =
        error.status === 404
            ? "check the URL — private repos need a token."
            : error.status === 403 || error.status === 429
              ? error.resetAt
                  ? `resets ${new Date(error.resetAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                  : "add a token in Advanced to raise the limit."
              : "check the URL or your connection."
    return (
        <div
            role="alert"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 10,
                padding: "24px 8px",
            }}
        >
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    color: ui.c.text,
                    fontSize: ui.fs,
                }}
            >
                <span
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#e5484d",
                    }}
                />
                error: {error.message}
            </span>
            <span style={{ color: ui.c.muted, fontSize: ui.fs - 1 }}>
                {hint}
            </span>
            <motion.button
                type="button"
                onClick={onRetry}
                whileTap={{ scale: 0.96 }}
                style={{
                    marginTop: 4,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: `1px solid ${ui.c.border}`,
                    background: ui.c.surface,
                    color: ui.c.text,
                    fontFamily: "inherit",
                    fontSize: ui.fs - 1,
                    cursor: "pointer",
                }}
            >
                retry
            </motion.button>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════════
   Load state
   ═══════════════════════════════════════════════════════════════════════ */

type LoadState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; error: ApiError }
    | {
          status: "success"
          repo: Repo
          languages: Lang[] | null
          activity: number[] | null
          source: "live" | "cache" | "mock"
      }

const fromEntry = (e: Entry, source: "live" | "cache"): LoadState => ({
    status: "success",
    repo: e.repo,
    languages: e.languages ?? null,
    activity: e.activity ?? null,
    source,
})
const mockState = (path: string): LoadState => ({
    status: "success",
    repo: buildMock(path),
    languages: MOCK_LANGS,
    activity: MOCK_ACTIVITY,
    source: "mock",
})

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * GitHub Pulse
 *
 * Minimal, monospaced repository card with a 52-week commit heatmap,
 * activity pulse, language bar and ledger stats.
 *
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 380
 * @framerIntrinsicHeight 440
 */
export default function GitHubPulse(props: Props) {
    const { repo: repoInput = DEFAULTS.repo, style } = props
    const ap = { ...DEFAULTS.appearance, ...props.appearance }
    const layout = { ...DEFAULTS.layout, ...props.layout }
    const content = { ...DEFAULTS.content, ...props.content }
    const anim = { ...DEFAULTS.animation, ...props.animation }
    const advanced = { ...DEFAULTS.advanced, ...props.advanced }
    const font = props.font ?? DEFAULTS.font

    /* ── Environment ──────────────────────────────────────────────── */
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const reduceMotion = useReducedMotion() ?? false
    const useMock = isStatic && !advanced.liveOnCanvas
    const animAllowed = !isStatic && !reduceMotion
    const live = !isStatic

    /* ── Theme ────────────────────────────────────────────────────── */
    const c: Colors = React.useMemo(() => {
        const custom = ap.preset === "custom"
        const base = custom
            ? PRESETS.paper
            : (PRESETS[ap.preset] ?? PRESETS.paper)
        const bg = (custom && parseToken(ap.background)) || base.bg
        const text = (custom && parseToken(ap.text)) || base.text
        const accent = (custom && parseToken(ap.accent)) || base.accent
        const dark = isDarkColor(bg)
        return {
            bg,
            text,
            accent,
            dark,
            muted: withAlpha(text, 0.56),
            faint: withAlpha(text, 0.32),
            border: withAlpha(text, dark ? 0.12 : 0.1),
            surface: withAlpha(text, dark ? 0.06 : 0.04),
            shadow:
                parseToken(ap.shadow) ||
                (dark
                    ? "0 0 0 1px rgba(255,255,255,0.02), 0 24px 48px -28px rgba(0,0,0,0.8)"
                    : "0 1px 2px rgba(20,20,20,0.03), 0 16px 40px -24px rgba(20,20,20,0.16)"),
        }
    }, [ap.preset, ap.background, ap.text, ap.accent, ap.shadow])

    const fs = toPx(font?.fontSize ?? font?.size, 13)
    const isStrip = layout.variant === "strip"
    const ui: UI = { c, fs, anim: animAllowed, live }

    /* ── Data ─────────────────────────────────────────────────────── */
    const repoPath = React.useMemo(
        () => extractRepoPath(repoInput),
        [repoInput]
    )
    const token = advanced.token?.trim() || ""
    const wantLangs = content.showLanguages && !isStrip
    const wantActivity = content.showHeatmap || (content.showTrend && !isStrip)
    const cacheKey = repoPath ? `${repoPath}|${token ? "t" : "a"}` : ""
    const [reloadKey, setReloadKey] = React.useState(0)

    const [state, setState] = React.useState<LoadState>(() =>
        !repoPath
            ? { status: "idle" }
            : useMock
              ? mockState(repoPath)
              : { status: "loading" }
    )
    const set = React.useCallback(
        (s: LoadState) => React.startTransition(() => setState(s)),
        []
    )

    React.useEffect(() => {
        if (!repoPath) {
            set({ status: "idle" })
            return
        }
        if (useMock) {
            set(mockState(repoPath))
            return
        }
        let cancelled = false
        const ttl = Math.max(0, advanced.cacheMinutes) * 60_000
        const cached = readCache(cacheKey, ttl)
        const needL = wantLangs && (!cached || cached.languages === undefined)
        const needA = wantActivity && (!cached || cached.activity === undefined)

        if (cached) set(fromEntry(cached, "cache"))
        else set({ status: "loading" })
        if (cached && !needL && !needA) return
        ;(async () => {
            try {
                let entry: Entry
                if (cached) {
                    entry = cached
                } else {
                    const repo = await dedupe(`repo:${cacheKey}`, () =>
                        fetchRepo(repoPath, token)
                    )
                    entry = { ts: Date.now(), repo }
                    writeCache(cacheKey, entry)
                    if (cancelled) return
                    set(fromEntry(entry, "live")) // paint fast, extras follow
                }
                const [languages, activity] = await Promise.all([
                    needL
                        ? dedupe(`lang:${cacheKey}`, () =>
                              fetchLanguages(repoPath, token)
                          )
                        : Promise.resolve(entry.languages),
                    needA
                        ? dedupe(`act:${cacheKey}`, () =>
                              fetchActivity(repoPath, token)
                          )
                        : Promise.resolve(entry.activity),
                ])
                const next: Entry = { ...entry }
                if (needL) next.languages = languages ?? null
                if (needA) next.activity = activity ?? null
                writeCache(cacheKey, next)
                if (cancelled) return
                set(fromEntry(next, cached ? "cache" : "live"))
            } catch (err) {
                if (cancelled) return
                const stale = readCache(cacheKey, Infinity)
                if (stale) set(fromEntry(stale, "cache"))
                else
                    set({
                        status: "error",
                        error:
                            err instanceof ApiError
                                ? err
                                : new ApiError("couldn't reach github", 0),
                    })
            }
        })()
        return () => {
            cancelled = true
        }
    }, [
        repoPath,
        token,
        cacheKey,
        advanced.cacheMinutes,
        useMock,
        wantLangs,
        wantActivity,
        reloadKey,
        set,
    ])

    const retry = () => {
        if (cacheKey) clearCache(cacheKey)
        React.startTransition(() => setReloadKey((k) => k + 1))
    }

    /* ── Interaction & reveal ─────────────────────────────────────── */
    const rootRef = React.useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = React.useState(false)
    const [heatHover, setHeatHover] = React.useState<number | null>(null)
    const inView = useInView(rootRef, { once: true, amount: 0.25 })
    const revealMode: Reveal = animAllowed ? anim.reveal : "off"
    const revealed = revealMode !== "scroll" || inView

    const item: Variants = React.useMemo(
        () => ({
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: anim.transition },
        }),
        [anim.transition]
    )
    const list: Variants = {
        hidden: {},
        show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
    }
    const countUp = anim.countUp && animAllowed
    const heatFill = anim.heatFill && animAllowed
    const pulseOn = anim.pulse && animAllowed

    /* ── Root style ───────────────────────────────────────────────── */
    const rootStyle: React.CSSProperties = {
        position: "relative",
        boxSizing: "border-box",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background: c.bg,
        color: c.text,
        borderRadius: ap.radius,
        padding: layout.padding,
        boxShadow: c.shadow,
        borderWidth: 1,
        borderStyle: "solid",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
        fontVariantNumeric: "tabular-nums",
        fontFamily: MONO,
        ...clean(font ?? {}),
        ...style,
    }
    const borderColor = !ap.showBorder
        ? "rgba(0,0,0,0)"
        : hovered
          ? withAlpha(c.accent, 0.55)
          : c.border

    /* ── Body ─────────────────────────────────────────────────────── */
    let body: React.ReactNode
    if (state.status === "idle") body = <EmptyState ui={ui} />
    else if (state.status === "loading")
        body = (
            <>
                {animAllowed && (
                    <style>{`@keyframes ghp-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                )}
                <Skeleton ui={ui} gap={layout.gap} strip={isStrip} />
            </>
        )
    else if (state.status === "error")
        body = <ErrorState ui={ui} error={state.error} onRetry={retry} />
    else {
        const { repo, languages, activity } = state
        const watchers = repo.subscribers_count ?? repo.watchers_count
        const fresh = freshness(repo.pushed_at)
        const license =
            repo.license &&
            (repo.license.spdx_id && repo.license.spdx_id !== "NOASSERTION"
                ? repo.license.spdx_id
                : repo.license.name.replace(/ License$/i, ""))
        const weeks = activity && activity.some((v) => v > 0) ? activity : null
        const tr = weeks && content.showTrend ? trend(weeks) : null
        const total = weeks ? weeks.reduce((a, b) => a + b, 0) : 0

        const stats = [
            content.showStars && {
                icon: <I.star color={c.accent} />,
                value: repo.stargazers_count,
                label: "stars",
            },
            content.showForks && {
                icon: <I.fork color={c.muted} />,
                value: repo.forks_count,
                label: "forks",
            },
            content.showWatchers && {
                icon: <I.eye color={c.muted} />,
                value: watchers,
                label: "watching",
            },
            content.showIssues && {
                icon: <I.issue color={c.muted} />,
                value: repo.open_issues_count,
                label: "issues",
            },
        ].filter(Boolean) as {
            icon: React.ReactNode
            value: number
            label: string
        }[]

        const tag = (text: string) => (
            <span
                style={{
                    fontSize: Math.max(fs - 4, 9),
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: c.muted,
                    border: `1px solid ${c.border}`,
                    borderRadius: 4,
                    padding: "1px 5px",
                    lineHeight: 1.5,
                    whiteSpace: "nowrap",
                }}
            >
                {text}
            </span>
        )

        const title = (
            <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    color: "inherit",
                    textDecoration: "none",
                    fontSize: isStrip ? fs + 1 : fs + 3,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                    minWidth: 0,
                }}
                title={repo.full_name}
            >
                <span style={{ color: c.muted, fontWeight: 400 }}>
                    {repo.owner.login}
                </span>
                <span
                    style={{ color: c.faint, fontWeight: 400, margin: "0 3px" }}
                >
                    /
                </span>
                {repo.name}
            </a>
        )

        const arrow = content.showLink && (
            <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open on GitHub"
                style={{
                    display: "flex",
                    flexShrink: 0,
                    color: hovered ? c.text : c.muted,
                    transition: "color .25s ease",
                }}
            >
                <motion.span
                    animate={{
                        x: hovered && live ? 2 : 0,
                        y: hovered && live ? -2 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    style={{ display: "flex" }}
                >
                    <I.arrow color="currentColor" />
                </motion.span>
            </a>
        )

        /* Strip variant ─────────────────────────────────────────── */
        if (isStrip) {
            const pill = (
                icon: React.ReactNode,
                value: number,
                label: string
            ) => (
                <span
                    key={label}
                    title={`${formatFull(value)} ${label}`}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: fs,
                        color: c.text,
                        whiteSpace: "nowrap",
                    }}
                >
                    {icon}
                    <Num value={value} enabled={countUp} active={revealed} />
                </span>
            )
            body = (
                <motion.div
                    variants={list}
                    initial={revealMode === "off" ? false : "hidden"}
                    animate={revealed ? "show" : "hidden"}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px 16px",
                        flexWrap: "wrap",
                    }}
                >
                    <motion.div
                        variants={item}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            flex: "1 1 160px",
                            minWidth: 0,
                        }}
                    >
                        <I.github color={c.text} size={fs + 3} />
                        {title}
                        {repo.archived && tag("archived")}
                    </motion.div>
                    <motion.div
                        variants={item}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                        }}
                    >
                        {content.showStars &&
                            pill(
                                <I.star color={c.accent} />,
                                repo.stargazers_count,
                                "stars"
                            )}
                        {content.showForks &&
                            pill(
                                <I.fork color={c.muted} />,
                                repo.forks_count,
                                "forks"
                            )}
                        {content.showWatchers &&
                            pill(
                                <I.eye color={c.muted} />,
                                watchers,
                                "watching"
                            )}
                        {content.showIssues &&
                            pill(
                                <I.issue color={c.muted} />,
                                repo.open_issues_count,
                                "issues"
                            )}
                    </motion.div>
                    {content.showHeatmap && weeks && (
                        <motion.div
                            variants={item}
                            title={`${formatFull(total)} commits · 52 weeks`}
                        >
                            <Spark ui={ui} weeks={weeks} />
                        </motion.div>
                    )}
                    {content.showMeta && (
                        <motion.div
                            variants={item}
                            title={`last push ${shortAgo(repo.pushed_at)}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 7,
                                color: c.muted,
                                fontSize: fs - 1,
                                whiteSpace: "nowrap",
                            }}
                        >
                            <Pulse ui={ui} level={fresh} animate={pulseOn} />
                            {shortAgo(repo.pushed_at)}
                        </motion.div>
                    )}
                    {arrow && (
                        <motion.div
                            variants={item}
                            style={{ marginLeft: "auto", display: "flex" }}
                        >
                            {arrow}
                        </motion.div>
                    )}
                </motion.div>
            )
        } else {
            /* Card variant ────────────────────────────────────────── */
            const caption =
                heatHover !== null && weeks
                    ? `${weeks[heatHover]} commit${weeks[heatHover] === 1 ? "" : "s"} · wk of ${weekLabel(Date.now() - (weeks.length - 1 - heatHover) * 7 * 864e5)}`
                    : `${formatFull(total)} commits · ${weeks?.length ?? 52} weeks`
            const trendNode = tr && (
                <span
                    style={{
                        color:
                            tr.dir === "up"
                                ? c.accent
                                : tr.dir === "down"
                                  ? c.muted
                                  : c.muted,
                        fontVariantNumeric: "tabular-nums",
                    }}
                    title="last 4 weeks vs the 4 before"
                >
                    {tr.dir === "up" ? "↑" : tr.dir === "down" ? "↓" : "→"}{" "}
                    {tr.pct === null
                        ? "new"
                        : `${Math.abs(Math.round(tr.pct))}%`}
                    <span style={{ color: c.faint }}> · 4 wk</span>
                </span>
            )

            body = (
                <motion.div
                    variants={list}
                    initial={revealMode === "off" ? false : "hidden"}
                    animate={revealed ? "show" : "hidden"}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: layout.gap,
                    }}
                >
                    {/* Header */}
                    <motion.div variants={item}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <I.github color={c.text} size={fs + 5} />
                            <div
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                {title}
                                {repo.archived && tag("archived")}
                                {repo.fork && tag("fork")}
                            </div>
                            {arrow}
                        </div>
                        {content.showDescription && repo.description && (
                            <p
                                style={{
                                    margin: "8px 0 0",
                                    fontSize: fs,
                                    lineHeight: 1.55,
                                    color: c.muted,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                }}
                            >
                                {repo.description}
                            </p>
                        )}
                    </motion.div>

                    {/* Ledger */}
                    {stats.length > 0 && (
                        <motion.div
                            variants={item}
                            style={{
                                display: "grid",
                                gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
                                gap: 0,
                            }}
                        >
                            {stats.map((s, i) => (
                                <Stat
                                    key={s.label}
                                    ui={ui}
                                    icon={s.icon}
                                    value={s.value}
                                    label={s.label}
                                    countUp={countUp}
                                    active={revealed}
                                    first={i === 0}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* Heatmap */}
                    {content.showHeatmap && weeks && (
                        <motion.div variants={item}>
                            <Label ui={ui} right={trendNode}>
                                commits
                            </Label>
                            <Heatmap
                                ui={ui}
                                weeks={weeks}
                                rows={layout.heatRows}
                                fill={heatFill}
                                active={revealed}
                                hover={heatHover}
                                onHover={(i) =>
                                    React.startTransition(() => setHeatHover(i))
                                }
                            />
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 8,
                                    marginTop: 8,
                                    fontSize: Math.max(fs - 2, 10),
                                    color: c.muted,
                                    lineHeight: 1.4,
                                }}
                            >
                                <span
                                    style={{
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {caption}
                                </span>
                                <span
                                    aria-hidden
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3,
                                        color: c.faint,
                                    }}
                                >
                                    less
                                    {[0, 0.26, 0.5, 0.75, 1].map((a, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 2,
                                                margin:
                                                    i === 0
                                                        ? "0 0 0 3px"
                                                        : i === 4
                                                          ? "0 3px 0 0"
                                                          : 0,
                                                background:
                                                    a === 0
                                                        ? withAlpha(
                                                              c.text,
                                                              c.dark
                                                                  ? 0.09
                                                                  : 0.06
                                                          )
                                                        : withAlpha(
                                                              c.accent,
                                                              a
                                                          ),
                                            }}
                                        />
                                    ))}
                                    more
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* Languages */}
                    {content.showLanguages &&
                        languages &&
                        languages.length > 0 && (
                            <motion.div variants={item}>
                                <Languages
                                    ui={ui}
                                    langs={languages}
                                    tint={ap.langTint}
                                />
                            </motion.div>
                        )}

                    {/* Footer */}
                    {(content.showMeta || content.showClone) && (
                        <motion.div
                            variants={item}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px 14px",
                                flexWrap: "wrap",
                                paddingTop: Math.max(10, layout.gap - 6),
                                borderTop: `1px solid ${c.border}`,
                                fontSize: Math.max(fs - 1, 10),
                                color: c.muted,
                                lineHeight: 1.4,
                            }}
                        >
                            {content.showMeta && (
                                <>
                                    <span
                                        title={new Date(
                                            repo.pushed_at
                                        ).toLocaleString("en-US")}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 7,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        <Pulse
                                            ui={ui}
                                            level={fresh}
                                            animate={pulseOn}
                                        />
                                        <span
                                            style={{
                                                color:
                                                    fresh >= 2
                                                        ? c.text
                                                        : c.muted,
                                            }}
                                        >
                                            pushed {shortAgo(repo.pushed_at)}
                                        </span>
                                    </span>
                                    {license && (
                                        <span
                                            title={repo.license?.name}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 5,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <I.scale color={c.faint} />
                                            {license}
                                        </span>
                                    )}
                                    <span
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 5,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        <I.branch color={c.faint} />
                                        {repo.default_branch}
                                    </span>
                                </>
                            )}
                            {content.showClone && (
                                <span
                                    style={{
                                        marginLeft: "auto",
                                        display: "flex",
                                    }}
                                >
                                    <CloneButton ui={ui} url={repo.clone_url} />
                                </span>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            )
        }
    }

    /* ── Render ───────────────────────────────────────────────────── */
    return (
        <motion.div
            ref={rootRef}
            initial={false}
            animate={{ borderColor }}
            transition={{ duration: 0.3 }}
            onHoverStart={() =>
                live && React.startTransition(() => setHovered(true))
            }
            onHoverEnd={() =>
                live && React.startTransition(() => setHovered(false))
            }
            style={rootStyle}
        >
            {body}
            {isCanvas &&
                state.status === "success" &&
                state.source === "mock" && (
                    <span
                        aria-hidden
                        style={{
                            position: "absolute",
                            top: 6,
                            right: 8,
                            fontSize: 9,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: c.faint,
                            pointerEvents: "none",
                        }}
                    >
                        sample
                    </span>
                )}
        </motion.div>
    )
}

GitHubPulse.displayName = "GitHub Pulse"

/* ═══════════════════════════════════════════════════════════════════════
   Property controls
   ═══════════════════════════════════════════════════════════════════════ */

addPropertyControls(GitHubPulse, {
    repo: {
        type: ControlType.String,
        title: "Repository",
        defaultValue: DEFAULTS.repo,
        placeholder: "github.com/owner/repo",
        description:
            "URL or `owner/repo`. Live data loads in preview and on your site; the canvas shows sample numbers.",
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        icon: "color",
        controls: {
            preset: {
                type: ControlType.Enum,
                title: "Theme",
                options: ["paper", "ink", "github", "custom"],
                optionTitles: ["Paper", "Ink", "GitHub", "Custom"],
                defaultValue: "paper",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#faf9f5",
                hidden: (p: any) => p.preset !== "custom",
            },
            text: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#1d1c1a",
                hidden: (p: any) => p.preset !== "custom",
                description:
                    "Muted text, hairlines and surfaces are derived from this.",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#d97757",
                hidden: (p: any) => p.preset !== "custom",
            },
            langTint: {
                type: ControlType.Enum,
                title: "Languages",
                options: ["github", "accent"],
                optionTitles: ["GitHub", "Accent"],
                defaultValue: "github",
                displaySegmentedControl: true,
                description:
                    "GitHub colours per language, or accent shades for a strict palette.",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "16px",
            },
            showBorder: {
                type: ControlType.Boolean,
                title: "Outline",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            shadow: { type: ControlType.BoxShadow, title: "Shadow" },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            variant: {
                type: ControlType.Enum,
                title: "Variant",
                options: ["card", "strip"],
                optionTitles: ["Card", "Strip"],
                defaultValue: "card",
                displaySegmentedControl: true,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "20px",
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                defaultValue: 18,
                min: 8,
                max: 40,
                step: 1,
                unit: "px",
                hidden: (p: any) => p.variant === "strip",
            },
            heatRows: {
                type: ControlType.Enum,
                title: "Heatmap",
                options: [1, 2, 4],
                optionTitles: ["1 row", "2 rows", "4 rows"],
                defaultValue: 4,
                displaySegmentedControl: true,
                hidden: (p: any) => p.variant === "strip",
            },
        },
    },

    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            showDescription: {
                type: ControlType.Boolean,
                title: "Description",
                defaultValue: true,
            },
            showStars: {
                type: ControlType.Boolean,
                title: "Stars",
                defaultValue: true,
            },
            showForks: {
                type: ControlType.Boolean,
                title: "Forks",
                defaultValue: true,
            },
            showWatchers: {
                type: ControlType.Boolean,
                title: "Watching",
                defaultValue: true,
            },
            showIssues: {
                type: ControlType.Boolean,
                title: "Issues",
                defaultValue: true,
            },
            showHeatmap: {
                type: ControlType.Boolean,
                title: "Commits",
                defaultValue: true,
                description: "52-week commit heatmap (1 extra API call).",
            },
            showTrend: {
                type: ControlType.Boolean,
                title: "Trend",
                defaultValue: true,
                hidden: (p: any) => p.showHeatmap === false,
            },
            showLanguages: {
                type: ControlType.Boolean,
                title: "Languages",
                defaultValue: true,
                description: "Language bar (1 extra API call).",
            },
            showMeta: {
                type: ControlType.Boolean,
                title: "Meta",
                defaultValue: true,
            },
            showClone: {
                type: ControlType.Boolean,
                title: "Clone",
                defaultValue: true,
            },
            showLink: {
                type: ControlType.Boolean,
                title: "Link",
                defaultValue: true,
            },
        },
    },

    font: {
        // @ts-ignore – Framer extended font control
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: false,
        defaultFontType: "monospace",
        defaultValue: DEFAULTS.font,
    },

    animation: {
        type: ControlType.Object,
        title: "Motion",
        icon: "effect",
        controls: {
            reveal: {
                type: ControlType.Enum,
                title: "Reveal",
                options: ["load", "scroll", "off"],
                optionTitles: ["Load", "Scroll", "Off"],
                defaultValue: "load",
                displaySegmentedControl: true,
            },
            countUp: {
                type: ControlType.Boolean,
                title: "Count Up",
                defaultValue: true,
            },
            heatFill: {
                type: ControlType.Boolean,
                title: "Heat Fill",
                defaultValue: true,
            },
            pulse: {
                type: ControlType.Boolean,
                title: "Pulse",
                defaultValue: true,
            },
            transition: {
                type: ControlType.Transition,
                title: "Transition",
                defaultValue: DEFAULTS.animation.transition,
            },
        },
    },

    advanced: {
        type: ControlType.Object,
        title: "Advanced",
        controls: {
            token: {
                type: ControlType.String,
                title: "Token",
                obscured: true,
                defaultValue: "",
                placeholder: "github_pat_…",
                description:
                    "Optional **read-only** fine-grained token (60 → 5,000 req/hr, private repos). It's visible to visitors — never use write scopes.",
            },
            cacheMinutes: {
                type: ControlType.Number,
                title: "Cache",
                defaultValue: 10,
                min: 0,
                max: 120,
                step: 5,
                unit: "min",
            },
            liveOnCanvas: {
                type: ControlType.Boolean,
                title: "Canvas",
                defaultValue: false,
                enabledTitle: "Live",
                disabledTitle: "Sample",
                description:
                    "Live fetches on the canvas count against the rate limit.",
            },
        },
    },
})
