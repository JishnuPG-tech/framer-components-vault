// [생성일] 2026-10-18
// [경위] 달러벌기 28번 상품 — Tier List. S/A/B/C/D 티어 행에 이미지·텍스트 타일을 끌어다 놓아 순위를 매기는 보드.
//        칸반(Kanban Board $8)·정렬 리스트(Sortable List Pro $7)는 있지만 "티어 리스트" 장르 경쟁품은 마켓에 0개.
//        프리셋 순위(바로 완성된 화면) · 미배치 트레이 · Shuffle/Reset · 터치 바로 드래그 · 키보드 이동을 차별점으로 둠
// [변경이력]
//   - 2026-10-18: 최초 생성 (Pointer Events 직접 구현 — 외부 DnD 라이브러리 없음, 행 2~8개·타일 최대 40개,
//                 프리셋 3종, 입장 애니메이션은 화면에 들어올 때 1회만, 캔버스·정적 렌더는 배치만)
//   - 2026-10-31: 프레이머 자동 심사 권고 반영 — 인라인 outline 제거 후 키보드 초점(:focus-visible) 테두리 유지·보강, 느슨한 타입(any)을 실제 타입으로 교체

import { useEffect, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, DragEvent as ReactDragEvent } from "react" // 2026-10-31: 이벤트 핸들러용 실제 타입
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
interface TierDef {
    name?: string
    color?: string
}
interface ItemDef {
    type?: "text" | "image"
    label?: string
    image?: { src?: string; srcSet?: string; alt?: string }
    tier?: string // "tray" 또는 "1"~"8" (몇 번째 행에서 시작할지)
}
interface TierListProps {
    preset?: string
    items?: ItemDef[]
    tiers?: TierDef[]
    tileSize?: number
    tileGap?: number
    tileRadius?: number
    tileColor?: string
    tileTextColor?: string
    labelPosition?: "below" | "overlay" | "none"
    labelWidth?: number
    rowColor?: string
    rowRadius?: number
    rowGap?: number
    background?: string
    padding?: number
    accent?: string
    textColor?: string
    trayLabel?: string
    showButtons?: boolean
    buttonsPosition?: "top" | "bottom"
    shuffleMode?: "tiers" | "tray"
    shuffleLabel?: string
    resetLabel?: string
    entrance?: boolean
    font?: CSSProperties
    tierFont?: CSSProperties
    style?: CSSProperties
}

const MAX_ITEMS = 40
const MAX_TIERS = 8

// 클래식 티어 리스트 색 (S 빨강 → D 파랑)
const DEFAULT_TIERS: TierDef[] = [
    { name: "S", color: "#FF7F7F" },
    { name: "A", color: "#FFBF7F" },
    { name: "B", color: "#FFDF7F" },
    { name: "C", color: "#BFFF7F" },
    { name: "D", color: "#7FBFFF" },
]
const EXTRA_COLORS = ["#C99BFF", "#FF9BD5", "#9BE8D8"]

// 프리셋: [이름, 시작 행("1"~ 또는 "tray")]
const PRESET_DATA: Record<string, Array<[string, string]>> = {
    tools: [
        ["Figma", "1"], ["Framer", "1"], ["Webflow", "2"], ["Notion", "2"], ["Canva", "2"],
        ["Sketch", "3"], ["Photoshop", "3"], ["Illustrator", "3"], ["Wix", "4"], ["Squarespace", "4"],
        ["PowerPoint", "5"], ["Miro", "tray"], ["Procreate", "tray"], ["Spline", "tray"],
    ],
    toppings: [
        ["Pepperoni", "1"], ["Extra Cheese", "1"], ["Mushrooms", "2"], ["Sausage", "2"], ["Bacon", "2"],
        ["Onions", "3"], ["Olives", "3"], ["Peppers", "3"], ["Spinach", "4"], ["Anchovies", "4"],
        ["Corn", "5"], ["Pineapple", "tray"], ["Tofu", "tray"], ["Basil", "tray"],
    ],
    days: [
        ["Payday", "1"], ["Friday", "1"], ["Saturday", "1"], ["Long weekend", "1"], ["Sunday", "2"],
        ["Thursday", "3"], ["Wednesday", "4"], ["Tuesday", "4"], ["Monday", "5"], ["Tax day", "5"],
        ["Dentist", "tray"], ["Birthday", "tray"],
    ],
}
function toItems(data: Array<[string, string]>): ItemDef[] {
    return data.map((d) => ({ type: "text" as const, label: d[0], tier: d[1] }))
}
const SAMPLE: ItemDef[] = toItems(PRESET_DATA.tools)

