// [생성일] 2026-10-09
// [경위] 사장님 지시 다이어그램 10종 동시 제작 — 11번 Business Model Canvas (비즈니스 모델 캔버스 + 린 캔버스 전환)
// [변경이력]
//   - 2026-10-09: 최초 생성 (9블록 정비율 그리드 + Lean Canvas 전환 + 호버 강조 + 클릭 확대(Focus) + 좁은 화면 세로 스택 + 3색 그룹 + 항목 불릿 + 내장 아이콘/커스텀 아이콘)
//   - 2026-10-09: 프레이머 심사 선택 개선 반영 — containerType 을 any 대신 CSSProperties 확장 타입으로

import { useEffect, useId, useRef, useState, startTransition } from "react"
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// 컨테이너 쿼리용 CSS 속성: React 타입 정의에 아직 없어 확장해서 쓴다 (심사 제안)
type ContainerStyle = CSSProperties & { containerType?: "normal" | "size" | "inline-size" }

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
interface BlockData {
    title?: string
    items?: string[]
    icon?: { src?: string; srcSet?: string; alt?: string }
}

type Slot = "a" | "b1" | "b2" | "c" | "d1" | "d2" | "e" | "f" | "g"
type Group = "infra" | "value" | "customer"

interface FocusState {
    slot: Slot
    kind: "zoom" | "spot" // zoom = 넓은 화면에서 블록이 캔버스 전체로 확대, spot = 좁은 화면에서 해당 블록만 강조
    from: { l: number; t: number; w: number; h: number } | null // 확대 시작 위치(없으면 애니메이션 없이 바로 표시)
    closing?: boolean
}

interface CanvasProps {
    mode?: "business" | "lean"
    partners?: BlockData
    activities?: BlockData
    resources?: BlockData
    relationships?: BlockData
    problem?: BlockData
    solution?: BlockData
    metrics?: BlockData
    unfair?: BlockData
    value?: BlockData
    channels?: BlockData
    segments?: BlockData
    cost?: BlockData
    revenue?: BlockData
    initialFocus?: "none" | Slot
    hoverHighlight?: boolean
    clickToFocus?: boolean
    bullet?: "dot" | "dash" | "number" | "check" | "none"
    showIcons?: boolean
    infraColor?: string
    valueColor?: string
    customerColor?: string
    tint?: number
    stackBelow?: number
    gap?: number
    radius?: number
    padding?: number
    outerPadding?: number
    background?: string
    textColor?: string
    borderColor?: string
    titleFont?: any
    itemFont?: any
    style?: CSSProperties
}

// ─────────────────────────────────────────────
// 고정 데이터: 블록 위치(슬롯) ↔ 블록 종류 매핑
// 캔버스는 항상 같은 9칸 그리드. 모드에 따라 4칸(a, b1, b2, d1)의 라벨·내용만 바뀐다.
// ─────────────────────────────────────────────
const SLOTS: Slot[] = ["a", "b1", "b2", "c", "d1", "d2", "e", "f", "g"] // DOM 순서 = 모바일 세로 스택 순서

const SLOT_ID: Record<"business" | "lean", Record<Slot, string>> = {
    business: { a: "partners", b1: "activities", b2: "resources", c: "value", d1: "relationships", d2: "channels", e: "segments", f: "cost", g: "revenue" },
    lean: { a: "problem", b1: "solution", b2: "metrics", c: "value", d1: "unfair", d2: "channels", e: "segments", f: "cost", g: "revenue" },
}

// 슬롯 위치 기준 3색 그룹: 왼쪽·하단-왼쪽 = 인프라 / 가운데 = 가치 / 오른쪽·하단-오른쪽 = 고객
const SLOT_GROUP: Record<Slot, Group> = { a: "infra", b1: "infra", b2: "infra", f: "infra", c: "value", d1: "customer", d2: "customer", e: "customer", g: "customer" }

