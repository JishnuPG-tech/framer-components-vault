// [생성일] 2026-11-12
// [경위] 달러벌기 34번 상품: 달력형 활동 히트맵(GitHub 잔디 모양)을 "직접 넣는 데이터"로 그린다. 통계 줄·범례·월/요일 라벨·툴팁·부모 너비 맞춤
// [변경이력]
//   - 2026-11-12: 최초 생성 (날짜 줄 목록 입력 · 빈 데이터면 고정 시드 데모 · 최근 N주/특정 연도 · 주 시작 요일 · 색 테마 7종+직접 색 · 색 단계 2~6 · 균등/분위 단계 · 통계 4종 · 범례 · 툴팁 · 방향키 탐색 · 부모 너비 측정 · 등장 1회 · 정적·캔버스 완성 상태)

import { useEffect, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type Rgb = [number, number, number]

interface Colors {
    background?: string
    text?: string
    muted?: string
    empty?: string
    tooltipBg?: string
    tooltipText?: string
}

interface Cell {
    day: number
    col: number
    row: number
    value: number
    level: number
}

interface MonthLabel {
    x: number
    w: number
    text: string
    first: boolean
}

type ThemeName = "mint" | "green" | "blue" | "purple" | "orange" | "pink" | "mono" | "custom"

const DAY_MS = 86400000
const MAX_LINES = 5000
// 서버 렌더(오늘 날짜를 아직 모를 때)에만 쓰는 기준일. 브라우저에서는 마운트 직후 실제 오늘로 바뀜
const FALLBACK_DAY = Math.floor(Date.UTC(2026, 10, 12) / DAY_MS)

const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const EN_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// 색 테마별 대표색 (단계 색은 이 색 하나에서 자동으로 만든다)
const ACCENTS: Record<string, string> = {
    mint: "#2DE5A0",
    green: "#2DA44E",
    blue: "#3B82F6",
    purple: "#8B5CF6",
    orange: "#F97316",
    pink: "#EC4899",
}

// ─────────────────────────────────────────────
// 유틸 함수
// ─────────────────────────────────────────────

// 프레이머는 색을 rgb()/rgba() 로 넘기므로 둘 다 + HEX 모두 처리 (알파 포함)
function parseColor(c: string): [number, number, number, number] | null {
    if (typeof c !== "string") return null
    const m = c.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?/i)
    if (m) {
        let a = 1
        if (m[4] !== undefined) a = m[4].indexOf("%") >= 0 ? parseFloat(m[4]) / 100 : parseFloat(m[4])
        return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), isFinite(a) ? a : 1]
    }
    if (c.charAt(0) === "#") {
        let h = c.slice(1)
        if (h.length === 3 || h.length === 4) h = h.split("").map((x) => x + x).join("")
        if (h.length >= 6) {
            const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a]
        }
    }
    return null
}

function toRgb(c: string, fallback: Rgb): Rgb {
    const p = parseColor(c)
    return p ? [p[0], p[1], p[2]] : fallback
}

