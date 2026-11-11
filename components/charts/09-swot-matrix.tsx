// [생성일] 2026-10-09
// [경위] 사장님 지시 다이어그램 10종 동시 제작 — 09번: SWOT 매트릭스 (호버 강조·클릭 확대·TOWS 전환)
// [변경이력]
//   - 2026-10-09: 최초 생성 (4사분면 + 외부 축 라벨 + 호버 흐림 + 클릭 확대 + Grid/Stacked/Cross + TOWS 전환 + 번호/불릿 + 색 톤 다운)
//   - 2026-10-09: 프레이머 심사 선택 개선 반영 — 클릭 카드를 실제 button 요소로
//   - 2026-10-09: grid·tows 모드 카드 오른쪽·아래 테두리 사라지는 버그 수정

import { useEffect, useRef, useState, startTransition } from "react"
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
interface QuadData {
    title?: string
    items?: string[]
    icon?: { src?: string; srcSet?: string; alt?: string }
}

interface TowsData {
    soTitle?: string
    soItems?: string[]
    woTitle?: string
    woItems?: string[]
    stTitle?: string
    stItems?: string[]
    wtTitle?: string
    wtItems?: string[]
}

interface AxisData {
    internal?: string
    external?: string
    helpful?: string
    harmful?: string
}

interface SwotMatrixProps {
    mode?: "swot" | "tows"
    modeSwitch?: boolean
    layout?: "grid" | "cross" | "stacked"
    autoStack?: boolean
    stackBelow?: number
    axisLabels?: boolean
    hoverFocus?: boolean
    clickExpand?: boolean
    numbering?: "padded" | "number" | "bullet" | "dash" | "none"
    icons?: "symbol" | "letter" | "none"
    strengths?: QuadData
    weaknesses?: QuadData
    opportunities?: QuadData
    threats?: QuadData
    tows?: TowsData
    axis?: AxisData
    strengthsColor?: string
    weaknessesColor?: string
    opportunitiesColor?: string
    threatsColor?: string
    tint?: number
    background?: string
    textColor?: string
    subColor?: string
    gap?: number
    radius?: number
    padding?: number
    titleFont?: any
    itemFont?: any
    labelFont?: any
    style?: CSSProperties
}

// ─────────────────────────────────────────────
// 샘플 (카페 브랜드 SWOT — 설치 즉시 완성돼 보이는 기본 내용)
// ─────────────────────────────────────────────
const S_ITEMS = [
    "Single-origin beans roasted in-house",
    "Loyal regulars across three neighborhoods",
    "Warm, photogenic interior people tag online",
    "Seasonal menu that sells out by noon",
]
const W_ITEMS = [
    "Small team and limited opening hours",
    "Prices sit above the big chains",
    "No online ordering or delivery yet",
]
const O_ITEMS = [
    "Office workers returning to the area",
    "Subscription coffee boxes for home brewers",
    "Pop-up collabs with local bakeries",
]
const T_ITEMS = [
    "A national chain opening next door",
    "Rising green coffee bean costs",
    "Rent increase at lease renewal",
]
const SO_ITEMS = [
    "Launch a subscription box built on the in-house roast",
    "Host bakery pop-ups inside the photogenic space",
]
const WO_ITEMS = [
    "Add online ordering to catch the returning office crowd",
    "Extend weekday hours with part-time hires",
]
const ST_ITEMS = [
    "Reward loyal regulars with a members-only perk program",
    "Lock in bean prices with a single-origin partner",
]
const WT_ITEMS = [
    "Negotiate the lease early, before the chain expands",
    "Keep the menu short to protect margins as costs rise",
]

// 사분면 고정 정보 (위치 순서: 왼쪽 위 · 오른쪽 위 · 왼쪽 아래 · 오른쪽 아래)
const CODES = ["S", "W", "O", "T"]
// 위치별 축 이름 (행: Internal/External, 열: Helpful/Harmful)
const TAGS: string[][] = [
    ["internal", "helpful"],
    ["internal", "harmful"],
    ["external", "helpful"],
    ["external", "harmful"],
]
// TOWS 위치별 조합 (열 = S/W, 행 = O/T → SO · WO · ST · WT)
const TOWS_MIX = [
    [0, 2],
    [1, 2],
    [0, 3],
    [1, 3],
]
const TOWS_CODES = ["SO", "WO", "ST", "WT"]

