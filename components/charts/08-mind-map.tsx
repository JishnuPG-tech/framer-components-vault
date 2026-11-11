// [생성일] 2026-10-09
// [경위] 사장님 지시 다이어그램 10종 동시 제작 — 달러벌기 08번 상품, 마인드맵(Mind Map). 노드마다 "부모 텍스트"만 적으면 가지·연결선을 자동 배치
// [변경이력]
//   - 2026-10-09: 최초 생성 (방사형/좌우/우측 자동 배치 + 곡선 연결선(부모 색 상속) + 가지 접기·펼치기 + 호버 시 조상~자손 강조 + 메모 툴팁 + 자동 축소)
//   - 2026-10-09: 프레이머 심사 선택 개선 반영 — 측정 effect 의존성·일괄 측정

import { useEffect, useId, useMemo, useRef, useState, startTransition } from "react"
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
interface NodeInput {
    text?: string
    parent?: string
    color?: string
    note?: string
}

interface AppearanceOptions {
    background?: string
    radius?: number
    centerColor?: string
    nodeFill?: string
    textColor?: string
    lineOpacity?: number
}

type LayoutMode = "radial" | "leftRight" | "rightOnly"

interface MindMapProps {
    nodes?: NodeInput[]
    layout?: LayoutMode
    nodeShape?: "pill" | "rounded"
    nodeStyle?: "solid" | "outline"
    nodeSize?: number
    levelGap?: number
    siblingGap?: number
    maxWidth?: number
    lineWidth?: number
    expandedLevels?: number
    collapsible?: boolean
    highlight?: boolean
    showNotes?: boolean
    fit?: "shrink" | "fit" | "scroll"
    palette?: string[]
    appearance?: AppearanceOptions
    centerFont?: any
    nodeFont?: any
    style?: CSSProperties
}

// 트리 계산용 내부 노드
interface TNode {
    id: number
    text: string
    note: string
    parent: number // 중심 노드는 -1
    children: number[]
    depth: number
    color: string // 가지 색 (직접 지정 > 부모 색 상속 > 팔레트)
}

interface Size {
    w: number
    h: number
}

// 배치가 끝난 노드 한 개 (cx, cy 는 노드 중심 좌표)
interface Pos {
    cx: number
    cy: number
    w: number
    h: number
    ux: number // 바깥쪽 방향 단위벡터 (접힘 배지 위치용)
    uy: number
}

// 설치 직후 보이는 샘플: 브랜드 전략 마인드맵 (중심 1 + 1차 5 + 2차 10)
const SAMPLE: NodeInput[] = [
    { text: "Brand Strategy", parent: "" },
    { text: "Purpose", parent: "Brand Strategy", note: "Why the brand exists beyond making money." },
    { text: "Mission", parent: "Purpose", note: "What we do, for whom, every single day." },
    { text: "Core values", parent: "Purpose" },
    { text: "Audience", parent: "Brand Strategy", note: "The people we want to be chosen by." },
    { text: "Key personas", parent: "Audience" },
    { text: "Pain points", parent: "Audience", note: "The problems worth solving first." },
    { text: "Positioning", parent: "Brand Strategy", note: "The one place we want to own in people's minds." },
    { text: "Category", parent: "Positioning" },
    { text: "Differentiator", parent: "Positioning" },
    { text: "Voice & Tone", parent: "Brand Strategy" },
    { text: "Personality", parent: "Voice & Tone", note: "Three adjectives that describe how we sound." },
    { text: "Messaging pillars", parent: "Voice & Tone" },
    { text: "Visual Identity", parent: "Brand Strategy" },
    { text: "Logo & color", parent: "Visual Identity" },
    { text: "Typography", parent: "Visual Identity" },
]

// 가지 색 기본 팔레트 (1차 가지에 순서대로 배정)
const DEFAULT_PALETTE = ["#7C6CF2", "#2DE5A0", "#3B82F6", "#F59E0B", "#F43F5E", "#14B8A6"]

// 글꼴 지정이 없을 때의 대체값
const FALLBACK_NODE_FONT = { fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 500, lineHeight: "1.3em" }
const FALLBACK_CENTER_FONT = { fontFamily: "Inter, sans-serif", fontSize: "22px", fontWeight: 700, lineHeight: "1.2em" }

// 스크린리더에만 읽히는 숨김 텍스트 스타일
const VISUALLY_HIDDEN: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
}

// ─────────────────────────────────────────────
// 색상 도우미 — 프레이머는 Color 컨트롤 값을 rgb()/rgba() 로 넘기므로 둘 다 처리
// ─────────────────────────────────────────────
function parseColor(color: string): [number, number, number, number] | null {
    if (typeof color !== "string") return null
    const rgb = color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?/i)
    if (rgb) {
        let a = 1
        if (rgb[4] !== undefined) a = rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4])
        return [parseFloat(rgb[1]), parseFloat(rgb[2]), parseFloat(rgb[3]), a]
    }
    if (color.charAt(0) === "#") {
        let h = color.slice(1)
        if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("")
        if (h.length === 6 || h.length === 8) {
            const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a]
        }
    }
    return null
}

