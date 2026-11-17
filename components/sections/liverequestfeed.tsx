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


interface RequestRow {
    id: number
    method: string
    path: string
    status: number
    latency: number
    region: string
}

const METHODS = [
    "GET",
    "POST",
    "POST",
    "POST",
    "PUT",
    "DELETE",
    "GET",
    "GET",
    "POST",
]
const STATUSES = [200, 200, 200, 200, 200, 201, 201, 400, 401, 404, 500]
const REGIONS = [
    "us-east",
    "eu-west",
    "ap-south",
    "us-west",
    "ap-east",
    "sa-east",
]

function methodColor(m: string, accent: string) {
    if (m === "GET") return { bg: "rgba(34,197,94,0.12)", text: "#4ade80" }
    if (m === "POST") return { bg: `${accent}22`, text: accent }
    if (m === "DELETE") return { bg: "rgba(239,68,68,0.12)", text: "#f87171" }
    if (m === "PUT") return { bg: "rgba(251,191,36,0.12)", text: "#fbbf24" }
    return { bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.6)" }
}

function statusColor(s: number) {
    if (s < 300) return "#4ade80"
    if (s < 400) return "#fbbf24"
    return "#f87171"
}

// Static snapshot rows shown when useIsStaticRenderer() returns true
const STATIC_ROWS: RequestRow[] = [
    {
        id: 1,
        method: "GET",
        path: "/api/health",
        status: 200,
        latency: 12,
        region: "us-east",
    },
    {
        id: 2,
        method: "POST",
        path: "/v1/inference",
        status: 201,
        latency: 38,
        region: "eu-west",
    },
    {
        id: 3,
        method: "GET",
        path: "/v1/embeddings",
        status: 200,
        latency: 22,
        region: "ap-south",
    },
    {
        id: 4,
        method: "POST",
        path: "/api/deploy",
        status: 200,
        latency: 54,
        region: "us-west",
    },
    {
        id: 5,
        method: "DELETE",
        path: "/api/logs",
        status: 200,
        latency: 17,
        region: "ap-east",
    },
    {
        id: 6,
        method: "PUT",
        path: "/api/scale",
        status: 200,
        latency: 29,
        region: "sa-east",
    },
    {
        id: 7,
        method: "GET",
        path: "/v1/completions",
        status: 200,
        latency: 44,
        region: "us-east",
    },
    {
        id: 8,
        method: "POST",
        path: "/api/auth/token",
        status: 401,
        latency: 9,
        region: "eu-west",
    },
    {
        id: 9,
        method: "GET",
        path: "/api/metrics",
        status: 200,
        latency: 31,
        region: "us-west",
    },
]

