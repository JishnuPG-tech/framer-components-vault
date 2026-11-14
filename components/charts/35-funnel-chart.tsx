// [생성일] 2026-11-13
// [경위] 달러벌기 35번 상품: 단계 이름과 숫자만 넣으면 전환율·이탈을 자동 계산해 그리는 퍼널 차트. 모양 3종·두 기간 비교·최대 이탈 강조·숫자 서식·툴팁·부모 너비 맞춤
// [변경이력]
//   - 2026-11-13: 최초 생성 (단계 줄 목록 입력 · 빈 데이터면 SaaS 가입 퍼널 데모 · 모양 Funnel/Bars/Steps · 단계 전환율/첫 단계 대비 · 이탈 수·이탈률 · 최대 이탈 강조 · 두 번째 값 열로 기간 비교(증감 표시/겹쳐 그리기) · 요약 3종 · 숫자 서식(접두·접미·k/M·소수·Locale) · 색 테마 7종+직접 색 · 단색/농담/팔레트 · 툴팁 · 방향키 탐색 · 좁으면 라벨을 막대 아래로 · 등장 1회 + 숫자 카운트업 · 정적·캔버스 완성 상태)

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
type Rgb = [number, number, number]

interface Colors {
    background?: string
    text?: string
    muted?: string
    track?: string
    positive?: string
    negative?: string
    tooltipBg?: string
    tooltipText?: string
}

// 입력 한 줄 = 단계 하나 (prev 는 비교할 이전 기간 값, 없으면 null)
interface Stage {
    name: string
    value: number
    prev: number | null
}

// 계산이 끝난 단계
interface Row extends Stage {
    index: number
    stepRate: number | null // 바로 앞 단계 대비 전환율 (값 ÷ 앞 단계 값)
    firstRate: number | null // 첫 단계 대비 비율 (값 ÷ 첫 단계 값)
    drop: number | null // 앞 단계에서 빠진 수 (앞 단계 값 − 값)
    dropRate: number | null // 이탈률 (1 − 단계 전환율)
    change: number | null // 이전 기간 대비 증감률 ((값 − 이전 값) ÷ 이전 값)
}

type ThemeName = "mint" | "green" | "blue" | "purple" | "orange" | "pink" | "mono" | "custom"
type Shape = "funnel" | "bars" | "steps"

const MAX_LINES = 200
const MAX_STAGES = 12
const MIN_BAR = 6 // 값이 아주 작아도 도형이 사라지지 않게 하는 최소 크기(px)

// 색 테마별 대표색
const ACCENTS: Record<string, string> = {
    mint: "#2DE5A0",
    green: "#2DA44E",
    blue: "#3B82F6",
    purple: "#8B5CF6",
    orange: "#F97316",
    pink: "#EC4899",
}
// 팔레트 모드에서 단계마다 돌아가며 쓰는 순서
const PALETTE_ORDER = ["mint", "blue", "purple", "pink", "orange", "green"]

// 데이터가 비었을 때 보여 주는 데모: SaaS 가입 퍼널 (이번 달, 지난달)
const DEMO: Stage[] = [
    { name: "Visitors", value: 12400, prev: 10900 },
    { name: "Signups", value: 3720, prev: 3050 },
    { name: "Activated", value: 1860, prev: 1980 },
    { name: "Paid", value: 620, prev: 410 },
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

// 색에 투명도를 입힌다 (빗금·옅은 바탕용)
function withAlpha(c: string, a: number): string {
    const p = parseColor(c)
    if (!p) return c
    return `rgba(${Math.round(p[0])}, ${Math.round(p[1])}, ${Math.round(p[2])}, ${Math.round(p[3] * a * 1000) / 1000})`
}

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
}