// 모드별 기본 제목 (속성의 Title 이 비어 있으면 이 값을 쓴다)
const LABELS: Record<"business" | "lean", Record<string, string>> = {
    business: {
        partners: "Key Partners", activities: "Key Activities", resources: "Key Resources", value: "Value Propositions",
        relationships: "Customer Relationships", channels: "Channels", segments: "Customer Segments", cost: "Cost Structure", revenue: "Revenue Streams",
    },
    lean: {
        problem: "Problem", solution: "Solution", metrics: "Key Metrics", value: "Unique Value Proposition",
        unfair: "Unfair Advantage", channels: "Channels", segments: "Customer Segments", cost: "Cost Structure", revenue: "Revenue Streams",
    },
}

// 설치 직후 보이는 샘플 (구독형 커피 브랜드)
const SAMPLE: Record<string, string[]> = {
    partners: ["Specialty farms & co-ops", "Ethical roasting partner", "Packaging & courier suppliers", "Payment processor"],
    activities: ["Small-batch sourcing & roasting", "Subscription & fulfilment ops", "Community & brew content", "Weekly quality cupping"],
    resources: ["Roasting equipment", "Brand & recipe IP", "Subscriber data platform", "Direct farm relationships"],
    relationships: ["Self-serve account & taste quiz", "Monthly brew guides by email", "Private subscriber community", "Roaster-led chat support"],
    problem: ["Supermarket coffee is stale once opened", "Specialty beans are hard to choose", "Reordering is a chore", "Alternatives: big-chain plans, local roasters"],
    solution: ["Roasted to order, shipped in 48h", "Taste quiz picks your beans", "One-tap pause, skip or swap"],
    metrics: ["Monthly churn", "Subscribers & MRR", "Quiz-to-subscription rate", "Net promoter score"],
    unfair: ["Direct farm contracts", "Proprietary taste-matching data", "Founder is a certified Q-grader"],
    value: ["Fresh-roasted beans at your door every 2 weeks", "Pause, skip or swap anytime", "Traceable, fair-trade sourcing", "A taste profile that learns your palate"],
    channels: ["Website & mobile app", "Instagram & newsletter", "Gift subscriptions", "Office & café partnerships"],
    segments: ["Home brewers (25–40)", "Remote workers & small offices", "Gift buyers", "Coffee-curious beginners"],
    cost: ["Green coffee & packaging", "Roasting & fulfilment labor", "Shipping & returns", "Paid acquisition & software"],
    revenue: ["Monthly subscriptions ($18–$34)", "One-off bags & gift cards", "Brewing gear add-ons", "Office plans (B2B)"],
}