// 색에 투명도를 입혀 rgba 문자열로 (모르는 형식이면 원본 그대로)
function withAlpha(color: string, alpha: number) {
    const c = parseColor(color)
    return c ? "rgba(" + c[0] + ", " + c[1] + ", " + c[2] + ", " + alpha + ")" : color
}

// 배경색 밝기에 맞춰 글자색(어두운/흰색) 자동 선택
function textOn(color: string, dark = "#111114", light = "#FFFFFF") {
    const c = parseColor(color)
    if (!c) return dark
    const lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255
    return lum > 0.62 ? dark : light
}

// "14px" / 14 / undefined → 숫자 px
function parsePx(v: any, fallback: number) {
    const n = typeof v === "number" ? v : parseFloat(v)
    return isFinite(n) && n > 0 ? n : fallback
}

// ─────────────────────────────────────────────
// 글자 크기 추정 — 첫 화면(서버 렌더)용. 브라우저에서는 실제 크기를 재서 덮어쓴다
// ─────────────────────────────────────────────
function estimateSize(text: string, px: number, padX: number, padY: number, maxW: number): Size {
    let textW = 0
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i)
        textW += code >= 0x2e80 ? px : px * 0.58 // 한글·한자는 폭이 넓다
    }
    const lineH = px * 1.3
    let w = textW + padX * 2
    let lines = 1
    if (w > maxW) {
        w = maxW
        lines = Math.max(1, Math.ceil(textW / Math.max(10, maxW - padX * 2)))
    }
    return { w: Math.ceil(w), h: Math.ceil(lines * lineH + padY * 2) }
}

// ─────────────────────────────────────────────
// 트리 만들기: 평면 목록(텍스트 + 부모 텍스트) → 트리. 못 찾은 부모·순환은 중심에 붙인다
// ─────────────────────────────────────────────
function buildTree(list: NodeInput[], palette: string[], centerColor: string) {
    const key = (s?: string) => (s || "").trim().toLowerCase()
    const n = list.length
    // 중심 노드: 부모가 비어 있는 첫 항목 (없으면 맨 위 항목)
    let root = list.findIndex((p) => key(p.parent) === "")
    if (root < 0) root = 0
    const byText = new Map<string, number>()
    list.forEach((p, i) => {
        const k = key(p.text)
        if (k && !byText.has(k)) byText.set(k, i)
    })
    const parent: number[] = list.map((p, i) => {
        if (i === root) return -1
        const found = byText.get(key(p.parent))
        return found === undefined || found === i ? root : found
    })
    // 순환 연결(A→B→A) 방지: 위로 올라가다 중심에 못 닿으면 중심에 직접 연결
    for (let i = 0; i < n; i++) {
        let cur = i
        let steps = 0
        while (cur !== root && cur >= 0 && steps <= n) {
            cur = parent[cur]
            steps++
        }
        if (cur !== root) parent[i] = root
    }
    const nodes: TNode[] = list.map((p, i) => ({
        id: i,
        text: p.text ?? "",
        note: p.note ?? "",
        parent: parent[i],
        children: [],
        depth: 0,
        color: "",
    }))
    nodes.forEach((nd) => {
        if (nd.parent >= 0) nodes[nd.parent].children.push(nd.id)
    })
    // 깊이·가지 색 지정: 직접 고른 색 > 부모 색 상속 > 팔레트(1차 가지 순서대로)
    const pal = palette.length ? palette : DEFAULT_PALETTE
    nodes[root].color = list[root].color || centerColor
    const walk = (id: number, depth: number) => {
        nodes[id].depth = depth
        nodes[id].children.forEach((c, i) => {
            const own = list[c].color
            nodes[c].color = own || (depth === 0 ? pal[i % pal.length] : nodes[id].color)
            walk(c, depth + 1)
        })
    }
    walk(root, 0)
    return { nodes, root }
}

// ─────────────────────────────────────────────
// 배치 계산
// ─────────────────────────────────────────────

// 중심에서 (dx,dy) 방향으로 상자 가장자리까지의 오프셋
function clipToBox(dx: number, dy: number, w: number, h: number): [number, number] {
    const len = Math.hypot(dx, dy)
    if (len < 1e-6) return [0, 0]
    const ux = dx / len
    const uy = dy / len
    const tx = Math.abs(ux) > 1e-6 ? w / 2 / Math.abs(ux) : Infinity
    const ty = Math.abs(uy) > 1e-6 ? h / 2 / Math.abs(uy) : Infinity
    const t = Math.min(tx, ty)
    return [ux * t, uy * t]
}

