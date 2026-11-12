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


// User request: remove hover lift, fix hover fill + tooltip with React state-based hover/focus behavior, overhaul built-in icon library to a consistent 24x24 stroke style set, add icon stroke width control, keep SocialIconsBar default export and existing configurability/backwards compatibility.

const ICON_LIBRARY = [
    "TwitterX",
    "Instagram",
    "Facebook",
    "LinkedIn",
    "YouTube",
    "GitHub",
    "TikTok",
    "Discord",
    "Dribbble",
    "Behance",
    "Pinterest",
    "Reddit",
    "Email",
    "Phone",
    "Globe",
    "Home",
    "User",
    "Users",
    "Settings",
    "Search",
    "Menu",
    "Heart",
    "Star",
    "Check",
    "Close",
    "Plus",
    "Minus",
    "Bell",
    "Message",
    "Calendar",
    "Clock",
    "Location",
    "Cart",
    "Bag",
    "CreditCard",
    "Download",
    "Upload",
    "Share",
    "Link",
    "Lock",
    "Unlock",
    "Camera",
    "Image",
    "Play",
    "Pause",
    "ChevronDown",
    "ChevronUp",
    "ChevronLeft",
    "ChevronRight",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ExternalLink",
    "Info",
    "Help",
    "Trash",
    "Edit",
    "Copy",
    "Filter",
] as const

type BuiltInIconName = (typeof ICON_LIBRARY)[number]

interface IconItem {
    iconType: "builtIn" | "upload"
    builtInIcon: BuiltInIconName
    customImage?: { src?: string; srcSet?: string; alt?: string }
    icon?: string
    label: string
    link: string
}

interface MyComponentProps {
    items: IconItem[]
    gap: number
    direction: "horizontal" | "vertical"
    size: number
    iconPadding: number
    iconStrokeWidth: number
    cornerRadius: number
    background: string
    iconColor: string
    hoverBackground: string
    hoverIconColor: string
    borderColor: string
    hoverBorderColor: string
    hoverDuration: number
    hoverEasing: "ease-out" | "ease-in-out" | "linear"
    tooltipBackground: string
    tooltipColor: string
    tooltipPadding: string
    tooltipRadius: number
    tooltipOffset: number
    tooltipDuration: number
    tooltipEasing: "ease-out" | "ease-in-out" | "linear"
    tooltipFont: {
        fontSize?: number | string
        lineHeight?: number | string
        letterSpacing?: number | string
        fontWeight?: number
        fontStyle?: "normal" | "italic"
        fontFamily?: string
        textAlign?: "left" | "center" | "right"
    }
}

const DEFAULT_ITEMS: IconItem[] = [
    {
        iconType: "builtIn",
        builtInIcon: "TwitterX",
        icon: "twitter",
        label: "Twitter / X",
        link: "https://twitter.com",
    },
    {
        iconType: "builtIn",
        builtInIcon: "YouTube",
        icon: "youtube",
        label: "YouTube",
        link: "https://youtube.com",
    },
    {
        iconType: "builtIn",
        builtInIcon: "GitHub",
        icon: "github",
        label: "GitHub",
        link: "https://github.com",
    },
    {
        iconType: "builtIn",
        builtInIcon: "LinkedIn",
        icon: "linkedin",
        label: "LinkedIn",
        link: "https://linkedin.com",
    },
    {
        iconType: "builtIn",
        builtInIcon: "Instagram",
        icon: "instagram",
        label: "Instagram",
        link: "https://instagram.com",
    },
]

function mapLegacyIconName(icon?: string): BuiltInIconName {
    const lookup: Record<string, BuiltInIconName> = {
        twitter: "TwitterX",
        youtube: "YouTube",
        github: "GitHub",
        linkedin: "LinkedIn",
        instagram: "Instagram",
    }
    return lookup[icon ?? ""] ?? "Globe"
}

