// [생성일] 2026-10-09
// [경위] 사장님 지시 다이어그램 10종 동시 제작 — 달러벌기 07번 상품: 산키 다이어그램(Sankey Flow Diagram).
//        링크(출발 → 도착 → 값)만 입력하면 노드 추출·열(단계) 배치·띠 두께·세로 정렬을 자동 계산하고, 호버하면 그 경로만 강조
// [변경이력]
//   - 2026-10-09: 최초 생성 (위상 순서 열 배치 + 노드 정렬 완화 + 베지어 띠 + 경로 강조 + 가로/세로 + 라벨 모드 + 팔레트/노드별 색)
//   - 2026-10-09: 프레이머 심사 선택 개선 반영 — 링크 키보드 접근성, any 타입 제거
//   - 2026-10-09: 심사 선택 제안 반영 — 폰트 기본값 any 단언 제거

import { useEffect, useId, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent, PointerEvent } from "react"
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
interface LinkInput {
    from?: string
    to?: string
    value?: number
}

interface NodeColorInput {
    name?: string
    color?: string
}

interface SankeyProps {
    links?: LinkInput[]
    direction?: "horizontal" | "vertical"
    linkColor?: "source" | "target" | "gradient" | "neutral"
    labels?: "name" | "name-value" | "name-percent" | "name-value-percent" | "none"
    highlight?: "path" | "direct" | "off"
    alignEnds?: boolean
    showTooltip?: boolean
    valuePrefix?: string
    valueSuffix?: string
    nodeWidth?: number
    nodeGap?: number
    nodeRadius?: number
    linkOpacity?: number
    dimOpacity?: number
    padding?: number
    colors?: string[]
    nodeColors?: NodeColorInput[]
    labelColor?: string
    background?: string
    altText?: string
    font?: CSSProperties // 구체적 타입 (any 제거)
    style?: CSSProperties
}

// 계산용 내부 노드 · 링크
interface GNode {
    id: number
    name: string
    col: number // 열(단계) 번호
    value: number // 노드 크기 = 유입 합과 유출 합 중 큰 값
    sumIn: number
    sumOut: number
    ins: GLink[]
    outs: GLink[]
    u: number // 흐름 방향 좌표 (가로 모드면 x)
    v: number // 흐름과 수직 방향 좌표 (가로 모드면 y)
    h: number // 수직 방향 두께
    order: number
}

interface GLink {
    id: number
    s: GNode
    t: GNode
    value: number
    w: number // 띠 두께(px)
    sv: number // 출발 노드 안에서의 시작 오프셋
    tv: number // 도착 노드 안에서의 시작 오프셋
}

interface Active {
    kind: "node" | "link"
    id: number
    pinned: boolean
}

// 설치 직후 보이는 샘플: 유입 채널 4 → 랜딩 페이지 2 → 결과 3
const SAMPLE_LINKS: LinkInput[] = [
    { from: "Organic Search", to: "Home Page", value: 4200 },
    { from: "Organic Search", to: "Pricing Page", value: 1300 },
    { from: "Paid Ads", to: "Home Page", value: 1800 },
    { from: "Paid Ads", to: "Pricing Page", value: 2600 },
    { from: "Social", to: "Home Page", value: 1500 },
    { from: "Social", to: "Pricing Page", value: 400 },
    { from: "Email", to: "Home Page", value: 600 },
    { from: "Email", to: "Pricing Page", value: 900 },
    { from: "Home Page", to: "Signed Up", value: 2400 },
    { from: "Home Page", to: "Booked Demo", value: 600 },
    { from: "Home Page", to: "Bounced", value: 5100 },
    { from: "Pricing Page", to: "Signed Up", value: 1500 },
    { from: "Pricing Page", to: "Booked Demo", value: 1200 },
    { from: "Pricing Page", to: "Bounced", value: 2500 },
]

// 기본 팔레트 (노드 등장 순서대로 돌려 씀)
const SAMPLE_COLORS = ["#2DE5A0", "#7C6CF2", "#3B82F6", "#F59E0B", "#EF6B6B", "#14B8A6", "#EC4899", "#84CC16"]

// ─────────────────────────────────────────────
// 작은 도우미 함수들
// ─────────────────────────────────────────────

// 숫자를 천 단위 쉼표로 (로케일에 의존하지 않아 서버/브라우저 결과가 같음)
function fmtNumber(n: number) {
    const parts = String(Math.round(n * 100) / 100).split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return parts.join(".")
}

// 퍼센트 표기: 10% 미만은 소수 1자리
function fmtPercent(p: number) {
    return (p < 10 ? Math.round(p * 10) / 10 : Math.round(p)) + "%"
}

