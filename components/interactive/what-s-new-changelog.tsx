// // ReleaseBadge: free "What's New" changelog widget. Get a Project Key at releasebadge.com

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


const API_BASE = "https://releasebadge.com"

type Entry = {
    id: string
    title: string
    version?: string
    category?: string
    content?: string
    publishedAt?: string
}

const SAMPLE: Entry[] = [
    {
        id: "s1",
        title: "Faster dashboard",
        version: "v1.2.0",
        category: "Performance",
        content: "Pages now load twice as fast.",
        publishedAt: new Date().toISOString(),
    },
    {
        id: "s2",
        title: "Dark mode is here",
        version: "v1.1.0",
        category: "Feature",
        content: "Switch themes from settings.",
        publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
]

function fmtDate(d?: string) {
    if (!d) return ""
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return ""
    return dt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ReleaseBadgeWidget(props: any) {
    const {
        projectKey,
        label,
        showCount,
        showDot,
        dotColor,
        buttonColor,
        buttonTextColor,
        radius,
        theme,
        panelAlign,
        panelDirection,
        panelWidth,
        previewOpen,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [open, setOpen] = React.useState(false)
    const [entries, setEntries] = React.useState<Entry[]>(
        isCanvas ? SAMPLE : []
    )
    const [error, setError] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [showBadge, setShowBadge] = React.useState(true)
    const [seen, setSeen] = React.useState(false)
    const isOpen = open || (isCanvas && previewOpen)

    const dark = theme === "dark"
    const bg = dark ? "#18181b" : "#ffffff"
    const fg = dark ? "#f4f4f5" : "#18181b"
    const muted = dark ? "#a1a1aa" : "#71717a"
    const border = dark ? "#27272a" : "#e4e4e7"

    React.useEffect(() => {
        if (isCanvas) return
        if (!projectKey) {
            setError(
                "select the button and then Add your Project Key in the right-hand panel."
            )
            return
        }
        let cancelled = false
        setLoading(true)
        setError("")
        fetch(
            `${API_BASE}/api/v1/changelog?projectKey=${encodeURIComponent(projectKey)}`
        )
            .then(async (res) => {
                const data = await res.json().catch(() => null)
                if (cancelled) return
                if (res.status === 402)
                    setError(
                        "This changelog has reached its free monthly view limit."
                    )
                else if (res.status === 403)
                    setError(
                        "This site is not authorized for this Project Key. Add it under Authorized Domains in your dashboard."
                    )
                else if (res.status === 404) setError("Invalid Project Key.")
                else if (!res.ok || !Array.isArray(data))
                    setError("Updates are temporarily unavailable.")
                else setEntries(data)
            })
            .catch(
                () =>
                    !cancelled &&
                    setError("Updates are temporarily unavailable.")
            )
            .finally(() => !cancelled && setLoading(false))

        fetch(
            `${API_BASE}/api/v1/badge-status?projectKey=${encodeURIComponent(projectKey)}`
        )
            .then((r) => r.json())
            .then((d) => !cancelled && setShowBadge(d.plan !== "pro"))
            .catch(() => {})
        return () => {
            cancelled = true
        }
    }, [projectKey, isCanvas])

    // const toggle = () => {
    //     const next = !open
    //     setOpen(next)
    //     if (next && !seen) {
    //         setSeen(true)
    //         if (!isCanvas && projectKey) {
    //             fetch(`${API_BASE}/api/v1/track`, {
    //                 method: "POST",
    //                 headers: { "Content-Type": "application/json" },
    //                 body: JSON.stringify({ projectKey }),
    //             }).catch(() => {})
    //         }
    //     }
    // }

    const toggle = () => {
        const next = !open
        setOpen(next)
        if (next && !seen) setSeen(true)
    }

    const panelStyle: React.CSSProperties = {
        position: "absolute",
        [panelDirection === "up" ? "bottom" : "top"]: "calc(100% + 8px)",
        [panelAlign === "right" ? "right" : "left"]: 0,
        width: panelWidth,
        maxHeight: 420,
        overflowY: "auto",
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        padding: 16,
        zIndex: 9999,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 14,
        textAlign: "left",
    }

    return (
        <div
            style={{
                position: "relative",
                display: "inline-block",
                fontFamily: "Inter, system-ui, sans-serif",
            }}
        >
            <button
                onClick={toggle}
                style={{
                    background: buttonColor,
                    color: buttonTextColor,
                    border: "none",
                    borderRadius: radius,
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    position: "relative",
                }}
            >
                {label}
                {showCount && entries.length > 0 && (
                    <span
                        style={{
                            background: "rgba(255,255,255,0.25)",
                            borderRadius: 999,
                            padding: "1px 8px",
                            fontSize: 12,
                        }}
                    >
                        {entries.length}
                    </span>
                )}
                {showDot && !seen && entries.length > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: -3,
                            right: -3,
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: dotColor,
                            border: `2px solid ${bg}`,
                        }}
                    />
                )}
            </button>

            {isOpen && (
                <div style={panelStyle}>
                    {loading && <div style={{ color: muted }}>Loading…</div>}
                    {!loading && error && (
                        <div style={{ color: muted }}>{error}</div>
                    )}
                    {!loading && !error && entries.length === 0 && (
                        <div style={{ color: muted }}>No updates yet.</div>
                    )}
                    {!loading &&
                        !error &&
                        entries.map((e, i) => (
                            <div
                                key={e.id}
                                style={{
                                    paddingBottom: 12,
                                    marginBottom: 12,
                                    borderBottom:
                                        i === entries.length - 1
                                            ? "none"
                                            : `1px solid ${border}`,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        alignItems: "center",
                                        fontSize: 12,
                                        color: muted,
                                    }}
                                >
                                    {e.version && (
                                        <span style={{ fontWeight: 600 }}>
                                            {e.version}
                                        </span>
                                    )}
                                    {e.category && <span>· {e.category}</span>}
                                    <span style={{ marginLeft: "auto" }}>
                                        {fmtDate(e.publishedAt)}
                                    </span>
                                </div>
                                <div
                                    style={{ fontWeight: 600, margin: "4px 0" }}
                                >
                                    {e.title}
                                </div>
                                {e.content && (
                                    <div
                                        style={{
                                            color: muted,
                                            whiteSpace: "pre-wrap",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {e.content}
                                    </div>
                                )}
                            </div>
                        ))}
                    {showBadge && (
                        <a
                            href="https://releasebadge.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "block",
                                textAlign: "center",
                                fontSize: 11,
                                color: muted,
                                textDecoration: "none",
                                marginTop: 4,
                            }}
                        >
                            Powered by ReleaseBadge
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}

ReleaseBadgeWidget.defaultProps = {
    projectKey: "",
    label: "What's New",
    showCount: true,
    showDot: true,
    dotColor: "#ef4444",
    buttonColor: "#4f46e5",
    buttonTextColor: "#ffffff",
    radius: 10,
    theme: "light",
    panelAlign: "left",
    panelDirection: "down",
    panelWidth: 340,
    previewOpen: false,
}

addPropertyControls(ReleaseBadgeWidget, {
    projectKey: {
        type: ControlType.String,
        title: "Project Key",
        placeholder: "paste from dashboard",
    },
    label: { type: ControlType.String, title: "Button Text" },
    showCount: { type: ControlType.Boolean, title: "Show Count" },
    showDot: { type: ControlType.Boolean, title: "Unread Dot" },
    dotColor: { type: ControlType.Color, title: "Dot Color" },
    buttonColor: { type: ControlType.Color, title: "Button" },
    buttonTextColor: { type: ControlType.Color, title: "Text" },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 40 },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
    },
    panelAlign: {
        type: ControlType.Enum,
        title: "Panel Align",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
    },
    panelDirection: {
        type: ControlType.Enum,
        title: "Opens",
        options: ["down", "up"],
        optionTitles: ["Down", "Up"],
    },
    panelWidth: {
        type: ControlType.Number,
        title: "Panel Width",
        min: 260,
        max: 520,
    },
    previewOpen: {
        type: ControlType.Boolean,
        title: "Show Panel (canvas)",
        hidden: () => false,
    },
})