// 색의 밝기(0~1) — 프레이머는 Color 값을 rgb()/rgba() 로 넘기기도 하므로 둘 다 처리
function luminance(color: string): number {
    if (typeof color !== "string") return 0.5
    let r = 0, g = 0, b = 0
    const m = color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
    if (m) {
        r = +m[1]; g = +m[2]; b = +m[3]
    } else if (color.charAt(0) === "#") {
        let h = color.slice(1)
        if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("")
        r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16)
    } else return 0.5
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// 행 배열(rows)에서 타일을 빼서 다른 위치에 끼워 넣는다 (rows 마지막 칸 = 트레이)
function moveTo(rows: number[][], id: number, row: number, index: number): number[][] {
    const next = rows.map((r) => r.filter((x) => x !== id))
    const at = Math.max(0, Math.min(index, next[row].length))
    next[row].splice(at, 0, id)
    return next
}

/**
 * Tier List — 티어 행(S/A/B/C/D 등) 사이로 타일을 끌어다 놓는 순위 보드. 미배치 트레이, 프리셋, Shuffle/Reset 포함.
 * 마우스·터치 모두 길게 누르지 않고 바로 드래그, 키보드는 타일에 포커스 후 방향키. 캔버스·정적 렌더에서는 프리셋 배치만 보인다.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TierList(props: TierListProps) {
    const {
        preset = "custom",
        items,
        tiers,
        tileSize = 76,
        tileGap = 6,
        tileRadius = 10,
        tileColor = "#F4F1EA",
        tileTextColor = "#111114",
        labelPosition = "below",
        labelWidth = 96,
        rowColor = "#1F1F26",
        rowRadius = 10,
        rowGap = 4,
        background = "#14141A",
        padding = 16,
        accent = "#2DE5A0",
        textColor = "#F4F1EA",
        trayLabel = "Unranked",
        showButtons = true,
        buttonsPosition = "top",
        shuffleMode = "tiers",
        shuffleLabel = "Shuffle",
        resetLabel = "Reset",
        entrance = true,
        font = { fontFamily: "Inter", fontWeight: 700, fontSize: 12 },
        tierFont = { fontFamily: "Inter", fontWeight: 800, fontSize: 26 },
        style,
    } = props

    const isStatic = useIsStaticRenderer() // 정적 렌더(서버·내보내기): 프리셋 배치만 보임
    const isCanvas = RenderTarget.current() === RenderTarget.canvas // 캔버스: 배치 확인용, 드래그 없음

    // ── 티어 목록 정리 (이름이 비면 순번) ──
    const tierList = useMemo(() => {
        const src = tiers && tiers.length ? tiers : DEFAULT_TIERS
        return src.slice(0, MAX_TIERS).map((t, i) => ({
            name: (t.name || "").trim() || String(i + 1),
            color:
                t.color ||
                (i < DEFAULT_TIERS.length
                    ? (DEFAULT_TIERS[i].color as string)
                    : EXTRA_COLORS[(i - DEFAULT_TIERS.length) % EXTRA_COLORS.length]),
        }))
    }, [tiers])
    const nT = tierList.length // 트레이는 rows[nT]

    // ── 타일 목록 정리 (프리셋이면 내장 목록, 아니면 Items 속성) ──
    const list = useMemo(() => {
        const src: ItemDef[] =
            preset !== "custom" && PRESET_DATA[preset]
                ? toItems(PRESET_DATA[preset])
                : items && items.length
                  ? items
                  : SAMPLE
        return src.slice(0, MAX_ITEMS).map((it) => {
            const hasImg = it.type === "image" && !!(it.image && it.image.src)
            return {
                image: hasImg ? it.image : undefined,
                label: (it.label || "").trim() || (hasImg ? "" : "Item"),
                tier: it.tier || "tray",
            }
        })
    }, [preset, items])

    // ── 시작 배치: 행 번호 → 타일 id 목록 ──
    const initRows = useMemo(() => {
        const out: number[][] = Array.from({ length: nT + 1 }, () => [])
        list.forEach((it, i) => {
            const n = parseInt(it.tier, 10)
            const r = it.tier === "tray" || !(n >= 1) ? nT : Math.min(n - 1, nT - 1)
            out[r].push(i)
        })
        return out
    }, [list, nT])

    // 속성이 바뀌면 사용자가 옮겨 둔 배치는 버리고 새 시작 배치를 쓴다
    const sig = useMemo(
        () => JSON.stringify([nT, list.map((l) => [l.label, l.tier, l.image ? l.image.src : ""])]),
        [nT, list]
    )
    const [saved, setSaved] = useState<{ sig: string; rows: number[][] } | null>(null)
    const rows = saved && saved.sig === sig ? saved.rows : initRows

    // 브라우저에서만 상호작용 활성화 (hydration 안전)
    const [live, setLive] = useState(false)
    useEffect(() => {
        if (isStatic) return
        startTransition(() => setLive(true))
    }, [isStatic])
    const interactive = live && !isCanvas

    const [dragId, setDragId] = useState<number | null>(null)
    const [hover, setHover] = useState<{ row: number; index: number } | null>(null)
    const [announce, setAnnounce] = useState("")
    const [phase, setPhase] = useState<"idle" | "hidden" | "in">("idle")

    const rootRef = useRef<HTMLDivElement>(null)
    const ghostRef = useRef<HTMLDivElement>(null)
    const rowEls = useRef<Array<HTMLDivElement | null>>([])
    const rowsRef = useRef(rows)
    rowsRef.current = rows
    const sigRef = useRef(sig)
    sigRef.current = sig
    const hoverRef = useRef<{ row: number; index: number } | null>(null)
    // 드래그 상태 (2026-10-31: 실제 모양으로 타입 지정)
    const dragRef = useRef<{ id: number; pid: number; sx: number; sy: number; offX: number; offY: number; active: boolean; gx: number; gy: number } | null>(null)
    const focusRef = useRef<number | null>(null)
    const cleanupRef = useRef<(() => void) | null>(null)

    // ── 입장 애니메이션: 처음부터 화면 밖에 있을 때만, 화면에 들어오면 딱 한 번 (반복 없음) ──
    useEffect(() => {
        if (!live || isCanvas || !entrance) return
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") return
        const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches
        if (reduce) return
        const b = root.getBoundingClientRect()
        if (b.top < window.innerHeight * 0.85 && b.bottom > 0) return // 이미 보이면 애니메이션 없이 바로 표시
        setPhase("hidden")
        let t = 0
        const io = new IntersectionObserver(
            (en) => {
                if (en[0].isIntersecting) {
                    io.disconnect()
                    setPhase("in")
                    t = window.setTimeout(() => setPhase("idle"), 1500)
                }
            },
            { threshold: 0.15 }
        )
        io.observe(root)
        return () => {
            io.disconnect()
            window.clearTimeout(t)
            setPhase("idle")
        }
    }, [live, isCanvas, entrance])

    // 키보드로 옮긴 직후 포커스를 새 자리의 타일로 돌려준다 (행이 바뀌면 DOM 이 새로 만들어지므로)
    useEffect(() => {
        if (focusRef.current == null || !rootRef.current) return
        const el = rootRef.current.querySelector('[data-id="' + focusRef.current + '"]') as HTMLElement | null
        focusRef.current = null
        if (el && el.focus) el.focus()
    })

    // 언마운트 시 드래그 리스너 정리
    useEffect(
        () => () => {
            if (cleanupRef.current) cleanupRef.current()
        },
        []
    )

    // ── 드롭 위치 계산: 포인터가 있는 행 + 그 행 안에서 끼워 넣을 순서 ──
    const computeHover = (cx: number, cy: number, id: number) => {
        const root = rootRef.current
        if (!root) return null
        const rr = root.getBoundingClientRect()
        if (cx < rr.left - 24 || cx > rr.right + 24 || cy < rr.top - 24 || cy > rr.bottom + 24) return null
        let best = -1
        let bestDist = Infinity
        for (let i = 0; i <= nT; i++) {
            const el = rowEls.current[i]
            if (!el) continue
            const b = el.getBoundingClientRect()
            const dy = cy < b.top ? b.top - cy : cy > b.bottom ? cy - b.bottom : 0
            if (dy < bestDist) {
                bestDist = dy
                best = i
            }
        }
        const rowEl = best >= 0 ? rowEls.current[best] : null
        if (!rowEl) return null
        const tiles = rowEl.querySelectorAll("[data-tier-tile]")
        let idx = 0
        for (let k = 0; k < tiles.length; k++) {
            const t = tiles[k] as HTMLElement
            if (t.getAttribute("data-id") === String(id)) continue
            const b = t.getBoundingClientRect()
            if (cy > b.bottom || (cy >= b.top && cx > b.left + b.width / 2)) idx++
            else break
        }
        return { row: best, index: idx }
    }

    // ── 잡기: 마우스·터치 공통 (Pointer Events), 4px 이상 움직이면 드래그 시작 ──
    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>, id: number) => {
        if (!interactive || dragRef.current) return
        if (e.pointerType === "mouse" && e.button !== 0) return
        const tileEl = e.currentTarget as HTMLElement
        const r = tileEl.getBoundingClientRect()
        const d = {
            id,
            pid: e.pointerId,
            sx: e.clientX,
            sy: e.clientY,
            offX: e.clientX - r.left,
            offY: e.clientY - r.top,
            active: false,
            gx: 0,
            gy: 0,
        }
        dragRef.current = d

        // 손에 든 복제본(ghost)을 포인터에 붙인다 (React 를 거치지 않고 transform 직접 변경)
        const place = (cx: number, cy: number) => {
            const rt = rootRef.current ? rootRef.current.getBoundingClientRect() : { left: 0, top: 0 }
            d.gx = cx - d.offX - rt.left
            d.gy = cy - d.offY - rt.top
            if (ghostRef.current)
                ghostRef.current.style.transform = "translate(" + d.gx + "px," + d.gy + "px) rotate(3deg) scale(1.06)"
        }
        const end = () => {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
            window.removeEventListener("pointercancel", cancel)
            window.removeEventListener("keydown", key)
            dragRef.current = null
            hoverRef.current = null
            cleanupRef.current = null
            setDragId(null)
            setHover(null)
        }
        const move = (ev: PointerEvent) => {
            if (ev.pointerId !== d.pid) return
            if (!d.active) {
                if (Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) < 4) return
                d.active = true
                place(ev.clientX, ev.clientY)
                setDragId(id)
            }
            place(ev.clientX, ev.clientY)
            const h = computeHover(ev.clientX, ev.clientY, id)
            const p = hoverRef.current
            if ((h && p && h.row === p.row && h.index === p.index) || (!h && !p)) return
            hoverRef.current = h
            setHover(h)
        }
        const up = (ev: PointerEvent) => {
            if (ev.pointerId !== d.pid) return
            const h = hoverRef.current
            if (d.active && h) setSaved({ sig: sigRef.current, rows: moveTo(rowsRef.current, id, h.row, h.index) })
            end()
        }
        const cancel = (ev: PointerEvent) => {
            if (ev.pointerId === d.pid) end() // 시스템이 가로챈 경우: 원위치
        }
        const key = (ev: KeyboardEvent) => {
            if (ev.key === "Escape") end() // Esc 로 드래그 취소
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
        window.addEventListener("pointercancel", cancel)
        window.addEventListener("keydown", key)
        cleanupRef.current = end
    }

    // ── 키보드: ↑↓ 행 이동(비슷한 순번에 끼움), ←→ 행 안 순서 바꾸기 ──
    const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>, id: number) => {
        const cur = rowsRef.current
        const r = cur.findIndex((a) => a.indexOf(id) >= 0)
        if (r < 0) return
        const pos = cur[r].indexOf(id)
        let nr = r
        let np = pos
        if (e.key === "ArrowUp") nr = Math.max(0, r - 1)
        else if (e.key === "ArrowDown") nr = Math.min(nT, r + 1)
        else if (e.key === "ArrowLeft") np = pos - 1
        else if (e.key === "ArrowRight") np = pos + 1
        else return
        e.preventDefault()
        if (nr === r && (np < 0 || np >= cur[r].length)) return // 행 끝에서 더 못 감
        if (nr === r && np === pos) return
        focusRef.current = id
        const next = moveTo(cur, id, nr, np)
        setSaved({ sig: sigRef.current, rows: next })
        const rowName = nr === nT ? trayLabel : tierList[nr].name
        setAnnounce((list[id].label || "Item") + " → " + rowName + " #" + (next[nr].indexOf(id) + 1))
    }

    // ── 버튼 ──
    const doReset = () => setSaved(null)
    const doShuffle = () => {
        const ids = list.map((_, i) => i)
        for (let i = ids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            const t = ids[i]
            ids[i] = ids[j]
            ids[j] = t
        }
        const next: number[][] = Array.from({ length: nT + 1 }, () => [])
        if (shuffleMode === "tray") next[nT] = ids
        else ids.forEach((id) => next[Math.floor(Math.random() * nT)].push(id))
        setSaved({ sig, rows: next })
    }

    // ── 렌더 ──
    const hasCaption = labelPosition === "below" && list.some((l) => l.image && l.label)
    const capH = hasCaption ? 18 : 0
    const rowPad = 8
    const rowMin = tileSize + capH + rowPad * 2

    // 타일 하나 (ghost=true 면 손에 들고 있는 복제본)
    const renderTile = (
        id: number,
        o: { ghost?: boolean; before?: boolean; after?: boolean; rowName?: string; order?: number }
    ) => {
        const it = list[id]
        const ghost = !!o.ghost
        const dim = !ghost && dragId === id
        const hidden = phase === "hidden" && !ghost
        const delay = phase === "in" ? Math.min((o.order || 0) * 22, 600) : 0
        const wrapStyle: CSSProperties = {
            position: "relative",
            width: tileSize,
            flex: "none",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            touchAction: interactive ? "none" : "auto", // 타일 위에서만 스크롤을 막는다 (나머지 영역은 정상 스크롤)
            userSelect: "none",
            WebkitUserSelect: "none",
            cursor: interactive ? "grab" : "default",
            opacity: dim ? 0.25 : hidden ? 0 : 1,
            transform: hidden ? "translateY(12px) scale(0.9)" : "none",
            transition: "opacity .45s ease " + delay + "ms, transform .45s cubic-bezier(.2,.8,.2,1) " + delay + "ms",
        }
        const boxStyle: CSSProperties = {
            position: "relative",
            width: tileSize,
            height: tileSize,
            borderRadius: tileRadius,
            overflow: "hidden",
            boxSizing: "border-box",
            background: it.image ? "#2A2A32" : tileColor,
            color: tileTextColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 3,
            boxShadow: ghost ? "0 14px 28px rgba(0,0,0,0.45)" : "0 1px 2px rgba(0,0,0,0.35)",
            ...font,
        }
        const inner = it.image ? (
            <>
                <img
                    src={it.image.src}
                    srcSet={it.image.srcSet}
                    alt={it.image.alt || it.label || ""}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        pointerEvents: "none",
                    }}
                />
                {labelPosition === "overlay" && it.label ? (
                    <span
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            padding: "10px 4px 4px",
                            background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))",
                            color: "#FFFFFF",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            ...font,
                            fontSize: "0.85em",
                        }}
                    >
                        {it.label}
                    </span>
                ) : null}
            </>
        ) : (
            <span
                style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordBreak: "break-word",
                    maxWidth: "100%",
                }}
            >
                {it.label}
            </span>
        )
        const caption =
            labelPosition === "below" && it.image && it.label ? (
                <span
                    style={{
                        height: capH - 3,
                        color: textColor,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        textAlign: "center",
                        ...font,
                        fontSize: "0.85em",
                    }}
                >
                    {it.label}
                </span>
            ) : null
        // 끼워 넣을 자리를 알려주는 막대 (레이아웃을 밀지 않도록 절대 위치)
        const bar = (side: "left" | "right") => (
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    top: -2,
                    bottom: -2,
                    [side]: -(tileGap / 2) - 2,
                    width: 4,
                    borderRadius: 2,
                    background: accent,
                    boxShadow: "0 0 10px " + accent,
                    pointerEvents: "none",
                }}
            />
        )
        const common =
            interactive && !ghost
                ? {
                      role: "button",
                      tabIndex: 0,
                      "aria-label": (it.label || "Item") + (o.rowName ? ", " + o.rowName : "") + ". Drag, or use arrow keys to move.",
                      onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => onPointerDown(e, id),
                      onKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => onKeyDown(e, id),
                      onContextMenu: (e: ReactMouseEvent<HTMLDivElement>) => e.preventDefault(), // 터치 길게 누름 메뉴 방지
                      onDragStart: (e: ReactDragEvent<HTMLDivElement>) => e.preventDefault(),
                  }
                : {}
        return (
            <div
                key={ghost ? "ghost" : id}
                className="bu-tier-tile"
                data-tier-tile={ghost ? undefined : ""}
                data-id={ghost ? undefined : id}
                style={wrapStyle}
                {...common}
            >
                <div className="bu-tier-box" style={boxStyle}>
                    {inner}
                </div>
                {caption}
                {o.before ? bar("left") : null}
                {o.after ? bar("right") : null}
            </div>
        )
    }

    // 행 하나의 타일 영역
    let orderCounter = 0
    const renderRow = (r: number) => {
        const ids = rows[r] || []
        const isTray = r === nT
        const rowName = isTray ? trayLabel : tierList[r].name
        const hv = hover && hover.row === r ? hover.index : -1
        // 드래그 중인 타일을 뺀 순서로 끼워 넣을 자리(hv)를 센다
        const shown = ids.filter((id) => id !== dragId)
        const lastShown = shown.length ? shown[shown.length - 1] : -1
        const kids = ids.map((id) => {
            const before = id !== dragId && hv >= 0 && shown[hv] === id
            const after = id === lastShown && hv >= 0 && hv >= shown.length
            return renderTile(id, { before, after, rowName, order: orderCounter++ })
        })
        return (
            <div
                ref={(el) => {
                    rowEls.current[r] = el
                }}
                role="group"
                aria-label={rowName}
                style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    alignContent: "center",
                    alignItems: "flex-start",
                    gap: tileGap,
                    padding: rowPad,
                    boxSizing: "border-box",
                    minHeight: rowMin,
                    boxShadow: hv >= 0 ? "inset 0 0 0 2px " + accent : "none",
                    transition: "box-shadow .15s ease",
                }}
            >
                {kids}
            </div>
        )
    }

    const btnBase: CSSProperties = {
        appearance: "none",
        WebkitAppearance: "none",
        cursor: interactive ? "pointer" : "default",
        borderRadius: 999,
        padding: "8px 18px",
        border: "1px solid rgba(128,128,128,0.45)",
        background: "transparent",
        color: textColor,
        ...font,
        fontSize: 13,
        lineHeight: 1.2,
    }
    const buttons = showButtons ? (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flex: "none" }}>
            <button
                type="button"
                className="bu-tier-btn"
                style={{ ...btnBase, background: accent, borderColor: accent, color: luminance(accent) > 0.5 ? "#111114" : "#FFFFFF" }}
                onClick={interactive ? doShuffle : undefined}
            >
                {shuffleLabel}
            </button>
            <button type="button" className="bu-tier-btn" style={btnBase} onClick={interactive ? doReset : undefined}>
                {resetLabel}
            </button>
        </div>
    ) : null

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding,
                background,
                color: textColor,
                borderRadius: rowRadius + 4,
                overflow: "visible",
            }}
        >
            <style>
                {".bu-tier-tile:focus:not(:focus-visible){outline:none}.bu-tier-tile:focus-visible{outline:none}.bu-tier-tile:focus-visible .bu-tier-box{outline:2px solid " +
                    accent +
                    ";outline-offset:2px}.bu-tier-btn:focus-visible{outline:2px solid " +
                    accent +
                    ";outline-offset:2px}"}
            </style>
            {buttonsPosition === "top" ? buttons : null}
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: rowGap }}>
                {tierList.map((t, r) => (
                    <div
                        key={r}
                        style={{
                            flex: "1 0 auto",
                            display: "flex",
                            alignItems: "stretch",
                            background: rowColor,
                            borderRadius: rowRadius,
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: labelWidth,
                                flex: "none",
                                boxSizing: "border-box",
                                padding: 6,
                                background: t.color,
                                color: luminance(t.color) > 0.55 ? "#111114" : "#FFFFFF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                wordBreak: "break-word",
                                ...tierFont,
                            }}
                        >
                            {t.name}
                        </div>
                        {renderRow(r)}
                    </div>
                ))}
            </div>
            <div style={{ flex: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ ...font, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>
                    {trayLabel}
                </div>
                <div
                    style={{
                        display: "flex",
                        border: "2px dashed rgba(128,128,128,0.4)",
                        borderRadius: rowRadius,
                        overflow: "hidden",
                    }}
                >
                    {renderRow(nT)}
                </div>
            </div>
            {buttonsPosition === "bottom" ? buttons : null}
            <div
                aria-live="polite"
                style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}
            >
                {announce}
            </div>
            {dragId !== null ? (
                <div
                    ref={ghostRef}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        zIndex: 50,
                        pointerEvents: "none",
                        width: tileSize,
                        transform:
                            "translate(" +
                            (dragRef.current ? dragRef.current.gx : 0) +
                            "px," +
                            (dragRef.current ? dragRef.current.gy : 0) +
                            "px) rotate(3deg) scale(1.06)",
                    }}
                >
                    {renderTile(dragId, { ghost: true })}
                </div>
            ) : null}
        </div>
    )
}

TierList.displayName = "Tier List"

const TIER_OPTIONS = ["tray", "1", "2", "3", "4", "5", "6", "7", "8"]
const TIER_TITLES = ["Tray", "Row 1", "Row 2", "Row 3", "Row 4", "Row 5", "Row 6", "Row 7", "Row 8"]

addPropertyControls(TierList, {
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["custom", "tools", "toppings", "days"],
        optionTitles: ["Custom", "Design Tools", "Pizza Toppings", "Days of the Week"],
        defaultValue: "custom",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: MAX_ITEMS,
        hidden: (p: TierListProps) => p.preset !== "custom",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["text", "image"],
                    optionTitles: ["Text", "Image"],
                    defaultValue: "text",
                    displaySegmentedControl: true,
                },
                label: { type: ControlType.String, title: "Label", defaultValue: "New item" },
                image: { type: ControlType.ResponsiveImage, title: "Image", hidden: (p: ItemDef) => p.type !== "image" },
                tier: {
                    type: ControlType.Enum,
                    title: "Starts In",
                    options: TIER_OPTIONS,
                    optionTitles: TIER_TITLES,
                    defaultValue: "tray",
                },
            },
        },
        defaultValue: SAMPLE,
    },
    tiers: {
        type: ControlType.Array,
        title: "Tiers",
        maxCount: MAX_TIERS,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "S" },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#FF7F7F" },
            },
        },
        defaultValue: DEFAULT_TIERS,
    },
    tileSize: { type: ControlType.Number, title: "Tile Size", defaultValue: 76, min: 40, max: 180, step: 2, unit: "px" },
    tileGap: { type: ControlType.Number, title: "Tile Gap", defaultValue: 6, min: 0, max: 24, step: 1, unit: "px" },
    tileRadius: { type: ControlType.Number, title: "Tile Radius", defaultValue: 10, min: 0, max: 60, step: 1, unit: "px" },
    tileColor: { type: ControlType.Color, title: "Tile Color", defaultValue: "#F4F1EA" },
    tileTextColor: { type: ControlType.Color, title: "Tile Text", defaultValue: "#111114" },
    labelPosition: {
        type: ControlType.Enum,
        title: "Image Label",
        options: ["below", "overlay", "none"],
        optionTitles: ["Below", "Overlay", "None"],
        defaultValue: "below",
    },
    labelWidth: { type: ControlType.Number, title: "Tier Label", defaultValue: 96, min: 48, max: 220, step: 2, unit: "px" },
    rowColor: { type: ControlType.Color, title: "Row Color", defaultValue: "#1F1F26" },
    rowRadius: { type: ControlType.Number, title: "Row Radius", defaultValue: 10, min: 0, max: 40, step: 1, unit: "px" },
    rowGap: { type: ControlType.Number, title: "Row Gap", defaultValue: 4, min: 0, max: 24, step: 1, unit: "px" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#14141A" },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 16, min: 0, max: 60, step: 1, unit: "px" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#2DE5A0" },
    textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#F4F1EA" },
    trayLabel: { type: ControlType.String, title: "Tray Label", defaultValue: "Unranked" },
    showButtons: { type: ControlType.Boolean, title: "Buttons", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    buttonsPosition: {
        type: ControlType.Enum,
        title: "Buttons At",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "top",
        displaySegmentedControl: true,
        hidden: (p: TierListProps) => p.showButtons === false,
    },
    shuffleMode: {
        type: ControlType.Enum,
        title: "Shuffle",
        options: ["tiers", "tray"],
        optionTitles: ["Random Tiers", "To Tray"],
        defaultValue: "tiers",
        displaySegmentedControl: true,
        hidden: (p: TierListProps) => p.showButtons === false,
    },
    shuffleLabel: { type: ControlType.String, title: "Shuffle Text", defaultValue: "Shuffle", hidden: (p: TierListProps) => p.showButtons === false },
    resetLabel: { type: ControlType.String, title: "Reset Text", defaultValue: "Reset", hidden: (p: TierListProps) => p.showButtons === false },
    entrance: { type: ControlType.Boolean, title: "Entrance", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    font: {
        type: ControlType.Font,
        title: "Tile Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Bold", lineHeight: "1.15em" },
    },
    tierFont: {
        type: ControlType.Font,
        title: "Tier Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "26px", variant: "Extra Bold", lineHeight: "1em" },
        description: "Created by BrandingUp",
    },
})