// 폰트 컨트롤 값에서 글자 크기만 "읽기" (배치 계산용. 스타일 적용은 항상 통째로 spread)
function readFontSize(font: CSSProperties | undefined): number {
    const raw = font ? font["fontSize"] : undefined
    if (typeof raw === "number") return raw
    if (typeof raw === "string") {
        const n = parseFloat(raw)
        if (!isFinite(n)) return 13
        return /r?em/i.test(raw) ? n * 16 : n
    }
    return 13
}

// rgb()/rgba()/HEX 어느 형식이든 완전 투명인지 판단 (프레이머는 색을 rgba() 로 넘긴다)
function isTransparent(color: string) {
    if (!color || color === "transparent") return true
    const m = color.match(/rgba?\(\s*[\d.]+[\s,]+[\d.]+[\s,]+[\d.]+(?:[\s,/]+([\d.]+%?))?/i)
    if (m && m[1] !== undefined) {
        const a = m[1].endsWith("%") ? parseFloat(m[1]) / 100 : parseFloat(m[1])
        return a === 0
    }
    return false
}

// ─────────────────────────────────────────────
// 1단계: 링크 목록 → 그래프 (노드 자동 추출, 순환 제거, 열 배정)
// ─────────────────────────────────────────────
function buildGraph(raw: LinkInput[], alignEnds: boolean) {
    const nodes: GNode[] = []
    const byKey = new Map<string, GNode>()
    const getNode = (name: string) => {
        const key = name.toLowerCase()
        let n = byKey.get(key)
        if (!n) {
            n = { id: nodes.length, name, col: 0, value: 0, sumIn: 0, sumOut: 0, ins: [], outs: [], u: 0, v: 0, h: 0, order: 0 }
            byKey.set(key, n)
            nodes.push(n)
        }
        return n
    }

    // 같은 (출발, 도착) 쌍은 값을 합친다. 값이 0 이하·숫자가 아님·자기 자신으로 가는 링크는 무시
    const merged = new Map<string, GLink>()
    const all: GLink[] = []
    ;(Array.isArray(raw) ? raw : []).forEach((l) => {
        const a = String(l && l.from != null ? l.from : "").trim()
        const b = String(l && l.to != null ? l.to : "").trim()
        const val = Number(l && l.value)
        if (!a || !b || a.toLowerCase() === b.toLowerCase() || !(val > 0) || !isFinite(val)) return
        const s = getNode(a)
        const t = getNode(b)
        const key = s.id + ">" + t.id
        const hit = merged.get(key)
        if (hit) hit.value += val
        else {
            const link: GLink = { id: all.length, s, t, value: val, w: 0, sv: 0, tv: 0 }
            merged.set(key, link)
            all.push(link)
            s.outs.push(link)
        }
    })

    // 순환(A→B→A) 제거: 깊이우선 탐색 중 "되돌아가는" 링크는 배치에서 제외
    const state = new Array(nodes.length).fill(0)
    const dropped = new Set<GLink>()
    const topo: GNode[] = []
    const visit = (n: GNode) => {
        state[n.id] = 1
        n.outs.forEach((l) => {
            if (state[l.t.id] === 1) dropped.add(l)
            else if (state[l.t.id] === 0) visit(l.t)
        })
        state[n.id] = 2
        topo.push(n)
    }
    nodes.forEach((n) => {
        if (state[n.id] === 0) visit(n)
    })
    topo.reverse()

    const links = all.filter((l) => !dropped.has(l))
    nodes.forEach((n) => {
        n.outs = []
        n.ins = []
    })
    links.forEach((l, i) => {
        l.id = i
        l.s.outs.push(l)
        l.t.ins.push(l)
    })

    // 열 배정: 위상 순서로 "가장 긴 경로" 길이 = 열 번호
    topo.forEach((n) => {
        n.outs.forEach((l) => {
            l.t.col = Math.max(l.t.col, n.col + 1)
        })
    })
    let maxCol = 0
    nodes.forEach((n) => (maxCol = Math.max(maxCol, n.col)))
    // 끝 정렬: 더 이어지지 않는 노드는 마지막 열로 모은다
    if (alignEnds) nodes.forEach((n) => n.outs.length === 0 && n.ins.length > 0 && (n.col = maxCol))

    nodes.forEach((n) => {
        n.sumIn = n.ins.reduce((s, l) => s + l.value, 0)
        n.sumOut = n.outs.reduce((s, l) => s + l.value, 0)
        n.value = Math.max(n.sumIn, n.sumOut)
    })
    return { nodes, links, ncols: maxCol + 1 }
}

// ─────────────────────────────────────────────
// 2단계: 좌표 계산 (노드 세로 정렬 + 링크 오프셋 누적)
// u = 흐름 방향, v = 수직 방향. 가로/세로 모드는 그릴 때 u,v 를 x,y 로 매핑만 바꾼다.
// ─────────────────────────────────────────────
function layoutGraph(
    g: { nodes: GNode[]; links: GLink[]; ncols: number },
    o: { uStart: number; uEnd: number; vStart: number; vEnd: number; nodeW: number; gap: number }
) {
    const { nodes, links, ncols } = g
    const { uStart, uEnd, vStart, vEnd, nodeW } = o
    const avail = Math.max(1, vEnd - vStart)

    const cols: GNode[][] = Array.from({ length: ncols }, () => [])
    nodes.forEach((n) => cols[n.col].push(n))
    const maxN = cols.reduce((m, c) => Math.max(m, c.length), 1)
    // 노드가 많아 칸이 모자라면 간격을 줄인다
    const gap = maxN > 1 ? Math.min(o.gap, (avail * 0.4) / (maxN - 1)) : o.gap

    // 값 → px 변환 배율: 가장 빡빡한 열 기준으로 통일
    let ky = Infinity
    cols.forEach((c) => {
        const sum = c.reduce((s, n) => s + n.value, 0)
        if (sum > 0) ky = Math.min(ky, (avail - gap * (c.length - 1)) / sum)
    })
    if (!isFinite(ky) || ky <= 0) ky = 0.0001

    nodes.forEach((n) => (n.h = Math.max(1, n.value * ky)))
    links.forEach((l) => (l.w = l.value * ky))

    // 열 위치(u)
    const span = Math.max(0, uEnd - uStart - nodeW)
    nodes.forEach((n) => {
        n.u = ncols === 1 ? uStart + span / 2 : uStart + (n.col * span) / (ncols - 1)
    })

    // 한 열을 세로 중앙에 쌓기
    const stack = (col: GNode[]) => {
        const total = col.reduce((s, n) => s + n.h, 0) + gap * Math.max(0, col.length - 1)
        let y = vStart + (avail - total) / 2
        col.forEach((n) => {
            n.v = y
            y += n.h + gap
        })
    }
    // 겹침 해소: 위에서 아래로 밀고, 넘치면 아래에서 위로 당긴다
    const collide = (col: GNode[]) => {
        col.sort((a, b) => a.v - b.v)
        let y = vStart
        col.forEach((n) => {
            if (n.v < y) n.v = y
            y = n.v + n.h + gap
        })
        if (y - gap > vEnd) {
            let yy = vEnd
            for (let i = col.length - 1; i >= 0; i--) {
                const n = col[i]
                if (n.v + n.h > yy) n.v = yy - n.h
                yy = n.v - gap
            }
        }
    }
    const center = (n: GNode) => n.v + n.h / 2

    // 초기 순서: 첫 열은 입력 순서, 이후 열은 연결된 이전 열 노드 위치의 가중 평균(교차 최소화)
    cols.forEach((col, ci) => {
        if (ci > 0) {
            const bary = new Map<GNode, number>()
            col.forEach((n, idx) => {
                const sum = n.ins.reduce((s, l) => s + l.value, 0)
                bary.set(n, sum > 0 ? n.ins.reduce((s, l) => s + l.s.order * l.value, 0) / sum : idx)
            })
            col.sort((a, b) => (bary.get(a) as number) - (bary.get(b) as number))
        }
        col.forEach((n, idx) => (n.order = idx))
        stack(col)
    })

    // 완화(relaxation): 연결된 노드의 가중 중심 쪽으로 끌어당기며 좌우로 여러 번 왕복
    for (let it = 0; it < 8; it++) {
        for (let c = 1; c < ncols; c++) {
            cols[c].forEach((n) => {
                const sum = n.ins.reduce((s, l) => s + l.value, 0)
                if (sum > 0) n.v += (n.ins.reduce((s, l) => s + center(l.s) * l.value, 0) / sum - center(n)) * 0.6
            })
            collide(cols[c])
        }
        for (let c = ncols - 2; c >= 0; c--) {
            cols[c].forEach((n) => {
                const sum = n.outs.reduce((s, l) => s + l.value, 0)
                if (sum > 0) n.v += (n.outs.reduce((s, l) => s + center(l.t) * l.value, 0) / sum - center(n)) * 0.6
            })
            collide(cols[c])
        }
    }

    // 링크 오프셋: 노드 안에서 띠가 위→아래로 쌓이는 위치 (상대 노드의 높이 순서대로 정렬해 교차를 줄임)
    nodes.forEach((n) => {
        n.outs.sort((a, b) => center(a.t) - center(b.t))
        let y = 0
        n.outs.forEach((l) => {
            l.sv = y
            y += l.w
        })
        n.ins.sort((a, b) => center(a.s) - center(b.s))
        y = 0
        n.ins.forEach((l) => {
            l.tv = y
            y += l.w
        })
    })
    return { ky }
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────

/**
 * Sankey Flow Diagram — 링크(출발 → 도착 → 값)만 입력하면 노드와 열을 자동 배치하고, 호버 시 그 경로만 강조
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function SankeyDiagram(props: SankeyProps) {
    const {
        links = SAMPLE_LINKS,
        direction = "horizontal",
        linkColor = "gradient",
        labels = "name-value",
        highlight = "path",
        alignEnds = true,
        showTooltip = true,
        valuePrefix = "",
        valueSuffix = "",
        nodeWidth = 14,
        nodeGap = 14,
        nodeRadius = 3,
        linkOpacity = 0.4,
        dimOpacity = 0.12,
        padding = 16,
        colors = SAMPLE_COLORS,
        nodeColors = [],
        labelColor = "#111111",
        background = "#FFFFFF",
        altText = "",
        font = { fontFamily: "Inter", fontWeight: 500, fontSize: "13px" },
        style,
    } = props

    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const isStatic = useIsStaticRenderer()
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const vertical = direction === "vertical"

    // ── 컨테이너 크기 측정 (브라우저에서만). 서버 렌더에서는 기본 크기로 그린다 ──
    const boxRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 720, h: 420 })
    useEffect(() => {
        const el = boxRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0].contentRect
            if (r.width > 0 && r.height > 0) startTransition(() => setBox({ w: Math.round(r.width), h: Math.round(r.height) }))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // 호버/고정(핀) 상태
    const [active, setActive] = useState<Active | null>(null)
    const setActiveSafe = (a: Active | null) => startTransition(() => setActive(a))
    // 키보드로 포커스된 링크 id (포커스 링 표시용)
    const [focusLink, setFocusLink] = useState<number | null>(null)

    const fs = Math.max(8, readFontSize(font))

    // ── 그래프 + 라벨 문구 계산 ──
    const model = useMemo(() => {
        const g = buildGraph(links as LinkInput[], alignEnds)
        const text = new Map<number, { name: string; extra: string }>()
        if (g.nodes.length === 0) return { g, empty: true as const, total: 0, text }

        // 퍼센트 분모: 가장 큰 열의 합계
        const colSum = new Array(g.ncols).fill(0)
        g.nodes.forEach((n) => (colSum[n.col] += n.value))
        const total = Math.max(...colSum)

        g.nodes.forEach((n) => {
            const parts: string[] = []
            if (labels === "name-value" || labels === "name-value-percent") parts.push(valuePrefix + fmtNumber(n.value) + valueSuffix)
            if (labels === "name-percent" || labels === "name-value-percent") parts.push(fmtPercent(total > 0 ? (n.value / total) * 100 : 0))
            text.set(n.id, { name: n.name, extra: parts.join(" · ") })
        })
        return { g, empty: false as const, total, text }
    }, [links, alignEnds, labels, valuePrefix, valueSuffix])

    const W = box.w
    const H = box.h
    const showLabels = labels !== "none"
    const pad = Math.max(0, padding)
    const nodeW = Math.max(2, nodeWidth)

    // ── 좌표 계산 (크기·간격이 바뀔 때만 다시) ──
    const geo = useMemo(() => {
        if (model.empty) return null
        const { g, text } = model
        // 첫·마지막 열 라벨이 놓일 바깥 여백을 글자 수로 어림
        const widthOf = (n: GNode) => {
            const t = text.get(n.id) as { name: string; extra: string }
            return Math.max(t.name.length, t.extra.length * 0.85) * fs * 0.56
        }
        const firstW = g.nodes.filter((n) => n.col === 0).reduce((m, n) => Math.max(m, widthOf(n)), 0)
        const lastW = g.nodes.filter((n) => n.col === g.ncols - 1).reduce((m, n) => Math.max(m, widthOf(n)), 0)
        const lineBlock = fs * (labels === "name" ? 1 : 2.3) // 라벨 높이 (이름 + 값 2줄)
        let left = pad,
            right = pad,
            top = pad,
            bottom = pad
        if (showLabels) {
            if (vertical) {
                top += lineBlock + fs * 0.9
                bottom += lineBlock + fs * 0.9
            } else {
                left += Math.min(firstW + 8, W * 0.3)
                if (g.ncols > 1) right += Math.min(lastW + 8, W * 0.3)
            }
        }
        return layoutGraph(g, {
            uStart: vertical ? top : left,
            uEnd: vertical ? H - bottom : W - right,
            vStart: vertical ? left : top,
            vEnd: vertical ? W - right : H - bottom,
            nodeW,
            gap: Math.max(0, nodeGap),
        })
    }, [model, W, H, vertical, showLabels, fs, pad, nodeW, nodeGap])

    // 빈 데이터 안내
    if (model.empty || !geo) {
        return (
            <div
                ref={boxRef}
                role="img"
                aria-label="Sankey diagram has no valid links"
                style={{
                    ...style,
                    ...font,
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background,
                    color: labelColor,
                    opacity: 0.6,
                    textAlign: "center",
                    padding: 16,
                }}
            >
                Add links (From, To, Value) to draw the flow.
            </div>
        )
    }

    const g = model.g

    // ── 색 ──
    const palette = Array.isArray(colors) && colors.length > 0 ? colors : SAMPLE_COLORS
    const overrides = new Map<string, string>()
    ;(Array.isArray(nodeColors) ? nodeColors : []).forEach((nc) => {
        if (nc && nc.name && nc.color) overrides.set(String(nc.name).trim().toLowerCase(), nc.color)
    })
    const colorOf = (n: GNode) => overrides.get(n.name.toLowerCase()) || palette[n.id % palette.length]

    // ── 좌표 매핑: (u, v) → 화면 (x, y). 세로 모드는 두 축을 맞바꾼다 ──
    const px = (u: number, v: number) => (vertical ? v : u)
    const py = (u: number, v: number) => (vertical ? u : v)
    const pt = (u: number, v: number) => px(u, v) + "," + py(u, v)

    // 띠 하나의 베지어 경로 (위쪽 곡선 → 끝 → 아래쪽 곡선 → 닫기)
    const linkPath = (l: GLink) => {
        const u0 = l.s.u + nodeW
        const u1 = l.t.u
        const um = (u0 + u1) / 2
        const a0 = l.s.v + l.sv
        const a1 = l.t.v + l.tv
        return (
            "M" + pt(u0, a0) +
            " C" + pt(um, a0) + " " + pt(um, a1) + " " + pt(u1, a1) +
            " L" + pt(u1, a1 + l.w) +
            " C" + pt(um, a1 + l.w) + " " + pt(um, a0 + l.w) + " " + pt(u0, a0 + l.w) + " Z"
        )
    }

    // ── 경로 강조 계산: 상류(up)·하류(down)로 끝까지 따라간다 ──
    const walk = (start: GNode, dir: "up" | "down") => {
        const seen = new Set<number>([start.id])
        const stack = [start]
        while (stack.length) {
            const n = stack.pop() as GNode
            ;(dir === "up" ? n.ins : n.outs).forEach((l) => {
                const nx = dir === "up" ? l.s : l.t
                if (!seen.has(nx.id)) {
                    seen.add(nx.id)
                    stack.push(nx)
                }
            })
        }
        return seen
    }
    let lit: { nodes: Set<number>; links: Set<number> } | null = null
    if (active && highlight !== "off") {
        const nodesOn = new Set<number>()
        const linksOn = new Set<number>()
        // 상류 집합 up 끼리, 하류 집합 down 끼리 이어진 띠만 "경로"로 본다
        const addPath = (up: Set<number>, down: Set<number>) => {
            up.forEach((i) => nodesOn.add(i))
            down.forEach((i) => nodesOn.add(i))
            g.links.forEach((l) => {
                if ((up.has(l.s.id) && up.has(l.t.id)) || (down.has(l.s.id) && down.has(l.t.id))) linksOn.add(l.id)
            })
        }
        if (active.kind === "node") {
            const n = g.nodes[active.id]
            if (n) {
                if (highlight === "direct") {
                    nodesOn.add(n.id)
                    n.ins.forEach((l) => {
                        linksOn.add(l.id)
                        nodesOn.add(l.s.id)
                    })
                    n.outs.forEach((l) => {
                        linksOn.add(l.id)
                        nodesOn.add(l.t.id)
                    })
                } else addPath(walk(n, "up"), walk(n, "down"))
            }
        } else {
            const l = g.links[active.id]
            if (l) {
                linksOn.add(l.id)
                nodesOn.add(l.s.id)
                nodesOn.add(l.t.id)
                if (highlight === "path") addPath(walk(l.s, "up"), walk(l.t, "down"))
            }
        }
        lit = { nodes: nodesOn, links: linksOn }
    }

    // ── 상호작용 핸들러 (마우스 호버·터치 탭 고정·키보드). 캔버스/정적 렌더에서는 끈다 ──
    const interact = (kind: "node" | "link", id: number) => {
        if (onCanvas || isStatic) return {}
        const toggle = () => {
            if (active && active.pinned && active.kind === kind && active.id === id) setActiveSafe(null)
            else setActiveSafe({ kind, id, pinned: true })
        }
        return {
            onPointerEnter: (e: PointerEvent<SVGElement>) => {
                if (e.pointerType === "touch") return
                if (!active || !active.pinned) setActiveSafe({ kind, id, pinned: false })
            },
            onPointerLeave: (e: PointerEvent<SVGElement>) => {
                if (e.pointerType === "touch") return
                if (!active || !active.pinned) setActiveSafe(null)
            },
            onClick: (e: MouseEvent<SVGElement>) => {
                e.stopPropagation()
                toggle()
            },
            onKeyDown: (e: KeyboardEvent<SVGElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggle()
                } else if (e.key === "Escape") setActiveSafe(null)
            },
            onFocus: (e: FocusEvent<SVGElement>) => {
                // 키보드 포커스일 때만 포커스 링을 보여준다 (마우스 클릭 포커스는 제외)
                if (kind === "link") {
                    let vis = true
                    try {
                        vis = e.currentTarget.matches(":focus-visible")
                    } catch (err) {
                        vis = true
                    }
                    setFocusLink(vis ? id : null)
                }
                if (!active || !active.pinned) setActiveSafe({ kind, id, pinned: false })
            },
            onBlur: () => {
                if (kind === "link") setFocusLink(null)
                if (!active || !active.pinned) setActiveSafe(null)
            },
        }
    }

    const dimmed = (on: boolean) => (lit && !on ? dimOpacity : 1)
    const trans = isStatic || onCanvas ? "none" : "opacity 160ms ease"
    const halo = isTransparent(background) ? "none" : background
    const interactive = !(onCanvas || isStatic)

    // ── 접근성용 요약 ──
    const summary =
        altText ||
        "Sankey diagram with " + g.nodes.length + " nodes and " + g.links.length + " flows. " +
            g.links.map((l) => l.s.name + " to " + l.t.name + ": " + valuePrefix + fmtNumber(l.value) + valueSuffix).join("; ") + "."

    // ── 툴팁 (띠 호버 시 띠 중앙 위에 표시) ──
    let tip: { x: number; y: number; line: string; width: number } | null = null
    if (showTooltip && active && active.kind === "link" && interactive) {
        const l = g.links[active.id]
        if (l) {
            const um = (l.s.u + nodeW + l.t.u) / 2
            const vm = (l.s.v + l.sv + l.t.v + l.tv + l.w) / 2
            const share = l.s.sumOut > 0 ? (l.value / l.s.sumOut) * 100 : 0
            const line = l.s.name + " → " + l.t.name + "  " + valuePrefix + fmtNumber(l.value) + valueSuffix + " (" + fmtPercent(share) + " of " + l.s.name + ")"
            const width = Math.min(W - 8, line.length * fs * 0.54 + 20)
            tip = {
                x: Math.min(Math.max(px(um, vm) - width / 2, 4), Math.max(4, W - width - 4)),
                y: Math.min(Math.max(py(um, vm) - fs - 14, 4), Math.max(4, H - fs * 2 - 4)),
                line,
                width,
            }
        }
    }

    return (
        <div ref={boxRef} style={{ ...style, width: "100%", height: "100%", boxSizing: "border-box", position: "relative", overflow: "hidden", background }}>
            <svg width={W} height={H} viewBox={"0 0 " + W + " " + H} role="group" aria-label={altText || "Sankey flow diagram"} style={{ display: "block" }}>
                <title>{altText || "Sankey flow diagram"}</title>
                <desc>{summary}</desc>

                {/* 빈 곳을 누르면 고정(핀) 해제 */}
                <rect x={0} y={0} width={W} height={H} fill="transparent" onClick={interactive ? () => setActiveSafe(null) : undefined} />

                {/* 그라데이션 정의 (띠마다 출발색 → 도착색) */}
                {linkColor === "gradient" && (
                    <defs>
                        {g.links.map((l) => (
                            <linearGradient
                                key={l.id}
                                id={uid + "g" + l.id}
                                gradientUnits="userSpaceOnUse"
                                x1={vertical ? 0 : l.s.u + nodeW}
                                y1={vertical ? l.s.u + nodeW : 0}
                                x2={vertical ? 0 : l.t.u}
                                y2={vertical ? l.t.u : 0}
                            >
                                <stop offset="0%" stopColor={colorOf(l.s)} />
                                <stop offset="100%" stopColor={colorOf(l.t)} />
                            </linearGradient>
                        ))}
                    </defs>
                )}

                {/* 띠 */}
                <g>
                    {g.links.map((l) => {
                        const on = !lit || lit.links.has(l.id)
                        const fill =
                            linkColor === "gradient"
                                ? "url(#" + uid + "g" + l.id + ")"
                                : linkColor === "target"
                                ? colorOf(l.t)
                                : linkColor === "neutral"
                                ? "#8A8F98"
                                : colorOf(l.s)
                        const base = lit && on ? Math.min(0.9, linkOpacity + 0.3) : linkOpacity
                        // 키보드 접근성: 읽어줄 라벨 + 고정(핀) 여부 + 포커스 링
                        const share = l.s.sumOut > 0 ? (l.value / l.s.sumOut) * 100 : 0
                        const linkLabel = "From " + l.s.name + " to " + l.t.name + ": " + valuePrefix + fmtNumber(l.value) + valueSuffix + " (" + fmtPercent(share) + ")"
                        const pinnedHere = !!(active && active.pinned && active.kind === "link" && active.id === l.id)
                        const focused = interactive && focusLink === l.id
                        return (
                            <path
                                key={l.id}
                                d={linkPath(l)}
                                fill={fill}
                                opacity={focused ? 1 : base * dimmed(on)}
                                stroke={focused ? labelColor : "none"}
                                strokeWidth={focused ? 3 : 0}
                                strokeLinejoin="round"
                                role="button"
                                tabIndex={interactive ? 0 : -1}
                                aria-label={linkLabel}
                                aria-pressed={interactive ? pinnedHere : undefined}
                                style={{ transition: trans, cursor: interactive ? "pointer" : "default", outline: "none" }}
                                {...interact("link", l.id)}
                            >
                                <title>{l.s.name + " to " + l.t.name + ": " + valuePrefix + fmtNumber(l.value) + valueSuffix}</title>
                            </path>
                        )
                    })}
                </g>

                {/* 노드 + 라벨 */}
                <g>
                    {g.nodes.map((n) => {
                        const on = !lit || lit.nodes.has(n.id)
                        const t = model.text.get(n.id) as { name: string; extra: string }
                        const first = n.col === 0
                        const last = n.col === g.ncols - 1 && g.ncols > 1
                        // 라벨 위치: 가로 = 첫 열은 왼쪽 바깥, 나머지는 노드 오른쪽 / 세로 = 마지막 열은 아래, 나머지는 위
                        let lx: number
                        let ly: number
                        let anchor: "start" | "middle" | "end"
                        const cv = n.v + n.h / 2
                        if (vertical) {
                            lx = cv
                            const half = t.extra ? fs * 1.3 : fs * 0.8
                            ly = last ? n.u + nodeW + half + 2 : n.u - half - 2
                            anchor = "middle"
                        } else {
                            ly = cv
                            if (first) {
                                lx = n.u - 8
                                anchor = "end"
                            } else {
                                lx = n.u + nodeW + 8
                                anchor = "start"
                            }
                        }
                        const w = vertical ? n.h : nodeW
                        const h = vertical ? nodeW : n.h
                        return (
                            <g
                                key={n.id}
                                opacity={dimmed(on)}
                                style={{ transition: trans, cursor: interactive ? "pointer" : "default", outline: "none" }}
                                role="button"
                                tabIndex={interactive ? 0 : -1}
                                aria-label={t.name + (t.extra ? ", " + t.extra : "")}
                                {...interact("node", n.id)}
                            >
                                <rect x={px(n.u, n.v)} y={py(n.u, n.v)} width={w} height={h} rx={Math.min(nodeRadius, w / 2, h / 2)} fill={colorOf(n)} />
                                {showLabels && (
                                    <text
                                        x={lx}
                                        y={ly}
                                        textAnchor={anchor}
                                        dominantBaseline="central"
                                        fill={labelColor}
                                        style={{
                                            ...font,
                                            fontSize: fs,
                                            paintOrder: "stroke",
                                            stroke: first || last ? "none" : halo,
                                            strokeWidth: 3,
                                            strokeLinejoin: "round",
                                            pointerEvents: "none",
                                        }}
                                    >
                                        {/* 이름 줄 + 값 줄(2줄)로 나눠 옆 열의 띠를 덜 가린다 */}
                                        <tspan x={lx} y={t.extra ? ly - fs * 0.6 : ly}>
                                            {t.name}
                                        </tspan>
                                        {t.extra && (
                                            <tspan x={lx} y={ly + fs * 0.62} opacity={0.6} style={{ fontSize: fs * 0.9 }}>
                                                {t.extra}
                                            </tspan>
                                        )}
                                    </text>
                                )}
                            </g>
                        )
                    })}
                </g>

                {/* 툴팁 */}
                {tip && (
                    <g style={{ pointerEvents: "none" }}>
                        <rect x={tip.x} y={tip.y} width={tip.width} height={fs + 14} rx={6} fill={labelColor} opacity={0.92} />
                        <text
                            x={tip.x + tip.width / 2}
                            y={tip.y + (fs + 14) / 2}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={isTransparent(background) ? "#FFFFFF" : background}
                            style={{ ...font, fontSize: fs * 0.92 }}
                        >
                            {tip.line}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    )
}

SankeyDiagram.displayName = "Sankey Flow Diagram"

// 캔버스 우측 패널의 속성 컨트롤 (중요도순)
// 폰트 컨트롤 기본값 (타입 지정, any 단언 대체)
const DEFAULT_FONT: { fontFamily: string; fontWeight: number; fontSize: string; lineHeight: string } = {
    fontFamily: "Inter",
    fontWeight: 500,
    fontSize: "13px",
    lineHeight: "1.3em",
}

addPropertyControls(SankeyDiagram, {
    links: {
        type: ControlType.Array,
        title: "Links",
        control: {
            type: ControlType.Object,
            controls: {
                from: { type: ControlType.String, title: "From", defaultValue: "Source" },
                to: { type: ControlType.String, title: "To", defaultValue: "Target" },
                value: { type: ControlType.Number, title: "Value", defaultValue: 100, min: 0, step: 1 },
            },
        },
        defaultValue: SAMPLE_LINKS,
        description: "Nodes and columns are created automatically from the names. Same name = same node.",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    labels: {
        type: ControlType.Enum,
        title: "Labels",
        options: ["name", "name-value", "name-percent", "name-value-percent", "none"],
        optionTitles: ["Name", "Name + Value", "Name + %", "Name + Value + %", "None"],
        defaultValue: "name-value",
    },
    linkColor: {
        type: ControlType.Enum,
        title: "Link Color",
        options: ["gradient", "source", "target", "neutral"],
        optionTitles: ["Gradient", "From Node", "To Node", "Neutral"],
        defaultValue: "gradient",
    },
    highlight: {
        type: ControlType.Enum,
        title: "Hover",
        options: ["path", "direct", "off"],
        optionTitles: ["Full Path", "Direct Only", "Off"],
        defaultValue: "path",
        description: "Full Path lights up everything upstream and downstream of the hovered node or flow.",
    },
    alignEnds: {
        type: ControlType.Boolean,
        title: "Align Ends",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description: "Moves nodes that have no outgoing flow to the last column.",
    },
    showTooltip: {
        type: ControlType.Boolean,
        title: "Tooltip",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (p: SankeyProps) => p.highlight === "off",
    },
    valuePrefix: { type: ControlType.String, title: "Prefix", defaultValue: "", placeholder: "$" },
    valueSuffix: { type: ControlType.String, title: "Suffix", defaultValue: "", placeholder: " visits" },
    nodeWidth: { type: ControlType.Number, title: "Node Width", defaultValue: 14, min: 2, max: 60, step: 1, unit: "px" },
    nodeGap: { type: ControlType.Number, title: "Node Gap", defaultValue: 14, min: 0, max: 80, step: 1, unit: "px" },
    nodeRadius: { type: ControlType.Number, title: "Node Radius", defaultValue: 3, min: 0, max: 30, step: 1, unit: "px" },
    linkOpacity: { type: ControlType.Number, title: "Link Opacity", defaultValue: 0.4, min: 0.05, max: 1, step: 0.05 },
    dimOpacity: {
        type: ControlType.Number,
        title: "Dim Opacity",
        defaultValue: 0.12,
        min: 0,
        max: 1,
        step: 0.02,
        hidden: (p: SankeyProps) => p.highlight === "off",
    },
    padding: { type: ControlType.Number, title: "Padding", defaultValue: 16, min: 0, max: 80, step: 1, unit: "px" },
    colors: {
        type: ControlType.Array,
        title: "Palette",
        control: { type: ControlType.Color },
        defaultValue: SAMPLE_COLORS,
        description: "Node colors are picked in order of appearance.",
    },
    nodeColors: {
        type: ControlType.Array,
        title: "Node Colors",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Node", defaultValue: "", placeholder: "Exact node name" },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#2DE5A0" },
            },
        },
        defaultValue: [],
        description: "Optional. Overrides the palette for a node with the same name.",
    },
    labelColor: { type: ControlType.Color, title: "Label", defaultValue: "#111111" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    altText: {
        type: ControlType.String,
        title: "Alt Text",
        defaultValue: "",
        placeholder: "Describe the chart for screen readers",
        description: "Leave empty to generate a summary from the links.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        // 2026-10-09: any 단언 제거 — 타입이 지정된 기본 폰트 객체로 대체 (값은 동일)
        defaultValue: DEFAULT_FONT,
        description: "Created by BrandingUp",
    },
})
