import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Types

type Node = {
    id: string
    title: string
    subtitle?: string
    kind?: string
    status?: string
    color?: string
    x?: number
    y?: number
    url?: string
}
type Edge = {
    from: string
    to: string
    label?: string
    color?: string
    dashed?: boolean
}
type Layout = "branch" | "pipeline" | "hub" | "tree" | "network" | "freeform"
type Mode = "desktop" | "tablet" | "mobile"
type HeightMode = "fit" | "fill"

type Props = {
    nodes?: Node[]
    connections?: Edge[]
    layout?: Layout
    theme?: "cinematic" | "obsidian" | "aurora" | "light" | "paper"
    title?: string
    subtitle?: string
    accent?: string
    signalColor?: string
    animated?: boolean
    speed?: number
    particles?: boolean
    showGrid?: boolean
    showHeader?: boolean
    showFooter?: boolean
    showToolbar?: boolean
    showLabels?: boolean
    showBadges?: boolean
    showMinimap?: boolean
    interactive?: boolean
    draggable?: boolean
    connectionStyle?: "curved" | "straight" | "step"
    nodeSize?: number
    cornerRadius?: number
    density?: number
    backgroundColor?: string
    useCustomBackground?: boolean
    responsive?: boolean
    responsiveMode?: "auto" | "desktop" | "tablet" | "mobile"
    mobileCompact?: boolean
    heightMode?: HeightMode
    preset?: "custom" | "ai" | "integrations" | "pipeline"
    style?: React.CSSProperties
}

// Presets

const aiNodes: Node[] = [
    {
        id: "sources",
        title: "Data Lake",
        subtitle: "Structured datasets",
        kind: "database",
        status: "LIVE",
    },
    {
        id: "events",
        title: "API Stream",
        subtitle: "Real-time ingestion",
        kind: "api",
        status: "SYNC",
    },
    {
        id: "webhook",
        title: "Webhooks",
        subtitle: "External triggers",
        kind: "api",
        status: "LIVE",
    },
    {
        id: "clean",
        title: "Data Prep",
        subtitle: "Transform & validate",
        kind: "apps",
        status: "READY",
    },
    {
        id: "engine",
        title: "AI Processor",
        subtitle: "Orchestration core",
        kind: "ai",
        status: "ACTIVE",
    },
    {
        id: "vector",
        title: "Vector Store",
        subtitle: "Semantic retrieval",
        kind: "database",
        status: "SYNC",
    },
    {
        id: "guard",
        title: "Quality Gate",
        subtitle: "Policy validation",
        kind: "check",
        status: "PASS",
    },
    {
        id: "apps",
        title: "Applications",
        subtitle: "Connected outputs",
        kind: "apps",
        status: "READY",
    },
    {
        id: "alerts",
        title: "Notifications",
        subtitle: "Instant signals",
        kind: "alerts",
        status: "READY",
    },
    {
        id: "reports",
        title: "Analytics",
        subtitle: "Live reporting",
        kind: "chart",
        status: "LIVE",
    },
]
const aiEdges: Edge[] = [
    { from: "sources", to: "clean", label: "Data" },
    { from: "events", to: "clean", label: "Events" },
    { from: "webhook", to: "engine", label: "Triggers" },
    { from: "clean", to: "engine", label: "Context" },
    { from: "vector", to: "engine", label: "Retrieve" },
    { from: "engine", to: "guard", label: "Inference" },
    { from: "guard", to: "apps", label: "Actions" },
    { from: "guard", to: "alerts", label: "Signals" },
    { from: "guard", to: "reports", label: "Metrics" },
]
const integrationNodes: Node[] = [
    {
        id: "hub",
        title: "Integration Hub",
        subtitle: "Connected intelligence",
        kind: "ai",
        status: "ACTIVE",
    },
    {
        id: "stripe",
        title: "Stripe",
        subtitle: "Payments",
        kind: "payment",
        status: "LIVE",
    },
    {
        id: "slack",
        title: "Slack",
        subtitle: "Team alerts",
        kind: "chat",
        status: "LIVE",
    },
    {
        id: "db",
        title: "PostgreSQL",
        subtitle: "Data warehouse",
        kind: "database",
        status: "SYNC",
    },
    {
        id: "mail",
        title: "Email",
        subtitle: "Campaign delivery",
        kind: "mail",
        status: "READY",
    },
    {
        id: "cloud",
        title: "Cloud Storage",
        subtitle: "Asset archive",
        kind: "cloud",
        status: "READY",
    },
    {
        id: "crm",
        title: "CRM",
        subtitle: "Customer records",
        kind: "apps",
        status: "SYNC",
    },
    {
        id: "webhook",
        title: "Webhooks",
        subtitle: "External events",
        kind: "api",
        status: "LIVE",
    },
    {
        id: "metrics",
        title: "Analytics",
        subtitle: "Usage metrics",
        kind: "chart",
        status: "LIVE",
    },
]
const integrationEdges: Edge[] = integrationNodes
    .slice(1)
    .map((n) => ({ from: "hub", to: n.id }))
const pipelineNodes: Node[] = [
    {
        id: "input",
        title: "Ingest",
        subtitle: "Raw events",
        kind: "api",
        status: "LIVE",
    },
    {
        id: "clean",
        title: "Validate",
        subtitle: "Quality checks",
        kind: "check",
        status: "PASS",
    },
    {
        id: "transform",
        title: "Transform",
        subtitle: "Feature pipeline",
        kind: "apps",
        status: "READY",
    },
    {
        id: "embed",
        title: "Embedding",
        subtitle: "Vector encoding",
        kind: "database",
        status: "READY",
    },
    {
        id: "model",
        title: "AI Model",
        subtitle: "Inference",
        kind: "ai",
        status: "ACTIVE",
    },
    {
        id: "review",
        title: "Review",
        subtitle: "Safety gate",
        kind: "check",
        status: "READY",
    },
    {
        id: "deploy",
        title: "Deploy",
        subtitle: "Production",
        kind: "cloud",
        status: "LIVE",
    },
    {
        id: "monitor",
        title: "Monitor",
        subtitle: "Observability",
        kind: "chart",
        status: "LIVE",
    },
]
const pipelineEdges: Edge[] = pipelineNodes
    .slice(0, -1)
    .map((n, i) => ({ from: n.id, to: pipelineNodes[i + 1].id }))

const defaults: Required<Omit<Props, "style">> = {
    nodes: aiNodes,
    connections: aiEdges,
    layout: "branch",
    theme: "cinematic",
    title: "Intelligent Systems",
    subtitle: "Live data orchestration & connected intelligence",
    accent: "#A68CFF",
    signalColor: "#45D9D4",
    animated: true,
    speed: 1,
    particles: true,
    showGrid: true,
    showHeader: true,
    showFooter: false,
    showToolbar: true,
    showLabels: false,
    showBadges: true,
    showMinimap: false,
    interactive: true,
    draggable: true,
    connectionStyle: "curved",
    nodeSize: 1,
    cornerRadius: 14,
    density: 1,
    backgroundColor: "#090F20",
    useCustomBackground: false,
    preset: "custom",
    responsive: true,
    responsiveMode: "auto",
    mobileCompact: true,
    heightMode: "fit",
}

/** Merge configured properties without overriding defaults with undefined values. */
function mergeProps(input: Props): Required<Omit<Props, "style">> {
    const out: Record<string, unknown> = { ...defaults }
    for (const key of Object.keys(input)) {
        if (key === "style") continue
        const value = (input as Record<string, unknown>)[key]
        if (value !== undefined && value !== null) out[key] = value
    }
    return out as Required<Omit<Props, "style">>
}

// Geometry

type Pt = { x: number; y: number }
type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n))
const validNum = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v)

