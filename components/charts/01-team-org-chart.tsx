// [생성일] 2026-09-29
// [경위] 달러벌기 01번 상품 — 조직도(Org Chart). "Reports To"에 상사 이름만 적으면 계층 트리·연결선을 자동 배치
// [변경이력]
//   - 2026-09-29: 최초 생성 (자동 트리 배치 + 접기/펼치기 + Scale to Fit + 세로/가로 + 직각/곡선 연결선 + 이니셜 아바타)
//   - 2026-09-29: 캔버스 확인 후 수정 — 프레이머가 색을 rgb() 로 넘겨 이니셜이 안 보이던 문제, Overflow 에 확대(Fit)/축소만(Shrink) 분리, 카드 기본 폭 220
//   - 2026-09-29: 무료 공개 전 홍보 링크 빈칸({{PROMO_URL}})을 링크 없는 제작자 문구로 교체 (도메인 확정 후 링크 복원)
//   - 2026-10-09: 개정 심사 기준(p132)에 맞춰 속성 설명란 홍보 문구 제거 → "Created by BrandingUp"
//   - 2026-10-09: 심사 선택 제안(접근성) 반영 — 접기 카드를 button + aria-expanded 로, 포커스 표시 추가

import { useEffect, useId, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties } from "react"
// 접근성 버튼에 팀 컬러 CSS 변수를 넘기기 위한 타입 (any 단언 대신, 2026-10-09)
type AccentStyle = CSSProperties & { "--oc-accent"?: string }
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
interface Person {
    name?: string
    role?: string
    photo?: { src?: string; srcSet?: string; alt?: string }
    reportsTo?: string
    color?: string
}

interface LayoutOptions {
    cardWidth?: number
    cardHeight?: number
    siblingGap?: number
    levelGap?: number
    avatarSize?: number
}

interface Appearance {
    cardColor?: string
    textColor?: string
    subColor?: string
    borderColor?: string
    lineColor?: string
    lineWidth?: number
    radius?: number
    shadow?: boolean
}

interface OrgChartProps {
    people?: Person[]
    direction?: "vertical" | "horizontal"
    lineStyle?: "elbow" | "curved"
    expandedLevels?: number
    collapsible?: boolean
    overflow?: "fit" | "shrink" | "scroll"
    layout?: LayoutOptions
    appearance?: Appearance
    nameFont?: any
    roleFont?: any
    style?: CSSProperties
}

// 트리 계산용 내부 노드
interface TreeNode {
    id: number
    person: Person
    depth: number
    children: TreeNode[]
}

// 배치가 끝난 카드 한 장 (x, y 는 카드 왼쪽 위 좌표)
interface Placed {
    node: TreeNode
    x: number
    y: number
    hiddenCount: number // 접혀서 안 보이는 하위 인원 수
}

// 설치 직후 보이는 샘플 조직 (사진 없이 이니셜 아바타)
const SAMPLE: Person[] = [
    { name: "Olivia Park", role: "CEO & Founder", reportsTo: "", color: "#2DE5A0" },
    { name: "Ethan Kim", role: "Head of Design", reportsTo: "Olivia Park", color: "#7C6CF2" },
    { name: "Sofia Lee", role: "Head of Engineering", reportsTo: "Olivia Park", color: "#3B82F6" },
    { name: "Noah Choi", role: "Head of Growth", reportsTo: "Olivia Park", color: "#F59E0B" },
    { name: "Mia Jung", role: "Product Designer", reportsTo: "Ethan Kim", color: "#7C6CF2" },
    { name: "Liam Han", role: "Brand Designer", reportsTo: "Ethan Kim", color: "#7C6CF2" },
    { name: "Ava Song", role: "Frontend Engineer", reportsTo: "Sofia Lee", color: "#3B82F6" },
    { name: "Lucas Yoon", role: "Backend Engineer", reportsTo: "Sofia Lee", color: "#3B82F6" },
    { name: "Emma Shin", role: "Marketing Lead", reportsTo: "Noah Choi", color: "#F59E0B" },
]

// 이름에서 이니셜 2글자 추출 (사진이 없을 때 아바타에 표시)
function initials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return "?"
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// 색상에 투명도를 입혀 rgba 로 변환 (아바타 배경 틴트용). 프레이머는 rgb()/rgba() 형식으로 넘기기도 함
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

