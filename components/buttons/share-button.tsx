import {
    useState,
    useCallback,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type SourceType = "pageUrl" | "customTextUrl" | "customImageUrl"
type IconVariant = "share" | "ios_share"

interface ShareButtonProps {
    source: SourceType
    value: string
    imageUrl: string
    label: string
    showShareIcon: boolean
    iconVariant: IconVariant
    transition: "none" | "fade"
    fadeDurationMs: number
    padding: number
    align: "left" | "center" | "right"
    radius: number
    font: any
    textColor: string
    bgColor: string
    borderColor: string
    borderWidth: number
    hoverTextColor: string
    hoverBgColor: string
    hoverBorderColor: string
    style?: CSSProperties
}

export default function ShareButton(props: ShareButtonProps) {
    const {
        source,
        value,
        imageUrl,
        label,
        showShareIcon,
        iconVariant,
        transition,
        fadeDurationMs,
        padding,
        align,
        radius,
        font,
        textColor,
        bgColor,
        borderColor,
        borderWidth,
        hoverTextColor,
        hoverBgColor,
        hoverBorderColor,
        style,
    } = props

    type UIState = "idle" | "hover"
    const [state, setState] = useState<UIState>("idle")

    const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const fading = transition === "fade" && !reduceMotion

    const isHover = state === "hover"
    const palette = isHover
        ? { color: hoverTextColor, bg: hoverBgColor, border: hoverBorderColor }
        : { color: textColor, bg: bgColor, border: borderColor }

    const justifyItems =
        align === "left" ? "start" : align === "right" ? "end" : "center"

    const fontSize = parseFloat(props?.font?.fontSize ?? "14") || 14
    const lineHeight = (() => {
        const lh = props?.font?.lineHeight
        if (typeof lh === "number") return lh
        if (typeof lh === "string") {
            const n = parseFloat(lh)
            if (!isNaN(n)) return n
        }
        return 1.5
    })()
    const minContentHeight = Math.max(32, fontSize * lineHeight)

    const btnStyle: CSSProperties = {
        ...style,
        display: "inline-grid",
        gridAutoFlow: "row",
        placeItems: `center ${justifyItems}`,
        position: "relative",
        padding: `${padding}px`,
        borderRadius: radius,
        border: `${borderWidth}px solid ${palette.border}`,
        backgroundColor: palette.bg,
        color: palette.color,
        cursor: "pointer",
        userSelect: "none",
        outline: "none",
        minHeight: minContentHeight,
        ...font,
        transition: fading
            ? `background-color ${fadeDurationMs}ms, color ${fadeDurationMs}ms, border-color ${fadeDurationMs}ms`
            : undefined,
    }

    const looksLikeUrl = (s: string) =>
        /^(https?|blob|data):\/\//i.test((s || "").trim())

    const handleShare = useCallback(async () => {
        if (!navigator?.share) return

        const pageUrl =
            typeof window !== "undefined" ? window.location.href : ""
        const pageTitle = typeof document !== "undefined" ? document.title : ""

        let payload: ShareData | null = null

        if (source === "pageUrl") {
            payload = { url: pageUrl, title: pageTitle }
        } else if (source === "customTextUrl") {
            const v = (value || "").trim()
            if (!v) return
            payload = looksLikeUrl(v) ? { url: v } : { text: v }
        } else if (source === "customImageUrl") {
            const u = (imageUrl || "").trim()
            if (!u) return

            try {
                const res = await fetch(u, { mode: "cors" })
                const blob = await res.blob()
                const mime = blob.type || "image/png"
                const ext = mime.split("/")[1] || "png"
                const file = new File([blob], `share.${ext}`, { type: mime })
                const shareData: ShareData = { files: [file] as any }

                if (navigator.canShare?.(shareData)) {
                    await navigator.share(shareData)
                    return
                }
            } catch {}

            await navigator.share({ url: u })
        }

        if (payload && "text" in payload) {
            delete (payload as any).title
            delete (payload as any).url
            delete (payload as any).files
        }

        try {
            await navigator.share(payload!)
        } catch {}
    }, [source, value, imageUrl])

    const Icon = showShareIcon ? (
        iconVariant === "ios_share" ? (
            <svg
                width="1.2em"
                height="1.2em"
                viewBox="0 0 50 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ display: "block" }}
            >
                <path d="M25 5 L25 30" />
                <path d="M18 12 L25 5 L32 12" />
                <path d="M14 24 a4 4 0 0 1 4 -4 H20" />
                <path d="M14 24 V38 a4 4 0 0 0 4 4 H32 a4 4 0 0 0 4 -4 V24" />
                <path d="M30 20 H32 a4 4 0 0 1 4 4" />
            </svg>
        ) : (
            <svg
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ display: "block" }}
            >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.6 13.6l6.8 3.9" />
                <path d="M15.4 6.5L8.6 10.4" />
            </svg>
        )
    ) : null

    if (RenderTarget.current() === RenderTarget.thumbnail) return null

    return (
        <button
            type="button"
            aria-label={label}
            style={btnStyle}
            onMouseEnter={() => startTransition(() => setState("hover"))}
            onMouseLeave={() => startTransition(() => setState("idle"))}
            onFocus={() => startTransition(() => setState("hover"))}
            onBlur={() => startTransition(() => setState("idle"))}
            onClick={handleShare}
        >
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    pointerEvents: "none",
                    transition: fading
                        ? `opacity ${fadeDurationMs}ms`
                        : undefined,
                }}
            >
                {Icon}
                <span>{label}</span>
            </span>
        </button>
    )
}

