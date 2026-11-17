// [생성일] 2026-11-16
// [경위] 달러벌기 38번 상품(무료): 줄마다 "이름, 실제, 목표"를 넣으면 목표선·구간 띠·상태 색으로 보여 주는 불릿 차트(KPI 목표 대비 진행). 줄별 '낮을수록 좋음' · 요약 · 툴팁
// [변경이력]
//   - 2026-11-16: 최초 생성 (줄 목록 입력 · 빈 데이터면 데모 · 목표 대비 % · 상태 3단계(On track/Close/Behind) · 줄 끝 lower 로 낮을수록 좋음 · 구간 띠(목표의 % 경계) · 축 줄마다/공통 · 정렬 · 요약 · 숫자 서식 · 색 테마 7종+직접 색 · 호버·방향키 · 등장 1회(CSS 전환, 프레임 루프 없음) · 정적·캔버스 완성 상태 · 좁으면 이름을 위로)

import { useEffect, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties, KeyboardEvent } from "react"
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
interface Colors {
    background?: string
    text?: string
    muted?: string
    band?: string
    good?: string
    close?: string
    behind?: string
    marker?: string
    tooltipBg?: string
    tooltipText?: string
}

// 입력 한 줄 = 항목 하나
interface Item {
    name: string
    actual: number
    target: number
    max: number | null // 줄에 네 번째 숫자를 쓰면 그 줄의 축 끝
    lower: boolean | null // 줄 끝 "lower"/"higher" 로 지정한 방향 (없으면 전체 설정)
}

// 계산이 끝난 항목
interface Row extends Item {
    index: number
    lowerBetter: boolean
    ratio: number | null // 실제 ÷ 목표 (목표 0 이면 null)
    status: 1 | 0 | -1 // 1 = On track, 0 = Close, −1 = Behind
}

type ThemeName = "mint" | "green" | "blue" | "purple" | "orange" | "pink" | "mono" | "custom"

const MAX_LINES = 200
const MAX_ROWS = 20

// 색 테마별 대표색 (On track 색으로 쓴다)
const ACCENTS: Record<string, string> = {
    mint: "#2DE5A0",
    green: "#2DA44E",
    blue: "#3B82F6",
    purple: "#8B5CF6",
    orange: "#F97316",
    pink: "#EC4899",
}

// 데이터가 비었을 때 보여 주는 데모: 분기 목표 (마지막 줄은 낮을수록 좋음)
const DEMO: Item[] = [
    { name: "New customers", actual: 1240, target: 1500, max: null, lower: null },
    { name: "Trials started", actual: 4800, target: 4000, max: null, lower: null },
    { name: "Demos booked", actual: 86, target: 120, max: null, lower: null },
    { name: "Referrals", actual: 288, target: 300, max: null, lower: null },
    { name: "Churned accounts", actual: 18, target: 25, max: null, lower: true },
]

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
        if (h.length >= 6 && /^[0-9a-f]+$/i.test(h)) {
            const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a]
        }
    }
    return null
}

// 색에 투명도를 곱한다
function withAlpha(c: string, a: number): string {
    const p = parseColor(c)
    if (!p) return c
    return `rgba(${Math.round(p[0])}, ${Math.round(p[1])}, ${Math.round(p[2])}, ${Math.round(p[3] * a * 1000) / 1000})`
}

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
}

function fontSizeOf(ctl: CSSProperties | undefined, fallback: number): number {
    const n = parseFloat(String(ctl && ctl.fontSize))
    return isFinite(n) && n > 0 ? n : fallback
}

// 글자 폭 어림값(글자 크기 1 기준). 한글·한자·가나는 영문보다 넓게 센다
function textUnits(s: string): number {
    let u = 0
    for (let i = 0; i < s.length; i++) u += s.charCodeAt(i) > 0x2e80 ? 1 : 0.58
    return u
}

// 숫자 한 칸 읽기: 통화 기호·% ·공백은 무시, 12.4k / 1.2M 줄임 표기 허용. 음수는 0 으로. 숫자가 아니면 null
function parseNumber(raw: string, allowComma: boolean): number | null {
    let t = raw.replace(/[\s$€£¥₩%_]/g, "").replace(/[−–]/g, "-")
    if (allowComma) t = t.replace(/,/g, "")
    const m = t.match(/^([+-]?\d+(?:\.\d+)?|[+-]?\.\d+)([kKmMbB])?$/)
    if (!m) return null
    let n = parseFloat(m[1])
    const u = (m[2] || "").toLowerCase()
    if (u === "k") n *= 1e3
    else if (u === "m") n *= 1e6
    else if (u === "b") n *= 1e9
    return isFinite(n) ? Math.max(0, n) : null
}

