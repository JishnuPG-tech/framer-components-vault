// [생성일] 2026-10-09
// [경위] 사장님 지시 — 다이어그램 10종 동시 제작 중 13번 상품. 의사결정 트리(순서도): 부모 ID만 적으면 위→아래(또는 좌→우)로 자동 배치, Walkthrough 모드로 가지를 클릭하며 결과까지 안내
// [변경이력]
//   - 2026-10-09: 최초 생성 (자동 트리 배치 + 다이아몬드/둥근 질문 + 결과·메모 카드 + 직각 연결선·가지 라벨 + Walkthrough 클릭 진행/되돌아가기/처음으로 + 전체 보기 호버 경로 강조 + Fit/Shrink/Scroll + 키보드·스크린리더)

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
type Kind = "question" | "outcome" | "note"

interface DNode {
    id?: string // 이 노드의 이름(ID)
    parentId?: string // 부모 노드의 ID. 비우면 맨 위(시작점)
    branch?: string // 부모에서 이 노드로 오는 가지 라벨 (예: Yes / No)
    text?: string // 노드 텍스트. 줄바꿈하면 첫 줄이 제목, 나머지는 설명
    kind?: Kind
    color?: string
}

interface LayoutOptions {
    nodeWidth?: number
    nodeHeight?: number
    siblingGap?: number
    levelGap?: number
}

interface Appearance {
    cardColor?: string
    textColor?: string
    subColor?: string
    borderColor?: string
    lineColor?: string
    lineWidth?: number
    highlightColor?: string
    questionColor?: string
    outcomeColor?: string
    noteColor?: string
    radius?: number
    shadow?: boolean
}

interface DecisionTreeProps {
    nodes?: DNode[]
    walkthrough?: boolean
    hoverPath?: boolean
    direction?: "vertical" | "horizontal"
    questionShape?: "diamond" | "rounded"
    overflow?: "fit" | "shrink" | "scroll"
    hintText?: string
    restartLabel?: string
    layout?: LayoutOptions
    appearance?: Appearance
    font?: any
    branchFont?: any
    style?: CSSProperties
}

// 트리 계산용 내부 노드
interface TNode {
    key: string
    data: DNode
    kind: Kind
    depth: number
    parent?: TNode
    children: TNode[]
}

// 배치가 끝난 노드 (x, y 는 왼쪽 위 좌표)
interface Placed {
    node: TNode
    x: number
    y: number
}

// 그릴 연결선 한 줄
interface EdgeItem {
    parent: TNode
    child: TNode
    mode: "solid" | "ghost" | "dotted"
}

// 설치 직후 보이는 샘플: 웹사이트 플랫폼 고르기 (깊이 3, 노드 10개)
const SAMPLE: DNode[] = [
    { id: "start", parentId: "", branch: "", text: "Need to sell online?", kind: "question" },
    { id: "design", parentId: "start", branch: "No", text: "Want full design control?", kind: "question" },
    { id: "framer", parentId: "design", branch: "Yes", text: "Framer\nPixel-perfect, animated sites", kind: "outcome" },
    { id: "framer-note", parentId: "framer", branch: "", text: "Great for portfolios and landing pages", kind: "note" },
    { id: "builder", parentId: "design", branch: "No", text: "Simple builder\nFast and template-based", kind: "outcome" },
    { id: "count", parentId: "start", branch: "Yes", text: "More than 100 products?", kind: "question" },
    { id: "hosted", parentId: "count", branch: "No", text: "Hosted store\nSetup in an afternoon", kind: "outcome" },
    { id: "custom", parentId: "count", branch: "Yes", text: "Need custom code?", kind: "question" },
    { id: "headless", parentId: "custom", branch: "Yes", text: "Headless commerce\nFull control, more work", kind: "outcome" },
    { id: "enterprise", parentId: "custom", branch: "No", text: "Enterprise plan\nScale without code", kind: "outcome" },
]

// 기본 폰트 (프레이머가 font 값을 못 넘길 때만 사용)
const FALLBACK_FONT = { fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, lineHeight: 1.3 }
const FALLBACK_BRANCH_FONT = { fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, lineHeight: 1.2 }

