// [생성일] 2026-10-18
// [경위] 달러벌기 33번 상품: 버블 차트(x/y 위치 + 거품 크기=3번째 값 + 그룹 색). 숫자 축·눈금·격자·범례 토글·툴팁·사분면 선
// [변경이력]
//   - 2026-10-18: 최초 생성 (점 최대 40개 · 축 자동/수동 · 크기 px 매핑(면적/선형) · 그룹 색 6개 + 클릭 숨김 범례 · 라벨 항상/호버/없음 · 사분면 선(중앙/평균/직접) · 등장 1회 · 정적·캔버스 완성 상태)
//   - 2026-10-31: 프레이머 자동 심사 권고 반영 — outline:none 제거 후 키보드 초점(:focus-visible) 테두리 추가, any 타입을 CSSProperties·BubbleChartProps 로 교체

import { useEffect, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties } from "react"
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
interface Item {
    label?: string
    x?: number
    y?: number
    size?: number
    group?: string
}

interface Colors {
    background?: string
    text?: string
    muted?: string
    grid?: string
    tooltipBg?: string
    tooltipText?: string
    group1?: string
    group2?: string
    group3?: string
    group4?: string
    group5?: string
    group6?: string
}

interface FormatOptions {
    prefix: string
    suffix: string
    decimals: number
    thousands: boolean
    compact: boolean
}

interface Point {
    label: string
    x: number
    y: number
    size: number
    group: string
    order: number
}

const MAX_ITEMS = 40

// 설치 직후 보이는 샘플: 마케팅 채널 비교 (x=리드당 비용, y=전환율, 크기=월 리드 수)
const SAMPLE: Item[] = [
    { label: "Google Ads", x: 42, y: 3.8, size: 1200, group: "Paid" },
    { label: "Meta Ads", x: 28, y: 2.4, size: 1850, group: "Paid" },
    { label: "LinkedIn", x: 86, y: 4.6, size: 420, group: "Paid" },
    { label: "TikTok Ads", x: 19, y: 1.2, size: 1500, group: "Paid" },
    { label: "SEO", x: 9, y: 3.1, size: 2100, group: "Organic" },
    { label: "Blog", x: 12, y: 2.2, size: 1300, group: "Organic" },
    { label: "YouTube", x: 24, y: 3.4, size: 780, group: "Organic" },
    { label: "Email", x: 6, y: 5.8, size: 640, group: "Owned" },
    { label: "Newsletter", x: 8, y: 4.9, size: 380, group: "Owned" },
    { label: "Webinars", x: 58, y: 6.2, size: 260, group: "Owned" },
    { label: "Affiliates", x: 33, y: 4.2, size: 540, group: "Partners" },
    { label: "Referrals", x: 14, y: 6.8, size: 310, group: "Partners" },
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

// 색을 target 쪽으로 t(0~1)만큼 섞기 (6개 넘는 그룹의 색을 어둡게 재사용할 때)
function mixColor(c: string, target: [number, number, number], t: number): string {
    const rgb = parseColor(c)
    if (!rgb) return c
    const k = Math.max(0, Math.min(1, t))
    return `rgb(${Math.round(rgb[0] + (target[0] - rgb[0]) * k)}, ${Math.round(rgb[1] + (target[1] - rgb[1]) * k)}, ${Math.round(rgb[2] + (target[2] - rgb[2]) * k)})`
}

// 거품 위 글자색: 배경 밝기에 맞춰 읽기 좋은 색
function readableOn(bg: string): string {
    const rgb = parseColor(bg)
    if (!rgb) return "#111114"
    const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
    return lum > 0.62 ? "#111114" : "#FFFFFF"
}

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
}

function fontSizeOf(ctl: CSSProperties | undefined, fallback: number): number {
    const n = parseFloat(String(ctl && ctl.fontSize))
    return isFinite(n) && n > 0 ? n : fallback
}

// 숫자 형식: 접두어 · 접미어 · 소수 자리 · 천 단위 구분 · k/M 줄임
function formatValue(v: number, o: FormatOptions): string {
    const abs = Math.abs(v)
    let n = abs
    let unit = ""
    if (o.compact) {
        if (abs >= 1e9) { n = abs / 1e9; unit = "B" }
        else if (abs >= 1e6) { n = abs / 1e6; unit = "M" }
        else if (abs >= 1e3) { n = abs / 1e3; unit = "k" }
    }
    let s: string
    const d = Math.max(0, Math.min(6, Math.round(o.decimals)))
    if (unit) {
        s = String(parseFloat(n.toFixed(Math.max(d, 1))))
    } else {
        s = n.toFixed(d)
        if (o.thousands) {
            const parts = s.split(".")
            s = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "")
        }
    }
    return (v < 0 ? "−" : "") + o.prefix + s + unit + o.suffix
}