const ICON_DEFINITIONS: Record<BuiltInIconName, React.ReactNode> = {
    TwitterX: <path d="M5 4l14 16M19 4 5 20" />,
    Instagram: (
        <>
            <rect x="4" y="4" width="16" height="16" rx="4" />
            <circle cx="12" cy="12" r="4" />
            <circle
                cx="17.5"
                cy="6.5"
                r="0.8"
                fill="currentColor"
                stroke="none"
            />
        </>
    ),
    Facebook: (
        <path d="M14 4h-2a4 4 0 0 0-4 4v3H6v4h2v5h4v-5h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    ),
    LinkedIn: (
        <>
            <path d="M8 10v10M8 6v.01M12 10v10m0-6a3 3 0 0 1 6 0v6M4 10h4M12 10h6" />
        </>
    ),
    YouTube: (
        <>
            <rect x="3" y="6.5" width="18" height="11" rx="3" />
            <path d="m10 10 5 2.5-5 2.5z" />
        </>
    ),
    GitHub: (
        <>
            <path d="M9 18c-4 1.2-4-2-6-2m12 4v-3a3 3 0 0 0-.9-2.3c3-.3 5.9-1.4 5.9-6.1A4.8 4.8 0 0 0 18.7 5a4.4 4.4 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6.4 0C6.4 1.5 5.4 1.8 5.4 1.8A4.4 4.4 0 0 0 5.3 5 4.8 4.8 0 0 0 4 8.6c0 4.7 2.9 5.8 5.9 6.1A3 3 0 0 0 9 17v3" />
        </>
    ),
    TikTok: (
        <path d="M14 4v8.5a4.5 4.5 0 1 1-4.5-4.5m4.5-4c1 1.6 2.3 2.6 4 3" />
    ),
    Discord: (
        <>
            <path d="M7 8c3-2 7-2 10 0l1 8c-3 2-7 2-10 0z" />
            <circle cx="10" cy="13" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="14" cy="13" r="0.8" fill="currentColor" stroke="none" />
        </>
    ),
    Dribbble: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M4 12c3-1 7-1 10 1m-4-8c1 2 2 4 3 7m5-3c-2 0-4 .5-6 2" />
        </>
    ),
    Behance: (
        <path d="M4 9h5a2.5 2.5 0 1 1 0 5H4zm0-5h4.5a2 2 0 1 1 0 4H4zm10 6h6a3 3 0 0 1-6 0 3 3 0 0 1 6 0zM14 6h6" />
    ),
    Pinterest: <path d="M12 20l1-4a5 5 0 1 0-4-4" />,
    Reddit: (
        <>
            <path d="M8 13c1 1 2.5 1.5 4 1.5s3-.5 4-1.5M9 8l1-3 3 1" />
            <circle cx="9" cy="11" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="15" cy="11" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="17.8" cy="8" r="1" />
        </>
    ),
    Email: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </>
    ),
    Phone: (
        <path d="M6.5 4h3l2 4-2 2a13 13 0 0 0 4.5 4.5l2-2 4 2v3C12.5 19 5 11.5 6.5 4Z" />
    ),
    Globe: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </>
    ),
    Home: <path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z" />,
    User: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M5 20a7 7 0 0 1 14 0" />
        </>
    ),
    Users: (
        <>
            <path d="M16 11a3 3 0 1 0-2.5-4.7M3 20a6 6 0 0 1 9-4" />
            <circle cx="10" cy="8" r="4" />
        </>
    ),
    Settings: (
        <>
            <circle cx="12" cy="12" r="3" />
            <path d="m19.4 15 1.1 1.9-2 1.2-1.6-1.4a7.8 7.8 0 0 1-2.2.9L14.2 20H9.8l-.5-2.4a7.8 7.8 0 0 1-2.2-.9l-1.6 1.4-2-1.2L4.6 15a8 8 0 0 1 0-2l-1.1-1.9 2-1.2 1.6 1.4c.7-.4 1.5-.7 2.2-.9L9.8 8h4.4l.5 2.4c.8.2 1.5.5 2.2.9l1.6-1.4 2 1.2-1.1 1.9c.1.7.1 1.3 0 2Z" />
        </>
    ),
    Search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </>
    ),
    Menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    Heart: (
        <path d="m12 20-7-6.5a4.5 4.5 0 0 1 6.4-6.3L12 8l.6-.8a4.5 4.5 0 1 1 6.4 6.3Z" />
    ),
    Star: (
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2l1.1-6.2L3 9.6l6.2-.9Z" />
    ),
    Check: <path d="m5 12 4 4 10-10" />,
    Close: <path d="m6 6 12 12M18 6 6 18" />,
    Plus: <path d="M12 5v14M5 12h14" />,
    Minus: <path d="M5 12h14" />,
    Bell: (
        <>
            <path d="M18 16H6l1-2v-3a5 5 0 0 1 10 0v3z" />
            <path d="M10 20a2 2 0 0 0 4 0" />
        </>
    ),
    Message: <path d="M4 6h16v10H8l-4 3z" />,
    Calendar: (
        <>
            <path d="M7 4v3M17 4v3M4 8h16" />
            <rect x="4" y="6" width="16" height="14" rx="2" />
        </>
    ),
    Clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    Location: (
        <>
            <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
        </>
    ),
    Cart: (
        <>
            <path d="M4 5h2l2.5 10h8l2-7H7" />
            <circle cx="10" cy="20" r="1" />
            <circle cx="17" cy="20" r="1" />
        </>
    ),
    Bag: (
        <>
            <path d="M6 8h12l-1 12H7z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </>
    ),
    CreditCard: (
        <>
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M3 10h18" />
        </>
    ),
    Download: <path d="M12 4v11m0 0 4-4m-4 4-4-4M4 20h16" />,
    Upload: <path d="M12 20V9m0 0 4 4m-4-4-4 4M4 4h16" />,
    Share: (
        <>
            <path d="M8 12 16 8M8 12l8 4" />
            <circle cx="5" cy="12" r="2" />
            <circle cx="19" cy="7" r="2" />
            <circle cx="19" cy="17" r="2" />
        </>
    ),
    Link: (
        <path d="M10 14l4-4m-7 7-2 2a3 3 0 0 1-4-4l3-3a3 3 0 0 1 4 0m3 3 2-2a3 3 0 0 1 4 4l-3 3a3 3 0 0 1-4 0" />
    ),
    Lock: (
        <>
            <rect x="6" y="11" width="12" height="9" rx="1.5" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </>
    ),
    Unlock: (
        <>
            <rect x="6" y="11" width="12" height="9" rx="1.5" />
            <path d="M8 11V8a4 4 0 0 1 8 0" />
        </>
    ),
    Camera: (
        <>
            <path d="M4 8h4l2-2h4l2 2h4v10H4z" />
            <circle cx="12" cy="13" r="3" />
        </>
    ),
    Image: (
        <>
            <rect x="4" y="6" width="16" height="12" rx="1.5" />
            <path d="m4 15 4-4 3 3 3-3 6 6" />
        </>
    ),
    Play: <path d="m9 7 8 5-8 5z" />,
    Pause: <path d="M9 7h3v10H9zm5 0h3v10h-3z" />,
    ChevronDown: <path d="m7 10 5 5 5-5" />,
    ChevronUp: <path d="m7 14 5-5 5 5" />,
    ChevronLeft: <path d="m14 7-5 5 5 5" />,
    ChevronRight: <path d="m10 7 5 5-5 5" />,
    ArrowUp: <path d="M12 20V4m0 0-5 5m5-5 5 5" />,
    ArrowDown: <path d="M12 4v16m0 0-5-5m5 5 5-5" />,
    ArrowLeft: <path d="M20 12H4m0 0 5-5m-5 5 5 5" />,
    ArrowRight: <path d="M4 12h16m0 0-5-5m5 5-5 5" />,
    ExternalLink: <path d="M14 4h6v6M20 4l-9 9M18 13v7H4V6h7" />,
    Info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 17v-5M12 8h.01" />
        </>
    ),
    Help: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.1 9a3 3 0 1 1 5.8 1c-.6 1.2-2.9 1.8-2.9 3M12 17h.01" />
        </>
    ),
    Trash: <path d="M5 7h14M9 7V5h6v2m-8 0 1 13h8l1-13" />,
    Edit: <path d="M4 20h4l10-10-4-4L4 16zm10-12 4 4" />,
    Copy: <path d="M9 9h11v11H9zM4 4h11v11" />,
    Filter: <path d="M4 6h16l-6 7v5l-4 2v-7z" />,
}