// 색에 투명도를 입힌다. 프레이머는 색을 rgb()/rgba() 로 넘기므로 둘 다 처리 (HEX 도 허용)
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

// 평면 목록 → 트리. parentId 가 비었거나 못 찾으면 시작점(루트). 순환 연결은 루트로 처리
function buildForest(list: DNode[]): TNode[] {
    const nodes: TNode[] = list.map((d, i) => ({
        key: (d.id || "").trim() || "node-" + i,
        data: d,
        kind: "question" as Kind,
        depth: 0,
        children: [],
    }))
    const byKey = new Map<string, TNode>()
    nodes.forEach((n) => {
        if (!byKey.has(n.key)) byKey.set(n.key, n)
    })
    const roots: TNode[] = []
    nodes.forEach((n) => {
        const pk = (n.data.parentId || "").trim()
        const parent = pk ? byKey.get(pk) : undefined
        if (parent && parent !== n && !hasDescendant(n, parent)) {
            parent.children.push(n)
            n.parent = parent
        } else roots.push(n)
    })
    const walk = (n: TNode, d: number) => {
        n.depth = d
        // 종류가 비어 있으면 자식이 있으면 질문, 없으면 결과로 본다
        n.kind = n.data.kind || (n.children.length ? "question" : "outcome")
        n.children.forEach((c) => walk(c, d + 1))
    }
    roots.forEach((r) => walk(r, 0))
    return roots
}

// a 아래에 b 가 있는지 확인 (순환 방지)
function hasDescendant(a: TNode, b: TNode): boolean {
    return a.children.some((c) => c === b || hasDescendant(c, b))
}

// 루트에서 해당 노드까지의 키 집합 (호버 경로 강조용)
function chainOf(n: TNode | undefined): Set<string> {
    const s = new Set<string>()
    let cur = n
    while (cur) {
        s.add(cur.key)
        cur = cur.parent
    }
    return s
}

