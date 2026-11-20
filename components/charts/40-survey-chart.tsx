// [생성일] 2026-11-20
// [경위] 달러벌기 40번 상품(무료): 줄마다 "질문, 답변 단계별 응답 수"를 넣으면 설문(리커트 척도) 결과를 100% 누적 막대 또는 가운데 기준 막대로 보여 주는 차트. 줄마다 긍정 %·순점수 자동 계산
// [변경이력]
//   - 2026-11-20: 최초 생성 (줄 목록 입력 · 빈 데이터면 데모 · 답변 단계 2~7개 자동 인식 · % 는 줄마다 합이 100 이 되게 반올림 · 보기 2종(Stacked/Diverging) · 긍정 %/순점수 · 정렬 · 요약 · 범례 · 막대 안 숫자 · 색 테마 5종+직접 색 · 호버·방향키 · 등장 1회(CSS 전환, 프레임 루프 없음) · 정적·캔버스 완성 상태 · 좁으면 질문을 막대 위로)

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
    positive?: string
    negative?: string
    neutral?: string
    tooltipBg?: string
    tooltipText?: string
}

// 입력 한 줄 = 질문 하나 (counts 는 입력한 순서 그대로)
interface Item {
    name: string
    counts: number[]
}

// 계산이 끝난 질문 (counts·pcts 는 항상 부정 → 긍정 순서)
interface Row {
    index: number
    name: string
    counts: number[]
    total: number
    shares: number[] // 0~100, 반올림 전 (막대 길이용)
    pcts: number[] // 0~100, 합이 100 이 되게 반올림 (표시용)
    positive: number | null // 긍정 쪽 표시 % 의 합
    negative: number | null // 부정 쪽 표시 % 의 합
    net: number | null // 긍정 − 부정
}

type ThemeName = "mint" | "blue" | "green" | "purple" | "teal" | "custom"

const MAX_LINES = 200
const MAX_ROWS = 20
const MAX_LEVELS = 7

// 색 테마: [긍정 색, 부정 색]
const THEMES: Record<string, [string, string]> = {
    mint: ["#2DE5A0", "#F2667A"],
    blue: ["#3B82F6", "#F97316"],
    green: ["#2DA44E", "#E5484D"],
    purple: ["#8B5CF6", "#F59E0B"],
    teal: ["#0EA5A4", "#EC4899"],
}

// 답변 단계 수별 기본 이름 (부정 → 긍정)
const DEFAULT_LABELS: Record<number, string[]> = {
    2: ["No", "Yes"],
    3: ["Disagree", "Neutral", "Agree"],
    4: ["Strongly disagree", "Disagree", "Agree", "Strongly agree"],
    5: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
    6: ["Strongly disagree", "Disagree", "Somewhat disagree", "Somewhat agree", "Agree", "Strongly agree"],
    7: ["Strongly disagree", "Disagree", "Somewhat disagree", "Neutral", "Somewhat agree", "Agree", "Strongly agree"],
}

