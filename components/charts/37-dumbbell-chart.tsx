// [생성일] 2026-11-15
// [경위] 달러벌기 37번 상품(무료): 줄마다 "이름, 전, 후" 숫자를 넣으면 전·후를 점 두 개와 막대로 잇는 덤벨 차트. 기울기(Slope) 보기 · 증감 자동 계산 · 좋아진 쪽/나빠진 쪽 색 · 정렬 · 툴팁
// [변경이력]
//   - 2026-11-15: 최초 생성 (줄 목록 입력 · 빈 데이터면 데모 · 보기 Dumbbell/Slope · 증감 % /차이/둘 다 · Better Higher/Lower 로 색 결정 · 색 방식 증감/전후 · 정렬 입력순/증감/후 값 · 축 0부터/자동 · 눈금 · 점 옆 값 · 요약(몇 개 올랐나·평균 증감) · 범례 · 숫자 서식 · 색 테마 7종+직접 색 · 호버·방향키 · 등장 1회(CSS 전환, 프레임 루프 없음) · 정적·캔버스 완성 상태 · 좁으면 이름을 위로, Slope 는 덤벨로)

import { useEffect, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties, KeyboardEvent, ReactNode } from "react"
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
    track?: string
    up?: string
    down?: string
    tooltipBg?: string
    tooltipText?: string
}

// 입력 한 줄 = 항목 하나 (전 값, 후 값)
interface Item {
    name: string
    a: number
    b: number
}

// 계산이 끝난 항목
interface Row extends Item {
    index: number // 입력 순서
    diff: number // 후 − 전
    pct: number | null // (후 − 전) ÷ |전| (전이 0이면 null)
    good: number // 1 = 좋아짐, −1 = 나빠짐, 0 = 같음 (Better 설정 기준)
}

type ThemeName = "mint" | "green" | "blue" | "purple" | "orange" | "pink" | "mono" | "custom"

const MAX_LINES = 200
const MAX_ROWS = 20

// 색 테마별 대표색
const ACCENTS: Record<string, string> = {
    mint: "#2DE5A0",
    green: "#2DA44E",
    blue: "#3B82F6",
    purple: "#8B5CF6",
    orange: "#F97316",
    pink: "#EC4899",
}

// 데이터가 비었을 때 보여 주는 데모: 페이지별 전환율(%) 리디자인 전·후
const DEMO: Item[] = [
    { name: "Checkout", a: 38, b: 52 },
    { name: "Pricing", a: 4.8, b: 6.2 },
    { name: "Home", a: 2.1, b: 3.4 },
    { name: "Signup", a: 12, b: 10.5 },
    { name: "Docs", a: 1.6, b: 2.4 },
    { name: "Blog", a: 0.9, b: 1.1 },
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

// 색에 투명도를 입힌다
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

// 숫자 한 칸 읽기: 통화 기호·% ·공백은 무시, 12.4k / 1.2M 줄임 표기 허용, 음수 허용. 숫자가 아니면 null
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
    return isFinite(n) ? n : null
}

// 입력 글자를 항목 목록으로 바꾼다.
// 한 줄 = "Checkout, 38, 52" (이름, 전 값, 후 값). 구분: 쉼표, 또는 스프레드시트에서 붙여넣은 탭(세미콜론·| 도 가능).
// 공백만으로 나눈 줄은 마지막 숫자 두 개를 읽는다. 숫자가 두 개 미만인 줄(머리글 등)은 건너뛴다.
function parseData(text: string): Item[] {
    const out: Item[] = []
    if (typeof text !== "string" || !text.trim()) return out
    const lines = text.split(/\r?\n/).slice(0, MAX_LINES)
    for (let i = 0; i < lines.length && out.length < MAX_ROWS; i++) {
        const line = lines[i].trim()
        if (!line) continue
        const strong = /[\t;|]/.test(line)
        let cells = (strong ? line.split(/[\t;|]/) : line.split(",")).map((c) => c.trim())
        while (cells.length > 1 && cells[cells.length - 1] === "") cells.pop()
        let joiner = ", "
        if (cells.length < 3) {
            cells = line.split(/[\s,\t;|]+/).filter(Boolean)
            joiner = " "
        }
        if (cells.length < 3) continue
        const b = parseNumber(cells[cells.length - 1], strong)
        const a = parseNumber(cells[cells.length - 2], strong)
        if (a === null || b === null) continue
        const name = cells.slice(0, -2).join(joiner).trim() || `Item ${out.length + 1}`
        out.push({ name, a, b })
    }
    return out
}

