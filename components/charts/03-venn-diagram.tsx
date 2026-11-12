// [생성일] 2026-10-02
// [경위] 달러벌기 03번 상품(무료) — 벤 다이어그램. 원 2~3개의 겹친 칸마다 이름·설명, 칸 단위 호버 강조
// [변경이력]
//   - 2026-10-02: 최초 생성 (2/3개 원 + 7칸 이름표 자동 배치 + 칸 호버 강조·캡션 + 채움 3종 + 등장 애니메이션 1회)

import { useEffect, useId, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactElement } from "react"
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
type Key = "a" | "b" | "c"

interface SetInfo {
    label?: string
    note?: string
    color?: string
    detail?: string
}

interface RegionInfo {
    label?: string
    detail?: string
}

interface Appearance {
    textColor?: string
    subColor?: string
    strokeWidth?: number
    highlight?: string
    captionColor?: string
}

interface VennProps {
    count?: "2" | "3"
    setA?: SetInfo
    setB?: SetInfo
    setC?: SetInfo
    overlapAB?: RegionInfo
    overlapAC?: RegionInfo
    overlapBC?: RegionInfo
    center?: RegionInfo
    overlap?: number
    fillStyle?: "tint" | "blend" | "outline"
    hoverHighlight?: boolean
    showCaption?: boolean
    captionText?: string
    entrance?: boolean
    appearance?: Appearance
    labelFont?: any
    noteFont?: any
    regionFont?: any
    captionFont?: any
    style?: CSSProperties
}

interface Circle {
    key: Key
    x: number
    y: number
}

// ─────────────────────────────────────────────
// 샘플 (설치 즉시 보이는 기본 내용)
// ─────────────────────────────────────────────
const SAMPLE_A: SetInfo = { label: "Design", note: "Brand & UI", color: "#2DE5A0", detail: "Design — identity, UI and visual systems." }
const SAMPLE_B: SetInfo = { label: "Development", note: "Framer & code", color: "#6C8CFF", detail: "Development — fast, responsive sites built in Framer." }
const SAMPLE_C: SetInfo = { label: "Marketing", note: "Growth & content", color: "#FF8A65", detail: "Marketing — content and campaigns that bring visitors." }
const SAMPLE_AB: RegionInfo = { label: "Product", detail: "Product — design and code shipped together." }
const SAMPLE_AC: RegionInfo = { label: "Branding", detail: "Branding — a look and a message people remember." }
const SAMPLE_BC: RegionInfo = { label: "Growth", detail: "Growth — landing pages that are built to convert." }
const SAMPLE_CENTER: RegionInfo = { label: "Sweet spot", detail: "Sweet spot — where all three meet. This is where we work best." }

const R = 200 // 원 반지름 (SVG 좌표 단위 — 글자 크기도 이 기준으로 함께 확대·축소)

// ─────────────────────────────────────────────
// 기하 계산
// ─────────────────────────────────────────────

// 원 중심 좌표. 겹침(%)이 클수록 중심 간 거리가 가까워짐
function layoutCircles(count: "2" | "3", overlap: number): Circle[] {
    const o = Math.min(80, Math.max(10, overlap)) / 100
    const d = 2 * R * (1 - o)
    if (count === "2") {
        return [
            { key: "a", x: -d / 2, y: 0 },
            { key: "b", x: d / 2, y: 0 },
        ]
    }
    // 정삼각형 배치 (무게중심 = 원점): A 왼쪽 위, B 오른쪽 위, C 아래
    const h = d / (2 * Math.sqrt(3))
    return [
        { key: "a", x: -d / 2, y: -h },
        { key: "b", x: d / 2, y: -h },
        { key: "c", x: 0, y: 2 * h },
    ]
}

// 한 점이 어느 칸에 속하는지 → "a", "ab", "abc" 같은 키 (어느 원에도 없으면 "")
function regionAt(px: number, py: number, circles: Circle[]): string {
    return circles
        .filter((c) => (px - c.x) * (px - c.x) + (py - c.y) * (py - c.y) <= R * R)
        .map((c) => c.key)
        .join("")
}