// 눈금 간격: 1·2·5 × 10^n 중 하나
function niceStep(range: number, ticks: number): number {
    const raw = range / Math.max(1, ticks)
    const p = Math.pow(10, Math.floor(Math.log10(raw)))
    const f = raw / p
    const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
    return n * p
}

function clean12(v: number) {
    return parseFloat(v.toPrecision(12))
}

// 자동 축 범위: 데이터 범위에 여백을 주고 눈금에 맞춰 반올림. 0 이상 데이터는 0 밑으로 내려가지 않음
function autoDomain(vals: number[], ticks: number): [number, number] {
    let mn = Math.min(...vals)
    let mx = Math.max(...vals)
    if (!isFinite(mn) || !isFinite(mx)) return [0, 1]
    if (mn === mx) {
        const d = mn === 0 ? 1 : Math.abs(mn) * 0.2
        mn -= d
        mx += d
    }
    const pad = (mx - mn) * 0.06
    let lo = mn - pad
    let hi = mx + pad
    if (mn >= 0 && lo < 0) lo = 0
    const step = niceStep(hi - lo, ticks)
    lo = clean12(Math.floor(lo / step + 1e-9) * step)
    hi = clean12(Math.ceil(hi / step - 1e-9) * step)
    return [lo, hi]
}

// 눈금 값 목록 (범위 안에서 step 간격)
function makeTicks(lo: number, hi: number, ticks: number): { values: number[]; step: number } {
    const step = niceStep(hi - lo, ticks)
    const values: number[] = []
    let v = Math.ceil(lo / step - 1e-9) * step
    for (let i = 0; i < 40 && v <= hi + step * 1e-6; i++) {
        values.push(clean12(v))
        v += step
    }
    return { values, step }
}