// 입력 글자를 항목 목록으로 바꾼다.
// 한 줄 = "New customers, 1240, 1500" (이름, 실제, 목표). 네 번째 숫자 = 그 줄의 축 끝(선택).
// 줄 끝에 "lower"(또는 less, ↓) 를 쓰면 낮을수록 좋은 지표, "higher"(↑) 면 높을수록 좋은 지표.
// 구분: 쉼표, 또는 스프레드시트 붙여넣기의 탭(세미콜론·| 도 가능). 숫자가 두 개 미만인 줄(머리글 등)은 건너뛴다.
function parseData(text: string): Item[] {
    const out: Item[] = []
    if (typeof text !== "string" || !text.trim()) return out
    const lines = text.split(/\r?\n/).slice(0, MAX_LINES)
    for (let i = 0; i < lines.length && out.length < MAX_ROWS; i++) {
        const line = lines[i].trim()
        if (!line) continue
        const strong = /[\t;|]/.test(line)
        let cells = (strong ? line.split(/[\t;|]/) : line.split(",")).map((c) => c.trim())
        // 줄 끝의 빈 칸(쉼표·탭이 남은 경우)은 버린다
        while (cells.length > 1 && cells[cells.length - 1] === "") cells.pop()
        let joiner = ", "
        if (cells.length < 3) {
            cells = line.split(/[\s,\t;|]+/).filter(Boolean)
            joiner = " "
        }
        // 줄 끝 방향 단어
        let lower: boolean | null = null
        const last = (cells[cells.length - 1] || "").toLowerCase()
        if (/^(lower|less|down|↓)$/.test(last)) {
            lower = true
            cells = cells.slice(0, -1)
        } else if (/^(higher|more|up|↑)$/.test(last)) {
            lower = false
            cells = cells.slice(0, -1)
        }
        // 뒤에서부터 숫자를 최대 3개(실제·목표·축 끝) 읽는다. 첫 칸은 이름으로 남긴다
        const nums: number[] = []
        let end = cells.length
        while (end > 1 && nums.length < 3) {
            const n = parseNumber(cells[end - 1], strong)
            if (n === null) break
            nums.unshift(n)
            end--
        }
        if (nums.length < 2) continue
        const name = cells.slice(0, end).join(joiner).trim() || `Item ${out.length + 1}`
        out.push({ name, actual: nums[0], target: nums[1], max: nums.length > 2 ? nums[2] : null, lower })
    }
    return out
}

// 축 끝을 보기 좋은 값으로 올림 (1·1.2·1.5·2·2.5·3·4·5·6·8·10 × 10^n)
function niceCeil(v: number): number {
    if (!(v > 0) || !isFinite(v)) return 1
    const p = Math.pow(10, Math.floor(Math.log10(v)))
    const f = v / p
    const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
    for (const s of steps) if (f <= s + 1e-9) return s * p
    return 10 * p
}

// 로케일 숫자 서식: 소수는 최대 d 자리, 끝의 0 은 지운다
function makeFormatter(locale: string, decimals: number, fixed: boolean): (n: number) => string {
    const d = clamp(Math.round(decimals) || 0, 0, 6)
    const opt = { minimumFractionDigits: fixed ? d : 0, maximumFractionDigits: d }
    try {
        const nf = new Intl.NumberFormat((locale || "").trim() || "en-US", opt)
        return (n: number) => nf.format(n)
    } catch (e) {
        const nf = new Intl.NumberFormat("en-US", opt)
        return (n: number) => nf.format(n)
    }
}

