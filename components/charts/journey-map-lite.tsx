// [생성일] 2026-10-22
// [경위] 판매 진단(10-22) 후속 — 무료 체험판(Lite)으로 손님을 모아 정식판(10 Customer Journey Map)으로 연결. 10번 코드를 복사해 차별 기능 4개를 뺀 무료판
// [제작] BrandingUp (https://brandingupstudio.com)
// [변경이력]
//   - 2026-10-22: 최초 생성 (10 JourneyMap.tsx 복사 → 단계 4개 상한, Opportunities 행·Compact 밀도·행 이름 바꾸기(Row Labels)는 정식판 전용으로 제거)
//   - 2026-10-24: 마켓 심사 권고 예방 — 도달 불가 compact 분기 삭제, 가로 스크롤 영역에 tabIndex·role=region·aria-label 추가

import { useId, useState, startTransition } from "react"
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
interface Stage {
    name?: string
    icon?: string
    color?: string
    actions?: string
    touchpoints?: string
    emotion?: number
    pains?: string
}

interface JourneyMapLiteProps {
    stages?: Stage[]
    showActions?: boolean
    showTouchpoints?: boolean
    showEmotion?: boolean
    showPains?: boolean
    hoverHighlight?: boolean
    showIcons?: boolean
    showScores?: boolean
    positiveColor?: string
    negativeColor?: string
    surfaceColor?: string
    labelColor?: string
    textColor?: string
    subColor?: string
    borderColor?: string
    radius?: number
    font?: any
    headerFont?: any
    style?: CSSProperties
}

// Lite 상한: 단계 4개까지 (정식판 무제한)
const MAX_STAGES = 4

// 단계 기본 색 (색을 안 정한 단계에 순서대로 사용)
const PALETTE = [
    "#6366F1",
    "#0EA5E9",
    "#F59E0B",
    "#14B8A6",
    "#EC4899",
    "#8B5CF6",
    "#F97316",
    "#22C55E",
]

// 설치 직후 보이는 샘플: 온라인 스토어 구매 여정 4단계 (Lite 상한)
const SAMPLE: Stage[] = [
    {
        name: "Discover",
        icon: "search",
        color: "#6366F1",
        actions: "Sees an Instagram ad\nSearches for the product",
        touchpoints: "Instagram, Google Search",
        emotion: 1,
        pains: "Too many similar brands",
    },
    {
        name: "Compare",
        icon: "star",
        color: "#0EA5E9",
        actions: "Reads reviews\nChecks sizes and prices",
        touchpoints: "Product page, Reviews",
        emotion: 2,
        pains: "Size guide is hard to find",
    },
    {
        name: "Checkout",
        icon: "card",
        color: "#F59E0B",
        actions: "Adds to cart\nEnters shipping and payment",
        touchpoints: "Cart, Payment page",
        emotion: -1,
        pains: "Forced account creation\nShipping cost appears late",
    },
    {
        name: "Delivery",
        icon: "box",
        color: "#14B8A6",
        actions: "Tracks the parcel\nUnboxes the order",
        touchpoints: "Tracking email, Packaging",
        emotion: 0,
        pains: "No delivery updates for 2 days",
    },
]

// 아이콘 이름 → SVG 도형 (24x24, 선 아이콘)
function iconShape(name: string): ReactNode {
    switch (name) {
        case "search":
            return (
                <>
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-4-4" />
                </>
            )
        case "cart":
            return (
                <>
                    <circle cx="9" cy="20" r="1.5" />
                    <circle cx="18" cy="20" r="1.5" />
                    <path d="M2 3h3l2.7 11.4a2 2 0 002 1.6h7.7a2 2 0 002-1.5L21 7H6" />
                </>
            )
        case "card":
            return (
                <>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20" />
                </>
            )
        case "box":
            return (
                <>
                    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
                    <path d="M3 8l9 5 9-5M12 13v8" />
                </>
            )
        case "heart":
            return (
                <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z" />
            )
        case "chat":
            return (
                <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />
            )
        case "star":
            return (
                <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />
            )
        case "user":
            return (
                <>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0116 0" />
                </>
            )
        case "mail":
            return (
                <>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                </>
            )
        case "flag":
            return <path d="M5 21V4M5 4h12l-2 4 2 4H5" />
        default:
            return null
    }
}