/**
 * 의사결정 트리 (Decision Tree Flowchart) — 부모 ID만 적으면 자동 배치되는 질문·분기 순서도
 * Walkthrough 모드에서는 가지를 클릭하며 결과까지 한 단계씩 안내
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 680
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function DecisionTree(props: DecisionTreeProps) {
    const {
        nodes,
        walkthrough = false,
        hoverPath = true,
        direction = "vertical",
        questionShape = "diamond",
        overflow = "fit",
        hintText = "Pick an answer to continue",
        restartLabel = "Start over",
        layout,
        appearance,
        font,
        branchFont,
        style,
    } = props

    // 크기·간격 기본값
    const W = layout?.nodeWidth ?? 210
    const H = layout?.nodeHeight ?? 100
    const siblingGap = layout?.siblingGap ?? 20
    const levelGap = layout?.levelGap ?? 80

    // 색·모양 기본값
    const theme = {
        cardColor: appearance?.cardColor ?? "#FFFFFF",
        textColor: appearance?.textColor ?? "#111114",
        subColor: appearance?.subColor ?? "#6B6B76",
        borderColor: appearance?.borderColor ?? "rgba(17, 17, 20, 0.14)",
        lineColor: appearance?.lineColor ?? "#B8BBC6",
        lineWidth: appearance?.lineWidth ?? 1.75,
        highlight: appearance?.highlightColor ?? "#12B981",
        qAccent: appearance?.questionColor ?? "#7C6CF2",
        oAccent: appearance?.outcomeColor ?? "#12B981",
        nAccent: appearance?.noteColor ?? "#F59E0B",
        radius: appearance?.radius ?? 16,
        shadow: appearance?.shadow ?? true,
    }

    const horizontal = direction === "horizontal"
    const isStatic = useIsStaticRenderer() // 정적 렌더에서는 등장 애니메이션을 끈다
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    // 캔버스에서는 항상 전체 보기 (편집하기 쉽게). Walkthrough 는 미리보기·게시 화면에서 동작
    const walk = walkthrough && !onCanvas
    const uid = "dt" + useId().replace(/[:]/g, "")

    // 트리 구조: 노드 내용이 실제로 바뀔 때만 다시 계산
    const list = nodes && nodes.length ? nodes : SAMPLE
    const sig = JSON.stringify(list)
    const forest = useMemo(() => buildForest(list), [sig])

    // 진행 경로(Walkthrough): 시작점 이후 선택한 노드 키 목록
    const [path, setPath] = useState<string[]>([])
    const [hoverKey, setHoverKey] = useState<string | null>(null)
    useEffect(() => {
        startTransition(() => setPath([]))
    }, [sig, walk])

    // ── 배치: 각 서브트리의 폭을 구한 뒤 부모를 자식들 가운데에 놓는다 ──
    const breadthOf = horizontal ? H : W // 형제끼리 나란히 놓이는 방향의 노드 크기
    const gapAlong = horizontal ? Math.round(levelGap * 1.5) : levelGap // 좌→우는 가지 라벨이 들어갈 자리를 더 준다
    const depthStep = (horizontal ? W : H) + gapAlong

    const { placed, byKey, totalW, totalH } = useMemo(() => {
        const extent = new Map<string, number>()
        const measure = (n: TNode): number => {
            if (!n.children.length) {
                extent.set(n.key, breadthOf)
                return breadthOf
            }
            const sum = n.children.reduce((s, c) => s + measure(c), 0) + siblingGap * (n.children.length - 1)
            const w = Math.max(breadthOf, sum)
            extent.set(n.key, w)
            return w
        }
        const out: Placed[] = []
        const map = new Map<string, Placed>()
        const place = (n: TNode, offset: number) => {
            const w = extent.get(n.key) || breadthOf
            const along = offset + (w - breadthOf) / 2
            const across = n.depth * depthStep
            const p: Placed = { node: n, x: horizontal ? across : along, y: horizontal ? along : across }
            out.push(p)
            map.set(n.key, p)
            if (n.children.length) {
                const kidsTotal = n.children.reduce((s, c) => s + (extent.get(c.key) || breadthOf), 0) + siblingGap * (n.children.length - 1)
                let cursor = offset + (w - kidsTotal) / 2
                n.children.forEach((c) => {
                    place(c, cursor)
                    cursor += (extent.get(c.key) || breadthOf) + siblingGap
                })
            }
        }
        let cursor = 0
        forest.forEach((r, i) => {
            measure(r)
            place(r, cursor)
            cursor += (extent.get(r.key) || breadthOf) + (i < forest.length - 1 ? siblingGap * 2 : 0)
        })
        const maxX = out.reduce((m, p) => Math.max(m, p.x + W), 0)
        const maxY = out.reduce((m, p) => Math.max(m, p.y + H), 0)
        return { placed: out, byKey: map, totalW: maxX, totalH: maxY }
    }, [forest, horizontal, W, H, siblingGap, depthStep, breadthOf])

    // ── Walkthrough 상태 계산: 지나온 길(trail), 현재 위치, 선택지 ──
    const start = forest[0]
    const trail: TNode[] = []
    if (start) {
        trail.push(start)
        for (const k of path) {
            const last = trail[trail.length - 1]
            const next = last.children.find((c) => c.key === k && c.kind !== "note")
            if (!next) break
            trail.push(next)
        }
    }
    const current = trail[trail.length - 1]
    const options = current ? current.children.filter((c) => c.kind !== "note") : []
    const done = !!current && (current.kind === "outcome" || options.length === 0)
    const trailKeys = new Set(trail.map((t) => t.key))

    // 지금 그릴 노드·연결선
    const drawNodes: Placed[] = []
    const edges: EdgeItem[] = []
    if (!walk) {
        placed.forEach((p) => {
            drawNodes.push(p)
            if (p.node.parent) edges.push({ parent: p.node.parent, child: p.node, mode: p.node.kind === "note" ? "dotted" : "solid" })
        })
    } else {
        trail.forEach((t) => {
            const p = byKey.get(t.key)
            if (p) drawNodes.push(p)
            t.children.forEach((c) => {
                if (c.kind === "note") {
                    const cp = byKey.get(c.key)
                    if (cp) drawNodes.push(cp)
                    edges.push({ parent: t, child: c, mode: "dotted" })
                } else if (trailKeys.has(c.key)) edges.push({ parent: t, child: c, mode: "solid" })
                else if (t === current && !done) edges.push({ parent: t, child: c, mode: "ghost" })
            })
        })
    }

    // 강조할 노드 집합: Walkthrough 는 지나온 길, 전체 보기는 호버한 노드까지의 경로
    let lit: Set<string> | null = null
    if (walk) lit = trailKeys
    else if (hoverPath && hoverKey) lit = chainOf(byKey.get(hoverKey)?.node)

    // 선택지 클릭: 다음 노드를 연다
    const choose = (key: string) => {
        const next = [...trail.slice(1).map((t) => t.key), key]
        startTransition(() => setPath(next))
    }
    // 지나온 질문을 클릭: 그 지점으로 되돌아간다
    const rewind = (index: number) => {
        const next = trail.slice(1, index + 1).map((t) => t.key)
        startTransition(() => setPath(next))
    }
    const restart = () => startTransition(() => setPath([]))

    // 선택 후 키보드 포커스를 다음 선택지(없으면 '처음으로')로 옮긴다
    const boxRef = useRef<HTMLDivElement>(null)
    const firstRun = useRef(true)
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false
            return
        }
        const el = boxRef.current
        if (!walk || !el) return
        const target = el.querySelector("[data-dt-focus]") as HTMLElement | null
        if (target) target.focus()
    }, [path.length])

    // ── 컨테이너 크기를 재서 자동 축소 (브라우저에서만) ──
    const [box, setBox] = useState({ w: 0, h: 0 })
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
    const pad = 20
    const reserve = walk ? 48 : 0 // 아래쪽 안내/처음으로 버튼 자리
    const contentW = Math.max(1, totalW)
    const contentH = Math.max(1, totalH)
    const fitScale =
        box.w > 0 && box.h > 0
            ? Math.min((box.w - pad * 2) / contentW, (box.h - pad * 2 - reserve) / contentH)
            : 1
    // fit = 확대·축소 모두, shrink = 넘칠 때만 축소, scroll = 원래 크기 + 스크롤
    const scale = overflow === "fit" ? Math.max(0.05, fitScale) : overflow === "shrink" ? Math.max(0.05, Math.min(1, fitScale)) : 1

    // ── 연결선 기하: 부모 끝 → 중간에서 꺾임 → 자식 앞 (직각) ──
    const SPLIT = 0.4
    const edgePath = (a: Placed, b: Placed) => {
        if (horizontal) {
            const x1 = a.x + W
            const y1 = a.y + H / 2
            const x2 = b.x
            const y2 = b.y + H / 2
            const xm = x1 + gapAlong * SPLIT
            return `M ${x1} ${y1} H ${xm} V ${y2} H ${x2}`
        }
        const x1 = a.x + W / 2
        const y1 = a.y + H
        const x2 = b.x + W / 2
        const y2 = b.y
        const ym = y1 + gapAlong * SPLIT
        return `M ${x1} ${y1} V ${ym} H ${x2} V ${y2}`
    }
    // 가지 라벨 위치: 마지막 직선 구간의 가운데
    const labelPos = (a: Placed, b: Placed) => {
        const f = SPLIT + (1 - SPLIT) / 2
        if (horizontal) return { x: a.x + W + gapAlong * f, y: b.y + H / 2 }
        return { x: b.x + W / 2, y: a.y + H + gapAlong * f }
    }

    // 화면에 쓰는 CSS (등장 효과는 한 번만 재생, 반복 없음)
    const css = `
.${uid}-n { transition: opacity 0.2s ease, box-shadow 0.2s ease; }
.${uid}-e { transition: stroke 0.2s ease, opacity 0.2s ease; }
.${uid}-b { cursor: pointer; transition: transform 0.15s ease; }
.${uid}-b:hover { transform: scale(1.07); }
.${uid}-c { cursor: pointer; }
.${uid}-n:focus-visible, .${uid}-b:focus-visible, .${uid}-r:focus-visible, .${uid}-c:focus-visible { outline: 2px solid ${theme.highlight}; outline-offset: 3px; }
${isStatic ? "" : `.${uid}-in { animation: ${uid}-pop 0.32s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes ${uid}-pop { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: none; } }`}
@media (prefers-reduced-motion: reduce) { .${uid}-in { animation: none !important; } .${uid}-b, .${uid}-n, .${uid}-e { transition: none !important; } }
`

    const textFont = { ...FALLBACK_FONT, ...(font || {}) }
    const labelFont = { ...FALLBACK_BRANCH_FONT, ...(branchFont || {}) }
    const shadowCss = theme.shadow ? "0 8px 20px -12px rgba(0,0,0,0.28)" : "none"

    // 노드 안의 글자: 첫 줄은 제목, 나머지 줄은 설명
    const renderText = (text: string, center: boolean) => {
        const lines = (text || "").split("\n")
        const title = lines[0]
        const rest = lines.slice(1).join(" ").trim()
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 3, textAlign: center ? "center" : "left", minWidth: 0, width: "100%" }}>
                <span style={{ ...textFont, color: theme.textColor, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{title}</span>
                {rest && (
                    <span style={{ ...textFont, fontSize: "0.86em", fontWeight: 400, color: theme.subColor, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>{rest}</span>
                )}
            </div>
        )
    }

    // 한 노드를 그린다 (함수로 만들어 호출 — 컴포넌트가 아니라 다시 마운트되지 않음)
    const renderNode = (p: Placed) => {
        const n = p.node
        const kind = n.kind
        const accent = n.data.color || (kind === "question" ? theme.qAccent : kind === "outcome" ? theme.oAccent : theme.nAccent)
        const isLit = !!lit && lit.has(n.key)
        const dim = !walk && !!lit && !lit.has(n.key)
        const isCurrent = walk && current === n
        const reached = isCurrent && done && kind !== "note"
        const idx = trail.indexOf(n)
        const canRewind = walk && idx >= 0 && !isCurrent && kind !== "note"
        const diamond = kind === "question" && questionShape === "diamond"
        const stroke = reached || isCurrent || isLit ? theme.highlight : kind === "question" ? withAlpha(accent, 0.65) : theme.borderColor
        const strokeW = reached || isCurrent ? 2.75 : isLit ? 2.25 : 1.5
        const tint = reached ? withAlpha(theme.highlight, 0.16) : isLit ? withAlpha(theme.highlight, 0.08) : "transparent"
        const glow = reached
            ? `0 0 0 5px ${withAlpha(theme.highlight, 0.22)}, 0 14px 30px -12px rgba(0,0,0,0.3)`
            : isCurrent
              ? `0 0 0 4px ${withAlpha(theme.highlight, 0.18)}, ${shadowCss}`
              : shadowCss
        const Tag: any = canRewind ? "button" : "div"
        const label = (n.data.branch ? n.data.branch + ": " : "") + (n.data.text || "").replace(/\n/g, ". ")

        const boxStyle: CSSProperties = {
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            margin: 0,
            padding: 0,
            font: "inherit",
            color: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: dim ? 0.3 : 1,
            border: "none",
            background: "none",
        }

        let body: any
        if (diamond) {
            const pts = `${W / 2},${strokeW / 2} ${W - strokeW / 2},${H / 2} ${W / 2},${H - strokeW / 2} ${strokeW / 2},${H / 2}`
            body = (
                <>
                    <svg
                        width={W}
                        height={H}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            overflow: "visible",
                            filter: theme.shadow ? (reached ? `drop-shadow(0 0 7px ${withAlpha(theme.highlight, 0.45)})` : "drop-shadow(0 8px 10px rgba(0,0,0,0.12))") : "none",
                        }}
                        aria-hidden="true"
                    >
                        <polygon points={pts} fill={theme.cardColor} />
                        <polygon points={pts} fill={tint} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />
                    </svg>
                    <div style={{ position: "relative", padding: `0 ${Math.round(W * 0.2)}px`, width: "100%", boxSizing: "border-box" }}>
                        {renderText(n.data.text || "", true)}
                    </div>
                </>
            )
        } else {
            const dashed = kind === "note"
            body = (
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: kind === "question" ? "center" : "flex-start",
                        padding: kind === "question" ? "0 18px" : "6px 18px",
                        borderRadius: theme.radius,
                        border: `${strokeW}px ${dashed ? "dashed" : "solid"} ${stroke}`,
                        background: kind === "note" ? withAlpha(accent, 0.12) : theme.cardColor,
                        backgroundImage: tint === "transparent" ? undefined : `linear-gradient(${tint}, ${tint})`,
                        boxShadow: kind === "note" ? "none" : glow,
                        overflow: "hidden",
                    }}
                >
                    {kind === "outcome" && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: accent }} />}
                    <div style={{ paddingLeft: kind === "outcome" ? 6 : 0, width: "100%", boxSizing: "border-box" }}>
                        {renderText(n.data.text || "", kind === "question")}
                    </div>
                </div>
            )
        }

        const interactive = !walk && hoverPath
        return (
            <div key={n.key} style={{ position: "absolute", left: 0, top: 0, transform: `translate(${p.x}px, ${p.y}px)`, width: W, height: H }}>
                <Tag
                    className={uid + "-n" + (walk && !isStatic ? " " + uid + "-in" : "") + (canRewind ? " " + uid + "-c" : "")}
                    style={boxStyle}
                    {...(canRewind
                        ? { type: "button", onClick: () => rewind(idx), "aria-label": "Go back to: " + (n.data.text || "").split("\n")[0] }
                        : { tabIndex: interactive ? 0 : undefined, role: "group", "aria-label": label })}
                    onMouseEnter={interactive ? () => startTransition(() => setHoverKey(n.key)) : undefined}
                    onMouseLeave={interactive ? () => startTransition(() => setHoverKey(null)) : undefined}
                    onFocus={interactive ? () => startTransition(() => setHoverKey(n.key)) : undefined}
                    onBlur={interactive ? () => startTransition(() => setHoverKey(null)) : undefined}
                >
                    {body}
                </Tag>
            </div>
        )
    }

    // 가지 라벨 모양 (둥근 알약)
    const pillStyle = (active: boolean, clickable: boolean): CSSProperties => ({
        ...labelFont,
        boxSizing: "border-box",
        margin: 0,
        padding: "4px 11px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        border: `1.5px solid ${active ? theme.highlight : theme.borderColor}`,
        background: clickable ? theme.highlight : active ? withAlpha(theme.highlight, 0.14) : theme.cardColor,
        color: clickable ? "#06281C" : theme.textColor,
        display: "block",
    })

    const firstGhostIndex = edges.findIndex((x) => x.mode === "ghost")

    return (
        <div
            ref={boxRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: overflow === "scroll" ? "auto" : "hidden",
                display: "flex",
                alignItems: overflow === "scroll" ? "flex-start" : "center",
                justifyContent: overflow === "scroll" ? "flex-start" : "center",
                boxSizing: "border-box",
                paddingBottom: overflow === "scroll" ? 0 : reserve,
            }}
        >
            <style>{css}</style>
            {/* 화면 낭독기용 현재 위치 안내 */}
            {walk && current && (
                <div aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
                    {(done ? "Result: " : "Question: ") + (current.data.text || "").replace(/\n/g, ". ")}
                </div>
            )}
            {/* 축소 후 실제 차지 크기만큼 자리를 잡는 바깥 상자 */}
            <div
                style={{
                    position: "relative",
                    flexShrink: 0,
                    width: contentW * scale,
                    height: contentH * scale,
                    margin: overflow === "scroll" ? pad : 0,
                }}
            >
                <div style={{ position: "absolute", left: 0, top: 0, width: contentW, height: contentH, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
                    {/* 연결선 */}
                    <svg width={contentW} height={contentH} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }} aria-hidden="true">
                        <defs>
                            <marker id={uid + "-a0"} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                                <path d="M 0 1 L 9 5 L 0 9 z" fill={theme.lineColor} />
                            </marker>
                            <marker id={uid + "-a1"} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                                <path d="M 0 1 L 9 5 L 0 9 z" fill={theme.highlight} />
                            </marker>
                        </defs>
                        {edges.map((e) => {
                            const a = byKey.get(e.parent.key)
                            const b = byKey.get(e.child.key)
                            if (!a || !b) return null
                            const active = !!lit && lit.has(e.child.key) && lit.has(e.parent.key) && e.mode !== "dotted"
                            const dimmed = !walk && !!lit && !active
                            return (
                                <path
                                    key={e.parent.key + ">" + e.child.key + direction}
                                    className={uid + "-e"}
                                    d={edgePath(a, b)}
                                    fill="none"
                                    stroke={active ? theme.highlight : theme.lineColor}
                                    strokeWidth={active ? theme.lineWidth + 0.75 : theme.lineWidth}
                                    strokeDasharray={e.mode === "ghost" ? "6 5" : e.mode === "dotted" ? "2 5" : undefined}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity={dimmed ? 0.25 : 1}
                                    markerEnd={e.mode === "dotted" ? undefined : `url(#${uid}-${active ? "a1" : "a0"})`}
                                />
                            )
                        })}
                    </svg>

                    {/* 노드 */}
                    {drawNodes.map(renderNode)}

                    {/* 가지 라벨 (Walkthrough 에서는 현재 선택지가 버튼) */}
                    {edges.map((e, i) => {
                        const label = (e.child.data.branch || "").trim()
                        if (!label || e.mode === "dotted") return null
                        const a = byKey.get(e.parent.key)
                        const b = byKey.get(e.child.key)
                        if (!a || !b) return null
                        const pos = labelPos(a, b)
                        const wrap: CSSProperties = { position: "absolute", left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }
                        const active = !!lit && lit.has(e.child.key) && lit.has(e.parent.key)
                        if (walk && e.mode === "ghost") {
                            return (
                                <div key={"l-" + e.child.key} style={wrap}>
                                    <button
                                        type="button"
                                        className={uid + "-b"}
                                        {...(i === firstGhostIndex ? { "data-dt-focus": "" } : {})}
                                        onClick={() => choose(e.child.key)}
                                        aria-label={"Answer: " + label + ". Go to: " + (e.child.data.text || "").split("\n")[0]}
                                        style={{ ...pillStyle(true, true), cursor: "pointer" }}
                                    >
                                        {label}
                                    </button>
                                </div>
                            )
                        }
                        const dimmed = !walk && !!lit && !active
                        return (
                            <div key={"l-" + e.child.key} style={{ ...wrap, opacity: dimmed ? 0.3 : 1, transition: "opacity 0.2s ease", pointerEvents: "none" }} aria-hidden="true">
                                <span style={pillStyle(active, false)}>{label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Walkthrough 하단: 안내 문구 / 처음으로 버튼 */}
            {walk && (
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
                    {path.length > 0 ? (
                        <button
                            type="button"
                            className={uid + "-r"}
                            {...(done ? { "data-dt-focus": "" } : {})}
                            onClick={restart}
                            style={{
                                ...labelFont,
                                pointerEvents: "auto",
                                cursor: "pointer",
                                padding: "8px 16px",
                                borderRadius: 999,
                                border: `1.5px solid ${done ? theme.highlight : theme.borderColor}`,
                                background: done ? theme.highlight : theme.cardColor,
                                color: done ? "#06281C" : theme.textColor,
                            }}
                        >
                            {restartLabel}
                        </button>
                    ) : (
                        hintText && <span style={{ ...labelFont, fontWeight: 500, color: theme.subColor, padding: "8px 0" }}>{hintText}</span>
                    )}
                </div>
            )}
        </div>
    )
}

DecisionTree.displayName = "Decision Tree"

addPropertyControls(DecisionTree, {
    nodes: {
        type: ControlType.Array,
        title: "Nodes",
        control: {
            type: ControlType.Object,
            controls: {
                id: { type: ControlType.String, title: "ID", defaultValue: "", placeholder: "unique-name" },
                parentId: {
                    type: ControlType.String,
                    title: "Parent ID",
                    defaultValue: "",
                    placeholder: "ID of the parent",
                    description: "Type the ID of the node above this one. Leave empty for the starting point.",
                },
                branch: { type: ControlType.String, title: "Branch", defaultValue: "", placeholder: "Yes / No" },
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "New question?",
                    displayTextArea: true,
                    description: "A line break turns everything after the first line into a smaller description.",
                },
                kind: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["question", "outcome", "note"],
                    optionTitles: ["Question", "Outcome", "Note"],
                    defaultValue: "question",
                },
                color: { type: ControlType.Color, title: "Color" },
            },
        },
        defaultValue: SAMPLE as any,
    },
    walkthrough: {
        type: ControlType.Boolean,
        title: "Walkthrough",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "On: viewers click through the branches step by step. The canvas always shows the full tree.",
    },
    hoverPath: {
        type: ControlType.Boolean,
        title: "Hover Path",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: any) => !!props.walkthrough,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["vertical", "horizontal"],
        optionTitles: ["Top-down", "Left-right"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
    },
    questionShape: {
        type: ControlType.Enum,
        title: "Questions",
        options: ["diamond", "rounded"],
        optionTitles: ["Diamond", "Rounded"],
        defaultValue: "diamond",
        displaySegmentedControl: true,
    },
    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["fit", "shrink", "scroll"],
        optionTitles: ["Fit", "Shrink", "Scroll"],
        defaultValue: "fit",
        displaySegmentedControl: true,
        description: "Fit: scale up or down to fill. Shrink: only scale down when it overflows. Scroll: keep size and scroll.",
    },
    hintText: {
        type: ControlType.String,
        title: "Hint",
        defaultValue: "Pick an answer to continue",
        hidden: (props: any) => !props.walkthrough,
    },
    restartLabel: {
        type: ControlType.String,
        title: "Restart",
        defaultValue: "Start over",
        hidden: (props: any) => !props.walkthrough,
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            nodeWidth: { type: ControlType.Number, title: "Node Width", defaultValue: 210, min: 120, max: 400, step: 5, unit: "px" },
            nodeHeight: { type: ControlType.Number, title: "Node Height", defaultValue: 100, min: 60, max: 220, step: 2, unit: "px" },
            siblingGap: { type: ControlType.Number, title: "Sibling Gap", defaultValue: 20, min: 0, max: 120, step: 2, unit: "px" },
            levelGap: { type: ControlType.Number, title: "Level Gap", defaultValue: 80, min: 40, max: 240, step: 2, unit: "px" },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Style",
        icon: "color",
        controls: {
            cardColor: { type: ControlType.Color, title: "Card", defaultValue: "#FFFFFF" },
            textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            subColor: { type: ControlType.Color, title: "Sub Text", defaultValue: "#6B6B76" },
            borderColor: { type: ControlType.Color, title: "Border", defaultValue: "rgba(17, 17, 20, 0.14)" },
            lineColor: { type: ControlType.Color, title: "Line", defaultValue: "#B8BBC6" },
            lineWidth: { type: ControlType.Number, title: "Line Width", defaultValue: 1.75, min: 0.5, max: 6, step: 0.25, unit: "px" },
            highlightColor: { type: ControlType.Color, title: "Highlight", defaultValue: "#12B981" },
            questionColor: { type: ControlType.Color, title: "Question", defaultValue: "#7C6CF2" },
            outcomeColor: { type: ControlType.Color, title: "Outcome", defaultValue: "#12B981" },
            noteColor: { type: ControlType.Color, title: "Note", defaultValue: "#F59E0B" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 40, step: 1, unit: "px" },
            shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Semibold", lineHeight: "1.3em" },
    },
    branchFont: {
        type: ControlType.Font,
        title: "Branch Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px", variant: "Semibold", lineHeight: "1.2em" },
        description: "Created by BrandingUp",
    },
})
