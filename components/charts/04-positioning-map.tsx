// [생성일] 2026-10-02
// [경위] 달러벌기 04번 상품(무료) — 2×2 포지셔닝 맵. 항목마다 X·Y 좌표만 넣으면 칩 자동 배치, "우리" 강조·호버 툴팁
// [변경이력]
//   - 2026-10-02: 최초 생성 (십자 축 + 네 끝 라벨 + 사분면 이름·강조 + 칩/점 표시 + Featured 강조 + 툴팁 + 등장 애니메이션 1회)
//   - 2026-10-02: 휴대폰 폭에서 사분면 이름이 가운데 축 라벨에 가려지던 문제 수정 (최대 폭 제한·줄바꿈)

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
interface Item {
    name?: string
    note?: string
    x?: number
    y?: number
    logo?: { src?: string; srcSet?: string; alt?: string }
    color?: string
    featured?: boolean
}

interface Quadrants {
    topLeft?: string
    topRight?: string
    bottomLeft?: string
    bottomRight?: string
}

interface Appearance {
    background?: string
    gridColor?: string
    axisColor?: string
    textColor?: string
    subColor?: string
    chipColor?: string
    accent?: string
    radius?: number
}

interface PositioningMapProps {
    items?: Item[]
    axisLeft?: string
    axisRight?: string
    axisBottom?: string
    axisTop?: string
    quadrants?: Quadrants
    highlight?: "none" | "tl" | "tr" | "bl" | "br"
    marker?: "chip" | "dot"
    tooltips?: boolean
    entrance?: boolean
    appearance?: Appearance
    labelFont?: any
    axisFont?: any
    quadrantFont?: any
    style?: CSSProperties
}

// ─────────────────────────────────────────────
// 샘플 (설치 즉시 보이는 기본 내용)
// ─────────────────────────────────────────────
const SAMPLE: Item[] = [
    { name: "Your Brand", note: "Powerful features that still feel simple.", x: 80, y: 82, color: "#2DE5A0", featured: true },
    { name: "Legacy Suite", note: "Every feature, but a steep learning curve.", x: 22, y: 78, color: "#6C8CFF", featured: false },
    { name: "Big Corp", note: "Capable, yet slow to set up.", x: 38, y: 62, color: "#A78BFA", featured: false },
    { name: "Spreadsheet", note: "Flexible but manual and error-prone.", x: 26, y: 24, color: "#94A3B8", featured: false },
    { name: "Starter App", note: "Easy to start, outgrown quickly.", x: 74, y: 30, color: "#FF8A65", featured: false },
    { name: "Freebie Tool", note: "Simple, limited and ad-supported.", x: 58, y: 14, color: "#F5B83D", featured: false },
]

const SAMPLE_QUADRANTS: Quadrants = {
    topLeft: "Powerful but complex",
    topRight: "Leaders",
    bottomLeft: "Niche",
    bottomRight: "Simple but limited",
}

// 색상에 투명도를 입혀 rgba 로 변환. 프레이머는 rgb()/rgba() 형식으로 넘기기도 함
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

// 이름에서 이니셜 1~2글자 (로고가 없을 때)
function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const clamp = (v: number) => Math.min(100, Math.max(0, v))