function positions(
    nodes: Node[],
    edges: Edge[],
    layout: Layout,
    gap: number
): Record<string, Pt> {
    const out: Record<string, Pt> = {}
    if (!nodes.length) return out

    if (layout === "freeform") {
        nodes.forEach((n, i) => {
            out[n.id] = {
                x: validNum(n.x) ? n.x : (i % 4) * gap,
                y: validNum(n.y) ? n.y : Math.floor(i / 4) * gap * 0.6,
            }
        })
        return out
    }

    if (layout === "pipeline") {
        const cols = Math.min(4, nodes.length)
        nodes.forEach((n, i) => {
            const row = Math.floor(i / cols)
            const col = i % cols
            out[n.id] = {
                x: (row % 2 === 0 ? col : cols - 1 - col) * gap,
                y: row * gap * 0.64,
            }
        })
        return out
    }

    if (layout === "hub" || layout === "network") {
        const degree: Record<string, number> = {}
        nodes.forEach((n) => (degree[n.id] = 0))
        edges.forEach((e) => {
            if (e.from in degree) degree[e.from]++
            if (e.to in degree) degree[e.to]++
        })
        const hub =
            layout === "hub"
                ? [...nodes].sort((a, b) => degree[b.id] - degree[a.id])[0]
                : null
        const ring = hub ? nodes.filter((n) => n.id !== hub.id) : nodes
        if (hub) out[hub.id] = { x: 0, y: 0 }
        const radius = Math.max(gap, (ring.length * gap) / (2 * Math.PI))
        ring.forEach((n, i) => {
            const angle = -Math.PI / 2 + (2 * Math.PI * i) / ring.length
            out[n.id] = {
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
            }
        })
        return out
    }

    // Assign cycle-safe ranks for layered layouts.
    const ids = new Set(nodes.map((n) => n.id))
    const adj = new Map(nodes.map((n) => [n.id, [] as string[]]))
    edges.forEach((e) => {
        if (ids.has(e.from) && ids.has(e.to)) adj.get(e.from)!.push(e.to)
    })
    const state = new Map<string, number>() // DFS visit states
    const dag: Edge[] = []
    const visit = (id: string) => {
        state.set(id, 1)
        for (const to of adj.get(id) || []) {
            if (state.get(to) === 1) continue
            if (!state.get(to)) visit(to)
            dag.push({ from: id, to })
        }
        state.set(id, 2)
    }
    nodes.forEach((n) => {
        if (!state.get(n.id)) visit(n.id)
    })

    const depth: Record<string, number> = {}
    nodes.forEach((n) => (depth[n.id] = 0))
    for (let i = 0; i < nodes.length; i++) {
        let changed = false
        dag.forEach((e) => {
            if (depth[e.to] < depth[e.from] + 1) {
                depth[e.to] = depth[e.from] + 1
                changed = true
            }
        })
        if (!changed) break
    }

    const ranks = [...new Set(Object.values(depth))].sort((a, b) => a - b)
    const layers = ranks.map((r) => nodes.filter((n) => depth[n.id] === r))
    const order = new Map(nodes.map((n, i) => [n.id, i]))

    // Minimize edge crossings through barycentric ordering.
    for (let sweep = 0; sweep < 4; sweep++) {
        for (let k = 1; k < layers.length; k++) {
            const parents = new Map<string, number[]>()
            dag.forEach((e) => {
                if (depth[e.to] === ranks[k]) {
                    if (!parents.has(e.to)) parents.set(e.to, [])
                    parents.get(e.to)!.push(order.get(e.from) || 0)
                }
            })
            const mean = (id: string) => {
                const v = parents.get(id)
                return v && v.length
                    ? v.reduce((x, y) => x + y, 0) / v.length
                    : order.get(id) || 0
            }
            layers[k].sort(
                (a, b) =>
                    mean(a.id) - mean(b.id) ||
                    (order.get(a.id) || 0) - (order.get(b.id) || 0)
            )
            layers[k].forEach((n, i) => order.set(n.id, i))
        }
    }

    layers.forEach((layer, k) =>
        layer.forEach((n, i) => {
            const cross = (i - (layer.length - 1) / 2) * gap * 0.65
            out[n.id] =
                layout === "tree"
                    ? { x: cross, y: k * gap * 0.82 }
                    : { x: k * gap, y: cross }
        })
    )
    return out
}

function adaptivePositions(
    nodes: Node[],
    edges: Edge[],
    layout: Layout,
    gap: number,
    mode: Mode,
    nodeW: number,
    nodeH: number
): Record<string, Pt> {
    const base = positions(nodes, edges, layout, gap)
    if (mode === "desktop" || layout === "freeform") return base

    // Use non-overlapping rows and columns for compact breakpoints.
    const index = new Map(nodes.map((n, i) => [n.id, i]))
    const incoming = new Map(nodes.map((n) => [n.id, 0]))
    const outgoing = new Map(nodes.map((n) => [n.id, [] as string[]]))
    edges.forEach((e) => {
        if (incoming.has(e.to) && outgoing.has(e.from)) {
            incoming.set(e.to, (incoming.get(e.to) || 0) + 1)
            outgoing.get(e.from)!.push(e.to)
        }
    })
    // Preserve a stable order when the graph contains cycles.
    const pending = new Map(incoming)
    const ready = nodes.filter((n) => !pending.get(n.id)).map((n) => n.id)
    const ordered: string[] = []
    while (ready.length) {
        const id = ready.shift()!
        if (ordered.includes(id)) continue
        ordered.push(id)
        for (const next of outgoing.get(id) || []) {
            pending.set(next, (pending.get(next) || 0) - 1)
            if (pending.get(next) === 0) ready.push(next)
        }
    }
    nodes.forEach((n) => {
        if (!ordered.includes(n.id)) ordered.push(n.id)
    })

    const cols = mode === "mobile" ? 1 : 2
    const colStep = nodeW + Math.max(62, gap * 0.28)
    const rowStep = nodeH + Math.max(78, gap * 0.34)
    const out: Record<string, Pt> = {}
    ordered.forEach((id, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        out[id] = {
            x: (col - (cols - 1) / 2) * colStep,
            y: row * rowStep,
        }
    })
    return out
}

function boundsOf(pos: Record<string, Pt>, w: number, h: number): Bounds {
    const pts = Object.values(pos)
    if (!pts.length) return { minX: -100, minY: -60, maxX: 100, maxY: 60 }
    return {
        minX: Math.min(...pts.map((p) => p.x - w / 2 - 10)),
        minY: Math.min(...pts.map((p) => p.y - h / 2 - 18)),
        maxX: Math.max(...pts.map((p) => p.x + w / 2 + 10)),
        maxY: Math.max(...pts.map((p) => p.y + h / 2 + 10)),
    }
}

function edgePath(
    a: Pt,
    b: Pt,
    w: number,
    h: number,
    style: string,
    vertical: boolean
) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const horizontal = vertical ? false : Math.abs(dx) >= Math.abs(dy) * 0.7
    const s = horizontal
        ? { x: a.x + (Math.sign(dx || 1) * w) / 2, y: a.y }
        : { x: a.x, y: a.y + (Math.sign(dy || 1) * h) / 2 }
    const e = horizontal
        ? { x: b.x - (Math.sign(dx || 1) * w) / 2, y: b.y }
        : { x: b.x, y: b.y - (Math.sign(dy || 1) * h) / 2 }

    if (style === "straight") return `M${s.x} ${s.y} L${e.x} ${e.y}`
    if (style === "step")
        return horizontal
            ? `M${s.x} ${s.y} H${(s.x + e.x) / 2} V${e.y} H${e.x}`
            : `M${s.x} ${s.y} V${(s.y + e.y) / 2} H${e.x} V${e.y}`
    return horizontal
        ? `M${s.x} ${s.y} C${(s.x + e.x) / 2} ${s.y} ${(s.x + e.x) / 2} ${e.y} ${e.x} ${e.y}`
        : `M${s.x} ${s.y} C${s.x} ${(s.y + e.y) / 2} ${e.x} ${(s.y + e.y) / 2} ${e.x} ${e.y}`
}

// Icons and URL validation

