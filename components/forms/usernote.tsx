// UserNote for Framer: a code component that shows a UserNote feedback board
// (https://getusernote.com) on a Framer site, as a floating Feedback button,
// the full board or the public roadmap. Paste into a Framer project:
// Assets → Code → + → New component, named UserNote.
//
// It loads the same widget as the script tag (https://getusernote.com/widget.js),
// which reads its options from data-* attributes on its own <script> element.
// The widget is served by UserNote (it talks to UserNote's API), so it isn't
// bundled here. On the Framer canvas this shows a placeholder; the widget runs
// in Preview and on the published site.
//
// Everything it adds lives inside this component's own element, except the
// floating Feedback button, which the widget tags with this instance's ID so
// cleanup removes only that one.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState } from "react"

const WIDGET_URL = "https://getusernote.com/widget.js"
const BOARD_ID = /^ws_[a-z0-9]{12}$/

type Mode = "button" | "board" | "roadmap"

interface Props {
    board: string
    mode: Mode
    position: "right" | "left"
    style?: React.CSSProperties
}

function instanceId() {
    return `framer-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 640
 */
export default function UserNote({ board, mode, position, style }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    const boardId = (board || "").trim().toLowerCase()
    const valid = BOARD_ID.test(boardId)
    const onCanvas = RenderTarget.current() === RenderTarget.canvas
    const inline = mode !== "button"
    // Which board and mode failed to load, so changing either tries again.
    const current = `${boardId} ${mode} ${position}`
    const [failedFor, setFailedFor] = useState<string | null>(null)
    const failed = failedFor === current

    useEffect(() => {
        const el = ref.current
        if (onCanvas || !valid || !el) return
        const id = instanceId()
        const script = document.createElement("script")
        script.src = WIDGET_URL
        script.async = true
        script.dataset.workspace = boardId
        script.dataset.instance = id
        if (inline) {
            el.id = id
            script.dataset.mode = "inline"
            script.dataset.target = `#${id}`
            if (mode === "roadmap") script.dataset.view = "roadmap"
        } else if (position === "left") {
            // Clear of Framer's "Made in Framer" badge, bottom right on free plans.
            script.dataset.position = "left"
        }

        let removed = false
        // The floating button's host, tagged by the widget with our ID.
        const removeOurButton = () =>
            document.querySelector(`div[data-usernote="${id}"]`)?.remove()
        script.addEventListener("load", () => {
            if (removed && !inline) removeOurButton()
        })
        script.addEventListener("error", () => {
            if (removed) return
            console.warn(
                `[UserNote] Couldn't load ${WIDGET_URL}. An ad or content blocker, a Content Security Policy or a network problem may be blocking it.`
            )
            setFailedFor(current)
        })
        el.appendChild(script)

        return () => {
            removed = true
            script.remove()
            if (inline) el.shadowRoot?.replaceChildren()
            else removeOurButton()
        }
    }, [boardId, mode, position, onCanvas, valid, inline, current])

    if (onCanvas || !valid) {
        return (
            <Placeholder
                mode={mode}
                position={position}
                valid={valid}
                style={style}
            />
        )
    }
    if (failed && inline) {
        return <LoadError boardId={boardId} mode={mode} style={style} />
    }
    // The button mode draws nothing in place: the widget adds its own
    // floating button to the page. The element still holds the script.
    if (!inline)
        return (
            <div
                ref={ref}
                style={{ ...style, width: 0, height: 0, overflow: "hidden" }}
            />
        )
    // key: a fresh element per mode, so a shadow root from one mode isn't reused.
    // With a fixed height the board fits it (header stays, the list scrolls);
    // with height set to Fit, 100% has nothing to resolve against and the
    // board grows with its ideas.
    return (
        <div
            key={mode}
            ref={ref}
            style={
                {
                    ...style,
                    overflow: "auto",
                    ["--un-max-height" as string]: "100%",
                } as React.CSSProperties
            }
        />
    )
}

const boxStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    boxSizing: "border-box",
    borderRadius: 12,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    color: "#312e81",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 13,
    lineHeight: 1.45,
    overflow: "hidden",
}

function LoadError({
    boardId,
    mode,
    style,
}: {
    boardId: string
    mode: Mode
    style?: React.CSSProperties
}) {
    const url = `https://getusernote.com/b/${boardId}${mode === "roadmap" ? "?view=roadmap" : ""}`
    return (
        <div style={{ ...style, ...boxStyle }}>
            <strong style={{ fontSize: 14 }}>
                The feedback board couldn’t load
            </strong>
            <span>
                Something blocked it, such as an ad blocker. You can{" "}
                <a
                    href={url}
                    target="_blank"
                    rel="noopener"
                    style={{ color: "inherit" }}
                >
                    open the board in a new tab
                </a>
                .
            </span>
        </div>
    )
}

