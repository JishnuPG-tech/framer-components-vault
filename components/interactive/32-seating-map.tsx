
// [생성일] 2026-10-18
// [경위] 달러벌기 32번 상품($12) — 좌석 배치도. 행사·레스토랑·웨딩 홀의 테이블 배치도에서 좌석을 눌러 고르는 컴포넌트
// [변경이력]
//   - 2026-10-18: 최초 생성 (구역 1~6·테이블 40개·원형/사각·좌석 상태 4종·선택 요약·범례·고정 요소·툴팁·SVG viewBox 비율 축소·키보드 접근)
//   - 2026-10-31: 프레이머 자동 심사 권고 반영 — .sm-g 의 outline:none 을 키보드 초점 아닐 때만 적용하도록 바꿔 :focus-visible 테두리 보장, any 타입을 실제 타입으로 교체

import { useEffect, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties, ReactNode } from "react"
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
interface Section {
    name?: string
    color?: string
    price?: number
}

interface TableItem {
    name?: string
    section?: number
    shape?: "round" | "rect"
    seats?: number
    x?: number
    y?: number
    reserved?: string
    sold?: string
    preselected?: string
}

interface Landmark {
    label?: string
    x?: number
    y?: number
    w?: number
    h?: number
}

interface Colors {
    background?: string
    panel?: string
    text?: string
    muted?: string
    line?: string
    selected?: string
    reserved?: string
    sold?: string
}

interface Labels {
    title?: string
    empty?: string
    available?: string
    selected?: string
    reserved?: string
    sold?: string
    clear?: string
    guests?: string
    total?: string
}

interface SeatingMapProps {
    sections?: Section[]
    tables?: TableItem[]
    landmarks?: Landmark[]
    layout?: "manual" | "auto"
    mapHeight?: number
    seatSize?: number
    seatNumbers?: boolean
    tableNames?: boolean
    selectTable?: boolean
    maxSeats?: number
    showSummary?: boolean
    showLegend?: boolean
    showTooltip?: boolean
    currency?: string
    appearance?: "light" | "dark"
    animate?: boolean
    radius?: number
    padding?: number
    checkoutLabel?: string
    checkoutUrl?: string
    labels?: Labels
    customColors?: boolean
    colors?: Colors
    labelFont?: CSSProperties
    style?: CSSProperties
}

// 설치 직후 보이는 샘플: 구역 3개 · 테이블 8개 · 무대/바/입구
const SAMPLE_SECTIONS: Section[] = [
    { name: "Front", color: "#2DE5A0", price: 60 },
    { name: "Garden", color: "#6C8CFF", price: 45 },
    { name: "Back", color: "#FF9F6B", price: 30 },
]

const SAMPLE_TABLES: TableItem[] = [
    { name: "T1", section: 1, shape: "round", seats: 6, x: 22, y: 27, reserved: "1,2", sold: "", preselected: "" },
    { name: "T2", section: 1, shape: "round", seats: 8, x: 50, y: 27, reserved: "", sold: "", preselected: "3,4" },
    { name: "T3", section: 1, shape: "round", seats: 6, x: 78, y: 27, reserved: "", sold: "1-3", preselected: "" },
    { name: "T4", section: 2, shape: "rect", seats: 6, x: 22, y: 58, reserved: "5", sold: "", preselected: "" },
    { name: "T5", section: 2, shape: "round", seats: 8, x: 50, y: 58, reserved: "", sold: "5-8", preselected: "" },
    { name: "T6", section: 2, shape: "rect", seats: 6, x: 78, y: 58, reserved: "", sold: "", preselected: "" },
    { name: "T7", section: 3, shape: "rect", seats: 8, x: 30, y: 83, reserved: "", sold: "1,2", preselected: "" },
    { name: "T8", section: 3, shape: "rect", seats: 8, x: 70, y: 83, reserved: "2", sold: "", preselected: "" },
]

const SAMPLE_LANDMARKS: Landmark[] = [
    { label: "STAGE", x: 30, y: 3, w: 40, h: 8 },
    { label: "BAR", x: 2, y: 38, w: 7, h: 24 },
    { label: "ENTRANCE", x: 40, y: 95, w: 20, h: 4 },
]

const VB_W = 1000 // SVG 가상 폭. 높이는 mapHeight. 화면 폭에 맞춰 통째로 비율 축소
const STACK_BREAK = 720 // 컨테이너 폭이 이보다 작으면 요약 패널을 지도 아래로
const COMPACT_BREAK = 520 // 이보다 작으면 좌석 번호 글자 숨김(너무 작아 읽을 수 없음)

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

// 프레이머는 색을 rgb()/rgba() 로도 넘기므로 HEX·rgb 둘 다 처리
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

function withAlpha(color: string, alpha: number) {
    const rgb = parseColor(color)
    return rgb ? "rgba(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ", " + alpha + ")" : color
}

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
}

function num(v: unknown, fallback: number) {
    const n = Number(v)
    return isFinite(n) ? n : fallback
}

