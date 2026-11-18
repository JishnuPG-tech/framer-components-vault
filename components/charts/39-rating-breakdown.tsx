// [생성일] 2026-11-16
// [경위] 달러벌기 39번 상품(무료): 별점별 리뷰 수를 넣으면 평균 점수·별·별점별 막대로 보여 주는 평점 요약(리뷰 분포). 02 Reviews Pro 와 짝
// [변경이력]
//   - 2026-11-16: 최초 생성 (줄 목록 입력 "5, 812" · 빈 데이터면 데모 · 평균·총 개수 자동 계산 · 평균만 아는 경우 Summary Only · 별 개수 3~10 · 부분 채움 별 · 막대 % /개수/둘 다 · 배치 자동/옆/아래 · 리뷰 쓰기 버튼(링크) · 숫자 서식 · 색 테마 7종+직접 색 · 호버·방향키 · 등장 1회(CSS 전환, 프레임 루프 없음) · 정적·캔버스 완성 상태)

import { useEffect, useMemo, useRef, useState, startTransition } from "react"
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
interface Colors {
    background?: string
    text?: string
    muted?: string
    track?: string
    star?: string
    starEmpty?: string
    bar?: string
    tooltipBg?: string
    tooltipText?: string
}

// 별점 한 칸 (stars = 몇 점, count = 리뷰 수)
interface Bucket {
    stars: number
    count: number
}

type ThemeName = "gold" | "mint" | "green" | "blue" | "purple" | "orange" | "pink" | "mono" | "custom"

const MAX_LINES = 50

// 막대 색 테마
const ACCENTS: Record<string, string> = {
    gold: "#F5A524",
    mint: "#2DE5A0",
    green: "#2DA44E",
    blue: "#3B82F6",
    purple: "#8B5CF6",
    orange: "#F97316",
    pink: "#EC4899",
}

// 데이터가 비었을 때 보여 주는 데모 (5점 척도)
const DEMO: Bucket[] = [
    { stars: 5, count: 812 },
    { stars: 4, count: 203 },
    { stars: 3, count: 41 },
    { stars: 2, count: 12 },
    { stars: 1, count: 9 },
]

// 24×24 별 경로
const STAR_PATH = "M12 2.2l2.95 6.3 6.85.75-5.1 4.65 1.4 6.75L12 17.2l-6.1 3.45 1.4-6.75-5.1-4.65 6.85-.75Z"

// ─────────────────────────────────────────────
// 유틸 함수
// ─────────────────────────────────────────────

// 프레이머는 색을 rgb()/rgba() 로 넘기므로 둘 다 + HEX 모두 처리 (알파 포함)
function parseColor(c: string): [number, number, number, number] | null {
    if (typeof c !== "string") return null
    const m = c.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?/i)
    if (m) {
        let a = 1
        if (m[4] !== undefined) a = m[4].indexOf("%") >= 0 ? parseFloat(m[4]) / 100 : parseFloat(m[4])
        return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), isFinite(a) ? a : 1]
    }
    if (c.charAt(0) === "#") {
        let h = c.slice(1)
        if (h.length === 3 || h.length === 4) h = h.split("").map((x) => x + x).join("")
        if (h.length >= 6 && /^[0-9a-f]+$/i.test(h)) {
            const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a]
        }
    }
    return null
}

// 색에 투명도를 곱한다
function withAlpha(c: string, a: number): string {
    const p = parseColor(c)
    if (!p) return c
    return `rgba(${Math.round(p[0])}, ${Math.round(p[1])}, ${Math.round(p[2])}, ${Math.round(p[3] * a * 1000) / 1000})`
}

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
}

function fontSizeOf(ctl: CSSProperties | undefined, fallback: number): number {
    const n = parseFloat(String(ctl && ctl.fontSize))
    return isFinite(n) && n > 0 ? n : fallback
}

// 글자 폭 어림값(글자 크기 1 기준). 한글·한자·가나는 영문보다 넓게 센다
function textUnits(s: string): number {
    let u = 0
    for (let i = 0; i < s.length; i++) u += s.charCodeAt(i) > 0x2e80 ? 1 : 0.58
    return u
}

