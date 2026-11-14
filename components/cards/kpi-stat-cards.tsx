// build: ksc-cms-1001
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import type { CSSProperties, ReactNode, RefObject } from "react"
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"

// Show more a11y (WAI disclosure + status pattern): the button reports aria-expanded (extra items shown or not) and
// aria-controls (our own list container, id from useId); a visually hidden polite live region of ours announces each reveal.
const SHOW_MORE_SR = { position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 } as const
function showMoreNote(added: number, shown: number, total: number): string {
    return `${added} more ${added === 1 ? "item" : "items"} shown (${shown} of ${total})`
}


const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

type ColorValue = string | { value?: string }
type FontValue = { fontFamily?: string; fontWeight?: number | string; fontStyle?: string }

type CardItem = {
    label?: string
    value?: string
    delta?: number
    invert?: boolean
    note?: string
}

type Props = {
    cmsCards: ReactNode[]
    labelLayer: string
    valueLayer: string
    deltaLayer: string
    noteLayer: string
    styleCmsLayers: boolean
    label: string
    value: string
    delta: string
    note: string
    lowerIsBetter: boolean
    cards: CardItem[]
    columns: number
    minCardWidth: number
    gap: number
    padding: number
    radius: number
    valueSize: number
    textSize: number
    showArrow: boolean
    accentBar: boolean
    reveal: boolean
    emptyText: string
    initialCount: number
    showMoreLabel: string
    font?: FontValue
    accentColor: ColorValue
    cardColor: ColorValue
    borderColor: ColorValue
    textColor: ColorValue
    mutedColor: ColorValue
    upColor: ColorValue
    downColor: ColorValue
    style?: CSSProperties
}

const DEMO: CardItem[] = [
    { label: "Monthly Revenue", value: "$48.2k", delta: 12 },
    { label: "Active Users", value: "3,912", delta: 8 },
    { label: "Churn Rate", value: "1.4%", delta: -3, invert: true },
]

// defaultProps 대신(10/1 규칙) — undefined 인 키만 채운다. 컨트롤 defaultValue 와 같은 값.
const DEFAULTS: Props = {
    cmsCards: [],
    labelLayer: "Label",
    valueLayer: "Value",
    deltaLayer: "Delta",
    noteLayer: "Note",
    styleCmsLayers: true,
    label: "",
    value: "",
    delta: "",
    note: "",
    lowerIsBetter: false,
    cards: DEMO,
    columns: 3,
    minCardWidth: 200,
    gap: 14,
    padding: 20,
    radius: 16,
    valueSize: 30,
    textSize: 13,
    showArrow: true,
    accentBar: true,
    reveal: true,
    emptyText: "Add a card to build the grid.",
    initialCount: 0,
    showMoreLabel: "Show more",
    accentColor: "#6D5EF6",
    cardColor: "#111118",
    borderColor: "rgba(255,255,255,0.07)",
    textColor: "#F5F5FA",
    mutedColor: "rgba(245,245,250,0.55)",
    upColor: "#3FCF8E",
    downColor: "#F65E6D",
}

function withDefaults(input: Partial<Props>): Props {
    const out: Props = { ...DEFAULTS }
    const src = input as Record<string, unknown>
    const dst = out as unknown as Record<string, unknown>
    for (const key of Object.keys(src)) if (src[key] !== undefined) dst[key] = src[key]
    return out
}

