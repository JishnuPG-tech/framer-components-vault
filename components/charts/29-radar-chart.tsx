// [생성일] 2026-10-18
// [경위] 달러벌기 29번 상품: 레이더(스파이더) 차트 — 플랜·제품 비교, 역량 프로필, 설문 결과. 축별 눈금·단위, 시리즈 1·2 차이 음영, 범례 토글, 곡선 다각형, 1회 드로우(화면 진입 시) + 값 변경 모핑
// [변경이력]
//   - 2026-10-18: 최초 생성 (축 최대 12개 · 시리즈 최대 5개 · Scale 3모드 · Compare Overlay/Gap · Straight/Smooth · 격자 Polygon/Circle · 축 부채꼴 호버 툴팁 · 범례 클릭 토글/호버 강조 · 정점 값 · 정적 렌더·캔버스·화면 밖·모션 줄이기에서 정지)
//   - 2026-10-31: 프레이머 자동 심사 권고 반영 — outline:none 제거 후 키보드 초점(:focus-visible) 테두리 추가, any 타입을 실제 타입으로 교체

import { useEffect, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties } from "react"
import type { PropertyControls } from "framer" // 2026-10-31: seriesControl 반환 타입용
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
// 타입 · 상수
// ─────────────────────────────────────────────
interface Axis {
    label?: string
    max?: number
    unit?: string
}

type SeriesStyle = "fill" | "line" | "dashed"

interface SeriesCfg {
    name?: string
    values?: string
    color?: string
    style?: SeriesStyle
}

interface Pt {
    x: number
    y: number
}

const MAX_AXES = 12
const MAX_SERIES = 5
const CURRENCY = ["$", "€", "£", "₩", "¥"]

// 설치 직후 보이는 샘플: 단위가 다른 지표 6개를 한 다각형에 (플랜 비교)
const SAMPLE_AXES: Axis[] = [
    { label: "Performance", max: 100, unit: " / 100" },
    { label: "Design", max: 5, unit: "★" },
    { label: "Ease of Use", max: 5, unit: "★" },
    { label: "Integrations", max: 60, unit: " apps" },
    { label: "Support", max: 100, unit: "%" },
    { label: "Value", max: 10, unit: " / 10" },
]

const SAMPLE_SERIES: Required<SeriesCfg>[] = [
    { name: "Our Plan", values: "92, 4.7, 4.5, 48, 96, 8.5", color: "#2DE5A0", style: "fill" },
    { name: "Competitor", values: "78, 4.1, 3.9, 55, 74, 6", color: "#6C7BFF", style: "fill" },
    { name: "Legacy Tool", values: "60, 3.2, 4.4, 30, 82, 7.5", color: "#FF6B6B", style: "dashed" },
    { name: "Series 4", values: "50, 3, 3, 30, 60, 5", color: "#FFB547", style: "line" },
    { name: "Series 5", values: "40, 2.5, 2.5, 20, 50, 4", color: "#B06CFF", style: "line" },
]

// ─────────────────────────────────────────────
// 유틸 함수
// ─────────────────────────────────────────────

// 프레이머는 색을 rgb()/rgba() 로 넘기므로 rgb · rgba · HEX(3/4/6/8) 전부 처리
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

