// [생성일] 2026-10-09
// [경위] 사장님 지시 다이어그램 10종 동시 제작 — 15번 상품: 워터폴(폭포) 차트. 시작값→증감→합계를 떠 있는 막대로 보여줌
// [변경이력]
//   - 2026-10-09: 최초 생성 (항목 배열 + 소계/합계 자동 계산 + 숫자 형식 + 연결선 + Y축 눈금 + 툴팁 + 순차 등장 + 가로/세로 + 좁은 화면 라벨 각도 자동)

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
type Kind = "start" | "increase" | "decrease" | "subtotal" | "total"

interface Item {
    label?: string
    value?: number
    kind?: Kind
}

// 계산이 끝난 막대 한 개 (from/to 는 숫자 축 위의 값)
interface Bar {
    label: string
    kind: Kind
    delta: number // 화면에 표시할 값 (증가 +, 감소 -, 시작/합계는 그대로)
    from: number // 막대가 시작하는 누적값
    to: number // 막대가 끝나는 누적값
    running: number // 이 항목까지 반영한 누적 합계
    lo: number
    hi: number
}

interface FormatOptions {
    prefix: string
    suffix: string
    decimals: number
    thousands: boolean
    compact: boolean
    sign: boolean
}

// 설치 직후 보이는 샘플: 월 매출 → 비용 항목 4개 → 순이익
const SAMPLE: Item[] = [
    { label: "Revenue", value: 48000, kind: "start" },
    { label: "Upsells", value: 3000, kind: "increase" },
    { label: "Payroll", value: 18500, kind: "decrease" },
    { label: "Marketing", value: 6200, kind: "decrease" },
    { label: "Software", value: 3400, kind: "decrease" },
    { label: "Taxes", value: 4900, kind: "decrease" },
    { label: "Net profit", value: 0, kind: "total" },
]

// ─────────────────────────────────────────────
// 유틸 함수
// ─────────────────────────────────────────────

// 항목 배열 → 막대 목록. 소계/합계는 값을 직접 입력하지 않아도 누적값으로 자동 계산
function buildBars(items: Item[]): Bar[] {
    const bars: Bar[] = []
    let running = 0
    items.forEach((it, i) => {
        const kind: Kind = (it.kind as Kind) || "increase"
        const raw = Number(it.value)
        const v = isFinite(raw) ? raw : 0
        let from = running
        let to = running
        let delta = 0
        if (kind === "start") {
            from = 0
            to = v
            delta = v
            running = v
        } else if (kind === "increase") {
            delta = Math.abs(v)
            to = running + delta
            running = to
        } else if (kind === "decrease") {
            delta = -Math.abs(v)
            to = running + delta
            running = to
        } else {
            // subtotal / total: 지금까지의 누적값을 0 기준선에서 막대로 보여줌
            from = 0
            to = running
            delta = running
        }
        bars.push({
            label: it.label || "Item " + (i + 1),
            kind,
            delta,
            from,
            to,
            running,
            lo: Math.min(from, to),
            hi: Math.max(from, to),
        })
    })
    return bars
}

// 숫자 형식: 통화 기호 · 천 단위 구분 · 소수 자리 · 단위 접미사(k/M 자동)
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
    if (unit) {
        // 줄임 표기는 불필요한 0을 뗀다 (18.50k → 18.5k)
        s = String(parseFloat(n.toFixed(Math.max(o.decimals, 1))))
    } else {
        s = n.toFixed(Math.max(0, Math.min(6, Math.round(o.decimals))))
        if (o.thousands) {
            const parts = s.split(".")
            s = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "")
        }
    }
    const isZero = parseFloat(s) === 0
    const sign = isZero ? "" : v < 0 ? "−" : o.sign ? "+" : ""
    return sign + o.prefix + s + unit + o.suffix
}

// "보기 좋은 숫자" 눈금 계산 (nice number 알고리즘)
function niceNum(range: number, round: boolean): number {
    if (range <= 0) return 1
    const exp = Math.floor(Math.log10(range))
    const f = range / Math.pow(10, exp)
    let nf: number
    if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10
    else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
    return nf * Math.pow(10, exp)
}

