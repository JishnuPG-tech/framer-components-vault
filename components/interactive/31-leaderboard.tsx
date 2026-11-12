// [생성일] 2026-10-18
// [경위] 달러벌기 31번 상품(무료) — 순위표. 점수 자동 정렬·순위·금은동 배지·포디움·점수 막대·이전 순위 대비 이동 화살표·검색·태그 탭·Show more
// [변경이력]
//   - 2026-10-18: 최초 생성 (동점 공동 순위·낮을수록 좋음·1회 막대 애니메이션·정적/캔버스 완성 상태·화면 밖 정지·모바일 컬럼 축소·라이트/다크)
//   - 2026-10-31: 프레이머 자동 심사 권고 반영 — 인라인 outline 제거 후 키보드 초점(:focus-visible) 테두리 유지·보강, 느슨한 타입(any)을 실제 타입으로 교체

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
interface Item {
    name?: string
    score?: number
    avatar?: { src?: string; srcSet?: string; alt?: string }
    tag?: string
    prevRank?: number
}

interface Colors {
    background?: string
    row?: string
    text?: string
    muted?: string
    accent?: string
    gold?: string
    silver?: string
    bronze?: string
    up?: string
    down?: string
}

interface LeaderboardProps {
    items?: Item[]
    podium?: boolean
    bestScore?: "high" | "low"
    appearance?: "light" | "dark"
    limit?: number
    showMedals?: boolean
    showBars?: boolean
    showMovement?: boolean
    showAvatars?: boolean
    showTags?: boolean
    searchable?: boolean
    tabs?: boolean
    prefix?: string
    suffix?: string
    decimals?: number
    separator?: boolean
    animate?: boolean
    duration?: number
    striped?: boolean
    gap?: number
    padding?: number
    radius?: number
    showMoreLabel?: string
    showLessLabel?: string
    searchPlaceholder?: string
    allLabel?: string
    customColors?: boolean
    colors?: Colors
    nameFont?: CSSProperties
    scoreFont?: CSSProperties
    style?: CSSProperties
}

// 설치 직후 보이는 샘플 10명 (이미지 없이 이니셜 아바타로 완성된 모습)
const SAMPLE: Item[] = [
    { name: "Mina Park", score: 9820, tag: "Design", prevRank: 2 },
    { name: "Liam Carter", score: 9475, tag: "Product", prevRank: 1 },
    { name: "Sofia Alvarez", score: 9210, tag: "Growth", prevRank: 5 },
    { name: "Noah Kim", score: 8890, tag: "Design", prevRank: 3 },
    { name: "Aiko Tanaka", score: 8420, tag: "Product", prevRank: 4 },
    { name: "Ethan Brooks", score: 7985, tag: "Growth", prevRank: 8 },
    { name: "Zara Ahmed", score: 7530, tag: "Design", prevRank: 6 },
    { name: "Lucas Meyer", score: 7102, tag: "Product", prevRank: 7 },
    { name: "Hana Lee", score: 6640, tag: "Growth", prevRank: 0 },
    { name: "Oliver Smith", score: 6215, tag: "Design", prevRank: 9 },
]

const NARROW_BREAK = 480 // 컨테이너 폭 기준 모바일 전환점

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

// 프레이머는 색을 rgb()/rgba() 로도 넘기므로 HEX·rgb 둘 다 처리
function parseColor(c: string): [number, number, number] | null {
    if (typeof c !== "string") return null
    const m = c.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
    if (m) return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])]
    if (c.charAt(0) === "#") {
        let h = c.slice(1)
        if (h.length === 3 || h.length === 4) h = h.split("").map((x) => x + x).join("")
        if (h.length >= 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
    }
    return null
}

function withAlpha(color: string, alpha: number) {
    const rgb = parseColor(color)
    return rgb ? "rgba(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ", " + alpha + ")" : color
}

function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
}