// 색에 투명도(0~1)를 곱해 rgba 문자열로
function withAlpha(c: string, a: number): string {
    const rgb = parseColor(c)
    if (!rgb) return c
    const k = Math.max(0, Math.min(1, a)) * rgb[3]
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${k})`
}

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
}

function fontSizeOf(ctl: CSSProperties | undefined, fallback: number): number {
    const n = parseFloat(String(ctl && ctl.fontSize))
    return isFinite(n) && n > 0 ? n : fallback
}

// "92, 4.7, 4.5" 같은 문자열 → 숫자 배열 (쉼표·세미콜론·줄바꿈, 없으면 공백 구분). 숫자가 아니면 0
function parseValues(s: string | undefined, n: number): number[] {
    const out: number[] = []
    const str = typeof s === "string" ? s : ""
    const parts = /[,;\n]/.test(str) ? str.split(/[,;\n]+/) : str.trim().split(/\s+/)
    for (let i = 0; i < n; i++) {
        const v = parseFloat(String(parts[i] || "").replace(/[^\d.\-]/g, ""))
        out.push(isFinite(v) ? v : 0)
    }
    return out
}

// 자동 눈금: 가장 큰 값을 1·2·2.5·5·10 단위로 올림
function niceCeil(v: number): number {
    if (!(v > 0)) return 1
    const m = Math.pow(10, Math.floor(Math.log10(v)))
    const f = v / m
    const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
    return nice * m
}

// 값 표시: 정수는 그대로, 소수는 최대 2자리, 1,000 단위 구분. 단위가 통화 기호면 앞에, 아니면 뒤에
function formatValue(v: number, unit: string): string {
    const abs = Math.abs(v)
    let s = Number.isInteger(abs) ? String(abs) : String(parseFloat(abs.toFixed(2)))
    if (abs >= 1000) {
        const parts = s.split(".")
        s = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "")
    }
    const u = typeof unit === "string" ? unit : ""
    const sign = v < 0 ? "−" : ""
    if (CURRENCY.indexOf(u.trim()) >= 0) return sign + u.trim() + s
    return sign + s + u
}

function easeOutCubic(t: number) {
    const k = clamp(t, 0, 1)
    return 1 - Math.pow(1 - k, 3)
}

// 축 i 의 각도 (12시 방향부터 시계 방향)
function angleOf(i: number, n: number) {
    return -Math.PI / 2 + (i * 2 * Math.PI) / n
}

function polar(cx: number, cy: number, r: number, a: number): Pt {
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function fmt(n: number) {
    return Math.round(n * 100) / 100
}

// 닫힌 다각형 → path. smooth 면 Catmull-Rom 곡선(각 꼭짓점을 통과)으로 부드럽게
function closedPath(pts: Pt[], smooth: boolean): string {
    const n = pts.length
    if (n === 0) return ""
    if (!smooth || n < 3) return "M" + pts.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join("L") + "Z"
    let d = `M${fmt(pts[0].x)} ${fmt(pts[0].y)}`
    for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n]
        const p1 = pts[i]
        const p2 = pts[(i + 1) % n]
        const p3 = pts[(i + 2) % n]
        const c1x = p1.x + (p2.x - p0.x) / 6
        const c1y = p1.y + (p2.y - p0.y) / 6
        const c2x = p2.x - (p3.x - p1.x) / 6
        const c2y = p2.y - (p3.y - p1.y) / 6
        d += ` C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2.x)} ${fmt(p2.y)}`
    }
    return d + "Z"
}

// 다각형 외곽선을 k 등분 점으로 샘플링 (차이 음영 계산용 — 곡선도 같은 개수로 맞춤)
function sampleOutline(pts: Pt[], smooth: boolean, k: number): Pt[] {
    const n = pts.length
    const out: Pt[] = []
    if (n === 0) return out
    const curved = smooth && n >= 3
    for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n]
        const p1 = pts[i]
        const p2 = pts[(i + 1) % n]
        const p3 = pts[(i + 2) % n]
        const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
        const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
        for (let s = 0; s < k; s++) {
            const t = s / k
            if (!curved) {
                out.push({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t })
            } else {
                const mt = 1 - t
                const a = mt * mt * mt
                const b = 3 * mt * mt * t
                const c = 3 * mt * t * t
                const d = t * t * t
                out.push({ x: a * p1.x + b * c1.x + c * c2.x + d * p2.x, y: a * p1.y + b * c1.y + c * c2.y + d * p2.y })
            }
        }
    }
    return out
}

// 선분 교차점 (없으면 null)
function intersect(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
    const r = { x: b.x - a.x, y: b.y - a.y }
    const s = { x: d.x - c.x, y: d.y - c.y }
    const den = r.x * s.y - r.y * s.x
    if (Math.abs(den) < 1e-9) return null
    const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den
    const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den
    if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null
    return { x: a.x + r.x * t, y: a.y + r.y * t }
}

// 시리즈 A·B 사이 영역을 "앞선 쪽" 별로 나눠 path 두 개로 (A 가 바깥인 구간 / B 가 바깥인 구간)
function gapPaths(A: Pt[], B: Pt[], c: Pt): { a: string; b: string } {
    const m = Math.min(A.length, B.length)
    let pa = ""
    let pb = ""
    const dist = (p: Pt) => Math.hypot(p.x - c.x, p.y - c.y)
    const poly = (pts: Pt[]) => "M" + pts.map((p) => `${fmt(p.x)} ${fmt(p.y)}`).join("L") + "Z"
    for (let j = 0; j < m; j++) {
        const a0 = A[j]
        const a1 = A[(j + 1) % m]
        const b0 = B[j]
        const b1 = B[(j + 1) % m]
        const d0 = dist(a0) - dist(b0)
        const d1 = dist(a1) - dist(b1)
        if (Math.abs(d0) < 0.01 && Math.abs(d1) < 0.01) continue
        const x = intersect(a0, a1, b0, b1)
        if (!x) {
            const ahead = d0 + d1 >= 0
            const s = poly([a0, a1, b1, b0])
            if (ahead) pa += s
            else pb += s
        } else {
            const s1 = poly([a0, x, b0])
            const s2 = poly([x, a1, b1])
            if (d0 >= 0) pa += s1
            else pb += s1
            if (d1 >= 0) pa += s2
            else pb += s2
        }
    }
    return { a: pa, b: pb }
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface RadarProps {
    axes?: Axis[]
    seriesCount?: number
    series1?: SeriesCfg
    series2?: SeriesCfg
    series3?: SeriesCfg
    series4?: SeriesCfg
    series5?: SeriesCfg
    scaleMode?: "fixed" | "axis" | "auto"
    maxValue?: number
    compare?: "overlay" | "gap"
    gapOpacity?: number
    curve?: "straight" | "smooth"
    gridShape?: "polygon" | "circle"
    rings?: number
    showScale?: boolean
    pointValues?: "off" | "hover" | "always"
    pointSize?: number
    lineWidth?: number
    fillOpacity?: number
    showLegend?: boolean
    legendPosition?: "bottom" | "top" | "right"
    legendToggle?: boolean
    showTooltip?: boolean
    dimOthers?: boolean
    gridColor?: string
    axisColor?: string
    labelColor?: string
    mutedColor?: string
    background?: string
    tooltipColor?: string
    tooltipText?: string
    padding?: number
    animate?: boolean
    duration?: number
    stagger?: number
    font?: CSSProperties
    valueFont?: CSSProperties
    style?: CSSProperties
}

/**
 * Radar Chart — 플랜·제품 비교와 역량 프로필을 위한 다중 시리즈 레이더(스파이더) 차트.
 * 축별 눈금·단위, 시리즈 1·2 차이 음영, 범례 토글, 곡선 다각형, 화면 진입 시 1회 드로우.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 560
 * @framerIntrinsicHeight 480
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function RadarChart(props: RadarProps) {
    const {
        axes = SAMPLE_AXES,
        seriesCount = 3,
        series1,
        series2,
        series3,
        series4,
        series5,
        scaleMode = "axis",
        maxValue = 100,
        compare = "overlay",
        gapOpacity = 45,
        curve = "straight",
        gridShape = "polygon",
        rings = 5,
        showScale = true,
        pointValues = "hover",
        pointSize = 4,
        lineWidth = 2,
        fillOpacity = 25,
        showLegend = true,
        legendPosition = "bottom",
        legendToggle = true,
        showTooltip = true,
        dimOthers = true,
        gridColor = "rgba(17, 17, 20, 0.12)",
        axisColor = "rgba(17, 17, 20, 0.2)",
        labelColor = "#111114",
        mutedColor = "#6B6B76",
        background = "rgba(255, 255, 255, 0)",
        tooltipColor = "#111114",
        tooltipText = "#FFFFFF",
        padding = 8,
        animate = true,
        duration = 900,
        stagger = 120,
        font,
        valueFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // ── 데이터 정리: 축(최대 12개)·시리즈(Count 만큼)·정규화 값(0~1) ──
    const axisList = useMemo(() => {
        const list = (Array.isArray(axes) ? axes : []).slice(0, MAX_AXES)
        return list.map((a, i) => ({
            label: a && typeof a.label === "string" && a.label.trim() ? a.label : `Axis ${i + 1}`,
            max: a && typeof a.max === "number" && a.max > 0 ? a.max : 0,
            unit: a && typeof a.unit === "string" ? a.unit : "",
        }))
    }, [JSON.stringify(axes)])

    const count = clamp(Math.round(Number(seriesCount) || 1), 1, MAX_SERIES)
    const rawSeries = [series1, series2, series3, series4, series5]
    const seriesSig = JSON.stringify(rawSeries.slice(0, count))

    const seriesList = useMemo(() => {
        const n = axisList.length
        return rawSeries.slice(0, count).map((s, i) => {
            const d = SAMPLE_SERIES[i]
            const cfg = s || {}
            return {
                name: typeof cfg.name === "string" && cfg.name.trim() ? cfg.name : d.name,
                color: typeof cfg.color === "string" && cfg.color ? cfg.color : d.color,
                style: (cfg.style === "fill" || cfg.style === "line" || cfg.style === "dashed" ? cfg.style : d.style) as SeriesStyle,
                raw: parseValues(typeof cfg.values === "string" ? cfg.values : d.values, n),
            }
        })
    }, [seriesSig, axisList, count])

    // 축별 최댓값 (Scale 모드에 따라) → 정규화
    const axisMax = useMemo(() => {
        const fallback = maxValue > 0 ? maxValue : 100
        return axisList.map((a, i) => {
            if (scaleMode === "fixed") return fallback
            if (scaleMode === "auto") {
                let mx = 0
                seriesList.forEach((s) => {
                    if (s.raw[i] > mx) mx = s.raw[i]
                })
                return niceCeil(mx)
            }
            return a.max > 0 ? a.max : fallback
        })
    }, [axisList, seriesList, scaleMode, maxValue])

    const target = useMemo(
        () => seriesList.map((s) => s.raw.map((v, i) => clamp(v / (axisMax[i] || 1), 0, 1))),
        [seriesList, axisMax]
    )

    // ── 상태 ──
    const rootRef = useRef<HTMLDivElement>(null)
    const areaRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ w: 560, h: 420 })
    const [shown, setShown] = useState<number[][]>(target) // 화면에 그리는 값(애니메이션 중간값)
    const shownRef = useRef<number[][]>(target)
    const [inView, setInView] = useState(false)
    const [reduced, setReduced] = useState(false)
    const [hidden, setHidden] = useState<boolean[]>([])
    const [hoverAxis, setHoverAxis] = useState(-1)
    const [hoverSeries, setHoverSeries] = useState(-1)
    const rafRef = useRef(0)
    const firstRun = useRef(false)
    const armed = useRef(false)

    // ── 영역 크기 측정 (리사이즈 대응) ──
    useEffect(() => {
        const el = areaRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const apply = () => {
            const r = el.getBoundingClientRect()
            if (r.width > 0 && r.height > 0)
                startTransition(() => setSize({ w: r.width, h: r.height }))
        }
        apply()
        const ro = new ResizeObserver(apply)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // ── 모션 줄이기 설정 읽기 ──
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const apply = () => startTransition(() => setReduced(!!mq.matches))
        apply()
        if (mq.addEventListener) mq.addEventListener("change", apply)
        return () => {
            if (mq.removeEventListener) mq.removeEventListener("change", apply)
        }
    }, [])

    // ── 화면 안/밖 감지: 보일 때만 드로우, 밖으로 나가면 정지 ──
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        if (typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                const e = entries[0]
                startTransition(() => setInView(!!(e && e.isIntersecting)))
            },
            { threshold: 0.15 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    // ── 드로우/모핑 애니메이션 (한 번 재생 후 멈춤 — 반복 없음) ──
    useEffect(() => {
        const cancel = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            rafRef.current = 0
        }
        const snap = (v: number[][]) => {
            shownRef.current = v
            startTransition(() => setShown(v))
        }
        const instant = !animate || isStatic || isCanvas || reduced
        if (instant) {
            cancel()
            if (shownRef.current !== target) snap(target)
            return cancel
        }
        const zeros = target.map((row) => row.map(() => 0))
        if (!firstRun.current && !inView) {
            // 아직 화면에 안 들어옴 → 접어 둔 상태로 대기
            cancel()
            if (!armed.current) {
                armed.current = true
                snap(zeros)
            }
            return cancel
        }
        if (!inView) {
            // 화면 밖으로 나감 → 즉시 완성 상태로 두고 루프 정지
            cancel()
            snap(target)
            return cancel
        }
        const from = firstRun.current ? shownRef.current : zeros
        firstRun.current = true
        const dur = Math.max(1, Number(duration) || 900)
        const lag = Math.max(0, Number(stagger) || 0)
        const start = performance.now()
        cancel()
        const tick = (now: number) => {
            const el = now - start
            let done = true
            const next = target.map((row, s) => {
                const p = easeOutCubic((el - s * lag) / dur)
                if (p < 1) done = false
                return row.map((v, i) => {
                    const f = from[s] && typeof from[s][i] === "number" ? from[s][i] : 0
                    return f + (v - f) * p
                })
            })
            shownRef.current = next
            startTransition(() => setShown(done ? target : next))
            if (!done) rafRef.current = requestAnimationFrame(tick)
            else rafRef.current = 0
        }
        rafRef.current = requestAnimationFrame(tick)
        return cancel
    }, [target, inView, animate, isStatic, isCanvas, reduced, duration, stagger])

    // ── 기하 계산 ──
    const n = axisList.length
    const fs = fontSizeOf(font, 13)
    const vfs = fontSizeOf(valueFont, 12)
    const fontCss: CSSProperties = { ...(font || {}) }
    const valueCss: CSSProperties = { ...(valueFont || {}) }
    const w = size.w
    const h = size.h
    const cx = w / 2
    const cy = h / 2
    const longest = axisList.reduce((m, a) => Math.max(m, a.label.length), 4)
    const labelGap = 12 + pointSize
    const labelW = Math.min(longest * fs * 0.6, w * 0.3)
    const R = Math.max(30, Math.min(w / 2 - labelW - labelGap - 4, h / 2 - fs * 1.5 - labelGap - 4))

    const disp = (s: number, i: number) => {
        const row = shown[s]
        const v = row ? row[i] : undefined
        return typeof v === "number" ? v : target[s] ? target[s][i] : 0
    }

    const isHidden = (s: number) => !!hidden[s]
    const smooth = curve === "smooth"
    const gapMode = compare === "gap" && seriesList.length >= 2

    // 시리즈별 꼭짓점·path
    const shapes = seriesList.map((s, si) => {
        const pts: Pt[] = []
        for (let i = 0; i < n; i++) pts.push(polar(cx, cy, R * disp(si, i), angleOf(i, n)))
        return { pts, d: closedPath(pts, smooth) }
    })

    // 차이 음영 (시리즈 1 vs 2) — 둘 다 보일 때만
    const gap = useMemo(() => {
        if (!gapMode || isHidden(0) || isHidden(1) || n < 3) return null
        const k = smooth ? 8 : 1
        const A = sampleOutline(shapes[0].pts, smooth, k)
        const B = sampleOutline(shapes[1].pts, smooth, k)
        return gapPaths(A, B, { x: cx, y: cy })
    }, [gapMode, hidden, n, smooth, shown, R, cx, cy])

    const show = (i: number) => startTransition(() => setHoverAxis(i))
    const hideTip = () => startTransition(() => setHoverAxis(-1))
    const toggleSeries = (s: number) => {
        if (!legendToggle) return
        startTransition(() =>
            setHidden((prev) => {
                const next = prev.slice()
                next[s] = !next[s]
                return next
            })
        )
    }

    // 범례 위치에 따른 바깥 배치
    const legendRight = legendPosition === "right"
    const legendTop = legendPosition === "top"
    const dimFor = (s: number) => (dimOthers && hoverSeries >= 0 && hoverSeries !== s ? 0.22 : 1)

    // 툴팁 위치 (호버한 축의 끝점 근처)
    const tipAxis = showTooltip && hoverAxis >= 0 && hoverAxis < n ? hoverAxis : -1
    const tipPt = tipAxis >= 0 ? polar(cx, cy, R + labelGap, angleOf(tipAxis, n)) : null
    const tipLeftSide = tipPt ? tipPt.x >= cx : true

    const ariaFor = (i: number) =>
        `${axisList[i].label}: ` +
        seriesList
            .map((s, si) => (isHidden(si) ? "" : `${s.name} ${formatValue(s.raw[i], axisList[i].unit)}`))
            .filter(Boolean)
            .join(", ")

    // 눈금 라벨 텍스트 (Fixed 는 실제 값, 그 외는 % )
    // 글자 외곽선(halo) 색: 배경이 불투명하면 배경색, 아니면 흰색 (어두운 배경에서 흰 덩어리로 보이지 않게)
    const bgRgb = parseColor(background)
    const halo = bgRgb && bgRgb[3] > 0.5 ? background : "#FFFFFF"
    const haloCss: CSSProperties = { paintOrder: "stroke", stroke: withAlpha(halo, 0.85), strokeWidth: 3, strokeLinejoin: "round" }

    const scaleText = (k: number) => {
        const t = k / Math.max(1, rings)
        if (scaleMode === "fixed") return formatValue((maxValue > 0 ? maxValue : 100) * t, "")
        return `${Math.round(t * 100)}%`
    }

    const legend = showLegend && seriesList.length > 0 && (
        <div
            role="list"
            aria-label="Series"
            style={{
                display: "flex",
                flexDirection: legendRight ? "column" : "row",
                flexWrap: "wrap",
                gap: legendRight ? 8 : 14,
                justifyContent: legendRight ? "flex-start" : "center",
                alignItems: legendRight ? "flex-start" : "center",
                padding: legendRight ? "0 0 0 12px" : legendTop ? "0 0 10px" : "10px 0 0",
                flex: "0 0 auto",
                maxWidth: legendRight ? "40%" : "100%",
            }}
        >
            {seriesList.map((s, si) => {
                const off = isHidden(si)
                const swatchBg = s.style === "fill" ? withAlpha(s.color, 0.35) : "transparent"
                return (
                    <button
                        key={"lg" + si}
                        type="button"
                        className="bu-rc-legend"
                        role="listitem"
                        aria-pressed={!off}
                        aria-label={`${s.name}${off ? " (hidden)" : ""}`}
                        onClick={() => toggleSeries(si)}
                        onMouseEnter={() => startTransition(() => setHoverSeries(si))}
                        onMouseLeave={() => startTransition(() => setHoverSeries(-1))}
                        onFocus={() => startTransition(() => setHoverSeries(si))}
                        onBlur={() => startTransition(() => setHoverSeries(-1))}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            background: "none",
                            border: 0,
                            padding: "2px 4px",
                            margin: 0,
                            cursor: legendToggle ? "pointer" : "default",
                            color: labelColor,
                            opacity: off ? 0.4 : 1,
                            borderRadius: 6,
                            boxShadow: hoverSeries === si && !isCanvas ? `0 0 0 2px ${withAlpha(s.color, 0.5)}` : "none",
                            ...valueCss,
                            fontSize: vfs,
                            lineHeight: 1.2,
                            textDecoration: off ? "line-through" : "none",
                        }}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                width: 16,
                                height: 10,
                                borderRadius: 3,
                                background: swatchBg,
                                border: `${s.style === "dashed" ? "2px dashed" : "2px solid"} ${s.color}`,
                                boxSizing: "border-box",
                                flex: "0 0 auto",
                            }}
                        />
                        {s.name}
                    </button>
                )
            })}
        </div>
    )

    return (
        <div
            ref={rootRef}
            role="group"
            aria-label={`Radar chart comparing ${seriesList.map((s) => s.name).join(", ")}`}
            style={{
                "--bu-rc-focus": labelColor,
                ...style,
                display: "flex",
                flexDirection: legendRight ? "row" : "column",
                alignItems: "stretch",
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                padding,
                background,
                color: labelColor,
                position: "relative",
                overflow: "visible",
                ...fontCss,
            } as CSSProperties}
        >
            {/* 2026-10-31: 키보드로 이동할 때만 보이는 초점 테두리 (마우스 클릭에는 안 보임). SVG 영역은 outline 대신 stroke 로도 표시 */}
            <style>{".bu-rc-legend:focus-visible{outline:2px solid var(--bu-rc-focus);outline-offset:2px}.bu-rc-point:focus-visible{outline:2px solid var(--bu-rc-focus);stroke:var(--bu-rc-focus);stroke-width:3px}.bu-rc-legend:focus:not(:focus-visible),.bu-rc-point:focus:not(:focus-visible){outline:none}"}</style>
            {showLegend && legendTop && legend}

            {/* 차트 영역 (측정 대상) */}
            <div ref={areaRef} style={{ position: "relative", flex: "1 1 0", minWidth: 0, minHeight: 60 }}>
                <svg
                    width={w}
                    height={h}
                    viewBox={`0 0 ${w} ${h}`}
                    style={{ display: "block", position: "absolute", inset: 0, overflow: "visible" }}
                    aria-hidden="true"
                >
                    {/* 격자: 고리 */}
                    {n > 0 &&
                        Array.from({ length: Math.max(1, Math.min(10, Math.round(rings))) }).map((_, k, arr) => {
                            const r = (R * (k + 1)) / arr.length
                            if (gridShape === "circle" || n < 3)
                                return <circle key={"ring" + k} cx={cx} cy={cy} r={r} fill="none" stroke={gridColor} strokeWidth={1} />
                            const pts: Pt[] = []
                            for (let i = 0; i < n; i++) pts.push(polar(cx, cy, r, angleOf(i, n)))
                            return <path key={"ring" + k} d={closedPath(pts, false)} fill="none" stroke={gridColor} strokeWidth={1} />
                        })}

                    {/* 격자: 축선 */}
                    {axisList.map((_, i) => {
                        const p = polar(cx, cy, R, angleOf(i, n))
                        const hot = hoverAxis === i
                        return (
                            <line
                                key={"ax" + i}
                                x1={cx}
                                y1={cy}
                                x2={fmt(p.x)}
                                y2={fmt(p.y)}
                                stroke={hot ? labelColor : axisColor}
                                strokeWidth={hot ? 1.5 : 1}
                                style={{ transition: "stroke 0.15s" }}
                            />
                        )
                    })}

                    {/* 차이 음영 (시리즈 1 vs 2) */}
                    {gap && (
                        <g style={{ opacity: hoverSeries >= 0 && dimOthers ? 0.35 : 1, transition: "opacity 0.2s" }}>
                            {gap.a && <path d={gap.a} fill={withAlpha(seriesList[0].color, gapOpacity / 100)} stroke="none" />}
                            {gap.b && <path d={gap.b} fill={withAlpha(seriesList[1].color, gapOpacity / 100)} stroke="none" />}
                        </g>
                    )}

                    {/* 시리즈 다각형 */}
                    {seriesList.map((s, si) => {
                        if (isHidden(si)) return null
                        const forcedLine = gapMode && si < 2 && s.style === "fill"
                        const styleKind: SeriesStyle = forcedLine ? "line" : s.style
                        const fill = styleKind === "fill" ? withAlpha(s.color, fillOpacity / 100) : "none"
                        const visible = shapes[si].pts.some((p) => Math.hypot(p.x - cx, p.y - cy) > 0.5)
                        return (
                            <g key={"s" + si} style={{ opacity: visible ? dimFor(si) : 0, transition: "opacity 0.2s", pointerEvents: "none" }}>
                                <path
                                    d={shapes[si].d}
                                    fill={fill}
                                    stroke={s.color}
                                    strokeWidth={lineWidth}
                                    strokeLinejoin="round"
                                    strokeDasharray={styleKind === "dashed" ? `${lineWidth * 3} ${lineWidth * 2.5}` : undefined}
                                />
                                {pointSize > 0 &&
                                    shapes[si].pts.map((p, i) => (
                                        <circle
                                            key={"p" + i}
                                            cx={fmt(p.x)}
                                            cy={fmt(p.y)}
                                            r={hoverAxis === i ? pointSize * 1.5 : pointSize}
                                            fill={s.color}
                                            stroke={background && parseColor(background) && parseColor(background)![3] > 0.5 ? background : "#FFFFFF"}
                                            strokeWidth={Math.max(1, lineWidth * 0.75)}
                                            style={{ transition: "r 0.15s" }}
                                        />
                                    ))}
                                {/* 정점 값 */}
                                {pointValues !== "off" &&
                                    shapes[si].pts.map((p, i) => {
                                        if (pointValues === "hover" && hoverAxis !== i) return null
                                        const a = angleOf(i, n)
                                        // 값이 축 끝에 가까우면(0.8 초과) 축 라벨과 겹치지 않게 안쪽에 표시
                                        const dir = disp(si, i) > 0.8 ? -1 : 1
                                        const q = { x: p.x + Math.cos(a) * (pointSize + 8) * dir, y: p.y + Math.sin(a) * (pointSize + 8) * dir }
                                        const cosd = Math.cos(a) * dir
                                        const anchor = cosd > 0.2 ? "start" : cosd < -0.2 ? "end" : "middle"
                                        return (
                                            <text
                                                key={"v" + i}
                                                x={fmt(q.x)}
                                                y={fmt(q.y)}
                                                textAnchor={anchor}
                                                dominantBaseline="middle"
                                                fill={s.color}
                                                style={{ ...valueCss, fontSize: vfs, fontWeight: 700, ...haloCss }}
                                            >
                                                {formatValue(s.raw[i], axisList[i].unit)}
                                            </text>
                                        )
                                    })}
                            </g>
                        )
                    })}

                    {/* 눈금 라벨 (첫 축을 따라) */}
                    {showScale &&
                        n > 0 &&
                        Array.from({ length: Math.max(1, Math.min(10, Math.round(rings))) }).map((_, k, arr) => {
                            const r = (R * (k + 1)) / arr.length
                            return (
                                <text
                                    key={"sc" + k}
                                    x={fmt(cx - 6)}
                                    y={fmt(cy - r + 3)}
                                    textAnchor="end"
                                    fill={mutedColor}
                                    style={{ ...valueCss, fontSize: Math.max(9, vfs - 2), fontWeight: 400, ...haloCss, strokeWidth: 2.5 }}
                                >
                                    {scaleText(k + 1)}
                                </text>
                            )
                        })}

                    {/* 축 라벨 */}
                    {axisList.map((a, i) => {
                        const ang = angleOf(i, n)
                        const p = polar(cx, cy, R + labelGap, ang)
                        const c = Math.cos(ang)
                        const sn = Math.sin(ang)
                        const anchor = c > 0.15 ? "start" : c < -0.15 ? "end" : "middle"
                        const base = sn < -0.15 ? "auto" : sn > 0.15 ? "hanging" : "middle"
                        const hot = hoverAxis === i
                        return (
                            <text
                                key={"lb" + i}
                                x={fmt(p.x)}
                                y={fmt(p.y)}
                                textAnchor={anchor}
                                dominantBaseline={base}
                                fill={labelColor}
                                style={{ ...fontCss, fontSize: fs, opacity: hot ? 1 : 0.85 }}
                            >
                                {a.label}
                            </text>
                        )
                    })}

                    {/* 축 호버 영역(투명 부채꼴) — 작은 점을 맞출 필요 없이 축 근처면 툴팁 */}
                    {showTooltip &&
                        n > 0 &&
                        axisList.map((_, i) => {
                            const half = Math.PI / Math.max(1, n)
                            const a0 = angleOf(i, n) - half
                            const a1 = angleOf(i, n) + half
                            const rr = R + labelGap + fs * 1.6
                            const pts: Pt[] = [{ x: cx, y: cy }]
                            for (let k = 0; k <= 4; k++) pts.push(polar(cx, cy, rr, a0 + ((a1 - a0) * k) / 4))
                            return (
                                <path
                                    key={"hit" + i}
                                    d={closedPath(pts, false)}
                                    fill="rgba(0,0,0,0)"
                                    stroke="none"
                                    style={{ pointerEvents: "all", cursor: "default" }}
                                    className="bu-rc-point"
                                    role="img"
                                    aria-label={ariaFor(i)}
                                    tabIndex={0}
                                    onMouseEnter={() => show(i)}
                                    onMouseLeave={hideTip}
                                    onFocus={() => show(i)}
                                    onBlur={hideTip}
                                />
                            )
                        })}
                </svg>

                {/* 툴팁: 축 이름 + 보이는 시리즈의 원래 단위 값 */}
                {tipPt && (
                    <div
                        role="tooltip"
                        style={{
                            position: "absolute",
                            left: tipLeftSide ? tipPt.x + 10 : undefined,
                            right: tipLeftSide ? undefined : w - tipPt.x + 10,
                            top: clamp(tipPt.y, 0, h),
                            transform: "translateY(-50%)",
                            background: tooltipColor,
                            color: tooltipText,
                            padding: "8px 10px",
                            borderRadius: 8,
                            pointerEvents: "none",
                            whiteSpace: "nowrap",
                            zIndex: 5,
                            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                            ...valueCss,
                            fontSize: vfs,
                            lineHeight: 1.4,
                        }}
                    >
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{axisList[tipAxis].label}</div>
                        {seriesList.map((s, si) =>
                            isHidden(si) ? null : (
                                <div key={"tr" + si} style={{ display: "flex", alignItems: "center", gap: 6, opacity: dimFor(si) }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block" }} />
                                    <span style={{ opacity: 0.8 }}>{s.name}</span>
                                    <span style={{ fontWeight: 600, marginLeft: "auto", paddingLeft: 8 }}>{formatValue(s.raw[tipAxis], axisList[tipAxis].unit)}</span>
                                </div>
                            )
                        )}
                    </div>
                )}

                {n === 0 && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: mutedColor, ...valueCss, fontSize: vfs }}>
                        Add axes in the properties panel
                    </div>
                )}
            </div>

            {showLegend && !legendTop && legend}
        </div>
    )
}

RadarChart.displayName = "Radar Chart"

// 시리즈 N 의 속성 묶음 (기본값은 샘플)
function seriesControl(i: number): PropertyControls<RadarProps>[keyof RadarProps] {
    const d = SAMPLE_SERIES[i]
    return {
        type: ControlType.Object,
        title: `Series ${i + 1}`,
        controls: {
            name: { type: ControlType.String, title: "Name", defaultValue: d.name },
            values: {
                type: ControlType.String,
                title: "Values",
                defaultValue: d.values,
                placeholder: "92, 4.7, 4.5, …",
                displayTextArea: true,
            },
            color: { type: ControlType.Color, title: "Color", defaultValue: d.color },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["fill", "line", "dashed"],
                optionTitles: ["Fill", "Line", "Dashed"],
                defaultValue: d.style,
                displaySegmentedControl: true,
            },
        },
        hidden: (p: RadarProps) => (Number(p.seriesCount) || 1) < i + 1,
    } as unknown as PropertyControls<RadarProps>[keyof RadarProps]
}

// ─────────────────────────────────────────────
// 속성 컨트롤 (중요도순)
// ─────────────────────────────────────────────
addPropertyControls(RadarChart, {
    axes: {
        type: ControlType.Array,
        title: "Axes",
        maxCount: MAX_AXES,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Axis" },
                max: { type: ControlType.Number, title: "Max", defaultValue: 100, min: 0, step: 1, displayStepper: true },
                unit: { type: ControlType.String, title: "Unit", defaultValue: "", placeholder: "%, ★, $" },
            },
        },
        defaultValue: SAMPLE_AXES,
    },
    seriesCount: { type: ControlType.Number, title: "Series Count", defaultValue: 3, min: 1, max: MAX_SERIES, step: 1, displayStepper: true },
    series1: seriesControl(0),
    series2: seriesControl(1),
    series3: seriesControl(2),
    series4: seriesControl(3),
    series5: seriesControl(4),
    scaleMode: {
        type: ControlType.Enum,
        title: "Scale",
        options: ["fixed", "axis", "auto"],
        optionTitles: ["Fixed", "Per Axis", "Auto"],
        defaultValue: "axis",
        displaySegmentedControl: true,
    },
    maxValue: {
        type: ControlType.Number,
        title: "Max Value",
        defaultValue: 100,
        min: 0,
        step: 1,
        displayStepper: true,
        hidden: (p: RadarProps) => p.scaleMode === "auto",
    },
    compare: {
        type: ControlType.Enum,
        title: "Compare",
        options: ["overlay", "gap"],
        optionTitles: ["Overlay", "Gap 1 vs 2"],
        defaultValue: "overlay",
        displaySegmentedControl: true,
    },
    gapOpacity: { type: ControlType.Number, title: "Gap Opacity", defaultValue: 45, min: 0, max: 100, step: 1, unit: "%", hidden: (p: RadarProps) => p.compare !== "gap" },
    curve: {
        type: ControlType.Enum,
        title: "Curve",
        options: ["straight", "smooth"],
        optionTitles: ["Straight", "Smooth"],
        defaultValue: "straight",
        displaySegmentedControl: true,
    },
    gridShape: {
        type: ControlType.Enum,
        title: "Grid Shape",
        options: ["polygon", "circle"],
        optionTitles: ["Polygon", "Circle"],
        defaultValue: "polygon",
        displaySegmentedControl: true,
    },
    rings: { type: ControlType.Number, title: "Rings", defaultValue: 5, min: 1, max: 10, step: 1, displayStepper: true },
    showScale: { type: ControlType.Boolean, title: "Scale Labels", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    pointValues: {
        type: ControlType.Enum,
        title: "Point Values",
        options: ["off", "hover", "always"],
        optionTitles: ["Off", "On Hover", "Always"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
    pointSize: { type: ControlType.Number, title: "Point Size", defaultValue: 4, min: 0, max: 12, step: 1, unit: "px" },
    lineWidth: { type: ControlType.Number, title: "Line Width", defaultValue: 2, min: 0, max: 8, step: 0.5, unit: "px" },
    fillOpacity: { type: ControlType.Number, title: "Fill Opacity", defaultValue: 25, min: 0, max: 100, step: 1, unit: "%" },
    showLegend: { type: ControlType.Boolean, title: "Legend", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    legendPosition: {
        type: ControlType.Enum,
        title: "Legend Pos.",
        options: ["bottom", "top", "right"],
        optionTitles: ["Bottom", "Top", "Right"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
        hidden: (p: RadarProps) => !p.showLegend,
    },
    legendToggle: {
        type: ControlType.Boolean,
        title: "Legend Toggle",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p: RadarProps) => !p.showLegend,
    },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    dimOthers: { type: ControlType.Boolean, title: "Dim Others", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    gridColor: { type: ControlType.Color, title: "Grid", defaultValue: "rgba(17, 17, 20, 0.12)" },
    axisColor: { type: ControlType.Color, title: "Axis", defaultValue: "rgba(17, 17, 20, 0.2)" },
    labelColor: { type: ControlType.Color, title: "Label", defaultValue: "#111114" },
    mutedColor: { type: ControlType.Color, title: "Muted Text", defaultValue: "#6B6B76" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(255, 255, 255, 0)" },
    tooltipColor: { type: ControlType.Color, title: "Tooltip BG", defaultValue: "#111114", hidden: (p: RadarProps) => !p.showTooltip },
    tooltipText: { type: ControlType.Color, title: "Tooltip Text", defaultValue: "#FFFFFF", hidden: (p: RadarProps) => !p.showTooltip },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 8, min: 0, max: 80, step: 1, unit: "px" },
    animate: {
        type: ControlType.Boolean,
        title: "Animate In",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 900, min: 100, max: 3000, step: 50, unit: "ms", hidden: (p: RadarProps) => !p.animate },
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 120, min: 0, max: 600, step: 10, unit: "ms", hidden: (p: RadarProps) => !p.animate },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "13px", variant: "Semibold", lineHeight: "1.3em" },
    },
    valueFont: {
        type: ControlType.Font,
        title: "Value Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Medium", lineHeight: "1.3em" },
        description: "Created by BrandingUp",
    },
})