// 칸 이름표 위치: 칸의 "바깥 방향"으로 광선을 쏴서 그 칸에 속하는 구간의 가운데를 고른다
function labelPosition(key: string, circles: Circle[]): { x: number; y: number } | null {
    const members = circles.filter((c) => key.includes(c.key))
    // 모든 원이 겹치는 칸(2개면 "ab", 3개면 "abc")은 원점이 기준
    if (members.length === circles.length) {
        return regionAt(0, 0, circles) === key ? { x: 0, y: 0 } : null
    }
    const mx = members.reduce((s, c) => s + c.x, 0) / members.length
    const my = members.reduce((s, c) => s + c.y, 0) / members.length
    const len = Math.hypot(mx, my) || 1
    const ux = mx / len
    const uy = my / len
    let tMin = -1
    let tMax = -1
    for (let t = 0; t <= 2 * R; t += R / 100) {
        if (regionAt(ux * t, uy * t, circles) === key) {
            if (tMin < 0) tMin = t
            tMax = t
        }
    }
    if (tMin < 0) return null // 겹침이 작아 칸 자체가 없음
    const t = (tMin + tMax) / 2
    return { x: ux * t, y: uy * t }
}

/**
 * 벤 다이어그램 (Venn Diagram) — 원 2~3개의 겹친 칸마다 이름·설명을 달고, 칸에 마우스를 올리면 강조
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 680
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function VennDiagram(props: VennProps) {
    const {
        count = "3",
        setA = SAMPLE_A,
        setB = SAMPLE_B,
        setC = SAMPLE_C,
        overlapAB = SAMPLE_AB,
        overlapAC = SAMPLE_AC,
        overlapBC = SAMPLE_BC,
        center = SAMPLE_CENTER,
        overlap = 40,
        fillStyle = "tint",
        hoverHighlight = true,
        showCaption = true,
        captionText = "Hover an area to learn more.",
        entrance = true,
        appearance,
        labelFont,
        noteFont,
        regionFont,
        captionFont,
        style,
    } = props

    // 색·모양 기본값
    const theme = {
        textColor: appearance?.textColor ?? "#111114",
        subColor: appearance?.subColor ?? "#6B6B76",
        strokeWidth: appearance?.strokeWidth ?? 1.5,
        highlight: appearance?.highlight ?? "rgba(17, 17, 20, 0.14)",
        captionColor: appearance?.captionColor ?? "#44444C",
    }

    const isStatic = useIsStaticRenderer() // 캔버스·정적 렌더에서는 애니메이션 없이 완성 상태
    const uid = "vn" + useId().replace(/[:]/g, "")
    const rootRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)

    const circles = useMemo(() => layoutCircles(count, overlap), [count, overlap])
    const sets: Record<Key, SetInfo> = { a: setA, b: setB, c: setC }

    // 칸 키 → 이름·설명
    const regionInfo = (key: string): RegionInfo => {
        if (key.length === 1) return { label: sets[key as Key]?.label, detail: sets[key as Key]?.detail }
        if (key === "ab") return overlapAB
        if (key === "ac") return overlapAC
        if (key === "bc") return overlapBC
        if (key === "abc") return center
        return {}
    }

    // 이름표를 달 칸 목록 (원 개수에 따라)
    const regionKeys = count === "2" ? ["ab"] : ["ab", "ac", "bc", "abc"]

    // 이름표 위치 (원 배치가 바뀔 때만 다시 계산)
    const positions = useMemo(() => {
        const map: Record<string, { x: number; y: number } | null> = {}
        circles.forEach((c) => (map[c.key] = labelPosition(c.key, circles)))
        regionKeys.forEach((k) => (map[k] = labelPosition(k, circles)))
        return map
    }, [circles])

    // ── 마우스를 올린 칸 ──
    const [hovered, setHovered] = useState("")
    const active = hoverHighlight && !isStatic ? hovered : ""

    // 화면 좌표 → SVG 좌표로 바꿔 어느 칸인지 계산
    const regionFromEvent = (e: { clientX: number; clientY: number }) => {
        const svg = svgRef.current
        const ctm = svg?.getScreenCTM()
        if (!svg || !ctm) return ""
        const pt = svg.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY
        const p = pt.matrixTransform(ctm.inverse())
        return regionAt(p.x, p.y, circles)
    }
    const onMove = (e: ReactPointerEvent) => {
        if (!hoverHighlight || e.pointerType === "touch") return
        const key = regionFromEvent(e)
        if (key !== hovered) startTransition(() => setHovered(key))
    }
    // 모바일: 탭으로 선택 (같은 칸을 다시 탭하면 해제)
    const onTap = (e: ReactMouseEvent) => {
        if (!hoverHighlight) return
        const key = regionFromEvent(e)
        startTransition(() => setHovered(key === hovered ? "" : key))
    }

    // ── 등장 애니메이션: 화면에 처음 들어올 때 한 번만 (반복 없음) ──
    const [entered, setEntered] = useState(!entrance)
    useEffect(() => {
        if (!entrance) {
            setEntered(true)
            return
        }
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setEntered(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    startTransition(() => setEntered(true))
                    io.disconnect()
                }
            },
            { threshold: 0.2 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [entrance])
    const shown = entered || isStatic

    // ── 그림 영역 (원 전체 + 선 두께 여유) ──
    const pad = theme.strokeWidth + 4
    const minX = Math.min(...circles.map((c) => c.x)) - R - pad
    const maxX = Math.max(...circles.map((c) => c.x)) + R + pad
    const minY = Math.min(...circles.map((c) => c.y)) - R - pad
    const maxY = Math.max(...circles.map((c) => c.y)) + R + pad

    // 채움 방식
    const fillOpacity = fillStyle === "outline" ? 0 : fillStyle === "blend" ? 0.55 : 0.22
    const dim = active ? 0.55 : 1 // 강조 중이면 나머지는 옅게

    // 캡션 내용
    const activeInfo = active ? regionInfo(active) : null
    const caption = activeInfo ? activeInfo.detail || activeInfo.label || "" : captionText

    // 강조할 칸 모양: 포함된 원으로 자르고(clip), 포함되지 않은 원은 가린다(mask)
    const renderHighlight = () => {
        if (!active) return null
        let node: ReactElement = (
            <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill={theme.highlight} />
        )
        circles
            .filter((c) => !active.includes(c.key))
            .forEach((c) => {
                node = <g mask={`url(#${uid}-out-${c.key})`}>{node}</g>
            })
        circles
            .filter((c) => active.includes(c.key))
            .forEach((c) => {
                node = <g clipPath={`url(#${uid}-clip-${c.key})`}>{node}</g>
            })
        return <g style={{ pointerEvents: "none" }}>{node}</g>
    }

    const label = [setA.label, setB.label, count === "3" ? setC.label : ""].filter(Boolean).join(", ")

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
            }}
        >
            <svg
                ref={svgRef}
                viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={"Venn diagram: " + label}
                onPointerMove={onMove}
                onPointerLeave={() => hovered && startTransition(() => setHovered(""))}
                onClick={onTap}
                style={{
                    flex: 1,
                    minHeight: 0,
                    width: "100%",
                    overflow: "visible",
                    isolation: "isolate",
                    cursor: hoverHighlight && active ? "pointer" : "default",
                    WebkitTapHighlightColor: "transparent",
                }}
            >
                {/* 칸 강조용 자르기·가리기 정의 */}
                <defs>
                    {circles.map((c) => (
                        <clipPath key={"clip" + c.key} id={`${uid}-clip-${c.key}`}>
                            <circle cx={c.x} cy={c.y} r={R} />
                        </clipPath>
                    ))}
                    {circles.map((c) => (
                        <mask
                            key={"mask" + c.key}
                            id={`${uid}-out-${c.key}`}
                            maskUnits="userSpaceOnUse"
                            x={minX}
                            y={minY}
                            width={maxX - minX}
                            height={maxY - minY}
                        >
                            <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill="white" />
                            <circle cx={c.x} cy={c.y} r={R} fill="black" />
                        </mask>
                    ))}
                </defs>

                {/* 원 — 등장 시 바깥에서 모여든다 */}
                {circles.map((c, i) => {
                    const color = sets[c.key]?.color || "#999999"
                    const len = Math.hypot(c.x, c.y) || 1
                    const ox = shown ? 0 : (c.x / len) * R * 0.45
                    const oy = shown ? 0 : (c.y / len) * R * 0.45
                    return (
                        <g
                            key={c.key}
                            style={{
                                transform: `translate(${ox}px, ${oy}px)`,
                                opacity: shown ? 1 : 0,
                                transition: isStatic
                                    ? undefined
                                    : `transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 80}ms, opacity 600ms ease ${i * 80}ms`,
                            }}
                        >
                            <circle
                                cx={c.x}
                                cy={c.y}
                                r={R}
                                fill={color}
                                fillOpacity={fillOpacity * dim}
                                stroke={color}
                                strokeWidth={theme.strokeWidth}
                                style={{
                                    mixBlendMode: fillStyle === "blend" ? "multiply" : "normal",
                                    transition: "fill-opacity 200ms ease",
                                }}
                            />
                        </g>
                    )
                })}

                {renderHighlight()}

                {/* 이름표 — 원 이름(+보조 문구), 겹친 칸 이름 */}
                <g
                    style={{
                        pointerEvents: "none",
                        opacity: shown ? 1 : 0,
                        transition: isStatic ? undefined : "opacity 500ms ease 650ms",
                    }}
                >
                    {circles.map((c) => {
                        const pos = positions[c.key]
                        const info = sets[c.key]
                        if (!pos || !info?.label) return null
                        return (
                            <text key={"t" + c.key} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central">
                                <tspan x={pos.x} dy={info.note ? "-0.35em" : 0} fill={theme.textColor} style={{ ...labelFont }}>
                                    {info.label}
                                </tspan>
                                {info.note ? (
                                    <tspan x={pos.x} dy="1.5em" fill={theme.subColor} style={{ ...noteFont }}>
                                        {info.note}
                                    </tspan>
                                ) : null}
                            </text>
                        )
                    })}
                    {regionKeys.map((k) => {
                        const pos = positions[k]
                        const info = regionInfo(k)
                        if (!pos || !info?.label) return null
                        return (
                            <text
                                key={"r" + k}
                                x={pos.x}
                                y={pos.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={theme.textColor}
                                style={{ ...regionFont }}
                            >
                                {info.label}
                            </text>
                        )
                    })}
                </g>
            </svg>

            {/* 캡션 — 강조한 칸의 설명 */}
            {showCaption && (
                <div
                    aria-live="polite"
                    style={{
                        ...captionFont,
                        color: theme.captionColor,
                        textAlign: "center",
                        minHeight: "1.5em",
                        maxWidth: "100%",
                        flexShrink: 0,
                    }}
                >
                    {caption}
                </div>
            )}
        </div>
    )
}