// 내장 아이콘 (24×24 선 아이콘 경로). 블록 종류별 1개
const ICONS: Record<string, string[]> = {
    partners: ["M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5", "M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"],
    activities: ["M13 2 3 14h9l-1 8 10-12h-9l1-8z"],
    resources: ["M21 8 12 3 3 8v8l9 5 9-5V8z", "M3 8l9 5 9-5", "M12 13v8"],
    value: ["M6 3h12l4 6-10 12L2 9l4-6z", "M2 9h20"],
    relationships: ["M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"],
    channels: ["M22 2 11 13", "M22 2l-7 20-4-9-9-4 20-7z"],
    segments: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    cost: ["M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z", "M7 7h.01"],
    revenue: ["M12 1v22", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
    problem: ["M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
    solution: ["M22 11.08V12a10 10 0 1 1-5.93-9.14", "M22 4 12 14.01l-3-3"],
    metrics: ["M12 20V10", "M18 20V4", "M6 20v-4"],
    unfair: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
}

// 색상에 투명도를 입혀 rgba 로 변환. 프레이머는 Color 컨트롤 값을 rgb()/rgba() 로 넘기므로 둘 다 처리 (HEX 전용 아님)
function withAlpha(color: string, alpha: number) {
    const rgb = typeof color === "string" ? color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i) : null
    if (rgb) return "rgba(" + rgb[1] + ", " + rgb[2] + ", " + rgb[3] + ", " + alpha + ")"
    if (typeof color === "string" && color.charAt(0) === "#") {
        let h = color.slice(1)
        if (h.length === 3) h = h.split("").map((c) => c + c).join("")
        const r = parseInt(h.slice(0, 2), 16)
        const g = parseInt(h.slice(2, 4), 16)
        const b = parseInt(h.slice(4, 6), 16)
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")"
    }
    return color
}

// 블록 데이터 정리: 비어 있는 제목은 모드별 기본 제목, 항목이 없으면(undefined) 샘플 사용
function resolveBlock(mode: "business" | "lean", id: string, data?: BlockData) {
    const title = (data?.title || "").trim() || LABELS[mode][id]
    const raw = data && Array.isArray(data.items) ? data.items : SAMPLE[id]
    const items = raw.filter((t) => typeof t === "string" && t.trim() !== "")
    return { id, title, items, icon: data?.icon }
}

// ─────────────────────────────────────────────
// 블록 안쪽(아이콘 + 제목 + 항목 목록). 일반 칸과 확대 화면에서 같이 쓴다
// ─────────────────────────────────────────────
function BlockBody(p: {
    block: { id: string; title: string; items: string[]; icon?: BlockData["icon"] }
    accent: string
    bullet: string
    showIcons: boolean
    titleFont: any
    itemFont: any
    big?: boolean
    twoCols?: boolean
    hint?: boolean
    prefix: string
}) {
    const { block, accent, bullet, showIcons, titleFont, itemFont, big, twoCols, hint, prefix } = p
    const chip = big ? 34 : 26
    const paths = ICONS[block.id] || []
    return (
        <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: big ? 18 : 10, flex: "none" }}>
                {showIcons && (
                    <span
                        aria-hidden="true"
                        style={{
                            width: chip, height: chip, flex: "none", borderRadius: Math.round(chip / 3),
                            background: withAlpha(accent, 0.16), display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        {block.icon && block.icon.src ? (
                            <img src={block.icon.src} srcSet={block.icon.srcSet} alt="" style={{ width: chip * 0.64, height: chip * 0.64, objectFit: "contain", display: "block" }} />
                        ) : (
                            <svg width={chip * 0.62} height={chip * 0.62} viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                {paths.map((d, i) => <path key={i} d={d} />)}
                            </svg>
                        )}
                    </span>
                )}
                <h3 style={{ margin: 0, ...titleFont, color: "inherit", flex: 1, minWidth: 0 }}>{block.title}</h3>
                {hint && (
                    <svg className={prefix + "h"} aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
                        <path d="M15 3h6v6" />
                        <path d="M9 21H3v-6" />
                        <path d="M21 3l-7 7" />
                        <path d="M3 21l7-7" />
                    </svg>
                )}
            </div>
            <ul
                className={twoCols ? prefix + "cols" : undefined}
                style={{
                    margin: 0, padding: 0, listStyle: "none", ...itemFont, color: "inherit",
                    ...(big ? { columnWidth: 240, columnGap: 28 } : {}),
                }}
            >
                {block.items.map((t, i) => (
                    <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "0 0 " + (big ? 12 : 6) + "px", breakInside: "avoid" }}>
                        {bullet !== "none" && (
                            bullet === "dot" ? (
                                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flex: "none", marginTop: "0.55em" }} />
                            ) : (
                                <span aria-hidden="true" style={{ color: accent, flex: "none", minWidth: bullet === "number" ? "1.4em" : "0.9em", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                                    {bullet === "dash" ? "–" : bullet === "check" ? "✓" : i + 1 + "."}
                                </span>
                            )
                        )}
                        <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{t}</span>
                    </li>
                ))}
            </ul>
        </>
    )
}