addPropertyControls(ShareButton, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        options: ["pageUrl", "customTextUrl", "customImageUrl"],
        optionTitles: ["Page URL", "Custom Text/URL", "Custom Image URL"],
        defaultValue: "pageUrl",
    },
    value: {
        type: ControlType.String,
        title: "Value",
        defaultValue: "",
        placeholder: "https://example.com  •  or custom text…",
        hidden: ({ source }: { source: SourceType }) =>
            source !== "customTextUrl",
        description:
            "Shares a link if it looks like a URL (http/https), otherwise plain text.",
    },
    imageUrl: {
        type: ControlType.Image,
        title: "Image",
        hidden: ({ source }: { source: SourceType }) =>
            source !== "customImageUrl",
        description: "Upload an image, the generated URL will be shared.",
    },
    label: { type: ControlType.String, title: "Label", defaultValue: "Share" },
    showShareIcon: {
        type: ControlType.Boolean,
        title: "Show Icon",
        defaultValue: true,
    },
    iconVariant: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["share", "ios_share"],
        optionTitles: ["Share", "iOS Share"],
        defaultValue: "ios_share",
        hidden: ({ showShareIcon }: { showShareIcon: boolean }) =>
            !showShareIcon,
    },
    transition: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["none", "fade"],
        optionTitles: ["None", "Fade"],
        defaultValue: "fade",
        description: "Set a transition for hover state.",
    },
    fadeDurationMs: {
        type: ControlType.Number,
        title: "Fade Duration (ms)",
        defaultValue: 180,
        min: 60,
        max: 5000,
        step: 10,
        hidden: ({ transition }: { transition: string }) =>
            transition !== "fade",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 12,
        min: 0,
        max: 128,
        step: 1,
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 10,
        min: 0,
        max: 128,
        step: 1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            lineHeight: "1.5em",
            letterSpacing: "0em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#111827",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F3F4F6",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#E5E7EB",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 1,
        min: 0,
        max: 16,
        step: 1,
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#1F2937",
    },
    hoverBgColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#E5E7EB",
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Hover Border",
        defaultValue: "#D1D5DB",
        description: "An out of storage component.",
    },
})