export default function LiveRequestFeed({
    width = 580,
    height = 420,
    accentColor = "#a3e635",
    bgColor = "#0a0a0a",
    titleBarBg = "#111111",
    titleBarText = "api.prism.ai — live requests",
    showTrafficLights = true,
    showFooter = true,
    showHeader = true,
    rowHeight = 34,
    fontSize = 12,
    spawnIntervalMs = 400,
    maxRows = 18,
    fontFamily = "'JetBrains Mono', monospace",
    customPaths = "/api/deploy\n/api/build\n/v1/models/run\n/api/ssl/provision\n/api/cdn/propagate\n/api/logs\n/v1/inference\n/api/scale\n/api/health\n/v1/embeddings\n/api/auth/token\n/v1/completions\n/api/metrics",
}: {
    width?: number
    height?: number
    accentColor?: string
    bgColor?: string
    titleBarBg?: string
    titleBarText?: string
    showTrafficLights?: boolean
    showFooter?: boolean
    showHeader?: boolean
    rowHeight?: number
    fontSize?: number
    spawnIntervalMs?: number
    maxRows?: number
    fontFamily?: string
    customPaths?: string
}) {
    // FIX 1: detect static rendering context (canvas preview, export, etc.)
    const isStatic = useIsStaticRenderer()

    const [rows, setRows] = useState<RequestRow[]>([])
    const [rps, setRps] = useState(0)
    const idRef = useRef(0)
    const recentTimesRef = useRef<number[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        // FIX 2: skip the timer loop entirely in static contexts
        if (!mounted || isStatic) return
        let timeoutId: ReturnType<typeof setTimeout>

        const paths = customPaths
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean)

        function spawnRow() {
            const method = METHODS[Math.floor(Math.random() * METHODS.length)]
            const path = paths[Math.floor(Math.random() * paths.length)]
            const status = STATUSES[Math.floor(Math.random() * STATUSES.length)]
            const latency = Math.floor(Math.random() * 120) + 8
            const region = REGIONS[Math.floor(Math.random() * REGIONS.length)]
            const id = ++idRef.current

            setRows((prev) =>
                [{ id, method, path, status, latency, region }, ...prev].slice(
                    0,
                    maxRows
                )
            )

            const now = Date.now()
            recentTimesRef.current.push(now)
            recentTimesRef.current = recentTimesRef.current.filter(
                (t) => now - t < 1000
            )
            setRps(recentTimesRef.current.length)

            const delay =
                Math.random() * spawnIntervalMs + spawnIntervalMs * 0.5
            timeoutId = setTimeout(spawnRow, delay)
        }

        spawnRow()
        return () => clearTimeout(timeoutId)
    }, [mounted, isStatic, spawnIntervalMs, maxRows, customPaths])

    const trafficLights = ["#ff5f57", "#febc2e", "#28c840"]
    const titleBarH = 34
    const headerH = showHeader ? 28 : 0
    const footerH = showFooter ? 32 : 0
    const feedH = height - titleBarH - headerH - footerH

    const showRegion = width >= 480
    const showLatency = width >= 380
    const gridCols = [
        "64px",
        "1fr",
        "64px",
        showLatency ? "72px" : null,
        showRegion ? "68px" : null,
    ]
        .filter(Boolean)
        .join(" ")
    const headerLabels = [
        "Method",
        "Endpoint",
        "Status",
        showLatency ? "Latency" : null,
        showRegion ? "Region" : null,
    ].filter(Boolean) as string[]

    const monoFont = fontFamily
    const labelFont = "'DM Sans', sans-serif"

    // In static mode, show the fixed snapshot rows instead of live data
    const displayRows = isStatic ? STATIC_ROWS.slice(0, maxRows) : rows

    return (
        <div
            style={{
                width,
                height,
                background: bgColor,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.07)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                fontFamily: monoFont,
            }}
        >
            {/* FIX 3: only inject animated keyframes in live (non-static) mode */}
            {!isStatic && (
                <style>{`
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateY(-6px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes livePulse {
                        0%, 100% { opacity: 1; }
                        50%       { opacity: 0.3; }
                    }
                `}</style>
            )}

            {/* Title bar */}
            <div
                style={{
                    background: titleBarBg,
                    height: titleBarH,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 14px",
                    gap: 6,
                    flexShrink: 0,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    position: "relative",
                }}
            >
                {showTrafficLights &&
                    trafficLights.map((c, i) => (
                        <div
                            key={i}
                            style={{
                                width: 11,
                                height: 11,
                                borderRadius: "50%",
                                background: c,
                                flexShrink: 0,
                            }}
                        />
                    ))}
                <span
                    style={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.18)",
                        letterSpacing: "0.06em",
                        fontFamily: labelFont,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                    }}
                >
                    {titleBarText}
                </span>
            </div>

            {/* Column headers */}
            {showHeader && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: gridCols,
                        padding: "0 16px",
                        height: headerH,
                        alignItems: "center",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        flexShrink: 0,
                    }}
                >
                    {headerLabels.map((h, i) => (
                        <span
                            key={i}
                            style={{
                                fontSize: 10,
                                color: "rgba(255,255,255,0.2)",
                                letterSpacing: "0.08em",
                                textTransform: "uppercase" as const,
                                fontFamily: labelFont,
                                paddingLeft: i === 1 ? 8 : 0,
                                textAlign:
                                    i >= 3
                                        ? ("right" as const)
                                        : ("left" as const),
                            }}
                        >
                            {h}
                        </span>
                    ))}
                </div>
            )}

            {/* Feed */}
            <div style={{ height: feedH, overflow: "hidden", flexShrink: 0 }}>
                {displayRows.map((row, idx) => {
                    const mc = methodColor(row.method, accentColor)
                    const sc = statusColor(row.status)
                    return (
                        <div
                            key={row.id}
                            style={{
                                display: "grid",
                                gridTemplateColumns: gridCols,
                                padding: `0 16px`,
                                height: rowHeight,
                                alignItems: "center",
                                borderBottom:
                                    "1px solid rgba(255,255,255,0.04)",
                                // Only animate in live mode
                                animation:
                                    !isStatic && idx === 0
                                        ? "slideIn 0.25s ease"
                                        : "none",
                                fontSize,
                            }}
                        >
                            {/* Method badge */}
                            <div>
                                <span
                                    style={{
                                        fontSize: fontSize - 1,
                                        fontWeight: 500,
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        background: mc.bg,
                                        color: mc.text,
                                        fontFamily: monoFont,
                                    }}
                                >
                                    {row.method}
                                </span>
                            </div>
                            {/* Path */}
                            <div
                                style={{
                                    color: "rgba(255,255,255,0.65)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    paddingLeft: 8,
                                    fontFamily: monoFont,
                                }}
                            >
                                {row.path}
                            </div>
                            {/* Status */}
                            <div style={{ color: sc, fontFamily: monoFont }}>
                                {row.status}
                            </div>
                            {/* Latency */}
                            {showLatency && (
                                <div
                                    style={{
                                        color: "rgba(255,255,255,0.4)",
                                        textAlign: "right" as const,
                                        fontFamily: monoFont,
                                    }}
                                >
                                    {row.latency}ms
                                </div>
                            )}
                            {/* Region */}
                            {showRegion && (
                                <div
                                    style={{
                                        fontSize: fontSize - 1,
                                        color: "rgba(255,255,255,0.22)",
                                        textAlign: "right" as const,
                                        fontFamily: labelFont,
                                    }}
                                >
                                    {row.region}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer */}
            {showFooter && (
                <div
                    style={{
                        height: footerH,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 16px",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <div
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#4ade80",
                                // Only pulse in live mode
                                animation: !isStatic
                                    ? "livePulse 1.5s ease-in-out infinite"
                                    : "none",
                            }}
                        />
                        <span
                            style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.3)",
                                fontFamily: labelFont,
                            }}
                        >
                            Live
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.3)",
                            fontFamily: monoFont,
                        }}
                    >
                        {isStatic ? "— req/s" : `${rps} req/s`}
                    </span>
                </div>
            )}
        </div>
    )
}

