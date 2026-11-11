// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Props {
    googlePlayUrl: string
    appStoreUrl: string
    macAppStoreUrl: string
    microsoftStoreUrl: string
    chromeStoreUrl: string
    webAppUrl: string
    showGooglePlay: boolean
    showAppStore: boolean
    showMacAppStore: boolean
    showMicrosoftStore: boolean
    showChromeStore: boolean
    showWebApp: boolean
    layout: "horizontal" | "vertical"
    size: "small" | "medium" | "large"
    gap: number
    backgroundColor: string
    textColor: string
    mutedColor: string
    borderColor: string
    borderRadius: number
    showBorder: boolean
    fullWidth: boolean
    font: any
}

export default function AppStoreButtons(props: Props) {
    const sizeMap = {
        small: {
            padding: "8px 14px",
            iconSize: 18,
            smallText: 11,
            largeText: 13,
            minWidth: 130,
            gap: 8,
        },
        medium: {
            padding: "12px 18px",
            iconSize: 22,
            smallText: 14,
            largeText: 16,
            minWidth: 160,
            gap: 12,
        },
        large: {
            padding: "16px 24px",
            iconSize: 28,
            smallText: 15,
            largeText: 18,
            minWidth: 200,
            gap: 14,
        },
    }

    const s = sizeMap[props.size]
    const c = props.textColor

    const playIcon = (
        <svg
            width={s.iconSize}
            height={s.iconSize}
            viewBox="0 0 512 512"
            fill={c}
        >
            <path d="M325.3 234.3 104.4 13.4l280.8 161.7zM47.6 0C34.6 6.8 26 19.2 26 35.4v441.2c0 16.2 8.6 28.6 21.6 35.4l256.6-256zM464.8 223.5l-58.6-34-65.8 64.5 65.8 64.5 60-34c19.6-15.4 19.6-45.6-1.4-61zM104.4 498.6l280.8-161.7-59.9-59.9z" />
        </svg>
    )

    const appleIcon = (
        <svg
            width={s.iconSize}
            height={s.iconSize}
            viewBox="0 0 384 512"
            fill={c}
        >
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
        </svg>
    )

    const microsoftIcon = (
        <svg
            width={s.iconSize}
            height={s.iconSize}
            viewBox="0 0 24 24"
            fill={c}
        >
            <path d="M2 2h9.5v9.5H2V2zm10.5 0H22v9.5h-9.5V2zM2 12.5h9.5V22H2v-9.5zm10.5 0H22V22h-9.5v-9.5z" />
        </svg>
    )

    const chromeIcon = (
        <svg
            width={s.iconSize}
            height={s.iconSize}
            viewBox="0 0 24 24"
            fill={c}
        >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c2.21 0 4.21.9 5.66 2.34L12 14H4.07C4.93 9.86 8.13 6.7 12 6zm-7.93 8H10l-3.79 6.56C4.86 18.86 4 16.53 4 14c0-.34.02-.67.07-1zm9.51 5.93L9.79 14h7.93c-.86 4.14-4.06 7.3-7.93 8 .59-.65 1.07-1.4 1.79-2.07zM18 14h-3.79l4.07-7.05C19.51 8.55 20 10.22 20 12c0 .68-.07 1.34-.2 1.97L18 14z" />
        </svg>
    )

    const webIcon = (
        <svg
            width={s.iconSize}
            height={s.iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke={c}
            strokeWidth="2"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
        </svg>
    )

    const buttons = [
        {
            show: props.showGooglePlay,
            url: props.googlePlayUrl,
            small: "Get it on",
            large: "Google Play",
            icon: playIcon,
        },
        {
            show: props.showAppStore,
            url: props.appStoreUrl,
            small: "Download on the",
            large: "App Store",
            icon: appleIcon,
        },
        {
            show: props.showMacAppStore,
            url: props.macAppStoreUrl,
            small: "Download on the",
            large: "Mac App Store",
            icon: appleIcon,
        },
        {
            show: props.showMicrosoftStore,
            url: props.microsoftStoreUrl,
            small: "Get it from",
            large: "Microsoft Store",
            icon: microsoftIcon,
        },
        {
            show: props.showChromeStore,
            url: props.chromeStoreUrl,
            small: "Add to",
            large: "Chrome",
            icon: chromeIcon,
        },
        {
            show: props.showWebApp,
            url: props.webAppUrl,
            small: "Open the",
            large: "Web App",
            icon: webIcon,
        },
    ]

    const open = (url: string) => window.open(url, "_blank")

    return (
        <div
            style={{
                display: "flex",
                flexDirection: props.layout === "vertical" ? "column" : "row",
                gap: props.gap,
                flexWrap: "wrap",
                width: "100%",
                ...props.font,
            }}
        >
            {buttons
                .filter((b) => b.show)
                .map((btn, i) => (
                    <div
                        key={i}
                        onClick={() => open(btn.url)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: s.gap,
                            padding: s.padding,
                            background: props.backgroundColor,
                            color: props.textColor,
                            border: props.showBorder
                                ? `1px solid ${props.borderColor}`
                                : "none",
                            borderRadius: props.borderRadius,
                            cursor: "pointer",
                            minWidth: props.fullWidth ? 0 : s.minWidth,
                            flex: props.fullWidth ? 1 : "0 0 auto",
                            justifyContent: props.fullWidth
                                ? "center"
                                : "flex-start",
                            transition: "opacity 0.15s ease",
                            boxSizing: "border-box",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "0.85"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "1"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                flexShrink: 0,
                            }}
                        >
                            {btn.icon}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                lineHeight: 1.3,
                            }}
                        >
                            <span
                                style={{
                                    ...props.font,
                                    fontSize: s.smallText,
                                    fontWeight: 400,
                                    color: props.mutedColor,
                                }}
                            >
                                {btn.small}
                            </span>
                            <span
                                style={{
                                    ...props.font,
                                    fontSize: s.largeText,
                                    fontWeight: 600,
                                    color: props.textColor,
                                }}
                            >
                                {btn.large}
                            </span>
                        </div>
                    </div>
                ))}
        </div>
    )
}