// 방사형: 가지마다 잎 개수에 비례해 각도를 나누고, 겹치면 전체 반지름을 키운다
function layoutRadial(
    tree: TNode[],
    root: number,
    open: (id: number) => boolean,
    sizeOf: (id: number) => Size,
    levelGap: number,
    sibGap: number
): Map<number, Pos> {
    const kidsOf = (id: number) => (open(id) ? tree[id].children : [])
    // 1) 보이는 잎 개수(가중치)
    const weight = new Map<number, number>()
    const calcWeight = (id: number): number => {
        const k = kidsOf(id)
        const w = k.length ? k.reduce((s, c) => s + calcWeight(c), 0) : 1
        weight.set(id, w)
        return w
    }
    calcWeight(root)
    // 2) 각도 배정 (맨 위에서 시계방향)
    const angle = new Map<number, number>()
    const byDepth: number[][] = []
    const assign = (id: number, a0: number, a1: number, depth: number) => {
        angle.set(id, (a0 + a1) / 2)
        ;(byDepth[depth] = byDepth[depth] || []).push(id)
        const k = kidsOf(id)
        const total = weight.get(id) || 1
        let cur = a0
        k.forEach((c) => {
            const span = ((a1 - a0) * (weight.get(c) || 1)) / total
            assign(c, cur, cur + span, depth + 1)
            cur += span
        })
    }
    assign(root, -Math.PI / 2, Math.PI * 1.5, 0)
    // 3) 단계별 기본 반지름(타원: 가로가 더 넓다)
    const base: { rx: number; ry: number }[] = [{ rx: 0, ry: 0 }]
    let prevW = sizeOf(root).w
    let prevH = sizeOf(root).h
    for (let d = 1; d < byDepth.length; d++) {
        const ids = byDepth[d] || []
        const mw = ids.reduce((m, id) => Math.max(m, sizeOf(id).w), 0)
        const mh = ids.reduce((m, id) => Math.max(m, sizeOf(id).h), 0)
        const rx = base[d - 1].rx + prevW / 2 + levelGap + mw / 2
        const ry = Math.max(base[d - 1].ry + prevH / 2 + levelGap * 0.55 + mh / 2, rx * 0.6)
        base.push({ rx, ry })
        prevW = mw
        prevH = mh
    }
    // 4) 겹침이 없어질 때까지 반지름을 조금씩 키운다
    const margin = Math.max(4, sibGap * 0.6)
    const place = (s: number) => {
        const out = new Map<number, Pos>()
        byDepth.forEach((ids, d) => {
            ids.forEach((id) => {
                const a = angle.get(id) || 0
                const sz = sizeOf(id)
                out.set(id, {
                    cx: d === 0 ? 0 : base[d].rx * s * Math.cos(a),
                    cy: d === 0 ? 0 : base[d].ry * s * Math.sin(a),
                    w: sz.w,
                    h: sz.h,
                    ux: Math.cos(a),
                    uy: Math.sin(a),
                })
            })
        })
        return out
    }
    const overlaps = (m: Map<number, Pos>) => {
        const arr = Array.from(m.values())
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                const a = arr[i]
                const b = arr[j]
                if (Math.abs(a.cx - b.cx) < (a.w + b.w) / 2 + margin && Math.abs(a.cy - b.cy) < (a.h + b.h) / 2 + margin) return true
            }
        }
        return false
    }
    let s = 1
    let result = place(s)
    for (let i = 0; i < 60 && overlaps(result); i++) {
        s *= 1.07
        result = place(s)
    }
    return result
}

