// [생성일] 2026-11-14
// [경위] 달러벌기 36번 상품(무료): 이름과 숫자만 넣으면 "100칸 중 몇 칸"으로 그려 주는 와플 차트(퍼센트 격자·사람 아이콘 그래픽). 합쳐 보기/항목별 나눠 보기 · 칸 모양 7종 · 큰 숫자(48% / 5 in 10) · 범례 · 툴팁
// [변경이력]
//   - 2026-11-14: 최초 생성 (줄 목록 입력 · 빈 데이터면 데모 · 칸 수 최대잔여법 배분 · Total 지정 시 빈 칸 · 합쳐 보기/나눠 보기 · 칸 모양 사각·둥근 사각·원·사람·하트·별·직접 SVG 경로 · 채우는 순서 3종 · 큰 숫자 3종 · 범례(값/비율/둘 다) · 색 테마 7종+직접 색+줄별 색 · 호버·키보드로 항목 강조 · 등장 1회(칸이 차례로 나타남, CSS 전환) + 숫자 카운트업 · 정적·캔버스 완성 상태 · 부모 너비 맞춤)
//   - 2026-11-14: 범례 글자가 Text Scale 을 따르지 않던 문제 수정 (프레이머 썸네일에서 발견 — Label Font 의 fontSize 가 배율 적용 값을 덮어씀)

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
type Rgb = [number, number, number]

interface Colors {
    background?: string
    text?: string
    muted?: string
    empty?: string
    tooltipBg?: string
    tooltipText?: string
}

// 입력 한 줄 = 항목 하나 (color 는 줄 끝에 #HEX 를 적었을 때만)
interface Item {
    name: string
    value: number
    color: string | null
}

type ThemeName = "mint" | "green" | "blue" | "purple" | "orange" | "pink" | "mono" | "custom"
type CellShape = "square" | "rounded" | "circle" | "person" | "heart" | "star" | "custom"
type FillOrder = "rows" | "columns" | "bottom"

const MAX_LINES = 200
const MAX_ITEMS = 12
const MAX_CELLS = 400 // 격자 칸 수 상한 (20 × 20)

// 색 테마별 대표색
const ACCENTS: Record<string, string> = {
    mint: "#2DE5A0",
    green: "#2DA44E",
    blue: "#3B82F6",
    purple: "#8B5CF6",
    orange: "#F97316",
    pink: "#EC4899",
}
// 팔레트 모드에서 항목마다 돌아가며 쓰는 순서
const PALETTE_ORDER = ["mint", "blue", "purple", "pink", "orange", "green"]

// 데이터가 비었을 때 보여 주는 데모: 한 주 동안 팀 시간 배분 (합계 100)
const DEMO: Item[] = [
    { name: "Building", value: 48, color: null },
    { name: "Meetings", value: 22, color: null },
    { name: "Support", value: 18, color: null },
    { name: "Admin", value: 12, color: null },
]