AppStoreButtons.defaultProps = {
    showGooglePlay: true,
    showAppStore: true,
    showMacAppStore: false,
    showMicrosoftStore: false,
    showChromeStore: false,
    showWebApp: false,
    googlePlayUrl: "https://play.google.com",
    appStoreUrl: "https://apps.apple.com",
    macAppStoreUrl: "https://apps.apple.com/us/genre/mac/id39",
    microsoftStoreUrl: "https://apps.microsoft.com",
    chromeStoreUrl: "https://chromewebstore.google.com",
    webAppUrl: "https://example.com/app",
    layout: "horizontal",
    size: "medium",
    gap: 12,
    backgroundColor: "#FFFFFF",
    textColor: "#0A0A0A",
    mutedColor: "#737373",
    borderColor: "#E5E5E5",
    borderRadius: 10,
    showBorder: true,
    fullWidth: false,
}

addPropertyControls(AppStoreButtons, {
    showGooglePlay: { type: ControlType.Boolean, title: "Google Play" },
    googlePlayUrl: {
        type: ControlType.String,
        title: "Play URL",
        hidden: (p: any) => !p.showGooglePlay,
    },
    showAppStore: { type: ControlType.Boolean, title: "App Store" },
    appStoreUrl: {
        type: ControlType.String,
        title: "App Store URL",
        hidden: (p: any) => !p.showAppStore,
    },
    showMacAppStore: { type: ControlType.Boolean, title: "Mac App Store" },
    macAppStoreUrl: {
        type: ControlType.String,
        title: "Mac URL",
        hidden: (p: any) => !p.showMacAppStore,
    },
    showMicrosoftStore: { type: ControlType.Boolean, title: "Microsoft Store" },
    microsoftStoreUrl: {
        type: ControlType.String,
        title: "Microsoft URL",
        hidden: (p: any) => !p.showMicrosoftStore,
    },
    showChromeStore: { type: ControlType.Boolean, title: "Chrome Store" },
    chromeStoreUrl: {
        type: ControlType.String,
        title: "Chrome URL",
        hidden: (p: any) => !p.showChromeStore,
    },
    showWebApp: { type: ControlType.Boolean, title: "Web App" },
    webAppUrl: {
        type: ControlType.String,
        title: "Web App URL",
        hidden: (p: any) => !p.showWebApp,
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["small", "medium", "large"],
        optionTitles: ["Small", "Medium", "Large"],
        displaySegmentedControl: true,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        displaySegmentedControl: true,
    },
    fullWidth: { type: ControlType.Boolean, title: "Full Width" },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 32, step: 1 },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 24,
        step: 1,
    },
    showBorder: { type: ControlType.Boolean, title: "Border" },
    backgroundColor: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text" },
    mutedColor: { type: ControlType.Color, title: "Muted" },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        hidden: (p: any) => !p.showBorder,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            variant: "Regular",
        },
    },
})