// 좌우형/우측형: 중심 오른쪽(왼쪽)에 가지를 세로로 쌓고, 부모는 자식 묶음의 가운데에 둔다
function layoutSides(
    tree: TNode[],
    root: number,
    mode: "leftRight" | "rightOnly",
    open: (id: number) => boolean,
    sizeOf: (id: number) => Size,
    gapX: number,
    gapY: number
): Map<number, Pos> {
    const kidsOf = (id: number) => (open(id) ? tree[id].children : [])
    // 서브트리 높이
    const H = new Map<number, number>()
    const calcH = (id: number): number => {
        let total = 0
        kidsOf(id).forEach((c, i) => {
            total += calcH(c) + (i > 0 ? gapY : 0)
        })
        const v = Math.max(sizeOf(id).h, total)
        H.set(id, v)
        return v
    }
    calcH(root)
    const blockH = (list: number[]) => list.reduce((s, c, i) => s + (H.get(c) || 0) + (i > 0 ? gapY : 0), 0)

    // 1차 가지를 좌우로 나눈다 (높이 합이 비슷하도록)
    const rootKids = kidsOf(root)
    let right = rootKids
    let left: number[] = []
    if (mode === "leftRight" && rootKids.length > 1) {
        const total = rootKids.reduce((s, c) => s + (H.get(c) || 0), 0)
        let acc = 0
        let bestK = 1
        let bestDiff = Infinity
        for (let k = 1; k < rootKids.length; k++) {
            acc += H.get(rootKids[k - 1]) || 0
            const diff = Math.abs(acc - (total - acc))
            if (diff <= bestDiff) {
                bestDiff = diff
                bestK = k
            }
        }
        right = rootKids.slice(0, bestK)
        left = rootKids.slice(bestK).reverse() // 왼쪽은 아래에서 위로 이어지도록 뒤집는다
    }

    const out = new Map<number, Pos>()
    const rootSize = sizeOf(root)
    out.set(root, { cx: 0, cy: 0, w: rootSize.w, h: rootSize.h, ux: 0, uy: 0 })

    // 한쪽(sign=+1 오른쪽, -1 왼쪽)을 배치
    const placeSide = (list: number[], sign: number) => {
        if (!list.length) return
        const rows: { id: number; cy: number; depth: number }[] = []
        const colMax = new Map<number, number>()
        const place = (id: number, y0: number, depth: number) => {
            const hn = H.get(id) || 0
            rows.push({ id, cy: y0 + hn / 2, depth })
            colMax.set(depth, Math.max(colMax.get(depth) || 0, sizeOf(id).w))
            const k = kidsOf(id)
            if (k.length) {
                let cur = y0 + (hn - blockH(k)) / 2
                k.forEach((c) => {
                    place(c, cur, depth + 1)
                    cur += (H.get(c) || 0) + gapY
                })
            }
        }
        let cursor = -blockH(list) / 2
        list.forEach((c) => {
            place(c, cursor, 1)
            cursor += (H.get(c) || 0) + gapY
        })
        // 단계(열)마다 가장 넓은 노드 기준으로 x 시작점을 맞춘다
        const starts = new Map<number, number>()
        let edge = rootSize.w / 2 + gapX
        for (let d = 1; colMax.has(d); d++) {
            starts.set(d, edge)
            edge += (colMax.get(d) || 0) + gapX
        }
        rows.forEach((r) => {
            const sz = sizeOf(r.id)
            out.set(r.id, { cx: sign * ((starts.get(r.depth) || 0) + sz.w / 2), cy: r.cy, w: sz.w, h: sz.h, ux: sign, uy: 0 })
        })
    }
    placeSide(right, 1)
    placeSide(left, -1)
    return out
}