// 숫자 한 칸 읽기: 공백·% ·별 기호는 무시, 1.2k 줄임 표기 허용. 음수는 0. 숫자가 아니면 null
function parseNumber(raw: string, allowComma: boolean): number | null {
    let t = raw.replace(/[\s%_★☆*]/g, "").replace(/stars?$/i, "")
    if (allowComma) t = t.replace(/,/g, "")
    const m = t.match(/^([+-]?\d+(?:\.\d+)?|[+-]?\.\d+)([kKmM])?$/)
    if (!m) return null
    let n = parseFloat(m[1])
    const u = (m[2] || "").toLowerCase()
    if (u === "k") n *= 1e3
    else if (u === "m") n *= 1e6
    return isFinite(n) ? Math.max(0, n) : null
}

// 입력 글자를 별점 칸 목록으로 바꾼다.
// 한 줄 = "5, 812" (몇 점, 리뷰 수). "5 stars, 812"·"★5 812" 처럼 써도 된다. 같은 점수는 합산.
// 구분: 쉼표, 탭(세미콜론·| 도 가능), 공백. 점수가 척도 밖이거나 숫자 두 개가 없는 줄은 건너뛴다.
function parseData(text: string, scale: number): Bucket[] {
    const map: Record<number, number> = {}
    let any = false
    if (typeof text !== "string" || !text.trim()) return []
    const lines = text.split(/\r?\n/).slice(0, MAX_LINES)
    for (const raw of lines) {
        const line = raw.trim()
        if (!line) continue
        const strong = /[\t;|]/.test(line)
        let cells = (strong ? line.split(/[\t;|]/) : line.split(",")).map((c) => c.trim()).filter(Boolean)
        if (cells.length < 2) cells = line.split(/\s+/).filter((c) => !/^stars?$/i.test(c))
        if (cells.length < 2) continue
        const s = parseNumber(cells[0], strong)
        // 평점 줄은 숫자가 두 개뿐이므로, 쉼표로 나눴는데 칸이 더 많고 뒤 칸이 세 자리면 천 단위 쉼표로 보고 붙여 읽는다 ("5, 1,200" → 1200)
        const rest = cells.slice(1)
        const thousands = !strong && rest.length > 1 && rest.slice(1).every((x) => /^\d{3}$/.test(x)) && /^\d{1,3}$/.test(rest[0])
        const c = thousands ? parseNumber(rest.join(""), false) : parseNumber(cells[cells.length - 1], strong)
        if (s === null || c === null) continue
        const stars = Math.round(s)
        if (stars < 1 || stars > scale) continue
        map[stars] = (map[stars] || 0) + c
        any = true
    }
    if (!any) return []
    const out: Bucket[] = []
    for (let s = scale; s >= 1; s--) out.push({ stars: s, count: map[s] || 0 })
    return out
}