// "1,3-5" 같은 좌석 번호 문자열 → 번호 집합 ("all" 이면 전부)
function parseSeats(str: string | undefined, max: number): Set<number> {
    const out = new Set<number>()
    if (!str) return out
    String(str)
        .split(/[,;\s]+/)
        .forEach((part) => {
            if (!part) return
            if (/^all$/i.test(part)) {
                for (let i = 1; i <= max; i++) out.add(i)
                return
            }
            const m = part.match(/^(\d+)(?:-(\d+))?$/)
            if (!m) return
            const a = parseInt(m[1], 10)
            const b = m[2] ? parseInt(m[2], 10) : a
            for (let i = Math.max(1, Math.min(a, b)); i <= Math.min(max, Math.max(a, b)); i++) out.add(i)
        })
    return out
}

// 가격 서식 (소수점 있으면 2자리)
function money(v: number, currency: string) {
    const s = Math.abs(v) % 1 === 0 ? String(Math.round(v)) : v.toFixed(2)
    return currency + s.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

type Status = "available" | "reserved" | "sold"

interface GeoSeat {
    n: number
    x: number
    y: number
}

interface GeoTable {
    ti: number
    name: string
    section: number
    shape: "round" | "rect"
    count: number
    cx: number
    cy: number
    r: number // 원형 테이블 반지름
    w: number // 사각 테이블 폭
    h: number // 사각 테이블 높이
    seats: GeoSeat[]
    status: Status[] // 좌석 번호-1 → 상태
    pre: Set<number>
}

/**
 * Seating Map — 행사·레스토랑·웨딩 홀 좌석 배치도. 원형/사각 테이블을 자유롭게 배치하고, 좌석마다 예약/판매 상태를 표시하며,
 * 클릭으로 좌석을 골라 선택 목록·인원·합계 금액을 보여준다. 구역 1~6개, 테이블 최대 40개, 모바일에서는 비율을 유지한 채 통째로 축소.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 640
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function SeatingMap(props: SeatingMapProps) {
    const {
        sections,
        tables,
        landmarks,
        layout = "manual",
        mapHeight = 640,
        seatSize = 30,
        seatNumbers = true,
        tableNames = true,
        selectTable = true,
        maxSeats = 0,
        showSummary = true,
        showLegend = true,
        showTooltip = true,
        currency = "$",
        appearance = "light",
        animate = true,
        radius = 20,
        padding = 20,
        checkoutLabel = "Continue",
        checkoutUrl = "",
        labels: labelProps,
        customColors = false,
        colors: colorProps,
        labelFont,
        style,
    } = props

    // 프레이머는 기본값 없는 Color 컨트롤을 파란색으로 채워 넘기므로, Custom Colors 를 켰을 때만 Colors 값을 사용
    const colors = customColors ? colorProps : undefined
    const dark = appearance === "dark"
    const theme = {
        background: colors?.background ?? (dark ? "#101114" : "#FFFFFF"),
        panel: colors?.panel ?? (dark ? "#17181C" : "#F6F6F8"),
        text: colors?.text ?? (dark ? "#F4F4F6" : "#111114"),
        muted: colors?.muted ?? (dark ? "#9A9AA6" : "#6B6B76"),
        line: colors?.line ?? (dark ? "#2A2C33" : "#E3E4E8"),
        selected: colors?.selected ?? "#2DE5A0",
        reserved: colors?.reserved ?? "#F5B301",
        sold: colors?.sold ?? (dark ? "#3A3C45" : "#C9CBD2"),
    }
    const L = {
        title: labelProps?.title || "Your seats",
        empty: labelProps?.empty || "Pick seats on the map",
        available: labelProps?.available || "Available",
        selected: labelProps?.selected || "Selected",
        reserved: labelProps?.reserved || "Reserved",
        sold: labelProps?.sold || "Sold",
        clear: labelProps?.clear || "Clear",
        guests: labelProps?.guests || "Guests",
        total: labelProps?.total || "Total",
    }

    // ── 입력 정리: 구역(1~6) · 테이블(~40) · 고정 요소 ──
    const secList = useMemo<Required<Section>[]>(() => {
        const src = Array.isArray(sections) && sections.length ? sections : SAMPLE_SECTIONS
        return src.slice(0, 6).map((s, i) => ({
            name: s.name || "Section " + (i + 1),
            color: s.color || SAMPLE_SECTIONS[i % SAMPLE_SECTIONS.length].color || "#2DE5A0",
            price: Math.max(0, num(s.price, 0)),
        }))
    }, [sections])
    const tableList = useMemo(() => (Array.isArray(tables) && tables.length ? tables : SAMPLE_TABLES).slice(0, 40), [tables])
    const lmList = useMemo(() => (Array.isArray(landmarks) ? landmarks : SAMPLE_LANDMARKS).slice(0, 12), [landmarks])
    const priceOn = secList.some((s) => s.price > 0)

    const mapH = clamp(Math.round(num(mapHeight, 640)), 300, 1200)
    const s = clamp(num(seatSize, 24), 12, 44)

    // ── 지오메트리: 테이블 위치·좌석 좌표를 SVG 단위로 계산 ──
    const geo = useMemo<GeoTable[]>(() => {
        const n = tableList.length
        // 자동 격자: 지도 중앙 영역을 칸으로 나눠 순서대로 배치
        const cols = clamp(Math.ceil(Math.sqrt((n * VB_W * 0.84) / (mapH * 0.7))), 1, Math.max(1, n))
        const rows = Math.ceil(n / cols)
        const areaX = VB_W * 0.06
        const areaW = VB_W * 0.88
        const areaY = mapH * 0.2
        const areaH = mapH * 0.72
        return tableList.map((t, ti) => {
            const count = clamp(Math.round(num(t.seats, 4)), 2, 12)
            const shape = t.shape === "rect" ? "rect" : "round"
            let cx: number
            let cy: number
            if (layout === "auto") {
                const c = ti % cols
                const r = Math.floor(ti / cols)
                cx = areaX + (areaW / cols) * (c + 0.5)
                cy = areaY + (areaH / rows) * (r + 0.5)
            } else {
                cx = (clamp(num(t.x, 50), 0, 100) / 100) * VB_W
                cy = (clamp(num(t.y, 50), 0, 100) / 100) * mapH
            }
            const gapS = s * 1.25
            const seatsGeo: GeoSeat[] = []
            let r = 0
            let w = 0
            let h = 0
            if (shape === "round") {
                r = Math.max(s * 1.0, (count * gapS) / (2 * Math.PI))
                const ring = r + s * 0.75
                for (let i = 0; i < count; i++) {
                    const a = -Math.PI / 2 + (2 * Math.PI * i) / count
                    seatsGeo.push({ n: i + 1, x: cx + Math.cos(a) * ring, y: cy + Math.sin(a) * ring })
                }
            } else {
                const top = Math.ceil(count / 2)
                const bottom = count - top
                w = Math.max(top, 1) * gapS
                h = s * 1.5
                for (let i = 0; i < top; i++) seatsGeo.push({ n: i + 1, x: cx - (top * gapS) / 2 + gapS * (i + 0.5), y: cy - h / 2 - s * 0.7 })
                for (let i = 0; i < bottom; i++) seatsGeo.push({ n: top + i + 1, x: cx + (bottom * gapS) / 2 - gapS * (i + 0.5), y: cy + h / 2 + s * 0.7 })
            }
            const sold = parseSeats(t.sold, count)
            const reserved = parseSeats(t.reserved, count)
            const status: Status[] = []
            for (let i = 1; i <= count; i++) status.push(sold.has(i) ? "sold" : reserved.has(i) ? "reserved" : "available")
            return {
                ti,
                name: t.name || "T" + (ti + 1),
                section: clamp(Math.round(num(t.section, 1)), 1, 6),
                shape,
                count,
                cx,
                cy,
                r,
                w,
                h,
                seats: seatsGeo,
                status,
                pre: parseSeats(t.preselected, count),
            }
        })
    }, [tableList, layout, mapH, s])

    // ── 보이는 영역: 테이블·좌석·고정 요소를 모두 감싸는 사각형으로 viewBox 를 자동 맞춤 (여백이 줄어 좌석이 더 크게 보임) ──
    const view = useMemo(() => {
        let x0 = Infinity
        let y0 = Infinity
        let x1 = -Infinity
        let y1 = -Infinity
        const add = (ax: number, ay: number, bx: number, by: number) => {
            x0 = Math.min(x0, ax)
            y0 = Math.min(y0, ay)
            x1 = Math.max(x1, bx)
            y1 = Math.max(y1, by)
        }
        geo.forEach((t) => {
            t.seats.forEach((st) => add(st.x - s / 2, st.y - s / 2, st.x + s / 2, st.y + s / 2))
            if (t.shape === "round") add(t.cx - t.r, t.cy - t.r, t.cx + t.r, t.cy + t.r)
            else add(t.cx - t.w / 2, t.cy - t.h / 2, t.cx + t.w / 2, t.cy + t.h / 2)
        })
        lmList.forEach((m) => {
            const lx = (clamp(num(m.x, 0), 0, 100) / 100) * VB_W
            const ly = (clamp(num(m.y, 0), 0, 100) / 100) * mapH
            add(lx, ly, lx + (clamp(num(m.w, 10), 1, 100) / 100) * VB_W, ly + (clamp(num(m.h, 6), 1, 100) / 100) * mapH)
        })
        if (!isFinite(x0)) return { x: 0, y: 0, w: VB_W, h: mapH }
        const pad = 12
        return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 }
    }, [geo, lmList, mapH, s])

    // ── 선택 상태: 초기값은 테이블의 Preselected. 속성이 바뀌면 다시 맞춘다 ──
    const initial = useMemo(() => {
        const set = new Set<string>()
        geo.forEach((t) => t.pre.forEach((n) => t.status[n - 1] === "available" && set.add(t.ti + ":" + n)))
        return set
    }, [geo])
    const sig = tableList.map((t) => (t.preselected || "") + "/" + (t.sold || "") + "/" + (t.reserved || "")).join("|") + "#" + layout
    const [picked, setPicked] = useState<Set<string>>(initial)
    const [notice, setNotice] = useState("")
    useEffect(() => {
        startTransition(() => {
            setPicked(initial)
            setNotice("")
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sig])

    // 판매/예약으로 바뀐 좌석은 선택에서 자동 제외
    const chosen = useMemo(() => {
        const out: { t: GeoTable; n: number }[] = []
        geo.forEach((t) => {
            for (let n = 1; n <= t.count; n++) if (picked.has(t.ti + ":" + n) && t.status[n - 1] === "available") out.push({ t, n })
        })
        return out
    }, [geo, picked])
    const limit = Math.max(0, Math.round(num(maxSeats, 0)))
    const priceOf = (t: GeoTable) => secList[t.section - 1]?.price ?? secList[0]?.price ?? 0
    const total = chosen.reduce((a, c) => a + priceOf(c.t), 0)

    // 좌석 하나 선택/해제
    const toggleSeat = (t: GeoTable, n: number) => {
        if (t.status[n - 1] !== "available") return
        const key = t.ti + ":" + n
        if (picked.has(key)) {
            const next = new Set(picked)
            next.delete(key)
            startTransition(() => {
                setPicked(next)
                setNotice("")
            })
            return
        }
        if (limit > 0 && chosen.length >= limit) {
            startTransition(() => setNotice("Limit reached: " + limit + (limit === 1 ? " seat" : " seats")))
            return
        }
        const next = new Set(picked)
        next.add(key)
        startTransition(() => {
            setPicked(next)
            setNotice("")
        })
    }

    // 테이블 통째로 선택/해제: 비어 있는 좌석이 모두 선택돼 있으면 해제, 아니면 남은 자리 전부 선택(최대 인원까지)
    const toggleTable = (t: GeoTable) => {
        const free: number[] = []
        for (let n = 1; n <= t.count; n++) if (t.status[n - 1] === "available") free.push(n)
        if (!free.length) return
        const allOn = free.every((n) => picked.has(t.ti + ":" + n))
        const next = new Set(picked)
        let msg = ""
        if (allOn) free.forEach((n) => next.delete(t.ti + ":" + n))
        else {
            let count = chosen.length
            for (const n of free) {
                if (next.has(t.ti + ":" + n)) continue
                if (limit > 0 && count >= limit) {
                    msg = "Limit reached: " + limit + (limit === 1 ? " seat" : " seats")
                    break
                }
                next.add(t.ti + ":" + n)
                count++
            }
        }
        startTransition(() => {
            setPicked(next)
            setNotice(msg)
        })
    }

    const clearAll = () =>
        startTransition(() => {
            setPicked(new Set())
            setNotice("")
        })

    // ── 툴팁: 마우스 올림/키보드 포커스 ──
    const [hover, setHover] = useState<{ ti: number; n: number } | null>(null)

    // ── 컨테이너 폭 측정 (요약 패널 위치·좌석 번호 표시 여부) ──
    const rootRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(900)
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const apply = () => startTransition(() => setWidth(el.getBoundingClientRect().width))
        apply()
        const ro = new ResizeObserver(apply)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const stacked = width < STACK_BREAK
    const compact = width < COMPACT_BREAK

    // ── 등장 효과: 화면에 보일 때 1회만 (정적 렌더·캔버스·모션 줄이기·Animate 꺼짐 → 완성 상태, 화면 밖에서는 시작 안 함) ──
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const willAnimate = animate && !isStatic && !isCanvas
    const [shown, setShown] = useState(true)
    const [armed, setArmed] = useState(false)
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => startTransition(() => setReduced(mq.matches))
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])
    useEffect(() => {
        const el = rootRef.current
        if (!willAnimate || !el || typeof IntersectionObserver === "undefined") {
            startTransition(() => {
                setArmed(false)
                setShown(true)
            })
            return
        }
        startTransition(() => {
            setArmed(true)
            setShown(false)
        })
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0] && entries[0].isIntersecting) {
                    startTransition(() => setShown(true))
                    io.disconnect() // 1회만
                }
            },
            { threshold: 0.15 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [willAnimate])
    const motion = willAnimate && armed && !reduced

    // ── 글꼴 ──
    const textBase: CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, lineHeight: "1.3em", ...labelFont }
    const svgText: CSSProperties = { ...textBase, fontSize: 12, lineHeight: "1em" }
    const sr = { position: "absolute" as const, width: 1, height: 1, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" as const, border: 0, padding: 0 }

    const css = `
.sm-g { cursor: pointer; }
.sm-g:focus:not(:focus-visible) { outline: none; }
.sm-g:focus-visible { outline: 2px solid ${theme.selected}; outline-offset: 2px; }
.sm-g.sm-off { cursor: not-allowed; }
.sm-ring { opacity: 0; }
.sm-g:focus-visible .sm-ring { opacity: 1; }
.sm-btn:focus-visible, .sm-link:focus-visible { outline: 2px solid ${theme.selected}; outline-offset: 2px; }
.sm-body { transform-box: fill-box; transform-origin: center; ${motion ? "transition: transform 0.15s ease;" : ""} }
${motion ? ".sm-g:not(.sm-off):hover .sm-body { transform: scale(1.12); }" : ""}
${motion ? "@keyframes sm-pop { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }" : ""}
${motion && shown ? ".sm-pop { animation: sm-pop 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both; animation-delay: var(--d); }" : ""}
${motion && !shown ? ".sm-pop { opacity: 0; }" : ""}
`

    // ── 좌석 하나의 모양 (상태별: 비어 있음=구역색 / 선택=체크 / 예약=점선+점 / 판매=회색+X) ──
    const renderSeat = (t: GeoTable, seat: GeoSeat, order: number) => {
        const st = t.status[seat.n - 1]
        const key = t.ti + ":" + seat.n
        const isSel = st === "available" && picked.has(key)
        const sec = secList[t.section - 1] ?? secList[0]
        const secColor = sec.color
        const half = s / 2
        const x = seat.x - half
        const y = seat.y - half
        let fill = withAlpha(secColor, dark ? 0.3 : 0.28)
        let stroke = secColor
        let dash: string | undefined
        if (isSel) {
            fill = theme.selected
            stroke = theme.selected
        } else if (st === "reserved") {
            fill = withAlpha(theme.reserved, 0.22)
            stroke = theme.reserved
            dash = "3 2.5"
        } else if (st === "sold") {
            fill = theme.sold
            stroke = theme.sold
        }
        const avail = st === "available"
        const stateWord = isSel ? L.selected : st === "available" ? L.available : st === "reserved" ? L.reserved : L.sold
        const label = t.name + ", seat " + seat.n + ", " + sec.name + ", " + stateWord.toLowerCase() + (avail && priceOn ? ", " + money(sec.price, currency) : "")
        const mark = Math.max(3, s * 0.18)
        return (
            <g
                key={key}
                className={"sm-g" + (avail ? "" : " sm-off")}
                role="button"
                tabIndex={avail ? 0 : -1}
                aria-label={label}
                aria-pressed={avail ? isSel : undefined}
                aria-disabled={avail ? undefined : true}
                onClick={() => toggleSeat(t, seat.n)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggleSeat(t, seat.n)
                    }
                }}
                onPointerEnter={() => setHover({ ti: t.ti, n: seat.n })}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover({ ti: t.ti, n: seat.n })}
                onBlur={() => setHover(null)}
            >
                <rect className="sm-ring" x={x - 3} y={y - 3} width={s + 6} height={s + 6} rx={s * 0.34 + 3} fill="none" stroke={theme.text} strokeWidth={2} />
                <g className={"sm-body sm-pop"} style={{ ["--d" as string]: Math.min(order * 9, 700) + "ms" } as CSSProperties}>
                    <rect x={x} y={y} width={s} height={s} rx={s * 0.3} fill={fill} stroke={stroke} strokeWidth={1.6} strokeDasharray={dash} />
                    {isSel && <path d={"M" + (seat.x - s * 0.22) + " " + seat.y + "l" + s * 0.16 + " " + s * 0.17 + "l" + s * 0.3 + " " + -s * 0.34} fill="none" stroke="#0B1A13" strokeWidth={Math.max(2, s * 0.1)} strokeLinecap="round" strokeLinejoin="round" />}
                    {st === "sold" && <path d={"M" + (seat.x - mark) + " " + (seat.y - mark) + "L" + (seat.x + mark) + " " + (seat.y + mark) + "M" + (seat.x + mark) + " " + (seat.y - mark) + "L" + (seat.x - mark) + " " + (seat.y + mark)} stroke={dark ? "#9A9AA6" : "#FFFFFF"} strokeWidth={2} strokeLinecap="round" />}
                    {st === "reserved" && <circle cx={seat.x} cy={seat.y} r={Math.max(2, s * 0.09)} fill={theme.reserved} />}
                    {avail && !isSel && seatNumbers && !compact && (
                        <text x={seat.x} y={seat.y} textAnchor="middle" dominantBaseline="central" fill={theme.text} style={{ ...svgText, fontSize: Math.max(8, s * 0.42), fontWeight: 600, pointerEvents: "none" }}>
                            {seat.n}
                        </text>
                    )}
                </g>
            </g>
        )
    }

    // ── 테이블 몸통 (클릭하면 남은 자리 전부 선택/해제) ──
    const renderTable = (t: GeoTable) => {
        const sec = secList[t.section - 1] ?? secList[0]
        const free = t.status.filter((x) => x === "available").length
        const fill = withAlpha(sec.color, dark ? 0.14 : 0.12)
        const stroke = withAlpha(sec.color, 0.85)
        const canTap = selectTable && free > 0
        return (
            <g
                key={"t" + t.ti}
                className={"sm-g" + (canTap ? "" : " sm-off")}
                style={canTap ? undefined : { cursor: "default" }}
                role={canTap ? "button" : undefined}
                tabIndex={canTap ? 0 : -1}
                aria-label={canTap ? "Select all available seats at " + t.name + ", " + free + " of " + t.count + " left" : undefined}
                onClick={() => canTap && toggleTable(t)}
                onKeyDown={(e) => {
                    if (canTap && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault()
                        toggleTable(t)
                    }
                }}
                onPointerEnter={() => setHover({ ti: t.ti, n: 0 })}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover({ ti: t.ti, n: 0 })}
                onBlur={() => setHover(null)}
            >
                {t.shape === "round" ? (
                    <>
                        <circle className="sm-ring" cx={t.cx} cy={t.cy} r={t.r + 4} fill="none" stroke={theme.text} strokeWidth={2} />
                        <circle cx={t.cx} cy={t.cy} r={t.r} fill={fill} stroke={stroke} strokeWidth={1.6} />
                    </>
                ) : (
                    <>
                        <rect className="sm-ring" x={t.cx - t.w / 2 - 4} y={t.cy - t.h / 2 - 4} width={t.w + 8} height={t.h + 8} rx={12} fill="none" stroke={theme.text} strokeWidth={2} />
                        <rect x={t.cx - t.w / 2} y={t.cy - t.h / 2} width={t.w} height={t.h} rx={8} fill={fill} stroke={stroke} strokeWidth={1.6} />
                    </>
                )}
                {tableNames && (
                    <text x={t.cx} y={t.cy} textAnchor="middle" dominantBaseline="central" fill={theme.text} style={{ ...svgText, fontSize: clamp(s * 0.55, 10, 15), fontWeight: 700, pointerEvents: "none" }}>
                        {t.name}
                    </text>
                )}
            </g>
        )
    }

    // 툴팁 내용·위치 (SVG 좌표 → % 위치)
    const hoverT = hover ? geo[hover.ti] : undefined
    let tipText = ""
    let tipX = 0
    let tipY = 0
    if (showTooltip && hover && hoverT) {
        const sec = secList[hoverT.section - 1] ?? secList[0]
        const free = hoverT.status.filter((x) => x === "available").length
        if (hover.n === 0) {
            tipText = hoverT.name + " · " + sec.name + " · " + free + " of " + hoverT.count + " left"
            tipX = hoverT.cx
            tipY = hoverT.cy - (hoverT.shape === "round" ? hoverT.r + s * 1.7 : hoverT.h / 2 + s * 1.7)
        } else {
            const seat = hoverT.seats[hover.n - 1]
            const st = hoverT.status[hover.n - 1]
            const word = st === "available" ? (picked.has(hover.ti + ":" + hover.n) ? L.selected : L.available) : st === "reserved" ? L.reserved : L.sold
            tipText = hoverT.name + " · Seat " + hover.n + " · " + word + (st === "available" && priceOn ? " · " + money(sec.price, currency) : "")
            if (seat) {
                tipX = seat.x
                tipY = seat.y - s * 0.9
            }
        }
    }

    // 지도 위 고정 요소 (무대·바·입구 등)
    const lmEls = lmList.map((m, i) => {
        const x = (clamp(num(m.x, 0), 0, 100) / 100) * VB_W
        const y = (clamp(num(m.y, 0), 0, 100) / 100) * mapH
        const w = (clamp(num(m.w, 10), 1, 100) / 100) * VB_W
        const h = (clamp(num(m.h, 6), 1, 100) / 100) * mapH
        const vertical = h > w * 1.6
        return (
            <g key={"lm" + i} aria-hidden="true">
                <rect x={x} y={y} width={w} height={h} rx={10} fill={withAlpha(theme.text, dark ? 0.1 : 0.06)} stroke={withAlpha(theme.text, dark ? 0.22 : 0.16)} strokeWidth={1.2} strokeDasharray="5 4" />
                <text
                    x={x + w / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={theme.muted}
                    transform={vertical ? "rotate(-90 " + (x + w / 2) + " " + (y + h / 2) + ")" : undefined}
                    style={{ ...svgText, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em" }}
                >
                    {m.label || ""}
                </text>
            </g>
        )
    })

    let order = 0
    const mapEl = (
        <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
            <svg viewBox={view.x + " " + view.y + " " + view.w + " " + view.h} role="group" aria-label="Seating map" style={{ display: "block", width: "100%", height: "auto" }}>
                {lmEls}
                {geo.map((t) => (
                    <g key={"grp" + t.ti}>
                        {renderTable(t)}
                        {t.seats.map((seat) => renderSeat(t, seat, order++))}
                    </g>
                ))}
            </svg>
            {tipText && (
                <div
                    aria-hidden="true"
                    style={{
                        ...textBase,
                        position: "absolute",
                        left: clamp(((tipX - view.x) / view.w) * 100, 12, 88) + "%",
                        top: (clamp(tipY - view.y, 0, view.h) / view.h) * 100 + "%",
                        transform: "translate(-50%, -100%)",
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: dark ? "#F4F4F6" : "#111114",
                        color: dark ? "#111114" : "#FFFFFF",
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        zIndex: 2,
                        boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
                    }}
                >
                    {tipText}
                </div>
            )}
        </div>
    )

    // ── 범례 ──
    const swatch = (fill: string, stroke: string, dash?: boolean, extra?: ReactNode) => (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flex: "0 0 auto" }}>
            <rect x="1.5" y="1.5" width="13" height="13" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" strokeDasharray={dash ? "3 2" : undefined} />
            {extra}
        </svg>
    )
    const legendEl = showLegend && (
        <div style={{ ...textBase, fontSize: 13, color: theme.muted, display: "flex", flexWrap: "wrap", gap: "8px 18px", alignItems: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {swatch(withAlpha(secList[0].color, 0.28), secList[0].color)}
                {L.available}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {swatch(theme.selected, theme.selected, false, <path d="M4.5 8.4l2.3 2.3 4.6-5" fill="none" stroke="#0B1A13" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />)}
                {L.selected}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {swatch(withAlpha(theme.reserved, 0.22), theme.reserved, true, <circle cx="8" cy="8" r="1.6" fill={theme.reserved} />)}
                {L.reserved}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {swatch(theme.sold, theme.sold, false, <path d="M5.2 5.2l5.6 5.6M10.8 5.2l-5.6 5.6" stroke={dark ? "#9A9AA6" : "#FFFFFF"} strokeWidth="1.6" strokeLinecap="round" />)}
                {L.sold}
            </span>
            {secList.map((sec, i) => (
                <span key={"lg" + i} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: theme.text }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 3, background: sec.color, flex: "0 0 auto" }} />
                    {sec.name}
                    {priceOn ? <span style={{ color: theme.muted }}>{money(sec.price, currency)}</span> : null}
                </span>
            ))}
        </div>
    )

    // ── 선택 요약 패널 ──
    const query = chosen.map((c) => c.t.name + "-" + c.n).join(",")
    const href = checkoutUrl ? checkoutUrl + (checkoutUrl.indexOf("?") >= 0 ? "&" : "?") + "seats=" + encodeURIComponent(query) + "&guests=" + chosen.length + (priceOn ? "&total=" + total : "") : ""
    const summaryEl = showSummary && (
        <aside
            aria-label="Selected seats"
            style={{
                background: theme.panel,
                borderRadius: Math.max(8, radius - 6),
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxSizing: "border-box",
                width: stacked ? "100%" : 260,
                flex: stacked ? "0 0 auto" : "0 0 260px",
                alignSelf: stacked ? "stretch" : "flex-start",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ ...textBase, fontWeight: 700, fontSize: 16, color: theme.text }}>{L.title}</span>
                <span style={{ ...textBase, fontSize: 12, fontWeight: 700, minWidth: 24, textAlign: "center", padding: "3px 8px", borderRadius: 999, background: theme.selected, color: "#0B1A13", fontVariantNumeric: "tabular-nums" }}>{chosen.length}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 30, alignContent: "flex-start" }}>
                {chosen.length === 0 ? (
                    <span style={{ ...textBase, fontSize: 13, color: theme.muted }}>{L.empty}</span>
                ) : (
                    chosen.map((c) => (
                        <button
                            key={c.t.ti + ":" + c.n}
                            className="sm-btn"
                            aria-label={"Remove " + c.t.name + " seat " + c.n}
                            onClick={() => toggleSeat(c.t, c.n)}
                            style={{ ...textBase, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "5px 9px", borderRadius: 8, border: "1px solid " + withAlpha(theme.text, dark ? 0.2 : 0.12), background: theme.background, color: theme.text, fontVariantNumeric: "tabular-nums" }}
                        >
                            {c.t.name + "-" + c.n}
                        </button>
                    ))
                )}
            </div>
            <div style={{ borderTop: "1px solid " + theme.line, paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ ...textBase, display: "flex", justifyContent: "space-between", color: theme.muted, fontSize: 13 }}>
                    <span>{L.guests}</span>
                    <span style={{ color: theme.text, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{chosen.length}</span>
                </div>
                {priceOn && (
                    <div style={{ ...textBase, display: "flex", justifyContent: "space-between", color: theme.muted, fontSize: 13 }}>
                        <span>{L.total}</span>
                        <span style={{ color: theme.text, fontWeight: 700, fontSize: 16, fontVariantNumeric: "tabular-nums" }}>{money(total, currency)}</span>
                    </div>
                )}
            </div>
            {notice && <div style={{ ...textBase, fontSize: 12, color: theme.reserved, fontWeight: 600 }}>{notice}</div>}
            <div style={{ display: "flex", gap: 8 }}>
                <button
                    className="sm-btn"
                    onClick={clearAll}
                    disabled={chosen.length === 0}
                    style={{ ...textBase, fontSize: 13, fontWeight: 600, cursor: chosen.length ? "pointer" : "default", opacity: chosen.length ? 1 : 0.45, padding: "9px 16px", borderRadius: 999, border: "1px solid " + withAlpha(theme.text, dark ? 0.24 : 0.16), background: "transparent", color: theme.text }}
                >
                    {L.clear}
                </button>
                {href && chosen.length > 0 && (
                    <a
                        className="sm-link"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...textBase, fontSize: 13, fontWeight: 700, flex: 1, textAlign: "center", textDecoration: "none", padding: "9px 16px", borderRadius: 999, background: theme.selected, color: "#0B1A13" }}
                    >
                        {checkoutLabel}
                    </a>
                )}
            </div>
        </aside>
    )

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                width: "100%",
                boxSizing: "border-box",
                background: theme.background,
                color: theme.text,
                borderRadius: radius,
                padding,
                display: "flex",
                flexDirection: "column",
                gap: 14,
            }}
        >
            <style>{css}</style>
            <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", gap: 16, alignItems: "stretch" }}>
                <div style={{ flex: "1 1 0", minWidth: 0 }}>{mapEl}</div>
                {summaryEl}
            </div>
            {legendEl}
            <span style={sr} aria-live="polite">
                {chosen.length + (chosen.length === 1 ? " seat selected" : " seats selected") + (priceOn ? ", total " + money(total, currency) : "") + (notice ? ". " + notice : "")}
            </span>
        </div>
    )
}

SeatingMap.displayName = "SeatingMap"

addPropertyControls(SeatingMap, {
    sections: {
        type: ControlType.Array,
        title: "Sections",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Section" },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#2DE5A0" },
                price: { type: ControlType.Number, title: "Price", defaultValue: 40, min: 0, max: 100000, step: 1, displayStepper: true },
            },
        },
        defaultValue: SAMPLE_SECTIONS,
    },
    tables: {
        type: ControlType.Array,
        title: "Tables",
        maxCount: 40,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "T9", placeholder: "Short names fit best" },
                section: { type: ControlType.Number, title: "Section #", defaultValue: 1, min: 1, max: 6, step: 1, displayStepper: true },
                shape: { type: ControlType.Enum, title: "Shape", options: ["round", "rect"], optionTitles: ["Round", "Rectangle"], defaultValue: "round", displaySegmentedControl: true },
                seats: { type: ControlType.Number, title: "Seats", defaultValue: 6, min: 2, max: 12, step: 1, displayStepper: true },
                x: { type: ControlType.Number, title: "X Position", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
                y: { type: ControlType.Number, title: "Y Position", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
                reserved: { type: ControlType.String, title: "Reserved", defaultValue: "", placeholder: "Seat numbers: 1,3-4" },
                sold: { type: ControlType.String, title: "Sold", defaultValue: "", placeholder: "Seat numbers: 2,5-6 or all" },
                preselected: { type: ControlType.String, title: "Preselected", defaultValue: "", placeholder: "Seat numbers: 1,2" },
            },
        },
        defaultValue: SAMPLE_TABLES,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["manual", "auto"],
        optionTitles: ["Manual X/Y", "Auto grid"],
        defaultValue: "manual",
        displaySegmentedControl: true,
    },
    landmarks: {
        type: ControlType.Array,
        title: "Landmarks",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "STAGE" },
                x: { type: ControlType.Number, title: "X", defaultValue: 30, min: 0, max: 100, step: 1, unit: "%" },
                y: { type: ControlType.Number, title: "Y", defaultValue: 3, min: 0, max: 100, step: 1, unit: "%" },
                w: { type: ControlType.Number, title: "Width", defaultValue: 40, min: 1, max: 100, step: 1, unit: "%" },
                h: { type: ControlType.Number, title: "Height", defaultValue: 8, min: 1, max: 100, step: 1, unit: "%" },
            },
        },
        defaultValue: SAMPLE_LANDMARKS,
    },
    mapHeight: { type: ControlType.Number, title: "Map Height", defaultValue: 640, min: 300, max: 1200, step: 10, description: "Coordinates are % of a 1000-wide canvas; the view auto-fits to your tables" },
    seatSize: { type: ControlType.Number, title: "Seat Size", defaultValue: 30, min: 12, max: 44, step: 1 },
    seatNumbers: { type: ControlType.Boolean, title: "Seat Numbers", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    tableNames: { type: ControlType.Boolean, title: "Table Names", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    selectTable: { type: ControlType.Boolean, title: "Table Click", defaultValue: true, enabledTitle: "Select all", disabledTitle: "Off" },
    maxSeats: { type: ControlType.Number, title: "Max Seats", defaultValue: 0, min: 0, max: 100, step: 1, displayStepper: true, description: "0 = no limit" },
    showSummary: { type: ControlType.Boolean, title: "Summary", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showLegend: { type: ControlType.Boolean, title: "Legend", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    currency: { type: ControlType.String, title: "Currency", defaultValue: "$", placeholder: "$, €, ₩" },
    checkoutLabel: { type: ControlType.String, title: "Button Label", defaultValue: "Continue", hidden: (p: SeatingMapProps) => !p.checkoutUrl },
    checkoutUrl: { type: ControlType.String, title: "Button Link", defaultValue: "", placeholder: "https://… (optional)" },
    appearance: {
        type: ControlType.Enum,
        title: "Appearance",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 48, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 20, min: 0, max: 64, step: 1, unit: "px" },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        controls: {
            title: { type: ControlType.String, title: "Title", defaultValue: "Your seats" },
            empty: { type: ControlType.String, title: "Empty", defaultValue: "Pick seats on the map" },
            available: { type: ControlType.String, title: "Available", defaultValue: "Available" },
            selected: { type: ControlType.String, title: "Selected", defaultValue: "Selected" },
            reserved: { type: ControlType.String, title: "Reserved", defaultValue: "Reserved" },
            sold: { type: ControlType.String, title: "Sold", defaultValue: "Sold" },
            clear: { type: ControlType.String, title: "Clear", defaultValue: "Clear" },
            guests: { type: ControlType.String, title: "Guests", defaultValue: "Guests" },
            total: { type: ControlType.String, title: "Total", defaultValue: "Total" },
        },
    },
    customColors: { type: ControlType.Boolean, title: "Colors", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Preset" },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        icon: "color",
        hidden: (p: SeatingMapProps) => !p.customColors,
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            panel: { type: ControlType.Color, title: "Panel", defaultValue: "#F6F6F8" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B76" },
            line: { type: ControlType.Color, title: "Line", defaultValue: "#E3E4E8" },
            selected: { type: ControlType.Color, title: "Selected", defaultValue: "#2DE5A0" },
            reserved: { type: ControlType.Color, title: "Reserved", defaultValue: "#F5B301" },
            sold: { type: ControlType.Color, title: "Sold", defaultValue: "#C9CBD2" },
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Medium", lineHeight: "1.3em" },
        description: "Created by BrandingUp",
    },
})