function Icon({ kind, color }: { kind?: string; color: string }) {
    const common = {
        stroke: color,
        strokeWidth: 1.8,
        fill: "none",
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    }
    return (
        <g {...common}>
            {kind === "database" ? (
                <>
                    <ellipse cy="-7" rx="9" ry="4" />
                    <path d="M-9 -7 V8 C-9 14 9 14 9 8 V-7 M-9 1 C-9 7 9 7 9 1" />
                </>
            ) : kind === "api" ? (
                <path d="M-7 -6 L-13 0 L-7 6 M7 -6 L13 0 L7 6 M3 -10 L-3 10" />
            ) : kind === "apps" ? (
                <>
                    <rect x="-10" y="-10" width="9" height="9" rx="2" />
                    <rect x="2" y="-10" width="9" height="9" rx="2" />
                    <rect x="-10" y="2" width="9" height="9" rx="2" />
                    <rect x="2" y="2" width="9" height="9" rx="2" />
                </>
            ) : kind === "alerts" ? (
                <path d="M0 -12 C-7 -12 -8 -7 -8 0 L-11 7 H11 L8 0 C8 -7 7 -12 0 -12 M-3 11 H3" />
            ) : kind === "cloud" ? (
                <path d="M-9 7 C-18 7 -18 -6 -9 -7 C-5 -18 9 -14 11 -5 C21 -4 19 8 10 8 H-9" />
            ) : kind === "payment" ? (
                <>
                    <rect x="-13" y="-9" width="26" height="18" rx="3" />
                    <path d="M-13 -2 H13 M-8 4 H-2" />
                </>
            ) : kind === "mail" ? (
                <>
                    <rect x="-13" y="-9" width="26" height="18" rx="3" />
                    <path d="M-12 -8 L0 1 L12 -8" />
                </>
            ) : kind === "chat" ? (
                <path d="M-12 -10 H12 V6 H0 L-8 12 V6 H-12 Z" />
            ) : kind === "check" ? (
                <>
                    <circle r="12" />
                    <path d="M-6 0 L-1 5 L7 -5" />
                </>
            ) : kind === "chart" ? (
                <path d="M-12 10 H12 M-9 7 V-2 M-2 7 V-9 M5 7 V-5 M12 7 V-12" />
            ) : (
                <path d="M0 -13 L4 -4 L13 0 L4 4 L0 13 L-4 4 L-13 0 L-4 -4 Z" />
            )}
        </g>
    )
}

function safeURL(url?: string) {
    if (!url) return ""
    try {
        const u = new URL(url)
        return u.protocol === "https:" ||
            u.protocol === "http:" ||
            u.protocol === "mailto:"
            ? u.href
            : ""
    } catch {
        return ""
    }
}

// Themes

const themes = {
    cinematic: {
        bg: "#090F20",
        fg: "#F5F7FF",
        muted: "#9CAAC8",
        line: "#526991",
        card: "#192641",
        ai: "#302851",
        border: "#4A5D84",
        grid: "#9AABDD",
        glow: "#A68CFF",
        icon: "#A68CFF",
    },
    obsidian: {
        bg: "#090C10",
        fg: "#F1F4F7",
        muted: "#9DA8B2",
        line: "#52616C",
        card: "#171D23",
        ai: "#222B30",
        border: "#47535B",
        grid: "#758591",
        glow: "#35E6B2",
        icon: "#4BE0BD",
    },
    aurora: {
        bg: "#071E2A",
        fg: "#EAFDFF",
        muted: "#91B9C4",
        line: "#287A91",
        card: "#103444",
        ai: "#164C60",
        border: "#2E859A",
        grid: "#5EB5C2",
        glow: "#26D4DD",
        icon: "#55E6DE",
    },
    light: {
        bg: "#EDF3FA",
        fg: "#162A43",
        muted: "#627991",
        line: "#92ACC9",
        card: "#FFFFFF",
        ai: "#E7EAFD",
        border: "#BDCCE0",
        grid: "#6C91B8",
        glow: "#8B72E9",
        icon: "#705BD4",
    },
    paper: {
        bg: "#FCF8F1",
        fg: "#283341",
        muted: "#7B8190",
        line: "#B5A99C",
        card: "#FFFEFB",
        ai: "#F2E8D9",
        border: "#D7C8B7",
        grid: "#C7B6A0",
        glow: "#D69A59",
        icon: "#C47D41",
    },
}

// Component

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 640
 */