// 연결선 경로 (부모 가장자리 → 자식 가장자리, S자 곡선)
function edgePath(a: Pos, b: Pos, radial: boolean): string {
    let x1: number, y1: number, x2: number, y2: number
    if (!radial) {
        const sg = b.cx >= a.cx ? 1 : -1
        x1 = a.cx + (sg * a.w) / 2
        y1 = a.cy
        x2 = b.cx - (sg * b.w) / 2
        y2 = b.cy
        const mx = (x1 + x2) / 2
        return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
    }
    const dx = b.cx - a.cx
    const dy = b.cy - a.cy
    // 모서리가 둥근 노드와 선 사이 틈이 안 생기도록 3px 안쪽까지 선을 넣는다
    const [ex, ey] = clipToBox(dx, dy, a.w - 6, a.h - 6)
    const [fx, fy] = clipToBox(-dx, -dy, b.w - 6, b.h - 6)
    x1 = a.cx + ex
    y1 = a.cy + ey
    x2 = b.cx + fx
    y2 = b.cy + fy
    if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) {
        const mx = (x1 + x2) / 2
        return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
    }
    const my = (y1 + y2) / 2
    return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`
}

/**
 * 마인드맵 (Mind Map) — 노드에 부모 텍스트만 적으면 가지·연결선을 자동 배치
 * 방사형/좌우/우측 레이아웃, 가지 접기·펼치기, 호버 시 가지 강조, 컨테이너에 맞춰 자동 축소
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 640
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function MindMap(props: MindMapProps) {
    const {
        nodes,
        layout = "radial",
        nodeShape = "pill",
        nodeStyle = "solid",
        nodeSize = 100,
        levelGap = 56,
        siblingGap = 14,
        maxWidth = 200,
        lineWidth = 2.5,
        expandedLevels = 3,
        collapsible = true,
        highlight = true,
        showNotes = true,
        fit = "shrink",
        palette,
        appearance,
        centerFont,
        nodeFont,
        style,
    } = props

    // 색·모양 기본값
    const theme = {
        background: appearance?.background ?? "#F6F6F3",
        radius: appearance?.radius ?? 20,
        centerColor: appearance?.centerColor ?? "#111114",
        nodeFill: appearance?.nodeFill ?? "#FFFFFF",
        textColor: appearance?.textColor ?? "#111114",
        lineOpacity: appearance?.lineOpacity ?? 0.6,
    }
    const scale100 = Math.max(0.3, nodeSize / 100)
    const nodeF = nodeFont || FALLBACK_NODE_FONT
    const centerF = centerFont || FALLBACK_CENTER_FONT
    const basePx = parsePx(nodeF.fontSize, 14) * scale100
    const centerPx = parsePx(centerF.fontSize, 22) * scale100

    const isStatic = useIsStaticRenderer() // 캔버스·정적 렌더에서는 애니메이션·호버 효과 정지
    const uid = "mm" + useId().replace(/[:]/g, "")
    const radial = layout === "radial"

    const list = nodes && nodes.length ? nodes : SAMPLE
    const pal = palette && palette.length ? palette : DEFAULT_PALETTE
    // props 객체 주소가 매번 바뀌어도 내용이 같으면 다시 계산하지 않도록 문자열 키로 비교
    const treeKey = JSON.stringify([list, pal, theme.centerColor])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const { nodes: tree, root } = useMemo(() => buildTree(list, pal, theme.centerColor), [treeKey])

    // 접힌 노드: 처음엔 "Expanded Levels" 보다 깊은 단계의 부모를 접어 둔다
    const initialCollapsed = useMemo(() => {
        const set = new Set<number>()
        tree.forEach((n) => {
            if (n.id !== root && n.children.length && n.depth >= expandedLevels - 1) set.add(n.id)
        })
        return set
    }, [tree, root, expandedLevels])
    const [collapsed, setCollapsed] = useState<Set<number>>(initialCollapsed)
    useEffect(() => {
        startTransition(() => setCollapsed(initialCollapsed))
    }, [initialCollapsed])

    // 가지 접기/펼치기 토글
    const toggle = (id: number) => {
        if (!collapsible || id === root) return
        startTransition(() => {
            setCollapsed((prev) => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
            })
        })
    }

    // 호버/포커스 중인 노드
    const [hoverId, setHoverId] = useState<number | null>(null)
    const hover = (id: number | null) => startTransition(() => setHoverId(id))

    // 실제 렌더된 노드 크기 측정값 (없으면 추정값 사용)
    const elRefs = useRef<Map<number, HTMLElement>>(new Map())
    const [sizes, setSizes] = useState<Record<number, Size>>({})
    const measureRef = useRef<() => void>(() => {})
    const padXOf = (id: number) => (id === root ? 24 : 14) * scale100
    const padYOf = (id: number) => (id === root ? 14 : 8) * scale100
    const pxOf = (n: TNode) => (n.id === root ? centerPx : n.depth === 1 ? basePx : basePx * 0.92)
    const maxW = Math.max(60, maxWidth * scale100)
    const rootMaxW = maxW + 60 * scale100 // 중심 노드는 글자가 크므로 조금 더 넓게 허용

    const sizeOf = (id: number): Size => {
        const m = sizes[id]
        if (m) return m
        const n = tree[id]
        return estimateSize(n.text, pxOf(n), padXOf(id), padYOf(id), id === root ? rootMaxW : maxW)
    }

    // ── 배치 계산 ──
    const isOpen = (id: number) => id === root || !(collapsible && collapsed.has(id))
    const sizesKey = JSON.stringify(sizes)
    const { pos, edges, W, H, offX, offY } = useMemo(() => {
        const open = (id: number) => isOpen(id)
        const m = radial
            ? layoutRadial(tree, root, open, sizeOf, levelGap, siblingGap)
            : layoutSides(tree, root, layout as "leftRight" | "rightOnly", open, sizeOf, levelGap, siblingGap)
        const es: { from: number; to: number }[] = []
        m.forEach((_p, id) => {
            const par = tree[id].parent
            if (par >= 0 && m.has(par)) es.push({ from: par, to: id })
        })
        // 전체 범위 + 여백(배지·그림자 공간)
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity
        m.forEach((p) => {
            minX = Math.min(minX, p.cx - p.w / 2)
            maxX = Math.max(maxX, p.cx + p.w / 2)
            minY = Math.min(minY, p.cy - p.h / 2)
            maxY = Math.max(maxY, p.cy + p.h / 2)
        })
        const pad = 36
        return {
            pos: m,
            edges: es,
            W: maxX - minX + pad * 2,
            H: maxY - minY + pad * 2,
            offX: pad - minX,
            offY: pad - minY,
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tree, root, collapsed, collapsible, layout, radial, levelGap, siblingGap, nodeSize, maxWidth, sizesKey, basePx, centerPx])

    // ── 실제 크기 측정: 렌더 후 노드 상자 크기를 재서 배치에 반영 (브라우저에서만) ──
    // [2026-10-09 개선] 의존성 배열 추가 + 일괄 측정 + 값이 같으면 setState 생략
    const [box, setBox] = useState({ w: 0, h: 0 }) // (측정 effect 의존성에서 쓰므로 위로 이동)
    const fontKey = JSON.stringify([nodeFont, centerFont]) // 폰트 객체 주소가 바뀌어도 내용이 같으면 재측정하지 않도록 문자열로 비교
    useEffect(() => {
        const measure = () => {
            // 1) 읽기만 모아서 한 번에 측정 (중간에 쓰기가 없어 레이아웃 계산이 한 번만 일어난다)
            const reads: [number, number, number][] = []
            elRefs.current.forEach((el, id) => {
                const w = el.offsetWidth
                const h = el.offsetHeight
                if (w && h) reads.push([id, w, h])
            })
            // 2) 이전 값과 비교해서 실제로 달라졌을 때만 갱신 (같으면 prev 그대로 반환 → 재렌더·무한 루프 없음)
            startTransition(() =>
                setSizes((prev) => {
                    let changed = false
                    const next = { ...prev }
                    reads.forEach(([id, w, h]) => {
                        const old = prev[id]
                        if (!old || Math.abs(old.w - w) > 0.5 || Math.abs(old.h - h) > 0.5) {
                            changed = true
                            next[id] = { w, h }
                        }
                    })
                    return changed ? next : prev
                })
            )
        }
        measureRef.current = measure
        measure()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tree, collapsed, collapsible, layout, nodeShape, nodeStyle, nodeSize, levelGap, siblingGap, maxWidth, fontKey, box.w, box.h])
    // 웹폰트가 늦게 로드돼도 다시 측정
    useEffect(() => {
        if (typeof document === "undefined" || !(document as any).fonts) return
        let alive = true
        ;(document as any).fonts.ready.then(() => {
            if (alive) measureRef.current()
        })
        return () => {
            alive = false
        }
    }, [])

    // ── 자동 축소: 컨테이너 크기를 재서 전체를 맞춘다 (브라우저에서만) ──
    const boxRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const el = boxRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0].contentRect
            startTransition(() => setBox({ w: r.width, h: r.height }))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const bw = box.w > 0 ? box.w : 960 // 측정 전에는 기본 크기로 가정
    const bh = box.h > 0 ? box.h : 640
    const fitScale = Math.min(bw / Math.max(1, W), bh / Math.max(1, H))
    const scale = fit === "fit" ? Math.max(0.1, fitScale) : fit === "shrink" ? Math.max(0.1, Math.min(1, fitScale)) : 1

    // ── 호버 강조 대상: 호버 노드의 조상 ~ 자손 ──
    const lit = useMemo(() => {
        if (hoverId === null || !highlight || isStatic || !tree[hoverId]) return null
        const set = new Set<number>([hoverId])
        let cur = tree[hoverId].parent
        while (cur >= 0) {
            set.add(cur)
            cur = tree[cur].parent
        }
        const down = (id: number) => tree[id].children.forEach((c) => (set.add(c), down(c)))
        down(hoverId)
        return set
    }, [hoverId, highlight, isStatic, tree])

    const countHidden = (id: number): number => tree[id].children.reduce((s, c) => s + 1 + countHidden(c), 0)

    // 스타일 시트: 포커스 링·페이드인·모션 감소 대응
    const css = `
