// [생성일] 2026-10-02
// [경위] 달러벌기 05번 상품(무료) — 피라미드 다이어그램. 층 이름만 적으면 사다리꼴 자동 분할 + 옆 설명·지시선 + 그라데이션 자동 색칠
// [변경이력]
//   - 2026-10-02: 최초 생성 (피라미드/깔때기 + 뾰족/평평 꼭짓점 + 옆 설명 + 그라데이션·글자색 자동 + 층 호버 강조 + 등장 애니메이션 1회)
//   - 2026-10-02: 좁은 층에서 단어가 중간에 끊기던 문제 수정, 삼각형 층은 이름을 넓은 쪽으로 배치
//   - 2026-10-02: 좁은 화면(Compact Below 미만)에서는 옆 설명 대신 피라미드 전체 폭 + 아래 캡션(탭한 층 설명)

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
interface Layer {
    label?: string
    note?: string
    color?: string
}

interface Appearance {
    noteColor?: string
    lineColor?: string
    lightText?: string
    darkText?: string
}

interface PyramidProps {
    layers?: Layer[]
    shape?: "pyramid" | "funnel"
    tip?: "point" | "flat"
    colorMode?: "gradient" | "custom"
    topColor?: string
    bottomColor?: string
    gap?: number
    sideNotes?: boolean
    notesWidth?: number
    compactBelow?: number
    tapHint?: string
    hoverHighlight?: boolean
    entrance?: boolean
    appearance?: Appearance
    layerFont?: any
    noteFont?: any
    style?: CSSProperties
}

// ─────────────────────────────────────────────
// 샘플 — 브랜드 피라미드 (위 → 아래)
// ─────────────────────────────────────────────
const SAMPLE: Layer[] = [
    { label: "Essence", note: "The single idea your brand stands for.", color: "#0F1A17" },
    { label: "Personality", note: "How the brand speaks, looks and behaves.", color: "#155E4A" },
    { label: "Emotional Benefits", note: "How customers feel when they choose you.", color: "#1E9C76" },
    { label: "Functional Benefits", note: "What the product does better than others.", color: "#27C98E" },
    { label: "Attributes", note: "The concrete features and proof points.", color: "#2DE5A0" },
]

// ─────────────────────────────────────────────
// 색 계산
// ─────────────────────────────────────────────

// "#RRGGBB" / "#RGB" / "rgb(a)()" → [r, g, b]. 프레이머는 rgb()/rgba() 형식으로 넘기기도 함
function toRgb(color: string): [number, number, number] {
    const m = typeof color === "string" ? color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i) : null
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])]
    if (typeof color === "string" && color.charAt(0) === "#") {
        let h = color.slice(1)
        if (h.length === 3) h = h.split("").map((c) => c + c).join("")
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
    }
    return [128, 128, 128]
}

// 두 색 사이 중간색 (t: 0~1)
function mix(a: string, b: string, t: number) {
    const x = toRgb(a)
    const y = toRgb(b)
    const c = x.map((v, i) => Math.round(v + (y[i] - v) * t))
    return "rgb(" + c[0] + ", " + c[1] + ", " + c[2] + ")"
}

// 배경이 밝은지 (글자를 검정/흰색 중 무엇으로 쓸지)
function isLight(color: string) {
    const [r, g, b] = toRgb(color)
    return 0.299 * r + 0.587 * g + 0.114 * b > 150
}