export default function FlowArcNesting(input: Props) {
    const p = mergeProps(input)
    const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
    const root = React.useRef<HTMLDivElement>(null)
    const svgRef = React.useRef<SVGSVGElement>(null)

    const [size, setSize] = React.useState<{ w: number; h: number | null }>({
        w: 960,
        h: null,
    })
    const [availableViewportHeight, setAvailableViewportHeight] =
        React.useState<number | null>(null)
    const [pan, setPan] = React.useState<Pt>({ x: 0, y: 0 })
    const [selected, setSelected] = React.useState<string | null>(null)
    const [hovered, setHovered] = React.useState<string | null>(null)
    const [offsets, setOffsets] = React.useState<Record<string, Pt>>({})
    const [zoom, setZoom] = React.useState(1)
    const [playing, setPlaying] = React.useState(true)
    const [reducedMotion, setReducedMotion] = React.useState(false)
    const [focusStep, setFocusStep] = React.useState(-1)

    const panDrag = React.useRef<{
        sx: number
        sy: number
        px: number
        py: number
        k: number
    } | null>(null)
    const drag = React.useRef<{
        id: string
        x: number
        y: number
        startX: number
        startY: number
        didMove: boolean
    } | null>(null)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStaticRenderer = useIsStaticRenderer()
    const [isInViewport, setIsInViewport] = React.useState(true)
    const [isDocumentVisible, setIsDocumentVisible] = React.useState(true)

    // Suspend decorative SVG motion when the component is not visible.
    // Static renderers always use the existing non-animated paths as fallback.
    React.useEffect(() => {
        if (isStaticRenderer || typeof window === "undefined") return

        const element = root.current
        if (!element) return

        const updateDocumentVisibility = () => {
            setIsDocumentVisible(document.visibilityState !== "hidden")
        }
        updateDocumentVisibility()
        document.addEventListener("visibilitychange", updateDocumentVisibility)

        if (typeof IntersectionObserver === "undefined") {
            return () => {
                document.removeEventListener(
                    "visibilitychange",
                    updateDocumentVisibility
                )
            }
        }

        const observer = new IntersectionObserver(
            (entries) => {
                setIsInViewport(entries[0]?.isIntersecting ?? true)
            },
            { threshold: 0 }
        )
        observer.observe(element)

        return () => {
            observer.disconnect()
            document.removeEventListener(
                "visibilitychange",
                updateDocumentVisibility
            )
        }
    }, [isStaticRenderer])

    // Resolve content-driven and frame-constrained sizing.
    const styleHeight = input.style?.height
    const styleHasConcreteHeight =
        typeof styleHeight === "number" ||
        (typeof styleHeight === "string" &&
            /^-?\d*\.?\d+(px|%|vh|dvh|svh)$/.test(styleHeight.trim()))
    const fillHeight = p.heightMode === "fill"

    // Observe width changes and frame height when applicable.
    React.useLayoutEffect(() => {
        const el = root.current
        if (!el) return
        const commit = () => {
            const w = el.clientWidth
            const h = el.clientHeight
            setSize((prev) => {
                const nextW = w > 0 && Number.isFinite(w) ? w : prev.w
                const nextH =
                    fillHeight && h > 0 && Number.isFinite(h) ? h : null
                const sameW = Math.abs(prev.w - nextW) < 0.5
                const sameH =
                    prev.h === nextH ||
                    (prev.h !== null &&
                        nextH !== null &&
                        Math.abs(prev.h - nextH) < 0.5)
                return sameW && sameH ? prev : { w: nextW, h: nextH }
            })
        }
        commit()
        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(commit)
        observer.observe(el)
        return () => observer.disconnect()
    }, [fillHeight])

    // Constrain the published desktop visualization to the visible viewport.
    // Content-driven sizing remains unchanged in the Framer editor and on mobile.
    React.useLayoutEffect(() => {
        if (isCanvas || typeof window === "undefined") {
            setAvailableViewportHeight(null)
            return
        }

        const measure = () => {
            const element = root.current
            if (!element) return
            const top = Math.max(0, element.getBoundingClientRect().top)
            const available = Math.floor(window.innerHeight - top)
            setAvailableViewportHeight((previous) =>
                previous === available ? previous : Math.max(0, available)
            )
        }

        measure()
        window.addEventListener("resize", measure)
        window.visualViewport?.addEventListener("resize", measure)
        return () => {
            window.removeEventListener("resize", measure)
            window.visualViewport?.removeEventListener("resize", measure)
        }
    }, [isCanvas])

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReducedMotion(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    /* ── Data sanitising ─────────────────────────────────────────────────────── */
    const preset =
        p.preset === "integrations"
            ? { nodes: integrationNodes, edges: integrationEdges }
            : p.preset === "pipeline"
              ? { nodes: pipelineNodes, edges: pipelineEdges }
              : p.preset === "ai"
                ? { nodes: aiNodes, edges: aiEdges }
                : null
    const rawNodes = preset?.nodes || p.nodes || aiNodes
    const rawEdges = preset?.edges || p.connections || aiEdges

    const seen = new Set<string>()
    const nodes = rawNodes
        .filter((n) => {
            if (
                !n ||
                typeof n.id !== "string" ||
                !n.id.trim() ||
                typeof n.title !== "string" ||
                seen.has(n.id)
            )
                return false
            seen.add(n.id)
            return true
        })
        .slice(0, 30)
    const ids = new Set(nodes.map((n) => n.id))
    const edges = rawEdges
        .filter((e) => e && ids.has(e.from) && ids.has(e.to) && e.from !== e.to)
        .slice(0, 60)

    const graphKey = JSON.stringify([
        p.layout,
        p.preset,
        nodes.map((n) => [n.id, n.x, n.y]),
        edges.map((e) => [e.from, e.to]),
    ])

    /* ── Responsive mode ─────────────────────────────────────────────────────── */
    const W = Math.max(1, size.w)
    const mode: Mode = !p.responsive
        ? "desktop"
        : p.responsiveMode !== "auto"
          ? p.responsiveMode
          : W < 600
            ? "mobile"
            : W < 900
              ? "tablet"
              : "desktop"
    const mobile = mode === "mobile"
    const tablet = mode === "tablet"
    const desktop = mode === "desktop"

    const sizeScale = clamp(p.nodeSize, 0.7, 1.5)
    const nodeW = (mobile ? 192 : tablet ? 168 : 172) * sizeScale
    const nodeH = (mobile && p.mobileCompact ? 74 : 78) * sizeScale
    const gap = 250 * clamp(p.density, 0.7, 1.6) * sizeScale

    const base = React.useMemo(
        () =>
            adaptivePositions(nodes, edges, p.layout, gap, mode, nodeW, nodeH),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [graphKey, gap, mode, nodeW, nodeH]
    )

    const geometryKey = `${graphKey}|${mode}|${gap}|${nodeW}|${nodeH}`
    React.useEffect(() => {
        setOffsets({})
        setSelected(null)
        setZoom(1)
        setPan({ x: 0, y: 0 })
        setFocusStep(-1)
    }, [geometryKey])

    const pos: Record<string, Pt> = { ...base, ...offsets }
    const bounds = boundsOf(pos, nodeW, nodeH)
    const fitBounds = boundsOf(base, nodeW, nodeH)
    const graphWidth = Math.max(1, fitBounds.maxX - fitBounds.minX)
    const graphHeight = Math.max(1, fitBounds.maxY - fitBounds.minY)

    // Vertical budget
    const insetX = mobile ? 20 : tablet ? 28 : 40
    // Maintain toolbar availability across breakpoints.
    const toolbarVisible = p.showToolbar && !isCanvas && p.interactive
    const contentTop = p.showHeader ? (mobile ? 152 : 145) : 40
    const contentBottom =
        p.showToolbar && p.interactive ? 94 : p.showFooter ? 60 : 40

    // Size the viewport to the responsive graph.
    const widthFit = Math.max(
        0.0001,
        Math.min((W - insetX * 2) / graphWidth, mobile ? 1 : 1.15)
    )
    const graphAreaHeight = Math.ceil(graphHeight * widthFit + 24)
    const intrinsicHeight = Math.ceil(
        contentTop + graphAreaHeight + contentBottom
    )
    // Desktop preview and published pages use the available browser height;
    // compact layouts retain their full, readable content height.
    const viewportConstrained =
        !isCanvas &&
        desktop &&
        availableViewportHeight !== null &&
        availableViewportHeight >= 320
    const resolvedHeight = viewportConstrained
        ? Math.min(intrinsicHeight, availableViewportHeight!)
        : intrinsicHeight
    const logicalHeight = viewportConstrained
        ? resolvedHeight
        : fillHeight && size.h !== null
          ? Math.max(200, size.h)
          : intrinsicHeight

    const viewportTop = contentTop
    const viewportBottom = logicalHeight - contentBottom
    const viewportHeight = Math.max(20, viewportBottom - viewportTop)
    const frameFit = Math.max(
        0.0001,
        Math.min(
            (W - insetX * 2) / graphWidth,
            viewportHeight / graphHeight,
            mobile ? 1 : 1.15
        )
    )
    const scale = frameFit * zoom
    const tx = W / 2 - ((fitBounds.minX + fitBounds.maxX) / 2) * scale + pan.x
    const ty =
        viewportTop +
        viewportHeight / 2 -
        ((fitBounds.minY + fitBounds.maxY) / 2) * scale +
        pan.y

    const clampPan = (x: number, y: number, atScale = scale): Pt => {
        const cx = (fitBounds.minX + fitBounds.maxX) / 2
        const cy = (fitBounds.minY + fitBounds.maxY) / 2
        const margin = 32
        const minX = W - insetX - margin - (bounds.maxX - cx) * atScale - W / 2
        const maxX = insetX + margin - (bounds.minX - cx) * atScale - W / 2
        const minY =
            viewportBottom -
            margin -
            (bounds.maxY - cy) * atScale -
            (viewportTop + viewportHeight / 2)
        const maxY =
            viewportTop +
            margin -
            (bounds.minY - cy) * atScale -
            (viewportTop + viewportHeight / 2)
        return {
            x: minX > maxX ? 0 : clamp(x, minX, maxX),
            y: minY > maxY ? 0 : clamp(y, minY, maxY),
        }
    }
    const effectivePan = clampPan(pan.x, pan.y)
    const cameraTx = tx - pan.x + effectivePan.x
    const cameraTy = ty - pan.y + effectivePan.y

    const panelsVisible = true
    const wideDesktop = desktop && W >= 680
    const toolbarWidth = 239
    const toolbarX = mobile
        ? Math.max(8, (W - toolbarWidth) / 2)
        : Math.max(insetX, W - insetX - toolbarWidth)
    const minimapWidth = 116
    const minimapX = Math.max(insetX, W - insetX - minimapWidth)

    const zoomBy = (factor: number) => {
        const next = clamp(zoom * factor, 1, 4)
        const nextPan = clampPan(
            (effectivePan.x * next) / zoom,
            (effectivePan.y * next) / zoom,
            frameFit * next
        )
        setZoom(next)
        setPan(nextPan)
    }
    const fitAll = () => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }
    const moveCamera = (dx: number, dy: number) =>
        setPan((cur) => clampPan(cur.x + dx, cur.y + dy))

    // Preserve native page scrolling at the default zoom.
    React.useEffect(() => {
        const element = svgRef.current
        if (!element || isCanvas || !p.interactive) return
        const onWheel = (event: WheelEvent) => {
            if (zoom <= 1.001) return
            event.preventDefault()
            event.stopPropagation()
            const unit =
                event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 240 : 1
            const m = element.getScreenCTM()
            const k = Math.max(m ? Math.hypot(m.a, m.b) : 1, 0.001)
            const horizontalOnly = event.shiftKey && !event.deltaX
            const dx =
                ((horizontalOnly ? event.deltaY : event.deltaX) * unit) / k
            const dy = ((horizontalOnly ? 0 : event.deltaY) * unit) / k
            moveCamera(-dx, -dy)
        }
        element.addEventListener("wheel", onWheel, { passive: false })
        return () => element.removeEventListener("wheel", onWheel)
    })

    // Theme
    const viewportClip = `faViewport${uid}`
    const light = p.theme === "light" || p.theme === "paper"
    const palette = themes[p.theme] || themes.cinematic
    const bg = p.useCustomBackground ? p.backgroundColor : palette.bg
    const fg = palette.fg
    const muted = palette.muted
    const line = palette.line
    const active = selected || hovered
    const gradient = `faGrad${uid}`
    const grid = `faGrid${uid}`
    const glow = `faGlow${uid}`
    const motion =
        p.animated &&
        playing &&
        !reducedMotion &&
        !isStaticRenderer &&
        isInViewport &&
        isDocumentVisible
    const sceneIds = nodes.map((n) => n.id)
    const selectedNode = nodes.find((n) => n.id === selected)

    /* ── Pointer handling ────────────────────────────────────────────────────── */
    const toSvg = (event: { clientX: number; clientY: number }): Pt => {
        const svg = svgRef.current
        if (!svg) return { x: 0, y: 0 }
        const matrix = svg.getScreenCTM()
        if (!matrix || !Number.isFinite(scale) || scale === 0)
            return { x: 0, y: 0 }
        const pt = svg.createSVGPoint()
        pt.x = event.clientX
        pt.y = event.clientY
        const q = pt.matrixTransform(matrix.inverse())
        return { x: (q.x - cameraTx) / scale, y: (q.y - cameraTy) / scale }
    }

    const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
        const pd = panDrag.current
        if (pd) {
            setPan(
                clampPan(
                    pd.px + (event.clientX - pd.sx) * pd.k,
                    pd.py + (event.clientY - pd.sy) * pd.k
                )
            )
            return
        }
        const d = drag.current
        if (!d) return
        const point = toSvg(event)
        if (Math.hypot(point.x - d.startX, point.y - d.startY) > 3)
            d.didMove = true
        if (!d.didMove || !p.draggable) return

        const halfW = (nodeW * scale) / 2
        const halfH = (nodeH * scale) / 2
        const limit = (v: number, lo: number, hi: number) =>
            lo > hi ? (lo + hi) / 2 : clamp(v, lo, hi)
        const x = limit(
            d.x + point.x - d.startX,
            (10 + halfW - cameraTx) / scale,
            (W - 10 - halfW - cameraTx) / scale
        )
        const y = limit(
            d.y + point.y - d.startY,
            (viewportTop + 22 + halfH - cameraTy) / scale,
            (viewportBottom - 10 - halfH - cameraTy) / scale
        )
        setOffsets((old) => ({ ...old, [d.id]: { x, y } }))
    }

    // Select nodes on pointer release when no drag occurred.
    const endPointer = (
        event: React.PointerEvent<SVGSVGElement>,
        allowSelect: boolean
    ) => {
        const d = drag.current
        if (allowSelect && d && !d.didMove && p.interactive && !isCanvas) {
            setSelected((old) => (old === d.id ? null : d.id))
        }
        drag.current = null
        panDrag.current = null
        try {
            event.currentTarget.releasePointerCapture(event.pointerId)
        } catch {}
    }

    const toolbarButton = (
        label: string,
        x: number,
        handler: () => void,
        content: string
    ) => (
        <g
            key={label}
            data-flowarc-control="true"
            role="button"
            tabIndex={0}
            aria-label={label}
            onClick={handler}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handler()
                }
            }}
            style={{ cursor: "pointer" }}
        >
            <rect
                x={x}
                y={logicalHeight - 61}
                width="36"
                height="34"
                rx="8"
                fill="transparent"
            />
            <text
                x={x + 18}
                y={logicalHeight - 39}
                textAnchor="middle"
                fill={fg}
                fontSize="17"
                fontWeight="600"
            >
                {content}
            </text>
            <title>{label}</title>
        </g>
    )

    // Apply the selected height strategy while preserving Framer styles.
    const { height: _ignoredHeight, ...restStyle } = input.style || {}
    const rootHeight: React.CSSProperties["height"] = viewportConstrained
        ? resolvedHeight
        : fillHeight
          ? styleHasConcreteHeight
              ? (styleHeight as number | string)
              : intrinsicHeight
          : intrinsicHeight

    return (
        <div
            ref={root}
            style={{
                width: "100%",
                minWidth: 0,
                minHeight: 0,
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
                borderRadius: 18,
                ...restStyle,
                height: rootHeight,
                background: bg,
            }}
        >
            <svg
                ref={svgRef}
                width={W}
                height={logicalHeight}
                viewBox={`0 0 ${W} ${logicalHeight}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={`${p.title}: workflow network with ${nodes.length} nodes and ${edges.length} connections`}
                tabIndex={p.interactive && !isCanvas ? 0 : undefined}
                onPointerDown={(event) => {
                    if (
                        isCanvas ||
                        !p.interactive ||
                        zoom <= 1.001 ||
                        event.button !== 0 ||
                        (event.target as Element).closest?.(
                            "[data-flowarc-node], [data-flowarc-control]"
                        )
                    )
                        return
                    event.preventDefault()
                    const m = svgRef.current?.getScreenCTM()
                    panDrag.current = {
                        sx: event.clientX,
                        sy: event.clientY,
                        px: effectivePan.x,
                        py: effectivePan.y,
                        k: m ? 1 / Math.max(Math.hypot(m.a, m.b), 0.001) : 1,
                    }
                    event.currentTarget.setPointerCapture(event.pointerId)
                }}
                onPointerMove={onPointerMove}
                onPointerUp={(e) => endPointer(e, true)}
                onPointerCancel={(e) => endPointer(e, false)}
                onKeyDown={(event) => {
                    if (isCanvas || !p.interactive) return
                    const amount = event.shiftKey ? 100 : 42
                    if (event.key === "ArrowLeft") moveCamera(amount, 0)
                    else if (event.key === "ArrowRight") moveCamera(-amount, 0)
                    else if (event.key === "ArrowUp") moveCamera(0, amount)
                    else if (event.key === "ArrowDown") moveCamera(0, -amount)
                    else if (
                        event.key === "Escape" ||
                        event.key.toLowerCase() === "f"
                    )
                        fitAll()
                    else return
                    event.preventDefault()
                }}
                onDoubleClick={() => {
                    if (p.interactive && !isCanvas) fitAll()
                }}
                style={{
                    // Keep the SVG within the frame in fill mode.
                    display: "block",
                    position: fillHeight ? "absolute" : "relative",
                    inset: fillHeight ? 0 : undefined,
                    width: "100%",
                    maxWidth: "100%",
                    height: fillHeight ? "100%" : logicalHeight,
                    background: bg,
                    touchAction:
                        p.interactive && !isCanvas && zoom > 1.001
                            ? "none"
                            : "pan-y",
                    cursor:
                        p.interactive && !isCanvas && zoom > 1.001
                            ? "grab"
                            : "default",
                    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                    userSelect: "none",
                }}
            >
                <defs>
                    <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
                        <stop stopColor={p.accent} />
                        <stop offset="1" stopColor={p.signalColor} />
                    </linearGradient>
                    <radialGradient id={glow}>
                        <stop
                            stopColor={palette.glow}
                            stopOpacity={light ? ".12" : ".24"}
                        />
                        <stop offset="1" stopColor={p.accent} stopOpacity="0" />
                    </radialGradient>
                    <pattern
                        id={grid}
                        width="27"
                        height="27"
                        patternUnits="userSpaceOnUse"
                    >
                        <path
                            d="M27 0 H0 V27"
                            stroke={palette.grid}
                            strokeOpacity=".12"
                            strokeWidth=".8"
                            fill="none"
                        />
                    </pattern>
                    <clipPath id={viewportClip}>
                        <rect
                            x="0"
                            y={viewportTop}
                            width={W}
                            height={viewportHeight}
                        />
                    </clipPath>
                </defs>

                <rect
                    width={W}
                    height={logicalHeight}
                    fill={bg}
                    pointerEvents="none"
                />
                {p.showGrid && (
                    <rect
                        width={W}
                        height={logicalHeight}
                        fill={`url(#${grid})`}
                        pointerEvents="none"
                    />
                )}
                <ellipse
                    cx={W / 2}
                    cy={logicalHeight / 2}
                    rx={W / 2}
                    ry={logicalHeight / 2}
                    fill={`url(#${glow})`}
                    pointerEvents="none"
                />
                <ellipse
                    cx={W * 0.82}
                    cy={logicalHeight * 0.78}
                    rx={W * 0.28}
                    ry="190"
                    fill={p.signalColor}
                    opacity={light ? ".025" : ".055"}
                    pointerEvents="none"
                />

                {p.showHeader && (
                    <g pointerEvents="none">
                        <text
                            x={mobile ? 22 : 36}
                            y="44"
                            fill={p.accent}
                            fontSize="11"
                            fontWeight="800"
                            letterSpacing="2"
                        >
                            FLOWARC / SYSTEM MAP
                        </text>
                        <text
                            x={mobile ? 22 : 36}
                            y="81"
                            fill={fg}
                            fontSize="27"
                            fontWeight="750"
                        >
                            {p.title.slice(
                                0,
                                mobile ? 22 : W < 700 ? 32 : W < 1050 ? 44 : 50
                            )}
                        </text>
                        <text
                            x={mobile ? 22 : 36}
                            y="106"
                            fill={muted}
                            fontSize="13"
                        >
                            {p.subtitle.slice(
                                0,
                                mobile ? 33 : W < 700 ? 46 : W < 1050 ? 65 : 95
                            )}
                        </text>
                        {!mobile && W >= 1050 && (
                            <>
                                <circle
                                    cx={W - 157}
                                    cy="49"
                                    r="4"
                                    fill={p.signalColor}
                                />
                                <text
                                    x={W - 144}
                                    y="53"
                                    fill={muted}
                                    fontSize="11"
                                >
                                    {nodes.length} NODES · {edges.length} LINKS
                                </text>
                            </>
                        )}
                        {mobile && (
                            <text x="22" y="125" fill={muted} fontSize="11">
                                {nodes.length} NODES · {edges.length} LINKS
                            </text>
                        )}
                    </g>
                )}

                <g clipPath={`url(#${viewportClip})`}>
                    <g
                        transform={`translate(${cameraTx} ${cameraTy}) scale(${scale})`}
                    >
                        {edges.map((edge, i) => {
                            const a = pos[edge.from]
                            const b = pos[edge.to]
                            if (!a || !b) return null
                            const d = edgePath(
                                a,
                                b,
                                nodeW,
                                nodeH,
                                p.connectionStyle,
                                p.layout === "tree"
                            )
                            const faded =
                                active &&
                                edge.from !== active &&
                                edge.to !== active
                            const highlighted =
                                focusStep >= 0 &&
                                (sceneIds[focusStep] === edge.from ||
                                    sceneIds[focusStep] === edge.to)
                            return (
                                <g
                                    key={`${edge.from}-${edge.to}-${i}`}
                                    opacity={faded ? 0.16 : 1}
                                >
                                    <path
                                        d={d}
                                        fill="none"
                                        stroke={line}
                                        strokeWidth="2.8"
                                    />
                                    <path
                                        d={d}
                                        fill="none"
                                        stroke={
                                            edge.color || `url(#${gradient})`
                                        }
                                        strokeWidth={highlighted ? 3 : 1.9}
                                        opacity=".86"
                                        strokeDasharray={
                                            edge.dashed ? "7 6" : undefined
                                        }
                                    />
                                    {motion && (
                                        <path
                                            d={d}
                                            fill="none"
                                            stroke={p.signalColor}
                                            strokeWidth="2.4"
                                            strokeDasharray="3 29"
                                            strokeLinecap="round"
                                        >
                                            <animate
                                                attributeName="stroke-dashoffset"
                                                from="0"
                                                to="-64"
                                                dur={`${Math.max(0.5, 2.4 / clamp(p.speed, 0.25, 3))}s`}
                                                repeatCount="indefinite"
                                            />
                                        </path>
                                    )}
                                    {motion && p.particles && (
                                        <circle r="3" fill={p.signalColor}>
                                            <animateMotion
                                                path={d}
                                                dur={`${Math.max(1, 3.1 / clamp(p.speed, 0.25, 3))}s`}
                                                repeatCount="indefinite"
                                            />
                                        </circle>
                                    )}
                                    {p.showLabels && edge.label && (
                                        <g
                                            transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 12})`}
                                        >
                                            <rect
                                                x={
                                                    -Math.min(
                                                        100,
                                                        edge.label.length * 4 +
                                                            10
                                                    )
                                                }
                                                y="-10"
                                                width={Math.min(
                                                    200,
                                                    edge.label.length * 8 + 20
                                                )}
                                                height="20"
                                                rx="9"
                                                fill={
                                                    light
                                                        ? "#FFFFFF"
                                                        : "#17223A"
                                                }
                                                stroke={line}
                                            />
                                            <text
                                                fill={muted}
                                                textAnchor="middle"
                                                y="4"
                                                fontSize="10"
                                            >
                                                {edge.label.slice(0, 24)}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            )
                        })}

                        {nodes.map((node) => {
                            const point = pos[node.id]
                            if (!point) return null
                            const color =
                                node.color ||
                                (node.kind === "ai"
                                    ? palette.icon
                                    : node.kind === "apps" ||
                                        node.kind === "alerts"
                                      ? p.signalColor
                                      : light
                                        ? "#547AB7"
                                        : "#7B9BF3")
                            const focused = selected === node.id
                            const neighbours = (id: string) =>
                                edges.some(
                                    (e) =>
                                        (e.from === id && e.to === node.id) ||
                                        (e.to === id && e.from === node.id)
                                )
                            const dim =
                                !!active &&
                                !focused &&
                                node.id !== active &&
                                !neighbours(active)
                            const sceneDim =
                                focusStep >= 0 &&
                                node.id !== sceneIds[focusStep] &&
                                !neighbours(sceneIds[focusStep])
                            const radius = clamp(p.cornerRadius, 0, 30)
                            const maxTitle = Math.max(
                                8,
                                Math.floor((nodeW - 76) / 7)
                            )

                            return (
                                <g
                                    key={node.id}
                                    data-flowarc-node="true"
                                    transform={`translate(${point.x} ${point.y})`}
                                    opacity={dim || sceneDim ? 0.3 : 1}
                                    style={{
                                        cursor:
                                            p.interactive && !isCanvas
                                                ? p.draggable
                                                    ? "grab"
                                                    : "pointer"
                                                : "default",
                                    }}
                                    onPointerEnter={() =>
                                        p.interactive && setHovered(node.id)
                                    }
                                    onPointerLeave={() => setHovered(null)}
                                    onPointerDown={(event) => {
                                        if (
                                            !p.interactive ||
                                            isCanvas ||
                                            event.button !== 0
                                        )
                                            return
                                        event.stopPropagation()
                                        const q = toSvg(event)
                                        drag.current = {
                                            id: node.id,
                                            x: point.x,
                                            y: point.y,
                                            startX: q.x,
                                            startY: q.y,
                                            didMove: false,
                                        }
                                        if (p.draggable) {
                                            try {
                                                svgRef.current?.setPointerCapture(
                                                    event.pointerId
                                                )
                                            } catch {}
                                        }
                                    }}
                                >
                                    <rect
                                        x={-nodeW / 2 + 2}
                                        y={-nodeH / 2 + 7}
                                        width={nodeW - 4}
                                        height={nodeH}
                                        rx={radius}
                                        fill="#000000"
                                        opacity={light ? ".10" : ".32"}
                                    />
                                    <rect
                                        x={-nodeW / 2}
                                        y={-nodeH / 2}
                                        width={nodeW}
                                        height={nodeH}
                                        rx={radius}
                                        fill={
                                            node.kind === "ai"
                                                ? palette.ai
                                                : palette.card
                                        }
                                        stroke={
                                            focused ? color : palette.border
                                        }
                                        strokeWidth={focused ? 2.3 : 1.1}
                                    />
                                    <rect
                                        x={-nodeW / 2 + 1}
                                        y={-nodeH / 2 + 1}
                                        width={nodeW - 2}
                                        height={nodeH - 2}
                                        rx={Math.max(0, radius - 1)}
                                        fill={color}
                                        fillOpacity={
                                            node.kind === "ai" ? ".09" : ".025"
                                        }
                                    />
                                    <path
                                        d={`M ${-nodeW / 2 + 12} ${-nodeH / 2 + 1} H ${nodeW / 2 - 12}`}
                                        stroke="#FFFFFF"
                                        strokeOpacity={light ? ".95" : ".16"}
                                        strokeWidth="1.5"
                                    />
                                    <rect
                                        x={-nodeW / 2}
                                        y={-nodeH / 2 + 16}
                                        width="3"
                                        height={nodeH - 32}
                                        rx="1.5"
                                        fill={color}
                                    />
                                    <rect
                                        x={-nodeW / 2 + 12}
                                        y="-21"
                                        width="42"
                                        height="42"
                                        rx="12"
                                        fill={color}
                                        fillOpacity={light ? ".12" : ".18"}
                                        stroke={color}
                                        strokeOpacity=".48"
                                    />
                                    <rect
                                        x={-nodeW / 2 + 16}
                                        y="-17"
                                        width="34"
                                        height="34"
                                        rx="10"
                                        fill={color}
                                        fillOpacity=".06"
                                    />
                                    <g
                                        transform={`translate(${-nodeW / 2 + 33} 0)`}
                                    >
                                        <Icon kind={node.kind} color={color} />
                                    </g>
                                    <text
                                        x={-nodeW / 2 + 64}
                                        y="-6"
                                        fill={fg}
                                        fontSize="12.5"
                                        fontWeight="750"
                                        letterSpacing="-.12"
                                    >
                                        {node.title.length > maxTitle
                                            ? node.title.slice(
                                                  0,
                                                  maxTitle - 1
                                              ) + "…"
                                            : node.title}
                                    </text>
                                    <text
                                        x={-nodeW / 2 + 64}
                                        y="13"
                                        fill={muted}
                                        fontSize="9.8"
                                    >
                                        {(node.subtitle || "").slice(0, 21)}
                                    </text>
                                    {node.kind === "ai" && (
                                        <>
                                            <circle
                                                cx={nodeW / 2 - 13}
                                                cy={nodeH / 2 - 12}
                                                r="3"
                                                fill={color}
                                            />
                                            <circle
                                                cx={nodeW / 2 - 13}
                                                cy={nodeH / 2 - 12}
                                                r="6"
                                                fill={color}
                                                fillOpacity=".12"
                                            />
                                        </>
                                    )}
                                    {p.showBadges && node.status && (
                                        <g
                                            transform={`translate(${nodeW / 2 - 55} ${-nodeH / 2 - 10})`}
                                        >
                                            <rect
                                                width="51"
                                                height="18"
                                                rx="9"
                                                fill={
                                                    light
                                                        ? "#FFFFFF"
                                                        : palette.card
                                                }
                                                stroke={color}
                                                strokeOpacity=".8"
                                            />
                                            <circle
                                                cx="9"
                                                cy="9"
                                                r="2.4"
                                                fill={color}
                                            />
                                            <text
                                                x="31"
                                                y="12"
                                                textAnchor="middle"
                                                fill={color}
                                                fontSize="7.6"
                                                fontWeight="800"
                                                letterSpacing=".2"
                                            >
                                                {node.status.slice(0, 7)}
                                            </text>
                                        </g>
                                    )}
                                    {p.interactive && !isCanvas && (
                                        <title>
                                            {node.title} —{" "}
                                            {node.subtitle || "Workflow node"}
                                        </title>
                                    )}
                                </g>
                            )
                        })}
                    </g>
                </g>

                {p.showFooter && (
                    <text
                        x={mobile ? 22 : 36}
                        y={logicalHeight - 33}
                        fill={muted}
                        opacity=".7"
                        fontSize="10"
                        letterSpacing="1.4"
                    >
                        FLOWARC · WORKFLOW VISUALIZATION
                    </text>
                )}

                {toolbarVisible && (
                    <g>
                        <rect
                            x={toolbarX}
                            y={logicalHeight - 67}
                            width={toolbarWidth}
                            height="43"
                            rx="12"
                            fill={light ? "#FFFFFF" : "#19253D"}
                            stroke={light ? "#D6DEED" : "#425173"}
                        />
                        {toolbarButton(
                            "Zoom out",
                            toolbarX + 6,
                            () => zoomBy(1 / 1.2),
                            "−"
                        )}
                        <text
                            x={toolbarX + 59}
                            y={logicalHeight - 40}
                            textAnchor="middle"
                            fill={muted}
                            fontSize="10"
                            style={{ cursor: "pointer" }}
                            onClick={fitAll}
                        >
                            {Math.round(zoom * 100)}%
                        </text>
                        {toolbarButton(
                            "Zoom in",
                            toolbarX + 77,
                            () => zoomBy(1.2),
                            "+"
                        )}
                        {toolbarButton(
                            "Fit all nodes",
                            toolbarX + 118,
                            fitAll,
                            "↺"
                        )}
                        {toolbarButton(
                            motion ? "Pause animation" : "Play animation",
                            toolbarX + 159,
                            () => setPlaying((v) => !v),
                            motion ? "Ⅱ" : "▶"
                        )}
                        {toolbarButton(
                            "Focus next node",
                            toolbarX + 200,
                            () =>
                                setFocusStep(
                                    (v) => (v + 1) % Math.max(1, nodes.length)
                                ),
                            "→"
                        )}
                    </g>
                )}

                {selectedNode &&
                    p.interactive &&
                    !isCanvas &&
                    wideDesktop &&
                    W >= 1050 && (
                        <g>
                            <rect
                                x={insetX - 5}
                                y={logicalHeight - 111}
                                width="280"
                                height="49"
                                rx="11"
                                fill={light ? "#FFFFFF" : "#18253F"}
                                stroke={light ? "#D6DEED" : "#425173"}
                            />
                            <text
                                x={insetX + 10}
                                y={logicalHeight - 92}
                                fill={fg}
                                fontSize="12"
                                fontWeight="750"
                            >
                                {selectedNode.title.slice(0, 30)}
                            </text>
                            <text
                                x={insetX + 10}
                                y={logicalHeight - 75}
                                fill={muted}
                                fontSize="10"
                            >
                                {(
                                    selectedNode.subtitle || "Selected node"
                                ).slice(0, 38)}
                            </text>
                            {safeURL(selectedNode.url) && (
                                <g
                                    data-flowarc-control="true"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Open ${selectedNode.title} in a new tab`}
                                    onClick={() => {
                                        const url = safeURL(selectedNode.url)
                                        if (
                                            url &&
                                            typeof window !== "undefined"
                                        ) {
                                            window.open(
                                                url,
                                                "_blank",
                                                "noopener,noreferrer"
                                            )
                                        }
                                    }}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key !== "Enter" &&
                                            event.key !== " "
                                        )
                                            return
                                        event.preventDefault()
                                        event.stopPropagation()
                                        const url = safeURL(selectedNode.url)
                                        if (
                                            url &&
                                            typeof window !== "undefined"
                                        ) {
                                            window.open(
                                                url,
                                                "_blank",
                                                "noopener,noreferrer"
                                            )
                                        }
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <title>{`Open ${selectedNode.title} in a new tab`}</title>
                                    <rect
                                        x={insetX + 213}
                                        y={logicalHeight - 102}
                                        width="50"
                                        height="28"
                                        rx="7"
                                        fill={p.accent}
                                        fillOpacity=".25"
                                    />
                                    <text
                                        x={insetX + 238}
                                        y={logicalHeight - 84}
                                        textAnchor="middle"
                                        fill={fg}
                                        fontSize="10"
                                        pointerEvents="none"
                                    >
                                        Open ↗
                                    </text>
                                </g>
                            )}
                        </g>
                    )}

                {p.showMinimap && wideDesktop && (
                    <g pointerEvents="none">
                        <rect
                            x={minimapX}
                            y="125"
                            width={minimapWidth}
                            height="70"
                            rx="9"
                            fill={light ? "#FFFFFF" : "#18233B"}
                            stroke={line}
                            opacity=".88"
                        />
                        <text
                            x={minimapX + 9}
                            y="140"
                            fontSize="9"
                            fill={muted}
                        >
                            OVERVIEW
                        </text>
                        {nodes.map((node) => {
                            const q = pos[node.id]
                            if (!q) return null
                            const k = Math.min(
                                88 / Math.max(1, bounds.maxX - bounds.minX),
                                40 / Math.max(1, bounds.maxY - bounds.minY)
                            )
                            return (
                                <circle
                                    key={node.id}
                                    cx={
                                        minimapX +
                                        58 +
                                        (q.x -
                                            (bounds.minX + bounds.maxX) / 2) *
                                            k
                                    }
                                    cy={
                                        166 +
                                        (q.y -
                                            (bounds.minY + bounds.maxY) / 2) *
                                            k
                                    }
                                    r="3"
                                    fill={
                                        node.kind === "ai"
                                            ? p.accent
                                            : p.signalColor
                                    }
                                />
                            )
                        })}
                    </g>
                )}
            </svg>

            {p.interactive && !isCanvas && (
                <div
                    aria-live="polite"
                    style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        overflow: "hidden",
                        clipPath: "inset(50%)",
                    }}
                >
                    {selectedNode ? `Selected ${selectedNode.title}` : ""}
                </div>
            )}
        </div>
    )
}