// 아이콘 칸 모양 (24×24 좌표 기준 SVG 경로)
const ICON_PATHS: Record<string, string> = {
    person: "M7.5 6.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0Z M4.5 23C4.5 16.6 7.8 12.8 12 12.8S19.5 16.6 19.5 23Z",
    heart: "M12 21.4l-1.4-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.6Z",
    star: "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6Z",
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
        if (h.length >= 6 && /^[0-9a-f]+$/i.test(h)) {
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

// 숫자 한 칸 읽기: 통화 기호·% ·공백은 무시, 12.4k / 1.2M 줄임 표기 허용. 숫자가 아니면 null
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

// 입력 글자를 항목 목록으로 바꾼다.
// 한 줄 = "Building, 48" 또는 "Building, 48, #FF6B00"(끝에 #HEX 를 쓰면 그 항목 색).
// 구분: 쉼표, 또는 스프레드시트에서 붙여넣은 탭(세미콜론·| 도 가능). 공백만으로 나눈 줄은 마지막 숫자를 값으로 읽는다.
// 숫자가 없는 줄(머리글 등)은 건너뛴다.
function parseData(text: string): Item[] {
    const out: Item[] = []
    if (typeof text !== "string" || !text.trim()) return out
    const lines = text.split(/\r?\n/).slice(0, MAX_LINES)
    for (let i = 0; i < lines.length && out.length < MAX_ITEMS; i++) {
        const line = lines[i].trim()
        if (!line) continue
        const strong = /[\t;|]/.test(line)
        let cells = (strong ? line.split(/[\t;|]/) : line.split(",")).map((c) => c.trim())
        while (cells.length > 1 && cells[cells.length - 1] === "") cells.pop()
        let joiner = ", "
        if (cells.length === 1) {
            cells = cells[0].split(/\s+/)
            joiner = " "
        }
        // 줄 끝의 #HEX 색
        let color: string | null = null
        const lastCell = cells[cells.length - 1]
        if (cells.length > 1 && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(lastCell)) {
            color = lastCell
            cells = cells.slice(0, -1)
        }
        if (cells.length < 2) continue
        const n = parseNumber(cells[cells.length - 1], strong)
        if (n === null) continue
        const name = cells.slice(0, -1).join(joiner).trim() || `Item ${out.length + 1}`
        out.push({ name, value: n, color })
    }
    return out
}

// 최대잔여법: 정확한 칸 수(값 ÷ 전체 × 칸 수)의 정수 부분을 먼저 주고, 남은 칸을 소수 부분이 큰 항목부터 1칸씩 준다.
// → 칸 합계가 반올림 오차 없이 정확히 맞는다. 합계가 Total 보다 작으면 나머지는 빈 칸
function allocate(values: number[], total: number, units: number): number[] {
    if (!(total > 0)) return values.map(() => 0)
    const exact = values.map((v) => (v / total) * units)
    const sum = exact.reduce((a, b) => a + b, 0)
    const target = Math.min(units, Math.round(sum + 1e-9))
    const out = exact.map((x) => Math.floor(x + 1e-9))
    let rest = target - out.reduce((a, b) => a + b, 0)
    const order = exact.map((x, i) => i).sort((a, b) => exact[b] - Math.floor(exact[b] + 1e-9) - (exact[a] - Math.floor(exact[a] + 1e-9)) || values[b] - values[a] || a - b)
    for (let k = 0; rest > 0 && k < order.length; k++, rest--) out[order[k]]++
    return out
}

// 칸 번호(채우는 순서) → 격자 위치
function cellPos(i: number, cols: number, rows: number, order: FillOrder): { r: number; c: number } {
    if (order === "columns") return { r: i % rows, c: Math.floor(i / rows) }
    if (order === "bottom") return { r: rows - 1 - Math.floor(i / cols), c: i % cols }
    return { r: Math.floor(i / cols), c: i % cols }
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

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface WaffleChartProps {
    data?: string
    title?: string
    subtitle?: string
    note?: string
    layout?: "combined" | "split"
    total?: number
    restLabel?: string
    columns?: number
    rows?: number
    shape?: CellShape
    iconPath?: string
    fillOrder?: FillOrder
    theme?: ThemeName
    accent?: string
    colorMode?: "solid" | "shades" | "palette"
    appearance?: "light" | "dark"
    headline?: "percent" | "ratio" | "value" | "none"
    headlineItem?: number
    ratioBase?: number
    ratioWord?: string
    headlineCaption?: string
    legend?: "auto" | "side" | "bottom" | "none"
    legendValues?: "percent" | "value" | "both" | "none"
    prefix?: string
    suffix?: string
    decimals?: number
    percentDecimals?: number
    locale?: string
    showTooltip?: boolean
    cellWord?: string
    cellSize?: number
    gap?: number
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
 * Waffle Chart — 이름과 숫자만 넣으면 100칸(또는 원하는 칸 수) 격자로 비율을 보여 주는 와플·픽토그램 차트. 합쳐 보기/나눠 보기, 칸 모양 7종, 큰 숫자, 범례, 툴팁 포함.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 480
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function WaffleChart(props: WaffleChartProps) {
    const {
        data = "",
        title = "Where the team's week went",
        subtitle = "",
        note = "",
        layout = "combined",
        total: totalProp = 0,
        restLabel = "Not counted",
        columns = 10,
        rows: rowsProp = 10,
        shape = "rounded",
        iconPath = "",
        fillOrder = "rows",
        theme: themeName = "mint",
        accent = "#2DE5A0",
        colorMode = "palette",
        appearance = "light",
        headline = "percent",
        headlineItem = 1,
        ratioBase = 10,
        ratioWord = "in",
        headlineCaption = "",
        legend = "auto",
        legendValues = "percent",
        prefix = "",
        suffix = "",
        decimals = 0,
        percentDecimals = 0,
        locale = "en-US",
        showTooltip = true,
        cellWord = "Each square",
        cellSize = 26,
        gap = 4,
        textScale = 1,
        customColors = false,
        colors: colorProps,
        animate = true,
        countUp = true,
        duration = 900,
        radius = 16,
        padding = 24,
        font,
        labelFont,
        style,
    } = props

    const areaRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(640 - 24 * 2)
    const [active, setActive] = useState<number | null>(null)
    const [hoverCell, setHoverCell] = useState<{ g: number; x: number; y: number } | null>(null)

    // ── 색 기본값: Appearance 에 따르고, Custom Colors 를 켰을 때만 입력값 사용 ──
    // (프레이머는 기본값 없는 Color 컨트롤을 파란색으로 채워 넘기므로 토글로 분리)
    const cs = customColors ? colorProps : undefined
    const dark = appearance === "dark"
    const theme = {
        background: cs?.background ?? (dark ? "#101114" : "rgba(255, 255, 255, 0)"),
        text: cs?.text ?? (dark ? "#F4F4F6" : "#111114"),
        muted: cs?.muted ?? (dark ? "#9A9AA6" : "#6B6B76"),
        empty: cs?.empty ?? (dark ? "rgba(255, 255, 255, 0.1)" : "rgba(17, 17, 20, 0.08)"),
        tooltipBg: cs?.tooltipBg ?? (dark ? "#F4F4F6" : "#111114"),
        tooltipText: cs?.tooltipText ?? (dark ? "#111114" : "#FFFFFF"),
    }

    // ── 격자 크기 (칸 수 상한 400) ──
    const cols = clamp(Math.round(columns) || 10, 2, 20)
    const rowsN = clamp(Math.round(rowsProp) || 10, 1, 20)
    const units = Math.min(MAX_CELLS, cols * rowsN)

    // ── 데이터 읽기 (비어 있으면 데모) → 비율·칸 수 계산 ──
    const model = useMemo(() => {
        const parsed = parseData(data)
        const items = parsed.length ? parsed : DEMO
        const sum = items.reduce((a, b) => a + b.value, 0)
        // Total 을 비우면(0) 항목 합계가 전체. 합계가 Total 보다 크면 합계를 전체로 쓴다
        const tp = Number(totalProp) || 0
        const whole = tp > 0 ? Math.max(tp, sum) : sum
        const combinedCells = allocate(
            items.map((it) => it.value),
            whole,
            units
        )
        // 나눠 보기: 항목마다 자기 격자 하나 (값 ÷ 전체 × 칸 수 반올림)
        const splitCells = items.map((it) => (whole > 0 ? Math.min(units, Math.round((it.value / whole) * units + 1e-9)) : 0))
        return { items, sum, whole, combinedCells, splitCells, rest: Math.max(0, whole - sum), demo: !parsed.length }
    }, [data, totalProp, units])
    const items = model.items
    const n = items.length

    // ── 항목 색: 단색 / 농담(첫 항목이 가장 진하게) / 팔레트(항목마다 다른 색). 줄 끝 #HEX 가 있으면 그 색 우선 ──
    const tones = useMemo(() => {
        const bg = parseColor(theme.background)
        const surface: Rgb = bg && bg[3] > 0.5 ? [bg[0], bg[1], bg[2]] : dark ? [16, 17, 20] : [255, 255, 255]
        const base = themeName === "custom" ? accent : themeName === "mono" ? theme.text : ACCENTS[themeName] || ACCENTS.mint
        const acc = toRgb(base, [45, 229, 160])
        const start = PALETTE_ORDER.indexOf(themeName)
        const out: string[] = []
        for (let i = 0; i < n; i++) {
            const own = items[i].color
            if (own && parseColor(own)) {
                out.push(own)
            } else if (colorMode === "palette" && themeName !== "mono") {
                if (themeName === "custom") out.push(i === 0 ? mix(acc, acc, 0) : ACCENTS[PALETTE_ORDER[(i - 1) % PALETTE_ORDER.length]])
                else out.push(ACCENTS[PALETTE_ORDER[(Math.max(0, start) + i) % PALETTE_ORDER.length]])
            } else if (colorMode === "solid") {
                out.push(mix(acc, acc, 0))
            } else {
                // 농담: 첫 항목은 대표색 그대로, 뒤로 갈수록 옅게 → 큰 숫자로 고른 항목이 눈에 띈다
                out.push(mix(surface, acc, 1 - 0.62 * (n > 1 ? i / (n - 1) : 0)))
            }
        }
        return out
    }, [theme.background, theme.text, dark, themeName, accent, colorMode, n, items])

    // ── 부모(컨테이너) 너비 측정: 창 너비가 아니라 이 컴포넌트가 실제로 받은 너비에 맞춘다 ──
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
    // 칸은 CSS 전환(transition-delay)으로 차례로 나타나고, 프레임 루프는 큰 숫자 카운트업 동안에만 돈다.
    // 정적 렌더·캔버스·화면 밖·모션 줄이기 설정에서는 완성된 상태를 즉시 보여줌. 반복 애니메이션은 없음
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const canAnimate = animate && !isStatic && !isCanvas
    const dur = clamp(Math.round(duration) || 900, 200, 4000)
    const POP = 320 // 칸 하나가 나타나는 시간(ms)
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
                        t2 = window.setTimeout(finish, dur + POP + 150)
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
    }, [canAnimate, dur])

    // ── 큰 숫자 카운트업: 등장하는 동안에만 프레임 루프를 돌리고, 끝나면 멈춘다 ──
    useEffect(() => {
        if (phase !== "playing" || !countUp) return
        let raf = 0
        let start = 0
        const tick = (now: number) => {
            if (!start) start = now
            const e = now - start
            setElapsed(e)
            if (e < dur) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [phase, countUp, dur])
    const numProgress = phase === "done" || !countUp ? 1 : phase === "hidden" ? 0 : easeOut(clamp(elapsed / dur, 0, 1))

    // ── 글꼴·글자 크기 (Text Scale 로 전체 글자를 한 번에 키우거나 줄임) ──
    const ts = clamp(Number(textScale) || 1, 0.5, 3)
    const fontCss: CSSProperties = font || {}
    const labelCss: CSSProperties = labelFont || {}
    const fs = Math.round(fontSizeOf(font, 15) * ts * 10) / 10
    const lfs = Math.round(fontSizeOf(labelFont, 13) * ts * 10) / 10
    const hfs = Math.round(fs * 3.2) // 큰 숫자

    // ── 숫자 서식 ──
    const fmt = useMemo(() => {
        const nf = makeFormatter(locale, decimals)
        const pf = makeFormatter(locale, percentDecimals)
        const value = (v: number) => (prefix || "") + nf(v) + (suffix || "")
        const pct = (r: number) => (isFinite(r) ? pf(r * 100) + "%" : "—")
        return { value, pct, int: makeFormatter(locale, 0) }
    }, [locale, decimals, percentDecimals, prefix, suffix])
    const share = (v: number) => (model.whole > 0 ? v / model.whole : 0)

    // 항목 하나의 범례·툴팁용 값 문자열
    const legendText = (v: number): string => {
        if (legendValues === "none") return ""
        if (legendValues === "value") return fmt.value(v)
        if (legendValues === "both") return `${fmt.value(v)} · ${fmt.pct(share(v))}`
        return fmt.pct(share(v))
    }

    // ── 큰 숫자 (고른 항목의 비율 / "5 in 10" / 값) ──
    const hIndex = clamp(Math.round(headlineItem) || 1, 1, n) - 1
    const hItem = items[hIndex]
    const headlineNode = (() => {
        if (headline === "none" || layout === "split") return null
        const p = share(hItem.value)
        let big = ""
        if (headline === "ratio") {
            const base = clamp(Math.round(ratioBase) || 10, 2, 1000)
            const target = Math.round(p * base)
            big = `${fmt.int(Math.round(target * numProgress))} ${ratioWord || "in"} ${fmt.int(base)}`
        } else if (headline === "value") {
            big = fmt.value(hItem.value * numProgress)
        } else {
            big = fmt.pct(p * numProgress)
        }
        return { big, caption: headlineCaption.trim() || hItem.name, color: tones[hIndex] }
    })()

    // ── 배치 계산: 범례를 옆에 둘지 아래에 둘지, 칸 크기를 얼마로 할지 ──
    const showLegend = legend !== "none" && layout === "combined"
    const restShown = model.rest > 0 && restLabel.trim() !== ""
    const legendRows = items.map((it) => ({ name: it.name, val: legendText(it.value) }))
    if (restShown) legendRows.push({ name: restLabel, val: legendText(model.rest) })
    const legendEst = legendRows.reduce((mx, r) => Math.max(mx, (textUnits(r.name) + textUnits(r.val) + 2) * lfs), 0) + lfs * 2.2
    const legendW = Math.round(clamp(legendEst, 120, Math.max(120, width * 0.45)))
    const colGap = Math.round(clamp(width * 0.05, 16, 40))
    const gp = clamp(Number(gap) || 0, 0, 24)
    const maxCell = clamp(Number(cellSize) || 26, 6, 80)
    // 범례를 옆에 두면 칸이 너무 작아질 때(18px 또는 Max Square 미만)는 아래로 내린다
    const sideCellMin = Math.min(maxCell, 18)
    const sideFits = width - legendW - colGap >= cols * sideCellMin + Math.min(gp, Math.floor(sideCellMin * 0.5)) * (cols - 1)
    const legendSide = showLegend && (legend === "side" ? true : legend === "bottom" ? false : sideFits && width >= 420)

    // 한 격자의 칸 크기·실제 너비/높이
    const gridSize = (avail: number) => {
        const cell = clamp(Math.floor((avail - gp * (cols - 1)) / cols), 4, maxCell)
        const g = Math.min(gp, Math.max(1, Math.floor(cell * 0.5)))
        return { cell, g, w: cols * cell + (cols - 1) * g, h: rowsN * cell + (rowsN - 1) * g }
    }

    // 나눠 보기: 한 줄에 몇 개의 격자를 놓을지 (격자 하나 최소 폭 = 칸 10px 기준)
    const splitMinW = Math.max(cols * 10 + gp * (cols - 1), 110)
    const splitGap = Math.round(clamp(width * 0.04, 14, 32))
    const perRow = layout === "split" ? clamp(Math.floor((width + splitGap) / (splitMinW + splitGap)), 1, n) : 1
    const splitAvail = layout === "split" ? (width - splitGap * (perRow - 1)) / perRow : 0
    const combinedAvail = legendSide ? width - legendW - colGap : width
    const geo = gridSize(layout === "split" ? splitAvail : combinedAvail)

    // ── 칸 그리기 ──
    const svgShape = shape === "custom" && !iconPath.trim() ? "rounded" : shape
    const drawCell = (key: string, x: number, y: number, size: number, fill: string, extra: { delay: number; dim: boolean; onEnter?: () => void }) => {
        // 등장: hidden=작게·투명 → playing=전환으로 원래 크기 / done=전환 없음(흐리게 강조할 때만 짧은 전환)
        const st: CSSProperties = {
            transformBox: "fill-box",
            transformOrigin: "center",
            opacity: phase === "hidden" ? 0 : extra.dim ? 0.22 : 1,
            transform: phase === "hidden" ? "scale(0.35)" : "scale(1)",
            transition:
                phase === "playing"
                    ? `opacity ${POP}ms ease ${extra.delay}ms, transform ${POP}ms cubic-bezier(0.2, 0.8, 0.2, 1.25) ${extra.delay}ms`
                    : phase === "done"
                      ? "opacity 160ms ease"
                      : "none",
        }
        let el: ReactNode
        if (svgShape === "square") el = <rect width={size} height={size} fill={fill} />
        else if (svgShape === "rounded") el = <rect width={size} height={size} rx={size * 0.22} fill={fill} />
        else if (svgShape === "circle") el = <circle cx={size / 2} cy={size / 2} r={size / 2} fill={fill} />
        else {
            const d = svgShape === "custom" ? iconPath.trim() : ICON_PATHS[svgShape]
            el = <path d={d} transform={`scale(${size / 24})`} fill={fill} />
        }
        return (
            <g key={key} transform={`translate(${x}, ${y})`} onPointerEnter={extra.onEnter}>
                <g style={st}>
                    {/* 투명 사각형: 아이콘 모양의 빈 곳에서도 호버가 잡히게 */}
                    <rect width={size} height={size} fill="transparent" />
                    {el}
                </g>
            </g>
        )
    }

    // 격자 하나를 그린다. cells[k] = 항목 k 가 차지할 칸 수 (only 를 주면 그 항목만 색칠, 나머지는 빈 칸)
    const renderGrid = (gi: number, cells: number[], only: number | null) => {
        const nodes: ReactNode[] = []
        // 칸 번호 → 항목 번호 (-1 = 빈 칸)
        const owner: number[] = []
        cells.forEach((c, k) => {
            for (let j = 0; j < c && owner.length < units; j++) owner.push(k)
        })
        while (owner.length < units) owner.push(-1)
        const filled = owner.filter((o) => o >= 0).length
        for (let i = 0; i < units; i++) {
            const { r, c } = cellPos(i, cols, rowsN, fillOrder)
            const x = c * (geo.cell + geo.g)
            const y = r * (geo.cell + geo.g)
            const k = owner[i]
            const item = k >= 0 ? (only !== null ? only : k) : -1
            const fill = item >= 0 ? tones[item] : theme.empty
            // 빈 칸은 맨 마지막에 한꺼번에, 색 칸은 채우는 순서대로 차례로 나타난다
            const delay = k >= 0 ? Math.round((filled > 1 ? i / (filled - 1) : 0) * dur) : Math.round(dur * 0.15)
            const dim = active !== null && item !== active
            nodes.push(
                drawCell(`${gi}-${i}`, x, y, geo.cell, fill, {
                    delay,
                    dim,
                    onEnter: showTooltip || layout === "combined" ? () => setHover(gi, item, x + geo.cell / 2, y) : undefined,
                })
            )
        }
        return nodes
    }

    // 호버: 칸에 올리면 그 항목 강조 + 툴팁 (빈 칸은 강조 해제)
    const setHover = (gi: number, item: number, x: number, y: number) => {
        if (item < 0) {
            setActive(null)
            setHoverCell(null)
            return
        }
        setActive(item)
        setHoverCell({ g: gi, x, y })
    }
    const clearHover = () => {
        setActive(null)
        setHoverCell(null)
    }

    // 키보드: 차트 전체가 탭 정지 1개. 방향키로 항목을 돌며 강조, Esc 로 해제
    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End", "Escape"]
        if (keys.indexOf(e.key) < 0) return
        e.preventDefault()
        if (e.key === "Escape") return clearHover()
        let next = active === null ? 0 : active
        if (active !== null) {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (active + 1) % n
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (active - 1 + n) % n
        }
        if (e.key === "Home") next = 0
        if (e.key === "End") next = n - 1
        setActive(next)
        setHoverCell(null)
    }

    // 칸 하나가 나타내는 양 (툴팁·낭독용): "Each square = 1%"
    const unitShare = 1 / units
    const unitText = `${cellWord || "Each square"} = ${makeFormatter(locale, unitShare * 100 >= 1 ? 0 : 2)(unitShare * 100)}%`
    // 항목 하나의 설명 문장 (툴팁·화면 낭독기)
    const describe = (k: number) => {
        const it = items[k]
        const cellsK = layout === "split" ? model.splitCells[k] : model.combinedCells[k]
        return `${it.name}: ${fmt.value(it.value)} (${fmt.pct(share(it.value))}), ${fmt.int(cellsK)} / ${fmt.int(units)}`
    }
    const ariaSummary = (title ? title + ". " : "") + items.map((it, k) => describe(k)).join(". ") + "."

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

    // 툴팁 (마우스를 올린 칸 위, 첫 줄이면 아래)
    const tooltip = (gi: number) => {
        if (!showTooltip || active === null || !hoverCell || hoverCell.g !== gi) return null
        const k = active
        const it = items[k]
        const lines = [it.name, `${fmt.value(it.value)} · ${fmt.pct(share(it.value))}`, unitText]
        const estW = lines.reduce((mx, s) => Math.max(mx, textUnits(s) * lfs), 0) + 24
        const left = clamp(hoverCell.x, estW / 2, Math.max(estW / 2, geo.w - estW / 2))
        const below = hoverCell.y < geo.cell * 2
        return (
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    left,
                    top: below ? hoverCell.y + geo.cell + 8 : hoverCell.y - 8,
                    transform: below ? "translateX(-50%)" : "translate(-50%, -100%)",
                    background: theme.tooltipBg,
                    color: theme.tooltipText,
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: lfs,
                    lineHeight: 1.4,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 2,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: tones[k], display: "inline-block" }} />
                    {lines[0]}
                </div>
                <div>{lines[1]}</div>
                <div style={{ opacity: 0.7 }}>{lines[2]}</div>
            </div>
        )
    }

    // 범례 칸 모양 견본
    const swatch = (color: string) => {
        const s = Math.round(lfs * 0.95)
        const r = svgShape === "circle" ? "50%" : svgShape === "square" ? 0 : Math.round(s * 0.25)
        return <span style={{ width: s, height: s, minWidth: s, borderRadius: r, background: color, display: "inline-block" }} />
    }

    const legendNode = showLegend ? (
        <ul
            style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: legendSide ? "column" : "row",
                flexWrap: legendSide ? "nowrap" : "wrap",
                gap: legendSide ? Math.round(lfs * 0.8) : `${Math.round(lfs * 0.6)}px ${Math.round(lfs * 1.4)}px`,
                width: legendSide ? legendW : "100%",
                marginTop: legendSide ? 0 : Math.round(lfs * 1.2),
            }}
        >
            {legendRows.map((r, k) => {
                const isRest = k >= n
                const dim = active !== null && active !== k
                return (
                    <li
                        key={k}
                        onPointerEnter={
                            isRest
                                ? undefined
                                : () => {
                                      setActive(k)
                                      setHoverCell(null)
                                  }
                        }
                        onPointerLeave={isRest ? undefined : clearHover}
                        style={{
                            // 글꼴 설정을 먼저 펼치고 글자 크기는 뒤에서 덮어써야 Text Scale 이 범례에도 적용됨 (11-14 수정)
                            ...labelCss,
                            display: "flex",
                            alignItems: "center",
                            gap: Math.round(8 * ts),
                            opacity: dim ? 0.4 : 1,
                            transition: "opacity 160ms ease",
                            cursor: isRest ? "default" : "pointer",
                            fontSize: lfs,
                        }}
                    >
                        {swatch(isRest ? theme.empty : tones[k])}
                        <span style={{ color: theme.text, flex: legendSide ? 1 : undefined, minWidth: 0 }}>{r.name}</span>
                        {r.val ? <span style={{ color: theme.muted, fontVariantNumeric: "tabular-nums" }}>{r.val}</span> : null}
                    </li>
                )
            })}
        </ul>
    ) : null

    // 격자 + 툴팁을 감싸는 상자 (pointerleave 로 강조 해제)
    const gridBox = (gi: number, cells: number[], only: number | null) => (
        <div style={{ position: "relative", width: geo.w, height: geo.h, flexShrink: 0 }} onPointerLeave={clearHover}>
            <svg width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} style={{ display: "block", overflow: "visible" }} aria-hidden>
                {renderGrid(gi, cells, only)}
            </svg>
            {tooltip(gi)}
        </div>
    )

    return (
        <div
            className="bu-waffle"
            style={rootStyle}
            tabIndex={0}
            role="figure"
            aria-label={ariaSummary}
            onKeyDown={onKey}
            onBlur={clearHover}
        >
            <style>{`.bu-waffle:focus-visible{box-shadow:0 0 0 2px ${tones[0]}}`}</style>
            <div ref={areaRef} style={{ width: "100%" }}>
                {/* 제목·부제 */}
                {title ? <div style={{ fontWeight: 650, fontSize: Math.round(fs * 1.15), lineHeight: 1.3 }}>{title}</div> : null}
                {subtitle ? <div style={{ ...labelStyle, marginTop: 4 }}>{subtitle}</div> : null}

                {/* 큰 숫자 */}
                {headlineNode ? (
                    <div style={{ marginTop: title || subtitle ? Math.round(fs * 0.9) : 0, display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "2px 10px" }}>
                        <span style={{ fontSize: hfs, fontWeight: 700, lineHeight: 1.05, color: headlineNode.color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
                            {headlineNode.big}
                        </span>
                        <span style={{ ...labelStyle, fontSize: Math.round(fs * 1.05), color: theme.text }}>{headlineNode.caption}</span>
                    </div>
                ) : null}

                <div style={{ height: title || subtitle || headlineNode ? Math.round(fs * 1.1) : 0 }} />

                {layout === "split" ? (
                    // 나눠 보기: 항목마다 격자 하나 + 아래에 비율과 이름
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))`, gap: `${Math.round(fs * 1.4)}px ${splitGap}px` }}>
                        {items.map((it, k) => {
                            const cells = items.map((_, j) => (j === k ? model.splitCells[k] : 0))
                            const p = share(it.value) * numProgress
                            return (
                                <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                                    {gridBox(k, cells, k)}
                                    <div style={{ marginTop: Math.round(fs * 0.6), fontSize: Math.round(fs * 1.6), fontWeight: 700, color: tones[k], fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
                                        {legendValues === "value" ? fmt.value(it.value * numProgress) : fmt.pct(p)}
                                    </div>
                                    <div style={{ ...labelStyle, color: theme.text, marginTop: 2, overflowWrap: "anywhere" }}>{it.name}</div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    // 합쳐 보기: 격자 하나 + 범례(옆 또는 아래)
                    <div style={{ display: "flex", flexDirection: legendSide ? "row" : "column", alignItems: legendSide ? "center" : "flex-start", gap: legendSide ? colGap : 0 }}>
                        {gridBox(0, model.combinedCells, null)}
                        {legendNode}
                    </div>
                )}

                {/* 칸 하나의 크기 안내 + 출처 메모 */}
                {note || cellWord ? (
                    <div style={{ ...labelStyle, marginTop: Math.round(fs * 1.1), display: "flex", flexWrap: "wrap", gap: "2px 14px" }}>
                        {cellWord ? <span>{unitText}</span> : null}
                        {note ? <span>{note}</span> : null}
                    </div>
                ) : null}

                {/* 키보드로 고른 항목을 화면 낭독기에 알림 */}
                <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    {active !== null ? describe(active) : ""}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(WaffleChart, {
    data: {
        type: ControlType.String,
        title: "Data",
        defaultValue: "",
        placeholder: "Building, 48\nMeetings, 22\nSupport, 18",
        displayTextArea: true,
        description: "One item per line: name, value. Add #HEX at the end of a line for its own color. Leave empty to show demo data.",
    },
    title: { type: ControlType.String, title: "Title", defaultValue: "Where the team's week went", placeholder: "Optional" },
    subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "", placeholder: "Optional" },
    note: { type: ControlType.String, title: "Note", defaultValue: "", placeholder: "Source: …" },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["combined", "split"],
        optionTitles: ["Combined", "Split"],
        defaultValue: "combined",
        displaySegmentedControl: true,
        description: "Split draws one grid per item.",
    },
    total: {
        type: ControlType.Number,
        title: "Total",
        defaultValue: 0,
        min: 0,
        step: 1,
        description: "0 = sum of all values. Set a bigger total (e.g. 100) to leave empty squares.",
    },
    restLabel: {
        type: ControlType.String,
        title: "Empty Label",
        defaultValue: "Not counted",
        description: "Legend name for empty squares. Clear it to hide.",
    },
    columns: { type: ControlType.Number, title: "Columns", defaultValue: 10, min: 2, max: 20, step: 1, displayStepper: true },
    rows: { type: ControlType.Number, title: "Rows", defaultValue: 10, min: 1, max: 20, step: 1, displayStepper: true },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["square", "rounded", "circle", "person", "heart", "star", "custom"],
        optionTitles: ["Square", "Rounded", "Circle", "Person", "Heart", "Star", "Custom SVG"],
        defaultValue: "rounded",
    },
    iconPath: {
        type: ControlType.String,
        title: "SVG Path",
        defaultValue: "",
        placeholder: "M12 2 L22 22 H2 Z",
        displayTextArea: true,
        description: "The d attribute of a path drawn in a 24×24 box.",
        hidden: (p: WaffleChartProps) => p.shape !== "custom",
    },
    fillOrder: {
        type: ControlType.Enum,
        title: "Fill Order",
        options: ["rows", "columns", "bottom"],
        optionTitles: ["Rows", "Columns", "Bottom Up"],
        defaultValue: "rows",
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
        hidden: (p: WaffleChartProps) => p.theme !== "custom",
    },
    colorMode: {
        type: ControlType.Enum,
        title: "Color Mode",
        options: ["solid", "shades", "palette"],
        optionTitles: ["Solid", "Shades", "Palette"],
        defaultValue: "palette",
        displaySegmentedControl: true,
        description: "Shades fades from the full color to light. Palette gives each item its own color.",
    },
    appearance: {
        type: ControlType.Enum,
        title: "Appearance",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    headline: {
        type: ControlType.Enum,
        title: "Big Number",
        options: ["percent", "ratio", "value", "none"],
        optionTitles: ["Percent", "X in N", "Value", "Hide"],
        defaultValue: "percent",
        description: "Shown above the grid in Combined layout.",
        hidden: (p: WaffleChartProps) => p.layout === "split",
    },
    headlineItem: {
        type: ControlType.Number,
        title: "Number Of",
        defaultValue: 1,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
        description: "Which line the big number describes.",
        hidden: (p: WaffleChartProps) => p.layout === "split" || p.headline === "none",
    },
    ratioBase: {
        type: ControlType.Number,
        title: "N",
        defaultValue: 10,
        min: 2,
        max: 1000,
        step: 1,
        description: "10 gives \"5 in 10\".",
        hidden: (p: WaffleChartProps) => p.layout === "split" || p.headline !== "ratio",
    },
    ratioWord: {
        type: ControlType.String,
        title: "In Word",
        defaultValue: "in",
        hidden: (p: WaffleChartProps) => p.layout === "split" || p.headline !== "ratio",
    },
    headlineCaption: {
        type: ControlType.String,
        title: "Caption",
        defaultValue: "",
        placeholder: "Item name",
        hidden: (p: WaffleChartProps) => p.layout === "split" || p.headline === "none",
    },
    legend: {
        type: ControlType.Enum,
        title: "Legend",
        options: ["auto", "side", "bottom", "none"],
        optionTitles: ["Auto", "Side", "Bottom", "Hide"],
        defaultValue: "auto",
        description: "Auto puts it beside the grid when there is room.",
        hidden: (p: WaffleChartProps) => p.layout === "split",
    },
    legendValues: {
        type: ControlType.Enum,
        title: "Values",
        options: ["percent", "value", "both", "none"],
        optionTitles: ["Percent", "Value", "Both", "Hide"],
        defaultValue: "percent",
    },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "", placeholder: "$" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "", placeholder: " hrs" },
    decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 0, min: 0, max: 3, step: 1, displayStepper: true },
    percentDecimals: { type: ControlType.Number, title: "% Decimals", defaultValue: 0, min: 0, max: 2, step: 1, displayStepper: true },
    locale: {
        type: ControlType.String,
        title: "Locale",
        defaultValue: "en-US",
        placeholder: "en-US, de-DE, ja-JP…",
        description: "Number format, e.g. 1,200 or 1.200.",
    },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    cellWord: {
        type: ControlType.String,
        title: "Scale Text",
        defaultValue: "Each square",
        description: "Shown as \"Each square = 1%\". Clear it to hide.",
    },
    cellSize: { type: ControlType.Number, title: "Max Square", defaultValue: 26, min: 6, max: 80, step: 1, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 4, min: 0, max: 24, step: 1, unit: "px" },
    textScale: { type: ControlType.Number, title: "Text Scale", defaultValue: 1, min: 0.5, max: 3, step: 0.05, unit: "×" },
    customColors: {
        type: ControlType.Boolean,
        title: "Colors",
        defaultValue: false,
        enabledTitle: "Custom",
        disabledTitle: "Preset",
    },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        hidden: (p: WaffleChartProps) => !p.customColors,
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            muted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#6B6B76" },
            empty: { type: ControlType.Color, title: "Empty Square", defaultValue: "#EDEDEF" },
            tooltipBg: { type: ControlType.Color, title: "Tooltip", defaultValue: "#111114" },
            tooltipText: { type: ControlType.Color, title: "Tooltip Text", defaultValue: "#FFFFFF" },
        },
    },
    animate: { type: ControlType.Boolean, title: "Animate In", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    countUp: {
        type: ControlType.Boolean,
        title: "Count Up",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p: WaffleChartProps) => !p.animate,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 900,
        min: 200,
        max: 4000,
        step: 50,
        unit: "ms",
        hidden: (p: WaffleChartProps) => !p.animate,
    },
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
