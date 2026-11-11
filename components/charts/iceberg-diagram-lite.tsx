// [생성일] 2026-10-22
// [경위] 판매 진단(10-22) 후속 — 무료 체험판(Lite)으로 손님을 모아 정식판(14 Iceberg Diagram)으로 연결. 14번 코드를 복사해 차별 기능 3개를 뺀 무료판
// [제작] BrandingUp (https://brandingupstudio.com)
// [변경이력]
//   - 2026-10-22: 최초 생성 (14 IcebergDiagramLite.tsx 복사 → 층 3개 상한, 옆 라벨(Side-left/right)·물결 애니메이션·Open Layer 는 정식판 전용으로 제거)
//   - 2026-10-24: 마켓 심사 권고 예방 — 키보드 안내 문구(숨김 span)와 figure aria-describedby 추가

import { useEffect, useId, useRef, useState, startTransition } from "react"
import type { CSSProperties, KeyboardEvent } from "react"
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
// 변경: 프레이머 폰트 컨트롤 값 (스타일로 통째로 spread 하므로 CSS 속성 타입으로 지정)
type FontValue = CSSProperties

interface Level {
    title?: string
    items?: string // 한 줄에 항목 하나
    note?: string
}

interface IcebergLiteProps {
    aboveTitle?: string
    aboveItems?: string[]
    aboveNote?: string
    levels?: Level[]
    aboveRatio?: number
    roughness?: number
    shapeSeed?: number
    gap?: number
    surfaceColor?: string
    baseColor?: string
    deepColor?: string
    depthShade?: number
    waterColor?: string
    waveHeight?: number
    waterLabel?: string
    interactive?: boolean
    showPanel?: boolean
    hint?: string
    compactBelow?: number
    backgroundColor?: string
    panelColor?: string
    accentColor?: string
    textColor?: string
    insideTextColor?: string
    radius?: number
    padding?: number
    spacing?: number
    titleFont?: FontValue // 변경: any → 폰트 스타일 타입
    bodyFont?: FontValue
    style?: CSSProperties
}

// ─────────────────────────────────────────────
// 샘플 — 브랜드 빙산 (위 2항목 / 아래 3층)
// ─────────────────────────────────────────────
const SAMPLE_LEVELS: Level[] = [
    {
        title: "Voice & Message",
        items: "Tone of voice\nTagline\nStorytelling",
        note: "How the brand speaks. People feel it right away, even if they never point at it.",
    },
    {
        title: "Strategy & Positioning",
        items: "Target audience\nPositioning\nCompetitive edge",
        note: "The choices that decide what the brand says yes and no to.",
    },
    {
        title: "Values & Culture",
        items: "Purpose\nCore values\nBeliefs",
        note: "The foundation. Everything above the surface grows from here.",
    },
]
const SAMPLE_ABOVE = ["Logo", "Visual identity"]

// 물결 한 주기 = 80px (Lite 는 움직이지 않는 정지 물결)
const WAVE_PERIOD = 80
// Lite 상한: 수면 아래 층 3개까지 (정식판 8개)
// 화면에서만 숨기는 스타일 (스크린리더는 읽음)
const VISUALLY_HIDDEN: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}
const MAX_LEVELS = 3

// ─────────────────────────────────────────────
// 작은 계산 도구
// ─────────────────────────────────────────────
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

// 폰트 객체에서 숫자 크기만 읽는다 (스타일 적용은 통째로 spread, 이건 레이아웃 계산용)
function fontPx(f: FontValue | undefined, fallback: number) {
    const v = parseFloat(String(f && f.fontSize))
    return isFinite(v) && v > 0 ? v : fallback
}

// 줄바꿈/세로선으로 구분된 항목 문자열 → 배열
function splitItems(s?: string): string[] {
    if (!s) return []
    return s
        .split(/\r?\n|\|/)
        .map((t) => t.trim())
        .filter(Boolean)
}

// 씨앗값 기반의 결정적 흔들림 (y 좌표만의 함수 → 층 경계에서 가장자리가 끊기지 않음)
function noise(y: number, seed: number, side: number) {
    const p = seed * 1.618
    return (
        0.6 * Math.sin(y * 0.045 + p + side * 2.1) +
        0.3 * Math.sin(y * 0.13 + p * 2.3 + side * 4.7) +
        0.1 * Math.sin(y * 0.31 + p * 3.1 + side * 1.3)
    )
}