// What the canvas shows: a static preview drawn like the real widget, so the
// layout looks right while designing, plus a note on what to do next.
const SAMPLE = [
    { title: "Dark mode", votes: 131, status: "In progress" },
    { title: "Slack notifications", votes: 89, status: "Planned" },
    { title: "Export to PDF", votes: 66, status: "Planned" },
    { title: "CSV export", votes: 54, status: "Completed" },
]
const STATUS_COLOR: Record<string, string> = {
    Planned: "#2563eb",
    "In progress": "#d97706",
    Completed: "#059669",
}
const font =
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

function Placeholder({
    mode,
    position,
    valid,
    style,
}: {
    mode: Mode
    position: Props["position"]
    valid: boolean
    style?: React.CSSProperties
}) {
    const note = !valid
        ? "Paste your board ID (it starts with ws_) in the properties panel. Find it on your board’s Install tab at getusernote.com."
        : mode === "button"
          ? `The Feedback button appears in the bottom ${position === "left" ? "left" : "right"} corner of every page in Preview and on your published site.`
          : "Your live board appears here in Preview and on your published site."
    const hint = (
        <div
            style={{
                margin: mode === "button" ? 0 : "auto 12px 12px",
                padding: "8px 10px",
                borderRadius: 8,
                background: valid ? "#eef2ff" : "#fff7ed",
                color: valid ? "#3730a3" : "#9a3412",
                fontSize: 12,
                lineHeight: 1.4,
            }}
        >
            {note}
        </div>
    )
    if (mode === "button") {
        return (
            <div
                style={{
                    ...style,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: position === "left" ? "flex-start" : "flex-end",
                    justifyContent: "flex-end",
                    gap: 8,
                    fontFamily: font,
                }}
            >
                {hint}
                <span
                    style={{
                        borderRadius: 999,
                        padding: "10px 16px",
                        background: "#4f46e5",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        boxShadow: "0 6px 20px rgba(15,23,42,.25)",
                    }}
                >
                    Feedback
                </span>
            </div>
        )
    }
    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxSizing: "border-box",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                background: "#fff",
                color: "#0f172a",
                fontFamily: font,
                fontSize: 13,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "14px 16px",
                    borderBottom: "1px solid #e2e8f0",
                }}
            >
                <strong style={{ flex: 1, fontSize: 15 }}>Your product</strong>
                <span
                    style={{
                        borderRadius: 8,
                        padding: "6px 10px",
                        background: "#4f46e5",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 12,
                    }}
                >
                    Suggest idea
                </span>
            </div>
            {mode === "roadmap" ? <SampleRoadmap /> : <SampleIdeas />}
            {hint}
        </div>
    )
}

function Votes({ n, small }: { n: number; small?: boolean }) {
    return (
        <span
            style={{
                flex: "none",
                width: small ? 34 : 40,
                height: small ? 36 : 44,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontWeight: 650,
                fontSize: small ? 11 : 12,
            }}
        >
            <span style={{ fontSize: 9, color: "#4f46e5" }}>▲</span>
            {n}
        </span>
    )
}

function SampleIdeas() {
    return (
        <div style={{ padding: "4px 16px", overflow: "hidden" }}>
            {SAMPLE.map((idea, i) => (
                <div
                    key={idea.title}
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        padding: "10px 0",
                        borderTop: i ? "1px solid #e2e8f0" : 0,
                    }}
                >
                    <Votes n={idea.votes} />
                    <div>
                        <div style={{ fontWeight: 600 }}>{idea.title}</div>
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: STATUS_COLOR[idea.status],
                            }}
                        >
                            {idea.status}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

function SampleRoadmap() {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                alignItems: "start",
                gap: 10,
                padding: 12,
                overflow: "hidden",
            }}
        >
            {["Planned", "In progress", "Completed"].map((status) => (
                <div
                    key={status}
                    style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: 8,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 650,
                            margin: "2px 2px 8px",
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 999,
                                background: STATUS_COLOR[status],
                            }}
                        />
                        {status}
                    </div>
                    {SAMPLE.filter((idea) => idea.status === status).map(
                        (idea) => (
                            <div
                                key={idea.title}
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                    padding: 6,
                                    marginBottom: 6,
                                    border: "1px solid #e2e8f0",
                                    borderRadius: 8,
                                    background: "#fff",
                                }}
                            >
                                <Votes n={idea.votes} small />
                                <span style={{ fontWeight: 600, fontSize: 12 }}>
                                    {idea.title}
                                </span>
                            </div>
                        )
                    )}
                </div>
            ))}
        </div>
    )
}

UserNote.defaultProps = {
    board: "",
    mode: "button",
    position: "right",
}

addPropertyControls(UserNote, {
    board: {
        type: ControlType.String,
        title: "Board ID",
        placeholder: "ws_xxxxxxxxxxxx",
        description: "From your board’s Install tab at getusernote.com.",
    },
    mode: {
        type: ControlType.Enum,
        title: "Show",
        options: ["button", "board", "roadmap"],
        optionTitles: ["Feedback button", "Board", "Roadmap"],
        defaultValue: "button",
    },
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["right", "left"],
        optionTitles: ["Bottom right", "Bottom left"],
        defaultValue: "right",
        description: "Bottom left keeps it clear of the Made in Framer badge.",
        hidden: (props: Props) => props.mode !== "button",
    },
})