/**
 * 비즈니스 모델 캔버스 (Business Model Canvas) — 표준 9블록 + 린 캔버스 전환
 * 호버 강조, 클릭 시 블록 확대(Focus), 좁은 화면에서는 순서를 유지한 세로 스택
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function BusinessModelCanvas(props: CanvasProps) {
    const {
        mode = "business",
        initialFocus = "none",
        hoverHighlight = true,
        clickToFocus = true,
        bullet = "dot",
        showIcons = true,
        infraColor = "#4F6EF7",
        valueColor = "#0FA37F",
        customerColor = "#E8890C",
        tint = 10,
        stackBelow = 640,
        gap = 10,
        radius = 14,
        padding = 16,
        outerPadding = 12,
        background = "#FFFFFF",
        textColor = "#16161A",
        borderColor = "rgba(22, 22, 26, 0.10)",
        titleFont,
        itemFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer() // 캔버스·정적 렌더에서는 확대 애니메이션 없이 바로 표시
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const P = "bmc" + uid // 이 컴포넌트 전용 CSS 클래스 접두어 (여러 개 올려도 충돌 방지)

    const outerRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const blockRefs = useRef<Record<string, HTMLElement | null>>({})

    const [focus, setFocus] = useState<FocusState | null>(
        initialFocus !== "none" ? { slot: initialFocus as Slot, kind: "zoom", from: null } : null
    )

    // "Initial Focus" 속성이 바뀌면 그 블록을 확대한 상태로 (작업 중 미리보기·썸네일용)
    useEffect(() => {
        startTransition(() => {
            setFocus(initialFocus !== "none" ? { slot: initialFocus as Slot, kind: "zoom", from: null } : null)
        })
    }, [initialFocus])

    // 확대 화면이 열리면 닫기 버튼으로 키보드 포커스 이동
    useEffect(() => {
        if (focus && focus.kind === "zoom" && !focus.closing && focus.from) closeRef.current?.focus({ preventScroll: true })
    }, [focus])

    // 닫는 애니메이션이 끝나면(0.3초) 상태를 비우고 키보드 포커스를 원래 블록으로 돌려준다
    useEffect(() => {
        if (!focus || !focus.closing) return
        const slot = focus.slot
        const timer = setTimeout(() => {
            startTransition(() => setFocus(null))
            blockRefs.current[slot]?.focus({ preventScroll: true })
        }, 300)
        return () => clearTimeout(timer)
    }, [focus])

    // 현재 모드의 블록 9개를 슬롯 순서대로 정리
    const m: "business" | "lean" = mode === "lean" ? "lean" : "business"
    const ids = SLOT_ID[m]
    const accents: Record<Group, string> = { infra: infraColor, value: valueColor, customer: customerColor }
    const blocks = SLOTS.map((slot) => {
        const id = ids[slot]
        return { slot, accent: accents[SLOT_GROUP[slot]], ...resolveBlock(m, id, (props as any)[id]) }
    })

    // 블록 클릭: 넓은 화면 = 클릭한 칸에서 캔버스 전체로 확대 / 좁은 화면(스택) = 해당 블록만 강조
    const openBlock = (slot: Slot, el: HTMLElement) => {
        if (!clickToFocus || (focus && focus.kind === "zoom")) return
        if (focus && focus.kind === "spot" && focus.slot === slot) {
            startTransition(() => setFocus(null))
            return
        }
        const root = outerRef.current
        if (!root) return
        if (root.clientWidth <= stackBelow) {
            startTransition(() => setFocus({ slot, kind: "spot", from: null }))
            return
        }
        const rr = root.getBoundingClientRect()
        const br = el.getBoundingClientRect()
        startTransition(() => setFocus({ slot, kind: "zoom", from: { l: br.left - rr.left, t: br.top - rr.top, w: br.width, h: br.height } }))
    }

    // 확대 화면 닫기 (애니메이션 정보가 없으면 바로, 있으면 닫는 애니메이션 후)
    const closeFocus = () => {
        if (!focus) return
        if (focus.kind === "zoom" && focus.from && !isStatic) {
            if (!focus.closing) startTransition(() => setFocus({ ...focus, closing: true }))
        } else {
            const slot = focus.slot
            startTransition(() => setFocus(null))
            blockRefs.current[slot]?.focus({ preventScroll: true })
        }
    }

    const onRootKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape" && focus) closeFocus()
    }

    const zoomed = focus && focus.kind === "zoom" ? blocks.find((b) => b.slot === focus.slot) : undefined

    // ── 전용 CSS: 그리드 배치, 좁은 화면 스택(컨테이너 쿼리), 호버 강조, 확대 애니메이션 ──
    const css = `
.${P}g{display:grid;gap:${gap}px;width:100%;height:100%;grid-template-columns:repeat(10,minmax(0,1fr));grid-template-rows:minmax(0,1fr) minmax(0,1fr) minmax(0,.7fr);grid-template-areas:"a a b1 b1 c c d1 d1 e e" "a a b2 b2 c c d2 d2 e e" "f f f f f g g g g g"}
.${P}b{position:relative;box-sizing:border-box;min-width:0;min-height:0;overflow:hidden;display:flex;flex-direction:column;padding:${padding}px;border-radius:${radius}px;background:var(--bg);border:1px solid var(--bd);color:inherit;text-align:left;outline:none;transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease,background-color .18s ease,border-color .18s ease}
.${P}b[data-click="1"]{cursor:pointer}
.${P}b:focus-visible{box-shadow:0 0 0 2px var(--acc)}
.${P}c{flex:1;min-height:0;overflow:hidden;-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 18px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 18px),transparent)}
.${P}cols{column-count:2;column-gap:24px}
.${P}h{opacity:0;transition:opacity .18s ease;color:var(--acc)}
.${P}b:hover .${P}h,.${P}b:focus-visible .${P}h{opacity:.9}
@media (hover:hover){
.${P}hl .${P}b:hover{transform:translateY(-2px);background:var(--bgh);border-color:var(--acc);box-shadow:0 10px 26px rgba(0,0,0,.09)}
.${P}hl:has(.${P}b:hover) .${P}b:not(:hover){opacity:.5}
}
.${P}hl:has(.${P}b:focus-visible) .${P}b:not(:focus-visible){opacity:.6}
.${P}sp .${P}b{opacity:.42}
.${P}sp .${P}b[data-on="1"]{opacity:1;border-color:var(--acc);background:var(--bgh);box-shadow:0 10px 26px rgba(0,0,0,.09)}
.${P}ov{position:absolute;left:0;top:0;width:100%;height:100%;box-sizing:border-box;overflow:auto;cursor:zoom-out;z-index:2}
.${P}in{animation:${P}zi .3s cubic-bezier(.2,.8,.2,1) both}
.${P}out{animation:${P}zo .3s cubic-bezier(.4,0,.2,1) both}
.${P}fd{animation:${P}fade .24s ease .1s both}
@keyframes ${P}zi{from{left:var(--fl);top:var(--ft);width:var(--fw);height:var(--fh);opacity:.7}to{left:0;top:0;width:100%;height:100%;opacity:1}}
@keyframes ${P}zo{from{left:0;top:0;width:100%;height:100%;opacity:1}to{left:var(--fl);top:var(--ft);width:var(--fw);height:var(--fh);opacity:.7}}
@keyframes ${P}fade{from{opacity:0}to{opacity:1}}
@container (max-width:${stackBelow}px){
.${P}i{overflow-y:auto}
.${P}g{display:flex;flex-direction:column;height:auto}
.${P}b{grid-area:auto!important;flex:none}
.${P}c{overflow:visible;-webkit-mask-image:none;mask-image:none}
.${P}cols{column-count:1}
}
@media (prefers-reduced-motion:reduce){.${P}b,.${P}h{transition:none}.${P}in,.${P}out,.${P}fd{animation:none}}
`

    return (
        <div
            ref={outerRef}
            onKeyDown={onRootKey}
            style={{
                width: "100%",
                height: "100%",
                ...style,
                position: "relative",
                // 2026-10-09: 심사 제안 반영 — any 없이 containerType 을 지원하는 확장 타입으로 지정
                containerType: "inline-size",
                minWidth: 240,
                color: textColor,
            } as ContainerStyle}
        >
            <style>{css}</style>
            <div
                className={P + "i"}
                style={{
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    padding: outerPadding,
                    background,
                    border: "1px solid " + borderColor,
                    borderRadius: radius + Math.round(outerPadding / 2),
                    overflow: "hidden",
                }}
            >
                <div
                    role="group"
                    aria-label={m === "lean" ? "Lean Canvas" : "Business Model Canvas"}
                    className={[P + "g", hoverHighlight ? P + "hl" : "", focus && focus.kind === "spot" ? P + "sp" : ""].join(" ")}
                >
                    {blocks.map((b) => {
                        const vars = {
                            "--acc": b.accent,
                            "--bg": withAlpha(b.accent, tint / 100),
                            "--bgh": withAlpha(b.accent, Math.min(0.5, (tint / 100) * 2 + 0.04)),
                            "--bd": withAlpha(b.accent, 0.32),
                        } as CSSProperties
                        const label = b.title + (b.items.length ? ": " + b.items.join(", ") : "")
                        const interactive = clickToFocus
                        return (
                            <div
                                key={b.slot}
                                ref={(el) => { blockRefs.current[b.slot] = el }}
                                className={P + "b"}
                                data-click={interactive ? "1" : "0"}
                                data-on={focus && focus.kind === "spot" && focus.slot === b.slot ? "1" : "0"}
                                role={interactive ? "button" : "group"}
                                aria-label={label}
                                aria-expanded={interactive ? !!focus && focus.slot === b.slot : undefined}
                                tabIndex={interactive && !zoomed ? 0 : undefined}
                                onClick={interactive ? (e: MouseEvent<HTMLDivElement>) => openBlock(b.slot, e.currentTarget) : undefined}
                                onKeyDown={
                                    interactive
                                        ? (e: KeyboardEvent<HTMLDivElement>) => {
                                              if (e.key === "Enter" || e.key === " ") {
                                                  e.preventDefault()
                                                  openBlock(b.slot, e.currentTarget)
                                              }
                                          }
                                        : undefined
                                }
                                style={{ ...vars, gridArea: b.slot }}
                            >
                                <div className={P + "c"} style={{ display: "flex", flexDirection: "column" }}>
                                    <BlockBody
                                        block={b}
                                        accent={b.accent}
                                        bullet={bullet}
                                        showIcons={showIcons}
                                        titleFont={titleFont}
                                        itemFont={itemFont}
                                        twoCols={b.slot === "f" || b.slot === "g"}
                                        hint={interactive}
                                        prefix={P}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 확대(Focus) 화면: 클릭한 블록이 캔버스 전체로 커진다. Esc·바깥 클릭·닫기 버튼으로 복귀 */}
            {zoomed && focus && (
                <div
                    role="dialog"
                    aria-label={zoomed.title}
                    onClick={closeFocus}
                    className={P + "ov" + (focus.from && !isStatic ? " " + P + (focus.closing ? "out" : "in") : "")}
                    style={
                        {
                            "--acc": zoomed.accent,
                            "--bg": withAlpha(zoomed.accent, Math.max(tint / 100, 0.08)),
                            "--fl": (focus.from ? focus.from.l : 0) + "px",
                            "--ft": (focus.from ? focus.from.t : 0) + "px",
                            "--fw": (focus.from ? focus.from.w : 0) + "px",
                            "--fh": (focus.from ? focus.from.h : 0) + "px",
                            padding: padding * 1.6,
                            borderRadius: radius + Math.round(outerPadding / 2),
                            background: "linear-gradient(var(--bg),var(--bg))," + background,
                            border: "1px solid " + withAlpha(zoomed.accent, 0.5),
                            color: textColor,
                        } as CSSProperties
                    }
                >
                    <div className={focus.from && !isStatic ? P + "fd" : undefined}>
                        <BlockBody
                            block={zoomed}
                            accent={zoomed.accent}
                            bullet={bullet}
                            showIcons={showIcons}
                            titleFont={titleFont}
                            itemFont={itemFont}
                            big
                            prefix={P}
                        />
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        aria-label="Close"
                        onClick={(e) => {
                            e.stopPropagation()
                            closeFocus()
                        }}
                        style={{
                            position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", border: "none",
                            background: withAlpha(zoomed.accent, 0.18), color: zoomed.accent, cursor: "pointer",
                            display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0,
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
                            <path d="M18 6 6 18" />
                            <path d="M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// 속성 컨트롤
// ─────────────────────────────────────────────
// 블록 1개의 편집 칸 (제목 / 항목 목록 / 커스텀 아이콘). 모드에 맞지 않는 블록은 숨긴다
function blockControl(title: string, id: string, hidden?: (p: any) => boolean): any {
    return {
        type: ControlType.Object,
        title,
        hidden,
        controls: {
            title: { type: ControlType.String, title: "Title", defaultValue: "", placeholder: title },
            items: {
                type: ControlType.Array,
                title: "Items",
                control: { type: ControlType.String, placeholder: "Add an item…" },
                defaultValue: SAMPLE[id],
            },
            icon: { type: ControlType.ResponsiveImage, title: "Custom Icon" },
        },
        defaultValue: { title: "", items: SAMPLE[id] },
    }
}

const onlyBusiness = (p: any) => p.mode === "lean"
const onlyLean = (p: any) => p.mode !== "lean"

addPropertyControls(BusinessModelCanvas, {
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["business", "lean"],
        optionTitles: ["Business Model", "Lean Canvas"],
        defaultValue: "business",
        displaySegmentedControl: true,
    },
    // 비즈니스 모델 전용 4블록
    partners: blockControl("Key Partners", "partners", onlyBusiness),
    activities: blockControl("Key Activities", "activities", onlyBusiness),
    resources: blockControl("Key Resources", "resources", onlyBusiness),
    relationships: blockControl("Customer Relationships", "relationships", onlyBusiness),
    // 린 캔버스 전용 4블록
    problem: blockControl("Problem", "problem", onlyLean),
    solution: blockControl("Solution", "solution", onlyLean),
    metrics: blockControl("Key Metrics", "metrics", onlyLean),
    unfair: blockControl("Unfair Advantage", "unfair", onlyLean),
    // 두 모드 공통 5블록
    value: blockControl("Value Proposition", "value"),
    channels: blockControl("Channels", "channels"),
    segments: blockControl("Customer Segments", "segments"),
    cost: blockControl("Cost Structure", "cost"),
    revenue: blockControl("Revenue Streams", "revenue"),
    initialFocus: {
        type: ControlType.Enum,
        title: "Initial Focus",
        options: ["none", "a", "b1", "b2", "c", "d1", "d2", "e", "f", "g"],
        optionTitles: [
            "None", "Key Partners / Problem", "Key Activities / Solution", "Key Resources / Key Metrics", "Value Propositions",
            "Customer Relationships / Unfair Adv.", "Channels", "Customer Segments", "Cost Structure", "Revenue Streams",
        ],
        defaultValue: "none",
        description: "Open with one block already expanded. Handy for previews.",
    },
    clickToFocus: {
        type: ControlType.Boolean,
        title: "Click to Focus",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverHighlight: {
        type: ControlType.Boolean,
        title: "Hover Highlight",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    bullet: {
        type: ControlType.Enum,
        title: "Bullets",
        options: ["dot", "dash", "number", "check", "none"],
        optionTitles: ["Dot", "Dash", "Number", "Check", "None"],
        defaultValue: "dot",
    },
    showIcons: {
        type: ControlType.Boolean,
        title: "Icons",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    infraColor: { type: ControlType.Color, title: "Infrastructure", defaultValue: "#4F6EF7" },
    valueColor: { type: ControlType.Color, title: "Value", defaultValue: "#0FA37F" },
    customerColor: { type: ControlType.Color, title: "Customer", defaultValue: "#E8890C" },
    tint: { type: ControlType.Number, title: "Block Tint", defaultValue: 10, min: 0, max: 30, step: 1, unit: "%" },
    stackBelow: {
        type: ControlType.Number,
        title: "Stack Below",
        defaultValue: 640,
        min: 320,
        max: 1200,
        step: 10,
        unit: "px",
        description: "Width at which the canvas becomes a single column (order is kept).",
    },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 10, min: 0, max: 40, step: 1, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 14, min: 0, max: 40, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Block Padding", defaultValue: 16, min: 6, max: 40, step: 1, unit: "px" },
    outerPadding: { type: ControlType.Number, title: "Outer Padding", defaultValue: 12, min: 0, max: 48, step: 1, unit: "px" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#16161A" },
    borderColor: { type: ControlType.Color, title: "Border", defaultValue: "rgba(22, 22, 26, 0.10)" },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Semibold", lineHeight: "1.3em", letterSpacing: "-0.01em" },
    },
    itemFont: {
        type: ControlType.Font,
        title: "Item Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "13px", variant: "Regular", lineHeight: "1.4em" },
        description: "Created by BrandingUp",
    },
})