// ─────────────────────────────────────────────
// 빙산 형태 계산 — 층 수(n)에 맞춰 위쪽은 작고 아래로 갈수록 넓어지는 다각형을 자동 분할
// ─────────────────────────────────────────────
function buildIceberg(o: {
    h: number
    x0: number
    iw: number
    n: number
    ratio: number
    rough: number
    seed: number
    gap: number
}) {
    const { h, x0, iw, n, ratio, rough, seed, gap } = o
    const cx = x0 + iw / 2
    const maxHalf = iw * 0.5 * 0.94 // 가장 넓은 곳의 반폭
    const hw0 = maxHalf * 0.36 // 수면에서의 반폭
    const topY = 6
    const botY = h - 6
    const waterY = topY + (botY - topY) * (clamp(ratio, 10, 60) / 100)
    const amp = (rough / 100) * maxHalf * 0.08
    const frac = (v: number) => v - Math.floor(v)
    const tipShift =
        (frac(Math.sin(seed * 12.9898) * 43758.5453) - 0.5) * hw0 * 0.7 // 봉우리가 한쪽으로 살짝 기울어짐

    // y 높이에서의 반폭 (side: -1 왼쪽, +1 오른쪽)
    const halfAt = (y: number, side: number) => {
        if (y <= waterY) {
            const s = clamp((y - topY) / (waterY - topY), 0, 1)
            return Math.max(
                0,
                hw0 * Math.pow(s, 0.8) +
                    noise(y, seed, side) * amp * Math.min(1, s * 4)
            )
        }
        const t = clamp((y - waterY) / (botY - waterY), 0, 1)
        const grow = hw0 + (maxHalf - hw0) * (1 - (1 - t) * (1 - t)) // 아래로 갈수록 넓어짐
        const u = clamp((t - 0.7) / 0.3, 0, 1)
        const closing = Math.sqrt(1 - u * u) // 맨 아래는 둥글게 닫힘
        return Math.max(0, (grow + noise(y, seed, side) * amp) * closing)
    }
    const shiftAt = (y: number) => {
        if (y > waterY) return 0
        const s = clamp((y - topY) / (waterY - topY), 0, 1)
        return tipShift * Math.pow(1 - s, 1.3)
    }
    const L = (y: number) => cx + shiftAt(y) - halfAt(y, -1)
    const R = (y: number) => cx + shiftAt(y) + halfAt(y, 1)

    // 층 경계 y 좌표: 0번 = 수면 위(봉우리), 1~n = 수면 아래 층
    const bounds: number[] = []
    for (let k = 0; k <= n; k++) bounds.push(waterY + ((botY - waterY) * k) / n)

    const segs: { points: string; y0: number; y1: number; midY: number }[] = []
    for (let i = 0; i <= n; i++) {
        let y0 = i === 0 ? topY : bounds[i - 1]
        let y1 = i === 0 ? waterY : bounds[i]
        if (i >= 2) y0 += gap / 2 // 수면 아래 층 사이에만 틈을 둔다
        if (i >= 1 && i < n) y1 -= gap / 2
        const S = i === 0 ? 9 : 6
        const ys: number[] = []
        for (let k = 0; k <= S; k++) ys.push(y0 + ((y1 - y0) * k) / S)
        const left = ys.map((y) => L(y).toFixed(1) + "," + y.toFixed(1))
        const right = ys
            .slice()
            .reverse()
            .map((y) => R(y).toFixed(1) + "," + y.toFixed(1))
        segs.push({
            points: left.concat(right).join(" "),
            y0,
            y1,
            midY: (y0 + y1) / 2,
        })
    }
    return { cx, maxHalf, waterY, topY, botY, segs, L, R, halfAt }
}

// 변경: 층 다각형 좌표 문자열 → 투명 button 의 위치·크기·clip-path(모양 맞춤)
function hitBox(points: string) {
    const pts = points.split(" ").map((p) => p.split(",").map(Number))
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    const w = Math.max(1, Math.max(...xs) - x)
    const h = Math.max(1, Math.max(...ys) - y)
    const clip =
        "polygon(" +
        pts
            .map(
                (p) =>
                    (p[0] - x).toFixed(1) + "px " + (p[1] - y).toFixed(1) + "px"
            )
            .join(",") +
        ")"
    return { x, y, w, h, clip }
}