function easeOut(x: number) {
    return 1 - Math.pow(1 - x, 3)
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

// 숫자 한 칸 읽기: 통화 기호·% ·공백은 무시, 12.4k / 1.2M 같은 줄임 표기 허용. 숫자가 아니면 null
// allowComma: 탭·세미콜론으로 나눈 칸에서는 12,400 의 쉼표(천 단위)를 지워 준다
function parseNumber(raw: string, allowComma: boolean): number | null {
    let t = raw.replace(/[\s$€£¥₩%_]/g, "")
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

// 입력 글자를 단계 목록으로 바꾼다.
// 한 줄 = "Signups, 3720" 또는 "Signups, 3720, 3050"(두 번째 숫자 = 비교할 이전 기간 값).
// 구분: 쉼표, 또는 스프레드시트에서 붙여넣은 탭(세미콜론·| 도 가능). 공백만으로 나눈 줄은 마지막 숫자 하나만 값으로 읽는다.
// 숫자가 없는 줄(머리글 등)은 건너뛴다.
function parseData(text: string): Stage[] {
    const out: Stage[] = []
    if (typeof text !== "string" || !text.trim()) return out
    const lines = text.split(/\r?\n/).slice(0, MAX_LINES)
    for (let i = 0; i < lines.length && out.length < MAX_STAGES; i++) {
        const line = lines[i].trim()
        if (!line) continue
        const strong = /[\t;|]/.test(line)
        let cells = (strong ? line.split(/[\t;|]/) : line.split(",")).map((c) => c.trim())
        while (cells.length > 1 && cells[cells.length - 1] === "") cells.pop()
        let joiner = ", "
        let maxNums = 2
        if (cells.length === 1) {
            cells = cells[0].split(/\s+/)
            joiner = " "
            maxNums = 1
        }
        const nums: number[] = []
        let end = cells.length
        while (end > 0 && nums.length < maxNums) {
            // 첫 칸은 숫자처럼 보여도 이름으로 남긴다 (칸이 하나뿐일 때만 값으로 읽음)
            if (end - 1 === 0 && cells.length > 1) break
            const n = parseNumber(cells[end - 1], strong)
            if (n === null) break
            nums.unshift(n)
            end--
        }
        if (!nums.length) continue
        const name = cells.slice(0, end).join(joiner).trim() || `Stage ${out.length + 1}`
        out.push({ name, value: nums[0], prev: nums.length > 1 ? nums[1] : null })
    }
    return out
}

// 단계별 전환율·이탈과 전체 요약을 계산한다
function buildModel(stages: Stage[]) {
    const first = stages[0].value
    const rows: Row[] = stages.map((s, i) => {
        const before = i > 0 ? stages[i - 1].value : null
        const stepRate = before !== null && before > 0 ? s.value / before : null
        return {
            ...s,
            index: i,
            stepRate,
            firstRate: first > 0 ? s.value / first : null,
            drop: before !== null ? before - s.value : null,
            dropRate: stepRate !== null ? 1 - stepRate : null,
            change: s.prev !== null && s.prev > 0 ? (s.value - s.prev) / s.prev : null,
        }
    })
    // 가장 큰 이탈 = 이탈률이 가장 높은 단계 (같으면 앞 단계)
    let biggest = -1
    let worst = 0
    for (let i = 1; i < rows.length; i++) {
        const d = rows[i].dropRate
        if (d !== null && d > worst + 1e-12) {
            worst = d
            biggest = i
        }
    }
    const n = rows.length
    const last = rows[n - 1]
    const p0 = rows[0].prev
    const pn = last.prev
    return {
        rows,
        biggest,
        overall: n > 1 && first > 0 ? last.value / first : null,
        lost: n > 1 ? first - last.value : null,
        hasPrev: rows.some((r) => r.prev !== null),
        prevOverall: n > 1 && p0 !== null && pn !== null && p0 > 0 ? pn / p0 : null,
    }
}

// 로케일 숫자 서식 (잘못된 로케일 코드는 en-US 로 대체)
function makeFormatter(locale: string, decimals: number): (n: number) => string {
    const d = clamp(Math.round(decimals) || 0, 0, 6)
    const opt = { minimumFractionDigits: d, maximumFractionDigits: d }
    try {
        const nf = new Intl.NumberFormat((locale || "").trim() || "en-US", opt)
        return (n: number) => nf.format(n)
    } catch (e) {
        const nf = new Intl.NumberFormat("en-US", opt)
        return (n: number) => nf.format(n)
    }
}

// 줄임 표기 단위: 목표값 기준으로 정한다 (카운트업 도중 k↔M 이 바뀌지 않게)
function compactUnit(target: number): { div: number; unit: string } {
    const a = Math.abs(target)
    if (a >= 1e9) return { div: 1e9, unit: "B" }
    if (a >= 1e6) return { div: 1e6, unit: "M" }
    if (a >= 1e3) return { div: 1e3, unit: "k" }
    return { div: 1, unit: "" }
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface FunnelChartProps {
    data?: string
    title?: string
    shape?: Shape
    compare?: "off" | "change" | "overlay"
    currentLabel?: string
    previousLabel?: string
    changeLabel?: string
    theme?: ThemeName
    accent?: string
    colorMode?: "solid" | "shades" | "palette"
    appearance?: "light" | "dark"
    rate?: "previous" | "first" | "none"
    dropOff?: "none" | "count" | "percent" | "both"
    highlightDrop?: boolean
    dropArea?: boolean
    showSummary?: boolean
    overallLabel?: string
    lostLabel?: string
    biggestLabel?: string
    prefix?: string
    suffix?: string
    compact?: boolean
    decimals?: number
    rateDecimals?: number
    locale?: string
    showLegend?: boolean
    showTooltip?: boolean
    stepWord?: string
    firstWord?: string
    dropWord?: string
    barHeight?: number
    columnHeight?: number
    gap?: number
    barRadius?: number
    textScale?: number
    customColors?: boolean
    colors?: Colors
    animate?: boolean
    countUp?: boolean
    duration?: number
    radius?: number
    padding?: number
    font?: CSSProperties
    labelFont?: CSSProperties
    style?: CSSProperties
}

/**
 * Funnel Chart — 단계 이름과 숫자만 넣으면 전환율·이탈을 계산해 그리는 퍼널 차트. 모양 3종, 두 기간 비교, 최대 이탈 강조, 요약·범례·툴팁 포함.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function FunnelChart(props: FunnelChartProps) {
    const {
        data = "",
        title = "Signup funnel",
        shape = "funnel",
        compare = "change",
        currentLabel = "This month",
        previousLabel = "Last month",
        changeLabel = "Change vs last month",
        theme: themeName = "mint",
        accent = "#2DE5A0",
        colorMode = "shades",
        appearance = "light",
        rate = "previous",
        dropOff = "count",
        highlightDrop = true,
        dropArea = false,
        showSummary = true,
        overallLabel = "Overall conversion",
        lostLabel = "Total drop-off",
        biggestLabel = "Biggest drop",
        prefix = "",
        suffix = "",
        compact = false,
        decimals = 0,
        rateDecimals = 1,
        locale = "en-US",
        showLegend = true,
        showTooltip = true,
        stepWord = "of previous step",
        firstWord = "of first step",
        dropWord = "dropped",
        barHeight = 56,
        columnHeight = 220,
        gap = 6,
        barRadius = 8,
        textScale = 1,
        customColors = false,
        colors: colorProps,
        animate = true,
        countUp = true,
        duration = 700,
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
    // (프레이머는 기본값 없는 Color 컨트롤을 파란색으로 채워 넘기므로 토글로 분리)
    const cs = customColors ? colorProps : undefined
    const dark = appearance === "dark"
    const theme = {
        background: cs?.background ?? (dark ? "#101114" : "rgba(255, 255, 255, 0)"),
        text: cs?.text ?? (dark ? "#F4F4F6" : "#111114"),
        muted: cs?.muted ?? (dark ? "#9A9AA6" : "#6B6B76"),
        track: cs?.track ?? (dark ? "rgba(255, 255, 255, 0.08)" : "rgba(17, 17, 20, 0.06)"),
        positive: cs?.positive ?? (dark ? "#3DD68C" : "#0B7F4A"),
        negative: cs?.negative ?? (dark ? "#FF6B6B" : "#D92D20"),
        tooltipBg: cs?.tooltipBg ?? (dark ? "#F4F4F6" : "#111114"),
        tooltipText: cs?.tooltipText ?? (dark ? "#111114" : "#FFFFFF"),
    }

    // ── 데이터 읽기 (비어 있으면 데모) → 전환율·이탈 계산 ──
    const model = useMemo(() => {
        const parsed = parseData(data)
        return buildModel(parsed.length ? parsed : DEMO)
    }, [data])
    const rows = model.rows
    const n = rows.length
    const cmpOn = compare !== "off" && model.hasPrev
    const overlay = cmpOn && compare === "overlay"

    // ── 단계 색: 단색 / 농담(대표색 하나에서 옅은 색 → 대표색) / 팔레트(단계마다 다른 색) ──
    const tones = useMemo(() => {
        const bg = parseColor(theme.background)
        const surface: Rgb = bg && bg[3] > 0.5 ? [bg[0], bg[1], bg[2]] : dark ? [16, 17, 20] : [255, 255, 255]
        const textRgb = toRgb(theme.text, dark ? [244, 244, 246] : [17, 17, 20])
        const base = themeName === "custom" ? accent : themeName === "mono" ? theme.text : ACCENTS[themeName] || ACCENTS.mint
        const acc = toRgb(base, [45, 229, 160])
        const stage: string[] = []
        // 팔레트: 고른 색에서 시작해 정해진 순서로 돈다 (Mono 는 색이 없으므로 농담으로 대신)
        const start = PALETTE_ORDER.indexOf(themeName)
        for (let i = 0; i < n; i++) {
            if (colorMode === "palette" && themeName !== "mono") {
                if (themeName === "custom") stage.push(i === 0 ? mix(acc, acc, 0) : ACCENTS[PALETTE_ORDER[i % PALETTE_ORDER.length]])
                else stage.push(ACCENTS[PALETTE_ORDER[(Math.max(0, start) + i) % PALETTE_ORDER.length]])
            } else if (colorMode === "solid") {
                stage.push(mix(acc, acc, 0))
            } else {
                // 농담: 넓은 첫 단계는 옅게, 좁은 마지막 단계는 대표색 그대로 → 결과 단계가 눈에 띈다
                stage.push(mix(surface, acc, 0.38 + 0.62 * (n > 1 ? i / (n - 1) : 1)))
            }
        }
        // 이전 기간(비교) 도형 색: 바탕과 글자색 사이의 중립 회색
        return { stage, ghost: mix(surface, textRgb, 0.22), ghostLine: mix(surface, textRgb, 0.55), main: colorMode === "palette" && themeName !== "mono" ? stage[0] : stage[n - 1] }
    }, [theme.background, theme.text, dark, themeName, accent, colorMode, n])

    // ── 부모(컨테이너) 너비 측정: 창 너비가 아니라 이 컴포넌트가 실제로 받은 너비에 맞춘다 ──
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

    // ── 등장 애니메이션 (한 번만, 화면에 보일 때 시작) ──
    // 정적 렌더·캔버스·화면 밖·모션 줄이기 설정에서는 완성된 상태를 즉시 보여줌. 반복 애니메이션은 없음
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const canAnimate = animate && !isStatic && !isCanvas
    const dur = clamp(Math.round(duration) || 700, 100, 4000)
    const stagger = Math.min(120, Math.round(dur * 0.15))
    const total = dur + stagger * (n - 1)
    const [phase, setPhase] = useState<"done" | "hidden" | "playing">("done")
    const [elapsed, setElapsed] = useState(0)
    useEffect(() => {
        const rm = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const el = areaRef.current
        if (!canAnimate || rm || !el || typeof IntersectionObserver === "undefined") {
            startTransition(() => setPhase("done"))
            return
        }
        startTransition(() => {
            setElapsed(0)
            setPhase("hidden")
        })
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
                    // 재생 도중 화면 밖으로 나가면 바로 완성 상태로 넘긴다 (화면 밖에서는 아무것도 돌지 않게)
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

    // ── 숫자 카운트업: 등장하는 동안에만 프레임 루프를 돌리고, 끝나거나 화면 밖으로 나가면 멈춘다 ──
    useEffect(() => {
        if (phase !== "playing" || !countUp) return
        let raf = 0
        let start = 0
        const tick = (now: number) => {
            if (!start) start = now
            const e = now - start
            // 매 프레임 갱신은 startTransition 으로 감싸면 숫자가 끊겨 보이므로 직접 set
            setElapsed(e)
            if (e < total) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [phase, countUp, total])

    const delayOf = (i: number) => Math.round(i * stagger)
    // 단계 i 의 숫자 진행도 (0~1)
    const progressOf = (i: number) => {
        if (phase === "done" || !countUp) return 1
        if (phase === "hidden") return 0
        return easeOut(clamp((elapsed - i * stagger) / dur, 0, 1))
    }

    // ── 글꼴·글자 크기 (Text Scale 로 전체 글자를 한 번에 키우거나 줄임) ──
    const ts = clamp(Number(textScale) || 1, 0.5, 3)
    const fontCss: CSSProperties = font || {}
    const labelCss: CSSProperties = labelFont || {}
    const fs = Math.round(fontSizeOf(font, 15) * ts * 10) / 10
    const lfs = Math.round(fontSizeOf(labelFont, 12) * ts * 10) / 10
    const vfs = Math.round(fs * 1.2)

    // ── 숫자 서식 ──
    const fmt = useMemo(() => {
        const cache: Record<number, (n: number) => string> = {}
        const nf = (d: number) => cache[d] || (cache[d] = makeFormatter(locale, d))
        const rateNf = makeFormatter(locale, rateDecimals)
        // 값 → 표시 문자열. target 은 줄임 단위를 정하는 기준값(카운트업 중에도 단위가 바뀌지 않게)
        const value = (v: number, target: number): string => {
            let x = v
            let unit = ""
            let d = decimals
            if (compact) {
                const u = compactUnit(target)
                if (u.div > 1) {
                    x = v / u.div
                    unit = u.unit
                    // 줄임 표기는 소수 1자리 기본, 가수가 100 이상이면 정수 (12.4k, 620k, 1.3M)
                    d = Math.abs(target / u.div) >= 100 ? 0 : Math.max(Math.round(decimals) || 0, 1)
                }
            }
            return (x < 0 ? "−" : "") + (prefix || "") + nf(d)(Math.abs(x)) + unit + (suffix || "")
        }
        const pct = (r: number | null): string => (r === null || !isFinite(r) ? "—" : rateNf(r * 100) + "%")
        // 이전 기간 대비 증감: ▲ 13.8% / ▼ 6.1% / 0.0%
        const change = (c: number): { text: string; dir: number } => {
            const s = rateNf(Math.abs(c) * 100)
            const zero = rateNf(0)
            if (s === zero) return { text: s + "%", dir: 0 }
            return { text: (c > 0 ? "▲ " : "▼ ") + s + "%", dir: c > 0 ? 1 : -1 }
        }
        return { value, pct, change }
    }, [locale, decimals, rateDecimals, compact, prefix, suffix])

    // 이탈 표시 문자열: −8,680 / −70.0% / −8,680 (70.0%). 값이 늘어난 단계는 + 로 표시
    const dropText = (r: Row): string => {
        if (dropOff === "none" || r.drop === null) return ""
        const sign = r.drop > 0 ? "−" : r.drop < 0 ? "+" : ""
        const count = sign + fmt.value(Math.abs(r.drop), Math.abs(r.drop))
        const rateStr = r.dropRate === null ? "" : fmt.pct(Math.abs(r.dropRate))
        if (dropOff === "count") return count
        if (dropOff === "percent") return rateStr ? sign + rateStr : ""
        return rateStr ? `${count} (${rateStr})` : count
    }
    // 전환율 표시 문자열 (Rate 설정에 따라 앞 단계 대비 또는 첫 단계 대비)
    const rateText = (r: Row): string => {
        if (rate === "none") return ""
        if (rate === "first") return fmt.pct(r.firstRate)
        return r.index === 0 ? "" : fmt.pct(r.stepRate)
    }

    // ── 배치 계산: 받은 너비에서 이름 칸·도형 칸·전환율 칸의 너비를 정하고, 좁으면 라벨을 도형 아래로 내린다 ──
    const g = Math.max(0, gap)
    const bh = clamp(Math.round(barHeight) || 56, 12, 400)
    const br = Math.max(0, barRadius)
    const showMeta = rate !== "none" || dropOff !== "none"
    const chipLen = cmpOn ? rows.reduce((mx, r) => Math.max(mx, r.change === null ? 0 : fmt.change(r.change).text.length), 0) : 0
    const nameW = rows.reduce((mx, r) => Math.max(mx, textUnits(r.name)), 0) * lfs
    const valueW = rows.reduce((mx, r) => Math.max(mx, fmt.value(r.value, r.value).length), 0) * vfs * 0.62 + (chipLen ? 6 + chipLen * lfs * 0.62 : 0)
    const labelW = Math.round(clamp(Math.max(nameW, valueW) + 6, 56, Math.max(56, width * 0.38)))
    const metaTextW = Math.max(
        rows.reduce((mx, r) => Math.max(mx, rateText(r).length), 0) * fs * 0.62,
        rows.reduce((mx, r) => Math.max(mx, dropText(r).length), 0) * lfs * 0.6
    )
    const metaW = showMeta ? Math.round(clamp(metaTextW + 6, 40, Math.max(40, width * 0.28))) : 0
    const colGap = Math.round(clamp(width * 0.03, 10, 20))
    const wideGw = width - labelW - colGap - (metaW ? metaW + colGap : 0)
    // 세로 막대(Steps)는 막대 하나의 폭이 너무 좁아지면 가로 막대(Bars)로 바꿔 그린다
    const stepGap = Math.max(8, g * 2)
    const stepsFit = (width - stepGap * (n - 1)) / n >= 76 * Math.max(1, ts)
    const view: Shape = shape === "steps" && !stepsFit ? "bars" : shape
    const stacked = view !== "steps" && (wideGw < 170 || width < 380)
    const gw = Math.max(40, stacked ? width : wideGw)
    // 넓은 화면의 Funnel 은 조각이 위아래로 이어져 보이도록 줄 높이를 글자 두 줄 높이 이상으로 맞춘다
    const textBlockH = Math.ceil((lfs + vfs) * 1.25) + 2
    const segH = stacked ? bh : Math.max(bh, textBlockH)

    // 도형 크기 비율: 가장 큰 값을 1로 (겹쳐 그리기에서는 이전 기간 값도 포함)
    const scaleMax = rows.reduce((mx, r) => Math.max(mx, r.value, overlay && r.prev !== null ? r.prev : 0), 0)
    const frac = (v: number) => (scaleMax > 0 ? clamp(v / scaleMax, 0, 1) : 0)

    // ── 마우스·터치·키보드로 단계 고르기 ──
    const pick = (i: number | null) => {
        if (i !== active) startTransition(() => setActive(i))
    }
    // 키보드: 차트에 초점을 두고 방향키로 단계 이동 (↓→ 다음, ↑← 이전, Home/End 처음/끝, Esc 닫기)
    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") return pick(null)
        let next: number | null = null
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = active === null ? 0 : Math.min(n - 1, active + 1)
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = active === null ? n - 1 : Math.max(0, active - 1)
        else if (e.key === "Home") next = 0
        else if (e.key === "End") next = n - 1
        if (next === null) return
        e.preventDefault()
        pick(next)
    }

    // ── 등장 효과 스타일 ──
    // 도형 묶음: 등장 중에는 서서히 나타나고, 끝난 뒤에는 고른 단계만 진하게(나머지는 흐리게)
    const shellStyle = (i: number): CSSProperties =>
        phase === "done"
            ? { opacity: active !== null && active !== i ? 0.45 : 1, transition: "opacity 0.15s ease" }
            : { opacity: phase === "hidden" ? 0 : 1, transition: phase === "playing" ? `opacity ${Math.round(dur * 0.5)}ms ease ${delayOf(i)}ms` : "none" }
    // 도형 본체: 가로 막대는 왼쪽에서, 세로 막대는 아래에서, 퍼널 조각은 가운데에서 한 번 차오른다
    const growStyle = (i: number, mode: "x" | "y" | "center"): CSSProperties => {
        if (phase === "done") return {}
        const from = mode === "y" ? "scaleY(0)" : mode === "x" ? "scaleX(0)" : "scaleX(0.25)"
        const to = mode === "y" ? "scaleY(1)" : "scaleX(1)"
        return {
            transformOrigin: mode === "y" ? "50% 100%" : mode === "x" ? "0% 50%" : "50% 50%",
            transform: phase === "hidden" ? from : to,
            transition: phase === "playing" ? `transform ${dur}ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delayOf(i)}ms` : "none",
        }
    }
    const textStyle = (i: number): CSSProperties =>
        phase === "done"
            ? {}
            : { opacity: phase === "hidden" ? 0 : 1, transition: phase === "playing" ? `opacity ${Math.round(dur * 0.5)}ms ease ${delayOf(i) + Math.round(dur * 0.2)}ms` : "none" }
    // 이탈 영역(빗금): 도형이 거의 다 차오른 뒤에 나타난다
    const lateStyle = (i: number): CSSProperties =>
        phase === "done"
            ? {}
            : { opacity: phase === "hidden" ? 0 : 1, transition: phase === "playing" ? `opacity ${Math.round(dur * 0.3)}ms ease ${delayOf(i) + Math.round(dur * 0.7)}ms` : "none" }

    // 빗금 무늬 (이탈 영역 표시용)
    const hatch = (color: string): string =>
        `repeating-linear-gradient(135deg, ${withAlpha(color, 0.5)} 0px, ${withAlpha(color, 0.5)} 1.5px, ${withAlpha(color, 0.1)} 1.5px, ${withAlpha(color, 0.1)} 6px)`
    // 이 단계의 이탈 영역을 그릴지, 무슨 색으로 그릴지 (최대 이탈은 강조색)
    const isBiggest = (i: number) => highlightDrop && model.biggest === i
    const lostColor = (i: number): string | null => {
        const d = rows[i] && rows[i].drop
        if (i < 1 || !d || d <= 0) return null
        if (isBiggest(i)) return theme.negative
        return dropArea ? theme.muted : null
    }

    // ── 공통 조각: 이름 + 값(+증감) ──
    const ellipsis: CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
    const labelBlock = (r: Row) => {
        const ch = cmpOn && r.change !== null ? fmt.change(r.change) : null
        return (
            <div style={{ minWidth: 0, ...textStyle(r.index) }}>
                <div style={{ ...labelCss, fontSize: lfs, lineHeight: "1.25em", color: theme.muted, ...ellipsis }}>{r.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: Math.round(lfs * 0.5), minWidth: 0 }}>
                    <span style={{ ...fontCss, fontSize: vfs, lineHeight: "1.25em", color: theme.text, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {fmt.value(r.value * progressOf(r.index), r.value)}
                    </span>
                    {ch && (
                        <span style={{ ...labelCss, fontSize: lfs, lineHeight: "1.25em", color: ch.dir > 0 ? theme.positive : ch.dir < 0 ? theme.negative : theme.muted, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                            {ch.text}
                        </span>
                    )}
                </div>
            </div>
        )
    }
    // ── 공통 조각: 전환율 + 이탈 ──
    const metaBlock = (r: Row, align: "left" | "right") => {
        const rt = rateText(r)
        const dt = dropText(r)
        if (!rt && !dt) return null
        const hot = isBiggest(r.index)
        return (
            <div style={{ minWidth: 0, textAlign: align, ...textStyle(r.index) }}>
                {rt ? <div style={{ ...fontCss, fontSize: fs, lineHeight: "1.25em", color: theme.text, fontVariantNumeric: "tabular-nums", ...ellipsis }}>{rt}</div> : null}
                {dt ? (
                    <div style={{ ...labelCss, fontSize: lfs, lineHeight: "1.25em", color: hot ? theme.negative : theme.muted, fontVariantNumeric: "tabular-nums", ...ellipsis }}>{dt}</div>
                ) : null}
            </div>
        )
    }

    // ── 툴팁 내용 ──
    const tipLines = (r: Row): string[] => {
        const lines: string[] = []
        if (r.index > 0) {
            if (r.stepRate !== null) lines.push(`${fmt.pct(r.stepRate)} ${stepWord || ""}`.trim())
            if (r.firstRate !== null) lines.push(`${fmt.pct(r.firstRate)} ${firstWord || ""}`.trim())
            if (r.drop !== null && r.drop > 0) lines.push(`${fmt.value(r.drop, r.drop)} ${dropWord || ""}`.trim() + (r.dropRate !== null ? ` (${fmt.pct(r.dropRate)})` : ""))
        }
        if (cmpOn && r.prev !== null) {
            const head = (previousLabel || "").trim()
            lines.push((head ? head + ": " : "") + fmt.value(r.prev, r.prev) + (r.change !== null ? ` (${fmt.change(r.change).text})` : ""))
        }
        if (isBiggest(r.index) && biggestLabel && biggestLabel.trim()) lines.push(biggestLabel.trim())
        return lines
    }
    const tipBox = (r: Row, pos: CSSProperties) => (
        <div
            style={{
                position: "absolute",
                ...pos,
                background: theme.tooltipBg,
                color: theme.tooltipText,
                borderRadius: 8,
                padding: "8px 11px",
                pointerEvents: "none",
                whiteSpace: "nowrap",
                zIndex: 3,
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                textAlign: "left",
            }}
        >
            <span style={{ ...labelCss, fontSize: lfs, lineHeight: "1.3em", color: theme.tooltipText, opacity: 0.72 }}>{r.name}</span>
            <span style={{ ...fontCss, fontSize: Math.max(12, Math.round(fs * 0.95)), lineHeight: "1.3em", color: theme.tooltipText, fontVariantNumeric: "tabular-nums" }}>{fmt.value(r.value, r.value)}</span>
            {tipLines(r).map((line, i) => (
                <span key={i} style={{ ...labelCss, fontSize: lfs, lineHeight: "1.35em", color: theme.tooltipText, opacity: 0.86, fontVariantNumeric: "tabular-nums" }}>
                    {line}
                </span>
            ))}
        </div>
    )

    // ── 도형: Funnel (가운데 정렬 사다리꼴 — 위 너비는 이 단계 값, 아래 너비는 다음 단계 값) ──
    const funnelGraphic = (r: Row) => {
        const i = r.index
        const top = Math.max(MIN_BAR, frac(r.value) * gw)
        const bottom = i < n - 1 ? Math.max(MIN_BAR, frac(rows[i + 1].value) * gw) : top
        const xc = gw / 2
        // 둥근 모서리: 안쪽으로 줄인 도형에 같은 색 굵은 테두리를 둘러 만든다
        const rr = Math.min(br, segH / 2, top / 2, bottom / 2)
        const pts = `${xc - top / 2 + rr},${rr} ${xc + top / 2 - rr},${rr} ${xc + bottom / 2 - rr},${segH - rr} ${xc - bottom / 2 + rr},${segH - rr}`
        // 겹쳐 그리기: 이전 기간의 윤곽을 점선으로
        let ghostPts = ""
        if (overlay && r.prev !== null) {
            const gt = Math.max(MIN_BAR, frac(r.prev) * gw)
            const nextPrev = i < n - 1 ? rows[i + 1].prev : null
            const gb = nextPrev !== null ? Math.max(MIN_BAR, frac(nextPrev) * gw) : gt
            ghostPts = `${xc - gt / 2},1 ${xc + gt / 2},1 ${xc + gb / 2},${segH - 1} ${xc - gb / 2},${segH - 1}`
        }
        // 이탈 영역: 이 조각이 좁아지는 양옆 세모(다음 단계로 넘어가며 빠진 만큼)
        const wingColor = i < n - 1 ? lostColor(i + 1) : null
        const wing = (top - bottom) / 2
        return (
            <div style={{ position: "relative", width: gw, height: segH, flex: "none", ...shellStyle(i) }}>
                {/* 위 너비만큼의 빗금 상자를 깔고 그 위에 조각을 그리면 양옆 세모만 남는다 */}
                {wingColor && wing > 3 && <div style={{ position: "absolute", left: xc - top / 2, top: 0, width: top, height: segH, borderRadius: rr, background: hatch(wingColor), ...lateStyle(i) }} />}
                <svg width={gw} height={segH} viewBox={`0 0 ${gw} ${segH}`} aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, display: "block", overflow: "visible" }}>
                    <polygon points={pts} fill={tones.stage[i]} stroke={tones.stage[i]} strokeWidth={rr * 2} strokeLinejoin="round" style={growStyle(i, "center")} />
                    {ghostPts && <polygon points={ghostPts} fill="none" stroke={tones.ghostLine} strokeWidth={1.5} strokeDasharray="5 4" strokeLinejoin="round" />}
                </svg>
            </div>
        )
    }

    // ── 도형: Bars (왼쪽 정렬 가로 막대 + 옅은 바탕 줄, 겹쳐 그리기에서는 아래에 이전 기간의 얇은 막대) ──
    const barsGraphic = (r: Row) => {
        const i = r.index
        const ghostH = overlay ? Math.max(4, Math.round(bh * 0.24)) : 0
        const mainH = overlay ? Math.max(4, bh - ghostH - 3) : bh
        const rr = Math.min(br, mainH / 2)
        const f = frac(r.value)
        const lc = lostColor(i)
        const before = i > 0 ? frac(rows[i - 1].value) : 0
        return (
            <div style={{ position: "relative", width: stacked ? "100%" : gw, height: bh, flex: "none", ...shellStyle(i) }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: mainH, borderRadius: rr, background: theme.track }} />
                {lc && before > f && (
                    <div style={{ position: "absolute", left: `calc(${f * 100}% + 2px)`, top: 0, width: `calc(${(before - f) * 100}% - 2px)`, height: mainH, borderRadius: rr, background: hatch(lc), ...lateStyle(i) }} />
                )}
                <div style={{ position: "absolute", left: 0, top: 0, width: `${f * 100}%`, minWidth: MIN_BAR, height: mainH, borderRadius: rr, background: tones.stage[i], ...growStyle(i, "x") }} />
                {overlay && r.prev !== null && (
                    <div style={{ position: "absolute", left: 0, top: mainH + 3, width: `${frac(r.prev) * 100}%`, minWidth: MIN_BAR, height: ghostH, borderRadius: Math.min(br, ghostH / 2), background: tones.ghost, ...growStyle(i, "x") }} />
                )}
            </div>
        )
    }

    // ── 요약 줄: 전체 전환율 · 총 이탈 · 최대 이탈 (라벨을 비우면 그 항목은 숨김) ──
    const stats: { label: string; value: string; note: string; hot: boolean }[] = []
    if (model.overall !== null && overallLabel && overallLabel.trim()) {
        stats.push({
            label: overallLabel,
            value: fmt.pct(model.overall),
            note: cmpOn && model.prevOverall !== null ? `${(previousLabel || "").trim()} ${fmt.pct(model.prevOverall)}`.trim() : "",
            hot: false,
        })
    }
    if (model.lost !== null && lostLabel && lostLabel.trim()) {
        stats.push({ label: lostLabel, value: fmt.value(model.lost, model.lost), note: "", hot: false })
    }
    if (model.biggest > 0 && biggestLabel && biggestLabel.trim()) {
        const b = rows[model.biggest]
        stats.push({ label: biggestLabel, value: fmt.pct(b.dropRate), note: `${rows[model.biggest - 1].name} → ${b.name}`, hot: highlightDrop })
    }

    const hasTitle = !!(title && title.trim())
    const firstRow = rows[0]
    const lastRow = rows[n - 1]
    const summary =
        `${(title || "").trim() || "Funnel chart"}: ${n} ${n === 1 ? "stage" : "stages"} from ${firstRow.name} (${fmt.value(firstRow.value, firstRow.value)}) to ${lastRow.name} (${fmt.value(lastRow.value, lastRow.value)}).` +
        (model.overall !== null ? ` ${(overallLabel || "").trim() || "Overall conversion"} ${fmt.pct(model.overall)}.` : "") +
        " Use the arrow keys to inspect stages."
    const activeRow = active !== null && active >= 0 && active < n ? rows[active] : null
    const liveText = activeRow ? [`${activeRow.name}: ${fmt.value(activeRow.value, activeRow.value)}`].concat(tipLines(activeRow)).join(". ") : ""

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
    const swatch = Math.round(clamp(lfs * 0.9, 9, 22))

    return (
        <div style={{ ...outerStyle, "--bu-fc-focus": theme.text } as CSSProperties}>
            {/* 키보드로 이동할 때만 보이는 초점 테두리 */}
            <style>{".bu-fc-chart:focus-visible{outline:2px solid var(--bu-fc-focus);outline-offset:4px;border-radius:4px}.bu-fc-chart:focus:not(:focus-visible){outline:none}"}</style>
            {/* 너비 측정용 영역 (부모가 준 너비 그대로) */}
            <div ref={areaRef} style={{ width: "100%", minWidth: 0 }}>
                {/* 제목 */}
                {hasTitle && <div style={{ ...fontCss, fontSize: fs, color: theme.text, margin: `0 0 ${Math.round(12 * ts)}px` }}>{title}</div>}

                {/* 요약 줄: 전체 전환율 · 총 이탈 · 최대 이탈 */}
                {showSummary && stats.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: `${Math.round(12 * ts)}px ${Math.round(28 * ts)}px`, margin: `0 0 ${Math.round(20 * ts)}px` }}>
                        {stats.map((s, i) => (
                            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                <span style={{ ...fontCss, fontSize: Math.round(fs * 1.7), lineHeight: "1.1em", color: s.hot ? theme.negative : theme.text, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                                <span style={{ ...labelCss, fontSize: lfs, color: theme.muted }}>{s.note ? `${s.label} · ${s.note}` : s.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 차트: 전체가 탭 정지 1개, 방향키로 단계 이동 */}
                <div className="bu-fc-chart" tabIndex={0} role="group" aria-label={summary} onKeyDown={onKey} onBlur={() => pick(null)} onPointerLeave={() => pick(null)} style={{ position: "relative" }}>
                    {view === "steps" ? (
                        // ── Steps: 세로 막대를 옆으로 나란히 (왼쪽에서 오른쪽으로 계단처럼 내려감) ──
                        <div style={{ display: "flex", alignItems: "flex-start", gap: stepGap }}>
                            {rows.map((r) => {
                                const i = r.index
                                const f = frac(r.value)
                                const before = i > 0 ? frac(rows[i - 1].value) : 0
                                const lc = lostColor(i)
                                const rr = Math.min(br, 24)
                                return (
                                    <div key={i} onPointerEnter={() => pick(i)} onPointerDown={() => pick(i)} style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: Math.max(40, columnHeight), ...shellStyle(i) }}>
                                            {/* 겹쳐 그리기: 이전 기간의 좁은 막대 */}
                                            {overlay && (
                                                <div style={{ flex: "0 0 28%", height: "100%", position: "relative" }}>
                                                    {r.prev !== null && (
                                                        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${frac(r.prev) * 100}%`, minHeight: MIN_BAR, borderRadius: rr, background: tones.ghost, ...growStyle(i, "y") }} />
                                                    )}
                                                </div>
                                            )}
                                            <div style={{ flex: "1 1 0", height: "100%", position: "relative" }}>
                                                {/* 이탈 영역: 앞 단계 높이까지의 빈 부분 */}
                                                {lc && before > f && (
                                                    <div style={{ position: "absolute", left: 0, right: 0, bottom: `calc(${f * 100}% + 2px)`, height: `calc(${(before - f) * 100}% - 2px)`, borderRadius: rr, background: hatch(lc), ...lateStyle(i) }} />
                                                )}
                                                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${f * 100}%`, minHeight: MIN_BAR, borderRadius: rr, background: tones.stage[i], ...growStyle(i, "y") }} />
                                            </div>
                                        </div>
                                        <div style={{ marginTop: Math.round(10 * ts), display: "flex", flexDirection: "column", gap: Math.round(4 * ts) }}>
                                            {labelBlock(r)}
                                            {metaBlock(r, "left")}
                                        </div>
                                        {showTooltip && active === i && tipBox(r, { top: 8, left: i < n / 2 ? 0 : "auto", right: i < n / 2 ? "auto" : 0 })}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        // ── Funnel / Bars: 단계마다 한 줄. 넓으면 [이름·값][도형][전환율·이탈], 좁으면 도형 아래에 라벨 ──
                        <div style={{ display: "flex", flexDirection: "column", gap: stacked ? g + Math.round(14 * ts) : g }}>
                            {rows.map((r) => {
                                const i = r.index
                                const graphic = view === "bars" ? barsGraphic(r) : funnelGraphic(r)
                                // 툴팁: 위쪽 절반의 단계는 줄 아래에, 아래쪽 절반은 줄 위에 띄워 차트 안에 머물게 한다
                                const tipPos: CSSProperties =
                                    i < n / 2 ? { top: "calc(100% + 6px)", left: stacked ? 0 : labelW + colGap } : { bottom: "calc(100% + 6px)", left: stacked ? 0 : labelW + colGap }
                                return (
                                    <div key={i} onPointerEnter={() => pick(i)} onPointerDown={() => pick(i)} style={{ position: "relative" }}>
                                        {stacked ? (
                                            <>
                                                {graphic}
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginTop: Math.round(6 * ts) }}>
                                                    <div style={{ flex: "1 1 0", minWidth: 0 }}>{labelBlock(r)}</div>
                                                    <div style={{ flex: "none", maxWidth: "50%" }}>{metaBlock(r, "right")}</div>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ display: "flex", alignItems: "center", gap: colGap, minHeight: segH }}>
                                                <div style={{ width: labelW, flex: "none", minWidth: 0 }}>{labelBlock(r)}</div>
                                                {graphic}
                                                {metaW > 0 && <div style={{ width: metaW, flex: "none", minWidth: 0 }}>{metaBlock(r, "right")}</div>}
                                            </div>
                                        )}
                                        {showTooltip && active === i && tipBox(r, tipPos)}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    {/* 화면 낭독기용: 방향키로 고른 단계를 읽어 줌 */}
                    <span aria-live="polite" style={srOnly}>
                        {liveText}
                    </span>
                </div>

                {/* 범례 (비교 모드): 이번 기간 · 이전 기간 · 증감 설명 */}
                {showLegend && cmpOn && (
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: `${Math.round(6 * ts)}px ${Math.round(16 * ts)}px`, margin: `${Math.round(16 * ts)}px 0 0`, ...labelCss, fontSize: lfs, color: theme.muted }}>
                        {overlay && currentLabel && currentLabel.trim() ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span aria-hidden="true" style={{ width: swatch, height: swatch, borderRadius: Math.min(br, 4), background: tones.main, display: "block" }} />
                                {currentLabel}
                            </span>
                        ) : null}
                        {overlay && previousLabel && previousLabel.trim() ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span
                                    aria-hidden="true"
                                    style={{
                                        width: swatch,
                                        height: swatch,
                                        borderRadius: Math.min(br, 4),
                                        boxSizing: "border-box",
                                        display: "block",
                                        background: view === "funnel" ? "transparent" : tones.ghost,
                                        border: view === "funnel" ? `1.5px dashed ${tones.ghostLine}` : "none",
                                    }}
                                />
                                {previousLabel}
                            </span>
                        ) : null}
                        {changeLabel && changeLabel.trim() ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                                <span aria-hidden="true" style={{ color: theme.positive }}>▲</span>
                                <span aria-hidden="true" style={{ color: theme.negative }}>▼</span>
                                {changeLabel}
                            </span>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}

FunnelChart.displayName = "Funnel Chart"

// ─────────────────────────────────────────────
// 속성 컨트롤 (중요도순)
// ─────────────────────────────────────────────
addPropertyControls(FunnelChart, {
    data: {
        type: ControlType.String,
        title: "Data",
        defaultValue: "",
        placeholder: "Visitors, 12400\nSignups, 3720\nPaid, 620",
        displayTextArea: true,
        description: "One stage per line: name, value. Add a second number to compare with a previous period. Leave empty to show demo data.",
    },
    title: { type: ControlType.String, title: "Title", defaultValue: "Signup funnel", placeholder: "Optional" },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["funnel", "bars", "steps"],
        optionTitles: ["Funnel", "Bars", "Steps"],
        defaultValue: "funnel",
        displaySegmentedControl: true,
        description: "Steps switches to Bars when the columns get too narrow.",
    },
    compare: {
        type: ControlType.Enum,
        title: "Compare",
        options: ["off", "change", "overlay"],
        optionTitles: ["Off", "Change", "Overlay"],
        defaultValue: "change",
        displaySegmentedControl: true,
        description: "Uses the second number on each line. Overlay also draws the previous period.",
    },
    currentLabel: { type: ControlType.String, title: "Current", defaultValue: "This month", hidden: (p: FunnelChartProps) => p.compare !== "overlay" },
    previousLabel: { type: ControlType.String, title: "Previous", defaultValue: "Last month", hidden: (p: FunnelChartProps) => p.compare === "off" },
    changeLabel: {
        type: ControlType.String,
        title: "Change Note",
        defaultValue: "Change vs last month",
        description: "Shown under the chart. Clear it to hide.",
        hidden: (p: FunnelChartProps) => p.compare === "off",
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
        hidden: (p: FunnelChartProps) => p.theme !== "custom",
    },
    colorMode: {
        type: ControlType.Enum,
        title: "Color Mode",
        options: ["solid", "shades", "palette"],
        optionTitles: ["Solid", "Shades", "Palette"],
        defaultValue: "shades",
        displaySegmentedControl: true,
        description: "Shades fades from light to the full color. Palette gives each stage its own color.",
    },
    appearance: {
        type: ControlType.Enum,
        title: "Appearance",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    rate: {
        type: ControlType.Enum,
        title: "Rate",
        options: ["previous", "first", "none"],
        optionTitles: ["Vs Previous", "Vs First", "Hide"],
        defaultValue: "previous",
        description: "Conversion rate next to each stage: from the stage before it, or from the first stage.",
    },
    dropOff: {
        type: ControlType.Enum,
        title: "Drop-off",
        options: ["none", "count", "percent", "both"],
        optionTitles: ["Hide", "Count", "Percent", "Both"],
        defaultValue: "count",
    },
    highlightDrop: {
        type: ControlType.Boolean,
        title: "Biggest Drop",
        defaultValue: true,
        enabledTitle: "Mark",
        disabledTitle: "Plain",
        description: "Marks the step that loses the largest share.",
    },
    dropArea: {
        type: ControlType.Boolean,
        title: "Drop Area",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Hatched area for what each stage lost.",
    },
    showSummary: { type: ControlType.Boolean, title: "Summary", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    overallLabel: {
        type: ControlType.String,
        title: "Overall",
        defaultValue: "Overall conversion",
        description: "Clear a label to hide that number.",
        hidden: (p: FunnelChartProps) => !p.showSummary,
    },
    lostLabel: { type: ControlType.String, title: "Lost", defaultValue: "Total drop-off", hidden: (p: FunnelChartProps) => !p.showSummary },
    biggestLabel: { type: ControlType.String, title: "Biggest", defaultValue: "Biggest drop", hidden: (p: FunnelChartProps) => !p.showSummary },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "", placeholder: "$" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "", placeholder: " users" },
    compact: { type: ControlType.Boolean, title: "Compact", defaultValue: false, enabledTitle: "12.4k", disabledTitle: "12,400" },
    decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 0, min: 0, max: 3, step: 1, displayStepper: true },
    rateDecimals: { type: ControlType.Number, title: "Rate Decimals", defaultValue: 1, min: 0, max: 2, step: 1, displayStepper: true },
    locale: {
        type: ControlType.String,
        title: "Locale",
        defaultValue: "en-US",
        placeholder: "en-US, de-DE, ja-JP…",
        description: "Number format, e.g. 12,400 or 12.400.",
    },
    showLegend: {
        type: ControlType.Boolean,
        title: "Legend",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p: FunnelChartProps) => p.compare === "off",
    },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    stepWord: {
        type: ControlType.String,
        title: "Step Text",
        defaultValue: "of previous step",
        description: "Tooltip wording. Translate these three for other languages.",
        hidden: (p: FunnelChartProps) => !p.showTooltip,
    },
    firstWord: { type: ControlType.String, title: "First Text", defaultValue: "of first step", hidden: (p: FunnelChartProps) => !p.showTooltip },
    dropWord: { type: ControlType.String, title: "Drop Text", defaultValue: "dropped", hidden: (p: FunnelChartProps) => !p.showTooltip },
    barHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 56,
        min: 12,
        max: 400,
        step: 1,
        unit: "px",
        hidden: (p: FunnelChartProps) => p.shape === "steps",
    },
    columnHeight: {
        type: ControlType.Number,
        title: "Chart Height",
        defaultValue: 220,
        min: 40,
        max: 900,
        step: 1,
        unit: "px",
        hidden: (p: FunnelChartProps) => p.shape !== "steps",
    },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 6, min: 0, max: 48, step: 1, unit: "px" },
    barRadius: { type: ControlType.Number, title: "Bar Radius", defaultValue: 8, min: 0, max: 60, step: 1, unit: "px" },
    textScale: {
        type: ControlType.Number,
        title: "Text Scale",
        defaultValue: 1,
        min: 0.5,
        max: 3,
        step: 0.05,
        unit: "×",
        description: "Scales all text together.",
    },
    customColors: { type: ControlType.Boolean, title: "Colors", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Preset" },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        icon: "color",
        hidden: (p: FunnelChartProps) => !p.customColors,
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            muted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#6B6B76" },
            track: { type: ControlType.Color, title: "Bar Track", defaultValue: "rgba(17, 17, 20, 0.06)" },
            positive: { type: ControlType.Color, title: "Increase", defaultValue: "#0B7F4A" },
            negative: { type: ControlType.Color, title: "Decrease", defaultValue: "#D92D20" },
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
        description: "Stages fill in once when the chart scrolls into view.",
    },
    countUp: { type: ControlType.Boolean, title: "Count Up", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", hidden: (p: FunnelChartProps) => !p.animate },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 700, min: 100, max: 4000, step: 50, unit: "ms", hidden: (p: FunnelChartProps) => !p.animate },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 48, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 24, min: 0, max: 80, step: 1, unit: "px" },
    font: {
        type: ControlType.Font,
        title: "Value Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Semibold", lineHeight: "1.3em" },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Medium", lineHeight: "1.3em" },
        description: "Created by BrandingUp",
    },
})
