// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useState } from "react"

interface CollectedField {
    name: string
    value: string
}

interface URLParamsCollectorProps {
    active: boolean
}

/**
 * Collects every piece of URL data available on the page — the current URL,
 * the referrer URL, and every query parameter (including all UTM tags) — and
 * renders each one as a hidden <input>. Unlike the configurable URL Params
 * Collector, this has no field controls: it tracks everything by default so it
 * can be dropped into a Framer form and have its values submitted as-is.
 *
 * The "Active" toggle turns collection on/off — when off, it renders nothing at
 * runtime (no hidden inputs, nothing submitted).
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function URLParamsCollector(props: URLParamsCollectorProps) {
    const { active = true } = props
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [fields, setFields] = useState<CollectedField[]>([])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!active) {
            setFields([])
            return
        }

        const collected: CollectedField[] = []

        // Current URL
        collected.push({ name: "URL", value: window.location.href })

        // Page name: "home" for the root path, otherwise the current slug
        // (e.g. "/" -> "home", "/blog" -> "blog", "/blog/post" -> "blog/post")
        const path = window.location.pathname.replace(/^\/+|\/+$/g, "")
        collected.push({ name: "page", value: path === "" ? "home" : path })

        // Referrer URL
        if (typeof document !== "undefined" && document.referrer) {
            collected.push({ name: "referrer", value: document.referrer })
        }

        // Every query parameter (this includes all utm_* tags)
        const queryParams = new URLSearchParams(window.location.search)
        queryParams.forEach((value, key) => {
            collected.push({ name: key, value })
        })

        setFields(collected)
    }, [active])

    // On the canvas, show a labeled placeholder so the component is locatable.
    // Styled to match Framer's default form inputs — see the canonical
    // "Framer form-input style" block in CLAUDE.md (kept in sync by hand because
    // Framer code components are single-file and cannot share a module).
    if (isCanvas) {
        return (
            <div
                style={{
                    backgroundColor: "#F5F5F5",
                    border: "1px solid rgba(136, 136, 136, 0.1)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    boxSizing: "border-box",
                    fontFamily: "Inter",
                    fontWeight: 500,
                    fontSize: 14,
                    color: "#999999",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    width: "100%",
                    height: "100%",
                }}
            >
                <span>URL Params Collector</span>
                <span style={{ opacity: 0.7 }}>
                    Tracks every URL, query & UTM tag
                </span>
            </div>
        )
    }

    if (!active) return null

    return (
        <div style={{ display: "none" }}>
            {fields.map((field) => (
                <input
                    key={field.name}
                    type="hidden"
                    name={field.name}
                    value={field.value}
                    readOnly
                />
            ))}
        </div>
    )
}

URLParamsCollector.displayName = "URL Params Collector"

URLParamsCollector.defaultProps = {
    active: true,
}

addPropertyControls(URLParamsCollector, {
    active: {
        type: ControlType.Boolean,
        title: "Track URLs",
        defaultValue: true,
    },
})
