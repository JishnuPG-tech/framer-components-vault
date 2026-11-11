// [생성일] 2026-10-22
// [경위] 판매 진단(10-22) — 무료 체험판(Lite)으로 손님을 모아 정식판(06 Gantt Chart Timeline)으로 연결. 06번 코드를 복사해 차별 기능 4개를 뺀 무료판
// [제작] BrandingUp (https://brandingupstudio.com)
// [변경이력]
//   - 2026-10-22: 최초 생성 (06 GanttChart.tsx 복사 → 작업 6개 상한, 그룹 접기·시간 단위 직접 선택·오늘 날짜 고정·열 색 지정은 정식판 전용으로 제거)

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
interface Task {
    name?: string
    group?: string
    start?: string
    end?: string
    progress?: number
    milestone?: boolean
    color?: string
}

interface Colors {
    background?: string
    headerColor?: string
    textColor?: string
    subColor?: string
    gridColor?: string
    todayColor?: string
    borderColor?: string
}

interface GanttChartLiteProps {
    tasks?: Task[]
    showToday?: boolean
    showProgress?: boolean
    showTooltip?: boolean
    headerLabel?: string
    labelWidth?: number
    rowHeight?: number
    barHeight?: number
    barRadius?: number
    minChartWidth?: number
    radius?: number
    colors?: Colors
    font?: any
    scaleFont?: any
    style?: CSSProperties
}

// 화면에 그릴 한 줄 (그룹 머리글 또는 작업)
interface Row {
    kind: "group" | "task"
    key: string
    group: string
    name: string
    start: number // 시작 날짜(일 번호)
    end: number // 마지막 날짜(포함)
    progress: number // 0~100
    milestone: boolean
    color: string
    count: number // 그룹 머리글일 때 소속 작업 수
    indent: boolean
}

// 눈금 한 칸 (머리글 표시용)
interface Seg {
    from: number
    to: number
    label: string
}

// ─────────────────────────────────────────────
// 날짜 도구 — 모든 날짜는 "1970-01-01 이후 지난 일수"(일 번호)로 다룬다. 시간대 영향 없음
// ─────────────────────────────────────────────
const MS_DAY = 86400000
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
// 그룹 색 자동 배정용 팔레트 (작업에 색을 안 적었을 때)
const PALETTE = ["#2DE5A0", "#7C6CF2", "#3B82F6", "#F59E0B", "#EC4899", "#14B8A6"]

// "2026-10-09" 같은 글자 → 일 번호. 못 읽으면 null (그 작업은 건너뜀)
function parseDay(v?: string): number | null {
    if (!v) return null
    const m = String(v).trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
    if (!m) return null
    const t = Date.UTC(+m[1], +m[2] - 1, +m[3])
    return isNaN(t) ? null : Math.floor(t / MS_DAY)
}

// 일 번호 → 연, 월(0~11), 일
function ymd(day: number) {
    const d = new Date(day * MS_DAY)
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() }
}

// 그 달 1일의 일 번호
function monthStart(y: number, m: number) {
    return Math.floor(Date.UTC(y, m, 1) / MS_DAY)
}

// "Oct 9" 또는 "Oct 9, 2026"
function fmt(day: number, withYear = false) {
    const p = ymd(day)
    return MONTHS[p.m] + " " + p.d + (withYear ? ", " + p.y : "")
}

// 일 번호 → "YYYY-MM-DD" (샘플 데이터 생성용)
function iso(day: number) {
    const p = ymd(day)
    return p.y + "-" + String(p.m + 1).padStart(2, "0") + "-" + String(p.d).padStart(2, "0")
}

// 그 날이 속한 주의 월요일 (일 번호 0 = 1970-01-01 목요일)
function mondayOf(day: number) {
    return day - ((((day + 3) % 7) + 7) % 7)
}