// 물결 경로 (정지 물결)
function wavePath(
    y0: number,
    amp: number,
    w: number,
    h: number,
    phase: number
) {
    const pts: string[] = []
    for (let x = -WAVE_PERIOD; x <= w + WAVE_PERIOD + 10; x += 10) {
        pts.push(
            x +
                "," +
                (
                    y0 +
                    amp * Math.sin((x / WAVE_PERIOD) * Math.PI * 2 + phase)
                ).toFixed(1)
        )
    }
    return (
        "M" +
        pts.join(" L") +
        " L" +
        (w + WAVE_PERIOD + 10) +
        "," +
        h +
        " L" +
        -WAVE_PERIOD +
        "," +
        h +
        " Z"
    )
}

// 작은 색 견본 (깊이 어둡게 = deepColor 를 투명도로 덮음)
function Swatch(props: { base: string; deep?: string; alpha?: number }) {
    return (
        <span
            aria-hidden="true"
            style={{
                position: "relative",
                display: "inline-block",
                width: 14,
                height: 14,
                borderRadius: 4,
                flexShrink: 0,
                overflow: "hidden",
                background: props.base,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
            }}
        >
            {props.deep ? (
                <span
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: props.deep,
                        opacity: props.alpha || 0,
                    }}
                />
            ) : null}
        </span>
    )
}