// 점수 서식: 접두·접미·소수 자릿수·천 단위 구분
function formatScore(v: number, prefix: string, suffix: string, decimals: number, separator: boolean) {
    const d = clamp(Math.round(decimals), 0, 4)
    const n = Math.abs(v)
    let s = n.toFixed(d)
    if (separator) {
        const parts = s.split(".")
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        s = parts.join(".")
    }
    return (v < 0 ? "−" : "") + prefix + s + suffix
}

// 이름에서 이니셜 2글자
function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (!parts.length) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// 이름으로 고정된 아바타 배경색 (같은 이름은 항상 같은 색)
function hueOf(name: string) {
    let h = 0
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
    return h
}

function fontSizeOf(ctl: CSSProperties | undefined, fallback: number): number {
    const n = parseFloat(String(ctl && ctl.fontSize))
    return isFinite(n) && n > 0 ? n : fallback
}

// ─────────────────────────────────────────────
// 작은 부품: 아바타 · 메달 · 이동 표시
// ─────────────────────────────────────────────
function Avatar({ item, size, ring }: { item: Item; size: number; ring?: string }) {
    const name = item.name || "?"
    const h = hueOf(name)
    return (
        <span
            aria-hidden="true"
            style={{
                width: size,
                height: size,
                flex: "0 0 auto",
                borderRadius: "50%",
                overflow: "hidden",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "hsl(" + h + ", 62%, 88%)",
                color: "hsl(" + h + ", 55%, 28%)",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: Math.round(size * 0.38),
                boxShadow: ring ? "0 0 0 3px " + ring : "none",
            }}
        >
            {item.avatar?.src ? <img src={item.avatar.src} srcSet={item.avatar.srcSet} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : initials(name)}
        </span>
    )
}

// 순위 배지: 1~3위는 금·은·동 원형, 그 외는 숫자만
function RankBadge({ rank, medal, medals, textColor, mutedColor, size }: { rank: number; medal?: string; medals: boolean; textColor: string; mutedColor: string; size: number }) {
    if (medals && medal) {
        return (
            <span
                aria-hidden="true"
                style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: "linear-gradient(145deg, " + withAlpha(medal, 0.85) + ", " + medal + ")",
                    color: "#1A1405",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: Math.round(size * 0.46),
                    boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.12), 0 2px 6px " + withAlpha(medal, 0.45),
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {rank}
            </span>
        )
    }
    return (
        <span aria-hidden="true" style={{ width: size, textAlign: "center", fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 15, color: rank <= 3 ? textColor : mutedColor, fontVariantNumeric: "tabular-nums" }}>
            {rank}
        </span>
    )
}

// 이전 순위 대비 이동 (▲ 올랐음 · ▼ 내렸음 · – 그대로/기록 없음). 삼각형은 SVG 라 폰트에 흔들리지 않음
function Movement({ delta, hasPrev, up, down, muted }: { delta: number; hasPrev: boolean; up: string; down: string; muted: string }) {
    if (!hasPrev || delta === 0) {
        return (
            <span aria-hidden="true" style={{ color: muted, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, width: 40, display: "inline-flex", justifyContent: "flex-end" }}>
                –
            </span>
        )
    }
    const isUp = delta > 0
    const color = isUp ? up : down
    return (
        <span aria-hidden="true" style={{ color, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 600, width: 40, display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontVariantNumeric: "tabular-nums" }}>
            <svg width="9" height="9" viewBox="0 0 10 10" style={{ transform: isUp ? "none" : "rotate(180deg)" }}>
                <path d="M5 1.5 9 8H1z" fill="currentColor" />
            </svg>
            {Math.abs(delta)}
        </span>
    )
}