// ─────────────────────────────────────────────
// 색 도우미 — 프레이머는 Color 를 rgb()/rgba() 로 넘기므로 둘 다 처리 (HEX 전용 아님)
// ─────────────────────────────────────────────
function parseColor(color: string): number[] | null {
    if (typeof color !== "string") return null
    const m = color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?/i)
    if (m) {
        let a = 1
        if (m[4] !== undefined) a = m[4].indexOf("%") > -1 ? parseFloat(m[4]) / 100 : parseFloat(m[4])
        return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), a]
    }
    if (color.charAt(0) === "#") {
        let h = color.slice(1)
        if (h.length === 3) h = h.split("").map((c) => c + c).join("")
        if (h.length >= 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]
    }
    return null
}

// 색에 투명도를 입힌다 (톤 다운 배경 생성에 사용)
function withAlpha(color: string, alpha: number) {
    const c = parseColor(color)
    if (!c) return color
    return "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + alpha * c[3] + ")"
}

// 두 색의 평균 (TOWS 조합 색: S×O 등)
function mixColors(a: string, b: string) {
    const x = parseColor(a)
    const y = parseColor(b)
    if (!x || !y) return a
    return "rgb(" + Math.round((x[0] + y[0]) / 2) + ", " + Math.round((x[1] + y[1]) / 2) + ", " + Math.round((x[2] + y[2]) / 2) + ")"
}

// 문자열 배열 정리 (빈 줄 제거, 값이 없으면 샘플)
function clean(list: any, fallback: string[]): string[] {
    if (!Array.isArray(list)) return fallback
    return list.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean)
}

// ─────────────────────────────────────────────
// 작은 SVG 아이콘 (S + / W − / O ↗ / T ⚠)
// ─────────────────────────────────────────────
function Glyph({ index }: { index: number }) {
    const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
    return (
        <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden focusable="false" style={{ display: "block" }}>
            {index === 0 && <path d="M8 3v10M3 8h10" {...common} />}
            {index === 1 && <path d="M3 8h10" {...common} />}
            {index === 2 && <path d="M4.5 11.5L11.5 4.5M6 4.5h5.5V10" {...common} />}
            {index === 3 && (
                <g {...common}>
                    <path d="M8 2.6L14 13H2z" />
                    <path d="M8 6.6v3M8 11.4v.1" />
                </g>
            )}
        </svg>
    )
}

// 확대/축소 안내 아이콘
function ExpandGlyph({ open }: { open: boolean }) {
    const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
    return (
        <svg width={14} height={14} viewBox="0 0 16 16" aria-hidden focusable="false" style={{ display: "block" }}>
            {open ? <path d="M6 2v4H2M10 14v-4h4" {...p} /> : <path d="M2 6V2h4M14 10v4h-4" {...p} />}
        </svg>
    )
}

// 한 번만 재생되는 전환(반복 아님) + 키보드 포커스 링 + 모션 줄이기
const CSS = `
@keyframes bu-swot-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.bu-swot-in{animation:bu-swot-in 320ms cubic-bezier(.2,.8,.2,1) both}
.bu-swot-card:focus{outline:none}
.bu-swot-card:focus-visible{outline:2px solid var(--bu-ring);outline-offset:2px}
.bu-swot-scroll{scrollbar-width:thin}
@media (prefers-reduced-motion:reduce){.bu-swot *{transition:none!important;animation:none!important}}
`