addPropertyControls(LiveRequestFeed, {
    // ─── Size ─────────────────────────────────────────────
    width: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 580,
        min: 320,
        max: 1000,
        step: 1,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 420,
        min: 200,
        max: 800,
        step: 1,
    },

    // ─── Colors ───────────────────────────────────────────
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#a3e635",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0a0a0a",
    },
    titleBarBg: {
        type: ControlType.Color,
        title: "Title Bar BG",
        defaultValue: "#111111",
    },

    // ─── Title Bar ────────────────────────────────────────
    titleBarText: {
        type: ControlType.String,
        title: "Title Bar Text",
        defaultValue: "api.prism.ai — live requests",
    },
    showTrafficLights: {
        type: ControlType.Boolean,
        title: "Traffic Lights",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    // ─── Layout ───────────────────────────────────────────
    showHeader: {
        type: ControlType.Boolean,
        title: "Column Headers",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showFooter: {
        type: ControlType.Boolean,
        title: "Footer",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    rowHeight: {
        type: ControlType.Number,
        title: "Row Height",
        defaultValue: 34,
        min: 24,
        max: 56,
        step: 2,
        displayStepper: true,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 12,
        min: 10,
        max: 16,
        step: 1,
        displayStepper: true,
    },
    maxRows: {
        type: ControlType.Number,
        title: "Max Rows",
        defaultValue: 18,
        min: 5,
        max: 40,
        step: 1,
        displayStepper: true,
    },

    // ─── Behavior ─────────────────────────────────────────
    spawnIntervalMs: {
        type: ControlType.Number,
        title: "Spawn Interval (ms)",
        defaultValue: 400,
        min: 100,
        max: 2000,
        step: 50,
        displayStepper: true,
    },

    // ─── Content ──────────────────────────────────────────
    customPaths: {
        type: ControlType.String,
        title: "API Paths",
        defaultValue:
            "/api/deploy\n/api/build\n/v1/models/run\n/api/ssl/provision\n/api/cdn/propagate\n/api/logs\n/v1/inference\n/api/scale\n/api/health\n/v1/embeddings\n/api/auth/token\n/v1/completions\n/api/metrics",
        displayTextArea: true,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "'JetBrains Mono', monospace",
    },
})