// "60, 90" → [0.6, 0.9] (목표 대비 구간 경계, 0~300% 사이, 오름차순)
function parseBands(s: string): number[] {
    if (typeof s !== "string") return []
    return s
        .split(/[,\s;]+/)
        .map((x) => parseFloat(x))
        .filter((x) => isFinite(x) && x > 0 && x < 300)
        .map((x) => x / 100)
        .sort((a, b) => a - b)
        .slice(0, 4)
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface BulletChartProps {
    data?: string
    title?: string
    subtitle?: string
    note?: string
    better?: "higher" | "lower"
    closeAt?: number
    colorBy?: "status" | "single"
    bands?: string
    showBands?: boolean
    scale?: "row" | "shared"
    sort?: "input" | "progress"
    showValues?: boolean
    percent?: "show" | "hide"
    showSummary?: boolean
    onTrackWord?: string
    closeWord?: string
    behindWord?: string
    targetWord?: string
    summaryWord?: string
    showLegend?: boolean
    showTooltip?: boolean
    theme?: ThemeName
    accent?: string
    appearance?: "light" | "dark"
    prefix?: string
    suffix?: string
    decimals?: number
    percentDecimals?: number
    locale?: string
    rowHeight?: number
    barSize?: number
    barRadius?: number
    textScale?: number
    customColors?: boolean
    colors?: Colors
    animate?: boolean
    duration?: number
    radius?: number
    padding?: number
    font?: CSSProperties
    labelFont?: CSSProperties
    style?: CSSProperties
}

/**
 * Bullet Chart — 줄마다 이름·실제·목표를 넣으면 목표선·구간 띠·상태 색으로 목표 대비 진행을 보여 주는 불릿 차트.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function BulletChart(props: BulletChartProps) {
    const {
        data = "",
        title = "Q4 goals",
        subtitle = "",
        note = "",
        better = "higher",
        closeAt = 90,
        colorBy = "status",
        bands = "60, 90",
        showBands = true,
        scale = "row",
        sort = "input",
        showValues = true,
        percent = "show",
        showSummary = true,
        onTrackWord = "On track",
        closeWord = "Close",
        behindWord = "Behind",
        targetWord = "Target",
        summaryWord = "on track",
        showLegend = true,
        showTooltip = true,
        theme: themeName = "mint",
        accent = "#2DE5A0",
        appearance = "light",
        prefix = "",
        suffix = "",
        decimals = 1,
        percentDecimals = 0,
        locale = "en-US",
        rowHeight = 56,
        barSize = 12,
        barRadius = 6,
        textScale = 1,
        customColors = false,
        colors: colorProps,
        animate = true,
        duration = 900,
        radius = 16,
        padding = 24,
        font,
        labelFont,
        style,
    } = props

    const areaRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(720 - 24 * 2)
    const [active, setActive] = useState<number | null>(null)

    // ── 색 기본값: Appearance 에 따르고, Custom Colors 를 켰을 때만 입력값 사용 ──
    const cs = customColors ? colorProps : undefined
    const dark = appearance === "dark"
    const base = themeName === "custom" ? accent : themeName === "mono" ? (dark ? "#F4F4F6" : "#111114") : ACCENTS[themeName] || ACCENTS.mint
    const theme = {
        background: cs?.background ?? (dark ? "#101114" : "rgba(255, 255, 255, 0)"),
        text: cs?.text ?? (dark ? "#F4F4F6" : "#111114"),
        muted: cs?.muted ?? (dark ? "#9A9AA6" : "#6B6B76"),
        band: cs?.band ?? (dark ? "#FFFFFF" : "#111114"),
        good: cs?.good ?? base,
        close: cs?.close ?? (dark ? "#F5B942" : "#E5A100"),
        behind: cs?.behind ?? (dark ? "#FF6B6B" : "#E5484D"),
        marker: cs?.marker ?? (dark ? "#F4F4F6" : "#111114"),
        tooltipBg: cs?.tooltipBg ?? (dark ? "#F4F4F6" : "#111114"),
        tooltipText: cs?.tooltipText ?? (dark ? "#111114" : "#FFFFFF"),
    }

    // ── 데이터 읽기 (비어 있으면 데모) → 목표 대비 비율·상태 → 정렬 ──
    const closeRatio = clamp(Number(closeAt) || 90, 1, 99) / 100
    const rows = useMemo(() => {
        const parsed = parseData(data)
        const items = parsed.length ? parsed : DEMO
        const list: Row[] = items.map((it, i) => {
            const lowerBetter = it.lower !== null ? it.lower : better === "lower"
            const ratio = it.target > 0 ? it.actual / it.target : null
            let status: 1 | 0 | -1 = -1
            if (ratio === null) status = it.actual === 0 ? 1 : lowerBetter ? -1 : 1
            else if (!lowerBetter) status = ratio >= 1 ? 1 : ratio >= closeRatio ? 0 : -1
            else status = ratio <= 1 ? 1 : ratio <= 1 + (1 - closeRatio) ? 0 : -1
            return { ...it, index: i, lowerBetter, ratio, status }
        })
        if (sort === "progress") {
            // 목표에 가까울수록(좋은 쪽으로) 위 — 낮을수록 좋은 줄은 비율을 뒤집어 비교
            const score = (r: Row) => (r.ratio === null ? 0 : r.lowerBetter ? (r.ratio > 0 ? 1 / r.ratio : 1e6) : r.ratio)
            list.sort((a, b) => score(b) - score(a) || a.index - b.index)
        }
        return list
    }, [data, better, sort, closeRatio])
    const n = rows.length

    // ── 부모(컨테이너) 너비 측정 ──
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

    // ── 등장 애니메이션 (한 번만, 화면에 보일 때 시작) ──
    // 막대는 CSS 전환으로 0 → 실제 값까지 늘어나고 목표선이 나타난다. 프레임 루프(rAF)·반복 타이머 없음.
    // 정적 렌더·캔버스·화면 밖·모션 줄이기 설정에서는 완성된 상태를 즉시 보여줌
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const canAnimate = animate && !isStatic && !isCanvas
    const dur = clamp(Math.round(duration) || 900, 200, 4000)
    const stagger = n > 1 ? Math.min(90, Math.round((dur * 0.5) / (n - 1))) : 0
    const total = dur + stagger * Math.max(0, n - 1)
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
        let started = false
        // 끝나면 "done" 으로 돌아가 이후에는 아무 애니메이션도 돌지 않음
        const finish = () => {
            io.disconnect()
            window.clearTimeout(t1)
            window.clearTimeout(t2)
            startTransition(() => setPhase("done"))
        }
        const io = new IntersectionObserver(
            (entries) => {
                const visible = !!entries[0] && entries[0].isIntersecting
                if (visible && !started) {
                    started = true
                    t1 = window.setTimeout(() => {
                        startTransition(() => setPhase("playing"))
                        t2 = window.setTimeout(finish, total + 150)
                    }, 60)
                } else if (!visible && started) {
                    // 재생 도중 화면 밖으로 나가면 바로 완성 상태로 (화면 밖에서는 아무것도 돌지 않게)
                    finish()
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
    }, [canAnimate, total])
    const hidden = phase === "hidden"
    // 등장 중에만 CSS 전환을 건다 (끝나면 "none")
    const trans = (list: string, delay: number) =>
        phase === "playing"
            ? list
                  .split(",")
                  .map((p) => `${p.trim()} ${dur}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`)
                  .join(", ")
            : "none"

    // ── 글꼴·글자 크기 ──
    const ts = clamp(Number(textScale) || 1, 0.5, 3)
    const fontCss: CSSProperties = font || {}
    const labelCss: CSSProperties = labelFont || {}
    const fs = Math.round(fontSizeOf(font, 15) * ts * 10) / 10
    const lfs = Math.round(fontSizeOf(labelFont, 13) * ts * 10) / 10

    // ── 숫자 서식 ──
    const fmt = useMemo(() => {
        const nf = makeFormatter(locale, decimals, false)
        const pf = makeFormatter(locale, percentDecimals, true)
        const value = (v: number) => (prefix || "") + nf(v) + (suffix || "")
        const pct = (r: number | null) => (r === null || !isFinite(r) ? "—" : pf(r * 100) + "%")
        return { value, pct }
    }, [locale, decimals, percentDecimals, prefix, suffix])
    const statusColor = (r: Row) => (colorBy === "single" ? theme.good : r.status > 0 ? theme.good : r.status === 0 ? theme.close : theme.behind)
    const statusWord = (r: Row) => (r.status > 0 ? onTrackWord : r.status === 0 ? closeWord : behindWord)

    // ── 축: 줄마다(목표·실제 중 큰 값의 115% 를 보기 좋게 올림) 또는 공통(전체 최댓값) ──
    const bandList = parseBands(bands)
    const rowMax = (r: Row) => (r.max !== null && r.max > 0 ? Math.max(r.max, r.actual, r.target) : niceCeil(Math.max(r.target, r.actual) * 1.15))
    const sharedMax = rows.reduce((mx, r) => Math.max(mx, rowMax(r)), 0)
    const maxOf = (r: Row) => (scale === "shared" ? sharedMax : rowMax(r))

    // ── 배치 계산 ──
    const stackName = width < 440
    const nameW = Math.round(clamp(rows.reduce((mx, r) => Math.max(mx, textUnits(r.name)), 0) * lfs + 10, 60, width * 0.3))
    const valText = (r: Row) => `${fmt.value(r.actual)} / ${fmt.value(r.target)}`
    const valW = showValues ? Math.round(clamp(rows.reduce((mx, r) => Math.max(mx, textUnits(valText(r))), 0) * lfs + 8, 50, width * 0.32)) : 0
    const pctW = percent === "show" ? Math.round(textUnits("188%") * lfs * 1.1 + 10) : 0
    const colGap = Math.round(clamp(width * 0.025, 8, 16))
    const plotX0 = stackName ? 0 : nameW + colGap
    const rightW = (valW ? valW + colGap : 0) + (pctW ? pctW + colGap : 0)
    const plotW = Math.max(60, width - plotX0 - rightW)
    const bs = clamp(Number(barSize) || 12, 3, 60) * Math.max(1, ts * 0.8)
    const br = clamp(Number(barRadius) || 0, 0, 30)
    const bandH = Math.round(bs * 2.2)
    const rh = Math.max(Math.round(clamp(Number(rowHeight) || 56, 20, 200)), bandH + 10, Math.ceil(lfs * 1.8))
    const nameRowH = stackName ? Math.ceil(lfs * 1.6) : 0

    // ── 요약 ──
    const onTrack = rows.filter((r) => r.status > 0).length

    // ── 키보드: 차트 전체가 탭 정지 1개, 방향키로 항목 이동 ──
    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        const keys = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Escape"]
        if (keys.indexOf(e.key) < 0) return
        e.preventDefault()
        if (e.key === "Escape") return setActive(null)
        let next = active === null ? 0 : active
        if (active !== null) {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (active + 1) % n
            if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (active - 1 + n) % n
        }
        if (e.key === "Home") next = 0
        if (e.key === "End") next = n - 1
        setActive(next)
    }
    const describe = (r: Row) => `${r.name}: ${fmt.value(r.actual)} of ${fmt.value(r.target)} ${targetWord.toLowerCase()} (${fmt.pct(r.ratio)}), ${statusWord(r)}`
    const ariaSummary = (title ? title + ". " : "") + rows.map(describe).join(". ") + "."

    // ── 스타일 ──
    const pad = Math.max(0, Number(padding) || 0)
    const rootStyle: CSSProperties = {
        ...style,
        position: "relative",
        boxSizing: "border-box",
        width: "100%",
        padding: pad,
        background: theme.background,
        borderRadius: radius,
        color: theme.text,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        ...fontCss,
        fontSize: fs,
        outline: "none",
    }
    const labelStyle: CSSProperties = { ...labelCss, fontSize: lfs, color: theme.muted, lineHeight: 1.35 }
    const numStyle: CSSProperties = { ...labelCss, fontSize: lfs, fontVariantNumeric: "tabular-nums", lineHeight: 1, whiteSpace: "nowrap" }

    // 툴팁 (줄 위, 첫 줄은 아래)
    const tooltip = (r: Row, x: number, y: number) => {
        if (!showTooltip) return null
        const lines = [r.name, `${fmt.value(r.actual)} / ${targetWord} ${fmt.value(r.target)}`, `${fmt.pct(r.ratio)} · ${statusWord(r)}${r.lowerBetter ? " · lower is better" : ""}`]
        const estW = lines.reduce((mx, s) => Math.max(mx, textUnits(s) * lfs), 0) + 24
        const left = clamp(x, estW / 2, Math.max(estW / 2, width - estW / 2))
        const below = y < rh * 1.5
        return (
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    left,
                    top: below ? y + bandH / 2 + 8 : y - bandH / 2 - 8,
                    transform: below ? "translateX(-50%)" : "translate(-50%, -100%)",
                    background: theme.tooltipBg,
                    color: theme.tooltipText,
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: lfs,
                    lineHeight: 1.4,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 3,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                }}
            >
                <div style={{ fontWeight: 600 }}>{lines[0]}</div>
                <div>{lines[1]}</div>
                <div style={{ color: statusColor(r), fontWeight: 600 }}>{lines[2]}</div>
            </div>
        )
    }

    // 범례 (상태 3색 + 목표선)
    const sw = (color: string) => <span style={{ width: lfs * 0.9, height: lfs * 0.5, borderRadius: 2, background: color, display: "inline-block" }} />
    const legendNode = showLegend ? (
        <div style={{ ...labelStyle, display: "flex", flexWrap: "wrap", gap: `4px ${Math.round(lfs * 1.2)}px`, marginTop: title || subtitle ? Math.round(fs * 0.6) : 0 }}>
            {colorBy === "status" ? (
                <>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {sw(theme.good)}
                        {onTrackWord}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {sw(theme.close)}
                        {closeWord}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {sw(theme.behind)}
                        {behindWord}
                    </span>
                </>
            ) : null}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 3, height: lfs, background: theme.marker, display: "inline-block", borderRadius: 1 }} />
                {targetWord}
            </span>
        </div>
    ) : null

    const blockH = n * (rh + nameRowH)

    return (
        <div className="bu-bullet" style={rootStyle} tabIndex={0} role="figure" aria-label={ariaSummary} onKeyDown={onKey} onBlur={() => setActive(null)}>
            <style>{`.bu-bullet:focus-visible{box-shadow:0 0 0 2px ${theme.good}}`}</style>
            <div ref={areaRef} style={{ width: "100%" }}>
                {title ? <div style={{ fontWeight: 650, fontSize: Math.round(fs * 1.15), lineHeight: 1.3 }}>{title}</div> : null}
                {subtitle ? <div style={{ ...labelStyle, marginTop: 4 }}>{subtitle}</div> : null}
                {legendNode}
                <div style={{ height: title || subtitle || legendNode ? Math.round(fs * 1.1) : 0 }} />

                <div style={{ position: "relative", height: blockH }} onPointerLeave={() => setActive(null)}>
                    {rows.map((r, k) => {
                        const top = k * (rh + nameRowH)
                        const cy = nameRowH + rh / 2
                        const mx = maxOf(r)
                        const x = (v: number) => (mx > 0 ? clamp(v / mx, 0, 1) * plotW : 0)
                        const xa = x(r.actual)
                        const xt = x(r.target)
                        const delay = k * stagger
                        const dim = active !== null && active !== k
                        const c = statusColor(r)
                        // 구간 띠: 목표의 % 경계마다 색 농도를 바꾼다 (좋은 쪽일수록 옅게)
                        const edges = [0, ...bandList.map((b) => x(r.target * b)), plotW]
                        const nb = edges.length - 1
                        return (
                            <div
                                key={r.index}
                                onPointerEnter={() => setActive(k)}
                                style={{ position: "absolute", left: 0, right: 0, top, height: rh + nameRowH, opacity: dim ? 0.35 : 1, transition: phase === "done" ? "opacity 160ms ease" : "none" }}
                            >
                                {/* 이름 */}
                                <div
                                    style={{
                                        ...labelCss,
                                        position: "absolute",
                                        left: 0,
                                        top: stackName ? 0 : nameRowH,
                                        width: stackName ? "100%" : nameW,
                                        height: stackName ? nameRowH : rh,
                                        display: "flex",
                                        alignItems: "center",
                                        fontSize: lfs,
                                        color: theme.text,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {r.name}
                                </div>
                                {/* 구간 띠 (바탕) */}
                                <div style={{ position: "absolute", left: plotX0, top: cy - bandH / 2, width: plotW, height: bandH, borderRadius: Math.min(br, bandH / 2), overflow: "hidden", display: "flex" }}>
                                    {edges.slice(0, -1).map((e0, b) => {
                                        const w = Math.max(0, edges[b + 1] - e0)
                                        // 높을수록 좋음: 왼쪽(낮은 값)이 진하고 오른쪽이 옅다. 낮을수록 좋음은 반대
                                        const step = r.lowerBetter ? b + 1 : nb - b
                                        const a = showBands ? (dark ? 0.04 : 0.035) + (step / nb) * (dark ? 0.1 : 0.09) : dark ? 0.08 : 0.06
                                        return <div key={b} style={{ width: w, height: "100%", background: withAlpha(theme.band, a), flexShrink: 0 }} />
                                    })}
                                </div>
                                {/* 실제 값 막대 (등장: 0 → 실제 값) */}
                                <div
                                    style={{
                                        position: "absolute",
                                        left: plotX0,
                                        top: cy - bs / 2,
                                        height: bs,
                                        width: hidden ? 0 : Math.max(xa, r.actual > 0 ? 2 : 0),
                                        borderRadius: br,
                                        background: c,
                                        transition: trans("width", delay),
                                    }}
                                />
                                {/* 목표선 */}
                                <div
                                    style={{
                                        position: "absolute",
                                        left: plotX0 + xt - 1.5,
                                        top: cy - bandH / 2 - 3,
                                        width: 3,
                                        height: bandH + 6,
                                        borderRadius: 1.5,
                                        background: theme.marker,
                                        opacity: hidden ? 0 : 1,
                                        transition: trans("opacity", delay),
                                    }}
                                />
                                {/* 실제 / 목표 값 */}
                                {valW ? (
                                    <div style={{ ...numStyle, position: "absolute", left: plotX0 + plotW + colGap, width: valW, top: cy - lfs / 2, color: theme.muted }}>
                                        <span style={{ color: theme.text, fontWeight: 600 }}>{fmt.value(r.actual)}</span> / {fmt.value(r.target)}
                                    </div>
                                ) : null}
                                {/* 목표 대비 % */}
                                {pctW ? (
                                    <div style={{ ...numStyle, position: "absolute", right: 0, width: pctW, textAlign: "right", top: cy - lfs / 2, color: c, fontWeight: 650 }}>
                                        {fmt.pct(r.ratio)}
                                    </div>
                                ) : null}
                                {active === k ? tooltip(r, plotX0 + Math.max(xa, xt) / 2 + Math.min(xa, xt) / 2, cy) : null}
                            </div>
                        )
                    })}
                </div>

                {/* 요약 + 메모 */}
                {showSummary || note ? (
                    <div style={{ ...labelStyle, marginTop: Math.round(fs * 1.1), display: "flex", flexWrap: "wrap", gap: "2px 14px" }}>
                        {showSummary ? (
                            <span>
                                <b style={{ color: theme.text }}>
                                    {onTrack} of {n}
                                </b>{" "}
                                {summaryWord}
                            </span>
                        ) : null}
                        {note ? <span>{note}</span> : null}
                    </div>
                ) : null}
                <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    {active !== null && rows[active] ? describe(rows[active]) : ""}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(BulletChart, {
    data: {
        type: ControlType.String,
        title: "Data",
        defaultValue: "",
        placeholder: "New customers, 1240, 1500\nDemos booked, 86, 120\nChurned accounts, 18, 25, lower",
        displayTextArea: true,
        description: "One goal per line: name, actual, target. Add a 4th number for the axis end, or \"lower\" at the end when lower is better. Leave empty to show demo data.",
    },
    title: { type: ControlType.String, title: "Title", defaultValue: "Q4 goals", placeholder: "Optional" },
    subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "", placeholder: "Optional" },
    note: { type: ControlType.String, title: "Note", defaultValue: "", placeholder: "Updated weekly" },
    better: {
        type: ControlType.Enum,
        title: "Better",
        options: ["higher", "lower"],
        optionTitles: ["Higher", "Lower"],
        defaultValue: "higher",
        displaySegmentedControl: true,
        description: "Default direction. A line ending in \"lower\" or \"higher\" overrides it.",
    },
    closeAt: { type: ControlType.Number, title: "Close At", defaultValue: 90, min: 1, max: 99, step: 1, unit: "%", description: "Counts as Close from this share of the target." },
    colorBy: {
        type: ControlType.Enum,
        title: "Color By",
        options: ["status", "single"],
        optionTitles: ["Status", "Single"],
        defaultValue: "status",
        displaySegmentedControl: true,
    },
    bands: { type: ControlType.String, title: "Bands", defaultValue: "60, 90", placeholder: "60, 90", description: "Shaded ranges behind each bar, as % of the target.", hidden: (p: BulletChartProps) => p.showBands === false },
    showBands: { type: ControlType.Boolean, title: "Band Shades", defaultValue: true, enabledTitle: "Show", disabledTitle: "Flat" },
    scale: {
        type: ControlType.Enum,
        title: "Axis",
        options: ["row", "shared"],
        optionTitles: ["Per Row", "Shared"],
        defaultValue: "row",
        displaySegmentedControl: true,
        description: "Shared only makes sense when every row uses the same unit.",
    },
    sort: { type: ControlType.Enum, title: "Sort", options: ["input", "progress"], optionTitles: ["As Typed", "By Progress"], defaultValue: "input", displaySegmentedControl: true },
    showValues: { type: ControlType.Boolean, title: "Values", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    percent: { type: ControlType.Enum, title: "Percent", options: ["show", "hide"], optionTitles: ["Show", "Hide"], defaultValue: "show", displaySegmentedControl: true },
    showSummary: { type: ControlType.Boolean, title: "Summary", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    onTrackWord: { type: ControlType.String, title: "On Track Text", defaultValue: "On track", description: "Translate these for other languages." },
    closeWord: { type: ControlType.String, title: "Close Text", defaultValue: "Close" },
    behindWord: { type: ControlType.String, title: "Behind Text", defaultValue: "Behind" },
    targetWord: { type: ControlType.String, title: "Target Text", defaultValue: "Target" },
    summaryWord: { type: ControlType.String, title: "Summary Text", defaultValue: "on track", hidden: (p: BulletChartProps) => p.showSummary === false },
    showLegend: { type: ControlType.Boolean, title: "Legend", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    theme: {
        type: ControlType.Enum,
        title: "Color",
        options: ["mint", "green", "blue", "purple", "orange", "pink", "mono", "custom"],
        optionTitles: ["Mint", "Green", "Blue", "Purple", "Orange", "Pink", "Mono", "Custom"],
        defaultValue: "mint",
    },
    accent: { type: ControlType.Color, title: "Custom Color", defaultValue: "#2DE5A0", hidden: (p: BulletChartProps) => p.theme !== "custom" },
    appearance: { type: ControlType.Enum, title: "Appearance", options: ["light", "dark"], optionTitles: ["Light", "Dark"], defaultValue: "light", displaySegmentedControl: true },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "", placeholder: "$" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "", placeholder: "%" },
    decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 1, min: 0, max: 3, step: 1, displayStepper: true, description: "Maximum decimals. Trailing zeros are dropped." },
    percentDecimals: { type: ControlType.Number, title: "% Decimals", defaultValue: 0, min: 0, max: 2, step: 1, displayStepper: true },
    locale: { type: ControlType.String, title: "Locale", defaultValue: "en-US", placeholder: "en-US, de-DE, ja-JP…" },
    rowHeight: { type: ControlType.Number, title: "Row Height", defaultValue: 56, min: 20, max: 200, step: 1, unit: "px" },
    barSize: { type: ControlType.Number, title: "Bar Size", defaultValue: 12, min: 3, max: 60, step: 1, unit: "px" },
    barRadius: { type: ControlType.Number, title: "Bar Radius", defaultValue: 6, min: 0, max: 30, step: 1, unit: "px" },
    textScale: { type: ControlType.Number, title: "Text Scale", defaultValue: 1, min: 0.5, max: 3, step: 0.05, unit: "×" },
    customColors: { type: ControlType.Boolean, title: "Colors", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Preset" },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        hidden: (p: BulletChartProps) => !p.customColors,
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            muted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#6B6B76" },
            band: { type: ControlType.Color, title: "Bands", defaultValue: "#111114" },
            good: { type: ControlType.Color, title: "On Track", defaultValue: "#2DE5A0" },
            close: { type: ControlType.Color, title: "Close", defaultValue: "#E5A100" },
            behind: { type: ControlType.Color, title: "Behind", defaultValue: "#E5484D" },
            marker: { type: ControlType.Color, title: "Target Line", defaultValue: "#111114" },
            tooltipBg: { type: ControlType.Color, title: "Tooltip", defaultValue: "#111114" },
            tooltipText: { type: ControlType.Color, title: "Tooltip Text", defaultValue: "#FFFFFF" },
        },
    },
    animate: { type: ControlType.Boolean, title: "Animate In", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 900, min: 200, max: 4000, step: 50, unit: "ms", hidden: (p: BulletChartProps) => !p.animate },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 60, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 24, min: 0, max: 80, step: 1, unit: "px" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 15, lineHeight: "1.4em" },
        description: "Created by BrandingUp",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 13, lineHeight: "1.35em" },
    },
})