VennDiagram.displayName = "Venn Diagram"

// 원 하나의 속성 묶음
const setControls = (label: string, note: string, color: string, detail: string) => ({
    label: { type: ControlType.String as const, title: "Label", defaultValue: label },
    note: { type: ControlType.String as const, title: "Note", defaultValue: note },
    color: { type: ControlType.Color as const, title: "Color", defaultValue: color },
    detail: {
        type: ControlType.String as const,
        title: "Detail",
        defaultValue: detail,
        displayTextArea: true,
        description: "Shown in the caption when this area is hovered or tapped.",
    },
})

// 겹친 칸 하나의 속성 묶음
const regionControls = (label: string, detail: string) => ({
    label: { type: ControlType.String as const, title: "Label", defaultValue: label },
    detail: { type: ControlType.String as const, title: "Detail", defaultValue: detail, displayTextArea: true },
})

addPropertyControls(VennDiagram, {
    count: {
        type: ControlType.Enum,
        title: "Circles",
        options: ["2", "3"],
        optionTitles: ["2", "3"],
        defaultValue: "3",
        displaySegmentedControl: true,
    },
    setA: {
        type: ControlType.Object,
        title: "Circle A",
        controls: setControls(SAMPLE_A.label!, SAMPLE_A.note!, SAMPLE_A.color!, SAMPLE_A.detail!),
    },
    setB: {
        type: ControlType.Object,
        title: "Circle B",
        controls: setControls(SAMPLE_B.label!, SAMPLE_B.note!, SAMPLE_B.color!, SAMPLE_B.detail!),
    },
    setC: {
        type: ControlType.Object,
        title: "Circle C",
        controls: setControls(SAMPLE_C.label!, SAMPLE_C.note!, SAMPLE_C.color!, SAMPLE_C.detail!),
        hidden: (p: VennProps) => p.count === "2",
    },
    overlapAB: {
        type: ControlType.Object,
        title: "A ∩ B",
        controls: regionControls(SAMPLE_AB.label!, SAMPLE_AB.detail!),
    },
    overlapAC: {
        type: ControlType.Object,
        title: "A ∩ C",
        controls: regionControls(SAMPLE_AC.label!, SAMPLE_AC.detail!),
        hidden: (p: VennProps) => p.count === "2",
    },
    overlapBC: {
        type: ControlType.Object,
        title: "B ∩ C",
        controls: regionControls(SAMPLE_BC.label!, SAMPLE_BC.detail!),
        hidden: (p: VennProps) => p.count === "2",
    },
    center: {
        type: ControlType.Object,
        title: "Center",
        controls: regionControls(SAMPLE_CENTER.label!, SAMPLE_CENTER.detail!),
        hidden: (p: VennProps) => p.count === "2",
    },
    overlap: {
        type: ControlType.Number,
        title: "Overlap",
        defaultValue: 40,
        min: 10,
        max: 80,
        step: 1,
        unit: "%",
        description: "How much the circles overlap. Below ~14% the center area disappears.",
    },
    fillStyle: {
        type: ControlType.Enum,
        title: "Fill",
        options: ["tint", "blend", "outline"],
        optionTitles: ["Tint", "Blend", "Outline"],
        defaultValue: "tint",
        displaySegmentedControl: true,
        description: "Blend mixes colors where circles overlap (best on light backgrounds).",
    },
    hoverHighlight: {
        type: ControlType.Boolean,
        title: "Hover Highlight",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showCaption: {
        type: ControlType.Boolean,
        title: "Caption",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    captionText: {
        type: ControlType.String,
        title: "Caption Text",
        defaultValue: "Hover an area to learn more.",
        hidden: (p: VennProps) => !p.showCaption,
    },
    entrance: {
        type: ControlType.Boolean,
        title: "Entrance",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Circles glide in once when the diagram scrolls into view.",
    },
    appearance: {
        type: ControlType.Object,
        title: "Style",
        icon: "color",
        controls: {
            textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            subColor: { type: ControlType.Color, title: "Sub Text", defaultValue: "#6B6B76" },
            strokeWidth: { type: ControlType.Number, title: "Stroke", defaultValue: 1.5, min: 0, max: 8, step: 0.5, unit: "px" },
            highlight: { type: ControlType.Color, title: "Highlight", defaultValue: "rgba(17, 17, 20, 0.14)" },
            captionColor: { type: ControlType.Color, title: "Caption", defaultValue: "#44444C" },
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "22px", variant: "Semibold", letterSpacing: "-0.01em" },
        description: "Sizes are relative to a 200px circle radius and scale with the component.",
    },
    noteFont: {
        type: ControlType.Font,
        title: "Note Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Regular" },
    },
    regionFont: {
        type: ControlType.Font,
        title: "Region Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Semibold" },
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Regular", lineHeight: "1.5em" },
        description: "Created by BrandingUp",
    },
})