function niceScale(min: number, max: number, count: number) {
    if (max === min) max = min + 1
    const range = niceNum(max - min, false)
    const step = niceNum(range / Math.max(1, count - 1), true)
    const niceMin = Math.floor(min / step) * step
    const niceMax = Math.ceil(max / step) * step
    const dec = Math.max(0, -Math.floor(Math.log10(step)))
    const ticks: number[] = []
    for (let t = niceMin; t <= niceMax + step / 2; t += step) {
        ticks.push(parseFloat(t.toFixed(dec + 2)))
    }
    return { min: niceMin, max: niceMax, step, ticks, dec }
}

// 프레이머는 색을 rgb()/rgba() 로 넘기므로 둘 다 + HEX 모두 처리
function parseColor(c: string): [number, number, number] | null {
    if (typeof c !== "string") return null
    const m = c.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
    if (m) return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]
    if (c.charAt(0) === "#") {
        let h = c.slice(1)
        if (h.length === 3 || h.length === 4) h = h.split("").map((x) => x + x).join("")
        if (h.length >= 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
    }
    return null
}

// 막대 안에 글자를 넣을 때, 막대 색에 맞춰 읽기 좋은 글자색 선택
function readableOn(bg: string, fallback: string): string {
    const rgb = parseColor(bg)
    if (!rgb) return fallback
    const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
    return lum > 0.6 ? "#111114" : "#FFFFFF"
}

// 글자 폭 대략 계산 (한글 등 전각 문자는 더 넓게)
function textWidth(s: string, fs: number): number {
    let w = 0
    for (let i = 0; i < s.length; i++) w += s.charCodeAt(i) > 0x2e80 ? fs : fs * 0.58
    return w
}

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, Math.max(1, max - 1)) + "…" : s
}

function fontSizeOf(ctl: any, fallback: number): number {
    const n = parseFloat(String(ctl && ctl.fontSize))
    return isFinite(n) && n > 0 ? n : fallback
}

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface WaterfallProps {
    items?: Item[]
    orientation?: "vertical" | "horizontal"
    showLabels?: boolean
    labelPosition?: "outside" | "inside"
    showSign?: boolean
    prefix?: string
    suffix?: string
    thousands?: boolean
    decimals?: number
    compact?: boolean
    increaseColor?: string
    decreaseColor?: string
    totalColor?: string
    startColor?: string
    showConnectors?: boolean
    connectorColor?: string
    showAxis?: boolean
    showGrid?: boolean
    gridColor?: string
    zeroLineColor?: string
    textColor?: string
    mutedColor?: string
    background?: string
    barWidth?: number
    radius?: number
    padding?: number
    showTooltip?: boolean
    tooltipColor?: string
    tooltipText?: string
    animate?: boolean
    stagger?: number
    font?: any
    valueFont?: any
    style?: CSSProperties
}