// 로케일 숫자 서식
function makeFormatter(locale: string, min: number, max: number): (n: number) => string {
    const opt = { minimumFractionDigits: min, maximumFractionDigits: max }
    try {
        const nf = new Intl.NumberFormat((locale || "").trim() || "en-US", opt)
        return (n: number) => nf.format(n)
    } catch (e) {
        const nf = new Intl.NumberFormat("en-US", opt)
        return (n: number) => nf.format(n)
    }
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
interface RatingBreakdownProps {
    data?: string
    source?: "breakdown" | "summary"
    average?: number
    total?: number
    scale?: number
    title?: string
    basedWord?: string
    reviewsWord?: string
    layout?: "auto" | "side" | "stacked"
    barValues?: "percent" | "count" | "both" | "none"
    showStars?: boolean
    averageDecimals?: number
    buttonText?: string
    buttonLink?: string
    newTab?: boolean
    note?: string
    showTooltip?: boolean
    theme?: ThemeName
    accent?: string
    appearance?: "light" | "dark"
    locale?: string
    barHeight?: number
    barRadius?: number
    rowGap?: number
    starSize?: number
    textScale?: number
    customColors?: boolean
    colors?: Colors
    animate?: boolean
    duration?: number
    radius?: number
    padding?: number
    font?: CSSProperties
    labelFont?: CSSProperties
    style?: CSSProperties
}

/**
 * Rating Breakdown — 별점별 리뷰 수를 넣으면 평균 점수·부분 채움 별·별점별 막대로 보여 주는 평점 요약.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function RatingBreakdown(props: RatingBreakdownProps) {
    const {
        data = "",
        source = "breakdown",
        average: avgProp = 4.7,
        total: totalProp = 1077,
        scale: scaleProp = 5,
        title = "Customer reviews",
        basedWord = "Based on",
        reviewsWord = "reviews",
        layout = "auto",
        barValues = "percent",
        showStars = true,
        averageDecimals = 1,
        buttonText = "",
        buttonLink = "",
        newTab = true,
        note = "",
        showTooltip = true,
        theme: themeName = "gold",
        accent = "#F5A524",
        appearance = "light",
        locale = "en-US",
        barHeight = 10,
        barRadius = 5,
        rowGap = 10,
        starSize = 20,
        textScale = 1,
        customColors = false,
        colors: colorProps,
        animate = true,
        duration = 900,
        radius = 16,
        padding = 24,
        font,
        labelFont,
        style,
    } = props

    const areaRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(640 - 24 * 2)
    const [active, setActive] = useState<number | null>(null)

    // ── 색 기본값: Appearance 에 따르고, Custom Colors 를 켰을 때만 입력값 사용 ──
    const cs = customColors ? colorProps : undefined
    const dark = appearance === "dark"
    const base = themeName === "custom" ? accent : themeName === "mono" ? (dark ? "#F4F4F6" : "#111114") : ACCENTS[themeName] || ACCENTS.gold
    const theme = {
        background: cs?.background ?? (dark ? "#101114" : "rgba(255, 255, 255, 0)"),
        text: cs?.text ?? (dark ? "#F4F4F6" : "#111114"),
        muted: cs?.muted ?? (dark ? "#9A9AA6" : "#6B6B76"),
        track: cs?.track ?? (dark ? "rgba(255, 255, 255, 0.1)" : "rgba(17, 17, 20, 0.07)"),
        star: cs?.star ?? base,
        starEmpty: cs?.starEmpty ?? (dark ? "rgba(255, 255, 255, 0.16)" : "rgba(17, 17, 20, 0.12)"),
        bar: cs?.bar ?? base,
        tooltipBg: cs?.tooltipBg ?? (dark ? "#F4F4F6" : "#111114"),
        tooltipText: cs?.tooltipText ?? (dark ? "#111114" : "#FFFFFF"),
    }

    // ── 데이터 → 평균·총 개수 ──
    const scale = clamp(Math.round(scaleProp) || 5, 3, 10)
    const model = useMemo(() => {
        if (source === "summary") {
            const avg = clamp(Number(avgProp) || 0, 0, scale)
            return { buckets: [] as Bucket[], total: Math.max(0, Math.round(Number(totalProp) || 0)), avg, demo: false }
        }
        const parsed = parseData(data, scale)
        // 데모는 5점 척도용이라, 척도를 바꾸면 비어 있는 칸으로 보여 준다
        const buckets = parsed.length ? parsed : scale === 5 ? DEMO : Array.from({ length: scale }, (_, i) => ({ stars: scale - i, count: 0 }))
        const total = buckets.reduce((a, b) => a + b.count, 0)
        const avg = total > 0 ? buckets.reduce((a, b) => a + b.stars * b.count, 0) / total : 0
        return { buckets, total, avg, demo: !parsed.length }
    }, [data, source, avgProp, totalProp, scale])
    const buckets = model.buckets
    const n = buckets.length
    const maxCount = buckets.reduce((m, b) => Math.max(m, b.count), 0)

    // ── 부모(컨테이너) 너비 측정 ──
    useEffect(() => {
        const el = areaRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const apply = () => {
            const w = el.clientWidth
            if (w > 0) startTransition(() => setWidth(w))
        }
        apply()
        const ro = new ResizeObserver(apply)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // ── 등장 애니메이션 (한 번만, 화면에 보일 때 시작) ──
    // 막대는 CSS 전환으로 0 → 비율까지, 별은 채움 폭이 0 → 평균까지. 프레임 루프(rAF)·반복 타이머 없음.
    // 정적 렌더·캔버스·화면 밖·모션 줄이기 설정에서는 완성된 상태를 즉시 보여줌
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const canAnimate = animate && !isStatic && !isCanvas
    const dur = clamp(Math.round(duration) || 900, 200, 4000)
    const stagger = n > 1 ? Math.min(80, Math.round((dur * 0.4) / (n - 1))) : 0
    const total = dur + stagger * Math.max(0, n - 1)
    const [phase, setPhase] = useState<"done" | "hidden" | "playing">("done")
    useEffect(() => {
        const rm = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const el = areaRef.current
        if (!canAnimate || rm || !el || typeof IntersectionObserver === "undefined") {
            startTransition(() => setPhase("done"))
            return
        }
        startTransition(() => setPhase("hidden"))
        let t1 = 0
        let t2 = 0
        let started = false
        // 끝나면 "done" 으로 돌아가 이후에는 아무 애니메이션도 돌지 않음
        const finish = () => {
            io.disconnect()
            window.clearTimeout(t1)
            window.clearTimeout(t2)
            startTransition(() => setPhase("done"))
        }
        const io = new IntersectionObserver(
            (entries) => {
                const visible = !!entries[0] && entries[0].isIntersecting
                if (visible && !started) {
                    started = true
                    t1 = window.setTimeout(() => {
                        startTransition(() => setPhase("playing"))
                        t2 = window.setTimeout(finish, total + 150)
                    }, 60)
                } else if (!visible && started) {
                    // 재생 도중 화면 밖으로 나가면 바로 완성 상태로 (화면 밖에서는 아무것도 돌지 않게)
                    finish()
                }
            },
            { threshold: 0.2 }
        )
        io.observe(el)
        return () => {
            io.disconnect()
            window.clearTimeout(t1)
            window.clearTimeout(t2)
        }
    }, [canAnimate, total])
    const hidden = phase === "hidden"
    // 등장 중에만 CSS 전환을 건다 (끝나면 "none")
    const trans = (prop: string, delay: number) => (phase === "playing" ? `${prop} ${dur}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms` : "none")

    // ── 글꼴·글자 크기 ──
    const ts = clamp(Number(textScale) || 1, 0.5, 3)
    const fontCss: CSSProperties = font || {}
    const labelCss: CSSProperties = labelFont || {}
    const fs = Math.round(fontSizeOf(font, 15) * ts * 10) / 10
    const lfs = Math.round(fontSizeOf(labelFont, 13) * ts * 10) / 10
    const bigFs = Math.round(fs * 3.4)

    // ── 숫자 서식 ──
    const fmt = useMemo(() => {
        const d = clamp(Math.round(averageDecimals) || 0, 0, 2)
        const avgNf = makeFormatter(locale, d, d)
        const intNf = makeFormatter(locale, 0, 0)
        return { avg: (v: number) => avgNf(v), int: (v: number) => intNf(v) }
    }, [locale, averageDecimals])
    const pctOf = (c: number) => (model.total > 0 ? c / model.total : 0)
    const barText = (b: Bucket) => {
        if (barValues === "none") return ""
        const p = Math.round(pctOf(b.count) * 100) + "%"
        if (barValues === "count") return fmt.int(b.count)
        if (barValues === "both") return `${p} (${fmt.int(b.count)})`
        return p
    }

    // ── 배치 계산: 요약(평균·별)을 막대 옆에 둘지 위에 둘지 ──
    const ss = clamp(Number(starSize) || 20, 8, 60) * Math.max(1, ts * 0.85)
    const summaryW = Math.round(Math.max(bigFs * 2.2, ss * scale * 1.08 + 4, textUnits(`${basedWord} ${fmt.int(model.total)} ${reviewsWord}`) * lfs) + 8)
    const side = source !== "summary" && (layout === "side" || (layout === "auto" && width >= summaryW + 280))
    const colGap = Math.round(clamp(width * 0.05, 16, 40))
    const barsW = side ? width - summaryW - colGap : width
    const labelW = Math.round(textUnits(`${scale}`) * lfs + ss * 0.7 + 10)
    const valW = barValues === "none" ? 0 : Math.round(buckets.reduce((m, b) => Math.max(m, textUnits(barText(b))), 0) * lfs + 10)
    // 줄 안 칸 사이 간격도 글자 배율을 따른다 (배율 2배에서 막대와 % 가 붙어 보이던 것 수정)
    const cellGap = Math.round(8 * Math.max(1, ts))
    const trackW = Math.max(40, barsW - labelW - valW - cellGap * 2)
    const bh = clamp(Number(barHeight) || 10, 3, 40) * Math.max(1, ts * 0.8)
    const br = clamp(Number(barRadius) || 0, 0, 20)
    const rg = clamp(Number(rowGap) || 0, 0, 40)
    const rowH = Math.max(Math.ceil(lfs * 1.5), Math.ceil(bh + 4))

    // ── 키보드: 차트 전체가 탭 정지 1개, 방향키로 별점 줄 이동 ──
    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (!n) return
        const keys = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Escape"]
        if (keys.indexOf(e.key) < 0) return
        e.preventDefault()
        if (e.key === "Escape") return setActive(null)
        let next = active === null ? 0 : active
        if (active !== null) {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (active + 1) % n
            if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (active - 1 + n) % n
        }
        if (e.key === "Home") next = 0
        if (e.key === "End") next = n - 1
        setActive(next)
    }
    // 화면 낭독 문구 (1점은 단수 star)
    const describeBucket = (b: Bucket) => `${b.stars} ${b.stars === 1 ? "star" : "stars"}:${fmt.int(b.count)} ${reviewsWord} (${Math.round(pctOf(b.count) * 100)}%)`
    const ariaSummary = `${title ? title + ". " : ""}${fmt.avg(model.avg)} out of ${scale}. ${basedWord} ${fmt.int(model.total)} ${reviewsWord}.` + (n ? " " + buckets.map(describeBucket).join(". ") + "." : "")

    // ── 스타일 ──
    const pad = Math.max(0, Number(padding) || 0)
    const rootStyle: CSSProperties = {
        ...style,
        position: "relative",
        boxSizing: "border-box",
        width: "100%",
        padding: pad,
        background: theme.background,
        borderRadius: radius,
        color: theme.text,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        ...fontCss,
        fontSize: fs,
        outline: "none",
    }
    const labelStyle: CSSProperties = { ...labelCss, fontSize: lfs, color: theme.muted, lineHeight: 1.35 }

    // 별 한 줄 (fill = 0~scale, 부분 채움). 등장 때 채움 폭이 0 → 평균
    const starRow = (fill: number, size: number) => {
        const gap = Math.round(size * 0.08)
        const w = scale * size + (scale - 1) * gap
        const fw = clamp(fill, 0, scale)
        // 채움 폭 = 채워진 별 수만큼 + 마지막 별의 부분
        const whole = Math.floor(fw)
        const part = fw - whole
        const fillPx = whole * (size + gap) + part * size
        const stars = (color: string) => (
            <svg width={w} height={size} viewBox={`0 0 ${w} ${size}`} style={{ display: "block" }} aria-hidden>
                {Array.from({ length: scale }, (_, i) => (
                    <path key={i} d={STAR_PATH} transform={`translate(${i * (size + gap)}, 0) scale(${size / 24})`} fill={color} />
                ))}
            </svg>
        )
        return (
            <div style={{ position: "relative", width: w, height: size }}>
                {stars(theme.starEmpty)}
                <div style={{ position: "absolute", left: 0, top: 0, height: size, overflow: "hidden", width: hidden ? 0 : fillPx, transition: trans("width", 0) }}>{stars(theme.star)}</div>
            </div>
        )
    }

    // 요약 블록 (평균 숫자 + 별 + "Based on N reviews" + 버튼)
    const summary = (
        <div style={{ width: side ? summaryW : "100%", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: Math.round(fs * 0.45) }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: bigFs, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{fmt.avg(model.avg)}</span>
                <span style={{ ...labelStyle, fontSize: Math.round(fs * 1.05) }}>/ {scale}</span>
            </div>
            {showStars ? starRow(model.avg, ss) : null}
            <div style={labelStyle}>
                {basedWord} <b style={{ color: theme.text }}>{fmt.int(model.total)}</b> {reviewsWord}
            </div>
            {buttonText ? (
                <a
                    href={buttonLink || undefined}
                    target={newTab ? "_blank" : undefined}
                    rel={newTab ? "noopener noreferrer" : undefined}
                    style={{
                        ...labelCss,
                        marginTop: 4,
                        display: "inline-flex",
                        alignItems: "center",
                        padding: `${Math.round(lfs * 0.6)}px ${Math.round(lfs * 1.1)}px`,
                        borderRadius: 999,
                        border: `1px solid ${theme.track}`,
                        background: withAlpha(theme.text, dark ? 0.06 : 0.04),
                        color: theme.text,
                        fontSize: lfs,
                        fontWeight: 600,
                        textDecoration: "none",
                    }}
                >
                    {buttonText}
                </a>
            ) : null}
        </div>
    )

    // 툴팁 (막대 줄 위)
    const tooltip = (b: Bucket, x: number) => {
        if (!showTooltip) return null
        const lines = [`${b.stars} ★`, `${fmt.int(b.count)} ${reviewsWord} · ${Math.round(pctOf(b.count) * 100)}%`]
        return (
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    left: x,
                    top: -6,
                    transform: "translate(-50%, -100%)",
                    background: theme.tooltipBg,
                    color: theme.tooltipText,
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: lfs,
                    lineHeight: 1.4,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 3,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                }}
            >
                <b>{lines[0]}</b> {lines[1]}
            </div>
        )
    }

    // 별점별 막대
    const bars = n ? (
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: rg }} onPointerLeave={() => setActive(null)}>
            {buckets.map((b, k) => {
                const frac = maxCount > 0 ? b.count / maxCount : 0
                const dim = active !== null && active !== k
                return (
                    <div
                        key={b.stars}
                        onPointerEnter={() => setActive(k)}
                        style={{ position: "relative", display: "flex", alignItems: "center", gap: cellGap, height: rowH, opacity: dim ? 0.4 : 1, transition: phase === "done" ? "opacity 160ms ease" : "none" }}
                    >
                        <div style={{ ...labelCss, width: labelW, flexShrink: 0, display: "flex", alignItems: "center", gap: 4, fontSize: lfs, color: theme.text, fontVariantNumeric: "tabular-nums" }}>
                            {b.stars}
                            <svg width={ss * 0.7} height={ss * 0.7} viewBox="0 0 24 24" aria-hidden>
                                <path d={STAR_PATH} fill={theme.star} />
                            </svg>
                        </div>
                        <div style={{ position: "relative", width: trackW, height: bh, borderRadius: br, background: theme.track, overflow: "hidden", flexShrink: 0 }}>
                            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: br, background: theme.bar, width: hidden ? 0 : `${frac * 100}%`, transition: trans("width", k * stagger) }} />
                        </div>
                        {valW ? (
                            <div style={{ ...labelCss, width: valW, flexShrink: 0, textAlign: "right", fontSize: lfs, color: theme.muted, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{barText(b)}</div>
                        ) : null}
                        {active === k ? tooltip(b, labelW + cellGap + Math.max(frac * trackW, 30) / 2) : null}
                    </div>
                )
            })}
        </div>
    ) : null

    return (
        <div className="bu-rating" style={rootStyle} tabIndex={0} role="figure" aria-label={ariaSummary} onKeyDown={onKey} onBlur={() => setActive(null)}>
            <style>{`.bu-rating:focus-visible{box-shadow:0 0 0 2px ${theme.bar}}`}</style>
            <div ref={areaRef} style={{ width: "100%" }}>
                {title ? <div style={{ fontWeight: 650, fontSize: Math.round(fs * 1.15), lineHeight: 1.3, marginBottom: Math.round(fs * 1) }}>{title}</div> : null}
                <div style={{ display: "flex", flexDirection: side ? "row" : "column", alignItems: side ? "center" : "stretch", gap: side ? colGap : Math.round(fs * 1.2) }}>
                    {summary}
                    {bars}
                </div>
                {note ? <div style={{ ...labelStyle, marginTop: Math.round(fs * 1) }}>{note}</div> : null}
                <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    {active !== null && buckets[active] ? describeBucket(buckets[active]) : ""}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(RatingBreakdown, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["breakdown", "summary"],
        optionTitles: ["Breakdown", "Summary Only"],
        defaultValue: "breakdown",
        displaySegmentedControl: true,
        description: "Summary Only shows the average and total without bars.",
    },
    data: {
        type: ControlType.String,
        title: "Data",
        defaultValue: "",
        placeholder: "5, 812\n4, 203\n3, 41\n2, 12\n1, 9",
        displayTextArea: true,
        description: "One line per star level: stars, number of reviews. The average and total are worked out for you. Leave empty to show demo data.",
        hidden: (p: RatingBreakdownProps) => p.source === "summary",
    },
    average: { type: ControlType.Number, title: "Average", defaultValue: 4.7, min: 0, max: 10, step: 0.1, hidden: (p: RatingBreakdownProps) => p.source !== "summary" },
    total: { type: ControlType.Number, title: "Total", defaultValue: 1077, min: 0, step: 1, hidden: (p: RatingBreakdownProps) => p.source !== "summary" },
    scale: { type: ControlType.Number, title: "Stars", defaultValue: 5, min: 3, max: 10, step: 1, displayStepper: true },
    title: { type: ControlType.String, title: "Title", defaultValue: "Customer reviews", placeholder: "Optional" },
    basedWord: { type: ControlType.String, title: "Based Text", defaultValue: "Based on", description: "\"Based on 1,077 reviews\". Translate both parts for other languages." },
    reviewsWord: { type: ControlType.String, title: "Reviews Text", defaultValue: "reviews" },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["auto", "side", "stacked"],
        optionTitles: ["Auto", "Side", "Stacked"],
        defaultValue: "auto",
        displaySegmentedControl: true,
        description: "Auto puts the bars beside the score when there is room.",
    },
    barValues: {
        type: ControlType.Enum,
        title: "Bar Values",
        options: ["percent", "count", "both", "none"],
        optionTitles: ["Percent", "Count", "Both", "Hide"],
        defaultValue: "percent",
    },
    showStars: { type: ControlType.Boolean, title: "Stars Row", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    averageDecimals: { type: ControlType.Number, title: "Decimals", defaultValue: 1, min: 0, max: 2, step: 1, displayStepper: true },
    buttonText: { type: ControlType.String, title: "Button", defaultValue: "", placeholder: "Write a review" },
    buttonLink: { type: ControlType.Link, title: "Link", hidden: (p: RatingBreakdownProps) => !p.buttonText },
    newTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No", hidden: (p: RatingBreakdownProps) => !p.buttonText },
    note: { type: ControlType.String, title: "Note", defaultValue: "", placeholder: "Verified purchases only" },
    showTooltip: { type: ControlType.Boolean, title: "Tooltip", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    theme: {
        type: ControlType.Enum,
        title: "Color",
        options: ["gold", "mint", "green", "blue", "purple", "orange", "pink", "mono", "custom"],
        optionTitles: ["Gold", "Mint", "Green", "Blue", "Purple", "Orange", "Pink", "Mono", "Custom"],
        defaultValue: "gold",
    },
    accent: { type: ControlType.Color, title: "Custom Color", defaultValue: "#F5A524", hidden: (p: RatingBreakdownProps) => p.theme !== "custom" },
    appearance: { type: ControlType.Enum, title: "Appearance", options: ["light", "dark"], optionTitles: ["Light", "Dark"], defaultValue: "light", displaySegmentedControl: true },
    locale: { type: ControlType.String, title: "Locale", defaultValue: "en-US", placeholder: "en-US, de-DE, ja-JP…" },
    barHeight: { type: ControlType.Number, title: "Bar Height", defaultValue: 10, min: 3, max: 40, step: 1, unit: "px" },
    barRadius: { type: ControlType.Number, title: "Bar Radius", defaultValue: 5, min: 0, max: 20, step: 1, unit: "px" },
    rowGap: { type: ControlType.Number, title: "Row Gap", defaultValue: 10, min: 0, max: 40, step: 1, unit: "px" },
    starSize: { type: ControlType.Number, title: "Star Size", defaultValue: 20, min: 8, max: 60, step: 1, unit: "px" },
    textScale: { type: ControlType.Number, title: "Text Scale", defaultValue: 1, min: 0.5, max: 3, step: 0.05, unit: "×" },
    customColors: { type: ControlType.Boolean, title: "Colors", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Preset" },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        hidden: (p: RatingBreakdownProps) => !p.customColors,
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            muted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#6B6B76" },
            track: { type: ControlType.Color, title: "Bar Track", defaultValue: "#EDEDEF" },
            star: { type: ControlType.Color, title: "Star", defaultValue: "#F5A524" },
            starEmpty: { type: ControlType.Color, title: "Empty Star", defaultValue: "#E1E1E4" },
            bar: { type: ControlType.Color, title: "Bar", defaultValue: "#F5A524" },
            tooltipBg: { type: ControlType.Color, title: "Tooltip", defaultValue: "#111114" },
            tooltipText: { type: ControlType.Color, title: "Tooltip Text", defaultValue: "#FFFFFF" },
        },
    },
    animate: { type: ControlType.Boolean, title: "Animate In", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 900, min: 200, max: 4000, step: 50, unit: "ms", hidden: (p: RatingBreakdownProps) => !p.animate },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 60, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 24, min: 0, max: 80, step: 1, unit: "px" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 15, lineHeight: "1.4em" },
        description: "Created by BrandingUp",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 13, lineHeight: "1.35em" },
    },
})