/**
 * 빙산 다이어그램 (Iceberg Diagram) — 수면 위 "보이는 것"과 수면 아래 "보이지 않는 층"을 빙산으로 그린다
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 820
 * @framerIntrinsicHeight 620
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function IcebergDiagramLite(props: IcebergLiteProps) {
    const {
        aboveTitle = "What people see",
        aboveItems,
        aboveNote = "The visible part: the things people can point at and remember.",
        levels,
        aboveRatio = 30,
        roughness = 55,
        shapeSeed = 7,
        gap = 3,
        surfaceColor = "rgb(244, 250, 255)",
        baseColor = "rgb(70, 156, 224)",
        deepColor = "rgb(8, 36, 84)",
        depthShade = 72,
        waterColor = "rgba(56, 150, 220, 0.32)",
        waveHeight = 4,
        waterLabel = "Waterline",
        interactive = true,
        showPanel = true,
        hint = "Hover or tap a layer to see what lies beneath.",
        compactBelow = 560,
        backgroundColor = "rgb(236, 245, 252)",
        panelColor = "rgb(255, 255, 255)",
        accentColor = "rgb(255, 138, 76)",
        textColor = "rgb(16, 42, 67)",
        insideTextColor = "rgb(255, 255, 255)",
        radius = 16,
        padding = 20,
        spacing = 16,
        titleFont,
        bodyFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer() // 정적 렌더에서는 호버 효과 없음
    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const gid = useId().replace(/[^a-zA-Z0-9]/g, "")

    // ── 층 목록: 0번 = 수면 위, 1~n = 수면 아래 ──
    const levelList = (levels && levels.length ? levels : SAMPLE_LEVELS).slice(
        0,
        MAX_LEVELS
    ) // 변경: Lite 는 3층까지
    const n = levelList.length
    const layers = [
        {
            title: aboveTitle || "Above the surface",
            items: (aboveItems || SAMPLE_ABOVE).filter(Boolean),
            note: aboveNote,
        },
        ...levelList.map((l, i) => ({
            title: l.title || "Level " + (i + 1),
            items: splitItems(l.items),
            note: l.note || "",
        })),
    ]

    // ── 선택/호버 상태 ──
    const [hot, setHot] = useState(-1) // 마우스·키보드 포커스가 올라간 층
    const [sel, setSel] = useState(-1) // 클릭해서 고정한 층
    const [kbFocus, setKbFocus] = useState(-1) // 변경: 키보드로 포커스된 층 (눈에 보이는 포커스 링용)
    const active = !interactive || isStatic ? -1 : hot >= 0 ? hot : sel

    // ── 크기 측정 (픽셀 좌표로 빙산을 그린다) ──
    const [size, setSize] = useState({ w: 0, h: 0, root: 0 })
    useEffect(() => {
        const stage = stageRef.current
        const root = rootRef.current
        if (!stage || !root || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => {
            const r = stage.getBoundingClientRect()
            const rr = root.getBoundingClientRect()
            startTransition(() =>
                setSize({
                    w: Math.round(r.width),
                    h: Math.round(r.height),
                    root: Math.round(rr.width),
                })
            )
        })
        ro.observe(stage)
        ro.observe(root)
        return () => ro.disconnect()
    }, [])

    // ── 레이아웃 결정 ──
    const compact = size.root > 0 && size.root < compactBelow // 좁으면 라벨을 아래로 쌓음
    const W = size.w || 640
    const H = size.h || 380
    const x0 = 0
    const iw = W
    const geo = buildIceberg({
        h: H,
        x0,
        iw,
        n,
        ratio: aboveRatio,
        rough: roughness,
        seed: shapeSeed,
        gap,
    })

    const tSize = fontPx(titleFont, 15)
    const bSize = fontPx(bodyFont, 13)
    const alphaOf = (i: number) => (i === 0 ? 0 : (depthShade / 100) * (i / n)) // 깊을수록 진하게
    const dim = (i: number) => active >= 0 && active !== i
    // compact 모드 안내: 좁은 화면에서는 빙산 안 라벨을 숨기고 목록으로 대신한다

    // ── 이벤트 ──
    const enter = (i: number) =>
        interactive && !isStatic && startTransition(() => setHot(i))
    const leave = () => startTransition(() => setHot(-1))
    // 변경: button 포커스 — 키보드 포커스(:focus-visible)일 때만 포커스 링 표시
    const focusLayer = (i: number, el: HTMLElement) => {
        enter(i)
        let vis = false
        try {
            vis = el.matches(":focus-visible")
        } catch (e) {
            vis = false
        }
        startTransition(() => setKbFocus(vis ? i : -1))
    }
    const blurLayer = () => {
        leave()
        startTransition(() => setKbFocus(-1))
    }
    const toggle = (i: number) =>
        interactive && startTransition(() => setSel((s) => (s === i ? -1 : i)))
    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!interactive) return
        const t = e.target as HTMLElement
        if (e.key === "Escape") {
            startTransition(() => setSel(-1))
            return
        }
        if (!t || !t.hasAttribute || !t.hasAttribute("data-layer")) return
        const idx = Number(t.getAttribute("data-layer"))
        // Enter/Space 는 진짜 button 이 click 으로 처리하므로 여기서는 방향키만 다룬다
        if (
            ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(e.key)
        ) {
            e.preventDefault()
            const next =
                (idx +
                    (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) +
                    layers.length) %
                layers.length
            const el =
                rootRef.current &&
                (rootRef.current.querySelector(
                    '[data-layer="' + next + '"]'
                ) as HTMLElement | null)
            if (el) el.focus()
        }
    }

    // ── 라벨 y 위치 (봉우리는 넓은 쪽으로 내려서 배치) ──
    const labelY = (i: number) => {
        const s = geo.segs[i]
        return i === 0 ? s.y0 + (s.y1 - s.y0) * 0.66 : s.midY
    }

    // 층 안 라벨 내용
    const renderLabel = (i: number) => {
        const s = geo.segs[i]
        const segH = s.y1 - s.y0
        const l = layers[i]
        const y = labelY(i)
        const title = <div style={{ ...titleFont }}>{l.title}</div>
        const common: CSSProperties = {
            position: "absolute",
            top: y,
            opacity: dim(i) ? 0.7 : 1, // 선택 안 된 층은 약간만 흐리게
            transition: isStatic ? undefined : "opacity 250ms ease",
        }
        // 빙산 안쪽 라벨: 이름 + (자리가 되면) 항목을 한 줄로
        if (segH < tSize * 1.5) return null
        const room = segH >= tSize * 1.3 + bSize * 1.4 * 2 + 14
        const maxW = Math.max(60, geo.halfAt(y, 1) * 2 * 0.8)
        return (
            <div
                key={"lab" + i}
                aria-hidden="true"
                style={{
                    ...common,
                    left: (geo.L(y) + geo.R(y)) / 2,
                    transform: "translate(-50%, -50%)",
                    width: "max-content",
                    maxWidth: maxW,
                    maxHeight: Math.max(segH * 0.92, tSize * 1.5),
                    overflow: "hidden",
                    textAlign: "center",
                    color: i === 0 ? textColor : insideTextColor,
                    pointerEvents: "none",
                }}
            >
                {title}
                {room && l.items.length > 0 ? (
                    <div style={{ ...bodyFont, opacity: 0.85, marginTop: 2 }}>
                        {l.items.join(" · ")}
                    </div>
                ) : null}
            </div>
        )
    }

    // ── 설명 패널에 보여줄 층 ──
    const cur = active >= 0 && active < layers.length ? layers[active] : null

    return (
        <div
            ref={rootRef}
            role="figure"
            aria-label={
                "Iceberg diagram: " + layers.map((l) => l.title).join(", ")
            }
            aria-describedby={isStatic ? undefined : gid + "hint"}
            onKeyDown={onKey}
            onPointerLeave={leave}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: spacing,
                padding,
                background: backgroundColor,
                borderRadius: radius,
                color: textColor,
                overflow: "hidden",
            }}
        >
            {/* 키보드 사용 안내: 화면에는 안 보이고 스크린리더만 읽는다 (컴포넌트당 1개) */}
            {!isStatic && (
                <span id={gid + "hint"} style={VISUALLY_HIDDEN}>
                    Use arrow keys to move between layers. Press Enter or Space
                    to open a layer.
                </span>
            )}

            {/* 빙산 + 물 */}
            <div
                ref={stageRef}
                style={{ position: "relative", flex: 1, minHeight: 160 }}
            >
                <svg
                    width={W}
                    height={H}
                    viewBox={"0 0 " + W + " " + H}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        overflow: "visible",
                    }}
                >
                    <defs>
                        <linearGradient
                            id={gid + "w"}
                            gradientUnits="userSpaceOnUse"
                            x1="0"
                            x2="0"
                            y1={geo.waterY}
                            y2={H}
                        >
                            <stop
                                offset="0"
                                style={{ stopColor: waterColor }}
                                stopOpacity="1"
                            />
                            <stop
                                offset="1"
                                style={{ stopColor: waterColor }}
                                stopOpacity="0.15"
                            />
                        </linearGradient>
                    </defs>

                    {/* 빙산 층 — 변경: 그림 전용 (클릭·키보드는 아래 투명 button 이 받는다) */}
                    {geo.segs.map((s, i) => (
                        <g
                            key={i}
                            aria-hidden="true"
                            style={{
                                pointerEvents: "none",
                                opacity: dim(i) ? 0.62 : 1,
                                transition: isStatic
                                    ? undefined
                                    : "opacity 250ms ease",
                            }}
                        >
                            <polygon
                                points={s.points}
                                fill={i === 0 ? surfaceColor : baseColor}
                            />
                            {i > 0 ? (
                                <polygon
                                    points={s.points}
                                    fill={deepColor}
                                    fillOpacity={alphaOf(i)}
                                />
                            ) : null}
                            {i === 0 ? (
                                <polygon
                                    points={s.points}
                                    fill="none"
                                    stroke="rgba(16,42,67,0.14)"
                                    strokeWidth={1}
                                />
                            ) : null}
                            {active === i ? (
                                <polygon
                                    points={s.points}
                                    fill="none"
                                    stroke={accentColor}
                                    strokeWidth={3}
                                    strokeLinejoin="round"
                                />
                            ) : null}
                            {kbFocus === i ? (
                                <>
                                    <polygon
                                        points={s.points}
                                        fill="none"
                                        stroke={textColor}
                                        strokeWidth={5}
                                        strokeLinejoin="round"
                                    />
                                    <polygon
                                        points={s.points}
                                        fill="none"
                                        stroke="#fff"
                                        strokeWidth={2}
                                        strokeDasharray="6 4"
                                        strokeLinejoin="round"
                                    />
                                </>
                            ) : null}
                        </g>
                    ))}

                    {/* 물 영역: 정지 물결 2겹 (빙산 아랫부분이 물속처럼 보임) */}
                    <g style={{ pointerEvents: "none" }}>
                        <path
                            d={wavePath(
                                geo.waterY,
                                waveHeight * 0.7,
                                W,
                                H,
                                1.6
                            )}
                            fill={"url(#" + gid + "w)"}
                            opacity={0.6}
                        />
                        <path
                            d={wavePath(geo.waterY, waveHeight, W, H, 0)}
                            fill={"url(#" + gid + "w)"}
                        />
                    </g>
                </svg>

                {/* 변경: 층마다 모양에 맞춘 투명 HTML button (클릭·키보드·포커스). 좁은 화면은 아래 목록 button 이 대신한다 */}
                {interactive && !compact
                    ? geo.segs.map((s, i) => {
                          const b = hitBox(s.points)
                          return (
                              <button
                                  key={"hit" + i}
                                  type="button"
                                  data-layer={i}
                                  aria-label={
                                      layers[i].title +
                                      (layers[i].items.length
                                          ? ": " + layers[i].items.join(", ")
                                          : "")
                                  }
                                  aria-pressed={sel === i}
                                  onPointerEnter={(e) =>
                                      e.pointerType === "mouse" && enter(i)
                                  }
                                  onClick={() => toggle(i)}
                                  onFocus={(e) =>
                                      focusLayer(i, e.currentTarget)
                                  }
                                  onBlur={blurLayer}
                                  style={{
                                      position: "absolute",
                                      left: b.x,
                                      top: b.y,
                                      width: b.w,
                                      height: b.h,
                                      clipPath: b.clip,
                                      margin: 0,
                                      padding: 0,
                                      border: "none",
                                      background: "transparent",
                                      appearance: "none",
                                      outline: "none",
                                      cursor: "pointer",
                                      WebkitTapHighlightColor: "transparent",
                                  }}
                              />
                          )
                      })
                    : null}

                {/* 라벨 (빙산 안) */}
                {!compact ? layers.map((_, i) => renderLabel(i)) : null}

                {/* 수면선 이름 */}
                {waterLabel ? (
                    <div
                        aria-hidden="true"
                        style={{
                            ...bodyFont,
                            fontSize: 11,
                            lineHeight: "1.2em",
                            position: "absolute",
                            left: 4,
                            top: geo.waterY - waveHeight - 18,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            opacity: 0.55,
                            pointerEvents: "none",
                        }}
                    >
                        {waterLabel}
                    </div>
                ) : null}
            </div>

            {/* 좁은 화면: 라벨을 아래로 쌓은 층 목록 */}
            {compact ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {layers.map((l, i) => (
                        <button
                            key={i}
                            type="button"
                            data-layer={i}
                            aria-pressed={sel === i}
                            onClick={() => toggle(i)}
                            onFocus={() => enter(i)}
                            onBlur={leave}
                            style={{
                                ...bodyFont,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 10px",
                                borderRadius: Math.min(radius, 12),
                                border:
                                    "1px solid " +
                                    (active === i
                                        ? accentColor
                                        : "rgba(0,0,0,0.12)"),
                                background: panelColor,
                                color: textColor,
                                cursor: interactive ? "pointer" : "default",
                                outline: "none",
                            }}
                        >
                            <Swatch
                                base={i === 0 ? surfaceColor : baseColor}
                                deep={i === 0 ? undefined : deepColor}
                                alpha={alphaOf(i)}
                            />
                            {l.title}
                        </button>
                    ))}
                </div>
            ) : null}

            {/* 설명 패널 */}
            {showPanel ? (
                <div
                    aria-live="polite"
                    style={{
                        flexShrink: 0,
                        minHeight: 84,
                        boxSizing: "border-box",
                        padding: "14px 16px",
                        borderRadius: radius,
                        background: panelColor,
                        border: "1px solid rgba(0,0,0,0.06)",
                        color: textColor,
                    }}
                >
                    {cur ? (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Swatch
                                    base={
                                        active === 0 ? surfaceColor : baseColor
                                    }
                                    deep={active === 0 ? undefined : deepColor}
                                    alpha={alphaOf(active)}
                                />
                                <span style={{ ...titleFont }}>
                                    {cur.title}
                                </span>
                                {cur.items.map((it, k) => (
                                    <span
                                        key={k}
                                        style={{
                                            ...bodyFont,
                                            fontSize: Math.max(11, bSize - 1),
                                            padding: "2px 9px",
                                            borderRadius: 999,
                                            border: "1px solid " + accentColor,
                                        }}
                                    >
                                        {it}
                                    </span>
                                ))}
                            </div>
                            {cur.note ? (
                                <div
                                    style={{
                                        ...bodyFont,
                                        marginTop: 8,
                                        opacity: 0.8,
                                    }}
                                >
                                    {cur.note}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <div style={{ ...bodyFont, opacity: 0.65 }}>{hint}</div>
                    )}
                </div>
            ) : null}
        </div>
    )
}