function renderBuiltInIcon(
    name: BuiltInIconName,
    pixelSize: number,
    strokeWidth: number
): React.ReactNode {
    return (
        <svg
            width={pixelSize}
            height={pixelSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {ICON_DEFINITIONS[name]}
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SocialIconsBar(props: MyComponentProps) {
    const {
        items = DEFAULT_ITEMS,
        gap = 16,
        direction = "horizontal",
        size = 50,
        iconPadding = 12,
        iconStrokeWidth = 1.8,
        cornerRadius = 999,
        background = "#FFFFFF",
        iconColor = "#000000",
        hoverBackground = "#111111",
        hoverIconColor = "#FFFFFF",
        borderColor = "#EEEEEE",
        hoverBorderColor = "#000000",
        hoverDuration = 0.2,
        hoverEasing = "ease-out",
        tooltipBackground = "#000000",
        tooltipColor = "#FFFFFF",
        tooltipPadding = "8px 12px",
        tooltipRadius = 8,
        tooltipOffset = 10,
        tooltipDuration = 0.15,
        tooltipEasing = "ease-out",
        tooltipFont,
    } = props

    const normalizedItems = React.useMemo(() => {
        return (items?.length ? items : DEFAULT_ITEMS).map((item) => ({
            ...item,
            iconType: item.iconType ?? "builtIn",
            builtInIcon: item.builtInIcon ?? mapLegacyIconName(item.icon),
            label: item.label ?? "Icon",
            link: item.link ?? "",
        }))
    }, [items])

    const iconPixelSize = React.useMemo(
        () => Math.max(12, size - iconPadding * 2),
        [size, iconPadding]
    )
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

    const onItemEnter = React.useCallback((index: number) => {
        React.startTransition(() => setHoveredIndex(index))
    }, [])

    const onItemLeave = React.useCallback(() => {
        React.startTransition(() => setHoveredIndex(null))
    }, [])

    const renderItemIcon = React.useCallback(
        (item: IconItem) => {
            if (item.iconType === "upload" && item.customImage?.src) {
                return (
                    <img
                        src={item.customImage.src}
                        srcSet={item.customImage.srcSet}
                        alt={item.customImage.alt || item.label}
                        style={{
                            width: iconPixelSize,
                            height: iconPixelSize,
                            objectFit: "contain",
                        }}
                    />
                )
            }
            return renderBuiltInIcon(
                item.builtInIcon,
                iconPixelSize,
                iconStrokeWidth
            )
        },
        [iconPixelSize, iconStrokeWidth]
    )

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: direction === "vertical" ? "column" : "row",
                alignItems: "center",
                gap,
                overflow: "visible",
            }}
        >
            {normalizedItems.map((item, i) => {
                const isHovered = hoveredIndex === i
                return (
                    <a
                        key={`${item.label}-${i}`}
                        href={item.link || undefined}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.label}
                        onMouseEnter={() => onItemEnter(i)}
                        onMouseLeave={onItemLeave}
                        onFocus={() => onItemEnter(i)}
                        onBlur={onItemLeave}
                        style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            textDecoration: "none",
                            cursor: "pointer",
                            outline: "none",
                            overflow: "visible",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                bottom: "100%",
                                marginBottom: tooltipOffset,
                                padding: tooltipPadding,
                                borderRadius: tooltipRadius,
                                background: tooltipBackground,
                                color: tooltipColor,
                                whiteSpace: "nowrap",
                                pointerEvents: "none",
                                opacity: isHovered ? 1 : 0,
                                transform: isHovered
                                    ? "translateY(0) scale(1)"
                                    : "translateY(8px) scale(0.98)",
                                transition: `opacity ${tooltipDuration}s ${tooltipEasing}, transform ${tooltipDuration}s ${tooltipEasing}`,
                                fontSize: tooltipFont?.fontSize,
                                lineHeight: tooltipFont?.lineHeight,
                                letterSpacing: tooltipFont?.letterSpacing,
                                fontWeight: tooltipFont?.fontWeight,
                                fontStyle: tooltipFont?.fontStyle,
                                fontFamily: tooltipFont?.fontFamily,
                                textAlign: tooltipFont?.textAlign,
                            }}
                        >
                            {item.label}
                        </div>
                        <div
                            style={{
                                position: "relative",
                                width: size,
                                height: size,
                                padding: iconPadding,
                                borderRadius: cornerRadius,
                                border: `1px solid ${isHovered ? hoverBorderColor : borderColor}`,
                                color: isHovered ? hoverIconColor : iconColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                transition: `border-color ${hoverDuration}s ${hoverEasing}, color ${hoverDuration}s ${hoverEasing}`,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background,
                                    zIndex: 0,
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    background: hoverBackground,
                                    transform: isHovered
                                        ? "translateY(0%)"
                                        : "translateY(100%)",
                                    transition: `transform ${hoverDuration}s ${hoverEasing}`,
                                    zIndex: 1,
                                }}
                            />
                            <span
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {renderItemIcon(item)}
                            </span>
                        </div>
                    </a>
                )
            })}
        </div>
    )
}