/**
 * Waterfall Chart — 시작값에서 증감을 거쳐 합계까지 떠 있는 막대로 보여주는 차트.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function WaterfallChart(props: WaterfallProps) {
    const {
        items = SAMPLE,
        orientation = "vertical",
        showLabels = true,
        labelPosition = "outside",
        showSign = true,
        prefix = "$",
        suffix = "",
        thousands = true,
        decimals = 0,
        compact = false,
        increaseColor = "#2DE5A0",
        decreaseColor = "#FF6B6B",
        totalColor = "#111114",
        startColor = "#6C7BFF",
        showConnectors = true,
        connectorColor = "rgba(17, 17, 20, 0.35)",
        showAxis = true,
        showGrid = true,
        gridColor = "rgba(17, 17, 20, 0.08)",
        zeroLineColor = "rgba(17, 17, 20, 0.5)",
        textColor = "#111114",
        mutedColor = "#6B6B76",
        background = "rgba(255, 255, 255, 0)",
        barWidth = 62,
        radius = 6,
        padding = 12,
        showTooltip = true,
        tooltipColor = "#111114",
        tooltipText = "#FFFFFF",
        animate = true,
        stagger = 90,
        font,
        valueFont,
        style,
    } = props

    const horizontal = orientation === "horizontal"
    const wrapRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 640, h: 400 })
    const [active, setActive] = useState<number>(-1)

    // ── 컨테이너 크기 측정 (리사이즈 대응) ──
    useEffect(() => {
        const el = wrapRef.current
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
        const reduced = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const el = wrapRef.current
        if (!canAnimate || reduced || !el || typeof IntersectionObserver === "undefined") {
            startTransition(() => setPhase("done"))
            return
        }
        startTransition(() => setPhase("hidden"))
        let timer = 0
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0] && entries[0].isIntersecting) {
                    io.disconnect()
                    timer = window.setTimeout(() => startTransition(() => setPhase("playing")), 60)
                }
            },
            { threshold: 0.2 }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            window.clearTimeout(timer)
        }
    }, [canAnimate])

    // ── 데이터 계산 ──
    const bars = useMemo(() => buildBars(Array.isArray(items) ? items : []), [items])
    const fmt: FormatOptions = { prefix, suffix, decimals, thousands, compact, sign: false }
    const fmtSigned: FormatOptions = { ...fmt, sign: showSign }
    // +/− 부호는 증가·감소 항목에만 붙이고, 시작·소계·합계는 그대로 표시
    const deltaText = (b: Bar) => formatValue(b.delta, b.kind === "increase" || b.kind === "decrease" ? fmtSigned : fmt)

    const fs = fontSizeOf(font, 12)
    const vfs = fontSizeOf(valueFont, 12)

    // 값 범위 (0 은 항상 포함)
    let dMin = 0
    let dMax = 0
    bars.forEach((b) => {
        dMin = Math.min(dMin, b.lo)
        dMax = Math.max(dMax, b.hi)
    })
    const W = size.w
    const H = size.h
    const scale = niceScale(dMin, dMax, horizontal ? clamp(Math.round(W / 110), 3, 7) : clamp(Math.round(H / 70), 3, 7))
    const axisFmt: FormatOptions = { ...fmt, decimals: scale.dec, sign: false }
    const tickText = (t: number) => formatValue(t, axisFmt)

    // 라벨 폭 추정 → 여백 계산
    const n = bars.length
    const maxTickW = Math.max(...scale.ticks.map((t) => textWidth(tickText(t), fs)), 0)
    const maxValW = Math.max(...bars.map((b) => textWidth(deltaText(b), vfs)), 0)
    const outside = showLabels && labelPosition === "outside"

    let left: number, right: number, top: number, bottom: number
    let angle = 0
    let catLabels: string[] = bars.map((b) => b.label)
    let catColW = 0
    if (!horizontal) {
        left = padding + (showAxis ? maxTickW + 8 : 0)
        right = padding
        top = padding + (outside ? vfs + 8 : 0)
        const bandW = (W - left - right) / Math.max(1, n)
        const maxLabW = Math.max(...catLabels.map((l) => textWidth(l, fs)), 0)
        // 좁은 화면: 라벨이 밴드보다 길면 자동으로 기울이거나(-35°) 세운다(-90°)
        if (maxLabW > bandW * 0.92) {
            angle = bandW >= fs * 1.5 ? -35 : -90
            catLabels = catLabels.map((l) => truncate(l, 16))
        }
        const rotW = Math.max(...catLabels.map((l) => textWidth(l, fs)), 0)
        const labH = angle === 0 ? fs + 8 : angle === -35 ? rotW * 0.58 + fs + 6 : rotW + 8
        bottom = padding + labH
    } else {
        catColW = Math.min(Math.max(...catLabels.map((l) => textWidth(l, fs)), 0) + 10, W * 0.34)
        left = padding + catColW
        right = padding + (outside ? maxValW + 10 : 0)
        top = padding
        bottom = padding + (showAxis ? fs + 10 : 0)
    }
    const plotW = Math.max(20, W - left - right)
    const plotH = Math.max(20, H - top - bottom)

    // 값 → 좌표
    const pos = (v: number) =>
        horizontal
            ? left + ((v - scale.min) / (scale.max - scale.min)) * plotW
            : top + ((scale.max - v) / (scale.max - scale.min)) * plotH
    const band = (horizontal ? plotH : plotW) / Math.max(1, n)
    const thick = band * (clamp(barWidth, 10, 100) / 100)

    const colorOf = (k: Kind) =>
        k === "start" ? startColor : k === "increase" ? increaseColor : k === "decrease" ? decreaseColor : totalColor

    // 막대 사각형 좌표 계산
    const rects = bars.map((b, i) => {
        const a = pos(b.lo)
        const c = pos(b.hi)
        const len = Math.max(Math.abs(a - c), 2)
        if (horizontal) {
            const x = Math.min(a, c)
            return { x, y: top + i * band + (band - thick) / 2, w: len, h: thick }
        }
        const y = Math.min(a, c)
        return { x: left + i * band + (band - thick) / 2, y, w: thick, h: len }
    })

    const durMs = 520
    const hidden = phase === "hidden"
    const playing = phase === "playing"
    const delayOf = (i: number) => i * Math.max(0, stagger)

    // 등장 애니메이션용 스타일: 막대가 시작하는 쪽 모서리에서 자라남
    const growStyle = (b: Bar, i: number): CSSProperties => {
        if (phase === "done") return {}
        const upward = b.to >= b.from
        const origin = horizontal ? (upward ? "0% 50%" : "100% 50%") : upward ? "50% 100%" : "50% 0%"
        return {
            transformBox: "fill-box",
            transformOrigin: origin,
            transform: hidden ? (horizontal ? "scaleX(0)" : "scaleY(0)") : "scale(1)",
            transition: playing ? `transform ${durMs}ms cubic-bezier(0.22, 1, 0.36, 1) ${delayOf(i)}ms` : "none",
        }
    }
    const fadeStyle = (i: number): CSSProperties => {
        if (phase === "done") return {}
        return {
            opacity: hidden ? 0 : 1,
            transition: playing ? `opacity 300ms ease ${delayOf(i) + durMs * 0.6}ms` : "none",
        }
    }

    // 툴팁 위치 (막대 기준)
    const tipBar = active >= 0 && active < n ? bars[active] : null
    const tipRect = tipBar ? rects[active] : null
    let tipLeft = 0
    let tipTop = 0
    let tipBelow = false
    if (tipRect) {
        tipLeft = clamp(tipRect.x + tipRect.w / 2, 70, Math.max(70, W - 70))
        tipBelow = tipRect.y < 70
        tipTop = tipBelow ? tipRect.y + tipRect.h + 8 : tipRect.y - 8
    }

    const show = (i: number) => startTransition(() => setActive(i))
    const hide = () => startTransition(() => setActive(-1))

    const fontCss: CSSProperties = { ...(font || {}) }
    const valueCss: CSSProperties = { ...(valueFont || {}) }

    // 항목이 없을 때 안내 (0×0 방지 + 빈 화면 방지)
    if (n === 0) {
        return (
            <div
                ref={wrapRef}
                style={{ ...style, width: "100%", height: "100%", background, display: "flex", alignItems: "center", justifyContent: "center", color: mutedColor, ...fontCss }}
            >
                Add items to build your waterfall
            </div>
        )
    }

    return (
        <div
            ref={wrapRef}
            style={{ ...style, position: "relative", width: "100%", height: "100%", background, overflow: "hidden", minWidth: 80, minHeight: 80 }}
        >
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Waterfall chart" style={{ display: "block", overflow: "visible" }}>
                {/* 눈금선 + 축 숫자 */}
                {scale.ticks.map((t, i) => {
                    const p = pos(t)
                    const isZero = t === 0
                    if (horizontal) {
                        return (
                            <g key={"t" + i}>
                                {(showGrid || isZero) && (
                                    <line x1={p} x2={p} y1={top} y2={top + plotH} stroke={isZero ? zeroLineColor : gridColor} strokeWidth={isZero ? 1.5 : 1} />
                                )}
                                {showAxis && (
                                    <text x={p} y={top + plotH + fs + 6} textAnchor="middle" fill={mutedColor} style={{ ...fontCss, fontSize: fs }}>
                                        {tickText(t)}
                                    </text>
                                )}
                            </g>
                        )
                    }
                    return (
                        <g key={"t" + i}>
                            {(showGrid || isZero) && (
                                <line x1={left} x2={left + plotW} y1={p} y2={p} stroke={isZero ? zeroLineColor : gridColor} strokeWidth={isZero ? 1.5 : 1} />
                            )}
                            {showAxis && (
                                <text x={left - 8} y={p} textAnchor="end" dominantBaseline="central" fill={mutedColor} style={{ ...fontCss, fontSize: fs }}>
                                    {tickText(t)}
                                </text>
                            )}
                        </g>
                    )
                })}

                {/* 막대 사이 연결선 (점선) */}
                {showConnectors &&
                    bars.slice(0, -1).map((b, i) => {
                        const r1 = rects[i]
                        const r2 = rects[i + 1]
                        const p = pos(b.running)
                        return horizontal ? (
                            <line key={"c" + i} x1={p} x2={p} y1={r1.y + r1.h} y2={r2.y} stroke={connectorColor} strokeWidth={1} strokeDasharray="3 3" style={fadeStyle(i)} />
                        ) : (
                            <line key={"c" + i} x1={r1.x + r1.w} x2={r2.x} y1={p} y2={p} stroke={connectorColor} strokeWidth={1} strokeDasharray="3 3" style={fadeStyle(i)} />
                        )
                    })}

                {/* 막대 + 값 라벨 + 카테고리 라벨 */}
                {bars.map((b, i) => {
                    const r = rects[i]
                    const col = colorOf(b.kind)
                    const rad = Math.max(0, Math.min(radius, r.w / 2, r.h / 2))
                    const valueText = deltaText(b)
                    const label = `${b.label}: ${valueText}, running total ${formatValue(b.running, fmt)}`
                    const dim = active >= 0 && active !== i

                    // 값 라벨 위치: 막대 안(들어갈 때만) 또는 바깥
                    const room = horizontal ? r.w : r.h
                    const needed = horizontal ? textWidth(valueText, vfs) + 10 : vfs + 6
                    const inside = labelPosition === "inside" && room >= needed
                    const negativeSide = b.hi <= 0 // 전부 0 아래에 있는 막대는 아래/왼쪽에 라벨
                    let lx = 0
                    let ly = 0
                    let anchor: "start" | "middle" | "end" = "middle"
                    let fill = textColor
                    if (inside) {
                        lx = r.x + r.w / 2
                        ly = r.y + r.h / 2
                        fill = readableOn(col, textColor)
                    } else if (horizontal) {
                        ly = r.y + r.h / 2
                        lx = negativeSide ? r.x - 6 : r.x + r.w + 6
                        anchor = negativeSide ? "end" : "start"
                    } else {
                        lx = r.x + r.w / 2
                        ly = negativeSide ? r.y + r.h + vfs + 2 : r.y - 6
                    }

                    const cat = catLabels[i]
                    const catY = top + plotH + (angle === -90 ? 10 : fs + 6)
                    return (
                        <g key={"b" + i}>
                            {/* 접근성: 막대마다 항목·값을 읽어 줌 */}
                            <g
                                role="img"
                                aria-label={label}
                                tabIndex={0}
                                style={{ outline: "none", cursor: showTooltip ? "pointer" : "default", opacity: dim ? 0.45 : 1, transition: "opacity 150ms ease" }}
                                onMouseEnter={() => show(i)}
                                onMouseLeave={hide}
                                onFocus={() => show(i)}
                                onBlur={hide}
                                onClick={() => show(active === i ? -1 : i)}
                            >
                                {/* 호버가 쉽도록 밴드 전체를 투명하게 덮는 영역 */}
                                {horizontal ? (
                                    <rect x={left} y={top + i * band} width={plotW} height={band} fill="transparent" />
                                ) : (
                                    <rect x={left + i * band} y={top} width={band} height={plotH} fill="transparent" />
                                )}
                                <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={rad} ry={rad} fill={col} style={growStyle(b, i)} />
                                {showLabels && (
                                    <text
                                        x={lx}
                                        y={ly}
                                        textAnchor={anchor}
                                        dominantBaseline={inside || horizontal ? "central" : "auto"}
                                        fill={fill}
                                        style={{ ...valueCss, fontSize: vfs, pointerEvents: "none", ...fadeStyle(i) }}
                                    >
                                        {valueText}
                                    </text>
                                )}
                            </g>
                            {horizontal ? (
                                <text x={left - 8} y={r.y + r.h / 2} textAnchor="end" dominantBaseline="central" fill={textColor} style={{ ...fontCss, fontSize: fs }}>
                                    {truncate(cat, Math.max(4, Math.floor(catColW / (fs * 0.58))))}
                                </text>
                            ) : (
                                <text
                                    x={r.x + r.w / 2}
                                    y={catY}
                                    textAnchor={angle === 0 ? "middle" : "end"}
                                    dominantBaseline={angle === -90 ? "central" : "auto"}
                                    transform={angle === 0 ? undefined : `rotate(${angle} ${r.x + r.w / 2} ${catY})`}
                                    fill={textColor}
                                    style={{ ...fontCss, fontSize: fs }}
                                >
                                    {cat}
                                </text>
                            )}
                        </g>
                    )
                })}
            </svg>

            {/* 호버 툴팁: 항목 · 값 · 누적 */}
            {showTooltip && tipBar && tipRect && (
                <div
                    style={{
                        position: "absolute",
                        left: tipLeft,
                        top: tipTop,
                        transform: tipBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
                        background: tooltipColor,
                        color: tooltipText,
                        padding: "8px 10px",
                        borderRadius: 8,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        zIndex: 2,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                        ...fontCss,
                        fontSize: fs,
                        lineHeight: 1.35,
                    }}
                >
                    <div style={{ opacity: 0.75 }}>{tipBar.label}</div>
                    <div style={{ fontWeight: 700 }}>{deltaText(tipBar)}</div>
                    <div style={{ opacity: 0.75 }}>Running total: {formatValue(tipBar.running, fmt)}</div>
                </div>
            )}
        </div>
    )
}