/**
 * Leaderboard — 점수를 넣으면 자동 정렬·순위 번호·금은동 배지·점수 막대·이전 순위 대비 ▲▼ 이동을 보여주는 순위표.
 * 옵션 Podium(상위 3명 단상), 검색, 태그 탭, Show more, 낮을수록 좋은 점수, 라이트/다크, 모바일 컬럼 축소.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 640
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function Leaderboard(props: LeaderboardProps) {
    const {
        items,
        podium = false,
        bestScore = "high",
        appearance = "light",
        limit = 10,
        showMedals = true,
        showBars = true,
        showMovement = true,
        showAvatars = true,
        showTags = true,
        searchable = false,
        tabs = false,
        prefix = "",
        suffix = " pts",
        decimals = 0,
        separator = true,
        animate = true,
        duration = 900,
        striped = true,
        gap = 8,
        padding = 16,
        radius = 16,
        showMoreLabel = "Show more",
        showLessLabel = "Show less",
        searchPlaceholder = "Search players",
        allLabel = "All",
        customColors = false,
        colors: colorProps,
        nameFont,
        scoreFont,
        style,
    } = props

    // ── 색 기본값: Appearance 에 따르고, Colors 에 입력한 값이 있으면 그것을 우선 ──
    // [2026-10-18] 프레이머는 기본값 없는 Color 컨트롤을 파란색(#09F)으로 채워 넘기므로, Custom Colors 를 켰을 때만 Colors 값을 사용
    const colors = customColors ? colorProps : undefined
    const dark = appearance === "dark"
    const theme = {
        background: colors?.background ?? (dark ? "#101114" : "#FFFFFF"),
        row: colors?.row ?? (dark ? "#17181C" : "#F6F6F8"),
        text: colors?.text ?? (dark ? "#F4F4F6" : "#111114"),
        muted: colors?.muted ?? (dark ? "#9A9AA6" : "#6B6B76"),
        accent: colors?.accent ?? "#2DE5A0",
        gold: colors?.gold ?? "#F5B301",
        silver: colors?.silver ?? "#B4BBC6",
        bronze: colors?.bronze ?? "#D08A4E",
        up: colors?.up ?? (dark ? "#3DDC84" : "#16A34A"),
        down: colors?.down ?? "#E5484D",
    }
    const medalOf = (rank: number) => (rank === 1 ? theme.gold : rank === 2 ? theme.silver : rank === 3 ? theme.bronze : undefined)

    // ── 데이터: 정렬 → 공동 순위 계산 (1,2,2,4 방식) ──
    const ranked = useMemo(() => {
        const src = Array.isArray(items) && items.length ? items : SAMPLE
        const list = src.slice(0, 50).map((it, i) => ({ it, key: i, score: isFinite(Number(it.score)) ? Number(it.score) : 0 }))
        const dir = bestScore === "low" ? 1 : -1
        list.sort((a, b) => (a.score - b.score) * dir || a.key - b.key)
        let prevScore: number | null = null
        let prevRank = 0
        return list.map((r, i) => {
            const rank = prevScore !== null && r.score === prevScore ? prevRank : i + 1
            prevScore = r.score
            prevRank = rank
            return { ...r, rank }
        })
    }, [items, bestScore])

    // 막대 길이 기준: 높을수록 좋음 = 점수/최고점, 낮을수록 좋음 = 최저점/점수 (1위가 항상 가장 긴 막대)
    const scores = ranked.map((r) => r.score)
    const maxS = scores.length ? Math.max(...scores) : 0
    const minS = scores.length ? Math.min(...scores) : 0
    const ratioOf = (s: number) => {
        if (bestScore === "low") return s > 0 && minS > 0 ? clamp(minS / s, 0.04, 1) : 1
        return maxS > 0 ? clamp(s / maxS, 0.03, 1) : 0
    }

    // ── 검색·탭 필터 ──
    const tagList = useMemo(() => {
        const t: string[] = []
        ranked.forEach((r) => {
            const g = (r.it.tag || "").trim()
            if (g && t.indexOf(g) < 0) t.push(g)
        })
        return t
    }, [ranked])
    const [inputValue, setInputValue] = useState("")
    const [query, setQuery] = useState("")
    const [activeTag, setActiveTag] = useState("")
    const [expanded, setExpanded] = useState(false)
    const useTabs = tabs && tagList.length >= 2
    const filtering = (searchable && query.trim() !== "") || (useTabs && activeTag !== "")
    const filtered = ranked.filter((r) => {
        if (useTabs && activeTag && (r.it.tag || "").trim() !== activeTag) return false
        if (searchable && query.trim() && (r.it.name || "").toLowerCase().indexOf(query.trim().toLowerCase()) < 0) return false
        return true
    })
    const cap = clamp(Math.round(limit), 3, 50)
    const visible = expanded ? filtered : filtered.slice(0, cap)
    const hasMore = filtered.length > cap

    // 포디움은 필터가 없을 때만 (필터 결과의 3명을 1·2·3위처럼 보이게 하지 않음)
    const usePodium = podium && !filtering && visible.length >= 3
    const podiumItems = usePodium ? visible.slice(0, 3) : []
    const rows = usePodium ? visible.slice(3) : visible

    // ── 컨테이너 폭 측정 (모바일에서 컬럼 줄이기) ──
    const rootRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(640)
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const apply = () => {
            const w = el.getBoundingClientRect().width
            if (w > 0) startTransition(() => setWidth(w))
        }
        apply()
        const ro = new ResizeObserver(apply)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const narrow = width <= NARROW_BREAK

    // ── 막대 등장: 보일 때 1회만. 정적 렌더·캔버스·모션 줄이기·Animate 꺼짐 → 완성 상태. 화면 밖에서는 시작하지 않음 ──
    const isStatic = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const willAnimate = animate && !isStatic && !isCanvas
    const [shown, setShown] = useState(!willAnimate)
    const [reduced, setReduced] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => startTransition(() => setReduced(mq.matches))
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])
    useEffect(() => {
        const el = rootRef.current
        if (!willAnimate) {
            startTransition(() => setShown(true))
            return
        }
        if (!el || typeof IntersectionObserver === "undefined") {
            startTransition(() => setShown(true))
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0] && entries[0].isIntersecting) {
                    startTransition(() => setShown(true))
                    io.disconnect() // 1회만: 한 번 보이면 관찰 종료
                }
            },
            { threshold: 0.2 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [willAnimate])
    const motion = willAnimate && !reduced
    const dur = clamp(duration, 100, 4000)

    // ── 스타일 ──
    const nameBase: CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 500, lineHeight: "1.3em", ...nameFont }
    const scoreBase: CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 600, lineHeight: "1.2em", ...scoreFont }
    const nfs = fontSizeOf(nameFont, 15)
    const sr = { position: "absolute" as const, width: 1, height: 1, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" as const, border: 0, padding: 0 }

    const fmt = (v: number) => formatScore(v, prefix, suffix, decimals, separator)
    const moveOf = (r: { it: Item; rank: number }) => {
        const prev = Math.round(Number(r.it.prevRank))
        const hasPrev = isFinite(prev) && prev > 0
        return { hasPrev, delta: hasPrev ? prev - r.rank : 0 }
    }
    const describe = (r: { it: Item; rank: number; score: number }) => {
        const m = moveOf(r)
        const mv = showMovement && m.hasPrev && m.delta !== 0 ? ", " + (m.delta > 0 ? "up " : "down ") + Math.abs(m.delta) : ""
        return "Rank " + r.rank + ", " + (r.it.name || "Unnamed") + ", " + fmt(r.score) + mv
    }

    const css = `
.lb-row:focus-visible, .lb-btn:focus-visible, .lb-input:focus-visible { outline: 2px solid ${theme.accent}; outline-offset: 2px; }
.lb-row { transition: ${motion ? "background 0.2s ease" : "none"}; }
.lb-input::placeholder { color: ${theme.muted}; opacity: 1; }
`

    // ── 포디움 (2위 · 1위 · 3위 순서로 배치, 막대 높이로 단상 표현) ──
    const podiumOrder = podiumItems.length === 3 ? [podiumItems[1], podiumItems[0], podiumItems[2]] : []
    const podiumH = narrow ? [88, 116, 68] : [110, 148, 84]
    const podiumEl = usePodium && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: narrow ? 8 : 14, alignItems: "end", marginBottom: gap + 6 }}>
            {podiumOrder.map((r, idx) => {
                const medal = medalOf(r.rank) || theme.gold
                const h = podiumH[idx]
                const aSize = idx === 1 ? (narrow ? 56 : 72) : narrow ? 44 : 56
                return (
                    <div key={r.key} role="listitem" tabIndex={0} className="lb-row" aria-label={describe(r)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0, borderRadius: radius }}>
                        <Avatar item={r.it} size={aSize} ring={withAlpha(medal, 0.9)} />
                        <span style={{ ...nameBase, color: theme.text, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }}>{r.it.name || "Unnamed"}</span>
                        <span aria-hidden="true" style={{ ...scoreBase, color: theme.muted, fontVariantNumeric: "tabular-nums", fontSize: Math.max(12, fontSizeOf(scoreFont, 15) - 2) }}>
                            {fmt(r.score)}
                        </span>
                        <div
                            aria-hidden="true"
                            style={{
                                width: "100%",
                                height: shown ? h : motion ? 0 : h,
                                transition: motion ? "height " + dur + "ms cubic-bezier(0.22, 1, 0.36, 1) " + idx * 90 + "ms" : "none",
                                background: "linear-gradient(180deg, " + withAlpha(medal, dark ? 0.5 : 0.42) + ", " + withAlpha(medal, dark ? 0.12 : 0.1) + ")",
                                borderTop: "3px solid " + medal,
                                borderRadius: Math.min(radius, 14) + "px " + Math.min(radius, 14) + "px 0 0",
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "center",
                                paddingTop: 10,
                                boxSizing: "border-box",
                                overflow: "hidden",
                            }}
                        >
                            <RankBadge rank={r.rank} medal={medal} medals={true} textColor={theme.text} mutedColor={theme.muted} size={narrow ? 28 : 34} />
                        </div>
                    </div>
                )
            })}
        </div>
    )

    // ── 목록 한 줄 ──
    const renderRow = (r: (typeof ranked)[number], i: number) => {
        const m = moveOf(r)
        const medal = medalOf(r.rank)
        const ratio = ratioOf(r.score)
        const tag = (r.it.tag || "").trim()
        const barOn = showBars
        const bar = (
            <div aria-hidden="true" style={{ position: "relative", height: narrow ? 4 : 8, borderRadius: 999, background: withAlpha(theme.text, dark ? 0.1 : 0.07), overflow: "hidden", width: "100%" }}>
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: (shown ? ratio * 100 : motion ? 0 : ratio * 100) + "%",
                        borderRadius: 999,
                        background: medal ? medal : theme.accent,
                        transition: motion ? "width " + dur + "ms cubic-bezier(0.22, 1, 0.36, 1) " + Math.min(i, 12) * 50 + "ms" : "none",
                    }}
                />
            </div>
        )
        return (
            <div
                key={r.key}
                role="listitem"
                tabIndex={0}
                className="lb-row"
                aria-label={describe(r)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: narrow ? 10 : 14,
                    padding: narrow ? "10px 12px" : "12px 16px",
                    borderRadius: Math.min(radius, 18),
                    background: striped && i % 2 === 0 ? theme.row : "transparent",
                    minWidth: 0,
                }}
            >
                <RankBadge rank={r.rank} medal={medal} medals={showMedals} textColor={theme.text} mutedColor={theme.muted} size={30} />
                {showAvatars && <Avatar item={r.it} size={narrow ? 34 : 40} />}
                <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: narrow ? 6 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span style={{ ...nameBase, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{r.it.name || "Unnamed"}</span>
                        {showTags && tag && !narrow && (
                            <span aria-hidden="true" style={{ fontFamily: "Inter, sans-serif", fontSize: Math.max(11, nfs - 3), fontWeight: 500, color: theme.muted, background: withAlpha(theme.text, dark ? 0.1 : 0.06), padding: "3px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{tag}</span>
                        )}
                    </div>
                    {barOn && narrow && bar}
                </div>
                {barOn && !narrow && <div style={{ flex: "0 0 30%", minWidth: 60 }}>{bar}</div>}
                <span aria-hidden="true" style={{ ...scoreBase, color: theme.text, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", minWidth: narrow ? 0 : 78, textAlign: "right" }}>
                    {fmt(r.score)}
                </span>
                {showMovement && <Movement delta={m.delta} hasPrev={m.hasPrev} up={theme.up} down={theme.down} muted={theme.muted} />}
            </div>
        )
    }

    const controlH = 40
    const showControls = searchable || useTabs

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                width: "100%",
                boxSizing: "border-box",
                background: theme.background,
                color: theme.text,
                borderRadius: radius,
                padding,
                display: "flex",
                flexDirection: "column",
                gap,
                overflow: "hidden",
            }}
        >
            <style>{css}</style>

            {/* 검색 + 태그 탭 */}
            {showControls && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {searchable && (
                        <input
                            className="lb-input"
                            type="search"
                            value={inputValue}
                            placeholder={searchPlaceholder}
                            aria-label={searchPlaceholder}
                            onChange={(e) => {
                                const v = e.target.value
                                setInputValue(v) // 입력창 값은 즉시, 필터링은 낮은 우선순위로
                                startTransition(() => setQuery(v))
                            }}
                            style={{
                                height: controlH,
                                boxSizing: "border-box",
                                width: "100%",
                                padding: "0 14px",
                                borderRadius: Math.min(radius, 12),
                                border: "1px solid " + withAlpha(theme.text, dark ? 0.16 : 0.1),
                                background: "transparent",
                                color: theme.text,
                                ...nameBase,
                                fontWeight: 400,
                            }}
                        />
                    )}
                    {useTabs && (
                        <div role="tablist" aria-label="Filter by tag" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                            {[""].concat(tagList).map((t) => {
                                const on = activeTag === t
                                return (
                                    <button
                                        key={t || "__all"}
                                        role="tab"
                                        aria-selected={on}
                                        className="lb-btn"
                                        onClick={() =>
                                            startTransition(() => {
                                                setActiveTag(t)
                                                setExpanded(false)
                                            })
                                        }
                                        style={{
                                            ...nameBase,
                                            fontSize: Math.max(12, nfs - 1),
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                            padding: "7px 14px",
                                            borderRadius: 999,
                                            border: "1px solid " + (on ? theme.accent : withAlpha(theme.text, dark ? 0.16 : 0.1)),
                                            background: on ? theme.accent : "transparent",
                                            color: on ? "#0B1A13" : theme.muted,
                                            fontWeight: on ? 600 : 500,
                                        }}
                                    >
                                        {t || allLabel}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 목록 전체: 스크린리더에는 role=list 로 읽히고 줄마다 요약 문장이 붙는다 */}
            <div role="list" aria-label="Leaderboard" style={{ display: "flex", flexDirection: "column", gap: usePodium ? 0 : 2 }}>
                {podiumEl}
                {rows.map(renderRow)}
                {filtered.length === 0 && (
                    <div style={{ ...nameBase, color: theme.muted, textAlign: "center", padding: "28px 0" }}>No results</div>
                )}
            </div>

            {hasMore && (
                <button
                    className="lb-btn"
                    aria-expanded={expanded}
                    onClick={() => startTransition(() => setExpanded(!expanded))}
                    style={{
                        ...nameBase,
                        fontSize: Math.max(13, nfs - 1),
                        fontWeight: 600,
                        cursor: "pointer",
                        alignSelf: "center",
                        padding: "9px 20px",
                        borderRadius: 999,
                        border: "1px solid " + withAlpha(theme.text, dark ? 0.2 : 0.14),
                        background: "transparent",
                        color: theme.text,
                    }}
                >
                    {expanded ? showLessLabel : showMoreLabel + " (" + (filtered.length - cap) + ")"}
                </button>
            )}
            <span style={sr} aria-live="polite">
                {filtering ? filtered.length + " results" : ""}
            </span>
        </div>
    )
}

Leaderboard.displayName = "Leaderboard"

addPropertyControls(Leaderboard, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 50,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "New player" },
                score: { type: ControlType.Number, title: "Score", defaultValue: 5000, min: -1000000000, max: 1000000000, step: 1, displayStepper: true },
                avatar: { type: ControlType.ResponsiveImage, title: "Avatar" },
                tag: { type: ControlType.String, title: "Tag", defaultValue: "", placeholder: "Team or group" },
                prevRank: { type: ControlType.Number, title: "Previous Rank", defaultValue: 0, min: 0, max: 100, step: 1, displayStepper: true },
            },
        },
        defaultValue: SAMPLE,
    },
    podium: { type: ControlType.Boolean, title: "Podium", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    bestScore: {
        type: ControlType.Enum,
        title: "Best Score",
        options: ["high", "low"],
        optionTitles: ["Highest", "Lowest"],
        defaultValue: "high",
        displaySegmentedControl: true,
    },
    appearance: {
        type: ControlType.Enum,
        title: "Appearance",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    limit: { type: ControlType.Number, title: "Rows Shown", defaultValue: 10, min: 3, max: 50, step: 1, displayStepper: true },
    showMedals: { type: ControlType.Boolean, title: "Medals", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showBars: { type: ControlType.Boolean, title: "Score Bars", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showMovement: { type: ControlType.Boolean, title: "Movement", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showAvatars: { type: ControlType.Boolean, title: "Avatars", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showTags: { type: ControlType.Boolean, title: "Tags", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    searchable: { type: ControlType.Boolean, title: "Search", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    searchPlaceholder: { type: ControlType.String, title: "Placeholder", defaultValue: "Search players", hidden: (p: LeaderboardProps) => !p.searchable },
    tabs: { type: ControlType.Boolean, title: "Tag Tabs", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    allLabel: { type: ControlType.String, title: "All Label", defaultValue: "All", hidden: (p: LeaderboardProps) => !p.tabs },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "", placeholder: "$" },
    suffix: { type: ControlType.String, title: "Suffix", defaultValue: " pts", placeholder: " pts, %, s" },
    decimals: { type: ControlType.Number, title: "Decimals", defaultValue: 0, min: 0, max: 4, step: 1, displayStepper: true },
    separator: { type: ControlType.Boolean, title: "Thousands", defaultValue: true, enabledTitle: "1,000", disabledTitle: "1000" },
    animate: { type: ControlType.Boolean, title: "Animate", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    duration: { type: ControlType.Number, title: "Duration", defaultValue: 900, min: 100, max: 4000, step: 50, unit: "ms", hidden: (p: LeaderboardProps) => !p.animate },
    striped: { type: ControlType.Boolean, title: "Stripes", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 8, min: 0, max: 40, step: 1, unit: "px" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 16, min: 0, max: 64, step: 1, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 48, step: 1, unit: "px" },
    showMoreLabel: { type: ControlType.String, title: "More Label", defaultValue: "Show more" },
    showLessLabel: { type: ControlType.String, title: "Less Label", defaultValue: "Show less" },
    customColors: { type: ControlType.Boolean, title: "Colors", defaultValue: false, enabledTitle: "Custom", disabledTitle: "Preset" },
    colors: {
        type: ControlType.Object,
        title: "Custom Colors",
        icon: "color",
        hidden: (p: LeaderboardProps) => !p.customColors,
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
            row: { type: ControlType.Color, title: "Stripe Row", defaultValue: "#F6F6F8" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            muted: { type: ControlType.Color, title: "Muted", defaultValue: "#6B6B76" },
            accent: { type: ControlType.Color, title: "Accent", defaultValue: "#2DE5A0" },
            gold: { type: ControlType.Color, title: "Gold", defaultValue: "#F5B301" },
            silver: { type: ControlType.Color, title: "Silver", defaultValue: "#B4BBC6" },
            bronze: { type: ControlType.Color, title: "Bronze", defaultValue: "#D08A4E" },
            up: { type: ControlType.Color, title: "Moved Up", defaultValue: "#16A34A" },
            down: { type: ControlType.Color, title: "Moved Down", defaultValue: "#E5484D" },
        },
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Medium", lineHeight: "1.3em" },
    },
    scoreFont: {
        type: ControlType.Font,
        title: "Score Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Semibold", lineHeight: "1.2em" },
        description: "Created by BrandingUp",
    },
})