/**
 * 포지셔닝 맵 (Positioning Map) — 2×2 사분면에 경쟁사·제품을 배치하고 "우리"를 강조
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PositioningMap(props: PositioningMapProps) {
    const {
        items,
        axisLeft = "Hard to use",
        axisRight = "Easy to use",
        axisBottom = "Basic",
        axisTop = "Powerful",
        quadrants = SAMPLE_QUADRANTS,
        highlight = "tr",
        marker = "chip",
        tooltips = true,
        entrance = true,
        appearance,
        labelFont,
        axisFont,
        quadrantFont,
        style,
    } = props

    // 색·모양 기본값
    const theme = {
        background: appearance?.background ?? "#FFFFFF",
        gridColor: appearance?.gridColor ?? "rgba(17, 17, 20, 0.06)",
        axisColor: appearance?.axisColor ?? "#C9CBD3",
        textColor: appearance?.textColor ?? "#111114",
        subColor: appearance?.subColor ?? "#6B6B76",
        chipColor: appearance?.chipColor ?? "#FFFFFF",
        accent: appearance?.accent ?? "#2DE5A0",
        radius: appearance?.radius ?? 20,
    }

    const list = items && items.length ? items : SAMPLE
    const isStatic = useIsStaticRenderer() // 캔버스·정적 렌더에서는 애니메이션 없이 완성 상태
    const rootRef = useRef<HTMLDivElement>(null)

    // ── 마우스를 올린(모바일은 탭한) 항목 ──
    const [active, setActive] = useState(-1)
    const showTip = (i: number) => tooltips && !isStatic && startTransition(() => setActive(i))
    const hideTip = () => startTransition(() => setActive(-1))

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

    // 강조 사분면 위치
    const hl: Record<string, CSSProperties> = {
        tl: { left: 0, top: 0 },
        tr: { right: 0, top: 0 },
        bl: { left: 0, bottom: 0 },
        br: { right: 0, bottom: 0 },
    }

    // 축 끝 라벨 공통 스타일 (축 선 위에 배경색으로 얹음)
    const axisLabel: CSSProperties = {
        ...axisFont,
        position: "absolute",
        color: theme.subColor,
        background: theme.background,
        padding: "2px 8px",
        whiteSpace: "nowrap",
        zIndex: 1,
    }

    // 사분면 이름 공통 스타일
    const quadLabel: CSSProperties = {
        ...quadrantFont,
        position: "absolute",
        color: theme.subColor,
        opacity: 0.9,
        maxWidth: "calc(50% - 60px)", // 가운데 축 라벨과 겹치지 않게 (좁은 화면에서는 줄바꿈)
        pointerEvents: "none",
    }

    return (
        <div
            ref={rootRef}
            role="figure"
            aria-label={`Positioning map: ${axisLeft} to ${axisRight}, ${axisBottom} to ${axisTop}`}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background: theme.background,
                borderRadius: theme.radius,
                overflow: "hidden",
                // 4등분 보조 격자
                backgroundImage: `linear-gradient(${theme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px)`,
                backgroundSize: "25% 25%",
                backgroundPosition: "-1px -1px",
            }}
            onPointerLeave={hideTip}
        >
            {/* 강조 사분면 (옅게 칠하기) */}
            {highlight !== "none" && (
                <div
                    style={{
                        position: "absolute",
                        width: "50%",
                        height: "50%",
                        background: withAlpha(theme.accent, 0.1),
                        ...hl[highlight],
                    }}
                />
            )}

            {/* 십자 축 */}
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: theme.axisColor }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: theme.axisColor }} />

            {/* 축 끝 라벨 */}
            {axisLeft && <div style={{ ...axisLabel, left: 12, top: "50%", transform: "translateY(-50%)" }}>{axisLeft}</div>}
            {axisRight && <div style={{ ...axisLabel, right: 12, top: "50%", transform: "translateY(-50%)" }}>{axisRight}</div>}
            {axisTop && <div style={{ ...axisLabel, top: 12, left: "50%", transform: "translateX(-50%)" }}>{axisTop}</div>}
            {axisBottom && <div style={{ ...axisLabel, bottom: 12, left: "50%", transform: "translateX(-50%)" }}>{axisBottom}</div>}

            {/* 사분면 이름 (모서리) */}
            {quadrants?.topLeft && <div style={{ ...quadLabel, left: 16, top: 14 }}>{quadrants.topLeft}</div>}
            {quadrants?.topRight && <div style={{ ...quadLabel, right: 16, top: 14, textAlign: "right" }}>{quadrants.topRight}</div>}
            {quadrants?.bottomLeft && <div style={{ ...quadLabel, left: 16, bottom: 14 }}>{quadrants.bottomLeft}</div>}
            {quadrants?.bottomRight && <div style={{ ...quadLabel, right: 16, bottom: 14, textAlign: "right" }}>{quadrants.bottomRight}</div>}

            {/* 항목 배치 영역 (가장자리 라벨과 겹치지 않게 안쪽 여백) */}
            <div style={{ position: "absolute", inset: "11% 9%" }}>
                {list.map((item, i) => {
                    const name = item.name || ""
                    const color = item.color || theme.accent
                    const featured = !!item.featured
                    const isActive = active === i
                    const src = item.logo?.src
                    const left = clamp(item.x ?? 50)
                    const top = 100 - clamp(item.y ?? 50)
                    const tipBelow = top < 22 // 위쪽 끝이면 툴팁을 아래로

                    // 로고 또는 이니셜 원
                    const avatar = src ? (
                        <img
                            src={src}
                            srcSet={item.logo?.srcSet}
                            alt={item.logo?.alt || name}
                            style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                        />
                    ) : (
                        <span
                            aria-hidden
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                flexShrink: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                background: featured ? withAlpha("#000000", 0.12) : withAlpha(color, 0.18),
                                color: featured ? theme.textColor : color,
                            }}
                        >
                            {initials(name)}
                        </span>
                    )

                    return (
                        <div
                            key={i}
                            tabIndex={tooltips ? 0 : undefined}
                            onPointerEnter={(e) => e.pointerType !== "touch" && showTip(i)}
                            onPointerLeave={(e) => e.pointerType !== "touch" && hideTip()}
                            onClick={() => tooltips && startTransition(() => setActive(isActive ? -1 : i))}
                            onFocus={() => showTip(i)}
                            onBlur={hideTip}
                            style={{
                                position: "absolute",
                                left: left + "%",
                                top: top + "%",
                                transform: `translate(-50%, -50%) scale(${shown ? 1 : 0.6})`,
                                opacity: shown ? 1 : 0,
                                transition: isStatic
                                    ? undefined
                                    : `transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 90}ms, opacity 400ms ease ${i * 90}ms`,
                                zIndex: isActive ? 5 : featured ? 3 : 2,
                                cursor: tooltips ? "pointer" : "default",
                                outline: "none",
                            }}
                        >
                            {marker === "chip" ? (
                                // 칩: 로고 + 이름
                                <div
                                    style={{
                                        ...labelFont,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "6px 12px 6px 6px",
                                        borderRadius: 999,
                                        whiteSpace: "nowrap",
                                        background: featured ? theme.accent : theme.chipColor,
                                        color: theme.textColor,
                                        border: featured ? "none" : `1px solid ${withAlpha(theme.textColor, 0.1)}`,
                                        boxShadow: featured
                                            ? `0 0 0 6px ${withAlpha(theme.accent, 0.25)}, 0 6px 18px ${withAlpha(theme.accent, 0.35)}`
                                            : "0 2px 8px rgba(0, 0, 0, 0.06)",
                                        transition: "transform 150ms ease",
                                        transformOrigin: "center",
                                        transform: isActive ? "scale(1.06)" : "scale(1)",
                                    }}
                                >
                                    {avatar}
                                    {name}
                                </div>
                            ) : (
                                // 점: 색 점 + 이름 (점이 정확한 좌표)
                                <div style={{ position: "relative", width: 14, height: 14 }}>
                                    <div
                                        style={{
                                            width: featured ? 16 : 12,
                                            height: featured ? 16 : 12,
                                            margin: featured ? -1 : 1,
                                            borderRadius: "50%",
                                            background: featured ? theme.accent : color,
                                            boxShadow: featured ? `0 0 0 6px ${withAlpha(theme.accent, 0.25)}` : "none",
                                        }}
                                    />
                                    <div
                                        style={{
                                            ...labelFont,
                                            position: "absolute",
                                            left: 22,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            whiteSpace: "nowrap",
                                            color: theme.textColor,
                                        }}
                                    >
                                        {name}
                                    </div>
                                </div>
                            )}

                            {/* 툴팁 */}
                            {tooltips && item.note && isActive && (
                                <div
                                    role="tooltip"
                                    style={{
                                        ...axisFont,
                                        position: "absolute",
                                        left: "50%",
                                        [tipBelow ? "top" : "bottom"]: "calc(100% + 10px)",
                                        transform: "translateX(-50%)",
                                        width: "max-content",
                                        maxWidth: 220,
                                        padding: "8px 12px",
                                        borderRadius: 10,
                                        background: theme.textColor,
                                        color: theme.background,
                                        textAlign: "center",
                                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
                                        pointerEvents: "none",
                                    }}
                                >
                                    {item.note}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

PositioningMap.displayName = "Positioning Map"

addPropertyControls(PositioningMap, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Competitor" },
                note: { type: ControlType.String, title: "Note", defaultValue: "", displayTextArea: true, description: "Shown as a tooltip on hover or tap." },
                x: { type: ControlType.Number, title: "X", defaultValue: 50, min: 0, max: 100, step: 1, description: "0 = left axis label, 100 = right." },
                y: { type: ControlType.Number, title: "Y", defaultValue: 50, min: 0, max: 100, step: 1, description: "0 = bottom axis label, 100 = top." },
                logo: { type: ControlType.ResponsiveImage, title: "Logo" },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#94A3B8" },
                featured: { type: ControlType.Boolean, title: "Featured", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
            },
        },
        defaultValue: SAMPLE,
    },
    axisLeft: { type: ControlType.String, title: "Axis Left", defaultValue: "Hard to use" },
    axisRight: { type: ControlType.String, title: "Axis Right", defaultValue: "Easy to use" },
    axisBottom: { type: ControlType.String, title: "Axis Bottom", defaultValue: "Basic" },
    axisTop: { type: ControlType.String, title: "Axis Top", defaultValue: "Powerful" },
    quadrants: {
        type: ControlType.Object,
        title: "Quadrants",
        controls: {
            topLeft: { type: ControlType.String, title: "Top Left", defaultValue: SAMPLE_QUADRANTS.topLeft },
            topRight: { type: ControlType.String, title: "Top Right", defaultValue: SAMPLE_QUADRANTS.topRight },
            bottomLeft: { type: ControlType.String, title: "Bottom Left", defaultValue: SAMPLE_QUADRANTS.bottomLeft },
            bottomRight: { type: ControlType.String, title: "Bottom Right", defaultValue: SAMPLE_QUADRANTS.bottomRight },
        },
    },
    highlight: {
        type: ControlType.Enum,
        title: "Highlight",
        options: ["none", "tl", "tr", "bl", "br"],
        optionTitles: ["None", "Top Left", "Top Right", "Bottom Left", "Bottom Right"],
        defaultValue: "tr",
        description: "Softly tint the quadrant you want to win.",
    },
    marker: {
        type: ControlType.Enum,
        title: "Marker",
        options: ["chip", "dot"],
        optionTitles: ["Chip", "Dot"],
        defaultValue: "chip",
        displaySegmentedControl: true,
    },
    tooltips: { type: ControlType.Boolean, title: "Tooltips", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    entrance: {
        type: ControlType.Boolean,
        title: "Entrance",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Items pop in once when the map scrolls into view.",
    },
    appearance: {
        type: ControlType.Object,
        title: "Style",
        icon: "color",
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            gridColor: { type: ControlType.Color, title: "Grid", defaultValue: "rgba(17, 17, 20, 0.06)" },
            axisColor: { type: ControlType.Color, title: "Axis", defaultValue: "#C9CBD3" },
            textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            subColor: { type: ControlType.Color, title: "Sub Text", defaultValue: "#6B6B76" },
            chipColor: { type: ControlType.Color, title: "Chip", defaultValue: "#FFFFFF" },
            accent: { type: ControlType.Color, title: "Accent", defaultValue: "#2DE5A0" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 48, step: 1, unit: "px" },
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Semibold", lineHeight: "1.2em" },
    },
    axisFont: {
        type: ControlType.Font,
        title: "Axis Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "13px", variant: "Medium", lineHeight: "1.4em" },
    },
    quadrantFont: {
        type: ControlType.Font,
        title: "Quadrant Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "13px", variant: "Regular", lineHeight: "1.3em" },
        description: "Created by BrandingUp",
    },
})