WaterfallChart.displayName = "Waterfall Chart"

// ─────────────────────────────────────────────
// 속성 컨트롤 (중요도순)
// ─────────────────────────────────────────────
addPropertyControls(WaterfallChart, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Item" },
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["start", "increase", "decrease", "subtotal", "total"],
                    optionTitles: ["Start", "Increase", "Decrease", "Subtotal", "Total"],
                    defaultValue: "increase",
                },
                value: {
                    type: ControlType.Number,
                    title: "Value",
                    defaultValue: 1000,
                    step: 1,
                    displayStepper: true,
                    hidden: (p: any) => p.kind === "subtotal" || p.kind === "total",
                    description: "Subtotal and Total are calculated automatically.",
                },
            },
        },
        defaultValue: SAMPLE as any,
    },
    orientation: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
    },
    showLabels: { type: ControlType.Boolean, title: "Value Labels", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    labelPosition: {
        type: ControlType.Enum,
        title: "Label Position",
        options: ["outside", "inside"],
        optionTitles: ["Outside", "Inside"],
        defaultValue: "outside",
        displaySegmentedControl: true,
        hidden: (p: any) => !p.showLabels,
    },
    showSign: { type: ControlType.Boolean, title: "Show +/−", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", hidden: (p: any) => !p.showLabels },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "$", placeholder: "$, €, ₩" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: "", placeholder: "%, pts" },
    thousands: { type: ControlType.Boolean, title: "Thousands", defaultValue: true, enabledTitle: "1,000", disabledTitle: "1000" },
    decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 0, min: 0, max: 4, step: 1, displayStepper: true },
    compact: {
        type: ControlType.Boolean,
        title: "Compact k/M",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Shows 18,500 as 18.5k and 2,400,000 as 2.4M.",
    },
    increaseColor: { type: ControlType.Color, title: "Increase", defaultValue: "#2DE5A0" },
    decreaseColor: { type: ControlType.Color, title: "Decrease", defaultValue: "#FF6B6B" },
    totalColor: { type: ControlType.Color, title: "Total", defaultValue: "#111114" },
    startColor: { type: ControlType.Color, title: "Start", defaultValue: "#6C7BFF" },
    showConnectors: { type: ControlType.Boolean, title: "Connectors", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    connectorColor: { type: ControlType.Color, title: "Connector", defaultValue: "rgba(17, 17, 20, 0.35)", hidden: (p: any) => !p.showConnectors },
    showAxis: { type: ControlType.Boolean, title: "Axis", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showGrid: { type: ControlType.Boolean, title: "Grid Lines", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    gridColor: { type: ControlType.Color, title: "Grid", defaultValue: "rgba(17, 17, 20, 0.08)", hidden: (p: any) => !p.showGrid },
    zeroLineColor: { type: ControlType.Color, title: "Zero Line", defaultValue: "rgba(17, 17, 20, 0.5)" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
    mutedColor: { type: ControlType.Color, title: "Axis Text", defaultValue: "#6B6B76" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(255, 255, 255, 0)" },
    barWidth: { type: ControlType.Number, title: "Bar Width", defaultValue: 62, min: 10, max: 100, step: 1, unit: "%" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 6, min: 0, max: 40, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 12, min: 0, max: 80, step: 1, unit: "px" },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    tooltipColor: { type: ControlType.Color, title: "Tooltip BG", defaultValue: "#111114", hidden: (p: any) => !p.showTooltip },
    tooltipText: { type: ControlType.Color, title: "Tooltip Text", defaultValue: "#FFFFFF", hidden: (p: any) => !p.showTooltip },
    animate: {
        type: ControlType.Boolean,
        title: "Animate In",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Bars grow one after another when the chart scrolls into view.",
    },
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 90, min: 0, max: 500, step: 10, unit: "ms", hidden: (p: any) => !p.animate },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Medium", lineHeight: "1.3em" },
    },
    valueFont: {
        type: ControlType.Font,
        title: "Value Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Semibold", lineHeight: "1.3em" },
        description: "Created by BrandingUp",
    },
})