// 데이터가 비었을 때 보여 주는 데모: 고객 설문 5문항 × 5단계 (문항마다 300명)
const DEMO: Item[] = [
    { name: "The product is easy to use", counts: [6, 14, 30, 142, 108] },
    { name: "Setup took less time than expected", counts: [18, 42, 54, 120, 66] },
    { name: "Support answered my questions", counts: [9, 21, 45, 111, 114] },
    { name: "The price is fair for what I get", counts: [33, 69, 72, 90, 36] },
    { name: "I would recommend it to a friend", counts: [12, 18, 36, 96, 138] },
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

// 바탕색 위에 색을 t(0~1) 만큼 섞은 불투명 색 (답변 단계의 진하기 계단에 쓴다)
function mixOver(surface: string, color: string, t: number): string {
    const s = parseColor(surface)
    const c = parseColor(color)
    if (!s || !c) return color
    const k = clamp(t, 0, 1)
    const ch = (i: 0 | 1 | 2) => Math.round(s[i] + (c[i] - s[i]) * k)
    return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`
}

// 막대 색 위에 얹는 글자색: 밝은 색 위에는 검정, 어두운 색 위에는 흰색
function inkOn(color: string): string {
    const p = parseColor(color)
    if (!p) return "#FFFFFF"
    return (p[0] * 299 + p[1] * 587 + p[2] * 114) / 1000 > 150 ? "#111114" : "#FFFFFF"
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

// 숫자 한 칸 읽기: 통화 기호·% ·공백은 무시, 1.2k 줄임 표기 허용. 음수는 0 으로. 숫자가 아니면 null
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

// 입력 글자를 질문 목록으로 바꾼다.
// 한 줄 = "Easy to use, 6, 14, 30, 142, 108" (질문, 답변 단계별 응답 수 또는 %).
// 구분: 쉼표, 또는 스프레드시트 붙여넣기의 탭(세미콜론·| 도 가능). 질문 글 안의 쉼표는 그대로 둔다(숫자는 줄 끝에서부터 읽음).
// 답변 단계 수(2~7)는 가장 많은 줄이 쓴 숫자 개수로 정하고, 개수가 다른 줄(머리글 등)은 건너뛴다.
function parseData(text: string): { items: Item[]; levels: number } {
    const found: Item[] = []
    if (typeof text !== "string" || !text.trim()) return { items: [], levels: 0 }
    const lines = text.split(/\r?\n/).slice(0, MAX_LINES)
    for (let i = 0; i < lines.length; i++) {
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
        // 뒤에서부터 숫자를 최대 7개 읽는다. 첫 칸은 질문으로 남긴다
        const nums: number[] = []
        let end = cells.length
        while (end > 1 && nums.length < MAX_LEVELS) {
            const n = parseNumber(cells[end - 1], strong)
            if (n === null) break
            nums.unshift(n)
            end--
        }
        if (nums.length < 2) continue
        found.push({ name: cells.slice(0, end).join(joiner).trim() || `Question ${found.length + 1}`, counts: nums })
    }
    // 가장 많이 쓰인 숫자 개수 = 답변 단계 수 (같으면 큰 쪽)
    const tally: Record<number, number> = {}
    for (const it of found) tally[it.counts.length] = (tally[it.counts.length] || 0) + 1
    let levels = 0
    for (let k = 2; k <= MAX_LEVELS; k++) if ((tally[k] || 0) >= (tally[levels] || 0) && tally[k]) levels = k
    return { items: found.filter((it) => it.counts.length === levels).slice(0, MAX_ROWS), levels }
}

// 응답 수 → %: 소수 d 자리에서 합이 정확히 100 이 되게 반올림 (나머지가 큰 칸부터 한 칸씩 올림)
function roundShares(counts: number[], total: number, d: number): number[] {
    if (!(total > 0)) return counts.map(() => 0)
    const unit = Math.pow(10, d)
    const exact = counts.map((c) => (c / total) * 100 * unit)
    const base = exact.map((v) => Math.floor(v + 1e-9))
    let left = Math.round(100 * unit - base.reduce((a, b) => a + b, 0))
    const order = exact
        .map((v, i) => ({ i, frac: v - base[i] }))
        .sort((a, b) => b.frac - a.frac || counts[b.i] - counts[a.i] || a.i - b.i)
    for (let k = 0; k < order.length && left > 0; k++, left--) base[order[k].i] += 1
    return base.map((v) => v / unit)
}

// 로케일 숫자 서식: 소수는 최대 d 자리 (fixed 면 항상 d 자리)
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

// "Disagree, Neutral, Agree" → 이름 목록 (쉼표·줄바꿈 구분)
function parseLabels(s: string): string[] {
    if (typeof s !== "string") return []
    return s
        .split(/[,\n;|]+/)
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, MAX_LEVELS)
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface SurveyChartProps {
    data?: string
    title?: string
    subtitle?: string
    note?: string
    labels?: string
    firstColumn?: "negative" | "positive"
    view?: "stacked" | "diverging"
    score?: "positive" | "net" | "hide"
    sort?: "input" | "score"
    barLabels?: "percent" | "count" | "hide"
    showLegend?: boolean
    showSummary?: boolean
    positiveWord?: string
    netWord?: string
    summaryWord?: string
    showTooltip?: boolean
    theme?: ThemeName
    accent?: string
    negativeAccent?: string
    appearance?: "light" | "dark"
    decimals?: number
    locale?: string
    barSize?: number
    rowGap?: number
    barRadius?: number
    segmentGap?: number
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
 * Survey Chart — 줄마다 질문과 답변 단계별 응답 수를 넣으면 설문(리커트 척도) 결과를 누적 막대·가운데 기준 막대로 보여 주는 차트.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 760
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function SurveyChart(props: SurveyChartProps) {
    const {
        data = "",
        title = "Customer survey",
        subtitle = "",
        note = "",
        labels = "",
        firstColumn = "negative",
        view = "stacked",
        score = "positive",
        sort = "input",
        barLabels = "percent",
        showLegend = true,
        showSummary = true,
        positiveWord = "Positive",
        netWord = "Net",
        summaryWord = "on average",
        showTooltip = true,
        theme: themeName = "mint",
        accent = "#2DE5A0",
        negativeAccent = "#F2667A",
        appearance = "light",
        decimals = 0,
        locale = "en-US",
        barSize = 28,
        rowGap = 16,
        barRadius = 6,
        segmentGap = 2,
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
    const [width, setWidth] = useState(760 - 24 * 2)
    const [active, setActive] = useState<{ r: number; s: number } | null>(null)

    // ── 색 기본값: Appearance 에 따르고, Custom Colors 를 켰을 때만 입력값 사용 ──
    const cs = customColors ? colorProps : undefined
    const dark = appearance === "dark"
    const pair: [string, string] = themeName === "custom" ? [accent, negativeAccent] : THEMES[themeName] || THEMES.mint
    const theme = {
        background: cs?.background ?? (dark ? "#101114" : "rgba(255, 255, 255, 0)"),
        text: cs?.text ?? (dark ? "#F4F4F6" : "#111114"),
        muted: cs?.muted ?? (dark ? "#9A9AA6" : "#6B6B76"),
        positive: cs?.positive ?? pair[0],
        negative: cs?.negative ?? pair[1],
        neutral: cs?.neutral ?? (dark ? "#4A4C57" : "#D5D7DD"),
        tooltipBg: cs?.tooltipBg ?? (dark ? "#F4F4F6" : "#111114"),
        tooltipText: cs?.tooltipText ?? (dark ? "#111114" : "#FFFFFF"),
    }
    // 옅은 단계를 만들 때 섞는 바탕색 (배경이 투명하면 밝은/어두운 기본 바탕)
    const bgParsed = parseColor(theme.background)
    const surface = bgParsed && bgParsed[3] > 0.5 ? theme.background : dark ? "#101114" : "#FFFFFF"

    // ── 데이터 읽기 (비어 있으면 데모) → 줄마다 % · 긍정 · 부정 · 순점수 → 정렬 ──
    const dec = clamp(Math.round(Number(decimals)) || 0, 0, 2)
    const parsed = useMemo(() => {
        const p = parseData(data)
        const items = p.items.length ? p.items : DEMO
        const levels = p.items.length ? p.levels : 5
        const half = Math.floor(levels / 2)
        const list: Row[] = items.map((it, i) => {
            // 첫 칸이 긍정인 자료는 뒤집어, 안에서는 항상 부정 → 긍정 순서로 다룬다
            const counts = firstColumn === "positive" ? it.counts.slice().reverse() : it.counts
            const total = counts.reduce((a, b) => a + b, 0)
            const shares = counts.map((c) => (total > 0 ? (c / total) * 100 : 0))
            const pcts = roundShares(counts, total, dec)
            let positive: number | null = null
            let negative: number | null = null
            if (total > 0) {
                positive = 0
                negative = 0
                for (let k = 0; k < half; k++) {
                    negative += pcts[k]
                    positive += pcts[levels - 1 - k]
                }
            }
            const net = positive === null || negative === null ? null : positive - negative
            return { index: i, name: it.name, counts, total, shares, pcts, positive, negative, net }
        })
        if (sort === "score") {
            const val = (r: Row) => (score === "net" ? r.net : r.positive)
            list.sort((a, b) => (val(b) ?? -1e9) - (val(a) ?? -1e9) || a.index - b.index)
        }
        // 모든 줄의 합이 100 근처면 응답 수가 아니라 % 로 입력한 자료로 본다
        const percentInput = list.every((r) => r.total === 0 || Math.abs(r.total - 100) <= 1)
        return { rows: list, levels, half, percentInput }
    }, [data, firstColumn, sort, score, dec])
    const { rows, levels, half, percentInput } = parsed
    const n = rows.length

    // ── 답변 단계 이름: 입력한 만큼 쓰고 모자라면 기본 이름 ──
    const levelNames = useMemo(() => {
        const typed = parseLabels(labels)
        if (firstColumn === "positive") typed.reverse()
        const fallback = DEFAULT_LABELS[levels] || DEFAULT_LABELS[5]
        // 첫 칸이 긍정이면 입력한 이름이 뒤쪽(긍정)부터 채워지도록 맞춘다
        const offset = firstColumn === "positive" ? levels - typed.length : 0
        return fallback.map((d, i) => {
            const t = typed[i - offset]
            return t ? t : d
        })
    }, [labels, levels, firstColumn])

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
    // 막대가 CSS 전환(clip-path)으로 한 번 펼쳐진다. 프레임 루프(rAF)·반복 타이머 없음.
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
    const trans = (prop: string, delay: number) => (phase === "playing" ? `${prop} ${dur}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms` : "none")

    // ── 글꼴·글자 크기 ──
    const ts = clamp(Number(textScale) || 1, 0.5, 3)
    const fontCss: CSSProperties = font || {}
    const labelCss: CSSProperties = labelFont || {}
    const fs = Math.round(fontSizeOf(font, 15) * ts * 10) / 10
    const lfs = Math.round(fontSizeOf(labelFont, 13) * ts * 10) / 10
    const sfs = Math.round(lfs * 0.92 * 10) / 10 // 막대 안 숫자

    // ── 숫자 서식 ──
    const fmt = useMemo(() => {
        const cf = makeFormatter(locale, 1, false)
        const pf = makeFormatter(locale, dec, true)
        const pct = (v: number | null) => (v === null || !isFinite(v) ? "—" : pf(v) + "%")
        // 순점수: 부호를 붙인 숫자 (+42 / −8)
        const net = (v: number | null) => (v === null || !isFinite(v) ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "") + pf(Math.abs(v)))
        return { count: cf, pct, net }
    }, [locale, dec])
    const scoreOf = (r: Row) => (score === "net" ? r.net : r.positive)
    const scoreText = (r: Row) => (score === "net" ? fmt.net(r.net) : fmt.pct(r.positive))
    const scoreWord = score === "net" ? netWord : positiveWord

    // ── 답변 단계 색: 가운데에서 멀수록 진하게. 홀수 단계의 가운데는 중립색 ──
    const segColor = (i: number): string => {
        if (levels % 2 === 1 && i === half) return theme.neutral
        const neg = i < half
        const d = neg ? half - i : i - (levels - half) + 1 // 가운데에서 떨어진 칸 수 (1 = 가장 가까움)
        const t = half <= 1 ? 1 : 0.42 + (0.58 * (d - 1)) / (half - 1)
        return mixOver(surface, neg ? theme.negative : theme.positive, t)
    }

    // ── 가운데 기준 보기의 공통 축: 왼쪽 = 부정 + 중립 절반, 오른쪽 = 긍정 + 중립 절반 ──
    const leftOf = (r: Row) => {
        if (!(r.total > 0)) return 50
        let v = levels % 2 === 1 ? r.shares[half] / 2 : 0
        for (let k = 0; k < half; k++) v += r.shares[k]
        return v
    }
    const diverging = view === "diverging"
    let maxL = 0
    let maxR = 0
    for (const r of rows) {
        const l = leftOf(r)
        maxL = Math.max(maxL, l)
        maxR = Math.max(maxR, 100 - l)
    }
    const span = Math.max(1, maxL + maxR)
    const centerPct = (maxL / span) * 100 // 그림 영역에서 가운데 선의 위치(%)
    const wrapW = diverging ? (100 / span) * 100 : 100 // 막대 한 줄의 폭(%)
    const wrapL = (r: Row) => (diverging ? ((maxL - leftOf(r)) / span) * 100 : 0)

    // ── 배치 계산 ──
    const stackName = width < 480
    const colGap = Math.round(clamp(width * 0.025, 8, 16))
    const nameW = stackName ? width : Math.round(clamp(rows.reduce((mx, r) => Math.max(mx, textUnits(r.name)), 0) * lfs + 10, 90, width * 0.34))
    const scoreW = score !== "hide" ? Math.round(textUnits(score === "net" ? "+100.0" : "100.0%") * lfs * 1.2 + 4) : 0
    const plotX0 = stackName ? 0 : nameW + colGap
    const plotW = Math.max(60, width - plotX0 - (scoreW ? scoreW + colGap : 0))
    const barH = Math.round(clamp(Number(barSize) || 28, 8, 80) * Math.max(1, ts * 0.8))
    const br = clamp(Number(barRadius) || 0, 0, 40)
    const gap = clamp(Number(segmentGap) || 0, 0, 8)
    const rg = clamp(Number(rowGap) || 0, 0, 80) * Math.max(1, ts * 0.8)
    const wrapPx = (plotW * wrapW) / 100

    // ── 요약: 줄마다의 점수 평균 ──
    const scored = rows.filter((r) => scoreOf(r) !== null)
    const average = scored.length ? scored.reduce((a, r) => a + (scoreOf(r) || 0), 0) / scored.length : null
    const averageText = score === "net" ? fmt.net(average) : fmt.pct(average)

    // ── 키보드: 차트 전체가 탭 정지 1개, ↑↓ 로 질문, ←→ 로 답변 단계 이동 ──
    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        const keys = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Escape"]
        if (keys.indexOf(e.key) < 0) return
        e.preventDefault()
        if (e.key === "Escape") return setActive(null)
        if (active === null) return setActive({ r: e.key === "End" ? n - 1 : 0, s: levels - 1 })
        let r = active.r
        let s = active.s
        if (e.key === "ArrowDown") r = (r + 1) % n
        if (e.key === "ArrowUp") r = (r - 1 + n) % n
        if (e.key === "ArrowRight") s = (s + 1) % levels
        if (e.key === "ArrowLeft") s = (s - 1 + levels) % levels
        if (e.key === "Home") r = 0
        if (e.key === "End") r = n - 1
        setActive({ r, s })
    }
    const describe = (r: Row, s: number) => `${r.name}. ${levelNames[s]}: ${r.total > 0 ? fmt.pct(r.pcts[s]) : "—"}${score !== "hide" ? `. ${scoreWord}: ${scoreText(r)}` : ""}`
    const ariaSummary =
        (title ? title + ". " : "") +
        rows.map((r) => `${r.name}: ${r.total > 0 ? levelNames.map((l, i) => `${l} ${fmt.pct(r.pcts[i])}`).join(", ") : "no answers"}`).join(". ") +
        "."

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

    // 툴팁 (막대 위, 첫 줄은 아래). x 는 그림 영역 왼쪽 끝 기준 px
    const tooltip = (r: Row, s: number, x: number, below: boolean) => {
        if (!showTooltip) return null
        const lines = [r.name, `${levelNames[s]}: ${r.total > 0 ? fmt.pct(r.pcts[s]) : "—"}`]
        if (!percentInput && r.total > 0) lines.push(`${fmt.count(r.counts[s])} of ${fmt.count(r.total)}`)
        const estW = Math.min(lines.reduce((mx, t) => Math.max(mx, textUnits(t) * lfs), 0) + 24, Math.max(160, Math.min(width, 300)))
        // 컴포넌트 좌우 밖으로 나가지 않게 가운데 위치를 조정
        const left = clamp(x, estW / 2 - plotX0, Math.max(estW / 2 - plotX0, width - plotX0 - estW / 2))
        return (
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    left,
                    top: below ? barH + 8 : -8,
                    transform: below ? "translateX(-50%)" : "translate(-50%, -100%)",
                    width: estW,
                    boxSizing: "border-box",
                    background: theme.tooltipBg,
                    color: theme.tooltipText,
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: lfs,
                    lineHeight: 1.4,
                    pointerEvents: "none",
                    zIndex: 3,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                }}
            >
                <div style={{ fontWeight: 600 }}>{lines[0]}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: lfs * 0.7, height: lfs * 0.7, borderRadius: 2, background: segColor(s), flexShrink: 0 }} />
                    {lines[1]}
                </div>
                {lines[2] ? <div style={{ opacity: 0.75 }}>{lines[2]}</div> : null}
            </div>
        )
    }

    // 범례 (답변 단계 색) + 점수 열 머리글
    const hasHead = showLegend || score !== "hide"
    const headNode = hasHead ? (
        <div style={{ ...labelStyle, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: colGap, marginTop: title || subtitle ? Math.round(fs * 0.6) : 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: `4px ${Math.round(lfs * 1.1)}px`, minWidth: 0 }}>
                {showLegend
                    ? levelNames.map((l, i) => (
                          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: lfs * 0.8, height: lfs * 0.8, borderRadius: 3, background: segColor(i), display: "inline-block", flexShrink: 0 }} />
                              {l}
                          </span>
                      ))
                    : null}
            </div>
            {score !== "hide" ? <div style={{ flexShrink: 0, textAlign: "right", whiteSpace: "nowrap" }}>{scoreWord}</div> : null}
        </div>
    ) : null

    return (
        <div className="bu-survey" style={rootStyle} tabIndex={0} role="figure" aria-label={ariaSummary} onKeyDown={onKey} onBlur={() => setActive(null)}>
            <style>{`.bu-survey:focus-visible{box-shadow:0 0 0 2px ${theme.positive}}`}</style>
            <div ref={areaRef} style={{ width: "100%" }}>
                {title ? <div style={{ fontWeight: 650, fontSize: Math.round(fs * 1.15), lineHeight: 1.3 }}>{title}</div> : null}
                {subtitle ? <div style={{ ...labelStyle, marginTop: 4 }}>{subtitle}</div> : null}
                {headNode}
                <div style={{ height: title || subtitle || headNode ? Math.round(fs * 0.9) : 0 }} />

                <div onPointerLeave={() => setActive(null)}>
                    {rows.map((r, k) => {
                        const delay = k * stagger
                        const dim = active !== null && active.r !== k
                        const wl = wrapL(r)
                        const c = leftOf(r) // 이 줄 막대 안에서 가운데 선의 위치(%)
                        // 등장: Stacked 는 왼쪽에서, Diverging 은 가운데 선에서 양쪽으로 펼쳐진다
                        const clipHidden = diverging ? `inset(0% ${100 - c}% 0% ${c}%)` : "inset(0% 100% 0% 0%)"
                        const clipPath = hidden ? clipHidden : phase === "playing" ? "inset(0% 0% 0% 0%)" : undefined
                        // 0 이 아닌 칸의 처음·끝 (칸 사이 간격을 양 끝에는 두지 않기 위해)
                        let first = -1
                        let last = -1
                        r.shares.forEach((v, i) => {
                            if (v > 0) {
                                if (first < 0) first = i
                                last = i
                            }
                        })
                        let cum = 0
                        const starts = r.shares.map((v) => {
                            const s0 = cum
                            cum += v
                            return s0
                        })
                        const as = active !== null && active.r === k ? active.s : -1
                        return (
                            <div
                                key={r.index}
                                style={{
                                    display: "flex",
                                    flexDirection: stackName ? "column" : "row",
                                    alignItems: stackName ? "stretch" : "center",
                                    gap: stackName ? Math.round(lfs * 0.4) : colGap,
                                    marginTop: k ? rg : 0,
                                    opacity: dim ? 0.35 : 1,
                                    transition: phase === "done" ? "opacity 160ms ease" : "none",
                                }}
                            >
                                {/* 질문 */}
                                <div
                                    style={{
                                        ...labelCss,
                                        width: stackName ? "100%" : nameW,
                                        flexShrink: 0,
                                        fontSize: lfs,
                                        lineHeight: 1.3,
                                        color: theme.text,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}
                                >
                                    {r.name}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: colGap, minWidth: 0 }}>
                                    {/* 그림 영역 */}
                                    <div style={{ position: "relative", width: plotW, height: barH, flexShrink: 0 }}>
                                        {/* 가운데 기준선 (Diverging). 질문이 막대 위에 놓이는 좁은 폭에서는 글자를 가리지 않게 짧게 */}
                                        {diverging ? <div style={{ position: "absolute", left: `${centerPct}%`, top: stackName ? -3 : -rg / 2, bottom: stackName ? -3 : -rg / 2, width: 1, marginLeft: -0.5, background: withAlpha(theme.text, 0.28) }} /> : null}
                                        {/* 막대 한 줄 (등장: clip-path 로 한 번 펼침) */}
                                        <div
                                            data-bar=""
                                            style={{
                                                position: "absolute",
                                                left: `${wl}%`,
                                                width: `${wrapW}%`,
                                                top: 0,
                                                height: "100%",
                                                borderRadius: Math.min(br, barH / 2),
                                                overflow: "hidden",
                                                background: r.total > 0 ? "none" : withAlpha(theme.text, 0.08),
                                                clipPath,
                                                transition: trans("clip-path", delay),
                                            }}
                                        >
                                            {r.shares.map((v, i) => {
                                                if (!(v > 0)) return null
                                                const color = segColor(i)
                                                const text = barLabels === "count" ? fmt.count(r.counts[i]) : fmt.pct(r.pcts[i])
                                                const segPx = (wrapPx * v) / 100 - (i > first ? gap / 2 : 0) - (i < last ? gap / 2 : 0)
                                                // 숫자는 좌우 여백까지 들어갈 때만 막대 안에 쓴다 (좁은 칸은 툴팁·낭독으로 읽음)
                                                const fits = barLabels !== "hide" && segPx >= textUnits(text) * sfs * 1.1 + sfs * 0.9 && barH >= sfs * 1.2
                                                return (
                                                    <div
                                                        key={i}
                                                        onPointerEnter={() => setActive({ r: k, s: i })}
                                                        style={{
                                                            position: "absolute",
                                                            left: `${starts[i]}%`,
                                                            width: `${v}%`,
                                                            top: 0,
                                                            height: "100%",
                                                            boxSizing: "border-box",
                                                            paddingLeft: i > first ? gap / 2 : 0,
                                                            paddingRight: i < last ? gap / 2 : 0,
                                                            opacity: as >= 0 && as !== i ? 0.45 : 1,
                                                            transition: phase === "done" ? "opacity 160ms ease" : "none",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                ...labelCss,
                                                                width: "100%",
                                                                height: "100%",
                                                                background: color,
                                                                color: inkOn(color),
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: sfs,
                                                                fontWeight: 600,
                                                                lineHeight: 1,
                                                                fontVariantNumeric: "tabular-nums",
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            {fits ? text : null}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {as >= 0 ? tooltip(r, as, ((wl + (wrapW * (starts[as] + r.shares[as] / 2)) / 100) / 100) * plotW, k === 0) : null}
                                    </div>
                                    {/* 점수 (긍정 % 또는 순점수) */}
                                    {scoreW ? (
                                        <div
                                            style={{
                                                ...labelCss,
                                                width: scoreW,
                                                flexShrink: 0,
                                                textAlign: "right",
                                                fontSize: Math.round(lfs * 1.08 * 10) / 10,
                                                fontWeight: 650,
                                                lineHeight: 1,
                                                fontVariantNumeric: "tabular-nums",
                                                whiteSpace: "nowrap",
                                                color: theme.text,
                                                opacity: hidden ? 0 : 1,
                                                transition: trans("opacity", delay),
                                            }}
                                        >
                                            {scoreText(r)}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* 요약 + 메모 */}
                {(showSummary && score !== "hide") || note ? (
                    <div style={{ ...labelStyle, marginTop: Math.round(fs * 1.1), display: "flex", flexWrap: "wrap", gap: "2px 14px" }}>
                        {showSummary && score !== "hide" ? (
                            <span>
                                <b style={{ color: theme.text }}>{averageText}</b> {scoreWord.toLowerCase()} {summaryWord}
                            </span>
                        ) : null}
                        {note ? <span>{note}</span> : null}
                    </div>
                ) : null}
                <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    {active !== null && rows[active.r] ? describe(rows[active.r], active.s) : ""}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(SurveyChart, {
    data: {
        type: ControlType.String,
        title: "Data",
        defaultValue: "",
        placeholder: "Easy to use, 6, 14, 30, 142, 108\nFair price, 33, 69, 72, 90, 36",
        displayTextArea: true,
        description: "One question per line: question, then the number of answers (or %) for each option. 2 to 7 options. Leave empty to show demo data.",
    },
    title: { type: ControlType.String, title: "Title", defaultValue: "Customer survey", placeholder: "Optional" },
    subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "", placeholder: "Optional" },
    note: { type: ControlType.String, title: "Note", defaultValue: "", placeholder: "300 responses" },
    labels: {
        type: ControlType.String,
        title: "Options",
        defaultValue: "",
        placeholder: "Strongly disagree, Disagree, Neutral, Agree, Strongly agree",
        description: "Names of the answer options, in the same order as your data columns. Leave empty for the default names.",
    },
    firstColumn: {
        type: ControlType.Enum,
        title: "First Column",
        options: ["negative", "positive"],
        optionTitles: ["Negative", "Positive"],
        defaultValue: "negative",
        displaySegmentedControl: true,
        description: "Which end of the scale your first number is.",
    },
    view: {
        type: ControlType.Enum,
        title: "View",
        options: ["stacked", "diverging"],
        optionTitles: ["Stacked", "Diverging"],
        defaultValue: "stacked",
        displaySegmentedControl: true,
        description: "Diverging lines every row up on the middle of the scale.",
    },
    score: {
        type: ControlType.Enum,
        title: "Score",
        options: ["positive", "net", "hide"],
        optionTitles: ["Positive", "Net", "Hide"],
        defaultValue: "positive",
        displaySegmentedControl: true,
        description: "Positive is the share of positive answers. Net is positive minus negative.",
    },
    sort: { type: ControlType.Enum, title: "Sort", options: ["input", "score"], optionTitles: ["As Typed", "By Score"], defaultValue: "input", displaySegmentedControl: true },
    barLabels: { type: ControlType.Enum, title: "Bar Labels", options: ["percent", "count", "hide"], optionTitles: ["Percent", "Count", "Hide"], defaultValue: "percent", displaySegmentedControl: true },
    showLegend: { type: ControlType.Boolean, title: "Legend", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showSummary: { type: ControlType.Boolean, title: "Summary", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide", hidden: (p: SurveyChartProps) => p.score === "hide" },
    positiveWord: { type: ControlType.String, title: "Positive Text", defaultValue: "Positive", description: "Translate these for other languages.", hidden: (p: SurveyChartProps) => p.score === "hide" },
    netWord: { type: ControlType.String, title: "Net Text", defaultValue: "Net", hidden: (p: SurveyChartProps) => p.score === "hide" },
    summaryWord: { type: ControlType.String, title: "Summary Text", defaultValue: "on average", hidden: (p: SurveyChartProps) => p.score === "hide" || p.showSummary === false },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    theme: {
        type: ControlType.Enum,
        title: "Color",
        options: ["mint", "blue", "green", "purple", "teal", "custom"],
        optionTitles: ["Mint / Coral", "Blue / Orange", "Green / Red", "Purple / Amber", "Teal / Pink", "Custom"],
        defaultValue: "mint",
    },
    accent: { type: ControlType.Color, title: "Positive", defaultValue: "#2DE5A0", hidden: (p: SurveyChartProps) => p.theme !== "custom" },
    negativeAccent: { type: ControlType.Color, title: "Negative", defaultValue: "#F2667A", hidden: (p: SurveyChartProps) => p.theme !== "custom" },
    appearance: { type: ControlType.Enum, title: "Appearance", options: ["light", "dark"], optionTitles: ["Light", "Dark"], defaultValue: "light", displaySegmentedControl: true },
    decimals: { type: ControlType.Number, title: "% Decimals", defaultValue: 0, min: 0, max: 2, step: 1, displayStepper: true, description: "Each row always adds up to 100%." },
    locale: { type: ControlType.String, title: "Locale", defaultValue: "en-US", placeholder: "en-US, de-DE, ja-JP…" },
    barSize: { type: ControlType.Number, title: "Bar Height", defaultValue: 28, min: 8, max: 80, step: 1, unit: "px" },
    rowGap: { type: ControlType.Number, title: "Row Gap", defaultValue: 16, min: 0, max: 80, step: 1, unit: "px" },
    barRadius: { type: ControlType.Number, title: "Bar Radius", defaultValue: 6, min: 0, max: 40, step: 1, unit: "px" },
    segmentGap: { type: ControlType.Number, title: "Segment Gap", defaultValue: 2, min: 0, max: 8, step: 1, unit: "px" },
    textScale: { type: ControlType.Number, title: "Text Scale", defaultValue: 1, min: 0.5, max: 3, step: 0.05, unit: "×" },
    customColors: { type: ControlType.Boolean, title: "Colors", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Preset" },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        hidden: (p: SurveyChartProps) => !p.customColors,
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            muted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#6B6B76" },
            positive: { type: ControlType.Color, title: "Positive", defaultValue: "#2DE5A0" },
            negative: { type: ControlType.Color, title: "Negative", defaultValue: "#F2667A" },
            neutral: { type: ControlType.Color, title: "Neutral", defaultValue: "#D5D7DD" },
            tooltipBg: { type: ControlType.Color, title: "Tooltip", defaultValue: "#111114" },
            tooltipText: { type: ControlType.Color, title: "Tooltip Text", defaultValue: "#FFFFFF" },
        },
    },
    animate: { type: ControlType.Boolean, title: "Animate In", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 900, min: 200, max: 4000, step: 50, unit: "ms", hidden: (p: SurveyChartProps) => !p.animate },
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