.${uid}-n { transition: opacity 0.25s ease, box-shadow 0.2s ease; }
.${uid}-n:focus-visible { outline: 2px solid ${theme.textColor}; outline-offset: 3px; }
.${uid}-l { transition: stroke-opacity 0.25s ease; }
${
    isStatic
        ? ""
        : `.${uid}-n { animation: ${uid}-in 0.4s ease both; }
.${uid}-l { animation: ${uid}-in 0.5s ease both; }
@keyframes ${uid}-in { from { opacity: 0; } }`
}
@media (prefers-reduced-motion: reduce) { .${uid}-n, .${uid}-l { animation: none !important; transition: none !important; } }
`

    const tipNode = showNotes && !isStatic && hoverId !== null && tree[hoverId] && tree[hoverId].note && pos.has(hoverId) ? tree[hoverId] : null
    const tipPos = tipNode ? pos.get(tipNode.id) : undefined
    const outerW = W * scale
    const tipMax = Math.min(240, Math.max(120, outerW - 16))
    const rootText = tree[root]?.text || "Mind map"

    return (
        <div
            ref={boxRef}
            role="group"
            aria-label={"Mind map: " + rootText}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: fit === "scroll" ? "auto" : "hidden",
                display: "flex",
                background: theme.background,
                borderRadius: theme.radius,
                boxSizing: "border-box",
            }}
        >
            <style>{css}</style>
            {/* 축소 후 실제 차지하는 크기만큼 자리를 잡는 바깥 상자 (좁으면 가운데, 넘치면 스크롤) */}
            <div style={{ position: "relative", flexShrink: 0, margin: "auto", width: W * scale, height: H * scale }}>
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: W,
                        height: H,
                        transform: `scale(${scale})`,
                        transformOrigin: "0 0",
                    }}
                >
                    {/* 연결선 (부모 가지 색 상속) */}
                    <svg width={W} height={H} aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
                        {edges.map((e) => {
                            const a = pos.get(e.from)!
                            const b = pos.get(e.to)!
                            const child = tree[e.to]
                            const on = !lit || (lit.has(e.from) && lit.has(e.to))
                            return (
                                <path
                                    key={e.from + "-" + e.to}
                                    className={uid + "-l"}
                                    d={edgePath({ ...a, cx: a.cx + offX, cy: a.cy + offY }, { ...b, cx: b.cx + offX, cy: b.cy + offY }, radial)}
                                    fill="none"
                                    stroke={child.color}
                                    strokeWidth={child.depth === 1 ? lineWidth * 1.6 : lineWidth}
                                    strokeOpacity={lit ? (on ? 1 : 0.12) : theme.lineOpacity}
                                    strokeLinecap="round"
                                />
                            )
                        })}
                    </svg>

                    {/* 노드 */}
                    {Array.from(pos.entries()).map(([id, p]) => {
                        const n = tree[id]
                        const isRoot = id === root
                        const hasKids = n.children.length > 0
                        const expandable = hasKids && collapsible && !isRoot
                        const isCollapsed = expandable && collapsed.has(id)
                        const dim = lit ? !lit.has(id) : false
                        const f = isRoot ? centerF : nodeF
                        const px = pxOf(n)
                        const solid = isRoot || (nodeStyle === "solid" && n.depth === 1)
                        const tint = !solid && nodeStyle === "solid"
                        const fg = solid ? textOn(n.color) : theme.textColor
                        const bg = solid ? n.color : nodeStyle === "outline" ? theme.nodeFill : theme.background
                        const radius = nodeShape === "pill" ? 999 : isRoot ? 20 : 12
                        const borderW = solid ? 0 : n.depth === 1 ? 2 : 1.5
                        const [bx, by] = clipToBox(p.ux, p.uy, p.w, p.h)
                        const common: CSSProperties = {
                            ...f, // 폰트는 통째로 spread (개별 접근 금지)
                            fontSize: px,
                            position: "absolute",
                            left: p.cx + offX,
                            top: p.cy + offY,
                            transform: "translate(-50%, -50%)",
                            width: "max-content",
                            maxWidth: isRoot ? rootMaxW : maxW,
                            boxSizing: "border-box",
                            padding: `${padYOf(id)}px ${padXOf(id)}px`,
                            textAlign: "center",
                            overflowWrap: "break-word",
                            color: fg,
                            backgroundColor: bg,
                            backgroundImage: tint ? `linear-gradient(${withAlpha(n.color, 0.16)}, ${withAlpha(n.color, 0.16)})` : undefined,
                            border: borderW ? `${borderW}px solid ${n.color}` : "none",
                            borderRadius: radius,
                            boxShadow: isRoot ? "0 10px 28px -12px rgba(0,0,0,0.4)" : hoverId === id && lit ? "0 8px 22px -10px rgba(0,0,0,0.35)" : "none",
                            opacity: dim ? 0.3 : 1,
                            cursor: expandable ? "pointer" : "default",
                            userSelect: "none",
                            margin: 0,
                            appearance: "none",
                            WebkitAppearance: "none",
                            zIndex: hoverId === id ? 3 : isRoot ? 2 : 1,
                        }
                        const interactive = highlight || showNotes
                        const handlers = {
                            onPointerEnter: interactive ? () => hover(id) : undefined,
                            onPointerLeave: interactive ? () => hover(null) : undefined,
                            onFocus: interactive ? () => hover(id) : undefined,
                            onBlur: interactive ? () => hover(null) : undefined,
                        }
                        const inner = (
                            <>
                                <span>{n.text}</span>
                                {n.note && <span style={VISUALLY_HIDDEN}>{". " + n.note}</span>}
                                {/* 접힘 배지: 접히면 숨은 개수(+N), 펼쳐진 상태에서는 호버 시 − 표시 */}
                                {expandable && (isCollapsed || hoverId === id) && (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            left: p.w / 2 + bx,
                                            top: p.h / 2 + by,
                                            transform: "translate(-50%, -50%)",
                                            minWidth: 22,
                                            height: 22,
                                            padding: "0 6px",
                                            boxSizing: "border-box",
                                            borderRadius: 11,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: isCollapsed ? n.color : theme.nodeFill,
                                            color: isCollapsed ? textOn(n.color) : theme.textColor,
                                            border: `1.5px solid ${n.color}`,
                                            fontFamily: "Inter, sans-serif",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {isCollapsed ? "+" + countHidden(id) : "−"}
                                    </span>
                                )}
                            </>
                        )
                        const setRef = (el: HTMLElement | null) => {
                            if (el) elRefs.current.set(id, el)
                            else elRefs.current.delete(id)
                        }
                        // 펼침/접힘이 가능한 노드는 버튼(키보드로 조작), 나머지는 일반 상자
                        return expandable ? (
                            <button
                                key={id}
                                ref={setRef}
                                type="button"
                                className={uid + "-n"}
                                aria-expanded={!isCollapsed}
                                aria-describedby={tipNode && tipNode.id === id ? uid + "-tip" : undefined}
                                onClick={() => toggle(id)}
                                style={common}
                                {...handlers}
                            >
                                {inner}
                            </button>
                        ) : (
                            <div
                                key={id}
                                ref={setRef}
                                className={uid + "-n"}
                                tabIndex={interactive ? 0 : undefined}
                                aria-describedby={tipNode && tipNode.id === id ? uid + "-tip" : undefined}
                                style={common}
                                {...handlers}
                            >
                                {inner}
                            </div>
                        )
                    })}
                </div>

                {/* 메모 툴팁: 확대·축소와 상관없이 같은 글자 크기로 표시 */}
                {tipNode && tipPos && (
                    <div
                        id={uid + "-tip"}
                        role="tooltip"
                        style={{
                            position: "absolute",
                            left: Math.min(Math.max((tipPos.cx + offX) * scale, tipMax / 2), Math.max(tipMax / 2, outerW - tipMax / 2)),
                            top: (tipPos.cy + offY + tipPos.h / 2) * scale + 10,
                            transform: "translateX(-50%)",
                            width: "max-content",
                            maxWidth: tipMax,
                            padding: "8px 12px",
                            borderRadius: 10,
                            background: theme.textColor,
                            color: textOn(theme.textColor),
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12.5,
                            lineHeight: 1.4,
                            boxShadow: "0 10px 24px -10px rgba(0,0,0,0.5)",
                            pointerEvents: "none",
                            zIndex: 10,
                        }}
                    >
                        {tipNode.note}
                    </div>
                )}
            </div>
        </div>
    )
}

MindMap.displayName = "Mind Map"

addPropertyControls(MindMap, {
    nodes: {
        type: ControlType.Array,
        title: "Nodes",
        control: {
            type: ControlType.Object,
            controls: {
                text: { type: ControlType.String, title: "Text", defaultValue: "New idea" },
                parent: {
                    type: ControlType.String,
                    title: "Parent",
                    defaultValue: "",
                    placeholder: "Parent's text",
                    description: "Type the exact text of the parent node. The first node with an empty parent becomes the center.",
                },
                color: { type: ControlType.Color, title: "Color", optional: true },
                note: { type: ControlType.String, title: "Note", defaultValue: "", placeholder: "Shown on hover", displayTextArea: true },
            },
        },
        defaultValue: SAMPLE,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["radial", "leftRight", "rightOnly"],
        optionTitles: ["Radial", "Left-Right", "Right-only"],
        defaultValue: "radial",
    },
    nodeShape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["pill", "rounded"],
        optionTitles: ["Pill", "Rounded"],
        defaultValue: "pill",
        displaySegmentedControl: true,
    },
    nodeStyle: {
        type: ControlType.Enum,
        title: "Node Style",
        options: ["solid", "outline"],
        optionTitles: ["Solid", "Outline"],
        defaultValue: "solid",
        displaySegmentedControl: true,
    },
    nodeSize: { type: ControlType.Number, title: "Node Size", defaultValue: 100, min: 60, max: 180, step: 5, unit: "%" },
    levelGap: { type: ControlType.Number, title: "Level Gap", defaultValue: 56, min: 16, max: 200, step: 2, unit: "px" },
    siblingGap: { type: ControlType.Number, title: "Sibling Gap", defaultValue: 14, min: 0, max: 80, step: 1, unit: "px" },
    maxWidth: { type: ControlType.Number, title: "Max Width", defaultValue: 200, min: 80, max: 420, step: 4, unit: "px" },
    lineWidth: { type: ControlType.Number, title: "Line Width", defaultValue: 2.5, min: 0.5, max: 8, step: 0.5, unit: "px" },
    expandedLevels: {
        type: ControlType.Number,
        title: "Expanded Levels",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    collapsible: { type: ControlType.Boolean, title: "Collapsible", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    highlight: { type: ControlType.Boolean, title: "Hover Focus", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showNotes: { type: ControlType.Boolean, title: "Show Notes", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["shrink", "fit", "scroll"],
        optionTitles: ["Shrink", "Fit", "Scroll"],
        defaultValue: "shrink",
        description: "Shrink: scale down only when it overflows. Fit: scale up or down to fill. Scroll: keep size and scroll.",
        displaySegmentedControl: true,
    },
    palette: {
        type: ControlType.Array,
        title: "Branch Colors",
        control: { type: ControlType.Color },
        defaultValue: DEFAULT_PALETTE,
    },
    appearance: {
        type: ControlType.Object,
        title: "Style",
        icon: "color",
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "#F6F6F3" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 60, step: 1, unit: "px" },
            centerColor: { type: ControlType.Color, title: "Center", defaultValue: "#111114" },
            nodeFill: { type: ControlType.Color, title: "Node Fill", defaultValue: "#FFFFFF" },
            textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            lineOpacity: { type: ControlType.Number, title: "Line Opacity", defaultValue: 0.6, min: 0.1, max: 1, step: 0.05 },
        },
    },
    centerFont: {
        type: ControlType.Font,
        title: "Center Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "22px", variant: "Bold", lineHeight: "1.2em", letterSpacing: "-0.01em" },
    },
    nodeFont: {
        type: ControlType.Font,
        title: "Node Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Medium", lineHeight: "1.3em" },
        description: "Created by BrandingUp",
    },
})