/**
 * 피라미드 다이어그램 (Pyramid Diagram) — 층 목록을 피라미드/깔때기로 그리고 옆에 설명을 단다
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 820
 * @framerIntrinsicHeight 520
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PyramidDiagram(props: PyramidProps) {
    const {
        layers,
        shape = "pyramid",
        tip = "flat",
        colorMode = "gradient",
        topColor = "#0F1A17",
        bottomColor = "#2DE5A0",
        gap = 2,
        sideNotes = true,
        notesWidth = 46,
        compactBelow = 520,
        tapHint = "Tap a layer to learn more.",
        hoverHighlight = true,
        entrance = true,
        appearance,
        layerFont,
        noteFont,
        style,
    } = props

    // 색 기본값
    const theme = {
        noteColor: appearance?.noteColor ?? "#44444C",
        lineColor: appearance?.lineColor ?? "#C9CBD3",
        lightText: appearance?.lightText ?? "#FFFFFF",
        darkText: appearance?.darkText ?? "#111114",
    }

    const list = layers && layers.length ? layers : SAMPLE
    const n = list.length
    const isStatic = useIsStaticRenderer() // 캔버스·정적 렌더에서는 애니메이션 없이 완성 상태
    const rootRef = useRef<HTMLDivElement>(null)

    // ── 마우스를 올린(모바일은 탭한) 층 ──
    const [active, setActive] = useState(-1)
    const hl = hoverHighlight && !isStatic ? active : -1

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

    // ── 좁은 화면 감지: 폭이 compactBelow 미만이면 옆 설명 대신 아래 캡션으로 ──
    const [compact, setCompact] = useState(false)
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const next = entries[0].contentRect.width < compactBelow
            startTransition(() => setCompact(next))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [compactBelow])
    const side = sideNotes && !compact // 옆 설명 표시 여부
    const caption = sideNotes && compact && list.some((l) => l.note) // 아래 캡션 표시 여부

    // ── 도형 계산 (SVG 0~100 좌표, 가로세로 자유 늘림) ──
    const pyrW = side ? 100 - Math.min(60, Math.max(30, notesWidth)) : 100 // 피라미드가 차지하는 폭(%)
    const flatW = tip === "flat" ? 0.14 : 0 // 꼭짓점 폭 (전체 폭 대비)
    // 높이 위치 t(0=위, 1=아래)에서의 폭 비율
    const widthAt = (t: number) => (shape === "funnel" ? 1 - (1 - flatW) * t : flatW + (1 - flatW) * t)
    const g = Math.min(6, Math.max(0, gap)) / 100 / 2

    const geo = list.map((layer, i) => {
        const a = i / n + (i === 0 ? 0 : g)
        const b = (i + 1) / n - (i === n - 1 ? 0 : g)
        const wa = widthAt(a) * 50
        const wb = widthAt(b) * 50
        const mid = (a + b) / 2
        // 이름 위치: 뾰족한 끝 층(삼각형)은 좁은 가운데 대신 넓은 쪽으로 내려 배치
        const pointed = tip === "point" && ((shape === "pyramid" && i === 0) || (shape === "funnel" && i === n - 1))
        const labelT = pointed ? (shape === "pyramid" ? a + (b - a) * 0.68 : a + (b - a) * 0.32) : mid
        const color =
            colorMode === "custom" && layer.color ? layer.color : mix(topColor, bottomColor, n === 1 ? 0 : i / (n - 1))
        return {
            points: `${50 - wa},${a * 100} ${50 + wa},${a * 100} ${50 + wb},${b * 100} ${50 - wb},${b * 100}`,
            mid,
            labelT,
            edge: 50 + widthAt(mid) * 50, // 층 가운데 높이에서 오른쪽 끝 (지시선 시작점)
            color,
        }
    })

    // 층 위에 마우스/탭
    const enter = (i: number) => hoverHighlight && !isStatic && startTransition(() => setActive(i))
    const leave = () => startTransition(() => setActive(-1))
    const tap = (i: number) => hoverHighlight && startTransition(() => setActive(active === i ? -1 : i))

    return (
        <div
            ref={rootRef}
            role="figure"
            aria-label={"Pyramid diagram: " + list.map((l) => l.label).filter(Boolean).join(", ")}
            style={{ ...style, position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}
            onPointerLeave={leave}
        >
            <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
            {/* 층 도형 */}
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ position: "absolute", left: 0, top: 0, width: pyrW + "%", height: "100%", overflow: "visible" }}
            >
                {geo.map((s, i) => (
                    <polygon
                        key={i}
                        points={s.points}
                        fill={s.color}
                        onPointerEnter={(e) => e.pointerType !== "touch" && enter(i)}
                        onClick={() => tap(i)}
                        style={{
                            cursor: hoverHighlight ? "pointer" : "default",
                            opacity: shown ? (hl >= 0 && hl !== i ? 0.4 : 1) : 0,
                            transform: shown ? "translateY(0)" : "translateY(-4px)",
                            transition: isStatic
                                ? undefined
                                : `opacity 450ms ease ${shown && hl < 0 ? i * 90 : 0}ms, transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 90}ms`,
                        }}
                    />
                ))}
            </svg>

            {/* 층 이름 (도형 위, 배경 밝기에 맞춰 글자색 자동) */}
            {list.map((layer, i) =>
                layer.label ? (
                    <div
                        key={"l" + i}
                        style={{
                            ...layerFont,
                            position: "absolute",
                            left: pyrW / 2 + "%",
                            top: geo[i].labelT * 100 + "%",
                            transform: "translate(-50%, -50%)",
                            maxWidth: pyrW * widthAt(geo[i].labelT) * 0.92 + "%",
                            textAlign: "center",
                            color: isLight(geo[i].color) ? theme.darkText : theme.lightText,
                            pointerEvents: "none",
                            opacity: shown ? (hl >= 0 && hl !== i ? 0.5 : 1) : 0,
                            transition: isStatic ? undefined : `opacity 400ms ease ${shown && hl < 0 ? 300 + i * 90 : 0}ms`,
                            overflowWrap: "normal", // 단어 중간에서 끊지 않음 (공백에서만 줄바꿈)
                            width: "max-content",
                        }}
                    >
                        {layer.label}
                    </div>
                ) : null
            )}

            {/* 옆 설명 + 점선 지시선 */}
            {side &&
                list.map((layer, i) =>
                    layer.note ? (
                        <div key={"n" + i}>
                            <div
                                style={{
                                    position: "absolute",
                                    left: (pyrW * geo[i].edge) / 100 + 1.5 + "%",
                                    width: pyrW + 3 - ((pyrW * geo[i].edge) / 100 + 1.5) + "%",
                                    top: geo[i].mid * 100 + "%",
                                    borderTop: `1px dashed ${theme.lineColor}`,
                                    opacity: shown ? (hl >= 0 && hl !== i ? 0.35 : 1) : 0,
                                    transition: isStatic ? undefined : `opacity 400ms ease ${shown && hl < 0 ? 400 + i * 90 : 0}ms`,
                                }}
                            />
                            <div
                                onPointerEnter={(e) => e.pointerType !== "touch" && enter(i)}
                                onClick={() => tap(i)}
                                style={{
                                    ...noteFont,
                                    position: "absolute",
                                    left: pyrW + 4 + "%",
                                    right: 0,
                                    top: geo[i].mid * 100 + "%",
                                    transform: "translateY(-50%)",
                                    color: theme.noteColor,
                                    cursor: hoverHighlight ? "pointer" : "default",
                                    opacity: shown ? (hl >= 0 && hl !== i ? 0.35 : 1) : 0,
                                    transition: isStatic ? undefined : `opacity 400ms ease ${shown && hl < 0 ? 400 + i * 90 : 0}ms`,
                                }}
                            >
                                {layer.note}
                            </div>
                        </div>
                    ) : null
                )}
            </div>

            {/* 좁은 화면: 선택한 층의 설명을 아래에 표시 */}
            {caption && (
                <div
                    aria-live="polite"
                    style={{
                        ...noteFont,
                        color: theme.noteColor,
                        textAlign: "center",
                        minHeight: "3em",
                        flexShrink: 0,
                    }}
                >
                    {hl >= 0 && list[hl]?.note ? (
                        <>
                            <strong style={{ color: theme.darkText }}>{list[hl].label}</strong>
                            {" — " + list[hl].note}
                        </>
                    ) : (
                        tapHint
                    )}
                </div>
            )}
        </div>
    )
}