/**
 * SWOT 매트릭스 (SWOT Matrix) — 호버 강조·클릭 확대·TOWS 전환이 되는 2×2 전략 분석표
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 640
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function SwotMatrix(props: SwotMatrixProps) {
    const {
        mode = "swot",
        modeSwitch = true,
        layout = "grid",
        autoStack = true,
        stackBelow = 560,
        axisLabels = true,
        hoverFocus = true,
        clickExpand = true,
        numbering = "padded",
        icons = "symbol",
        strengths,
        weaknesses,
        opportunities,
        threats,
        tows,
        axis,
        strengthsColor = "#12B981",
        weaknessesColor = "#F59E0B",
        opportunitiesColor = "#3B82F6",
        threatsColor = "#EF4444",
        tint = 12,
        background = "#FFFFFF",
        textColor = "#111114",
        subColor = "#6B6B76",
        gap = 14,
        radius = 20,
        padding = 22,
        titleFont,
        itemFont,
        labelFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer() // 캔버스·정적 렌더에서는 전환 효과 없이 완성 상태
    const rootRef = useRef<HTMLDivElement>(null)

    // ── 상태: TOWS 전환 / 호버 / 확대(focus) / 가로폭 ──
    const [towsOn, setTowsOn] = useState(mode === "tows")
    useEffect(() => {
        setTowsOn(mode === "tows")
    }, [mode])
    const [hover, setHover] = useState(-1)
    const [focus, setFocus] = useState(-1)
    const [width, setWidth] = useState(0)

    // 가로폭 측정 → 좁으면 자동으로 한 줄(Stacked) 배치
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const w = Math.round(entries[0].contentRect.width)
            startTransition(() => setWidth(w))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const stacked = layout === "stacked" || (autoStack && width > 0 && width < stackBelow)
    const cross = layout === "cross" && !stacked

    // ── 데이터 조립 ──
    const colors = [strengthsColor, weaknessesColor, opportunitiesColor, threatsColor]
    const swotSrc = [strengths, weaknesses, opportunities, threats]
    const swotTitles = ["Strengths", "Weaknesses", "Opportunities", "Threats"]
    const swotDefaults = [S_ITEMS, W_ITEMS, O_ITEMS, T_ITEMS]
    const nameOf = (k: number) => swotSrc[k]?.title || swotTitles[k]
    const towsTitles = [
        tows?.soTitle ?? "SO · Use strengths to win",
        tows?.woTitle ?? "WO · Fix gaps to seize chances",
        tows?.stTitle ?? "ST · Use strengths to defend",
        tows?.wtTitle ?? "WT · Reduce weakness and risk",
    ]
    const towsItems = [clean(tows?.soItems, SO_ITEMS), clean(tows?.woItems, WO_ITEMS), clean(tows?.stItems, ST_ITEMS), clean(tows?.wtItems, WT_ITEMS)]
    const axisText: Record<string, string> = {
        internal: axis?.internal ?? "Internal",
        external: axis?.external ?? "External",
        helpful: axis?.helpful ?? "Helpful",
        harmful: axis?.harmful ?? "Harmful",
    }

    const cards = [0, 1, 2, 3].map((i) => {
        if (towsOn) {
            const [a, b] = TOWS_MIX[i]
            return {
                title: towsTitles[i],
                hint: nameOf(a) + " × " + nameOf(b),
                items: towsItems[i],
                color: mixColors(colors[a], colors[b]),
                code: TOWS_CODES[i],
                icon: undefined as QuadData["icon"],
                tag: "",
            }
        }
        return {
            title: nameOf(i),
            hint: "",
            items: clean(swotSrc[i]?.items, swotDefaults[i]),
            color: colors[i],
            code: CODES[i],
            icon: swotSrc[i]?.icon,
            tag: TAGS[i].map((k) => axisText[k]).join(" · "),
        }
    })

    // ── 레이아웃 계산: 확대하면 해당 열/행이 커지고 나머지는 헤더만 남는다 ──
    const fc = focus % 2
    const fr = focus >> 1
    const big = "minmax(0, 1.9fr)"
    const small = "minmax(0, 0.7fr)"
    const cols = stacked ? "minmax(0, 1fr)" : focus < 0 ? "minmax(0, 1fr) minmax(0, 1fr)" : fc === 0 ? big + " " + small : small + " " + big
    const rows = focus < 0 ? "minmax(0, 1fr) minmax(0, 1fr)" : fr === 0 ? "minmax(0, 2.6fr) minmax(0, 0.62fr)" : "minmax(0, 0.62fr) minmax(0, 2.6fr)"
    const gridGap = cross ? 0 : gap
    const trans = isStatic ? undefined : "grid-template-columns 480ms cubic-bezier(.2,.8,.2,1), grid-template-rows 480ms cubic-bezier(.2,.8,.2,1)"

    const setFocusSafe = (v: number) => startTransition(() => setFocus(v))
    const setHoverSafe = (v: number) => startTransition(() => setHover(v))
    const toggle = (i: number) => {
        if (clickExpand) setFocusSafe(focus === i ? -1 : i)
    }

    // ── 축 라벨 ──
    const labelBase: CSSProperties = {
        ...labelFont,
        color: subColor,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
    }
    const showAxis = axisLabels && !stacked
    // SWOT: 열 = Helpful/Harmful, 행 = Internal/External / TOWS: 열 = S/W 이름, 행 = O/T 이름
    const topLabels = towsOn ? [nameOf(0), nameOf(1)] : [axisText.helpful, axisText.harmful]
    const leftLabels = towsOn ? [nameOf(2), nameOf(3)] : [axisText.internal, axisText.external]

    // ── 사분면 카드 ──
    const renderCard = (i: number) => {
        const c = cards[i]
        const isFocus = focus === i
        const collapsed = focus >= 0 && !isFocus // 다른 사분면이 확대됨 → 이 카드는 헤더만
        const hovered = hoverFocus && hover === i
        const dim = hoverFocus && hover >= 0 && hover !== i
        const line = withAlpha(textColor, 0.14)
        const interactive = clickExpand

        // 번호/불릿 모양
        const marker = (n: number) => {
            if (numbering === "none") return null
            let label = ""
            if (numbering === "padded") label = (n + 1 < 10 ? "0" : "") + (n + 1)
            else if (numbering === "number") label = n + 1 + "."
            else if (numbering === "bullet") label = "●"
            else label = "—"
            return (
                <span
                    aria-hidden
                    style={{
                        color: c.color,
                        fontWeight: 700,
                        fontSize: numbering === "bullet" ? "0.55em" : "0.85em",
                        minWidth: numbering === "padded" ? "1.7em" : numbering === "number" ? "1.5em" : "1.1em",
                        paddingTop: numbering === "bullet" ? "0.55em" : "0.12em",
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                    }}
                >
                    {label}
                </span>
            )
        }

        // 헤더 아이콘 배지
        let badge: any = null
        if (towsOn) {
            badge = c.code
        } else if (c.icon?.src) {
            badge = <img src={c.icon.src} srcSet={c.icon.srcSet} alt={c.icon.alt || ""} style={{ width: 18, height: 18, objectFit: "contain", display: "block" }} />
        } else if (icons === "symbol") {
            badge = <Glyph index={i} />
        } else if (icons === "letter") {
            badge = c.code
        }
        const customIcon = !towsOn && !!c.icon?.src

        // 클릭 확대가 켜지면 실제 <button>, 꺼지면 상호작용 없는 <div>
        // button 안에는 div 를 둘 수 없어 안쪽 블록은 span + display 로 렌더 (겉모습 동일)
        const Card: any = interactive ? "button" : "div"
        const Blk: any = interactive ? "span" : "div"
        // 2026-10-09: 테두리 버그 수정 — border 단축 속성 + borderRight/Bottom "none" 조합이 오른쪽·아래를 지웠음.
        // 네 변을 각각(longhand) 지정해 충돌을 없앤다. 변마다 style/width/color 를 다 주므로 button UA 테두리도 덮는다.
        const cardBorder = "1px solid " + withAlpha(c.color, hovered || isFocus ? 0.6 : 0.28)
        const sideRight = cross ? (i % 2 === 0 && !stacked ? "1px solid " + line : "none") : cardBorder
        const sideBottom = cross ? ((stacked ? i < 3 : i < 2) ? "1px solid " + line : "none") : cardBorder
        const sideOther = cross ? "none" : cardBorder
        return (
            <Card
                key={i}
                className="bu-swot-card"
                type={interactive ? "button" : undefined}
                role={interactive ? undefined : "group"}
                tabIndex={!interactive && hoverFocus ? 0 : undefined}
                aria-pressed={interactive ? isFocus : undefined}
                aria-label={c.title + ", " + c.items.length + (c.items.length === 1 ? " item" : " items") + (interactive ? (isFocus ? ". Press to collapse." : ". Press to expand.") : "")}
                onPointerEnter={(e: any) => {
                    if (e.pointerType !== "touch") setHoverSafe(i)
                }}
                onPointerLeave={(e: any) => {
                    if (e.pointerType !== "touch") setHoverSafe(-1)
                }}
                onFocus={() => hoverFocus && setHoverSafe(i)}
                onBlur={() => hoverFocus && setHoverSafe(-1)}
                onClick={() => toggle(i)}
                onKeyDown={(e: any) => {
                    // Enter/Space 는 button 기본 동작(click)이 처리 → Esc 닫기만 직접 처리
                    if (e.key === "Escape" && focus >= 0) {
                        setFocusSafe(-1)
                    }
                }}
                style={{
                    ["--bu-ring" as any]: c.color,
                    // button 기본 스타일 리셋 (div 였을 때와 같은 겉모습 유지)
                    appearance: "none",
                    margin: 0,
                    font: "inherit",
                    letterSpacing: "inherit",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                    minWidth: 0,
                    minHeight: 0,
                    padding: collapsed ? Math.min(padding, 14) + "px " + padding + "px" : padding,
                    overflow: "hidden",
                    borderRadius: cross ? 0 : radius,
                    background: withAlpha(c.color, tint / 100),
                    borderTop: sideOther,
                    borderLeft: sideOther,
                    borderRight: sideRight,
                    borderBottom: sideBottom,
                    boxShadow: (hovered || isFocus) && !cross ? "0 10px 28px " + withAlpha(c.color, 0.22) : "0 0 0 rgba(0, 0, 0, 0)",
                    opacity: dim ? 0.42 : 1,
                    transform: hovered && !isFocus && !cross && !isStatic ? "translateY(-2px)" : "none",
                    cursor: interactive ? (isFocus ? "zoom-out" : "zoom-in") : "default",
                    transition: isStatic ? undefined : "opacity 260ms ease, transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease, padding 400ms ease",
                    color: textColor,
                    textAlign: "left",
                    userSelect: "none",
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                <Blk key={String(towsOn)} className={isStatic ? undefined : "bu-swot-in"} style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
                    {/* 헤더: 아이콘 · 제목 · 개수 · 확대 안내 */}
                    <Blk style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        {badge !== null && (
                            <span
                                aria-hidden
                                style={{
                                    flexShrink: 0,
                                    minWidth: 30,
                                    height: 30,
                                    padding: towsOn ? "0 8px" : 0,
                                    boxSizing: "border-box",
                                    borderRadius: towsOn ? 999 : Math.min(radius, 10),
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: customIcon ? withAlpha(c.color, 0.16) : c.color,
                                    color: "#FFFFFF",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {badge}
                            </span>
                        )}
                        <Blk style={{ display: "block", minWidth: 0, flex: 1 }}>
                            <Blk style={{ display: "block", ...titleFont, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: collapsed ? "nowrap" : "normal" }}>{c.title}</Blk>
                            {!collapsed && (c.hint || (axisLabels && stacked && c.tag)) && (
                                <Blk style={{ display: "block", ...labelFont, color: subColor, marginTop: 2 }}>{c.hint || c.tag}</Blk>
                            )}
                        </Blk>
                        <span style={{ ...labelFont, color: subColor, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{c.items.length}</span>
                        {interactive && (
                            <span style={{ color: subColor, flexShrink: 0, display: "inline-flex" }}>
                                <ExpandGlyph open={isFocus} />
                            </span>
                        )}
                    </Blk>

                    {/* 항목 목록 — 다른 사분면이 확대되면 높이가 부드럽게 0으로 */}
                    <Blk
                        aria-hidden={collapsed}
                        style={{
                            flex: 1,
                            minHeight: 0,
                            display: "grid",
                            gridTemplateRows: collapsed ? "0fr" : "1fr",
                            marginTop: collapsed ? 0 : 12,
                            opacity: collapsed ? 0 : 1,
                            transition: isStatic ? undefined : "grid-template-rows 400ms cubic-bezier(.2,.8,.2,1), opacity 240ms ease, margin 400ms ease",
                        }}
                    >
                        <Blk className="bu-swot-scroll" style={{ minHeight: 0, overflowY: collapsed ? "hidden" : "auto", display: "flex", flexDirection: "column", gap: isFocus ? 14 : 9 }}>
                            {c.items.length === 0 && <Blk style={{ display: "block", ...itemFont, color: subColor }}>Add items in the properties panel.</Blk>}
                            {c.items.map((text, n) => (
                                <Blk key={n} style={{ ...itemFont, color: textColor, display: "flex", gap: 8, alignItems: "flex-start" }}>
                                    {marker(n)}
                                    <span style={{ minWidth: 0 }}>{text}</span>
                                </Blk>
                            ))}
                        </Blk>
                    </Blk>
                </Blk>
            </Card>
        )
    }

    // ── 사분면 묶음 (십자 모드는 가운데 배지 추가) ──
    const matrix = (
        <div
            style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: cols,
                gridTemplateRows: stacked ? undefined : rows,
                gridAutoRows: stacked ? "auto" : undefined,
                gap: gridGap,
                width: "100%",
                height: stacked ? "auto" : "100%",
                minHeight: 0,
                transition: trans,
                borderRadius: cross ? radius : 0,
                overflow: cross ? "hidden" : "visible",
            }}
        >
            {[0, 1, 2, 3].map(renderCard)}
            {cross && (
                <div
                    aria-hidden
                    style={{
                        ...labelFont,
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: textColor,
                        color: background,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        pointerEvents: "none",
                        opacity: focus < 0 ? 1 : 0,
                        transition: isStatic ? undefined : "opacity 240ms ease",
                        boxShadow: "0 0 0 6px " + background,
                    }}
                >
                    {towsOn ? "TOWS" : "SWOT"}
                </div>
            )}
        </div>
    )

    // 축 라벨이 열/행 크기 변화를 그대로 따라가도록 같은 템플릿을 사용
    const body = showAxis ? (
        <div style={{ display: "grid", gridTemplateColumns: "28px minmax(0, 1fr)", gridTemplateRows: "24px minmax(0, 1fr)", columnGap: 8, rowGap: 8, flex: 1, minHeight: 0 }}>
            <div />
            <div style={{ display: "grid", gridTemplateColumns: cols, gap: gridGap, transition: trans }}>
                {topLabels.map((t, k) => (
                    <div key={k} style={labelBase}>
                        {t}
                    </div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateRows: rows, gap: gridGap, transition: trans }}>
                {leftLabels.map((t, k) => (
                    <div key={k} style={{ ...labelBase, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                        {t}
                    </div>
                ))}
            </div>
            {matrix}
        </div>
    ) : (
        <div style={{ flex: stacked ? "none" : 1, minHeight: 0 }}>{matrix}</div>
    )

    return (
        <div
            ref={rootRef}
            className="bu-swot"
            role="group"
            aria-label={towsOn ? "TOWS strategy matrix" : "SWOT analysis matrix"}
            style={{
                ...style,
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: gap + 8,
                background,
                borderRadius: radius + 6,
                overflowX: "hidden",
                overflowY: stacked ? "auto" : "hidden",
            }}
        >
            <style>{CSS}</style>

            {/* 보는 사람이 직접 SWOT ↔ TOWS 를 바꾸는 스위치 */}
            {modeSwitch && (
                <div
                    role="group"
                    aria-label="Matrix type"
                    style={{ alignSelf: "flex-start", display: "inline-flex", padding: 3, borderRadius: 999, background: withAlpha(textColor, 0.06), flexShrink: 0 }}
                >
                    {[
                        { id: false, label: "SWOT" },
                        { id: true, label: "TOWS" },
                    ].map((o) => {
                        const on = towsOn === o.id
                        return (
                            <button
                                key={o.label}
                                type="button"
                                aria-pressed={on}
                                onClick={() => startTransition(() => setTowsOn(o.id))}
                                style={{
                                    ...labelFont,
                                    appearance: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "6px 16px",
                                    borderRadius: 999,
                                    background: on ? textColor : "transparent",
                                    color: on ? background : subColor,
                                    letterSpacing: "0.06em",
                                    transition: isStatic ? undefined : "background 240ms ease, color 240ms ease",
                                }}
                            >
                                {o.label}
                            </button>
                        )
                    })}
                </div>
            )}

            {body}
        </div>
    )
}

SwotMatrix.displayName = "SWOT Matrix"

// 사분면 속성 묶음 (제목 · 항목 · 아이콘) — 4개가 같은 모양이라 함수로 생성
function quadControls(title: string, items: string[]) {
    return {
        type: ControlType.Object as const,
        title,
        controls: {
            title: { type: ControlType.String as const, title: "Title", defaultValue: title },
            items: { type: ControlType.Array as const, title: "Items", control: { type: ControlType.String as const, displayTextArea: true }, defaultValue: items },
            icon: { type: ControlType.ResponsiveImage as const, title: "Icon" },
        },
    }
}

addPropertyControls(SwotMatrix, {
    mode: {
        type: ControlType.Enum,
        title: "Type",
        options: ["swot", "tows"],
        optionTitles: ["SWOT", "TOWS"],
        defaultValue: "swot",
        displaySegmentedControl: true,
        description: "TOWS turns the four boxes into a strategy table (SO, WO, ST, WT).",
    },
    modeSwitch: { type: ControlType.Boolean, title: "Switch", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["grid", "cross", "stacked"],
        optionTitles: ["Grid 2x2", "Cross", "Stacked"],
        defaultValue: "grid",
    },
    autoStack: { type: ControlType.Boolean, title: "Auto Stack", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Switches to one column on narrow screens." },
    stackBelow: {
        type: ControlType.Number,
        title: "Stack Below",
        defaultValue: 560,
        min: 280,
        max: 900,
        step: 10,
        unit: "px",
        hidden: (p: any) => !p.autoStack,
    },
    axisLabels: { type: ControlType.Boolean, title: "Axis Labels", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    hoverFocus: { type: ControlType.Boolean, title: "Hover Focus", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Hover or focus a box to dim the others." },
    clickExpand: { type: ControlType.Boolean, title: "Click Expand", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", description: "Click a box to enlarge it. Click again to return." },
    numbering: {
        type: ControlType.Enum,
        title: "List Style",
        options: ["padded", "number", "bullet", "dash", "none"],
        optionTitles: ["01 02", "1. 2.", "Bullet", "Dash", "None"],
        defaultValue: "padded",
    },
    icons: {
        type: ControlType.Enum,
        title: "Icons",
        options: ["symbol", "letter", "none"],
        optionTitles: ["Symbol", "Letter", "None"],
        defaultValue: "symbol",
        displaySegmentedControl: true,
    },
    strengths: quadControls("Strengths", S_ITEMS),
    weaknesses: quadControls("Weaknesses", W_ITEMS),
    opportunities: quadControls("Opportunities", O_ITEMS),
    threats: quadControls("Threats", T_ITEMS),
    tows: {
        type: ControlType.Object,
        title: "TOWS Strategies",
        controls: {
            soTitle: { type: ControlType.String, title: "SO Title", defaultValue: "SO · Use strengths to win" },
            soItems: { type: ControlType.Array, title: "SO Items", control: { type: ControlType.String, displayTextArea: true }, defaultValue: SO_ITEMS },
            woTitle: { type: ControlType.String, title: "WO Title", defaultValue: "WO · Fix gaps to seize chances" },
            woItems: { type: ControlType.Array, title: "WO Items", control: { type: ControlType.String, displayTextArea: true }, defaultValue: WO_ITEMS },
            stTitle: { type: ControlType.String, title: "ST Title", defaultValue: "ST · Use strengths to defend" },
            stItems: { type: ControlType.Array, title: "ST Items", control: { type: ControlType.String, displayTextArea: true }, defaultValue: ST_ITEMS },
            wtTitle: { type: ControlType.String, title: "WT Title", defaultValue: "WT · Reduce weakness and risk" },
            wtItems: { type: ControlType.Array, title: "WT Items", control: { type: ControlType.String, displayTextArea: true }, defaultValue: WT_ITEMS },
        },
    },
    axis: {
        type: ControlType.Object,
        title: "Axis Text",
        controls: {
            internal: { type: ControlType.String, title: "Internal", defaultValue: "Internal" },
            external: { type: ControlType.String, title: "External", defaultValue: "External" },
            helpful: { type: ControlType.String, title: "Helpful", defaultValue: "Helpful" },
            harmful: { type: ControlType.String, title: "Harmful", defaultValue: "Harmful" },
        },
    },
    strengthsColor: { type: ControlType.Color, title: "Strengths", defaultValue: "#12B981" },
    weaknessesColor: { type: ControlType.Color, title: "Weaknesses", defaultValue: "#F59E0B" },
    opportunitiesColor: { type: ControlType.Color, title: "Opportunities", defaultValue: "#3B82F6" },
    threatsColor: { type: ControlType.Color, title: "Threats", defaultValue: "#EF4444" },
    tint: { type: ControlType.Number, title: "Tint", defaultValue: 12, min: 2, max: 40, step: 1, unit: "%", description: "Strength of the soft background behind each box." },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
    subColor: { type: ControlType.Color, title: "Sub Text", defaultValue: "#6B6B76" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 14, min: 0, max: 40, step: 1, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 48, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 22, min: 8, max: 48, step: 1, unit: "px" },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "18px", variant: "Semibold", lineHeight: "1.25em" },
    },
    itemFont: {
        type: ControlType.Font,
        title: "Item Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Regular", lineHeight: "1.45em" },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Semibold", lineHeight: "1.3em" },
        description: "Created by BrandingUp",
    },
})