// 평면 목록(People) → 트리 구조. "Reports To"가 비었거나 못 찾으면 최상위로 취급
function buildForest(people: Person[]): TreeNode[] {
    const nodes: TreeNode[] = people.map((p, i) => ({ id: i, person: p, depth: 0, children: [] }))
    const byName = new Map<string, TreeNode>()
    nodes.forEach((n) => {
        const key = (n.person.name || "").trim().toLowerCase()
        if (key && !byName.has(key)) byName.set(key, n)
    })
    const roots: TreeNode[] = []
    nodes.forEach((n) => {
        const bossKey = (n.person.reportsTo || "").trim().toLowerCase()
        const boss = bossKey ? byName.get(bossKey) : undefined
        // 자기 자신을 상사로 적은 경우 등 순환은 최상위로 처리
        if (boss && boss !== n && !isAncestor(n, boss)) boss.children.push(n)
        else roots.push(n)
    })
    // 깊이(단계) 계산
    const setDepth = (n: TreeNode, d: number) => {
        n.depth = d
        n.children.forEach((c) => setDepth(c, d + 1))
    }
    roots.forEach((r) => setDepth(r, 0))
    return roots
}

// a 가 b 의 조상인지 확인 (순환 연결 방지)
function isAncestor(a: TreeNode, b: TreeNode): boolean {
    return a.children.some((c) => c === b || isAncestor(c, b))
}

// 하위 전체 인원 수 (접힌 카드의 "+N" 표시용)
function countDescendants(n: TreeNode): number {
    return n.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0)
}

