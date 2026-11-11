import { useEffect, useState, useCallback } from "react"
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
 * Livestorm Registration — embed the Livestorm registration form
 * on your own (CMS) page, with automatic UTM passthrough.
 *
 * - formUrl: bind to your `form_url` CMS field in a detail template
 *   (format: https://app.livestorm.co/p/{event-id}/form)
 * - Width drives Livestorm's field layout: a wider frame renders a
 *   multi-column form. Control the layout by resizing the component.
 * - UTM passthrough: utm_* (+ gclid, li_fat_id) from the page URL are
 *   appended to the iframe src, so Livestorm captures the same
 *   attribution as on its hosted landing page. Enable Framer's setting
 *   to persist query parameters across pages for first-touch tracking.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 520
 */
export default function LivestormRegistration(props) {
    const {
        formUrl,
        passParams,
        paramList,
        persistFirstTouch,
        iframeTitle,
        placeholderText,
        style,
    } = props

    const [src, setSrc] = useState<string | null>(null)
    const [loaded, setLoaded] = useState(false)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    useEffect(() => {
        if (isCanvas) return
        if (!formUrl) {
            setSrc(null)
            return
        }
        let url: URL
        try {
            url = new URL(formUrl)
        } catch {
            setSrc(null)
            return
        }

        if (passParams) {
            const allowed = (paramList || "")
                .split(",")
                .map((p: string) => p.trim().toLowerCase())
                .filter(Boolean)

            // Empty list = forward every parameter (deliberate opt-in);
            // the default list keeps it to tracking parameters only.
            const matches = (key: string) => {
                if (allowed.length === 0) return true
                const k = key.toLowerCase()
                return allowed.some((a) =>
                    a.endsWith("*") ? k.startsWith(a.slice(0, -1)) : k === a
                )
            }

            const collected = new Map<string, string>()

            // 1) Optional first-touch from sessionStorage (fallback when
            //    Framer's query parameter persistence is disabled)
            if (persistFirstTouch) {
                try {
                    const stored = sessionStorage.getItem("ls_first_touch")
                    if (stored) {
                        const parsed = new URLSearchParams(stored)
                        parsed.forEach((v, k) => {
                            if (matches(k)) collected.set(k, v)
                        })
                    }
                } catch {
                    /* sessionStorage unavailable; ignore */
                }
            }

            // 2) Current page parameters win over stored values
            const page = new URLSearchParams(window.location.search)
            let hasTracking = false
            page.forEach((v, k) => {
                if (matches(k)) {
                    collected.set(k, v)
                    hasTracking = true
                }
            })

            // 3) Store first touch on the first visit that carries params
            if (persistFirstTouch && hasTracking) {
                try {
                    if (!sessionStorage.getItem("ls_first_touch")) {
                        const toStore = new URLSearchParams()
                        collected.forEach((v, k) => toStore.set(k, v))
                        sessionStorage.setItem(
                            "ls_first_touch",
                            toStore.toString()
                        )
                    }
                } catch {
                    /* ignore */
                }
            }

            collected.forEach((v, k) => url.searchParams.set(k, v))
        }

        setLoaded(false)
        setSrc(url.toString())
    }, [formUrl, passParams, paramList, persistFirstTouch, isCanvas])

    const onLoad = useCallback(() => setLoaded(true), [])

    // A cross-origin iframe has no measurable intrinsic height, so
    // "fit content" sizing would collapse to zero. The hardcoded
    // fallback keeps the component visible in that case; fixed or
    // fill sizing passed by Framer via `style` always takes over.
    const base: React.CSSProperties = {
        width: "100%",
        height: 620,
        position: "relative",
        overflow: "hidden",
        ...style,
    }

    // Canvas preview: never load the external iframe in the editor
    if (isCanvas) {
        return (
            <div style={{ ...base, ...placeholderStyle }}>
                <div style={badgeStyle} aria-hidden="true">
                    LS
                </div>
                <p style={placeholderTitleStyle}>Livestorm registration</p>
                <p style={placeholderBodyStyle}>
                    {formUrl
                        ? "The form loads on your published site and in preview."
                        : "Bind the Form URL property to your CMS field."}
                </p>
            </div>
        )
    }

    // No (valid) URL on the live site: show a quiet fallback
    if (!src) {
        return (
            <div style={{ ...base, ...placeholderStyle }} role="status">
                <p style={placeholderBodyStyle}>
                    {placeholderText ||
                        "Registration is currently unavailable."}
                </p>
            </div>
        )
    }

    return (
        <div style={base}>
            {!loaded && (
                <div
                    style={{
                        ...placeholderStyle,
                        position: "absolute",
                        inset: 0,
                    }}
                    role="status"
                    aria-label="Loading registration form"
                >
                    <p style={placeholderBodyStyle}>Loading…</p>
                </div>
            )}
            <iframe
                src={src}
                title={iframeTitle || "Webinar registration"}
                loading="lazy"
                onLoad={onLoad}
                style={{
                    width: "100%",
                    height: "100%",
                    border: 0,
                    display: "block",
                    opacity: loaded ? 1 : 0,
                    transition: "opacity 200ms ease",
                }}
                allow="fullscreen"
            />
        </div>
    )
}

const placeholderStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
    background: "rgba(0, 0, 0, 0.04)",
    borderRadius: 8,
    textAlign: "center",
}

const badgeStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 8,
    background: "rgba(0, 0, 0, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
}

const placeholderTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
}

const placeholderBodyStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 12,
    opacity: 0.7,
}

addPropertyControls(LivestormRegistration, {
    formUrl: {
        type: ControlType.String,
        title: "Form URL",
        placeholder: "https://app.livestorm.co/p/…/form",
        description: "Bind to the CMS field holding your Livestorm form URL.",
    },
    passParams: {
        type: ControlType.Boolean,
        title: "UTM passthrough",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    paramList: {
        type: ControlType.String,
        title: "Parameters",
        defaultValue: "utm_*, gclid, li_fat_id",
        description:
            "Comma-separated; * as wildcard suffix. Leave empty to forward all parameters.",
        hidden: (props) => !props.passParams,
    },
    persistFirstTouch: {
        type: ControlType.Boolean,
        title: "First-touch fallback",
        defaultValue: false,
        description:
            "Store tracking parameters in sessionStorage. Only needed when Framer's query parameter persistence is disabled.",
        hidden: (props) => !props.passParams,
    },
    iframeTitle: {
        type: ControlType.String,
        title: "Iframe title",
        defaultValue: "Webinar registration",
        description: "Announced by screen readers.",
    },
    placeholderText: {
        type: ControlType.String,
        title: "Fallback text",
        defaultValue: "Registration is currently unavailable.",
    },
})
