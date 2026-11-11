// [생성일] 2026-10-09
// [경위] 사장님 지시 다이어그램 10종 동시 제작 — 달러벌기 12번 상품, 순환(사이클) 프로세스 도식
// [변경이력]
//   - 2026-10-09: 최초 생성 (원 둘레 자동 배치 + 단계 사이 화살표 호, 방향·시작각, 설명 패널 3종(Center/Side/Tooltip), 자동 순환 하이라이트, 노드 모양 3종, 좁은 화면 자동 축소)

import { useEffect, useId, useMemo, useRef, useState, startTransition } from "react"
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
interface Step {
    title?: string
    description?: string
    icon?: string
    color?: string
    image?: { src?: string; srcSet?: string; alt?: string }
}

interface LayoutOptions {
    ringWidth?: number
    radiusRatio?: number
    nodeSize?: number
    arrowGap?: number
    cornerRadius?: number
    showRing?: boolean
    showArrows?: boolean
}

interface Appearance {
    accent?: string
    textColor?: string
    subColor?: string
    cardColor?: string
    ringColor?: string
    arrowColor?: string
    onAccent?: string
}

interface CycleDiagramProps {
    steps?: Step[]
    centerTitle?: string
    centerSubtitle?: string
    direction?: "clockwise" | "counterclockwise"
    startAngle?: number
    detail?: "center" | "side" | "tooltip"
    nodeShape?: "circle" | "pill" | "card"
    autoCycle?: boolean
    interval?: number
    pauseOnHover?: boolean
    layout?: LayoutOptions
    appearance?: Appearance
    titleFont?: any
    labelFont?: any
    bodyFont?: any
    style?: CSSProperties
}

// 설치 직후 보이는 샘플 데이터 — 브랜드 플라이휠 6단계
const SAMPLE: Step[] = [
    { title: "Attract", description: "Useful content and word of mouth bring the right people to your brand.", icon: "megaphone", color: "#4F46E5" },
    { title: "Engage", description: "Start real conversations so people get to know what you stand for.", icon: "message", color: "#7C3AED" },
    { title: "Convert", description: "Make the first purchase or sign-up simple, clear and low-risk.", icon: "cart", color: "#DB2777" },
    { title: "Deliver", description: "Over-deliver on the promise so the experience matches the story.", icon: "gift", color: "#EA580C" },
    { title: "Delight", description: "Small surprises turn satisfied customers into people who care.", icon: "heart", color: "#D97706" },
    { title: "Advocate", description: "Happy customers recommend you, and that feeds the next Attract.", icon: "users", color: "#059669" },
]

// 아이콘 (24×24 선 아이콘 경로). 외부 패키지 없이 직접 그린 것
const ICONS: Record<string, string[]> = {
    star: ["M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 3 1.1-6.2L3 9.7l6.2-.9z"],
    bolt: ["M13 2L4 14h7l-1 8 9-12h-7z"],
    heart: ["M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"],
    users: ["M9 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", "M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6", "M17 7a2.5 2.5 0 1 1 0 5", "M17 14c2.5 0 4.5 2 4.5 5"],
    target: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"],
    chart: ["M4 4v16h16", "M8 16v-4", "M12 16V8", "M16 16v-6"],
    megaphone: ["M3 11v2a1 1 0 0 0 1 1h3l8 4V6L7 10H4a1 1 0 0 0-1 1z", "M18 9a4 4 0 0 1 0 6"],
    check: ["M5 12.5l4.5 4.5L19 7.5"],
    refresh: ["M20 11A8 8 0 0 0 5.5 7", "M4 4v4h4", "M4 13a8 8 0 0 0 14.5 4", "M20 20v-4h-4"],
    gift: ["M4 11h16v9H4z", "M3 7h18v4H3z", "M12 7v13", "M12 7c-1-3-4-3.5-4-1.5S10 7 12 7z", "M12 7c1-3 4-3.5 4-1.5S14 7 12 7z"],
    bulb: ["M9 18h6", "M10 21h4", "M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"],
    cart: ["M3 4h2l2.5 11h10l2-8H6.5", "M9.5 20h.01", "M17.5 20h.01"],
    message: ["M4 5h16v11H9l-5 4z"],
}
const ICON_OPTIONS = ["number", ...Object.keys(ICONS)]