function decimalsForStep(step: number): number {
    if (step >= 1) return 0
    return clamp(Math.ceil(-Math.log10(step) - 1e-9), 0, 4)
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface BubbleChartProps {
    items?: Item[]
    xTitle?: string
    yTitle?: string
    sizeTitle?: string
    xRange?: "auto" | "manual"
    xMin?: number
    xMax?: number
    yRange?: "auto" | "manual"
    yMin?: number
    yMax?: number
    ticks?: number
    showGrid?: boolean
    showTicks?: boolean
    minSize?: number
    maxSize?: number
    sizeScale?: "area" | "linear"
    bubbleOpacity?: number
    labels?: "always" | "hover" | "none"
    showQuadrants?: boolean
    quadrantMode?: "center" | "average" | "custom"
    quadrantX?: number
    quadrantY?: number
    quadTL?: string
    quadTR?: string
    quadBL?: string
    quadBR?: string
    xPrefix?: string
    xSuffix?: string
    yPrefix?: string
    ySuffix?: string
    sizePrefix?: string
    sizeSuffix?: string
    decimals?: number
    thousands?: boolean
    compact?: boolean
    showLegend?: boolean
    legendPosition?: "bottom" | "top"
    showTooltip?: boolean
    appearance?: "light" | "dark"
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
 * Bubble Chart — x/y 위치에 거품 크기(3번째 값)와 그룹 색을 더한 버블 차트. 축·눈금·툴팁·범례·사분면 선 포함.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 480
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function BubbleChart(props: BubbleChartProps) {
    const {
        items = SAMPLE,
        xTitle = "Cost per lead",
        yTitle = "Conversion rate",
        sizeTitle = "Monthly leads",
        xRange = "auto",
        xMin = 0,
        xMax = 100,
        yRange = "auto",
        yMin = 0,
        yMax = 10,
        ticks = 5,
        showGrid = true,
        showTicks = true,
        minSize = 8,
        maxSize = 34,
        sizeScale = "area",
        bubbleOpacity = 0.78,
        labels = "always",
        showQuadrants = true,
        quadrantMode = "average",
        quadrantX = 50,
        quadrantY = 5,
        quadTL = "Cheap & converts",
        quadTR = "Premium",
        quadBL = "Cheap, low yield",
        quadBR = "Money pit",
        xPrefix = "$",
        xSuffix = "",
        yPrefix = "",
        ySuffix = "%",
        sizePrefix = "",
        sizeSuffix = "",
        decimals = 0,
        thousands = true,
        compact = false,
        showLegend = true,
        legendPosition = "bottom",
        showTooltip = true,
        appearance = "light",
        customColors = false,
        colors: colorProps,
        animate = true,
        stagger = 45,
        radius = 0,
        padding = 8,
        font,
        axisFont,
        style,
    } = props

    const areaRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 720, h: 400 })
    const [active, setActive] = useState<number>(-1)
    const [hiddenGroups, setHiddenGroups] = useState<string[]>([])

    // ── 색 기본값: Appearance 에 따르고, Custom Colors 를 켰을 때만 입력값 사용 ──
    // (프레이머는 기본값 없는 Color 컨트롤을 파란색으로 채워 넘기므로 토글로 분리)
    const cs = customColors ? colorProps : undefined
    const dark = appearance === "dark"
    const theme = {
        background: cs?.background ?? (dark ? "#101114" : "rgba(255, 255, 255, 0)"),
        text: cs?.text ?? (dark ? "#F4F4F6" : "#111114"),
        muted: cs?.muted ?? (dark ? "#9A9AA6" : "#6B6B76"),
        grid: cs?.grid ?? (dark ? "rgba(255, 255, 255, 0.10)" : "rgba(17, 17, 20, 0.09)"),
        tooltipBg: cs?.tooltipBg ?? (dark ? "#F4F4F6" : "#111114"),
        tooltipText: cs?.tooltipText ?? (dark ? "#111114" : "#FFFFFF"),
    }
    const palette = [
        cs?.group1 ?? "#2DE5A0",
        cs?.group2 ?? "#6C7BFF",
        cs?.group3 ?? "#FF6B6B",
        cs?.group4 ?? "#FFB547",
        cs?.group5 ?? "#B06CFF",
        cs?.group6 ?? "#2BB6D9",
    ]
    const bgRgb = parseColor(theme.background)
    const halo = bgRgb && bgRgb[3] > 0.5 ? theme.background : dark ? "#101114" : "#FFFFFF"

    // ── 차트 영역 크기 측정 (리사이즈 대응, SVG 는 측정값으로 viewBox 를 잡아 글자가 늘어나지 않음) ──
    useEffect(() => {
        const el = areaRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const apply = () => {
            const r = el.getBoundingClientRect()
            if (r.width > 0 && r.height > 0) startTransition(() => setSize({ w: r.width, h: r.height }))
        }
        apply()
        const ro = new ResizeObserver(apply)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // ── 등장 애니메이션 (한 번만, 화면에 보일 때 시작) ──
    // 정적 렌더·캔버스·화면 밖·모션 줄이기 설정에서는 완성된 상태를 즉시 보여줌
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
                        t2 = window.setTimeout(() => startTransition(() => setPhase("done")), MAX_ITEMS * Math.max(0, stagger) + 800)
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

    // ── 데이터 정리: x·y 가 숫자가 아닌 항목 제외, 최대 40개 ──
    const clean: Point[] = useMemo(() => {
        const list = Array.isArray(items) ? items.slice(0, MAX_ITEMS) : []
        const out: Point[] = []
        list.forEach((it, i) => {
            const x = Number(it && it.x)
            const y = Number(it && it.y)
            if (!it || it.x === undefined || it.y === undefined || !isFinite(x) || !isFinite(y)) return
            const s = Number(it.size)
            out.push({
                label: (it.label || "").trim(),
                x,
                y,
                size: isFinite(s) ? s : 0,
                group: (it.group || "").trim() || "General",
                order: i,
            })
        })
        return out
    }, [items])

    // 그룹: 처음 나온 순서대로 색 배정 (6개 넘으면 어둡게 다시 사용)
    const groups = useMemo(() => {
        const names: string[] = []
        clean.forEach((p) => {
            if (names.indexOf(p.group) < 0) names.push(p.group)
        })
        const colorOf: Record<string, string> = {}
        names.forEach((n, i) => {
            const base = palette[i % palette.length]
            colorOf[n] = i < palette.length ? base : mixColor(base, [0, 0, 0], 0.25 * Math.floor(i / palette.length))
        })
        return { names, colorOf }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clean, palette.join("|")])

    // ── 축 범위 (그룹을 숨겨도 축이 흔들리지 않도록 전체 데이터 기준) ──
    const tk = clamp(Math.round(ticks), 2, 10)
    const xs = clean.map((p) => p.x)
    const ys = clean.map((p) => p.y)
    const [xLo, xHi] = xRange === "manual" && xMax > xMin ? [xMin, xMax] : autoDomain(xs.length ? xs : [0, 1], tk)
    const [yLo, yHi] = yRange === "manual" && yMax > yMin ? [yMin, yMax] : autoDomain(ys.length ? ys : [0, 1], tk)
    const xTicks = makeTicks(xLo, xHi, tk)
    const yTicks = makeTicks(yLo, yHi, tk)

    const fs = fontSizeOf(font, 12)
    const afs = fontSizeOf(axisFont, 12)
    const fontCss: CSSProperties = { ...(font || {}) }
    const axisCss: CSSProperties = { ...(axisFont || {}) }

    const dec = clamp(Math.round(decimals), 0, 4)
    const fmtX: FormatOptions = { prefix: xPrefix, suffix: xSuffix, decimals: dec, thousands, compact }
    const fmtY: FormatOptions = { prefix: yPrefix, suffix: ySuffix, decimals: dec, thousands, compact }
    const fmtS: FormatOptions = { prefix: sizePrefix, suffix: sizeSuffix, decimals: dec, thousands, compact }
    const tickX: FormatOptions = { ...fmtX, decimals: decimalsForStep(xTicks.step) }
    const tickY: FormatOptions = { ...fmtY, decimals: decimalsForStep(yTicks.step) }

    // ── 플롯 영역 여백: y 눈금 글자 폭 · 축 제목 · 거품이 가장자리에서 잘리지 않을 여유 ──
    const maxR = Math.max(minSize, maxSize)
    const yTickW = showTicks ? Math.max(...yTicks.values.map((v) => formatValue(v, tickY).length), 1) * afs * 0.58 + 8 : 4
    const mLeft = 8 + (yTitle ? afs + 10 : 0) + yTickW
    const mBottom = 8 + (xTitle ? afs + 10 : 0) + (showTicks ? afs + 8 : 4)
    const mTop = Math.max(10, Math.min(maxR, 24))
    const mRight = Math.max(14, Math.min(maxR, 28))
    const W = size.w
    const H = size.h
    const px0 = mLeft
    const px1 = Math.max(px0 + 40, W - mRight)
    const py0 = mTop
    const py1 = Math.max(py0 + 40, H - mBottom)
    const sx = (v: number) => px0 + ((v - xLo) / (xHi - xLo || 1)) * (px1 - px0)
    const sy = (v: number) => py1 - ((v - yLo) / (yHi - yLo || 1)) * (py1 - py0)

    // ── 거품 크기 매핑: 최소~최대 px 반지름 (면적 비례 또는 선형) ──
    const sMin = clean.length ? Math.min(...clean.map((p) => p.size)) : 0
    const sMax = clean.length ? Math.max(...clean.map((p) => p.size)) : 0
    const rMinPx = Math.max(1, Math.min(minSize, maxSize))
    const rMaxPx = Math.max(rMinPx, maxSize)
    const radiusOf = (v: number) => {
        if (sMax <= sMin) return (rMinPx + rMaxPx) / 2
        const t = clamp((v - sMin) / (sMax - sMin), 0, 1)
        return rMinPx + (rMaxPx - rMinPx) * (sizeScale === "area" ? Math.sqrt(t) : t)
    }

    // 보이는 점: 숨긴 그룹과 수동 범위 밖의 점 제외. 큰 거품을 먼저 그려 작은 거품이 위에 오도록 정렬
    const drawn = useMemo(() => {
        const list = clean
            .map((p, idx) => ({ p, idx }))
            .filter(({ p }) => hiddenGroups.indexOf(p.group) < 0 && p.x >= xLo && p.x <= xHi && p.y >= yLo && p.y <= yHi)
        list.sort((a, b) => b.p.size - a.p.size || a.idx - b.idx)
        return list
    }, [clean, hiddenGroups, xLo, xHi, yLo, yHi])

    // ── 사분면 기준선 ──
    let qx = (xLo + xHi) / 2
    let qy = (yLo + yHi) / 2
    if (quadrantMode === "custom") {
        qx = quadrantX
        qy = quadrantY
    } else if (quadrantMode === "average" && drawn.length) {
        qx = drawn.reduce((a, d) => a + d.p.x, 0) / drawn.length
        qy = drawn.reduce((a, d) => a + d.p.y, 0) / drawn.length
    }
    const qxPx = clamp(sx(qx), px0, px1)
    const qyPx = clamp(sy(qy), py0, py1)

    const hidden = phase === "hidden"
    const playing = phase === "playing"
    const toggleGroup = (g: string) =>
        startTransition(() => setHiddenGroups((cur) => (cur.indexOf(g) >= 0 ? cur.filter((x) => x !== g) : cur.concat(g))))
    const show = (i: number) => startTransition(() => setActive(i))
    const hide = () => startTransition(() => setActive(-1))

    const outerStyle: CSSProperties = {
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 120,
        minHeight: 120,
        background: theme.background,
        borderRadius: radius,
        padding,
        display: "flex",
        flexDirection: legendPosition === "top" ? "column-reverse" : "column",
        overflow: "hidden",
        boxSizing: "border-box",
        color: theme.text,
    }

    // 점이 하나도 없을 때 안내 (0×0 방지 + 빈 화면 방지)
    if (clean.length === 0) {
        return (
            <div style={{ ...outerStyle, alignItems: "center", justifyContent: "center", color: theme.muted, ...fontCss }}>
                Add items with X and Y values to build your bubble chart
            </div>
        )
    }

    const activePoint = active >= 0 && active < clean.length ? clean[active] : null
    const activeVisible = activePoint && drawn.some((d) => d.idx === active)
    const colorFor = (g: string) => groups.colorOf[g] || palette[0]

    // 툴팁 위치: 거품 위쪽(공간이 없으면 아래쪽)
    let tipLeft = 0
    let tipTop = 0
    let tipBelow = false
    if (activePoint && activeVisible) {
        const r = radiusOf(activePoint.size)
        tipLeft = clamp(sx(activePoint.x), 96, Math.max(96, W - 96))
        const cy = sy(activePoint.y)
        tipBelow = cy - r < 100
        tipTop = tipBelow ? cy + r + 8 : cy - r - 8
    }

    const tName = (s: string, fb: string) => (s && s.trim() ? s.trim() : fb)
    const quadText: CSSProperties = { ...axisCss, fontSize: afs, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }

    return (
        <div style={{ ...outerStyle, "--bu-bc-focus": theme.text } as CSSProperties}>
            {/* 2026-10-31: 키보드로 이동할 때만 보이는 초점 테두리 (SVG 거품은 outline 이 안 그려질 수 있어 선 색·굵기도 함께 바꿈) */}
            <style>{".bu-bc-bubble:focus-visible{outline:2px solid var(--bu-bc-focus);outline-offset:2px}.bu-bc-bubble:focus-visible circle{stroke:var(--bu-bc-focus);stroke-width:3px}.bu-bc-legend:focus-visible{outline:2px solid var(--bu-bc-focus);outline-offset:2px}.bu-bc-bubble:focus:not(:focus-visible),.bu-bc-legend:focus:not(:focus-visible){outline:none}"}</style>
            {/* 범례: 그룹별 색 (클릭하면 그 그룹을 숨김/표시) */}
            {showLegend && groups.names.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 8px", padding: legendPosition === "top" ? "0 2px 10px" : "10px 2px 0", flex: "0 0 auto", ...fontCss, fontSize: fs }}>
                    {groups.names.map((g) => {
                        const off = hiddenGroups.indexOf(g) >= 0
                        return (
                            <button
                                key={g}
                                className="bu-bc-legend"
                                type="button"
                                aria-pressed={!off}
                                onClick={() => toggleGroup(g)}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "3px 8px",
                                    margin: 0,
                                    border: "none",
                                    borderRadius: 999,
                                    background: "transparent",
                                    color: theme.text,
                                    cursor: "pointer",
                                    font: "inherit",
                                    fontSize: fs,
                                    opacity: off ? 0.4 : 1,
                                    textDecoration: off ? "line-through" : "none",
                                    transition: "opacity 150ms ease",
                                }}
                            >
                                <span style={{ width: 10, height: 10, borderRadius: 999, background: colorFor(g), flex: "0 0 auto" }} />
                                {g}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* 차트 영역 */}
            <div ref={areaRef} style={{ position: "relative", flex: "1 1 0", minHeight: 80, overflow: "visible" }}>
                <svg
                    role="group"
                    aria-label={tName(yTitle, "Y") + " versus " + tName(xTitle, "X") + " bubble chart"}
                    viewBox={`0 0 ${W} ${H}`}
                    width={W}
                    height={H}
                    style={{ position: "absolute", left: 0, top: 0, display: "block", overflow: "visible" }}
                >
                    {/* 격자선 + 눈금 글자 */}
                    {xTicks.values.map((v) => (
                        <g key={"xt" + v}>
                            {showGrid && <line x1={sx(v)} x2={sx(v)} y1={py0} y2={py1} stroke={theme.grid} strokeWidth={1} />}
                            {showTicks && (
                                <text x={sx(v)} y={py1 + afs + 6} textAnchor="middle" fill={theme.muted} style={{ ...axisCss, fontSize: afs }}>
                                    {formatValue(v, tickX)}
                                </text>
                            )}
                        </g>
                    ))}
                    {yTicks.values.map((v) => (
                        <g key={"yt" + v}>
                            {showGrid && <line x1={px0} x2={px1} y1={sy(v)} y2={sy(v)} stroke={theme.grid} strokeWidth={1} />}
                            {showTicks && (
                                <text x={px0 - 8} y={sy(v)} textAnchor="end" dominantBaseline="central" fill={theme.muted} style={{ ...axisCss, fontSize: afs }}>
                                    {formatValue(v, tickY)}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* 축선 */}
                    <line x1={px0} x2={px1} y1={py1} y2={py1} stroke={theme.muted} strokeOpacity={0.5} strokeWidth={1} />
                    <line x1={px0} x2={px0} y1={py0} y2={py1} stroke={theme.muted} strokeOpacity={0.5} strokeWidth={1} />

                    {/* 축 제목 */}
                    {xTitle && (
                        <text x={(px0 + px1) / 2} y={H - 6} textAnchor="middle" fill={theme.text} style={{ ...axisCss, fontSize: afs, fontWeight: 600 }}>
                            {xTitle}
                        </text>
                    )}
                    {yTitle && (
                        <text transform={`translate(${afs + 2} ${(py0 + py1) / 2}) rotate(-90)`} textAnchor="middle" fill={theme.text} style={{ ...axisCss, fontSize: afs, fontWeight: 600 }}>
                            {yTitle}
                        </text>
                    )}

                    {/* 사분면 선 + 이름 */}
                    {showQuadrants && (
                        <g>
                            <line x1={qxPx} x2={qxPx} y1={py0} y2={py1} stroke={theme.muted} strokeOpacity={0.7} strokeWidth={1.25} strokeDasharray="5 5" />
                            <line x1={px0} x2={px1} y1={qyPx} y2={qyPx} stroke={theme.muted} strokeOpacity={0.7} strokeWidth={1.25} strokeDasharray="5 5" />
                            {quadTL && (
                                <text x={px0 + 8} y={py0 + afs + 4} textAnchor="start" fill={theme.muted} style={quadText}>
                                    {quadTL}
                                </text>
                            )}
                            {quadTR && (
                                <text x={px1 - 8} y={py0 + afs + 4} textAnchor="end" fill={theme.muted} style={quadText}>
                                    {quadTR}
                                </text>
                            )}
                            {quadBL && (
                                <text x={px0 + 8} y={py1 - 8} textAnchor="start" fill={theme.muted} style={quadText}>
                                    {quadBL}
                                </text>
                            )}
                            {quadBR && (
                                <text x={px1 - 8} y={py1 - 8} textAnchor="end" fill={theme.muted} style={quadText}>
                                    {quadBR}
                                </text>
                            )}
                        </g>
                    )}

                    {/* 거품 */}
                    {drawn.map(({ p, idx }, k) => {
                        const cx = sx(p.x)
                        const cy = sy(p.y)
                        const r = radiusOf(p.size)
                        const fill = colorFor(p.group)
                        const dim = active >= 0 && active !== idx
                        const delay = k * Math.max(0, stagger)
                        const motion: CSSProperties =
                            phase === "done"
                                ? { transition: "opacity 160ms ease", opacity: dim ? 0.3 : 1 }
                                : {
                                      transform: hidden ? "scale(0)" : "scale(1)",
                                      opacity: hidden ? 0 : undefined,
                                      transition: playing ? `transform 560ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, opacity 360ms ease ${delay}ms` : "none",
                                  }
                        return (
                            <g
                                key={"b" + idx}
                                role="img"
                                aria-label={`${p.label || "Point " + (idx + 1)}, ${p.group}: ${tName(xTitle, "X")} ${formatValue(p.x, fmtX)}, ${tName(yTitle, "Y")} ${formatValue(p.y, fmtY)}, ${tName(sizeTitle, "Size")} ${formatValue(p.size, fmtS)}`}
                                tabIndex={0}
                                onMouseEnter={() => show(idx)}
                                onMouseLeave={hide}
                                onFocus={() => show(idx)}
                                onBlur={hide}
                                onClick={() => show(active === idx ? -1 : idx)}
                                className="bu-bc-bubble"
                                style={{ cursor: showTooltip ? "pointer" : "default", transformBox: "fill-box", transformOrigin: "center", ...motion }}
                            >
                                <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={bubbleOpacity} stroke={fill} strokeWidth={active === idx ? 2.5 : 1.5} />
                            </g>
                        )
                    })}

                    {/* 라벨: 거품 안에 들어가면 안에, 아니면 옆에 */}
                    {labels !== "none" &&
                        drawn.map(({ p, idx }) => {
                            if (!p.label) return null
                            if (labels === "hover" && active !== idx) return null
                            const cx = sx(p.x)
                            const cy = sy(p.y)
                            const r = radiusOf(p.size)
                            const tw = p.label.length * fs * 0.58
                            const inside = tw <= r * 1.7 && fs <= r * 1.6
                            const fill = colorFor(p.group)
                            const right = cx + r + 5 + tw <= W - 4
                            const dim = active >= 0 && active !== idx
                            return (
                                <text
                                    key={"l" + idx}
                                    x={inside ? cx : right ? cx + r + 5 : cx - r - 5}
                                    y={cy}
                                    textAnchor={inside ? "middle" : right ? "start" : "end"}
                                    dominantBaseline="central"
                                    fill={inside ? readableOn(fill) : theme.text}
                                    stroke={inside ? "none" : halo}
                                    strokeWidth={inside ? 0 : 3}
                                    strokeLinejoin="round"
                                    paintOrder="stroke"
                                    style={{ ...fontCss, fontSize: fs, fontWeight: 600, pointerEvents: "none", opacity: hidden ? 0 : dim ? 0.3 : 1, transition: playing ? "opacity 500ms ease 400ms" : "opacity 160ms ease" }}
                                >
                                    {p.label}
                                </text>
                            )
                        })}
                </svg>

                {/* 호버 툴팁: 라벨 · 그룹 · X · Y · 크기 값 */}
                {showTooltip && activePoint && activeVisible && (
                    <div
                        style={{
                            position: "absolute",
                            left: tipLeft,
                            top: tipTop,
                            transform: tipBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
                            background: theme.tooltipBg,
                            color: theme.tooltipText,
                            padding: "8px 10px",
                            borderRadius: 8,
                            pointerEvents: "none",
                            whiteSpace: "nowrap",
                            zIndex: 5,
                            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                            ...fontCss,
                            fontSize: fs,
                            lineHeight: 1.4,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 999, background: colorFor(activePoint.group), flex: "0 0 auto" }} />
                            {activePoint.label || "Point " + (active + 1)}
                        </div>
                        <div style={{ opacity: 0.7 }}>{activePoint.group}</div>
                        <div>
                            {tName(xTitle, "X")}: {formatValue(activePoint.x, fmtX)}
                        </div>
                        <div>
                            {tName(yTitle, "Y")}: {formatValue(activePoint.y, fmtY)}
                        </div>
                        <div>
                            {tName(sizeTitle, "Size")}: {formatValue(activePoint.size, fmtS)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

BubbleChart.displayName = "Bubble Chart"

// ─────────────────────────────────────────────
// 속성 컨트롤 (중요도순)
// ─────────────────────────────────────────────
addPropertyControls(BubbleChart, {
    items: {
        type: ControlType.Array,
        title: "Points",
        maxCount: MAX_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Point" },
                x: { type: ControlType.Number, title: "X", defaultValue: 50, min: -1000000000, max: 1000000000, step: 0.1, displayStepper: true },
                y: { type: ControlType.Number, title: "Y", defaultValue: 50, min: -1000000000, max: 1000000000, step: 0.1, displayStepper: true },
                size: { type: ControlType.Number, title: "Size Value", defaultValue: 100, min: -1000000000, max: 1000000000, step: 1, displayStepper: true },
                group: { type: ControlType.String, title: "Group", defaultValue: "", placeholder: "Optional" },
            },
        },
        defaultValue: SAMPLE,
    },
    xTitle: { type: ControlType.String, title: "X Title", defaultValue: "Cost per lead" },
    yTitle: { type: ControlType.String, title: "Y Title", defaultValue: "Conversion rate" },
    sizeTitle: { type: ControlType.String, title: "Size Title", defaultValue: "Monthly leads", description: "Name of the bubble-size value, shown in the tooltip." },
    xRange: {
        type: ControlType.Enum,
        title: "X Range",
        options: ["auto", "manual"],
        optionTitles: ["Auto", "Manual"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    xMin: { type: ControlType.Number, title: "X Min", defaultValue: 0, min: -1000000000, max: 1000000000, step: 1, displayStepper: true, hidden: (p: BubbleChartProps) => p.xRange !== "manual" },
    xMax: { type: ControlType.Number, title: "X Max", defaultValue: 100, min: -1000000000, max: 1000000000, step: 1, displayStepper: true, hidden: (p: BubbleChartProps) => p.xRange !== "manual" },
    yRange: {
        type: ControlType.Enum,
        title: "Y Range",
        options: ["auto", "manual"],
        optionTitles: ["Auto", "Manual"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    yMin: { type: ControlType.Number, title: "Y Min", defaultValue: 0, min: -1000000000, max: 1000000000, step: 1, displayStepper: true, hidden: (p: BubbleChartProps) => p.yRange !== "manual" },
    yMax: { type: ControlType.Number, title: "Y Max", defaultValue: 10, min: -1000000000, max: 1000000000, step: 1, displayStepper: true, hidden: (p: BubbleChartProps) => p.yRange !== "manual" },
    ticks: { type: ControlType.Number, title: "Ticks", defaultValue: 5, min: 2, max: 10, step: 1, displayStepper: true },
    showGrid: { type: ControlType.Boolean, title: "Gridlines", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showTicks: { type: ControlType.Boolean, title: "Tick Labels", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    minSize: { type: ControlType.Number, title: "Min Radius", defaultValue: 8, min: 2, max: 60, step: 1, unit: "px" },
    maxSize: { type: ControlType.Number, title: "Max Radius", defaultValue: 34, min: 4, max: 120, step: 1, unit: "px" },
    sizeScale: {
        type: ControlType.Enum,
        title: "Size Scale",
        options: ["area", "linear"],
        optionTitles: ["By Area", "Linear"],
        defaultValue: "area",
        displaySegmentedControl: true,
        description: "By Area keeps bubble areas proportional to the value.",
    },
    bubbleOpacity: { type: ControlType.Number, title: "Bubble Opacity", defaultValue: 0.78, min: 0.2, max: 1, step: 0.01 },
    labels: {
        type: ControlType.Enum,
        title: "Labels",
        options: ["always", "hover", "none"],
        optionTitles: ["Always", "On Hover", "None"],
        defaultValue: "always",
    },
    showQuadrants: { type: ControlType.Boolean, title: "Quadrants", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    quadrantMode: {
        type: ControlType.Enum,
        title: "Split At",
        options: ["center", "average", "custom"],
        optionTitles: ["Center", "Average", "Custom"],
        defaultValue: "average",
        hidden: (p: BubbleChartProps) => !p.showQuadrants,
    },
    quadrantX: { type: ControlType.Number, title: "Split X", defaultValue: 50, min: -1000000000, max: 1000000000, step: 1, displayStepper: true, hidden: (p: BubbleChartProps) => !p.showQuadrants || p.quadrantMode !== "custom" },
    quadrantY: { type: ControlType.Number, title: "Split Y", defaultValue: 5, min: -1000000000, max: 1000000000, step: 0.1, displayStepper: true, hidden: (p: BubbleChartProps) => !p.showQuadrants || p.quadrantMode !== "custom" },
    quadTL: { type: ControlType.String, title: "Top Left", defaultValue: "Cheap & converts", hidden: (p: BubbleChartProps) => !p.showQuadrants },
    quadTR: { type: ControlType.String, title: "Top Right", defaultValue: "Premium", hidden: (p: BubbleChartProps) => !p.showQuadrants },
    quadBL: { type: ControlType.String, title: "Bottom Left", defaultValue: "Cheap, low yield", hidden: (p: BubbleChartProps) => !p.showQuadrants },
    quadBR: { type: ControlType.String, title: "Bottom Right", defaultValue: "Money pit", hidden: (p: BubbleChartProps) => !p.showQuadrants },
    xPrefix: { type: ControlType.String, title: "X Prefix", defaultValue: "$", placeholder: "$, €, ₩" },
    xSuffix: { type: ControlType.String, title: "X Suffix", defaultValue: "", placeholder: "%, k, days" },
    yPrefix: { type: ControlType.String, title: "Y Prefix", defaultValue: "", placeholder: "$, €, ₩" },
    ySuffix: { type: ControlType.String, title: "Y Suffix", defaultValue: "%", placeholder: "%, k, pts" },
    sizePrefix: { type: ControlType.String, title: "Size Prefix", defaultValue: "", placeholder: "$" },
    sizeSuffix: { type: ControlType.String, title: "Size Suffix", defaultValue: "", placeholder: " users" },
    decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 0, min: 0, max: 4, step: 1, displayStepper: true, description: "Used in tooltips. Axis ticks pick their own decimals." },
    thousands: { type: ControlType.Boolean, title: "Thousands", defaultValue: true, enabledTitle: "1,000", disabledTitle: "1000" },
    compact: { type: ControlType.Boolean, title: "Compact k/M", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    showLegend: { type: ControlType.Boolean, title: "Legend", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Click a legend item to hide or show that group." },
    legendPosition: {
        type: ControlType.Enum,
        title: "Legend Pos.",
        options: ["bottom", "top"],
        optionTitles: ["Bottom", "Top"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
        hidden: (p: BubbleChartProps) => !p.showLegend,
    },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    appearance: {
        type: ControlType.Enum,
        title: "Appearance",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    customColors: { type: ControlType.Boolean, title: "Colors", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Preset" },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        icon: "color",
        hidden: (p: BubbleChartProps) => !p.customColors,
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            muted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#6B6B76" },
            grid: { type: ControlType.Color, title: "Gridlines", defaultValue: "rgba(17, 17, 20, 0.09)" },
            tooltipBg: { type: ControlType.Color, title: "Tooltip BG", defaultValue: "#111114" },
            tooltipText: { type: ControlType.Color, title: "Tooltip Text", defaultValue: "#FFFFFF" },
            group1: { type: ControlType.Color, title: "Group 1", defaultValue: "#2DE5A0" },
            group2: { type: ControlType.Color, title: "Group 2", defaultValue: "#6C7BFF" },
            group3: { type: ControlType.Color, title: "Group 3", defaultValue: "#FF6B6B" },
            group4: { type: ControlType.Color, title: "Group 4", defaultValue: "#FFB547" },
            group5: { type: ControlType.Color, title: "Group 5", defaultValue: "#B06CFF" },
            group6: { type: ControlType.Color, title: "Group 6", defaultValue: "#2BB6D9" },
        },
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate In",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Bubbles pop in one after another when the chart scrolls into view.",
    },
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 45, min: 0, max: 200, step: 5, unit: "ms", hidden: (p: BubbleChartProps) => !p.animate },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 0, min: 0, max: 48, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 8, min: 0, max: 64, step: 1, unit: "px" },
    font: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Semibold", lineHeight: "1.3em" },
    },
    axisFont: {
        type: ControlType.Font,
        title: "Axis Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Medium", lineHeight: "1.3em" },
        description: "Created by BrandingUp",
    },
})