IcebergDiagramLite.displayName = "Iceberg Diagram Lite"

addPropertyControls(IcebergDiagramLite, {
    aboveTitle: {
        type: ControlType.String,
        title: "Above Title",
        defaultValue: "What people see",
    },
    aboveItems: {
        type: ControlType.Array,
        title: "Above Items",
        control: { type: ControlType.String, defaultValue: "Item" },
        defaultValue: SAMPLE_ABOVE,
        description: "Items above the waterline.",
    },
    aboveNote: {
        type: ControlType.String,
        title: "Above Note",
        defaultValue:
            "The visible part: the things people can point at and remember.",
        displayTextArea: true,
    },
    levels: {
        type: ControlType.Array,
        title: "Levels",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Level",
                },
                items: {
                    type: ControlType.String,
                    title: "Items",
                    defaultValue: "",
                    displayTextArea: true,
                    description: "One item per line.",
                },
                note: {
                    type: ControlType.String,
                    title: "Note",
                    defaultValue: "",
                    displayTextArea: true,
                },
            },
        },
        maxCount: MAX_LEVELS,
        defaultValue: SAMPLE_LEVELS,
        description:
            "Top to bottom, below the waterline. The iceberg splits itself to fit.",
    },
    aboveRatio: {
        type: ControlType.Number,
        title: "Above Water",
        defaultValue: 30,
        min: 10,
        max: 60,
        step: 1,
        unit: "%",
        description: "Share of the height above the waterline.",
    },
    roughness: {
        type: ControlType.Number,
        title: "Roughness",
        defaultValue: 55,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    shapeSeed: {
        type: ControlType.Number,
        title: "Shape Seed",
        defaultValue: 7,
        min: 1,
        max: 50,
        step: 1,
        description: "Change it to get a different edge.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 3,
        min: 0,
        max: 12,
        step: 1,
        unit: "px",
    },
    surfaceColor: {
        type: ControlType.Color,
        title: "Surface Ice",
        defaultValue: "rgb(244, 250, 255)",
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "rgb(70, 156, 224)",
        description: "Deeper levels darken from this color automatically.",
    },
    deepColor: {
        type: ControlType.Color,
        title: "Deep Color",
        defaultValue: "rgb(8, 36, 84)",
    },
    depthShade: {
        type: ControlType.Number,
        title: "Depth Shade",
        defaultValue: 72,
        min: 0,
        max: 95,
        step: 1,
        unit: "%",
    },
    waterColor: {
        type: ControlType.Color,
        title: "Water",
        defaultValue: "rgba(56, 150, 220, 0.32)",
    },
    waveHeight: {
        type: ControlType.Number,
        title: "Wave Shape",
        defaultValue: 4,
        min: 0,
        max: 14,
        step: 1,
        unit: "px",
    },
    waterLabel: {
        type: ControlType.String,
        title: "Waterline Text",
        defaultValue: "Waterline",
    },
    interactive: {
        type: ControlType.Boolean,
        title: "Interactive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showPanel: {
        type: ControlType.Boolean,
        title: "Detail Panel",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    hint: {
        type: ControlType.String,
        title: "Panel Hint",
        defaultValue: "Hover or tap a layer to see what lies beneath.",
        hidden: (p: IcebergLiteProps) => !p.showPanel,
    },
    compactBelow: {
        type: ControlType.Number,
        title: "Stack Below",
        defaultValue: 560,
        min: 0,
        max: 1200,
        step: 10,
        unit: "px",
        description:
            "Narrower than this, labels move into a list under the iceberg.",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgb(236, 245, 252)",
    },
    panelColor: {
        type: ControlType.Color,
        title: "Panel",
        defaultValue: "rgb(255, 255, 255)",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Highlight",
        defaultValue: "rgb(255, 138, 76)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "rgb(16, 42, 67)",
    },
    insideTextColor: {
        type: ControlType.Color,
        title: "Text on Ice",
        defaultValue: "rgb(255, 255, 255)",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 20,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Semibold",
            lineHeight: "1.25em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            lineHeight: "1.4em",
        },
        description: "Created by BrandingUp",
    },
})