// 설계 기준 크기 (이 크기로 그린 뒤 컨테이너에 맞춰 통째로 축소/확대)
const DW = 680
const DH = 540
const CX = DW / 2
const CY = DH / 2
const LABEL_W = 88 // 원형 노드 바깥 라벨 폭
const LABEL_H = 36 // 원형 노드 바깥 라벨 높이
const PANEL_W = 280 // 옆 패널 폭
const MAX_STEPS = 12

// 색에 투명도를 입힘 (프레이머는 rgb()/rgba() 로 넘기므로 둘 다 처리)
function withAlpha(color: string, alpha: number) {
    const rgb = typeof color === "string" ? color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i) : null
    if (rgb) return "rgba(" + rgb[1] + ", " + rgb[2] + ", " + rgb[3] + ", " + alpha + ")"
    if (typeof color === "string" && color.charAt(0) === "#") {
        let h = color.slice(1)
        if (h.length === 3) h = h.split("").map((c) => c + c).join("")
        return "rgba(" + parseInt(h.slice(0, 2), 16) + ", " + parseInt(h.slice(2, 4), 16) + ", " + parseInt(h.slice(4, 6), 16) + ", " + alpha + ")"
    }
    return color
}

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

// 각도(0° = 12시, 시계 방향이 +) → 좌표
function pointAt(R: number, angle: number) {
    return { x: CX + R * Math.sin(rad(angle)), y: CY - R * Math.cos(rad(angle)) }
}

// 노드(사각형/원) 중심에서 진행 방향(tx,ty)으로 경계까지의 거리
function boundaryDist(hw: number, hh: number, tx: number, ty: number, isCircle: boolean) {
    if (isCircle) return hw
    const ax = Math.abs(tx) < 1e-6 ? 1e-6 : Math.abs(tx)
    const ay = Math.abs(ty) < 1e-6 ? 1e-6 : Math.abs(ty)
    return Math.min(hw / ax, hh / ay)
}

// 아이콘 / 숫자 / 이미지 한 개를 그리는 작은 조각
function Glyph({ step, index, size, numberFontSize }: { step: Step; index: number; size: number; numberFontSize: number }) {
    if (step.image && step.image.src) {
        return (
            <img
                src={step.image.src}
                srcSet={step.image.srcSet}
                alt=""
                draggable={false}
                style={{ width: size, height: size, objectFit: "cover", borderRadius: "50%", display: "block" }}
            />
        )
    }
    const paths = step.icon && step.icon !== "number" ? ICONS[step.icon] : null
    if (!paths) {
        return <span style={{ fontSize: numberFontSize, fontWeight: 700, lineHeight: 1 }}>{index + 1}</span>
    }
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {paths.map((d, k) => (
                <path key={k} d={d} />
            ))}
        </svg>
    )
}