// 샘플 프로젝트 — 열 때의 날짜를 기준으로 만들어서 "오늘 선"이 항상 진행 중인 구간에 보인다
function makeSample(): Task[] {
    const now = new Date()
    const today = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / MS_DAY)
    const base = mondayOf(today) - 21
    const t = (name: string, group: string, s: number, e: number, progress: number, color: string): Task => ({
        name,
        group,
        start: iso(base + s),
        end: iso(base + e),
        progress,
        milestone: false,
        color,
    })
    const ms = (name: string, group: string, s: number, color: string): Task => ({
        name,
        group,
        start: iso(base + s),
        end: "",
        progress: 0,
        milestone: true,
        color,
    })
    return [
        t("Research & kickoff", "Strategy", 0, 6, 100, "#7C6CF2"),
        t("Sitemap & wireframes", "Strategy", 4, 13, 100, "#7C6CF2"),
        ms("Design approval", "Strategy", 16, "#7C6CF2"),
        t("Visual design", "Design", 10, 32, 70, "#2DE5A0"),
        t("Framer build", "Build & Launch", 28, 46, 10, "#3B82F6"),
        ms("Launch", "Build & Launch", 56, "#3B82F6"),
    ]
}

const SAMPLE = makeSample()

// Lite: 작업은 최대 6개까지 그려진다 (정식판은 무제한)
const MAX_TASKS = 6