// 줄바꿈(또는 쉼표) 기준으로 항목 나누기
function splitLines(text: string | undefined, commas = false): string[] {
    if (!text) return []
    return text
        .split(commas ? /[\n,]+/ : /\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
}

// 점수 → 감정 단어 (점수 라벨·접근성용)
function moodWord(score: number): string {
    const r = Math.round(score)
    if (r >= 2) return "Delighted"
    if (r === 1) return "Happy"
    if (r === 0) return "Neutral"
    if (r === -1) return "Frustrated"
    return "Upset"
}

// 색 위에 투명도만 입히는 덮개 (색 형식과 무관하게 rgb/hex 모두 동작)
function Tint({ color, opacity }: { color: string; opacity: number }) {
    return (
        <span
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                background: color,
                opacity,
                pointerEvents: "none",
                transition: "opacity 0.18s ease",
            }}
        />
    )
}

/**
 * 고객 여정 지도 Lite (Journey Map Lite) — 단계 목록만 채우면 표와 감정 곡선이 자동으로 만들어집니다 (무료판, 단계 4개까지)
 * 행 켜기/끄기, 왼쪽 라벨 고정 + 가로 스냅 스크롤, 열 호버 강조 지원
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function JourneyMapLite(props: JourneyMapLiteProps) {
    const {
        stages: stagesProp,
        showActions = true,
        showTouchpoints = true,
        showEmotion = true,
        showPains = true,
        hoverHighlight = true,
        showIcons = true,
        showScores = true,
        positiveColor = "#10B981",
        negativeColor = "#F43F5E",
        surfaceColor = "#FFFFFF",
        labelColor = "#F5F6F8",
        textColor = "#14151A",
        subColor = "#6B6F7B",
        borderColor = "rgba(20, 21, 26, 0.09)",
        radius = 16,
        font,
        headerFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = "jm" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const stages = (stagesProp ?? SAMPLE).slice(0, MAX_STAGES) // 변경: 4단계까지만
    const n = stages.length

    // 열 강조용 상태 (캔버스·정적 렌더에서는 사용하지 않음)
    const [hot, setHot] = useState<number | null>(null)
    const canHover = hoverHighlight && !isStatic
    const setHover = (i: number | null) => {
        if (!canHover) return
        startTransition(() => setHot(i))
    }

    // 밀도별 치수
    // 변경(2026-10-24): Lite 는 넉넉한 밀도 고정 — 도달 불가였던 compact 분기 삭제
    const labelW = 132
    const colMin = 208
    const padX = 18
    const padY = 16
    const emoH = 168
    const baseSize = 13

    // 변경: 행 이름은 고정 (이름 바꾸기는 정식판 전용)
    const L = {
        actions: "Actions",
        touchpoints: "Touchpoints",
        emotion: "Emotion",
        pains: "Pain points",
    }

    const stageColor = (s: Stage, i: number) =>
        s.color || PALETTE[i % PALETTE.length]

    // ── 감정 곡선 계산 (뷰박스 가로 100 = 한 열, 세로 = 실제 px) ──
    const vbW = Math.max(1, n) * 100
    const edge = 34 // 위아래 여백 (점수 라벨 공간)
    const innerH = emoH - edge * 2
    const yOf = (score: number) => {
        const s = Math.max(-2, Math.min(2, Number(score) || 0))
        return edge + ((2 - s) / 4) * innerH
    }
    const zeroY = yOf(0)
    const pts = stages.map((s, i) => ({
        x: i * 100 + 50,
        y: yOf(s.emotion ?? 0),
    }))
    // 점 사이를 S자 곡선으로 연결 (제어점 y 를 양 끝점에 맞춰 튀어나감 없이 부드럽게)
    let curve = ""
    pts.forEach((p, i) => {
        if (i === 0) curve = "M " + p.x + " " + p.y
        else {
            const q = pts[i - 1]
            const xm = (q.x + p.x) / 2
            curve +=
                " C " +
                xm +
                " " +
                q.y +
                ", " +
                xm +
                " " +
                p.y +
                ", " +
                p.x +
                " " +
                p.y
        }
    })
    const area =
        pts.length > 1
            ? curve +
              " L " +
              pts[pts.length - 1].x +
              " " +
              zeroY +
              " L " +
              pts[0].x +
              " " +
              zeroY +
              " Z"
            : ""

    // 공통 셀 스타일
    const cellBase = (i: number): CSSProperties => ({
        position: "relative",
        padding: padY + "px " + padX + "px",
        verticalAlign: "top",
        textAlign: "left",
        borderBottom: "1px solid " + borderColor,
        borderLeft: i > 0 ? "1px solid " + borderColor : "none",
        scrollSnapAlign: "start",
        color: textColor,
        boxSizing: "border-box",
    })

    // 왼쪽 고정 행 라벨
    const rowHead = (text: string, last = false): ReactNode => (
        <th
            scope="row"
            style={{
                position: "sticky",
                left: 0,
                zIndex: 3,
                padding: padY + "px " + padX + "px",
                background: labelColor,
                color: subColor,
                textAlign: "left",
                verticalAlign: "top",
                borderBottom: last ? "none" : "1px solid " + borderColor,
                borderRight: "1px solid " + borderColor,
                ...headerFont,
                fontSize: baseSize,
                boxSizing: "border-box",
            }}
        >
            {text}
        </th>
    )

    // 열 강조 덮개 (호버 중인 열이면 단계 색을 옅게 입힘)
    const hotTint = (i: number) =>
        canHover ? (
            <Tint
                color={stageColor(stages[i], i)}
                opacity={hot === i ? 0.08 : 0}
            />
        ) : null

    // 일반 텍스트 행 (Actions / Touchpoints / Pains)
    const textRow = (
        key: string,
        label: string,
        render: (s: Stage, i: number) => ReactNode,
        last: boolean
    ) => (
        <tr key={key}>
            {rowHead(label, last)}
            {stages.map((s, i) => (
                <td
                    key={i}
                    onMouseEnter={() => setHover(i)}
                    style={{
                        ...cellBase(i),
                        borderBottom: last
                            ? "none"
                            : "1px solid " + borderColor,
                    }}
                >
                    {hotTint(i)}
                    <div style={{ position: "relative", zIndex: 1 }}>
                        {render(s, i)}
                    </div>
                </td>
            ))}
        </tr>
    )

    // 점 목록 (행동·고충)
    const bullets = (items: string[], dot: string) => (
        <ul
            style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}
        >
            {items.map((t, k) => (
                <li
                    key={k}
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                        ...font,
                        fontSize: baseSize + 0.5,
                        color: textColor,
                        lineHeight: 1.45,
                    }}
                >
                    <span
                        style={{
                            flexShrink: 0,
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            background: dot,
                            marginTop: "0.55em",
                        }}
                    />
                    <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                        {t}
                    </span>
                </li>
            ))}
        </ul>
    )

    // 켜져 있는 행 목록 (마지막 행은 아래 테두리를 없앰)
    const rowKeys: string[] = []
    if (showActions) rowKeys.push("actions")
    if (showTouchpoints) rowKeys.push("touchpoints")
    if (showEmotion) rowKeys.push("emotion")
    if (showPains) rowKeys.push("pains")
    const isLast = (k: string) => rowKeys[rowKeys.length - 1] === k

    const renderRow = (k: string): ReactNode => {
        if (k === "actions")
            return textRow(
                "actions",
                L.actions,
                (s) => bullets(splitLines(s.actions), subColor),
                isLast(k)
            )
        if (k === "touchpoints")
            return textRow(
                "touchpoints",
                L.touchpoints,
                (s, i) => (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {splitLines(s.touchpoints, true).map((t, j) => (
                            <span
                                key={j}
                                style={{
                                    position: "relative",
                                    overflow: "hidden",
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    border: "1px solid " + borderColor,
                                    ...font,
                                    fontSize: baseSize - 0.5,
                                    color: textColor,
                                    lineHeight: 1.3,
                                }}
                            >
                                <Tint color={stageColor(s, i)} opacity={0.1} />
                                <span style={{ position: "relative" }}>
                                    {t}
                                </span>
                            </span>
                        ))}
                    </div>
                ),
                isLast(k)
            )
        if (k === "pains")
            return textRow(
                "pains",
                L.pains,
                (s) => bullets(splitLines(s.pains), negativeColor),
                isLast(k)
            )

        // ── 감정 곡선 행: 모든 단계 열을 가로로 가로지르는 한 칸 ──
        return (
            <tr key="emotion">
                {rowHead(L.emotion, isLast(k))}
                <td
                    colSpan={Math.max(1, n)}
                    style={{
                        padding: 0,
                        borderBottom: isLast(k)
                            ? "none"
                            : "1px solid " + borderColor,
                        height: emoH,
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: emoH,
                        }}
                    >
                        {/* 열 구분선 + 열 강조 + 마우스 감지 영역 */}
                        {stages.map((s, i) => (
                            <div
                                key={i}
                                onMouseEnter={() => setHover(i)}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: (i / n) * 100 + "%",
                                    width: 100 / n + "%",
                                    borderLeft:
                                        i > 0
                                            ? "1px solid " + borderColor
                                            : "none",
                                    boxSizing: "border-box",
                                    overflow: "hidden",
                                }}
                            >
                                {canHover && (
                                    <Tint
                                        color={stageColor(s, i)}
                                        opacity={hot === i ? 0.08 : 0}
                                    />
                                )}
                            </div>
                        ))}
                        {/* 곡선: 가로만 늘어나므로 선 굵기는 non-scaling-stroke 로 고정. 0선 위/아래를 clipPath 로 나눠 색 구분 */}
                        <svg
                            width="100%"
                            height={emoH}
                            viewBox={"0 0 " + vbW + " " + emoH}
                            preserveAspectRatio="none"
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                display: "block",
                                pointerEvents: "none",
                            }}
                        >
                            <defs>
                                <clipPath id={uid + "up"}>
                                    <rect
                                        x="0"
                                        y="0"
                                        width={vbW}
                                        height={zeroY}
                                    />
                                </clipPath>
                                <clipPath id={uid + "dn"}>
                                    <rect
                                        x="0"
                                        y={zeroY}
                                        width={vbW}
                                        height={emoH - zeroY}
                                    />
                                </clipPath>
                            </defs>
                            <line
                                x1="0"
                                x2={vbW}
                                y1={zeroY}
                                y2={zeroY}
                                stroke={subColor}
                                strokeOpacity="0.45"
                                strokeWidth="1"
                                strokeDasharray="4 4"
                                vectorEffect="non-scaling-stroke"
                            />
                            {n > 1 && (
                                <>
                                    <path
                                        d={area}
                                        fill={positiveColor}
                                        fillOpacity="0.14"
                                        clipPath={"url(#" + uid + "up)"}
                                    />
                                    <path
                                        d={area}
                                        fill={negativeColor}
                                        fillOpacity="0.14"
                                        clipPath={"url(#" + uid + "dn)"}
                                    />
                                    <path
                                        d={curve}
                                        fill="none"
                                        stroke={positiveColor}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        vectorEffect="non-scaling-stroke"
                                        clipPath={"url(#" + uid + "up)"}
                                    />
                                    <path
                                        d={curve}
                                        fill="none"
                                        stroke={negativeColor}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        vectorEffect="non-scaling-stroke"
                                        clipPath={"url(#" + uid + "dn)"}
                                    />
                                </>
                            )}
                        </svg>
                        {/* 점 + 감정 단어 라벨 (HTML 로 그려 찌그러지지 않게) */}
                        {stages.map((s, i) => {
                            const sc = s.emotion ?? 0
                            const col = sc >= 0 ? positiveColor : negativeColor
                            const y = pts[i].y
                            const left = ((i + 0.5) / n) * 100 + "%"
                            return (
                                <div key={i} aria-hidden="true">
                                    <div
                                        style={{
                                            position: "absolute",
                                            left,
                                            top: y,
                                            width: 16,
                                            height: 16,
                                            borderRadius: 8,
                                            background: col,
                                            border: "3px solid " + surfaceColor,
                                            boxShadow: "0 0 0 1px " + col,
                                            transform:
                                                "translate(-50%, -50%) scale(" +
                                                (hot === i ? 1.25 : 1) +
                                                ")",
                                            transition: "transform 0.18s ease",
                                            boxSizing: "border-box",
                                            pointerEvents: "none",
                                        }}
                                    />
                                    {showScores && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left,
                                                top: sc >= 0 ? y - 24 : y + 24,
                                                transform:
                                                    "translate(-50%, -50%)",
                                                ...font,
                                                fontSize: baseSize - 1,
                                                fontWeight: 600,
                                                color: col,
                                                whiteSpace: "nowrap",
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {moodWord(sc)}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        {/* 스크린리더용: 단계별 점수 읽어 주기 */}
                        <ul
                            style={{
                                position: "absolute",
                                width: 1,
                                height: 1,
                                overflow: "hidden",
                                clip: "rect(0 0 0 0)",
                                margin: 0,
                                padding: 0,
                                listStyle: "none",
                            }}
                        >
                            {stages.map((s, i) => (
                                <li key={i}>
                                    {(s.name || "Stage " + (i + 1)) +
                                        ": " +
                                        (s.emotion ?? 0) +
                                        " (" +
                                        moodWord(s.emotion ?? 0) +
                                        ")"}
                                </li>
                            ))}
                        </ul>
                    </div>
                </td>
            </tr>
        )
    }

    // 단계가 하나도 없을 때 안내
    if (n === 0) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: surfaceColor,
                    border: "1px dashed " + borderColor,
                    borderRadius: radius,
                    color: subColor,
                    ...font,
                    boxSizing: "border-box",
                }}
            >
                Add stages in the properties panel
            </div>
        )
    }

    // 얇은 스크롤바 (캔버스에서는 생략)
    const css = isStatic
        ? ""
        : `.${uid}-sc { scrollbar-width: thin; } .${uid}-sc::-webkit-scrollbar { height: 8px; width: 8px; } .${uid}-sc::-webkit-scrollbar-thumb { background: rgba(120,124,136,0.35); border-radius: 4px; }`

    return (
        <div
            onMouseLeave={() => setHover(null)}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                background: surfaceColor,
                border: "1px solid " + borderColor,
                borderRadius: radius,
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            {css && <style>{css}</style>}
            <div
                className={uid + "-sc"}
                tabIndex={0}
                role="region"
                aria-label="Customer journey map, scroll horizontally"
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "auto",
                    scrollSnapType: "x proximity",
                    scrollPaddingLeft: labelW,
                }}
            >
                <table
                    style={{
                        width: "100%",
                        minWidth: labelW + n * colMin,
                        tableLayout: "fixed",
                        borderCollapse: "separate",
                        borderSpacing: 0,
                        ...font,
                    }}
                >
                    <caption
                        style={{
                            position: "absolute",
                            width: 1,
                            height: 1,
                            overflow: "hidden",
                            clip: "rect(0 0 0 0)",
                        }}
                    >
                        Customer journey map
                    </caption>
                    <colgroup>
                        <col style={{ width: labelW }} />
                        {stages.map((_, i) => (
                            <col key={i} />
                        ))}
                    </colgroup>
                    <thead>
                        <tr>
                            <th
                                scope="col"
                                style={{
                                    position: "sticky",
                                    left: 0,
                                    zIndex: 3,
                                    background: labelColor,
                                    borderBottom: "1px solid " + borderColor,
                                    borderRight: "1px solid " + borderColor,
                                    color: subColor,
                                    textAlign: "left",
                                    verticalAlign: "bottom",
                                    padding: padY + "px " + padX + "px",
                                    ...headerFont,
                                    fontSize: baseSize - 1,
                                    fontWeight: 500,
                                    boxSizing: "border-box",
                                }}
                            >
                                Stage
                            </th>
                            {stages.map((s, i) => {
                                const c = stageColor(s, i)
                                const shape = showIcons
                                    ? iconShape(s.icon || "none")
                                    : null
                                return (
                                    <th
                                        key={i}
                                        scope="col"
                                        onMouseEnter={() => setHover(i)}
                                        style={{
                                            ...cellBase(i),
                                            padding: 0,
                                            textAlign: "left",
                                            verticalAlign: "top",
                                        }}
                                    >
                                        {hotTint(i)}
                                        <div
                                            style={{
                                                position: "relative",
                                                height: 4,
                                                background: c,
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: "relative",
                                                padding:
                                                    padY + "px " + padX + "px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                            }}
                                        >
                                            {shape && (
                                                <span
                                                    style={{
                                                        position: "relative",
                                                        flexShrink: 0,
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: "50%",
                                                        overflow: "hidden",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                    }}
                                                >
                                                    <Tint
                                                        color={c}
                                                        opacity={0.14}
                                                    />
                                                    <svg
                                                        width={18}
                                                        height={18}
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke={c}
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                        style={{
                                                            position:
                                                                "relative",
                                                        }}
                                                    >
                                                        {shape}
                                                    </svg>
                                                </span>
                                            )}
                                            <span
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    minWidth: 0,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        ...headerFont,
                                                        fontSize: baseSize - 2,
                                                        color: c,
                                                        fontWeight: 700,
                                                        letterSpacing: "0.04em",
                                                        lineHeight: 1.2,
                                                    }}
                                                >
                                                    {String(i + 1).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                </span>
                                                <span
                                                    style={{
                                                        ...headerFont,
                                                        fontSize: baseSize + 3,
                                                        color: textColor,
                                                        lineHeight: 1.25,
                                                        overflowWrap:
                                                            "anywhere",
                                                    }}
                                                >
                                                    {s.name}
                                                </span>
                                            </span>
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>{rowKeys.map((k) => renderRow(k))}</tbody>
                </table>
            </div>
        </div>
    )
}

JourneyMapLite.displayName = "Journey Map Lite"

const ICON_OPTIONS = [
    "none",
    "search",
    "cart",
    "card",
    "box",
    "heart",
    "chat",
    "star",
    "user",
    "mail",
    "flag",
]
const ICON_TITLES = [
    "None",
    "Search",
    "Cart",
    "Card",
    "Box",
    "Heart",
    "Chat",
    "Star",
    "User",
    "Mail",
    "Flag",
]

addPropertyControls(JourneyMapLite, {
    stages: {
        type: ControlType.Array,
        title: "Stages",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Stage",
                },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ICON_OPTIONS,
                    optionTitles: ICON_TITLES,
                    defaultValue: "search",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#6366F1",
                },
                actions: {
                    type: ControlType.String,
                    title: "Actions",
                    defaultValue: "",
                    displayTextArea: true,
                    description: "One action per line.",
                },
                touchpoints: {
                    type: ControlType.String,
                    title: "Touchpoints",
                    defaultValue: "",
                    displayTextArea: true,
                    description: "Separate with commas or new lines.",
                },
                emotion: {
                    type: ControlType.Number,
                    title: "Emotion",
                    defaultValue: 0,
                    min: -2,
                    max: 2,
                    step: 0.5,
                    displayStepper: true,
                    description: "-2 upset to +2 delighted. Draws the curve.",
                },
                pains: {
                    type: ControlType.String,
                    title: "Pain points",
                    defaultValue: "",
                    displayTextArea: true,
                    description: "One pain point per line.",
                },
            },
        },
        maxCount: MAX_STAGES,
        defaultValue: SAMPLE,
    },
    showActions: {
        type: ControlType.Boolean,
        title: "Actions",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showTouchpoints: {
        type: ControlType.Boolean,
        title: "Touchpoints",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showEmotion: {
        type: ControlType.Boolean,
        title: "Emotion",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showPains: {
        type: ControlType.Boolean,
        title: "Pain points",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    hoverHighlight: {
        type: ControlType.Boolean,
        title: "Hover Column",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showIcons: {
        type: ControlType.Boolean,
        title: "Stage Icons",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showScores: {
        type: ControlType.Boolean,
        title: "Mood Labels",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    positiveColor: {
        type: ControlType.Color,
        title: "Curve Positive",
        defaultValue: "#10B981",
    },
    negativeColor: {
        type: ControlType.Color,
        title: "Curve Negative",
        defaultValue: "#F43F5E",
    },
    surfaceColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Column",
        defaultValue: "#F5F6F8",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#14151A",
    },
    subColor: {
        type: ControlType.Color,
        title: "Sub Text",
        defaultValue: "#6B6F7B",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(20, 21, 26, 0.09)",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            lineHeight: "1.4em",
        },
    },
    headerFont: {
        type: ControlType.Font,
        title: "Header Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Semibold",
            lineHeight: "1.3em",
        },
        description: "Created by BrandingUp",
    },
})