/**
 * 12 Cycle Process Diagram — 단계 수만 바꾸면 각도·화살표가 자동으로 맞춰지는 순환 도식
 * 설명 패널(Center / Side / Tooltip) + 자동 순환 하이라이트 지원
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 680
 * @framerIntrinsicHeight 540
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CycleDiagram(props: CycleDiagramProps) {
    const {
        steps,
        centerTitle = "Brand Flywheel",
        centerSubtitle = "Hover or click a step",
        direction = "clockwise",
        startAngle = 0,
        detail = "center",
        nodeShape = "circle",
        autoCycle = true,
        interval = 3,
        pauseOnHover = true,
        layout,
        appearance,
        titleFont,
        labelFont,
        bodyFont,
        style,
    } = props

    const list: Step[] = (steps && steps.length ? steps : SAMPLE).slice(0, MAX_STEPS)
    const N = list.length
    const isStatic = useIsStaticRenderer() // 정적 렌더(캔버스 썸네일 등)에서는 자동 순환 정지
    const uid = "cd" + useId().replace(/[:]/g, "")

    // ── 설정 기본값 ──
    const ringWidth = layout?.ringWidth ?? 4
    const radiusRatio = layout?.radiusRatio ?? 0.95
    const nodeSize = layout?.nodeSize ?? 64
    const arrowGap = layout?.arrowGap ?? 8
    const cardRadius = layout?.cornerRadius ?? 16
    const showRing = layout?.showRing ?? true
    const showArrows = layout?.showArrows ?? true
    const theme = {
        accent: appearance?.accent ?? "#4F46E5",
        textColor: appearance?.textColor ?? "#111114",
        subColor: appearance?.subColor ?? "#6B6B76",
        cardColor: appearance?.cardColor ?? "#FFFFFF",
        ringColor: appearance?.ringColor ?? "rgba(17, 17, 20, 0.05)",
        arrowColor: appearance?.arrowColor ?? "rgba(17, 17, 20, 0.28)",
        onAccent: appearance?.onAccent ?? "#FFFFFF",
    }
    const s = direction === "counterclockwise" ? -1 : 1 // 진행 방향 부호
    const isCircle = nodeShape === "circle"

    // ── 상태: 마우스 올림 / 클릭 고정 / 자동 순환 위치 ──
    const [hovered, setHovered] = useState<number | null>(null)
    const [pinned, setPinned] = useState<number | null>(null)
    const [autoIdx, setAutoIdx] = useState(0)
    const [inView, setInView] = useState(true)
    const [box, setBox] = useState({ w: DW, h: DH })

    // 보여줄 단계: 클릭 고정 > 마우스 올림 > 자동 순환 (자동 순환이 꺼져 있으면 없음)
    const rawShown = pinned !== null ? pinned : hovered !== null ? hovered : autoCycle ? autoIdx : null
    const shown = rawShown !== null && rawShown < N ? rawShown : null

    // ── 컨테이너 크기·화면 노출 감지 ──
    const rootRef = useRef<HTMLDivElement>(null)
    const prevContentH = useRef(0)
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0].contentRect
            startTransition(() => setBox({ w: r.width, h: r.height }))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    // 화면 밖이면 자동 순환 정지 (마켓 AI 심사 요구사항)
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => {
                startTransition(() => setInView(entries[0].isIntersecting))
            },
            { threshold: 0.1 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    // ── 자동 순환: 정적 렌더·캔버스·화면 밖·고정/호버 중에는 멈춤 ──
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const canAuto = autoCycle && !isStatic && !onCanvas && inView && N > 1 && pinned === null && !(pauseOnHover && hovered !== null)
    useEffect(() => {
        if (!canAuto) return
        const t = window.setInterval(() => {
            startTransition(() => setAutoIdx((i) => (i + 1) % N))
        }, Math.max(1, interval) * 1000)
        return () => window.clearInterval(t)
    }, [canAuto, N, interval])

    // ── 기하 계산: 노드 크기 → 반지름 → 각 단계 위치 → 화살표 호 ──
    const geo = useMemo(() => {
        // 단계가 많으면(9개 이상) 사각형 노드는 서로 겹치지 않게 자동으로 줄임
        const k = (nodeSize / 64) * (!isCircle && N > 8 ? 8 / N : 1)
        let nw = nodeSize
        let nh = nodeSize
        if (nodeShape === "pill") {
            nw = Math.round(156 * k)
            nh = Math.round(46 * k)
        } else if (nodeShape === "card") {
            nw = Math.round(172 * k)
            nh = Math.round(76 * k)
        }
        // 화면 가장자리에 노드·라벨이 잘리지 않도록 여백 계산
        const mx = isCircle ? nw / 2 + 14 + LABEL_W : nw / 2 + 6
        const my = isCircle ? nh / 2 + 10 + LABEL_H : nh / 2 + 6
        const R = Math.max(40, Math.min(CX - mx, CY - my) * radiusRatio)
        const step = 360 / N
        const angles: number[] = []
        const pos: { x: number; y: number }[] = []
        for (let i = 0; i < N; i++) {
            const a = startAngle + s * i * step
            angles.push(a)
            pos.push(pointAt(R, a))
        }
        // 단계 i → i+1 화살표 (호 + 화살촉)
        const headLen = 8 + ringWidth * 1.2
        const headHalf = 4.5 + ringWidth * 0.7
        const edges: { d: string; head: string }[] = []
        if (N > 1) {
            for (let i = 0; i < N; i++) {
                const a0 = angles[i]
                const a1 = angles[i] + s * step
                // 진행 방향 벡터(접선)로 노드 경계까지의 거리를 구해 노드와 겹치지 않게 함
                const d0 = boundaryDist(nw / 2, nh / 2, Math.cos(rad(a0)), Math.sin(rad(a0)), isCircle)
                const d1 = boundaryDist(nw / 2, nh / 2, Math.cos(rad(a1)), Math.sin(rad(a1)), isCircle)
                // 노드 둘레 여백(도 단위). 단계가 많아 호가 너무 짧아지면 여백을 비례해서 줄여 화살표가 항상 보이게 함
                let off0 = deg((d0 + arrowGap) / R)
                let off1 = deg((d1 + arrowGap) / R)
                const headDeg = deg(headLen / R)
                const room = Math.max(0, step - headDeg) * 0.7
                if (off0 + off1 > room) {
                    const f = room / (off0 + off1)
                    off0 *= f
                    off1 *= f
                }
                const startA = a0 + s * off0
                const tipA = a1 - s * off1
                const baseA = tipA - s * headDeg
                const span = (baseA - startA) * s
                if (span < 3 || span >= 180) {
                    edges.push({ d: "", head: "" })
                    continue
                }
                const p0 = pointAt(R, startA)
                const pb = pointAt(R, baseA)
                const tip = pointAt(R, tipA)
                const mb = { x: s * Math.cos(rad(baseA)), y: s * Math.sin(rad(baseA)) } // 접선
                const nrm = { x: -mb.y, y: mb.x }
                const h1 = { x: pb.x + nrm.x * headHalf, y: pb.y + nrm.y * headHalf }
                const h2 = { x: pb.x - nrm.x * headHalf, y: pb.y - nrm.y * headHalf }
                edges.push({
                    d: `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${R.toFixed(2)} ${R.toFixed(2)} 0 0 ${s > 0 ? 1 : 0} ${pb.x.toFixed(2)} ${pb.y.toFixed(2)}`,
                    head: `${tip.x.toFixed(2)},${tip.y.toFixed(2)} ${h1.x.toFixed(2)},${h1.y.toFixed(2)} ${h2.x.toFixed(2)},${h2.y.toFixed(2)}`,
                })
            }
        }
        // 가운데 안내 영역 폭: 노드 안쪽 끝에서 여유를 둔 내접 박스
        const innerR = Math.max(60, R - nw / 2 - 14)
        return { nw, nh, R, angles, pos, edges, centerW: Math.round(innerR * 1.45) }
    }, [N, nodeShape, nodeSize, radiusRatio, startAngle, s, ringWidth, arrowGap, isCircle])

    // ── 화면 맞춤(fit): 컨테이너 폭·높이에 맞춰 통째로 축소/확대 ──
    const sideMode = detail === "side"
    const row = sideMode && box.w >= 640
    const availW = row ? box.w - PANEL_W - 24 : box.w
    // 높이가 "자동"일 때는 높이를 제한 조건으로 쓰지 않음 (직전 렌더 높이와 같으면 자동으로 판단)
    const autoH = Math.abs(box.h - prevContentH.current) < 3
    const availH = autoH || box.h < 80 ? Infinity : row ? box.h : sideMode ? Math.max(box.h - 180, 120) : box.h
    const fit = Math.max(0.2, Math.min(2, availW / DW, availH / DH))
    prevContentH.current = Math.round(DH * fit + (sideMode && !row ? 180 : 0))

    // ── 키보드: 방향키로 단계 사이 이동, Esc 로 고정 해제 ──
    const btnRefs = useRef<(HTMLButtonElement | null)[]>([])
    const onKeyDown = (e: any) => {
        if (e.key === "Escape") {
            startTransition(() => setPinned(null))
            return
        }
        const fwd = e.key === "ArrowRight" || e.key === "ArrowDown"
        const back = e.key === "ArrowLeft" || e.key === "ArrowUp"
        if (!fwd && !back) return
        e.preventDefault()
        const cur = btnRefs.current.findIndex((b) => b && b.contains(e.target))
        const next = ((cur < 0 ? 0 : cur + (fwd ? 1 : -1)) + N) % N
        const el = btnRefs.current[next]
        if (el) el.focus()
    }

    const stepColor = (st: Step) => st.color || theme.accent

    // 설명 내용 한 덩어리 (Center·Side·Tooltip 공용)
    const detailBlock = (i: number, align: "center" | "left") => {
        const st = list[i]
        const c = stepColor(st)
        return (
            <div key={i} className={uid + "-fade"} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: align === "center" ? "center" : "flex-start", textAlign: align }}>
                <span style={{ ...labelFont, color: c, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Step {i + 1} / {N}
                </span>
                <span style={{ ...titleFont, color: theme.textColor }}>{st.title}</span>
                {st.description && <span style={{ ...bodyFont, color: theme.subColor }}>{st.description}</span>}
            </div>
        )
    }
    const idleBlock = (align: "center" | "left") => (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: align === "center" ? "center" : "flex-start", textAlign: align }}>
            <span style={{ ...titleFont, color: theme.textColor }}>{centerTitle}</span>
            {centerSubtitle && <span style={{ ...bodyFont, color: theme.subColor }}>{centerSubtitle}</span>}
        </div>
    )

    // ── 노드 한 개 ──
    const renderNode = (st: Step, i: number) => {
        const { nw, nh, pos, angles } = geo
        const p = pos[i]
        const active = shown === i
        const c = stepColor(st)
        const glow = active ? `0 10px 24px -8px ${withAlpha(c, 0.6)}` : `0 4px 14px -8px rgba(0,0,0,0.25)`
        const visBase: CSSProperties = {
            position: "absolute",
            inset: 0,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            color: active ? theme.onAccent : c,
            background: active ? c : theme.cardColor,
            border: `2px solid ${c}`,
            boxShadow: glow,
            transform: active ? "scale(1.08)" : "scale(1)",
        }
        let visual: any
        let label: any = null
        if (isCircle) {
            // 원형: 아이콘은 원 안, 제목은 원 바깥쪽(중심에서 멀어지는 방향)에 배치
            const ux = Math.sin(rad(angles[i]))
            const uy = -Math.cos(rad(angles[i]))
            const r = nw / 2
            const lx = ux * (r + 12) + ux * (LABEL_W / 2)
            const ly = uy * (r + 10) + uy * (LABEL_H / 2)
            visual = (
                <span className={uid + "-vis"} style={{ ...visBase, borderRadius: "50%", justifyContent: "center" }}>
                    <Glyph step={st} index={i} size={Math.round(nw * 0.42)} numberFontSize={Math.round(nw * 0.36)} />
                </span>
            )
            label = (
                <span
                    style={{
                        ...labelFont,
                        position: "absolute",
                        left: nw / 2 + lx - LABEL_W / 2,
                        top: nh / 2 + ly - LABEL_H / 2,
                        width: LABEL_W,
                        height: LABEL_H,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        overflow: "hidden",
                        color: active ? c : theme.textColor,
                    }}
                >
                    {st.title}
                </span>
            )
        } else {
            const chip = nodeShape === "pill" ? nh - 12 : Math.round(nh * 0.46)
            const chipStyle: CSSProperties = {
                flexShrink: 0,
                width: chip,
                height: chip,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: active ? "rgba(255,255,255,0.22)" : withAlpha(c, 0.12),
                color: active ? theme.onAccent : c,
                overflow: "hidden",
            }
            visual = (
                <span
                    className={uid + "-vis"}
                    style={{
                        ...visBase,
                        borderRadius: nodeShape === "pill" ? 999 : cardRadius,
                        gap: 10,
                        padding: nodeShape === "pill" ? "0 14px 0 5px" : "0 14px",
                    }}
                >
                    <span style={chipStyle}>
                        <Glyph step={st} index={i} size={Math.round(chip * 0.55)} numberFontSize={Math.round(chip * 0.5)} />
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, textAlign: "left" }}>
                        {nodeShape === "card" && (
                            <span style={{ ...labelFont, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>Step {i + 1}</span>
                        )}
                        <span
                            style={{
                                ...labelFont,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: nodeShape === "pill" ? "nowrap" : "normal",
                                display: nodeShape === "pill" ? "block" : "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                            }}
                        >
                            {st.title}
                        </span>
                    </span>
                </span>
            )
        }
        return (
            <button
                key={i}
                ref={(el) => {
                    btnRefs.current[i] = el
                }}
                type="button"
                className={uid + "-node"}
                aria-pressed={pinned === i}
                aria-label={`Step ${i + 1} of ${N}: ${st.title || ""}${st.description ? ". " + st.description : ""}`}
                onMouseEnter={() => startTransition(() => setHovered(i))}
                onMouseLeave={() => startTransition(() => setHovered((h) => (h === i ? null : h)))}
                onFocus={() => startTransition(() => setHovered(i))}
                onBlur={() => startTransition(() => setHovered((h) => (h === i ? null : h)))}
                onClick={() => startTransition(() => setPinned((pv) => (pv === i ? null : i)))}
                style={{
                    position: "absolute",
                    left: p.x - nw / 2,
                    top: p.y - nh / 2,
                    width: nw,
                    height: nh,
                    padding: 0,
                    margin: 0,
                    border: 0,
                    background: "none",
                    cursor: "pointer",
                    outline: "none",
                    display: "block",
                    zIndex: active ? 4 : 3,
                    font: "inherit",
                    color: "inherit",
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                {visual}
                {label}
            </button>
        )
    }

    // ── 말풍선(Tooltip) 위치: 활성 노드 근처, 위쪽 노드는 아래로 / 아래쪽 노드는 위로 ──
    let tooltip: any = null
    if (detail === "tooltip" && shown !== null) {
        const TW = 230
        const p = geo.pos[shown]
        const below = p.y < CY
        const left = Math.max(8, Math.min(DW - TW - 8, p.x - TW / 2))
        const top = below ? p.y + geo.nh / 2 + 14 : p.y - geo.nh / 2 - 14
        tooltip = (
            <div
                className={uid + "-fade"}
                style={{
                    position: "absolute",
                    left,
                    top,
                    width: TW,
                    transform: below ? "none" : "translateY(-100%)",
                    boxSizing: "border-box",
                    padding: 14,
                    borderRadius: 12,
                    background: theme.cardColor,
                    border: `1px solid ${withAlpha(stepColor(list[shown]), 0.5)}`,
                    boxShadow: "0 14px 30px -12px rgba(0,0,0,0.35)",
                    zIndex: 6,
                    pointerEvents: "none",
                }}
            >
                {detailBlock(shown, "left")}
            </div>
        )
    }

    // ── 전환 효과 (정적 렌더에서는 끔, 움직임 줄이기 설정 존중) ──
    const css = `
.${uid}-vis { transition: ${isStatic ? "none" : "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), background 0.25s ease, box-shadow 0.25s ease, color 0.25s ease"}; }
.${uid}-node:focus-visible .${uid}-vis { outline: 2px solid ${theme.textColor}; outline-offset: 3px; }
.${uid}-edge { transition: ${isStatic ? "none" : "stroke 0.25s ease, fill 0.25s ease"}; }
@keyframes ${uid}-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.${uid}-fade { animation: ${isStatic ? "none" : uid + "-in 0.3s ease both"}; }
@media (prefers-reduced-motion: reduce) { .${uid}-vis, .${uid}-edge { transition: none; } .${uid}-fade { animation: none; } }
`

    // ── 옆 패널(Side) ──
    const sidePanel = sideMode ? (
        <div
            aria-live="polite"
            style={{
                flexShrink: 0,
                width: row ? PANEL_W : "100%",
                maxWidth: row ? PANEL_W : 420,
                minHeight: 150,
                boxSizing: "border-box",
                padding: 22,
                borderRadius: cardRadius,
                background: theme.cardColor,
                border: `1px solid ${theme.ringColor}`,
                boxShadow: "0 12px 30px -18px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
            }}
        >
            {shown !== null ? detailBlock(shown, "left") : idleBlock("left")}
        </div>
    ) : null

    // 중앙: Center 모드에서 단계가 선택되면 그 설명, 아니면 제목·부제
    const centerShowsDetail = detail === "center" && shown !== null

    return (
        <div
            ref={rootRef}
            role="group"
            aria-label={centerTitle || "Cycle diagram"}
            onKeyDown={onKeyDown}
            style={{
                ...style,
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: row ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                overflow: "visible",
            }}
        >
            <style>{css}</style>

            {/* 도식: 설계 크기(680×540)로 그린 뒤 fit 배율로 축소/확대 */}
            <div style={{ position: "relative", flexShrink: 0, width: DW * fit, height: DH * fit }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: DW, height: DH, transform: `scale(${fit})`, transformOrigin: "0 0" }}>
                    {/* 링 + 화살표 호 */}
                    <svg width={DW} height={DH} viewBox={`0 0 ${DW} ${DH}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} aria-hidden="true">
                        {showRing && <circle cx={CX} cy={CY} r={geo.R} fill="none" stroke={theme.ringColor} strokeWidth={ringWidth * 4} />}
                        {showArrows &&
                            geo.edges.map((e, i) => {
                                if (!e.d) return null
                                const on = shown === i
                                const col = on ? stepColor(list[i]) : theme.arrowColor
                                return (
                                    <g key={i}>
                                        <path className={uid + "-edge"} d={e.d} fill="none" stroke={col} strokeWidth={ringWidth} strokeLinecap="round" />
                                        <polygon className={uid + "-edge"} points={e.head} fill={col} stroke={col} strokeWidth={1} strokeLinejoin="round" />
                                    </g>
                                )
                            })}
                    </svg>

                    {/* 중앙 제목·부제 / 활성 단계 설명 */}
                    <div
                        aria-live={detail === "center" ? "polite" : undefined}
                        style={{
                            position: "absolute",
                            left: CX - geo.centerW / 2,
                            top: CY,
                            width: geo.centerW,
                            transform: "translateY(-50%)",
                            display: "flex",
                            justifyContent: "center",
                            zIndex: 1,
                        }}
                    >
                        {centerShowsDetail ? detailBlock(shown as number, "center") : idleBlock("center")}
                    </div>

                    {list.map(renderNode)}
                    {tooltip}
                </div>
            </div>

            {sidePanel}
        </div>
    )
}

CycleDiagram.displayName = "12 Cycle Process Diagram"

addPropertyControls(CycleDiagram, {
    steps: {
        type: ControlType.Array,
        title: "Steps",
        maxCount: MAX_STEPS,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "New step" },
                description: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: "Describe what happens in this step." },
                icon: { type: ControlType.Enum, title: "Icon", options: ICON_OPTIONS, optionTitles: ICON_OPTIONS.map((n) => n.charAt(0).toUpperCase() + n.slice(1)), defaultValue: "number" },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#4F46E5" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
        defaultValue: SAMPLE,
    },
    centerTitle: { type: ControlType.String, title: "Center Title", defaultValue: "Brand Flywheel" },
    centerSubtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "Hover or click a step" },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Counter-clockwise"],
        defaultValue: "clockwise",
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
    },
    startAngle: { type: ControlType.Number, title: "Start Angle", defaultValue: 0, min: -180, max: 180, step: 5, unit: "°" },
    detail: {
        type: ControlType.Enum,
        title: "Details",
        options: ["center", "side", "tooltip"],
        optionTitles: ["Center", "Side", "Tooltip"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    nodeShape: {
        type: ControlType.Enum,
        title: "Node Shape",
        options: ["circle", "pill", "card"],
        optionTitles: ["Circle", "Pill", "Card"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },
    autoCycle: { type: ControlType.Boolean, title: "Auto Cycle", defaultValue: true },
    interval: { type: ControlType.Number, title: "Interval", defaultValue: 3, min: 1, max: 10, step: 0.5, unit: "s", hidden: (p: any) => !p.autoCycle },
    pauseOnHover: { type: ControlType.Boolean, title: "Pause on Hover", defaultValue: true, hidden: (p: any) => !p.autoCycle },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            nodeSize: { type: ControlType.Number, title: "Node Size", defaultValue: 64, min: 40, max: 96, step: 2, unit: "px" },
            radiusRatio: { type: ControlType.Number, title: "Radius", defaultValue: 0.95, min: 0.5, max: 1, step: 0.01 },
            ringWidth: { type: ControlType.Number, title: "Ring Width", defaultValue: 4, min: 1, max: 12, step: 0.5, unit: "px" },
            arrowGap: { type: ControlType.Number, title: "Arrow Gap", defaultValue: 8, min: 0, max: 30, step: 1, unit: "px" },
            cornerRadius: { type: ControlType.Number, title: "Card Radius", defaultValue: 16, min: 0, max: 40, step: 1, unit: "px" },
            showRing: { type: ControlType.Boolean, title: "Ring", defaultValue: true },
            showArrows: { type: ControlType.Boolean, title: "Arrows", defaultValue: true },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            accent: { type: ControlType.Color, title: "Accent", defaultValue: "#4F46E5" },
            textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            subColor: { type: ControlType.Color, title: "Sub Text", defaultValue: "#6B6B76" },
            cardColor: { type: ControlType.Color, title: "Node Fill", defaultValue: "#FFFFFF" },
            ringColor: { type: ControlType.Color, title: "Ring", defaultValue: "rgba(17, 17, 20, 0.05)" },
            arrowColor: { type: ControlType.Color, title: "Arrows", defaultValue: "rgba(17, 17, 20, 0.28)" },
            onAccent: { type: ControlType.Color, title: "On Active", defaultValue: "#FFFFFF" },
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "22px", variant: "Bold", lineHeight: "1.2em", letterSpacing: "-0.02em" },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "13px", variant: "Semibold", lineHeight: "1.25em" },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Regular", lineHeight: "1.5em" },
        description: "Created by BrandingUp",
    },
})