addPropertyControls(SocialIconsBar, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                iconType: {
                    type: ControlType.Enum,
                    title: "Icon Type",
                    options: ["builtIn", "upload"],
                    optionTitles: ["Built-in Icon", "Upload Image/SVG"],
                    defaultValue: "builtIn",
                },
                builtInIcon: {
                    type: ControlType.Enum,
                    title: "Built-in Icon",
                    options: [...ICON_LIBRARY],
                    optionTitles: [...ICON_LIBRARY],
                    defaultValue: "Globe",
                    hidden: (value: IconItem) => value.iconType === "upload",
                },
                customImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Custom Image",
                    hidden: (value: IconItem) => value.iconType !== "upload",
                },
                label: {
                    type: ControlType.String,
                    title: "Tooltip Text",
                    defaultValue: "Icon",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link URL",
                    defaultValue: "https://example.com",
                },
                icon: {
                    type: ControlType.String,
                    title: "Legacy Icon Key",
                    defaultValue: "",
                    hidden: () => true,
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    size: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 24,
        max: 140,
        defaultValue: 50,
    },
    iconPadding: {
        type: ControlType.Number,
        title: "Icon Padding",
        min: 0,
        max: 30,
        defaultValue: 12,
    },
    iconStrokeWidth: {
        type: ControlType.Number,
        title: "Icon Stroke Width",
        min: 1,
        max: 3,
        step: 0.1,
        defaultValue: 1.8,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 999,
        defaultValue: 999,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 80,
        defaultValue: 16,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Color",
        defaultValue: "#000000",
    },
    hoverBackground: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: "#111111",
    },
    hoverIconColor: {
        type: ControlType.Color,
        title: "Hover Icon",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Hover Border",
        defaultValue: "#000000",
    },
    hoverDuration: {
        type: ControlType.Number,
        title: "Hover Duration",
        min: 0.05,
        max: 1,
        step: 0.01,
        defaultValue: 0.2,
    },
    hoverEasing: {
        type: ControlType.Enum,
        title: "Hover Easing",
        options: ["ease-out", "ease-in-out", "linear"],
        optionTitles: ["Ease Out", "Ease In Out", "Linear"],
        defaultValue: "ease-out",
    },
    tooltipBackground: {
        type: ControlType.Color,
        title: "Tooltip BG",
        defaultValue: "#000000",
    },
    tooltipColor: {
        type: ControlType.Color,
        title: "Tooltip Text",
        defaultValue: "#FFFFFF",
    },
    tooltipPadding: {
        type: ControlType.Padding,
        title: "Tooltip Padding",
        defaultValue: "8px 12px",
    },
    tooltipRadius: {
        type: ControlType.Number,
        title: "Tooltip Radius",
        min: 0,
        max: 40,
        defaultValue: 8,
    },
    tooltipOffset: {
        type: ControlType.Number,
        title: "Tooltip Offset",
        min: 0,
        max: 40,
        defaultValue: 10,
    },
    tooltipDuration: {
        type: ControlType.Number,
        title: "Tooltip Duration",
        min: 0.05,
        max: 1,
        step: 0.01,
        defaultValue: 0.15,
    },
    tooltipEasing: {
        type: ControlType.Enum,
        title: "Tooltip Easing",
        options: ["ease-out", "ease-in-out", "linear"],
        optionTitles: ["Ease Out", "Ease In Out", "Linear"],
        defaultValue: "ease-out",
    },
    tooltipFont: {
        type: ControlType.Font,
        title: "Tooltip Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
})