PyramidDiagram.displayName = "Pyramid Diagram"

addPropertyControls(PyramidDiagram, {
    layers: {
        type: ControlType.Array,
        title: "Layers",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Layer" },
                note: { type: ControlType.String, title: "Note", defaultValue: "", displayTextArea: true },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#2DE5A0",
                    description: "Used when Colors is set to Custom.",
                },
            },
        },
        defaultValue: SAMPLE,
        description: "Top to bottom.",
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["pyramid", "funnel"],
        optionTitles: ["Pyramid", "Funnel"],
        defaultValue: "pyramid",
        displaySegmentedControl: true,
    },
    tip: {
        type: ControlType.Enum,
        title: "Tip",
        options: ["point", "flat"],
        optionTitles: ["Point", "Flat"],
        defaultValue: "flat",
        displaySegmentedControl: true,
    },
    colorMode: {
        type: ControlType.Enum,
        title: "Colors",
        options: ["gradient", "custom"],
        optionTitles: ["Gradient", "Custom"],
        defaultValue: "gradient",
        displaySegmentedControl: true,
        description: "Gradient blends Top → Bottom automatically. Text color adapts to each layer.",
    },
    topColor: {
        type: ControlType.Color,
        title: "Top Color",
        defaultValue: "#0F1A17",
        hidden: (p: PyramidProps) => p.colorMode === "custom",
    },
    bottomColor: {
        type: ControlType.Color,
        title: "Bottom Color",
        defaultValue: "#2DE5A0",
        hidden: (p: PyramidProps) => p.colorMode === "custom",
    },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 2, min: 0, max: 6, step: 0.5, unit: "%" },
    sideNotes: { type: ControlType.Boolean, title: "Side Notes", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    notesWidth: {
        type: ControlType.Number,
        title: "Notes Width",
        defaultValue: 46,
        min: 30,
        max: 60,
        step: 1,
        unit: "%",
        hidden: (p: PyramidProps) => !p.sideNotes,
    },
    compactBelow: {
        type: ControlType.Number,
        title: "Compact Below",
        defaultValue: 520,
        min: 0,
        max: 1200,
        step: 10,
        unit: "px",
        hidden: (p: PyramidProps) => !p.sideNotes,
        description: "Narrower than this, notes move into a caption under the pyramid (tap a layer to read it).",
    },
    tapHint: {
        type: ControlType.String,
        title: "Tap Hint",
        defaultValue: "Tap a layer to learn more.",
        hidden: (p: PyramidProps) => !p.sideNotes,
    },
    hoverHighlight: { type: ControlType.Boolean, title: "Hover Highlight", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    entrance: {
        type: ControlType.Boolean,
        title: "Entrance",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Layers stack in once when the diagram scrolls into view.",
    },
    appearance: {
        type: ControlType.Object,
        title: "Style",
        icon: "color",
        controls: {
            noteColor: { type: ControlType.Color, title: "Note", defaultValue: "#44444C" },
            lineColor: { type: ControlType.Color, title: "Line", defaultValue: "#C9CBD3" },
            lightText: { type: ControlType.Color, title: "Light Text", defaultValue: "#FFFFFF" },
            darkText: { type: ControlType.Color, title: "Dark Text", defaultValue: "#111114" },
        },
    },
    layerFont: {
        type: ControlType.Font,
        title: "Layer Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Semibold", lineHeight: "1.25em" },
    },
    noteFont: {
        type: ControlType.Font,
        title: "Note Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Regular", lineHeight: "1.45em" },
        description: "Created by BrandingUp",
    },
})