// 보기 좋은 눈금 간격 (1·2·2.5·5 × 10^n)
function niceStep(span: number, count: number): number {
    const raw = span / Math.max(1, count)
    if (!(raw > 0) || !isFinite(raw)) return 1
    const p = Math.pow(10, Math.floor(Math.log10(raw)))
    const f = raw / p
    const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
    return n * p
}

// 로케일 숫자 서식: 소수는 최대 d 자리, 끝의 0 은 지운다 (38 → "38", 2.1 → "2.1")
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

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface DumbbellChartProps {
    data?: string
    title?: string
    subtitle?: string
    note?: string
    view?: "dumbbell" | "slope"
    startLabel?: string
    endLabel?: string
    better?: "higher" | "lower"
    colorBy?: "change" | "period"
    sort?: "input" | "change" | "end"
    change?: "percent" | "difference" | "both" | "none"
    dotLabels?: boolean
    axisFrom?: "auto" | "zero"
    showAxis?: boolean
    showSummary?: boolean
    upWord?: string
    betterWord?: string
    worseWord?: string
    avgWord?: string
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
    dotSize?: number
    lineWidth?: number
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
 * Dumbbell Chart — 줄마다 이름·전 값·후 값을 넣으면 두 점을 잇는 덤벨(또는 기울기) 차트로 전·후를 비교하고 증감을 계산한다.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 460
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function DumbbellChart(props: DumbbellChartProps) {
    const {
        data = "",
        title = "Conversion rate by page, %",
        subtitle = "",
        note = "",
        view = "dumbbell",
        startLabel = "Before",
        endLabel = "After",
        better = "higher",
        colorBy = "change",
        sort = "input",
        change = "percent",
        dotLabels = true,
        axisFrom = "auto",
        showAxis = true,
        showSummary = true,
        upWord = "improved",
        betterWord = "better",
        worseWord = "worse",
        avgWord = "average change",
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
        rowHeight = 44,
        dotSize = 14,
        lineWidth = 6,
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
        track: cs?.track ?? (dark ? "rgba(255, 255, 255, 0.1)" : "rgba(17, 17, 20, 0.08)"),
        // 증감 색: 좋아짐 = 대표색, 나빠짐 = 빨강 (Custom Colors 로 바꿀 수 있음)
        up: cs?.up ?? base,
        down: cs?.down ?? (dark ? "#FF6B6B" : "#E5484D"),
        tooltipBg: cs?.tooltipBg ?? (dark ? "#F4F4F6" : "#111114"),
        tooltipText: cs?.tooltipText ?? (dark ? "#111114" : "#FFFFFF"),
    }
    // 전·후 색 방식: 전 = 회색, 후 = 대표색
    const startColor = dark ? "#6B6B76" : "#B4B4BC"

    // ── 데이터 읽기 (비어 있으면 데모) → 증감 계산 → 정렬 ──
    const rows = useMemo(() => {
        const parsed = parseData(data)
        const items = parsed.length ? parsed : DEMO
        const sign = better === "lower" ? -1 : 1
        const list: Row[] = items.map((it, i) => {
            const diff = it.b - it.a
            return { ...it, index: i, diff, pct: it.a !== 0 ? diff / Math.abs(it.a) : null, good: Math.sign(diff) * sign }
        })
        if (sort === "change") {
            // 좋아진 정도가 큰 순서 (비율이 있으면 비율, 없으면 차이)
            // 전 값이 0이라 비율이 없으면 차이의 부호만 반영(아주 큰/작은 값으로 취급)
            const score = (r: Row) => (r.pct !== null ? r.pct : r.diff > 0 ? 1e12 : r.diff < 0 ? -1e12 : 0) * sign
            list.sort((x, y) => score(y) - score(x) || x.index - y.index)
        } else if (sort === "end") {
            list.sort((x, y) => (y.b - x.b) * sign || x.index - y.index)
        }
        return list
    }, [data, better, sort])
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
    // 점·막대·선은 CSS 전환으로 "전 값 → 후 값" 으로 움직인다. 프레임 루프(rAF)·반복 타이머 없음.
    // 정적 렌더·캔버스·화면 밖·모션 줄이기 설정에서는 완성된 상태를 즉시 보여줌
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const canAnimate = animate && !isStatic && !isCanvas
    const dur = clamp(Math.round(duration) || 900, 200, 4000)
    const stagger = n > 1 ? Math.min(90, Math.round(dur * 0.5 / (n - 1))) : 0
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
    const trans = (list: string, delay: number) => (phase === "playing" ? list.split(",").map((p) => `${p.trim()} ${dur}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`).join(", ") : "none")

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
        const value = (v: number) => (v < 0 ? "−" : "") + (prefix || "") + nf(Math.abs(v)) + (suffix || "")
        const signed = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + (prefix || "") + nf(Math.abs(v)) + (suffix || "")
        const pct = (r: number | null) => (r === null || !isFinite(r) ? "—" : (r > 0 ? "+" : r < 0 ? "−" : "") + pf(Math.abs(r) * 100) + "%")
        return { value, signed, pct }
    }, [locale, decimals, percentDecimals, prefix, suffix])
    const changeText = (r: Row): string => {
        if (change === "none") return ""
        if (change === "difference") return fmt.signed(r.diff)
        if (change === "both") return `${fmt.signed(r.diff)} (${fmt.pct(r.pct)})`
        return r.pct === null ? fmt.signed(r.diff) : fmt.pct(r.pct)
    }
    const rowColor = (r: Row) => (r.good > 0 ? theme.up : r.good < 0 ? theme.down : theme.muted)
    const endColor = (r: Row) => (colorBy === "period" ? theme.up : rowColor(r))
    const lineColor = (r: Row) => (colorBy === "period" ? theme.track : withAlpha(rowColor(r), 0.35))

    // ── 값 범위와 눈금 ──
    const vals = rows.reduce<number[]>((acc, r) => acc.concat([r.a, r.b]), [])
    let lo = Math.min(...vals)
    let hi = Math.max(...vals)
    if (axisFrom === "zero") {
        lo = Math.min(0, lo)
        hi = Math.max(0, hi)
    }
    if (hi === lo) {
        hi = lo + 1
        lo = lo - (axisFrom === "zero" && lo >= 0 ? 0 : 1)
    }
    const step = niceStep(hi - lo, 4)
    const lo2 = axisFrom === "zero" && lo >= 0 ? 0 : Math.floor(lo / step) * step
    const hi2 = Math.ceil(hi / step) * step
    const ticks: number[] = []
    for (let v = lo2; v <= hi2 + step * 1e-6 && ticks.length < 12; v += step) ticks.push(Math.round(v / step) * step)
    const frac = (v: number) => (hi2 > lo2 ? clamp((v - lo2) / (hi2 - lo2), 0, 1) : 0.5)

    // ── 배치 계산 ──
    const tooNarrowSlope = width < 380
    const mode = view === "slope" && !tooNarrowSlope ? "slope" : "dumbbell"
    const nameW = Math.round(clamp(rows.reduce((mx, r) => Math.max(mx, textUnits(r.name)), 0) * lfs + 8, 48, width * 0.32))
    const chgW = change === "none" ? 0 : Math.round(clamp(rows.reduce((mx, r) => Math.max(mx, textUnits(changeText(r))), 0) * lfs + 10, 36, width * 0.22))
    const stackName = mode === "dumbbell" && width < 440
    const valW = dotLabels ? Math.round(rows.reduce((mx, r) => Math.max(mx, textUnits(fmt.value(r.a)), textUnits(fmt.value(r.b))), 0) * lfs * 0.95 + 8) : 0
    const colGap = Math.round(clamp(width * 0.025, 8, 16))
    const plotX0 = stackName ? 0 : nameW + colGap
    const plotW = Math.max(60, width - plotX0 - (chgW ? chgW + colGap : 0))
    // 점 옆 값 라벨이 들어갈 여백을 플롯 양쪽에 남긴다
    const inner = Math.max(30, plotW - valW * 2)
    const xOf = (v: number) => valW + frac(v) * inner
    const ds = clamp(Number(dotSize) || 14, 4, 40) * Math.max(1, ts * 0.8)
    const lw = clamp(Number(lineWidth) || 6, 1, 30)
    const rh = Math.max(Math.round(clamp(Number(rowHeight) || 44, 16, 200)), Math.ceil(ds + 6), Math.ceil(lfs * 1.6))

    // ── 요약: 몇 개가 좋아졌나 · 평균 증감(비율이 있는 항목만) ──
    const upCount = rows.filter((r) => r.good > 0).length
    const pcts = rows.map((r) => r.pct).filter((p): p is number => p !== null)
    const avgPct = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null

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
    const describe = (r: Row) => `${r.name}: ${startLabel} ${fmt.value(r.a)}, ${endLabel} ${fmt.value(r.b)}, ${fmt.signed(r.diff)}${r.pct !== null ? " (" + fmt.pct(r.pct) + ")" : ""}`
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

    // 툴팁 (항목 줄 위/아래)
    const tooltip = (r: Row, x: number, y: number, boxW: number) => {
        if (!showTooltip) return null
        const lines = [r.name, `${startLabel} ${fmt.value(r.a)} → ${endLabel} ${fmt.value(r.b)}`, `${fmt.signed(r.diff)}${r.pct !== null ? "  " + fmt.pct(r.pct) : ""}`]
        const estW = lines.reduce((mx, s) => Math.max(mx, textUnits(s) * lfs), 0) + 24
        const left = clamp(x, estW / 2, Math.max(estW / 2, boxW - estW / 2))
        const below = y < rh * 2
        return (
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    left,
                    top: below ? y + rh / 2 + 6 : y - rh / 2 - 6,
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
                <div style={{ color: withAlpha(r.good < 0 ? theme.down : theme.up, 1), fontWeight: 600 }}>{lines[2]}</div>
            </div>
        )
    }

    // 범례
    const dot = (color: string, ring?: boolean) => (
        <span style={{ width: lfs * 0.8, height: lfs * 0.8, borderRadius: "50%", background: ring ? "transparent" : color, border: ring ? `2px solid ${color}` : "none", boxSizing: "border-box", display: "inline-block" }} />
    )
    const legendNode = showLegend ? (
        <div style={{ ...labelStyle, display: "flex", flexWrap: "wrap", gap: `4px ${Math.round(lfs * 1.2)}px`, marginTop: title || subtitle ? Math.round(fs * 0.6) : 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {dot(colorBy === "period" ? startColor : theme.muted, colorBy !== "period")}
                {startLabel}
            </span>
            {colorBy === "period" ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {dot(theme.up)}
                    {endLabel}
                </span>
            ) : (
                <>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {dot(theme.up)}
                        {endLabel} · {betterWord}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {dot(theme.down)}
                        {endLabel} · {worseWord}
                    </span>
                </>
            )}
        </div>
    ) : null

    // ── 덤벨 보기: 항목마다 한 줄 (HTML 로 그려 CSS 전환으로 움직임) ──
    const renderDumbbell = (): ReactNode => {
        const lineH = rh
        const nameRowH = stackName ? Math.ceil(lfs * 1.5) : 0
        const axisH = showAxis ? Math.ceil(lfs * 1.8) : 0
        const blockH = n * (lineH + nameRowH) + axisH
        return (
            <div style={{ position: "relative", height: blockH }} onPointerLeave={() => setActive(null)}>
                {/* 세로 눈금선 */}
                {showAxis
                    ? ticks.map((t, k) => (
                          <div key={"g" + k} style={{ position: "absolute", left: plotX0 + xOf(t), top: 0, height: blockH - axisH, borderLeft: `1px dashed ${theme.track}` }} />
                      ))
                    : null}
                {rows.map((r, k) => {
                    const top = k * (lineH + nameRowH)
                    const cy = top + nameRowH + lineH / 2
                    const xa = xOf(r.a)
                    const xb = xOf(r.b)
                    const x0 = Math.min(xa, xb)
                    const delay = k * stagger
                    const dim = active !== null && active !== k
                    const c = endColor(r)
                    // 왼쪽에 놓일 값이 '전'인지 '후'인지 (후 값은 항상 굵게)
                    const aLeft = xa <= xb
                    return (
                        <div
                            key={r.index}
                            onPointerEnter={() => setActive(k)}
                            style={{ position: "absolute", left: 0, right: 0, top, height: lineH + nameRowH, opacity: dim ? 0.35 : 1, transition: phase === "done" ? "opacity 160ms ease" : "none" }}
                        >
                            {/* 이름 */}
                            <div
                                style={{
                                    ...labelCss,
                                    position: "absolute",
                                    left: 0,
                                    top: stackName ? 0 : nameRowH,
                                    width: stackName ? "100%" : nameW,
                                    height: stackName ? nameRowH : lineH,
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
                            {/* 바탕 줄 */}
                            <div style={{ position: "absolute", left: plotX0 + valW, width: inner, top: cy - top - 0.5, height: 1, background: theme.track }} />
                            {/* 전 → 후 막대 (등장: 전 값 위치에서 길이 0 → 후 값까지) */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: cy - top - lw / 2,
                                    height: lw,
                                    borderRadius: lw,
                                    background: lineColor(r),
                                    left: plotX0 + (hidden ? xa : x0),
                                    width: hidden ? 0 : Math.abs(xb - xa),
                                    transition: trans("left, width", delay),
                                }}
                            />
                            {/* 전 점 (속 빈 원 또는 회색) */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: plotX0 + xa - ds / 2,
                                    top: cy - top - ds / 2,
                                    width: ds,
                                    height: ds,
                                    borderRadius: "50%",
                                    boxSizing: "border-box",
                                    background: colorBy === "period" ? startColor : dark ? "#101114" : "#FFFFFF",
                                    border: colorBy === "period" ? "none" : `2px solid ${theme.muted}`,
                                    opacity: hidden ? 0 : 1,
                                    transition: trans("opacity", delay),
                                }}
                            />
                            {/* 후 점 (등장: 전 값 위치에서 후 값까지 이동) */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: plotX0 + (hidden ? xa : xb) - ds / 2,
                                    top: cy - top - ds / 2,
                                    width: ds,
                                    height: ds,
                                    borderRadius: "50%",
                                    background: c,
                                    opacity: hidden ? 0 : 1,
                                    transition: trans("left, opacity", delay),
                                }}
                            />
                            {/* 점 옆 값: 왼쪽 점은 왼쪽에, 오른쪽 점은 오른쪽에 */}
                            {dotLabels ? (
                                <>
                                    <div style={{ ...numStyle, position: "absolute", right: width - (plotX0 + x0 - ds / 2 - 6), top: cy - top - lfs / 2, color: aLeft ? theme.muted : theme.text, fontWeight: aLeft ? 400 : 600, opacity: hidden ? 0 : 1, transition: trans("opacity", delay) }}>
                                        {fmt.value(aLeft ? r.a : r.b)}
                                    </div>
                                    <div style={{ ...numStyle, position: "absolute", left: plotX0 + Math.max(xa, xb) + ds / 2 + 6, top: cy - top - lfs / 2, color: aLeft ? theme.text : theme.muted, fontWeight: aLeft ? 600 : 400, opacity: hidden ? 0 : 1, transition: trans("opacity", delay) }}>
                                        {fmt.value(aLeft ? r.b : r.a)}
                                    </div>
                                </>
                            ) : null}
                            {/* 증감 */}
                            {chgW ? (
                                <div style={{ ...numStyle, position: "absolute", right: 0, width: chgW, textAlign: "right", top: cy - top - lfs / 2, color: rowColor(r), fontWeight: 600 }}>{changeText(r)}</div>
                            ) : null}
                            {active === k ? tooltip(r, plotX0 + (xa + xb) / 2, cy - top, width) : null}
                        </div>
                    )
                })}
                {/* 아래 축 숫자 */}
                {showAxis
                    ? ticks.map((t, k) => (
                          <div key={"t" + k} style={{ ...numStyle, position: "absolute", top: blockH - axisH + Math.round(lfs * 0.6), left: plotX0 + xOf(t), transform: "translateX(-50%)", color: theme.muted, fontSize: Math.round(lfs * 0.9) }}>
                              {fmt.value(t)}
                          </div>
                      ))
                    : null}
            </div>
        )
    }

    // ── 기울기 보기: 왼쪽 축 = 전, 오른쪽 축 = 후, 항목마다 선 하나 (SVG, 선은 stroke-dashoffset 전환으로 그려짐) ──
    const renderSlope = (): ReactNode => {
        const headH = Math.ceil(lfs * 2)
        const plotH = Math.max(160, Math.min(520, n * rh * 0.9 + 40))
        const h = headH + plotH
        // 라벨 칸: 왼쪽 "이름 값", 오른쪽 "값 이름(증감)"
        const sideW = Math.round(clamp(nameW + valW + 8, 80, width * 0.38))
        const xL = sideW
        const xR = width - sideW
        const yOf = (v: number) => headH + (1 - frac(v)) * (plotH - ds) + ds / 2
        // 라벨 겹침 피하기: 위치 순으로 정렬해 최소 간격만큼 아래로 밀고, 넘치면 위로 다시 민다
        const spread = (ys: number[]): number[] => {
            const gap = lfs * 1.35
            const order = ys.map((y, i) => i).sort((a, b) => ys[a] - ys[b])
            const out = ys.slice()
            // 위에서 아래로: 앞 라벨과 gap 이상 떨어지게 민다
            for (let k = 1; k < order.length; k++) out[order[k]] = Math.max(out[order[k]], out[order[k - 1]] + gap)
            // 아래로 넘쳤으면 아래에서 위로: 바닥에 맞추고 위쪽 라벨을 gap 간격으로 끌어올린다
            const limit = h - lfs * 0.6
            for (let k = order.length - 1; k >= 0; k--) {
                const cap = k === order.length - 1 ? limit : out[order[k + 1]] - gap
                out[order[k]] = Math.min(out[order[k]], cap)
            }
            return out
        }
        const ly = spread(rows.map((r) => yOf(r.a)))
        const ry = spread(rows.map((r) => yOf(r.b)))
        return (
            <div style={{ position: "relative", height: h }} onPointerLeave={() => setActive(null)}>
                <div style={{ ...labelStyle, position: "absolute", left: xL, top: 0, transform: "translateX(-50%)", fontWeight: 600 }}>{startLabel}</div>
                <div style={{ ...labelStyle, position: "absolute", left: xR, top: 0, transform: "translateX(-50%)", fontWeight: 600 }}>{endLabel}</div>
                <svg width={width} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} aria-hidden>
                    <line x1={xL} x2={xL} y1={headH} y2={h} stroke={theme.track} strokeWidth={1} />
                    <line x1={xR} x2={xR} y1={headH} y2={h} stroke={theme.track} strokeWidth={1} />
                    {rows.map((r, k) => {
                        const ya = yOf(r.a)
                        const yb = yOf(r.b)
                        const dim = active !== null && active !== k
                        const c = endColor(r)
                        const delay = k * stagger
                        return (
                            <g key={r.index} onPointerEnter={() => setActive(k)} style={{ opacity: dim ? 0.25 : 1, transition: phase === "done" ? "opacity 160ms ease" : "none" }}>
                                {/* 호버 잡는 투명 굵은 선 */}
                                <line x1={xL} y1={ya} x2={xR} y2={yb} stroke="transparent" strokeWidth={Math.max(14, lw * 2)} />
                                <line
                                    x1={xL}
                                    y1={ya}
                                    x2={xR}
                                    y2={yb}
                                    stroke={colorBy === "period" ? withAlpha(theme.up, 0.55) : c}
                                    strokeWidth={Math.max(1.5, lw / 2.5)}
                                    strokeLinecap="round"
                                    pathLength={1}
                                    strokeDasharray="1 1"
                                    style={{ strokeDashoffset: hidden ? 1 : 0, transition: trans("stroke-dashoffset", delay) }}
                                />
                                <circle cx={xL} cy={ya} r={ds / 2} fill={colorBy === "period" ? startColor : dark ? "#101114" : "#FFFFFF"} stroke={colorBy === "period" ? "none" : theme.muted} strokeWidth={2} />
                                <circle cx={xR} cy={yb} r={ds / 2} fill={c} style={{ opacity: hidden ? 0 : 1, transition: trans("opacity", delay + Math.round(dur * 0.6)) }} />
                            </g>
                        )
                    })}
                </svg>
                {rows.map((r, k) => {
                    const dim = active !== null && active !== k
                    return (
                        <div key={"l" + r.index} style={{ opacity: dim ? 0.35 : 1 }}>
                            <div style={{ ...numStyle, position: "absolute", right: width - xL + ds / 2 + 8, top: ly[k] - lfs / 2, color: theme.text }}>
                                <span style={{ color: theme.muted, marginRight: 6 }}>{r.name}</span>
                                {fmt.value(r.a)}
                            </div>
                            <div style={{ ...numStyle, position: "absolute", left: xR + ds / 2 + 8, top: ry[k] - lfs / 2, color: theme.text, fontWeight: 600, opacity: hidden ? 0 : 1, transition: trans("opacity", k * stagger + Math.round(dur * 0.6)) }}>
                                {fmt.value(r.b)}
                                {chgW ? <span style={{ color: rowColor(r), marginLeft: 6 }}>{changeText(r)}</span> : null}
                            </div>
                        </div>
                    )
                })}
                {active !== null ? tooltip(rows[active], width / 2, (yOf(rows[active].a) + yOf(rows[active].b)) / 2, width) : null}
            </div>
        )
    }

    return (
        <div className="bu-dumbbell" style={rootStyle} tabIndex={0} role="figure" aria-label={ariaSummary} onKeyDown={onKey} onBlur={() => setActive(null)}>
            <style>{`.bu-dumbbell:focus-visible{box-shadow:0 0 0 2px ${theme.up}}`}</style>
            <div ref={areaRef} style={{ width: "100%" }}>
                {title ? <div style={{ fontWeight: 650, fontSize: Math.round(fs * 1.15), lineHeight: 1.3 }}>{title}</div> : null}
                {subtitle ? <div style={{ ...labelStyle, marginTop: 4 }}>{subtitle}</div> : null}
                {legendNode}
                <div style={{ height: title || subtitle || legendNode ? Math.round(fs * 1.1) : 0 }} />
                {mode === "slope" ? renderSlope() : renderDumbbell()}
                {/* 요약 + 메모 */}
                {showSummary || note ? (
                    <div style={{ ...labelStyle, marginTop: Math.round(fs * 1.1), display: "flex", flexWrap: "wrap", gap: "2px 14px" }}>
                        {showSummary ? (
                            <span>
                                <b style={{ color: theme.text }}>
                                    {upCount} of {n}
                                </b>{" "}
                                {upWord}
                                {avgPct !== null && avgWord ? (
                                    <>
                                        {" · "}
                                        {avgWord} <b style={{ color: theme.text }}>{fmt.pct(avgPct)}</b>
                                    </>
                                ) : null}
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

addPropertyControls(DumbbellChart, {
    data: {
        type: ControlType.String,
        title: "Data",
        defaultValue: "",
        placeholder: "Checkout, 38, 52\nPricing, 4.8, 6.2\nSignup, 12, 10.5",
        displayTextArea: true,
        description: "One item per line: name, before, after. Leave empty to show demo data.",
    },
    title: { type: ControlType.String, title: "Title", defaultValue: "Conversion rate by page, %", placeholder: "Optional" },
    subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "", placeholder: "Optional" },
    note: { type: ControlType.String, title: "Note", defaultValue: "", placeholder: "Source: …" },
    view: {
        type: ControlType.Enum,
        title: "View",
        options: ["dumbbell", "slope"],
        optionTitles: ["Dumbbell", "Slope"],
        defaultValue: "dumbbell",
        displaySegmentedControl: true,
        description: "Slope switches to Dumbbell on narrow screens.",
    },
    startLabel: { type: ControlType.String, title: "Start Label", defaultValue: "Before" },
    endLabel: { type: ControlType.String, title: "End Label", defaultValue: "After" },
    better: {
        type: ControlType.Enum,
        title: "Better",
        options: ["higher", "lower"],
        optionTitles: ["Higher", "Lower"],
        defaultValue: "higher",
        displaySegmentedControl: true,
        description: "Lower for things like load time or cost.",
    },
    colorBy: {
        type: ControlType.Enum,
        title: "Color By",
        options: ["change", "period"],
        optionTitles: ["Change", "Period"],
        defaultValue: "change",
        displaySegmentedControl: true,
        description: "Change: better and worse get their own color. Period: before is gray, after is your color.",
    },
    sort: {
        type: ControlType.Enum,
        title: "Sort",
        options: ["input", "change", "end"],
        optionTitles: ["As Typed", "By Change", "By After"],
        defaultValue: "input",
    },
    change: {
        type: ControlType.Enum,
        title: "Change",
        options: ["percent", "difference", "both", "none"],
        optionTitles: ["Percent", "Difference", "Both", "Hide"],
        defaultValue: "percent",
    },
    dotLabels: { type: ControlType.Boolean, title: "Dot Values", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    axisFrom: {
        type: ControlType.Enum,
        title: "Axis",
        options: ["auto", "zero"],
        optionTitles: ["Fit Data", "From Zero"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    showAxis: { type: ControlType.Boolean, title: "Grid", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showSummary: { type: ControlType.Boolean, title: "Summary", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    upWord: { type: ControlType.String, title: "Up Text", defaultValue: "improved", description: "\"4 of 6 improved\". Translate for other languages.", hidden: (p: DumbbellChartProps) => !p.showSummary },
    avgWord: { type: ControlType.String, title: "Avg Text", defaultValue: "average change", description: "Clear it to hide the average.", hidden: (p: DumbbellChartProps) => !p.showSummary },
    showLegend: { type: ControlType.Boolean, title: "Legend", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    betterWord: { type: ControlType.String, title: "Better Text", defaultValue: "better", hidden: (p: DumbbellChartProps) => !p.showLegend || p.colorBy === "period" },
    worseWord: { type: ControlType.String, title: "Worse Text", defaultValue: "worse", hidden: (p: DumbbellChartProps) => !p.showLegend || p.colorBy === "period" },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    theme: {
        type: ControlType.Enum,
        title: "Color",
        options: ["mint", "green", "blue", "purple", "orange", "pink", "mono", "custom"],
        optionTitles: ["Mint", "Green", "Blue", "Purple", "Orange", "Pink", "Mono", "Custom"],
        defaultValue: "mint",
    },
    accent: { type: ControlType.Color, title: "Custom Color", defaultValue: "#2DE5A0", hidden: (p: DumbbellChartProps) => p.theme !== "custom" },
    appearance: {
        type: ControlType.Enum,
        title: "Appearance",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "", placeholder: "$" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "", placeholder: "%" },
    decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 1, min: 0, max: 3, step: 1, displayStepper: true, description: "Maximum decimals. Trailing zeros are dropped." },
    percentDecimals: { type: ControlType.Number, title: "% Decimals", defaultValue: 0, min: 0, max: 2, step: 1, displayStepper: true },
    locale: { type: ControlType.String, title: "Locale", defaultValue: "en-US", placeholder: "en-US, de-DE, ja-JP…", description: "Number format, e.g. 1,200.5 or 1.200,5." },
    rowHeight: { type: ControlType.Number, title: "Row Height", defaultValue: 44, min: 16, max: 200, step: 1, unit: "px" },
    dotSize: { type: ControlType.Number, title: "Dot Size", defaultValue: 14, min: 4, max: 40, step: 1, unit: "px" },
    lineWidth: { type: ControlType.Number, title: "Bar Width", defaultValue: 6, min: 1, max: 30, step: 1, unit: "px" },
    textScale: { type: ControlType.Number, title: "Text Scale", defaultValue: 1, min: 0.5, max: 3, step: 0.05, unit: "×" },
    customColors: { type: ControlType.Boolean, title: "Colors", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Preset" },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        hidden: (p: DumbbellChartProps) => !p.customColors,
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            muted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#6B6B76" },
            track: { type: ControlType.Color, title: "Grid", defaultValue: "#EBEBEE" },
            up: { type: ControlType.Color, title: "Better", defaultValue: "#2DE5A0" },
            down: { type: ControlType.Color, title: "Worse", defaultValue: "#E5484D" },
            tooltipBg: { type: ControlType.Color, title: "Tooltip", defaultValue: "#111114" },
            tooltipText: { type: ControlType.Color, title: "Tooltip Text", defaultValue: "#FFFFFF" },
        },
    },
    animate: { type: ControlType.Boolean, title: "Animate In", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 900, min: 200, max: 4000, step: 50, unit: "ms", hidden: (p: DumbbellChartProps) => !p.animate },
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