/**
 * 간트 차트 Lite (Gantt Chart Lite) — 정식판에서 접기·눈금 선택·작업 무제한을 뺀 무료판. 작업의 시작일·종료일만 입력하면 눈금과 막대를 자동 계산해 배치
 * 일/주/월 눈금 자동 선택, 오늘 표시선, 마일스톤, 진행률, 그룹 접기·펼치기, 호버 툴팁
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 590
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function GanttChartLite(props: GanttChartLiteProps) {
    const {
        tasks,
        showToday = true,
        showProgress = true,
        showTooltip = true,
        headerLabel = "Task",
        labelWidth = 210,
        rowHeight = 44,
        barHeight = 20,
        barRadius = 6,
        minChartWidth = 640,
        radius = 16,
        colors,
        font,
        scaleFont,
        style,
    } = props

    // Lite: 아래 3개는 정식판에서만 조절 가능 (여기서는 고정값)
    const timeScale = "auto" as "auto" | "day" | "week" | "month" // 눈금 단위는 기간에 맞춰 자동
    const todayDate = "" // 오늘선은 항상 실제 날짜
    const collapsible = false // 그룹 접기 없음
    const startCollapsed = false

    // 색 기본값 (프레이머는 색을 rgb()/rgba() 로 넘기므로 값을 가공하지 않고 그대로 CSS 에 넣는다)
    const C = {
        background: colors?.background ?? "#FFFFFF",
        headerColor: colors?.headerColor ?? "#F6F7F9",
        textColor: colors?.textColor ?? "#111114",
        subColor: colors?.subColor ?? "#6B6B76",
        gridColor: colors?.gridColor ?? "#E7E8ED",
        todayColor: colors?.todayColor ?? "#F43F5E",
        borderColor: colors?.borderColor ?? "rgba(17, 17, 20, 0.1)",
    }

    const headerH = 52 // 머리글 두 줄(위 28 + 아래 24)
    const rowH = Math.max(24, rowHeight)
    const barH = Math.min(Math.max(6, barHeight), rowH - 8)

    // ── 1) 입력 → 정리된 작업 목록 (날짜를 못 읽는 작업은 건너뜀) ──
    const list = (tasks && tasks.length ? tasks : SAMPLE).slice(0, MAX_TASKS)
    const { groups, minDay, maxEdge } = useMemo(() => {
        const order: string[] = []
        const map = new Map<string, Row[]>()
        let lo = Infinity
        let hi = -Infinity
        list.forEach((t, i) => {
            const s = parseDay(t.start)
            if (s === null) return
            let st = s
            let e = t.milestone ? s : parseDay(t.end) ?? s
            // 종료일이 시작일보다 빠르면 서로 바꿔 준다
            if (e < st) {
                const tmp = e
                e = st
                st = tmp
            }
            const g = (t.group || "").trim()
            if (!map.has(g)) {
                map.set(g, [])
                order.push(g)
            }
            const gi = order.indexOf(g)
            map.get(g)!.push({
                kind: "task",
                key: "t" + i,
                group: g,
                name: t.name || "Untitled",
                start: st,
                end: e,
                progress: Math.max(0, Math.min(100, Number(t.progress) || 0)),
                milestone: !!t.milestone,
                color: t.color || PALETTE[gi % PALETTE.length],
                count: 0,
                indent: g !== "",
            })
            lo = Math.min(lo, st)
            hi = Math.max(hi, e + 1) // 종료일 "당일 끝"까지 칠하므로 +1
        })
        const out = order.map((name, gi) => ({ name, gi, rows: map.get(name)! }))
        return { groups: out, minDay: lo, maxEdge: hi }
    }, [list])

    // ── 2) 그룹 접힘 상태 ──
    const groupNames = useMemo(() => groups.filter((g) => g.name !== "").map((g) => g.name), [groups])
    const initialCollapsed = useMemo(
        () => (startCollapsed && collapsible ? new Set(groupNames) : new Set<string>()),
        [groupNames, startCollapsed, collapsible]
    )
    const [collapsed, setCollapsed] = useState<Set<string>>(initialCollapsed)
    useEffect(() => {
        startTransition(() => setCollapsed(initialCollapsed))
    }, [initialCollapsed])

    // 그룹 머리글 클릭/키보드로 접기·펼치기
    const toggle = (name: string) => {
        if (!collapsible) return
        startTransition(() => {
            setCollapsed((prev) => {
                const next = new Set(prev)
                if (next.has(name)) next.delete(name)
                else next.add(name)
                return next
            })
        })
    }

    // ── 3) 보여줄 줄 목록 (그룹 머리글 + 펼쳐진 작업) ──
    const rows = useMemo(() => {
        const out: Row[] = []
        groups.forEach((g) => {
            if (g.name !== "") {
                const real = g.rows
                // 그룹 진행률 = 기간 가중 평균 (마일스톤 제외)
                const spans = real.filter((r) => !r.milestone)
                const total = spans.reduce((s, r) => s + (r.end - r.start + 1), 0)
                const prog = total ? spans.reduce((s, r) => s + r.progress * (r.end - r.start + 1), 0) / total : 0
                out.push({
                    kind: "group",
                    key: "g" + g.gi,
                    group: g.name,
                    name: g.name,
                    start: Math.min(...real.map((r) => r.start)),
                    end: Math.max(...real.map((r) => r.end)),
                    progress: prog,
                    milestone: false,
                    color: real[0].color,
                    count: real.length,
                    indent: false,
                })
            }
            if (g.name === "" || !(collapsible && collapsed.has(g.name))) out.push(...g.rows)
        })
        return out
    }, [groups, collapsed, collapsible])

    // ── 4) 컨테이너 폭 측정 (브라우저에서만) ──
    const boxRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [boxW, setBoxW] = useState(0)
    useEffect(() => {
        const el = boxRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const w = entries[0].contentRect.width
            startTransition(() => setBoxW(w))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // ── 5) 오늘 날짜 (서버·브라우저 화면 불일치를 막기 위해 마운트 후에만 계산) ──
    const [realToday, setRealToday] = useState<number | null>(null)
    useEffect(() => {
        const n = new Date()
        const d = Math.floor(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / MS_DAY)
        startTransition(() => setRealToday(d))
    }, [])
    const todayDay = parseDay(todayDate) ?? realToday

    // ── 6) 눈금 단위·범위·좌표 환산 ──
    const hasData = isFinite(minDay) && isFinite(maxEdge)
    const rawSpan = hasData ? maxEdge - minDay : 30
    const unit: "day" | "week" | "month" =
        timeScale !== "auto" ? timeScale : rawSpan <= 42 ? "day" : rawSpan <= 180 ? "week" : "month"

    // 단위 경계에 맞춰 범위를 넓힌다 (주 = 월요일 시작, 월 = 1일 시작)
    const lo0 = hasData ? minDay : 0
    const hi0 = hasData ? maxEdge : 30
    let rangeStart = lo0
    let rangeEnd = hi0
    if (unit === "week") {
        rangeStart = mondayOf(lo0)
        rangeEnd = mondayOf(hi0 - 1) + 7
    } else if (unit === "month") {
        const a = ymd(lo0)
        const b = ymd(hi0 - 1)
        rangeStart = monthStart(a.y, a.m)
        rangeEnd = monthStart(b.y, b.m + 1)
    }
    const spanDays = Math.max(1, rangeEnd - rangeStart)

    const minPx = unit === "day" ? 28 : unit === "week" ? 10 : 3.5 // 하루당 최소 픽셀 (좁은 화면에서는 가로 스크롤)
    const rightPad = 56 // 마지막 막대 옆 글자(진행률·날짜) 자리
    const availW = boxW > 0 ? boxW - labelWidth - 2 : 0
    const chartW = Math.max(minChartWidth, availW, spanDays * minPx + rightPad)
    const pxDay = (chartW - rightPad) / spanDays
    const xOf = (day: number) => (day - rangeStart) * pxDay
    const contentW = labelWidth + chartW
    const bodyH = rows.length * rowH
    const contentH = headerH + bodyH

    // 머리글 눈금 만들기: 위 줄(월/연) + 아래 줄(일/주/월)
    const { topSegs, subSegs } = useMemo(() => {
        const top: Seg[] = []
        const sub: Seg[] = []
        if (unit === "month") {
            // 위 = 연도, 아래 = 월
            let d = rangeStart
            while (d < rangeEnd) {
                const p = ymd(d)
                const next = monthStart(p.y, p.m + 1)
                sub.push({ from: d, to: Math.min(next, rangeEnd), label: MONTHS[p.m] })
                d = next
            }
            let y = ymd(rangeStart).y
            let from = rangeStart
            while (from < rangeEnd) {
                const next = monthStart(y + 1, 0)
                top.push({ from, to: Math.min(next, rangeEnd), label: String(y) })
                from = next
                y += 1
            }
        } else {
            // 위 = 월(연), 아래 = 일 번호 또는 주 시작 일
            let d = rangeStart
            while (d < rangeEnd) {
                const p = ymd(d)
                const next = monthStart(p.y, p.m + 1)
                top.push({ from: d, to: Math.min(next, rangeEnd), label: MONTHS[p.m] + " " + p.y })
                d = next
            }
            const step = unit === "day" ? 1 : 7
            for (let x = rangeStart; x < rangeEnd; x += step) {
                sub.push({ from: x, to: Math.min(x + step, rangeEnd), label: String(ymd(x).d) })
            }
        }
        return { topSegs: top, subSegs: sub }
    }, [unit, rangeStart, rangeEnd])

    // ── 7) 호버 툴팁 상태 ──
    const [hover, setHover] = useState<{ key: string; x: number } | null>(null)
    const showTip = (key: string, e?: { clientX: number }) => {
        if (!showTooltip) return
        const rect = contentRef.current?.getBoundingClientRect()
        const x = e && rect ? e.clientX - rect.left : labelWidth + 24
        startTransition(() => setHover({ key, x }))
    }
    const hideTip = () => startTransition(() => setHover(null))

    // 글꼴: 통째로 spread (개별 접근 금지)
    const labelFont: CSSProperties = { fontSize: 14, fontWeight: 500, lineHeight: "1.3em", ...font }
    const smallFont: CSSProperties = { fontSize: 12, fontWeight: 500, lineHeight: "1.2em", ...scaleFont }
    const hl = "rgba(128, 128, 128, 0.10)" // 호버 줄 강조

    // 날짜를 말로 풀기 (툴팁·접근성 라벨)
    const describe = (r: Row) => {
        if (r.milestone) return "Milestone · " + fmt(r.start, true)
        const days = r.end - r.start + 1
        return fmt(r.start, true) + " → " + fmt(r.end, true) + " · " + days + (days === 1 ? " day" : " days")
    }

    const todayVisible = showToday && todayDay !== null && todayDay >= rangeStart && todayDay <= rangeEnd
    const hoverRowIndex = hover ? rows.findIndex((r) => r.key === hover.key) : -1
    const hoverRow = hoverRowIndex >= 0 ? rows[hoverRowIndex] : null

    // 툴팁 위치: 마우스 x 근처, 보이는 영역 안쪽으로 보정. 아래쪽 줄은 위로 띄움
    const tipW = 240
    const tipH = 92
    let tipLeft = 0
    let tipTop = 0
    if (hoverRow && hover) {
        const box = boxRef.current
        const visRight = box ? box.scrollLeft + box.clientWidth : contentW
        tipLeft = Math.max(8, Math.min(hover.x + 14, visRight - tipW - 8, contentW - tipW - 8))
        const rowTop = headerH + hoverRowIndex * rowH
        const below = rowTop + rowH + 6
        tipTop = below + tipH > contentH + 8 && rowTop - tipH - 6 > headerH ? rowTop - tipH - 6 : below
    }

    // 날짜가 하나도 없을 때 안내 문구
    if (!hasData) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: C.background,
                    color: C.subColor,
                    border: `1px solid ${C.borderColor}`,
                    borderRadius: radius,
                    boxSizing: "border-box",
                    ...labelFont,
                }}
            >
                Add tasks with start dates (YYYY-MM-DD)
            </div>
        )
    }

    return (
        <div
            ref={boxRef}
            role="region"
            aria-label="Gantt chart"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "auto",
                boxSizing: "border-box",
                background: C.background,
                border: `1px solid ${C.borderColor}`,
                borderRadius: radius,
                color: C.textColor,
            }}
        >
            <div ref={contentRef} style={{ position: "relative", width: contentW, minHeight: "100%", isolation: "isolate" }}>
                {/* ── 머리글 (위쪽 고정) ── */}
                <div
                    style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 6,
                        display: "flex",
                        width: contentW,
                        height: headerH,
                        background: C.headerColor,
                        borderBottom: `1px solid ${C.gridColor}`,
                        boxSizing: "border-box",
                    }}
                >
                    {/* 왼쪽 위 모서리 (위·왼쪽 모두 고정) */}
                    <div
                        style={{
                            position: "sticky",
                            left: 0,
                            zIndex: 7,
                            flex: "none",
                            width: labelWidth,
                            height: "100%",
                            boxSizing: "border-box",
                            padding: "0 16px 8px",
                            display: "flex",
                            alignItems: "flex-end",
                            background: C.headerColor,
                            borderRight: `1px solid ${C.gridColor}`,
                            color: C.subColor,
                            ...smallFont,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                        }}
                    >
                        {headerLabel}
                    </div>
                    {/* 눈금 */}
                    <div style={{ position: "relative", flex: "none", width: chartW, height: "100%" }}>
                        {topSegs.map((s) => (
                            <div
                                key={"top" + s.from}
                                style={{
                                    position: "absolute",
                                    left: xOf(s.from),
                                    width: (s.to - s.from) * pxDay,
                                    top: 0,
                                    height: 28,
                                    boxSizing: "border-box",
                                    padding: "0 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    borderLeft: `1px solid ${C.gridColor}`,
                                    color: C.textColor,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    ...smallFont,
                                    fontWeight: 600,
                                }}
                            >
                                {s.label}
                            </div>
                        ))}
                        {subSegs.map((s) => (
                            <div
                                key={"sub" + s.from}
                                style={{
                                    position: "absolute",
                                    left: xOf(s.from),
                                    width: (s.to - s.from) * pxDay,
                                    top: 28,
                                    height: 24,
                                    boxSizing: "border-box",
                                    padding: "0 6px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: unit === "day" ? "center" : "flex-start",
                                    borderLeft: `1px solid ${C.gridColor}`,
                                    color: C.subColor,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    ...smallFont,
                                }}
                            >
                                {s.label}
                            </div>
                        ))}
                        {/* 오늘 표시 알약 */}
                        {todayVisible && todayDay !== null && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: xOf(todayDay) + pxDay / 2,
                                    top: 31,
                                    transform: "translateX(-50%)",
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    background: C.todayColor,
                                    color: "#FFFFFF",
                                    whiteSpace: "nowrap",
                                    ...smallFont,
                                    fontSize: 11,
                                    fontWeight: 700,
                                }}
                            >
                                Today
                            </div>
                        )}
                    </div>
                </div>

                {/* ── 세로 눈금선 (막대 뒤) ── */}
                <svg
                    width={chartW}
                    height={bodyH}
                    style={{ position: "absolute", left: labelWidth, top: headerH, zIndex: 1, pointerEvents: "none", overflow: "visible" }}
                    aria-hidden="true"
                >
                    {subSegs.map((s) => (
                        <line key={"gl" + s.from} x1={xOf(s.from)} x2={xOf(s.from)} y1={0} y2={bodyH} stroke={C.gridColor} strokeWidth={1} />
                    ))}
                </svg>

                {/* ── 본문 줄 ── */}
                {rows.map((r) => {
                    const isGroup = r.kind === "group"
                    const hovered = hover?.key === r.key
                    const left = xOf(r.start)
                    const width = Math.max(pxDay, (r.end - r.start + 1) * pxDay)
                    const open = !collapsed.has(r.group)
                    const canToggle = isGroup && collapsible
                    const aria = r.name + ", " + describe(r) + (r.milestone ? "" : ", " + Math.round(r.progress) + "% complete")
                    // 그룹 줄은 얇은 요약 막대, 마일스톤은 다이아몬드
                    const thin = isGroup ? Math.max(8, Math.round(barH * 0.45)) : barH
                    const diamond = Math.round(barH * 0.9)
                    const sideLeft = r.milestone ? left + pxDay / 2 + diamond / 2 + 8 : left + width + 8
                    const sideText = r.milestone ? fmt(r.start) : showProgress ? Math.round(r.progress) + "%" : ""
                    // 키보드로 막대에 포커스하면 그 위치에 툴팁
                    const focusTip = () =>
                        showTip(r.key, { clientX: (contentRef.current?.getBoundingClientRect().left ?? 0) + labelWidth + left })
                    return (
                        <div
                            key={r.key}
                            onMouseEnter={(e) => showTip(r.key, e)}
                            onMouseMove={(e) => showTip(r.key, e)}
                            onMouseLeave={hideTip}
                            style={{
                                position: "relative",
                                display: "flex",
                                width: contentW,
                                height: rowH,
                                boxSizing: "border-box",
                                borderBottom: `1px solid ${C.gridColor}`,
                                background: isGroup ? C.headerColor : "transparent",
                            }}
                        >
                            {/* 작업명 열 (왼쪽 고정) */}
                            <div
                                role={canToggle ? "button" : undefined}
                                tabIndex={canToggle ? 0 : undefined}
                                aria-expanded={canToggle ? open : undefined}
                                aria-label={canToggle ? (open ? "Collapse group " : "Expand group ") + r.name : undefined}
                                onClick={canToggle ? () => toggle(r.group) : undefined}
                                onKeyDown={
                                    canToggle
                                        ? (e) => {
                                              if (e.key === "Enter" || e.key === " ") {
                                                  e.preventDefault()
                                                  toggle(r.group)
                                              }
                                          }
                                        : undefined
                                }
                                style={{
                                    position: "sticky",
                                    left: 0,
                                    zIndex: 4,
                                    flex: "none",
                                    width: labelWidth,
                                    height: "100%",
                                    boxSizing: "border-box",
                                    padding: r.indent ? "0 12px 0 34px" : "0 12px 0 16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: isGroup ? C.headerColor : C.background,
                                    borderRight: `1px solid ${C.gridColor}`,
                                    cursor: canToggle ? "pointer" : "default",
                                    userSelect: "none",
                                    outlineOffset: -2,
                                }}
                            >
                                {hovered && <div style={{ position: "absolute", inset: 0, background: hl, pointerEvents: "none" }} />}
                                {isGroup && collapsible && (
                                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ flex: "none", opacity: collapsible ? 1 : 0.35 }}>
                                        <path
                                            d={open ? "M2.5 4.2 L6 7.8 L9.5 4.2" : "M4.2 2.5 L7.8 6 L4.2 9.5"}
                                            fill="none"
                                            stroke={C.subColor}
                                            strokeWidth="1.7"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                                <span
                                    style={{
                                        ...labelFont,
                                        color: C.textColor,
                                        fontWeight: isGroup ? 700 : labelFont.fontWeight,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        minWidth: 0,
                                    }}
                                >
                                    {r.name}
                                </span>
                                {isGroup && <span style={{ ...smallFont, color: C.subColor, flex: "none" }}>{r.count}</span>}
                            </div>

                            {/* 일정 칸 */}
                            <div style={{ position: "relative", flex: "none", width: chartW, height: "100%" }}>
                                {hovered && <div style={{ position: "absolute", inset: 0, background: hl, pointerEvents: "none" }} />}
                                {r.milestone ? (
                                    <div
                                        role="img"
                                        tabIndex={0}
                                        aria-label={aria}
                                        onFocus={focusTip}
                                        onBlur={hideTip}
                                        style={{
                                            position: "absolute",
                                            zIndex: 2,
                                            left: left + pxDay / 2 - diamond / 2,
                                            top: (rowH - diamond) / 2,
                                            width: diamond,
                                            height: diamond,
                                            boxSizing: "border-box",
                                            background: r.color,
                                            border: `2px solid ${C.background}`,
                                            borderRadius: Math.min(4, barRadius),
                                            transform: "rotate(45deg)",
                                            boxShadow: "0 2px 6px -2px rgba(0,0,0,0.35)",
                                        }}
                                    />
                                ) : (
                                    <div
                                        role="img"
                                        tabIndex={0}
                                        aria-label={aria}
                                        onFocus={focusTip}
                                        onBlur={hideTip}
                                        style={{
                                            position: "absolute",
                                            zIndex: 2,
                                            left,
                                            top: (rowH - thin) / 2,
                                            width,
                                            height: thin,
                                            borderRadius: isGroup ? Math.min(barRadius, thin / 2) : barRadius,
                                            overflow: "hidden",
                                            boxShadow: hovered ? "0 4px 12px -4px rgba(0,0,0,0.3)" : "none",
                                            transition: "box-shadow 0.15s ease",
                                        }}
                                    >
                                        {/* 바탕(연하게) */}
                                        <div style={{ position: "absolute", inset: 0, background: r.color, opacity: isGroup ? 0.35 : 0.3 }} />
                                        {/* 진행률(진하게) */}
                                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: r.progress + "%", background: r.color }} />
                                    </div>
                                )}
                                {sideText && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            zIndex: 2,
                                            left: sideLeft,
                                            top: 0,
                                            height: "100%",
                                            display: "flex",
                                            alignItems: "center",
                                            color: C.subColor,
                                            whiteSpace: "nowrap",
                                            pointerEvents: "none",
                                            ...smallFont,
                                        }}
                                    >
                                        {sideText}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}

                {/* ── 오늘 표시선 (막대 위) ── */}
                {todayVisible && todayDay !== null && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            zIndex: 3,
                            left: labelWidth + xOf(todayDay) + pxDay / 2 - 1,
                            top: headerH,
                            width: 2,
                            height: bodyH,
                            background: C.todayColor,
                            opacity: 0.85,
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* ── 툴팁 ── */}
                {showTooltip && hoverRow && (
                    <div
                        role="tooltip"
                        style={{
                            position: "absolute",
                            zIndex: 20,
                            left: tipLeft,
                            top: tipTop,
                            width: tipW,
                            boxSizing: "border-box",
                            padding: "10px 12px",
                            borderRadius: Math.min(radius, 12),
                            background: "#16161A",
                            color: "#FFFFFF",
                            boxShadow: "0 10px 28px -10px rgba(0,0,0,0.45)",
                            pointerEvents: "none",
                            ...smallFont,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 13 }}>
                            <span style={{ flex: "none", width: 8, height: 8, borderRadius: 4, background: hoverRow.color }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hoverRow.name}</span>
                        </div>
                        <div style={{ marginTop: 6, color: "rgba(255,255,255,0.78)" }}>{describe(hoverRow)}</div>
                        {!hoverRow.milestone && (
                            <div style={{ marginTop: 4, color: "rgba(255,255,255,0.78)" }}>{Math.round(hoverRow.progress)}% complete</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

GanttChartLite.displayName = "Gantt Chart Lite"

addPropertyControls(GanttChartLite, {
    tasks: {
        type: ControlType.Array,
        title: "Tasks",
        maxCount: MAX_TASKS, // Lite 상한
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "New task" },
                group: {
                    type: ControlType.String,
                    title: "Group",
                    defaultValue: "",
                    placeholder: "Group name",
                    description: "Tasks with the same group name are listed together. Leave empty for no group.",
                },
                start: {
                    type: ControlType.String,
                    title: "Start",
                    defaultValue: "2026-11-02",
                    placeholder: "YYYY-MM-DD",
                },
                end: {
                    type: ControlType.String,
                    title: "End",
                    defaultValue: "2026-11-13",
                    placeholder: "YYYY-MM-DD",
                    description: "Last day of the task (included). Not used for milestones.",
                },
                progress: { type: ControlType.Number, title: "Progress", defaultValue: 0, min: 0, max: 100, step: 5, unit: "%" },
                milestone: {
                    type: ControlType.Boolean,
                    title: "Milestone",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    optional: true,
                    description: "Leave unset to use the group color.",
                },
            },
        },
        defaultValue: SAMPLE,
    },
    showToday: {
        type: ControlType.Boolean,
        title: "Today Line",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress %",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showTooltip: {
        type: ControlType.Boolean,
        title: "Tooltip",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    headerLabel: { type: ControlType.String, title: "Column Title", defaultValue: "Task" },
    labelWidth: { type: ControlType.Number, title: "Name Column", defaultValue: 210, min: 120, max: 420, step: 5, unit: "px" },
    rowHeight: { type: ControlType.Number, title: "Row Height", defaultValue: 44, min: 28, max: 90, step: 2, unit: "px" },
    barHeight: { type: ControlType.Number, title: "Bar Height", defaultValue: 20, min: 6, max: 48, step: 1, unit: "px" },
    barRadius: { type: ControlType.Number, title: "Bar Radius", defaultValue: 6, min: 0, max: 24, step: 1, unit: "px" },
    minChartWidth: {
        type: ControlType.Number,
        title: "Min Chart Width",
        defaultValue: 640,
        min: 240,
        max: 2400,
        step: 20,
        unit: "px",
        description: "When the component is narrower than this, the chart area scrolls sideways.",
    },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 48, step: 1, unit: "px" },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            headerColor: { type: ControlType.Color, title: "Header", defaultValue: "#F6F7F9" },
            textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            subColor: { type: ControlType.Color, title: "Sub Text", defaultValue: "#6B6B76" },
            gridColor: { type: ControlType.Color, title: "Grid", defaultValue: "#E7E8ED" },
            todayColor: { type: ControlType.Color, title: "Today", defaultValue: "#F43F5E" },
            borderColor: { type: ControlType.Color, title: "Border", defaultValue: "rgba(17, 17, 20, 0.1)" },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Medium", lineHeight: "1.3em" },
    },
    scaleFont: {
        type: ControlType.Font,
        title: "Scale Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Medium", lineHeight: "1.2em" },
        description: "Created by BrandingUp",
    },
})
