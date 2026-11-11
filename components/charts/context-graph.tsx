import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const SANS = "'Inter Tight', system-ui, sans-serif"
const W = 1000,
    H = 850

const SLOTS = [
    {
        key: "standards",
        name: "Standards",
        x: 0.23,
        y: 0.15,
        text: "Codes and specifications the work must meet.",
    },
    {
        key: "procedures",
        name: "Procedures",
        x: 0.6,
        y: 0.29,
        text: "Standard methods the work follows.",
    },
    {
        key: "precedents",
        name: "Precedents",
        x: 0.11,
        y: 0.38,
        text: "Prior decisions and cases cited as reference.",
    },
    {
        key: "agents",
        name: "Agents",
        x: 0.25,
        y: 0.43,
        text: "Automations that run under expert supervision.",
    },
    {
        key: "drawings",
        name: "Drawings",
        x: 0.76,
        y: 0.5,
        text: "Design documents attached to the project.",
    },
    {
        key: "experts",
        name: "Experts",
        x: 0.45,
        y: 0.53,
        text: "Senior people whose judgment is captured.",
    },
    {
        key: "workflow",
        name: "Workflow",
        x: 0.23,
        y: 0.71,
        hub: true,
        text: "A repeatable process that produces decisions.",
    },
    {
        key: "project",
        name: "Project",
        x: 0.62,
        y: 0.67,
        hub: true,
        text: "The job under management — its files, people and decisions.",
    },
    {
        key: "decisions",
        name: "Decisions",
        x: 0.47,
        y: 0.85,
        text: "Recorded calls, with the reasoning behind them.",
    },
    {
        key: "emails",
        name: "E-mails",
        x: 0.8,
        y: 0.83,
        text: "Correspondence received into the project.",
    },
]
const EDGES = [
    { from: "standards", to: "precedents", label: "cited by" },
    { from: "standards", to: "procedures", label: "enforced by" },
    { from: "standards", to: "agents", label: "grounded in" },
    { from: "agents", to: "experts", label: "supervises" },
    { from: "agents", to: "workflow", label: "invokes" },
    { from: "precedents", to: "workflow", label: "references" },
    { from: "procedures", to: "project", label: "followed on" },
    { from: "drawings", to: "project", label: "attaches" },
    { from: "experts", to: "project", label: "staffs" },
    { from: "workflow", to: "project", label: "belongs to" },
    { from: "experts", to: "decisions", label: "authors" },
    { from: "workflow", to: "decisions", label: "produces" },
    { from: "project", to: "emails", label: "receives" },
]

