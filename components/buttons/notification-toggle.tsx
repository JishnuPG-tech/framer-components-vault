import {
    useEffect,
    useState,
    type CSSProperties,
    type KeyboardEvent,
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


interface NotificationToggleProps {
    label: string
    defaultToggled: boolean
    enabledTrackColor: string
    disabledTrackColor: string
    thumbColor: string
    labelColor: string
    font: CSSProperties
    trackWidth: number
    trackHeight: number
    thumbInset: number
    gap: number
    disabled: boolean
    link: string
    openInNewTab: boolean
    onTap?: () => void
    style?: CSSProperties
}

/**
 * Notification Toggle
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 48
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function NotificationToggle(props: NotificationToggleProps) {
    const {
        label = "Enable notifications",
        defaultToggled = true,
        enabledTrackColor = "#0A84FF",
        disabledTrackColor = "#4A4A4A",
        thumbColor = "#FFFFFF",
        labelColor = "#FFFFFF",
        font,
        trackWidth = 80,
        trackHeight = 40,
        thumbInset = 4,
        gap = 26,
        disabled = false,
        link = "",
        openInNewTab = false,
        onTap,
        style,
    } = props

    const [toggled, setToggled] = useState(defaultToggled)
    const isStatic = useIsStaticRenderer()
    const safeHeight = Math.max(trackHeight, 16)
    const safeWidth = Math.max(trackWidth, safeHeight)
    const safeInset = Math.min(Math.max(thumbInset, 0), safeHeight / 2 - 1)
    const thumbSize = Math.max(safeHeight - safeInset * 2, 2)

    useEffect(() => {
        setToggled(defaultToggled)
    }, [defaultToggled])

    function activate() {
        if (disabled || isStatic) return

        setToggled((current) => !current)
        onTap?.()

        if (link && typeof window !== "undefined") {
            if (openInNewTab) window.open(link, "_blank", "noopener,noreferrer")
            else window.location.assign(link)
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            activate()
        }
    }

    return (
        <button
            type="button"
            role="switch"
            aria-checked={toggled}
            aria-label={label}
            disabled={disabled}
            onClick={activate}
            onKeyDown={handleKeyDown}
            style={{
                ...style,
                position: "relative",
                width: style?.width === "100%" ? "100%" : "max-content",
                minWidth: "max-content",
                minHeight: safeHeight,
                display: "flex",
                alignItems: "center",
                gap,
                padding: 0,
                margin: 0,
                border: "none",
                background: "transparent",
                color: labelColor,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.5 : 1,
                textAlign: "left",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <span
                aria-hidden="true"
                style={{
                    position: "relative",
                    flex: "0 0 auto",
                    width: safeWidth,
                    height: safeHeight,
                    borderRadius: safeHeight / 2,
                    background: toggled
                        ? enabledTrackColor
                        : disabledTrackColor,
                    transition: "background-color 180ms ease",
                }}
            >
                <span
                    style={{
                        position: "absolute",
                        top: safeInset,
                        left: toggled
                            ? safeWidth - thumbSize - safeInset
                            : safeInset,
                        width: thumbSize,
                        height: thumbSize,
                        borderRadius: "50%",
                        background: thumbColor,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.18)",
                        transition: "left 180ms ease",
                    }}
                />
            </span>
            <span style={{ ...font, color: labelColor, whiteSpace: "nowrap" }}>
                {label}
            </span>
        </button>
    )
}

addPropertyControls(NotificationToggle, {
    label: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Enable notifications",
    },
    defaultToggled: {
        type: ControlType.Boolean,
        title: "Default State",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enabledTrackColor: {
        type: ControlType.Color,
        title: "On Color",
        defaultValue: "#0A84FF",
    },
    disabledTrackColor: {
        type: ControlType.Color,
        title: "Off Color",
        defaultValue: "#4A4A4A",
    },
    thumbColor: {
        type: ControlType.Color,
        title: "Thumb Color",
        defaultValue: "#FFFFFF",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 28,
            variant: "Regular",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    trackWidth: {
        type: ControlType.Number,
        title: "Toggle Width",
        defaultValue: 80,
        min: 24,
        max: 200,
        step: 1,
        unit: "px",
    },
    trackHeight: {
        type: ControlType.Number,
        title: "Toggle Height",
        defaultValue: 40,
        min: 16,
        max: 120,
        step: 1,
        unit: "px",
    },
    thumbInset: {
        type: ControlType.Number,
        title: "Thumb Inset",
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Text Gap",
        defaultValue: 26,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: false,
        hidden: ({ link }) => !link,
    },
    onTap: {
        type: ControlType.EventHandler,
        title: "On Toggle",
    },
})