// 두 색을 t(0~1)만큼 섞기
function mix(a: Rgb, b: Rgb, t: number): string {
    const k = Math.max(0, Math.min(1, t))
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)}, ${Math.round(a[1] + (b[1] - a[1]) * k)}, ${Math.round(a[2] + (b[2] - a[2]) * k)})`
}

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
}

function fontSizeOf(ctl: CSSProperties | undefined, fallback: number): number {
    const n = parseFloat(String(ctl && ctl.fontSize))
    return isFinite(n) && n > 0 ? n : fallback
}

// 날짜를 "1970-01-01 부터 며칠째"인 정수로 다룬다 (시간대 영향 없음)
function dayNum(y: number, m: number, d: number): number {
    return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS)
}

// 요일: 0=일 … 6=토 (1970-01-01 은 목요일)
function dowOf(day: number): number {
    return (((day + 4) % 7) + 7) % 7
}

// 그 날짜가 속한 주의 첫날 (ws: 0=일요일 시작, 1=월요일 시작)
function startOfWeek(day: number, ws: number): number {
    return day - ((dowOf(day) - ws + 7) % 7)
}

function monthOf(day: number): number {
    return new Date(day * DAY_MS).getUTCMonth()
}

// 고정 시드 난수: 같은 숫자를 넣으면 항상 같은 0~1 값 (데모 데이터가 새로고침마다 바뀌지 않게)
function hash01(n: number): number {
    let t = (n + 0x6d2b79f5) | 0
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// 데모 데이터: 날짜마다 정해진 값 (평일에 더 자주, 가끔 한 주 통째로 쉼, 계절 흐름)
function demoValue(day: number): number {
    const week = Math.floor((day + 4) / 7)
    if (hash01(week * 7919 + 13) < 0.07) return 0
    const chance = [0.35, 0.82, 0.72, 0.86, 0.7, 0.62, 0.45][dowOf(day)]
    if (hash01(day * 31 + 7) > chance) return 0
    const r = hash01(day * 131 + 71)
    const wave = 0.75 + 0.25 * Math.sin(day / 29)
    return Math.max(1, Math.round((1 + r * r * 9) * wave))
}

// 입력 글자를 날짜별 합계로 바꾼다.
// 한 줄 = "2026-03-14, 5" (구분: 쉼표·탭·공백·세미콜론, 날짜 구분: - / .). 값이 없으면 1로 세고, 같은 날짜는 더한다.
function parseData(text: string): { map: Map<number, number>; last: number | null } {
    const map = new Map<number, number>()
    let last: number | null = null
    if (typeof text !== "string" || !text.trim()) return { map, last }
    const lines = text.split(/\r?\n/).slice(0, MAX_LINES)
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:T\S*)?(?:[\s,;|]+(-?\d+(?:\.\d+)?))?/)
        if (!m) continue
        const y = parseInt(m[1], 10)
        const mo = parseInt(m[2], 10)
        const d = parseInt(m[3], 10)
        if (mo < 1 || mo > 12 || d < 1 || d > 31) continue
        const day = dayNum(y, mo, d)
        // 2월 30일 같은 없는 날짜는 건너뜀
        if (new Date(day * DAY_MS).getUTCDate() !== d) continue
        const v = m[4] !== undefined ? parseFloat(m[4]) : 1
        if (!isFinite(v)) continue
        map.set(day, (map.get(day) || 0) + Math.max(0, v))
        if (last === null || day > last) last = day
    }
    return { map, last }
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface ActivityHeatmapProps {
    data?: string
    title?: string
    unit?: string
    unitPlural?: string
    range?: "weeks" | "year"
    weeks?: number
    year?: number
    endsOn?: "today" | "last"
    weekStart?: "sun" | "mon"
    theme?: ThemeName
    accent?: string
    steps?: number
    scale?: "even" | "quantile"
    maxValue?: number
    appearance?: "light" | "dark"
    sizing?: "fit" | "fixed"
    cellSize?: number
    maxCell?: number
    minCell?: number
    gap?: number
    cellRadius?: number
    align?: "left" | "center"
    showMonths?: boolean
    weekdayLabels?: "none" | "mwf" | "all"
    locale?: string
    showStats?: boolean
    totalLabel?: string
    activeLabel?: string
    longestLabel?: string
    currentLabel?: string
    showLegend?: boolean
    lessLabel?: string
    moreLabel?: string
    showTooltip?: boolean
    customColors?: boolean
    colors?: Colors
    animate?: boolean
    stagger?: number
    radius?: number
    padding?: number
    font?: CSSProperties
    axisFont?: CSSProperties
    style?: CSSProperties
}

/**
 * Activity Heatmap — 직접 넣은 날짜·값으로 그리는 달력형 활동 히트맵. 통계 줄·범례·월/요일 라벨·툴팁 포함.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 880
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ActivityHeatmap(props: ActivityHeatmapProps) {
    const {
        data = "",
        title = "Workout log",
        unit = "workout",
        unitPlural = "workouts",
        range = "weeks",
        weeks = 52,
        year = 2026,
        endsOn = "today",
        weekStart = "sun",
        theme: themeName = "mint",
        accent = "#2DE5A0",
        steps = 4,
        scale = "even",
        maxValue = 0,
        appearance = "light",
        sizing = "fit",
        cellSize = 12,
        maxCell = 16,
        minCell = 8,
        gap = 3,
        cellRadius = 3,
        align = "left",
        showMonths = true,
        weekdayLabels = "mwf",
        locale = "en-US",
        showStats = true,
        totalLabel = "Total",
        activeLabel = "Active days",
        longestLabel = "Longest streak",
        currentLabel = "Current streak",
        showLegend = true,
        lessLabel = "Less",
        moreLabel = "More",
        showTooltip = true,
        customColors = false,
        colors: colorProps,
        animate = true,
        stagger = 16,
        radius = 16,
        padding = 24,
        font,
        axisFont,
        style,
    } = props

    const areaRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(880 - 24 * 2)
    const [active, setActive] = useState<number | null>(null)
    const [todayDay, setTodayDay] = useState<number | null>(null)

    // ── 색 기본값: Appearance 에 따르고, Custom Colors 를 켰을 때만 입력값 사용 ──
    // (프레이머는 기본값 없는 Color 컨트롤을 파란색으로 채워 넘기므로 토글로 분리)
    const cs = customColors ? colorProps : undefined
    const dark = appearance === "dark"
    const theme = {
        background: cs?.background ?? (dark ? "#101114" : "rgba(255, 255, 255, 0)"),
        text: cs?.text ?? (dark ? "#F4F4F6" : "#111114"),
        muted: cs?.muted ?? (dark ? "#9A9AA6" : "#6B6B76"),
        empty: cs?.empty ?? (dark ? "rgba(255, 255, 255, 0.08)" : "rgba(17, 17, 20, 0.07)"),
        tooltipBg: cs?.tooltipBg ?? (dark ? "#F4F4F6" : "#111114"),
        tooltipText: cs?.tooltipText ?? (dark ? "#111114" : "#FFFFFF"),
    }

    // ── 단계 색: 대표색 하나에서 자동 생성 ──
    // 밝은 바탕: 옅은 색 → 대표색 → 조금 더 짙은 색 / 어두운 바탕: 가라앉은 색 → 대표색 → 조금 더 밝은 색
    const stepCount = clamp(Math.round(steps) || 4, 2, 6)
    const palette = useMemo(() => {
        const bg = parseColor(theme.background)
        const surface: Rgb = bg && bg[3] > 0.5 ? [bg[0], bg[1], bg[2]] : dark ? [16, 17, 20] : [255, 255, 255]
        const surfaceDark = (0.299 * surface[0] + 0.587 * surface[1] + 0.114 * surface[2]) / 255 < 0.5
        const base =
            themeName === "custom" ? accent : themeName === "mono" ? theme.text : ACCENTS[themeName] || ACCENTS.mint
        const acc = toRgb(base, [45, 229, 160])
        const out: string[] = []
        for (let i = 1; i <= stepCount; i++) {
            const t = i / stepCount
            if (surfaceDark) {
                const peak = 0.8
                out.push(t <= peak ? mix(surface, acc, 0.26 + (t / peak) * 0.74) : mix(acc, [255, 255, 255], ((t - peak) / (1 - peak)) * 0.22))
            } else {
                const peak = 0.7
                out.push(t <= peak ? mix(surface, acc, 0.3 + (t / peak) * 0.7) : mix(acc, [0, 0, 0], ((t - peak) / (1 - peak)) * 0.34))
            }
        }
        return out
    }, [theme.background, theme.text, dark, themeName, accent, stepCount])

    // ── 부모(컨테이너) 너비 측정: 창 너비가 아니라 이 컴포넌트가 실제로 받은 너비에 칸 크기를 맞춘다 ──
    // clientWidth 는 캔버스 확대/축소(transform)의 영향을 받지 않는다
    useEffect(() => {
        const el = areaRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const apply = () => {
            const w = el.clientWidth
            if (w > 0) startTransition(() => setWidth(w))
        }
        apply()
        const ro = new ResizeObserver(apply)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // ── 오늘 날짜: 서버 렌더와 브라우저 화면이 어긋나지 않도록 마운트 뒤에 읽는다 ──
    useEffect(() => {
        const n = new Date()
        const d = dayNum(n.getFullYear(), n.getMonth() + 1, n.getDate())
        startTransition(() => setTodayDay(d))
    }, [])

    // ── 등장 애니메이션 (한 번만, 화면에 보일 때 시작) ──
    // 정적 렌더·캔버스·화면 밖·모션 줄이기 설정에서는 완성된 상태를 즉시 보여줌. 반복 애니메이션은 없음
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const canAnimate = animate && !isStatic && !isCanvas
    const [phase, setPhase] = useState<"done" | "hidden" | "playing">("done")
    useEffect(() => {
        const rm = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const el = areaRef.current
        if (!canAnimate || rm || !el || typeof IntersectionObserver === "undefined") {
            startTransition(() => setPhase("done"))
            return
        }
        startTransition(() => setPhase("hidden"))
        let t1 = 0
        let t2 = 0
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0] && entries[0].isIntersecting) {
                    io.disconnect()
                    t1 = window.setTimeout(() => {
                        startTransition(() => setPhase("playing"))
                        // 재생이 끝나면 "done" 으로 돌아가 이후에는 아무 애니메이션도 돌지 않음
                        t2 = window.setTimeout(() => startTransition(() => setPhase("done")), 57 * Math.max(0, stagger) + 700)
                    }, 60)
                }
            },
            { threshold: 0.2 }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            window.clearTimeout(t1)
            window.clearTimeout(t2)
        }
    }, [canAnimate, stagger])

    // ── 글꼴·글자 크기 ──
    const fontCss: CSSProperties = font || {}
    const axisCss: CSSProperties = axisFont || {}
    const fs = fontSizeOf(font, 15)
    const afs = fontSizeOf(axisFont, 11)

    // ── 월·요일 이름과 숫자·날짜 형식 (Locale 값 기준, 잘못된 값이면 영어로) ──
    const fmt = useMemo(() => {
        let months = EN_MONTHS
        let days = EN_DAYS
        let num = (n: number) => String(Math.round(n * 100) / 100)
        let date = (day: number) => {
            const d = new Date(day * DAY_MS)
            return `${EN_DAYS[d.getUTCDay()]}, ${EN_MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
        }
        try {
            const loc = (locale || "").trim() || "en-US"
            const mf = new Intl.DateTimeFormat(loc, { month: "short", timeZone: "UTC" })
            const wf = new Intl.DateTimeFormat(loc, { weekday: "short", timeZone: "UTC" })
            const df = new Intl.DateTimeFormat(loc, { weekday: "short", year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
            const nf = new Intl.NumberFormat(loc, { maximumFractionDigits: 2 })
            months = EN_MONTHS.map((_, i) => mf.format(new Date(Date.UTC(2024, i, 1))))
            // 2024-01-07 은 일요일
            days = EN_DAYS.map((_, i) => wf.format(new Date(Date.UTC(2024, 0, 7 + i))))
            num = (n: number) => nf.format(n)
            date = (day: number) => df.format(new Date(day * DAY_MS))
        } catch (e) {
            // 지원하지 않는 Locale → 위의 영어 기본값 유지
        }
        return { months, days, num, date }
    }, [locale])

    // ── 데이터 읽기 (비어 있으면 데모) ──
    const parsed = useMemo(() => parseData(data), [data])
    const isDemo = parsed.map.size === 0

    // ── 기간·통계·단계 계산 ──
    const ws = weekStart === "mon" ? 1 : 0
    const model = useMemo(() => {
        const nowDay = todayDay ?? parsed.last ?? FALLBACK_DAY
        let start: number
        let end: number
        if (range === "year") {
            const y = clamp(Math.round(year) || 2026, 1970, 2200)
            start = dayNum(y, 1, 1)
            end = dayNum(y, 12, 31)
        } else {
            end = endsOn === "last" && parsed.last !== null ? parsed.last : nowDay
            const n = clamp(Math.round(weeks) || 52, 4, 53)
            start = startOfWeek(end, ws) - (n - 1) * 7
        }
        const first = startOfWeek(start, ws)
        const cols = Math.floor((end - first) / 7) + 1
        // 통계·색은 "오늘까지"만 센다 (연도 보기에서 아직 오지 않은 날은 빈 칸)
        const refEnd = range === "year" ? Math.min(end, nowDay) : end

        const valueOf = (day: number): number => {
            if (day < start || day > refEnd) return 0
            if (!isDemo) return parsed.map.get(day) || 0
            // 데모는 최근 5일을 항상 채워 "현재 연속"이 0으로 보이지 않게 한다
            const v = demoValue(day)
            return v > 0 || refEnd - day >= 5 ? v : 1 + Math.floor(hash01(day * 17 + 3) * 4)
        }

        // 통계: 합계 · 활동 일수 · 최장 연속 · 현재 연속
        let total = 0
        let activeDays = 0
        let longest = 0
        let run = 0
        const positives: number[] = []
        for (let d = start; d <= refEnd; d++) {
            const v = valueOf(d)
            if (v > 0) {
                total += v
                activeDays++
                run++
                if (run > longest) longest = run
                positives.push(v)
            } else {
                run = 0
            }
        }
        // 현재 연속: 마지막 날에 기록이 없으면 그 전날부터 센다 (오늘 아직 안 했어도 끊기지 않게)
        let current = 0
        let d = refEnd
        if (valueOf(d) <= 0) d--
        while (d >= start && valueOf(d) > 0) {
            current++
            d--
        }

        // 색 단계 기준
        positives.sort((a, b) => a - b)
        const len = positives.length
        const top = maxValue > 0 ? maxValue : len ? positives[len - 1] : 0
        const cuts: number[] = []
        if (len) {
            for (let i = 1; i < stepCount; i++) cuts.push(positives[Math.min(len - 1, Math.ceil((i * len) / stepCount) - 1)])
        }
        const flat = len > 0 && positives[0] === positives[len - 1]
        const levelOf = (v: number): number => {
            if (!(v > 0)) return 0
            if (scale === "quantile") {
                if (flat) return stepCount
                let l = 1
                for (let i = 0; i < cuts.length; i++) if (v > cuts[i]) l++
                return l
            }
            if (!(top > 0)) return stepCount
            return clamp(Math.ceil((v / top) * stepCount), 1, stepCount)
        }

        return { start, end, first, cols, refEnd, valueOf, levelOf, total, activeDays, longest, current }
    }, [todayDay, parsed, isDemo, range, year, weeks, endsOn, ws, scale, maxValue, stepCount])

    // ── 배치 계산: 받은 너비에 칸 크기를 맞추고, 최소 칸 크기보다 작아지면 오래된 주부터 줄인다 ──
    const g = Math.max(0, gap)
    const showAllDays = weekdayLabels === "all"
    const dayRows: number[] = []
    if (weekdayLabels !== "none") {
        for (let r = 0; r < 7; r++) {
            const d = (ws + r) % 7
            if (showAllDays || d === 1 || d === 3 || d === 5) dayRows.push(r)
        }
    }
    const dayChars = dayRows.reduce((mx, r) => Math.max(mx, fmt.days[(ws + r) % 7].length), 0)
    const lw = dayRows.length ? Math.ceil(dayChars * afs * 0.62) + 8 : 0
    const avail = Math.max(40, width - lw)
    let c: number
    if (sizing === "fixed") {
        c = clamp(Math.round(cellSize) || 12, 2, 60)
    } else {
        const lo = clamp(Math.round(minCell) || 8, 2, 40)
        const hi = Math.max(lo, Math.round(maxCell) || 16)
        c = clamp(Math.floor((avail - g * (model.cols - 1)) / model.cols), lo, hi)
    }
    const nVis = clamp(Math.floor((avail + g) / (c + g)), 1, model.cols)
    const colOffset = model.cols - nVis
    const pitch = c + g
    const gw = nVis * c + (nVis - 1) * g
    const monthH = showMonths ? Math.ceil(afs * 1.3) + 6 : 0
    const gridH = 7 * c + 6 * g
    const svgW = lw + gw
    const svgH = monthH + gridH
    const rx = Math.min(Math.max(0, cellRadius), c / 2)
    const visStart = Math.max(model.start, model.first + colOffset * 7)

    // ── 칸 목록 ──
    const cells: Cell[] = []
    for (let j = 0; j < nVis; j++) {
        for (let r = 0; r < 7; r++) {
            const day = model.first + (colOffset + j) * 7 + r
            if (day < model.start || day > model.end) continue
            const value = model.valueOf(day)
            cells.push({ day, col: j, row: r, value, level: model.levelOf(value) })
        }
    }

    // ── 월 라벨: 그 열의 첫 칸이 새 달이면 표시, 서로 겹치면 생략 ──
    const monthLabels: MonthLabel[] = []
    if (showMonths) {
        let prevMonth = -1
        for (let j = 0; j < nVis; j++) {
            const firstDay = Math.max(model.first + (colOffset + j) * 7, model.start)
            const mo = monthOf(firstDay)
            if (mo === prevMonth) continue
            prevMonth = mo
            const text = fmt.months[mo]
            const w = Math.ceil(text.length * afs * 0.62) + 6
            const x = j * pitch
            if (x + w > gw + 6) continue
            const last = monthLabels[monthLabels.length - 1]
            if (last && last.x + last.w > x) {
                // 첫 열의 잘린 달 라벨은 다음 달 라벨에 자리를 내준다
                if (last.first) monthLabels.pop()
                else continue
            }
            monthLabels.push({ x, w, text, first: j === 0 })
        }
    }

    // 요일 라벨이 서로 겹칠 만큼 칸이 작으면 "All" 이어도 월·수·금만 표시
    const shownDayRows = showAllDays && pitch < afs * 0.95 ? dayRows.filter((r) => [1, 3, 5].indexOf((ws + r) % 7) >= 0) : dayRows

    // ── 마우스·터치: 좌표로 칸을 찾는다 (칸마다 이벤트를 달지 않음) ──
    const pick = (day: number | null) => {
        if (day !== active) startTransition(() => setActive(day))
    }
    const onPointer = (e: PointerEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        if (rect.width <= 0) return
        const k = svgW / rect.width
        const x = (e.clientX - rect.left) * k - lw
        const y = (e.clientY - rect.top) * k - monthH
        const j = Math.floor(x / pitch)
        const r = Math.floor(y / pitch)
        if (x < 0 || y < 0 || j < 0 || j >= nVis || r < 0 || r > 6) return pick(null)
        const day = model.first + (colOffset + j) * 7 + r
        pick(day < model.start || day > model.end ? null : day)
    }

    // ── 키보드: 히트맵에 초점을 두고 방향키로 날짜 이동 (←→ 한 주, ↑↓ 하루) ──
    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        const move: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }
        if (e.key === "Escape") return pick(null)
        const step = move[e.key]
        if (step === undefined) return
        e.preventDefault()
        const from = active === null ? clamp(model.refEnd, visStart, model.end) - step : active
        pick(clamp(from + step, visStart, model.end))
    }

    // ── 툴팁 내용·위치 ──
    const unitFor = (v: number) => {
        const one = (unit || "").trim()
        const many = (unitPlural || "").trim() || one
        return v === 1 ? one || many : many
    }
    const describe = (day: number) => {
        const v = model.valueOf(day)
        return { head: `${fmt.num(v)} ${unitFor(v)}`.trim(), date: fmt.date(day) }
    }
    let tip: { head: string; date: string; x: number; y: number; right: boolean; col: number; row: number } | null = null
    if (active !== null && active >= visStart && active <= model.end) {
        const idx = active - model.first
        const col = Math.floor(idx / 7) - colOffset
        const row = idx % 7
        const cx = lw + col * pitch + c / 2
        const info = describe(active)
        tip = { head: info.head, date: info.date, x: cx, y: monthH + row * pitch, right: cx > svgW / 2, col, row }
    }

    // ── 통계 줄: 라벨을 비우면 그 항목은 숨김 ──
    const stats = [
        { label: totalLabel, value: fmt.num(model.total) },
        { label: activeLabel, value: fmt.num(model.activeDays) },
        { label: longestLabel, value: fmt.num(model.longest) },
        { label: currentLabel, value: fmt.num(model.current) },
    ].filter((s) => s.label && s.label.trim())

    const summary = `${(title || "").trim() || "Activity heatmap"}: ${fmt.num(model.total)} ${unitFor(model.total)} on ${fmt.num(model.activeDays)} days. Use the arrow keys to inspect days.`
    const legendCell = clamp(c, 8, 14)
    const legendRx = Math.min(rx, legendCell / 2)
    const hasTitle = !!(title && title.trim())

    // ── 스타일 ──
    const outerStyle: CSSProperties = {
        ...style,
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        padding,
        background: theme.background,
        borderRadius: radius,
        color: theme.text,
    }
    const srOnly: CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)", whiteSpace: "nowrap" }

    return (
        <div style={{ ...outerStyle, "--bu-ah-focus": theme.text } as CSSProperties}>
            {/* 키보드로 이동할 때만 보이는 초점 테두리 */}
            <style>{".bu-ah-grid:focus-visible{outline:2px solid var(--bu-ah-focus);outline-offset:4px;border-radius:4px}.bu-ah-grid:focus:not(:focus-visible){outline:none}"}</style>
            {/* 너비 측정용 영역 (부모가 준 너비 그대로) */}
            <div ref={areaRef} style={{ width: "100%", minWidth: 0 }}>
                {/* 실제 내용 묶음: 히트맵 너비에 맞춰 통계·범례가 같이 정렬됨 */}
                <div style={{ width: svgW, maxWidth: "100%", margin: align === "center" ? "0 auto" : 0 }}>
                    {/* 제목 */}
                    {hasTitle && <div style={{ ...fontCss, fontSize: fs, color: theme.text, margin: "0 0 12px" }}>{title}</div>}

                    {/* 통계 줄: 합계 · 활동 일수 · 최장 연속 · 현재 연속 */}
                    {showStats && stats.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 28px", margin: "0 0 18px" }}>
                            {stats.map((s, i) => (
                                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                    <span style={{ ...fontCss, fontSize: Math.round(fs * 1.7), lineHeight: "1.1em", color: theme.text, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                                    <span style={{ ...axisCss, fontSize: afs, color: theme.muted }}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 히트맵 */}
                    <div
                        className="bu-ah-grid"
                        tabIndex={0}
                        role="group"
                        aria-label={summary}
                        onKeyDown={onKey}
                        onBlur={() => pick(null)}
                        style={{ position: "relative", lineHeight: 0 }}
                    >
                        <svg
                            width={svgW}
                            height={svgH}
                            viewBox={`0 0 ${svgW} ${svgH}`}
                            role="img"
                            aria-hidden="true"
                            onPointerMove={onPointer}
                            onPointerDown={onPointer}
                            onPointerLeave={() => pick(null)}
                            style={{ display: "block", maxWidth: "100%", height: "auto", overflow: "visible", touchAction: "pan-y" }}
                        >
                            {/* 월 라벨 */}
                            {monthLabels.map((m, i) => (
                                <text key={"m" + i} x={lw + m.x} y={monthH - 7} fill={theme.muted} style={{ ...axisCss, fontSize: afs }}>
                                    {m.text}
                                </text>
                            ))}
                            {/* 요일 라벨 */}
                            {shownDayRows.map((r) => (
                                <text key={"d" + r} x={0} y={monthH + r * pitch + c / 2} dominantBaseline="central" fill={theme.muted} style={{ ...axisCss, fontSize: afs }}>
                                    {fmt.days[(ws + r) % 7]}
                                </text>
                            ))}
                            {/* 칸: 등장할 때 왼쪽 열부터 순서대로 한 번 차오름 */}
                            {cells.map((cell) => {
                                const anim: CSSProperties =
                                    phase === "done"
                                        ? {}
                                        : {
                                              transformBox: "fill-box",
                                              transformOrigin: "50% 50%",
                                              opacity: phase === "hidden" ? 0 : 1,
                                              transform: phase === "hidden" ? "scale(0.4)" : "scale(1)",
                                              transition:
                                                  phase === "playing"
                                                      ? `opacity 0.35s ease ${Math.round((cell.col + cell.row * 0.35) * stagger)}ms, transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) ${Math.round((cell.col + cell.row * 0.35) * stagger)}ms`
                                                      : "none",
                                          }
                                return (
                                    <rect
                                        key={cell.day}
                                        x={lw + cell.col * pitch}
                                        y={monthH + cell.row * pitch}
                                        width={c}
                                        height={c}
                                        rx={rx}
                                        ry={rx}
                                        fill={cell.level > 0 ? palette[cell.level - 1] : theme.empty}
                                        style={anim}
                                    />
                                )
                            })}
                            {/* 선택된 칸 테두리 */}
                            {tip && (
                                <rect
                                    x={lw + tip.col * pitch - 1}
                                    y={monthH + tip.row * pitch - 1}
                                    width={c + 2}
                                    height={c + 2}
                                    rx={Math.min(rx + 1, (c + 2) / 2)}
                                    ry={Math.min(rx + 1, (c + 2) / 2)}
                                    fill="none"
                                    stroke={theme.text}
                                    strokeWidth={1.5}
                                    pointerEvents="none"
                                />
                            )}
                        </svg>

                        {/* 툴팁: 칸 위에 표시, 오른쪽 절반에서는 왼쪽으로 펼침 */}
                        {showTooltip && tip && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: tip.right ? "auto" : Math.max(0, tip.x - 14),
                                    right: tip.right ? Math.max(0, svgW - tip.x - 14) : "auto",
                                    top: tip.y - 8,
                                    transform: "translateY(-100%)",
                                    background: theme.tooltipBg,
                                    color: theme.tooltipText,
                                    borderRadius: 8,
                                    padding: "7px 10px",
                                    pointerEvents: "none",
                                    whiteSpace: "nowrap",
                                    zIndex: 2,
                                    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                }}
                            >
                                <span style={{ ...fontCss, fontSize: Math.max(12, Math.round(fs * 0.87)), lineHeight: "1.3em", color: theme.tooltipText }}>{tip.head}</span>
                                <span style={{ ...axisCss, fontSize: afs, lineHeight: "1.3em", color: theme.tooltipText, opacity: 0.72 }}>{tip.date}</span>
                            </div>
                        )}
                        {/* 화면 낭독기용: 방향키로 고른 날짜를 읽어 줌 */}
                        <span aria-live="polite" style={srOnly}>
                            {tip ? `${tip.date}: ${tip.head}` : ""}
                        </span>
                    </div>

                    {/* 범례: 적음 → 많음 */}
                    {showLegend && (
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: 6, margin: "14px 0 0", ...axisCss, fontSize: afs, color: theme.muted }}>
                            {lessLabel && lessLabel.trim() ? <span>{lessLabel}</span> : null}
                            <span style={{ display: "inline-flex", gap: Math.min(g, 4) || 2 }} aria-hidden="true">
                                <span style={{ width: legendCell, height: legendCell, borderRadius: legendRx, background: theme.empty, display: "block" }} />
                                {palette.map((col, i) => (
                                    <span key={i} style={{ width: legendCell, height: legendCell, borderRadius: legendRx, background: col, display: "block" }} />
                                ))}
                            </span>
                            {moreLabel && moreLabel.trim() ? <span>{moreLabel}</span> : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

ActivityHeatmap.displayName = "Activity Heatmap"

// ─────────────────────────────────────────────
// 속성 컨트롤 (중요도순)
// ─────────────────────────────────────────────
addPropertyControls(ActivityHeatmap, {
    data: {
        type: ControlType.String,
        title: "Data",
        defaultValue: "",
        placeholder: "2026-03-14, 5\n2026-03-15, 2",
        displayTextArea: true,
        description: "One day per line: date, value. A date alone counts as 1. Leave empty to show demo data.",
    },
    title: { type: ControlType.String, title: "Title", defaultValue: "Workout log", placeholder: "Optional" },
    unit: { type: ControlType.String, title: "Unit", defaultValue: "workout", description: "Shown in the tooltip, e.g. 1 workout." },
    unitPlural: { type: ControlType.String, title: "Unit Plural", defaultValue: "workouts" },
    range: {
        type: ControlType.Enum,
        title: "Range",
        options: ["weeks", "year"],
        optionTitles: ["Last Weeks", "Year"],
        defaultValue: "weeks",
        displaySegmentedControl: true,
    },
    weeks: {
        type: ControlType.Number,
        title: "Weeks",
        defaultValue: 52,
        min: 4,
        max: 53,
        step: 1,
        displayStepper: true,
        hidden: (p: ActivityHeatmapProps) => p.range === "year",
    },
    endsOn: {
        type: ControlType.Enum,
        title: "Ends On",
        options: ["today", "last"],
        optionTitles: ["Today", "Last Entry"],
        defaultValue: "today",
        displaySegmentedControl: true,
        hidden: (p: ActivityHeatmapProps) => p.range === "year",
    },
    year: {
        type: ControlType.Number,
        title: "Year",
        defaultValue: 2026,
        min: 1970,
        max: 2200,
        step: 1,
        displayStepper: true,
        hidden: (p: ActivityHeatmapProps) => p.range !== "year",
    },
    weekStart: {
        type: ControlType.Enum,
        title: "Week Starts",
        options: ["sun", "mon"],
        optionTitles: ["Sunday", "Monday"],
        defaultValue: "sun",
        displaySegmentedControl: true,
    },
    theme: {
        type: ControlType.Enum,
        title: "Color",
        options: ["mint", "green", "blue", "purple", "orange", "pink", "mono", "custom"],
        optionTitles: ["Mint", "Green", "Blue", "Purple", "Orange", "Pink", "Mono", "Custom"],
        defaultValue: "mint",
    },
    accent: {
        type: ControlType.Color,
        title: "Custom Color",
        defaultValue: "#2DE5A0",
        hidden: (p: ActivityHeatmapProps) => p.theme !== "custom",
    },
    steps: {
        type: ControlType.Number,
        title: "Color Steps",
        defaultValue: 4,
        min: 2,
        max: 6,
        step: 1,
        displayStepper: true,
        description: "Shades are built from the one color.",
    },
    scale: {
        type: ControlType.Enum,
        title: "Scale",
        options: ["even", "quantile"],
        optionTitles: ["Even", "Quantile"],
        defaultValue: "even",
        displaySegmentedControl: true,
        description: "Quantile spreads the shades evenly when a few days are much higher than the rest.",
    },
    maxValue: {
        type: ControlType.Number,
        title: "Max Value",
        defaultValue: 0,
        min: 0,
        max: 1000000,
        step: 1,
        description: "Value that gets the darkest shade. 0 = highest value in range.",
        hidden: (p: ActivityHeatmapProps) => p.scale === "quantile",
    },
    appearance: {
        type: ControlType.Enum,
        title: "Appearance",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    sizing: {
        type: ControlType.Enum,
        title: "Cell Size",
        options: ["fit", "fixed"],
        optionTitles: ["Fit Width", "Fixed"],
        defaultValue: "fit",
        displaySegmentedControl: true,
        description: "If the weeks do not fit, the oldest weeks are left out.",
    },
    maxCell: {
        type: ControlType.Number,
        title: "Max Cell",
        defaultValue: 16,
        min: 4,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (p: ActivityHeatmapProps) => p.sizing === "fixed",
    },
    minCell: {
        type: ControlType.Number,
        title: "Min Cell",
        defaultValue: 8,
        min: 2,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (p: ActivityHeatmapProps) => p.sizing === "fixed",
    },
    cellSize: {
        type: ControlType.Number,
        title: "Cell",
        defaultValue: 12,
        min: 2,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (p: ActivityHeatmapProps) => p.sizing !== "fixed",
    },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 3, min: 0, max: 12, step: 1, unit: "px" },
    cellRadius: { type: ControlType.Number, title: "Cell Radius", defaultValue: 3, min: 0, max: 30, step: 1, unit: "px" },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    showMonths: { type: ControlType.Boolean, title: "Months", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    weekdayLabels: {
        type: ControlType.Enum,
        title: "Weekdays",
        options: ["none", "mwf", "all"],
        optionTitles: ["None", "Mon Wed Fri", "All"],
        defaultValue: "mwf",
    },
    locale: {
        type: ControlType.String,
        title: "Locale",
        defaultValue: "en-US",
        placeholder: "en-US, de-DE, ja-JP…",
        description: "Language for month names, weekdays, dates and numbers.",
    },
    showStats: { type: ControlType.Boolean, title: "Stats", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    totalLabel: { type: ControlType.String, title: "Total", defaultValue: "Total", description: "Clear a label to hide that stat.", hidden: (p: ActivityHeatmapProps) => !p.showStats },
    activeLabel: { type: ControlType.String, title: "Active", defaultValue: "Active days", hidden: (p: ActivityHeatmapProps) => !p.showStats },
    longestLabel: { type: ControlType.String, title: "Longest", defaultValue: "Longest streak", hidden: (p: ActivityHeatmapProps) => !p.showStats },
    currentLabel: { type: ControlType.String, title: "Current", defaultValue: "Current streak", hidden: (p: ActivityHeatmapProps) => !p.showStats },
    showLegend: { type: ControlType.Boolean, title: "Legend", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    lessLabel: { type: ControlType.String, title: "Less", defaultValue: "Less", hidden: (p: ActivityHeatmapProps) => !p.showLegend },
    moreLabel: { type: ControlType.String, title: "More", defaultValue: "More", hidden: (p: ActivityHeatmapProps) => !p.showLegend },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    customColors: { type: ControlType.Boolean, title: "Colors", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Preset" },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        icon: "color",
        hidden: (p: ActivityHeatmapProps) => !p.customColors,
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            muted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#6B6B76" },
            empty: { type: ControlType.Color, title: "Empty Cell", defaultValue: "rgba(17, 17, 20, 0.07)" },
            tooltipBg: { type: ControlType.Color, title: "Tooltip BG", defaultValue: "#111114" },
            tooltipText: { type: ControlType.Color, title: "Tooltip Text", defaultValue: "#FFFFFF" },
        },
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate In",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Cells fill in once, column by column, when the heatmap scrolls into view.",
    },
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 16, min: 0, max: 60, step: 1, unit: "ms", hidden: (p: ActivityHeatmapProps) => !p.animate },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 48, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 24, min: 0, max: 64, step: 1, unit: "px" },
    font: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Semibold", lineHeight: "1.3em" },
    },
    axisFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "11px", variant: "Medium", lineHeight: "1.3em" },
        description: "Created by BrandingUp",
    },
})