// Property controls

addPropertyControls(FlowArcNesting, {
    heightMode: {
        type: ControlType.Enum,
        title: "Height",
        options: ["fit", "fill"],
        optionTitles: ["Fit content", "Fill frame"],
        defaultValue: "fit",
    },
    responsive: {
        type: ControlType.Boolean,
        title: "Adaptive",
        defaultValue: true,
    },
    responsiveMode: {
        type: ControlType.Enum,
        title: "Breakpoint",
        options: ["auto", "desktop", "tablet", "mobile"],
        optionTitles: ["Automatic", "Desktop", "Tablet", "Mobile"],
        defaultValue: "auto",
        hidden: (p) => !p.responsive,
    },
    mobileCompact: {
        type: ControlType.Boolean,
        title: "Compact Mobile",
        defaultValue: true,
        hidden: (p) => !p.responsive,
    },
    preset: {
        type: ControlType.Enum,
        title: "Demo",
        options: ["custom", "ai", "integrations", "pipeline"],
        optionTitles: ["My Graph", "AI Workflow", "Integrations", "Pipeline"],
        defaultValue: "custom",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: defaults.title,
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: defaults.subtitle,
    },
    nodes: {
        type: ControlType.Array,
        title: "Nodes",
        maxCount: 30,
        hidden: (p) => p.preset !== "custom",
        control: {
            type: ControlType.Object,
            controls: {
                id: { type: ControlType.String, title: "Unique ID" },
                title: { type: ControlType.String, title: "Name" },
                subtitle: { type: ControlType.String, title: "Description" },
                kind: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: [
                        "ai",
                        "database",
                        "api",
                        "apps",
                        "alerts",
                        "cloud",
                        "payment",
                        "mail",
                        "chat",
                        "check",
                        "chart",
                    ],
                    optionTitles: [
                        "AI",
                        "Database",
                        "API",
                        "Apps",
                        "Alerts",
                        "Cloud",
                        "Payment",
                        "Email",
                        "Chat",
                        "Check",
                        "Analytics",
                    ],
                },
                status: { type: ControlType.String, title: "Status" },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    optional: true,
                },
                x: {
                    type: ControlType.Number,
                    title: "X · Freeform",
                    optional: true,
                },
                y: {
                    type: ControlType.Number,
                    title: "Y · Freeform",
                    optional: true,
                },
                url: { type: ControlType.Link, title: "Open URL" },
            },
        },
        defaultValue: aiNodes,
    },
    connections: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 60,
        hidden: (p) => p.preset !== "custom",
        control: {
            type: ControlType.Object,
            controls: {
                from: { type: ControlType.String, title: "From ID" },
                to: { type: ControlType.String, title: "To ID" },
                label: { type: ControlType.String, title: "Label" },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    optional: true,
                },
                dashed: {
                    type: ControlType.Boolean,
                    title: "Dashed",
                    defaultValue: false,
                },
            },
        },
        defaultValue: aiEdges,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["branch", "pipeline", "hub", "tree", "network", "freeform"],
        optionTitles: [
            "Branch",
            "Pipeline",
            "Hub",
            "Tree",
            "Network",
            "Freeform",
        ],
        defaultValue: "branch",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["cinematic", "obsidian", "aurora", "light", "paper"],
        optionTitles: [
            "Cinematic",
            "Obsidian",
            "Aurora",
            "Frost Light",
            "Warm Paper",
        ],
        defaultValue: "cinematic",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: defaults.accent,
    },
    signalColor: {
        type: ControlType.Color,
        title: "Signal",
        defaultValue: defaults.signalColor,
    },
    useCustomBackground: {
        type: ControlType.Boolean,
        title: "Custom BG",
        defaultValue: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: defaults.backgroundColor,
        hidden: (p) => !p.useCustomBackground,
    },
    connectionStyle: {
        type: ControlType.Enum,
        title: "Link Style",
        options: ["curved", "straight", "step"],
        optionTitles: ["Curved", "Straight", "Orthogonal"],
        defaultValue: "curved",
    },
    nodeSize: {
        type: ControlType.Number,
        title: "Node Scale",
        min: 0.7,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
    },
    density: {
        type: ControlType.Number,
        title: "Spacing",
        min: 0.7,
        max: 1.6,
        step: 0.05,
        defaultValue: 1,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 30,
        defaultValue: 14,
    },
    animated: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
    },
    particles: {
        type: ControlType.Boolean,
        title: "Particles",
        defaultValue: true,
        hidden: (p) => !p.animated,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.25,
        max: 3,
        step: 0.05,
        defaultValue: 1,
        hidden: (p) => !p.animated,
    },
    showGrid: { type: ControlType.Boolean, title: "Grid", defaultValue: true },
    showHeader: {
        type: ControlType.Boolean,
        title: "Header",
        defaultValue: true,
    },
    showFooter: {
        type: ControlType.Boolean,
        title: "Footer",
        defaultValue: false,
    },
    showBadges: {
        type: ControlType.Boolean,
        title: "Badges",
        defaultValue: true,
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Link Labels",
        defaultValue: false,
    },
    showMinimap: {
        type: ControlType.Boolean,
        title: "Minimap",
        defaultValue: false,
    },
    showToolbar: {
        type: ControlType.Boolean,
        title: "Toolbar",
        defaultValue: true,
    },
    interactive: {
        type: ControlType.Boolean,
        title: "Interactive",
        defaultValue: true,
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Drag Nodes",
        defaultValue: true,
        hidden: (p) => !p.interactive,
    },
})