/**
 * 조직도 (Org Chart) — 평면 인원 목록을 자동으로 계층 트리로 배치
 * 접기/펼치기, 컨테이너에 맞춰 자동 축소(Scale to Fit), 세로·가로 방향 지원
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 440
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function OrgChart(props: OrgChartProps) {
    const {
        people,
        direction = "vertical",
        lineStyle = "elbow",
        expandedLevels = 3,
        collapsible = true,
        overflow = "shrink",
        layout,
        appearance,
        nameFont,
        roleFont,
        style,
    } = props

    // 크기·간격 기본값
    const cardW = layout?.cardWidth ?? 220
    const cardH = layout?.cardHeight ?? 72
    const siblingGap = layout?.siblingGap ?? 24
    const levelGap = layout?.levelGap ?? 56
    const avatar = layout?.avatarSize ?? 40

    // 색·모양 기본값
    const theme = {
        cardColor: appearance?.cardColor ?? "#FFFFFF",
        textColor: appearance?.textColor ?? "#111114",
        subColor: appearance?.subColor ?? "#6B6B76",
        borderColor: appearance?.borderColor ?? "rgba(17, 17, 20, 0.08)",
        lineColor: appearance?.lineColor ?? "#C9CBD3",
        lineWidth: appearance?.lineWidth ?? 1.5,
        radius: appearance?.radius ?? 14,
        shadow: appearance?.shadow ?? true,
    }

    const list = people && people.length ? people : SAMPLE
    const isStatic = useIsStaticRenderer() // 캔버스·정적 렌더에서는 애니메이션 정지
    const horizontal = direction === "horizontal"
    const uid = "oc" + useId().replace(/[:]/g, "")

    // 트리 구조 (People 이 바뀔 때만 다시 계산)
    const forest = useMemo(() => buildForest(list), [list])

    // 접힌 카드 id 목록. 처음엔 "Expanded Levels" 보다 깊은 단계를 접어 둔다
    const initialCollapsed = useMemo(() => {
        const set = new Set<number>()
        const walk = (n: TreeNode) => {
            if (n.children.length && n.depth >= expandedLevels - 1) set.add(n.id)
            n.children.forEach(walk)
        }
        forest.forEach(walk)
        return set
    }, [forest, expandedLevels])
    const [collapsed, setCollapsed] = useState<Set<number>>(initialCollapsed)
    useEffect(() => {
        startTransition(() => setCollapsed(initialCollapsed))
    }, [initialCollapsed])

    // 카드 클릭 시 접기/펼치기 토글
    const toggle = (id: number) => {
        if (!collapsible) return
        startTransition(() => {
            setCollapsed((prev) => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
            })
        })
    }

    // ── 배치 계산: 각 서브트리의 폭(가로 모드는 높이)을 구한 뒤 가운데 정렬 ──
    const breadthOf = horizontal ? cardH : cardW // 형제끼리 나란히 놓이는 방향의 카드 크기
    const depthStep = (horizontal ? cardW : cardH) + levelGap // 단계 사이 거리

    const { placed, edges, totalW, totalH } = useMemo(() => {
        const isOpen = (n: TreeNode) => !(collapsible && collapsed.has(n.id))
        const extent = new Map<number, number>()
        // 서브트리가 차지하는 폭(형제 방향) 계산
        const measure = (n: TreeNode): number => {
            const kids = isOpen(n) ? n.children : []
            if (!kids.length) {
                extent.set(n.id, breadthOf)
                return breadthOf
            }
            const sum = kids.reduce((s, c) => s + measure(c), 0) + siblingGap * (kids.length - 1)
            const w = Math.max(breadthOf, sum)
            extent.set(n.id, w)
            return w
        }
        const out: Placed[] = []
        const lines: { from: Placed; to: Placed }[] = []
        // 위치 지정: offset 은 서브트리 시작점
        const place = (n: TreeNode, offset: number): Placed => {
            const w = extent.get(n.id) || breadthOf
            const along = offset + (w - breadthOf) / 2
            const across = n.depth * depthStep
            const p: Placed = {
                node: n,
                x: horizontal ? across : along,
                y: horizontal ? along : across,
                hiddenCount: isOpen(n) ? 0 : countDescendants(n),
            }
            out.push(p)
            if (isOpen(n) && n.children.length) {
                const kidsTotal = n.children.reduce((s, c) => s + (extent.get(c.id) || breadthOf), 0) + siblingGap * (n.children.length - 1)
                let cursor = offset + (w - kidsTotal) / 2
                n.children.forEach((c) => {
                    const child = place(c, cursor)
                    lines.push({ from: p, to: child })
                    cursor += (extent.get(c.id) || breadthOf) + siblingGap
                })
            }
            return p
        }
        let cursor = 0
        forest.forEach((r, i) => {
            measure(r)
            place(r, cursor)
            cursor += (extent.get(r.id) || breadthOf) + (i < forest.length - 1 ? siblingGap * 2 : 0)
        })
        const maxX = out.reduce((m, p) => Math.max(m, p.x + cardW), 0)
        const maxY = out.reduce((m, p) => Math.max(m, p.y + cardH), 0)
        return { placed: out, edges: lines, totalW: maxX, totalH: maxY + 16 }
    }, [forest, collapsed, collapsible, horizontal, cardW, cardH, siblingGap, depthStep, breadthOf])

    // ── Scale to Fit: 컨테이너 크기를 재서 조직도를 축소 (브라우저에서만) ──
    const boxRef = useRef<HTMLDivElement>(null)
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
    const pad = 24
    // fit = 확대·축소 모두, shrink = 넘칠 때만 축소, scroll = 원래 크기 + 스크롤
    const fitScale =
        box.w > 0 && box.h > 0
            ? Math.min((box.w - pad * 2) / Math.max(1, totalW), (box.h - pad * 2) / Math.max(1, totalH))
            : 1
    const scale = overflow === "fit" ? Math.max(0.05, fitScale) : overflow === "shrink" ? Math.max(0.05, Math.min(1, fitScale)) : 1

    // 연결선 경로 (부모 카드 → 자식 카드)
    const pathFor = (a: Placed, b: Placed) => {
        if (horizontal) {
            const x1 = a.x + cardW
            const y1 = a.y + cardH / 2
            const x2 = b.x
            const y2 = b.y + cardH / 2
            const xm = x1 + levelGap / 2
            return lineStyle === "curved"
                ? `M ${x1} ${y1} C ${xm} ${y1}, ${xm} ${y2}, ${x2} ${y2}`
                : `M ${x1} ${y1} H ${xm} V ${y2} H ${x2}`
        }
        const x1 = a.x + cardW / 2
        const y1 = a.y + cardH
        const x2 = b.x + cardW / 2
        const y2 = b.y
        const ym = y1 + levelGap / 2
        return lineStyle === "curved"
            ? `M ${x1} ${y1} C ${x1} ${ym}, ${x2} ${ym}, ${x2} ${y2}`
            : `M ${x1} ${y1} V ${ym} H ${x2} V ${y2}`
    }

    // 카드 등장·이동 애니메이션 (캔버스에서는 끔)
    const css = isStatic
        ? ""
        : `
.${uid}-card { transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1); animation: ${uid}-in 0.4s ease both; }
.${uid}-card:hover { box-shadow: 0 10px 28px -12px rgba(0,0,0,0.25) !important; }
.${uid}-line { animation: ${uid}-fade 0.5s ease both; }
@keyframes ${uid}-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes ${uid}-fade { from { opacity: 0; } to { opacity: 1; } }
`

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
            }}
        >
            {css && <style>{css}</style>}
            {/* 키보드 포커스 표시 (접근성): 팀 컬러로 카드 바깥에 윤곽선. 애니메이션 아님이라 정적 렌더에서도 유지 */}
            <style>{`.${uid}-btn:focus-visible { outline: 2px solid var(--oc-accent, #2DE5A0) !important; outline-offset: 2px; }`}</style>
            {/* 축소 후 실제 차지 크기만큼 자리를 잡는 바깥 상자 */}
            <div
                style={{
                    position: "relative",
                    flexShrink: 0,
                    width: totalW * scale,
                    height: totalH * scale,
                    margin: overflow === "scroll" ? pad : 0,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: totalW,
                        height: totalH,
                        transform: `scale(${scale})`,
                        transformOrigin: "0 0",
                    }}
                >
                    {/* 연결선 */}
                    <svg
                        width={totalW}
                        height={totalH}
                        style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}
                    >
                        {edges.map((e) => (
                            <path
                                key={e.from.node.id + "-" + e.to.node.id + "-" + direction + lineStyle}
                                className={uid + "-line"}
                                d={pathFor(e.from, e.to)}
                                fill="none"
                                stroke={theme.lineColor}
                                strokeWidth={theme.lineWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ))}
                    </svg>

                    {/* 카드 */}
                    {placed.map((p) => {
                        const person = p.node.person
                        const accent = person.color || "#2DE5A0"
                        const hasKids = p.node.children.length > 0
                        const isCollapsed = p.hiddenCount > 0
                        return (
                            <div
                                key={p.node.id}
                                className={uid + "-card"}
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    transform: `translate(${p.x}px, ${p.y}px)`,
                                    width: cardW,
                                    height: cardH,
                                    boxSizing: "border-box",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "0 14px",
                                    background: theme.cardColor,
                                    border: `1px solid ${theme.borderColor}`,
                                    borderRadius: theme.radius,
                                    boxShadow: theme.shadow ? "0 6px 18px -10px rgba(0,0,0,0.22)" : "none",
                                    cursor: hasKids && collapsible ? "pointer" : "default",
                                    userSelect: "none",
                                }}
                            >
                                {/* 팀 컬러 바 */}
                                <div
                                    style={{
                                        position: "absolute",
                                        left: horizontal ? 0 : 14,
                                        right: horizontal ? "auto" : 14,
                                        top: horizontal ? 14 : 0,
                                        bottom: horizontal ? 14 : "auto",
                                        width: horizontal ? 3 : "auto",
                                        height: horizontal ? "auto" : 3,
                                        background: accent,
                                        borderRadius: 3,
                                    }}
                                />
                                {/* 아바타: 사진이 있으면 사진, 없으면 이니셜 */}
                                {person.photo?.src ? (
                                    <img
                                        src={person.photo.src}
                                        srcSet={person.photo.srcSet}
                                        alt={person.photo.alt || person.name}
                                        style={{
                                            width: avatar,
                                            height: avatar,
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            flexShrink: 0,
                                            display: "block",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: avatar,
                                            height: avatar,
                                            borderRadius: "50%",
                                            flexShrink: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: withAlpha(accent, 0.16),
                                            color: accent,
                                            fontSize: Math.round(avatar * 0.36),
                                            fontWeight: 700,
                                            fontFamily: "Inter, sans-serif",
                                        }}
                                    >
                                        {initials(person.name)}
                                    </div>
                                )}
                                {/* 이름·직책 */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                    <span
                                        style={{
                                            ...nameFont,
                                            color: theme.textColor,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {person.name}
                                    </span>
                                    <span
                                        style={{
                                            ...roleFont,
                                            color: theme.subColor,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {person.role}
                                    </span>
                                </div>
                                {/* 접기/펼치기 배지 */}
                                {hasKids && collapsible && (
                                    <div
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            left: horizontal ? "auto" : "50%",
                                            right: horizontal ? -11 : "auto",
                                            top: horizontal ? "50%" : "auto",
                                            bottom: horizontal ? "auto" : -11,
                                            transform: horizontal ? "translateY(-50%)" : "translateX(-50%)",
                                            minWidth: 22,
                                            height: 22,
                                            padding: "0 6px",
                                            boxSizing: "border-box",
                                            borderRadius: 11,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: isCollapsed ? accent : theme.cardColor,
                                            color: isCollapsed ? "#FFFFFF" : theme.subColor,
                                            border: `1px solid ${isCollapsed ? accent : theme.borderColor}`,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            fontFamily: "Inter, sans-serif",
                                            lineHeight: 1,
                                        }}
                                    >
                                        {isCollapsed ? "+" + p.hiddenCount : "−"}
                                    </div>
                                )}
                                {/* 접근성: 카드 전체를 덮는 투명 button (키보드 포커스·aria-expanded). 하위 인원이 있는 카드만 */}
                                {hasKids && collapsible && (
                                    <button
                                        type="button"
                                        className={uid + "-btn"}
                                        aria-expanded={!isCollapsed}
                                        aria-label={(isCollapsed ? "Expand " : "Collapse ") + (person.name || "team")}
                                        onClick={() => toggle(p.node.id)}
                                        style={
                                            {
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            width: "100%",
                                            height: "100%",
                                            appearance: "none",
                                            WebkitAppearance: "none",
                                            font: "inherit",
                                            color: "inherit",
                                            textAlign: "left",
                                            margin: 0,
                                            padding: 0,
                                            background: "transparent",
                                            border: "none", // 단축 속성만 사용 (개별 변 덮어쓰기 없음)
                                            borderRadius: theme.radius,
                                            cursor: "pointer",
                                            outline: "none",
                                            "--oc-accent": accent,
                                            } as AccentStyle
                                        }
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

OrgChart.displayName = "Org Chart"

addPropertyControls(OrgChart, {
    people: {
        type: ControlType.Array,
        title: "People",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Full Name" },
                role: { type: ControlType.String, title: "Role", defaultValue: "Role" },
                photo: { type: ControlType.ResponsiveImage, title: "Photo" },
                reportsTo: {
                    type: ControlType.String,
                    title: "Reports To",
                    defaultValue: "",
                    placeholder: "Manager's name",
                    description: "Type the exact name of this person's manager. Leave empty for the top.",
                },
                color: { type: ControlType.Color, title: "Team Color", defaultValue: "#2DE5A0" },
            },
        },
        defaultValue: SAMPLE,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
    },
    lineStyle: {
        type: ControlType.Enum,
        title: "Lines",
        options: ["elbow", "curved"],
        optionTitles: ["Elbow", "Curved"],
        defaultValue: "elbow",
        displaySegmentedControl: true,
    },
    expandedLevels: {
        type: ControlType.Number,
        title: "Expanded Levels",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    collapsible: {
        type: ControlType.Boolean,
        title: "Collapsible",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["fit", "shrink", "scroll"],
        optionTitles: ["Fit", "Shrink", "Scroll"],
        defaultValue: "shrink",
        description: "Fit: scale up or down to fill. Shrink: only scale down when it overflows. Scroll: keep size and scroll.",
        displaySegmentedControl: true,
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: { type: ControlType.Number, title: "Card Width", defaultValue: 220, min: 120, max: 400, step: 4, unit: "px" },
            cardHeight: { type: ControlType.Number, title: "Card Height", defaultValue: 72, min: 48, max: 160, step: 2, unit: "px" },
            siblingGap: { type: ControlType.Number, title: "Sibling Gap", defaultValue: 24, min: 0, max: 120, step: 2, unit: "px" },
            levelGap: { type: ControlType.Number, title: "Level Gap", defaultValue: 56, min: 16, max: 200, step: 2, unit: "px" },
            avatarSize: { type: ControlType.Number, title: "Avatar", defaultValue: 40, min: 0, max: 96, step: 2, unit: "px" },
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
            borderColor: { type: ControlType.Color, title: "Border", defaultValue: "rgba(17, 17, 20, 0.08)" },
            lineColor: { type: ControlType.Color, title: "Line", defaultValue: "#C9CBD3" },
            lineWidth: { type: ControlType.Number, title: "Line Width", defaultValue: 1.5, min: 0.5, max: 6, step: 0.5, unit: "px" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 14, min: 0, max: 40, step: 1, unit: "px" },
            shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
        },
    },
    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Semibold", lineHeight: "1.3em", letterSpacing: "-0.01em" },
    },
    roleFont: {
        type: ControlType.Font,
        title: "Role Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "13px", variant: "Regular", lineHeight: "1.3em" },
        description: "Created by BrandingUp", // 개정 심사 기준(p132): 설명란은 제작자 표기만 (2026-10-09)
    },
})
