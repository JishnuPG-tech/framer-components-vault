import React, { useEffect, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

function isValidWidgetUrl(value: string) {
    try {
        const url = new URL(value)

        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

        return (
            url.protocol === "https:" &&
            url.hostname === "embed.reveula.com" &&
            uuidRegex.test(url.pathname.replace("/widget/", "")) &&
            url.pathname.startsWith("/widget/") &&
            !url.search &&
            !url.hash
        )
    } catch {
        return false
    }
}

export default function ReveulaWidget({ widgetUrl, padding }) {
    const [isInvalid, setIsInvalid] = useState(false)

    useEffect(() => {
        if (!widgetUrl) {
            setIsInvalid(false)
            return
        }

        if (!isValidWidgetUrl(widgetUrl)) {
            setIsInvalid(true)
            return
        }

        setIsInvalid(false)

        const url = new URL(widgetUrl)
        const scriptSrc = `${url.origin}${url.pathname}/embed.js`

        // Prevent duplicate script injection
        if (document.querySelector(`script[src="${scriptSrc}"]`)) return

        const script = document.createElement("script")
        script.src = scriptSrc
        script.async = true

        document.body.appendChild(script)

        return () => {
            script.remove()
        }
    }, [widgetUrl])

    // No URL provided
    if (!widgetUrl) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "80px",
                    padding: "20px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    textAlign: "center",
                    boxSizing: "border-box",
                }}
            >
                Please provide a Widget URL in the property controls.
            </div>
        )
    }

    // Invalid URL
    if (isInvalid) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    minHeight: "100px",
                    padding: "20px",
                    borderRadius: "8px",
                    background: "#fff5f5",
                    color: "#c92a2a",
                    fontSize: "14px",
                    textAlign: "center",
                    boxSizing: "border-box",
                    gap: "6px",
                }}
            >
                <strong>Invalid Widget URL</strong>

                <span>Use a valid Reveula Widget URL, for example:</span>

                <code
                    style={{
                        fontSize: "12px",
                        wordBreak: "break-all",
                    }}
                >
                    https://embed.reveula.com/widget/your-widget-id
                </code>
            </div>
        )
    }

    const widgetId = widgetUrl.split("/").pop()

    return (
        <div
            data-widget-id={widgetId}
            style={{
                display: "block",
                width: "100%",
                height: "100%",
                padding,
                boxSizing: "border-box",
            }}
        />
    )
}

addPropertyControls(ReveulaWidget, {
    widgetUrl: {
        title: "Widget URL",
        type: ControlType.String,
        placeholder:
            "https://embed.reveula.com/widget/01a0b0c2-3ee2-7e60-ad8d...",
    },
    padding: {
        title: "Padding",
        type: ControlType.Padding,
        defaultValue: "0px",
    },
})
