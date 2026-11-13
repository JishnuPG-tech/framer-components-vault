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


// Shows a LaunchList form, updates feed or widget through our embed, so it looks exactly as
// designed in LaunchList. The loader also tracks referrals across every page of the site.
export const LOADER_URL = "https://embed.getlaunchlist.com/v1/embed.js"

type Show = "form" | "updates" | "widget"
type Widget = "counter" | "leaderboard" | "milestone" | "countdown"
interface LaunchListApi {
    mount(el: Element, options: { form: string; fresh?: boolean }): void
    updates(el: Element, options: { project: string }): void
    widget(el: Element, options: { project: string; widget: string }): void
}
type LaunchListWindow = Window & { LaunchList?: LaunchListApi }

let loading: Promise<LaunchListApi> | null = null

/** Adds the loader script once per document and resolves with its API. */
export function loadLaunchList(): Promise<LaunchListApi> {
    const win = window as LaunchListWindow
    if (win.LaunchList) return Promise.resolve(win.LaunchList)
    loading ??= new Promise((resolve, reject) => {
        let script = document.querySelector<HTMLScriptElement>(
            `script[src="${LOADER_URL}"]`
        )
        if (!script) {
            script = document.createElement("script")
            script.src = LOADER_URL
            script.async = true
            document.head.appendChild(script)
        }
        script.addEventListener("load", () =>
            win.LaunchList
                ? resolve(win.LaunchList)
                : reject(new Error("No API"))
        )
        script.addEventListener("error", () => {
            loading = null
            reject(new Error("LaunchList could not load"))
        })
    })
    return loading
}

export interface LaunchListProps {
    show?: Show
    formId?: string
    project?: string
    widget?: Widget
    style?: React.CSSProperties
}

const note: React.CSSProperties = {
    padding: 16,
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 14,
    color: "#71717a",
    textAlign: "center",
}

/**
 * A new instance starts 480px wide: at Fit width the embed has no content width and collapses,
 * and below 448px a LaunchList form puts its button under the last field.
 * @framerIntrinsicWidth 480
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function LaunchList(props: LaunchListProps) {
    const { show = "form", widget = "counter", style } = props
    const key = ((show === "form" ? props.formId : props.project) ?? "").trim()
    const target = `${show}:${key}:${show === "widget" ? widget : ""}`
    const ref = React.useRef<HTMLDivElement>(null)
    const [failed, setFailed] = React.useState("")

    React.useEffect(() => {
        const el = ref.current
        if (!key || !el) return
        let live = true
        loadLaunchList().then(
            (api) => {
                if (!live) return
                // The canvas stays open for hours: fetch the form each time so LaunchList edits show.
                const fresh = RenderTarget.current() === RenderTarget.canvas
                if (show === "form")
                    api.mount(el, fresh ? { form: key, fresh } : { form: key })
                else if (show === "updates") api.updates(el, { project: key })
                else api.widget(el, { project: key, widget })
            },
            () => live && setFailed(target)
        )
        return () => {
            live = false
        }
    }, [show, key, widget, target])

    let body: React.ReactNode
    if (!key)
        body = (
            <div style={note}>
                {show === "form" ? "Add a form ID" : "Add your project"}
            </div>
        )
    else if (failed === target)
        body = <div style={note}>LaunchList could not load.</div>
    // A shadow root attaches once per element, so every new target gets a fresh one.
    else body = <div key={target} ref={ref} />

    return <div style={{ width: "100%", ...style }}>{body}</div>
}

addPropertyControls(LaunchList, {
    show: {
        type: ControlType.Enum,
        title: "Show",
        options: ["form", "updates", "widget"],
        optionTitles: ["Form", "Updates", "Widget"],
        defaultValue: "form",
    },
    formId: {
        type: ControlType.String,
        title: "Form ID",
        placeholder: "frm_...",
        description:
            "Copy it from LaunchList → Embed & API. Design and after-signup are set there.",
        hidden: (p: LaunchListProps) => (p.show ?? "form") !== "form",
    },
    widget: {
        type: ControlType.Enum,
        title: "Widget",
        options: ["counter", "leaderboard", "milestone", "countdown"],
        optionTitles: [
            "Signup counter",
            "Leaderboard",
            "Milestone",
            "Countdown",
        ],
        defaultValue: "counter",
        hidden: (p: LaunchListProps) => p.show !== "widget",
    },
    project: {
        type: ControlType.String,
        title: "Project",
        placeholder: "acme",
        description: "Your project's public name in LaunchList.",
        hidden: (p: LaunchListProps) => (p.show ?? "form") === "form",
    },
})