// ControlType.Color 토큰 언랩 — framerlabs SKILL.md Pitfalls
const tok = (v?: ColorValue): string => (!v ? "" : typeof v === "string" ? v : v.value || "")
// CSS 문자열로 들어가는 값: 선언·블록 구분자, 꺾쇠, 따옴표, 앰퍼샌드, 주석 표시를 뗀다.
const cssToken = (v: string): string => String(v || "").replace(/[;{}<>\\"'&]|\/\*|\*\//g, "").slice(0, 200)

function fontFamilyOf(f?: FontValue): string {
    const raw = (f && f.fontFamily) || ""
    return raw.replace(/["'<>{};&\\]/g, "").trim()
}

const num = (v: unknown, fallback: number, min: number, max: number): number => {
    const n = typeof v === "number" && isFinite(v) ? v : fallback
    return Math.max(min, Math.min(max, n))
}

type Palette = { accent: string; card: string; border: string; text: string; muted: string; up: string; down: string }

function paletteOf(p: Props): Palette {
    return {
        accent: cssToken(tok(p.accentColor)) || "#6D5EF6",
        card: cssToken(tok(p.cardColor)) || "#111118",
        border: cssToken(tok(p.borderColor)) || "transparent",
        text: cssToken(tok(p.textColor)) || "#F5F5FA",
        muted: cssToken(tok(p.mutedColor)) || "rgba(245,245,250,0.55)",
        up: cssToken(tok(p.upColor)) || "#3FCF8E",
        down: cssToken(tok(p.downColor)) || "#F65E6D",
    }
}

// ---------------------------------------------------------------- 증감 방향
type Dir = "up" | "down" | "flat"
type Tone = "good" | "bad" | "flat"

const UP_MARKS = "+▲↑"
const DOWN_MARKS = "-−–▼↓"

// 글자 그대로의 증감("+12%", "-3.1%", "−0.4 pt", "▲ 5")에서 방향을 읽는다. 처음 나오는 부호·화살표·숫자로 정한다.
// 부호 없는 양수("12%")는 증가, 0 은 보합, 숫자가 없으면 보합(색 없음).
function dirOfText(raw: string): Dir {
    const t = String(raw || "")
    for (let i = 0; i < t.length; i += 1) {
        const c = t.charAt(i)
        if (UP_MARKS.indexOf(c) >= 0) return "up"
        if (DOWN_MARKS.indexOf(c) >= 0) {
            // "Q1-Q2" 처럼 글자 사이의 하이픈은 부호가 아니다
            if (c === "-" && i > 0 && /[A-Za-z0-9]/.test(t.charAt(i - 1))) continue
            return "down"
        }
        if (c >= "0" && c <= "9") {
            const m = t.slice(i).match(/^\d+(?:[.,]\d+)?/)
            const n = m ? Number(m[0].replace(",", ".")) : 0
            return n > 0 ? "up" : "flat"
        }
    }
    return "flat"
}

function dirOfNumber(n: number): Dir {
    return n > 0 ? "up" : n < 0 ? "down" : "flat"
}

function toneOf(dir: Dir, invert: boolean): Tone {
    if (dir === "flat") return "flat"
    return (dir === "up") !== invert ? "good" : "bad"
}


// ---------------------------------------------------------------- CSS (R8: 보간 없는 모듈 상수)
// 사용자 값(열 · 간격 · 크기 · 색 · 글꼴)은 루트 inline style 의 CSS 변수(--ksc-*)로만 들어온다. 이 문자열에는 보간이 없다.
// `>` · 따옴표 · 앰퍼샌드 없음(React 18 SSR 이 <style> 텍스트를 이스케이프한다). 속성 선택자는 따옴표 없이.
// 열 = auto-fit. 한 칸은 최소 Min card width, 최대 열 수는 Columns. 좁은 화면에선 100% 를 넘지 않는다(컨테이너 폭 기준).
const STYLE_CSS =
    ".ksc-root{font-family:var(--ksc-ff);box-sizing:border-box;width:100%}" +
    ".ksc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,max(var(--ksc-minw),calc((100% - (var(--ksc-cols) - 1) * var(--ksc-gap)) / var(--ksc-cols)))),1fr));gap:var(--ksc-gap);width:100%}" +
    ".ksc-card{background:var(--ksc-card);border:1px solid var(--ksc-border);border-radius:var(--ksc-radius);padding:var(--ksc-pad);box-shadow:var(--ksc-shadow);box-sizing:border-box;min-width:0;display:flex;flex-direction:column;gap:10px;color:inherit;text-decoration:none}" +
    ".ksc-label{margin:0;font-size:var(--ksc-tsize);line-height:1.3;color:var(--ksc-muted);letter-spacing:0.2px}" +
    ".ksc-value{margin:0;font-size:var(--ksc-vsize);font-weight:700;line-height:1;color:var(--ksc-text);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}" +
    ".ksc-delta{margin:0;display:inline-flex;align-items:center;gap:5px;font-size:var(--ksc-tsize);font-weight:600;color:var(--ksc-muted)}" +
    ".ksc-note{margin:0;font-size:var(--ksc-nsize);line-height:1.35;color:var(--ksc-muted)}" +
    ".ksc-delta[data-ksc-tone=good]{color:var(--ksc-up)}" +
    ".ksc-delta[data-ksc-tone=bad]{color:var(--ksc-down)}" +
    ".ksc-arrow{display:inline-block;flex:none;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent}" +
    ".ksc-arrow[data-ksc-dir=up]{border-bottom:6px solid currentColor}" +
    ".ksc-arrow[data-ksc-dir=down]{border-top:6px solid currentColor}" +
    ".ksc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;margin:-1px;padding:0;border:0}" +
    ".ksc-empty{margin:0;grid-column:1 / -1;padding:24px;border-radius:var(--ksc-radius);border:1px dashed var(--ksc-accent);color:var(--ksc-accent);text-align:center;font-size:14px}" +
    ".ksc-link:focus-visible,.ksc-card:focus-visible,.ksc-more:focus-visible{outline:2px solid var(--ksc-accent);outline-offset:2px}" +
    // Show more(R26): 우리 버튼. 카드 색 · 테두리 · 반경 변수를 그대로 쓴다.
    ".ksc-more{display:block;margin:var(--ksc-gap) auto 0;min-height:44px;padding:10px 22px;border-radius:var(--ksc-radius);border:1px solid var(--ksc-border);background:var(--ksc-card);color:var(--ksc-text);font:inherit;font-size:var(--ksc-tsize);font-weight:600;cursor:pointer}" +
    // 슬롯 상자(우리 노드): 스캔 전(캔버스 · 하이드레이션)과 사용자 디자인 표시(일반 프레임 · Style CMS cards Off)에는
    // 슬롯을 그대로 보여 준다. 다시 그린 Collection List 는 그 호스트(우리 div)째 숨긴다. 슬롯 안에는 규칙 0.
    ".ksc-host{min-width:0;position:relative}" +
    ".ksc-src .ksc-host:only-child{grid-column:1 / -1}" +
    ".ksc-src-off,.ksc-host-off{display:none}" +
    // 스크롤 등장: 첫 화면 밖에서 시작할 때만 숨겼다가 보이면 차례로 올라온다(우리 카드에만).
    ".ksc-root[data-ksc-reveal=wait] .ksc-card{opacity:0;transform:translateY(12px)}" +
    ".ksc-root[data-ksc-reveal=go] .ksc-card{transition:opacity 0.4s ease,transform 0.4s ease;transition-delay:calc(var(--ksc-i, 0) * 50ms)}" +
    "@media (prefers-reduced-motion: reduce){.ksc-root[data-ksc-reveal=wait] .ksc-card,.ksc-root[data-ksc-reveal=go] .ksc-card{opacity:1;transform:none;transition:none}}"

// 루트 inline style 로 넘기는 CSS 변수. 숫자는 컨트롤 범위로 clamp, 색은 cssToken, 글꼴은 fontFamilyOf 로 정제.
function rootVars(p: Props, c: Palette): CSSProperties {
    const cols = Math.round(num(p.columns, 3, 1, 6))
    const tSize = num(p.textSize, 13, 10, 24)
    const ff = fontFamilyOf(p.font)
    const vars: Record<string, string> = {
        "--ksc-ff": ff || "Inter, sans-serif",
        "--ksc-cols": String(cols),
        "--ksc-gap": `${num(p.gap, 14, 0, 64)}px`,
        "--ksc-minw": `${num(p.minCardWidth, 200, 80, 600)}px`,
        "--ksc-pad": `${num(p.padding, 20, 0, 64)}px`,
        "--ksc-radius": `${num(p.radius, 16, 0, 40)}px`,
        "--ksc-vsize": `${num(p.valueSize, 30, 14, 96)}px`,
        "--ksc-tsize": `${tSize}px`,
        "--ksc-nsize": `${Math.max(10, tSize - 1)}px`,
        "--ksc-shadow": p.accentBar ? `inset 0 2px 0 ${c.accent}` : "none",
        "--ksc-accent": c.accent,
        "--ksc-card": c.card,
        "--ksc-border": c.border,
        "--ksc-text": c.text,
        "--ksc-muted": c.muted,
        "--ksc-up": c.up,
        "--ksc-down": c.down,
    }
    return vars as CSSProperties
}

// ---------------------------------------------------------------- CMS 슬롯: 읽기 전용(REVIEW-RULES R2 · R3 · P1)
// 슬롯 자손에는 아무것도 쓰지 않는다. 레이어 이름(Label/Value/Delta/Note)의 텍스트와 a[href] 만 읽어 지역 배열로 돌려주고,
// 카드는 우리 JSX 로 그린다. 원본은 우리 상자(.ksc-src)의 className 으로만 숨긴다.

type CmsRow = { label: string; value: string; delta: string; note: string; href: string; newTab: boolean }
// 호스트(슬롯 하나)별 판정: cms = Collection List(같은 class 항목 2개 이상, 또는 빈 리스트). 아니면 일반 프레임 → 그대로 보여 준다.
type HostScan = { cms: boolean; rows: CmsRow[] }
type LayerNames = { label: string; value: string; delta: string; note: string }

const collapse = (s: string): string => s.replace(/\s+/g, " ").trim()
const normalize = (s: string): string => collapse(s).toLowerCase()

// CMS 에서 읽은 링크는 싱크 직전에 스킴을 검증한다(R7).
const SCHEME = /^([a-z][a-z0-9+.-]*):/i
function safeHref(raw: string): string {
    const href = String(raw || "").trim()
    const m = SCHEME.exec(href.replace(/[\u0000- \u007f]+/g, ""))
    if (!m) return href
    const scheme = m[1].toLowerCase()
    return scheme === "https" || scheme === "http" || scheme === "mailto" || scheme === "tel" ? href : ""
}

function isContentEl(el: Element): el is HTMLElement {
    const t = el.tagName
    return el instanceof HTMLElement && t !== "STYLE" && t !== "SCRIPT" && t !== "TEMPLATE"
}

// 레이어 이름 비교는 셀렉터 조립 없이 속성값 비교(대소문자 · 앞뒤 공백 무시). 없으면 null.
function findLayer(item: HTMLElement, name: string): HTMLElement | null {
    const want = normalize(name)
    if (!want) return null
    const all = item.querySelectorAll("[data-framer-name]")
    for (let i = 0; i < all.length; i += 1) {
        const el = all[i]
        if (el instanceof HTMLElement && normalize(String(el.getAttribute("data-framer-name") || "")) === want) return el
    }
    return null
}

function textOf(el: HTMLElement | null): string {
    return el ? collapse(String(el.textContent || "")) : ""
}

function readRow(item: HTMLElement, names: LayerNames): CmsRow {
    const a = item instanceof HTMLAnchorElement ? item : item.querySelector("a[href]")
    const href = a instanceof HTMLAnchorElement ? safeHref(String(a.getAttribute("href") || "")) : ""
    return {
        label: textOf(findLayer(item, names.label)),
        value: textOf(findLayer(item, names.value)),
        delta: textOf(findLayer(item, names.delta)),
        note: textOf(findLayer(item, names.note)),
        href,
        newTab: href !== "" && a instanceof HTMLAnchorElement && a.getAttribute("target") === "_blank",
    }
}

// 슬롯 첫 자식의 직계 자식 중 className 최빈 그룹이 2개 이상이면 컬렉션 리스트(항목 = 그 그룹, Load more 등은 제외).
// 자식도 글자도 없으면 빈 컬렉션. 그 밖에는 슬롯 하나 = 카드 하나. 결과는 지역 배열이고 노드에는 쓰지 않는다.
function detectItems(host: HTMLElement): { cms: boolean; items: HTMLElement[] } {
    const first = host.firstElementChild
    if (!first || !isContentEl(first)) return { cms: true, items: [] }
    const kids: HTMLElement[] = []
    for (let i = 0; i < first.children.length; i += 1) {
        const k = first.children[i]
        if (isContentEl(k)) kids.push(k)
    }
    if (kids.length === 0 && !collapse(String(first.textContent || ""))) return { cms: true, items: [] }
    const count: Record<string, number> = {}
    let best = ""
    let bestN = 0
    for (let i = 0; i < kids.length; i += 1) {
        const cls = String(kids[i].getAttribute("class") || "")
        const n = (count[cls] = (count[cls] || 0) + 1)
        if (n > bestN) {
            best = cls
            bestN = n
        }
    }
    if (kids.length >= 2 && bestN >= 2 && best.trim() !== "") return { cms: true, items: kids.filter((k) => String(k.getAttribute("class") || "") === best) }
    return { cms: false, items: [] }
}

// 상자의 직계 자식은 우리 호스트 div(슬롯 하나당 하나)다. 표지 속성 없이 구조로 판별한다.
function scanBox(box: HTMLElement, names: LayerNames): HostScan[] {
    const out: HostScan[] = []
    for (let i = 0; i < box.children.length; i += 1) {
        const host = box.children[i]
        if (!(host instanceof HTMLElement)) continue
        const found = detectItems(host)
        out.push({ cms: found.cms, rows: found.items.map((item) => readRow(item, names)) })
    }
    return out
}

// 서버에서는 useEffect(실행 안 됨), 브라우저에서는 레이아웃 효과 — 하이드레이션 뒤 첫 페인트 전에 우리 카드로 바뀐다.
function useCmsRows(boxRef: RefObject<HTMLDivElement>, enabled: boolean, names: LayerNames): HostScan[] | null {
    const [rows, setRows] = useState<HostScan[] | null>(null)
    useIsoLayoutEffect(() => {
        const box = boxRef.current
        if (!enabled || !box) {
            setRows(null)
            return
        }
        let lastKey = ""
        const run = () => {
            const next = scanBox(box, names)
            const key = JSON.stringify(next)
            // 지문이 같으면 상태를 갱신하지 않는다(R5).
            if (key !== lastKey) {
                lastKey = key
                setRows(next)
            }
        }
        run()
        // 관측 대상 = 우리 소스 상자 하나. 이 효과는 그 안에 쓰지 않는다. Load more · 하이드레이션 교체 ·
        // CMS 글자(증감 부호) 변경마다 프레임당 1회 다시 읽는다. 속성은 src · srcset · href 만 본다(같은 노드의 링크 교체 재독).
        const mo = batchedObserver(run)
        mo.observe(box, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "srcset", "href"] })
        return () => mo.disconnect()
    }, [enabled, names.label, names.value, names.delta, names.note])
    return rows
}

// 스크롤 등장. 서버·첫 렌더는 보이는 상태(off). 마운트 때 루트가 첫 화면 밖이면 페인트 전에 숨기고(wait),
// 보이면 차례로 올린다(go). 끝나면 off 로 돌려 전환 규칙을 걷는다. 모션 줄이기면 아무것도 만들지 않는다.
type Phase = "off" | "wait" | "go"
function useReveal(rootRef: RefObject<HTMLDivElement>, enabled: boolean): Phase {
    const [phase, setPhase] = useState<Phase>("off")
    useIsoLayoutEffect(() => {
        if (!enabled) {
            setPhase("off")
            return
        }
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
        const r = el.getBoundingClientRect()
        if (r.top < window.innerHeight && r.bottom > 0) return
        setPhase("wait")
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    io.disconnect()
                    setPhase("go")
                }
            },
            { threshold: 0, rootMargin: "0px 0px -10% 0px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [enabled])
    useEffect(() => {
        if (phase !== "go") return
        const t = setTimeout(() => setPhase("off"), 1300)
        return () => clearTimeout(t)
    }, [phase])
    return enabled ? phase : "off"
}

// ---------------------------------------------------------------- 렌더
type CardView = {
    label: string
    value: string
    deltaText: string
    dir: Dir
    tone: Tone
    spokenDir: string
    note: string
    cms: boolean
    href: string
    newTab: boolean
}

// 우선순위: Cards (CMS) 슬롯 > 단일 카드(Value 가 있을 때) > Cards 목록. 섞지 않는다.
function viewsOf(p: Props): CardView[] {
    if (String(p.value || "").trim()) {
        const dir = dirOfText(p.delta)
        return [
            {
                label: p.label,
                value: p.value,
                deltaText: String(p.delta || "").trim(),
                dir,
                tone: toneOf(dir, p.lowerIsBetter),
                spokenDir: "",
                note: p.note,
                cms: false,
                href: "",
                newTab: false,
            },
        ]
    }
    const list = Array.isArray(p.cards) ? p.cards : []
    return list.map((card) => {
        const delta = typeof card?.delta === "number" && isFinite(card.delta) ? card.delta : 0
        const dir = dirOfNumber(delta)
        return {
            label: card?.label || "Metric",
            value: card?.value ?? "—",
            deltaText: `${Math.abs(delta)}%`,
            dir,
            tone: toneOf(dir, !!card?.invert),
            // 목록 모드는 절댓값만 보이므로 방향을 스크린리더용 단어로 붙인다.
            spokenDir: dir === "up" ? "Up " : dir === "down" ? "Down " : "",
            note: card?.note || "",
            cms: false,
            href: "",
            newTab: false,
        }
    })
}

// CMS 항목 → 카드. Delta 는 적힌 그대로 보여 주고, 처음 나오는 부호 · 화살표 · 숫자로 방향을 정한다.
function viewOfRow(row: CmsRow, lowerIsBetter: boolean): CardView {
    const dir = dirOfText(row.delta)
    return {
        label: row.label,
        value: row.value,
        deltaText: row.delta,
        dir,
        tone: toneOf(dir, lowerIsBetter),
        spokenDir: "",
        note: row.note,
        cms: true,
        href: row.href,
        newTab: row.newTab,
    }
}

// ---------------------------------------------------------------- R26 Show more (CMS 카드만)
// initialCount > 0: Collection List 에서 읽은 카드 중 앞의 N 장만 그리고, 우리 버튼으로 N 장씩 더 연다.
// 새로 열린 첫 카드(우리 노드, 페이지 중 tabIndex -1)로 포커스를 옮긴다. 0 = 전부.
type Paging = { paging: boolean; focusAt: number; focused: () => void }
function useShowMore(total: number, initialCount: number) {
    const step = Number.isFinite(initialCount) ? Math.max(0, Math.floor(initialCount)) : 0
    const [pages, setPages] = useState(1)
    const [focusAt, setFocusAt] = useState(-1)
    const [note, setNote] = useState("")
    useEffect(() => {
        setPages(1)
        setFocusAt(-1)
        setNote("")
    }, [step])
    const count = step > 0 ? Math.min(total, step * pages) : total
    return {
        count,
        hasMore: count < total,
        reveal: () => {
            const next = Math.min(total, count + step)
            setFocusAt(count)
            setPages((n) => n + 1)
            setNote(showMoreNote(next - count, next, total))
        },
        paging: { paging: step > 0, focusAt, focused: () => setFocusAt(-1) } as Paging,
        expanded: step > 0 && count > step,
        note,
    }
}

function Card({ view, index, showArrow, paging }: { view: CardView; index: number; showArrow: boolean; paging?: Paging }) {
    const focusMe = !!paging && paging.focusAt === index
    const focusRef = focusMe
        ? (node: HTMLElement | null) => {
              if (node && paging) {
                  node.focus()
                  paging.focused()
              }
          }
        : undefined
    const tabIndex = paging && paging.paging && !view.href ? -1 : undefined
    const style = { ["--ksc-i" as string]: Math.min(index, 12) } as CSSProperties
    const classes = ["ksc-card"]
    if (view.cms) classes.push("ksc-cms")
    const body = (
        <>
            {view.label ? <p className="ksc-label">{view.label}</p> : null}
            <p className="ksc-value">{view.value}</p>
            {view.deltaText ? (
                <p className="ksc-delta" data-ksc-tone={view.tone}>
                    {showArrow && view.dir !== "flat" ? <span className="ksc-arrow" data-ksc-dir={view.dir} aria-hidden="true" /> : null}
                    {view.spokenDir ? <span className="ksc-sr">{view.spokenDir}</span> : null}
                    {view.deltaText}
                </p>
            ) : null}
            {view.note ? <p className="ksc-note">{view.note}</p> : null}
        </>
    )
    // CMS 항목에 링크가 있으면 카드 전체를 우리 <a> 로(이름 = 카드 글자).
    if (view.href) {
        classes.push("ksc-link")
        return (
            <a
                ref={focusRef}
                className={classes.join(" ")}
                style={style}
                href={safeHref(view.href)}
                target={view.newTab ? "_blank" : undefined}
                rel={view.newTab ? "noopener noreferrer" : undefined}
            >
                {body}
            </a>
        )
    }
    return (
        <div ref={focusRef} className={classes.join(" ")} style={style} tabIndex={tabIndex}>
            {body}
        </div>
    )
}

// 슬롯을 담는 우리 상자. 슬롯 하나 = 우리 호스트 div 하나. 숨길 때는 상자 · 호스트(둘 다 우리 노드)의 className 으로만.
// 일반 프레임과 Style CMS cards Off 의 Collection List 는 슬롯 노드를 그 자리에 그대로 보여 준다(React 소유, 쓰기 0).
function SourceBox({ slots, boxRef, hidden, hostOff }: { slots: ReactNode[]; boxRef?: RefObject<HTMLDivElement>; hidden: boolean; hostOff?: boolean[] }) {
    return (
        <div ref={boxRef} className={hidden ? "ksc-grid ksc-src ksc-src-off" : "ksc-grid ksc-src"} aria-hidden={hidden || undefined}>
            {slots.map((slot, i) => {
                const off = !hidden && !!(hostOff && hostOff[i])
                return (
                    <div key={i} className={off ? "ksc-host ksc-host-off" : "ksc-host"} aria-hidden={off || undefined}>
                        {slot}
                    </div>
                )
            })}
        </div>
    )
}

function slotsOf(p: Props): ReactNode[] {
    return (Array.isArray(p.cmsCards) ? p.cmsCards : []).filter((s) => s !== null && s !== undefined && s !== false)
}

function Shell({ props, rootRef, phase, children }: { props: Props; rootRef?: RefObject<HTMLDivElement>; phase: Phase; children: ReactNode }) {
    return (
        <div
            ref={rootRef}
            className="ksc-root"
            data-ksc-reveal={phase === "off" ? undefined : phase}
            style={{ ...props.style, ...rootVars(props, paletteOf(props)) }}
        >
            <style>{STYLE_CSS}</style>
            {children}
        </div>
    )
}

function CardsGrid({ views, props, paging, gridId }: { views: CardView[]; props: Props; paging?: Paging; gridId?: string }) {
    return (
        <div className="ksc-grid" id={gridId}>
            {views.length ? (
                views.map((view, i) => (
                    <Card key={i} view={view} index={i} showArrow={props.showArrow} paging={paging} />
                ))
            ) : (
                <p className="ksc-empty">{props.emptyText}</p>
            )}
        </div>
    )
}

// 정적 렌더러: 관측자 · 타이머 · DOM 읽기 0. 슬롯은 평범하게 그린다.
function StaticStatCardGrid(props: Props) {
    const slots = slotsOf(props)
    return (
        <Shell props={props} phase="off">
            {slots.length ? <SourceBox slots={slots} hidden={false} /> : <CardsGrid views={viewsOf(props)} props={props} />}
        </Shell>
    )
}

function LiveStatCardGrid(props: Props) {
    const rootRef = useRef<HTMLDivElement>(null)
    const boxRef = useRef<HTMLDivElement>(null)
    const slots = slotsOf(props)
    const slotMode = slots.length > 0
    const scans = useCmsRows(boxRef, slotMode, { label: props.labelLayer, value: props.valueLayer, delta: props.deltaLayer, note: props.noteLayer })
    const phase = useReveal(rootRef, props.reveal)
    // 다시 그리기(P1)는 Style CMS cards On 의 Collection List 만. 일반 프레임과 Off 의 리스트는 사용자 디자인 그대로(무접촉).
    const hosts = slotMode && scans ? scans : []
    const cmsHosts = hosts.filter((h) => h.cms)
    const anyPlain = hosts.some((h) => !h.cms)
    const redraw = props.styleCmsLayers && cmsHosts.length > 0
    // 빈 Collection List 만 있으면 Off 여도 Empty text 를 보여 준다(원본과 같음).
    const emptyOnly = cmsHosts.length > 0 && !anyPlain && cmsHosts.every((h) => h.rows.length === 0)
    const views = slotMode ? cmsHosts.flatMap((h) => h.rows).map((row) => viewOfRow(row, props.lowerIsBetter)) : viewsOf(props)
    const more = useShowMore(slotMode && redraw ? views.length : 0, props.initialCount)
    const gridId = `${useId()}-cards`
    return (
        <Shell props={props} rootRef={rootRef} phase={phase}>
            {slotMode ? (
                <SourceBox slots={slots} boxRef={boxRef} hidden={redraw && !anyPlain} hostOff={redraw ? hosts.map((h) => h.cms) : undefined} />
            ) : null}
            {!slotMode || redraw || emptyOnly ? (
                <CardsGrid views={redraw ? views.slice(0, more.count) : !slotMode ? views : []} props={props} paging={redraw ? more.paging : undefined} gridId={redraw && (more.hasMore || more.expanded) ? gridId : undefined} />
            ) : null}
            {redraw && more.hasMore ? (
                <button type="button" className="ksc-more" aria-expanded={more.expanded} aria-controls={gridId} onClick={more.reveal}>
                    {props.showMoreLabel || "Show more"}
                </button>
            ) : null}
            {redraw && more.paging.paging ? (
                <span role="status" aria-live="polite" aria-atomic="true" style={SHOW_MORE_SR}>{more.note}</span>
            ) : null}
        </Shell>
    )
}

/**
 * StatCardGrid
 * Responsive grid of KPI stat cards (label, value, delta, note). Cards come from a Collection List
 * dropped into Cards (CMS), from the single-card Label/Value/Delta/Note fields (for use inside your own
 * Collection List), or from the Cards list.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 160
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */

// One rescan per animation frame, however many DOM changes arrive at once (CMS loads, Load more, text edits),
// instead of a full rescan for every mutation record. In a hidden tab (no frames) it falls back to a 100 ms
// timer. Disconnecting also cancels a pending run.
function batchedObserver(cb: () => void, relevant?: (records: MutationRecord[]) => boolean): MutationObserver {
    let frame = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const fire = () => {
        frame = 0
        timer = undefined
        cb()
    }
    const mo = new MutationObserver((records) => {
        if (frame || timer !== undefined || (relevant && !relevant(records))) return
        if (typeof requestAnimationFrame === "function" && !document.hidden) frame = requestAnimationFrame(fire)
        else timer = setTimeout(fire, 100)
    })
    const stop = mo.disconnect.bind(mo)
    mo.disconnect = () => {
        if (frame) cancelAnimationFrame(frame)
        if (timer !== undefined) clearTimeout(timer)
        frame = 0
        timer = undefined
        stop()
    }
    return mo
}

export default function StatCardGrid(input: Partial<Props>) {
    const isStatic = useIsStaticRenderer()
    const props = withDefaults(input)
    // 정적/라이브 완전 분리 — 훅 조건부 호출 방지
    return isStatic ? <StaticStatCardGrid {...props} /> : <LiveStatCardGrid {...props} />
}

addPropertyControls(StatCardGrid, {
    cmsCards: {
        type: ControlType.Array,
        title: "Cards (CMS)",
        control: { type: ControlType.ComponentInstance },
        defaultValue: [],
        description:
            "Drop a Collection List here. With Style CMS cards On, each item becomes a card: name its text layers Label, Value, Delta and Note; the list is read, then hidden, so turn off its pagination. Single frames dropped in are shown exactly as you built them. Anything here replaces the single card and the Cards list.",
    },
    labelLayer: {
        type: ControlType.String,
        title: "Label layer",
        defaultValue: "Label",
        description: "Text layer in each CMS item used as the card label, e.g. Monthly Revenue. Case does not matter.",
    },
    valueLayer: {
        type: ControlType.String,
        title: "Value layer",
        defaultValue: "Value",
        description: "Text layer in each CMS item that holds the big number, e.g. $48.2k. Shown as typed.",
    },
    deltaLayer: {
        type: ControlType.String,
        title: "Delta layer",
        defaultValue: "Delta",
        description: 'Text layer with the change, e.g. "+12%" or "-3.1%". A leading + is a rise and - is a fall; the layer takes the Up or Down colour.',
    },
    noteLayer: {
        type: ControlType.String,
        title: "Note layer",
        defaultValue: "Note",
        description: "Text layer in each CMS item used as the small note, e.g. vs last month.",
    },
    styleCmsLayers: {
        type: ControlType.Boolean,
        title: "Style CMS cards",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "On: Collection List items are read and drawn as cards with the card colour, border, radius, padding and accent line set here. Off: the Collection List is shown exactly as you built it; nothing inside it is changed.",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "",
        placeholder: "Monthly Revenue",
        description: "Single-card mode for use inside your own Collection List: bind a CMS field here. Used when Value is filled.",
    },
    value: {
        type: ControlType.String,
        title: "Value",
        defaultValue: "",
        placeholder: "$48.2k",
        description: "Single-card mode: when this is filled, one card is shown and the Cards list is ignored. Bind a CMS field here.",
    },
    delta: {
        type: ControlType.String,
        title: "Delta",
        defaultValue: "",
        placeholder: "+12%",
        description: 'Single-card mode: the change as text, e.g. "+12%" or "-3.1%". The sign sets the arrow and colour. Leave empty to hide.',
    },
    note: {
        type: ControlType.String,
        title: "Note",
        defaultValue: "",
        placeholder: "vs last month",
        description: "Single-card mode: small muted line under the delta.",
    },
    lowerIsBetter: {
        type: ControlType.Boolean,
        title: "Lower is better",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "For CMS items and the single card: a fall gets the Up colour and a rise the Down colour, e.g. churn or cost.",
    },
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Metric", description: "Small line above the number." },
                value: { type: ControlType.String, title: "Value", defaultValue: "0", description: "The big number, shown as typed, e.g. $48.2k or 3,912." },
                delta: {
                    type: ControlType.Number,
                    title: "Delta %",
                    defaultValue: 0,
                    min: -100,
                    max: 100,
                    step: 1,
                    description: "Change in percent. Positive shows an up arrow, negative a down arrow.",
                },
                invert: {
                    type: ControlType.Boolean,
                    title: "Lower is better",
                    defaultValue: false,
                    description: "Swap the colours for this card, e.g. churn going down shows in the Up colour.",
                },
                note: { type: ControlType.String, title: "Note", defaultValue: "", description: "Optional small line under the delta." },
            },
        },
        defaultValue: DEMO,
        description: "Hand-typed cards. Used while Cards (CMS) is empty and Value is blank.",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
        description: "Most cards per row. Rows wrap to fewer columns when a card would get narrower than Min card width.",
    },
    minCardWidth: {
        type: ControlType.Number,
        title: "Min card width",
        defaultValue: 200,
        min: 80,
        max: 600,
        step: 10,
        unit: "px",
        description: "Cards never get narrower than this; on small screens the grid drops to fewer columns, down to one.",
    },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 14, min: 0, max: 64, step: 1, unit: "px", description: "Space between cards." },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 20, min: 0, max: 64, step: 1, unit: "px", description: "Space inside each card." },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        description: "Corner radius of the cards and the empty box.",
    },
    valueSize: { type: ControlType.Number, title: "Value size", defaultValue: 30, min: 14, max: 96, step: 1, unit: "px", description: "Size of the big number." },
    textSize: { type: ControlType.Number, title: "Text size", defaultValue: 13, min: 10, max: 24, step: 1, unit: "px", description: "Size of the label and delta. Notes are 1px smaller." },
    showArrow: { type: ControlType.Boolean, title: "Arrows", defaultValue: true, description: "Small up or down triangle before the delta." },
    accentBar: { type: ControlType.Boolean, title: "Accent line", defaultValue: true, description: "Thin line in the Accent colour along the top edge of each card." },
    reveal: {
        type: ControlType.Boolean,
        title: "Reveal",
        defaultValue: true,
        description: "Cards rise in one after another when the grid scrolls into view. Skipped for reduced motion and when the grid is already on screen.",
    },
    emptyText: {
        type: ControlType.String,
        title: "Empty text",
        defaultValue: "Add a card to build the grid.",
        description: "Shown when there are no cards, for example an empty collection.",
    },
    initialCount: {
        type: ControlType.Number,
        title: "Initial count",
        defaultValue: 0,
        min: 0,
        max: 500,
        step: 1,
        displayStepper: true,
        description: "Cards from Cards (CMS) shown at first. A Show more button reveals this many more per click. 0 shows every card.",
    },
    showMoreLabel: { type: ControlType.String, title: "Show more label", defaultValue: "Show more", description: "Text of the Show more button used with Initial count." },
    font: { type: ControlType.Font, title: "Font", controls: "basic", description: "Font for all card text. Empty uses Inter." },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#6D5EF6", description: "Top line of each card and the empty box." },
    cardColor: { type: ControlType.Color, title: "Card", defaultValue: "#111118", description: "Card background." },
    borderColor: { type: ControlType.Color, title: "Border", defaultValue: "rgba(255,255,255,0.07)", description: "Card outline." },
    textColor: { type: ControlType.Color, title: "Value colour", defaultValue: "#F5F5FA", description: "Colour of the big number." },
    mutedColor: { type: ControlType.Color, title: "Muted", defaultValue: "rgba(245,245,250,0.55)", description: "Label, note and a delta with no sign." },
    upColor: { type: ControlType.Color, title: "Up colour", defaultValue: "#3FCF8E", description: "Delta colour for a rise (or a fall when Lower is better is on)." },
    downColor: { type: ControlType.Color, title: "Down colour", defaultValue: "#F65E6D", description: "Delta colour for a fall (or a rise when Lower is better is on)." },
})