/**
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 850
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ContextGraph(props: any) {
    const {
        background = "#FAFAF7",
        hubColor = "#0B0B0C",
        hubText = "#FFFFFF",
        nodeFill = "#FFFFFF",
        nodeStroke = "#DADDE0",
        nodeLabel = "#0B0B0C",
        edgeColor = "#D7DADE",
        edgeLabel = "#9AA0A6",
        lineWidth = 0.8,
        edgeSize = 16,
        cardBg = "#FFFFFF",
        cardTitle = "#0B0B0C",
        cardText = "#55606B",
        rHub = 34,
        rNode = 22,
        physics = true,
        charge = 1800,
        spring = 0.02,
        edges: edgeData = EDGES,
        style,
    } = props

    const meta: any = {}
    SLOTS.forEach((s) => {
        meta[s.key] = {
            name: props[`name_${s.key}`] ?? s.name,
            text: props[`text_${s.key}`] ?? s.text,
            hub: s.hub,
        }
    })

    const isStatic = useIsStaticRenderer()
    const wrapRef = useRef<any>(null)
    const nodesRef = useRef<any[]>([])
    const restRef = useRef<number[]>([])
    const dragRef = useRef<number | null>(null)
    const rectRef = useRef({ w: W, h: H })
    const [, setTick] = useState(0)
    const [hover, setHover] = useState<number | null>(null)

    if (nodesRef.current.length !== SLOTS.length) {
        nodesRef.current = SLOTS.map((s) => ({
            key: s.key,
            hub: s.hub,
            x: s.x * W,
            y: s.y * H,
            vx: 0,
            vy: 0,
        }))
        const by: any = {}
        nodesRef.current.forEach((p) => (by[p.key] = p))
        restRef.current = edgeData.map((e: any) => {
            const a = by[e.from],
                b = by[e.to]
            return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 150
        })
    }

    useEffect(() => {
        const el = wrapRef.current
        if (!el) return
        const ro = new ResizeObserver(() => {
            const b = el.getBoundingClientRect()
            rectRef.current = { w: b.width, h: b.height || b.width * (H / W) }
            setTick((t) => t + 1)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (isStatic) return
        let raf: number
        const step = () => {
            const N = nodesRef.current
            if (N.length) {
                const by: any = {}
                N.forEach((p) => (by[p.key] = p))
                N.forEach((n) => {
                    ;(n as any).fx = 0
                    ;(n as any).fy = 0
                })
                if (physics) {
                    for (let i = 0; i < N.length; i++)
                        for (let j = i + 1; j < N.length; j++) {
                            const a = N[i],
                                b = N[j]
                            let dx = a.x - b.x,
                                dy = a.y - b.y
                            let d = Math.hypot(dx, dy) || 1
                            const f = charge / (d * d)
                            const ux = dx / d,
                                uy = dy / d
                            ;(a as any).fx += ux * f
                            ;(a as any).fy += uy * f
                            ;(b as any).fx -= ux * f
                            ;(b as any).fy -= uy * f
                        }
                    edgeData.forEach((e: any, k: number) => {
                        const a = by[e.from],
                            b = by[e.to]
                        if (!a || !b) return
                        let dx = b.x - a.x,
                            dy = b.y - a.y
                        let d = Math.hypot(dx, dy) || 1
                        const f = spring * (d - (restRef.current[k] || 150))
                        const ux = dx / d,
                            uy = dy / d
                        ;(a as any).fx += ux * f
                        ;(a as any).fy += uy * f
                        ;(b as any).fx -= ux * f
                        ;(b as any).fy -= uy * f
                    })
                }
                N.forEach((n, i) => {
                    if (dragRef.current === i) {
                        n.vx = 0
                        n.vy = 0
                        return
                    }
                    n.vx = (n.vx + (n as any).fx) * 0.85
                    n.vy = (n.vy + (n as any).fy) * 0.85
                    n.vx = Math.max(-12, Math.min(12, n.vx))
                    n.vy = Math.max(-12, Math.min(12, n.vy))
                    n.x += n.vx
                    n.y += n.vy
                    const r = n.hub ? rHub : rNode,
                        pad = r + 6
                    n.x = Math.max(pad, Math.min(W - pad, n.x))
                    n.y = Math.max(pad, Math.min(H - pad, n.y))
                })
                setTick((t) => t + 1)
            }
            raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [isStatic, physics, charge, spring, edgeData, rHub, rNode])

    const toLogical = (e: any) => {
        const b = wrapRef.current.getBoundingClientRect()
        return {
            x: (e.clientX - b.left) * (W / b.width),
            y: (e.clientY - b.top) * (H / (b.height || b.width * (H / W))),
        }
    }
    const nodeAt = (p: any) => {
        const N = nodesRef.current
        for (let i = 0; i < N.length; i++) {
            const r = (N[i].hub ? rHub : rNode) + 6
            if (Math.hypot(N[i].x - p.x, N[i].y - p.y) <= r) return i
        }
        return null
    }
    const onDown = (e: any) => {
        const p = toLogical(e)
        const i = nodeAt(p)
        if (i == null) return
        e.preventDefault()
        dragRef.current = i
        setHover(i)
        const n = nodesRef.current[i]
        if (n) {
            n.x = p.x
            n.y = p.y
        }
    }
    const onHover = (e: any) => {
        if (dragRef.current != null) return
        setHover(nodeAt(toLogical(e)))
    }
    useEffect(() => {
        const move = (e: any) => {
            if (dragRef.current == null) return
            const p = toLogical(e)
            const n = nodesRef.current[dragRef.current]
            if (n) {
                n.x = p.x
                n.y = p.y
                n.vx = 0
                n.vy = 0
                setTick((t) => t + 1)
            }
        }
        const up = () => {
            dragRef.current = null
        }
        window.addEventListener("pointermove", move)
        window.addEventListener("pointerup", up)
        return () => {
            window.removeEventListener("pointermove", move)
            window.removeEventListener("pointerup", up)
        }
    }, [])

    const N = nodesRef.current
    const by: any = {}
    N.forEach((p) => (by[p.key] = p))
    const halo = {
        paintOrder: "stroke",
        stroke: background,
        strokeWidth: 6,
        strokeLinejoin: "round",
    } as any
    const rect = rectRef.current,
        sx = rect.w / W,
        sy = rect.h / H
    const hp = hover != null ? N[hover] : null
    const hr = hp ? (hp.hub ? rHub : rNode) : 0
    const flip = hp ? hp.x > W * 0.58 : false
    const cardW = Math.min(240, rect.w - 24)

    return (
        <div
            ref={wrapRef}
            onPointerDown={onDown}
            onPointerMove={onHover}
            onPointerLeave={() => setHover(null)}
            style={{
                position: "relative",
                width: "100%",
                aspectRatio: `${W} / ${H}`,
                background,
                fontFamily: SANS,
                touchAction: "none",
                cursor: hover != null ? "grab" : "default",
                ...style,
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ display: "block" }}
            >
                {edgeData.map((e: any, i: number) => {
                    const a = by[e.from],
                        b = by[e.to]
                    if (!a || !b) return null
                    return (
                        <g key={"e" + i}>
                            <line
                                x1={a.x}
                                y1={a.y}
                                x2={b.x}
                                y2={b.y}
                                stroke={edgeColor}
                                strokeWidth={lineWidth}
                            />
                            {e.label ? (
                                <text
                                    x={(a.x + b.x) / 2}
                                    y={(a.y + b.y) / 2}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={edgeSize}
                                    fill={edgeLabel}
                                    style={halo}
                                >
                                    {e.label}
                                </text>
                            ) : null}
                        </g>
                    )
                })}
                {N.map((p, i) => (
                    <g key={"n" + i}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={p.hub ? rHub : rNode}
                            fill={p.hub ? hubColor : nodeFill}
                            stroke={
                                hover === i
                                    ? hubColor
                                    : p.hub
                                      ? hubColor
                                      : nodeStroke
                            }
                            strokeWidth={hover === i ? 2.5 : 1.5}
                        />
                        {p.hub ? (
                            <text
                                x={p.x}
                                y={p.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="15"
                                fontWeight="600"
                                fill={hubText}
                                style={{ pointerEvents: "none" }}
                            >
                                {meta[p.key].name}
                            </text>
                        ) : (
                            <text
                                x={p.x}
                                y={p.y - rNode - 10}
                                textAnchor="middle"
                                fontSize="19"
                                fontWeight="700"
                                fill={nodeLabel}
                                style={{ ...halo, pointerEvents: "none" }}
                            >
                                {meta[p.key].name}
                            </text>
                        )}
                    </g>
                ))}
            </svg>

            {hp ? (
                <div
                    style={{
                        position: "absolute",
                        top: hp.y * sy,
                        left: flip
                            ? hp.x * sx - hr * sx - 12
                            : hp.x * sx + hr * sx + 12,
                        transform: flip
                            ? "translate(-100%, -50%)"
                            : "translate(0, -50%)",
                        width: cardW,
                        background: cardBg,
                        borderRadius: 12,
                        padding: "13px 15px",
                        boxShadow: "0 18px 44px rgba(17,20,24,.16)",
                        border: "1px solid rgba(17,20,24,.07)",
                        pointerEvents: "none",
                        zIndex: 5,
                    }}
                >
                    <div
                        style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: cardTitle,
                            marginBottom: 5,
                        }}
                    >
                        {meta[hp.key].name}
                    </div>
                    <div
                        style={{
                            fontSize: 13.5,
                            lineHeight: 1.45,
                            color: cardText,
                        }}
                    >
                        {meta[hp.key].text || "—"}
                    </div>
                </div>
            ) : null}
        </div>
    )
}

const nameCtrls: any = {},
    textCtrls: any = {}
SLOTS.forEach((s) => {
    nameCtrls[`name_${s.key}`] = {
        type: ControlType.String,
        title: `${s.name} · name`,
        defaultValue: s.name,
    }
    textCtrls[`text_${s.key}`] = {
        type: ControlType.String,
        title: `${s.name} · card`,
        displayTextArea: true,
        defaultValue: s.text,
    }
})

addPropertyControls(ContextGraph, {
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FAFAF7",
    },
    hubColor: {
        type: ControlType.Color,
        title: "Hub fill",
        defaultValue: "#0B0B0C",
    },
    hubText: {
        type: ControlType.Color,
        title: "Hub text",
        defaultValue: "#FFFFFF",
    },
    nodeFill: {
        type: ControlType.Color,
        title: "Node fill",
        defaultValue: "#FFFFFF",
    },
    nodeStroke: {
        type: ControlType.Color,
        title: "Node stroke",
        defaultValue: "#DADDE0",
    },
    nodeLabel: {
        type: ControlType.Color,
        title: "Node label",
        defaultValue: "#0B0B0C",
    },
    edgeColor: {
        type: ControlType.Color,
        title: "Edge line",
        defaultValue: "#D7DADE",
    },
    edgeLabel: {
        type: ControlType.Color,
        title: "Edge label",
        defaultValue: "#9AA0A6",
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line width",
        min: 0.25,
        max: 4,
        step: 0.25,
        defaultValue: 0.8,
    },
    edgeSize: {
        type: ControlType.Number,
        title: "Edge text size",
        min: 8,
        max: 30,
        step: 1,
        defaultValue: 16,
    },
    cardBg: {
        type: ControlType.Color,
        title: "Card bg",
        defaultValue: "#FFFFFF",
    },
    cardTitle: {
        type: ControlType.Color,
        title: "Card title color",
        defaultValue: "#0B0B0C",
    },
    cardText: {
        type: ControlType.Color,
        title: "Card text color",
        defaultValue: "#55606B",
    },
    rHub: {
        type: ControlType.Number,
        title: "Hub size",
        min: 20,
        max: 100,
        step: 2,
        defaultValue: 34,
    },
    rNode: {
        type: ControlType.Number,
        title: "Node size",
        min: 14,
        max: 80,
        step: 2,
        defaultValue: 22,
    },
    physics: {
        type: ControlType.Boolean,
        title: "Physics",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    charge: {
        type: ControlType.Number,
        title: "Repulsion",
        min: 0,
        max: 8000,
        step: 250,
        defaultValue: 1800,
    },
    spring: {
        type: ControlType.Number,
        title: "Link spring",
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.02,
    },
    ...nameCtrls,
    ...textCtrls,
    edges: {
        type: ControlType.Array,
        title: "Edges",
        control: {
            type: ControlType.Object,
            controls: {
                from: { type: ControlType.String, defaultValue: "A" },
                to: { type: ControlType.String, defaultValue: "B" },
                label: { type: ControlType.String, defaultValue: "" },
            },
        },
        defaultValue: EDGES,
    },
})
